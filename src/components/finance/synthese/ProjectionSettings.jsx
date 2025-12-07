/**
 * Projection Settings - Interface modification hypothèses
 * Sliders rendements + durée + DCA avec recalcul automatique
 */

import { useState } from 'react';
import { Settings, Save, RotateCcw } from 'lucide-react';
import { formatCurrency } from '../../../utils/planificateurUtils';

const ProjectionSettings = ({ projections, planEpargne, onUpdateProjections, onUpdatePlanEpargne, duree, onDureeChange }) => {
  const [scenarios, setScenarios] = useState(projections?.scenarios || []);
  const [dca, setDca] = useState({
    or: planEpargne?.or?.dca || 0,
    bourse: planEpargne?.bourse?.dca || 0,
    cash: planEpargne?.cash?.dca || 0
  });
  const [selectedDuree, setSelectedDuree] = useState(duree || 5);

  const handleScenarioChange = (index, field, value) => {
    const newScenarios = [...scenarios];
    newScenarios[index] = {
      ...newScenarios[index],
      [field]: parseFloat(value) || 0
    };
    setScenarios(newScenarios);
  };

  const handleDcaChange = (actif, value) => {
    setDca({
      ...dca,
      [actif]: parseFloat(value) || 0
    });
  };

  const handleSaveProjections = async () => {
    if (onUpdateProjections) {
      await onUpdateProjections(scenarios);
    }
  };

  const handleSavePlanEpargne = async () => {
    if (onUpdatePlanEpargne) {
      const newPlanEpargne = {
        ...planEpargne,
        or: { ...planEpargne.or, dca: dca.or },
        bourse: { ...planEpargne.bourse, dca: dca.bourse },
        cash: { ...planEpargne.cash, dca: dca.cash },
        totalMensuel: dca.or + dca.bourse + dca.cash
      };
      await onUpdatePlanEpargne(newPlanEpargne);
    }
  };

  const handleDureeChange = (newDuree) => {
    setSelectedDuree(newDuree);
    if (onDureeChange) {
      onDureeChange(newDuree);
    }
  };

  const handleReset = () => {
    setScenarios([
      { nom: 'Optimiste', or: 12, bourse: 15, duree: selectedDuree, patrimoineFinal: 0 },
      { nom: 'Réaliste', or: 7, bourse: 10, duree: selectedDuree, patrimoineFinal: 0 },
      { nom: 'Pessimiste', or: 3, bourse: 5, duree: selectedDuree, patrimoineFinal: 0 }
    ]);
    setDca({
      or: planEpargne?.or?.dca || 0,
      bourse: planEpargne?.bourse?.dca || 0,
      cash: planEpargne?.cash?.dca || 0
    });
  };

  return (
    <div className="space-y-6">
      {/* Durée Projection */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-6 h-6 text-purple-400" />
          <div>
            <h3 className="text-xl font-semibold text-white">Durée de Projection</h3>
            <p className="text-sm text-slate-400">Sélectionnez l'horizon temporel</p>
          </div>
        </div>

        <div className="flex gap-3">
          {[5, 10, 20, 30].map(years => (
            <button
              key={years}
              onClick={() => handleDureeChange(years)}
              className={`flex-1 px-6 py-4 rounded-lg font-semibold transition-all ${
                selectedDuree === years
                  ? 'bg-purple-600 text-white shadow-lg scale-105'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {years} ans
            </button>
          ))}
        </div>
      </div>

      {/* Rendements Espérés */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-6">Rendements Espérés (% annualisé)</h3>
        
        <div className="space-y-6">
          {scenarios.map((scenario, index) => {
            const colors = {
              'Optimiste': 'text-green-400 border-green-500/30',
              'Réaliste': 'text-blue-400 border-blue-500/30',
              'Pessimiste': 'text-orange-400 border-orange-500/30'
            };

            return (
              <div key={index} className={`p-4 border-2 ${colors[scenario.nom]} rounded-lg`}>
                <div className={`text-lg font-semibold ${colors[scenario.nom]} mb-4`}>
                  {scenario.nom}
                </div>
                
                <div className="space-y-4">
                  {/* Or */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-slate-300">Or</label>
                      <span className="text-white font-semibold">{scenario.or}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="0.5"
                      value={scenario.or}
                      onChange={(e) => handleScenarioChange(index, 'or', e.target.value)}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                    />
                  </div>

                  {/* Bourse */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm text-slate-300">Bourse</label>
                      <span className="text-white font-semibold">{scenario.bourse}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="25"
                      step="0.5"
                      value={scenario.bourse}
                      onChange={(e) => handleScenarioChange(index, 'bourse', e.target.value)}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSaveProjections}
            className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-semibold"
          >
            <Save className="w-5 h-5" />
            Enregistrer Rendements
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Montants Mensuels DCA */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-white mb-6">Montants Mensuels (DCA)</h3>
        
        <div className="space-y-4">
          {/* Or */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-slate-300 flex items-center gap-2">
                <span className="text-xl">🪙</span>
                Or
              </label>
              <span className="text-white font-semibold">{formatCurrency(dca.or)}/mois</span>
            </div>
            <input
              type="range"
              min="0"
              max="1000"
              step="10"
              value={dca.or}
              onChange={(e) => handleDcaChange('or', e.target.value)}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
            />
          </div>

          {/* Bourse */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-slate-300 flex items-center gap-2">
                <span className="text-xl">📈</span>
                Bourse
              </label>
              <span className="text-white font-semibold">{formatCurrency(dca.bourse)}/mois</span>
            </div>
            <input
              type="range"
              min="0"
              max="2000"
              step="10"
              value={dca.bourse}
              onChange={(e) => handleDcaChange('bourse', e.target.value)}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* Cash */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-slate-300 flex items-center gap-2">
                <span className="text-xl">💵</span>
                Cash
              </label>
              <span className="text-white font-semibold">{formatCurrency(dca.cash)}/mois</span>
            </div>
            <input
              type="range"
              min="0"
              max="1000"
              step="10"
              value={dca.cash}
              onChange={(e) => handleDcaChange('cash', e.target.value)}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500"
            />
          </div>

          {/* Total */}
          <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-slate-300 font-medium">Total Mensuel</span>
              <span className="text-2xl font-bold text-white">
                {formatCurrency(dca.or + dca.bourse + dca.cash)}/mois
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleSavePlanEpargne}
          className="w-full mt-6 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-semibold"
        >
          <Save className="w-5 h-5" />
          Enregistrer Plan Épargne
        </button>
      </div>

      {/* Info */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <div className="text-sm text-slate-300">
          <div className="font-semibold text-white mb-2">💡 Recalcul automatique</div>
          Les graphiques de projection se mettent à jour automatiquement quand vous modifiez les paramètres.
          Cliquez sur "Enregistrer" pour sauvegarder vos modifications.
        </div>
      </div>
    </div>
  );
};

export default ProjectionSettings;
