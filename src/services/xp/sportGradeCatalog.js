/**
 * Grades, paliers (I/II/III), emblèmes et frontières de grade.
 * @see docs/sport/GRADES_SPORT_REFONTE.md
 */

import { cumulXpForLevel } from './sportLevelCurve';

/** Clés stables pour i18n : sport.grades.{id} */
export const SPORT_GRADE_IDS = [
  'novice',
  'adepte',
  'disciple',
  'athlete',
  'champion',
  'elite',
  'maitre',
  'grand_maitre',
  'olympien',
  'parangon'
];

/** Paliers affichés : « Palier I / II / III » (équivalent 1re / 2e / 3e division). */
export const SPORT_TIER_ROMAN = { 1: 'I', 2: 'II', 3: 'III' };

/** Lucide icon names — importées dans le composant UI. */
export const SPORT_GRADE_EMBLEM = {
  novice: 'Sprout',
  adepte: 'TrendingUp',
  disciple: 'Target',
  athlete: 'Dumbbell',
  champion: 'Trophy',
  elite: 'Star',
  maitre: 'Crown',
  grand_maitre: 'Gem',
  olympien: 'Flame',
  parangon: 'Sparkles'
};

export const SPORT_GRADE_ACCENT = {
  novice: '#94a3b8',
  adepte: '#2dd4bf',
  disciple: '#38bdf8',
  athlete: '#34d399',
  champion: '#fbbf24',
  elite: '#a78bfa',
  maitre: '#f472b6',
  grand_maitre: '#fb923c',
  olympien: '#ef4444',
  parangon: '#fde047'
};

/**
 * Illustrations pixel-art (public/sport-grades/{id}.png).
 * Ajouter une entrée dès qu’un fichier est disponible.
 */
export const SPORT_GRADE_ART = {
  novice: '/sport-grades/novice.png',
  champion: '/sport-grades/champion.png',
  olympien: '/sport-grades/olympien.png',
  parangon: '/sport-grades/parangon.png'
};

/** Point de focus object-cover (grades au format portrait / scène). */
export const SPORT_GRADE_ART_FOCUS = {
  novice: 'center 20%',
  champion: 'center 22%',
  olympien: 'center 18%',
  parangon: 'center 12%'
};

export function hasSportGradeArt(gradeId) {
  return Boolean(gradeId && SPORT_GRADE_ART[gradeId]);
}

export function sportGradeArtUrl(gradeId) {
  return SPORT_GRADE_ART[gradeId] || null;
}

export function sportGradeArtObjectPosition(gradeId) {
  return SPORT_GRADE_ART_FOCUS[gradeId] || 'center 15%';
}

/** Tier rows: cumul XP = seuil niveau minimal pour ce palier d'affichage. */
export const SPORT_GRADE_TIER_ROWS = [
  { gradeId: 'novice', tier: 1, levelMin: 1, cumulXp: 0 },
  { gradeId: 'novice', tier: 2, levelMin: 3, cumulXp: 1030 },
  { gradeId: 'novice', tier: 3, levelMin: 5, cumulXp: 2180 },
  { gradeId: 'adepte', tier: 1, levelMin: 7, cumulXp: 3450 },
  { gradeId: 'adepte', tier: 2, levelMin: 10, cumulXp: 5580 },
  { gradeId: 'adepte', tier: 3, levelMin: 12, cumulXp: 7150 },
  { gradeId: 'disciple', tier: 1, levelMin: 15, cumulXp: 9730 },
  { gradeId: 'disciple', tier: 2, levelMin: 18, cumulXp: 12580 },
  { gradeId: 'disciple', tier: 3, levelMin: 21, cumulXp: 15700 },
  { gradeId: 'athlete', tier: 1, levelMin: 25, cumulXp: 20280 },
  { gradeId: 'athlete', tier: 2, levelMin: 29, cumulXp: 25340 },
  { gradeId: 'athlete', tier: 3, levelMin: 33, cumulXp: 30880 },
  { gradeId: 'champion', tier: 1, levelMin: 37, cumulXp: 36900 },
  { gradeId: 'champion', tier: 2, levelMin: 42, cumulXp: 45100 },
  { gradeId: 'champion', tier: 3, levelMin: 46, cumulXp: 52200 },
  { gradeId: 'elite', tier: 1, levelMin: 51, cumulXp: 61750 },
  { gradeId: 'elite', tier: 2, levelMin: 57, cumulXp: 74200 },
  { gradeId: 'elite', tier: 3, levelMin: 62, cumulXp: 85400 },
  { gradeId: 'maitre', tier: 1, levelMin: 67, cumulXp: 97350 },
  { gradeId: 'maitre', tier: 2, levelMin: 73, cumulXp: 112680 },
  { gradeId: 'maitre', tier: 3, levelMin: 79, cumulXp: 129090 },
  { gradeId: 'grand_maitre', tier: 1, levelMin: 85, cumulXp: 146580 },
  { gradeId: 'grand_maitre', tier: 2, levelMin: 92, cumulXp: 168350 },
  { gradeId: 'grand_maitre', tier: 3, levelMin: 98, cumulXp: 188180 },
  { gradeId: 'olympien', tier: 1, levelMin: 105, cumulXp: 212680, kmMin: 450 },
  { gradeId: 'olympien', tier: 2, levelMin: 113, cumulXp: 242480, kmMin: 620, sessionsMin: 215 },
  { gradeId: 'olympien', tier: 3, levelMin: 121, cumulXp: 274200, kmMin: 850, kcalMin: 58000 },
  { gradeId: 'parangon', tier: 1, levelMin: 129, cumulXp: 307840, kmMin: 1000 },
  { gradeId: 'parangon', tier: 2, levelMin: 137, cumulXp: 343400, kmMin: 1320, sessionsMin: 270, repsMin: 175000 },
  {
    gradeId: 'parangon',
    tier: 3,
    levelMin: 144,
    cumulXp: 376090,
    kmMin: 1750,
    kcalMin: 75000,
    sessionsMin: 290,
    repsMin: 180000
  }
];

