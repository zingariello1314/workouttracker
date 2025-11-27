/**
 * Modal de justification des jours sans activité
 * 
 * Permet à l'utilisateur de justifier un jour sans activité avec une raison
 * (maladie, flemme, pas le temps) et une note optionnelle.
 * 
 * Optimisations :
 * - Validation en temps réel avec useMemo
 * - useCallback pour tous les handlers
 * - Gestion d'état optimisée
 * - Support création ET édition
 * - Accessibilité complète (focus trap, navigation clavier)
 * 
 * @module JustificationModal
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { X, Save, Trash2, AlertCircle } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { useToast } from '../ui/Toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { TextArea } from '../ui/Input';
import { 
  JUSTIFICATION_REASONS, 
  JUSTIFICATION_LABELS, 
  JUSTIFICATION_ICONS,
  isValidJustificationReason,
  isValidJustificationNote,
  isValidJustificationDate,
  MAX_NOTE_LENGTH
} from '../../utils/dayJustificationUtils';
import { formatDate, getDateStr } from '../../utils/dateUtils';

/**
 * Composant JustificationModal
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Contrôle l'affichage de la modal
 * @param {Function} props.onClose - Callback de fermeture
 * @param {Date|string} props.date - Date à justifier (Date object ou string YYYY-MM-DD)
 * @param {Object} props.existingJustification - Justification existante (si mode édition)
 */
