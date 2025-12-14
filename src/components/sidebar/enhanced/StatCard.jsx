import React, { memo } from 'react';

/**
 * StatCard - Carte de statistique premium
 * Remplace les cartes basiques pour un rendu plus riche
 */
const StatCard = memo(({ 
  title, 
  value, 
  trend, 
  icon, 
  color = 'var(--sidebar-cyan)',
  onClick,
  loading = false,
  error = false
}) => {
  if (loading) {
    return (
      <div className="stat-card-premium loading">
        <div className="skeleton-card animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="stat-card-premium error">
        <div className="error-container-elegant">
          <div className="error-icon-animated">⚠️</div>
          <div className="error-message">Erreur de chargement</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`stat-card-premium ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="stat-header">
        {icon && (
          <span className="stat-icon" style={{ color }}>
            {icon}
          </span>
        )}
        {trend && (
          <span className="stat-trend">{trend}</span>
        )}
      </div>
      <div className="stat-value" style={{ color }}>
        {value}
      </div>
      <div className="stat-title">{title}</div>
      <div className="stat-background-pattern" />
    </div>
  );
});

StatCard.displayName = 'StatCard';

export default StatCard;