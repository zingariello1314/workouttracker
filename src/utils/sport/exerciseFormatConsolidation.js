/**
 * Parcours P2 expérimental, shadow only.
 * Lit une trajectoire déjà calculée. Ne publie rien, n'écrit aucun registre.
 */

import { buildExerciseTrajectory } from './exerciseTrajectoryAnalysis';
import { buildMetricFact, METRIC_REFERENT, METRIC_UNIT, METRIC_GRANULARITY } from './recapMetricContract';
import { MEMORY_TRANSITION } from './editorialLedgerContract';
import { proposeTemporalPlans } from './recapTemporalStrategy';
import { isHistoricalOrphan } from './historicalOrphanExercises';

export const CONSOLIDATION_STATE = Object.freeze({
  INSUFFICIENT: 'insufficient',
  ISOLATED_RECORD: 'isolated_record',
  INITIAL_PROGRESSION: 'initial_progression',
  CONFIRMATION: 'confirmation',
  CONSOLIDATION: 'consolidation',
  MAINTAINED: 'maintained',
  RESUMED_LEVEL: 'resumed_level',
  FURTHER_PROGRESSION: 'further_progression',
  DECLINE: 'decline',
  LOAD_PROGRESSION: 'load_progression',
  FORMAT_SHIFT: 'format_shift',
  HIGH_VARIABILITY: 'high_variability'
});

const PUBLISHABLE = new Set([
  CONSOLIDATION_STATE.CONSOLIDATION,
  CONSOLIDATION_STATE.RESUMED_LEVEL,
  CONSOLIDATION_STATE.MAINTAINED,
  CONSOLIDATION_STATE.FURTHER_PROGRESSION,
  CONSOLIDATION_STATE.DECLINE,
  CONSOLIDATION_STATE.LOAD_PROGRESSION
]);

function median(nums) {
  const xs = [...nums].filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (!xs.length) return null;
  const mid = Math.floor(xs.length / 2);
  return xs.length % 2 ? xs[mid] : (xs[mid - 1] + xs[mid]) / 2;
}

function daysBetween(a, b) {
  const da = new Date(`${a}T12:00:00`);
  const db = new Date(`${b}T12:00:00`);
  if (Number.isNaN(da.getTime()) || Number.isNaN(db.getTime())) return null;
  return Math.round((db - da) / 86400000);
}

function closeTo(value, center) {
  if (center == null || value == null) return false;
  return Math.abs(value - center) <= Math.max(2, center * 0.12);
}

function terminalRun(sessions, minLength) {
  if (sessions.length < minLength) return [];
  const out = [sessions[sessions.length - 1]];
  for (let i = sessions.length - 2; i >= 0; i -= 1) {
    const center = median(out.map((s) => s.totalReps));
    if (!closeTo(sessions[i].totalReps, center)) break;
    out.unshift(sessions[i]);
  }
  return out.length >= minLength ? out : [];
}

function spread(values) {
  if (values.length < 2) return 0;
  const med = median(values);
  if (!med) return 0;
  const dev = values.reduce((sum, v) => sum + Math.abs(v - med), 0) / values.length;
  return dev / med;
}

function gapInside(sessions) {
  let best = null;
  for (let i = 1; i < sessions.length; i += 1) {
    const gap = daysBetween(sessions[i - 1].date, sessions[i].date);
    if (gap != null && gap >= 21 && (!best || gap > best.days)) {
      best = { days: gap, before: sessions[i - 1].date, after: sessions[i].date };
    }
  }
  return best;
}

function schemeKey(session) {
  if (!session?.setsTrusted) return null;
  return session.schemeLabel || (session.setCount != null ? `${session.setCount}s` : null);
}

/**
 * Qualifie une trajectoire déjà produite. N'ajoute aucun calcul de séries.
 */
