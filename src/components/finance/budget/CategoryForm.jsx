/**
 * Composant CategoryForm - Formulaire d'ajout/édition de catégorie
 */

import React, { useState, useEffect } from 'react';

const CategoryForm = ({ category, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    nom: '',
    budgetMensuel: 0,
    sousCategories: [],
    icone: '💰',
    couleur: '#3b82f6',
    regles: {
      alerte80: true,
      alerte100: true,
      alerte120: true
    }
  });

  const [newSubCategory, setNewSubCategory] = useState('');

  useEffect(() => {
    if (category) {
      setFormData({
        nom: category.nom || '',
        budgetMensuel: category.budgetMensuel || 0,
        sousCategories: category.sousCategories || [],
        icone: category.icone || '💰',
        couleur: category.couleur || '#3b82f6',
        regles: category.regles || {
          alerte80: true,
          alerte100: true,
          alerte120: true
        }
      });
    }
  }, [category]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.nom || formData.budgetMensuel <= 0) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    onSave(formData);
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

  const ICONS = ['💰', '🛒', '🏠', '🚗', '🎮', '🏥', '📚', '🍔', '👕', '💳', '🎬', '🏋️', '✈️', '🎵', '📱'];

  const COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Nom */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Nom de la catégorie *
        </label>
        <input
          type="text"
          value={formData.nom}
          onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ex: Courses, Logement..."
          required
        />
      </div>

      {/* Budget mensuel */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Budget mensuel (€) *
        </label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={formData.budgetMensuel}
          onChange={(e) => setFormData({ ...formData, budgetMensuel: parseFloat(e.target.value) || 0 })}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Icône */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Icône
        </label>
        <div className="flex flex-wrap gap-2">
          {ICONS.map(icon => (
            <button
              key={icon}
              type="button"
              onClick={() => setFormData({ ...formData, icone: icon })}
              className={`text-2xl p-2 rounded-lg border transition-all ${
                formData.icone === icon
                  ? 'bg-blue-600 border-blue-500'
                  : 'bg-slate-700 border-slate-600 hover:border-slate-500'
              }`}
            >
              {icon}
            </button>
          ))}
        </div>
      </div>

      {/* Couleur */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Couleur
        </label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map(color => (
            <button
              key={color}
              type="button"
              onClick={() => setFormData({ ...formData, couleur: color })}
              className={`w-10 h-10 rounded-lg border-2 transition-all ${
                formData.couleur === color
                  ? 'border-white scale-110'
                  : 'border-slate-600 hover:border-slate-400'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Sous-catégories */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Sous-catégories
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newSubCategory}
            onChange={(e) => setNewSubCategory(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubCategory())}
            className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ajouter une sous-catégorie"
          />
          <button
            type="button"
            onClick={handleAddSubCategory}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Ajouter
          </button>
        </div>
        {formData.sousCategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.sousCategories.map((sub, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-slate-700 text-slate-300 rounded-lg text-sm"
              >
                {sub}
                <button
                  type="button"
                  onClick={() => handleRemoveSubCategory(index)}
                  className="text-red-400 hover:text-red-300"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Règles */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Alertes automatiques
        </label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-slate-300">
            <input
              type="checkbox"
              checked={formData.regles.alerte80}
              onChange={(e) => setFormData({
                ...formData,
                regles: { ...formData.regles, alerte80: e.target.checked }
              })}
              className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
            />
            Alerte à 80% du budget
          </label>
          <label className="flex items-center gap-2 text-slate-300">
            <input
              type="checkbox"
              checked={formData.regles.alerte100}
              onChange={(e) => setFormData({
                ...formData,
                regles: { ...formData.regles, alerte100: e.target.checked }
              })}
              className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
            />
            Alerte à 100% du budget
          </label>
          <label className="flex items-center gap-2 text-slate-300">
            <input
              type="checkbox"
              checked={formData.regles.alerte120}
              onChange={(e) => setFormData({
                ...formData,
                regles: { ...formData.regles, alerte120: e.target.checked }
              })}
              className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
            />
            Alerte à 120% du budget (dépassement)
          </label>
        </div>
      </div>

      {/* Boutons */}
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          {category ? 'Modifier' : 'Ajouter'}
        </button>
      </div>
    </form>
  );
};

export default CategoryForm;

