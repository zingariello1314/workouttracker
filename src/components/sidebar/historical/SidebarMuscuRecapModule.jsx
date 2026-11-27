import { memo } from 'react';
import { Dumbbell } from 'lucide-react';
import RecapStrengthStatsCard from '../../sport/recap/RecapStrengthStatsCard';
import { useHeavyAnalyticsGate } from '../../../hooks/useHeavyAnalyticsGate';

/**
 * Musculation enregistrée (sidebar).
 * P0.8 : gate visible/idle + carte stats en Worker async.
 */
const SidebarMuscuRecapModule = memo(({ isExpanded, onToggle, setActiveTab }) => {
  const contentReady = useHeavyAnalyticsGate(isExpanded, { idleTimeoutMs: 2500 });

  const openRecap = () => {
    setActiveTab?.('recap');
  };

  return (
    <section className={`sidebar-section sidebar-section-enhanced ${isExpanded ? 'expanded' : ''}`}>
      <header
        className="sidebar-section-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label="Section musculation enregistrée"
      >
        <h2 className="sidebar-section-title">
          <span className="sidebar-section-icon inline-flex items-center justify-center" aria-hidden="true">
            <Dumbbell className="h-4 w-4 text-teal-400" />
          </span>
          Muscu (enregistré)
        </h2>
        <span className={`sidebar-section-toggle ${isExpanded ? 'expanded' : ''}`} aria-hidden="true">
          ▼
        </span>
      </header>

      {isExpanded ? (
        <div className="sidebar-section-content space-y-3 px-1 py-2">
          <button
            type="button"
            onClick={openRecap}
            className="h-7 w-full shrink-0 rounded-md border border-indigo-500/40 bg-indigo-500/10 px-2 text-[10px] font-medium text-indigo-200 hover:bg-indigo-500/20"
          >
            Ouvrir l&apos;onglet Récap
          </button>
          {contentReady ? (
            <RecapStrengthStatsCard variant="sidebar" />
          ) : (
            <div className="py-6 text-center text-[10px] text-slate-500" role="status">
              Préparation des stats muscu…
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
});

SidebarMuscuRecapModule.displayName = 'SidebarMuscuRecapModule';

export default SidebarMuscuRecapModule;
