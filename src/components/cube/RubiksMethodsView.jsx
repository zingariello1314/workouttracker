import React from 'react';
import { METHOD_GUIDES } from '../../lib/cube/methodGuides';

const LIST = ['lbl', 'cfop', 'roux', 'zz', 'petrus'];

export default function RubiksMethodsView({ onOpenMethod }) {
  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4">
      <header>
        <h2 className="mb-2 text-lg font-bold text-white">Principes et méthodes</h2>
        <p className="text-sm leading-relaxed text-slate-400">
          Un 3×3, ce n&apos;est pas 54 couleurs indépendantes : 8 coins, 12 arêtes, 6 centres fixes. Clique une méthode
          pour ouvrir sa page : le guide complet et la démo 3D correspondante. L&apos;affichage des coups (« R&apos; » ou
          langage clair) se règle dans <strong className="text-slate-200">Paramètres</strong>.
        </p>
      </header>

      <section className="space-y-2 rounded-xl border border-emerald-800/40 bg-emerald-950/20 p-4 text-sm text-slate-300">
        <h3 className="font-semibold text-emerald-100">Solveur machine vs méthode humaine</h3>
        <p className="text-slate-400">
          L&apos;onglet Résoudre utilise Kociemba : un chemin court (~20 coups) pour un état légal. Ce n&apos;est{' '}
          <em>pas</em> LBL ni CFOP. Les démos des pages méthodes montrent des <strong>formules humaines</strong> ; le
          cube de départ de chaque démo est l&apos;inverse de ces formules, pour finir résolu.
        </p>
      </section>

      <div className="grid gap-2">
        {LIST.map((id) => {
          const g = METHOD_GUIDES[id];
          return (
            <button
              key={id}
              type="button"
              onClick={() => onOpenMethod(id)}
              className="rounded-xl border border-slate-800 bg-black/40 px-4 py-3 text-left text-slate-200 transition hover:border-emerald-700"
            >
              <span className="block font-semibold">{g.name}</span>
              <span className="text-xs text-slate-400">{g.summary}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
