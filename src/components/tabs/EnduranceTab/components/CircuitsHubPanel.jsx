/**
 * CircuitsHubPanel — hub Défis > Circuits.
 *
 * Liaisons garanties (bidirectionnelles, déjà plombées dans `WorkoutContext`) :
 *   - Création/édition d'un circuit (ici ou depuis Programme) → `data.circuitDefinitions`
 *     (bibliothèque globale unique). Visible immédiatement dans Programme + Hub + "Aujourd'hui".
 *   - Assignation à un jour → `program.schedule[day].circuitIds`. Visible dans Programme,
 *     dans "Aujourd'hui" (jour actif), et listée ci-dessous dans la sous-vue Sessions.
 *   - Suppression définition → nettoyage de toutes les références programmes
 *     + de `circuitProgress` (XP recalculée).
 *   - L'XP utilise `data.circuitProgress` × `data.circuitDefinitions` via
 *     `circuitsXpService` (cache invalidé par `useSportXP` via checksums).
 *
 * Style aligné sur la charte sport (PushupTrophiesPanel / EnduranceCalendarModernPanel) :
 *   - panneau principal `rounded-2xl border-2 border-[#0F4C5C]/70 bg-black p-6`
 *   - sections `rounded-2xl border border-[#0F4C5C]/55 bg-black p-5`
 *   - inputs `rounded-xl border border-[#0F4C5C]/50 bg-black ... focus:ring-[#0F5C45]/40`
 *   - heatmap : même palette que le calendrier endurance
 *
 * Calendrier : vue année par défaut (12 mini-mois). Clic sur un jour →
 * bascule auto vers la vue mois sur le mois ciblé (comme Pompes/Course).
 */

import React, { useMemo, useState } from 'react';
import { Repeat, Plus, Trash2, Edit3, Layers, Sparkles, Search, Link2, Unlink } from 'lucide-react';
import { useWorkout } from '../../../../context/WorkoutContext';
import CircuitEditor from '../../../circuits/CircuitEditor';
import {
  listCircuits,
  getCircuitDailyHistory,
  getCircuitProgramAssignments
} from '../../../../utils/circuits/circuitDefinitionUtils';
import { computeCircuitsXp, computeCircuitXpForDay } from '../../../../services/xp/circuitsXpService';
import { evaluateCircuitTrophies } from '../../../../services/circuits/circuitTrophiesService';
import { getDateStr } from '../../../../utils/dateUtils';
import EnduranceDisciplineStatsPanel from '../../../sport/charts/EnduranceDisciplineStatsPanel.jsx';
import { DefisCalendarGrid, DefisCalendarRecap } from './ui/DefisCalendar.jsx';

const SUB_VIEWS = [
  { id: 'sessions', label: 'Sessions' },
  { id: 'stats', label: 'Statistiques' },
  { id: 'calendar', label: 'Calendrier' },
  { id: 'trophies', label: 'Trophées' }
];

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];
const DAY_LABELS = {
  lundi: 'Lundi',
  mardi: 'Mardi',
  mercredi: 'Mercredi',
  jeudi: 'Jeudi',
  vendredi: 'Vendredi',
  samedi: 'Samedi',
  dimanche: 'Dimanche'
};

const computeHeatmapLevel = (entry) => {
  if (!entry) return 0;
  if ((entry.completedCircuits || 0) >= 1 && (entry.tripleAchievedCount || 0) >= 1) return 4;
  if ((entry.completedCircuits || 0) >= 1) return 3;
  if ((entry.totalRounds || 0) >= 3) return 2;
  if ((entry.totalRounds || 0) >= 1) return 1;
  return 0;
};

