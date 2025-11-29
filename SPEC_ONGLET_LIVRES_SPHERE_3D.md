## Spécification détaillée – Sphère 3D Livres (version React)

Ce document décrit **uniquement** la vue sphérique 3D des livres intégrée à l’onglet `Livres` en React,
en s’inspirant fidèlement du comportement de la version Vue (DomeGallery + App) et du rendu illustré
par le *screen 1* (globe de couvertures).

Objectifs :

- **Même rendu conceptuel** que la version Vue (dôme de couvertures, rotation drag + inertie, zoom),
- **Intégration propre** avec l’onglet Livres React existant (BooksTab + booksAssetsStorage),
- **Performance maximale** (pas de sur‑calcul, pas de fuite mémoire, taille DOM maîtrisée),
- **API claire** pour le composant `BooksDomeGallery` côté React.

---

## 1. Sources de données – d’où viennent les images ?

### 1.1 Modèle et stockage (côté React)

- Les livres sont gérés par la couche actuelle :
  - `useBooksStorage()` (IndexedDB + localStorage, persistance débouncée),
  - assets de couvertures stockés dans `booksAssetsStorage` (`bookImages`, clé `cover_<bookId>`),
  - chaque `Book` porte au moins :
    - `id: string`,
    - `title: string`,
    - `author?: string`,
    - `genre?: string`,
    - `pages?: number`,
    - `status: 'in-progress' | 'completed' | 'to-read' | 'abandoned' | 'paused'`,
    - `hasCover?: boolean`.

- **Source de données pour la sphère 3D** :
  - on définit un sélecteur logique dans `BooksTab` :
    - `libraryBooks = books.filter(b => b.status === 'in-progress' && b.hasCover)`,
    - c’est l’analogue de `libraryBooks` dans le BookStore Vue (ta “bibliothèque active”).
  - chaque entrée sera enrichie côté 3D avec :
    - `coverUrl` : URL objet (ObjectURL) créé à partir du blob stocké en IndexedDB,
    - **chargé sur demande et mis en cache** dans `BooksDomeGallery` ou dans un petit hook dédié
      (`useBookCoversForDome`).

### 1.2 API de données vue 3D

- On définit un type léger, indépendant du modèle interne :

```ts
type DomeBook = {
  id: string;
  title: string;
  author?: string;
  coverUrl: string;    // URL d’image déjà résolue (pas de blob dans la prop)
};
```

- `BooksTab` prépare un tableau de `DomeBook[]` :
  - récupère les `books` pertinents,
  - résout les assets via `booksAssetsStorage.getBookCover('cover_<id>')`,
  - crée et mémorise des `ObjectURL` (avec logique de cleanup),
  - passe le tableau final à `BooksDomeGallery`.

- **Important** : le composant 3D ne gère **pas** IndexedDB directement, il ne reçoit que des strings
  `coverUrl` déjà prêtes. Toute la logique assets reste centralisée (single‑responsibility).

---

## 2. Transformation livres → items 3D (grille polaire)

On reprend le principe de la version Vue, en l’adaptant en **fonction pure** pour React.

### 2.1 Signature de la fonction

```ts
type DomeItem = {
  x: number;       // angle logique horizontal
  y: number;       // angle logique vertical
  sizeX: number;   // “largeur” angulaire de la tuile
  sizeY: number;   // “hauteur” angulaire de la tuile
  src: string;     // URL de couverture
  alt: string;     // texte alternatif
  bookId: string;  // id du livre
  book: DomeBook;  // référence complète pour onBookOpen
};

function buildDomeItems(books: DomeBook[], segments = 35): DomeItem[];
```

### 2.2 Génération de la grille de coordonnées

- Reprise quasi‑identique de la logique Vue (mais pure et typée) :

```ts
const xCols = Array.from({ length: segments }, (_, i) => -37 + i * 2);
const evenYs = [-4, -2, 0, 2, 4];
const oddYs  = [-3, -1, 1, 3, 5];

const coords = xCols.flatMap((x, c) => {
  const ys = c % 2 === 0 ? evenYs : oddYs;
  return ys.map((y) => ({ x, y, sizeX: 2, sizeY: 2 }));
});
```

- Résultat : une grille de slots `(x, y, sizeX, sizeY)` couvrant un dôme régulier.

### 2.3 Association coordonnée → livre

- Normaliser le tableau de livres :

```ts
const baseItems = books.map((book) => ({
  src: book.coverUrl,
  alt: book.title || book.author || 'Livre',
  book,
}));
```

- Si `baseItems.length === 0` → renvoyer un tableau vide (aucune tuile).
- Sinon :
  - dupliquer le tableau pour remplir toute la grille :

```ts
const needed = coords.length;
const looped = Array.from({ length: needed }, (_, i) => baseItems[i % baseItems.length]);
```

  - appliquer un léger **shuffle local** (optionnel) pour éviter les répétitions consécutives,
    avec un algo O(n) (Fisher–Yates) sur `looped`.

- Retour final :

```ts
return coords.map((coord, index) => {
  const item = looped[index];
  return {
    x: coord.x,
    y: coord.y,
    sizeX: coord.sizeX,
    sizeY: coord.sizeY,
    src: item.src,
    alt: item.alt,
    bookId: item.book.id,
    book: item.book,
  };
});
```

- Cette fonction est :
  - **pure** (aucun side effect),
  - appelée dans un `useMemo` côté `BooksDomeGallery` (dépendance `[books, segments]`),
  - facile à tester unitairement.

### 2.4 Calibrage par rapport à la version Vue

Grâce au code Vue fourni (`DomeGallery.buildItems` et `App.buildItems`) :

- Les **coordonnées** que nous utilisons sont **strictement identiques** :
  - mêmes colonnes X : `-37 + i * 2`,
  - mêmes lignes Y `evenYs` / `oddYs`,
  - mêmes tailles d’items `sizeX = 2`, `sizeY = 2`.
- Le comportement de **répétition des couvertures** est aligné :
  - on boucle les livres (`books[i % books.length]`) pour remplir tous les slots,
  - on conserve la possibilité d’un petit shuffle pour éviter les répétitions immédiates
    (optionnel, mais recommandé).
- La **densité visuelle** (espacement horizontal/vertical) est donc, à segments égaux, la même que
  celle de la sphère Vue.

---

## 3. Composant React `BooksDomeGallery` – structure & CSS

### 3.1 API publique

```tsx
type BooksDomeGalleryProps = {
  books: DomeBook[];                   // déjà filtrés + avec coverUrl
  onBookOpen?: (bookId: string) => void;
  maxSegments?: number;                // pour contraindre le nombre de colonnes
  className?: string;
};
```

- Le composant ne connaît que des `books` simples et un callback `onBookOpen`.
- La sélection dans `BooksTab` se fait par `onBookOpen = (id) => setSelectedBookId(id)`.

### 3.2 DOM principal

- Structure minimale :

```tsx
<div className="books-dome-root">
  <div ref={frameRef} className="books-dome-frame">
    <div ref={viewerRef} className="books-dome-viewer">
      <div ref={sphereRef} className="books-dome-sphere">
        {items.map((item, index) => (
          <button
            key={`${item.bookId}-${index}`}
            className="books-dome-item"
            data-offset-x={item.x}
            data-offset-y={item.y}
            data-size-x={item.sizeX}
            data-size-y={item.sizeY}
            type="button"
            onClick={() => handleItemClick(item)}
          >
            <div className="books-dome-item__image">
              <img src={item.src} alt={item.alt} loading="lazy" />
            </div>
          </button>
        ))}
      </div>
    </div>
  </div>
  {/* Optionnel : overlay de zoom, scrim, etc. */}
</div>
```

- Les classes CSS sont inspirées de la version Vue, mais adaptées au thème actuel (fond sombre,
  bords arrondis, etc.).

### 3.3 Projection 3D via CSS

- Utilisation de variables CSS pour le rayon et les offsets :

```css
.books-dome-root {
  --radius: 260px;
  --tile-radius: 8px;
  perspective: 1200px;
}

.books-dome-viewer {
  transform-style: preserve-3d;
  width: 100%;
  height: 320px;
  position: relative;
}

.books-dome-sphere {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
  transform: translateZ(calc(var(--radius) * -1)) rotateX(0deg) rotateY(0deg);
  transition: transform 120ms ease-out;
}

.books-dome-item {
  position: absolute;
  transform-style: preserve-3d;
  /* les transforms dynamiques sont posées en inline-style ou via CSS custom properties */
}
```

- La conversion `(x, y, sizeX, sizeY)` → transform CSS peut se faire :
  - soit via JS (style inline : `transform: rotateY(xDeg) rotateX(yDeg) translateZ(radius)`),
  - soit via variables CSS (`--offset-x`, `--offset-y`) et une règle CSS unique.
- Pour la maîtrise fine des perfs, on privilégie **le calcul en JS dans `useMemo`**, une seule fois
  par item, plutôt que des `calc()` complexes à chaque frame.

### 3.4 Alignement avec le CSS historique (`dome-gallery-simple.css`)

Le CSS Vue existant définit déjà une géométrie très précise :

- Variables :
  - `--segments-x`, `--segments-y` → nombre de segments horizontaux / verticaux,
  - `--rot-y`, `--rot-x` → demi‑pas d’angle par segment,
  - `--item-width`, `--item-height` → largeur/hauteur d’une tuile calculées à partir de la circonférence.
- Positionnement d’une tuile :

```css
.item {
  transform: rotateY(calc(var(--rot-y) * (var(--offset-x) + ((var(--item-size-x) - 1) / 2)) + var(--rot-y-delta, 0deg)))
             rotateX(calc(var(--rot-x) * (var(--offset-y) - ((var(--item-size-y) - 1) / 2)) + var(--rot-x-delta, 0deg)))
             translateZ(var(--radius));
}
```

Pour coller exactement au rendu attendu, nous avons deux options équivalentes :

1. **Option A – Respect total du CSS existant**  
   - `BooksDomeGallery` pose directement `style={{ '--offset-x': x, '--offset-y': y, '--item-size-x': sizeX, '--item-size-y': sizeY }}`  
   - la sphère utilise les mêmes classes `.sphere-root`, `.stage`, `.sphere`, `.item`, `.item__image`  
   - on importe quasiment tel quel `dome-gallery-simple.css` en l’isolant dans le namespace React.

2. **Option B – Transforms JS équivalents**  
   - on recalcule en JS les mêmes angles (`rotateY`, `rotateX`) à partir de `(x, y, sizeX, sizeY, segments)`  
   - et on applique `style={{ transform: \`rotateY(${...}deg) rotateX(${...}deg) translateZ(${radius}px)\` }}`.  

Pour minimiser les écarts visuels et profiter du travail déjà fait, le plan recommande **l’Option A** :
on réutilise la géométrie CSS de `dome-gallery-simple.css` en la branchant sur nos données React.

---

## 4. Interaction – drag, rotation, inertie

On combine les enseignements de **deux implémentations Vue** :

1. `addDragInteraction` dans `App.js` (drag horizontal simplifié, inertie subtile).  
2. `DomeGallery.setupDragHandlers` + `startInertia` (drag complet X/Y avec paramètres avancés).

L’objectif côté React est de :

- garder la **sobriété** (un seul axe de drag par défaut, comme dans ton intégration App actuelle),
- mais disposer d’une **API d’options** qui permet d’activer plus tard la variation verticale (X)
et de régler la sensation d’inertie comme dans `DomeGallery.startInertia`.

### 4.1 État interne

Dans `BooksDomeGallery` :

```ts
const [rotationY, setRotationY] = useState(0);
const rotationRef = useRef(0);
const draggingRef = useRef(false);
const startXRef = useRef(0);
const startRotationYRef = useRef(0);
const inertiaVelocityRef = useRef(0);
const inertiaFrameRef = useRef<number | null>(null);
```

- `rotationY` → utilisé pour le `transform` de la sphère.
- `rotationRef` → source de vérité pour les frames d’inertie.

### 4.2 Handlers de drag

- `onPointerDown` (mousedown / touchstart unifiés via Pointer Events si possible) :
  - mémorise `startXRef.current = clientX`,
  - `startRotationYRef.current = rotationRef.current`,
  - `draggingRef.current = true`,
  - annule toute inertie en cours (`cancelAnimationFrame`).

- `onPointerMove` :
  - si `draggingRef.current` est false → ignore,
  - calcule `deltaX = clientX - startXRef.current`,
  - `newRotationY = startRotationYRef.current + deltaX * sensitivity` (0.3),
  - met à jour `rotationRef` + `setRotationY`,
  - mémorise le couple (deltaX, deltaTime) pour la vélocité.

- `onPointerUp/Cancel` :
  - `draggingRef.current = false`,
  - calcule `inertiaVelocityRef.current` à partir de la dernière vitesse moyenne,
  - lance une boucle `requestAnimationFrame(applyInertia)` si la vitesse dépasse un seuil.

### 4.3 Boucle d’inertie

```ts
const applyInertia = (timestamp) => {
  const v = inertiaVelocityRef.current;
  if (Math.abs(v) < 0.01) {
    inertiaFrameRef.current = null;
    return;
  }

  const next = rotationRef.current + v;
  rotationRef.current = next;
  setRotationY(next);

  inertiaVelocityRef.current *= 0.95; // friction
  inertiaFrameRef.current = requestAnimationFrame(applyInertia);
};
```

- transform appliqué :

```ts
const sphereStyle = {
  transform: `translateZ(calc(var(--radius) * -1)) rotateX(0deg) rotateY(${rotationY}deg)`,
};
```

- Cleanup dans `useEffect` `return () => cancelAnimationFrame(...)`.

### 4.4 Paramétrage inspiré de `DomeGallery.startInertia`

Les options de `DomeGallery` nous donnent un bon point de départ :

- `dragSensitivity` : plus la valeur est grande, moins la sphère tourne pour un même déplacement.  
- `dragDampening` : contrôle la durée de l’inertie (`frictionMul`, `stopThreshold`, `maxFrames`).  
- `maxVerticalRotationDeg` : limite l’inclinaison verticale.

Côté React, on expose des props optionnelles :

```ts
type BooksDomeGalleryProps = {
  // ...
  dragSensitivity?: number;        // défaut: 50 (comme App.initDomeGallery)
  dragDampening?: number;          // défaut: 0.3
  maxVerticalRotationDeg?: number; // défaut: 8
};
```

- Par défaut, on reproduit exactement les réglages choisis dans `App.initDomeGallery` :
  - `dragSensitivity: 50`,
  - `dragDampening: 0.3`,
  - `maxVerticalRotationDeg: 8`.
- L’algorithme d’inertie peut rester **simplifié** (un seul axe Y dans un premier temps), mais ces
paramètres garantissent une sensation **proche de la version Vue** (traînée douce, arrêt naturel).

---

## 5. Zoom / agrandissement d’une tuile

La version Vue a un système très avancé (overlay, refDiv, calcul des rectangles, etc.).
En React, on vise :

- **même sensation** : agrandissement fluide de la tuile vers le centre,
- **implémentation maîtrisée** : pas de complexité inutile pour la v1.

### 5.1 Design minimal

- Lorsque l’on clique sur une tuile :
  - on déclenche **le callback `onBookOpen(bookId)`** immédiatement,
  - on affiche un **overlay léger** dans `BooksDomeGallery` :
    - fond assombri (scrim),
    - image de couverture agrandie (centrée),
    - texte titre / auteur sous l’image,
    - fermeture par clic sur le scrim ou touche Échap.

- L’animation peut être un simple `scale + fade` géré par CSS :
  - `transform: scale(0.8)` → `scale(1)`,
  - `opacity: 0` → `opacity: 1`.

### 5.2 Extension ultérieure

- Si on veut **copier à l’identique** la transition de la version Vue (depuis la tuile exacte) :
  - il faudra mesurer la tuile cliquée (via `getBoundingClientRect`) et appliquer une transformation
    inverse pour partir de cette position,
  - créer un “overlay de départ” positionné exactement sur la tuile,
  - animer vers le centre puis, à la fermeture, rejouer l’animation inverse.

- Cette complexité peut être ajoutée en v2, mais la v1 décrite ici reste :
  - très fluide,
  - peu coûteuse,
  - plus simple à maintenir.

---

## 6. Intégration dans l’onglet Livres (BooksTab)

### 6.1 Wiring côté BooksTab

- Préparation des `DomeBook[]` :

```ts
const domeBooks = useMemo(
  () =>
    books
      .filter((b) => b.status === 'in-progress' && b.hasCover)
      .map((b) => ({
        id: b.id,
        title: b.title || t('books.detail.noTitle'),
        author: b.author,
        coverUrl: coverUrls[b.id], // déjà résolu grâce à booksAssetsStorage
      }))
      .filter((b) => !!b.coverUrl),
  [books, coverUrls, t]
);
```

- Rendu conditionnel dans `BooksTab` :

```tsx
{show3D && (
  <Suspense fallback={...}>
    <BooksDomeGallery
      books={domeBooks}
      onBookOpen={(bookId) => setSelectedBookId(bookId)}
    />
  </Suspense>
)}
```

- Le bouton “Activer la vue 3D” ne fait que basculer `show3D`, sans effet de bord.

### 6.2 Stratégie de performance

- **Lazy‑load du composant** : `React.lazy(() => import('../books/BooksDomeGallery'))`.
- **Limitation du nombre d’items** :
  - côté `buildDomeItems`, on peut plafonner le nombre de segments (ex. 35),
  - on garde ainsi un nombre fixe d’éléments DOM (~ `segments * ~10`).
- **Images** :
  - on ne charge que les couvertures nécessaires, via `getBookCover` au moment d’afficher la sphère,
  - les `ObjectURL` sont nettoyées (`URL.revokeObjectURL`) quand on change de livres ou qu’on démonte
    le composant.

---

## 7. Plan d’implémentation béton (étapes concrètes)

1. **Créer ce fichier de spécification** (fait) et le garder aligné avec le code au fur et à mesure.
2. **Extraire la logique de couverts pour la sphère** :
   - soit depuis `BooksTab` (utilisant déjà `booksAssetsStorage`),
   - soit via un petit hook `useDomeCovers(books)` dédié.
3. **Implémenter `buildDomeItems(books, segments)`** :
   - reprendre la grille (xCols, evenYs, oddYs),
   - remplir en boucle avec les livres, shuffle léger,
   - tests unitaires pour garantir la stabilité.
4. **Créer `BooksDomeGallery.jsx` (version finale)** :
   - structure DOM + CSS 3D de la sphère,
   - réutilisation de la géométrie CSS de `dome-gallery-simple.css` (variables `--offset-x`, `--offset-y`, etc.),
   - utilisation de `buildDomeItems` + `useMemo`,
   - gestion du drag + inertie avec `requestAnimationFrame`, paramétrée par `dragSensitivity` / `dragDampening`.
5. **Ajouter l’overlay de zoom simple** :
   - overlay dans `BooksDomeGallery`,
   - `onBookOpen` + affichage de l’image agrandie + infos,
   - fermeture par clic / Échap.
6. **Brancher dans `BooksTab`** :
   - remplacer la v1 actuelle très légère par cette version complète,
   - garder le bouton `show3D` + fallback texte,
   - s’assurer qu’aucun appel IndexedDB ne se fait quand la vue 3D est désactivée.
7. **Tests & perfs** :
   - vérifier fluidité pour ~200–300 items,
   - vérifier comportement sur mobiles / petites résolutions,
   - surveiller la libération des `ObjectURL` (pas de fuite mémoire).

Avec ce plan, on **reproduit fidèlement le comportement de la sphère Vue** (grille polaire, drag,
inertie, zoom, clic qui ouvre le livre) tout en l’intégrant proprement dans l’architecture React
actuelle, en respectant strictement les contraintes de performance et de propreté de code.

