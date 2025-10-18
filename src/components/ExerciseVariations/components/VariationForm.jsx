import React from 'react';
import { Plus, Edit3, X } from 'lucide-react';

const VariationForm = ({ 
  newVariation, 
  setNewVariation, 
  isEditing, 
  difficulties, 
  categories, 
  muscleGroupOptions, 
  benefitOptions,
  onSave,
  onCancel 
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave();
  };

  return (
    <div className="bg-slate-800/50 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          {isEditing ? <Edit3 size={20} /> : <Plus size={20} />}
          {isEditing ? 'Modifier la variation' : 'Nouvelle variation'}
        </h3>
        {isEditing && (
          <button
            onClick={onCancel}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nom de la variation *
            </label>
            <input
              type="text"
              value={newVariation.name}
              onChange={(e) => setNewVariation({ ...newVariation, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="Ex: Pompes diamant"
              required
            />
          </div>

          {/* Difficulté */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Difficulté
            </label>
            <select
              value={newVariation.difficulty}
              onChange={(e) => setNewVariation({ ...newVariation, difficulty: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              {difficulties.map(diff => (
                <option key={diff.value} value={diff.value}>
                  {diff.icon} {diff.label}
                </option>
              ))}
            </select>
          </div>

          {/* Catégorie */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Catégorie
            </label>
            <select
              value={newVariation.category}
              onChange={(e) => setNewVariation({ ...newVariation, category: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Équipement */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Équipement
            </label>
            <input
              type="text"
              value={newVariation.equipment}
              onChange={(e) => setNewVariation({ ...newVariation, equipment: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="Ex: Haltères, barre, poids du corps"
            />
          </div>
        </div>

        {/* Groupes musculaires */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Groupes musculaires ciblés
          </label>
          <div className="flex flex-wrap gap-2">
            {muscleGroupOptions.map(muscle => (
              <button
                key={muscle}
                type="button"
                onClick={() => {
                  const muscles = newVariation.muscleGroups.includes(muscle)
                    ? newVariation.muscleGroups.filter(m => m !== muscle)
                    : [...newVariation.muscleGroups, muscle];
                  setNewVariation({ ...newVariation, muscleGroups: muscles });
                }}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
                  newVariation.muscleGroups.includes(muscle)
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {muscle}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Description
          </label>
          <textarea
            value={newVariation.description}
            onChange={(e) => setNewVariation({ ...newVariation, description: e.target.value })}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            rows="3"
            placeholder="Décrivez l'exercice et sa technique..."
          />
        </div>

        {/* Conseils */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Conseils et astuces
          </label>
          <textarea
            value={newVariation.tips}
            onChange={(e) => setNewVariation({ ...newVariation, tips: e.target.value })}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            rows="2"
            placeholder="Conseils pour bien exécuter l'exercice..."
          />
        </div>

        {/* Bénéfices */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Bénéfices
          </label>
          <div className="flex flex-wrap gap-2">
            {benefitOptions.map(benefit => (
              <button
                key={benefit}
                type="button"
                onClick={() => {
                  const benefits = newVariation.benefits.includes(benefit)
                    ? newVariation.benefits.filter(b => b !== benefit)
                    : [...newVariation.benefits, benefit];
                  setNewVariation({ ...newVariation, benefits });
                }}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
                  newVariation.benefits.includes(benefit)
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {benefit}
              </button>
            ))}
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all"
          >
            {isEditing ? 'Mettre à jour' : 'Ajouter'}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-all"
            >
              Annuler
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default VariationForm;