/**
 * Question : cette séance / cette période a-t-elle un coût inhabituel ?
 * Le ressenti est la voie directe. Charge, espacement et récupération mesurée
 * répondent à la même question quand le ressenti n'est pas renseigné.
 */

import DateHelper from '../dateHelper';
import { computeWindowTonnageKg } from './strengthBenchmarkExtractors';
import { extractSleepNightsInWindow } from './recapSleepNight';
import { resolveEvidence } from './recapQuestionEngine';

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function mean(values) {
  if (!values.length) return null;
  return values.reduce((s, n) => s + n, 0) / values.length;
}

function repsBetween(ctx, start, end) {
  let reps = 0;
  let days = 0;
  ctx.byDate.forEach((row, date) => {
    if (date < start || date > end) return;
    days += 1;
    reps += row.reps || 0;
  });
  return { reps, days };
}

function feedbackRows(ctx, start, end) {
  const dates = ctx.allDates.filter((d) => d >= start && d <= end);
  return dates.map((date) => ({ date, fb: ctx.feedback?.[date] || null }));
}

function priorSpan(ctx) {
  const prevEnd = DateHelper.addDays(ctx.win.start, -1);
  const prevStart = DateHelper.addDays(prevEnd, -(ctx.spanDays - 1));
  return { start: prevStart, end: prevEnd };
}

function tonnage(snapshot, start, end) {
  try {
    return computeWindowTonnageKg(snapshot, { start, end }) || 0;
  } catch {
    return 0;
  }
}

function sleepMean(garminData, start, end) {
  const nights = extractSleepNightsInWindow(garminData, start, end).filter((n) => n?.hours != null);
  const hours = mean(nights.map((n) => n.hours));
  const battery = mean(nights.map((n) => n.bodyBatteryEnd).filter((v) => Number.isFinite(v)));
  return { n: nights.length, hours, battery };
}

function closeSessions(dates) {
  if (dates.length < 2) return { pairs: 0, close: 0 };
  let close = 0;
  for (let i = 1; i < dates.length; i += 1) {
    const gap = Math.round(
      (new Date(`${dates[i]}T12:00:00`) - new Date(`${dates[i - 1]}T12:00:00`)) / 86400000
    );
    if (gap <= 1) close += 1;
  }
  return { pairs: dates.length - 1, close };
}

function proof({ id, role, strength, present, direction = null, coverage = 1, n = 0, nPossible = 0, kind, summary }) {
  return { id, role, strength, present, direction, coverage, n, nPossible, kind, summary };
}

