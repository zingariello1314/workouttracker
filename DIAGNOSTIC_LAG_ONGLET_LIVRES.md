# 🔍 Diagnostic des problèmes de lag dans l'onglet Livres

## ⚠️ AVERTISSEMENT IMPORTANT

**La galerie 3D (`BooksDomeGallery`) est EXCLUE de toutes les optimisations.** Ce composant a été longuement paramétré et testé. Aucune modification ne sera apportée pour éviter de casser :
- La physique de rotation et d'inertie
- Les proportions et la taille du dôme
- L'interactivité (drag, click, zoom)
- L'esthétique visuelle

Toutes les optimisations concernent uniquement `BooksTab.jsx` et les composants de liste, **PAS la galerie 3D**.

---

## 📋 Résumé exécutif

L'onglet Livres présente des problèmes de performance lors du scroll, principalement dus à :
1. **Re-renders excessifs** causés par des `useEffect` et `useMemo` mal optimisés
2. **Chargement synchrone de couvertures** dans une boucle sans throttling
3. **Absence de virtualisation** pour les listes de livres
4. **CSS coûteux** (`backdrop-filter`, `blur`) appliqué sur de nombreux éléments (SAUF la galerie 3D)
5. **Calculs répétés** dans `renderBookCard` à chaque render
6. ~~**Composant 3D lourd** (`BooksDomeGallery`) avec de nombreux listeners~~ **EXCLU - Ne pas modifier**

---

## 🔴 Problèmes critiques identifiés

### 1. **useEffect de debug exécuté à chaque changement de `books`** ⚠️ CRITIQUE

**Localisation** : `BooksTab.jsx` lignes 90-102

```javascript
useEffect(() => {
  if (books.length > 0) {
    console.log('[BooksTab] Livres dans l\'état:', books.length);
    console.log('[BooksTab] Répartition par statut:', {
      'in-progress': books.filter(b => b.status === 'in-progress').length,
      'completed': books.filter(b => b.status === 'completed').length,
      // ... 5 filtres supplémentaires
      'sans-statut': books.filter(b => !b.status || ...).map(b => ({ id: b.id, title: b.title, status: b.status })),
    });
  }
}, [books]);
```

**Problème** :
- Exécute **6 filtres + 1 map** à chaque changement de `books`
- Crée un nouvel objet à chaque fois (même si les valeurs sont identiques)
- Logs console en production (impact performance)

**Impact** : Re-render inutile + calculs coûteux à chaque modification

**Solution** :
- Supprimer ce `useEffect` en production ou le conditionner avec `process.env.NODE_ENV === 'development'`
- Utiliser `useMemo` pour calculer la répartition par statut si nécessaire
- Déplacer les logs dans un `useMemo` avec dépendances strictes

---

### 2. **Chargement des couvertures en boucle sans throttling** ⚠️ CRITIQUE

**Localisation** : `BooksTab.jsx` lignes 140-227

```javascript
useEffect(() => {
  // ...
  const loadCoversFromIndexedDB = async () => {
    const toLoad = books.filter((book) => {
      return !coverUrlsRef.current[book.id] && book.hasCover;
    });
    
    for (const book of toLoad) {
      if (cancelled) return;
      
      try {
        const record = await getBookCover(`cover_${book.id}`);
        // ...
        setCoverUrls((prev) => {
          // ... création d'un nouvel objet à chaque fois
          const next = { ...prev, [book.id]: src };
          return next;
        });
      } catch {
        // ...
      }
    }
  };
  
  if (books && books.length > 0) {
    loadCoversFromIndexedDB();
  }
}, [books, show3D]);
```

**Problèmes** :
1. **Boucle `for...of` sans délai** : charge toutes les couvertures d'un coup
2. **`setCoverUrls` appelé dans une boucle** : déclenche un re-render à chaque itération
3. **Pas de limite de batch** : si 100 livres ont des couvertures, 100 re-renders
4. **Dépendance `show3D` inutile** : le chargement devrait être indépendant de l'affichage 3D

**Impact** : 
- **100+ re-renders** si beaucoup de livres avec couvertures
- **Blocage du thread principal** pendant le chargement
- **Lag visible** lors du scroll pendant le chargement

**Solution** :
- **Throttler le chargement** : charger par batch de 5-10 couvertures
- **Batching des `setCoverUrls`** : accumuler les URLs et mettre à jour une seule fois par batch
- **Intersection Observer** : charger uniquement les couvertures visibles à l'écran
- **Retirer `show3D` de la dépendance** : le chargement doit être indépendant

---

### 3. **Chaîne de useMemo en cascade** ⚠️ MOYEN

