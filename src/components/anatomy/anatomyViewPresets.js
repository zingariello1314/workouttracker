import * as THREE from 'three';

/** Préréglages caméra partagés (Récap, cartes banque, fiches). */
export const BODY_VIEW_PRESETS = {
  frontLow: {
    dir: new THREE.Vector3(0.78, -0.2, 0.72),
    distanceScale: 0.78
  },
  front: { dir: new THREE.Vector3(0, 0.08, 1), distanceScale: 0.75 },
  back: { dir: new THREE.Vector3(0, 0.12, -1), distanceScale: 0.75 },
  side: { dir: new THREE.Vector3(1, 0.1, 0.12), distanceScale: 0.75 },
  top: { dir: new THREE.Vector3(0, 1, 0.06), distanceScale: 0.75 }
};

export const ANATOMY_VIEW_PRESET_KEYS = ['frontLow', 'front', 'back', 'side', 'top'];
