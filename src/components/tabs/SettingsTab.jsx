import React, { useState, useRef } from 'react';
import { Download, Upload, Settings, Database, FileText, AlertTriangle, CheckCircle, X, Save, RotateCcw, Image } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import { useGarminData } from '../../hooks/useGarminData';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import { Input } from '../ui/Input';
import HomePageImageSettings from '../HomePageImageSettings';

const SettingsTab = () => {
  const { data, updateData, loadFromDB } = useWorkout();
  const { exportAll: exportGarminData, importAll: importGarminData } = useGarminData();
  const [exportStatus, setExportStatus] = useState(null);
  const [importStatus, setImportStatus] = useState(null);
  const [importData, setImportData] = useState('');
  const [showImportPreview, setShowImportPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [showHomePageSettings, setShowHomePageSettings] = useState(false);
  const [garminExportStatus, setGarminExportStatus] = useState(null);
  const [garminImportStatus, setGarminImportStatus] = useState(null);
  const fileInputRef = useRef(null);

  // Fonction pour exporter spécifiquement les données de suivi corporel
  const exportBodyTrackingData = async () => {
    try {
      setExportStatus('loading');
      
      // Récupérer les données les plus récentes
      const currentData = await loadFromDB();
      const dataToExport = currentData || data;
      
      // Extraire uniquement les données de suivi corporel
      const bodyTrackingData = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        exportType: 'Body Tracking Data',
        appName: 'Workout Tracker - Suivi Corporel',
        
        // Données de suivi corporel
        progressPhotos: dataToExport.progressPhotos || [],
        progressEntries: dataToExport.progressEntries || [],
        bodyTrackingReminders: dataToExport.bodyTrackingReminders || [],
        bodyTrackingLastUpdated: dataToExport.bodyTrackingLastUpdated || null,
        
        // Métadonnées spécifiques au suivi corporel
        metadata: {
          totalPhotos: (dataToExport.progressPhotos || []).length,
          totalEntries: (dataToExport.progressEntries || []).length,
          totalReminders: (dataToExport.bodyTrackingReminders || []).length,
          lastUpdate: dataToExport.bodyTrackingLastUpdated || null,
          
          // Statistiques des photos
          photosWithWeight: (dataToExport.progressPhotos || []).filter(p => p.weight).length,
          photosWithNotes: (dataToExport.progressPhotos || []).filter(p => p.notes).length,
          photosWithMeasurements: (dataToExport.progressPhotos || []).filter(p => p.measurements && Object.keys(p.measurements).length > 0).length,
          
          // Statistiques des entrées
          entriesByType: (dataToExport.progressEntries || []).reduce((acc, entry) => {
            acc[entry.type] = (acc[entry.type] || 0) + 1;
            return acc;
          }, {}),
          
          // Période couverte
          dateRange: {
            earliest: (dataToExport.progressPhotos || []).concat(dataToExport.progressEntries || [])
              .map(item => item.date).sort()[0] || null,
            latest: (dataToExport.progressPhotos || []).concat(dataToExport.progressEntries || [])
              .map(item => item.date).sort().reverse()[0] || null
          },
          
          // Taille des données
          exportSize: JSON.stringify({
            progressPhotos: dataToExport.progressPhotos || [],
            progressEntries: dataToExport.progressEntries || [],
            bodyTrackingReminders: dataToExport.bodyTrackingReminders || []
          }).length
        }
      };

      // Créer le fichier JSON
      const jsonString = JSON.stringify(bodyTrackingData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // Créer le lien de téléchargement
      const link = document.createElement('a');
      link.href = url;
      link.download = `body-tracking-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportStatus('success');
      setTimeout(() => setExportStatus(null), 3000);
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'export du suivi corporel:', error);
      setExportStatus('error');
      setTimeout(() => setExportStatus(null), 3000);
    }
  };

  // Fonction pour exporter toutes les données
  const exportAllData = async () => {
    try {
      setExportStatus('loading');
      
      // Récupérer les données les plus récentes
      const currentData = await loadFromDB();
      const dataToExport = currentData || data;
      
      // Ajouter des métadonnées complètes
      const exportObject = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        appName: 'Workout Tracker',
        data: dataToExport,
        metadata: {
          // Données d'entraînement
          totalExercises: Object.keys(dataToExport.checkedExercises || {}).length,
          totalReps: Object.keys(dataToExport.reps || {}).length,
          totalStretches: Object.keys(dataToExport.checkedStretches || {}).length,
          historyReps: Object.keys(dataToExport.historyReps || {}).length,
          
          // Données de suivi corporel
          progressPhotos: (dataToExport.progressPhotos || []).length,
          progressEntries: (dataToExport.progressEntries || []).length,
          bodyTrackingReminders: (dataToExport.bodyTrackingReminders || []).length,
          bodyTrackingLastUpdated: dataToExport.bodyTrackingLastUpdated || null,
          
          // Statistiques détaillées du suivi corporel
          bodyTrackingStats: {
            photosWithWeight: (dataToExport.progressPhotos || []).filter(p => p.weight).length,
            photosWithNotes: (dataToExport.progressPhotos || []).filter(p => p.notes).length,
            photosWithMeasurements: (dataToExport.progressPhotos || []).filter(p => p.measurements && Object.keys(p.measurements).length > 0).length,
            entriesByType: (dataToExport.progressEntries || []).reduce((acc, entry) => {
              acc[entry.type] = (acc[entry.type] || 0) + 1;
              return acc;
            }, {}),
            dateRange: {
              earliest: (dataToExport.progressPhotos || []).concat(dataToExport.progressEntries || [])
                .map(item => item.date).sort()[0] || null,
              latest: (dataToExport.progressPhotos || []).concat(dataToExport.progressEntries || [])
                .map(item => item.date).sort().reverse()[0] || null
            }
          },
          
          // Données de la page d'accueil (maintenant gérées par useHomepageImages indépendant)
          homepageBackgroundImages: 0, // Système indépendant
          homepageBannerImages: 0, // Système indépendant
          homepageLastUpdated: null, // Système indépendant
          
          // Données d'endurance
          endurancePushupSessions: (dataToExport.enduranceData?.sessions?.pushups || dataToExport.enduranceData?.pushupSessions || []).length,
          enduranceBoxingSessions: (dataToExport.enduranceData?.sessions?.boxing || dataToExport.enduranceData?.boxingSessions || []).length,
          enduranceSwimmingSessions: (dataToExport.enduranceData?.sessions?.swimming || dataToExport.enduranceData?.swimmingSessions || []).length,
          enduranceJumpropeSessions: (dataToExport.enduranceData?.sessions?.jumprope || dataToExport.enduranceData?.jumpropeSessions || []).length,
          enduranceRunningSessions: (dataToExport.enduranceData?.sessions?.running || dataToExport.enduranceData?.runningSessions || []).length,
          enduranceChallenges: (dataToExport.enduranceData?.challenges || []).length,
          enduranceLastUpdated: dataToExport.enduranceData?.lastUpdated || null,
          
          // Configuration et historique
          startDate: dataToExport.startDate,
          weekVariant: dataToExport.weekVariant,
          programHistory: (dataToExport.programHistory || []).length,
          
          // Statistiques générales
          totalDataPoints: Object.keys(dataToExport).length,
          exportSize: JSON.stringify(dataToExport).length
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
      setExportStatus('error');
      setTimeout(() => setExportStatus(null), 3000);
    }
  };

  // Fonction pour exporter les données Garmin
  const handleExportGarminData = async () => {
    try {
      setGarminExportStatus('loading');
      const garminData = await exportGarminData();
      
      const exportObject = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        exportType: 'Garmin Data',
        appName: 'Workout Tracker - Garmin',
        data: garminData,
        metadata: {
          totalSwimming: (garminData.activities?.swimming || []).length,
          totalJumpRope: (garminData.activities?.jumpRope || []).length,
          totalDailyMetrics: Object.keys(garminData.dailyMetrics || {}).length,
          dateRange: {
            earliest: Object.keys(garminData.dailyMetrics || {}).sort()[0] || null,
            latest: Object.keys(garminData.dailyMetrics || {}).sort().reverse()[0] || null
          }
        }
      };

      const jsonString = JSON.stringify(exportObject, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `garmin-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setGarminExportStatus('success');
      setTimeout(() => setGarminExportStatus(null), 3000);
    } catch (error) {
      console.error('❌ Erreur export Garmin:', error);
      setGarminExportStatus('error');
      setTimeout(() => setGarminExportStatus(null), 3000);
    }
  };

  // Fonction pour importer les données Garmin
  const handleImportGarminData = async (jsonData) => {
    try {
      setGarminImportStatus('loading');
      const parsed = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      
      // Vérifier la structure
      if (!parsed.data || (!parsed.data.activities && !parsed.data.dailyMetrics)) {
        throw new Error('Format JSON Garmin invalide');
      }

      await importGarminData(parsed.data);
      
      setGarminImportStatus('success');
      setTimeout(() => setGarminImportStatus(null), 3000);
    } catch (error) {
      console.error('❌ Erreur import Garmin:', error);
      setGarminImportStatus('error');
      setTimeout(() => setGarminImportStatus(null), 3000);
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

    // Validation des entrées de progression (nouveau)
    if (data.progressEntries && !Array.isArray(data.progressEntries)) {
      errors.push('progressEntries doit être un tableau');
    }

    // Validation des rappels de suivi corporel (nouveau)
    if (data.bodyTrackingReminders && !Array.isArray(data.bodyTrackingReminders)) {
      errors.push('bodyTrackingReminders doit être un tableau');
    }

    // Validation de l'historique des répétitions (nouveau)
    if (data.historyReps && typeof data.historyReps !== 'object') {
      errors.push('historyReps doit être un objet');
    }

    // Validation de l'historique des programmes (nouveau)
    if (data.programHistory && !Array.isArray(data.programHistory)) {
      errors.push('programHistory doit être un tableau');
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
        photos: (data.progressPhotos || []).length,
        progressEntries: (data.progressEntries || []).length,
        reminders: (data.bodyTrackingReminders || []).length,
        historyReps: Object.keys(data.historyReps || {}).length,
        programHistory: (data.programHistory || []).length
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
        setImportStatus('error');
      }
      
    } catch (error) {
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
      // Erreur lors de la restauration
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

      {/* Section Page d'Accueil */}
      <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Image className="mr-2" size={20} />
            Page d'Accueil
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-300 text-sm">
              Personnalisez les images de fond et les bannières de votre page d'accueil.
            </p>
            
            <div className="bg-slate-700/50 rounded-lg p-4">
              <h4 className="font-medium text-white mb-2">Fonctionnalités :</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Rotation d'images de fond à chaque interaction</li>
                <li>• Rotation automatique des bannières toutes les 2 minutes</li>
                <li>• Import d'images JPG/JPEG depuis vos fichiers</li>
                <li>• Transitions fluides vers les autres onglets</li>
                <li>• Stockage local des images dans votre navigateur</li>
              </ul>
            </div>

            <Button
              onClick={() => setShowHomePageSettings(true)}
              icon={Image}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Configurer les Images de la Page d'Accueil
            </Button>
          </div>
        </CardContent>
      </Card>

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <h5 className="text-sm font-medium text-blue-300">🏋️ Entraînement</h5>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Exercices cochés : {Object.keys(data.checkedExercises || {}).length} entrées</li>
                    <li>• Répétitions : {Object.keys(data.reps || {}).length} entrées</li>
                    <li>• Étirements : {Object.keys(data.checkedStretches || {}).length} entrées</li>
                    <li>• Historique répétitions : {Object.keys(data.historyReps || {}).length} entrées</li>
                  </ul>
                </div>
                <div className="space-y-1">
                  <h5 className="text-sm font-medium text-green-300">📊 Suivi Corporel</h5>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Photos de progression : {(data.progressPhotos || []).length} photos</li>
                    <li>• Entrées de progression : {(data.progressEntries || []).length} entrées</li>
                    <li>• Rappels configurés : {(data.bodyTrackingReminders || []).length} rappels</li>
                    <li>• Photos avec poids : {(data.progressPhotos || []).filter(p => p.weight).length}</li>
                    <li>• Photos avec notes : {(data.progressPhotos || []).filter(p => p.notes).length}</li>
                    <li>• Photos avec mesures : {(data.progressPhotos || []).filter(p => p.measurements && Object.keys(p.measurements).length > 0).length}</li>
                    <li>• Dernière mise à jour : {data.bodyTrackingLastUpdated ? new Date(data.bodyTrackingLastUpdated).toLocaleDateString('fr-FR') : 'Jamais'}</li>
                  </ul>
                </div>
                <div className="space-y-1">
                  <h5 className="text-sm font-medium text-purple-300">🏠 Page d'Accueil</h5>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Images de fond : Système indépendant</li>
                    <li>• Bannières : Système indépendant</li>
                    <li>• Dernière mise à jour : Système indépendant</li>
                  </ul>
                </div>
                <div className="space-y-1">
                  <h5 className="text-sm font-medium text-orange-300">🏃 Endurance</h5>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Sessions boxe : {(data.enduranceData?.sessions?.boxing || data.enduranceData?.boxingSessions || []).length} sessions</li>
                    <li>• Sessions pompes : {(data.enduranceData?.sessions?.pushups || data.enduranceData?.pushupSessions || []).length} sessions</li>
                    <li>• Sessions natation : {(data.enduranceData?.sessions?.swimming || data.enduranceData?.swimmingSessions || []).length} sessions</li>
                    <li>• Sessions corde à sauter : {(data.enduranceData?.sessions?.jumprope || data.enduranceData?.jumpropeSessions || []).length} sessions</li>
                    <li>• Sessions course : {(data.enduranceData?.sessions?.running || data.enduranceData?.runningSessions || []).length} sessions</li>
                    <li>• Défis actifs : {(data.enduranceData?.challenges || []).length} défis</li>
                  </ul>
                </div>
                <div className="space-y-1">
                  <h5 className="text-sm font-medium text-purple-300">⚙️ Configuration</h5>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Date de début : {data.startDate ? new Date(data.startDate).toLocaleDateString('fr-FR') : 'Non définie'}</li>
                    <li>• Variante de semaine : {data.weekVariant || 'A'}</li>
                    <li>• Historique programmes : {(data.programHistory || []).length} entrées</li>
                  </ul>
                </div>
                <div className="space-y-1">
                  <h5 className="text-sm font-medium text-yellow-300">📈 Statistiques</h5>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>• Total propriétés : {Object.keys(data).length} champs</li>
                    <li>• Taille données : {(JSON.stringify(data).length / 1024).toFixed(1)} KB</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={exportAllData}
                disabled={exportStatus === 'loading'}
                icon={Download}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {exportStatus === 'loading' ? 'Export en cours...' : 'Export Complet'}
              </Button>
              
              <Button
                onClick={exportBodyTrackingData}
                disabled={exportStatus === 'loading'}
                icon={FileText}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {exportStatus === 'loading' ? 'Export en cours...' : 'Export Suivi Corporel'}
              </Button>
              
              <Button
                onClick={handleExportGarminData}
                disabled={garminExportStatus === 'loading'}
                icon={Download}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {garminExportStatus === 'loading' ? 'Export en cours...' : 'Export Garmin'}
              </Button>
            </div>

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

            {garminExportStatus === 'success' && (
              <div className="flex items-center text-green-400 text-sm">
                <CheckCircle className="mr-2" size={16} />
                Export Garmin réussi ! Le fichier a été téléchargé.
              </div>
            )}

            {garminExportStatus === 'error' && (
              <div className="flex items-center text-red-400 text-sm">
                <AlertTriangle className="mr-2" size={16} />
                Erreur lors de l'export Garmin. Veuillez réessayer.
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

            <div className="flex gap-3 flex-wrap">
              <Button
                onClick={previewImport}
                disabled={!importData.trim() || importStatus === 'loading'}
                icon={FileText}
                variant="outline"
                className="flex-1"
              >
                Prévisualiser
              </Button>
              
              <Button
                onClick={() => handleImportGarminData(importData)}
                disabled={!importData.trim() || garminImportStatus === 'loading'}
                icon={Upload}
                variant="outline"
                className="bg-purple-600/20 border-purple-500/50 text-purple-300 hover:bg-purple-600/30"
              >
                {garminImportStatus === 'loading' ? 'Import...' : 'Import Garmin'}
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

            {garminImportStatus === 'success' && (
              <div className="flex items-center text-green-400 text-sm">
                <CheckCircle className="mr-2" size={16} />
                Import Garmin réussi ! Les données ont été importées.
              </div>
            )}

            {garminImportStatus === 'error' && (
              <div className="flex items-center text-red-400 text-sm">
                <AlertTriangle className="mr-2" size={16} />
                Erreur lors de l'import Garmin. Vérifiez le format JSON.
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="space-y-2">
                      <h5 className="text-blue-300 font-medium">🏋️ Entraînement</h5>
                      <div className="space-y-1 pl-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Exercices :</span>
                          <span className="text-white">{previewData.stats.exercises}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Répétitions :</span>
                          <span className="text-white">{previewData.stats.reps}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Étirements :</span>
                          <span className="text-white">{previewData.stats.stretches}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Historique reps :</span>
                          <span className="text-white">{previewData.stats.historyReps || 0}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h5 className="text-green-300 font-medium">📊 Suivi Corporel</h5>
                      <div className="space-y-1 pl-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Photos :</span>
                          <span className="text-white">{previewData.stats.photos}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Entrées progression :</span>
                          <span className="text-white">{previewData.stats.progressEntries || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Rappels :</span>
                          <span className="text-white">{previewData.stats.reminders || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Historique programmes :</span>
                          <span className="text-white">{previewData.stats.programHistory || 0}</span>
                        </div>
                      </div>
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

      {/* Modal des paramètres de la page d'accueil */}
      {showHomePageSettings && (
        <HomePageImageSettings onClose={() => setShowHomePageSettings(false)} />
      )}
    </div>
  );
};

export default SettingsTab;