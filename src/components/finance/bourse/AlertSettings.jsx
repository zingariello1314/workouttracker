import React, { useState } from 'react';
import { useFinance } from '../../../hooks/useFinance';
import { useToast } from '../../ui/Toast';

const AlertSettings = ({ position, onClose }) => {
  const { updatePosition } = useFinance();
  const { showToast } = useToast();
  const [settings, setSettings] = useState({
    seuilGain: position.settings?.seuilGain || 20,
    seuilPerte: position.settings?.seuilPerte || -10,
    seuilPerteSevere: position.settings?.seuilPerteSevere || -20,
    notifications: position.settings?.notifications !== false
  });

  const handleSave = async () => {
    try {
      await updatePosition({
        ...position,
        settings: {
          ...position.settings,
          ...settings
        }
      });
      showToast('Paramètres d\'alertes sauvegardés', 'success');
      onClose();
    } catch (error) {
      showToast('Erreur lors de la sauvegarde', 'error');
    }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
      <h3 className="text-xl font-semibold text-white mb-4">
        Paramètres d'alertes - {position.ticker}
      </h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Seuil gain (%) (alerte à partir de)
          </label>
          <input
            type="number"
            value={settings.seuilGain}
            onChange={(e) => setSettings({ ...settings, seuilGain: parseFloat(e.target.value) || 0 })}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            min="0"
            step="0.1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Seuil perte (%) (alerte à partir de)
          </label>
          <input
            type="number"
            value={settings.seuilPerte}
            onChange={(e) => setSettings({ ...settings, seuilPerte: parseFloat(e.target.value) || 0 })}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            max="0"
            step="0.1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Seuil perte sévère (%) (alerte critique)
          </label>
          <input
            type="number"
            value={settings.seuilPerteSevere}
            onChange={(e) => setSettings({ ...settings, seuilPerteSevere: parseFloat(e.target.value) || 0 })}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
            max="0"
            step="0.1"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="notifications"
            checked={settings.notifications}
            onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
            className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded"
          />
          <label htmlFor="notifications" className="text-sm text-slate-300">
            Activer les notifications navigateur
          </label>
        </div>
      </div>

      <div className="flex gap-2 mt-6">
        <button
          onClick={handleSave}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Sauvegarder
        </button>
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  );
};

export default AlertSettings;

