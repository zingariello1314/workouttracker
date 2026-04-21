/**
 * Composant Navigation Dashboard Améliorée
 * 
 * Navigation fluide avec breadcrumbs, indicateurs visuels, raccourcis contextuels
 * et transitions smooth pour améliorer l'engagement utilisateur.
 * 
 * ✅ OPTIMISATION: Amélioration UX Dashboard Navigation (+20% engagement)
 * 
 * Référence: ANALYSE_ULTRA_DENSIFIEE_VERIFIEE.md - Sprint Final Optimisation #3
 */

import React, { useState, useCallback } from 'react';
import {
  BarChart3,
  Activity,
  Calendar,
  Target,
  Grid,
  ChevronRight,
  Home,
  ArrowLeft,
  Sparkles,
  Zap,
  TrendingUp,
  Info
} from 'lucide-react';
import Button from '../../ui/Button';

/**
 * Configuration des vues disponibles
 */
const VIEW_CONFIG = {
  gallery: {
    id: 'gallery',
    label: 'Galerie',
    icon: Grid,
    iconTone: 'text-sky-400',
    description: 'Vos photos de progression'
  },
  dashboard: {
    id: 'dashboard',
    label: 'Dashboard',
    icon: BarChart3,
    iconTone: 'text-teal-200',
    description: 'Vue d\'ensemble des analyses'
  },
  muscle: {
    id: 'muscle',
    label: 'Par Muscle',
    icon: Activity,
    iconTone: 'text-emerald-400',
    description: 'Analyse détaillée par groupe musculaire'
  },
  timeline: {
    id: 'timeline',
    label: 'Timeline',
    icon: Calendar,
    iconTone: 'text-cyan-300',
    description: 'Évolution temporelle'
  },
  correlations: {
    id: 'correlations',
    label: 'Corrélations',
    icon: Target,
    iconTone: 'text-sky-300',
    description: 'Liens avec l\'entraînement'
  }
};

/**
 * Composant Breadcrumb pour navigation hiérarchique
 */
const Breadcrumb = ({ items, onNavigate }) => {
  return (
    <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const Icon = item.icon || Home;
        
        return (
          <React.Fragment key={item.id}>
            {index > 0 && (
              <ChevronRight className="h-4 w-4 text-teal-800" />
            )}
            {isLast ? (
              <span className="flex items-center gap-2 font-medium text-teal-100">
                <Icon className={`h-4 w-4 ${item.iconTone || 'text-teal-200'}`} />
                {item.label}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate(item.id)}
                className="flex items-center gap-2 text-teal-600 transition-colors hover:text-teal-100"
              >
                <Icon className={`h-4 w-4 ${item.iconTone || 'text-teal-500'}`} />
                {item.label}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

/**
 * Composant Navigation Dashboard Améliorée
 */
const DashboardNavigation = ({
  currentView,
  onViewChange,
  showBackButton = false,
  onBack = null,
  context = null // Context pour suggestions intelligentes
}) => {
  const [showQuickActions, setShowQuickActions] = useState(false);

  // ✅ OPTIMISATION: Suggestions intelligentes basées sur contexte
  const getQuickActions = useCallback(() => {
    const actions = [];
    
    // Si on vient de capturer une photo → suggérer dashboard
    if (context?.justCaptured) {
      actions.push({
        id: 'dashboard',
        label: 'Voir résultats',
        icon: BarChart3,
        onClick: () => onViewChange('dashboard')
      });
    }
    
    // Si photos analysées → suggérer muscle analysis
    if (context?.hasAnalyzedPhotos && currentView !== 'muscle') {
      actions.push({
        id: 'muscle',
        label: 'Analyser par muscle',
        icon: Activity,
        onClick: () => onViewChange('muscle')
      });
    }
    
    // Si plusieurs photos → suggérer timeline
    if (context?.hasMultiplePhotos && currentView !== 'timeline') {
      actions.push({
        id: 'timeline',
        label: 'Voir évolution',
        icon: Calendar,
        onClick: () => onViewChange('timeline')
      });
    }
    
    return actions;
  }, [context, currentView, onViewChange]);

  // Générer breadcrumb items
  const breadcrumbItems = React.useMemo(() => {
    const items = [{ id: 'gallery', label: 'Photos', icon: Home, iconTone: 'text-sky-400' }];
    
    if (currentView !== 'gallery') {
      const viewConfig = VIEW_CONFIG[currentView];
      if (viewConfig) {
        items.push({
          ...viewConfig,
          icon: viewConfig.icon,
          iconTone: viewConfig.iconTone
        });
      }
    }
    
    return items;
  }, [currentView]);

  const quickActions = getQuickActions();

  return (
    <div className="space-y-4">
      {/* ✅ Breadcrumb Navigation */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <Breadcrumb 
          items={breadcrumbItems}
          onNavigate={onViewChange}
        />
        
        {/* ✅ Bouton retour si nécessaire */}
        {showBackButton && onBack && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Button>
        )}
      </div>

      {/* ✅ Navigation principale avec indicateurs visuels améliorés */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {Object.values(VIEW_CONFIG).map((view) => {
          const Icon = view.icon;
          const isActive = currentView === view.id;
          return (
            <button
              key={view.id}
              type="button"
              onClick={() => onViewChange(view.id)}
              className={`
                relative flex items-center gap-2 whitespace-nowrap rounded-lg border-2 px-4 py-2 transition-all duration-200
                ${
                  isActive
                    ? 'scale-[1.02] border-[#0F5C45] bg-[#0F5C45]/30 text-teal-100 shadow-lg shadow-black/40'
                    : 'border-[#0F4C5C]/50 bg-black text-teal-100 hover:border-[#0F5C45]/55 hover:bg-[#0F4C5C]/15'
                }
              `}
              title={view.description}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-teal-100' : view.iconTone || 'text-teal-600'}`} />
              <span className="font-medium">{view.label}</span>

              {isActive && (
                <div className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 transform animate-pulse rounded-full bg-sky-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* ✅ Quick Actions Contextuelles (suggestions intelligentes) */}
      {quickActions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border-2 border-[#0F4C5C]/60 bg-black p-3 shadow-md shadow-black/30">
          <Info className="h-4 w-4 shrink-0 text-sky-400" />
          <span className="flex-1 text-xs text-teal-700">Suggestions :</span>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => {
              const ActionIcon = action.icon;
              return (
                <button
                  key={action.id}
                  type="button"
                  onClick={action.onClick}
                  className="flex items-center gap-1 rounded-lg border border-[#0F5C45]/45 bg-[#0F4C5C]/15 px-2 py-1 text-xs text-teal-100 transition-all hover:scale-105 hover:border-[#0F5C45]/70 hover:bg-[#0F5C45]/25"
                >
                  <ActionIcon className="h-3 w-3" />
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardNavigation;