export function evaluateSessionCost(ctx) {
  if (!ctx?.dates?.length || !ctx.win?.start || !ctx.win?.end) return null;
  const prior = priorSpan(ctx);
  const now = repsBetween(ctx, ctx.win.start, ctx.win.end);
  const before = repsBetween(ctx, prior.start, prior.end);
  const nowFb = feedbackRows(ctx, ctx.win.start, ctx.win.end);
  const priorFb = feedbackRows(ctx, prior.start, prior.end);
  const sessionN = now.days || ctx.dates.length;

  const energyPairs = nowFb
    .map((row) => {
      const a = num(row.fb?.energieDebut);
      const b = num(row.fb?.energieFin);
      return a != null && b != null ? { start: a, end: b, drop: a - b } : null;
    })
    .filter(Boolean);
  const energy = energyPairs.map((p) => p.drop);
  const difficulty = nowFb.map((row) => num(row.fb?.difficulte)).filter((v) => v != null);
  const priorDiff = priorFb.map((row) => num(row.fb?.difficulte)).filter((v) => v != null);
  const diffAvg = mean(difficulty);
  const priorDiffAvg = mean(priorDiff);
  const energyAvg = mean(energy);

  const energyUp = energyAvg != null && energyAvg >= 3;
  const diffUp =
    diffAvg != null &&
    (diffAvg >= 7.5 || (priorDiffAvg != null && diffAvg - priorDiffAvg >= 1.2 && difficulty.length >= 2));

  const proofs = [
    proof({
      id: 'energy',
      role: 'primary',
      strength: 0.9,
      present: energy.length > 0,
      direction: energyUp ? 'up' : energy.length ? 'flat' : null,
      coverage: sessionN ? energy.length / sessionN : 0,
      n: energy.length,
      nPossible: sessionN,
      kind: 'declared',
      summary:
        energy.length > 0
          ? `écart d'énergie ${Math.round(energyAvg * 10) / 10} point(s) sur ${energy.length} séance(s)`
          : ''
    }),
    proof({
      id: 'difficulty',
      role: 'primary',
      strength: 1,
      present: difficulty.length > 0,
      direction: diffUp ? 'up' : difficulty.length ? 'flat' : null,
      coverage: sessionN ? difficulty.length / sessionN : 0,
      n: difficulty.length,
      nPossible: sessionN,
      kind: 'declared',
      summary: diffAvg != null ? `difficulté moyenne ${Math.round(diffAvg * 10) / 10}/10` : ''
    })
  ];

  const volComparable = before.days >= 2 && before.reps >= 80 && now.reps >= 40;
  const volPct = volComparable ? (now.reps / before.reps - 1) * 100 : null;
  const volAbs = volComparable ? now.reps - before.reps : 0;
  const smallBase = before.days < 3;
  const volUp = volPct != null && volPct >= (smallBase ? 35 : 18) && volAbs >= 40;
  proofs.push(
    proof({
      id: 'volume',
      role: 'secondary',
      strength: smallBase ? 0.35 : 0.6,
      present: volComparable,
      direction: volUp ? 'up' : volComparable ? 'flat' : null,
      coverage: 1,
      n: now.days,
      nPossible: now.days,
      kind: 'deduced',
      summary: volPct != null ? `volume ${volPct >= 0 ? '+' : ''}${Math.round(volPct)} % (${Math.round(volAbs)} reps)` : ''
    })
  );

  const nowT = tonnage(ctx.snapshot, ctx.win.start, ctx.win.end);
  const prevT = tonnage(ctx.snapshot, prior.start, prior.end);
  const tonComparable = nowT >= 400 && prevT >= 400;
  const tonPct = tonComparable ? (nowT / prevT - 1) * 100 : null;
  proofs.push(
    proof({
      id: 'tonnage',
      role: 'secondary',
      strength: 0.55,
      present: tonComparable,
      direction: tonPct != null && tonPct >= 15 ? 'up' : tonComparable ? 'flat' : null,
      coverage: 1,
      n: now.days,
      nPossible: now.days,
      kind: 'deduced',
      summary: tonPct != null ? `tonnage ${tonPct >= 0 ? '+' : ''}${Math.round(tonPct)} %` : ''
    })
  );

  const gaps = closeSessions(ctx.dates);
  const packed = gaps.pairs >= 2 && gaps.close / gaps.pairs >= 0.5;
  proofs.push(
    proof({
      id: 'spacing',
      role: 'context',
      strength: 0.4,
      present: gaps.pairs >= 2,
      direction: packed ? 'up' : gaps.pairs >= 2 ? 'flat' : null,
      coverage: 1,
      n: gaps.pairs,
      nPossible: gaps.pairs,
      kind: 'deduced',
      summary: packed ? `${gaps.close} écarts d'au plus un jour sur ${gaps.pairs}` : ''
    })
  );

  const sleepNow = sleepMean(ctx.garminData, ctx.win.start, ctx.win.end);
  const sleepPrev = sleepMean(ctx.garminData, prior.start, prior.end);
  const sleepComparable = sleepNow.n >= 3 && sleepPrev.n >= 3 && sleepNow.hours != null && sleepPrev.hours != null;
  const sleepDeltaMin = sleepComparable ? Math.round((sleepNow.hours - sleepPrev.hours) * 60) : null;
  proofs.push(
    proof({
      id: 'sleep',
      role: 'context',
      strength: 0.35,
      present: Boolean(ctx.garminData) && sleepComparable,
      direction: sleepDeltaMin != null && sleepDeltaMin <= -25 ? 'down' : sleepComparable ? 'flat' : null,
      coverage: ctx.spanDays ? Math.min(1, sleepNow.n / ctx.spanDays) : 0,
      n: sleepNow.n,
      nPossible: ctx.spanDays,
      kind: 'measured',
      summary: sleepDeltaMin != null ? `sommeil ${sleepDeltaMin} min vs fenêtre précédente` : ''
    })
  );

  const perSessionNow = now.days ? now.reps / now.days : 0;
  const perSessionPrev = before.days ? before.reps / before.days : 0;
  const performanceHolds =
    before.days >= 2 && now.days >= 1 && perSessionPrev > 0 && perSessionNow >= perSessionPrev * 0.92;
  const recoveryCost = energyUp || diffUp || (sleepDeltaMin != null && sleepDeltaMin <= -25);
  const contradictions = [];
  if (recoveryCost && performanceHolds) {
    contradictions.push({
      id: 'performance_holds',
      summary: `les reps par séance restent autour de ${Math.round(perSessionNow)}, contre ${Math.round(perSessionPrev)} avant`
    });
  }

  const evidence = resolveEvidence({ proofs, contradictions });
  if (!evidence.route || evidence.confidence < 0.42 || evidence.level < 1) return null;
  const text = writeCost(ctx, evidence, {
    energyAvg,
    energyN: energy.length,
    energyPair: energyPairs.length === 1 ? energyPairs[0] : null,
    diffAvg,
    diffN: difficulty.length,
    sessionN,
    volPct,
    volAbs,
    nowReps: now.reps,
    beforeReps: before.reps,
    tonPct,
    gaps,
    sleepDeltaMin,
    sleepN: sleepNow.n,
    perSessionNow,
    perSessionPrev
  });
  if (!text) return null;
  return {
    strength: Math.round(64 + evidence.confidence * 28),
    confidence: evidence.confidence,
    horizon: evidence.route === 'conflict' || ctx.band !== 'today' ? 'medium' : 'short',
    concepts: ['session_cost'],
    title: text.title,
    body: text.body
  };
}

