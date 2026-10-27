import React, { useEffect, useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import {
  defaultGtgProtocolGoal,
  estimateGtgMaxFromWorkingReps,
  getGtgExerciseLabel,
  resolveGtgBodyWeightKg,
  resolveGtgMaxReps,
  todayYmd,
  updateGtgConfig,
  updateGtgExerciseConfig,
  updateGtgProtocolExercise
} from '../../../../services/endurance/gtgService';
import { applyGtgDeclaredMaxToData } from '../../../../services/endurance/gtgMaxPerformance';

/**
 * Module protocole (Pratique) — repliable.
 * Demande max / objectif / reps tant que non renseignés ; poids indexé sur
 * impédancemètre / métriques Aujourd’hui dès qu’ils existent.
 */
export default function GtgProtocolDataBanner({
  gtgData,
  ctx,
  data,
  updateData,
  saving = false,
  t
}) {
  const selectedIds = gtgData?.config?.selectedIds || [];
  const bodyW = useMemo(
    () =>
      resolveGtgBodyWeightKg(gtgData, {
        workoutData: data,
        profileQuestionnaire: ctx?.profileQuestionnaire
      }),
    [gtgData, data, ctx?.profileQuestionnaire]
  );

  const rows = useMemo(() => {
    return selectedIds.map((id) => {
      const proto = gtgData.config.protocolByExercise?.[id] || {};
      const workingRepsRaw = gtgData.config.perExercise?.[id]?.repsPerSet;
      const workingReps =
        Number.isFinite(Number(workingRepsRaw)) && Number(workingRepsRaw) > 0
          ? Math.round(Number(workingRepsRaw))
          : null;
      const estimated = workingReps != null ? estimateGtgMaxFromWorkingReps(workingReps) : null;
      const resolved = resolveGtgMaxReps(id, ctx);
      const max =
        proto.currentMax > 0
          ? Math.round(proto.currentMax)
          : estimated != null
            ? estimated
            : resolved > 0
              ? Math.round(resolved)
              : '';
      const goal =
        proto.goal > 0
          ? Math.round(proto.goal)
          : max
            ? defaultGtgProtocolGoal(max)
            : '';
      return {
        id,
        label: getGtgExerciseLabel(id, gtgData.config, ctx),
        max,
        goal,
        reps: workingReps || '',
        hasDeclaredMax: proto.currentMax > 0,
        hasDeclaredGoal: proto.goal > 0,
        hasReps: workingReps != null
      };
    });
  }, [selectedIds, gtgData, ctx]);

  const gaps = useMemo(() => {
    const missingMax = rows.filter((r) => !r.hasDeclaredMax);
    const missingReps = rows.filter((r) => !r.hasReps);
    const needWeight = !bodyW.known;
    return {
      missingMax,
      missingReps,
      needWeight,
      incomplete: missingMax.length > 0 || missingReps.length > 0 || needWeight
    };
  }, [rows, bodyW.known]);

  const [drafts, setDrafts] = useState({});
  const [weightDraft, setWeightDraft] = useState('');
  const [collapsed, setCollapsed] = useState(() => !gaps.incomplete);
  const [userToggled, setUserToggled] = useState(false);

  // Auto : ouvert tant qu’il manque des données ; se replie une fois tout enregistré
  // (sauf si l’utilisateur a forcé l’état manuellement).
  useEffect(() => {
    if (userToggled) return;
    setCollapsed(!gaps.incomplete);
  }, [gaps.incomplete, userToggled]);

  if (selectedIds.length === 0) return null;

  const getDraft = (id, field, fallback) => {
    const key = `${id}:${field}`;
    if (Object.prototype.hasOwnProperty.call(drafts, key)) return drafts[key];
    return fallback === '' || fallback == null ? '' : String(fallback);
  };

  const setDraft = (id, field, value) => {
    setDrafts((prev) => ({ ...prev, [`${id}:${field}`]: value }));
  };

  const persist = async (nextGtg, declaredMax = null) => {
    if (typeof updateData !== 'function') return;
    let nextData = {
      ...data,
      enduranceData: {
        ...(data.enduranceData || {}),
        gtg: nextGtg,
        lastUpdated: new Date().toISOString()
      }
    };
    if (declaredMax?.exerciseId && Number(declaredMax.reps) > 0) {
      nextData = applyGtgDeclaredMaxToData(nextData, {
        gtgExerciseId: declaredMax.exerciseId,
        reps: declaredMax.reps,
        config: nextGtg.config,
        dateStr: todayYmd(),
        ctx
      });
    }
    await updateData(nextData);
  };

  const parsePositive = (raw) => {
    const n = Math.round(Number(String(raw ?? '').replace(',', '.')));
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  const onSaveRow = async (row) => {
    const maxN = parsePositive(getDraft(row.id, 'max', row.max));
    const goalN = parsePositive(getDraft(row.id, 'goal', row.goal));
    const repsN = parsePositive(getDraft(row.id, 'reps', row.reps));
    if (!maxN && !goalN && !repsN) return;

    let next = gtgData;
    if (maxN || goalN) {
      const patch = {};
      if (maxN) patch.currentMax = maxN;
      if (goalN) patch.goal = goalN;
      next = updateGtgProtocolExercise(next, row.id, patch);
    }
    if (repsN) {
      next = updateGtgExerciseConfig(next, row.id, { repsPerSet: repsN });
    }
    await persist(next, maxN ? { exerciseId: row.id, reps: maxN } : null);
    setUserToggled(false);
  };

  const onSaveWeight = async () => {
    const n = Number(String(weightDraft || bodyW.kg || '').replace(',', '.'));
    if (!Number.isFinite(n) || n <= 0) return;
    const next = updateGtgConfig(gtgData, { bodyWeightKg: Math.round(n * 10) / 10 });
    await persist(next);
    setUserToggled(false);
  };

  const toggleCollapse = () => {
    setUserToggled(true);
    setCollapsed((v) => !v);
  };

  const sourceLabel =
    bodyW.source === 'impedance'
      ? t('endurance.gtg.protocolData.weightSourceImpedance')
      : bodyW.source === 'metrics'
        ? t('endurance.gtg.protocolData.weightSourceToday')
        : bodyW.source === 'quiz'
          ? t('endurance.gtg.protocolData.weightSourceQuiz')
          : bodyW.source === 'gtg'
            ? t('endurance.gtg.protocolData.weightSourceGtg')
            : null;

  const summaryBits = [];
  if (bodyW.known) summaryBits.push(`${bodyW.kg} kg`);
  const declaredCount = rows.filter((r) => r.hasDeclaredMax).length;
  summaryBits.push(`${declaredCount}/${rows.length} max`);
  if (gaps.incomplete) {
    summaryBits.push(t('endurance.gtg.protocolData.needsData'));
  }

  return (
    <details
      className="proto"
      open={!collapsed}
      style={{ marginBottom: 8, borderColor: gaps.incomplete ? 'var(--t-fract)' : undefined }}
    >
      <summary
        onClick={(e) => {
          e.preventDefault();
          toggleCollapse();
        }}
      >
        <span className="k">{t('endurance.gtg.protocolData.title')}</span>
        <span className="v num">{summaryBits.join(' · ')}</span>
        <span className="o">
          {collapsed ? t('endurance.gtg.protocolData.expand') : t('endurance.gtg.protocolData.collapse')}
        </span>
      </summary>

      {!collapsed && (
        <div style={{ padding: '0 0 22px' }}>
          <p className="tiny" style={{ margin: '0 0 16px' }}>{t('endurance.gtg.protocolData.hint')}</p>

          <div className="cf" style={{ padding: '16px 0' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '6px 14px' }}>
              <span className="lab" style={{ color: 'var(--bone-2)' }}>{t('endurance.gtg.protocolData.weightLabel')}</span>
              {bodyW.known ? (
                <span className="mono num" style={{ fontSize: 12, color: 'var(--t-cl)' }}>
                  {bodyW.kg} kg
                  {sourceLabel ? ` · ${sourceLabel}` : ''}
                  {bodyW.dateYmd ? ` · ${bodyW.dateYmd}` : ''}
                </span>
              ) : null}
            </div>
            <p className="tiny" style={{ margin: '6px 0 0' }}>
              {bodyW.known && (bodyW.source === 'impedance' || bodyW.source === 'metrics')
                ? t('endurance.gtg.protocolData.weightIndexedHint')
                : t('endurance.gtg.protocolData.weightHint')}
            </p>
            {(!bodyW.known || bodyW.source === 'gtg' || bodyW.source === 'quiz') && (
              <div className="cm2">
                <label className="fld" style={{ width: 140 }}>
                  <span className="lab">kg</span>
                  <input
                    type="number"
                    min={30}
                    max={250}
                    step={0.1}
                    inputMode="decimal"
                    placeholder={bodyW.kg ? String(bodyW.kg) : 'ex. 72'}
                    value={weightDraft}
                    onChange={(e) => setWeightDraft(e.target.value)}
                  />
                </label>
                <button type="button" className="btn sm pri" disabled={saving} onClick={onSaveWeight}>
                  <Sparkles className="ic" style={{ width: 14, height: 14 }} />
                  {t('endurance.gtg.protocolData.save')}
                </button>
              </div>
            )}
          </div>

          {rows.map((row) => {
            const ready = row.hasDeclaredMax && row.hasReps;
            return (
              <div key={row.id} className="cf" style={{ padding: '16px 0' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 }}>
                  <b style={{ font: '800 22px/1.1 var(--f-disp)', textTransform: 'uppercase', letterSpacing: '.02em' }}>
                    {row.label}
                  </b>
                  <span className="lab" style={{ color: ready ? 'var(--t-cl)' : 'var(--t-fract)' }}>
                    {ready ? t('endurance.gtg.protocolData.rowReady') : t('endurance.gtg.protocolData.rowNeeds')}
                  </span>
                </div>
                <p className="tiny" style={{ margin: '6px 0 0' }}>{t('endurance.gtg.protocolData.rowHint')}</p>
                <div className="nums" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', marginTop: 12 }}>
                  <label className="fld">
                    <span className="lab">{t('endurance.gtg.protocolData.maxUnit')}</span>
                    <input
                      type="number"
                      min={1}
                      max={999}
                      inputMode="numeric"
                      placeholder={row.max ? String(row.max) : '—'}
                      value={getDraft(row.id, 'max', row.hasDeclaredMax ? row.max : '')}
                      onChange={(e) => setDraft(row.id, 'max', e.target.value)}
                    />
                  </label>
                  <label className="fld">
                    <span className="lab">{t('endurance.gtg.protocolData.goalLabel')}</span>
                    <input
                      type="number"
                      min={1}
                      max={999}
                      inputMode="numeric"
                      placeholder={row.goal ? String(row.goal) : '—'}
                      value={getDraft(row.id, 'goal', row.hasDeclaredGoal ? row.goal : '')}
                      onChange={(e) => setDraft(row.id, 'goal', e.target.value)}
                    />
                  </label>
                  <label className="fld">
                    <span className="lab">{t('endurance.gtg.protocolData.repsLabel')}</span>
                    <input
                      type="number"
                      min={1}
                      max={200}
                      inputMode="numeric"
                      placeholder={row.reps ? String(row.reps) : '—'}
                      value={getDraft(row.id, 'reps', row.reps)}
                      onChange={(e) => setDraft(row.id, 'reps', e.target.value)}
                    />
                  </label>
                </div>
                <div className="cm2">
                  <button type="button" className="btn sm" disabled={saving} onClick={() => onSaveRow(row)}>
                    {t('endurance.gtg.protocolData.save')}
                  </button>
                  <span className="tiny">{t('endurance.gtg.protocolData.syncNote')}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </details>
  );
}
