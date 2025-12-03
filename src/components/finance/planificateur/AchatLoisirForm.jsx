import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '../../../utils/translations';
import { usePlanificateur } from '../../../hooks/usePlanificateur';
import { FaisabiliteCalculator } from './FaisabiliteCalculator';

/**
 * Formulaire pour créer/modifier un achat loisir
 */
const AchatLoisirForm = ({ achat, budgetMensuel, onSave, onCancel }) => {
  const t = useTranslation();
  const { addAchatLoisir, updateAchatLoisir, calculateFaisabilite } = usePlanificateur();

  const [formData, setFormData] = useState({
    nom: '',
    photo: '',
    lien: '',
    prix: 0,
    moisCible: '',
    priorite: 'normal',
    notes: ''
  });

  const [errors, setErrors] = useState({});

  // Charger données si édition
  useEffect(() => {
    if (achat) {
      setFormData({
        nom: achat.nom || '',
        photo: achat.photo || '',
        lien: achat.lien || '',
        prix: achat.prix || 0,
        moisCible: achat.moisCible || '',
        priorite: achat.priorite || 'normal',
        notes: achat.notes || ''
      });
    } else {
      // Mois par défaut : mois prochain
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const defaultMonth = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`;
      setFormData(prev => ({ ...prev, moisCible: defaultMonth }));
    }
  }, [achat]);

  // Calcul faisabilité
  const faisabilite = useMemo(() => {
    if (!formData.moisCible || !formData.prix || formData.prix <= 0) return null;
    return calculateFaisabilite(formData, formData.moisCible);
  }, [formData, calculateFaisabilite]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis';
    }
    if (!formData.prix || formData.prix <= 0) {
      newErrors.prix = 'Le prix doit être supérieur à 0';
    }
    if (!formData.moisCible) {
      newErrors.moisCible = 'Le mois cible est requis';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const achatData = {
        ...formData,
        prix: parseFloat(formData.prix),
        statut: 'planifie',
        faisabilite: faisabilite,
        createdAt: achat?.createdAt || new Date().toISOString()
      };

      if (achat?.id) {
        await updateAchatLoisir({ ...achatData, id: achat.id });
      } else {
        await addAchatLoisir(achatData);
      }

      onSave();
    } catch (error) {
      console.error('Error saving achat:', error);
      setErrors({ submit: 'Erreur lors de l\'enregistrement' });
    }
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
      <h4 className="text-lg font-semibold text-white mb-4">
        {achat ? 'Modifier Achat' : 'Nouvel Achat Loisir'}
      </h4>

      {/* Nom */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Nom du produit *
        </label>
        <input
          type="text"
          value={formData.nom}
          onChange={(e) => {
            setFormData({ ...formData, nom: e.target.value });
            setErrors({ ...errors, nom: undefined });
          }}
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          placeholder="Ex: MacBook Pro, iPhone 15..."
          required
        />
        {errors.nom && <p className="text-red-400 text-xs mt-1">{errors.nom}</p>}
      </div>

      {/* Photo */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Photo (URL)
        </label>
        <input
          type="url"
          value={formData.photo}
          onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          placeholder="https://..."
        />
        {formData.photo && (
          <img src={formData.photo} alt={formData.nom} className="mt-2 w-32 h-32 object-cover rounded-lg" />
        )}
      </div>

      {/* Lien */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Lien (URL)
        </label>
        <input
          type="url"
          value={formData.lien}
          onChange={(e) => setFormData({ ...formData, lien: e.target.value })}
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          placeholder="https://..."
        />
      </div>

      {/* Prix */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Prix (€) *
        </label>
        <input
          type="number"
          value={formData.prix}
          onChange={(e) => {
            setFormData({ ...formData, prix: parseFloat(e.target.value) || 0 });
            setErrors({ ...errors, prix: undefined });
          }}
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          min="0"
          step="0.01"
          required
        />
        {errors.prix && <p className="text-red-400 text-xs mt-1">{errors.prix}</p>}
      </div>

      {/* Mois Cible */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Mois Cible *
        </label>
        <input
          type="month"
          value={formData.moisCible}
          onChange={(e) => {
            setFormData({ ...formData, moisCible: e.target.value });
            setErrors({ ...errors, moisCible: undefined });
          }}
          className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          required
        />
        {errors.moisCible && <p className="text-red-400 text-xs mt-1">{errors.moisCible}</p>}
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
          <option value="urgent">Urgent</option>
          <option value="normal">Normal</option>
          <option value="peut-attendre">Peut attendre</option>
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

      {/* Calcul Faisabilité */}
      {faisabilite && (
        <FaisabiliteCalculator
          faisabilite={faisabilite}
          prix={formData.prix}
          moisCible={formData.moisCible}
          budgetMensuel={budgetMensuel}
        />
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
        >
          {achat ? 'Modifier' : 'Enregistrer'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          Annuler
        </button>
      </div>

      {errors.submit && (
        <p className="text-red-400 text-sm text-center">{errors.submit}</p>
      )}
    </form>
  );
};

export default AchatLoisirForm;

