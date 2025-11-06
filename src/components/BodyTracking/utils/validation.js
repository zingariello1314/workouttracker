/**
 * 📋 MODULE DE VALIDATION COMPLET - SUIVI CORPOREL
 * 
 * Validation centralisée, réutilisable et robuste pour toutes les métriques corporelles.
 * Utilise des plages réalistes, des validations croisées, et des messages d'erreur clairs.
 */

import logger from '../../../utils/logger';

const log = logger.module('Validation');

/**
 * Plages de validation réalistes pour chaque métrique
 */
export const VALIDATION_RANGES = {
  // Métriques de base
  weight: { min: 30, max: 300, step: 0.1, decimals: 1, unit: 'kg' },
  height: { min: 100, max: 250, step: 0.1, decimals: 1, unit: 'cm' },
  
  // Mensurations (en cm)
  waist: { min: 40, max: 200, step: 0.1, decimals: 1, unit: 'cm' },
  chest: { min: 60, max: 200, step: 0.1, decimals: 1, unit: 'cm' },
  arms: { min: 15, max: 80, step: 0.1, decimals: 1, unit: 'cm' },
  thighs: { min: 30, max: 150, step: 0.1, decimals: 1, unit: 'cm' },
  neck: { min: 20, max: 80, step: 0.1, decimals: 1, unit: 'cm' },
  hips: { min: 60, max: 200, step: 0.1, decimals: 1, unit: 'cm' },
  
  // Impédancemétrie - Champs exacts demandés
  weight: { min: 30, max: 300, step: 0.1, decimals: 2, unit: 'kg' }, // ✅ 2 décimales pour précision
  bmi: { min: 10, max: 60, step: 0.1, decimals: 2, unit: '' }, // ✅ 2 décimales pour précision
  bodyFatPercentage: { min: 3, max: 50, step: 0.1, decimals: 2, unit: '%' }, // ✅ 2 décimales pour précision
  muscleMass: { min: 10, max: 120, step: 0.1, decimals: 2, unit: 'kg' }, // ✅ 2 décimales pour précision
  bodyFatMass: { min: 2, max: 150, step: 0.1, decimals: 2, unit: 'kg' }, // ✅ 2 décimales pour précision (7.47 OK)
  bodyFatIndex: { min: 0, max: 8, step: 0.1, decimals: 2, unit: '/8' }, // ✅ 2 décimales
  obesityLevel: { min: 0, max: 5, step: 0.1, decimals: 2, unit: '/5' }, // ✅ 2 décimales
  visceralFatIndex: { min: 0, max: 20, step: 0.1, decimals: 2, unit: '/20' }, // ✅ 2 décimales
  fatFreeWeight: { min: 20, max: 200, step: 0.1, decimals: 2, unit: 'kg' }, // ✅ 2 décimales pour précision
  bodyWater: { min: 30, max: 80, step: 0.1, decimals: 2, unit: '%' }, // ✅ 2 décimales pour précision
  boneMass: { min: 1, max: 15, step: 0.1, decimals: 2, unit: 'kg' }, // ✅ 2 décimales pour précision
  proteinPercentage: { min: 5, max: 25, step: 0.1, decimals: 2, unit: '%' }, // ✅ 2 décimales pour précision
  basalMetabolism: { min: 800, max: 4000, step: 1, decimals: 0, unit: 'kcal' }, // ✅ Entier (pas de décimales)
  metabolicAge: { min: 10, max: 100, step: 1, decimals: 0, unit: 'ans' } // ✅ Entier (pas de décimales)
};

/**
 * Valide une valeur numérique selon une plage définie
 * @param {string|number} value - Valeur à valider
 * @param {string} fieldName - Nom du champ (pour messages d'erreur)
 * @param {Object} range - Plage de validation (min, max, decimals)
 * @returns {Object|null} - { error: string } ou null si valide
 */
