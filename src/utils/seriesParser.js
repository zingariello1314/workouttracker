// Parseur avancé pour extraire les informations de séries d'exercices

/**
 * Parse une chaîne de séries et extrait toutes les informations numériques
 * @param {string} seriesString - Chaîne décrivant les séries (ex: "4×10", "3-8-12", "4×10-12")
 * @returns {Object} Objet contenant les informations parsées
 */
export function parseSeriesString(seriesString) {
  if (!seriesString || typeof seriesString !== 'string') {
    return {
      sets: null,
      reps: [],
      weight: null,
      duration: null,
      distance: null,
      originalString: seriesString || '',
      format: 'unknown'
    };
  }

  const original = seriesString.trim();
  const result = {
    sets: null,
    reps: [],
    weight: null,
    duration: null,
    distance: null,
    originalString: original,
    format: 'unknown'
  };

  // Nettoyer la chaîne (enlever espaces supplémentaires, normaliser)
  let cleaned = original.toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/x/gi, '×')  // Normaliser les x en ×
    .replace(/rep[s]?/gi, '')
    .replace(/set[s]?/gi, '')
    .trim();

  // Patterns de reconnaissance
  const patterns = [
    // Format: 4×10, 3×8-12, 4×10-12-15
    {
      regex: /^(\d+)×([\d\-]+)$/,
      format: 'sets_x_reps',
      parser: (match) => {
        result.sets = parseInt(match[1]);
        result.reps = match[2].split('-').map(r => parseInt(r)).filter(r => !isNaN(r));
        return result;
      }
    },
    
    // Format: 4-10-12-15 (séries pyramidales)
    {
      regex: /^(\d+(?:\-\d+){2,})$/,
      format: 'pyramid_reps',
      parser: (match) => {
        const numbers = match[1].split('-').map(n => parseInt(n)).filter(n => !isNaN(n));
        if (numbers.length >= 3) {
          result.sets = numbers.length;
          result.reps = numbers;
        }
        return result;
      }
    },
    
    // Format: 4×10@70kg, 3×8@80kg
    {
      regex: /^(\d+)×(\d+)@(\d+(?:\.\d+)?)kg$/,
      format: 'sets_x_reps_at_weight',
      parser: (match) => {
        result.sets = parseInt(match[1]);
        result.reps = [parseInt(match[2])];
        result.weight = parseFloat(match[3]);
        return result;
      }
    },
    
    // Format: 3×30s, 4×1min (durée)
    {
      regex: /^(\d+)×(\d+(?:\.\d+)?)(s|sec|min|minutes?)$/,
      format: 'sets_x_duration',
      parser: (match) => {
        result.sets = parseInt(match[1]);
        let duration = parseFloat(match[2]);
        const unit = match[3];
        
        // Convertir en secondes
        if (unit.startsWith('min')) {
          duration *= 60;
        }
        result.duration = duration;
        return result;
      }
    },
    
    // Format: 4×100m, 3×200m (distance)
    {
      regex: /^(\d+)×(\d+(?:\.\d+)?)(m|km|miles?)$/,
      format: 'sets_x_distance',
      parser: (match) => {
        result.sets = parseInt(match[1]);
        let distance = parseFloat(match[2]);
        const unit = match[3];
        
        // Convertir en mètres
        if (unit === 'km') {
          distance *= 1000;
        } else if (unit.startsWith('mile')) {
          distance *= 1609.34;
        }
        result.distance = distance;
        return result;
      }
    },
    
    // Format: 10-12-15 (juste les répétitions)
    {
      regex: /^(\d+(?:\-\d+)+)$/,
      format: 'reps_only',
      parser: (match) => {
        result.reps = match[1].split('-').map(r => parseInt(r)).filter(r => !isNaN(r));
        result.sets = result.reps.length;
        return result;
      }
    },
    
    // Format: 4×10 (basique)
    {
      regex: /^(\d+)×(\d+)$/,
      format: 'sets_x_reps_basic',
      parser: (match) => {
        result.sets = parseInt(match[1]);
        result.reps = [parseInt(match[2])];
        return result;
      }
    },
    
    // Format: 15 (juste un nombre)
    {
      regex: /^(\d+)$/,
      format: 'single_number',
      parser: (match) => {
        const num = parseInt(match[1]);
        // Heuristique: si > 20, probablement des répétitions, sinon des séries
        if (num > 20) {
          result.reps = [num];
          result.sets = 1;
        } else {
          result.sets = num;
        }
        return result;
      }
    }
  ];

  // Essayer chaque pattern
  for (const pattern of patterns) {
    const match = cleaned.match(pattern.regex);
    if (match) {
      result.format = pattern.format;
      return pattern.parser(match);
    }
  }

  // Si aucun pattern ne correspond, essayer d'extraire tous les nombres
  const numbers = original.match(/\d+/g);
  if (numbers && numbers.length > 0) {
    result.format = 'extracted_numbers';
    const nums = numbers.map(n => parseInt(n));
    
    if (nums.length === 1) {
      // Un seul nombre - heuristique basée sur la valeur
      if (nums[0] > 20) {
        result.reps = nums;
        result.sets = 1;
      } else {
        result.sets = nums[0];
      }
    } else if (nums.length === 2) {
      // Deux nombres - probablement séries × répétitions
      result.sets = nums[0];
      result.reps = [nums[1]];
    } else {
      // Plus de deux nombres - premier = séries, reste = répétitions
      result.sets = nums[0];
      result.reps = nums.slice(1);
    }
  }

  return result;
}

