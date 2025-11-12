# Analyse détaillée de l’onglet Garmin – Partie 1/2

> **Statut** : première moitié du document (sections 1 à 3). La suite (sections 4 à 6) sera ajoutée après validation.

## 1. Contexte et objectifs

L’onglet Garmin est conçu comme une **tour de contrôle temps réel** pour l’ensemble de l’écosystème Garmin intégré à l’application. Il doit servir simultanément :

- d’interface de **visualisation data-driven**, capable de consolider des dizaines de signaux (activités, métriques cardio/métaboliques, sommeil, respiration, body battery, stress, SpO₂…) avec des niveaux de granularité jour → minute ;
- de **centre de pilotage opérationnel** permettant de forcer des synchronisations précises, de relancer des pipelines Python, d’assainir le cache et de rejouer des plages de dates ciblées ;
- d’outil de **diagnostic fin** pour investiguer les écarts de données (logs détaillés, historique des forçages, scripts CLI, panneau debug HTTP, purge sélective IndexedDB) ;
- et enfin de **passerelle d’orchestration** vers des modules externes (intégration Endurance, export PDF, auto-sync intelligent, génération d’analyses avancées).

Quatre lignes directrices gouvernent l’architecture :

1. **Exactitude et fraîcheur de la donnée** : combiner synchronisation incrémentale, last-sync timestamp, forçage ciblé et purge de caches afin qu’une métrique affichée reflète toujours l’état réel connu côté Garmin Connect.  
2. **Performance et stabilité** : architecture “offline-first” où IndexedDB joue le rôle de source de vérité locale, épaulée par un cache mémoire à TTL adaptatif et par du lazy loading agressif des composants lourds. Objectif : 0 blocage UI, même avec plusieurs mois d’historique.  
3. **Observabilité intégrée** : chaque action critique produit des traces exploitables (console front, logs Node, logs Python, historique stocké). Diagnostics disponibles à chaud via `/api/garmin/debug`, toasts en UI, compteur de requêtes, script CLI.  
4. **Extensibilité contrôlée** : séparation stricte des responsabilités (hooks spécialisés, modules de service) afin d’ajouter un nouveau sous-onglet ou une nouvelle source sans casser les invariants.

## 2. Architecture globale (front ↔ données ↔ backend)

### 2.1 Stack front : couches logiques

1. **`GarminProvider` / `GarminContext`**  
   - Fournit un bus d’état partagé (sélections de dates, mode comparaison, filtres, toggles d’affichage, préférences graphiques).  
   - Centralise les actions globales (ouverture du panneau debug, déclenchement import Endurance, configuration des délais auto-sync).  
   - Garantit l’ordre d’exécution des hooks personnalisés (contraintes React).  

2. **`useGarminData` (accès stockage hors ligne)**  
   - Initialisation asynchrone d’IndexedDB, fallback automatique vers localStorage si indisponible.  
   - API uniforme pour sauvegarder/charger activités & métriques avec gestion de queue, back-pressure et purge automatique quotidienne.  
   - Expose les primitives de calcul de plages (`calculateDateRange`), last sync date/timestamp, export/import JSON complet, historique des forçages (lecture/écriture/purge), suppression d’activités mock.  
   - Mémoïsation systématique des wrappers pour limiter les re-render.  

3. **`useGarminSync` (orchestration synchronisation)**  
   - Construit chaque requête en agrégeant : plage calculée, timestamp précédent, mode forcé, options meta (includeToday, source, payload custom).  
   - Pilote le cache mémoire `frontendCache` (clé = start_end_lastSync). TTL adaptatif : 30s si la fin = aujourd’hui, sinon `CACHE_TTL_MS` (5 min). Purge immédiate si `forceRefresh`.  
   - Supervise les étapes critiques : delay optionnel, check données existantes, check cache, POST, traitement réponse, retry automatique si données vides, enregistrement historique, import Endurance.  
   - Expose une interface complète : `syncNow`, `backfill`, `fetchStatus`, `clearCache`, `recordForcedSyncHistory`.  

4. **Sous-composants lazy (`React.lazy`) + Suspense**  
   - Les dashboards, graphiques MAJ minute, auto-sync settings, export PDF, debug panel, etc. sont chargés à la volée.  
   - `SectionFallback` assure un rendu skeleton neutre (spinner + border) pour éviter les sauts d’interface.  
   - `TAB_PREFETCHERS` précharge en arrière-plan les modules les plus susceptibles d’être demandés (ex. charts dès que l’utilisateur arrive sur metrics).  

### 2.2 Persistance et caches côté client

- **IndexedDB (définie dans `garminDataUtils`/`garminDataSave`/`garminDataLoad`)** :
  - Schéma optimisé : stores séparés pour activités, dailyMetrics, timeSeries, forcedRangeHistory. Indexes sur la date pour range queries.  
  - `autoPurge` exécuté au premier rendu de la journée : supprime time series > 90 jours, nettoie activités obsolètes, préserve la cohérence.  
  - `purgeOldTimeSeries` accessible manuellement via `SyncControls` pour les cas extrêmes.  
