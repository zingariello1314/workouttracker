import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

/**
 * Graphique de répartition (pie chart)
 */
const RepartitionChart = ({ repartition, salaire, formatCurrency }) => {
  const COLORS = {
    loyer: '#ef4444',
    investissementOr: '#eab308',
    investissementBourse: '#3b82f6',
    cashAccumulation: '#10b981',
    loisirs: '#8b5cf6',
    surplus: '#6b7280'
  };

  const LABELS = {
    loyer: 'Loyer',
    investissementOr: 'Investissement Or',
    investissementBourse: 'Investissement Bourse',
    cashAccumulation: 'Cash Accumulation',
    loisirs: 'Loisirs',
    surplus: 'Surplus/Sécurité'
  };

  const chartData = useMemo(() => {
    return Object.entries(repartition)
      .filter(([key, value]) => value > 0)
      .map(([key, value]) => ({
        name: LABELS[key] || key,
        value: value,
        color: COLORS[key] || '#6b7280'
      }));
  }, [repartition]);

  if (chartData.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
      <h4 className="text-lg font-semibold text-white mb-4">Visualisation Répartition</h4>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatCurrency(value)} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RepartitionChart;

