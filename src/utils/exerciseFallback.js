// Système de fallback pour la catégorisation d'exercices non trouvés dans la base de données

/**
 * Dictionnaire de mots-clés pour la catégorisation automatique
 */
const categoryKeywords = {
  // Pectoraux
  'Pectoraux': [
    'pompe', 'push', 'pectoraux', 'chest', 'développé couché', 'bench press',
    'écarté', 'fly', 'dips pectoraux', 'pec deck'
  ],
  
  // Dorsaux
  'Dorsaux': [
    'traction', 'pull', 'dos', 'back', 'rowing', 'tirage', 'lat pulldown',
    'soulevé de terre', 'deadlift', 'shrug', 'trapèze'
  ],
  
  // Épaules
  'Épaules': [
    'épaule', 'shoulder', 'deltoid', 'développé militaire', 'military press',
    'élévation', 'raise', 'oiseau', 'reverse fly', 'overhead'
  ],
  
  // Biceps
  'Biceps': [
    'biceps', 'curl barre', 'curl haltère', 'curl marteau', 'hammer curl',
    'curl pupitre', 'preacher curl', 'bicep curl'
  ],
  
  // Triceps
  'Triceps': [
    'triceps', 'extension', 'dips triceps', 'skull crusher', 'barre au front',
    'développé prise serrée', 'close grip'
  ],
  
  // Quadriceps
  'Quadriceps': [
    'squat', 'presse', 'leg press', 'fente', 'lunge', 'extension quadriceps',
    'leg extension', 'hack squat', 'front squat'
  ],
  
  // Ischio-jambiers
  'Ischio-jambiers': [
    'curl jambe', 'leg curl', 'ischio', 'hamstring', 'soulevé de terre roumain',
    'romanian deadlift', 'rdl', 'good morning'
  ],
  
  // Fessiers
  'Fessiers': [
    'fessier', 'glute', 'hip thrust', 'pont', 'bridge', 'kick back',
    'abduction', 'clamshell'
  ],
  
  // Mollets
  'Mollets': [
    'mollet', 'calf', 'élévation mollet', 'calf raise', 'gastrocnémien',
    'soléaire', 'pointe de pied'
  ],
  
  // Abdominaux
  'Abdominaux': [
    'abdos', 'abs', 'crunch', 'planche', 'plank', 'gainage', 'relevé jambe',
    'leg raise', 'russian twist', 'mountain climber'
  ]
};

const equipmentKeywords = {
  'Haltères': [
    'haltère', 'dumbbell', 'poids libre', 'db'
  ],
  'Barre': [
    'barre', 'barbell', 'olympique', 'ez bar', 'bb'
  ],
  'Machine': [
    'machine', 'appareil', 'guidé', 'smith machine', 'câble', 'poulie'
  ],
  'Poids du corps': [
    'poids du corps', 'bodyweight', 'au sol', 'sans matériel', 'naturel'
  ],
  'Kettlebell': [
    'kettlebell', 'girya', 'kb'
  ],
  'Élastiques': [
    'élastique', 'band', 'résistance', 'tube'
  ],
  'TRX': [
    'trx', 'suspension', 'sangles'
  ]
};

const muscleGroupMapping = {
  'Pectoraux': ['Pectoraux', 'Grand pectoral', 'Petit pectoral'],
  'Dorsaux': ['Grand dorsal', 'Rhomboïdes', 'Trapèzes', 'Érecteurs du rachis'],
  'Épaules': ['Deltoïdes', 'Deltoïdes antérieurs', 'Deltoïdes moyens', 'Deltoïdes postérieurs'],
  'Biceps': ['Biceps brachial', 'Brachial antérieur', 'Brachio-radial'],
  'Triceps': ['Triceps brachial', 'Chef long', 'Chef latéral', 'Chef médial'],
  'Quadriceps': ['Quadriceps', 'Vaste externe', 'Vaste interne', 'Droit fémoral'],
  'Ischio-jambiers': ['Ischio-jambiers', 'Biceps fémoral', 'Semi-tendineux', 'Semi-membraneux'],
  'Fessiers': ['Grand fessier', 'Moyen fessier', 'Petit fessier'],
  'Mollets': ['Gastrocnémiens', 'Soléaires'],
  'Abdominaux': ['Grand droit de l\'abdomen', 'Obliques', 'Transverse']
};

/**
 * Analyse un nom d'exercice et retourne une catégorisation basée sur les mots-clés
 * @param {string} exerciseName - Nom de l'exercice à analyser
 * @returns {Object} Informations de catégorisation
 */
