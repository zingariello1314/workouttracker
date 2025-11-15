/**
 * useNutritionPredictions.js
 * 
 * Hook React pour les prédictions offline avec TensorFlow.js.
 * 
 * Ce hook :
 * - Récupère données nutrition (dailyMeals) depuis useNutritionData
 * - Récupère poids (progressEntries) depuis useWorkout
 * - Fusionne données pour créer historique utilisateur
 * - Expose méthodes : trainModel, predict, loadModel, etc.
 * - Gère état : isTraining, modelLoaded, predictions, error
 * - Intègre toast notifications pour feedback utilisateur
 * 
 * Architecture :
 * - Service : nutritionPredictions.js (logique TensorFlow.js)
 * - Données : nutrition (dailyMeals, meals) + poids (progressEntries)
 * - Performance : Lazy loading modèles, entraînement async
 * 
 * @module hooks/useNutritionPredictions
 * @see ../services/nutrition/nutritionPredictions
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useNutritionData } from './useNutritionData';
import { useWorkout } from '../context/WorkoutContext';
import { DateHelper } from '../utils/dateHelper';
import {
  PREDICTION_TYPES,
  trainModel,
  loadModel,
  predict,
  isTensorFlowSupported,
  clearModelCache,
  exportModels
} from '../services/nutrition/nutritionPredictions';
import { useToast } from '../components/ui/Toast/ToastProvider';
import logger from '../utils/logger';

const log = logger.module('useNutritionPredictions');

/**
 * Hook pour les prédictions offline avec TensorFlow.js
 * 
 * @returns {Object} Interface du hook
 * @returns {boolean} returns.isSupported - Si TensorFlow.js est supporté
 * @returns {boolean} returns.isTraining - Si un modèle est en cours d'entraînement
 * @returns {boolean} returns.modelLoaded - Si un modèle est chargé
 * @returns {Object} returns.predictions - Prédictions actuelles { weight, calories, goalTime }
 * @returns {string} returns.error - Message d'erreur
 * @returns {Function} returns.trainWeightModel - Entraîne un modèle de prédiction poids
 * @returns {Function} returns.predictWeight - Prédit le poids futur
 * @returns {Function} returns.loadWeightModel - Charge un modèle poids
 * @returns {Function} returns.reset - Réinitialise l'état
 */
