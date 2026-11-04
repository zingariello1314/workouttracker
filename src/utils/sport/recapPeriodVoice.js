/**
 * Voix période, formatters et fabrique de découvertes Recap.
 * Extrait de recapPeriodDiscoveries.js — comportement inchangé.
 */

import { MuscleGroups } from '../../data/workoutProgramEnhanced';
import { SIGNAL_FAMILY_CAPS } from './recapInsightNature';
import { addCalendarDays } from './garminRunningPeriodStats';
import { formatDayFr } from './recapTrainingTimeline';
import { contentClassForKind } from './recapDiscoveryContentClass';
import { withDiscoveryScope } from './recapDiscoveryPeriodScope';

export const PERIOD_QUESTIONS = {
  today: "Qu'est-ce qui caractérise précisément cette séance par rapport à ce que je fais habituellement ?",
  '7d': "Qu'est-ce qui s'est réellement passé cette semaine, et comment se compare-t-elle à mon rythme habituel ?",
  '30d': 'Comment mon entraînement récent évolue-t-il par rapport aux mois précédents ?',
  '3m': 'Quelle trajectoire suis-je réellement en train de construire ?',
  '6m': 'Quelle trajectoire s’est réellement construite sur ces derniers mois ?',
  '1y': 'Quelle trajectoire s’est réellement construite sur cette année ?',
  '2y': 'Quelle trajectoire s’est réellement construite sur ces deux années ?',
  all: 'Quelle trajectoire s’est réellement construite depuis tes premières saisies ?'
};

export const MUSCLE_FR = {
  [MuscleGroups.CHEST]: 'pectoraux',
  [MuscleGroups.BACK]: 'dos',
  [MuscleGroups.SHOULDERS]: 'épaules',
  [MuscleGroups.BICEPS]: 'biceps',
  [MuscleGroups.TRICEPS]: 'triceps',
  [MuscleGroups.FOREARMS]: 'avant-bras',
  [MuscleGroups.GLUTES]: 'fessiers',
  [MuscleGroups.QUADS]: 'quadriceps',
  [MuscleGroups.HAMSTRINGS]: 'ischio-jambiers',
  [MuscleGroups.CALVES]: 'mollets',
  [MuscleGroups.CORE]: 'gainage/tronc',
  [MuscleGroups.NECK]: 'cou',
  [MuscleGroups.ADDUCTORS]: 'adducteurs'
};

export const PUSH_GROUPS = new Set([MuscleGroups.CHEST, MuscleGroups.SHOULDERS, MuscleGroups.TRICEPS]);
export const PULL_GROUPS = new Set([MuscleGroups.BACK, MuscleGroups.BICEPS]);
export const UPPER_GROUPS = new Set([
  MuscleGroups.CHEST,
  MuscleGroups.BACK,
  MuscleGroups.SHOULDERS,
  MuscleGroups.BICEPS,
  MuscleGroups.TRICEPS,
  MuscleGroups.FOREARMS,
  MuscleGroups.NECK
]);
export const LOWER_GROUPS = new Set([
  MuscleGroups.QUADS,
  MuscleGroups.HAMSTRINGS,
  MuscleGroups.CALVES,
  MuscleGroups.GLUTES,
  MuscleGroups.ADDUCTORS,
  MuscleGroups.TIBIALIS_ANTERIOR
]);

/** Plafonds totaux (sport + sommeil) — jamais un plancher. */
export function observationCaps(voiceKey, _discoveries = []) {
  const fam = SIGNAL_FAMILY_CAPS[voiceKey] || SIGNAL_FAMILY_CAPS.week;
  return {
    now: fam.now.sport + fam.now.sleep,
    trajectory: fam.trajectory.sport + fam.trajectory.sleep,
    journey: fam.journey.sport + fam.journey.sleep
  };
}

/** Accord verbal pour « ces N jours » / « cette semaine » / « ce mois ». */
export function periodVerb(thisPeriod, singular, plural) {
  const p = String(thisPeriod || '').toLowerCase();
  if (/\bjours?\b/.test(p) || /\bces\b/.test(p)) return plural;
  return singular;
}

