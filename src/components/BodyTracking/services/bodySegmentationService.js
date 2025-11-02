/**
 * Service de segmentation corporelle avec BodyPix
 * 
 * Sépare le corps en 24 parties anatomiques distinctes pour analyse muscle par muscle.
 * Génère des masques binaires pour chaque groupe musculaire.
 * 
 * Référence: suiviphotoapprofondi.md - Section 8.1.2
 */

import * as bodyPix from '@tensorflow-models/body-pix';
import * as tf from '@tensorflow/tfjs';

class BodySegmentationService {
  constructor() {
    this.model = null;
    this.loaded = false;
    this.loadPromise = null;
  }

  /**
   * Charge le modèle BodyPix (lazy loading - seulement quand nécessaire)
   * @param {Object} options - Options de chargement (architecture, outputStride, etc.)
   * @returns {Promise<void>}
   */
  async loadModel(options = {}) {
    if (this.loaded && this.model) {
      return Promise.resolve();
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = (async () => {
      try {
        // Configuration optimisée: équilibre vitesse/précision
        const config = {
          architecture: options.architecture || 'MobileNetV1', // MobileNetV1 (léger) ou ResNet50 (précis mais lent)
          outputStride: options.outputStride || 16, // 8 = précis mais lent, 16 = équilibré, 32 = rapide
          multiplier: options.multiplier || 0.75, // 0.5, 0.75, ou 1.0 (trade-off vitesse/précision)
          quantBytes: options.quantBytes || 2 // 1, 2, ou 4 (compression modèle)
        };

        console.log('[BodySegmentationService] Chargement modèle BodyPix...', config);
        
        this.model = await bodyPix.load(config);
        this.loaded = true;
        
        console.log('[BodySegmentationService] Modèle chargé avec succès');
      } catch (error) {
        console.error('[BodySegmentationService] Erreur chargement modèle:', error);
        this.loaded = false;
        this.loadPromise = null;
        throw error;
      }
    })();

    return this.loadPromise;
  }

  /**
   * Segmente le corps en parties anatomiques
   * @param {HTMLImageElement|HTMLVideoElement|HTMLCanvasElement} imageElement 
   * @param {Object} options - Options de segmentation
   * @returns {Promise<Object>} Segmentation avec masques par partie
   */
  async segmentBody(imageElement, options = {}) {
    await this.loadModel();

    const segmentOptions = {
      flipHorizontal: options.flipHorizontal || false,
      internalResolution: options.internalResolution || 'medium', // 'low', 'medium', 'high', 'full'
      segmentationThreshold: options.segmentationThreshold || 0.5
    };

    try {
      // Segmentation avec parties corporelles (24 parties)
      const segmentation = await this.model.segmentPersonParts(imageElement, segmentOptions);

      // Extraire masques par groupe musculaire
      const muscleMasks = this.extractMuscleMasks(segmentation);

      return {
        success: true,
        segmentation,
        masks: muscleMasks,
        width: segmentation.width,
        height: segmentation.height,
        confidence: this.calculateSegmentationConfidence(segmentation)
      };
    } catch (error) {
      console.error('[BodySegmentationService] Erreur segmentation:', error);
      return {
        success: false,
        error: error.message,
        masks: {}
      };
    }
  }

  /**
   * Extrait masques binaires pour chaque groupe musculaire
   * @param {Object} segmentation - Résultat BodyPix segmentation
   * @returns {Object} Masques par groupe musculaire
   */
  extractMuscleMasks(segmentation) {
    const masks = {};

    // BodyPix identifie 24 parties:
    // 0 = background
    // 1 = torso (torse)
    // 2 = leftUpperArm (bras supérieur gauche)
    // 3 = rightUpperArm (bras supérieur droit)
    // 4 = leftLowerArm (avant-bras gauche)
    // 5 = rightLowerArm (avant-bras droit)
    // 6 = leftHand (main gauche)
    // 7 = rightHand (main droite)
    // 8 = leftUpperLeg (cuisse gauche)
    // 9 = rightUpperLeg (cuisse droite)
    // 10 = leftLowerLeg (jambe gauche)
    // 11 = rightLowerLeg (jambe droite)
    // 12 = leftFoot (pied gauche)
    // 13 = rightFoot (pied droit)
    // 14 = head (tête)
    // 15 = neck (cou)

    const partNames = [
      'background', 'torso', 'leftUpperArm', 'rightUpperArm',
      'leftLowerArm', 'rightLowerArm', 'leftHand', 'rightHand',
      'leftUpperLeg', 'rightUpperLeg', 'leftLowerLeg', 'rightLowerLeg',
      'leftFoot', 'rightFoot', 'head', 'neck'
    ];

    // Créer masque binaire pour chaque partie
    for (let partId = 1; partId < partNames.length; partId++) {
      const partName = partNames[partId];
      const mask = this.createBinaryMask(
        segmentation.data,
        partId,
        segmentation.width,
        segmentation.height
      );

      masks[partName] = mask;
    }

    // Mapping vers groupes musculaires selon contexte (sera enrichi avec analyse pose)
    masks.muscleGroups = this.mapPartsToMuscleGroups(masks);

    return masks;
  }

  /**
   * Crée masque binaire pour une partie corporelle
   * @param {Uint8Array} segmentationData - Données segmentation BodyPix
   * @param {number} partId - ID partie (1-15)
   * @param {number} width - Largeur image
   * @param {number} height - Hauteur image
   * @returns {Object} Masque binaire {data: Uint8Array, width, height}
   */
  createBinaryMask(segmentationData, partId, width, height) {
    const mask = new Uint8Array(width * height);

    for (let i = 0; i < segmentationData.length; i++) {
      mask[i] = segmentationData[i] === partId ? 255 : 0;
    }

    return {
      data: mask,
      width,
      height,
      partId
    };
  }

  /**
   * Mappe parties corporelles vers groupes musculaires
   * Subdivise le torse en pectoraux/abdominaux selon besoin
   * @param {Object} parts - Masques par partie
   * @returns {Object} Masques par groupe musculaire
   */
  mapPartsToMuscleGroups(parts) {
    const muscleGroups = {};

    // Torse → Pectoraux + Abdominaux (subdivision sera faite avec landmarks MediaPipe)
    if (parts.torso) {
      muscleGroups.pectorals = parts.torso; // Temporaire, subdivision plus tard
      muscleGroups.abdominals = parts.torso; // Temporaire
    }

    // Bras supérieur face → Biceps
    // Bras supérieur dos → Triceps
    // On utilisera l'orientation de la pose pour déterminer face/dos
    muscleGroups.leftBiceps = parts.leftUpperArm;
    muscleGroups.rightBiceps = parts.rightUpperArm;
    muscleGroups.leftTriceps = parts.leftUpperArm; // Sera ajusté selon orientation
    muscleGroups.rightTriceps = parts.rightUpperArm;

    // Cuisse avant → Quadriceps
    muscleGroups.leftQuadriceps = parts.leftUpperLeg;
    muscleGroups.rightQuadriceps = parts.rightUpperLeg;

    // Cuisse arrière → Ischio-jambiers
    muscleGroups.leftHamstrings = parts.leftUpperLeg; // Sera ajusté selon orientation
    muscleGroups.rightHamstrings = parts.rightUpperLeg;

    // Jambe inférieure → Mollets
    muscleGroups.leftCalves = parts.leftLowerLeg;
    muscleGroups.rightCalves = parts.rightLowerLeg;

    // Torse arrière → Dorsaux + Trapèzes
    // (Sera affiné avec orientation)

    return muscleGroups;
  }

  /**
   * Calcule confiance de segmentation
   * @param {Object} segmentation 
   * @returns {number} Confiance 0-1
   */
  calculateSegmentationConfidence(segmentation) {
    if (!segmentation || !segmentation.data) {
      return 0;
    }

    // Compter pixels corps vs background
    const totalPixels = segmentation.data.length;
    let bodyPixels = 0;

    for (let i = 0; i < totalPixels; i++) {
      if (segmentation.data[i] > 0) { // > 0 = partie du corps
        bodyPixels++;
      }
    }

    // Ratio corps/total = confiance basique
    const bodyRatio = bodyPixels / totalPixels;

    // Normaliser (idéal: 20-60% du cadre = corps)
    if (bodyRatio < 0.1 || bodyRatio > 0.8) {
      return Math.max(0, Math.min(1, bodyRatio * 1.5)); // Pénalité si trop petit/grand
    }

    return Math.min(1, bodyRatio * 1.8); // Score optimiste si dans plage normale
  }

  /**
   * Subdivise masque torse en pectoraux/abdominaux selon landmarks MediaPipe
   * @param {Object} torsoMask - Masque torse complet
   * @param {Array} landmarks - Landmarks MediaPipe (33 points)
   * @returns {Object} {pectorals: mask, abdominals: mask}
   */
  subdivideTorsoByLandmarks(torsoMask, landmarks) {
    if (!landmarks || landmarks.length < 24) {
      // Fallback: garder torse entier pour les deux
      return {
        pectorals: torsoMask,
        abdominals: torsoMask
      };
    }

    const width = torsoMask.width;
    const height = torsoMask.height;

    // Landmarks clés:
    // 11 = épaule gauche, 12 = épaule droite
    // 23 = hanche gauche, 24 = hanche droite
    // 7-8 = oreilles (pour limite supérieure)

    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];

    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
      return {
        pectorals: torsoMask,
        abdominals: torsoMask
      };
    }

