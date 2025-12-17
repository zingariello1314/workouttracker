/**
 * VirtualizedList Component
 * 
 * Composant de liste virtualisée pour optimiser les performances
 * avec de grandes quantités de données.
 * 
 * Features:
 * - Rendu uniquement des éléments visibles
 * - Scroll fluide avec overscan
 * - Support du redimensionnement dynamique
 * - Optimisations mémoire
 * 
 * @see Requirements 1.2, 10.3
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import performanceOptimizationService from '../../services/statistics/performanceOptimizationService';

const VirtualizedList = ({
  items = [],
  itemHeight = 50,
  containerHeight = 400,
  renderItem,
  overscan = 5,
  className = '',
  onScroll = null,
  getItemKey = (item, index) => item.id || index
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);
  const scrollElementRef = useRef(null);

  // Calculer la plage visible avec memoization
  const visibleRange = useMemo(() => {
    return performanceOptimizationService.calculateVisibleRange(
      scrollTop,
      containerHeight,
      itemHeight,
      items.length,
      overscan
    );
  }, [scrollTop, containerHeight, itemHeight, items.length, overscan]);

  // Créer les données virtualisées
  const virtualizedData = useMemo(() => {
    return performanceOptimizationService.createVirtualizedData(
      items,
      visibleRange.startIndex,
      visibleRange.endIndex,
      itemHeight
    );
  }, [items, visibleRange.startIndex, visibleRange.endIndex, itemHeight]);

  // Gestionnaire de scroll avec debouncing
  const handleScroll = useCallback(
    performanceOptimizationService.debounce('virtualizedList', (event) => {
      const newScrollTop = event.target.scrollTop;
      setScrollTop(newScrollTop);
      
      if (onScroll) {
        onScroll(event, {
          scrollTop: newScrollTop,
          visibleRange,
          virtualizedData
        });
      }
    }, 16), // ~60fps
    [onScroll, visibleRange, virtualizedData]
  );

  // Effet pour gérer le scroll
  useEffect(() => {
    const scrollElement = scrollElementRef.current;
    if (!scrollElement) return;

    scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      scrollElement.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  // Rendu des éléments visibles avec memoization
  const renderedItems = useMemo(() => {
    return virtualizedData.visibleItems.map((item, index) => {
      const actualIndex = visibleRange.startIndex + index;
      const key = getItemKey(item, actualIndex);
      
      return (
        <div
          key={key}
          style={{
            position: 'absolute',
            top: actualIndex * itemHeight,
            left: 0,
            right: 0,
            height: itemHeight
          }}
        >
          {renderItem(item, actualIndex)}
        </div>
      );
    });
  }, [virtualizedData.visibleItems, visibleRange.startIndex, itemHeight, renderItem, getItemKey]);

  // Styles pour le conteneur
  const containerStyle = {
    height: containerHeight,
    overflow: 'auto',
    position: 'relative'
  };

  const innerStyle = {
    height: virtualizedData.totalHeight,
    position: 'relative'
  };

  return (
    <div
      ref={containerRef}
      className={`virtualized-list ${className}`}
      style={containerStyle}
    >
      <div
        ref={scrollElementRef}
        style={{
          height: '100%',
          overflow: 'auto'
        }}
      >
        <div style={innerStyle}>
          {renderedItems}
        </div>
      </div>
    </div>
  );
};

// Version memoized pour éviter les re-renders inutiles
export default React.memo(VirtualizedList);

// Hook personnalisé pour utiliser la liste virtualisée
export const useVirtualizedList = (items, options = {}) => {
  const {
    itemHeight = 50,
    containerHeight = 400,
    overscan = 5
  } = options;

  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    return performanceOptimizationService.calculateVisibleRange(
      scrollTop,
      containerHeight,
      itemHeight,
      items.length,
      overscan
    );
  }, [scrollTop, containerHeight, itemHeight, items.length, overscan]);

  const virtualizedData = useMemo(() => {
    return performanceOptimizationService.createVirtualizedData(
      items,
      visibleRange.startIndex,
      visibleRange.endIndex,
      itemHeight
    );
  }, [items, visibleRange.startIndex, visibleRange.endIndex, itemHeight]);

  return {
    visibleRange,
    virtualizedData,
    scrollTop,
    setScrollTop,
    totalHeight: items.length * itemHeight
  };
};