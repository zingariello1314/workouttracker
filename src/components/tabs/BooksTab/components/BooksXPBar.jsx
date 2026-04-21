/**
 * Barre XP Livres
 */

import React from 'react';
import { BookOpen, FileText, TrendingUp } from 'lucide-react';
import { useBooksXP } from '../../../../hooks/useBooksXP';

const BooksXPBar = () => {
  const { totalXP, level, breakdown, progress } = useBooksXP();

  return (
    <div className="rounded-xl border-2 border-[#3A86FF] bg-black p-4 shadow-md shadow-black/40">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-sky-300" />
          <span className="font-semibold text-sky-100">Niveau {level}</span>
        </div>
        <span className="text-sm text-sky-200/90">{totalXP.toLocaleString('fr-FR')} XP</span>
      </div>

      <div className="w-full rounded-full h-2.5 mb-3 bg-black border border-[#3A86FF]/45 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#2563eb] via-[#3A86FF] to-[#60a5fa] transition-all shadow-[0_0_10px_rgba(58,134,255,0.35)]"
          style={{ width: `${Math.min(100, Math.max(0, progress.percent))}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="flex items-center gap-1">
          <FileText className="w-3 h-3 shrink-0 text-sky-300" />
          <span className="text-sky-200/85">{breakdown.sessions} sessions</span>
        </div>
        <div className="flex items-center gap-1">
          <BookOpen className="w-3 h-3 shrink-0 text-sky-300" />
          <span className="text-sky-200/85">{breakdown.pages} pages</span>
        </div>
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3 shrink-0 text-sky-300" />
          <span className="text-sky-200/85">{breakdown.pagesPerHour.toFixed(1)} p/h</span>
        </div>
      </div>
    </div>
  );
};

export default BooksXPBar;
