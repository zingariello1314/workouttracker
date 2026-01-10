/**
 * Composant pour la vue Sécurité (export/import/reset)
 * 
 * ✅ PHASE 4 : Extraction de la vue Security
 * 
 * @module components/tabs/QuestsTab/components/SecurityView
 */

import React from 'react';
import { useToast } from '../../../../components/ui/Toast';
import {
  exportQuietQuestData,
  importQuietQuestData,
  validateQuietQuestExport,
} from '../../../../utils/quietQuestExportImport';
import { openQuietQuestDB, clearQuietQuestStores } from '../../../../utils/quietQuestIndexedDB';
import {
  STORAGE_KEYS,
  META_KEYS,
  defaultUserData,
  getTodayDateStr,
} from '../../../../hooks/useQuietQuestEngine';

/**
 * Vue Sécurité pour export/import/reset des données QuietQuest
 * 
 * @param {Object} props
 * @param {Array} props.allQuests - Liste de toutes les quêtes
 * @param {Array} props.validations - Liste de toutes les validations
 * @param {Array} props.dailyPerformances - Liste des performances quotidiennes
 */
export const SecurityView = ({
  allQuests,
  validations,
  dailyPerformances,
}) => {
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  const handleExport = async () => {
    try {
      showInfo('Export en cours...');
      
      const exportData = await exportQuietQuestData({
        includeMetadata: true,
        compress: false,
      });
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quietquest-export-${getTodayDateStr()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      const metadata = exportData.metadata || {};
      showSuccess(
        `Export réussi ! ${metadata.totalQuests || 0} quête${metadata.totalQuests !== 1 ? 's' : ''}, ` +
        `${metadata.totalValidations || 0} validation${metadata.totalValidations !== 1 ? 's' : ''}.`
      );
    } catch (error) {
      console.error('Erreur export:', error);
      showError('Erreur lors de l\'export. Vérifie la console.');
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result);
        reader.onerror = reject;
        reader.readAsText(file);
      });

      const jsonData = JSON.parse(text);

      // Validation
      if (!validateQuietQuestExport(jsonData)) {
        showError('Format d\'export invalide. Vérifie que le fichier est un export QuietQuest valide.');
        return;
      }

      // Prévisualisation améliorée (utiliser métadonnées si disponibles)
      const metadata = jsonData.metadata || {};
      const preview = {
        quests: metadata.totalQuests || jsonData.data?.quests?.length || 0,
        validations: metadata.totalValidations || jsonData.data?.validations?.length || 0,
        dateRange: metadata.dateRange
          ? `${metadata.dateRange.earliest} → ${metadata.dateRange.latest}`
          : 'N/A',
        userLevel: metadata.userLevel || jsonData.data?.userData?.level || 'N/A',
        estimatedSizeKB: metadata.estimatedSizeKB || 'N/A',
      };

      const confirmMessage = `Remplacer entièrement les données QuietQuest ?\n\n` +
        `Résumé du fichier :\n` +
        `- ${preview.quests} quête${preview.quests > 1 ? 's' : ''}\n` +
        `- ${preview.validations} validation${preview.validations > 1 ? 's' : ''}\n` +
        `- Période : ${preview.dateRange}\n` +
        `- Niveau utilisateur : ${preview.userLevel}\n` +
        `- Taille estimée : ${preview.estimatedSizeKB} KB\n\n` +
        `⚠️ Cette action remplacera TOUTES tes données actuelles. Cette action est irréversible.`;

      if (!window.confirm(confirmMessage)) {
        return;
      }

      // Import avec backup automatique
      await importQuietQuestData(jsonData, {
        mode: 'replace',
        createBackup: true,
        validate: false, // Déjà validé
      });

      // Recharger les données (le hook devrait détecter le changement)
      // Forcer rechargement en réinitialisant les états
      window.location.reload(); // Solution simple pour recharger depuis IndexedDB

      showSuccess(
        `Import réussi ! ${preview.quests} quête${preview.quests > 1 ? 's' : ''} et ` +
        `${preview.validations} validation${preview.validations > 1 ? 's' : ''} chargée${preview.validations > 1 ? 's' : ''}.`
      );
    } catch (error) {
      console.error('Erreur import:', error);
      showError('Fichier invalide ou corrompu. Vérifie que le fichier est un export QuietQuest valide.');
    } finally {
      event.target.value = '';
    }
  };

  const handleReset = async () => {
    const questsCount = allQuests.length;
    const validationsCount = validations.length;
    const confirmMessage = `Réinitialiser complètement toutes les données QuietQuest ?\n\n⚠️ Cette action supprimera définitivement :\n- ${questsCount} quête${questsCount > 1 ? 's' : ''}\n- ${validationsCount} validation${validationsCount > 1 ? 's' : ''}\n- Toutes tes statistiques et ton XP\n- Toutes tes performances quotidiennes\n\nCette action est irréversible et ne peut pas être annulée.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      // Vider IndexedDB si disponible
      const db = await openQuietQuestDB();
      if (db) {
        await clearQuietQuestStores(db, 'main');
      }

      // Vider localStorage (fallback)
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(STORAGE_KEYS.quests);
        window.localStorage.removeItem(STORAGE_KEYS.validations);
        window.localStorage.removeItem(STORAGE_KEYS.userData);
        window.localStorage.removeItem(STORAGE_KEYS.dailyPerformances);
        window.localStorage.removeItem(STORAGE_KEYS.appState);
        window.localStorage.removeItem(META_KEYS.lastVisit);
        window.localStorage.removeItem(META_KEYS.lastCleanup);
      }

      // Recharger la page pour réinitialiser tous les états
      showWarning('Toutes les données QuietQuest ont été réinitialisées. Rechargement de la page...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Erreur reset:', error);
      showError('Erreur lors de la réinitialisation. Vérifie la console.');
    }
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100">
          Sécurité <span className="text-emerald-400">QuietQuest</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Sauvegarde, exporte ou réinitialise tes données de quêtes en un seul endroit.
        </p>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-100">
              Export JSON complet
            </div>
            <div className="text-[11px] text-slate-400">
              Quêtes, validations, XP et performances quotidiennes.
            </div>
          </div>
          <button
            type="button"
            onClick={handleExport}
            className="gradient-button-premium gradient-button-premium-md rounded-lg"
          >
            Exporter
          </button>
        </div>

        <div className="rounded-2xl border border-slate-700 bg-slate-900/80 px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-100">
              Import JSON
            </div>
            <div className="text-[11px] text-slate-400">
              Remplace entièrement les données actuelles par un fichier exporté.
            </div>
          </div>
          <label className="gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg cursor-pointer inline-block">
            Importer
            <input
              type="file"
              accept="application/json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
        </div>

        <div className="rounded-2xl border border-rose-700 bg-rose-950/60 px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-rose-100">
              Réinitialisation complète
            </div>
            <div className="text-[11px] text-rose-200/80">
              Supprime toutes les données QuietQuest et remet l'XP au niveau initial.
            </div>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="gradient-button-premium gradient-button-premium-md rounded-lg"
          >
            Réinitialiser
          </button>
        </div>
      </div>
    </div>
  );
};
