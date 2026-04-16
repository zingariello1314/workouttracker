/**
 * Corps et charges (sidebar) : carte 3D + stats par muscle, même logique que l’ancien bloc fusionné Course Garmin.
 * Module distinct pour un pliage / persistance indépendants de « Course (Garmin) ».
 */

import { memo, useEffect, useMemo, useState } from 'react';
import { PersonStanding } from 'lucide-react';
import BodyMap from '../../sport/recap/BodyMap';
import { useWorkout } from '../../../context/WorkoutContext';
import { MuscleGroups } from '../../../data/workoutProgramEnhanced';
import { computeRecapMuscleState } from '../../../utils/sport/recapMuscleLoadEngine';
import {
  DASHBOARD_RECAP_PERIOD_KEY,
  DASHBOARD_RECAP_PERIODS,
  DASHBOARD_RECAP_MUSCLE_GROUPS_TIME_OR_REPS
} from './sidebarBodyRecapShared';

const SidebarBodyRecapModule = memo(({ isExpanded, onToggle }) => {
  const { currentDate, getCurrentData, getExerciseNameById } = useWorkout();
  const liveWorkoutData = getCurrentData();

  const [recapPeriod, setRecapPeriod] = useState(() => {
    try {
      const stored = localStorage.getItem(DASHBOARD_RECAP_PERIOD_KEY);
      if (stored && DASHBOARD_RECAP_PERIODS.some((p) => p.id === stored)) return stored;
    } catch {
      /* ignore */
    }
    return 'all';
  });

  useEffect(() => {
    try {
      localStorage.setItem(DASHBOARD_RECAP_PERIOD_KEY, recapPeriod);
    } catch {
      /* ignore */
    }
  }, [recapPeriod]);

  const referenceDate = useMemo(() => new Date(currentDate), [currentDate]);

  const recapState = useMemo(
    () => computeRecapMuscleState(liveWorkoutData, recapPeriod, getExerciseNameById, referenceDate),
    [liveWorkoutData, recapPeriod, getExerciseNameById, referenceDate]
  );

  const muscleStatsRows = useMemo(() => {
    const rows = [
      { id: MuscleGroups.CHEST, label: 'Pectoraux' },
      { id: MuscleGroups.BACK, label: 'Dos' },
      { id: MuscleGroups.SHOULDERS, label: 'Épaules' },
      { id: MuscleGroups.BICEPS, label: 'Biceps' },
      { id: MuscleGroups.TRICEPS, label: 'Triceps' },
      { id: MuscleGroups.QUADS, label: 'Quadriceps' },
      { id: MuscleGroups.HAMSTRINGS, label: 'Ischio-jambiers' },
      { id: MuscleGroups.CALVES, label: 'Mollets' },
      { id: MuscleGroups.TIBIALIS_ANTERIOR, label: 'Tibial antérieur' },
      { id: MuscleGroups.CORE, label: 'Abdos / gainage' }
    ];
    return rows.map((row) => {
      const reps = Math.round(recapState.repShareByGroup?.[row.id] || 0);
      const cardioMin = Math.round(recapState.cardioMinutesByGroup?.[row.id] || 0);

      if (!DASHBOARD_RECAP_MUSCLE_GROUPS_TIME_OR_REPS.has(row.id)) {
        return { ...row, reps, cardioMin, statKind: 'reps', statValue: reps };
      }

      const isCore = row.id === MuscleGroups.CORE;
      let statKind = 'reps';
      let statValue = reps;
      if (isCore) {
        if (cardioMin > 0) {
          statKind = 'time';
          statValue = cardioMin;
        } else {
          statKind = 'reps';
          statValue = reps;
        }
      } else if (reps > 0) {
        statKind = 'reps';
        statValue = reps;
      } else if (cardioMin > 0) {
        statKind = 'time';
        statValue = cardioMin;
      } else {
        statKind = 'reps';
        statValue = 0;
      }
      return {
        ...row,
        reps,
        cardioMin,
        statKind,
        statValue
      };
    });
  }, [recapState]);

  return (
    <section className={`sidebar-section sidebar-section-enhanced ${isExpanded ? 'expanded' : ''}`}>
      <header
        className="sidebar-section-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label="Section Corps et charges"
      >
        <h2 className="sidebar-section-title">
          <span className="sidebar-section-icon inline-flex items-center justify-center" aria-hidden="true">
            <PersonStanding className="h-4 w-4 text-emerald-400" />
          </span>
          Corps et charges
        </h2>
        <span className={`sidebar-section-toggle ${isExpanded ? 'expanded' : ''}`} aria-hidden="true">
          ▼
        </span>
      </header>

      {isExpanded ? (
        <div className="sidebar-section-content space-y-3 px-1 py-2">
          <div className="rounded-xl border border-slate-700/70 bg-slate-950/50 p-2.5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-1.5">
              <div className="text-[11px] font-semibold text-slate-300">Période</div>
              <div className="flex flex-wrap justify-end gap-1">
                {DASHBOARD_RECAP_PERIODS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setRecapPeriod(p.id)}
                    className={`rounded-md border px-1.5 py-0.5 text-[9px] font-medium transition-colors ${
                      recapPeriod === p.id
                        ? 'border-emerald-400/70 bg-emerald-600/75 text-white'
                        : 'border-slate-600/70 bg-slate-800/70 text-slate-300 hover:bg-slate-700/70'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <BodyMap
              muscleColors={recapState.meshColors}
              uniformBodyColor={recapState.uniformBodyColor}
              forcedViewPreset="frontLow"
              compactCanvas
            />

            <div className="mt-2 rounded-lg border border-slate-700/60 bg-slate-900/40 p-2">
              <div className="mb-1.5 text-[10px] font-semibold text-slate-400">
                Stats par muscle (période sélectionnée)
              </div>
              <div className="max-h-[280px] space-y-1 overflow-y-auto pr-0.5">
                {muscleStatsRows.map((row) => (
                  <div
                    key={`sb-muscle-${row.id}`}
                    className="rounded-md border border-slate-700/50 bg-slate-950/50 px-2 py-1.5"
                  >
                    <div className="text-[10px] font-semibold text-slate-200">{row.label}</div>
                    <div className="mt-0.5 text-[9px] text-slate-500">
                      {row.statKind === 'time' ? (
                        <>
                          Temps:{' '}
                          <span className="font-semibold text-emerald-200">{row.statValue} min</span>
                        </>
                      ) : (
                        <>
                          Reps:{' '}
                          <span className="font-semibold text-cyan-200">{row.statValue}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
});

SidebarBodyRecapModule.displayName = 'SidebarBodyRecapModule';

export default SidebarBodyRecapModule;
