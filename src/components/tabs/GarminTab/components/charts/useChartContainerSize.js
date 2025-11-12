import { useState, useEffect, useMemo } from 'react';

/**
 * 🔴 FIX #5: Hook réutilisable pour vérifier dimensions du conteneur avant rendu Recharts
 * Évite les warnings "width(-1) and height(-1)" en vérifiant les dimensions avant rendu
 */
export function useChartContainerSize(minHeight = 320, minWidth = 400) {
  const [node, setNode] = useState(null);
  // Initialiser avec des dimensions minimales pour éviter le warning au premier rendu
  // ResponsiveContainer peut gérer le responsive même avec ces valeurs
  const [containerSize, setContainerSize] = useState({ width: minWidth, height: minHeight });
  const [isMeasured, setIsMeasured] = useState(false);

  const containerRef = useMemo(
    () =>
      function assignRef(instance) {
        setNode(instance);
      },
    []
  );

  useEffect(() => {
    if (!node) {
      // Si pas de ref, garder les valeurs minimales mais marquer comme non mesuré
      setIsMeasured(false);
      return;
    }
    
    // Fonction pour mesurer et mettre à jour les dimensions
    const updateSize = () => {
      if (!node) {
        setContainerSize({ width: minWidth, height: minHeight });
        setIsMeasured(false);
        return;
      }
      
      const rect = node.getBoundingClientRect();
      
      // Si le conteneur n'est pas encore dans le DOM ou a des dimensions 0, utiliser les minimales
      if (rect.width === 0 || rect.height === 0) {
        setContainerSize({ width: minWidth, height: minHeight });
        setIsMeasured(false);
        return;
      }
      
      const computedStyle = typeof window !== 'undefined' ? window.getComputedStyle(node) : null;
      const paddingX = parseFloat(computedStyle?.paddingLeft) || 0;
      const paddingY = parseFloat(computedStyle?.paddingTop) || 0;
      
      // Utiliser les dimensions réelles moins le padding
      const width = Math.max(minWidth, rect.width - paddingX);
      const height = Math.max(minHeight, rect.height - paddingY);
      
      // Toujours mettre à jour avec les valeurs calculées ou minimales
      setContainerSize({ width, height });
      setIsMeasured(width > minWidth || height > minHeight);
    };
    
    // Mesure immédiate
    updateSize();
    
    // Mesure au prochain frame (pour s'assurer que le DOM est complètement rendu)
    let rafId1 = null;
    let rafId2 = null;
    if (typeof window !== 'undefined') {
      rafId1 = requestAnimationFrame(() => {
        rafId2 = requestAnimationFrame(updateSize);
      });
    }
    
    // Observer pour les changements de taille
    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined' && node) {
      resizeObserver = new ResizeObserver(updateSize);
      resizeObserver.observe(node);
    }
    
    return () => {
      if (rafId1 !== null) cancelAnimationFrame(rafId1);
      if (rafId2 !== null) cancelAnimationFrame(rafId2);
      resizeObserver?.disconnect();
    };
  }, [node, minHeight, minWidth]);

  // Toujours retourner des dimensions valides (au moins minimales)
  // Cela évite les warnings Recharts même si le conteneur n'est pas encore mesuré
  // On force toujours au minimum minWidth x minHeight pour éviter que ResponsiveContainer reçoive -1
  const safeContainerSize = useMemo(() => ({
    width: Math.max(minWidth, containerSize.width || minWidth),
    height: Math.max(minHeight, containerSize.height || minHeight)
  }), [containerSize.width, containerSize.height, minWidth, minHeight]);

  return { containerRef, containerSize: safeContainerSize, isMeasured };
}

