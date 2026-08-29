/** Catégories de chrono : cube entier, morceaux, ou méthode + étape. */

export const DEFAULT_TIMER_CATEGORY = 'full';

export const GOAL_CATEGORIES = [
  { id: 'goal:white_cross', label: 'Croix blanche', hint: 'Quatre arêtes blanches alignées aux centres.' },
  { id: 'goal:white_face', label: 'Face blanche', hint: 'La face blanche complète, même si les côtés ne sont pas encore une couche.' },
  { id: 'goal:first_layer', label: 'Première couche', hint: 'Face blanche + côtés alignés (vraie couche).' },
  { id: 'goal:two_faces', label: 'Deux faces', hint: 'Deux faces terminées (souvent blanc + une latérale).' },
  { id: 'goal:two_layers', label: 'Deux premières couches', hint: 'Croix + F2L / 1re + 2e couronne.' },
  { id: 'goal:last_layer', label: 'Dernière couche', hint: 'Seulement le haut, le reste déjà fait.' }
];

export const METHOD_STAGE_CATEGORIES = {
  lbl: {
    name: 'Couches (débutant)',
    stages: [
      { id: 'full', label: 'Méthode entière' },
      { id: 'daisy', label: 'Marguerite' },
      { id: 'white_cross', label: 'Croix blanche' },
      { id: 'white_corners', label: 'Coins blancs' },
      { id: 'second_layer', label: 'Deuxième couronne' },
      { id: 'yellow_cross', label: 'Croix jaune' },
      { id: 'yellow_corners_orient', label: 'Orienter les coins jaunes' },
      { id: 'yellow_corners_perm', label: 'Placer les coins jaunes' },
      { id: 'yellow_edges', label: 'Placer les arêtes jaunes' }
    ]
  },
  cfop: {
    name: 'CFOP',
    stages: [
      { id: 'full', label: 'Solve complète' },
      { id: 'cross', label: 'Cross' },
      { id: 'f2l_pair', label: 'Une paire F2L' },
      { id: 'f2l', label: 'F2L (4 paires)' },
      { id: 'oll', label: 'OLL' },
      { id: 'pll', label: 'PLL' },
      { id: 'oll_2look', label: '2-look OLL' },
      { id: 'pll_2look', label: '2-look PLL' }
    ]
  },
  roux: {
    name: 'Roux',
    stages: [
      { id: 'full', label: 'Solve complète' },
      { id: 'first_block', label: 'Premier bloc 1×2×3' },
      { id: 'second_block', label: 'Second bloc' },
      { id: 'cmll', label: 'CMLL' },
      { id: 'lse', label: 'LSE (6 arêtes)' }
    ]
  },
  zz: {
    name: 'ZZ',
    stages: [
      { id: 'full', label: 'Solve complète' },
      { id: 'eo', label: 'EO' },
      { id: 'eoline', label: 'EOLine' },
      { id: 'f2l', label: 'Blocs <R, U, L>' },
      { id: 'last_layer', label: 'Dernière couche' },
      { id: 'zbll', label: 'ZBLL' }
    ]
  },
  petrus: {
    name: 'Petrus',
    stages: [
      { id: 'full', label: 'Solve complète' },
      { id: '222', label: 'Bloc 2×2×2' },
      { id: '223', label: 'Bloc 2×2×3' },
      { id: 'eo', label: 'EO' },
      { id: 'finish', label: 'Fin (2 couches + LL)' }
    ]
  }
};

export function methodCategoryId(methodId, stageId) {
  return `method:${methodId}:${stageId}`;
}

export function parseCategoryId(id) {
  const raw = String(id || DEFAULT_TIMER_CATEGORY);
  if (raw === 'full') return { kind: 'full' };
  if (raw.startsWith('goal:')) return { kind: 'goal', goalId: raw };
  if (raw.startsWith('custom:')) return { kind: 'custom', note: raw.slice(7) };
  if (raw.startsWith('method:')) {
    const rest = raw.slice(7);
    const split = rest.indexOf(':');
    if (split === -1) return { kind: 'full' };
    return { kind: 'method', methodId: rest.slice(0, split), stageId: rest.slice(split + 1) };
  }
  return { kind: 'full' };
}

export function isKnownCategoryId(id) {
  const p = parseCategoryId(id);
  if (p.kind === 'full') return id === 'full' || !id;
  if (p.kind === 'goal') return GOAL_CATEGORIES.some((g) => g.id === p.goalId);
  if (p.kind === 'custom') return Boolean(p.note);
  if (p.kind === 'method') {
    const m = METHOD_STAGE_CATEGORIES[p.methodId];
    return Boolean(m && m.stages.some((s) => s.id === p.stageId));
  }
  return false;
}

export function formatCategoryLabel(id) {
  const p = parseCategoryId(id);
  if (p.kind === 'full') return 'Cube entier';
  if (p.kind === 'goal') {
    return GOAL_CATEGORIES.find((g) => g.id === p.goalId)?.label || 'Morceau';
  }
  if (p.kind === 'custom') return p.note || 'Perso';
  if (p.kind === 'method') {
    const m = METHOD_STAGE_CATEGORIES[p.methodId];
    if (!m) return 'Méthode';
    const st = m.stages.find((s) => s.id === p.stageId);
    return st ? `${m.name} · ${st.label}` : m.name;
  }
  return 'Cube entier';
}

export function categoryGroup(id) {
  const p = parseCategoryId(id);
  if (p.kind === 'goal' || p.kind === 'custom') return 'piece';
  if (p.kind === 'method') return 'method';
  return 'full';
}

export function timesForCategory(times, categoryId) {
  if (!categoryId || categoryId === 'all') return times || [];
  return (times || []).filter((row) => (row.categoryId || DEFAULT_TIMER_CATEGORY) === categoryId);
}

export function usedCategoryIds(times) {
  const set = new Set();
  (times || []).forEach((row) => {
    set.add(row.categoryId || DEFAULT_TIMER_CATEGORY);
  });
  return [...set];
}

export function customCategoryId(note) {
  const trimmed = String(note || '').trim().slice(0, 80);
  return trimmed ? `custom:${trimmed}` : DEFAULT_TIMER_CATEGORY;
}
