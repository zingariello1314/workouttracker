import React, { useCallback, useEffect, useRef, useState } from 'react';
import FaceNet from './FaceNet';
import Cube3D from './Cube3D';
import { useLanguage } from '../../context/LanguageContext';
import { useRubiksPrefs } from '../../hooks/useRubiksPrefs';
import { formatMove } from '../../lib/cube/notation';
import { DEFAULT_HOLD, schemeFromHold } from '../../lib/cube/colorScheme';
import {
  applyMoves,
  invertMove,
  parseAlgorithm,
  scrambleFacelets,
  setSticker
} from '../../lib/cube/model';
import { initCubeSolver, solveFacelets } from '../../lib/cube/solverClient';
import { validateCubeState } from '../../lib/cube/validate';

function Cube3DSafe(props) {
  try {
    return <Cube3D {...props} />;
  } catch {
    return <div className="h-[280px] rounded-xl border border-red-900/40 p-4 text-sm text-red-300">Aperçu 3D indisponible.</div>;
  }
}

export default function MethodDemoPlayer({ demo, scheme: schemeProp }) {
  const { isFrench } = useLanguage();
  const [prefs] = useRubiksPrefs();
  const fmt = useCallback(
    (tok, compact = true) =>
      formatMove(tok, {
        scheme: schemeProp,
        mode: prefs.notationMode,
        lang: isFrench ? 'fr' : 'en',
        compact
      }),
    [isFrench, prefs.notationMode, schemeProp]
  );

  const exampleStart = demo.exampleStart;
  const canned = demo.allMoves;
  const [facelets, setFacelets] = useState(exampleStart);
  const [palette, setPalette] = useState('F');
  const [queuedMove, setQueuedMove] = useState(null);
  const [moves, setMoves] = useState(canned);
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [mode, setMode] = useState('method');
  const [solverBusy, setSolverBusy] = useState(false);
  const [error, setError] = useState('');
  const sourceRef = useRef(null);
  const lockRef = useRef(false);
  const isCustom = facelets !== exampleStart && mode === 'method';

  const resetExample = () => {
    setPlaying(false);
    setQueuedMove(null);
    setFacelets(exampleStart);
    setMoves(canned);
    setStepIndex(0);
    setMode('method');
    setError('');
  };

  const paint = (face, index, color) => {
    setPlaying(false);
    setQueuedMove(null);
    setFacelets((prev) => setSticker(prev, face, index, color));
    setMode('custom');
    setMoves([]);
    setStepIndex(0);
    setError('');
  };

  const onTurnEnd = useCallback(
    (move) => {
      if (lockRef.current) return;
      lockRef.current = true;
      const source = sourceRef.current;
      sourceRef.current = null;
      setFacelets((prev) => applyMoves(prev, move));
      setQueuedMove(null);
      if (source === 'prev') {
        setStepIndex((i) => Math.max(0, i - 1));
        return;
      }
      if (source === 'next') {
        setStepIndex((i) => {
          const n = i + 1;
          if (n >= moves.length) setPlaying(false);
          return n;
        });
      }
    },
    [moves.length]
  );

  useEffect(() => {
    if (!queuedMove) lockRef.current = false;
  }, [queuedMove]);

  const goNext = useCallback(() => {
    if (stepIndex >= moves.length || queuedMove) return;
    sourceRef.current = 'next';
    setQueuedMove(moves[stepIndex]);
  }, [moves, queuedMove, stepIndex]);

  const goPrev = useCallback(() => {
    if (stepIndex <= 0 || queuedMove) return;
    sourceRef.current = 'prev';
    setQueuedMove(invertMove(moves[stepIndex - 1]));
  }, [moves, queuedMove, stepIndex]);

  useEffect(() => {
    if (!playing || queuedMove) return undefined;
    if (stepIndex >= moves.length) {
      setPlaying(false);
      return undefined;
    }
    const id = setTimeout(() => goNext(), 50);
    return () => clearTimeout(id);
  }, [playing, queuedMove, stepIndex, moves.length, goNext]);

  const jumpTo = (index) => {
    setPlaying(false);
    setQueuedMove(null);
    const origin = mode === 'solver' ? startRef.current : exampleStart;
    const prefix = moves.slice(0, index).join(' ');
    setFacelets(applyMoves(origin, prefix));
    setStepIndex(index);
  };

  const startRef = useRef(exampleStart);
  const playMethodOnExample = () => {
    startRef.current = exampleStart;
    setMode('method');
    setMoves(canned);
    setFacelets(exampleStart);
    setStepIndex(0);
    setPlaying(true);
    setQueuedMove(null);
  };

  const solveCurrent = async () => {
    const v = validateCubeState(facelets);
    if (!v.ok) {
      setError(v.errors[0]);
      return;
    }
    setSolverBusy(true);
    setError('');
    try {
      await initCubeSolver();
      const solution = await solveFacelets(facelets);
      const list = parseAlgorithm(solution);
      startRef.current = facelets;
      setMode('solver');
      setMoves(list);
      setStepIndex(0);
      setPlaying(false);
      setQueuedMove(null);
    } catch (err) {
      setError(err.message || 'Solve impossible');
    } finally {
      setSolverBusy(false);
    }
  };

  const finished = moves.length > 0 && stepIndex >= moves.length;
  const current = finished ? null : moves[stepIndex];
  const scheme = schemeProp || schemeFromHold(DEFAULT_HOLD.up, DEFAULT_HOLD.front);

  let stageHint = '';
  if (mode === 'method') {
    let acc = 0;
    for (const st of demo.stages) {
      const n = parseAlgorithm(st.moves).length;
      if (stepIndex < acc + n) {
        stageHint = st.title;
        break;
      }
      acc += n;
      if (stepIndex >= moves.length) stageHint = 'Terminé';
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-emerald-800/40 bg-black/50 p-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={playMethodOnExample} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">
          Lire toute la méthode
        </button>
        <button
          type="button"
          onClick={() => {
            resetExample();
          }}
          className="rounded-lg border border-emerald-700/50 px-3 py-1.5 text-xs"
        >
          Revenir à l&apos;exemple
        </button>
        <button
          type="button"
          onClick={() => {
            setFacelets(scrambleFacelets());
            setPlaying(false);
            setQueuedMove(null);
            setMoves([]);
            setStepIndex(0);
            setMode('custom');
          }}
          className="rounded-lg border border-emerald-700/50 px-3 py-1.5 text-xs"
        >
          Mélanger (départ perso)
        </button>
        <button
          type="button"
          disabled={solverBusy}
          onClick={solveCurrent}
          className="rounded-lg border border-amber-700/60 px-3 py-1.5 text-xs text-amber-100"
        >
          {solverBusy ? 'Solveur…' : 'Résoudre CET état (Kociemba, pas la méthode)'}
        </button>
      </div>

      {isCustom || mode === 'custom' ? (
        <p className="text-xs text-amber-200/90">
          Le départ n&apos;est plus celui de l&apos;exemple. La lecture « méthode » ne correspondrait plus aux formules
          affichées. Reviens à l&apos;exemple, ou lance le solveur sur cet état (chemin court machine, pas LBL/CFOP/etc.).
        </p>
      ) : null}

      {mode === 'solver' ? (
        <p className="text-xs text-amber-200/80">Lecture d&apos;une solution Kociemba — ce n&apos;est pas la méthode humaine ci-dessus.</p>
      ) : null}

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <p className="text-[11px] text-slate-500">
        Peins un départ perso (centres verrouillés), ou garde l&apos;exemple. Glisse le 3D seulement si tu acceptes de
        quitter l&apos;enchaînement prévu.
      </p>
      <FaceNet facelets={facelets} paletteColor={palette} onPaint={paint} onSelectPalette={setPalette} scheme={scheme} />
      <Cube3DSafe
        facelets={facelets}
        scheme={scheme}
        interactive={false}
        queuedMove={queuedMove}
        onTurnEnd={onTurnEnd}
      />

      {moves.length > 0 ? (
        <div className="space-y-2">
          <p className="text-center text-lg font-semibold text-white">
            {current ? fmt(current, false) : '✓'}
          </p>
          {stageHint ? <p className="text-center text-xs text-emerald-200/80">{stageHint}</p> : null}
          <p className="text-center text-[11px] text-slate-400">
            {finished ? `Terminé · ${moves.length} coups` : `Coup ${stepIndex + 1} / ${moves.length}`}
          </p>
          <div className="flex justify-center gap-2">
            <button type="button" onClick={goPrev} className="rounded border border-slate-600 px-2 py-1 text-xs">
              Précédent
            </button>
            {finished ? (
              <button type="button" onClick={resetExample} className="rounded border border-emerald-400 px-2 py-1 text-xs">
                Recommencer
              </button>
            ) : playing ? (
              <button type="button" onClick={() => setPlaying(false)} className="rounded border border-slate-600 px-2 py-1 text-xs">
                Pause
              </button>
            ) : (
              <button type="button" onClick={() => setPlaying(true)} className="rounded border border-slate-600 px-2 py-1 text-xs">
                Lire
              </button>
            )}
            <button type="button" onClick={goNext} className="rounded border border-slate-600 px-2 py-1 text-xs">
              Suivant
            </button>
          </div>
          <ol className="flex flex-wrap justify-center gap-1">
            {moves.map((m, i) => (
              <li key={`${m}-${i}`}>
                <button
                  type="button"
                  onClick={() => jumpTo(i)}
                  className={`rounded px-1 py-0.5 text-[11px] ${
                    i === stepIndex && !finished ? 'bg-emerald-800 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {fmt(m, true)}
                </button>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <p className="text-xs text-slate-500">Aucun enchaînement : reviens à l&apos;exemple ou lance le solveur.</p>
      )}
    </div>
  );
}
