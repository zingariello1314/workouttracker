import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Layers, CalendarDays, Check, Trash2, Copy, Info, FolderPlus } from 'lucide-react';
import { workoutProgram } from '../../../data/workoutProgram';
import {
  buildPyramidSuggestions,
  buildFullPyramidSteps,
  buildAscendingSteps,
  clampPeakFromMax,
  suggestRestSeconds,
  sumStepsReps,
  formatStepsDash,
  normalizeTrainingPattern,
  PYRAMID_PATTERN_TYPES
} from '../../../services/trainingPatterns/pyramidEngine';
import {
  parseStraightSetSeries,
  collectRecentSessionTotalsForExercise,
  estimateSessionsPerWeek,
  resolveObservedMaxReps,
  collectProgramExercises,
  collectCustomProgramExercises
} from '../../../services/trainingPatterns/pyramidUserSignals';
import { applyPyramidTemplateToProgramExercise, buildMinimalProgramWithPyramidExercise } from '../../../services/trainingPatterns/pyramidProgramUtils';
import Card, { CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { useWorkout } from '../../../context/WorkoutContext';
import { PROGRAM_STATUS } from '../../../context/WorkoutContext/constants';

const WEEK_DAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const DAY_LABELS = {
  lundi: 'Lun',
  mardi: 'Mar',
  mercredi: 'Mer',
  jeudi: 'Jeu',
  vendredi: 'Ven',
  samedi: 'Sam',
  dimanche: 'Dim'
};

function rowKey(r) {
  return `${r.dayKey}|${r.variantKey || 'main'}|${r.exercise?.id}`;
}

const toDateInputValue = (d) => {
  const x = d instanceof Date ? d : new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, '0');
  const day = String(x.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

function flattenProgramExercises(program) {
  if (!program?.schedule) return [];
  const rows = [];
  WEEK_DAYS.forEach((dayKey) => {
    const day = program.schedule[dayKey];
    if (!day) return;
    (day.exercises || []).forEach((ex) => {
      rows.push({ dayKey, variantKey: null, exercise: ex });
    });
    ['semaineA', 'semaineB'].forEach((vk) => {
      const list = day.salleVariants?.[vk]?.exercises;
      if (!Array.isArray(list)) return;
      list.forEach((ex) => rows.push({ dayKey, variantKey: vk, exercise: ex }));
    });
  });
  return rows;
}

const PyramidGeneratorPanel = () => {
  const {
    data,
    getCurrentData,
    updateData,
    getExerciseNameById,
    activeProgram,
    programs,
    addProgram,
    updateProgram
  } = useWorkout();

  const exerciseOptions = useMemo(() => {
    const map = new Map();
    collectProgramExercises(workoutProgram).forEach((e) => map.set(e.id, e));
    collectCustomProgramExercises(activeProgram).forEach((e) => {
      if (!map.has(e.id)) map.set(e.id, e);
    });
    programs.forEach((p) => {
      collectCustomProgramExercises(p).forEach((e) => {
        if (!map.has(e.id)) map.set(e.id, e);
      });
    });
    return [...map.values()].sort((a, b) => String(a.name).localeCompare(String(b.name), 'fr'));
  }, [activeProgram, programs]);

  const [selectedId, setSelectedId] = useState('');
  useEffect(() => {
    if (selectedId) return;
    const pull = exerciseOptions.find(
      (r) =>
        String(r.name).toLowerCase().includes('traction') &&
        !String(r.name).toLowerCase().includes('austral')
    );
    const first = pull || exerciseOptions[0];
    if (first) setSelectedId(String(first.id));
  }, [exerciseOptions, selectedId]);

  const [dateStr, setDateStr] = useState(() => toDateInputValue(new Date()));
  const [customPeak, setCustomPeak] = useState(5);
  const [customMode, setCustomMode] = useState('full');
  const [toast, setToast] = useState('');

  const [targetProgramId, setTargetProgramId] = useState('');
  const [targetExerciseRow, setTargetExerciseRow] = useState('');
  const [targetPreset, setTargetPreset] = useState('auto');
  const [newProgramName, setNewProgramName] = useState('');

  const live = typeof getCurrentData === 'function' ? getCurrentData() : data;
  const records = Array.isArray(live?.exerciseMaxRecords) ? live.exerciseMaxRecords : [];
  const reps = live?.reps || {};

  const selectedRow = useMemo(
    () => exerciseOptions.find((r) => String(r.id) === String(selectedId)),
    [exerciseOptions, selectedId]
  );

  const signals = useMemo(() => {
    const id = selectedId;
    const observedMax = resolveObservedMaxReps(records, {
      programExerciseId: id,
      exerciseName: selectedRow?.name || getExerciseNameById?.(id)
    });
    const recent = collectRecentSessionTotalsForExercise(reps, id, { maxDays: 90 });
    const sessionsPerWeek = estimateSessionsPerWeek(reps, id, { windowDays: 42 });
    const straightSets = parseStraightSetSeries(selectedRow?.series || '');
    return { observedMax, recent, sessionsPerWeek, straightSets };
  }, [records, reps, selectedId, selectedRow?.series, getExerciseNameById]);

  const suggestions = useMemo(
    () =>
      buildPyramidSuggestions({
        observedMax: signals.observedMax,
        meanSessionTotal: signals.recent.meanPerSession,
        sessionsPerWeek: signals.sessionsPerWeek,
        straightSets: signals.straightSets
      }),
    [signals.observedMax, signals.recent.meanPerSession, signals.sessionsPerWeek, signals.straightSets]
  );

  const customPreview = useMemo(() => {
    const peak = Math.max(1, Math.min(20, Math.floor(Number(customPeak) || 1)));
    const steps =
      customMode === 'ascending' ? buildAscendingSteps(peak) : buildFullPyramidSteps(peak);
    const rest = suggestRestSeconds(
      customMode === 'ascending' ? PYRAMID_PATTERN_TYPES.ASCENDING : PYRAMID_PATTERN_TYPES.FULL,
      peak
    );
    return {
      peak,
      steps,
      totalReps: sumStepsReps(steps, 1),
      patternType:
        customMode === 'ascending' ? PYRAMID_PATTERN_TYPES.ASCENDING : PYRAMID_PATTERN_TYPES.FULL,
      ...rest
    };
  }, [customPeak, customMode]);

  const appliedForDate = live?.dailyVariations?.[dateStr]?.exerciseTrainingPatterns?.[String(selectedId)];

  const persistPattern = useCallback(
    async (rawPattern) => {
      const normalized = normalizeTrainingPattern(rawPattern);
      if (!normalized) return;
      const current = typeof getCurrentData === 'function' ? getCurrentData() : data;
      const existing = current.dailyVariations?.[dateStr] || {};
      const prevPatterns = { ...(existing.exerciseTrainingPatterns || {}) };
      prevPatterns[String(selectedId)] = {
        ...normalized,
        exerciseName: getExerciseNameById?.(selectedId) || selectedRow?.name || String(selectedId)
      };

      const nextVariation = {
        ...existing,
        date: dateStr,
        version: existing.version || '1.0',
        schemaVersion: existing.schemaVersion ?? 1,
        suppressedExercises: existing.suppressedExercises || [],
        additionalExercises: existing.additionalExercises || [],
        createdAt: existing.createdAt || new Date(),
        lastModifiedAt: new Date(),
        modificationCount: (existing.modificationCount || 0) + 1,
        lastExceptionalIdCounter: existing.lastExceptionalIdCounter || 0,
        exerciseTrainingPatterns: prevPatterns,
        ...(existing.exerciseSeriesOverrides && Object.keys(existing.exerciseSeriesOverrides).length > 0
          ? { exerciseSeriesOverrides: { ...existing.exerciseSeriesOverrides } }
          : {})
      };

      await updateData({
        ...current,
        dailyVariations: {
          ...(current.dailyVariations || {}),
          [dateStr]: nextVariation
        }
      });
      setToast('Plan enregistré pour ce jour — visible dans Aujourd’hui sous l’exercice.');
      setTimeout(() => setToast(''), 4000);
    },
    [data, dateStr, getCurrentData, getExerciseNameById, selectedId, selectedRow?.name, updateData]
  );

  const clearPattern = useCallback(async () => {
    const current = typeof getCurrentData === 'function' ? getCurrentData() : data;
    const existing = current.dailyVariations?.[dateStr];
    if (!existing) return;
    const prevPatterns = { ...(existing.exerciseTrainingPatterns || {}) };
    delete prevPatterns[String(selectedId)];

    const hasOverrides =
      existing.exerciseSeriesOverrides && Object.keys(existing.exerciseSeriesOverrides).length > 0;
    const hasPatterns = Object.keys(prevPatterns).length > 0;
    const hasOther =
      (existing.suppressedExercises?.length || 0) > 0 ||
      (existing.additionalExercises?.length || 0) > 0 ||
      hasOverrides ||
      hasPatterns;

    const nextDaily = { ...(current.dailyVariations || {}) };
    if (hasOther) {
      const nextVar = {
        ...existing,
        lastModifiedAt: new Date(),
        modificationCount: (existing.modificationCount || 0) + 1
      };
      if (hasPatterns) {
        nextVar.exerciseTrainingPatterns = prevPatterns;
      } else {
        delete nextVar.exerciseTrainingPatterns;
      }
      nextDaily[dateStr] = nextVar;
    } else {
      delete nextDaily[dateStr];
    }

    await updateData({ ...current, dailyVariations: nextDaily });
    setToast('Plan pyramide retiré pour cet exercice et cette date.');
    setTimeout(() => setToast(''), 3500);
  }, [data, dateStr, getCurrentData, selectedId, updateData]);

  const copySteps = useCallback((steps) => {
    const text = formatStepsDash(steps);
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
      setToast('Séquence copiée dans le presse-papiers.');
      setTimeout(() => setToast(''), 2500);
    }
  }, []);

  const targetProgram = useMemo(
    () => programs.find((p) => String(p.id) === String(targetProgramId)),
    [programs, targetProgramId]
  );

  const targetProgramRows = useMemo(() => flattenProgramExercises(targetProgram || {}), [targetProgram]);

  useEffect(() => {
    if (!targetProgramRows.length) {
      setTargetExerciseRow('');
      return;
    }
    if (!targetExerciseRow || !targetProgramRows.some((r) => rowKey(r) === targetExerciseRow)) {
      setTargetExerciseRow(rowKey(targetProgramRows[0]));
    }
  }, [targetProgramRows, targetExerciseRow]);

  const applyTemplateToSelectedProgram = useCallback(async () => {
    if (!targetProgram || !targetExerciseRow) {
      setToast('Choisis un programme et un exercice cible.');
      setTimeout(() => setToast(''), 3000);
      return;
    }
    const row = targetProgramRows.find((r) => rowKey(r) === targetExerciseRow);
    if (!row) return;
    const template = {
      enabled: true,
      preset: targetPreset
    };
    const next = applyPyramidTemplateToProgramExercise(targetProgram, {
      dayKey: row.dayKey,
      variantKey: row.variantKey,
      exerciseId: row.exercise.id,
      pyramidTemplate: template
    });
    await updateProgram(next);
    setToast('Modèle pyramide enregistré sur l’exercice du programme (priorité Aujourd’hui : variation du jour si présente).');
    setTimeout(() => setToast(''), 4500);
  }, [targetProgram, targetProgramRows, targetExerciseRow, targetPreset, updateProgram]);

  const createProgramFromCurrentExercise = useCallback(async () => {
    if (!selectedRow) return;
    const template = { enabled: true, preset: targetPreset };
    const payload = buildMinimalProgramWithPyramidExercise({
      name: selectedRow.name,
      series: selectedRow.series || '5×4',
      pyramidTemplate: template,
      programName: newProgramName.trim() || undefined
    });
    const created = addProgram(payload);
    if (created) {
      setToast(`Programme « ${created.name} » créé — tu peux l’activer depuis l’onglet Programme.`);
      setTimeout(() => setToast(''), 5000);
      setTargetProgramId(String(created.id));
    }
  }, [addProgram, newProgramName, selectedRow, targetPreset]);

  const name = getExerciseNameById?.(selectedId) || selectedRow?.name || `Exercice ${selectedId}`;

  return (
    <div className="space-y-4">
      {toast ? (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-100">
          {toast}
        </div>
      ) : null}

      <Card variant="sport">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-5 w-5 text-amber-200" />
            Pyramides intelligentes (v3)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-slate-200">
          <p className="text-xs text-slate-400 leading-relaxed">
            Suggestions calées sur tes <strong>séries × reps</strong> du programme (volume cible) + max Performances +
            fréquence. Tu peux appliquer au <strong>calendrier (variation du jour)</strong> ou écrire un{' '}
            <strong>modèle pyramide</strong> directement sur un exercice d’un programme (onglet Programme ou
            ci-dessous).
          </p>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs text-slate-500">Exercice</span>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full rounded-lg border border-[#0F4C5C]/55 bg-black px-2 py-2 text-slate-100"
              >
                {exerciseOptions.length === 0 ? (
                  <option value="">Aucun exercice — crée / active un programme</option>
                ) : (
                  exerciseOptions.map((r) => (
                    <option key={r.id} value={String(r.id)}>
                      {r.name} (id {r.id})
                    </option>
                  ))
                )}
              </select>
            </label>
            <label className="space-y-1">
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <CalendarDays className="h-3.5 w-3.5" /> Date cible (variation du jour)
              </span>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full rounded-lg border border-[#0F4C5C]/55 bg-black px-2 py-2 text-slate-100"
              />
            </label>
          </div>

          <div className="rounded-lg border border-[#0F4C5C]/40 bg-black/80 p-3 text-xs text-slate-300 space-y-1">
            <div className="font-medium text-slate-100">Signaux pour « {name} »</div>
            <div>Max enregistré (Performances) : {signals.observedMax != null ? `${signals.observedMax} reps` : '—'}</div>
            <div>
              Volume moyen / séance (90 j) :{' '}
              {signals.recent.meanPerSession != null ? `${signals.recent.meanPerSession} reps` : '—'}
            </div>
            <div>
              Fréquence estimée :{' '}
              {signals.sessionsPerWeek != null ? `~${signals.sessionsPerWeek} séances / semaine` : '—'}
            </div>
            <div>
              Série programme (texte) :{' '}
              {signals.straightSets
                ? `${signals.straightSets.sets}×${signals.straightSets.repsPerSet} (ancre volume « auto »)`
                : selectedRow?.series
                  ? `"${selectedRow.series}" (non parsé : l’« auto » utilisera les suggestions par max)`
                  : '—'}
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-sky-500/25 bg-sky-950/20 p-2 text-[11px] text-sky-100/90">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Modèle sur programme : <code className="text-sky-200/90">auto</code> choisit la suggestion la plus proche
              de ton volume séries×reps ; <code className="text-sky-200/90">light / ascending / full</code> fixe le type.
              La variation du jour (Défis) reste prioritaire sur Aujourd’hui si elle existe pour cette date.
            </span>
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Suggestions</div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {suggestions.map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl border border-[#0F4C5C]/50 bg-black p-3 flex flex-col gap-2"
                >
                  <div className="font-medium text-white">{s.label}</div>
                  <div className="text-[11px] text-slate-400">{s.intent}</div>
                  <div className="text-xs text-slate-300">
                    Pic {s.peak} · {s.totalReps} reps totales
                  </div>
                  <div className="font-mono text-[11px] text-amber-100/90 break-all">{formatStepsDash(s.steps)}</div>
                  <div className="text-[10px] text-slate-500 space-y-0.5">
                    <div>Repos entre paliers ~{s.restBetweenStepsSec}s</div>
                    <div>Repos entre tours ~{s.restBetweenRoundsSec}s</div>
                    {s.restAfterPeakSec != null ? <div>Optionnel après pic ~{s.restAfterPeakSec}s</div> : null}
                    {s.volumeNote ? <div className="text-sky-200/80">{s.volumeNote}</div> : null}
                  </div>
                  <div className="mt-auto flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        persistPattern({
                          patternType: s.patternType,
                          steps: s.steps,
                          rounds: s.rounds,
                          restBetweenStepsSec: s.restBetweenStepsSec,
                          restBetweenRoundsSec: s.restBetweenRoundsSec,
                          restAfterPeakSec: s.restAfterPeakSec,
                          label: s.label
                        })
                      }
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/45 bg-emerald-900/30 px-2 py-1 text-xs text-emerald-100"
                    >
                      <Check className="h-3.5 w-3.5" /> Jour (variation)
                    </button>
                    <button
                      type="button"
                      onClick={() => copySteps(s.steps)}
                      className="inline-flex items-center gap-1 rounded-lg border border-slate-600 bg-slate-900/40 px-2 py-1 text-xs text-slate-200"
                    >
                      <Copy className="h-3.5 w-3.5" /> Copier
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 rounded-xl border border-violet-500/35 bg-violet-950/15 p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-violet-200/90">
              Écrire le modèle sur un programme
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-[11px] text-slate-500">Programme</span>
                <select
                  value={targetProgramId}
                  onChange={(e) => setTargetProgramId(e.target.value)}
                  className="w-full rounded-lg border border-[#0F4C5C]/55 bg-black px-2 py-2 text-slate-100"
                >
                  <option value="">— Choisir —</option>
                  {programs.map((p) => (
                    <option key={p.id} value={String(p.id)}>
                      {p.name} {p.status === PROGRAM_STATUS.ACTIVE ? '(actif)' : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-[11px] text-slate-500">Préréglage modèle</span>
                <select
                  value={targetPreset}
                  onChange={(e) => setTargetPreset(e.target.value)}
                  className="w-full rounded-lg border border-[#0F4C5C]/55 bg-black px-2 py-2 text-slate-100"
                >
                  <option value="auto">Auto (proche du volume séries×reps)</option>
                  <option value="light">Légère</option>
                  <option value="ascending">Montante</option>
                  <option value="full">Complète</option>
                </select>
              </label>
            </div>
            <label className="space-y-1">
              <span className="text-[11px] text-slate-500">Exercice dans ce programme</span>
              <select
                value={targetExerciseRow}
                onChange={(e) => setTargetExerciseRow(e.target.value)}
                className="w-full rounded-lg border border-[#0F4C5C]/55 bg-black px-2 py-2 text-slate-100"
              >
                {targetProgramRows.length === 0 ? (
                  <option value="">Aucun exercice dans ce programme</option>
                ) : (
                  targetProgramRows.map((r) => (
                    <option key={rowKey(r)} value={rowKey(r)}>
                      {DAY_LABELS[r.dayKey] || r.dayKey} {r.variantKey ? `· ${r.variantKey}` : ''} — {r.exercise.name}{' '}
                      ({r.exercise.series || '—'})
                    </option>
                  ))
                )}
              </select>
            </label>
            <button
              type="button"
              onClick={applyTemplateToSelectedProgram}
              className="rounded-lg border border-violet-500/50 bg-violet-900/30 px-3 py-1.5 text-xs text-violet-100"
            >
              Enregistrer le modèle pyramide sur cet exercice
            </button>
          </div>

          <div className="space-y-2 rounded-xl border border-teal-500/35 bg-teal-950/15 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-teal-200/90">
              <FolderPlus className="h-4 w-4" />
              Nouveau programme autour de l’exercice sélectionné (haut)
            </div>
            <input
              type="text"
              value={newProgramName}
              onChange={(e) => setNewProgramName(e.target.value)}
              placeholder="Nom du programme (optionnel)"
              className="w-full rounded-lg border border-[#0F4C5C]/55 bg-black px-2 py-2 text-sm text-slate-100"
            />
            <button
              type="button"
              onClick={createProgramFromCurrentExercise}
              disabled={!selectedRow}
              className="rounded-lg border border-teal-500/50 bg-teal-900/30 px-3 py-1.5 text-xs text-teal-100 disabled:opacity-40"
            >
              Créer un programme (lundi pyramide + préréglage ci-dessus)
            </button>
          </div>

          <div className="space-y-2 rounded-xl border border-[#0F4C5C]/45 bg-black p-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Constructeur manuel</div>
            <div className="flex flex-wrap items-end gap-3">
              <label className="space-y-1">
                <span className="text-xs text-slate-500">Pic (1–20)</span>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={customPeak}
                  onChange={(e) => setCustomPeak(Number(e.target.value))}
                  className="w-24 rounded-lg border border-[#0F4C5C]/55 bg-black px-2 py-1.5 text-slate-100"
                />
              </label>
              <label className="space-y-1">
                <span className="text-xs text-slate-500">Mode</span>
                <select
                  value={customMode}
                  onChange={(e) => setCustomMode(e.target.value)}
                  className="rounded-lg border border-[#0F4C5C]/55 bg-black px-2 py-1.5 text-slate-100"
                >
                  <option value="full">Complète (1..n..1)</option>
                  <option value="ascending">Montante (1..n)</option>
                </select>
              </label>
              <button
                type="button"
                onClick={() =>
                  persistPattern({
                    patternType: customPreview.patternType,
                    steps: customPreview.steps,
                    rounds: 1,
                    restBetweenStepsSec: customPreview.restBetweenStepsSec,
                    restBetweenRoundsSec: customPreview.restBetweenRoundsSec,
                    restAfterPeakSec: customPreview.restAfterPeakSec,
                    label: `Pyramide manuelle pic ${customPreview.peak}`
                  })
                }
                className="rounded-lg border border-[#0F5C45]/55 bg-[#0F5C45]/35 px-3 py-1.5 text-xs text-white"
              >
                Appliquer au jour
              </button>
            </div>
            <div className="text-[11px] text-slate-400">
              Aperçu : <span className="font-mono text-amber-100">{formatStepsDash(customPreview.steps)}</span> ·{' '}
              {customPreview.totalReps} reps
            </div>
            <div className="text-[10px] text-slate-500">
              Pic indicatif (max enregistré {signals.observedMax ?? '—'}) :{' '}
              {signals.observedMax
                ? clampPeakFromMax(signals.observedMax, { ratio: 0.72, minPeak: 3, maxPeak: 12 })
                : '—'}
            </div>
          </div>

          <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="text-xs text-rose-100/90">
              {appliedForDate ? (
                <>
                  <span className="font-medium text-white">Variation du jour :</span>{' '}
                  {appliedForDate.label || appliedForDate.patternType} — {formatStepsDash(appliedForDate.steps)} (
                  {appliedForDate.totalReps} reps)
                </>
              ) : (
                <>Aucune variation pyramide pour cet exercice à cette date.</>
              )}
            </div>
            {appliedForDate ? (
              <button
                type="button"
                onClick={clearPattern}
                className="inline-flex items-center gap-1 self-start rounded-lg border border-rose-500/45 bg-rose-950/40 px-2 py-1 text-xs text-rose-100"
              >
                <Trash2 className="h-3.5 w-3.5" /> Retirer variation jour
              </button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PyramidGeneratorPanel;
