# 🌐 Guide Complet de Reproduction du Globe 3D - Onglet Livres

## 📋 Vue d'ensemble

Ce document répertorie **TOUS** les fichiers, configurations et paramètres nécessaires pour reproduire exactement le globe 3D (sphère de couvertures de livres) tel qu'il apparaît dans le rendu désiré.

---

## 📁 Structure des fichiers

### 1. Fichier JavaScript principal - `DomeGallery.js`

**Chemin :** `src/js/components/DomeGallery.js`

**Rôle :** Classe principale qui gère toute la logique 3D, les interactions, le zoom, l'inertie.

**Contenu complet :** Voir section détaillée ci-dessous.

---

### 2. Fichier CSS principal - `dome-gallery-simple.css`

**Chemin :** `src/css/components/dome-gallery-simple.css`

**Rôle :** Styles CSS complets pour la sphère 3D, les tuiles, les overlays, les transitions.

**Contenu complet :** Voir section détaillée ci-dessous.

---

### 3. Intégration dans App.js

**Chemin :** `src/js/components/App.js`

**Méthodes clés :**
- `initDomeGallery()` - Initialisation avec options
- `buildItems(books, segments)` - Construction de la grille de tuiles
- `initDomeGalleryWithRefs(...)` - Initialisation avec refs DOM
- `addDragInteraction(mainRef, sphereRef)` - Gestion du drag horizontal

---

### 4. Template Vue dans main.js

**Chemin :** `src/js/main.js`

**Section template :** Lignes 432-481 (structure HTML de la sphère)

---

## 🔧 Configuration et paramètres

### Options par défaut de DomeGallery

```javascript
{
  fit: 0.5,                    // Facteur de taille (0.5 = 50% de la base)
  fitBasis: 'auto',            // Base de calcul : 'auto', 'min', 'max', 'width', 'height'
  minRadius: 600,              // Rayon minimum en pixels
  maxRadius: Infinity,         // Rayon maximum (pas de limite)
  padFactor: 0.25,             // Facteur de padding pour le viewer
  overlayBlurColor: '#060010', // Couleur du blur d'overlay
  maxVerticalRotationDeg: 5,   // Rotation verticale max (désactivée dans App)
  dragSensitivity: 20,          // Sensibilité du drag (plus élevé = moins sensible)
  enlargeTransitionMs: 300,    // Durée de transition du zoom
  segments: 35,                // Nombre de segments horizontaux
  dragDampening: 2,            // Amortissement de l'inertie
  openedImageWidth: '250px',   // Largeur de l'image agrandie
  openedImageHeight: '350px',  // Hauteur de l'image agrandie
  imageBorderRadius: '30px',   // Border radius des tuiles
  openedImageBorderRadius: '30px', // Border radius de l'image agrandie
  grayscale: true              // Filtre grayscale sur les images
}
```

### Options override dans App.initDomeGallery()

```javascript
{
  fit: 0.6,                    // ⚠️ CHANGÉ : 0.6 au lieu de 0.5
  fitBasis: 'auto',
  minRadius: 400,              // ⚠️ CHANGÉ : 400 au lieu de 600
  maxRadius: 800,              // ⚠️ CHANGÉ : 800 au lieu de Infinity
  padFactor: 0.2,              // ⚠️ CHANGÉ : 0.2 au lieu de 0.25
  overlayBlurColor: '#000000', // ⚠️ CHANGÉ : noir au lieu de #060010
  maxVerticalRotationDeg: 8,   // ⚠️ CHANGÉ : 8 au lieu de 5
  dragSensitivity: 50,         // ⚠️ CHANGÉ : 50 au lieu de 20 (moins sensible)
  enlargeTransitionMs: 400,    // ⚠️ CHANGÉ : 400ms au lieu de 300ms
  segments: 30,                // ⚠️ CHANGÉ : 30 au lieu de 35
  dragDampening: 0.3,          // ⚠️ CHANGÉ : 0.3 au lieu de 2 (plus d'inertie)
  openedImageWidth: '300px',   // ⚠️ CHANGÉ : 300px au lieu de 250px
  openedImageHeight: '450px',  // ⚠️ CHANGÉ : 450px au lieu de 350px
  imageBorderRadius: '12px',   // ⚠️ CHANGÉ : 12px au lieu de 30px
  openedImageBorderRadius: '12px', // ⚠️ CHANGÉ : 12px au lieu de 30px
  grayscale: false             // ⚠️ CHANGÉ : false au lieu de true
}
```

### Paramètres de buildItems()

```javascript
// Dans App.buildItems() et DomeGallery.buildItems()
const segments = 35;  // Nombre de colonnes horizontales
const xCols = Array.from({ length: segments }, (_, i) => -37 + i * 2);
// Résultat : [-37, -35, -33, ..., 31, 33] (35 valeurs)

const evenYs = [-4, -2, 0, 2, 4];  // Positions Y pour colonnes paires
const oddYs = [-3, -1, 1, 3, 5];   // Positions Y pour colonnes impaires

// Chaque tuile a :
sizeX: 2
sizeY: 2
```

### Paramètres de drag dans App.addDragInteraction()

```javascript
const sensitivity = 0.3;        // Sensibilité du drag (rotation Y)
const friction = 0.92;          // Friction de l'inertie
const inertiaVelocityFactor = 0.05; // Facteur d'amortissement initial
const stopThreshold = 0.02;     // Seuil d'arrêt de l'inertie
const frameRate = 16;           // 60fps (16ms par frame)
```

---

## 📄 Code JavaScript complet - DomeGallery.js

