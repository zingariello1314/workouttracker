import React, { useEffect, useMemo } from 'react';
import { METHOD_GUIDES } from '../../lib/cube/methodGuides';
import { METHOD_DEMOS } from '../../lib/cube/methodDemos';
import { DEFAULT_HOLD, schemeFromHold } from '../../lib/cube/colorScheme';
import MethodDemoPlayer from './MethodDemoPlayer';
import MethodGuideMarkdown from './MethodGuideMarkdown';

export default function RubiksMethodPage({ methodId, onBack }) {
  const guide = METHOD_GUIDES[methodId];
  const demo = METHOD_DEMOS[methodId];
  const scheme = useMemo(() => schemeFromHold(DEFAULT_HOLD.up, DEFAULT_HOLD.front), []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [methodId]);

  if (!guide || !demo) {
    return (
      <div className="mx-auto max-w-3xl px-4">
        <p className="text-sm text-slate-400">Méthode introuvable.</p>
        <button type="button" onClick={onBack} className="mt-3 text-sm text-emerald-300 underline">
          Retour aux méthodes
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-2 rounded-lg border border-emerald-700/50 bg-black/50 px-3 py-2 text-sm font-semibold text-emerald-100 hover:border-emerald-400"
      >
        ← Méthodes
      </button>

      <header className="mb-6">
        <p className="text-[11px] uppercase tracking-wide text-slate-500">{guide.aka}</p>
        <h2 className="text-2xl font-bold text-white">{guide.name}</h2>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] lg:items-start">
        <article className="min-w-0 space-y-4">
          <MethodGuideMarkdown source={guide.article} />
        </article>

        <aside className="order-first lg:sticky lg:top-24 lg:order-none">
          <p className="mb-3 text-xs text-slate-500">{guide.demoNote}</p>
          <MethodDemoPlayer demo={demo} scheme={scheme} />
        </aside>
      </div>
    </div>
  );
}
