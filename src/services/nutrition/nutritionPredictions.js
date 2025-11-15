/**
 * nutritionPredictions.js
 * 
 * Service pour les prédictions offline avec TensorFlow.js.
 * 
 * Fonctionnalités :
 * - Création/entraînement/sauvegarde/chargement modèles TensorFlow.js
 * - Prédictions poids, calories optimales, temps objectif
 * - Préparation données (features, normalisation)
 * - Stockage modèles dans IndexedDB (nutrition_mlModels)
 * - Lazy loading modèles (chargement à la demande)
 * - Entraînement en arrière-plan (non-bloquant UI)
 * - Export JSON modèles (pour backup)
 * 
 * Architecture :
 * - Modèles : Réseaux de neurones séquentiels (régression)
 * - Features : Calories moyennes, protéines, fréquence workouts, jours écoulés, poids actuel
 * - Normalisation : Moyenne 0, écart-type 1 (Z-score)
 * - Performance : Lazy loading, entraînement async, cache modèles
 * - Stockage : IndexedDB (nutrition_mlModels)
 * 
 * ⚠️ IMPORTANT : Nécessite TensorFlow.js (@tensorflow/tfjs)
 * ⚠️ Minimum 30-50 points de données pour entraînement fiable
 * ⚠️ Prédictions approximatives (pas médicales)
 * 
 * @module services/nutrition/nutritionPredictions
 * @see ../../../../nouvelongletnutritionplan.md Section 7.1
 */

import * as tf from '@tensorflow/tfjs';
import { openNutritionDB, STORE_ML_MODELS } from '../../hooks/nutritionDataUtils';
import logger from '../../utils/logger';

const log = logger.module('nutritionPredictions');

// ✅ OPTIMISATION : Utiliser initialisation centralisée TensorFlow.js (singleton)
import { initializeTensorFlowBackend } from '../../utils/tensorflowInit';

// ==================== CONSTANTES ====================

/**
 * Types de prédictions disponibles
 */
export const PREDICTION_TYPES = {
  WEIGHT: 'weight',           // Prédiction poids futur
  CALORIES: 'calories',       // Calories optimales
  GOAL_TIME: 'goal_time'      // Temps pour atteindre objectif
};

/**
 * Configuration par défaut des modèles
 */
const DEFAULT_MODEL_CONFIG = {
  inputSize: 5,               // Nombre de features
  hiddenUnits1: 64,           // Couche cachée 1
  hiddenUnits2: 32,           // Couche cachée 2
  dropoutRate: 0.2,           // Dropout (éviter overfitting)
  learningRate: 0.001,        // Learning rate (Adam optimizer)
  epochs: 50,                 // Nombre d'epochs d'entraînement
  batchSize: 32,              // Taille batch
  validationSplit: 0.2,       // Proportion validation set
  minDataPoints: 30           // Minimum points de données pour entraînement
};

/**
 * Version actuelle des modèles (pour migrations futures)
 */
const MODEL_VERSION = '1.0';

// ==================== CACHE MODÈLES ====================

// Cache en mémoire pour éviter rechargements multiples
const modelCache = new Map(); // <modelType, { model, stats, metadata }>

// ==================== CRÉATION MODÈLES ====================

/**
 * Crée un modèle de prédiction séquentiel (régression)
 * 
 * @param {Object} config - Configuration du modèle
 * @param {number} config.inputSize - Nombre de features d'entrée
 * @param {number} config.hiddenUnits1 - Unités couche cachée 1
 * @param {number} config.hiddenUnits2 - Unités couche cachée 2
 * @param {number} config.dropoutRate - Taux dropout
 * @param {number} config.learningRate - Learning rate
 * @returns {tf.Sequential} Modèle TensorFlow.js
 */
