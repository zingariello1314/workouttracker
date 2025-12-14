import React, { memo } from 'react';

/**
 * AnimatedProgressBar - Barre de progression animée premium
 * Utilisée pour remplacer les barres basiques dans les modules historiques
 */
const AnimatedProgressBar = memo(({ 
  value = 0, 
  color = 'var(--sidebar-premium-gradient-1)', 
  label = '',
  showValue = true,
  animated = true 
}) => {
  const safeValue = Math.max(0, Math.min(100, value));
  
  return (
    <div className="progress-container">
      {label && (
        <div className="progress-label">{label}</div>
      )}
      <div className="progress-bar-bg">
        <div 
          className={`progress-bar-fill ${animated ? 'animated' : ''}`}
          style={{
            width: `${safeValue}%`,
            background: color
          }}
        />
      </div>
      {showValue && (
        <div className="progress-value">{safeValue}%</div>
      )}
    </div>
  );
});

AnimatedProgressBar.displayName = 'AnimatedProgressBar';

export default AnimatedProgressBar;