/**
 * Modal de choix pour les jours sans activité dans le calendrier
 * 
 * Permet à l'utilisateur de choisir entre :
 * - Justifier l'absence d'activité
 * - Saisir une séance rétroactivement
 * 
 * @module CalendarWorkoutChoiceModal
 */

import React, { useMemo, useCallback } from 'react';
import { X, AlertCircle, Dumbbell } from 'lucide-react';
import { useTranslation } from '../../utils/translations';
import { useFormatters } from '../../utils/translations/formatters-hook';
import { getDateStr } from '../../utils/dateUtils';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

/**
 * Composant CalendarWorkoutChoiceModal
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Contrôle l'affichage de la modal
 * @param {Function} props.onClose - Callback de fermeture
 * @param {Date|string} props.date - Date concernée (Date object ou string YYYY-MM-DD)
 * @param {Function} props.onJustify - Callback pour justifier l'absence
 * @param {Function} props.onEnterWorkout - Callback pour saisir une séance
 */
const CalendarWorkoutChoiceModal = ({ 
  isOpen, 
  onClose, 
  date, 
  onJustify, 
  onEnterWorkout 
}) => {
  // ✅ Ne pas appeler les hooks si la modal n'est pas ouverte
  // Cela évite les erreurs si le contexte n'est pas encore prêt
  if (!isOpen) return null;
  
  const t = useTranslation();
  const { formatDate: formatLocaleDate } = useFormatters();
  
  // ✅ OPTIMISATION : Normaliser et formater la date
  const formattedDate = useMemo(() => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
    return formatLocaleDate(dateObj, { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }, [date, formatLocaleDate]);

  // ✅ OPTIMISATION : Handlers mémorisés
  const handleJustify = useCallback(() => {
    if (onJustify) {
      onJustify();
    }
    onClose();
  }, [onJustify, onClose]);

  const handleEnterWorkout = useCallback(() => {
    if (onEnterWorkout) {
      onEnterWorkout();
    }
    onClose();
  }, [onEnterWorkout, onClose]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('calendar.workoutChoice.title', 'Saisie pour le {{date}}', { date: formattedDate })}
      closeOnOverlayClick={true}
      showCloseButton={true}
    >
      <div className="space-y-6">
        {/* Message d'introduction */}
        <div className="text-center">
          <p className="text-slate-300 text-sm mb-2">
            {t('calendar.workoutChoice.message', 'Que souhaitez-vous faire pour ce jour ?')}
          </p>
        </div>

        {/* Options */}
        <div className="space-y-4">
          {/* Option 1 : Justifier l'absence */}
          <Button
            variant="danger"
            size="lg"
            fullWidth
            onClick={handleJustify}
            icon={AlertCircle}
            className="flex items-center justify-center gap-3"
          >
            <span className="text-lg">🔴</span>
            <span>{t('calendar.workoutChoice.justify', 'Justifier l\'absence')}</span>
          </Button>

          {/* Option 2 : Saisir une séance */}
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={handleEnterWorkout}
            icon={Dumbbell}
            className="flex items-center justify-center gap-3"
          >
            <span className="text-lg">💪</span>
            <span>{t('calendar.workoutChoice.enterWorkout', 'Saisir une séance')}</span>
          </Button>
        </div>

        {/* Bouton Annuler */}
        <div className="pt-4 border-t border-slate-700">
          <Button
            variant="ghost"
            size="md"
            fullWidth
            onClick={onClose}
          >
            {t('common.cancel', 'Annuler')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CalendarWorkoutChoiceModal;
