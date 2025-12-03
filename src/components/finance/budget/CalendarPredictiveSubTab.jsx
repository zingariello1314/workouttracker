import React from 'react';
import { useTranslation } from '../../../utils/translations';
import { useBudget } from '../../../hooks/useBudget';
import CalendarPredictive from './CalendarPredictive';

const CalendarPredictiveSubTab = () => {
  const t = useTranslation();
  const { loading } = useBudget();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="calendar-predictive-sub-tab">
      <CalendarPredictive />
    </div>
  );
};

export default CalendarPredictiveSubTab;

