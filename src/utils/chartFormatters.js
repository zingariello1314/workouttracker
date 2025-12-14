/**
 * Système de formatage intelligent pour les graphiques
 * Transforme les données brutes en informations compréhensibles
 */

// ===== FORMATTERS MONÉTAIRES =====

export const formatCurrency = (value, options = {}) => {
  const {
    currency = 'EUR',
    locale = 'fr-FR',
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
    compact = false
  } = options;

  if (value === null || value === undefined || isNaN(value)) {
    return '0 €';
  }

  // Format compact pour les grandes valeurs
  if (compact && Math.abs(value) >= 1000) {
    if (Math.abs(value) >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M €`;
    }
    if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(1)}K €`;
    }
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits,
    maximumFractionDigits
  }).format(value);
};

// ===== FORMATTERS POURCENTAGES =====

export const formatPercentage = (value, options = {}) => {
  const {
    decimals = 1,
    showSign = false,
    locale = 'fr-FR'
  } = options;

  if (value === null || value === undefined || isNaN(value)) {
    return '0%';
  }

  const formatted = value.toFixed(decimals);
  const sign = showSign && value > 0 ? '+' : '';
  
  return `${sign}${formatted}%`;
};

// ===== FORMATTERS TEMPORELS =====

export const formatDuration = (minutes, options = {}) => {
  const { format = 'auto', showSeconds = false } = options;

  if (!minutes || isNaN(minutes)) {
    return '0min';
  }

  const totalMinutes = Math.round(minutes);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const seconds = showSeconds ? Math.round((minutes % 1) * 60) : 0;

  if (format === 'hours' || (format === 'auto' && hours > 0)) {
    if (showSeconds && seconds > 0) {
      return `${hours}h${mins}m${seconds}s`;
    }
    return mins > 0 ? `${hours}h${mins}m` : `${hours}h`;
  }

  if (showSeconds && seconds > 0) {
    return `${mins}m${seconds}s`;
  }

  return `${mins}min`;
};

export const formatDate = (date, options = {}) => {
  const {
    format = 'short',
    locale = 'fr-FR',
    includeTime = false
  } = options;

  if (!date) return '';

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Date invalide';
  }

  const formatOptions = {
    short: { month: 'short', day: 'numeric' },
    medium: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
  };

  const baseOptions = formatOptions[format] || formatOptions.short;
  
  if (includeTime) {
    baseOptions.hour = '2-digit';
    baseOptions.minute = '2-digit';
  }

  return dateObj.toLocaleDateString(locale, baseOptions);
};

// ===== FORMATTERS NUMÉRIQUES =====

