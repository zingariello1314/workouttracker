import React, { useState } from 'react';

const AddLiquiditesEntryForm = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    montant: 0,
    source: '',
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.montant <= 0) {
      alert('Le montant doit être supérieur à 0');
      return;
    }

    await onSave(formData);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h4 className="text-lg font-semibold text-white mb-4">Nouvelle Entrée Liquidités</h4>

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

      {/* Source */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Source
        </label>
        <select
          value={formData.source}
          onChange={(e) => setFormData({ ...formData, source: e.target.value })}
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
        >
          <option value="">Sélectionner...</option>
          <option value="salaire">Salaire</option>
          <option value="bonus">Bonus</option>
          <option value="vente">Vente</option>
          <option value="economie">Économie</option>
          <option value="autre">Autre</option>
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
          Enregistrer
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

export default AddLiquiditesEntryForm;

