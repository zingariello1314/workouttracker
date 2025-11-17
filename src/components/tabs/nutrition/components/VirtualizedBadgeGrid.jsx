/**
 * VirtualizedBadgeGrid - Virtualisation haute performance pour grille badges
 * 
 * ✅ OPTIMISATION Phase 11.2 : Virtual scrolling pour grille badges
 * 
 * Utilise react-window pour rendre uniquement badges visibles
 * Optimisé pour grandes collections (100 badges)
 * Support responsive (2/3/4 colonnes selon viewport)
 * 
 * @module components/tabs/nutrition/components/VirtualizedBadgeGrid
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { Lock } from 'lucide-react';

/**
 * Composant cellule badge individuelle
 * ✅ OPTIMISATION Phase 11.2 : Mémorisé pour éviter re-renders inutiles
 */
const BadgeCell = React.memo(({ columnIndex, rowIndex, style, data }) => {
  const { badges, columns, onBadgeClick, getRarityColor } = data;
  const index = rowIndex * columns + columnIndex;
  const badge = badges[index];

  if (!badge) {
    return <div style={style} />; // Cellule vide
  }

  const isUnlocked = badge.isUnlocked;
  const baseClasses = `rounded-lg p-4 border transition-all relative h-full ${
    isUnlocked 
      ? `${getRarityColor(badge.rarity)} hover:scale-105 cursor-pointer` 
      : 'border-slate-700 bg-slate-900/30 opacity-50 cursor-pointer hover:opacity-70'
  }`;

  return (
    <div style={style} className="p-1.5">
      <div
        className={baseClasses}
        title={isUnlocked ? badge.name : `${badge.name} - Non débloqué`}
        onClick={() => onBadgeClick(badge)}
      >
        {/* Badge de verrouillage pour non débloqués */}
        {!isUnlocked && (
          <div className="absolute top-2 right-2">
            <Lock size={16} className="text-slate-600" />
          </div>
        )}
        
        <div className="flex items-start justify-between mb-2">
          <div className={`text-3xl ${isUnlocked ? '' : 'grayscale'}`}>
            {badge.icon}
          </div>
          <div className={`text-xs px-2 py-0.5 rounded ${
            isUnlocked
              ? (badge.rarity === 'common' ? 'bg-slate-500 text-white' :
                 badge.rarity === 'rare' ? 'bg-blue-500 text-white' :
                 badge.rarity === 'epic' ? 'bg-purple-500 text-white' :
                 'bg-yellow-500 text-white')
              : 'bg-slate-700 text-slate-400'
          }`}>
            {badge.rarity}
          </div>
        </div>
        <div className={`text-sm font-medium mb-1 ${
          isUnlocked ? 'text-white' : 'text-slate-500'
        }`}>
          {badge.name}
        </div>
        <div className={`text-xs mb-2 ${
          isUnlocked ? 'text-slate-400' : 'text-slate-600'
        }`}>
          {badge.description}
        </div>
        <div className="flex items-center justify-between">
          <div className={`text-xs ${
            isUnlocked ? 'text-slate-500' : 'text-slate-700'
          }`}>
            {badge.formattedDate || 'Non débloqué'}
          </div>
          <div className={`text-xs ${
            isUnlocked ? 'text-yellow-400' : 'text-slate-600'
          }`}>
            +{badge.points} XP
          </div>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Comparaison personnalisée pour éviter re-renders inutiles
  const prevBadge = prevProps.data.badges[prevProps.rowIndex * prevProps.data.columns + prevProps.columnIndex];
  const nextBadge = nextProps.data.badges[nextProps.rowIndex * nextProps.data.columns + nextProps.columnIndex];
  
  if (!prevBadge && !nextBadge) return true;
  if (!prevBadge || !nextBadge) return false;
  
  // Re-render seulement si badge a changé (id, isUnlocked, formattedDate)
  return (
    prevBadge.id === nextBadge.id &&
    prevBadge.isUnlocked === nextBadge.isUnlocked &&
    prevBadge.formattedDate === nextBadge.formattedDate
  );
});

BadgeCell.displayName = 'BadgeCell';

/**
 * VirtualizedBadgeGrid - Composant principal
 * 
 * @param {Object} props
 * @param {Array} props.badges - Tableau de badges à afficher
 * @param {Function} props.onBadgeClick - Callback appelé lors du clic sur un badge
 * @param {Function} props.getRarityColor - Fonction pour obtenir la couleur de rareté
 * @param {number} props.height - Hauteur du conteneur (défaut: 600px)
 * @param {number} props.itemHeight - Hauteur d'un badge (défaut: 200px)
 */
const VirtualizedBadgeGrid = ({ 
  badges, 
  onBadgeClick, 
  getRarityColor,
  height = 600,
  itemHeight = 200
}) => {
  const [columns, setColumns] = useState(4);
  const [itemWidth, setItemWidth] = useState(0);
  const containerRef = useRef(null);

  // ✅ OPTIMISATION Phase 11.2 : Calcul responsive colonnes et largeur (utilise conteneur parent)
  useEffect(() => {
    const updateColumns = () => {
      if (!containerRef.current) return;
      
      // Utiliser largeur conteneur parent plutôt que window.innerWidth
      const containerWidth = containerRef.current.offsetWidth || window.innerWidth;
      let newColumns = 4; // Défaut desktop
      let newItemWidth = 0;
      const gap = 12; // gap-3 = 12px
      const padding = 24; // padding estimé

      if (containerWidth < 640) {
        // Mobile
        newColumns = 2;
        newItemWidth = (containerWidth - padding * 2 - gap) / 2;
      } else if (containerWidth < 1024) {
        // Tablet
        newColumns = 3;
        newItemWidth = (containerWidth - padding * 2 - gap * 2) / 3;
      } else {
        // Desktop
        newColumns = 4;
        newItemWidth = (containerWidth - padding * 2 - gap * 3) / 4;
      }

      setColumns(newColumns);
      setItemWidth(Math.max(newItemWidth, 150)); // Largeur minimale 150px
    };

    // Attendre que le conteneur soit monté
    const timer = setTimeout(updateColumns, 0);
    window.addEventListener('resize', updateColumns);
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateColumns);
    };
  }, []);

  // ✅ OPTIMISATION Phase 11.2 : Utiliser ResizeObserver pour détection changements taille conteneur (plus précis que window.resize)
  useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === 'undefined') return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const containerWidth = entry.contentRect.width;
        let newColumns = 4;
        let newItemWidth = 0;
        const gap = 12;
        const padding = 24;

        if (containerWidth < 640) {
          newColumns = 2;
          newItemWidth = (containerWidth - padding * 2 - gap) / 2;
        } else if (containerWidth < 1024) {
          newColumns = 3;
          newItemWidth = (containerWidth - padding * 2 - gap * 2) / 3;
        } else {
          newColumns = 4;
          newItemWidth = (containerWidth - padding * 2 - gap * 3) / 4;
        }

        setColumns(newColumns);
        setItemWidth(Math.max(newItemWidth, 150));
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Calculer nombre de lignes
  const rows = useMemo(() => {
    return Math.ceil(badges.length / columns);
  }, [badges.length, columns]);

  // Données passées aux cellules
  const gridData = useMemo(() => ({
    badges,
    columns,
    onBadgeClick,
    getRarityColor
  }), [badges, columns, onBadgeClick, getRarityColor]);

  if (itemWidth === 0) {
    // Attendre calcul responsive
    return (
      <div ref={containerRef} className="flex items-center justify-center h-96 w-full">
        <div className="text-slate-400 text-sm">Chargement...</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full">
      <Grid
        columnCount={columns}
        columnWidth={itemWidth}
        height={height}
        rowCount={rows}
        rowHeight={itemHeight}
        width={containerRef.current?.offsetWidth || '100%'}
        itemData={gridData}
        overscanRowCount={1} // ✅ OPTIMISATION Phase 11.2 : Pré-rendu 1 ligne hors écran pour scroll fluide
        style={{
          overflowX: 'hidden' // Désactiver scroll horizontal
        }}
      >
        {BadgeCell}
      </Grid>
    </div>
  );
};

export default VirtualizedBadgeGrid;

