/**
 * Orchestrateur d'Analyse Photo Complète
 * 
 * Coordonne le pipeline complet d'analyse:
 * Prétraitement → Détection Pose → Segmentation → Extraction Métriques
 * 
 * Gère progression, erreurs, parallélisation intelligente
 * 
 * Référence: suiviphotoapprofondi.md - Section 5 (Pipeline complet)
 */

import logger from '../../../utils/logger';
import { preprocessImage } from './imagePreprocessing';
import { getPoseDetectionService } from './poseDetectionService';
import { getBodySegmentationService } from './bodySegmentationService';
import { getMetricsExtractionService } from './metricsExtractionService';
import { getAdvancedCache } from './advancedCache';

const log = logger.module('PhotoAnalysisOrchestrator');

/**
 * Mapping orientation → muscles analysables
 */
const MUSCLES_BY_ORIENTATION = {
  front: {
    upper: ['pectoraux', 'deltoides', 'biceps', 'abdominaux', 'obliques'],
    lower: ['quadriceps']
  },
  back: {
    upper: ['dorsaux', 'trapèzes', 'triceps'],
    lower: ['ischio_jambiers', 'mollets']
  },
  side: {
    upper: ['deltoides', 'biceps', 'triceps'],
    lower: ['quadriceps', 'ischio_jambiers']
  }
};

/**
 * Mapping parties BodyPix → groupes musculaires
 */
const PART_TO_MUSCLE_MAPPING = {
  // Torse
  torso: ['pectoraux', 'abdominaux', 'dorsaux', 'trapèzes'],
  
  // Bras supérieur
  leftUpperArm: ['biceps', 'triceps'], // Selon orientation
  rightUpperArm: ['biceps', 'triceps'],
  
  // Jambes
  leftUpperLeg: ['quadriceps', 'ischio_jambiers'], // Selon orientation
  rightUpperLeg: ['quadriceps', 'ischio_jambiers'],
  
  // Mollets
  leftLowerLeg: ['mollets'],
  rightLowerLeg: ['mollets']
};

class PhotoAnalysisOrchestrator {
  constructor() {
    // Cache avancé multi-niveaux (Memory + IndexedDB + Computation)
    this.cache = getAdvancedCache({
      memoryMaxSize: 100,
      memoryTTL: 3600000, // 1h
      dbName: 'photoAnalysisCache',
      storeName: 'results'
    });
    
    this.activeAnalyses = new Map(); // Suivi analyses en cours
    
    // ✅ Clés cache par étape pour cache intermédiaire optimisé
    this.STEP_CACHE_PREFIXES = {
      preprocess: 'preprocess',
      pose: 'pose',
      segmentation: 'segmentation',
      metrics: 'metrics'
    };
  }

  /**
   * Analyse une photo complète (pipeline complet)
   * @param {string|HTMLImageElement} photoSource - URL Base64 ou ImageElement
   * @param {Object} photoData - Métadonnées photo (pose, angle, etc.)
   * @param {Object} options - Options analyse
   * @param {Function} onProgress - Callback progression (0-100, message)
   * @returns {Promise<Object>} Résultats analyse complète
   */
  async analyzePhoto(photoSource, photoData = {}, options = {}, onProgress = null) {
    const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Générer clé cache (basée sur photo ID ou hash de la source)
    const cacheKey = this.generateCacheKey(photoSource, photoData, options);
    
    // Vérifier cache d'abord (sauf si force=true)
    if (!options.force) {
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        log.info(`Cache hit pour analyse photo (${cacheKey})`);
        this.updateProgress(onProgress, 100, 'Résultat depuis cache');
        return cached;
      }
    }
    
