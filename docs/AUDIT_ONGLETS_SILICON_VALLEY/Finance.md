# Audit — Finance

Périmètre demandé : fichiers **non-.md**, **fonctionnels**, **liés à Finance**.  
Tests exclus.

## Portée exacte (fichiers analysés)
- Onglet & orchestration :
  - `src/components/tabs/FinanceTab.jsx`
  - `src/components/finance/common/SubTabWrapper.jsx`
  - `src/components/finance/FinanceErrorBoundary.jsx`
- Sous‑onglets :
  - Bourse : `src/components/finance/bourse/BourseSubTab.jsx` + composants directs
  - Budget : `src/components/finance/budget/BudgetSubTab.jsx` + sous‑tabs
  - Investissements : `src/components/finance/investissements/InvestissementsSubTab.jsx`
  - Smart Shopping : `src/components/finance/smartShopping/SmartShoppingSubTab.jsx`, `SmartShoppingTab.jsx`
  - Planificateur : `src/components/finance/planificateur/PlanificateurSubTab.jsx`
  - Synthèse : `src/components/finance/synthese/SyntheseSubTab.jsx`, `SyntheseTab.jsx`
- Hooks & services clés :
  - `src/hooks/useFinance.js`
  - `src/hooks/useBudget.js`
  - `src/hooks/useInvestissements.js`
  - `src/hooks/usePlanificateur.js`
  - `src/hooks/useSmartShopping.js`
  - `src/hooks/useSynthese.js`
  - `src/services/finance/financeStorage.js`
  - `src/services/finance/yahooFinanceService.js`
  - `src/services/finance/cacheService.js`
  - `src/services/finance/intelligentCache.js`
  - `src/services/finance/intelligentRefresh.js`
  - `src/services/finance/financeDataSync.js`
  - `src/services/finance/financeAlerts.js`
  - `src/services/finance/financeQuotaManager.js`

## Note globale
**85/100**

Barème cible “Silicon Valley” :
- Performance & optimisation : 35
- Architecture & qualité du code : 25
- Frontend/UX/Accessibilité : 20
- Robustesse & données : 10
- Scalabilité & tests : 10

---

## 1) Onglet Finance (navigation + orchestration)
### Fichiers analysés
- `src/components/tabs/FinanceTab.jsx`
- `src/components/finance/common/SubTabWrapper.jsx`

### Points forts
- Lazy loading cohérent par sous‑onglet.
- Cache de navigation (`useNavigationCache`).
- ErrorBoundary global.

### Points perdus et solutions
- **(-4) Navigation non ARIA**
  - **Pourquoi** : boutons sans `role="tablist"` / `role="tab"` / `aria-selected`.
  - **Solution** : tablist + roving tabindex + `aria-controls`.

- **(-3) Event global `tab-change`**
  - **Pourquoi** : couplage DOM et global.
  - **Solution** : contexte UI ou event bus interne.

- **(-3) `SubTabWrapper` dépend d’API privée React (`_payload`)**
  - **Pourquoi** : fragilité lors des mises à jour React.
  - **Solution** : exposer un `preload()` explicite ou charger via import statique.

- **(-2) Prefetch agressif sans budget**
  - **Solution** : limiter par réseau/CPU (idle + quota) ou stratégie “préfetch du prochain uniquement”.

---

## 2) Sous‑onglet “Bourse”
### Fichiers analysés
- `src/components/finance/bourse/BourseSubTab.jsx`
- `src/hooks/useFinance.js`
- `src/services/finance/yahooFinanceService.js`
- `src/services/finance/financeStorage.js`
- `src/services/finance/financeAlerts.js`

### Points forts
- Lazy loading des composants lourds (chart, alertes, recommandations).
- Auto‑refresh intelligent + Page Visibility API.
- Cache multi‑niveaux + circuit breaker.

### Points perdus et solutions
- **(-6) Logs console en production**
  - **Pourquoi** : `console.*` massifs (ex. `useFinance.addPosition`).
  - **Solution** : logger conditionnel par env.

