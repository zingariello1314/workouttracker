import React, { useState, useMemo } from 'react';
import { useInvestissements } from '../../../hooks/useInvestissements';
import { useToast } from '../../ui/Toast/ToastProvider';

const DCAManager = ({ dca, onUpdate }) => {
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const dcaData = dca || {
    frequence: 'mensuel',
    montants: {
      etf: 300,
      actions: 150,
      crypto: 50
    }
  };

  const totalDCA = useMemo(() => {
    return Object.values(dcaData.montants || {}).reduce((sum, val) => sum + (val || 0), 0);
  }, [dcaData]);

  const frequences = [
    { value: 'hebdomadaire', label: 'Hebdomadaire' },
    { value: 'mensuel', label: 'Mensuel' },
    { value: 'trimestriel', label: 'Trimestriel' }
  ];

  const handleSave = async (newDCA) => {
    try {
      await onUpdate({ dca: newDCA });
      setEditing(false);
      showToast('DCA mis à jour', 'success');
    } catch (error) {
      showToast('Erreur lors de la mise à jour', 'error');
    }
  };

  return (
    <div className="dca-manager bg-slate-800/50 border border-slate-700/50 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-semibold text-white">Moteur DCA Sophistiqué</h4>
        <button
          onClick={() => setEditing(!editing)}
          className="px-3 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded text-sm transition-colors"
        >
          {editing ? 'Annuler' : 'Modifier'}
        </button>
      </div>

      {/* Fréquence */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Fréquence DCA
        </label>
        {editing ? (
          <select
            value={dcaData.frequence}
            onChange={(e) => handleSave({ ...dcaData, frequence: e.target.value })}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
          >
            {frequences.map(freq => (
              <option key={freq.value} value={freq.value}>{freq.label}</option>
            ))}
          </select>
        ) : (
          <div className="text-white font-semibold">
            {frequences.find(f => f.value === dcaData.frequence)?.label || dcaData.frequence}
          </div>
        )}
      </div>

      {/* Montants par type */}
      <div className="space-y-3 mb-4">
        <div className="text-sm font-medium text-slate-300 mb-2">Montants DCA</div>
        {Object.entries(dcaData.montants || {}).map(([type, montant]) => (
          <div key={type} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
            <span className="text-sm text-white capitalize">{type}</span>
            {editing ? (
              <input
                type="number"
                value={montant}
                onChange={(e) => {
                  const newMontants = { ...dcaData.montants };
                  newMontants[type] = parseFloat(e.target.value) || 0;
                  handleSave({ ...dcaData, montants: newMontants });
                }}
                className="w-32 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white text-sm"
                min="0"
                step="0.01"
              />
            ) : (
              <span className="text-sm font-semibold text-white">{formatCurrency(montant)}</span>
            )}
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-300">Total DCA {dcaData.frequence === 'mensuel' ? 'mensuel' : dcaData.frequence === 'hebdomadaire' ? 'hebdomadaire' : 'trimestriel'}</span>
          <span className="text-xl font-bold text-white">{formatCurrency(totalDCA)}</span>
        </div>
      </div>

      {/* Fonctionnalités avancées */}
      <div className="mt-4 p-3 bg-slate-700/30 rounded-lg">
        <div className="text-sm font-medium text-slate-300 mb-2">Fonctionnalités DCA</div>
        <div className="text-xs text-slate-400 space-y-1">
          <div>• Smart averaging : Augmentation achats sur baisses &gt;15%</div>
          <div>• Rebalancing automatique : Maintien allocation cible</div>
          <div>• Momentum integration : Pause DCA sur cassures techniques</div>
        </div>
      </div>
    </div>
  );
};

export default DCAManager;

