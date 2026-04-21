import React, { memo, Suspense, lazy } from 'react';
import { useModuleAlternation } from '../../hooks/useModuleAlternation';
import { getSidebarModuleTheme } from '../../utils/sidebar/sidebarModuleTheme';
import SidebarSectionErrorBoundary from './SidebarSectionErrorBoundary';

// Lazy loading des modules historiques (sidebar)
const SidebarSportPlanningModule = lazy(() => import('./historical/SidebarSportPlanningModule'));
const SidebarSportCalendarModule = lazy(() => import('./historical/SidebarSportCalendarModule'));
const SidebarDailyQuestsModule = lazy(() => import('./historical/SidebarDailyQuestsModule'));
const SidebarReadingSessionModule = lazy(() => import('./historical/SidebarReadingSessionModule'));
const SidebarBookFocusModule = lazy(() => import('./historical/SidebarBookFocusModule'));
const SidebarBooksRecapModule = lazy(() => import('./historical/SidebarBooksRecapModule'));
const GarminRunningSidebarModule = lazy(() => import('./historical/GarminRunningSidebarModule'));
const SidebarMuscuRecapModule = lazy(() => import('./historical/SidebarMuscuRecapModule'));
const SidebarBodyRecapModule = lazy(() => import('./historical/SidebarBodyRecapModule'));
const ReadingProgressModule = lazy(() => import('./historical/ReadingProgressModule'));
const GarminMetricsModule = lazy(() => import('./historical/GarminMetricsModule'));
const SidebarFinanceSnapshotModule = lazy(() => import('./historical/SidebarFinanceSnapshotModule'));
const ShoppingListModule = lazy(() => import('./historical/ShoppingListModule'));
const ActiveReadingSessionModule = lazy(() => import('./historical/ActiveReadingSessionModule'));
const CreativityProjectsModule = lazy(() => import('./historical/CreativityProjectsModule'));
const GlobalPerformanceModule = lazy(() => import('./historical/GlobalPerformanceModule'));
const ExpressLearningModule = lazy(() => import('./historical/ExpressLearningModule'));

/**
 * Mapping des composants par nom
 */
const COMPONENT_MAP = {
  SidebarSportPlanningModule,
  SidebarSportCalendarModule,
  SidebarDailyQuestsModule,
  SidebarReadingSessionModule,
  SidebarBookFocusModule,
  SidebarBooksRecapModule,
  GarminRunningSidebarModule,
  SidebarMuscuRecapModule,
  SidebarBodyRecapModule,
  ReadingProgressModule,
  GarminMetricsModule,
  SidebarFinanceSnapshotModule,
  ShoppingListModule,
  ActiveReadingSessionModule,
  CreativityProjectsModule,
  GlobalPerformanceModule,
  ExpressLearningModule
};

/**
 * Composant de fallback pour le chargement
 */
const ModuleLoadingFallback = memo(({ moduleId }) => (
  <div className="sidebar-module-loading" role="status" aria-label={`Chargement du module ${moduleId}`}>
    <div className="sidebar-loading-spinner" aria-hidden="true"></div>
    <span className="sidebar-loading-text">Chargement...</span>
  </div>
));

ModuleLoadingFallback.displayName = 'ModuleLoadingFallback';

/**
 * Composant de fallback pour les erreurs
 */
const ModuleErrorFallback = memo(({ moduleId, error }) => (
  <div className="sidebar-module-error" role="alert">
    <div className="sidebar-error-icon" aria-hidden="true">⚠️</div>
    <div className="sidebar-error-content">
      <h4>Erreur de module</h4>
      <p>Le module "{moduleId}" n'a pas pu être chargé.</p>
      {error && <small>{error.message}</small>}
    </div>
  </div>
));

ModuleErrorFallback.displayName = 'ModuleErrorFallback';

/**
 * Composant pour rendre un module individuel
 */