export function analyzeExerciseName(exerciseName) {
  if (!exerciseName || typeof exerciseName !== 'string') {
    return null;
  }

  const name = exerciseName.toLowerCase().trim();
  const result = {
    category: 'Autre',
    equipment: 'Non spécifié',
    primaryMuscles: [],
    secondaryMuscles: [],
    confidence: 0,
    matchedKeywords: []
  };

  // Recherche de catégorie
  let bestCategoryMatch = { category: 'Autre', score: 0, keywords: [] };
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    let score = 0;
    const matchedKeywords = [];
    
    for (const keyword of keywords) {
      if (name.includes(keyword.toLowerCase())) {
        score += keyword.length; // Plus le mot-clé est long, plus il est spécifique
        matchedKeywords.push(keyword);
      }
    }
    
    if (score > bestCategoryMatch.score) {
      bestCategoryMatch = { category, score, keywords: matchedKeywords };
    }
  }
  
  if (bestCategoryMatch.score > 0) {
    result.category = bestCategoryMatch.category;
    result.matchedKeywords = bestCategoryMatch.keywords;
    result.confidence = Math.min(bestCategoryMatch.score / 10, 1); // Normaliser entre 0 et 1
    
    // Assigner les muscles primaires
    if (muscleGroupMapping[bestCategoryMatch.category]) {
      result.primaryMuscles = muscleGroupMapping[bestCategoryMatch.category];
    }
  }

  // Recherche d'équipement
  let bestEquipmentMatch = { equipment: 'Non spécifié', score: 0 };
  
  for (const [equipment, keywords] of Object.entries(equipmentKeywords)) {
    let score = 0;
    
    for (const keyword of keywords) {
      if (name.includes(keyword.toLowerCase())) {
        score += keyword.length;
      }
    }
    
    if (score > bestEquipmentMatch.score) {
      bestEquipmentMatch = { equipment, score };
    }
  }
  
  if (bestEquipmentMatch.score > 0) {
    result.equipment = bestEquipmentMatch.equipment;
  }

  return result;
}

/**
 * Génère une description automatique basée sur la catégorisation
 * @param {Object} categorization - Résultat de analyzeExerciseName
 * @param {string} exerciseName - Nom original de l'exercice
 * @returns {string} Description générée
 */
export function generateExerciseDescription(categorization, exerciseName) {
  if (!categorization || categorization.category === 'Autre') {
    return `Exercice de musculation : ${exerciseName}`;
  }

  const { category, equipment, primaryMuscles } = categorization;
  
  let description = `Exercice ciblant principalement ${category.toLowerCase()}`;
  
  if (primaryMuscles.length > 0) {
    description += ` (${primaryMuscles.slice(0, 2).join(', ')})`;
  }
  
  if (equipment !== 'Non spécifié') {
    description += ` utilisant ${equipment.toLowerCase()}`;
  }
  
  return description;
}

/**
 * Suggère des exercices similaires basés sur la catégorie
 * @param {string} category - Catégorie de l'exercice
 * @returns {Array} Liste d'exercices similaires suggérés
 */
export function suggestSimilarExercises(category) {
  const suggestions = {
    'Pectoraux': ['Développé couché', 'Développé incliné', 'Écarté couché', 'Pompes'],
    'Dorsaux': ['Tractions', 'Rowing barre', 'Tirage vertical', 'Soulevé de terre'],
    'Épaules': ['Développé militaire', 'Élévations latérales', 'Oiseau', 'Développé haltères'],
    'Biceps': ['Curl barre', 'Curl haltères', 'Curl marteau', 'Curl pupitre'],
    'Triceps': ['Extension triceps', 'Dips', 'Développé prise serrée'],
    'Quadriceps': ['Squat', 'Presse à cuisses', 'Fentes', 'Extension quadriceps'],
    'Ischio-jambiers': ['Curl jambes', 'Soulevé de terre roumain'],
    'Mollets': ['Mollets debout', 'Mollets assis'],
    'Abdominaux': ['Crunch', 'Planche', 'Relevé de jambes']
  };

  return suggestions[category] || [];
}

/**
 * Fonction principale de fallback pour un exercice non trouvé
 * @param {string} exerciseName - Nom de l'exercice
 * @returns {Object} Objet exercice avec catégorisation de fallback
 */
export function createFallbackExercise(exerciseName) {
  const analysis = analyzeExerciseName(exerciseName);
  
  if (!analysis) {
    return {
      name: exerciseName,
      category: 'Autre',
      primaryMuscles: [],
      secondaryMuscles: [],
      equipment: 'Non spécifié',
      description: `Exercice de musculation : ${exerciseName}`,
      isFallback: true,
      confidence: 0
    };
  }

  return {
    name: exerciseName,
    category: analysis.category,
    primaryMuscles: analysis.primaryMuscles,
    secondaryMuscles: analysis.secondaryMuscles,
    equipment: analysis.equipment,
    description: generateExerciseDescription(analysis, exerciseName),
    suggestions: suggestSimilarExercises(analysis.category),
    isFallback: true,
    confidence: analysis.confidence,
    matchedKeywords: analysis.matchedKeywords
  };
}