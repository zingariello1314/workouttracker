import React, { useState } from 'react';

const AddPositionForm = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'action',
    ticker: '',
    nom: '',
    montant: 0,
    quantite: 0,
    prixAchat: 0,
    notes: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.montant <= 0 || !formData.ticker) {
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

  // Calculer montant si quantité et prix fournis
  const calculerMontant = () => {
    if (formData.quantite > 0 && formData.prixAchat > 0) {
      return formData.quantite * formData.prixAchat;
    }
    return formData.montant;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h4 className="text-lg font-semibold text-white mb-4">Nouvelle Position</h4>

      {/* Type */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Type *
        </label>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          required
        >
          <option value="action">Action</option>
          <option value="etf">ETF</option>
          <option value="crypto">Crypto</option>
          <option value="cash">Cash Attente</option>
        </select>
      </div>

      {/* Ticker */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Ticker/Symbole *
        </label>
        <input
          type="text"
          value={formData.ticker}
          onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          placeholder="AAPL, BTC, etc."
          required
        />
      </div>

      {/* Nom */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Nom
        </label>
        <input
          type="text"
          value={formData.nom}
          onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          placeholder="Nom complet (optionnel)"
        />
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Date d'achat *
        </label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          required
        />
      </div>

      {/* Quantité et Prix OU Montant direct */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Quantité
          </label>
          <input
            type="number"
            value={formData.quantite}
            onChange={(e) => {
              const qty = parseFloat(e.target.value) || 0;
              setFormData({ 
                ...formData, 
                quantite: qty,
                montant: qty > 0 && formData.prixAchat > 0 ? qty * formData.prixAchat : formData.montant
              });
            }}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            min="0"
            step="0.0001"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Prix d'achat
          </label>
          <input
            type="number"
            value={formData.prixAchat}
            onChange={(e) => {
              const prix = parseFloat(e.target.value) || 0;
              setFormData({ 
                ...formData, 
                prixAchat: prix,
                montant: prix > 0 && formData.quantite > 0 ? prix * formData.quantite : formData.montant
              });
            }}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            min="0"
            step="0.01"
          />
        </div>
      </div>

      {/* Montant total */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Montant Total (€) *
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
        {formData.quantite > 0 && formData.prixAchat > 0 && (
          <div className="text-xs text-slate-400 mt-1">
            Calculé : {formatCurrency(calculerMontant())}
          </div>
        )}
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

export default AddPositionForm;



