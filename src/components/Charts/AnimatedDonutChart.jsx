import React, { memo, useState, useEffect, useMemo } from 'react';

/**
 * AnimatedDonutChart - Graphique donut avec animation progressive
 * Affiche des pourcentages de manière claire et engageante
 */
const AnimatedDonutChart = memo(({ 
  value = 0, 
  maxValue = 100, 
  color = '#10B981',
  backgroundColor = 'rgba(255, 255, 255, 0.1)',
  label = '', 
  size = 120,
  strokeWidth = 8,
  showPercentage = true,
  showValue = false,
  formatValue = null,
  animated = true,
  duration = 1500,
  className = ''
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  
  // Animation progressive de la valeur
  useEffect(() => {
    if (!animated) {
      setAnimatedValue(value);
      return;
    }

    const startTime = Date.now();
    const startValue = animatedValue;
    const targetValue = Math.min(value, maxValue);
    const valueChange = targetValue - startValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Courbe d'animation ease-out
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (valueChange * easeOut);
      
      setAnimatedValue(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [value, maxValue, animated, duration]);

  const percentage = Math.min((animatedValue / maxValue) * 100, 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Formatage de la valeur affichée
  const displayValue = useMemo(() => {
    if (formatValue) {
      return formatValue(animatedValue);
    }
    
    if (showPercentage) {
      return `${Math.round(percentage)}%`;
    }
    
    if (showValue) {
      return Math.round(animatedValue).toLocaleString('fr-FR');
    }
    
    return `${Math.round(percentage)}%`;
  }, [animatedValue, percentage, formatValue, showPercentage, showValue]);

  // Couleur adaptative selon la valeur
  const adaptiveColor = useMemo(() => {
    if (typeof color === 'string') return color;
    
    // Couleur basée sur le pourcentage
    if (percentage >= 80) return '#10B981'; // Vert
    if (percentage >= 60) return '#F59E0B'; // Orange
    if (percentage >= 40) return '#EF4444'; // Rouge
    return '#6B7280'; // Gris
  }, [color, percentage]);

  return (
    <div className={`animated-donut-chart ${className}`}>
      <div className="donut-chart-container" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="donut-chart-svg">
          {/* Cercle de fond */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            className="donut-background"
          />
          
          {/* Cercle de progression */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={adaptiveColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="donut-progress"
            style={{
              transition: animated ? 'stroke-dashoffset 0.3s ease' : 'none',
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%'
            }}
          />
          
          {/* Effet de brillance */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#donutGradient)"
            strokeWidth={1}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="donut-shine"
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%',
              opacity: 0.6
            }}
          />
          
          {/* Définition du gradient pour l'effet de brillance */}
          <defs>
            <linearGradient id="donutGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.8)" />
              <stop offset="50%" stopColor="rgba(255, 255, 255, 0.2)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Contenu central */}
        <div className="donut-center">
          <div className="donut-value" style={{ color: adaptiveColor }}>
            {displayValue}
          </div>
          {label && (
            <div className="donut-label">
              {label}
            </div>
          )}
        </div>
      </div>
      
      {/* Indicateur de progression textuel pour l'accessibilité */}
      <div className="sr-only" role="progressbar" aria-valuenow={percentage} aria-valuemin="0" aria-valuemax="100">
        {label}: {displayValue}
      </div>
    </div>
  );
});

AnimatedDonutChart.displayName = 'AnimatedDonutChart';

export default AnimatedDonutChart;