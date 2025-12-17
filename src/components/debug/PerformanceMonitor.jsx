/**
 * PerformanceMonitor Component
 * 
 * Composant de debug pour monitorer les performances des statistiques
 * en mode développement.
 * 
 * Features:
 * - Affichage des statistiques de cache
 * - Monitoring des temps de calcul
 * - Contrôles pour invalider le cache
 * - Métriques de performance en temps réel
 * 
 * @see Requirements 1.2, 10.3
 */

import React, { useState, useEffect } from 'react';
import { Activity, Database, Clock, Trash2, RefreshCw } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import Button from '../ui/Button';
import performanceOptimizationService from '../../services/statistics/performanceOptimizationService';

const PerformanceMonitor = ({ statisticsData = null, className = '' }) => {
  const [stats, setStats] = useState({});
  const [isVisible, setIsVisible] = useState(false);

  // Mettre à jour les statistiques périodiquement
  useEffect(() => {
    const updateStats = () => {
      const cacheStats = performanceOptimizationService.getCacheStats();
      const memoryUsage = performance.memory ? {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      } : null;

      setStats({
        ...cacheStats,
        memoryUsage,
        timestamp: new Date().toLocaleTimeString()
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 2000); // Mise à jour toutes les 2 secondes

    return () => clearInterval(interval);
  }, []);

  // Afficher seulement en mode développement
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  // Toggle de visibilité
  if (!isVisible) {
    return (
      <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
        <Button
          variant="glass"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="flex items-center gap-2"
        >
          <Activity className="w-4 h-4" />
          Perf
        </Button>
      </div>
    );
  }

  const handleClearCache = () => {
    performanceOptimizationService.invalidateCache();
    setStats(prev => ({ ...prev, cacheCleared: true }));
    setTimeout(() => setStats(prev => ({ ...prev, cacheCleared: false })), 2000);
  };

  const handleCleanup = () => {
    performanceOptimizationService.cleanup();
    setStats(prev => ({ ...prev, cleaned: true }));
    setTimeout(() => setStats(prev => ({ ...prev, cleaned: false })), 2000);
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      <Card variant="glass" className="w-80 max-h-96 overflow-auto">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle size="sm" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Performance Monitor
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="text-slate-400 hover:text-white"
            >
              ×
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3 text-sm">
          {/* Statistiques du cache */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-300">
              <Database className="w-3 h-3" />
              <span className="font-medium">Cache</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-800/50 p-2 rounded">
                <div className="text-slate-400">Entries</div>
                <div className="text-white font-mono">{stats.cacheSize || 0}</div>
              </div>
              <div className="bg-slate-800/50 p-2 rounded">
                <div className="text-slate-400">Memoized</div>
                <div className="text-white font-mono">{stats.memoizedSize || 0}</div>
              </div>
              <div className="bg-slate-800/50 p-2 rounded">
                <div className="text-slate-400">Version</div>
                <div className="text-white font-mono">{stats.cacheVersion || 0}</div>
              </div>
              <div className="bg-slate-800/50 p-2 rounded">
                <div className="text-slate-400">Timers</div>
                <div className="text-white font-mono">{stats.activeDebounceTimers || 0}</div>
              </div>
            </div>
          </div>

          {/* Mémoire */}
          {stats.memoryUsage && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-300">
                <Clock className="w-3 h-3" />
                <span className="font-medium">Memory (MB)</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-slate-800/50 p-2 rounded">
                  <div className="text-slate-400">Used</div>
                  <div className="text-white font-mono">{stats.memoryUsage.used}</div>
                </div>
                <div className="bg-slate-800/50 p-2 rounded">
                  <div className="text-slate-400">Total</div>
                  <div className="text-white font-mono">{stats.memoryUsage.total}</div>
                </div>
                <div className="bg-slate-800/50 p-2 rounded">
                  <div className="text-slate-400">Limit</div>
                  <div className="text-white font-mono">{stats.memoryUsage.limit}</div>
                </div>
              </div>
            </div>
          )}

          {/* Statistiques des données */}
          {statisticsData?.performanceStats && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-300">
                <Activity className="w-3 h-3" />
                <span className="font-medium">Statistics</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-800/50 p-2 rounded">
                  <div className="text-slate-400">Computations</div>
                  <div className="text-white font-mono">
                    {statisticsData.performanceStats.computationCount}
                  </div>
                </div>
                <div className="bg-slate-800/50 p-2 rounded">
                  <div className="text-slate-400">Books</div>
                  <div className="text-white font-mono">
                    {statisticsData.performanceStats.dataSize?.books || 0}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Contrôles */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearCache}
              className="flex-1 text-xs"
              disabled={stats.cacheCleared}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              {stats.cacheCleared ? 'Cleared!' : 'Clear Cache'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCleanup}
              className="flex-1 text-xs"
              disabled={stats.cleaned}
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              {stats.cleaned ? 'Cleaned!' : 'Cleanup'}
            </Button>
          </div>

          {/* Timestamp */}
          <div className="text-xs text-slate-500 text-center">
            Last update: {stats.timestamp}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceMonitor;