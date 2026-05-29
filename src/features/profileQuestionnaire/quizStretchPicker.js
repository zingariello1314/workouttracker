/**
 * Sélection d'étirements banque pour programmes quiz — pool élargi + tirage pondéré.
 * Lit intégralement `stretchDatabase` (aucune entrée retirée) ; exclut seulement
 * les clés du catalogue drills (`stretchDrillsCatalog`) et catégories course/pliométrie.
 */

import { stretchDatabase } from '../../data/stretchDatabase';
import { stretchDrillsCatalog } from '../../data/stretchDrillsCatalog';

const DRILL_KEYS = new Set(Object.keys(stretchDrillsCatalog));
const EXCLUDED_CATEGORIES = new Set(['Drills course', 'Pliométrie']);

const MOMENT_ZONE_BIAS = {
  matin: ['respiration', 'cou', 'épaules', 'thoracique', 'mollets', 'quadriceps'],
  midi: ['hanches', 'dos', 'lombaires', 'poitrine', 'épaules', 'tronc'],
  soir: ['ischios', 'fessiers', 'lombaires', 'dos', 'mollets', 'quadriceps']
};

function seededRng(seedStr) {
  let h = 2166136261;
  const s = String(seedStr);
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function priorityZonesFromQuiz(answers) {
  const zones = new Set();
  const prio = Array.isArray(answers?.priorityMuscleGroups) ? answers.priorityMuscleGroups : [];
  if (prio.includes('upper_body') || prio.some((k) => ['chest', 'back', 'shoulders'].includes(k))) {
    zones.add('épaules');
    zones.add('thoracique');
    zones.add('cou');
  }
  if (prio.includes('lower_body') || prio.some((k) => ['quads', 'hamstrings', 'glutes', 'calves'].includes(k))) {
    zones.add('quadriceps');
    zones.add('ischios');
    zones.add('fessiers');
    zones.add('mollets');
    zones.add('hanches');
  }
  if (prio.includes('cardio')) {
    zones.add('mollets');
    zones.add('quadriceps');
  }
  if (prio.includes('core')) zones.add('tronc');
  if (!zones.size) {
    zones.add('hanches');
    zones.add('dos');
  }
  return zones;
}

function scoreStretchEntry(key, entry, answers, moment) {
  if (!entry || DRILL_KEYS.has(key)) return 0;
  if (EXCLUDED_CATEGORIES.has(entry.category)) return 0;

  let score = 4;
  const zones = priorityZonesFromQuiz(answers);
  const zone = norm(entry.bodyZone);
  if (zones.has(zone)) score += 8;
  (MOMENT_ZONE_BIAS[moment] || []).forEach((z) => {
    if (zone === norm(z)) score += 3;
  });

  const flex = answers?.flexibilityLevel;
  const diff = Number(entry.difficulty) || 2;
  if (flex === 'very_stiff' || flex === 'stiff') {
    if (diff <= 2) score += 4;
    if (diff >= 4) score -= 3;
  } else if (flex === 'very_flexible') {
    if (diff >= 3) score += 2;
  }

  const habit = answers?.stretchingHabit;
  if ((habit === 'never' || habit === 'rarely') && diff <= 2) score += 2;

  const typePrefs = Array.isArray(answers?.exerciseTypePreferences) ? answers.exerciseTypePreferences : [];
  if (typePrefs.includes('mobility_stretching') && String(entry.category || '').includes('Mobilité')) {
    score += 4;
  }

  if (answers?.goalPhysique === 'endurance_lean' && zone === 'mollets') score += 2;
  if (answers?.goalPhysique === 'athletic_performance' && entry.category === 'Mobilité') score += 2;

  const cat = String(entry.category || '');
  if (cat.startsWith('Mobilité')) score += 2;

  return Math.max(1, score);
}

function pickWeightedWithoutReplacement(candidates, count, rng) {
  const pool = [...candidates];
  const picked = [];
  while (picked.length < count && pool.length > 0) {
    const windowSize = Math.min(18, pool.length);
    const slice = pool.slice(0, windowSize);
    const total = slice.reduce((s, c) => s + c.score, 0);
    let r = rng() * total;
    let idx = 0;
    for (let i = 0; i < slice.length; i += 1) {
      r -= slice[i].score;
      if (r <= 0) {
        idx = i;
        break;
      }
    }
    const [chosen] = slice.splice(idx, 1);
    picked.push(chosen);
    const fullIdx = pool.findIndex((p) => p.key === chosen.key);
    if (fullIdx >= 0) pool.splice(fullIdx, 1);
  }
  return picked;
}

/**
 * @param {{ answers: object, moment: string, dayKey: string, count: number, usedKeys: Set<string> }} opts
 */
export function pickQuizStretchesForMoment({ answers, moment, dayKey, count, usedKeys }) {
  const rng = seededRng(`${dayKey}:${moment}:${answers?.goalPhysique || ''}`);
  const candidates = Object.entries(stretchDatabase)
    .map(([key, entry]) => ({
      key,
      entry,
      score: scoreStretchEntry(key, entry, answers, moment)
    }))
    .filter((row) => row.score > 0 && !usedKeys.has(row.key))
    .sort((a, b) => b.score - a.score);

  const picked = pickWeightedWithoutReplacement(candidates, count, rng);
  picked.forEach((p) => usedKeys.add(p.key));
  return picked;
}
