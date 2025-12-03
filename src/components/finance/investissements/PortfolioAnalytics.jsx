import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const PortfolioAnalytics = ({ positions }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Répartition par type
  const repartitionData = useMemo(() => {
    if (!positions || positions.length === 0) return [];

    const rep = {};
    positions.forEach(pos => {
      const type = pos.type || 'autre';
      rep[type] = (rep[type] || 0) + (pos.montant || 0);
    });

    const colors = {
      action: '#3b82f6',
      etf: '#8b5cf6',
      crypto: '#f59e0b',
      cash: '#10b981',
      autre: '#6b7280'
    };

    return Object.entries(rep).map(([type, value]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      value,
      color: colors[type] || colors.autre
    }));
  }, [positions]);

  // Calculer métriques de risque (simplifiées)
  const riskMetrics = useMemo(() => {
    if (!positions || positions.length === 0) return null;

    const total = positions.reduce((sum, pos) => sum + (pos.montant || 0), 0);
    if (total === 0) return null;

    // Diversification (nombre de positions)
    const diversification = positions.length;

    // Concentration (max % dans une position)
    const maxPosition = Math.max(...positions.map(pos => (pos.montant || 0) / total * 100));

    return {
      diversification,
      concentration: maxPosition,
      total
    };
  }, [positions]);

  if (!positions || positions.length === 0) {
    return (
      <div className="portfolio-analytics bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Analytics Portfolio Avancées</h4>
        <div className="text-center py-8 text-slate-400">
          Aucune position enregistrée
        </div>
      </div>
    );
  }

  return (
    <div className="portfolio-analytics space-y-6">
      <h4 className="text-lg font-semibold text-white">Analytics Portfolio Avancées</h4>

      {/* Répartition par type */}
      {repartitionData.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <h5 className="text-md font-semibold text-white mb-4">Répartition par Type</h5>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={repartitionData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label
              >
                {repartitionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Métriques de risque */}
      {riskMetrics && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <h5 className="text-md font-semibold text-white mb-4">Métriques de Risque</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1">Diversification</div>
              <div className="text-2xl font-bold text-white">
                {riskMetrics.diversification}
              </div>
              <div className="text-xs text-slate-500 mt-1">Positions</div>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1">Concentration</div>
              <div className="text-2xl font-bold text-white">
                {riskMetrics.concentration.toFixed(1)}%
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {riskMetrics.concentration > 30 ? '⚠️ Élevée' : '✓ Acceptable'}
              </div>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1">Valorisation</div>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(riskMetrics.total)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Liste positions */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <h5 className="text-md font-semibold text-white mb-4">Positions ({positions.length})</h5>
        <div className="space-y-2">
          {positions.map((pos, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
              <div>
                <div className="text-sm font-medium text-white">
                  {pos.ticker} {pos.nom && `- ${pos.nom}`}
                </div>
                <div className="text-xs text-slate-400 capitalize">{pos.type}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-white">
                  {formatCurrency(pos.montant || 0)}
                </div>
                {pos.quantite > 0 && pos.prixAchat > 0 && (
                  <div className="text-xs text-slate-400">
                    {pos.quantite} × {formatCurrency(pos.prixAchat)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PortfolioAnalytics;