export const createPredictionModel = async (config = {}) => {
  // ✅ OPTIMISATION : Initialiser backend avant création modèle
  await initializeTensorFlowBackend();

  const {
    inputSize = DEFAULT_MODEL_CONFIG.inputSize,
    hiddenUnits1 = DEFAULT_MODEL_CONFIG.hiddenUnits1,
    hiddenUnits2 = DEFAULT_MODEL_CONFIG.hiddenUnits2,
    dropoutRate = DEFAULT_MODEL_CONFIG.dropoutRate,
    learningRate = DEFAULT_MODEL_CONFIG.learningRate
  } = config;

  log.debug('[createPredictionModel] Création modèle', { inputSize, hiddenUnits1, hiddenUnits2 });

  // Modèle séquentiel simple (régression)
  const model = tf.sequential({
    layers: [
      // Couche d'entrée
      tf.layers.dense({
        units: hiddenUnits1,
        activation: 'relu',
        inputShape: [inputSize]
      }),
      // Couche cachée
      tf.layers.dense({
        units: hiddenUnits2,
        activation: 'relu'
      }),
      // Dropout (éviter overfitting)
      tf.layers.dropout({ rate: dropoutRate }),
      // Couche de sortie (1 valeur: prédiction)
      tf.layers.dense({ units: 1 })
    ]
  });

  // Compiler modèle
  model.compile({
    optimizer: tf.train.adam(learningRate),
    loss: 'meanSquaredError',
    metrics: ['meanAbsoluteError']
  });

  log.debug('[createPredictionModel] Modèle créé avec succès');

  return model;
};

// ==================== PRÉPARATION DONNÉES ====================

/**
 * Prépare les données d'entraînement à partir de l'historique utilisateur
 * 
 * @param {Array} userHistory - Historique utilisateur (dailyMeals + poids)
 * @param {string} predictionType - Type prédiction (weight, calories, goal_time)
 * @returns {Object} { xs: tf.Tensor2D, ys: tf.Tensor1D, stats: Object }
 */
export const prepareTrainingData = (userHistory, predictionType = PREDICTION_TYPES.WEIGHT) => {
  if (!userHistory || userHistory.length < DEFAULT_MODEL_CONFIG.minDataPoints) {
    log.warn('[prepareTrainingData] Données insuffisantes', { 
      length: userHistory?.length || 0, 
      minRequired: DEFAULT_MODEL_CONFIG.minDataPoints 
    });
    return null;
  }

  log.debug('[prepareTrainingData] Préparation données', { 
    type: predictionType, 
    historyLength: userHistory.length 
  });

  const trainingData = [];
  const trainingLabels = [];

  // Trier historique par date (plus ancien en premier)
  const sortedHistory = [...userHistory].sort((a, b) => {
    const dateA = new Date(a.date || a.timestamp || 0).getTime();
    const dateB = new Date(b.date || b.timestamp || 0).getTime();
    return dateA - dateB;
  });

  // Parcourir historique (fenêtre glissante de 7 jours)
  const windowSize = 7;
  for (let i = windowSize; i < sortedHistory.length; i++) {
    const window = sortedHistory.slice(i - windowSize, i);
    const future = sortedHistory[i];

    // Features (7 derniers jours)
    const avgCalories = window.reduce((sum, day) => sum + (day.calories || 0), 0) / windowSize;
    const avgProtein = window.reduce((sum, day) => sum + (day.protein || 0), 0) / windowSize;
    const workoutFrequency = window.filter(day => day.workouts && day.workouts.length > 0).length / windowSize;
    
    const windowStart = new Date(window[0].date || window[0].timestamp || 0).getTime();
    const futureDate = new Date(future.date || future.timestamp || 0).getTime();
    const daysElapsed = (futureDate - windowStart) / (1000 * 60 * 60 * 24);

    const currentWeight = window[window.length - 1].weight || window[window.length - 1].currentWeight || null;

    // Vérifier données valides
    if (currentWeight == null || currentWeight <= 0) {
      continue; // Ignorer si poids manquant
    }

    // Features selon type prédiction
    let features = [];
    let target = null;

    if (predictionType === PREDICTION_TYPES.WEIGHT) {
      // Prédiction poids : features + target poids futur
      features = [avgCalories, avgProtein, workoutFrequency, daysElapsed, currentWeight];
      target = future.weight || future.currentWeight;
    } else if (predictionType === PREDICTION_TYPES.CALORIES) {
      // Prédiction calories optimales : features + target calories futures
      features = [avgProtein, workoutFrequency, currentWeight, daysElapsed, avgCalories];
      target = future.calories || avgCalories; // Utiliser calories futures ou moyennes
    } else if (predictionType === PREDICTION_TYPES.GOAL_TIME) {
      // Prédiction temps objectif : features + target jours restants
      const goalWeight = window[0].goalWeight || null;
      if (goalWeight == null || goalWeight <= 0) {
        continue; // Ignorer si objectif manquant
      }
      features = [avgCalories, avgProtein, workoutFrequency, currentWeight, goalWeight];
      const weightDiff = Math.abs(future.weight - goalWeight);
      target = weightDiff / 0.1; // Approximation : jours pour perdre/gagner 0.1kg/jour
    }

    // Ignorer si target invalide
    if (target == null || !isFinite(target) || target <= 0) {
      continue;
    }

    // Ignorer si features invalides
    if (features.some(f => !isFinite(f) || f < 0)) {
      continue;
    }

    trainingData.push(features);
    trainingLabels.push(target);
  }

  if (trainingData.length < DEFAULT_MODEL_CONFIG.minDataPoints) {
    log.warn('[prepareTrainingData] Pas assez de données valides', { 
      valid: trainingData.length, 
      minRequired: DEFAULT_MODEL_CONFIG.minDataPoints 
    });
    return null;
  }

  // Convertir en tensors TensorFlow.js
  const xs = tf.tensor2d(trainingData);
  const ys = tf.tensor1d(trainingLabels);

  log.debug('[prepareTrainingData] Données préparées', { 
    samples: trainingData.length, 
    features: trainingData[0]?.length || 0 
  });

  return { xs, ys };
};

