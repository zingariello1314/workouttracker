# 🎯 Optimisations de fluidité pour la galerie 3D (BooksDomeGallery)

## ⚠️ CONTRAINTES ABSOLUES

**AUCUNE modification ne doit affecter :**
- ✅ L'esthétique visuelle (proportions, taille, couleurs, effets)
- ✅ Le comportement (drag, click, ouverture détail, traînée)
- ✅ L'intensité de la traînée (doit rester identique)
- ✅ Les props passées au composant
- ✅ Les styles CSS visuels

**Objectif unique :** Améliorer la fluidité et éliminer les bugs/lags **SANS changer l'apparence ou le comportement**.

---

## 🔍 Problèmes de performance identifiés

### 1. **setInterval à 16ms pour l'inertie** ⚠️ CRITIQUE

**Localisation** : `BooksDomeGallery.jsx` lignes 374, 480

```javascript
inertiaInterval = setInterval(applyInertia, 16); // 60fps
```

**Problèmes** :
- **`setInterval` n'est pas synchronisé avec le rafraîchissement d'écran** : peut causer des frames manquées ou des saccades
- **Continue même si l'onglet n'est pas visible** : consomme CPU inutilement
- **Pas de gestion de la fréquence d'affichage** : ne s'adapte pas aux écrans 120Hz ou 144Hz
- **Peut entrer en conflit avec d'autres animations** : cause des bugs visuels

**Impact** :
- **Lag visible** lors de l'inertie
- **Consommation CPU élevée** même quand l'onglet n'est pas actif
- **FPS irréguliers** (peut descendre à 30-40 FPS)

**Solution** :
- **Remplacer par `requestAnimationFrame`** : synchronisé avec le rafraîchissement d'écran
- **Arrêter quand l'onglet n'est pas visible** : utiliser `document.visibilityState` ou `IntersectionObserver`
- **Gérer la fréquence variable** : adapter le calcul de friction en fonction du temps réel écoulé

**Code proposé** :
```javascript
let inertiaFrameId = null;

const applyInertia = (timestamp) => {
  if (!lastInertiaTime) lastInertiaTime = timestamp;
  const deltaTime = timestamp - lastInertiaTime;
  lastInertiaTime = timestamp;
  
  // Calculer la friction en fonction du temps réel (indépendant de la fréquence)
  const frictionFactor = Math.pow(friction, deltaTime / 16); // Normaliser à 16ms
  
  if (Math.abs(inertiaVelocity) < 0.02) {
    cancelAnimationFrame(inertiaFrameId);
    inertiaFrameId = null;
    // ... cleanup
    return;
  }
  
  rotationYRef.current += inertiaVelocity * (deltaTime / 16); // Normaliser
  // ... apply transform
  
  inertiaVelocity *= frictionFactor;
  inertiaFrameId = requestAnimationFrame(applyInertia);
};

// Démarrer
lastInertiaTime = null;
inertiaFrameId = requestAnimationFrame(applyInertia);
```

---

### 2. **Re-attachement des event listeners à chaque changement** ⚠️ CRITIQUE

**Localisation** : `BooksDomeGallery.jsx` ligne 524

```javascript
}, [items.length, rotationY]); // Réexécuter quand les items changent ou la rotation change
```

**Problèmes** :
- **Re-attachement à chaque changement de `rotationY`** : très fréquent pendant le drag/inertie
- **Création de nouvelles fonctions handlers** : allocation mémoire inutile
- **Détachement/attachement coûteux** : peut causer des bugs (listeners perdus)
- **`rotationY` change constamment** : déclenche le useEffect en boucle

**Impact** :
- **Bugs de drag** : les listeners peuvent être détachés pendant un drag actif
- **Lag visible** : re-attachement constant
- **Fuite mémoire potentielle** : anciens listeners non nettoyés correctement

**Solution** :
- **Stabiliser les handlers avec `useCallback`** : éviter la recréation
- **Retirer `rotationY` des dépendances** : utiliser uniquement `items.length`
- **Utiliser des refs pour les valeurs qui changent souvent** : `rotationYRef` au lieu de `rotationY` state

