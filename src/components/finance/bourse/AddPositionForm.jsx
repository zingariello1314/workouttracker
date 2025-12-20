/**
 * Formulaire d'ajout de position boursière
 * 
 * ✅ OPTIMISATION Phase 2.2 : Memoization Composants et Props
 * - useCallback pour handlers (évite re-création fonctions)
 * - Réduction re-renders inutiles
 * 
 * @module components/finance/bourse/AddPositionForm
 * @see docs/finance/ANALYSE_PROFONDE_SOUS_ONGLET_BOURSE.md - Solution 6
 */

import React, { useState, useCallback, memo } from 'react';
import { useTranslation } from '../../../utils/translations';
import { useFinance } from '../../../context/FinanceContext';
import { useToast } from '../../ui/Toast';

const AddPositionForm = memo(({ onClose }) => {
  const t = useTranslation();
  const { addPosition } = useFinance();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    entreprise: '',
    ticker: '',
    quantite: '',
    prixEntree: '',
    dateAchat: new Date().toISOString().split('T')[0]
  });

  // ✅ OPTIMISATION Phase 2.2 : useCallback pour handleSubmit (évite re-création fonction)
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    console.log('📝 [AddPositionForm] Soumission du formulaire avec:', formData);

    try {
      // Validation
      if (!formData.ticker || !formData.quantite || !formData.prixEntree) {
        console.error('❌ [AddPositionForm] Validation échouée');
        throw new Error('Veuillez remplir tous les champs obligatoires');
      }

      const position = {
        entreprise: formData.entreprise || formData.ticker,
        ticker: formData.ticker.toUpperCase().trim(),
        quantite: parseFloat(formData.quantite),
        prixEntree: parseFloat(formData.prixEntree),
        dateAchat: formData.dateAchat
      };
      
      console.log('✅ [AddPositionForm] Position préparée:', position);
      console.log('🔄 [AddPositionForm] Appel addPosition...');

      const result = await addPosition(position);
      console.log('🎉 [AddPositionForm] Position ajoutée avec succès:', result);
      
      // Toast succès
      showToast(`${position.ticker} ajouté au portfolio`, 'success');
      console.log('📢 [AddPositionForm] Toast affiché');
      
      // Reset form
      setFormData({
        entreprise: '',
        ticker: '',
        quantite: '',
        prixEntree: '',
        dateAchat: new Date().toISOString().split('T')[0]
      });
      console.log('🔄 [AddPositionForm] Formulaire réinitialisé');
      
      onClose();
      console.log('🚪 [AddPositionForm] Formulaire fermé');
    } catch (err) {
      console.error('❌ [AddPositionForm] Erreur:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      console.log('⏹️ [AddPositionForm] Fin du processus');
    }
  }, [formData, addPosition, showToast, onClose]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Ajouter une position</h3>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Ticker <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formData.ticker}
            onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
            placeholder="AAPL, MSFT, TSLA..."
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Entreprise (optionnel)
          </label>
          <input
            type="text"
            value={formData.entreprise}
            onChange={(e) => setFormData({ ...formData, entreprise: e.target.value })}
            placeholder="Apple Inc."
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Quantité <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={formData.quantite}
            onChange={(e) => setFormData({ ...formData, quantite: e.target.value })}
            placeholder="50"
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Prix d'achat (€) <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={formData.prixEntree}
            onChange={(e) => setFormData({ ...formData, prixEntree: e.target.value })}
            placeholder="145.30"
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Date d'achat
          </label>
          <input
            type="date"
            value={formData.dateAchat}
            onChange={(e) => setFormData({ ...formData, dateAchat: e.target.value })}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
        >
          {loading ? 'Ajout en cours...' : 'Ajouter'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          Annuler
        </button>
      </div>
    </form>
  );
});

AddPositionForm.displayName = 'AddPositionForm';

export default AddPositionForm;

