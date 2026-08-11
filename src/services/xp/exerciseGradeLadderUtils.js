import { EXERCISE_GRADE_LADDER } from './exerciseGradeLadder';

export const EXERCISE_MATERIAL_ORDER = ['wood', 'bronze', 'silver', 'gold', 'platinum'];

const MATERIAL_LABEL_FR = {
  wood: 'Bois',
  bronze: 'Bronze',
  silver: 'Argent',
  gold: 'Or',
  platinum: 'Platine'
};

export function exerciseMaterialLabelFr(material) {
  return MATERIAL_LABEL_FR[material] || material;
}

export function tiersForMaterial(material) {
  return EXERCISE_GRADE_LADDER.filter((g) => g.material === material);
}

export function tierRomanFromSortIndex(sortIndex) {
  const i = Math.max(0, Math.floor(Number(sortIndex) || 0));
  return ['I', 'II', 'III'][i % 3] || 'I';
}

export function groupRowsByMaterialAndTier(rows) {
  /** @type {Record<string, { I: object[], II: object[], III: object[] }>} */
  const byMaterial = {};
  EXERCISE_MATERIAL_ORDER.forEach((m) => {
    byMaterial[m] = { I: [], II: [], III: [] };
  });
  (rows || []).forEach((row) => {
    const material = row.grade?.material;
    if (!material || !byMaterial[material]) return;
    const roman = tierRomanFromSortIndex(row.grade.sortIndex ?? 0);
    byMaterial[material][roman].push(row);
  });
  return byMaterial;
}

export function formatExerciseListShort(rows, max = 5) {
  if (!rows?.length) return '';
  const names = rows.map((r) => r.label).filter(Boolean);
  const head = names.slice(0, max);
  const rest = names.length - head.length;
  let s = head.join(', ');
  if (rest > 0) s += ` +${rest}`;
  return s;
}

export function heroGradeIdForMaterial(material, rows) {
  const tiers = tiersForMaterial(material);
  const grouped = groupRowsByMaterialAndTier(rows)[material];
  let best = tiers[0]?.id;
  ['III', 'II', 'I'].forEach((roman) => {
    if (grouped?.[roman]?.length) {
      const tierRow = tiers.find((t) => t.label.endsWith(roman));
      if (tierRow) best = tierRow.id;
    }
  });
  const userMax = rows
    .filter((r) => r.grade?.material === material)
    .reduce((m, r) => Math.max(m, r.grade?.sortIndex ?? -1), -1);
  if (userMax >= 0) {
    const match = EXERCISE_GRADE_LADDER.find((g) => g.sortIndex === userMax);
    if (match) return match.id;
  }
  return best || tiers[0]?.id;
}
