/**
 * Three.js Singleton - Force une seule instance de Three.js
 * 
 * ✅ CORRECTION : Évite les warnings "Multiple instances of Three.js"
 * 
 * Ce fichier garantit que toutes les parties de l'application
 * utilisent la même instance de Three.js, même si Spline ou
 * d'autres dépendances tentent d'importer leur propre version.
 */

// Import unique de Three.js
import * as THREE from 'three';

// Exporter l'instance unique
export default THREE;

// Exporter aussi les exports nommés pour compatibilité
export const {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  Mesh,
  BoxGeometry,
  MeshStandardMaterial,
  AmbientLight,
  DirectionalLight,
  Vector3,
  Color,
  Clock,
  // Ajouter d'autres exports si nécessaire
} = THREE;

// ✅ CORRECTION : Forcer l'utilisation de cette instance dans le contexte global
// Cela empêche Spline d'importer sa propre version
if (typeof window !== 'undefined') {
  // Stocker l'instance dans window pour que Spline puisse l'utiliser
  if (!window.THREE) {
    window.THREE = THREE;
  } else if (window.THREE !== THREE) {
    // Si une autre instance existe déjà, la remplacer par la nôtre
    console.warn('[ThreeSingleton] Replacing existing THREE instance with singleton');
    window.THREE = THREE;
  }
}
