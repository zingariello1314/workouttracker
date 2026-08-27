import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import FaceNet from '../cube/FaceNet';
import Cube3D from '../cube/Cube3D';
import ProgressPanel from '../cube/ProgressPanel';
import {
  SOLVED_FACELETS,
  applyMoves,
  invertMove,
  parseAlgorithm,
  scrambleFacelets,
  setSticker
} from '../../lib/cube/model';
import { validateCubeState } from '../../lib/cube/validate';
import { detectLblProgress } from '../../lib/cube/lbl-progress';
import { initCubeSolver, solveFacelets } from '../../lib/cube/solverClient';
import {
  DEFAULT_HOLD,
  PHYSICAL_COLORS,
  PHYSICAL_ORDER,
  isValidHold,
  schemeFromHold,
  validFrontColors
} from '../../lib/cube/colorScheme';
import { cubieFromSticker, stickerAfterMove } from '../../lib/cube/stickerMotion';

const STATE_KEY = 'momentum.rubiks.state';
const HISTORY_KEY = 'momentum.rubiks.history';

function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function Cube3DSafe(props) {
  try {
    return <Cube3D {...props} />;
  } catch {
    return (
      <div className="h-[280px] rounded-xl border border-red-900/40 p-4 text-sm text-red-300">
        Aperçu 3D indisponible.
      </div>
    );
  }
}