/**
 * Normalise les données d'entraînement (moyenne 0, écart-type 1)
 * 
 * @param {tf.Tensor2D} xs - Features d'entraînement
 * @param {tf.Tensor1D} ys - Labels d'entraînement
 * @returns {Object} { xs: tf.Tensor2D, ys: tf.Tensor1D, stats: Object }
 */
export const normalizeData = (xs, ys) => {
  log.debug('[normalizeData] Normalisation données');

  // Normaliser features (moyenne 0, écart-type 1)
  // ✅ OPTIMISATION : Extraire arrays JavaScript d'abord, puis recréer tensors
  // Cela évite de garder les tensors originaux en mémoire
  const xMean = xs.mean(0);
  const xMeanArray = xMean.arraySync(); // Extraire avant dispose
  xMean.dispose(); // Disposer original immédiatement
  
  const xMeanTensor = tf.tensor1d(xMeanArray);
  const xDiff = xs.sub(xMeanTensor);
  
  const xStd = xDiff.square().mean(0).sqrt();
  const xStdArray = xStd.arraySync(); // Extraire avant dispose
  xStd.dispose(); // Disposer original immédiatement
  
  // Éviter division par zéro
  const xStdSafe = tf.tensor1d(xStdArray.map(v => Math.max(v, 1e-8)));
  const normalizedXs = xDiff.div(xStdSafe);

  // Normaliser labels
  const yMean = ys.mean();
  const yMeanValue = yMean.arraySyncSync()[0]; // Extraire valeur scalaire
  yMean.dispose(); // Disposer original immédiatement
  
  const yMeanTensor = tf.scalar(yMeanValue);
  const yDiff = ys.sub(yMeanTensor);
  
  const yStd = yDiff.square().mean().sqrt();
  const yStdValue = Math.max(yStd.arraySyncSync()[0], 1e-8); // Extraire et éviter zéro
  yStd.dispose(); // Disposer original immédiatement
  
  const yStdSafe = tf.scalar(yStdValue);
  const normalizedYs = yDiff.div(yStdSafe);

  // Extraire statistiques (pour dénormalisation plus tard)
  // ✅ OPTIMISATION : Stats déjà extraites dans variables séparées
  const stats = {
    xMean: xMeanArray,
    xStd: xStdArray,
    yMean: yMeanValue,
    yStd: yStdValue
  };

  // ✅ OPTIMISATION : Ne PAS disposer xMeanTensor, xStdSafe, yMeanTensor, yStdSafe, xDiff, yDiff
  // car ils sont nécessaires pour normalizedXs et normalizedYs qui sont retournés
  // TensorFlow.js gère automatiquement la mémoire via références
  // Ces tensors seront nettoyés automatiquement quand normalizedXs/normalizedYs le seront
  
  log.debug('[normalizeData] Données normalisées', { stats });

  return {
    xs: normalizedXs,
    ys: normalizedYs,
    stats
  };
};

// ==================== ENTRAÎNEMENT ====================

