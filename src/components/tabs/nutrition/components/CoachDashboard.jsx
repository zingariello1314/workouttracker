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
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import Button from '../../../ui/Button';
import Input from '../../../ui/Input';
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
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { Badge } from '../../../ui/Badge';

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

/**
 * Tooltip personnalisé pour graphiques
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-lg">
        <p className="text-sm font-semibold text-slate-200 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const CoachDashboard = () => {
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
  const [chartsReady, setChartsReady] = useState(false);

  // Attendre que le DOM soit prêt avant de rendre les graphiques
  React.useEffect(() => {
    if (!shareData) {
      setChartsReady(false);
      return;
    }

    // Double requestAnimationFrame pour garantir que le layout CSS est calculé
    let raf1, raf2;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        setChartsReady(true);
      });
    });
    return () => {
      if (raf1) cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
    };
  }, [shareData]);

  // Gérer drag & drop
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

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
          console.error('[CoachDashboard] Erreur import JSON:', err);
        }
      } else {
        alert('Type de fichier invalide. Veuillez importer un fichier JSON.');
      }
    }
  }, [importJson]);

  // Gérer sélection fichier
  const handleFileSelect = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === 'application/json' || file.name.endsWith('.json')) {
      try {
        await importJson(file);
      } catch (err) {
        console.error('[CoachDashboard] Erreur import JSON:', err);
      }
    } else {
      alert('Type de fichier invalide. Veuillez importer un fichier JSON.');
    }
  }, [importJson]);

  // Données pour graphiques (scope: charts)
  const chartData = useMemo(() => {
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
  }, [shareData]);

  // Données pour distribution macros (scope: charts)
  const macroDistribution = useMemo(() => {
    if (!shareData || !shareData.charts || !shareData.charts.macroDistribution) {
      return [];
    }

    const dist = shareData.charts.macroDistribution;
    return [
      { name: 'Protéines', value: dist.protein || 0, color: '#3B82F6' },
      { name: 'Glucides', value: dist.carbs || 0, color: '#10B981' },
      { name: 'Lipides', value: dist.fat || 0, color: '#F59E0B' }
    ];
  }, [shareData]);

  // Statistiques (scope: stats)
  const stats = useMemo(() => {
    if (!shareData || !shareData.stats) {
      return null;
    }

    return shareData.stats;
  }, [shareData]);

  // Progression (scope: progress)
  const progress = useMemo(() => {
    if (!shareData || !shareData.progress) {
      return null;
    }

    return shareData.progress;
  }, [shareData]);

  // Déterminer onglets disponibles selon scope
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
        <Card className="bg-slate-800/50 border-slate-700">
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

              {/* Zone d'import drag & drop */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                  dragActive
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-600 bg-slate-800/30 hover:border-slate-500'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload size={48} className="mx-auto mb-4 text-slate-400" />
                <p className="text-lg font-semibold text-slate-200 mb-2">
                  Glissez-déposez un fichier JSON ici
                </p>
                <p className="text-sm text-slate-400 mb-4">
                  ou
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <FileText size={18} className="mr-2" />
                  Sélectionner un fichier JSON
                </Button>
                <p className="text-xs text-slate-500 mt-4">
                  Format attendu : fichier JSON exporté depuis l'onglet Nutrition (type: nutrition_share)
                </p>
              </div>

              {/* Erreur */}
              {error && (
                <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <XCircle size={20} className="text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-400 mb-1">Erreur d'import</p>
                    <p className="text-sm text-slate-300">{error}</p>
                  </div>
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
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
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye size={20} className="text-blue-400" />
              Dashboard Coach - Données Partagées
            </CardTitle>
            <Button
              onClick={clearData}
              variant="outline"
              className="text-slate-300 border-slate-600 hover:bg-slate-700"
            >
              <RefreshCw size={16} className="mr-2" />
              Nouveau import
            </Button>
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

      {/* Navigation onglets */}
      {availableTabs.length > 1 && (
        <div className="flex gap-2 border-b border-slate-700">
          {availableTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-300'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Contenu selon onglet actif */}
      <div className="space-y-6">
        {/* Stats */}
        {activeTab === 'stats' && stats && (
          <div className="space-y-6">
            {/* Statistiques globales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-slate-800/50 border-slate-700">
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

              <Card className="bg-slate-800/50 border-slate-700">
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
                <Card className="bg-slate-800/50 border-slate-700">
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
              <Card className="bg-slate-800/50 border-slate-700">
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
          <div className="space-y-6">
            {/* Timeline calories */}
            {chartData.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp size={20} className="text-orange-400" />
                    Évolution Calories (30 derniers jours)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full" style={{ height: '320px' }}>
                    {chartsReady ? (
                      <ResponsiveContainer width="100%" height={320} minHeight={320}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="day" 
                            stroke="#9CA3AF"
                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                          />
                          <YAxis 
                            stroke="#9CA3AF"
                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                            label={{ value: 'Calories', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="calories" 
                            stroke="#F59E0B" 
                            strokeWidth={2}
                            name="Calories"
                            dot={{ fill: '#F59E0B', r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timeline macros */}
            {chartData.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 size={20} className="text-purple-400" />
                    Évolution Macros (30 derniers jours)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full" style={{ height: '320px' }}>
                    {chartsReady ? (
                      <ResponsiveContainer width="100%" height={320} minHeight={320}>
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorProtein" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorCarbs" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorFat" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="day" 
                            stroke="#9CA3AF"
                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                          />
                          <YAxis 
                            stroke="#9CA3AF"
                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                            label={{ value: 'Grammes', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <Area 
                            type="monotone" 
                            dataKey="protein" 
                            stackId="1"
                            stroke="#3B82F6" 
                            fill="url(#colorProtein)" 
                            name="Protéines (g)"
                          />
                          <Area 
                            type="monotone" 
                            dataKey="carbs" 
                            stackId="1"
                            stroke="#10B981" 
                            fill="url(#colorCarbs)" 
                            name="Glucides (g)"
                          />
                          <Area 
                            type="monotone" 
                            dataKey="fat" 
                            stackId="1"
                            stroke="#F59E0B" 
                            fill="url(#colorFat)" 
                            name="Lipides (g)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Distribution macros */}
            {macroDistribution.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target size={20} className="text-green-400" />
                    Distribution Macros (Moyenne)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full" style={{ height: '320px' }}>
                    {chartsReady ? (
                      <ResponsiveContainer width="100%" height={320} minHeight={320}>
                        <PieChart>
                          <Pie
                            data={macroDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {macroDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timeline conformité */}
            {chartData.length > 0 && (
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp size={20} className="text-blue-400" />
                    Évolution Conformité (30 derniers jours)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="w-full" style={{ height: '320px' }}>
                    {chartsReady ? (
                      <ResponsiveContainer width="100%" height={320} minHeight={320}>
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis 
                            dataKey="day" 
                            stroke="#9CA3AF"
                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                          />
                          <YAxis 
                            stroke="#9CA3AF"
                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                            label={{ value: 'Conformité (%)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
                            domain={[0, 100]}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Legend />
                          <ReferenceLine y={80} stroke="#10B981" strokeDasharray="3 3" label="Objectif 80%" />
                          <Line 
                            type="monotone" 
                            dataKey="compliance" 
                            stroke="#3B82F6" 
                            strokeWidth={2}
                            name="Conformité (%)"
                            dot={{ fill: '#3B82F6', r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Progress */}
        {activeTab === 'progress' && progress && (
          <div className="space-y-6">
            {/* Statistiques progression */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-slate-800/50 border-slate-700">
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

              <Card className="bg-slate-800/50 border-slate-700">
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

              <Card className="bg-slate-800/50 border-slate-700">
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

              <Card className="bg-slate-800/50 border-slate-700">
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
              <Card className="bg-slate-800/50 border-slate-700">
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

