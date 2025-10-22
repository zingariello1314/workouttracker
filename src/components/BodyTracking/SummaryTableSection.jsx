import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Calendar, 
  AlertTriangle,
  Filter,
  ArrowUpDown,
  Info
} from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { formatDate } from '../../utils/dateUtils';

const SummaryTableSection = () => {
  const { data } = useWorkout();
  const [sortBy, setSortBy] = useState('name');
  const [filterBy, setFilterBy] = useState('all');

  // Données simulées pour la démonstration
  const mockBodyData = [
    { 
      name: 'Poids', 
      value: '75.2 kg', 
      date: new Date(), 
      weekChange: -0.8, 
      monthChange: -2.3, 
      category: 'basic',
      trend: 'down',
      isGood: true
    },
    { 
      name: 'Taille', 
      value: '175 cm', 
      date: new Date('2024-01-01'), 
      weekChange: 0, 
      monthChange: 0, 
      category: 'basic',
      trend: 'stable',
      isGood: true
    },
    { 
      name: 'IMC', 
      value: '24.6', 
      date: new Date(), 
      weekChange: -0.3, 
      monthChange: -0.8, 
      category: 'calculated',
      trend: 'down',
      isGood: true
    },
    { 
      name: 'Masse graisseuse', 
      value: '12.8 kg', 
      date: new Date(), 
      weekChange: -0.5, 
      monthChange: -1.5, 
      category: 'impedance',
      trend: 'down',
      isGood: true
    },
    { 
      name: 'Indice de masse grasse', 
      value: '17.0%', 
      date: new Date(), 
      weekChange: -0.7, 
      monthChange: -2.0, 
      category: 'impedance',
      trend: 'down',
      isGood: true
    },
    { 
      name: 'Poids sans graisse', 
      value: '62.4 kg', 
      date: new Date(), 
      weekChange: -0.3, 
      monthChange: -0.8, 
      category: 'impedance',
      trend: 'down',
      isGood: false
    },
    { 
      name: 'Eau du corps', 
      value: '58.2%', 
      date: new Date(), 
      weekChange: 0.5, 
      monthChange: 1.2, 
      category: 'impedance',
      trend: 'up',
      isGood: true
    },
    { 
      name: 'Tour de taille', 
      value: '82 cm', 
      date: new Date(), 
      weekChange: -1.0, 
      monthChange: -3.2, 
      category: 'measurements',
      trend: 'down',
      isGood: true
    },
    { 
      name: 'Tour de bras', 
      value: '34 cm', 
      date: new Date(), 
      weekChange: 0.2, 
      monthChange: 0.8, 
      category: 'measurements',
      trend: 'up',
      isGood: true
    }
  ];

  const getTrendIcon = (trend, isGood) => {
    if (trend === 'stable') return <Minus className="w-4 h-4 text-gray-400" />;
    
    const isPositiveTrend = (trend === 'up' && isGood) || (trend === 'down' && !isGood);
    
    if (trend === 'up') {
      return <TrendingUp className={`w-4 h-4 ${isPositiveTrend ? 'text-green-400' : 'text-red-400'}`} />;
    } else {
      return <TrendingDown className={`w-4 h-4 ${isPositiveTrend ? 'text-red-400' : 'text-green-400'}`} />;
    }
  };

  const getChangeColor = (change, isGood, trend) => {
    if (change === 0) return 'text-gray-400';
    
    const isPositiveChange = change > 0;
    const shouldBePositive = (trend === 'up' && isGood) || (trend === 'down' && !isGood);
    
    return (isPositiveChange === shouldBePositive) ? 'text-green-400' : 'text-red-400';
  };

  const getDaysAgo = (date) => {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const filteredData = mockBodyData.filter(item => {
    if (filterBy === 'all') return true;
    return item.category === filterBy;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'date':
        return new Date(b.date) - new Date(a.date);
      case 'weekChange':
        return Math.abs(b.weekChange) - Math.abs(a.weekChange);
      case 'monthChange':
        return Math.abs(b.monthChange) - Math.abs(a.monthChange);
      default:
        return 0;
    }
  });

  const generateSummary = () => {
    const significantChanges = mockBodyData.filter(item => Math.abs(item.monthChange) > 0.5);
    const positiveChanges = significantChanges.filter(item => 
      (item.trend === 'up' && item.isGood) || (item.trend === 'down' && !item.isGood)
    );
    
    return `Depuis 30 jours : ${positiveChanges.length} améliorations significatives détectées. Poids -2,3 kg, masse graisseuse -1,5%, eau du corps +1,2%.`;
  };

  return (
    <div className="space-y-6">
      {/* Résumé automatique */}
      <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-blue-500/30">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Info className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Résumé de progression (30 jours)</h3>
              <p className="text-blue-100">{generateSummary()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contrôles de tri et filtrage */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-300">Trier par :</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded px-3 py-1 text-sm text-white"
              >
                <option value="name">Nom</option>
                <option value="date">Date</option>
                <option value="weekChange">Variation semaine</option>
                <option value="monthChange">Variation mois</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-300">Filtrer :</span>
              <select
                value={filterBy}
                onChange={(e) => setFilterBy(e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded px-3 py-1 text-sm text-white"
              >
                <option value="all">Toutes les métriques</option>
                <option value="basic">Métriques de base</option>
                <option value="measurements">Mensurations</option>
                <option value="impedance">Impédancemétrie</option>
                <option value="calculated">Calculs automatiques</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau récapitulatif */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Tableau récapitulatif - Vue d'ensemble
            <span className="text-sm font-normal text-slate-400">
              ({sortedData.length} métriques)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 font-semibold text-slate-300">Métrique</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-300">Valeur actuelle</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-300">Dernière mesure</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-300">7 jours</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-300">30 jours</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-300">Tendance</th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((item, index) => {
                  const daysAgo = getDaysAgo(item.date);
                  const isStale = daysAgo > 7;
                  
                  return (
                    <tr key={index} className="border-b border-slate-800 hover:bg-slate-800/30">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{item.name}</span>
                          {isStale && (
                            <AlertTriangle className="w-4 h-4 text-yellow-400" title={`Pas de mise à jour depuis ${daysAgo} jours`} />
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-white">{item.value}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1 text-sm text-slate-400">
                          <Calendar className="w-3 h-3" />
                          {daysAgo === 0 ? "Aujourd'hui" : `Il y a ${daysAgo} jour${daysAgo > 1 ? 's' : ''}`}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1">
                          <span className={`font-medium ${getChangeColor(item.weekChange, item.isGood, item.trend)}`}>
                            {item.weekChange > 0 ? '+' : ''}{item.weekChange}
                          </span>
                          <span className="text-xs text-slate-400">
                            ({item.weekChange !== 0 ? `${((item.weekChange / parseFloat(item.value)) * 100).toFixed(1)}%` : '0%'})
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1">
                          <span className={`font-medium ${getChangeColor(item.monthChange, item.isGood, item.trend)}`}>
                            {item.monthChange > 0 ? '+' : ''}{item.monthChange}
                          </span>
                          <span className="text-xs text-slate-400">
                            ({item.monthChange !== 0 ? `${((item.monthChange / parseFloat(item.value)) * 100).toFixed(1)}%` : '0%'})
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {getTrendIcon(item.trend, item.isGood)}
                          <span className="text-sm text-slate-400 capitalize">{item.trend === 'up' ? 'Hausse' : item.trend === 'down' ? 'Baisse' : 'Stable'}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {sortedData.length === 0 && (
            <div className="text-center py-12">
              <div className="text-slate-400">
                <Info className="w-16 h-16 mx-auto mb-4 text-slate-500" />
                <h4 className="text-xl font-semibold mb-2 text-white">Aucune donnée disponible</h4>
                <p className="text-slate-400">Commencez par saisir vos premières métriques corporelles.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Indicateurs de fraîcheur */}
      <Card className="bg-yellow-600/10 border-yellow-500/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <div>
              <h4 className="font-semibold text-yellow-200">Données à actualiser</h4>
              <p className="text-sm text-yellow-300">
                Certaines métriques n'ont pas été mises à jour récemment. 
                Pensez à effectuer de nouvelles mesures pour maintenir un suivi précis.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SummaryTableSection;