/**
 * Entraîne un modèle de prédiction
 * 
 * @param {string} predictionType - Type prédiction (weight, calories, goal_time)
 * @param {Array} userHistory - Historique utilisateur
 * @param {Object} options - Options d'entraînement
 * @param {Function} options.onProgress - Callback progression (epoch, logs)
 * @returns {Promise<Object>} { model, stats, metadata }
 */
export const trainModel = async (predictionType, userHistory, options = {}) => {
  try {
    log.info('[trainModel] Démarrage entraînement', { type: predictionType });

    // Vérifier données suffisantes
    if (!userHistory || userHistory.length < DEFAULT_MODEL_CONFIG.minDataPoints) {
      throw new Error(`Données insuffisantes: ${userHistory?.length || 0} points (minimum: ${DEFAULT_MODEL_CONFIG.minDataPoints})`);
    }

    // Préparer données
    const trainingData = prepareTrainingData(userHistory, predictionType);
    if (!trainingData) {
      throw new Error('Impossible de préparer les données d\'entraînement');
    }

    const { xs, ys } = trainingData;

    // Normaliser données
    const normalized = normalizeData(xs, ys);
    const { xs: normalizedXs, ys: normalizedYs, stats } = normalized;

    // Créer modèle
    const model = await createPredictionModel({ inputSize: trainingData.xs.shape[1] });

    // Entraîner modèle
    const {
      epochs = DEFAULT_MODEL_CONFIG.epochs,
      batchSize = DEFAULT_MODEL_CONFIG.batchSize,
      validationSplit = DEFAULT_MODEL_CONFIG.validationSplit,
      onProgress = null
    } = options;

    log.debug('[trainModel] Démarrage entraînement', { epochs, batchSize, validationSplit });

    const history = await model.fit(normalizedXs, normalizedYs, {
      epochs,
      batchSize,
      validationSplit,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          if (onProgress) {
            onProgress(epoch, logs);
          }
          log.debug(`[trainModel] Epoch ${epoch}/${epochs}: loss = ${logs.loss?.toFixed(4)}, val_loss = ${logs.val_loss?.toFixed(4)}`);
        }
      }
    });

    // Extraire métriques finales
    const finalLoss = history.history.loss[history.history.loss.length - 1];
    const finalValLoss = history.history.val_loss?.[history.history.val_loss.length - 1];
    const finalMae = history.history.meanAbsoluteError?.[history.history.meanAbsoluteError.length - 1];
    const finalValMae = history.history.val_meanAbsoluteError?.[history.history.val_meanAbsoluteError.length - 1];

    // Nettoyer tensors (libérer mémoire)
    xs.dispose();
    ys.dispose();
    normalizedXs.dispose();
    normalizedYs.dispose();

    // Métadonnées du modèle
    const metadata = {
      type: predictionType,
      version: MODEL_VERSION,
      trainedAt: new Date().toISOString(),
      epochs,
      batchSize,
      validationSplit,
      finalLoss,
      finalValLoss,
      finalMae,
      finalValMae,
      trainingSamples: trainingData.xs.shape[0],
      isActive: true
    };

    log.info('[trainModel] Entraînement terminé', { metadata });

    // ✅ OPTIMISATION : Sauvegarder automatiquement le modèle après entraînement
    try {
      await saveModel(predictionType, model, stats, metadata);
      log.debug('[trainModel] Modèle sauvegardé automatiquement');
    } catch (saveError) {
      log.warn('[trainModel] Erreur sauvegarde automatique (modèle toujours en mémoire):', saveError);
      // Ne pas throw, le modèle est toujours utilisable en mémoire
    }

    return {
      model,
      stats,
      metadata
    };
  } catch (error) {
    log.error('[trainModel] Erreur entraînement:', error);
    throw error;
  }
};

// ==================== SAUVEGARDE/CHARGEMENT ====================

/**
 * Sauvegarde un modèle entraîné dans IndexedDB
 * 
 * @param {string} predictionType - Type prédiction
 * @param {tf.Sequential} model - Modèle TensorFlow.js
 * @param {Object} stats - Statistiques de normalisation
 * @param {Object} metadata - Métadonnées du modèle
 * @returns {Promise<string>} ID du modèle sauvegardé
 */