**Localisation** : `BooksTab.jsx` lignes 384-483

```javascript
const filteredAndSortedBooks = useMemo(() => {
  // Filtre + tri sur TOUS les livres
  return [...books]
    .filter(matchesSearch)
    .filter(matchesGenre)
    .filter(matchesYear)
    .filter(matchesScore)
    .sort(sortFn);
}, [books, search, filterGenre, filterMinYear, filterMaxYear, filterMinScore, sortMode]);

const filteredLibraryBooks = useMemo(
  () => filteredAndSortedBooks.filter((b) => b.status === 'in-progress'),
  [filteredAndSortedBooks]
);

const filteredCompletedBooks = useMemo(
  () => filteredAndSortedBooks.filter((b) => b.status === 'completed'),
  [filteredAndSortedBooks]
);

const filteredToReadBooks = useMemo(
  () => filteredAndSortedBooks.filter((b) => b.status === 'to-read'),
  [filteredAndSortedBooks]
);

const paginatedInProgressBooks = useMemo(() => {
  const start = pageInProgress * PAGE_SIZE;
  return filteredLibraryBooks.slice(start, start + PAGE_SIZE);
}, [filteredLibraryBooks, pageInProgress]);
// ... idem pour completed et toRead
```

**Problèmes** :
1. **4 filtres séquentiels** : crée 4 nouveaux tableaux à chaque changement
2. **Tri complet** : même si seuls 10 livres sont affichés, tous sont triés
3. **Re-calcul en cascade** : un changement dans `filteredAndSortedBooks` déclenche 3 autres `useMemo`
4. **Pas de mémoization des fonctions de filtre** : `matchesSearch`, `matchesGenre`, etc. recréées à chaque render

**Impact** : 
- **O(n log n)** pour le tri à chaque changement de filtre
- **4 allocations de tableaux** inutiles
- **Re-render de tous les carrousels** même si un seul change

**Solution** :
- **Optimiser le tri** : ne trier que les livres filtrés, pas tous
- **Combiner les filtres** : un seul `filter` avec une fonction combinée
- **Mémoizer les fonctions de filtre** : `useCallback` pour `matchesSearch`, etc.
- **Virtualisation** : ne calculer que les livres visibles (react-window ou react-virtual)

---

### 4. **renderBookCard non mémoizé avec calculs coûteux** ⚠️ CRITIQUE

**Localisation** : `BooksTab.jsx` lignes 1075-1202

```javascript
const renderBookCard = (book, isCompleted = false) => {
  const coverUrl = coverUrls[book.id];
  const progressPercent = getReadingProgressPercent(book); // ⚠️ Calcul à chaque render
  const bookStatus = book.status || 'in-progress';

  return (
    <Card
      // ... beaucoup de props et de classes conditionnelles
      className={`w-full min-h-[300px] cursor-pointer transition-all duration-300 ${
        selectedBookId === book.id 
          ? 'ring-2 ring-purple-400/50 ...' 
          : 'hover:scale-[1.01] ...'
      }`}
      onClick={() => setSelectedBookId(book.id)} // ⚠️ Nouvelle fonction à chaque render
    >
      {/* ... contenu complexe avec Select, Button, etc. */}
    </Card>
  );
};
```

**Problèmes** :
1. **`getReadingProgressPercent(book)` appelé à chaque render** : parcourt `readingSessions` à chaque fois
2. **Fonction `onClick` recréée** : nouvelle fonction à chaque render → re-render de tous les `Card`
3. **Pas de `React.memo`** : même si `book` n'a pas changé, le composant est re-rendu
4. **Classes conditionnelles recalculées** : template string évaluée à chaque render
5. **`coverUrls[book.id]` accès direct** : pas de fallback, peut être `undefined`

**Impact** :
- **Re-render de toutes les cartes** même si une seule change
- **Calculs répétés** pour `progressPercent` (parcourt sessions)
- **Allocation mémoire** : nouvelles fonctions/closures à chaque render

**Solution** :
- **Mémoizer `BookCard`** : créer un composant séparé avec `React.memo`
- **Pré-calculer `progressPercent`** : dans `useMemo` au niveau parent
- **Stabiliser `onClick`** : `useCallback` avec `book.id` en dépendance
- **Lazy loading des images** : `loading="lazy"` déjà présent, mais vérifier le support

---

### 5. **CSS backdrop-filter coûteux appliqué partout** ⚠️ MOYEN (avec précautions)

**Localisation** : `booksLiquidGlass.css` (tous les éléments SAUF la galerie 3D)