- Export/import global réunissant données et historique de forçages pour debugging ou duplication d’environnement. Ajoute désormais `derivedCharts` (30 derniers jours) issu de `buildGarminChartDataset` pour garantir la parité avec l’UI/exports PDF, ainsi que `uiTelemetry` et `diagnostics` (payload complet `collectDiagnosticsSnapshot` : cache/network/ui/forçages) pour reconstituer un état observabilité offline.

- **Cache mémoire `frontendCache`** :
  - Objet partagé dans le module `useGarminSync`.  
  - Stocke la dernière réponse JSON + metadata (timestamp, TTL restant, cacheKey).  
  - Permet d’éviter des POST redondants lorsque l’utilisateur navigue rapidement entre les onglets après une sync.  

- **SessionStorage (`forceSyncUtils`)** :
  - Clé `garmin:forceSync:last-range`. Contient `start`, `end`, `includeToday`.  
  - Restaurée à l’ouverture du menu Forcer → expérience frictionless.  

- **localStorage** :
  - Flags de maintenance (ex. `lastGarminPurge` pour ne purger qu’une fois par jour).  
  - Peut aussi héberger des paramètres d’auto-sync (intervalle configuré).  

### 2.3 Backend Garmin (Node + Python) & transport

1. **Serveur Node (`garmin-server.js`)**
   - Stack Express + middlewares : CORS, compression, JSON body parser, rate limiting (`syncLimiter` 5/min, `statusLimiter` 30/10s).  
   - Endpoints stratégiques :  
     - `POST /api/garmin/sync` : point d’entrée principal ; fusionne query + body, exécute `resolveForceRange`, purge les caches disque, appelle Python, met en cache la réponse, persiste l’état `lastStatus`.  
     - `GET /api/garmin/status` : heartbeat léger utilisé pour afficher l’état dans `SyncControls`.  
     - `GET /api/garmin/debug` : renvoie un snapshot complet (cache entries, timings, dernières erreurs, configuration actuelle).  
     - Endpoints maintenance (`/api/garmin/cache/clear`, `/api/garmin/cache/stats`).  
   - `resolveForceRange(payload)` : fusionne mode explicite, range, includeToday, fallback sur presets, garantit cohérence (start ≤ end) et trace un résumé (`summary`).  
   - Cache Node (`serverCache`) : TTL par défaut 5 min, TTL réduit pour today. Clé = hash(start|end|lastSyncTimestamp). Permet de servir instantanément les mêmes plages sans recontacter Python.  
   - Logging haute fidélité : chaque requête logue timestamp, mode, forceRefresh, lastSyncTimestamp, purge, durée script, totalDuration, cache hit/miss.  

2. **Micro-service Python (`fetch_garmin_data.py`)**
   - Mono-responsabilité : collecter les données brutes Garmin via API (ou mocks si `USE_PYTHON` ≠ 1).  
   - Arguments dynamiques : `--start`, `--end`, `--lastSyncTimestamp` pour récupérer uniquement la tranche utile.  
   - Implémente un retry exponentiel côté Node (`runPythonScriptWithRetry`) en cas d’échec (jusqu’à 3 tentatives).  
   - Retourne un payload complet : `ok`, `lastSync`, `data.activities`, `data.dailyMetrics`, diagnostics (durations, cache purge info, nb d’appels API effectués).  

3. **Chaîne transport & résilience**
   - En développement, Vite (port 3001) opère un proxy `/api/garmin/*` → Node (port 3031). Cette configuration supprime les 404 observés quand le front tentait un fetch direct vers 3001.  
   - `garminSyncFetch.tryFetch` : 
     - Liste des bases dynamiques : `VITE_GARMIN_SERVER_URL` si défini, `window.location.origin` (utile avec le proxy), fallback `http://localhost:3031`.  
     - Timeout configurable (`SYNC_TIMEOUT_MS`), retry exponentiel (1s, 2s, 4s) avec logs précis, propagation du baseUrl retenu via callback.  
     - En cas d’échec total : message enrichi (hint diagnostic, URL debug), `Error.code = 'GARMIN_SYNC_UNREACHABLE'` pour remonter un statut spécifique en UI.  
   - Script CLI `scripts/garmin_force_sync_check.js` : permet de reproduire manuellement une sync (mode `today`, `yesterday` ou plage custom) en ligne de commande, idéal pour QA ou pipelines CI.

## 3. Pipeline de données côté front

### 3.1 Chargement initial & mise à jour continue

