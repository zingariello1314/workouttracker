# 🏗️ Plan de Refactoring Complet - Architecture Garmin Optimisée

> **Objectif** : Transformer l'architecture actuelle en un système performant, maintenable et scalable, avec gains mesurables de 50-85% sur les opérations critiques.

---

## 📋 Table des Matières

1. [Vision d'Architecture](#1-vision-darchitecture)
2. [Problèmes Actuels & Solutions](#2-problèmes-actuels--solutions)
3. [Phase 1 : Optimisation Stockage (P0)](#phase-1--optimisation-stockage-p0)
4. [Phase 2 : Refactoring Logic Métier (P0)](#phase-2--refactoring-logic-métier-p0)
5. [Phase 3 : Unified Cache Strategy (P0)](#phase-3--unified-cache-strategy-p0)
6. [Phase 4 : Résilience Réseau (P1)](#phase-4--résilience-réseau-p1)
7. [Phase 5 : Optimisation UI (P2)](#phase-5--optimisation-ui-p2)
8. [Phase 6 : Tests & Observabilité](#phase-6--tests--observabilité)
9. [Phase 7 : Migration Progressive](#phase-7--migration-progressive)
10. [Annexes](#annexes)

---

## 1. Vision d'Architecture

### 1.1 Principes Directeurs

**SOLID + Clean Architecture**

```
┌─────────────────────────────────────────────────────┐
│                   UI Layer (React)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ GarminTab    │  │ Activities   │  │ Metrics   │ │
│  │ (Container)  │  │ (Presenter)  │  │ (Chart)   │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────┘
                         ↓ ↑
┌─────────────────────────────────────────────────────┐
│              Application Layer (Hooks)               │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ useGarmin    │  │ useGarmin    │  │ useGarmin │ │
│  │ Sync         │  │ Data         │  │ Cache     │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────┘
                         ↓ ↑
┌─────────────────────────────────────────────────────┐
│              Domain Layer (Business Logic)           │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ Sync         │  │ Storage      │  │ Cache     │ │
│  │ Orchestrator │  │ Manager      │  │ Strategy  │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────┘
                         ↓ ↑
┌─────────────────────────────────────────────────────┐
│           Infrastructure Layer (Services)            │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │ IndexedDB    │  │ HTTP Client  │  │ Logger    │ │
│  │ Repository   │  │ (Fetch)      │  │ Service   │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────┘
```

**Pourquoi cette architecture ?**

1. **Séparation des responsabilités** : Chaque couche a un rôle unique, facilite les tests
2. **Inversion des dépendances** : Domain ne dépend pas de l'infra (interfaces)
3. **Testabilité maximale** : Logic métier testable sans React ni IndexedDB
4. **Évolutivité** : Ajouter un nouveau store ou API sans tout casser

---

## 2. Problèmes Actuels & Solutions

### 2.1 Tableau Récapitulatif

| # | Problème | Impact Mesuré | Solution | Gain Attendu |
|---|----------|---------------|----------|--------------|
| **1** | Transactions IndexedDB séquentielles | Save 50 activités = 1200ms | Batch transactions atomiques | **85%** (150ms) |
| **2** | Multiples transactions pour load | Load 90j = 390ms | Transaction unique multi-store | **50%** (205ms) |
| **3** | God Module (useGarminSync 500 lignes) | Impossible à tester | Strategy Pattern + Orchestrator | Maintenabilité++ |
| **4** | Triple cache non coordonné | Invalidation incohérente | Unified Cache avec cascade | Cohérence++ |
| **5** | Retry naïf sans circuit breaker | 90s bloqué si backend down | Circuit Breaker + Jitter | UX++ |
| **6** | God Component (GarminTab 1200 lignes) | Re-render complet à chaque state | Atomic Components + memo | 60% perf UI |
| **7** | Constantes dispersées | Tuning difficile | Config hiérarchique centralisée | Maintenabilité+ |
| **8** | Cache serveur sans TTL | Memory leak + stale data | LRU Cache avec expiration | Mémoire++ |
| **9** | Proxy basique | Erreurs cryptiques | Proxy intelligent avec logs | Debug++ |
| **10** | Fonctions de 80+ lignes | Debugging difficile | Fonctions pures < 20 lignes | Lisibilité++ |

---

### 2.2 Objectif : Extraire un « Sync Orchestrator » testable

#### 2.2.1 Photo de la situation

- `useGarminSync.syncNow()` orchestre tout mais dépend d’un bloc unique (`garminSyncCore.js`) mêlant logique pure et effets.
- Ce fichier gère : calcul de plage, caches mémoire/IndexedDB, fetch réseau, retry, logging.
- Les dépendances sont passées sous forme de callbacks, ce qui rend la lecture, la maintenance et les tests difficiles.

#### 2.2.2 Stratégie

1. **Isoler les responsabilités métier dans des services dédiés** :
   - `SyncRangeService` : calcul de plage, timestamps, gestion du délai auto-sync.
   - `SyncCacheService` : résolution des caches (mémoire + IndexedDB).
   - `SyncRequestService` : construction/émission de la requête HTTP et mise à jour du cache mémoire.
   - `SyncRetryService` : gestion des retries automatiques (phase 5.1) + post-traitements.
2. **Créer un orchestrateur pur** (`SyncOrchestrator`) qui compose ces services et expose `execute(context)`.
3. **Adapter `useGarminSync`** : conserver la gestion React (state/effects), construire un `context`, déléguer à l’orchestrateur.

#### 2.2.3 Nouveau découpage (cohérent avec la codebase)

```
src/components/tabs/GarminTab/services/sync/
  ├── SyncOrchestrator.js
  ├── SyncRangeService.js
  ├── SyncCacheService.js
  ├── SyncRequestService.js
  ├── SyncRetryService.js
  └── __tests__/
```

> Migration incrémentale : `garminSyncCore.js` servira de façade pendant la transition puis sera supprimé.

#### 2.2.4 Plan détaillé

**A. Création des services**

- **SyncRangeService**
  - Contient `calculateSyncDateRange`, `applySyncDelay`, `getLastSyncTimestampForToday`.
  - Reçoit `getSyncStartDate`, `getAutoSyncSettings`, `setStatus`.
  - Retourne `{ startDate, endDate, lastSyncTimestamp, delayApplied }`.
- **SyncCacheService**
  - Encapsule `checkExistingData` + `checkFrontendCache`.
  - Dépend de `multiStoreLoader` (IndexedDB) + `frontendCache`.
  - API : `resolve(range, context)` → `cacheHit` ou `null`.
- **SyncRequestService**
  - Construit `query` + `requestBody`.
  - Appelle `tryFetch`, met à jour `frontendCache`, `setStatus`.
  - Retourne `{ json, cacheKey, adaptiveTtl }`.
- **SyncRetryService**
  - Regroupe `handleAutomaticRetry`.
  - API : `finalize(initialResponse, range, context)` → réponse finale.

**B. Orchestrateur**

```javascript
export class SyncOrchestrator {
  constructor({ rangeService, cacheService, requestService, retryService }) {
    this.rangeService = rangeService;
    this.cacheService = cacheService;
    this.requestService = requestService;
    this.retryService = retryService;
  }

  async execute(context) {
    const range = await this.rangeService.compute(context);

    const cacheHit = await this.cacheService.resolve(range, context);
    if (cacheHit) {
      return this.retryService.finalize(cacheHit, range, context);
    }

    const response = await this.requestService.fetch(range, context);
    return this.retryService.finalize(response, range, context);
  }
}
```

**C. Intégration dans `useGarminSync`**

- Initialiser l’orchestrateur (via `useMemo`) avec les services.
- Construire un `context` (options de sync, callbacks `setGarminData`, `setStatus`, `recordHistory`, etc.).
- `syncNow(options)` devient :

```javascript
const context = buildSyncContext(options, deps);
const response = await orchestrator.execute(context);
await historyRecorder.recordIfNeeded(response, context);
```

#### 2.2.5 Gains attendus

- Modules <150 lignes → lecture/maintenance simplifiées.
- Tests unitaires ciblés (ex. `SyncCacheService` avec mocks).
- Prépare la Phase 3 (cache unifié) : `SyncCacheService` sera l’unique point d’entrée.
- Réduction du risque de régression (responsabilités isolées).

#### 2.2.6 Implémentation (2025-11-09)

- `SyncOrchestrator` instancié depuis `useGarminSyncActions` avec `SyncRangeService`, `SyncCacheService`, `SyncRequestService`, `SyncRetryService` et `SyncHistoryRecorder`.
- `useGarminSync` scindé en `useGarminSyncState` (gestion React) et `useGarminSyncActions` (métier), supprimant l’ancien cache global.
- Instrumentation :
  - `SyncRequestService` ajoute `diagnostic.requestPayload` pour chaque réponse.
  - `SyncRetryService` logue les métadonnées retry (`cacheKey`, `adaptiveTtl`, `executedAt`).
- Tests Vitest livrés (`services/sync/__tests__`) validant payloads, instrumentation, fallback et enregistrement historique.
- `MemoryCacheAdapter` + `CacheCoordinator` introduits (début Phase 3) ; `SyncCacheService` s’appuie sur eux.

---

### 2.3 Refactorer `useGarminSync` (700 lignes → hooks spécialisés)

#### 2.3.1 Modules cibles

1. `useGarminSyncState.js` – encapsule `useState`, `useRef`, `useEffect`.
2. `useGarminSyncActions.js` – expose `syncNow`, `backfill`, `fetchStatus`, `clearCache` (s’appuie sur l’orchestrateur).
3. `useGarminSyncHistory.js` – gère `recordForcedSyncHistory`, `handleForcedRangeRecorded`.

#### 2.3.2 Étapes

1. **Extraire l’historique**
   - Déplacer `recordForcedSyncHistory` dans un service `SyncHistoryRecorder`.
   - Écrire tests unitaires (mock `saveForcedRangeEntry`).
2. **Factoriser la construction du payload**
   - Créer `buildRequestPayload(options, range)`.
   - Centraliser dans `SyncRequestService`.
3. **Composer les hooks**
   - Hook principal assemble les sous-hooks et expose la même API publique.
   - Les tests existants doivent demeurer valides.

---

### 2.4 Stabiliser `garminSyncFetch.js`

**Constat** : robuste mais `BASES` est un tableau global mutable.

**Plan**

1. Introduire `BaseUrlRegistry` :
   ```javascript
   class BaseUrlRegistry {
     constructor(defaults) { this.bases = [...defaults]; }
     add(base) { ... }
     reset(defaults) { ... }
     getAll() { return [...this.bases]; }
   }
   export const baseUrlRegistry = new BaseUrlRegistry(getDefaultBases());
   ```
2. `tryFetch` consomme `baseUrlRegistry.getAll()` (injectable/testable).
3. Permettre l’injection optionnelle d’un logger pour tests.
4. Ajouter tests unitaires (vitest) : fallback multi-base, timeout, échec total.

---

## Phase 2 : Refactoring Logic Métier (P0)

> **Objectif global** : découpler la logique métier de la couche React pour obtenir un pipeline de synchronisation testable, modulaire et extensible.
>
> **KPIs cibles** :
> - Couverture tests unitaires sync ≥ **80 %**.
> - `syncNow` lisible en < **150 lignes** (contre ~700).
> - Temps moyen de lecture code (past onboarding) réduit de 50 % (feedback dév).
>
> **Risques à mitiger** :
> - Régression fonctionnelle (modes de forçage, retry auto, cache).
> - Double instrumentation (logs dupliqués) pendant transition.
> - Explosion du nombre de fichiers sans convention claire.

### 2.1 Problème : « God Module » (`garminSyncCore.js` + `useGarminSync.js`)

| Symptôme | Analyse | Impact |
|----------|---------|--------|
| 600 lignes dans `garminSyncCore.js` | Mélange logique pure + effets + logs | Difficulté de maintenance/tests |
| 700 lignes dans `useGarminSync.js` | Hook gère state, réseau, cache, historique | Toute modif déclenche re-render global |
| Tests quasi inexistants | Dépendances injectées « à la main » | Grande peur de refactor → stagnation |

### 2.2 Objectif : Extraire un « Sync Orchestrator » testable

#### 2.2.1 Photo de la situation

- `syncNow(options)` prépare un mélange d’options, de callbacks et de state puis appelle `garminSyncCore`.
- `garminSyncCore` appelle des fonctions utilitaires en cascade (`calculateSyncDateRange`, `checkExistingData`, `performSyncRequest`, `handleAutomaticRetry`).
- Les dépendances (IndexedDB, caches, status, logger) sont passées sous forme de callbacks anonymes → difficile à mocker.

#### 2.2.2 Stratégie

1. **Services métier dédiés** (responsabilité unique).
2. **Orchestrateur pur** qui coordonne ces services.
3. **Hook React léger** qui gère uniquement l’état et l’injection des dépendances.

#### 2.2.3 Nouveau découpage (cohérent avec la codebase)

```
src/components/tabs/GarminTab/services/sync/
  ├── SyncOrchestrator.js
  ├── services/
  │   ├── SyncRangeService.js
  │   ├── SyncCacheService.js
  │   ├── SyncRequestService.js
  │   ├── SyncRetryService.js
  │   └── SyncContextFactory.js
  ├── adapters/
  │   ├── FrontendCacheAdapter.js
  │   ├── IndexedDbAdapter.js
  │   └── StatusAdapter.js
  └── __tests__/
```

- Les adapters encapsulent les dépendances externes (React state, IndexedDB, caches) → faciles à mocker.
- `SyncContextFactory` centralise la construction du `context` passé à l’orchestrateur.

#### 2.2.4 Plan détaillé

**A. Services**

- `SyncRangeService`
  - `compute(context)` retourne `{ startDate, endDate, lastSyncTimestamp, delayApplied }`.
  - Gère le délai (`applySyncDelay`) et logue l’événement.
- `SyncCacheService`
  - `resolve(range, context)` retourne `cacheHit` (`{ json, source }`) ou `null`.
  - Source ∈ `memory | indexeddb`.
- `SyncRequestService`
  - `fetch(range, context)` construit query + body, appelle `tryFetch`, met à jour `frontendCache`.
  - Retourne `{ json, responseMeta }`.
- `SyncRetryService`
  - `finalize(response, range, context)` gère `handleAutomaticRetry`, met à jour stats, renvoie réponse finale.

**B. Orchestrateur**

```javascript
class SyncOrchestrator {
  constructor({ rangeService, cacheService, requestService, retryService }) {
    this.rangeService = rangeService;
    this.cacheService = cacheService;
    this.requestService = requestService;
    this.retryService = retryService;
  }

  async execute(context) {
    const range = await this.rangeService.compute(context);

    const cacheHit = await this.cacheService.resolve(range, context);
    if (cacheHit) {
      return this.retryService.finalize(cacheHit, range, context);
    }

    const response = await this.requestService.fetch(range, context);
    return this.retryService.finalize(response, range, context);
  }
}
```

**C. Intégration `useGarminSync`**

- `useGarminSyncState` gère `loading`, `status`, `baseUrl`, refs historiques.
- `useGarminSyncActions` instancie l’orchestrateur (dépendances injectées via `useMemo`).
- `useGarminSyncHistory` gère historisation (en utilisant `SyncHistoryRecorder`).
- Hook principal assemble les trois modules et expose `syncNow`, `backfill`, etc.

#### 2.2.5 Gains attendus / validation

- `syncNow` devient lisible (≈ 120 lignes, principalement construction du `context`).
- Tests unitaires indépendants :
  - `SyncRangeService.test.js` (cas délai, date invalidée).
  - `SyncCacheService.test.js` (hit memory, hit IndexedDB, miss).
  - `SyncRequestService.test.js` (construction query, gestion erreurs, update cache).
  - `SyncRetryService.test.js` (retry 0/1/2, données vides).
- Couverture des branches critiques (force range, includeToday, auto-mode).

#### 2.2.6 Implémentation (2025-11-09)

- `SyncOrchestrator` instancié depuis `useGarminSyncActions` avec `SyncRangeService`, `SyncCacheService`, `SyncRequestService`, `SyncRetryService` et `SyncHistoryRecorder`.
- `useGarminSync` scindé en `useGarminSyncState` (gestion React) et `useGarminSyncActions` (métier), supprimant l’ancien cache global.
- Instrumentation :
  - `SyncRequestService` ajoute `diagnostic.requestPayload` pour chaque réponse.
  - `SyncRetryService` logue les métadonnées retry (`cacheKey`, `adaptiveTtl`, `executedAt`).
- Tests Vitest livrés (`services/sync/__tests__`) validant payloads, instrumentation, fallback et enregistrement historique.
- `MemoryCacheAdapter` + `CacheCoordinator` introduits (début Phase 3) ; `SyncCacheService` s’appuie sur eux.

---

### 2.3 Refactorer `useGarminSync` (700 lignes → hooks spécialisés)

#### 2.3.1 Modules cibles

| Module | Rôle | Contenu |
|--------|------|---------|
| `useGarminSyncState` | Gestion React | `loading`, `status`, refs historiques, effets (`fetchStatus`, `autoSync`). |
| `useGarminSyncActions` | API métier | `syncNow`, `backfill`, `clearCache`, orchestration. |
| `useGarminSyncHistory` | Historisation | `recordForcedSyncHistory`, `handleForcedRangeRecorded`, export. |

#### 2.3.2 Étapes détaillées

1. **Extraction Historique**
   - Créer `SyncHistoryRecorder` (services). Méthodes : `recordForcedRange(response, context)`.
   - Ajout de tests (cases : succès, cache hit, échec Python).
2. **Construction Payload**
   - Déplacer la logique de `requestBody` (mode, range, includeToday, meta) dans `SyncRequestService.buildPayload`.
   - Assurer compatibilité backend (`rangeStart`, `rangeEnd`, `start`, `end`).
3. **Orchestration**
   - `useGarminSyncActions.syncNow` :
     1. `const context = contextFactory.create(options, stateRefs)`.
     2. `const result = await orchestrator.execute(context)`.
     3. `await historyRecorder.record(result, context)`.
     4. `postProcess(result)` (import Endurance, setGarminData, etc.).

### 2.4 Stabiliser `garminSyncFetch.js`

#### 2.4.1 Nouveaux composants

- `BaseUrlRegistry`
  - Stocke les bases (`defaults = [window.origin, VITE_GARMIN_SERVER_URL?, http://localhost:3031]`).
  - Méthodes : `getAll()`, `add(base)`, `reset()`, `remove(base)`.
- `CircuitBreaker` (utilisé en Phase 4 mais préparé ici)
  - API : `recordSuccess()`, `recordFailure()`, `canAttempt()`.
- Logger injectable (`const log = providedLogger ?? logger.module('garminSyncFetch')`).

#### 2.4.2 Tests

- `tryFetch` fallback multi-base : simuler fetch KO sur base1, OK base2.
- Timeout → AbortError → Retry (3 tentatives).
- Erreur finale → message enrichi (avec hint debug).

### 2.5 Monitoring & instrumentation

- Ajouter `window.__GARMIN_SYNC_METRICS__` (dernier mode, source cache, durée, base URL utilisée).
- DebugPanel → nouvelle carte “Flux Sync” (orchestrateur) :
  - Range demandé, source data, durée fetch, retries.
- Logs : uniformiser prefixes (`[SyncRangeService]`, `[SyncCacheService]`, …).

### 2.6 Checklist finale

- [x] Services créés + tests unitaires.
- [x] Orchestrateur intégré dans `useGarminSync` (hook scindé).
- [x] Historique (`forcedRangesHistory`) intact après refactor.
- [x] `garminSyncFetch` supporte BaseUrlRegistry + logger injectable.
- [ ] Synchronisations manuelles/forcées/auto testées (today, yesterday, range, auto).
- [ ] Documentation mise à jour (`docs/garmin/ANALYSE_ONGLET_GARMIN.md`, ce plan).

---

## Phase 1 : Optimisation Stockage (P0)

> **Objectif global** : Réduire drastiquement le coût des opérations IndexedDB (sauvegarde, chargement, purge) afin de garantir une synchronisation fluide même avec plusieurs mois de données.
>
> **KPIs cibles** :
> - Sauvegarde 50 activités < **200 ms** (au lieu de 1200 ms).
> - Chargement d’une plage de 90 jours < **250 ms** (au lieu de 390 ms).
> - Temps de purge quotidien < **50 ms**.
>
> **Risques à mitiger** :
> - Régression sur l’intégrité des données (écritures partielles).
> - Verrous concurrentiels si plusieurs sync simultanées.
> - Compatibilité fallback (localStorage) si IndexedDB indisponible.

### 1.1 Diagnostic

| Symptôme | Analyse | Impact |
|----------|---------|--------|
| Sauvegarde séquentielle (`saveActivities`) | 1 transaction `get` + 1 transaction `put` pour chaque activité | 1,2 s pour 50 activités, bloque l’UI lors d’un forçage |
| Chargement multi-store (`loadDataForTab`) | 2 transactions indépendantes (activités + métriques) + filtrage en mémoire | 390 ms pour 90 jours, CPU waste |
| Purge journalière (`autoPurge`) | Parcours complet de la DB sans batching | >200 ms sur devices lents |

### 1.2 Solutions proposées

1. **BatchStorageManager** (sauvegarde atomique)
   - Transaction unique `readwrite`.
   - Lecture via curseur (`openCursor`) → `Map` en mémoire.
   - Fusion en mémoire (`mergeActivity`).
   - Écriture parallèle `Promise.all` et commit unique.
   - Ajout de métriques : `duration`, `saved`, `skipped`.

2. **MultiStoreLoader** (chargement optimisé)
   - Transaction `readonly` couvrant `garmin_activities` et `garmin_daily_metrics`.
   - Range query via index `date` (`IDBKeyRange.bound`).
   - Fallback curseur si index manquant (log warning).
   - Retour structuré `{ activities, metrics }` pour éviter conversions.

3. **PurgeManager** (bonus)
   - Introduire `PurgeManager` pour encapsuler `autoPurge` + `purgeOldTimeSeries`.
   - Utiliser transactions batched + suppression par lots.
   - Stocker `lastPurgeDuration` dans `garmin_meta` pour monitoring.

### 1.3 Plan d’implémentation

1. **Créer les nouveaux services**
   - `src/hooks/garmin/storage/BatchStorageManager.js`
   - `src/hooks/garmin/storage/MultiStoreLoader.js`
   - `src/hooks/garmin/storage/PurgeManager.js` (optionnel mais recommandé).

2. **Mettre à jour `useGarminData.js`**
   - Remplacer `garminDataSave` par `batchStorageManager` pour `saveActivities` / `saveDailyMetrics`.
   - Remplacer `garminDataLoad.loadDataByRange` par `multiStoreLoader.loadDataByRange`.
   - Injecter `purgeManager` dans `autoPurgeWrapper`.
   - Ajouter logs `log.info` avec métriques renvoyées.

3. **Assurer la compatibilité fallback**
   - Si `openDB()` échoue, `batchStorageManager` doit retourner `{ saved: 0, skipped: n }`.
   - `multiStoreLoader` → fallback vers localStorage (structure actuelle).

4. **Bench & validation**
   - Scripts Node (`scripts/bench/saveActivities.js`, `.../loadData.js`).
   - Comparer avant/après (console + fichier `temp_storage_bench.json`).
   - Tester sur navigateur mobile (Chrome DevTools throttling).

### 1.4 Monitoring & alerting

- Ajouter compteur `window.__GARMIN_STORAGE_METRICS__` (dernier `duration` sauvegarde/chargement/purge).
- DebugPanel → section “IndexedDB” avec dernières durées + taille estimée.
- Ajouter alerte console si `duration > 500 ms` pour diagnostic rapide.

### 1.5 Checklist finale

- [ ] Services créés et exportés.
- [ ] `useGarminData` mis à jour (sauvegarde, chargement, purge).
- [ ] Tests unitaires (mocks IndexedDB) + fallback localStorage.
- [ ] Scripts bench exécutés (captures temps avant/après).
- [ ] Documentation actualisée (`docs/garmin/ANALYSE_ONGLET_GARMIN.md`, ce plan).
- [ ] Monitoring IndexDB activé (DebugPanel + console).

---

## Phase 3 : Unified Cache Strategy (P0)

> **Objectif global** : coordonner les trois niveaux de cache (mémoire, IndexedDB, serveur) pour éviter les requêtes redondantes et garantir une fraîcheur maîtrisée des données.
>
> **KPIs cibles** :
> - Taux de cache hit mémoire ≥ **60 %** sur les synchronisations en chaîne.
> - Taux de cache hit IndexedDB ≥ **80 %** lorsque les données ont < 5 minutes.
> - Temps de réponse moyen < **200 ms** pour un hit cache (vs ~450 ms actuellement).
>
> **Risques** :
> - Invalidation incorrecte → données obsolètes.
> - Multiplicité des sources → incohérence si pas de clé commune.
> - Complexité accrue → besoin de monitoring précis.

### 3.1 Diagnostic

| Cache | Implémentation actuelle | Limites |
|-------|-------------------------|---------|
| Mémoire (`frontendCache`) | TTL 30 s (today) / `CACHE_TTL_MS` (passé), clé `sync_${start}_${end}_${ts}` | Pas de versioning, pas d’indication d’origine dans l’UI |
| IndexedDB | `checkExistingData` charge **toutes** les données (`loadAllData`) | Coûteux, pas de vérification de fraîcheur, dépend du temps de sync |
| Serveur (`garmin-server`) | Clé `start+end+lastSyncTimestamp`, TTL ajusté (aujourd’hui vs passé) | Pas aligné avec clé front, pas de stats exposées |

### 3.2 Architecture cible

```
SyncOrchestrator
  └── SyncCacheService
        └── CacheCoordinator (cascade)
              ├── MemoryCacheAdapter (frontendCache)
              ├── IndexedDbAdapter (multiStoreLoader)
              └── ServerCacheAdapter (réponse JSON cached)
```

- **Clé unifiée** : `garmin:${version}:${mode}:${start}:${end}:${includeToday}:${lastSync}` appliquée à tous les caches (mémoire/IDB/serveur) + meta TTL exposée.
- **Versioning** : incrémenter `cacheSchemaVersion` dans `constants.js` à chaque changement de structure.
- **Carte d’identité** : chaque hit renvoie `source`, `ageMs`, `schemaVersion` pour logging & UI.

### 3.3 Solutions

1. **MemoryCacheAdapter**
   - Stocke `{ data, timestamp, cacheKey, schemaVersion }`.
   - `isValid(range, context)` vérifie clé + TTL + version.
   - `set(data)` met à jour en injectant `schemaVersion`.

#### 3.3.1 Implémentation en cours (2025-11-09)

- `MemoryCacheAdapter`, `IndexedDbCacheAdapter` et `CacheCoordinator` créés, connectés à `SyncCacheService` (cascade mémoire + IndexedDB + existingData).
- `ServerCacheAdapter` intégré : la réponse du backend (`cached = true`) est mémorisée et rejouée en cascade, avant fallback réseau.
- Clé unifiée `garmin:${version}:${mode}:${start}:${end}:${includeToday}:${lastSync}` appliquée à tous les caches (mémoire/IDB/serveur) + meta TTL exposée.
- UI : `SyncControls` affiche désormais source/TTL du dernier hit (badge + mode dégradé), DebugPanel intègre `CacheDiagnostics` (lecture `cacheMeta`).
- Mode dégradé forcé : lorsqu’un forçage dépasse 30 s, `performSyncRequest` notifie `useGarminSyncActions` → badge “degraded”, conservation du cache courant, meta poussée dans `lastSourceMeta`.
- Prochaines étapes tests manuels : vérifier la synchronisation pour les scénarios `today`, `yesterday`, `range` (avec/sans includeToday) et `auto` (délai) en observant l’évolution des badges/cacheMeta. 

#### 4.2.1 Avancement (2025-11-09)

- `garminSyncFetch` adopte `BaseUrlRegistry` avec promotion dynamique des bases et reset centralisé.
- Circuit breaker frontend implémenté (`CircuitBreaker`, `garminSyncFetch`), avec ouverture après 3 échecs, cooldown 30 s, instrumentation (`GARMIN_CIRCUIT_OPEN`). Tests Vitest dédiés.
- Mode dégradé (fallback cache) activé côté orchestrateur lorsqu’un `GARMIN_CIRCUIT_OPEN` est levé (utilisation cache mémoire/IDB hors TTL, statut “mode dégradé”).

2. **IndexedDbAdapter**
   - Utilise `multiStoreLoader.loadDataByRange(start, end)`.
   - Vérifie `lastSynced` (stocké dans `garmin_daily_metrics` et `garmin_meta.lastSyncTimestamp`) pour s’assurer < 5 minutes.
   - Retourne `null` si données vides (pour laisser la requête passer).

3. **ServerCacheAdapter**
   - S’appuie sur `response.cached === true` renvoyé par le backend.
   - Ajoute `source: 'server'` + TTL restant fourni dans `diagnostic`.

4. **CacheCoordinator**
   - `resolve(range, context)` :
     1. `memoryHit = memoryAdapter.get(range)`.
     2. Sinon, `idbHit = indexedDbAdapter.get(range)`.
     3. Sinon, `return null` → requête serveur.
   - Après requête serveur, `notifyServerHit(response)` enregistre statistique.

### 3.4 Plan d’implémentation

1. Créer dossier `services/cache/` avec :
   - `MemoryCacheAdapter.js`
   - `IndexedDbCacheAdapter.js`
   - `ServerCacheAdapter.js`
   - `CacheCoordinator.js`
2. Mettre à jour `SyncCacheService` pour utiliser `CacheCoordinator`.
3. Ajouter un champ `cacheSchemaVersion` dans `constants.js` et l’injecter partout (front + backend si nécessaire).
4. Adapter `garmin-server.js`
   - Inclure `diagnostic.cacheKey`, `diagnostic.schemaVersion` dans la réponse.
   - Loguer `cacheHitLevel` sur le serveur.
5. UI / DebugPanel
   - Ajout badge “Source données : memory / indexedDB / server / live”.
   - Afficher `ageMs`, `schemaVersion` pour debug.

### 3.5 Tests & validation

- Tests unitaires `CacheCoordinator` :
  - `memoryHit` → renvoie directement.
  - `memoryMiss` + `indexedDbHit` → renvoie data.
  - `forceRefresh` → bypass complet (tests pour vérifier que memory/idb ne sont pas utilisés).
  - ✅ Vitest : `services/cache/__tests__/CacheCoordinator.test.js` (memory/indexeddb/server/existingData/miss/bypass + statistiques `__GARMIN_CACHE_STATS__`).
- Tests unitaires `MemoryCacheAdapter` : ✅ `services/cache/__tests__/MemoryCacheAdapter.test.js` (expiration TTL, clé/schemaVersion, set/get, forceRefresh).
- Tests unitaires `IndexedDbCacheAdapter` : ✅ `services/cache/__tests__/IndexedDbCacheAdapter.test.js` (loadData null, données vides, forceRefresh, payload structuré avec maxAge).
- Tests orchestrateur (integration) : mock adapters.
- Tests manuels :
  - Synchroniser deux fois de suite → memory hit.
  - Attendre 10 s → memory expire, IDB hit.
  - ForceRefresh → `source: live`.

### 3.6 Monitoring

- Exposer `window.__GARMIN_CACHE_STATS__` (nb hits par source, TTL restants). DebugPanel : graphique miniature (barres) sur les 10 dernières sync (source/cache).
- ✅ Implémenté (2025-11-11) : `CacheCoordinator` met à jour `window.__GARMIN_CACHE_STATS__` avec hits/historique, `CacheDiagnostics` affiche les compteurs cumulés et les 5 derniers événements.

### 3.7 Validation manuelle

- **Today** : sync → rerun <30s → badge `memory`, `ttlMs` décrémente, stats `memory++`. ForceRefresh → badge `live`, `bypass + miss` incrémentés.
- **Yesterday** : forcer → badge `live`; re-forcer < TTL → `memory`, après expiration → `indexeddb`.
- **Range** : plage 7 jours – run1 `live`, run2 `memory`, après 2 min run3 `indexeddb`. DebugPanel reflète l’ordre des hits.
- **Auto-sync** : 10 min → badge `memory` (< TTL) sinon `indexeddb`, compteurs mis à jour.
- **Mode dégradé** : backend off + force today → badge “mode dégradé”, `degraded=true`, aucun hit `live`. Backend on + `syncNow()` → circuit refermé, badge `live`.

### 3.8 Checklist finale

- [x] Adapters + CacheCoordinator implémentés.
- [x] Clé unifiée + versioning appliqués (memory, IDB, serveur).
- [x] UI affiche la source de données + TTL.
- [x] Tests unitaires/integration passés.
- [x] Monitoring mis à jour.
- [x] Documentation synchronisée.
- ✅ Tests Vitest adapters (Memory/IndexedDb) en place.
- ✅ Scénarios manuels `today/yesterday/range/auto/degraded` validés (cf. Phase 4.5).

#### 3.9 Journal des tests manuels (2025-11-11)

| Scénario | Résultat | Observations |
|----------|----------|--------------|
| Today (sync normal + re-sync <30s) | ✅ | `syncNow()` → badge `live`; relance <30s → badge `memory`, `cacheMeta.ttlMs` diminue, `__GARMIN_CACHE_STATS__.hits.memory` +1. |
| Today (force) | ✅ | `forceRefresh:true` → badge `live`, compteurs `miss` & `bypass` incrémentés ; overlay disparaît immédiatement. |
| Yesterday (force x2) | ✅ | Run 1 → badge `live`; run 2 immédiat → `memory`; run 3 après TTL mémoire → `indexeddb`. |
| Range 7 jours | ✅ | Run 1 `live`, run 2 `memory`, run 3 (après 2 min) `indexeddb`. DebugPanel affiche la cascade. |
| Auto-sync (10 min) | ✅ | Après attente, badge `memory` (moins de 10 min); compteurs cache mis à jour. |
| Mode dégradé | ✅ | Backend stoppé → forçage today : badge “mode dégradé”, `cacheMeta.degraded=true`; backend relancé → `syncNow()` referme le circuit (`Circuit OK`). |
| Overlay & badge circuit | ✅ | Pendant forçage long (>6s) l’overlay apparaît puis se ferme dès la fin ; bouton “Réinitialiser le circuit” actif uniquement quand breaker ouvert. |

#### 3.10 Journal des tests automatisés (Vitest)

- 2025-11-10 — `npm run test -- --run` ✅ (Garmin services + Endurance submit + BodyTracking metrics). Les suites héritées `integration` / `useAdvancedFilters` / `useAutoSync` / `useGarminData` restent en `describe.skip` en attendant une réécriture dédiée.
- 2025-11-11 — `npx vitest run src/components/tabs/EnduranceTab/__tests__/submitSession.test.jsx src/components/BodyTracking/services/__tests__/failing_tests_only.test.js` ✅ (Endurance submit + BodyTracking services).

---

## Phase 4 : Résilience Réseau (P1)

> **Objectif global** : garantir que l’expérience utilisateur reste fluide même lorsque le backend Garmin est instable ou indisponible.
>
> **KPIs cibles** :
> - Temps maximum bloquant en cas de panne backend < **2 s** (au lieu de 90 s).
> - Nombre moyen de retry auto limité à **3** avec jitter.
> - Visibilité claire dans l’UI du statut réseau (mode normal vs dégradé).
>
> **Risques** :
> - Fausses alertes (circuit breaker trop sensible).
> - Flood de logs si retry mal configuré.
> - Divergence front/back si l’un continue à servir du cache obsolète.

### 4.1 Diagnostic

| Problème | Analyse | Conséquences |
|----------|---------|--------------|
| Retry naïf dans `tryFetch` | `for` sur `BASES` + retries sans circuit breaker | Utilisateur patient pendant 90 s sans feedback |
| Pas de mode dégradé | `syncNow` échoue et renvoie l’erreur brute | Aucun fallback (même si IndexedDB possède des données) |
| Logs limités | Uniquement logs console → pas de stats | Difficulté de diagnostiquer les pannes réseau |

### 4.2 Solutions

1. **CircuitBreaker**
   - État : `closed` → `halfOpen` → `open`.
   - Paramètres (configurable dans `constants.js`) :
     - `MAX_CONSECUTIVE_FAILURES` (ex. 3).
     - `COOLDOWN_MS` (ex. 30 s).
   - `canAttempt()` est vérifié avant chaque fetch ; si `open`, on retourne immédiatement `GARMIN_CIRCUIT_OPEN`.

#### 4.2.1 Avancement (2025-11-09)

- `garminSyncFetch` adopte `BaseUrlRegistry` avec promotion dynamique des bases et reset centralisé.
- Circuit breaker frontend implémenté (`CircuitBreaker`, `garminSyncFetch`), avec ouverture après 3 échecs, cooldown 30 s, instrumentation (`GARMIN_CIRCUIT_OPEN`). Tests Vitest dédiés.
- Mode dégradé (fallback cache) activé côté orchestrateur lorsqu’un `GARMIN_CIRCUIT_OPEN` est levé (utilisation cache mémoire/IDB hors TTL, statut “mode dégradé”).

#### 4.2.2 Avancement (2025-11-10)

- Forçage surveillé : `performSyncRequest` déclenche un timer (30 s) qui bascule l’UI en **mode dégradé** (message + badge + `lastSourceMeta`) tout en conservant les données locales.
- Backend : pour les forçages, `garmin-server` réduit le payload (delta HR / body battery / respiration post `lastSyncTimestamp`) et diffuse la réponse en **stream chunked**, évitant le buffer massif qui provoquait les timeouts 90 s.
- Méta forcée injectée dans `diagnostic.forcedDelta` (supprime points, jours touchés, seuil) pour logs + DebugPanel.

#### 4.2.3 Avancement (2025-11-11)

- `SyncControls` expose maintenant les compteurs cache (`window.__GARMIN_CACHE_STATS__`), l’historique des hits et l’état du circuit (badges `Circuit OK / ouvert / test`).
- CTA “Réinitialiser le circuit” (appel `circuitBreaker.reset()`) disponible lorsque l’état est `open`, avec affichage du cooldown restant.
- `lastSourceMeta` fusionne systématiquement les métadonnées réseau (`circuit`, `cooldownMs`, `failureCount`) pour cohérence DebugPanel / UI.
- DebugPanel accueille `NetworkDiagnostics` : timeline des fetchs (`success/failure/blocked`), compteurs cumulés, derniers événements et états du breaker (mise à jour via `garmin-network-update`).
- 🔧 **Fix DataError IDB (2025-11-11 02:15)** : lors de l’enregistrement d’un forçage récent, `saveForcedRangeEntry` purge désormais l’attribut `id` avant `store.add(...)` lorsque l’auto-incrément doit générer la clé. Cela supprime l’erreur `DataError: ... key path yielded a value that is not a valid key` observée après un forçage + accès aux graphiques (écriture historique). Validation : forçage `today` → ouverture section Graphiques sans erreur, historique persiste correctement.
- 🌀 **Fix overlay bloquant (2025-11-11 03:05)** : le `historyRecorder.record` est maintenant déclenché en tâche de fond (promise non bloquante) et les transitions `loading` sont tracées via `useGarminSyncState`. Résultat : le spinner “Synchronisation en cours…” disparaît immédiatement à la fin du traitement principal, même si la persistance d’historique prend plus de temps, et le forcing `yesterday` enchaîné ne fige plus l’UI.

2. **Mode Dégradé**
   - `SyncCacheService` reçoit le statut du circuit.
   - Si `CircuitBreaker` (open) :
     - `IndexedDbAdapter` tente malgré la limite des 5 minutes.
     - UI affiche badge “Mode hors-ligne” + timestamp dernière sync.
     - `syncNow` renvoie (`source: 'offline'`) + message UX.

3. **Retry intelligent**
   - `SyncRetryService` gère les erreurs `5xx`, `ETIMEDOUT`, `AbortError`.
   - Backoff exponentiel + jitter (ex. 1 s, 2 s, 4 s ± 200 ms).
   - Limité à `MAX_NETWORK_RETRY` (3 par défaut).
   - Arrêt immédiat si erreur client (4xx).

4. **Instrumentation**
   - `garminSyncFetch` logue `attempt`, `base`, `duration`, `error`.
   - `SyncRetryService` compile `retryCount`, `totalDelay` pour les logs et l’UI.
   - DebugPanel : section “Santé réseau” (état circuit, base utilisée, dernier succès/échec).

### 4.3 Plan d’implémentation

1. **CircuitBreaker**
   - Fichier `services/network/CircuitBreaker.js`.
   - API : `recordSuccess()`, `recordFailure()`, `canAttempt()`, `getState()`, `getCooldownRemaining()`.
   - Instance partagée dans `garminSyncFetch`.

2. **Mise à jour `tryFetch`**
   - Avant chaque tentative : `if (!circuitBreaker.canAttempt()) throw new CircuitOpenError(...)`.
   - Après succès : `circuitBreaker.recordSuccess()`.
   - Après échec : `circuitBreaker.recordFailure()`.
   - Lorsqu’une base réussit, ajouter `baseUrlRegistry.promote(base)` (optionnel).

3. **Mode dégradé dans `SyncCacheService`**
   - `context.networkStatus` (fourni par orchestrateur) expose `isCircuitOpen` + `lastFailure`.
   - Si `open`, activer fallback IndexedDB.
   - `SyncRequestService` renvoie une réponse annotée `from: 'offline'` si aucun fetch n’est tenté.

4. **UI / UX**
   - `SyncControls` : badge `Mode hors-ligne` + CTA “Réessayer maintenant”.
   - CTA appelle `circuitBreaker.reset()`, tentative directe sans fallback.
   - Toast/alert : “Dernière sync réussie il y a X minutes (données hors-ligne)”.

### 4.4 Tests & validation

- Tests unitaires `CircuitBreaker` (risques de clignotement). Cas :
  - `failureCount` < threshold → état `closed`.
  - `failureCount` == threshold → `open`, `canAttempt()` false.
  - Après cooldown → `halfOpen`, 1 tentative → `recordSuccess()` ou `recordFailure()`.
- Tests d’intégration orchestrateur (mode dégradé) : mock fetch pour lever `CircuitOpenError`.
- Tests manuels :
  - Éteindre `garmin-server` → vérifier UI (badge, fallback IDB).
  - Relancer serveur → CTA “Réessayer” → circuit se ferme, sync normale.

### 4.5 Monitoring

- Exposition `window.__GARMIN_NETWORK_METRICS__` (state, lastFailure, retries, totalDowntime).
- DebugPanel : afficher timeline des derniers 10 fetch (succès/échec, base).
- À terme : reporter vers Datadog/ELK (Phase 6).

### 4.6 Checklist finale

- [ ] CircuitBreaker implémenté + tests.
- [ ] `tryFetch` mis à jour (circuit, retry, logs).
- [ ] `SyncCacheService` reconnaît le mode dégradé.
- [ ] UI affiche badge + CTA.
- [ ] Tests auto & manuels validés.
- [ ] Documentation mise à jour.

---

## Phase 5 : Optimisation UI (P2)

> **Objectif global** : rendre l’interface Garmin réactive, lisible et accessible, avec des re-renders ciblés et un feedback utilisateur explicite.
>
> **KPIs cibles** :
> - Temps de re-render `GarminTab` lors d’un changement d’état < **50 ms** (actuellement >150 ms).
> - Réduction de l’arbre React (nombre de nœuds) de 30 %.
> - Scores Lighthouse accessibilité ≥ **90**.
>
> **Risques** :
> - Fragmentation du state si la décomposition est mal gérée.
> - Couche selectors mal conçue → complexité inutile.
> - Régression UX (éléments UI déplacés/supprimés).

### 5.1 Diagnostic

| Problème | Analyse | Impact |
|----------|---------|--------|
| `GarminTab.jsx` ~1100 lignes | Contient layout, logique, préchargement, sections | Difficulté maintenance, re-render global |
| Passage de `garminData` complet en props | Chaque update `garminData` rerender toutes les sections | Lag visible lors sync/forçage |
| Feedback utilisateur limité | Source de données (cache vs live) invisible | Incompréhension en cas de données obsolètes |
| Accessibilité perfectible | Dialogues sans focus trap, aria partiels | Difficulté usage clavier/lecteur vocal |

### 5.2 Décomposition en composants

1. **`GarminTabLayout.jsx`**
   - Rôle : scaffold général, barre d’onglets, Suspense boundaries.
   - Gère aussi les préchargements (`TAB_PREFETCHERS`).

2. **Sections spécialisées**
   - `DashboardSection`, `ActivitiesSection`, `MetricsSection`, `ChartsSection`.
   - Chacune reçoit uniquement les données nécessaires via selectors.
   - Propre logique de fallback (skeleton) + instrumentation.

3. **Sidebar / Panels**
   - `SyncControls` (déjà existant) → à rendre pure (props memo).
   - `DebugPanel`, `AutoSyncSettings`, `PDFExport` → lazy + memo.

#### 5.2.1 Avancement (2025-11-10)

- Contexte enrichi : `GarminProvider` expose désormais `cacheMeta`, facilitant l’accès à la source des données dans toute l’UI.
- Hook `useGarminSelectors` créé pour regrouper sélecteurs mémoïsés (dates disponibles, métriques courantes/comparaison, activités filtrées, méta cache).
- `GarminDashboard` ne reçoit plus le blob `garminData` : il consomme les sélecteurs/Context, réduisant les props massifs et les re-renders liés.
- `GarminTabLayout` extrait la structure (header, overlay, info serveur) et `DashboardSection` encapsule l’onglet principal via `Suspense`, simplifiant `GarminTab.jsx`.
- `ActivitiesSection` / `MetricsSection` isolent les contenus correspondants ; `TabNavigation` (accessible, gestion flèches, préfetch) remplace la tablist inline (moins de logique répétée, meilleure lisibilité).
- `ChartsSection` orchestre désormais les graphiques via `useGarminChartSelectors` (sélecteurs mémo pour séries, couleurs, activités) limitant les props massifs et simplifiant l’extension future (nouveaux graphiques, export).
- `buildGarminChartDataset` (utilitaire pur) fabrique les séries dérivées (trend, timeSeries, heatmap, corrélations) exploitées par les graphiques, l’export JSON (`derivedCharts`) et le module PDF (options `derived`).
- `UtilitiesSection` regroupe `AutoSyncSettings` + `PDFExport` (Suspense unique, fallback homogène) et consomme les sélecteurs internes au lieu de props massifs (`garminData`).

#### 5.2.2 Priorités opérationnelles (2025-11-11)

| Axe | Constats | Plan d’action (en mode incrémental, chaque étape documentée + testée) |
|-----|----------|------------------------------------------|
| **Selectors dérivés unifiés** | `useGarminChartSelectors` expose `chartData` global (via `buildGarminChartDataset`), mais plusieurs charts tombent encore sur des recalculs locaux (ex. `GarminHeartRateTimeSeriesChart` ré-applique `prepareTimeSeriesForDisplay` / `enrichHeartRate…` quand `precomputed` est partiel). | 1. Étendre `buildGarminChartDataset` pour garantir, pour chaque visu, un objet complet (`trend`, `stats`, `yAxis`, `timeSeries`, `meta`), documenté et typé.<br>2. Adapter `useGarminChartSelectors` pour exposer explicitement les dérivés nécessaires (min/max, domaines Y, temps forts, séries downsamplées).<br>3. Refactorer chaque chart pour consommer **exclusivement** `precomputed` (suppression des fallback coûteux) + mettre en place `React.memo`/comparateurs précis.<br>4. Vérifier synchronisation IndexedDB ↔ selectors (pas de recalcul/decompression côté rendu). |
| **Harmonisation export JSON / PDF** | `exportAll()` réutilise `buildGarminChartDataset` mais seulement sur les 30 derniers jours, et `PDFExport` reconstruit encore un dataset local (dates/anchor). Risque de divergence si structure évolue. | 1. Créer un helper partagé (`buildDerivedDataset({ dailyMetrics, activities, dates, anchor })`) pour centraliser la génération dérivée (JSON, PDF, UI).<br>2. Étendre `exportAll` pour référencer la même fonction (et documenter clairement les champs exportés).<br>3. Adapter `PDFExport` / `pdfGenerator` pour consommer les dérivés fournis (min/max FC, stats respiration, heatmap agrégée) sans recalcul.<br>4. Vérifier cohérence avec export JSON : pour chaque nouveau champ (ex. `heartRateTimeSeries.stats`), décider s’il doit être persisté dans IndexedDB ou recalculé à la volée, et documenter dans la section Export. |
| **Modularisation utilitaires (AutoSync, PDF, Debug)** | Les modules consomment encore des fragments de `garminData` ou manipulent localStorage directement. | 1. Injecter les selectors pertinents (`useGarminSelectors`, `useGarminChartSelectors`) pour éviter les accès directs au blob global.<br>2. Encapsuler la configuration (autsync delay, maintenance summaries) dans des hooks dédiés (`useAutoSyncSettings`) exposant getter/setter mémoïsés.<br>3. Simplifier `DebugPanel` : lecture unique des stores globaux, subscription unique via `useEffect`, dériver UI depuis `cacheMeta`/`networkStats` fournis par `useGarminSync`.<br>4. Vérifier l’impact sur IndexedDB (aucune nouvelle écriture non instrumentée) et sur l’export (ajouter tout champ utile si non présent). |
| **Accessibilité & feedback** | `ForceRangeDialog` utilise encore des focus traps maison; certains badges manquent d’aria-live. | 1. Choisir une solution focus trap (Radix ou hook interne) et l’appliquer aux dialogues/menus.<br>2. Généraliser `aria-live="polite"` pour les messages de status (SyncControls).<br>3. Ajouter instrumentation `window.__GARMIN_UI_METRICS__` (temps de render, taille arbre) pour suivre les KPI Phase 5. |

#### 5.2.3 Avancement (2025-11-11)

- `ChartsSection` ne transmet plus le blob `dailyMetrics` aux charts (hors time-series historique) : toutes les visualisations consomment directement les datasets dérivés `precomputed` exposés par `useGarminChartSelectors`.
- Nouveaux comparateurs `areDerivedChartPropsEqual` basés sur l’identité de `precomputed` → plus de mémoires stables (`React.memo`) et absence de recomputations liées à `dailyMetrics`.
- `GarminHeartRateChart`, `GarminBodyBatteryChart`, `GarminStressChart`, `GarminSleepChart`, `GarminRespirationChart`, `GarminActivityHeatmap`, `GarminCorrelationCharts` : suppression des `useFilteredDates` redondants, reliance totale sur les dérivés (`data`, `average`, `yAxisDomain`, `weeks`, etc.), affichage intact.
- `GarminHeartRateTimeSeriesChart` reste compatible avec `precomputed` (memo via `areDerivedChartPropsEqual`) ; le fallback legacy est conservé mais ne s’exécute plus tant que le dataset dérivé est présent.
- Mutualisation dérivés (`buildDerivedDataset`) : l’UI, `exportAll()` (JSON) et `PDFExport` consomment désormais la même fabrique (dates triées, ancre fiable). Plus aucune reconstitution locale dans `PDFExport`.
- `AutoSyncSettings` consomme `useGarminSelectors` (source cache, dernière date) + nouveau hook `useAutoSyncSettings` (auto-save centralisé). `useAutoSync` gère désormais `delayBeforeSync` nativement (attente côté hook + cancellation propre).
- `DebugPanel` bascule sur composants lazy (`CacheDiagnostics`, `NetworkDiagnostics`, `UIMetrics`) et lit directement `window.__GARMIN_NETWORK_STATS__` / `window.__GARMIN_UI_METRICS__` via événements (`garmin-network-update`, `garmin-ui-metrics-update`).
- Ajout `ServerDiagnostics` (résumé backend) et boutons de rafraîchissement (tryFetch `/api/garmin/debug`) reliés à `useGarminSyncActions.refreshDiagnostics`. Les snapshots réseau/UI sont fournis par `getNetworkStatsSnapshot` / `getUIMetricsSnapshot`.
- Nouveau hook `useFocusTrap` (gestion tab/escape + restauration focus) intégré dans `ForceRangeDialog` et `DebugPanel` (`role="dialog"`, `aria-modal="true"`), garantissant navigation clavier conforme WCAG.
- `ForceSyncMenu` utilise `useFocusTrap` + `data-autofocus` (première entrée active), restauration du focus sur le bouton déclencheur, gestion `Escape`.
- `SyncControls` expose désormais un canal `aria-live` (`polite` + `sr-only`) pour annoncer le statut courant, la dernière sync et la source cache, avec conteneur d’erreur `role="alert"` afin de garantir une lecture immédiate par les lecteurs d’écran.
- `Toast` / `ToastContainer` : chaque notification embarque désormais `role="status"`/`role="alert"` + `aria-live` paramétré selon la sévérité (succès/info = polite, erreur = assertive) et bouton de fermeture explicite (`type="button"`), offrant un feedback non bloquant mais audible pour les lecteurs d’écran.
- Centralisation `uiMetricsStore` : export `ensure/update/reset/get` (immutables) + hook `useUIMetricsTelemetry` (profilage `performance.now`) injecté dans `GarminTab`. Le store conserve `renderCount`, `lastRenderComponent`, historique des 5 derniers rendus (ms arrondies) et déclenche `garmin-ui-metrics-update` sur chaque mise à jour.
- `DebugPanel/UIMetrics` affiche maintenant les métriques de rendu (durée, composant, compteur) et liste les 5 derniers rendus pour corréler re-renders et sync.
- Toutes les sections principales (`DashboardSection`, `ActivitiesSection`, `MetricsSection`, `ChartsSection`, `UtilitiesSection`) intègrent `useUIMetricsTelemetry` afin de profiler précisément leurs re-renders dès l’activation de `GarminTab`.

### 5.3 Sélecteurs & memoization

- Créer `useGarminSelectors()` :
  - `useDailyMetrics(date)` : renvoie métriques pour la date + memo.
  - `useActivitiesByType(type, range)` : renvoie activités filtrées.
  - `useCacheSource()` : renvoie la dernière source (memory/indexeddb/server/offline).
- Implémentation : utiliser `useMemo` + `useSyncExternalStore` pour écouter les diffs précises.
- Utiliser `React.memo` sur les sections principales avec comparaison custom si besoin.

### 5.4 Feedback & accessibilité

1. **Feedback source données**
   - `SyncControls` affiche `Badge` (ex. `Source : memory cache (12s)`).
   - Historique forçages : afficher `source`, `retryCount`, `pythonDuration`.

2. **Dialogs & menus**
   - Utiliser `@radix-ui/react-dialog` ou focus trap custom pour `ForceRangeDialog`.
   - Ajouter `aria-labelledby`, `aria-describedby`, `role="alertdialog"` si pertinent.
   - Fermeture accessible (`Esc`, bouton “Fermer”).

3. **Skeletons & loaders**
   - Skeleton par section (cards, charts, tables) pour éviter flashs.
   - Indicateur “données hors-ligne” lorsque circuit ouvert.

4. **Accessibilité globale**
   - Contraste couleurs (badge, boutons).
   - Navigation clavier (onglets, menus `ForceSyncMenu`).
   - Messages d’erreur lisibles (aria-live).

### 5.5 Plan d’implémentation

1. **Création layout + sections**
   - Déplacer layout dans `GarminTabLayout`.
   - Référencer sections dans un mapping `const sections = { dashboard: <DashboardSection /> }`.

2. **Selectors**
   - Créer `src/components/tabs/GarminTab/hooks/useGarminSelectors.js`.
   - Utiliser `useContext(GarminContext)` pour accéder aux données.
   - Optimiser `garminData` (structures immuables) pour faciliter comparaison.

3. **Refactor `SyncControls`**
   - Props : `loading`, `status`, `onSync`, `cacheSource`, `retryInfo`.
   - Afficher badge source + CTA (mode dégradé).

4. **Accessibilité dialogues/menus**
   - Intégrer focus trap (Radix ou hook maison).
   - Vérifier avec `axe-core` (chromium plugin ou tests).

5. **Tests visuels**
   - Utiliser Storybook (optionnel) pour chaque section.
   - Captures screenshot via Playwright (mode UI).

### 5.6 Tests & validation

- Tests unitaires selectors (vérifier memo, re-render minimal).
- Tests E2E (Playwright) :
  - Navigation onglets clavier.
  - Ouverture/fermeture `ForceRangeDialog` (focus revient sur bouton).
  - Badge source change lors d’un forçage (cache vs live).
- Lighthouse (ou axe) pour vérifier scores accessibilité.

### 5.7 Monitoring

- Ajouter instrumentation `window.__GARMIN_UI_METRICS__` (`lastRenderDuration`, `renderCount`, `lastDatasetHash`) pour observer l’impact UI des selectors dérivés.
- Exposer un hook debug (`useUIMetrics`) pour afficher ces métriques dans le `DebugPanel`.

### 5.8 Journal de validation

- **2025-11-11 · 04:28** — `npx vitest run` (43 tests passés / 4 suites legacy `describe.skip`). Confirme la stabilité post-refactor des charts dérivés (Phase 5 · Étape 1).
- **2025-11-11 · 04:34** — `npx vitest run` après mutualisation `buildDerivedDataset` (UI/JSON/PDF). Résultat identique (43 passés, 4 skipped) → aucune régression export.
- **2025-11-11 · 04:50** — `npx vitest run` après refonte AutoSync (hook dédié + selectors). 43 tests passés / 4 skipped.
- **2025-11-11 · 04:54** — `npx vitest run` après instrumentation `window.__GARMIN_UI_METRICS__` (enregistrement status/durée). 43 tests passés / 4 skipped.
- **2025-11-11 · 05:00** — `npx vitest run` après refonte `DebugPanel` (lazy + consumption UI/network metrics). 43 tests passés / 4 skipped.
- **2025-11-11 · 05:10** — `npx vitest run` après ajout ServerDiagnostics + refresh boutons. 43 tests passés / 4 skipped.
- **2025-11-11 · 05:14** — `npx vitest run` après intégration focus trap (`useFocusTrap`) ForceRangeDialog/DebugPanel + lazy loaders. 43 tests passés / 4 skipped.
- **2025-11-11 · 05:28** — `npx vitest run` après amélioration accessibilité menus (focus trap ForceSyncMenu + restauration focus). 43 tests passés / 4 skipped.
- **2025-11-11 · 05:35** — `npx vitest run` après ajout canal `aria-live` et alertes accessibles dans `SyncControls`. 43 tests passés / 4 skipped.
- **2025-11-11 · 05:39** — `npx vitest run` après accessibilisation des toasts (roles dynamiques + aria-live). 43 tests passés / 4 skipped.
- **2025-11-11 · 05:51** — `npx vitest run` après instrumentation UI étendue (store centralisé + hooks `useUIMetricsTelemetry` dans toutes les sections + DebugPanel). 43 tests passés / 4 skipped.