/**
 * CoachDashboard - Dashboard Coach (Vue Lecture Seule)
 * 
 * Composant pour visualiser les données nutrition partagées :
 * - Import JSON partagé (drag & drop ou bouton)
 * - Validation format JSON
 * - Affichage données selon scope (stats, charts, progress)
 * - Lecture seule (pas de modification)
 * 
 * @module components/tabs/nutrition/components/CoachDashboard
 * @see ../../../../../nouvelongletnutritionplan.md Section 6.1
 */

import React, { useState, useCallback, useRef, useMemo } from 'react';
// ✅ OPTIMISATION : Lazy evaluation pour calculs optionnels
import { useLazyCalculation } from '../../../../hooks/useLazyCalculation';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import Button from '../../../ui/Button';
import Input from '../../../ui/Input';
import { useTranslation } from '../../../../utils/translations';
import {
  Upload,
  FileText,
  BarChart3,
  TrendingUp,
  Trophy,
  Target,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Download,
  RefreshCw,
  Eye,
  Lock,
  Shield
} from 'lucide-react';
import { useCoachDashboard } from '../../../../hooks/useCoachDashboard';
import { SHARE_SCOPES } from '../../../../services/nutrition/nutritionSharing';
import { useToast } from '../../../ui/Toast/ToastProvider';
import logger from '../../../../utils/logger';
import { Badge } from '../../../ui/Badge';
import LazyChart from './LazyChart';
import {
  MemoizedCaloriesLineChart,
  MemoizedMacrosAreaChart,
  MemoizedMacrosPieChart,
  MemoizedComplianceLineChart
} from './ChartComponents';

/**
 * Formate la date d'expiration
 */
const formatExpirationDate = (expiresAt) => {
  if (!expiresAt) return 'Jamais';
  
  const date = new Date(expiresAt);
  const now = new Date();
  const diff = date - now;
  
  if (diff < 0) return 'Expiré';
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) return `Expire dans ${days}j ${hours}h`;
  if (hours > 0) return `Expire dans ${hours}h`;
  return 'Expire bientôt';
};

/**
 * Formate le scope pour affichage
 */
const formatScope = (scope) => {
  switch (scope) {
    case SHARE_SCOPES.all:
      return 'Toutes les données';
    case SHARE_SCOPES.stats:
      return 'Statistiques uniquement';
    case SHARE_SCOPES.charts:
      return 'Graphiques uniquement';
    case SHARE_SCOPES.progress:
      return 'Progression uniquement';
    default:
      return scope;
  }
};

// ✅ PHASE 5 : CustomTooltip déplacé dans ChartComponents.jsx (mémorisé)