    try {
      this.updateProgress(onProgress, 0, 'Démarrage analyse...');
      
      // ✅ OPTIMISATION: Générer photoId pour clés cache étapes
      const photoId = photoData.id || this.generateCacheKey(photoSource, photoData, options);
      const stepTTL = 3600000; // 1h TTL pour chaque étape
      
      // ✅ Phase 1: Prétraitement (avec cache intermédiaire)
      const preprocessKey = this.generateStepCacheKey('preprocess', photoId, options);
      let preprocessed = await this.cache.get(preprocessKey);
      
      if (!preprocessed) {
        this.updateProgress(onProgress, 5, 'Prétraitement image...');
        preprocessed = await preprocessImage(
          photoSource,
          {
            targetResolution: options.targetResolution || 512,
            resizeStrategy: 'adaptive'
          },
          (progress) => {
            // 5-15% = prétraitement
            this.updateProgress(onProgress, 5 + (progress * 0.1), 'Prétraitement...');
          }
        );
        
        // ✅ Mettre en cache prétraitement
        await this.cache.set(preprocessKey, preprocessed, { ttl: stepTTL });
        log.info(`Cache miss: Prétraitement sauvegardé (${preprocessKey})`);
      } else {
        log.info(`Cache hit: Prétraitement (${preprocessKey})`);
        this.updateProgress(onProgress, 15, 'Prétraitement depuis cache');
      }
      
      const processedImage = preprocessed.canvas;

      // ✅ Phase 2: Détection Pose (avec cache intermédiaire)
      const poseKey = this.generateStepCacheKey('pose', photoId);
      let poseResult = await this.cache.get(poseKey);
      let poseValidation = null;
      const poseService = getPoseDetectionService(); // Définir service en amont pour réutilisation
      
      if (!poseResult) {
        this.updateProgress(onProgress, 15, 'Détection pose...');
        poseResult = await poseService.detectPose(processedImage);
        
        if (!poseResult.detected || !poseResult.landmarks) {
          log.warn('Pose non détectée sur photo', { photoId: photoData.id });
          // Continuer quand même avec segmentation (peut fonctionner)
        }
        
        // Valider pose si info disponible
        if (photoData.poseType && poseResult.detected) {
          const poseDatabase = poseService.getPoseDatabase();
          const expectedPose = poseDatabase[photoData.poseType];
          if (expectedPose) {
            poseValidation = poseService.validatePose(poseResult.landmarks, expectedPose);
            // Attacher validation au résultat pour cache
            poseResult.validation = poseValidation;
          }
        }
        
        // ✅ Mettre en cache résultat pose
        await this.cache.set(poseKey, poseResult, { ttl: stepTTL });
        log.info(`Cache miss: Pose sauvegardée (${poseKey})`);
      } else {
        log.info(`Cache hit: Pose (${poseKey})`);
        // Récupérer validation depuis résultat cache
        poseValidation = poseResult.validation || null;
        this.updateProgress(onProgress, 30, 'Pose depuis cache');
      }

      // ✅ Phase 3: Segmentation Corps (avec cache intermédiaire)
      const segmentationKey = this.generateStepCacheKey('segmentation', photoId, options);
      let segmentationResult = await this.cache.get(segmentationKey);
      
      if (!segmentationResult) {
        this.updateProgress(onProgress, 30, 'Segmentation corps...');
        const segmentationService = getBodySegmentationService();
        segmentationResult = await segmentationService.segmentBody(
          processedImage,
          {
            internalResolution: options.segmentationResolution || 'medium',
            segmentationThreshold: 0.5
          }
        );
        
        if (!segmentationResult.success) {
          throw new Error('Échec segmentation corps: ' + (segmentationResult.error || 'Erreur inconnue'));
        }
        
        // ✅ Mettre en cache segmentation
        await this.cache.set(segmentationKey, segmentationResult, { ttl: stepTTL });
        log.info(`Cache miss: Segmentation sauvegardée (${segmentationKey})`);
      } else {
        log.info(`Cache hit: Segmentation (${segmentationKey})`);
        this.updateProgress(onProgress, 50, 'Segmentation depuis cache');
      }

      // Phase 4: Extraction Métriques (~8-12 sec)
      const metricsService = getMetricsExtractionService();
      const orientation = poseService.detectOrientation(poseResult.landmarks || []);
      
      // Ajuster mapping muscles selon orientation
      const segmentationService = getBodySegmentationService(); // Récupérer service si pas déjà défini
      const muscleMapping = segmentationService.adjustMuscleMappingByOrientation(
        segmentationResult.masks,
        orientation
      );
      
      // Subdiviser torse si landmarks disponibles
      if (poseResult.landmarks && segmentationResult.masks.torso) {
        const torsoSubdivision = segmentationService.subdivideTorsoByLandmarks(
          segmentationResult.masks.torso,
          poseResult.landmarks
        );
        muscleMapping.pectorals = torsoSubdivision.pectorals;
        muscleMapping.abdominals = torsoSubdivision.abdominals;
      }

      // Muscles à analyser selon orientation
      const musclesToAnalyze = this.getMusclesForOrientation(orientation, photoData.poseType);
      
      const allMetrics = {};
      const totalMuscles = musclesToAnalyze.length;
      let completedMuscles = 0;

      // ✅ OPTIMISATION: Batch processing métriques (parallélisation par lots de 3)
      // Préparer données pour tous muscles (séparer cache hit/miss)
      const muscleDataBatch = [];
      const cachedMetrics = {};
      
      // Étape 1: Vérifier cache pour tous muscles
      for (const muscleType of musclesToAnalyze) {
        const metricsKey = this.generateStepCacheKey('metrics', photoId, {}, muscleType);
        const cached = await this.cache.get(metricsKey);
        
        if (cached) {
          cachedMetrics[muscleType] = cached;
          log.info(`Cache hit: Métriques ${muscleType} (${metricsKey})`);
        } else {
          // Préparer données pour extraction batch
          const muscleMask = this.getMuscleMask(muscleType, muscleMapping, segmentationResult.masks);
          
          if (muscleMask) {
            const symmetryMask = this.getSymmetryMask(muscleType, muscleMapping, segmentationResult.masks);
            muscleDataBatch.push({
              muscleType,
              muscleMask,
              symmetryMask,
              cacheKey: metricsKey
            });
          } else {
            log.warn(`Masque ${muscleType} non disponible`);
            allMetrics[muscleType] = {
              success: false,
              error: 'Masque muscle non disponible',
              metrics: {}
            };
          }
        }
      }
      
      // Étape 2: Extraire métriques en batch (seulement pour muscles non cachés)
      if (muscleDataBatch.length > 0) {
        const progressBase = 50;
        this.updateProgress(onProgress, progressBase, `Extraction métriques batch (${muscleDataBatch.length} muscles)...`);
        
        const bodyMask = segmentationResult.masks.torso || segmentationResult.masks.leftUpperArm;
        
        // ✅ Utiliser extraction batch avec parallélisation (max 3 simultanées)
        const batchResults = await metricsService.extractAllMetricsBatch(
          muscleDataBatch.map(d => ({
            muscleType: d.muscleType,
            muscleMask: d.muscleMask,
            symmetryMask: d.symmetryMask
          })),
          bodyMask,
          processedImage,
          {
            parallel: true,
            maxConcurrent: 3
          }
        );
        
        // ✅ OPTIMISATION: Mettre en cache résultats en batch (IndexedDB batch write)
        // Étape 3: Préparer entrées cache pour batch write
        const cacheEntries = [];
        const validResults = {};
        
        for (const data of muscleDataBatch) {
          const { muscleType, cacheKey } = data;
          const result = batchResults[muscleType];
          
          if (result) {
            cacheEntries.push({
              key: cacheKey,
              value: result,
              options: { ttl: stepTTL }
            });
            validResults[muscleType] = result;
          }
        }
        
        // ✅ Écrire toutes métriques en batch (une transaction IndexedDB au lieu de N)
        if (cacheEntries.length > 0) {
          await this.cache.setBatch(cacheEntries, { ttl: stepTTL });
          log.info(`Cache miss: ${cacheEntries.length} métriques sauvegardées en batch`);
          
          // Accumuler résultats
          Object.assign(allMetrics, validResults);
        }
      }
      
      // Étape 4: Ajouter métriques depuis cache
      for (const [muscleType, cached] of Object.entries(cachedMetrics)) {
        allMetrics[muscleType] = cached;
      }
      
      // Mettre à jour progression
      const completedCount = Object.keys(allMetrics).length;
      this.updateProgress(onProgress, 50 + (completedCount / totalMuscles) * 45, `${completedCount}/${totalMuscles} muscles analysés`);
      
      this.updateProgress(onProgress, 95, 'Métriques extraites');

      // Compilation résultats finaux
      const analysisResult = {
        success: true,
        analysisId,
        timestamp: new Date().toISOString(),
        photo: {
          id: photoData.id || analysisId,
          poseType: photoData.poseType,
          angle: photoData.angle || orientation,
          qualityScore: photoData.qualityScore || null
        },
        preprocessing: {
          ...preprocessed.metadata,
          resolution: {
            original: { width: preprocessed.metadata.width, height: preprocessed.metadata.height },
            processed: { 
              width: processedImage.width, 
              height: processedImage.height 
            }
          }
        },
        poseDetection: {
          detected: poseResult.detected,
          confidence: poseResult.confidence || 0,
          landmarks: poseResult.landmarks || null,
          angles: poseResult.angles || null,
          validation: poseValidation,
          orientation
        },
        segmentation: {
          success: segmentationResult.success,
          confidence: segmentationResult.confidence || 0,
          parts: Object.keys(segmentationResult.masks || {}),
          muscleMapping
        },
        metrics: allMetrics,
        summary: this.generateSummary(allMetrics)
      };

      this.updateProgress(onProgress, 100, 'Analyse terminée');
      
      // Mettre en cache avec clé générée
      await this.cache.set(cacheKey, analysisResult, {
        persist: true, // Persister dans IndexedDB
        ttl: options.cacheTTL || 86400000 // 24h par défaut
      });
      
      return analysisResult;

    } catch (error) {
      log.error('Erreur analyse photo complète', error);
      
      this.updateProgress(onProgress, 0, `Erreur: ${error.message}`);
      
      return {
        success: false,
        analysisId,
        error: error.message,
        timestamp: new Date().toISOString(),
        photo: photoData
      };
    }
  }

  /**
   * Analyse une session complète (15 photos)
   * @param {Array} photos - Array de {source, photoData}
   * @param {Object} options - Options analyse
   * @param {Function} onProgress - Callback progression (0-100, message, current/total)
   * @returns {Promise<Array>} Résultats analyse toutes photos
   */
  async analyzeSession(photos, options = {}, onProgress = null) {
    const sessionId = `session_${Date.now()}`;
    const results = [];
    const totalPhotos = photos.length;
    
      try {
      this.updateProgress(onProgress, 0, `Analyse session (${totalPhotos} photos)...`, 0, totalPhotos);
      
      // Option: Parallélisation par lots (3 photos en parallèle)
      const batchSize = options.batchSize || 3;
      
      for (let i = 0; i < photos.length; i += batchSize) {
        const batch = photos.slice(i, i + batchSize);
        const batchProgress = (i / totalPhotos) * 100;
        
        // Analyser lot en parallèle
        const batchResults = await Promise.all(
          batch.map(async (photo, batchIndex) => {
            const photoIndex = i + batchIndex;
            const photoProgress = batchProgress + ((batchIndex / batch.length) * (batchSize / totalPhotos) * 100);
            
            return this.analyzePhoto(
              photo.source,
              photo.photoData || {},
              options,
              (progress, message) => {
                // Progression globale session avec current/total
                const globalProgress = photoProgress + (progress * (batchSize / totalPhotos) / 100);
                this.updateProgress(
                  onProgress,
                  Math.min(100, globalProgress),
                  message || `Photo ${photoIndex + 1}/${totalPhotos}`,
                  photoIndex + 1, // current
                  totalPhotos // total
                );
              }
            );
          })
        );
        
        results.push(...batchResults);
      }
      
      // Validation cohérence session
      const sessionValidation = this.validateSessionConsistency(results);
      
      this.updateProgress(onProgress, 100, 'Session analysée', totalPhotos, totalPhotos);
      
      return {
        sessionId,
        success: true,
        photos: results,
        validation: sessionValidation,
        summary: this.generateSessionSummary(results),
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      log.error('Erreur analyse session', error);
      
      return {
        sessionId,
        success: false,
        error: error.message,
        photos: results, // Photos analysées avant erreur
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Récupère masque muscle depuis mapping
   * @param {string} muscleType 
   * @param {Object} muscleMapping 
   * @param {Object} allMasks 
   * @returns {Object|null} Masque binaire
   */
  getMuscleMask(muscleType, muscleMapping, allMasks) {
    // Chercher dans muscleMapping d'abord
    if (muscleMapping[muscleType]) {
      return muscleMapping[muscleType];
    }
    
    // Fallback: chercher dans allMasks selon conventions
    const maskKey = muscleType.toLowerCase();
    if (allMasks[maskKey]) {
      return allMasks[maskKey];
    }
    
    // Essayer avec préfixe left/right
    const leftKey = `left${muscleType.charAt(0).toUpperCase() + muscleType.slice(1)}`;
    const rightKey = `right${muscleType.charAt(0).toUpperCase() + muscleType.slice(1)}`;
    
    if (allMasks[leftKey] || allMasks[rightKey]) {
      // Retourner premier disponible (ou fusionner si nécessaire)
      return allMasks[leftKey] || allMasks[rightKey];
    }
    
    return null;
  }

  /**
   * Récupère masque symétrique pour calcul symétrie
   * @param {string} muscleType 
   * @param {Object} muscleMapping 
   * @param {Object} allMasks 
   * @returns {Object|null} Masque symétrique
   */
  getSymmetryMask(muscleType, muscleMapping, allMasks) {
    // Muscles avec symétrie gauche/droite
    const symmetricMuscles = ['biceps', 'triceps', 'quadriceps', 'ischio_jambiers', 'mollets', 'deltoides'];
    
    if (!symmetricMuscles.includes(muscleType)) {
      return null; // Pas de symétrie pour ce muscle
    }
    
    // Chercher masque opposé
    const leftKey = `left${muscleType.charAt(0).toUpperCase() + muscleType.slice(1)}`;
    const rightKey = `right${muscleType.charAt(0).toUpperCase() + muscleType.slice(1)}`;
    
    // Déterminer si muscle actuel est gauche ou droit
    const currentMask = this.getMuscleMask(muscleType, muscleMapping, allMasks);
    if (!currentMask) return null;
    
    // Chercher masque opposé
    if (muscleMapping[leftKey] && muscleMapping[rightKey]) {
      // Retourner celui qui n'est pas le courant
      // (simplification: on assume left/right dans nom)
      if (muscleType.includes('left') || currentMask === muscleMapping[leftKey]) {
        return muscleMapping[rightKey];
      } else {
        return muscleMapping[leftKey];
      }
    }
    
    // Fallback: chercher dans allMasks
    const oppositeKey = allMasks[leftKey] && allMasks[leftKey] === currentMask 
      ? rightKey 
      : leftKey;
    
    return allMasks[oppositeKey] || null;
  }

  /**
   * Détermine muscles à analyser selon orientation
   * @param {string} orientation - 'front' | 'back' | 'side'
   * @param {string} poseType - Type pose (ex: 'front_contracted_biceps')
   * @returns {Array<string>} Liste muscles à analyser
   */
  getMusclesForOrientation(orientation, poseType = '') {
    const baseMuscles = MUSCLES_BY_ORIENTATION[orientation] || MUSCLES_BY_ORIENTATION.front;
    
    let muscles = [
      ...(baseMuscles.upper || []),
      ...(baseMuscles.lower || [])
    ];
    
    // Ajuster selon pose spécifique
    if (poseType.includes('biceps')) {
      muscles = muscles.filter(m => m !== 'triceps');
      if (!muscles.includes('biceps')) muscles.push('biceps');
    }
    
    if (poseType.includes('triceps')) {
      muscles = muscles.filter(m => m !== 'biceps');
      if (!muscles.includes('triceps')) muscles.push('triceps');
    }
    
    if (poseType.includes('legs') || poseType.includes('quadriceps')) {
      if (!muscles.includes('quadriceps')) muscles.push('quadriceps');
    }
    
    if (poseType.includes('calves') || poseType.includes('mollets')) {
      if (!muscles.includes('mollets')) muscles.push('mollets');
    }
    
    // Dédupliquer
    return [...new Set(muscles)];
  }

  /**
   * Génère résumé métriques pour une photo
   * @param {Object} allMetrics - Toutes métriques par muscle
   * @returns {Object} Résumé
   */
  generateSummary(allMetrics) {
    const muscles = Object.keys(allMetrics);
    const successful = muscles.filter(m => allMetrics[m].success);
    
    // Scores moyens pondérés
    let totalVolume = 0;
    let totalDefinition = 0;
    let totalSymmetry = 0;
    let totalVascularity = 0;
    let totalSeparation = 0;
    let totalContours = 0;
    
    let count = 0;
    
    successful.forEach(muscle => {
      const metrics = allMetrics[muscle].metrics;
      if (metrics.volume) totalVolume += metrics.volume.score;
      if (metrics.definition) totalDefinition += metrics.definition.score;
      if (metrics.symmetry) totalSymmetry += metrics.symmetry.score;
      if (metrics.vascularity) totalVascularity += metrics.vascularity.score;
      if (metrics.separation) totalSeparation += metrics.separation.score;
      if (metrics.contours) totalContours += metrics.contours.score;
      count++;
    });
    
    return {
      musclesAnalyzed: successful.length,
      musclesTotal: muscles.length,
      averageScores: {
        volume: count > 0 ? Math.round(totalVolume / count) : 0,
        definition: count > 0 ? Math.round(totalDefinition / count) : 0,
        symmetry: count > 0 ? Math.round(totalSymmetry / count) : 0,
        vascularity: count > 0 ? Math.round(totalVascularity / count) : 0,
        separation: count > 0 ? Math.round(totalSeparation / count) : 0,
        contours: count > 0 ? Math.round(totalContours / count) : 0
      },
      overallScore: count > 0 ? Math.round(
        (totalVolume * 0.40 + totalDefinition * 0.30 + totalSymmetry * 0.20 + 
         totalVascularity * 0.05 + totalSeparation * 0.03 + totalContours * 0.02) / count
      ) : 0
    };
  }

  /**
   * Génère résumé session complète
   * @param {Array} results - Résultats toutes photos
   * @returns {Object} Résumé session
   */
  generateSessionSummary(results) {
    const successful = results.filter(r => r.success);
    const allMuscles = new Set();
    
    successful.forEach(result => {
      if (result.metrics) {
        Object.keys(result.metrics).forEach(muscle => {
          if (result.metrics[muscle].success) {
            allMuscles.add(muscle);
          }
        });
      }
    });
    
    // Agréger métriques par muscle sur toutes photos
    const aggregated = {};
    Array.from(allMuscles).forEach(muscle => {
      const muscleData = successful
        .map(r => r.metrics?.[muscle])
        .filter(m => m && m.success);
      
      if (muscleData.length > 0) {
        // Moyennes
        const avgVolume = muscleData.reduce((sum, m) => 
          sum + (m.metrics.volume?.score || 0), 0) / muscleData.length;
        const avgDefinition = muscleData.reduce((sum, m) => 
          sum + (m.metrics.definition?.score || 0), 0) / muscleData.length;
        
        aggregated[muscle] = {
          photosCount: muscleData.length,
          averageScores: {
            volume: Math.round(avgVolume),
            definition: Math.round(avgDefinition)
          }
        };
      }
    });
    
    return {
      totalPhotos: results.length,
      successfulPhotos: successful.length,
      musclesTracked: allMuscles.size,
      aggregatedByMuscle: aggregated
    };
  }

  /**
   * Valide cohérence session (poses manquantes, qualité, etc.)
   * @param {Array} results - Résultats analyse photos
   * @returns {Object} Validation
   */
  validateSessionConsistency(results) {
    const issues = [];
    const successful = results.filter(r => r.success);
    
    if (successful.length === 0) {
      return {
        valid: false,
        issues: [{ type: 'no_successful_photos', severity: 'high' }],
        completeness: 0
      };
    }
    
    // Vérifier qualité cohérente
    const qualityScores = successful
      .map(r => r.photo?.qualityScore)
      .filter(q => q !== null && q !== undefined);
    
    if (qualityScores.length > 1) {
      const avgQuality = qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length;
      const stdDev = Math.sqrt(
        qualityScores.reduce((sum, q) => sum + Math.pow(q - avgQuality, 2), 0) / qualityScores.length
      );
      
      if (stdDev > 20) {
        issues.push({
          type: 'inconsistent_quality',
          severity: 'medium',
          stdDev: Math.round(stdDev * 10) / 10,
          avgQuality: Math.round(avgQuality)
        });
      }
    }
    
    // Vérifier poses détectées
    const posesDetected = successful
      .map(r => r.poseDetection?.detected)
      .filter(Boolean);
    
    if (posesDetected.length < successful.length * 0.7) {
      issues.push({
        type: 'many_poses_undetected',
        severity: 'medium',
        detectedCount: posesDetected.length,
        totalCount: successful.length
      });
    }
    
    return {
      valid: issues.filter(i => i.severity === 'high').length === 0,
      issues,
      completeness: (successful.length / results.length) * 100
    };
  }

  /**
   * Met à jour progression (helper)
   */
  updateProgress(onProgress, progress, message = '', current = null, total = null) {
    if (onProgress && typeof onProgress === 'function') {
      // Support signature flexible: (progress, message) OU (progress, message, current, total)
      if (onProgress.length >= 4 || (current !== null && total !== null)) {
        // Callback avec 4 paramètres supporté
        try {
          onProgress(Math.min(100, Math.max(0, Math.round(progress))), message, current, total);
        } catch (e) {
          // Fallback si callback ne supporte pas 4 paramètres
          onProgress(Math.min(100, Math.max(0, Math.round(progress))), message);
        }
      } else {
        // Callback avec 2 paramètres classique
        onProgress(Math.min(100, Math.max(0, Math.round(progress))), message);
      }
    }
  }

  /**
   * Génère clé cache intelligente depuis photo (résultat final complet)
   */
  generateCacheKey(photoSource, photoData, options) {
    // Si photo a ID unique, l'utiliser
    if (photoData.id) {
      return `photo_analysis_${photoData.id}_${options.targetResolution || 512}`;
    }
    
    // Sinon, générer hash depuis source + options
    const sourceStr = typeof photoSource === 'string' 
      ? photoSource.substring(0, 100) // Prendre début pour hash rapide
      : photoSource.src || photoSource.toString();
    
    const optionsStr = JSON.stringify({
      targetResolution: options.targetResolution || 512,
      segmentationResolution: options.segmentationResolution || 'medium',
      poseType: photoData.poseType || 'unknown'
    });
    
    // Hash simple mais efficace
    let hash = 0;
    const str = sourceStr + optionsStr;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return `photo_analysis_hash_${Math.abs(hash).toString(36)}_${options.targetResolution || 512}`;
  }

  /**
   * ✅ Génère clé cache pour étape spécifique (cache intermédiaire)
   * @param {string} step - Étape ('preprocess', 'pose', 'segmentation', 'metrics')
   * @param {string|Object} photoId - ID photo ou hash
   * @param {Object} options - Options spécifiques à l'étape
   * @param {string} muscle - Muscle pour étape metrics (optionnel)
   */
  generateStepCacheKey(step, photoId, options = {}, muscle = null) {
    const baseId = photoId || 'unknown';
    const resolution = options.targetResolution || options.segmentationResolution || 512;
    
    switch (step) {
      case 'preprocess':
        return `${this.STEP_CACHE_PREFIXES.preprocess}_${baseId}_${resolution}`;
      
      case 'pose':
        return `${this.STEP_CACHE_PREFIXES.pose}_${baseId}`;
      
      case 'segmentation':
        const segRes = options.segmentationResolution || 'medium';
        return `${this.STEP_CACHE_PREFIXES.segmentation}_${baseId}_${segRes}`;
      
      case 'metrics':
        if (!muscle) {
          throw new Error('Muscle requis pour clé cache métriques');
        }
        return `${this.STEP_CACHE_PREFIXES.metrics}_${baseId}_${muscle}`;
      
      default:
        throw new Error(`Étape inconnue: ${step}`);
    }
  }

  /**
   * Invalide cache pour une photo
   */
  async invalidateCache(photoId) {
    // Générer toutes clés possibles pour cette photo
    const possibleKeys = [
      `photo_analysis_${photoId}_512`,
      `photo_analysis_${photoId}_256`,
      `photo_analysis_${photoId}_1024`
    ];
    
    // Invalider chaque clé possible
    for (const key of possibleKeys) {
      await this.cache.invalidate(key);
    }
    
    log.debug(`Cache invalidé pour photo ${photoId}`);
  }

  /**
   * Nettoie cache (nettoyage automatique périodique géré par AdvancedCache)
   */
  async clearCache() {
    await this.cache.clear();
    log.info('Cache nettoyé complètement');
  }
}

// Singleton
let instance = null;

export const getPhotoAnalysisOrchestrator = () => {
  if (!instance) {
    instance = new PhotoAnalysisOrchestrator();
  }
  return instance;
};

export default getPhotoAnalysisOrchestrator;

