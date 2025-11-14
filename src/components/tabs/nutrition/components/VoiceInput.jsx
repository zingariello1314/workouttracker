/**
 * VoiceInput - Composant Saisie Vocale d'Aliments
 * 
 * Permet de saisir des aliments par la voix via Web Speech API :
 * - Bouton micro avec animation pulse pendant enregistrement
 * - Parsing automatique du transcript
 * - Recherche automatique des aliments
 * - Modal de confirmation avec édition possible
 * - Gestion erreurs et permissions
 * 
 * Architecture :
 * - Hook : `useNutritionVoiceInput` (reconnaissance vocale + parsing)
 * - Service : `nutritionVoiceInput.js` (Web Speech API + recherche)
 * - Performance : Debounce démarrage, gestion état optimisée
 * 
 * @module components/tabs/nutrition/components/VoiceInput
 * @see ../../../../../nouvelongletnutritionplan.md Section 2.1
 */

import React, { useState, useEffect, useCallback } from 'react';
import Modal from '../../../ui/Modal';
import Button from '../../../ui/Button';
import Input from '../../../ui/Input';
import {
  Mic,
  MicOff,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Edit2,
  Trash2,
  Search
} from 'lucide-react';
import { useNutritionVoiceInput } from '../../../../hooks/useNutritionVoiceInput';
import { useToast } from '../../../ui/Toast/ToastProvider';
import logger from '../../../../utils/logger';

const log = logger.module('VoiceInput');

/**
 * Composant VoiceInput
 * 
 * @param {Object} props
 * @param {Function} props.onFoodsSelected - Callback appelé avec les aliments sélectionnés
 * @param {boolean} props.autoSearch - Rechercher automatiquement les aliments (défaut: true)
 * @param {string} props.lang - Langue reconnaissance (défaut: 'fr-FR')
 * @param {string} props.variant - Variante bouton ('icon' | 'button' | 'full')
 */