**⚠️ ATTENTION** : Les styles de la galerie 3D (`booksDome.css`) **NE DOIVENT PAS être modifiés**. Seuls les styles de `booksLiquidGlass.css` peuvent être optimisés.

```css
.books-glass-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(40px) saturate(180%);
  -webkit-backdrop-filter: blur(40px) saturate(180%);
  /* ... */
}

.books-glass-input {
  backdrop-filter: blur(20px) saturate(180%);
  /* ... */
}
```

**Problème** :
- **`backdrop-filter: blur()` est très coûteux** : force le navigateur à recalculer les couches
- **Appliqué sur de nombreux éléments** : chaque `Card`, `Input`, `Select`, `Button` dans BooksTab
- **Pas de `will-change`** : le navigateur ne peut pas optimiser
- **Pas de `contain: layout style paint`** : pas d'isolation des re-renders

**Impact** :
- **Lag visible lors du scroll** : chaque élément avec `backdrop-filter` doit être recalculé
- **FPS réduit** : peut descendre à 30-40 FPS sur machines moins puissantes
- **Consommation GPU élevée** : chaque blur nécessite un rendu GPU

**Solution** (UNIQUEMENT pour `booksLiquidGlass.css`, PAS pour `booksDome.css`) :
- **Réduire le blur** : `blur(20px)` au lieu de `blur(40px)` pour les cards (test visuel requis)
- **`will-change: transform`** : indiquer au navigateur que l'élément sera transformé
- **`contain: layout style paint`** : isoler les re-renders
- **Lazy backdrop-filter** : n'appliquer le blur que sur les éléments visibles (Intersection Observer)
- **Alternative** : utiliser `box-shadow` avec `inset` pour un effet similaire moins coûteux

**⚠️ RÈGLE ABSOLUE** : Ne jamais modifier `booksDome.css` ou les styles inline de `BooksDomeGallery.jsx`

---

### 6. **BooksDomeGallery : composant lourd avec nombreux listeners** ⚠️ **EXCLU - NE PAS MODIFIER**

**Localisation** : `BooksDomeGallery.jsx` lignes 237-524

**⚠️ ATTENTION CRITIQUE** : Ce composant a été longuement paramétré et testé. **AUCUNE modification ne doit être apportée** pour éviter de casser :
- La physique de rotation et d'inertie
- Les proportions et la taille du dôme
- L'interactivité (drag, click, zoom)
- L'esthétique visuelle

**Problèmes identifiés** (à titre informatif uniquement) :
1. **6 event listeners** attachés au DOM
2. **`setInterval` pour l'inertie** : tourne même quand le composant n'est pas visible
3. **ResizeObserver** : observe les changements de taille
4. **Pas de `passive: true`** : les listeners peuvent bloquer le scroll

**Décision** : **EXCLURE de toutes les optimisations**. Le composant fonctionne correctement et toute modification risquerait de casser le comportement soigneusement calibré.

**Note** : Si des problèmes de performance sont observés spécifiquement avec la galerie 3D, ils doivent être traités séparément après validation de l'utilisateur.

---

### 7. **Pas de virtualisation pour les listes** ⚠️ MOYEN

**Localisation** : `BooksTab.jsx` lignes 1620-1795

```javascript
<div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin ...">
  {paginatedInProgressBooks.map((book) => renderBookCard(book, false))}
</div>
```

**Problème** :
- **Tous les livres de la page sont rendus** : même ceux hors écran
- **Pagination de 30 livres** : 30 composants `Card` rendus même si seuls 3-4 sont visibles
- **Pas de virtualisation horizontale** : pour les carrousels horizontaux

**Impact** :
- **Temps de render initial** : long si beaucoup de livres
- **Lag lors du scroll** : tous les éléments doivent être recalculés
- **Consommation mémoire** : DOM lourd avec beaucoup d'éléments

**Solution** :
- **react-window ou react-virtual** : virtualiser les listes verticales et horizontales
- **Intersection Observer** : ne rendre que les éléments visibles
- **Réduire `PAGE_SIZE`** : de 30 à 10-15 livres par page

---

### 8. **Calculs dans renderBookCard non optimisés** ⚠️ MOYEN

**Localisation** : `BooksTab.jsx` lignes 542-608

```javascript
const getReadingProgressPercent = (book) => {
  if (!book.pages || book.pages <= 0) return null;
  const totalPagesRead = getTotalPagesRead(book);
  if (totalPagesRead <= 0) return 0;
  return Math.min(100, (totalPagesRead / book.pages) * 100);
};

const getTotalPagesRead = (book) =>
  (book.readingSessions || []).reduce(
    (sum, s) => sum + (Number(s.pagesRead) || 0),
    0
  );
```

