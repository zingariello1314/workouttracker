/**
 * Question : la pratique est-elle devenue plus régulière ?
 * Une moyenne qui monte avec une dispersion qui monte n'est pas la même conclusion.
 */

import DateHelper from '../dateHelper';
import { contextualMagnitude, renderReasoning, seriesStats } from './recapReasoning';
import { resolveEvidence } from './recapQuestionEngine';

function weekKey(ymd) {
  const d = new Date(`${ymd}T12:00:00`);
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dayNum = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${dayNum}`;
}

function weeklyCounts(dates, start, end) {
  const map = new Map();
  let cursor = weekKey(start);
  const last = weekKey(end);
  while (cursor && cursor <= last) {
    map.set(cursor, 0);
    cursor = DateHelper.addDays(cursor, 7);
  }
  dates.forEach((d) => {
    if (d < start || d > end) return;
    const key = weekKey(d);
    if (!map.has(key)) map.set(key, 0);
    map.set(key, map.get(key) + 1);
  });
  return [...map.values()];
}

function gaps(dates) {
  const out = [];
  for (let i = 1; i < dates.length; i += 1) {
    const a = new Date(`${dates[i - 1]}T12:00:00`);
    const b = new Date(`${dates[i]}T12:00:00`);
    out.push(Math.round((b - a) / 86400000));
  }
  return out;
}

export function evaluateRegularity(ctx) {
  if (!ctx?.win?.start || ctx.dates.length < 4) return null;
  const prevEnd = DateHelper.addDays(ctx.win.start, -1);
  const prevStart = DateHelper.addDays(prevEnd, -(ctx.spanDays - 1));
  const priorDates = ctx.allDates.filter((d) => d >= prevStart && d <= prevEnd);
  if (priorDates.length < 3) return null;

  const nowWeeks = weeklyCounts(ctx.dates, ctx.win.start, ctx.win.end);
  const prevWeeks = weeklyCounts(priorDates, prevStart, prevEnd);
  const nowStats = seriesStats(nowWeeks);
  const prevStats = seriesStats(prevWeeks);
  if (!nowStats || !prevStats || nowStats.n < 3 || prevStats.n < 3 || !prevStats.mean) return null;

  const freqRel = (nowStats.mean / prevStats.mean - 1) * 100;
  const freqMag = contextualMagnitude({
    rel: freqRel,
    abs: nowStats.mean - prevStats.mean,
    base: prevStats.mean,
    n: nowStats.n
  });
  const cvNow = nowStats.cv;
  const cvPrev = prevStats.cv;
  if (cvNow == null || cvPrev == null) return null;
  const tighter = freqMag.strength >= 0.35 && cvNow <= cvPrev * 0.75;
  const scattered = freqMag.strength >= 0.35 && cvNow >= cvPrev * 1.35 && freqRel > 0;
  const onlyTighter = !freqMag.strength && cvPrev > 0.35 && cvNow <= cvPrev * 0.6 && nowStats.n >= 4;
  if (!tighter && !scattered && !onlyTighter) return null;

  const nowGaps = seriesStats(gaps(ctx.dates));
  const prevGaps = seriesStats(gaps(priorDates));
  const proofs = [
    {
      id: 'week_rate',
      role: 'primary',
      strength: 1,
      present: true,
      direction: freqRel > 8 ? 'up' : freqRel < -8 ? 'down' : 'flat',
      coverage: Math.min(1, nowStats.n / 4),
      n: nowStats.n,
      kind: 'measured'
    },
    {
      id: 'dispersion',
      role: 'secondary',
      strength: 0.8,
      present: true,
      direction: cvNow < cvPrev ? 'down' : 'up',
      coverage: 1,
      n: nowStats.n,
      kind: 'deduced'
    }
  ];
  const evidence = resolveEvidence({
    proofs,
    contradictions: scattered ? [{ id: 'frequency_up_dispersion_up' }] : []
  });
  if (!evidence.route || evidence.confidence < 0.4) return null;

  const meanTxt = (n) => `${Math.round(n * 10) / 10}`;
  if (scattered) {
    return {
      strength: Math.round(84 + freqMag.strength * 10),
      confidence: evidence.confidence,
      horizon: 'medium',
      concepts: ['regularity'],
      findings: ['regularity:more_often_less_stable'],
      subsumes: [],
      theme: 'regularity',
      title: 'Tu t’entraînes plus souvent, mais de façon moins régulière',
      body: renderReasoning({
        observation: `Les semaines de cette fenêtre tournent autour de ${meanTxt(nowStats.mean)} séance(s), entre ${nowStats.min} et ${nowStats.max}.`,
        comparison: `Avant, la moyenne était de ${meanTxt(prevStats.mean)} et l’écart entre semaines était plus resserré.`,
        interpretation:
          'La fréquence moyenne monte, la dispersion aussi. Ce n’est pas une régularité plus forte : c’est un rythme plus chargé et plus inégal.',
        limit:
          nowGaps && prevGaps
            ? `L’intervalle médian entre séances est de ${Math.round(nowGaps.median)} jour(s), contre ${Math.round(prevGaps.median)} avant.`
            : ''
      })
    };
  }

  return {
    strength: Math.round(72 + (1 - cvNow) * 10),
    confidence: evidence.confidence,
    horizon: 'medium',
    concepts: ['regularity'],
    findings: ['regularity:tighter'],
    subsumes: [],
    theme: 'regularity',
    title: 'La régularité s’est resserrée, pas seulement la moyenne',
    body: renderReasoning({
      observation: `Autour de ${meanTxt(nowStats.mean)} séance(s) par semaine, avec des semaines entre ${nowStats.min} et ${nowStats.max}.`,
      comparison: `La fenêtre d’avant était à ${meanTxt(prevStats.mean)}, avec des écarts plus larges.`,
      interpretation: 'Les semaines extrêmes se rapprochent. La pratique devient plus stable, au-delà du seul total.',
      limit: ''
    })
  };
}
