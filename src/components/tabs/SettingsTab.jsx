import React, { useState, useRef } from 'react';
import { Download, Upload, Settings, Database, FileText, AlertTriangle, CheckCircle, X, Save, RotateCcw } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { Input } from '../ui/Input';

const SettingsTab = () => {
  const { data, updateData, loadFromDB } = useWorkout();
  const [exportStatus, setExportStatus] = useState(null);
  const [importStatus, setImportStatus] = useState(null);
  const [importData, setImportData] = useState('');
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const fileInputRef = useRef(null);

  // Fonction pour exporter toutes les données
  const exportAllData = async () => {
    try {
      setExportStatus('loading');
      
      // Récupérer les données les plus récentes
      const currentData = await loadFromDB();
      const dataToExport = currentData || data;
      
      // Ajouter des métadonnées
      const exportObject = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        appName: 'Workout Tracker',
        data: dataToExport,
        metadata: {
          totalExercises: Object.keys(dataToExport.checkedExercises || {}).length,
          totalReps: Object.keys(dataToExport.reps || {}).length,
          totalStretches: Object.keys(dataToExport.checkedStretches || {}).length,
          progressPhotos: (dataToExport.progressPhotos || []).length,
          startDate: dataToExport.startDate,
          weekVariant: dataToExport.weekVariant
        }
      };

      // Créer le fichier JSON
      const jsonString = JSON.stringify(exportObject, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // Créer le lien de téléchargement
      const link = document.createElement('a');
      link.href = url;
      link.download = `workout-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportStatus('success');
      setTimeout(() => setExportStatus(null), 3000);
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'export:', error);
      setExportStatus('error');
      setTimeout(() => setExportStatus(null), 3000);
    }
  };

  // Fonction pour valider les données importées
  const validateImportData = (data) => {
    const errors = [];
    
    if (!data || typeof data !== 'object') {
      errors.push('Format de données invalide');
      return { isValid: false, errors };
    }

    // Vérifier la structure de base
    const requiredFields = ['checkedExercises', 'reps', 'checkedStretches'];
    requiredFields.forEach(field => {
      if (!(field in data) || typeof data[field] !== 'object') {
        errors.push(`Champ manquant ou invalide: ${field}`);
      }
    });

    // Vérifier les types
    if (data.progressPhotos && !Array.isArray(data.progressPhotos)) {
      errors.push('progressPhotos doit être un tableau');
    }

    if (data.weekVariant && typeof data.weekVariant !== 'string') {
      errors.push('weekVariant doit être une chaîne de caractères');
    }

    return {
      isValid: errors.length === 0,
      errors,
      stats: {
        exercises: Object.keys(data.checkedExercises || {}).length,
        reps: Object.keys(data.reps || {}).length,
        stretches: Object.keys(data.checkedStretches || {}).length,
        photos: (data.progressPhotos || []).length
      }
    };
  };

  // Fonction pour prévisualiser les données d'import
  const previewImport = () => {
    try {
      let parsedData;
      
      // Essayer de parser le JSON
      try {
        parsedData = JSON.parse(importData);
      } catch (parseError) {
        setImportStatus('error');
        return;
      }

      // Si c'est un export complet avec métadonnées, extraire les données
      const dataToValidate = parsedData.data || parsedData;
      
      const validation = validateImportData(dataToValidate);
      
      if (validation.isValid) {
        setPreviewData({
          data: dataToValidate,
          stats: validation.stats,
          isExportFormat: !!parsedData.data
        });
        setShowImportPreview(true);
        setImportStatus('preview');
      } else {
        console.error('Erreurs de validation:', validation.errors);
        setImportStatus('error');
      }
      
    } catch (error) {
      console.error('❌ Erreur lors de la prévisualisation:', error);
      setImportStatus('error');
    }
  };

  // Fonction pour confirmer l'import
  const confirmImport = async () => {
    try {
      setImportStatus('loading');
      
      // Utiliser les données du contexte plutôt que de recharger depuis la DB
      // Cela évite les appels multiples à openDB/loadFromDB
      const currentData = data || {};
      localStorage.setItem('workoutData_preImport_backup', JSON.stringify({
        data: currentData,
        backupDate: new Date().toISOString()
      }));

      // Importer les nouvelles données
      await updateData(previewData.data);
      
      setImportStatus('success');
      setShowImportPreview(false);
      setImportData('');
      setPreviewData(null);
      
      setTimeout(() => setImportStatus(null), 3000);
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'import:', error);
      setImportStatus('error');
      setTimeout(() => setImportStatus(null), 3000);
    }
  };

  // Fonction pour importer depuis un fichier
  const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setImportData(e.target.result);
    };
    reader.readAsText(file);
  };

  // Fonction pour restaurer la sauvegarde pré-import
  const restorePreImportBackup = async () => {
    try {
      const backup = localStorage.getItem('workoutData_preImport_backup');
      if (backup) {
        const parsedBackup = JSON.parse(backup);
        await updateData(parsedBackup.data);
        setImportStatus('restored');
        setTimeout(() => setImportStatus(null), 3000);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la restauration:', error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <Settings className="mr-3" size={28} />
          ⚙️ Paramètres & Sauvegarde
        </h2>
      </div>

      {/* Section Export */}
      <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Download className="mr-2" size={20} />
            Export des données
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-300 text-sm">
              Exportez toutes vos données d'entraînement au format JSON pour créer une sauvegarde complète.
            </p>
            
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="font-medium text-white mb-2">Données incluses :</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Exercices cochés : {Object.keys(data.checkedExercises || {}).length} entrées</li>
                <li>• Répétitions : {Object.keys(data.reps || {}).length} entrées</li>
                <li>• Étirements : {Object.keys(data.checkedStretches || {}).length} entrées</li>
                <li>• Photos de progression : {(data.progressPhotos || []).length} photos</li>
                <li>• Date de début : {data.startDate || 'Non définie'}</li>
                <li>• Variante de semaine : {data.weekVariant || 'A'}</li>
              </ul>
            </div>

            <Button
              onClick={exportAllData}
              disabled={exportStatus === 'loading'}
              icon={Download}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {exportStatus === 'loading' ? 'Export en cours...' : 'Exporter les données'}
            </Button>

            {exportStatus === 'success' && (
              <div className="flex items-center text-green-400 text-sm">
                <CheckCircle className="mr-2" size={16} />
                Export réussi ! Le fichier a été téléchargé.
              </div>
            )}

            {exportStatus === 'error' && (
              <div className="flex items-center text-red-400 text-sm">
                <AlertTriangle className="mr-2" size={16} />
                Erreur lors de l'export. Veuillez réessayer.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section Import */}
      <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Upload className="mr-2" size={20} />
            Import des données
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="text-yellow-400 mr-2 mt-0.5" size={16} />
                <div className="text-sm text-yellow-200">
                  <strong>Attention :</strong> L'import remplacera toutes vos données actuelles. 
                  Une sauvegarde automatique sera créée avant l'import.
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Importer depuis un fichier :
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileImport}
                  className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer cursor-pointer"
                />
              </div>

              <div className="text-center text-gray-400">ou</div>

              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Coller les données JSON :
                </label>
                <textarea
                  value={importData}
                  onChange={(e) => setImportData(e.target.value)}
                  placeholder="Collez ici le contenu JSON de votre sauvegarde..."
                  className="w-full h-32 px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={previewImport}
                disabled={!importData.trim() || importStatus === 'loading'}
                icon={FileText}
                variant="outline"
                className="flex-1"
              >
                Prévisualiser
              </Button>
              
              {localStorage.getItem('workoutData_preImport_backup') && (
                <Button
                  onClick={restorePreImportBackup}
                  icon={RotateCcw}
                  variant="outline"
                  className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10"
                >
                  Restaurer
                </Button>
              )}
            </div>

            {importStatus === 'error' && (
              <div className="flex items-center text-red-400 text-sm">
                <AlertTriangle className="mr-2" size={16} />
                Données JSON invalides. Vérifiez le format.
              </div>
            )}

            {importStatus === 'success' && (
              <div className="flex items-center text-green-400 text-sm">
                <CheckCircle className="mr-2" size={16} />
                Import réussi ! Vos données ont été mises à jour.
              </div>
            )}

            {importStatus === 'restored' && (
              <div className="flex items-center text-blue-400 text-sm">
                <CheckCircle className="mr-2" size={16} />
                Sauvegarde restaurée avec succès !
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de prévisualisation */}
      {showImportPreview && previewData && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg border border-slate-700 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Prévisualisation de l'import</h3>
                <Button
                  onClick={() => setShowImportPreview(false)}
                  variant="ghost"
                  size="sm"
                  icon={X}
                />
              </div>

              <div className="space-y-4">
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <h4 className="font-medium text-white mb-3">Statistiques des données :</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Exercices :</span>
                      <span className="text-white ml-2">{previewData.stats.exercises}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Répétitions :</span>
                      <span className="text-white ml-2">{previewData.stats.reps}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Étirements :</span>
                      <span className="text-white ml-2">{previewData.stats.stretches}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Photos :</span>
                      <span className="text-white ml-2">{previewData.stats.photos}</span>
                    </div>
                  </div>
                </div>

                {previewData.isExportFormat && (
                  <div className="bg-green-900/20 border border-green-600/30 rounded-lg p-3">
                    <div className="flex items-center text-green-400 text-sm">
                      <CheckCircle className="mr-2" size={16} />
                      Format d'export détecté - Données validées
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={() => setShowImportPreview(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={confirmImport}
                    disabled={importStatus === 'loading'}
                    icon={Save}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {importStatus === 'loading' ? 'Import en cours...' : 'Confirmer l\'import'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section Informations */}
      <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Database className="mr-2" size={20} />
            Informations de sauvegarde
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-300">
            <div className="flex justify-between">
              <span>Sauvegarde automatique :</span>
              <span className="text-green-400">✅ Activée (IndexedDB + localStorage)</span>
            </div>
            <div className="flex justify-between">
              <span>Fréquence de sauvegarde :</span>
              <span>Automatique (1 seconde après modification)</span>
            </div>
            <div className="flex justify-between">
              <span>Sauvegarde de secours :</span>
              <span className="text-blue-400">localStorage (en cas d'échec IndexedDB)</span>
            </div>
            <div className="flex justify-between">
              <span>Mécanisme de récupération :</span>
              <span>3 tentatives avec fallback automatique</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsTab;