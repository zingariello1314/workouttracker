/**
 * Moteur événementiel / jalons — complémentaire du moteur analytique.
 * Les jalons n'occupent que des slots extra : ils n'évincient pas volume_shape.
 *
 * « Longtemps » = classes calendaires ET écart / intervalle habituel.
 */

import { daysBetweenYmd, formatDayFr, isRunningLikeName } from './recapTrainingTimeline';
import { addCalendarDays } from './garminRunningPeriodStats';
import { aggregateGtgRepsByDate } from '../../services/endurance/gtgService';
import { familyOfExercise, tallyStimulus } from './recapStimulusCatalog';
import { formatSleepHoursFr } from './recapSleepCorrelation';
import {
  extractDateStrFromWorkoutKey,
  extractExerciseIdFromWorkoutKey
} from '../exerciseKeyGenerator';

export const REP_CUMUL_THRESHOLDS = [100, 500, 1000, 5000, 10000, 25000, 50000, 100000];
export const SESSION_THRESHOLDS = [10, 25, 50, 100, 250, 500];
export const DAY_VOLUME_THRESHOLDS = [300, 500];
export const KM_THRESHOLDS = [10, 50, 100, 250, 500];
export const HOUR_THRESHOLDS = [10, 25, 50, 100, 250];

const RUN_GOAL_DIST = {
  '5k': { km: 5, label: '5 km' },
  '10k': { km: 10, label: '10 km' },
  half_marathon: { km: 21.1, label: 'semi-marathon' },
  marathon: { km: 42.2, label: 'marathon' }
};

export function isMilestoneKind(kind) {
  return String(kind || '').startsWith('disc_ms_');
}

export function absenceClass(gapDays) {
  const g = Number(gapDays);
  if (!Number.isFinite(g) || g < 14) return null;
  if (g <= 30) return { key: 'eloigne', label: 'éloignée' };
  if (g <= 60) return { key: 'longue', label: 'longue' };
  if (g <= 120) return { key: 'tres_longue', label: 'très longue' };
  if (g <= 365) return { key: 'historique', label: 'historique' };
  return { key: 'retour_historique', label: 'un retour historique' };
}

export function isMeaningfulAbsence(gapDays, medianInterval) {
  const g = Number(gapDays);
  if (!Number.isFinite(g) || g < 14) return false;
  const med = Number(medianInterval);
  if (Number.isFinite(med) && med >= 7) {
    const ratio = g / med;
    if (ratio < 2.2) return false;
    return ratio >= 2.5 || g >= 60;
  }
  return g >= 31;
}

function median(nums) {
  const v = (nums || []).filter((n) => Number.isFinite(n)).slice().sort((a, b) => a - b);
  if (!v.length) return null;
  const mid = Math.floor(v.length / 2);
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2;
}

function mean(nums) {
  const v = (nums || []).filter((n) => Number.isFinite(n));
  if (!v.length) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}

function fmtInt(n) {
  return Math.round(Number(n) || 0).toLocaleString('fr-FR');
}

function fmt1(n) {
  const v = Math.round((Number(n) || 0) * 10) / 10;
  return String(v).replace('.', ',');
}

function fmtPct(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return '';
  return `${Math.abs(v).toFixed(0)} %`;
}

function inWindow(date, window) {
  if (!date || !window?.start || !window?.end) return false;
  return date >= window.start && date <= window.end;
}

function medianInterval(dates) {
  if (!dates || dates.length < 2) return null;
  const gaps = [];
  for (let i = 1; i < dates.length; i += 1) {
    const g = daysBetweenYmd(dates[i - 1], dates[i]);
    if (g != null && g >= 1) gaps.push(g);
  }
  return median(gaps);
}

