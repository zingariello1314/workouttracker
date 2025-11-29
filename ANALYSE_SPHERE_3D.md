# Analyse comparative : Spécification vs Code actuel - Sphère 3D

## ✅ Points conformes à la spécification

1. **`buildDomeItems`** : Implémentée correctement avec la grille polaire (xCols, evenYs, oddYs)
2. **Structure DOM** : Classes CSS alignées (`books-dome-container`, `books-dome-sphere-root`, etc.)
3. **Drag + Inertie** : Gestion X/Y avec `requestAnimationFrame`, paramètres `dragSensitivity`, `dragDampening`, `maxVerticalRotationDeg`
4. **Overlay de zoom** : Implémenté avec scrim, image agrandie, métadonnées, fermeture par Échap
5. **Tests unitaires** : 10 tests passent pour `buildDomeItems` et `clamp`
6. **Lazy loading** : `React.lazy` utilisé dans `BooksTab`
7. **Props de réglage** : `dragSensitivity`, `dragDampening`, `maxVerticalRotationDeg` exposées et utilisées

---

## ❌ Écarts identifiés avec la spécification

### 1. **Filtre des livres pour la sphère** (Section 1.1 & 6.1)

**Spécification :**
```ts
libraryBooks = books.filter(b => b.status === 'in-progress' && b.hasCover)
```

**Code actuel :**
```js
books.filter((b) => coverUrls[b.id])  // Tous les statuts, pas seulement 'in-progress'
```

**Impact :** La sphère affiche actuellement TOUS les livres avec couverture, pas seulement ceux "en cours".

**Action requise :** Ajouter le filtre `b.status === 'in-progress'` dans `domeBooks`.

---

### 2. **Nombre de segments par défaut** (Section 2.1)

**Spécification :**
```ts
function buildDomeItems(books: DomeBook[], segments = 35): DomeItem[];
```

**Code actuel :**
```js
const DEFAULT_SEGMENTS = 30;
```

**Impact :** La grille a 30 colonnes au lieu de 35, donc moins de tuiles affichées.

**Action requise :** Changer `DEFAULT_SEGMENTS` de 30 à 35.

---

### 3. **Prop `maxSegments` manquante** (Section 3.1)

**Spécification :**
```tsx
type BooksDomeGalleryProps = {
  books: DomeBook[];
  onBookOpen?: (bookId: string) => void;
  maxSegments?: number;  // ❌ MANQUANT
  className?: string;
};
```

**Code actuel :** La prop `maxSegments` n'existe pas.

**Impact :** Impossible de limiter dynamiquement le nombre de segments depuis `BooksTab`.

**Action requise :** Ajouter la prop `maxSegments` et l'utiliser dans `buildDomeItems`.

---

### 4. **Bouton "Activer la vue 3D" / `show3D`** (Section 6.1)

**Spécification :**
```tsx
{show3D && (
  <Suspense fallback={...}>
    <BooksDomeGallery ... />
  </Suspense>
)}
// Le bouton "Activer la vue 3D" ne fait que basculer show3D
```

**Code actuel :** La sphère est **toujours visible**, pas de bouton `show3D`.

**Impact :** La vue 3D ne peut pas être désactivée, contrairement à la spec.

**Action requise :** 
- Ajouter un état `show3D` dans `BooksTab`
- Ajouter un bouton pour activer/désactiver
- Rendre le rendu conditionnel

---

### 5. **Prop `className` manquante** (Section 3.1)

**Spécification :**
```tsx
className?: string;
```

**Code actuel :** La prop `className` n'existe pas.

**Impact :** Impossible d'appliquer des classes CSS personnalisées depuis l'extérieur.

**Action requise :** Ajouter la prop `className` et l'appliquer au conteneur racine.

---

### 6. **Structure DOM différente** (Section 3.2)

**Spécification :**
```tsx
<div className="books-dome-root">
  <div ref={frameRef} className="books-dome-frame">
    <div ref={viewerRef} className="books-dome-viewer">
      <div ref={sphereRef} className="books-dome-sphere">
```

