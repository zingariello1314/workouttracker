/**
 * Service de détection de pose avec MediaPipe Pose
 * 
 * Détecte 33 landmarks anatomiques en temps réel et valide les poses
 * selon les 15 poses standards définies pour l'analyse corporelle.
 * 
 * Référence: suiviphotoapprofondi.md - Section 8.1.1
 */

import { Pose } from '@mediapipe/pose';
import { POSE_CONNECTIONS } from '@mediapipe/pose';

class PoseDetectionService {
  constructor() {
    this.pose = null;
    this.initialized = false;
    this.initPromise = null;
  }

  /**
   * Initialise MediaPipe Pose (lazy loading - seulement quand nécessaire)
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) {
      return Promise.resolve();
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        // ✅ PHASE 1.7 : Initialisation MediaPipe avec gestion erreurs WASM améliorée
        // Les erreurs WebAssembly sont interceptées globalement dans main.jsx
        // Ici, on initialise MediaPipe avec fallback si CDN échoue
        
        let poseInstance = null;
        let initError = null;

        try {
          // Tentative 1 : CDN jsDelivr (recommandé)
          poseInstance = new Pose({
            locateFile: (file) => {
              // ✅ Utiliser CDN jsDelivr pour les fichiers MediaPipe
              return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
            }
          });
        } catch (cdnError) {
          initError = cdnError;
          console.warn('[PoseDetectionService] Erreur CDN jsDelivr, tentative fallback...', cdnError);
          
          try {
            // Tentative 2 : CDN unpkg (fallback)
            poseInstance = new Pose({
              locateFile: (file) => {
                return `https://unpkg.com/@mediapipe/pose/${file}`;
              }
            });
          } catch (unpkgError) {
            console.error('[PoseDetectionService] Erreur CDN unpkg aussi:', unpkgError);
            // Tentative 3 : Fichiers locaux (si disponibles)
            try {
              poseInstance = new Pose({
                locateFile: (file) => {
                  // Essayer depuis node_modules (si build local)
                  return `/node_modules/@mediapipe/pose/${file}`;
                }
              });
            } catch (localError) {
              throw new Error('Impossible d\'initialiser MediaPipe (tous CDN échoués)');
            }
          }
        }

        this.pose = poseInstance;

        // ✅ PHASE 1.7 : Configuration avec options robustes
        this.pose.setOptions({
          modelComplexity: 1, // 0 = rapide, 1 = équilibré, 2 = précis (plus lent)
          smoothLandmarks: true,
          enableSegmentation: false, // Pas besoin de segmentation ici (BodyPix s'en charge)
          smoothSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        // ✅ PHASE 1.7 : Attendre que MediaPipe soit prêt avec timeout
        // Les erreurs WASM non-bloquantes sont filtrées dans main.jsx
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Timeout initialisation MediaPipe (> 3s)'));
          }, 3000);

          // Attendre un tick pour laisser MediaPipe s'initialiser
          setTimeout(() => {
            clearTimeout(timeout);
            resolve();
          }, 200); // Augmenté de 100ms à 200ms pour laisser plus de temps
        });

        this.initialized = true;
        console.log('[PoseDetectionService] Initialisé avec succès');
      } catch (error) {
        // ✅ PHASE 1.7 : Gestion erreurs améliorée
        const errorMessage = error?.message || error?.toString() || '';
        const errorName = error?.name || '';

        // Filtrer erreurs WASM non-bloquantes (déjà filtrées dans main.jsx mais double vérification)
        if (errorName === 'ErrnoError' && errorMessage.includes('No such file or directory')) {
          // Erreur fichier manquant - MediaPipe peut quand même fonctionner
          console.warn('[PoseDetectionService] Fichier WASM manquant (non-bloquant), continuer...');
          this.initialized = true; // Marquer comme initialisé quand même
          return;
        }

        // Erreur critique - propager
        console.error('[PoseDetectionService] Erreur initialisation critique:', error);
        this.initialized = false;
        this.initPromise = null;
        throw error;
      }
    })();

    return this.initPromise;
  }

  /**
   * Détecte la pose depuis un élément image (webcam ou upload)
   * @param {HTMLImageElement|HTMLVideoElement|HTMLCanvasElement} imageElement 
   * @returns {Promise<Object>} Résultat avec landmarks, confiance, angles
   */
  async detectPose(imageElement) {
    // ✅ PHASE 1.7 : Validation robuste de l'élément image
    if (!imageElement) {
      throw new Error('Élément image invalide (null ou undefined)');
    }

    // Vérifier que l'élément est valide et a des dimensions
    const isValidElement = 
      imageElement instanceof HTMLImageElement ||
      imageElement instanceof HTMLVideoElement ||
      imageElement instanceof HTMLCanvasElement;

    if (!isValidElement) {
      throw new Error(`Type d'élément invalide: ${imageElement.constructor.name}`);
    }

    // Vérifier dimensions valides
    const width = imageElement.width || imageElement.videoWidth || 0;
    const height = imageElement.height || imageElement.videoHeight || 0;
    
    if (width === 0 || height === 0) {
      throw new Error(`Dimensions invalides: ${width}x${height}`);
    }

    // Pour HTMLVideoElement, vérifier readyState
    if (imageElement instanceof HTMLVideoElement) {
      if (imageElement.readyState < 2) { // HAVE_CURRENT_DATA
        throw new Error(`Vidéo pas prête (readyState: ${imageElement.readyState})`);
      }
    }

    await this.initialize();

    // ✅ PHASE 1.7 : Vérifier que MediaPipe est bien initialisé
    if (!this.pose) {
      throw new Error('MediaPipe Pose non initialisé');
    }

    return new Promise((resolve, reject) => {
      let resolved = false;
      let timeoutId = null;

      try {
        // Callback unique pour cette détection
        const onResults = (results) => {
          if (resolved) return; // Éviter double résolution
          resolved = true;
          
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }

          // ✅ PHASE 1.7 : Gestion robuste des résultats
          if (!results || !results.poseLandmarks || results.poseLandmarks.length === 0) {
            resolve({
              detected: false,
              confidence: 0,
              landmarks: null,
              reason: 'Aucun landmark détecté'
            });
            return;
          }

          try {
            // Calculer confiance moyenne basée sur visibilité landmarks
            const avgVisibility = results.poseLandmarks.reduce(
              (sum, landmark) => sum + (landmark.visibility || 0), 
              0
            ) / results.poseLandmarks.length;

            // Calculer angles articulaires
            const angles = this.calculateAngles(results.poseLandmarks);

            resolve({
              detected: true,
              confidence: avgVisibility,
              landmarks: results.poseLandmarks, // 33 points (x, y, z, visibility)
              worldLandmarks: results.poseWorldLandmarks, // Coordonnées 3D
              angles,
              connections: POSE_CONNECTIONS
            });
          } catch (calcError) {
            // Erreur dans calcul angles/confiance - retourner résultat partiel
            console.warn('[PoseDetectionService] Erreur calcul angles, retour résultat partiel:', calcError);
            resolve({
              detected: true,
              confidence: 0.5, // Confiance par défaut
              landmarks: results.poseLandmarks,
              worldLandmarks: results.poseWorldLandmarks,
              angles: {},
              connections: POSE_CONNECTIONS,
              warning: 'Calcul angles échoué'
            });
          }
        };

        // Configurer callback résultats
        this.pose.onResults(onResults);

        // ✅ PHASE 1.7 : Envelopper send() dans try-catch pour capturer erreurs synchrones
        // Note: Les erreurs WASM asynchrones sont filtrées dans main.jsx
        try {
          this.pose.send({ image: imageElement });
        } catch (sendError) {
          // Erreur synchrone lors de l'envoi (rare mais possible)
          if (resolved) return;
          resolved = true;
          
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          
          const errorMessage = sendError?.message || sendError?.toString() || '';
          const errorName = sendError?.name || '';

          // ✅ Filtrer erreurs WASM non-bloquantes (déjà filtrées dans main.jsx mais double vérification)
          if (errorName === 'ErrnoError' || 
              (errorName === 'RuntimeError' && errorMessage.includes('Aborted'))) {
            // Erreur WASM non-bloquante - MediaPipe peut continuer
            // Les erreurs asynchrones seront gérées par les event listeners globaux
            console.warn('[PoseDetectionService] Erreur WASM synchrone (non-bloquante), continuer...');
            // Ne pas rejeter - laisser MediaPipe continuer (les erreurs WASM sont filtrées)
            return;
          }

          // Erreur critique synchrone - rejeter
          console.error('[PoseDetectionService] Erreur synchrone critique:', sendError);
          reject(sendError);
          return;
        }

        // ✅ PHASE 1.7 : Timeout sécurité amélioré (5 secondes max)
        timeoutId = setTimeout(() => {
          if (!resolved) {
            resolved = true;
            reject(new Error('Timeout détection pose (> 5s) - MediaPipe ne répond pas'));
          }
        }, 5000);

      } catch (error) {
        if (resolved) return;
        resolved = true;
        
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        
        console.error('[PoseDetectionService] Erreur détection:', error);
        reject(error);
      }
    });
  }

  /**
   * Calcule les angles articulaires principaux depuis les landmarks
   * @param {Array} landmarks - 33 landmarks MediaPipe
   * @returns {Object} Angles en degrés
   */
  calculateAngles(landmarks) {
    const angles = {};

    // Épaule gauche (11), Coude gauche (13), Poignet gauche (15)
    if (landmarks[11] && landmarks[13] && landmarks[15]) {
      angles.leftElbow = this.angleBetweenPoints(
        landmarks[11], // Épaule
        landmarks[13], // Coude
        landmarks[15]  // Poignet
      );
    }

    // Épaule droite (12), Coude droit (14), Poignet droit (16)
    if (landmarks[12] && landmarks[14] && landmarks[16]) {
      angles.rightElbow = this.angleBetweenPoints(
        landmarks[12], // Épaule
        landmarks[14], // Coude
        landmarks[16]  // Poignet
      );
    }

    // Épaule gauche, Épaule droite, Coude gauche (angle épaule gauche)
    if (landmarks[11] && landmarks[12] && landmarks[13]) {
      angles.leftShoulder = this.angleBetweenPoints(
        landmarks[12], // Épaule droite (référence)
        landmarks[11], // Épaule gauche
        landmarks[13]  // Coude gauche
      );
    }

    // Épaule droite, Épaule gauche, Coude droit (angle épaule droite)
    if (landmarks[12] && landmarks[11] && landmarks[14]) {
      angles.rightShoulder = this.angleBetweenPoints(
        landmarks[11], // Épaule gauche (référence)
        landmarks[12], // Épaule droite
        landmarks[14]  // Coude droit
      );
    }

    // Hanche gauche (23), Genou gauche (25), Cheville gauche (27)
    if (landmarks[23] && landmarks[25] && landmarks[27]) {
      angles.leftKnee = this.angleBetweenPoints(
        landmarks[23], // Hanche
        landmarks[25], // Genou
        landmarks[27]  // Cheville
      );
    }

    // Hanche droite (24), Genou droit (26), Cheville droite (28)
    if (landmarks[24] && landmarks[26] && landmarks[28]) {
      angles.rightKnee = this.angleBetweenPoints(
        landmarks[24], // Hanche
        landmarks[26], // Genou
        landmarks[28]  // Cheville
      );
    }

    return angles;
  }

  /**
   * Calcule l'angle entre 3 points (point central = sommet angle)
   * @param {Object} point1 - Point {x, y, z?}
   * @param {Object} point2 - Point central (sommet angle)
   * @param {Object} point3 - Point {x, y, z?}
   * @returns {number} Angle en degrés (0-180°)
   */
  angleBetweenPoints(point1, point2, point3) {
    // Vecteurs depuis point central
    const vector1 = {
      x: point1.x - point2.x,
      y: point1.y - point2.y,
      z: (point1.z || 0) - (point2.z || 0)
    };

    const vector2 = {
      x: point3.x - point2.x,
      y: point3.y - point2.y,
      z: (point3.z || 0) - (point2.z || 0)
    };

    // Produit scalaire
    const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y + vector1.z * vector2.z;

    // Normes des vecteurs
    const norm1 = Math.sqrt(vector1.x ** 2 + vector1.y ** 2 + vector1.z ** 2);
    const norm2 = Math.sqrt(vector2.x ** 2 + vector2.y ** 2 + vector2.z ** 2);

    // Éviter division par zéro
    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    // Angle en radians puis conversion en degrés
    const cosAngle = dotProduct / (norm1 * norm2);
    const angleRad = Math.acos(Math.max(-1, Math.min(1, cosAngle))); // Clamp [-1, 1]
    const angleDeg = angleRad * (180 / Math.PI);

    return Math.round(angleDeg * 10) / 10; // Arrondi à 1 décimale
  }

  /**
   * Valide si la pose détectée correspond à une pose attendue
   * @param {Array} landmarks - Landmarks détectés
   * @param {Object} expectedPose - Pose de référence avec angles attendus
   * @returns {Object} Validation avec score, confiance, angles matchés
   */
  validatePose(landmarks, expectedPose) {
    const angles = this.calculateAngles(landmarks);
    const expectedAngles = expectedPose.expectedAngles || {};
    
    let matched = 0;
    let total = 0;
    let totalMatchScore = 0;

    // Valider chaque angle attendu
    Object.keys(expectedAngles).forEach(angleKey => {
      if (angles[angleKey] !== undefined) {
        total++;
        const detectedAngle = angles[angleKey];
        const expected = expectedAngles[angleKey];
        
        // Support format: {value: 90, tolerance: 20} ou {min: 80, max: 100}
        const range = expected.min !== undefined && expected.max !== undefined
          ? { min: expected.min, max: expected.max }
          : { 
              min: expected.value - (expected.tolerance || 15), 
              max: expected.value + (expected.tolerance || 15) 
            };

        if (detectedAngle >= range.min && detectedAngle <= range.max) {
          matched++;
          totalMatchScore += 1.0; // Match parfait
        } else {
          // Score partiel selon écart
          const deviation = Math.min(
            Math.abs(detectedAngle - range.min),
            Math.abs(detectedAngle - range.max)
          );
          const maxDeviation = (expected.tolerance || 15) * 2;
          const partialScore = Math.max(0, 1 - (deviation / maxDeviation));
          totalMatchScore += partialScore;
        }
      }
    });

    const confidence = total > 0 ? (matched / total) * 100 : 0;
    const weightedScore = total > 0 ? (totalMatchScore / total) * 100 : 0;

    return {
      valid: confidence >= 70, // Seuil: 70% des angles dans tolérance
      confidence: Math.round(confidence * 10) / 10,
      weightedScore: Math.round(weightedScore * 10) / 10,
      matchedAngles: matched,
      totalAngles: total,
      angles,
      matchedDetails: Object.keys(expectedAngles).map(key => ({
        angle: key,
        detected: angles[key],
        expected: expectedAngles[key],
        matched: angles[key] !== undefined && 
          ((expectedAngles[key].min !== undefined && 
            angles[key] >= expectedAngles[key].min && 
            angles[key] <= expectedAngles[key].max) ||
           (expectedAngles[key].value !== undefined && 
            Math.abs(angles[key] - expectedAngles[key].value) <= (expectedAngles[key].tolerance || 15)))
      }))
    };
  }

  /**
   * Détecte automatiquement la pose d'une photo uploadée
   * Compare avec base de données de 15 poses standards
   * @param {HTMLImageElement} imageElement 
   * @returns {Promise<Object>} Pose détectée avec confiance et alternatives
   */
  async detectPoseFromUpload(imageElement) {
    const poseResult = await this.detectPose(imageElement);

    if (!poseResult.detected) {
      return {
        detected: false,
        confidence: 0,
        reason: poseResult.reason || 'Pose non détectée',
        suggestedPoses: []
      };
    }

    // Détecter orientation générale (face/profil/dos)
    const orientation = this.detectOrientation(poseResult.landmarks);

    // Base de données des 15 poses standards
    const poseDatabase = this.getPoseDatabase();

    // Filtrer poses selon orientation
    const filteredPoses = this.filterPosesByOrientation(poseDatabase, orientation);

    // Comparer avec chaque pose filtrée
    let bestMatch = null;
    let maxConfidence = 0;
    const allMatches = [];

    for (const [poseId, poseRef] of Object.entries(filteredPoses)) {
      const validation = this.validatePose(poseResult.landmarks, poseRef);
      
      allMatches.push({
        poseId,
        poseName: poseRef.name,
        confidence: validation.confidence,
        weightedScore: validation.weightedScore
      });

      if (validation.weightedScore > maxConfidence) {
        maxConfidence = validation.weightedScore;
        bestMatch = {
          poseId,
          poseName: poseRef.name,
          confidence: validation.weightedScore,
          angles: validation.angles,
          validation
        };
      }
    }

    // Trier par confiance
    allMatches.sort((a, b) => b.confidence - a.confidence);

    return {
      detected: maxConfidence >= 60, // Seuil détection: 60%
      confidence: maxConfidence,
      detectedPose: bestMatch,
      topMatches: allMatches.slice(0, 3), // Top 3 pour choix utilisateur
      orientation,
      poseResult
    };
  }

  /**
   * Détecte orientation générale (face/profil/dos) depuis landmarks
   * @param {Array} landmarks 
   * @returns {string} 'front' | 'side' | 'back'
   */
  detectOrientation(landmarks) {
    if (!landmarks || landmarks.length < 12) {
      return 'unknown';
    }

    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const nose = landmarks[0];

    if (!leftShoulder || !rightShoulder || !nose) {
      return 'unknown';
    }

    // Largeur épaules
    const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x);
    const centerX = (leftShoulder.x + rightShoulder.x) / 2;
    const noseOffset = Math.abs(nose.x - centerX) / (shoulderWidth || 0.01);

    // Si nez proche du centre → Face
    if (noseOffset < 0.2) {
      return 'front';
    }

    // Si nez décalé → Profil
    if (noseOffset > 0.4) {
      return 'side';
    }

    // Vérifier visibilité épaules pour différencier dos/profil
    const shouldersVisible = 
      (leftShoulder.visibility || 0) > 0.7 && 
      (rightShoulder.visibility || 0) > 0.7;

    // Si épaules peu visibles → Dos
    if (!shouldersVisible && shoulderWidth < 0.15) {
      return 'back';
    }

    return 'side'; // Par défaut: profil
  }

  /**
   * Filtre poses selon orientation détectée
   * @param {Object} poseDatabase 
   * @param {string} orientation 
   * @returns {Object} Poses filtrées
   */
  filterPosesByOrientation(poseDatabase, orientation) {
    const filtered = {};

    for (const [poseId, poseRef] of Object.entries(poseDatabase)) {
      if (poseRef.orientation === orientation || poseRef.orientation === 'any') {
        filtered[poseId] = poseRef;
      }
    }

    return filtered;
  }

  /**
   * Retourne base de données des 15 poses standards
   * Définitions complètes avec angles attendus
   * @returns {Object} Base de données poses
   */
  getPoseDatabase() {
    return {
      // TIER 1 - ESSENTIELLES (6 poses)
      'front_relaxed': {
        name: 'Face - Décontracté',
        orientation: 'front',
        expectedAngles: {
          leftElbow: { value: 180, tolerance: 20 },
          rightElbow: { value: 180, tolerance: 20 },
          leftShoulder: { value: 0, tolerance: 15 },
          rightShoulder: { value: 0, tolerance: 15 }
        }
      },
      'front_contracted_biceps': {
        name: 'Face - Contracté Double Biceps',
        orientation: 'front',
        expectedAngles: {
          leftElbow: { value: 90, tolerance: 20 },
          rightElbow: { value: 90, tolerance: 20 },
          leftShoulder: { value: 90, tolerance: 20 },
          rightShoulder: { value: 90, tolerance: 20 }
        }
      },
      'front_contracted_pectorals': {
        name: 'Face - Contracté Pectoraux',
        orientation: 'front',
        expectedAngles: {
          leftElbow: { min: 90, max: 120 },
          rightElbow: { min: 90, max: 120 },
          leftShoulder: { value: 20, tolerance: 15 }, // Rétraction scapulaire
          rightShoulder: { value: 20, tolerance: 15 }
        }
      },
      'back_relaxed': {
        name: 'Dos - Décontracté',
        orientation: 'back',
        expectedAngles: {
          leftElbow: { value: 180, tolerance: 20 },
          rightElbow: { value: 180, tolerance: 20 },
          leftShoulder: { value: 0, tolerance: 15 },
          rightShoulder: { value: 0, tolerance: 15 }
        }
      },
      'back_contracted_biceps': {
        name: 'Dos - Contracté Double Biceps',
        orientation: 'back',
        expectedAngles: {
          leftElbow: { value: 90, tolerance: 20 },
          rightElbow: { value: 90, tolerance: 20 },
          leftShoulder: { value: 90, tolerance: 20 }
        }
      },
      'front_legs_contracted': {
        name: 'Face Jambes - Contracté Quadriceps',
        orientation: 'front',
        expectedAngles: {
          leftKnee: { min: 150, max: 165 },
          rightKnee: { min: 150, max: 165 }
        }
      },

      // TIER 2 - IMPORTANTES (6 poses)
      'side_right_relaxed': {
        name: 'Profil Droit - Décontracté',
        orientation: 'side',
        expectedAngles: {
          leftElbow: { value: 180, tolerance: 20 },
          leftShoulder: { value: 0, tolerance: 15 }
        }
      },
      'side_right_contracted': {
        name: 'Profil Droit - Contracté Triceps',
        orientation: 'side',
        expectedAngles: {
          leftElbow: { value: 180, tolerance: 10 },
          leftShoulder: { min: 90, max: 110 }
        }
      },
      'side_left_relaxed': {
        name: 'Profil Gauche - Décontracté',
        orientation: 'side',
        expectedAngles: {
          rightElbow: { value: 180, tolerance: 20 },
          rightShoulder: { value: 0, tolerance: 15 }
        }
      },
      'side_left_contracted': {
        name: 'Profil Gauche - Contracté Triceps',
        orientation: 'side',
        expectedAngles: {
          rightElbow: { value: 180, tolerance: 10 },
          rightShoulder: { min: 90, max: 110 }
        }
      },
      'back_legs_relaxed': {
        name: 'Dos Jambes - Décontracté',
        orientation: 'back',
        expectedAngles: {
          leftKnee: { min: 170, max: 180 },
          rightKnee: { min: 170, max: 180 }
        }
      },
      'back_legs_contracted': {
        name: 'Dos Jambes - Contracté Mollets',
        orientation: 'back',
        expectedAngles: {
          leftKnee: { min: 160, max: 180 },
          rightKnee: { min: 160, max: 180 }
        }
      },

      // TIER 3 - OPTIONNELLES (3 poses)
      'front_legs_relaxed': {
        name: 'Face Jambes - Décontracté',
        orientation: 'front',
        expectedAngles: {
          leftKnee: { min: 170, max: 180 },
          rightKnee: { min: 170, max: 180 }
        }
      },
      'side_right_legs': {
        name: 'Profil Droit Jambes',
        orientation: 'side',
        expectedAngles: {
          leftKnee: { min: 160, max: 180 }
        }
      },
      'side_left_legs': {
        name: 'Profil Gauche Jambes',
        orientation: 'side',
        expectedAngles: {
          rightKnee: { min: 160, max: 180 }
        }
      }
    };
  }

  /**
   * Libère ressources (à appeler quand plus nécessaire)
   */
  dispose() {
    if (this.pose) {
      // MediaPipe ne dispose pas d'une méthode close explicite
      // Mais on peut réinitialiser les références
      this.pose = null;
    }
    this.initialized = false;
    this.initPromise = null;
  }
}

// Singleton pour éviter multiples instances
let instance = null;

export const getPoseDetectionService = () => {
  if (!instance) {
    instance = new PoseDetectionService();
  }
  return instance;
};

export default getPoseDetectionService;

