/**
 * Planning Phase - Interface de planification intelligente
 * Template selection + Liste building + Budget validation + Optimizations
 */

import { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, ShoppingBag, Zap, DollarSign, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../../utils/planificateurUtils';
import BudgetOptimizer from './BudgetOptimizer';

const TEMPLATES = [
  {
    id: 'power-shopping',
    nom: 'Power Shopping',
    icon: '🛒',
    description: 'Courses complètes de la semaine',
    articles: [
      { nom: 'Pain', quantite: 2, prixEstime: 1.20, categorie: 'Boulangerie' },
      { nom: 'Lait', quantite: 2, prixEstime: 1.50, categorie: 'Frais' },
      { nom: 'Œufs', quantite: 1, prixEstime: 3.00, categorie: 'Frais' },
      { nom: 'Pâtes', quantite: 2, prixEstime: 1.00, categorie: 'Epicerie' },
      { nom: 'Riz', quantite: 1, prixEstime: 2.50, categorie: 'Epicerie' }
    ]
  },
  {
    id: 'quick-run',
    nom: 'Quick Run',
    icon: '⚡',
    description: 'Essentiels rapides',
    articles: [
      { nom: 'Pain', quantite: 1, prixEstime: 1.20, categorie: 'Boulangerie' },
      { nom: 'Lait', quantite: 1, prixEstime: 1.50, categorie: 'Frais' },
      { nom: 'Fruits', quantite: 1, prixEstime: 3.00, categorie: 'Frais' }
    ]
  },
  {
    id: 'mission-speciale',
    nom: 'Mission Spéciale',
    icon: '🎯',
    description: 'Articles spécifiques',
    articles: []
  },
  {
    id: 'promo-hunter',
    nom: 'Promo Hunter',
    icon: '🏷️',
    description: 'Profiter des promos',
    articles: []
  }
];

const PlanningPhase = ({ liste, onUpdateListe, onValidate, onApplyOptimization }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editingArticle, setEditingArticle] = useState(null);
  const [newArticle, setNewArticle] = useState({
    nom: '',
    quantite: 1,
    prixEstime: 0,
    categorie: 'Epicerie'
  });
  const [showOptimizer, setShowOptimizer] = useState(false);

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================

  const budgetEstime = useMemo(() => {
    if (!liste || !liste.articles) return 0;
    return liste.articles.reduce((sum, a) => sum + (a.prixEstime * a.quantite), 0);
  }, [liste]);

  const budgetStatus = useMemo(() => {
    if (!liste.budget || liste.budget === 0) return 'none';
    const ratio = budgetEstime / liste.budget;
    if (ratio > 1.1) return 'critical';
    if (ratio > 0.9) return 'warning';
    return 'ok';
  }, [budgetEstime, liste]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    
    const articlesWithIds = template.articles.map(a => ({
      ...a,
      id: crypto.randomUUID(),
      statut: 'a-acheter',
      prixReel: null
    }));

    onUpdateListe({
      nom: template.nom,
      type: template.id,
      articles: articlesWithIds,
      budget: articlesWithIds.reduce((sum, a) => sum + (a.prixEstime * a.quantite), 0)
    });
  };

  const handleAddArticle = () => {
    if (!newArticle.nom || newArticle.prixEstime <= 0) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    const article = {
      ...newArticle,
      id: crypto.randomUUID(),
      statut: 'a-acheter',
      prixReel: null
    };

    onUpdateListe({
      articles: [...(liste.articles || []), article]
    });

    setNewArticle({
      nom: '',
      quantite: 1,
      prixEstime: 0,
      categorie: 'Epicerie'
    });
  };

  const handleUpdateArticle = (articleId, updates) => {
    const updatedArticles = liste.articles.map(a =>
      a.id === articleId ? { ...a, ...updates } : a
    );
    onUpdateListe({ articles: updatedArticles });
    setEditingArticle(null);
  };

  const handleDeleteArticle = (articleId) => {
    const updatedArticles = liste.articles.filter(a => a.id !== articleId);
    onUpdateListe({ articles: updatedArticles });
  };

  const handleUpdateBudget = (budget) => {
    onUpdateListe({ budget: parseFloat(budget) || 0 });
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="planning-phase space-y-6">
      {/* Template Selection */}
      {(!liste.articles || liste.articles.length === 0) && (
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
          <div className="relative">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-xl">
                <ShoppingBag className="w-6 h-6 text-blue-400" />
              </div>
              Choisissez un Template
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {TEMPLATES.map(template => (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className={`group p-6 rounded-xl border-2 transition-all duration-300 hover:scale-105 transform text-left ${
                    selectedTemplate?.id === template.id
                      ? 'bg-gradient-to-br from-blue-500/20 to-green-500/20 border-blue-500/50 shadow-lg shadow-blue-500/20'
                      : 'bg-slate-800/50 border-slate-700/50 hover:border-blue-500/50'
                  }`}
                >
                  <div className="text-4xl mb-3">{template.icon}</div>
                  <div className="text-lg font-bold text-white mb-2">{template.nom}</div>
                  <div className="text-sm text-slate-400">{template.description}</div>
                  <div className="text-xs text-slate-500 mt-3">
                    {template.articles.length} article(s)
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Budget Summary */}
      <div className={`relative overflow-hidden rounded-2xl border-2 p-6 transition-all duration-300 ${
        budgetStatus === 'critical' ? 'bg-gradient-to-br from-red-500/20 to-red-600/20 border-red-500/50' :
        budgetStatus === 'warning' ? 'bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-yellow-500/50' :
        'bg-gradient-to-br from-green-500/20 to-blue-500/20 border-green-500/50'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-400 mb-2">Budget Estimé</div>
            <div className="text-4xl font-bold text-white">
              {formatCurrency(budgetEstime)}
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-slate-400 mb-2">Budget Alloué</div>
            <input
              type="number"
              value={liste.budget || 0}
              onChange={(e) => handleUpdateBudget(e.target.value)}
              className="w-32 px-3 py-2 bg-slate-800/50 border border-slate-600 rounded-lg text-white text-right text-xl font-bold focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="0"
            />
          </div>
        </div>

        {budgetStatus !== 'none' && liste.budget > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Restant</span>
              <span className={`font-bold ${
                budgetStatus === 'critical' ? 'text-red-400' :
                budgetStatus === 'warning' ? 'text-yellow-400' :
                'text-green-400'
              }`}>
                {formatCurrency(liste.budget - budgetEstime)}
              </span>
            </div>
            {budgetStatus !== 'ok' && (
              <div className="mt-2 flex items-center gap-2 text-xs">
                <AlertTriangle className={`w-4 h-4 ${
                  budgetStatus === 'critical' ? 'text-red-400' : 'text-yellow-400'
                }`} />
                <span className={budgetStatus === 'critical' ? 'text-red-400' : 'text-yellow-400'}>
                  {budgetStatus === 'critical' 
                    ? 'Budget dépassé ! Retirez des articles ou augmentez le budget'
                    : 'Attention, vous approchez de votre budget'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Articles List */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>
        <div className="relative">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-xl">
              <ShoppingBag className="w-6 h-6 text-purple-400" />
            </div>
            Articles ({liste.articles?.length || 0})
          </h3>

          {/* Add Article Form */}
          <div className="mb-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <input
                type="text"
                value={newArticle.nom}
                onChange={(e) => setNewArticle({ ...newArticle, nom: e.target.value })}
                placeholder="Nom de l'article"
                className="md:col-span-2 px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <input
                type="number"
                value={newArticle.quantite}
                onChange={(e) => setNewArticle({ ...newArticle, quantite: parseInt(e.target.value) || 1 })}
                placeholder="Qté"
                min="1"
                className="px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <input
                type="number"
                value={newArticle.prixEstime}
                onChange={(e) => setNewArticle({ ...newArticle, prixEstime: parseFloat(e.target.value) || 0 })}
                placeholder="Prix estimé"
                step="0.01"
                min="0"
                className="px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <button
                onClick={handleAddArticle}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-500 hover:to-green-500 text-white rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-blue-500/50 hover:scale-105 transform flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>
          </div>

          {/* Articles Table */}
          {liste.articles && liste.articles.length > 0 ? (
            <div className="space-y-2">
              {liste.articles.map(article => (
                <div
                  key={article.id}
                  className="group p-4 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300"
                >
                  {editingArticle === article.id ? (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      <input
                        type="text"
                        defaultValue={article.nom}
                        onBlur={(e) => handleUpdateArticle(article.id, { nom: e.target.value })}
                        className="md:col-span-2 px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                      />
                      <input
                        type="number"
                        defaultValue={article.quantite}
                        onBlur={(e) => handleUpdateArticle(article.id, { quantite: parseInt(e.target.value) || 1 })}
                        className="px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                      />
                      <input
                        type="number"
                        defaultValue={article.prixEstime}
                        onBlur={(e) => handleUpdateArticle(article.id, { prixEstime: parseFloat(e.target.value) || 0 })}
                        step="0.01"
                        className="px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                      />
                      <button
                        onClick={() => setEditingArticle(null)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
                      >
                        OK
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-white font-medium">{article.nom}</div>
                        <div className="text-sm text-slate-400 mt-1">
                          Quantité: {article.quantite} × {formatCurrency(article.prixEstime)} = {formatCurrency(article.prixEstime * article.quantite)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingArticle(article.id)}
                          className="p-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors"
                          aria-label="Modifier l'article"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteArticle(article.id)}
                          className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
                          aria-label="Supprimer l'article"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-slate-400 py-8">
              Aucun article dans la liste. Ajoutez-en pour commencer.
            </div>
          )}
        </div>
      </div>

      {/* Optimizer Toggle */}
      {liste.articles && liste.articles.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={() => setShowOptimizer(!showOptimizer)}
            className="group px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-500 hover:to-blue-500 text-white rounded-xl font-medium shadow-lg hover:shadow-green-500/50 hover:scale-105 transform transition-all duration-300"
          >
            <span className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              {showOptimizer ? 'Masquer' : 'Voir'} les Optimisations
            </span>
          </button>
        </div>
      )}

      {/* Budget Optimizer */}
      {showOptimizer && liste.articles && liste.articles.length > 0 && (
        <BudgetOptimizer
          liste={liste}
          budget={liste.budget}
          inventaire={[]} // TODO: passer inventaire réel
          onApplyOptimization={onApplyOptimization}
        />
      )}
    </div>
  );
};

export default PlanningPhase;
