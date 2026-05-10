import React, { useMemo, useState } from 'react';
import { Trophy, TrendingUp, BarChart3, Target, AlertTriangle } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { useTranslation } from '../../utils/translations';
import Card, { CardContent, CardHeader, CardTitle } from '../ui/Card';
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
  color = '#14b8a6',
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
    <div className="relative" onMouseLeave={() => setTip(null)}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto rounded-lg border border-[#0F4C5C]/40 bg-black">
        <line x1={pad.left} y1={height - pad.bottom} x2={width - pad.right} y2={height - pad.bottom} stroke="#334155" strokeWidth="1" />
        <line x1={pad.left} y1={pad.top} x2={pad.left} y2={height - pad.bottom} stroke="#334155" strokeWidth="1" />
        {points.length > 1 && <path d={path} fill="none" stroke={color} strokeWidth="2.5" pointerEvents="none" />}
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
                r={tip?.index === idx ? 4 : 2.8}
                fill={color}
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
          className="fixed z-[500] max-w-[240px] rounded-lg border border-[#0F5C45]/55 bg-[#020617]/95 px-2.5 py-2 text-[11px] text-slate-100 shadow-xl"
          style={{ left: tip.clientX + 12, top: tip.clientY + 12 }}
        >
          <div className="border-b border-[#0F4C5C]/45 pb-1 text-xs font-semibold capitalize text-teal-100">{tip.dateLong}</div>
          <div className="mt-1.5 flex items-baseline justify-between gap-2">
            <span className="text-slate-500">{valueLabel || yKey}</span>
            <span className="font-bold tabular-nums text-white">{tip.valueText}</span>
          </div>
        </div>
      )}
    </div>
  );
};

