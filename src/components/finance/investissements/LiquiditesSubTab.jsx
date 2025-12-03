import React, { useState, useMemo } from 'react';
import { useTranslation } from '../../../utils/translations';
import { useInvestissements } from '../../../hooks/useInvestissements';
import { useToast } from '../../ui/Toast/ToastProvider';
import LiquiditesCalculator from './LiquiditesCalculator';
import LiquiditesStockage from './LiquiditesStockage';
import LiquiditesAnalytics from './LiquiditesAnalytics';
import AddLiquiditesEntryForm from './AddLiquiditesEntryForm';

const LiquiditesSubTab = () => {
  const t = useTranslation();
  const { liquidites, addLiquiditesEntry, updateLiquidites, loading } = useInvestissements();
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

  const handleAddEntry = async (entryData) => {
    try {
      await addLiquiditesEntry(entryData);
      setShowAddForm(false);
      showToast('Entrée liquidités enregistrée', 'success');
    } catch (error) {
      showToast('Erreur lors de l\'ajout', 'error');
    }
  };

  // Calcul progression mensuelle
  const progressionMensuelle = useMemo(() => {
    if (!liquidites?.progression || liquidites.progression.length === 0) return [];

    const now = new Date();
    const moisActuel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    return liquidites.progression
      .filter(entry => {
        const entryDate = new Date(entry.date);
        const entryMois = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}`;
        return entryMois === moisActuel;
      })
      .reduce((sum, entry) => sum + (entry.montant || 0), 0);
  }, [liquidites]);

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

  return (
    <div className="liquidites space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-white">Liquidités</h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <span>➕</span>
          <span>Ajouter Entrée</span>
        </button>
      </div>

      {/* Formulaire ajout */}
      {showAddForm && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <AddLiquiditesEntryForm
            onSave={handleAddEntry}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">💰</span>
            <div>
              <div className="text-sm text-slate-400">Stock Total</div>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(liquidites?.stockTotal || 0)}
              </div>
            </div>
          </div>
          <div className="text-sm text-slate-500">Liquidités disponibles</div>
        </div>

        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🎯</span>
            <div>
              <div className="text-sm text-slate-400">Objectif Mensuel</div>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(liquidites?.objectifMensuel || 200)}
              </div>
            </div>
          </div>
          <div className="text-sm text-slate-500">Cible mensuelle</div>
        </div>

        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">📈</span>
            <div>
              <div className="text-sm text-slate-400">Ce Mois</div>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(progressionMensuelle)}
              </div>
            </div>
          </div>
          <div className="text-sm text-slate-500">
            {liquidites?.objectifMensuel > 0 
              ? `${((progressionMensuelle / liquidites.objectifMensuel) * 100).toFixed(0)}% de l'objectif`
              : 'Aucun objectif'
            }
          </div>
        </div>
      </div>

      {/* Calculateur efficacité */}
      <LiquiditesCalculator 
        stockTotal={liquidites?.stockTotal || 0}
        objectifMensuel={liquidites?.objectifMensuel || 200}
        progression={liquidites?.progression || []}
      />

      {/* Stockage sécurisé */}
      <LiquiditesStockage 
        repartition={liquidites?.repartition || {}}
        stockTotal={liquidites?.stockTotal || 0}
      />

      {/* Analytics */}
      <LiquiditesAnalytics 
        liquidites={liquidites}
      />
    </div>
  );
};

export default LiquiditesSubTab;
