import React, { useCallback, useMemo, useState } from 'react';
import { Clock, Plus, Search, Trash2 } from 'lucide-react';
import { useWorkout } from '../../../../context/WorkoutContext';
import { useProfileQuestionnaire } from '../../../../features/profileQuestionnaire/useProfileQuestionnaire';
import { useTranslation } from '../../../../utils/translations';
import { GTG_BUILTIN_IDS, listGtgBankExercises } from '../../../../services/endurance/gtgExerciseBank';
import {
  addGtgAdHocPassage,
  addGtgBankExercise,
  buildGtgDayPlan,
  buildGtgSelectedDoses,
  getDayRecord,
  getGtgExerciseLabel,
  getPerExerciseSchedule,
  normalizeGtgData,
  removeGtgAdHocPassage,
  removeGtgExercise,
  setGtgDayFeel,
  todayYmd,
  toggleGtgAdHocItem,
  toggleGtgMiniSet,
  updateGtgConfig,
  updateGtgExerciseConfig
} from '../../../../services/endurance/gtgService';
import GtgAdHocPassageForm from '../../../endurance/GtgAdHocPassageForm';
import GtgProtocolPracticeStrip, { zoneColor } from './GtgProtocolPracticeStrip';
import GtgProtocolDataBanner from './GtgProtocolDataBanner';
import { syncGtgDayToWorkoutData } from '../../../../services/endurance/gtgWorkoutSync';
import { applyWorkoutRepIntegrations } from '../../../../services/endurance/workoutRepIntegrations';
import { applyGtgDeclaredMaxToData } from '../../../../services/endurance/gtgMaxPerformance';
import {
  computeGtgXpForDayPlan,
  GTG_BONUS_100_PCT_EXTRA_XP,
  GTG_BONUS_50_PCT_XP,
  GTG_XP_PER_REP
} from '../../../../services/xp/gtgXpService';
import { invalidateSportXpCache } from '../../../../hooks/useSportXP';

const BUILTIN_LABEL_KEYS = {
  pullups: 'endurance.gtg.exercise.pullups',
  dips: 'endurance.gtg.exercise.dips',
  pushups: 'endurance.gtg.exercise.pushups'
};

const EXERCISE_COLORS = ['var(--t-vit)', 'var(--t-fract)', 'var(--t-ef)', 'var(--t-cl)', 'var(--t-seuil)'];

