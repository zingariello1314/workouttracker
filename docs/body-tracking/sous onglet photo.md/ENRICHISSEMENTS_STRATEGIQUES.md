# Enrichissements Stratégiques - Système d'Analyse Corporelle par Photos

Ce document complète `suiviphotoapprofondi.md` avec des enrichissements stratégiques additionnels qui n'ont pas pu être intégrés directement dans le fichier principal pour des raisons de taille.

## 1. SYSTÈME DE SCORING QUALITÉ PHOTO - ALGORITHME COMPLET

### Composantes du Score (0-100)

```javascript
/**
 * Calcul score qualité photo avec pondération intelligente
 */
const calculatePhotoQualityScore = (photoData, realTimeMetrics = null) => {
  // Mode webcam : metrics temps réel disponibles
  // Mode upload : metrics calculés après upload
  
  const components = {
    // 1. Validation Pose (30% - CRITIQUE)
    poseValidation: {
      score: validatePoseConfidence(photoData.poseDetection),
      weight: 0.30,
      maxScore: 100,
      description: 'Correspondance pose détectée vs pose attendue'
    },
    
    // 2. Distance Sujet-Caméra (20% - IMPORTANT)
    distance: {
      score: estimateDistanceScore(photoData.landmarks),
      weight: 0.20,
      maxScore: 100,
      optimalRange: { min: 2.0, max: 3.5 }, // mètres
      description: 'Distance optimale pour analyse précise'
    },
    
    // 3. Éclairage (25% - IMPORTANT)
    lighting: {
      score: calculateLightingScore(photoData.lightingMetrics),
      weight: 0.25,
      maxScore: 100,
      optimalRange: { min: 500, max: 800 }, // lux
      description: 'Qualité éclairage pour détection détails'
    },
    
    // 4. Fond/Background (10% - MODÉRÉ)
    background: {
      score: calculateBackgroundScore(photoData.segmentation),
      weight: 0.10,
      maxScore: 100,
      optimalValue: 'uniform', // Fond uni = meilleur
      description: 'Complexité fond (affecte segmentation)'
    },
    
    // 5. Résolution Image (10% - MODÉRÉ)
    resolution: {
      score: calculateResolutionScore(photoData.dimensions),
      weight: 0.10,
      maxScore: 100,
      optimalRange: { min: 1920, max: 3840 }, // pixels largeur
      description: 'Résolution suffisante pour détails fins'
    },
    
    // 6. Stabilité/Flou (5% - MINIMAL)
    stability: {
      score: detectBlurScore(photoData.imageData),
      weight: 0.05,
      maxScore: 100,
      description: 'Absence de flou de mouvement'
    }
  };
  
  // Score final pondéré
  const finalScore = Object.values(components).reduce((sum, comp) => {
    return sum + (comp.score * comp.weight);
  }, 0);
  
  // Arrondir et garantir plage 0-100
  return Math.max(0, Math.min(100, Math.round(finalScore)));
};
```

### Calculs Détaillés par Composante

**1. Pose Validation Score**
```javascript
const validatePoseConfidence = (poseDetection) => {
  const { confidence, matchedAngles, totalAngles, landmarks } = poseDetection;
  
  // Score base : Confiance MediaPipe
  let score = confidence * 100; // 0-100
  
  // Bonus : Tous angles dans tolérance
  if (matchedAngles === totalAngles) {
    score = Math.min(100, score + 10); // Bonus +10
  }
  
  // Pénalité : Landmarks manquants critiques
  const criticalLandmarks = [11, 12, 13, 14, 23, 24]; // Épaules, coudes, hanches
  const missingCritical = criticalLandmarks.filter(id => 
    landmarks[id].visibility < 0.5
  ).length;
  
  if (missingCritical > 0) {
    score -= (missingCritical * 15); // -15 par landmark critique manquant
  }
  
  return Math.max(0, Math.min(100, score));
};
```

**2. Distance Score**
```javascript
const estimateDistanceScore = (landmarks) => {
  // Utiliser largeur épaules comme référence
  const shoulderWidth = calculateDistance(landmarks[11], landmarks[12]);
  const estimatedDistance = ESTIMATE_DISTANCE_FROM_SHOULDER_WIDTH(shoulderWidth);
  
  // Score selon distance optimale (2-3.5m)
  if (estimatedDistance >= 2.0 && estimatedDistance <= 3.5) {
    return 100; // Optimal
  } else if (estimatedDistance >= 1.5 && estimatedDistance < 2.0) {
    return 80 - ((2.0 - estimatedDistance) * 20); // Trop proche
  } else if (estimatedDistance > 3.5 && estimatedDistance <= 5.0) {
    return 80 - ((estimatedDistance - 3.5) * 10); // Trop loin
  } else {
    return 40; // Très éloigné de l'optimal
  }
};
```

