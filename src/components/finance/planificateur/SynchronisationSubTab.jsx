import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../../../utils/translations';
import { usePlanificateur } from '../../../hooks/usePlanificateur';
import PlanificateurAnalytics from './PlanificateurAnalytics';
import SyncInterface from './SyncInterface';

const SynchronisationSubTab = () => {
  const t = useTranslation();
  const { 
    repartition, 
    achatsLoisirs,
    objectifs,
    loading 
  } = usePlanificateur();

  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error
  const [lastSync, setLastSync] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const previousRepartition = useRef(null);

  // Surveiller les changements de répartition
  useEffect(() => {
    if (repartition && previousRepartition.current) {
      // Détecter changements
      const hasChanges = JSON.stringify(repartition) !== JSON.stringify(previousRepartition.current);
      
      if (hasChanges) {
        setSyncStatus('syncing');
        
        // Générer notifications
        const newNotifications = [];
        const prev = previousRepartition.current;
        
        if (repartition.loisirs !== prev.loisirs) {
          newNotifications.push({
            id: Date.now() + 1,
            type: 'info',
            icon: '🎮',
            message: `Budget loisirs modifié: ${prev.loisirs}€ → ${repartition.loisirs}€`,
            timestamp: new Date()
          });
        }
        
        if (repartition.investissementOr !== prev.investissementOr) {
          newNotifications.push({
            id: Date.now() + 2,
            type: 'success',
            icon: '🥇',
            message: `DCA Or modifié: ${prev.investissementOr}€ → ${repartition.investissementOr}€`,
            timestamp: new Date()
          });
        }
        
        if (repartition.investissementBourse !== prev.investissementBourse) {
          newNotifications.push({
            id: Date.now() + 3,
            type: 'success',
            icon: '📈',
            message: `DCA Bourse modifié: ${prev.investissementBourse}€ → ${repartition.investissementBourse}€`,
            timestamp: new Date()
          });
        }
        
        setNotifications(prev => [...newNotifications, ...prev].slice(0, 10));
        
        // Simuler synchronisation
        setTimeout(() => {
          setSyncStatus('success');
          setLastSync(new Date());
          
          setTimeout(() => {
            setSyncStatus('idle');
          }, 3000);
        }, 500);
      }
    }
    
    previousRepartition.current = repartition;
  }, [repartition]);

  // Convertir achats loisirs en objectifs
  const objectifsTimeline = React.useMemo(() => {
    return achatsLoisirs.map(achat => ({
      id: achat.id,
      titre: achat.nom,
      montant: achat.prix,
      date: achat.moisCible ? `${achat.moisCible}-15` : new Date().toISOString(),
      moisCible: achat.moisCible,
      workflow: achat.workflow || {}
    }));
  }, [achatsLoisirs]);

  const handleDismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse text-slate-400">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="synchronisation-sub-tab space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold text-white mb-2">
          {t('finance.planificateur.sync.title')}
        </h3>
        <p className="text-slate-400 text-sm">
          Synchronisation temps réel et analytics avancées
        </p>
      </div>

      {/* Interface Révolutionnaire */}
      <SyncInterface
        repartition={repartition}
        notifications={notifications}
        onDismissNotification={handleDismissNotification}
      />

      {/* Analytics */}
      <PlanificateurAnalytics
        repartition={repartition}
        achatsLoisirs={achatsLoisirs}
        objectifs={objectifsTimeline}
        historique={[]}
      />
    </div>
  );
};

export default SynchronisationSubTab;




