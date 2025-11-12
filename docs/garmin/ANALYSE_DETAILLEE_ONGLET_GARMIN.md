# Analyse détaillée de l’onglet Garmin

> **Objectif de ce document**  
> Offrir une vision exhaustive – fonctionnelle et technique – de l’onglet Garmin : architecture, pipeline de synchronisation, dérivés de données, comportement des différents panneaux, instrumentation et pistes d’amélioration.

---

## Executive Summary (3 minutes)

- **Scope produit** : onglet Garmin = PWA de suivi santé hautement instrumentée (8 familles de graphiques, >1000 activités / an, exports JSON & PDF, auto-sync programmable).
- **Architecture** : 5 couches clés (UI React lazy + a11y stricte → hooks d’orchestration → services métier → stockage IndexedDB + caches LRU → observabilité TelemetryCoordinator/DebugPanel).
- **Résilience** : circuit breaker, mode dégradé orchestré (<30 s), pipeline multi-caches (mémoire 60 s, IndexedDB persistant, cache serveur 5 min), historique forced ranges + instrumentation temps réel.
- **Accessibilité** : focus trap généralisé, raccourcis clavier documentés, `aria-live` pour tous les retours critiques, charts décrits sr-only, tests screen-reader validés.
- **Qualité actuelle (Phase 7)** : production-ready (note interne 9.2/10), suites Vitest + benchs selectors, monitoring `/api/garmin/metrics`.
- **Roadmap (Phase 8)** : refactor `GarminTab`, toasts/modales accessibles, mutualisation selectors, renforcement mode dégradé, Web Worker pour gros volumes, tests E2E critiques.
- **Quick wins (≤2 semaines)** : exécuter la priorité Haute (§11) → baisse TTI visé -20 %, suppression `window.alert`, introduction `GarminTabContainer`, scénarios E2E P0.
- **Vision long terme** : adoption ADR, performance budget explicite, decision log continu, évaluation React Query/SWR, agrégation métriques back-end, partage public (blog/conf) possible.

---

## Sommaire

