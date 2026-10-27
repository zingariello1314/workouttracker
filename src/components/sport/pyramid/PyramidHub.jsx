import React, { useState } from 'react';
import PyramidGeneratorPanel from './PyramidGeneratorPanel.jsx';
import PyramidCalendarPanel from './PyramidCalendarPanel.jsx';
import PyramidStatsPanel from './PyramidStatsPanel.jsx';

const TABS = [
  { id: 'generator', label: 'Générateur' },
  { id: 'calendar', label: 'Calendrier' },
  { id: 'stats', label: 'Statistiques' }
];

/**
 * Hub Pyramide v3 : générateur, calendrier (style Défis endurance), statistiques.
 */
const PyramidHub = () => {
  const [tab, setTab] = useState('generator');

  return (
    <div>
      <header className="head">
        <div>
          <div className="kicker">Défis / Pyramide</div>
          <h1>Pyramide</h1>
        </div>
      </header>
      <div className="defis-tabs" role="tablist">
        {TABS.map((x) => (
          <button key={x.id} type="button" role="tab" aria-selected={tab === x.id} onClick={() => setTab(x.id)}>
            {x.label}
          </button>
        ))}
      </div>

      {tab === 'generator' && <PyramidGeneratorPanel />}
      {tab === 'calendar' && <PyramidCalendarPanel />}
      {tab === 'stats' && <PyramidStatsPanel />}
    </div>
  );
};

export default PyramidHub;
