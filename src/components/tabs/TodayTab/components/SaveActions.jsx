/**
 * 💾 COMPOSANT SAVE ACTIONS
 * 
 * Composant réutilisable pour afficher les boutons de sauvegarde/annulation.
 * Utilisé pour les sections exercices et étirements.
 * 
 * @module SaveActions
 */

import React, { memo } from 'react';
import { Save, X } from 'lucide-react';
import Button from '../../ui/Button';

/**
 * Composant pour afficher les actions de sauvegarde
 * 
 * @param {Object} props
 * @param {boolean} props.hasUnsavedChanges - Si des modifications non sauvegardées existent
 * @param {Function} props.onSave - Callback pour sauvegarder
 * @param {Function} props.onDiscard - Callback pour annuler
 * @param {string} props.saveLabel - Label du bouton sauvegarder (défaut: "Enregistrer")
 * @param {string} props.discardLabel - Label du bouton annuler (défaut: "Annuler")
 * 
 * @example
 * <SaveActions
 *   hasUnsavedChanges={hasUnsavedExercises}
 *   onSave={handleSaveExercises}
 *   onDiscard={handleDiscardExercises}
 * />
 */
const SaveActions = memo(({ 
  hasUnsavedChanges = false, 
  onSave, 
  onDiscard,
  saveLabel = "Enregistrer",
  discardLabel = "Annuler"
}) => {
  if (!hasUnsavedChanges) {
    return null;
  }

  return (
    <div className="mt-6 pt-4 border-t border-slate-600/50">
      <div className="flex items-center justify-between">
        <div className="text-sm text-yellow-400 flex items-center gap-2">
          <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" aria-hidden="true"></div>
          Modifications non sauvegardées
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onDiscard}
            icon={X}
            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
            aria-label={discardLabel}
          >
            {discardLabel}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onSave}
            icon={Save}
            className="bg-green-600 hover:bg-green-700"
            aria-label={saveLabel}
          >
            {saveLabel}
          </Button>
        </div>
      </div>
    </div>
  );
});

SaveActions.displayName = 'SaveActions';

export default SaveActions;










