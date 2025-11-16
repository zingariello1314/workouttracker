/**
 * ChartComponents.jsx
 * 
 * ✅ PHASE 5 : Composants graphiques mémorisés pour CoachDashboard
 * 
 * ✅ PHASE 5 : Optimisations performance graphiques
 * - React.memo avec comparaisons profondes personnalisées
 * - Composants séparés pour chaque type de graphique
 * - Comparaison optimisée pour éviter re-rendus inutiles
 * 
 * @module components/tabs/nutrition/components/ChartComponents
 */

import React, { memo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

/**
 * ✅ PHASE 5 : Comparaison profonde optimisée pour données graphiques nutrition
 * 
 * Compare deux tableaux de données en utilisant hash JSON pour performance
 * 
 * @param {Array} prevData - Données précédentes
 * @param {Array} nextData - Données suivantes
 * @returns {boolean} true si identiques
 */
function areChartDataEqual(prevData, nextData) {
  // ✅ PHASE 5 : Comparaison référence rapide
  if (prevData === nextData) return true;
  
  // ✅ PHASE 5 : Vérifier type et longueur
  if (!Array.isArray(prevData) || !Array.isArray(nextData)) return false;
  if (prevData.length !== nextData.length) return false;
  
  // ✅ PHASE 5 : Si vide, identiques
  if (prevData.length === 0) return true;
  
  // ✅ PHASE 5 : Comparaison par hash JSON (optimisé pour tableaux < 365 items)
  // Pour tableaux nutrition (max 365 jours), JSON.stringify est acceptable
  try {
    return JSON.stringify(prevData) === JSON.stringify(nextData);
  } catch (error) {
    // Si erreur sérialisation (objets circulaires, etc.), comparaison manuelle
    for (let i = 0; i < prevData.length; i++) {
      if (JSON.stringify(prevData[i]) !== JSON.stringify(nextData[i])) {
        return false;
      }
    }
    return true;
  }
}

/**
 * ✅ PHASE 5 : Tooltip personnalisé mémorisé pour graphiques
 */
const CustomTooltip = memo(({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-lg">
        <p className="text-sm font-semibold text-slate-200 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
});

CustomTooltip.displayName = 'CustomTooltip';

/**
 * ✅ PHASE 5 : Graphique LineChart pour évolution calories (mémorisé)
 */
export const MemoizedCaloriesLineChart = memo(({ data, height = 320 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="w-full flex items-center justify-center" style={{ height }}>
        <p className="text-slate-400">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height} minHeight={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis 
          dataKey="day" 
          stroke="#9CA3AF"
          tick={{ fill: '#9CA3AF', fontSize: 12 }}
        />
        <YAxis 
          stroke="#9CA3AF"
          tick={{ fill: '#9CA3AF', fontSize: 12 }}
          label={{ value: 'Calories', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="calories" 
          stroke="#F59E0B" 
          strokeWidth={2}
          name="Calories"
          dot={{ fill: '#F59E0B', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}, (prevProps, nextProps) => {
  // ✅ PHASE 5 : Comparaison profonde des données
  return (
    prevProps.height === nextProps.height &&
    areChartDataEqual(prevProps.data, nextProps.data)
  );
});

MemoizedCaloriesLineChart.displayName = 'MemoizedCaloriesLineChart';

/**
 * ✅ PHASE 5 : Graphique AreaChart pour évolution macros (mémorisé)
 */
export const MemoizedMacrosAreaChart = memo(({ data, height = 320 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="w-full flex items-center justify-center" style={{ height }}>
        <p className="text-slate-400">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height} minHeight={height}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorProtein" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorCarbs" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis 
          dataKey="day" 
          stroke="#9CA3AF"
          tick={{ fill: '#9CA3AF', fontSize: 12 }}
        />
        <YAxis 
          stroke="#9CA3AF"
          tick={{ fill: '#9CA3AF', fontSize: 12 }}
          label={{ value: 'Grammes', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Area 
          type="monotone" 
          dataKey="protein" 
          stackId="1"
          stroke="#3B82F6" 
          fill="url(#colorProtein)" 
          name="Protéines (g)"
        />
        <Area 
          type="monotone" 
          dataKey="carbs" 
          stackId="1"
          stroke="#10B981" 
          fill="url(#colorCarbs)" 
          name="Glucides (g)"
        />
        <Area 
          type="monotone" 
          dataKey="fat" 
          stackId="1"
          stroke="#F59E0B" 
          fill="url(#colorFat)" 
          name="Lipides (g)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}, (prevProps, nextProps) => {
  // ✅ PHASE 5 : Comparaison profonde des données
  return (
    prevProps.height === nextProps.height &&
    areChartDataEqual(prevProps.data, nextProps.data)
  );
});

MemoizedMacrosAreaChart.displayName = 'MemoizedMacrosAreaChart';

/**
 * ✅ PHASE 5 : Graphique PieChart pour distribution macros (mémorisé)
 */
export const MemoizedMacrosPieChart = memo(({ data, height = 320 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="w-full flex items-center justify-center" style={{ height }}>
        <p className="text-slate-400">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height} minHeight={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
          outerRadius={100}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}, (prevProps, nextProps) => {
  // ✅ PHASE 5 : Comparaison profonde des données
  return (
    prevProps.height === nextProps.height &&
    areChartDataEqual(prevProps.data, nextProps.data)
  );
});

MemoizedMacrosPieChart.displayName = 'MemoizedMacrosPieChart';

/**
 * ✅ PHASE 5 : Graphique LineChart pour évolution conformité (mémorisé)
 */
export const MemoizedComplianceLineChart = memo(({ data, height = 320 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="w-full flex items-center justify-center" style={{ height }}>
        <p className="text-slate-400">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height} minHeight={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis 
          dataKey="day" 
          stroke="#9CA3AF"
          tick={{ fill: '#9CA3AF', fontSize: 12 }}
        />
        <YAxis 
          stroke="#9CA3AF"
          tick={{ fill: '#9CA3AF', fontSize: 12 }}
          label={{ value: 'Conformité (%)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
          domain={[0, 100]}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <ReferenceLine y={80} stroke="#10B981" strokeDasharray="3 3" label="Objectif 80%" />
        <Line 
          type="monotone" 
          dataKey="compliance" 
          stroke="#3B82F6" 
          strokeWidth={2}
          name="Conformité (%)"
          dot={{ fill: '#3B82F6', r: 4 }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}, (prevProps, nextProps) => {
  // ✅ PHASE 5 : Comparaison profonde des données
  return (
    prevProps.height === nextProps.height &&
    areChartDataEqual(prevProps.data, nextProps.data)
  );
});

MemoizedComplianceLineChart.displayName = 'MemoizedComplianceLineChart';

