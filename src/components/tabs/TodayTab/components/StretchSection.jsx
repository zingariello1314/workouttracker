/**
 * 🧘 COMPOSANT STRETCH SECTION
 *
 * Section "Étirements du jour" complète : titre + liste des items individuels
 * groupés par moment + actions de sauvegarde si modifications en cours.
 *
 * @module StretchSection
 */

import React, { memo, useMemo } from 'react';
import StretchList from './StretchList';
import SaveActions from './SaveActions';
import { normalizeStretchSlots, countStretchItems, STRETCH_MOMENTS } from '../../../../utils/stretchUtils';
import { getDayName } from '../../../../utils/dateUtils';

const StretchSection = memo(({
  stretches,
  date,
  hasUnsavedChanges = false,
  onSave,
  onDiscard
}) => {
  const slots = useMemo(() => {
    const dayName = date ? getDayName(date) : null;
    return normalizeStretchSlots(stretches, dayName);
  }, [stretches, date]);

  const total = countStretchItems(slots);
  if (total === 0) return null;

  return (
    <div className="bg-black p-6 rounded-xl shadow-xl border-2 border-[#0F4C5C]/70">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <span className="text-teal-400">🧘‍♂️</span>
          Étirements du jour
          <span className="text-xs font-normal text-slate-400">({total})</span>
        </h3>
      </div>

      <StretchList stretches={stretches} date={date} />

      <SaveActions
        hasUnsavedChanges={hasUnsavedChanges}
        onSave={onSave}
        onDiscard={onDiscard}
      />
    </div>
  );
});

StretchSection.displayName = 'StretchSection';

export default StretchSection;
// Re-export pour usages directs (testing / picker preview)
export { STRETCH_MOMENTS };
