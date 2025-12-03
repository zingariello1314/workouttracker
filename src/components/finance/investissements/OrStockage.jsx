import React, { useMemo } from 'react';
import { useInvestissements } from '../../../hooks/useInvestissements';

const OrStockage = ({ repartition, stockActuel }) => {
  const { or } = useInvestissements();

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const repartitionData = useMemo(() => {
    if (!repartition || !stockActuel) return [];

    const prixOr = 65; // Prix approximatif, sera remplacé par prix réel
    const total = stockActuel * prixOr;

    return [
      {
        lieu: 'Coffre Banque',
        pourcent: repartition.coffreBanque || 60,
        valeur: (total * (repartition.coffreBanque || 60)) / 100,
        grammes: (stockActuel * (repartition.coffreBanque || 60)) / 100
      },
      {
        lieu: 'Coffre Domicile',
        pourcent: repartition.coffreDomicile || 30,
        valeur: (total * (repartition.coffreDomicile || 30)) / 100,
        grammes: (stockActuel * (repartition.coffreDomicile || 30)) / 100
      },
      {
        lieu: 'Tiers Confiance',
        pourcent: repartition.tiersConfiance || 10,
        valeur: (total * (repartition.tiersConfiance || 10)) / 100,
        grammes: (stockActuel * (repartition.tiersConfiance || 10)) / 100
      }
    ];
  }, [repartition, stockActuel]);

  // Vérifier concentration (alerte si >85% même dépositaire)
  const alertes = useMemo(() => {
    const alerts = [];
    const maxPourcent = Math.max(...repartitionData.map(r => r.pourcent));
    
    if (maxPourcent > 85) {
      alerts.push({
        type: 'warning',
        message: `⚠️ Concentration élevée : ${maxPourcent.toFixed(0)}% au même dépositaire`,
        suggestion: 'Envisager une répartition plus équilibrée'
      });
    }

    return alerts;
  }, [repartitionData]);

  return (
    <div className="or-stockage bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
      <h4 className="text-lg font-semibold text-white mb-4">Répartition Stockage Sécurisé</h4>

      {/* Alertes */}
      {alertes.length > 0 && (
        <div className="mb-4 space-y-2">
          {alertes.map((alerte, index) => (
            <div key={index} className="bg-yellow-900/30 border border-yellow-500/50 rounded-lg p-3">
              <p className="text-sm text-yellow-300">{alerte.message}</p>
              <p className="text-xs text-yellow-400 mt-1">{alerte.suggestion}</p>
            </div>
          ))}
        </div>
      )}

      {/* Répartition */}
      <div className="space-y-3">
        {repartitionData.map((item, index) => (
          <div key={index} className="bg-slate-700/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-white">{item.lieu}</span>
              <span className="text-sm text-slate-400">{item.pourcent.toFixed(0)}%</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{item.grammes.toFixed(1)}g</span>
              <span>{formatCurrency(item.valeur)}</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2 mt-2">
              <div
                className="bg-yellow-500 h-2 rounded-full"
                style={{ width: `${item.pourcent}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrStockage;