export const formatNumber = (value, options = {}) => {
  const {
    decimals = 0,
    locale = 'fr-FR',
    compact = false,
    unit = ''
  } = options;

  if (value === null || value === undefined || isNaN(value)) {
    return `0${unit ? ' ' + unit : ''}`;
  }

  // Format compact pour les grandes valeurs
  if (compact && Math.abs(value) >= 1000) {
    if (Math.abs(value) >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)}G${unit ? ' ' + unit : ''}`;
    }
    if (Math.abs(value) >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M${unit ? ' ' + unit : ''}`;
    }
    if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(1)}K${unit ? ' ' + unit : ''}`;
    }
  }

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);

  return `${formatted}${unit ? ' ' + unit : ''}`;
};

// ===== FORMATTERS SPÉCIALISÉS =====

export const formatPages = (pages) => {
  if (!pages || isNaN(pages)) return '0 page';
  return `${Math.round(pages)} page${pages > 1 ? 's' : ''}`;
};

export const formatBooks = (books) => {
  if (!books || isNaN(books)) return '0 livre';
  return `${Math.round(books)} livre${books > 1 ? 's' : ''}`;
};

export const formatSessions = (sessions) => {
  if (!sessions || isNaN(sessions)) return '0 session';
  return `${Math.round(sessions)} session${sessions > 1 ? 's' : ''}`;
};

export const formatWeight = (weight, unit = 'kg') => {
  if (!weight || isNaN(weight)) return `0 ${unit}`;
  return `${weight.toFixed(1)} ${unit}`;
};

export const formatHeartRate = (bpm) => {
  if (!bpm || isNaN(bpm)) return '0 bpm';
  return `${Math.round(bpm)} bpm`;
};

export const formatSteps = (steps) => {
  if (!steps || isNaN(steps)) return '0 pas';
  return formatNumber(steps, { compact: true, unit: 'pas' });
};

export const formatCalories = (calories) => {
  if (!calories || isNaN(calories)) return '0 kcal';
  return `${Math.round(calories)} kcal`;
};

// ===== DÉTECTION AUTOMATIQUE DE FORMAT =====

export const autoFormat = (value, context = {}) => {
  const { key, data, type } = context;

  // Détection basée sur la clé
  if (key) {
    const keyLower = key.toLowerCase();
    
    // Monétaire
    if (keyLower.includes('price') || keyLower.includes('cost') || 
        keyLower.includes('amount') || keyLower.includes('patrimony') ||
        keyLower.includes('salary') || keyLower.includes('budget')) {
      return formatCurrency(value, { compact: true });
    }
    
    // Pourcentage
    if (keyLower.includes('percent') || keyLower.includes('rate') || 
        keyLower.includes('ratio') || keyLower.includes('%')) {
      return formatPercentage(value);
    }
    
    // Durée
    if (keyLower.includes('duration') || keyLower.includes('time') ||
        keyLower.includes('minutes') || keyLower.includes('hours')) {
      return formatDuration(value);
    }
    
    // Pages
    if (keyLower.includes('page')) {
      return formatPages(value);
    }
    
    // Livres
    if (keyLower.includes('book') || keyLower.includes('livre')) {
      return formatBooks(value);
    }
    
    // Sessions
    if (keyLower.includes('session')) {
      return formatSessions(value);
    }
    
    // Poids
    if (keyLower.includes('weight') || keyLower.includes('poids')) {
      return formatWeight(value);
    }
    
    // Fréquence cardiaque
    if (keyLower.includes('heart') || keyLower.includes('bpm') ||
        keyLower.includes('cardio')) {
      return formatHeartRate(value);
    }
    
    // Pas
    if (keyLower.includes('step') || keyLower.includes('pas')) {
      return formatSteps(value);
    }
    
    // Calories
    if (keyLower.includes('calorie') || keyLower.includes('kcal')) {
      return formatCalories(value);
    }
  }

  // Détection basée sur le type explicite
  if (type) {
    switch (type) {
      case 'currency': return formatCurrency(value, { compact: true });
      case 'percentage': return formatPercentage(value);
      case 'duration': return formatDuration(value);
      case 'date': return formatDate(value);
      case 'pages': return formatPages(value);
      case 'books': return formatBooks(value);
      case 'sessions': return formatSessions(value);
      case 'weight': return formatWeight(value);
      case 'heartrate': return formatHeartRate(value);
      case 'steps': return formatSteps(value);
      case 'calories': return formatCalories(value);
      default: break;
    }
  }

  // Détection basée sur la valeur
  if (typeof value === 'number') {
    // Très grandes valeurs = probablement monétaire
    if (Math.abs(value) > 10000) {
      return formatCurrency(value, { compact: true });
    }
    
    // Valeurs entre 0 et 1 = probablement pourcentage
    if (value >= 0 && value <= 1) {
      return formatPercentage(value * 100);
    }
    
    // Valeurs entre 1 et 100 = probablement pourcentage déjà
    if (value >= 1 && value <= 100 && Number.isInteger(value)) {
      return formatPercentage(value);
    }
  }

  // Format par défaut
  return formatNumber(value, { decimals: 1 });
};

// ===== FORMATTERS POUR AXES =====

export const formatXAxis = (value, dataType = 'auto') => {
  if (dataType === 'date' || (typeof value === 'string' && value.includes('-'))) {
    return formatDate(value, { format: 'short' });
  }
  
  if (dataType === 'month') {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
                   'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    return months[value - 1] || value;
  }
  
  return value;
};

export const formatYAxis = (value, dataType = 'auto', context = {}) => {
  return autoFormat(value, { type: dataType, ...context });
};

// ===== UTILITAIRES =====

export const getOptimalDecimals = (values) => {
  if (!Array.isArray(values) || values.length === 0) return 0;
  
  const maxValue = Math.max(...values.filter(v => !isNaN(v)));
  const minValue = Math.min(...values.filter(v => !isNaN(v)));
  const range = maxValue - minValue;
  
  if (range < 1) return 2;
  if (range < 10) return 1;
  return 0;
};

export const detectDataType = (values, key = '') => {
  if (!Array.isArray(values) || values.length === 0) return 'number';
  
  const keyLower = key.toLowerCase();
  
  // Détection basée sur la clé
  if (keyLower.includes('date') || keyLower.includes('time')) return 'date';
  if (keyLower.includes('percent') || keyLower.includes('%')) return 'percentage';
  if (keyLower.includes('price') || keyLower.includes('cost') || keyLower.includes('amount')) return 'currency';
  if (keyLower.includes('duration') || keyLower.includes('minutes')) return 'duration';
  
  // Détection basée sur les valeurs
  const numericValues = values.filter(v => typeof v === 'number' && !isNaN(v));
  
  if (numericValues.length === 0) return 'string';
  
  const allBetween0And1 = numericValues.every(v => v >= 0 && v <= 1);
  if (allBetween0And1) return 'percentage';
  
  const allBetween0And100 = numericValues.every(v => v >= 0 && v <= 100);
  if (allBetween0And100 && numericValues.every(v => Number.isInteger(v))) return 'percentage';
  
  const hasLargeValues = numericValues.some(v => Math.abs(v) > 1000);
  if (hasLargeValues) return 'currency';
  
  return 'number';
};