export function qualifyFormatConsolidation(trajectory, { period = '30d', window = null } = {}) {
  const sessions = trajectory?.sessions?.lifetime || trajectory?.sessions || [];
  const name = trajectory?.identity?.name || 'cet exercice';
  const exerciseId = trajectory?.identity?.id || null;
  const inWindow = (trajectory?.sessions?.inWindow || sessions).filter((s) =>
    window?.start && window?.end ? s.date >= window.start && s.date <= window.end : true
  );

  const base = {
    experimental: true,
    shadow: true,
    exerciseId,
    exerciseName: name,
    period,
    window: window || trajectory?.windows?.selected || null,
    state: CONSOLIDATION_STATE.INSUFFICIENT,
    publish: false,
    publishReason: 'abstain'
  };

  if (!inWindow.length) {
    return { ...base, limits: ['aucune séance dans la fenêtre'], solidity: 0 };
  }
  if (sessions.length < 4) {
    return { ...base, limits: ['moins de quatre séances comparables'], solidity: 0.2 };
  }

  const totals = sessions.map((s) => s.totalReps);
  const peak = Math.max(...totals);
  const med = median(totals);
  const peakCount = totals.filter((v) => med && v >= med * 1.8).length;
  const repeated = terminalRun(sessions, 3);
  if (peakCount === 1 && peak >= (med || 0) * 1.8 && repeated.length < 3) {
    return {
      ...base,
      state: CONSOLIDATION_STATE.ISOLATED_RECORD,
      limits: ['un sommet isolé n’est pas un niveau reproduit'],
      solidity: 0.35
    };
  }
  if (spread(totals) > 0.35 && repeated.length < 3) {
    return {
      ...base,
      state: CONSOLIDATION_STATE.HIGH_VARIABILITY,
      limits: ['la dispersion de l’historique empêche un niveau habituel'],
      solidity: 0.3
    };
  }

  const established = terminalRun(sessions.slice(0, -1), 3);
  const lastSession = sessions[sessions.length - 1];
  const establishedLevel = established.length
    ? median(established.map((s) => s.totalReps))
    : null;
  if (
    establishedLevel &&
    lastSession &&
    !closeTo(lastSession.totalReps, establishedLevel) &&
    lastSession.totalReps < establishedLevel * 0.75
  ) {
    return {
      ...base,
      state: CONSOLIDATION_STATE.DECLINE,
      level: Math.round(establishedLevel),
      supportCount: established.length,
      publish: true,
      publishReason: 'phenomenon_supported',
      solidity: 0.6,
      limits: ['la dernière séance sort du niveau qui avait été répété']
    };
  }

  const cluster = repeated.length ? repeated : terminalRun(sessions, 2);
  if (cluster.length === 2) {
    return {
      ...base,
      state: CONSOLIDATION_STATE.CONFIRMATION,
      level: Math.round(median(cluster.map((s) => s.totalReps))),
      supportCount: 2,
      limits: ['deux séances proches ne suffisent pas à installer un niveau'],
      solidity: 0.4
    };
  }
  if (cluster.length < 3) {
    const rising =
      totals.length >= 3 && totals[totals.length - 1] > totals[0] && spread(totals) > 0.08;
    return {
      ...base,
      state: rising ? CONSOLIDATION_STATE.INITIAL_PROGRESSION : CONSOLIDATION_STATE.INSUFFICIENT,
      limits: ['le niveau terminal n’est pas encore répété'],
      solidity: 0.35
    };
  }

  const level = Math.round(median(cluster.map((s) => s.totalReps)));
  const before = sessions.slice(0, sessions.length - cluster.length);
  const beforeMed = before.length ? median(before.map((s) => s.totalReps)) : null;
  const beforeInBand = before.length > 0 && before.every((s) => closeTo(s.totalReps, level));
  const schemes = [...new Set(cluster.map(schemeKey).filter(Boolean))];
  if (schemes.length > 1) {
    return {
      ...base,
      state: CONSOLIDATION_STATE.FORMAT_SHIFT,
      level,
      limits: ['les répétitions se ressemblent, le format de séries non'],
      solidity: 0.4
    };
  }

  const weights = cluster.map((s) => s.weight).filter((w) => Number.isFinite(w) && w > 0);
  if (weights.length >= 2 && weights[weights.length - 1] > weights[0] * 1.1) {
    return {
      ...base,
      state: CONSOLIDATION_STATE.LOAD_PROGRESSION,
      level,
      limits: ['les répétitions tiennent, la charge monte : ce n’est pas une simple consolidation de reps'],
      solidity: 0.7,
      publish: true,
      publishReason: 'load_change'
    };
  }

  const gap = gapInside(cluster);
  let state = CONSOLIDATION_STATE.CONFIRMATION;
  if (!before.length && cluster.length >= 3) {
    state = CONSOLIDATION_STATE.MAINTAINED;
  } else if (cluster.length >= 3 && beforeMed != null && !closeTo(beforeMed, level)) {
    state = gap ? CONSOLIDATION_STATE.RESUMED_LEVEL : CONSOLIDATION_STATE.CONSOLIDATION;
  } else if (beforeInBand && cluster.length >= 3) {
    state = CONSOLIDATION_STATE.MAINTAINED;
  } else if (cluster.length === 2) {
    state = CONSOLIDATION_STATE.CONFIRMATION;
  }

  const clusterStart = cluster[0]?.date;
  const afterCluster = sessions.filter(
    (s) => clusterStart && s.date > clusterStart && s.totalReps > level * 1.2
  );
  if (afterCluster.length >= 2 && median(afterCluster.map((s) => s.totalReps)) > level * 1.15) {
    state = CONSOLIDATION_STATE.FURTHER_PROGRESSION;
  }
  const late = cluster[cluster.length - 1];
  if (late && late.totalReps < level * 0.75 && cluster.slice(0, -1).every((s) => closeTo(s.totalReps, level))) {
    state = CONSOLIDATION_STATE.DECLINE;
  }

  const setsKnown = cluster.filter((s) => s.setsTrusted).length;
  const solidity = Math.min(0.9, 0.45 + cluster.length * 0.08 + (setsKnown >= 2 ? 0.1 : 0) + (gap ? 0.05 : 0));
  const limits = [];
  if (setsKnown < 2) limits.push('le détail des séries est incomplet : le niveau porte sur le total de séance');
  if (!weights.length) limits.push('aucune charge enregistrée : rien n’est affirmé sur la charge');

  return {
    ...base,
    state,
    level,
    supportCount: cluster.length,
    gap,
    beforeMed,
    solidity: Math.round(solidity * 100) / 100,
    limits,
    publish: PUBLISHABLE.has(state),
    publishReason: PUBLISHABLE.has(state) ? 'phenomenon_supported' : 'not_yet_a_level',
    events: cluster.map((s) => ({
      date: s.date,
      reps: s.totalReps,
      sets: s.setCount ?? null,
      scheme: s.schemeLabel ?? null,
      weight: Number.isFinite(s.weight) ? s.weight : null
    })),
    metrics: [
      buildMetricFact({
        referent: METRIC_REFERENT.HISTORICAL_HABIT,
        granularity: METRIC_GRANULARITY.PER_SESSION,
        unit: METRIC_UNIT.REPS,
        value: level,
        sampleSize: cluster.length
      })
    ]
  };
}

