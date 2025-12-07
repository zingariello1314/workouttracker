import React, { useState } from 'react';
import { useTranslation } from '../../../utils/translations';
import { usePlanificateur } from '../../../hooks/usePlanificateur';
import Timeline3Ans from './Timeline3Ans';
import ChargesFixes from './ChargesFixes';
import EpargneLoisirs from './EpargneLoisirs';
import { Plus } from 'lucide-react';
import Button from '../../ui/Button';

const Planification3AnsSubTab = () => {
  const t = useTranslation();
  const { 
    repartition, 
    objectifs, 
    chargesFixes,
    achatsLoisirs,
    updateObjectif,
    deleteObjectif,
    addObjectif,
    loading 
  } = usePlanificateur();

  const [showAddObjectif, setShowAddObjectif] = useState(false);
  const [selectedObjectif, setSelectedObjectif] = useState(null);

  // Convertir achats loisirs en objectifs pour la timeline
  const objectifsTimeline = React.useMemo(() => {
    return achatsLoisirs.map(achat => ({
      id: achat.id,
      titre: achat.nom,
      montant: achat.prix,
      date: achat.moisCible ? `${achat.moisCible}-15` : new Date().toISOString(),
      moisCible: achat.moisCible,
      workflow: achat.workflow || {
        creation: achat.dateCreation || new Date().toISOString(),
        notificationJ7: null,
        notificationJ1: null,
        realisation: null,
        montantReel: null,
        analyse: null
      }
    }));
  }, [achatsLoisirs]);

  const budgetLoisirs = repartition?.loisirs || 0;

  const handleObjectifClick = (objectif) => {
    setSelectedObjectif(objectif);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-slate-400">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="planification-3ans-sub-tab space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white mb-2">
            {t('finance.planificateur.3ans.title')}
          </h3>
          <p className="text-slate-400 text-sm">
            Visualisez vos objectifs sur 3 ans et suivez votre épargne intelligente
          </p>
        </div>
      </div>

      {/* Timeline interactive */}
      <Timeline3Ans
        objectifs={objectifsTimeline}
        chargesFixes={chargesFixes}
        budgetLoisirs={budgetLoisirs}
        onObjectifClick={handleObjectifClick}
      />

      {/* Charges fixes */}
      <ChargesFixes
        chargesFixes={chargesFixes}
        repartition={repartition}
      />

      {/* Épargne loisirs avec workflow */}
      <EpargneLoisirs
        objectifs={objectifsTimeline}
        onUpdateObjectif={async (updated) => {
          // Mettre à jour l'achat loisir correspondant
          const achat = achatsLoisirs.find(a => a.id === updated.id);
          if (achat) {
            await updateObjectif({
              ...achat,
              workflow: updated.workflow
            });
          }
        }}
        onDeleteObjectif={deleteObjectif}
      />

      {/* Statistiques globales */}
      <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-lg p-6">
        <h4 className="text-lg font-bold text-white mb-4">📊 Vue d'ensemble</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400">
              {objectifsTimeline.length}
            </div>
            <div className="text-sm text-slate-400 mt-1">Objectifs totaux</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-400">
              {objectifsTimeline.filter(o => o.workflow?.realisation).length}
            </div>
            <div className="text-sm text-slate-400 mt-1">Réalisés</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-400">
              {objectifsTimeline.filter(o => {
                const joursRestants = Math.ceil((new Date(o.date) - new Date()) / (1000 * 60 * 60 * 24));
                return joursRestants <= 7 && joursRestants >= 0 && !o.workflow?.realisation;
              }).length}
            </div>
            <div className="text-sm text-slate-400 mt-1">À venir (7j)</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400">
              {budgetLoisirs.toLocaleString('fr-FR')}€
            </div>
            <div className="text-sm text-slate-400 mt-1">Budget mensuel</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Planification3AnsSubTab;



