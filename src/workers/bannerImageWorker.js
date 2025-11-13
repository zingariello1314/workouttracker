/**
 * 🖼️ WEB WORKER : TRAITEMENT BANNIÈRES NON-BLOQUANT
 * 
 * Traite les images de bannières dans un Web Worker pour éviter le blocage de l'UI.
 * - Conversion format optimal (WebP si supporté)
 * - Création thumbnails légers
 * - Qualité 100% préservée pour full
 * 
 * @module bannerImageWorker
 */

// ✅ Détection support WebP dans worker
// Note: Dans un worker, on ne peut pas tester directement WebP avec Image
// On utilise createImageBitmap qui supporte WebP si le navigateur le supporte
const checkWebPSupport = async () => {
  try {
    // Test avec une petite image WebP (2x2 pixels)
    const webpTest = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    const response = await fetch(webpTest);
    const blob = await response.blob();
    await createImageBitmap(blob);
    return true;
  } catch {
    return false;
  }
};

/**
 * Charge une image depuis File ou Data URL
 * 
 * @param {File|string} input - File ou Data URL
 * @returns {Promise<ImageBitmap>} ImageBitmap chargée
 */
async function loadImageFromData(input) {
  let blob;
  
  if (input instanceof File) {
    blob = input;
  } else if (typeof input === 'string') {
    // Data URL
    const response = await fetch(input);
    blob = await response.blob();
  } else {
    throw new Error('Format input invalide (attendu File ou Data URL)');
  }
  
  return await createImageBitmap(blob);
}

/**
 * Convertit ImageBitmap en Base64 avec format et qualité spécifiés
 * 
 * @param {ImageBitmap} imageBitmap - ImageBitmap à convertir
 * @param {string} format - Format ('webp' ou 'jpeg')
 * @param {number} quality - Qualité 0-1 (1.0 = 100%)
 * @returns {Promise<string>} Data URL Base64
 */
async function convertToFormat(imageBitmap, format, quality) {
  // Créer OffscreenCanvas
  const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
  const ctx = canvas.getContext('2d');
  
  // Dessiner image sur canvas
  ctx.drawImage(imageBitmap, 0, 0);
  
  // Convertir en Blob avec format et qualité
  const mimeType = format === 'webp' ? 'image/webp' : 'image/jpeg';
  const blob = await canvas.convertToBlob({ 
    type: mimeType, 
    quality: quality 
  });
  
  // Convertir Blob en Base64
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Crée un thumbnail depuis ImageBitmap
 * 
 * @param {ImageBitmap} imageBitmap - ImageBitmap source
 * @param {string} format - Format ('webp' ou 'jpeg')
 * @param {number} quality - Qualité 0-1 (défaut: 0.8)
 * @param {number} maxSize - Taille max (défaut: 200)
 * @returns {Promise<string>} Data URL Base64 du thumbnail
 */
async function createThumbnailFromImage(imageBitmap, format, quality = 0.8, maxSize = 200) {
  // Calculer dimensions thumbnail (conserver ratio)
  let thumbWidth = imageBitmap.width;
  let thumbHeight = imageBitmap.height;
  
  if (thumbWidth > thumbHeight) {
    if (thumbWidth > maxSize) {
      thumbHeight = (thumbHeight * maxSize) / thumbWidth;
      thumbWidth = maxSize;
    }
  } else {
    if (thumbHeight > maxSize) {
      thumbWidth = (thumbWidth * maxSize) / thumbHeight;
      thumbHeight = maxSize;
    }
  }
  
  // Créer OffscreenCanvas pour thumbnail
  const thumbCanvas = new OffscreenCanvas(thumbWidth, thumbHeight);
  const thumbCtx = thumbCanvas.getContext('2d');
  
  // Dessiner image redimensionnée
  thumbCtx.drawImage(imageBitmap, 0, 0, thumbWidth, thumbHeight);
  
  // Convertir en Blob
  const mimeType = format === 'webp' ? 'image/webp' : 'image/jpeg';
  const thumbBlob = await thumbCanvas.convertToBlob({ 
    type: mimeType, 
    quality: quality 
  });
  
  // Convertir Blob en Base64
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(thumbBlob);
  });
}

