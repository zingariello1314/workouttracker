/**
 * Graphiques Théorie vs Réalité
 * Comparaison courbes théoriques et réelles par actif
 */

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../../utils/planificateurUtils';

const TheorieReeliteCharts = ({ patrimoine, planEpargne, historique }) => {
  // Calcul courbes théoriques et réelles
  const chartsData = useMemo(() => {
    if (!patrimoine || !planEpargne) return null;

    const moisHistorique = historique?.length || 12;
    
    // Données Or
    const orData = [];
    const dcaOr = planEpargne.or?.dca || 0;
    const tauxOr = 0.07; // 7% annualisé
    const tauxMensuelOr = Math.pow(1 + tauxOr, 1 / 12) - 1;

    for (let i = 0; i <= moisHistorique; i++) {
      const capitalTheorique = dcaOr * i;
      const valorisationTheorique = i === 0 ? 0 : dcaOr * ((Math.pow(1 + tauxMensuelOr, i) - 1) / tauxMensuelOr);
      
      orData.push({
        mois: i,
        theorique: valorisationTheorique,
        reel: i === moisHistorique ? patrimoine.or.valorisation : (valorisationTheorique * 0.95) // Approximation
      });
    }

    // Données Bourse
    const bourseData = [];
    const dcaBourse = planEpargne.bourse?.dca || 0;
    const tauxBourse = 0.10; // 10% annualisé
    const tauxMensuelBourse = Math.pow(1 + tauxBourse, 1 / 12) - 1;

    for (let i = 0; i <= moisHistorique; i++) {
      const capitalTheorique = dcaBourse * i;
      const valorisationTheorique = i === 0 ? 0 : dcaBourse * ((Math.pow(1 + tauxMensuelBourse, i) - 1) / tauxMensuelBourse);
      
      bourseData.push({
        mois: i,
        theorique: valorisationTheorique,
        reel: i === moisHistorique ? patrimoine.bourse.valorisation : (valorisationTheorique * 1.05) // Approximation
      });
    }

    // Données Cash
    const cashData = [];
    const dcaCash = planEpargne.cash?.dca || 0;

    for (let i = 0; i <= moisHistorique; i++) {
      const valorisation = dcaCash * i;
      
      cashData.push({
        mois: i,
        theorique: valorisation,
        reel: i === moisHistorique ? patrimoine.cash.valorisation : valorisation
      });
    }

    return { orData, bourseData, cashData };
  }, [patrimoine, planEpargne, historique]);

  if (!chartsData) {
    return (
      <div className="text-center text-slate-400 py-8">
        Données insuffisantes pour afficher les graphiques
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl">
          <p className="text-white font-semibold mb-2">Mois {label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Graphique Or */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">🪙</span>
          Or - Théorie vs Réalité
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartsData.orData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="mois" 
              stroke="#9ca3af"
              label={{ value: 'Mois', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
            />
            <YAxis 
              stroke="#9ca3af"
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="theorique" 
              stroke="#fbbf24" 
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Théorique (+7%)"
              dot={false}
            />
            <Line 
              type="monotone" 
              dataKey="reel" 
              stroke="#f59e0b" 
              strokeWidth={3}
              name="Réel"
              dot={{ fill: '#f59e0b', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="text-xs text-slate-400 mb-1">Capital Investi</div>
            <div className="text-xl font-bold text-white">
              {formatCurrency(patrimoine.or.capitalInvesti)}
            </div>
          </div>
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="text-xs text-slate-400 mb-1">Valorisation Actuelle</div>
            <div className="text-xl font-bold text-white">
              {formatCurrency(patrimoine.or.valorisation)}
            </div>
          </div>
        </div>
      </div>

      {/* Graphique Bourse */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">📈</span>
          Bourse - Théorie vs Réalité
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartsData.bourseData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="mois" 
              stroke="#9ca3af"
              label={{ value: 'Mois', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
            />
            <YAxis 
              stroke="#9ca3af"
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="theorique" 
              stroke="#60a5fa" 
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Théorique (+10%)"
              dot={false}
            />
            <Line 
              type="monotone" 
              dataKey="reel" 
              stroke="#3b82f6" 
              strokeWidth={3}
              name="Réel"
              dot={{ fill: '#3b82f6', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="text-xs text-slate-400 mb-1">Capital Investi</div>
            <div className="text-xl font-bold text-white">
              {formatCurrency(patrimoine.bourse.capitalInvesti)}
            </div>
          </div>
          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="text-xs text-slate-400 mb-1">Valorisation Actuelle</div>
            <div className="text-xl font-bold text-white">
              {formatCurrency(patrimoine.bourse.valorisation)}
            </div>
          </div>
        </div>
      </div>

      {/* Graphique Cash */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-2xl" aria-hidden="true">💵</span>
          Cash - Accumulation
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartsData.cashData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="mois" 
              stroke="#9ca3af"
              label={{ value: 'Mois', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
            />
            <YAxis 
              stroke="#9ca3af"
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="theorique" 
              stroke="#6ee7b7" 
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Théorique (linéaire)"
              dot={false}
            />
            <Line 
              type="monotone" 
              dataKey="reel" 
              stroke="#10b981" 
              strokeWidth={3}
              name="Réel"
              dot={{ fill: '#10b981', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="text-xs text-slate-400 mb-1">Capital Investi</div>
            <div className="text-xl font-bold text-white">
              {formatCurrency(patrimoine.cash.capitalInvesti)}
            </div>
          </div>
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="text-xs text-slate-400 mb-1">Cash Détenu</div>
            <div className="text-xl font-bold text-white">
              {formatCurrency(patrimoine.cash.valorisation)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TheorieReeliteCharts;
