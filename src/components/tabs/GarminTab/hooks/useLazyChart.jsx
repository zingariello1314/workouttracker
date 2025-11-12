/**
 * Hook pour charger les graphiques de manière paresseuse avec IntersectionObserver.
 * 
 * Ne monte le composant de graphique que lorsqu'il devient visible dans le viewport,
 * réduisant le coût de rendu initial et améliorant les performances.
 * 
 * @module useLazyChart
 */

import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

/**
 * Hook pour charger un graphique de manière paresseuse.
 * 
 * Utilise IntersectionObserver pour détecter quand le conteneur devient visible
 * et ne monte le composant qu'à ce moment-là.
 * 
 * @param {Object} options
 * @param {number} options.rootMargin - Marge autour du root (défaut: '50px')
 * @param {number} options.threshold - Seuil de visibilité (défaut: 0.1)
 * @param {boolean} options.enabled - Activer/désactiver le lazy loading (défaut: true)
 * @returns {[boolean, React.RefObject]} [shouldRender, containerRef]
 */
export const useLazyChart = ({
  rootMargin = '50px',
  threshold = 0.1,
  enabled = true
} = {}) => {
  const [shouldRender, setShouldRender] = useState(!enabled);
  const containerRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    // Si désactivé ou déjà rendu, ne rien faire
    if (!enabled || shouldRender) {
      return;
    }

    // Si IntersectionObserver n'est pas supporté, rendre immédiatement
    if (typeof IntersectionObserver === 'undefined') {
      setShouldRender(true);
      return;
    }

    const currentRef = containerRef.current;
    if (!currentRef) {
      return;
    }

    // Nettoyer l'observer précédent s'il existe
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    // Créer un nouvel observer
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldRender(true);
            // Désobserver une fois rendu pour économiser les ressources
            if (observerRef.current) {
              observerRef.current.unobserve(entry.target);
            }
          }
        });
      },
      {
        rootMargin,
        threshold
      }
    );

    observerRef.current = observer;
    observer.observe(currentRef);

    return () => {
      // Cleanup : désobserver et déconnecter
      if (observerRef.current) {
        if (currentRef) {
          observerRef.current.unobserve(currentRef);
        }
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [enabled, rootMargin, threshold]); // Retirer shouldRender des dépendances pour éviter boucles

  return [shouldRender, containerRef];
};

/**
 * Composant wrapper pour lazy loading de graphiques.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Composant à rendre de manière paresseuse
 * @param {React.ReactNode} [props.fallback=null] - Composant de fallback pendant le chargement
 * @param {Object} [props.lazyOptions={}] - Options pour useLazyChart
 * @returns {React.ReactElement}
 */
export const LazyChartWrapper = ({ 
  children, 
  fallback = null, 
  lazyOptions = {} 
}) => {
  const [shouldRender, containerRef] = useLazyChart(lazyOptions);
  
  return (
    <div ref={containerRef} style={{ minHeight: '320px' }}>
      {shouldRender ? children : fallback}
    </div>
  );
};

LazyChartWrapper.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.node,
  lazyOptions: PropTypes.shape({
    rootMargin: PropTypes.string,
    threshold: PropTypes.number,
    enabled: PropTypes.bool
  })
};

export default useLazyChart;

