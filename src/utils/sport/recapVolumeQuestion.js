/**
 * Question : le volume a-t-il changé, et par quelle contribution ?
 * Fréquence, reps par séance et répertoire sont des preuves distinctes.
 */

import DateHelper from '../dateHelper';
import {
  compareIdSets,
  contextualMagnitude,
  renderReasoning
} from './recapReasoning';
import { resolveEvidence } from './recapQuestionEngine';

function idsBetween(ctx, start, end) {
  const ids = new Set();
  ctx.byDate.forEach((row, date) => {
    if (date < start || date > end) return;
    row.exercises?.forEach((_, id) => ids.add(id));
  });
  return ids;
}

function pack(ctx, start, end) {
  let reps = 0;
  let days = 0;
  ctx.byDate.forEach((row, date) => {
    if (date < start || date > end) return;
    days += 1;
    reps += row.reps || 0;
  });
  return { reps, days };
}

export function evaluateVolumeChange(ctx) {
  if (!ctx?.win?.start || ctx.dates.length < 2) return null;
  const prevEnd = DateHelper.addDays(ctx.win.start, -1);
  const prevStart = DateHelper.addDays(prevEnd, -(ctx.spanDays - 1));
  const now = pack(ctx, ctx.win.start, ctx.win.end);
  const before = pack(ctx, prevStart, prevEnd);
  if (before.days < 2 || before.reps <= 0) return null;

  const volRel = (now.reps / before.reps - 1) * 100;
  const freqRel = (now.days / before.days - 1) * 100;
  const perNow = now.reps / now.days;
  const perBefore = before.reps / before.days;
  const perRel = (perNow / perBefore - 1) * 100;
  const volMag = contextualMagnitude({
    rel: volRel,
    abs: now.reps - before.reps,
    base: before.reps,
    n: now.days
  });
  const split = Math.abs(freqRel - perRel);
  if (volMag.strength < 0.4 && split < 18) return null;

  const repertoire = compareIdSets(
    idsBetween(ctx, ctx.win.start, ctx.win.end),
    idsBetween(ctx, prevStart, prevEnd)
  );
  const fromFrequency = Math.abs(freqRel) >= Math.abs(perRel) + 8;
  const proofs = [
    {
      id: 'sessions',
      role: 'primary',
      strength: 0.9,
      present: true,
      direction: Math.abs(freqRel) >= 12 ? (freqRel > 0 ? 'up' : 'down') : 'flat',
      coverage: 1,
      n: now.days,
      kind: 'measured',
      summary: `${now.days} séances contre ${before.days}`
    },
    {
      id: 'reps',
      role: 'primary',
      strength: 1,
      present: true,
      direction: volMag.strength >= 0.4 ? (volRel > 0 ? 'up' : 'down') : 'flat',
      coverage: 1,
      n: now.days,
      kind: 'measured',
      summary: `${Math.round(volRel)} % de reps`
    },
    {
      id: 'per_session',
      role: 'secondary',
      strength: 0.7,
      present: true,
      direction: Math.abs(perRel) >= 10 ? (perRel > 0 ? 'up' : 'down') : 'flat',
      coverage: 1,
      n: now.days,
      kind: 'deduced',
      summary: `${Math.round(perRel)} % par séance`
    }
  ];
  const evidence = resolveEvidence({
    proofs,
    contradictions: [],
    comparability: repertoire.score
  });
  if (!evidence.route || evidence.confidence < 0.4) return null;

  const sign = (n) => `${n >= 0 ? '+' : ''}${Math.round(n)} %`;
  const driver = fromFrequency
    ? `La variation vient surtout du nombre de séances (${sign(freqRel)}), pas des répétitions par séance (${sign(perRel)}).`
    : `La variation vient surtout du contenu des séances (${sign(perRel)} par séance), la fréquence bouge de ${sign(freqRel)}.`;
  const finding = fromFrequency ? 'volume_change:from_frequency' : 'volume_change:from_density';

  return {
    strength: Math.round(66 + volMag.strength * 22 + (fromFrequency || Math.abs(perRel) >= 10 ? 6 : 0)),
    confidence: evidence.confidence,
    horizon: 'medium',
    concepts: ['volume_change'],
    findings: [finding],
    subsumes: ['volume_up', 'reps_up'],
    theme: 'volume',
    title: fromFrequency
      ? 'Le volume bouge surtout parce que le nombre de séances bouge'
      : 'Le volume bouge surtout à l’intérieur des séances',
    body: renderReasoning({
      observation: `${now.days} séances et ${Math.round(now.reps)} répétitions sont enregistrées sur cette fenêtre.`,
      comparison: `La fenêtre équivalente d’avant en comptait ${before.days} et ${Math.round(before.reps)} (${sign(volRel)} de reps, ${sign(freqRel)} de séances).`,
      interpretation: driver,
      limit: repertoire.caveat || ''
    })
  };
}
