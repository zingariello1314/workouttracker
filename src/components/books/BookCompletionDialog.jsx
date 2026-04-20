import React, { useEffect, useState } from 'react';
import { Star } from 'lucide-react';

export default function BookCompletionDialog({ pending, onConfirm, onDismiss }) {
  const [score, setScore] = useState(7);

  useEffect(() => {
    if (!pending) return;
    const s = Number(pending.suggestedScore);
    setScore(Number.isFinite(s) ? Math.min(10, Math.max(0, Math.round(s))) : 7);
  }, [pending]);

  if (!pending) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="book-completion-title"
        className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-slate-950 shadow-2xl p-6 space-y-4"
      >
        <div className="flex items-center gap-2 text-amber-200">
          <Star className="w-6 h-6 fill-amber-400/30" />
          <h2 id="book-completion-title" className="text-lg font-bold text-white">
            Fin du livre atteinte
          </h2>
        </div>
        <p className="text-sm text-slate-300">
          Les pages enregistrées sur <span className="font-semibold text-white">{pending.bookTitle}</span>{' '}
          atteignent ou dépassent le total ({pending.cumPages} / {pending.totalPagesBook}). Tu peux marquer le livre
          comme terminé et lui donner ta note personnelle (0–10).
        </p>
        <p className="text-xs text-slate-400">
          Note suggérée d’après tes retours de lecture (moyenne des critères sur les sessions) :{' '}
          <span className="font-mono text-amber-200">{Number(pending.suggestedScore).toFixed(1)}</span>/10
        </p>
        <div className="space-y-2">
          <label className="text-xs text-slate-400 block" htmlFor="completion-score">
            Ta note personnelle (0 = passer pour l’instant)
          </label>
          <input
            id="completion-score"
            type="range"
            min={0}
            max={10}
            step={1}
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            className="w-full accent-amber-400"
          />
          <p className="text-center font-mono text-amber-100 text-lg">{score}/10</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end pt-2">
          <button
            type="button"
            onClick={onDismiss}
            className="px-4 py-2 rounded-lg border border-slate-600 text-slate-200 text-sm hover:bg-slate-800"
          >
            Plus tard
          </button>
          <button
            type="button"
            onClick={() => onConfirm(score)}
            className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 text-sm font-semibold hover:bg-amber-400"
          >
            Enregistrer terminé + note
          </button>
        </div>
      </div>
    </div>
  );
}
