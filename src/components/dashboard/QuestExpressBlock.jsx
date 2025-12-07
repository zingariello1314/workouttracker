/**
 * QuestExpressBlock Component
 * Bloc Quête Express - PRIORITY-LOW (Bloc 24)
 * Création rapide de quêtes avec calcul XP temps réel
 */

import { useState } from 'react';
import { Zap, Plus, Calendar, Star } from 'lucide-react';
import QuickForm from './QuickForm';

const QuestExpressBlock = ({ onCreateQuest }) => {
  const [showForm, setShowForm] = useState(false);
  const [calculatedXP, setCalculatedXP] = useState(0);

  const difficultyXP = {
    facile: 10,
    moyen: 25,
    difficile: 50,
    extreme: 100
  };

  const durationMultiplier = {
    '15': 1,
    '30': 1.5,
    '60': 2,
    '120': 3,
    '240': 4
  };

  const calculateXP = (difficulty, duration) => {
    const baseXP = difficultyXP[difficulty] || 10;
    const multiplier = durationMultiplier[duration] || 1;
    return Math.round(baseXP * multiplier);
  };

  const formFields = [
    {
      name: 'name',
      label: 'Nom de la quête',
      type: 'text',
      placeholder: 'Ex: Faire 50 pompes',
      required: true,
      validate: (value) => {
        if (value.length < 3) return 'Le nom doit contenir au moins 3 caractères';
        if (value.length > 50) return 'Le nom ne doit pas dépasser 50 caractères';
        return null;
      }
    },
    {
      name: 'category',
      label: 'Catégorie',
      type: 'select',
      required: true,
      options: [
        { value: 'sport', label: '💪 Sport' },
        { value: 'lecture', label: '📚 Lecture' },
        { value: 'apprentissage', label: '🎓 Apprentissage' },
        { value: 'travail', label: '💼 Travail' },
        { value: 'personnel', label: '🎯 Personnel' }
      ]
    },
    {
      name: 'difficulty',
      label: 'Difficulté',
      type: 'select',
      required: true,
      options: [
        { value: 'facile', label: '⭐ Facile (10 XP)' },
        { value: 'moyen', label: '⭐⭐ Moyen (25 XP)' },
        { value: 'difficile', label: '⭐⭐⭐ Difficile (50 XP)' },
        { value: 'extreme', label: '⭐⭐⭐⭐ Extrême (100 XP)' }
      ]
    },
    {
      name: 'duration',
      label: 'Durée estimée',
      type: 'select',
      required: true,
      options: [
        { value: '15', label: '15 minutes' },
        { value: '30', label: '30 minutes' },
        { value: '60', label: '1 heure' },
        { value: '120', label: '2 heures' },
        { value: '240', label: '4 heures' }
      ]
    },
    {
      name: 'type',
      label: 'Type de quête',
      type: 'select',
      required: true,
      options: [
        { value: 'exceptionnelle', label: '🎯 Exceptionnelle (une fois)' },
        { value: 'recurrente', label: '🔄 Récurrente (hebdomadaire)' }
      ]
    },
    {
      name: 'days',
      label: 'Jours de la semaine (si récurrente)',
      type: 'text',
      placeholder: 'Ex: Lun, Mer, Ven',
      hint: 'Laissez vide pour une quête exceptionnelle'
    }
  ];

  const handleFormChange = (formData) => {
    if (formData.difficulty && formData.duration) {
      const xp = calculateXP(formData.difficulty, formData.duration);
      setCalculatedXP(xp);
    }
  };

  const handleSubmit = (formData) => {
    const questData = {
      ...formData,
      xp: calculatedXP,
      createdAt: new Date().toISOString(),
      completed: false
    };
    
    onCreateQuest(questData);
    setShowForm(false);
    setCalculatedXP(0);
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-yellow-500/10 to-amber-600/10 border-2 border-yellow-500/50 rounded-2xl p-6 backdrop-blur-sm">
      {/* Glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/5 to-transparent pointer-events-none"></div>

      <div className="relative space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-500/20 rounded-xl border border-yellow-400/30">
              <Zap className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Quête Express</h3>
              <p className="text-sm text-slate-400 mt-1">Créez une quête en quelques secondes</p>
            </div>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-white font-medium rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-yellow-500/20"
            >
              <Plus className="w-4 h-4" />
              Nouvelle Quête
            </button>
          )}
        </div>

        {showForm ? (
          <div className="space-y-4">
            {/* XP Calculator Display */}
            {calculatedXP > 0 && (
              <div className="p-4 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/50 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-400" />
                    <span className="text-sm font-medium text-white">XP Calculé</span>
                  </div>
                  <div className="text-2xl font-bold text-yellow-400">
                    {calculatedXP} XP
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <QuickForm
                fields={formFields}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setCalculatedXP(0);
                }}
                submitLabel="Créer la Quête"
                cancelLabel="Annuler"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-3 mb-2">
                  <Calendar className="w-5 h-5 text-yellow-400" />
                  <h4 className="text-sm font-semibold text-white">Quêtes Récurrentes</h4>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Créez des quêtes qui se répètent chaque semaine aux jours que vous choisissez
                </p>
              </div>

              <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="flex items-center gap-3 mb-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <h4 className="text-sm font-semibold text-white">Calcul XP Automatique</h4>
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  L'XP est calculé automatiquement selon la difficulté et la durée estimée
                </p>
              </div>
            </div>

            {/* XP Reference Table */}
            <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-700/50">
              <h4 className="text-sm font-semibold text-white mb-3">Référence XP</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="text-center">
                  <p className="text-slate-400 mb-1">Facile</p>
                  <p className="text-green-400 font-bold">10 XP</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-400 mb-1">Moyen</p>
                  <p className="text-blue-400 font-bold">25 XP</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-400 mb-1">Difficile</p>
                  <p className="text-yellow-400 font-bold">50 XP</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-400 mb-1">Extrême</p>
                  <p className="text-red-400 font-bold">100 XP</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3 text-center">
                * Multiplié par la durée (15min: x1, 30min: x1.5, 1h: x2, 2h: x3, 4h: x4)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestExpressBlock;
