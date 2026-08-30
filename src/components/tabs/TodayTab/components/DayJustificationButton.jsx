/**
 * 📅 COMPOSANT DAY JUSTIFICATION BUTTON
 * 
 * Composant pour afficher un bouton permettant de justifier un jour sans activité
 * dans l'onglet Aujourd'hui. Affiche un badge si une justification existe déjà.
 * 
 * Optimisations :
 * - React.memo pour éviter re-renders inutiles
 * - useMemo pour détecter jour sans activité (évite recalculs)
 * - useCallback pour handlers
 * - Affichage conditionnel optimisé
 * 
 * @module DayJustificationButton
 */

import React, { memo, useState, useMemo, useCallback } from 'react';
import { Calendar, Edit2, X } from 'lucide-react';
import { useWorkout } from '../../../../context/WorkoutContext';
import { 
  getDayJustification, 
  isDayWithoutActivity,
  JUSTIFICATION_REASONS,
  JUSTIFICATION_ICONS,
  JUSTIFICATION_COLORS,
  JUSTIFICATION_TEXT
} from '../../../../utils/dayJustificationUtils';
import { getDateStr } from '../../../../utils/dateUtils';
import Button from '../../../ui/Button';
import JustificationModal from '../../../modals/JustificationModal';
import { useTranslation } from '../../../../utils/translations';

/**
 * Composant pour afficher le bouton/badge de justification
 * 
 * @param {Object} props
 * @param {Date} props.date - Date à vérifier (par défaut: currentDate)
 * 
 * @example
 * <DayJustificationButton date={currentDate} />
 */
const DayJustificationButton = memo(({ date }) => {
  // ✅ OPTIMISATION : Récupérer les données et fonctions du contexte
  const { currentDate, getCurrentData, getDayJustification: getDayJustificationFromContext } = useWorkout();
  const t = useTranslation();
  
  // Utiliser la date fournie ou currentDate par défaut
  const targetDate = date || currentDate;
  
  // ✅ OPTIMISATION : Mémoriser la date string (évite recalculs)
  const dateStr = useMemo(() => getDateStr(targetDate), [targetDate]);
  
  // ✅ OPTIMISATION : Mémoriser les données actuelles
  const currentData = useMemo(() => getCurrentData(), [getCurrentData]);
  
  // ✅ OPTIMISATION : Mémoriser la justification (évite recalculs)
  const justification = useMemo(() => {
    return getDayJustification(currentData, dateStr);
  }, [currentData, dateStr]);
  
  // ✅ OPTIMISATION : Mémoriser la détection jour sans activité (évite recalculs coûteux)
  const hasNoActivity = useMemo(() => {
    return isDayWithoutActivity(currentData, dateStr);
  }, [currentData, dateStr]);
  
  // ✅ OPTIMISATION : État local pour la modal (évite re-renders du parent)
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // ✅ OPTIMISATION : Handlers mémorisés
  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);
  
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);
  
  // Ne pas afficher si le jour a une activité
  if (!hasNoActivity) {
    return null;
  }
  
  // Si justification existe, afficher un badge avec possibilité d'édition
  if (justification) {
    const reasonLabel = t(`justification.${justification.reason}`) || t('justification.autre');
    const reasonIcon = JUSTIFICATION_ICONS[justification.reason] || '📝';
    const colorClasses = JUSTIFICATION_COLORS[justification.reason] || JUSTIFICATION_COLORS[JUSTIFICATION_REASONS.AUTRE];
    const textClass = JUSTIFICATION_TEXT[justification.reason] || JUSTIFICATION_TEXT[JUSTIFICATION_REASONS.AUTRE];
    
    return (
      <>
        <div className={`
          flex items-center justify-between gap-3 rounded-lg border-2 p-4 transition-all duration-200
          ${colorClasses} ${textClass}
          hover:shadow-lg
        `}>
          <div className="flex items-center gap-3 flex-1">
            <span className="text-2xl" aria-hidden="true">{reasonIcon}</span>
            <div className="flex-1">
              <p className="text-sm font-medium opacity-75">{t('justification.button.dayJustified')}</p>
              <p className="font-semibold">{reasonLabel}</p>
              {justification.note && (
                <p className="mt-1 line-clamp-1 text-xs opacity-70" title={justification.note}>
                  {justification.note}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleOpenModal}
            className="flex shrink-0 items-center gap-2 rounded-lg border-2 border-[#0F5C45]/60 bg-[#0F4C5C]/30 px-3 py-2 text-sm font-medium text-teal-50 transition hover:border-[#0F5C45] hover:bg-[#0F4C5C]/45"
            aria-label={t('justification.button.modifyAriaLabel')}
          >
            <Edit2 className="w-4 h-4" />
            {t('justification.button.modify')}
          </button>
        </div>
        
        <JustificationModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          date={targetDate}
          existingJustification={justification}
        />
      </>
    );
  }
  
  // Sinon, afficher le bouton pour justifier
  return (
    <>
      <div className="rounded-xl border p-4 today-activity-card h-full flex flex-col justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="today-empty-dot" aria-hidden />
          <p className="text-sm font-medium m-0">{t('justification.button.noActivity')}</p>
        </div>
        <button
          type="button"
          onClick={handleOpenModal}
          className="today-btn today-btn-ghost w-full flex items-center justify-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          {t('justification.button.justify')}
        </button>
      </div>
      
      <JustificationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        date={targetDate}
        existingJustification={null}
      />
    </>
  );
});

DayJustificationButton.displayName = 'DayJustificationButton';

export default DayJustificationButton;

