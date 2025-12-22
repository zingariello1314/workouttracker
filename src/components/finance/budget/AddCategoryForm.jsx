import React, { useState, useEffect } from 'react';
import { useTranslation } from '../../../utils/translations';
import { useToast } from '../../ui/Toast';
import { validateCategory } from '../../../services/finance/budgetSchemas';
import logger from '../../../utils/logger';

const log = logger.module('AddCategoryForm');

const CATEGORY_TEMPLATES = {
  courses: {
    nom: 'Courses',
    budgetMensuel: 400,
    sousCategories: ['Alimentation', 'Produits ménage', 'Hygiène'],
    icone: '🛒',
    couleur: '#3b82f6'
  },
  logement: {
    nom: 'Logement',
    budgetMensuel: 800,
    sousCategories: ['Loyer', 'Charges', 'Assurance'],
    icone: '🏠',
    couleur: '#10b981'
  },
  transport: {
    nom: 'Transport',
    budgetMensuel: 200,
    sousCategories: ['Essence', 'Assurance', 'Entretien'],
    icone: '🚗',
    couleur: '#f59e0b'
  },
  loisirs: {
    nom: 'Loisirs',
    budgetMensuel: 300,
    sousCategories: ['Sorties', 'Abonnements', 'Achats'],
    icone: '🎮',
    couleur: '#8b5cf6'
  },
  sante: {
    nom: 'Santé',
    budgetMensuel: 150,
    sousCategories: ['Médecin', 'Pharmacie', 'Mutuelle'],
    icone: '🏥',
    couleur: '#ef4444'
  },
  education: {
    nom: 'Éducation',
    budgetMensuel: 200,
    sousCategories: ['Formation', 'Livres', 'Matériel'],
    icone: '📚',
    couleur: '#06b6d4'
  }
};

const AddCategoryForm = ({ category, onSave, onCancel }) => {
  const t = useTranslation();
  const { showWarning } = useToast();
  const [formData, setFormData] = useState({
    nom: category?.nom || '',
    budgetMensuel: category?.budgetMensuel || 0,
    sousCategories: category?.sousCategories || [],
    icone: category?.icone || '📁',
    couleur: category?.couleur || '#6b7280',
    regles: category?.regles || {
      alerte80: true,
      alerte100: true,
      alerte120: true,
      action80: 'NOTIFICATION',
      action100: 'BLOCK',
      action120: 'BLOCK_STRICT'
    }
  });
  const [newSubCategory, setNewSubCategory] = useState('');

  useEffect(() => {
    if (category) {
      setFormData({
        nom: category.nom || '',
        budgetMensuel: category.budgetMensuel || 0,
        sousCategories: category.sousCategories || [],
        icone: category.icone || '📁',
        couleur: category.couleur || '#6b7280',
        regles: category.regles || {
          alerte80: true,
          alerte100: true,
          alerte120: true,
          action80: 'NOTIFICATION',
          action100: 'BLOCK',
          action120: 'BLOCK_STRICT'
        }
      });
    }
  }, [category]);

  const handleTemplateSelect = (templateKey) => {
    const template = CATEGORY_TEMPLATES[templateKey];
    setFormData({
      ...formData,
      nom: template.nom,
      budgetMensuel: template.budgetMensuel,
      sousCategories: [...template.sousCategories],
      icone: template.icone,
      couleur: template.couleur
    });
  };

  const handleAddSubCategory = () => {
    if (newSubCategory.trim()) {
      setFormData({
        ...formData,
        sousCategories: [...formData.sousCategories, newSubCategory.trim()]
      });
      setNewSubCategory('');
    }
  };

  const handleRemoveSubCategory = (index) => {
    setFormData({
      ...formData,
      sousCategories: formData.sousCategories.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // ✅ SOLUTION 1.6 : Validation Zod côté client pour meilleure UX
    try {
      // Créer un objet temporaire avec ID pour validation
      const tempCategory = {
        ...formData,
        id: category?.id || `temp_${Date.now()}`
      };
      
      validateCategory(tempCategory, { throwOnError: true, strict: false });
    } catch (error) {
      log.error('[AddCategoryForm] Validation error:', error);
      showError(`Données invalides: ${error.message}`);
      return;
    }
    
    // Validation basique supplémentaire pour UX immédiate
    if (!formData.nom.trim()) {
      showWarning('Le nom de la catégorie est requis');
      return;
    }
    
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h4 className="text-lg font-semibold text-white mb-4">
        {category ? 'Modifier Catégorie' : 'Nouvelle Catégorie'}
      </h4>

      {/* Templates */}
      {!category && (
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Templates prédéfinis
          </label>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(CATEGORY_TEMPLATES).map(([key, template]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleTemplateSelect(key)}
                className="p-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg text-left transition-colors"
              >
                <div className="text-2xl mb-1">{template.icone}</div>
                <div className="text-sm font-semibold text-white">{template.nom}</div>
                <div className="text-xs text-slate-400">{template.budgetMensuel}€/mois</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Nom */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Nom *
        </label>
        <input
          type="text"
          value={formData.nom}
          onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          required
        />
      </div>

      {/* Budget mensuel */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Budget mensuel (€) *
        </label>
        <input
          type="number"
          value={formData.budgetMensuel}
          onChange={(e) => setFormData({ ...formData, budgetMensuel: parseFloat(e.target.value) || 0 })}
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          min="0"
          step="0.01"
          required
        />
      </div>

      {/* Icône */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Icône
        </label>
        <input
          type="text"
          value={formData.icone}
          onChange={(e) => setFormData({ ...formData, icone: e.target.value })}
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          placeholder="📁"
        />
      </div>

      {/* Couleur */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Couleur
        </label>
        <div className="flex gap-2">
          <input
            type="color"
            value={formData.couleur}
            onChange={(e) => setFormData({ ...formData, couleur: e.target.value })}
            className="w-16 h-10 bg-slate-700 border border-slate-600 rounded-lg cursor-pointer"
          />
          <input
            type="text"
            value={formData.couleur}
            onChange={(e) => setFormData({ ...formData, couleur: e.target.value })}
            className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            placeholder="#6b7280"
          />
        </div>
      </div>

      {/* Sous-catégories */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Sous-catégories
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newSubCategory}
            onChange={(e) => setNewSubCategory(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubCategory())}
            className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            placeholder="Ajouter une sous-catégorie"
          />
          <button
            type="button"
            onClick={handleAddSubCategory}
            className="gradient-button-premium gradient-button-premium-sm rounded-lg"
          >
            Ajouter
          </button>
        </div>
        {formData.sousCategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.sousCategories.map((sub, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-slate-700 text-white rounded-full text-sm"
              >
                {sub}
                <button
                  type="button"
                  onClick={() => handleRemoveSubCategory(index)}
                  className="gradient-button-premium gradient-button-premium-sm rounded-lg text-red-400 hover:text-red-300"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          className="gradient-button-premium gradient-button-premium-md rounded-lg flex-1"
        >
          {category ? 'Modifier' : 'Ajouter'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="gradient-button-premium gradient-button-premium-sm gradient-button-premium-variant rounded-lg flex-1"
        >
          Annuler
        </button>
      </div>
    </form>
  );
};

export default AddCategoryForm;



