import * as THREE from 'three';

/** Préréglages caméra partagés (Récap, cartes banque, fiches). */
export const BODY_VIEW_PRESETS = {
  frontLow: {
    dir: new THREE.Vector3(0.78, -0.2, 0.72),
    distanceScale: 0.78
  },
  front: { dir: new THREE.Vector3(0, 0.08, 1), distanceScale: 0.75 },
  /** Dos : léger angle plus haut + un peu plus de recul (étirements / fiches lisibles du haut aux lombaires). */
  back: { dir: new THREE.Vector3(0, 0.22, -1), distanceScale: 0.82 },
  /** Dos bas (mollets/isochios) : remonte légèrement la caméra tout en gardant le recul. */
  backLower: {
    dir: new THREE.Vector3(0, -0.1, -0.995),
    distanceScale: 1.09
  },
  /** Face légèrement de haut + davantage reculée (épaules / gainage / buste). */
  frontHighWide: {
    dir: new THREE.Vector3(0.02, 0.26, 0.966),
    distanceScale: 0.95
  },
  /** Figures suspendues type front lever — cadre très large buste-genoux. */
  frontWideHang: {
    dir: new THREE.Vector3(0.05, -0.02, 0.9986),
    distanceScale: 1.38
  },
  side: { dir: new THREE.Vector3(1, 0.1, 0.12), distanceScale: 0.75 },
  top: { dir: new THREE.Vector3(0, 1, 0.06), distanceScale: 0.75 }
};

export const ANATOMY_VIEW_PRESET_KEYS = [
  'frontLow',
  'frontHighWide',
  'frontWideHang',
  'front',
  'back',
  'backLower',
  'side',
  'top'
];
