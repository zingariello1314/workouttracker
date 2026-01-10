# 📊 PROGRESSION REFACTORING - SettingsTab.jsx

**Date :** 2025-01-09  
**Fichier source :** `src/components/tabs/SettingsTab.jsx` (~3807 lignes)  
**Objectif :** Réduire à ~200 lignes

---

## ✅ PROGRESSION ACTUELLE

### Structure créée ✅
- ✅ `src/components/tabs/SettingsTab/` - Dossier principal
- ✅ `src/components/tabs/SettingsTab/hooks/` - Dossier hooks
- ✅ `src/components/tabs/SettingsTab/components/` - Dossier composants
- ✅ `src/components/tabs/SettingsTab/utils/` - Dossier utilitaires

### Hooks créés ✅
1. ✅ `useSettingsStats.js` - Statistiques (QuietQuest, Books, Apprentissage)
2. ✅ `useSwipeSettings.js` - Navigation par swipe

### Hooks à créer ⏳
3. ⏳ `useProfileSettings.js` - Avatar, Email, Password (~200 lignes)
4. ⏳ `useDataValidation.js` - Validation données import (~200 lignes)
5. ⏳ `useSettingsExport.js` - Logique export (~500 lignes)
6. ⏳ `useSettingsImport.js` - Logique import (~700 lignes)
7. ⏳ `useAllDataExportImport.js` - Export/Import complet (~400 lignes)
8. ⏳ `useDataMigration.js` - Migration de données (~40 lignes)
9. ⏳ `useDataCleanup.js` - Nettoyage données (~60 lignes)

### Composants à créer ⏳
1. ⏳ `ProfileSettings.jsx` - Avatar, Email, Password
2. ⏳ `ExportImportSection.jsx` - Section principale Export/Import
3. ⏳ `GarminExportImport.jsx` - Export/Import Garmin
4. ⏳ `NutritionExportImport.jsx` - Export/Import Nutrition
5. ⏳ `BooksExportImport.jsx` - Export/Import Livres
6. ⏳ `BudgetExportImport.jsx` - Export/Import Budget
7. ⏳ `QuietQuestExportImport.jsx` - Export/Import QuietQuest
8. ⏳ `ApprentissageExportImport.jsx` - Export/Import Apprentissage
9. ⏳ `DataCleanupSection.jsx` - Nettoyage des données
10. ⏳ `SwipeNavigationSettings.jsx` - Navigation par swipe
11. ⏳ `LanguageSettings.jsx` - Paramètres de langue
12. ⏳ `InfoCards.jsx` - Cartes d'information
13. ⏳ `ImportPreviewModal.jsx` - Modal de prévisualisation

### Utilitaires à créer ⏳
1. ⏳ `validationUtils.js` - Validation données import
2. ⏳ `exportUtils.js` - Utilitaires export
3. ⏳ `importUtils.js` - Utilitaires import

---

## 📈 ESTIMATION

### Temps estimé
- **Hooks** : ~3-4 heures
- **Composants** : ~4-5 heures
- **Utilitaires** : ~1-2 heures
- **Refactoring principal** : ~1-2 heures
- **Tests et ajustements** : ~2-3 heures
- **Total** : ~12-16 heures de travail

### Lignes de code estimées
- **Hooks** : ~2000 lignes
- **Composants** : ~1500 lignes
- **Utilitaires** : ~300 lignes
- **SettingsTab.jsx principal** : ~200 lignes
- **Total** : ~4000 lignes (au lieu de 3807 dans un seul fichier)

---

## 🎯 PROCHAINES ÉTAPES

1. ✅ Créer structure de dossiers
2. ✅ Créer `useSettingsStats.js`
3. ✅ Créer `useSwipeSettings.js`
4. ⏳ Créer `useProfileSettings.js` (EN COURS)
5. ⏳ Créer `useDataValidation.js`
6. ⏳ Créer hooks export/import (par ordre de priorité)
7. ⏳ Créer composants (par ordre de priorité)
8. ⏳ Refactoriser SettingsTab.jsx principal

---

**Dernière mise à jour :** 2025-01-09
