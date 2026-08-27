import React, { useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useRubiksPrefs } from '../../hooks/useRubiksPrefs';
import { formatMove } from '../../lib/cube/notation';
import { DEFAULT_SCHEME } from '../../lib/cube/colorScheme';
import { spinMoves, translatingMoves } from '../../lib/cube/stickerMotion';

function PadBtn({ label, sub, onClick, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="min-w-[3.2rem] rounded-lg border border-emerald-700/60 bg-black/70 px-2 py-2 text-center disabled:opacity-30 hover:border-emerald-400"
    >
      <span className="block text-lg leading-none text-white">{label}</span>
      {sub ? <span className="mt-0.5 block max-w-[7rem] truncate text-[9px] text-emerald-200/80">{sub}</span> : null}
    </button>
  );
}

export default function CubeSteerHud({
  selected,
  screenDirs,
  scheme = DEFAULT_SCHEME,
  disabled,
  onMove,
  onDeselect,
  children
}) {
  const { isFrench } = useLanguage();
  const [prefs] = useRubiksPrefs();
  const fmt = (tok) =>
    formatMove(tok, { scheme, mode: prefs.notationMode, lang: isFrench ? 'fr' : 'en', compact: true });

  useEffect(() => {
    const onKey = (e) => {
      if (disabled || !selected) return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable) return;
      const dirs = screenDirs || {};
      if (e.key === 'ArrowUp' && dirs.up) {
        e.preventDefault();
        onMove(e.shiftKey ? `${dirs.up.replace("'", '')}2` : dirs.up);
      } else if (e.key === 'ArrowDown' && dirs.down) {
        e.preventDefault();
        onMove(e.shiftKey ? `${dirs.down.replace("'", '')}2` : dirs.down);
      } else if (e.key === 'ArrowLeft' && dirs.left) {
        e.preventDefault();
        onMove(e.shiftKey ? `${dirs.left.replace("'", '')}2` : dirs.left);
      } else if (e.key === 'ArrowRight' && dirs.right) {
        e.preventDefault();
        onMove(e.shiftKey ? `${dirs.right.replace("'", '')}2` : dirs.right);
      } else if (e.key === 'q' || e.key === 'Q') {
        e.preventDefault();
        onMove(`${selected.face}'`);
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        onMove(selected.face);
      } else if (e.key === '2') {
        e.preventDefault();
        onMove(`${selected.face}2`);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onDeselect?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [disabled, onDeselect, onMove, screenDirs, selected]);

  const trans = selected ? translatingMoves(selected.face, selected.index) : [];
  const spins = selected ? spinMoves(selected.face) : [];
  const dirs = screenDirs || {};

  return (
    <div className="space-y-2">
      {children}
      <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-3 text-xs text-slate-400">
        {!selected ? (
          <p>
            Clique une pastille (comme une pièce sur chess.com). Des flèches vertes montrent où elle ira. Puis utilise
            les flèches du clavier / du pavé, ou ↺ ↻ pour tourner <em>sa</em> face sur elle-même.
          </p>
        ) : (
          <p>
            Pastille sur la face <span className="text-emerald-200">{selected.face}</span>. Flèches écran = déplacer
            cette case. <kbd className="text-slate-300">Q</kbd>/<kbd className="text-slate-300">E</kbd> = face ↺/↻,{' '}
            <kbd className="text-slate-300">2</kbd> = demi-tour de face, Shift+flèche = demi-tour dans cet axe.
          </p>
        )}
      </div>
      <div className="flex flex-col items-center gap-2">
        <PadBtn
          label="↑"
          sub={dirs.up ? fmt(dirs.up) : '—'}
          disabled={disabled || !dirs.up}
          onClick={() => dirs.up && onMove(dirs.up)}
        />
        <div className="flex items-center gap-2">
          <PadBtn
            label="←"
            sub={dirs.left ? fmt(dirs.left) : '—'}
            disabled={disabled || !dirs.left}
            onClick={() => dirs.left && onMove(dirs.left)}
          />
          <div className="flex gap-1">
            {spins.map((s) => (
              <PadBtn
                key={s.move}
                label={s.move.includes('2') ? '180°' : s.move.includes("'") ? '↺' : '↻'}
                sub={fmt(s.move)}
                disabled={disabled || !selected}
                onClick={() => onMove(s.move)}
              />
            ))}
          </div>
          <PadBtn
            label="→"
            sub={dirs.right ? fmt(dirs.right) : '—'}
            disabled={disabled || !dirs.right}
            onClick={() => dirs.right && onMove(dirs.right)}
          />
        </div>
        <PadBtn
          label="↓"
          sub={dirs.down ? fmt(dirs.down) : '—'}
          disabled={disabled || !dirs.down}
          onClick={() => dirs.down && onMove(dirs.down)}
        />
      </div>
      {trans.length > 0 ? (
        <div className="flex flex-wrap justify-center gap-1">
          {trans.map((t) => (
            <button
              key={t.move}
              type="button"
              disabled={disabled}
              onClick={() => onMove(t.move)}
              className="rounded border border-slate-700 px-2 py-1 text-[10px] text-slate-300 hover:border-emerald-500"
            >
              {fmt(t.move)}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