const PerformanceChallengesTab = () => {
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

  return (
    <div className="relative">
      <div className="relative z-10 mx-auto max-w-6xl space-y-6 px-4 py-6">
        <div className="flex items-center gap-2 rounded-xl border border-[#0F4C5C]/55 bg-black p-2 w-fit">
          <button
            type="button"
            onClick={() => setSubTab('overview')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              subTab === 'overview' ? 'bg-[#0F5C45]/35 text-white border border-[#0F5C45]/55' : 'text-slate-300'
            }`}
          >
            Vue générale
          </button>
          <button
            type="button"
            onClick={() => setSubTab('stats')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              subTab === 'stats' ? 'bg-[#0F5C45]/35 text-white border border-[#0F5C45]/55' : 'text-slate-300'
            }`}
          >
            Statistiques
          </button>
          <button
            type="button"
            onClick={() => setSubTab('exercises')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              subTab === 'exercises' ? 'bg-[#0F5C45]/35 text-white border border-[#0F5C45]/55' : 'text-slate-300'
            }`}
          >
            Exercices
          </button>
        </div>

        {subTab === 'overview' && (
          <>
        <Card variant="sport">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-300" />
              Défis - Performance (Records & progression)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="rounded-lg border border-[#0F4C5C]/55 bg-black p-3">
                <div className="text-xs text-slate-400">Max enregistrés</div>
                <div className="text-2xl font-bold text-white">{records.length}</div>
              </div>
              <div className="rounded-lg border border-[#0F4C5C]/55 bg-black p-3">
                <div className="text-xs text-slate-400">Tests enregistrés</div>
                <div className="text-2xl font-bold text-white">{history.length}</div>
              </div>
              <div className="rounded-lg border border-[#0F4C5C]/55 bg-black p-3">
                <div className="text-xs text-slate-400">Exos fréquents suivis</div>
                <div className="text-2xl font-bold text-white">
                  {frequencyRows.filter((r) => r.hasMax).length}/{frequencyRows.length}
                </div>
              </div>
              <div className="rounded-lg border border-[#0F4C5C]/55 bg-black p-3">
                <div className="text-xs text-slate-400">À retester</div>
                <div className="text-2xl font-bold text-amber-300">{suggestions.length}</div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="rounded-lg border border-[#0F5C45]/55 bg-[#0F5C45]/30 px-4 py-2 text-sm text-white"
            >
              Ajouter un max
            </button>
            <div className="text-xs text-slate-400">
              Retests planifiés: <span className="text-white font-medium">{retestPlans.length}</span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card variant="sport">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="w-4 h-4 text-emerald-300" />
                Meilleure progression
              </CardTitle>
            </CardHeader>
            <CardContent>
              {progressionSummary.bestProgression ? (
                <div className="text-sm text-slate-200">
                  <div className="font-semibold text-white">{progressionSummary.bestProgression.exerciseName}</div>
                  <div>+{Math.round(progressionSummary.bestProgression.relative)}% depuis le premier test</div>
                  <div className="text-slate-400 mt-1">
                    {formatRecordValue(progressionSummary.bestProgression.first)} → {formatRecordValue(progressionSummary.bestProgression.best)}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-500">Aucune progression calculable pour l’instant.</div>
              )}
            </CardContent>
          </Card>

          <Card variant="sport">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Target className="w-4 h-4 text-cyan-300" />
                Meilleure performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {progressionSummary.bestPerformance ? (
                <div className="text-sm text-slate-200">
                  <div className="font-semibold text-white">{progressionSummary.bestPerformance.exerciseName}</div>
                  <div>{formatRecordValue(progressionSummary.bestPerformance.best)}</div>
                  <div className="text-slate-400 mt-1">
                    Dernière maj : {new Date(progressionSummary.bestPerformance.best.recordedAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-slate-500">Aucune performance enregistrée.</div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card variant="sport">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="w-4 h-4 text-violet-300" />
              Récap complet des max
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
              <select
                value={disciplineFilter}
                onChange={(e) => setDisciplineFilter(e.target.value)}
                className="rounded-lg border border-[#0F4C5C]/45 bg-black px-2 py-2 text-sm text-slate-200"
              >
                <option value="all">Toutes disciplines</option>
                <option value="street">Street</option>
                <option value="muscu">Muscu</option>
                <option value="endurance">Endurance</option>
                <option value="boxe">Boxe</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-[#0F4C5C]/45 bg-black px-2 py-2 text-sm text-slate-200"
              >
                <option value="all">Tous les statuts</option>
                <option value="fresh">Max récents</option>
                <option value="stale">Max anciens</option>
              </select>
              <select
                value={selectedExerciseId}
                onChange={(e) => setSelectedExerciseId(e.target.value)}
                className="rounded-lg border border-[#0F4C5C]/45 bg-black px-2 py-2 text-sm text-slate-200"
              >
                <option value="">Timeline: sélectionner un exercice</option>
                {records.map((record) => (
                  <option key={record.id} value={record.exerciseId}>
                    {record.exerciseName}
                  </option>
                ))}
              </select>
            </div>

            {recordsWithStatus.length === 0 ? (
              <div className="text-sm text-slate-500">Aucun max enregistré.</div>
            ) : (
              <div className="space-y-2">
                {recordsWithStatus.map((record) => (
                    <div key={record.id} className="rounded-lg border border-[#0F4C5C]/45 bg-black px-3 py-2 text-sm">
                      <div className="font-medium text-white">{record.exerciseName}</div>
                      <div className="text-slate-300">{formatRecordValue(record)}</div>
                      <div className="text-xs text-slate-500 flex items-center justify-between gap-2">
                        <span>
                        {new Date(record.recordedAt).toLocaleDateString('fr-FR')} · {record.trainingDiscipline}
                        {record.isStale ? (
                          <span className="rounded border border-amber-500/50 bg-amber-950/30 px-1.5 py-0.5 text-[10px] text-amber-300">
                            À retester
                          </span>
                        ) : null}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeletePerformanceEntry(record.id)}
                          className="rounded border border-rose-500/45 bg-rose-950/20 px-2 py-0.5 text-[10px] text-rose-200"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {timelineRows.length > 0 && (
              <div className="mt-4 rounded-lg border border-[#0F4C5C]/45 bg-black p-3">
                <div className="text-sm font-medium text-white mb-2">Timeline de progression</div>
                <div className="space-y-1">
                  {timelineRows.map((row) => (
                    <div key={row.id} className="flex items-center justify-between text-xs text-slate-300">
                      <span>{new Date(row.recordedAt).toLocaleDateString('fr-FR')}</span>
                      <span>{formatRecordValue(row)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card variant="sport">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="w-4 h-4 text-amber-300" />
              Suggestions de retest
            </CardTitle>
          </CardHeader>
          <CardContent>
            {suggestions.length === 0 ? (
              <div className="text-sm text-slate-500">Rien à signaler, continue comme ça.</div>
            ) : (
              <div className="space-y-2">
                {suggestions.map((s) => (
                  <div key={s.exerciseId} className="rounded-lg border border-[#0F4C5C]/45 bg-black px-3 py-2 text-sm">
                    <div className="font-medium text-white">{s.exerciseName}</div>
                    <div className="text-slate-300">
                      Coche fréquente: {s.count} fois · {s.hasMax ? 'max ancien' : 'aucun max'}
                    </div>
                    {s.lastRecordAt && (
                      <div className="text-xs text-slate-500">
                        Dernier max: {new Date(s.lastRecordAt).toLocaleDateString('fr-FR')}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handlePlanRetest(s)}
                      className="mt-2 rounded border border-[#0F5C45]/55 bg-[#0F5C45]/30 px-2 py-1 text-xs text-white"
                    >
                      Programmer un retest (+7 jours)
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
          </>
        )}

        {subTab === 'stats' && (
          <>
            <Card variant="sport">
              <CardHeader>
                <CardTitle className="text-base">Courbe générale des max enregistrés par jour</CardTitle>
              </CardHeader>
              <CardContent>
                {dailyMaxCurveData.length > 0 ? (
                  <div className="space-y-2">
                    <MiniLineChart
                      data={dailyMaxCurveData}
                      xKey="date"
                      yKey="count"
                      color="#22d3ee"
                      valueLabel="Max enregistrés"
                      formatY={(v) => String(Math.round(Number(v)))}
                    />
                    <p className="text-xs text-slate-500">
                      Plus la courbe monte, plus tu as enregistré de max ce jour-là.
                    </p>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">Pas encore assez de données pour tracer la courbe.</div>
                )}
              </CardContent>
            </Card>

            <Card variant="sport">
              <CardHeader>
                <CardTitle className="text-base">Progression du max par exercice</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-3 space-y-2">
                  <p className="text-xs text-slate-400">
                    Tous les exercices avec max enregistré sont affichés automatiquement.
                  </p>
                  <input
                    type="search"
                    value={exerciseSearch}
                    onChange={(e) => setExerciseSearch(e.target.value)}
                    placeholder="Rechercher un exercice (optionnel)"
                    className="w-full rounded-lg border border-[#0F4C5C]/45 bg-black px-2 py-2 text-sm text-slate-200"
                  />
                </div>
                {allExerciseCurves.length > 0 ? (
                  <div className="space-y-4">
                    {allExerciseCurves.map((curve) => (
                      <div key={curve.exerciseId} className="rounded-lg border border-[#0F4C5C]/45 bg-black p-3">
                        <div className="mb-2">
                          <div className="text-sm font-medium text-white">{curve.exerciseName}</div>
                          <div className="text-[11px] text-slate-500">{curve.trainingDiscipline}</div>
                        </div>
                        <MiniLineChart
                          data={curve.points}
                          xKey="date"
                          yKey="score"
                          color="#34d399"
                          valueLabel="Score performance"
                          formatY={(v) => (Math.round(Number(v) * 10) / 10).toFixed(1)}
                        />
                        <div className="mt-2 space-y-1">
                          {curve.points.map((row, idx) => (
                            <div key={`${curve.exerciseId}-${row.date}-${idx}`} className="text-xs text-slate-400 flex items-center justify-between">
                              <span>{row.date}</span>
                              <span>{row.valueLabel}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="rounded-lg border border-[#0F4C5C]/40 bg-black p-3">
                      <div className="text-xs text-slate-500 mb-2">Focus exercice (optionnel)</div>
                      <select
                        value={selectedExerciseId}
                        onChange={(e) => setSelectedExerciseId(e.target.value)}
                        className="w-full rounded-lg border border-[#0F4C5C]/45 bg-black px-2 py-2 text-sm text-slate-200"
                      >
                        <option value="">Sélectionner un exercice (focus)</option>
                        {records.map((record) => (
                          <option key={record.id} value={record.exerciseId}>
                            {record.exerciseName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-slate-500">
                    Aucun exercice trouvé avec ce filtre.
                  </div>
                )}
                {exerciseCurveData.length > 0 && (
                  <div className="mt-4 rounded-lg border border-[#0F4C5C]/40 bg-black p-3">
                    <div className="text-xs text-slate-400 mb-2">Courbe focus (exercice sélectionné)</div>
                    <MiniLineChart
                      data={exerciseCurveData}
                      xKey="date"
                      yKey="score"
                      color="#22d3ee"
                      valueLabel="Score performance"
                      formatY={(v) => (Math.round(Number(v) * 10) / 10).toFixed(1)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {subTab === 'exercises' && (
          <Card variant="sport">
            <CardHeader>
              <CardTitle className="text-base">Sous-onglet exercices performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <input
                    type="search"
                    value={exerciseTabSearch}
                    onChange={(e) => setExerciseTabSearch(e.target.value)}
                    placeholder="Rechercher un exercice"
                    className="w-full rounded-lg border border-[#0F4C5C]/45 bg-black px-2 py-2 text-sm text-slate-200"
                  />
                  <div className="max-h-[560px] overflow-y-auto space-y-2 rounded-lg border border-[#0F4C5C]/35 p-2">
                    {exerciseBankRows.map((row) => (
                      <button
                        key={row.id}
                        type="button"
                        onClick={() => setSelectedExerciseId(row.id)}
                        className={`w-full rounded-lg border px-3 py-2 text-left ${
                          selectedExerciseId === row.id
                            ? 'border-[#0F5C45]/60 bg-[#0F5C45]/20'
                            : 'border-[#0F4C5C]/40 bg-black hover:border-[#0F5C45]/45'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-white">{row.name}</span>
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] ${
                              row.hasMax
                                ? 'border border-emerald-500/45 bg-emerald-950/30 text-emerald-200'
                                : 'border border-slate-600/45 bg-slate-950/40 text-slate-300'
                            }`}
                          >
                            {row.hasMax ? 'Max enregistré' : 'Aucun max'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {row.trainingDiscipline} · {row.historyCount} saisie(s)
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {!selectedExerciseRow ? (
                    <div className="rounded-lg border border-[#0F4C5C]/35 bg-black p-4 text-sm text-slate-500">
                      Sélectionne un exercice pour voir ses max, son historique et sa courbe.
                    </div>
                  ) : (
                    <>
                      <div className="rounded-lg border border-[#0F4C5C]/40 bg-black p-3">
                        <div className="text-base font-semibold text-white">{selectedExerciseRow.name}</div>
                        <div className="text-xs text-slate-400">
                          {selectedExerciseRow.trainingDiscipline} · {selectedExerciseRow.category || 'catégorie non définie'}
                        </div>
                        {selectedExerciseRow.record ? (
                          <div className="mt-2 text-xs text-emerald-300">
                            Max actuel: {formatRecordValue(selectedExerciseRow.record)} ·{' '}
                            {new Date(selectedExerciseRow.record.recordedAt).toLocaleDateString('fr-FR')}
                          </div>
                        ) : (
                          <div className="mt-2 text-xs text-slate-500">Aucun max enregistré pour le moment.</div>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowModal(true)}
                          className="mt-3 rounded border border-[#0F5C45]/55 bg-[#0F5C45]/30 px-3 py-1.5 text-xs text-white"
                        >
                          Enregistrer une nouvelle session / max
                        </button>
                      </div>

                      <div className="rounded-lg border border-[#0F4C5C]/40 bg-black p-3">
                        <div className="mb-2 text-sm font-medium text-white">Évolution du max</div>
                        {selectedExerciseCurve.length > 0 ? (
                          <MiniLineChart
                            data={selectedExerciseCurve}
                            xKey="date"
                            yKey="score"
                            color="#34d399"
                            valueLabel="Score performance"
                            formatY={(v) => (Math.round(Number(v) * 10) / 10).toFixed(1)}
                          />
                        ) : (
                          <div className="text-xs text-slate-500">Pas encore de points à tracer.</div>
                        )}
                      </div>

                      <div className="rounded-lg border border-[#0F4C5C]/40 bg-black p-3">
                        <div className="mb-2 text-sm font-medium text-white">Anciennes saisies</div>
                        {selectedExerciseHistory.length === 0 ? (
                          <div className="text-xs text-slate-500">Aucune saisie pour cet exercice.</div>
                        ) : (
                          <div className="space-y-2">
                            {selectedExerciseHistory.map((entry) => (
                              <div key={entry.id} className="rounded border border-[#0F4C5C]/35 px-2 py-1.5">
                                <div className="flex items-center justify-between gap-2 text-xs">
                                  <span className="text-slate-300">
                                    {new Date(entry.recordedAt).toLocaleDateString('fr-FR')} · {formatRecordValue(entry)}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePerformanceEntry(entry.id)}
                                    className="rounded border border-rose-500/45 bg-rose-950/20 px-2 py-0.5 text-[10px] text-rose-200"
                                  >
                                    Supprimer
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

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
};

export default PerformanceChallengesTab;
