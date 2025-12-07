/**
 * Projections - Graphiques projections multi-temporelles
 * 3 scénarios (Optimiste/Réaliste/Pessimiste) sur 5/10/20 ans
 */

import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../../utils/planificateurUtils';

const Projections = ({ patrimoine, planEpargne, projections, duree = 5 }) => {
  // Calcul projections pour chaque scénario
  const projectionsData = useMemo(() => {
    if (!patrimoine || !planEpargne || !projections?.scenarios) return null;

    const scenarios = projections.scenarios;
    const dcaOr = planEpargne.or?.dca || 0;
    const dcaBourse = planEpargne.bourse?.dca || 0;
    const dcaCash = planEpargne.cash?.dca || 0;

    const mois = duree * 12;
    const data = [];

    for (let i = 0; i <= mois; i++) {
      const annee = i / 12;
      const point = { annee: annee.toFixed(1) };

      scenarios.forEach(scenario => {
        // Capital progressif
        const capitalOr = patrimoine.or.capitalInvesti + (dcaOr * i);
        const capitalBourse = patrimoine.bourse.capitalInvesti + (dcaBourse * i);
        const capitalCash = patrimoine.cash.capitalInvesti + (dcaCash * i);

        // Taux mensuels
        const tauxMensuelOr = Math.pow(1 + scenario.or / 100, 1 / 12) - 1;
        const tauxMensuelBourse = Math.pow(1 + scenario.bourse / 100, 1 / 12) - 1;

        // Valorisations avec rendements
        const valorisationOr = capitalOr * Math.pow(1 + tauxMensuelOr, i);
        const valorisationBourse = capitalBourse * Math.pow(1 + tauxMensuelBourse, i);
        const valorisationCash = capitalCash;

        point[scenario.nom.toLowerCase()] = valorisationOr + valorisationBourse + valorisationCash;
      });

      data.push(point);
    }

    return data;
  }, [patrimoine, planEpargne, projections, duree]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 shadow-xl">
          <p className="text-white font-semibold mb-2">Année {label}</p>
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

  if (!projectionsData) {
    return (
      <div className="text-center text-slate-400 py-8">
        Données insuffisantes pour calculer les projections
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Graphique Projections */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-purple-400" />
              Projections Patrimoine - {duree} ans
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              Évolution estimée selon 3 scénarios de rendement
            </p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={projectionsData}>
            <defs>
              <linearGradient id="colorOptimiste" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorRealiste" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorPessimiste" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="annee" 
              stroke="#9ca3af"
              label={{ value: 'Années', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
            />
            <YAxis 
              stroke="#9ca3af"
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="optimiste"
              stroke="#10b981"
              strokeWidth={3}
              fill="url(#colorOptimiste)"
              name="Optimiste"
            />
            <Area
              type="monotone"
              dataKey="realiste"
              stroke="#3b82f6"
              strokeWidth={3}
              fill="url(#colorRealiste)"
              name="Réaliste"
            />
            <Area
              type="monotone"
              dataKey="pessimiste"
              stroke="#f59e0b"
              strokeWidth={3}
              fill="url(#colorPessimiste)"
              name="Pessimiste"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Résumé Scénarios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {projections?.scenarios?.map((scenario, index) => {
          const colors = {
            'Optimiste': 'from-green-600/20 to-green-700/20 border-green-500',
            'Réaliste': 'from-blue-600/20 to-blue-700/20 border-blue-500',
            'Pessimiste': 'from-orange-600/20 to-orange-700/20 border-orange-500'
          };

          const finalValue = projectionsData[projectionsData.length - 1]?.[scenario.nom.toLowerCase()] || 0;

          return (
            <div 
              key={index}
              className={`bg-gradient-to-br ${colors[scenario.nom]} border-2 rounded-xl p-6`}
            >
              <div className="text-sm text-slate-400 mb-2">{scenario.nom}</div>
              <div className="text-3xl font-bold text-white mb-4">
                {formatCurrency(finalValue)}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Or</span>
                  <span className="text-white font-medium">{scenario.or}% / an</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Bourse</span>
                  <span className="text-white font-medium">{scenario.bourse}% / an</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Durée</span>
                  <span className="text-white font-medium">{duree} ans</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Hypothèses */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Hypothèses de calcul</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-slate-400 mb-2">DCA Mensuel</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-300">Or</span>
                <span className="text-white font-medium">{formatCurrency(planEpargne?.or?.dca || 0)}/mois</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Bourse</span>
                <span className="text-white font-medium">{formatCurrency(planEpargne?.bourse?.dca || 0)}/mois</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Cash</span>
                <span className="text-white font-medium">{formatCurrency(planEpargne?.cash?.dca || 0)}/mois</span>
              </div>
            </div>
          </div>
          <div>
            <div className="text-slate-400 mb-2">Capital Initial</div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-300">Or</span>
                <span className="text-white font-medium">{formatCurrency(patrimoine?.or?.capitalInvesti || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Bourse</span>
                <span className="text-white font-medium">{formatCurrency(patrimoine?.bourse?.capitalInvesti || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-300">Cash</span>
                <span className="text-white font-medium">{formatCurrency(patrimoine?.cash?.capitalInvesti || 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Projections;
