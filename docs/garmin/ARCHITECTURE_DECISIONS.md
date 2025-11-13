# Architecture Decision Records (ADR) - Onglet Garmin

> **Format** : Chaque ADR suit le template standardisé avec contexte, décision, alternatives, conséquences, et statut.

---

## ADR-001 : IndexedDB comme store principal

**Statut** : ✅ Accepté  
**Date** : 2024-01-15  
**Auteur** : Équipe Garmin  
**Version** : 1.0

### Contexte

L'onglet Garmin nécessite de stocker :
- >500 Mo d'historique de données (activités, métriques quotidiennes, time series)
- Données accessibles hors-ligne (mode offline-first)
- Compatibilité avec navigateurs récents (Chrome, Firefox, Safari, Edge)
- Performance de lecture/écriture élevée pour synchronisations fréquentes

### Décision

Utiliser **IndexedDB natif** via la bibliothèque `idb` (wrapper moderne de l'API IndexedDB) comme store principal, avec fallback automatique vers `localStorage` en cas d'échec ou de mode privé.

**Implémentation** :
- Store principal : `GarminDataDB` (version 5)
- Object stores : `activities`, `dailyMetrics`, `telemetryHistory`, `forcedRangesHistory`, `autoSyncHistory`
- Indexes optimisés pour requêtes fréquentes (`timestamp`, `lastSyncTimestamp`, `triggerType`, `result`)
- Migration automatique via `onupgradeneeded`
- Fallback localStorage transparent via `garminDataUtils.js`

### Alternatives considérées

1. **Redux Persist + localStorage**
   - ❌ Rejeté : quota localStorage limité à ~10 Mo, synchrone (bloque UI)
   - ❌ Pas de support natif pour requêtes complexes (indexes)

2. **SQLite WASM**
   - ❌ Rejeté : bundle +2 Mo, migrations complexes, overhead initialisation
   - ❌ Nécessite compilation WebAssembly, compatibilité navigateurs variable

3. **PouchDB / CouchDB**
   - ❌ Rejeté : surcharge pour besoins simples, dépendance externe lourde
   - ❌ Synchronisation bidirectionnelle non nécessaire

### Conséquences

**Positives** :
- ✅ Capacité de stockage quasi illimitée (plusieurs Go)
- ✅ API asynchrone alignée sur Web Platform standards
- ✅ Requêtes performantes via indexes natifs
- ✅ Support offline complet

**Négatives** :
- ⚠️ Nécessité de gérer migrations manuellement (via `DB_VERSION`)
- ⚠️ Gestion TTL et nettoyage à implémenter (via `IndexedDBMaintenanceService`)
- ⚠️ Sérialisation JSON manuelle (pas de support types complexes natifs)

### Évolution future

- **Phase 9** : Évaluer migration partielle vers React Query/SWR pour cache réseau
- **Phase 10** : Optimiser compression time series (actuellement JSON brut)

---

## ADR-002 : Recharts comme librairie de visualisation

**Statut** : ✅ Accepté  
**Date** : 2024-01-20  
**Auteur** : Équipe Garmin  
**Version** : 1.0

### Contexte

L'onglet Garmin nécessite :
- 8 graphiques React (Heart Rate, Body Battery, Stress, Sleep, Respiration, Activity Heatmap, Correlation, Time Series)
- Contraintes accessibilité élevées (WCAG 2.1 AA)
- Animations et responsiveness out-of-the-box
- Tooltips textuels et descriptions sr-only

### Décision

Utiliser **Recharts** comme librairie principale, avec composants custom pour :
- `CustomDot` : points interactifs avec support clavier
- Tooltips textuels : descriptions complètes pour screen readers
- `ReferenceLine` : lignes de référence avec labels ARIA
- Lazy loading via `LazyChartWrapper` (IntersectionObserver)

**Implémentation** :
- Composants charts : `GarminHeartRateChart`, `GarminBodyBatteryChart`, `GarminStressChart`, `GarminSleepChart`, `GarminRespirationChart`
- Hook `useChartData` : pré-calcul domaines Y/X, ticks, métadonnées
- Wrapper `LazyChartWrapper` : chargement différé avec fallback skeleton

### Alternatives considérées

1. **D3.js pur**
   - ❌ Rejeté : temps de développement x3, gestion ARIA entièrement manuelle
   - ❌ Nécessite gestion DOM directe, moins aligné avec React

2. **Chart.js**
   - ❌ Rejeté : moins flexible pour time series complexes et graphiques composés
   - ❌ Support accessibilité limité, nécessite extensions custom

3. **Victory (Formidable Labs)**
   - ❌ Rejeté : bundle size plus important, courbe d'apprentissage plus raide
   - ❌ Moins de communauté active que Recharts

### Conséquences

**Positives** :
- ✅ Productivité élevée (composants React natifs)
- ✅ Accessibilité intégrée (support ARIA, tooltips textuels)
- ✅ Animations fluides out-of-the-box
- ✅ Responsive par défaut

**Négatives** :
- ⚠️ Dépendance à Recharts (API évolutive, breaking changes possibles)
- ⚠️ Customisations avancées parfois limitées (nécessite workarounds)
- ⚠️ Bundle size ~150 KB (acceptable mais non négligeable)

### Évolution future

- **Phase 9** : Évaluer migration vers D3.js si besoins customisations avancées
- **Phase 10** : Optimiser bundle size (tree-shaking, lazy loading charts)

---

## ADR-003 : CacheCoordinator custom (vs React Query / SWR)

**Statut** : ✅ Accepté  
**Date** : 2024-02-01  
**Auteur** : Équipe Garmin  
**Version** : 1.0

### Contexte

L'onglet Garmin nécessite :
- Orchestration multi-niveaux (mémoire 60s, IndexedDB persistant, cache serveur 5min)
- Circuit breaker spécifique (dégradation après 3 échecs consécutifs)
- Mode dégradé orchestré (fallback cache local si sync >30s)
- TTL IndexedDB intégré (nettoyage automatique via `IndexedDBMaintenanceService`)
- Instrumentation sur mesure (exposition métriques cache dans DebugPanel)

### Décision

Implémenter **CacheCoordinator custom** avec :
- `CacheCoordinator` : orchestration multi-niveaux
- `MemoryCacheAdapter` : cache mémoire avec TTL 60s
- `SyncCacheService` : gestion cache IndexedDB avec TTL configurable
- `CircuitBreaker` : protection contre surcharge serveur
- `DegradedModePolicy` : fallback automatique si sync >30s

**Implémentation** :
- Service : `services/cache/CacheCoordinator.js`
- Adapter : `services/cache/MemoryCacheAdapter.js`
- Policy : `services/network/DegradedModePolicy.js`
- Instrumentation : exposition via `window.__GARMIN_CACHE_STATS__`

### Alternatives considérées

1. **React Query**
   - ❌ Rejeté : fonctionnalités cache réseau mais pas de TTL IndexedDB intégré
   - ❌ Nécessite adaptation lourde pour circuit breaker custom
   - ❌ Pas de support natif pour mode dégradé orchestré

2. **SWR (Vercel)**
   - ❌ Rejeté : focus sur cache réseau HTTP, pas de gestion IndexedDB
   - ❌ Pas de support circuit breaker natif
   - ❌ Nécessite wrapper custom pour besoins spécifiques

3. **Apollo Client**
   - ❌ Rejeté : surcharge pour API REST, bundle size important
   - ❌ Nécessite GraphQL, non aligné avec architecture actuelle

### Conséquences

**Positives** :
- ✅ Contrôle total sur logique cache (TTL, invalidation, fallback)
- ✅ Alignement parfait avec besoins sync (IndexedDB + réseau)
- ✅ Instrumentation sur mesure (métriques exposées dans DebugPanel)
- ✅ Circuit breaker et mode dégradé intégrés

**Négatives** :
- ⚠️ ~500+ LOC custom à maintenir (vs bibliothèque externe)
- ⚠️ Pas de dev-tools intégrés (nécessite DebugPanel custom)
- ⚠️ Tests unitaires à écrire manuellement

### Évolution future

- **Phase 9** : Réévaluation migration partielle vers React Query pour cache réseau
- **Phase 10** : Créer dev-tools custom pour visualisation cache en temps réel

---

## ADR-004 : Architecture Container/Presenter (GarminTabContainer)

**Statut** : ✅ Accepté  
**Date** : 2024-02-10  
**Auteur** : Équipe Garmin  
**Version** : 1.0

### Contexte

L'onglet Garmin nécessite :
- Séparation claire logique métier / présentation
- Testabilité élevée (tests unitaires hooks, tests d'intégration UI)
- Réutilisabilité (hooks utilisables dans autres contextes)
- Maintenabilité (changements logique n'affectent pas UI directement)

### Décision

Implémenter pattern **Container/Presenter** :
- **Container** : `GarminTabContainer.jsx` (hook `useGarminTabContainer`)
  - Logique métier : sync, cache, état, orchestration
  - Pas de JSX (délégué à `GarminTabView`)
  - Expose API via objet retourné (props pour View)
- **Presenter** : `GarminTabView.jsx`
  - Rendu JSX uniquement
  - Consomme props du Container
  - Facilement testable (props en entrée, JSX en sortie)

**Implémentation** :
- Container : `components/GarminTabContainer.jsx` (hook `useGarminTabContainer`)
- View : `components/GarminTabView.jsx` (composant présentation pure)
- Layout : `components/layout/GarminTabLayout.jsx` (structure UI)

### Alternatives considérées

1. **Composant monolithique**
   - ❌ Rejeté : mélange logique/présentation, difficile à tester
   - ❌ Réutilisabilité limitée

2. **Redux + connect()**
   - ❌ Rejeté : surcharge pour besoins simples, boilerplate important
   - ❌ Nécessite middleware custom pour sync

3. **Context API seul**
   - ❌ Rejeté : pas de séparation claire Container/Presenter
   - ❌ Difficile à tester isolément

### Conséquences

**Positives** :
- ✅ Séparation claire logique/présentation
- ✅ Testabilité élevée (hooks testables isolément)
- ✅ Réutilisabilité (hooks utilisables ailleurs)
- ✅ Maintenabilité (changements logique n'affectent pas UI)

**Négatives** :
- ⚠️ Légère complexité supplémentaire (2 fichiers au lieu d'1)
- ⚠️ Nécessite discipline pour maintenir séparation

### Évolution future

- **Phase 9** : Créer tests unitaires complets pour `useGarminTabContainer`
- **Phase 10** : Documenter pattern pour autres onglets

---

## ADR-005 : Système de télémétrie custom (TelemetryCoordinator)

**Statut** : ✅ Accepté  
**Date** : 2024-02-15  
**Auteur** : Équipe Garmin  
**Version** : 1.0

### Contexte

L'onglet Garmin nécessite :
- Collecte métriques UI (temps de rendu, re-renders, interactions)
- Collecte métriques réseau (latence, retries, erreurs)
- Collecte métriques cache (hits, misses, TTL)
- Exposition dans DebugPanel (diagnostics temps réel)
- Push vers backend (`/api/garmin/metrics`) avec rollout progressif

### Décision

Implémenter **TelemetryCoordinator custom** avec :
- `TelemetryCoordinator` : orchestration collecte/push
- Stores globaux : `window.__GARMIN_UI_METRICS__`, `window.__GARMIN_NETWORK_STATS__`, `window.__GARMIN_CACHE_STATS__`
- Système d'événements : `telemetryEvents.js` (dispatch standardisé)
- DebugPanel : visualisation temps réel
- Push backend : rollout progressif (10% utilisateurs initialement)

**Implémentation** :
- Coordinator : `utils/TelemetryCoordinator.js`
- Events : `utils/telemetryEvents.js`
- Stores : `utils/uiMetricsStore.js`
- DebugPanel : `components/DebugPanel.jsx`

### Alternatives considérées

1. **Sentry / Datadog RUM**
   - ❌ Rejeté : coût externe, pas de contrôle total sur données
   - ❌ Nécessite intégration externe, pas de debug local

2. **React DevTools Profiler**
   - ❌ Rejeté : développement uniquement, pas de production
   - ❌ Pas de métriques réseau/cache

3. **Performance API native**
   - ❌ Rejeté : limité aux métriques navigateur, pas de métriques métier
   - ❌ Pas de support cache/IndexedDB

### Conséquences

**Positives** :
- ✅ Contrôle total sur collecte/push
- ✅ Debug local via DebugPanel
- ✅ Rollout progressif (réduction risque)
- ✅ Métriques métier spécifiques (cache, sync, IndexedDB)

**Négatives** :
- ⚠️ Maintenance code custom (~300 LOC)
- ⚠️ Pas de dev-tools intégrés (nécessite DebugPanel)
- ⚠️ Nécessite backend pour push (`/api/garmin/metrics`)

### Évolution future

- **Phase 9** : Intégrer Sentry pour erreurs critiques (complémentaire)
- **Phase 10** : Créer dashboard backend pour visualisation métriques

---

## ADR-006 : Web Workers pour traitement off-thread

**Statut** : ✅ Accepté  
**Date** : 2024-02-20  
**Auteur** : Équipe Garmin  
**Version** : 1.0

### Contexte

L'onglet Garmin nécessite :
- Traitement lourd (buildActivityHeatmap, enrichActivities, computeActivityStats)
- Performance UI (éviter blocage main thread)
- Scalabilité (>1000 activités à traiter)

### Décision

Utiliser **Web Workers** pour :
- `syncWorker.js` : traitement off-thread
- `useSyncWorker.js` : hook React pour communication worker
- Seuil automatique : >1000 activités → worker, sinon main thread

**Implémentation** :
- Worker : `workers/syncWorker.js`
- Hook : `hooks/useSyncWorker.js`
- Intégration : `GarminTabContainer` (détection seuil automatique)

### Alternatives considérées

1. **Traitement main thread**
   - ❌ Rejeté : blocage UI pour >1000 activités
   - ❌ Mauvaise UX (freeze interface)

2. **requestIdleCallback**
   - ❌ Rejeté : pas de garantie temps disponible
   - ❌ Nécessite chunking manuel

3. **Service Worker**
   - ❌ Rejeté : focus sur cache réseau, pas traitement
   - ❌ Complexité supplémentaire

### Conséquences

**Positives** :
- ✅ Performance UI préservée (pas de blocage)
- ✅ Scalabilité (traitement parallèle)
- ✅ Seuil automatique (optimisation transparente)

**Négatives** :
- ⚠️ Overhead communication worker (postMessage)
- ⚠️ Nécessite sérialisation données (pas d'objets complexes)

### Évolution future

- **Phase 9** : Optimiser sérialisation (compression données)
- **Phase 10** : Évaluer SharedArrayBuffer si support navigateurs

---

## ADR-007 : Service Worker pour offline fallback

**Statut** : ✅ Accepté  
**Date** : 2024-02-25  
**Auteur** : Équipe Garmin  
**Version** : 1.0

### Contexte

L'onglet Garmin nécessite :
- Résilience offline (fallback cache si réseau indisponible)
- Performance (cache réseau pour sync fréquentes)
- UX (pas de blocage si serveur down)

### Décision

Implémenter **Service Worker** pour :
- `sw-garmin-sync.js` : cache réseau pour `/api/garmin/sync`
- Stratégie network-first avec cache TTL 24h
- Headers custom pour identifier réponses en cache

**Implémentation** :
- Service Worker : `public/sw-garmin-sync.js`
- Manager : `utils/serviceWorkerManager.js`
- Intégration : `GarminTabContainer` (enregistrement après 2s)

### Alternatives considérées

1. **Cache HTTP uniquement**
   - ❌ Rejeté : pas de contrôle total sur stratégie
   - ❌ Pas de fallback offline

2. **IndexedDB seul**
   - ❌ Rejeté : nécessite logique custom pour cache réseau
   - ❌ Pas de stratégie network-first native

3. **Workbox**
   - ❌ Rejeté : surcharge pour besoins simples
   - ❌ Bundle size supplémentaire

### Conséquences

**Positives** :
- ✅ Résilience offline (fallback automatique)
- ✅ Performance (cache réseau)
- ✅ UX améliorée (pas de blocage)

**Négatives** :
- ⚠️ Complexité Service Worker (debugging)
- ⚠️ Nécessite gestion updates (versioning)

### Évolution future

- **Phase 9** : Étendre Service Worker pour autres endpoints
- **Phase 10** : Intégrer Workbox si besoins avancés

---

## ADR-008 : Évaluation migration partielle vers React Query/SWR

**Statut** : 🔄 En évaluation (Phase 9+)  
**Date** : 2024-12-20  
**Auteur** : Équipe Garmin  
**Version** : 0.1 (Draft)

### Contexte

L'onglet Garmin utilise actuellement un système de cache custom (`CacheCoordinator`, `SyncCacheService`) qui fonctionne bien mais nécessite ~500+ LOC de maintenance. Les alternatives modernes comme React Query ou SWR offrent :
- Cache réseau intégré avec TTL
- DevTools pour debugging
- Support SSR natif
- Communauté active et maintenance continue

**Questions à évaluer** :
- Migration partielle (uniquement cache réseau) vs complète
- Compatibilité avec IndexedDB (store principal)
- Impact sur circuit breaker et mode dégradé custom
- Bundle size et performance

### Décision (Provisoire)

**Phase actuelle (Phase 8)** : Conserver `CacheCoordinator` custom.

**Phase 9+ (Évaluation)** :
1. Créer POC avec React Query pour cache réseau uniquement
2. Comparer performance/maintenabilité vs solution actuelle
3. Documenter résultats dans ADR-008 v1.0
4. Décider migration partielle ou non

**Critères d'évaluation** :
- Performance (TTI, bundle size, latence)
- Maintenabilité (LOC, complexité, tests)
- Compatibilité (IndexedDB, circuit breaker, mode dégradé)
- DX (DevTools, debugging, documentation)

### Alternatives considérées

1. **React Query (TanStack Query)**
   - ✅ Cache réseau intégré, DevTools, SSR
   - ⚠️ Nécessite adaptation pour IndexedDB
   - ⚠️ Bundle size ~15 KB gzipped

2. **SWR (Vercel)**
   - ✅ Légère (~5 KB), simple API
   - ⚠️ Moins de features que React Query
   - ⚠️ Nécessite adaptation pour IndexedDB

3. **Conserver solution custom**
   - ✅ Contrôle total, aligné besoins spécifiques
   - ⚠️ Maintenance continue (~500 LOC)
   - ⚠️ Pas de DevTools intégrés

### Conséquences (Provisoires)

**Si migration partielle** :
- ✅ Réduction code custom (~200-300 LOC)
- ✅ DevTools pour debugging
- ⚠️ Adaptation nécessaire pour IndexedDB
- ⚠️ Migration progressive (risque régressions)

**Si conservation solution custom** :
- ✅ Contrôle total, pas de dépendance externe
- ⚠️ Maintenance continue
- ⚠️ Pas de DevTools intégrés

### Évolution future

- **Phase 9** : POC React Query, benchmark performance
- **Phase 10** : Décision finale (migration ou conservation)
- **Phase 11+** : Implémentation si migration validée

---

## Changelog

| Version | Date | Auteur | Changements |
|---------|------|--------|-------------|
| 1.0 | 2024-02-25 | Équipe Garmin | Création initiale (ADR-001 à ADR-007) |
| 1.1 | 2024-12-20 | Équipe Garmin | Ajout ADR-008 (évaluation React Query/SWR) |

---

## Prochaines ADR prévues

- **ADR-008** : ✅ Créé (évaluation React Query/SWR - Phase 9+)
- **ADR-009** : Optimisation compression time series (Phase 10)
- **ADR-010** : Intégration Sentry pour erreurs critiques (Phase 9)


