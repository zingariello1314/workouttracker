import React, { useMemo, useState } from 'react';
import { Trophy, TrendingUp, Plus, Search } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { useTranslation } from '../../utils/translations';
import './EnduranceTab/defis-mock.css';
import './EnduranceTab/defis-stadium.css';
import RecordPerformanceModal from '../sport/performance/RecordPerformanceModal';
import { exerciseDatabase } from '../../data/exerciseDatabase';
import { inferTrainingDiscipline } from '../../utils/programUtils';
import {
  applyPerformanceEntryToData,
  buildPerformanceScore,
  getDaysSince,
  removePerformanceEntryFromData
} from '../../utils/exercisePerformanceUtils';
const STALE_DAYS = 45;
const makeDbExerciseId = (key) =>
  `db_${String(key)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase()}`;

const extractExerciseIdFromStorageKey = (key) => {
  const idx = String(key || '').indexOf('_');
  if (idx < 0) return String(key || '');
  return String(key).slice(idx + 1);
};

const formatRecordValue = (record) => {
  if (!record) return '-';
  if (record.performanceType === 'weight_reps') return `${record.weightKg} kg × ${record.reps} reps`;
  if (record.performanceType === 'duration') return `${record.durationSec} sec`;
  return `${record.reps} reps`;
};

