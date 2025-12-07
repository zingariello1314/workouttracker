import React, { useState } from 'react';
import { useInvestissements } from '../../../hooks/useInvestissements';

const AddOrAcquisitionForm = ({ onSave, onCancel, prixOrActuel }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    quantite: 0,
    prix: prixOrActuel || 65,
    prime: 0,
    lieuStockage: 'coffre-banque',
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.quantite <= 0 || formData.prix <= 0) {
      alert('Veuillez remplir tous les champs requis');
      return;
    }

    await onSave(formData);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const totalAchat = formData.quantite * formData.prix * (1 + formData.prime / 100);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h4 className="text-lg font-semibold text-white mb-4">Nouvelle Acquisition d'Or</h4>

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

      {/* Quantité */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Quantité (grammes) *
        </label>
        <input
          type="number"
          value={formData.quantite}
          onChange={(e) => setFormData({ ...formData, quantite: parseFloat(e.target.value) || 0 })}
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          min="0"
          step="0.1"
          required
        />
      </div>

      {/* Prix */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Prix par gramme (€) *
        </label>
        <input
          type="number"
          value={formData.prix}
          onChange={(e) => setFormData({ ...formData, prix: parseFloat(e.target.value) || 0 })}
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          min="0"
          step="0.01"
          required
        />
        {prixOrActuel && (
          <div className="text-xs text-slate-400 mt-1">
            Prix spot actuel : {formatCurrency(prixOrActuel)}/g
          </div>
        )}
      </div>

      {/* Prime */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Prime (%)
        </label>
        <input
          type="number"
          value={formData.prime}
          onChange={(e) => setFormData({ ...formData, prime: parseFloat(e.target.value) || 0 })}
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          min="0"
          max="50"
          step="0.1"
        />
        <div className="text-xs text-slate-400 mt-1">
          Prime recommandée : &lt;5% optimal, &gt;8% attendre
        </div>
      </div>

      {/* Lieu stockage */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Lieu de Stockage
        </label>
        <select
          value={formData.lieuStockage}
          onChange={(e) => setFormData({ ...formData, lieuStockage: e.target.value })}
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
        >
          <option value="coffre-banque">Coffre Banque</option>
          <option value="coffre-domicile">Coffre Domicile</option>
          <option value="tiers-confiance">Tiers Confiance</option>
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

      {/* Total */}
      <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-slate-300 font-medium">Total achat :</span>
          <span className="text-xl font-bold text-white">
            {formatCurrency(totalAchat)}
          </span>
        </div>
        <div className="text-xs text-slate-400 mt-1">
          {formData.quantite}g × {formatCurrency(formData.prix)}/g
          {formData.prime > 0 && ` + ${formData.prime}% prime`}
        </div>
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

export default AddOrAcquisitionForm;



