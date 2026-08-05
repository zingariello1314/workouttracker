import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from '../../../utils/translations';
import { getAnatomyFamily, getAnatomyMuscle } from '../../../data/anatomy/anatomyRegistry';

/** Onglets Accueil · Famille · Fiche muscle + fil d’Ariane (maquettes). */
export default function AnatomyShell({
  mode,
  familyId,
  muscleId,
  onAccueil,
  onFamille,
  onFiche,
  children
}) {
  const t = useTranslation();
  const family = familyId ? getAnatomyFamily(familyId) : null;
  const muscle = muscleId ? getAnatomyMuscle(muscleId) : null;

  const tabClass = (active) =>
    `rounded-full px-4 py-1.5 text-xs font-medium border transition-colors ${
      active
        ? 'border-cyan-500/60 bg-cyan-950/40 text-cyan-100'
        : 'border-slate-600/50 text-slate-400 hover:text-slate-200 hover:border-slate-500'
    }`;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
          <button type="button" onClick={onAccueil} className="text-cyan-500/90 hover:text-cyan-400">
            {t('anatomy.title', 'Anatomie')}
          </button>
          {family ? (
            <>
              <ChevronRight className="h-3 w-3 opacity-50" />
              <button
                type="button"
                onClick={() => onFamille?.(familyId)}
                className="text-cyan-500/90 hover:text-cyan-400"
              >
                {family.name}
              </button>
            </>
          ) : null}
          {muscle ? (
            <>
              <ChevronRight className="h-3 w-3 opacity-50" />
              <span className="text-slate-300">{muscle.name}</span>
            </>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <button type="button" className={tabClass(mode === 'accueil')} onClick={onAccueil}>
            {t('anatomy.tabHome', 'Accueil')}
          </button>
          <button
            type="button"
            className={tabClass(mode === 'famille')}
            disabled={!familyId}
            onClick={() => familyId && onFamille?.(familyId)}
          >
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