**3. Éclairage Score**
```javascript
const calculateLightingScore = (lightingMetrics) => {
  const { lux, uniformity, contrast } = lightingMetrics;
  
  // Score luminance (lux)
  let score = 0;
  if (lux >= 500 && lux <= 800) {
    score = 40; // Optimal
  } else if (lux >= 300 && lux < 500) {
    score = 30 - ((500 - lux) * 0.05); // Acceptable
  } else if (lux >= 800 && lux <= 1200) {
    score = 40 - ((lux - 800) * 0.01); // Un peu trop fort
  } else {
    score = 20; // Sous-optimal
  }
  
  // Bonus uniformité (pas de zones très sombres/clair)
  score += uniformity * 30; // 0-30
  
  // Bonus contraste sujet/fond
  score += Math.min(30, contrast * 30); // 0-30
  
  return Math.max(0, Math.min(100, Math.round(score)));
};
```

## 2. WORKFLOW MODE UPLOAD DÉTAILLÉ

### Processus Complet avec Validation Multi-Étapes

```javascript
/**
 * Workflow upload photos avec validation intelligente
 */
const handlePhotoUpload = async (files) => {
  const uploadedPhotos = [];
  const analysisResults = [];
  
  // Étape 1 : Validation initiale (format, taille, nombre)
  for (const file of files) {
    const validation = validatePhotoFile(file, {
      maxSizeMB: 10,
      allowedFormats: ['image/jpeg', 'image/jpg', 'image/png'],
      maxPhotosPerSession: 15
    });
    
    if (!validation.valid) {
      showError(`Photo ${file.name}: ${validation.error}`);
      continue;
    }
    
    // Étape 2 : Chargement et prévisualisation
    const imageElement = await loadImage(file);
    uploadedPhotos.push({
      file,
      imageElement,
      originalSize: file.size,
      dimensions: { width: imageElement.width, height: imageElement.height }
    });
  }
  
  // Étape 3 : Analyse par lots (parallélisation)
  const batchSize = 3; // Traiter 3 photos en parallèle
  for (let i = 0; i < uploadedPhotos.length; i += batchSize) {
    const batch = uploadedPhotos.slice(i, i + batchSize);
    
    // Analyse parallèle avec Promise.all
    const batchResults = await Promise.all(
      batch.map(async (photo) => {
        // 3a. Détection pose automatique
        const poseResult = await poseDetectionService.detectPoseFromUpload(
          photo.imageElement
        );
        
        // 3b. Calcul score qualité
        const qualityScore = calculatePhotoQualityScore({
          poseDetection: poseResult,
          landmarks: poseResult.landmarks,
          dimensions: photo.dimensions
        });
        
        // 3c. Assignation pose intelligente
        const poseAssignment = assignPoseIntelligently(
          poseResult,
          qualityScore
        );
        
        return {
          photo,
          poseResult,
          qualityScore,
          poseAssignment
        };
      })
    );
    
    analysisResults.push(...batchResults);
    
    // Mise à jour progression
    updateProgress((i + batch.length) / uploadedPhotos.length * 100);
  }
  
  // Étape 4 : Réorganisation et validation
  const sessionPhotos = reorganizePhotosForSession(analysisResults);
  
  // Étape 5 : Affichage résultats avec options
  displayUploadResults(sessionPhotos);
};
```

### Assignation Intelligente des Poses Uploadées

```javascript
/**
 * Assigne intelligemment chaque photo uploadée à une pose de la session
 */
const assignPoseIntelligently = (poseResult, qualityScore) => {
  const { detectedPose, confidence, topMatches, orientation } = poseResult;
  
  // Cas 1 : Confiance très élevée (> 85%)
  if (confidence > 0.85 && detectedPose) {
    return {
      assignedPose: detectedPose.poseId,
      confidence: confidence,
      method: 'automatic',
      canOverride: true // Utilisateur peut changer si erreur
    };
  }
  
  // Cas 2 : Confiance moyenne (60-85%) → Top 3 matches
  if (confidence >= 0.60 && confidence <= 0.85) {
    return {
      assignedPose: detectedPose.poseId, // Meilleur match
      alternativePoses: topMatches.slice(1, 3), // 2 autres options
      confidence: confidence,
      method: 'suggested',
      requiresConfirmation: true // Menu déroulant pour confirmation
    };
  }
  
  // Cas 3 : Confiance faible (< 60%) ou pose non détectée
  return {
    assignedPose: null,
    confidence: confidence,
    method: 'manual',
    requiresManualSelection: true, // Sélection manuelle obligatoire
    suggestedPoses: filterPosesByOrientation(orientation) // Filtrer par orientation détectée
  };
};
```

