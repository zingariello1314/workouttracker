import React, { useState, useMemo } from 'react';
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
import { 
  formatWeight, 
  formatHeight, 
  formatBMI, 
  formatPercentage,
  formatMeasurement,
  formatChange,
  formatChangeWithPercentage,
  formatValue
} from './utils/formatting';
import logger from '../../utils/logger';

const log = logger.component('SummaryTableSection');

const SummaryTableSection = () => {
  const { data } = useWorkout();
  const [sortBy, setSortBy] = useState('name');
  const [filterBy, setFilterBy] = useState('all');

  // 🔍 Calculer les dates de référence pour variations 7j et 30j
  const calculateReferenceDates = () => {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return { now, sevenDaysAgo, thirtyDaysAgo };
  };

  // 📊 Générer les données réelles basées sur les entrées de progression (MEMOIZED)
  const bodyData = useMemo(() => {
    if (!data?.progressEntries || data.progressEntries.length === 0) {
      return [];
    }

    const { sevenDaysAgo, thirtyDaysAgo } = calculateReferenceDates();

    // Filtrer et trier entrées métriques (type 'metrics')
    const metricsEntries = data.progressEntries
      .filter(entry => entry.type === 'metrics')
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : (a.timestamp ? new Date(a.timestamp) : new Date(0));
        const dateB = b.date ? new Date(b.date) : (b.timestamp ? new Date(b.timestamp) : new Date(0));
        return dateB - dateA; // Plus récent en premier
      });

    // Filtrer et trier entrées impédance (type 'impedance')
    const impedanceEntries = data.progressEntries
      .filter(entry => entry.type === 'impedance')
      .sort((a, b) => {
        const dateA = a.date ? new Date(a.date) : (a.timestamp ? new Date(a.timestamp) : new Date(0));
        const dateB = b.date ? new Date(b.date) : (b.timestamp ? new Date(b.timestamp) : new Date(0));
        return dateB - dateA;
      });

    if (metricsEntries.length === 0 && impedanceEntries.length === 0) {
      return [];
    }

    const latestMetricsEntry = metricsEntries[0] || null;
    const latestImpedanceEntry = impedanceEntries[0] || null;

    // Trouver entrées de référence pour variations
    const findReferenceEntry = (entries, referenceDate) => {
      return entries.find(entry => {
        const entryDate = entry.date ? new Date(entry.date) : (entry.timestamp ? new Date(entry.timestamp) : new Date(0));
        return entryDate <= referenceDate;
      }) || null;
    };

    const sevenDaysAgoMetricsEntry = findReferenceEntry(metricsEntries, sevenDaysAgo);
    const thirtyDaysAgoMetricsEntry = findReferenceEntry(metricsEntries, thirtyDaysAgo);
    const sevenDaysAgoImpedanceEntry = findReferenceEntry(impedanceEntries, sevenDaysAgo);
    const thirtyDaysAgoImpedanceEntry = findReferenceEntry(impedanceEntries, thirtyDaysAgo);

    const bodyData = [];

    // === MÉTRIQUES DE BASE (type 'metrics') ===
    
    // Poids
    if (latestMetricsEntry?.weight != null && !isNaN(latestMetricsEntry.weight)) {
      const currentWeight = latestMetricsEntry.weight;
      const sevenDaysWeight = sevenDaysAgoMetricsEntry?.weight;
      const thirtyDaysWeight = thirtyDaysAgoMetricsEntry?.weight;
      
      const weekChange = sevenDaysWeight != null && !isNaN(sevenDaysWeight) ? currentWeight - sevenDaysWeight : 0;
      const monthChange = thirtyDaysWeight != null && !isNaN(thirtyDaysWeight) ? currentWeight - thirtyDaysWeight : 0;
      
      const entryDate = latestMetricsEntry.date ? new Date(latestMetricsEntry.date) : (latestMetricsEntry.timestamp ? new Date(latestMetricsEntry.timestamp) : new Date());
      
      bodyData.push({
        name: 'Poids',
        value: formatWeight(currentWeight),
        numericValue: currentWeight,
        date: entryDate,
        weekChange: weekChange,
        monthChange: monthChange,
        category: 'basic',
        trend: weekChange < -0.1 ? 'down' : weekChange > 0.1 ? 'up' : 'stable',
        isGood: weekChange < 0 || weekChange === 0
      });
    }

    // Taille (rarement change, donc pas de calcul variation)
    if (latestMetricsEntry?.height != null && !isNaN(latestMetricsEntry.height)) {
      const entryDate = latestMetricsEntry.date ? new Date(latestMetricsEntry.date) : (latestMetricsEntry.timestamp ? new Date(latestMetricsEntry.timestamp) : new Date());
      
      bodyData.push({
        name: 'Taille',
        value: formatHeight(latestMetricsEntry.height),
        numericValue: latestMetricsEntry.height,
        date: entryDate,
        weekChange: 0,
        monthChange: 0,
        category: 'basic',
        trend: 'stable',
        isGood: true
      });
    }

    // IMC (calculé depuis weight + height)
    if (latestMetricsEntry?.weight != null && latestMetricsEntry?.height != null && 
        !isNaN(latestMetricsEntry.weight) && !isNaN(latestMetricsEntry.height)) {
      const currentBMI = latestMetricsEntry.weight / Math.pow(latestMetricsEntry.height / 100, 2);
      
      let weekChange = 0;
      let monthChange = 0;
      
      if (sevenDaysAgoMetricsEntry?.weight && sevenDaysAgoMetricsEntry?.height &&
          !isNaN(sevenDaysAgoMetricsEntry.weight) && !isNaN(sevenDaysAgoMetricsEntry.height)) {
        const sevenDaysBMI = sevenDaysAgoMetricsEntry.weight / Math.pow(sevenDaysAgoMetricsEntry.height / 100, 2);
        weekChange = currentBMI - sevenDaysBMI;
      }
      
      if (thirtyDaysAgoMetricsEntry?.weight && thirtyDaysAgoMetricsEntry?.height &&
          !isNaN(thirtyDaysAgoMetricsEntry.weight) && !isNaN(thirtyDaysAgoMetricsEntry.height)) {
        const thirtyDaysBMI = thirtyDaysAgoMetricsEntry.weight / Math.pow(thirtyDaysAgoMetricsEntry.height / 100, 2);
        monthChange = currentBMI - thirtyDaysBMI;
      }
      
      const entryDate = latestMetricsEntry.date ? new Date(latestMetricsEntry.date) : (latestMetricsEntry.timestamp ? new Date(latestMetricsEntry.timestamp) : new Date());
      
      bodyData.push({
        name: 'IMC',
        value: formatBMI(currentBMI),
        numericValue: currentBMI,
        date: entryDate,
        weekChange: weekChange,
        monthChange: monthChange,
        category: 'calculated',
        trend: weekChange < -0.1 ? 'down' : weekChange > 0.1 ? 'up' : 'stable',
        isGood: currentBMI >= 18.5 && currentBMI < 25
      });
    }

    // Mensurations
    const measurements = [
      { key: 'waist', name: 'Tour de taille', unit: 'cm', isGoodDown: true },
      { key: 'chest', name: 'Tour de poitrine', unit: 'cm', isGoodDown: false },
      { key: 'arms', name: 'Tour de bras', unit: 'cm', isGoodDown: false },
      { key: 'thighs', name: 'Tour de cuisses', unit: 'cm', isGoodDown: false },
      { key: 'neck', name: 'Tour de cou', unit: 'cm', isGoodDown: true },
      { key: 'hips', name: 'Tour de hanches', unit: 'cm', isGoodDown: true }
    ];

    measurements.forEach(measurement => {
      if (latestMetricsEntry?.[measurement.key] != null && !isNaN(latestMetricsEntry[measurement.key])) {
        const currentValue = latestMetricsEntry[measurement.key];
        const sevenDaysValue = sevenDaysAgoMetricsEntry?.[measurement.key];
        const thirtyDaysValue = thirtyDaysAgoMetricsEntry?.[measurement.key];
        
        const weekChange = sevenDaysValue != null && !isNaN(sevenDaysValue) ? currentValue - sevenDaysValue : 0;
        const monthChange = thirtyDaysValue != null && !isNaN(thirtyDaysValue) ? currentValue - thirtyDaysValue : 0;
        
        const entryDate = latestMetricsEntry.date ? new Date(latestMetricsEntry.date) : (latestMetricsEntry.timestamp ? new Date(latestMetricsEntry.timestamp) : new Date());
        
        bodyData.push({
          name: measurement.name,
          value: formatMeasurement(currentValue),
          numericValue: currentValue,
          date: entryDate,
          weekChange: weekChange,
          monthChange: monthChange,
          category: 'measurements',
          trend: weekChange < -0.1 ? 'down' : weekChange > 0.1 ? 'up' : 'stable',
          isGood: measurement.isGoodDown ? (weekChange <= 0) : true // Tour de taille/cou : baisse = bon
        });
      }
    });

    // === MÉTRIQUES D'IMPÉDANCEMÉTRIE (type 'impedance') ===
    
    if (latestImpedanceEntry) {
      const impedanceMetrics = [
        { key: 'bodyFatPercentage', name: 'Masse graisseuse', unit: '%', isGoodDown: true },
        { key: 'bodyWater', name: 'Eau du corps', unit: '%', isGoodDown: false },
        { key: 'muscleMass', name: 'Masse musculaire', unit: 'kg', isGoodDown: false },
        { key: 'visceralFat', name: 'Graisse viscérale', unit: '', isGoodDown: true },
        { key: 'metabolicAge', name: 'Âge métabolique', unit: 'ans', isGoodDown: true },
        { key: 'skeletalMuscle', name: 'Muscle squelettique', unit: 'kg', isGoodDown: false },
        { key: 'boneMass', name: 'Masse osseuse', unit: 'kg', isGoodDown: false }
      ];

      impedanceMetrics.forEach(metric => {
        if (latestImpedanceEntry[metric.key] != null && !isNaN(latestImpedanceEntry[metric.key])) {
          const currentValue = latestImpedanceEntry[metric.key];
          const sevenDaysValue = sevenDaysAgoImpedanceEntry?.[metric.key];
          const thirtyDaysValue = thirtyDaysAgoImpedanceEntry?.[metric.key];
          
          const weekChange = sevenDaysValue != null && !isNaN(sevenDaysValue) ? currentValue - sevenDaysValue : 0;
          const monthChange = thirtyDaysValue != null && !isNaN(thirtyDaysValue) ? currentValue - thirtyDaysValue : 0;
          
          const entryDate = latestImpedanceEntry.date ? new Date(latestImpedanceEntry.date) : (latestImpedanceEntry.timestamp ? new Date(latestImpedanceEntry.timestamp) : new Date());
          
          // Formater selon type
          const formattedValue = metric.unit === '%'
            ? formatPercentage(currentValue)
            : metric.unit === 'kg'
            ? formatWeight(currentValue)
            : metric.unit === 'ans'
            ? formatValue(currentValue, 'age')
            : `${currentValue}${metric.unit ? ` ${metric.unit}` : ''}`;
          
          bodyData.push({
            name: metric.name,
            value: formattedValue,
            numericValue: currentValue,
            date: entryDate,
            weekChange: weekChange,
            monthChange: monthChange,
            category: 'impedance',
            trend: weekChange < -0.1 ? 'down' : weekChange > 0.1 ? 'up' : 'stable',
            isGood: metric.isGoodDown ? (weekChange <= 0) : (weekChange >= 0)
          });
        }
      });
    }

    return bodyData;
  }, [data?.progressEntries]);

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

  // 🔍 Filtrer et trier données (MEMOIZED)
  const filteredData = useMemo(() => {
    return bodyData.filter(item => {
      if (filterBy === 'all') return true;
      return item.category === filterBy;
    });
  }, [bodyData, filterBy]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
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
  }, [filteredData, sortBy]);

  // 📝 Générer résumé dynamique depuis vraies données (MEMOIZED)
  const summaryText = useMemo(() => {
    if (bodyData.length === 0) {
      return "Aucune donnée disponible pour générer un résumé. Commencez par saisir vos métriques corporelles.";
    }

    // Filtrer changements significatifs (> 0.1 pour éviter bruit)
    const significantChanges = bodyData.filter(item => 
      item.numericValue != null && Math.abs(item.monthChange) > 0.1
    );

    // Calculer améliorations positives
    const positiveChanges = significantChanges.filter(item => 
      (item.trend === 'up' && item.isGood) || (item.trend === 'down' && !item.isGood)
    );

    // Trouver les métriques clés avec changements réels
    const weightChange = bodyData.find(item => item.name === 'Poids');
    const bodyFatChange = bodyData.find(item => item.name === 'Masse graisseuse');
    const bodyWaterChange = bodyData.find(item => item.name === 'Eau du corps');

    // Construire résumé dynamique
    const parts = [];
    
    if (positiveChanges.length > 0) {
      parts.push(`${positiveChanges.length} amélioration${positiveChanges.length > 1 ? 's' : ''} significative${positiveChanges.length > 1 ? 's' : ''} détectée${positiveChanges.length > 1 ? 's' : ''}`);
    }

    const details = [];
    if (weightChange && Math.abs(weightChange.monthChange) > 0.1) {
      const changeFormatted = formatChange(weightChange.monthChange, { type: 'weight' });
      details.push(`Poids ${changeFormatted.formatted}`);
    }
    
    if (bodyFatChange && Math.abs(bodyFatChange.monthChange) > 0.1) {
      const changeFormatted = formatChange(bodyFatChange.monthChange, { type: 'percentage' });
      details.push(`masse graisseuse ${changeFormatted.formatted}`);
    }
    
    if (bodyWaterChange && Math.abs(bodyWaterChange.monthChange) > 0.1) {
      const changeFormatted = formatChange(bodyWaterChange.monthChange, { type: 'percentage' });
      details.push(`eau du corps ${changeFormatted.formatted}`);
    }

    if (details.length > 0) {
      parts.push(details.join(', '));
    }

    if (parts.length === 0) {
      return "Vos métriques sont stables depuis 30 jours. Continuez votre suivi pour observer des changements significatifs.";
    }

    return `Depuis 30 jours : ${parts.join('. ')}.`;
  }, [bodyData]);

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
              <p className="text-blue-100">{summaryText}</p>
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
                          {item.weekChange !== 0 ? (
                            <>
                              {(() => {
                                // Déterminer type selon nom métrique
                                let changeType = 'weight';
                                if (item.name.includes('%') || item.name.includes('graisseuse') || item.name.includes('eau')) {
                                  changeType = 'percentage';
                                } else if (item.name.includes('cm') || item.name.includes('Tour')) {
                                  changeType = 'measurements';
                                }
                                
                                const changeFormatted = formatChange(item.weekChange, { type: changeType });
                                const changeWithPct = formatChangeWithPercentage(
                                  item.weekChange,
                                  item.numericValue,
                                  { type: changeType }
                                );
                                
                                return (
                                  <>
                                    <span className={`font-medium ${getChangeColor(item.weekChange, item.isGood, item.trend)}`}>
                                      {changeFormatted.formatted}
                                    </span>
                                    {changeWithPct.percentage && (
                                      <span className="text-xs text-slate-400">
                                        ({changeWithPct.percentage})
                                      </span>
                                    )}
                                  </>
                                );
                              })()}
                            </>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1">
                          {item.monthChange !== 0 ? (
                            <>
                              {(() => {
                                // Déterminer type selon nom métrique
                                let changeType = 'weight';
                                if (item.name.includes('%') || item.name.includes('graisseuse') || item.name.includes('eau')) {
                                  changeType = 'percentage';
                                } else if (item.name.includes('cm') || item.name.includes('Tour')) {
                                  changeType = 'measurements';
                                }
                                
                                const changeFormatted = formatChange(item.monthChange, { type: changeType });
                                const changeWithPct = formatChangeWithPercentage(
                                  item.monthChange,
                                  item.numericValue,
                                  { type: changeType }
                                );
                                
                                return (
                                  <>
                                    <span className={`font-medium ${getChangeColor(item.monthChange, item.isGood, item.trend)}`}>
                                      {changeFormatted.formatted}
                                    </span>
                                    {changeWithPct.percentage && (
                                      <span className="text-xs text-slate-400">
                                        ({changeWithPct.percentage})
                                      </span>
                                    )}
                                  </>
                                );
                              })()}
                            </>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
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

      {/* Indicateurs de fraîcheur - Afficher seulement si données obsolètes */}
      {sortedData.some(item => {
        const daysAgo = getDaysAgo(item.date);
        return daysAgo > 7;
      }) && (
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
      )}
    </div>
  );
};

export default SummaryTableSection;