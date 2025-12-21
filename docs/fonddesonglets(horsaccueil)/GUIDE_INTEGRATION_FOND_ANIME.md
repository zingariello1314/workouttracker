# 🎨 Guide d'Intégration - Fond Animé Vert (Shader) pour Tous les Onglets

## 📋 Vue d'Ensemble

Ce guide décrit comment intégrer **uniquement le fond animé vert** du composant Synthetic Hero dans tous les onglets de votre application **sauf l'onglet accueil**. Le fond utilise React Three Fiber avec des shaders WebGL pour créer un effet visuel animé de lignes vertes tourbillonnantes.

---

## 🎯 Objectif

Créer un composant réutilisable `AnimatedBackground` qui :
- ✅ Affiche uniquement le fond animé vert (shader)
- ✅ S'intègre facilement dans tous les onglets
- ✅ N'affiche aucun élément UI (pas de boutons, badges, texte)
- ✅ Est performant et optimisé
- ✅ Peut être désactivé pour l'onglet accueil

---

## 📦 Dépendances Requises

### Dépendances à Installer

```bash
npm install @react-three/fiber
```

**Note importante** : Vous avez déjà `three` dans votre `package.json` (version 0.181.2), il faudra juste installer `@react-three/fiber`.

### Dépendances Déjà Présentes

- ✅ `react` (^18.2.0)
- ✅ `three` (^0.181.2)
- ✅ `tailwindcss` (^3.3.3)

### Dépendances NON Nécessaires (pour le fond uniquement)

Ces dépendances sont utilisées dans le composant Synthetic Hero complet mais **PAS nécessaires** pour le fond seul :
- ❌ `gsap` (utilisé pour les animations de texte)
- ❌ `@gsap/react` (utilisé pour les animations de texte)
- ❌ `class-variance-authority` (utilisé pour les badges/boutons)
- ❌ `@radix-ui/react-slot` (utilisé pour les boutons)

---

## 🏗️ Structure du Composant

### Analyse du Code Original

Dans le composant `SyntheticHero`, le fond animé est créé par :

