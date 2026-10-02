/**
 * Lectures du Récap sur les passages GTG hors planning.
 * Elles jugent à quoi sert l'heure choisie, si le fil continue, et si un résultat
 * est visible depuis le début de la pratique — pas seulement dans la fenêtre affichée.
 */

import DateHelper from '../dateHelper';
import {
  buildGtgDayPlan,
  collectGtgMiniSetHistory,
  getGtgExerciseLabel,
  normalizeGtgData
} from '../../services/endurance/gtgService';
import { resolveGtgCanonicalExerciseId } from '../../services/endurance/gtgWorkoutSync';

const BAND_LABEL = {
  night: 'après 21 h',
  evening: 'en fin d’après-midi (17 h–21 h)',
  afternoon: 'dans l’après-midi',
  morning: 'le matin'
};

function clockMinutes(time) {
  const match = String(time || '').match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function hourBand(time) {
  const mins = clockMinutes(time);
  if (mins == null) return null;
  if (mins >= 21 * 60 || mins < 5 * 60) return 'night';
  if (mins >= 17 * 60) return 'evening';
  if (mins >= 12 * 60) return 'afternoon';
  return 'morning';
}

function formatClockFr(time) {
  const match = String(time || '').match(/^(\d{2}):(\d{2})$/);
  if (!match) return String(time || '');
  return `${Number(match[1])} h ${match[2]}`;
}

function formatDayFr(ymd) {
  const [y, m, d] = String(ymd || '').split('-');
  if (!y || !m || !d) return String(ymd || '');
  return `${d}/${m}/${y}`;
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function discovery(partial) {
  return {
    id: partial.kind,
    kind: partial.kind,
    nature: partial.nature,
    family: 'gtg_unplanned',
    score: partial.score,
    title: partial.title,
    body: partial.body,
    evidence: partial.evidence || '',
    relevance: Math.min(0.995, 0.9 + (partial.score || 0) / 1000),
    metrics: partial.metrics || {}
  };
}

function dominantBand(rows) {
  const counts = new Map();
  rows.forEach((row) => {
    const band = hourBand(row.time);
    if (!band) return;
    counts.set(band, (counts.get(band) || 0) + 1);
  });
  let best = null;
  counts.forEach((count, band) => {
    if (!best || count > best.count) best = { band, count };
  });
  if (!best || rows.length === 0 || best.count / rows.length < 0.55) return null;
  return best;
}

function meanPerActiveDay(rows, valueOf) {
  const byDay = new Map();
  rows.forEach((row) => {
    byDay.set(row.dateStr, (byDay.get(row.dateStr) || 0) + valueOf(row));
  });
  if (byDay.size < 3) return null;
  let total = 0;
  byDay.forEach((n) => {
    total += n;
  });
  return { days: byDay.size, total, mean: total / byDay.size };
}

function sliceByDate(rows, start, end) {
  return rows.filter((row) => row.dateStr >= start && row.dateStr <= end);
}

function previousWindow(window) {
  if (!window?.start || !window?.end) return null;
  const span = DateHelper.getDateRange(window.start, window.end).length;
  if (span < 2) return null;
  const end = DateHelper.addDays(window.start, -1);
  const start = DateHelper.addDays(end, -(span - 1));
  return { start, end };
}

function judgeRow(row, plan) {
  const ep = (plan?.exercisePlans || []).find((item) => item.exerciseId === row.exerciseId);
  const rangeHigh = ep?.rangeHigh ?? null;
  const maxReps = ep?.maxReps ?? null;
  let zone = 'unknown';
  if (rangeHigh != null && row.reps <= rangeHigh) zone = 'easy';
  else if (maxReps != null && row.reps >= maxReps) zone = 'max';
  else if (rangeHigh != null) zone = 'above';

  const mins = clockMinutes(row.time);
  let nearest = null;
  (ep?.slots || [])
    .filter((slot) => !slot.adHoc)
    .forEach((slot) => {
      const slotMins = clockMinutes(slot.time);
      if (slotMins == null || mins == null) return;
      const dist = Math.abs(slotMins - mins);
      if (!nearest || dist < nearest.dist) nearest = { dist, done: Boolean(slot.done) };
    });

  const plannedDone = plan?.donePlannedMiniSets || 0;
  const missed = Math.max(0, (plan?.plannedMiniSets || 0) - plannedDone);
  let role = 'extra';
  if (plannedDone === 0) role = 'only';
  else if (nearest && nearest.dist <= 30 && nearest.done) role = 'stacked';
  else if (missed > 0) role = 'catchup';
  else if (plan?.reached100) role = 'surplus';

  return { zone, role, band: hourBand(row.time) };
}

function zoneSentence(rows, judgments) {
  const easy = judgments.filter((item) => item.zone === 'easy').length;
  const above = judgments.filter((item) => item.zone === 'above').length;
  const atMax = judgments.filter((item) => item.zone === 'max').length;
  if (atMax > 0) {
    return atMax > 1
      ? `${atMax} séries atteignent le max déclaré. Elles comptent dans le journal, elles ne graissent pas le geste : un max se teste, il ne se répète pas à chaque heure.`
      : 'Une série atteint le max déclaré. Elle compte dans le journal, elle ne graisse pas le geste : un max se teste, il ne se répète pas à chaque heure.';
  }
  if (above > easy && above > 0) {
    return `${above} série${above > 1 ? 's dépassent' : ' dépasse'} la mini-série prévue (environ 40–60 % du max). Le volume est réel, mais ce n’est plus seulement un graissage : c’est plus proche d’un effort de séance.`;
  }
  if (easy > 0) {
    return easy > 1
      ? `Les ${easy} séries restent dans la zone facile du protocole. Ça sert encore le Grease the Groove : répéter sans aller à l’échec.`
      : 'La série reste dans la zone facile du protocole. Ça sert encore le Grease the Groove : répéter sans aller à l’échec.';
  }
  return `Ces ${rows.length} série${rows.length > 1 ? 's comptent' : ' compte'} dans le même volume que les créneaux prévus.`;
}

function roleTitle(mode, sample) {
  const clock = sample ? formatClockFr(sample.time) : '';
  if (sample && mode === 'only') {
    return `Ce jour-là, le Grease the Groove ne tient que par le passage de ${clock}`;
  }
  if (sample && mode === 'catchup') {
    return `Le passage de ${clock} rattrape des créneaux que la journée n’avait pas cochés`;
  }
  if (sample && mode === 'stacked') {
    return `Le passage de ${clock} colle à un créneau déjà fait`;
  }
  if (sample && mode === 'surplus') {
    return `Le passage de ${clock} s’ajoute à une journée déjà complète`;
  }
  if (mode === 'only') return 'Certains jours, le Grease the Groove ne tient que par un passage hors planning';
  if (mode === 'catchup') return 'Les passages hors planning rattrapent des créneaux sautés';
  if (mode === 'stacked') return 'Plusieurs passages hors planning collent à un créneau déjà fait';
  if (mode === 'surplus') return 'Les passages hors planning s’ajoutent à des journées déjà complètes';
  return 'Les passages hors planning n’ont pas tous le même rôle';
}

function roleUse(mode, band) {
  const place = band ? ` Ils se placent surtout ${BAND_LABEL[band]}.` : '';
  if (mode === 'catchup') {
    return `Là, ils servent à ne pas laisser le jour à zéro.${place} Le Grease the Groove vit de répétitions espacées : rattraper un trou vaut mieux que d’attendre le lendemain, tant que les reps restent faciles.`;
  }
  if (mode === 'only') {
    return `Sans eux, ces jours n’auraient aucune mini-série.${place} C’est utile pour garder le fil, et ça ne remplace pas un emploi du temps si ça devient la seule façon de pratiquer.`;
  }
  if (mode === 'stacked') {
    return `Deux stimulations à moins d’une demi-heure ne graissent pas mieux le geste : la méthode gagne parce que les séries sont séparées.${place}`;
  }
  if (mode === 'surplus') {
    return `La journée prévue était déjà faite.${place} Un surplus facile ajoute de la fréquence. Un surplus tardif, collé au coucher, allonge la journée sans combler un trou.`;
  }
  return `Une partie comble des trous, une autre s’ajoute à des créneaux déjà faits.${place} Le hors-planning n’est pas une deuxième séance : c’est la même pratique, à une heure que le planning n’avait pas.`;
}

function buildNowCard(rows, judgments) {
  const counts = { only: 0, catchup: 0, stacked: 0, surplus: 0, extra: 0 };
  judgments.forEach((item) => {
    counts[item.role] = (counts[item.role] || 0) + 1;
  });
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const mode = ranked[0][1] > 0 ? ranked[0][0] : 'extra';
  const band = dominantBand(rows);
  const single = rows.length === 1 ? rows[0] : null;
  const reps = rows.reduce((sum, row) => sum + row.reps, 0);
  const title = roleTitle(mode, single);
  const clocks = rows.map((row) => clockMinutes(row.time)).filter((n) => n != null);
  const perSet = rows.length > 0 ? Math.round(reps / rows.length) : null;
  const span = clocks.length >= 2 ? Math.max(...clocks) - Math.min(...clocks) : null;
  const cluster =
    rows.length >= 2 && perSet != null
      ? ` Cela fait environ ${perSet} reps par série.${
          span === 0
            ? ` Elles sont notées à la même heure : des séries collées comptent presque comme un seul passage, pas comme des répétitions espacées de plusieurs heures.`
            : span != null && span <= 120
              ? ` Elles tiennent dans ${span} minutes : des séries collées comptent presque comme un seul passage, pas comme des répétitions espacées de plusieurs heures.`
              : ''
        }${
          band?.band && span != null && span <= 120
            ? ` Le créneau réellement utilisé est ${BAND_LABEL[band.band]}. L'espacement utile se place là, pas sur une heure absente du journal.`
            : ''
        }`
      : '';
  const body = `${single ? `Tu as noté ${single.reps} reps à ${formatClockFr(single.time)}.` : `${rows.length} mini-séries hors planning, ${reps} reps, sont entrées dans le journal de la fenêtre.${cluster}`} ${zoneSentence(rows, judgments)} ${roleUse(mode, band?.band)}`;
  return discovery({
    kind: 'disc_gtg_unplanned_now',
    nature: 'now',
    score: 90,
    title,
    body,
    evidence: `${rows.length} hors planning · ${reps} reps${band ? ` · ${BAND_LABEL[band.band]}` : ''}`,
    metrics: { sets: rows.length, reps, role: mode, band: band?.band || null }
  });
}

function gapDays(history, start, end, plans) {
  const days = new Set(
    sliceByDate(history, start, end)
      .filter((row) => row.adHoc)
      .map((row) => row.dateStr)
  );
  let gaps = 0;
  days.forEach((dateStr) => {
    const plan = plans.get(dateStr);
    if ((plan?.donePlannedMiniSets || 0) === 0) gaps += 1;
  });
  return { adHocDays: days.size, gaps };
}

function buildContinuityCard(history, window, plans) {
  const prev = previousWindow(window);
  if (!prev) return null;
  const current = sliceByDate(history, window.start, window.end).filter((row) => row.adHoc);
  const before = sliceByDate(history, prev.start, prev.end).filter((row) => row.adHoc);
  if (current.length + before.length < 2) return null;
  const nowGap = gapDays(history, window.start, window.end, plans);
  const prevGap = gapDays(history, prev.start, prev.end, plans);
  if (nowGap.adHocDays < 2 && before.length < 2) return null;

  const nowBand = dominantBand(current);
  const prevBand = dominantBand(before);
  let title = 'Les passages hors planning ne forment pas encore un deuxième rythme';
  let change = `Cette fenêtre en compte ${current.length}, la fenêtre d’avant ${before.length}.`;
  if (current.length === 0 && before.length >= 2) {
    title = 'Les passages hors planning de la fenêtre d’avant ne se sont pas prolongés';
    change = `La fenêtre précédente en avait ${before.length}. Celle-ci n’en a aucun. Le fil ajouté s’est arrêté.`;
  } else if (nowGap.gaps >= 2 && nowGap.adHocDays > 0 && nowGap.gaps >= nowGap.adHocDays / 2) {
    title = 'Les passages hors planning tiennent le fil des jours sans créneau coché';
    change = `Sans eux, ${nowGap.gaps} jour${nowGap.gaps > 1 ? 's' : ''} de cette fenêtre seraient restés sans Grease the Groove. La fenêtre d’avant en avait ${prevGap.gaps}${before.length === 0 ? ', et aucun passage de ce type' : ''}.`;
  } else if (before.length === 0 && nowGap.adHocDays >= 2) {
    title = 'Les passages hors planning apparaissent, ils n’étaient pas là sur la fenêtre d’avant';
  } else if (nowBand && prevBand && nowBand.band === prevBand.band && current.length >= 2 && before.length >= 2) {
    title = `Tu continues à placer ces passages ${BAND_LABEL[nowBand.band]}`;
    change = `La fenêtre actuelle et la précédente se retrouvent dans la même plage. Ce n’est pas un horaire du planning, c’est déjà une habitude d’heure.`;
  } else if (nowBand && prevBand && nowBand.band !== prevBand.band && before.length >= 2 && current.length >= 2) {
    title = 'L’heure des passages hors planning a changé d’une fenêtre à l’autre';
    change = `Avant, ils se plaçaient ${BAND_LABEL[prevBand.band]}. Maintenant, ${BAND_LABEL[nowBand.band]}. Le geste est le même, le moment dans la journée ne l’est plus.`;
  } else if (current.length > 0 && before.length === 0) {
    title = 'Le hors-planning de cette fenêtre n’a pas de précédent immédiat';
  }

  const body = `${change} ${nowGap.adHocDays} jour${nowGap.adHocDays > 1 ? 's' : ''} avec un passage ajouté sur cette fenêtre, ${prevGap.adHocDays} sur la précédente. Un passage isolé ne fait pas une continuité : ici on compare deux fenêtres de même longueur, de ${formatDayFr(prev.start)} à ${formatDayFr(window.end)}.`;
  return discovery({
    kind: 'disc_gtg_unplanned_role',
    nature: 'trajectory',
    score: 86,
    title,
    body,
    evidence: `${current.length} maintenant · ${before.length} avant`,
    metrics: {
      currentSets: current.length,
      previousSets: before.length,
      gapDays: nowGap.gaps
    }
  });
}

function cleanMaxPoints(snapshot, exerciseId, config, end) {
  const canonical = String(resolveGtgCanonicalExerciseId(exerciseId, config));
  const history = Array.isArray(snapshot?.exerciseMaxHistory) ? snapshot.exerciseMaxHistory : [];
  return history
    .filter((entry) => String(entry?.exerciseId) === canonical)
    .map((entry) => ({
      date: String(entry?.recordDate || entry?.recordedAt || '').slice(0, 10),
      reps: Math.round(Number(entry?.reps) || 0)
    }))
    .filter((entry) => entry.reps > 0 && /^\d{4}-\d{2}-\d{2}$/.test(entry.date) && entry.date <= end)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function halfRanges(firstDate, end) {
  const span = DateHelper.getDateRange(firstDate, end).length;
  if (span < 21) return null;
  if (span >= 50) {
    return {
      early: { start: firstDate, end: DateHelper.addDays(firstDate, 29) },
      late: { start: DateHelper.addDays(end, -29), end },
      span
    };
  }
  const mid = Math.floor(span / 2);
  return {
    early: { start: firstDate, end: DateHelper.addDays(firstDate, mid - 1) },
    late: { start: DateHelper.addDays(firstDate, mid), end },
    span
  };
}

function describeChange(early, late) {
  if (!early || !late || early <= 0) return null;
  const ratio = late / early;
  if (ratio >= 1.8) return { ratio, word: 'doublé' };
  if (ratio >= 1.25) return { ratio, word: 'monté' };
  if (ratio <= 0.75) return { ratio, word: 'baissé' };
  return null;
}

function buildJourneyCard(snapshot, history, config, end) {
  const adHoc = history.filter((row) => row.adHoc);
  if (adHoc.length === 0) return null;
  const firstDate = history.reduce((min, row) => (row.dateStr < min ? row.dateStr : min), history[0].dateStr);
  const ranges = halfRanges(firstDate, end);
  if (!ranges) return null;

  const exercises = [...new Set(history.map((row) => row.exerciseId))];
  const claims = [];

  exercises.forEach((exerciseId) => {
    const label = getGtgExerciseLabel(exerciseId, config, {});
    const points = cleanMaxPoints(snapshot, exerciseId, config, end).filter((point) => point.date >= firstDate);
    if (points.length >= 2) {
      const change = describeChange(points[0].reps, points[points.length - 1].reps);
      const apart = DateHelper.getDateRange(points[0].date, points[points.length - 1].date).length;
      if (change && apart >= 21) {
        claims.push({
          exerciseId,
          label,
          kind: 'max',
          change,
          early: points[0],
          late: points[points.length - 1]
        });
      }
    }
    const own = history.filter((row) => row.exerciseId === exerciseId);
    const earlySets = meanPerActiveDay(sliceByDate(own, ranges.early.start, ranges.early.end), () => 1);
    const lateSets = meanPerActiveDay(sliceByDate(own, ranges.late.start, ranges.late.end), () => 1);
    if (earlySets && lateSets) {
      const change = describeChange(earlySets.mean, lateSets.mean);
      if (change) {
        claims.push({
          exerciseId,
          label,
          kind: 'sets',
          change,
          early: { reps: earlySets.mean, date: ranges.early.start, days: earlySets.days },
          late: { reps: lateSets.mean, date: ranges.late.start, days: lateSets.days }
        });
      }
    }
  });

  if (!claims.length) return null;
  claims.sort((a, b) => Math.abs(Math.log(b.change.ratio)) - Math.abs(Math.log(a.change.ratio)));
  const lead = claims[0];
  const ownAdHoc = adHoc.filter((row) => row.exerciseId === lead.exerciseId);
  const ownAll = history.filter((row) => row.exerciseId === lead.exerciseId);
  const adHocReps = ownAdHoc.reduce((sum, row) => sum + row.reps, 0);
  const allReps = ownAll.reduce((sum, row) => sum + row.reps, 0);
  const share = allReps > 0 ? Math.round((adHocReps / allReps) * 100) : 0;
  const earlyAd = sliceByDate(ownAdHoc, ranges.early.start, ranges.early.end);
  const lateAd = sliceByDate(ownAdHoc, ranges.late.start, ranges.late.end);
  const earlyBand = dominantBand(earlyAd);
  const lateBand = dominantBand(lateAd.length ? lateAd : ownAdHoc);
  let hourBit = '';
  if (earlyBand && lateBand && earlyBand.band === lateBand.band) {
    hourBit = ` La plage reste la même depuis le début : ${BAND_LABEL[lateBand.band]}.`;
  } else if (earlyBand && lateBand) {
    hourBit = ` Au début ils se plaçaient ${BAND_LABEL[earlyBand.band]}, plus récemment ${BAND_LABEL[lateBand.band]}.`;
  } else if (lateBand) {
    hourBit = ` Ces passages se placent surtout ${BAND_LABEL[lateBand.band]}.`;
  }

  const other = claims.find((claim) => claim.exerciseId !== lead.exerciseId && claim.change.word !== lead.change.word);
  const otherBit = other
    ? ` ${other.label}, dans l’autre sens, a ${other.change.word === 'baissé' ? 'baissé' : 'monté'} sur la même durée.`
    : '';

  let title;
  let fact;
  if (lead.kind === 'max' && lead.change.word === 'doublé') {
    title = `Les ${lead.label.toLowerCase()} ont à peu près doublé depuis le début du Grease the Groove`;
    fact = `Le repère est passé de ${lead.early.reps} reps le ${formatDayFr(lead.early.date)} à ${lead.late.reps} le ${formatDayFr(lead.late.date)}.`;
  } else if (lead.kind === 'max') {
    title = `Le repère de ${lead.label.toLowerCase()} a ${lead.change.word} depuis le début du Grease the Groove`;
    fact = `Il est passé de ${lead.early.reps} reps le ${formatDayFr(lead.early.date)} à ${lead.late.reps} le ${formatDayFr(lead.late.date)}.`;
  } else if (lead.change.word === 'doublé') {
    title = `Les mini-séries de ${lead.label.toLowerCase()} ont à peu près doublé depuis le début`;
    fact = `Au début, environ ${round1(lead.early.reps)} mini-série(s) par jour actif. Sur la période récente, environ ${round1(lead.late.reps)}.`;
  } else {
    title = `Le rythme des ${lead.label.toLowerCase()} a ${lead.change.word} depuis le début du Grease the Groove`;
    fact = `D’environ ${round1(lead.early.reps)} mini-série(s) par jour actif à ${round1(lead.late.reps)}.`;
  }

  const body = `${fact} Ça couvre la pratique depuis le ${formatDayFr(firstDate)}, pas seulement la fenêtre affichée. Les passages hors planning portent ${share} % des reps de ${lead.label.toLowerCase()} sur toute cette durée (${adHocReps} sur ${allReps}). Ils font partie du volume, ils n’expliquent pas à eux seuls la hausse ou la baisse du repère.${hourBit}${otherBit}`;

  return discovery({
    kind: 'disc_gtg_unplanned_progress',
    nature: 'journey',
    score: 92,
    title,
    body,
    evidence: `${lead.label} · ${lead.kind} · ×${round1(lead.change.ratio)}`,
    metrics: {
      exerciseId: lead.exerciseId,
      ratio: round1(lead.change.ratio),
      adHocShare: share
    }
  });
}

export function buildGtgUnplannedDiscoveries({ snapshot, window, profileQuestionnaireRaw = null } = {}) {
  const end = window?.end;
  const start = window?.start;
  if (!snapshot || !start || !end) return [];
  const gtg = normalizeGtgData(snapshot?.enduranceData?.gtg);
  if (!(gtg.config.selectedIds || []).length && !Object.keys(gtg.days || {}).length) return [];

  const dayKeys = Object.keys(gtg.days || {})
    .filter((key) => /^\d{4}-\d{2}-\d{2}$/.test(key))
    .sort();
  if (!dayKeys.length) return [];
  const ctx = { workoutData: snapshot, profileQuestionnaire: profileQuestionnaireRaw };
  const historyStart = dayKeys[0] < start ? dayKeys[0] : start;
  const history = collectGtgMiniSetHistory(gtg, historyStart, end, ctx);
  if (!history.length) return [];

  const inView = sliceByDate(history, start, end).filter((row) => row.adHoc);
  const plans = new Map();
  const ensurePlan = (dateStr) => {
    if (!plans.has(dateStr)) plans.set(dateStr, buildGtgDayPlan(gtg, dateStr, ctx));
    return plans.get(dateStr);
  };
  inView.forEach((row) => ensurePlan(row.dateStr));
  sliceByDate(history, previousWindow(window)?.start || start, end)
    .filter((row) => row.adHoc)
    .forEach((row) => ensurePlan(row.dateStr));

  const out = [];
  if (inView.length > 0) {
    const judgments = inView.map((row) => judgeRow(row, ensurePlan(row.dateStr)));
    out.push(buildNowCard(inView, judgments));
  }
  const continuity = buildContinuityCard(history, window, plans);
  if (continuity) out.push(continuity);
  const journey = buildJourneyCard(snapshot, history, gtg.config, end);
  if (journey) out.push(journey);
  return out.filter((card) => card?.title && String(card.body || '').length >= 40);
}
