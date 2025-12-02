# Plan d'implémentation : IndexedDB pour QuietQuest

## 📋 Reformulation de la demande

### Objectif principal
Mettre en place un système de sauvegarde robuste via **IndexedDB** pour l'onglet Quêtes (QuietQuest), aligné sur l'architecture déjà établie pour le module Sport. Le système doit être **performant, intelligent, et permettre l'export/import JSON** depuis deux points d'accès :
1. **L'onglet Sécurité** dans Quêtes (déjà existant, à améliorer)
2. **Un module dédié** dans Paramètres (à créer)

### Exigences techniques
- ✅ Migration depuis localStorage vers IndexedDB (avec fallback automatique)
- ✅ Performance optimale (batch operations, indexation)
- ✅ Export/import JSON complet et sécurisé
- ✅ Compatibilité avec l'existant (pas de breaking changes)
- ✅ Gestion d'erreurs robuste (fallback localStorage si IndexedDB indisponible)
- ✅ Migration automatique des données existantes

---

## 🎯 Architecture cible

### Structure IndexedDB

**Base de données :** `WorkoutTrackerDB` (réutiliser la base existante)

**Object Stores :**
1. **`quietquest_quests`** (keyPath: `id`)
   - Index : `categorie` (non-unique)
   - Index : `active` (non-unique)
   - Index : `type` (non-unique) - 'recurrente' | 'exceptionnelle'
   - Index : `date` (non-unique) - pour quêtes exceptionnelles
   - Index : `userId` (non-unique) - pour multi-utilisateurs futur

2. **`quietquest_validations`** (keyPath: auto-increment ou composite `queteId_date`)
   - Index : `queteId` (non-unique)
   - Index : `date` (non-unique)
   - Index : `userId` (non-unique)

3. **`quietquest_user_data`** (keyPath: `userId` ou `'main'`)
   - Pas d'index nécessaire (store unique par utilisateur)

4. **`quietquest_daily_performances`** (keyPath: `date` ou composite `userId_date`)
   - Index : `date` (non-unique)
   - Index : `userId` (non-unique)

5. **`quietquest_app_state`** (keyPath: `userId` ou `'main'`)
   - Pas d'index nécessaire

**Méta-clés** (localStorage uniquement, légères) :
- `quietquest_last_visit`
- `quietquest_last_cleanup`