- **(-5) Dépendances `useMemo` coûteuses**
  - **Pourquoi** : `portfolio.map().join()` et `reduce` dans deps.
  - **Solution** : hash stable stocké dans state/selector.

- **(-4) Refresh sans annulation réelle**
  - **Pourquoi** : `refreshAbortControllerRef` existe mais pas utilisé.
  - **Solution** : AbortController sur fetch + cleanup unmount.

- **(-3) Sync portfolio ↔ bourseCrypto partielle**
  - **Pourquoi** : `financeDataSync` n’efface pas les positions supprimées.
  - **Solution** : stratégie de merge avec tombstones ou diff complet.

---

## 3) Sous‑onglet “Budget”
### Fichiers analysés
- `src/components/finance/budget/BudgetSubTab.jsx`
- `src/components/finance/budget/DashboardSubTab.jsx`
- `src/components/finance/budget/CategoryManagerSubTab.jsx`
- `src/components/finance/budget/CalendarPredictiveSubTab.jsx`
- `src/hooks/useBudget.js`
- `src/services/finance/cacheService.js`

### Note Budget (global)
**87/100**

### Points forts
- Cache TTL + LRU pour métriques.
- Fallback robuste + warnings non bloquants.
- Wrapper générique (`SubTabWrapper`).

### Points perdus et solutions
- **(-4) Hook `useBudget` trop monolithique**
  - **Solution** : découper en hooks par domaine (budget, catégories, dépenses).

- **(-3) Cache LRU non invalidé globalement**
  - **Solution** : invalidation ciblée sur mutation.

- **(-2) Sub‑tabs chargés sans lazy granulaire**
  - **Solution** : lazy pour `BudgetCharts`, `PredictiveAnalysis`.

#### 3.1) Dashboard Budget — **88/100**
- **(-4)** Graphiques lourds non lazy → lazy par section.
- **(-2)** Warnings list non virtualisée → virtual list si volumineux.

#### 3.2) Catégories — **85/100**
- **(-5)** Import `@hello-pangea/dnd` global (bundle) → lazy.
- **(-2)** Accessibilité drag‑drop limitée → roving tabindex + ARIA dnd.

#### 3.3) Calendrier — **86/100**
- **(-4)** `CalendarPredictive` non lazy → lazy sur visibilité.
- **(-2)** Absence d’ARIA calendrier → `aria-live` / labels.

---

## 4) Sous‑onglet “Investissements”
### Fichiers analysés
- `src/components/finance/investissements/InvestissementsSubTab.jsx`
- `src/hooks/useInvestissements.js`
- `src/services/finance/investissementsSyncService.js`
- `src/services/finance/financeDataSync.js`

### Note Investissements (global)
**84/100**

### Points forts
- Cache LRU pour allocation.
- Prix or via hook dédié + auto‑refresh.

### Points perdus et solutions
- **(-5) Sync bidirectionnelle fragile**
  - **Pourquoi** : ajout sans suppression / résolution de conflits.
  - **Solution** : modèle “source of truth” + diff + versioning.

- **(-4) `useInvestissements` charge tout à chaque mutation**
  - **Solution** : mutations locales + refresh ciblé.

- **(-3) Pas de pagination/virtualisation sur tables**
  - **Solution** : `VirtualizedTable` ou pagination.

#### 4.1) Dashboard Unifié — **82/100**
- **(-6)** Sous‑onglet chargé sans lazy interne → lazy graphiques analytiques.

#### 4.2) Or Physique — **85/100**
- **(-4)** Calculs analytiques synchrones → worker/cache.

#### 4.3) Liquidités — **84/100**
- **(-4)** Transformations en render → selectors mémoïsés.

#### 4.4) Bourse/Crypto — **83/100**
- **(-5)** Duplication logique vs Bourse → module partagé.

---

