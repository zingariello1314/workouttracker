/**
 * LeisureObjectivesBlock Component
 * Bloc Loisirs Planifiés - PRIORITY-LOW (Bloc 26)
 * Planification d'achats loisirs avec faisabilité et timeline
 */

import { useState } from 'react';
import { Gamepad2, Plus, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import ImageUploader from './ImageUploader';
import TimelineView from './TimelineView';

const LeisureObjectivesBlock = ({ objectivesData, onAddObjective, onUpdateProgress }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    cost: '',
    saved: 0,
    targetDate: '',
    image: null
  });

  if (!objectivesData) {
    return (
      <div className="p-6 bg-slate-800/50 border border-slate-700/50 rounded-xl">
        <div className="text-center text-slate-400">Chargement des objectifs...</div>
      </div>
    );
  }

  const { objectives, totalBudget, monthlyContribution } = objectivesData;

  const getFeasibility = (cost, saved, monthlyContribution) => {
    const remaining = cost - saved;
    const monthsNeeded = remaining / monthlyContribution;

    if (monthsNeeded <= 1) return { level: 'facile', label: 'Facile', color: 'green' };
    if (monthsNeeded <= 3) return { level: 'faisable', label: 'Faisable', color: 'blue' };
    if (monthsNeeded <= 6) return { level: 'difficile', label: 'Difficile', color: 'yellow' };
    return { level: 'impossible', label: 'Très difficile', color: 'red' };
  };

  const getFeasibilityColor = (color) => {
    const colors = {
      green: 'bg-green-500/20 text-green-400 border-green-500/50',
      blue: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
      red: 'bg-red-500/20 text-red-400 border-red-500/50'
    };
    return colors[color];
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onAddObjective(formData);
    setFormData({ name: '', cost: '', saved: 0, targetDate: '', image: null });
    setShowForm(false);
  };

  const timelineItems = objectives
    .filter(obj => obj.targetDate)
    .sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate))
    .map(obj => ({
      id: obj.id,
      title: obj.name,
      date: obj.targetDate,
      status: obj.saved >= obj.cost ? 'completed' : 'pending',
      urgent: new Date(obj.targetDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }));

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-pink-500/10 to-rose-600/10 border-2 border-pink-500/50 rounded-2xl p-6 backdrop-blur-sm">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-400/5 to-transparent pointer-events-none"></div>

      <div className="relative space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-pink-500/20 rounded-xl border border-pink-400/30">
              <Gamepad2 className="w-6 h-6 text-pink-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Loisirs Planifiés</h3>
              <p className="text-sm text-slate-400 mt-1">Vos objectifs d'achats plaisir</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-medium rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-pink-500/20"
          >
            <Plus className="w-4 h-4" />
            {showForm ? 'Annuler' : 'Nouvel Objectif'}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Nom de l'objectif *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: PlayStation 5"
                  required
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Coût (€) *
                  </label>
                  <input
                    type="number"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    placeholder="500"
                    required
                    min="0"
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Date cible
                  </label>
                  <input
                    type="date"
                    value={formData.targetDate}
                    onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-pink-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Image (optionnel)
                </label>
                <ImageUploader
                  onImageSelect={(image) => setFormData({ ...formData, image })}
                  currentImage={formData.image}
                  maxSize={2}
                />
              </div>

              <button
                type="submit"
                className="w-full px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-medium rounded-lg transition-all"
              >
                Ajouter l'Objectif
              </button>
            </form>
          </div>
        )}

        {/* Budget Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <p className="text-sm text-slate-400 mb-1">Budget Total</p>
            <p className="text-2xl font-bold text-white">{totalBudget}€</p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <p className="text-sm text-slate-400 mb-1">Contribution Mensuelle</p>
            <p className="text-2xl font-bold text-pink-400">{monthlyContribution}€</p>
          </div>
        </div>

        {/* Objectives List */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-white">Objectifs Actifs</h4>
          {objectives.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Aucun objectif pour le moment</p>
              <p className="text-sm mt-1">Créez votre premier objectif loisir !</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {objectives.map(objective => {
                const progress = (objective.saved / objective.cost) * 100;
                const feasibility = getFeasibility(objective.cost, objective.saved, monthlyContribution);

                return (
                  <div
                    key={objective.id}
                    className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors"
                  >
                    {/* Image */}
                    {objective.image && (
                      <img
                        src={objective.image}
                        alt={objective.name}
                        className="w-full h-32 object-cover rounded-lg mb-3"
                      />
                    )}

                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h5 className="text-white font-semibold">{objective.name}</h5>
                        <p className="text-sm text-slate-400 mt-1">{objective.cost}€</p>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${getFeasibilityColor(feasibility.color)}`}>
                        {feasibility.label}
                      </span>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Progression</span>
                        <span className="text-white font-semibold">
                          {objective.saved}€ / {objective.cost}€
                        </span>
                      </div>
                      <div className="h-3 bg-slate-700/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all duration-500 rounded-full"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        >
                          <div className="h-full bg-gradient-to-r from-transparent to-white/20"></div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{progress.toFixed(0)}%</span>
                        {objective.targetDate && (
                          <span>{new Date(objective.targetDate).toLocaleDateString('fr-FR')}</span>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    {progress >= 100 && (
                      <div className="mt-3 flex items-center gap-2 text-green-400 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span>Objectif atteint !</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Timeline */}
        {timelineItems.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-lg font-semibold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-pink-400" />
              Timeline des Objectifs
            </h4>
            <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
              <TimelineView items={timelineItems} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeisureObjectivesBlock;
