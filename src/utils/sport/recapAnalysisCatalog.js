/**
 * Bibliothèque d'analyses : une définition n'est publiée que si son signal
 * dépasse un seuil, et une seule carte par famille / par sujet.
 * La plage change la question, pas seulement la période citée.
 */

import DateHelper from '../dateHelper';
import {
  extractDateStrFromWorkoutKey,
  extractExerciseIdFromWorkoutKey
} from '../exerciseKeyGenerator';
import { evaluateSessionCost } from './recapCostQuestion';
import { evaluateVolumeChange } from './recapVolumeQuestion';
import { evaluateRegularity } from './recapRegularityQuestion';
import { evaluateHistoryBaselines, evaluateRhythmRegime } from './recapHistoryQuestion';
import { informationGain, markTold } from './recapReasoning';

const MONTHS = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
];

function fmtInt(n) {
  return Math.round(Number(n) || 0).toLocaleString('fr-FR');
}

function monthLabel(ym) {
  const [y, m] = String(ym || '').split('-');
  return `${MONTHS[(Number(m) || 1) - 1] || ym} ${y}`;
}

function daysBetween(a, b) {
  return Math.round((new Date(`${b}T12:00:00`) - new Date(`${a}T12:00:00`)) / 86400000);
}

function weekday(ymd) {
  return new Date(`${ymd}T12:00:00`).getDay();
}

function bandOf(period) {
  if (period === 'today') return 'today';
  if (period === '7d') return 'week';
  if (period === '30d') return 'month';
  if (period === '3m') return 'quarter';
  if (period === '6m') return 'half';
  if (period === '1y') return 'year';
  if (period === '2y') return 'two';
  return 'all';
}

function collectDays(snapshot) {
  const checked = snapshot?.checkedExercises || {};
  const reps = snapshot?.reps || {};
  const byDate = new Map();
  Object.keys(checked).forEach((key) => {
    if (checked[key] !== true) return;
    const date = extractDateStrFromWorkoutKey(key);
    if (!date) return;
    const row = byDate.get(date) || { reps: 0, exercises: new Map() };
    const v = parseInt(String(reps[key]), 10) || 0;
    const id = extractExerciseIdFromWorkoutKey(key);
    row.reps += v;
    if (id) row.exercises.set(id, (row.exercises.get(id) || 0) + v);
    byDate.set(date, row);
  });
  return byDate;
}

function resolveWindow(period, window, dates) {
  const end = window?.end || dates[dates.length - 1];
  if (!end) return null;
  if (window?.start) return { start: window.start, end };
  const span =
    period === '2y' ? 730 : period === '1y' ? 365 : period === '6m' ? 183 : period === '3m' ? 92 : period === '30d' ? 30 : period === '7d' ? 7 : period === 'today' ? 1 : null;
  const start = span ? DateHelper.addDays(end, -(span - 1)) : dates[0];
  return { start, end };
}