const VoiceInput = ({
  onFoodsSelected,
  autoSearch = true,
  lang = 'fr-FR',
  variant = 'button'
}) => {
  const { showSuccess, showError, showWarning } = useToast();
  
  const {
    isListening,
    transcript,
    parsedFoods,
    searchedFoods,
    searching,
    error,
    isSupported,
    startListening,
    stopListening,
    clearTranscript,
    reset
  } = useNutritionVoiceInput({
    lang,
    autoSearch,
    onFoodsParsed: null // Gérer dans composant pour affichage modal
  });

  // État UI
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmedFoods, setConfirmedFoods] = useState([]);
  const [editingFood, setEditingFood] = useState(null);

  // Gérer aliments parsés (affichage modal)
  useEffect(() => {
    if (searchedFoods.length > 0) {
      setConfirmedFoods(searchedFoods);
      setShowConfirmationModal(true);
      log.debug('[VoiceInput] Aliments trouvés, ouverture modal', { count: searchedFoods.length });
    } else if (parsedFoods.length > 0 && !autoSearch) {
      // Si pas de recherche auto, afficher quand même les aliments parsés
      const foodsAsObjects = parsedFoods.map(f => ({
        id: `voice_${Date.now()}_${Math.random()}`,
        name: f.name,
        source: 'voice',
        quantity: f.quantity,
        unit: f.unit,
        caloriesPer100: 0,
        proteinPer100: 0,
        carbsPer100: 0,
        fatPer100: 0,
        needsManualInput: true
      }));
      setConfirmedFoods(foodsAsObjects);
      setShowConfirmationModal(true);
    }
  }, [searchedFoods, parsedFoods, autoSearch]);

  // Gérer erreurs
  useEffect(() => {
    if (error) {
      log.warn('[VoiceInput] Erreur:', error);
      
      // Ne pas afficher toast pour "no-speech" (timeout normal)
      if (error.includes('Aucune parole détectée')) {
        showWarning('Aucune parole détectée', 'Parlez plus fort ou vérifiez votre micro');
      } else if (error.includes('Permission micro')) {
        showError('Permission micro refusée', 'Veuillez autoriser l\'accès au micro dans les paramètres du navigateur');
      } else if (error.includes('non supportée')) {
        // Ne pas afficher toast si non supporté (bouton sera caché)
      } else {
        showError('Erreur reconnaissance vocale', error);
      }
    }
  }, [error, showError, showWarning]);

  /**
   * Démarrer l'enregistrement
   */
  const handleStart = useCallback(() => {
    if (!isSupported) {
      showError('Reconnaissance vocale non supportée', 'Votre navigateur ne supporte pas la reconnaissance vocale');
      return;
    }

    clearTranscript();
    setConfirmedFoods([]);
    setShowConfirmationModal(false);
    startListening();

    log.debug('[VoiceInput] Démarrage enregistrement');
  }, [isSupported, startListening, clearTranscript, showError]);

  /**
   * Arrêter l'enregistrement
   */
  const handleStop = useCallback(() => {
    stopListening();
    log.debug('[VoiceInput] Arrêt enregistrement');
  }, [stopListening]);

  /**
   * Confirmer et ajouter les aliments
   */
  const handleConfirm = useCallback(() => {
    if (confirmedFoods.length === 0) {
      showWarning('Aucun aliment à ajouter', 'Veuillez sélectionner ou ajouter des aliments');
      return;
    }

    // Filtrer aliments valides (avec nom)
    const validFoods = confirmedFoods.filter(f => f.name && f.name.trim().length > 0);

    if (validFoods.length === 0) {
      showWarning('Aliments invalides', 'Veuillez renseigner le nom de tous les aliments');
      return;
    }

    log.debug('[VoiceInput] Confirmation aliments', { count: validFoods.length });

    // Appeler callback
    if (onFoodsSelected) {
      onFoodsSelected(validFoods);
    }

    // Réinitialiser
    reset();
    setShowConfirmationModal(false);
    setConfirmedFoods([]);
    setEditingFood(null);

    showSuccess('Aliments ajoutés', `${validFoods.length} aliment(s) ajouté(s) avec succès`);
  }, [confirmedFoods, onFoodsSelected, reset, showSuccess, showWarning]);

  /**
   * Annuler et fermer
   */
  const handleCancel = useCallback(() => {
    reset();
    setShowConfirmationModal(false);
    setConfirmedFoods([]);
    setEditingFood(null);
    log.debug('[VoiceInput] Annulation');
  }, [reset]);

  /**
   * Modifier un aliment
   */
  const handleEditFood = useCallback((foodIndex) => {
    setEditingFood(foodIndex);
  }, []);

  /**
   * Mettre à jour un aliment
   */
  const handleUpdateFood = useCallback((foodIndex, field, value) => {
    setConfirmedFoods(foods => foods.map((f, idx) => {
      if (idx === foodIndex) {
        return { ...f, [field]: value };
      }
      return f;
    }));
    setEditingFood(null);
  }, []);

  /**
   * Supprimer un aliment
   */
  const handleRemoveFood = useCallback((foodIndex) => {
    setConfirmedFoods(foods => foods.filter((_, idx) => idx !== foodIndex));
    setEditingFood(null);
  }, []);

  // Cacher si non supporté
  if (!isSupported) {
    return null;
  }

  // Rendu bouton selon variant
  const renderButton = () => {
    const buttonContent = (
      <>
        {isListening ? (
          <>
            <div className="relative">
              <Mic size={variant === 'icon' ? 18 : 20} className="animate-pulse" />
              <div className="absolute inset-0 rounded-full bg-red-500/20 animate-ping" />
            </div>
            {variant !== 'icon' && (
              <span>{searching ? 'Recherche...' : 'Enregistrement...'}</span>
            )}
          </>
        ) : (
          <>
            <Mic size={variant === 'icon' ? 18 : 20} />
            {variant !== 'icon' && <span>Parler</span>}
          </>
        )}
      </>
    );

    if (variant === 'icon') {
      return (
        <Button
          onClick={isListening ? handleStop : handleStart}
          variant={isListening ? 'danger' : 'outline'}
          size="sm"
          className="flex items-center gap-2"
          title={isListening ? 'Arrêter l\'enregistrement' : 'Saisir par la voix'}
        >
          {buttonContent}
        </Button>
      );
    }

    if (variant === 'full') {
      return (
        <Button
          onClick={isListening ? handleStop : handleStart}
          variant={isListening ? 'danger' : 'primary'}
          size="md"
          className="w-full flex items-center justify-center gap-2"
          disabled={searching}
        >
          {buttonContent}
          {searching && <Loader2 size={16} className="animate-spin" />}
        </Button>
      );
    }

    // Variant 'button' (défaut)
    return (
      <Button
        onClick={isListening ? handleStop : handleStart}
        variant={isListening ? 'danger' : 'outline'}
        size="sm"
        className="flex items-center gap-2"
        disabled={searching}
      >
        {buttonContent}
        {searching && <Loader2 size={16} className="animate-spin" />}
      </Button>
    );
  };

  return (
    <>
      {/* Bouton micro */}
      {renderButton()}

      {/* Modal confirmation */}
      <Modal
        isOpen={showConfirmationModal}
        onClose={handleCancel}
        title="Confirmer les aliments (saisie vocale)"
        size="lg"
      >
        <div className="p-6 space-y-4">
          {/* Transcript */}
          {transcript && (
            <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
              <div className="flex items-start gap-2">
                <Mic size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-slate-400 mb-1">Ce que vous avez dit :</p>
                  <p className="text-sm text-slate-200 italic">"{transcript}"</p>
                </div>
              </div>
            </div>
          )}

          {/* Recherche en cours */}
          {searching && (
            <div className="flex items-center justify-center gap-2 p-4 bg-blue-900/20 rounded-lg border border-blue-700/30">
              <Loader2 size={20} className="animate-spin text-blue-400" />
              <span className="text-sm text-slate-300">Recherche des aliments en cours...</span>
            </div>
          )}

          {/* Liste aliments */}
          {confirmedFoods.length > 0 && !searching && (
            <div className="space-y-3">
              <p className="text-sm text-slate-400">
                {confirmedFoods.length} aliment(s) détecté(s). Vérifiez et modifiez si nécessaire :
              </p>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {confirmedFoods.map((food, index) => {
                  const isEditing = editingFood === index;
                  const needsManualInput = food.needsManualInput || !food.caloriesPer100;

                  return (
                    <div
                      key={food.id || index}
                      className={`p-4 rounded-lg border ${
                        needsManualInput
                          ? 'bg-yellow-900/20 border-yellow-700/50'
                          : 'bg-slate-800/50 border-slate-700'
                      }`}
                    >
                      {isEditing ? (
                        /* Mode édition */
                        <div className="space-y-3">
                          {/* Nom */}
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Nom de l'aliment</label>
                            <Input
                              type="text"
                              value={food.name || ''}
                              onChange={(e) => handleUpdateFood(index, 'name', e.target.value)}
                              className="bg-slate-900 border-slate-600 text-white text-sm"
                              placeholder="Ex: Poulet grillé"
                            />
                          </div>

                          {/* Quantité et Unité */}
                          <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-2">
                              <label className="block text-xs text-slate-400 mb-1">Quantité</label>
                              <Input
                                type="number"
                                value={food.quantity || 0}
                                onChange={(e) => handleUpdateFood(index, 'quantity', parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.1"
                                className="bg-slate-900 border-slate-600 text-white text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">Unité</label>
                              <select
                                value={food.unit || 'g'}
                                onChange={(e) => handleUpdateFood(index, 'unit', e.target.value)}
                                className="w-full px-2 py-2 bg-slate-900 border border-slate-600 rounded text-white text-sm"
                              >
                                <option value="g">g</option>
                                <option value="ml">ml</option>
                                <option value="mg">mg</option>
                                <option value="kg">kg</option>
                              </select>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 pt-2">
                            <Button
                              onClick={() => setEditingFood(null)}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              <CheckCircle size={14} />
                              Valider
                            </Button>
                          </div>
                        </div>
                      ) : (
                        /* Mode affichage */
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              {/* Nom */}
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-white text-sm">
                                  {food.name || 'Aliment sans nom'}
                                </h4>
                                {needsManualInput && (
                                  <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded">
                                    Recherche manuelle
                                  </span>
                                )}
                                {food.nutriScore && (
                                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                    food.nutriScore === 'A' ? 'bg-green-500/20 text-green-400' :
                                    food.nutriScore === 'B' ? 'bg-blue-500/20 text-blue-400' :
                                    food.nutriScore === 'C' ? 'bg-yellow-500/20 text-yellow-400' :
                                    food.nutriScore === 'D' ? 'bg-orange-500/20 text-orange-400' :
                                    'bg-red-500/20 text-red-400'
                                  }`}>
                                    Nutri-Score {food.nutriScore}
                                  </span>
                                )}
                              </div>

                              {/* Quantité */}
                              <div className="text-sm text-slate-400">
                                {food.quantity} {food.unit || 'g'}
                              </div>

                              {/* Nutrition */}
                              {!needsManualInput && food.caloriesPer100 > 0 && (
                                <div className="text-xs text-slate-500 mt-1">
                                  ~{Math.round((food.caloriesPer100 * food.quantity) / 100)} kcal • 
                                  P: {((food.proteinPer100 * food.quantity) / 100).toFixed(1)}g • 
                                  C: {((food.carbsPer100 * food.quantity) / 100).toFixed(1)}g • 
                                  L: {((food.fatPer100 * food.quantity) / 100).toFixed(1)}g
                                </div>
                              )}

                              {/* Message si recherche manuelle nécessaire */}
                              {needsManualInput && (
                                <div className="text-xs text-yellow-400 mt-1 flex items-center gap-1">
                                  <AlertCircle size={12} />
                                  Recherchez cet aliment manuellement pour obtenir les valeurs nutritionnelles
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1">
                              <Button
                                onClick={() => handleEditFood(index)}
                                variant="ghost"
                                size="sm"
                                className="p-1"
                                title="Modifier"
                              >
                                <Edit2 size={14} />
                              </Button>
                              <Button
                                onClick={() => handleRemoveFood(index)}
                                variant="ghost"
                                size="sm"
                                className="p-1 text-red-400 hover:text-red-300"
                                title="Supprimer"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Message si aucun aliment */}
          {confirmedFoods.length === 0 && !searching && transcript && (
            <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 text-center">
              <AlertCircle size={24} className="text-yellow-400 mx-auto mb-2" />
              <p className="text-sm text-slate-300 mb-1">Aucun aliment détecté</p>
              <p className="text-xs text-slate-400">
                Essayez de reformuler : "150 grammes de poulet et 200 grammes de riz"
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700">
            <Button
              onClick={handleCancel}
              variant="outline"
              className="text-slate-300 hover:text-white"
            >
              Annuler
            </Button>
            <Button
              onClick={handleConfirm}
              variant="primary"
              disabled={confirmedFoods.length === 0 || searching}
              className="flex items-center gap-2"
            >
              <CheckCircle size={16} />
              Ajouter {confirmedFoods.length > 0 && `(${confirmedFoods.length})`}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default VoiceInput;