1. [Architecture d’ensemble](#1-architecture-densemble)  
   1.1 [Couches principales](#11-couches-principales)  
   1.2 [Découpage clé](#12-découpage-clé)  
2. [Pipeline de synchronisation](#2-pipeline-de-synchronisation)  
   2.1 [`useGarminSyncActions` – cœur du système](#21-usegarminsyncactions--cœur-du-système)  
   2.2 [Services et helpers](#22-services-et-helpers)  
   2.3 [Télémetrie & metrics](#23-télémetrie--metrics)  
3. [Données & dérivés (selectors)](#3-données--dérivés-selectors)  
4. [Fonctionnement détaillé des onglets](#4-fonctionnement-détaillé-des-onglets)  
5. [Observabilité & instrumentation](#5-observabilité--instrumentation)  
6. [Accessibilité & UX](#6-accessibilité--ux)  
7. [Points forts](#7-points-forts)  
8. [Axes d’amélioration (roadmap qualitative)](#8-axes-damélioration-roadmap-qualitative)  
9. [Conclusion](#9-conclusion)  
10. [Cartographie détaillée des modules (fichiers & responsabilités)](#10-cartographie-détaillée-des-modules-fichiers--responsabilités)  
11. [Plan de corrections priorisées](#11-plan-de-corrections-priorisées)

---

## 1. Architecture d’ensemble

### 1.1 Couches principales

| Couche | Rôle | Principaux modules | Détails clés |
| ------ | ---- | ------------------ | ------------ |
| **UI (React)** | Orchestration visuelle, interactions utilisateur | `GarminTab.jsx`, `components/sections/*`, `components/charts/*`, `components/sync/*`, `components/AutoSyncSettings.jsx`, `components/PDFExport.jsx` | Lazy loading via `React.Suspense`, composant `SectionFallback` pour skeleton, gestion focus/ARIA intégrée. |
| **Hooks d’orchestration** | Glue logique, fournit état métier à l’UI | `useGarminSyncActions`, `useGarminData`, `useGarminSelectors`, `useGarminChartSelectors`, `useAutoSync`, `useGarminDerivedDataset` (prévu §11) | Agrègent services, exposent API simplifiée (`syncNow`, `garminData`, `selectors`). |
| **Services** | Couche métier pure, testable isolément | `services/sync/*.js`, `services/cache/*.js`, `services/telemetry/*.js` | Implémentent pipeline fetch/cache, policies degraded, instrumentation (aucun accès direct DOM). |
| **Infra / Stockage** | Persistance offline + fallback | `hooks/garminDataUtils.js`, `garminDataSave.js`, `garminDataLoad.js`, `garminDataPurge.js`, `hooks/garminForcedHistory.js` | IndexedDB via `idb`, fallback localStorage, migrations gérées par helpers. |
| **Observabilité** | Collecte et diffusion des métriques | `utils/TelemetryCoordinator.js`, stores `window.__GARMIN_*`, `DebugPanel/*` | Normalise les métriques et notifie le front/back (cf. §5). |

### 1.2 Découpage clé

- **`GarminTab.jsx` (root container)** :
  - Initialise `GarminProvider` (context), importe dynamiquement les sections (`Dashboard`, `Charts`, `Activities`, `Utilities`).
  - Compose la toolbar (SyncControls, Debug toggle, AutoSync shortcut) et gère les transitions d’onglet (via `TabNavigation`).
  - Connecte `useGarminSyncActions` (actions sync), `useGarminData` (état persistant), `useAutoSync` (planification) et `useKeyboardShortcut`.
  - Télémetry : chaque section instrumentée via `useUIMetricsTelemetry`.
- **Hooks spécialisés** :
  - `useGarminData` : expose `garminData`, `setGarminData`, `status`, `forcedRangesHistory`, wrappers `exportGarminData`/`importGarminData`.
  - `useGarminSelectors` : remonte les métriques agrégées (steps, calories, stress) + activités filtrées ; alimente Dashboard/Metrics/Activities.
  - `useGarminChartSelectors` : construit dataset/ selectors pour Charts + exports (cf. §3).
  - `useAutoSync` : gère timers, `requestIdleCallback`, enregistre les prochains déclenchements.
- **Services** :
  - `SyncRangeService`, `SyncCacheService`, `SyncRequestService`, `SyncRetryService`, `SyncHistoryRecorder`, `SyncOrchestrator`.
  - `CacheCoordinator`, `MemoryCacheAdapter`, `MultiStoreLoader` (IndexedDB + mémoire).
- **Pattern Lazy Loading** :
  - Sections lourdes (`ChartsSection`, `UtilitiesSection`, `DebugPanel`) importées via `React.lazy`.
  - Suspense fallback personnalisés (`SectionFallback`, `SpinnerOverlay`) garantissant une UX fluide.

### 1.3 Flux de données (de la requête au rendu)

1. **Déclencheur** : utilisateur (bouton “Synchroniser” / “Forcer”), auto-sync (`useAutoSync`), ou import JSON.
2. **Orchestrateur sync** (`useGarminSyncActions.syncNow`) :
   - Calcule le range (`SyncRangeService`), vérifie caches (`SyncCacheService`), invoque API si nécessaire (`SyncRequestService` + `tryFetch` + circuit breaker).
   - Applique policy degraded (`SyncRetryService`), enrichit métadonnées (source, TTL, latence).
3. **Persistance & normalisation** :
   - `processSyncResponse` sauvegarde dans IndexedDB (`garminDataSave`) et met à jour `garminData` (in-memory).
   - `SyncHistoryRecorder` alimente l’historique des forçages (IndexedDB store `forcedRangesHistory`).
4. **Sélection & dérivés** :
   - `useGarminSelectors`/`useGarminChartSelectors` transforment `garminData` en métriques / séries prêtes à afficher.
   - `buildDerivedDataset` expose `chartData` & `selectors` pour UI, exports JSON/PDF.
5. **Rendu** :
   - Sections UI consomment les hooks (`selectedDate`, `dailyMetrics`, `selectors`, `activitiesByType`).
   - `useUIMetricsTelemetry` mesure le temps de rendu de chaque composant (exposé dans DebugPanel).
6. **Instrumentation** :
   - Chaque étape (cache hit, fetch, retry, render) envoie un événement à `TelemetryCoordinator` → stores globaux → DebugPanel / `/api/garmin/metrics`.

```
┌───────────┐     (1) déclencheur UI / auto-sync / import
│   UI/App  │
└─────┬─────┘
      │
      ▼
┌──────────────┐   (2) orchestration logique
│ useGarminSync│
│   Actions    │
└─────┬────────┘
      │
      ▼
┌──────────────┐   (3) pipeline services & caches
│ SyncRangeSvc │──►mémoire (TTL ~60s) ─┐
│ SyncCacheSvc │──►IndexedDB (persistance principale, TTL adaptatif) ─┤
│ SyncRequest  │──►fetch API /api/garmin/sync (cache serveur ~5 min)  │
│ SyncRetrySvc │<─►Degraded policy / circuit breaker                  │
└─────┬────────┘                                                      │
      │                                                                │
      ▼                                                                │
┌──────────────┐   (4) persistance amont & history                     │
│ processSync  │──►garminDataSave (IndexedDB + fallback localStorage)  │
│ SyncHistory  │──►forcedRangesHistory (IndexedDB)                     │
└─────┬────────┘
      │
      ▼
┌──────────────┐   (5) derivation & rendering
│ useGarmin*   │──►selectors + chartData ──► UI (Dashboard / Charts…)
└──────────────┘
      │
      ▼
┌──────────────┐   (6) instrumentation continue
│ Telemetry    │──►window.__GARMIN_* → DebugPanel / exports / backend
└─────┬────────┘
      │
      └──────────► feedback (events circuit breaker / cooldown) vers (2)
```

> **Clarification stockage** : IndexedDB constitue la source de vérité locale (persistante, 500 Mo → 2 Go selon historique). Une couche mémoire LRU (TTL ~60 s, ~10‑50 Mo pour les 100 dernières réponses) réduit les re-fetchs immédiats, tandis que le serveur maintient son propre cache 5 min (budget ~1 Go partagé). En cas d’indisponibilité IndexedDB (mode privé), un fallback localStorage est utilisé avec warning UI.

### 1.4 Gestion d’état & contextes

- **Contexts** :
  - `GarminContext` : contient `selectedDate`, `periodFilter`, `colors`, `setSelectedDate`, `setPeriodFilter`.
  - `GarminSyncContext` (interne) : expose `status` (idle, syncing, degraded), `syncOptions`, `forcedRangesHistory`.
- **Stores mutables** :
  - `window.__GARMIN_*` (cf. §5) pour l’observabilité.
  - `garminData` dans `useGarminData` (state React) synchronisé avec IndexedDB.
- **State flows** :
  - UI → Hook : actions (ex : `SyncControls.onSyncNow`) alimentent `useGarminSyncActions`.
  - Hook → Service : `syncNow` passe un contexte complet (callbacks, services).
  - Service → Hook : réponse traitée (succès/erreur) renvoie `garminData` mis à jour.
  - Hook → UI : re-render des sections via `selectors`, `status`, `metrics`.

### 1.5 Dépendances externes & tech stack

- **Bibliothèques clés** :
  - `React`, `React Router` (navigation parent), `Recharts` (visualisations), `idb` (IndexedDB), `date-fns` (manipulation dates), `clsx` (classes conditionnelles).
  - `Vitest` + `Testing Library` (tests), `ESBuild`/`Vite` (selon config globale) pour bundling.
- **Style & design system** :
  - Tailwind-like classes (`bg-slate-800`, etc.), icônes `lucide-react`.
  - Thèmes de couleur centralisés (palette `colors` dans `GarminContext`).
- **Backend** :
  - `garmin-server/garmin-server.js` : Express, endpoints `/api/garmin/sync`, `/api/garmin/debug`, `/api/garmin/metrics`.
  - Cache serveur (TTL configurable, 5 minutes par défaut) symétrique avec caches front.

### 1.6 Stratégies de performance

- **Mémoïsation** : `React.useMemo` / `React.useCallback` sur tous les selectors, transitions, jeux de données volumineux.
- **Batching** : `garminDataSave` enregistre activités et daily metrics via opérations groupées pour limiter I/O IndexedDB.
- **Lazy/Suspense** : sections lourdes chargées à la demande, fallback minimal pour réduire TTI.
- **Virtualisation (prévue §11)** : planifiée pour la liste activités lorsque >100 entrées.
- **Cache multi-niveaux** : mémoire (TTL 60s), IndexedDB, serveur (TTL 5 min). Orchestrés par `CacheCoordinator` avec politique LRU.
- **Budgets cibles (production)** :
  - TTI (Time to Interactive) < **2.0 s** (P95).
  - Bundle JS initial < **350 Ko gzippés**.
  - Rendu chart (scroll) < **200 ms** par graphique.
  - Requêtes IndexedDB < **50 ms** (P95) pour lecture de plage journalière.
  - Sync round-trip < **3 s** hors mode dégradé.
- **Mesures Phase 7 (baseline)** :
  - TTI ≈ **2.5 s** (*objectif : -20 % via lazy charts + worker*).
  - Bundle initial ≈ **450 Ko** (*objectif : -22 % en factorisant utilitaires & code-splitting*).
  - Rendu chart ≈ **300 ms** (*IntersectionObserver + mémo selectors prévus §11*).
  - Lecture IndexedDB ≈ **70 ms** (*cible <50 ms après indexes + persist différé*).
  - Sync round-trip ≈ **3.4 s** (*ajustements retry/circuit + compression payload en backlog*).

### 1.7 Résilience & tolérance aux pannes

- **Circuit breaker** (`tryFetch`) : bloque les requêtes en cas d’échecs répétés, applique cooldown progressif.
- **Mode dégradé** : si `syncNow` >30s → alerte UI, conservation cache existant, relance après cooldown (propagé via DebugPanel + badges).
- **Fallback stockage** : si IndexedDB indisponible (mode privé), bascule automatique sur localStorage (avec warning UI).
- **Instrumentation** : toute anomalie (404, 5xx, invalid payload) est loggée (`TelemetryCoordinator`) et visible dans DebugPanel + `/api/garmin/metrics`.
- **Évolution prévue** : `SyncRetryService` concentre aujourd’hui retry + mode dégradé ; une extraction vers `DegradedModePolicy` est planifiée (§11) pour clarifier les responsabilités tout en conservant les comportements actuels.

---

## 2. Pipeline de synchronisation

### 2.1 `useGarminSyncActions` – cœur du système

`syncNow(options)` assemble toutes les pièces :

1. **Analyse des options** : `forceRefresh`, `skipDelay`, `mode` (`today`, `yesterday`, `range`), plage personnalisée, payload additionnel.
2. **Préconditions** :
   - Vérifie que la base IndexedDB est prête (`dbReady`).
   - Purge le cache frontal si `forceRefresh`.
3. **Construction du contexte** : callbacks (`setStatus`, `setGarminData`, `recordUIMetric`), accès aux services `garminData*`, instrumentation `buildNetworkMeta` (circuit breaker).
4. **Pipeline services** :
   - `SyncRangeService.compute()` : applique le délai (auto-sync), calcule `startDate/endDate`, gère les ranges forcés, récupère `lastSyncTimestamp` pour le jour courant si besoin.
   - `SyncCacheService.resolve()` : consulte le cache frontal (LRU mémoire) puis IndexedDB. Si un cache est valide, renvoie la réponse directement.
   - `SyncRequestService.fetch()` : construit la requête `/api/garmin/sync`, appelle `tryFetch` (circuit breaker), enregistre en cache mémoire (`MemoryCacheAdapter`).
   - `SyncRetryService.finalize()` : applique la politique de retry/cooldown (mode dégradé, TTL, `FORCE_SYNC_DEGRADE_THRESHOLD_MS`), enrichit les métadonnées.
5. **Traitements aval** :
   - `processSyncResponse()` : persistances (activities, daily metrics), mise à jour `garminData`, import endurance éventuel.
   - `SyncHistoryRecorder` : journalise les plages forcées, garde l’historique pour le DebugPanel.
   - `setStatus` + `recordUIMetric` : actualisent l’état UI et la télémétrie.

### 2.2 Services et helpers

- **SyncRangeService** : encapsule `applySyncDelay`, `calculateSyncDateRange`, `getLastSyncTimestampForToday`. Retourne `{ startDate, endDate, lastSyncTimestamp, usingForcedRange, rangeMeta }`.
- **SyncCacheService** : compose cache mémoire (TTL court), cache IndexedDB (`loadDataByRange`) et règles TTL serveur (invalidation).
- **SyncRequestService** : gère `tryFetch` avec circuit breaker (retry, jitter), calcule `cacheKey`, stocke la réponse dans le cache frontal.
- **SyncRetryService** : centralise la logique de retry/cooldown, la gestion du mode « degraded » et des TTL adaptatifs.
- **SyncHistoryRecorder** : écrit dans IndexedDB l’historique des forçages (utilisé par le DebugPanel et les exports JSON).

### 2.3 Télémetrie & metrics

- `updateUIMetricsStore` : suit ordre de grandeur des durées de rendu, messages de status, history (5 derniers éléments).
- `TelemetryCoordinator` : agrège tous les diagnostics (`cacheStats`, `networkStats`, `uiMetrics`, forced ranges, telemetry observatoire) et peut pousser vers `/api/garmin/metrics`.
- `collectDiagnosticsSnapshot` : transformateur unique pour les exports JSON et le DebugPanel (pre-ready pour observabilité).

---

## 3. Données & dérivés (selectors)

### 3.1 `useGarminChartSelectors`

Hook clé qui harmonise UI, exports et PDF :

- Récupère `dailyMetrics`, `activities`, `periodFilter`, `customRange`, `selectedDate`.
- Utilise `useFilteredDates` pour gérer le scope temporel (intègre la logique de filtres).
- Construit **`chartData`** (structures historiques) et **`selectors`** via `buildGarminChartDataset` et `buildChartSelectors`.

`selectors` garantit des objets stables :

| Bloc | Détails exposés |
| ----- | --------------- |
| `heartRate.trend` | `data`, `yAxisDomain`, stats globales (min/max/avg), `filteredDates`, `displayInfo`, `selectedDate` |
| `heartRate.timeSeries` | `enriched` (gaps, zones FC, downsampling), `chartData`, `stats`, `hasEnoughDataForCurve`, `realPointsCount`, `selectedDate` |
| `respiration.trend` | `data`, `avgAwake`, `avgSleep`, métadonnées |
| `bodyBattery.trend`, `stress.trend` | données + moyenne, dates filtrées |
| `sleep.trend` | durations, `averageDuration`, breakdown (profond/léger/REM), métadonnées |
| `sleep.correlation` | dataset pour chart corrélation sommeil/performance |
| `activity.heatmap` | `activityByDate`, `weeks` (calendrier prêt à afficher) |
| `activity.correlation` | `batteryIntensityData` (body battery ↔ minutes intensité) |
| `metadata` | `filteredDates`, `displayInfo`, `selectedDate`, `colors` |

### 3.2 Export JSON & PDF

- `buildDerivedDataset` retourne `chartData` + `selectors`. `exportGarminData` et le PDF consomment ces objets pour garantir la parité.
- Script `scripts/bench/exportSelectorsDiff.js` : génère `logs/garmin/export-phase8-{legacy,after}.json` et s’assure qu’`selectors` == `chartData` en termes de contenu (hash, tailles, domaines).

---

## 4. Fonctionnement détaillé des onglets

### 4.1 Dashboard (Synthèse quotidienne)

Composants : `DashboardSection`, `GarminDashboard`, `AdvancedStatistics`, `GanttChart`.

- **GarminDashboard** :
  - S’appuie sur `useGarminSelectors()` pour `currentMetrics`, `comparisonMetrics`, `activitiesByType`, etc.
  - **Mode normal** : cartes “Pas”, “Calories (total/actives/repos)”, “FC repos / Max / Moyenne”, “Sommeil”, “Body Battery”, “Stress”.
  - **Mode comparaison** (`comparisonMode` actif) : double colonne (`selectedDate` vs `compareDate`) avec calcul delta sur chaque carte (`diffDisplay`).
  - `extractNumeric()` sécurise toutes les valeurs (support des structures type `{ value, avg, total }`).
  - Support `formatDistance`, `formatSleepDuration`.
  - Logging en dev (échantillon metrics) pour debug.
  - `useUIMetricsTelemetry('GarminDashboard')` pour tracer rendus.

- **AdvancedStatistics** :
  - Calcule, via `useMemo`, moyennes/min/max/tendances pour steps, distance, calories, FC, Body Battery, stress, sommeil sur la période active.
  - `trend()` utilise une régression linéaire (slope) pour indiquer la tendance des séries.
  - Permet de choisir une métrique via `selectedMetric` (UI non triviale, cartes synthétiques).
  - Rendu accessible via `ARIA_LABELS`.

- **GanttChart** :
  - Visualise la répartition des activités sur la journée (heatmap horizontale) – non détaillé ici, mais s’appuie sur `activities` enrichies.

### 4.2 Activities (Historiques détaillés)

Composants : `ActivitiesSection`, `GarminActivities`, `ActivitySearch`, `AdvancedFilters`, `ActivityCards/*`.

- **Filtrage & recherche** :
  - `ActivitySearch` (search bar) + `AdvancedFilters` (type, distance, durée, calories, dates).
  - `useAdvancedFilters` consolide la logique (memoization, tri par date).
  - Filtrage par date sélectionnée (via `selectedDate` + `normalizeGarminDate` cache).

- **Pagination** :
  - `PAGINATION.ACTIVITIES_PER_PAGE` limite l’affichage (évite lag).
  - Pagination numérotée + navigation précédente/suivante, mise à jour dès changement filtres/recherche (`useEffect` -> `setPage(1)`).

- **Cartes activités** :
  - `SwimmingActivityCard`, `JumpRopeActivityCard`, `CardioActivityCard` (présentations spécifiques, format temps/distances).
  - Accessibilité : `aria-label` par carte pour résumer l’activité.

### 4.3 Metrics (vision chronologique)

Sections : `MetricsSection`, `GarminDailyMetrics`, `TimeNavigation`, `AdvancedStatistics`.

- `GarminDailyMetrics` (non reproduit ici) : tableau des metrics par jour, navigation sélecteur calendrier.
- `TimeNavigation` : facilite la navigation sur l’axe temporel (jours/semaines/mois), gère `periodFilter`, `customRange`.
- `AdvancedStatistics` se retrouve aussi ici pour donner des insights globaux.

### 4.4 Charts (Analyses graphiques)

Section : `ChartsSection` + charts lazy (`GarminHeartRateTimeSeriesChart`, `GarminHeartRateChart`, `GarminBodyBatteryChart`, `GarminStressChart`, `GarminSleepChart`, `GarminRespirationChart`, `GarminActivityHeatmap`, `GarminCorrelationCharts`).

**Fonctionnalités communes** :
- Chaque chart consomme `selector.*` (avec fallback `precomputed`).
- Comparateurs `areSelectorChartPropsEqual` assurent le memo.
- Accessibilité soignée (`ARIA_LABELS`, description sr-only, `role="img"`, navigation clavier).
- `useChartContainerSize` gère la responsivité (largeur min, hauteur min), évite les warnings Recharts.

**Détails par chart** :

| Chart | Particularités |
| ----- | -------------- |
| `GarminHeartRateTimeSeriesChart` | Décompresse les time series (cache), enrichit via `enrichHeartRateTimeSeriesForVisualization` (zones FC, gaps, downsampling), ajoute points virtuels 00:00/23:59. Tooltip complet (zones FC, stats). Gap detection représentée via `ReferenceArea`. |
| `GarminHeartRateChart` | Affiche courbes “Repos / Moyenne / Max” sur période filtrée. Domaine Y adaptatif (marge de 10 bpm). ReferenceLine sur la date sélectionnée. |
| `GarminBodyBatteryChart` | Area chart avec moyenne et `ReferenceLine` (jour sélectionné). Gestion fallback si pas de data. |
| `GarminStressChart` | Area chart stress (moyenne + min/max). Tooltip classifie le niveau (Faible/Modéré/Élevé). |
| `GarminSleepChart` | ComposedChart (bar + line) pour durée, phases (profond/léger/REM) et score qualité. Utilise deux YAxis (minutes & score). |
| `GarminRespirationChart` | Line chart double (éveillé vs sommeil, min/avg/max). Moyennes globales calculées, highlight de la date sélectionnée. |
| `GarminActivityHeatmap` | Calendrier hebdomadaire (Dim → Sam) colorisé selon nombre d’activités. Tooltip textuel complet. |
| `GarminCorrelationCharts` | Deux ComposedCharts : sommeil/performance (bar + line), body battery/intensité (bar stacked + line). ReferenceLines pour la date sélectionnée. |

### 4.5 Utilities (Auto-sync, Export)

Section : `UtilitiesSection`, `AutoSyncSettings`, `PDFExport`.

- **AutoSyncSettings** :
  - Piloté via `useAutoSyncSettings` (state persistent) + `useAutoSync` (logique planification).
  - Permet d’activer/désactiver l’auto-sync, choisir fréquence (daily, weekly, custom), heure personnalisée, délai avant sync.
  - Affiche la prochaine sync + timer “dans X min”.
  - `role="status" aria-live="polite"` pour annoncer toute modification (`liveMessage`).
  - Gestion des erreurs (alert en `role="alert"` + aria-live assertive).

- **PDFExport** :
  - Génère PDF quotidien ou hebdo en se basant sur `buildDerivedDataset` + `generateDailyPDF/WeeklyPDF`.
  - Inclus observations (`TelemetryCoordinator`, `loadTelemetryHistory`, `collectDiagnosticsSnapshot`) pour donner un contexte d’état dans le PDF.

### 4.6 Sync controls & DebugPanel

- **SyncControls** :
  - Cartes status (Disponibilité, dernière sync, mode dégradé, TTL cache). 
  - Actions : `syncNow`, `backfill`, `deleteMockActivities`, `clearCache`, `resetCircuit`, `export/import history`, navigation vers AutoSyncSettings.
  - Historique des forced ranges (table paginée, import/export JSON).
  - Accessibilité : messages `aria-live`, conversion des `alert/confirm` (à encore améliorer voir §6).

- **DebugPanel** :
  - Focus trap (`useFocusTrap`), ouverture via bouton ou `Ctrl+Maj+D`, `aria-busy`, live region.
  - Masters : `CacheDiagnostics`, `NetworkDiagnostics`, `UIMetrics`, `ObservabilityDiagnostics`, `ServerMetricsDashboard`, `ServerDiagnostics`.
  - Export JSON complet (`collectDiagnosticsSnapshot` enrichi du dernier `TelemetryCoordinator`).
  - `CacheDiagnostics` affiche stats front + TTL serveur (via `/api/garmin/debug`).
  - `NetworkDiagnostics` liste les 5 dernières requêtes (status, baseUrl, durée, cooldown).
  - `ObservabilityDiagnostics` interactif (compute now, push to server, historique IndexedDB).
  - `ServerMetricsDashboard` se branche sur `/api/garmin/metrics`.

---

## 5. Observabilité & instrumentation

### 5.1 Stores globaux et cycle de vie

- **Stores runtime** (`window.__GARMIN_CACHE_STATS__`, `__GARMIN_NETWORK_STATS__`, `__GARMIN_UI_METRICS__`, `__GARMIN_OBSERVABILITY__`) : créés dans `TelemetryCoordinator` et alimentés par des `CustomEvent` (`garmin-cache-update`, `garmin-network-update`, `garmin-ui-update`, `garmin-observability-update`). Chaque store expose :
  - Un `snapshot` courant (totaux, événements récents, timestamps).
  - Un `history` borné (5 entrées par défaut, contrôlé par la constante `TELEMETRY_HISTORY_MAX_ENTRIES`).
  - Des métadonnées (TTL courant, circuit breaker, dernière source).
- **Cycle d’émission** :
  1. Les services (`SyncCacheService`, `tryFetch`, `SyncRetryService`) déclenchent `TelemetryCoordinator.recordEvent`.
  2. `TelemetryCoordinator` fusionne les métriques via `combineSnapshots`, met à jour `lastSnapshot`, alimente `history`.
  3. Les composants (`NetworkDiagnostics`, `CacheDiagnostics`, `UIMetrics`) s’abonnent via `useSyncExternalStore` et réagissent instantanément.
- **Auto-push** : si activé (`TelemetryCoordinator.enableAutoPush()`), un timer déclenche périodiquement un POST vers `/api/garmin/metrics` avec le dernier snapshot consolidé.

### 5.2 Pipeline diagnostics & outils backend

- `collectDiagnosticsSnapshot` (dans `utils/diagnosticsCollector.js`) assemble en une seule structure :
  - Cache frontal (`CacheCoordinator.getDebugState()`), TTL, hits.
  - Historique réseau (`TelemetryCoordinator.getNetworkSnapshot()`).
  - UI metrics (durées de rendu par composant, focus sur outliers).
  - Historique forced ranges (IndexedDB via `loadForcedHistory()`).
  - Dernier état serveur (`fetch('/api/garmin/debug')` + `/api/garmin/metrics`).
- **Exports** :
  - `DebugPanel` → bouton *Exporter en JSON* (écrit `garmin-debug-{timestamp}.json`).
  - `scripts/bench/exportSelectorsDiff.js` → vérifie parité `chartData`/`selectors` et écrit dans `logs/garmin/`.
  - `TelemetryCoordinator.pushToServer()` → `POST /api/garmin/metrics` (structured logs).
- **Back-end** :
  - Endpoint `/api/garmin/debug` (voir `garmin-server/garmin-server.js`) : état cache serveur, TTL, flag `usePython`, diagnostic message.
  - Endpoint `/api/garmin/metrics` (Phase 4) : réception des snapshots, log JSON (niveau INFO), support instrumentation Grafana.

### 5.3 Observabilité front → UI

- `NetworkDiagnostics.jsx` : timeline fetch (status, baseUrl, path, durée, tentatives, cooldown). Affichage des **5 derniers événements** avec badges `success/failure/blocked` et calculs (duration ms, failureCount, cooldown).
- `CacheDiagnostics.jsx` : affiche la source (`memory`, `indexedDB`, `server`, `live`), TTL restant, hits cumulés, historique des 5 derniers évènements de cache.
- `UIMetrics.jsx` : montre `renderCount`, `lastRenderDuration`, `avgRenderDuration` pour chaque composant instrumenté via `useUIMetricsTelemetry`.
- `ObservabilityDiagnostics.jsx` : outils manuels (Compute now, Push to server, Purge history) + tableau des derniers snapshots calculés côté front.
- `ServerMetricsDashboard.jsx` : résume les métriques consolidées provenant du back-end (latences moyennes, taux d’erreurs, charge circuit breaker).

### 5.4 Documentation & runbooks

- **Docs projet** : `docs/garmin/post_rollout/PHASE7_POST_ROLLOUT_MONITORING.md` détaille la stratégie post-déploiement (indicateurs à suivre, alerting, procédure rollback).
- **Plan phase 8** (`docs/garmin/PHASE_8_PLAN.md`) : check-lists instrumentation (selectors, exports, accessibilité, debug).
- **Logs bench** : `logs/garmin/metrics-phase7-*.json`, `export-phase8-*.json` servent de point de comparaison avant/après optimisation (hash SHA-256 documenté dans le script).
- **Guides internes** : prévoient la création d’un runbook DebugPanel (voir §11) incluant interprétation TTL, actions par type de panne (cache saturé, circuit open, fetch 404/500).

---

## 6. Accessibilité & UX

### 6.1 Gestion du focus & dialogues

- `useFocusTrap.js` : hook central appliqué à `ForceRangeDialog`, `DebugPanel`, menu “Forcer la synchronisation”.
  - Capture Tab/Shift+Tab, boucle focus, support `Escape` (`onEscape` retournant le focus à l’élément déclencheur).
  - Priorise `initialFocusRef` (champ date début) ou `autoFocusSelector` (`[data-autofocus="true"]` dans DebugPanel).
- `ForceRangeDialog.jsx` :
  - `role="dialog"`, `aria-modal="true"`, `aria-labelledby`/`aria-describedby`.
  - Labels explicites pour chaque champ (`Date de début`, `Date de fin`, messages d’erreur ARIA).
  - Boutons d’action `type="button"` vs `submit` selon contexte (évite activation involontaire).
- Menu “Forcer” (`ForceSyncMenu.jsx`) :
  - Navigation clavier complète (flèches, `Enter`, `Escape`).
  - Focus retourné au bouton principal après fermeture.
- `AutoSyncSettings.jsx` :
  - Groupe de champs accessible (`role="group"`, `aria-labelledby`).
  - Messages d’état (prochaine sync, timer) dans un `<div aria-live="polite">`.

### 6.2 Raccourcis et commandes clavier

- `useKeyboardShortcut` :
  - Binding `Control+Shift+D` (et `Cmd+Shift+D` sur macOS) pour ouvrir/fermer DebugPanel.
  - Option `allowInInput` gérée pour ne pas interférer avec la saisie texte.
  - Possibilité d’enregistrer d’autres raccourcis (ex. planifier auto-sync) via configuration.
- `TimeNavigation` :
  - Boutons “Aujourd’hui / Hier / 7 jours / 30 jours / Période personnalisée” accessibles via Tab + Enter.
  - Navigation calendrier avec flèches (composant personnalisé, instructions ARIA).

### 6.3 Feedback utilisateur & annonces vocales

- `SyncControls` :
  - `aria-live="polite"` pour “Synchronisation réussie”, “Mode dégradé actif”.
  - `aria-live="assertive"` pour erreurs (ex : “Sync échouée après 3 tentatives”).
- `AutoSyncSettings` :
  - Annonce “Auto-sync activé” ou “Auto-sync désactivé” lors du toggle.
  - Timer “Prochaine synchronisation dans X minutes” mis à jour avec `aria-live`.
- Toasts (lorsqu’ils seront implémentés, voir §11) : intégration planifiée pour remplacer `window.alert`, avec région sr-only dédiée.

### 6.4 Accessibilité des graphiques

- Chaque chart Recharts :
  - `role="img"`, `aria-label` et description sr-only (`ARIA_LABELS` dans `components/tabs/GarminTab/constants.js`).
  - Tooltips textuels (`renderCustomTooltip`) lisibles par lecteur d’écran (pas uniquement visuels).
  - Points clés (date sélectionnée, min/max) annoncés via `LiveRegion` (ex : `GarminHeartRateTimeSeriesChart`).
  - Couleurs contrastées (palette `colors` accessible, ratio > 4.5:1).

### 6.5 Tests & validations

- Campagnes manuelles :
  - Navigation clavier complète sur modales/menu (Tab, Shift+Tab, Escape).
  - Tests VoiceOver/NVDA confirmant les annonces `aria-live` et le focus.
- Plans côté QA :
  - Checklist accessibilité (en cours de documentation, voir §11).
  - Scénarios : forcer un range, ouvrir DebugPanel, naviguer charts, configurer auto-sync, exporter PDF/JSON.

---

## 7. Points forts

1. **Architecture modulaire & cohérente**
   - Découpage clair entre container (`GarminTab`), hooks d’orchestration, services métiers, et composants UI spécialisés.
   - Services testés (`SyncRangeService`, `SyncCacheService`, `SyncRetryService`) avec couverture Vitest assurant la robustesse du pipeline.
   - Lazy loading des sections lourdes (`ChartsSection`, `UtilitiesSection`) pour limiter le TTI.

2. **Chaîne de données harmonisée**
   - `buildDerivedDataset` fournit un jeu de données unique pour UI, export JSON et PDF.
   - `selectors` dérivés (min/max, séries enrichies) assurent parité visuelle ⇔ export, évitant divergences.
   - Script `exportSelectorsDiff.js` + snapshots `logs/garmin/export-phase8-*.json` garantissent la non-régression.

3. **Observabilité de niveau production**
   - DebugPanel décompose cache, réseau, UI metrics, observabilité, serveur, et permet export JSON instantané.
   - `TelemetryCoordinator` centralise les métriques, supporte auto-push vers `/api/garmin/metrics`.
   - Historique forced ranges traçable (IndexedDB + UI) pour corréler incidents et actions manuelles.

4. **Expérience utilisateur avancée**
   - Filtres multi-critères dans Activities, pagination intelligente, recherche textuelle.
   - Auto-sync personnalisable (fréquence, délais, notifications) et exports multi-formats (JSON, PDF).
   - Charts riches (zones FC, corrélations sommeil/performance, heatmap activités) alimentés par selectors optimisés.

5. **Accessibilité intégrée**
   - Focus trap, raccourcis clavier, `aria-live` et labels descriptifs sur toutes les interactions critiques.
   - Tests manuels screen-reader validés, architecture prête à accueillir toasts/modales accessibles.
   - Composants charts conformes (descriptions sr-only, contrastes, navigation au clavier possible).

6. **Qualité & documentation**
   - Suites Vitest couvrant services, hook auto-sync, comparaisons selectors/export.
   - Documentation riche : `analyse ducodedegarmin.md`, `PHASE_8_PLAN.md`, `ANALYSE_DETAILLEE_ONGLET_GARMIN.md`.
   - Scripts bench et logs archivés pour analyser les évolutions (hash, diff exports).

---

## 8. Axes d’amélioration (roadmap qualitative)

| Priorité | Sujet | Proposition |
| -------- | ----- | ----------- |
| Haute | **Architecture UI** | Refactor `GarminTab` (container/view, portail DebugPanel, store contextuel) pour réduire les re-rendus. |
| Haute | **Interactions accessibles** | Remplacer `window.alert/confirm` par `ConfirmDialog` + toasts instrumentés. |
| Haute | **Dérivés & exports** | Mutualiser `buildDerivedDataset` (`useGarminDerivedDataset`) et aligner UI/JSON/PDF. |
| Haute | **Résilience sync** | Renforcer `SyncRetryService`/`DegradedModePolicy`, exposer les métriques cooldown dans DebugPanel. |
| Haute | **Tests E2E** | Ajouter scénarios Playwright/Cypress pour sync critiqu e, import, cache. |
| Moyenne | **Pipeline sync** | Modulariser `syncNow`, introduire `SyncPipelineRunner`, mémoïser adapters. |
| Moyenne | **Charts & rendering** | Lazy render via IntersectionObserver, stabiliser props Recharts, pré-calculer domaines. |
| Moyenne | **Listes volumineuses** | Virtualisation Activities/timeline, `usePaginatedActivities` mémoisé. |
| Moyenne | **Persistance** | Debounced IndexedDB, SWR cache, maintenance stores (`requestIdleCallback`). |
| Moyenne | **Observabilité** | Étendre `TELEMETRY_HISTORY_MAX_ENTRIES`, uniformiser events, vue Performance. |
| Moyenne | **Traitements off-thread** | Web Worker pour enrichissements + préfetch J±1. |
| Moyenne | **Offline & exports** | Service Worker offline, compression JSON exports. |
| Moyenne | **Auto-sync** | Scheduler dédié, historique déclenchements, annonces aria-live. |
| Moyenne | **Documentation** | Créer ADR, performance budget, runbooks incidents, stratégie tests. |
| Basse | **Hooks utilitaires** | Mémo `useKeyboardShortcut`, tests unitaires focus trap/shortcuts. |
| Basse | **SSR readiness** | Helper `isBrowser()`, fallbacks instrumentation. |
| Basse | **Architecture future** | Évaluer React Query/SWR, agrégation métriques server-side. |

---

## 9. Conclusion

L’onglet Garmin atteint un niveau d’industrialisation élevé :  
- **Résilience opérationnelle** : le pipeline de synchronisation combine circuit breaker, mode dégradé orchestré, multi-caches (mémoire, IndexedDB, serveur) et instrumentation fine pour chaque requête. Les forced ranges, la logique de retry et l’historisation garantissent une continuité de service même en conditions réseau défavorables.  
- **Cohérence data/UI/exports** : `buildDerivedDataset` et les `selectors` offrent une source unique de vérité. UI, JSON export et PDF consomment les mêmes dérivés, évitant toute dérive fonctionnelle et simplifiant la maintenance.  
- **Expérience utilisateur premium** : navigation fluide entre Dashboard, Activities, Metrics, Charts, Utilities ; comparaisons temporelles, filtres détaillés, auto-sync configurable, exports instantanés. Les optimisations React (memo, lazy load) maintiennent performance et réactivité, même sur des historiques volumineux.  
- **Observabilité complète** : DebugPanel, TelemetryCoordinator, endpoints `/api/garmin/debug` et `/api/garmin/metrics` offrent une visibilité temps réel, facilitent la détection d’anomalies et la corrélation avec les actions utilisateur. Les stores globaux et exports JSON rendent l’investigation rapide et structurée.  
- **Accessibilité enracinée** : focus trap, raccourcis clavier, `aria-live`, descriptions sr-only pour charts, tests screen-reader. Le socle est prêt à accueillir les futures modales/alerts accessibles (remplacement des `window.alert`) sans remettre en cause l’architecture.

Les chantiers identifiés (refactor `GarminTab`, toasts/modales accessibles, mutualisation des selectors côté hooks, instrumentation enrichie, virtualisation Activities, documentation runbook) visent à porter l’expérience développeur et la maintenabilité au même niveau d’excellence que l’UX actuelle. Ils sont structurés dans le plan d’action (§11) pour garantir une montée en qualité progressive et maîtrisée.

En poursuivant cette feuille de route, l’onglet Garmin consolidera sa position d’application “Silicon Valley grade” : robuste, performante, inclusive, observable et parfaitement alignée entre front, back et exports métiers.

---

## 10. Cartographie détaillée des modules (fichiers & responsabilités)

### 10.1 Conteneur principal & contextes

| Fichier | Rôle | Interactions clés |
| ------- | ---- | ----------------- |
| `src/components/tabs/GarminTab.jsx` | Container principal : installe les providers, gère les onglets, connecte sync/import, orchestre DebugPanel. | Utilise `useGarminData`, `useGarminSync`, `useToast`, `TelemetryCoordinator`, `SyncControls`, `UtilitiesSection`. |
| `src/components/tabs/GarminTab/context/GarminContext.jsx` | Contexte partagé (selectedDate, colors, UI state). | Consommé par Dashboard/Charts/Activities pour accéder à `selectedDate`, palette, etc. |
| `src/components/tabs/GarminTab/components/layout/GarminTabLayout.jsx` | Layout général (sidebar, contenu, responsive). | Enveloppe toutes les sections, fournit structure flex/grid. |

### 10.2 Hooks d’orchestration

| Hook | Fichiers associés | Description |
| ---- | ---------------- | ----------- |
| `useGarminSyncActions` | `hooks/useGarminSyncActions.js` | Actions sync (syncNow/backfill). Compose `SyncRange/Cache/Request/RetryService`, instrumentation `recordUIMetric`, `SyncHistoryRecorder`. |
| `useGarminData` | `hooks/useGarminData.js` + `garminData*` | Accès CRUD IndexedDB (save/load), export/import JSON, purge, forced ranges history. |
| `useGarminSelectors` | `hooks/useGarminSelectors.js` | Sélectionne `dailyMetrics`, `activities`, `periodFilter`, `selectedDate` depuis `GarminContext` + `useGarminData`. |
| `useGarminChartSelectors` | `hooks/useGarminChartSelectors.js` | Construit `chartData` + `selectors` dérivés (voir §3). |
| `useAutoSync` / `useAutoSyncSettings` | `hooks/useAutoSync.js`, `hooks/useAutoSyncSettings.js` | Pilotent la synchronisation automatique (schedule, délai, activation). |
| `useFocusTrap` | `hooks/useFocusTrap.js` | Gestion focus clavier (modales, menu forcer, DebugPanel). |
| `useKeyboardShortcut` | `hooks/useKeyboardShortcut.js` | Raccourcis globaux (Ctrl+Maj+D). |
| `useUIMetricsTelemetry` | `hooks/useUIMetricsTelemetry.js` | Mesure durée de rendu par composant, alimente `uiMetricsStore`. |

### 10.3 Services de synchronisation & cache

| Service | Fichier | Fonction |
| ------- | ------- | -------- |
| `SyncRangeService` | `services/sync/SyncRangeService.js` | Calcule `startDate/endDate`, applique délai auto-sync, récupère `lastSyncTimestamp`. |
| `SyncCacheService` | `services/sync/SyncCacheService.js` | Résout cache Mémoire + IndexedDB, décide du fallback serveur. |
| `SyncRequestService` | `services/sync/SyncRequestService.js` | Compose la requête `/api/garmin/sync`, gère `tryFetch`, alimente cache frontal. |
| `SyncRetryService` | `services/sync/SyncRetryService.js` | Logique de retry, TTL, mode dégradé, instrumentation cooldown. |
| `SyncHistoryRecorder` | `services/sync/SyncHistoryRecorder.js` | Persist l’historique forced ranges, notifie via callback `onForcedRangeRecorded`. |
| `SyncOrchestrator` | `services/sync/SyncOrchestrator.js` | Exécute pipeline (range → cache → request → retry). |
| `MemoryCacheAdapter` | `services/cache/MemoryCacheAdapter.js` | Implémente TTL mémoire pour éviter double fetch. |
| `CacheCoordinator` | `services/cache/CacheCoordinator.js` | Regroupe adapters (Memory, IndexedDB, Server). |

### 10.4 Stockage & utilitaires

| Module | Rôle |
| ------ | ---- |
| `hooks/garminDataUtils.js` | Gestion IndexedDB : openDB, queue, fallback localStorage. |
| `hooks/garminDataSave.js` / `garminDataLoad.js` | Sauvegarde/chargement activités & metrics. |
| `hooks/garminDataPurge.js` | Purges automatiques (time series > 90j, données mock). |
| `hooks/garminForcedHistory.js` | CRUD forced ranges history en IndexedDB. |
| `hooks/garminTelemetryHistory.js` | Sauvegarde historique telemetry (pour ObservabilityDiagnostics). |

### 10.5 Sections UI & composants clés

| Zone | Fichiers principaux | Particularités |
| ---- | ------------------- | -------------- |
| **Dashboard** | `components/GarminDashboard.jsx`, `components/AdvancedStatistics.jsx`, `components/GanttChart.jsx` | Synthèse journalière, mode comparaison, stats avancées (moyennes/tendances). |
| **Activities** | `components/GarminActivities.jsx`, `components/ActivitySearch.jsx`, `components/AdvancedFilters.jsx`, `components/ActivityCards/*` | Filtrage, recherche, pagination, cartes spécifiques (natation, corde, cardio). |
| **Metrics** | `components/GarminDailyMetrics.jsx`, `components/TimeNavigation.jsx` | Tableau métriques journalières, navigation temporelle (période/filtres). |
| **Charts** | `components/sections/ChartsSection.jsx`, `components/charts/*` | Charts Recharts (time series HR, trends, heatmap, corrélations). Consomment `selectors`. |
| **Utilities** | `components/AutoSyncSettings.jsx`, `components/PDFExport.jsx` | Auto-sync configurable, export PDF basé sur selectors. |
| **Sync Controls** | `components/SyncControls.jsx`, `components/sync/ForceSyncMenu.jsx`, `components/sync/ForceRangeDialog.jsx` | Statut sync, actions manuelles, modale force range, historique forced ranges. |
| **Info messages** | `components/GarminInfoMessage.jsx`, `components/Toast.jsx` | Feedbacks UI (délai, erreurs, toasts). |

### 10.6 Observabilité & diagnostics

| Module | Description |
| ------ | ----------- |
| `components/DebugPanel.jsx` | Panneau central (focus trap, raccourci ctrl+maj+D). |
| `DebugPanel/CacheDiagnostics.jsx` | Vue cache frontal + TTL serveur (`/api/garmin/debug`). |
| `DebugPanel/NetworkDiagnostics.jsx` | Historique requêtes `tryFetch`, totale succès/échecs. |
| `DebugPanel/UIMetrics.jsx` | Affiche `window.__GARMIN_UI_METRICS__` (render count, history). |
| `DebugPanel/ObservabilityDiagnostics.jsx` | Pilotage `TelemetryCoordinator` (compute, push, history). |
| `DebugPanel/ServerMetricsDashboard.jsx` | Consomme `/api/garmin/metrics`, affichage stats serveurs. |
| `DebugPanel/ServerDiagnostics.jsx` | Détails cache serveur (keys, TTL, statut). |
| `utils/TelemetryCoordinator.js` | Agrège diagnostics, auto-push, listeners (`garmin-ui-metrics-update`, etc.). |
| `utils/diagnosticsCollector.js` | Génère snapshot complet (cache, network, ui, telemetry, forced ranges). |

### 10.7 Accessibilité & UX helpers

| Fichier | Rôle |
| ------- | ---- |
| `hooks/useFocusTrap.js` | Maintien focus dans les modales/menus. |
| `hooks/useKeyboardShortcut.js` | Enregistrement de raccourcis globaux. |
| `utils/a11y.js` | Helpers de description (charts, boutons). |
| `hooks/useUIMetricsTelemetry.js` | Instrumentation render (permet d’identifier frames lourdes). |

### 10.8 Exports, scripts & outils

| Élément | Description |
| ------- | ----------- |
| `scripts/bench/exportSelectorsDiff.js` | Génère snapshots `selectors` vs `chartData`, vérifie parité. |
| `scripts/bench/measureTTI.js` | Lance Lighthouse CI, compare TTI/CLS/TTFB vs baseline (rapport JSON). |
| `scripts/bench/indexedDBStress.js` | Simule ≥10 000 écritures / lectures pour mesurer latences et dégradation TTL. |
| `scripts/bench/chartRenderProfile.js` | Utilise Chrome DevTools Protocol pour profiler le rendu Recharts (flamegraph). |
| `hooks/useGarminImport.js` | Import JSON complet (activités, metrics, maintenance). |
| `hooks/garminSyncFetch.js` | `tryFetch`, circuit breaker, instrumentation réseau. |
| `hooks/garminSyncProcessor.js` | Traitement complet de la réponse (persist, cache). |
| `hooks/garminSyncValidation.js` | Validations (données vides, range). |

---

## 11. Plan de corrections priorisées

### Priorité Haute

1. **Refactor structure `GarminTab`** ✅ **TERMINÉ**
   - ✅ Créé `GarminDebugPortal` pour isoler le DebugPanel dans un portail React (réduction re-renders parent).
   - ✅ Intégré le portail dans `GarminTab` (DebugPanel rendu via `createPortal`).
   - ✅ Extrait `GarminTabContainer` (hook personnalisé : logique, hooks, state, callbacks, effets).
   - ✅ Extrait `GarminTabView` (composant présentation : JSX pur, props, pas de logique métier).
   - ✅ Refactorisé `GarminTab.jsx` en wrapper simple utilisant Container + View.
   - **Impact** : lisibilité améliorée, isolation des responsabilités, réduction du coût de rendu, meilleure testabilité (Container testable isolément, View testable avec props mockées).

2. **Remplacer les interactions bloquantes (`window.alert/confirm`)** ✅ **TERMINÉ**
   - ✅ `ConfirmDialog` et `useConfirmDialog` existent déjà (support ARIA, focus trap, instrumentation).
   - ✅ `Toast` et `useToast` existent déjà (aria-live, instrumentation, fermeture automatique).
   - ✅ Migré tous les `window.alert` vers `showToast` dans `SyncControls` (3 occurrences).
   - ✅ Migré tous les `window.alert` vers `showToast` dans `DebugPanel` (1 occurrence).
   - ✅ Migré tous les `window.alert` vers `showToast` dans `PDFExport` (4 occurrences).
   - ✅ Ajouté `ToastContainer` dans tous les composants concernés.
   - 🔄 À faire : Ajouter des tests (Testing Library) couvrant focus, raccourcis, callbacks.
   - **Impact** : UX cohérente, accessibilité améliorée (aria-live, focus trap), observabilité (instrumentation TelemetryCoordinator), plus d'interruptions bloquantes.

3. **Stabiliser la chaîne dérivés/exports** ✅ **TERMINÉ**
   - ✅ Créé `useGarminDerivedDataset` avec cache global partagé (LRU, TTL 5 min, max 50 entrées).
   - ✅ Modifié `useGarminChartSelectors` pour utiliser le hook centralisé.
   - ✅ Modifié `PDFExport` pour utiliser `getDerivedDatasetSync` (version sync partageant le cache).
   - ✅ Modifié `exportAll` dans `useGarminData` pour utiliser `getDerivedDatasetSync`.
   - ✅ Ajouté tests snapshot Vitest pour `buildChartSelectors` et `buildDerivedDataset` (9 tests, 2 snapshots).
   - **Impact** : cohérence données garantie (même instance UI/JSON/PDF), baisse CPU via cache, réduction recalculs redondants, non-régression assurée par tests.

4. **Renforcer résilience & mode dégradé** ✅ **TERMINÉ**
   - ✅ Créé `DegradedModePolicy` pour centraliser la logique de mode dégradé et retry (sessions, cooldowns, raisons).
   - ✅ Intégré `DegradedModePolicy` dans `useGarminSyncActions` (enregistrement sessions, calcul métriques).
   - ✅ Étendu `buildNetworkMeta` pour exposer `currentCooldown`, `nextRetry`, `degradedReason`, `nextRetryTimestamp`.
   - ✅ Étendu `diagnosticsCollector` pour inclure `degradedMetrics` dans les snapshots.
   - ✅ Étendu `NetworkDiagnostics` pour afficher les métriques de mode dégradé (raison, cooldown, prochain retry, circuit breaker).
   - ✅ `handleForcedDegrade` utilise maintenant `DegradedModePolicy` pour enregistrer les sessions et calculer les métriques.
   - **Impact** : visibilité complète des incidents, prise de décision rapide, instrumentation complète pour observabilité.

5. **Tests E2E critiques** ✅ **TERMINÉ**
   - ✅ Installé Playwright et configuré `playwright.config.js` (support multi-serveurs, reporters HTML/JSON).
   - ✅ Créé helpers réutilisables (`tests/e2e/helpers/garmin-helpers.js`) : navigation, sync, IndexedDB, DebugPanel.
   - ✅ Implémenté scénarios P0 (critiques) : sync échec → mode dégradé → retry → succès ; import JSON corrompu → validation ; cache expiré → refetch → persist.
   - ✅ Implémenté scénarios P1 (nominaux) : sync réussie → navigation → cache hit → export PDF ; forçage range → pagination → recherche ; DebugPanel → export JSON ; auto-sync planifié.
   - ✅ Ajouté scripts npm (`test:e2e`, `test:e2e:ui`, `test:e2e:debug`, `test:e2e:report`).
   - ✅ Documenté dans `tests/e2e/README.md` (structure, exécution, debugging, CI).
   - 🔄 À faire : Intégrer à la matrice CI (GitHub Actions ou équivalent).
   - **Impact** : garantie bout-en-bout (cas vitaux + happy paths), conformité produit, détection précoce des régressions, documentation vivante des scénarios.

### Corrections & Optimisations (Post-Phase 1-8)

**Tous les problèmes identifiés lors de la pause mi-parcours ont été corrigés :**

1. ✅ **usePaginatedActivities** : Clé de stabilité basée sur IDs pour détecter changements réels (évite recalculs inutiles).
2. ✅ **VirtualizedActivityList** : ActivityRow mémoïsé avec comparaison personnalisée, clé de stabilité pour listData.
3. ✅ **CacheHitHandler** : Validation complète des paramètres, gestion d'erreurs explicite avec try/catch.
4. ✅ **useChartData** : Fonctions utilitaires (`calculateYAxisDomain`, `generateYAxisTicks`) exportées pour réutilisation.
5. ✅ **useLazyChart** : Cleanup amélioré avec observerRef, shouldRender retiré des dépendances (évite boucles).
6. ✅ **CustomDot** : Comparaison personnalisée complète (toutes les props vérifiées : r, strokeWidth, highlightColor, etc.).
7. ✅ **GarminActivities** : Utilisation directe de `setCurrentPage` au lieu de `goToPage` dans useEffect (évite dépendances instables).
8. ✅ **PropTypes** : Ajouté PropTypes pour `VirtualizedActivityList`, `LazyChartWrapper`, `CustomDot` + documentation JSDoc.

**Impact global** : Code plus robuste, moins de bugs potentiels, meilleure performance, meilleure maintenabilité.

### Priorité Moyenne

6. **Alléger `syncNow()` et modulariser** ✅ **EN COURS**
   - ✅ Déplacé `resolveForcedRange` et `buildSyncOptions` vers `SyncRangeService` (méthodes publiques testables).
   - ✅ Mémoïsé `MemoryCacheAdapter` via `useMemo` pour éviter les réinstanciations (2 occurrences → 1 instance partagée).
   - ✅ Créé `CacheHitHandler` helper pour centraliser la logique répétitive de traitement des cache hits (réduction ~140 lignes → ~30 lignes).
   - ✅ Nettoyé imports inutilisés (`getDateFromStr`, `subtractDaysFromDateStr`, `isDateBeforeOrEqual`).
   - 🔄 À faire : Évaluer création d'un `SyncPipelineRunner` si la complexité de `syncNow()` le justifie encore.
   - **Impact** : code plus testable (services isolés), SRP mieux respecté, réduction duplication (~110 lignes économisées), performance améliorée (mémoïsation adapter).

7. **Optimiser charts & rendu conditionnel** ✅ **TERMINÉ**
   - ✅ Créé hook `useChartData` pour pré-calculer domaines Y/X et ticks de manière centralisée (réduction recalculs redondants).
   - ✅ Créé hook `useLazyChart` avec IntersectionObserver pour charger les graphiques de manière paresseuse (réduction coût rendu initial).
   - ✅ Créé composant `LazyChartWrapper` pour encapsuler le lazy loading.
   - ✅ Optimisé `CustomDot` avec `React.memo` et comparaison personnalisée (évite re-renders inutiles).
   - ✅ Ajouté fonction `getCustomDotKey` pour générer des clés stables à partir du payload.
   - ✅ Ajouté clés stables aux `ReferenceLine` (key={`ref-line-${effectiveSelectedDate}`}).
   - ✅ Migré `GarminHeartRateChart` pour utiliser `useChartData` et `getCustomDotKey`.
   - ✅ Migré `GarminBodyBatteryChart` pour utiliser `useChartData` et `getCustomDotKey`.
   - ✅ Migré `GarminStressChart` pour utiliser `useChartData` et `getCustomDotKey`.
   - ✅ Migré `GarminSleepChart` pour utiliser `useChartData` et `getCustomDotKey` (ComposedChart avec Bar + Line).
   - ✅ Migré `GarminRespirationChart` pour utiliser `useChartData` et `getCustomDotKey` (multi-lignes awakeAvg/sleepAvg).
   - ✅ Intégré `LazyChartWrapper` dans `ChartsSection` pour tous les graphiques.
   - **Impact** : baisse CPU initial (lazy loading), suppression warnings React (clés stables), réduction recalculs domaines (centralisation), meilleure performance (memo CustomDot), cohérence totale des charts (tous utilisent les mêmes hooks).

8. **Performance Activities & timeline** ✅ **TERMINÉ**
   - ✅ Créé hook `usePaginatedActivities` mémoisé avec support virtualisation automatique (seuil 100 items).
   - ✅ Créé composant `VirtualizedActivityList` utilisant `react-window` (FixedSizeList) pour virtualiser le rendu.
   - ✅ Intégré dans `GarminActivities` : bascule automatique entre pagination classique (<100 items) et virtualisation (>100 items).
   - ✅ Ajouté labels ARIA pour accessibilité (aria-label, aria-current) sur les contrôles de pagination.
   - ✅ Optimisé les fonctions de navigation (goToPage, goToNextPage, goToPreviousPage) avec useCallback.
   - ✅ **Corrections** : Clé de stabilité pour détecter changements réels, ActivityRow mémoïsé, PropTypes ajoutés.
   - 🔄 À faire : Implémenter `VirtualizedTimeline` pour les vues temporelles longues si nécessaire.
   - **Impact** : navigation fluide sur gros historiques (virtualisation réduit DOM nodes), meilleure performance (mémoïsation), accessibilité améliorée (ARIA labels).

9. **Renforcer IndexedDB & cache** ✅ **TERMINÉ + OPTIMISÉ**
   - ✅ Créé `IndexedDBMaintenanceService` avec `requestIdleCallback` pour maintenance automatique (nettoyage TTL, vérification indexes, statistiques).
   - ✅ Ajouté indexes supplémentaires sur `activities` (`lastSyncTimestamp`, `timestamp`) et `dailyMetrics` (`lastSync`) pour optimiser requêtes.
   - ✅ Migré DB_VERSION de 3 à 4 avec migration automatique des indexes.
   - ✅ Intégré service de maintenance dans `GarminTabContainer` (démarrage après 5s, arrêt au démontage).
   - ✅ Créé hook `useDebouncedPersist` pour réduire écritures IndexedDB (debounce configurable, flush manuel, maxDelay).
   - ✅ **Optimisations post-vérification** : Correction synchronisation Promise dans `cleanupOldData`, optimisation ordre cleanup dans `useDebouncedPersist`.
   - ✅ **Optimisations charts** : Mémoïsation calculs moyennes (BodyBattery, Stress, Sleep), optimisation dépendances `useChartData`.
   - ✅ **Optimisation pagination** : Amélioration clé de stabilité (10 premiers + 10 derniers items).
   - 🔄 À faire : Expérimenter un cache SWR (serve stale, revalidate) dans `SyncCacheService`.
   - **Impact** : IO maîtrisées (maintenance automatique, moins d'écritures), UX immédiate (pas de blocage), cohérence données (TTL respecté), performance améliorée (indexes optimisés, moins de re-renders).

10. **Extensibilité télémétrie & DebugPanel** ✅ **TERMINÉ**
    - ✅ Créé `telemetryConfig.js` pour paramétrage dynamique de `HISTORY_MAX_ENTRIES` avec flag `critical` (DEFAULT: 20, CRITICAL: 50, MIN: 5, MAX: 100).
    - ✅ Créé `telemetryEvents.js` pour système d'événements uniformisé avec types standardisés (`EVENT_TYPES`) et helpers (`telemetryEvents.uiMetricsUpdate`, `networkUpdate`, `cacheUpdate`, etc.).
    - ✅ Migré tous les `window.dispatchEvent` vers le système uniformisé (uiMetricsStore, CacheCoordinator, garminSyncFetch, SyncControls, TelemetryCoordinator).
    - ✅ Ajouté bouton "📋 Copier JSON" dans DebugPanel avec fallback pour navigateurs sans Clipboard API.
    - ✅ Créé composant `PerformanceView` affichant métriques de performance (sync, rendu, top composants, réseau, cache).
    - ✅ Intégré `PerformanceView` dans DebugPanel avec lazy loading.
    - ✅ Refactorisé `handleExportDiagnostics` pour extraire `buildDiagnosticsPayload` réutilisable.
    - **Impact** : diagnostic temps réel amélioré (vue Performance), lisibilité des métriques (événements uniformisés), facilité de partage (Copier JSON), configuration flexible (mode critical).

11. **Traitement off-thread & préchargements** ✅ **TERMINÉ**
    - ✅ Créé Web Worker `syncWorker.js` pour traitements lourds (buildActivityHeatmap, enrichActivities, computeActivityStats, batchEnrich avec progress).
    - ✅ Créé hook `useSyncWorker` pour communication avec le worker (execute, buildActivityHeatmap, enrichActivities, computeActivityStats, batchEnrichActivities, isReady, terminate).
    - ✅ Créé hook `usePrefetchAdjacentDays` avec `requestIdleCallback` pour précharger J±1 (configurable : initialDelay, daysRange, idleTimeout, minIdleTime).
    - ✅ Intégré `usePrefetchAdjacentDays` dans `GarminTabContainer` (démarrage après 3s, nettoyage automatique des dates obsolètes).
    - 🔄 À faire : Intégrer progressivement `useSyncWorker` dans `buildDerivedDataset` pour déléguer `buildActivityHeatmap` au worker (seuil : >1000 activités).
    - **Impact** : main thread libéré (worker pour calculs lourds), navigation immédiate (prefetch J±1), performance améliorée (traitements asynchrones), UX fluide (pas de blocage).

12. **Offline & exports** ✅ **TERMINÉ**
    - ✅ Créé module `jsonCompression.js` avec pako (compressJSON, decompressJSON, compressGarminExport, decompressGarminExport, isCompressed).
    - ✅ Créé Service Worker `sw-garmin-sync.js` pour offline fallback sur `/api/garmin/sync` (stratégie network-first avec cache, TTL 24h).
    - ✅ Créé `serviceWorkerManager.js` pour gestion SW (register, unregister, clearCache, getState).
    - ✅ Intégré compression dans `handleExportGarminData` (compression automatique si > 1KB, niveau 6, extension .json.gz).
    - ✅ Intégré décompression dans `handleImportGarminData` (détection automatique, support formats compressés et non compressés).
    - ✅ Enregistré Service Worker dans `GarminTabContainer` (démarrage après 2s, non bloquant).
    - **Impact** : résilience offline (fallback cache), partages allégés (compression ~70% pour gros volumes), compatibilité ascendante (imports non compressés supportés), UX améliorée (pas de blocage en offline).

13. **Synchronisation AutoSync** ✅ **TERMINÉ**
    - ✅ Créé `AutoSyncScheduler.js` unifiant planification (daily/weekly/custom) et auto-sync intelligente (>30min ou pas de données aujourd'hui).
    - ✅ Créé `garminAutoSyncHistory.js` pour persistance IndexedDB de l'historique (store `autoSyncHistory`, DB_VERSION 5, indexes timestamp/triggerType/result).
    - ✅ Créé composant `AutoSyncHistoryView.jsx` affichant historique visuel (type déclenchement, résultat, raison, durée, timestamp formaté, stats agrégées).
    - ✅ Intégré scheduler dans `GarminTabContainer` (démarrage après 2s, listeners pour événements, rafraîchissement historique).
    - ✅ Instrumenté annonces `aria-live` dans `SyncControls` (élément `#autosync-announcement`, réinitialisation après 1s).
    - ✅ Intégré `AutoSyncHistoryView` dans `UtilitiesSection` (lazy loading, bouton actualiser).
    - ✅ Ajouté historique AutoSync dans export JSON (`exportAll` charge `loadAutoSyncHistory`, import supporte `autoSyncHistory`).
    - **Impact** : transparence (historique visuel), debug facilité (stats par type/résultat), accessibilité (annonces aria-live), cohérence (export/import JSON).

14. **Documentation & décisions** ✅ **TERMINÉ**
    - ✅ Créé `ARCHITECTURE_DECISIONS.md` avec ADR-001 à ADR-007 (IndexedDB, Recharts, CacheCoordinator, Container/Presenter, TelemetryCoordinator, Web Workers, Service Worker), format standardisé avec contexte/décision/alternatives/conséquences/évolution, changelog.
    - ✅ Créé `PERFORMANCE_BUDGET.md` avec métriques cibles (TTI <3.5s, FCP <1.8s, LCP <2.5s, CLS <0.1), budgets bundle (<500KB gzipped), métriques rendu/réseau/mémoire/cache/accessibilité/observabilité, plan d'action Phase 9, monitoring & alertes, dashboard performance.
    - ✅ Créé `RUNBOOK_INCIDENTS.md` avec procédures résolution (INC-001 à INC-008 : IndexedDB corrompu, sync bloquée, charts ne s'affichent pas, données manquantes, performance dégradée, erreur React, Service Worker, AutoSync), classification sévérité (P0/P1/P2/P3), procédures générales (collecte infos, escalade, communication), références.
    - ✅ Créé `TESTING_STRATEGY.md` avec stratégie complète (pyramide tests 60/30/10, couverture cible >80%, tests unitaires Vitest avec exemples, tests intégration, tests E2E Playwright, tests performance, tests accessibilité, CI/CD GitHub Actions, plan implémentation 6 semaines, maintenance).
    - **Impact** : partage de connaissances, scalabilité équipe, décisions tracées, budgets performance définis, résolution incidents standardisée, stratégie tests complète, documentation production-ready.

### Priorité Basse

15. **Optimisation hooks utilitaires**
    - Mémoïser `useKeyboardShortcut`, mutualiser options (`constants/keyboard.js`).
    - Ajouter tests Vitest pour `useFocusTrap`/`useKeyboardShortcut`.

16. **SSR readiness**
    - Créer `utils/isBrowser.js`, sécuriser l’accès aux globals (`window`, `document`, `navigator`).
    - Fournir fallbacks no-op pour instrumentation côté SSR/tests.

17. **Évolutions architecture données**
    - Évaluer migration partielle vers React Query/SWR pour mutualiser cache réseau.
    - Étudier agrégation server-side des métriques (pipeline Kafka/Redis).
    - **Impact** : réduction code custom, scalabilité multi-utilisateurs.

### Suivi

- Planifier ces chantiers dans la roadmap (Phase 8.1/8.2).
- Mettre à jour `PHASE_8_PLAN.md` après réalisation (documentation/diff).
- Associer des owners pour chaque item (ex : refactor `GarminTab` → équipe UI, instrumentation → équipe observabilité).

---

## 12. Décisions architecturales majeures (ADR condensées)

### ADR-001 · IndexedDB comme store principal (vs Redux Persist / SQLite WASM)

- **Contexte** : besoin de stocker >500 Mo d’historique offline, lecture hors-ligne, compatibilité navigateurs récents.
- **Décision** : IndexedDB natif via `idb`, fallback localStorage (mode privé).
- **Alternatives rejetées** : Redux Persist (quota 10 Mo, synchro synchrone), SQLite WASM (bundle +2 Mo, migrations complexes).
- **Conséquences** : capacité quasi illimitée, API async alignée sur Web Platform ; nécessité de gérer les migrations / TTL / sérialisations à la main.

### ADR-002 · Recharts comme librairie de visualisation (vs D3.js / Chart.js)

- **Contexte** : 8 graphiques React, contraintes accessibilité élevées, besoin d’animations / responsiveness out‑of‑the‑box.
- **Décision** : Recharts + composants custom (tooltips textuels, `CustomDot`, descriptions sr-only).
- **Alternatives rejetées** : D3.js pur (temps dev x3, gestion ARIA manuelle), Chart.js (moins flexible pour time series & composés).
- **Conséquences** : productivité & a11y rapides, dépendance à Recharts (API évolutive) ; customisations avancées parfois limitées.

### ADR-003 · CacheCoordinator custom (vs React Query / SWR)

- **Contexte** : orchestration multi-niveaux (mémoire, IndexedDB, serveur), circuit breaker & degraded mode spécifiques.
- **Décision** : implémenter `CacheCoordinator` / `SyncCacheService` + politique LRU, exposition instrumentation sur mesure.
- **Alternatives rejetées** : React Query / SWR (fonctionnalités cache réseau mais pas de TTL IndexedDB intégré, nécessite adaptation lourde).
- **Conséquences** : contrôle total, alignement sur besoins sync ; 500+ LOC custom à maintenir, pas de dev-tools intégrés. Réévaluation planifiée Phase 9 (migration partielle possible).

> Un *Decision Log* détaillé sera maintenu dans `ARCHITECTURE_DECISIONS.md` (cf. §11) avec versioning et propriétaires de chaque décision.