export default function RubiksCubeView() {
  const saved = loadJson(STATE_KEY, null);
  const initialHold =
    saved?.hold && isValidHold(saved.hold.up, saved.hold.front) ? saved.hold : DEFAULT_HOLD;
  const [hold, setHold] = useState(initialHold);
  const [facelets, setFacelets] = useState(saved?.facelets || SOLVED_FACELETS);
  const [startFacelets, setStartFacelets] = useState(saved?.startFacelets || SOLVED_FACELETS);
  const [palette, setPalette] = useState('F');
  const [mobileTab, setMobileTab] = useState('retranscrire');
  const [moves, setMoves] = useState([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [queuedMove, setQueuedMove] = useState(null);
  const [netMode, setNetMode] = useState('play');
  const [selected, setSelected] = useState(null);
  const [loadingSolver, setLoadingSolver] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState(() => loadJson(HISTORY_KEY, []));
  const turnSourceRef = useRef(null);
  const turnLockRef = useRef(false);
  const selectedRef = useRef(null);
  selectedRef.current = selected;
  const scheme = useMemo(() => schemeFromHold(hold.up, hold.front), [hold]);

  useEffect(() => {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify({ facelets, startFacelets, hold }));
    } catch {
      /* ignore */
    }
  }, [facelets, startFacelets, hold]);

  const validation = useMemo(() => validateCubeState(facelets), [facelets]);
  const lbl = useMemo(() => detectLblProgress(facelets), [facelets]);

  const paint = useCallback((face, index, color) => {
    setMoves([]);
    setStepIndex(0);
    setPlaying(false);
    setQueuedMove(null);
    setFacelets((prev) => setSticker(prev, face, index, color));
    setError('');
  }, []);

  const resetSolved = () => {
    setFacelets(SOLVED_FACELETS);
    setStartFacelets(SOLVED_FACELETS);
    setMoves([]);
    setStepIndex(0);
    setError('');
    setPlaying(false);
    setQueuedMove(null);
  };

  const resetPaint = () => {
    setFacelets(SOLVED_FACELETS);
    setMoves([]);
    setStepIndex(0);
    setPlaying(false);
    setQueuedMove(null);
  };

  const scramble = () => {
    const s = scrambleFacelets();
    setFacelets(s);
    setStartFacelets(s);
    setMoves([]);
    setStepIndex(0);
    setError('');
    setPlaying(false);
    setQueuedMove(null);
  };

  const pasteFacelets = async () => {
    try {
      const text = (await navigator.clipboard.readText()).trim().toUpperCase();
      if (text.length !== 54) {
        setError('Le presse-papiers doit contenir 54 lettres (URFDLB).');
        return;
      }
      setFacelets(text);
      setStartFacelets(text);
      setMoves([]);
      setPlaying(false);
      setQueuedMove(null);
      setError('');
    } catch {
      setError('Impossible de lire le presse-papiers.');
    }
  };

  const applyHold = (up, front) => {
    const nextFront = isValidHold(up, front) ? front : validFrontColors(up)[0];
    setHold({ up, front: nextFront });
    setFacelets(SOLVED_FACELETS);
    setStartFacelets(SOLVED_FACELETS);
    setMoves([]);
    setStepIndex(0);
    setPalette('F');
    setError('');
    setPlaying(false);
    setQueuedMove(null);
  };

  const markHistoryFinished = useCallback(() => {
    setHistory((prev) => {
      const next = prev.map((h, idx) => (idx === 0 ? { ...h, finished: true } : h));
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const runSolve = async () => {
    const v = validateCubeState(facelets);
    if (!v.ok) {
      setError(v.errors[0]);
      return;
    }
    setLoadingSolver(true);
    setError('');
    setPlaying(false);
    setQueuedMove(null);
    try {
      await initCubeSolver();
      const solution = await solveFacelets(facelets);
      const list = parseAlgorithm(solution);
      setStartFacelets(facelets);
      setMoves(list);
      setStepIndex(0);
      const row = {
        id: `${Date.now()}`,
        at: new Date().toISOString(),
        moves: list.length,
        finished: list.length === 0
      };
      setHistory((prev) => {
        const next = [row, ...prev].slice(0, 20);
        try {
          localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
        } catch {
          /* ignore */
        }
        return next;
      });
    } catch (err) {
      setError(err.message || 'Solve impossible (état illégal ou solveur).');
    } finally {
      setLoadingSolver(false);
    }
  };

  const onTurnEnd = useCallback(
    (move) => {
      if (turnLockRef.current) return;
      turnLockRef.current = true;
      const source = turnSourceRef.current;
      turnSourceRef.current = null;
      setFacelets((prev) => applyMoves(prev, move));
      setQueuedMove(null);
      const sel = selectedRef.current;
      if (sel) {
        const next = stickerAfterMove(sel.face, sel.index, move);
        setSelected({ face: next.face, index: next.index, x: next.x, y: next.y, z: next.z });
      }
      if (source === 'prev') {
        setStepIndex((i) => Math.max(0, i - 1));
        return;
      }
      if (source === 'next') {
        setStepIndex((i) => {
          const n = i + 1;
          if (n >= moves.length) {
            setPlaying(false);
            markHistoryFinished();
          }
          return n;
        });
        return;
      }
      setMoves([]);
      setStepIndex(0);
      setPlaying(false);
    },
    [markHistoryFinished, moves.length]
  );

  useEffect(() => {
    if (!queuedMove) turnLockRef.current = false;
  }, [queuedMove]);

  const requestUserMove = useCallback(
    (move) => {
      if (queuedMove) return;
      turnSourceRef.current = 'user';
      setPlaying(false);
      setQueuedMove(move);
    },
    [queuedMove]
  );

  const goNext = useCallback(() => {
    if (stepIndex >= moves.length || queuedMove) return;
    turnSourceRef.current = 'next';
    setQueuedMove(moves[stepIndex]);
  }, [moves, queuedMove, stepIndex]);

  const goPrev = useCallback(() => {
    if (stepIndex <= 0 || queuedMove) return;
    turnSourceRef.current = 'prev';
    setQueuedMove(invertMove(moves[stepIndex - 1]));
  }, [moves, queuedMove, stepIndex]);

  useEffect(() => {
    if (!playing || queuedMove) return undefined;
    if (stepIndex >= moves.length) {
      setPlaying(false);
      return undefined;
    }
    const id = setTimeout(() => goNext(), 40);
    return () => clearTimeout(id);
  }, [playing, queuedMove, stepIndex, moves.length, goNext]);

  const showStart = () => {
    setQueuedMove(null);
    setPlaying(false);
    setFacelets(startFacelets);
    setStepIndex(0);
  };

  const jumpToStep = (index) => {
    if (index < 0 || index > moves.length) return;
    setQueuedMove(null);
    setPlaying(false);
    const prefix = moves.slice(0, index).join(' ');
    setFacelets(applyMoves(startFacelets, prefix));
    setStepIndex(index);
  };

  const panel = (
    <ProgressPanel
      moves={moves}
      stepIndex={stepIndex}
      playing={playing}
      finished={moves.length > 0 && stepIndex >= moves.length}
      onPrev={goPrev}
      onNext={goNext}
      onPlay={() => setPlaying(true)}
      onPause={() => setPlaying(false)}
      onRestart={showStart}
      onJump={jumpToStep}
      lbl={lbl}
      scheme={scheme}
      history={history}
      error={error || (validation.ok ? '' : validation.errors[0])}
      loadingSolver={loadingSolver}
      canSolve={validation.ok}
      onSolve={runSolve}
      onShowStart={showStart}
    />
  );

  const transcribe = (
    <div className="space-y-4">
      <div className="space-y-3 rounded-xl border border-emerald-800/40 bg-emerald-950/30 p-3">
        <p className="text-sm text-slate-300">
          Choisis <strong className="text-white">ta tenue</strong> pour coller à ton cube réel. Les coups U, R, F…
          sont relatifs à ce que tu vois : U = face du haut, F = face devant toi.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex-1 text-xs text-slate-400">
            Couleur en haut (U)
            <select
              className="mt-1 w-full rounded-lg border border-emerald-800 bg-black px-2 py-1.5 text-sm text-white"
              value={hold.up}
              onChange={(e) => applyHold(e.target.value, hold.front)}
            >
              {PHYSICAL_ORDER.map((id) => (
                <option key={id} value={id}>
                  {PHYSICAL_COLORS[id].label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex-1 text-xs text-slate-400">
            Couleur devant (F)
            <select
              className="mt-1 w-full rounded-lg border border-emerald-800 bg-black px-2 py-1.5 text-sm text-white"
              value={hold.front}
              onChange={(e) => applyHold(hold.up, e.target.value)}
            >
              {validFrontColors(hold.up).map((id) => (
                <option key={id} value={id}>
                  {PHYSICAL_COLORS[id].label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="text-[11px] text-slate-500">
          Droite (R) : {PHYSICAL_COLORS[scheme.R].label} · Gauche (L) : {PHYSICAL_COLORS[scheme.L].label} ·
          Dessous (D) : {PHYSICAL_COLORS[scheme.D].label} · Arrière (B) : {PHYSICAL_COLORS[scheme.B].label}
        </p>
      </div>
      <p className="text-[11px] leading-relaxed text-slate-500">
        <strong className="text-slate-300">Jouer :</strong> sélectionne une case, les flèches vertes montrent sa
        destination (comme chess.com). Pavé / clavier pour déplacer, ↺ ↻ pour tourner la face du carré. Glisser une
        pastille reste possible. Le fond oriente la caméra.
      </p>
      <Cube3DSafe
        facelets={facelets}
        scheme={scheme}
        interactive
        queuedMove={queuedMove}
        selected={selected}
        onSelect={setSelected}
        onRequestMove={requestUserMove}
        onTurnEnd={onTurnEnd}
      />
      <p className="text-sm text-slate-400">
        Peins les 54 stickers comme tu les vois, y compris le carré du milieu de chaque face.
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={resetSolved} className="rounded-lg border border-emerald-700/50 px-2 py-1 text-xs">
          Cube résolu
        </button>
        <button type="button" onClick={scramble} className="rounded-lg border border-emerald-700/50 px-2 py-1 text-xs">
          Mélanger
        </button>
        <button type="button" onClick={resetPaint} className="rounded-lg border border-emerald-700/50 px-2 py-1 text-xs">
          Reset
        </button>
        <button type="button" onClick={pasteFacelets} className="rounded-lg border border-emerald-700/50 px-2 py-1 text-xs">
          Coller un état
        </button>
        <button
          type="button"
          onClick={() => setNetMode((m) => (m === 'play' ? 'paint' : 'play'))}
          className="rounded-lg border border-emerald-400/50 px-2 py-1 text-xs text-emerald-100"
        >
          {netMode === 'play' ? 'Mode peindre le patron' : 'Mode jouer (sélection)'}
        </button>
      </div>
      <FaceNet
        facelets={facelets}
        paletteColor={palette}
        onPaint={paint}
        onSelectPalette={setPalette}
        pickMode={netMode === 'play'}
        selected={selected}
        onPick={(face, index) => {
          const c = cubieFromSticker(face, index);
          setSelected({ face, index, ...c });
        }}
        scheme={scheme}
      />
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4">
      <h2 className="mb-1 text-lg font-bold text-white">Retranscrire et résoudre</h2>
      <p className="mb-4 text-xs text-slate-500">
        N&apos;importe quel état légal est résolu pour de vrai (algorithme de Kociemba, solution courte).
        Les coups s&apos;appliquent dans la tenue que tu as choisie. Pour afficher « R&apos; » ou une phrase en français,
        ouvre le sous-onglet Paramètres.
      </p>

      <div className="mb-4 flex gap-2 md:hidden">
        <button
          type="button"
          onClick={() => setMobileTab('retranscrire')}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
            mobileTab === 'retranscrire' ? 'border-emerald-400 text-white' : 'border-emerald-900 text-slate-400'
          }`}
        >
          Retranscrire
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('progression')}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
            mobileTab === 'progression' ? 'border-emerald-400 text-white' : 'border-emerald-900 text-slate-400'
          }`}
        >
          Progression
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className={mobileTab === 'retranscrire' ? 'block' : 'hidden md:block'}>{transcribe}</section>
        <section className={mobileTab === 'progression' ? 'block' : 'hidden md:block'}>{panel}</section>
      </div>
    </div>
  );
}