function buildContext(opts) {
  const period = opts.period || '30d';
  const byDate = collectDays(opts.snapshot || {});
  const allDates = [...byDate.keys()].sort();
  if (!allDates.length) return null;
  const win = resolveWindow(period, opts.window, allDates);
  if (!win?.end) return null;
  const dates = allDates.filter((d) => d >= win.start && d <= win.end);
  const months = new Map();
  dates.forEach((d) => {
    const ym = d.slice(0, 7);
    const m = months.get(ym) || { ym, days: 0, reps: 0 };
    m.days += 1;
    m.reps += byDate.get(d)?.reps || 0;
    months.set(ym, m);
  });
  const monthList = [...months.values()];
  const gaps = [];
  for (let i = 1; i < dates.length; i += 1) {
    const idle = daysBetween(dates[i - 1], dates[i]) - 1;
    if (idle >= 7) gaps.push({ days: idle, from: dates[i - 1], to: dates[i] });
  }
  gaps.sort((a, b) => b.days - a.days);
  const reps = dates.reduce((s, d) => s + (byDate.get(d)?.reps || 0), 0);
  const spanDays = Math.max(1, daysBetween(win.start, win.end) + 1);
  const exercises = new Map();
  dates.forEach((d) => {
    const row = byDate.get(d);
    if (!row) return;
    row.exercises.forEach((v, id) => {
      const ex = exercises.get(id) || { id, reps: 0, dates: [] };
      ex.reps += v;
      ex.dates.push(d);
      exercises.set(id, ex);
    });
  });
  const nameOf = (id) => {
    const n = opts.getExerciseNameById?.(Number(id)) || opts.getExerciseNameById?.(id);
    return n && !/^Exercice\s+/i.test(String(n)) ? String(n) : `exercice ${id}`;
  };
  exercises.forEach((ex) => {
    ex.name = nameOf(ex.id);
    ex.dates.sort();
  });
  const allExerciseDates = new Map();
  allDates.forEach((d) => {
    byDate.get(d)?.exercises.forEach((_, id) => {
      const list = allExerciseDates.get(id) || [];
      list.push(d);
      allExerciseDates.set(id, list);
    });
  });
  return {
    period,
    band: bandOf(period),
    snapshot: opts.snapshot || {},
    byDate,
    allDates,
    dates,
    win,
    months: monthList,
    gaps,
    reps,
    spanDays,
    rate: Math.round((dates.length / Math.max(1, spanDays / 7)) * 10) / 10,
    exercises,
    allExerciseDates,
    feedback: opts.snapshot?.sessionFeedbacks || {},
    garminData: opts.garminData || null
  };
}

function card(def, hit) {
  const horizon = hit.horizon || def.horizon;
  return {
    id: `relation.reading.${horizon}.span_${def.id}`,
    type: 'coach_reading',
    pillar: 'interpretation',
    horizon,
    nature: horizon === 'short' ? 'now' : horizon === 'medium' ? 'trajectory' : 'journey',
      confidence: hit.confidence ?? 0.84,
    relevance: 0.96,
    novelty: 0.9,
    weight: Math.round(78 + hit.strength / 5),
    concepts: hit.concepts || [def.id],
    findings: hit.findings || hit.concepts || [def.id],
    text: `${hit.title}\n\n${hit.body}`,
    family: def.family,
    tags: def.tags,
    context: {
      title: hit.title,
      body: hit.body,
      kind: `span_${def.id}`,
      nature: horizon === 'short' ? 'now' : horizon === 'medium' ? 'trajectory' : 'journey',
      evidenceLine: ''
    }
  };
}