### Gestion des Conflits (Même Pose Détectée Plusieurs Fois)

```javascript
/**
 * Gère cas où plusieurs photos uploadées correspondent à la même pose
 */
const resolvePoseConflicts = (sessionPhotos) => {
  const conflicts = [];
  const poseCounts = {};
  
  // Compter occurrences de chaque pose
  sessionPhotos.forEach(photo => {
    if (photo.poseAssignment.assignedPose) {
      const poseId = photo.poseAssignment.assignedPose;
      poseCounts[poseId] = (poseCounts[poseId] || 0) + 1;
    }
  });
  
  // Identifier conflits (pose assignée > 1 fois)
  Object.entries(poseCounts).forEach(([poseId, count]) => {
    if (count > 1) {
      const photosWithPose = sessionPhotos.filter(
        p => p.poseAssignment.assignedPose === poseId
      );
      
      // Garder photo avec meilleure confiance/qualité
      photosWithPose.sort((a, b) => 
        (b.poseAssignment.confidence * b.qualityScore) - 
        (a.poseAssignment.confidence * a.qualityScore)
      );
      
      // Première = gardée, autres = réassignation requise
      for (let i = 1; i < photosWithPose.length; i++) {
        conflicts.push({
          photo: photosWithPose[i],
          originalPose: poseId,
          reason: 'duplicate_pose',
          action: 'reassign'
        });
      }
    }
  });
  
  return conflicts;
};
```

## 3. SYSTÈME DE NORMALISATION AVANCÉ

### Normalisation Multi-Échelle pour Comparaisons Temporelles

```javascript
/**
 * Normalise métriques pour comparaisons fiables dans le temps
 * Gère variations distance, angle, éclairage, résolution
 */
const normalizeMetricsForComparison = (metrics, photoData, referencePhoto = null) => {
  // Utiliser photo de référence (première session) comme baseline
  if (!referencePhoto) {
    return metrics; // Première photo = pas de normalisation
  }
  
  const normalized = { ...metrics };
  
  // 1. Normalisation par distance (scale factor)
  const referenceDistance = referencePhoto.distance;
  const currentDistance = photoData.distance;
  const distanceScaleFactor = referenceDistance / currentDistance;
  
  // Ajuster volumes (proportionnels à distance²)
  Object.keys(normalized.volume).forEach(muscle => {
    normalized.volume[muscle].percentage *= (distanceScaleFactor ** 2);
    normalized.volume[muscle].score = recalculateScore(
      normalized.volume[muscle].percentage,
      getExpectedPercentage(muscle)
    );
  });
  
  // 2. Normalisation par largeur épaules (référence anatomique)
  const referenceShoulderWidth = calculateShoulderWidth(referencePhoto.landmarks);
  const currentShoulderWidth = calculateShoulderWidth(photoData.landmarks);
  const anatomicalScaleFactor = referenceShoulderWidth / currentShoulderWidth;
  
  // Ajuster métriques dimensionnelles
  Object.keys(normalized).forEach(metricType => {
    if (metricType !== 'symmetry') { // Symétrie déjà normalisée
      normalized[metricType] = applyScaleFactor(
        normalized[metricType],
        anatomicalScaleFactor
      );
    }
  });
  
  // 3. Normalisation éclairage (compensation contraste)
  const lightingCompensation = calculateLightingCompensation(
    referencePhoto.lighting,
    photoData.lighting
  );
  
  // Ajuster métriques dépendantes de la visibilité (définition, vascularité)
  normalized.definition = compensateForLighting(
    normalized.definition,
    lightingCompensation
  );
  normalized.vascularity = compensateForLighting(
    normalized.vascularity,
    lightingCompensation
  );
  
  return {
    ...normalized,
    normalizationFactors: {
      distance: distanceScaleFactor,
      anatomical: anatomicalScaleFactor,
      lighting: lightingCompensation
    }
  };
};
```

## 4. ALGORITHME DE DÉTECTION D'ANOMALIES PHOTO

