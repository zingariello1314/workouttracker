import { useRef, useState, useEffect, useMemo } from 'react';

/**
 * 🔴 FIX #5: Hook réutilisable pour vérifier dimensions du conteneur avant rendu Recharts
 * Évite les warnings "width(-1) and height(-1)" en vérifiant les dimensions avant rendu
 */
export function useChartContainerSize(minHeight = 320, minWidth = 400) {
  const containerRef = useRef(null);
  // Initialiser avec des dimensions minimales pour éviter le warning au premier rendu
  // ResponsiveContainer peut gérer le responsive même avec ces valeurs
  const [containerSize, setContainerSize] = useState({ width: minWidth, height: minHeight });
  const [isMeasured, setIsMeasured] = useState(false);

  useEffect(() => {
    if (!containerRef.current) {
      // Si pas de ref, garder les valeurs minimales mais marquer comme non mesuré
      setIsMeasured(false);
      return;
    }
    
    // Fonction pour mesurer et mettre à jour les dimensions
    const updateSize = () => {
      if (!containerRef.current) {
        setContainerSize({ width: minWidth, height: minHeight });
        setIsMeasured(false);
        return;
      }
      
      const rect = containerRef.current.getBoundingClientRect();
      
      // Si le conteneur n'est pas encore dans le DOM ou a des dimensions 0, utiliser les minimales
      if (rect.width === 0 || rect.height === 0) {
        setContainerSize({ width: minWidth, height: minHeight });
        setIsMeasured(false);
        return;
      }
      
      const computedStyle = window.getComputedStyle(containerRef.current);
      const paddingX = parseFloat(computedStyle.paddingLeft) || 0;
      const paddingY = parseFloat(computedStyle.paddingTop) || 0;
      
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
    const rafId1 = requestAnimationFrame(() => {
      const rafId2 = requestAnimationFrame(updateSize);
      return () => cancelAnimationFrame(rafId2);
    });
    
    // Observer pour les changements de taille
    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    
    resizeObserver.observe(containerRef.current);
    
    return () => {
      cancelAnimationFrame(rafId1);
      resizeObserver.disconnect();
    };
  }, [minHeight, minWidth]);

  // Toujours retourner des dimensions valides (au moins minimales)
  // Cela évite les warnings Recharts même si le conteneur n'est pas encore mesuré
  // On force toujours au minimum minWidth x minHeight pour éviter que ResponsiveContainer reçoive -1
  const safeContainerSize = useMemo(() => ({
    width: Math.max(minWidth, containerSize.width || minWidth),
    height: Math.max(minHeight, containerSize.height || minHeight)
  }), [containerSize.width, containerSize.height, minWidth, minHeight]);

  return { containerRef, containerSize: safeContainerSize, isMeasured };
}