/**
 * Formate les informations de séries en chaîne lisible
 * @param {Object} parsedSeries - Résultat de parseSeriesString
 * @returns {string} Chaîne formatée
 */
export function formatSeriesInfo(parsedSeries) {
  if (!parsedSeries || parsedSeries.format === 'unknown') {
    return parsedSeries?.originalString || '';
  }

  const { sets, reps, weight, duration, distance } = parsedSeries;
  
  let formatted = '';
  
  if (sets && reps && reps.length > 0) {
    if (reps.length === 1) {
      formatted = `${sets}×${reps[0]}`;
    } else {
      formatted = `${sets}×${reps.join('-')}`;
    }
  } else if (sets) {
    formatted = `${sets} séries`;
  } else if (reps && reps.length > 0) {
    formatted = reps.join('-') + ' reps';
  }
  
  if (weight) {
    formatted += ` @${weight}kg`;
  }
  
  if (duration) {
    if (duration >= 60) {
      formatted += ` (${Math.floor(duration / 60)}min${duration % 60 ? ` ${duration % 60}s` : ''})`;
    } else {
      formatted += ` (${duration}s)`;
    }
  }
  
  if (distance) {
    if (distance >= 1000) {
      formatted += ` (${distance / 1000}km)`;
    } else {
      formatted += ` (${distance}m)`;
    }
  }
  
  return formatted || parsedSeries.originalString;
}

/**
 * Valide si une chaîne de séries est bien formée
 * @param {string} seriesString - Chaîne à valider
 * @returns {boolean} True si valide
 */
export function isValidSeriesString(seriesString) {
  const parsed = parseSeriesString(seriesString);
  return parsed.format !== 'unknown' && (parsed.sets || parsed.reps.length > 0);
}

/**
 * Extrait le nombre total de répétitions estimé
 * @param {Object} parsedSeries - Résultat de parseSeriesString
 * @returns {number} Nombre total de répétitions estimé
 */
export function getTotalRepsEstimate(parsedSeries) {
  if (!parsedSeries || (!parsedSeries.sets && !parsedSeries.reps.length)) {
    return 0;
  }
  
  const { sets, reps } = parsedSeries;
  
  if (reps.length === 0) {
    return 0;
  }
  
  if (reps.length === 1) {
    return (sets || 1) * reps[0];
  }
  
  // Pour les séries pyramidales, sommer toutes les répétitions
  return reps.reduce((total, rep) => total + rep, 0);
}