/**
 * Hook pour la gestion des couvertures de livres
 * 
 * ✅ PHASE 4 : Extraction de la logique des couvertures
 * 
 * @module components/tabs/BooksTab/hooks/useBooksCovers
 */

import { useState, useEffect, useRef } from 'react';
import { getBookCover } from '../../../../utils/booksAssetsStorage';

/**
 * Hook pour gérer les couvertures des livres
 * 
 * @param {Array} books - Liste de tous les livres
 * @param {boolean} show3D - Si la vue 3D est activée
 * @returns {Object} { coverUrls, setCoverUrls, coverUrlsRef }
 */
export const useBooksCovers = (books = [], show3D = true) => {
  const [coverUrls, setCoverUrls] = useState({});
  const coverUrlsRef = useRef({});

  useEffect(() => {
    let cancelled = false;

    const loadInlineCovers = () => {
      const newCoverUrls = { ...coverUrlsRef.current };
      let hasChanges = false;
      
      books.forEach((book) => {
        if (book.coverInline && !newCoverUrls[book.id]) {
          newCoverUrls[book.id] = book.coverInline;
          hasChanges = true;
        }
      });
      
      if (hasChanges) {
        coverUrlsRef.current = newCoverUrls;
        setCoverUrls(newCoverUrls);
      }
    };

    loadInlineCovers();

    const loadCoversFromIndexedDB = async () => {
      const toLoad = books.filter((book) => {
        return !coverUrlsRef.current[book.id] && book.hasCover;
      });
      
      if (toLoad.length === 0) return;
      
      const BATCH_SIZE = 8;
      const batches = [];
      for (let i = 0; i < toLoad.length; i += BATCH_SIZE) {
        batches.push(toLoad.slice(i, i + BATCH_SIZE));
      }
      
      for (const batch of batches) {
        if (cancelled) return;
        
        const batchResults = await Promise.allSettled(
          batch.map(async (book) => {
            try {
              const record = await getBookCover(`cover_${book.id}`);
              if (!record || !record.blob) return null;
              
              const objectUrl = URL.createObjectURL(record.blob);
              if (cancelled) {
                URL.revokeObjectURL(objectUrl);
                return null;
              }
              
              return { bookId: book.id, src: objectUrl };
            } catch {
              return null;
            }
          })
        );
        
        if (cancelled) return;
        
        const newCoverUrls = { ...coverUrlsRef.current };
        let hasChanges = false;
        
        batchResults.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            const { bookId, src } = result.value;
            const existing = newCoverUrls[bookId];
            
            if (existing && existing.startsWith('blob:')) {
              try {
                URL.revokeObjectURL(existing);
              } catch {
                // ignore
              }
            }
            
            newCoverUrls[bookId] = src;
            hasChanges = true;
          }
        });
        
        if (hasChanges) {
          coverUrlsRef.current = newCoverUrls;
          setCoverUrls(newCoverUrls);
        }
        
        if (batches.indexOf(batch) < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    };

    if (books && books.length > 0) {
      loadCoversFromIndexedDB();
    }

    return () => {
      cancelled = true;
      Object.values(coverUrlsRef.current).forEach((url) => {
        if (url && typeof url === 'string' && url.startsWith('blob:')) {
          try {
            URL.revokeObjectURL(url);
          } catch {
            // ignore
          }
        }
      });
    };
  }, [books, show3D]);

  useEffect(
    () => () => {
      Object.values(coverUrlsRef.current || {}).forEach((url) => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // ignore
        }
      });
    },
    []
  );

  return {
    coverUrls,
    setCoverUrls,
    coverUrlsRef,
  };
};
