/**
 * Composant CategoryTreemapChart - Répartition visuelle des catégories
 * Carte arborescente avec rectangles proportionnels au nombre de validations
 */

import React, { useMemo, useState } from 'react';
import LazyChart from '../../../BodyTracking/components/LazyChart';

const CategoryTreemapChart = ({ categoryStats }) => {
  const [hoveredCategory, setHoveredCategory] = useState(null);

  const treemapData = useMemo(() => {
    if (!categoryStats || categoryStats.length === 0) return [];

    // Trier par validations décroissant
    const sorted = [...categoryStats].sort((a, b) => b.validationsCount - a.validationsCount);
    
    // Calculer le total pour les pourcentages
    const total = sorted.reduce((sum, c) => sum + c.validationsCount, 0);
    
    return sorted.map(cat => ({
      ...cat,
      percentage: total > 0 ? Math.round((cat.validationsCount / total) * 100) : 0,
    }));
  }, [categoryStats]);

  if (treemapData.length === 0) return null;

  // Calculer la disposition des rectangles (layout simple)
  const containerWidth = 100; // Pourcentage
  const containerHeight = 100;
  const rectangles = useMemo(() => {
    const rects = [];
    let currentX = 0;
    let currentY = 0;
    let currentRowHeight = 0;
    let rowWidth = 0;
    const rowItems = [];

    treemapData.forEach((item, index) => {
      const total = treemapData.reduce((sum, c) => sum + c.validationsCount, 0);
      const width = (item.validationsCount / total) * containerWidth;
      
      rowItems.push({ ...item, width });
      rowWidth += width;

      // Si on dépasse la largeur ou c'est le dernier élément
      if (rowWidth >= containerWidth || index === treemapData.length - 1) {
        // Ajuster les largeurs pour remplir exactement
        const scale = containerWidth / rowWidth;
        rowItems.forEach(ri => {
          ri.width *= scale;
        });

        // Calculer la hauteur de la ligne (basée sur la plus grande valeur)
        const maxInRow = Math.max(...rowItems.map(ri => ri.validationsCount));
        const rowHeight = (maxInRow / total) * containerHeight * 1.2; // Facteur d'ajustement

        // Positionner chaque rectangle
        let x = currentX;
        rowItems.forEach(ri => {
          rects.push({
            ...ri,
            x,
            y: currentY,
            width: ri.width,
            height: rowHeight,
          });
          x += ri.width;
        });

        currentY += rowHeight;
        currentX = 0;
        rowWidth = 0;
        rowItems.length = 0;
      }
    });

    return rects;
  }, [treemapData]);

  // Fonction pour déterminer la couleur selon le taux de réussite avec gradients
  const getColor = (completionRate) => {
    if (completionRate >= 70) {
      return {
        bg: '#10b981',
        bgGradient: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
        border: '#34d399',
        text: '#d1fae5',
        glow: '#10b981',
      };
    }
    if (completionRate >= 50) {
      return {
        bg: '#06b6d4',
        bgGradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 50%, #0e7490 100%)',
        border: '#22d3ee',
        text: '#cffafe',
        glow: '#06b6d4',
      };
    }
    if (completionRate >= 30) {
      return {
        bg: '#f59e0b',
        bgGradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
        border: '#fbbf24',
        text: '#fef3c7',
        glow: '#f59e0b',
      };
    }
    return {
      bg: '#ef4444',
      bgGradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 50%, #b91c1c 100%)',
      border: '#f87171',
      text: '#fee2e2',
      glow: '#ef4444',
    };
  };

  return (
    <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-br from-slate-900/90 via-slate-800/50 to-slate-900/90 px-4 py-3 shadow-xl shadow-purple-500/10 backdrop-blur-sm">
      <div className="text-xs text-purple-300 mb-3 font-semibold tracking-wide flex items-center gap-2">
        <div className="w-1 h-4 bg-gradient-to-b from-purple-400 to-pink-500 rounded-full"></div>
        Répartition visuelle des catégories
      </div>
      <LazyChart height={300}>
        <div className="relative w-full" style={{ height: '300px', minHeight: '300px' }}>
          {rectangles.map((rect, index) => {
            const colors = getColor(rect.completionRate);
            const isHovered = hoveredCategory === rect.category;
            
            return (
              <div
                key={index}
                className="absolute border-2 rounded-xl transition-all duration-300 cursor-pointer overflow-hidden group"
                style={{
                  left: `${rect.x}%`,
                  top: `${rect.y}%`,
                  width: `${rect.width}%`,
                  height: `${rect.height}%`,
                  background: colors.bgGradient,
                  borderColor: isHovered ? colors.border : `${colors.bg}60`,
                  borderWidth: isHovered ? '3px' : '2px',
                  transform: isHovered ? 'scale(1.03) translateZ(0)' : 'scale(1) translateZ(0)',
                  zIndex: isHovered ? 10 : 1,
                  boxShadow: isHovered 
                    ? `0 0 20px ${colors.glow}80, 0 4px 12px rgba(0, 0, 0, 0.4), inset 0 0 20px rgba(255, 255, 255, 0.1)`
                    : `0 2px 8px rgba(0, 0, 0, 0.3), inset 0 0 15px rgba(255, 255, 255, 0.05)`,
                }}
                onMouseEnter={() => setHoveredCategory(rect.category)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                {/* Overlay gradient pour effet de profondeur */}
                <div 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: `linear-gradient(to bottom, rgba(255, 255, 255, 0.15) 0%, transparent 50%)`,
                  }}
                />
                
                <div className="relative p-3 h-full flex flex-col justify-between z-10">
                  <div>
                    <div 
                      className="text-sm font-bold text-white mb-1.5 truncate"
                      style={{
                        textShadow: '0 2px 8px rgba(0, 0, 0, 0.5), 0 0 4px rgba(255, 255, 255, 0.3)',
                      }}
                    >
                      {rect.category}
                    </div>
                    <div 
                      className="text-[10px] text-white/90 font-medium"
                      style={{
                        textShadow: '0 1px 4px rgba(0, 0, 0, 0.4)',
                      }}
                    >
                      {rect.validationsCount} validation{rect.validationsCount > 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="mt-auto">
                    <div 
                      className="text-2xl font-extrabold text-white mb-1"
                      style={{
                        textShadow: `0 0 12px ${colors.glow}80, 0 2px 6px rgba(0, 0, 0, 0.6)`,
                      }}
                    >
                      {rect.percentage}%
                    </div>
                    <div 
                      className="text-[10px] text-white/85 font-semibold"
                      style={{
                        textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
                      }}
                    >
                      {rect.completionRate}% réussite
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* Tooltip au survol amélioré */}
          {hoveredCategory && (() => {
            const category = treemapData.find(c => c.category === hoveredCategory);
            if (!category) return null;
            const colors = getColor(category.completionRate);
            
            return (
              <div
                className="absolute bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 rounded-xl p-4 shadow-2xl backdrop-blur-sm z-20"
                style={{
                  borderColor: `${colors.border}80`,
                  top: '10px',
                  right: '10px',
                  maxWidth: '240px',
                  boxShadow: `0 0 24px ${colors.glow}60, 0 8px 16px rgba(0, 0, 0, 0.5)`,
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div 
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: colors.border,
                      boxShadow: `0 0 8px ${colors.glow}`,
                    }}
                  />
                  <p 
                    className="font-bold text-base tracking-wide"
                    style={{ 
                      color: colors.border,
                      textShadow: `0 0 8px ${colors.glow}60`,
                    }}
                  >
                    {category.category}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="text-slate-400">Quêtes:</span>{' '}
                    <span className="font-bold text-slate-200">{category.questsCount}</span>
                  </p>
                  <p className="text-sm">
                    <span className="text-slate-400">Validations:</span>{' '}
                    <span 
                      className="font-bold text-lg"
                      style={{ 
                        color: colors.border,
                        textShadow: `0 0 6px ${colors.glow}40`,
                      }}
                    >
                      {category.validationsCount}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-slate-400">XP total:</span>{' '}
                    <span className="font-bold text-cyan-400">
                      {category.xpTotal.toLocaleString('fr-FR')} XP
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-slate-400">Taux de réussite:</span>{' '}
                    <span className="font-bold text-purple-400">{category.completionRate}%</span>
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      </LazyChart>
    </div>
  );
};

export default CategoryTreemapChart;

