/**
 * ExecutionMode - Interface tactile pour exécution courses
 * Optimisé pour utilisation en magasin (gros boutons, navigation fluide)
 */

import { useState, useMemo } from 'react';
import { Check, X, RefreshCw, Plus, ShoppingCart, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../../utils/planificateurUtils';

const ExecutionMode = ({ listes, onUpdateArticle, onAddArticle }) => {
  const [selectedListeId, setSelectedListeId] = useState(null);
  const [showAddArticle, setShowAddArticle] = useState(false);
  const [newArticle, setNewArticle] = useState({ nom: '', quantite: 1, prixEstime: 0 });

  // Listes en cours ou prêtes
  const listesActives = useMemo(() => {
    return listes.filter(l => l.statut === 'en-cours' || l.statut === 'prete');
  }, [listes]);

  const selectedListe = useMemo(() => {
    return listes.find(l => l.id === selectedListeId);
  }, [listes, selectedListeId]);

  // Métriques liste sélectionnée
  const metrics = useMemo(() => {
    if (!selectedListe) return null;
    
    const total = selectedListe.articles.length;
    const achetes = selectedListe.articles.filter(a => a.statut === 'achete').length;
    const pasTrouves = selectedListe.articles.filter(a => a.statut === 'pas-trouve').length;
    const remplaces = selectedListe.articles.filter(a => a.statut === 'remplace').length;
    
    const coutEstime = selectedListe.articles.reduce((sum, a) => sum + (a.prixEstime * a.quantite), 0);
    const coutReel = selectedListe.articles.reduce((sum, a) => sum + ((a.prixReel || 0) * a.quantite), 0);
    const ecart = coutReel - coutEstime;
    const restantBudget = selectedListe.budget - coutReel;
    
    return {
      total,
      achetes,
      pasTrouves,
      remplaces,
      progression: total > 0 ? (achetes / total) * 100 : 0,
      coutEstime,
      coutReel,
      ecart,
      restantBudget
    };
  }, [selectedListe]);

  const handleCheckArticle = (articleId, statut) => {
    onUpdateArticle(selectedListeId, articleId, { statut });
  };

  const handleUpdatePrix = (articleId, prixReel) => {
    onUpdateArticle(selectedListeId, articleId, { prixReel: Number(prixReel), statut: 'achete' });
  };

  const handleAddArticle = () => {
    if (!newArticle.nom.trim()) return;
    
    onAddArticle(selectedListeId, {
      ...newArticle,
      categorie: 'Autre',
      prixEstime: Number(newArticle.prixEstime)
    });
    
    setNewArticle({ nom: '', quantite: 1, prixEstime: 0 });
    setShowAddArticle(false);
  };

  if (listesActives.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingCart className="w-16 h-16 text-slate-600 mx-auto mb-4" />
        <div className="text-slate-400 text-lg">Aucune liste active</div>
        <div className="text-slate-500 text-sm mt-2">Créez une liste et démarrez-la pour utiliser le mode exécution</div>
      </div>
    );
  }

  if (!selectedListeId) {
    return (
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white mb-4">Sélectionner une liste</h3>
        {listesActives.map(liste => (
          <button
            key={liste.id}
            onClick={() => setSelectedListeId(liste.id)}
            className="w-full p-6 bg-gradient-to-r from-blue-600/20 to-green-600/20 border-2 border-blue-500/50 hover:border-blue-400 rounded-xl text-left transition-all duration-300 hover:scale-[1.02] transform"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-white mb-1">{liste.nom}</div>
                <div className="text-sm text-slate-300">
                  {liste.articles.length} articles • Budget: {formatCurrency(liste.budget)}
                </div>
              </div>
              <ShoppingCart className="w-8 h-8 text-blue-400" />
            </div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="execution-mode space-y-6">
      {/* Header avec métriques */}
      <div className="bg-gradient-to-r from-blue-600/20 to-green-600/20 border border-blue-500/30 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold text-white">{selectedListe.nom}</h3>
          <button
            onClick={() => setSelectedListeId(null)}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm"
          >
            Changer
          </button>
        </div>
        
        {/* Métriques temps réel */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-blue-500/20 rounded-lg">
            <div className="text-xs text-blue-400 mb-1">Progression</div>
            <div className="text-2xl font-bold text-white">{metrics.progression.toFixed(0)}%</div>
          </div>
          <div className="p-3 bg-green-500/20 rounded-lg">
            <div className="text-xs text-green-400 mb-1">Coût réel</div>
            <div className="text-2xl font-bold text-white">{formatCurrency(metrics.coutReel)}</div>
          </div>
          <div className={`p-3 rounded-lg ${metrics.restantBudget >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            <div className={`text-xs mb-1 ${metrics.restantBudget >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              Restant
            </div>
            <div className={`text-2xl font-bold ${metrics.restantBudget >= 0 ? 'text-white' : 'text-red-400'}`}>
              {formatCurrency(metrics.restantBudget)}
            </div>
          </div>
          <div className="p-3 bg-purple-500/20 rounded-lg">
            <div className="text-xs text-purple-400 mb-1">Articles</div>
            <div className="text-2xl font-bold text-white">{metrics.achetes}/{metrics.total}</div>
          </div>
        </div>

        {/* Alerte dépassement */}
        {metrics.restantBudget < 0 && (
          <div className="mt-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-red-400" />
            <span className="text-red-400 font-semibold">
              Budget dépassé de {formatCurrency(Math.abs(metrics.restantBudget))}
            </span>
          </div>
        )}
      </div>

      {/* Bouton ajouter article */}
      <button
        onClick={() => setShowAddArticle(true)}
        className="w-full p-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-xl font-medium shadow-lg hover:scale-[1.02] transform transition-all duration-300"
      >
        <div className="flex items-center justify-center gap-2">
          <Plus className="w-5 h-5" />
          <span>Ajouter un article</span>
        </div>
      </button>

      {/* Modal ajout article */}
      {showAddArticle && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full">
            <h4 className="text-xl font-bold text-white mb-4">Ajouter un article</h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Nom</label>
                <input
                  type="text"
                  value={newArticle.nom}
                  onChange={(e) => setNewArticle({ ...newArticle, nom: e.target.value })}
                  placeholder="Ex: Pain"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Quantité</label>
                  <input
                    type="number"
                    value={newArticle.quantite}
                    onChange={(e) => setNewArticle({ ...newArticle, quantite: Number(e.target.value) })}
                    min="1"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Prix (€)</label>
                  <input
                    type="number"
                    value={newArticle.prixEstime}
                    onChange={(e) => setNewArticle({ ...newArticle, prixEstime: Number(e.target.value) })}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddArticle(false)}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAddArticle}
                disabled={!newArticle.nom.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-500 hover:to-green-500 text-white rounded-xl font-medium transition-all disabled:opacity-50"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste articles - Interface tactile */}
      <div className="space-y-3">
        {selectedListe.articles.map(article => (
          <div
            key={article.id}
            className={`p-4 rounded-xl border-2 transition-all duration-300 ${
              article.statut === 'achete'
                ? 'bg-green-500/10 border-green-500/50'
                : article.statut === 'pas-trouve'
                ? 'bg-red-500/10 border-red-500/50'
                : article.statut === 'remplace'
                ? 'bg-orange-500/10 border-orange-500/50'
                : 'bg-slate-700/50 border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <div className="text-lg font-semibold text-white">{article.nom}</div>
                <div className="text-sm text-slate-400">
                  Qté: {article.quantite} • Estimé: {formatCurrency(article.prixEstime * article.quantite)}
                </div>
              </div>
              
              {article.statut === 'achete' && (
                <div className="text-green-400 font-semibold">
                  {formatCurrency((article.prixReel || article.prixEstime) * article.quantite)}
                </div>
              )}
            </div>

            {/* Actions tactiles */}
            {article.statut === 'a-acheter' && (
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleCheckArticle(article.id, 'achete')}
                  className="p-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  <span>Acheté</span>
                </button>
                <button
                  onClick={() => handleCheckArticle(article.id, 'pas-trouve')}
                  className="p-3 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <X className="w-5 h-5" />
                  <span>Pas trouvé</span>
                </button>
                <button
                  onClick={() => handleCheckArticle(article.id, 'remplace')}
                  className="p-3 bg-orange-600 hover:bg-orange-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  <span>Remplacé</span>
                </button>
              </div>
            )}

            {article.statut === 'achete' && (
              <button
                onClick={() => handleCheckArticle(article.id, 'a-acheter')}
                className="w-full p-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-sm transition-colors"
              >
                Annuler
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExecutionMode;
