/**
 * GenreDistributionChart Component
 * 
 * Graphique en secteurs affichant la répartition du temps de lecture par genre.
 * Permet de cliquer sur un secteur pour filtrer les autres statistiques.
 * 
 * @see Requirements 5.1, 5.2, 5.3
 */

import React from 'react';
import { PieChart } from 'lucide-react';
import { useTranslation } from '../../../../../utils/translations';

const GenreDistributionChart = ({ books, statisticsData, selectedPeriod, filters }) => {
  const t = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <PieChart className="w-16 h-16 text-slate-500 mb-4" />
      <h3 className="text-lg font-semibold text-slate-300 mb-2">
        Répartition par genre
      </h3>
      <p className="text-slate-400 max-w-md">
        Ce graphique sera implémenté dans la prochaine phase.
        Il affichera la répartition de votre temps de lecture par genre de livre.
      </p>
    </div>
  );
};

export default GenreDistributionChart;