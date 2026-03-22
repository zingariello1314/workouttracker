import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from '../../../utils/translations';
import { usePlanificateur } from '../../../hooks/usePlanificateur';
import { useToast } from '../../ui/Toast/ToastProvider';
import { formatCurrency } from '../../../utils/planificateurUtils';
import LoisirsBudget from './LoisirsBudget';
import AchatLoisirForm from './AchatLoisirForm';
import LoisirsInterface from './LoisirsInterface';
import SkeletonLoader from '../bourse/SkeletonLoader';

const CAT_LOISIRS_ID = 'cat_loisirs';

/**
 * Ajuste cat_loisirs pour que la somme des catégories type « loisirs » = totalSouhaite
 * (les autres lignes loisirs personnalisées restent inchangées).
 */
function repartitionWithBudgetLoisirs(repartition, totalSouhaite) {
  const target = Math.max(0, Number(totalSouhaite) || 0);
  const prevCats = repartition?.categories ? [...repartition.categories] : [];
  const autresLoisirs = prevCats
    .filter((c) => c && c.type === 'loisirs' && c.id !== CAT_LOISIRS_ID)
    .reduce((s, c) => s + (Number(c.montant) || 0), 0);
  const montantPrincipal = Math.max(0, target - autresLoisirs);

  const idx = prevCats.findIndex((c) => c && c.id === CAT_LOISIRS_ID);
  if (idx >= 0) {
    prevCats[idx] = { ...prevCats[idx], montant: montantPrincipal };
  } else {
    prevCats.push({
      id: CAT_LOISIRS_ID,
      key: 'loisirs',
      label: 'Loisirs',
      emoji: '🎮',
      type: 'loisirs',
      subType: 'loisirs',
      order: 5,
      montant: montantPrincipal,
      fixed: true
    });
  }
  return {
    ...(repartition || { id: 'current' }),
    id: repartition?.id || 'current',
    categories: prevCats,
    updatedAt: new Date().toISOString()
  };
}

const PlanificationLoisirsSubTab = () => {
  const t = useTranslation();
  const {
    repartition,
    achatsLoisirs,
    updateAchatLoisir,
    deleteAchatLoisir,
    updateRepartition,
    getTotalByType,
    loading
  } = usePlanificateur();
  const { showToast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAchat, setEditingAchat] = useState(null);
  const [budgetSaving, setBudgetSaving] = useState(false);

  // V2 : pas de champ repartition.loisirs — total des catégories type loisirs (dont cat_loisirs)
  const budgetLoisirs = useMemo(() => getTotalByType('loisirs'), [repartition, getTotalByType]);

  const handleBudgetLoisirsChange = useCallback(
    async (newMontant) => {
      if (!repartition) {
        showToast('Répartition non chargée', 'error');
        return;
      }
      setBudgetSaving(true);
      try {
        const next = repartitionWithBudgetLoisirs(repartition, newMontant);
        await updateRepartition(next);
        showToast('Budget loisirs mis à jour (répartition salaire synchronisée)', 'success');
      } catch (e) {
        showToast('Impossible de mettre à jour le budget', 'error');
        throw e;
      } finally {
        setBudgetSaving(false);
      }
    },
    [repartition, updateRepartition, showToast]
  );

  const handleReorder = async (newOrder) => {
    // Mettre à jour l'ordre des achats
    try {
      for (let i = 0; i < newOrder.length; i++) {
        await updateAchatLoisir({ ...newOrder[i], ordre: i });
      }
      showToast('Ordre mis à jour', 'success');
    } catch (error) {
      showToast('Erreur lors de la mise à jour', 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAchatLoisir(id);
      showToast('Achat supprimé', 'success');
    } catch (error) {
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  if (loading) {
    return <SkeletonLoader />;
  }

  return (
    <div className="planification-loisirs-sub-tab space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-white">
          {t('finance.planificateur.loisirs.title')}
        </h3>
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingAchat(null);
          }}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <span>➕</span>
          <span>Ajouter Achat</span>
        </button>
      </div>

      {/* Budget Loisirs — même total que Répartition salaire ; modifiable ici ou dans l’autre onglet */}
      <LoisirsBudget
        budgetMensuel={budgetLoisirs}
        onBudgetChange={handleBudgetLoisirsChange}
        saving={budgetSaving}
      />

      {/* Formulaire Ajout/Modification */}
      {showAddForm && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <AchatLoisirForm
            achat={editingAchat}
            budgetMensuel={budgetLoisirs}
            onSave={() => {
              setShowAddForm(false);
              setEditingAchat(null);
              showToast('Achat enregistré', 'success');
            }}
            onCancel={() => {
              setShowAddForm(false);
              setEditingAchat(null);
            }}
          />
        </div>
      )}

      {/* Interface Avancée */}
      <LoisirsInterface
        achats={achatsLoisirs}
        budgetMensuel={budgetLoisirs}
        onReorder={handleReorder}
        onEdit={(achat) => {
          setEditingAchat(achat);
          setShowAddForm(true);
        }}
        onDelete={handleDelete}
        formatCurrency={formatCurrency}
      />
    </div>
  );
};

export default PlanificationLoisirsSubTab;
