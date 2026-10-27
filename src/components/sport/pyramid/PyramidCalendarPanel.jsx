import React, { useMemo, useState } from 'react';
import { useWorkout } from '../../../context/WorkoutContext';
import {
  DefisCalendarGrid,
  DefisCalendarRecap
} from '../../tabs/EnduranceTab/components/ui/DefisCalendar.jsx';

const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

function toDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function collectPyramidActivityByDate(data) {
  const map = new Map();
  const log = Array.isArray(data?.pyramidSessionLog) ? data.pyramidSessionLog : [];
  for (const row of log) {
    const d = String(row?.dateStr || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) continue;
    const cur = map.get(d) || { sessions: 0, planned: 0 };
    cur.sessions += 1;
    map.set(d, cur);
  }
  const dv = data?.dailyVariations && typeof data.dailyVariations === 'object' ? data.dailyVariations : {};
  for (const [d, v] of Object.entries(dv)) {
    const n =
      v?.exerciseTrainingPatterns && typeof v.exerciseTrainingPatterns === 'object'
        ? Object.keys(v.exerciseTrainingPatterns).length
        : 0;
    if (!n) continue;
    const cur = map.get(d) || { sessions: 0, planned: 0 };
    cur.planned += n;
    map.set(d, cur);
  }
  return map;
}

const PyramidCalendarPanel = () => {
  const { getCurrentData, data } = useWorkout();
  const live = typeof getCurrentData === 'function' ? getCurrentData() : data;
  const byDate = useMemo(() => collectPyramidActivityByDate(live), [live]);

  const [selectedYear, setSelectedYear] = useState(() => new Date().getFullYear());
  const [viewMode, setViewMode] = useState('annee');
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(() => new Date().getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState(null);

  const maxScore = useMemo(() => {
    let max = 1;
    byDate.forEach((v) => {
      const score = (v.sessions || 0) * 2 + (v.planned || 0);
      if (score > max) max = score;
    });
    return max;
  }, [byDate]);

  const recapCards = useMemo(() => {
    const now = new Date();
    const agg = (start, end) => {
      let sessions = 0;
      let planned = 0;
      let active = 0;
      let numDays = 0;
      const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      while (cur <= end) {
        const v = byDate.get(toDateKey(cur));
        if (v && (v.sessions || v.planned)) {
          sessions += v.sessions || 0;
          planned += v.planned || 0;
          active += 1;
        }
        numDays += 1;
        cur.setDate(cur.getDate() + 1);
      }
      return { sessions, planned, active, numDays };
    };
    const ws = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
    return [
      { key: 'week', title: 'Semaine en cours', ...agg(ws, new Date(ws.getFullYear(), ws.getMonth(), ws.getDate() + 6)) },
      {
        key: 'month',
        title: 'Mois en cours',
        ...agg(new Date(now.getFullYear(), now.getMonth(), 1), new Date(now.getFullYear(), now.getMonth() + 1, 0))
      },
      { key: 'year', title: `Année ${selectedYear}`, ...agg(new Date(selectedYear, 0, 1), new Date(selectedYear, 11, 31)) }
    ].map((p) => ({
      key: p.key,
      title: p.title,
      rows: [
        { label: 'Séances / jour', value: (p.numDays ? p.sessions / p.numDays : 0).toFixed(2) },
        { label: 'Plans du jour / jour', value: (p.numDays ? p.planned / p.numDays : 0).toFixed(2) }
      ],
      si: `Si actif : ${(p.active ? p.sessions / p.active : 0).toFixed(2)} séances/jour actif`
    }));
  }, [byDate, selectedYear]);

  const scoreOf = (key) => {
    const v = byDate.get(key) || { sessions: 0, planned: 0 };
    return (v.sessions || 0) * 2 + (v.planned || 0);
  };

  const selectedDetail = selectedDateKey ? byDate.get(selectedDateKey) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
      <DefisCalendarRecap
        hint="Moyennes = total sur la période ÷ nombre de jours calendaires (semaine = lun–dim, mois = mois civil, année = année affichée sous le calendrier). La ligne « si actif » divise par les jours où tu as au moins une séance ou un plan pyramide."
        cards={recapCards}
      />
      <DefisCalendarGrid
        year={selectedYear}
        viewMode={viewMode}
        modes={[
          { id: 'mois', label: 'Mois' },
          { id: 'annee', label: 'Année' }
        ]}
        onViewMode={setViewMode}
        monthIndex={selectedMonthIndex}
        monthNames={MONTHS_FR}
        onPrev={() => setSelectedYear((y) => y - 1)}
        onNext={() => setSelectedYear((y) => y + 1)}
        onMonthTitleClick={(monthIdx) => {
          setSelectedMonthIndex(monthIdx);
          setViewMode('mois');
        }}
        levelOf={(key) => {
          const score = scoreOf(key);
          if (score === 0) return 0;
          const normalized = maxScore > 0 ? score / maxScore : 0;
          return Math.min(4, Math.max(1, Math.ceil(normalized * 4)));
        }}
        countOf={(key) => {
          const v = byDate.get(key);
          return v ? (v.sessions || 0) + (v.planned || 0) : 0;
        }}
        unitLabel={(n) => (n > 1 ? 'pyramides' : 'pyramide')}
        legend="Intensité = séances pyramide enregistrées (×2) + plans du jour (variation) sur la date."
        selectedDateKey={selectedDateKey}
        onDayClick={(key, monthIdx) => {
          setSelectedDateKey(key);
          setSelectedMonthIndex(monthIdx);
          setViewMode('mois');
        }}
        dayTitle={(key) => {
          const v = byDate.get(key) || { sessions: 0, planned: 0 };
          return `${key} · ${v.sessions} séance(s) · ${v.planned} plan(s) jour`;
        }}
        detail={
          <>
            {selectedDateKey ? `Détail du ${selectedDateKey}` : 'Clique sur une case'}
            {!selectedDateKey ? (
              <div className="dr">
                <span>Choisis une date dans la grille.</span>
              </div>
            ) : (
              <>
                <div className="dr">
                  <span>Séances pyramide enregistrées</span>
                  <b className="num">{selectedDetail?.sessions ?? 0}</b>
                </div>
                <div className="dr">
                  <span>Plans pyramide (variation du jour)</span>
                  <b className="num">{selectedDetail?.planned ?? 0}</b>
                </div>
              </>
            )}
          </>
        }
      />
    </div>
  );
};

export default PyramidCalendarPanel;
