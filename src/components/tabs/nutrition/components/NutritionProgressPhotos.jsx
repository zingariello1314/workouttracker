/**
 * NutritionProgressPhotos - Composant Photos de Progression Nutrition (Avant/Après)
 * 
 * Affiche :
 * - Galerie des séquences avant/après
 * - Slider interactif pour comparaison (style Instagram)
 * - Formulaire d'ajout de photos (avant/après)
 * - Métadonnées (poids, mesures, notes)
 * - Gestion des séquences (création, suppression)
 * 
 * Architecture :
 * - Hook : `useNutritionProgressPhotos` (état + méthodes)
 * - Service : `nutritionProgressPhotos.js` (CRUD IndexedDB)
 * - Compression : Multi-résolution (thumbnail + full) optimisée
 * - Performance : Lazy loading, traitement async non-bloquant
 * 
 * @module components/tabs/nutrition/components/NutritionProgressPhotos
 * @see ../../../../../nouvelongletnutritionplan.md Section 6.2
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import Button from '../../../ui/Button';
import Input from '../../../ui/Input';
import {
  Camera,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
  Scale,
  Ruler,
  FileText,
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  ArrowRight,
  X,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useNutritionProgressPhotos } from '../../../../hooks/useNutritionProgressPhotos';
import { PROGRESS_PHOTO_TYPES } from '../../../../services/nutrition/nutritionProgressPhotos';
import { useToast } from '../../../ui/Toast/ToastProvider';
import logger from '../../../../utils/logger';

const log = logger.module('NutritionProgressPhotos');

/**
 * Formatage date pour affichage
 */
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Formatage date courte (YYYY-MM-DD)
 */
const formatDateShort = (dateString) => {
  if (!dateString) return '';
  return dateString; // Déjà au format YYYY-MM-DD
};

/**
 * Composant Slider Avant/Après (Style Instagram)
 * 
 * ✅ OPTIMISATION : Utilise CSS clip-path pour performance maximale
 * - Pas de manipulation DOM lourde
 * - Animation fluide 60fps
 * - Responsive et accessible
 */
const BeforeAfterSlider = ({ beforePhoto, afterPhoto, size = 500 }) => {
  const [sliderPosition, setSliderPosition] = useState(50); // 0-100
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const sliderRef = useRef(null);

  // Gestion drag souris
  const handleMouseDown = useCallback((e) => {
    setIsDragging(true);
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Gestion drag touch (mobile)
  const handleTouchMove = useCallback((e) => {
    if (!isDragging || !containerRef.current) return;
    
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  }, [isDragging]);

  // Événements globaux pour drag
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  // Obtenir URL image (thumbnail ou full selon besoin)
  const getImageUrl = (photo, type = 'full') => {
    if (!photo) return null;
    
    // Format v3.0 : objet { full, thumbnail }
    if (photo.thumbnail && type === 'thumbnail') {
      return photo.thumbnail;
    }
    if (photo.data) {
      return photo.data;
    }
    
    // Format v2.0 ou ancien : string directe
    if (typeof photo === 'string') {
      return photo;
    }
    
    return null;
  };

  const beforeUrl = getImageUrl(beforePhoto, 'full');
  const afterUrl = getImageUrl(afterPhoto, 'full');

  if (!beforeUrl || !afterUrl) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-slate-900 rounded-lg border border-slate-700">
        <div className="text-center text-slate-400">
          <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
          <p>Photos avant/après nécessaires pour comparaison</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative bg-slate-900 rounded-lg border border-slate-700 overflow-hidden"
      style={{ height: size, maxHeight: '600px' }}
      onTouchStart={handleMouseDown}
    >
      {/* Photo AVANT (gauche) - visible selon sliderPosition */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
          transition: isDragging ? 'none' : 'clip-path 0.1s ease-out'
        }}
      >
        <img
          src={beforeUrl}
          alt="Avant"
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Overlay "AVANT" */}
        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded text-white text-sm font-semibold flex items-center gap-2">
          <ArrowLeft size={16} />
          Avant
          {beforePhoto?.date && (
            <span className="text-xs text-slate-300 font-normal ml-2">
              {formatDateShort(beforePhoto.date)}
            </span>
          )}
        </div>
      </div>

      {/* Photo APRÈS (droite) - toujours visible */}
      <div className="absolute inset-0">
        <img
          src={afterUrl}
          alt="Après"
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {/* Overlay "APRÈS" */}
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded text-white text-sm font-semibold flex items-center gap-2">
          Après
          {afterPhoto?.date && (
            <span className="text-xs text-slate-300 font-normal mr-2">
              {formatDateShort(afterPhoto.date)}
            </span>
          )}
          <ArrowRight size={16} />
        </div>
      </div>

      {/* Ligne de séparation interactive */}
      <div
        ref={sliderRef}
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-col-resize z-10 flex items-center justify-center"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        onMouseDown={handleMouseDown}
      >
        {/* Bouton slider */}
        <div className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-transform">
          <div className="flex items-center gap-0.5">
            <ChevronLeft size={16} className="text-slate-800" />
            <div className="w-0.5 h-4 bg-slate-800 rounded"></div>
            <ChevronRight size={16} className="text-slate-800" />
          </div>
        </div>
      </div>

      {/* Contrôles slider (desktop) */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/60 backdrop-blur-sm rounded-full px-4 py-2">
        <input
          type="range"
          min="0"
          max="100"
          value={sliderPosition}
          onChange={(e) => setSliderPosition(Number(e.target.value))}
          className="w-64 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider-range"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${sliderPosition}%, #475569 ${sliderPosition}%, #475569 100%)`
          }}
        />
      </div>
    </div>
  );
};

