/**
 * ReadingSpeedChart Component
 * 
 * Graphique affichant l'évolution de la vitesse de lecture dans le temps.
 * Permet de filtrer par genre et compare avec les objectifs.
 * 
 * @see Requirements 3.1, 3.3, 3.4, 3.5
 */

import React from 'react';
import { TrendingUp } from 'lucide-react';
import { useTranslation } from '../../../../../utils/translations';

const ReadingSpeedChart = ({ books, statisticsData, selectedPeriod, filters }) => {
  const t = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <TrendingUp className="w-16 h-16 text-slate-500 mb-4" />
      <h3 className="text-lg font-semibold text-slate-300 mb-2">
        Graphique de vitesse de lecture
      </h3>
      <p className="text-slate-400 max-w-md">
        Ce graphique sera implémenté dans la prochaine phase.
        Il affichera l'évolution de votre vitesse de lecture (pages/heure) dans le temps.
      </p>
    </div>
  );
};

export default ReadingSpeedChart;