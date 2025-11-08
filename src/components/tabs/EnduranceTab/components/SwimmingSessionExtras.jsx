import React from 'react';
import PropTypes from 'prop-types';
import { Plus, Trash2, Activity } from 'lucide-react';

const SwimmingSessionExtras = ({
  laps,
  onAddLap,
  onRemoveLap,
  onUpdateLap,
  heartRate,
  calories,
  pace100m,
  onChangeHeartRate,
  onChangeCalories,
  onChangePace100m
}) => {
  return (
    <>
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-white font-semibold">Longueurs</h4>
          <button
            onClick={onAddLap}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            Ajouter une longueur
          </button>
        </div>
        <div className="space-y-3">
          {laps.map((lap, index) => (
            <div key={index} className="flex gap-3 items-center bg-slate-900/30 p-4 rounded-xl">
              <span className="text-slate-400 font-medium w-8">#{index + 1}</span>
              <div className="flex-1">
                <label className="block text-slate-400 text-xs mb-1">Distance (m)</label>
                <input
                  type="number"
                  value={lap.distance}
                  onChange={(e) => onUpdateLap(index, 'distance', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
              <div className="flex-1">
                <label className="block text-slate-400 text-xs mb-1">Temps (mm:ss)</label>
                <input
                  type="text"
                  value={lap.time}
                  onChange={(e) => onUpdateLap(index, 'time', e.target.value)}
                  placeholder="1:30"
                  className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
              {laps.length > 1 && (
                <button
                  onClick={() => onRemoveLap(index)}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6 p-4 bg-blue-500/10 rounded-xl border border-blue-500/20">
        <h4 className="text-blue-200 font-semibold mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Métriques avancées
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Fréquence cardiaque moyenne</label>
            <div className="relative">
              <input
                type="number"
                value={heartRate}
                onChange={(e) => onChangeHeartRate(e.target.value)}
                placeholder="150"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm">bpm</span>
            </div>
          </div>
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Calories dépensées</label>
            <div className="relative">
              <input
                type="number"
                value={calories}
                onChange={(e) => onChangeCalories(e.target.value)}
                placeholder="300"
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 text-sm">kcal</span>
            </div>
          </div>
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Allure 100m</label>
            <input
              type="text"
              value={pace100m}
              onChange={(e) => onChangePace100m(e.target.value)}
              placeholder="1:45"
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      </div>
    </>
  );
};

SwimmingSessionExtras.propTypes = {
  laps: PropTypes.arrayOf(PropTypes.shape({
    distance: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    time: PropTypes.string
  })).isRequired,
  onAddLap: PropTypes.func.isRequired,
  onRemoveLap: PropTypes.func.isRequired,
  onUpdateLap: PropTypes.func.isRequired,
  heartRate: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  calories: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  pace100m: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onChangeHeartRate: PropTypes.func.isRequired,
  onChangeCalories: PropTypes.func.isRequired,
  onChangePace100m: PropTypes.func.isRequired
};

export default SwimmingSessionExtras;
