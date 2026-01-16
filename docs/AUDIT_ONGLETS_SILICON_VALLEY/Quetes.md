# Audit — Quêtes (QuietQuest)

Périmètre demandé : fichiers **non-.md**, **fonctionnels**, **liés aux Quêtes**.  
Tests exclus.

## Portée exacte (fichiers analysés)
- Onglet & sous‑onglets :
  - `src/components/tabs/QuestsTab.jsx`
  - `src/components/tabs/QuestsTab/QuestsTab.refactored.jsx`
  - `src/components/quests/QuestsTodayView.jsx`
  - `src/components/quests/QuestsWeekView.jsx`
  - `src/components/quests/QuestsXPBar.jsx`
  - `src/components/quests/stats/QuestsStatsView.jsx`
  - `src/components/quests/stats/components/*`
  - `src/components/quests/stats/charts/*`
  - `src/components/quests/stats/utils/*`
- Modules internes :
  - `src/components/tabs/QuestsTab/components/QuestFormModal.jsx`
  - `src/components/tabs/QuestsTab/components/QuestsTableView.jsx`
  - `src/components/tabs/QuestsTab/components/SecurityView.jsx`
  - `src/components/tabs/QuestsTab/hooks/useQuestsActions.js`
  - `src/components/tabs/QuestsTab/hooks/useQuestsFilters.js`
  - `src/components/tabs/QuestsTab/hooks/useQuestsSort.js`
  - `src/components/tabs/QuestsTab/hooks/useQuestsSelection.js`
  - `src/components/tabs/QuestsTab/hooks/useQuestsBulkActions.js`
  - `src/components/tabs/QuestsTab/hooks/useQuestsDragDrop.js`
- Moteur & stats :
  - `src/hooks/useQuietQuestEngine.js`
  - `src/hooks/useQuietQuestStats.js`
  - `src/components/quests/stats/utils/statsCalculations.js`

## Note globale
**87/100**

Barème cible “Silicon Valley” :
- Performance & optimisation : 35
- Architecture & qualité du code : 25
- Frontend/UX/Accessibilité : 20
- Robustesse & données : 10
- Scalabilité & tests : 10

---

## 1) Onglet Quêtes (navigation + orchestration)
### Fichiers analysés
- `src/components/tabs/QuestsTab.jsx`
- `src/components/tabs/QuestsTab/QuestsTab.refactored.jsx`

### Points forts
- Refactor en hooks dédiés (filters/sort/actions/selection/drag‑drop).
- ErrorBoundary par sous‑onglet.
- Persistance du sous‑onglet actif.

### Points perdus et solutions
- **(−4) Dépendance `localStorage` sans versioning**
  - **Pourquoi** : `quests.activeSubTab` est stocké sans version ni migration.
  - **Solution** : `storageVersion` + fallback en cas d’ancienne valeur.

- **(−3) Navigation interne non ARIA**
  - **Solution** : `role="tablist"`, `role="tab"`, `aria-selected`.

- **(−2) Event global `tab-change`**
  - **Solution** : remonter l’état via context pour éviter dépendance DOM.

---

## 2) Sous‑onglet “Aujourd’hui”
### Fichiers analysés
- `src/components/quests/QuestsTodayView.jsx`
- `src/components/quests/QuestsXPBar.jsx`

### Points forts
- UI lisible, progression claire, memoization avec `React.memo`.
- XP bar dédiée, calcul centralisé.

### Points perdus et solutions
- **(−3) Calculs en render sans memo**
  - **Pourquoi** : `questsToday`, `completedCount`, `successRate` recalculés à chaque render.
  - **Solution** : `useMemo` basé sur `allQuests` + `validations`.

- **(−3) XP bar : cache global mutable**
  - **Pourquoi** : `questsXpCache` partagé peut provoquer incohérences multi‑sessions.
  - **Solution** : cache par utilisateur ou hook-level cache.

- **(−2) Pas d’accessibilité clavier sur cartes**
  - **Solution** : `role="button"`, `tabIndex`, gestion `Enter/Space`.

---

## 3) Sous‑onglet “Cette semaine”
### Fichiers analysés
- `src/components/quests/QuestsWeekView.jsx`

