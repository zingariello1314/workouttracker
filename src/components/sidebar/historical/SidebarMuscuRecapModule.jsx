import { memo } from 'react';
import { Dumbbell } from 'lucide-react';
import RecapStrengthStatsCard from '../../sport/recap/RecapStrengthStatsCard';

/**
 * Musculation enregistrée (sidebar) : même carte que le récap, section pliable indépendante de Course Garmin.
 */
const SidebarMuscuRecapModule = memo(({ isExpanded, onToggle, setActiveTab }) => {
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
          <RecapStrengthStatsCard variant="sidebar" />
        </div>
      ) : null}
    </section>
  );
});

SidebarMuscuRecapModule.displayName = 'SidebarMuscuRecapModule';

export default SidebarMuscuRecapModule;
