# Runbook Incidents - Onglet Garmin

> **Objectif** : Procédures de résolution pour incidents courants de l'onglet Garmin.

---

## Classification des Incidents

### Sévérité P0 (Critique)
- **Impact** : Onglet complètement inaccessible, données perdues
- **Temps de résolution cible** : < 1 heure
- **Exemples** : IndexedDB corrompu, erreur fatale React, sync bloquée

### Sévérité P1 (Haute)
- **Impact** : Fonctionnalité majeure indisponible, dégradation UX importante
- **Temps de résolution cible** : < 4 heures
- **Exemples** : Sync échoue systématiquement, charts ne s'affichent pas, données manquantes

### Sévérité P2 (Moyenne)
- **Impact** : Fonctionnalité partielle indisponible, dégradation UX modérée
- **Temps de résolution cible** : < 24 heures
- **Exemples** : Performance dégradée, warnings console, accessibilité partielle

### Sévérité P3 (Basse)
- **Impact** : Problème mineur, impact UX faible
- **Temps de résolution cible** : < 1 semaine
- **Exemples** : Typos, améliorations mineures, optimisations

---

## Incidents Courants

### INC-001 : IndexedDB Corrompu ou Inaccessible

**Sévérité** : P0  
**Symptômes** :
- Erreur `IndexedDB not available` dans console
- Données non chargées
- Onglet vide ou erreur React

**Diagnostic** :
```javascript
// Ouvrir console navigateur
// Vérifier IndexedDB
indexedDB.databases().then(dbs => console.log('Databases:', dbs));

// Vérifier erreurs
window.__GARMIN_ERRORS__ // Si disponible
```

**Résolution** :

1. **Vérifier support IndexedDB**
   ```javascript
   if (!window.indexedDB) {
     // Mode privé ou navigateur non supporté
     // Fallback automatique vers localStorage
   }
   ```

2. **Réinitialiser IndexedDB** (dernier recours)
   ```javascript
   // Dans console navigateur
   indexedDB.deleteDatabase('GarminDataDB');
   // Recharger la page
   ```

3. **Récupérer depuis backup**
   - Exporter données depuis autre navigateur/appareil
   - Importer via Settings > Import JSON

**Prévention** :
- ✅ Fallback localStorage automatique (déjà implémenté)
- ✅ Validation données avant sauvegarde (déjà implémenté)
- ✅ Backup automatique (à implémenter Phase 9)

**Références** :
- `src/hooks/garminDataUtils.js` : Gestion IndexedDB
- `src/hooks/garminDataLoad.js` : Chargement avec fallback

---

### INC-002 : Synchronisation Bloquée ou Échoue

**Sévérité** : P1  
**Symptômes** :
- Bouton "Synchroniser" ne répond pas
- Spinner infini
- Erreur réseau répétée

**Diagnostic** :
```javascript
// Ouvrir DebugPanel (Ctrl+Maj+D)
// Vérifier Network Diagnostics
// Vérifier Circuit Breaker status
window.__GARMIN_NETWORK_STATS__
```

**Résolution** :

1. **Vérifier Circuit Breaker**
   ```javascript
   // Si circuit ouvert, attendre cooldown (30s)
   // Ou réinitialiser manuellement
   resetCircuit(); // Via DebugPanel
   ```

2. **Vérifier réseau**
   - Tester endpoint : `http://localhost:3031/api/garmin/status`
   - Vérifier CORS
   - Vérifier firewall/proxy

3. **Mode dégradé**
   - Si sync > 30s, mode dégradé activé automatiquement
   - Utiliser cache local
   - Réessayer après cooldown

4. **Réinitialiser cache**
   ```javascript
   // Via DebugPanel > Cache > Clear Cache
   clearCache();
   ```

**Prévention** :
- ✅ Circuit breaker (déjà implémenté)
- ✅ Retry avec backoff (déjà implémenté)
- ✅ Mode dégradé (déjà implémenté)
- ✅ Timeout 30s (déjà implémenté)

**Références** :
- `src/components/tabs/GarminTab/services/network/CircuitBreaker.js`
- `src/components/tabs/GarminTab/hooks/garminSyncFetch.js`
- `src/components/tabs/GarminTab/services/sync/DegradedModePolicy.js`

---

### INC-003 : Charts Ne S'Affichent Pas

**Sévérité** : P1  
**Symptômes** :
- Section Charts vide
- Erreur Recharts dans console
- Skeleton loader infini

**Diagnostic** :
```javascript
// Vérifier données
window.__GARMIN_DATA__ // Si disponible

// Vérifier erreurs React
// Ouvrir React DevTools > Components > ChartsSection
```

**Résolution** :