/** Frontière pour entrer dans gradeId (index 0 = adepte …). */
export const SPORT_GRADE_GATES = [
  {
    toGradeId: 'adepte',
    levelMin: 7,
    masteryMin: 3450,
    sessionsMin: 12,
    minutesMin: 15,
    repsMin: 2500,
    kcalMin: 1500
  },
  {
    toGradeId: 'disciple',
    levelMin: 15,
    masteryMin: 9730,
    sessionsMin: 28,
    minutesMin: 18,
    repsMin: 8000,
    kcalMin: 4000
  },
  {
    toGradeId: 'athlete',
    levelMin: 25,
    masteryMin: 20280,
    sessionsMin: 50,
    minutesMin: 20,
    repsMin: 18000,
    kcalMin: 8000
  },
  {
    toGradeId: 'champion',
    levelMin: 37,
    masteryMin: 36900,
    sessionsMin: 75,
    minutesMin: 22,
    repsMin: 35000,
    kcalMin: 14000
  },
  {
    toGradeId: 'elite',
    levelMin: 51,
    masteryMin: 61750,
    sessionsMin: 105,
    minutesMin: 25,
    repsMin: 55000,
    kcalMin: 22000
  },
  {
    toGradeId: 'maitre',
    levelMin: 67,
    masteryMin: 97350,
    sessionsMin: 140,
    minutesMin: 28,
    repsMin: 80000,
    kcalMin: 32000
  },
  {
    toGradeId: 'grand_maitre',
    levelMin: 85,
    masteryMin: 146580,
    sessionsMin: 185,
    minutesMin: 30,
    repsMin: 110000,
    kcalMin: 45000
  },
  {
    toGradeId: 'olympien',
    levelMin: 105,
    masteryMin: 212680,
    sessionsMin: 230,
    minutesMin: 35,
    repsMin: 145000,
    kcalMin: 60000,
    kmMin: 450
  },
  {
    toGradeId: 'parangon',
    levelMin: 129,
    masteryMin: 307840,
    sessionsMin: 280,
    minutesMin: 40,
    repsMin: 185000,
    kcalMin: 78000,
    kmMin: 1000
  }
];

/** Grades dont les paliers exigent niveau + preuves d’activité (pas XP seul). */
export const CONDITIONAL_TIER_GRADE_IDS = new Set(['olympien', 'parangon']);

export function hasConditionalTierRequirements(gradeId) {
  return CONDITIONAL_TIER_GRADE_IDS.has(gradeId);
}

export function progressionTierFromLevel(level) {
  const L = Math.max(1, Math.floor(Number(level) || 1));
  let best = SPORT_GRADE_TIER_ROWS[0];
  for (const row of SPORT_GRADE_TIER_ROWS) {
    if (L >= row.levelMin) best = row;
  }
  return { gradeId: best.gradeId, tier: best.tier, levelMin: best.levelMin, cumulXp: best.cumulXp };
}

export function tierRowsForGrade(gradeId) {
  return SPORT_GRADE_TIER_ROWS.filter((r) => r.gradeId === gradeId);
}

export function gateForGradeId(toGradeId) {
  return SPORT_GRADE_GATES.find((g) => g.toGradeId === toGradeId) || null;
}

export function gradeIndex(gradeId) {
  return SPORT_GRADE_IDS.indexOf(gradeId);
}

/** Max palier atteignable par le niveau seul, à l'intérieur d'un grade. */
export function maxTierInGradeForLevel(gradeId, level) {
  const rows = tierRowsForGrade(gradeId);
  let tier = 1;
  for (const r of rows) {
    if (level >= r.levelMin) tier = r.tier;
  }
  return tier;
}

export function cumulXpForGradeEntry(gradeId) {
  const row = SPORT_GRADE_TIER_ROWS.find((r) => r.gradeId === gradeId && r.tier === 1);
  return row ? row.cumulXp : cumulXpForLevel(1);
}
