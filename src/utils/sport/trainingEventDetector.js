/**
 * Détecteur d'événements sportifs (PR, reprise, streak, pic de volume).
 * Distinct de l'état continu (UserTrainingState).
 */

import DateHelper from '../dateHelper';
import { collectCheckedExerciseRepHistory } from './recapAdaptiveInsights';
import { acuteChronicRepsRatio } from './recapInsightHelpers';
import { isDateInRecapWindow } from './recapMuscleLoadEngine';

/**
 * @typedef {object} TrainingEvent
 * @property {string} id
 * @property {string} type
 * @property {number} confidence — 0–1
 * @property {string[]} evidence
 * @property {string} [date]
 * @property {string} [exerciseId]
 * @property {string} [exerciseName]
 * @property {number|null} [value]
 */

function event(row) {
  if (!row?.id || !row?.type) return null;
  return {
    id: row.id,
    type: row.type,
    confidence: Math.max(0, Math.min(1, row.confidence ?? 0.6)),
    evidence: row.evidence || [],
    date: row.date,
    exerciseId: row.exerciseId,
    exerciseName: row.exerciseName,
    value: row.value ?? null
  };
}

function exerciseDisplayName(exId, getExerciseNameById) {
  if (typeof getExerciseNameById === 'function') {
    const n = parseInt(String(exId), 10);
    if (Number.isFinite(n)) {
      const label = getExerciseNameById(n);
      if (label && String(label).trim()) return String(label).trim();
    }
  }
  return `Exercice ${exId}`;
}

function collectTrainingDates(snapshot, window) {
  const dates = new Set();
  const checked = snapshot?.checkedExercises || {};
  Object.keys(checked).forEach((k) => {
    if (checked[k] !== true) return;
    const d = k.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(d) && isDateInRecapWindow(d, window)) dates.add(d);
  });
  return [...dates].sort();
}

function detectRepPrs(snapshot, window, getExerciseNameById, performanceRobustness = []) {
  const out = [];
  const robustByEx = new Map((performanceRobustness || []).map((r) => [String(r.exerciseId), r]));
  const byEx = collectCheckedExerciseRepHistory(snapshot, window);
  for (const [exId, sessions] of byEx) {
    if (!sessions?.length) continue;
    const maxSession = sessions.reduce((best, s) => (s.reps > best.reps ? s : best), sessions[0]);
    const priorMax = sessions
      .filter((s) => s.date < maxSession.date)
      .reduce((m, s) => Math.max(m, s.reps), 0);
    if (priorMax <= 0 || maxSession.reps <= priorMax) continue;
    if (maxSession.reps - priorMax < 1) continue;
    const name = exerciseDisplayName(exId, getExerciseNameById);
    const robust = robustByEx.get(String(exId));
    const kind = robust?.kind || 'PR_EVENT';
    out.push(
      event({
        id: `event.pr.${exId}.${maxSession.date}`,
        type: kind === 'OUTLIER' ? 'pr_outlier' : 'pr_reps',
        date: maxSession.date,
        exerciseId: exId,
        exerciseName: name,
        value: maxSession.reps,
        confidence: kind === 'OUTLIER' ? 0.62 : kind === 'LEVEL_ESTABLISHED' ? 0.9 : 0.72,
        evidence: [
          ...(robust?.evidence || [`${name} : ${priorMax} → ${maxSession.reps} reps (${maxSession.date})`])
        ]
      })
    );
  }
  return out.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
}

/**
 * @param {object} opts
 * @returns {{ events: TrainingEvent[], byType: Map<string, TrainingEvent[]> }}
 */
export function detectTrainingEvents(opts = {}) {
  const {
    snapshot = {},
    window = null,
    enrichment = null,
    assessment = null,
    getExerciseNameById = null,
    performanceRobustness = []
  } = opts;

  if (!window?.end) return { events: [], byType: new Map() };

  const events = [];

  events.push(...detectRepPrs(snapshot, window, getExerciseNameById, performanceRobustness));

  const trainingDates = collectTrainingDates(snapshot, window);
  if (trainingDates.length >= 2) {
    let maxGap = 0;
    let gapEndDate = null;
    for (let i = 1; i < trainingDates.length; i += 1) {
      const prev = new Date(`${trainingDates[i - 1]}T12:00:00`);
      const curr = new Date(`${trainingDates[i]}T12:00:00`);
      const gap = Math.round((curr - prev) / 86400000) - 1;
      if (gap > maxGap) {
        maxGap = gap;
        gapEndDate = trainingDates[i];
      }
    }
    const lastDate = trainingDates[trainingDates.length - 1];
    const daysSinceReturn = Math.round(
      (new Date(`${window.end}T12:00:00`) - new Date(`${lastDate}T12:00:00`)) / 86400000
    );
    if (maxGap >= 18 && gapEndDate && daysSinceReturn <= 21) {
      events.push(
        event({
          id: `event.return.${gapEndDate}`,
          type: 'return_after_pause',
          date: gapEndDate,
          confidence: Math.min(0.9, 0.65 + maxGap / 60),
          evidence: [`pause ~${maxGap} j. puis reprise le ${gapEndDate}`]
        })
      );
    }
  }

  const streak = enrichment?.streak?.current ?? 0;
  if (streak >= 5) {
    events.push(
      event({
        id: `event.streak.${streak}`,
        type: 'training_streak',
        value: streak,
        confidence: Math.min(0.92, 0.6 + streak * 0.04),
        evidence: [`série en cours : ${streak} j.`]
      })
    );
  }

  const load = acuteChronicRepsRatio(snapshot, window);
  if (load?.ratio != null && load.ratio >= 1.3 && load.chronicWeekly >= 25) {
    events.push(
      event({
        id: 'event.volume_spike',
        type: 'volume_spike',
        value: Math.round((load.ratio - 1) * 100),
        confidence: 0.75,
        evidence: [`charge aiguë +${Math.round((load.ratio - 1) * 100)} % vs baseline 28 j.`]
      })
    );
  }

  if (assessment?.tenureDays != null && assessment.tenureDays <= 21 && trainingDates.length >= 2) {
    events.push(
      event({
        id: 'event.early_phase',
        type: 'early_training_phase',
        confidence: 0.7,
        evidence: [`${assessment.tenureDays} j. d'historique — phase d'installation`]
      })
    );
  }

  const filtered = events.filter(Boolean);
  const byType = new Map();
  filtered.forEach((e) => {
    if (!byType.has(e.type)) byType.set(e.type, []);
    byType.get(e.type).push(e);
  });

  return { events: filtered, byType };
}

export function hasEventType(eventBundle, type) {
  return (eventBundle?.byType?.get(type) || []).length > 0;
}

export function topEventOfType(eventBundle, type) {
  const list = eventBundle?.byType?.get(type) || [];
  return list[0] || null;
}
