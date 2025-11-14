/**
 * FoodPhotoScanner - Composant Reconnaissance Photo Aliments
 * 
 * Permet de détecter des aliments depuis une photo via TensorFlow.js MobileNet :
 * - Bouton photo avec animation pendant analyse
 * - Upload photo ou capture caméra (mobile)
 * - Analyse automatique de l'image
 * - Recherche automatique des données nutritionnelles
 * - Modal de confirmation avec édition possible
 * - Gestion erreurs et permissions
 * 
 * Architecture :
 * - Hook : `useNutritionFoodRecognition` (reconnaissance + enrichissement)
 * - Service : `nutritionFoodRecognition.js` (MobileNet + recherche)
 * - Performance : Lazy loading modèle, compression images, cache prédictions
 * 
 * @module components/tabs/nutrition/components/FoodPhotoScanner
 * @see ../../../../../nouvelongletnutritionplan.md Section 2.2
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Modal from '../../../ui/Modal';
import Button from '../../../ui/Button';
import Input from '../../../ui/Input';
import {
  Camera,
  Image as ImageIcon,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Edit2,
  Trash2,
  Search,
  Upload
} from 'lucide-react';
import { useNutritionFoodRecognition } from '../../../../hooks/useNutritionFoodRecognition';
import { useToast } from '../../../ui/Toast/ToastProvider';
import logger from '../../../../utils/logger';

const log = logger.module('FoodPhotoScanner');

/**
 * Composant FoodPhotoScanner
 * 
 * @param {Object} props
 * @param {Function} props.onFoodsSelected - Callback appelé avec les aliments sélectionnés
 * @param {boolean} props.autoEnrich - Enrichir automatiquement avec données nutritionnelles (défaut: true)
 * @param {number} props.minConfidence - Probabilité minimale (défaut: 0.3)
 * @param {string} props.variant - Variante bouton ('icon' | 'button' | 'full')
 */