## 5) Sous‑onglet “Smart Shopping”
### Fichiers analysés
- `src/components/finance/smartShopping/SmartShoppingSubTab.jsx`
- `src/components/finance/smartShopping/SmartShoppingTab.jsx`
- `src/hooks/useSmartShopping.js`

### Note Smart Shopping
**83/100**

### Points forts
- Architecture modulaire par sections.
- Alertes intelligentes + metrics memo.

### Points perdus et solutions
- **(-5) Hook `useSmartShopping` sans cache ni retry**
  - **Solution** : cache TTL + retry/backoff comme `useBudget`.

- **(-4) Pas de pagination/virtualisation pour listes**
  - **Solution** : virtual list pour inventaire/listes.

- **(-3) Sections toutes importées**
  - **Solution** : lazy par section active.

- **(-2) Erreurs stockées comme string**
  - **Solution** : `Error` + code pour UX cohérente.

---

## 6) Sous‑onglet “Planificateur”
### Fichiers analysés
- `src/components/finance/planificateur/PlanificateurSubTab.jsx`
- `src/components/finance/planificateur/RepartitionSalaireSubTab.jsx`
- `src/components/finance/planificateur/Planification3AnsSubTab.jsx`
- `src/hooks/usePlanificateur.js`

### Note Planificateur (global)
**85/100**

### Points forts
- Optimistic updates + rollback.
- Sync Sidebar via events.

### Points perdus et solutions
- **(-4) `handleSalaireChange` non debounced**
  - **Solution** : debounce ou `onBlur` pour persister.

- **(-4) `debouncedUpdateRepartition` sans cleanup**
  - **Solution** : `debounced.cancel()` on unmount.

- **(-3) Rechargement complet après chaque mutation**
  - **Solution** : update locale + refresh ciblé.

#### 6.1) Répartition — **86/100**
- **(-4)** Validation basique (pas de contraintes globales) → schema + messages.

#### 6.2) Planification 3 ans — **84/100**
- **(-4)** Calculs dans render (stats + date diff) → `useMemo`.

#### 6.3) Synchronisation — **82/100**
- **(-6)** Dépend de services externes sans fallback UI.

---

## 7) Sous‑onglet “Synthèse”
### Fichiers analysés
- `src/components/finance/synthese/SyntheseSubTab.jsx`
- `src/components/finance/synthese/SyntheseTab.jsx`
- `src/hooks/useSynthese.js`

### Note Synthèse
**82/100**

### Points forts
- Alertes intelligentes + calcul net worth centralisé.
- Sections riches et orientées décision.

### Points perdus et solutions
- **(-6) Composant monolithique très lourd**
  - **Solution** : découper en sections + lazy + memo par bloc.

- **(-4) `calculateProjections` synchrone (boucle lourde)**
  - **Solution** : worker + cache par scénario/durée.

- **(-3) Multiples sections montées en même temps**
  - **Solution** : afficher une section à la fois (tabs internes).

---

## 8) Infra commune Finance (services)
### Points forts
- IndexedDB + compression + cache intelligent.
- Circuit breaker + quota manager + refresh intelligent.

### Points perdus et solutions
- **(-4) `FinanceStorage.savePortfolio` fait un clear global**
  - **Solution** : diff incrémental + upsert par position.

- **(-3) `IntelligentCache` LRU simplifié (FIFO)**
  - **Solution** : vrai LRU + stats d’accès.

- **(-2) `financeDataSync` sans résolution de conflits**
  - **Solution** : timestamps + stratégie “last-write-wins”.

---

## Actions prioritaires pour 100/100
1. **Découper les hooks monolithiques** (`useFinance`, `useBudget`, `useSynthese`).
2. **Lazy‑load par section interne** (Budget, Synthèse, SmartShopping).
3. **Corriger sync bidirectionnelle** (suppression + conflits).
4. **Améliorer accessibilité** (ARIA tablist + focus management).
5. **Standardiser cache/logging** (logger env + LRU réel).

---

## Statut
Onglet Finance terminé.  
Indique le prochain périmètre à auditer.
