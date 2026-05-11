import React, { useState } from 'react';
import { Layers, CalendarDays, BarChart3 } from 'lucide-react';
import PyramidGeneratorPanel from './PyramidGeneratorPanel.jsx';
import PyramidCalendarPanel from './PyramidCalendarPanel.jsx';
import PyramidStatsPanel from './PyramidStatsPanel.jsx';

/**
 * Hub Pyramide v3 : générateur, calendrier (style Défis endurance), statistiques.
 */
const PyramidHub = () => {
  const [tab, setTab] = useState('generator');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#0F4C5C]/55 bg-black p-2 w-fit">
        <button
          type="button"
          onClick={() => setTab('generator')}
          className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium ${
            tab === 'generator' ? 'bg-[#0F5C45]/35 text-white border border-[#0F5C45]/55' : 'text-slate-300'
          }`}
        >
          <Layers className="h-3.5 w-3.5 opacity-90" />
          Générateur
        </button>
        <button
          type="button"
          onClick={() => setTab('calendar')}
          className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium ${
            tab === 'calendar' ? 'bg-[#0F5C45]/35 text-white border border-[#0F5C45]/55' : 'text-slate-300'
          }`}
        >
          <CalendarDays className="h-3.5 w-3.5 opacity-90" />
          Calendrier
        </button>
        <button
          type="button"
          onClick={() => setTab('stats')}
          className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium ${
            tab === 'stats' ? 'bg-[#0F5C45]/35 text-white border border-[#0F5C45]/55' : 'text-slate-300'
          }`}
        >
          <BarChart3 className="h-3.5 w-3.5 opacity-90" />
          Statistiques
        </button>
      </div>

      {tab === 'generator' && <PyramidGeneratorPanel />}
      {tab === 'calendar' && <PyramidCalendarPanel />}
      {tab === 'stats' && <PyramidStatsPanel />}
    </div>
  );
};

export default PyramidHub;
