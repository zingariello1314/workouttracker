import React, { useMemo, useState } from 'react';
import { Edit3 } from 'lucide-react';
import { DefisCalendarGrid, DefisCalendarRecap } from './ui/DefisCalendar.jsx';
import { parseDurationToMinutes } from '../../../../utils/calendarUtils';

const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
function toDateKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildSessionRows(sessions = {}, filter = 'all') {
  const rows = [];
  const push = (type, list, mapFn) => {
    (Array.isArray(list) ? list : []).forEach((s, index) => {
      if (!s?.date) return;
      if (filter !== 'all' && filter !== type) return;
      rows.push(mapFn(s, index));
    });
  };

  push('boxing', sessions.boxing, (s, idx) => ({
    type: 'boxing',
    id: s.id,
    originalIndex: idx,
    date: String(s.date),
    time: String(s.time || ''),
    title: 'Boxe',
    durationMin: Math.max(0, Number(s.duration) || 0),
    details: `${Math.max(0, Number(s.duration) || 0)} min`
  }));
  push('pushups', sessions.pushups, (s, idx) => ({
    type: 'pushups',
    id: s.id,
    originalIndex: idx,
    date: String(s.date),
    time: String(s.time || ''),
    title: 'Pompes',
    durationMin: parseDurationToMinutes(s.duration, 'EnduranceCalendarModernPanel.pushups') || 0,
    details: `${Number(s.count || 0)} reps`
  }));
  push('swimming', sessions.swimming, (s, idx) => ({
    type: 'swimming',
    id: s.id,
    originalIndex: idx,
    date: String(s.date),
    time: String(s.time || ''),
    title: 'Natation',
    durationMin: Math.max(0, Number(s.totalTime || 0) / 60),
    details: `${Number(s.totalDistance || 0)} m`
  }));
  push('jumprope', sessions.jumprope, (s, idx) => ({
    type: 'jumprope',
    id: s.id,
    originalIndex: idx,
    date: String(s.date),
    time: String(s.time || ''),
    title: 'Corde',
    durationMin: parseDurationToMinutes(s.duration, 'EnduranceCalendarModernPanel.jumprope') || 0,
    details: `${Number(s.jumps || 0)} sauts`
  }));
  push('gainage', sessions.gainage, (s, idx) => ({
    type: 'gainage',
    id: s.id,
    originalIndex: idx,
    date: String(s.date),
    time: String(s.time || ''),
    title: 'Gainage',
    durationMin: Math.max(0, Number(s.duration) || 0),
    details: `${Number(s.count || 0)} sec`
  }));
  push('running', sessions.running, (s, idx) => ({
    type: 'running',
    id: s.id,
    originalIndex: idx,
    date: String(s.date),
    time: String(s.time || ''),
    title: 'Course / Marche',
    durationMin: parseDurationToMinutes(s.duration, 'EnduranceCalendarModernPanel.running') || 0,
    details: `${Number(s.distance || 0)} km`
  }));

  return rows;
}