**Code actuel :**
```tsx
<div className="books-dome-container">
  <div ref={rootRef} className="books-dome-sphere-root">
    <main ref={mainRef} className="books-dome-main">
      <div className="books-dome-stage">
        <div ref={sphereRef} className="books-dome-sphere">
```

**Impact :** Structure DOM différente de la spec (manque `books-dome-frame` et `books-dome-viewer`, utilise `books-dome-main` et `books-dome-stage` à la place).

**Action requise :** Aligner la structure DOM avec la spec OU documenter que c'est une variation acceptable.

---

### 7. **Attributs `data-*` vs variables CSS** (Section 3.2)

**Spécification :**
```tsx
data-offset-x={item.x}
data-offset-y={item.y}
data-size-x={item.sizeX}
data-size-y={item.sizeY}
```

**Code actuel :**
```tsx
style={{
  '--offset-x': item.x,
  '--offset-y': item.y,
  '--item-size-x': item.sizeX,
  '--item-size-y': item.sizeY,
}}
```

**Impact :** Utilise des variables CSS au lieu d'attributs `data-*`. Fonctionnel mais différent de la spec.

**Action requise :** Utiliser les attributs `data-*` comme dans la spec OU documenter que les variables CSS sont préférées pour les performances.

---

### 8. **Dépendances `useMemo` incomplètes** (Section 2.3)

**Spécification :**
```ts
// appelée dans un useMemo côté BooksDomeGallery (dépendance [books, segments])
```

**Code actuel :**
```js
const items = useMemo(() => buildDomeItems(books, DEFAULT_SEGMENTS), [books]);
```

**Impact :** Si `segments` change, le `useMemo` ne se recalcule pas (mais `segments` est constant actuellement).

**Action requise :** Ajouter `segments` dans les dépendances OU utiliser une prop `segments` dynamique.

---

### 9. **Shuffle non Fisher-Yates** (Section 2.3)

**Spécification :**
```ts
// appliquer un léger shuffle local (optionnel) pour éviter les répétitions consécutives,
// avec un algo O(n) (Fisher–Yates) sur looped.
```

**Code actuel :** Utilise un shuffle simple qui échange seulement les doublons consécutifs, pas un vrai Fisher-Yates.

**Impact :** Le shuffle est moins efficace et peut laisser des répétitions.

**Action requise :** Implémenter un vrai Fisher-Yates OU documenter que le shuffle actuel est suffisant.

---

### 10. **Pointer Events non utilisés** (Section 4.2)

**Spécification :**
```ts
// onPointerDown (mousedown / touchstart unifiés via Pointer Events si possible)
```

**Code actuel :** Utilise `mousedown`/`touchstart` séparés au lieu de Pointer Events unifiés.

**Impact :** Code plus verbeux, moins moderne, mais fonctionnel.

**Action requise :** Utiliser Pointer Events (`pointerdown`, `pointermove`, `pointerup`) pour unifier souris/touch.

---

### 11. **Sensibilité drag différente** (Section 4.2)

**Spécification :**
```ts
newRotationY = startRotationYRef.current + deltaX * sensitivity  // (0.3)
```

**Code actuel :**
```js
const newRotationY = startRotationYRef.current + deltaX / dragSensitivity;  // (50)
```

**Impact :** La formule est inversée (division au lieu de multiplication). Les valeurs par défaut sont différentes (0.3 vs 50).

**Action requise :** Vérifier que le comportement est correct malgré la formule différente, OU aligner avec la spec.

---

### 12. **Inertie : friction différente** (Section 4.3)

**Spécification :**
```ts
inertiaVelocityRef.current *= 0.95; // friction
```

**Code actuel :**
```js
const friction = 0.92 + 0.05 * dragDampening; // ~0.92–0.97
v *= friction;
```

**Impact :** La friction est calculée dynamiquement au lieu d'être fixe à 0.95. Plus flexible mais différent de la spec.

**Action requise :** Documenter que c'est une amélioration OU aligner avec la spec (friction fixe 0.95).

---