const ANALYSES = [
  {
    id: 'session_cost',
    family: 'ressenti',
    tags: ['energie', 'cout'],
    concepts: ['session_cost'],
    bands: ['today', 'week', 'month'],
    horizon: 'short',
    run(ctx) {
      return evaluateSessionCost(ctx);
    }
  },
  {
    id: 'streak_break',
    family: 'continuite',
    tags: ['rupture'],
    bands: ['today'],
    horizon: 'short',
    run(ctx) {
      if (ctx.dates.includes(ctx.win.end)) return null;
      const prior = ctx.allDates.filter((d) => d < ctx.win.end);
      if (!prior.length) return null;
      let run = 1;
      for (let i = prior.length - 1; i > 0; i -= 1) {
        if (daysBetween(prior[i - 1], prior[i]) === 1) run += 1;
        else break;
      }
      if (run < 4 || daysBetween(prior[prior.length - 1], ctx.win.end) !== 1) return null;
      return {
        strength: 68 + run,
        title: `Tu interromps une série de ${run} jours actifs`,
        body: `Aujourd’hui est le premier jour sans répétition enregistrée après ${run} jours consécutifs. La rupture est encore courte : elle ne suffit pas à parler d’un changement de rythme.`
      };
    }
  },
  {
    id: 'exercise_return',
    family: 'exercice',
    tags: ['retour'],
    bands: ['today', 'week'],
    horizon: 'medium',
    run(ctx) {
      const end = ctx.win.end;
      let best = null;
      ctx.exercises.forEach((ex) => {
        if (!ex.dates.includes(end) && ctx.band === 'today') return;
        const inWindow = ex.dates.filter((d) => d >= ctx.win.start && d <= end);
        if (!inWindow.length) return;
        const history = (ctx.allExerciseDates.get(ex.id) || []).filter((d) => d < inWindow[0]);
        if (!history.length) return;
        const gap = daysBetween(history[history.length - 1], inWindow[0]);
        if (gap < 10 || gap > 120) return;
        if (!best || gap > best.gap) best = { ex, gap };
      });
      if (!best) return null;
      return {
        strength: Math.min(90, 60 + best.gap / 5),
        title: `${best.ex.name} revient après ${best.gap} jours`,
        body: `Ce mouvement n’avait plus été enregistré depuis ${best.gap} jours. Son retour est assez net pour être une reprise, pas encore une nouvelle habitude.`
      };
    }
  },
  {
    id: 'new_variant',
    family: 'repertoire',
    tags: ['apparition'],
    bands: ['today', 'week'],
    horizon: 'short',
    run(ctx) {
      const born = [];
      ctx.exercises.forEach((ex) => {
        const all = ctx.allExerciseDates.get(ex.id) || ex.dates;
        if (all.length >= 1 && all[0] >= ctx.win.start && all[0] <= ctx.win.end && all.length <= 2) {
          born.push(ex);
        }
      });
      if (!born.length || ctx.allDates.length < 8) return null;
      const lead = born.sort((a, b) => b.reps - a.reps)[0];
      const share = ctx.reps > 0 ? Math.round((lead.reps / ctx.reps) * 100) : 0;
      return {
        strength: 72,
        title: `${lead.name} entre dans le répertoire`,
        body: `Cette variante n’apparaissait pas avant cette fenêtre. Elle représente ${fmtInt(lead.reps)} répétitions${share ? `, soit ${share} % du volume de la période` : ''}. C’est une première référence, pas encore un mouvement installé.`
      };
    }
  },
  {
    id: 'week_cluster',
    family: 'distribution',
    tags: ['jours'],
    bands: ['week'],
    horizon: 'short',
    run(ctx) {
      if (ctx.dates.length < 3) return null;
      const early = ctx.dates.filter((d) => daysBetween(ctx.win.start, d) <= 3).length;
      if (early < ctx.dates.length - 1) return null;
      return {
        strength: 76,
        title: 'Les séances sont regroupées en début de fenêtre',
        body: `${early} des ${ctx.dates.length} séances tiennent sur les quatre premiers jours. Le volume existe, mais il laisse la fin de fenêtre presque vide.`
      };
    }
  },
  {
    id: 'week_gap',
    family: 'trou',
    tags: ['rupture'],
    bands: ['week', 'month'],
    horizon: 'medium',
    run(ctx) {
      if (ctx.dates.length < 2) return null;
      let worst = 0;
      for (let i = 1; i < ctx.dates.length; i += 1) {
        worst = Math.max(worst, daysBetween(ctx.dates[i - 1], ctx.dates[i]) - 1);
      }
      if (worst < 3 || ctx.band === 'week' && worst < 3) return null;
      if (ctx.band === 'week' && worst < 3) return null;
      if (worst < (ctx.band === 'week' ? 3 : 6)) return null;
      return {
        strength: 70 + worst,
        title: 'Un seul intervalle explique la rupture de rythme',
        body: `Les séances se suivent, sauf un trou de ${worst} jours. Sans cette coupure, la fenêtre serait beaucoup plus régulière que le total ne le laisse croire.`
      };
    }
  },
  {
    id: 'weekday_habit',
    family: 'jour',
    tags: ['habitude'],
    bands: ['week', 'month', 'quarter', 'half', 'year', 'two', 'all'],
    horizon: 'long',
    run(ctx) {
      const counts = [0, 0, 0, 0, 0, 0, 0];
      const names = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
      ctx.allDates.forEach((d) => {
        counts[weekday(d)] += 1;
      });
      const total = counts.reduce((s, n) => s + n, 0);
      if (total < 12) return null;
      const top = counts.indexOf(Math.max(...counts));
      const share = counts[top] / total;
      if (share < 0.28) return null;
      return {
        strength: Math.round(60 + share * 40),
        title: `Le ${names[top]} concentre tes entraînements`,
        body: `${counts[top]} de tes ${total} jours entraînés tombent un ${names[top]}, soit ${Math.round(share * 100)} %. Ce n’est plus un hasard de semaine : le parcours a un jour privilégié.`
      };
    }
  },
  {
    id: 'anchor_exercises',
    family: 'continuite_exo',
    tags: ['ancrage'],
    bands: ['week', 'month'],
    horizon: 'medium',
    run(ctx) {
      if (ctx.dates.length < 3) return null;
      const always = [...ctx.exercises.values()].filter((ex) => ex.dates.length >= ctx.dates.length);
      if (always.length < 2) return null;
      const reps = always.reduce((s, ex) => s + ex.reps, 0);
      const share = ctx.reps > 0 ? Math.round((reps / ctx.reps) * 100) : 0;
      return {
        strength: 73,
        title: 'Quelques mouvements portent la continuité',
        body: `${always.slice(0, 3).map((e) => e.name).join(', ')} apparaissent à chaque séance de la fenêtre. Ensemble ils pèsent ${share} % des répétitions : peu de volume relatif, mais ce sont eux qui rendent la pratique continue.`
      };
    }
  },
  {
    id: 'volume_vs_frequency',
    family: 'volume',
    tags: ['frequence', 'volume'],
    bands: ['week', 'month', 'quarter'],
    horizon: 'medium',
    run(ctx) {
      return evaluateVolumeChange(ctx);
    }
  },
  {
    id: 'regularity',
    family: 'regularite',
    tags: ['regularite'],
    bands: ['month', 'quarter', 'half', 'year', 'two', 'all'],
    horizon: 'medium',
    run(ctx) {
      return evaluateRegularity(ctx);
    }
  },
  {
    id: 'month_halves',
    family: 'concentration',
    tags: ['mois'],
    bands: ['month'],
    horizon: 'short',
    run(ctx) {
      const mid = DateHelper.addDays(ctx.win.start, Math.floor(ctx.spanDays / 2));
      const first = ctx.dates.filter((d) => d < mid);
      const second = ctx.dates.filter((d) => d >= mid);
      const firstReps = first.reduce((s, d) => s + (ctx.byDate.get(d)?.reps || 0), 0);
      const secondReps = second.reduce((s, d) => s + (ctx.byDate.get(d)?.reps || 0), 0);
      const total = firstReps + secondReps;
      if (total < 80) return null;
      const share = Math.max(firstReps, secondReps) / total;
      if (share < 0.62) return null;
      const lead = firstReps >= secondReps;
      return {
        strength: Math.round(share * 100),
        title: lead ? 'Le mois est porté par sa première moitié' : 'Le mois accélère sur sa seconde moitié',
        body: `${lead ? 'Les premiers jours' : 'La fin de période'} concentrent ${fmtInt(Math.max(firstReps, secondReps))} reps, soit ${Math.round(share * 100)} % du volume. L’autre moitié n’en fait pas un rythme stable.`
      };
    }
  },
  {
    id: 'acute_week',
    family: 'aigu',
    tags: ['acceleration'],
    bands: ['month', 'quarter'],
    horizon: 'medium',
    run(ctx) {
      const recentStart = DateHelper.addDays(ctx.win.end, -6);
      const recent = ctx.dates.filter((d) => d >= recentStart);
      const recentReps = recent.reduce((s, d) => s + (ctx.byDate.get(d)?.reps || 0), 0);
      if (ctx.reps < 100 || recentReps < 40) return null;
      const share = recentReps / ctx.reps;
      if (share < 0.38) return null;
      return {
        strength: Math.round(60 + share * 50),
        title: 'La fin de fenêtre pèse plus que le rythme du mois',
        body: `Les 7 derniers jours concentrent ${fmtInt(recentReps)} reps, soit ${Math.round(share * 100)} % du volume de la période. Ce n’est pas le fonctionnement moyen : c’est une accélération récente.`
      };
    }
  },
  {
    id: 'variety_shift',
    family: 'variete',
    tags: ['repertoire'],
    bands: ['month', 'quarter'],
    horizon: 'medium',
    run(ctx) {
      const prevEnd = DateHelper.addDays(ctx.win.start, -1);
      const prevStart = DateHelper.addDays(prevEnd, -(ctx.spanDays - 1));
      const nowIds = new Set([...ctx.exercises.keys()]);
      const prevIds = new Set();
      ctx.allDates.filter((d) => d >= prevStart && d <= prevEnd).forEach((d) => {
        ctx.byDate.get(d)?.exercises.forEach((_, id) => prevIds.add(id));
      });
      if (prevIds.size < 4 || nowIds.size < 4) return null;
      const ratio = nowIds.size / prevIds.size;
      if (ratio < 1.25 && ratio > 0.75) return null;
      const wider = ratio >= 1.25;
      return {
        strength: 75,
        title: wider ? 'Le répertoire s’élargit sans que le volume l’explique seul' : 'L’entraînement se recentre sur moins de mouvements',
        body: wider
          ? `${nowIds.size} exercices différents sur cette fenêtre, contre ${prevIds.size} sur la précédente. La pratique se diversifie, ce n’est pas seulement un ajout de répétitions.`
          : `${nowIds.size} exercices contre ${prevIds.size} avant. Le mois est moins varié et plus répétitif.`
      };
    }
  },
  {
    id: 'phase_months',
    family: 'phases',
    tags: ['mois', 'tendance'],
    bands: ['quarter', 'half', 'year', 'two', 'all'],
    horizon: 'short',
    run(ctx) {
      if (ctx.months.length < 3) return null;
      const shown = ctx.months.slice(-Math.min(6, ctx.months.length));
      const lines = shown.map((m) => `${monthLabel(m.ym)} : ${m.days} séance${m.days > 1 ? 's' : ''}, ${fmtInt(m.reps)} reps`);
      return {
        strength: 84,
        title: ctx.band === 'all' ? 'Le parcours se lit en mois, pas en semaine' : 'La période n’est pas un seul total',
        body: `${lines.join('. ')}. Ensemble : ${ctx.dates.length} jours entraînés, ${fmtInt(ctx.reps)} répétitions, environ ${ctx.rate} séances par semaine.`
      };
    }
  },
  {
    id: 'last_month_break',
    family: 'inflexion',
    tags: ['mois'],
    bands: ['quarter', 'half'],
    horizon: 'medium',
    run(ctx) {
      if (ctx.months.length < 3) return null;
      const last = ctx.months[ctx.months.length - 1];
      const prior = ctx.months.slice(0, -1);
      const priorReps = prior.reduce((s, m) => s + m.reps, 0);
      if (priorReps < 80 || last.reps < priorReps * 0.9) return null;
      const share = Math.round((last.reps / ctx.reps) * 100);
      if (share < 40) return null;
      return {
        strength: 86,
        title: `${monthLabel(last.ym)} change la lecture`,
        body: `Ce mois concentre ${fmtInt(last.reps)} reps en ${last.days} séances, soit ${share} % du volume, contre ${fmtInt(priorReps)} sur les mois d’avant. La période n’est pas une pente régulière.`
      };
    }
  },
  {
    id: 'rate_shift',
    family: 'rythme',
    tags: ['frequence'],
    bands: ['quarter', 'half', 'year', 'two', 'all'],
    horizon: 'medium',
    run(ctx) {
      return evaluateRhythmRegime(ctx);
    }
  },
  {
    id: 'longest_gap',
    family: 'interruption',
    tags: ['rupture'],
    bands: ['quarter', 'half', 'year', 'two', 'all'],
    horizon: 'long',
    run(ctx) {
      const gap = ctx.gaps[0];
      if (!gap || gap.days < 10) return null;
      const longOnes = ctx.gaps.filter((g) => g.days >= 14).length;
      return {
        strength: Math.min(92, 64 + gap.days / 3),
        title: `La plus longue interruption dure ${gap.days} jours`,
        body: `Entre le ${gap.from} et le ${gap.to}, ${gap.days} jours sans répétition enregistrée.${
          longOnes > 1 ? ` ${longOnes} interruptions dépassent 14 jours.` : ' C’est la seule rupture de cette ampleur dans la fenêtre.'
        } Le reste du parcours ne se résume pas à ce trou, mais il en explique une partie.`
      };
    }
  },
  {
    id: 'comeback_speed',
    family: 'reprise',
    tags: ['reprise'],
    bands: ['half', 'year', 'two', 'all'],
    horizon: 'long',
    run(ctx) {
      const gap = ctx.gaps.find((g) => g.days >= 14);
      if (!gap) return null;
      const after = ctx.dates.filter((d) => d >= gap.to);
      if (after.length < 3) return null;
      const before = ctx.dates.filter((d) => d <= gap.from);
      const beforeRate = before.length / Math.max(1, daysBetween(ctx.dates[0], gap.from) / 7);
      let recovered = null;
      for (let i = 2; i < after.length; i += 1) {
        const slice = after.slice(0, i + 1);
        const rate = slice.length / Math.max(1, daysBetween(gap.to, slice[slice.length - 1]) / 7);
        if (beforeRate > 0 && rate >= beforeRate * 0.8) {
          recovered = daysBetween(gap.to, slice[slice.length - 1]);
          break;
        }
      }
      if (recovered == null) return null;
      return {
        strength: 82,
        title: 'La reprise a retrouvé le rythme d’avant le trou',
        body: `Après ${gap.days} jours d’arrêt, il a fallu ${recovered} jours pour revenir vers le rythme d’avant (environ ${Math.round(beforeRate * 10) / 10} séances/semaine). La fréquence est revenue ; ça ne dit pas encore que chaque séance a retrouvé son ancien volume.`
      };
    }
  },
  {
    id: 'peaks',
    family: 'pics',
    tags: ['mois'],
    bands: ['half', 'year', 'two', 'all'],
    horizon: 'long',
    run(ctx) {
      if (ctx.months.length < 3) return null;
      const best = [...ctx.months].sort((a, b) => b.reps - a.reps)[0];
      const quiet = [...ctx.months].sort((a, b) => a.days - b.days)[0];
      if (!best || !quiet || best.ym === quiet.ym) return null;
      if (best.reps < quiet.reps * 1.4 && best.days < quiet.days + 3) return null;
      return {
        strength: 83,
        title: `${monthLabel(best.ym)} est le pic, ${monthLabel(quiet.ym)} le creux`,
        body: `${monthLabel(best.ym)} totalise ${fmtInt(best.reps)} reps en ${best.days} séances. ${monthLabel(quiet.ym)} n’en compte que ${quiet.days}. L’histoire tient dans cet écart, pas dans un résumé de la semaine en cours.`
      };
    }
  },
  {
    id: 'durable_exercise',
    family: 'constance',
    tags: ['ancrage'],
    bands: ['year', 'two', 'all'],
    horizon: 'long',
    run(ctx) {
      let best = null;
      ctx.exercises.forEach((ex) => {
        if (ex.dates.length < 6) return;
        const span = daysBetween(ex.dates[0], ex.dates[ex.dates.length - 1]);
        if (!best || span > best.span) best = { ex, span };
      });
      if (!best || best.span < 60) return null;
      return {
        strength: 80,
        title: `${best.ex.name} est la constante du parcours`,
        body: `Ce mouvement va du ${best.ex.dates[0]} au ${best.ex.dates[best.ex.dates.length - 1]}, sur ${best.ex.dates.length} séances. Peu d’autres exercices restent présents aussi longtemps.`
      };
    }
  },
  {
    id: 'abandoned_exercise',
    family: 'abandon',
    tags: ['disparition'],
    bands: ['half', 'year', 'two', 'all'],
    horizon: 'medium',
    run(ctx) {
      let best = null;
      ctx.allExerciseDates.forEach((dates, id) => {
        if (dates.length < 4) return;
        const last = dates[dates.length - 1];
        const idle = daysBetween(last, ctx.win.end);
        if (idle < 45) return;
        const later = ctx.allDates.some((d) => d > DateHelper.addDays(last, 21));
        if (!later) return;
        if (!best || idle > best.idle) {
          const name = ctx.exercises.get(id)?.name || `exercice ${id}`;
          best = { name, idle, sessions: dates.length, last };
        }
      });
      if (!best) return null;
      return {
        strength: Math.min(90, 60 + best.idle / 10),
        title: `${best.name} a quitté la rotation`,
        body: `${best.sessions} séances enregistrées, puis plus rien depuis ${best.idle} jours (dernière fois le ${best.last}). Ce n’est pas une semaine sans ce mouvement : c’est une disparition dans le parcours.`
      };
    }
  },
  {
    id: 'present_was_rare',
    family: 'baseline',
    tags: ['reference'],
    bands: ['half', 'year', 'two', 'all'],
    horizon: 'long',
    run(ctx) {
      if (ctx.allDates.length < 16 || ctx.months.length < 4) return null;
      const recentStart = DateHelper.addDays(ctx.win.end, -83);
      const recent = ctx.allDates.filter((d) => d >= recentStart && d <= ctx.win.end);
      const recentRate = Math.round((recent.length / 12) * 10) / 10;
      const older = ctx.allDates.filter((d) => d < recentStart);
      if (older.length < 8) return null;
      const olderSpan = Math.max(30, daysBetween(older[0], older[older.length - 1]) + 1);
      const olderRate = Math.round((older.length / (olderSpan / 7)) * 10) / 10;
      if (recentRate < olderRate + 0.8) return null;
      return {
        strength: 88,
        title: 'Le rythme récent aurait été rare plus tôt dans le parcours',
        body: `Sur ~12 semaines, tu es autour de ${recentRate} séances par semaine, contre ${olderRate} sur tout ce qui précède. Le présent n’est pas la moyenne historique : c’est un niveau que le début du suivi atteignait peu.`
      };
    }
  },
  {
    id: 'history_floor',
    family: 'histoire',
    tags: ['reference'],
    bands: ['all', 'two', 'year'],
    horizon: 'long',
    run(ctx) {
      return evaluateHistoryBaselines(ctx);
    }
  }
];

