/**
 * 🧘 COMPOSANT STRETCH ITEM
 * 
 * Composant pour afficher un étirement individuel avec checkbox.
 * Utilise le hook useStretchTracking pour optimiser les performances.
 * 
 * @module StretchItem
 */

import React, { memo, useCallback } from 'react';
import { Checkbox } from '../../ui/Input';
import { useStretchTracking } from '../hooks/useStretchTracking';

/**
 * Composant pour afficher un étirement individuel
 * 
 * @param {Object} props
 * @param {string} props.moment - Moment de l'étirement ('matin', 'midi', 'soir')
 * @param {string} props.description - Description de l'étirement
 * @param {Date} props.date - Date de l'étirement
 * 
 * @example
 * <StretchItem
 *   moment="matin"
 *   description="Étirements du dos et des jambes"
 *   date={currentDate}
 * />
 */
const StretchItem = memo(({ moment, description, date }) => {
  const { toggleStretch, getStretchStatus } = useStretchTracking({ date });
  const { isChecked } = getStretchStatus(moment);

  const handleToggle = useCallback(() => {
    toggleStretch(moment);
  }, [moment, toggleStretch]);

  return (
    <div className="border-l-4 border-purple-500/50 pl-4 bg-slate-700/30 rounded-r-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-white capitalize flex items-center gap-2">
          <span className="text-purple-400">•</span>
          {moment}
        </h4>
        <label className="flex items-center" aria-label={`Marquer ${moment} comme complété`}>
          <Checkbox
            checked={isChecked}
            onChange={handleToggle}
            className="w-5 h-5 text-purple-400"
            name={`stretch_${moment}`}
          />
        </label>
      </div>
      {description && (
        <p className="text-sm text-gray-300">{description}</p>
      )}
    </div>
  );
});

StretchItem.displayName = 'StretchItem';

export default StretchItem;