### Avantages de cette architecture
- ✅ Réutilisation de `WorkoutTrackerDB` (cohérence avec le reste de l'app)
- ✅ Stores séparés pour requêtes ciblées (performance)
- ✅ Index optimisés pour les requêtes fréquentes
- ✅ Support multi-utilisateurs préparé (index `userId`)

---

## 📐 Plan d'implémentation en 5 phases

### Phase 1 : Infrastructure IndexedDB

**Objectif :** Créer le module de gestion IndexedDB pour QuietQuest

**Fichiers à créer :**
- `src/utils/quietQuestIndexedDB.js` (nouveau)
  - Fonction `openQuietQuestDB()` : ouvre WorkoutTrackerDB et crée les stores si nécessaire
  - Fonctions CRUD pour chaque store :
    - `saveQuests(quests[])` / `loadQuests()`
    - `saveValidations(validations[])` / `loadValidations()`
    - `saveUserData(userData)` / `loadUserData()`
    - `saveDailyPerformances(performances[])` / `loadDailyPerformances()`
    - `saveAppState(state)` / `loadAppState()`
  - Gestion d'erreurs avec fallback localStorage automatique
  - Migration automatique depuis localStorage au premier chargement

**Détails techniques :**
```javascript
// Structure openQuietQuestDB()
const openQuietQuestDB = () => {
  return new Promise((resolve) => {
    if (!window.indexedDB) {
      resolve(null); // Fallback localStorage
      return;
    }
    
    const request = indexedDB.open('WorkoutTrackerDB');
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // Créer stores si absents
      if (!db.objectStoreNames.contains('quietquest_quests')) {
        const store = db.createObjectStore('quietquest_quests', { keyPath: 'id' });
        store.createIndex('categorie', 'categorie', { unique: false });
        store.createIndex('active', 'active', { unique: false });
        store.createIndex('type', 'type', { unique: false });
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('userId', 'userId', { unique: false });
      }
      
      // ... autres stores
    };
    
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = () => resolve(null); // Fallback
  });
};
```

**Critères de validation :**
- ✅ Stores créés automatiquement au premier chargement
- ✅ Fallback localStorage si IndexedDB indisponible
- ✅ Pas d'erreur console en cas d'échec IndexedDB

---

### Phase 2 : Migration du hook `useQuietQuestEngine`

**Objectif :** Adapter `useQuietQuestEngine` pour utiliser IndexedDB en priorité, avec fallback localStorage

**Modifications dans `src/hooks/useQuietQuestEngine.js` :**

1. **Import du nouveau module :**
   ```javascript
   import {
     openQuietQuestDB,
     saveQuestsToIndexedDB,
     loadQuestsFromIndexedDB,
     saveValidationsToIndexedDB,
     loadValidationsFromIndexedDB,
     // ... autres fonctions
   } from '../../utils/quietQuestIndexedDB';
   ```

2. **Migration automatique au chargement initial :**
   - Vérifier si données existent dans localStorage
   - Si oui ET IndexedDB disponible : migrer vers IndexedDB puis supprimer localStorage
   - Si IndexedDB indisponible : continuer avec localStorage

3. **Sauvegarde hybride :**
   - Priorité IndexedDB si disponible
   - Fallback localStorage automatique
   - Sauvegarde batch pour performance (débounce 300ms)

4. **Chargement initial :**
   - Essayer IndexedDB d'abord
   - Si vide, essayer localStorage (migration)
   - Si les deux vides, valeurs par défaut

**Code structure :**
```javascript
export function useQuietQuestEngine() {
  const [allQuests, setAllQuests] = useState([]);
  // ... autres états
  
  // Détection du mode de stockage
  const [storageMode, setStorageMode] = useState('indexeddb'); // 'indexeddb' | 'localstorage'
  
  // Chargement initial avec migration
  useEffect(() => {
    const loadData = async () => {
      const db = await openQuietQuestDB();
      
      if (db) {
        // Mode IndexedDB
        setStorageMode('indexeddb');
        const quests = await loadQuestsFromIndexedDB(db);
        // ... charger autres données
        
        // Migration depuis localStorage si nécessaire
        const localQuests = loadFromStorage(STORAGE_KEYS.quests, []);
        if (localQuests.length > 0 && quests.length === 0) {
          // Migrer
          await saveQuestsToIndexedDB(db, localQuests);
          // ... migrer autres données
          // Nettoyer localStorage après migration réussie
        }
      } else {
        // Mode localStorage (fallback)
        setStorageMode('localstorage');
        // Charger depuis localStorage
      }
    };
    
    loadData();
  }, []);
  
  // Sauvegarde automatique avec batch
  useEffect(() => {
    if (storageMode === 'indexeddb') {
      const db = await openQuietQuestDB();
      if (db) {
        await saveQuestsToIndexedDB(db, allQuests);
      } else {
        // Fallback localStorage
        saveToStorage(STORAGE_KEYS.quests, allQuests);
      }
    } else {
      saveToStorage(STORAGE_KEYS.quests, allQuests);
    }
  }, [allQuests, storageMode]);
  
  // ... reste du hook
}
```

**Critères de validation :**
- ✅ Migration automatique transparente
- ✅ Pas de perte de données
- ✅ Performance maintenue (batch operations)
- ✅ Fallback robuste

---

### Phase 3 : Export/Import JSON optimisé

**Objectif :** Créer un système d'export/import JSON performant et sécurisé

**Fichiers à créer :**
- `src/utils/quietQuestExportImport.js` (nouveau)
  - `exportQuietQuestData(options)` : export complet depuis IndexedDB
  - `importQuietQuestData(jsonData, options)` : import avec validation
  - `validateQuietQuestExport(jsonData)` : validation du format
  - `prepareQuietQuestExport(quests, validations, userData, performances)` : préparation des données

**Structure d'export :**
```javascript
{
  version: "1.0",
  exportDate: "2025-01-02T10:30:00.000Z",
  exportType: "QuietQuest Complete",
  metadata: {
    totalQuests: 45,
    totalValidations: 1234,
    dateRange: {
      earliest: "2024-01-01",
      latest: "2025-01-02"
    },
    userLevel: 5,
    totalXP: 125000,
    estimatedSizeKB: 234
  },
  data: {
    quests: [...],
    validations: [...],
    userData: {...},
    dailyPerformances: [...],
    appState: {...}
  }
}
```

**Fonctionnalités export :**
- Export depuis IndexedDB (priorité) ou localStorage (fallback)
- Compression optionnelle (comme Garmin/Nutrition)
- Métadonnées complètes (stats, dates, tailles)
- Validation avant export

**Fonctionnalités import :**
- Validation stricte du format JSON
- Prévisualisation avant import (stats, dates, tailles)
- Mode "merge" vs "replace" (optionnel, par défaut replace)
- Sauvegarde automatique avant import (backup)
- Rollback en cas d'erreur

**Code structure :**
```javascript
export const exportQuietQuestData = async (options = {}) => {
  const {
    includeMetadata = true,
    compress = false,
    storageMode = 'auto' // 'indexeddb' | 'localstorage' | 'auto'
  } = options;
  
  // Détecter source de données
  const db = storageMode === 'auto' ? await openQuietQuestDB() : null;
  
  let quests, validations, userData, dailyPerformances, appState;
  
  if (db) {
    quests = await loadQuestsFromIndexedDB(db);
    validations = await loadValidationsFromIndexedDB(db);
    // ... autres
  } else {
    quests = loadFromStorage(STORAGE_KEYS.quests, []);
    // ... autres depuis localStorage
  }
  
  // Préparer export
  const exportData = prepareQuietQuestExport(
    quests, validations, userData, dailyPerformances, appState
  );
  
  // Ajouter métadonnées
  if (includeMetadata) {
    exportData.metadata = {
      totalQuests: quests.length,
      totalValidations: validations.length,
      // ... calculs
    };
  }
  
  // Compression optionnelle
  if (compress) {
    // Utiliser même système que Garmin/Nutrition
    return await compressQuietQuestExport(exportData);
  }
  
  return exportData;
};

export const importQuietQuestData = async (jsonData, options = {}) => {
  const {
    mode = 'replace', // 'replace' | 'merge'
    createBackup = true,
    validate = true
  } = options;
  
  // Validation
  if (validate && !validateQuietQuestExport(jsonData)) {
    throw new Error('Format d\'export invalide');
  }
  
  // Backup avant import
  if (createBackup) {
    const backup = await exportQuietQuestData({ compress: false });
    // Sauvegarder backup temporairement
  }
  
  // Import
  const db = await openQuietQuestDB();
  
  if (db) {
    if (mode === 'replace') {
      // Vider stores puis importer
      await clearQuietQuestStores(db);
      await saveQuestsToIndexedDB(db, jsonData.data.quests);
      // ... autres stores
    } else {
      // Merge (plus complexe, optionnel)
    }
  } else {
    // Fallback localStorage
    saveToStorage(STORAGE_KEYS.quests, jsonData.data.quests);
    // ... autres
  }
  
  // Rollback en cas d'erreur
  // ...
};
```

**Critères de validation :**
- ✅ Export complet et fidèle
- ✅ Import sécurisé avec validation
- ✅ Prévisualisation avant import
- ✅ Backup automatique avant import
- ✅ Gestion d'erreurs robuste

---

### Phase 4 : Intégration dans l'onglet Sécurité (Quêtes)

**Objectif :** Améliorer l'onglet Sécurité existant pour utiliser le nouveau système IndexedDB

**Modifications dans `src/components/tabs/QuestsTab.jsx` :**

1. **Import du nouveau module :**
   ```javascript
   import {
     exportQuietQuestData,
     importQuietQuestData,
     validateQuietQuestExport
   } from '../../utils/quietQuestExportImport';
   ```

2. **Amélioration de `handleExport` :**
   - Utiliser `exportQuietQuestData()` au lieu de construction manuelle
   - Ajouter options (compression, métadonnées)
   - Améliorer le feedback (toast avec détails)

3. **Amélioration de `handleImport` :**
   - Utiliser `importQuietQuestData()` avec validation
   - Prévisualisation améliorée (utiliser métadonnées de l'export)
   - Backup automatique avant import
   - Rollback en cas d'erreur

**Code structure :**
```javascript
const handleExport = async () => {
  try {
    showInfo('Export en cours...');
    
    const exportData = await exportQuietQuestData({
      includeMetadata: true,
      compress: false
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
    
    showSuccess(
      `Export réussi ! ${exportData.metadata.totalQuests} quêtes, ` +
      `${exportData.metadata.totalValidations} validations.`
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
    
    // Prévisualisation améliorée
    const preview = {
      quests: jsonData.metadata?.totalQuests || jsonData.data.quests?.length || 0,
      validations: jsonData.metadata?.totalValidations || jsonData.data.validations?.length || 0,
      dateRange: jsonData.metadata?.dateRange || 'N/A',
      userLevel: jsonData.metadata?.userLevel || jsonData.data.userData?.level || 'N/A'
    };
    
    const confirmMessage = `Remplacer entièrement les données QuietQuest ?\n\n` +
      `Résumé du fichier :\n` +
      `- ${preview.quests} quête${preview.quests > 1 ? 's' : ''}\n` +
      `- ${preview.validations} validation${preview.validations > 1 ? 's' : ''}\n` +
      `- Période : ${preview.dateRange}\n` +
      `- Niveau utilisateur : ${preview.userLevel}\n\n` +
      `⚠️ Cette action remplacera TOUTES tes données actuelles. Cette action est irréversible.`;
    
    if (!window.confirm(confirmMessage)) return;
    
    // Import avec backup automatique
    await importQuietQuestData(jsonData, {
      mode: 'replace',
      createBackup: true
    });
    
    // Recharger les données
    // (le hook useQuietQuestEngine devrait détecter le changement)
    
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
```

**Critères de validation :**
- ✅ Export utilise IndexedDB en priorité
- ✅ Import avec validation et prévisualisation
- ✅ Backup automatique avant import
- ✅ Feedback utilisateur amélioré

---

### Phase 5 : Module dédié dans Paramètres

**Objectif :** Créer une section dédiée QuietQuest dans l'onglet Paramètres

**Modifications dans `src/components/tabs/SettingsTab.jsx` :**

1. **Ajouter une nouvelle section "QuietQuest"** (après la section Livres, avant la section générale)

2. **Structure de la section :**
   ```jsx
   <Card>
     <CardHeader>
       <CardTitle className="flex items-center gap-2">
         <span>⚡</span>
         QuietQuest - Quêtes
       </CardTitle>
     </CardHeader>
     <CardContent>
       <div className="space-y-4">
         {/* Stats rapides */}
         <div className="grid grid-cols-3 gap-2 text-sm">
           <div className="bg-slate-800/50 rounded-lg p-2 text-center">
             <div className="text-slate-400 text-xs">Quêtes</div>
             <div className="text-emerald-300 font-semibold">{questsCount}</div>
           </div>
           <div className="bg-slate-800/50 rounded-lg p-2 text-center">
             <div className="text-slate-400 text-xs">Validations</div>
             <div className="text-emerald-300 font-semibold">{validationsCount}</div>
           </div>
           <div className="bg-slate-800/50 rounded-lg p-2 text-center">
             <div className="text-slate-400 text-xs">Niveau</div>
             <div className="text-emerald-300 font-semibold">{userLevel}</div>
           </div>
         </div>
         
         {/* Export/Import */}
         <div className="grid grid-cols-2 gap-3">
           <Button onClick={handleExportQuietQuest} icon={Download}>
             Exporter QuietQuest
           </Button>
           <Button onClick={handleImportQuietQuest} icon={Upload}>
             Importer QuietQuest
           </Button>
         </div>
         
         {/* Status */}
         {exportStatus && <StatusMessage status={exportStatus} />}
         {importStatus && <StatusMessage status={importStatus} />}
       </div>
     </CardContent>
   </Card>
   ```

3. **Fonctions à ajouter :**
   ```javascript
   const [quietQuestStats, setQuietQuestStats] = useState({
     questsCount: 0,
     validationsCount: 0,
     userLevel: 1
   });
   
   // Charger stats au montage
   useEffect(() => {
     const loadStats = async () => {
       const db = await openQuietQuestDB();
       if (db) {
         const quests = await loadQuestsFromIndexedDB(db);
         const validations = await loadValidationsFromIndexedDB(db);
         const userData = await loadUserDataFromIndexedDB(db);
         setQuietQuestStats({
           questsCount: quests.length,
           validationsCount: validations.length,
           userLevel: userData?.level || 1
         });
       } else {
         // Fallback localStorage
         const quests = loadFromStorage(STORAGE_KEYS.quests, []);
         const validations = loadFromStorage(STORAGE_KEYS.validations, []);
         const userData = loadFromStorage(STORAGE_KEYS.userData, defaultUserData);
         setQuietQuestStats({
           questsCount: quests.length,
           validationsCount: validations.length,
           userLevel: userData?.level || 1
         });
       }
     };
     loadStats();
   }, []);
   
   const handleExportQuietQuest = async () => {
     setExportStatus('loading');
     try {
       const exportData = await exportQuietQuestData({ includeMetadata: true });
       // ... télécharger fichier
       setExportStatus('success');
     } catch (error) {
       setExportStatus('error');
     }
   };
   
   const handleImportQuietQuest = async () => {
     // Même logique que dans QuestsTab, mais avec fileInputRef
   };
   ```

**Critères de validation :**
- ✅ Section visible dans Paramètres
- ✅ Stats en temps réel
- ✅ Export/Import fonctionnels
- ✅ Cohérence avec autres sections (Livres, Garmin, Nutrition)

---

## 🔧 Optimisations et bonnes pratiques

### Performance

1. **Batch operations :**
   - Sauvegarder par lots (débounce 300ms)
   - Utiliser transactions IndexedDB pour atomicité
   - Éviter les sauvegardes redondantes

2. **Indexation :**
   - Index sur `date` pour requêtes fréquentes (validations, performances)
   - Index sur `categorie` pour filtres
   - Index sur `active` pour requêtes "quêtes actives"

3. **Cache :**
   - Maintenir le cache `validationsByDate` (déjà en place)
   - Cache des quêtes par date (déjà en place via `getQuestsForDateMemoized`)

### Robustesse

1. **Gestion d'erreurs :**
   - Try/catch sur toutes les opérations IndexedDB
   - Fallback localStorage automatique
   - Logging détaillé pour debugging

2. **Validation :**
   - Valider structure des données avant sauvegarde
   - Valider format JSON avant import
   - Sanitization des données utilisateur

3. **Migration :**
   - Migration automatique transparente
   - Vérification d'intégrité après migration
   - Rollback possible en cas d'erreur

### Sécurité

1. **Export :**
   - Pas de données sensibles (pas de mots de passe, tokens)
   - Validation avant export
   - Format versionné pour compatibilité future

2. **Import :**
   - Validation stricte du format
   - Backup automatique avant import
   - Rollback en cas d'erreur
   - Prévisualisation obligatoire

---

## 📊 Critères de validation finale

### Performance
- ✅ Chargement initial < 100ms (même avec 200+ quêtes)
- ✅ Sauvegarde batch < 50ms (débounce)
- ✅ Export complet < 500ms (même avec 1000+ validations)
- ✅ Import avec validation < 1s

### Robustesse
- ✅ Migration automatique sans perte de données
- ✅ Fallback localStorage fonctionnel
- ✅ Validation stricte import/export
- ✅ Backup automatique avant import

### UX
- ✅ Export/Import depuis Quêtes → Sécurité
- ✅ Export/Import depuis Paramètres
- ✅ Prévisualisation avant import
- ✅ Feedback utilisateur clair (toasts, statuts)

### Architecture
- ✅ Réutilisation de `WorkoutTrackerDB`
- ✅ Stores séparés et indexés
- ✅ Code modulaire et réutilisable
- ✅ Compatibilité avec l'existant

---

## 🚀 Ordre d'implémentation recommandé

1. **Phase 1** : Infrastructure IndexedDB (base solide)
2. **Phase 2** : Migration du hook (transparent pour l'utilisateur)
3. **Phase 3** : Export/Import JSON (fonctionnalité complète)
4. **Phase 4** : Intégration onglet Sécurité (amélioration existant)
5. **Phase 5** : Module Paramètres (nouveau point d'accès)

**Durée estimée :** 4-6 heures de développement

---

## 📝 Notes techniques

### Compatibilité
- ✅ Compatible avec navigateurs modernes (Chrome, Firefox, Safari, Edge)
- ✅ Fallback automatique pour navigateurs sans IndexedDB
- ✅ Mode privé géré (fallback localStorage)

### Migration
- ✅ Migration automatique au premier chargement
- ✅ Pas de perte de données
- ✅ Nettoyage localStorage après migration réussie

### Tests
- ✅ Tester avec 0, 10, 100, 500 quêtes
- ✅ Tester avec 0, 100, 1000, 5000 validations
- ✅ Tester fallback localStorage
- ✅ Tester import/export avec fichiers valides/invalides

---

## ✅ Checklist finale

- [x] Phase 1 : `quietQuestIndexedDB.js` créé et testé
  - ✅ Module `src/utils/quietQuestIndexedDB.js` créé avec toutes les fonctions CRUD
  - ✅ Stores créés : `quietquest_quests`, `quietquest_validations`, `quietquest_user_data`, `quietquest_daily_performances`, `quietquest_app_state`
  - ✅ Index optimisés pour requêtes fréquentes (categorie, active, type, date, userId)
  - ✅ Gestion d'erreurs avec fallback localStorage automatique
  - ✅ Migration automatique depuis localStorage au premier chargement
- [x] Phase 2 : `useQuietQuestEngine` migré vers IndexedDB
  - ✅ Hook adapté pour utiliser IndexedDB en priorité
  - ✅ Migration automatique transparente depuis localStorage
  - ✅ Sauvegarde batch avec debounce (300ms) pour performance
  - ✅ Fallback localStorage robuste si IndexedDB indisponible
  - ✅ Limites de taille maintenues (5000 validations, 366 daily performances)
- [x] Phase 3 : `quietQuestExportImport.js` créé et testé
  - ✅ Module `src/utils/quietQuestExportImport.js` créé
  - ✅ Fonction `exportQuietQuestData()` avec métadonnées complètes
  - ✅ Fonction `importQuietQuestData()` avec validation et backup automatique
  - ✅ Fonction `validateQuietQuestExport()` pour validation stricte
  - ✅ Support IndexedDB et localStorage (fallback)
  - ✅ Structure d'export versionnée avec métadonnées (stats, dates, tailles)
- [x] Phase 4 : Onglet Sécurité amélioré
  - ✅ `QuestsTab.jsx` mis à jour pour utiliser `exportQuietQuestData()` et `importQuietQuestData()`
  - ✅ Prévisualisation améliorée avec métadonnées de l'export
  - ✅ Backup automatique avant import
  - ✅ Feedback utilisateur amélioré (toasts avec détails)
  - ✅ Gestion d'erreurs robuste avec rollback
- [x] Phase 5 : Module Paramètres créé
  - ✅ Section "QuietQuest - Quêtes" ajoutée dans `SettingsTab.jsx`
  - ✅ Stats en temps réel (quêtes, validations, niveau)
  - ✅ Export/Import fonctionnels depuis Paramètres
  - ✅ Chargement automatique des stats au montage
  - ✅ Cohérence avec autres sections (Livres, Garmin, Nutrition)
- [ ] Tests de performance validés (à valider manuellement)
- [ ] Tests de robustesse validés (à valider manuellement)
- [ ] Documentation utilisateur (optionnel)

---

**Ce plan garantit une implémentation optimale, performante et robuste du système IndexedDB pour QuietQuest, alignée sur les standards déjà établis dans le projet.**

