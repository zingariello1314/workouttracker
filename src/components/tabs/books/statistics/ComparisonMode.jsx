/**
 * ComparisonMode Component
 * 
 * Interface de comparaison entre deux périodes temporelles.
 * Affiche les métriques côte à côte avec calculs de différences et pourcentages.
 * 
 * @see Requirements 9.1, 9.2, 9.3, 9.4
 */

import React from 'react';
import { TrendingUp } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import { useTranslation } from '../../../../utils/translations';

const ComparisonMode = ({ books, statisticsData, selectedPeriod, filters }) => {
  const t = useTranslation();

  return (
    <Card variant="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-300" />
          {t('books.statistics.comparison.title', 'Mode Comparaison')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <TrendingUp className="w-16 h-16 text-slate-500 mb-4" />
          <h3 className="text-lg font-semibold text-slate-300 mb-2">
            Mode comparaison
          </h3>
          <p className="text-slate-400 max-w-md">
            Cette fonctionnalité sera implémentée dans la prochaine phase.
            Elle permettra de comparer vos performances sur différentes périodes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ComparisonMode;