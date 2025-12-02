/**
 * Composant ExpenseForm - Formulaire d'ajout/édition de dépense planifiée
 */

import React, { useState, useEffect } from 'react';
import { useBudget } from '../../../hooks/useBudget';

const ExpenseForm = ({ expense, date, onSave, onCancel }) => {
  const { categories } = useBudget();
  const [formData, setFormData] = useState({
    titre: '',
    montant: 0,
    categorie: '',
    statut: 'planifie',
    priorite: 'normal',
    datePlanifiee: date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (expense) {
      setFormData({
        titre: expense.titre || '',
        montant: expense.montant || 0,
        categorie: expense.categorie || '',
        statut: expense.statut || 'planifie',
        priorite: expense.priorite || 'normal',
        datePlanifiee: expense.datePlanifiee || expense.date || date?.toISOString().split('T')[0]
      });
    }
  }, [expense, date]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.titre || formData.montant <= 0 || !formData.categorie) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Titre */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Titre de la dépense *
        </label>
        <input
          type="text"
          value={formData.titre}
          onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ex: Achat MacBook, Loyer..."
          required
        />
      </div>

      {/* Montant */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Montant (€) *
        </label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={formData.montant}
          onChange={(e) => setFormData({ ...formData, montant: parseFloat(e.target.value) || 0 })}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Catégorie */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Catégorie *
        </label>
        <select
          value={formData.categorie}
          onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Sélectionner une catégorie</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.icone} {cat.nom}
            </option>
          ))}
        </select>
      </div>

      {/* Date planifiée */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Date planifiée
        </label>
        <input
          type="date"
          value={formData.datePlanifiee}
          onChange={(e) => setFormData({ ...formData, datePlanifiee: e.target.value })}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Statut */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Statut
        </label>
        <select
          value={formData.statut}
          onChange={(e) => setFormData({ ...formData, statut: e.target.value })}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="planifie">📌 Planifié</option>
          <option value="confirme">🎯 Confirmé</option>
          <option value="imminent">⏰ Imminent</option>
          <option value="realise">✅ Réalisé</option>
        </select>
      </div>

      {/* Priorité */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">
          Priorité
        </label>
        <select
          value={formData.priorite}
          onChange={(e) => setFormData({ ...formData, priorite: e.target.value })}
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="normal">Normal</option>
          <option value="urgent">🔴 Urgent</option>
          <option value="faible">Faible</option>
        </select>
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
          {expense ? 'Modifier' : 'Ajouter'}
        </button>
      </div>
    </form>
  );
};

export default ExpenseForm;

