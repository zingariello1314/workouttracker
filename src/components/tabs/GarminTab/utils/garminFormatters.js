/**
 * Utilitaires de formatage pour les données Garmin
 */

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
 * Formate une allure (pace) en secondes par 100m au format "mm:ss"
 */
export function formatPace(secondsPer100m) {
  if (!secondsPer100m || secondsPer100m <= 0) return 'N/A';
  
  const minutes = Math.floor(secondsPer100m / 60);
  const secs = Math.floor(secondsPer100m % 60);
  
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Formate une distance en km avec unité
 */
export function formatDistance(km) {
  if (!km || km <= 0) return '0 km';
  
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  
  return `${km.toFixed(2)} km`.replace(/\.?0+$/, '');
}

/**
 * Formate un timestamp au format "HH:MM" ou "HH:MM:SS"
 */
export function formatTime(timestamp, includeSeconds = false) {
  if (!timestamp) return 'N/A';
  
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      // Si c'est déjà une string au format "HH:MM" ou "HH:MM:SS"
      if (typeof timestamp === 'string' && timestamp.match(/^\d{2}:\d{2}(:\d{2})?$/)) {
        return timestamp;
      }
      return 'N/A';
    }
    
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

