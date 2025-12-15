import React, { memo, useState, useEffect, useMemo } from 'react';

/**
 * ThematicProgressBars - Barres de progression thématiques par projet
 * Avec animations créatives et interactions ludiques
 */
const ThematicProgressBars = memo(({ 
  data = [], 
  title = '',
  subtitle = '',
  className = '',
  animated = true,
  showLabels = true,
  showPercentages = true,
  showIcons = true,
  orientation = 'horizontal', // 'horizontal' ou 'vertical'
  theme = 'creative', // 'creative', 'minimal', 'gaming', 'artistic'
  onBarClick = null,
  onBarHover = null,
  height = 'auto',
  barHeight = 24,
  spacing = 16
}) => {
  const [animatedValues, setAnimatedValues] = useState({});
  const [hoveredBar, setHoveredBar] = useState(null);
  const [selectedBar, setSelectedBar] = useState(null);

  // Thèmes visuels
  const themes = {
    creative: {
      colors: {
        'Art': { bg: '#FF6B9D', gradient: 'linear-gradient(90deg, #FF6B9D, #FF8E9B)' },
        'Musique': { bg: '#4ECDC4', gradient: 'linear-gradient(90deg, #4ECDC4, #44A08D)' },
        'Écriture': { bg: '#FFEAA7', gradient: 'linear-gradient(90deg, #FFEAA7, #FDCB6E)' },
        'Design': { bg: '#DDA0DD', gradient: 'linear-gradient(90deg, #DDA0DD, #C39BD3)' },
        'Photo': { bg: '#98D8C8', gradient: 'linear-gradient(90deg, #98D8C8, #7FB3D3)' },
        'Vidéo': { bg: '#F7DC6F', gradient: 'linear-gradient(90deg, #F7DC6F, #F4D03F)' },
        'Projet': { bg: '#BB8FCE', gradient: 'linear-gradient(90deg, #BB8FCE, #A569BD)' }
      },
      effects: {
        glow: true,
        particles: true,
        wave: true
      }
    },
    gaming: {
      colors: {
        'Niveau 1': { bg: '#00FF00', gradient: 'linear-gradient(90deg, #00FF00, #32CD32)' },
        'Niveau 2': { bg: '#FFD700', gradient: 'linear-gradient(90deg, #FFD700, #FFA500)' },
        'Niveau 3': { bg: '#FF4500', gradient: 'linear-gradient(90deg, #FF4500, #FF6347)' },
        'Boss': { bg: '#8A2BE2', gradient: 'linear-gradient(90deg, #8A2BE2, #9932CC)' },
        'Quête': { bg: '#1E90FF', gradient: 'linear-gradient(90deg, #1E90FF, #4169E1)' }
      },
      effects: {
        glow: true,
        particles: true,
        pulse: true
      }
    },
    artistic: {
      colors: {
        'Peinture': { bg: '#E74C3C', gradient: 'linear-gradient(90deg, #E74C3C, #C0392B)' },
        'Sculpture': { bg: '#8E44AD', gradient: 'linear-gradient(90deg, #8E44AD, #9B59B6)' },
        'Dessin': { bg: '#3498DB', gradient: 'linear-gradient(90deg, #3498DB, #2980B9)' },
        'Digital': { bg: '#1ABC9C', gradient: 'linear-gradient(90deg, #1ABC9C, #16A085)' }
      },
      effects: {
        brush: true,
        texture: true,
        fade: true
      }
    },
    minimal: {
      colors: {
        'Projet': { bg: '#6C7B7F', gradient: 'linear-gradient(90deg, #6C7B7F, #566366)' }
      },
      effects: {
        clean: true
      }
    }
  };

  const currentTheme = themes[theme] || themes.creative;

  // Animation des valeurs
  useEffect(() => {
    if (!animated) {
      const initialValues = {};
      data.forEach(item => {
        initialValues[item.id || item.name] = item.value || 0;
      });
      setAnimatedValues(initialValues);
      return;
    }

    const animateValues = () => {
      const newValues = {};
      
      data.forEach(item => {
        const targetValue = item.value || 0;
        const currentValue = animatedValues[item.id || item.name] || 0;
        const diff = targetValue - currentValue;
        const step = diff * 0.1;
        
        newValues[item.id || item.name] = Math.abs(step) < 0.5 ? targetValue : currentValue + step;
      });
      
      setAnimatedValues(newValues);
    };

    const interval = setInterval(animateValues, 50);
    return () => clearInterval(interval);
  }, [data, animated, animatedValues]);

  // Préparation des données
  const processedData = useMemo(() => {
    return data.map((item, index) => {
      const category = item.category || item.type || 'Projet';
      const colorConfig = currentTheme.colors[category] || currentTheme.colors['Projet'] || currentTheme.colors[Object.keys(currentTheme.colors)[0]];
      
      return {
        ...item,
        id: item.id || item.name || index,
        category,
        colorConfig,
        animatedValue: animatedValues[item.id || item.name] || 0
      };
    });
  }, [data, currentTheme.colors, animatedValues]);

  // Obtenir l'icône selon la catégorie
  const getCategoryIcon = (category) => {
    const icons = {
      'Art': '🎨',
      'Musique': '🎵',
      'Écriture': '✍️',
      'Design': '🎯',
      'Photo': '📸',
      'Vidéo': '🎬',
      'Projet': '📋',
      'Peinture': '🖌️',
      'Sculpture': '🗿',
      'Dessin': '✏️',
      'Digital': '💻',
      'Niveau 1': '⭐',
      'Niveau 2': '🌟',
      'Niveau 3': '✨',
      'Boss': '👑',
      'Quête': '⚔️'
    };
    return icons[category] || '📊';
  };

  // Gestion des interactions
  const handleBarClick = (item, index) => {
    setSelectedBar(item);
    if (onBarClick) {
      onBarClick(item, index);
    }
  };

  const handleBarHover = (item, index) => {
    setHoveredBar(item);
    if (onBarHover) {
      onBarHover(item, index);
    }
  };

  if (!processedData || processedData.length === 0) {
    return (
      <div className={`thematic-progress-bars ${className}`}>
        {title && (
          <div className="progress-header">
            <h3 className="progress-title">{title}</h3>
            {subtitle && <p className="progress-subtitle">{subtitle}</p>}
          </div>
        )}
        <div className="progress-empty-state">
          <div className="empty-progress-icon">📊</div>
          <div className="empty-progress-message">Aucun projet en cours</div>
          <div className="empty-progress-suggestion">
            Vos projets et leur progression apparaîtront ici
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`thematic-progress-bars theme-${theme} ${className}`} style={{ height }}>
      {title && (
        <div className="progress-header">
          <h3 className="progress-title">{title}</h3>
          {subtitle && <p className="progress-subtitle">{subtitle}</p>}
        </div>
      )}
      
      <div className="progress-bars-container">
        {processedData.map((item, index) => {
          const isHovered = hoveredBar?.id === item.id;
          const isSelected = selectedBar?.id === item.id;
          const percentage = Math.min(Math.max(item.animatedValue || 0, 0), 100);
          
          return (
            <div
              key={item.id}
              className={`progress-bar-item ${isHovered ? 'hovered' : ''} ${isSelected ? 'selected' : ''}`}
              style={{ marginBottom: spacing }}
              onClick={() => handleBarClick(item, index)}
              onMouseEnter={() => handleBarHover(item, index)}
              onMouseLeave={() => setHoveredBar(null)}
            >
              {/* En-tête de la barre */}
              <div className="progress-bar-header">
                {showIcons && (
                  <span className="progress-icon">
                    {item.icon || getCategoryIcon(item.category)}
                  </span>
                )}
                
                {showLabels && (
                  <span className="progress-label">
                    {item.name || item.title}
                  </span>
                )}
                
                {showPercentages && (
                  <span className="progress-percentage">
                    {Math.round(percentage)}%
                  </span>
                )}
              </div>
              
              {/* Barre de progression */}
              <div 
                className="progress-bar-track"
                style={{ height: barHeight }}
              >
                {/* Fond de la barre */}
                <div className="progress-bar-background" />
                
                {/* Barre de progression principale */}
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${percentage}%`,
                    background: item.colorConfig.gradient || item.colorConfig.bg,
                    transition: animated ? 'width 0.3s ease' : 'none'
                  }}
                >
                  {/* Effets visuels selon le thème */}
                  {currentTheme.effects.glow && (
                    <div 
                      className="progress-glow"
                      style={{ backgroundColor: item.colorConfig.bg }}
                    />
                  )}
                  
                  {currentTheme.effects.particles && percentage > 10 && (
                    <div className="progress-particles">
                      {[...Array(3)].map((_, i) => (
                        <div 
                          key={i} 
                          className="particle"
                          style={{ 
                            backgroundColor: item.colorConfig.bg,
                            animationDelay: `${i * 0.2}s`
                          }}
                        />
                      ))}
                    </div>
                  )}
                  
                  {currentTheme.effects.wave && (
                    <div className="progress-wave" />
                  )}
                  
                  {currentTheme.effects.pulse && isHovered && (
                    <div 
                      className="progress-pulse"
                      style={{ backgroundColor: item.colorConfig.bg }}
                    />
                  )}
                </div>
                
                {/* Indicateur de position */}
                {percentage > 0 && (
                  <div
                    className="progress-indicator"
                    style={{
                      left: `${Math.min(percentage, 95)}%`,
                      backgroundColor: item.colorConfig.bg
                    }}
                  />
                )}
              </div>
              
              {/* Informations supplémentaires */}
              {(item.description || item.deadline || item.priority) && (
                <div className="progress-bar-meta">
                  {item.description && (
                    <span className="progress-description">
                      {item.description}
                    </span>
                  )}
                  
                  {item.deadline && (
                    <span className="progress-deadline">
                      📅 {new Date(item.deadline).toLocaleDateString('fr-FR')}
                    </span>
                  )}
                  
                  {item.priority && (
                    <span className={`progress-priority priority-${item.priority}`}>
                      {item.priority === 'high' ? '🔥' : item.priority === 'low' ? '📝' : '⭐'} 
                      {item.priority}
                    </span>
                  )}
                </div>
              )}
              
              {/* Tooltip au survol */}
              {isHovered && (
                <div className="progress-tooltip">
                  <div className="tooltip-content">
                    <div className="tooltip-title">{item.name || item.title}</div>
                    <div className="tooltip-progress">{Math.round(percentage)}% terminé</div>
                    {item.description && (
                      <div className="tooltip-description">{item.description}</div>
                    )}
                    {item.nextMilestone && (
                      <div className="tooltip-milestone">
                        Prochain jalon: {item.nextMilestone}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Panneau de détails pour l'élément sélectionné */}
      {selectedBar && (
        <div className="progress-details-panel">
          <div className="details-header">
            <div className="details-icon" style={{ backgroundColor: selectedBar.colorConfig.bg }}>
              {selectedBar.icon || getCategoryIcon(selectedBar.category)}
            </div>
            <div className="details-title-section">
              <h4>{selectedBar.name || selectedBar.title}</h4>
              <span className="details-category">{selectedBar.category}</span>
            </div>
            <button 
              className="close-details"
              onClick={() => setSelectedBar(null)}
            >
              ×
            </button>
          </div>
          
          <div className="details-content">
            <div className="details-progress-section">
              <div className="progress-circle">
                <svg width="80" height="80" viewBox="0 0 80 80">
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="6"
                    fill="transparent"
                  />
                  <circle
                    cx="40"
                    cy="40"
                    r="35"
                    stroke={selectedBar.colorConfig.bg}
                    strokeWidth="6"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 35}`}
                    strokeDashoffset={`${2 * Math.PI * 35 * (1 - (selectedBar.animatedValue || 0) / 100)}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                  />
                </svg>
                <div className="progress-circle-text">
                  {Math.round(selectedBar.animatedValue || 0)}%
                </div>
              </div>
              
              <div className="progress-stats">
                <div className="stat-item">
                  <span className="stat-label">Progression</span>
                  <span className="stat-value">{Math.round(selectedBar.animatedValue || 0)}%</span>
                </div>
                {selectedBar.timeSpent && (
                  <div className="stat-item">
                    <span className="stat-label">Temps passé</span>
                    <span className="stat-value">{selectedBar.timeSpent}</span>
                  </div>
                )}
                {selectedBar.estimatedTime && (
                  <div className="stat-item">
                    <span className="stat-label">Temps estimé</span>
                    <span className="stat-value">{selectedBar.estimatedTime}</span>
                  </div>
                )}
              </div>
            </div>
            
            {selectedBar.description && (
              <div className="details-description">
                {selectedBar.description}
              </div>
            )}
            
            {selectedBar.milestones && (
              <div className="details-milestones">
                <h5>Jalons:</h5>
                <ul>
                  {selectedBar.milestones.map((milestone, index) => (
                    <li key={index} className={milestone.completed ? 'completed' : ''}>
                      {milestone.completed ? '✅' : '⏳'} {milestone.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Informations d'accessibilité */}
      <div className="sr-only">
        Barres de progression thématiques pour {processedData.length} projets.
        Utilisez Tab pour naviguer entre les barres.
      </div>
    </div>
  );
});

ThematicProgressBars.displayName = 'ThematicProgressBars';

export default ThematicProgressBars;