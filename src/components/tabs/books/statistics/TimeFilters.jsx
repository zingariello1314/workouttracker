/**
 * TimeFilters Component
 * 
 * Composant pour la sélection des périodes temporelles dans les statistiques de lecture.
 * Affiche des boutons pour chaque période avec indication de la période active.
 * 
 * @see Requirements 1.2, 2.2, 3.2
 */

import React from 'react';
import Button from '../../../ui/Button';
import { useTranslation } from '../../../../utils/translations';

const TimeFilters = ({ 
  selectedPeriod, 
  onPeriodChange, 
  periods = {} 
}) => {
  const t = useTranslation();

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm text-slate-300 whitespace-nowrap">
        {t('books.statistics.period', 'Période')}:
      </span>
      
      <div className="flex gap-1">
        {Object.entries(periods).map(([key, config]) => (
          <Button
            key={key}
            variant={selectedPeriod === key ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => onPeriodChange(key)}
            className="text-xs px-3 py-1"
          >
            {config.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default TimeFilters;