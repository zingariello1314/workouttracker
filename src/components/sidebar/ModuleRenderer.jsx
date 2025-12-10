import React, { memo, Suspense, lazy } from 'react';
import { useModuleAlternation } from '../../hooks/useModuleAlternation';
import SidebarSectionErrorBoundary from './SidebarSectionErrorBoundary';

// Lazy loading des composants existants (legacy)
const ActionsRapidesSection = lazy(() => import('./ActionsRapidesSection'));
const AujourdhuiSection = lazy(() => import('./AujourdhuiSection'));
const ProgressionGlobaleSection = lazy(() => import('./ProgressionGlobaleSection'));
const QuestesJourSection = lazy(() => import('./QuestesJourSection'));
const ActivitePhysiqueSection = lazy(() => import('./ActivitePhysiqueSection'));
const LectureSection = lazy(() => import('./LectureSection'));
const FinancesSection = lazy(() => import('./FinancesSection'));
const NutritionSection = lazy(() => import('./NutritionSection'));

// Lazy loading des nouveaux composants historiques (à créer)
const SessionRecorderModule = lazy(() => import('./historical/SessionRecorderModule'));
const ReadingProgressModule = lazy(() => import('./historical/ReadingProgressModule'));
const GarminMetricsModule = lazy(() => import('./historical/GarminMetricsModule'));
const InteractiveQuestsModule = lazy(() => import('./historical/InteractiveQuestsModule'));
const PatrimonyEvolutionModule = lazy(() => import('./historical/PatrimonyEvolutionModule'));
const ShoppingListModule = lazy(() => import('./historical/ShoppingListModule'));
const ActiveReadingSessionModule = lazy(() => import('./historical/ActiveReadingSessionModule'));
const DailyTrainingModule = lazy(() => import('./historical/DailyTrainingModule'));
const CreativityProjectsModule = lazy(() => import('./historical/CreativityProjectsModule'));
const GlobalPerformanceModule = lazy(() => import('./historical/GlobalPerformanceModule'));
const ExpressLearningModule = lazy(() => import('./historical/ExpressLearningModule'));

/**
 * Mapping des composants par nom
 */
const COMPONENT_MAP = {
  // Composants legacy
  'ActionsRapidesSection': ActionsRapidesSection,
  'AujourdhuiSection': AujourdhuiSection,
  'ProgressionGlobaleSection': ProgressionGlobaleSection,
  'QuestesJourSection': QuestesJourSection,
  'ActivitePhysiqueSection': ActivitePhysiqueSection,
  'LectureSection': LectureSection,
  'FinancesSection': FinancesSection,
  'NutritionSection': NutritionSection,

  // Nouveaux composants historiques
  'SessionRecorderModule': SessionRecorderModule,
  'ReadingProgressModule': ReadingProgressModule,
  'GarminMetricsModule': GarminMetricsModule,
  'InteractiveQuestsModule': InteractiveQuestsModule,
  'PatrimonyEvolutionModule': PatrimonyEvolutionModule,
  'ShoppingListModule': ShoppingListModule,
  'ActiveReadingSessionModule': ActiveReadingSessionModule,
  'DailyTrainingModule': DailyTrainingModule,
  'CreativityProjectsModule': CreativityProjectsModule,
  'GlobalPerformanceModule': GlobalPerformanceModule,
  'ExpressLearningModule': ExpressLearningModule
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

    // Props spécifiques pour les modules legacy
    if (module.type === 'legacy') {
      switch (module.component) {
        case 'ActionsRapidesSection':
          return {
            isExpanded: sidebarProps.isSectionExpanded('actions'),
            onToggle: () => sidebarProps.toggleSection('actions'),
            navigation: sidebarProps.navigation
          };
        case 'AujourdhuiSection':
          return {
            isExpanded: sidebarProps.isSectionExpanded('today'),
            onToggle: () => sidebarProps.toggleSection('today'),
            data: sidebarProps.data?.today,
            navigation: sidebarProps.navigation,
            todayDate: sidebarProps.todayDate
          };
        case 'ProgressionGlobaleSection':
          return {
            isExpanded: sidebarProps.isSectionExpanded('metrics'),
            onToggle: () => sidebarProps.toggleSection('metrics'),
            metrics: sidebarProps.data?.metrics,
            navigation: sidebarProps.navigation
          };
        case 'QuestesJourSection':
          return {
            isExpanded: sidebarProps.isSectionExpanded('quests'),
            onToggle: () => sidebarProps.toggleSection('quests'),
            quests: sidebarProps.data?.quests,
            navigation: sidebarProps.navigation
          };
        case 'ActivitePhysiqueSection':
          return {
            isExpanded: sidebarProps.isSectionExpanded('sport'),
            onToggle: () => sidebarProps.toggleSection('sport'),
            data: sidebarProps.data?.sport,
            navigation: sidebarProps.navigation
          };
        case 'LectureSection':
          return {
            isExpanded: sidebarProps.isSectionExpanded('books'),
            onToggle: () => sidebarProps.toggleSection('books'),
            data: sidebarProps.data?.learning,
            navigation: sidebarProps.navigation,
            todayDate: sidebarProps.todayDate
          };
        case 'FinancesSection':
          return {
            isExpanded: sidebarProps.isSectionExpanded('finance'),
            onToggle: () => sidebarProps.toggleSection('finance'),
            data: sidebarProps.data?.finance,
            navigation: sidebarProps.navigation
          };
        case 'NutritionSection':
          return {
            isExpanded: sidebarProps.isSectionExpanded('nutrition'),
            onToggle: () => sidebarProps.toggleSection('nutrition'),
            data: sidebarProps.data?.nutrition,
            navigation: sidebarProps.navigation,
            todayDate: sidebarProps.todayDate
          };
        default:
          return baseProps;
      }
    }

    // Props pour les nouveaux modules historiques
    return baseProps;
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

  // Gestion des erreurs de validation
  React.useEffect(() => {
    if (!validation.isValid && validation.errors.length > 0) {
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