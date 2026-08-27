import React, { useMemo, useState } from 'react';
import { METHOD_GUIDES } from '../../lib/cube/methodGuides';
import { METHOD_DEMOS } from '../../lib/cube/methodDemos';
import { DEFAULT_HOLD, schemeFromHold } from '../../lib/cube/colorScheme';
import MethodDemoPlayer from './MethodDemoPlayer';

const LIST = ['lbl', 'cfop', 'roux', 'zz', 'petrus'];

export default function RubiksMethodsView() {
  const [openId, setOpenId] = useState(null);
  const scheme = useMemo(() => schemeFromHold(DEFAULT_HOLD.up, DEFAULT_HOLD.front), []);
  const open = openId ? METHOD_GUIDES[openId] : null;
  const demo = openId ? METHOD_DEMOS[openId] : null;

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4">
      <header>
        <h2 className="mb-2 text-lg font-bold text-white">Principes et méthodes</h2>
        <p className="text-sm leading-relaxed text-slate-400">
          Un 3×3, ce n&apos;est pas 54 couleurs indépendantes : 8 coins, 12 arêtes, 6 centres fixes. Clique une méthode
          pour le détail, les différences concrètes, et une démo 3D (pas à pas ou lecture). L&apos;affichage des coups
          (« R&apos; » ou langage clair) se règle dans <strong className="text-slate-200">Paramètres</strong>.
        </p>
      </header>

      <section className="rounded-xl border border-emerald-800/40 bg-emerald-950/20 p-4 text-sm text-slate-300 space-y-2">
        <h3 className="font-semibold text-emerald-100">Solveur machine vs méthode humaine</h3>
        <p className="text-slate-400">
          L&apos;onglet Résoudre utilise Kociemba : un chemin court (~20 coups) pour un état légal. Ce n&apos;est{' '}
          <em>pas</em> LBL ni CFOP. Les démos ci-dessous montrent des <strong>formules humaines</strong> ; le cube de
          départ de chaque démo est l&apos;inverse de ces formules, pour finir résolu.
        </p>
      </section>

      <div className="grid gap-2">
        {LIST.map((id) => {
          const g = METHOD_GUIDES[id];
          const active = openId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setOpenId(active ? null : id)}
              className={`rounded-xl border px-4 py-3 text-left transition ${
                active
                  ? 'border-emerald-400 bg-emerald-500/15 text-white'
                  : 'border-slate-800 bg-black/40 text-slate-200 hover:border-emerald-700'
              }`}
            >
              <span className="block font-semibold">{g.name}</span>
              <span className="text-xs text-slate-400">{g.summary}</span>
            </button>
          );
        })}
      </div>

      {open && demo ? (
        <article className="space-y-5 rounded-xl border border-emerald-800/50 bg-black/30 p-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">{open.aka}</p>
            <h3 className="text-lg font-bold text-white">{open.name}</h3>
          </div>
          <ul className="list-disc space-y-2 pl-5 text-sm text-slate-400">
            {open.deep.map((p) => (
              <li key={p.slice(0, 40)}>{p}</li>
            ))}
          </ul>
          <p className="text-sm text-slate-300">
            <strong className="text-emerald-200/90">Par rapport aux autres : </strong>
            {open.vsOthers}
          </p>
          <p className="text-xs text-slate-500">{open.demoNote}</p>
          <MethodDemoPlayer demo={demo} scheme={scheme} />
        </article>
      ) : (
        <p className="text-sm text-slate-600">Choisis une méthode pour ouvrir le résumé et la démo 3D.</p>
      )}
    </div>
  );
}
