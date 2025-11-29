/**
 * correlationAnalysis.js
 *
 * Module utilitaire générique pour la corrélation V2.
 * On centralise ici un calcul de Pearson réutilisable et une
 * création de "matrice" légère si on veut aller plus loin plus tard.
 *
 * Toutes les fonctions sont pures et ne dépendent d’aucun hook React.
 */

/**
 * Calcule le coefficient de corrélation de Pearson entre deux séries.
 * @param {Array<number>} x
 * @param {Array<number>} y
 * @returns {number|null}
 */
export function computePearsonCorrelation(x, y) {
  if (!Array.isArray(x) || !Array.isArray(y) || x.length !== y.length) {
    return null;
  }

  const pairs = x
    .map((xi, i) => ({ x: xi, y: y[i] }))
    .filter(
      (p) =>
        typeof p.x === 'number' &&
        typeof p.y === 'number' &&
        !Number.isNaN(p.x) &&
        !Number.isNaN(p.y),
    );

  if (pairs.length < 2) return null;

  const n = pairs.length;
  const sumX = pairs.reduce((s, p) => s + p.x, 0);
  const sumY = pairs.reduce((s, p) => s + p.y, 0);
  const sumXY = pairs.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = pairs.reduce((s, p) => s + p.x * p.x, 0);
  const sumY2 = pairs.reduce((s, p) => s + p.y * p.y, 0);

  const num = n * sumXY - sumX * sumY;
  const den = Math.sqrt(
    (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY),
  );

  if (!den) return null;
  return num / den;
}

/**
 * Construit une "matrice" de corrélation très simple à partir d’un
 * objet { clé: tableauDeValeurs }.
 *
 * @param {Object<string,Array<number>>} seriesByKey
 * @returns {Object<string,Record<string,number|null>>}
 */
export function buildCorrelationMatrix(seriesByKey) {
  const keys = Object.keys(seriesByKey || {});
  const matrix = {};

  for (let i = 0; i < keys.length; i += 1) {
    const keyI = keys[i];
    matrix[keyI] = {};
    for (let j = 0; j < keys.length; j += 1) {
      const keyJ = keys[j];
      if (i === j) {
        matrix[keyI][keyJ] = 1;
      } else {
        matrix[keyI][keyJ] = computePearsonCorrelation(
          seriesByKey[keyI],
          seriesByKey[keyJ],
        );
      }
    }
  }

  return matrix;
}



