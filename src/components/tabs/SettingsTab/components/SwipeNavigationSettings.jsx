/**
 * Composant SwipeNavigationSettings - Interface utilisateur pour la navigation par swipe
 * 
 * ✅ PHASE 4 : Extraction de l'UI pour la navigation par swipe
 * 
 * @module components/tabs/SettingsTab/components/SwipeNavigationSettings
 */

import React from 'react';
import { Navigation, CheckCircle, AlertTriangle } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';

/**
 * Composant pour gérer les paramètres de navigation par swipe
 * 
 * @param {Object} swipeSettings - Données du hook useSwipeSettings
 * @returns {JSX.Element}
 */
const SwipeNavigationSettings = ({ swipeSettings }) => {
  const {
    swipeEnabled,
    swipeThreshold,
    swipeSettingsStatus,
    handleSwipeEnabledChange,
    handleSwipeThresholdChange,
  } = swipeSettings;

  return (
    <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center text-white">
          <Navigation className="mr-2" size={20} />
          Navigation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <p className="text-gray-300 text-sm">
            Personnalisez la navigation par swipe sur la page d'accueil.
          </p>

          {/* Toggle Activer/Désactiver */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-200">
                  Activer la navigation par swipe
                </label>
                <p className="text-xs text-slate-400">
                  Swipez vers le bas sur la page d'accueil pour accéder au dashboard
                </p>
              </div>
              <button
                onClick={() => handleSwipeEnabledChange(!swipeEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 ${
                  swipeEnabled ? 'bg-blue-600' : 'bg-slate-600'
                }`}
                role="switch"
                aria-checked={swipeEnabled}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    swipeEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Slider pour le threshold */}
          {swipeEnabled && (
            <div className="space-y-3 pt-4 border-t border-slate-700">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-200">
                    Distance de swipe requise
                  </label>
                  <span className="text-sm font-semibold text-blue-400">
                    {swipeThreshold}px
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Ajustez la distance minimale pour déclencher la navigation (50-200px)
                </p>
              </div>
              
              <div className="space-y-2">
                <input
                  type="range"
                  min="50"
                  max="200"
                  step="10"
                  value={swipeThreshold}
                  onChange={(e) => handleSwipeThresholdChange(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  style={{
                    background: `linear-gradient(to right, rgb(37 99 235) 0%, rgb(37 99 235) ${((swipeThreshold - 50) / 150) * 100}%, rgb(51 65 85) ${((swipeThreshold - 50) / 150) * 100}%, rgb(51 65 85) 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>50px (Sensible)</span>
                  <span>200px (Moins sensible)</span>
                </div>
              </div>
            </div>
          )}

          {/* Message de statut */}
          {swipeSettingsStatus === 'success' && (
            <div className="flex items-center text-green-400 text-sm">
              <CheckCircle className="mr-2" size={16} />
              Paramètres sauvegardés avec succès
            </div>
          )}

          {swipeSettingsStatus === 'error' && (
            <div className="flex items-center text-red-400 text-sm">
              <AlertTriangle className="mr-2" size={16} />
              Erreur lors de la sauvegarde des paramètres
            </div>
          )}

          {/* Informations supplémentaires */}
          <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
            <h4 className="text-sm font-medium text-slate-200">💡 Astuce</h4>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>• Le swipe fonctionne uniquement sur la page d'accueil</li>
              <li>• Les boutons et éléments interactifs ne sont pas affectés</li>
              <li>• Un indicateur visuel apparaît pendant le swipe</li>
              <li>• Raccourci clavier : Appuyez sur 'D' pour accéder au dashboard</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SwipeNavigationSettings;