1. **Boot `GarminTab.jsx`**  
   - Déclare tous les états dérivés : `status`, `garminData`, `activeTab`, `selectedDate`, `periodFilter`, `forcedRangesHistory`, `showDebugPanel`, etc.  
   - Mémoïse les références (ex. `prefetchedTabsRef`, `autoSyncExecutedRef`) pour éviter les boucles infinies.  
   - Monte `ToastContainer` pour les notifications globales (succès/erreurs sync).  
   - Chaque toast publie un message `aria-live` adapté (succès/info → `status` polite, erreur → `alert` assertive) avec bouton de fermeture dédié (`type="button"`) pour garantir un feedback auditif sans perturber la navigation clavier.

2. **Chargement IndexedDB intelligent**  
   - Dès que `dbReady` passe à `true`, exécute `loadDataForTab(activeTab, selectedDate, periodFilter, customStartDate, customEndDate)`.  
   - Adapte la charge : pour `dashboard`, ne récupère que les métriques essentielles ; pour `charts`, récupère les time series nécessaires ; pour `activities`, charge par type.  
   - Nettoie les jeux de données : tri chronologique, exclusion des dates futures/mocks, sélection automatique de la meilleure date à afficher (aujourd’hui si disponible sinon date la plus récente).  

3. **Auto-sync intelligente (watchdog)**  
   - Hook dédié : si `dbReady` et `loading === false` et pas encore exécuté, vérifie `getLastSyncDate()` (IndexedDB).  
   - Si absence de sync ou last sync > 30 minutes ou absence de métriques pour aujourd’hui → déclenche `syncNow()`.  
   - Journalise les raisons pour audit (`console.log` contextuel).  

4. **Détection fin de sync & UX**  
   - Observe `loading`. Lors du passage `true → false`, compare `garminData` actuel vs précédent pour déterminer combien d’activités/métriques ont été ajoutées.  
   - Affiche un toast contextualisé (“+3 activités, +1 jour de métriques” ou “données à jour”).  
   - En cas d’erreur, toast explicite avec le message serveur.  

5. **Prefetch & lazy hydration**  
   - Après chaque changement d’onglet, `prefetchedTabsRef` s’assure que les modules nécessaires sont pré-chargés (ex. charts complexes) pour garantir un switch instantané.  
   - `UTILITY_PREFETCHERS` charge en tâche de fond `UtilitiesSection` (AutoSync + PDF) et `DebugPanel`.

### 3.2 Synchronisation standard (`syncNow` sans forçage explicite)

1. **Préparation (côté `useGarminSync`)**  
   - `calculateSyncDateRange` agrège les métadonnées IndexedDB : dernière sync stockée, date de départ configurée. Si start > end (anomalie), ajuste et déclenche immédiatement une requête serveur “corrective”.  
   - Récupère `lastSyncTimestamp` exact pour aujourd’hui via `getLastSyncTimestampForDate` afin d’activer la récupération incrémentale minute par minute.  

2. **Optimisations pré-requête**  
   - `checkExistingData` : si `forceRefresh === false` et `ageMinutes < 5`, charge depuis IndexedDB et simule une réponse JSON (évite le réseau).  
   - `checkFrontendCache` : si la dernière réponse correspond à la même plage et TTL valide, renvoie directement cette réponse.  

3. **Exécution requête**  
   - `performSyncRequest` construit `query = ?start=…&end=…&lastSyncTimestamp=…&forceRefresh=true/false`.  
   - Prépare `fetchOptions` : POST JSON si `requestBody` (modes forcés), sinon POST simple.  
   - Log côté front : `[🔍 DIAGNOSTIC] Envoi requête au serveur: POST /api/garmin/sync…`.  
   - Appelle `tryFetch`, met à jour `frontendCache` avec TTL adapté, met à jour `status` (message “Sync OK (start → end)”).  

4. **Traitement réponse & post-traitements**  
   - `processSyncResponse` :  
     - Sauvegarde activités & metrics via `useGarminData.saveActivities/saveDailyMetrics`.  
     - Met à jour l’état `garminData` pour rerender instantané.  
     - Met à jour `lastSyncDate` en IndexedDB (sauf si plage fin < today pour ne pas fausser la sync courante).  
     - Déclenche `importToEndurance` si activités pertinentes détectées.  
   - `handleAutomaticRetry` : si c’est aujourd’hui et que les données restent vides, relance des POST après 30s/60s/120s avec `forceRefresh` inchangé.  
   - `recordForcedSyncHistory` n’est pas appelé (réservé aux forçages) mais `status` est archivé pour `SyncControls`.  

### 3.3 Forçage & backfill (override complet)

