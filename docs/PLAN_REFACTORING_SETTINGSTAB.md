# 📋 PLAN DE REFACTORING - SettingsTab.jsx

**Date :** 2025-01-09  
**Fichier source :** `src/components/tabs/SettingsTab.jsx` (~3807 lignes)  
**Objectif :** Réduire à ~200 lignes en extrayant composants et hooks

---

## 🎯 STRUCTURE PROPOSÉE

```
src/components/tabs/SettingsTab/
  ├── SettingsTab.jsx (~200 lignes) - Composant principal orchestrateur
  ├── components/
  │   ├── ProfileSettings.jsx - Avatar, Email, Password
  │   ├── HomePageSettings.jsx - Configuration page d'accueil
  │   ├── ProfileCardSettings.jsx - Carte de profil (déjà extrait, wrapper)
  │   ├── ExportImportSection.jsx - Section Export/Import principale
  │   ├── GarminExportImport.jsx - Export/Import Garmin
  │   ├── NutritionExportImport.jsx - Export/Import Nutrition
  │   ├── BooksExportImport.jsx - Export/Import Livres
  │   ├── BudgetExportImport.jsx - Export/Import Budget
  │   ├── QuietQuestExportImport.jsx - Export/Import QuietQuest
  │   ├── ApprentissageExportImport.jsx - Export/Import Apprentissage
  │   ├── DataCleanupSection.jsx - Nettoyage des données
  │   ├── SwipeNavigationSettings.jsx - Navigation par swipe
  │   ├── LanguageSettings.jsx - Paramètres de langue
  │   ├── InfoCards.jsx - Cartes d'information
  │   └── ImportPreviewModal.jsx - Modal de prévisualisation
  ├── hooks/
  │   ├── useProfileSettings.js - Avatar, Email, Password
  │   ├── useSettingsExport.js - Logique export (Garmin, Nutrition, etc.)
  │   ├── useSettingsImport.js - Logique import (Garmin, Nutrition, etc.)
  │   ├── useAllDataExportImport.js - Export/Import toutes données
  │   ├── useDataValidation.js - Validation données import
  │   ├── useDataMigration.js - Migration de données
  │   ├── useSwipeSettings.js - Navigation par swipe
  │   ├── useSettingsStats.js - Statistiques (QuietQuest, Books, Apprentissage)
  │   └── useDataCleanup.js - Nettoyage données mockées
  └── utils/
      ├── exportUtils.js - Utilitaires export
      ├── importUtils.js - Utilitaires import
      └── validationUtils.js - Utilitaires validation
```

---

## 📊 SECTIONS IDENTIFIÉES

### 1. Profile Settings (~200 lignes)
- Avatar upload/preview
- Email update
- Password update
- **Hook :** `useProfileSettings.js`
- **Composant :** `ProfileSettings.jsx`

### 2. HomePage Settings (~50 lignes)
- Configuration images page d'accueil
- **Composant :** `HomePageSettings.jsx` (wrapper existant)

### 3. Profile Card Settings (~80 lignes)
- Configuration carte de profil
- **Composant :** `ProfileCardSettings.jsx` (déjà extrait, wrapper)

### 4. Export/Import Sections (~1500 lignes) 🔴 PRIORITÉ
- Export Garmin (~100 lignes)
- Import Garmin (~150 lignes)
- Export Nutrition (~80 lignes)
- Export Books (~50 lignes)
- Import Books (~120 lignes)
- Export Budget (~50 lignes)
- Import Budget (~50 lignes)
- Export QuietQuest (~60 lignes)
- Import QuietQuest (~120 lignes)
- Export Apprentissage (~50 lignes)
- Import Apprentissage (~130 lignes)
- Export All Data (~200 lignes)
- Import All Data (~400 lignes)
- **Hooks :** `useSettingsExport.js`, `useSettingsImport.js`, `useAllDataExportImport.js`
- **Composants :** Un par type d'export/import

### 5. Data Validation (~200 lignes)
- `validateAllWorkoutData` (~100 lignes)
- `validateImportData` (~60 lignes)
- `previewImport` (~40 lignes)
- **Hook :** `useDataValidation.js`
- **Utils :** `validationUtils.js`

### 6. Data Migration (~40 lignes)
- Migration de données
- **Hook :** `useDataMigration.js`

### 7. Swipe Navigation Settings (~100 lignes)
- Activation/désactivation swipe
- Configuration threshold
- **Hook :** `useSwipeSettings.js`
- **Composant :** `SwipeNavigationSettings.jsx`

### 8. Settings Stats (~80 lignes)
- Statistiques QuietQuest
- Statistiques Books
- Statistiques Apprentissage
- **Hook :** `useSettingsStats.js`

### 9. Data Cleanup (~60 lignes)
- Nettoyage données mockées endurance
- **Hook :** `useDataCleanup.js`
- **Composant :** `DataCleanupSection.jsx`

### 10. Language Settings (~20 lignes)
- Sélecteur de langue
- **Composant :** `LanguageSettings.jsx`

### 11. Info Cards (~60 lignes)
- Cartes d'information sauvegarde
- Cartes d'attributions
- **Composant :** `InfoCards.jsx`

### 12. Quote Manager (~10 lignes)
- Gestion des citations (déjà extrait, wrapper)
- **Composant :** `QuoteManager.jsx` (déjà extrait)

---

## 🚀 PLAN D'EXÉCUTION

### Phase 1 : Extraction des Hooks (Priorité 1)
1. ✅ `useProfileSettings.js` - Avatar, Email, Password
2. ✅ `useSettingsStats.js` - Statistiques
3. ✅ `useSwipeSettings.js` - Navigation par swipe
4. ✅ `useDataCleanup.js` - Nettoyage
5. ✅ `useDataValidation.js` - Validation
6. ✅ `useSettingsExport.js` - Export
7. ✅ `useSettingsImport.js` - Import
8. ✅ `useAllDataExportImport.js` - Export/Import complet

### Phase 2 : Extraction des Composants (Priorité 2)
1. ✅ `ProfileSettings.jsx`
2. ✅ `ExportImportSection.jsx`
3. ✅ `GarminExportImport.jsx`
4. ✅ `NutritionExportImport.jsx`
5. ✅ `BooksExportImport.jsx`
6. ✅ `BudgetExportImport.jsx`
7. ✅ `QuietQuestExportImport.jsx`
8. ✅ `ApprentissageExportImport.jsx`
9. ✅ `DataCleanupSection.jsx`
10. ✅ `SwipeNavigationSettings.jsx`
11. ✅ `LanguageSettings.jsx`
12. ✅ `InfoCards.jsx`

### Phase 3 : Extraction des Utilitaires (Priorité 3)
1. ✅ `validationUtils.js`
2. ✅ `exportUtils.js`
3. ✅ `importUtils.js`

### Phase 4 : Refactoring SettingsTab.jsx (Priorité 4)
- Intégrer tous les hooks et composants
- Réduire à ~200 lignes
- Garder uniquement l'orchestration

---

## 📝 NOTES

- Suivre le même pattern que BooksTab et QuestsTab
- Conserver toutes les fonctionnalités existantes
- Améliorer la gestion d'erreurs dans les hooks
- Ajouter cleanup useEffect où nécessaire
- Documenter chaque hook et composant

---

**Dernière mise à jour :** 2025-01-09