export function muscleLabel(group) {
  return MUSCLE_FR[group] || String(group || '');
}

/** « de ton tronc » / « de ta poussée » — évite « de ta tronc ». */
export function possessiveMuscleShare(familyOrLabel) {
  const label = String(familyOrLabel || '').trim();
  if (!label) return 'de ton travail musculaire';
  if (/^(gainage|tronc|gainage\/tronc|dos|biceps|triceps|core)\b/i.test(label)) {
    return `de ton ${label}`;
  }
  if (/^(poussée|tirage|jambe|épaule|pectoraux)/i.test(label)) {
    return `de ta ${label}`;
  }
  // Labels composés / neutres
  if (/^(les |des )/i.test(label)) return `de ${label}`;
  return `de ton ${label}`;
}

export function periodVoice(period, spanDays) {
  if (period === 'today' || spanDays <= 1) {
    return {
      key: 'today',
      unit: 'séance',
      now: "aujourd'hui",
      thisPeriod: 'cette séance',
      ofPeriod: 'de la séance',
      daysWord: 'journée'
    };
  }
  if (period === '7d' || (spanDays >= 6 && spanDays <= 8)) {
    return {
      key: 'week',
      unit: 'semaine',
      now: 'ces 7 jours',
      thisPeriod: 'ces 7 jours',
      ofPeriod: 'de ces 7 jours',
      daysWord: 'jours'
    };
  }
  if (period === '30d' || (spanDays >= 21 && spanDays <= 40)) {
    return {
      key: 'month',
      unit: 'mois',
      now: 'ce mois',
      thisPeriod: 'ces 30 jours',
      ofPeriod: 'du mois',
      daysWord: 'jours'
    };
  }
  if (
    period === '1y' ||
    period === '2y' ||
    period === 'all' ||
    period === '6m' ||
    spanDays >= 180
  ) {
    const yearish = period === '1y' || spanDays >= 300;
    let thisPeriod = 'ces derniers mois';
    let ofPeriod = 'de la période';
    let now = 'cette période';
    if (period === 'all') {
      thisPeriod = 'l’ensemble du suivi';
      ofPeriod = 'du parcours';
      now = 'sur tout le suivi';
    } else if (period === '2y') {
      thisPeriod = 'ces deux années';
      ofPeriod = 'de ces deux années';
      now = 'sur deux ans';
    } else if (yearish) {
      thisPeriod = 'cette année';
      ofPeriod = "de l'année";
    }
    return {
      key: 'year',
      unit: period === 'all' ? 'parcours' : yearish ? 'année' : 'semestre',
      now,
      thisPeriod,
      ofPeriod,
      daysWord: 'jours'
    };
  }
  return {
    key: 'long',
    unit: 'trimestre',
    now: 'cette période',
    thisPeriod: 'cette période',
    ofPeriod: 'de la période',
    daysWord: 'jours'
  };
}

export function isLongVoice(v) {
  return v.key === 'long' || v.key === 'year';
}

export function agreeEst(v) {
  return /^(ces|les)\b/i.test(String(v?.thisPeriod || '')) ? 'sont' : 'est';
}

export function agreeVerb(v, singular, plural) {
  return /^(ces|les)\b/i.test(String(v?.thisPeriod || '')) ? plural : singular;
}

export function agreePorteLabel(cappedLabel) {
  return /^(Les|Des)\b/i.test(String(cappedLabel || '')) ? 'portent' : 'porte';
}

export function weekdayFr(ymd) {
  const [y, m, d] = String(ymd || '').split('-').map(Number);
  if (!y || !m || !d) return '';
  return ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'][
    new Date(y, m - 1, d).getDay()
  ];
}

export function lastCatalogSession(catalog, beforeYmd) {
  const list = (catalog || []).filter((s) => s.date < beforeYmd && (s.totalReps || 0) >= 20);
  return list.length ? list[list.length - 1] : null;
}

export function sameWeekdaySessions(catalog, ymd, beforeYmd) {
  const wd = weekdayFr(ymd);
  if (!wd) return [];
  return (catalog || []).filter(
    (s) => s.date < beforeYmd && weekdayFr(s.date) === wd && (s.totalReps || 0) >= 20
  );
}