1. **Surface utilisateur (`ForceSyncMenu` + `SyncControls`)**  
   - Bouton “Forcer” ouvre un menu contextuel (présets + option auto).  
   - Selon le preset :  
     - `today` → start=end=today, includeToday=true.  
     - `yesterday` → start=end=yesterday, includeToday=false.  
     - `range` → ouverture `ForceRangeDialog`.  
     - `auto` → délègue à `onRequestAuto` ou envoie `mode:auto` avec `skipDelay`.  
   - `customRange` et `includeToday` sont conservés entre les sessions grâce au SessionStorage.  
   - Accessibilité : `useFocusTrap` (boucle tab + Esc), `aria-haspopup="menu"`, focus rendu au bouton déclencheur à la fermeture.  
   - `SyncControls` publie le statut courant via une région `aria-live="polite"` (message SR-only concaténant disponibilité, dernière sync, source cache, mode dégradé) et expose les erreurs via `role="alert"`.  

2. **`ForceRangeDialog` (plage personnalisée)**  
   - Inputs `type="date"` forwardRef (focus auto sur start).  
   - `describeRange` calcule `spanDays`, message d’estimation (`≈ N appels API`) basé sur `ESTIMATED_CALLS_PER_DAY`.  
   - `validateRange` bloque les cas : date manquante, format invalide, start > end, plage > `maxSpanDays`.  
   - Nouveau message contextuel : si `includeToday` coché, affiche “La date de fin sera automatiquement fixée à today” pour clarifier la logique.  
   - Accessibilité : `useFocusTrap` + `aria-modal="true"` (tab loop + `Escape`), restauration du focus précédent lors de la fermeture.  
   - `handleConfirm` :  
     1. recalcul `effectiveEnd` (withToday ? today : end),  
     2. revalide,  
     3. persiste via `storeLastRange`,  
     4. transmet à `onConfirm`.  

3. **`mapPresetToRequest` / `mapRangeToRequest`**  
   - Produisent un objet complet : `mode`, `forceRefresh: true`, `skipDelay: true`, `range`, `includeToday`, `meta.includeToday`.  
   - S’assurent que `includeToday` est explicite (évite les ambiguïtés côté backend).  
   - Pour `range`, `includeToday` force `end = today` si cohérent.  

4. **`useGarminSync` – traitement forçage**  
   - `syncNow(options)` détecte `options.mode`.  
   - Résout la plage via `resolveForcedRange` interne (validation supplémentaire).  
   - Force `forceRefresh=true`, `skipDelay=true`, purge `frontendCache`.  
   - Construit `requestBody` contenant `mode`, `forceRefresh`, `includeToday`, `range`, `rangeStart`, `rangeEnd`, `start`, `end`.  
   - Après réception :  
     - `recordForcedSyncHistory` enregistre l’événement (mode, start, end, includeToday, pythonDuration, totalDuration, counts).  
     - Historique stocké IndexedDB + renvoyé via callback `onForcedRangeRecorded` pour mise à jour immédiate de l’UI.  

5. **Backfill (`backfill`)**  
   - Déclenché depuis `SyncControls` (inputs date).  
   - Appelle `tryFetch` avec `?start=…&end=…`, `forceRefresh` implicite.  
   - Met à jour `status` (“Backfill OK start→end”) et reroute la réponse via `processSyncResponse` sans mettre à jour `lastSyncDate`.  

6. **Historique forçages UI**  
   - Liste (`forcedRangesHistory`) affichée dans `SyncControls` : montre mode, plage, timestamp déclenchement, includeToday, counts, durées.  
   - Actions : refresh (recharge depuis IndexedDB), export JSON, purge.  
   - Permet d’analyser l’efficacité d’un forçage (données ramenées, temps script, purge cache).  

---

> **Fin Partie 1/2** – Après validation, la Partie 2 couvrira :  
> - Section 4 : Anatomie UI détaillée (TimeNavigation, cartes dashboards, charts, DebugPanel, AutoSyncSettings, etc.)  
> - Section 5 : Pipeline backend (Node/Python) étape par étape, gestion erreurs, stockage historique, intégration Endurance.  
> - Section 6 : Stratégie QA & monitoring (tests automatiques, scripts, métriques observables, roadmap durcissement). bâtiment niveau Silicon Valley.

## 4. Anatomie UI détaillée

### 4.1 Structure générale
- **`GarminTab.jsx`** orchestre la page :
  - zone de statut + contrôles de sync (section inférieure) ;
  - contenu principal (dashboard, activités, métriques, charts) via lazy/Suspense ;
  - tâches d’initialisation (chargement IndexedDB, auto-sync watchdog, toasts, prefetch modules).
- `GarminTabLayout` centralise l’enveloppe visuelle (header, overlay loading, info serveur) et reçoit les sections via composition.
- `TabNavigation` gère les onglets (ARIA complète, navigation clavier, préfetch via hover/focus) et s’appuie sur `ActivitiesSection` / `MetricsSection` / `DashboardSection` pour isoler chaque panneau.
- **Fragments Lazy** : `GarminDashboard`, `GarminActivities`, `GarminDailyMetrics`, `charts/*`, `UtilitiesSection`, `DebugPanel` – tous préchargés via `TAB_PREFETCHERS` + `UTILITY_PREFETCHERS`.