1. **Vérifier données disponibles**
   - Ouvrir DebugPanel
   - Vérifier `garminData.dailyMetrics`
   - Vérifier `garminData.activities`

2. **Vérifier lazy loading**
   - Charts chargés via `LazyChartWrapper`
   - Vérifier `IntersectionObserver` support
   - Forcer chargement : scroll vers section Charts

3. **Vérifier erreurs Recharts**
   - Vérifier version Recharts
   - Vérifier props passées aux charts
   - Vérifier données format (doit être tableau)

4. **Réinitialiser section**
   - Recharger page
   - Ou forcer re-render : changer date sélectionnée

**Prévention** :
- ✅ Lazy loading avec fallback (déjà implémenté)
- ✅ Validation données (déjà implémenté)
- ✅ Error boundaries (déjà implémenté)

**Références** :
- `src/components/tabs/GarminTab/components/sections/ChartsSection.jsx`
- `src/components/tabs/GarminTab/hooks/useLazyChart.jsx`
- `src/components/tabs/GarminTab/components/charts/*.jsx`

---

### INC-004 : Données Manquantes ou Incohérentes

**Sévérité** : P1  
**Symptômes** :
- Métriques vides
- Activités manquantes
- Dates incorrectes

**Diagnostic** :
```javascript
// Vérifier IndexedDB
const db = await openDB();
const tx = db.transaction(['dailyMetrics'], 'readonly');
const store = tx.objectStore('dailyMetrics');
const count = await store.count();
console.log('DailyMetrics count:', count);
```

**Résolution** :

1. **Vérifier dernière sync**
   - Ouvrir DebugPanel
   - Vérifier `lastSyncDate`
   - Vérifier `cacheMeta.source`

2. **Forcer sync**
   - Utiliser bouton "Forcer" avec date spécifique
   - Vérifier réponse API
   - Vérifier sauvegarde IndexedDB

3. **Vérifier migration données**
   - Vérifier `DB_VERSION`
   - Vérifier `onupgradeneeded` exécuté
   - Vérifier données format

4. **Récupérer depuis backup**
   - Exporter depuis autre source
   - Importer via Settings > Import JSON

**Prévention** :
- ✅ Validation données (déjà implémenté)
- ✅ Migration automatique (déjà implémenté)
- ✅ Backup automatique (à implémenter Phase 9)

**Références** :
- `src/hooks/garminDataLoad.js` : Chargement données
- `src/hooks/garminDataSave.js` : Sauvegarde données
- `src/hooks/garminDataUtils.js` : Migration IndexedDB

---

### INC-005 : Performance Dégradée (Lenteur)

**Sévérité** : P2  
**Symptômes** :
- Rendu lent (>500ms)
- Scrolling saccadé
- Freeze interface

**Diagnostic** :
```javascript
// Ouvrir Performance DevTools
// Enregistrer profil
// Vérifier temps de rendu

// Vérifier métriques UI
window.__GARMIN_UI_METRICS__
```

**Résolution** :

1. **Vérifier nombre activités**
   - Si >1000, virtualisation activée automatiquement
   - Vérifier `VirtualizedActivityList` utilisé

2. **Vérifier re-renders**
   - Ouvrir React DevTools Profiler
   - Identifier composants re-rendus fréquemment
   - Vérifier mémoïsation

3. **Vérifier cache**
   - Vérifier taux hit cache
   - Vérifier taille cache
   - Nettoyer cache si nécessaire

4. **Vérifier Web Workers**
   - Vérifier `useSyncWorker` utilisé
   - Vérifier traitement off-thread

**Prévention** :
- ✅ Virtualisation (déjà implémenté)
- ✅ Mémoïsation (déjà implémenté)
- ✅ Lazy loading (déjà implémenté)
- ✅ Web Workers (déjà implémenté)

**Références** :
- `src/components/tabs/GarminTab/components/VirtualizedActivityList.jsx`
- `src/components/tabs/GarminTab/hooks/usePaginatedActivities.js`
- `src/components/tabs/GarminTab/workers/syncWorker.js`

---

### INC-006 : Erreur React (Error Boundary)

**Sévérité** : P0  
**Symptômes** :
- Message d'erreur React affiché
- Composant remplacé par fallback
- Stack trace dans console

**Diagnostic** :
```javascript
// Vérifier Error Boundary
// Ouvrir React DevTools
// Vérifier composant en erreur
```

**Résolution** :

1. **Identifier composant en erreur**
   - Vérifier stack trace
   - Vérifier props passées
   - Vérifier état composant

2. **Vérifier données**
   - Vérifier format données
   - Vérifier valeurs null/undefined
   - Vérifier types données

3. **Corriger erreur**
   - Ajouter validation
   - Ajouter fallback
   - Corriger logique

