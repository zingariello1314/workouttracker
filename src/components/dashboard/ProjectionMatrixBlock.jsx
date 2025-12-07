/**
 * ProjectionMatrixBlock Component
 * Bloc Matrice de Projection - PRIORITY-LOW (Bloc 23)
 * Projections futures multi-scénarios avec paramètres ajustables
 */

import { useState } from 'react';
import { LineChart, Settings, TrendingUp } from 'lucide-react';
import ProjectionMatrix from './ProjectionMatrix';

const ProjectionMatrixBlock = ({ projectionsData }) => {
  const [selectedMetric, setSelectedMetric] = useState('patrimoine');
  const [showSettings, setShowSettings] = useState(false);

  if (!projectionsData) {
    return (
      <div className="p-6 bg-slate-800/50 border border-slate-700/50 rounded-xl">
        <div className="text-center text-slate-400">Chargement des projections...</div>
      </div>
    );
  }

  const { metrics, currentValues } = projectionsData;

  const metricOptions = [
    { value: 'patrimoine', label: 'Patrimoine', unit: '€', icon: '💰' },
    { value: 'sport', label: 'Performance Sport', unit: '', icon: '💪' },
    { value: 'lecture', label: 'Pages Lues', unit: '', icon: '📚' },
    { value: 'apprentissage', label: 'Heures Étude', unit: 'h', icon: '🎓' }
  ];

  const selectedMetricData = metricOptions.find(m => m.value === selectedMetric);

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border-2 border-cyan-500/50 rounded-2xl p-6 backdrop-blur-sm col-span-full">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/5 to-transparent pointer-events-none"></div>

      <div className="relative space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500/20 rounded-xl border border-cyan-400/30">
              <LineChart className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Matrice de Projection</h3>
              <p className="text-sm text-slate-400 mt-1">Prévisions basées sur vos tendances actuelles</p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 text-white font-medium rounded-lg transition-all flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Paramètres
          </button>
        </div>

        {/* Metric Selector */}
        <div className="flex items-center gap-2 flex-wrap">
          {metricOptions.map(metric => (
            <button
              key={metric.value}
              onClick={() => setSelectedMetric(metric.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                selectedMetric === metric.value
                  ? 'bg-cyan-500/20 text-cyan-400 border-2 border-cyan-500/50'
                  : 'bg-slate-700/50 text-slate-300 border border-slate-600 hover:border-slate-500'
              }`}
            >
              <span>{metric.icon}</span>
              <span>{metric.label}</span>
            </button>
          ))}
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 space-y-4">
            <h4 className="text-sm font-semibold text-white">Paramètres de Projection</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Taux de croissance optimiste</label>
                <input
                  type="number"
                  defaultValue="15"
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Taux de croissance réaliste</label>
                <input
                  type="number"
                  defaultValue="8"
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Taux de croissance pessimiste</label>
                <input
                  type="number"
                  defaultValue="3"
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Projection Matrix */}
        <div className="p-6 bg-slate-800/30 rounded-xl border border-slate-700/50">
          <ProjectionMatrix
            projections={metrics[selectedMetric]}
            currentValue={currentValues[selectedMetric]}
            unit={selectedMetricData?.unit || ''}
          />
        </div>

        {/* Insights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <h4 className="text-sm font-semibold text-white">Scénario Optimiste</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Si vous maintenez votre rythme actuel et améliorez légèrement vos performances
            </p>
          </div>

          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <h4 className="text-sm font-semibold text-white">Scénario Réaliste</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Basé sur votre progression moyenne des 3 derniers mois
            </p>
          </div>

          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-red-400" />
              <h4 className="text-sm font-semibold text-white">Scénario Pessimiste</h4>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Si vous rencontrez des difficultés ou ralentissez votre rythme
            </p>
          </div>
        </div>

        {/* Recommendations */}
        <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl">
          <h4 className="text-sm font-semibold text-white mb-2">Recommandations</h4>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-0.5">•</span>
              <span>Pour atteindre le scénario optimiste, augmentez votre effort quotidien de 15%</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-0.5">•</span>
              <span>Le scénario réaliste est atteignable en maintenant votre rythme actuel</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400 mt-0.5">•</span>
              <span>Évitez les interruptions prolongées pour ne pas tomber dans le scénario pessimiste</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProjectionMatrixBlock;
