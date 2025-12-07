import { useState, useMemo } from 'react';
import { useTranslation } from '../../../utils/translations';
import { usePlanificateur } from '../../../hooks/usePlanificateur';
import { useToast } from '../../ui/Toast/ToastProvider';
import { formatCurrency } from '../../../utils/planificateurUtils';
import LoisirsBudget from './LoisirsBudget';
import AchatLoisirForm from './AchatLoisirForm';
import LoisirsInterface from './LoisirsInterface';
import SkeletonLoader from '../bourse/SkeletonLoader';

const PlanificationLoisirsSubTab = () => {
  const t = useTranslation();
  const { repartition, achatsLoisirs, updateAchatLoisir, deleteAchatLoisir, loading } = usePlanificateur();
  const { showToast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAchat, setEditingAchat] = useState(null);

  const budgetLoisirs = useMemo(() => {
    return repartition?.loisirs || 0;
  }, [repartition]);

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

      {/* Budget Loisirs */}
      <LoisirsBudget budgetMensuel={budgetLoisirs} />

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
