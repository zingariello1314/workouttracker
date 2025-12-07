import React, { useState } from 'react';
import { Trophy, TrendingUp, Calendar, BarChart3 } from 'lucide-react';

/**
 * PersonalHistory Component - Displays personal records and historical trends
 * 
 * @param {Object} props
 * @param {Array} props.records - Personal records
 * @param {Object} props.trends - Trend data
 * @param {Object} props.chartData - Historical chart data
 * @param {string} props.currentPeriod - Current period selection
 * @param {Function} props.onPeriodChange - Callback when period changes
 */
const PersonalHistory = ({
  records = [],
  trends = null,
  chartData = null,
  currentPeriod = 'month',
  onPeriodChange
}) => {
  const [selectedChart, setSelectedChart] = useState('volume');

  // Period options
  const periods = [
    { value: 'month', label: 'Mois' },
    { value: 'quarter', label: 'Trimestre' },
    { value: 'year', label: 'Année' }
  ];

  // Chart type options
  const chartTypes = [
    { value: 'volume', label: 'Volume', color: '#F97316' },
    { value: 'minutes', label: 'Minutes', color: '#3B82F6' },
    { value: 'seconds', label: 'Secondes', color: '#10B981' }
  ];

  // Get chart data for selected type
  const getChartData = () => {
    if (!chartData) return { labels: [], data: [] };
    return {
      labels: chartData.labels || [],
      data: chartData[selectedChart] || []
    };
  };

  const { labels, data } = getChartData();
  const maxValue = Math.max(...data, 1);

  return (
    <div className="personal-history bg-gray-800 border border-gray-700 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-orange-400 flex items-center gap-2">
          <Trophy size={20} />
          Historique Personnel
        </h3>
        
        {/* Period Selector */}
        <div className="flex gap-2">
          {periods.map(period => (
            <button
              key={period.value}
              onClick={() => onPeriodChange && onPeriodChange(period.value)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                currentPeriod === period.value
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Personal Records */}
      <div className="records-section mb-6">
        <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <Trophy size={16} />
          Records Personnels
        </h4>
        
        {records.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {records.map((record, index) => (
              <div
                key={index}
                className={`record-card bg-gray-900 border rounded-lg p-3 ${
                  record.isNewRecord
                    ? 'border-yellow-500 shadow-lg shadow-yellow-500/20'
                    : 'border-gray-700'
                }`}
              >
                {record.isNewRecord && (
                  <div className="text-xs font-bold text-yellow-500 mb-1">
                    🆕 NOUVEAU!
                  </div>
                )}
                <div className="text-2xl mb-1">{record.icon}</div>
                <div className="text-xs text-gray-400 mb-1">{record.exercise}</div>
                <div className="text-lg font-bold text-white">
                  {record.value} {record.unit}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {new Date(record.date).toLocaleDateString('fr-FR')}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            Aucun record personnel enregistré
          </div>
        )}
      </div>

      {/* Trends */}
      {trends && (
        <div className="trends-section mb-6">
          <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <TrendingUp size={16} />
            Tendances
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="trend-card bg-gray-900 border border-gray-700 rounded-lg p-4">
              <div className="text-xs text-gray-400 mb-1">Meilleure série</div>
              <div className="text-2xl font-bold text-orange-400">
                {trends.bestStreak.value}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {trends.bestStreak.period}
              </div>
            </div>

            <div className="trend-card bg-gray-900 border border-gray-700 rounded-lg p-4">
              <div className="text-xs text-gray-400 mb-1">Progression globale</div>
              <div className={`text-2xl font-bold ${trends.overallProgress.class}`}>
                {trends.overallProgress.value > 0 ? '+' : ''}{trends.overallProgress.value}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                vs période précédente
              </div>
            </div>

            <div className="trend-card bg-gray-900 border border-gray-700 rounded-lg p-4">
              <div className="text-xs text-gray-400 mb-1">Régularité</div>
              <div className="text-2xl font-bold text-blue-400">
                {trends.consistency.value}%
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {trends.consistency.description}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Historical Chart */}
      <div className="chart-section">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
            <BarChart3 size={16} />
            Évolution
          </h4>
          
          {/* Chart Type Selector */}
          <div className="flex gap-2">
            {chartTypes.map(type => (
              <button
                key={type.value}
                onClick={() => setSelectedChart(type.value)}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  selectedChart === type.value
                    ? 'text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
                style={{
                  backgroundColor: selectedChart === type.value ? type.color : undefined
                }}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Simple Bar Chart */}
        {labels.length > 0 ? (
          <div className="chart bg-gray-900 border border-gray-700 rounded-lg p-4">
            <div className="flex items-end justify-between gap-2 h-48">
              {data.map((value, index) => {
                const height = (value / maxValue) * 100;
                const chartType = chartTypes.find(t => t.value === selectedChart);
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div className="relative w-full flex items-end justify-center h-40">
                      <div
                        className="w-full rounded-t transition-all duration-300 hover:opacity-80 cursor-pointer"
                        style={{
                          height: `${height}%`,
                          backgroundColor: chartType?.color
                        }}
                        title={`${labels[index]}: ${value}`}
                      />
                      <div className="absolute -top-6 text-xs font-bold text-white">
                        {value}
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 text-center">
                      {labels[index]}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 bg-gray-900 border border-gray-700 rounded-lg">
            Aucune donnée historique disponible
          </div>
        )}
      </div>
    </div>
  );
};

// Memoize for performance (Phase 6)
export default React.memo(PersonalHistory);