const ModuleItem = memo(({ 
  module, 
  sidebarProps, 
  onModuleError 
}) => {
  const Component = COMPONENT_MAP[module.component];

  if (!Component) {
    return (
      <ModuleErrorFallback 
        moduleId={module.id} 
        error={new Error(`Composant ${module.component} non trouvé`)} 
      />
    );
  }

  // Props spécifiques selon le type de module
  const getModuleProps = () => {
    const baseProps = {
      moduleId: module.id,
      moduleType: module.type,
      navigationTarget: module.navigationTarget,
      ...sidebarProps
    };

    if (module.type === 'legacy') {
      return baseProps;
    }

    // Props pour les modules historiques
    const historicalData = sidebarProps.data || {};
    
    const finalData = {
      books: historicalData.learning?.books || [],
      subjects: historicalData.learning?.subjects || [],
      learning: historicalData.learning || {},
      activeReadingSession: historicalData.learning?.activeReadingSession || {},
      metrics: historicalData.metrics || {},
      quests: historicalData.quests || [],
      sport: historicalData.sport || {},
      finance: historicalData.finance || {},
      nutrition: historicalData.nutrition || {},
      shoppingLists: historicalData.shopping?.shoppingLists || [],
      loading: historicalData.shopping?.loading || false,
      error: historicalData.shopping?.error || null,
      today: historicalData.today || {}
    };

    return {
      moduleId: module.id,
      moduleType: module.type,
      navigationTarget: module.navigationTarget,
      navigation: sidebarProps.navigation,
      setActiveTab: sidebarProps.setActiveTab,
      data: finalData,
      todayDate: sidebarProps.todayDate || new Date().toISOString().slice(0, 10),
      isLoading: false,
      isExpanded: sidebarProps.isSectionExpanded(module.id),
      onToggle: () => sidebarProps.toggleSection(module.id)
    };
  };

  return (
    <SidebarSectionErrorBoundary
      sectionName={module.id}
      onError={onModuleError}
    >
      <Suspense fallback={<ModuleLoadingFallback moduleId={module.id} />}>
        <div 
          className={`sidebar-module sidebar-module-${module.type}`}
          data-module-id={module.id}
          data-module-type={module.type}
          data-module-position={module.position}
          data-sidebar-theme={module.type === 'historical' ? getSidebarModuleTheme(module.id) : undefined}
        >
          <Component {...getModuleProps()} />
        </div>
      </Suspense>
    </SidebarSectionErrorBoundary>
  );
});

ModuleItem.displayName = 'ModuleItem';

/**
 * Composant principal pour rendre tous les modules dans l'ordre d'alternance
 * Requirement 13.1, 13.2, 13.3: Gestion de l'entremêlement et de l'ordre
 */
const ModuleRenderer = memo(({ 
  sidebarProps,
  onModuleError,
  className = ''
}) => {
  const { 
    alternationPattern, 
    isLoading, 
    error, 
    validation 
  } = useModuleAlternation();

  // Débogage uniquement : la validation est corrigée côté service quand il n’y a pas de modules legacy.
  React.useEffect(() => {
    if (
      import.meta.env.DEV &&
      !validation.isValid &&
      validation.errors.length > 0
    ) {
      console.warn('Problèmes de validation du pattern d\'alternance:', validation.errors);
    }
  }, [validation]);

  if (isLoading) {
    return (
      <div className={`sidebar-modules-loading ${className}`} role="status">
        <ModuleLoadingFallback moduleId="pattern" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`sidebar-modules-error ${className}`} role="alert">
        <ModuleErrorFallback moduleId="pattern" error={new Error(error)} />
      </div>
    );
  }

  return (
    <div 
      className={`sidebar-modules-container ${className}`}
      role="region"
      aria-label="Modules de la sidebar"
    >
      {alternationPattern.map((module) => (
        <ModuleItem
          key={module.id}
          module={module}
          sidebarProps={sidebarProps}
          onModuleError={onModuleError}
        />
      ))}
      
      {/* Indicateur de validation pour le développement */}
      {process.env.NODE_ENV === 'development' && !validation.isValid && (
        <div className="sidebar-validation-warning" role="alert">
          <strong>Avertissement de développement:</strong>
          <ul>
            {validation.errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});

ModuleRenderer.displayName = 'ModuleRenderer';

export default ModuleRenderer;