### 4.2 Contrôles de synchronisation (`SyncControls`)
- Bloc **Statut** :
  - message `status.ok` + dernière sync ;
  - badge source (`LIVE`, `MEMORY`, `INDEXEDDB`, `SERVER`, `FALLBACK`, `OFFLINE`…) alimenté par `cacheMeta`; indication TTL, base URL, mode dégradé / circuit ; bouton “Réinitialiser le circuit” et compte à rebours lorsque le breaker est `open` ;
  - bloc informatif `GarminInfoMessage` (délai Garmin + CTA forcer/backfill/délai auto-sync).
- Boutons **Synchroniser** (utilise caches) / **Forcer** (bypass via `ForceSyncMenu`) – `mapPresetToRequest` garantit payload complet (`mode`, `includeToday`, `range*`).
- Historique forçages (5 dernières entrées, refresh/clear, stats activités vs métriques). Les entrées sont persistées par `SyncHistoryRecorder` dans IndexedDB et synchronisées via callback `onForcedRangeRecorded`.
- Backfill plage personnalisée et module de purge mock (supprime activités/métriques de test puis déclenche forçage).
- Bouton Debug Panel (ouvre `DebugPanel`).

### 4.3 Navigation & Dashboard
- **`TimeNavigation`** : gère sélection date (`selectedDate`), comparaison (`comparisonMode`), filtres période (`periodFilter`, `customStartDate`, `customEndDate`). Expose callbacks vers `loadDataForTab`.
- **`GarminDashboard`** : cartes résumées (état cardio/métriques, activités récentes, badges de progression) avec liens vers sections détaillées. Cache interne par date.
- `useGarminSelectors` fournit les données mémoïsées (dates disponibles, métriques courantes/comparaison, activités filtrées, source cache) → réduit les re-renders côté Dashboard.
- **`GarminActivities`** : tables paginées (natation, corde, cardio). Filtre avancé (`AdvancedFilters`) : texte, plage date, intensité, détection `includeMock`.
- **`GarminDailyMetrics`** : données agrégées par jour (pas, calories, body battery…). Helpers (`GarminDailyMetricsHelpers`) calculent tendances/seuils. Support comparaison (double colonne).

### 4.4 Charts
- `charts/*` : composant par métrique (heart rate, body battery, stress, sommeil, respiration, heatmap, correlation). Chaque chart :
  - dimension via `useChartContainerSize` (resize observer) ;
  - fallback skeleton ;
  - downsampling / smoothing pour series volumineuses ;
  - overlays (zones zénith, intensité activités) ;
  - narration accessible (aria, descriptions).
- `ChartsSection` assemble l’ensemble via `Suspense` et consomme `useGarminChartSelectors` pour fournir séries/time-range/couleurs sans props massifs. Les données proviennent de `buildDerivedDataset`/`buildGarminChartDataset` (fabrique dérivée mutualisée) qui sert désormais aussi bien l’UI que l’export JSON et le module PDF. `useGarminSyncActions` alimente `window.__GARMIN_UI_METRICS__` (durée sync, statut) pour le debug runtime.
- Tous les graphiques consomment désormais un objet `precomputed` (dataset dérivé) : plus de recalcul `useFilteredDates`/dérivations locales, les `React.memo` s’appuient sur l’identité de `precomputed` pour éviter les re-renders inutiles.

