/**
 * Hook useSettingsImport - Gestion de tous les imports
 * 
 * ✅ PHASE 4 : Extraction de la logique d'import
 * 
 * Gère tous les imports : Garmin, Nutrition, Books, Budget, QuietQuest, Apprentissage
 * 
 * @module components/tabs/SettingsTab/hooks/useSettingsImport
 */

import { useState, useCallback } from 'react';
import { 
  decompressGarminExport, 
  isCompressed 
} from '../../GarminTab/utils/jsonCompression';
import { 
  decompressNutritionExport 
} from '../../../../utils/nutritionCompression';
import { 
  processBooksImportData 
} from '../../../../utils/booksExportImport';
import { 
  saveBooksToIndexedDB 
} from '../../../../utils/booksIndexedDB';
import { 
  importBudgetData 
} from '../../../../utils/budgetExportImport';
import { 
  validateQuietQuestExport, 
  importQuietQuestData 
} from '../../../../utils/quietQuestExportImport';
import { 
  importApprentissageData 
} from '../../../../utils/apprentissageExportImport';

/**
 * Hook pour gérer tous les imports
 * 
 * @param {Function} importGarminData - Fonction pour importer Garmin
 * @returns {Object} États et handlers pour tous les imports
 */
export const useSettingsImport = (importGarminData) => {
  // États pour chaque type d'import
  const [garminImportStatus, setGarminImportStatus] = useState(null);
  const [booksImportStatus, setBooksImportStatus] = useState(null);
  const [budgetImportStatus, setBudgetImportStatus] = useState(null);
  const [quietQuestImportStatus, setQuietQuestImportStatus] = useState(null);
  const [apprentissageImportStatus, setApprentissageImportStatus] = useState(null);

  // Import Garmin
  const handleImportGarminData = useCallback(async (jsonData) => {
    try {
      setGarminImportStatus('loading');
      
      // Décompression automatique si nécessaire
      let parsed;
      if (typeof jsonData === 'string') {
        if (isCompressed(jsonData)) {
          parsed = decompressGarminExport(jsonData);
        } else {
          parsed = JSON.parse(jsonData);
        }
      } else {
        if (jsonData.format === 'garmin-compressed' || jsonData.compressed === true) {
          parsed = decompressGarminExport(jsonData);
        } else {
          parsed = jsonData;
        }
      }
      
      // Vérifier la structure
      const garminData = parsed.data || parsed;
      if (!garminData || (!garminData.activities && !garminData.dailyMetrics)) {
        throw new Error('Format JSON Garmin invalide. Attendu: { activities: {...}, dailyMetrics: {...} } ou { data: { activities: {...}, dailyMetrics: {...} } }');
      }

      if (garminData.activities && typeof garminData.activities !== 'object') {
        throw new Error('activities doit être un objet avec swimming, jumpRope, cardio');
      }
      if (garminData.dailyMetrics && typeof garminData.dailyMetrics !== 'object') {
        throw new Error('dailyMetrics doit être un objet avec dates comme clés');
      }

      await importGarminData(garminData);
      
      setGarminImportStatus('success');
      setTimeout(() => setGarminImportStatus(null), 3000);
      
      console.log('[Settings] Garmin data imported successfully. Consider refreshing the Garmin tab to see the new data.');
    } catch (error) {
      console.error('❌ Erreur import Garmin:', error);
      setGarminImportStatus('error');
      setTimeout(() => setGarminImportStatus(null), 3000);
      throw error;
    }
  }, [importGarminData]);

  // Import Books
  const handleImportBooksData = useCallback(async (jsonData) => {
    try {
      setBooksImportStatus('loading');
      
      let parsed;
      if (typeof jsonData === 'string') {
        parsed = JSON.parse(jsonData);
      } else {
        parsed = jsonData;
      }

      const result = processBooksImportData(parsed);

      if (!result.valid) {
        throw new Error(result.errors?.join(', ') || 'Erreur de validation des données Livres');
      }

      if (result.books.length === 0) {
        throw new Error('Aucun livre valide trouvé dans le fichier');
      }

      const indexedOk = await saveBooksToIndexedDB(result.books);
      
      if (indexedOk) {
        console.log(`[Settings] ✅ Import Livres réussi (${result.books.length} livres restaurés dans IndexedDB)`);
        setBooksImportStatus('success');
        setTimeout(() => {
          setBooksImportStatus(null);
          if (window.confirm(`${result.books.length} livre(s) importé(s) avec succès ! Voulez-vous recharger la page pour voir les changements ?`)) {
            window.location.reload();
          }
        }, 2000);
      } else {
        throw new Error('Échec de la sauvegarde dans IndexedDB');
      }
    } catch (error) {
      console.error('❌ Erreur import Livres:', error);
      setBooksImportStatus('error');
      alert(`Erreur lors de l'import des Livres : ${error.message}`);
      setTimeout(() => setBooksImportStatus(null), 3000);
    }
  }, []);

  // Import Budget
  const handleImportBudgetData = useCallback(async (jsonData) => {
    try {
      setBudgetImportStatus('loading');
      
      let parsed;
      if (typeof jsonData === 'string') {
        parsed = JSON.parse(jsonData);
      } else {
        parsed = jsonData;
      }
      
      const result = await importBudgetData(parsed, {
        merge: false,
        overwrite: true,
        validate: true
      });
      
      const totalImported = 
        result.imported.budget +
        result.imported.categories +
        result.imported.depenses +
        result.imported.depensesPlanifiees +
        result.imported.chargesFixes;
      
      if (totalImported === 0 && result.errors.length > 0) {
        throw new Error(result.errors.join(', '));
      }
      
      console.log(`[Settings] ✅ Import Budget réussi (${totalImported} éléments importés)`);
      setBudgetImportStatus('success');
      setTimeout(() => {
        setBudgetImportStatus(null);
        if (window.confirm(`${totalImported} élément(s) Budget importé(s) avec succès ! Voulez-vous recharger la page pour voir les changements ?`)) {
          window.location.reload();
        }
      }, 2000);
    } catch (error) {
      console.error('❌ Erreur import Budget:', error);
      setBudgetImportStatus('error');
      alert(`Erreur lors de l'import du Budget : ${error.message}`);
      setTimeout(() => setBudgetImportStatus(null), 3000);
    }
  }, []);

  // Import QuietQuest
  const handleImportQuietQuest = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        setQuietQuestImportStatus('loading');
        const text = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result);
          reader.onerror = reject;
          reader.readAsText(file);
        });
        const jsonData = JSON.parse(text);
        if (!validateQuietQuestExport(jsonData)) {
          throw new Error('Format d\'export invalide');
        }
        await importQuietQuestData(jsonData, { mode: 'replace', createBackup: true });
        setQuietQuestImportStatus('success');
        setTimeout(() => {
          setQuietQuestImportStatus(null);
          if (window.confirm('Import réussi ! Voulez-vous recharger la page pour voir les changements ?')) {
            window.location.reload();
          }
        }, 2000);
      } catch (error) {
        console.error('❌ Erreur import QuietQuest:', error);
        setQuietQuestImportStatus('error');
        alert(`Erreur lors de l'import : ${error.message}`);
        setTimeout(() => setQuietQuestImportStatus(null), 3000);
      }
    };
    input.click();
  }, []);

  // Import Apprentissage
  const handleImportApprentissage = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        setApprentissageImportStatus('loading');
        const text = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve(event.target?.result);
          reader.onerror = reject;
          reader.readAsText(file);
        });
        const jsonData = JSON.parse(text);
        await importApprentissageData(jsonData, { mode: 'replace', createBackup: true });
        setApprentissageImportStatus('success');
        setTimeout(() => {
          setApprentissageImportStatus(null);
          if (window.confirm('Import réussi ! Voulez-vous recharger la page pour voir les changements ?')) {
            window.location.reload();
          }
        }, 2000);
      } catch (error) {
        console.error('❌ Erreur import Apprentissage:', error);
        setApprentissageImportStatus('error');
        alert(`Erreur lors de l'import : ${error.message}`);
        setTimeout(() => setApprentissageImportStatus(null), 3000);
      }
    };
    input.click();
  }, []);

  return {
    // États
    garminImportStatus,
    booksImportStatus,
    budgetImportStatus,
    quietQuestImportStatus,
    apprentissageImportStatus,
    
    // Handlers
    handleImportGarminData,
    handleImportBooksData,
    handleImportBudgetData,
    handleImportQuietQuest,
    handleImportApprentissage,
  };
};

export default useSettingsImport;