export function consolidationIdentity(reading) {
  return {
    exerciseId: reading.exerciseId,
    phenomenonId: `format-consolidation:${reading.exerciseId}:${reading.level ?? 'none'}`,
    conclusionId: `format-consolidation:${reading.exerciseId}:${reading.state}:${reading.level ?? 'none'}`
  };
}

export function memoryTransition(previous, reading) {
  if (!previous) return MEMORY_TRANSITION.NEW;
  const sameLevel = previous.level === reading.level && previous.state === reading.state;
  if (sameLevel && previous.supportCount === reading.supportCount) return MEMORY_TRANSITION.UNCHANGED;
  if (sameLevel && reading.supportCount > previous.supportCount) return MEMORY_TRANSITION.CONFIRMED;
  if (previous.state === CONSOLIDATION_STATE.CONSOLIDATION && reading.state === CONSOLIDATION_STATE.DECLINE) {
    return MEMORY_TRANSITION.CONTRADICTED;
  }
  if (previous.level != null && reading.level != null && previous.level !== reading.level) {
    return MEMORY_TRANSITION.REVISED;
  }
  return MEMORY_TRANSITION.REFINED;
}

export function consolidationMechanism(reading, priorShape = null) {
  const before = reading?.beforeMed;
  const level = reading?.level;
  const higher = before != null && level != null && level > before * 1.12;
  const lower = before != null && level != null && level < before * 0.88;
  if (reading?.state === CONSOLIDATION_STATE.LOAD_PROGRESSION) return 'load_variation';
  if (reading?.state === CONSOLIDATION_STATE.FORMAT_SHIFT) return 'format_change';
  if (lower && priorShape && /rise/.test(String(priorShape))) return 'interrupted_progression';
  if (lower && reading?.gap) return 'partial_resume';
  if (lower || reading?.state === CONSOLIDATION_STATE.DECLINE) return 'stabilized_after_drop';
  if (reading?.gap && !higher) return 'resumed_former_level';
  if (reading?.state === CONSOLIDATION_STATE.RESUMED_LEVEL) return 'resumed_former_level';
  if (higher) return 'higher_level_consolidation';
  if (reading?.state === CONSOLIDATION_STATE.MAINTAINED) return 'historical_maintenance';
  return 'historical_maintenance';
}

