/**
 * Catalogue de stimulus (force / endurance / poly / charges)
 * et mémoire « un mouvement devient structurel ».
 *
 * Sert la détection. Ne rédige pas tout seul.
 */

import { classifyMovement } from './recapMovementClassification';

function norm(name) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function classifyStimulus(name) {
  const n = norm(name);
  const endurance =
    /endurance|amrap|max[\s-]?reps|pompes \(endurance\)|pompes endurance/.test(n) ||
    (/pompe/.test(n) && /endurance|longue|capillary/.test(n));
  const isolation =
    /extension|curl|elevation|oiseau|fly|ecarte|kickback|face pull|shrug|isolation|mollet isole/.test(
      n
    );
  const weighted =
    /lest|haltere|barre |developpe|presse |kettle|poulie|smith|banc |machine/.test(n);
  const horizontal = /australien|rowing|developpe couche|bench press|pompe/.test(n);
  const vertical =
    !horizontal &&
    /traction|militaire|overhead|dip|elevat|shrug|tirage vertical|pull[- ]?up|chin/.test(n);
  const unilateral =
    /unilateral|unilaterale|alterne|fente|bulgarian|split squat|pistol|un bras|une jambe|single[- ]?arm|single[- ]?leg/.test(
      n
    );
  return {
    endurance,
    isolation,
    compound: !isolation,
    weighted,
    bodyweight: !weighted,
    vertical,
    horizontal,
    unilateral,
    bilateral: !unilateral
  };
}

export function familyOfExercise(id, name) {
  const n = norm(name);
  if (/squat|fente|presse |souleve de terre|hip thrust|mollet|leg curl|leg extension/.test(n)) {
    return 'jambes';
  }
  if (/releve|genou|abdo|planche|gainage|crunch|core|hollow/.test(n)) return 'tronc';
  if (
    (/traction|rowing|australien|tirage|pull[- ]?up|chin/.test(n) || /tirage/.test(n)) &&
    !/dip|pompe|developpe/.test(n)
  ) {
    return 'tirage';
  }
  if (/dip|pompe|developpe|press|push/.test(n)) return 'poussée';
  const c = classifyMovement({ name }, () => name);
  if (c.isLeg) return 'jambes';
  if (c.isPull) return 'tirage';
  if (c.isPush) return 'poussée';
  return 'autre';
}

export function tallyStimulus(measure) {
  const buckets = {
    endurance: 0,
    strength: 0,
    isolation: 0,
    compound: 0,
    weighted: 0,
    bodyweight: 0,
    vertical: 0,
    horizontal: 0,
    unilateral: 0,
    bilateral: 0,
    total: 0
  };
  const byFamily = {};
  (measure?.exercises || []).forEach((e) => {
    const reps = Math.max(0, Math.floor(Number(e.reps) || 0));
    if (reps <= 0) return;
    const s = classifyStimulus(e.name);
    const fam = familyOfExercise(e.id, e.name);
    buckets.total += reps;
    if (s.endurance) buckets.endurance += reps;
    else buckets.strength += reps;
    if (s.isolation) buckets.isolation += reps;
    else buckets.compound += reps;
    if (s.weighted) buckets.weighted += reps;
    else buckets.bodyweight += reps;
    if (s.vertical) buckets.vertical += reps;
    if (s.horizontal) buckets.horizontal += reps;
    if (s.unilateral) buckets.unilateral += reps;
    else buckets.bilateral += reps;
    byFamily[fam] = (byFamily[fam] || 0) + reps;
  });
  return { buckets, byFamily };
}

function share(part, whole) {
  const a = Number(part);
  const b = Number(whole);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= 0) return null;
  return (a / b) * 100;
}

/**
 * Un mouvement « devient structurel » s’il pèse désormais une part réelle
 * d’une famille, alors qu’il était marginal ou absent juste avant.
 */
export function detectStructuralShifts(nowMeasure, thenMeasure, { minNowReps = 48 } = {}) {
  const nowT = tallyStimulus(nowMeasure);
  const thenT = tallyStimulus(thenMeasure);
  const rows = [];
  (nowMeasure?.exercises || []).forEach((e) => {
    if ((e.reps || 0) < minNowReps || (e.days || 0) < 2) return;
    const fam = familyOfExercise(e.id, e.name);
    if (fam === 'autre') return;
    const nowFam = nowT.byFamily[fam] || 0;
    const nowShare = share(e.reps, nowFam);
    if (nowShare == null || nowShare < 12) return;
    const thenEx = thenMeasure?.byExercise?.[e.id];
    const thenReps = thenEx?.reps || 0;
    const thenDays = thenEx?.days || 0;
    const thenFam = thenT.byFamily[fam] || 0;
    const thenShare = thenFam > 0 ? share(thenReps, thenFam) : 0;
    const jumped =
      (thenShare || 0) <= nowShare - 8 ||
      thenDays <= 1 ||
      thenReps < e.reps * 0.4;
    if (!jumped) return;
    rows.push({
      id: e.id,
      name: e.name,
      family: fam,
      nowReps: e.reps,
      nowDays: e.days,
      nowShare,
      thenReps,
      thenDays,
      thenShare: thenShare || 0
    });
  });
  rows.sort((a, b) => b.nowShare - b.thenShare - (a.nowShare - a.thenShare));
  return rows;
}

export function stimulusContrast(nowBuckets, thenBuckets) {
  if (!nowBuckets || nowBuckets.total < 80) return null;
  const pct = (key) => share(nowBuckets[key], nowBuckets.total);
  const thenPct = (key) =>
    thenBuckets?.total >= 80 ? share(thenBuckets[key], thenBuckets.total) : null;
  return {
    endurance: pct('endurance'),
    strength: pct('strength'),
    isolation: pct('isolation'),
    compound: pct('compound'),
    weighted: pct('weighted'),
    bodyweight: pct('bodyweight'),
    thenEndurance: thenPct('endurance'),
    thenIsolation: thenPct('isolation'),
    thenWeighted: thenPct('weighted'),
    vertical: pct('vertical'),
    horizontal: pct('horizontal'),
    unilateral: pct('unilateral'),
    thenVertical: thenPct('vertical'),
    thenHorizontal: thenPct('horizontal')
  };
}

/**
 * Un mouvement qui pesait une part réelle d'une famille et qui s'efface.
 * Type : « 18 % de la poussée → 4 % ».
 */
export function detectFamilyFades(nowMeasure, thenMeasure, { minThenReps = 40 } = {}) {
  const nowT = tallyStimulus(nowMeasure);
  const thenT = tallyStimulus(thenMeasure);
  const rows = [];
  (thenMeasure?.exercises || []).forEach((e) => {
    if ((e.reps || 0) < minThenReps) return;
    const fam = familyOfExercise(e.id, e.name);
    if (fam === 'autre') return;
    const thenFam = thenT.byFamily[fam] || 0;
    const thenShare = share(e.reps, thenFam);
    if (thenShare == null || thenShare < 12) return;
    const nowEx = nowMeasure?.byExercise?.[e.id];
    const nowReps = nowEx?.reps || 0;
    const nowFam = nowT.byFamily[fam] || 0;
    const nowShare = nowFam > 0 ? share(nowReps, nowFam) : 0;
    if ((nowShare || 0) >= 10) return;
    if (thenShare - (nowShare || 0) < 10) return;
    rows.push({
      id: e.id,
      name: e.name,
      family: fam,
      thenReps: e.reps,
      thenShare,
      nowReps,
      nowShare: nowShare || 0
    });
  });
  rows.sort((a, b) => b.thenShare - a.thenShare);
  return rows;
}