export const validateNumericRange = (value, fieldName, range) => {
  if (!value && value !== 0) return null; // Champ optionnel vide = OK
  
  const numValue = parseFloat(value);
  
  // Vérifier que c'est un nombre valide
  if (isNaN(numValue) || !isFinite(numValue)) {
    return { error: `${fieldName} doit être un nombre valide` };
  }
  
  // Vérifier plage
  if (numValue < range.min || numValue > range.max) {
    return { 
      error: `${fieldName} invalide (${range.min}-${range.max} ${range.unit})` 
    };
  }
  
  // ✅ Vérifier décimales (validation assouplie)
  // Avec decimals: 2 → accepte 0, 1 ou 2 décimales (7, 7.4, 7.47 OK, 7.479 pas OK)
  if (range.decimals !== undefined && range.decimals >= 0) {
    const valueStr = String(value);
    const decimalPlaces = (valueStr.split('.')[1] || '').length;
    
    // ✅ Erreur seulement si décimales > max autorisé
    // Exemple: decimals: 2 → accepte jusqu'à 2 décimales inclus
    if (decimalPlaces > range.decimals) {
      return { 
        error: `Maximum ${range.decimals} décimale${range.decimals > 1 ? 's' : ''} pour ${fieldName}` 
      };
    }
  }
  
  return null; // Valide
};

/**
 * Valide la cohérence BMI (poids + taille)
 * @param {number} weight - Poids en kg
 * @param {number} height - Taille en cm
 * @returns {Object|null} - { errors: { weight?: string, height?: string } } ou null si valide
 */
export const validateBMIConsistency = (weight, height) => {
  if (!weight || !height || isNaN(weight) || isNaN(height)) {
    return null; // Pas assez de données pour valider
  }
  
  const heightInM = height / 100;
  const bmi = weight / (heightInM * heightInM);
  
  // BMI réaliste : 10-60 (extrêmes mais possibles)
  if (bmi < 10 || bmi > 60) {
    return {
      errors: {
        weight: 'Poids et taille incohérents (IMC irréaliste)',
        height: 'Poids et taille incohérents (IMC irréaliste)'
      }
    };
  }
  
  return null; // Valide
};

/**
 * Valide la cohérence des pourcentages d'impédancemétrie
 * @param {Object} formData - Données du formulaire
 * @returns {Object|null} - { errors: { ... } } ou null si valide
 */
export const validateImpedanceConsistency = (formData) => {
  const errors = {};
  
  // ✅ Vérifier que bodyFatPercentage + bodyWater + proteinPercentage ≈ 100%
  // (Note: minerals supprimé de la liste demandée - validation optionnelle)
  // ✅ DÉSACTIVÉ: Cette validation est trop stricte, les impédancemètres ont des variations normales
  // Les pourcentages ne totalisent pas toujours exactement 100% (minerals, autres composants)
  /*
  if (formData.bodyFatPercentage && formData.bodyWater && formData.proteinPercentage) {
    const total = parseFloat(formData.bodyFatPercentage) +
                  parseFloat(formData.bodyWater) +
                  parseFloat(formData.proteinPercentage);
    
    // Tolérance de 10% (mesures peuvent avoir légères incohérences sans minerals)
    if (Math.abs(total - 100) > 10) {
      errors.bodyFatPercentage = 'Les pourcentages ne sont pas cohérents (total ≈ 100%)';
      errors.bodyWater = 'Les pourcentages ne sont pas cohérents (total ≈ 100%)';
      errors.proteinPercentage = 'Les pourcentages ne sont pas cohérents (total ≈ 100%)';
    }
  }
  */
  
  // ✅ Vérifier cohérence bodyFatMass + fatFreeWeight ≈ weight (si disponible)
  // ✅ Validation optionnelle avec tolérance large (les impédancemètres peuvent avoir des écarts)
  if (formData.weight && formData.bodyFatMass && formData.fatFreeWeight) {
    const totalMass = parseFloat(formData.bodyFatMass) + parseFloat(formData.fatFreeWeight);
    const weight = parseFloat(formData.weight);
    const difference = Math.abs(totalMass - weight);
    
    // ✅ Tolérance de 5kg (écarts normaux selon appareils et conditions)
    // Ne signaler que si écart vraiment anormal (> 5kg)
    if (difference > 5) {
      // ✅ Avertissement seulement, pas d'erreur bloquante (écart peut être normal)
      // Ne pas bloquer la soumission, juste informer
      log.warn('Écart masse détecté', { weight, totalMass, difference });
    }
    // Pas d'erreur bloquante - les écarts sont normaux
  }
  
  return Object.keys(errors).length > 0 ? { errors } : null;
};

