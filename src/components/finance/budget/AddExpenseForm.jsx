import React, { useState } from 'react';
import { useBudget } from '../../../hooks/useBudget';

const AddExpenseForm = ({ onSave, onCancel, initialDate = null }) => {
  const { categories, addDepensePlanifiee } = useBudget();
  const [formData, setFormData] = useState({
    titre: '',
    montant: 0,
    date: initialDate || new Date().toISOString().split('T')[0],
    categorie: categories.length > 0 ? categories[0].id : '',
    statut: 'planifie',
    priorite: 'normal',
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.titre.trim() || formData.montant <= 0) {
      alert('Veuillez remplir tous les champs requis');
      return;
    }

    try {
      await addDepensePlanifiee(formData);
      onSave(formData);
    } catch (error) {
      alert('Erreur lors de l\'ajout de la dépense');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h4 className="text-lg font-semibold text-white mb-4">Nouvelle Dépense Planifiée</h4>

      {/* Titre */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Titre *
        </label>
        <input
          type="text"
          value={formData.titre}
          onChange={(e) => setFormData({ ...formData, titre: e.target.value })}
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          required
        />
      </div>

      {/* Montant */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Montant (€) *
        </label>
        <input
          type="number"
          value={formData.montant}
          onChange={(e) => setFormData({ ...formData, montant: parseFloat(e.target.value) || 0 })}
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          min="0"
          step="0.01"
          required
        />
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Date *
        </label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          required
        />
      </div>

      {/* Catégorie */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Catégorie
        </label>
        <select
          value={formData.categorie}
          onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
        >
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.icone} {cat.nom}
            </option>
          ))}
        </select>
      </div>

      {/* Priorité */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Priorité
        </label>
        <select
          value={formData.priorite}
          onChange={(e) => setFormData({ ...formData, priorite: e.target.value })}
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
        >
          <option value="normal">Normale</option>
          <option value="urgent">Urgente</option>
          <option value="faible">Faible</option>
        </select>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          rows="3"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          Ajouter
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          Annuler
        </button>
      </div>
    </form>
  );
};

export default AddExpenseForm;