```javascript
// Composant DomeGallery adapté pour Vue.js
// Basé sur le code React original mais converti pour Vue 3
class DomeGallery {
  constructor(options = {}) {
    this.options = {
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
      ...options
    };

    // Refs pour les éléments DOM
    this.rootRef = Vue.ref(null);
    this.mainRef = Vue.ref(null);
    this.sphereRef = Vue.ref(null);
    this.frameRef = Vue.ref(null);
    this.viewerRef = Vue.ref(null);
    this.scrimRef = Vue.ref(null);
    this.focusedElRef = Vue.ref(null);
    this.originalTilePositionRef = Vue.ref(null);

    // État de rotation et drag
    this.rotationRef = Vue.ref({ x: 0, y: 0 });
    this.startRotRef = Vue.ref({ x: 0, y: 0 });
    this.startPosRef = Vue.ref(null);
    this.draggingRef = Vue.ref(false);
    this.movedRef = Vue.ref(false);
    this.inertiaRAF = Vue.ref(null);
    this.openingRef = Vue.ref(false);
    this.openStartedAtRef = Vue.ref(0);
    this.lastDragEndAt = Vue.ref(0);
    this.scrollLockedRef = Vue.ref(false);
    this.lockedRadiusRef = Vue.ref(null);

    // Données des livres
    this.books = Vue.ref([]);
    this.items = Vue.computed(() => this.buildItems(this.books.value, this.options.segments));

    // Méthodes liées
    this.applyTransform = this.applyTransform.bind(this);
    this.lockScroll = this.lockScroll.bind(this);
    this.unlockScroll = this.unlockScroll.bind(this);
    this.stopInertia = this.stopInertia.bind(this);
    this.startInertia = this.startInertia.bind(this);
    this.openItemFromElement = this.openItemFromElement.bind(this);
    this.onTileClick = this.onTileClick.bind(this);
    this.onTilePointerUp = this.onTilePointerUp.bind(this);
    this.onTileTouchEnd = this.onTileTouchEnd.bind(this);
  }

  // Utilitaires mathématiques
  clamp(v, min, max) {
    return Math.min(Math.max(v, min), max);
  }

  normalizeAngle(d) {
    return ((d % 360) + 360) % 360;
  }

  wrapAngleSigned(deg) {
    const a = (((deg + 180) % 360) + 360) % 360;
    return a - 180;
  }

  getDataNumber(el, name, fallback) {
    const attr = el.dataset[name] ?? el.getAttribute(`data-${name}`);
    const n = attr == null ? NaN : parseFloat(attr);
    return Number.isFinite(n) ? n : fallback;
  }

  // Construction des éléments sur la sphère
  buildItems(books, segments) {
    const xCols = Array.from({ length: segments }, (_, i) => -37 + i * 2);
    const evenYs = [-4, -2, 0, 2, 4];
    const oddYs = [-3, -1, 1, 3, 5];

    const coords = xCols.flatMap((x, c) => {
      const ys = c % 2 === 0 ? evenYs : oddYs;
      return ys.map(y => ({ x, y, sizeX: 2, sizeY: 2 }));
    });

    const totalSlots = coords.length;
    if (books.length === 0) {
      return coords.map(c => ({ ...c, src: '', alt: '', book: null }));
    }

    const normalizedBooks = books.map(book => ({
      src: book.coverUrl || '/default-cover.jpg',
      alt: book.title || '',
      book: book
    }));

    const usedBooks = Array.from({ length: totalSlots }, (_, i) => 
      normalizedBooks[i % normalizedBooks.length]
    );

    // Éviter les doublons consécutifs
    for (let i = 1; i < usedBooks.length; i++) {
      if (usedBooks[i].src === usedBooks[i - 1].src) {
        for (let j = i + 1; j < usedBooks.length; j++) {
          if (usedBooks[j].src !== usedBooks[i].src) {
            const tmp = usedBooks[i];
            usedBooks[i] = usedBooks[j];
            usedBooks[j] = tmp;
            break;
          }
        }
      }
    }

    return coords.map((c, i) => ({
      ...c,
      src: usedBooks[i].src,
      alt: usedBooks[i].alt,
      book: usedBooks[i].book
    }));
  }

  computeItemBaseRotation(offsetX, offsetY, sizeX, sizeY, segments) {
    const unit = 360 / segments / 2;
    const rotateY = unit * (offsetX + (sizeX - 1) / 2);
    const rotateX = unit * (offsetY - (sizeY - 1) / 2);
    return { rotateX, rotateY };
  }

  // Application des transformations 3D
  applyTransform(xDeg, yDeg) {
    const el = this.sphereRef.value;
    if (el) {
      el.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${xDeg}deg) rotateY(${yDeg}deg)`;
    }
  }

  // Gestion du scroll
  lockScroll() {
    if (this.scrollLockedRef.value) return;
    this.scrollLockedRef.value = true;
    document.body.classList.add('dg-scroll-lock');
  }

  unlockScroll() {
    if (!this.scrollLockedRef.value) return;
    if (this.rootRef.value?.getAttribute('data-enlarging') === 'true') return;
    this.scrollLockedRef.value = false;
    document.body.classList.remove('dg-scroll-lock');
  }

  // Gestion de l'inertie
  stopInertia() {
    if (this.inertiaRAF.value) {
      cancelAnimationFrame(this.inertiaRAF.value);
      this.inertiaRAF.value = null;
    }
  }

  startInertia(vx, vy) {
    const MAX_V = 1.4;
    let vX = this.clamp(vx, -MAX_V, MAX_V) * 80;
    let vY = this.clamp(vy, -MAX_V, MAX_V) * 80;
    let frames = 0;
    const d = this.clamp(this.options.dragDampening ?? 0.6, 0, 1);
    const frictionMul = 0.94 + 0.055 * d;
    const stopThreshold = 0.015 - 0.01 * d;
    const maxFrames = Math.round(90 + 270 * d);

    const step = () => {
      vX *= frictionMul;
      vY *= frictionMul;
      if (Math.abs(vX) < stopThreshold && Math.abs(vY) < stopThreshold) {
        this.inertiaRAF.value = null;
        return;
      }
      if (++frames > maxFrames) {
        this.inertiaRAF.value = null;
        return;
      }
      const nextX = this.clamp(
        this.rotationRef.value.x - vY / 200, 
        -this.options.maxVerticalRotationDeg, 
        this.options.maxVerticalRotationDeg
      );
      const nextY = this.wrapAngleSigned(this.rotationRef.value.y + vX / 200);
      this.rotationRef.value = { x: nextX, y: nextY };
      this.applyTransform(nextX, nextY);
      this.inertiaRAF.value = requestAnimationFrame(step);
    };

    this.stopInertia();
    this.inertiaRAF.value = requestAnimationFrame(step);
  }

  // Gestion des événements de drag
  setupDragHandlers() {
    const mainEl = this.mainRef.value;
    if (!mainEl) return;

    let startX, startY, isDragging = false;

    const handleStart = (e) => {
      if (this.focusedElRef.value) return;
      this.stopInertia();
      isDragging = true;
      this.draggingRef.value = true;
      this.movedRef.value = false;
      this.startRotRef.value = { ...this.rotationRef.value };
      startX = e.clientX || e.touches[0].clientX;
      startY = e.clientY || e.touches[0].clientY;
      this.startPosRef.value = { x: startX, y: startY };
    };

    const handleMove = (e) => {
      if (this.focusedElRef.value || !isDragging || !this.startPosRef.value) return;
      
      const currentX = e.clientX || e.touches[0].clientX;
      const currentY = e.clientY || e.touches[0].clientY;
      const dxTotal = currentX - this.startPosRef.value.x;
      const dyTotal = currentY - this.startPosRef.value.y;

      if (!this.movedRef.value) {
        const dist2 = dxTotal * dxTotal + dyTotal * dyTotal;
        if (dist2 > 16) this.movedRef.value = true;
      }

      const nextX = this.clamp(
        this.startRotRef.value.x - dyTotal / this.options.dragSensitivity,
        -this.options.maxVerticalRotationDeg,
        this.options.maxVerticalRotationDeg
      );
      const nextY = this.wrapAngleSigned(this.startRotRef.value.y + dxTotal / this.options.dragSensitivity);
      
      if (this.rotationRef.value.x !== nextX || this.rotationRef.value.y !== nextY) {
        this.rotationRef.value = { x: nextX, y: nextY };
        this.applyTransform(nextX, nextY);
      }
    };

    const handleEnd = (e) => {
      if (!isDragging) return;
      isDragging = false;
      this.draggingRef.value = false;
      
      if (this.movedRef.value) {
        this.lastDragEndAt.value = performance.now();
        // Calculer la vélocité pour l'inertie
        const deltaTime = 16; // Approximation
        const vx = (e.clientX - startX) / deltaTime / this.options.dragSensitivity;
        const vy = (e.clientY - startY) / deltaTime / this.options.dragSensitivity;
        
        if (Math.abs(vx) > 0.005 || Math.abs(vy) > 0.005) {
          this.startInertia(vx, vy);
        }
      }
      this.movedRef.value = false;
    };

    // Événements souris
    mainEl.addEventListener('mousedown', handleStart);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);

    // Événements tactiles
    mainEl.addEventListener('touchstart', handleStart, { passive: true });
    mainEl.addEventListener('touchmove', handleMove, { passive: true });
    mainEl.addEventListener('touchend', handleEnd, { passive: true });

    return () => {
      mainEl.removeEventListener('mousedown', handleStart);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      mainEl.removeEventListener('touchstart', handleStart);
      mainEl.removeEventListener('touchmove', handleMove);
      mainEl.removeEventListener('touchend', handleEnd);
    };
  }

  // Ouverture d'un élément
  openItemFromElement(el) {
    if (this.openingRef.value) return;
    this.openingRef.value = true;
    this.openStartedAtRef.value = performance.now();
    this.lockScroll();

    const parent = el.parentElement;
    this.focusedElRef.value = el;
    el.setAttribute('data-focused', 'true');

    const offsetX = this.getDataNumber(parent, 'offsetX', 0);
    const offsetY = this.getDataNumber(parent, 'offsetY', 0);
    const sizeX = this.getDataNumber(parent, 'sizeX', 2);
    const sizeY = this.getDataNumber(parent, 'sizeY', 2);

    const parentRot = this.computeItemBaseRotation(offsetX, offsetY, sizeX, sizeY, this.options.segments);
    const parentY = this.normalizeAngle(parentRot.rotateY);
    const globalY = this.normalizeAngle(this.rotationRef.value.y);
    let rotY = -(parentY + globalY) % 360;
    if (rotY < -180) rotY += 360;
    const rotX = -parentRot.rotateX - this.rotationRef.value.x;

    parent.style.setProperty('--rot-y-delta', `${rotY}deg`);
    parent.style.setProperty('--rot-x-delta', `${rotX}deg`);

    const refDiv = document.createElement('div');
    refDiv.className = 'item__image item__image--reference';
    refDiv.style.opacity = '0';
    refDiv.style.transform = `rotateX(${-parentRot.rotateX}deg) rotateY(${-parentRot.rotateY}deg)`;
    parent.appendChild(refDiv);

    const tileR = refDiv.getBoundingClientRect();
    const mainR = this.mainRef.value.getBoundingClientRect();
    const frameR = this.frameRef.value.getBoundingClientRect();

    this.originalTilePositionRef.value = {
      left: tileR.left,
      top: tileR.top,
      width: tileR.width,
      height: tileR.height
    };

    el.style.visibility = 'hidden';
    el.style.zIndex = 0;

    const overlay = document.createElement('div');
    overlay.className = 'enlarge';
    overlay.style.position = 'absolute';
    overlay.style.left = frameR.left - mainR.left + 'px';
    overlay.style.top = frameR.top - mainR.top + 'px';
    overlay.style.width = frameR.width + 'px';
    overlay.style.height = frameR.height + 'px';
    overlay.style.opacity = '0';
    overlay.style.zIndex = '30';
    overlay.style.willChange = 'transform, opacity';
    overlay.style.transformOrigin = 'top left';
    overlay.style.transition = `transform ${this.options.enlargeTransitionMs}ms ease, opacity ${this.options.enlargeTransitionMs}ms ease`;

    const rawSrc = parent.dataset.src || el.querySelector('img')?.src || '';
    const img = document.createElement('img');
    img.src = rawSrc;
    overlay.appendChild(img);
    this.viewerRef.value.appendChild(overlay);

    const tx0 = tileR.left - frameR.left;
    const ty0 = tileR.top - frameR.top;
    const sx0 = tileR.width / frameR.width;
    const sy0 = tileR.height / frameR.height;

    overlay.style.transform = `translate(${tx0}px, ${ty0}px) scale(${sx0}, ${sy0})`;

    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      overlay.style.transform = 'translate(0px, 0px) scale(1,1)';
      this.rootRef.value?.setAttribute('data-enlarging', 'true');
    });

    // Émettre l'événement d'ouverture du livre
    const book = parent.dataset.book ? JSON.parse(parent.dataset.book) : null;
    if (book && this.onBookOpen) {
      this.onBookOpen(book);
    }
  }

  // Gestionnaires d'événements
  onTileClick(e) {
    if (this.draggingRef.value) return;
    if (performance.now() - this.lastDragEndAt.value < 80) return;
    if (this.openingRef.value) return;
    this.openItemFromElement(e.currentTarget);
  }

  onTilePointerUp(e) {
    if (e.pointerType !== 'touch') return;
    if (this.draggingRef.value) return;
    if (performance.now() - this.lastDragEndAt.value < 80) return;
    if (this.openingRef.value) return;
    this.openItemFromElement(e.currentTarget);
  }

  onTileTouchEnd(e) {
    if (this.draggingRef.value) return;
    if (performance.now() - this.lastDragEndAt.value < 80) return;
    if (this.openingRef.value) return;
    this.openItemFromElement(e.currentTarget);
  }

  // Méthode pour fermer l'overlay
  closeOverlay() {
    if (performance.now() - this.openStartedAtRef.value < 250) return;
    const el = this.focusedElRef.value;
    if (!el) return;

    const parent = el.parentElement;
    const overlay = this.viewerRef.value?.querySelector('.enlarge');
    if (!overlay) return;

    const refDiv = parent.querySelector('.item__image--reference');
    const originalPos = this.originalTilePositionRef.value;

    if (!originalPos) {
      overlay.remove();
      if (refDiv) refDiv.remove();
      parent.style.setProperty('--rot-y-delta', '0deg');
      parent.style.setProperty('--rot-x-delta', '0deg');
      el.style.visibility = '';
      el.style.zIndex = 0;
      this.focusedElRef.value = null;
      this.rootRef.value?.removeAttribute('data-enlarging');
      this.openingRef.value = false;
      this.unlockScroll();
      return;
    }

    // Animation de fermeture
    const currentRect = overlay.getBoundingClientRect();
    const rootRect = this.rootRef.value.getBoundingClientRect();
    const originalPosRelativeToRoot = {
      left: originalPos.left - rootRect.left,
      top: originalPos.top - rootRect.top,
      width: originalPos.width,
      height: originalPos.height
    };

    const overlayRelativeToRoot = {
      left: currentRect.left - rootRect.left,
      top: currentRect.top - rootRect.top,
      width: currentRect.width,
      height: currentRect.height
    };

    const animatingOverlay = document.createElement('div');
    animatingOverlay.className = 'enlarge-closing';
    animatingOverlay.style.cssText = `position:absolute;left:${overlayRelativeToRoot.left}px;top:${overlayRelativeToRoot.top}px;width:${overlayRelativeToRoot.width}px;height:${overlayRelativeToRoot.height}px;z-index:9999;border-radius: var(--enlarge-radius, 32px);overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.35);transition:all ${this.options.enlargeTransitionMs}ms ease-out;pointer-events:none;margin:0;transform:none;`;

    const originalImg = overlay.querySelector('img');
    if (originalImg) {
      const img = originalImg.cloneNode();
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
      animatingOverlay.appendChild(img);
    }

    overlay.remove();
    this.rootRef.value.appendChild(animatingOverlay);

    void animatingOverlay.getBoundingClientRect();
    requestAnimationFrame(() => {
      animatingOverlay.style.left = originalPosRelativeToRoot.left + 'px';
      animatingOverlay.style.top = originalPosRelativeToRoot.top + 'px';
      animatingOverlay.style.width = originalPosRelativeToRoot.width + 'px';
      animatingOverlay.style.height = originalPosRelativeToRoot.height + 'px';
      animatingOverlay.style.opacity = '0';
    });

    const cleanup = () => {
      animatingOverlay.remove();
      this.originalTilePositionRef.value = null;
      if (refDiv) refDiv.remove();
      parent.style.transition = 'none';
      el.style.transition = 'none';
      parent.style.setProperty('--rot-y-delta', '0deg');
      parent.style.setProperty('--rot-x-delta', '0deg');
      requestAnimationFrame(() => {
        el.style.visibility = '';
        el.style.opacity = '0';
        el.style.zIndex = 0;
        this.focusedElRef.value = null;
        this.rootRef.value?.removeAttribute('data-enlarging');
        requestAnimationFrame(() => {
          el.style.transition = 'opacity 300ms ease-out';
          requestAnimationFrame(() => {
            el.style.opacity = '1';
            setTimeout(() => {
              el.style.transition = '';
              el.style.opacity = '';
              this.openingRef.value = false;
              if (!this.draggingRef.value && this.rootRef.value?.getAttribute('data-enlarging') !== 'true')
                document.body.classList.remove('dg-scroll-lock');
            }, 300);
          });
        });
      });
    };

    animatingOverlay.addEventListener('transitionend', cleanup, { once: true });
  }

  // Initialisation du composant
  init(rootRef, mainRef, sphereRef, frameRef, viewerRef, scrimRef) {
    // Assigner les refs DOM
    this.rootRef.value = rootRef;
    this.mainRef.value = mainRef;
    this.sphereRef.value = sphereRef;
    this.frameRef.value = frameRef;
    this.viewerRef.value = viewerRef;
    this.scrimRef.value = scrimRef;
    
    // Configuration des propriétés CSS
    const root = this.rootRef.value;
    if (!root) return;

    const ro = new ResizeObserver(entries => {
      const cr = entries[0].contentRect;
      const w = Math.max(1, cr.width);
      const h = Math.max(1, cr.height);
      const minDim = Math.min(w, h);
      const maxDim = Math.max(w, h);
      const aspect = w / h;

      let basis;
      switch (this.options.fitBasis) {
        case 'min':
          basis = minDim;
          break;
        case 'max':
          basis = maxDim;
          break;
        case 'width':
          basis = w;
          break;
        case 'height':
          basis = h;
          break;
        default:
          basis = aspect >= 1.3 ? w : minDim;
      }

      let radius = basis * this.options.fit;
      const heightGuard = h * 1.35;
      radius = Math.min(radius, heightGuard);
      radius = this.clamp(radius, this.options.minRadius, this.options.maxRadius);
      this.lockedRadiusRef.value = Math.round(radius);

      const viewerPad = Math.max(8, Math.round(minDim * this.options.padFactor));
      root.style.setProperty('--radius', `${this.lockedRadiusRef.value}px`);
      root.style.setProperty('--viewer-pad', `${viewerPad}px`);
      root.style.setProperty('--overlay-blur-color', this.options.overlayBlurColor);
      root.style.setProperty('--tile-radius', this.options.imageBorderRadius);
      root.style.setProperty('--enlarge-radius', this.options.openedImageBorderRadius);
      root.style.setProperty('--image-filter', this.options.grayscale ? 'grayscale(1)' : 'none');
      this.applyTransform(this.rotationRef.value.x, this.rotationRef.value.y);
    });

    ro.observe(root);

    // Configuration des gestionnaires d'événements
    const cleanupDrag = this.setupDragHandlers();

    // Gestionnaire de fermeture
    const scrim = this.scrimRef.value;
    if (scrim) {
      const closeHandler = () => this.closeOverlay();
      scrim.addEventListener('click', closeHandler);
      
      const onKey = e => {
        if (e.key === 'Escape') this.closeOverlay();
      };
      window.addEventListener('keydown', onKey);

      return () => {
        ro.disconnect();
        cleanupDrag();
        scrim.removeEventListener('click', closeHandler);
        window.removeEventListener('keydown', onKey);
        document.body.classList.remove('dg-scroll-lock');
      };
    }

    return () => {
      ro.disconnect();
      cleanupDrag();
      document.body.classList.remove('dg-scroll-lock');
    };
  }

  // Méthode pour mettre à jour les livres
  updateBooks(newBooks) {
    this.books.value = newBooks;
  }

  // Méthode pour définir le callback d'ouverture de livre
  setOnBookOpen(callback) {
    this.onBookOpen = callback;
  }
}

