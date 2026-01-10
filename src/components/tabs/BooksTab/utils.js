/**
 * Utilitaires pour BooksTab
 * 
 * ✅ PHASE 4 : Extraction des utilitaires
 * 
 * @module components/tabs/BooksTab/utils
 */

/**
 * Lit un fichier et retourne son contenu en data URL
 * @param {File} file - Fichier à lire
 * @returns {Promise<string|null>} Data URL ou null en cas d'erreur
 */
export const readFileAsDataUrl = (file) =>
  new Promise((resolve) => {
    if (!file) {
      resolve(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      resolve(typeof reader.result === 'string' ? reader.result : null);
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });

/**
 * Convertit une data URL en Blob
 * @param {string} dataURL - Data URL à convertir
 * @returns {Blob|null} Blob ou null en cas d'erreur
 */
export const dataURLtoBlob = (dataURL) => {
  try {
    const arr = dataURL.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  } catch (error) {
    console.error('[BooksTab] Erreur conversion dataURL vers Blob:', error);
    return null;
  }
};

/**
 * Calcule le temps total de lecture d'un livre
 * @param {Object} book - Livre
 * @returns {number} Temps total en minutes
 */
export const getTotalReadingTime = (book) => {
  if (!book || !book.readingSessions) return 0;
  return book.readingSessions.reduce(
    (sum, s) => sum + (Number(s.durationMinutes) || 0),
    0
  );
};

/**
 * Calcule le nombre total de pages lues
 * @param {Object} book - Livre
 * @returns {number} Nombre total de pages lues
 */
export const getTotalPagesRead = (book) => {
  if (!book || !book.readingSessions) return 0;
  return book.readingSessions.reduce(
    (sum, s) => sum + (Number(s.pagesRead) || 0),
    0
  );
};

/**
 * Calcule la moyenne de pages par session
 * @param {Object} book - Livre
 * @returns {number} Moyenne de pages par session
 */
export const getAveragePagesPerSession = (book) => {
  const sessions = book?.readingSessions || [];
  if (sessions.length === 0) return 0;
  return Math.round(getTotalPagesRead(book) / sessions.length);
};

/**
 * Calcule la durée moyenne par session
 * @param {Object} book - Livre
 * @returns {number} Durée moyenne en minutes
 */
export const getAverageDurationPerSession = (book) => {
  const sessions = book?.readingSessions || [];
  if (sessions.length === 0) return 0;
  return Math.round(getTotalReadingTime(book) / sessions.length);
};

/**
 * Calcule le pourcentage de progression
 * @param {Object} book - Livre
 * @returns {number|null} Pourcentage de progression ou null
 */
export const getReadingProgressPercent = (book) => {
  const totalPages = Number(book?.pages) || 0;
  if (totalPages === 0) return null;
  const pagesRead = getTotalPagesRead(book);
  if (pagesRead === 0) return 0;
  return Math.min(100, Math.round((pagesRead / totalPages) * 100));
};

/**
 * Calcule le temps estimé restant
 * @param {Object} book - Livre
 * @returns {number|null} Temps estimé restant en minutes ou null
 */
export const getEstimatedRemainingTimeMinutes = (book) => {
  const totalPages = Number(book?.pages) || 0;
  const pagesRead = getTotalPagesRead(book);
  if (totalPages === 0 || pagesRead === 0) return null;
  
  const remainingPages = totalPages - pagesRead;
  const avgPagesPerMinute = getAveragePagesPerSession(book) / getAverageDurationPerSession(book);
  if (!avgPagesPerMinute || avgPagesPerMinute === 0) return null;
  
  return Math.round(remainingPages / avgPagesPerMinute);
};