### 4.5 Modules utilitaires
- **`AutoSyncSettings`** : configuration délais auto-sync (slider minutes, toggle push). Interaction via `useAutoSync` + `useAutoSyncSettings` (auto-save débouncé) et exposition des infos `latestDate` / `cacheSource` issues des selectors.
- **`PDFExport`** : export complet (activités + métriques + charts) basé sur la même fabrique `buildDerivedDataset` ; transmet les séries dérivées (`options.derived`) et la télémétrie UI sérialisée (`options.uiTelemetry`) à `pdfGenerator.js` pour garantir la cohérence avec l’UI (min/max FC, tendances, intensités, observabilité). Le PDF inclut une section “Observabilité UI” (statuts récents, temps de rendu, Top 5 composants).
- **`DebugPanel`** : snapshot état serveur + caches + diagnostics front ; compose `CacheDiagnostics` (lecture `cacheMeta`, compteurs `window.__GARMIN_CACHE_STATS__`, historique), `NetworkDiagnostics` (timeline des fetch, compteurs succès/échecs, état circuit + cooldown), `UIMetrics` (lecture `window.__GARMIN_UI_METRICS__`, durée/derniers statuts, compteur de renders + historique des 5 derniers rendus via hook `useUIMetricsTelemetry`) et `ServerDiagnostics` (snapshot `/api/garmin/debug`). Chargé lazy, focus trap (`useFocusTrap` + bouton fermer autofocused), rafraîchissement manuel via `refreshDiagnostics`, export JSON “diagnostics” (cache/network/ui/server) disponible en un clic.
- Export instantané dans `SyncControls` : bouton “Export JSON” (historique forçages, `cacheMeta`, `__GARMIN_CACHE_STATS__`, `__GARMIN_NETWORK_STATS__`, télémétrie UI sérialisée) pour partager un snapshot opérationnel sans quitter la vue. Import JSON disponible pour rejouer un diagnostic offline (rehydratation des compteurs/cache/ui).
- Utilitaire `collectDiagnosticsSnapshot` centralise la collecte (cache/network/ui/server/forced history) et alimente DebugPanel, SyncControls et les exports off-line pour assurer un format homogène.
- `TimeNavigation` : annonces vocales via `aria-live`, boutons “Filtres/Comparer” instrumentés (`aria-expanded`/`aria-controls`), sections filtrage/comparaison marquées `role="region"`, boutons période avec `aria-pressed`, libellé explicite du bouton “Aujourd’hui”.
- `AutoSyncSettings` : région `aria-live` synthétisant l’état, descriptions associées aux contrôles (fréquence, délai), réutilisation du même message pour les lecteurs d’écran et gestion d’erreur `role="alert"`.
- `useFocusTrap` apporte `returnFocus` et est implémenté dans `ForceSyncMenu`, `ForceRangeDialog`, `DebugPanel` pour garantir le retour focus sur l’élément déclencheur. 
- **Sections instrumentées** : `DashboardSection`, `ActivitiesSection`, `MetricsSection`, `ChartsSection`, `UtilitiesSection` appellent `useUIMetricsTelemetry` dès chaque montage/rerender, ce qui alimente l’historique et les compteurs exposés dans `DebugPanel` pour corréler perf UI ↔ data source.
- **Télémétrie fine** : chaque composant graphique (TimeSeries, HeartRate, BodyBattery, Stress, Sleep, Respiration, Heatmap, Correlation) invoque aussi `useUIMetricsTelemetry`, ce qui permet d’identifier la visualisation précise responsable d’un pic de rendu sans instrumentation supplémentaire. `DebugPanel › UIMetrics` liste le Top 5 (durée moy./max, dernière valeur, nombre de rendus) pour prioriser les optimisations.
- **Overlay de synchronisation** : `GarminTabLayout` observe l’état `loading` exposé par `useGarminSyncState` (trace console en mode DEV) et lève l’overlay dès la fin de `processSyncResponse`. Les écritures d’historique (`SyncHistoryRecorder.record`) sont désormais lancées en arrière-plan pour éviter de bloquer l’UI après un forçage massif.

### 4.6 UtilitiesSection
- **`UtilitiesSection`** : regroupe `AutoSyncSettings` et `PDFExport` avec un fallback commun, consomme directement les sélecteurs (`useGarminSelectors`, `buildGarminChartDataset`) pour préparer l’export, réduit le prop drilling historique (`garminData`).

## 5. Pipeline backend détaillé

### 5.1 Étapes principales (`POST /api/garmin/sync`)
1. **Réception payload** (query + body) → `resolveForceRange`
   - normalise données (`mode`, `forceRefresh`, `rangeStart`, `rangeEnd`, `includeToday`) ;
   - génère résumé loggable (`summary`).
2. **Vérification cache serveur** (`ServerCache`) :
   - clé `hash(start|end|lastSyncTimestamp|forceRefresh|mode)` ;
   - sortie rapide si TTL non expiré (pas de call Python) – `cacheMeta` front affichera `SERVER`.
3. **Exécution Python** (`fetch_garmin_data.py`) :
   - arguments `--start`, `--end`, `--lastSyncTimestamp` (si fourni) ;
   - script gère contact API Garmin, merges transitions ;
   - renvoie JSON `{ ok, lastSync, data, diagnostic }` (durées, nb appels, purge).
4. **Retour Node** :
   - log complet (timestamp, mode, forceRefresh, durations, cache hits) ;
   - mise à jour `serverCache` ;
   - persist `lastStatus` pour `/api/garmin/status` ;
   - **forçage** : réduction delta des séries (HR / body battery / respiration) en fonction du `lastSyncTimestamp` pour limiter la taille du payload, puis diffusion en **stream chunked** (`Transfer-Encoding: chunked`) ;
   - stream JSON vers front.

### 5.2 Endpoints auxiliaires
- `GET /api/garmin/status` : heartbeat (utilisé par `fetchStatus`).
- `GET /api/garmin/debug` : renvoie snapshot complet (cache entries, lastStatus, config, timestamps). Consommé par `DebugPanel`.
- `/api/garmin/cache/*` : maintenance (clear, stats) – utilisés par scripts CLI.
- `GET /api/garmin/cache/stats` : liste les entrées cache serveur (clé, âge, TTL restant).
- `GET /api/garmin/metrics` : snapshot métriques runtime (compteurs sync totaux/succès/erreurs, hits cache, durée moyenne Python, dernière requête, statut breaker) – consommable pour supervision.
- `POST /api/garmin/cache/clear` : purge manuelle du cache (admin/debug).
- `purgeCacheForRange()` : parcours des dates en UTC (`enumerateDates`/`shiftDateStr` corrigés) → évite les boucles infinies causées par les fuseaux horaires lors des force refresh today.

