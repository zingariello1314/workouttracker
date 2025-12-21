# Guide d'Intégration du Robot Spline sur la Page d'Accueil

## 📋 Vue d'Ensemble

Ce guide explique comment intégrer **uniquement** un robot 3D Spline qui suit la souris avec la tête sur votre page d'accueil, sans les éléments décoratifs (Card, Spotlight, textes, etc.).

**Résultat attendu** : Un robot 3D interactif positionné sur votre page d'accueil qui suit les mouvements de la souris avec sa tête, exactement comme sur [21st.dev/community/components/serafim/splite/default](https://21st.dev/community/components/serafim/splite/default).

---

## 🎯 Ce que vous obtiendrez

✅ Un composant React minimal pour afficher la scène Spline  
✅ Le robot positionné sur votre page d'accueil  
✅ Le robot qui suit la souris avec la tête (comportement géré par Spline)  
❌ **PAS** de Card, Spotlight, ou autres éléments décoratifs  
❌ **PAS** de textes ou contenus additionnels  

---

## 📦 Étape 1 : Installation des Dépendances

Installez les packages nécessaires pour Spline :

```bash
npm install @splinetool/runtime @splinetool/react-spline
```

**Note** : `framer-motion` est déjà installé dans votre projet, pas besoin de le réinstaller.

---

## 🛠️ Étape 2 : Création du Composant SplineScene

Créez le fichier `src/components/ui/SplineScene.jsx` avec le code minimal suivant :

```jsx
import React, { Suspense, lazy } from 'react';
const Spline = lazy(() => import('@splinetool/react-spline'));

/**
 * Composant SplineScene - Affiche une scène 3D Spline
 * 
 * @param {string} scene - URL de la scène Spline (.splinecode)
 * @param {string} className - Classes CSS optionnelles
 * @param {function} onLoad - Callback appelé quand la scène est chargée
 */
export function SplineScene({ scene, className = '', onLoad }) {
  return (
    <Suspense 
      fallback={
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
        </div>
      }
    >
      <Spline
        scene={scene}
        className={className}
        onLoad={onLoad}
      />
    </Suspense>
  );
}
```

**Points importants** :
- ✅ Utilise `lazy()` pour charger Spline uniquement quand nécessaire (optimisation performance)
- ✅ Affiche un loader pendant le chargement
- ✅ Supporte `className` pour le positionnement et le style
- ✅ Supporte `onLoad` pour accéder à la scène si nécessaire

---

## 📍 Étape 3 : Où placer le robot sur HomePage.jsx

### Option 1 : Position fixe (recommandé pour commencer)

Ajoutez le robot dans une position fixe sur la page d'accueil, par exemple dans le coin supérieur droit :

```jsx
// Dans src/components/HomePage.jsx

import { SplineScene } from './ui/SplineScene';

// ... dans le return de HomePage, après les images de fond :

{/* Robot Spline - Position fixe */}
<div className="fixed top-8 right-8 w-64 h-64 z-50 pointer-events-none">
  <SplineScene 
    scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
    className="w-full h-full"
  />
</div>
```

**Explication** :
- `fixed` : Position fixe par rapport à la fenêtre
- `top-8 right-8` : 2rem (32px) du haut et de la droite
- `w-64 h-64` : Taille 256px × 256px (ajustez selon vos besoins)
- `z-50` : Au-dessus des autres éléments
- `pointer-events-none` : Le robot ne bloque pas les interactions avec le reste de la page

### Option 2 : Position absolue dans le conteneur principal

Si vous préférez que le robot soit positionné par rapport au conteneur principal :

```jsx
// Dans le conteneur principal (après les images de fond)

<div className="absolute top-0 right-0 w-64 h-64 z-50 pointer-events-none">
  <SplineScene 
    scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
    className="w-full h-full"
  />
</div>
```

### Option 3 : Position responsive (mobile/desktop)

Pour une meilleure expérience sur tous les écrans :

```jsx
<div className="fixed top-4 right-4 md:top-8 md:right-8 w-32 h-32 md:w-64 md:h-64 z-50 pointer-events-none">
  <SplineScene 
    scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
    className="w-full h-full"
  />
</div>
```

**Explication** :
- Mobile : `top-4 right-4 w-32 h-32` (128px, positionnée près du bord)
- Desktop : `md:top-8 md:right-8 md:w-64 md:h-64` (256px, positionnée plus loin)

---

## 🎨 Étape 4 : Styles et Personnalisation

### Ajuster la taille du robot

Modifiez les classes `w-*` et `h-*` :

```jsx
// Petit robot
<div className="fixed top-8 right-8 w-48 h-48 z-50">
  {/* 192px × 192px */}
</div>

// Grand robot
<div className="fixed top-8 right-8 w-96 h-96 z-50">
  {/* 384px × 384px */}
</div>
```

### Ajuster la position

```jsx
// Coin supérieur gauche
<div className="fixed top-8 left-8 ...">

// Coin inférieur droit
<div className="fixed bottom-8 right-8 ...">

// Centré en haut
<div className="fixed top-8 left-1/2 transform -translate-x-1/2 ...">
```

### Ajouter des effets visuels (optionnel)

Si vous souhaitez ajouter un léger effet de glow ou de shadow :

