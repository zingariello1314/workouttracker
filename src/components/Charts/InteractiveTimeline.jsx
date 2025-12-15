import React, { memo, useState, useMemo, useCallback } from 'react';

/**
 * InteractiveTimeline - Timeline interactive avec jalons visuels
 * Idéal pour visualiser l'évolution de projets créatifs dans le temps
 */
const InteractiveTimeline = memo(({ 
  data = [], 
  title = '',
  subtitle = '',
  height = 400,
  className = '',
  onMilestoneClick = null,
  onMilestoneHover = null,
  showProgress = true,
  colorScheme = 'creative',
  orientation = 'vertical' // 'vertical' ou 'horizontal'
}) => {
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [hoveredMilestone, setHoveredMilestone] = useState(null);

  // Schémas de couleurs thématiques
  const colorSchemes = {
    creative: {
      primary: '#FF6B9D',
      secondary: '#4ECDC4',
      accent: '#45B7D1',
      success: '#96CEB4',
      warning: '#FFEAA7',
      background: 'rgba(255, 107, 157, 0.1)'
    },
    professional: {
      primary: '#3B82F6',
      secondary: '#8B5CF6',
      accent: '#10B981',
      success: '#059669',
      warning: '#F59E0B',
      background: 'rgba(59, 130, 246, 0.1)'
    },
    artistic: {
      primary: '#DDA0DD',
      secondary: '#98D8C8',
      accent: '#F7DC6F',
      success: '#85C1E9',
      warning: '#F8C471',
      background: 'rgba(221, 160, 221, 0.1)'
    }
  };

  const colors = colorSchemes[colorScheme] || colorSchemes.creative;

  // Préparation et tri des données par date
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data
      .map((item, index) => ({
        ...item,
        id: item.id || index,
        date: new Date(item.date || Date.now()),
        status: item.status || 'pending', // 'completed', 'in-progress', 'pending', 'cancelled'
        importance: item.importance || 'normal' // 'high', 'normal', 'low'
      }))
      .sort((a, b) => a.date - b.date);
  }, [data]);

  // Calcul de la progression globale
  const progressStats = useMemo(() => {
    const total = processedData.length;
    const completed = processedData.filter(item => item.status === 'completed').length;
    const inProgress = processedData.filter(item => item.status === 'in-progress').length;
    
    return {
      total,
      completed,
      inProgress,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }, [processedData]);

  // Gestion des interactions
  const handleMilestoneClick = useCallback((milestone, index) => {
    setSelectedMilestone(milestone);
    if (onMilestoneClick) {
      onMilestoneClick(milestone, index);
    }
  }, [onMilestoneClick]);

  const handleMilestoneHover = useCallback((milestone, index) => {
    setHoveredMilestone(milestone);
    if (onMilestoneHover) {
      onMilestoneHover(milestone, index);
    }
  }, [onMilestoneHover]);

  // Obtenir la couleur selon le statut
  const getStatusColor = (status, importance = 'normal') => {
    const baseColors = {
      completed: colors.success,
      'in-progress': colors.primary,
      pending: colors.secondary,
      cancelled: '#9CA3AF'
    };

    let color = baseColors[status] || colors.secondary;
    
    // Intensité selon l'importance
    if (importance === 'high') {
      color = color.replace(')', ', 1)').replace('rgb', 'rgba');
    } else if (importance === 'low') {
      color = color.replace(')', ', 0.6)').replace('rgb', 'rgba');
    }

    return color;
  };

  // Obtenir l'icône selon le type et le statut
  const getStatusIcon = (status, type) => {
    const icons = {
      completed: '✅',
      'in-progress': '🔄',
      pending: '⏳',
      cancelled: '❌'
    };

    const typeIcons = {
      milestone: '🎯',
      release: '🚀',
      meeting: '👥',
      deadline: '📅',
      achievement: '🏆',
      idea: '💡',
      review: '🔍'
    };

    return typeIcons[type] || icons[status] || '📌';
  };

  if (!processedData || processedData.length === 0) {
    return (
      <div className={`interactive-timeline-container ${className}`}>
        {title && (
          <div className="timeline-header">
            <h3 className="timeline-title">{title}</h3>
            {subtitle && <p className="timeline-subtitle">{subtitle}</p>}
          </div>
        )}
        <div className="timeline-empty-state">
          <div className="empty-timeline-icon">📅</div>
          <div className="empty-timeline-message">Aucun jalon défini</div>
          <div className="empty-timeline-suggestion">
            Vos jalons et événements importants apparaîtront ici
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`interactive-timeline-container ${className} timeline-${orientation}`}>
      {title && (
        <div className="timeline-header">
          <h3 className="timeline-title">{title}</h3>
          {subtitle && <p className="timeline-subtitle">{subtitle}</p>}
          
          {showProgress && (
            <div className="timeline-progress">
              <div className="progress-stats">
                <span className="stat-item">
                  <span className="stat-value">{progressStats.completed}</span>
                  <span className="stat-label">Terminés</span>
                </span>
                <span className="stat-item">
                  <span className="stat-value">{progressStats.inProgress}</span>
                  <span className="stat-label">En cours</span>
                </span>
                <span className="stat-item">
                  <span className="stat-value">{progressStats.percentage}%</span>
                  <span className="stat-label">Progression</span>
                </span>
              </div>
              <div className="progress-bar-timeline">
                <div 
                  className="progress-fill-timeline"
                  style={{ 
                    width: `${progressStats.percentage}%`,
                    backgroundColor: colors.success
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="timeline-wrapper" style={{ height }}>
        <div className="timeline-line" style={{ backgroundColor: colors.background }} />
        
        <div className="timeline-items">
          {processedData.map((milestone, index) => {
            const isHovered = hoveredMilestone?.id === milestone.id;
            const isSelected = selectedMilestone?.id === milestone.id;
            const statusColor = getStatusColor(milestone.status, milestone.importance);
            const icon = getStatusIcon(milestone.status, milestone.type);
            
            return (
              <div
                key={milestone.id}
                className={`timeline-item ${milestone.status} importance-${milestone.importance} ${isHovered ? 'hovered' : ''} ${isSelected ? 'selected' : ''}`}
                style={{
                  [orientation === 'vertical' ? 'top' : 'left']: `${(index / (processedData.length - 1)) * 90}%`
                }}
                onClick={() => handleMilestoneClick(milestone, index)}
                onMouseEnter={() => handleMilestoneHover(milestone, index)}
                onMouseLeave={() => setHoveredMilestone(null)}
              >
                {/* Point de la timeline */}
                <div 
                  className="timeline-point"
                  style={{ 
                    backgroundColor: statusColor,
                    borderColor: isSelected ? '#fff' : statusColor
                  }}
                >
                  <span className="timeline-icon">{icon}</span>
                  
                  {/* Effet de pulsation pour les éléments en cours */}
                  {milestone.status === 'in-progress' && (
                    <div className="timeline-pulse" style={{ backgroundColor: statusColor }} />
                  )}
                </div>
                
                {/* Contenu du jalon */}
                <div className="timeline-content">
                  <div className="timeline-date">
                    {milestone.date.toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: milestone.date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                    })}
                  </div>
                  
                  <div className="timeline-title-item">
                    {milestone.title || milestone.name}
                  </div>
                  
                  {milestone.description && (
                    <div className="timeline-description">
                      {milestone.description}
                    </div>
                  )}
                  
                  {milestone.tags && (
                    <div className="timeline-tags">
                      {milestone.tags.map((tag, tagIndex) => (
                        <span 
                          key={tagIndex} 
                          className="timeline-tag"
                          style={{ backgroundColor: statusColor + '20', color: statusColor }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Indicateur de durée si disponible */}
                  {milestone.duration && (
                    <div className="timeline-duration">
                      <span className="duration-icon">⏱️</span>
                      <span className="duration-text">{milestone.duration}</span>
                    </div>
                  )}
                </div>
                
                {/* Ligne de connexion */}
                {index < processedData.length - 1 && (
                  <div 
                    className="timeline-connector"
                    style={{ backgroundColor: colors.background }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Panneau de détails pour le jalon sélectionné */}
      {selectedMilestone && (
        <div className="timeline-details-panel">
          <div className="details-header">
            <div className="details-icon" style={{ backgroundColor: getStatusColor(selectedMilestone.status) }}>
              {getStatusIcon(selectedMilestone.status, selectedMilestone.type)}
            </div>
            <div className="details-title-section">
              <h4>{selectedMilestone.title || selectedMilestone.name}</h4>
              <span className="details-status">{selectedMilestone.status}</span>
            </div>
            <button 
              className="close-details"
              onClick={() => setSelectedMilestone(null)}
            >
              ×
            </button>
          </div>
          
          <div className="details-content">
            <div className="details-meta">
              <div className="meta-item">
                <span className="meta-label">Date:</span>
                <span className="meta-value">
                  {selectedMilestone.date.toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              
              {selectedMilestone.importance && (
                <div className="meta-item">
                  <span className="meta-label">Importance:</span>
                  <span className={`meta-value importance-${selectedMilestone.importance}`}>
                    {selectedMilestone.importance === 'high' ? '🔥 Élevée' : 
                     selectedMilestone.importance === 'low' ? '📝 Faible' : '⭐ Normale'}
                  </span>
                </div>
              )}
            </div>
            
            {selectedMilestone.description && (
              <div className="details-description">
                {selectedMilestone.description}
              </div>
            )}
            
            {selectedMilestone.objectives && (
              <div className="details-objectives">
                <h5>Objectifs:</h5>
                <ul>
                  {selectedMilestone.objectives.map((objective, index) => (
                    <li key={index}>{objective}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {selectedMilestone.deliverables && (
              <div className="details-deliverables">
                <h5>Livrables:</h5>
                <ul>
                  {selectedMilestone.deliverables.map((deliverable, index) => (
                    <li key={index}>{deliverable}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Légende des statuts */}
      <div className="timeline-legend">
        <div className="legend-title">Statuts</div>
        <div className="legend-items">
          {[
            { status: 'completed', label: 'Terminé', icon: '✅' },
            { status: 'in-progress', label: 'En cours', icon: '🔄' },
            { status: 'pending', label: 'En attente', icon: '⏳' },
            { status: 'cancelled', label: 'Annulé', icon: '❌' }
          ].map(({ status, label, icon }) => (
            <div key={status} className="timeline-legend-item">
              <div 
                className="legend-point" 
                style={{ backgroundColor: getStatusColor(status) }}
              >
                {icon}
              </div>
              <span className="legend-text">{label}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Informations d'accessibilité */}
      <div className="sr-only">
        Timeline interactive avec {processedData.length} jalons.
        {progressStats.completed} terminés sur {progressStats.total}.
        Utilisez Tab pour naviguer entre les jalons.
      </div>
    </div>
  );
});

InteractiveTimeline.displayName = 'InteractiveTimeline';

export default InteractiveTimeline;