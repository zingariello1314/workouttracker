/**
 * Barre XP Globale pour le Dashboard
 * Affiche l'XP totale cumulée de tous les onglets avec détail par catégorie
 */

import React from 'react';
import { Star, Target, BookOpen, Apple, Dumbbell, Ban, Github } from 'lucide-react';
import { useGlobalXP } from '../../hooks/useGlobalXP';

const GlobalXPBar = () => {
  const { totalXP, level, xpByCategory, progress } = useGlobalXP();
  const categories = [
    { key: 'quests', label: 'Quêtes', icon: Target, color: 'purple' },
    { key: 'learning', label: 'Apprentissage', icon: BookOpen, color: 'blue' },
    { key: 'nutrition', label: 'Nutrition', icon: Apple, color: 'green' },
    { key: 'books', label: 'Livres', icon: BookOpen, color: 'indigo' },
    { key: 'sport', label: 'Sport', icon: Dumbbell, color: 'red' },
    { key: 'addictionQuit', label: 'Arrêt addiction', icon: Ban, color: 'amber' },
    { key: 'code', label: 'Code / GitHub', icon: Github, color: 'rose' },
  ];
  
  return (
    <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/30 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Star className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Niveau {level}</h3>
            <p className="text-sm text-slate-400">{totalXP.toLocaleString('fr-FR')} XP total</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-400">Prochain niveau</div>
          <div className="text-lg font-bold text-white">{progress.xpNeeded} XP</div>
        </div>
      </div>
      
      {/* Barre de progression principale */}
      <div className="mb-4">
        <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, progress.percent))}%` }}
          />
        </div>
      </div>
      
      {/* Détail par catégorie */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        {categories.map((category) => {
          const Icon = category.icon;
          const xp = xpByCategory[category.key] || 0;
          const percent = totalXP > 0 ? (xp / totalXP) * 100 : 0;
          const iconColor =
            category.key === 'code'
              ? 'text-rose-400'
              : category.key === 'addictionQuit'
                ? 'text-amber-400'
                : category.key === 'quests'
                  ? 'text-purple-400'
                  : category.key === 'learning'
                    ? 'text-blue-400'
                    : category.key === 'nutrition'
                      ? 'text-green-400'
                      : category.key === 'books'
                        ? 'text-indigo-400'
                        : 'text-red-400';

          return (
            <div
              key={category.key}
              className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50"
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${iconColor}`} />
                <span className="text-xs text-slate-400">{category.label}</span>
              </div>
              <div className="text-lg font-bold text-white">{xp.toLocaleString('fr-FR')}</div>
              <div className="text-xs text-slate-500">{percent.toFixed(1)}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GlobalXPBar;
