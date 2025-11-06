/**
 * ✅ PHASE 3.3 : Web Worker pour compression d'images
 * 
 * Compression multi-résolution dans un Web Worker pour éviter le freeze de l'UI.
 * Utilise OffscreenCanvas et ImageBitmap pour le traitement dans le worker.
 * 
 * Avantages :
 * - UI non bloquée pendant compression
 * - Traitement parallèle des résolutions
 * - Meilleure performance pour grandes images
 * - Isolation des erreurs
 */

// ✅ Détection support WebP dans worker
// Note: Dans un worker, on ne peut pas tester directement WebP
// On assume que si OffscreenCanvas est disponible, WebP est probablement supporté
// Le fallback JPEG est géré automatiquement si WebP échoue
const checkWebPSupport = () => {
  return Promise.resolve(true); // Optimiste, fallback géré dans le code
};

// ✅ Calculer dimensions redimensionnées en conservant le ratio
const calculateResizedDimensions = (width, height, maxWidth, maxHeight) => {
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }
  
  const widthRatio = maxWidth / width;
  const heightRatio = maxHeight / height;
  const ratio = Math.min(widthRatio, heightRatio);
  
  return {
    width: Math.round(width * ratio),
    height: Math.round(height * ratio)
  };
};

// ✅ Convertir bytes en KB
const bytesToKB = (bytes) => {
  return Math.round((bytes / 1024) * 100) / 100;
};