const JustificationModal = ({ 
  isOpen, 
  onClose, 
  date, 
  existingJustification = null 
}) => {
  // ✅ OPTIMISATION : Récupérer les fonctions du contexte
  const { setDayJustification, removeDayJustification } = useWorkout();
  const { showSuccess, showError } = useToast();
  
  // ✅ OPTIMISATION : Normaliser la date en string
  const dateStr = useMemo(() => {
    if (!date) return null;
    return typeof date === 'string' ? date : getDateStr(date);
  }, [date]);
  
  // ✅ OPTIMISATION : Formater la date pour affichage
  const formattedDate = useMemo(() => {
    if (!dateStr) return '';
    const dateObj = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
    return formatDate(dateObj);
  }, [dateStr, date]);
  
  // ✅ OPTIMISATION : État local avec initialisation depuis existingJustification
  const [reason, setReason] = useState(() => existingJustification?.reason || '');
  const [note, setNote] = useState(() => existingJustification?.note || '');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ reason: '', note: '' });
  
  // ✅ OPTIMISATION : Réinitialiser l'état quand la modal s'ouvre/ferme ou que existingJustification change
  useEffect(() => {
    if (isOpen) {
      // Réinitialiser avec les valeurs existantes ou vides
      setReason(existingJustification?.reason || '');
      setNote(existingJustification?.note || '');
      setErrors({ reason: '', note: '' });
      setIsLoading(false);
    }
  }, [isOpen, existingJustification]);
  
  // ✅ OPTIMISATION : Validation en temps réel avec useMemo (évite recalculs)
  const validation = useMemo(() => {
    const validationErrors = { reason: '', note: '' };
    let isValid = true;
    
    // Valider la raison
    if (!reason) {
      validationErrors.reason = 'Veuillez sélectionner une raison';
      isValid = false;
    } else if (!isValidJustificationReason(reason)) {
      validationErrors.reason = 'Raison invalide';
      isValid = false;
    }
    
    // Valider la note (optionnelle mais doit respecter la longueur max)
    if (note && !isValidJustificationNote(note)) {
      validationErrors.note = `Note trop longue (max ${MAX_NOTE_LENGTH} caractères)`;
      isValid = false;
    }
    
    // Valider la date
    if (!dateStr || !isValidJustificationDate(dateStr)) {
      isValid = false;
    }
    
    return { isValid, errors: validationErrors };
  }, [reason, note, dateStr]);
  
  // ✅ OPTIMISATION : Mettre à jour les erreurs quand la validation change
  useEffect(() => {
    setErrors(validation.errors);
  }, [validation]);
  
  // ✅ OPTIMISATION : Handlers mémorisés avec useCallback
  const handleReasonChange = useCallback((newReason) => {
    setReason(newReason);
    // Réinitialiser l'erreur de raison quand l'utilisateur change
    if (errors.reason) {
      setErrors(prev => ({ ...prev, reason: '' }));
    }
  }, [errors.reason]);
  
  const handleNoteChange = useCallback((e) => {
    const newNote = e.target.value;
    setNote(newNote);
    // Réinitialiser l'erreur de note quand l'utilisateur change
    if (errors.note) {
      setErrors(prev => ({ ...prev, note: '' }));
    }
  }, [errors.note]);
  
  // ✅ OPTIMISATION : Handler de sauvegarde optimisé
  const handleSave = useCallback(async () => {
    // Vérifier la validation finale
    if (!validation.isValid) {
      setErrors(validation.errors);
      showError('Validation échouée', 'Veuillez corriger les erreurs avant de sauvegarder');
      return;
    }
    
    if (!dateStr) {
      showError('Date invalide', 'Impossible de sauvegarder : date invalide');
      return;
    }
    
    setIsLoading(true);
    setErrors({ reason: '', note: '' });
    
    try {
      await setDayJustification(dateStr, reason, note);
      showSuccess('Justification enregistrée', `Jour justifié : ${JUSTIFICATION_LABELS[reason]}`);
      onClose();
    } catch (error) {
      console.error('[JustificationModal] Erreur lors de la sauvegarde:', error);
      showError(
        'Erreur de sauvegarde', 
        error.message || 'Une erreur est survenue lors de la sauvegarde de la justification'
      );
    } finally {
      setIsLoading(false);
    }
  }, [validation, dateStr, reason, note, setDayJustification, showSuccess, showError, onClose]);
  
  // ✅ OPTIMISATION : Handler de suppression optimisé
  const handleDelete = useCallback(async () => {
    if (!dateStr) {
      showError('Date invalide', 'Impossible de supprimer : date invalide');
      return;
    }
    
    if (!existingJustification) {
      showError('Aucune justification', 'Aucune justification à supprimer');
      return;
    }
    
    // Confirmation avant suppression
    const confirmed = window.confirm(
      `Êtes-vous sûr de vouloir supprimer la justification pour le ${formattedDate} ?`
    );
    
    if (!confirmed) return;
    
    setIsLoading(true);
    
    try {
      await removeDayJustification(dateStr);
      showSuccess('Justification supprimée', 'La justification a été supprimée avec succès');
      onClose();
    } catch (error) {
      console.error('[JustificationModal] Erreur lors de la suppression:', error);
      showError(
        'Erreur de suppression', 
        error.message || 'Une erreur est survenue lors de la suppression de la justification'
      );
    } finally {
      setIsLoading(false);
    }
  }, [dateStr, existingJustification, formattedDate, removeDayJustification, showSuccess, showError, onClose]);
  
  // ✅ OPTIMISATION : Handler d'annulation
  const handleCancel = useCallback(() => {
    // Réinitialiser l'état avant de fermer
    setReason(existingJustification?.reason || '');
    setNote(existingJustification?.note || '');
    setErrors({ reason: '', note: '' });
    onClose();
  }, [existingJustification, onClose]);
  
  // ✅ OPTIMISATION : Gestion du focus pour accessibilité
  const firstRadioRef = useRef(null);
  const noteTextareaRef = useRef(null);
  
  // Focus sur le premier radio button à l'ouverture
  useEffect(() => {
    if (isOpen && firstRadioRef.current) {
      // Petit délai pour s'assurer que la modal est rendue
      setTimeout(() => {
        firstRadioRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);
  
  // ✅ OPTIMISATION : Gestion du clavier (Enter pour sauvegarder, Escape pour annuler)
  useEffect(() => {
    if (!isOpen) return;
    
    const handleKeyDown = (e) => {
      // Enter : sauvegarder (si validation OK)
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (validation.isValid) {
          handleSave();
        }
      }
      // Escape : annuler (géré par Modal mais on peut aussi le gérer ici)
      // Note: Le Modal existant gère déjà Escape via onClose
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, validation.isValid, handleSave]);
  
  // Ne pas rendre si pas ouvert
  if (!isOpen) return null;
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={`Justifier l'absence d'activité${formattedDate ? ` - ${formattedDate}` : ''}`}
      size="md"
      variant="glass"
    >
      <div className="p-6 space-y-6">
        {/* Date affichée (info seulement) */}
        {formattedDate && (
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
            <p className="text-sm text-slate-400">Date concernée</p>
            <p className="text-lg font-semibold text-white">{formattedDate}</p>
          </div>
        )}
        
        {/* Sélection de la raison */}
        <div>
          <label className="block text-slate-300 font-medium mb-3">
            Raison de l'absence <span className="text-red-400">*</span>
          </label>
          
          <div className="space-y-2">
            {Object.entries(JUSTIFICATION_REASONS).map(([key, value], index) => {
              const isFirst = index === 0;
              const Icon = JUSTIFICATION_ICONS[value];
              const label = JUSTIFICATION_LABELS[value];
              const isSelected = reason === value;
              
              return (
                <label
                  key={value}
                  className={`
                    flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                    ${isSelected
                      ? 'bg-purple-600/20 border-purple-500 text-white shadow-lg shadow-purple-500/20'
                      : 'bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-slate-700/50 hover:border-slate-500'
                    }
                  `}
                >
                  <input
                    ref={isFirst ? firstRadioRef : null}
                    type="radio"
                    name="justification-reason"
                    value={value}
                    checked={isSelected}
                    onChange={() => handleReasonChange(value)}
                    className="w-5 h-5 text-purple-600 bg-slate-700 border-slate-500 focus:ring-purple-500 focus:ring-2"
                    aria-label={`Raison : ${label}`}
                  />
                  <span className="text-2xl" aria-hidden="true">{Icon}</span>
                  <span className="flex-1 font-medium">{label}</span>
                  {isSelected && (
                    <div className="w-2 h-2 rounded-full bg-purple-400" aria-hidden="true" />
                  )}
                </label>
              );
            })}
          </div>
          
          {errors.reason && (
            <div className="mt-2 flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errors.reason}</span>
            </div>
          )}
        </div>
        
        {/* Note optionnelle */}
        <div>
          <TextArea
            ref={noteTextareaRef}
            label="Note (optionnelle)"
            value={note}
            onChange={handleNoteChange}
            placeholder="Ajoutez des détails si nécessaire (ex: 'Grippe avec fièvre', 'Déplacement professionnel')"
            rows={3}
            maxLength={MAX_NOTE_LENGTH}
            error={errors.note}
            help={note.length > 0 ? `${note.length}/${MAX_NOTE_LENGTH} caractères` : undefined}
            className="w-full"
          />
        </div>
        
        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-700/50">
          {/* Bouton Supprimer (seulement si justification existante) */}
          {existingJustification && (
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={isLoading}
              loading={isLoading}
              icon={Trash2}
              className="flex-1"
            >
              Supprimer
            </Button>
          )}
          
          {/* Boutons Annuler et Sauvegarder */}
          <div className="flex gap-3 flex-1 justify-end">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="min-w-[100px]"
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!validation.isValid || isLoading}
              loading={isLoading}
              icon={Save}
              className="min-w-[120px]"
            >
              Sauvegarder
            </Button>
          </div>
        </div>
        
        {/* Aide clavier */}
        <div className="text-xs text-slate-500 text-center pt-2 border-t border-slate-800/50">
          <kbd className="px-2 py-1 bg-slate-800 rounded text-slate-400">Ctrl/Cmd + Enter</kbd> pour sauvegarder rapidement
        </div>
      </div>
    </Modal>
  );
};

export default JustificationModal;

