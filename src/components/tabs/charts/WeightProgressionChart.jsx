import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Scale, TrendingUp, TrendingDown, Target } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../ui/Card';

const WeightProgressionChart = ({ data, colors }) => {
  // Traiter les données de progression pour extraire les données de poids
  const processData = () => {
    const currentData = data.data || {};
    const progressEntries = currentData.progressEntries || [];
    
    // Filtrer les entrées de métriques (type: 'metrics') et extraire les données de poids
    const weightData = progressEntries
      .filter(entry => entry.type === 'metrics' && entry.weight && entry.weight > 0)
      .map(entry => ({
        date: entry.date,
        timestamp: entry.timestamp || new Date(entry.date).getTime(),
        weight: parseFloat(entry.weight),
        bmi: entry.height ? (parseFloat(entry.weight) / Math.pow(parseFloat(entry.height) / 100, 2)).toFixed(1) : null,
        notes: entry.notes || ''
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
    
    return weightData;
  };

  const weightData = processData();
  
  // Calculer les statistiques
  const calculateStats = () => {
    if (weightData.length === 0) {
      return {
        currentWeight: 0,
        weightChange: 0,
        weightChangePercent: 0,
        trend: 'stable',
        averageWeight: 0,
        minWeight: 0,
        maxWeight: 0
      };
    }
    
    const currentWeight = weightData[weightData.length - 1].weight;
    const previousWeight = weightData.length > 1 ? weightData[weightData.length - 2].weight : currentWeight;
    const firstWeight = weightData[0].weight;
    
    const weightChange = currentWeight - firstWeight;
    const weightChangePercent = firstWeight > 0 ? ((weightChange / firstWeight) * 100).toFixed(1) : 0;
    
    const weights = weightData.map(d => d.weight);
    const averageWeight = (weights.reduce((sum, w) => sum + w, 0) / weights.length).toFixed(1);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    
    let trend = 'stable';
    if (weightData.length >= 3) {
      const recent = weightData.slice(-3).map(d => d.weight);
      const isIncreasing = recent[2] > recent[1] && recent[1] > recent[0];
      const isDecreasing = recent[2] < recent[1] && recent[1] < recent[0];
      if (isIncreasing) trend = 'increasing';
      else if (isDecreasing) trend = 'decreasing';
    }
    
    return {
      currentWeight,
      weightChange,
      weightChangePercent: parseFloat(weightChangePercent),
      trend,
      averageWeight: parseFloat(averageWeight),
      minWeight,
      maxWeight
    };
  };

  const stats = calculateStats();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium mb-2">
            {new Date(data.timestamp).toLocaleDateString('fr-FR')}
          </p>
          <p className="text-sm text-blue-400 mb-1">
            Poids: {data.weight} kg
          </p>
          {data.bmi && (
            <p className="text-sm text-green-400 mb-1">
              IMC: {data.bmi}
            </p>
          )}
          {data.notes && (
            <p className="text-sm text-slate-400">
              {data.notes}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (weightData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-blue-400" />
            Progression du Poids
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Scale className="w-12 h-12 mx-auto text-slate-400 mb-4" />
            <p className="text-slate-400">Aucune donnée de poids disponible</p>
            <p className="text-sm text-slate-500 mt-2">
              Enregistrez vos métriques dans l'onglet Progression pour voir l'évolution
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
          <Scale className="w-5 h-5 text-blue-400" />
          Progression du Poids
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-3 bg-blue-600/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-400">{stats.currentWeight} kg</div>
            <div className="text-sm text-slate-400">Poids actuel</div>
          </div>
          <div className={`text-center p-3 rounded-lg ${
            stats.weightChange > 0 ? 'bg-red-600/20' : stats.weightChange < 0 ? 'bg-green-600/20' : 'bg-slate-600/20'
          }`}>
            <div className={`text-2xl font-bold flex items-center justify-center gap-1 ${
              stats.weightChange > 0 ? 'text-red-400' : stats.weightChange < 0 ? 'text-green-400' : 'text-slate-400'
            }`}>
              {stats.weightChange > 0 && <TrendingUp className="w-5 h-5" />}
              {stats.weightChange < 0 && <TrendingDown className="w-5 h-5" />}
              {stats.weightChange > 0 ? '+' : ''}{stats.weightChange.toFixed(1)} kg
            </div>
            <div className="text-sm text-slate-400">Évolution totale</div>
          </div>
          <div className="text-center p-3 bg-purple-600/20 rounded-lg">
            <div className="text-2xl font-bold text-purple-400">{stats.averageWeight} kg</div>
            <div className="text-sm text-slate-400">Moyenne</div>
          </div>
          <div className="text-center p-3 bg-orange-600/20 rounded-lg">
            <div className="text-2xl font-bold text-orange-400">
              {stats.minWeight} - {stats.maxWeight} kg
            </div>
            <div className="text-sm text-slate-400">Min - Max</div>
          </div>
        </div>

        {/* Graphique */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weightData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="timestamp" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' })}
                stroke="#9CA3AF"
              />
              <YAxis 
                stroke="#9CA3AF"
                domain={['dataMin - 2', 'dataMax + 2']}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              
              {/* Ligne de référence pour le poids moyen */}
              <ReferenceLine 
                y={stats.averageWeight} 
                stroke="#8B5CF6" 
                strokeDasharray="5 5"
                label={{ value: "Moyenne", position: "topRight" }}
              />
              
              <Line 
                type="monotone" 
                dataKey="weight" 
                stroke={colors?.primary || '#3B82F6'} 
                strokeWidth={3}
                name="Poids (kg)"
                dot={{ fill: colors?.primary || '#3B82F6', strokeWidth: 2, r: 5 }}
                activeDot={{ r: 7, stroke: colors?.primary || '#3B82F6', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Informations supplémentaires */}
        {stats.weightChangePercent !== 0 && (
          <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Target className="w-4 h-4 text-slate-400" />
              <span className="text-slate-300">
                Évolution de <span className="font-semibold">{Math.abs(stats.weightChangePercent)}%</span> 
                {stats.weightChangePercent > 0 ? ' d\'augmentation' : ' de diminution'} 
                depuis le début du suivi
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WeightProgressionChart;
