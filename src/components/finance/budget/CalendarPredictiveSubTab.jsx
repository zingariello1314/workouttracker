/**
 * Sous-onglet Calendrier Prédictif
 */

import React from 'react';
import { useTranslation } from '../../../utils/translations';
import { useBudget } from '../../../hooks/useBudget';
import CalendarPredictive from './CalendarPredictive';

const CalendarPredictiveSubTab = () => {
  const t = useTranslation();
  const { depenses, loading } = useBudget();

  return (
    <div className="calendar-predictive-sub-tab space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          {t('budget.subTabs.calendrier')}
        </h2>
        <p className="text-slate-400">
          Calendrier prédictif de vos dépenses planifiées
        </p>
      </div>

      <CalendarPredictive />
    </div>
  );
};

export default CalendarPredictiveSubTab;