/**
 * Valide une date (pas dans le futur, format valide)
 * @param {string} dateString - Date au format ISO (YYYY-MM-DD)
 * @returns {Object|null} - { error: string } ou null si valide
 */
export const validateDate = (dateString) => {
  if (!dateString) {
    return { error: 'La date est obligatoire' };
  }
  
  const selectedDate = new Date(dateString);
  const today = new Date();
  today.setHours(23, 59, 59, 999); // Fin de la journée
  
  // Vérifier format valide
  if (isNaN(selectedDate.getTime())) {
    return { error: 'Format de date invalide' };
  }
  
  // Vérifier pas dans le futur
  if (selectedDate > today) {
    return { error: 'La date ne peut pas être dans le futur' };
  }
  
  return null; // Valide
};

/**
 * Vérifie si une entrée existe déjà pour cette date et type
 * @param {string} dateString - Date au format ISO
 * @param {string} type - Type d'entrée ('metrics' ou 'impedance')
 * @param {Array} existingEntries - Tableau des entrées existantes
 * @param {string} excludeId - ID à exclure (pour mise à jour)
 * @returns {Object|null} - { error: string } ou null si valide
 */
export const validateDuplicateEntry = (dateString, type, existingEntries, excludeId = null) => {
  if (!existingEntries || existingEntries.length === 0) {
    return null; // Pas d'entrées = pas de doublon
  }
  
  const entryDate = new Date(dateString).toISOString().split('T')[0];
  
  const duplicate = existingEntries.find(entry => {
    // Exclure l'entrée en cours de modification
    if (excludeId && entry.id === excludeId) {
      return false;
    }
    
    const existingDate = entry.date 
      ? new Date(entry.date).toISOString().split('T')[0]
      : (entry.timestamp ? new Date(entry.timestamp).toISOString().split('T')[0] : null);
    
    return existingDate === entryDate && entry.type === type;
  });
  
  if (duplicate) {
    return { 
      error: `Une mesure de type "${type}" existe déjà pour cette date. Modifiez-la ou choisissez une autre date.` 
    };
  }
  
  return null; // Pas de doublon
};

/**
 * Valide une photo avant upload
 * @param {File} file - Fichier photo
 * @param {Object} options - Options de validation
 * @returns {Object|null} - { error: string } ou null si valide
 */
export const validatePhoto = (file, options = {}) => {
  const {
    maxSizeMB = 10,
    allowedFormats = ['image/jpeg', 'image/jpg', 'image/png'],
    maxPhotosPerDay = 5,
    existingPhotos = []
  } = options;
  
  // Vérifier format
  if (!allowedFormats.includes(file.type)) {
    return { 
      error: `Format non supporté. Formats autorisés: ${allowedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')}` 
    };
  }
  
  // Vérifier taille
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return { 
      error: `Fichier trop volumineux (max ${maxSizeMB}MB). Taille actuelle: ${(file.size / 1024 / 1024).toFixed(2)}MB` 
    };
  }
  
  // Vérifier limite par jour
  if (existingPhotos && existingPhotos.length > 0) {
    const today = new Date().toISOString().split('T')[0];
    const todayPhotos = existingPhotos.filter(photo => {
      const photoDate = photo.date 
        ? new Date(photo.date).toISOString().split('T')[0]
        : (photo.timestamp ? new Date(photo.timestamp).toISOString().split('T')[0] : null);
      return photoDate === today;
    });
    
    if (todayPhotos.length >= maxPhotosPerDay) {
      return { 
        error: `Limite de ${maxPhotosPerDay} photos par jour atteinte` 
      };
    }
  }
  
  return null; // Valide
};

