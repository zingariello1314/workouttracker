/** @typedef {'exercise'|'stretch'|'text'} PathologyItemKind */

/**
 * @param {string} key — clé exerciseDatabase
 * @param {string} [dosage]
 * @param {string} [group]
 */
export function ex(key, dosage = '', group = '') {
  return { kind: 'exercise', key, dosage, group };
}

/**
 * @param {string} key — clé stretchDatabase (incl. mobilité)
 * @param {string} [dosage]
 * @param {string} [group]
 */
export function st(key, dosage = '', group = '') {
  return { kind: 'stretch', key, dosage, group };
}

/** Prescription libre quand aucune entrée banque exacte */
export function tx(text, dosage = '', group = '') {
  return { kind: 'text', text, dosage, group };
}

/**
 * @param {object} fields
 * @returns {object}
 */
export function pathology(fields) {
  return {
    type: 'pathology',
    difficultRecovery: false,
    tags: [],
    ...fields
  };
}

export function guide(fields) {
  return {
    type: 'guide',
    sport: 'prevention',
    ...fields
  };
}
