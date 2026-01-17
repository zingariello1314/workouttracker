/**
 * Utilitaires pour gérer les fichiers .odt (OpenDocument Text)
 * Les fichiers .odt sont des archives ZIP contenant du XML
 */

import JSZip from 'jszip';

/**
 * Extrait le texte d'un fichier .odt
 * @param {File|Blob|ArrayBuffer} file - Le fichier .odt
 * @returns {Promise<string>} Le texte extrait
 */
export const extractTextFromODT = async (file) => {
  try {
    // Convertir le fichier en ArrayBuffer si nécessaire
    let arrayBuffer;
    if (file instanceof File || file instanceof Blob) {
      arrayBuffer = await file.arrayBuffer();
    } else {
      arrayBuffer = file;
    }

    // Charger le ZIP
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Extraire content.xml qui contient le texte
    const contentXml = await zip.file('content.xml').async('string');

    // Parser le XML pour extraire le texte
    // Les fichiers ODT utilisent le namespace text: pour le contenu texte
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(contentXml, 'text/xml');

    // Extraire tous les nœuds de texte
    const textNodes = xmlDoc.getElementsByTagNameNS('urn:oasis:names:tc:opendocument:xmlns:text:1.0', 'p');
    let text = '';

    for (let i = 0; i < textNodes.length; i++) {
      const paragraph = textNodes[i];
      // Récupérer le texte et les spans
      const textContent = extractTextFromNode(paragraph);
      if (textContent.trim()) {
        text += textContent + '\n';
      }
    }

    // Si pas de paragraphes, essayer de récupérer directement le texte
    if (!text.trim()) {
      const allText = xmlDoc.getElementsByTagNameNS('urn:oasis:names:tc:opendocument:xmlns:text:1.0', 'span');
      for (let i = 0; i < allText.length; i++) {
        const span = allText[i];
        const spanText = extractTextFromNode(span);
        if (spanText.trim()) {
          text += spanText;
        }
      }
    }

    return text.trim() || '';
  } catch (error) {
    console.error('[odtHandler] Erreur extraction texte ODT:', error);
    throw new Error('Impossible d\'extraire le texte du fichier .odt');
  }
};

/**
 * Extrait récursivement le texte d'un nœud XML
 */
const extractTextFromNode = (node) => {
  let text = '';
  
  if (node.nodeType === Node.TEXT_NODE) {
    text += node.textContent;
  } else {
    for (const child of node.childNodes) {
      text += extractTextFromNode(child);
    }
  }
  
  return text;
};

/**
 * Reconstruit un fichier .odt avec le nouveau texte
 * @param {File|Blob|ArrayBuffer} originalFile - Le fichier .odt original
 * @param {string} newText - Le nouveau texte à insérer
 * @returns {Promise<Blob>} Le nouveau fichier .odt
 */
export const rebuildODTWithText = async (originalFile, newText) => {
  try {
    // Convertir le fichier en ArrayBuffer si nécessaire
    let arrayBuffer;
    if (originalFile instanceof File || originalFile instanceof Blob) {
      arrayBuffer = await originalFile.arrayBuffer();
    } else {
      arrayBuffer = originalFile;
    }

    // Charger le ZIP original
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Lire content.xml
    const contentXml = await zip.file('content.xml').async('string');

    // Parser le XML
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(contentXml, 'text/xml');

    // Trouver le body du document
    const body = xmlDoc.getElementsByTagNameNS('urn:oasis:names:tc:opendocument:xmlns:office:1.0', 'body')[0];
    if (!body) {
      throw new Error('Structure ODT invalide : body introuvable');
    }

    // Trouver l'élément text
    const textElement = body.getElementsByTagNameNS('urn:oasis:names:tc:opendocument:xmlns:text:1.0', 'text')[0];
    if (!textElement) {
      throw new Error('Structure ODT invalide : text introuvable');
    }

    // Vider le contenu existant
    while (textElement.firstChild) {
      textElement.removeChild(textElement.firstChild);
    }

    // Créer de nouveaux paragraphes à partir du texte
    const paragraphs = newText.split('\n').filter(p => p.trim() || p === '');
    
    paragraphs.forEach((paragraphText, index) => {
      const p = xmlDoc.createElementNS('urn:oasis:names:tc:opendocument:xmlns:text:1.0', 'text:p');
      
      if (paragraphText.trim()) {
        // Créer un span pour le texte
        const span = xmlDoc.createElementNS('urn:oasis:names:tc:opendocument:xmlns:text:1.0', 'text:span');
        span.textContent = paragraphText;
        p.appendChild(span);
      }
      
      textElement.appendChild(p);
    });

    // Convertir le XML modifié en string
    const serializer = new XMLSerializer();
    const newContentXml = serializer.serializeToString(xmlDoc);

    // Mettre à jour content.xml dans le ZIP
    zip.file('content.xml', newContentXml);

    // Générer le nouveau fichier .odt
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });

    return blob;
  } catch (error) {
    console.error('[odtHandler] Erreur reconstruction ODT:', error);
    throw new Error('Impossible de reconstruire le fichier .odt');
  }
};

/**
 * Lit un fichier .odt et retourne son contenu texte
 * @param {File} file - Le fichier .odt
 * @returns {Promise<{text: string, blob: Blob}>} Le texte et le blob original
 */
export const readODTFile = async (file) => {
  const text = await extractTextFromODT(file);
  const blob = file instanceof File || file instanceof Blob ? file : new Blob([file]);
  return { text, blob };
};