/**
 * Valide un formulaire de métriques complètes
 * @param {Object} formData - Données du formulaire
 * @param {Array} existingEntries - Entrées existantes pour vérification doublons
 * @param {Object} options - Options de validation
 * @returns {Object} - { isValid: boolean, errors: { ... } }
 */
export const validateMetricsForm = (formData, existingEntries = [], options = {}) => {
  const errors = {};
  const { skipDuplicateCheck = false, skipBMICheck = false } = options;
  
  // 1. Validation poids (obligatoire)
  const weightValidation = validateNumericRange(
    formData.weight, 
    'Poids', 
    VALIDATION_RANGES.weight
  );
  if (weightValidation) {
    errors.weight = weightValidation.error;
  }
  
  // 2. Validation taille (optionnel)
  if (formData.height) {
    const heightValidation = validateNumericRange(
      formData.height,
      'Taille',
      VALIDATION_RANGES.height
    );
    if (heightValidation) {
      errors.height = heightValidation.error;
    }
  }
  
  // 3. Validation cohérence BMI (si poids et taille présents)
  if (!skipBMICheck && formData.weight && formData.height) {
    const bmiValidation = validateBMIConsistency(
      parseFloat(formData.weight),
      parseFloat(formData.height)
    );
    if (bmiValidation) {
      Object.assign(errors, bmiValidation.errors);
    }
  }
  
  // 4. Validation date
  const dateValidation = validateDate(formData.date);
  if (dateValidation) {
    errors.date = dateValidation.error;
  }
  
  // 5. Vérification doublon
  if (!skipDuplicateCheck && formData.date) {
    const duplicateValidation = validateDuplicateEntry(
      formData.date,
      'metrics',
      existingEntries
    );
    if (duplicateValidation) {
      errors.date = duplicateValidation.error;
    }
  }
  
  // 6. Validation mensurations
  const measurements = ['waist', 'chest', 'arms', 'thighs', 'neck', 'hips'];
  measurements.forEach(field => {
    if (formData[field]) {
      const validation = validateNumericRange(
        formData[field],
        field.charAt(0).toUpperCase() + field.slice(1),
        VALIDATION_RANGES[field]
      );
      if (validation) {
        errors[field] = validation.error;
      }
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Valide un formulaire d'impédancemétrie complet
 * @param {Object} formData - Données du formulaire
 * @param {Array} existingEntries - Entrées existantes pour vérification doublons
 * @param {Object} options - Options de validation
 * @returns {Object} - { isValid: boolean, errors: { ... } }
 */
export const validateImpedanceForm = (formData, existingEntries = [], options = {}) => {
  const errors = {};
  const { skipDuplicateCheck = false, skipConsistencyCheck = false } = options;
  
  // ✅ 1. Validation de tous les champs numériques (champs exacts demandés)
  const numericFields = [
    'weight', 'bmi', 'bodyFatPercentage', 'muscleMass', 'bodyFatMass',
    'bodyFatIndex', 'obesityLevel', 'visceralFatIndex', 'fatFreeWeight',
    'bodyWater', 'boneMass', 'proteinPercentage', 'basalMetabolism', 'metabolicAge'
  ];
  
  numericFields.forEach(field => {
    // ✅ Ignorer champs vides/null/undefined (tous les champs sont optionnels)
    const fieldValue = formData[field];
    if (fieldValue === '' || fieldValue === null || fieldValue === undefined) {
      return; // Champ vide = OK (pas de validation)
    }
    
    // ✅ Valider seulement si valeur présente
    const range = VALIDATION_RANGES[field];
    if (range) {
      const validation = validateNumericRange(
        fieldValue,
        field,
        range
      );
      if (validation) {
        errors[field] = validation.error;
      }
    } else {
      // ✅ Validation basique si pas de range définie
      const numValue = parseFloat(fieldValue);
      if (isNaN(numValue)) {
        errors[field] = 'Doit être un nombre valide';
      } else if (numValue <= 0) {
        errors[field] = 'Doit être un nombre positif';
      }
    }
  });
  
  // 2. Validation cohérence des pourcentages
  if (!skipConsistencyCheck) {
    const consistencyValidation = validateImpedanceConsistency(formData);
    if (consistencyValidation) {
      Object.assign(errors, consistencyValidation.errors);
    }
  }
  
  // ✅ 3. Validation date (seulement si date fournie)
  // Note: Date n'est pas strictement obligatoire (peut être remplie après)
  if (formData.date && formData.date !== '') {
    const dateValidation = validateDate(formData.date);
    if (dateValidation) {
      errors.date = dateValidation.error;
    }
  }
  // Si date vide, pas d'erreur (l'utilisateur peut la remplir après)
  
  // 4. Vérification doublon
  if (!skipDuplicateCheck && formData.date) {
    const duplicateValidation = validateDuplicateEntry(
      formData.date,
      'impedance',
      existingEntries
    );
    if (duplicateValidation) {
      errors.date = duplicateValidation.error;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * ✅ PHASE 2.5 : Valide la structure multi-résolution après compression
 * 
 * Vérifie que toutes les résolutions sont présentes et valides :
 * - thumbnail, preview, full doivent exister
 * - Chaque résolution doit avoir data (Base64 valide)
 * - Dimensions valides (width > 0, height > 0)
 * - Tailles valides (size > 0)
 * 
 * @param {Object} compressionResult - Résultat de compressImageMultiResolution
 * @param {Object} options - Options de validation
 * @param {boolean} options.strict - Mode strict (toutes résolutions requises) ou souple (au moins une)
 * @param {Array<string>} options.requiredResolutions - Résolutions requises (défaut: ['thumbnail', 'preview', 'full'])
 * @returns {Object} - { isValid: boolean, errors: Array<string>, warnings: Array<string> }
 */
export const validateMultiResolutionStructure = (compressionResult, options = {}) => {
  const {
    strict = true,
    requiredResolutions = ['thumbnail', 'preview', 'full']
  } = options;

  const errors = [];
  const warnings = [];

  if (!compressionResult || typeof compressionResult !== 'object') {
    return {
      isValid: false,
      errors: ['Résultat de compression invalide (objet attendu)'],
      warnings: []
    };
  }

  // ✅ Vérifier présence des résolutions requises
  const missingResolutions = requiredResolutions.filter(
    res => !compressionResult[res] || typeof compressionResult[res] !== 'object'
  );

  if (missingResolutions.length > 0) {
    if (strict) {
      errors.push(`Résolutions manquantes: ${missingResolutions.join(', ')}`);
    } else {
      warnings.push(`Résolutions manquantes (mode souple): ${missingResolutions.join(', ')}`);
    }
  }

  // ✅ Valider chaque résolution présente
  requiredResolutions.forEach(resName => {
    const resolution = compressionResult[resName];
    
    if (!resolution) {
      if (strict) {
        errors.push(`Résolution "${resName}" manquante`);
      }
      return; // Passer à la suivante
    }

    // Vérifier structure de base
    if (typeof resolution !== 'object') {
      errors.push(`Résolution "${resName}" invalide (objet attendu)`);
      return;
    }

    // ✅ Vérifier data (Base64 valide)
    if (!resolution.data || typeof resolution.data !== 'string') {
      errors.push(`Résolution "${resName}" : data manquant ou invalide`);
    } else {
      // Vérifier format Base64 (commence par data:image/...)
      const base64Pattern = /^data:image\/(jpeg|jpg|png|webp);base64,/i;
      if (!base64Pattern.test(resolution.data)) {
        errors.push(`Résolution "${resName}" : format Base64 invalide (attendu: data:image/...;base64,...)`);
      } else {
        // Vérifier que le Base64 n'est pas vide après le préfixe
        const base64Data = resolution.data.split(',')[1];
        if (!base64Data || base64Data.length < 100) {
          errors.push(`Résolution "${resName}" : données Base64 trop courtes ou vides`);
        }
      }
    }

    // ✅ Vérifier dimensions
    if (resolution.width === undefined || resolution.width === null) {
      errors.push(`Résolution "${resName}" : width manquant`);
    } else if (typeof resolution.width !== 'number' || resolution.width <= 0 || !isFinite(resolution.width)) {
      errors.push(`Résolution "${resName}" : width invalide (attendu: nombre > 0)`);
    }

    if (resolution.height === undefined || resolution.height === null) {
      errors.push(`Résolution "${resName}" : height manquant`);
    } else if (typeof resolution.height !== 'number' || resolution.height <= 0 || !isFinite(resolution.height)) {
      errors.push(`Résolution "${resName}" : height invalide (attendu: nombre > 0)`);
    }

    // ✅ Vérifier taille (size)
    if (resolution.size === undefined || resolution.size === null) {
      warnings.push(`Résolution "${resName}" : size manquant (non bloquant)`);
    } else if (typeof resolution.size !== 'number' || resolution.size <= 0 || !isFinite(resolution.size)) {
      warnings.push(`Résolution "${resName}" : size invalide (non bloquant)`);
    }

    // ✅ Vérifier format (optionnel mais recommandé)
    if (resolution.format && !['jpeg', 'jpg', 'webp', 'png'].includes(resolution.format.toLowerCase())) {
      warnings.push(`Résolution "${resName}" : format inattendu "${resolution.format}" (non bloquant)`);
    }

    // ✅ Vérifier quality (optionnel mais recommandé)
    if (resolution.quality !== undefined) {
      if (typeof resolution.quality !== 'number' || resolution.quality < 0 || resolution.quality > 1) {
        warnings.push(`Résolution "${resName}" : quality invalide (attendu: 0-1, non bloquant)`);
      }
    }
  });

  // ✅ Vérifier métadonnées globales (optionnel)
  if (compressionResult.originalSize !== undefined) {
    if (typeof compressionResult.originalSize !== 'number' || compressionResult.originalSize <= 0) {
      warnings.push('originalSize invalide (non bloquant)');
    }
  }

  if (compressionResult.totalSize !== undefined) {
    if (typeof compressionResult.totalSize !== 'number' || compressionResult.totalSize <= 0) {
      warnings.push('totalSize invalide (non bloquant)');
    }
  }

  // ✅ En mode strict, au moins une résolution doit être valide
  const validResolutions = requiredResolutions.filter(resName => {
    const res = compressionResult[resName];
    return res && 
           res.data && 
           typeof res.data === 'string' && 
           /^data:image\/.+;base64,/.test(res.data) &&
           res.width > 0 && 
           res.height > 0;
  });

  if (strict && validResolutions.length === 0) {
    errors.push('Aucune résolution valide trouvée');
  } else if (!strict && validResolutions.length === 0) {
    errors.push('Au moins une résolution valide est requise');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    validResolutions: validResolutions.length,
    totalResolutions: requiredResolutions.length
  };
};

/**
 * ✅ PHASE 4.4 : Valide la qualité d'une photo de manière enrichie
 * 
 * Analyse :
 * - Résolution minimale/maximale
 * - Ratio d'aspect (portrait/paysage)
 * - Détection de flou basique (variance Laplacienne)
 * - Métriques de qualité
 * 
 * @param {File|string} input - Fichier photo ou Data URL Base64
 * @param {Object} options - Options de validation
 * @param {number} options.minWidth - Largeur minimale (défaut: 200)
 * @param {number} options.minHeight - Hauteur minimale (défaut: 200)
 * @param {number} options.maxWidth - Largeur maximale (défaut: 10000)
 * @param {number} options.maxHeight - Hauteur maximale (défaut: 10000)
 * @param {number} options.minAspectRatio - Ratio d'aspect minimal (défaut: 0.3)
 * @param {number} options.maxAspectRatio - Ratio d'aspect maximal (défaut: 3.0)
 * @param {number} options.minSharpness - Netteté minimale (variance Laplacienne, défaut: 100)
 * @param {boolean} options.checkBlur - Activer détection flou (défaut: true)
 * @returns {Promise<Object>} - { isValid: boolean, score: number, metrics: {...}, warnings: Array<string>, errors: Array<string> }
 */
export const validatePhotoQuality = async (input, options = {}) => {
  const {
    minWidth = 200,
    minHeight = 200,
    maxWidth = 10000,
    maxHeight = 10000,
    minAspectRatio = 0.3,
    maxAspectRatio = 3.0,
    minSharpness = 100,
    checkBlur = true
  } = options;

  const errors = [];
  const warnings = [];
  let score = 100; // Score de qualité (0-100)
  const metrics = {
    width: 0,
    height: 0,
    aspectRatio: 0,
    sharpness: 0,
    fileSize: 0,
    format: null
  };

  try {
    // ✅ Étape 1: Charger l'image
    let imageData;
    let fileSize = 0;

    if (input instanceof File) {
      fileSize = input.size;
      imageData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(input);
      });
    } else if (typeof input === 'string') {
      imageData = input;
      // Estimer taille depuis Base64
      const base64Data = input.split(',')[1] || '';
      fileSize = Math.ceil((base64Data.length * 3) / 4);
    } else {
      return {
        isValid: false,
        score: 0,
        metrics,
        errors: ['Format d\'entrée invalide (File ou Data URL attendu)'],
        warnings: []
      };
    }

    // Détecter format
    if (imageData.startsWith('data:image/')) {
      const formatMatch = imageData.match(/data:image\/(\w+);/);
      metrics.format = formatMatch ? formatMatch[1].toLowerCase() : 'unknown';
    } else {
      metrics.format = 'unknown';
    }

    // ✅ Étape 2: Créer Image et obtenir dimensions
    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = imageData;
    });

    metrics.width = img.width;
    metrics.height = img.height;
    metrics.fileSize = fileSize;
    metrics.aspectRatio = metrics.width / metrics.height;

    // ✅ Étape 3: Validation résolution
    if (metrics.width < minWidth) {
      errors.push(`Résolution trop faible: largeur ${metrics.width}px (minimum: ${minWidth}px)`);
      score -= 30;
    }
    if (metrics.height < minHeight) {
      errors.push(`Résolution trop faible: hauteur ${metrics.height}px (minimum: ${minHeight}px)`);
      score -= 30;
    }
    if (metrics.width > maxWidth) {
      warnings.push(`Résolution très élevée: largeur ${metrics.width}px (recommandé: max ${maxWidth}px)`);
      score -= 5;
    }
    if (metrics.height > maxHeight) {
      warnings.push(`Résolution très élevée: hauteur ${metrics.height}px (recommandé: max ${maxHeight}px)`);
      score -= 5;
    }

    // ✅ Étape 4: Validation ratio d'aspect
    if (metrics.aspectRatio < minAspectRatio || metrics.aspectRatio > maxAspectRatio) {
      warnings.push(`Ratio d'aspect inhabituel: ${metrics.aspectRatio.toFixed(2)} (recommandé: ${minAspectRatio}-${maxAspectRatio})`);
      score -= 10;
    }

    // ✅ Étape 5: Détection flou/netteté (variance Laplacienne)
    if (checkBlur && metrics.width >= 100 && metrics.height >= 100) {
      try {
        const sharpness = await calculateImageSharpness(img);
        metrics.sharpness = sharpness;

        if (sharpness < minSharpness) {
          warnings.push(`Photo potentiellement floue (netteté: ${sharpness.toFixed(0)}, minimum: ${minSharpness})`);
          score -= 20;
        } else if (sharpness < minSharpness * 1.5) {
          warnings.push(`Photo légèrement floue (netteté: ${sharpness.toFixed(0)})`);
          score -= 10;
        }
      } catch (sharpnessError) {
        log.warn('Impossible de calculer la netteté', sharpnessError);
        // Ne pas bloquer si calcul échoue
      }
    }

    // ✅ Étape 6: Validation taille fichier
    const fileSizeMB = fileSize / (1024 * 1024);
    if (fileSizeMB > 10) {
      warnings.push(`Fichier volumineux: ${fileSizeMB.toFixed(2)}MB (sera compressé)`);
      score -= 5;
    } else if (fileSizeMB < 0.01) {
      warnings.push(`Fichier très petit: ${fileSizeMB.toFixed(2)}MB (qualité peut être faible)`);
      score -= 15;
    }

    // ✅ Étape 7: Calcul score final
    score = Math.max(0, Math.min(100, score));

    // ✅ Étape 8: Recommandations basées sur métriques
    const recommendations = [];
    
    if (metrics.width < 400 || metrics.height < 400) {
      recommendations.push('Résolution faible - utilisez une photo de meilleure qualité pour l\'analyse IA');
    }
    
    if (metrics.sharpness > 0 && metrics.sharpness < minSharpness) {
      recommendations.push('Photo floue - assurez-vous que la photo est nette et bien focalisée');
    }
    
    if (metrics.aspectRatio < 0.5 || metrics.aspectRatio > 2.0) {
      recommendations.push('Ratio d\'aspect inhabituel - utilisez une photo en portrait ou paysage standard');
    }

    return {
      isValid: errors.length === 0,
      score: Math.round(score),
      metrics,
      errors,
      warnings,
      recommendations
    };

  } catch (error) {
    log.error('Erreur validation qualité photo', error);
    return {
      isValid: false,
      score: 0,
      metrics,
      errors: [`Erreur lors de la validation: ${error.message}`],
      warnings: []
    };
  }
};

/**
 * ✅ PHASE 4.4 : Calcule la netteté d'une image (variance Laplacienne)
 * 
 * Algorithme :
 * 1. Convertir en niveaux de gris
 * 2. Appliquer filtre Laplacien
 * 3. Calculer variance (plus élevée = plus nette)
 * 
 * @param {HTMLImageElement} img - Image à analyser
 * @returns {Promise<number>} - Score de netteté (0-1000+)
 */
const calculateImageSharpness = async (img) => {
  return new Promise((resolve, reject) => {
    try {
      // ✅ Créer canvas pour analyse (taille réduite pour performance)
      const maxAnalysisSize = 400; // Analyser sur 400px max pour performance
      const scale = Math.min(maxAnalysisSize / img.width, maxAnalysisSize / img.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(img.width * scale);
      canvas.height = Math.floor(img.height * scale);
      
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        reject(new Error('Impossible de créer contexte canvas'));
        return;
      }

      // Dessiner image redimensionnée
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // ✅ Obtenir données image (niveaux de gris)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const width = canvas.width;
      const height = canvas.height;

      // ✅ Convertir en niveaux de gris et calculer variance Laplacienne
      const grayscale = new Uint8Array(width * height);
      
      // Conversion RGB → Grayscale (formule standard)
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        grayscale[i / 4] = gray;
      }

      // ✅ Appliquer filtre Laplacien (détection contours)
      const laplacian = new Float32Array(width * height);
      let sum = 0;
      let sumSquared = 0;
      let count = 0;

      // Kernel Laplacien 3x3:
      // [ 0 -1  0]
      // [-1  4 -1]
      // [ 0 -1  0]
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = y * width + x;
          const center = grayscale[idx];
          const top = grayscale[(y - 1) * width + x];
          const bottom = grayscale[(y + 1) * width + x];
          const left = grayscale[y * width + (x - 1)];
          const right = grayscale[y * width + (x + 1)];

          // Filtre Laplacien
          const laplacianValue = Math.abs(4 * center - top - bottom - left - right);
          laplacian[idx] = laplacianValue;
          
          sum += laplacianValue;
          sumSquared += laplacianValue * laplacianValue;
          count++;
        }
      }

      // ✅ Calculer variance (mesure de netteté)
      const mean = sum / count;
      const variance = (sumSquared / count) - (mean * mean);
      
      // Normaliser et retourner score (0-1000+)
      const sharpness = Math.max(0, variance);
      
      resolve(sharpness);

    } catch (error) {
      reject(error);
    }
  });
};

