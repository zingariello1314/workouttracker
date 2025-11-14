/**
 * useNutritionVoiceInput.js
 * 
 * Hook React pour la saisie vocale d'aliments.
 * 
 * Fonctionnalités :
 * - État : isListening, transcript, parsedFoods, searching, error
 * - Méthodes : startListening, stopListening, clearTranscript
 * - Parsing automatique du transcript
 * - Recherche automatique des aliments trouvés
 * - Gestion erreurs et permissions
 * - Debounce démarrage (éviter démarrages multiples)
 * 
 * Architecture :
 * - Service : `nutritionVoiceInput.js` (Web Speech API + parsing)
 * - Performance : Debounce 300ms, nettoyage automatique
 * - UX : Feedback visuel, gestion permissions
 * 
 * @module hooks/useNutritionVoiceInput
 * @see ../../../nouvelongletnutritionplan.md Section 2.1
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  isSpeechSupported,
  createSpeechRecognition,
  parseMealFromSpeech,
  searchFoodsFromVoice,
  getSpeechErrorMessage
} from '../services/nutrition/nutritionVoiceInput';
import logger from '../utils/logger';

const log = logger.module('useNutritionVoiceInput');

/**
 * Hook pour la saisie vocale d'aliments
 * 
 * @param {Object} options - Options du hook
 * @param {string} options.lang - Langue (défaut: 'fr-FR')
 * @param {Function} options.onFoodsParsed - Callback appelé avec les aliments parsés { foods, transcript }
 * @param {boolean} options.autoSearch - Rechercher automatiquement les aliments (défaut: true)
 * @returns {Object} Interface du hook
 */