export const useNutritionPredictions = () => {
  // État
  const [isTraining, setIsTraining] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [predictions, setPredictions] = useState({});
  const [error, setError] = useState(null);
  const [trainingProgress, setTrainingProgress] = useState(null);

  // Références
  const trainedModelRef = useRef(null);
  const cancelledRef = useRef(false);

  // Hooks
  const { dbReady: nutritionDbReady, getDailyMealsByRange } = useNutritionData();
  const { data: workoutData } = useWorkout();
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  // Vérifier support TensorFlow.js
  const isSupported = isTensorFlowSupported();

  // ==================== FUSION DONNÉES ====================

  /**
   * Fusionne données nutrition et poids pour créer historique utilisateur
   * 
   * @param {string} startDate - Date début (YYYY-MM-DD)
   * @param {string} endDate - Date fin (YYYY-MM-DD)
   * @returns {Promise<Array>} Historique utilisateur fusionné
   */
  const buildUserHistory = useCallback(async (startDate, endDate) => {
    try {
      log.debug('[buildUserHistory] Construction historique', { startDate, endDate });

      // Récupérer données nutrition
      const dailyMeals = await getDailyMealsByRange(startDate, endDate);

      // Récupérer poids depuis progressEntries
      const progressEntries = workoutData?.progressEntries || [];
      const weightEntries = progressEntries
        .filter(entry => entry.type === 'metrics' && entry.weight != null && entry.weight > 0)
        .map(entry => ({
          // ✅ OPTIMISATION : Utiliser DateHelper pour garantir timezone locale
          date: entry.date || DateHelper.toYYYYMMDD(new Date(entry.timestamp)),
          timestamp: entry.timestamp || new Date(entry.date).getTime(),
          weight: parseFloat(entry.weight)
        }))
        .sort((a, b) => {
          // ✅ OPTIMISATION : Utiliser DateHelper pour garantir cohérence timezone locale
          const tsA = DateHelper.getMidnightTimestamp(a.date);
          const tsB = DateHelper.getMidnightTimestamp(b.date);
          return (tsA || 0) - (tsB || 0);
        });

      // Fusionner données
      const historyMap = new Map();

      // Ajouter données nutrition
      dailyMeals.forEach(daily => {
        const date = daily.date;
        if (!historyMap.has(date)) {
          historyMap.set(date, {
            date,
            timestamp: new Date(date).getTime(),
            calories: daily.dailyTotals?.calories || 0,
            protein: daily.dailyTotals?.protein || 0,
            carbs: daily.dailyTotals?.carbs || 0,
            fat: daily.dailyTotals?.fat || 0,
            weight: null,
            workouts: [] // À compléter si nécessaire
          });
        } else {
          const existing = historyMap.get(date);
          existing.calories = daily.dailyTotals?.calories || 0;
          existing.protein = daily.dailyTotals?.protein || 0;
          existing.carbs = daily.dailyTotals?.carbs || 0;
          existing.fat = daily.dailyTotals?.fat || 0;
        }
      });

      // Ajouter poids (interpolation si nécessaire)
      weightEntries.forEach(weightEntry => {
        const date = weightEntry.date;
        if (historyMap.has(date)) {
          historyMap.get(date).weight = weightEntry.weight;
        } else {
          // Créer entrée si manquante (avec données nutrition à 0)
          historyMap.set(date, {
            date,
            timestamp: weightEntry.timestamp,
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            weight: weightEntry.weight,
            workouts: []
          });
        }
      });

      // Convertir Map en Array et trier par date
      const history = Array.from(historyMap.values())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      log.debug('[buildUserHistory] Historique construit', { 
        totalDays: history.length, 
        withWeight: history.filter(h => h.weight != null).length,
        withNutrition: history.filter(h => h.calories > 0).length
      });

      return history;
    } catch (error) {
      log.error('[buildUserHistory] Erreur construction historique:', error);
      return [];
    }
  }, [getDailyMealsByRange, workoutData]);

  // ==================== ENTRAÎNEMENT ====================

  /**
   * Entraîne un modèle de prédiction poids
   * 
   * @param {Object} options - Options d'entraînement
   * @param {string} options.startDate - Date début historique (défaut: 90 jours)
   * @param {string} options.endDate - Date fin historique (défaut: aujourd'hui)
   * @param {Function} options.onProgress - Callback progression (epoch, logs)
   * @returns {Promise<boolean>} true si succès
   */
  const trainWeightModel = useCallback(async (options = {}) => {
    if (!isSupported) {
      setError('TensorFlow.js non supporté');
      showError('TensorFlow.js n\'est pas supporté sur votre navigateur');
      return false;
    }

    if (!nutritionDbReady) {
      setError('Base de données nutrition non prête');
      showError('Base de données nutrition non disponible');
      return false;
    }

    try {
      setIsTraining(true);
      setError(null);
      setTrainingProgress(null);
      cancelledRef.current = false;

      // Dates par défaut : 90 derniers jours
      // ✅ OPTIMISATION : Utiliser DateHelper pour garantir timezone locale
      const endDate = options.endDate || DateHelper.getTodayLocal();
      const startDate = options.startDate || DateHelper.getDaysAgoLocal(90);

      log.info('[trainWeightModel] Démarrage entraînement', { startDate, endDate });

      // Construire historique
      const userHistory = await buildUserHistory(startDate, endDate);

      if (userHistory.length < 30) {
        throw new Error(`Données insuffisantes: ${userHistory.length} jours (minimum: 30)`);
      }

      // Callback progression
      const onProgress = (epoch, logs) => {
        if (cancelledRef.current) return;
        
        setTrainingProgress({
          epoch,
          loss: logs.loss?.toFixed(4),
          valLoss: logs.val_loss?.toFixed(4),
          mae: logs.meanAbsoluteError?.toFixed(4),
          valMae: logs.val_meanAbsoluteError?.toFixed(4)
        });

        if (options.onProgress) {
          options.onProgress(epoch, logs);
        }
      };

      // Entraîner modèle
      const result = await trainModel(
        PREDICTION_TYPES.WEIGHT,
        userHistory,
        {
          epochs: options.epochs || 50,
          batchSize: options.batchSize || 32,
          validationSplit: options.validationSplit || 0.2,
          onProgress
        }
      );

      if (cancelledRef.current) {
        log.debug('[trainWeightModel] Entraînement annulé');
        return false;
      }

      const { model, stats, metadata } = result;

      // Sauvegarder modèle (sera fait par le service)
      // Le service saveModel gère déjà la sauvegarde IndexedDB
      // On garde juste une référence en mémoire
      trainedModelRef.current = { model, stats, metadata };

      setModelLoaded(true);
      setTrainingProgress(null);
      setIsTraining(false);

      log.info('[trainWeightModel] Entraînement terminé', { metadata });
      showSuccess(`Modèle entraîné avec succès (${userHistory.length} jours)`);

      return true;
    } catch (error) {
      log.error('[trainWeightModel] Erreur entraînement:', error);
      setError(error.message);
      setIsTraining(false);
      setTrainingProgress(null);
      
      if (error.message.includes('Données insuffisantes')) {
        showWarning(error.message);
      } else {
        showError(`Erreur entraînement: ${error.message}`);
      }
      
      return false;
    }
  }, [isSupported, nutritionDbReady, buildUserHistory, showSuccess, showError, showWarning]);

  // ==================== CHARGEMENT ====================

  /**
   * Charge un modèle poids depuis IndexedDB
   * 
   * @returns {Promise<boolean>} true si succès
   */
  const loadWeightModel = useCallback(async () => {
    if (!isSupported) {
      setError('TensorFlow.js non supporté');
      return false;
    }

    try {
      log.debug('[loadWeightModel] Chargement modèle');

      const loaded = await loadModel(PREDICTION_TYPES.WEIGHT);

      if (!loaded) {
        setError('Aucun modèle trouvé');
        setModelLoaded(false);
        return false;
      }

      const { model, stats, metadata } = loaded;
      trainedModelRef.current = { model, stats, metadata };

      setModelLoaded(true);
      setError(null);

      log.info('[loadWeightModel] Modèle chargé', { trainedAt: metadata.trainedAt });
      return true;
    } catch (error) {
      log.error('[loadWeightModel] Erreur chargement:', error);
      setError(error.message);
      setModelLoaded(false);
      return false;
    }
  }, [isSupported]);

  // ==================== PRÉDICTIONS ====================

  /**
   * Prédit le poids futur
   * 
   * @param {number} daysAhead - Nombre de jours à prédire (défaut: 7)
   * @returns {Promise<number|null>} Poids prédit ou null si erreur
   */
  const predictWeight = useCallback(async (daysAhead = 7) => {
    if (!isSupported) {
      setError('TensorFlow.js non supporté');
      return null;
    }

    if (!modelLoaded && !trainedModelRef.current) {
      // Essayer de charger le modèle
      const loaded = await loadWeightModel();
      if (!loaded) {
        setError('Aucun modèle disponible. Entraînez d\'abord un modèle.');
        showWarning('Entraînez d\'abord un modèle pour faire des prédictions');
        return null;
      }
    }

    try {
      log.debug('[predictWeight] Prédiction poids', { daysAhead });

      // Construire historique récent (7 derniers jours)
      // ✅ OPTIMISATION : Utiliser DateHelper pour garantir timezone locale
      const endDate = DateHelper.getTodayLocal();
      const startDate = DateHelper.getDaysAgoLocal(7);

      const recentHistory = await buildUserHistory(startDate, endDate);

      if (recentHistory.length === 0) {
        throw new Error('Données récentes insuffisantes');
      }

      // Calculer features (7 derniers jours)
      const last7Days = recentHistory.slice(-7);
      const avgCalories = last7Days.reduce((sum, day) => sum + (day.calories || 0), 0) / last7Days.length;
      const avgProtein = last7Days.reduce((sum, day) => sum + (day.protein || 0), 0) / last7Days.length;
      const workoutFrequency = last7Days.filter(day => day.workouts && day.workouts.length > 0).length / last7Days.length;

      const currentWeight = last7Days[last7Days.length - 1]?.weight || 
                           recentHistory[recentHistory.length - 1]?.weight || null;

      if (currentWeight == null) {
        throw new Error('Poids actuel non disponible');
      }

      // Features : [calories_avg, protein_avg, workout_freq, days_ahead, current_weight]
      const features = [avgCalories, avgProtein, workoutFrequency, daysAhead, currentWeight];

      // Prédire
      const predictedWeight = await predict(PREDICTION_TYPES.WEIGHT, features, daysAhead);

      if (predictedWeight == null) {
        throw new Error('Erreur lors de la prédiction');
      }

      // Mettre à jour prédictions
      setPredictions(prev => ({
        ...prev,
        weight: {
          value: predictedWeight,
          daysAhead,
          currentWeight,
          // ✅ OPTIMISATION : Utiliser DateHelper pour garantir timezone locale
          date: DateHelper.addDays(DateHelper.getTodayLocal(), daysAhead)
        }
      }));

      log.info('[predictWeight] Prédiction terminée', { predictedWeight, daysAhead });
      return predictedWeight;
    } catch (error) {
      log.error('[predictWeight] Erreur prédiction:', error);
      setError(error.message);
      showError(`Erreur prédiction: ${error.message}`);
      return null;
    }
  }, [isSupported, modelLoaded, loadWeightModel, buildUserHistory, showWarning, showError]);

  // ==================== UTILITAIRES ====================

  /**
   * Réinitialise l'état
   */
  const reset = useCallback(() => {
    setError(null);
    setPredictions({});
    setTrainingProgress(null);
    setIsTraining(false);
    // Ne pas réinitialiser modelLoaded (on garde le modèle chargé)
  }, []);

  /**
   * Nettoie le cache des modèles (libérer mémoire)
   */
  const clearCache = useCallback(() => {
    clearModelCache();
    trainedModelRef.current = null;
    setModelLoaded(false);
    log.debug('[clearCache] Cache nettoyé');
  }, []);

  /**
   * Exporte les modèles pour backup JSON
   * 
   * @returns {Promise<Object>} Données modèles exportées
   */
  const exportAllModels = useCallback(async () => {
    try {
      return await exportModels();
    } catch (error) {
      log.error('[exportAllModels] Erreur export:', error);
      throw error;
    }
  }, []);

  // ==================== EFFETS ====================

  // Charger modèle au montage si disponible
  useEffect(() => {
    if (isSupported && nutritionDbReady && !modelLoaded && !trainedModelRef.current) {
      loadWeightModel().catch(err => {
        log.debug('[useNutritionPredictions] Modèle non disponible au chargement:', err);
        // Ne pas afficher d'erreur, c'est normal si aucun modèle n'a été entraîné
      });
    }
  }, [isSupported, nutritionDbReady, modelLoaded, loadWeightModel]);

  // Nettoyer au démontage
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      // Ne pas nettoyer le cache ici (on garde les modèles chargés)
    };
  }, []);

  // ==================== RETURN ====================

  return {
    // État
    isSupported,
    isTraining,
    modelLoaded,
    predictions,
    error,
    trainingProgress,

    // Méthodes
    trainWeightModel,
    predictWeight,
    loadWeightModel,
    reset,
    clearCache,
    exportAllModels
  };
};

