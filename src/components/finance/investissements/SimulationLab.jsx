import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useInvestissements } from '../../../hooks/useInvestissements';

/**
 * Laboratoire de simulation avec sliders pour tester différents scénarios
 */
const SimulationLab = () => {
  const { calculateAllocation } = useInvestissements();
  const allocation = useMemo(() => calculateAllocation(), [calculateAllocation]);

  const [scenarios, setScenarios] = useState({
    or: { rendement: 5, contribution: allocation?.or || 30 },
    liquidites: { rendement: 1, contribution: allocation?.liquidites || 15 },
    bourseCrypto: { rendement: 8, contribution: allocation?.bourseCrypto || 55 }
  });

  const [horizon, setHorizon] = useState(10); // années

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
    if (!allocation) return 0;
    return allocation.total || 0;
  }, [allocation]);

  // Projections selon scénario
  const projections = useMemo(() => {
    if (patrimoineActuel === 0) return [];

    const data = [];
    const repartition = {
      or: scenarios.or.contribution / 100,
      liquidites: scenarios.liquidites.contribution / 100,
      bourseCrypto: scenarios.bourseCrypto.contribution / 100
    };

    for (let annee = 0; annee <= horizon; annee += 1) {
      const croissanceOr = Math.pow(1 + scenarios.or.rendement / 100, annee);
      const croissanceLiquidites = Math.pow(1 + scenarios.liquidites.rendement / 100, annee);
      const croissanceBourse = Math.pow(1 + scenarios.bourseCrypto.rendement / 100, annee);

      const valorisationOr = patrimoineActuel * repartition.or * croissanceOr;
      const valorisationLiquidites = patrimoineActuel * repartition.liquidites * croissanceLiquidites;
      const valorisationBourse = patrimoineActuel * repartition.bourseCrypto * croissanceBourse;

      data.push({
        annee: annee,
        total: valorisationOr + valorisationLiquidites + valorisationBourse,
        or: valorisationOr,
        liquidites: valorisationLiquidites,
        bourse: valorisationBourse
      });
    }

    return data;
  }, [patrimoineActuel, scenarios, horizon]);

  const handleScenarioChange = (actif, field, value) => {
    setScenarios(prev => ({
      ...prev,
      [actif]: {
        ...prev[actif],
        [field]: parseFloat(value) || 0
      }
    }));
  };

  return (
    <div className="simulation-lab space-y-6">
      <h4 className="text-lg font-semibold text-white">🧪 Laboratoire de Simulation</h4>

      {/* Sliders pour ajuster scénarios */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Horizon de projection : {horizon} ans
          </label>
          <input
            type="range"
            min="1"
            max="30"
            value={horizon}
            onChange={(e) => setHorizon(parseInt(e.target.value))}
            className="w-full"
          />
        </div>

        {[
          { id: 'or', label: 'Or', icon: '🥇', couleur: '#eab308' },
          { id: 'liquidites', label: 'Liquidités', icon: '💰', couleur: '#10b981' },
          { id: 'bourseCrypto', label: 'Bourse & Crypto', icon: '📈', couleur: '#3b82f6' }
        ].map(actif => (
          <div key={actif.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white flex items-center gap-2">
                <span>{actif.icon}</span>
                <span>{actif.label}</span>
              </span>
            </div>
            
            <div className="space-y-2">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Rendement annuel : {scenarios[actif.id].rendement}%
                </label>
                <input
                  type="range"
                  min="-5"
                  max="20"
                  step="0.5"
                  value={scenarios[actif.id].rendement}
                  onChange={(e) => handleScenarioChange(actif.id, 'rendement', e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Allocation : {scenarios[actif.id].contribution}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={scenarios[actif.id].contribution}
                  onChange={(e) => handleScenarioChange(actif.id, 'contribution', e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Graphique projection */}
      {projections.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <h5 className="text-md font-semibold text-white mb-4">
            Projection sur {horizon} ans
          </h5>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={projections}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="annee" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" tickFormatter={formatCurrency} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="total" stroke="#ffffff" strokeWidth={2} name="Total" />
              <Line type="monotone" dataKey="or" stroke="#eab308" name="Or" />
              <Line type="monotone" dataKey="liquidites" stroke="#10b981" name="Liquidités" />
              <Line type="monotone" dataKey="bourse" stroke="#3b82f6" name="Bourse & Crypto" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Résumé */}
      {projections.length > 0 && (
        <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/50 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-slate-400 mb-1">Patrimoine actuel</div>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(patrimoineActuel)}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-400 mb-1">Projection {horizon} ans</div>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(projections[projections.length - 1]?.total || 0)}
              </div>
              <div className="text-xs text-green-400 mt-1">
                +{((projections[projections.length - 1]?.total / patrimoineActuel - 1) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimulationLab;