export default function GtgSessionsPanel() {
  const { data, updateData } = useWorkout();
  const { questionnaire: profileQuestionnaire } = useProfileQuestionnaire();
  const t = useTranslation();
  const [showMethod, setShowMethod] = useState(true);
  const [bankSearch, setBankSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [expandedExerciseId, setExpandedExerciseId] = useState(null);

  const gtgRaw = data?.enduranceData?.gtg;
  const gtgData = useMemo(() => normalizeGtgData(gtgRaw), [gtgRaw]);
  const today = todayYmd();

  const ctx = useMemo(
    () => ({ workoutData: data, profileQuestionnaire, t }),
    [data, profileQuestionnaire, t]
  );

  const dayPlan = useMemo(() => buildGtgDayPlan(gtgData, today, ctx), [gtgData, today, ctx]);
  const todayXp = useMemo(
    () => computeGtgXpForDayPlan(dayPlan, { repsInWorkout: true }),
    [dayPlan]
  );

  const bankExercises = useMemo(() => listGtgBankExercises(), []);
  const filteredBank = useMemo(() => {
    const q = bankSearch.trim().toLowerCase();
    if (!q) return bankExercises.slice(0, 30);
    return bankExercises
      .filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q) ||
          e.bankKey.toLowerCase().includes(q)
      )
      .slice(0, 30);
  }, [bankExercises, bankSearch]);

  const labelFor = useCallback(
    (id) => {
      if (BUILTIN_LABEL_KEYS[id]) return t(BUILTIN_LABEL_KEYS[id]);
      return getGtgExerciseLabel(id, gtgData.config, ctx);
    },
    [gtgData.config, ctx, t]
  );

  const persistGtg = useCallback(
    async (nextGtg, syncDate = today, declaredMax = null) => {
      if (typeof updateData !== 'function') return;
      setSaving(true);
      try {
        const base = {
          ...data,
          enduranceData: { ...(data.enduranceData || {}), gtg: nextGtg, lastUpdated: new Date().toISOString() }
        };
        let merged = applyWorkoutRepIntegrations(
          syncGtgDayToWorkoutData(base, nextGtg, syncDate, ctx),
          ctx
        );
        if (declaredMax?.exerciseId && Number(declaredMax.reps) > 0) {
          merged = applyGtgDeclaredMaxToData(merged, {
            gtgExerciseId: declaredMax.exerciseId,
            reps: declaredMax.reps,
            config: nextGtg.config,
            dateStr: todayYmd(),
            ctx
          });
        }
        await updateData(merged);
        invalidateSportXpCache();
      } finally {
        setSaving(false);
      }
    },
    [data, updateData, today, ctx]
  );

  const onExpandExercise = useCallback((exerciseId) => {
    setExpandedExerciseId((cur) => (cur === exerciseId ? null : exerciseId));
  }, []);

  const onToggleBuiltin = useCallback(
    (exerciseId) => {
      const cur = gtgData.config.selectedIds;
      if (cur.includes(exerciseId)) {
        onExpandExercise(exerciseId);
        return;
      }
      const next = [...cur, exerciseId];
      persistGtg(updateGtgConfig(gtgData, { selectedIds: next }));
      setExpandedExerciseId(exerciseId);
    },
    [gtgData, persistGtg, onExpandExercise]
  );

  const onAddFromBank = useCallback(
    (entry) => {
      if (!entry) return;
      persistGtg(addGtgBankExercise(gtgData, entry));
      setBankSearch('');
      setExpandedExerciseId(entry.id);
    },
    [gtgData, persistGtg]
  );

  const onBankSearchKeyDown = useCallback(
    (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      const first = filteredBank.find((x) => !gtgData.config.selectedIds.includes(x.id));
      if (first) onAddFromBank(first);
    },
    [filteredBank, gtgData.config.selectedIds, onAddFromBank]
  );

  const onRemoveExercise = useCallback(
    (exerciseId) => {
      persistGtg(removeGtgExercise(gtgData, exerciseId));
    },
    [gtgData, persistGtg]
  );

  const onExerciseScheduleChange = useCallback(
    (exerciseId, patch) => {
      persistGtg(updateGtgExerciseConfig(gtgData, exerciseId, { ...patch, slotMode: 'interval' }));
    },
    [gtgData, persistGtg]
  );

  const onRepsPerSetChange = useCallback(
    (exerciseId, raw) => {
      const trimmed = String(raw ?? '').trim();
      if (trimmed === '') {
        persistGtg(updateGtgExerciseConfig(gtgData, exerciseId, { repsPerSet: null }), today);
        return;
      }
      const n = Math.round(Number(trimmed.replace(',', '.')));
      persistGtg(
        updateGtgExerciseConfig(gtgData, exerciseId, {
          repsPerSet: Number.isFinite(n) && n > 0 ? n : null
        }),
        today
      );
    },
    [gtgData, persistGtg, today]
  );

  const onToggleMiniSet = useCallback(
    (item) => {
      const next = item.adHoc
        ? toggleGtgAdHocItem(gtgData, today, item.adHocId, item.exerciseId)
        : toggleGtgMiniSet(gtgData, today, item.slotIndex, item.exerciseId);
      persistGtg(next, today);
    },
    [gtgData, today, persistGtg]
  );

  const onAddPassage = useCallback(
    ({ time, items }) => {
      persistGtg(addGtgAdHocPassage(gtgData, today, { time, items }), today);
    },
    [gtgData, today, persistGtg]
  );

  const onRemovePassage = useCallback(
    (adHocId) => {
      persistGtg(removeGtgAdHocPassage(gtgData, today, adHocId), today);
    },
    [gtgData, today, persistGtg]
  );

  const progressBarPct = Math.min(100, Math.max(0, dayPlan.progressPct));

  const exercisePlanById = useMemo(() => {
    const map = new Map();
    (dayPlan.exercisePlans || []).forEach((ep) => map.set(ep.exerciseId, ep));
    return map;
  }, [dayPlan.exercisePlans]);

  const protocolDoses = useMemo(() => buildGtgSelectedDoses(gtgData, ctx), [gtgData, ctx]);
  const todayFeel = useMemo(
    () => getDayRecord(gtgData, today, gtgData.config.selectedIds).dayFeel,
    [gtgData, today]
  );

  const onDayFeel = useCallback(
    (feel) => {
      persistGtg(setGtgDayFeel(gtgData, today, feel), today);
    },
    [gtgData, today, persistGtg]
  );

  const exerciseColor = (id) => {
    const idx = gtgData.config.selectedIds.indexOf(id);
    return EXERCISE_COLORS[(idx < 0 ? 0 : idx) % EXERCISE_COLORS.length];
  };

  const renderExerciseChip = (id) => {
    const plan = dayPlan.exercises.find((e) => e.exerciseId === id);
    const expanded = expandedExerciseId === id;
    const sched = getPerExerciseSchedule(gtgData.config, id);
    return (
      <button
        key={id}
        type="button"
        className="chip"
        aria-pressed={expanded}
        onClick={() => onExpandExercise(id)}
        style={expanded ? undefined : { color: 'var(--bone)' }}
      >
        <i className="dot" style={{ '--c': exerciseColor(id) }} />
        {labelFor(id)}
        <span className="mono num" style={{ fontSize: 12, opacity: 0.75 }}>
          ({plan?.repsPerSet}/{plan?.maxReps})
        </span>
        <span style={{ fontSize: 12, opacity: 0.75 }}>
          · {sched.scheduleFrom}–{sched.scheduleTo} / {sched.intervalHours}h
        </span>
      </button>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 72 }}>
      <div className="split">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 64, minWidth: 0 }}>
          <section>
            <div className="sec-h">
              <div>
                <h2>{t('endurance.gtg.scheduleTitle')}</h2>
                <p>{t('endurance.gtg.scheduleHint')}</p>
                <p style={{ color: 'var(--bone-3)', marginTop: 4 }}>{t('endurance.gtg.repsSyncHint')}</p>
              </div>
            </div>

            <div className="exs">
              {dayPlan.exercises.map((ex) => {
                const ep = exercisePlanById.get(ex.exerciseId);
                return (
                  <span key={ex.exerciseId} className="ex-k" style={{ '--c': exerciseColor(ex.exerciseId) }}>
                    <i className="dot" />
                    <b>{labelFor(ex.exerciseId)}</b>
                    <span className="num">
                      {ex.repsPerSet} {t('endurance.gtg.repsShort')}
                    </span>
                    {ep ? (
                      <em className="num">
                        {ep.completedCount}/{ep.totalCount}
                      </em>
                    ) : null}
                  </span>
                );
              })}
            </div>

            <div className="slots">
              {dayPlan.slots.map((slot) => (
                <div
                  key={slot.adHoc ? slot.adHocId : `plan-${slot.time}`}
                  className="slot"
                  style={
                    slot.adHoc
                      ? { borderStyle: 'dashed', borderColor: 'var(--t-fract)' }
                      : slot.isComplete
                        ? { borderColor: 'var(--accent)' }
                        : undefined
                  }
                >
                  <div className="sh">
                    <span className="tm num">{slot.time}</span>
                    <span className="ct num" style={slot.isComplete ? { color: 'var(--accent)' } : undefined}>
                      {slot.completedCount}/{slot.totalCount}
                    </span>
                  </div>
                  {slot.adHoc || slot.isComplete ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
                      {slot.adHoc ? (
                        <span className="lab" style={{ color: 'var(--t-fract)' }}>hors planning</span>
                      ) : (
                        <span className="lab" style={{ color: 'var(--accent)' }}>{t('endurance.gtg.slotDone')}</span>
                      )}
                      {slot.adHoc ? (
                        <button
                          type="button"
                          className="ib del"
                          style={{ width: 26, height: 26 }}
                          disabled={saving}
                          onClick={() => onRemovePassage(slot.adHocId)}
                          aria-label="Retirer ce passage"
                        >
                          <Trash2 className="ic" />
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                  {slot.items.map((item) => (
                    <button
                      key={`${item.adHocId || 'plan'}-${item.exerciseId}-${item.slotIndex}`}
                      type="button"
                      className="cell"
                      style={{ '--c': exerciseColor(item.exerciseId) }}
                      disabled={saving}
                      aria-pressed={!!item.done}
                      onClick={() => onToggleMiniSet(item)}
                    >
                      <em>{labelFor(item.exerciseId)}</em>
                      <b className="num">
                        {item.reps}
                        <i>{t('endurance.gtg.repsShort')}</i>
                      </b>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="sec-h">
              <div>
                <h2>{t('endurance.gtg.protocolTrack.title')}</h2>
                <p>{t('endurance.gtg.protocolTrack.hint')}</p>
                <p style={{ color: 'var(--bone-3)', marginTop: 4 }}>{t('endurance.gtg.protocolTrack.syncHint')}</p>
              </div>
            </div>
            <GtgProtocolDataBanner
              gtgData={gtgData}
              ctx={ctx}
              data={data}
              updateData={updateData}
              saving={saving}
              t={t}
            />
            <GtgProtocolPracticeStrip
              part="dose"
              doses={protocolDoses}
              dayFeel={todayFeel}
              onFeelChange={onDayFeel}
              onRepsChange={onRepsPerSetChange}
              saving={saving}
              t={t}
            />
          </section>

          <section id="endurance-gtg-config" className="scroll-mt-24">
            <div className="sec-h">
              <div>
                <h2>{t('endurance.gtg.configTitle')}</h2>
              </div>
            </div>

            <div className="lab" style={{ marginBottom: 10 }}>{t('endurance.gtg.bankAdd')}</div>
            <div className="cfs">
              <Search className="ic" />
              <input
                type="search"
                list="gtg-bank-datalist"
                value={bankSearch}
                onChange={(e) => setBankSearch(e.target.value)}
                onKeyDown={onBankSearchKeyDown}
                placeholder={t('endurance.gtg.bankSearch')}
                aria-label={t('endurance.gtg.bankSearch')}
              />
              <datalist id="gtg-bank-datalist">
                {bankExercises.map((e) => (
                  <option key={e.id} value={e.name} />
                ))}
              </datalist>
            </div>
            {bankSearch.trim() && filteredBank.length > 0 && (
              <div className="box" style={{ marginTop: 8, maxHeight: 220, overflowY: 'auto', padding: '4px 0' }}>
                {filteredBank.map((entry) => {
                  const already = gtgData.config.selectedIds.includes(entry.id);
                  return (
                    <button
                      key={entry.id}
                      type="button"
                      disabled={already}
                      onClick={() => onAddFromBank(entry)}
                      style={{
                        display: 'flex',
                        width: '100%',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 12,
                        padding: '9px 16px',
                        background: 'none',
                        border: 0,
                        borderBottom: '1px solid var(--rule)',
                        textAlign: 'left',
                        fontSize: 13,
                        color: already ? 'var(--bone-3)' : 'var(--bone)',
                        opacity: already ? 0.55 : 1
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        <Plus className="ic" style={{ width: 14, height: 14, color: 'var(--accent)' }} />
                        {entry.name}
                        {entry.isFundamental && (
                          <span className="pill" style={{ '--c': 'var(--t-fract)', padding: '1px 6px' }}>
                            {t('endurance.gtg.fundamental')}
                          </span>
                        )}
                      </span>
                      <span className="mono dim" style={{ fontSize: 11.5 }}>{entry.category}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div style={{ marginTop: 34 }}>
              <div className="lab" style={{ color: 'var(--bone-2)' }}>{t('endurance.gtg.selectExercises')}</div>
              <p className="tiny" style={{ margin: '6px 0 14px' }}>{t('endurance.gtg.clickToConfigure')}</p>
              <div className="chips">
                {GTG_BUILTIN_IDS.map((id) => {
                  const selected = gtgData.config.selectedIds.includes(id);
                  if (!selected) {
                    return (
                      <button key={id} type="button" className="chip" onClick={() => onToggleBuiltin(id)}>
                        <Plus className="ic" style={{ width: 14, height: 14 }} />
                        {labelFor(id)}
                      </button>
                    );
                  }
                  return renderExerciseChip(id);
                })}
                {gtgData.config.selectedIds.filter((id) => !GTG_BUILTIN_IDS.includes(id)).map(renderExerciseChip)}
              </div>
            </div>

            <div style={{ marginTop: 26, borderBottom: '1px solid var(--rule)' }}>
              {gtgData.config.selectedIds.map((id) => {
                const ep = exercisePlanById.get(id);
                const plan = dayPlan.exercises.find((e) => e.exerciseId === id);
                const peCfg = gtgData.config.perExercise?.[id] || {};
                const repsTargetVal = peCfg.repsPerSet;
                const suggestedHalf = Math.max(1, Math.round((plan?.maxReps || 1) * 0.5));
                const sched = getPerExerciseSchedule(gtgData.config, id);
                const expanded = expandedExerciseId === id;
                const dose = protocolDoses.find((d) => d.exerciseId === id);
                return (
                  <details key={id} className="cf" open={expanded}>
                    <summary
                      onClick={(e) => {
                        e.preventDefault();
                        onExpandExercise(id);
                      }}
                    >
                      <span className="t">
                        <b>{labelFor(id)}</b>
                        <span className="s">
                          {t('endurance.gtg.repsPerSlotSummary', {
                            reps: plan?.repsPerSet ?? '—',
                            defaultValue: `${plan?.repsPerSet ?? '—'} reps / créneau`
                          })}
                          {' · '}
                          {t('endurance.gtg.exerciseScheduleSummary', {
                            from: sched.scheduleFrom,
                            to: sched.scheduleTo,
                            n: sched.intervalHours,
                            count: sched.slotTimes.length
                          })}
                        </span>
                      </span>
                      {ep ? (
                        <span className="c num">
                          {ep.completedCount}/{ep.totalCount}
                        </span>
                      ) : null}
                    </summary>
                    {expanded && (
                      <div className="bd" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                        {dose ? (
                          <div className="chips">
                            <span className="chip num">
                              {dose.pctOfMax != null ? `${dose.pctOfMax}% du max` : '—'}
                            </span>
                            <span className="chip num">RIR {dose.rir != null ? dose.rir : '—'}</span>
                            <span className="lvl" style={{ '--c': zoneColor(dose.zone), alignSelf: 'center' }}>
                              {t(`endurance.gtg.protocolTrack.zone.${dose.zone}`)}
                            </span>
                            {(dose.signals?.priority || []).map((sig) => (
                              <span key={sig} className="chip" style={{ padding: '3px 10px', fontSize: 12 }}>
                                {t(`endurance.gtg.protocolTrack.signal.${sig}`)}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        <div className="fld" style={{ maxWidth: 320 }}>
                          <span className="lab">{t('endurance.gtg.repsPerSlot', 'Reps par créneau')}</span>
                          <input
                            type="number"
                            min={1}
                            max={200}
                            placeholder={String(suggestedHalf)}
                            value={repsTargetVal ?? ''}
                            onChange={(e) => onRepsPerSetChange(id, e.target.value)}
                          />
                          <span className="tiny">
                            {t('endurance.gtg.repsPerSlotHint', {
                              suggested: suggestedHalf,
                              max: plan?.maxReps ?? '—',
                              defaultValue: `Reps à chaque passage (= Protocole & Aujourd’hui). Départ prudent souvent ~20–25 % du max ; suggestion classique (~50 % de ${plan?.maxReps ?? '—'}) : ${suggestedHalf}.`
                            })}
                          </span>
                        </div>

                        <div>
                          <div className="lab" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--bone-2)' }}>
                            <Clock className="ic" style={{ width: 14, height: 14 }} />
                            {t('endurance.gtg.exerciseScheduleTitle')}
                          </div>
                          <div className="nums" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', marginTop: 10 }}>
                            <label className="fld">
                              <span className="lab">{t('endurance.gtg.scheduleFrom')}</span>
                              <input
                                type="time"
                                value={sched.scheduleFrom}
                                onChange={(e) => onExerciseScheduleChange(id, { scheduleFrom: e.target.value })}
                              />
                            </label>
                            <label className="fld">
                              <span className="lab">{t('endurance.gtg.scheduleTo')}</span>
                              <input
                                type="time"
                                value={sched.scheduleTo}
                                onChange={(e) => onExerciseScheduleChange(id, { scheduleTo: e.target.value })}
                              />
                            </label>
                            <label className="fld">
                              <span className="lab">{t('endurance.gtg.intervalHours')}</span>
                              <select
                                value={sched.intervalHours}
                                onChange={(e) =>
                                  onExerciseScheduleChange(id, { intervalHours: Number(e.target.value) })
                                }
                              >
                                {[1, 2, 3, 4].map((h) => (
                                  <option key={h} value={h}>
                                    {t('endurance.gtg.everyNHours', { n: h })}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                          <p className="tiny" style={{ marginTop: 10 }}>
                            {t('endurance.gtg.schedulePreview', {
                              count: sched.slotTimes.length,
                              times: sched.slotTimes.join(', ')
                            })}
                          </p>
                        </div>

                        {ep && ep.slots.length > 0 && (
                          <div>
                            <div className="lab" style={{ marginBottom: 8 }}>{t('endurance.gtg.exerciseSlotsToday')}</div>
                            <div className="chips">
                              {ep.slots.map((s) => (
                                <button
                                  key={s.index}
                                  type="button"
                                  className="chip mono num"
                                  aria-pressed={!!s.done}
                                  disabled={saving}
                                  onClick={() => onToggleMiniSet(s.index, id)}
                                  style={{ fontSize: 12 }}
                                >
                                  {s.time} · {s.reps}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <button
                            type="button"
                            className="btn sm"
                            style={{ color: 'var(--t-vit)', borderColor: 'color-mix(in srgb, var(--t-vit) 50%, transparent)' }}
                            onClick={() => {
                              onRemoveExercise(id);
                              setExpandedExerciseId(null);
                            }}
                            disabled={gtgData.config.selectedIds.length <= 1}
                          >
                            <Trash2 className="ic" style={{ width: 14, height: 14 }} />
                            {t('endurance.gtg.removeExercise')}
                          </button>
                        </div>
                      </div>
                    )}
                  </details>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="rail">
          <div className="box pad prog">
            <span className="lab">{t('endurance.gtg.progress')}</span>
            <b className="num" style={{ marginTop: 12 }}>
              {dayPlan.donePlannedMiniSets}
              <i>/{dayPlan.plannedMiniSets}</i>
            </b>
            {dayPlan.adHocDoneMiniSets > 0 ? (
              <span className="tiny" style={{ display: 'block', marginTop: 6 }}>
                +{dayPlan.adHocDoneMiniSets} hors planning
              </span>
            ) : null}
            <div className="pbar">
              <i style={{ width: `${progressBarPct}%` }} />
              <u title="50 %" />
            </div>
            <div className="pxp num">
              <span>
                +{todayXp.xp} XP · {dayPlan.doneReps} reps
              </span>
              <span>{Math.round(progressBarPct)} %</span>
            </div>
            <p className="rule-xp">
              {t('endurance.gtg.xpExplain', {
                perRep: GTG_XP_PER_REP,
                bonus50: GTG_BONUS_50_PCT_XP,
                bonus100: GTG_BONUS_50_PCT_XP + GTG_BONUS_100_PCT_EXTRA_XP
              })}
            </p>
          </div>

          <GtgProtocolPracticeStrip
            part="feel"
            doses={protocolDoses}
            dayFeel={todayFeel}
            onFeelChange={onDayFeel}
            onRepsChange={onRepsPerSetChange}
            saving={saving}
            t={t}
          />

          <GtgAdHocPassageForm
            variant="defis"
            exerciseIds={gtgData.config.selectedIds}
            labelFor={labelFor}
            disabled={saving}
            onSubmit={onAddPassage}
          />
        </aside>
      </div>

      <section>
        <div className="sec-h">
          <div>
            <h2>{t('endurance.gtg.methodTitle')}</h2>
          </div>
          <button type="button" className="btn sm" onClick={() => setShowMethod((v) => !v)} aria-expanded={showMethod}>
            {showMethod ? '–' : '+'}
          </button>
        </div>
        {showMethod && (
          <div className="meth">
            <div>
              <b className="num">40–60 %</b>
              <p>{t('endurance.gtg.methodP1')}</p>
            </div>
            <div>
              <b className="num">4–8</b>
              <p>{t('endurance.gtg.methodP2')}</p>
            </div>
            <div>
              <b className="num">+1 rep</b>
              <p>{t('endurance.gtg.methodP3')}</p>
            </div>
            <div>
              <b className="num">Option</b>
              <p className="fine">{t('endurance.gtg.methodOptional')}</p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
