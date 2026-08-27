import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { lblStepsForScheme } from '../../lib/cube/lbl-progress';
import { DEFAULT_SCHEME } from '../../lib/cube/colorScheme';
import { formatMove } from '../../lib/cube/notation';
import { useRubiksPrefs } from '../../hooks/useRubiksPrefs';
import { PLAY_SPEEDS } from '../../lib/cube/rubiksPrefs';

export default function ProgressPanel({
  moves,
  stepIndex,
  playing,
  finished = false,
  onPrev,
  onNext,
  onPlay,
  onPause,
  onRestart,
  onJump,
  lbl,
  history,
  error,
  loadingSolver,
  canSolve,
  onSolve,
  onShowStart,
  scheme = DEFAULT_SCHEME
}) {
  const { isFrench } = useLanguage();
  const [prefs, updatePrefs] = useRubiksPrefs();
  const fmt = (tok, compact = true) =>
    formatMove(tok, { scheme, mode: prefs.notationMode, lang: isFrench ? 'fr' : 'en', compact });
  const total = moves.length;
  const current = finished || stepIndex >= total ? null : moves[stepIndex];
  const pct = total > 0 ? Math.round((Math.min(stepIndex, total) / total) * 100) : 0;
  const steps = lblStepsForScheme(scheme);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={!canSolve || loadingSolver}
          onClick={onSolve}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          {loadingSolver ? 'Init. solveur…' : 'Résoudre'}
        </button>
        <button
          type="button"
          onClick={onShowStart}
          className="rounded-lg border border-emerald-700/50 px-3 py-1.5 text-xs text-emerald-100"
        >
          État de départ
        </button>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      {total === 0 && !loadingSolver ? (
        <p className="text-sm text-slate-500">
          Peins le cube dans ta tenue, puis lance la résolution. Le solveur calcule une solution courte
          (Kociemba, ~20 coups) pour n&apos;importe quel état légal.
        </p>
      ) : null}

      {total > 0 ? (
        <div className="rounded-xl border border-emerald-800/40 bg-black/60 p-3 space-y-3">
          <p className="text-center text-3xl font-bold tabular-nums text-white">
            {current ? fmt(current, prefs.notationMode === 'wca') : '✓'}
          </p>
          <p className="text-center text-[11px] text-slate-400">
            {finished || stepIndex >= total ? `Terminé · ${total} coups` : `Coup ${stepIndex + 1} / ${total}`}
          </p>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, pct)}%` }} />
          </div>
          <div className="flex justify-center gap-2">
            <button type="button" onClick={onPrev} className="rounded border border-slate-600 px-2 py-1 text-xs">
              Précédent
            </button>
            {finished ? (
              <button
                type="button"
                onClick={onRestart}
                className="rounded border border-emerald-400 bg-emerald-600/80 px-3 py-1 text-xs font-semibold text-white"
              >
                Recommencer
              </button>
            ) : playing ? (
              <button type="button" onClick={onPause} className="rounded border border-slate-600 px-2 py-1 text-xs">
                Pause
              </button>
            ) : (
              <button type="button" onClick={onPlay} className="rounded border border-slate-600 px-2 py-1 text-xs">
                Lire
              </button>
            )}
            <button type="button" onClick={onNext} className="rounded border border-slate-600 px-2 py-1 text-xs">
              Suivant
            </button>
          </div>
          <label className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
            Vitesse
            <input
              type="range"
              min={0}
              max={PLAY_SPEEDS.length - 1}
              step={1}
              value={Math.max(0, PLAY_SPEEDS.indexOf(prefs.playSpeed))}
              onChange={(e) => updatePrefs({ playSpeed: PLAY_SPEEDS[Number(e.target.value)] })}
              className="w-28"
            />
            <span className="tabular-nums text-emerald-200">×{prefs.playSpeed}</span>
          </label>
          <ol className="flex flex-wrap gap-1 text-[11px] text-slate-400">
            {moves.map((m, i) => (
              <li key={`${m}-${i}`}>
                <button
                  type="button"
                  onClick={() => onJump?.(i)}
                  className={`rounded px-1 py-0.5 font-mono hover:bg-emerald-900/80 hover:text-white ${
                    i === stepIndex && !finished
                      ? 'font-bold text-emerald-300 ring-1 ring-emerald-400/70'
                      : i < stepIndex
                        ? 'text-slate-600'
                        : 'text-slate-400'
                  }`}
                  title={`Revenir juste avant ${m}`}
                >
                  {fmt(m, true)}
                </button>
              </li>
            ))}
          </ol>
          <p className="text-center text-[10px] text-slate-600">Clique un coup pour revoir l&apos;état du cube à ce moment.</p>
        </div>
      ) : null}

      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-200/80">
          Méthode débutant (état réel)
        </h4>
        <ul className="space-y-1.5">
          {steps.map((step) => {
            const done = Boolean(lbl?.flags?.[step.id]);
            const currentStep = lbl?.currentId === step.id && !lbl?.flags?.pll;
            return (
              <li
                key={step.id}
                className={`flex items-center gap-2 rounded-md px-2 py-1 text-sm ${
                  currentStep ? 'bg-emerald-950/80 text-emerald-100' : 'text-slate-300'
                }`}
              >
                <span className={done ? 'text-emerald-400' : 'text-slate-600'}>{done ? '✓' : '○'}</span>
                {step.label}
              </li>
            );
          })}
        </ul>
      </div>

      <div>
        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Historique local</h4>
        {history.length === 0 ? (
          <p className="text-xs text-slate-600">Aucune résolution enregistrée sur cet appareil.</p>
        ) : (
          <ul className="space-y-1 text-xs text-slate-400">
            {history.slice(0, 8).map((row) => (
              <li key={row.id}>
                {new Date(row.at).toLocaleString('fr-FR')} · {row.moves} coups
                {row.finished ? ' · terminé' : ' · en cours'}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