// Exposer la classe globalement
window.DomeGallery = DomeGallery;
```

---

## 🎨 Code CSS complet - dome-gallery-simple.css

```css
/* DomeGallery CSS - Version fonctionnelle */
.dome-gallery-container {
  position: relative;
  width: 100%;
  height: 60vh;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px;
  margin-top: -20px;
  box-sizing: border-box;
  max-width: 1200px;
  margin-left: auto;
  margin-right: auto;
}

.dome-gallery-container .sphere-root {
  width: 90%;
  max-width: 1200px;
  height: 60vh;
  background: transparent;
  border-radius: 25px;
  overflow: hidden;
  box-shadow: 
    0 25px 50px rgba(0, 0, 0, 0.6),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
}

.sphere-root {
  position: relative;
  width: 100%;
  height: 100%;
  --radius: 500px; /* Reduced radius for better fit */
  --viewer-pad: 100px;
  --circ: calc(var(--radius) * 3.14);
  --rot-y: calc((360deg / var(--segments-x)) / 2);
  --rot-x: calc((360deg / var(--segments-y)) / 2);
  --item-width: calc(var(--circ) / var(--segments-x)); /* Original React size */
  --item-height: calc(var(--circ) / var(--segments-y)); /* Original React size */
}

.sphere-root * {
  box-sizing: border-box;
}

.sphere,
.item,
.item__image {
  transform-style: preserve-3d;
}

main.sphere-main {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  overflow: hidden;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  background: transparent;
}

.stage {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  perspective: calc(var(--radius) * 2); /* Original React perspective */
  perspective-origin: 50% 50%;
  contain: layout paint size;
}

.sphere {
  transform: translateZ(calc(var(--radius) * -1)); /* Original React positioning */
  will-change: transform;
}

.item {
  width: calc(var(--item-width) * var(--item-size-x));
  height: calc(var(--item-height) * var(--item-size-y));
  position: absolute;
  top: -999px;
  bottom: -999px;
  left: -999px;
  right: -999px;
  margin: auto;
  transform-origin: 50% 50%;
  backface-visibility: hidden;
  transition: transform 300ms;
  transform: rotateY(calc(var(--rot-y) * (var(--offset-x) + ((var(--item-size-x) - 1) / 2)) + var(--rot-y-delta, 0deg)))
    rotateX(calc(var(--rot-x) * (var(--offset-y) - ((var(--item-size-y) - 1) / 2)) + var(--rot-x-delta, 0deg)))
    translateZ(var(--radius));
}

.item__image {
  position: absolute;
  display: block;
  inset: 10px; /* Original React padding */
  border-radius: var(--tile-radius, 12px);
  background: transparent;
  overflow: hidden;
  backface-visibility: hidden;
  transition: transform 300ms, box-shadow 300ms;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  pointer-events: auto;
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.item__image:hover {
  transform: translateZ(20px) scale(1.05);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
}

.item__image:focus {
  outline: none;
}

.item__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  backface-visibility: hidden;
  filter: var(--image-filter, none);
}

