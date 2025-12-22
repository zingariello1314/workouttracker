/**
 * Formulaire d'ajout de position boursière
 * 
 * ✅ OPTIMISATION Phase 2.2 : Memoization Composants et Props
 * - useCallback pour handlers (évite re-création fonctions)
 * - Réduction re-renders inutiles
 * 
 * ✅ PHASE 3 - Étape 3.18 : Validation complète avec Zod
 * - Validation robuste tous champs (ticker, quantite, prixEntree, dateAchat)
 * - Messages erreur détaillés par champ
 * - Validation en temps réel
 * - Protection contre valeurs invalides (NaN, Infinity, dates futures)
 * 
 * @module components/finance/bourse/AddPositionForm
 * @see docs/finance/ANALYSE_PROFONDE_SOUS_ONGLET_BOURSE.md - Solution 10
 */

import React, { useState, useCallback, memo } from 'react';
import { z } from 'zod';
import { useTranslation } from '../../../utils/translations';
import { useFinance } from '../../../context/FinanceContext';
import { useToast } from '../../ui/Toast';

// ✅ PHASE 3 - Étape 3.18 : Schéma Zod complet pour validation position
const positionSchema = z.object({
  ticker: z.string()
    .min(1, 'Le ticker est requis')
    .max(10, 'Le ticker ne peut pas dépasser 10 caractères')
    .regex(/^[A-Z0-9.]+$/, 'Le ticker doit contenir uniquement des lettres majuscules, chiffres et points')
    .refine((val) => val.trim().length > 0, 'Le ticker ne peut pas être vide'),
  entreprise: z.string()
    .max(100, 'Le nom de l\'entreprise ne peut pas dépasser 100 caractères')
    .optional()
    .or(z.literal('')),
  quantite: z.number({
    required_error: 'La quantité est requise',
    invalid_type_error: 'La quantité doit être un nombre'
  })
    .positive('La quantité doit être positive (supérieure à 0)')
    .finite('La quantité doit être un nombre valide (pas NaN ou Infinity)')
    .max(1000000, 'La quantité ne peut pas dépasser 1 000 000')
    .refine((val) => !isNaN(val) && isFinite(val), 'La quantité doit être un nombre valide'),
  prixEntree: z.number({
    required_error: 'Le prix d\'achat est requis',
    invalid_type_error: 'Le prix d\'achat doit être un nombre'
  })
    .positive('Le prix d\'achat doit être positif (supérieur à 0)')
    .finite('Le prix d\'achat doit être un nombre valide (pas NaN ou Infinity)')
    .max(1000000, 'Le prix d\'achat ne peut pas dépasser 1 000 000 €')
    .refine((val) => !isNaN(val) && isFinite(val), 'Le prix d\'achat doit être un nombre valide'),
  dateAchat: z.string()
    .min(1, 'La date d\'achat est requise')
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (attendu: YYYY-MM-DD)')
    .refine((date) => {
      const dateObj = new Date(date);
      return !isNaN(dateObj.getTime());
    }, 'Date invalide')
    .refine((date) => {
      const dateObj = new Date(date);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // Fin de journée aujourd'hui
      return dateObj <= today;
    }, 'La date d\'achat ne peut pas être dans le futur')
    .refine((date) => {
      const dateObj = new Date(date);
      const minDate = new Date('1900-01-01');
      return dateObj >= minDate;
    }, 'La date d\'achat doit être après 1900')
});

