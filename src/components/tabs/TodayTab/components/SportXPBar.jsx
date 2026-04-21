/**
 * Barre XP Sport
 */

import React from 'react';
import { Dumbbell, Flame, Footprints, Target, CheckCircle, Trophy, Map, ListOrdered } from 'lucide-react';
import { useSportXP } from '../../../../hooks/useSportXP';

const SportXPBar = () => {
  const { totalXP, level, breakdown, progress } = useSportXP();

  return (
    <div className="rounded-xl border-2 border-blue-500/55 bg-black p-4 shadow-lg shadow-black/40">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5 text-sky-400" />
          <span className="font-semibold text-sky-50">Niveau {level}</span>
        </div>
        <span className="text-sm text-sky-300/90">{totalXP.toLocaleString('fr-FR')} XP</span>
      </div>

      <div className="mb-3 h-2.5 w-full overflow-hidden rounded-full border border-blue-500/40 bg-black">
        <div
          className="h-full bg-gradient-to-r from-blue-700 via-cyan-700 to-emerald-700 transition-all"
          style={{ width: `${Math.min(100, Math.max(0, progress.percent))}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8">
        <div className="flex items-center gap-1">
          <Dumbbell className="h-3 w-3 shrink-0 text-sky-400" />
          <span className="text-sky-400/95">{breakdown.reps.toLocaleString('fr-FR')} reps</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3 shrink-0 text-sky-400" />
          <span className="text-sky-400/95">{breakdown.exercises} exercices</span>
        </div>
        <div className="flex items-center gap-1">
          <Flame className="h-3 w-3 shrink-0 text-[#e85d4c]" />
          <span className="text-sky-400/95">{breakdown.calories.toLocaleString('fr-FR')} cal</span>
        </div>
        <div className="flex items-center gap-1">
          <Footprints className="h-3 w-3 shrink-0 text-sky-400" />
          <span className="text-sky-400/95">{breakdown.steps.toLocaleString('fr-FR')} pas</span>
        </div>
        <div className="flex items-center gap-1">
          <Target className="h-3 w-3 shrink-0 text-sky-400" />
          <span className="text-sky-400/95">{breakdown.challenges} défis</span>
        </div>
        <div className="flex flex-col gap-0.5 sm:col-span-2 lg:col-span-3">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <div className="flex items-center gap-1">
              <Trophy className="h-3 w-3 shrink-0 text-amber-300" />
              <span className="text-sky-400/95">
                {(breakdown.runningTrophies ?? 0).toLocaleString('fr-FR')} XP trophées course
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Map className="h-3 w-3 shrink-0 text-emerald-400/90" />
              <span className="text-sky-400/95">
                {(breakdown.runningTotalDistanceKm ?? 0).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} km
                cumul
              </span>
            </div>
            <div className="flex items-center gap-1">
              <ListOrdered className="h-3 w-3 shrink-0 text-teal-400/90" />
              <span className="text-sky-400/95">
                {(breakdown.runningSessionCount ?? 0).toLocaleString('fr-FR')} sorties course
              </span>
            </div>
          </div>
          <span className="pl-4 text-[10px] leading-tight text-slate-500">
            {(breakdown.runningTrophyTiers ?? 0).toLocaleString('fr-FR')} paliers ·{' '}
            {(breakdown.runningTrophiesUnlocked ?? 0).toLocaleString('fr-FR')} trophées avec au moins un palier
          </span>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
            <div className="flex items-center gap-1">
              <Trophy className="h-3 w-3 shrink-0 text-violet-300" />
              <span className="text-sky-400/95">
                {(breakdown.jumpRopeTrophies ?? 0).toLocaleString('fr-FR')} XP trophées corde
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="h-3 w-3 shrink-0 text-cyan-300" />
              <span className="text-sky-400/95">
                {(breakdown.gainageTrophies ?? 0).toLocaleString('fr-FR')} XP trophées gainage
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="h-3 w-3 shrink-0 text-rose-300" />
              <span className="text-sky-400/95">
                {(breakdown.pushupTrophies ?? 0).toLocaleString('fr-FR')} XP trophées pompes
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SportXPBar;
