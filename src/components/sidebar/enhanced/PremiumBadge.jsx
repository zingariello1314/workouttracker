import React, { memo } from 'react';

/**
 * PremiumBadge - Badge premium avec effets visuels
 * Types: success, warning, info, error, xp, level
 */
const PremiumBadge = memo(({ 
  type = 'info', 
  value, 
  icon, 
  animated = true 
}) => {
  const getTypeStyles = (badgeType) => {
    const styles = {
      success: { 
        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        glow: 'rgba(34, 197, 94, 0.6)'
      },
      warning: { 
        background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
        glow: 'rgba(234, 179, 8, 0.6)'
      },
      info: { 
        background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
        glow: 'rgba(59, 130, 246, 0.6)'
      },
      error: { 
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        glow: 'rgba(239, 68, 68, 0.6)'
      },
      xp: { 
        background: 'var(--sidebar-premium-gradient-1)',
        glow: 'rgba(255, 20, 147, 0.6)'
      },
      level: { 
        background: 'var(--sidebar-premium-gradient-2)',
        glow: 'rgba(168, 85, 247, 0.6)'
      }
    };
    return styles[badgeType] || styles.info;
  };

  const typeStyles = getTypeStyles(type);

  return (
    <div 
      className={`badge-premium badge-${type} ${animated ? 'animated' : ''}`}
      style={{ '--badge-bg': typeStyles.background, '--badge-glow': typeStyles.glow }}
    >
      {icon && <span className="badge-icon">{icon}</span>}
      <span className="badge-value">{value}</span>
      <div className="badge-glow" />
    </div>
  );
});

PremiumBadge.displayName = 'PremiumBadge';

export default PremiumBadge;