### 5.3 Intégration Endurance
- `useGarminImport` compare activités Garmin → sessions Endurance (swimming / jumpRope / cardio) ; fusionne sans doublons ; tagging `source: 'garmin'`; met à jour `workoutData.enduranceData` (`lastUpdated`).

### 5.4 Logging & monitoring backend
- Chaque requête loguée (JSON) : start, end, mode, forceRefresh, lastSyncTimestamp, `pythonDuration`, `totalDuration`, `cacheHitLevel`, `entriesPurged`.
- En mode debug, exposition via `console` + stockage dans `logs/garmin/*.log` (optionnel si filesystem).
- Logs structurés JSON lignes (`logs/garmin-sync.log`) pour chaque sync : événement (`sync_request_received`, `sync_success`, `sync_error`, `metrics_requested`…), durée totale, source (cache/python/cooldown), méta forçage delta.

## 6. QA & Observabilité

### 6.1 Tests automatiques
- **Unit tests front** (Vitest) :
  - `SyncRequestService.test` (payload + diagnostic),
  - `SyncRetryService.test` (retry + meta),
  - `SyncCacheService.test` (cascade memory/IDB/server),
  - `SyncHistoryRecorder.test`, `SyncOrchestrator.test`, `CircuitBreaker.test`.
- 2025-11-10 : `npm run test -- --run` ✅ (Garmin services + Endurance submit + BodyTracking metrics). Les suites héritées `integration` / `useAdvancedFilters` / `useAutoSync` / `useGarminData` sont conservées en `describe.skip` en attendant une réécriture Vitest dédiée.

### 6.2 Tests manuels recommandés
1. **Today**
   - `syncNow()` ; relancer <30s : badge `memory`, `cacheMeta.ttlMs` décrémente, `window.__GARMIN_CACHE_STATS__.hits.memory` augmente.
   - `syncNow({ forceRefresh:true })` : badge `live`, comptages `bypass` puis `miss` incrémentés.
2. **Yesterday**
   - Forcer `yesterday` : badge `live`.
   - Re-forcer immédiatement : badge `memory`, puis après expiration mémoire (`ttl`), badge `indexeddb`. Vérifier les compteurs dans `SyncControls` (section stats).
3. **Range 7 jours**
   - Run 1 : badge `live`.
   - Run 2 (même plage) : badge `memory`.
   - Attente 2 min puis run 3 : badge `indexeddb`, historique DebugPanel affiche l’ordre des sources.
4. **Auto-sync**
   - Activer auto 10 min ; laisser déclencher : badge `memory` < TTL, sinon `indexeddb`. `window.__GARMIN_CACHE_STATS__` doit refléter les hits.
5. **Mode dégradé**
   - Stopper backend ; lancer forçage `today`.
   - Après 30s : badge “mode dégradé”, `cacheMeta.degraded=true`, aucun hit `live`.
   - Redémarrer backend, `syncNow()` : circuit se referme, badge `live`, stats `server` ++.

### 6.3 Phase 6 – Roadmap observabilité & tests

- **Couverture de tests** : ajouter suites Vitest ciblant `uiMetricsStore`, `diagnosticsCollector`, `TelemetryCoordinator` (à créer) et `pushMetricsSnapshot`. Utiliser `renderHook` + mocks `performance.now()` pour valider `useUIMetricsTelemetry`.
- **TelemetryCoordinator** : orchestrer `garmin-ui-metrics-update`, `garmin-cache-update`, `garmin-network-update`, appliquer un throttle (250 ms) et exposer `start/stop/pushNow`. Il alimentera le DebugPanel (carte Observability) et l’export JSON.
- **Push serveur** : enrichir `/api/garmin/metrics` pour accepter un POST `clientTelemetry`, fusionner avec `serverMetrics`, loguer `telemetry_ingested` (payload, sessionId, payloadBytes). Côté front : service `pushMetricsSnapshot` avec double retry exponentiel.
- **Exports** : harmoniser export JSON/PDF avec les nouveaux champs (`telemetrySessionId`, `telemetrySchemaVersion`, `network.timeline`). Décider si les 10 derniers snapshots diagnostics doivent être persistés dans IndexedDB (`garmin_diagnostics_history`).
- **Documentation** : compléter cette section avec un diagramme sequence (PlantUML) du flux `sync → TelemetryCoordinator → /api/garmin/metrics`, et une checklist “How to debug” intégrant les nouveaux outils d’observabilité.

### 6.4 Observabilité runtime (implémenté)

