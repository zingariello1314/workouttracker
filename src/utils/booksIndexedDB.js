// Compat : API historique — délègue à `services/books` (gateway + repository Phase 1).

import { openBooksDb } from '../services/books/booksDbGateway.js';
import { createBooksRepository } from '../services/books/createBooksRepository.js';

/** @deprecated préférer `openBooksDb` depuis `services/books/booksDbGateway` */
export const openBooksDB = openBooksDb;

let _repo;
function getRepo() {
  if (!_repo) _repo = createBooksRepository('local');
  return _repo;
}

/**
 * Récupère tous les livres depuis IndexedDB.
 * Ne propage pas d’erreur vers l’appelant.
 */
export const getAllBooksFromIndexedDB = async () => {
  try {
    return await getRepo().loadAll();
  } catch {
    return [];
  }
};

/**
 * Merge intelligent puis persistance — même contrat qu’avant.
 */
export const saveBooksToIndexedDB = async (books) => {
  try {
    return await getRepo().saveMerged(books);
  } catch {
    return false;
  }
};
