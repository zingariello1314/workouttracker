/**
 * Banque d'exercices GTG (alignée sur exerciseDatabase / onglet Banque).
 * @module services/endurance/gtgExerciseBank
 */

import { exerciseDatabase } from '../../data/exerciseDatabase';

export const GTG_BUILTIN_IDS = ['pullups', 'dips', 'pushups'];

const FUNDAMENTAL_KEY_HINTS = [
  'pompes',
  'dips',
  'tractions pronation',
  'tractions supination',
  'tractions australiennes'
];

const FUNDAMENTAL_NAME = /traction|pull[- ]?up|chin[- ]?up|dip|répulsion|pompe|push[- ]?up/i;

export function makeGtgDbExerciseId(bankKey) {
  return `db_${String(bankKey)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase()}`;
}

export function isGtgFundamentalBankEntry(bankKey, ex = {}) {
  const k = String(bankKey || '').toLowerCase();
  if (FUNDAMENTAL_KEY_HINTS.some((h) => k === h || k.includes(h))) return true;
  const name = String(ex.name || bankKey || '');
  return FUNDAMENTAL_NAME.test(name);
}

/** Exercices de la banque adaptés au GTG (poids du corps / barre fixe / parallèles). */
export function listGtgBankExercises() {
  return Object.entries(exerciseDatabase)
    .map(([bankKey, ex]) => {
      const equipment = String(ex.equipment || '').toLowerCase();
      const bodyweight =
        equipment.includes('poids du corps') ||
        equipment.includes('barre de traction') ||
        equipment.includes('parallèle') ||
        equipment.includes('barres parallèles');
      if (!bodyweight && !isGtgFundamentalBankEntry(bankKey, ex)) return null;
      return {
        bankKey,
        id: makeGtgDbExerciseId(bankKey),
        name: ex.name || bankKey,
        category: ex.category || '',
        equipment: ex.equipment || '',
        isFundamental: isGtgFundamentalBankEntry(bankKey, ex)
      };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.isFundamental !== b.isFundamental) return a.isFundamental ? -1 : 1;
      return a.name.localeCompare(b.name, 'fr');
    });
}

export function findBankExerciseById(exerciseId) {
  const id = String(exerciseId || '');
  if (!id.startsWith('db_')) return null;
  return listGtgBankExercises().find((e) => e.id === id) || null;
}

export function matchBuiltinGtgIdForName(name) {
  const n = String(name || '').toLowerCase();
  if (/traction|pull[- ]?up|chin[- ]?up|tirage vertical/i.test(n)) return 'pullups';
  if (/dip|répulsion/i.test(n)) return 'dips';
  if (/pompe|push[- ]?up/i.test(n)) return 'pushups';
  return null;
}