```javascript
/**
 * Détecte photos aberrantes (qualité très différente, poses incorrectes, etc.)
 */
const detectPhotoAnomalies = (currentPhoto, previousPhotos) => {
  const anomalies = [];
  
  if (previousPhotos.length === 0) {
    return { anomalies: [], warnings: [] }; // Pas de référence
  }
  
  // 1. Anomalie qualité (chute brutale)
  const avgQuality = previousPhotos.reduce((sum, p) => 
    sum + p.qualityScore, 0) / previousPhotos.length;
  const qualityDiff = avgQuality - currentPhoto.qualityScore;
  
  if (qualityDiff > 25) {
    anomalies.push({
      type: 'quality_drop',
      severity: 'high',
      message: `Qualité chute de ${avgQuality.toFixed(0)} à ${currentPhoto.qualityScore.toFixed(0)} (-${qualityDiff.toFixed(0)} points)`,
      recommendation: 'Reprendre photo dans meilleures conditions ou accepter analyse moins précise',
      impact: 'analyse_less_reliable'
    });
  }
  
  // 2. Anomalie pose (pose non standard détectée)
  const expectedPoses = previousPhotos.map(p => p.poseType);
  const isUnusualPose = !expectedPoses.includes(currentPhoto.poseType);
  
  if (isUnusualPose && currentPhoto.poseAssignment.confidence < 0.7) {
    anomalies.push({
      type: 'unusual_pose',
      severity: 'medium',
      message: `Pose détectée "${currentPhoto.poseAssignment.assignedPose}" non standard pour cette session`,
      recommendation: 'Vérifier correspondance avec pose attendue',
      impact: 'may_affect_comparisons'
    });
  }
  
  // 3. Anomalie éclairage (changement drastique)
  const avgLighting = previousPhotos.reduce((sum, p) => 
    sum + p.lighting.lux, 0) / previousPhotos.length;
  const lightingDiff = Math.abs(avgLighting - currentPhoto.lighting.lux);
  
  if (lightingDiff > 300) {
    anomalies.push({
      type: 'lighting_change',
      severity: 'low',
      message: `Éclairage très différent (${currentPhoto.lighting.lux} lux vs moyenne ${avgLighting.toFixed(0)} lux)`,
      recommendation: 'Normalisation automatique activée',
      impact: 'normalized_automatically'
    });
  }
  
  // 4. Anomalie distance (changement significatif)
  const avgDistance = previousPhotos.reduce((sum, p) => 
    sum + p.distance, 0) / previousPhotos.length;
  const distanceDiff = Math.abs(avgDistance - currentPhoto.distance);
  
  if (distanceDiff > 1.0) { // > 1 mètre différence
    anomalies.push({
      type: 'distance_change',
      severity: 'medium',
      message: `Distance très différente (${currentPhoto.distance.toFixed(1)}m vs moyenne ${avgDistance.toFixed(1)}m)`,
      recommendation: 'Normalisation automatique activée, mais meilleur de garder distance constante',
      impact: 'normalized_automatically'
    });
  }
  
  return {
    anomalies: anomalies.filter(a => a.severity === 'high' || a.severity === 'medium'),
    warnings: anomalies.filter(a => a.severity === 'low'),
    requiresUserAction: anomalies.some(a => a.severity === 'high')
  };
};
```

## 5. SYSTÈME DE VALIDATION CROSS-PHOTO (Cohérence Session)

