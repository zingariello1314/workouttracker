/**
 * Calendrier d’intensité (mois courant) — module sidebar séparé, mêmes données que le dashboard sport.
 */

import { memo, useEffect, useMemo, useState } from 'react';
import { useWorkout } from '../../../context/WorkoutContext';
import { useGarminData } from '../../../hooks/useGarminData';
import CalendarHeatmap from '../../CalendarHeatmap';

const SidebarSportCalendarModule = memo(({ isExpanded, onToggle, setActiveTab }) => {
  const { getWorkoutHistory, data } = useWorkout();
  const workoutHistory = useMemo(() => getWorkoutHistory(), [getWorkoutHistory, data]);
  const { dbReady, loadAllData } = useGarminData();
  const [garminData, setGarminData] = useState(null);
  const [garminDataLoaded, setGarminDataLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!dbReady || !isExpanded) {
      setGarminDataLoaded(false);
      return undefined;
    }
    setGarminDataLoaded(false);
    (async () => {
      try {
        const loaded = await loadAllData();
        if (!alive) return;
        setGarminData(loaded);
        setGarminDataLoaded(true);
      } catch {
        if (alive) {
          setGarminData(null);
          setGarminDataLoaded(true);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [dbReady, loadAllData, isExpanded]);

  const openCalendarTab = () => {
    try {
      localStorage.setItem('sport.lastSubTab', 'calendar');
    } catch {
      /* ignore */
    }
    setActiveTab?.('calendar');
  };

  return (
    <section className={`sidebar-section sidebar-section-enhanced ${isExpanded ? 'expanded' : ''}`}>
      <header
        className="sidebar-section-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label="Section calendrier sport"
      >
        <h2 className="sidebar-section-title">
          <span className="sidebar-section-icon" aria-hidden="true">
            📅
          </span>
          Sport · calendrier
        </h2>
        <span className={`sidebar-section-toggle ${isExpanded ? 'expanded' : ''}`} aria-hidden="true">
          ▼
        </span>
      </header>

      {isExpanded ? (
        <div className="sidebar-section-content space-y-2 px-1 py-2 min-w-0">
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/70 p-2 min-w-0">
            <div className="mb-2 flex flex-col gap-1.5 min-w-0">
              <div className="text-[11px] font-semibold text-slate-200">Vue calendrier (mois courant)</div>
              <button
                type="button"
                onClick={openCalendarTab}
                className="h-7 w-full shrink-0 rounded-md border border-indigo-500/40 bg-indigo-500/10 px-2 text-[10px] font-medium text-indigo-200 hover:bg-indigo-500/20"
              >
                Accéder au calendrier
              </button>
            </div>
            <div className="max-h-[min(52vh,380px)] overflow-y-auto overflow-x-hidden min-w-0 overscroll-contain">
              <CalendarHeatmap
                workoutHistory={workoutHistory}
                garminData={garminData}
                garminDataLoaded={garminDataLoaded}
                initialViewMode="month"
                compact
                embedInSidebar
              />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
});

SidebarSportCalendarModule.displayName = 'SidebarSportCalendarModule';

export default SidebarSportCalendarModule;