export function consolidationProse(reading) {
  if (!reading?.publish || reading.state === CONSOLIDATION_STATE.LOAD_PROGRESSION) {
    if (reading?.state === CONSOLIDATION_STATE.LOAD_PROGRESSION) {
      return `${reading.exerciseName} garde un volume de séance autour de ${reading.level} répétitions, pendant que la charge enregistrée monte. Ce n'est pas un niveau de répétitions nouvellement installé.`;
    }
    return null;
  }
  const name = reading.exerciseName;
  const level = reading.level;
  const n = reading.supportCount;
  const inWindow = (reading.claimEvidenceDates || []).length;
  const windowBit = inWindow
    ? `La fenêtre en contient ${inWindow} séance${inWindow > 1 ? 's' : ''}. `
    : 'La fenêtre ne contient pas de nouvelle séance de ce niveau. ';
  const lens = {
    today: 'Dans la séance de cette fenêtre',
    '7d': 'Sur ces 7 jours',
    '30d': 'Au fil des séances de ces 30 jours',
    '3m': 'Sur ce trimestre',
    '6m': 'À travers les phases de ces 6 mois',
    '1y': 'Dans l’historique documenté de cette année',
    '2y': 'Dans l’historique documenté',
    all: 'Dans l’historique documenté'
  }[reading.period] || 'Sur la période demandée';
  const before = reading.beforeMed != null ? Math.round(reading.beforeMed) : null;
  const mechanism = reading.mechanism || consolidationMechanism(reading);
  const referent =
    before != null
      ? `La référence est la médiane des séances qui précèdent ce palier, autour de ${before} répétitions, pas une autre comparaison de la trajectoire. `
      : '';
  const single =
    inWindow < 2 && !['today', '7d'].includes(reading.period)
      ? 'Une seule séance dans cette fenêtre confirme un niveau déjà établi. Elle ne suffit pas à dire que le niveau s’est construit pendant la fenêtre. '
      : '';
  const back = reading.gap
    ? ` L'historique montre ${reading.gap.days} jours sans cette séance, entre le ${reading.gap.before} et le ${reading.gap.after}.`
    : '';
  const support = `Le niveau s'appuie sur ${n} séances de l'historique. ${windowBit}`;
  if (mechanism === 'stabilized_after_drop') {
    return `${lens}, ${name} se stabilise autour de ${level} répétitions, en dessous des ${before} répétitions d'avant. ${support}${referent}Ce n'est pas une progression.${single}${back}`;
  }
  if (mechanism === 'partial_resume') {
    return `${lens}, ${name} revient autour de ${level} répétitions, sans retrouver les ${before} répétitions d'avant. ${support}${referent}La reprise reste incomplète.${single}${back}`;
  }
  if (mechanism === 'interrupted_progression') {
    return `${lens}, la montée de ${name} s'interrompt. Le palier récent est autour de ${level} répétitions, sous les ${before} d'avant. ${support}${referent}${single}${back}`;
  }
  if (mechanism === 'resumed_former_level') {
    return `${lens}, ${name} retrouve un ancien niveau autour de ${level} répétitions. ${support}${referent}Ce n'est pas une performance isolée.${single}${back}`;
  }
  if (mechanism === 'higher_level_consolidation') {
    return `${lens}, ${name} répète un niveau plus haut, autour de ${level} répétitions${before != null ? `, au-dessus des ${before} d'avant` : ''}. ${support}${referent}${single}`;
  }
  if (mechanism === 'historical_maintenance') {
    return `${lens}, ${name} maintient son niveau historique autour de ${level} répétitions. ${support}Une séance de plus ne crée pas un nouveau phénomène.${single}${back}`;
  }
  return `${lens}, ${name} reste autour de ${level} répétitions. ${support}${referent}${single}${back}`;
}