### 13. **Transform de la sphère : rotationX incluse** (Section 4.3)

**Spécification :**
```ts
transform: `translateZ(calc(var(--radius) * -1)) rotateX(0deg) rotateY(${rotationY}deg)`
```

**Code actuel :**
```js
transform: `translateZ(calc(var(--radius) * -1)) rotateX(${rotationX}deg) rotateY(${rotationY}deg)`
```

**Impact :** Le code gère `rotationX` (drag vertical) alors que la spec montre `rotateX(0deg)`. C'est une amélioration mais différent de la spec.

**Action requise :** Documenter que c'est une amélioration (drag X/Y au lieu de Y uniquement).

---

### 14. **Transition CSS sur la sphère** (Section 3.3)

**Spécification :**
```css
.books-dome-sphere {
  transition: transform 120ms ease-out;
}
```

**Code actuel :** Pas de transition CSS, le transform est appliqué directement via JS.

**Impact :** Pas de transition fluide lors des changements de rotation (mais peut-être intentionnel pour le drag).

**Action requise :** Ajouter la transition CSS OU documenter pourquoi elle n'est pas souhaitée (pour le drag direct).

---

### 15. **Tests unitaires drag/inertie manquants** (Section 8.4)

**Spécification :**
```ts
// Reste principalement à écrire quelques tests unitaires :
// - sur buildDomeItems (structure de la grille, bouclage des livres),
// - sur la logique de drag/inertie (au moins vérifier que les bornes sont respectées).
```

**Code actuel :** Tests pour `buildDomeItems` et `clamp` existent, mais pas pour la logique de drag/inertie.

**Impact :** Pas de garantie que les bornes de rotation sont respectées.

**Action requise :** Ajouter des tests pour vérifier que `rotationX` est bien borné entre `-maxVerticalRotationDeg` et `+maxVerticalRotationDeg`.

---

### 16. **Vérification performance 200-300 items** (Section 7)

**Spécification :**
```ts
// Tests & perfs :
// - vérifier fluidité pour ~200–300 items,
```

**Code actuel :** Pas de test de performance documenté.

**Impact :** Pas de garantie que la sphère reste fluide avec beaucoup d'items.

**Action requise :** Tester manuellement ou ajouter un test de performance avec 200-300 items.

---

### 17. **Vérification mobile / petites résolutions** (Section 7)

**Spécification :**
```ts
// - vérifier comportement sur mobiles / petites résolutions,
```

**Code actuel :** Pas de test mobile documenté.

**Impact :** Pas de garantie que la sphère fonctionne bien sur mobile.

**Action requise :** Tester sur mobile ou petites résolutions.

---

### 18. **Surveillance libération ObjectURL** (Section 7)

**Spécification :**
```ts
// - surveiller la libération des ObjectURL (pas de fuite mémoire).
```

**Code actuel :** Les ObjectURL sont gérés dans `BooksTab`, pas dans `BooksDomeGallery`. Pas de vérification explicite de la libération.

**Impact :** Risque de fuite mémoire si les ObjectURL ne sont pas libérés correctement.

**Action requise :** Vérifier que `URL.revokeObjectURL` est appelé correctement dans `BooksTab` quand les livres changent.

---

### 19. **Hook `useBookCoversForDome` mentionné mais non utilisé** (Section 1.1)

**Spécification :**
```ts
// chargé sur demande et mis en cache dans BooksDomeGallery ou dans un petit hook dédié
// (useBookCoversForDome).
```

**Code actuel :** Pas de hook dédié, la logique est dans `BooksTab`.

**Impact :** Pas critique, mais la spec suggère un hook dédié.

**Action requise :** Créer le hook OU documenter que la logique dans `BooksTab` est suffisante.

---

### 20. **Aucun appel IndexedDB quand vue 3D désactivée** (Section 6.1)

**Spécification :**
```ts
// s'assurer qu'aucun appel IndexedDB ne se fait quand la vue 3D est désactivée.
```

**Code actuel :** La vue 3D est toujours visible, donc cette vérification n'a pas de sens actuellement.

