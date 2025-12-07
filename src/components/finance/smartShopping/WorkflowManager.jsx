/**
 * Workflow Manager - Orchestrateur des 3 phases Smart Shopping
 * Planification → Exécution → Analytics avec transitions fluides
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Play, CheckCircle, BarChart3, ArrowRight, ArrowLeft, Save } from 'lucide-react';
import PlanningPhase from './PlanningPhase';
import ExecutionMode from './ExecutionMode';
import AnalyticsPhase from './AnalyticsPhase';
import { smartShoppingStorage } from '../../../services/finance/smartShoppingStorage';

const WorkflowManager = ({ listeId, onComplete, listes, onUpdateListe, onAddArticle, onUpdateArticle }) => {
  const [phase, setPhase] = useState('planning'); // planning | execution | analytics
  const [liste, setListe] = useState(null);
  const [workflowState, setWorkflowState] = useState({
    id: crypto.randomUUID(),
    listeId: listeId || null,
    phase: 'planning',
    dateDebut: Date.now(),
    dateFin: null,
    planning: {
      templateUtilise: null,
      budgetEstime: 0,
      optimizationsAppliquees: []
    },
    execution: {
      dateDebut: null,
      dateFin: null,
      articlesAchetes: 0,
      articlesNonTrouves: 0,
      articlesRemplaces: 0,
      ajoutsDynamiques: 0,
      budgetReel: 0
    },
    analytics: {
      ecarts: [],
      performance: {
        respectBudget: true,
        economiesRealisees: 0,
        articlesOublies: []
      },
      learnings: []
    }
  });

  // Charger liste existante ou créer nouvelle
  useEffect(() => {
    if (listeId) {
      const existingListe = listes?.find(l => l.id === listeId);
      if (existingListe) {
        setListe(existingListe);
        // Déterminer phase selon statut
        if (existingListe.statut === 'completee') {
          setPhase('analytics');
        } else if (existingListe.statut === 'en-cours') {
          setPhase('execution');
        } else {
          setPhase('planning');
        }
      }
    } else {
      // Nouvelle liste
      setListe({
        id: crypto.randomUUID(),
        nom: 'Nouvelle Liste',
        type: 'power-shopping',
        budget: 0,
        statut: 'prete',
        articles: [],
        dateCreation: Date.now(),
        dateModification: Date.now(),
        dateCompletion: null
      });
    }
  }, [listeId, listes]);

  // Sauvegarder workflow state
  const saveWorkflowState = useCallback(() => {
    try {
      const key = `workflow_${workflowState.id}`;
      localStorage.setItem(key, JSON.stringify(workflowState));
    } catch (error) {
      console.error('Error saving workflow state:', error);
    }
  }, [workflowState]);

  useEffect(() => {
    saveWorkflowState();
  }, [saveWorkflowState]);

  // ==========================================================================
  // PHASE TRANSITIONS
  // ==========================================================================

  const startPlanning = useCallback(() => {
    setPhase('planning');
    setWorkflowState(prev => ({
      ...prev,
      phase: 'planning'
    }));
  }, []);

  const validatePlanning = useCallback(() => {
    if (!liste || liste.articles.length === 0) {
      alert('Veuillez ajouter au moins un article à votre liste');
      return;
    }

    // Calculer budget estimé
    const budgetEstime = liste.articles.reduce((sum, a) => sum + (a.prixEstime * a.quantite), 0);

    // Mettre à jour liste
    const updatedListe = {
      ...liste,
      statut: 'en-cours',
      budget: budgetEstime,
      dateModification: Date.now()
    };

    setListe(updatedListe);
    if (onUpdateListe) {
      onUpdateListe(updatedListe.id, updatedListe);
    }

    // Transition vers exécution
    setPhase('execution');
    setWorkflowState(prev => ({
      ...prev,
      phase: 'execution',
      listeId: updatedListe.id,
      planning: {
        ...prev.planning,
        budgetEstime
      },
      execution: {
        ...prev.execution,
        dateDebut: Date.now()
      }
    }));
  }, [liste, onUpdateListe]);

  const startExecution = useCallback(() => {
    setPhase('execution');
    setWorkflowState(prev => ({
      ...prev,
      phase: 'execution',
      execution: {
        ...prev.execution,
        dateDebut: Date.now()
      }
    }));
  }, []);

  const completeExecution = useCallback(() => {
    if (!liste) return;

    // Calculer métriques exécution
    const articlesAchetes = liste.articles.filter(a => a.statut === 'achete').length;
    const articlesNonTrouves = liste.articles.filter(a => a.statut === 'pas-trouve').length;
    const articlesRemplaces = liste.articles.filter(a => a.statut === 'remplace').length;
    const budgetReel = liste.articles
      .filter(a => a.statut === 'achete' || a.statut === 'remplace')
      .reduce((sum, a) => sum + (a.prixReel || 0) * a.quantite, 0);

    // Mettre à jour liste
    const updatedListe = {
      ...liste,
      statut: 'completee',
      dateCompletion: Date.now(),
      dateModification: Date.now()
    };

    setListe(updatedListe);
    if (onUpdateListe) {
      onUpdateListe(updatedListe.id, updatedListe);
    }

    // Transition vers analytics
    setPhase('analytics');
    setWorkflowState(prev => ({
      ...prev,
      phase: 'analytics',
      execution: {
        ...prev.execution,
        dateFin: Date.now(),
        articlesAchetes,
        articlesNonTrouves,
        articlesRemplaces,
        budgetReel
      }
    }));
  }, [liste, onUpdateListe]);

  const finishAnalytics = useCallback(() => {
    setWorkflowState(prev => ({
      ...prev,
      dateFin: Date.now()
    }));

    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleUpdateListe = useCallback((updates) => {
    const updatedListe = {
      ...liste,
      ...updates,
      dateModification: Date.now()
    };
    setListe(updatedListe);
    
    if (onUpdateListe && updatedListe.id) {
      onUpdateListe(updatedListe.id, updatedListe);
    }
  }, [liste, onUpdateListe]);

  const handleApplyOptimization = useCallback((optimization) => {
    setWorkflowState(prev => ({
      ...prev,
      planning: {
        ...prev.planning,
        optimizationsAppliquees: [...prev.planning.optimizationsAppliquees, optimization.id]
      }
    }));
  }, []);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  if (!liste) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-slate-400">Chargement du workflow...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="workflow-manager space-y-6">
      {/* Progress Bar */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="relative">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-xl">
              <Play className="w-6 h-6 text-blue-400" />
            </div>
            Workflow: {liste.nom}
          </h3>

          {/* Stepper */}
          <div className="flex items-center justify-between mb-6">
            {[
              { id: 'planning', label: 'Planification', icon: '📋' },
              { id: 'execution', label: 'Exécution', icon: '🛒' },
              { id: 'analytics', label: 'Analytics', icon: '📊' }
            ].map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className={`flex flex-col items-center flex-1 ${
                  phase === step.id ? 'scale-110' : ''
                } transition-transform duration-300`}>
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-2 transition-all duration-300 ${
                    phase === step.id
                      ? 'bg-gradient-to-br from-blue-500/30 to-green-500/30 border-2 border-blue-400 shadow-lg shadow-blue-500/50'
                      : workflowState.phase === 'analytics' || 
                        (workflowState.phase === 'execution' && index === 0)
                      ? 'bg-green-500/20 border-2 border-green-500/50'
                      : 'bg-slate-700/50 border-2 border-slate-600/50'
                  }`}>
                    {phase === step.id && (
                      <span className="animate-pulse">{step.icon}</span>
                    )}
                    {phase !== step.id && (
                      <span className={
                        workflowState.phase === 'analytics' || 
                        (workflowState.phase === 'execution' && index === 0)
                          ? 'opacity-100'
                          : 'opacity-50'
                      }>{step.icon}</span>
                    )}
                  </div>
                  <div className={`text-sm font-semibold ${
                    phase === step.id ? 'text-blue-400' : 'text-slate-400'
                  }`}>
                    {step.label}
                  </div>
                </div>
                {index < 2 && (
                  <ArrowRight className={`w-6 h-6 mx-4 ${
                    (workflowState.phase === 'execution' && index === 0) ||
                    (workflowState.phase === 'analytics' && index === 1)
                      ? 'text-green-400'
                      : 'text-slate-600'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">
              {phase === 'planning' && 'Créez et optimisez votre liste de courses'}
              {phase === 'execution' && 'Cochez les articles au fur et à mesure'}
              {phase === 'analytics' && 'Analysez vos performances et apprenez'}
            </div>
            <button
              onClick={saveWorkflowState}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
              aria-label="Sauvegarder le workflow"
            >
              <Save className="w-4 h-4" />
              Sauvegarder
            </button>
          </div>
        </div>
      </div>

      {/* Phase Content */}
      <div className="phase-content">
        {phase === 'planning' && (
          <PlanningPhase
            liste={liste}
            onUpdateListe={handleUpdateListe}
            onValidate={validatePlanning}
            onApplyOptimization={handleApplyOptimization}
          />
        )}

        {phase === 'execution' && (
          <div className="space-y-4">
            <ExecutionMode
              listes={[liste]}
              onUpdateArticle={(listeId, articleId, updates) => {
                const updatedArticles = liste.articles.map(a =>
                  a.id === articleId ? { ...a, ...updates } : a
                );
                handleUpdateListe({ articles: updatedArticles });
                if (onUpdateArticle) {
                  onUpdateArticle(listeId, articleId, updates);
                }
              }}
              onAddArticle={(listeId, article) => {
                const newArticle = {
                  ...article,
                  id: crypto.randomUUID()
                };
                handleUpdateListe({
                  articles: [...liste.articles, newArticle]
                });
                if (onAddArticle) {
                  onAddArticle(listeId, newArticle);
                }
              }}
            />
            
            {/* Bouton Terminer */}
            <div className="flex justify-end">
              <button
                onClick={completeExecution}
                className="group px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white rounded-xl font-medium shadow-lg hover:shadow-green-500/50 hover:scale-105 transform transition-all duration-300"
              >
                <span className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Terminer les courses
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </div>
          </div>
        )}

        {phase === 'analytics' && (
          <AnalyticsPhase
            liste={liste}
            workflowState={workflowState}
            onFinish={finishAnalytics}
          />
        )}
      </div>

      {/* Navigation Buttons */}
      {phase !== 'analytics' && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
          {phase === 'execution' && (
            <button
              onClick={startPlanning}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à la planification
            </button>
          )}
          {phase === 'planning' && (
            <div></div>
          )}
          
          {phase === 'planning' && (
            <button
              onClick={validatePlanning}
              disabled={!liste || liste.articles.length === 0}
              className="group px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-500 hover:to-green-500 text-white rounded-xl font-medium shadow-lg hover:shadow-blue-500/50 hover:scale-105 transform transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <span className="flex items-center gap-2">
                Démarrer les courses
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkflowManager;
