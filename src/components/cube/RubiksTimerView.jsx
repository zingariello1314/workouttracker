import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { averageOf, formatEntry, formatTimeMs, personalBest } from '../../lib/cube/timerStats';
import {
  DEFAULT_TIMER_CATEGORY,
  GOAL_CATEGORIES,
  METHOD_STAGE_CATEGORIES,
  categoryGroup,
  customCategoryId,
  formatCategoryLabel,
  methodCategoryId,
  parseCategoryId,
  timesForCategory,
  usedCategoryIds
} from '../../lib/cube/timerCategories';

const TIMER_KEY = 'momentum.rubiks.timer';
const FACES = ['U', 'R', 'F', 'D', 'L', 'B'];
const SUFFIXES = ['', "'", '2'];

function loadTimes() {
  try {
    const raw = localStorage.getItem(TIMER_KEY);
    return raw ? JSON.parse(raw) : { times: [], inspect: true, categoryId: DEFAULT_TIMER_CATEGORY };
  } catch {
    return { times: [], inspect: true, categoryId: DEFAULT_TIMER_CATEGORY };
  }
}

function randomScramble(len = 20) {
  const moves = [];
  let last = '';
  while (moves.length < len) {
    const f = FACES[Math.floor(Math.random() * FACES.length)];
    if (f === last) continue;
    last = f;
    moves.push(f + SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)]);
  }
  return moves.join(' ');
}

