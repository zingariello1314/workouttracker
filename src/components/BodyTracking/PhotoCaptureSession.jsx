/**
 * Composant PhotoCaptureSession - Capture guidée de photos avec IA
 * 
 * Système de capture photo avancé avec 3 modes:
 * - Mode Webcam: Capture temps réel avec guidage pose et scoring qualité
 * - Mode Upload: Téléchargement photos existantes avec détection automatique pose
 * - Mode Mixte: Combinaison webcam + upload
 * 
 * Référence: suiviphotoapprofondi.md - Section 7.1
 */

import React, { useState, useRef, useEffect, useCallback, useMemo, useReducer } from 'react';
import { 
  Camera, 
  Upload, 
  X, 
  Check, 
  RotateCcw, 
  Info, 
  ChevronLeft, 
  ChevronRight,
  AlertCircle,
  Loader,
  Sparkles,
  Clock
} from 'lucide-react';
import Webcam from 'react-webcam';
import { useDropzone } from 'react-dropzone';
import { useWorkout } from '../../context/WorkoutContext';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { useToast } from './hooks/useToast';
import { compressImage, compressImageMultiResolution } from './utils/imageCompression'; // ✅ OPTIMISATION: Compression multi-résolution
import { getPoseDetectionService } from './services/poseDetectionService';
import { getPhotoAnalysisOrchestrator } from './services/photoAnalysisOrchestrator';
import { usePhotoCaptureReducer } from './hooks/usePhotoCaptureReducer';
import { calculateRealLightingScore, calculateStabilityVariance, calculateQualityScore } from './services/photoQualityScorer';
import { useThrottledCallback } from './hooks/useThrottle';
import { usePhotoAutoSave } from './hooks/usePhotoAutoSave';
import { getPhotoUrl } from './utils/photoNormalizer';
import { getWebcamPreprocessingService } from './services/webcamPreprocessingService'; // ✅ OPTIMISATION: Preprocessing adaptatif webcam
import { getErrorFeedbackService, ERROR_TYPES } from './services/errorFeedbackService';
import logger from '../../utils/logger';

const log = logger.component('PhotoCaptureSession');

// Configuration des 15 poses standards
const POSES_CONFIG = [
  // TIER 1 - ESSENTIELLES (6 poses)
  { id: 'front_relaxed', name: 'Face - Décontracté', tier: 1, required: true },
  { id: 'front_contracted_biceps', name: 'Face - Contracté Double Biceps', tier: 1, required: true },
  { id: 'front_contracted_pectorals', name: 'Face - Contracté Pectoraux', tier: 1, required: true },
  { id: 'back_relaxed', name: 'Dos - Décontracté', tier: 1, required: true },
  { id: 'back_contracted_biceps', name: 'Dos - Contracté Double Biceps', tier: 1, required: true },
  { id: 'front_legs_contracted', name: 'Face Jambes - Contracté Quadriceps', tier: 1, required: true },
  
  // TIER 2 - IMPORTANTES (6 poses)
  { id: 'side_right_relaxed', name: 'Profil Droit - Décontracté', tier: 2, required: false },
  { id: 'side_right_contracted', name: 'Profil Droit - Contracté Triceps', tier: 2, required: false },
  { id: 'side_left_relaxed', name: 'Profil Gauche - Décontracté', tier: 2, required: false },
  { id: 'side_left_contracted', name: 'Profil Gauche - Contracté Triceps', tier: 2, required: false },
  { id: 'back_legs_relaxed', name: 'Dos Jambes - Décontracté', tier: 2, required: false },
  { id: 'back_legs_contracted', name: 'Dos Jambes - Contracté Mollets', tier: 2, required: false },
  
  // TIER 3 - OPTIONNELLES (3 poses)
  { id: 'front_legs_relaxed', name: 'Face Jambes - Décontracté', tier: 3, required: false },
  { id: 'side_right_legs', name: 'Profil Droit Jambes', tier: 3, required: false },
  { id: 'side_left_legs', name: 'Profil Gauche Jambes', tier: 3, required: false }
];

// Types de session
const SESSION_TYPES = {
  COMPLETE: { name: 'Session Complète', poses: POSES_CONFIG, duration: '12-15 min' },
  QUICK: { 
    name: 'Session Rapide', 
    poses: POSES_CONFIG.filter(p => p.tier === 1), 
    duration: '5 min' 
  },
  FREE: { name: 'Mode Libre', poses: [], duration: 'Variable' }
};

