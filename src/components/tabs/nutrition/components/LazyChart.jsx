/**
 * LazyChart.jsx
 * 
 * ✅ PHASE 5 : Composant lazy loading pour graphiques CoachDashboard
 * 
 * ✅ PHASE 5 : Lazy rendering avec Intersection Observer
 * - Ne rend graphiques que si visibles dans viewport
 * - Préchargement avec rootMargin configurable
 * - Skeleton loader pendant chargement
 * - Déconnexion automatique après premier rendu
 * 
 * @module components/tabs/nutrition/components/LazyChart
 */

import React, { useState, useEffect, useRef } from 'react';
import { Loader } from 'lucide-react';

/**
 * ✅ PHASE 5 : Composant wrapper pour graphiques avec lazy rendering
 * 
 * @param {React.ReactNode} children - Contenu graphique à rendre (Recharts components)
 * @param {number} height - Hauteur minimale placeholder (default: 320px)
 * @param {string} rootMargin - Marge avant viewport pour préchargement (default: '100px')
 * @param {string} placeholderText - Texte placeholder pendant chargement (default: "Chargement graphique...")
 * @param {boolean} enabled - Activer/désactiver lazy loading (default: true)
 */
const LazyChart = ({ 
  children, 
  height = 320, 
  rootMargin = '100px',
  placeholderText = 'Chargement graphique...',
  enabled = true
}) => {
  const [isVisible, setIsVisible] = useState(!enabled); // Si désactivé, rendre immédiatement
  const [isRendered, setIsRendered] = useState(!enabled);
  const containerRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    // ✅ PHASE 5 : Si désactivé ou déjà rendu, ne rien faire
    if (!enabled || isRendered) {
      return;
    }

    // ✅ PHASE 5 : Si IntersectionObserver non supporté, rendre immédiatement
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      setIsRendered(true);
      return;
    }

    const currentContainer = containerRef.current;
    if (!currentContainer) {
      return;
    }

    // ✅ PHASE 5 : Nettoyer observer précédent s'il existe
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    // ✅ PHASE 5 : Créer IntersectionObserver avec options
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // ✅ PHASE 5 : Déclencher rendu avec requestAnimationFrame pour smooth transition
          requestAnimationFrame(() => {
            setIsVisible(true);
            setIsRendered(true);
            // Déconnexion après premier rendu pour économiser ressources
            if (observerRef.current) {
              observerRef.current.disconnect();
              observerRef.current = null;
            }
          });
        }
      },
      { 
        threshold: 0.1, // Déclencher à 10% visible
        rootMargin: rootMargin // Précharger avant viewport
      }
    );

    observerRef.current = observer;
    observer.observe(currentContainer);

    // ✅ PHASE 5 : Cleanup au démontage
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [enabled, rootMargin, isRendered]);

  return (
    <div 
      ref={containerRef} 
      className="w-full"
      style={{ minHeight: height }}
    >
      {isVisible && isRendered ? (
        // ✅ PHASE 5 : Graphique rendu avec transition fade-in (opacity 0 → 1)
        <div 
          className="w-full"
          style={{ 
            height,
            animation: 'fadeIn 0.3s ease-in-out forwards'
          }}
        >
          {children}
        </div>
      ) : (
        // ✅ PHASE 5 : Skeleton loader pendant chargement
        <div 
          className="flex items-center justify-center w-full bg-slate-700/30 rounded-lg animate-pulse"
          style={{ height }}
          aria-label="Chargement graphique..."
        >
          <div className="text-center">
            <Loader className="w-8 h-8 mx-auto mb-3 text-blue-400 animate-spin" />
            <p className="text-slate-400 text-sm">{placeholderText}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LazyChart;