```jsx
<div className="fixed top-8 right-8 w-64 h-64 z-50 pointer-events-none">
  <div className="w-full h-full drop-shadow-2xl">
    <SplineScene 
      scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
      className="w-full h-full"
    />
  </div>
</div>
```

---

## 🖱️ Étape 5 : Comment fonctionne le suivi de la souris

**Important** : Le comportement de suivi de la souris avec la tête est **géré directement par la scène Spline**, pas par votre code React.

### Comment ça marche

1. **La scène Spline contient le script** : Quand vous créez ou utilisez une scène Spline, le comportement interactif (suivi de souris) est défini dans l'éditeur Spline.

2. **Spline gère automatiquement** : Le package `@splinetool/react-spline` charge la scène et tous ses comportements, y compris le suivi de la souris.

3. **Vous n'avez rien à faire** : Si la scène URL que vous utilisez contient un robot configuré pour suivre la souris, cela fonctionnera automatiquement.

### Si vous voulez créer votre propre scène avec suivi de souris

1. Créez un compte sur [spline.design](https://spline.design)
2. Créez une nouvelle scène
3. Importez ou créez votre robot 3D
4. Dans l'éditeur Spline, ajoutez un script "Look At Mouse" ou "Mouse Follow" à la tête du robot
5. Exportez et publiez la scène
6. Utilisez l'URL `.splinecode` générée dans votre composant

---

## ✅ Étape 6 : Code Final Complet

Voici l'intégration complète dans `HomePage.jsx` :

```jsx
// En haut du fichier, avec les autres imports
import { SplineScene } from './ui/SplineScene';

// Dans le return de HomePage, après les divs d'images de fond et avant le contenu principal :

{/* Robot Spline - Suit la souris avec la tête */}
<div className="fixed top-8 right-8 w-64 h-64 z-50 pointer-events-none">
  <SplineScene 
    scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
    className="w-full h-full"
  />
</div>
```

---

## 🚫 Ce qu'il ne faut PAS mettre

Pour obtenir **uniquement** le robot, ne mettez **PAS** :

❌ **Card** : Pas besoin de wrapper dans un Card  
❌ **Spotlight** : Pas d'effet de lumière animé  
❌ **Textes** : Pas de titre "Interactive 3D" ou descriptions  
❌ **Layout flex** : Pas de structure avec colonnes gauche/droite  
❌ **Background coloré** : Pas de fond `bg-black/[0.96]`  

**Résultat minimal** = juste le conteneur avec `SplineScene` à l'intérieur.

---

## 🎯 Exemple d'Intégration Complète

```jsx
// src/components/HomePage.jsx (extrait)

import React, { useState, useEffect, useRef } from 'react';
import { SplineScene } from './ui/SplineScene';
// ... autres imports

const HomePage = () => {
  // ... votre code existant

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Images de fond existantes */}
      {/* ... */}

      {/* Robot Spline - UNIQUEMENT le robot */}
      <div className="fixed top-8 right-8 w-64 h-64 z-50 pointer-events-none">
        <SplineScene 
          scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
          className="w-full h-full"
        />
      </div>

      {/* Contenu principal existant */}
      <main className="relative z-10 flex-1 flex items-center justify-start px-8 pt-12 pb-12 min-h-0 overflow-hidden">
        {/* ... votre contenu existant */}
      </main>
    </div>
  );
};

export default HomePage;
```

---

## 🔍 Vérification et Dépannage

### Le robot n'apparaît pas

1. ✅ Vérifiez que les dépendances sont installées : `npm list @splinetool/react-spline`
2. ✅ Vérifiez que l'URL de la scène est correcte et accessible
3. ✅ Ouvrez la console du navigateur pour voir les erreurs
4. ✅ Vérifiez que le conteneur a une taille définie (`w-* h-*`)

### Le robot n suit pas la souris

1. ✅ Vérifiez que la scène Spline utilisée contient le comportement "Look At Mouse"
2. ✅ Testez avec l'URL de la démo : `https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode`
3. ✅ Assurez-vous que `pointer-events-none` n'est pas appliqué au composant Spline lui-même (seulement au conteneur)

### Performances

- ✅ Le lazy loading est déjà activé dans `SplineScene`
- ✅ Si le robot est trop lourd, réduisez sa taille avec `w-* h-*`
- ✅ Considérez charger le robot uniquement sur desktop avec une condition `useState` et `window.innerWidth`

---

## 📝 Résumé des Fichiers à Créer/Modifier

1. **Créer** : `src/components/ui/SplineScene.jsx`
2. **Modifier** : `src/components/HomePage.jsx` (ajouter import et composant)
3. **Installer** : `@splinetool/runtime` et `@splinetool/react-spline`

---

## 🎉 Résultat Final

Vous devriez maintenant avoir :
- ✅ Un robot 3D Spline sur votre page d'accueil
- ✅ Le robot qui suit la souris avec la tête automatiquement
- ✅ Aucun élément décoratif supplémentaire
- ✅ Code minimal et performant

Le robot apparaîtra dans le coin supérieur droit (ou la position que vous aurez choisie) et suivra les mouvements de votre souris avec sa tête, exactement comme sur le site de référence !

