import React, { useState, useMemo } from 'react';
import { useTranslation } from '../../../utils/translations';
import { usePlanificateur } from '../../../hooks/usePlanificateur';
import { useToast } from '../../ui/Toast/ToastProvider';
import LoisirsBudget from './LoisirsBudget';
import AchatLoisirForm from './AchatLoisirForm';
import AchatsLoisirsList from './AchatsLoisirsList';
import SkeletonLoader from '../bourse/SkeletonLoader';

const PlanificationLoisirsSubTab = () => {
  const t = useTranslation();
  const { repartition, achatsLoisirs, loading } = usePlanificateur();
  const { showToast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAchat, setEditingAchat] = useState(null);

  const budgetLoisirs = useMemo(() => {
    return repartition?.loisirs || 0;
  }, [repartition]);

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

      {/* Liste Achats */}
      <AchatsLoisirsList
        achats={achatsLoisirs}
        budgetMensuel={budgetLoisirs}
        onEdit={(achat) => {
          setEditingAchat(achat);
          setShowAddForm(true);
        }}
      />
    </div>
  );
};

export default PlanificationLoisirsSubTab;
