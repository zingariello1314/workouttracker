import React from 'react';

/**
 * Composant de point personnalisé pour les graphiques Recharts
 * Permet de mettre en évidence le point sélectionné
 */
export function CustomDot({ cx, cy, fill, stroke, strokeWidth, r, payload, isSelected, highlightColor = '#FCD34D' }) {
  // Recharts passe cx et cy, retourner null si invalides
  if (cx === null || cy === null || cx === undefined || cy === undefined) {
    return null;
  }
  
  // Vérifier si ce point correspond à la date sélectionnée
  const isPointSelected = isSelected || payload?.isSelected || false;
  
  const dotFill = isPointSelected ? highlightColor : (fill || '#3B82F6');
  const dotStroke = isPointSelected ? highlightColor : (stroke || '#3B82F6');
  const dotStrokeWidth = isPointSelected ? 3 : (strokeWidth || 2);
  const dotR = isPointSelected ? ((r || 4) + 2) : (r || 4);

  return (
    <circle
      cx={cx}
      cy={cy}
      r={dotR}
      fill={dotFill}
      stroke={dotStroke}
      strokeWidth={dotStrokeWidth}
    />
  );
}