**Impact :** Si on ajoute `show3D`, il faudra s'assurer qu'aucun appel IndexedDB n'est fait quand désactivé.

**Action requise :** Quand `show3D` sera implémenté, vérifier qu'aucun appel IndexedDB n'est fait quand `show3D === false`.

---

## 📋 Résumé des actions à effectuer

| # | Élément | Priorité | Complexité |
|---|---------|----------|------------|
| 1 | Filtrer `domeBooks` sur `status === 'in-progress'` | 🔴 Haute | ⚡ Facile |
| 2 | Changer `DEFAULT_SEGMENTS` de 30 à 35 | 🟡 Moyenne | ⚡ Facile |
| 3 | Ajouter prop `maxSegments` | 🟡 Moyenne | ⚡ Facile |
| 4 | Ajouter bouton `show3D` + rendu conditionnel | 🟡 Moyenne | ⚡ Facile |
| 5 | Ajouter prop `className` | 🟢 Basse | ⚡ Facile |
| 6 | Aligner structure DOM avec spec (ou documenter) | 🟢 Basse | ⚡ Facile |
| 7 | Utiliser attributs `data-*` ou documenter variables CSS | 🟢 Basse | ⚡ Facile |
| 8 | Ajouter `segments` dans dépendances `useMemo` | 🟢 Basse | ⚡ Facile |
| 9 | Implémenter Fisher-Yates ou documenter shuffle actuel | 🟢 Basse | ⚡ Moyenne |
| 10 | Utiliser Pointer Events au lieu de mousedown/touchstart | 🟡 Moyenne | ⚡ Facile |
| 11 | Vérifier/aligner formule sensibilité drag | 🟡 Moyenne | ⚡ Facile |
| 12 | Documenter friction dynamique ou aligner avec spec | 🟢 Basse | ⚡ Facile |
| 13 | Documenter rotationX comme amélioration | 🟢 Basse | ⚡ Facile |
| 14 | Ajouter transition CSS ou documenter pourquoi absente | 🟢 Basse | ⚡ Facile |
| 15 | Ajouter tests unitaires drag/inertie (bornes) | 🟡 Moyenne | ⚡ Moyenne |
| 16 | Tester performance avec 200-300 items | 🟡 Moyenne | ⚡ Moyenne |
| 17 | Tester sur mobile / petites résolutions | 🟡 Moyenne | ⚡ Moyenne |
| 18 | Vérifier libération ObjectURL (pas de fuite) | 🔴 Haute | ⚡ Facile |
| 19 | Créer hook `useBookCoversForDome` ou documenter | 🟢 Basse | ⚡ Moyenne |
| 20 | Vérifier aucun appel IndexedDB quand `show3D === false` | 🟡 Moyenne | ⚡ Facile |

---

## 🎯 Conclusion

**État actuel :** ~75% conforme à la spécification (20 écarts identifiés).

**Points critiques (🔴) :**
- Le filtre des livres (tous les statuts au lieu de seulement "in-progress")
- Vérification libération ObjectURL (risque de fuite mémoire)

**Points importants (🟡) :**
- Le nombre de segments (30 au lieu de 35)
- Bouton pour activer/désactiver la vue 3D (`show3D`)
- Props `maxSegments` et `className` pour plus de flexibilité
- Utiliser Pointer Events au lieu de mousedown/touchstart
- Tests unitaires drag/inertie
- Tests de performance (200-300 items, mobile)

**Points mineurs (🟢) :**
- Structure DOM différente (mais fonctionnelle)
- Attributs `data-*` vs variables CSS (mais fonctionnel)
- Shuffle non Fisher-Yates (mais suffisant)
- Friction dynamique vs fixe (amélioration)
- RotationX incluse (amélioration)

**Note :** Certains écarts sont en fait des **améliorations** (rotationX, friction dynamique), mais ils diffèrent de la spec. Il faudra soit les documenter comme améliorations, soit les aligner avec la spec.

**Complexité globale :** La plupart des corrections sont **faciles** (modifications simples), quelques-unes sont **moyennes** (tests, Pointer Events).

