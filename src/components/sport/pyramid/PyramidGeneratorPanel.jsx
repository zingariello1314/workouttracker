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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
      {toast ? (
        <div className="note" style={{ margin: 0, borderStyle: 'solid', borderColor: 'var(--t-cl)', color: 'var(--t-cl)' }}>
          {toast}
        </div>
      ) : null}

      <section>
        <div className="sec-h">
          <div>
            <h2>Pyramides intelligentes (V3)</h2>
            <p>
              Suggestions calées sur tes <b style={{ color: 'var(--bone)' }}>séries × reps</b> du programme (volume cible) + max
              Performances + fréquence. Tu peux appliquer au{' '}
              <b style={{ color: 'var(--bone)' }}>calendrier (variation du jour)</b> ou écrire un{' '}
              <b style={{ color: 'var(--bone)' }}>modèle pyramide</b> directement sur un exercice d’un programme (onglet
              Programme ou ci-dessous).
            </p>
          </div>
        </div>

        <div className="nums" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <label className="fld">
            <span className="lab">Exercice</span>
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
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
          <label className="fld">
            <span className="lab" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <CalendarDays className="ic" style={{ width: 13, height: 13 }} /> Date cible (variation du jour)
            </span>
            <input type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} />
          </label>
        </div>

        <div className="signals">
          <span className="lab">Signaux pour « {name} »</span>
          <dl className="num">
            <div>
              <dt>Max enregistré (Performances)</dt>
              <dd>{signals.observedMax != null ? `${signals.observedMax} reps` : '—'}</dd>
            </div>
            <div>
              <dt>Volume moyen / séance (90 j)</dt>
              <dd>{signals.recent.meanPerSession != null ? `${signals.recent.meanPerSession} reps` : '—'}</dd>
            </div>
            <div>
              <dt>Fréquence estimée</dt>
              <dd>{signals.sessionsPerWeek != null ? `~${signals.sessionsPerWeek} séances / semaine` : '—'}</dd>
            </div>
            <div>
              <dt>Série programme (texte)</dt>
              <dd>
                {signals.straightSets ? (
                  <>
                    {signals.straightSets.sets}×{signals.straightSets.repsPerSet} <span>(ancre volume « auto »)</span>
                  </>
                ) : selectedRow?.series ? (
                  <>
                    “{selectedRow.series}” <span>(non parsé : l’« auto » utilisera les suggestions par max)</span>
                  </>
                ) : (
                  '—'
                )}
              </dd>
            </div>
          </dl>
        </div>

        <div className="note" style={{ marginTop: 0 }}>
          <Info className="ic" style={{ width: 14, height: 14, display: 'inline', marginRight: 8, verticalAlign: '-2px', color: 'var(--accent)' }} />
          Modèle sur programme : <code>auto</code> choisit la suggestion la plus proche de ton volume séries×reps ;{' '}
          <code>light / ascending / full</code> fixe le type. La variation du jour (Défis) reste prioritaire sur Aujourd’hui si
          elle existe pour cette date.
        </div>
      </section>

      <section>
        <div className="sec-h">
          <div>
            <h2>Suggestions</h2>
          </div>
        </div>
        <div className="sugs">
          {suggestions.map((s) => (
            <article key={s.id} className="box sug">
              <h3>{s.label}</h3>
              <p className="tiny" style={{ color: 'var(--bone-2)', margin: 0 }}>{s.intent}</p>
              <div className="pk">
                <b className="num">Pic {s.peak}</b>
                <span className="num">{s.totalReps} reps totales</span>
              </div>
              <div className="seq">{formatStepsDash(s.steps)}</div>
              <p className="tiny num" style={{ margin: 0 }}>Repos entre paliers ~{s.restBetweenStepsSec}s</p>
              <p className="tiny num" style={{ margin: 0 }}>Repos entre tours ~{s.restBetweenRoundsSec}s</p>
              {s.restAfterPeakSec != null ? (
                <p className="tiny num" style={{ margin: 0 }}>Optionnel après pic ~{s.restAfterPeakSec}s</p>
              ) : null}
              {s.volumeNote ? <p className="pct">{s.volumeNote}</p> : null}
              <div className="ra">
                <button
                  type="button"
                  className="btn sm"
                  style={{ color: 'var(--t-fract)', borderColor: 'var(--t-fract)' }}
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
                >
                  <Check className="ic" style={{ width: 14, height: 14 }} /> Jour (variation)
                </button>
                <button type="button" className="btn sm" onClick={() => copySteps(s.steps)}>
                  <Copy className="ic" style={{ width: 14, height: 14 }} /> Copier
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="split2">
        <div className="box pad">
          <h3 className="bt" style={{ color: 'var(--t-seuil)' }}>
            <Layers className="ic" /> Écrire le modèle sur un programme
          </h3>
          <div className="nums" style={{ gridTemplateColumns: '1fr 1fr', marginTop: 14 }}>
            <label className="fld">
              <span className="lab">Programme</span>
              <select value={targetProgramId} onChange={(e) => setTargetProgramId(e.target.value)}>
                <option value="">— Choisir —</option>
                {programs.map((p) => (
                  <option key={p.id} value={String(p.id)}>
                    {p.name} {p.status === PROGRAM_STATUS.ACTIVE ? '(actif)' : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="fld">
              <span className="lab">Préréglage modèle</span>
              <select value={targetPreset} onChange={(e) => setTargetPreset(e.target.value)}>
                <option value="auto">Auto (proche du volume séries×reps)</option>
                <option value="light">Légère</option>
                <option value="ascending">Montante</option>
                <option value="full">Complète</option>
              </select>
            </label>
          </div>
          <label className="fld" style={{ marginTop: 12 }}>
            <span className="lab">Exercice dans ce programme</span>
            <select value={targetExerciseRow} onChange={(e) => setTargetExerciseRow(e.target.value)}>
              {targetProgramRows.length === 0 ? (
                <option value="">Aucun exercice dans ce programme</option>
              ) : (
                targetProgramRows.map((r) => (
                  <option key={rowKey(r)} value={rowKey(r)}>
                    {DAY_LABELS[r.dayKey] || r.dayKey} {r.variantKey ? `· ${r.variantKey}` : ''} — {r.exercise.name} (
                    {r.exercise.series || '—'})
                  </option>
                ))
              )}
            </select>
          </label>
          <button
            type="button"
            className="btn"
            style={{ marginTop: 14, color: 'var(--t-seuil)', borderColor: 'var(--t-seuil)' }}
            onClick={applyTemplateToSelectedProgram}
          >
            Enregistrer le modèle pyramide sur cet exercice
          </button>
        </div>

        <div className="box pad">
          <h3 className="bt" style={{ color: 'var(--t-cl)' }}>
            <FolderPlus className="ic" /> Nouveau programme autour de l’exercice sélectionné (haut)
          </h3>
          <label className="fld" style={{ marginTop: 14 }}>
            <span className="lab">Nom du programme (optionnel)</span>
            <input
              type="text"
              value={newProgramName}
              onChange={(e) => setNewProgramName(e.target.value)}
              placeholder="Nom du programme (optionnel)"
            />
          </label>
          <button
            type="button"
            className="btn"
            style={{ marginTop: 14, color: 'var(--t-cl)', borderColor: 'var(--t-cl)' }}
            onClick={createProgramFromCurrentExercise}
            disabled={!selectedRow}
          >
            Créer un programme (lundi pyramide + préréglage ci-dessus)
          </button>
        </div>
      </section>

      <section className="box pad">
        <h3 className="bt">Constructeur manuel</h3>
        <div className="cm2">
          <label className="fld" style={{ width: 120 }}>
            <span className="lab">Pic (1–20)</span>
            <input
              type="number"
              min={1}
              max={20}
              value={customPeak}
              onChange={(e) => setCustomPeak(Number(e.target.value))}
            />
          </label>
          <label className="fld" style={{ width: 220 }}>
            <span className="lab">Mode</span>
            <select value={customMode} onChange={(e) => setCustomMode(e.target.value)}>
              <option value="full">Complète (1..n..1)</option>
              <option value="ascending">Montante (1..n)</option>
            </select>
          </label>
          <button
            type="button"
            className="btn pri"
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
          >
            Appliquer au jour
          </button>
        </div>
        <p className="prev">
          Aperçu : <span className="seq">{formatStepsDash(customPreview.steps)}</span> ·{' '}
          <b className="num">{customPreview.totalReps} reps</b>
        </p>
        <p className="tiny" style={{ margin: 0 }}>
          Pic indicatif (max enregistré {signals.observedMax ?? '—'}) :{' '}
          {signals.observedMax ? clampPeakFromMax(signals.observedMax, { ratio: 0.72, minPeak: 3, maxPeak: 12 }) : '—'}
        </p>
      </section>

      <div
        className="alert"
        style={
          appliedForDate
            ? {
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                borderColor: 'var(--t-cl)',
                color: 'var(--bone)',
                background: 'color-mix(in srgb, var(--t-cl) 8%, transparent)'
              }
            : undefined
        }
      >
        {appliedForDate ? (
          <>
            <span>
              <b>Variation du jour :</b> {appliedForDate.label || appliedForDate.patternType} —{' '}
              <span className="seq">{formatStepsDash(appliedForDate.steps)}</span> ({appliedForDate.totalReps} reps)
            </span>
            <button
              type="button"
              className="btn sm"
              style={{ color: 'var(--t-vit)', borderColor: 'var(--t-vit)' }}
              onClick={clearPattern}
            >
              <Trash2 className="ic" style={{ width: 14, height: 14 }} /> Retirer variation jour
            </button>
          </>
        ) : (
          <>Aucune variation pyramide pour cet exercice à cette date.</>
        )}
      </div>
    </div>
  );
};

export default PyramidGeneratorPanel;