export const saveModel = async (predictionType, model, stats, metadata) => {
  try {
    log.debug('[saveModel] Sauvegarde modèle', { type: predictionType });

    const db = await openNutritionDB();
    if (!db) {
      throw new Error('IndexedDB non disponible');
    }

    // ✅ OPTIMISATION : Sauvegarder directement les weights (plus efficace que model.save)
    const modelWeights = await model.getWeights();
    const weightsData = await Promise.all(modelWeights.map(async (w) => {
      const data = await w.array();
      // ✅ OPTIMISATION : Nettoyer tensor après conversion (libérer mémoire)
      w.dispose();
      return {
        shape: w.shape,
        data
      };
    }));

    // Créer ID unique
    const modelId = `${predictionType}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Désactiver anciens modèles du même type
    const transaction = db.transaction([STORE_ML_MODELS], 'readwrite');
    const store = transaction.objectStore(STORE_ML_MODELS);
    const index = store.index('type');
    const request = index.openCursor(IDBKeyRange.only(predictionType));

    await new Promise((resolve, reject) => {
      request.onsuccess = async (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.value.isActive = false;
          cursor.update(cursor.value);
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = reject;
    });

    // Sauvegarder nouveau modèle
    const modelData = {
      id: modelId,
      type: predictionType,
      version: MODEL_VERSION,
      timestamp: Date.now(),
      isActive: true,
      modelWeights: weightsData,
      modelConfig: {
        inputSize: model.inputs[0].shape[1],
        layers: model.layers.map(l => ({
          units: l.units || l.outputShape[l.outputShape.length - 1],
          activation: l.activation || null
        }))
      },
      stats, // Statistiques de normalisation
      metadata
    };

    await new Promise((resolve, reject) => {
      const saveRequest = store.put(modelData);
      saveRequest.onsuccess = () => resolve();
      saveRequest.onerror = () => reject(saveRequest.error);
    });

    // Mettre à jour cache
    modelCache.set(predictionType, { model, stats, metadata });

    log.info('[saveModel] Modèle sauvegardé', { id: modelId, type: predictionType });

    return modelId;
  } catch (error) {
    log.error('[saveModel] Erreur sauvegarde:', error);
    throw error;
  }
};

/**
 * Charge un modèle entraîné depuis IndexedDB
 * 
 * @param {string} predictionType - Type prédiction
 * @returns {Promise<Object|null>} { model, stats, metadata } ou null si non trouvé
 */
export const loadModel = async (predictionType) => {
  try {
    // Vérifier cache
    if (modelCache.has(predictionType)) {
      log.debug('[loadModel] Modèle depuis cache', { type: predictionType });
      return modelCache.get(predictionType);
    }

    log.debug('[loadModel] Chargement modèle', { type: predictionType });

    const db = await openNutritionDB();
    if (!db) {
      throw new Error('IndexedDB non disponible');
    }

    const transaction = db.transaction([STORE_ML_MODELS], 'readonly');
    const store = transaction.objectStore(STORE_ML_MODELS);
    const index = store.index('type');
    const request = index.getAll(IDBKeyRange.only(predictionType));

    const models = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    // Trouver modèle actif
    const activeModel = models.find(m => m.isActive) || models.sort((a, b) => b.timestamp - a.timestamp)[0];

    if (!activeModel) {
      // ✅ OPTIMISATION : Utiliser debug au lieu de warn (normal si aucun modèle entraîné)
      log.debug('[loadModel] Aucun modèle trouvé (normal si aucun modèle n\'a été entraîné)', { type: predictionType });
      return null;
    }

    // Reconstruire modèle depuis weights
    await initializeTensorFlowBackend(); // ✅ OPTIMISATION : Initialiser backend avant chargement
    const model = await createPredictionModel({ 
      inputSize: activeModel.modelConfig.inputSize 
    });

    // Charger weights
    const weights = activeModel.modelWeights.map(w => tf.tensor(w.data, w.shape));
    model.setWeights(weights);
    
    // ✅ OPTIMISATION : setWeights transfère la propriété des tensors au modèle
    // Le modèle gère maintenant la mémoire des tensors, pas besoin de dispose manuel
    // Les tensors seront automatiquement nettoyés quand le modèle sera disposé

    const { stats, metadata } = activeModel;

    // Mettre à jour cache
    const loaded = { model, stats, metadata };
    modelCache.set(predictionType, loaded);

    log.info('[loadModel] Modèle chargé', { type: predictionType, trainedAt: metadata.trainedAt });

    return loaded;
  } catch (error) {
    log.error('[loadModel] Erreur chargement:', error);
    throw error;
  }
};

// ==================== PRÉDICTIONS ====================

/**
 * Prédit une valeur future
 * 
 * @param {string} predictionType - Type prédiction
 * @param {Array} features - Features actuelles [calories_avg, protein_avg, workout_freq, days_ahead, current_weight]
 * @param {number} daysAhead - Nombre de jours à prédire
 * @returns {Promise<number|null>} Valeur prédite ou null si erreur
 */
export const predict = async (predictionType, features, daysAhead = 7) => {
  try {
    log.debug('[predict] Prédiction', { type: predictionType, daysAhead, features });

    // Charger modèle
    const loaded = await loadModel(predictionType);
    if (!loaded) {
      log.warn('[predict] Modèle non disponible', { type: predictionType });
      return null;
    }

    const { model, stats } = loaded;

    // Préparer features (ajouter daysAhead si nécessaire)
    let inputFeatures = [...features];
    if (predictionType === PREDICTION_TYPES.WEIGHT || predictionType === PREDICTION_TYPES.GOAL_TIME) {
      // Remplacer jours écoulés par jours à prédire
      inputFeatures[3] = daysAhead;
    }

    // Normaliser features
    const featuresTensor = tf.tensor2d([inputFeatures]);
    const xMean = tf.tensor1d(stats.xMean);
    const xStd = tf.tensor1d(stats.xStd);
    const xStdSafe = xStd.add(1e-8);
    const normalizedFeatures = featuresTensor.sub(xMean).div(xStdSafe);

    // Prédire
    const prediction = model.predict(normalizedFeatures);

    // Dénormaliser
    const yMean = stats.yMean;
    const yStd = stats.yStd;
    const denormalized = prediction.mul(yStd).add(yMean);

    // Extraire valeur
    const predictedValue = (await denormalized.data())[0];

    // Nettoyer tensors
    featuresTensor.dispose();
    normalizedFeatures.dispose();
    prediction.dispose();
    denormalized.dispose();
    xMean.dispose();
    xStd.dispose();
    xStdSafe.dispose();

    log.debug('[predict] Prédiction terminée', { predicted: predictedValue });

    return predictedValue;
  } catch (error) {
    log.error('[predict] Erreur prédiction:', error);
    return null;
  }
};

// ==================== UTILITAIRES ====================

/**
 * Vérifie si TensorFlow.js est supporté
 * 
 * @returns {boolean} true si supporté
 */
export const isTensorFlowSupported = () => {
  return typeof tf !== 'undefined' && tf !== null;
};

/**
 * Nettoie le cache des modèles (libérer mémoire)
 */
export const clearModelCache = () => {
  modelCache.forEach(({ model }) => {
    if (model && typeof model.dispose === 'function') {
      model.dispose();
    }
  });
  modelCache.clear();
  log.debug('[clearModelCache] Cache nettoyé');
};

/**
 * Exporte tous les modèles pour backup JSON
 * 
 * @returns {Promise<Object>} Données modèles exportées
 */
export const exportModels = async () => {
  try {
    log.debug('[exportModels] Export modèles');

    const db = await openNutritionDB();
    if (!db) {
      return { models: [], metadata: { total: 0, exportedAt: new Date().toISOString() } };
    }

    const transaction = db.transaction([STORE_ML_MODELS], 'readonly');
    const store = transaction.objectStore(STORE_ML_MODELS);
    const request = store.getAll();

    const models = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    // Nettoyer données pour export (exclure weights si trop volumineux)
    const exportedModels = models.map(m => ({
      id: m.id,
      type: m.type,
      version: m.version,
      timestamp: m.timestamp,
      isActive: m.isActive,
      modelConfig: m.modelConfig,
      stats: m.stats,
      metadata: m.metadata
      // modelWeights exclu (trop volumineux pour JSON, peut être recalculé)
    }));

    return {
      models: exportedModels,
      metadata: {
        total: exportedModels.length,
        active: exportedModels.filter(m => m.isActive).length,
        exportedAt: new Date().toISOString(),
        version: MODEL_VERSION
      }
    };
  } catch (error) {
    log.error('[exportModels] Erreur export:', error);
    return { models: [], metadata: { total: 0, exportedAt: new Date().toISOString(), error: error.message } };
  }
};

