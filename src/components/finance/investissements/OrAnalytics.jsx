import React, { useMemo } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useInvestissements } from '../../../hooks/useInvestissements';

const OrAnalytics = ({ or, prixOr }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Courbe DCA (Dollar Cost Averaging)
  const dcaData = useMemo(() => {
    if (!or?.acquisitions || or.acquisitions.length === 0) return [];

    let stockCumule = 0;
    let investiCumule = 0;

    return or.acquisitions
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map((acq, index) => {
        stockCumule += acq.quantite;
        investiCumule += acq.quantite * acq.prix;
        const prixMoyen = investiCumule / stockCumule;
        const valorisationActuelle = stockCumule * prixOr;

        return {
          index: index + 1,
          date: new Date(acq.date).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
          investi: investiCumule,
          valorisation: valorisationActuelle,
          prixMoyen,
          plusValue: valorisationActuelle - investiCumule
        };
      });
  }, [or, prixOr]);

  // Projection valorisation (3 scénarios)
  const projections = useMemo(() => {
    if (!or?.stockActuel || !prixOr) return null;

    const valorisationActuelle = or.stockActuel * prixOr;
    const scenarios = [
      { nom: 'Conservateur', taux: 0.03, couleur: '#3b82f6' },
      { nom: 'Réaliste', taux: 0.07, couleur: '#10b981' },
      { nom: 'Optimiste', taux: 0.12, couleur: '#f59e0b' }
    ];

    return scenarios.map(scenario => ({
      ...scenario,
      annee1: valorisationActuelle * (1 + scenario.taux),
      annee3: valorisationActuelle * Math.pow(1 + scenario.taux, 3),
      annee5: valorisationActuelle * Math.pow(1 + scenario.taux, 5)
    }));
  }, [or, prixOr]);

  // Analyse prime moyenne
  const primeMoyenne = useMemo(() => {
    if (!or?.acquisitions || or.acquisitions.length === 0) return 0;
    
    const primes = or.acquisitions
      .filter(acq => acq.prime !== undefined && acq.prime !== null)
      .map(acq => acq.prime);
    
    if (primes.length === 0) return 0;
    
    return primes.reduce((sum, p) => sum + p, 0) / primes.length;
  }, [or]);

  if (!or || !or.acquisitions || or.acquisitions.length === 0) {
    return (
      <div className="or-analytics bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Analytics Prédictives</h4>
        <div className="text-center py-8 text-slate-400">
          Aucune donnée disponible
        </div>
      </div>
    );
  }

  return (
    <div className="or-analytics space-y-6">
      <h4 className="text-lg font-semibold text-white">Analytics Prédictives</h4>

      {/* Courbe DCA */}
      {dcaData.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <h5 className="text-md font-semibold text-white mb-4">Courbe DCA (Théorique vs Réalité)</h5>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dcaData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" style={{ fontSize: '12px' }} />
              <YAxis stroke="#9ca3af" tickFormatter={formatCurrency} style={{ fontSize: '12px' }} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Area
                type="monotone"
                dataKey="investi"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
                name="Investi"
              />
              <Area
                type="monotone"
                dataKey="valorisation"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.3}
                name="Valorisation Actuelle"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Projections */}
      {projections && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <h5 className="text-md font-semibold text-white mb-4">Projection Valorisation</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {projections.map((scenario, index) => (
              <div key={index} className="bg-slate-700/30 rounded-lg p-4">
                <div className="text-sm font-medium text-white mb-2">{scenario.nom}</div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>1 an :</span>
                    <span className="text-white">{formatCurrency(scenario.annee1)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>3 ans :</span>
                    <span className="text-white">{formatCurrency(scenario.annee3)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>5 ans :</span>
                    <span className="text-white">{formatCurrency(scenario.annee5)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prime moyenne */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <h5 className="text-md font-semibold text-white mb-4">Analyse Prime Moyenne</h5>
        <div className="flex items-center gap-4">
          <div className="text-3xl font-bold text-white">
            {primeMoyenne.toFixed(2)}%
          </div>
          <div className="flex-1">
            <div className="text-sm text-slate-400 mb-1">Prime moyenne sur toutes les acquisitions</div>
            <div className={`text-xs ${
              primeMoyenne < 5 ? 'text-green-400' :
              primeMoyenne < 8 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {primeMoyenne < 5 ? '✓ Excellent' :
               primeMoyenne < 8 ? '⚠ Acceptable' : '⚠ Élevée - Attendre meilleures conditions'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrAnalytics;