.overlay,
.overlay--blur {
  position: absolute;
  inset: 0;
  margin: auto;
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

.edge-fade {
  position: absolute;
  left: 0;
  right: 0;
  height: 120px;
  z-index: 5;
  pointer-events: none;
  background: linear-gradient(to bottom, transparent, var(--overlay-blur-color, #060010));
}

.edge-fade--top {
  top: 0;
  transform: rotate(180deg);
}

.edge-fade--bottom {
  bottom: 0;
}

.viewer {
  position: absolute;
  inset: 0;
  z-index: 20;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--viewer-pad);
}

.viewer .frame {
  height: 100%;
  aspect-ratio: 1;
  border-radius: var(--enlarge-radius, 32px);
  display: flex;
}

.viewer .scrim {
  position: absolute;
  inset: 0;
  z-index: 10;
  background: rgba(0, 0, 0, 0.4);
  pointer-events: none;
  opacity: 0;
  transition: opacity 500ms ease;
  backdrop-filter: blur(3px);
}

.sphere-root[data-enlarging='true'] .viewer .scrim {
  opacity: 1;
  pointer-events: all;
}

.viewer .enlarge {
  position: absolute;
  z-index: 30;
  border-radius: var(--enlarge-radius, 32px);
  overflow: hidden;
  transition:
    transform 500ms ease,
    opacity 500ms ease;
  transform-origin: top left;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
}

.viewer .enlarge img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: var(--image-filter, none);
}
```

---

## 🔗 Intégration dans App.js

### Méthode buildItems()

```javascript
// Méthode pour construire les items comme dans le code React original
buildItems(books, segments = 35) {
  const xCols = Array.from({ length: segments }, (_, i) => -37 + i * 2);
  const evenYs = [-4, -2, 0, 2, 4];
  const oddYs = [-3, -1, 1, 3, 5];

  const coords = xCols.flatMap((x, c) => {
    const ys = c % 2 === 0 ? evenYs : oddYs;
    return ys.map(y => ({ x, y, sizeX: 2, sizeY: 2 }));
  });

  const totalSlots = coords.length;
  if (books.length === 0) {
    return coords.map(c => ({ ...c, src: '', alt: '' }));
  }

  const normalizedBooks = books.map(book => ({
    src: book.coverUrl || '',
    alt: book.title || '',
    bookId: book.id,
    book: book // Garder une référence au livre original
  }));

  const usedBooks = Array.from({ length: totalSlots }, (_, i) => 
    normalizedBooks[i % normalizedBooks.length]
  );

  return coords.map((c, i) => ({
    ...c,
    src: usedBooks[i].src,
    alt: usedBooks[i].alt,
    bookId: usedBooks[i].bookId,
    book: usedBooks[i].book
  }));
}
```

### Méthode initDomeGallery()

```javascript
initDomeGallery() {
  if (this.domeGallery) return;
  
  this.domeGallery = new DomeGallery({
    fit: 0.6,
    fitBasis: 'auto',
    minRadius: 400,
    maxRadius: 800,
    padFactor: 0.2,
    overlayBlurColor: '#000000',
    maxVerticalRotationDeg: 8,
    dragSensitivity: 50, // Plus élevé = moins sensible
    enlargeTransitionMs: 400,
    segments: 30,
    dragDampening: 0.3, // Plus bas = plus de traînée (inertie)
    openedImageWidth: '300px',
    openedImageHeight: '450px',
    imageBorderRadius: '12px',
    openedImageBorderRadius: '12px',
    grayscale: false
  });

  // Configuration du callback d'ouverture de livre
  this.domeGallery.setOnBookOpen((book) => {
    this.openBook(book);
  });

  // Mise à jour des livres
  this.domeGallery.updateBooks(this.libraryBooks.value);
}
```

### Méthode addDragInteraction() (drag horizontal uniquement)

```javascript
addDragInteraction(mainRef, sphereRef) {
  let isDragging = false;
  let startX = 0;
  let startRotationY = 0;
  let lastMoveTime = 0;
  let velocity = 0;
  let inertiaInterval = null;

  const handleMouseDown = (e) => {
    isDragging = true;
    this.isUserDragging = true;
    startX = e.clientX;
    startRotationY = this.currentRotationY || 0;
    document.body.style.cursor = 'grabbing';
    
    if (inertiaInterval) {
      clearInterval(inertiaInterval);
      inertiaInterval = null;
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - startX;
    const currentTime = Date.now();
    const deltaTime = currentTime - lastMoveTime;
    
    if (deltaTime > 0) {
      velocity = deltaX / deltaTime;
    }
    lastMoveTime = currentTime;
    
    const sensitivity = 0.3; // Sensibilité normale
    const newRotationY = startRotationY + deltaX * sensitivity;
    
    this.currentRotationX = 0;
    this.currentRotationY = newRotationY;
    
    if (sphereRef) {
      sphereRef.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(0deg) rotateY(${newRotationY}deg)`;
    }
  };

  const handleMouseUp = () => {
    isDragging = false;
    this.isUserDragging = false;
    document.body.style.cursor = '';
    
    if (Math.abs(velocity) > 0.1) {
      let inertiaVelocity = velocity * 0.05;
      const friction = 0.92;
      
      const applyInertia = () => {
        if (Math.abs(inertiaVelocity) < 0.02) {
          if (inertiaInterval) {
            clearInterval(inertiaInterval);
            inertiaInterval = null;
          }
          return;
        }
        
        this.currentRotationY += inertiaVelocity;
        if (sphereRef) {
          sphereRef.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(0deg) rotateY(${this.currentRotationY}deg)`;
        }
        
        inertiaVelocity *= friction;
      };
      
      inertiaInterval = setInterval(applyInertia, 16); // 60fps
    }
  };

  // Événements souris
  mainRef.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);

  // Événements tactiles (identique mais avec e.touches[0])
  // ...
}
```

---

## 📐 Structure HTML du template Vue

```html
<div class="dome-gallery-container mb-12">
  <div class="sphere-root" style="--segments-x: 35; --segments-y: 35; --overlay-blur-color: #000000; --tile-radius: 12px; --enlarge-radius: 12px; --image-filter: none;">
    <main class="sphere-main">
      <div class="stage">
        <div class="sphere" ref="sphereRef" style="transform: translateZ(calc(var(--radius) * -1)) rotateX(0deg) rotateY(0deg);">
          <div
            v-for="(item, i) in buildItems(libraryBooks)"
            :key="item.x + ',' + item.y + ',' + i"
            class="item"
            :data-src="item.src"
            :data-offset-x="item.x"
            :data-offset-y="item.y"
            :data-size-x="item.sizeX"
            :data-size-y="item.sizeY"
            :style="{
              '--offset-x': item.x,
              '--offset-y': item.y,
              '--item-size-x': item.sizeX,
              '--item-size-y': item.sizeY
            }"
            @click="openBookFromItem(item)"
          >
            <div class="item__image">
              <img :src="item.src" :alt="item.alt" />
            </div>
          </div>
        </div>
      </div>

      <div class="overlay" />
      <div class="overlay overlay--blur" />
      <div class="edge-fade edge-fade--top" />
      <div class="edge-fade edge-fade--bottom" />

      <div class="viewer" ref="viewerRef">
        <div ref="scrimRef" class="scrim" />
        <div ref="frameRef" class="frame" />
      </div>
    </main>
  </div>
