/**
 * GoalsProgressChart Component
 * 
 * Graphique de suivi des objectifs de lecture avec barres de progression.
 * Affiche les célébrations visuelles lors d'atteinte d'objectifs.
 * 
 * @see Requirements 6.1, 6.2, 6.3
 */

import React from 'react';
import { Target } from 'lucide-react';
import { useTranslation } from '../../../../../utils/translations';

const GoalsProgressChart = ({ books, statisticsData, selectedPeriod, filters }) => {
  const t = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Target className="w-16 h-16 text-slate-500 mb-4" />
      <h3 className="text-lg font-semibold text-slate-300 mb-2">
        Progression des objectifs
      </h3>
      <p className="text-slate-400 max-w-md">
        Ce graphique sera implémenté dans la prochaine phase.
        Il affichera votre progression vers vos objectifs de lecture quotidiens, hebdomadaires et mensuels.
      </p>
    </div>
  );
};

export default GoalsProgressChart;