function withWeights(trajectory, snapshot) {
  const sessions = trajectory?.sessions;
  if (!sessions) return trajectory;
  const weights = snapshot?.exerciseWeights || {};
  const id = trajectory.identity?.id;
  const decorate = (list) =>
    (list || []).map((s) => {
      const raw = weights[`${s.date}_${id}`];
      const weight = raw == null || raw === '' ? null : Number(String(raw).replace(',', '.'));
      return { ...s, weight: Number.isFinite(weight) ? weight : null };
    });
  return {
    ...trajectory,
    sessions: {
      ...sessions,
      lifetime: decorate(sessions.lifetime),
      inWindow: decorate(sessions.inWindow)
    }
  };
}

function inWindowSessions(sessions, window) {
  return (sessions || []).filter((s) => !window?.start || (s.date >= window.start && s.date <= window.end));
}

function horizonQuestion(period) {
  return (
    {
      today: 'La séance de cette fenêtre retrouve-t-elle un niveau déjà documenté ?',
      '7d': 'Le niveau a-t-il été retrouvé pendant la semaine ?',
      '30d': 'Le niveau est-il devenu régulièrement reproductible ?',
      '3m': 'Un format s’est-il installé sur ce trimestre ?',
      '6m': 'Comment la performance s’est-elle transformée entre plusieurs blocs ?',
      '1y': 'Que représente ce niveau face aux références historiques fiables ?',
      '2y': 'Que représente ce niveau face aux références historiques fiables ?',
      all: 'Que représente ce niveau face aux références historiques fiables ?'
    }[period] || 'Que montre la fenêtre demandée ?'
  );
}

function splitForHorizon(period, sessions, window) {
  const inside = inWindowSessions(sessions, window);
  const before = (sessions || []).filter((s) => window?.start && s.date < window.start);
  if (period === '7d' || period === 'today') {
    return {
      reference: before,
      observed: inside,
      why: 'La semaine ne juge que ses propres séances. L’historique antérieur sert de référence, pas de nouveauté.',
      population: 'seances_de_la_fenetre'
    };
  }
  if (period === '30d' || period === '3m') {
    const mid = Math.max(1, Math.floor(inside.length / 2));
    return {
      reference: inside.slice(0, mid),
      observed: inside.slice(mid),
      why: 'Début de fenêtre contre fin de fenêtre. Le découpage suit la question de l’horizon.',
      population: 'debut_puis_fin_de_fenetre'
    };
  }
  const third = Math.max(1, Math.floor(inside.length / 3));
  return {
    reference: inside.slice(0, third),
    observed: inside.slice(-third),
    why: 'Premier tiers contre dernier tiers. Aucune découpe n’est choisie parce qu’elle maximise un pourcentage.',
    population: 'premier_tiers_contre_dernier_tiers'
  };
}

