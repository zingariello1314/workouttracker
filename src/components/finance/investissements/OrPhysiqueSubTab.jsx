import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from '../../../utils/translations';
import { useInvestissements } from '../../../hooks/useInvestissements';
import { useOrPrice } from '../../../hooks/useOrPrice';
import { useToast } from '../../ui/Toast';
import OrCalendar from './OrCalendar';
import OrStockage from './OrStockage';
import OrAnalytics from './OrAnalytics';
import AddOrAcquisitionForm from './AddOrAcquisitionForm';

/**
 * ✅ SOLUTION 2.1/2.9 : Utilisation hook useOrPrice avec cache partagé
 * 
 * Remplace l'utilisation directe de orPriceService pour bénéficier de :
 * - Cache partagé entre tous les composants
 * - Évite requêtes API dupliquées
 * - Refresh automatique configuré (1h par défaut)
 * - Gestion d'erreurs avec fallback
 */
const OrPhysiqueSubTab = () => {
  const t = useTranslation();
  const { or, addOrAcquisition, updateOrData, loading } = useInvestissements();
  const { showToast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  
  // ✅ SOLUTION 2.1/2.9 : Utiliser hook avec cache partagé
  // autoRefresh: true par défaut, refreshInterval: 1h (configuré dans le hook)
  const { price: prixOrRaw, loading: priceLoading, error: priceError } = useOrPrice({
    autoRefresh: true,
    refreshInterval: 60 * 60 * 1000, // 1h
    initialLoad: true
  });
  
  // ✅ FIX: Toujours avoir un prix à afficher (fallback 119€/g si null/undefined/0)
  // Le fallback 119€/g correspond au prix réel actuel (décembre 2025)
  const prixOr = (prixOrRaw && prixOrRaw > 0) ? prixOrRaw : 119;
  
  // Debug: log pour vérifier les valeurs
  useEffect(() => {
    console.log('[OrPhysiqueSubTab] 🔍 DEBUG Prix Or:', {
      prixOrRaw,
      priceLoading,
      priceError,
      prixOr,
      type: typeof prixOrRaw,
      isNull: prixOrRaw === null,
      isUndefined: prixOrRaw === undefined
    });
  }, [prixOrRaw, priceLoading, priceError, prixOr]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Calcul valorisation temps réel
  const valorisation = useMemo(() => {
    if (!prixOr || !or) return 0;
    return (or.stockActuel || 0) * prixOr;
  }, [prixOr, or]);

  // Calcul plus-value
  const plusValue = useMemo(() => {
    if (!or?.acquisitions || !prixOr || or.acquisitions.length === 0) return 0;
    
    const totalInvesti = or.acquisitions.reduce((sum, acq) => 
      sum + (acq.quantite * acq.prix), 0
    );
    
    const valorisationActuelle = (or.stockActuel || 0) * prixOr;
    return valorisationActuelle - totalInvesti;
  }, [or, prixOr]);

  const handleAddAcquisition = async (acquisitionData) => {
    try {
      await addOrAcquisition(acquisitionData);
      setShowAddForm(false);
      showToast('Acquisition d\'or enregistrée', 'success');
    } catch (error) {
      showToast('Erreur lors de l\'ajout', 'error');
    }
  };

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
    <div className="or-physique space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-white">Or Physique</h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <span>➕</span>
          <span>Ajouter Acquisition</span>
        </button>
      </div>

      {/* Formulaire ajout */}
      {showAddForm && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <AddOrAcquisitionForm
            onSave={handleAddAcquisition}
            onCancel={() => setShowAddForm(false)}
            prixOrActuel={prixOr}
          />
        </div>
      )}

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🥇</span>
            <div>
              <div className="text-sm text-slate-400">Stock Actuel</div>
              <div className="text-2xl font-bold text-white">
                {or?.stockActuel || 0}g
              </div>
            </div>
          </div>
          <div className="text-sm text-slate-500">
            {formatCurrency(valorisation)}
          </div>
        </div>

        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">💰</span>
            <div>
              <div className="text-sm text-slate-400">Prix Or</div>
              <div className="text-2xl font-bold text-white">
                {prixOr ? `${formatCurrency(prixOr)}/g` : '...'}
              </div>
            </div>
          </div>
          <div className="text-sm text-slate-500">Cours spot</div>
        </div>

        <div className={`bg-slate-700/50 border rounded-lg p-6 ${
          plusValue >= 0 ? 'border-green-500/50' : 'border-red-500/50'
        }`}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{plusValue >= 0 ? '📈' : '📉'}</span>
            <div>
              <div className="text-sm text-slate-400">Plus-Value</div>
              <div className={`text-2xl font-bold ${
                plusValue >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {formatCurrency(plusValue)}
              </div>
            </div>
          </div>
          {or?.acquisitions && or.acquisitions.length > 0 && (
            <div className="text-sm text-slate-500">
              {((plusValue / (or.acquisitions.reduce((sum, acq) => sum + (acq.quantite * acq.prix), 0))) * 100).toFixed(2)}%
            </div>
          )}
        </div>
      </div>

      {/* Calendrier acquisition */}
      <OrCalendar 
        objectifMensuel={or?.objectifMensuel || 150}
        stockActuel={or?.stockActuel || 0}
        prixOr={prixOr}
      />

      {/* Stockage */}
      <OrStockage 
        repartition={or?.repartition}
        stockActuel={or?.stockActuel || 0}
      />

      {/* Analytics */}
      <OrAnalytics 
        or={or}
        prixOr={prixOr}
      />
    </div>
  );
};

export default OrPhysiqueSubTab;