Des ajustements fins (rayon, segments, padding, border‑radius) pourront ensuite être calibrés
en comparant visuellement la version React à la version Vue, en partant des valeurs déjà présentes
dans `DomeGallery` et `App.initDomeGallery` (`fit`, `minRadius`, `maxRadius`, `padFactor`,
`imageBorderRadius`, etc.), sans remettre en cause l’architecture décrite ici.

---

## 8. Suivi de mise en œuvre concrète (v1 React)

Cette section suit l’état réel de l’implémentation dans le code React.

### 8.1 `BooksDomeGallery.jsx` – v1 intégrée

- Fichier : `src/components/books/BooksDomeGallery.jsx`.
- État actuel :
  - `buildDomeItems` est implémentée comme décrit en section 2 :
    - mêmes `xCols`, `evenYs` / `oddYs`, `sizeX/sizeY`,
    - remplissage des slots en bouclant sur les couvertures disponibles,
    - petit shuffle pour éviter les doublons consécutifs.
  - Le DOM utilise une structure très proche du template Vue :
    - conteneurs `books-dome-container`, `books-dome-sphere-root`, `books-dome-main`,
      `books-dome-stage`, `books-dome-sphere`,
    - un bouton `.books-dome-item` par *DomeItem* avec un bloc `.books-dome-item__image` et un `<img>`.
  - Le `drag` horizontal + inertie est en place :
    - gestion unifiée souris/touch,
    - mise à jour de `rotationY` + transform CSS sur `.books-dome-sphere`,
    - inertie douce via `requestAnimationFrame`, avec paramètres calés sur `dragSensitivity` / `dragDampening`.
  - `onBookOpen` est appelée avec `bookId` sur clic d’une tuile, ce qui permet à `BooksTab` de
    sélectionner le livre correspondant (`setSelectedBookId`).

### 8.2 CSS `booksDome.css` – géométrie alignée

- Fichier : `src/components/books/booksDome.css`.
- Points clés :
  - réutilise la même logique que `dome-gallery-simple.css` :
    - variables `--segments-x`, `--segments-y`, `--rot-x`, `--rot-y`, `--item-width`, `--item-height`,
    - positionnement des tuiles avec `rotateY(...) rotateX(...) translateZ(var(--radius))`,
    - rayon, perspective et edge-fades pour retrouver la sensation de sphère.
  - style adapté au thème actuel (fonds très sombres, bordure violette discrète, ombres profondes).

### 8.3 Intégration dans `BooksTab` – v1

- `BooksTab` :
  - prépare un tableau `domeBooks` :
    - filtre `books` sur `status === 'in-progress' && hasCover && coverUrls[id]`,
    - ne garde que les livres avec une couverture réellement affichable,
    - passe `domeBooks` à `BooksDomeGallery` via `books={domeBooks}`.
  - `onBookOpen` met simplement à jour `selectedBookId`, ce qui ouvre le panneau de détail.
  - la vue 3D est activable/désactivable via le bouton `show3D` dans l’en‑tête de l’onglet.

### 8.4 Reste à faire pour coller à 100 % à la spec

- L’**overlay de zoom** (section 5) est en place dans `BooksDomeGallery` :
  - scrim plein écran au-dessus de la sphère,
  - image agrandie + titre/auteur,
  - fermeture par clic sur le scrim ou par la touche Échap.
- Les **props de réglage** sont exposées et utilisées :
  - `dragSensitivity`, `dragDampening`, `maxVerticalRotationDeg` sont passées depuis `BooksTab` avec
    des valeurs calées sur la version Vue.
- La logique de rotation gère désormais X et Y :
  - drag vertical limité à `±maxVerticalRotationDeg`,
  - drag horizontal avec inertie paramétrable.
- Reste principalement à écrire **quelques tests unitaires** :
  - sur `buildDomeItems` (structure de la grille, bouclage des livres),
  - sur la logique de drag/inertie (au moins vérifier que les bornes sont respectées).

En résumé, la v1 React de la sphère 3D est **déjà branchée et fonctionnelle** (drag, inertie,
ouverture du livre). Les prochaines étapes pour atteindre le rendu “100/100” décrit dans ce document
sont surtout l’overlay de zoom et le raffinement des paramètres d’interaction.


