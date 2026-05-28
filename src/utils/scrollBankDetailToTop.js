/** Remonte la fenêtre et le conteneur scroll principal (onglet Exercices). */
export function scrollBankDetailToTop() {
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }
  if (typeof document !== 'undefined') {
    const main = document.querySelector('main');
    if (main) main.scrollTop = 0;
  }
}
