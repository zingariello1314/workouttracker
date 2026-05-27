import { exerciseDatabase } from '../data/exerciseDatabase';

export const MUSCLE_QUERY_SYNONYMS = {
  jambes: ['quadriceps', 'ischio', 'ischios', 'mollets', 'fessiers', 'adducteurs', 'jambes'],
  jambe: ['quadriceps', 'ischio', 'ischios', 'mollets', 'fessiers', 'adducteurs', 'jambes'],
  bras: ['biceps', 'triceps', 'avant-bras', 'deltoides', 'épaules', 'epaule'],
  dos: ['dorsaux', 'grand dorsal', 'trapèzes', 'trapezes', 'rhomboides', 'rhomboïdes'],
  pecs: ['pectoraux', 'poitrine'],
  pectoraux: ['pecs', 'poitrine', 'pectoraux'],
  poitrine: ['pectoraux', 'pecs'],
  abdos: ['abdominaux', 'core', 'gainage', 'obliques'],
  epaules: ['épaules', 'deltoides', 'deltoïdes', 'trapèzes', 'trapezes'],
  épaules: ['epaules', 'deltoides', 'deltoïdes', 'trapèzes', 'trapezes'],
  fessier: ['fessiers', 'glutes', 'jambes'],
  fessiers: ['fessier', 'glutes', 'jambes']
};

export function buildExerciseBankRows(database = exerciseDatabase) {
  const rows = Object.entries(database).map(([key, ex]) => ({
    key,
    name: ex.name || key,
    category: ex.category || '',
    equipment: ex.equipment || '',
    primary: Array.isArray(ex.primaryMuscles) ? ex.primaryMuscles : [],
    secondary: Array.isArray(ex.secondaryMuscles) ? ex.secondaryMuscles : []
  }));
  rows.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  return rows;
}

export function filterExerciseBankRows(rows, query, database = exerciseDatabase) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return rows;
  const expandedTerms = [q, ...(MUSCLE_QUERY_SYNONYMS[q] || [])];
  return rows.filter((row) => {
    const hay = `${row.name} ${row.category} ${row.equipment} ${row.primary.join(' ')} ${row.secondary.join(' ')}`.toLowerCase();
    const variations = Array.isArray(database[row.key]?.variations)
      ? database[row.key].variations.join(' ').toLowerCase()
      : '';
    const searchable = `${hay} ${variations}`;
    return expandedTerms.some((term) => searchable.includes(term));
  });
}