1. **ShaderPlane** : Composant React Three Fiber qui rend le shader
2. **vertexShader** : Shader de sommet (simple, passe les coordonnées UV)
3. **fragmentShader** : Shader de fragment (crée l'effet visuel vert animé)
4. **Canvas** : Conteneur React Three Fiber qui gère le rendu WebGL

**Code à extraire** :
- Lignes 44-79 : `ShaderPlane` component
- Lignes 81-87 : `vertexShader`
- Lignes 89-147 : `fragmentShader`
- Lignes 179-185 : `shaderUniforms` (simplifié)
- Lignes 278-286 : Structure Canvas (sans le contenu UI)

---

## 📁 Structure des Fichiers à Créer

```
src/
├── components/
│   └── ui/
│       └── AnimatedBackground.jsx    # Composant de fond animé isolé
```

---

## 💻 Code du Composant AnimatedBackground

### Fichier : `src/components/ui/AnimatedBackground.jsx`

```jsx
"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * Composant ShaderPlane - Rendu du shader animé
 * 
 * Ce composant crée un plan 2D qui affiche le shader de fragment
 * avec animation basée sur le temps.
 */
const ShaderPlane = ({
	vertexShader,
	fragmentShader,
	uniforms,
}) => {
	const meshRef = useRef(null);
	const { size } = useThree();

	// Mise à jour des uniforms à chaque frame pour l'animation
	useFrame((state) => {
		if (meshRef.current) {
			const material = meshRef.current.material;
			if (material && material.uniforms) {
				material.uniforms.u_time.value = state.clock.elapsedTime * 0.5;
				material.uniforms.u_resolution.value.set(size.width, size.height, 1.0);
			}
		}
	});

	return (
		<mesh ref={meshRef}>
			<planeGeometry args={[2, 2]} />
			<shaderMaterial
				vertexShader={vertexShader}
				fragmentShader={fragmentShader}
				uniforms={uniforms}
				side={THREE.FrontSide}
				depthTest={false}
				depthWrite={false}
			/>
		</mesh>
	);
};

/**
 * Vertex Shader - Simple passe-coordonnées UV
 * 
 * Ce shader passe simplement les coordonnées UV au fragment shader.
 */
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

/**
 * Fragment Shader - Effet visuel vert animé
 * 
 * Ce shader crée l'effet de lignes vertes tourbillonnantes
 * avec des transformations polaires et des rotations.
 */
const fragmentShader = `
  precision highp float;

  varying vec2 vUv;
  uniform float u_time;
  uniform vec3 u_resolution;

  vec2 toPolar(vec2 p) {
      float r = length(p);
      float a = atan(p.y, p.x);
      return vec2(r, a);
  }

  vec2 fromPolar(vec2 polar) {
      return vec2(cos(polar.y), sin(polar.y)) * polar.x;
  }

  void mainImage(out vec4 fragColor, in vec2 fragCoord) {
      vec2 p = 6.0 * ((fragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y);

      vec2 polar = toPolar(p);
      float r = polar.x;
      float a = polar.y;

      vec2 i = p;
      float c = 0.0;
      float rot = r + u_time + p.x * 0.100;
      for (float n = 0.0; n < 4.0; n++) {
          float rr = r + 0.15 * sin(u_time*0.7 + float(n) + r*2.0);
          p *= mat2(
              cos(rot - sin(u_time / 10.0)), sin(rot),
              -sin(cos(rot) - u_time / 10.0), cos(rot)
          ) * -0.25;

          float t = r - u_time / (n + 30.0);
          i -= p + sin(t - i.y) + rr;

          c += 2.2 / length(vec2(
              (sin(i.x + t) / 0.15),
              (cos(i.y + t) / 0.15)
          ));
      }

      c /= 8.0;

      vec3 baseColor = vec3(0.2, 0.7, 0.5);
      vec3 finalColor = baseColor * smoothstep(0.0, 1.0, c * 0.6);

      fragColor = vec4(finalColor, 1.0);
  }

  void main() {
      vec4 fragColor;
      vec2 fragCoord = vUv * u_resolution.xy;
      mainImage(fragColor, fragCoord);
      gl_FragColor = fragColor;
  }
`;

/**
 * Composant AnimatedBackground
 * 
 * Composant réutilisable qui affiche uniquement le fond animé vert.
 * À placer en position absolue derrière le contenu de vos onglets.
 * 
 * @param {Object} props
 * @param {string} props.className - Classes CSS additionnelles
 * @param {boolean} props.fixed - Si true, utilise position: fixed au lieu de absolute
 */
const AnimatedBackground = ({ className = "", fixed = false }) => {
	const shaderUniforms = useMemo(
		() => ({
			u_time: { value: 0 },
			u_resolution: { value: new THREE.Vector3(1, 1, 1) },
		}),
		[],
	);

	return (
		<div
			className={`absolute inset-0 z-0 ${fixed ? 'fixed' : ''} ${className}`}
			style={{ pointerEvents: 'none' }}
		>
			<Canvas>
				<ShaderPlane
					vertexShader={vertexShader}
					fragmentShader={fragmentShader}
					uniforms={shaderUniforms}
				/>
			</Canvas>
		</div>
	);
};

export default AnimatedBackground;
```

---

## 🔧 Intégration dans les Onglets

### Méthode 1 : Intégration Directe dans Chaque Onglet

Pour chaque onglet (sauf `HomePage`), ajoutez le composant `AnimatedBackground` :

#### Exemple : `src/components/tabs/NutritionTab.jsx`

```jsx
import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import AnimatedBackground from '../ui/AnimatedBackground'; // ← Ajouter cet import

// ... autres imports

const NutritionTab = () => {
  // ... votre code existant

  return (
    <div className="relative min-h-screen"> {/* ← Ajouter relative */}
      {/* Fond animé */}
      <AnimatedBackground />
      
      {/* Contenu existant avec z-index relatif */}
      <div className="relative z-10 space-y-6 p-6">
        {/* ... votre contenu existant ... */}
      </div>
    </div>
  );
};

export default NutritionTab;
```

#### Points Importants :

1. **Container parent** : Ajoutez `className="relative"` au conteneur principal de l'onglet
2. **AnimatedBackground** : Placez-le en premier, il sera en `z-0` (arrière-plan)
3. **Contenu** : Wrappez votre contenu dans une `div` avec `className="relative z-10"` pour qu'il soit au-dessus du fond

---

### Méthode 2 : Intégration Globale via Layout (Recommandé)

Si vous avez un composant de layout commun pour tous les onglets, intégrez-le là :

#### Exemple : Créer `src/components/layout/TabLayout.jsx`

```jsx
import React from 'react';
import AnimatedBackground from '../ui/AnimatedBackground';

/**
 * Layout commun pour tous les onglets (sauf accueil)
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Contenu de l'onglet
 * @param {string} props.activeTab - Nom de l'onglet actif
 */
const TabLayout = ({ children, activeTab }) => {
  // Ne pas afficher le fond sur l'onglet accueil
  const showBackground = activeTab !== 'home';

  return (
    <div className="relative min-h-screen">
      {showBackground && <AnimatedBackground />}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default TabLayout;
```

Puis dans `App.jsx` ou votre composant de routage :

```jsx
import TabLayout from './components/layout/TabLayout';

// Dans votre rendu conditionnel des onglets :
{activeTab !== 'home' && (
  <TabLayout activeTab={activeTab}>
    {/* Contenu de l'onglet */}
  </TabLayout>
)}
```

---

## 📝 Liste des Onglets à Modifier

D'après votre structure, voici les onglets à modifier (tous sauf `HomePage`) :

### Onglets dans `src/components/tabs/` :

1. ✅ `NutritionTab.jsx`
2. ✅ `ProgressTab.jsx` (Suivi Corporel)
3. ✅ `GarminTab.jsx`
4. ✅ `CalendarTab.jsx` (si existe)
5. ✅ `ProgramTab.jsx` (si existe)
6. ✅ `ChartsTab.jsx` (si existe)
7. ✅ `StatisticsTab.jsx` (si existe)
8. ✅ `ExercisesTab.jsx` (si existe)
9. ✅ `HistoryTab.jsx` (si existe)
10. ✅ `PredictionsTab.jsx`
11. ✅ `SmartBalancingTab.jsx`
12. ✅ `SettingsTab.jsx` (si existe)

### À NE PAS modifier :

- ❌ `HomePage.jsx` (onglet accueil)

---

## 🎨 Personnalisation du Fond

### Ajuster l'Intensité de la Couleur

Dans `AnimatedBackground.jsx`, modifiez la ligne du `fragmentShader` :

```glsl
// Couleur de base (R, G, B) - actuellement vert émeraude
vec3 baseColor = vec3(0.2, 0.7, 0.5); // ← Modifier ces valeurs

// Pour un vert plus foncé :
vec3 baseColor = vec3(0.1, 0.5, 0.3);

// Pour un vert plus clair :
vec3 baseColor = vec3(0.3, 0.9, 0.7);
```

### Ajuster la Vitesse d'Animation

Dans `ShaderPlane`, modifiez le multiplicateur de temps :

```jsx
// Plus lent (actuellement 0.5)
material.uniforms.u_time.value = state.clock.elapsedTime * 0.3;

// Plus rapide
material.uniforms.u_time.value = state.clock.elapsedTime * 0.8;
```

### Ajuster l'Opacité du Fond

Ajoutez une couche de superposition avec opacité :

```jsx
<div className="absolute inset-0 z-0">
  <Canvas>
    <ShaderPlane ... />
  </Canvas>
  {/* Couche de fondu pour réduire l'intensité */}
  <div className="absolute inset-0 bg-black/30" /> {/* ← Ajuster l'opacité */}
</div>
```

---

## ⚡ Optimisations de Performance

### 1. Lazy Loading du Composant

Pour éviter de charger Three.js sur l'onglet accueil :

```jsx
import { lazy, Suspense } from 'react';

const AnimatedBackground = lazy(() => import('../ui/AnimatedBackground'));

// Dans votre composant :
{showBackground && (
  <Suspense fallback={<div className="absolute inset-0 bg-slate-900" />}>
    <AnimatedBackground />
  </Suspense>
)}
```

### 2. Désactiver le Rendu quand l'Onglet n'est pas Visible

```jsx
const AnimatedBackground = ({ className = "", fixed = false, isVisible = true }) => {
  // ... code existant

  if (!isVisible) return null;

  return (
    // ... rendu
  );
};
```

### 3. Réduire la Qualité sur Mobile

```jsx
const AnimatedBackground = ({ className = "", fixed = false }) => {
  const isMobile = window.innerWidth < 768;
  
  return (
    <div className={`absolute inset-0 z-0 ${fixed ? 'fixed' : ''} ${className}`}>
      <Canvas dpr={isMobile ? 1 : 2}> {/* Réduire DPR sur mobile */}
        <ShaderPlane ... />
      </Canvas>
    </div>
  );
};
```

---

## 🐛 Dépannage

### Le fond ne s'affiche pas

1. **Vérifiez que `@react-three/fiber` est installé** :
   ```bash
   npm list @react-three/fiber
   ```

2. **Vérifiez la console pour les erreurs WebGL** :
   - Ouvrez les DevTools (F12)
   - Onglet Console
   - Cherchez les erreurs liées à WebGL ou Three.js

3. **Vérifiez que le conteneur a une hauteur** :
   ```jsx
   <div className="relative min-h-screen"> {/* ← min-h-screen important */}
   ```

### Le fond est trop intense / pas assez visible

- Ajoutez une couche de fondu (voir section "Personnalisation")
- Ajustez la couleur de base dans le fragment shader
- Vérifiez que votre contenu a un `z-index` supérieur

### Performance dégradée

- Activez le lazy loading
- Réduisez la qualité sur mobile (DPR)
- Désactivez le rendu quand l'onglet n'est pas visible

---

## ✅ Checklist d'Implémentation

- [ ] Installer `@react-three/fiber`
- [ ] Créer `src/components/ui/AnimatedBackground.jsx`
- [ ] Tester le composant dans un onglet de test
- [ ] Intégrer dans tous les onglets (sauf accueil)
- [ ] Vérifier que le fond ne s'affiche pas sur l'onglet accueil
- [ ] Ajuster les couleurs/intensité si nécessaire
- [ ] Optimiser les performances (lazy loading, DPR)
- [ ] Tester sur différents navigateurs
- [ ] Tester sur mobile

---

## 📚 Ressources

- [React Three Fiber Documentation](https://docs.pmnd.rs/react-three-fiber)
- [Three.js Documentation](https://threejs.org/docs/)
- [WebGL Shaders Tutorial](https://webglfundamentals.org/webgl/lessons/webgl-shaders-and-glsl.html)

---

## 🎯 Résumé des Étapes

1. **Installation** : `npm install @react-three/fiber`
2. **Création** : Créer `AnimatedBackground.jsx` avec le code fourni
3. **Intégration** : Ajouter `<AnimatedBackground />` dans chaque onglet (sauf accueil)
4. **Styling** : S'assurer que le conteneur parent a `relative` et le contenu a `z-10`
5. **Test** : Vérifier que le fond s'affiche correctement
6. **Personnalisation** : Ajuster couleurs/vitesse selon vos préférences

---

**Note** : Ce guide se concentre uniquement sur le fond animé. Tous les éléments UI (boutons, badges, texte) du composant Synthetic Hero original sont exclus intentionnellement.

