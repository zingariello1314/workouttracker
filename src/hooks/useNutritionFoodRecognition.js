/**
 * useNutritionFoodRecognition.js
 * 
 * Hook React pour la reconnaissance d'aliments via photo (TensorFlow.js MobileNet).
 * 
 * Fonctionnalités :
 * - État : isAnalyzing, detectedFoods, enrichedFoods, error, isSupported
 * - Méthodes : analyzePhoto, reset, clearCache
 * - Analyse automatique photo (détection + enrichissement)
 * - Gestion erreurs et chargement modèle
 * - Lazy loading du modèle (chargement à la demande)
 * - Feedback visuel (loading states)
 * 
 * Architecture :
 * - Service : `nutritionFoodRecognition.js` (MobileNet + recherche nutritionnelle)
 * - Performance : Lazy loading modèle, compression images, cache prédictions
 * - UX : Feedback visuel, gestion erreurs, fallback gracieux
 * 
 * @module hooks/useNutritionFoodRecognition
 * @see ../../../nouvelongletnutritionplan.md Section 2.2
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  isTensorFlowSupported,
  loadFoodModel,
  unloadFoodModel,
  analyzeFoodImage,
  analyzeFoodImageComplete,
  clearPredictionCache
} from '../services/nutrition/nutritionFoodRecognition';
import { useToast } from '../components/ui/Toast/ToastProvider';
import logger from '../utils/logger';

const log = logger.module('useNutritionFoodRecognition');

/**
 * Hook pour la reconnaissance d'aliments via photo
 * 
 * @param {Object} options - Options du hook
 * @param {Function} options.onFoodsDetected - Callback appelé avec les aliments détectés { foods }
 * @param {boolean} options.autoEnrich - Enrichir automatiquement avec données nutritionnelles (défaut: true)
 * @param {number} options.minConfidence - Probabilité minimale (défaut: 0.3)
 * @param {boolean} options.useCache - Utiliser cache (défaut: true)
 * @returns {Object} Interface du hook
 */
