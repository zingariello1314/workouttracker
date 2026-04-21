/**
 * Composant SwipeNavigationSettings - Navigation par swipe
 *
 * @module components/tabs/SettingsTab/components/SwipeNavigationSettings
 */

import React from 'react';
import { Navigation, CheckCircle, AlertTriangle } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import { settingsTheme as S } from '../settingsThemeClasses';

const SwipeNavigationSettings = ({ swipeSettings }) => {
  const {
    swipeEnabled,
    swipeThreshold,
    swipeSettingsStatus,
    handleSwipeEnabledChange,
    handleSwipeThresholdChange,
  } = swipeSettings;

  const pct = ((swipeThreshold - 50) / 150) * 100;

  return (
    <Card variant="settings">
      <CardHeader variant="settings">
        <CardTitle tone="settings" className="flex items-center normal-case tracking-normal">
          <Navigation className="mr-2 text-red-400" size={20} />
          Navigation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <p className={`${S.body}`}>
            Personnalisez la navigation par swipe sur la page d'accueil.
          </p>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className={S.label}>Activer la navigation par swipe</label>
                <p className={S.mutedXs}>
                  Swipez vers le bas sur la page d'accueil pour accéder au dashboard
                </p>
              </div>
              <button
                onClick={() => handleSwipeEnabledChange(!swipeEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-black ${
                  swipeEnabled ? 'bg-red-600' : 'bg-red-950/60'
                }`}
                role="switch"
                aria-checked={swipeEnabled}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-red-50 transition-transform ${
                    swipeEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {swipeEnabled && (
            <div className={`space-y-3 border-t pt-4 ${S.divide}`}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className={S.label}>Distance de swipe requise</label>
                  <span className="text-sm font-semibold text-rose-300">{swipeThreshold}px</span>
                </div>
                <p className={S.mutedXs}>
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
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg accent-red-600"
                  style={{
                    background: `linear-gradient(to right, rgb(220 38 38) 0%, rgb(220 38 38) ${pct}%, rgb(69 10 10) ${pct}%, rgb(69 10 10) 100%)`,
                  }}
                />
                <div className={`flex justify-between text-xs ${S.muted}`}>
                  <span>50px (Sensible)</span>
                  <span>200px (Moins sensible)</span>
                </div>
              </div>
            </div>
          )}

          {swipeSettingsStatus === 'success' && (
            <div className="flex items-center text-sm text-emerald-400">
              <CheckCircle className="mr-2" size={16} />
              Paramètres sauvegardés avec succès
            </div>
          )}

          {swipeSettingsStatus === 'error' && (
            <div className="flex items-center text-sm text-red-400">
              <AlertTriangle className="mr-2" size={16} />
              Erreur lors de la sauvegarde des paramètres
            </div>
          )}

          <div className={`${S.inset} space-y-2`}>
            <h4 className={S.label}>Astuce</h4>
            <ul className={`space-y-1 text-xs ${S.muted}`}>
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
