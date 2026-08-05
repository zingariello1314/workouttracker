import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from '../../../utils/translations';
import {
  ANATOMY_FAMILY_ORDER,
  getAnatomyFamily,
  listMusclesForFamily
} from '../../../data/anatomy/anatomyRegistry';
import { ANATOMY } from './anatomyTheme';

/** Liste de toutes les familles — onglet Famille. */
export default function AnatomyFamiliesIndexView({ onOpenFamily }) {
  const t = useTranslation();

  return (
    <div className="space-y-6">
      <header>
        <p className={ANATOMY.sheetKicker}>{t('anatomy.tabFamily', 'Famille')}</p>
        <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight mt-1">
          {t('anatomy.allFamiliesTitle', 'Familles musculaires')}
        </h1>
        <p className={`mt-2 max-w-2xl ${ANATOMY.summary}`}>
          {t(
            'anatomy.allFamiliesSubtitle',
            'Choisis une famille pour voir sa présentation et parcourir chaque muscle.'
          )}
        </p>
      </header>

      <div className={`${ANATOMY.card} overflow-hidden divide-y divide-white/[0.06]`}>
        {ANATOMY_FAMILY_ORDER.map((fid) => {
          const fam = getAnatomyFamily(fid);
          if (!fam) return null;
          const muscles = listMusclesForFamily(fid);
          return (
            <button
              key={fid}
              type="button"
              onClick={() => onOpenFamily(fid)}
              className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors ${ANATOMY.listRowHover}`}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full border border-[#3897F0]/40 bg-[#3897F0]/20" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-white text-sm">{fam.name}</div>
                <div className={`text-xs truncate ${ANATOMY.muted}`}>{fam.summary}</div>
              </div>
              <span
                className={`shrink-0 rounded-full border border-white/10 px-2 py-0.5 text-[10px] tabular-nums ${ANATOMY.muted}`}
              >
                {muscles.length} {t('anatomy.muscleCount', 'muscles')}
              </span>
              <ChevronRight className={`h-4 w-4 shrink-0 ${ANATOMY.accent}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