// ✅ Convertir blob en base64 dans worker (compatible tous workers, optimisé)
const blobToBase64 = async (blob) => {
  // ✅ Utiliser ArrayBuffer puis conversion optimisée par chunks
  const arrayBuffer = await blob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  
  // ✅ Optimisation : conversion par chunks pour grandes images (évite freeze)
  const chunkSize = 8192; // 8KB chunks
  let binary = '';
  const len = uint8Array.length;
  
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = uint8Array.slice(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, chunk);
    
    // ✅ Yield périodiquement pour éviter freeze (tous les 64KB)
    if (i % (chunkSize * 8) === 0 && i > 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  const base64 = btoa(binary);
  return `data:${blob.type};base64,${base64}`;
};

// ✅ Message handler principal
self.onmessage = async function(e) {
  const { type, payload } = e.data;
  
  if (type === 'COMPRESS_MULTI_RESOLUTION') {
    try {
      const {
        imageData, // Data URL ou ArrayBuffer
        resolutions = [
          { name: 'thumbnail', width: 150, height: 200, quality: 0.6 },
          { name: 'preview', width: 400, height: 533, quality: 0.75 },
          { name: 'full', width: 1200, height: 1600, quality: 0.85 }
        ],
        progressive = true,
        originalSize = 0
      } = payload;
      
      // ✅ Étape 1: Détection support WebP (10% progression)
      self.postMessage({ type: 'PROGRESS', progress: 10, message: 'Détection format...' });
      
      const supportsWebP = await checkWebPSupport();
      const format = supportsWebP ? 'webp' : 'jpeg';
      
      // ✅ Étape 2: Charger ImageBitmap (20% progression)
      self.postMessage({ type: 'PROGRESS', progress: 20, message: 'Chargement image...' });
      
      let imageBitmap;
      try {
        // Convertir Data URL en Blob puis ImageBitmap
        let blob;
        if (typeof imageData === 'string') {
          // Data URL
          const response = await fetch(imageData);
          blob = await response.blob();
        } else {
          // ArrayBuffer
          blob = new Blob([imageData]);
        }
        
        imageBitmap = await createImageBitmap(blob);
      } catch (error) {
        throw new Error(`Impossible de charger l'image: ${error.message}`);
      }
      
      const originalWidth = imageBitmap.width;
      const originalHeight = imageBitmap.height;
      
      // ✅ Étape 3: Créer ImageBitmap (30% progression)
      self.postMessage({ 
        type: 'PROGRESS', 
        progress: 30, 
        message: `Préparation compression (${originalWidth}x${originalHeight})...` 
      });
      
      const results = {};
      
      // ✅ Étape 4: Générer toutes résolutions en parallèle (40-90% progression)
      const resolutionPromises = resolutions.map(async (res, index) => {
        const progressStart = 40 + (index * (50 / resolutions.length));
        const progressEnd = 40 + ((index + 1) * (50 / resolutions.length));
        
        // ✅ PHASE 4.2 : Message enrichi avec dimensions
        const resolutionLabels = {
          thumbnail: 'Miniature',
          preview: 'Aperçu',
          full: 'Pleine résolution'
        };
        self.postMessage({
          type: 'PROGRESS',
          progress: progressStart,
          message: `Compression ${res.name} (${resolutionLabels[res.name] || res.name})...`
        });
        
        try {
          // Calculer dimensions redimensionnées
          const { width, height } = calculateResizedDimensions(
            originalWidth,
            originalHeight,
            res.width,
            res.height
          );
          
          // Créer OffscreenCanvas pour cette résolution
          const offscreen = new OffscreenCanvas(width, height);
          const ctx = offscreen.getContext('2d', {
            alpha: false,
            desynchronized: true
          });
          
          if (!ctx) {
            throw new Error(`Impossible de créer contexte 2D pour ${res.name}`);
          }
          
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(imageBitmap, 0, 0, width, height);
          
          // ✅ Générer blob avec format optimal (WebP ou JPEG)
          let blob;
          let finalFormat = format;
          
          try {
            if (format === 'webp') {
              blob = await offscreen.convertToBlob({
                type: 'image/webp',
                quality: res.quality
              });
              
              // Si blob est vide ou échec, fallback JPEG
              if (!blob || blob.size === 0) {
                blob = await offscreen.convertToBlob({
                  type: 'image/jpeg',
                  quality: res.quality
                });
                finalFormat = 'jpeg';
              }
            } else {
              // Format JPEG standard
              blob = await offscreen.convertToBlob({
                type: 'image/jpeg',
                quality: res.quality
              });
            }
          } catch (blobError) {
            // Fallback JPEG si erreur
            blob = await offscreen.convertToBlob({
              type: 'image/jpeg',
              quality: res.quality
            });
            finalFormat = 'jpeg';
          }
          
          // Convertir blob en base64
          const base64 = await blobToBase64(blob);
          
          // ✅ PHASE 4.2 : Message enrichi avec taille compressée
          const sizeKB = bytesToKB(blob.size);
          self.postMessage({
            type: 'PROGRESS',
            progress: progressEnd,
            message: `${res.name} compressé (${sizeKB} KB)`
          });
          
          return {
            name: res.name,
            data: base64,
            width,
            height,
            size: blob.size,
            format: finalFormat,
            quality: res.quality
          };
        } catch (error) {
          throw new Error(`Erreur compression ${res.name}: ${error.message}`);
        }
      });
      
      // ✅ Attendre toutes résolutions en parallèle
      const resolved = await Promise.all(resolutionPromises);
      resolved.forEach(res => {
        results[res.name] = res;
      });
      
      // ✅ PHASE 4.2 : Étape 5: Finalisation (100% progression)
      self.postMessage({ type: 'PROGRESS', progress: 100, message: 'Compression terminée !' });
      
      const totalSize = Object.values(results).reduce((sum, r) => sum + r.size, 0);
      const reduction = originalSize > 0
        ? Math.round(((originalSize - totalSize) / originalSize) * 100)
        : 0;
      
      // ✅ Retourner résultats
      self.postMessage({
        type: 'SUCCESS',
        result: {
          ...results,
          originalSize,
          totalSize,
          originalSizeKB: bytesToKB(originalSize),
          totalSizeKB: bytesToKB(totalSize),
          reduction,
          format: format,
          dimensions: {
            original: { width: originalWidth, height: originalHeight }
          }
        }
      });
      
    } catch (error) {
      self.postMessage({
        type: 'ERROR',
        error: {
          message: error.message,
          stack: error.stack
        }
      });
    }
  }
};

