/**
 * Composant CategoryManager - Gestion des catégories avec drag & drop
 * Templates prédéfinis, réorganisation par drag & drop, édition inline
 */

import React, { useState } from 'react';
import { useBudget } from '../../../hooks/useBudget';
import { useToast } from '../../ui/Toast';
import CategoryCard from './CategoryCard';
import CategoryForm from './CategoryForm';
import CategoryRules from './CategoryRules';

// Templates prédéfinis de catégories
const CATEGORY_TEMPLATES = {
  courses: {
    nom: 'Courses',
    budgetMensuel: 400,
    sousCategories: ['Alimentation', 'Produits ménage', 'Hygiène'],
    icone: '🛒',
    couleur: '#3b82f6',
    regles: {
      alerte80: true,
      alerte100: true,
      alerte120: true
    }
  },
  logement: {
    nom: 'Logement',
    budgetMensuel: 800,
    sousCategories: ['Loyer', 'Charges', 'Assurance'],
    icone: '🏠',
    couleur: '#10b981',
    regles: {
      alerte80: true,
      alerte100: true,
      alerte120: true
    }
  },
  transport: {
    nom: 'Transport',
    budgetMensuel: 200,
    sousCategories: ['Essence', 'Assurance', 'Entretien'],
    icone: '🚗',
    couleur: '#f59e0b',
    regles: {
      alerte80: true,
      alerte100: true,
      alerte120: true
    }
  },
  loisirs: {
    nom: 'Loisirs',
    budgetMensuel: 300,
    sousCategories: ['Sorties', 'Abonnements', 'Achats'],
    icone: '🎮',
    couleur: '#8b5cf6',
    regles: {
      alerte80: true,
      alerte100: true,
      alerte120: true
    }
  },
  sante: {
    nom: 'Santé',
    budgetMensuel: 150,
    sousCategories: ['Médecin', 'Pharmacie', 'Mutuelle'],
    icone: '🏥',
    couleur: '#ef4444',
    regles: {
      alerte80: false,
      alerte100: true,
      alerte120: true
    }
  },
  education: {
    nom: 'Éducation',
    budgetMensuel: 200,
    sousCategories: ['Formation', 'Livres', 'Cours'],
    icone: '📚',
    couleur: '#06b6d4',
    regles: {
      alerte80: true,
      alerte100: true,
      alerte120: true
    }
  }
};

const CategoryManager = () => {
  const { categories, addCategorie, updateCategorie, deleteCategorie, reorderCategories } = useBudget();
  const { showToast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Gestion du drag & drop HTML5 natif
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    e.target.style.opacity = '0.5';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newCategories = [...categories];
    const [removed] = newCategories.splice(draggedIndex, 1);
    newCategories.splice(dropIndex, 0, removed);

    try {
      await reorderCategories(newCategories);
      showToast('Catégories réorganisées', 'success');
    } catch (error) {
      showToast('Erreur lors de la réorganisation', 'error');
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleAddFromTemplate = async (templateKey) => {
    const template = CATEGORY_TEMPLATES[templateKey];
    if (!template) return;

    try {
      await addCategorie(template);
      showToast(`Catégorie "${template.nom}" ajoutée`, 'success');
      setShowAddForm(false);
    } catch (error) {
      showToast('Erreur lors de l\'ajout de la catégorie', 'error');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setShowAddForm(false);
  };

  const handleSave = async (categoryData) => {
    try {
      if (editingCategory) {
        await updateCategorie(editingCategory.id, categoryData);
        showToast('Catégorie mise à jour', 'success');
        setEditingCategory(null);
      } else {
        await addCategorie(categoryData);
        showToast('Catégorie ajoutée', 'success');
        setShowAddForm(false);
      }
    } catch (error) {
      showToast('Erreur lors de la sauvegarde', 'error');
    }
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?')) {
      return;
    }

    try {
      await deleteCategorie(categoryId);
      showToast('Catégorie supprimée', 'success');
    } catch (error) {
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  return (
    <div className="category-manager space-y-6">
      {/* Header avec boutons */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {categories.length} catégorie{categories.length > 1 ? 's' : ''}
          </h3>
          <p className="text-sm text-slate-400">
            Glissez-déposez pour réorganiser les catégories
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            {showAddForm ? 'Annuler' : '+ Ajouter'}
          </button>
        </div>
      </div>

      {/* Formulaire d'ajout/édition */}
      {(showAddForm || editingCategory) && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
          <h4 className="text-md font-semibold text-white mb-4">
            {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
          </h4>
          <CategoryForm
            category={editingCategory}
            onSave={handleSave}
            onCancel={() => {
              setShowAddForm(false);
              setEditingCategory(null);
            }}
          />
        </div>
      )}

      {/* Templates prédéfinis */}
      {!showAddForm && !editingCategory && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-slate-300 mb-3">Templates prédéfinis</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {Object.entries(CATEGORY_TEMPLATES).map(([key, template]) => {
              const exists = categories.some(c => c.nom === template.nom);
              return (
                <button
                  key={key}
                  onClick={() => handleAddFromTemplate(key)}
                  disabled={exists}
                  className={`p-3 rounded-lg border transition-all text-left ${
                    exists
                      ? 'bg-slate-700/30 border-slate-600/30 text-slate-500 cursor-not-allowed'
                      : 'bg-slate-700/50 border-slate-600/50 text-slate-300 hover:bg-slate-700 hover:border-slate-500'
                  }`}
                >
                  <div className="text-2xl mb-1">{template.icone}</div>
                  <div className="text-xs font-medium">{template.nom}</div>
                  {exists && <div className="text-xs text-slate-500 mt-1">Déjà ajouté</div>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Liste des catégories avec drag & drop */}
      <div className="space-y-3">
        {categories.length === 0 ? (
          <div className="text-center py-12 bg-slate-800/50 border border-slate-700/50 rounded-lg">
            <p className="text-slate-400 mb-4">Aucune catégorie créée</p>
            <p className="text-sm text-slate-500">
              Utilisez les templates ci-dessus ou créez une catégorie personnalisée
            </p>
          </div>
        ) : (
          categories.map((category, index) => (
            <div
              key={category.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onDrop={(e) => handleDrop(e, index)}
              className={`transition-all ${
                draggedIndex === index ? 'opacity-50' : ''
              } ${
                dragOverIndex === index ? 'border-blue-500 border-2' : ''
              }`}
            >
              <CategoryCard
                category={category}
                onEdit={() => handleEdit(category)}
                onDelete={() => handleDelete(category.id)}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CategoryManager;