```javascript
/**
 * Valide cohérence entre toutes les photos d'une session
 */
const validateSessionConsistency = (sessionPhotos) => {
  const issues = [];
  
  // 1. Vérifier poses manquantes
  const requiredPoses = getRequiredPosesForSession(sessionPhotos[0].sessionType);
  const capturedPoses = sessionPhotos.map(p => p.poseAssignment.assignedPose);
  const missingPoses = requiredPoses.filter(p => !capturedPoses.includes(p));
  
  if (missingPoses.length > 0) {
    issues.push({
      type: 'missing_poses',
      severity: 'high',
      missingPoses,
      message: `${missingPoses.length} pose(s) manquante(s) pour session complète`,
      recommendation: 'Capturer poses manquantes ou accepter analyse partielle'
    });
  }
  
  // 2. Vérifier qualité cohérente
  const qualityScores = sessionPhotos.map(p => p.qualityScore);
  const qualityStdDev = calculateStandardDeviation(qualityScores);
  const avgQuality = qualityScores.reduce((a, b) => a + b) / qualityScores.length;
  
  if (qualityStdDev > 20) {
    issues.push({
      type: 'inconsistent_quality',
      severity: 'medium',
      stdDev: qualityStdDev,
      avgQuality,
      message: 'Qualité photos très variable (écart-type: ' + qualityStdDev.toFixed(1) + ')',
      recommendation: 'Reprendre photos de faible qualité pour meilleure analyse'
    });
  }
  
  // 3. Vérifier dates cohérentes (session même jour idéalement)
  const dates = sessionPhotos.map(p => new Date(p.timestamp));
  const dateRange = Math.max(...dates) - Math.min(...dates);
  const daysSpan = dateRange / (1000 * 60 * 60 * 24);
  
  if (daysSpan > 1) {
    issues.push({
      type: 'spread_over_multiple_days',
      severity: 'low',
      daysSpan: daysSpan.toFixed(1),
      message: `Photos prises sur ${daysSpan.toFixed(1)} jour(s)`,
      recommendation: 'Idéalement prendre toutes photos même jour (cohérence conditions)'
    });
  }
  
  return {
    valid: issues.filter(i => i.severity === 'high').length === 0,
    issues,
    completeness: ((requiredPoses.length - missingPoses.length) / requiredPoses.length) * 100
  };
};
```

## 6. OPTIMISATIONS PERFORMANCE AVANCÉES

### Pipeline Parallélisé avec Workers Pools

```javascript
/**
 * Analyse photos en parallèle avec pool de Workers
 */
class PhotoAnalysisWorkerPool {
  constructor(workerCount = navigator.hardwareConcurrency || 4) {
    this.workers = [];
    this.queue = [];
    this.activeJobs = 0;
    this.maxConcurrent = workerCount;
    
    // Initialiser pool de workers
    for (let i = 0; i < this.maxConcurrent; i++) {
      this.workers.push({
        id: i,
        worker: new Worker('./workers/photoAnalysisWorker.js'),
        busy: false
      });
    }
  }
  
  async analyzeBatch(photos) {
    return new Promise((resolve) => {
      const results = [];
      let completed = 0;
      
      photos.forEach((photo, index) => {
        this.queue.push({ photo, index, resolve });
      });
      
      this.processQueue();
      
      // Résolve quand toutes photos analysées
      const checkComplete = () => {
        if (completed === photos.length) {
          // Trier résultats par index original
          results.sort((a, b) => a.index - b.index);
          resolve(results.map(r => r.result));
        }
      };
      
      // Intercepter résolutions
      const originalResolve = resolve;
      resolve = (result) => {
        results.push({ result, index: -1 });
        completed++;
        checkComplete();
      };
    });
  }
  
  processQueue() {
    if (this.queue.length === 0 || this.activeJobs >= this.maxConcurrent) {
      return;
    }
    
    const availableWorker = this.workers.find(w => !w.busy);
    if (!availableWorker) return;
    
    const job = this.queue.shift();
    availableWorker.busy = true;
    this.activeJobs++;
    
    availableWorker.worker.postMessage({
      type: 'ANALYZE_PHOTO',
      photoData: job.photo
    });
    
    availableWorker.worker.onmessage = (event) => {
      availableWorker.busy = false;
      this.activeJobs--;
      
      job.resolve(event.data.result);
      this.processQueue(); // Traiter prochain job
    };
  }
}
```

### Cache Stratifié Multi-Niveaux

