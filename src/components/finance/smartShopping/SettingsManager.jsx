/**
 * Settings Manager - Paramètres utilisateur Smart Shopping
 * Magasins, Seuils, Notifications, Affichage, Optimisations
 */

import { useState, useEffect } from 'react';
import { Settings, Store, Bell, Eye, Zap, Save, RotateCcw } from 'lucide-react';

const DEFAULT_SETTINGS = {
  magasinsPreferences: ['Carrefour', 'Leclerc', 'Auchan', 'Grand Frais', 'Action'],
  seuilsAlertes: {
    budgetWarning: 90, // %
    budgetCritical: 100, // %
    stockBas: 2 // quantité
  },
  notifications: {
    promos: true,
    stockBas: true,
    depassementBudget: true
  },
  affichage: {
    deviseSymbol: '€',
    formatDate: 'DD/MM/YYYY',
    theme: 'auto' // light | dark | auto
  },
  optimisations: {
    autoSuggestSubstitutions: true,
    autoDetectPromos: true,
    learningEnabled: true
  }
};

const MAGASINS_DISPONIBLES = [
  { id: 'action', nom: 'Action', icon: '🏪' },
  { id: 'grand-frais', nom: 'Grand Frais', icon: '🥬' },
  { id: 'auchan', nom: 'Auchan', icon: '🛒' },
  { id: 'carrefour', nom: 'Carrefour', icon: '🏬' },
  { id: 'leclerc', nom: 'Leclerc', icon: '🏪' },
  { id: 'lidl', nom: 'Lidl', icon: '🛍️' },
  { id: 'intermarche', nom: 'Intermarché', icon: '🏪' }
];

const SettingsManager = () => {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ==========================================================================
  // LOAD SETTINGS
  // ==========================================================================

  useEffect(() => {
    try {
      const stored = localStorage.getItem('smartshopping_settings');
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }, []);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleUpdateSettings = (path, value) => {
    setSettings(prev => {
      const updated = { ...prev };
      const keys = path.split('.');
      let current = updated;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return updated;
    });
    setHasChanges(true);
    setSaveSuccess(false);
  };

  const handleSave = () => {
    try {
      localStorage.setItem('smartshopping_settings', JSON.stringify(settings));
      setHasChanges(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Erreur lors de la sauvegarde des paramètres');
    }
  };

  const handleReset = () => {
    if (confirm('Réinitialiser tous les paramètres par défaut ?')) {
      setSettings(DEFAULT_SETTINGS);
      setHasChanges(true);
      setSaveSuccess(false);
    }
  };

  const handleToggleMagasin = (magasin) => {
    const current = settings.magasinsPreferences;
    const updated = current.includes(magasin)
      ? current.filter(m => m !== magasin)
      : [...current, magasin];
    handleUpdateSettings('magasinsPreferences', updated);
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="settings-manager space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="relative">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-xl">
                  <Settings className="w-6 h-6 text-blue-400" />
                </div>
                Paramètres Smart Shopping
              </h3>
              <p className="text-slate-400 text-sm mt-2">
                Personnalisez votre expérience de courses
              </p>
            </div>

            <div className="flex items-center gap-3">
              {saveSuccess && (
                <div className="px-4 py-2 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Sauvegardé
                </div>
              )}
              
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
                aria-label="Réinitialiser les paramètres"
              >
                <RotateCcw className="w-4 h-4" />
                Réinitialiser
              </button>

              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-500 hover:to-green-500 text-white rounded-lg transition-all duration-300 font-medium shadow-lg hover:shadow-blue-500/50 hover:scale-105 transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Magasins Préférences */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>
        <div className="relative">
          <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-xl">
              <Store className="w-5 h-5 text-purple-400" />
            </div>
            Magasins Préférés
          </h4>
          <p className="text-sm text-slate-400 mb-4">
            Sélectionnez vos magasins favoris (ordre de préférence)
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {MAGASINS_DISPONIBLES.map(magasin => {
              const isSelected = settings.magasinsPreferences.includes(magasin.nom);
              const index = settings.magasinsPreferences.indexOf(magasin.nom);
              
              return (
                <button
                  key={magasin.id}
                  onClick={() => handleToggleMagasin(magasin.nom)}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 transform ${
                    isSelected
                      ? 'bg-gradient-to-br from-blue-500/20 to-green-500/20 border-blue-500/50 shadow-lg shadow-blue-500/20'
                      : 'bg-slate-800/50 border-slate-700/50 hover:border-blue-500/50'
                  }`}
                >
                  <div className="text-3xl mb-2">{magasin.icon}</div>
                  <div className={`text-sm font-semibold ${
                    isSelected ? 'text-blue-400' : 'text-slate-400'
                  }`}>
                    {magasin.nom}
                  </div>
                  
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {index + 1}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Seuils d'Alertes */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 rounded-full blur-3xl"></div>
        <div className="relative">
          <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-xl">
              <Bell className="w-5 h-5 text-yellow-400" />
            </div>
            Seuils d'Alertes
          </h4>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Alerte Budget (Warning) - {settings.seuilsAlertes.budgetWarning}%
              </label>
              <input
                type="range"
                min="50"
                max="100"
                value={settings.seuilsAlertes.budgetWarning}
                onChange={(e) => handleUpdateSettings('seuilsAlertes.budgetWarning', parseInt(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Alerte Budget (Critical) - {settings.seuilsAlertes.budgetCritical}%
              </label>
              <input
                type="range"
                min="80"
                max="120"
                value={settings.seuilsAlertes.budgetCritical}
                onChange={(e) => handleUpdateSettings('seuilsAlertes.budgetCritical', parseInt(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Stock Bas (quantité) - {settings.seuilsAlertes.stockBas}
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={settings.seuilsAlertes.stockBas}
                onChange={(e) => handleUpdateSettings('seuilsAlertes.stockBas', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-green-500/5 rounded-full blur-3xl"></div>
        <div className="relative">
          <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-xl">
              <Bell className="w-5 h-5 text-green-400" />
            </div>
            Notifications
          </h4>

          <div className="space-y-3">
            {Object.entries(settings.notifications).map(([key, value]) => (
              <label key={key} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-blue-500/50 transition-colors cursor-pointer">
                <span className="text-white">
                  {key === 'promos' && 'Alertes Promotions'}
                  {key === 'stockBas' && 'Alertes Stock Bas'}
                  {key === 'depassementBudget' && 'Alertes Dépassement Budget'}
                </span>
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => handleUpdateSettings(`notifications.${key}`, e.target.checked)}
                  className="w-5 h-5 rounded accent-blue-500 cursor-pointer"
                />
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Optimisations */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="relative">
          <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-xl">
              <Zap className="w-5 h-5 text-blue-400" />
            </div>
            Optimisations Automatiques
          </h4>

          <div className="space-y-3">
            {Object.entries(settings.optimisations).map(([key, value]) => (
              <label key={key} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-blue-500/50 transition-colors cursor-pointer">
                <span className="text-white">
                  {key === 'autoSuggestSubstitutions' && 'Suggestions de Substitutions'}
                  {key === 'autoDetectPromos' && 'Détection Automatique Promos'}
                  {key === 'learningEnabled' && 'Apprentissage Automatique'}
                </span>
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => handleUpdateSettings(`optimisations.${key}`, e.target.checked)}
                  className="w-5 h-5 rounded accent-blue-500 cursor-pointer"
                />
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsManager;