export function muscleAvecArticle(label) {
  const l = String(label || '');
  if (/^(dos|cou|gainage)$/i.test(l)) return `le ${l}`;
  return `les ${l}`;
}

export function capLabel(label) {
  const withArticle = muscleAvecArticle(label);
  return withArticle.charAt(0).toUpperCase() + withArticle.slice(1);
}

export function musclePortrait(p) {
  if (!p?.muscles?.length) return '';
  const top = p.muscles.slice(0, 5);
  const list = top.map((m) => `${fmtInt(m.reps)} ${m.label}`).join(', ');
  const identified = p.identifiedMuscleReps || top.reduce((s, m) => s + (m.reps || 0), 0);
  const leadShare = share(top[0].reps, identified);
  const pullShare = share(p.byMuscle?.[MuscleGroups.BACK]?.reps || 0, p.totalReps);
  let s = ` Dominante haut du corps : ${list}`;
  if (leadShare != null) s += ` — ${top[0].label} ≈${fmtPct(leadShare)} du volume identifié`;
  if (pullShare != null) s += `, tirage ≈${fmtPct(pullShare)}`;
  return `${s}.`;
}

export function peakPortrait(p, v) {
  if (!p?.peakDay || (p.trainingDays || 0) < 2 || (p.peakDay.sharePct || 0) < 22) return '';
  const ex = (p.peakDay.exercises || []).slice(0, 3);
  const exBit = ex.length
    ? ` (${ex.map((e) => `${fmtInt(e.reps)} ${String(e.name || '').toLowerCase()}`).join(', ')})`
    : '';
  return ` La séance du ${formatDayFr(p.peakDay.date, true)} concentre ${fmtInt(p.peakDay.reps)} reps, soit ≈${fmtPct(p.peakDay.sharePct)} ${v.ofPeriod}${exBit}.`;
}

export function runPortrait(p) {
  if ((p.runningKm || 0) > 0.3 || (p.runningMinutes || 0) > 4) {
    return ` Course : ${fmt1(p.runningKm)} km${p.runningMinutes ? ` en ${formatDurationFr(p.runningMinutes)}` : ''}.`;
  }
  if ((p.totalReps || 0) >= 80) return " Aucune course : la charge est entièrement du renforcement.";
  return '';
}

export function kcalPortrait(p) {
  if ((p.activeKcal || 0) < 400 || (p.trainingDays || 0) < 1) return '';
  return ` ${fmtInt(p.activeKcal)} kcal actives sur ${p.trainingDays} journée${p.trainingDays > 1 ? 's' : ''} entraînée${p.trainingDays > 1 ? 's' : ''}.`;
}

export function periodPortraitTail(p, v) {
  return `${musclePortrait(p)}${peakPortrait(p, v)}${runPortrait(p)}${kcalPortrait(p)}`;
}

/** La fenêtre étroite est confirmée ou relativisée par la fenêtre juste au-dessus. */
export function continuityTail(v, p, d7, d30) {
  if (v.key === 'today' && (d7?.totalReps || 0) >= 80) {
    return ` Ces 7 jours (${fmtInt(d7.totalReps)} reps, ${d7.trainingDays} séances) sont le cadre qui confirme ou relativise la séance.`;
  }
  if (v.key === 'week' && (d30?.totalReps || 0) >= 200 && (p?.totalReps || 0) > 0) {
    const of = share(p.totalReps, d30.totalReps);
    if (of == null) return '';
    return ` Ces 7 jours portent ${fmtPct(of)} des ${fmtInt(d30.totalReps)} reps des 30 derniers jours : la semaine ${of >= 40 ? 'confirme un mois déjà chargé' : 'ne résume pas le mois'}.`;
  }
  if (v.key === 'month' && (d7?.totalReps || 0) >= 80 && (p?.totalReps || 0) > 0) {
    const of = share(d7.totalReps, p.totalReps);
    if (of == null) return '';
    return ` Les 7 derniers jours (${fmtInt(d7.totalReps)} reps) représentent ${fmtPct(of)} de ce mois : ils ${of >= 35 ? 'confirment une accélération récente' : 'ne portent pas seuls le mois'}.`;
  }
  if ((v.key === 'long' || v.key === 'year') && (d30?.totalReps || 0) >= 200 && (p?.totalReps || 0) > d30.totalReps) {
    const of = share(d30.totalReps, p.totalReps);
    if (of == null) return '';
    return ` Les 30 derniers jours (${fmtInt(d30.totalReps)} reps) représentent ${fmtPct(of)} de ${v.thisPeriod} : ils ${of >= 45 ? 'confirment que la fin de période porte le volume' : 'ne résument pas toute la fenêtre'}.`;
  }
  return '';
}

