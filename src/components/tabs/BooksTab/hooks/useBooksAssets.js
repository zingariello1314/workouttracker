/**
 * Hook pour la gestion des assets (PDF, couvertures) des livres
 * 
 * ✅ PHASE 4 : Extraction de la logique des assets
 * 
 * @module components/tabs/BooksTab/hooks/useBooksAssets
 */

import { useRef, useCallback } from 'react';
import { saveBookPdf, deleteBookPdf, saveBookCover, deleteBookCover, getBookCover } from '../../../../utils/booksAssetsStorage';
import { readFileAsDataUrl } from '../utils';

/**
 * Hook pour gérer les assets (PDF, couvertures) des livres
 * 
 * @param {Array} books - Liste de tous les livres
 * @param {Function} setBooks - Fonction pour mettre à jour les livres
 * @param {Object} selectedBook - Livre sélectionné
 * @param {Object} coverUrls - Objet des URLs de couvertures
 * @param {Function} setCoverUrls - Fonction pour mettre à jour les URLs de couvertures
 * @param {Object} coverUrlsRef - Ref pour les URLs de couvertures
 * @returns {Object} { pdfInputRef, coverInputRef, handleAttachPdfClick, handlePdfFileChange, handleAttachCoverClick, handleCoverFileChange, handleRemoveCover, handleViewCover, handleRemovePdf }
 */
export const useBooksAssets = (books = [], setBooks, selectedBook, coverUrls, setCoverUrls, coverUrlsRef) => {
  const pdfInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const handleAttachPdfClick = useCallback(() => {
    if (!selectedBook || !pdfInputRef.current) return;
    pdfInputRef.current.value = '';
    pdfInputRef.current.click();
  }, [selectedBook]);

  const handlePdfFileChange = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file || !selectedBook) return;

    const pdfId = `pdf_${selectedBook.id}`;
    const ok = await saveBookPdf(pdfId, file);
    if (!ok) {
      alert("Erreur lors de l'enregistrement du PDF du livre.");
      return;
    }

    setBooks((prev) =>
      prev.map((book) =>
        book.id === selectedBook.id
          ? { ...book, hasPdf: true }
          : book
      )
    );
  }, [selectedBook, setBooks]);

  const handleAttachCoverClick = useCallback(() => {
    if (!selectedBook || !coverInputRef.current) return;
    coverInputRef.current.value = '';
    coverInputRef.current.click();
  }, [selectedBook]);

  const handleCoverFileChange = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file || !selectedBook) return;

    const inlineDataUrl = await readFileAsDataUrl(file);

    setBooks((prev) =>
      prev.map((book) =>
        book.id === selectedBook.id
          ? {
              ...book,
              hasCover: true,
              coverInline: inlineDataUrl || book.coverInline || null,
            }
          : book
      )
    );

    const localUrl = URL.createObjectURL(file);
    setCoverUrls((prev) => {
      const existing = prev[selectedBook.id];
      if (existing) {
        URL.revokeObjectURL(existing);
      }
      const next = { ...prev, [selectedBook.id]: localUrl };
      coverUrlsRef.current = next;
      return next;
    });

    const coverId = `cover_${selectedBook.id}`;
    const ok = await saveBookCover(coverId, file, { name: file.name || null });

    if (!ok && inlineDataUrl) {
      alert(
        "IndexedDB ne permet pas de stocker cette couverture (quota ou compatibilité). " +
          'Une version intégrée sera utilisée pour la persistance dans tes sauvegardes.'
      );
    } else if (!ok) {
      alert(
        "Erreur lors de l'enregistrement de la couverture du livre. Tu peux réessayer avec une image plus légère."
      );
    }
  }, [selectedBook, setBooks, setCoverUrls, coverUrlsRef]);

  const handleRemoveCover = useCallback(async () => {
    if (!selectedBook) return;
    const coverId = `cover_${selectedBook.id}`;

    const ok = await deleteBookCover(coverId);
    if (!ok) {
      alert('Erreur lors de la suppression de la couverture.');
      return;
    }

    setBooks((prev) =>
      prev.map((book) =>
        book.id === selectedBook.id
          ? { ...book, hasCover: false, coverInline: null }
          : book
      )
    );

    setCoverUrls((prev) => {
      const existing = prev[selectedBook.id];
      if (existing) {
        try {
          if (existing.startsWith('blob:')) {
            URL.revokeObjectURL(existing);
          }
        } catch {
          // ignore
        }
      }
      const next = { ...prev };
      delete next[selectedBook.id];
      coverUrlsRef.current = next;
      return next;
    });
  }, [selectedBook, setBooks, setCoverUrls, coverUrlsRef]);

  const handleViewCover = useCallback(async () => {
    if (!selectedBook) return;

    const cachedUrl = coverUrls[selectedBook.id];
    if (cachedUrl) {
      try {
        window.open(cachedUrl, '_blank', 'noopener');
        return;
      } catch {
        // on tente alors la voie IndexedDB ci‑dessous
      }
    }

    const coverId = `cover_${selectedBook.id}`;
    const record = await getBookCover(coverId);
    if (!record || !record.blob) {
      alert('Aucune couverture trouvée pour ce livre.');
      return;
    }

    try {
      const url = URL.createObjectURL(record.blob);
      window.open(url, '_blank', 'noopener');
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 60_000);
    } catch {
      alert('Impossible dafficher la couverture.');
    }
  }, [selectedBook, coverUrls]);

  const handleRemovePdf = useCallback(async () => {
    if (!selectedBook) return;
    const pdfId = `pdf_${selectedBook.id}`;

    const ok = await deleteBookPdf(pdfId);
    if (!ok) {
      alert('Erreur lors de la suppression du PDF.');
      return;
    }

    setBooks((prev) =>
      prev.map((book) =>
        book.id === selectedBook.id
          ? { ...book, hasPdf: false }
          : book
      )
    );
  }, [selectedBook, setBooks]);

  return {
    pdfInputRef,
    coverInputRef,
    handleAttachPdfClick,
    handlePdfFileChange,
    handleAttachCoverClick,
    handleCoverFileChange,
    handleRemoveCover,
    handleViewCover,
    handleRemovePdf,
  };
};