function claimDatesFor(period, sessions, window, reading) {
  const inside = inWindowSessions(sessions, window).map((s) => s.date);
  if (period === '7d' || period === 'today') return inside;
  if ((period === '6m' || period === '1y' || period === '2y' || period === 'all') && reading?.gap) {
    const split = splitForHorizon(period, sessions, window);
    return [...new Set([reading.gap.before, reading.gap.after, ...split.observed.map((s) => s.date)])];
  }
  const split = splitForHorizon(period, sessions, window);
  const observed = split.observed.map((s) => s.date);
  // Mission 18 : une reprise (gap.after) dans la fenêtre reste une preuve d’épisode,
  // même si le découpage début/fin de fenêtre la classe hors « observed »
  // (ex. seule séance du 11 nov. → mid=1 → observed vide → no_evidence_in_window à tort).
  const after = reading?.gap?.after ? String(reading.gap.after).slice(0, 10) : null;
  const afterInWindow =
    after &&
    (!window?.start || after >= window.start) &&
    (!window?.end || after <= window.end);
  if (afterInWindow) {
    return [...new Set([...observed, after].filter(Boolean))];
  }
  return observed;
}

function enrichReading(reading, sessions, period, window) {
  const split = splitForHorizon(period, sessions, window);
  const observedReps = split.observed.map((s) => s.totalReps).filter((n) => Number.isFinite(n));
  const forbidden = ['stagnation physiologique', 'proximité de l’échec', 'charge ou RPE non enregistrés'];
  if (reading.state === CONSOLIDATION_STATE.INITIAL_PROGRESSION) forbidden.push('plateau');
  if (
    reading.state === CONSOLIDATION_STATE.CONFIRMATION ||
    reading.state === CONSOLIDATION_STATE.ISOLATED_RECORD
  ) {
    forbidden.push('consolidation durable');
  }
  if (reading.state === CONSOLIDATION_STATE.FORMAT_SHIFT) forbidden.push('même format de séries');
  if (period === '7d' || period === 'today') forbidden.push('installation datée de cette seule fenêtre');
  if ((period === '6m' || period === '1y' || period === '2y' || period === 'all') && !reading.gap) {
    forbidden.push('résistance à une interruption');
  }
  const contradictions = [];
  if ((period === '6m' || period === '1y' || period === '2y' || period === 'all') && !reading.gap) {
    contradictions.push('aucune interruption documentée');
  }
  const schemes = [...new Set(split.observed.map(schemeKey).filter(Boolean))];
  if (schemes.length > 1) contradictions.push('formats de séries différents');
  let next = reading;
  if ((period === '1y' || period === '2y' || period === 'all') && split.reference.length < 2 && reading.publish) {
    next = {
      ...reading,
      publish: false,
      publishReason: 'historical_reference_insufficient',
      limits: [...(reading.limits || []), 'référence historique trop courte pour situer le niveau']
    };
  }
  return {
    ...next,
    claimEvidenceDates: claimDatesFor(period, sessions, window, next),
    comparator: {
      question: horizonQuestion(period),
      selectionRule: 'horizon_question',
      maximizedPercent: false,
      referenceDates: split.reference.map((s) => s.date),
      observedDates: split.observed.map((s) => s.date),
      whyComparable: split.why,
      population: split.population,
      dispersion: Math.round(spread(observedReps) * 100) / 100,
      supportCount: next.supportCount ?? split.observed.length,
      contradictions,
      solidity: next.solidity ?? 0,
      forbiddenConclusions: forbidden
    }
  };
}

function snapshotAsOf(snapshot, asOf) {
  if (!asOf || !snapshot) return snapshot;
  const keep = (key) => key.slice(0, 10) <= asOf;
  const reps = {};
  const checkedExercises = {};
  for (const [key, value] of Object.entries(snapshot.reps || {})) {
    if (keep(key)) reps[key] = value;
  }
  for (const [key, value] of Object.entries(snapshot.checkedExercises || {})) {
    if (keep(key)) checkedExercises[key] = value;
  }
  return { ...snapshot, reps, checkedExercises };
}

