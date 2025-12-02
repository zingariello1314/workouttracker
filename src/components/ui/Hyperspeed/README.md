# 🚀 Hyperspeed - Animation 3D de Fond

## 📋 Description

**Hyperspeed** est un composant React qui crée une animation 3D immersive de route avec lumières de voiture en mouvement. L'effet utilise **Three.js** pour le rendu WebGL et **postprocessing** pour les effets visuels avancés (Bloom, SMAA).

## 🎯 Utilisation

### Import de base

```jsx
import Hyperspeed from './ui/Hyperspeed/Hyperspeed';
import { hyperspeedPresets } from './ui/Hyperspeed/hyperspeedPresets';

// Utilisation simple avec preset
<Hyperspeed effectOptions={hyperspeedPresets.one} />
```

### Intégration dans AuthPage

```jsx
<div className="relative min-h-screen">
  {/* Fond animé */}
  <div className="fixed inset-0 z-0">
    <Hyperspeed effectOptions={hyperspeedPresets.one} />
  </div>
  
  {/* Contenu au-dessus */}
  <div className="relative z-10">
    {/* Vos composants */}
  </div>
</div>
```

## 🎨 Presets Disponibles

### `hyperspeedPresets.one` (Recommandé)
- **Distortion** : `turbulentDistortion`
- **Couleurs** : Violets/Roses et Bleus/Cyan
- **Performance** : Optimale
- **Usage** : Page de connexion, fonds sombres

### `hyperspeedPresets.two`
- **Distortion** : `mountainDistortion`
- **Couleurs** : Tons chauds
- **Usage** : Variante alternative

### Autres presets
Consultez `hyperspeedPresets.js` pour la liste complète.

## ⚙️ Options de Configuration

```javascript
const customOptions = {
  // Distortion
  distortion: 'turbulentDistortion', // 'turbulentDistortion' | 'mountainDistortion' | 'xyDistortion' | etc.
  
  // Dimensions
  length: 400,              // Longueur de la route
  roadWidth: 10,            // Largeur de la route
  islandWidth: 2,           // Largeur de l'îlot central
  lanesPerRoad: 3,          // Nombre de voies par route
  
  // Caméra
  fov: 90,                  // Champ de vision
  fovSpeedUp: 150,          // FOV lors de l'accélération
  
  // Animation
  speedUp: 2,               // Multiplicateur de vitesse
  carLightsFade: 0.4,       // Fade des lumières de voiture
  
  // Éléments visuels
  totalSideLightSticks: 20, // Nombre de bâtons lumineux
  lightPairsPerRoadWay: 40, // Paires de lumières par voie
  
  // Couleurs
  colors: {
    roadColor: 0x080808,
    islandColor: 0x0a0a0a,
    background: 0x000000,
    leftCars: [0xd856bf, 0x6750a2, 0xc247ac],
    rightCars: [0x03b3c3, 0x0e5ea5, 0x324555],
    sticks: 0x03b3c3
  }
};
```

## 🚀 Optimisations

### Détection Mobile

Le composant détecte automatiquement les appareils mobiles et réduit la qualité pour maintenir les performances :

```jsx
const isMobile = window.innerWidth < 768;
const optimizedOptions = isMobile
  ? {
      ...hyperspeedPresets.one,
      totalSideLightSticks: 15,  // Réduit de 20 à 15
      lightPairsPerRoadWay: 30,  // Réduit de 40 à 30
      lanesPerRoad: 2,           // Réduit de 3 à 2
    }
  : hyperspeedPresets.one;
```

### Pause Automatique

L'animation se met automatiquement en pause quand la page n'est pas visible (onglet inactif) pour économiser les ressources.

### Fallback WebGL

Si WebGL n'est pas supporté, le composant affiche un fond statique :

```jsx
const [webglSupported, setWebglSupported] = useState(true);

useEffect(() => {
  setWebglSupported(checkWebGLSupport());
}, []);

{webglSupported ? (
  <Hyperspeed effectOptions={options} />
) : (
  <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />
)}
```

## 🐛 Troubleshooting

### L'animation ne démarre pas

1. **Vérifier WebGL** : Ouvrir la console et vérifier les messages "Hyperspeed:"
2. **Vérifier les dimensions** : Le container doit avoir des dimensions (width/height > 0)
3. **Vérifier la console** : Chercher les erreurs Three.js ou WebGL

### L'animation est trop lente/rapide

Ajuster la vitesse dans `update()` :
```javascript
const baseSpeed = 1.0; // Augmenter pour plus de vitesse
```

### Performance faible sur mobile

Réduire les paramètres :
```javascript
totalSideLightSticks: 10,
lightPairsPerRoadWay: 20,
lanesPerRoad: 2,
```

### L'animation disparaît au resize

Le composant gère automatiquement le resize. Si le problème persiste, vérifier que le container a `position: fixed` ou `absolute`.

## 📊 Performance

- **Desktop** : 60 FPS cible
- **Mobile** : 30+ FPS avec optimisations
- **Mémoire** : Nettoyage automatique au démontage

## 🔧 Architecture Technique

```
Hyperspeed Component
├── Three.js Scene
│   ├── WebGL Renderer
│   ├── Perspective Camera
│   └── EffectComposer
│       ├── RenderPass
│       ├── BloomEffect
│       └── SMAAEffect
├── Road (PlaneGeometry avec shader)
├── CarLights (InstancedBufferGeometry)
└── LightSticks (InstancedBufferGeometry)
```

## 📝 Notes de Développement

- Le composant utilise `useLayoutEffect` pour s'assurer que le DOM est prêt avant l'initialisation
- Les ressources Three.js sont nettoyées automatiquement au démontage
- L'animation utilise `requestAnimationFrame` pour une boucle fluide
- Les deltas de temps sont validés pour éviter les sauts de frame

## 🎨 Personnalisation des Couleurs

Pour changer les couleurs, modifier l'objet `colors` dans les options :

```javascript
colors: {
  roadColor: 0x080808,        // Couleur de la route (hex)
  islandColor: 0x0a0a0a,      // Couleur de l'îlot central
  background: 0x000000,       // Couleur de fond
  leftCars: [0xd856bf, ...],  // Tableau de couleurs pour voitures de gauche
  rightCars: [0x03b3c3, ...], // Tableau de couleurs pour voitures de droite
  sticks: 0x03b3c3           // Couleur des bâtons lumineux
}
```

## 📚 Ressources

- [Three.js Documentation](https://threejs.org/docs/)
- [postprocessing Documentation](https://pmndrs.github.io/postprocessing/)
- [WebGL Support](https://get.webgl.org/)

---

**Version** : 1.0  
**Dernière mise à jour** : 2024