const enrichDailyHistory = (history, circuitProgress, circuitDefinitions) => {
  return history.map((d) => {
    const day = circuitProgress?.[d.date] || {};
    let tripleAchievedCount = 0;
    Object.entries(day).forEach(([cid, val]) => {
      const def = circuitDefinitions?.[cid];
      if (!def) return;
      const target = Math.max(1, Math.round(Number(def.targetRounds) || 1));
      const rounds = Math.max(0, Math.round(Number(val?.roundsCompleted) || 0));
      if (rounds >= target * 3) tripleAchievedCount += 1;
    });
    return { ...d, tripleAchievedCount };
  });
};

const CircuitsHubPanel = () => {
  const {
    data,
    programs,
    activeProgram,
    saveCircuitDefinition,
    deleteCircuitDefinition,
    assignCircuitToProgramDay
  } = useWorkout();

  const circuitDefinitions = data?.circuitDefinitions || {};
  const circuitProgress = data?.circuitProgress || {};
  const todayStr = getDateStr(new Date());

  const [view, setView] = useState('sessions');
  const [muscleFilter, setMuscleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [editorState, setEditorState] = useState(null); // { definition? }

  // Calendrier : vue année par défaut, comme Pompes/Course
  const today = new Date();
  const [calendarYear, setCalendarYear] = useState(today.getFullYear());
  const [calendarMode, setCalendarMode] = useState('annee'); // 'annee' | 'mois'
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState(null);

  const allMuscles = useMemo(() => {
    const set = new Set();
    Object.values(circuitDefinitions).forEach((c) =>
      (c.primaryMuscles || []).forEach((m) => set.add(m))
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'fr'));
  }, [circuitDefinitions]);

  const filteredCircuits = useMemo(
    () => listCircuits(circuitDefinitions, { muscle: muscleFilter, search }),
    [circuitDefinitions, muscleFilter, search]
  );

  const xpSummary = useMemo(
    () => computeCircuitsXp(circuitProgress, circuitDefinitions),
    [circuitProgress, circuitDefinitions]
  );

  const dailyHistory = useMemo(() => {
    const base = getCircuitDailyHistory(circuitProgress, circuitDefinitions);
    return enrichDailyHistory(base, circuitProgress, circuitDefinitions);
  }, [circuitProgress, circuitDefinitions]);

  const dailyByDate = useMemo(() => {
    const map = new Map();
    dailyHistory.forEach((d) => map.set(d.date, d));
    return map;
  }, [dailyHistory]);

  const programOptions = useMemo(() => {
    const arr = Array.isArray(programs) ? [...programs] : [];
    if (activeProgram && !arr.some((p) => p?.id === activeProgram.id)) arr.push(activeProgram);
    return arr;
  }, [programs, activeProgram]);

  // ───────────────────────────────────────────────
  // SOUS-VUE : SESSIONS
  // ───────────────────────────────────────────────
  const STATUS_PILL = {
    triple: { label: '3× cible', color: 'var(--star)' },
    done: { label: "fait aujourd'hui", color: 'var(--t-cl)' },
    ongoing: { label: 'en cours', color: 'var(--t-ef)' },
    todo: { label: 'à faire', color: 'var(--t-fract)' }
  };

  const renderSessions = () => {
    if (Object.keys(circuitDefinitions).length === 0) {
      return (
        <div className="es">
          <Repeat className="ic" />
          <b>Aucun circuit créé pour le moment.</b>
          <span>Créez votre premier circuit (ex. « Tabata core 4 tours ») et assignez-le à un jour de programme.</span>
          <button
            type="button"
            className="btn pri"
            style={{ marginTop: 12 }}
            onClick={() => setEditorState({ definition: null })}
          >
            <Plus className="ic" style={{ width: 16, height: 16 }} /> Créer un circuit
          </button>
        </div>
      );
    }

    return (
      <section>
        <div className="cbar" style={{ alignItems: 'flex-end', justifyContent: 'flex-start', gap: 14 }}>
          <label className="fld" style={{ flex: 1, minWidth: 220 }}>
            <span className="lab">Recherche</span>
            <div className="cfs">
              <Search className="ic" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nom de circuit, exercice…"
              />
            </div>
          </label>
          <label className="fld" style={{ width: 200 }}>
            <span className="lab">Muscle ciblé</span>
            <select value={muscleFilter} onChange={(e) => setMuscleFilter(e.target.value)} style={{ padding: '11px 10px' }}>
              <option value="">Tous</option>
              {allMuscles.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </label>
          <button type="button" className="btn pri" onClick={() => setEditorState({ definition: null })}>
            <Plus className="ic" style={{ width: 16, height: 16 }} /> Nouveau circuit
          </button>
        </div>

        {filteredCircuits.length === 0 ? (
          <p className="dim" style={{ marginTop: 22 }}>Aucun circuit ne correspond aux filtres.</p>
        ) : (
          <div className="cgrid" style={{ marginTop: 22 }}>
            {filteredCircuits.map((c) => {
              const todayProg = circuitProgress?.[todayStr]?.[c.id];
              const todayRounds = Math.max(0, Math.round(Number(todayProg?.roundsCompleted) || 0));
              const todayInfo = computeCircuitXpForDay(todayRounds, c.targetRounds);
              const status = todayInfo.isCompleted
                ? todayInfo.isTripleAchieved
                  ? 'triple'
                  : 'done'
                : todayRounds > 0
                  ? 'ongoing'
                  : 'todo';
              const pill = STATUS_PILL[status];
              const assignments = getCircuitProgramAssignments(c.id, programOptions);
              return (
                <article
                  key={c.id}
                  className="box circ scroll-mt-24"
                  style={status === 'done' || status === 'triple' ? { borderColor: pill.color } : undefined}
                >
                  <div className="ct1">
                    <h3>
                      <Layers className="ic" />
                      {c.name}
                    </h3>
                    <span className="pill" style={{ '--c': pill.color }}>
                      {status === 'triple' ? <Sparkles size={10} style={{ marginRight: 4, verticalAlign: '-1px' }} /> : null}
                      {pill.label.toUpperCase()}
                    </span>
                    <span className="sp" />
                    <button type="button" className="btn sm" onClick={() => setEditorState({ definition: c })}>
                      <Edit3 className="ic" style={{ width: 14, height: 14 }} /> Modifier
                    </button>
                    <button
                      type="button"
                      className="ib del"
                      title="Supprimer la définition"
                      aria-label="Supprimer la définition"
                      onClick={async () => {
                        if (!window.confirm('Supprimer définitivement ce circuit (toutes assignations comprises) ?')) return;
                        await deleteCircuitDefinition(c.id);
                      }}
                    >
                      <Trash2 className="ic" />
                    </button>
                  </div>
                  <p className="cdesc">
                    {c.targetRounds} tours cibles · {(c.items || []).length} exos
                    {(c.primaryMuscles || []).length > 0 ? ` · ${c.primaryMuscles.join(', ')}` : ''}
                  </p>
                  <div className="ctd">
                    <span className="num">
                      Aujourd'hui : <b>{todayRounds}/{c.targetRounds}</b>
                    </span>
                    <span className="num" style={{ color: 'var(--t-fract)' }}>({todayInfo.xp} XP)</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {assignments.length === 0 ? (
                      <span className="link-b" style={{ borderColor: 'var(--rule-2)', color: 'var(--bone-3)' }}>
                        <Unlink className="ic" /> non assigné
                      </span>
                    ) : (
                      assignments.map((a) => (
                        <span
                          key={`${a.programId}-${a.dayName}`}
                          className="link-b"
                          title={`${a.programName} · ${DAY_LABELS[a.dayName] || a.dayName}`}
                        >
                          <Link2 className="ic" />
                          <b>{DAY_LABELS[a.dayName] || a.dayName}</b> · {a.programName}
                          <button
                            type="button"
                            onClick={() => assignCircuitToProgramDay(a.programId, a.dayName, c.id, false)}
                            title="Retirer cette assignation"
                            aria-label={`Retirer ${c.name} du jour ${a.dayName}`}
                            style={{ background: 'none', border: 0, padding: 0, marginLeft: 2, color: 'var(--t-vit)', display: 'inline-flex' }}
                          >
                            <Unlink className="ic" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    );
  };

  // ───────────────────────────────────────────────
  // SOUS-VUE : CALENDRIER
  // (Vue année par défaut. Clic sur un jour → bascule vue mois sur ce mois.)
  // ───────────────────────────────────────────────
  const yearStats = useMemo(() => {
    const acc = { totalRounds: 0, activeDays: 0, completedDays: 0, tripleDays: 0 };
    dailyHistory.forEach((d) => {
      const date = new Date(`${d.date}T12:00:00`);
      if (date.getFullYear() !== calendarYear) return;
      acc.totalRounds += d.totalRounds;
      acc.activeDays += 1;
      if (d.completedCircuits > 0) acc.completedDays += 1;
      if (d.tripleAchievedCount > 0) acc.tripleDays += 1;
    });
    return acc;
  }, [dailyHistory, calendarYear]);

  const monthStats = useMemo(() => {
    const acc = { totalRounds: 0, activeDays: 0, completedDays: 0, tripleDays: 0 };
    dailyHistory.forEach((d) => {
      const date = new Date(`${d.date}T12:00:00`);
      if (date.getFullYear() !== calendarYear || date.getMonth() !== calendarMonth) return;
      acc.totalRounds += d.totalRounds;
      acc.activeDays += 1;
      if (d.completedCircuits > 0) acc.completedDays += 1;
      if (d.tripleAchievedCount > 0) acc.tripleDays += 1;
    });
    return acc;
  }, [dailyHistory, calendarYear, calendarMonth]);

  const periodRecap = useMemo(() => {
    const now = new Date();
    const agg = (start, end) => {
      let rounds = 0;
      let completed = 0;
      let active = 0;
      let numDays = 0;
      const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      while (cur <= end) {
        const entry = dailyByDate.get(getDateStr(cur));
        if (entry) {
          rounds += entry.totalRounds || 0;
          completed += entry.completedCircuits || 0;
          active += 1;
        }
        numDays += 1;
        cur.setDate(cur.getDate() + 1);
      }
      return { rounds, completed, active, numDays };
    };
    const ws = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
    return [
      { key: 'week', title: 'Semaine en cours', ...agg(ws, new Date(ws.getFullYear(), ws.getMonth(), ws.getDate() + 6)) },
      {
        key: 'month',
        title: 'Mois en cours',
        ...agg(new Date(now.getFullYear(), now.getMonth(), 1), new Date(now.getFullYear(), now.getMonth() + 1, 0))
      },
      { key: 'year', title: `Année ${calendarYear}`, ...agg(new Date(calendarYear, 0, 1), new Date(calendarYear, 11, 31)) }
    ];
  }, [dailyByDate, calendarYear]);

  const renderSelectedDayDetails = () => {
    if (!selectedDateKey) {
      return 'Cliquez sur une case du calendrier pour voir le détail des circuits réalisés ce jour-là.';
    }
    const dayProgress = circuitProgress?.[selectedDateKey] || {};
    const entries = Object.entries(dayProgress);
    return (
      <>
        {`Détail du ${selectedDateKey}`}
        {entries.length === 0 ? (
          <div className="dr">
            <span>Aucun circuit ce jour.</span>
          </div>
        ) : (
          entries.map(([cid, val]) => {
            const def = circuitDefinitions[cid];
            if (!def) return null;
            const rounds = Math.max(0, Math.round(Number(val?.roundsCompleted) || 0));
            const xpInfo = computeCircuitXpForDay(rounds, def.targetRounds);
            return (
              <div key={cid} className="dr">
                <div>
                  <b>{def.name}</b>{' '}
                  <span>
                    {rounds}/{def.targetRounds} tours
                    {xpInfo.isCompleted &&
                      (xpInfo.isTripleAchieved ? ' · cible + palier 3× atteints' : ' · cible atteinte')}
                  </span>
                </div>
                <span
                  className="pill"
                  style={{
                    '--c': xpInfo.isTripleAchieved
                      ? 'var(--star)'
                      : xpInfo.isCompleted
                        ? 'var(--t-cl)'
                        : 'var(--bone-3)'
                  }}
                >
                  {xpInfo.xp > 0 ? `+${xpInfo.xp} XP` : '0 XP'}
                </span>
              </div>
            );
          })
        )}
      </>
    );
  };

  const renderCalendar = () => {
    const stats = calendarMode === 'mois' ? monthStats : yearStats;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
        <DefisCalendarRecap
          hint="Moyennes = total sur la période ÷ nombre de jours calendaires (semaine = lun–dim, mois = mois civil, année = année affichée sous le calendrier). La ligne « si actif » divise par les jours où tu as au moins un tour de circuit."
          cards={periodRecap.map((p) => ({
            key: p.key,
            title: p.title,
            rows: [
              { label: 'Tours / jour', value: (p.numDays ? p.rounds / p.numDays : 0).toFixed(2) },
              { label: 'Cibles / jour', value: (p.numDays ? p.completed / p.numDays : 0).toFixed(2) }
            ],
            si: `Si actif : ${(p.active ? p.rounds / p.active : 0).toFixed(2)} tours/jour actif · ${(p.active ? p.completed / p.active : 0).toFixed(2)} cibles`
          }))}
          facts={[
            { label: 'Jours actifs', value: stats.activeDays },
            { label: 'Cibles atteintes', value: stats.completedDays },
            { label: '3× cible', value: stats.tripleDays },
            { label: 'Tours réalisés', value: stats.totalRounds }
          ]}
        />

        <DefisCalendarGrid
          year={calendarYear}
          viewMode={calendarMode}
          modes={[
            { id: 'mois', label: 'Mois' },
            { id: 'annee', label: 'Année' }
          ]}
          onViewMode={setCalendarMode}
          monthIndex={calendarMonth}
          monthNames={MONTHS_FR}
          prevLabel={calendarMode === 'annee' ? 'Année précédente' : 'Mois précédent'}
          nextLabel={calendarMode === 'annee' ? 'Année suivante' : 'Mois suivant'}
          onPrev={() => {
            if (calendarMode === 'annee') {
              setCalendarYear((y) => y - 1);
            } else if (calendarMonth === 0) {
              setCalendarMonth(11);
              setCalendarYear((y) => y - 1);
            } else {
              setCalendarMonth((m) => m - 1);
            }
          }}
          onNext={() => {
            if (calendarMode === 'annee') {
              setCalendarYear((y) => y + 1);
            } else if (calendarMonth === 11) {
              setCalendarMonth(0);
              setCalendarYear((y) => y + 1);
            } else {
              setCalendarMonth((m) => m + 1);
            }
          }}
          onMonthTitleClick={(monthIdx) => {
            setCalendarMonth(monthIdx);
            setCalendarMode('mois');
          }}
          levelOf={(key) => computeHeatmapLevel(dailyByDate.get(key))}
          countOf={(key) => dailyByDate.get(key)?.totalRounds || 0}
          unitLabel={(n) => (n > 1 ? 'tours' : 'tour')}
          legend="Intensité : 0 → 1-2 tours → ≥3 tours → cible → 3× cible"
          selectedDateKey={selectedDateKey}
          onDayClick={(key, monthIdx) => {
            setSelectedDateKey(key);
            setCalendarMonth(monthIdx);
            setCalendarMode('mois');
          }}
          dayTitle={(key) => {
            const entry = dailyByDate.get(key);
            return entry
              ? `${key} — ${entry.totalRounds} tour(s), ${entry.completedCircuits} cible(s), ${entry.tripleAchievedCount} 3× cible`
              : `${key} — aucun circuit`;
          }}
          detail={renderSelectedDayDetails()}
        />

        <section>
          <div className="sec-h">
            <div>
              <h2>Historique récent</h2>
            </div>
          </div>
          {dailyHistory.length === 0 ? (
            <div className="empty">Aucun tour de circuit enregistré pour le moment.</div>
          ) : (
            <div className="mxl" style={{ marginTop: 0 }}>
              {dailyHistory.slice(0, 30).map((d) => (
                <div key={d.date} className="mxr" style={{ padding: '12px 0' }}>
                  <div>
                    <button
                      type="button"
                      className="link mono"
                      onClick={() => {
                        const dt = new Date(`${d.date}T12:00:00`);
                        setSelectedDateKey(d.date);
                        setCalendarYear(dt.getFullYear());
                        setCalendarMonth(dt.getMonth());
                        setCalendarMode('mois');
                      }}
                    >
                      {d.date}
                    </button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end' }}>
                    <span className="pill" style={{ '--c': 'var(--t-ef)' }}>{d.totalRounds} tour(s)</span>
                    <span className="pill" style={{ '--c': 'var(--t-cl)' }}>{d.completedCircuits} cible(s)</span>
                    {d.tripleAchievedCount > 0 && (
                      <span className="pill" style={{ '--c': 'var(--star)' }}>{d.tripleAchievedCount} × 3× cible</span>
                    )}
                  </div>
                  <span />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  };

  // ───────────────────────────────────────────────
  // SOUS-VUE : TROPHÉES
  // ───────────────────────────────────────────────
  const renderTrophies = () => {
    const trophies = evaluateCircuitTrophies(data);
    const tierGroups = [
      { id: 'completed', title: 'Cibles atteintes', items: trophies.completedTiers, color: 'var(--t-cl)' },
      { id: 'triple', title: '3× cible', items: trophies.tripleTiers, color: 'var(--star)' },
      { id: 'bonus', title: 'Tours-bonus', items: trophies.bonusRoundTiers, color: 'var(--t-ef)' },
      { id: 'xp', title: 'XP cumulée', items: trophies.xpTiers, color: 'var(--t-fract)' }
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 56 }}>
        <section>
          <div className="sec-h">
            <div>
              <h2>
                Paliers débloqués ({trophies.unlockedCount}/{trophies.totalCount})
              </h2>
            </div>
          </div>
          <div className="tgrid">
            {tierGroups.map((group) => {
              const unlocked = group.items.filter((x) => x.unlocked).length;
              return (
                <article key={group.id} className="box tro">
                  <div className="top">
                    <h3>{group.title}</h3>
                    <span className="pill" style={{ '--c': group.color }}>
                      {unlocked}/{group.items.length}
                    </span>
                  </div>
                  <div>
                    {group.items.map((tier) => {
                      const pct = tier.threshold > 0 ? Math.min(100, (tier.current / tier.threshold) * 100) : 0;
                      return (
                        <div key={tier.id} style={{ padding: '10px 0', borderTop: '1px solid var(--rule)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 13 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: tier.unlocked ? 'var(--bone)' : 'var(--bone-3)', fontWeight: 600 }}>
                              {tier.unlocked ? <Sparkles size={12} style={{ color: group.color }} /> : <Repeat size={12} />}
                              {tier.label}
                            </span>
                            <span className="mono num" style={{ fontSize: 12, color: 'var(--bone-2)' }}>
                              {tier.current.toLocaleString('fr-FR')} / {tier.threshold.toLocaleString('fr-FR')}
                            </span>
                          </div>
                          <div className="meter" style={{ margin: '8px 0 0', height: 5 }}>
                            <i style={{ width: `${pct}%`, background: tier.unlocked ? group.color : 'var(--bone-3)' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section>
          <div className="sec-h">
            <div>
              <h2>Top circuits (par XP cumulée)</h2>
            </div>
          </div>
          {xpSummary.perCircuit.length === 0 ? (
            <div className="empty">Aucun circuit terminé pour le moment.</div>
          ) : (
            <div className="mxl" style={{ marginTop: 0 }}>
              {xpSummary.perCircuit.slice(0, 8).map((row) => {
                const def = circuitDefinitions[row.circuitId];
                if (!def) return null;
                return (
                  <div key={row.circuitId} className="mxr">
                    <div>
                      <b>{def.name}</b>
                      <span className="num">
                        {row.completedDays} cible · {row.tripleDays} × 3×
                      </span>
                    </div>
                    <b className="num rr">+{row.xp} XP</b>
                    <span />
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    );
  };

  // ───────────────────────────────────────────────
  // RENDER
  // ───────────────────────────────────────────────
  return (
    <div>
      <header className="head">
        <div>
          <div className="kicker">Défis / Circuits</div>
          <h1>Circuits</h1>
          <p>
            Crée tes circuits, suis les tours réalisés et accumule l'XP. Cible atteinte = <b style={{ color: 'var(--bone)' }}>100 XP</b>, chaque tour bonus = <b style={{ color: 'var(--bone)' }}>100 XP</b>, palier 3× cible = <b style={{ color: 'var(--bone)' }}>250 XP</b> (remplace le bonus standard).
          </p>
        </div>
      </header>
      <section className="board" style={{ gridTemplateColumns: '1.4fr 1fr 1fr' }}>
        <div>
          <span className="lab">XP circuits</span>
          <b className="num">+{xpSummary.totalXp.toLocaleString('fr-FR')}</b>
          <div className="s">comptée dans la barre Sport</div>
        </div>
        <div>
          <span className="lab">Cibles atteintes</span>
          <b className="num">{xpSummary.completedCircuitDays}</b>
          <div className="s">{xpSummary.tripleAchievedDays} × 3× cible</div>
        </div>
        <div>
          <span className="lab">Circuits</span>
          <b className="num">{Object.keys(circuitDefinitions).length}</b>
          <div className="s">en bibliothèque</div>
        </div>
      </section>
      <div className="defis-tabs" role="tablist">
        {SUB_VIEWS.map((v) => (
          <button key={v.id} type="button" role="tab" aria-selected={view === v.id} onClick={() => setView(v.id)}>
            {v.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
        {view === 'sessions' ? (
          <div className="note" style={{ margin: 0 }}>
            <Sparkles size={14} style={{ display: 'inline', marginRight: 8, verticalAlign: '-2px', color: 'var(--t-fract)' }} />
            Les circuits sont partagés : un circuit créé ici ou depuis l'onglet <b style={{ color: 'var(--bone)' }}>Programme</b> apparaît partout (hub, programme, "Aujourd'hui"). Une assignation à un jour de programme le fait apparaître automatiquement dans <b style={{ color: 'var(--bone)' }}>Aujourd'hui</b> avec un compteur de tours, et ajoute un badge ci-dessus pour visualiser la liaison.
          </div>
        ) : null}

        {view === 'sessions' && renderSessions()}
        {view === 'stats' && (
          <EnduranceDisciplineStatsPanel
            kind="circuits"
            sessions={[]}
            circuitPayload={{ circuitProgress, circuitDefinitions }}
          />
        )}
        {view === 'calendar' && renderCalendar()}
        {view === 'trophies' && renderTrophies()}
      </div>

      {editorState && (
        <CircuitEditor
          initialDefinition={editorState.definition}
          programs={programOptions}
          onSave={saveCircuitDefinition}
          onCancel={() => setEditorState(null)}
          onAssignToDay={async (programId, dayName, circuitId) => {
            await assignCircuitToProgramDay(programId, dayName, circuitId, true);
          }}
        />
      )}
    </div>
  );
};

export default CircuitsHubPanel;
