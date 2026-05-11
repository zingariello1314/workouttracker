/**
 * Harmonise tous les fins de ligne courants vers \n (textarea Windows = \r\n, vieux Mac = \r, copier-coller = U+2028/U+2029).
 * Sinon `includes('\\n')` échoue et le texte passe en auto-split → 6 lignes au lieu des 3 saisies.
 */
export function normalizeQuoteLineBreaks(value) {
  if (value == null || typeof value !== 'string') return '';
  return value
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\u2028/g, '\n')
    .replace(/\u2029/g, '\n');
}
