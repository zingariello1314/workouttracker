/**
 * HeatmapCalendar Component
 * 
 * Calendrier heatmap affichant la régularité de lecture avec intensité colorée.
 * Calcule automatiquement les streaks et permet la navigation entre années.
 * 
 * @see Requirements 4.1, 4.2, 4.4, 4.5
 */

import React from 'react';
import { Calendar } from 'lucide-react';
import { useTranslation } from '../../../../../utils/translations';

const HeatmapCalendar = ({ books, statisticsData, selectedPeriod, filters }) => {
  const t = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Calendar className="w-16 h-16 text-slate-500 mb-4" />
      <h3 className="text-lg font-semibold text-slate-300 mb-2">
        Calendrier d'activité
      </h3>
      <p className="text-slate-400 max-w-md">
        Ce calendrier heatmap sera implémenté dans la prochaine phase.
        Il affichera votre régularité de lecture avec une intensité colorée par jour.
      </p>
    </div>
  );
};

export default HeatmapCalendar;