export default function EnduranceCalendarModernPanel({
  sessions = {},
  selectedYear,
  selectedActivityFilter,
  onYearChange,
  onActivityFilterChange,
  onEditSession
}) {
  const [viewMode, setViewMode] = useState('annee');
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(new Date().getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState(null);

  const rows = useMemo(() => buildSessionRows(sessions, selectedActivityFilter), [sessions, selectedActivityFilter]);

  const byDate = useMemo(() => {
    const map = new Map();
    rows.forEach((r) => {
      const list = map.get(r.date) || [];
      list.push(r);
      map.set(r.date, list);
    });
    return map;
  }, [rows]);

  const maxScore = useMemo(() => {
    let max = 1;
    byDate.forEach((list) => {
      const count = list.length;
      const score = count;
      if (score > max) max = score;
    });
    return max;
  }, [byDate]);

  const selectedRows = selectedDateKey ? (byDate.get(selectedDateKey) || []) : [];

  const yearStats = useMemo(() => {
    const activeDays = new Set(rows.map((r) => r.date)).size;
    const totalDuration = rows.reduce((sum, r) => sum + Number(r.durationMin || 0), 0);
    return {
      sessions: rows.length,
      activeDays,
      totalDuration: Math.round(totalDuration)
    };
  }, [rows]);

  const recap = useMemo(() => {
    const now = new Date();
    const countOn = (key) => (byDate.get(key) || []).length;
    const period = (start, end) => {
      let total = 0;
      let active = 0;
      let numDays = 0;
      const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      while (cur <= end) {
        const c = countOn(toDateKey(cur));
        total += c;
        if (c > 0) active += 1;
        numDays += 1;
        cur.setDate(cur.getDate() + 1);
      }
      return { total, active, numDays };
    };
    const ws = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
    const we = new Date(ws.getFullYear(), ws.getMonth(), ws.getDate() + 6);
    const dates = Array.from(byDate.keys()).sort();
    let best = null;
    dates.forEach((k) => {
      if (!best || countOn(k) > countOn(best)) best = k;
    });
    let longest = 0;
    let longestEnd = null;
    let run = 0;
    let prev = null;
    dates.forEach((k) => {
      const d = new Date(`${k}T12:00:00`);
      run = prev && Math.round((d - prev) / 86400000) === 1 ? run + 1 : 1;
      if (run > longest) {
        longest = run;
        longestEnd = k;
      }
      prev = d;
    });
    let current = 0;
    const t = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    while (countOn(toDateKey(t)) > 0) {
      current += 1;
      t.setDate(t.getDate() - 1);
    }
    return {
      week: period(ws, we),
      month: period(new Date(now.getFullYear(), now.getMonth(), 1), new Date(now.getFullYear(), now.getMonth() + 1, 0)),
      year: period(new Date(selectedYear, 0, 1), new Date(selectedYear, 11, 31)),
      best,
      bestCount: best ? countOn(best) : 0,
      longest,
      longestEnd,
      current
    };
  }, [byDate, selectedYear]);

  const fmtDay = (key) => {
    const [y, m, d] = String(key).split('-').map(Number);
    return `${d} ${MONTHS_FR[m - 1].toLowerCase()} ${y}`;
  };

  const cards = [
    { key: 'week', title: 'Semaine en cours', data: recap.week },
    { key: 'month', title: 'Mois en cours', data: recap.month },
    { key: 'year', title: `Année ${selectedYear}`, data: recap.year }
  ].map((c) => ({
    key: c.key,
    title: c.title,
    rows: [{ label: 'Séances / jour', value: (c.data.numDays ? c.data.total / c.data.numDays : 0).toFixed(2) }],
    si: `Si actif : ${(c.data.active ? c.data.total / c.data.active : 0).toFixed(2)} séances/jour actif`
  }));

  const facts = [
    { label: 'Total activités', value: yearStats.sessions },
    { label: 'Jours actifs', value: yearStats.activeDays },
    { label: 'Temps cumulé', value: `${yearStats.totalDuration} min` },
    {
      label: 'Jour avec le plus de séances',
      value: recap.best ? fmtDay(recap.best) : '—',
      sub: recap.best ? `(${recap.bestCount})` : null
    },
    {
      label: 'Plus longue série (jours consécutifs avec ≥1 séance)',
      value: `${recap.longest} jours`,
      sub: recap.longestEnd ? `(${fmtDay(recap.longestEnd)})` : '(aucune série)'
    },
    {
      label: 'Série en cours (depuis aujourd’hui)',
      value: recap.current,
      sub: recap.current ? '(jours consécutifs)' : '(aucune séance aujourd’hui)'
    }
  ];

  const levelOf = (key) => {
    const count = (byDate.get(key) || []).length;
    if (count === 0) return 0;
    const normalized = maxScore > 0 ? count / maxScore : 0;
    return Math.min(4, Math.max(1, Math.ceil(normalized * 4)));
  };

  const detail = (
    <>
      {selectedDateKey ? `Détails du ${selectedDateKey}` : 'Clique sur une case pour voir les détails'}
      {selectedDateKey && selectedRows.length === 0 ? (
        <div className="dr">
          <span>Aucune activité ce jour.</span>
        </div>
      ) : null}
      {selectedRows
        .slice()
        .sort((a, b) => String(a.time || '').localeCompare(String(b.time || '')))
        .map((row) => (
          <div key={`${row.type}-${row.id}-${row.originalIndex}`} className="dr">
            <div>
              <b>{row.title}</b>{' '}
              <span>
                {row.time ? `${row.time} · ` : ''}
                {row.details} · {Math.round(Number(row.durationMin || 0))} min
              </span>
            </div>
            <button type="button" className="btn sm" onClick={() => onEditSession?.(row.type, row.id)}>
              <Edit3 className="ic" style={{ width: 14, height: 14 }} />
              Modifier
            </button>
          </div>
        ))}
    </>
  );

  return (
    <div>
      <header className="head">
        <div>
          <div className="kicker">Défis / Calendrier</div>
          <h1>Calendrier</h1>
          <p>Toutes tes activités au même endroit</p>
        </div>
      </header>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 48, paddingTop: 20 }}>
        <DefisCalendarRecap
          hint="Moyennes = total sur la période ÷ nombre de jours calendaires (semaine = lun–dim, mois = mois civil, année = année affichée sous le calendrier). La ligne « si actif » divise par les jours où tu as au moins une séance."
          cards={cards}
          facts={facts}
        />
        <DefisCalendarGrid
          year={selectedYear}
          viewMode={viewMode}
          modes={[
            { id: 'mois', label: 'Mois' },
            { id: 'annee', label: 'Année' },
            { id: 'streaks', label: 'Streaks' }
          ]}
          onViewMode={setViewMode}
          monthIndex={selectedMonthIndex}
          monthNames={MONTHS_FR}
          onPrev={() => onYearChange?.(selectedYear - 1)}
          onNext={() => onYearChange?.(selectedYear + 1)}
          onMonthTitleClick={(monthIdx) => {
            setSelectedMonthIndex(monthIdx);
            setViewMode('mois');
          }}
          levelOf={levelOf}
          countOf={(key) => (byDate.get(key) || []).length}
          unitLabel={(n) => (n > 1 ? 'séances' : 'séance')}
          legend="Intensité = uniquement le nombre de sessions Défis enregistrées par jour."
          selectedDateKey={selectedDateKey}
          onDayClick={(key, monthIdx) => {
            setSelectedDateKey(key);
            setSelectedMonthIndex(monthIdx);
            setViewMode('mois');
          }}
          dayTitle={(key, count) => `${key} · ${count} session(s)`}
          detail={detail}
          toolbar={
            <label className="fld" style={{ minWidth: 220 }}>
              <select
                value={selectedActivityFilter}
                onChange={(e) => onActivityFilterChange?.(e.target.value)}
                aria-label="Discipline"
              >
                <option value="all">Toutes disciplines</option>
                <option value="boxing">Boxe</option>
                <option value="pushups">Pompes</option>
                <option value="swimming">Natation</option>
                <option value="jumprope">Corde</option>
                <option value="gainage">Gainage</option>
                <option value="running">Course / Marche</option>
              </select>
            </label>
          }
        />
      </div>
    </div>
  );
}
