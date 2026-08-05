import React, { useMemo } from 'react';
import { useTranslation } from '../../../utils/translations';
import AnatomyImportanceDots from './AnatomyImportanceDots';
import {
  getAnatomyFamily,
  listMusclesForFamily
} from '../../../data/anatomy/anatomyRegistry';

const FAMILY_CHIPS = {
  pectoraux: ['Rôle : poussée horizontale', 'Musculation', 'Street workout', 'Esthétique : forte'],
  epaules: ['Mobilité', 'Musculation', 'Coiffe', 'Esthétique : forte'],
  'haut-dos': [
    'Largeur & épaisseur',
    'Tractions & tirages',
    'Posture & épaules',
    'Esthétique : forte'
  ],
  'bas-dos': [
    'Stabilisation rachis',
    'Squat & soulevé de terre',
    'Fonctionnel : essentiel',
    'Mobilité + force'
  ],
  bras: ['Biceps + triceps', 'Street workout', 'Tractions & poussée', 'Esthétique : forte'],
  'avant-bras': ['Préhension', 'Tractions', 'Carries', 'Fonctionnel : essentiel'],
  abdominaux: ['Core & gainage', 'Performances globales', 'Six-pack + profondeur', 'Street workout'],
  cuisses: ['Quadriceps + ischios', 'Force globale', 'Squat & unilatéral', 'Équilibre chaîne'],
  fessiers: ['Extension hanche', 'Puissance & course', 'Stabilité bassin', 'Hip thrust'],
  mollets: ['Gastroc + soléaire', 'Course & saut', 'Amplitude complète', 'Fréquence élevée'],
  cou: ['Posture cervicale', 'SCM & trapèze', 'Sports contact', 'Contrôle progressif'],
  tibia: ['Tibial antérieur', 'Cheville & course', 'Équilibre mollets', 'Prévention']
};

function MuscleMiniThumb({ visualGroupId }) {
  const accent = visualGroupId ? 'bg-cyan-500/25 border-cyan-500/40' : 'bg-slate-800 border-slate-700';
  return (
    <div
      className={`h-16 w-14 shrink-0 rounded-lg border ${accent} flex items-end justify-center pb-2`}
      aria-hidden
    >
      <div className="h-6 w-8 rounded-t-md bg-cyan-400/35" />
    </div>
  );
}

export default function AnatomyFamilyView({ familyId, onOpenMuscle }) {
  const t = useTranslation();
  const fam = getAnatomyFamily(familyId);
  const muscles = useMemo(() => listMusclesForFamily(familyId), [familyId]);

  if (!fam) return null;

  const chips = FAMILY_CHIPS[fam.id] || [fam.summary];

  return (
    <div className="space-y-8 pb-16">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-white">{fam.name}</h1>
      </header>

      <div className="rounded-2xl border border-slate-700/40 bg-slate-950/35 p-5 md:p-7 space-y-4">
        <p className="text-sm text-slate-300 leading-relaxed">{fam.intro}</p>
        <div className="flex flex-wrap gap-2">
          {chips.map((c) => (
            <span
              key={c}
              className="rounded-full border border-slate-600/50 px-3 py-1 text-[11px] text-slate-400"
            >
              {c}
            </span>
          ))}
        </div>
      </div>

      <section>
        <h2 className="text-[11px] font-medium uppercase tracking-wider text-slate-500 mb-4">
          {t('anatomy.familyMusclesTitle', 'Muscles de cette famille')}
        </h2>
        <div className="space-y-3">
          {muscles.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onOpenMuscle(m.id)}
              className="w-full flex items-center gap-4 rounded-2xl border border-slate-700/45 bg-slate-950/40 p-4 text-left hover:border-cyan-600/35 hover:bg-slate-900/50 transition-colors"
            >
              <MuscleMiniThumb visualGroupId={m.visualGroupId} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-100">{m.name}</div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{m.summary}</p>
              </div>
              <div className="hidden sm:flex gap-4 shrink-0">
                <AnatomyImportanceDots
                  level={m.functionalImportance}
                  label={t('anatomy.funcShort', 'Fonctionnel')}
                  variant="green"
                />
                <AnatomyImportanceDots
                  level={m.aestheticImportance}
                  label={t('anatomy.aestheticShort', 'Esthétique')}
                  variant="amber"
                />
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
