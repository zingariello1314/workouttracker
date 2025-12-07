/**
 * InventaireManager - Gestion complète inventaire
 * CRUD articles, alertes stock bas, tracking expiration
 */

import { useState, useMemo } from 'react';
import { Plus, Edit, Trash2, AlertTriangle, Package, Search } from 'lucide-react';

const CATEGORIES = ['Frigo', 'Placard', 'Congel', 'Autre'];

const InventaireManager = ({ inventaire, onAddItem, onUpdateItem, onDeleteItem }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategorie, setFilterCategorie] = useState('all');
  
  const [formData, setFormData] = useState({
    nom: '',
    quantite: 1,
    seuilAlerte: 1,
    dureeVie: 7,
    consommationMoyenne: 7,
    categorie: 'Placard',
    dateExpiration: ''
  });

  // Filtrage
  const filteredInventaire = useMemo(() => {
    return inventaire.filter(item => {
      const matchSearch = item.nom.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategorie = filterCategorie === 'all' || item.categorie === filterCategorie;
      return matchSearch && matchCategorie;
    });
  }, [inventaire, searchTerm, filterCategorie]);

  // Stats
  const stats = useMemo(() => {
    const stockBas = inventaire.filter(i => i.quantite <= i.seuilAlerte).length;
    const total = inventaire.length;
    const parCategorie = CATEGORIES.reduce((acc, cat) => {
      acc[cat] = inventaire.filter(i => i.categorie === cat).length;
      return acc;
    }, {});
    
    return { stockBas, total, parCategorie };
  }, [inventaire]);

  const handleSubmit = () => {
    if (!formData.nom.trim()) return;
    
    if (editingItem) {
      onUpdateItem(editingItem.id, formData);
      setEditingItem(null);
    } else {
      onAddItem(formData);
    }
    
    resetForm();
    setShowAddModal(false);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      nom: item.nom,
      quantite: item.quantite,
      seuilAlerte: item.seuilAlerte,
      dureeVie: item.dureeVie,
      consommationMoyenne: item.consommationMoyenne,
      categorie: item.categorie,
      dateExpiration: item.dateExpiration || ''
    });
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      quantite: 1,
      seuilAlerte: 1,
      dureeVie: 7,
      consommationMoyenne: 7,
      categorie: 'Placard',
      dateExpiration: ''
    });
    setEditingItem(null);
  };

  const getCategorieColor = (categorie) => {
    switch (categorie) {
      case 'Frigo': return 'text-blue-400 bg-blue-500/20 border-blue-500/30';
      case 'Placard': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'Congel': return 'text-cyan-400 bg-cyan-500/20 border-cyan-500/30';
      default: return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
    }
  };

  return (
    <div className="inventaire-manager space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/30 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-purple-400 font-semibold">Total</span>
            <Package className="w-5 h-5 text-purple-400" />
          </div>
          <div className="text-3xl font-bold text-white">{stats.total}</div>
        </div>
        
        <div className="p-4 bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/30 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-red-400 font-semibold">Stock bas</span>
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-3xl font-bold text-white">{stats.stockBas}</div>
        </div>
        
        <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 rounded-xl">
          <div className="text-sm text-blue-400 font-semibold mb-2">Frigo</div>
          <div className="text-3xl font-bold text-white">{stats.parCategorie.Frigo || 0}</div>
        </div>
        
        <div className="p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/30 rounded-xl">
          <div className="text-sm text-yellow-400 font-semibold mb-2">Placard</div>
          <div className="text-3xl font-bold text-white">{stats.parCategorie.Placard || 0}</div>
        </div>
      </div>

      {/* Recherche et filtres */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un article..."
            className="w-full pl-10 pr-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        
        <select
          value={filterCategorie}
          onChange={(e) => setFilterCategorie(e.target.value)}
          className="px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
        >
          <option value="all">Toutes catégories</option>
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-500 hover:to-green-500 text-white rounded-xl font-medium shadow-lg hover:scale-105 transform transition-all duration-300 whitespace-nowrap"
        >
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            <span>Ajouter</span>
          </div>
        </button>
      </div>

      {/* Modal ajout/édition */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-white mb-6">
              {editingItem ? 'Modifier l\'article' : 'Ajouter un article'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Nom</label>
                <input
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Ex: Fromage rapé"
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Quantité</label>
                  <input
                    type="number"
                    value={formData.quantite}
                    onChange={(e) => setFormData({ ...formData, quantite: Number(e.target.value) })}
                    min="0"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Seuil alerte</label>
                  <input
                    type="number"
                    value={formData.seuilAlerte}
                    onChange={(e) => setFormData({ ...formData, seuilAlerte: Number(e.target.value) })}
                    min="0"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Durée de vie (jours)</label>
                  <input
                    type="number"
                    value={formData.dureeVie}
                    onChange={(e) => setFormData({ ...formData, dureeVie: Number(e.target.value) })}
                    min="1"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Consommation (jours/unité)</label>
                  <input
                    type="number"
                    value={formData.consommationMoyenne}
                    onChange={(e) => setFormData({ ...formData, consommationMoyenne: Number(e.target.value) })}
                    min="1"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Catégorie</label>
                <select
                  value={formData.categorie}
                  onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-blue-500"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Date expiration (optionnel)</label>
                <input
                  type="date"
                  value={formData.dateExpiration}
                  onChange={(e) => setFormData({ ...formData, dateExpiration: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.nom.trim()}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-500 hover:to-green-500 text-white rounded-xl font-medium transition-all disabled:opacity-50"
              >
                {editingItem ? 'Modifier' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste inventaire */}
      <div className="space-y-3">
        {filteredInventaire.length === 0 ? (
          <div className="text-center text-slate-400 py-12">
            {searchTerm || filterCategorie !== 'all' 
              ? 'Aucun article trouvé'
              : 'Aucun article en inventaire. Ajoutez votre premier article !'}
          </div>
        ) : (
          filteredInventaire.map(item => {
            const isStockBas = item.quantite <= item.seuilAlerte;
            
            return (
              <div
                key={item.id}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  isStockBas
                    ? 'bg-red-500/10 border-red-500/50'
                    : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-lg font-semibold text-white">{item.nom}</h4>
                      <span className={`text-xs px-2 py-1 rounded-lg border ${getCategorieColor(item.categorie)}`}>
                        {item.categorie}
                      </span>
                      {isStockBas && (
                        <span className="text-xs px-2 py-1 rounded-lg border border-red-500/50 bg-red-500/20 text-red-400 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          Stock bas
                        </span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-slate-400">
                      <div>Quantité: <span className="text-white font-semibold">{item.quantite}</span></div>
                      <div>Seuil: <span className="text-white">{item.seuilAlerte}</span></div>
                      <div>Durée vie: <span className="text-white">{item.dureeVie}j</span></div>
                      <div>Conso: <span className="text-white">{item.consommationMoyenne}j/u</span></div>
                    </div>
                    
                    {item.dateExpiration && (
                      <div className="text-sm text-slate-400 mt-2">
                        Expire le: <span className="text-white">{new Date(item.dateExpiration).toLocaleDateString('fr-FR')}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(item)}
                      className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors"
                      title="Modifier"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default InventaireManager;
