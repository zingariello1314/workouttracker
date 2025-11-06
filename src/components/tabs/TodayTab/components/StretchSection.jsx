/**
 * 🧘 COMPOSANT STRETCH SECTION
 * 
 * Composant pour afficher la section complète des étirements avec sauvegarde.
 * Combine StretchList et SaveActions pour une section complète.
 * 
 * @module StretchSection
 */

import React, { memo } from 'react';
import StretchList from './StretchList';
import SaveActions from './SaveActions';

/**
 * Composant pour afficher la section complète des étirements
 * 
 * @param {Object} props
 * @param {Object} props.stretches - Objet avec moments comme clés et descriptions comme valeurs
 * @param {Date} props.date - Date des étirements
 * @param {boolean} props.hasUnsavedChanges - Si des modifications non sauvegardées existent
 * @param {Function} props.onSave - Callback pour sauvegarder
 * @param {Function} props.onDiscard - Callback pour annuler
 * 
 * @example
 * <StretchSection
 *   stretches={workout.etirements}
 *   date={currentDate}
 *   hasUnsavedChanges={hasUnsavedStretches}
 *   onSave={handleSaveStretches}
 *   onDiscard={handleDiscardStretches}
 * />
 */
const StretchSection = memo(({ 
  stretches, 
  date, 
  hasUnsavedChanges = false,
  onSave,
  onDiscard
}) => {
  // Ne pas afficher si pas d'étirements
  if (!stretches || Object.keys(stretches).length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm p-6 rounded-lg shadow-xl border border-slate-700">
      <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
        <span className="text-purple-400">🧘‍♂️</span>
        Étirements du jour
      </h3>
      
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



