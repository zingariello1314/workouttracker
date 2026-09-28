/**
 * Baselines empilées : parcours entier, année intermédiaire, 90 derniers jours.
 * Un rythme « élevé » n'a pas le même sens s'il est déjà la norme depuis des mois.
 */

import DateHelper from '../dateHelper';
import { renderReasoning, seriesStats } from './recapReasoning';

function rate(dates, start, end) {
  if (!start || !end || end < start) return null;
  const n = dates.filter((d) => d >= start && d <= end).length;
  const span = Math.round((new Date(`${end}T12:00:00`) - new Date(`${start}T12:00:00`)) / 86400000) + 1;
  if (span < 21 || n < 2) return null;
  return { n, perWeek: n / (span / 7), span };
}

export function evaluateHistoryBaselines(ctx) {
  if (!ctx?.allDates?.length || ctx.allDates.length < 8 || !ctx.win?.end) return null;
  const end = ctx.win.end;
  const first = ctx.allDates[0];
  const life = rate(ctx.allDates, first, end);
  const recent = rate(ctx.allDates, DateHelper.addDays(end, -89), end);
  if (!life || !recent) return null;
  const span = life.span;
  const mid =
    span > 400 ? rate(ctx.allDates, DateHelper.addDays(end, -364), DateHelper.addDays(end, -90)) : null;
  const aboveLife = recent.perWeek >= life.perWeek + 0.7;
  const belowLife = recent.perWeek <= life.perWeek - 0.7;
  const nearMid = mid && Math.abs(recent.perWeek - mid.perWeek) < 0.45;
  const fmt = (n) => `${Math.round(n * 10) / 10}`;

  if (!aboveLife && !belowLife && !(mid && Math.abs(recent.perWeek - mid.perWeek) >= 0.7)) return null;

  let interpretation;
  let finding;
  let title;
  if (mid && nearMid && (aboveLife || belowLife)) {
    finding = 'history:recent_matches_mid_not_life';
    title = aboveLife
      ? 'Le rythme récent dépasse le parcours, et c’est déjà la norme des derniers mois'
      : 'Le rythme récent est sous le parcours, et c’est déjà celui des derniers mois';
    interpretation = aboveLife
      ? `Sur 90 jours tu es à ${fmt(recent.perWeek)} séances/semaine, proche des 12 mois d’avant ce trimestre (${fmt(mid.perWeek)}), et au-dessus de l’ensemble du suivi (${fmt(life.perWeek)}).`
      : `Sur 90 jours tu es à ${fmt(recent.perWeek)} séances/semaine, proche de l’année intermédiaire (${fmt(mid.perWeek)}), et en dessous de la moyenne depuis le début (${fmt(life.perWeek)}).`;
  } else if (mid && !nearMid) {
    finding = 'history:three_baselines';
    title = 'Trois baselines ne racontent pas le même rythme';
    interpretation = `90 jours : ${fmt(recent.perWeek)} séances/semaine. Année intermédiaire : ${fmt(mid.perWeek)}. Depuis le début : ${fmt(life.perWeek)}.`;
  } else {
    finding = 'history:recent_vs_life';
    title = 'La moyenne depuis le début n’est pas le niveau actuel';
    interpretation = `Depuis le ${first}, environ ${fmt(life.perWeek)} séances/semaine sur ${life.n} jours enregistrés. Les 90 derniers jours sont à ${fmt(recent.perWeek)}.`;
  }

  return {
    strength: 84,
    confidence: mid ? 0.78 : 0.7,
    horizon: 'long',
    concepts: ['history_baseline'],
    findings: [finding],
    subsumes: ['history:recent_vs_life'],
    theme: 'history',
    title,
    body: renderReasoning({
      observation: `Premier jour enregistré : ${first}.`,
      comparison: interpretation,
      interpretation: nearMid
        ? 'Le présent ne doit pas être lu seulement contre les débuts : il a déjà une baseline plus récente.'
        : 'Le niveau actuel et la moyenne du parcours ne se confondent pas.',
      limit: 'Ces rythmes comptent les jours avec des répétitions enregistrées, pas les jours sans saisie.'
    })
  };
}

export function evaluateRhythmRegime(ctx) {
  if (!ctx?.months || ctx.months.length < 4) return null;
  const counts = ctx.months.map((m) => m.days);
  const mid = Math.floor(counts.length / 2);
  const early = seriesStats(counts.slice(0, mid));
  const late = seriesStats(counts.slice(mid));
  if (!early || !late || early.mean <= 0) return null;
  const delta = late.mean - early.mean;
  if (Math.abs(delta) < 1.2) return null;
  const lateStable = late.cv != null && late.cv < 0.45 && late.n >= 2;
  const fmt = (n) => `${Math.round(n * 10) / 10}`;
  return {
    strength: lateStable ? 86 : 78,
    confidence: lateStable ? 0.74 : 0.62,
    horizon: 'medium',
    concepts: ['rhythm'],
    findings: [lateStable ? 'rhythm:regime' : 'rhythm:shift'],
    subsumes: lateStable ? ['rhythm:shift'] : [],
    theme: 'rhythm',
    title: lateStable ? 'Le rythme a changé de régime, puis s’est stabilisé' : 'Le rythme de la fin n’est plus celui du début',
    body: renderReasoning({
      observation: `La première moitié des mois tourne autour de ${fmt(early.mean)} jours entraînés par mois, la seconde autour de ${fmt(late.mean)}.`,
      comparison: lateStable
        ? `Une fois le nouveau niveau atteint, les mois restent proches les uns des autres (écarts relatifs contenus).`
        : `L’écart tient sur plusieurs mois. Ce n’est pas une semaine isolée.`,
      interpretation: lateStable
        ? 'On voit un changement de régime, pas seulement une pente.'
        : 'La fin de période n’a plus le rythme du début.',
      limit: late.n < 3 ? 'La seconde moitié compte peu de mois : le régime est encore peu confirmé.' : ''
    })
  };
}