- `TelemetryCoordinator` (front) écoute `garmin-ui-metrics-update`, `garmin-network-update`, `garmin-cache-update`, applique un throttle (250 ms par défaut) et publie `garmin-telemetry-update` avec un snapshot aggregé (`sessionId`, `schemaVersion`, diagnostics via `collectDiagnosticsSnapshot`).  
- `window.__GARMIN_OBSERVABILITY__` conserve le snapshot courant, l’historique borné (10 entrées), l’horodatage `lastUpdate`, ainsi que les métas `lastPush` / `pendingPush` pour l’intégration serveur à venir.  
- `CacheCoordinator` diffuse désormais `garmin-cache-update` (hits + history) pour aligner les chronologies avec celles du réseau et de l’UI.  
- `GarminTab` initialise/nettoie le coordinateur via `useEffect` afin d’éviter les listeners orphelins lors des navigations ou hot reload.  
- Tests Vitest dédiés (`TelemetryCoordinator.test.js`) valident le démarrage, le throttle, l’abonnement/désabonnement, `computeNow` et l’arrêt.  
- `DebugPanel › ObservabilityDiagnostics` expose en UI la session courante (sessionId, schema, lastUpdate, pendingPush), un résumé cache/réseau/UI, l’historique des 5 derniers snapshots et un CTA `Recalculer maintenant` (trigger `TelemetryCoordinator.computeNow`).  
- L’export JSON `DebugPanel` inclut désormais un bloc `telemetry` (snapshot courant + store complet) afin de partager un diagnostic complet avec l’équipe backend/ops.
- Backend : ajout `POST /api/garmin/metrics` — ingestion des snapshots client (`metrics_ingested` log structuré, historique des 50 dernières demandes) et réponse enrichie (`acceptedAt`, snapshot serveur mis à jour).
- Auto-push : `TelemetryCoordinator.configureAutoPush` déclenche un envoi périodique (≤60 s) quand le DebugPanel est ouvert, avec garde `pendingPush` et persistance IndexedDB (`telemetryHistory`).
- PDF/JSON : export harmonisé (`telemetrySessionId`, `telemetrySchemaVersion`, statut push, erreurs et historique tronqué) pour garantir la cohérence avec l’observabilité front/back.
- `DebugPanel › ServerMetricsDashboard` (nouveau) consomme `GET /api/garmin/metrics` : rafraîchissement manuel + écoute `garmin-telemetry-update`, affiche compteurs sync (total/success/cacheHit), télémétrie serveur (session/schema, derniers pushs), historique des 10 dernières ingestions et CTA “Rafraîchir”. Tests Vitest (`ServerMetricsDashboard.test.jsx`) valident fetch, refresh, gestion d’erreur et réactions events.
- Backend : `/admin/metrics` fournit un tableau de bord HTML responsif (auto-refresh 5 s, export JSON, résumé sync/cache/telemetry + historique ingestion) pour supervision directe côté bridge Node.
- Script CLI `bench:metrics` (`node scripts/bench/exportServerMetrics.js`) capture le snapshot `/api/garmin/metrics`, affiche un résumé chiffré et sauvegarde optionnellement un JSON pour documenter les scénarios manuels Phase 6.
  - Exemple : `npm run bench:metrics -- --base=http://localhost:3001 --out logs/garmin/metrics-today.json --quiet` (exécuter après chaque scénario manuel pour tracer les deltas).
- Script `bench:metrics:diff` (`node scripts/bench/compareMetrics.js`) compare deux snapshots successifs et calcule les deltas des compteurs clés (`sync.*`, `cache.*`, `telemetry.ingested`). Idéal pour joindre une synthèse au journal de validation :  
  `npm run bench:metrics:diff -- --previous logs/garmin/metrics-before.json --current logs/garmin/metrics-after.json`
- Exemple « Mode dégradé » : enchaîner deux `forceRefresh=true` sur la même plage (<120 s) → `sync.servedFromCooldown` +1, `cache.bypass` +3, snapshot API annonce `diagnostic.servedFromCooldown=true`. Capturé/validé via `logs/garmin/metrics-before-degraded.json` → `logs/garmin/metrics-after-degraded.json`.
- Exemple « Backend offline » : stop serveur, `bench:metrics` retourne `HTTP 500`; la synchro forcée côté client passe en mode dégradé. Après relance, le snapshot `logs/garmin/metrics-after-offline.json` affiche des compteurs remis à zéro → redémarrage sain observé.
- Référence migration : voir `docs/garmin/PHASE_7_MIGRATION_PLAN.md` pour le déroulé détaillé (paliers, métriques à surveiller, runbook).
- Feature flag migration : `VITE_GARMIN_SYNC_V7_ROLLOUT` (0 → désactivé, 1 → 100 %, valeur décimale pour échantillons). Décision mémorisée localement afin de garantir la stabilité par utilisateur.

Prochaine étape : lancement de la Phase 7 (migration progressive et hardening).