function activityYmd(act) {
  const raw = act?.date || act?.startTime || act?.startDate || act?.calendarDate;
  const s = String(raw || '').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

function activityKm(act) {
  const n = Number(act?.distanceKm ?? act?.km ?? act?.distance);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return n > 80 ? n / 1000 : n;
}

function activityMinutes(act) {
  const n = Number(act?.durationMin ?? act?.minutes ?? act?.movingTime);
  if (Number.isFinite(n) && n > 0) return n > 24 * 60 ? n / 60 : n;
  const sec = Number(act?.duration ?? act?.elapsedTime);
  return Number.isFinite(sec) && sec > 0 ? sec / 60 : 0;
}

export function collectRunTimeline(snapshot, garminData) {
  const byDate = new Map();
  const bump = (date, km, minutes) => {
    if (!date || (km < 0.6 && minutes < 8)) return;
    const row = byDate.get(date) || { date, km: 0, minutes: 0 };
    row.km += km || 0;
    row.minutes += minutes || 0;
    byDate.set(date, row);
  };
  (garminData?.activities?.cardio || []).forEach((act) => {
    const blob = `${act?.type || ''} ${act?.activityType || ''} ${act?.name || ''}`.toLowerCase();
    if (/walk|marche|hike|strength|muscu/.test(blob) && !/run|course|trail/.test(blob)) return;
    if (!/run|course|trail|jogging/.test(blob) && !isRunningLikeName(act?.name)) return;
    bump(activityYmd(act), activityKm(act), activityMinutes(act));
  });
  const endurance = snapshot?.enduranceData || {};
  const sessions = [
    ...(Array.isArray(endurance.sessions?.running) ? endurance.sessions.running : []),
    ...(Array.isArray(endurance.runningSessions) ? endurance.runningSessions : [])
  ];
  sessions.forEach((s) => {
    const ymd = activityYmd(s);
    const km = Number(s?.distanceKm ?? s?.distance ?? s?.km) || 0;
    const min = Number(s?.durationMin ?? s?.minutes) || 0;
    if (isRunningLikeName(s?.name) || km >= 0.8) bump(ymd, km, min);
  });
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function gtgDates(snapshot) {
  const map = aggregateGtgRepsByDate(snapshot?.enduranceData?.gtg || {}, {});
  return [...map.entries()]
    .filter(([, reps]) => Number(reps) > 0)
    .map(([date, reps]) => ({ date, reps: Number(reps) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function weightSeries(snapshot) {
  const raw = snapshot?.progressEntries;
  const list = Array.isArray(raw) ? raw : Object.values(raw || {});
  return list
    .map((e) => {
      const date = String(e?.date || e?.ymd || '').slice(0, 10);
      const w = Number(e?.weight ?? e?.weightKg);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(w) || w < 35 || w > 250) return null;
      return { date, weight: w };
    })
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function row(partial) {
  return {
    importance: 0.9,
    ...partial
  };
}

function eligible(date, window, voiceKey, { firstAbsolute = false } = {}) {
  if (!inWindow(date, window)) return false;
  if (voiceKey === 'today') return date === window.end;
  if (voiceKey === 'week') return true;
  if (voiceKey === 'month') return firstAbsolute ? date === window.end || daysBetweenYmd(date, window.end) <= 10 : true;
  if (firstAbsolute) return daysBetweenYmd(date, window.end) <= 21;
  return true;
}

function normName(name) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function isPullupLikeName(name, { strict = false } = {}) {
  const n = normName(name);
  if (!n) return false;
  if (/australien/.test(n)) return !strict;
  return /traction|pull[\s-]?up|chin/.test(n);
}

export function sessionDensity(s) {
  const min = Number(s?.minutes);
  const reps = Number(s?.totalReps);
  if (!Number.isFinite(min) || min < 25 || !Number.isFinite(reps) || reps < 80) return null;
  return (reps / min) * 60;
}

export function formatPaceFr(minPerKm) {
  const n = Number(minPerKm);
  if (!Number.isFinite(n) || n <= 0 || n > 20) return '';
  const totalSec = Math.round(n * 60);
  const mm = Math.floor(totalSec / 60);
  const ss = totalSec % 60;
  return `${mm} min ${String(ss).padStart(2, '0')} s/km`;
}

function nightHours(s) {
  const h = Number(s?.night?.hours ?? s?.sleepHours);
  return Number.isFinite(h) && h >= 1.5 ? h : null;
}

function nightEfficiency(s) {
  const e = Number(s?.night?.efficiency ?? s?.efficiency);
  return Number.isFinite(e) && e >= 40 && e <= 100 ? e : null;
}

function answersFrom(profileQuestionnaireRaw, snapshot) {
  const raw =
    profileQuestionnaireRaw ||
    snapshot?.profileQuestionnaireRaw ||
    snapshot?.profileQuestionnaire ||
    null;
  if (!raw) return {};
  if (raw.answers && typeof raw.answers === 'object') return raw.answers;
  return raw;
}

const GOAL_TARGETS = {
  first_pullup: { target: 1, label: 'première traction stricte', strict: false },
  pullups_10: { target: 10, label: '10 tractions', strict: true },
  pullups_20: { target: 20, label: '20 tractions', strict: true }
};

/**
 * Objectif chiffré publiable. Silence s'il n'y a ni skill street ni palier max.
 */
export function resolveMilestoneGoal(profileQuestionnaireRaw, snapshot) {
  const answers = answersFrom(profileQuestionnaireRaw, snapshot);
  const skill = String(answers.streetSkillGoal || '').trim();
  if (GOAL_TARGETS[skill]) {
    return { skill, ...GOAL_TARGETS[skill] };
  }
  const pullMax = Number(answers.strengthBaselineMaxes?.pullupsMax);
  if (!Number.isFinite(pullMax) || pullMax <= 0) return null;
  if (pullMax < 10) return { skill: 'pull_ladder', target: 10, label: '10 tractions', strict: true };
  if (pullMax < 20) return { skill: 'pull_ladder', target: 20, label: '20 tractions', strict: true };
  return null;
}

function pullupSessionMaxes(sessions, { strict = true } = {}) {
  const byDate = new Map();
  (sessions || []).forEach((s) => {
    let best = 0;
    let name = '';
    (s.exercises || []).forEach((e) => {
      if (!isPullupLikeName(e.name, { strict })) return;
      const r = Number(e.reps) || 0;
      if (r > best) {
        best = r;
        name = e.name;
      }
    });
    if (best < 1) return;
    const prev = byDate.get(s.date);
    if (!prev || best > prev.reps) byDate.set(s.date, { date: s.date, reps: best, name: name || 'Tractions', session: s });
  });
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function flattenMeasure(sessionList) {
  const exercises = [];
  (sessionList || []).forEach((s) => {
    (s.exercises || []).forEach((e) => exercises.push(e));
  });
  return { exercises };
}

const FAM_FR = {
  tirage: 'tirage',
  poussée: 'poussée',
  jambes: 'jambes',
  tronc: 'gainage'
};

/**
 * @returns {object[]} jalons rédigés, pas encore scorés comme discoveries
 */
export function detectRecapMilestones({
  snapshot = {},
  window = null,
  catalog = [],
  garminData = null,
  getExerciseNameById = null,
  voiceKey = 'week',
  profileQuestionnaireRaw = null
} = {}) {
  if (!window?.start || !window?.end) return [];
  const out = [];
  const sessions = (catalog || []).filter((s) => (s.totalReps || 0) >= 20).sort((a, b) => a.date.localeCompare(b.date));
  const nameOf = (id, fallback) => {
    const n = parseInt(String(id), 10);
    if (typeof getExerciseNameById === 'function') {
      const label = getExerciseNameById(Number.isFinite(n) ? n : id);
      if (label?.trim()) return label.trim();
    }
    return fallback || `Exercice ${id}`;
  };

  if (sessions[0] && eligible(sessions[0].date, window, voiceKey, { firstAbsolute: true })) {
    const first = sessions[0];
    out.push(
      row({
        kind: 'disc_ms_first_session',
        nature: 'now',
        family: 'ms_first',
        type: 'FIRST_SESSION',
        date: first.date,
        title: 'Première séance enregistrée dans Momentum',
        body: `Première séance enregistrée dans Momentum : ${
          first.minutes >= 15 ? `${fmtInt(first.minutes)} minutes d'entraînement` : `${fmtInt(first.totalReps)} répétitions`
        }. Ce point devient la première référence de ton historique de pratique.`,
        evidence: `${formatDayFr(first.date, true)} · ${fmtInt(first.totalReps)} reps`,
        importance: 0.99
      })
    );
  }

  const firstByEx = new Map();
  sessions.forEach((s) => {
    (s.exercises || []).forEach((e) => {
      const id = String(e.id);
      if (!firstByEx.has(id) || s.date < firstByEx.get(id).date) {
        firstByEx.set(id, { date: s.date, reps: e.reps, name: e.name || nameOf(id), id });
      }
    });
  });
  const newEx = [...firstByEx.values()]
    .filter((e) => eligible(e.date, window, voiceKey, { firstAbsolute: true }) && (e.reps || 0) >= 8)
    .sort((a, b) => (b.reps || 0) - (a.reps || 0));
  if (newEx[0]) {
    const e = newEx[0];
    const day = sessions.find((s) => s.date === e.date);
    const pushReps = (day?.exercises || []).reduce((s, x) => s + (x.reps || 0), 0);
    const share = pushReps > 0 ? (e.reps / pushReps) * 100 : null;
    out.push(
      row({
        kind: 'disc_ms_first_exercise',
        nature: voiceKey === 'today' ? 'now' : 'trajectory',
        family: 'ms_first',
        type: 'FIRST_EXERCISE',
        date: e.date,
        title: `Première apparition : ${e.name}`,
        body: `Première apparition ${e.name.startsWith('Les ') || e.name.startsWith('Traction') ? `des ${e.name.toLowerCase()}` : `de ${e.name.toLowerCase()}`} dans ton historique.${
          share != null && share >= 8
            ? ` ${share >= 10 ? `Ils représentent déjà ${fmtPct(share)} de ton volume de séance ce jour-là.` : ''}`
            : ` Cette séance devient la référence initiale de ce mouvement.`
        }`,
        evidence: `${formatDayFr(e.date, true)} · ${fmtInt(e.reps)} reps`,
        importance: 0.88
      })
    );
  }

  const runs = collectRunTimeline(snapshot, garminData);
  if (runs[0] && eligible(runs[0].date, window, voiceKey, { firstAbsolute: true })) {
    const r = runs[0];
    out.push(
      row({
        kind: 'disc_ms_first_run',
        nature: 'now',
        family: 'ms_first',
        type: 'FIRST_RUN',
        date: r.date,
        title: 'Première course enregistrée',
        body: `Première course enregistrée${r.km >= 0.8 ? ` : ${fmt1(r.km)} km${r.minutes >= 8 ? ` en ${fmtInt(r.minutes)} min` : ''}` : ''}. Cette sortie devient la référence initiale de ta progression en course.`,
        evidence: `${formatDayFr(r.date, true)}${r.km >= 0.8 ? ` · ${fmt1(r.km)} km` : ''}`,
        importance: 0.96
      })
    );
  } else if (runs.length >= 2) {
    const last = runs[runs.length - 1];
    const prev = runs[runs.length - 2];
    const gap = daysBetweenYmd(prev.date, last.date);
    const med = medianInterval(runs.slice(0, -1).map((x) => x.date));
    if (eligible(last.date, window, voiceKey) && isMeaningfulAbsence(gap, med)) {
      const cls = absenceClass(gap);
      const prior = runs.slice(0, -1).slice(-10);
      const avgKm = mean(prior.map((x) => x.km).filter((n) => n >= 0.8));
      const vs = avgKm > 0 && last.km >= 0.8 ? (last.km / avgKm) * 100 : null;
      const ratio = med >= 1 ? gap / med : null;
      out.push(
        row({
          kind: 'disc_ms_return_run',
          nature: 'now',
          family: 'ms_return',
          type: 'RUN_RETURN',
          date: last.date,
          title: `Tu reprends la course après ${fmtInt(gap)} jours`,
          body: `Tu viens de reprendre la course après ${fmtInt(gap)} jours sans sortie enregistrée${
            cls ? ` (${cls.label} absence)` : ''
          }.${
            ratio != null && ratio >= 2.5
              ? ` Cette absence représente plus de ${fmt1(ratio)} fois ton intervalle habituel entre deux courses.`
              : ''
          }${
            vs != null
              ? ` Avec ${fmt1(last.km)} km, tu reviens à ${fmtPct(vs)} de ta distance moyenne sur tes ${prior.length} dernières sorties avant l'interruption.`
              : ''
          }`,
          evidence: `${fmtInt(gap)} j.${med != null ? ` · habitude ~${fmtInt(med)} j.` : ''}`,
          importance: 0.94
        })
      );
    }
  }

  const returns = [];
  firstByEx.forEach((first, id) => {
    const dates = [];
    const byDate = [];
    sessions.forEach((s) => {
      const hit = (s.exercises || []).find((e) => String(e.id) === id);
      if (hit && hit.reps >= 6) {
        dates.push(s.date);
        byDate.push({ date: s.date, reps: hit.reps, name: hit.name || first.name });
      }
    });
    if (dates.length < 2) return;
    const last = byDate[byDate.length - 1];
    const prev = byDate[byDate.length - 2];
    const gap = daysBetweenYmd(prev.date, last.date);
    const med = medianInterval(dates.slice(0, -1));
    if (!eligible(last.date, window, voiceKey) || !isMeaningfulAbsence(gap, med)) return;
    const prior = byDate.slice(0, -1).slice(-8);
    const avg = mean(prior.map((x) => x.reps));
    const vs = avg > 0 ? (last.reps / avg) * 100 : null;
    const ratio = med >= 1 ? gap / med : null;
    returns.push({
      gap,
      ratio: ratio || 0,
      kind: 'disc_ms_return',
      nature: 'now',
      family: 'ms_return',
      type: 'EXERCISE_FIRST_RETURN',
      date: last.date,
      title: `Tu reprends ${last.name} après ${fmtInt(gap)} jours d'absence`,
      body: `Tu viens d'enregistrer ta première séance depuis ${fmtInt(gap)} jours sur ${last.name.toLowerCase()}.${
        ratio != null && ratio >= 2.5
          ? ` L'écart dépasse ${fmt1(ratio)} fois ton intervalle habituel.`
          : ''
      }${
        vs != null
          ? ` Avec ${fmtInt(last.reps)} répétitions, tu reviens à ${fmtPct(vs)} de ton volume moyen avant l'interruption.`
          : ''
      }`,
      evidence: `${fmtInt(gap)} j. · ${fmtInt(last.reps)} reps`,
      importance: 0.93
    });
  });
  returns.sort((a, b) => b.gap * 10 + b.ratio - (a.gap * 10 + a.ratio));
  if (returns[0] && !out.some((m) => m.family === 'ms_return')) out.push(row(returns[0]));

  const gtg = gtgDates(snapshot);
  if (gtg.length >= 2) {
    const last = gtg[gtg.length - 1];
    const prev = gtg[gtg.length - 2];
    const gap = daysBetweenYmd(prev.date, last.date);
    const med = medianInterval(gtg.slice(0, -1).map((x) => x.date));
    if (eligible(last.date, window, voiceKey) && isMeaningfulAbsence(gap, med)) {
      const longest = [];
      for (let i = 1; i < gtg.length; i += 1) longest.push(daysBetweenYmd(gtg[i - 1].date, gtg[i].date) || 0);
      const maxGap = Math.max(0, ...longest);
      const prior = gtg.slice(0, -1).slice(-8);
      const avg = mean(prior.map((x) => x.reps));
      out.push(
        row({
          kind: 'disc_ms_return_gtg',
          nature: 'now',
          family: 'ms_return',
          type: 'GTG_RETURN',
          date: last.date,
          title: `Premier GTG depuis ${fmtInt(gap)} jours`,
          body: `Premier GTG enregistré depuis ${fmtInt(gap)} jours.${
            gap >= maxGap - 1 ? ' Cette reprise met fin à ta plus longue interruption de pratique du GTG.' : ''
          }${
            avg > 0
              ? ` La reprise représente ${fmtInt(last.reps)} répétitions, contre ${fmtInt(avg)} lors de ta dernière période régulière.`
              : ''
          }`,
          evidence: `${fmtInt(gap)} j. · ${fmtInt(last.reps)} reps GTG`,
          importance: 0.92
        })
      );
    }
  } else if (gtg[0] && eligible(gtg[0].date, window, voiceKey, { firstAbsolute: true })) {
    out.push(
      row({
        kind: 'disc_ms_return_gtg',
        nature: 'now',
        family: 'ms_first',
        type: 'FIRST_GTG',
        date: gtg[0].date,
        title: 'Premier GTG enregistré',
        body: `Premier GTG enregistré dans Momentum : ${fmtInt(gtg[0].reps)} répétitions. Cette séance devient la référence initiale de ta pratique GTG.`,
        evidence: `${formatDayFr(gtg[0].date, true)} · ${fmtInt(gtg[0].reps)} reps`,
        importance: 0.9
      })
    );
  }

  DAY_VOLUME_THRESHOLDS.forEach((cut) => {
    const first = sessions.find((s) => (s.totalReps || 0) >= cut);
    if (!first || !eligible(first.date, window, voiceKey, { firstAbsolute: true })) return;
    if (out.some((m) => m.kind === 'disc_ms_day_volume')) return;
    out.push(
      row({
        kind: 'disc_ms_day_volume',
        nature: 'now',
        family: 'ms_threshold',
        type: 'FIRST_DAY_VOLUME',
        date: first.date,
        title: `Première journée au-dessus de ${fmtInt(cut)} répétitions`,
        body: `Première journée au-dessus de ${fmtInt(cut)} répétitions : tu franchis ${
          first.date === window.end ? "aujourd'hui" : `le ${formatDayFr(first.date, true)}`
        } un volume jamais atteint auparavant sur une seule journée (${fmtInt(first.totalReps)} reps).`,
        evidence: `${fmtInt(first.totalReps)} reps · seuil ${fmtInt(cut)}`,
        importance: cut >= 500 ? 0.95 : 0.9
      })
    );
  });

  const hourFirst = sessions.find((s) => (s.minutes || 0) >= 60);
  if (hourFirst && eligible(hourFirst.date, window, voiceKey, { firstAbsolute: true })) {
    out.push(
      row({
        kind: 'disc_ms_first_hour',
        nature: 'now',
        family: 'ms_first',
        type: 'FIRST_HOUR',
        date: hourFirst.date,
        title: "Première séance d'au moins une heure",
        body: `Première séance d'au moins une heure enregistrée (${fmtInt(hourFirst.minutes)} min, ${fmtInt(hourFirst.totalReps)} reps). Ce n'est pas seulement plus de volume : c'est une durée de séance que tu n'avais pas encore tenue.`,
        evidence: `${fmtInt(hourFirst.minutes)} min`,
        importance: 0.86
      })
    );
  }

  let cumul = 0;
  let sessCount = 0;
  const seenCumul = new Set();
  const seenSess = new Set();
  sessions.forEach((s) => {
    cumul += s.totalReps || 0;
    sessCount += 1;
    REP_CUMUL_THRESHOLDS.forEach((th) => {
      if (seenCumul.has(th) || cumul < th || cumul - (s.totalReps || 0) >= th) return;
      if (!eligible(s.date, window, voiceKey)) return;
      seenCumul.add(th);
      out.push(
        row({
          kind: 'disc_ms_cumul',
          nature: voiceKey === 'today' || voiceKey === 'week' ? 'now' : 'journey',
          family: 'ms_threshold',
          type: 'CUMUL_REPS',
          date: s.date,
          title: `Tu viens de dépasser ${fmtInt(th)} répétitions cumulées`,
          body: `Tu viens de dépasser ${fmtInt(th)} répétitions cumulées depuis ta première saisie. Ces ${fmtInt(th)} répétitions ont été réalisées en ${fmtInt(sessCount)} séances, soit une moyenne de ${fmtInt(th / Math.max(1, sessCount))} reps par séance.`,
          evidence: `${fmtInt(cumul)} reps · ${fmtInt(sessCount)} séances`,
          importance: th >= 10000 ? 0.97 : 0.9
        })
      );
    });
    SESSION_THRESHOLDS.forEach((th) => {
      if (seenSess.has(th) || sessCount !== th) return;
      if (!eligible(s.date, window, voiceKey)) return;
      seenSess.add(th);
      out.push(
        row({
          kind: 'disc_ms_sessions',
          nature: 'journey',
          family: 'ms_threshold',
          type: 'CUMUL_SESSIONS',
          date: s.date,
          title: `${fmtInt(th)}e séance enregistrée`,
          body: `${fmtInt(th)}e séance enregistrée dans Momentum. Le jalon n'est pas un compteur isolé : tu as accumulé ${fmtInt(cumul)} répétitions pour y parvenir, soit environ ${fmtInt(cumul / th)} reps par séance.`,
          evidence: `${fmtInt(th)} séances · ${fmtInt(cumul)} reps`,
          importance: th >= 50 ? 0.94 : 0.86
        })
      );
    });
  });

  let runCumul = 0;
  const seenKm = new Set();
  runs.forEach((r) => {
    runCumul += r.km || 0;
    KM_THRESHOLDS.forEach((th) => {
      if (seenKm.has(th) || runCumul < th || runCumul - (r.km || 0) >= th) return;
      if (!eligible(r.date, window, voiceKey)) return;
      seenKm.add(th);
      out.push(
        row({
          kind: 'disc_ms_km',
          nature: 'journey',
          family: 'ms_threshold',
          type: 'CUMUL_KM',
          date: r.date,
          title: `${fmtInt(th)} km cumulés en course`,
          body: `Tu viens de franchir ${fmtInt(th)} km cumulés en course. Le jalon se lit avec tes ${runs.filter((x) => x.date <= r.date).length} sorties enregistrées, pas seulement le dernier GPS.`,
          evidence: `${fmt1(runCumul)} km`,
          importance: 0.9
        })
      );
    });
  });

  let minCumul = 0;
  let hourSess = 0;
  const seenHours = new Set();
  sessions.forEach((s) => {
    minCumul += Number(s.minutes) || 0;
    hourSess += 1;
    HOUR_THRESHOLDS.forEach((th) => {
      const hours = minCumul / 60;
      const prevH = (minCumul - (Number(s.minutes) || 0)) / 60;
      if (seenHours.has(th) || hours < th || prevH >= th) return;
      if (!eligible(s.date, window, voiceKey)) return;
      seenHours.add(th);
      out.push(
        row({
          kind: 'disc_ms_hours',
          nature: 'journey',
          family: 'ms_threshold',
          type: 'CUMUL_HOURS',
          date: s.date,
          title: `${fmtInt(th)} heures d'entraînement cumulées`,
          body: `Tu viens de franchir ${fmtInt(th)} heures d'entraînement enregistrées. Ce n'est pas seulement plus de répétitions : c'est du temps réellement passé à t'entraîner, cumulé séance après séance.`,
          evidence: `${fmt1(hours)} h · ${fmtInt(hourSess)} séances`,
          importance: th >= 100 ? 0.95 : 0.88
        })
      );
    });
  });

  const prs = [];
  firstByEx.forEach((first, id) => {
    const series = [];
    sessions.forEach((s) => {
      const hit = (s.exercises || []).find((e) => String(e.id) === id);
      if (hit && hit.reps >= 3) series.push({ date: s.date, reps: hit.reps, name: hit.name || first.name });
    });
    if (series.length < 3) return;
    const last = series[series.length - 1];
    if (!eligible(last.date, window, voiceKey)) return;
    const priorMax = Math.max(...series.slice(0, -1).map((x) => x.reps));
    if (last.reps <= priorMax) {
      const recent = series.slice(-5);
      const atPeak = recent.filter((x) => x.reps >= priorMax && priorMax >= 5).length;
      if (atPeak >= 3 && priorMax >= last.reps && voiceKey !== 'today') {
        prs.push({
          kind: 'disc_ms_pr_consolidated',
          nature: 'trajectory',
          family: 'ms_pr',
          type: 'PR_CONSOLIDATED',
          date: last.date,
          title: `Le record de ${fmtInt(priorMax)} ${last.name.toLowerCase()} n'est plus un événement isolé`,
          body: `Ton record de ${fmtInt(priorMax)} ${last.name.toLowerCase()} n'est plus un événement isolé : tu l'as reproduit sur ${atPeak} séances au cours des ${recent.length} dernières. Ce niveau devient désormais ta référence récente plutôt qu'un PR isolé.`,
          evidence: `${fmtInt(priorMax)} reps · ${atPeak}/${recent.length}`,
          importance: 0.91
        });
      }
      return;
    }
    if (last.reps - priorMax < 1) return;
    prs.push({
      kind: 'disc_ms_pr',
      nature: 'now',
      family: 'ms_pr',
      type: 'PR_REPS',
      date: last.date,
      title: `Nouveau record : ${fmtInt(last.reps)} ${last.name.toLowerCase()}`,
      body: `Nouveau record : ${fmtInt(last.reps)} ${last.name.toLowerCase()} (précédent ${fmtInt(priorMax)}). Ce n'est pas encore un niveau : c'est le plafond d'un jour. Il le deviendra si tu le reproduis.`,
      evidence: `${fmtInt(priorMax)} → ${fmtInt(last.reps)}`,
      importance: 0.92
    });
  });
  prs.sort((a, b) => (b.importance || 0) - (a.importance || 0));
  if (prs[0]) out.push(row(prs[0]));

  if (voiceKey === 'week' || voiceKey === 'month' || voiceKey === 'long' || voiceKey === 'year') {
    const byWeek = new Map();
    sessions.forEach((s) => {
      const dt = new Date(`${s.date}T12:00:00`);
      const dow = (dt.getDay() + 6) % 7;
      dt.setDate(dt.getDate() - dow);
      const key = dt.toISOString().slice(0, 10);
      byWeek.set(key, (byWeek.get(key) || 0) + 1);
    });
    const weeks = [...byWeek.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    let prevMax = 0;
    weeks.forEach(([wk, n]) => {
      const inW = wk >= window.start && wk <= window.end;
      if (inW && n >= 5 && n > prevMax) {
        out.push(
          row({
            kind: 'disc_ms_week_freq',
            nature: 'trajectory',
            family: 'ms_freq',
            type: 'FIRST_WEEK_FREQ',
            date: wk,
            title: `Première semaine à ${n} entraînements`,
            body: `Première semaine à ${n} entraînements : cette fréquence dépasse ton précédent maximum hebdomadaire de ${prevMax || n - 1} séance${(prevMax || n - 1) > 1 ? 's' : ''}.`,
            evidence: `${n} séances · max avant ${prevMax || 0}`,
            importance: 0.9
          })
        );
      }
      if (n > prevMax) prevMax = n;
    });
  }

  const weights = weightSeries(snapshot);
  if (weights[0] && eligible(weights[0].date, window, voiceKey, { firstAbsolute: true })) {
    out.push(
      row({
        kind: 'disc_ms_weight',
        nature: 'now',
        family: 'ms_weight',
        type: 'FIRST_WEIGHT',
        date: weights[0].date,
        title: 'Première mesure de poids',
        body: `Première mesure : ${fmt1(weights[0].weight)} kg. Cette saisie devient la référence initiale de ton suivi de poids — pas encore une tendance.`,
        evidence: `${fmt1(weights[0].weight)} kg`,
        importance: 0.84
      })
    );
  } else {
    pushWeightGrain(out, weights, window, voiceKey);
  }

  pushGoalMilestones(out, {
    sessions,
    window,
    voiceKey,
    profileQuestionnaireRaw,
    snapshot,
    runs,
    weights
  });
  pushLoadMilestones(out, { snapshot, window, voiceKey, getExerciseNameById: nameOf });
  pushDensityPaceMilestones(out, { sessions, runs, window, voiceKey });
  pushSleepComboMilestones(out, { sessions, window, voiceKey, catalog: sessions });
  pushRegimeMilestones(out, { sessions, window, voiceKey });
  pushMixShiftMilestones(out, { sessions, window, voiceKey });
  pushReturnDurableMilestones(out, { sessions, window, voiceKey });
  pushEventCombos(out, { sessions, window, voiceKey, weights });

  const byKind = new Map();
  out.forEach((m) => {
    if (!m?.kind) return;
    const prev = byKind.get(m.kind);
    if (!prev || (m.importance || 0) > (prev.importance || 0)) byKind.set(m.kind, m);
  });
  return [...byKind.values()].sort((a, b) => (b.importance || 0) - (a.importance || 0));
}

function meanInRange(rows, start, end) {
  const hit = (rows || []).filter((w) => w.date >= start && w.date <= end);
  if (!hit.length) return { n: 0, mean: null };
  return { n: hit.length, mean: mean(hit.map((w) => w.weight)) };
}

function pushWeightGrain(out, weights, window, voiceKey) {
  if (!weights?.length) return;
  if (voiceKey === 'today') return;
  if (voiceKey === 'week') {
    const currStart = addCalendarDays(window.end, -7);
    const prevEnd = addCalendarDays(window.end, -8);
    const prevStart = addCalendarDays(window.end, -15);
    const curr = meanInRange(weights, currStart, window.end);
    const prev = meanInRange(weights, prevStart, prevEnd);
    if (curr.n < 3 || prev.n < 3 || curr.mean == null || prev.mean == null) return;
    const delta = curr.mean - prev.mean;
    if (Math.abs(delta) < 0.6) return;
    out.push(
      row({
        kind: 'disc_ms_weight',
        nature: 'trajectory',
        family: 'ms_weight',
        type: 'WEIGHT_8D',
        date: window.end,
        title: `Ton poids moyen passe de ${fmt1(prev.mean)} à ${fmt1(curr.mean)} kg`,
        body: `Sur les 8 derniers jours, ton poids moyen est de ${fmt1(curr.mean)} kg, contre ${fmt1(prev.mean)} kg les 8 jours précédents (${delta > 0 ? '+' : ''}${fmt1(delta)} kg). Ce n'est pas une pesée isolée : ce sont deux moyennes de ${curr.n} et ${prev.n} mesures.`,
        evidence: `${fmt1(prev.mean)} → ${fmt1(curr.mean)} kg · grain 8 j.`,
        importance: 0.86
      })
    );
    return;
  }
  if (voiceKey !== 'month' && voiceKey !== 'long' && voiceKey !== 'year') return;
  if (weights.length < 8) return;
  const curr = weights.filter((w) => w.date >= addCalendarDays(window.end, -29) && w.date <= window.end);
  const prev = weights.filter(
    (w) => w.date >= addCalendarDays(window.end, -59) && w.date < addCalendarDays(window.end, -29)
  );
  const a = mean(curr.map((w) => w.weight));
  const b = mean(prev.map((w) => w.weight));
  if (curr.length < 4 || prev.length < 4 || a == null || b == null || Math.abs(a - b) < 0.6) return;
  out.push(
    row({
      kind: 'disc_ms_weight',
      nature: 'trajectory',
      family: 'ms_weight',
      type: 'WEIGHT_MONTH',
      date: window.end,
      title: `Ton poids moyen passe de ${fmt1(b)} à ${fmt1(a)} kg`,
      body: `Ton poids moyen sur les 30 derniers jours est de ${fmt1(a)} kg, contre ${fmt1(b)} kg sur les 30 jours précédents. La variation est donc de ${a - b > 0 ? '+' : ''}${fmt1(a - b)} kg sur les moyennes mensuelles, et non simplement une différence entre deux mesures isolées.`,
      evidence: `${fmt1(b)} → ${fmt1(a)} kg`,
      importance: 0.88
    })
  );
}

function formatEtaFr(fromYmd, days) {
  const d = Math.max(1, Math.round(Number(days) || 0));
  if (d <= 10) return `dans ${d} jour${d > 1 ? 's' : ''}`;
  if (d <= 24) {
    const w = Math.max(1, Math.round(d / 7));
    return `dans ${w} semaine${w > 1 ? 's' : ''}`;
  }
  const target = addCalendarDays(fromYmd, d);
  const month = Number(String(target).slice(5, 7));
  const year = String(target).slice(0, 4);
  const labels = [
    'janvier',
    'février',
    'mars',
    'avril',
    'mai',
    'juin',
    'juillet',
    'août',
    'septembre',
    'octobre',
    'novembre',
    'décembre'
  ];
  return `vers ${labels[month - 1] || ''} ${year}`.trim();
}

function pushGoalMilestones(out, { sessions, window, voiceKey, profileQuestionnaireRaw, snapshot, runs, weights }) {
  const goal = resolveMilestoneGoal(profileQuestionnaireRaw, snapshot);
  if (goal) {
    const series = pullupSessionMaxes(sessions, { strict: goal.strict });
    if (series.length >= 3) {
      let best = 0;
      let reach = null;
      series.forEach((row) => {
        if (row.reps > best) best = row.reps;
        if (best >= goal.target && !reach) reach = { ...row, best };
      });
      const last = series[series.length - 1];
      const name = (last.name || 'tractions').toLowerCase();
      if (reach && eligible(reach.date, window, voiceKey)) {
        out.push(
          row({
            kind: 'disc_ms_goal',
            nature: 'now',
            family: 'ms_goal',
            type: 'GOAL_REACHED',
            date: reach.date,
            title: `Objectif atteint : ${goal.label}`,
            body: `Tu viens d'atteindre ${fmtInt(reach.reps)} ${name}, l'objectif de ${goal.label} que tu t'étais fixé. Ce n'est plus une projection : c'est un palier franchi, le ${formatDayFr(reach.date, true)}.`,
            evidence: `${fmtInt(reach.reps)} reps · objectif ${fmtInt(goal.target)}`,
            importance: 0.97
          })
        );
      } else if (best < goal.target && voiceKey !== 'today') {
        const span = daysBetweenYmd(series[0].date, last.date);
        if (series.length >= 4 && span >= 21) {
          const early = mean(series.slice(0, 3).map((x) => x.reps));
          const late = mean(series.slice(-3).map((x) => x.reps));
          if (early != null && late != null && late > early + 0.25) {
            const slopePerDay = (late - early) / Math.max(1, span);
            const remaining = goal.target - best;
            const daysEta = remaining / slopePerDay;
            if (Number.isFinite(daysEta) && daysEta >= 3 && daysEta <= 400) {
              const perWeek = slopePerDay * 7;
              out.push(
                row({
                  kind: 'disc_ms_goal',
                  nature: 'trajectory',
                  family: 'ms_goal',
                  type: 'GOAL_ETA',
                  date: last.date,
                  title: `Objectif ${goal.label} : ${fmtInt(best)} aujourd'hui`,
                  body: `Ton objectif de ${goal.label} est à ${fmtInt(best)} ${name} sur tes séances récentes. Au rythme observé depuis ${fmtInt(span)} jours (${perWeek >= 0.15 ? `+${fmt1(perWeek)} rep / semaine` : 'une progression lente mais mesurable'}), tu franchirais ce palier ${formatEtaFr(window.end, daysEta)} — à condition de conserver cette exposition.`,
                  evidence: `${fmtInt(best)} / ${fmtInt(goal.target)} · ETA ${fmtInt(daysEta)} j.`,
                  importance: 0.9
                })
              );
            }
          }
        }
      }
    }
  }
  pushRunGoalMilestones(out, { runs, window, voiceKey, profileQuestionnaireRaw, snapshot });
  pushWeightGoalMilestones(out, { weights, window, voiceKey, profileQuestionnaireRaw, snapshot });
}

function pushDensityPaceMilestones(out, { sessions, runs, window, voiceKey }) {
  const dens = (sessions || [])
    .map((s) => {
      const d = sessionDensity(s);
      return d == null ? null : { date: s.date, density: d, reps: s.totalReps, minutes: s.minutes, session: s };
    })
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (dens.length >= 4) {
    const last = dens[dens.length - 1];
    if (eligible(last.date, window, voiceKey)) {
      const priorMax = Math.max(...dens.slice(0, -1).map((x) => x.density));
      if (last.density >= priorMax * 1.08 && last.density - priorMax >= 6) {
        out.push(
          row({
            kind: 'disc_ms_pr_density',
            nature: 'now',
            family: 'ms_pr',
            type: 'PR_DENSITY',
            date: last.date,
            title: `Nouveau record de densité : ${fmtInt(last.density)} reps/h`,
            body: `Nouveau record de densité : ${fmtInt(last.density)} répétitions par heure (précédent ${fmtInt(priorMax)}). Avec ${fmtInt(last.reps)} reps en ${fmtInt(last.minutes)} min, tu n'as pas seulement fait plus de volume : tu as comprimé davantage de travail dans le même temps.`,
            evidence: `${fmtInt(priorMax)} → ${fmtInt(last.density)} reps/h`,
            importance: 0.91
          })
        );
      }
    }
  }

  const paced = (runs || [])
    .filter((r) => r.km >= 2 && r.minutes >= 10)
    .map((r) => ({ ...r, pace: r.minutes / r.km }))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (paced.length >= 3) {
    const last = paced[paced.length - 1];
    if (eligible(last.date, window, voiceKey)) {
      const priorBest = Math.min(...paced.slice(0, -1).map((x) => x.pace));
      if (last.pace <= priorBest * 0.95 && priorBest - last.pace >= 0.15) {
        out.push(
          row({
            kind: 'disc_ms_pr_pace',
            nature: 'now',
            family: 'ms_pr',
            type: 'PR_PACE',
            date: last.date,
            title: `Nouveau record d'allure : ${formatPaceFr(last.pace)}`,
            body: `Nouveau record d'allure : ${formatPaceFr(last.pace)} sur ${fmt1(last.km)} km (précédent ${formatPaceFr(priorBest)}). C'est le rythme le plus rapide que tu aies tenu sur une sortie d'au moins 2 km.`,
            evidence: `${formatPaceFr(priorBest)} → ${formatPaceFr(last.pace)}`,
            importance: 0.93
          })
        );
      }
    }
  }
}

function pushSleepComboMilestones(out, { sessions, window, voiceKey }) {
  const hoursList = (sessions || []).map(nightHours).filter((h) => h != null);
  if (hoursList.length < 5) return;
  const sortedH = hoursList.slice().sort((a, b) => a - b);
  const p75 = sortedH[Math.floor((sortedH.length - 1) * 0.75)];
  const jalonDates = new Set(
    (out || [])
      .filter((m) =>
        [
          'disc_ms_pr',
          'disc_ms_pr_density',
          'disc_ms_pr_pace',
          'disc_ms_pr_load',
          'disc_ms_return',
          'disc_ms_return_run',
          'disc_ms_day_volume',
          'disc_ms_first_hour',
          'disc_ms_goal'
        ].includes(m.kind)
      )
      .map((m) => m.date)
  );
  const hits = (sessions || []).filter((s) => {
    if (!eligible(s.date, window, voiceKey)) return false;
    if (!jalonDates.has(s.date)) return false;
    const h = nightHours(s);
    if (h == null) return false;
    const eff = nightEfficiency(s);
    const good = h >= 7.5 && (eff == null || eff >= 88);
    const amongBest = h >= p75 && h >= 7.4;
    return good && amongBest;
  });
  const s = hits.sort((a, b) => (nightHours(b) || 0) - (nightHours(a) || 0))[0];
  if (!s) return;
  const h = nightHours(s);
  const eff = nightEfficiency(s);
  const dens = sessionDensity(s);
  const jalon = (out || []).find((m) => m.date === s.date && String(m.kind).startsWith('disc_ms_'));
  const densBit =
    dens != null
      ? ` Cette séance atteint ${fmtInt(dens)} répétitions par heure, avec ${fmtInt(s.totalReps)} reps en ${fmtInt(s.minutes)} min.`
      : jalon?.title
        ? ` Elle coïncide avec ${jalon.title.toLowerCase()}.`
        : '';
  const effBit = eff != null ? `, avec une efficacité de ${fmtInt(eff)} %` : '';
  out.push(
    row({
      kind: 'disc_ms_sleep_combo',
      nature: 'trajectory',
      family: 'ms_combo',
      type: 'SLEEP_X_EVENT',
      date: s.date,
      title: `Jalon sous une de tes meilleures nuits (${formatSleepHoursFr(h)})`,
      body: `Le ${formatDayFr(s.date, true)}, un jalon d'entraînement arrive après une nuit de ${formatSleepHoursFr(h)}${effBit} — parmi tes meilleures configurations de récupération.${densBit} Ce n'est pas une corrélation statistique : c'est la rencontre, le même jour, d'un événement et d'une récupération haute.`,
      evidence: `${formatSleepHoursFr(h)}${eff != null ? ` · ${fmtInt(eff)} %` : ''}`,
      importance: 0.92
    })
  );
}

function pushRegimeMilestones(out, { sessions, window, voiceKey }) {
  if (voiceKey === 'today') return;
  const list = sessions || [];
  if (list.length < 10) return;

  const byEx = new Map();
  list.forEach((s) => {
    (s.exercises || []).forEach((e) => {
      const id = String(e.id);
      const prev = byEx.get(id) || { id, name: e.name, dates: [] };
      prev.dates.push(s.date);
      if (!prev.name && e.name) prev.name = e.name;
      byEx.set(id, prev);
    });
  });

  const candidates = [];
  byEx.forEach((ex) => {
    const dates = [...new Set(ex.dates)].sort();
    if (dates.length < 6) return;
    const first = dates[0];
    const last = dates[dates.length - 1];
    if (!inWindow(last, window)) return;
    const sinceFirst = daysBetweenYmd(first, window.end);
    if (sinceFirst < 42 || sinceFirst > 100) return;
    const introEnd = addCalendarDays(first, 13);
    const lateStart = addCalendarDays(window.end, -41);
    const earlySess = list.filter((s) => s.date >= first && s.date <= introEnd);
    const lateSess = list.filter((s) => s.date >= lateStart && s.date <= window.end);
    if (earlySess.length < 4 || lateSess.length < 5) return;
    const earlyHit = earlySess.filter((s) => dates.includes(s.date)).length;
    const lateHit = lateSess.filter((s) => dates.includes(s.date)).length;
    const earlyRate = earlyHit / earlySess.length;
    const lateRate = lateHit / lateSess.length;
    if (earlyRate > 0.4 || lateRate < 0.5 || lateRate - earlyRate < 0.18) return;
    const fam = familyOfExercise(ex.id, ex.name);
    const famLabel = FAM_FR[fam] || 'entraînement';
    candidates.push({
      ex,
      first,
      last,
      earlyRate,
      lateRate,
      earlyHit,
      lateHit,
      earlyN: earlySess.length,
      lateN: lateSess.length,
      famLabel,
      importance: 0.89 + Math.min(0.05, (lateRate - earlyRate) * 0.1)
    });
  });
  candidates.sort((a, b) => (b.lateRate - b.earlyRate) - (a.lateRate - a.earlyRate));
  const top = candidates[0];
  if (top) {
    const name = (top.ex.name || 'cet exercice').toLowerCase();
    out.push(
      row({
        kind: 'disc_ms_regime',
        nature: 'trajectory',
        family: 'ms_regime',
        type: 'EXERCISE_REGULAR',
        date: top.last,
        title: `Après 6 semaines, ${name} fait partie du régime`,
        body: `Après 6 semaines, ${name} ${/s$/.test(name) ? 'sont devenues' : 'est devenu'} une composante régulière de ton ${top.famLabel} : ${fmt1(top.lateHit)} séances sur ${fmtInt(top.lateN)} en contiennent désormais, contre ${fmt1(top.earlyHit)} sur ${fmtInt(top.earlyN)} durant les deux premières semaines. Ce n'est plus une nouveauté : c'est un régime d'exposition.`,
        evidence: `${fmtPct(top.earlyRate * 100)} → ${fmtPct(top.lateRate * 100)} des séances`,
        importance: top.importance
      })
    );
    return;
  }

  if (voiceKey === 'week') return;
  const lastStart = addCalendarDays(window.end, -41);
  const prevEnd = addCalendarDays(window.end, -42);
  const prevStart = addCalendarDays(window.end, -83);
  const lastN = list.filter((s) => s.date >= lastStart && s.date <= window.end).length;
  const prevN = list.filter((s) => s.date >= prevStart && s.date <= prevEnd).length;
  if (lastN < 8 || prevN < 6) return;
  const lastRate = lastN / 6;
  const prevRate = prevN / 6;
  const delta = ((lastRate - prevRate) / Math.max(0.4, prevRate)) * 100;
  if (Math.abs(delta) < 25) return;
  const down = lastRate < prevRate;
  out.push(
    row({
      kind: 'disc_ms_regime',
      nature: 'trajectory',
      family: 'ms_regime',
      type: 'FREQ_REGIME',
      date: window.end,
      title: `Ton régime d'entraînement s'est installé à ${fmt1(lastRate)} séances / semaine`,
      body: `Depuis 6 semaines, tu t'entraînes ${fmt1(lastRate)} fois par semaine, contre ${fmt1(prevRate)} sur les 6 semaines d'avant (${delta > 0 ? '+' : ''}${fmtInt(delta)} %). ${
        down
          ? "Moins d'exposition, pas nécessairement moins de capacité : le régime a changé, ce n'est plus une semaine creuse."
          : "Cette fréquence n'est plus un pic isolé : elle tient sur six semaines."
      }`,
      evidence: `${fmt1(prevRate)} → ${fmt1(lastRate)} / sem.`,
      importance: 0.87
    })
  );
}

function pushMixShiftMilestones(out, { sessions, window, voiceKey }) {
  const span = daysBetweenYmd(window.start, window.end);
  if (voiceKey !== 'year' && !(voiceKey === 'long' && span >= 150)) return;
  if (span < 150) return;
  const longArc = span >= 500;
  const earlySpan = longArc ? 179 : 89;
  const lateSpan = longArc ? 179 : 89;
  const earlyEnd = addCalendarDays(window.start, earlySpan);
  const lateStart = addCalendarDays(window.end, -lateSpan);
  if (earlyEnd >= lateStart) return;
  const early = (sessions || []).filter((s) => s.date >= window.start && s.date <= earlyEnd);
  const late = (sessions || []).filter((s) => s.date >= lateStart && s.date <= window.end);
  const a = tallyStimulus(flattenMeasure(early));
  const b = tallyStimulus(flattenMeasure(late));
  if ((a.buckets.total || 0) < 600 || (b.buckets.total || 0) < 600) return;
  const shareOf = (tally, key) => {
    const tot = tally.buckets.total || 0;
    if (tot < 1) return null;
    if (key === 'push') return ((tally.byFamily.poussée || 0) / tot) * 100;
    if (key === 'pull') return ((tally.byFamily.tirage || 0) / tot) * 100;
    if (key === 'legs') return ((tally.byFamily.jambes || 0) / tot) * 100;
    if (key === 'weighted') return ((tally.buckets.weighted || 0) / tot) * 100;
    if (key === 'bodyweight') return ((tally.buckets.bodyweight || 0) / tot) * 100;
    return null;
  };
  const dims = [
    { key: 'push', label: 'la poussée' },
    { key: 'pull', label: 'le tirage' },
    { key: 'legs', label: 'les jambes' },
    { key: 'weighted', label: 'le travail lesté' },
    { key: 'bodyweight', label: 'le poids du corps' }
  ];
  let best = null;
  dims.forEach((d) => {
    const x = shareOf(a, d.key);
    const y = shareOf(b, d.key);
    if (x == null || y == null) return;
    const delta = y - x;
    if (Math.abs(delta) < 12) return;
    if (!best || Math.abs(delta) > Math.abs(best.delta)) best = { ...d, x, y, delta };
  });
  if (!best) return;
  const other =
    best.key === 'push'
      ? { label: 'tirage', x: shareOf(a, 'pull'), y: shareOf(b, 'pull') }
      : best.key === 'pull'
        ? { label: 'poussée', x: shareOf(a, 'push'), y: shareOf(b, 'push') }
        : null;
  const otherBit =
    other && other.x != null && other.y != null && Math.abs(other.y - other.x) >= 8
      ? `, au profit du ${other.label} (${fmtPct(other.x)} → ${fmtPct(other.y)})`
      : '';
  const earlyWeeks = Math.max(1, (daysBetweenYmd(window.start, earlyEnd) + 1) / 7);
  const lateWeeks = Math.max(1, (daysBetweenYmd(lateStart, window.end) + 1) / 7);
  const earlyFreq = early.length / earlyWeeks;
  const lateFreq = late.length / lateWeeks;
  const freqBit =
    earlyFreq >= 1.2 && lateFreq >= 1 && Math.abs(lateFreq - earlyFreq) / Math.max(0.4, earlyFreq) >= 0.15
      ? ` La fréquence est passée de ${fmt1(earlyFreq)} à ${fmt1(lateFreq)} séances par semaine : le mix n'est pas le seul à avoir bougé.`
      : '';
  const horizonBit = longArc
    ? 'Sur deux ans'
    : span >= 300
      ? "Sur l'année"
      : 'Sur cette période longue';
  const windowBit = longArc
    ? 'les 180 premiers jours contre les 180 derniers'
    : 'les 90 premiers jours contre les 90 derniers';
  out.push(
    row({
      kind: 'disc_ms_mix_shift',
      nature: 'journey',
      family: 'ms_transform',
      type: longArc ? 'MIX_2Y' : 'MIX_YEAR',
      date: window.end,
      title: longArc
        ? "En deux ans, ton profil d'entraînement a changé"
        : "Le mix d'entraînement a changé de profil",
      body: `${horizonBit}, ${best.label} ${
        best.key === 'legs' ? 'sont passées' : best.key === 'push' ? 'est passée' : 'est passé'
      } de ${fmtPct(best.x)} à ${fmtPct(best.y)} du volume${otherBit}. Ce n'est plus une semaine atypique : c'est un changement de profil, mesuré sur ${windowBit}.${freqBit}`,
      evidence: `${fmtPct(best.x)} → ${fmtPct(best.y)} ${best.label}`,
      importance: longArc ? 0.96 : 0.94
    })
  );
}

function pushReturnDurableMilestones(out, { sessions, window, voiceKey }) {
  if (voiceKey === 'today') return;
  const byEx = new Map();
  (sessions || []).forEach((s) => {
    (s.exercises || []).forEach((e) => {
      const id = String(e.id);
      const prev = byEx.get(id) || { id, name: e.name, dates: [] };
      prev.dates.push(s.date);
      if (!prev.name) prev.name = e.name;
      byEx.set(id, prev);
    });
  });
  const hits = [];
  byEx.forEach((ex) => {
    const dates = [...new Set(ex.dates)].sort();
    if (dates.length < 5) return;
    for (let i = 1; i < dates.length; i += 1) {
      const prev = dates[i - 1];
      const ret = dates[i];
      const gap = daysBetweenYmd(prev, ret);
      const med = medianInterval(dates.slice(0, i));
      if (!isMeaningfulAbsence(gap, med)) continue;
      const since = dates.filter((d) => d >= ret);
      const daysSince = daysBetweenYmd(ret, window.end);
      if (daysSince < 12 || since.length < 3) continue;
      if (ret === window.end) continue;
      if (!inWindow(since[since.length - 1], window)) continue;
      if (daysSince > 50 && voiceKey === 'week') continue;
      hits.push({
        ex,
        ret,
        gap,
        n: since.length,
        daysSince,
        last: since[since.length - 1],
        durable: daysSince >= 26 && since.length >= 5
      });
    }
  });
  hits.sort((a, b) => {
    if (a.durable !== b.durable) return a.durable ? -1 : 1;
    return b.n - a.n;
  });
  const top = hits[0];
  if (!top) return;
  const name = (top.ex.name || 'cet exercice').toLowerCase();
  out.push(
    row({
      kind: 'disc_ms_return_durable',
      nature: 'trajectory',
      family: 'ms_return',
      type: top.durable ? 'RETURN_DURABLE' : 'RETURN_FOLLOWUP',
      date: top.last,
      title: top.durable
        ? `La reprise de ${name} est devenue durable`
        : `${fmtInt(top.n)} séances de ${name} depuis le retour`,
      body: top.durable
        ? `La reprise de ${name} est devenue durable : ${fmtInt(top.n)} séances en ${fmtInt(top.daysSince)} jours, alors que l'interruption avait duré ${fmtInt(top.gap)} jours. Ce n'est plus l'événement du retour : c'est la continuité qui s'installe.`
        : `Depuis la reprise de ${name} le ${formatDayFr(top.ret, true)}, tu as enchaîné ${fmtInt(top.n)} séances en ${fmtInt(top.daysSince)} jours. L'interruption de ${fmtInt(top.gap)} jours n'est plus l'événement : c'est la suite qui se construit.`,
      evidence: `${fmtInt(top.n)} séances · J+${fmtInt(top.daysSince)}`,
      importance: top.durable ? 0.9 : 0.86
    })
  );
}

function parseKg(raw) {
  const n = Number(String(raw ?? '').replace(',', '.').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) && n >= 2 && n <= 400 ? n : null;
}

export function epleyE1rm(kg, reps) {
  const w = Number(kg);
  const r = Number(reps);
  if (!Number.isFinite(w) || !Number.isFinite(r) || w < 5 || r < 1 || r > 15) return null;
  return w * (1 + r / 30);
}

export function collectLoadSeries(snapshot, nameOf) {
  const weights = snapshot?.exerciseWeights || {};
  const reps = snapshot?.reps || {};
  const byEx = new Map();
  Object.entries(weights).forEach(([key, raw]) => {
    const kg = parseKg(raw);
    if (kg == null) return;
    const date = extractDateStrFromWorkoutKey(key);
    const id = String(extractExerciseIdFromWorkoutKey(key) || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !id) return;
    const r = Number(reps[key]) || 0;
    if (r < 1) return;
    const name = typeof nameOf === 'function' ? nameOf(id, `Exercice ${id}`) : `Exercice ${id}`;
    const e1 = epleyE1rm(kg, Math.min(r, 15));
    const prev = byEx.get(id) || { id, name, rows: [] };
    prev.rows.push({ date, kg, reps: r, e1rm: e1, name });
    byEx.set(id, prev);
  });
  byEx.forEach((ex) => {
    ex.rows.sort((a, b) => a.date.localeCompare(b.date));
  });
  return byEx;
}

function pushLoadMilestones(out, { snapshot, window, voiceKey, getExerciseNameById }) {
  const byEx = collectLoadSeries(snapshot, getExerciseNameById);
  if (!byEx.size) return;
  let first = null;
  byEx.forEach((ex) => {
    const row0 = ex.rows[0];
    if (!row0) return;
    if (!first || row0.date < first.date) first = { ...row0, name: ex.name };
  });
  if (first && eligible(first.date, window, voiceKey, { firstAbsolute: true })) {
    out.push(
      row({
        kind: 'disc_ms_first_load',
        nature: 'now',
        family: 'ms_first',
        type: 'FIRST_LOAD',
        date: first.date,
        title: `Première charge saisie : ${fmt1(first.kg)} kg`,
        body: `Première charge enregistrée : ${fmt1(first.kg)} kg sur ${first.name.toLowerCase()}. Cette saisie devient la référence initiale de ta progression en charge — distincte du volume en répétitions.`,
        evidence: `${fmt1(first.kg)} kg · ${first.name}`,
        importance: 0.9
      })
    );
  }
  const prs = [];
  byEx.forEach((ex) => {
    if (ex.rows.length < 3) return;
    const last = ex.rows[ex.rows.length - 1];
    if (!eligible(last.date, window, voiceKey)) return;
    const priorKg = Math.max(...ex.rows.slice(0, -1).map((x) => x.kg));
    if (last.kg >= priorKg + 1.5 && last.kg >= priorKg * 1.04) {
      prs.push({
        kind: 'disc_ms_pr_load',
        nature: 'now',
        family: 'ms_pr',
        type: 'PR_LOAD',
        date: last.date,
        title: `Nouveau record de charge : ${fmt1(last.kg)} kg`,
        body: `Nouveau record de charge : ${fmt1(last.kg)} kg sur ${ex.name.toLowerCase()} (précédent ${fmt1(priorKg)} kg), pour ${fmtInt(last.reps)} répétitions. Ce n'est pas un record de reps : c'est le plafond de charge que tu viens de déplacer.`,
        evidence: `${fmt1(priorKg)} → ${fmt1(last.kg)} kg`,
        importance: 0.94
      });
      return;
    }
    const e1s = ex.rows.map((x) => x.e1rm).filter((n) => n != null);
    if (e1s.length < 3 || last.e1rm == null) return;
    const priorE1 = Math.max(...ex.rows.slice(0, -1).map((x) => x.e1rm).filter((n) => n != null));
    if (last.e1rm >= priorE1 * 1.06 && last.e1rm - priorE1 >= 2) {
      prs.push({
        kind: 'disc_ms_pr_load',
        nature: 'now',
        family: 'ms_pr',
        type: 'PR_E1RM',
        date: last.date,
        title: `Nouveau 1RM estimé : ${fmt1(last.e1rm)} kg`,
        body: `Ton 1RM estimé (Epley) sur ${ex.name.toLowerCase()} passe à ${fmt1(last.e1rm)} kg, contre ${fmt1(priorE1)} kg auparavant. La charge saisie et les répétitions du jour produisent un plafond estimé que tu n'avais pas encore atteint.`,
        evidence: `${fmt1(priorE1)} → ${fmt1(last.e1rm)} kg e1RM`,
        importance: 0.92
      });
    }
  });
  prs.sort((a, b) => (b.importance || 0) - (a.importance || 0));
  if (prs[0]) out.push(row(prs[0]));
}

function pushRunGoalMilestones(out, { runs, window, voiceKey, profileQuestionnaireRaw, snapshot }) {
  const answers = answersFrom(profileQuestionnaireRaw, snapshot);
  const spec = RUN_GOAL_DIST[String(answers.runningGoal || '')];
  if (!spec || !runs?.length) return;
  const hit = runs.find((r) => (r.km || 0) >= spec.km * 0.95);
  if (!hit) {
    const best = [...runs].sort((a, b) => (b.km || 0) - (a.km || 0))[0];
    if (!best || voiceKey === 'today') return;
    if ((best.km || 0) < spec.km * 0.4) return;
    out.push(
      row({
        kind: 'disc_ms_goal_run',
        nature: 'trajectory',
        family: 'ms_goal',
        type: 'RUN_GOAL_GAP',
        date: best.date,
        title: `Objectif ${spec.label} : plus longue sortie ${fmt1(best.km)} km`,
        body: `Ton objectif de ${spec.label} a pour plus longue sortie enregistrée ${fmt1(best.km)} km. L'écart restant est de ${fmt1(spec.km - best.km)} km sur une seule course — ce n'est pas encore un palier franchi.`,
        evidence: `${fmt1(best.km)} / ${fmt1(spec.km)} km`,
        importance: 0.86
      })
    );
    return;
  }
  if (!eligible(hit.date, window, voiceKey, { firstAbsolute: true })) return;
  const pace = hit.km >= 2 && hit.minutes >= 8 ? formatPaceFr(hit.minutes / hit.km) : '';
  out.push(
    row({
      kind: 'disc_ms_goal_run',
      nature: 'now',
      family: 'ms_goal',
      type: 'RUN_GOAL_REACHED',
      date: hit.date,
      title: `Objectif atteint : ${spec.label}`,
      body: `Tu viens de réaliser ${fmt1(hit.km)} km${pace ? ` à ${pace}` : ''}, l'objectif de ${spec.label} que tu t'étais fixé. Cette sortie devient la première référence de cette distance, le ${formatDayFr(hit.date, true)}.`,
      evidence: `${fmt1(hit.km)} km${pace ? ` · ${pace}` : ''}`,
      importance: 0.96
    })
  );
}

function pushWeightGoalMilestones(out, { weights, window, voiceKey, profileQuestionnaireRaw, snapshot }) {
  if (voiceKey === 'today') return;
  const answers = answersFrom(profileQuestionnaireRaw, snapshot);
  const target = Number(answers.vitalsSelfReport?.targetWeightKg ?? answers.targetWeightKg);
  if (!Number.isFinite(target) || target < 35 || target > 250) return;
  if (!weights?.length || weights.length < 6) return;
  const curr = meanInRange(weights, addCalendarDays(window.end, -7), window.end);
  if (curr.n < 3 || curr.mean == null) return;
  if (Math.abs(curr.mean - target) < 0.45) {
    out.push(
      row({
        kind: 'disc_ms_goal_weight',
        nature: 'trajectory',
        family: 'ms_goal',
        type: 'WEIGHT_GOAL_REACHED',
        date: window.end,
        title: `Objectif de poids atteint : ${fmt1(target)} kg`,
        body: `Ton poids moyen sur 8 jours est de ${fmt1(curr.mean)} kg, au niveau de l'objectif de ${fmt1(target)} kg. Ce n'est pas une pesée isolée : c'est la moyenne récente qui touche le palier.`,
        evidence: `${fmt1(curr.mean)} / ${fmt1(target)} kg`,
        importance: 0.95
      })
    );
    return;
  }
  const prev = meanInRange(weights, addCalendarDays(window.end, -37), addCalendarDays(window.end, -8));
  if (prev.n < 3 || prev.mean == null) return;
  const slope = (curr.mean - prev.mean) / 30;
  const toward = (target - curr.mean) * slope > 0 || Math.abs(target - curr.mean) < Math.abs(target - prev.mean);
  if (!toward || Math.abs(slope) < 0.01) return;
  const daysEta = Math.abs((target - curr.mean) / slope);
  if (!Number.isFinite(daysEta) || daysEta < 10 || daysEta > 400) return;
  out.push(
    row({
      kind: 'disc_ms_goal_weight',
      nature: 'trajectory',
      family: 'ms_goal',
      type: 'WEIGHT_GOAL_ETA',
      date: window.end,
      title: `Objectif ${fmt1(target)} kg : moyenne actuelle ${fmt1(curr.mean)} kg`,
      body: `Ton objectif de poids est ${fmt1(target)} kg. La moyenne des 8 derniers jours est de ${fmt1(curr.mean)} kg, contre ${fmt1(prev.mean)} kg un mois plus tôt. Au rythme observé sur ces moyennes, tu toucherais ce palier ${formatEtaFr(window.end, daysEta)} — à condition que la tendance tienne.`,
      evidence: `${fmt1(curr.mean)} → ${fmt1(target)} kg · ETA ${fmtInt(daysEta)} j.`,
      importance: 0.9
    })
  );
}

function pushEventCombos(out, { sessions, window, voiceKey, weights }) {
  const kinds = new Set((out || []).map((m) => m.kind));
  const byDate = new Map();
  (out || []).forEach((m) => {
    if (!m?.date) return;
    const list = byDate.get(m.date) || [];
    list.push(m);
    byDate.set(m.date, list);
  });
  let combo = null;
  byDate.forEach((list, date) => {
    if (!eligible(date, window, voiceKey)) return;
    const hasPr = list.some((m) => m.kind === 'disc_ms_pr' || m.kind === 'disc_ms_pr_load');
    const hasDens = list.some((m) => m.kind === 'disc_ms_pr_density');
    const hasReturn = list.some((m) => m.kind === 'disc_ms_return' || m.kind === 'disc_ms_return_run');
    const sess = (sessions || []).find((s) => s.date === date);
    const vsHabit = hasReturn && /([0-9]+)\s*%/.exec(list.find((m) => String(m.kind).includes('return'))?.body || '');
    if (hasPr && hasDens) {
      combo = {
        date,
        title: 'Record de reps et record de densité le même jour',
        body: `Le ${formatDayFr(date, true)}, deux jalons coïncident : un record de performance et un record de densité de séance. Ce n'est plus un pic isolé sur une dimension : tu as à la fois produit plus et comprimé davantage de travail dans le temps.`,
        evidence: 'PR × densité',
        importance: 0.95
      };
    } else if (hasReturn && vsHabit && Number(vsHabit[1]) >= 88) {
      combo = {
        date,
        title: 'Reprise et niveau habituel le même jour',
        body: `Le retour n'est pas seulement calendaire : tu retrouves immédiatement ${vsHabit[1]} % de ton volume habituel. L'interruption n'a pas effacé le niveau, elle l'a seulement interrompu.`,
        evidence: `retour × ${vsHabit[1]} %`,
        importance: 0.91
      };
    } else if (hasPr && sess && nightHours(sess) != null && nightHours(sess) >= 7.5 && !kinds.has('disc_ms_sleep_combo')) {
      combo = {
        date,
        title: 'Record après une nuit haute',
        body: `Un record arrive le ${formatDayFr(date, true)} après une nuit de ${formatSleepHoursFr(nightHours(sess))}. L'événement et la récupération se rencontrent le même jour — sans en faire une loi générale.`,
        evidence: `PR × ${formatSleepHoursFr(nightHours(sess))}`,
        importance: 0.9
      };
    }
  });
  if (!combo && kinds.has('disc_ms_goal') && kinds.has('disc_ms_regime')) {
    const g = (out || []).find((m) => m.kind === 'disc_ms_goal');
    combo = {
      date: g?.date || window.end,
      title: "L'objectif avance pendant que le régime s'installe",
      body: `Deux transformations courent ensemble : un objectif chiffré progresse, et un exercice est devenu régulier sur six semaines. Le palier n'est pas seulement un record isolé : l'exposition le porte.`,
      evidence: 'objectif × régime',
      importance: 0.9
    };
  }
  if (!combo && kinds.has('disc_ms_weight') && voiceKey !== 'today') {
    const w = (out || []).find((m) => m.kind === 'disc_ms_weight' && m.type !== 'FIRST_WEIGHT');
    const recent = (sessions || []).filter((s) => daysBetweenYmd(s.date, window.end) <= 30);
    const prevS = (sessions || []).filter((s) => {
      const d = daysBetweenYmd(s.date, window.end);
      return d > 30 && d <= 60;
    });
    if (w && recent.length >= 6 && prevS.length >= 6) {
      const r1 = recent.reduce((s, x) => s + (x.totalReps || 0), 0);
      const r0 = prevS.reduce((s, x) => s + (x.totalReps || 0), 0);
      if (r0 > 0 && r1 >= r0 * 0.9) {
        combo = {
          date: window.end,
          title: 'Le poids change, le volume d’entraînement tient',
          body: `Le poids moyen bouge (${w.evidence || 'moyennes 8 j.'}) alors que tes ${fmtInt(r1)} reps des 30 derniers jours restent du même ordre que les 30 jours d'avant (${fmtInt(r0)}). La transformation corporelle n'est pas payée par un effondrement d'exposition.`,
          evidence: `poids × volume ${fmtInt(r0)} → ${fmtInt(r1)}`,
          importance: 0.88
        };
      }
    }
  }
  if (!combo) return;
  out.push(
    row({
      kind: 'disc_ms_event_combo',
      nature: 'trajectory',
      family: 'ms_combo',
      type: 'EVENT_COMBO',
      date: combo.date,
      title: combo.title,
      body: combo.body,
      evidence: combo.evidence,
      importance: combo.importance
    })
  );
}

