import React, { useMemo, memo } from 'react';
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useBudget } from '../../../hooks/useBudget';

const BudgetCharts = memo(() => {
  const { budget, categories, depensesMoisActuel, depenses } = useBudget();

  // Données pour graphique évolution (3 derniers mois)
  const evolutionData = useMemo(() => {
    const mois = [];
    const now = new Date();
    
    for (let i = 2; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const moisKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const depensesMois = depenses.filter(d => {
        const dDate = new Date(d.date);
        const dMois = `${dDate.getFullYear()}-${String(dDate.getMonth() + 1).padStart(2, '0')}`;
        return dMois === moisKey;
      });
      
      const totalDepenses = depensesMois.reduce((sum, d) => sum + d.montant, 0);
      const revenus = budget?.revenus || 0;
      
      mois.push({
        mois: date.toLocaleString('fr-FR', { month: 'short', year: 'numeric' }),
        depenses: totalDepenses,
        revenus: revenus,
        restant: revenus - totalDepenses
      });
    }
    
    return mois;
  }, [depenses, budget]);

  // Données pour pie chart répartition par catégorie
  const repartitionData = useMemo(() => {
    if (!categories || categories.length === 0) return [];
    
    const data = categories.map(categorie => {
      const depensesCategorie = depensesMoisActuel.filter(d => d.categorie === categorie.id);
      const total = depensesCategorie.reduce((sum, d) => sum + d.montant, 0);
      
      return {
        name: categorie.nom || 'Autre',
        value: total,
        budget: categorie.budgetMensuel || 0,
        pourcent: categorie.budgetMensuel > 0 
          ? (total / categorie.budgetMensuel) * 100 
          : 0
      };
    }).filter(item => item.value > 0);
    
    return data;
  }, [categories, depensesMoisActuel]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  if (depensesMoisActuel.length === 0 && evolutionData.every(d => d.depenses === 0)) {
    return (
      <div className="budget-charts bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Graphiques</h4>
        <div className="text-center py-8 text-slate-400">
          Aucune donnée disponible pour afficher les graphiques
        </div>
      </div>
    );
  }

  return (
    <div className="budget-charts space-y-6">
      <h4 className="text-lg font-semibold text-white">Graphiques Multi-Temporels</h4>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique évolution 3 mois */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <h5 className="text-md font-semibold text-white mb-4">Évolution (3 mois)</h5>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={evolutionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="mois" 
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis 
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                formatter={(value) => formatCurrency(value)}
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="revenus" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Revenus"
                dot={{ fill: '#10b981', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="depenses" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="Dépenses"
                dot={{ fill: '#ef4444', r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="restant" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Restant"
                dot={{ fill: '#3b82f6', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart répartition par catégorie */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <h5 className="text-md font-semibold text-white mb-4">Répartition par Catégorie</h5>
          {repartitionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={repartitionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, pourcent }) => `${name}: ${pourcent.toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {repartitionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-slate-400">
              Aucune dépense catégorisée ce mois
            </div>
          )}
        </div>
      </div>

      {/* Détails répartition */}
      {repartitionData.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <h5 className="text-md font-semibold text-white mb-4">Détails par Catégorie</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {repartitionData.map((item, index) => {
              const color = COLORS[index % COLORS.length];
              const isOverBudget = item.pourcent > 100;
              
              return (
                <div 
                  key={item.name}
                  className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-white">{item.name}</span>
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    {formatCurrency(item.value)}
                  </div>
                  <div className="text-sm text-slate-400 mb-2">
                    Budget: {formatCurrency(item.budget)}
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        isOverBudget ? 'bg-red-500' : 'bg-blue-500'
                      }`}
                      style={{ 
                        width: `${Math.min(item.pourcent, 150)}%`,
                        backgroundColor: isOverBudget ? '#ef4444' : color
                      }}
                    />
                  </div>
                  <div className={`text-xs mt-1 ${isOverBudget ? 'text-red-400' : 'text-slate-400'}`}>
                    {item.pourcent.toFixed(1)}% utilisé
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

BudgetCharts.displayName = 'BudgetCharts';

export default BudgetCharts;
