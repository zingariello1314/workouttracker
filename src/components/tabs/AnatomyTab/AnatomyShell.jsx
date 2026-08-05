import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from '../../../utils/translations';
import { getAnatomyFamily, getAnatomyMuscle } from '../../../data/anatomy/anatomyRegistry';
import { ANATOMY } from './anatomyTheme';

/** Onglets Accueil · Famille · Fiche muscle + fil d’Ariane (maquettes). */
export default function AnatomyShell({
  mode,
  familyId,
  muscleId,
  onAccueil,
  onFamilleCatalog,
  onOpenFamily,
  onFiche,
  children
}) {
  const t = useTranslation();
  const family = familyId ? getAnatomyFamily(familyId) : null;
  const muscle = muscleId ? getAnatomyMuscle(muscleId) : null;

  const tabClass = (active) => (active ? ANATOMY.tabOn : ANATOMY.tabOff);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap items-center gap-1 text-xs">
          <button type="button" onClick={onAccueil} className={ANATOMY.breadcrumb}>
            {t('anatomy.title', 'Anatomie')}
          </button>
          {mode === 'famille' && !family ? (
            <>
              <ChevronRight className="h-3 w-3 opacity-40 text-[#8E8E93]" />
              <span className="text-slate-300">{t('anatomy.tabFamily', 'Famille')}</span>
            </>
          ) : null}
          {family ? (
            <>
              <ChevronRight className="h-3 w-3 opacity-40 text-[#8E8E93]" />
              <button
                type="button"
                onClick={() => onOpenFamily?.(familyId)}
                className={ANATOMY.breadcrumb}
              >
                {family.name}
              </button>
            </>
          ) : null}
          {muscle ? (
            <>
              <ChevronRight className="h-3 w-3 opacity-40 text-[#8E8E93]" />
              <span className="text-white">{muscle.name}</span>
            </>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button type="button" className={tabClass(mode === 'accueil')} onClick={onAccueil}>
            {t('anatomy.tabHome', 'Accueil')}
          </button>
          <button type="button" className={tabClass(mode === 'famille')} onClick={onFamilleCatalog}>
            {t('anatomy.tabFamily', 'Famille')}
          </button>
          <button
            type="button"
            className={tabClass(mode === 'fiche')}
            disabled={!muscleId}
            onClick={() => muscleId && onFiche?.(muscleId)}
          >
            {t('anatomy.tabSheet', 'Fiche muscle')}
          </button>
        </div>
      </div>
      {children}
    </div>
  );
}
