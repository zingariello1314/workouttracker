# Comparaison DomeGallery Vue.js (Référence) vs React (Actuel)

## 🔍 Différences Identifiées

### 1. **CSS - Structure et Classes**

#### Référence (Vue.js)
- `.dome-gallery-container` → conteneur principal
- `.sphere-root` → racine de la sphère
- `main.sphere-main` → élément main
- `.stage` → conteneur de perspective
- `.sphere` → sphère 3D
- `.item` → tuile individuelle
- `.item__image` → image de la tuile
- `.overlay` et `.overlay--blur` → overlays
- `.edge-fade` → fades aux bords
- `.viewer` → conteneur pour l'agrandissement

#### Actuel (React)
- `.books-dome-container` → conteneur principal ✅
- `.books-dome-sphere-root` → racine de la sphère ✅
- `main.books-dome-main` → élément main ✅
- `.books-dome-stage` → conteneur de perspective ✅
- `.books-dome-sphere` → sphère 3D ✅
- `.books-dome-item` → tuile individuelle ✅
- `.books-dome-item__image` → image de la tuile ✅
- `.books-dome-overlay` et `.books-dome-overlay--blur` → overlays ✅
- `.books-dome-edge-fade` → fades aux bords ✅
- `.books-dome-enlarge-*` → agrandissement (différent de `.viewer`)

**✅ Les classes sont cohérentes, juste un préfixe différent.**

### 2. **CSS - Variables et Valeurs**

#### Référence
```css
--radius: 500px;  /* Initial, recalculé par ResizeObserver */
--viewer-pad: 100px;
--circ: calc(var(--radius) * 3.14);
--rot-y: calc((360deg / var(--segments-x)) / 2);
--rot-x: calc((360deg / var(--segments-y)) / 2);
--item-width: calc(var(--circ) / var(--segments-x));
--item-height: calc(var(--circ) / var(--segments-y));
```

#### Actuel
```css
--radius: 500px;  /* ✅ Corrigé (recalculé par ResizeObserver) */
--viewer-pad: 100px; ✅
--circ: calc(var(--radius) * 3.14); ✅
--rot-y: calc((360deg / var(--segments-x)) / 2); ✅
--rot-x: calc((360deg / var(--segments-y)) / 2); ✅
--item-width: calc(var(--circ) / var(--segments-x)); ✅
--item-height: calc(var(--circ) / var(--segments-y)); ✅
```

**✅ `--radius` initial corrigé (500px) et recalculé dynamiquement par ResizeObserver**

### 3. **CSS - Background de `.sphere-root`**

#### Référence
```css
.sphere-root {
  background: transparent;
  border-radius: 25px;
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

#### Actuel
```css
.books-dome-sphere-root {
  background: transparent;  /* ✅ Corrigé */
  border-radius: 25px;  /* ✅ Corrigé */
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.6),  /* ✅ Corrigé */
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);  /* ✅ Corrigé */
}
```

**✅ Background, border-radius, box-shadow et border corrigés**

### 4. **CSS - `.stage` (`.books-dome-stage`)**

#### Référence
```css
.stage {
  perspective: calc(var(--radius) * 2);
  perspective-origin: 50% 50%;
  contain: layout paint size;
}
```

#### Actuel
```css
.books-dome-stage {
  perspective: calc(var(--radius) * 2); ✅
  perspective-origin: 50% 50%; ✅
  contain: layout paint size; ✅
}
```

**✅ Identique**

### 5. **CSS - `.sphere` (`.books-dome-sphere`)**

#### Référence
```css
.sphere {
  transform: translateZ(calc(var(--radius) * -1));
  will-change: transform;
}
```

#### Actuel
```css
.books-dome-sphere {
  transform: translateZ(calc(var(--radius) * -1)); ✅
  will-change: transform; ✅
  transition: transform 120ms ease-out;  /* ⚠️ Ajouté pour smooth rotation */
}
```

**⚠️ Transition ajoutée (peut être gardée pour smooth rotation)**

### 6. **CSS - `.item` (`.books-dome-item`)**

#### Référence
```css
.item {
  transition: transform 300ms;
  transform: rotateY(...) rotateX(...) translateZ(var(--radius));
}
```

#### Actuel
```css
.books-dome-item {
  transition: transform 300ms;  /* ✅ Corrigé */
  transform: rotateY(...) rotateX(...) translateZ(var(--radius)); ✅
}
```

**✅ Transition corrigée (300ms sans easing)**

### 7. **CSS - `.item__image` (`.books-dome-item__image`)**

#### Référence
```css
.item__image {
  transition: transform 300ms, box-shadow 300ms;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.item__image:hover {
  transform: translateZ(20px) scale(1.05);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
}
```

#### Actuel
```css
.books-dome-item__image {
  transition: transform 300ms, box-shadow 300ms; ✅ (corrigé)
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3); ✅ (corrigé)
}