/**
 * Composant principal NutritionProgressPhotos
 */
const NutritionProgressPhotos = () => {
  const { showSuccess, showError, showWarning } = useToast();
  
  const {
    photos,
    sequences,
    loading,
    error,
    dbReady,
    addPhoto,
    deletePhoto,
    updatePhoto,
    deleteSequence,
    loadPhotos,
    loadSequences
  } = useNutritionProgressPhotos({ autoLoad: true });

  // État UI
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSequence, setSelectedSequence] = useState(null);
  const [viewingSequence, setViewingSequence] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Formulaire ajout photo
  const [formData, setFormData] = useState({
    type: PROGRESS_PHOTO_TYPES.BEFORE,
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
    weight: '',
    measurements: {
      waist: '',
      chest: '',
      hips: ''
    },
    notes: '',
    sequenceId: null // Généré si null
  });

  const fileInputRef = useRef(null);

  // Charger séquences au démarrage
  useEffect(() => {
    if (dbReady && sequences.length === 0) {
      loadSequences();
    }
  }, [dbReady, sequences.length, loadSequences]);

  /**
   * Gère sélection fichier
   */
  const handleFileSelect = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Valider type fichier
    if (!file.type.startsWith('image/')) {
      showError('Format invalide', 'Veuillez sélectionner une image (JPEG, PNG, WebP)');
      return;
    }

    // Valider taille (max 20MB)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      showError('Fichier trop volumineux', 'Taille maximale : 20 MB');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // Ajouter photo avec progression
      const photo = await addPhoto(file, {
        ...formData,
        date: formData.date || new Date().toISOString().split('T')[0]
      }, {
        onProgress: (progress, message) => {
          setUploadProgress(progress);
          log.debug('[handleFileSelect] Progression upload', { progress, message });
        }
      });

      if (photo) {
        showSuccess('Photo ajoutée', 'La photo a été ajoutée avec succès');
        
        // Recharger séquences
        await loadSequences();
        
        // Réinitialiser formulaire
        setFormData({
          type: PROGRESS_PHOTO_TYPES.AFTER, // Prochaine sera "après"
          date: new Date().toISOString().split('T')[0],
          weight: '',
          measurements: { waist: '', chest: '', hips: '' },
          notes: '',
          sequenceId: photo.sequenceId // Utiliser même sequenceId pour avant/après
        });
        
        setShowAddForm(false);
        setUploadProgress(0);
        
        // Sélectionner la séquence créée/mise à jour
        if (photo.sequenceId) {
          const updatedSequences = await loadSequences();
          const sequence = updatedSequences.find(s => s.sequenceId === photo.sequenceId);
          if (sequence) {
            setSelectedSequence(sequence);
          }
        }
      }
    } catch (err) {
      log.error('[handleFileSelect] Erreur ajout photo:', err);
      showError('Erreur ajout photo', err.message || 'Erreur lors de l\'ajout de la photo');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      
      // Réinitialiser input fichier
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [formData, addPhoto, loadSequences, showSuccess, showError]);

  /**
   * Gère suppression photo
   */
  const handleDeletePhoto = useCallback(async (photoId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette photo ?')) {
      return;
    }

    try {
      await deletePhoto(photoId);
      showSuccess('Photo supprimée', 'La photo a été supprimée avec succès');
      
      // Recharger séquences
      await loadSequences();
    } catch (err) {
      log.error('[handleDeletePhoto] Erreur suppression photo:', err);
      showError('Erreur suppression', err.message || 'Erreur lors de la suppression');
    }
  }, [deletePhoto, loadSequences, showSuccess, showError]);

  /**
   * Gère suppression séquence complète
   */
  const handleDeleteSequence = useCallback(async (sequenceId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette séquence (avant + après) ?')) {
      return;
    }

    try {
      await deleteSequence(sequenceId);
      showSuccess('Séquence supprimée', 'La séquence a été supprimée avec succès');
      
      // Recharger séquences
      await loadSequences();
      
      // Réinitialiser sélection
      if (selectedSequence?.sequenceId === sequenceId) {
        setSelectedSequence(null);
        setViewingSequence(null);
      }
    } catch (err) {
      log.error('[handleDeleteSequence] Erreur suppression séquence:', err);
      showError('Erreur suppression', err.message || 'Erreur lors de la suppression');
    }
  }, [deleteSequence, loadSequences, selectedSequence, showSuccess, showError]);

  /**
   * Gère affichage comparaison
   */
  const handleViewComparison = useCallback((sequence) => {
    setViewingSequence(sequence);
  }, []);

  /**
   * Calcule différence de poids entre avant/après
   */
  const calculateWeightDifference = useCallback((sequence) => {
    if (!sequence?.before?.metadata?.weight || !sequence?.after?.metadata?.weight) {
      return null;
    }
    
    const before = parseFloat(sequence.before.metadata.weight);
    const after = parseFloat(sequence.after.metadata.weight);
    
    if (isNaN(before) || isNaN(after)) {
      return null;
    }
    
    const diff = after - before;
    const percent = ((diff / before) * 100).toFixed(1);
    
    return { diff, percent };
  }, []);

  // État de chargement
  if (!dbReady) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="text-center py-8">
          <Loader2 className="animate-spin text-blue-500 mx-auto mb-4" size={32} />
          <p className="text-slate-400">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Camera size={24} className="text-blue-400" />
              <CardTitle>Photos de Progression</CardTitle>
            </div>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              variant="primary"
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              Ajouter une photo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400 text-sm">
            Suivez votre progression visuelle avec des photos avant/après. Ajoutez vos photos pour visualiser vos changements.
          </p>
        </CardContent>
      </Card>

      {/* Erreur */}
      {error && (
        <Card className="bg-red-900/20 border-red-700">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle size={20} />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulaire ajout photo */}
      {showAddForm && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle>Ajouter une photo de progression</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Type photo */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Type de photo
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-200"
              >
                <option value={PROGRESS_PHOTO_TYPES.BEFORE}>Avant (Photo de départ)</option>
                <option value={PROGRESS_PHOTO_TYPES.AFTER}>Après (Photo de résultat)</option>
              </select>
              <p className="text-slate-500 text-xs mt-1">
                {formData.type === PROGRESS_PHOTO_TYPES.BEFORE
                  ? 'Photo prise au début de votre programme'
                  : 'Photo prise après votre progression'}
              </p>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Date de la photo
              </label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full"
                max={new Date().toISOString().split('T')[0]} // Pas de date future
              />
            </div>

            {/* Poids */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <Scale size={16} />
                Poids (kg) - Optionnel
              </label>
              <Input
                type="number"
                step="0.1"
                min="0"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                placeholder="Ex: 75.5"
                className="w-full"
              />
            </div>

            {/* Mesures */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <Ruler size={16} />
                Mesures (cm) - Optionnel
              </label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.measurements.waist}
                    onChange={(e) => setFormData({
                      ...formData,
                      measurements: { ...formData.measurements, waist: e.target.value }
                    })}
                    placeholder="Taille"
                    className="w-full"
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.measurements.chest}
                    onChange={(e) => setFormData({
                      ...formData,
                      measurements: { ...formData.measurements, chest: e.target.value }
                    })}
                    placeholder="Poitrine"
                    className="w-full"
                  />
                </div>
                <div>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={formData.measurements.hips}
                    onChange={(e) => setFormData({
                      ...formData,
                      measurements: { ...formData.measurements, hips: e.target.value }
                    })}
                    placeholder="Hanches"
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <FileText size={16} />
                Notes - Optionnel
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notes personnelles sur cette photo..."
                rows={3}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-200 placeholder-slate-500 resize-none"
              />
            </div>

            {/* Upload fichier */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Fichier image
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                disabled={uploading}
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Upload en cours... {uploadProgress}%
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    Choisir une image
                  </>
                )}
              </Button>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-2">
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-4">
              <Button
                onClick={() => setShowAddForm(false)}
                variant="outline"
                disabled={uploading}
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal comparaison */}
      {viewingSequence && (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Comparaison Avant/Après</CardTitle>
              <Button
                onClick={() => setViewingSequence(null)}
                variant="ghost"
                size="sm"
              >
                <X size={16} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Slider avant/après */}
            {viewingSequence.before && viewingSequence.after ? (
              <BeforeAfterSlider
                beforePhoto={viewingSequence.before}
                afterPhoto={viewingSequence.after}
                size={500}
              />
            ) : (
              <div className="text-center py-8 text-slate-400">
                <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
                <p>Photos avant et après nécessaires pour comparaison</p>
              </div>
            )}

            {/* Métadonnées comparaison */}
            {(viewingSequence.before || viewingSequence.after) && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700">
                {/* Photo AVANT */}
                {viewingSequence.before && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                      <ArrowLeft size={16} />
                      Avant - {formatDate(viewingSequence.before.date)}
                    </h4>
                    {viewingSequence.before.metadata?.weight && (
                      <div className="text-sm text-slate-400">
                        <Scale size={14} className="inline mr-1" />
                        Poids : {viewingSequence.before.metadata.weight} kg
                      </div>
                    )}
                    {viewingSequence.before.metadata?.measurements && (
                      <div className="text-sm text-slate-400">
                        <Ruler size={14} className="inline mr-1" />
                        Mesures : {Object.entries(viewingSequence.before.metadata.measurements)
                          .filter(([_, v]) => v)
                          .map(([k, v]) => `${k}: ${v}cm`)
                          .join(', ') || 'Aucune'}
                      </div>
                    )}
                    {viewingSequence.before.metadata?.notes && (
                      <div className="text-sm text-slate-400">
                        <FileText size={14} className="inline mr-1" />
                        {viewingSequence.before.metadata.notes}
                      </div>
                    )}
                  </div>
                )}

                {/* Photo APRÈS */}
                {viewingSequence.after && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                      <ArrowRight size={16} />
                      Après - {formatDate(viewingSequence.after.date)}
                    </h4>
                    {viewingSequence.after.metadata?.weight && (
                      <div className="text-sm text-slate-400">
                        <Scale size={14} className="inline mr-1" />
                        Poids : {viewingSequence.after.metadata.weight} kg
                      </div>
                    )}
                    {viewingSequence.after.metadata?.measurements && (
                      <div className="text-sm text-slate-400">
                        <Ruler size={14} className="inline mr-1" />
                        Mesures : {Object.entries(viewingSequence.after.metadata.measurements)
                          .filter(([_, v]) => v)
                          .map(([k, v]) => `${k}: ${v}cm`)
                          .join(', ') || 'Aucune'}
                      </div>
                    )}
                    {viewingSequence.after.metadata?.notes && (
                      <div className="text-sm text-slate-400">
                        <FileText size={14} className="inline mr-1" />
                        {viewingSequence.after.metadata.notes}
                      </div>
                    )}
                  </div>
                )}

                {/* Différence de poids */}
                {viewingSequence.before?.metadata?.weight && viewingSequence.after?.metadata?.weight && (
                  <div className="col-span-2 pt-4 border-t border-slate-700">
                    {(() => {
                      const weightDiff = calculateWeightDifference(viewingSequence);
                      if (!weightDiff) return null;
                      
                      const isPositive = weightDiff.diff > 0;
                      const Icon = isPositive ? TrendingUp : TrendingDown;
                      
                      return (
                        <div className="flex items-center gap-3">
                          <Icon size={20} className={isPositive ? 'text-green-400' : 'text-red-400'} />
                          <div>
                            <div className="text-sm font-semibold text-slate-300">
                              Différence de poids
                            </div>
                            <div className={`text-lg font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                              {isPositive ? '+' : ''}{weightDiff.diff.toFixed(1)} kg ({isPositive ? '+' : ''}{weightDiff.percent}%)
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2 pt-4 border-t border-slate-700">
              <Button
                onClick={() => handleDeleteSequence(viewingSequence.sequenceId)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 text-red-400 hover:text-red-300"
              >
                <Trash2 size={16} />
                Supprimer la séquence
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Galerie des séquences */}
      {loading && sequences.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="text-center py-8">
            <Loader2 className="animate-spin text-blue-500 mx-auto mb-4" size={32} />
            <p className="text-slate-400">Chargement des photos...</p>
          </CardContent>
        </Card>
      ) : sequences.length === 0 ? (
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="text-center py-8">
            <Camera size={64} className="text-slate-600 mx-auto mb-4 opacity-50" />
            <p className="text-slate-300 mb-2">Aucune photo de progression</p>
            <p className="text-slate-400 text-sm mb-4">
              Commencez par ajouter une photo "Avant" pour suivre votre progression.
            </p>
            <Button
              onClick={() => setShowAddForm(true)}
              variant="primary"
              className="flex items-center gap-2 mx-auto"
            >
              <Plus size={16} />
              Ajouter une photo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sequences.map((sequence) => {
            const weightDiff = calculateWeightDifference(sequence);
            const hasBoth = sequence.before && sequence.after;
            
            // Obtenir URL image (thumbnail pour galerie)
            const getThumbnailUrl = (photo) => {
              if (!photo) return null;
              if (photo.thumbnail) return photo.thumbnail;
              if (photo.data) return photo.data;
              if (typeof photo === 'string') return photo;
              return null;
            };

            const thumbnailUrl = sequence.after
              ? getThumbnailUrl(sequence.after)
              : sequence.before
              ? getThumbnailUrl(sequence.before)
              : null;

            return (
              <Card
                key={sequence.sequenceId}
                className={`bg-slate-800/50 border-slate-700 hover:border-blue-500 transition-colors cursor-pointer ${
                  selectedSequence?.sequenceId === sequence.sequenceId ? 'border-blue-500' : ''
                }`}
                onClick={() => setSelectedSequence(sequence)}
              >
                <CardContent className="p-0">
                  {/* Image thumbnail */}
                  {thumbnailUrl && (
                    <div className="relative aspect-[3/4] bg-slate-900 rounded-t-lg overflow-hidden">
                      <img
                        src={thumbnailUrl}
                        alt={`Progression ${formatDateShort(sequence.date)}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {/* Badge type */}
                      {hasBoth && (
                        <div className="absolute top-2 left-2 bg-green-500/80 backdrop-blur-sm px-2 py-1 rounded text-white text-xs font-semibold">
                          <CheckCircle size={12} className="inline mr-1" />
                          Complète
                        </div>
                      )}
                      {!hasBoth && (
                        <div className="absolute top-2 left-2 bg-yellow-500/80 backdrop-blur-sm px-2 py-1 rounded text-white text-xs font-semibold">
                          <AlertCircle size={12} className="inline mr-1" />
                          {sequence.before ? 'Avant seulement' : 'Après seulement'}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Infos séquence */}
                  <div className="p-4 space-y-3">
                    {/* Date */}
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Calendar size={14} />
                      {formatDate(sequence.date)}
                    </div>

                    {/* Poids */}
                    {sequence.before?.metadata?.weight && sequence.after?.metadata?.weight && weightDiff && (
                      <div className="flex items-center gap-2">
                        {weightDiff.diff > 0 ? (
                          <TrendingUp size={16} className="text-green-400" />
                        ) : (
                          <TrendingDown size={16} className="text-red-400" />
                        )}
                        <div className="text-sm">
                          <span className="text-slate-400">
                            {sequence.before.metadata.weight} kg
                          </span>
                          <span className="text-slate-500 mx-2">→</span>
                          <span className="text-slate-300 font-semibold">
                            {sequence.after.metadata.weight} kg
                          </span>
                          <span className={`ml-2 font-semibold ${
                            weightDiff.diff > 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            ({weightDiff.diff > 0 ? '+' : ''}{weightDiff.diff.toFixed(1)} kg)
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-700">
                      {hasBoth && (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewComparison(sequence);
                          }}
                          variant="primary"
                          size="sm"
                          className="flex-1 flex items-center justify-center gap-2"
                        >
                          <Eye size={14} />
                          Comparer
                        </Button>
                      )}
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSequence(sequence.sequenceId);
                        }}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default NutritionProgressPhotos;