const CoachDashboard = () => {
  const t = useTranslation();
  const { showError } = useToast();
  const {
    shareData,
    loading,
    error,
    scope,
    importJson,
    validateJson,
    clearData,
    SHARE_SCOPES: shareScopes
  } = useCoachDashboard({ autoValidate: true });

  const [dragActive, setDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState('stats'); // 'stats' | 'charts' | 'progress'
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const [uploadFocused, setUploadFocused] = useState(false);
  
  // ✅ PHASE 5 : Supprimé chartsReady - remplacé par lazy loading avec IntersectionObserver

  // Déterminer onglets disponibles selon scope (déplacé AVANT handleTabKeyDown)
  const availableTabs = useMemo(() => {
    if (!shareData || !scope) return [];

    const tabs = [];
    if (scope === shareScopes.all || scope === shareScopes.stats) {
      tabs.push({ id: 'stats', label: 'Statistiques', icon: BarChart3 });
    }
    if (scope === shareScopes.all || scope === shareScopes.charts) {
      tabs.push({ id: 'charts', label: 'Graphiques', icon: TrendingUp });
    }
    if (scope === shareScopes.all || scope === shareScopes.progress) {
      tabs.push({ id: 'progress', label: 'Progression', icon: Trophy });
    }

    return tabs;
  }, [shareData, scope, shareScopes]);

  // ✅ PHASE 6 : Gérer drag & drop avec feedback accessibilité
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  // ✅ PHASE 6 : Navigation clavier zone upload (Enter/Space)
  const handleUploadKeyDown = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      fileInputRef.current?.click();
    }
  }, []);

  // ✅ PHASE 6 : Navigation clavier onglets (flèches gauche/droite)
  const handleTabKeyDown = useCallback((e, tabId) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const currentIndex = availableTabs.findIndex(t => t.id === activeTab);
      let nextIndex;
      
      if (e.key === 'ArrowLeft') {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : availableTabs.length - 1;
      } else {
        nextIndex = currentIndex < availableTabs.length - 1 ? currentIndex + 1 : 0;
      }
      
      setActiveTab(availableTabs[nextIndex].id);
      
      // ✅ PHASE 6 : Focus le nouvel onglet pour navigation clavier fluide
      const nextTabButton = e.target.parentElement?.children[nextIndex];
      if (nextTabButton instanceof HTMLElement) {
        nextTabButton.focus();
      }
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveTab(availableTabs[0].id);
      const firstTabButton = e.target.parentElement?.children[0];
      if (firstTabButton instanceof HTMLElement) {
        firstTabButton.focus();
      }
    } else if (e.key === 'End') {
      e.preventDefault();
      const lastIndex = availableTabs.length - 1;
      setActiveTab(availableTabs[lastIndex].id);
      const lastTabButton = e.target.parentElement?.children[lastIndex];
      if (lastTabButton instanceof HTMLElement) {
        lastTabButton.focus();
      }
    }
  }, [activeTab, availableTabs]);

  const handleDrop = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        try {
          await importJson(file);
        } catch (err) {
          log.error('Erreur import JSON', err);
          showError('Erreur import', 'Impossible d\'importer le fichier JSON. Veuillez vérifier le format.');
        }
      } else {
        showError('Fichier invalide', 'Type de fichier invalide. Veuillez importer un fichier JSON.');
      }
    }
  }, [importJson, showError]);

  // Gérer sélection fichier
  const handleFileSelect = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/json' || file.name.endsWith('.json')) {
      try {
        await importJson(file);
      } catch (err) {
        log.error('Erreur import JSON', err);
        showError('Erreur import', 'Impossible d\'importer le fichier JSON. Veuillez vérifier le format.');
      }
    } else {
      showError('Fichier invalide', 'Type de fichier invalide. Veuillez importer un fichier JSON.');
    }
  }, [importJson, showError]);

  // ✅ OPTIMISATION : Lazy evaluation - Ne calculer que si onglet actif
  // Données pour graphiques (scope: charts) - Calculé seulement si onglet charts actif
  const chartData = useLazyCalculation(
    () => {
    if (!shareData || !shareData.charts || !shareData.charts.timeline) {
      return [];
    }

    return shareData.charts.timeline.map((item, index) => ({
      day: `J${item.day}`,
      calories: item.calories || 0,
      protein: item.protein || 0,
      carbs: item.carbs || 0,
      fat: item.fat || 0,
      compliance: item.compliance || 0
    }));
    },
    activeTab === 'charts',
    [],
    [shareData, activeTab]
  );

  // Données pour distribution macros (scope: charts) - Calculé seulement si onglet charts actif
  const macroDistribution = useLazyCalculation(
    () => {
    if (!shareData || !shareData.charts || !shareData.charts.macroDistribution) {
      return [];
    }

    const dist = shareData.charts.macroDistribution;
    return [
      { name: 'Protéines', value: dist.protein || 0, color: '#3B82F6' },
      { name: 'Glucides', value: dist.carbs || 0, color: '#10B981' },
      { name: 'Lipides', value: dist.fat || 0, color: '#F59E0B' }
    ];
    },
    activeTab === 'charts',
    [],
    [shareData, activeTab]
  );

  // Statistiques (scope: stats) - Calculé seulement si onglet stats actif
  const stats = useLazyCalculation(
    () => {
    if (!shareData || !shareData.stats) {
      return null;
    }

    return shareData.stats;
    },
    activeTab === 'stats',
    null,
    [shareData, activeTab]
  );

  // Progression (scope: progress) - Calculé seulement si onglet progress actif
  const progress = useLazyCalculation(
    () => {
    if (!shareData || !shareData.progress) {
      return null;
    }

    return shareData.progress;
    },
    activeTab === 'progress',
    null,
    [shareData, activeTab]
  );


  // Définir onglet actif par défaut
  React.useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.find(t => t.id === activeTab)) {
      setActiveTab(availableTabs[0].id);
    }
  }, [availableTabs, activeTab]);

  // Si pas de données, afficher zone d'import
  if (!shareData) {
    return (
      <div className="space-y-6">
        <Card variant="sport">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye size={20} className="text-blue-400" />
              Dashboard Coach (Vue Lecture Seule)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <Info size={20} className="text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-slate-200">
                    <strong>Mode Coach :</strong> Importez un fichier JSON partagé par votre client pour visualiser ses données nutrition en lecture seule.
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    Les données sont anonymisées selon le scope choisi par l'utilisateur (stats, graphiques, progression).
                  </p>
                </div>
              </div>

              {/* ✅ PHASE 6 : Zone d'import drag & drop accessible */}
              <div
                ref={dropZoneRef}
                role="button"
                tabIndex={0}
                aria-label={t('nutrition.tooltips.coachDashboard.uploadZone')}
                aria-describedby="upload-instructions"
                aria-disabled={loading || false}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all outline-none ${
                  dragActive
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-600 bg-slate-800/30 hover:border-slate-500'
                } ${
                  uploadFocused
                    ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-800 border-blue-500'
                    : ''
                } ${
                  loading
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer focus:outline-none'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => !loading && fileInputRef.current?.click()}
                onKeyDown={handleUploadKeyDown}
                onFocus={() => setUploadFocused(true)}
                onBlur={() => setUploadFocused(false)}
              >
                <Upload 
                  size={48} 
                  className={`mx-auto mb-4 ${
                    dragActive ? 'text-blue-400' : 'text-slate-400'
                  }`}
                  aria-hidden="true"
                />
                <p className="text-lg font-semibold text-slate-200 mb-2">
                  Glissez-déposez un fichier JSON ici
                </p>
                <p className="text-sm text-slate-400 mb-4" id="upload-instructions">
                  ou appuyez sur Entrée pour sélectionner un fichier
                </p>
                <label 
                  htmlFor="file-upload-input" 
                  className="sr-only"
                >
                  Sélectionner un fichier JSON à importer
                </label>
                <input
                  id="file-upload-input"
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json,.encrypted.json"
                  onChange={handleFileSelect}
                  disabled={loading}
                  className="sr-only"
                  aria-describedby="upload-instructions upload-file-format"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    !loading && fileInputRef.current?.click();
                  }}
                  disabled={loading}
                  className="gradient-button-premium gradient-button-premium-md rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label={t('nutrition.tooltips.coachDashboard.selectFile')}
                >
                  <FileText size={18} aria-hidden="true" />
                  Sélectionner un fichier JSON
                </button>
                <p 
                  id="upload-file-format" 
                  className="text-xs text-slate-500 mt-4"
                >
                  Format attendu : fichier JSON exporté depuis l'onglet Nutrition (type: nutrition_share)
                </p>
              </div>

              {/* ✅ PHASE 6 : Erreur accessible avec ARIA live region */}
              {error && (
                <div 
                  role="alert"
                  aria-live="assertive"
                  aria-atomic="true"
                  className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
                >
                  <XCircle 
                    size={20} 
                    className="text-red-400 mt-0.5 flex-shrink-0" 
                    aria-hidden="true"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-400 mb-1">
                      Erreur d'import
                    </p>
                    <p className="text-sm text-slate-300">{error}</p>
                  </div>
                </div>
              )}

              {/* ✅ PHASE 6 : Loading accessible avec ARIA busy */}
              {loading && (
                <div 
                  role="status"
                  aria-live="polite"
                  aria-busy="true"
                  className="flex items-center justify-center p-8"
                >
                  <div 
                    className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"
                    aria-hidden="true"
                  ></div>
                  <span className="ml-3 text-slate-400">Import en cours...</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Si données chargées, afficher dashboard
  return (
    <div className="space-y-6">
      {/* En-tête avec informations */}
      <Card variant="sport">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye size={20} className="text-blue-400" />
              Dashboard Coach - Données Partagées
            </CardTitle>
            <button
              type="button"
              onClick={clearData}
              className="gradient-button-premium gradient-button-premium-md gradient-button-premium-variant rounded-lg flex items-center gap-2"
              aria-label={t('nutrition.tooltips.coachDashboard.resetAndImport')}
            >
              <RefreshCw size={16} aria-hidden="true" />
              Nouveau import
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-green-400" />
              <span className="text-sm text-slate-300">Scope :</span>
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                {formatScope(scope)}
              </Badge>
            </div>
            {shareData.expiresAt && (
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-yellow-400" />
                <span className="text-sm text-slate-300">
                  {formatExpirationDate(shareData.expiresAt)}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Lock size={16} className="text-slate-400" />
              <span className="text-sm text-slate-400">Mode lecture seule</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ✅ PHASE 6 : Navigation onglets accessible avec ARIA */}
      {availableTabs.length > 1 && (
        <div 
          role="tablist"
          aria-label="Navigation par onglets des données partagées"
          className="flex gap-2 border-b border-slate-700"
        >
          {availableTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                tabIndex={isActive ? 0 : -1}
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                onKeyDown={(e) => handleTabKeyDown(e, tab.id)}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 ${
                  isActive
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                <Icon size={18} aria-hidden="true" />
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ✅ PHASE 6 : Contenu selon onglet actif avec ARIA tabpanel */}
      <div className="space-y-6">
        {/* Stats */}
        {activeTab === 'stats' && stats && (
          <div 
            id="tabpanel-stats"
            role="tabpanel"
            aria-labelledby="tab-stats"
            className="space-y-6"
          >
            {/* Statistiques globales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card variant="sport">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Total jours</p>
                      <p className="text-2xl font-bold text-slate-200">{stats.totalDays || 0}</p>
                    </div>
                    <Calendar size={24} className="text-blue-400" />
                  </div>
                </CardContent>
              </Card>

              <Card variant="sport">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Total repas</p>
                      <p className="text-2xl font-bold text-slate-200">{stats.totalMeals || 0}</p>
                    </div>
                    <Target size={24} className="text-green-400" />
                  </div>
                </CardContent>
              </Card>

              {stats.activeProgram && (
                <Card variant="sport">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-400 mb-1">Programme actif</p>
                        <p className="text-lg font-semibold text-slate-200">
                          {stats.activeProgram.name || 'Aucun'}
                        </p>
                      </div>
                      <Trophy size={24} className="text-yellow-400" />
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Moyennes par période */}
            {stats.periods && (
              <Card variant="sport">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 size={20} className="text-purple-400" />
                    Moyennes par Période
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(stats.periods).map(([period, periodStats]) => (
                      <div key={period} className="border-b border-slate-700 pb-4 last:border-0 last:pb-0">
                        <h4 className="text-sm font-semibold text-slate-300 mb-3 capitalize">
                          {period === 'week' ? '7 jours' : period === 'month' ? '30 jours' : '90 jours'}
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Calories</p>
                            <p className="text-lg font-bold text-slate-200">
                              {periodStats.avgCalories || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Protéines (g)</p>
                            <p className="text-lg font-bold text-blue-400">
                              {periodStats.avgProtein?.toFixed(1) || '0.0'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Glucides (g)</p>
                            <p className="text-lg font-bold text-green-400">
                              {periodStats.avgCarbs?.toFixed(1) || '0.0'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Lipides (g)</p>
                            <p className="text-lg font-bold text-yellow-400">
                              {periodStats.avgFat?.toFixed(1) || '0.0'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Conformité (%)</p>
                            <p className="text-lg font-bold text-purple-400">
                              {periodStats.avgCompliance?.toFixed(1) || '0.0'}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Charts */}
        {activeTab === 'charts' && shareData.charts && (
          <div 
            id="tabpanel-charts"
            role="tabpanel"
            aria-labelledby="tab-charts"
            className="space-y-6"
          >
            {/* ✅ PHASE 5 : Timeline calories avec lazy loading et mémorisation */}
            {chartData.length > 0 && (
              <Card variant="sport">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp size={20} className="text-orange-400" />
                    Évolution Calories (30 derniers jours)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LazyChart height={320} placeholderText="Chargement graphique calories...">
                    <MemoizedCaloriesLineChart data={chartData} height={320} />
                  </LazyChart>
                </CardContent>
              </Card>
            )}

            {/* ✅ PHASE 5 : Timeline macros avec lazy loading et mémorisation */}
            {chartData.length > 0 && (
              <Card variant="sport">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 size={20} className="text-purple-400" />
                    Évolution Macros (30 derniers jours)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LazyChart height={320} placeholderText="Chargement graphique macros...">
                    <MemoizedMacrosAreaChart data={chartData} height={320} />
                  </LazyChart>
                </CardContent>
              </Card>
            )}

            {/* ✅ PHASE 5 : Distribution macros avec lazy loading et mémorisation */}
            {macroDistribution.length > 0 && (
              <Card variant="sport">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target size={20} className="text-green-400" />
                    Distribution Macros (Moyenne)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LazyChart height={320} placeholderText="Chargement graphique distribution...">
                    <MemoizedMacrosPieChart data={macroDistribution} height={320} />
                  </LazyChart>
                </CardContent>
              </Card>
            )}

            {/* ✅ PHASE 5 : Timeline conformité avec lazy loading et mémorisation */}
            {chartData.length > 0 && (
              <Card variant="sport">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp size={20} className="text-blue-400" />
                    Évolution Conformité (30 derniers jours)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <LazyChart height={320} placeholderText="Chargement graphique conformité...">
                    <MemoizedComplianceLineChart data={chartData} height={320} />
                  </LazyChart>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Progress */}
        {activeTab === 'progress' && progress && (
          <div 
            id="tabpanel-progress"
            role="tabpanel"
            aria-labelledby="tab-progress"
            className="space-y-6"
          >
            {/* Statistiques progression */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card variant="sport">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Streak</p>
                      <p className="text-2xl font-bold text-orange-400">{progress.streak || 0} jours</p>
                    </div>
                    <Trophy size={24} className="text-orange-400" />
                  </div>
                </CardContent>
              </Card>

              <Card variant="sport">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Niveau</p>
                      <p className="text-2xl font-bold text-purple-400">{progress.level || 1}</p>
                    </div>
                    <TrendingUp size={24} className="text-purple-400" />
                  </div>
                </CardContent>
              </Card>

              <Card variant="sport">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Badges</p>
                      <p className="text-2xl font-bold text-yellow-400">{progress.badgesCount || 0}</p>
                    </div>
                    <Trophy size={24} className="text-yellow-400" />
                  </div>
                </CardContent>
              </Card>

              <Card variant="sport">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Total jours</p>
                      <p className="text-2xl font-bold text-blue-400">{progress.totalDays || 0}</p>
                    </div>
                    <Calendar size={24} className="text-blue-400" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tendances */}
            {progress.trends && (
              <Card variant="sport">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp size={20} className="text-green-400" />
                    Tendances
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(progress.trends).map(([period, trendStats]) => (
                      <div key={period} className="border-b border-slate-700 pb-4 last:border-0 last:pb-0">
                        <h4 className="text-sm font-semibold text-slate-300 mb-3 capitalize">
                          {period === 'week' ? '7 derniers jours' : '30 derniers jours'}
                        </h4>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Jours avec données</p>
                            <p className="text-lg font-bold text-slate-200">
                              {trendStats.days || 0}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Conformité moyenne</p>
                            <p className="text-lg font-bold text-purple-400">
                              {trendStats.avgCompliance?.toFixed(1) || '0.0'}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-400 mb-1">Total repas</p>
                            <p className="text-lg font-bold text-blue-400">
                              {trendStats.totalMeals || 0}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoachDashboard;