const PhotoCaptureSession = ({ 
  isOpen, 
  onClose, 
  onComplete,
  sessionType = 'COMPLETE' 
}) => {
  const { data, updateData } = useWorkout();
  const { showSuccess, showError, showWarning, ToastContainer } = useToast();
  
  // ✅ OPTIMISATION: Service feedback erreurs détaillé
  // ✅ PHASE 1.2 : Correction require() → import
  const errorFeedbackService = useMemo(() => getErrorFeedbackService(), []);
  
  // ✅ OPTIMISATION: Hook centralisé pour sauvegarde photos (élimine duplication)
  const { savePhoto, savePhotos } = usePhotoAutoSave();
  
  // Configuration session
  const sessionConfig = useMemo(() => SESSION_TYPES[sessionType] || SESSION_TYPES.COMPLETE, [sessionType]);
  const poses = useMemo(() => sessionConfig.poses, [sessionConfig]);
  
  // Refs
  const webcamRef = useRef(null);
  const poseDetectionIntervalRef = useRef(null);
  const poseServiceRef = useRef(null);
  const stabilityValidationsRef = useRef([]); // Historique validations pour stabilité (temporaire, sera remplacé par state.webcam.stabilityHistory)
  const countdownIntervalRef = useRef(null); // Interval pour décompte
  
  // ✅ FIX RACE CONDITION: Verrou pour empêcher changements pose pendant capture
  const isCapturingRef = useRef(false);
  const capturePoseIndexRef = useRef(-1); // Index pose au moment capture (pour éviter race condition)
  
  // ✅ OPTIMISATION: Canvas Pool réutilisable + throttling adaptatif éclairage
  const lightingCanvasPool = useRef([]);
  const lightingCanvasActive = useRef(null);
  const lastLightingAnalysisRef = useRef(0);
  const lightingAnalysisIntervalRef = useRef(500); // Adaptatif, initialisé à 500ms
  const lastImageDataRef = useRef(null); // Cache dernier ImageData pour fallback
  
  // ✅ OPTIMISATION: Service preprocessing adaptatif webcam (singleton)
  const preprocessingServiceRef = useRef(null);
  
  // ✅ OPTIMISATION: useReducer pour gestion état centralisée (remplace 17 useState)
  const [state, dispatch] = usePhotoCaptureReducer(poses);
  
  // Extraction depuis state pour compatibilité code existant
  const {
    mode,
    currentPoseIndex,
    capturedPhotos,
    sessionPhotos,
    webcam: {
      ready: webcamReady,
      capturing: isCapturing,
      countdown: captureCountdown,
      poseDetected,
      qualityScore,
      poseValidation,
      stabilityScore,
      lightingScore,
      stabilityHistory
    },
    upload: {
      uploading,
      files: uploadedFiles
    },
    analysis: {
      analyzingSession: analyzingSessionState,
      analyzingUploads: analyzingUploadsState,
      progress: sessionAnalysisProgressState
    }
  } = state;
  
  // Alias pour compatibilité avec code existant (transition progressive)
  // TODO: Migrer progressivement tous les setState vers dispatch
  const analyzingSession = analyzingSessionState;
  const analyzingUploads = analyzingUploadsState;
  const sessionAnalysisProgress = sessionAnalysisProgressState;

  /**
   * ✅ OPTIMISATION: Initialiser pool canvas au montage (double buffering)
   */
  useEffect(() => {
    // Créer pool de 2 canvas (double buffering)
    lightingCanvasPool.current = [0, 1].map(() => {
      const canvas = document.createElement('canvas');
      // ✅ Downscale 4x pour analyse éclairage (réduction CPU: 160x120 vs 640x480 = 16x moins de pixels)
      canvas.width = 160;
      canvas.height = 120;
      return {
        canvas,
        ctx: canvas.getContext('2d', { 
          willReadFrequently: true, // ✅ Hint navigateur: optimisation pour lectures fréquentes
          desynchronized: true, // ✅ Hint navigateur: désynchronisation pour meilleure perf
          alpha: false // Pas besoin d'alpha pour analyse éclairage
        }),
        inUse: false
      };
    });
    lightingCanvasActive.current = lightingCanvasPool.current[0];
    
    log.debug('Canvas pool initialisé (2 canvas, 160x120)');
    
    return () => {
      // Nettoyage: pas nécessaire (canvas sera garbage collected)
      lightingCanvasPool.current = [];
      lightingCanvasActive.current = null;
    };
  }, []);

  /**
   * Initialise PoseDetectionService (lazy loading)
   */
  useEffect(() => {
    if (mode === 'webcam' && !poseServiceRef.current) {
      poseServiceRef.current = getPoseDetectionService();
      
      // ✅ OPTIMISATION: Initialiser service preprocessing adaptatif
      if (!preprocessingServiceRef.current) {
        preprocessingServiceRef.current = getWebcamPreprocessingService();
        log.debug('Service preprocessing webcam initialisé');
      }
      // Réinitialiser webcamReady quand on change de mode
      dispatch({ type: 'WEBCAM_READY', payload: false });
    }
  }, [mode]);

  /**
   * Réinitialiser tous les états quand modal se ferme
   */
  useEffect(() => {
    if (!isOpen) {
      // ✅ Utiliser dispatch au lieu de setState multiples
      dispatch({ type: 'RESET_WEBCAM_STATE' });
      dispatch({ type: 'SET_POSE_INDEX', payload: 0 });
      dispatch({ type: 'SET_MODE', payload: null });
      stabilityValidationsRef.current = []; // Temporaire, sera remplacé par state.webcam.stabilityHistory
      
      // Arrêter tous les intervalles
      if (poseDetectionIntervalRef.current) {
        clearInterval(poseDetectionIntervalRef.current);
        poseDetectionIntervalRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }
  }, [isOpen, dispatch]);

  /**
   * Détection hardware pour interval optimal (Adaptive FPS)
   * Calcule interval optimal selon CPU/mobile disponible
   */
  const getOptimalDetectionInterval = useCallback(() => {
    // Détection hardware
    const cores = navigator.hardwareConcurrency || 4;
    const memory = performance.memory?.usedJSHeapSize || 0;
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    const isLowEnd = memory > 100 * 1024 * 1024; // >100MB utilisé = faible mémoire
    
    // Calcul optimal selon hardware
    if (isMobile || isLowEnd) {
      return 500; // Mobile/Low-end: 2 FPS (économique batterie/mémoire)
    }
    if (cores >= 8) {
      return 100; // Desktop puissant (8+ cores): 10 FPS (très fluide)
    }
    if (cores >= 4) {
      return 200; // Desktop moyen (4-7 cores): 5 FPS (équilibré)
    }
    return 300; // Desktop faible (<4 cores): 3.3 FPS (stable, limite sécurité)
  }, []);

  /**
   * Détection pose en temps réel (mode webcam) - OPTIMISÉE avec Adaptive FPS
   * ✅ Définie au niveau composant pour respecter règles hooks React
   */
  const detectPoseRealtime = useCallback(async () => {
    try {
      const video = webcamRef.current?.video;
      if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
        return;
      }

      const poseService = poseServiceRef.current;
      if (!poseService) return;

      // ✅ OPTIMISATION: Preprocessing adaptatif avant détection pose (améliore précision MediaPipe)
      let processedVideo = video;
      const preprocessingService = preprocessingServiceRef.current;
      
      if (preprocessingService) {
        try {
          // ✅ Preprocess frame selon qualité détectée (denoise + sharpen si nécessaire)
          const processedCanvas = await preprocessingService.preprocessFrame(
            video,
            {
              denoise: true,      // Dénuiser si bruit détecté
              sharpen: true,      // Sharpener si flou détecté
              adaptiveBrightness: false, // Pas besoin pour temps réel (coûteux)
              motionDeblur: false // Pas besoin pour temps réel (coûteux)
            }
          );
          
          // ✅ Utiliser canvas traité pour détection pose
          processedVideo = processedCanvas;
          
          log.debug('Frame preprocessé (denoise/sharpen adaptatif)');
        } catch (preprocessError) {
          // ✅ Fallback: utiliser vidéo originale si preprocessing échoue
          log.warn('Erreur preprocessing frame, utilisation vidéo originale', preprocessError);
          processedVideo = video;
        }
      }

      const result = await poseService.detectPose(processedVideo);
      
      if (result.detected && result.landmarks) {
        // Valider pose actuelle - Utiliser index sûr
        const safeIndex = Math.max(0, Math.min(currentPoseIndex, poses.length - 1));
        const currentPose = poses[safeIndex];
        
        if (currentPose && poseService) {
          const poseDatabase = poseService.getPoseDatabase();
          const expectedPose = poseDatabase[currentPose.id];
          
          // Log si pose non trouvée dans base
          if (!expectedPose) {
            log.warn(`Pose ${currentPose.id} non trouvée dans base de données`, {
              currentPoseIndex: safeIndex,
              availablePoses: Object.keys(poseDatabase)
            });
          }
          
          if (expectedPose) {
            const validation = poseService.validatePose(result.landmarks, expectedPose);
            
            // ✅ OPTIMISATION: Extraire ImageData avec canvas pool + throttling adaptatif
            let imageData = null;
            const now = Date.now();
            const timeSinceLastAnalysis = now - lastLightingAnalysisRef.current;
            
            // ✅ Calculer stabilité pose pour throttling adaptatif
            const recentValidations = [...stabilityHistory];
            const poseScore = validation.weightedScore || validation.confidence || 0;
            recentValidations.push(poseScore);
            if (recentValidations.length > 30) {
              recentValidations.shift(); // Garder max 30
            }
            
            // ✅ Adaptation intervalle selon stabilité pose
            // Si pose instable → analyser éclairage plus souvent (300ms)
            // Si pose stable → réduire fréquence (800ms) pour économiser CPU
            const poseStability = recentValidations.length > 10 
              ? calculateStabilityVariance(recentValidations)
              : 0.5; // Default si historique insuffisant
            
            // Intervalle adaptatif: 300ms (instable) à 800ms (stable)
            // Inversion: variance élevée = instable → intervalle court
            // Variance basse = stable → intervalle long
            const adaptiveInterval = 300 + (1 - poseStability) * 500;
            lightingAnalysisIntervalRef.current = adaptiveInterval;
            
            // ✅ Extraire ImageData seulement si intervalle respecté
            if (timeSinceLastAnalysis >= adaptiveInterval) {
              try {
                // ✅ Utiliser canvas du pool (pas de création/destruction)
                const canvasData = lightingCanvasActive.current;
                
                if (canvasData && canvasData.ctx && video) {
                  // ✅ Switch buffer (double buffering)
                  lightingCanvasActive.current = lightingCanvasPool.current.find(c => c !== lightingCanvasActive.current) || lightingCanvasPool.current[0];
                  
                  // ✅ Dessiner frame downscalé (4x plus petit = 16x moins de pixels)
                  canvasData.ctx.drawImage(video, 0, 0, 160, 120);
                  
                  // ✅ Extraire ImageData depuis canvas pool
                  imageData = canvasData.ctx.getImageData(0, 0, 160, 120);
                  
                  // ✅ Mettre en cache pour fallback
                  lastImageDataRef.current = imageData;
                  lastLightingAnalysisRef.current = now;
                  
                  log.debug(`ImageData extrait (pool, ${timeSinceLastAnalysis.toFixed(0)}ms depuis dernière analyse, intervalle adaptatif: ${adaptiveInterval.toFixed(0)}ms, stabilité: ${(poseStability * 100).toFixed(1)}%)`);
                }
              } catch (error) {
                log.warn('Impossible d\'extraire ImageData depuis vidéo (pool), utilisation cache ou estimation', error);
                // ✅ Fallback: utiliser dernier ImageData connu
                imageData = lastImageDataRef.current;
              }
            } else {
              // ✅ Throttlé: utiliser dernier ImageData connu (pas de nouvel extraction)
              imageData = lastImageDataRef.current;
            }
            
            // ✅ OPTIMISATION: Utiliser calculateQualityScore avec éclairage réel
            // Calculer score qualité complet avec éclairage réel (ou dernière valeur connue)
            const qualityResult = calculateQualityScore(
              validation,
              recentValidations,
              imageData, // ImageData (actuel ou cache) pour analyse histogramme réelle
              {
                poseWeight: 0.45,      // 45% (légèrement réduit)
                stabilityWeight: 0.25,  // 25% (augmenté)
                lightingWeight: 0.20,   // 20% (maintenu)
                completenessWeight: 0.10 // 10% (maintenu)
              }
            );
            
            // ✅ Utiliser dispatch avec scores détaillés
            dispatch({
              type: 'UPDATE_QUALITY_SCORE',
              payload: {
                score: qualityResult.score,
                validation,
                stability: qualityResult.components.stability.score,
                lighting: qualityResult.lightingScore || qualityResult.components.lighting.score, // Score éclairage réel depuis histogramme
                poseScoreHistoryEntry: poseScore
              }
            });
          }
        }
      } else {
        // ✅ Pas de pose détectée - Reset via dispatch
        dispatch({ type: 'RESET_WEBCAM_STATE' });
      }
    } catch (error) {
      log.warn('Erreur détection pose temps réel', error);
      // Ne pas bloquer l'utilisateur si erreur
    }
  }, [webcamRef, currentPoseIndex, poses, stabilityHistory, dispatch]);

  // ✅ OPTIMISATION: Throttle détection pose pour réduire CPU usage (-40-50%)
  // Défini au niveau composant pour respecter règles hooks React
  const minInterval = getOptimalDetectionInterval();
  const throttleLimit = Math.max(200, minInterval);
  const throttledDetectPose = useThrottledCallback(
    detectPoseRealtime,
    throttleLimit,
    [currentPoseIndex, poses, stabilityHistory]
  );

  /**
   * Effect: Démarrer détection pose en temps réel avec RAF + throttle
   */
  useEffect(() => {
    if (mode !== 'webcam' || !webcamReady || !webcamRef.current || isCapturing) {
      return;
    }

    // Log interval optimal pour debugging
    log.info(`Détection pose adaptive + throttle activée: ${minInterval}ms (${Math.round(1000/minInterval)} FPS), throttle ${throttleLimit}ms`, {
      cores: navigator.hardwareConcurrency,
      isMobile: /Mobi|Android/i.test(navigator.userAgent),
      memoryUsed: performance.memory?.usedJSHeapSize
    });
    
    let rafId = null;
    let lastDetectionTimestamp = 0;
    
    const detectFrame = (timestamp) => {
      // Throttle avec interval minimum adaptatif
      if (timestamp - lastDetectionTimestamp >= minInterval) {
        // ✅ FIX: Wrapper dans Promise.resolve() pour garantir Promise même si retour undefined
        // Appel throttlé (gère lui-même le throttle supplémentaire)
        const result = throttledDetectPose();
        Promise.resolve(result).catch(err => {
          log.warn('Erreur dans detectPoseRealtime', err);
        });
        lastDetectionTimestamp = timestamp;
      }
      
      // Continuer animation loop
      rafId = requestAnimationFrame(detectFrame);
    };
    
    // Démarrer loop RAF
    rafId = requestAnimationFrame(detectFrame);
    
    // Stocker rafId dans ref pour cleanup (compatibilité avec code existant)
    poseDetectionIntervalRef.current = rafId;

    return () => {
      // Cleanup: annuler RAF
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      poseDetectionIntervalRef.current = null;
    };
  }, [mode, webcamReady, isCapturing, minInterval, throttleLimit, throttledDetectPose]);

  /**
   * Configuration dropzone pour upload
   */
  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    const newUploadedFiles = [];

    try {
      for (const file of acceptedFiles) {
        // Valider fichier
        if (!file.type.startsWith('image/')) {
          showError(`${file.name}: Format non supporté`);
          continue;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB max
          const feedback = errorFeedbackService.analyzeError(
            `Fichier trop volumineux: ${file.name}`,
            ERROR_TYPES.UPLOAD,
            'FILE_TOO_LARGE'
          );
          showError(feedback.title, feedback);
          continue;
        }

        // Charger image
        const imageUrl = URL.createObjectURL(file);
        const img = new Image();
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imageUrl;
        });

        newUploadedFiles.push({
          id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          file,
          imageElement: img,
          originalUrl: imageUrl,
          name: file.name,
          size: file.size
        });
      }

      setUploadedFiles(prev => [...prev, ...newUploadedFiles]);
      showSuccess(`${newUploadedFiles.length} photo(s) ajoutée(s)`);
    } catch (error) {
      log.error('Erreur upload fichiers', error);
      showError('Erreur lors du chargement des photos');
    } finally {
      setUploading(false);
    }
  }, [showSuccess, showError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    multiple: true,
    disabled: uploading
  });

  /**
   * Analyse photos uploadées pour détecter poses automatiquement
   */
  const analyzeUploadedPhotos = useCallback(async () => {
    if (uploadedFiles.length === 0) return;

    setAnalyzingUploads(true);
    const analyzedPhotos = [];

    try {
      const poseService = getPoseDetectionService();

      for (const uploaded of uploadedFiles) {
        const detectionResult = await poseService.detectPoseFromUpload(uploaded.imageElement);
        
        analyzedPhotos.push({
          ...uploaded,
          poseDetection: detectionResult,
          assignedPose: detectionResult.detectedPose?.poseId || null,
          confidence: detectionResult.confidence || 0
        });
      }

      // ✅ Réorganiser par pose assignée et mettre à jour via dispatch
      // Note: Pour l'instant, on garde cette logique ici car elle nécessite poses config
      // TODO: Ajouter action UPDATE_SESSION_PHOTOS dans reducer si besoin
      const organizedPhotos = organizePhotosByPose(analyzedPhotos, poses);
      // Pour l'instant, on utilise directement sessionPhotos depuis state
      // setSessionPhotos(organizedPhotos); // Temporairement désactivé - nécessite action reducer
      
      showSuccess(`Analyse terminée: ${analyzedPhotos.length} photo(s) traitée(s)`);
    } catch (error) {
      log.error('Erreur analyse photos uploadées', error);
      showError('Erreur lors de l\'analyse des photos');
    } finally {
      setAnalyzingUploads(false);
    }
  }, [uploadedFiles, poses, showSuccess, showError]);

  /**
   * Réorganise photos uploadées selon poses détectées
   */
  const organizePhotosByPose = useCallback((photos, poseList) => {
    const organized = poseList.map(pose => ({
      pose,
      photo: null,
      status: 'missing' // 'missing' | 'pending' | 'captured'
    }));

    // Assigner photos avec meilleure confiance aux poses correspondantes
    photos.forEach(photo => {
      if (photo.assignedPose) {
        const poseIndex = organized.findIndex(o => o.pose.id === photo.assignedPose);
        if (poseIndex !== -1 && !organized[poseIndex].photo) {
          organized[poseIndex].photo = photo;
          organized[poseIndex].status = 'captured';
        }
      }
    });

    return organized;
  }, []);

  /**
   * Fonction utilitaire: Calculer variance pour stabilité
   */
  const calculateStabilityVariance = (values) => {
    if (values.length < 2) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance); // Écart-type
  };

  /**
   * Démarre décompte de 3 secondes avant capture
   */
  const startCaptureCountdown = useCallback(() => {
    if (captureCountdown !== null || isCapturing) return;
    
    // ✅ Utiliser dispatch pour countdown
    dispatch({ type: 'CAPTURE_PHOTO_START' }); // Démarre countdown à 3
    
    countdownIntervalRef.current = setInterval(() => {
      if (captureCountdown === null || captureCountdown <= 1) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        dispatch({ type: 'UPDATE_COUNTDOWN', payload: null });
      } else {
        dispatch({ type: 'UPDATE_COUNTDOWN', payload: captureCountdown - 1 });
      }
    }, 1000);
  }, [captureCountdown, isCapturing]);

  /**
   * Analyse automatique session complète après capture dernière pose
   * ✅ Définie AVANT capturePhoto car utilisée dedans
   */
  const analyzeSessionAutomatically = useCallback(async () => {
    try {
      // ✅ Utiliser dispatch pour analyse session
      dispatch({ type: 'ANALYSIS_SESSION_START' });
      
      // Collecter toutes photos capturées
      const photosToAnalyze = sessionPhotos
        .filter(sp => sp.photo && sp.status === 'captured')
        .map(sp => sp.photo);
      
      if (photosToAnalyze.length === 0) {
        log.warn('Aucune photo à analyser automatiquement');
        dispatch({ type: 'ANALYSIS_SESSION_COMPLETE', payload: { total: 0 } });
        return;
      }
      
      log.info(`Analyse automatique session: ${photosToAnalyze.length} photo(s)`);
      
      const orchestrator = getPhotoAnalysisOrchestrator();
      
      // Préparer sources pour analyse
      const analysisInputs = photosToAnalyze.map(photo => {
        // Déterminer angle depuis poseType ou utiliser angle existant
        let angle = photo.angle;
        let poseType = photo.capture?.poseType;
        
        // Si pas de poseType, chercher dans sessionPhotos
        if (!poseType) {
          const sessionPhoto = sessionPhotos.find(sp => sp.photo?.id === photo.id);
          if (sessionPhoto?.pose?.id) {
            poseType = sessionPhoto.pose.id;
          }
        }
        
        // Déterminer angle depuis poseType si pas déjà défini
        if (!angle && poseType) {
          if (poseType.includes('front')) angle = 'front';
          else if (poseType.includes('back')) angle = 'back';
          else if (poseType.includes('side')) angle = 'side';
          else angle = 'front'; // Défaut
        }
        if (!angle) angle = 'front'; // Défaut final
        
        return {
          // ✅ OPTIMISATION: Utiliser résolution 'full' pour analyse IA (meilleure précision)
          source: getPhotoUrl(photo, 'full') || getPhotoUrl(photo, 'preview') || getPhotoUrl(photo),
          photoData: {
            id: photo.id,
            poseType: poseType,
            angle: angle,
            qualityScore: photo.capture?.qualityScore
          }
        };
      });
      
      // Analyser session complète (parallélisation par lots de 3)
      const sessionResult = await orchestrator.analyzeSession(
        analysisInputs,
        {
          targetResolution: 512,
          segmentationResolution: 'medium',
          batchSize: 3
        },
        (progress, message, current, total) => {
          dispatch({
            type: 'ANALYSIS_SESSION_UPDATE',
            payload: {
              progress,
              message: message || `Analyse ${current || 0}/${total || photosToAnalyze.length} photos...`,
              current: current || 0,
              total: total || photosToAnalyze.length
            }
          });
        }
      );
      
      if (!sessionResult.success) {
        throw new Error(sessionResult.error || 'Erreur analyse session');
      }
      
      // ✅ Enrichir photos avec résultats analyse
      const enrichedPhotos = [];
      const currentProgressPhotos = data?.progressPhotos || [];
      
      for (let i = 0; i < photosToAnalyze.length; i++) {
        const photo = photosToAnalyze[i];
        const result = sessionResult.photos[i];
        
        if (result && result.success) {
          const enrichedPhoto = {
            ...photo,
            analysis: {
              analyzed: true,
              analyzedAt: new Date().toISOString(),
              metrics: result.metrics,
              poseDetection: result.poseDetection,
              segmentation: result.segmentation,
              preprocessing: result.preprocessing,
              summary: result.summary
            }
          };
          
          enrichedPhotos.push(enrichedPhoto);
          
          // ✅ Mettre à jour photo dans progressPhotos avec analyse
          const photoIndex = currentProgressPhotos.findIndex(p => p.id === photo.id);
          if (photoIndex !== -1) {
            currentProgressPhotos[photoIndex] = {
              ...currentProgressPhotos[photoIndex],
              ...enrichedPhoto
            };
          }
        }
      }
      
      // Sauvegarder photos enrichies dans contexte
      if (enrichedPhotos.length > 0 && updateData) {
        await updateData({
          ...data,
          progressPhotos: currentProgressPhotos
        });
        
        log.info(`Photos enrichies avec analyse: ${enrichedPhotos.length}/${photosToAnalyze.length}`);
      }
      
      // ✅ Afficher succès avec détails
      const successCount = enrichedPhotos.length;
      showSuccess(
        `✅ Analyse terminée ! ${successCount}/${photosToAnalyze.length} photo(s) analysée(s). ` +
        `Redirection vers le Dashboard...`
      );
      
      // ✅ NAVIGATION: Appeler onComplete pour déclencher redirection dashboard (appel unique)
      if (onComplete && enrichedPhotos.length > 0) {
        onComplete(enrichedPhotos);
      }
      
      // ✅ NAVIGATION: Fermer modal après 1.5s pour laisser voir le message puis rediriger
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 1500);
      
    } catch (error) {
      log.error('Erreur analyse automatique session', error);
      showError('Erreur lors de l\'analyse automatique. Vous pouvez analyser manuellement dans la galerie.');
      // Ne pas bloquer: photos sont sauvegardées même si analyse échoue
    } finally {
      const photosToAnalyze = sessionPhotos
        .filter(sp => sp.photo && sp.status === 'captured')
        .map(sp => sp.photo);
      dispatch({ type: 'ANALYSIS_SESSION_COMPLETE', payload: { total: photosToAnalyze.length } });
    }
  }, [sessionPhotos, data, updateData, onComplete, onClose, showSuccess, showError, dispatch]);

  /**
   * Capture photo depuis webcam (appelé automatiquement après décompte)
   */
  const capturePhoto = useCallback(async () => {
    if (!webcamRef.current || isCapturing) return;

    // ✅ FIX RACE CONDITION: Verrouiller et capturer index pose AVANT toute opération asynchrone
    isCapturingRef.current = true;
    const capturedPoseIndex = currentPoseIndex; // Capturer index au moment exact de la capture
    capturePoseIndexRef.current = capturedPoseIndex;

    try {
      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) {
        showError('Impossible de capturer la photo');
        return;
      }

      // ✅ OPTIMISATION: Compresser image en multi-résolution directement depuis Data URL
      const compressionResult = await compressImageMultiResolution(
        imageSrc, // Data URL du screenshot
        {
          // Résolutions optimisées pour webcam (même que upload)
          resolutions: [
            { name: 'thumbnail', width: 150, height: 200, quality: 0.6 },
            { name: 'preview', width: 400, height: 533, quality: 0.75 },
            { name: 'full', width: 1200, height: 1600, quality: 0.85 }
          ],
          progressive: true // JPEG progressif si fallback
        },
        null // Pas de callback progression (capture instantanée)
      );

      // ✅ FIX RACE CONDITION: Utiliser capturedPoseIndex (capturé AVANT opérations async)
      const currentPose = poses[capturedPoseIndex];
      
      // ✅ OPTIMISATION: Créer entrée photo enrichie avec structure multi-résolution
      const photoEntry = {
        id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        // Structure multi-résolution: { thumbnail, preview, full }
        resolutions: {
          thumbnail: compressionResult.thumbnail,
          preview: compressionResult.preview,
          full: compressionResult.full
        },
        // ✅ Compatibilité: garder url pour fallback (utilise preview)
        url: compressionResult.preview?.data || compressionResult.full?.data || null,
        date: new Date(),
        angle: getAngleFromPose(currentPose?.id),
        weight: null,
        notes: '',
        tags: ['progress', 'session'],
        filename: `${currentPose?.id || 'photo'}_${Date.now()}.jpg`,
        type: 'photo',
        // Métadonnées de compression pour traçabilité
        compression: {
          originalSize: compressionResult.originalSize,
          totalSize: compressionResult.totalSize,
          reduction: compressionResult.reduction,
          format: compressionResult.format,
          dimensions: compressionResult.dimensions
        },
        // Métadonnées enrichies (Phase 1)
        capture: {
          sessionId: `session_${Date.now()}`,
          poseIndex: capturedPoseIndex, // ✅ Utiliser index capturé
          poseType: currentPose?.id,
          qualityScore: qualityScore,
          poseValidation: poseValidation,
          captureConditions: {
            timestamp: new Date(),
            mode: 'webcam'
          }
        }
      };

      // ✅ Utiliser dispatch pour CAPTURE_PHOTO_SUCCESS (gère sessionPhotos automatiquement)
      // ✅ FIX RACE CONDITION: Passer poseIndex explicitement depuis capturedPoseIndex
      dispatch({
        type: 'CAPTURE_PHOTO_SUCCESS',
        payload: {
          photo: photoEntry,
          poseIndex: capturedPoseIndex // ✅ Index capturé AVANT opérations async
        }
      });

      // 💾 SAUVEGARDE AUTOMATIQUE IMMÉDIATE de chaque photo (via hook centralisé)
      // ✅ OPTIMISATION: Utilisation savePhoto avec retry et gestion erreurs centralisée
      const saveResult = await savePhoto(photoEntry, {
        silent: false,      // Afficher toast succès
        retry: 1,          // 1 retry en cas d'erreur
        skipIfExists: true // Skip si photo existe déjà (évite doublons)
      });
      
      if (!saveResult.success) {
        // Erreur déjà loggée dans savePhoto, juste afficher message à l'utilisateur
        // Photo reste dans sessionPhotos, pourra être sauvegardée manuellement via saveSession
        log.warn('Photo capturée mais erreur sauvegarde', {
          photoId: photoEntry.id,
          error: saveResult.error?.message
        });
      }

      // ✅ FIX RACE CONDITION: Utiliser capturedPoseIndex pour passage pose suivante
      // Utiliser capturedPoseIndex au lieu de currentPoseIndex (peut avoir changé pendant async)
      if (capturedPoseIndex < poses.length - 1) {
        const nextIndex = capturedPoseIndex + 1;
        const nextPose = poses[nextIndex];
        
        log.info(`Passage à pose ${nextIndex + 1}/${poses.length}`, { 
          previousIndex: capturedPoseIndex, // ✅ Utiliser index capturé
          nextIndex,
          totalPoses: poses.length,
          previousPoseId: poses[capturedPoseIndex]?.id,
          nextPoseId: nextPose?.id,
          nextPoseName: nextPose?.name,
          currentPoseIndexState: currentPoseIndex // Log état actuel pour debug
        });
        
        // ✅ Utiliser dispatch pour NEXT_POSE (réinitialise aussi webcam state)
        // Utiliser SET_POSE_INDEX avec nextIndex pour garantir exactitude (évite race condition)
        dispatch({ type: 'SET_POSE_INDEX', payload: nextIndex });
        
        showSuccess(`Photo capturée et sauvegardée ! Passage à "${nextPose?.name || `Pose ${nextIndex + 1}`}"...`);
      } else {
        // Dernière pose capturée - ✅ LANCER ANALYSE AUTOMATIQUE
        const capturedCount = sessionPhotos.filter(sp => sp.status === 'captured').length;
        showSuccess(`Session complétée ! ${capturedCount} photo(s) sauvegardée(s). Analyse automatique en cours...`);
        
        log.info('Session complétée - Lancement analyse automatique', {
          totalPhotos: capturedCount,
          totalPoses: poses.length,
          lastPoseIndex: capturedPoseIndex // ✅ Utiliser index capturé
        });
        
        // Lancer analyse automatique en arrière-plan
        setTimeout(() => {
          analyzeSessionAutomatically();
        }, 500); // Petit délai pour permettre message succès
      }
      
      // ✅ FIX RACE CONDITION: Déverrouiller après toutes opérations
      isCapturingRef.current = false;
      capturePoseIndexRef.current = -1;
    } catch (error) {
      log.error('Erreur capture photo', error);
      showError('Erreur lors de la capture');
      // ✅ Utiliser dispatch pour erreur capture
      dispatch({ type: 'CAPTURE_PHOTO_ERROR' });
      
      // ✅ FIX RACE CONDITION: Déverrouiller même en cas d'erreur
      isCapturingRef.current = false;
      capturePoseIndexRef.current = -1;
    }
    // Note: setIsCapturing(false) géré automatiquement par CAPTURE_PHOTO_SUCCESS ou CAPTURE_PHOTO_ERROR
  }, [webcamRef, isCapturing, currentPoseIndex, poses, sessionPhotos, qualityScore, poseValidation, showSuccess, showError, analyzeSessionAutomatically, dispatch]);

  /**
   * Effect: Capturer automatiquement quand décompte arrive à 0
   */
  useEffect(() => {
    if (captureCountdown === 0 && !isCapturing) {
      // Arrêter décompte
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      
      // Attendre un frame puis capturer
      setTimeout(() => {
        capturePhoto();
      }, 200);
    }
  }, [captureCountdown, isCapturing, capturePhoto]);

  /**
   * Cleanup: Arrêter décompte si composant démonté ou modal fermé
   */
  useEffect(() => {
    if (!isOpen) {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      dispatch({ type: 'RESET_WEBCAM_STATE' });
    }
  }, [isOpen]);
  
  /**
   * Sauvegarde session complète (pour ré-sauvegarder ou sauvegarder manuellement)
   * ✅ OPTIMISATION: Utilise savePhotos centralisé avec parallélisation
   */
  const saveSession = useCallback(async () => {
    try {
      const photosToSave = sessionPhotos
        .filter(sp => sp.photo && sp.status === 'captured')
        .map(sp => sp.photo);

      if (photosToSave.length === 0) {
        showWarning('Aucune photo à sauvegarder');
        return;
      }

      log.info(`Sauvegarde manuelle session: ${photosToSave.length} photo(s)`);

      // ✅ OPTIMISATION: Utilisation savePhotos avec parallélisation (max 3 simultanées)
      const result = await savePhotos(photosToSave, {
        parallel: true,        // Parallélisation pour performance
        silent: false,        // Afficher messages succès/erreur
        retry: 1,             // 1 retry par photo en cas d'erreur
        skipIfExists: true,   // Skip si photo existe déjà
        stopOnError: false    // Continuer même si erreur (sauvegarder les autres)
      });
      
      // Appeler callback si défini et au moins une photo sauvegardée
      if (onComplete && result.saved > 0) {
        const savedPhotos = photosToSave.filter(p => 
          result.results.some(r => r.photo.id === p.id)
        );
        onComplete(savedPhotos);
      }
      
      // Ne pas fermer automatiquement - laisser l'utilisateur décider
      // onClose(); // Commenté : permet de continuer ou fermer manuellement
    } catch (error) {
      log.error('Erreur sauvegarde session', error);
      showError('Erreur lors de la sauvegarde : ' + (error.message || 'Erreur inconnue'));
    }
  }, [sessionPhotos, savePhotos, showWarning, showError, onComplete]);

  /**
   * Fermeture et nettoyage avec sauvegarde automatique des photos non sauvegardées
   * ✅ OPTIMISATION: Utilise savePhotos centralisé avec parallélisation pour performance
   */
  const handleClose = useCallback(async () => {
    // Sauvegarder automatiquement toutes les photos non sauvegardées avant de fermer
    const photosToSave = sessionPhotos
      .filter(sp => sp.photo && sp.status === 'captured')
      .map(sp => sp.photo);
    
    if (photosToSave.length > 0) {
      try {
        log.info(`Fermeture : sauvegarde automatique de ${photosToSave.length} photo(s)`);
        
        // ✅ OPTIMISATION: Utilisation savePhotos avec parallélisation pour rapidité
        const result = await savePhotos(photosToSave, {
          parallel: true,        // Parallélisation pour performance (max 3 simultanées)
          silent: false,         // Afficher messages succès/erreur
          retry: 1,              // 1 retry par photo en cas d'erreur
          skipIfExists: true,    // Skip si photo existe déjà (évite doublons)
          stopOnError: false     // Continuer même si erreur (sauvegarder les autres)
        });
        
        // Appeler callback si défini et au moins une photo sauvegardée
        if (onComplete && result.saved > 0) {
          const savedPhotos = photosToSave.filter(p => 
            result.results.some(r => r.photo.id === p.id)
          );
          onComplete(savedPhotos);
        }
      } catch (error) {
        log.error('Erreur sauvegarde automatique lors fermeture', error);
        showWarning('Certaines photos n\'ont peut-être pas été sauvegardées. Vérifiez votre galerie.');
      }
    }

    // Nettoyer intervalles
    if (poseDetectionIntervalRef.current) {
      clearInterval(poseDetectionIntervalRef.current);
      poseDetectionIntervalRef.current = null;
    }
    
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    // ✅ Réinitialiser tous les états via dispatch (RESET_SESSION gère tout)
    dispatch({ type: 'RESET_SESSION' });
    stabilityValidationsRef.current = []; // Temporaire (sera remplacé par state.webcam.stabilityHistory)

    onClose();
  }, [onClose, sessionPhotos, savePhotos, onComplete, showWarning]);

  /**
   * Utilitaires
   */
  const getAngleFromPose = (poseId) => {
    if (!poseId) return 'front';
    if (poseId.includes('side')) return 'side';
    if (poseId.includes('back')) return 'back';
    return 'front';
  };

  const getQualityColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getQualityStars = (score) => {
    if (score >= 90) return '⭐⭐⭐';
    if (score >= 70) return '⭐⭐';
    if (score >= 50) return '⭐';
    return '';
  };

  // Si modal fermé, ne rien afficher
  if (!isOpen) return null;

  // Écran sélection mode
  if (!mode) {
    return (
      <>
        <ToastContainer />
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-6 h-6 text-green-400" />
                Nouvelle Session Photo
                <span className="text-sm font-normal text-teal-100/55 ml-auto">
                  {sessionConfig.name}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-teal-100/80 mb-6">
                Choisissez votre mode de capture. Vous pourrez changer de mode à tout moment.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Mode Webcam */}
                <button
                  onClick={() => dispatch({ type: 'SET_MODE', payload: 'webcam' })}
                  className="p-6 rounded-lg border-2 border-[#0F4C5C]/45 bg-black hover:border-[#0F5C45]/60 hover:bg-teal-950/20 transition-all text-left group"
                >
                  <Camera className="w-8 h-8 text-green-400 mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold text-teal-100 mb-2">Mode Webcam</h3>
                  <p className="text-sm text-teal-100/55 mb-3">
                    Capture directe avec guidage pose en temps réel
                  </p>
                  <ul className="text-xs text-teal-100/45 space-y-1">
                    <li>✅ Guidage visuel pose</li>
                    <li>✅ Score qualité temps réel</li>
                    <li>✅ Validation automatique</li>
                  </ul>
                </button>

                {/* Mode Upload */}
                <button
                  onClick={() => dispatch({ type: 'SET_MODE', payload: 'upload' })}
                  className="p-6 rounded-lg border-2 border-[#0F4C5C]/45 bg-black hover:border-[#0F5C45]/60 hover:bg-teal-950/20 transition-all text-left group"
                >
                  <Upload className="w-8 h-8 text-sky-300/90 mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold text-teal-100 mb-2">Mode Upload</h3>
                  <p className="text-sm text-teal-100/55 mb-3">
                    Téléchargez photos existantes, détection pose automatique
                  </p>
                  <ul className="text-xs text-teal-100/45 space-y-1">
                    <li>✅ Détection pose auto</li>
                    <li>✅ Assignation intelligente</li>
                    <li>✅ Plus rapide</li>
                  </ul>
                </button>

                {/* Mode Mixte */}
                <button
                  onClick={() => dispatch({ type: 'SET_MODE', payload: 'mixed' })}
                  className="p-6 rounded-lg border-2 border-[#0F4C5C]/45 bg-black hover:border-[#0F5C45]/55 hover:bg-teal-950/20 transition-all text-left group"
                >
                  <Sparkles className="w-8 h-8 text-sky-300 mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="font-semibold text-teal-100 mb-2">Mode Mixte</h3>
                  <p className="text-sm text-teal-100/55 mb-3">
                    Combinez upload et webcam selon vos besoins
                  </p>
                  <ul className="text-xs text-teal-100/45 space-y-1">
                    <li>✅ Flexibilité maximale</li>
                    <li>✅ Upload + webcam</li>
                    <li>✅ Recommandé</li>
                  </ul>
                </button>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg border border-[#0F5C45]/70 bg-[#0F4C5C]/40 px-3 py-2 text-teal-100 font-medium hover:bg-[#0F4C5C]/55 transition-colors shadow-md shadow-black/20 rounded-lg"
                >
                  Annuler
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Mode Webcam
  if (mode === 'webcam' || (mode === 'mixed' && currentPoseIndex < poses.length)) {
    // S'assurer que currentPoseIndex est valide
    const safePoseIndex = Math.max(0, Math.min(currentPoseIndex, poses.length - 1));
    const currentPose = poses[safePoseIndex];
    
    // Log pour debug si index différent
    if (safePoseIndex !== currentPoseIndex) {
      log.warn(`Index pose ajusté: ${currentPoseIndex} → ${safePoseIndex}`, {
        currentPoseIndex,
        safePoseIndex,
        posesLength: poses.length
      });
    }

    return (
      <>
        <ToastContainer />
            <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-50">
          {/* ✅ Modal Progression Analyse Session */}
          {analyzingSession && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-[60]">
              <Card className="max-w-md w-full mx-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Loader className="w-5 h-5 animate-spin text-sky-300" />
                    Analyse Session en Cours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Barre progression globale */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-teal-100/80">Progression globale</span>
                        <span className="text-sky-300 font-bold">{Math.round(sessionAnalysisProgress.progress)}%</span>
                      </div>
                      <div className="w-full bg-black border border-[#0F4C5C]/45 rounded-full h-3">
                        <div 
                          className="bg-[#0F5C45]/40 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${sessionAnalysisProgress.progress}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Photo actuelle */}
                    {sessionAnalysisProgress.total > 0 && (
                      <div className="text-center text-sm text-teal-100/55">
                        Photo {sessionAnalysisProgress.current}/{sessionAnalysisProgress.total}
                      </div>
                    )}
                    
                    {/* Message détaillé */}
                    {sessionAnalysisProgress.message && (
                      <div className="text-center text-teal-100/80 text-sm">
                        {sessionAnalysisProgress.message}
                      </div>
                    )}
                    
                    {/* Étapes détaillées */}
                    <div className="space-y-2 text-xs text-teal-100/55">
                      <div className="flex items-center gap-2">
                        {sessionAnalysisProgress.progress > 10 ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : (
                          <Loader className="w-4 h-4 animate-spin text-sky-300" />
                        )}
                        <span>Prétraitement images</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {sessionAnalysisProgress.progress > 30 ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : sessionAnalysisProgress.progress > 10 ? (
                          <Loader className="w-4 h-4 animate-spin text-sky-300" />
                        ) : (
                          <span className="w-4 h-4 text-teal-100/40">○</span>
                        )}
                        <span>Détection poses</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {sessionAnalysisProgress.progress > 60 ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : sessionAnalysisProgress.progress > 30 ? (
                          <Loader className="w-4 h-4 animate-spin text-sky-300" />
                        ) : (
                          <span className="w-4 h-4 text-teal-100/40">○</span>
                        )}
                        <span>Segmentation corps</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {sessionAnalysisProgress.progress > 90 ? (
                          <Check className="w-4 h-4 text-green-400" />
                        ) : sessionAnalysisProgress.progress > 60 ? (
                          <Loader className="w-4 h-4 animate-spin text-sky-300" />
                        ) : (
                          <span className="w-4 h-4 text-teal-100/40">○</span>
                        )}
                        <span>Extraction métriques</span>
                      </div>
                    </div>
                    
                    {/* Info temps estimé */}
                    {sessionAnalysisProgress.total > 0 && sessionAnalysisProgress.current > 0 && (
                      <div className="text-center text-xs text-teal-100/45">
                        Temps estimé: ~{Math.round((sessionAnalysisProgress.progress < 100 ? 
                          (100 - sessionAnalysisProgress.progress) * 0.05 : 0) * sessionAnalysisProgress.total)}s
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          <div className="w-full max-w-6xl h-full flex flex-col p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-teal-100">
                  Pose {safePoseIndex + 1}/{poses.length}
                </h2>
                <p className="text-teal-100/55">{currentPose?.name || `Pose ${safePoseIndex + 1}`}</p>
                {currentPose && (
                  <p className="text-xs text-teal-100/45 mt-1">
                    ID: {currentPose.id}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-[#0F5C45]/70 bg-[#0F4C5C]/40 px-3 py-2 text-teal-100 font-medium hover:bg-[#0F4C5C]/55 transition-colors shadow-md shadow-black/20 rounded-lg flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Fermer
              </button>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Webcam Preview */}
              <div className="lg:col-span-2 relative rounded-lg overflow-hidden border-2 border-[#0F4C5C]/35 bg-black">
                {!webcamReady && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/95 text-teal-100/55">
                    <Loader className="w-8 h-8 animate-spin" />
                    <span className="ml-3">Chargement webcam...</span>
                  </div>
                )}
                
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  width={1280}
                  height={720}
                  videoConstraints={{
                    width: 1280,
                    height: 720,
                    facingMode: 'user'
                  }}
                  onUserMedia={(stream) => {
                    log.info('Webcam initialisée avec succès', { 
                      streamActive: stream?.active,
                      videoTracks: stream?.getVideoTracks().length 
                    });
                    // ✅ Utiliser dispatch pour WEBCAM_READY (géré par reducer)
                    dispatch({ type: 'WEBCAM_READY' });
                  }}
                  onUserMediaError={(error) => {
                    log.error('Erreur accès webcam', { 
                      name: error.name, 
                      message: error.message,
                      constraint: error.constraint 
                    });
                    
                    let errorMessage = 'Erreur d\'accès à la caméra';
                    if (error.name === 'NotAllowedError') {
                      errorMessage = 'Permission caméra refusée. Veuillez autoriser l\'accès dans les paramètres du navigateur et actualiser la page.';
                    } else if (error.name === 'NotFoundError') {
                      errorMessage = 'Aucune caméra détectée. Veuillez connecter une caméra.';
                    } else if (error.name === 'OverconstrainedError') {
                      errorMessage = 'Résolution caméra non supportée. Changement de résolution...';
                    } else if (error.message) {
                      errorMessage = `Erreur webcam: ${error.message}`;
                    }
                    
                    showError(errorMessage);
                    dispatch({ type: 'WEBCAM_READY', payload: false });
                  }}
                  className="w-full h-full object-contain"
                  style={{ opacity: webcamReady ? 1 : 0.3, transition: 'opacity 0.3s' }}
                />
                
                {/* Overlay pose validation */}
                {webcamReady && poseValidation && poseValidation.valid && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-4 left-4 bg-green-500/80 text-teal-100 px-3 py-1 rounded text-sm font-medium">
                      ✅ Pose validée ({poseValidation.confidence.toFixed(0)}%)
                    </div>
                  </div>
                )}

                {/* Score qualité */}
                {webcamReady && (
                  <div className={`absolute top-4 right-4 bg-black/95 text-teal-100 px-3 py-2 rounded-lg border ${getQualityColor(qualityScore)} border-current`}>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{qualityScore}/100</span>
                      <span>{getQualityStars(qualityScore)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions et contrôles */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle size="sm">Instructions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-teal-100/80 mb-4">
                      {currentPose?.name || 'Positionnez-vous selon la pose indiquée'}
                    </p>
                    
                    <div className="space-y-3">
                      {/* Score qualité détaillé */}
                      {qualityScore > 0 && (
                        <div className="p-3 bg-black border border-[#0F4C5C]/50 rounded">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-teal-100/55">Qualité</span>
                            <span className={`text-sm font-bold ${getQualityColor(qualityScore)}`}>
                              {qualityScore}/100
                            </span>
                          </div>
                          <div className="w-full bg-black border border-[#0F4C5C]/45 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all ${
                                qualityScore >= 80 ? 'bg-green-500' :
                                qualityScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${qualityScore}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Validation pose */}
                      {poseValidation && (
                        <div className={`p-3 rounded ${
                          poseValidation.valid 
                            ? 'bg-green-500/20 border border-green-500/50' 
                            : 'bg-yellow-500/20 border border-yellow-500/50'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            {poseValidation.valid ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-yellow-400" />
                            )}
                            <span className="text-xs font-medium">
                              {poseValidation.valid ? 'Pose correcte' : 'Ajustez la pose'}
                            </span>
                          </div>
                          <p className="text-xs text-teal-100/55">
                            {poseValidation.matchedAngles}/{poseValidation.totalAngles} angles validés
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Actions */}
                <div className="space-y-2">
                  {/* Décompte visuel */}
                  {captureCountdown !== null && captureCountdown > 0 && (
                    <div className="text-center py-4">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#0F4C5C]/50/20 border-4 border-[#0F4C5C]/55 text-4xl font-bold text-sky-300 animate-pulse">
                        {captureCountdown}
                      </div>
                      <p className="text-sm text-teal-100/55 mt-2">Préparez-vous...</p>
                    </div>
                  )}
                  
                  <button
                    type="button"
                    onClick={() => {
                      if (captureCountdown === null) {
                        startCaptureCountdown();
                      }
                    }}
                    disabled={!webcamReady || isCapturing || !poseDetected || captureCountdown !== null}
                    className="rounded-lg border border-[#0F5C45]/70 bg-[#0F4C5C]/40 px-3 py-2 text-teal-100 font-medium hover:bg-[#0F4C5C]/55 transition-colors shadow-md shadow-black/20 rounded-lg w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCapturing || captureCountdown !== null ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    ) : (
                      <Camera className="w-5 h-5" />
                    )}
                    {captureCountdown !== null && captureCountdown > 0 
                      ? `Capture dans ${captureCountdown}s...`
                      : captureCountdown === 0
                      ? 'Capture...'
                      : isCapturing
                      ? 'Capture en cours...'
                      : qualityScore >= 70
                      ? '📸 Capturer (Qualité OK)'
                      : qualityScore >= 50
                      ? '📸 Capturer (Qualité moyenne)'
                      : '📸 Capturer (Ajustez la pose)'
                    }
                  </button>

                  {safePoseIndex > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        // ✅ FIX RACE CONDITION: Vérifier verrou avant changement pose
                        if (isCapturingRef.current) {
                          log.warn('Tentative changement pose pendant capture, ignorée');
                          return;
                        }
                        const prevIndex = Math.max(0, safePoseIndex - 1);
                        dispatch({ type: 'PREV_POSE' });
                        // Reset webcam state géré automatiquement par PREV_POSE dans reducer
                        stabilityValidationsRef.current = [];
                      }}
                      className="rounded-lg border border-[#0F5C45]/70 bg-[#0F4C5C]/40 px-3 py-2 text-teal-100 font-medium hover:bg-[#0F4C5C]/55 transition-colors shadow-md shadow-black/20 rounded-lg w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isCapturing} // Désactiver bouton pendant capture
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Précédent (Pose {safePoseIndex}/{poses.length})
                    </button>
                  )}
                  
                  {safePoseIndex < poses.length - 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        // ✅ FIX RACE CONDITION: Vérifier verrou avant changement pose
                        if (isCapturingRef.current) {
                          log.warn('Tentative changement pose pendant capture, ignorée');
                          return;
                        }
                        const nextIndex = Math.min(poses.length - 1, safePoseIndex + 1);
                        dispatch({ type: 'NEXT_POSE' });
                        // Reset webcam state géré automatiquement par NEXT_POSE dans reducer
                      }}
                      className="rounded-lg border border-[#0F5C45]/70 bg-[#0F4C5C]/40 px-3 py-2 text-teal-100 font-medium hover:bg-[#0F4C5C]/55 transition-colors shadow-md shadow-black/20 rounded-lg w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isCapturing} // Désactiver bouton pendant capture
                    >
                      <ChevronRight className="w-4 h-4" />
                      Suivant (Pose {safePoseIndex + 2}/{poses.length})
                    </button>
                  )}

                  {/* Compteur photos capturées */}
                  {sessionPhotos.filter(sp => sp.status === 'captured').length > 0 && (
                    <div className="p-3 bg-green-500/10 border border-green-500/30 rounded text-center">
                      <p className="text-sm text-green-400 font-medium">
                        ✅ <span className="font-bold">
                          {sessionPhotos.filter(sp => sp.status === 'captured').length}
                        </span> photo(s) capturée(s) et sauvegardée(s)
                      </p>
                      <p className="text-xs text-teal-100/55 mt-1">
                        Les photos sont sauvegardées automatiquement après chaque capture
                      </p>
                    </div>
                  )}
                  
                  {/* Bouton re-sauvegarde manuelle (optionnel, pour réessayer si erreur) */}
                  {sessionPhotos.filter(sp => sp.status === 'captured').length > 0 && (
                    <button
                      type="button"
                      onClick={saveSession}
                      className="rounded-lg border border-[#0F5C45]/70 bg-[#0F4C5C]/40 px-3 py-2 text-teal-100 font-medium hover:bg-[#0F4C5C]/55 transition-colors shadow-md shadow-black/20 rounded-lg w-full"
                    >
                      🔄 Re-sauvegarder toutes les photos ({sessionPhotos.filter(sp => sp.status === 'captured').length})
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Mode Upload
  if (mode === 'upload' || (mode === 'mixed' && uploadedFiles.length > 0)) {
    return (
      <>
        <ToastContainer />
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-50 p-4">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-sky-300/90" />
                Upload de Photos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Zone dropzone */}
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all
                  ${isDragActive 
                    ? 'border-[#0F5C45]/55 bg-[#0F4C5C]/12' 
                    : 'border-[#0F4C5C]/45 hover:border-sky-400/60 bg-black'
                  }
                  ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
                `}
              >
                <input {...getInputProps()} />
                {uploading ? (
                  <>
                    <Loader className="w-12 h-12 mx-auto mb-4 animate-spin text-sky-300/90" />
                    <p className="text-teal-100/80">Téléchargement en cours...</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-12 h-12 mx-auto mb-4 text-teal-100/55" />
                    <p className="text-teal-100/80 mb-2">
                      Glissez-déposez vos photos ici ou cliquez pour sélectionner
                    </p>
                    <p className="text-sm text-teal-100/45">
                      Formats: JPEG, PNG (max 10MB par photo)
                    </p>
                  </>
                )}
              </div>

              {/* Photos uploadées */}
              {uploadedFiles.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-teal-100">
                      Photos uploadées ({uploadedFiles.length})
                    </h3>
                    <Button
                      onClick={analyzeUploadedPhotos}
                      disabled={analyzingUploads}
                      loading={analyzingUploads}
                      size="sm"
                    >
                      {analyzingUploads ? 'Analyse...' : 'Analyser poses'}
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {uploadedFiles.map((file) => (
                      <div key={file.id} className="relative rounded-lg overflow-hidden border border-[#0F4C5C]/45">
                        <img
                          src={file.originalUrl}
                          alt={file.name}
                          className="w-full aspect-[3/4] object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-teal-100 text-xs p-2 truncate">
                          {file.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg border border-[#0F5C45]/70 bg-[#0F4C5C]/40 px-3 py-2 text-teal-100 font-medium hover:bg-[#0F4C5C]/55 transition-colors shadow-md shadow-black/20 rounded-lg"
                >
                  Annuler
                </button>
                {uploadedFiles.length > 0 && (
                  <Button
                    onClick={analyzeUploadedPhotos}
                    disabled={analyzingUploads}
                    loading={analyzingUploads}
                  >
                    {analyzingUploads ? 'Analyse...' : 'Continuer'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return null;
};

export default PhotoCaptureSession;