**Problème** :
- **Appelé à chaque render de `BookCard`** : même si `book.readingSessions` n'a pas changé
- **`reduce` sur `readingSessions`** : parcourt toutes les sessions à chaque fois
- **Pas de cache** : même livre = même calcul répété

**Impact** :
- **Calculs redondants** : si 30 livres sont affichés, 30 `reduce` exécutés
- **Temps CPU** : proportionnel au nombre de sessions par livre

**Solution** :
- **Pré-calculer dans `useMemo`** : calculer `progressPercent` pour tous les livres en une fois
- **Mémoizer par livre** : `useMemo` avec `book.id` et `book.readingSessions` en dépendances
- **Cache dans l'objet book** : ajouter `progressPercent` lors de la création/modification du livre

---

### 9. **setCoverUrls appelé dans une boucle** ⚠️ CRITIQUE

**Localisation** : `BooksTab.jsx` lignes 190-203

```javascript
for (const book of toLoad) {
  // ...
  setCoverUrls((prev) => {
    const existing = prev[book.id];
    if (existing && existing.startsWith('blob:')) {
      URL.revokeObjectURL(existing);
    }
    const next = { ...prev, [book.id]: src };
    coverUrlsRef.current = next;
    return next;
  });
}
```

**Problème** :
- **`setCoverUrls` appelé dans une boucle** : déclenche un re-render à chaque itération
- **Si 50 livres** : 50 re-renders successifs
- **Pas de batching** : React ne peut pas batch ces updates (ils sont dans une boucle async)

**Impact** :
- **50+ re-renders** pour charger 50 couvertures
- **Lag visible** : l'interface freeze pendant le chargement
- **Scroll bloqué** : le thread principal est occupé

**Solution** :
- **Accumuler les URLs** : créer un objet `newCoverUrls` et mettre à jour une seule fois
- **Batching manuel** : grouper les updates par batch de 5-10
- **`flushSync` si nécessaire** : forcer un batch si React ne le fait pas automatiquement

---

### 10. **Dépendances useEffect non optimisées** ⚠️ MOYEN

**Localisation** : Plusieurs `useEffect` dans `BooksTab.jsx`

**Exemples** :
- Ligne 140 : `useEffect(..., [books, show3D])` - `show3D` ne devrait pas déclencher le rechargement
- Ligne 227 : `useEffect(..., [books, show3D])` - même problème
- Ligne 650 : `useEffect(..., [filteredLibraryBooks, filteredCompletedBooks, selectedBookId])` - dépend de `useMemo` calculés

**Problème** :
- **Dépendances trop larges** : `books` change souvent (ajout, modification, suppression)
- **Dépendances calculées** : `filteredLibraryBooks` est recalculé à chaque changement de filtre
- **Re-exécution inutile** : `useEffect` se réexécute même si la logique n'a pas besoin de changer

**Solution** :
- **Réduire les dépendances** : utiliser des refs pour les valeurs qui ne doivent pas déclencher de re-exécution
- **Séparer les effets** : un `useEffect` par responsabilité
- **Conditions dans l'effet** : vérifier si le changement est réellement nécessaire avant d'exécuter

---

## 🟡 Problèmes secondaires

### 11. **Pas de debounce sur les filtres de recherche**

**Localisation** : `BooksTab.jsx` ligne 68

```javascript
const [search, setSearch] = useState('');
```

**Problème** : Chaque frappe déclenche un re-calcul de `filteredAndSortedBooks`

**Solution** : Debouncer `search` avec `useDebouncedValue` (300ms)

---

### 12. **Console.log en production**

**Localisation** : Plusieurs endroits dans `BooksTab.jsx` et `useBooksStorage.js`

**Problème** : Les `console.log` ralentissent l'exécution, surtout dans les boucles

**Solution** : Conditionner avec `process.env.NODE_ENV === 'development'` ou utiliser un logger conditionnel

---

### 13. **Pas de `React.memo` sur les composants enfants**

**Localisation** : `BooksTab.jsx` - aucun composant enfant n'est mémoizé

**Problème** : Tous les composants sont re-rendus même si leurs props n'ont pas changé

**Solution** : Envelopper `BookCard`, les `Card` de filtres, etc. dans `React.memo`

---

## 📊 Impact estimé par problème

