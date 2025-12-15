/**
 * Wrapper Harmonisé pour Graphiques
 * Phase 6 - Tâche 6.1 : Cohérence visuelle globale
 * 
 * Ce composant wrapper applique automatiquement les standards visuels
 * harmonisés à tous les graphiques pour garantir la cohérence.
 */

import React, { memo, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import chartHarmonyService from '../../services/charts/chartHarmonyService';
import '../../styles/charts-visual-harmony.css';

const HarmonizedChartWrapper = memo(({
  children,
  title,
  subtitle,
  icon,
  domain = 'performance',
  variant = 'default',
  height = 'normal',
  showHeader = true,
  showBorder = true,
  interactive = true,
  loading = false,
  error = null,
  empty = false,
  emptyMessage = 'Aucune donnée disponible',
  emptyIcon = '📊',
  className = '',
  style = {},
  onHeaderClick,
  badge,
  actions,
  ...props
}) => {
  const containerRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  // Application automatique des styles harmonisés
  useEffect(() => {
    if (containerRef.current) {
      chartHarmonyService.applyHarmonizedStyles(containerRef.current, {
        domain,
        variant,
        interactive
      });
    }
  }, [domain, variant, interactive]);

  // Configuration de la hauteur harmonisée
  const harmonizedHeight = typeof height === 'string' 
    ? chartHarmonyService.CHART_CONFIGS.DIMENSIONS.heights[height] 
    : height;

  // Classes CSS harmonisées
  const containerClasses = [
    'chart-container-unified',
    interactive && 'chart-interactive',
    loading && 'chart-loading',
    error && 'chart-error',
    empty && 'chart-empty',
    className
  ].filter(Boolean).join(' ');

  // Styles harmonisés
  const containerStyle = {
    minHeight: harmonizedHeight,
    ...style
  };

  // Gestion des événements
  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  // Rendu de l'en-tête harmonisé
  const renderHeader = () => {
    if (!showHeader || (!title && !subtitle && !icon && !badge && !actions)) {
      return null;
    }

    return (
      <div className="chart-header-unified">
        <div className="chart-header-content">
          {icon && (
            <span className="chart-icon-unified" style={{ 
              color: chartHarmonyService.CHART_COLORS.DOMAINS[domain] 
            }}>
              {icon}
            </span>
          )}
          
          <div className="chart-header-text">
            {title && (
              <h3 
                className="chart-title-unified"
                onClick={onHeaderClick}
                style={{ cursor: onHeaderClick ? 'pointer' : 'default' }}
              >
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="chart-subtitle-unified">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="chart-header-actions">
          {badge && (
            <div className={`chart-badge-unified chart-badge-${badge.type || 'info'}`}>
              {badge.icon && <span>{badge.icon}</span>}
              {badge.text}
            </div>
          )}
          
          {actions && (
            <div className="chart-actions">
              {actions}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Rendu de l'état de chargement
  const renderLoading = () => (
    <div className="chart-loading-unified">
      <div className="chart-loading-spinner" />
      <div className="chart-loading-text">
        Chargement des données...
      </div>
    </div>
  );

  // Rendu de l'état d'erreur
  const renderError = () => (
    <div className="chart-empty-state-unified">
      <div className="chart-empty-icon">⚠️</div>
      <div className="chart-empty-title">Erreur de chargement</div>
      <div className="chart-empty-message">
        {typeof error === 'string' ? error : 'Impossible de charger les données du graphique'}
      </div>
    </div>
  );

  // Rendu de l'état vide
  const renderEmpty = () => (
    <div className="chart-empty-state-unified">
      <div className="chart-empty-icon">{emptyIcon}</div>
      <div className="chart-empty-title">Aucune donnée</div>
      <div className="chart-empty-message">
        {emptyMessage}
      </div>
    </div>
  );

  // Rendu du contenu principal
  const renderContent = () => {
    if (loading) return renderLoading();
    if (error) return renderError();
    if (empty) return renderEmpty();

    return (
      <div className="chart-content-unified">
        {children}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={containerClasses}
      style={containerStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-chart-domain={domain}
      data-chart-variant={variant}
      data-chart-interactive={interactive}
      data-chart-hovered={isHovered}
      {...props}
    >
      {renderHeader()}
      {renderContent()}
    </div>
  );
});

HarmonizedChartWrapper.displayName = 'HarmonizedChartWrapper';

HarmonizedChartWrapper.propTypes = {
  // Contenu
  children: PropTypes.node,
  
  // En-tête
  title: PropTypes.string,
  subtitle: PropTypes.string,
  icon: PropTypes.string,
  showHeader: PropTypes.bool,
  onHeaderClick: PropTypes.func,
  
  // Badge et actions
  badge: PropTypes.shape({
    type: PropTypes.oneOf(['success', 'warning', 'error', 'info']),
    text: PropTypes.string,
    icon: PropTypes.string
  }),
  actions: PropTypes.node,
  
  // Configuration visuelle
  domain: PropTypes.oneOf([
    'finance', 'health', 'learning', 'creativity', 
    'performance', 'social', 'technology', 'balance'
  ]),
  variant: PropTypes.oneOf(['default', 'compact', 'expanded', 'minimal']),
  height: PropTypes.oneOfType([
    PropTypes.oneOf(['compact', 'normal', 'expanded', 'large']),
    PropTypes.number
  ]),
  showBorder: PropTypes.bool,
  interactive: PropTypes.bool,
  
  // États
  loading: PropTypes.bool,
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  empty: PropTypes.bool,
  emptyMessage: PropTypes.string,
  emptyIcon: PropTypes.string,
  
  // Styles
  className: PropTypes.string,
  style: PropTypes.object
};

// ===== COMPOSANTS SPÉCIALISÉS =====

/**
 * Wrapper spécialisé pour les graphiques de la sidebar
 */
export const SidebarChartWrapper = memo((props) => (
  <HarmonizedChartWrapper
    variant="compact"
    height="compact"
    interactive={true}
    {...props}
  />
));

/**
 * Wrapper spécialisé pour les graphiques du dashboard
 */
export const DashboardChartWrapper = memo((props) => (
  <HarmonizedChartWrapper
    variant="expanded"
    height="normal"
    interactive={true}
    showHeader={true}
    {...props}
  />
));

/**
 * Wrapper spécialisé pour les graphiques modaux
 */
export const ModalChartWrapper = memo((props) => (
  <HarmonizedChartWrapper
    variant="expanded"
    height="large"
    interactive={true}
    showHeader={true}
    showBorder={false}
    {...props}
  />
));

/**
 * Wrapper spécialisé pour les mini-graphiques
 */
export const MiniChartWrapper = memo((props) => (
  <HarmonizedChartWrapper
    variant="minimal"
    height="compact"
    interactive={false}
    showHeader={false}
    showBorder={false}
    {...props}
  />
));

// ===== HOOKS UTILITAIRES =====

/**
 * Hook pour appliquer automatiquement l'harmonisation
 */
export const useChartHarmony = (domain = 'performance', options = {}) => {
  const chartRef = useRef(null);

  useEffect(() => {
    if (chartRef.current) {
      chartHarmonyService.applyHarmonizedStyles(chartRef.current, {
        domain,
        ...options
      });
    }
  }, [domain, options]);

  return chartRef;
};

/**
 * Hook pour générer des couleurs harmonisées
 */
export const useHarmonizedColors = (count, domain = 'performance') => {
  return React.useMemo(() => {
    return chartHarmonyService.generateColorPalette(count, { domain });
  }, [count, domain]);
};

/**
 * Hook pour les configurations harmonisées
 */
export const useHarmonizedConfig = (chartType, options = {}) => {
  return React.useMemo(() => {
    return chartHarmonyService.harmonizeChartProps(options, chartType);
  }, [chartType, options]);
};

export default HarmonizedChartWrapper;