export const useNutritionVoiceInput = (options = {}) => {
  const {
    lang = 'fr-FR',
    onFoodsParsed = null,
    autoSearch = true
  } = options;

  // État
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsedFoods, setParsedFoods] = useState([]);
  const [searchedFoods, setSearchedFoods] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(false);

  // Refs
  const recognitionRef = useRef(null);
  const startTimeoutRef = useRef(null);
  const isListeningRef = useRef(false); // Garder synchro avec état

  // Vérifier support au démarrage
  useEffect(() => {
    const supported = isSpeechSupported();
    setIsSupported(supported);

    if (!supported) {
      log.warn('[useNutritionVoiceInput] Web Speech API non supporté');
      setError('Reconnaissance vocale non supportée par votre navigateur');
    }
  }, []);

  // Nettoyage à la fermeture
  useEffect(() => {
    return () => {
      // Nettoyer reconnaissance
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current.abort();
        } catch (err) {
          // Ignorer erreurs lors nettoyage
        }
        recognitionRef.current = null;
      }

      // Nettoyer timeout
      if (startTimeoutRef.current) {
        clearTimeout(startTimeoutRef.current);
        startTimeoutRef.current = null;
      }
    };
  }, []);

  /**
   * Démarrer la reconnaissance vocale
   */
  const startListening = useCallback(() => {
    // Vérifier support
    if (!isSupported) {
      log.warn('[startListening] Web Speech API non supporté');
      setError('Reconnaissance vocale non supportée');
      return;
    }

    // Éviter démarrage multiple (debounce)
    if (isListeningRef.current || startTimeoutRef.current) {
      log.debug('[startListening] Déjà en cours ou timeout actif');
      return;
    }

    // Debounce 300ms (éviter clics multiples)
    startTimeoutRef.current = setTimeout(() => {
      startTimeoutRef.current = null;

      try {
        // Créer instance reconnaissance si pas déjà créée
        if (!recognitionRef.current) {
          recognitionRef.current = createSpeechRecognition({
            lang,
            continuous: false,
            interimResults: false,
            maxAlternatives: 1
          });

          if (!recognitionRef.current) {
            throw new Error('Impossible de créer instance SpeechRecognition');
          }

          // Configuration événements
          recognitionRef.current.onstart = () => {
            log.debug('[startListening] Reconnaissance démarrée');
            setIsListening(true);
            isListeningRef.current = true;
            setError(null);
            setTranscript('');
          };

          recognitionRef.current.onresult = async (event) => {
            try {
              const result = event.results[0][0];
              const transcriptText = result.transcript;

              log.debug('[startListening] Transcript reçu', { transcript: transcriptText });

              setTranscript(transcriptText);

              // Parser le transcript
              const parsed = parseMealFromSpeech(transcriptText);
              setParsedFoods(parsed);

              log.debug('[startListening] Aliments parsés', {
                count: parsed.length,
                foods: parsed
              });

              // Rechercher les aliments automatiquement si activé
              if (autoSearch && parsed.length > 0) {
                setSearching(true);
                try {
                  const searched = await searchFoodsFromVoice(parsed);
                  setSearchedFoods(searched);

                  log.debug('[startListening] Aliments recherchés', {
                    count: searched.length,
                    found: searched.filter(f => !f.needsManualInput).length
                  });

                  // Appeler callback si fourni
                  if (onFoodsParsed) {
                    onFoodsParsed({
                      foods: searched,
                      transcript: transcriptText,
                      parsedFoods: parsed
                    });
                  }
                } catch (searchError) {
                  log.error('[startListening] Erreur recherche aliments:', searchError);
                  setError('Erreur lors de la recherche des aliments');
                  
                  // Utiliser aliments parsés même si recherche échoue
                  if (onFoodsParsed) {
                    onFoodsParsed({
                      foods: parsed.map(f => ({
                        id: `voice_${Date.now()}_${Math.random()}`,
                        name: f.name,
                        source: 'voice',
                        quantity: f.quantity,
                        unit: f.unit,
                        caloriesPer100: 0,
                        proteinPer100: 0,
                        carbsPer100: 0,
                        fatPer100: 0,
                        needsManualInput: true
                      })),
                      transcript: transcriptText,
                      parsedFoods: parsed
                    });
                  }
                } finally {
                  setSearching(false);
                }
              } else if (onFoodsParsed && parsed.length > 0) {
                // Appeler callback avec aliments parsés seulement
                onFoodsParsed({
                  foods: parsed.map(f => ({
                    id: `voice_${Date.now()}_${Math.random()}`,
                    name: f.name,
                    source: 'voice',
                    quantity: f.quantity,
                    unit: f.unit,
                    caloriesPer100: 0,
                    proteinPer100: 0,
                    carbsPer100: 0,
                    fatPer100: 0,
                    needsManualInput: true
                  })),
                  transcript: transcriptText,
                  parsedFoods: parsed
                });
              }

              // Arrêter après résultat
              stopListening();
            } catch (parseError) {
              log.error('[startListening] Erreur parsing:', parseError);
              setError('Erreur lors du traitement du texte');
              stopListening();
            }
          };

          recognitionRef.current.onerror = (event) => {
            const errorCode = event.error;
            const errorMessage = getSpeechErrorMessage(errorCode);

            log.warn('[startListening] Erreur reconnaissance', {
              error: errorCode,
              message: errorMessage
            });

            setError(errorMessage);
            setIsListening(false);
            isListeningRef.current = false;

            // Ne pas arrêter si c'est juste "no-speech" (timeout normal)
            if (errorCode !== 'no-speech') {
              stopListening();
            }
          };

          recognitionRef.current.onend = () => {
            log.debug('[startListening] Reconnaissance terminée');
            setIsListening(false);
            isListeningRef.current = false;
          };
        }

        // Démarrer reconnaissance
        recognitionRef.current.start();
        log.debug('[startListening] Demande de démarrage envoyée');

      } catch (err) {
        log.error('[startListening] Erreur démarrage:', err);
        setError(err.message || 'Erreur lors du démarrage de la reconnaissance vocale');
        setIsListening(false);
        isListeningRef.current = false;
        startTimeoutRef.current = null;
      }
    }, 300); // Debounce 300ms

  }, [isSupported, lang, autoSearch, onFoodsParsed]);

  /**
   * Arrêter la reconnaissance vocale
   */
  const stopListening = useCallback(() => {
    // Nettoyer timeout si présent
    if (startTimeoutRef.current) {
      clearTimeout(startTimeoutRef.current);
      startTimeoutRef.current = null;
    }

    // Arrêter reconnaissance
    if (recognitionRef.current && isListeningRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current.abort();
      } catch (err) {
        // Ignorer erreurs lors arrêt
        log.debug('[stopListening] Erreur arrêt (ignorée):', err);
      }
    }

    setIsListening(false);
    isListeningRef.current = false;

    log.debug('[stopListening] Reconnaissance arrêtée');
  }, []);

  /**
   * Réinitialiser le transcript et les aliments
   */
  const clearTranscript = useCallback(() => {
    setTranscript('');
    setParsedFoods([]);
    setSearchedFoods([]);
    setError(null);
    log.debug('[clearTranscript] Transcript réinitialisé');
  }, []);

  /**
   * Réinitialiser complètement (état + reconnaissance)
   */
  const reset = useCallback(() => {
    stopListening();
    clearTranscript();
    
    // Réinitialiser instance reconnaissance
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current.abort();
      } catch (err) {
        // Ignorer
      }
      recognitionRef.current = null;
    }

    log.debug('[reset] État réinitialisé complètement');
  }, [stopListening, clearTranscript]);

  return {
    // État
    isListening,
    transcript,
    parsedFoods,
    searchedFoods,
    searching,
    error,
    isSupported,

    // Méthodes
    startListening,
    stopListening,
    clearTranscript,
    reset
  };
};

export default useNutritionVoiceInput;