export function fmtInt(n) {
  return Math.round(Number(n) || 0).toLocaleString('fr-FR');
}

export function fmt1(n) {
  const v = Math.round((Number(n) || 0) * 10) / 10;
  return String(v).replace('.', ',');
}

export function mean(nums) {
  const v = (nums || []).filter((n) => Number.isFinite(n));
  if (!v.length) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}

export function fmtPct(n, digits = 1) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '';
  const abs = Math.abs(v).toFixed(digits).replace('.', ',');
  return `${abs} %`;
}

export function fmtSignedPct(n, digits = 1) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '';
  const sign = v > 0 ? '+' : v < 0 ? '−' : '';
  return `${sign}${fmtPct(Math.abs(v), digits)}`;
}

export function formatDurationFr(minutes) {
  const m = Math.max(0, Math.round(Number(minutes) || 0));
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (r === 0) return `${h} h`;
  return `${h} h ${String(r).padStart(2, '0')}`;
}

export function pctChange(now, then) {
  const a = Number(now);
  const b = Number(then);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null;
  return ((a - b) / Math.abs(b)) * 100;
}

export function share(part, whole) {
  const a = Number(part);
  const b = Number(whole);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= 0) return null;
  return (a / b) * 100;
}

export function windowFromEnd(endYmd, spanDays) {
  return {
    start: addCalendarDays(endYmd, -(spanDays - 1)),
    end: endYmd
  };
}

export function refFromYmd(ymd) {
  const [y, m, d] = String(ymd).split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function dayCheckedReps(grouped, dateStr) {
  let total = 0;
  grouped.forEach(({ reps: r }, gkey) => {
    if (!gkey.startsWith(`${dateStr}::`)) return;
    total += Math.max(0, Math.floor(Number(r) || 0));
  });
  return total;
}

export function scoreOf({ importance, reliability, novelty, fit }) {
  return Math.round((importance || 0) * (reliability || 0) * (novelty || 0) * (fit || 0) * 100);
}

export function coerceEvidenceLine(evidence) {
  if (evidence == null || evidence === '') return '';
  if (typeof evidence === 'string') return evidence;
  if (Array.isArray(evidence)) {
    return evidence
      .map((x) => coerceEvidenceLine(x))
      .filter(Boolean)
      .join(' · ');
  }
  if (typeof evidence === 'object') {
    const parts = [];
    for (const [k, v] of Object.entries(evidence)) {
      if (k === 'phase' || v == null) continue;
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
        parts.push(String(v));
      } else if (typeof v === 'object' && (v.name || v.label || v.title)) {
        parts.push(String(v.name || v.label || v.title));
      }
    }
    return parts.join(' · ');
  }
  return String(evidence);
}

export function discovery(partial) {
  const score = partial.score != null ? partial.score : scoreOf(partial.weights || {});
  const contentClass =
    partial.contentClass ||
    partial.metrics?.contentClass ||
    contentClassForKind(partial.kind);
  return withDiscoveryScope({
    id: partial.id || partial.kind,
    kind: partial.kind,
    nature: partial.nature,
    family: partial.family,
    contentClass,
    score,
    title: partial.title,
    body: partial.body,
    evidence: coerceEvidenceLine(partial.evidence),
    relevance: Math.min(0.995, 0.88 + score / 900),
    metrics: { ...(partial.metrics || {}), contentClass },
    ...(partial.scope ? { scope: partial.scope } : {})
  });
}
