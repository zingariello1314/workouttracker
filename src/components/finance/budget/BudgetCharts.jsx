/**
 * Composant BudgetCharts - Graphiques multi-temporels
 * Affiche : courbes théorie vs réalité, répartition par catégorie, évolution temporelle
 */

import React, { useMemo, useState } from 'react';
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useBudget } from '../../../hooks/useBudget';

const BudgetCharts = () => {
  const { budget, categories, depenses, depensesMoisActuel } = useBudget();
  const [selectedPeriod, setSelectedPeriod] = useState('3'); // 3, 6, 12 mois

  // Données pour courbe théorie vs réalité (3/6/12 mois)
  const theoryVsRealityData = useMemo(() => {
    if (!budget || !depenses || depenses.length === 0) return [];

    const months = parseInt(selectedPeriod);
    const now = new Date();
    const data = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      // Dépenses réelles du mois
      const depensesMois = depenses.filter(d => {
        const depenseDate = new Date(d.date);
        return depenseDate.getFullYear() === date.getFullYear() && 
               depenseDate.getMonth() === date.getMonth();
      });
      const depensesReelles = depensesMois.reduce((sum, d) => sum + (d.montant || 0), 0);

      // Budget théorique (revenus - épargne)
      const budgetTheorique = (budget.revenus || 0) - (budget.epargne?.objectif || 0);

      data.push({
        mois: date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        theorie: budgetTheorique,
        realite: depensesReelles,
        ecart: depensesReelles - budgetTheorique
      });
    }

    return data;
  }, [budget, depenses, selectedPeriod]);

  // Données pour répartition par catégorie (pie chart)
  const categoryDistributionData = useMemo(() => {
    if (!categories || categories.length === 0) return [];

    return categories.map(cat => {
      const depensesCat = depensesMoisActuel.filter(d => d.categorie === cat.id);
      const total = depensesCat.reduce((sum, d) => sum + (d.montant || 0), 0);
      
      return {
        name: cat.nom,
        value: total,
        budget: cat.budgetMensuel || 0,
        pourcent: cat.budgetMensuel > 0 ? (total / cat.budgetMensuel) * 100 : 0
      };
    }).filter(item => item.value > 0);
  }, [categories, depensesMoisActuel]);

  // Données pour évolution temporelle (line chart)
  const evolutionData = useMemo(() => {
    if (!depenses || depenses.length === 0) return [];

    const months = parseInt(selectedPeriod);
    const now = new Date();
    const data = [];

    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      
      const depensesMois = depenses.filter(d => {
        const depenseDate = new Date(d.date);
        return depenseDate.getFullYear() === date.getFullYear() && 
               depenseDate.getMonth() === date.getMonth();
      });
      const total = depensesMois.reduce((sum, d) => sum + (d.montant || 0), 0);

      data.push({
        mois: date.toLocaleDateString('fr-FR', { month: 'short' }),
        depenses: total,
        revenus: budget?.revenus || 0
      });
    }

    return data;
  }, [depenses, budget, selectedPeriod]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(value);
  };

  if (!budget || categories.length === 0) {
    return (
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <p className="text-slate-400 text-center py-8">
          Aucune donnée disponible. Ajoutez des catégories et des dépenses pour voir les graphiques.
        </p>
      </div>
    );
  }

  return (
    <div className="budget-charts space-y-6">
      {/* Sélecteur de période */}
      <div className="flex items-center gap-2">
        <span className="text-slate-400 text-sm">Période :</span>
        {['3', '6', '12'].map(period => (
          <button
            key={period}
            onClick={() => setSelectedPeriod(period)}
            className={`px-3 py-1 rounded text-sm transition-all ${
              selectedPeriod === period
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {period} mois
          </button>
        ))}
      </div>

      {/* Graphique 1 : Théorie vs Réalité */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Théorie vs Réalité ({selectedPeriod} mois)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={theoryVsRealityData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="mois" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" tickFormatter={formatCurrency} />
            <Tooltip 
              formatter={(value) => formatCurrency(value)}
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="theorie" 
              stroke="#10b981" 
              strokeWidth={2}
              name="Budget théorique"
              dot={{ fill: '#10b981', r: 4 }}
            />
            <Line 
              type="monotone" 
              dataKey="realite" 
              stroke="#ef4444" 
              strokeWidth={2}
              name="Dépenses réelles"
              dot={{ fill: '#ef4444', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Graphique 2 : Répartition par catégorie (Pie Chart) */}
      {categoryDistributionData.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Répartition par Catégorie (Mois actuel)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, pourcent }) => `${name}: ${pourcent.toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => formatCurrency(value)}
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Graphique 3 : Évolution temporelle */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Évolution Dépenses vs Revenus ({selectedPeriod} mois)
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={evolutionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="mois" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" tickFormatter={formatCurrency} />
            <Tooltip 
              formatter={(value) => formatCurrency(value)}
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
            />
            <Legend />
            <Bar dataKey="revenus" fill="#10b981" name="Revenus" />
            <Bar dataKey="depenses" fill="#ef4444" name="Dépenses" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BudgetCharts;
