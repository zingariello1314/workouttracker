import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Activity, PieChart as PieChartIcon, BarChart3 } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { useState } from 'react';

const StretchDistributionChart = ({ data, colors }) => {
  const [chartType, setChartType] = useState('pie'); // 'pie' ou 'bar'

  // Traiter les données pour créer la répartition
  const processData = () => {
    const workoutHistory = data.workoutHistory || [];
    
    const distribution = {
      matin: 0,
      midi: 0,
      soir: 0
    };
    
    let totalStretches = 0;
    
    workoutHistory.forEach(session => {
      if (session.stretches && session.stretches.length > 0) {
        session.stretches.forEach(stretch => {
          if (stretch.completed) {
            distribution[stretch.type] += 1;
            totalStretches += 1;
          }
        });
      }
    });
    
    // Convertir en pourcentages et créer les données pour le graphique
    const chartData = Object.entries(distribution).map(([period, count]) => {
      const percentage = totalStretches > 0 ? ((count / totalStretches) * 100).toFixed(1) : 0;
      return {
        period: period,
        count: count,
        percentage: parseFloat(percentage),
        label: period === 'matin' ? '🌅 Matin' : period === 'midi' ? '☀️ Midi' : '🌙 Soir'
      };
    });
    
    return { chartData, totalStretches };
  };

  const { chartData, totalStretches } = processData();
  
  // Couleurs pour les segments - utilise le thème
  const COLORS = {
    matin: colors?.purple || '#8B5CF6', // Violet
    midi: colors?.primary || '#3B82F6',  // Bleu
    soir: colors?.secondary || '#10B981'   // Vert
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium mb-1">{data.label}</p>
          <p className="text-sm text-slate-300">
            {data.count} étirements ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-sm font-medium"
      >
        {percentage > 5 ? `${percentage}%` : ''}
      </text>
    );
  };

  if (totalStretches === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            Répartition des Étirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Activity className="w-12 h-12 mx-auto text-slate-400 mb-4" />
            <p className="text-slate-400">Aucune donnée d'étirements disponible</p>
            <p className="text-sm text-slate-500 mt-2">
              Commencez à enregistrer vos étirements pour voir la répartition
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            Répartition des Étirements
          </CardTitle>
          <div className="flex gap-2">
            <button
              onClick={() => setChartType('pie')}
              className={`p-2 rounded-lg transition-colors ${
                chartType === 'pie' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <PieChartIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`p-2 rounded-lg transition-colors ${
                chartType === 'bar' 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Statistiques rapides */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {chartData.map((item) => (
            <div key={item.period} className="text-center p-3 rounded-lg" style={{ backgroundColor: `${COLORS[item.period]}20` }}>
              <div className="text-2xl font-bold" style={{ color: COLORS[item.period] }}>
                {item.count}
              </div>
              <div className="text-sm text-slate-400">{item.label}</div>
              <div className="text-xs text-slate-500">{item.percentage}%</div>
            </div>
          ))}
        </div>

        {/* Graphique */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'pie' ? (
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={CustomLabel}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.period]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  formatter={(value, entry) => (
                    <span style={{ color: entry.color }}>
                      {chartData.find(item => item.period === value)?.label}
                    </span>
                  )}
                />
              </PieChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="label" 
                  stroke="#9CA3AF"
                  tick={{ fontSize: 12 }}
                />
                <YAxis stroke="#9CA3AF" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.period]} />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default StretchDistributionChart;
