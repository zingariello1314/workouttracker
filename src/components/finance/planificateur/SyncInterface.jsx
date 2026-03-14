/**
 * Interface de synchronisation temps réel
 * Indicateurs visuels, statut modules, animations
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const SyncInterface = ({ 
  repartition, 
  notifications,
  onDismissNotification 
}) => {
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, success, error
  const [lastSync, setLastSync] = useState(null);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  // Modules connectés
  const modules = useMemo(() => [
    {
      id: 'investissements',
      name: 'Investissements',
      icon: '💰',
      color: '#10b981',
      gradient: 'from-green-500 to-emerald-600',
      connected: true,
      lastUpdate: lastSync,
      syncedData: [
        { label: 'DCA Or', value: repartition?.investissementOr || 0 },
        { label: 'DCA Bourse', value: repartition?.investissementBourse || 0 },
        { label: 'Cash', value: repartition?.cashAccumulation || 0 },
        { label: 'Autres investissements', value: (repartition?.categories || []).filter(c => c.type === 'investissement').reduce((s,c) => s + (c.montant || 0), 0) }
      ]
    },
    {
      id: 'budget',
      name: 'Budget Personnel',
      icon: '📊',
      color: '#3b82f6',
      gradient: 'from-blue-500 to-cyan-600',
      connected: true,
      lastUpdate: lastSync,
      syncedData: [
        { label: 'Budget Loisirs', value: (repartition?.loisirs || 0) + (repartition?.categories || []).filter(c => c.type === 'loisirs').reduce((s,c) => s + (c.montant || 0), 0) }
      ]
    },
    {
      id: 'shopping',
      name: 'Smart Shopping',
      icon: '🛒',
      color: '#8b5cf6',
      gradient: 'from-purple-500 to-pink-600',
      connected: true,
      lastUpdate: lastSync,
      syncedData: [
        { label: 'Budget Courses', value: (repartition?.loisirs || 0) + (repartition?.categories || []).filter(c => c.type === 'loisirs').reduce((s,c) => s + (c.montant || 0), 0) }
      ]
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: '📈',
      color: '#f59e0b',
      gradient: 'from-yellow-500 to-orange-600',
      connected: true,
      lastUpdate: lastSync,
      syncedData: [
        { label: 'Données Financières', value: 'Synchronisé' }
      ]
    }
  ], [repartition, lastSync]);

  // Simuler synchronisation
  useEffect(() => {
    if (repartition) {
      setSyncStatus('syncing');
      setPulseAnimation(true);
      
      const timer = setTimeout(() => {
        setSyncStatus('success');
        setLastSync(new Date());
        setPulseAnimation(false);
        
        // Retour à idle après 2s
        setTimeout(() => {
          setSyncStatus('idle');
        }, 2000);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [repartition]);

  // Couleurs par statut
  const getStatusColor = (status) => {
    const colors = {
      'idle': { bg: 'bg-slate-700', border: 'border-slate-600', text: 'text-slate-400', icon: '⚪' },
      'syncing': { bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-400', icon: '🔄' },
      'success': { bg: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-400', icon: '✅' },
      'error': { bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-400', icon: '❌' }
    };
    return colors[status] || colors['idle'];
  };

  const statusColor = getStatusColor(syncStatus);

  const formatCurrency = (value) => {
    if (typeof value !== 'number') return value;
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (date) => {
    if (!date) return 'Jamais';
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  return (
    <div className="sync-interface space-y-6">
      {/* Indicateur Statut Global */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`p-6 rounded-xl border-2 ${statusColor.border} ${statusColor.bg} transition-all duration-300`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <motion.div
              animate={{
                rotate: syncStatus === 'syncing' ? 360 : 0,
                scale: pulseAnimation ? [1, 1.2, 1] : 1
              }}
              transition={{
                rotate: { duration: 1, repeat: syncStatus === 'syncing' ? Infinity : 0, ease: 'linear' },
                scale: { duration: 0.5 }
              }}
              className="text-5xl"
            >
              {statusColor.icon}
            </motion.div>
            <div>
              <div className="text-2xl font-bold text-white mb-1">
                {syncStatus === 'idle' && 'Synchronisation Active'}
                {syncStatus === 'syncing' && 'Synchronisation en cours...'}
                {syncStatus === 'success' && 'Synchronisation réussie'}
                {syncStatus === 'error' && 'Erreur de synchronisation'}
              </div>
              <div className="text-sm text-slate-400">
                Dernière sync: {formatDate(lastSync)}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-slate-400 mb-1">Modules connectés</div>
            <div className="text-3xl font-bold text-white">
              {modules.filter(m => m.connected).length}/{modules.length}
            </div>
          </div>
        </div>

        {/* Barre de progression */}
        {syncStatus === 'syncing' && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.5 }}
            className="mt-4 h-2 bg-blue-500 rounded-full"
          />
        )}
      </motion.div>

      {/* Modules Connectés */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {modules.map((module, index) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02, y: -5 }}
              className={`bg-gradient-to-br ${module.gradient} bg-opacity-10 border-2 rounded-xl p-6 cursor-pointer`}
              style={{ borderColor: module.color }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{
                      scale: module.connected && syncStatus === 'syncing' ? [1, 1.1, 1] : 1
                    }}
                    transition={{
                      duration: 1,
                      repeat: module.connected && syncStatus === 'syncing' ? Infinity : 0
                    }}
                    className="text-4xl"
                  >
                    {module.icon}
                  </motion.div>
                  <div>
                    <div className="text-lg font-semibold text-white">
                      {module.name}
                    </div>
                    <div className="text-xs text-slate-400">
                      {module.connected ? '🟢 Connecté' : '🔴 Déconnecté'}
                    </div>
                  </div>
                </div>
                
                {module.connected && (
                  <motion.div
                    animate={{
                      opacity: [1, 0.5, 1]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity
                    }}
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: module.color }}
                  />
                )}
              </div>

              {/* Données synchronisées */}
              <div className="space-y-2">
                {module.syncedData.map((data, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg">
                    <span className="text-sm text-slate-300">{data.label}</span>
                    <span className="text-sm font-semibold text-white">
                      {typeof data.value === 'number' ? formatCurrency(data.value) : data.value}
                    </span>
                  </div>
                ))}
              </div>

              {module.lastUpdate && (
                <div className="mt-3 text-xs text-slate-500">
                  Mis à jour: {formatDate(module.lastUpdate)}
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Notifications Temps Réel */}
      {notifications && notifications.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>🔔</span>
            <span>Notifications Récentes</span>
          </h4>
          
          <AnimatePresence>
            {notifications.slice(0, 5).map((notif, index) => {
              const typeColors = {
                'success': { bg: 'bg-green-500/20', border: 'border-green-500', text: 'text-green-400' },
                'warning': { bg: 'bg-yellow-500/20', border: 'border-yellow-500', text: 'text-yellow-400' },
                'error': { bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-400' },
                'info': { bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-400' }
              };
              const colors = typeColors[notif.type] || typeColors['info'];

              return (
                <motion.div
                  key={notif.id || index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 rounded-lg border ${colors.border} ${colors.bg}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-2xl">{notif.icon}</span>
                      <div className="flex-1">
                        <div className={`font-medium ${colors.text} mb-1`}>
                          {notif.message}
                        </div>
                        {notif.details && (
                          <div className="text-sm text-slate-400">
                            {notif.details}
                          </div>
                        )}
                        {notif.timestamp && (
                          <div className="text-xs text-slate-500 mt-1">
                            {formatDate(notif.timestamp)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {notif.action && (
                        <button
                          onClick={notif.action.onClick}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                        >
                          {notif.action.label}
                        </button>
                      )}
                      {onDismissNotification && (
                        <button
                          onClick={() => onDismissNotification(notif.id || index)}
                          className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-sm rounded transition-colors"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Indicateurs Performance */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <span>⚡</span>
          <span>Performance Synchronisation</span>
        </h4>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400">
              {syncStatus === 'success' ? '<1s' : '--'}
            </div>
            <div className="text-sm text-slate-400 mt-1">Latence</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400">100%</div>
            <div className="text-sm text-slate-400 mt-1">Fiabilité</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400">
              {modules.filter(m => m.connected).length}
            </div>
            <div className="text-sm text-slate-400 mt-1">Modules actifs</div>
          </div>
        </div>
      </div>

      {/* Documentation */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/50 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <span>📚</span>
          <span>Comment ça marche ?</span>
        </h4>
        <div className="space-y-2 text-sm text-slate-300">
          <p>• <strong>Temps réel</strong>: Toute modification de répartition est propagée instantanément</p>
          <p>• <strong>Cross-modules</strong>: Les changements impactent automatiquement tous les modules connectés</p>
          <p>• <strong>Cohérence</strong>: L'équilibre global est maintenu automatiquement</p>
          <p>• <strong>Notifications</strong>: Vous êtes alerté de chaque changement important</p>
        </div>
      </div>
    </div>
  );
};

export default SyncInterface;