function writeCost(ctx, evidence, s) {
  const feltMissing = !evidence.primary.length;
  const partial = evidence.route === 'A_partial';
  const today = ctx.band === 'today';

  if (evidence.route === 'conflict') {
    const felt = s.energyN
      ? `L'énergie déclarée baisse d'environ ${Math.round(s.energyAvg)} point(s)`
      : s.diffN
        ? `La difficulté déclarée est de ${Math.round(s.diffAvg * 10) / 10}/10`
        : s.volPct != null
          ? `Le volume enregistré est ${s.volPct >= 0 ? '+' : ''}${Math.round(s.volPct)} %`
          : 'Les indicateurs de charge montent';
    return {
      title: 'Le coût monte, la performance enregistrée ne suit pas',
      body: `${felt}. ${evidence.contradictions[0].summary}. Les données disponibles ne montrent donc pas une dégradation simultanée de la performance.`
    };
  }

  if (evidence.route === 'A' && s.energyN && s.energyAvg >= 3) {
    const coverageBit =
      s.sessionN > s.energyN
        ? ` Ce ressenti couvre ${s.energyN} séance${s.energyN > 1 ? 's' : ''} sur ${s.sessionN}.`
        : '';
    const diffBit =
      s.diffN && s.diffAvg >= 7
        ? ` La difficulté renseignée est de ${Math.round(s.diffAvg * 10) / 10}/10.`
        : '';
    const move = s.energyPair
      ? `L’énergie passe de ${s.energyPair.start}/10 au début à ${s.energyPair.end}/10 à la fin.`
      : `L’énergie baisse en moyenne de ${Math.round(s.energyAvg * 10) / 10} point(s) entre le début et la fin.`;
    return {
      title: today
        ? 'La séance a coûté plus d’énergie qu’elle n’en a laissé'
        : 'Le coût ressenti des séances est élevé',
      body: `${move}${coverageBit}${diffBit} C’est le ressenti déclaré, pas une déduction à partir du volume.`
    };
  }

  if ((evidence.route === 'A' || evidence.route === 'A_partial') && s.diffN) {
    const cover = Math.round((s.diffN / Math.max(1, s.sessionN)) * 100);
    return {
      title: partial ? 'Le ressenti ne couvre qu’une partie des séances' : 'La difficulté déclarée est élevée',
      body: partial
        ? `Les ${s.diffN} séances renseignées ont une difficulté moyenne de ${Math.round(s.diffAvg * 10) / 10}/10, soit ${cover} % des séances de la période. Ce chiffre ne décrit pas les séances sans ressenti.`
        : `Tu as indiqué une difficulté moyenne de ${Math.round(s.diffAvg * 10) / 10}/10 sur ${s.diffN} séance${s.diffN > 1 ? 's' : ''}.`
    };
  }

  if (evidence.route === 'B' || evidence.route === 'C') {
    const bits = [];
    if (s.volPct != null && s.volPct >= 18) {
      bits.push(
        `le volume est ${s.volPct >= 0 ? '+' : ''}${Math.round(s.volPct)} % (${Math.round(s.nowReps)} reps contre ${Math.round(s.beforeReps)})`
      );
    }
    if (s.tonPct != null && s.tonPct >= 15) bits.push(`le tonnage est ${s.tonPct >= 0 ? '+' : ''}${Math.round(s.tonPct)} %`);
    if (s.gaps.close >= 2) bits.push(`${s.gaps.close} séances se suivent à un jour ou moins`);
    if (s.sleepDeltaMin != null && s.sleepDeltaMin <= -25) {
      bits.push(`Garmin enregistre un sommeil plus court d’environ ${Math.abs(s.sleepDeltaMin)} min (${s.sleepN} nuits)`);
    }
    if (!bits.length) return null;
    const limit = feltMissing
      ? ' Tu n’as pas renseigné le ressenti de séance sur cette période, donc le signal repose sur la charge et la récupération mesurée, pas sur l’effort perçu.'
      : '';
    return {
      title: 'Le coût objectif des séances semble avoir augmenté',
      body: `${bits[0].charAt(0).toUpperCase()}${bits[0].slice(1)}${bits.length > 1 ? `, et ${bits.slice(1).join(', ')}` : ''}.${limit}`
    };
  }

  if (evidence.route === 'D' && s.volPct != null && s.volPct >= 18) {
    return {
      title: 'Le volume monte, le coût ressenti n’est pas observable',
      body: `Les répétitions enregistrées sont ${s.volPct >= 0 ? '+' : ''}${Math.round(s.volPct)} % par rapport à la fenêtre précédente. Aucun ressenti de séance n’est renseigné, et les autres indicateurs de récupération ne sont pas disponibles : ça ne permet pas d’évaluer le coût ressenti.`
    };
  }

  return null;
}