</div>
```

---

## 🎯 Points critiques pour le rendu exact

### 1. Variables CSS critiques

```css
--radius: 500px;                    /* Rayon de base (sera recalculé par ResizeObserver) */
--segments-x: 35;                   /* Nombre de colonnes horizontales */
--segments-y: 35;                   /* Nombre de rangées verticales */
--tile-radius: 12px;                /* Border radius des tuiles */
--enlarge-radius: 12px;             /* Border radius de l'image agrandie */
--overlay-blur-color: #000000;      /* Couleur du blur d'overlay */
--image-filter: none;               /* Pas de grayscale */
```

### 2. Transform 3D de la sphère

```css
.sphere {
  transform: translateZ(calc(var(--radius) * -1)) rotateX(0deg) rotateY(0deg);
}
```

**Important :** La rotation X est toujours à 0 (pas de basculement vertical).

### 3. Transform 3D des items

```css
.item {
  transform: rotateY(calc(var(--rot-y) * (var(--offset-x) + ((var(--item-size-x) - 1) / 2)) + var(--rot-y-delta, 0deg)))
    rotateX(calc(var(--rot-x) * (var(--offset-y) - ((var(--item-size-y) - 1) / 2)) + var(--rot-x-delta, 0deg)))
    translateZ(var(--radius));
}
```

### 4. Perspective

```css
.stage {
  perspective: calc(var(--radius) * 2);
  perspective-origin: 50% 50%;
}
```

### 5. Box-shadow des tuiles

```css
.item__image {
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

.item__image:hover {
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
}
```

### 6. Overlay radial gradient

```css
.overlay {
  background-image: radial-gradient(rgba(26, 26, 26, 0) 50%, rgba(26, 26, 26, 0.9) 80%, rgba(26, 26, 26, 1) 100%);
}
```

---

## 🔍 Checklist de vérification

Pour reproduire exactement le rendu du screen 1, vérifie :

- [ ] **Segments** : `segments: 35` dans buildItems, `--segments-x: 35` dans le HTML
- [ ] **Rayon** : `--radius: 500px` initial, recalculé par ResizeObserver selon `fit: 0.6`
- [ ] **Border radius** : `--tile-radius: 12px` (pas 30px)
- [ ] **Grayscale** : `grayscale: false` (pas de filtre)
- [ ] **Overlay blur color** : `#000000` (noir, pas #060010)
- [ ] **Rotation X** : Toujours à 0 (pas de basculement vertical)
- [ ] **Box-shadow** : `0 8px 25px rgba(0, 0, 0, 0.3)` sur les tuiles
- [ ] **Perspective** : `calc(var(--radius) * 2)`
- [ ] **Transform-style** : `preserve-3d` sur `.sphere`, `.item`, `.item__image`
- [ ] **Backface-visibility** : `hidden` sur les items
- [ ] **Hover effect** : `translateZ(20px) scale(1.05)` sur les tuiles

---

## 🚨 Problèmes courants et solutions

### Problème : Globe flou (screen 2)

**Causes possibles :**
1. **Grayscale activé** → Vérifier `grayscale: false` dans les options
2. **Image-filter CSS** → Vérifier `--image-filter: none` dans le HTML
3. **Backdrop-filter trop fort** → Vérifier `backdrop-filter: blur(3px)` (pas plus)
4. **Overlay trop opaque** → Vérifier les valeurs du radial-gradient

### Problème : Tuiles trop petites/grandes

**Solutions :**
- Ajuster `--radius` (plus grand = tuiles plus grandes)
- Ajuster `fit` dans les options (0.5 → 0.6 → 0.7)
- Vérifier `--segments-x` et `--segments-y` (moins de segments = tuiles plus grandes)

### Problème : Perspective incorrecte

**Solutions :**
- Vérifier `perspective: calc(var(--radius) * 2)`
- Vérifier `perspective-origin: 50% 50%`
- Vérifier que `.stage` a bien `transform-style: preserve-3d`

### Problème : Rotation verticale indésirée

**Solutions :**
- Vérifier que `this.currentRotationX = 0` dans `addDragInteraction`
- Vérifier que le transform de la sphère a toujours `rotateX(0deg)`
- Désactiver `maxVerticalRotationDeg` ou le mettre à 0

---

## 📊 Résumé des valeurs critiques

| Paramètre | Valeur | Où le trouver |
|-----------|--------|---------------|
| `segments` | 35 | `buildItems(books, 35)` |
| `fit` | 0.6 | `App.initDomeGallery()` |
| `minRadius` | 400 | `App.initDomeGallery()` |
| `maxRadius` | 800 | `App.initDomeGallery()` |
| `dragSensitivity` | 50 | `App.initDomeGallery()` |
| `imageBorderRadius` | 12px | `App.initDomeGallery()` |
| `grayscale` | false | `App.initDomeGallery()` |
| `overlayBlurColor` | #000000 | `App.initDomeGallery()` |
| `--radius` (initial) | 500px | `dome-gallery-simple.css` |
| `--segments-x` | 35 | Template HTML inline style |
| `--tile-radius` | 12px | Template HTML inline style |
| `sensitivity` (drag) | 0.3 | `App.addDragInteraction()` |
| `friction` (inertie) | 0.92 | `App.addDragInteraction()` |

---

## ✅ Conclusion

Ce document contient **TOUT** ce qui est nécessaire pour reproduire exactement le globe 3D du screen 1. Les éléments critiques sont :

1. **Code JavaScript complet** de `DomeGallery.js`
2. **Code CSS complet** de `dome-gallery-simple.css`
3. **Configuration exacte** des options dans `App.initDomeGallery()`
4. **Paramètres de drag** dans `App.addDragInteraction()`
5. **Structure HTML** du template Vue
6. **Variables CSS** critiques

Si le rendu ne correspond pas (screen 2 au lieu de screen 1), vérifie en priorité :
- `grayscale: false`
- `--image-filter: none`
- `overlayBlurColor: '#000000'`
- Les valeurs de `--radius`, `--segments-x`, `--tile-radius`





 code original  du resultat parfait attendu  

  appjs
   // DomeGallery
    this.domeGallery = null;
    
    
    // Variables pour le formulaire amélioré
    this.formProgress = Vue.ref(0);
    this.isSubmitting = Vue.ref(false);
    this.submitSuccess = Vue.ref(false);

    // Formulaires
    this.form = Vue.reactive({
      title: '', 
      author: '', 
      year: '', 
      genre: '', 
      totalPages: '',
      coverFile: null, 
      coverUrl: '', 
      shortSummary: '', 
      longSummary: '',
      status: 'en cours', 
      personalScore: '', 
      pdfFile: null
    });

    this.sessionForm = Vue.reactive({
      date: DateUtils.getCurrentDateISO(),
      duration: '', 
      pages: '', 
      notes: ''
    });

    this.editingSessionIndex = Vue.ref(null);
    this.sessionEditForm = Vue.reactive({
      date: '', 
      duration: '', 
      pages: '', 
      notes: ''
    });
  }

  // Propriétés calculées
  get libraryBooks() {
    return this.bookStore.libraryBooks;
  }

  get completedBooks() {
    return this.bookStore.completedBooks;
  }

  get filteredLibraryBooks() {
    return this.bookStore.filteredLibraryBooks;
  }

  get filteredCompletedBooks() {
    return this.bookStore.filteredCompletedBooks;
  }

  get hasSelectedBook() {
    return this.bookStore.hasSelectedBook;
  }

  get selectedBook() {
    return this.bookStore.selectedBook;
  }

  get editingBookId() {
    return this.bookStore.editingBookId;
  }

  get books() {
    return this.bookStore.books;
  }

  // Méthodes pour le DomeGallery
  initDomeGallery() {
    if (this.domeGallery) return;
    
    this.domeGallery = new DomeGallery({
      fit: 0.6,
      fitBasis: 'auto',
      minRadius: 400,
      maxRadius: 800,
      padFactor: 0.2,
      overlayBlurColor: '#000000',
      maxVerticalRotationDeg: 8,
      dragSensitivity: 50, // Plus élevé = moins sensible
      enlargeTransitionMs: 400,
      segments: 30,
      dragDampening: 0.3, // Plus bas = plus de traînée (inertie)
      openedImageWidth: '300px',
      openedImageHeight: '450px',
      imageBorderRadius: '12px',
      openedImageBorderRadius: '12px',
      grayscale: false
    });

    // Configuration du callback d'ouverture de livre
    this.domeGallery.setOnBookOpen((book) => {
      this.openBook(book);
    });

    // Mise à jour des livres
    this.domeGallery.updateBooks(this.libraryBooks.value);
  }

  initDomeGalleryIfNeeded() {
    if (!this.domeGallery) {
      this.initDomeGallery();
    }
    // Mettre à jour les livres dans le DomeGallery
    if (this.domeGallery) {
      this.domeGallery.updateBooks(this.libraryBooks.value);
    }
  }

  // Méthode pour construire les items comme dans le code React original
  buildItems(books, segments = 35) {
    const xCols = Array.from({ length: segments }, (_, i) => -37 + i * 2);
    const evenYs = [-4, -2, 0, 2, 4];
    const oddYs = [-3, -1, 1, 3, 5];

    const coords = xCols.flatMap((x, c) => {
      const ys = c % 2 === 0 ? evenYs : oddYs;
      return ys.map(y => ({ x, y, sizeX: 2, sizeY: 2 }));
    });

    const totalSlots = coords.length;
    if (books.length === 0) {
      return coords.map(c => ({ ...c, src: '', alt: '' }));
    }

    const normalizedBooks = books.map(book => ({
      src: book.coverUrl || '',
      alt: book.title || '',
      bookId: book.id,
      book: book // Garder une référence au livre original
    }));

    const usedBooks = Array.from({ length: totalSlots }, (_, i) => 
      normalizedBooks[i % normalizedBooks.length]
    );

    return coords.map((c, i) => ({
      ...c,
      src: usedBooks[i].src,
      alt: usedBooks[i].alt,
      bookId: usedBooks[i].bookId,
      book: usedBooks[i].book
    }));
  }


  // Méthode pour initialiser le DomeGallery avec les refs DOM
  initDomeGalleryWithRefs(rootRef, mainRef, sphereRef, frameRef, viewerRef, scrimRef) {
    console.log('🎯 Initialisation de l\'interactivité de la sphère');
    console.log('rootRef:', rootRef);
    console.log('mainRef:', mainRef);
    console.log('sphereRef:', sphereRef);
    
    // S'assurer que la rotation X est toujours à 0
    this.currentRotationX = 0;
    
    if (this.domeGallery) {
      this.domeGallery.init(rootRef, mainRef, sphereRef, frameRef, viewerRef, scrimRef);
      console.log('✅ DomeGallery initialisé');
    } else {
      console.log('❌ DomeGallery non trouvé');
    }
    
    // NE PAS ajouter la rotation automatique - la sphère doit rester statique
    console.log('⏸️ Rotation automatique désactivée');
    
    // Ajouter les événements de drag pour la rotation manuelle (horizontale uniquement)
    this.addDragInteraction(mainRef, sphereRef);
    console.log('🖱️ Interactions drag ajoutées (horizontale uniquement)');
  }

  // Méthode pour ajouter l'interaction drag
  addDragInteraction(mainRef, sphereRef) {
    let isDragging = false;
    let startX = 0;
    let startRotationY = 0;
    let lastMoveTime = 0;
    let velocity = 0;
    let inertiaInterval = null;

    const handleMouseDown = (e) => {
      isDragging = true;
      this.isUserDragging = true;
      startX = e.clientX;
      startRotationY = this.currentRotationY || 0;
      document.body.style.cursor = 'grabbing';
      
      // Arrêter l'inertie si elle était en cours
      if (inertiaInterval) {
        clearInterval(inertiaInterval);
        inertiaInterval = null;
      }
    };

    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - startX;
      const currentTime = Date.now();
      const deltaTime = currentTime - lastMoveTime;
      
      // Calculer la vélocité pour l'inertie
      if (deltaTime > 0) {
        velocity = deltaX / deltaTime;
      }
      lastMoveTime = currentTime;
      
      // Sensibilité naturelle comme avant
      const sensitivity = 0.3; // Sensibilité normale
      const newRotationY = startRotationY + deltaX * sensitivity;
      
      // Garder la rotation X fixe à 0 (pas de rotation verticale)
      this.currentRotationX = 0;
      this.currentRotationY = newRotationY;
      
      if (sphereRef) {
        sphereRef.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(0deg) rotateY(${newRotationY}deg)`;
      }
    };

    const handleMouseUp = () => {
      isDragging = false;
      this.isUserDragging = false;
      document.body.style.cursor = '';
      
      // Ajouter l'inertie (traînée) subtile
      if (Math.abs(velocity) > 0.1) {
        let inertiaVelocity = velocity * 0.05; // Facteur d'amortissement très doux
        const friction = 0.92; // Friction plus forte pour arrêter plus vite
        
        const applyInertia = () => {
          if (Math.abs(inertiaVelocity) < 0.02) {
            if (inertiaInterval) {
              clearInterval(inertiaInterval);
              inertiaInterval = null;
            }
            return;
          }
          
          this.currentRotationY += inertiaVelocity;
          if (sphereRef) {
            sphereRef.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(0deg) rotateY(${this.currentRotationY}deg)`;
          }
          
          inertiaVelocity *= friction;
        };
        
        inertiaInterval = setInterval(applyInertia, 16); // 60fps
      }
    };

    // Événements souris
    mainRef.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    // Événements tactiles
    const handleTouchStart = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      isDragging = true;
      this.isUserDragging = true;
      startX = touch.clientX;
      startRotationY = this.currentRotationY || 0;
      
      // Arrêter l'inertie si elle était en cours
      if (inertiaInterval) {
        clearInterval(inertiaInterval);
        inertiaInterval = null;
      }
    };

    const handleTouchMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const touch = e.touches[0];
      
      const deltaX = touch.clientX - startX;
      const currentTime = Date.now();
      const deltaTime = currentTime - lastMoveTime;
      
      // Calculer la vélocité pour l'inertie
      if (deltaTime > 0) {
        velocity = deltaX / deltaTime;
      }
      lastMoveTime = currentTime;
      
      // Sensibilité naturelle comme avant
      const sensitivity = 0.3; // Sensibilité normale
      const newRotationY = startRotationY + deltaX * sensitivity;
      
      // Garder la rotation X fixe à 0 (pas de rotation verticale)
      this.currentRotationX = 0;
      this.currentRotationY = newRotationY;
      
      if (sphereRef) {
        sphereRef.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(0deg) rotateY(${newRotationY}deg)`;
      }
    };

    const handleTouchEnd = () => {
      isDragging = false;
      this.isUserDragging = false;
      
      // Ajouter l'inertie (traînée) subtile
      if (Math.abs(velocity) > 0.1) {
        let inertiaVelocity = velocity * 0.05; // Facteur d'amortissement très doux
        const friction = 0.92; // Friction plus forte pour arrêter plus vite
        
        const applyInertia = () => {
          if (Math.abs(inertiaVelocity) < 0.02) {
            if (inertiaInterval) {
              clearInterval(inertiaInterval);
              inertiaInterval = null;
            }
            return;
          }
          
          this.currentRotationY += inertiaVelocity;
          if (sphereRef) {
            sphereRef.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(0deg) rotateY(${this.currentRotationY}deg)`;
          }
          
          inertiaVelocity *= friction;
        };
        
        inertiaInterval = setInterval(applyInertia, 16); // 60fps
      }
    };

    mainRef.addEventListener('touchstart', handleTouchStart, { passive: false });
    mainRef.addEventListener('touchmove', handleTouchMove, { passive: false });
    mainRef.addEventListener('touchend', handleTouchEnd);

    // Stocker les références pour le nettoyage
    this.dragCleanup = () => {
      mainRef.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      mainRef.removeEventListener('touchstart', handleTouchStart);
      mainRef.removeEventListener('touchmove', handleTouchMove);
      mainRef.removeEventListener('touchend', handleTouchEnd);
    };
  }

  // Méthode pour démarrer la rotation automatique de la sphère (DÉSACTIVÉE)
  startSphereRotation() {
    // Rotation automatique désactivée - la sphère reste statique
    console.log('⏸️ Rotation automatique désactivée - sphère statique');
  }

  // Méthode pour arrêter la rotation
  stopSphereRotation() {
    if (this.sphereRotationInterval) {
      clearInterval(this.sphereRotationInterval);
      this.sphereRotationInterval = null;
    }
  }

  // Méthode pour ouvrir un livre depuis un item
  openBookFromItem(item) {
    console.log('openBookFromItem appelé avec:', item);
    
    // Utiliser directement la référence au livre si disponible
    if (item.book) {
      console.log('Ouverture du livre:', item.book.title);
      
      // Ouvrir le livre immédiatement pour une réactivité maximale
      this.openBook(item.book);
      
      // Rediriger vers l'onglet Livres après l'ouverture du livre
      Vue.nextTick(() => {
        this.currentView.value = 'livres';
      });
      return;
    }
    
    // Fallback : chercher par ID
    if (item.bookId) {
      const book = this.libraryBooks.value.find(b => b.id === item.bookId);
      if (book) {
        console.log('Livre trouvé par ID:', book.title);
        
        // Ouvrir le livre immédiatement pour une réactivité maximale
        this.openBook(book);
        
        // Rediriger vers l'onglet Livres après l'ouverture du livre
        Vue.nextTick(() => {
          this.currentView.value = 'livres';
        });
        return;
      }
    }
    
    console.log('Aucun livre trouvé pour cet item');
  } 




  deuxieme partie de code template 
   <!-- 🌐 Section Vue 3D -->
        <h2 class="section-title-modern">
          <div class="section-title-header">
            <span class="section-title-icon">🌐</span>
            <span class="section-title-text">VUE 3D</span>
          </div>
          <div class="section-title-subtitle">Exploration immersive de votre bibliothèque</div>
        </h2>

        <div class="dome-gallery-container mb-12">
          <div class="sphere-root" style="--segments-x: 35; --segments-y: 35; --overlay-blur-color: #000000; --tile-radius: 12px; --enlarge-radius: 12px; --image-filter: none;">
            <main class="sphere-main">
              <div class="stage">
                <div class="sphere" ref="sphereRef" style="transform: translateZ(calc(var(--radius) * -1)) rotateX(0deg) rotateY(0deg);">
                  <div
                    v-for="(item, i) in buildItems(libraryBooks)"
                    :key="item.x + ',' + item.y + ',' + i"
                    class="item"
                    :data-src="item.src"
                    :data-offset-x="item.x"
                    :data-offset-y="item.y"
                    :data-size-x="item.sizeX"
                    :data-size-y="item.sizeY"
                    :style="{
                      '--offset-x': item.x,
                      '--offset-y': item.y,
                      '--item-size-x': item.sizeX,
                      '--item-size-y': item.sizeY
                    }"
                    @click="openBookFromItem(item)"
                  >
                    <div class="item__image">
                      <img :src="item.src" :alt="item.alt" />
                    </div>
                  </div>
                </div>
              </div>

              <div class="overlay" />
              <div class="overlay overlay--blur" />
              <div class="edge-fade edge-fade--top" />
              <div class="edge-fade edge-fade--bottom" />

              <div class="viewer" ref="viewerRef">
                <div ref="scrimRef" class="scrim" />
                <div ref="frameRef" class="frame" />
              </div>
            </main>
          </div>
        </div>
      </div>

      <!-- 📖 Détail d'un livre -->
      <div v-if="currentView === 'livres' && hasSelectedBook" class="book-details">
        <!-- 🔹 Barre d'action -->
        <div class="flex justify-center gap-4 mb-6 mt-4">
          <div class="flex flex-wrap gap-3 justify-center my-4">
            <button @click="closeBook"
             class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-4 rounded-full shadow">
            ← Retour
            </button>
            <button @click="editBook(selectedBook)"
            class="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-4 rounded-full shadow">
            ✏️ Modifier
             </button>
            <button @click="deleteBook(selectedBook)"
            class="bg-red-600 hover:bg-red-700 text-white font-semibold py-1 px-4 rounded-full shadow">
            🗑️ Supprimer
            </button>
          </div>
        </div>

        <h2 class="book-title">{{ selectedBook.title }}</h2>
        <img :src="selectedBook.coverUrl || 'default-cover.png'" class="cover cover-large" />
        <p><strong>Auteur :</strong> {{ selectedBook.author }}</p>
        <p><strong>Année :</strong> {{ selectedBook.year }}</p>
        <p><strong>Genre :</strong> {{ selectedBook.genre }}</p>
        <p><strong>Pages :</strong> {{ selectedBook.totalPages }}</p>

        <p>
          <strong>Pages lues :</strong>
          {{ getTotalPagesRead(selectedBook) }} / {{ selectedBook.totalPages }}
        </p>

        <!-- ✅ Barre de progression -->
        <div class="w-full h-4 bg-gray-700 rounded overflow-hidden mt-2 mb-4 max-w-md mx-auto">
          <div
            class="h-full bg-green-400 transition-all duration-300"
            :style="{ width: (getTotalPagesRead(selectedBook) / selectedBook.totalPages * 100).toFixed(1) + '%' }"
          ></div>
        </div>

        <p><strong>Statut :</strong> {{ selectedBook.status }}</p>
        <p><strong>Score :</strong> {{ selectedBook.personalScore }}</p>

        <p><strong>PDF :</strong>
          <span v-if="selectedBook._pdfBlobUrl">
            📄 <a :href="selectedBook._pdfBlobUrl" target="_blank">Ouvrir</a>
          </span>
          <span v-else class="italic text-gray-400">Aucun fichier PDF</span>
        </p>

        <p class="mt-4">
          <strong>🧠 Temps total de lecture :</strong> {{ getTotalReadingTime(selectedBook) }}
        </p>
        
        <h3>📘 Résumé court</h3>
        <p>{{ selectedBook.shortSummary }}</p>

        <h3>📖 Résumé détaillé</h3>
        <details>
          <summary>Voir / Masquer</summary>
          <p>{{ selectedBook.longSummary }}</p>
        </details>

        <h3 class="subtitle text-lg mt-6">📌 Ajouter une session de lecture</h3>
        <div class="book-form">
          <input type="date" v-model="sessionForm.date" />
          <input type="text" v-model="sessionForm.duration" placeholder="Durée (ex: 1h30, 45min)" />
          <input type="text" v-model="sessionForm.pages" placeholder="Pages lues (ex: 10–25)" />
          <input type="text" v-model="sessionForm.notes" placeholder="Notes (optionnel)" />
          <button type="button" @click="addReadingSession">➕ Ajouter</button>
        </div>

        <h3 class="subtitle text-lg mt-6">📚 Historique des sessions</h3>
        <table class="reading-log-table" v-if="selectedBook.readingSessions && selectedBook.readingSessions.length > 0">
          <thead>
            <tr>
              <th>Date</th>
              <th>Durée</th>
              <th>Pages</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(session, idx) in selectedBook.readingSessions" :key="idx">
              <template v-if="editingSessionIndex === idx">
                <td><input type="date" v-model="sessionEditForm.date" /></td>
                <td><input type="text" v-model="sessionEditForm.duration" /></td>
                <td><input type="text" v-model="sessionEditForm.pages" /></td>
                <td><input type="text" v-model="sessionEditForm.notes" /></td>
                <td>
                  <button @click="saveEditedSession">💾</button>
                  <button @click="cancelEditSession">✖️</button>
                </td>
              </template>
              <template v-else>
                <td>{{ formatDate(session.date) }}</td>
                <td>{{ session.duration }}</td>
                <td>{{ session.pages }}</td>
                <td>{{ session.notes || '-' }}</td>
                <td>
                  <button @click="editSession(idx)">✏️</button>
                  <button @click="deleteSession(idx)">🗑️</button>
                </td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  `,

  setup() {
    // Retourner toutes les propriétés et méthodes de l'instance App
    return {
        // Vue & navigation
        currentView: app.currentView,
        selectedBook: app.selectedBook,
        hasSelectedBook: app.hasSelectedBook,
        editingBookId: app.editingBookId,
        isLongSummaryExpanded: app.isLongSummaryExpanded,
        domeGallery: app.domeGallery,
        buildItems: (books, segments) => app.buildItems(books, segments),
        openBookFromItem: (item) => app.openBookFromItem(item),
        
        // Refs pour le DomeGallery
        domeGalleryRoot: Vue.ref(null),
        domeGalleryMain: Vue.ref(null),
        domeGallerySphere: Vue.ref(null),
        domeGalleryFrame: Vue.ref(null),
        domeGalleryViewer: Vue.ref(null),
        domeGalleryScrim: Vue.ref(null),

      // Formulaires et progression
      form: app.form,
      sessionForm: app.sessionForm,
      sessionEditForm: app.sessionEditForm,
      starRating: app.starRating,
      editingSessionIndex: app.editingSessionIndex,
      formProgress: app.formProgress,
      isSubmitting: app.isSubmitting,
      submitSuccess: app.submitSuccess,
      updateFormProgress: app.updateFormProgress.bind(app),

      // Recherche
      searchQuery: app.searchQuery,

      // Fonctions livres
      addBook: app.addBook.bind(app),
      editBook: app.editBook.bind(app),
      deleteBook: app.deleteBook.bind(app),
      openBook: app.openBook.bind(app),
      closeBook: app.closeBook.bind(app),

      // Sessions de lecture
      addReadingSession: app.addReadingSession.bind(app),
      editSession: app.editSession.bind(app),
      saveEditedSession: app.saveEditedSession.bind(app),
      cancelEditSession: app.cancelEditSession.bind(app),
      deleteSession: app.deleteSession.bind(app),

      // Uploads fichiers
      handleCoverUpload: app.handleCoverUpload.bind(app),
      handlePdfUpload: app.handlePdfUpload.bind(app),
      triggerCoverUpload: app.triggerCoverUpload.bind(app),
      triggerPdfUpload: app.triggerPdfUpload.bind(app),
      handleCoverDrop: app.handleCoverDrop.bind(app),
      handlePdfDrop: app.handlePdfDrop.bind(app),
      testStorage: app.testStorage.bind(app),

      // Données dérivées
      books: app.books,
      libraryBooks: app.libraryBooks,
      completedBooks: app.completedBooks,
      getTotalReadingTime: app.getTotalReadingTime.bind(app),
      getTotalPagesRead: app.getTotalPagesRead.bind(app),
      formatDate: app.formatDate.bind(app),
      exportBooks: app.exportBooks.bind(app),
      importBooks: app.importBooks.bind(app),

      // Carrousels & navigation
      libraryCarouselRef: app.libraryCarouselRef,
      completedCarouselRef: app.completedCarouselRef,
      scrollCarousel: app.scrollCarousel.bind(app),
      librarySlideIndex: app.librarySlideIndex,
      BOOKS_PER_VIEW: app.BOOKS_PER_VIEW,
      completedSlideIndex: app.completedSlideIndex,
      filteredCompletedBooks: app.filteredCompletedBooks,
      filteredLibraryBooks: app.filteredLibraryBooks,
      
        // Fonctions debug (optionnelles)
        debugCarousel: app.debugCarousel.bind(app),
        resetCarousel: app.resetCarousel.bind(app),
        
        // DomeGallery
        initDomeGalleryWithRefs: app.initDomeGalleryWithRefs.bind(app),
    };
  },

  async mounted() {
    await app.onMounted();
    
    // Initialiser la vue 3D automatiquement au chargement
    Vue.nextTick(() => {
      const rootRef = document.querySelector('.sphere-root');
      const mainRef = document.querySelector('.sphere-main');
      const sphereRef = document.querySelector('.sphere');
      const frameRef = document.querySelector('.frame');
      const viewerRef = document.querySelector('.viewer');
      const scrimRef = document.querySelector('.scrim');
      
      if (rootRef && mainRef && sphereRef && frameRef && viewerRef && scrimRef) {
        app.initDomeGalleryWithRefs(rootRef, mainRef, sphereRef, frameRef, viewerRef, scrimRef);
      }
    }); 


    code dome gallery.js : 
    // Composant DomeGallery adapté pour Vue.js
// Basé sur le code React original mais converti pour Vue 3
class DomeGallery {
  constructor(options = {}) {
    this.options = {
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
      ...options
    };

    // Refs pour les éléments DOM
    this.rootRef = Vue.ref(null);
    this.mainRef = Vue.ref(null);
    this.sphereRef = Vue.ref(null);
    this.frameRef = Vue.ref(null);
    this.viewerRef = Vue.ref(null);
    this.scrimRef = Vue.ref(null);
    this.focusedElRef = Vue.ref(null);
    this.originalTilePositionRef = Vue.ref(null);

    // État de rotation et drag
    this.rotationRef = Vue.ref({ x: 0, y: 0 });
    this.startRotRef = Vue.ref({ x: 0, y: 0 });
    this.startPosRef = Vue.ref(null);
    this.draggingRef = Vue.ref(false);
    this.movedRef = Vue.ref(false);
    this.inertiaRAF = Vue.ref(null);
    this.openingRef = Vue.ref(false);
    this.openStartedAtRef = Vue.ref(0);
    this.lastDragEndAt = Vue.ref(0);
    this.scrollLockedRef = Vue.ref(false);
    this.lockedRadiusRef = Vue.ref(null);

    // Données des livres
    this.books = Vue.ref([]);
    this.items = Vue.computed(() => this.buildItems(this.books.value, this.options.segments));

    // Méthodes liées
    this.applyTransform = this.applyTransform.bind(this);
    this.lockScroll = this.lockScroll.bind(this);
    this.unlockScroll = this.unlockScroll.bind(this);
    this.stopInertia = this.stopInertia.bind(this);
    this.startInertia = this.startInertia.bind(this);
    this.openItemFromElement = this.openItemFromElement.bind(this);
    this.onTileClick = this.onTileClick.bind(this);
    this.onTilePointerUp = this.onTilePointerUp.bind(this);
    this.onTileTouchEnd = this.onTileTouchEnd.bind(this);
  }

  // Utilitaires mathématiques
  clamp(v, min, max) {
    return Math.min(Math.max(v, min), max);
  }

  normalizeAngle(d) {
    return ((d % 360) + 360) % 360;
  }

  wrapAngleSigned(deg) {
    const a = (((deg + 180) % 360) + 360) % 360;
    return a - 180;
  }

  getDataNumber(el, name, fallback) {
    const attr = el.dataset[name] ?? el.getAttribute(`data-${name}`);
    const n = attr == null ? NaN : parseFloat(attr);
    return Number.isFinite(n) ? n : fallback;
  }

  // Construction des éléments sur la sphère
  buildItems(books, segments) {
    const xCols = Array.from({ length: segments }, (_, i) => -37 + i * 2);
    const evenYs = [-4, -2, 0, 2, 4];
    const oddYs = [-3, -1, 1, 3, 5];

    const coords = xCols.flatMap((x, c) => {
      const ys = c % 2 === 0 ? evenYs : oddYs;
      return ys.map(y => ({ x, y, sizeX: 2, sizeY: 2 }));
    });

    const totalSlots = coords.length;
    if (books.length === 0) {
      return coords.map(c => ({ ...c, src: '', alt: '', book: null }));
    }

    const normalizedBooks = books.map(book => ({
      src: book.coverUrl || '/default-cover.jpg',
      alt: book.title || '',
      book: book
    }));

    const usedBooks = Array.from({ length: totalSlots }, (_, i) => 
      normalizedBooks[i % normalizedBooks.length]
    );

    // Éviter les doublons consécutifs
    for (let i = 1; i < usedBooks.length; i++) {
      if (usedBooks[i].src === usedBooks[i - 1].src) {
        for (let j = i + 1; j < usedBooks.length; j++) {
          if (usedBooks[j].src !== usedBooks[i].src) {
            const tmp = usedBooks[i];
            usedBooks[i] = usedBooks[j];
            usedBooks[j] = tmp;
            break;
          }
        }
      }
    }

    return coords.map((c, i) => ({
      ...c,
      src: usedBooks[i].src,
      alt: usedBooks[i].alt,
      book: usedBooks[i].book
    }));
  }

  computeItemBaseRotation(offsetX, offsetY, sizeX, sizeY, segments) {
    const unit = 360 / segments / 2;
    const rotateY = unit * (offsetX + (sizeX - 1) / 2);
    const rotateX = unit * (offsetY - (sizeY - 1) / 2);
    return { rotateX, rotateY };
  }

  // Application des transformations 3D
  applyTransform(xDeg, yDeg) {
    const el = this.sphereRef.value;
    if (el) {
      el.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${xDeg}deg) rotateY(${yDeg}deg)`;
    }
  }

  // Gestion du scroll
  lockScroll() {
    if (this.scrollLockedRef.value) return;
    this.scrollLockedRef.value = true;
    document.body.classList.add('dg-scroll-lock');
  }

  unlockScroll() {
    if (!this.scrollLockedRef.value) return;
    if (this.rootRef.value?.getAttribute('data-enlarging') === 'true') return;
    this.scrollLockedRef.value = false;
    document.body.classList.remove('dg-scroll-lock');
  }

  // Gestion de l'inertie
  stopInertia() {
    if (this.inertiaRAF.value) {
      cancelAnimationFrame(this.inertiaRAF.value);
      this.inertiaRAF.value = null;
    }
  }

  startInertia(vx, vy) {
    const MAX_V = 1.4;
    let vX = this.clamp(vx, -MAX_V, MAX_V) * 80;
    let vY = this.clamp(vy, -MAX_V, MAX_V) * 80;
    let frames = 0;
    const d = this.clamp(this.options.dragDampening ?? 0.6, 0, 1);
    const frictionMul = 0.94 + 0.055 * d;
    const stopThreshold = 0.015 - 0.01 * d;
    const maxFrames = Math.round(90 + 270 * d);

    const step = () => {
      vX *= frictionMul;
      vY *= frictionMul;
      if (Math.abs(vX) < stopThreshold && Math.abs(vY) < stopThreshold) {
        this.inertiaRAF.value = null;
        return;
      }
      if (++frames > maxFrames) {
        this.inertiaRAF.value = null;
        return;
      }
      const nextX = this.clamp(
        this.rotationRef.value.x - vY / 200, 
        -this.options.maxVerticalRotationDeg, 
        this.options.maxVerticalRotationDeg
      );
      const nextY = this.wrapAngleSigned(this.rotationRef.value.y + vX / 200);
      this.rotationRef.value = { x: nextX, y: nextY };
      this.applyTransform(nextX, nextY);
      this.inertiaRAF.value = requestAnimationFrame(step);
    };

    this.stopInertia();
    this.inertiaRAF.value = requestAnimationFrame(step);
  }

  // Gestion des événements de drag
  setupDragHandlers() {
    const mainEl = this.mainRef.value;
    if (!mainEl) return;

    let startX, startY, isDragging = false;

    const handleStart = (e) => {
      if (this.focusedElRef.value) return;
      this.stopInertia();
      isDragging = true;
      this.draggingRef.value = true;
      this.movedRef.value = false;
      this.startRotRef.value = { ...this.rotationRef.value };
      startX = e.clientX || e.touches[0].clientX;
      startY = e.clientY || e.touches[0].clientY;
      this.startPosRef.value = { x: startX, y: startY };
    };

    const handleMove = (e) => {
      if (this.focusedElRef.value || !isDragging || !this.startPosRef.value) return;
      
      const currentX = e.clientX || e.touches[0].clientX;
      const currentY = e.clientY || e.touches[0].clientY;
      const dxTotal = currentX - this.startPosRef.value.x;
      const dyTotal = currentY - this.startPosRef.value.y;

      if (!this.movedRef.value) {
        const dist2 = dxTotal * dxTotal + dyTotal * dyTotal;
        if (dist2 > 16) this.movedRef.value = true;
      }

      const nextX = this.clamp(
        this.startRotRef.value.x - dyTotal / this.options.dragSensitivity,
        -this.options.maxVerticalRotationDeg,
        this.options.maxVerticalRotationDeg
      );
      const nextY = this.wrapAngleSigned(this.startRotRef.value.y + dxTotal / this.options.dragSensitivity);
      
      if (this.rotationRef.value.x !== nextX || this.rotationRef.value.y !== nextY) {
        this.rotationRef.value = { x: nextX, y: nextY };
        this.applyTransform(nextX, nextY);
      }
    };

    const handleEnd = (e) => {
      if (!isDragging) return;
      isDragging = false;
      this.draggingRef.value = false;
      
      if (this.movedRef.value) {
        this.lastDragEndAt.value = performance.now();
        // Calculer la vélocité pour l'inertie
        const deltaTime = 16; // Approximation
        const vx = (e.clientX - startX) / deltaTime / this.options.dragSensitivity;
        const vy = (e.clientY - startY) / deltaTime / this.options.dragSensitivity;
        
        if (Math.abs(vx) > 0.005 || Math.abs(vy) > 0.005) {
          this.startInertia(vx, vy);
        }
      }
      this.movedRef.value = false;
    };

    // Événements souris
    mainEl.addEventListener('mousedown', handleStart);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);

    // Événements tactiles
    mainEl.addEventListener('touchstart', handleStart, { passive: true });
    mainEl.addEventListener('touchmove', handleMove, { passive: true });
    mainEl.addEventListener('touchend', handleEnd, { passive: true });

    return () => {
      mainEl.removeEventListener('mousedown', handleStart);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      mainEl.removeEventListener('touchstart', handleStart);
      mainEl.removeEventListener('touchmove', handleMove);
      mainEl.removeEventListener('touchend', handleEnd);
    };
  }

  // Ouverture d'un élément
  openItemFromElement(el) {
    if (this.openingRef.value) return;
    this.openingRef.value = true;
    this.openStartedAtRef.value = performance.now();
    this.lockScroll();

    const parent = el.parentElement;
    this.focusedElRef.value = el;
    el.setAttribute('data-focused', 'true');

    const offsetX = this.getDataNumber(parent, 'offsetX', 0);
    const offsetY = this.getDataNumber(parent, 'offsetY', 0);
    const sizeX = this.getDataNumber(parent, 'sizeX', 2);
    const sizeY = this.getDataNumber(parent, 'sizeY', 2);

    const parentRot = this.computeItemBaseRotation(offsetX, offsetY, sizeX, sizeY, this.options.segments);
    const parentY = this.normalizeAngle(parentRot.rotateY);
    const globalY = this.normalizeAngle(this.rotationRef.value.y);
    let rotY = -(parentY + globalY) % 360;
    if (rotY < -180) rotY += 360;
    const rotX = -parentRot.rotateX - this.rotationRef.value.x;

    parent.style.setProperty('--rot-y-delta', `${rotY}deg`);
    parent.style.setProperty('--rot-x-delta', `${rotX}deg`);

    const refDiv = document.createElement('div');
    refDiv.className = 'item__image item__image--reference';
    refDiv.style.opacity = '0';
    refDiv.style.transform = `rotateX(${-parentRot.rotateX}deg) rotateY(${-parentRot.rotateY}deg)`;
    parent.appendChild(refDiv);

    const tileR = refDiv.getBoundingClientRect();
    const mainR = this.mainRef.value.getBoundingClientRect();
    const frameR = this.frameRef.value.getBoundingClientRect();

    this.originalTilePositionRef.value = {
      left: tileR.left,
      top: tileR.top,
      width: tileR.width,
      height: tileR.height
    };

    el.style.visibility = 'hidden';
    el.style.zIndex = 0;

    const overlay = document.createElement('div');
    overlay.className = 'enlarge';
    overlay.style.position = 'absolute';
    overlay.style.left = frameR.left - mainR.left + 'px';
    overlay.style.top = frameR.top - mainR.top + 'px';
    overlay.style.width = frameR.width + 'px';
    overlay.style.height = frameR.height + 'px';
    overlay.style.opacity = '0';
    overlay.style.zIndex = '30';
    overlay.style.willChange = 'transform, opacity';
    overlay.style.transformOrigin = 'top left';
    overlay.style.transition = `transform ${this.options.enlargeTransitionMs}ms ease, opacity ${this.options.enlargeTransitionMs}ms ease`;

    const rawSrc = parent.dataset.src || el.querySelector('img')?.src || '';
    const img = document.createElement('img');
    img.src = rawSrc;
    overlay.appendChild(img);
    this.viewerRef.value.appendChild(overlay);

    const tx0 = tileR.left - frameR.left;
    const ty0 = tileR.top - frameR.top;
    const sx0 = tileR.width / frameR.width;
    const sy0 = tileR.height / frameR.height;

    overlay.style.transform = `translate(${tx0}px, ${ty0}px) scale(${sx0}, ${sy0})`;

    requestAnimationFrame(() => {
      overlay.style.opacity = '1';
      overlay.style.transform = 'translate(0px, 0px) scale(1,1)';
      this.rootRef.value?.setAttribute('data-enlarging', 'true');
    });

    // Émettre l'événement d'ouverture du livre
    const book = parent.dataset.book ? JSON.parse(parent.dataset.book) : null;
    if (book && this.onBookOpen) {
      this.onBookOpen(book);
    }
  }

  // Gestionnaires d'événements
  onTileClick(e) {
    if (this.draggingRef.value) return;
    if (performance.now() - this.lastDragEndAt.value < 80) return;
    if (this.openingRef.value) return;
    this.openItemFromElement(e.currentTarget);
  }

  onTilePointerUp(e) {
    if (e.pointerType !== 'touch') return;
    if (this.draggingRef.value) return;
    if (performance.now() - this.lastDragEndAt.value < 80) return;
    if (this.openingRef.value) return;
    this.openItemFromElement(e.currentTarget);
  }

  onTileTouchEnd(e) {
    if (this.draggingRef.value) return;
    if (performance.now() - this.lastDragEndAt.value < 80) return;
    if (this.openingRef.value) return;
    this.openItemFromElement(e.currentTarget);
  }

  // Méthode pour fermer l'overlay
  closeOverlay() {
    if (performance.now() - this.openStartedAtRef.value < 250) return;
    const el = this.focusedElRef.value;
    if (!el) return;

    const parent = el.parentElement;
    const overlay = this.viewerRef.value?.querySelector('.enlarge');
    if (!overlay) return;

    const refDiv = parent.querySelector('.item__image--reference');
    const originalPos = this.originalTilePositionRef.value;

    if (!originalPos) {
      overlay.remove();
      if (refDiv) refDiv.remove();
      parent.style.setProperty('--rot-y-delta', '0deg');
      parent.style.setProperty('--rot-x-delta', '0deg');
      el.style.visibility = '';
      el.style.zIndex = 0;
      this.focusedElRef.value = null;
      this.rootRef.value?.removeAttribute('data-enlarging');
      this.openingRef.value = false;
      this.unlockScroll();
      return;
    }

    // Animation de fermeture
    const currentRect = overlay.getBoundingClientRect();
    const rootRect = this.rootRef.value.getBoundingClientRect();
    const originalPosRelativeToRoot = {
      left: originalPos.left - rootRect.left,
      top: originalPos.top - rootRect.top,
      width: originalPos.width,
      height: originalPos.height
    };

    const overlayRelativeToRoot = {
      left: currentRect.left - rootRect.left,
      top: currentRect.top - rootRect.top,
      width: currentRect.width,
      height: currentRect.height
    };

    const animatingOverlay = document.createElement('div');
    animatingOverlay.className = 'enlarge-closing';
    animatingOverlay.style.cssText = `position:absolute;left:${overlayRelativeToRoot.left}px;top:${overlayRelativeToRoot.top}px;width:${overlayRelativeToRoot.width}px;height:${overlayRelativeToRoot.height}px;z-index:9999;border-radius: var(--enlarge-radius, 32px);overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,.35);transition:all ${this.options.enlargeTransitionMs}ms ease-out;pointer-events:none;margin:0;transform:none;`;

    const originalImg = overlay.querySelector('img');
    if (originalImg) {
      const img = originalImg.cloneNode();
      img.style.cssText = 'width:100%;height:100%;object-fit:cover;';
      animatingOverlay.appendChild(img);
    }

    overlay.remove();
    this.rootRef.value.appendChild(animatingOverlay);

    void animatingOverlay.getBoundingClientRect();
    requestAnimationFrame(() => {
      animatingOverlay.style.left = originalPosRelativeToRoot.left + 'px';
      animatingOverlay.style.top = originalPosRelativeToRoot.top + 'px';
      animatingOverlay.style.width = originalPosRelativeToRoot.width + 'px';
      animatingOverlay.style.height = originalPosRelativeToRoot.height + 'px';
      animatingOverlay.style.opacity = '0';
    });

    const cleanup = () => {
      animatingOverlay.remove();
      this.originalTilePositionRef.value = null;
      if (refDiv) refDiv.remove();
      parent.style.transition = 'none';
      el.style.transition = 'none';
      parent.style.setProperty('--rot-y-delta', '0deg');
      parent.style.setProperty('--rot-x-delta', '0deg');
      requestAnimationFrame(() => {
        el.style.visibility = '';
        el.style.opacity = '0';
        el.style.zIndex = 0;
        this.focusedElRef.value = null;
        this.rootRef.value?.removeAttribute('data-enlarging');
        requestAnimationFrame(() => {
          parent.style.transition = '';
          el.style.transition = 'opacity 300ms ease-out';
          requestAnimationFrame(() => {
            el.style.opacity = '1';
            setTimeout(() => {
              el.style.transition = '';
              el.style.opacity = '';
              this.openingRef.value = false;
              if (!this.draggingRef.value && this.rootRef.value?.getAttribute('data-enlarging') !== 'true')
                document.body.classList.remove('dg-scroll-lock');
            }, 300);
          });
        });
      });
    };

    animatingOverlay.addEventListener('transitionend', cleanup, { once: true });
  }

  // Initialisation du composant
  init(rootRef, mainRef, sphereRef, frameRef, viewerRef, scrimRef) {
    // Assigner les refs DOM
    this.rootRef.value = rootRef;
    this.mainRef.value = mainRef;
    this.sphereRef.value = sphereRef;
    this.frameRef.value = frameRef;
    this.viewerRef.value = viewerRef;
    this.scrimRef.value = scrimRef;
    
    // Configuration des propriétés CSS
    const root = this.rootRef.value;
    if (!root) return;

    const ro = new ResizeObserver(entries => {
      const cr = entries[0].contentRect;
      const w = Math.max(1, cr.width);
      const h = Math.max(1, cr.height);
      const minDim = Math.min(w, h);
      const maxDim = Math.max(w, h);
      const aspect = w / h;

      let basis;
      switch (this.options.fitBasis) {
        case 'min':
          basis = minDim;
          break;
        case 'max':
          basis = maxDim;
          break;
        case 'width':
          basis = w;
          break;
        case 'height':
          basis = h;
          break;
        default:
          basis = aspect >= 1.3 ? w : minDim;
      }

      let radius = basis * this.options.fit;
      const heightGuard = h * 1.35;
      radius = Math.min(radius, heightGuard);
      radius = this.clamp(radius, this.options.minRadius, this.options.maxRadius);
      this.lockedRadiusRef.value = Math.round(radius);

      const viewerPad = Math.max(8, Math.round(minDim * this.options.padFactor));
      root.style.setProperty('--radius', `${this.lockedRadiusRef.value}px`);
      root.style.setProperty('--viewer-pad', `${viewerPad}px`);
      root.style.setProperty('--overlay-blur-color', this.options.overlayBlurColor);
      root.style.setProperty('--tile-radius', this.options.imageBorderRadius);
      root.style.setProperty('--enlarge-radius', this.options.openedImageBorderRadius);
      root.style.setProperty('--image-filter', this.options.grayscale ? 'grayscale(1)' : 'none');
      this.applyTransform(this.rotationRef.value.x, this.rotationRef.value.y);
    });

    ro.observe(root);

    // Configuration des gestionnaires d'événements
    const cleanupDrag = this.setupDragHandlers();

    // Gestionnaire de fermeture
    const scrim = this.scrimRef.value;
    if (scrim) {
      const closeHandler = () => this.closeOverlay();
      scrim.addEventListener('click', closeHandler);
      
      const onKey = e => {
        if (e.key === 'Escape') this.closeOverlay();
      };
      window.addEventListener('keydown', onKey);

      return () => {
        ro.disconnect();
        cleanupDrag();
        scrim.removeEventListener('click', closeHandler);
        window.removeEventListener('keydown', onKey);
        document.body.classList.remove('dg-scroll-lock');
      };
    }

    return () => {
      ro.disconnect();
      cleanupDrag();
      document.body.classList.remove('dg-scroll-lock');
    };
  }

  // Méthode pour mettre à jour les livres
  updateBooks(newBooks) {
    this.books.value = newBooks;
  }

  // Méthode pour définir le callback d'ouverture de livre
  setOnBookOpen(callback) {
    this.onBookOpen = callback;
  }
}

// Exposer la classe globalement
window.DomeGallery = DomeGallery;