function TimerCategoryPicker({ categoryId, onChange }) {
  const parsed = parseCategoryId(categoryId);
  const group = categoryGroup(categoryId);
  const methodId = parsed.kind === 'method' ? parsed.methodId : 'cfop';
  const stageId = parsed.kind === 'method' ? parsed.stageId : 'full';
  const [customDraft, setCustomDraft] = useState(parsed.kind === 'custom' ? parsed.note : '');

  const setGroup = (next) => {
    if (next === 'full') onChange(DEFAULT_TIMER_CATEGORY);
    else if (next === 'piece') onChange('goal:white_face');
    else onChange(methodCategoryId('cfop', 'full'));
  };

  return (
    <section className="mb-5 space-y-3 rounded-xl border border-emerald-800/40 bg-emerald-950/15 p-4">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-emerald-200/90">Ce que tu chronomètres</h3>
        <p className="mt-1 text-xs text-slate-500">
          Chaque temps est rangé dans cette catégorie. Les PB et moyennes ne mélangent pas une face blanche avec un
          CFOP complet.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[
          { id: 'full', label: 'Cube entier' },
          { id: 'piece', label: 'Un morceau' },
          { id: 'method', label: 'Méthode + étape' }
        ].map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setGroup(opt.id)}
            className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
              group === opt.id
                ? 'border-emerald-400 bg-emerald-500/20 text-white'
                : 'border-slate-700 text-slate-300 hover:border-emerald-700'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {group === 'piece' ? (
        <div className="flex flex-wrap gap-2">
          {GOAL_CATEGORIES.map((g) => (
            <button
              key={g.id}
              type="button"
              title={g.hint}
              onClick={() => onChange(g.id)}
              className={`rounded-lg border px-3 py-1.5 text-left text-xs ${
                categoryId === g.id
                  ? 'border-emerald-400 bg-emerald-500/15 text-white'
                  : 'border-slate-800 text-slate-300 hover:border-emerald-800'
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      ) : null}

      {group === 'method' ? (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {Object.entries(METHOD_STAGE_CATEGORIES).map(([id, meta]) => (
              <button
                key={id}
                type="button"
                onClick={() => onChange(methodCategoryId(id, 'full'))}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                  methodId === id
                    ? 'border-emerald-400 bg-emerald-500/15 text-white'
                    : 'border-slate-800 text-slate-300 hover:border-emerald-800'
                }`}
              >
                {meta.name}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {(METHOD_STAGE_CATEGORIES[methodId]?.stages || []).map((st) => {
              const id = methodCategoryId(methodId, st.id);
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => onChange(id)}
                  className={`rounded-lg border px-3 py-1.5 text-xs ${
                    stageId === st.id
                      ? 'border-emerald-400 bg-emerald-500/20 text-white'
                      : 'border-slate-800 text-slate-400 hover:border-emerald-800'
                  }`}
                >
                  {st.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-end gap-2">
        <label className="block min-w-[12rem] flex-1 text-[11px] text-slate-500">
          Catégorie perso (optionnel)
          <input
            value={customDraft}
            onChange={(e) => setCustomDraft(e.target.value)}
            placeholder="ex. T-perm, OLL 21, 2e paire F2L…"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-black/40 px-2 py-1.5 text-sm text-slate-200"
          />
        </label>
        <button
          type="button"
          className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-200"
          onClick={() => {
            const id = customCategoryId(customDraft);
            if (id !== DEFAULT_TIMER_CATEGORY) onChange(id);
          }}
        >
          Utiliser
        </button>
      </div>

      <p className="text-sm text-emerald-100">
        Enregistrements : <strong>{formatCategoryLabel(categoryId)}</strong>
      </p>
    </section>
  );
}

export default function RubiksTimerView() {
  const saved = loadTimes();
  const [times, setTimes] = useState(saved.times || []);
  const [inspectOn, setInspectOn] = useState(saved.inspect !== false);
  const [categoryId, setCategoryId] = useState(saved.categoryId || DEFAULT_TIMER_CATEGORY);
  const [historyFilter, setHistoryFilter] = useState('current');
  const [phase, setPhase] = useState('idle');
  const [displayMs, setDisplayMs] = useState(0);
  const [scramble, setScramble] = useState(() => randomScramble());
  const [holdReady, setHoldReady] = useState(false);
  const startRef = useRef(0);
  const inspectStartRef = useRef(0);
  const rafRef = useRef(null);
  const phaseRef = useRef(phase);
  const categoryRef = useRef(categoryId);
  phaseRef.current = phase;
  categoryRef.current = categoryId;

  useEffect(() => {
    try {
      localStorage.setItem(TIMER_KEY, JSON.stringify({ times, inspect: inspectOn, categoryId }));
    } catch {
      /* ignore */
    }
  }, [times, inspectOn, categoryId]);

  const stopRaf = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  const tickRun = useCallback(() => {
    const loop = () => {
      setDisplayMs(performance.now() - startRef.current);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const tickInspect = useCallback(() => {
    const loop = () => {
      setDisplayMs(performance.now() - inspectStartRef.current);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const commitTime = useCallback((ms, penalty) => {
    const row = {
      id: `${Date.now()}`,
      at: new Date().toISOString(),
      ms: Math.round(ms),
      penalty,
      scramble,
      categoryId: categoryRef.current || DEFAULT_TIMER_CATEGORY
    };
    setTimes((prev) => [row, ...prev].slice(0, 400));
    setScramble(randomScramble());
    setPhase('idle');
    setDisplayMs(0);
    setHoldReady(false);
  }, [scramble]);

  const startRunning = useCallback(
    (inspectElapsed) => {
      stopRaf();
      let penalty = 0;
      if (inspectOn) {
        const sec = inspectElapsed / 1000;
        if (sec > 17) {
          commitTime(0, 'DNF');
          return;
        }
        if (sec > 15) penalty = 2000;
      }
      startRef.current = performance.now();
      setPhase('running');
      setDisplayMs(0);
      tickRun();
      startRef.currentPenalty = penalty;
    },
    [commitTime, inspectOn, tickRun]
  );

  const stopRunning = useCallback(() => {
    stopRaf();
    const ms = performance.now() - startRef.current;
    const penalty = startRef.currentPenalty || 0;
    commitTime(ms, penalty);
  }, [commitTime]);

  const onSpaceDown = useCallback(
    (e) => {
      if (e.repeat) return;
      if (e.code !== 'Space' && e.key !== ' ') return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable) return;
      e.preventDefault();
      const p = phaseRef.current;
      if (p === 'running') {
        stopRunning();
        return;
      }
      setHoldReady(true);
    },
    [stopRunning]
  );

  const onSpaceUp = useCallback(
    (e) => {
      if (e.code !== 'Space' && e.key !== ' ') return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable) return;
      e.preventDefault();
      const p = phaseRef.current;
      if (p === 'running') return;
      if (!holdReady && p !== 'inspect') return;
      setHoldReady(false);
      if (p === 'idle') {
        if (inspectOn) {
          inspectStartRef.current = performance.now();
          setPhase('inspect');
          setDisplayMs(0);
          tickInspect();
        } else {
          startRunning(0);
        }
        return;
      }
      if (p === 'inspect') {
        const elapsed = performance.now() - inspectStartRef.current;
        startRunning(elapsed);
      }
    },
    [holdReady, inspectOn, startRunning, tickInspect]
  );

  useEffect(() => {
    window.addEventListener('keydown', onSpaceDown);
    window.addEventListener('keyup', onSpaceUp);
    return () => {
      window.removeEventListener('keydown', onSpaceDown);
      window.removeEventListener('keyup', onSpaceUp);
    };
  }, [onSpaceDown, onSpaceUp]);

  useEffect(() => () => stopRaf(), []);

  const statsCategoryId = historyFilter === 'current' ? categoryId : historyFilter;
  const scopedTimes = useMemo(
    () => timesForCategory(times, statsCategoryId === 'all' ? 'all' : statsCategoryId),
    [times, statsCategoryId]
  );
  const ao5 = useMemo(() => averageOf(scopedTimes, 5), [scopedTimes]);
  const ao12 = useMemo(() => averageOf(scopedTimes, 12), [scopedTimes]);
  const pb = useMemo(() => personalBest(scopedTimes), [scopedTimes]);

  const filterOptions = useMemo(() => {
    const ids = usedCategoryIds(times);
    if (!ids.includes(categoryId)) ids.unshift(categoryId);
    return ids;
  }, [times, categoryId]);

  const inspectSec = displayMs / 1000;
  const inspectWarn = phase === 'inspect' && inspectSec > 15;
  const inspectDnf = phase === 'inspect' && inspectSec > 17;

  const clock =
    phase === 'inspect'
      ? `${Math.max(0, 15 - Math.floor(inspectSec))}s`
      : formatTimeMs(displayMs);

  const historyRows = historyFilter === 'all' ? times : scopedTimes;

  return (
    <div className="mx-auto max-w-3xl px-4">
      <h2 className="mb-1 text-lg font-bold text-white">Chrono</h2>
      <p className="mb-4 text-xs text-slate-500">
        Choisis d&apos;abord ce que tu travailles (face, deux couches, CFOP · OLL, Roux · premier bloc…). Espace pour
        démarrer / stopper. Inspection 15 s optionnelle (WCA : +2 après 15 s, DNF après 17 s).
      </p>

      <TimerCategoryPicker categoryId={categoryId} onChange={setCategoryId} />

      <p className="mb-4 rounded-xl border border-emerald-800/50 bg-black/50 px-3 py-3 text-center font-mono text-sm text-emerald-100">
        {scramble}
      </p>

      <button
        type="button"
        className={`mb-4 w-full rounded-2xl border-2 py-10 text-center font-mono text-5xl tabular-nums md:text-6xl ${
          phase === 'running'
            ? 'border-emerald-400 text-white'
            : inspectDnf
              ? 'border-red-500 text-red-300'
              : inspectWarn
                ? 'border-amber-400 text-amber-200'
                : holdReady
                  ? 'border-emerald-300 text-emerald-200'
                  : 'border-emerald-800 text-slate-200'
        }`}
        onPointerDown={() => {
          if (phase === 'running') stopRunning();
          else setHoldReady(true);
        }}
        onPointerUp={() => {
          if (phase === 'running') return;
          if (phase === 'idle' && inspectOn) {
            inspectStartRef.current = performance.now();
            setPhase('inspect');
            setDisplayMs(0);
            setHoldReady(false);
            tickInspect();
          } else if (phase === 'idle') {
            setHoldReady(false);
            startRunning(0);
          } else if (phase === 'inspect') {
            const elapsed = performance.now() - inspectStartRef.current;
            setHoldReady(false);
            startRunning(elapsed);
          }
        }}
      >
        {phase === 'inspect' ? (inspectDnf ? 'DNF' : clock) : clock}
      </button>

      <div className="mb-6 flex flex-wrap items-center gap-3 text-xs text-slate-400">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={inspectOn} onChange={(e) => setInspectOn(e.target.checked)} />
          Inspection 15 s
        </label>
        <button
          type="button"
          className="rounded-lg border border-slate-600 px-2 py-1"
          onClick={() => setScramble(randomScramble())}
        >
          Nouveau mélange
        </button>
        {times[0] ? (
          <>
            <button
              type="button"
              className="rounded-lg border border-slate-600 px-2 py-1"
              onClick={() =>
                setTimes((prev) =>
                  prev.map((row, i) => (i === 0 ? { ...row, penalty: row.penalty === 2000 ? 0 : 2000 } : row))
                )
              }
            >
              +2
            </button>
            <button
              type="button"
              className="rounded-lg border border-red-900 px-2 py-1 text-red-300"
              onClick={() =>
                setTimes((prev) =>
                  prev.map((row, i) => (i === 0 ? { ...row, penalty: row.penalty === 'DNF' ? 0 : 'DNF' } : row))
                )
              }
            >
              DNF
            </button>
          </>
        ) : null}
      </div>

      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-wide text-slate-500">
          Stats · {historyFilter === 'all' ? 'toutes catégories' : formatCategoryLabel(statsCategoryId)}
        </p>
        <label className="text-[11px] text-slate-500">
          Historique{' '}
          <select
            value={historyFilter}
            onChange={(e) => setHistoryFilter(e.target.value)}
            className="rounded border border-slate-700 bg-black/50 px-1 py-0.5 text-slate-200"
          >
            <option value="current">Catégorie actuelle</option>
            <option value="all">Tout</option>
            {filterOptions.map((id) => (
              <option key={id} value={id}>
                {formatCategoryLabel(id)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-2 text-center text-sm">
        <div className="rounded-lg border border-slate-800 p-2">
          <p className="text-[10px] uppercase text-slate-500">PB</p>
          <p className="font-mono text-white">{pb == null ? '—' : formatTimeMs(pb)}</p>
        </div>
        <div className="rounded-lg border border-slate-800 p-2">
          <p className="text-[10px] uppercase text-slate-500">ao5</p>
          <p className="font-mono text-white">{ao5 == null ? '—' : ao5 === 'DNF' ? 'DNF' : formatTimeMs(ao5)}</p>
        </div>
        <div className="rounded-lg border border-slate-800 p-2">
          <p className="text-[10px] uppercase text-slate-500">ao12</p>
          <p className="font-mono text-white">{ao12 == null ? '—' : ao12 === 'DNF' ? 'DNF' : formatTimeMs(ao12)}</p>
        </div>
      </div>

      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Historique</h3>
      {historyRows.length === 0 ? (
        <p className="text-sm text-slate-600">Aucun temps dans ce filtre. Chronomètre un mélange, ou change de catégorie.</p>
      ) : (
        <ul className="space-y-1 text-sm text-slate-300">
          {historyRows.slice(0, 40).map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-2 rounded-md border border-slate-800/80 px-2 py-1">
              <span className="font-mono">{formatEntry(row)}</span>
              <span className="min-w-0 flex-1 truncate text-[11px] text-emerald-200/70">
                {formatCategoryLabel(row.categoryId || DEFAULT_TIMER_CATEGORY)}
              </span>
              <span className="hidden max-w-[9rem] truncate text-[11px] text-slate-500 sm:inline">{row.scramble}</span>
              <button
                type="button"
                className="text-[11px] text-red-400"
                onClick={() => setTimes((prev) => prev.filter((t) => t.id !== row.id))}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