    // Calculer ligne de séparation (entre épaules et hanches)
    const shoulderAvgY = ((leftShoulder.y + rightShoulder.y) / 2) * height;
    const hipAvgY = ((leftHip.y + rightHip.y) / 2) * height;
    const splitY = shoulderAvgY + ((hipAvgY - shoulderAvgY) * 0.45); // 45% du torse = pectoraux

    // Créer masques séparés
    const pectoralsMask = new Uint8Array(width * height);
    const abdominalsMask = new Uint8Array(width * height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = y * width + x;
        const isTorso = torsoMask.data[index] > 0;

        if (isTorso) {
          if (y < splitY) {
            pectoralsMask[index] = 255;
          } else {
            abdominalsMask[index] = 255;
          }
        }
      }
    }

    return {
      pectorals: {
        data: pectoralsMask,
        width,
        height
      },
      abdominals: {
        data: abdominalsMask,
        width,
        height
      }
    };
  }

  /**
   * Ajuste mapping muscles selon orientation pose (face/profil/dos)
   * @param {Object} parts - Masques parties
   * @param {string} orientation - 'front' | 'side' | 'back'
   * @returns {Object} Masques ajustés par groupe musculaire
   */
  adjustMuscleMappingByOrientation(parts, orientation) {
    const adjusted = { ...parts.muscleGroups };

    if (orientation === 'front') {
      // Face: bras supérieur = biceps visible, triceps caché
      adjusted.leftBiceps = parts.leftUpperArm;
      adjusted.rightBiceps = parts.rightUpperArm;
      adjusted.leftTriceps = null; // Non visible face
      adjusted.rightTriceps = null;
      
      // Jambes: cuisse = quadriceps visible
      adjusted.leftQuadriceps = parts.leftUpperLeg;
      adjusted.rightQuadriceps = parts.rightUpperLeg;
      adjusted.leftHamstrings = null; // Non visible face
      adjusted.rightHamstrings = null;

    } else if (orientation === 'back') {
      // Dos: bras supérieur = triceps visible, biceps caché
      adjusted.leftTriceps = parts.leftUpperArm;
      adjusted.rightTriceps = parts.rightUpperArm;
      adjusted.leftBiceps = null; // Non visible dos
      adjusted.rightBiceps = null;
      
      // Jambes: cuisse = ischio-jambiers visible
      adjusted.leftHamstrings = parts.leftUpperLeg;
      adjusted.rightHamstrings = parts.rightUpperLeg;
      adjusted.leftQuadriceps = null; // Non visible dos
      adjusted.rightQuadriceps = null;

    } else if (orientation === 'side') {
      // Profil: les deux côtés visibles mais partiellement
      adjusted.leftBiceps = parts.leftUpperArm;
      adjusted.leftTriceps = parts.leftUpperArm;
      adjusted.rightBiceps = parts.rightUpperArm;
      adjusted.rightTriceps = parts.rightUpperArm;
      
      adjusted.leftQuadriceps = parts.leftUpperLeg;
      adjusted.leftHamstrings = parts.leftUpperLeg;
      adjusted.rightQuadriceps = parts.rightUpperLeg;
      adjusted.rightHamstrings = parts.rightUpperLeg;
    }

    return adjusted;
  }

  /**
   * Libère ressources TensorFlow
   */
  async dispose() {
    if (this.model) {
      // TensorFlow.js gère la mémoire automatiquement
      // Mais on peut forcer nettoyage si nécessaire
      await tf.dispose();
    }
    this.model = null;
    this.loaded = false;
    this.loadPromise = null;
  }
}

// Singleton pour éviter multiples instances
let instance = null;

export const getBodySegmentationService = () => {
  if (!instance) {
    instance = new BodySegmentationService();
  }
  return instance;
};

export default getBodySegmentationService;

