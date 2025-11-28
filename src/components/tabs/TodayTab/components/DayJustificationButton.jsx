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
  JUSTIFICATION_LABELS,
  JUSTIFICATION_ICONS,
  JUSTIFICATION_COLORS
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
    const reasonLabel = JUSTIFICATION_LABELS[justification.reason] || 'Autre';
    const reasonIcon = JUSTIFICATION_ICONS[justification.reason] || '📝';
    const colorClasses = JUSTIFICATION_COLORS[justification.reason] || JUSTIFICATION_COLORS[JUSTIFICATION_REASONS.AUTRE];
    
    return (
      <>
        <div className={`
          flex items-center justify-between gap-3 p-4 rounded-lg border-2 transition-all duration-200
          ${colorClasses}
          hover:shadow-lg hover:scale-[1.02]
        `}>
          <div className="flex items-center gap-3 flex-1">
            <span className="text-2xl" aria-hidden="true">{reasonIcon}</span>
            <div className="flex-1">
              <p className="text-sm text-slate-300 font-medium">{t('justification.button.dayJustified')}</p>
              <p className="text-white font-semibold">{reasonLabel}</p>
              {justification.note && (
                <p className="text-xs text-slate-400 mt-1 line-clamp-1" title={justification.note}>
                  {justification.note}
                </p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenModal}
            icon={Edit2}
            className="flex-shrink-0"
            aria-label={t('justification.button.modifyAriaLabel')}
          >
            {t('justification.button.modify')}
          </Button>
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
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700/50">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="text-slate-400" size={20} />
            <div>
              <p className="text-sm text-slate-300 font-medium">{t('justification.button.noActivity')}</p>
              <p className="text-xs text-slate-500">{t('justification.button.justifyHint')}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenModal}
            icon={Calendar}
            className="flex-shrink-0"
          >
            {t('justification.button.justify')}
          </Button>
        </div>
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