function keyedSessions(snapshot) {
  const reps = snapshot?.reps || {};
  const checked = snapshot?.checkedExercises || {};
  const ids = new Set();
  const dates = [];
  for (const key of Object.keys(reps)) {
    if (checked[key] !== true) continue;
    const match = /^(\d{4}-\d{2}-\d{2})_(.+)$/.exec(key);
    if (!match) continue;
    ids.add(match[2]);
    dates.push(match[1]);
  }
  return { ids: [...ids], dates };
}

/**
 * Rejeu explicite. Ne modifie pas le snapshot ni un registre persistant.
 */
export function runExerciseFormatConsolidationShadow({
  snapshot: snapshotIn,
  window,
  period = '30d',
  getExerciseNameById = null,
  priorLedger = null,
  asOf = null,
  programChanges = null,
  computeScope = null
} = {}) {
  const t0 = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
  const snapshot = snapshotAsOf(snapshotIn, asOf);
  const ledgerIn = priorLedger && typeof priorLedger === 'object' ? priorLedger : {};
  const ledger = { ...ledgerIn };
  const phenomena = [];
  const abstentions = [];
  let trajectoryMs = 0;
  let qualifyMs = 0;
  const keys = keyedSessions(snapshot);
  const plans = proposeTemporalPlans({
    period,
    window,
    sessionDates: keys.dates
  });

  const orphanExcluded = [];
  for (const exerciseId of keys.ids) {
    if (isHistoricalOrphan(snapshot, exerciseId, getExerciseNameById)) {
      orphanExcluded.push(String(exerciseId));
      abstentions.push({ exerciseId, reason: 'historical_orphan_excluded' });
      continue;
    }
    const tTraj = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
    const trajectory = buildExerciseTrajectory({
      snapshot,
      exerciseId,
      exerciseName: getExerciseNameById?.(exerciseId) || '',
      window,
      getExerciseNameById,
      computeScope
    });
    trajectoryMs += (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()) - tTraj;
    if (!trajectory?.ok) {
      abstentions.push({ exerciseId, reason: trajectory?.reason || 'trajectory_unavailable' });
      continue;
    }
    const tQual = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
    const qualified = qualifyFormatConsolidation(withWeights(trajectory, snapshot), { period, window });
    const reading = enrichReading(
      qualified,
      trajectory.sessions?.lifetime || [],
      period,
      window
    );
    if (!programChanges?.length) {
      reading.limits = [...(reading.limits || []), 'changement de programme non documenté'];
    } else {
      reading.programContext = programChanges;
    }
    if (reading.publish && !(reading.claimEvidenceDates || []).length) {
      reading.publish = false;
      reading.publishReason = 'no_evidence_in_window';
      reading.limits = [
        ...(reading.limits || []),
        'aucune date de la conclusion ne tombe dans la fenêtre'
      ];
    }
    qualifyMs += (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now()) - tQual;
    const identity = consolidationIdentity(reading);
    const previous = ledger[identity.phenomenonId] || null;
    const transition = memoryTransition(previous, reading);
    reading.mechanism = consolidationMechanism(reading, trajectory.shape?.kind || null);
    const inWindowCount = (reading.claimEvidenceDates || []).length;
    const longWindow = !['today', '7d'].includes(period);
    const prose = consolidationProse(reading);
    const interpretationChanged = Boolean(previous && previous.state !== reading.state);
    const row = {
      ...reading,
      ...identity,
      priorShape: trajectory.shape?.kind || null,
      previousConclusionId: previous?.conclusionId || null,
      transition,
      prose,
      mechanism: reading.mechanism,
      newPriorityCard:
        inWindowCount > 0 &&
        !(longWindow && inWindowCount < 2) &&
        reading.state !== CONSOLIDATION_STATE.MAINTAINED &&
        reading.mechanism !== 'historical_maintenance' &&
        reading.mechanism !== 'stabilized_after_drop' &&
        (transition === MEMORY_TRANSITION.NEW ||
          transition === MEMORY_TRANSITION.REVISED ||
          transition === MEMORY_TRANSITION.CONTRADICTED ||
          (transition === MEMORY_TRANSITION.REFINED && interpretationChanged)),
      temporalPlans: plans.map((p) => p.kind),
      fact: reading.events || [],
      interpretation: reading.state,
      formulation: prose
    };
    if (reading.publish && prose) phenomena.push(row);
    else abstentions.push(row);
    ledger[identity.phenomenonId] = {
      level: reading.level ?? null,
      state: reading.state,
      supportCount: reading.supportCount ?? 0,
      conclusionId: identity.conclusionId
    };
  }

  const t1 = typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
  return {
    experimental: true,
    shadow: true,
    replacesVisibleEngine: false,
    period,
    window,
    phenomena,
    abstentions,
    orphanExcluded,
    ledger,
    persisted: false,
    ms: Math.round(t1 - t0),
    timing: {
      trajectoryMs: Math.round(trajectoryMs),
      qualifyMs: Math.round(qualifyMs)
    }
  };
}