### Points forts
- Vue hebdomadaire claire, taux de succès visible.

### Points perdus et solutions
- **(−4) Calcul semaine sans memo**
  - **Pourquoi** : `weekDays` est recalculé à chaque render.
  - **Solution** : `useMemo` dépendant de `validations` et `allQuests`.

- **(−3) Click actions en liste sans virtualisation**
  - **Solution** : virtual list si la densité augmente.

---

## 4) Sous‑onglet “Mes quêtes”
### Fichiers analysés
- `src/components/tabs/QuestsTab/components/QuestsTableView.jsx`
- `src/components/tabs/QuestsTab/components/QuestFormModal.jsx`
- Hooks CRUD/filtres/tri/selection/bulk/drag‑drop

### Points forts
- Filtres, tri, actions en lot, drag & drop.
- Validation Zod dans `useQuestsActions`.

### Points perdus et solutions
- **(−5) Table sans virtualisation**
  - **Solution** : `react-window` ou pagination.

- **(−4) `window.confirm` bloquant**
  - **Solution** : modal de confirmation non‑bloquante.

- **(−3) `QuestFormModal` sans focus trap**
  - **Solution** : focus trap + fermeture ESC.

- **(−3) Drag & drop non persistant côté storage**
  - **Pourquoi** : ordre recalculé en state mais persistance dépend du moteur.
  - **Solution** : persist `ordre` via engine + debounce.

---

## 5) Sous‑onglet “Statistiques”
### Fichiers analysés
- `src/components/quests/stats/QuestsStatsView.jsx`
- `src/hooks/useQuietQuestStats.js`
- `src/components/quests/stats/utils/statsCalculations.js`
- `src/components/quests/stats/charts/*`

### Points forts
- Grande richesse visuelle (heatmap, radar, treemap, funnel…).
- Calculs centralisés via `useQuietQuestStats`.

### Points perdus et solutions
- **(−8) Imports massifs de charts**
  - **Pourquoi** : tous les graphes chargés même si non visibles.
  - **Solution** : lazy import par section + suspense ciblé.

- **(−6) Calculs statistiques volumineux**
  - **Pourquoi** : nombreux `filter`/`reduce` sur grands datasets.
  - **Solution** : worker + cache par période.

- **(−4) `useQuietQuestStats` refait des `filter` multi‑fois**
  - **Solution** : pré-indexer validations par date et par quête.

---

## 6) Sous‑onglet “Sécurité”
### Fichiers analysés
- `src/components/tabs/QuestsTab/components/SecurityView.jsx`

### Points forts
- Export/Import complet, validation de fichier, reset total.

### Points perdus et solutions
- **(−5) `window.location.reload()`**
  - **Pourquoi** : reset brutal, perte d’état global.
  - **Solution** : recharger via moteur + invalidation caches sans reload.

- **(−3) Confirmation bloquante**
  - **Solution** : modal non‑bloquante.

---

## 7) Moteur QuietQuest
### Fichier analysé
- `src/hooks/useQuietQuestEngine.js`

### Points forts
- Gestion IndexedDB + fallback localStorage.
- Cache interne `getQuestsForDate`, debounce sauvegarde.

### Points perdus et solutions
- **(−8) Quêtes hardcodées pour un user**
  - **Pourquoi** : `HARDCODED_QUESTS_FOR_ZINGARIELLO` est en code.
  - **Solution** : déplacer dans un seed de données ou un mode “demo”.

- **(−6) `userId = 'main'`**
  - **Pourquoi** : pas de multi‑user réel.
  - **Solution** : scoper stockage par `currentUser.id`.

- **(−5) Hook très monolithique**
  - **Solution** : séparer persistance, calculs XP, validations.

---

## Actions prioritaires pour 100/100
1. **Découper `useQuietQuestEngine`** en domaines (storage / stats / XP).
2. **Virtualiser la table “Mes quêtes”**.
3. **Lazy‑load les charts** + worker pour stats.
4. **Retirer `window.confirm` et `window.location.reload`**.
5. **Supprimer les quêtes hardcodées** et passer par un système seed/config.

---

## Statut
Onglet Quêtes terminé.  
Indique le prochain périmètre à auditer.