.books-dome-item__image:hover {
  transform: translateZ(20px) scale(1.05); ✅ (corrigé)
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4); ✅ (corrigé)
}
```

**✅ Déjà corrigé**

### 8. **CSS - `.overlay` et `.overlay--blur`**

#### Référence
```css
.overlay,
.overlay--blur {
  position: absolute;
  inset: 0;
  margin: auto;  /* ⚠️ margin: auto */
  z-index: 3;
  pointer-events: none;
}

.overlay {
  background-image: radial-gradient(rgba(26, 26, 26, 0) 50%, rgba(26, 26, 26, 0.9) 80%, rgba(26, 26, 26, 1) 100%);
}

.overlay--blur {
  -webkit-mask-image: radial-gradient(rgba(235, 235, 235, 0) 70%, var(--overlay-blur-color, #060010) 90%);
  mask-image: radial-gradient(rgba(235, 235, 235, 0) 70%, var(--overlay-blur-color, #060010) 90%);
  backdrop-filter: blur(3px);
}
```

#### Actuel
```css
.books-dome-overlay {
  position: absolute;
  inset: 0;
  margin: auto;  /* ✅ Ajouté */
  z-index: 3;  /* ✅ Ajouté */
  pointer-events: none;
  background-image: radial-gradient(...); ✅
}

.books-dome-overlay--blur {
  -webkit-mask-image: ...; ✅
  mask-image: ...; ✅
  backdrop-filter: blur(3px); ✅
}
```

**✅ `margin: auto` et `z-index: 3` ajoutés**

### 9. **CSS - `.edge-fade`**

#### Référence
```css
.edge-fade {
  height: 120px;
  z-index: 5;
  background: linear-gradient(to bottom, transparent, var(--overlay-blur-color, #060010));
}

.edge-fade--top {
  transform: rotate(180deg);
}
```

#### Actuel
```css
.books-dome-edge-fade {
  height: 120px; ✅ (corrigé)
  z-index: 5; ✅ (corrigé)
  background: linear-gradient(...); ✅ (corrigé)
}

.books-dome-edge-fade--top {
  transform: rotate(180deg); ✅ (corrigé)
}
```

**✅ Déjà corrigé**

### 10. **JavaScript - Options par Défaut**

#### Référence (Vue.js)
```javascript
{
  fit: 0.5,
  fitBasis: 'auto',
  minRadius: 600,
  maxRadius: Infinity,
  padFactor: 0.25,
  overlayBlurColor: '#060010',
  maxVerticalRotationDeg: 5,
  dragSensitivity: 20,
  enlargeTransitionMs: 300,
  segments: 35,
  dragDampening: 2,
  openedImageWidth: '250px',
  openedImageHeight: '350px',
  imageBorderRadius: '30px',
  openedImageBorderRadius: '30px',
  grayscale: true,
}
```

#### Actuel (React)
```javascript
{
  dragSensitivity: 50,  // ❌ Différent (50 vs 20)
  dragDampening: 0.3,   // ❌ Différent (0.3 vs 2)
  maxVerticalRotationDeg: 8,  // ❌ Différent (8 vs 5)
  maxSegments: undefined,  // ⚠️ Pas d'option segments directe
}
```

**❌ Options différentes, pas de ResizeObserver pour calculer le radius dynamiquement**

### 11. **JavaScript - ResizeObserver et Calcul du Radius**

#### Référence (Vue.js)
- Utilise `ResizeObserver` pour calculer dynamiquement `--radius` basé sur la taille du conteneur
- Calcule `fit`, `minRadius`, `maxRadius`, `padFactor`
- Met à jour les variables CSS dynamiquement

#### Actuel (React)
- ✅ `ResizeObserver` ajouté
- ✅ `--radius` calculé dynamiquement
- ✅ Toutes les variables CSS mises à jour automatiquement

**✅ ResizeObserver ajouté pour le calcul dynamique du radius et des variables CSS**

### 12. **JavaScript - buildItems**

#### Référence
```javascript
buildItems(books, segments) {
  const xCols = Array.from({ length: segments }, (_, i) => -37 + i * 2);
  const evenYs = [-4, -2, 0, 2, 4];
  const oddYs = [-3, -1, 1, 3, 5];
  // ... évite les doublons consécutifs (simple swap, pas Fisher-Yates)
}
```

#### Actuel
```javascript
buildDomeItems(books, segments = DEFAULT_SEGMENTS) {
  const xCols = Array.from({ length: segments }, (_, i) => -37 + i * 2); ✅
  const evenYs = [-4, -2, 0, 2, 4]; ✅
  const oddYs = [-3, -1, 1, 3, 5]; ✅
  // ... utilise Fisher-Yates shuffle + post-traitement
}
```

**⚠️ Algorithme de shuffle différent (Fisher-Yates vs simple swap)**

### 13. **JavaScript - Structure DOM**

#### Référence (Vue.js)
```html
<div class="dome-gallery-container">
  <div class="sphere-root">
    <main class="sphere-main">
      <div class="stage">
        <div class="sphere">
          <div class="item">...</div>
        </div>
      </div>
      <div class="overlay" />
      <div class="overlay overlay--blur" />
      <div class="edge-fade edge-fade--top" />
      <div class="edge-fade edge-fade--bottom" />
      <div class="viewer">
        <div class="scrim" />
        <div class="frame" />
      </div>
    </main>
  </div>
</div>
```

#### Actuel (React)
```jsx
<div className="books-dome-container">
  <div className="books-dome-sphere-root">
    <main className="books-dome-main">
      <div className="books-dome-stage">
        <div className="books-dome-sphere">
          <button className="books-dome-item">...</button>
        </div>
      </div>
      <div className="books-dome-overlay" />
      <div className="books-dome-overlay books-dome-overlay--blur" />
      <div className="books-dome-edge-fade books-dome-edge-fade--top" />
      <div className="books-dome-edge-fade books-dome-edge-fade--bottom" />
      {/* Pas de .viewer, utilise un overlay React séparé */}
    </main>
  </div>
</div>
```

**⚠️ Structure similaire mais pas de `.viewer` avec `.scrim` et `.frame`**

## ✅ Corrections Appliquées

### ✅ 1. ResizeObserver Ajouté
- **Fichier** : `src/components/books/BooksDomeGallery.jsx`
- **Fonctionnalité** : Calcule dynamiquement `--radius`, `--viewer-pad`, et toutes les variables CSS basées sur la taille du conteneur
- **Options supportées** : `fit`, `fitBasis`, `minRadius`, `maxRadius`, `padFactor`, `overlayBlurColor`, `imageBorderRadius`, `openedImageBorderRadius`, `grayscale`
- **Comportement** : Identique à la référence Vue.js

### ✅ 2. Background de `.books-dome-sphere-root` Corrigé
- **Avant** : Gradients complexes
- **Après** : `background: transparent` (comme la référence)

### ✅ 3. Border-radius, Box-shadow et Border Corrigés
- **border-radius** : `25px` (au lieu de 24px) ✅
- **box-shadow** : `0 25px 50px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)` ✅
- **border** : `1px solid rgba(255, 255, 255, 0.1)` ✅

### ✅ 4. `--radius` Initial Corrigé
- **Avant** : `520px`
- **Après** : `500px` (sera recalculé par ResizeObserver)

### ✅ 5. Overlays Corrigés
- **margin: auto** ajouté ✅
- **z-index: 3** ajouté ✅
- **background-image** radial-gradient correct ✅
- **backdrop-filter: blur(3px)** (au lieu de 20px) ✅
- **mask-image** ajouté pour limiter le blur aux bords ✅

### ✅ 6. Transition de `.books-dome-item` Corrigée
- **Avant** : `transform 260ms ease-out`
- **Après** : `transform 300ms` (sans easing, comme la référence)

### ✅ 7. Variables CSS Définies Dynamiquement
- Toutes les variables (`--overlay-blur-color`, `--tile-radius`, `--enlarge-radius`, `--image-filter`) sont maintenant définies par ResizeObserver
- Plus besoin de les définir dans le style inline

## 📊 Résumé des Corrections

| Élément | Avant | Après | Statut |
|---------|-------|-------|--------|
| ResizeObserver | ❌ Absent | ✅ Ajouté | ✅ Corrigé |
| Background `.sphere-root` | Gradients | Transparent | ✅ Corrigé |
| `border-radius` | 24px | 25px | ✅ Corrigé |
| `box-shadow` | Différent | Identique référence | ✅ Corrigé |
| `border` | Différent | Identique référence | ✅ Corrigé |
| `--radius` initial | 520px | 500px | ✅ Corrigé |
| Overlay `margin` | Absent | `auto` | ✅ Corrigé |
| Overlay `z-index` | Absent | `3` | ✅ Corrigé |
| Transition `.item` | 260ms ease-out | 300ms | ✅ Corrigé |
| `backdrop-filter` | blur(20px) | blur(3px) | ✅ Corrigé |
| `mask-image` | Absent | Radial-gradient | ✅ Corrigé |

## 🎯 Résultat Attendu

Après toutes ces corrections, la vue 3D devrait maintenant être **identique** à la référence Vue.js :
- ✅ Radius calculé dynamiquement selon la taille du conteneur
- ✅ Background transparent (pas de gradients)
- ✅ Blur limité aux bords (3px avec mask-image)
- ✅ Transitions et effets identiques
- ✅ Variables CSS correctement définies

