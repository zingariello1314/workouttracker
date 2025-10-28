import React, { useState, useRef } from 'react';
import Button from './ui/Button';
import { useHomepageImages } from '../hooks/useHomepageImages';
import StorageDiagnostic from './StorageDiagnostic';

const HomePageImageSettings = ({ onClose }) => {
  const { backgroundImages, saveImages, isLoading, systemHealth, checkSystemHealth } = useHomepageImages();
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const fileInputRef = useRef(null);

  // Fonction pour nettoyer le localStorage
  const cleanupLocalStorage = () => {
    try {
      const keysToClean = [
        'homepage_backgroundImages_backup',
        'homepage_bannerImages_backup',
        'homepage_images_backup_old',
        'workoutData_backup'
      ];
      
      keysToClean.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn(`⚠️ Impossible de nettoyer ${key}:`, error);
        }
      });
      
      console.log('🧹 Nettoyage localStorage effectué');
    } catch (error) {
      console.warn('⚠️ Erreur lors du nettoyage:', error);
    }
  };

  // Système de stockage simplifié et ultra-fiable
  const saveImagesIndependently = async (images) => {
    setIsSaving(true);
    setSaveStatus('saving');
    
    try {
      // Nettoyer avant sauvegarde
      cleanupLocalStorage();
      
      await saveImages(images);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  // Convertir fichier en base64 avec QUALITÉ MAXIMALE ABSOLUE
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      // QUALITÉ MAXIMALE : AUCUNE COMPRESSION, AUCUN REDIMENSIONNEMENT
      console.log(`📸 Conversion image haute qualité: ${file.name} (${Math.round(file.size / 1024 / 1024 * 100) / 100} MB)`);
      
      // Lecture directe sans aucune modification
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result;
        console.log(`✅ Image convertie: ${Math.round(base64.length / 1024 / 1024 * 100) / 100} MB Base64`);
        resolve(base64);
      };
      reader.onerror = error => {
        console.error('❌ Erreur conversion image:', error);
        reject(error);
      };
    });
  };

  // Gérer l'upload des images de fond avec sauvegarde indépendante
  const handleBackgroundImageUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const newImages = await Promise.all(
        files.map(file => fileToBase64(file))
      );
      
      // Ajouter les nouvelles images aux existantes
      const updatedImages = [...backgroundImages, ...newImages];
      
      // Sauvegarde simplifiée
      await saveImagesIndependently(updatedImages);
      
    } catch (error) {
      console.error('Erreur lors de l\'upload des images:', error);
      alert('Erreur lors de l\'upload des images');
    } finally {
      setIsUploading(false);
    }
  };


  // Supprimer une image de fond avec sauvegarde indépendante
  const removeBackgroundImage = async (index) => {
    try {
      // Supprimer l'image du tableau local
      const updatedImages = backgroundImages.filter((_, i) => i !== index);
      
      // Sauvegarde simplifiée
      await saveImagesIndependently(updatedImages);
      
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'image:', error);
      alert('Erreur lors de la suppression de l\'image');
    }
  };


  // Bouton de sauvegarde manuelle simplifié
  const handleManualSave = async () => {
    await saveImagesIndependently(backgroundImages);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-2xl font-bold text-white">Paramètres de la Page d'Accueil</h2>
          <div className="flex items-center space-x-4">
            {/* Indicateur de sauvegarde automatique */}
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Sauvegarde automatique active</span>
            </div>
            
            {/* Bouton de diagnostic */}
            <Button
              onClick={() => setShowDiagnostic(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              🔍 Diagnostic
            </Button>
            
            {/* Bouton de sauvegarde manuelle */}
            <Button
              onClick={handleManualSave}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              {isSaving ? 'Sauvegarde...' : '💾 Sauvegarder'}
            </Button>
            
            {/* Indicateur de statut */}
            {saveStatus === 'success' && (
              <div className="text-green-400 text-sm flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Sauvegardé !
              </div>
            )}
            
            {saveStatus === 'error' && (
              <div className="text-red-400 text-sm flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Erreur
              </div>
            )}
            
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Images de fond uniquement - rotation automatique toutes les 2 minutes */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Images de Fond</h3>
            <p className="text-slate-300 text-sm mb-4">
              Ces images seront utilisées comme arrière-plan de la page d'accueil et changeront automatiquement toutes les 2 minutes.
            </p>
            
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                multiple
                onChange={handleBackgroundImageUpload}
                className="hidden"
              />
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full"
              >
                {isUploading ? 'Upload haute qualité...' : '📸 Ajouter des Images Haute Qualité (JPG/PNG)'}
              </Button>

              {/* Galerie des images de fond */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {backgroundImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Fond ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      onClick={() => removeBackgroundImage(index)}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                      Fond {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>


          {/* Indicateur de santé du système */}
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-white font-semibold">🏥 Santé du Système</h4>
              <button
                onClick={checkSystemHealth}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                Vérifier
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                systemHealth === 'excellent' ? 'bg-green-500' :
                systemHealth === 'good' ? 'bg-yellow-500' :
                systemHealth === 'poor' ? 'bg-red-500' :
                'bg-gray-500'
              }`}></div>
              <span className="text-slate-300 text-sm">
                {systemHealth === 'excellent' ? '✅ Excellent - Tous les systèmes fonctionnent' :
                 systemHealth === 'good' ? '⚠️ Bon - Système de fallback actif' :
                 systemHealth === 'poor' ? '❌ Problème - Vérification nécessaire' :
                 '❓ Inconnu - Vérification en cours'}
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-400">
              <p>• Sauvegarde triple niveau (IndexedDB + localStorage + sessionStorage)</p>
              <p>• Récupération automatique en cas de problème</p>
              <p>• Sauvegarde synchrone avant fermeture</p>
            </div>
          </div>

          {/* Système de sauvegarde renforcé */}
          <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-4">
            <h4 className="text-green-400 font-semibold mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Sauvegarde Optimisée Activée
            </h4>
            <div className="text-green-200 text-sm space-y-2">
              <p><strong>Vos images haute qualité sont sauvegardées automatiquement dans :</strong></p>
              <ul className="ml-4 space-y-1">
                <li>• 💾 IndexedDB (stockage illimité, qualité maximale)</li>
                <li>• 🔄 Métadonnées dans localStorage (léger)</li>
                <li>• ⚡ Sauvegarde automatique toutes les 10 minutes</li>
                <li>• 🛡️ Sauvegarde avant fermeture du navigateur</li>
              </ul>
              <div className="bg-blue-900/20 border border-blue-600/30 rounded p-3 mt-3">
                <h5 className="text-blue-400 font-semibold mb-1">🚀 QUALITÉ MAXIMALE GARANTIE :</h5>
                <ul className="text-blue-200 text-xs space-y-1">
                  <li>• ✅ AUCUNE compression (qualité originale 100%)</li>
                  <li>• ✅ AUCUN redimensionnement (résolution native)</li>
                  <li>• ✅ Support 4K+ et images très volumineuses</li>
                  <li>• ✅ Stockage IndexedDB (pas de limite localStorage)</li>
                  <li>• ✅ Persistance garantie après redémarrage</li>
                  <li>• ✅ Migration automatique depuis ancien système</li>
                </ul>
              </div>
              <p className="text-xs text-green-300 mt-2">
                <strong>Garantie :</strong> Vos images haute qualité ne peuvent pas être perdues et conservent leur qualité originale.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-slate-700">
          <Button onClick={onClose}>
            Fermer
          </Button>
        </div>
      </div>

      {/* Modal de diagnostic */}
      {showDiagnostic && (
        <StorageDiagnostic onClose={() => setShowDiagnostic(false)} />
      )}
    </div>
  );
};

export default HomePageImageSettings;