4. **Réinitialiser**
   - Recharger page
   - Ou réinitialiser état

**Prévention** :
- ✅ Error boundaries (déjà implémenté)
- ✅ Validation données (déjà implémenté)
- ✅ PropTypes (déjà implémenté)

**Références** :
- `src/components/tabs/GarminTab/components/ErrorBoundary.jsx`
- `src/components/tabs/GarminTab/components/GarminErrorBoundary.jsx`

---

### INC-007 : Service Worker Problèmes

**Sévérité** : P2  
**Symptômes** :
- Cache réseau non utilisé
- Offline fallback ne fonctionne pas
- Erreurs Service Worker

**Diagnostic** :
```javascript
// Vérifier Service Worker
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Service Workers:', regs);
});

// Vérifier cache
caches.keys().then(keys => {
  console.log('Caches:', keys);
});
```

**Résolution** :

1. **Vérifier enregistrement**
   - Vérifier Service Worker enregistré
   - Vérifier état (active, installing, waiting)
   - Réenregistrer si nécessaire

2. **Vérifier cache**
   - Vérifier cache créé
   - Vérifier entrées cache
   - Nettoyer cache si nécessaire

3. **Réinitialiser Service Worker**
   ```javascript
   // Via serviceWorkerManager
   unregisterServiceWorker();
   clearCache();
   registerServiceWorker();
   ```

**Prévention** :
- ✅ Enregistrement automatique (déjà implémenté)
- ✅ Gestion erreurs (déjà implémenté)
- ✅ Fallback réseau (déjà implémenté)

**Références** :
- `src/components/tabs/GarminTab/utils/serviceWorkerManager.js`
- `public/sw-garmin-sync.js`

---

### INC-008 : AutoSync Ne Fonctionne Pas

**Sévérité** : P2  
**Symptômes** :
- AutoSync ne se déclenche pas
- Historique AutoSync vide
- Erreurs scheduler

**Diagnostic** :
```javascript
// Vérifier scheduler
// Ouvrir DebugPanel > AutoSync History
// Vérifier déclenchements

// Vérifier IndexedDB
const db = await openDB();
const tx = db.transaction(['autoSyncHistory'], 'readonly');
const store = tx.objectStore('autoSyncHistory');
const history = await store.getAll();
console.log('AutoSync History:', history);
```

**Résolution** :

1. **Vérifier scheduler démarré**
   - Vérifier `AutoSyncScheduler` démarré
   - Vérifier listeners actifs
   - Redémarrer si nécessaire

2. **Vérifier configuration**
   - Vérifier AutoSync activé
   - Vérifier schedule configuré
   - Vérifier prochain déclenchement

3. **Vérifier IndexedDB**
   - Vérifier store `autoSyncHistory` existe
   - Vérifier indexes créés
   - Vérifier données persistées

4. **Réinitialiser**
   - Désactiver/réactiver AutoSync
   - Ou recharger page

**Prévention** :
- ✅ Scheduler robuste (déjà implémenté)
- ✅ Gestion erreurs (déjà implémenté)
- ✅ Historique persistant (déjà implémenté)

**Références** :
- `src/components/tabs/GarminTab/services/sync/AutoSyncScheduler.js`
- `src/hooks/garminAutoSyncHistory.js`
- `src/components/tabs/GarminTab/components/AutoSyncHistoryView.jsx`

---

## Procédures Générales

### Collecte d'Informations

1. **Ouvrir DebugPanel** (`Ctrl+Maj+D`)
   - Capturer snapshot diagnostics
   - Exporter JSON diagnostics
   - Copier métriques

2. **Vérifier Console**
   - Erreurs JavaScript
   - Warnings React
   - Logs applicatifs

3. **Vérifier Network**
   - Requêtes API
   - Status codes
   - Temps de réponse

4. **Vérifier IndexedDB**
   - Ouvrir DevTools > Application > IndexedDB
   - Vérifier stores
   - Vérifier données

### Escalade

1. **P0** : Contacter équipe immédiatement
2. **P1** : Créer ticket, assigner équipe
3. **P2** : Créer ticket, planifier résolution
4. **P3** : Ajouter à backlog

### Communication

- **Slack** : `#garmin-incidents` (P0/P1)
- **Email** : `garmin-team@example.com` (P0 uniquement)
- **Dashboard** : Monitoring temps réel

---

## Changelog

| Version | Date | Auteur | Changements |
|---------|------|--------|-------------|
| 1.0 | 2024-02-25 | Équipe Garmin | Création initiale (INC-001 à INC-008) |

---

## Références

- [Error Handling Best Practices](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)
- [IndexedDB Troubleshooting](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)
- [Service Worker Debugging](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers)


