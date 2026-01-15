/**
 * Barre XP Livres
 */

import React from 'react';
import { BookOpen, FileText, TrendingUp } from 'lucide-react';
import { useBooksXP } from '../../../../hooks/useBooksXP';

const BooksXPBar = () => {
  const { totalXP, level, breakdown, progress } = useBooksXP();

  return (
    <div className="bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border border-indigo-500/30 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" />
          <span className="font-semibold text-white">Niveau {level}</span>
        </div>
        <span className="text-sm text-slate-300">{totalXP.toLocaleString('fr-FR')} XP</span>
      </div>

      <div className="w-full bg-slate-700 rounded-full h-2 mb-3">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
          style={{ width: `${Math.min(100, Math.max(0, progress.percent))}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="flex items-center gap-1">
          <FileText className="w-3 h-3 text-indigo-400" />
          <span className="text-slate-400">{breakdown.sessions} sessions</span>
        </div>
        <div className="flex items-center gap-1">
          <BookOpen className="w-3 h-3 text-indigo-400" />
          <span className="text-slate-400">{breakdown.pages} pages</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-indigo-400" />
          <span className="text-slate-400">{breakdown.pagesPerHour.toFixed(1)} p/h</span>
        </div>
      </div>
    </div>
  );
};

export default BooksXPBar;