export function replayFormatConsolidationEditions({
  frames,
  window,
  period = '30d',
  getExerciseNameById = null
} = {}) {
  let ledger = null;
  return (frames || []).map((frame) => {
    const out = runExerciseFormatConsolidationShadow({
      snapshot: frame.snapshot,
      window,
      period,
      getExerciseNameById,
      priorLedger: ledger,
      asOf: frame.asOf || null,
      programChanges: frame.programChanges || null
    });
    ledger = out.ledger;
    return out;
  });
}

export function consolidationDiscoveryFromTrajectory(trajectory, { period = '30d', window = null } = {}) {
  if (!trajectory?.ok) return null;
  const reading = enrichReading(
    qualifyFormatConsolidation(trajectory, { period, window }),
    trajectory.sessions?.lifetime || [],
    period,
    window
  );
  if (!reading?.publish || !reading.prose) return null;
  if (!['consolidation', 'resumed_level', 'load_progression', 'decline'].includes(reading.state)) {
    return null;
  }
  if ((reading.solidity || 0) < 0.55) return null;
  const volumeOnly = (reading.limits || []).some((line) => /total de séance|séries est incomplet/i.test(line));
  return {
    kind: 'disc_format_consolidation',
    nature: 'trajectory',
    family: 'format_consolidation',
    title: volumeOnly
      ? `${reading.exerciseName} : un volume de séance se répète`
      : `${reading.exerciseName} : un format de séance se répète`,
    body: reading.prose,
    evidence: (reading.claimEvidenceDates || []).join(' · '),
    weights: { importance: 0.86, reliability: reading.solidity, novelty: 0.62, fit: 0.9 },
    metrics: {
      state: reading.state,
      level: reading.level ?? null,
      reversible: true,
      volumeOnly,
      comparatorQuestion: reading.comparator?.question || null
    }
  };
}

export function buildConsolidationShadowDiagnostic(opts = {}) {
  const out = runExerciseFormatConsolidationShadow(opts);
  const compact = (row) => ({
    exerciseId: row.exerciseId,
    exerciseName: row.exerciseName || null,
    state: row.state || null,
    priorShape: row.priorShape || null,
    level: row.level ?? null,
    transition: row.transition || null,
    newPriorityCard: row.newPriorityCard === true,
    prose: row.prose || null,
    comparator: row.comparator || null,
    claimEvidenceDates: row.claimEvidenceDates || [],
    limits: row.limits || [row.reason].filter(Boolean),
    solidity: row.solidity ?? null,
    publish: row.publish === true
  });
  return {
    experimental: true,
    label: 'exercise_format_consolidation_shadow',
    notPublished: true,
    notExposed: true,
    replacesVisibleEngine: false,
    period: out.period,
    phenomena: out.phenomena.map(compact),
    abstentions: out.abstentions.map(compact),
    timing: out.timing,
    ms: out.ms
  };
}