const formatMiniChartDate = (raw) => {
  const s = String(raw || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return String(raw || '—');
  const [y, m, d] = s.split('-').map(Number);
  try {
    return new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return s;
  }
};

const MiniLineChart = ({
  data = [],
  xKey,
  yKey,
  height = 180,
  color = 'var(--accent)',
  valueLabel = null,
  formatY = null
}) => {
  const width = 760;
  const pad = { top: 16, right: 18, bottom: 24, left: 40 };
  const points = Array.isArray(data) ? data : [];
  const maxY = Math.max(1, ...points.map((d) => Number(d?.[yKey] || 0)));
  const count = Math.max(1, points.length - 1);
  const getX = (idx) => pad.left + (idx / count) * (width - pad.left - pad.right);
  const getY = (val) =>
    pad.top + (1 - Number(val || 0) / maxY) * (height - pad.top - pad.bottom);
  const path = points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${getX(idx)} ${getY(p?.[yKey])}`)
    .join(' ');
  const [tip, setTip] = useState(null);
  const fmt = formatY || ((v) => String(Math.round(Number(v) * 100) / 100));
  const hitR = points.length > 40 ? 10 : 13;

  return (
    <div style={{ position: 'relative' }} onMouseLeave={() => setTip(null)}>
      <svg viewBox={`0 0 ${width} ${height}`} className="chart">
        <line className="gr" x1={pad.left} y1={height - pad.bottom} x2={width - pad.right} y2={height - pad.bottom} />
        <line className="gr" x1={pad.left} y1={pad.top} x2={pad.left} y2={height - pad.bottom} />
        {points.length > 1 && <path className="ln" d={path} style={{ stroke: color }} pointerEvents="none" />}
        {points.map((p, idx) => {
          const cx = getX(idx);
          const cy = getY(p?.[yKey]);
          const v = p?.[yKey];
          const xRaw = p?.[xKey];
          return (
            <g key={`${idx}-${String(xRaw)}`}>
              <circle
                cx={cx}
                cy={cy}
                r={hitR}
                fill="transparent"
                className="cursor-crosshair"
                pointerEvents="all"
                onMouseEnter={(e) =>
                  setTip({
                    index: idx,
                    clientX: e.clientX,
                    clientY: e.clientY,
                    dateLong: formatMiniChartDate(xRaw),
                    valueText: fmt(v)
                  })
                }
                onMouseMove={(e) =>
                  setTip((prev) => (prev ? { ...prev, clientX: e.clientX, clientY: e.clientY } : prev))
                }
              />
              <circle
                cx={cx}
                cy={cy}
                r={tip?.index === idx ? 4.5 : 3}
                style={{ fill: color, stroke: 'var(--ink-2)', strokeWidth: 1.5 }}
                pointerEvents="none"
              />
              {idx === 0 || idx === points.length - 1 ? (
                <text x={cx} y={height - 7} textAnchor={idx === 0 ? 'start' : 'end'} fontSize="10" fill="#94a3b8" pointerEvents="none">
                  {String(xRaw || '').slice(5)}
                </text>
              ) : null}
            </g>
          );
        })}
        <text x={pad.left + 4} y={pad.top + 10} fontSize="10" fill="#94a3b8" pointerEvents="none">
          max {maxY}
        </text>
      </svg>
      {tip && (
        <div
          role="tooltip"
          style={{
            position: 'fixed',
            zIndex: 500,
            maxWidth: 240,
            left: tip.clientX + 12,
            top: tip.clientY + 12,
            background: 'var(--ink-2)',
            border: '1px solid var(--rule-2)',
            borderRadius: 6,
            padding: '8px 10px',
            fontSize: 11,
            color: 'var(--bone)',
            boxShadow: '0 12px 30px rgba(0,0,0,.45)'
          }}
        >
          <div style={{ borderBottom: '1px solid var(--rule)', paddingBottom: 4, fontWeight: 600, textTransform: 'capitalize', color: 'var(--accent)' }}>
            {tip.dateLong}
          </div>
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ color: 'var(--bone-3)' }}>{valueLabel || yKey}</span>
            <b className="num">{tip.valueText}</b>
          </div>
        </div>
      )}
    </div>
  );
};

const PerformanceChallengesTab = ({ embedded = false }) => {
  const { data, updateData, currentDate, getDateStr, getExerciseNameById, getCurrentData } = useWorkout();
  const t = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [disciplineFilter, setDisciplineFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedExerciseId, setSelectedExerciseId] = useState('');
  const [subTab, setSubTab] = useState('overview');
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [exerciseTabSearch, setExerciseTabSearch] = useState('');

  const records = useMemo(() => (Array.isArray(data?.exerciseMaxRecords) ? data.exerciseMaxRecords : []), [data?.exerciseMaxRecords]);
  const history = useMemo(() => (Array.isArray(data?.exerciseMaxHistory) ? data.exerciseMaxHistory : []), [data?.exerciseMaxHistory]);
  const retestPlans = useMemo(
    () => (Array.isArray(data?.performanceRetestPlans) ? data.performanceRetestPlans : []),
    [data?.performanceRetestPlans]
  );

  const frequencyRows = useMemo(() => {
    const checked = data?.checkedExercises || {};
    const counter = new Map();
    Object.entries(checked).forEach(([key, isChecked]) => {
      if (!isChecked) return;
      const exerciseId = extractExerciseIdFromStorageKey(key);
      counter.set(exerciseId, (counter.get(exerciseId) || 0) + 1);
    });

    return Array.from(counter.entries())
      .map(([exerciseId, count]) => {
        const record = records.find((r) => String(r.exerciseId) === String(exerciseId));
        const daysSince = getDaysSince(record?.recordedAt);
        const stale = daysSince != null && daysSince > STALE_DAYS;
        return {
          exerciseId,
          exerciseName: getExerciseNameById?.(exerciseId) || exerciseId,
          count,
          hasMax: Boolean(record),
          stale,
          lastRecordAt: record?.recordedAt || null
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [data?.checkedExercises, records, getExerciseNameById]);

  const progressionSummary = useMemo(() => {
    const grouped = new Map();
    history.forEach((entry) => {
      const key = String(entry.exerciseId);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(entry);
    });

    let bestProgression = null;
    let bestPerformance = null;

    grouped.forEach((entries, exerciseId) => {
      const sorted = [...entries].sort((a, b) => String(a.recordedAt).localeCompare(String(b.recordedAt)));
      const first = sorted[0];
      const best = sorted.reduce((acc, cur) => (buildPerformanceScore(cur) > buildPerformanceScore(acc) ? cur : acc), sorted[0]);
      const firstScore = buildPerformanceScore(first);
      const bestScore = buildPerformanceScore(best);
      const delta = bestScore - firstScore;
      const relative = firstScore > 0 ? (delta / firstScore) * 100 : delta > 0 ? 100 : 0;

      const candidate = {
        exerciseId,
        exerciseName: getExerciseNameById?.(exerciseId) || first.exerciseName || exerciseId,
        delta,
        relative,
        first,
        best
      };

      if (!bestProgression || candidate.relative > bestProgression.relative) {
        bestProgression = candidate;
      }

      if (!bestPerformance || buildPerformanceScore(best) > buildPerformanceScore(bestPerformance.best)) {
        bestPerformance = candidate;
      }
    });

    return { bestProgression, bestPerformance };
  }, [history, getExerciseNameById]);

  const suggestions = useMemo(() => {
    const rows = frequencyRows.filter((row) => !row.hasMax || row.stale);
    return rows.slice(0, 8);
  }, [frequencyRows]);

  const recordsWithStatus = useMemo(() => {
    return records
      .map((record) => {
        const daysSince = getDaysSince(record.recordedAt);
        return {
          ...record,
          isStale: daysSince != null && daysSince > STALE_DAYS
        };
      })
      .filter((record) => (disciplineFilter === 'all' ? true : record.trainingDiscipline === disciplineFilter))
      .filter((record) => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'stale') return record.isStale;
        if (statusFilter === 'fresh') return !record.isStale;
        return true;
      })
      .sort((a, b) => String(b.recordedAt).localeCompare(String(a.recordedAt)));
  }, [records, disciplineFilter, statusFilter]);

  const timelineRows = useMemo(() => {
    if (!selectedExerciseId) return [];
    return history
      .filter((entry) => String(entry.exerciseId) === String(selectedExerciseId))
      .slice()
      .sort((a, b) => String(a.recordedAt).localeCompare(String(b.recordedAt)));
  }, [history, selectedExerciseId]);

  const dailyMaxCurveData = useMemo(() => {
    const byDay = new Map();
    history.forEach((entry) => {
      const day = String(entry.recordDate || String(entry.recordedAt || '').slice(0, 10)).slice(0, 10);
      if (!day) return;
      byDay.set(day, (byDay.get(day) || 0) + 1);
    });
    return Array.from(byDay.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [history]);

  const exerciseCurveData = useMemo(() => {
    if (!selectedExerciseId) return [];
    return history
      .filter((entry) => String(entry.exerciseId) === String(selectedExerciseId))
      .slice()
      .sort((a, b) => String(a.recordedAt).localeCompare(String(b.recordedAt)))
      .map((entry) => ({
        date: String(entry.recordDate || String(entry.recordedAt).slice(0, 10)).slice(0, 10),
        score: buildPerformanceScore(entry),
        valueLabel: formatRecordValue(entry)
      }));
  }, [history, selectedExerciseId]);

  const allExerciseCurves = useMemo(() => {
    const byExercise = new Map();
    history.forEach((entry) => {
      const exId = String(entry.exerciseId || '');
      if (!exId) return;
      if (!byExercise.has(exId)) {
        byExercise.set(exId, {
          exerciseId: exId,
          exerciseName: entry.exerciseName || getExerciseNameById?.(exId) || exId,
          trainingDiscipline: entry.trainingDiscipline || 'general',
          points: []
        });
      }
      byExercise.get(exId).points.push({
        date: String(entry.recordDate || String(entry.recordedAt || '').slice(0, 10)).slice(0, 10),
        score: buildPerformanceScore(entry),
        valueLabel: formatRecordValue(entry),
        recordedAt: entry.recordedAt
      });
    });

    const q = exerciseSearch.trim().toLowerCase();
    return Array.from(byExercise.values())
      .map((row) => ({
        ...row,
        points: row.points.sort((a, b) => String(a.recordedAt || '').localeCompare(String(b.recordedAt || '')))
      }))
      .filter((row) => (q ? row.exerciseName.toLowerCase().includes(q) : true))
      .sort((a, b) => a.exerciseName.localeCompare(b.exerciseName, 'fr'));
  }, [history, getExerciseNameById, exerciseSearch]);

  const exerciseBankRows = useMemo(() => {
    const byExerciseId = new Map(records.map((record) => [String(record.exerciseId), record]));
    const byExerciseIdInHistory = new Map();
    history.forEach((entry) => {
      const exId = String(entry.exerciseId || '');
      if (!exId) return;
      byExerciseIdInHistory.set(exId, (byExerciseIdInHistory.get(exId) || 0) + 1);
    });

    const rows = Object.entries(exerciseDatabase).map(([key, ex]) => {
      const id = makeDbExerciseId(key);
      const name = ex.name || key;
      const trainingDiscipline = inferTrainingDiscipline({
        name,
        category: ex.category,
        equipment: ex.equipment,
        rawEquipment: ex.equipment
      });
      const record = byExerciseId.get(id) || null;
      const historyCount = byExerciseIdInHistory.get(id) || 0;
      return {
        id,
        name,
        category: ex.category || '',
        equipment: ex.equipment || '',
        trainingDiscipline,
        hasMax: Boolean(record),
        historyCount,
        record
      };
    });

    const q = exerciseTabSearch.trim().toLowerCase();
    return rows
      .filter((row) => (q ? `${row.name} ${row.category} ${row.equipment}`.toLowerCase().includes(q) : true))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }, [records, history, exerciseTabSearch]);

  const selectedExerciseHistory = useMemo(() => {
    if (!selectedExerciseId) return [];
    return history
      .filter((entry) => String(entry.exerciseId) === String(selectedExerciseId))
      .slice()
      .sort((a, b) => String(b.recordedAt || '').localeCompare(String(a.recordedAt || '')));
  }, [history, selectedExerciseId]);

  const selectedExerciseRow = useMemo(
    () => exerciseBankRows.find((row) => String(row.id) === String(selectedExerciseId)) || null,
    [exerciseBankRows, selectedExerciseId]
  );

  const selectedExerciseCurve = useMemo(() => {
    if (!selectedExerciseId) return [];
    return history
      .filter((entry) => String(entry.exerciseId) === String(selectedExerciseId))
      .slice()
      .sort((a, b) => String(a.recordedAt || '').localeCompare(String(b.recordedAt || '')))
      .map((entry) => ({
        date: String(entry.recordDate || String(entry.recordedAt || '').slice(0, 10)).slice(0, 10),
        score: buildPerformanceScore(entry),
        valueLabel: formatRecordValue(entry)
      }));
  }, [history, selectedExerciseId]);

  const handleSavePerformance = async (payload) => {
    const dateStr = getDateStr(currentDate);
    const currentData = getCurrentData ? getCurrentData() : data;
    const next = applyPerformanceEntryToData(
      currentData,
      {
        ...payload,
        source: 'challenges_performance',
        recordedAt: new Date().toISOString()
      },
      { dateStr, addToTodayReps: payload.addToTodayReps }
    );
    await updateData(next);
    setShowModal(false);
  };

  const handlePlanRetest = async (exerciseRow) => {
    const target = new Date();
    target.setDate(target.getDate() + 7);
    const plan = {
      id: `retest_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      exerciseId: exerciseRow.exerciseId,
      exerciseName: exerciseRow.exerciseName,
      reason: !exerciseRow.hasMax ? 'missing_max' : 'stale_max',
      plannedDate: target.toISOString(),
      createdAt: new Date().toISOString(),
      status: 'planned'
    };
    const currentData = getCurrentData ? getCurrentData() : data;
    await updateData({
      ...currentData,
      performanceRetestPlans: [...retestPlans, plan]
    });
  };

  const handleDeletePerformanceEntry = async (entryId) => {
    if (!entryId) return;
    const currentData = getCurrentData ? getCurrentData() : data;
    const next = removePerformanceEntryFromData(currentData, entryId);
    await updateData(next);
  };

  const SUB_TABS = [
    { id: 'overview', label: 'Vue générale' },
    { id: 'stats', label: 'Statistiques' },
    { id: 'exercises', label: 'Exercices' }
  ];

  const deleteBtnStyle = { color: 'var(--t-vit)', borderColor: 'var(--t-vit)' };
  const rowLine = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 12,
    padding: '8px 0',
    borderTop: '1px solid var(--rule)',
    fontSize: 13,
    color: 'var(--bone-2)'
  };

  const content = (
    <div>
      <header className="head">
        <div>
          <div className="kicker">Défis / Performances</div>
          <h1>Performances</h1>
        </div>
      </header>
      <div className="defis-tabs" role="tablist">
        {SUB_TABS.map((x) => (
          <button key={x.id} type="button" role="tab" aria-selected={subTab === x.id} onClick={() => setSubTab(x.id)}>
            {x.label}
          </button>
        ))}
      </div>

      {subTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>
          <section>
            <div className="sec-h">
              <div>
                <h2>Défis — Performance (records &amp; progression)</h2>
              </div>
              <button type="button" className="btn pri" onClick={() => setShowModal(true)}>
                <Plus />
                Ajouter un max
              </button>
            </div>
            <section className="board" style={{ gridTemplateColumns: 'repeat(4,1fr)', borderTop: 0 }}>
              <div>
                <span className="lab">Max enregistrés</span>
                <b className="num">{records.length}</b>
              </div>
              <div>
                <span className="lab">Tests enregistrés</span>
                <b className="num">{history.length}</b>
              </div>
              <div>
                <span className="lab">Exos fréquents suivis</span>
                <b className="num">
                  {frequencyRows.filter((r) => r.hasMax).length}
                  <i>/{frequencyRows.length}</i>
                </b>
              </div>
              <div>
                <span className="lab">À retester</span>
                <b className="num" style={{ color: 'var(--t-fract)' }}>{suggestions.length}</b>
              </div>
            </section>
            <p className="tiny" style={{ marginTop: 12 }}>
              Retests planifiés : <b style={{ color: 'var(--bone)' }}>{retestPlans.length}</b>
            </p>
          </section>

          <section className="grid2p">
            <article className="box pad prf">
              <span className="lab" style={{ color: 'var(--t-ef)' }}>
                <TrendingUp />
                Meilleure progression
              </span>
              {progressionSummary.bestProgression ? (
                <>
                  <h3>{progressionSummary.bestProgression.exerciseName}</h3>
                  <b className="num" style={{ color: 'var(--t-cl)' }}>
                    +{Math.round(progressionSummary.bestProgression.relative)}%
                  </b>
                  <p>depuis le premier test</p>
                  <div className="arrow num">
                    {formatRecordValue(progressionSummary.bestProgression.first)} →{' '}
                    {formatRecordValue(progressionSummary.bestProgression.best)}
                  </div>
                </>
              ) : (
                <p>Aucune progression calculable pour l’instant.</p>
              )}
            </article>
            <article className="box pad prf">
              <span className="lab" style={{ color: 'var(--t-fract)' }}>
                <Trophy />
                Meilleure performance
              </span>
              {progressionSummary.bestPerformance ? (
                <>
                  <h3>{progressionSummary.bestPerformance.exerciseName}</h3>
                  <b className="num" style={{ color: 'var(--t-fract)' }}>
                    {formatRecordValue(progressionSummary.bestPerformance.best)}
                  </b>
                  <p>
                    Dernière maj :{' '}
                    {new Date(progressionSummary.bestPerformance.best.recordedAt).toLocaleDateString('fr-FR')}
                  </p>
                </>
              ) : (
                <p>Aucune performance enregistrée.</p>
              )}
            </article>
          </section>

          <section>
            <div className="sec-h">
              <div>
                <h2>Récap complet des max</h2>
              </div>
            </div>
            <div className="nums" style={{ gridTemplateColumns: 'repeat(3,1fr)' }}>
              <div className="fld">
                <label className="lab" htmlFor="perf-discipline">Discipline</label>
                <select id="perf-discipline" value={disciplineFilter} onChange={(e) => setDisciplineFilter(e.target.value)}>
                  <option value="all">Toutes disciplines</option>
                  <option value="street">Street</option>
                  <option value="muscu">Muscu</option>
                  <option value="endurance">Endurance</option>
                  <option value="boxe">Boxe</option>
                </select>
              </div>
              <div className="fld">
                <label className="lab" htmlFor="perf-status">Statut</label>
                <select id="perf-status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">Tous les statuts</option>
                  <option value="fresh">Max récents</option>
                  <option value="stale">Max anciens</option>
                </select>
              </div>
              <div className="fld">
                <label className="lab" htmlFor="perf-timeline">Timeline</label>
                <select id="perf-timeline" value={selectedExerciseId} onChange={(e) => setSelectedExerciseId(e.target.value)}>
                  <option value="">Timeline : sélectionner un exercice</option>
                  {records.map((record) => (
                    <option key={record.id} value={record.exerciseId}>
                      {record.exerciseName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {recordsWithStatus.length === 0 ? (
              <div className="empty" style={{ marginTop: 18 }}>Aucun max enregistré.</div>
            ) : (
              <div className="mxl">
                {recordsWithStatus.map((record) => (
                  <div key={record.id} className="mxr">
                    <div>
                      <b>{record.exerciseName}</b>
                      <span className="num">
                        {new Date(record.recordedAt).toLocaleDateString('fr-FR')} · {record.trainingDiscipline}
                      </span>
                      {record.isStale ? (
                        <span className="pill" style={{ '--c': 'var(--t-fract)', marginLeft: 10 }}>
                          À retester
                        </span>
                      ) : null}
                    </div>
                    <b className="num rr">{formatRecordValue(record)}</b>
                    <button
                      type="button"
                      className="btn sm"
                      style={deleteBtnStyle}
                      onClick={() => handleDeletePerformanceEntry(record.id)}
                    >
                      Supprimer
                    </button>
                  </div>
                ))}
              </div>
            )}

            {timelineRows.length > 0 && (
              <div className="box pad" style={{ marginTop: 18 }}>
                <h3 className="bt">Timeline de progression</h3>
                <div style={{ marginTop: 10 }}>
                  {timelineRows.map((row) => (
                    <div key={row.id} style={rowLine}>
                      <span className="mono">{new Date(row.recordedAt).toLocaleDateString('fr-FR')}</span>
                      <b className="num" style={{ color: 'var(--bone)' }}>{formatRecordValue(row)}</b>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section>
            <div className="sec-h">
              <div>
                <h2>Suggestions de retest</h2>
              </div>
            </div>
            {suggestions.length === 0 ? (
              <div className="empty">Rien à signaler, continue comme ça.</div>
            ) : (
              <div className="mxl">
                {suggestions.map((s) => (
                  <div key={s.exerciseId} className="mxr">
                    <div>
                      <b>{s.exerciseName}</b>
                      <span className="num">
                        Coche fréquente : {s.count} fois · {s.hasMax ? 'max ancien' : 'aucun max'}
                        {s.lastRecordAt ? ` · Dernier max : ${new Date(s.lastRecordAt).toLocaleDateString('fr-FR')}` : ''}
                      </span>
                    </div>
                    <span className="pill" style={{ '--c': s.hasMax ? 'var(--t-fract)' : 'var(--t-vit)' }}>
                      {s.hasMax ? 'Max ancien' : 'Aucun max'}
                    </span>
                    <button type="button" className="btn sm" onClick={() => handlePlanRetest(s)}>
                      Programmer un retest (+7 jours)
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {subTab === 'stats' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>
          <section>
            <div className="sec-h">
              <div>
                <h2>Courbe générale des max enregistrés par jour</h2>
                <p>Plus la courbe monte, plus tu as enregistré de max ce jour-là.</p>
              </div>
            </div>
            {dailyMaxCurveData.length > 0 ? (
              <div className="box pad">
                <MiniLineChart
                  data={dailyMaxCurveData}
                  xKey="date"
                  yKey="count"
                  color="var(--t-ef)"
                  valueLabel="Max enregistrés"
                  formatY={(v) => String(Math.round(Number(v)))}
                />
              </div>
            ) : (
              <div className="empty">Pas encore assez de données pour tracer la courbe.</div>
            )}
          </section>

          <section>
            <div className="sec-h">
              <div>
                <h2>Progression du max par exercice</h2>
                <p>Tous les exercices avec max enregistré sont affichés automatiquement.</p>
              </div>
            </div>
            <div className="cfs" style={{ marginBottom: 18 }}>
              <Search />
              <input
                type="search"
                value={exerciseSearch}
                onChange={(e) => setExerciseSearch(e.target.value)}
                placeholder="Rechercher un exercice (optionnel)"
              />
            </div>
            {allExerciseCurves.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {allExerciseCurves.map((curve) => (
                  <article key={curve.exerciseId} className="box pad">
                    <h3 className="bt">{curve.exerciseName}</h3>
                    <p className="tiny" style={{ margin: '4px 0 12px' }}>{curve.trainingDiscipline}</p>
                    <MiniLineChart
                      data={curve.points}
                      xKey="date"
                      yKey="score"
                      color="var(--t-cl)"
                      valueLabel="Score performance"
                      formatY={(v) => (Math.round(Number(v) * 10) / 10).toFixed(1)}
                    />
                    <div style={{ marginTop: 10 }}>
                      {curve.points.map((row, idx) => (
                        <div key={`${curve.exerciseId}-${row.date}-${idx}`} style={rowLine}>
                          <span className="mono">{row.date}</span>
                          <span className="num">{row.valueLabel}</span>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
                <div className="box pad">
                  <div className="fld">
                    <label className="lab" htmlFor="perf-focus">Focus exercice (optionnel)</label>
                    <select id="perf-focus" value={selectedExerciseId} onChange={(e) => setSelectedExerciseId(e.target.value)}>
                      <option value="">Sélectionner un exercice (focus)</option>
                      {records.map((record) => (
                        <option key={record.id} value={record.exerciseId}>
                          {record.exerciseName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty">Aucun exercice trouvé avec ce filtre.</div>
            )}
            {exerciseCurveData.length > 0 && (
              <div className="box pad" style={{ marginTop: 18 }}>
                <h3 className="bt">Courbe focus (exercice sélectionné)</h3>
                <div style={{ marginTop: 12 }}>
                  <MiniLineChart
                    data={exerciseCurveData}
                    xKey="date"
                    yKey="score"
                    color="var(--t-ef)"
                    valueLabel="Score performance"
                    formatY={(v) => (Math.round(Number(v) * 10) / 10).toFixed(1)}
                  />
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {subTab === 'exercises' && (
        <section>
          <div className="sec-h">
            <div>
              <h2>Sous-onglet exercices performance</h2>
            </div>
          </div>
          <div className="split2">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
              <div className="cfs">
                <Search />
                <input
                  type="search"
                  value={exerciseTabSearch}
                  onChange={(e) => setExerciseTabSearch(e.target.value)}
                  placeholder="Rechercher un exercice"
                />
              </div>
              <div className="box" style={{ maxHeight: 560, overflowY: 'auto', padding: '4px 16px' }}>
                {exerciseBankRows.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => setSelectedExerciseId(row.id)}
                    aria-pressed={selectedExerciseId === row.id}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      background: selectedExerciseId === row.id ? 'color-mix(in srgb, var(--accent) 12%, transparent)' : 'transparent',
                      border: 0,
                      borderBottom: '1px solid var(--rule)',
                      borderLeft: `2px solid ${selectedExerciseId === row.id ? 'var(--accent)' : 'transparent'}`,
                      padding: '12px 10px',
                      color: 'var(--bone)',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <b style={{ fontWeight: 600, fontSize: 14 }}>{row.name}</b>
                      <span className="pill" style={{ '--c': row.hasMax ? 'var(--t-cl)' : 'var(--bone-3)' }}>
                        {row.hasMax ? 'Max enregistré' : 'Aucun max'}
                      </span>
                    </span>
                    <span className="tiny" style={{ display: 'block', marginTop: 4 }}>
                      {row.trainingDiscipline} · {row.historyCount} saisie(s)
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
              {!selectedExerciseRow ? (
                <div className="empty">Sélectionne un exercice pour voir ses max, son historique et sa courbe.</div>
              ) : (
                <>
                  <article className="box pad prf">
                    <span className="lab">
                      {selectedExerciseRow.trainingDiscipline} · {selectedExerciseRow.category || 'catégorie non définie'}
                    </span>
                    <h3>{selectedExerciseRow.name}</h3>
                    {selectedExerciseRow.record ? (
                      <p style={{ color: 'var(--t-cl)' }}>
                        Max actuel : {formatRecordValue(selectedExerciseRow.record)} ·{' '}
                        {new Date(selectedExerciseRow.record.recordedAt).toLocaleDateString('fr-FR')}
                      </p>
                    ) : (
                      <p>Aucun max enregistré pour le moment.</p>
                    )}
                    <button type="button" className="btn pri sm" style={{ marginTop: 14 }} onClick={() => setShowModal(true)}>
                      <Plus />
                      Enregistrer une nouvelle session / max
                    </button>
                  </article>

                  <div className="box pad">
                    <h3 className="bt">Évolution du max</h3>
                    <div style={{ marginTop: 12 }}>
                      {selectedExerciseCurve.length > 0 ? (
                        <MiniLineChart
                          data={selectedExerciseCurve}
                          xKey="date"
                          yKey="score"
                          color="var(--t-cl)"
                          valueLabel="Score performance"
                          formatY={(v) => (Math.round(Number(v) * 10) / 10).toFixed(1)}
                        />
                      ) : (
                        <p className="tiny">Pas encore de points à tracer.</p>
                      )}
                    </div>
                  </div>

                  <div className="box pad">
                    <h3 className="bt">Anciennes saisies</h3>
                    <div style={{ marginTop: 10 }}>
                      {selectedExerciseHistory.length === 0 ? (
                        <p className="tiny">Aucune saisie pour cet exercice.</p>
                      ) : (
                        selectedExerciseHistory.map((entry) => (
                          <div key={entry.id} style={{ ...rowLine, alignItems: 'center' }}>
                            <span className="num">
                              {new Date(entry.recordedAt).toLocaleDateString('fr-FR')} · {formatRecordValue(entry)}
                            </span>
                            <button
                              type="button"
                              className="btn sm"
                              style={deleteBtnStyle}
                              onClick={() => handleDeletePerformanceEntry(entry.id)}
                            >
                              Supprimer
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      <RecordPerformanceModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSavePerformance}
        title={t('today.performanceModal.title', 'Enregistrer un max')}
        initialExerciseId={selectedExerciseId}
        lockExerciseSelection={subTab === 'exercises' && Boolean(selectedExerciseId)}
      />
    </div>
  );

  if (embedded) return content;
  return (
    <div className="defis-stadium" data-act="performance" style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      {content}
    </div>
  );
};

export default PerformanceChallengesTab;
