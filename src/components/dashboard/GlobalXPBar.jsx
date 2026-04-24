/**
 * Barre XP Globale pour le Dashboard
 * Affiche l'XP totale cumulée de tous les onglets avec détail par catégorie
 */

import React from 'react';
import { Star, Target, BookOpen, Apple, Dumbbell, Ban, Github } from 'lucide-react';
import { useGlobalXP } from '../../hooks/useGlobalXP';

const GlobalXPBar = ({ onCategoryClick = null }) => {
  const { totalXP, level, xpByCategory, progress, categoryLevels } = useGlobalXP();
  const categories = [
    { key: 'quests', label: 'Quêtes', icon: Target },
    { key: 'learning', label: 'Apprentissage', icon: BookOpen },
    { key: 'nutrition', label: 'Nutrition', icon: Apple },
    { key: 'books', label: 'Livres', icon: BookOpen },
    { key: 'sport', label: 'Sport', icon: Dumbbell },
    { key: 'addictionQuit', label: 'Arrêt addiction', icon: Ban },
    { key: 'code', label: 'Code / GitHub', icon: Github },
  ];

  /* Icônes : déclinaisons rose / orange / or (même spectre que .time-main) */
  const categoryIconClass = (key) => {
    switch (key) {
      case 'quests':
        return 'text-[#ff1493]';
      case 'learning':
        return 'text-[#ff69b4]';
      case 'nutrition':
        return 'text-[#ffb347]';
      case 'books':
        return 'text-[#ff8c00]';
      case 'sport':
        return 'text-[#ffa500]';
      case 'addictionQuit':
        return 'text-[#ffd700]';
      case 'code':
        return 'text-[#ff7f9f]';
      default:
        return 'text-[#ffd700]';
    }
  };

  return (
    <div
      className="relative mb-6 overflow-hidden rounded-xl border-2 border-[#ffd700]/45 p-6 shadow-[0_0_28px_rgba(255,215,0,0.2),inset_0_0_16px_rgba(255,215,0,0.06)]"
      style={{
        background:
          'linear-gradient(135deg, rgba(255, 20, 147, 0.16) 0%, rgba(255, 140, 0, 0.12) 50%, rgba(255, 215, 0, 0.16) 100%)',
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="rounded-lg border border-[#ffd700]/45 p-2"
            style={{ background: 'rgba(255, 215, 0, 0.12)' }}
          >
            <Star className="h-6 w-6 text-[#ffd700] drop-shadow-[0_0_6px_rgba(255,215,0,0.6)]" />
          </div>
          <div>
            <h3 className="bg-gradient-to-b from-[#ff1493] via-[#ff8c00] to-[#ffd700] bg-clip-text text-xl font-bold text-transparent">
              Niveau {level}
            </h3>
            <p className="text-sm text-slate-300">{totalXP.toLocaleString('fr-FR')} XP total</p>
            <p className="mt-0.5 text-xs text-slate-400">
              Sur ce niveau :{' '}
              <span className="font-semibold tabular-nums text-[#ffd700]">
                {(progress.xpOnLevel ?? 0).toLocaleString('fr-FR')}
              </span>
              <span className="text-slate-500"> / </span>
              <span className="tabular-nums text-slate-300">
                {(progress.xpForLevel ?? 0).toLocaleString('fr-FR')}
              </span>{' '}
              <span className="text-slate-500">XP</span>
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-slate-400">Prochain niveau</div>
          <div className="text-lg font-bold text-[#ffd700] drop-shadow-[0_0_8px_rgba(255,215,0,0.35)]">
            {progress.xpNeeded} XP
          </div>
        </div>
      </div>

      {/* Barre de progression — même dégradé que .time-main */}
      <div className="mb-4">
        <div className="h-4 w-full overflow-hidden rounded-full bg-slate-900/70 ring-1 ring-[#ffd700]/25">
          <div
            className="h-full transition-all duration-500"
            style={{
              width: `${Math.min(100, Math.max(0, progress.percent))}%`,
              background: 'linear-gradient(90deg, #ff1493 0%, #ff8c00 50%, #ffd700 100%)',
              boxShadow: '0 0 12px rgba(255, 20, 147, 0.45)',
            }}
          />
        </div>
      </div>
      
      {/* Détail par catégorie */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        {categories.map((category) => {
          const Icon = category.icon;
          const xp = xpByCategory[category.key] || 0;
          const percent = totalXP > 0 ? (xp / totalXP) * 100 : 0;
          const iconColor = categoryIconClass(category.key);
          const catLevel = categoryLevels?.[category.key] ?? 1;

          return (
            <button
              key={category.key}
              type="button"
              onClick={() => {
                if (typeof onCategoryClick === 'function') onCategoryClick(category.key);
              }}
              className="w-full rounded-lg border border-[#ffd700]/25 bg-black/30 p-3 text-left transition hover:border-[#ff8c00]/50 hover:bg-[rgba(255,20,147,0.1)] hover:shadow-[0_0_12px_rgba(255,215,0,0.12)]"
            >
              <div className="mb-2 flex items-center gap-2">
                <Icon className={`h-4 w-4 ${iconColor}`} />
                <span className="text-xs text-slate-400">{category.label}</span>
              </div>
              <p className="mb-1 text-[11px] font-semibold tabular-nums text-[#ffd700]/90">
                Niveau {catLevel}
              </p>
              <div className="text-lg font-bold text-white">{xp.toLocaleString('fr-FR')}</div>
              <div className="text-xs text-slate-500">{percent.toFixed(1)}%</div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GlobalXPBar;