export const useNutritionFoodRecognition = (options = {}) => {
  const {
    onFoodsDetected = null,
    autoEnrich = true,
    minConfidence = 0.3,
    useCache = true
  } = options;

  // Toast notifications
  const { showSuccess, showError } = useToast();

  // État
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [detectedFoods, setDetectedFoods] = useState([]);
  const [enrichedFoods, setEnrichedFoods] = useState([]);
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);

  // Refs
  const analyzingRef = useRef(false); // Garder synchro avec état
  const modelLoadingPromiseRef = useRef(null);

  // Vérifier support au démarrage
  useEffect(() => {
    const supported = isTensorFlowSupported();
    setIsSupported(supported);

    if (!supported) {
      log.warn('[useNutritionFoodRecognition] TensorFlow.js non supporté');
      setError('Reconnaissance photo non supportée par votre navigateur');
    }
  }, []);

  // Charger modèle en préchargement (optionnel)
  const preloadModel = useCallback(async () => {
    if (!isSupported || modelLoaded || modelLoadingPromiseRef.current) {
      return;
    }

    try {
      setIsLoadingModel(true);
      modelLoadingPromiseRef.current = loadFoodModel();
      await modelLoadingPromiseRef.current;
      setModelLoaded(true);
      log.debug('[useNutritionFoodRecognition] Modèle préchargé');
    } catch (error) {
      log.error('[useNutritionFoodRecognition] Erreur préchargement modèle:', error);
      setError('Erreur chargement modèle de reconnaissance');
    } finally {
      setIsLoadingModel(false);
      modelLoadingPromiseRef.current = null;
    }
  }, [isSupported, modelLoaded]);

  // Nettoyage à la fermeture
  useEffect(() => {
    return () => {
      // Arrêter analyse en cours
      if (analyzingRef.current) {
        analyzingRef.current = false;
      }

      // Ne pas décharger le modèle (peut être réutilisé)
      // unloadFoodModel();
    };
  }, []);

  /**
   * Analyser une photo et détecter les aliments
   * 
   * @param {File|string|HTMLImageElement} imageSource - Image à analyser
   */
  const analyzePhoto = useCallback(async (imageSource) => {
    if (!isSupported) {
      const errorMsg = 'Reconnaissance photo non supportée';
      setError(errorMsg);
      showError(errorMsg);
      return;
    }

    if (analyzingRef.current) {
      log.warn('[useNutritionFoodRecognition] Analyse déjà en cours');
      return;
    }

    if (!imageSource) {
      const errorMsg = 'Image non fournie';
      setError(errorMsg);
      showError(errorMsg);
      return;
    }

    try {
      analyzingRef.current = true;
      setIsAnalyzing(true);
      setError(null);
      setDetectedFoods([]);
      setEnrichedFoods([]);

      log.debug('[useNutritionFoodRecognition] Analyse photo démarrée');

      // Charger modèle si pas déjà chargé (lazy)
      if (!modelLoaded && !modelLoadingPromiseRef.current) {
        setIsLoadingModel(true);
        modelLoadingPromiseRef.current = loadFoodModel();
        await modelLoadingPromiseRef.current;
        setModelLoaded(true);
        setIsLoadingModel(false);
        modelLoadingPromiseRef.current = null;
      } else if (modelLoadingPromiseRef.current) {
        // Attendre chargement en cours
        await modelLoadingPromiseRef.current;
        setModelLoaded(true);
        setIsLoadingModel(false);
        modelLoadingPromiseRef.current = null;
      }

      // Analyser image (détection + enrichissement si autoEnrich)
      const foods = autoEnrich
        ? await analyzeFoodImageComplete(imageSource, {
            minConfidence,
            useCache
          })
        : await analyzeFoodImage(imageSource, {
            minConfidence,
            topK: 5,
            useCache
          });

      if (!analyzingRef.current) {
        // Analyse annulée
        return;
      }

      log.debug('[useNutritionFoodRecognition] Analyse terminée', { count: foods.length });

      if (foods.length === 0) {
        setError('Aucun aliment détecté dans l\'image');
        showError('Aucun aliment détecté. Essayez avec une photo plus claire.');
        return;
      }

      // Mettre à jour état
      setDetectedFoods(foods);
      setEnrichedFoods(foods);

      // Callback si fourni
      if (onFoodsDetected) {
        onFoodsDetected({ foods });
      }

      // Feedback succès
      showSuccess(`${foods.length} aliment${foods.length > 1 ? 's' : ''} détecté${foods.length > 1 ? 's' : ''}`);
    } catch (error) {
      log.error('[useNutritionFoodRecognition] Erreur analyse photo:', error);
      
      const errorMsg = error.message || 'Erreur lors de l\'analyse de l\'image';
      setError(errorMsg);
      showError(errorMsg);
      
      setDetectedFoods([]);
      setEnrichedFoods([]);
    } finally {
      setIsAnalyzing(false);
      setIsLoadingModel(false);
      analyzingRef.current = false;
    }
  }, [
    isSupported,
    modelLoaded,
    minConfidence,
    useCache,
    autoEnrich,
    onFoodsDetected,
    showSuccess,
    showError
  ]);

  /**
   * Réinitialiser l'état du hook
   */
  const reset = useCallback(() => {
    setDetectedFoods([]);
    setEnrichedFoods([]);
    setError(null);
    setIsAnalyzing(false);
    analyzingRef.current = false;
  }, []);

  /**
   * Nettoyer le cache des prédictions
   */
  const clearCache = useCallback(() => {
    clearPredictionCache();
    log.debug('[useNutritionFoodRecognition] Cache nettoyé');
  }, []);

  /**
   * Décharger le modèle (libérer mémoire)
   */
  const unloadModel = useCallback(() => {
    unloadFoodModel();
    setModelLoaded(false);
    modelLoadingPromiseRef.current = null;
    log.debug('[useNutritionFoodRecognition] Modèle déchargé');
  }, []);

  return {
    // État
    isAnalyzing,
    isLoadingModel,
    detectedFoods,
    enrichedFoods,
    error,
    isSupported,
    modelLoaded,

    // Méthodes
    analyzePhoto,
    reset,
    clearCache,
    preloadModel,
    unloadModel
  };
};

