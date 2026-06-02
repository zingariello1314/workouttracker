import React from 'react';
import { ChevronRight } from 'lucide-react';

/**
 * Liste type Garmin Connect (activités, sommeil, FC, pas…).
 * @param {{ rows: Array<{ id: string, iconBg: string, icon: string, title: string, subtitle: string }> }} props
 */
export default function CalendarGarminDayRecap({ rows }) {
  if (!Array.isArray(rows) || rows.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-600/50 bg-[#0a0a0a]">
      {rows.map((row, index) => (
        <div
          key={row.id}
          className={`flex items-center gap-3 px-4 py-3.5 ${
            index < rows.length - 1 ? 'border-b border-slate-700/60' : ''
          }`}
        >
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg"
            style={{ backgroundColor: row.iconBg }}
            aria-hidden
          >
            {row.icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-medium text-white">{row.title}</div>
            <div className="truncate text-sm text-slate-400">{row.subtitle}</div>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-slate-500" aria-hidden />
        </div>
      ))}
    </div>
  );
}