const CAPS = { short: 3, medium: 3, long: 3 };

export function selectAnalysisCatalog(opts = {}) {
  const ctx = buildContext(opts);
  if (!ctx || ctx.dates.length < 1) return [];
  const hits = [];
  ANALYSES.forEach((def) => {
    if (def.bands && !def.bands.includes(ctx.band)) return;
    let hit = null;
    try {
      hit = def.run(ctx);
    } catch {
      hit = null;
    }
    if (!hit || hit.strength < 64 || !hit.title || !hit.body) return;
    hits.push({ def, hit });
  });
  hits.sort((a, b) => b.hit.strength - a.hit.strength);
  const families = new Set();
  const tags = new Set();
  const concepts = new Set();
  const told = new Set();
  const counts = { short: 0, medium: 0, long: 0 };
  const picked = [];
  hits.forEach(({ def, hit }) => {
    const horizon = hit.horizon || def.horizon;
    const hitConcepts = hit.concepts || def.concepts || [def.id];
    const findings = hit.findings || hitConcepts;
    if (counts[horizon] >= CAPS[horizon]) return;
    if (families.has(def.family)) return;
    if ((def.tags || []).some((t) => tags.has(t))) return;
    if (hitConcepts.every((c) => concepts.has(c))) return;
    if (informationGain(findings, told) < 1) return;
    families.add(def.family);
    (def.tags || []).forEach((t) => tags.add(t));
    hitConcepts.forEach((c) => concepts.add(c));
    markTold(told, findings, hit.subsumes || []);
    counts[horizon] += 1;
    picked.push(card(def, { ...hit, horizon }));
  });
  return picked;
}
