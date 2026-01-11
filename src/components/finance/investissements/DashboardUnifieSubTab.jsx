import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from '../../../utils/translations';
import { useInvestissements } from '../../../hooks/useInvestissements';
import { investissementsAlerts } from '../../../services/finance/investissementsAlerts';
import { useOrPrice } from '../../../hooks/useOrPrice';
import PredictiveModeling from './PredictiveModeling';
import AllocationDragDrop from './AllocationDragDrop';
import SimulationLab from './SimulationLab';
import InvestissementsModes, { MODES } from './InvestissementsModes';
import SkeletonLoader from '../bourse/SkeletonLoader';

const DashboardUnifieSubTab = () => {
  const t = useTranslation();
  const { or, liquidites, bourseCrypto, calculateAllocation, loading } = useInvestissements();
  const [alerts, setAlerts] = useState([]);
  const [currentMode, setCurrentMode] = useState(MODES.OVERVIEW);
  
  // ✅ SOLUTION 2.1/2.9 : Utiliser hook avec cache partagé
  const { price: prixOr, loading: priceLoading } = useOrPrice({
    autoRefresh: true,
    refreshInterval: 60 * 60 * 1000, // 1h
    initialLoad: true
  });

  // ✅ FIX: Utiliser useMemo pour allocation (évite recalculs et boucles infinies)
  // calculateAllocation est déjà mémorisé avec useCallback dans useInvestissements
  // On utilise useMemo ici pour éviter que l'objet allocation change de référence à chaque render
  // calculateAllocation change seulement si or, liquidites, bourseCrypto ou prixOr changent
  const allocation = useMemo(() => {
    return calculateAllocation();
  }, [calculateAllocation]);

  // ✅ FIX: Générer alertes avec useMemo (évite recalculs et boucles infinies)
  // Retirer calculateAllocation des dépendances (fonction, ne devrait pas être dans deps)
  // Utiliser allocation directement (déjà mémorisé ci-dessus)
  const alertsMemo = useMemo(() => {
    if (!loading && allocation) {
      const data = { or, liquidites, bourseCrypto, allocation };
      return investissementsAlerts.analyze(data);
    }
    return [];
  }, [or, liquidites, bourseCrypto, allocation, loading]);

  // ✅ FIX: Synchroniser alertsMemo avec state seulement si différent
  useEffect(() => {
    setAlerts(alertsMemo);
  }, [alertsMemo]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // ✅ FIX: Ne bloquer que si vraiment en chargement (pas si prix or seulement)
  // Le prix or peut utiliser un fallback et ne pas bloquer l'affichage
  if (loading) {
    return <SkeletonLoader />;
  }

  // ✅ FIX: Afficher même si allocation est null (peut arriver si données en chargement)
  // calculateAllocation peut retourner null si données incomplètes, mais on peut afficher quand même
  if (!or || !liquidites || !bourseCrypto) {
    return (
      <div className="text-center py-12 text-slate-400">
        <div className="text-6xl mb-4">📊</div>
        <p className="text-lg mb-2">Aucune donnée disponible</p>
        <p className="text-sm">Commencez par ajouter vos investissements</p>
      </div>
    );
  }

  // Utiliser allocation calculée directement (déjà calculé ci-dessus)
  const allocationData = allocation;
  
  // ✅ FIX: Gérer cas où allocation est null (ne devrait plus arriver avec le fix dans useInvestissements)
  // Mais garder cette vérification pour robustesse
  if (!allocationData) {
    // Si données existent mais allocation null, c'est un problème de calcul
    // Afficher message d'erreur au lieu de rester bloqué
    return (
      <div className="text-center py-12 text-slate-400">
        <div className="text-6xl mb-4">📊</div>
        <p className="text-lg mb-2">Impossible de calculer l'allocation</p>
        <p className="text-sm">Vérifiez vos données d'investissements</p>
      </div>
    );
  }
  
  // ✅ FIX: Gérer cas patrimoineTotal === 0 (pas encore d'investissements)
  if (allocationData.total === 0) {
    return (
      <div className="text-center py-12 text-slate-400">
        <div className="text-6xl mb-4">📊</div>
        <p className="text-lg mb-2 mb-4">Aucun investissement enregistré</p>
        <p className="text-sm mb-6">Commencez par ajouter vos investissements :</p>
        <div className="flex flex-wrap gap-4 justify-center">
          <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 text-left">
            <div className="text-2xl mb-2">🥇</div>
            <div className="text-sm font-medium text-white mb-1">Or Physique</div>
            <div className="text-xs text-slate-400">Ajoutez vos acquisitions d'or</div>
          </div>
          <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 text-left">
            <div className="text-2xl mb-2">💰</div>
            <div className="text-sm font-medium text-white mb-1">Liquidités</div>
            <div className="text-xs text-slate-400">Enregistrez vos liquidités</div>
          </div>
          <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 text-left">
            <div className="text-2xl mb-2">📈</div>
            <div className="text-sm font-medium text-white mb-1">Bourse & Crypto</div>
            <div className="text-xs text-slate-400">Ajoutez vos positions</div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ FIX: Utiliser prixOr avec fallback si non chargé
  const prixOrActuel = prixOr || 65; // Fallback si prix or pas encore chargé
  const valorisationOr = (or?.stockActuel || 0) * prixOrActuel;
  const totalLiquidites = liquidites?.stockTotal || 0;
  const valorisationBourseCrypto = bourseCrypto?.positions?.reduce((sum, pos) => 
    sum + (pos.montant || 0), 0) || 0;

  return (
    <InvestissementsModes currentMode={currentMode} onModeChange={setCurrentMode}>
      {(mode) => (
        <div className="dashboard-unifie space-y-6">
          <h3 className="text-2xl font-bold text-white mb-6">Patrimoine Diversifié - Vue 360°</h3>

      {/* Vue d'ensemble */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">🥇</span>
            <div>
              <div className="text-sm text-slate-400">Or Physique</div>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(valorisationOr)}
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            {or?.stockActuel || 0}g • {allocationData.or.toFixed(1)}% du patrimoine
          </div>
        </div>

        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">💰</span>
            <div className="flex-1">
              <div className="text-sm text-slate-400">Liquidités</div>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(totalLiquidites)}
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            {allocationData.liquidites.toFixed(1)}% du patrimoine
          </div>
          {liquidites?.objectifMensuel > 0 && (
            <div className="text-xs text-blue-400 mt-1">
              Objectif: {formatCurrency(liquidites.objectifMensuel)}/mois
            </div>
          )}
        </div>

        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">📈</span>
            <div className="flex-1">
              <div className="text-sm text-slate-400">Bourse & Crypto</div>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(valorisationBourseCrypto)}
              </div>
            </div>
          </div>
          <div className="text-xs text-slate-500">
            {allocationData.bourseCrypto.toFixed(1)}% du patrimoine
          </div>
          {bourseCrypto?.positions && bourseCrypto.positions.length > 0 && (
            <div className="text-xs text-blue-400 mt-1">
              {bourseCrypto.positions.length} position{bourseCrypto.positions.length > 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Total patrimoine */}
      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/50 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-400 mb-1">Patrimoine Total</div>
            <div className="text-4xl font-bold text-white">
              {formatCurrency(allocationData.total)}
            </div>
          </div>
          <span className="text-5xl">💎</span>
        </div>
      </div>

      {/* Allocation actuelle vs cible */}
      <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-white mb-4">🎯 Allocation Actuelle vs Cible</h4>
        <div className="space-y-4">
          {[
            { nom: 'Or', actuel: allocationData.or, cible: 30, couleur: '#eab308', icon: '🥇' },
            { nom: 'Cash', actuel: allocationData.liquidites, cible: 15, couleur: '#10b981', icon: '💰' },
            { nom: 'Risqué', actuel: allocationData.bourseCrypto, cible: 55, couleur: '#3b82f6', icon: '📈' }
          ].map((item, index) => {
            const ecart = item.actuel - item.cible;
            const tolerance = item.nom === 'Or' ? 2 : item.nom === 'Cash' ? 3 : 1;
            const statut = Math.abs(ecart) <= tolerance ? 'ok' : ecart > 0 ? 'sur' : 'sous';
            
            return (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-300 flex items-center gap-2">
                    <span>{item.icon}</span>
                    <span>{item.nom}</span>
                  </span>
                  <span className="text-sm font-semibold text-white">
                    {item.actuel.toFixed(1)}% 
                    <span className={`ml-2 ${
                      statut === 'ok' ? 'text-green-400' :
                      statut === 'sur' ? 'text-yellow-400' : 'text-blue-400'
                    }`}>
                      {statut === 'ok' ? '✓' : statut === 'sur' ? '⚠' : '↓'} Cible {item.cible}% {statut === 'ok' ? `±${tolerance}%` : ''}
                    </span>
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{ 
                      width: `${Math.min(item.actuel, 100)}%`,
                      backgroundColor: item.couleur
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions recommandées */}
      {alerts.length > 0 && (
        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-white mb-4">🚨 Actions Recommandées</h4>
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alert, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  alert.priority === 'critical' 
                    ? 'bg-red-900/30 border-red-500/50' :
                    alert.priority === 'high'
                    ? 'bg-orange-900/30 border-orange-500/50' :
                    alert.priority === 'medium'
                    ? 'bg-yellow-900/30 border-yellow-500/50' :
                    'bg-blue-900/30 border-blue-500/50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className={`text-sm font-medium mb-1 ${
                      alert.priority === 'critical' ? 'text-red-300' :
                      alert.priority === 'high' ? 'text-orange-300' :
                      alert.priority === 'medium' ? 'text-yellow-300' :
                      'text-blue-300'
                    }`}>
                      {alert.message}
                    </div>
                    {alert.suggestion && (
                      <div className="text-xs text-slate-300 mt-1">
                        💡 {alert.suggestion}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

          {/* Contenu selon le mode */}
          {mode === MODES.OVERVIEW && (
            <>
              {/* Modélisation prédictive */}
              <PredictiveModeling />
            </>
          )}

          {mode === MODES.DETAIL && (
            <>
              {/* Répartition drag & drop */}
              <AllocationDragDrop />
            </>
          )}

          {mode === MODES.SIMULATION && (
            <>
              {/* Laboratoire simulation */}
              <SimulationLab />
            </>
          )}

          {mode === MODES.HISTORY && (
            <>
              {/* Analytics historiques */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
                <h4 className="text-lg font-semibold text-white mb-4">📈 Historique & Analytics</h4>
                <div className="text-center py-8 text-slate-400">
                  Fonctionnalité en développement
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </InvestissementsModes>
  );
};

export default DashboardUnifieSubTab;