**Code proposé** :
```javascript
// Handlers stables avec useCallback
const handleMouseDown = useCallback((e) => {
  // ... logique
}, []);

const handleMouseMove = useCallback((e) => {
  // ... logique (utilise rotationYRef, pas rotationY)
}, []);

// useEffect ne dépend que de items.length
useEffect(() => {
  // ... attacher listeners
  return cleanup;
}, [items.length]); // rotationY retiré
```

---

### 3. **Pas de throttling sur mousemove/touchmove** ⚠️ MOYEN

**Localisation** : `BooksDomeGallery.jsx` lignes 296, 403

**Problèmes** :
- **`mousemove` peut déclencher 100+ fois par seconde** : surcharge le thread principal
- **Chaque événement recalcule et applique le transform** : très coûteux
- **Pas de gestion des événements en rafale** : peut causer des frames sautées

**Impact** :
- **Lag pendant le drag** : le navigateur ne peut pas suivre
- **FPS réduit** : peut descendre à 20-30 FPS pendant un drag rapide

**Solution** :
- **Throttler avec `requestAnimationFrame`** : limiter à 60 FPS max
- **Accumuler les deltas** : traiter plusieurs mouvements en une seule frame
- **Utiliser `passive: true` pour touchmove** : améliorer le scroll (mais attention, on a besoin de `preventDefault`)

**Code proposé** :
```javascript
let rafId = null;
let pendingDeltaX = 0;
let pendingTime = 0;

const handleMouseMove = (e) => {
  if (!isDragging) return;
  
  const currentX = e.clientX;
  const deltaX = currentX - lastMoveX;
  const currentTime = Date.now();
  
  // Accumuler les deltas
  pendingDeltaX += deltaX;
  pendingTime = currentTime - lastMoveTime;
  lastMoveX = currentX;
  
  // Throttler avec RAF
  if (!rafId) {
    rafId = requestAnimationFrame(() => {
      // Traiter tous les deltas accumulés
      velocity = pendingDeltaX / pendingTime;
      // ... appliquer transform
      pendingDeltaX = 0;
      rafId = null;
    });
  }
};
```

---

### 4. **Manipulation directe du DOM dans les handlers** ⚠️ MOYEN

**Localisation** : `BooksDomeGallery.jsx` lignes 324, 432, 368, 474

```javascript
currentSphereEl.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(0deg) rotateY(${newRotationY}deg)`;
currentSphereEl.style.transition = 'none';
```

**Problèmes** :
- **Force un reflow à chaque frame** : très coûteux
- **Pas de batching** : chaque modification déclenche un recalcul
- **Conflit avec React** : React peut réappliquer les styles et causer des bugs

**Impact** :
- **Lag visible** : reflows constants
- **Bugs visuels** : styles appliqués puis réappliqués par React

**Solution** :
- **Utiliser `requestAnimationFrame` pour batch les updates** : regrouper les modifications
- **Éviter les reflows** : utiliser `transform` uniquement (déjà fait, mais optimiser)
- **Synchroniser avec React** : éviter les conflits en utilisant des refs

**Code proposé** :
```javascript
let transformRafId = null;
let pendingTransform = null;

