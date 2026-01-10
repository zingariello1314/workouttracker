/**
 * Utilitaires pour la memoization optimisée
 * 
 * ✅ PHASE 2 : Memoization des composants coûteux
 * 
 * @module utils/memoization
 */

import React from 'react';

/**
 * Comparaison profonde pour React.memo
 * Compare les props de manière profonde pour éviter les re-renders inutiles
 * 
 * @param {Object} prevProps - Props précédentes
 * @param {Object} nextProps - Props suivantes
 * @param {Array<string>} deepCompareKeys - Clés à comparer en profondeur
 * @returns {boolean} true si les props sont identiques
 */
export const createDeepCompare = (deepCompareKeys = []) => {
  return (prevProps, nextProps) => {
    // Comparaison simple pour toutes les props
    const allKeys = new Set([...Object.keys(prevProps), ...Object.keys(nextProps)]);
    
    for (const key of allKeys) {
      const prevValue = prevProps[key];
      const nextValue = nextProps[key];
      
      // Si la clé est dans deepCompareKeys, comparer en profondeur
      if (deepCompareKeys.includes(key)) {
        if (!deepEqual(prevValue, nextValue)) {
          return false; // Props différentes, re-render nécessaire
        }
      } else {
        // Comparaison par référence pour les autres props
        if (prevValue !== nextValue) {
          return false; // Props différentes, re-render nécessaire
        }
      }
    }
    
    return true; // Props identiques, pas de re-render
  };
};

/**
 * Comparaison profonde simple (sans dépendances externes)
 * @param {any} a - Première valeur
 * @param {any} b - Deuxième valeur
 * @returns {boolean} true si les valeurs sont identiques
 */
const deepEqual = (a, b) => {
  if (a === b) return true;
  
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  
  if (typeof a !== 'object') return a === b;
  
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  
  return true;
};

/**
 * Wrapper pour React.memo avec comparaison personnalisée
 * 
 * @param {React.ComponentType} Component - Composant à mémoriser
 * @param {Object} options - Options de memoization
 * @param {Array<string>} options.deepCompareKeys - Clés à comparer en profondeur
 * @param {Function} options.customCompare - Fonction de comparaison personnalisée
 * @param {string} options.displayName - Nom d'affichage du composant
 * @returns {React.MemoExoticComponent} Composant mémorisé
 */
export const memoizeComponent = (Component, options = {}) => {
  const { deepCompareKeys = [], customCompare, displayName } = options;
  
  let compareFn = React.memo.defaultProps;
  
  if (customCompare) {
    compareFn = customCompare;
  } else if (deepCompareKeys.length > 0) {
    compareFn = createDeepCompare(deepCompareKeys);
  }
  
  const MemoizedComponent = React.memo(Component, compareFn);
  
  if (displayName) {
    MemoizedComponent.displayName = displayName;
  } else if (Component.displayName) {
    MemoizedComponent.displayName = `Memoized(${Component.displayName})`;
  } else if (Component.name) {
    MemoizedComponent.displayName = `Memoized(${Component.name})`;
  }
  
  return MemoizedComponent;
};

/**
 * Hook pour mémoriser une valeur avec comparaison profonde
 * Alternative à useMemo pour les objets/tableaux complexes
 * 
 * @param {Function} factory - Fonction qui retourne la valeur
 * @param {Array} deps - Dépendances (comparées en profondeur)
 * @returns {any} Valeur mémorisée
 */
export const useDeepMemo = (factory, deps) => {
  const ref = React.useRef({ deps: null, value: null });
  
  if (!deepEqual(ref.current.deps, deps)) {
    ref.current.deps = deps;
    ref.current.value = factory();
  }
  
  return ref.current.value;
};

/**
 * Hook pour mémoriser un callback avec comparaison profonde des dépendances
 * Alternative à useCallback pour les dépendances complexes
 * 
 * @param {Function} callback - Fonction callback
 * @param {Array} deps - Dépendances (comparées en profondeur)
 * @returns {Function} Callback mémorisé
 */
export const useDeepCallback = (callback, deps) => {
  const ref = React.useRef({ deps: null, callback: null });
  
  if (!deepEqual(ref.current.deps, deps)) {
    ref.current.deps = deps;
    ref.current.callback = callback;
  }
  
  return ref.current.callback;
};

export default {
  createDeepCompare,
  memoizeComponent,
  useDeepMemo,
  useDeepCallback,
  deepEqual
};
