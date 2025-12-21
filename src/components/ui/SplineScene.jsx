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