```javascript
/**
 * Cache à plusieurs niveaux pour optimiser performances
 */
class MultiLevelPhotoCache {
  constructor() {
    // Niveau 1 : Cache mémoire (LRU, rapide)
    this.memoryCache = new Map(); // Max 20 entrées
    this.memoryMaxSize = 20;
    
    // Niveau 2 : Cache IndexedDB (persistant, moyen)
    this.indexedDBCache = null; // Initialisé séparément
    
    // Niveau 3 : Cache calculs intermédiaires (très rapide)
    this.computationCache = new Map(); // Masques, gradients précalculés
  }
  
  async get(photoId, analysisType) {
    // Niveau 1 : Mémoire
    const memoryKey = `${photoId}_${analysisType}`;
    if (this.memoryCache.has(memoryKey)) {
      const cached = this.memoryCache.get(memoryKey);
      // Move to end (LRU)
      this.memoryCache.delete(memoryKey);
      this.memoryCache.set(memoryKey, cached);
      return cached.result;
    }
    
    // Niveau 2 : IndexedDB
    if (this.indexedDBCache) {
      const dbCached = await this.indexedDBCache.get(photoId, analysisType);
      if (dbCached) {
        // Promouvoir vers mémoire cache
        this.set(photoId, analysisType, dbCached, 'memory');
        return dbCached;
      }
    }
    
    return null; // Cache miss
  }
  
  async set(photoId, analysisType, result, level = 'auto') {
    const key = `${photoId}_${analysisType}`;
    
    if (level === 'auto' || level === 'memory') {
      // Niveau 1 : Mémoire
      if (this.memoryCache.size >= this.memoryMaxSize) {
        // Evict oldest
        const firstKey = this.memoryCache.keys().next().value;
        this.memoryCache.delete(firstKey);
      }
      this.memoryCache.set(key, { result, timestamp: Date.now() });
    }
    
    if (level === 'auto' || level === 'persistent') {
      // Niveau 2 : IndexedDB (asynchrone, ne bloque pas)
      if (this.indexedDBCache) {
        this.indexedDBCache.set(photoId, analysisType, result).catch(err => {
          log.warn('Failed to persist cache to IndexedDB', err);
        });
      }
    }
  }
}
```

## 7. SYSTÈME DE RECOMMANDATIONS CONTEXTUELLES

### Recommandations Basées sur Analyse Complète

```javascript
/**
 * Génère recommandations personnalisées basées sur toutes les données
 */
const generateContextualRecommendations = (
  currentSession,
  historicalData,
  trainingData,
  nutritionData,
  recoveryData
) => {
  const recommendations = [];
  
  // 1. Recommandations basées sur gains/stagnation
  const muscleGains = calculateMuscleGains(currentSession, historicalData.lastSession);
  
  Object.entries(muscleGains).forEach(([muscle, gain]) => {
    if (gain.percentageChange > 3) {
      // Fort gain → Maintenir
      recommendations.push({
        type: 'maintain',
        muscle,
        priority: 'high',
        message: `${muscle} : Excellente progression (+${gain.percentageChange.toFixed(1)}%). Maintenir volume actuel.`,
        action: `Continuer ${historicalData.trainingVolume[muscle]} séries/semaine`
      });
    } else if (gain.percentageChange < 1 && gain.percentageChange > -1) {
      // Stagnation → Optimiser
      const correlation = findCorrelation(muscle, trainingData, historicalData);
      
      recommendations.push({
        type: 'optimize',
        muscle,
        priority: 'medium',
        message: `${muscle} : Stagnation détectée (+${gain.percentageChange.toFixed(1)}%).`,
        analysis: correlation ? 
          `Corrélation avec volume: ${correlation.r.toFixed(2)}. Volume actuel: ${historicalData.trainingVolume[muscle]} séries/sem.` :
          'Corrélation faible, autres facteurs à considérer.',
        action: correlation && correlation.r < 0.6 ?
          `Augmenter volume ${muscle}: ${historicalData.trainingVolume[muscle]} → ${historicalData.trainingVolume[muscle] + 6} séries/semaine` :
          'Vérifier nutrition, récupération, technique'
      });
    }
  });
  
  // 2. Recommandations basées sur symétrie
  const symmetryIssues = detectSymmetryIssues(currentSession);
  
  symmetryIssues.forEach(issue => {
    recommendations.push({
      type: 'symmetry',
      muscle: issue.muscle,
      priority: issue.difference > 10 ? 'high' : 'medium',
      message: `${issue.muscle} : Asymétrie détectée (${issue.difference.toFixed(1)}% différence gauche/droite)`,
      action: `Focuser entraînement côté ${issue.weakerSide}, ajouter 2-3 séries unilatérales`
    });
  });
  
  // 3. Recommandations basées sur qualité photos
  const avgQuality = currentSession.photos.reduce((sum, p) => sum + p.qualityScore, 0) / currentSession.photos.length;
  
  if (avgQuality < 70) {
    recommendations.push({
      type: 'photo_quality',
      priority: 'low',
      message: `Qualité moyenne photos: ${avgQuality.toFixed(0)}/100. Analyse moins précise.`,
      action: 'Pour meilleurs résultats, améliorer éclairage et distance lors prochaine session'
    });
  }
  
  // Trier par priorité
  return recommendations.sort((a, b) => {
    const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
};
```

---

**Note :** Ces enrichissements complètent le document principal `suiviphotoapprofondi.md` avec des détails techniques avancés et des algorithmes sophistiqués pour une implémentation optimale.

