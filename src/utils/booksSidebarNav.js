/**
 * Navigation profonde depuis la sidebar vers l’onglet Livres (réutilisable).
 */

export const BOOKS_OPEN_NAV_EVENT = 'books-open-nav-params';

/**
 * @param {Function} setActiveTab - ex. depuis useWorkout()
 * @param {Record<string, unknown>} params - stocké dans sessionStorage `nav_params_books`
 */
export function openBooksWithNavParams(setActiveTab, params) {
  try {
    sessionStorage.setItem('nav_params_books', JSON.stringify(params));
  } catch {
    /* ignore */
  }
  try {
    window.dispatchEvent(new CustomEvent(BOOKS_OPEN_NAV_EVENT));
  } catch {
    /* ignore */
  }
  setActiveTab?.('books');
}
