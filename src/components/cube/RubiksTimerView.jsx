import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { averageOf, formatEntry, formatTimeMs, personalBest } from '../../lib/cube/timerStats';

const TIMER_KEY = 'momentum.rubiks.timer';
const FACES = ['U', 'R', 'F', 'D', 'L', 'B'];
const SUFFIXES = ['', "'", '2'];

function loadTimes() {
  try {
    const raw = localStorage.getItem(TIMER_KEY);
    return raw ? JSON.parse(raw) : { times: [], inspect: true };
  } catch {
    return { times: [], inspect: true };
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

export default function RubiksTimerView() {
  const saved = loadTimes();
  const [times, setTimes] = useState(saved.times || []);
  const [inspectOn, setInspectOn] = useState(saved.inspect !== false);
  const [phase, setPhase] = useState('idle');
  const [displayMs, setDisplayMs] = useState(0);
  const [scramble, setScramble] = useState(() => randomScramble());
  const [holdReady, setHoldReady] = useState(false);
  const startRef = useRef(0);
  const inspectStartRef = useRef(0);
  const rafRef = useRef(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => {
    try {
      localStorage.setItem(TIMER_KEY, JSON.stringify({ times, inspect: inspectOn }));
    } catch {
      /* ignore */
    }
  }, [times, inspectOn]);

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

  const commitTime = useCallback(
    (ms, penalty) => {
      const row = {
        id: `${Date.now()}`,
        at: new Date().toISOString(),
        ms: Math.round(ms),
        penalty,
        scramble
      };
      setTimes((prev) => [row, ...prev].slice(0, 200));
      setScramble(randomScramble());
      setPhase('idle');
      setDisplayMs(0);
      setHoldReady(false);
    },
    [scramble]
  );

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

  const ao5 = useMemo(() => averageOf(times, 5), [times]);
  const ao12 = useMemo(() => averageOf(times, 12), [times]);
  const pb = useMemo(() => personalBest(times), [times]);

  const inspectSec = displayMs / 1000;
  const inspectWarn = phase === 'inspect' && inspectSec > 15;
  const inspectDnf = phase === 'inspect' && inspectSec > 17;

  const clock =
    phase === 'inspect'
      ? `${Math.max(0, 15 - Math.floor(inspectSec))}s`
      : phase === 'running' || phase === 'idle'
        ? formatTimeMs(displayMs)
        : formatTimeMs(displayMs);

  return (
    <div className="mx-auto max-w-3xl px-4">
      <h2 className="mb-1 text-lg font-bold text-white">Chrono</h2>
      <p className="mb-4 text-xs text-slate-500">
        Mélange affiché, inspection 15 s optionnelle (WCA : +2 après 15 s, DNF après 17 s). Espace pour
        démarrer / stopper, ou les boutons ci-dessous.
      </p>

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
      {times.length === 0 ? (
        <p className="text-sm text-slate-600">Aucun temps pour l&apos;instant. Résous un mélange et stoppe le chrono.</p>
      ) : (
        <ul className="space-y-1 text-sm text-slate-300">
          {times.slice(0, 30).map((row) => (
            <li key={row.id} className="flex justify-between gap-2 rounded-md border border-slate-800/80 px-2 py-1">
              <span className="font-mono">{formatEntry(row)}</span>
              <span className="truncate text-[11px] text-slate-500">{row.scramble}</span>
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
