/**
 * 📋 MODULE DE VALIDATION COMPLET - SUIVI CORPOREL
 * 
 * Validation centralisée, réutilisable et robuste pour toutes les métriques corporelles.
 * Utilise des plages réalistes, des validations croisées, et des messages d'erreur clairs.
 */

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
  
  // Impédancemétrie
  bodyFatMass: { min: 2, max: 150, step: 0.1, decimals: 1, unit: 'kg' },
  bodyFatPercentage: { min: 3, max: 50, step: 0.1, decimals: 1, unit: '%' },
  fatFreeWeight: { min: 20, max: 200, step: 0.1, decimals: 1, unit: 'kg' },
  skeletalMuscle: { min: 10, max: 120, step: 0.1, decimals: 1, unit: 'kg' },
  bodyWater: { min: 30, max: 80, step: 0.1, decimals: 1, unit: '%' },
  protein: { min: 5, max: 25, step: 0.1, decimals: 1, unit: '%' },
  minerals: { min: 3, max: 8, step: 0.1, decimals: 1, unit: '%' },
  visceralFat: { min: 1, max: 30, step: 1, decimals: 0, unit: '' },
  subcutaneousFat: { min: 5, max: 50, step: 0.1, decimals: 1, unit: '%' },
  metabolicAge: { min: 10, max: 100, step: 1, decimals: 0, unit: 'ans' },
  basalMetabolism: { min: 800, max: 4000, step: 1, decimals: 0, unit: 'kcal' },
  muscleQuality: { min: 1, max: 10, step: 0.1, decimals: 1, unit: '' },
  boneMass: { min: 1, max: 15, step: 0.1, decimals: 1, unit: 'kg' }
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
  
  // Vérifier décimales
  if (range.decimals !== undefined) {
    const decimalPlaces = (numValue.toString().split('.')[1] || '').length;
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
  
  // Vérifier que bodyFatPercentage + bodyWater + protein + minerals ≈ 100%
  if (formData.bodyFatPercentage && formData.bodyWater && formData.protein && formData.minerals) {
    const total = parseFloat(formData.bodyFatPercentage) +
                  parseFloat(formData.bodyWater) +
                  parseFloat(formData.protein) +
                  parseFloat(formData.minerals);
    
    // Tolérance de 5% (mesures peuvent avoir légères incohérences)
    if (Math.abs(total - 100) > 5) {
      errors.bodyFatPercentage = 'Les pourcentages ne sont pas cohérents (total ≈ 100%)';
      errors.bodyWater = 'Les pourcentages ne sont pas cohérents (total ≈ 100%)';
      errors.protein = 'Les pourcentages ne sont pas cohérents (total ≈ 100%)';
      errors.minerals = 'Les pourcentages ne sont pas cohérents (total ≈ 100%)';
    }
  }
  
  // Vérifier cohérence bodyFatMass + fatFreeWeight ≈ weight total (si disponible)
  if (formData.bodyFatMass && formData.fatFreeWeight) {
    const totalMass = parseFloat(formData.bodyFatMass) + parseFloat(formData.fatFreeWeight);
    // Vérifier si weight est disponible
    // Note: Cette validation nécessiterait l'accès au poids actuel, peut être ajoutée plus tard
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
  
  // 1. Validation de tous les champs numériques
  const numericFields = [
    'bodyFatMass', 'bodyFatPercentage', 'fatFreeWeight', 'skeletalMuscle',
    'bodyWater', 'protein', 'minerals', 'visceralFat', 'subcutaneousFat',
    'metabolicAge', 'basalMetabolism', 'muscleQuality', 'boneMass'
  ];
  
  numericFields.forEach(field => {
    if (formData[field]) {
      const range = VALIDATION_RANGES[field];
      if (range) {
        const validation = validateNumericRange(
          formData[field],
          field,
          range
        );
        if (validation) {
          errors[field] = validation.error;
        }
      } else {
        // Validation basique si pas de range définie
        const numValue = parseFloat(formData[field]);
        if (isNaN(numValue) || numValue <= 0) {
          errors[field] = 'Doit être un nombre positif';
        }
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
  
  // 3. Validation date
  const dateValidation = validateDate(formData.date);
  if (dateValidation) {
    errors.date = dateValidation.error;
  }
  
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

