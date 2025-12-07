/**
 * EpargneLoisirs - Workflow épargne intelligent avec notifications et suivi
 */

import React, { useState, useMemo } from 'react';
import { 
  Target, 
  Bell, 
  CheckCircle, 
  TrendingUp, 
  Award,
  Calendar,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { useTranslation } from '../../../utils/translations';
import Button from '../../ui/Button';

const EpargneLoisirs = ({ objectifs = [], onUpdateObjectif, onDeleteObjectif }) => {
  const t = useTranslation();
  const [selectedObjectif, setSelectedObjectif] = useState(null);
  const [showAnalyse, setShowAnalyse] = useState(false);

  // Calculer les jours restants
  const getJoursRestants = (date) => {
    const today = new Date();
    const targetDate = new Date(date);
    const diff = targetDate - today;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  // Déterminer le statut workflow
  const getWorkflowStatus = (objectif) => {
    if (!objectif.workflow) return 'creation';
    
    if (objectif.workflow.analyse) return 'complete';
    if (objectif.workflow.montantReel !== null) return 'montant-saisi';
    if (objectif.workflow.realisation) return 'realise';
    
    const joursRestants = getJoursRestants(objectif.date);
    if (joursRestants <= 1) return 'j-1';
    if (joursRestants <= 7) return 'j-7';
    
    return 'planifie';
  };

  // Grouper objectifs par statut
  const objectifsGroupes = useMemo(() => {
    const grouped = {
      'planifie': [],
      'j-7': [],
      'j-1': [],
      'realise': [],
      'montant-saisi': [],
      'complete': []
    };

    objectifs.forEach(obj => {
      const status = getWorkflowStatus(obj);
      grouped[status].push(obj);
    });

    return grouped;
  }, [objectifs]);

  // Workflow steps
  const workflowSteps = [
    { id: 'creation', label: 'Création', icon: Target, color: 'text-blue-400' },
    { id: 'planifie', label: 'Planifié', icon: Calendar, color: 'text-purple-400' },
    { id: 'j-7', label: 'J-7', icon: Bell, color: 'text-yellow-400' },
    { id: 'j-1', label: 'J-1', icon: AlertCircle, color: 'text-orange-400' },
    { id: 'realise', label: 'Réalisé', icon: CheckCircle, color: 'text-emerald-400' },
    { id: 'montant-saisi', label: 'Montant saisi', icon: DollarSign, color: 'text-cyan-400' },
    { id: 'complete', label: 'Analysé', icon: Award, color: 'text-pink-400' }
  ];

  // Marquer comme réalisé
  const handleMarquerRealise = async (objectif) => {
    const updated = {
      ...objectif,
      workflow: {
        ...objectif.workflow,
        realisation: new Date().toISOString()
      }
    };
    await onUpdateObjectif(updated);
  };

  // Saisir montant réel
  const handleSaisirMontant = async (objectif, montantReel) => {
    const ecart = montantReel - objectif.montant;
    const pourcentageEcart = ((ecart / objectif.montant) * 100).toFixed(1);
    
    const updated = {
      ...objectif,
      workflow: {
        ...objectif.workflow,
        montantReel,
        analyse: {
          ecart,
          pourcentageEcart,
          respecteBudget: ecart <= 0,
          date: new Date().toISOString()
        }
      }
    };
    
    await onUpdateObjectif(updated);
  };

  return (
    <div className="epargne-loisirs bg-slate-800/50 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Target size={24} className="text-emerald-400" />
          {t('finance.planificateur.3ans.epargne')}
        </h3>
        <div className="text-sm text-slate-400">
          {objectifs.length} objectif{objectifs.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Workflow visuel */}
      <div className="workflow-steps mb-8 bg-slate-900/50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          {workflowSteps.map((step, index) => {
            const Icon = step.icon;
            const count = objectifsGroupes[step.id]?.length || 0;
            
            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div className={`p-3 rounded-full bg-slate-800 ${step.color} mb-2 relative`}>
                    <Icon size={20} />
                    {count > 0 && (
                      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {count}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 text-center">{step.label}</div>
                </div>
                {index < workflowSteps.length - 1 && (
                  <div className="flex-1 h-0.5 bg-slate-700 mx-2 mt-6"></div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Liste objectifs par statut */}
      <div className="space-y-6">
        {/* Objectifs nécessitant attention (J-7, J-1, Réalisé) */}
        {['j-7', 'j-1', 'realise'].map(status => {
          const objectifsDuStatut = objectifsGroupes[status];
          if (objectifsDuStatut.length === 0) return null;

          const step = workflowSteps.find(s => s.id === status);
          const Icon = step.icon;

          return (
            <div key={status} className="status-group">
              <div className={`flex items-center gap-2 mb-3 ${step.color}`}>
                <Icon size={18} />
                <h4 className="font-semibold">{step.label}</h4>
                <span className="text-xs bg-slate-700 px-2 py-1 rounded">
                  {objectifsDuStatut.length}
                </span>
              </div>

              <div className="space-y-3">
                {objectifsDuStatut.map(obj => {
                  const joursRestants = getJoursRestants(obj.date);
                  
                  return (
                    <div
                      key={obj.id}
                      className="objectif-card bg-slate-700/50 border-2 border-slate-600 rounded-lg p-4 hover:border-slate-500 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h5 className="font-semibold text-white mb-1">{obj.titre}</h5>
                          <div className="flex items-center gap-4 text-sm text-slate-400">
                            <span>📅 {new Date(obj.date).toLocaleDateString('fr-FR')}</span>
                            <span>💰 {obj.montant.toLocaleString('fr-FR')}€</span>
                            {joursRestants >= 0 && (
                              <span className={joursRestants <= 1 ? 'text-orange-400 font-semibold' : ''}>
                                ⏰ J{joursRestants > 0 ? `-${joursRestants}` : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Actions selon statut */}
                      {status === 'j-7' && (
                        <div className="bg-yellow-900/20 border border-yellow-500/50 rounded p-3 text-sm">
                          <p className="text-yellow-300 mb-2">
                            🔔 Rappel : Achat prévu dans {joursRestants} jours
                          </p>
                          <Button
                            size="sm"
                            onClick={() => handleMarquerRealise(obj)}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            Marquer comme réalisé
                          </Button>
                        </div>
                      )}

                      {status === 'j-1' && (
                        <div className="bg-orange-900/20 border border-orange-500/50 rounded p-3 text-sm">
                          <p className="text-orange-300 mb-2">
                            ⚠️ Alerte : Achat prévu {joursRestants === 0 ? "aujourd'hui" : 'demain'} !
                          </p>
                          <Button
                            size="sm"
                            onClick={() => handleMarquerRealise(obj)}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            Marquer comme réalisé
                          </Button>
                        </div>
                      )}

                      {status === 'realise' && (
                        <div className="bg-emerald-900/20 border border-emerald-500/50 rounded p-3">
                          <p className="text-emerald-300 text-sm mb-3">
                            ✅ Achat réalisé le {new Date(obj.workflow.realisation).toLocaleDateString('fr-FR')}
                          </p>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              placeholder="Montant réel payé"
                              className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaisirMontant(obj, parseFloat(e.target.value));
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              onClick={(e) => {
                                const input = e.target.closest('.objectif-card').querySelector('input');
                                handleSaisirMontant(obj, parseFloat(input.value));
                              }}
                              className="bg-cyan-600 hover:bg-cyan-700"
                            >
                              Valider
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Objectifs planifiés */}
        {objectifsGroupes['planifie'].length > 0 && (
          <details className="status-group" open>
            <summary className="cursor-pointer text-purple-400 font-semibold mb-3 flex items-center gap-2">
              <Calendar size={18} />
              Objectifs planifiés ({objectifsGroupes['planifie'].length})
            </summary>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {objectifsGroupes['planifie'].map(obj => (
                <div
                  key={obj.id}
                  className="objectif-card bg-slate-700/30 border border-slate-600 rounded-lg p-3 text-sm"
                >
                  <div className="font-medium text-white mb-1">{obj.titre}</div>
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>📅 {new Date(obj.date).toLocaleDateString('fr-FR')}</span>
                    <span className="font-semibold text-white">{obj.montant.toLocaleString('fr-FR')}€</span>
                  </div>
                </div>
              ))}
            </div>
          </details>
        )}

        {/* Objectifs complétés avec analyse */}
        {objectifsGroupes['complete'].length > 0 && (
          <details className="status-group">
            <summary className="cursor-pointer text-pink-400 font-semibold mb-3 flex items-center gap-2">
              <Award size={18} />
              Objectifs analysés ({objectifsGroupes['complete'].length})
            </summary>
            <div className="space-y-3">
              {objectifsGroupes['complete'].map(obj => {
                const analyse = obj.workflow.analyse;
                const respecteBudget = analyse.respecteBudget;
                
                return (
                  <div
                    key={obj.id}
                    className={`objectif-card border-2 rounded-lg p-4 ${
                      respecteBudget
                        ? 'bg-emerald-900/20 border-emerald-500/50'
                        : 'bg-red-900/20 border-red-500/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h5 className="font-semibold text-white mb-1">{obj.titre}</h5>
                        <div className="text-sm text-slate-400">
                          {new Date(obj.date).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      <div className={`text-2xl ${respecteBudget ? 'text-emerald-400' : 'text-red-400'}`}>
                        {respecteBudget ? '✅' : '⚠️'}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <div className="text-slate-400 text-xs mb-1">Prévu</div>
                        <div className="font-semibold text-white">
                          {obj.montant.toLocaleString('fr-FR')}€
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-xs mb-1">Réel</div>
                        <div className="font-semibold text-white">
                          {obj.workflow.montantReel.toLocaleString('fr-FR')}€
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 text-xs mb-1">Écart</div>
                        <div className={`font-semibold ${
                          analyse.ecart <= 0 ? 'text-emerald-400' : 'text-red-400'
                        }`}>
                          {analyse.ecart > 0 ? '+' : ''}{analyse.ecart.toLocaleString('fr-FR')}€
                          <span className="text-xs ml-1">({analyse.pourcentageEcart}%)</span>
                        </div>
                      </div>
                    </div>

                    {!respecteBudget && (
                      <div className="mt-3 text-xs text-red-300 bg-red-900/30 rounded p-2">
                        💡 Conseil : Budget dépassé de {Math.abs(analyse.ecart)}€. 
                        Ajustez vos prévisions futures.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </details>
        )}
      </div>

      {/* Message si aucun objectif */}
      {objectifs.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <Target size={48} className="mx-auto mb-3 opacity-50" />
          <p>Aucun objectif d'épargne</p>
          <p className="text-sm mt-2">Créez des objectifs dans la section Planification Loisirs</p>
        </div>
      )}
    </div>
  );
};

export default EpargneLoisirs;