| Problème | Impact | Priorité | Temps estimé |
|----------|--------|----------|--------------|
| 1. useEffect debug | 🔴 Critique | Haute | 5 min |
| 2. Chargement couvertures | 🔴 Critique | Haute | 30 min |
| 4. renderBookCard non mémoizé | 🔴 Critique | Haute | 20 min |
| 9. setCoverUrls en boucle | 🔴 Critique | Haute | 15 min |
| 3. Chaîne useMemo | 🟡 Moyen | Moyenne | 25 min |
| 5. CSS backdrop-filter | 🟡 Moyen | Moyenne | 20 min |
| 6. BooksDomeGallery | 🔴 **EXCLU** | **Aucune** | **0 min** - Ne pas modifier |
| 7. Pas de virtualisation | 🟡 Moyen | Basse | 2h |
| 8. Calculs non optimisés | 🟡 Moyen | Moyenne | 15 min |
| 10. Dépendances useEffect | 🟡 Moyen | Moyenne | 20 min |
| 11. Debounce recherche | 🟢 Faible | Basse | 10 min |
| 12. Console.log | 🟢 Faible | Basse | 5 min |
| 13. React.memo | 🟢 Faible | Basse | 15 min |

**Total estimé** : ~3h30 pour corriger tous les problèmes critiques et moyens (BooksDomeGallery exclu)

---

## ⚠️ RÈGLES DE MODIFICATION

### Zones interdites (NE JAMAIS MODIFIER)
1. **`BooksDomeGallery.jsx`** : Aucune modification autorisée
2. **`booksDome.css`** : Aucune modification autorisée
3. **Props passées à `BooksDomeGallery`** : Ne pas modifier les props (`fit`, `minRadius`, `maxRadius`, `padFactor`, etc.)
4. **Styles inline dans `BooksDomeGallery`** : Ne pas modifier les styles CSS inline

### Zones autorisées (optimisations uniquement)
1. **`BooksTab.jsx`** : Optimisations de performance uniquement (pas de changement visuel)
2. **`booksLiquidGlass.css`** : Optimisations CSS uniquement (avec test visuel)
3. **`useBooksStorage.js`** : Optimisations de chargement/sauvegarde

---

## ✅ Plan d'action recommandé

### Phase 1 : Corrections critiques (1h30)
1. ✅ Supprimer `useEffect` de debug (5 min)
2. ✅ Optimiser le chargement des couvertures avec batching (30 min)
3. ✅ Mémoizer `BookCard` avec `React.memo` (20 min)
4. ✅ Corriger `setCoverUrls` en boucle (15 min)
5. ✅ Pré-calculer `progressPercent` dans `useMemo` (15 min)
6. ✅ Conditionner les `console.log` (5 min)

### Phase 2 : Optimisations moyennes (1h)
7. ✅ Optimiser la chaîne de `useMemo` (25 min)
8. ✅ Réduire `backdrop-filter` et ajouter `will-change` (20 min) - **UNIQUEMENT dans `booksLiquidGlass.css`, PAS `booksDome.css`**
9. ❌ **EXCLU** : Optimiser `BooksDomeGallery` listeners - **NE PAS MODIFIER**
10. ✅ Corriger les dépendances `useEffect` (15 min)

### Phase 3 : Améliorations optionnelles (1h30)
11. ✅ Debouncer la recherche (10 min)
12. ✅ Ajouter `React.memo` sur autres composants (15 min)
13. ⚠️ Virtualisation (optionnel, 2h) - seulement si > 100 livres

---

## 🎯 Résultat attendu

Après les corrections :
- **Scroll fluide à 60 FPS** même avec 50+ livres
- **Chargement des couvertures non bloquant** (batch de 5-10)
- **Re-renders réduits de 80%** (mémoization)
- **Temps de render initial réduit de 60%** (optimisations useMemo)
- **Lag lors du scroll éliminé** (CSS optimisé, virtualisation optionnelle)
- **Galerie 3D inchangée** : Aucun changement visuel ou comportemental sur `BooksDomeGallery` - La physique, les proportions, l'interactivité et l'esthétique restent identiques

---

## 📝 Notes techniques

### Outils de mesure recommandés
- **React DevTools Profiler** : identifier les composants qui re-render trop souvent
- **Chrome Performance** : enregistrer une session de scroll et analyser les frames
- **Lighthouse** : mesurer les métriques de performance (FCP, LCP, TBT)

### Tests à effectuer
1. Scroll rapide dans les carrousels → doit rester fluide
2. Chargement de 50 livres avec couvertures → pas de freeze
3. Changement de filtre → réponse instantanée (< 100ms)
4. Ajout/modification d'un livre → pas de lag sur les autres cartes

---

## 🔗 Références

- [React Performance Optimization](https://react.dev/learn/render-and-commit)
- [CSS will-change](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change)
- [Virtual Scrolling](https://github.com/bvaughn/react-window)
- [Backdrop Filter Performance](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter#performance_considerations)

