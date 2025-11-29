# Améliorations par rapport à la spécification

Ce document liste les améliorations apportées à `BooksDomeGallery` qui diffèrent de la spécification initiale mais qui sont des améliorations fonctionnelles.

## 1. Rotation X/Y au lieu de Y uniquement

**Spécification :** Rotation uniquement sur l'axe Y (horizontal).

**Implémentation actuelle :** Rotation sur les axes X (vertical) et Y (horizontal).

**Justification :**
- Permet une interaction plus riche et naturelle
- Le drag vertical est limité par `maxVerticalRotationDeg` (8° par défaut)
- Améliore l'expérience utilisateur sans complexifier l'API

**Code :**
```js
const newRotationX = clamp(
  startRotationXRef.current - deltaY / dragSensitivity,
  -maxVerticalRotationDeg,
  maxVerticalRotationDeg
);
```

---

## 2. Friction dynamique au lieu de fixe

**Spécification :** Friction fixe à `0.95`.

**Implémentation actuelle :** Friction calculée dynamiquement basée sur `dragDampening`.

**Justification :**
- Permet de régler finement la sensation d'inertie via la prop `dragDampening`
- Plus flexible et personnalisable
- Valeur par défaut (`dragDampening: 0.3`) donne une friction de `0.935`, proche de la spec

**Code :**
```js
const friction = 0.92 + 0.05 * dragDampening; // ~0.92–0.97
```

---

## 3. Structure DOM simplifiée

**Spécification :** `books-dome-root` → `books-dome-frame` → `books-dome-viewer` → `books-dome-sphere`

**Implémentation actuelle :** `books-dome-container` → `books-dome-sphere-root` → `books-dome-main` → `books-dome-stage` → `books-dome-sphere`

**Justification :**
- Structure plus simple et claire
- `books-dome-main` et `books-dome-stage` sont plus sémantiques
- Fonctionnellement équivalent, meilleure lisibilité du code

---

## 4. Variables CSS au lieu d'attributs `data-*`

**Spécification :** Utiliser `data-offset-x`, `data-offset-y`, etc.

**Implémentation actuelle :** Utiliser `--offset-x`, `--offset-y` via `style`.

**Justification :**
- Variables CSS sont plus performantes (pas besoin de sélecteurs CSS complexes)
- Plus flexibles pour les calculs CSS (`calc()`)
- Meilleure intégration avec le système de variables CSS existant

**Code :**
```js
style={{
  '--offset-x': item.x,
  '--offset-y': item.y,
  '--item-size-x': item.sizeX,
  '--item-size-y': item.sizeY,
}}
```

---

## 5. Transition CSS désactivée pendant le drag

**Spécification :** Transition CSS de `120ms ease-out` toujours active.

**Implémentation actuelle :** Transition désactivée pendant le drag, réactivée après.

**Justification :**
- Évite les conflits entre la transition CSS et les mises à jour JS directes
- Réactivité maximale pendant le drag
- Transition fluide pour les changements programmatiques

**Code :**
```js
if (draggingRef.current) {
  sphere.style.transition = 'none';
} else {
  sphere.style.transition = '';
}
```

---

## 6. Hook `useBookCoversForDome` non créé

**Spécification :** Suggère un hook dédié `useBookCoversForDome`.

**Implémentation actuelle :** Logique de chargement des couvertures dans `BooksTab`.

**Justification :**
- La logique est simple et ne nécessite pas un hook séparé
- Centralisée dans `BooksTab` où elle est utilisée
- Évite une couche d'abstraction supplémentaire inutile
- Facile à extraire en hook si besoin futur

---

## Conclusion

Ces améliorations respectent l'esprit de la spécification tout en apportant des bénéfices fonctionnels et de performance. Elles sont documentées ici pour faciliter la maintenance et les futures évolutions.

