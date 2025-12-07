/**
 * ListesManager - Gestion complète des listes de courses
 * Création, édition, suppression, templates intelligents
 */

import { useState, useMemo } from 'react';
import { Plus, Trash2, Edit, CheckCircle, Clock, ShoppingBag, Zap, Target, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../../utils/planificateurUtils';

const TEMPLATES = [
  {
    id: 'power-shopping',
    nom: 'Power Shopping',
    icon: '💪',
    description: 'Courses complètes de la semaine',
    color: 'from-blue-500 to-blue-600',
    budgetSuggere: 80
  },
  {
    id: 'quick-run',
    nom: 'Quick Run',
    icon: '⚡',
    description: 'Courses rapides essentielles',
    color: 'from-green-500 to-green-600',
    budgetSuggere: 30
  },
  {
    id: 'mission-speciale',
    nom: 'Mission Spéciale',
    icon: '🎯',
    description: 'Achats ciblés spécifiques',
    color: 'from-purple-500 to-purple-600',
    budgetSuggere: 50
  },
  {
    id: 'promo-hunter',
    nom: 'Promo Hunter',
    icon: '🔥',
    description: 'Chasse aux promotions',
    color: 'from-orange-500 to-orange-600',
    budgetSuggere: 60
  }
];

const ListesManager = ({ listes, onCreateListe, onUpdateListe, onDeleteListe }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [newListeNom, setNewListeNom] = useState('');
  const [newListeBudget, setNewListeBudget] = useState(80);

  // Statistiques listes
  const stats = useMemo(() => {
    const pretes = listes.filter(l => l.statut === 'prete').length;
    const enCours = listes.filter(l => l.statut === 'en-cours').length;
    const completees = listes.filter(l => l.statut === 'completee').length;
    
    return { pretes, enCours, completees, total: listes.length };
  }, [listes]);

  const handleCreateListe = () => {
    if (!newListeNom.trim() || !selectedTemplate) return;
    
    onCreateListe({
      nom: newListeNom,
      type: selectedTemplate.id,
      budget: newListeBudget,
      articles: []
    });
    
    // Reset
    setShowCreateModal(false);
    setNewListeNom('');
    setSelectedTemplate(null);
    setNewListeBudget(80);
  };

  const getStatutColor = (statut) => {
    switch (statut) {
      case 'prete': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'en-cours': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'completee': return 'text-green-400 bg-green-500/20 border-green-500/30';
      default: return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
    }
  };

  const getStatutLabel = (statut) => {
    switch (statut) {
      case 'prete': return 'Prête';
      case 'en-cours': return 'En cours';
      case 'completee': return 'Complétée';
      default: return statut;
    }
  };

  return (
    <div className="listes-manager space-y-6">
      {/* Header avec stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-blue-400 font-semibold">Prêtes</span>
            <Clock className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-3xl font-bold text-white">{stats.pretes}</div>
        </div>
        
        <div className="p-4 bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/30 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-orange-400 font-semibold">En cours</span>
            <ShoppingBag className="w-5 h-5 text-orange-400" />
          </div>
          <div className="text-3xl font-bold text-white">{stats.enCours}</div>
        </div>
        
        <div className="p-4 bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/30 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-green-400 font-semibold">Complétées</span>
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-3xl font-bold text-white">{stats.completees}</div>
        </div>
        
        <div className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/30 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-purple-400 font-semibold">Total</span>
            <TrendingUp className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-white">{stats.total}</div>
        </div>
      </div>

      {/* Bouton créer liste */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="w-full p-6 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-500 hover:to-green-500 text-white rounded-xl font-medium shadow-lg hover:shadow-blue-500/50 hover:scale-[1.02] transform transition-all duration-300"
      >
        <div className="flex items-center justify-center gap-3">
          <Plus className="w-6 h-6" />
          <span className="text-lg">Créer une nouvelle liste</span>
        </div>
      </button>

      {/* Modal création liste */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-white mb-6">Créer une liste</h3>
            
            {/* Templates */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-3">
                Choisir un template
              </label>
              <div className="grid grid-cols-2 gap-3">
                {TEMPLATES.map(template => (
                  <button
                    key={template.id}
                    onClick={() => {
                      setSelectedTemplate(template);
                      setNewListeBudget(template.budgetSuggere);
                    }}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                      selectedTemplate?.id === template.id
                        ? `bg-gradient-to-br ${template.color} border-white/50 scale-105`
                        : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <div className="text-3xl mb-2">{template.icon}</div>
                    <div className="text-white font-semibold mb-1">{template.nom}</div>
                    <div className="text-xs text-slate-300">{template.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Nom liste */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nom de la liste
              </label>
              <input
                type="text"
                value={newListeNom}
                onChange={(e) => setNewListeNom(e.target.value)}
                placeholder="Ex: Courses semaine 48"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Budget */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Budget (€)
              </label>
              <input
                type="number"
                value={newListeBudget}
                onChange={(e) => setNewListeBudget(Number(e.target.value))}
                min="0"
                max="1000"
                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateListe}
                disabled={!newListeNom.trim() || !selectedTemplate}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-500 hover:to-green-500 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste des listes */}
      <div className="space-y-4">
        {listes.length === 0 ? (
          <div className="text-center text-slate-400 py-12">
            Aucune liste créée. Créez votre première liste pour commencer !
          </div>
        ) : (
          listes.map(liste => {
            const template = TEMPLATES.find(t => t.id === liste.type);
            const totalArticles = liste.articles.length;
            const articlesAchetes = liste.articles.filter(a => a.statut === 'achete').length;
            const progression = totalArticles > 0 ? (articlesAchetes / totalArticles) * 100 : 0;
            
            return (
              <div
                key={liste.id}
                className="group p-6 bg-slate-800/50 border border-slate-700 rounded-xl hover:border-slate-600 transition-all duration-300 hover:shadow-lg"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{template?.icon || '📝'}</div>
                    <div>
                      <h4 className="text-lg font-semibold text-white">{liste.nom}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-1 rounded-lg border ${getStatutColor(liste.statut)}`}>
                          {getStatutLabel(liste.statut)}
                        </span>
                        <span className="text-xs text-slate-400">
                          {template?.nom || liste.type}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateListe(liste.id, { statut: liste.statut === 'prete' ? 'en-cours' : 'prete' })}
                      className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                      title="Modifier statut"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteListe(liste.id)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Métriques */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Budget</div>
                    <div className="text-lg font-bold text-white">{formatCurrency(liste.budget)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Articles</div>
                    <div className="text-lg font-bold text-white">{totalArticles}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-400 mb-1">Progression</div>
                    <div className="text-lg font-bold text-white">{progression.toFixed(0)}%</div>
                  </div>
                </div>

                {/* Barre progression */}
                {totalArticles > 0 && (
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progression}%` }}
                    ></div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ListesManager;