const applyTransform = (rotationY) => {
  pendingTransform = rotationY;
  
  if (!transformRafId) {
    transformRafId = requestAnimationFrame(() => {
      const sphere = sphereRef.current;
      if (sphere && pendingTransform !== null) {
        sphere.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(0deg) rotateY(${pendingTransform}deg)`;
        pendingTransform = null;
      }
      transformRafId = null;
    });
  }
};
```

---

### 5. **useEffect pour transform entre en conflit avec le drag** ⚠️ MOYEN

**Localisation** : `BooksDomeGallery.jsx` lignes 219-230

```javascript
useEffect(() => {
  const sphere = sphereRef.current;
  if (!sphere) return;
  
  if (draggingRef.current || inertiaActiveRef.current) return;
  
  sphere.style.transition = 'transform 120ms ease-out';
  sphere.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(0deg) rotateY(${rotationY}deg)`;
}, [rotationX, rotationY]);
```

**Problèmes** :
- **Se déclenche à chaque changement de `rotationY`** : même pendant le drag (mais retourne tôt)
- **Peut réappliquer la transition** : entre en conflit avec le drag
- **Double application du transform** : une fois par le drag, une fois par le useEffect

**Impact** :
- **Bugs visuels** : transition appliquée au mauvais moment
- **Lag** : double calcul du transform

**Solution** :
- **Optimiser la condition** : vérifier plus tôt
- **Utiliser un flag plus robuste** : `isDraggingRef` au lieu de `draggingRef.current`
- **Déplacer la logique** : gérer le transform uniquement dans les handlers

**Code proposé** :
```javascript
// Retirer ce useEffect et gérer le transform uniquement dans les handlers
// Le useEffect ne sert que pour l'initialisation
useEffect(() => {
  const sphere = sphereRef.current;
  if (!sphere || draggingRef.current || inertiaActiveRef.current) return;
  
  // Seulement pour l'initialisation ou les changements externes
  if (rotationYRef.current !== rotationY) {
    rotationYRef.current = rotationY;
    sphere.style.transition = 'transform 120ms ease-out';
    sphere.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(0deg) rotateY(${rotationY}deg)`;
  }
}, []); // Dépendances vides - seulement au mount
```

---

### 6. **ResizeObserver sans debounce** ⚠️ FAIBLE

**Localisation** : `BooksDomeGallery.jsx` lignes 168-216

**Problèmes** :
- **Se déclenche à chaque resize** : peut être très fréquent pendant un redimensionnement
- **Recalcule toutes les variables CSS** : coûteux
- **Peut causer des saccades** : si le resize est continu

**Impact** :
- **Lag pendant le resize** : recalculs constants
- **FPS réduit** : pendant le redimensionnement de la fenêtre

**Solution** :
- **Debouncer le ResizeObserver** : limiter à 1 calcul par 100ms
- **Utiliser `requestAnimationFrame`** : synchroniser avec le rafraîchissement

**Code proposé** :
```javascript
let resizeRafId = null;

const ro = new ResizeObserver((entries) => {
  if (resizeRafId) return; // Ignorer si déjà en attente
  
  resizeRafId = requestAnimationFrame(() => {
    const cr = entries[0].contentRect;
    // ... calculs
    // ... appliquer styles
    resizeRafId = null;
  });
});
```

---

### 7. **Tous les items sont rendus même hors écran** ⚠️ MOYEN

**Localisation** : `BooksDomeGallery.jsx` lignes 579-596

```javascript
{items.map((item, index) => (
  <button key={`${item.bookId}-${index}`} ...>
    <div className="books-dome-item__image">
      <img src={item.src} alt={item.alt} loading="lazy" />
    </div>
  </button>
))}
```

**Problèmes** :
- **Tous les items sont dans le DOM** : même ceux derrière la sphère (non visibles)
- **Toutes les images sont chargées** : même si `loading="lazy"`, elles sont dans le DOM
- **Beaucoup d'éléments à gérer** : 35 segments × 5 lignes = 175 items potentiels

**Impact** :
- **Temps de render initial long** : beaucoup d'éléments DOM
- **Consommation mémoire élevée** : toutes les images en mémoire
- **Lag lors du scroll de la page** : beaucoup d'éléments à repaint

**Solution** :
- **Intersection Observer pour les images** : charger uniquement les images visibles
- **Virtualisation optionnelle** : ne rendre que les items visibles (complexe pour une sphère 3D)
- **Optimiser le rendu** : utiliser `React.memo` pour les items (déjà fait avec `memo(BooksDomeGallery)`)

**Code proposé** :
```javascript
// Utiliser Intersection Observer pour charger les images progressivement
const [visibleItems, setVisibleItems] = useState(new Set());

useEffect(() => {
  const observers = items.map((item, index) => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleItems(prev => new Set([...prev, index]));
      }
    }, { threshold: 0.1 });
    
    // Observer l'élément item (nécessite une ref par item)
    return observer;
  });
  
  return () => observers.forEach(obs => obs.disconnect());
}, [items]);
```

**Note** : Cette optimisation est complexe et peut casser l'esthétique. À éviter si possible.

---

### 8. **will-change sur tous les items** ⚠️ FAIBLE

**Localisation** : `booksDome.css` ligne 112

```css
.books-dome-item {
  will-change: transform;
}
```

**Problèmes** :
- **`will-change` sur 175+ éléments** : peut consommer beaucoup de mémoire GPU
- **Force la création de couches composites** : coûteux en mémoire
- **Doit être retiré quand non utilisé** : sinon consommation permanente

**Impact** :
- **Consommation mémoire GPU élevée** : surtout sur machines moins puissantes
- **Lag sur machines faibles** : trop de couches composites

**Solution** :
- **Appliquer `will-change` uniquement pendant le drag** : via JavaScript
- **Retirer après le drag** : pour libérer la mémoire
- **Limiter aux items visibles** : utiliser Intersection Observer

**Code proposé** :
```javascript
// Pendant le drag
items.forEach(item => {
  item.element.style.willChange = 'transform';
});

// Après le drag
items.forEach(item => {
  item.element.style.willChange = 'auto';
});
```

---

### 9. **Pas de gestion de la visibilité de l'onglet** ⚠️ MOYEN

**Problèmes** :
- **L'inertie continue même si l'onglet n'est pas visible** : consommation CPU inutile
- **Les event listeners restent actifs** : même si l'utilisateur est sur un autre onglet
- **ResizeObserver continue** : même si le composant n'est pas visible

**Impact** :
- **Consommation CPU/GPU inutile** : ralentit l'onglet actif
- **Batterie drainée** : sur mobile

**Solution** :
- **Arrêter l'inertie quand l'onglet n'est pas visible** : `document.visibilityState`
- **Pauser les listeners** : désactiver temporairement
- **Intersection Observer** : arrêter si le composant n'est pas visible

**Code proposé** :
```javascript
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden && inertiaFrameId) {
      // Pauser l'inertie
      cancelAnimationFrame(inertiaFrameId);
      inertiaFrameId = null;
    }
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, []);
```

---

### 10. **Calcul de vélocité peut être amélioré** ⚠️ FAIBLE

**Localisation** : `BooksDomeGallery.jsx` lignes 307-309, 415-417

```javascript
if (deltaTime > 0) {
  velocity = moveDeltaX / deltaTime;
}
```

**Problèmes** :
- **Vélocité instantanée peut être erratique** : un mouvement rapide peut donner une vélocité très élevée
- **Pas de moyenne glissante** : peut causer des traînées incohérentes
- **Sensible aux micro-mouvements** : peut déclencher l'inertie pour rien

**Impact** :
- **Traînée incohérente** : parfois trop forte, parfois trop faible
- **Bugs visuels** : la sphère peut "sauter" si la vélocité est mal calculée

**Solution** :
- **Moyenne glissante sur les 3-5 derniers mouvements** : lisser la vélocité
- **Seuil minimum pour déclencher l'inertie** : éviter les micro-mouvements

**Code proposé** :
```javascript
const velocityHistory = [];
const MAX_HISTORY = 5;

const calculateVelocity = (moveDeltaX, deltaTime) => {
  if (deltaTime > 0) {
    const instantVelocity = moveDeltaX / deltaTime;
    velocityHistory.push(instantVelocity);
    if (velocityHistory.length > MAX_HISTORY) {
      velocityHistory.shift();
    }
    
    // Moyenne des dernières vélocités
    const avgVelocity = velocityHistory.reduce((a, b) => a + b, 0) / velocityHistory.length;
    return avgVelocity;
  }
  return 0;
};
```

---

## 📊 Impact estimé par optimisation

| Optimisation | Impact fluidité | Risque | Priorité | Temps |
|--------------|-----------------|--------|----------|-------|
| 1. requestAnimationFrame pour inertie | 🔴 Critique | Faible | Haute | 20 min |
| 2. Stabiliser event listeners | 🔴 Critique | Faible | Haute | 15 min |
| 3. Throttling mousemove/touchmove | 🟡 Moyen | Faible | Moyenne | 25 min |
| 4. Batching DOM updates | 🟡 Moyen | Faible | Moyenne | 20 min |
| 5. Optimiser useEffect transform | 🟡 Moyen | Faible | Moyenne | 10 min |
| 6. Debounce ResizeObserver | 🟢 Faible | Faible | Basse | 10 min |
| 7. Virtualisation items | 🟡 Moyen | **Élevé** | **Basse** | 2h |
| 8. will-change dynamique | 🟢 Faible | Faible | Basse | 15 min |
| 9. Gestion visibilité onglet | 🟡 Moyen | Faible | Moyenne | 15 min |
| 10. Moyenne glissante vélocité | 🟢 Faible | Faible | Basse | 15 min |

**Total estimé (priorités hautes/moyennes)** : ~2h

---

## ✅ Plan d'action recommandé

### Phase 1 : Corrections critiques (50 min)
1. ✅ **Remplacer `setInterval` par `requestAnimationFrame`** pour l'inertie (20 min)
2. ✅ **Stabiliser les event listeners** avec `useCallback` et retirer `rotationY` des dépendances (15 min)
3. ✅ **Optimiser le useEffect transform** pour éviter les conflits (10 min)
4. ✅ **Gérer la visibilité de l'onglet** pour arrêter l'inertie (5 min)

### Phase 2 : Optimisations moyennes (1h)
5. ✅ **Throttler mousemove/touchmove** avec `requestAnimationFrame` (25 min)
6. ✅ **Batching des DOM updates** pour éviter les reflows (20 min)
7. ✅ **will-change dynamique** (appliqué uniquement pendant le drag) (15 min)

### Phase 3 : Améliorations optionnelles (40 min)
8. ✅ **Debounce ResizeObserver** (10 min)
9. ✅ **Moyenne glissante pour la vélocité** (15 min)
10. ⚠️ **Virtualisation items** (EXCLU - trop risqué pour l'esthétique)

---

## 🎯 Résultat attendu

Après les optimisations :
- **Inertie fluide à 60 FPS** : synchronisée avec le rafraîchissement d'écran
- **Drag sans lag** : throttling et batching des updates
- **Pas de bugs** : listeners stables, pas de conflits
- **Consommation CPU réduite** : arrêt quand l'onglet n'est pas visible
- **Esthétique identique** : aucune modification visuelle
- **Comportement identique** : drag, click, traînée inchangés

---

## ⚠️ Tests à effectuer

1. **Drag fluide** : tester avec des mouvements rapides et lents
2. **Traînée cohérente** : vérifier que l'intensité reste identique
3. **Click fonctionnel** : s'assurer que les clics ouvrent toujours le détail
4. **Pas de bugs visuels** : pas de saccades, pas de "sauts"
5. **Performance** : vérifier que le FPS reste à 60 pendant le drag/inertie
6. **Visibilité onglet** : tester que l'inertie s'arrête quand on change d'onglet

---

## 📝 Notes techniques

### Pourquoi `requestAnimationFrame` au lieu de `setInterval` ?
- **Synchronisé avec le rafraîchissement** : évite les frames manquées
- **Pause automatique** : s'arrête quand l'onglet n'est pas visible
- **Adaptatif** : s'adapte aux écrans 120Hz/144Hz
- **Meilleure performance** : le navigateur optimise automatiquement

### Pourquoi stabiliser les listeners ?
- **Évite les re-attachements** : coûteux et peut causer des bugs
- **Réduit les allocations mémoire** : fonctions réutilisées
- **Améliore la performance** : moins de travail pour le navigateur

### Pourquoi throttler mousemove ?
- **Limite à 60 FPS** : même si 100+ événements arrivent
- **Évite la surcharge** : le thread principal peut suivre
- **Améliore la fluidité** : frames plus régulières

---

## 🔗 Références

- [requestAnimationFrame vs setInterval](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)
- [Optimizing CSS for performance](https://web.dev/animations-guide/)
- [Event listener performance](https://web.dev/event-listeners/)
- [Throttling and debouncing](https://web.dev/debounce-your-input-handlers/)

