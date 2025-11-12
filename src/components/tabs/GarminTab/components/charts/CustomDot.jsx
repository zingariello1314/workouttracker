import React from 'react';
import PropTypes from 'prop-types';

/**
 * Composant de point personnalisé pour les graphiques Recharts
 * Permet de mettre en évidence le point sélectionné
 * 
 * ✅ Optimisé avec React.memo pour éviter re-renders inutiles
 * ✅ Clé stable générée à partir des propriétés du payload
 */
const CustomDot = React.memo(function CustomDot({ 
  cx, 
  cy, 
  fill, 
  stroke, 
  strokeWidth, 
  r, 
  payload, 
  isSelected, 
  highlightColor = '#FCD34D' 
}) {
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
}, (prevProps, nextProps) => {
  // Comparaison personnalisée pour éviter re-renders inutiles
  // Vérifier toutes les props qui affectent le rendu
  return (
    prevProps.cx === nextProps.cx &&
    prevProps.cy === nextProps.cy &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.payload?.timestamp === nextProps.payload?.timestamp &&
    prevProps.payload?.date === nextProps.payload?.date &&
    prevProps.payload?.time === nextProps.payload?.time &&
    prevProps.payload?.hour === nextProps.payload?.hour &&
    prevProps.payload?.minute === nextProps.payload?.minute &&
    prevProps.payload?.isSelected === nextProps.payload?.isSelected &&
    prevProps.fill === nextProps.fill &&
    prevProps.stroke === nextProps.stroke &&
    prevProps.strokeWidth === nextProps.strokeWidth &&
    prevProps.r === nextProps.r &&
    prevProps.highlightColor === nextProps.highlightColor
  );
});

/**
 * Génère une clé stable pour CustomDot à partir du payload.
 * Utilisé dans les props `dot` des composants Line/Area de Recharts.
 * 
 * @param {Object} payload - Payload du point de données
 * @param {number} index - Index du point
 * @returns {string} Clé stable
 */
export function getCustomDotKey(payload, index) {
  // Priorité : timestamp > date > time > hour/minute > index
  if (payload?.timestamp) {
    return `dot-${payload.timestamp}`;
  }
  if (payload?.date) {
    return `dot-${payload.date}`;
  }
  if (payload?.time) {
    return `dot-${payload.time}`;
  }
  if (payload?.hour !== undefined && payload?.minute !== undefined) {
    return `dot-${payload.hour}-${payload.minute}`;
  }
  return `dot-${index}`;
}

CustomDot.propTypes = {
  cx: PropTypes.number,
  cy: PropTypes.number,
  fill: PropTypes.string,
  stroke: PropTypes.string,
  strokeWidth: PropTypes.number,
  r: PropTypes.number,
  payload: PropTypes.object,
  isSelected: PropTypes.bool,
  highlightColor: PropTypes.string
};

export { CustomDot };
export default CustomDot;

