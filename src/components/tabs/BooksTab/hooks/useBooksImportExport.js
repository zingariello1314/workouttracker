/**
 * Hook pour la gestion de l'import/export des livres
 * 
 * ✅ PHASE 4 : Extraction de la logique d'import/export
 * 
 * @module components/tabs/BooksTab/hooks/useBooksImportExport
 */

import { useState, useRef, useCallback } from 'react';
import { importBooksFromFile } from '../../../../utils/booksStorage';
import {
  prepareBooksExportData,
  processBooksImportData,
  downloadBooksExportFile,
} from '../../../../utils/booksExportImport';
import { saveBookCover } from '../../../../utils/booksAssetsStorage';
import { dataURLtoBlob } from '../utils';

/**
 * Hook pour gérer l'import/export des livres
 * 
 * @param {Array} books - Liste de tous les livres
 * @param {Function} setBooks - Fonction pour mettre à jour les livres
 * @param {Object} coverUrls - Objet des URLs de couvertures
 * @param {Function} setCoverUrls - Fonction pour mettre à jour les URLs de couvertures
 * @param {Object} coverUrlsRef - Ref pour les URLs de couvertures
 * @returns {Object} { isImporting, fileInputRef, handleExport, handleImportClick, handleImportFileChange }
 */
export const useBooksImportExport = (books = [], setBooks, coverUrls, setCoverUrls, coverUrlsRef) => {
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);

  const handleExport = useCallback(() => {
    const exportData = prepareBooksExportData(books, {
      includeSessions: true,
      includeMetadata: true,
    });
    downloadBooksExportFile(exportData);
  }, [books]);

  const handleImportClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  }, []);

  const handleImportFileChange = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const fileText = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file, 'utf-8');
      });

      let parsedData;
      try {
        parsedData = JSON.parse(fileText);
      } catch (parseError) {
        alert("Le fichier n'est pas un JSON valide.");
        return;
      }

      let dataToProcess = parsedData;
      
      if (parsedData && !parsedData.data && Array.isArray(parsedData.books)) {
        dataToProcess = {
          version: parsedData.version || '1.0',
          data: { books: parsedData.books },
        };
      } else if (Array.isArray(parsedData)) {
        dataToProcess = {
          version: '1.0',
          data: { books: parsedData },
        };
      }

      const result = processBooksImportData(dataToProcess);

      if (!result.valid) {
        console.error('[BooksTab] Erreurs d\'import:', result.errors);
        alert(
          `Erreur lors de l'import Livres: ${result.errors?.join(', ') || 'inconnu'}`
        );
        return;
      }

      if (result.books.length === 0) {
        console.warn('[BooksTab] Aucun livre valide dans le fichier');
        alert('Aucun livre valide trouvé dans le fichier.');
        return;
      }

      const validStatuses = ['in-progress', 'completed', 'to-read', 'abandoned', 'paused'];
      const booksWithValidStatus = result.books.map(book => {
        let normalizedBook = book;
        if (!book.status || !validStatuses.includes(book.status)) {
          normalizedBook = { ...book, status: 'in-progress' };
        }
        if (normalizedBook.coverInline && !normalizedBook.hasCover) {
          normalizedBook.hasCover = true;
        }
        return normalizedBook;
      });

      const newCoverUrls = { ...coverUrls };
      const coverSavePromises = [];
      
      booksWithValidStatus.forEach(book => {
        if (book.coverInline && !newCoverUrls[book.id]) {
          newCoverUrls[book.id] = book.coverInline;
          const blob = dataURLtoBlob(book.coverInline);
          if (blob) {
            coverSavePromises.push(
              saveBookCover(book.id, blob, { 
                name: `cover_${book.id}.${blob.type.split('/')[1] || 'jpg'}` 
              }).catch(() => false)
            );
          }
        }
      });
      
      setCoverUrls(newCoverUrls);
      coverUrlsRef.current = newCoverUrls;

      await Promise.all(coverSavePromises);

      setBooks(booksWithValidStatus);
      
      console.log('[BooksTab] Import réussi:', booksWithValidStatus.length, 'livres');
    } catch (error) {
      console.error('[BooksTab] Erreur import:', error);
      alert('Erreur lors de l\'import. Vérifie la console.');
    } finally {
      setIsImporting(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  }, [books, setBooks, coverUrls, setCoverUrls, coverUrlsRef]);

  return {
    isImporting,
    fileInputRef,
    handleExport,
    handleImportClick,
    handleImportFileChange,
  };
};
