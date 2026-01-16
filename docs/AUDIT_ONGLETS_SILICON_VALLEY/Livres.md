# Audit — Livres

Périmètre demandé : fichiers **non-.md**, **fonctionnels**, **liés à l’onglet Livres**.  
Tests exclus.

## Portée exacte (fichiers analysés)
- Onglet & sous‑onglets :
  - `src/components/tabs/BooksTab.jsx`
  - `src/components/tabs/BooksTab/BooksTab.refactored.jsx`
  - `src/components/tabs/books/StatisticsSubTab.jsx`
  - `src/components/books/BooksDomeGallery.jsx`
  - `src/components/tabs/BooksTab/components/BooksXPBar.jsx`
- Hooks Livres :
  - `src/hooks/useBooksStorage.js`
  - `src/hooks/useBooksXP.js`
  - `src/hooks/useBooksStatistics.js`
  - `src/components/tabs/BooksTab/hooks/useBooksActions.js`
  - `src/components/tabs/BooksTab/hooks/useBooksFilters.js`
  - `src/components/tabs/BooksTab/hooks/useBooksProgress.js`
  - `src/components/tabs/BooksTab/hooks/useBooksPagination.js`
  - `src/components/tabs/BooksTab/hooks/useBooksSessions.js`
  - `src/components/tabs/BooksTab/hooks/useBooksImportExport.js`
  - `src/components/tabs/BooksTab/hooks/useBooksCovers.js`
  - `src/components/tabs/BooksTab/hooks/useBooksAssets.js`
- Utilitaires & stockage :
  - `src/utils/booksStorage.js`
  - `src/utils/booksIndexedDB.js`
  - `src/utils/booksAssetsStorage.js`
  - `src/utils/booksExportImport.js`
  - `src/utils/bookCoverLazyLoader.js`

## Note globale
**86/100**

Barème cible “Silicon Valley” :
- Performance & optimisation : 35
- Architecture & qualité du code : 25
- Frontend/UX/Accessibilité : 20
- Robustesse & données : 10
- Scalabilité & tests : 10

---

## 1) Onglet Livres (navigation + orchestration)
### Fichiers analysés
- `src/components/tabs/BooksTab.jsx`
- `src/components/tabs/BooksTab/BooksTab.refactored.jsx`

### Points forts
- Refactorisation par hooks métier (filtres, sessions, assets, import/export).
- ErrorBoundary par sous‑onglet.
- Chargement lazy de la vue 3D.

### Points perdus et solutions
- **(-5) Composant monolithique (>1000 lignes)**
  - **Pourquoi** : mélange UI + data + navigation + assets.
  - **Solution** : découper en sections (Form, Filters, Carousels, Detail, Sessions).

- **(-3) Navigation sous‑onglets non ARIA**
  - **Solution** : `role="tablist"`, `role="tab"`, `aria-selected`.

- **(-3) Scroll via `setTimeout` + `querySelector`**
  - **Solution** : refs + `requestAnimationFrame` + `scrollIntoView` direct.

- **(-2) Persistance sans versioning**
  - **Solution** : stocker `{version, value}` pour migrations.

---

## 2) Sous‑onglet “Bibliothèque”
### Fichiers analysés
- `src/components/tabs/BooksTab.jsx`
- Hooks `useBooks*`
- `src/components/books/BooksDomeGallery.jsx`

### Note Bibliothèque
**87/100**

### Points forts
- Filtres + tri + pagination structurés.
- Gestion des assets (PDF + couverture) via IndexedDB.

### Points perdus et solutions
- **(-5) `BooksDomeGallery` très coûteux CPU**
  - **Pourquoi** : ResizeObserver + animation + inertie lourde.
  - **Solution** : suspendre animations hors focus / `prefers-reduced-motion`.

- **(-4) Couvertures chargées même si vue 3D masquée**
  - **Solution** : charger les couvertures uniquement si `show3D` actif.

- **(-3) `useBooksActions` utilise `alert/confirm`**
  - **Solution** : modales non bloquantes avec focus trap.

- **(-2) `notes` écrasé par `shortSummary`**
  - **Pourquoi** : `notes: validatedBook.shortSummary`.
  - **Solution** : champ `notes` dédié.

---

## 3) Sous‑onglet “Statistiques”
### Fichiers analysés
- `src/components/tabs/books/StatisticsSubTab.jsx`
- Hooks statistiques (`useOptimizedStatistics`, `usePredictions`, `useBooksStatistics`)

### Note Statistiques
**84/100**

### Points forts
- Data pipeline optimisé + filtres persistés.
- Intégration analytics et prédictions.

### Points perdus et solutions
- **(-6) Charts chargés en bloc**
  - **Solution** : lazy par section + suspense.

- **(-4) Calculs synchrones lourds**
  - **Solution** : worker + cache par période/filtre.

- **(-3) Updates via `sidebarEvents` re‑calculent tout**
  - **Solution** : diff incrémental (ex : session ajoutée).

---

## 4) Hooks & stockage
### Fichiers analysés
- `src/hooks/useBooksStorage.js`
- `src/hooks/useBooksXP.js`
- `src/hooks/useBooksStatistics.js`
- `src/utils/booksIndexedDB.js`
- `src/utils/booksStorage.js`
- `src/utils/booksExportImport.js`
- `src/utils/booksAssetsStorage.js`

### Points forts
- Filtrage par utilisateur + merge intelligent IndexedDB.
- Export/import robuste et multi‑versions.

### Points perdus et solutions
- **(-5) Logs console en production**
  - **Solution** : logger conditionnel + niveaux.

- **(-4) Hash JSON complet pour chaque save**
  - **Solution** : hash par delta (sessions, pages) ou versionnement.

- **(-3) `saveBooksToIndexedDB` fait `store.clear()`**
  - **Solution** : upsert par ID pour éviter coût total.

- **(-3) Cache global `useBooksXP` partagé**
  - **Solution** : cache scoped par userId.

- **(-2) `useBooksStatistics` fige la date du jour**
  - **Solution** : recalcul quotidien via timer/visibility.

- **(-2) `useBooksImportExport` appelle `saveBooks` (localStorage)**
  - **Solution** : supprimer localStorage et laisser `useBooksStorage` gérer IndexedDB.

---

## Actions prioritaires pour 100/100
1. **Découper `BooksTab`** en sections UI + hooks dédiés.
2. **Lazy‑load des charts** + worker pour calculs statistiques.
3. **Remplacer `alert/confirm`** par modales non bloquantes.
4. **Réduire le coût `BooksDomeGallery`** (pause + reduced motion).
5. **Upsert IndexedDB** au lieu de `store.clear()`.

---

## Statut
Onglet Livres terminé.  
Indique le prochain périmètre à auditer.
