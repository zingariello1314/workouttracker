import React, { memo } from 'react';

/**
 * Légende ultra-compacte mémorisée pour la sidebar
 * Composant séparé pour le lazy loading et l'optimisation des performances
 * Requirements: 4.3, 4.4, 1.5
 */
const CompactLegend = memo(({ 
  enrichedData, 
  compactMode, 
  effectiveWidth, 
  getOptimalSizes 
}) => {
  if (!enrichedData?.metadata?.zoneThresholds || !compactMode) return null;

  const sizes = getOptimalSizes;
  const isVeryNarrow = effectiveWidth < 250;
  
  // En mode très étroit, afficher seulement les zones avec le plus de temps
  const zonesToShow = isVeryNarrow ? 2 : 3;
  const significantZones = enrichedData.metadata.zoneThresholds
    .map(zone => ({
      ...zone,
      time: enrichedData.zones?.[zone.zone] || 0,
      percentage: enrichedData.metadata.duration > 0 
        ? Math.round((enrichedData.zones?.[zone.zone] || 0) / enrichedData.metadata.duration * 100) 
        : 0
    }))
    .filter(zone => zone.percentage > 0)
    .sort((a, b) => b.time - a.time)
    .slice(0, zonesToShow);

  if (significantZones.length === 0) return null;

  return (
    <div className="mt-2 p-2 bg-slate-900/30 border border-slate-700/50 rounded">
      <p className="text-slate-400 mb-1" 
         style={{ fontSize: `${sizes.fontSize.legend}px` }}>
        Zones FC
      </p>
      <div className={`flex ${isVeryNarrow ? 'flex-col gap-1' : 'flex-wrap gap-1'}`}>
        {significantZones.map((zone) => (
          <div 
            key={zone.zone} 
            className="flex items-center"
            style={{ fontSize: `${sizes.fontSize.legend}px` }}
            title={`${zone.name} (${zone.minBpm}-${zone.maxBpm} bpm)`}
          >
            <div 
              className="rounded-full mr-1"
              style={{ 
                backgroundColor: zone.color,
                width: isVeryNarrow ? '6px' : '8px',
                height: isVeryNarrow ? '6px' : '8px'
              }}
            />
            <span className="text-slate-300">
              {isVeryNarrow ? zone.name.charAt(0) : zone.name.split(' - ')[0]}
            </span>
            <span className="text-slate-500 ml-1">{zone.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
});

CompactLegend.displayName = 'CompactLegend';

export default CompactLegend;