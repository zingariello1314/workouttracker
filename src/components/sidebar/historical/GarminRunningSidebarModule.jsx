import { memo } from 'react';
import { Footprints } from 'lucide-react';
import GarminRunningStatsCard from '../../garmin/GarminRunningStatsCard';

/**
 * Course Garmin (sidebar) : stats de course uniquement.
 * Le bloc « Corps et charges » est dans {@link SidebarBodyRecapModule} (pliage / persistance séparés).
 */
const GarminRunningSidebarModule = memo(({ isExpanded, onToggle }) => {
  return (
    <section className={`sidebar-section sidebar-section-enhanced ${isExpanded ? 'expanded' : ''}`}>
      <header
        className="sidebar-section-header"
        onClick={onToggle}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label="Section Course Garmin"
      >
        <h2 className="sidebar-section-title">
          <span className="sidebar-section-icon inline-flex items-center justify-center" aria-hidden="true">
            <Footprints className="h-4 w-4 text-violet-400" />
          </span>
          Course (Garmin)
        </h2>
        <span className={`sidebar-section-toggle ${isExpanded ? 'expanded' : ''}`} aria-hidden="true">
          ▼
        </span>
      </header>

      {isExpanded ? (
        <div className="sidebar-section-content space-y-3 px-1 py-2">
          <GarminRunningStatsCard variant="sidebar" />
        </div>
      ) : null}
    </section>
  );
});

GarminRunningSidebarModule.displayName = 'GarminRunningSidebarModule';

export default GarminRunningSidebarModule;
