import React, { useMemo } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useInvestissements } from '../../../hooks/useInvestissements';

const PredictiveModeling = () => {
  const { or, liquidites, bourseCrypto, calculateAllocation } = useInvestissements();

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Calculer patrimoine actuel
  const patrimoineActuel = useMemo(() => {
    const valorisationOr = (or?.stockActuel || 0) * 65;
    const totalLiquidites = liquidites?.stockTotal || 0;
    const valorisationBourseCrypto = bourseCrypto?.positions?.reduce((sum, pos) => 
      sum + (pos.montant || 0), 0) || 0;
    
    return valorisationOr + totalLiquidites + valorisationBourseCrypto;
  }, [or, liquidites, bourseCrypto]);

  // Projections selon différents scénarios
  const projections = useMemo(() => {
    if (patrimoineActuel === 0) return [];

    const scenarios = [
      { nom: 'Conservateur', or: 0.03, liquidites: 0.01, bourse: 0.05 },
      { nom: 'Modéré', or: 0.05, liquidites: 0.01, bourse: 0.08 },
      { nom: 'Optimiste', or: 0.07, liquidites: 0.01, bourse: 0.12 }
    ];

    const allocation = calculateAllocation();
    if (!allocation) return [];

    const repartition = {
      or: allocation.or / 100,
      liquidites: allocation.liquidites / 100,
      bourse: allocation.bourseCrypto / 100
    };

    const annees = [1, 3, 5, 10, 20];
    const data = [];

    scenarios.forEach(scenario => {
      annees.forEach(annee => {
        const croissanceOr = Math.pow(1 + scenario.or, annee);
        const croissanceLiquidites = Math.pow(1 + scenario.liquidites, annee);
        const croissanceBourse = Math.pow(1 + scenario.bourse, annee);

        const valorisationOr = patrimoineActuel * repartition.or * croissanceOr;
        const valorisationLiquidites = patrimoineActuel * repartition.liquidites * croissanceLiquidites;
        const valorisationBourse = patrimoineActuel * repartition.bourse * croissanceBourse;

        const total = valorisationOr + valorisationLiquidites + valorisationBourse;

        data.push({
          scenario: scenario.nom,
          annee: `${annee} an${annee > 1 ? 's' : ''}`,
          valeur: total,
          anneeNum: annee
        });
      });
    });

    // Organiser par année pour graphique
    const byYear = {};
    data.forEach(item => {
      if (!byYear[item.anneeNum]) {
        byYear[item.anneeNum] = { annee: item.annee };
      }
      byYear[item.anneeNum][item.scenario] = item.valeur;
    });

    return Object.values(byYear).sort((a, b) => {
      const aNum = parseInt(a.annee);
      const bNum = parseInt(b.annee);
      return aNum - bNum;
    });
  }, [patrimoineActuel, calculateAllocation]);

  // Monte Carlo simulation (simplifiée)
  const monteCarlo = useMemo(() => {
    if (patrimoineActuel === 0) return null;

    const simulations = 100;
    const annee = 10;
    const results = [];

    for (let i = 0; i < simulations; i++) {
      // Générer rendements aléatoires (distribution normale simplifiée)
      const rendementOr = (Math.random() * 0.08 - 0.02); // -2% à +6%
      const rendementBourse = (Math.random() * 0.20 - 0.05); // -5% à +15%
      const rendementLiquidites = 0.01; // 1% fixe

      const allocation = calculateAllocation();
      if (!allocation) continue;

      const repartition = {
        or: allocation.or / 100,
        liquidites: allocation.liquidites / 100,
        bourse: allocation.bourseCrypto / 100
      };

      const croissanceOr = Math.pow(1 + rendementOr, annee);
      const croissanceLiquidites = Math.pow(1 + rendementLiquidites, annee);
      const croissanceBourse = Math.pow(1 + rendementBourse, annee);

      const total = 
        patrimoineActuel * repartition.or * croissanceOr +
        patrimoineActuel * repartition.liquidites * croissanceLiquidites +
        patrimoineActuel * repartition.bourse * croissanceBourse;

      results.push(total);
    }

    results.sort((a, b) => a - b);

    const percentile10 = results[Math.floor(results.length * 0.1)];
    const percentile50 = results[Math.floor(results.length * 0.5)];
    const percentile90 = results[Math.floor(results.length * 0.9)];

    return {
      percentile10,
      percentile50,
      percentile90,
      annee
    };
  }, [patrimoineActuel, calculateAllocation]);

  if (patrimoineActuel === 0) {
    return (
      <div className="predictive-modeling bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Modélisation Prédictive</h4>
        <div className="text-center py-8 text-slate-400">
          Aucune donnée disponible pour les projections
        </div>
      </div>
    );
  }

  return (
    <div className="predictive-modeling space-y-6">
      <h4 className="text-lg font-semibold text-white">Modélisation Prédictive Unifiée</h4>

      {/* Projections multi-scénarios */}
      {projections.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <h5 className="text-md font-semibold text-white mb-4">Projections Patrimoine (5/10/20 ans)</h5>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={projections}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="annee" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" tickFormatter={formatCurrency} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="Conservateur" stroke="#3b82f6" name="Scénario Conservateur" />
              <Line type="monotone" dataKey="Modéré" stroke="#10b981" name="Scénario Modéré" />
              <Line type="monotone" dataKey="Optimiste" stroke="#f59e0b" name="Scénario Optimiste" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Monte Carlo */}
      {monteCarlo && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <h5 className="text-md font-semibold text-white mb-4">
            Simulation Monte Carlo ({monteCarlo.annee} ans)
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1">Percentile 10 (pessimiste)</div>
              <div className="text-xl font-bold text-red-400">
                {formatCurrency(monteCarlo.percentile10)}
              </div>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1">Percentile 50 (médian)</div>
              <div className="text-xl font-bold text-white">
                {formatCurrency(monteCarlo.percentile50)}
              </div>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1">Percentile 90 (optimiste)</div>
              <div className="text-xl font-bold text-green-400">
                {formatCurrency(monteCarlo.percentile90)}
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-400 mt-4">
            Basé sur {100} simulations avec rendements variables
          </div>
        </div>
      )}

      {/* Hypothèses */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <h5 className="text-md font-semibold text-white mb-4">Hypothèses de Rendement</h5>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-slate-300">
            <span>Or (annuel) :</span>
            <span className="text-white">3% - 7%</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Liquidités (annuel) :</span>
            <span className="text-white">1%</span>
          </div>
          <div className="flex justify-between text-slate-300">
            <span>Bourse/Crypto (annuel) :</span>
            <span className="text-white">5% - 12%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictiveModeling;