const AddPositionForm = memo(({ onClose }) => {
  const t = useTranslation();
  // ✅ PHASE 3.16 : Utiliser loading state centralisé au lieu de state local
  const { addPosition, loadingStates } = useFinance();
  const { showToast } = useToast();
  const [error, setError] = useState(null);
  
  // ✅ PHASE 3.16 : Utiliser loading state centralisé
  const loading = loadingStates?.adding || false;
  
  const [formData, setFormData] = useState({
    entreprise: '',
    ticker: '',
    quantite: '',
    prixEntree: '',
    dateAchat: new Date().toISOString().split('T')[0]
  });

  // ✅ PHASE 3 - Étape 3.18 : État pour erreurs de validation par champ
  const [fieldErrors, setFieldErrors] = useState({});

  // ✅ PHASE 3 - Étape 3.18 : Fonction de validation avec Zod
  const validateForm = useCallback((data) => {
    try {
      // Préparer données pour validation
      const dataToValidate = {
        ticker: data.ticker.toUpperCase().trim(),
        entreprise: data.entreprise || '',
        quantite: parseFloat(data.quantite),
        prixEntree: parseFloat(data.prixEntree),
        dateAchat: data.dateAchat
      };

      // Valider avec Zod
      const validated = positionSchema.parse(dataToValidate);
      
      // Réinitialiser erreurs si validation réussie
      setFieldErrors({});
      return { success: true, data: validated };
    } catch (err) {
      if (err instanceof z.ZodError) {
        // ✅ PHASE 3.18 : Extraire erreurs par champ
        const errors = {};
        err.errors.forEach((error) => {
          const field = error.path[0];
          if (field) {
            errors[field] = error.message;
          }
        });
        setFieldErrors(errors);
        
        // Message d'erreur global (première erreur)
        const firstError = err.errors[0];
        return { 
          success: false, 
          error: firstError ? firstError.message : 'Erreur de validation' 
        };
      }
      return { success: false, error: err.message || 'Erreur de validation' };
    }
  }, []);

  // ✅ OPTIMISATION Phase 2.2 : useCallback pour handleSubmit (évite re-création fonction)
  // ✅ PHASE 3.16 : Loading state géré par contexte (pas besoin de setLoading local)
  // ✅ PHASE 3 - Étape 3.18 : Validation complète avec Zod
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});
    // ✅ PHASE 3.16 : Loading state géré automatiquement par addPosition dans contexte
    
    console.log('📝 [AddPositionForm] Soumission du formulaire avec:', formData);

    try {
      // ✅ PHASE 3.18 : Validation complète avec Zod
      const validation = validateForm(formData);
      
      if (!validation.success) {
        console.error('❌ [AddPositionForm] Validation échouée:', validation.error);
        setError(validation.error);
        return;
      }

      const validatedData = validation.data;

      const position = {
        entreprise: validatedData.entreprise || validatedData.ticker,
        ticker: validatedData.ticker,
        quantite: validatedData.quantite,
        prixEntree: validatedData.prixEntree,
        dateAchat: validatedData.dateAchat
      };
      
      console.log('✅ [AddPositionForm] Position préparée (validée):', position);
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
      setFieldErrors({});
      console.log('🔄 [AddPositionForm] Formulaire réinitialisé');
      
      onClose();
      console.log('🚪 [AddPositionForm] Formulaire fermé');
    } catch (err) {
      console.error('❌ [AddPositionForm] Erreur:', err);
      setError(err.message || 'Une erreur est survenue lors de l\'ajout de la position');
      // ✅ PHASE 3.16 : Loading state géré automatiquement par addPosition dans contexte
    }
  }, [formData, addPosition, showToast, onClose, validateForm]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Ajouter une position</h3>
        <button
          type="button"
          onClick={onClose}
          className="gradient-button-premium gradient-button-premium-sm rounded-lg"
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
            onChange={(e) => {
              const newValue = e.target.value.toUpperCase();
              setFormData({ ...formData, ticker: newValue });
              // ✅ PHASE 3.18 : Validation en temps réel (optionnel, peut être désactivé pour performance)
              if (fieldErrors.ticker) {
                setFieldErrors(prev => ({ ...prev, ticker: undefined }));
              }
            }}
            placeholder="AAPL, MSFT, TSLA..."
            className={`w-full px-4 py-2 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 ${
              fieldErrors.ticker 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-slate-600 focus:ring-blue-500'
            }`}
            required
          />
          {fieldErrors.ticker && (
            <p className="mt-1 text-sm text-red-400">{fieldErrors.ticker}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Entreprise (optionnel)
          </label>
          <input
            type="text"
            value={formData.entreprise}
            onChange={(e) => {
              setFormData({ ...formData, entreprise: e.target.value });
              // ✅ PHASE 3.18 : Validation en temps réel (optionnel)
              if (fieldErrors.entreprise) {
                setFieldErrors(prev => ({ ...prev, entreprise: undefined }));
              }
            }}
            placeholder="Apple Inc."
            className={`w-full px-4 py-2 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 ${
              fieldErrors.entreprise 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-slate-600 focus:ring-blue-500'
            }`}
          />
          {fieldErrors.entreprise && (
            <p className="mt-1 text-sm text-red-400">{fieldErrors.entreprise}</p>
          )}
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
            onChange={(e) => {
              setFormData({ ...formData, quantite: e.target.value });
              // ✅ PHASE 3.18 : Validation en temps réel (optionnel)
              if (fieldErrors.quantite) {
                setFieldErrors(prev => ({ ...prev, quantite: undefined }));
              }
            }}
            placeholder="50"
            className={`w-full px-4 py-2 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 ${
              fieldErrors.quantite 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-slate-600 focus:ring-blue-500'
            }`}
            required
          />
          {fieldErrors.quantite && (
            <p className="mt-1 text-sm text-red-400">{fieldErrors.quantite}</p>
          )}
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
            onChange={(e) => {
              setFormData({ ...formData, prixEntree: e.target.value });
              // ✅ PHASE 3.18 : Validation en temps réel (optionnel)
              if (fieldErrors.prixEntree) {
                setFieldErrors(prev => ({ ...prev, prixEntree: undefined }));
              }
            }}
            placeholder="145.30"
            className={`w-full px-4 py-2 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 ${
              fieldErrors.prixEntree 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-slate-600 focus:ring-blue-500'
            }`}
            required
          />
          {fieldErrors.prixEntree && (
            <p className="mt-1 text-sm text-red-400">{fieldErrors.prixEntree}</p>
          )}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Date d'achat
          </label>
          <input
            type="date"
            value={formData.dateAchat}
            max={new Date().toISOString().split('T')[0]} // ✅ PHASE 3.18 : Empêcher sélection date future
            onChange={(e) => {
              setFormData({ ...formData, dateAchat: e.target.value });
              // ✅ PHASE 3.18 : Validation en temps réel (optionnel)
              if (fieldErrors.dateAchat) {
                setFieldErrors(prev => ({ ...prev, dateAchat: undefined }));
              }
            }}
            className={`w-full px-4 py-2 bg-slate-700 border rounded-lg text-white focus:outline-none focus:ring-2 ${
              fieldErrors.dateAchat 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-slate-600 focus:ring-blue-500'
            }`}
          />
          {fieldErrors.dateAchat && (
            <p className="mt-1 text-sm text-red-400">{fieldErrors.dateAchat}</p>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="gradient-button-premium gradient-button-premium-md rounded-lg flex-1"
        >
          {loading ? 'Ajout en cours...' : 'Ajouter'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="gradient-button-premium gradient-button-premium-sm gradient-button-premium-variant rounded-lg"
        >
          Annuler
        </button>
      </div>
    </form>
  );
});

AddPositionForm.displayName = 'AddPositionForm';

export default AddPositionForm;

