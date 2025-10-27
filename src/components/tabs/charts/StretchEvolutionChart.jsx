import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, Calendar, TrendingUp } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../ui/Card';

const StretchEvolutionChart = ({ data, selectedPeriod, colors }) => {
  // Traiter les données pour créer les séries temporelles
  const processData = () => {
    const workoutHistory = data.workoutHistory || [];
    const startDate = data.startDate;
    
    // Créer un objet pour grouper les étirements par date
    const stretchesByDate = {};
    
    workoutHistory.forEach(session => {
      if (session.stretches && session.stretches.length > 0) {
        const date = session.date;
        if (!stretchesByDate[date]) {
          stretchesByDate[date] = {
            date: date,
            matin: 0,
            midi: 0,
            soir: 0,
            total: 0
          };
        }
        
        // Compter les étirements par période
        session.stretches.forEach(stretch => {
          if (stretch.completed) {
            stretchesByDate[date][stretch.type] = 1;
            stretchesByDate[date].total += 1;
          }
        });
      }
    });
    
    // Convertir en tableau et trier par date
    const chartData = Object.values(stretchesByDate)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return chartData;
  };

  const chartData = processData();
  
  // Calculer les statistiques
  const totalStretches = chartData.reduce((sum, day) => sum + day.total, 0);
  const averagePerDay = chartData.length > 0 ? (totalStretches / chartData.length).toFixed(1) : 0;
  const mostActivePeriod = chartData.length > 0 ? 
    ['matin', 'midi', 'soir'].reduce((max, period) => 
      chartData.reduce((sum, day) => sum + day[period], 0) > 
      chartData.reduce((sum, day) => sum + day[max], 0) ? period : max
    ) : 'matin';

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium mb-2">{new Date(label).toLocaleDateString('fr-FR')}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.dataKey === 'matin' && '🌅 Matin'}
              {entry.dataKey === 'midi' && '☀️ Midi'}
              {entry.dataKey === 'soir' && '🌙 Soir'}
              {entry.dataKey === 'total' && '📊 Total'}
              : {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-400" />
            Évolution des Étirements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Activity className="w-12 h-12 mx-auto text-slate-400 mb-4" />
            <p className="text-slate-400">Aucune donnée d'étirements disponible</p>
            <p className="text-sm text-slate-500 mt-2">
              Commencez à enregistrer vos étirements pour voir l'évolution
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-purple-400" />
          Évolution des Étirements
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Statistiques rapides */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-purple-600/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-400">{totalStretches}</div>
            <div className="text-sm text-slate-400">Total étirements</div>
          </div>
          <div className="text-center p-3 bg-blue-600/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-400">{averagePerDay}</div>
            <div className="text-sm text-slate-400">Moyenne/jour</div>
          </div>
          <div className="text-center p-3 bg-green-600/20 rounded-lg">
            <div className="text-2xl font-bold text-green-400 capitalize">{mostActivePeriod}</div>
            <div className="text-sm text-slate-400">Période favorite</div>
          </div>
        </div>

        {/* Graphique */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
                stroke="#9CA3AF"
              />
              <YAxis stroke="#9CA3AF" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="matin" 
                stroke={colors?.purple || '#8B5CF6'} 
                strokeWidth={2}
                name="Matin"
                dot={{ fill: colors?.purple || '#8B5CF6', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="midi" 
                stroke={colors?.primary || '#3B82F6'} 
                strokeWidth={2}
                name="Midi"
                dot={{ fill: colors?.primary || '#3B82F6', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="soir" 
                stroke={colors?.secondary || '#10B981'} 
                strokeWidth={2}
                name="Soir"
                dot={{ fill: colors?.secondary || '#10B981', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke={colors?.accent || '#F59E0B'} 
                strokeWidth={3}
                name="Total"
                dot={{ fill: colors?.accent || '#F59E0B', strokeWidth: 2, r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default StretchEvolutionChart;
