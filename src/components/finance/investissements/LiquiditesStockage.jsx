import React, { useMemo, useState } from 'react';
import { useInvestissements } from '../../../hooks/useInvestissements';
import { useToast } from '../../ui/Toast/ToastProvider';

const LiquiditesStockage = ({ repartition, stockTotal }) => {
  const { updateLiquidites } = useInvestissements();
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Initialiser répartition si vide
  const repartitionData = useMemo(() => {
    if (!repartition || Object.keys(repartition).length === 0) {
      return [
        { lieu: 'Lieu 1', montant: 0, pourcent: 0 },
        { lieu: 'Lieu 2', montant: 0, pourcent: 0 },
        { lieu: 'Lieu 3', montant: 0, pourcent: 0 }
      ];
    }

    const total = Object.values(repartition).reduce((sum, val) => sum + (val || 0), 0);
    
    return Object.entries(repartition).map(([lieu, montant]) => ({
      lieu,
      montant: montant || 0,
      pourcent: total > 0 ? ((montant || 0) / total) * 100 : 0
    }));
  }, [repartition]);

  // Vérifier seuils escalade
  const seuils = useMemo(() => {
    const seuilsConfig = [
      { seuil: 1000, strategie: 'Dispersion recommandée' },
      { seuil: 5000, strategie: 'Répartition obligatoire' },
      { seuil: 10000, strategie: 'Stratégie sécurité renforcée' }
    ];

    return seuilsConfig.filter(s => stockTotal >= s.seuil);
  }, [stockTotal]);

  // Vérifier concentration
  const alertes = useMemo(() => {
    const alerts = [];
    const maxPourcent = Math.max(...repartitionData.map(r => r.pourcent));
    const maxMontant = Math.max(...repartitionData.map(r => r.montant));
    
    if (maxPourcent > 70 && stockTotal > 1000) {
      alerts.push({
        type: 'warning',
        message: `⚠️ Concentration élevée : ${maxPourcent.toFixed(0)}% (${formatCurrency(maxMontant)}) au même emplacement`,
        suggestion: 'Envisager une dispersion pour sécurité'
      });
    }

    if (stockTotal > 10000 && maxPourcent > 50) {
      alerts.push({
        type: 'critical',
        message: `🔴 Stock élevé avec concentration : ${formatCurrency(stockTotal)}`,
        suggestion: 'Répartition obligatoire recommandée'
      });
    }

    return alerts;
  }, [repartitionData, stockTotal]);

  const handleUpdateRepartition = async (newRepartition) => {
    try {
      await updateLiquidites({ repartition: newRepartition });
      setEditing(false);
      showToast('Répartition mise à jour', 'success');
    } catch (error) {
      showToast('Erreur lors de la mise à jour', 'error');
    }
  };

  return (
    <div className="liquidites-stockage bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-white">Gestionnaire Stockage Sécurisé</h4>
        <button
          onClick={() => setEditing(!editing)}
          className="px-3 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded text-sm transition-colors"
        >
          {editing ? 'Annuler' : 'Modifier'}
        </button>
      </div>

      {/* Seuils escalade */}
      {seuils.length > 0 && (
        <div className="mb-4 space-y-2">
          {seuils.map((seuil, index) => (
            <div key={index} className="bg-green-900/30 border border-green-500/50 rounded-lg p-2">
              <div className="text-xs text-green-300">
                ✓ {formatCurrency(seuil.seuil)}+ : {seuil.strategie}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Alertes */}
      {alertes.length > 0 && (
        <div className="mb-4 space-y-2">
          {alertes.map((alerte, index) => (
            <div key={index} className={`rounded-lg p-3 ${
              alerte.type === 'critical' 
                ? 'bg-red-900/30 border border-red-500/50' 
                : 'bg-yellow-900/30 border border-yellow-500/50'
            }`}>
              <p className={`text-sm ${
                alerte.type === 'critical' ? 'text-red-300' : 'text-yellow-300'
              }`}>
                {alerte.message}
              </p>
              <p className={`text-xs mt-1 ${
                alerte.type === 'critical' ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {alerte.suggestion}
              </p>
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
              {editing ? (
                <input
                  type="number"
                  value={item.montant}
                  onChange={(e) => {
                    const newRepartition = { ...repartition };
                    newRepartition[item.lieu] = parseFloat(e.target.value) || 0;
                    handleUpdateRepartition(newRepartition);
                  }}
                  className="w-32 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                  min="0"
                  step="0.01"
                />
              ) : (
                <span className="text-sm text-slate-400">{item.pourcent.toFixed(0)}%</span>
              )}
            </div>
            <div className="text-xs text-slate-400 mb-2">
              {formatCurrency(item.montant)}
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${item.pourcent}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-300">Total réparti</span>
          <span className="text-lg font-bold text-white">
            {formatCurrency(repartitionData.reduce((sum, r) => sum + r.montant, 0))}
          </span>
        </div>
        {stockTotal > 0 && (
          <div className="text-xs text-slate-400 mt-1">
            Non réparti : {formatCurrency(stockTotal - repartitionData.reduce((sum, r) => sum + r.montant, 0))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiquiditesStockage;

