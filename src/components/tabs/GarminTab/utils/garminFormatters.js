/**
 * Utilitaires de formatage pour les données Garmin
 */

/**
 * 🔴 FIX #4: Normalise une date Garmin en format YYYY-MM-DD
 * 🟡 FIX #30: Cache global pour éviter recalculs
 * Utilisé partout pour éviter les incohérences de format
 */
const dateNormalizationCache = new Map();

export function normalizeGarminDate(dateStr) {
  if (!dateStr) return null;

  // 🟡 FIX #30: Utiliser le cache
  if (dateNormalizationCache.has(dateStr)) {
    return dateNormalizationCache.get(dateStr);
  }

  const raw = String(dateStr).trim();

  // Si déjà au format YYYY-MM-DD, retourner tel quel
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    dateNormalizationCache.set(dateStr, raw);
    return raw;
  }

  // Préfixe ISO / Garmin « 2026-06-12T… » ou « 2026-06-12 … » — date locale, pas UTC
  const prefix = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (prefix) {
    dateNormalizationCache.set(dateStr, prefix[1]);
    return prefix[1];
  }

  try {
    const d = new Date(raw);
    if (!isNaN(d.getTime())) {
      const yy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const normalized = `${yy}-${mm}-${dd}`;
      dateNormalizationCache.set(dateStr, normalized);
      return normalized;
    }
  } catch {
    // Ignorer erreurs de parsing
  }

  dateNormalizationCache.set(dateStr, null);
  return null;
}

/**
 * 🟡 FIX #30: Compare deux dates de manière efficace (utilise timestamps numériques)
 */
export function compareGarminDates(dateStr1, dateStr2) {
  if (!dateStr1 || !dateStr2) return false;
  
  const normalized1 = normalizeGarminDate(dateStr1);
  const normalized2 = normalizeGarminDate(dateStr2);
  
  if (!normalized1 || !normalized2) return false;
  
  // Comparaison string est rapide pour YYYY-MM-DD
  return normalized1 === normalized2;
}

/**
 * Formate une durée en secondes au format "mm:ss" ou "hh:mm:ss"
 */
export function formatDuration(seconds) {
  if (!seconds || seconds <= 0) return '00:00';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * 🔴 FIX #27: Formate une durée en minutes au format cohérent
 */
export function formatDurationMinutes(minutes) {
  if (!minutes || minutes === 0) return '0min';
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0) {
    return `${hours}h${mins > 0 ? `${mins}min` : ''}`;
  }
  return `${mins}min`;
}

/**
 * 🔴 FIX #27: Formate une durée de sommeil (en heures décimales) au format cohérent "Xh Ym"
 */
export function formatSleepDuration(hours) {
  if (!hours || hours === 0) return '—';
  const h = Math.floor(hours);
  const m = Math.round((hours % 1) * 60);
  if (h > 0) {
    return `${h}h${m > 0 ? ` ${m}m` : ''}`;
  }
  return `${m}m`;
}

/**
 * Formate une allure (pace) en secondes par 100m au format "mm:ss"
 */
export function formatPace(secondsPer100m) {
  if (!secondsPer100m || secondsPer100m <= 0) return 'N/A';
  
  const minutes = Math.floor(secondsPer100m / 60);
  const secs = Math.floor(secondsPer100m % 60);
  
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Allure course : secondes par km → "m:ss /km"
 */
export function formatPacePerKm(secondsPerKm) {
  if (secondsPerKm == null || secondsPerKm <= 0) return '—';
  const t = Number(secondsPerKm);
  if (Number.isNaN(t)) return '—';
  const m = Math.floor(t / 60);
  const s = Math.round(t % 60);
  return `${m}:${String(s).padStart(2, '0')} /km`;
}

/**
 * 🔴 FIX #27: Formate une distance en km avec formatage cohérent
 * Supprime les zéros inutiles après la virgule
 */
export function formatDistance(km) {
  // 🔴 FIX : Gérer les objets (cas où distance serait un objet avec average/min/max)
  if (km !== null && km !== undefined && typeof km === 'object') {
    // Si c'est un objet, essayer d'extraire une valeur numérique
    const numericValue = km.value || km.average || km.avg || km.total || km.distance || 0;
    km = typeof numericValue === 'number' ? numericValue : 0;
  }
  
  if (km === null || km === undefined || isNaN(km)) return '0 km';
  if (km === 0) return '0 km';
  if (km < 1) {
    const meters = Math.round(km * 1000);
    return `${meters} m`;
  }
  // Format avec 1 décimale, mais supprime les zéros inutiles
  const formatted = km.toFixed(1);
  return `${parseFloat(formatted)} km`;
}

/**
 * 🔴 FIX #11: Formate un timestamp au format "HH:MM" ou "HH:MM:SS" en heure locale
 * Gère les timestamps UTC ISO et les convertit en heure locale
 */
export function formatTime(timestamp, includeSeconds = false) {
  if (!timestamp) return 'N/A';
  
  try {
    // Si c'est déjà une string au format "HH:MM" ou "HH:MM:SS"
    if (typeof timestamp === 'string' && timestamp.match(/^\d{2}:\d{2}(:\d{2})?$/)) {
      return timestamp;
    }
    
    // Parser le timestamp (peut être ISO string ou autre)
    let date;
    if (typeof timestamp === 'string') {
      // Si c'est un ISO string UTC (se termine par Z), le parser comme UTC
      if (timestamp.endsWith('Z')) {
        date = new Date(timestamp);
      } else if (timestamp.includes('T')) {
        // ISO avec timezone ou sans
        date = new Date(timestamp);
      } else {
        // Format date simple
        date = new Date(timestamp);
      }
    } else {
      date = new Date(timestamp);
    }
    
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    
    // Convertir en heure locale
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    if (includeSeconds) {
      return `${hours}:${minutes}:${seconds}`;
    }
    return `${hours}:${minutes}`;
  } catch (e) {
    return 'N/A';
  }
}

/**
 * Formate une date au format "DD/MM/YYYY"
 */
export function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return dateStr;
    }
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (e) {
    return dateStr;
  }
}

/**
 * Formate une date au format "DD/MM/YYYY HH:MM"
 */
export function formatDateTime(dateStr, timeStr) {
  const datePart = formatDate(dateStr);
  const timePart = formatTime(timeStr);
  
  if (timePart === 'N/A') {
    return datePart;
  }
  
  return `${datePart} ${timePart}`;
}

/**
 * Formate une vitesse en km/h
 */
export function formatSpeed(kmh) {
  if (!kmh || kmh <= 0) return 'N/A';
  return `${kmh.toFixed(1)} km/h`;
}

/**
 * Formate un nombre avec séparateurs de milliers
 */
export function formatNumber(num) {
  if (num === null || num === undefined) return '0';
  return String(Math.round(num)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Formate une température en °C
 */
export function formatTemperature(celsius) {
  if (celsius === null || celsius === undefined) return 'N/A';
  return `${Math.round(celsius)}°C`;
}

/**
 * Formate une fréquence cardiaque
 */
export function formatHeartRate(bpm) {
  if (!bpm || bpm <= 0) return 'N/A';
  return `${bpm} bpm`;
}