/**
 * Message handler principal
 */
self.onmessage = async function(e) {
  const { type, payload } = e.data;
  
  if (type === 'PROCESS_IMAGE') {
    try {
      const {
        fileData, // File ou Data URL
        createThumbnail = true,
        preserveQuality = true // Qualité 100% pour full
      } = payload;
      
      // ✅ Étape 1: Détection support WebP (10% progression)
      self.postMessage({ 
        type: 'PROGRESS', 
        progress: 10, 
        message: 'Détection format optimal...' 
      });
      
      const supportsWebP = await checkWebPSupport();
      const format = supportsWebP ? 'webp' : 'jpeg';
      
      // ✅ Étape 2: Charger image (30% progression)
      self.postMessage({ 
        type: 'PROGRESS', 
        progress: 30, 
        message: 'Chargement image...' 
      });
      
      const imageBitmap = await loadImageFromData(fileData);
      const originalWidth = imageBitmap.width;
      const originalHeight = imageBitmap.height;
      
      // ✅ Étape 3: Convertir full (qualité 100%) (50% progression)
      self.postMessage({ 
        type: 'PROGRESS', 
        progress: 50, 
        message: 'Conversion format optimal (qualité 100%)...' 
      });
      
      const fullQuality = preserveQuality ? 1.0 : 0.95; // 100% ou 95% max
      const fullBase64 = await convertToFormat(imageBitmap, format, fullQuality);
      
      // ✅ Étape 4: Créer thumbnail si demandé (70% progression)
      let thumbnailBase64 = null;
      let thumbnailDimensions = null;
      
      if (createThumbnail) {
        self.postMessage({ 
          type: 'PROGRESS', 
          progress: 70, 
          message: 'Création thumbnail...' 
        });
        
        thumbnailBase64 = await createThumbnailFromImage(imageBitmap, format, 0.8, 200);
        
        // Calculer dimensions thumbnail
        let thumbWidth = originalWidth;
        let thumbHeight = originalHeight;
        if (thumbWidth > thumbHeight) {
          if (thumbWidth > 200) {
            thumbHeight = (thumbHeight * 200) / thumbWidth;
            thumbWidth = 200;
          }
        } else {
          if (thumbHeight > 200) {
            thumbWidth = (thumbWidth * 200) / thumbHeight;
            thumbHeight = 200;
          }
        }
        thumbnailDimensions = { width: Math.round(thumbWidth), height: Math.round(thumbHeight) };
      }
      
      // ✅ Étape 5: Calculer métadonnées (90% progression)
      self.postMessage({ 
        type: 'PROGRESS', 
        progress: 90, 
        message: 'Finalisation...' 
      });
      
      const originalSize = fileData instanceof File 
        ? fileData.size 
        : (fileData.length * 0.75); // Estimation Base64 → bytes
      
      // ✅ Étape 6: Retourner résultats (100% progression)
      self.postMessage({
        type: 'PROCESS_IMAGE_SUCCESS',
        payload: {
          full: fullBase64,
          thumbnail: thumbnailBase64,
          format: format,
          metadata: {
            originalSize: originalSize,
            fullSize: fullBase64.length * 0.75, // Estimation Base64 → bytes
            thumbnailSize: thumbnailBase64 ? (thumbnailBase64.length * 0.75) : 0,
            dimensions: {
              width: originalWidth,
              height: originalHeight
            },
            thumbnailDimensions: thumbnailDimensions,
            quality: preserveQuality ? 'maximum' : 'high',
            webPSupported: supportsWebP,
            compressionType: 'format_optimization_only', // Pas de compression destructive
            qualityPreserved: preserveQuality
          }
        }
      });
      
      // Nettoyer ImageBitmap
      imageBitmap.close();
      
    } catch (error) {
      self.postMessage({
        type: 'PROCESS_IMAGE_ERROR',
        error: {
          message: error.message,
          stack: error.stack
        }
      });
    }
  }
  
  // Autres types de messages (extensible)
  else if (type === 'PING') {
    self.postMessage({ type: 'PONG' });
  }
};

