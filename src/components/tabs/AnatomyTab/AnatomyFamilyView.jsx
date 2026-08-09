import React, { useMemo } from 'react';

import { useTranslation } from '../../../utils/translations';

import AnatomyImportanceDots from './AnatomyImportanceDots';

import {

  getAnatomyFamily,

  listMusclesForFamily

} from '../../../data/anatomy/anatomyRegistry';

import { buildMuscleFamilyQuickChips } from '../../../utils/anatomy/anatomyMuscleQuickFacts';

import { ANATOMY } from './anatomyTheme';

import { AnatomySectionPanel, FamilyTextDigest } from './AnatomyContentRenderer';
import { kickerForFamilyIntro } from './anatomyDigestLayout';
import { layoutFamilySectionRows } from './familySectionRows';

import AnatomyMuscleThumbPreview from '../../anatomy/AnatomyMuscleThumbPreview';



const FAMILY_CHIPS = {

  pectoraux: ['Poussée & épaisseur', 'Musculation', 'Combat & lancers', 'Street workout', 'Escalade'],

  epaules: ['Mobilité & stabilité', 'Largeur & deltoïde', 'Street workout', 'Coiffe des rotateurs'],

  'haut-dos': [
    'Largeur & épaisseur',
    'Tractions & rowings',
    'V taper & posture',
    'Contrôle scapulaire'
  ],

  'bas-dos': [

    'Stabilisation rachis',

    'Squat & soulevé de terre',

    'Fonctionnel : essentiel',

    'Mobilité + force'

  ],

  biceps: ['Curl & tractions', 'Supination', 'Brachial & épaisseur', 'Esthétique : forte'],

  triceps: ['Pompes & dips', 'Extension coude', 'Street workout', 'Volume arrière bras'],

  'avant-bras': ['Préhension', 'Tractions', 'Carries', 'Fonctionnel : essentiel'],

  abdominaux: ['Core & gainage', 'Performances globales', 'Six-pack + profondeur', 'Street workout'],

  cuisses: ['Quadriceps + ischios', 'Force globale', 'Squat & unilatéral', 'Équilibre chaîne'],

  fessiers: ['Extension hanche', 'Puissance & course', 'Stabilité bassin', 'Hip thrust'],

  mollets: ['Gastroc + soléaire', 'Course & saut', 'Amplitude complète', 'Fréquence élevée'],

  cou: ['Posture cervicale', 'SCM & trapèze', 'Sports contact', 'Contrôle progressif'],

  tibia: ['Tibial antérieur', 'Cheville & course', 'Équilibre mollets', 'Prévention']

};



function MuscleFamilyRow({ muscle, onOpenMuscle, t }) {

  const chips = useMemo(() => buildMuscleFamilyQuickChips(muscle), [muscle]);



  return (

    <button

      type="button"

      onClick={() => onOpenMuscle(muscle.id)}

      className={`w-full flex items-center gap-3 sm:gap-4 ${ANATOMY.card} p-3 sm:p-4 text-left hover:border-[#3897F0]/25 transition-colors`}

    >

      <AnatomyMuscleThumbPreview muscle={muscle} className="self-center" />



      <div className="flex-1 min-w-0 space-y-2">

        <div className="font-semibold text-white text-sm sm:text-base leading-tight">{muscle.name}</div>

        <p className={`text-xs leading-snug line-clamp-2 ${ANATOMY.muted}`}>{muscle.summary}</p>

        {chips.length > 0 ? (

          <div className="flex flex-wrap gap-1.5">

            {chips.map((chip) => (

              <span

                key={chip}

                className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[10px] text-[#8E8E93]"

              >

                {chip}

              </span>

            ))}

          </div>

        ) : null}

        <div className="flex gap-4 pt-0.5 sm:hidden">

          <AnatomyImportanceDots

            level={muscle.functionalImportance}

            label={t('anatomy.funcShort', 'Fonctionnel')}

            variant="green"

          />

          <AnatomyImportanceDots

            level={muscle.aestheticImportance}

            label={t('anatomy.aestheticShort', 'Esthétique')}

            variant="amber"

          />

        </div>

      </div>



      <div className="hidden sm:flex flex-col justify-center gap-3 shrink-0 pl-1">

        <AnatomyImportanceDots

          level={muscle.functionalImportance}

          label={t('anatomy.funcShort', 'Fonctionnel')}

          variant="green"

        />

        <AnatomyImportanceDots

          level={muscle.aestheticImportance}

          label={t('anatomy.aestheticShort', 'Esthétique')}

          variant="amber"

        />

      </div>

    </button>

  );

}



export default function AnatomyFamilyView({ familyId, onOpenMuscle }) {

  const t = useTranslation();

  const fam = getAnatomyFamily(familyId);

  const muscles = useMemo(() => listMusclesForFamily(familyId), [familyId]);

  const sectionRows = useMemo(
    () => layoutFamilySectionRows(fam?.sections, fam?.id),
    [fam?.sections, fam?.id]
  );

  if (!fam) return null;

  const chips = FAMILY_CHIPS[fam.id] || [fam.summary];

  return (

    <div className="space-y-10 pb-16 max-w-6xl">

      <header>

        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">{fam.name}</h1>

      </header>



      <div className="space-y-4">
        <FamilyTextDigest text={fam.intro} kicker={kickerForFamilyIntro(fam.name)} />

        <div className="flex flex-wrap gap-2">

          {chips.map((c) => (

            <span
              key={c}
              className="rounded-full border border-[#3897F0]/40 bg-[#3897F0]/15 px-3 py-1 text-[11px] font-medium text-slate-100"
            >

              {c}

            </span>

          ))}

        </div>

      </div>



      {sectionRows.map((row) =>
        row.type === 'pair' ? (
          <div
            key={`${row.sections[0].id}-${row.sections[1].id}`}
            className="grid gap-5 md:grid-cols-2 md:items-stretch"
          >
            {row.sections.map((section) => (
              <AnatomySectionPanel
                key={section.id}
                section={section}
                variant="family"
                columnWidth="half"
              />
            ))}
          </div>
        ) : (
          <AnatomySectionPanel key={row.section.id} section={row.section} variant="family" />
        )
      )}



      <section>

        <h2 className={`${ANATOMY.labelUpper} mb-4`}>

          {t('anatomy.familyMusclesTitle', 'Muscles de cette famille')}

        </h2>

        <div className="space-y-2.5">

          {muscles.map((m) => (

            <MuscleFamilyRow key={m.id} muscle={m} onOpenMuscle={onOpenMuscle} t={t} />

          ))}

        </div>

      </section>



      {fam.outro ? (

        <div className="space-y-3 max-w-3xl">

          <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5eb0ff]">

            {t('anatomy.familyVision', 'Vision Momentum')}

          </h2>

          <FamilyTextDigest text={fam.outro} vision />

        </div>

      ) : null}

    </div>

  );

}