const FoodPhotoScanner = ({
  onFoodsSelected,
  autoEnrich = true,
  minConfidence = 0.3,
  variant = 'button'
}) => {
  const { showSuccess, showError, showWarning } = useToast();
  const fileInputRef = useRef(null);
  const imagePreviewRef = useRef(null);
  const imagePreviewUrlRef = useRef(null); // ✅ OPTIMISATION : Ref pour tracker URL blob (cleanup)

  const {
    isAnalyzing,
    isLoadingModel,
    detectedFoods,
    enrichedFoods,
    error,
    isSupported,
    modelLoaded,
    analyzePhoto,
    reset,
    preloadModel
  } = useNutritionFoodRecognition({
    autoEnrich,
    minConfidence,
    onFoodsDetected: null // Gérer dans composant pour affichage modal
  });

  // État UI
  const [showModal, setShowModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [confirmedFoods, setConfirmedFoods] = useState([]);
  const [editingFood, setEditingFood] = useState(null);

  // Gérer aliments détectés (affichage modal)
  useEffect(() => {
    if (enrichedFoods.length > 0) {
      setConfirmedFoods(enrichedFoods);
      setShowConfirmationModal(true);
      setShowModal(false); // Fermer modal upload après détection
      log.debug('[FoodPhotoScanner] Aliments détectés, ouverture modal', { count: enrichedFoods.length });
    }
  }, [enrichedFoods]);

  // Gérer erreurs
  useEffect(() => {
    if (error && error !== 'Aucun aliment détecté dans l\'image') {
      // Erreur déjà affichée par le hook via toast
      log.warn('[FoodPhotoScanner] Erreur:', error);
    }
  }, [error]);

  // ✅ OPTIMISATION : Préchargement désactivé (lazy loading strict)
  // Le modèle sera chargé uniquement au premier clic, évitant warnings WebGL si fonctionnalité non utilisée
  // Pour réactiver préchargement, décommenter :
  // useEffect(() => {
  //   if (isSupported && !modelLoaded) {
  //     setTimeout(() => {
  //       preloadModel().catch(err => {
  //         log.debug('[FoodPhotoScanner] Erreur préchargement (non-critique):', err);
  //       });
  //     }, 2000); // Attendre 2s pour laisser l'app se charger
  //   }
  // }, [isSupported, modelLoaded, preloadModel]);

  // ✅ OPTIMISATION : Nettoyage URL blob à la fermeture (éviter memory leak)
  useEffect(() => {
    return () => {
      // Libérer URL preview si existe (via ref pour garantir nettoyage même si state change)
      if (imagePreviewUrlRef.current && imagePreviewUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrlRef.current);
        imagePreviewUrlRef.current = null;
      }
    };
  }, []); // Cleanup seulement au démontage

  /**
   * Ouvrir le sélecteur de fichiers
   */
  const handleOpenPicker = useCallback(() => {
    if (!isSupported) {
      showError('Reconnaissance photo non supportée', 'Votre navigateur ne supporte pas TensorFlow.js');
      return;
    }

    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [isSupported, showError]);

  /**
   * Gérer sélection fichier
   */
  const handleFileSelected = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Valider fichier
    if (!file.type.startsWith('image/')) {
      showError('Format non supporté', 'Veuillez sélectionner une image (JPEG, PNG)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB max
      showError('Fichier trop volumineux', 'Veuillez sélectionner une image de moins de 10MB');
      return;
    }

    try {
      // ✅ OPTIMISATION : Libérer ancienne URL avant de créer nouvelle
      if (imagePreviewUrlRef.current && imagePreviewUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrlRef.current);
      }
      
      // Créer preview
      const previewUrl = URL.createObjectURL(file);
      imagePreviewUrlRef.current = previewUrl; // ✅ Tracker URL dans ref
      setImagePreview(previewUrl);
      setSelectedImage(file);
      setShowModal(true);
      setConfirmedFoods([]);
      setShowConfirmationModal(false);

      // Analyser automatiquement
      log.debug('[FoodPhotoScanner] Analyse photo démarrée');
      await analyzePhoto(file);
    } catch (error) {
      log.error('[FoodPhotoScanner] Erreur traitement fichier:', error);
      showError('Erreur lors du traitement de l\'image', error.message);
    } finally {
      // Réinitialiser input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [analyzePhoto, showError]);

  /**
   * Réanalyser l'image
   */
  const handleReanalyze = useCallback(async () => {
    if (!selectedImage) return;

    reset();
    setConfirmedFoods([]);
    setShowConfirmationModal(false);

    try {
      await analyzePhoto(selectedImage);
    } catch (error) {
      log.error('[FoodPhotoScanner] Erreur réanalyse:', error);
      showError('Erreur lors de la réanalyse', error.message);
    }
  }, [selectedImage, analyzePhoto, reset, showError]);

  /**
   * Fermer modal upload
   */
  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    reset();
    setConfirmedFoods([]);
    
    // ✅ OPTIMISATION : Libérer URL via ref (plus fiable que state)
    // Délai pour laisser l'image se décharger du DOM
    setTimeout(() => {
      if (imagePreviewUrlRef.current && imagePreviewUrlRef.current.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreviewUrlRef.current);
        imagePreviewUrlRef.current = null;
      }
      setImagePreview(null);
      setSelectedImage(null);
    }, 300);
  }, [reset]);

  /**
   * Éditer un aliment
   */
  const handleEditFood = useCallback((food) => {
    setEditingFood(food);
  }, []);

  /**
   * Sauvegarder modification aliment
   */
  const handleSaveFoodEdit = useCallback((updatedFood) => {
    setConfirmedFoods(prev => 
      prev.map(f => f.id === updatedFood.id ? updatedFood : f)
    );
    setEditingFood(null);
  }, []);

  /**
   * Supprimer un aliment
   */
  const handleRemoveFood = useCallback((foodId) => {
    setConfirmedFoods(prev => prev.filter(f => f.id !== foodId));
  }, []);

  /**
   * Mettre à jour un aliment
   */
  const handleUpdateFood = useCallback((foodId, field, value) => {
    setConfirmedFoods(prev => 
      prev.map(f => {
        if (f.id === foodId) {
          const updated = { ...f, [field]: value };
          
          // Recalculer calories si quantité modifiée
          if (field === 'quantity' && updated.caloriesPer100) {
            updated.caloriesPer100 = (updated.caloriesPer100 * value) / 100;
          }
          
          return updated;
        }
        return f;
      })
    );
  }, []);

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

    log.debug('[FoodPhotoScanner] Confirmation aliments', { count: validFoods.length });

    // Appeler callback
    if (onFoodsSelected) {
      onFoodsSelected(validFoods);
    }

    // Réinitialiser
    reset();
    setShowConfirmationModal(false);
    setConfirmedFoods([]);
    setEditingFood(null);
    handleCloseModal();

    showSuccess('Aliments ajoutés', `${validFoods.length} aliment(s) ajouté(s) avec succès`);
  }, [confirmedFoods, onFoodsSelected, reset, showSuccess, showWarning, handleCloseModal]);

  /**
   * Annuler et fermer
   */
  const handleCancel = useCallback(() => {
    reset();
    setShowConfirmationModal(false);
    setConfirmedFoods([]);
    setEditingFood(null);
    handleCloseModal();
  }, [reset, handleCloseModal]);

  // Si non supporté, cacher complètement
  if (!isSupported && variant !== 'full') {
    return null;
  }

  // Rendu bouton selon variant
  const renderButton = () => {
    if (variant === 'icon') {
      return (
        <button
          onClick={handleOpenPicker}
          disabled={isAnalyzing || isLoadingModel}
          className="flex items-center justify-center p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Scanner une photo d'aliments"
        >
          {isAnalyzing || isLoadingModel ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Camera size={18} />
          )}
        </button>
      );
    }

    if (variant === 'button') {
      return (
        <Button
          type="button"
          variant="default"
          size="sm"
          onClick={handleOpenPicker}
          disabled={isAnalyzing || isLoadingModel}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isAnalyzing || isLoadingModel ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Analyse...
            </>
          ) : (
            <>
              <Camera size={16} className="mr-2" />
              Scanner photo
            </>
          )}
        </Button>
      );
    }

    // variant === 'full'
    return (
      <div className="w-full">
        <Button
          type="button"
          variant="default"
          size="md"
          onClick={handleOpenPicker}
          disabled={isAnalyzing || isLoadingModel}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isAnalyzing || isLoadingModel ? (
            <>
              <Loader2 size={18} className="mr-2 animate-spin" />
              Analyse en cours...
            </>
          ) : (
            <>
              <Camera size={18} className="mr-2" />
              Scanner une photo d'aliments
            </>
          )}
        </Button>
        <p className="text-xs text-slate-400 mt-2 text-center">
          Prenez une photo de votre assiette pour détecter automatiquement les aliments
        </p>
      </div>
    );
  };

  return (
    <>
      {/* Input fichier caché */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelected}
        className="hidden"
      />

      {/* Bouton principal */}
      {renderButton()}

      {/* Modal Upload/Preview */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title="Scanner Photo Aliments"
        size="lg"
      >
        <div className="space-y-4">
          {/* Preview image */}
          {imagePreview && (
            <div className="relative w-full h-64 rounded-lg overflow-hidden bg-slate-800">
              <img
                ref={imagePreviewRef}
                src={imagePreview}
                alt="Preview"
                className="w-full h-full object-contain"
              />
              {isAnalyzing && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-12 h-12 mx-auto mb-2 animate-spin text-blue-400" />
                    <p className="text-white font-medium">
                      {isLoadingModel ? 'Chargement modèle...' : 'Analyse en cours...'}
                    </p>
                    <p className="text-sm text-slate-300 mt-1">
                      Détection des aliments dans l'image
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Boutons actions */}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleOpenPicker}
              disabled={isAnalyzing || isLoadingModel}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <Upload size={16} className="mr-2" />
              Changer photo
            </Button>
            {selectedImage && !isAnalyzing && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReanalyze}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                <Search size={16} className="mr-2" />
                Réanalyser
              </Button>
            )}
          </div>

          {/* Erreur */}
          {error && error.includes('Aucun aliment') && (
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-sm">
              <AlertCircle size={16} className="inline mr-2" />
              {error}
            </div>
          )}
        </div>
      </Modal>

      {/* Modal Confirmation Aliments */}
      <Modal
        isOpen={showConfirmationModal}
        onClose={handleCancel}
        title="Aliments Détectés"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-slate-300 text-sm">
            {confirmedFoods.length} aliment{confirmedFoods.length > 1 ? 's' : ''} détecté{confirmedFoods.length > 1 ? 's' : ''} dans l'image.
            Vérifiez et ajustez les quantités si nécessaire.
          </p>

          {/* Liste aliments */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {confirmedFoods.map((food) => (
              <div
                key={food.id}
                className="p-3 rounded-lg bg-slate-800 border border-slate-700"
              >
                {editingFood?.id === food.id ? (
                  // Mode édition
                  <div className="space-y-2">
                    <Input
                      value={food.name || ''}
                      onChange={(e) => handleUpdateFood(food.id, 'name', e.target.value)}
                      placeholder="Nom de l'aliment"
                      className="bg-slate-900 border-slate-600 text-slate-100"
                    />
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={food.quantity || 100}
                        onChange={(e) => handleUpdateFood(food.id, 'quantity', parseFloat(e.target.value) || 0)}
                        placeholder="Quantité"
                        className="bg-slate-900 border-slate-600 text-slate-100"
                      />
                      <select
                        value={food.unit || 'g'}
                        onChange={(e) => handleUpdateFood(food.id, 'unit', e.target.value)}
                        className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-slate-100 text-sm"
                      >
                        <option value="g">g</option>
                        <option value="ml">ml</option>
                        <option value="unité">unité</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={() => handleSaveFoodEdit(food)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle size={14} className="mr-1" />
                        Valider
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingFood(null)}
                        className="border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        <X size={14} className="mr-1" />
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Mode affichage
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-slate-100">{food.name}</h4>
                        {food.confidence && (
                          <span className="text-xs text-slate-400">
                            ({Math.round(food.confidence * 100)}% confiance)
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-slate-400">
                        {food.quantity} {food.unit}
                        {food.caloriesPer100 > 0 && (
                          <span className="ml-2">
                            • {Math.round((food.caloriesPer100 * food.quantity) / 100)} kcal
                          </span>
                        )}
                      </div>
                      {food.caloriesPer100 > 0 && (
                        <div className="mt-1 text-xs text-slate-500">
                          {food.caloriesPer100} kcal/100g • {food.proteinPer100}g protéines • {food.carbsPer100}g glucides • {food.fatPer100}g lipides
                        </div>
                      )}
                      {food.caloriesPer100 === 0 && (
                        <div className="mt-1 text-xs text-yellow-400">
                          Données nutritionnelles non disponibles
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditFood(food)}
                        className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200"
                        title="Modifier"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleRemoveFood(food.id)}
                        className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400"
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-700">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <X size={16} className="mr-2" />
              Annuler
            </Button>
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleConfirm}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={confirmedFoods.length === 0}
            >
              <CheckCircle size={16} className="mr-2" />
              Ajouter {confirmedFoods.length > 0 && `(${confirmedFoods.length})`}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default FoodPhotoScanner;

