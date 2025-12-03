import React, { useState, useMemo } from 'react';
import { useTranslation } from '../../../utils/translations';
import { useInvestissements } from '../../../hooks/useInvestissements';
import { useToast } from '../../ui/Toast/ToastProvider';
import DCAManager from './DCAManager';
import PortfolioAnalytics from './PortfolioAnalytics';
import OpportunitiesManager from './OpportunitiesManager';
import AddPositionForm from './AddPositionForm';

const BourseCryptoSubTab = () => {
  const t = useTranslation();
  const { bourseCrypto, addPosition, updateBourseCrypto, loading } = useInvestissements();
  const { showToast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleAddPosition = async (positionData) => {
    try {
      await addPosition(positionData);
      setShowAddForm(false);
      showToast('Position ajoutée', 'success');
    } catch (error) {
      showToast('Erreur lors de l\'ajout', 'error');
    }
  };

  // Calculer valorisation totale
  const valorisationTotale = useMemo(() => {
    if (!bourseCrypto?.positions || bourseCrypto.positions.length === 0) return 0;
    return bourseCrypto.positions.reduce((sum, pos) => sum + (pos.montant || 0), 0);
  }, [bourseCrypto]);

  // Répartition par type
  const repartition = useMemo(() => {
    if (!bourseCrypto?.positions || bourseCrypto.positions.length === 0) {
      return { actions: 0, crypto: 0, cash: 0 };
    }

    const rep = { actions: 0, crypto: 0, cash: 0 };
    bourseCrypto.positions.forEach(pos => {
      if (pos.type === 'action' || pos.type === 'etf') {
        rep.actions += pos.montant || 0;
      } else if (pos.type === 'crypto') {
        rep.crypto += pos.montant || 0;
      } else {
        rep.cash += pos.montant || 0;
      }
    });

    return rep;
  }, [bourseCrypto]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-400">Chargement...</p>
        </div>
      </div>
    );
  }

  const allocationCible = bourseCrypto?.allocation || { actions: 60, crypto: 15, cashAttente: 25 };
  const total = valorisationTotale || 1;

  return (
    <div className="bourse-crypto space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-white">Bourse & Crypto</h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <span>➕</span>
          <span>Ajouter Position</span>
        </button>
      </div>

      {/* Formulaire ajout */}
      {showAddForm && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <AddPositionForm
            onSave={handleAddPosition}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">📈</span>
            <div>
              <div className="text-sm text-slate-400">Valorisation Totale</div>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(valorisationTotale)}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">📊</span>
            <div>
              <div className="text-sm text-slate-400">Actions</div>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(repartition.actions)}
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            {total > 0 ? `${((repartition.actions / total) * 100).toFixed(1)}%` : '0%'} 
            (Cible: {allocationCible.actions}%)
          </div>
        </div>

        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">₿</span>
            <div>
              <div className="text-sm text-slate-400">Crypto</div>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(repartition.crypto)}
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            {total > 0 ? `${((repartition.crypto / total) * 100).toFixed(1)}%` : '0%'} 
            (Cible: {allocationCible.crypto}%)
          </div>
        </div>

        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">💵</span>
            <div>
              <div className="text-sm text-slate-400">Cash Attente</div>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(repartition.cash)}
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            {total > 0 ? `${((repartition.cash / total) * 100).toFixed(1)}%` : '0%'} 
            (Cible: {allocationCible.cashAttente}%)
          </div>
        </div>
      </div>

      {/* Allocation actuelle vs cible */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-white mb-4">Allocation Actuelle vs Cible</h4>
        <div className="space-y-3">
          {[
            { nom: 'Actions', actuel: repartition.actions, cible: allocationCible.actions, couleur: '#3b82f6' },
            { nom: 'Crypto', actuel: repartition.crypto, cible: allocationCible.crypto, couleur: '#f59e0b' },
            { nom: 'Cash', actuel: repartition.cash, cible: allocationCible.cashAttente, couleur: '#10b981' }
          ].map((item, index) => {
            const pourcentActuel = total > 0 ? (item.actuel / total) * 100 : 0;
            const ecart = pourcentActuel - item.cible;
            
            return (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-300">{item.nom}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">
                      {pourcentActuel.toFixed(1)}%
                    </span>
                    <span className={`text-xs ${
                      Math.abs(ecart) <= 2 ? 'text-green-400' :
                      Math.abs(ecart) <= 5 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      (Cible: {item.cible}%)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{ 
                      width: `${Math.min(pourcentActuel, 100)}%`,
                      backgroundColor: item.couleur
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DCA Manager */}
      <DCAManager 
        dca={bourseCrypto?.dca}
        onUpdate={updateBourseCrypto}
      />

      {/* Portfolio Analytics */}
      <PortfolioAnalytics 
        positions={bourseCrypto?.positions || []}
      />

      {/* Opportunities Manager */}
      <OpportunitiesManager 
        positions={bourseCrypto?.positions || []}
        cashAttente={repartition.cash}
      />
    </div>
  );
};

export default BourseCryptoSubTab;
