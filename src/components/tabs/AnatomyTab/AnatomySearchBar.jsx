import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from '../../../utils/translations';
import { searchAnatomyRich } from '../../../services/anatomy/anatomySearch';
import { getAnatomyFamily, getAnatomyMuscle } from '../../../data/anatomy/anatomyRegistry';
import { ANATOMY } from './anatomyTheme';
import AnatomySearchMuscleChip from './AnatomySearchMuscleChip';
import { HighlightMatch } from './AnatomySearchHighlight';

export default function AnatomySearchBar({ onNavigate, placeholder }) {
  const t = useTranslation();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const rich = useMemo(() => searchAnatomyRich(query, { limit: 12, snippetLimit: 16, muscleChipLimit: 8 }), [query]);

  const hasResults =
    query.trim().length > 0 &&
    (rich.muscleChips.length > 0 || rich.snippets.length > 0 || rich.hits.length > 0);

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const pick = useCallback(
    (hit) => {
      setOpen(false);
      setQuery('');
      onNavigate(hit);
    },
    [onNavigate]
  );

  const pickMuscle = useCallback(
    (muscleId) => {
      setOpen(false);
      setQuery('');
      onNavigate({ kind: 'muscle', id: muscleId, label: muscleId, score: 10 });
    },
    [onNavigate]
  );

  const pickSnippet = useCallback(
    (sn) => {
      if (sn.muscleId) {
        pickMuscle(sn.muscleId);
        return;
      }
      if (sn.familyId) {
        setOpen(false);
        setQuery('');
        onNavigate({ kind: 'family', id: sn.familyId, label: sn.familyId, score: 8 });
      }
    },
    [onNavigate, pickMuscle]
  );

  return (
    <div ref={wrapRef} className="relative w-full max-w-2xl mx-auto">
      <div className={`flex items-center gap-2 ${ANATOMY.card} px-4 py-3`}>
        <Search className={`h-5 w-5 shrink-0 ${ANATOMY.accent}`} />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={
            placeholder ||
            t(
              'anatomy.searchPlaceholder',
              'Muscle, exercice, objectif (ex. pectoraux, développé couché…)'
            )
          }
          className="flex-1 bg-transparent text-white placeholder:text-[#8E8E93] outline-none text-sm"
          autoComplete="off"
        />
      </div>

      {open && hasResults ? (
        <div
          className={`absolute z-40 mt-2 w-full max-h-[min(70vh,520px)] overflow-y-auto ${ANATOMY.card} shadow-2xl`}
        >
          {rich.muscleChips.length > 0 ? (
            <div className="px-3 pt-3 pb-2 border-b border-white/[0.06]">
              <p className={`text-[10px] uppercase tracking-wider mb-2 ${ANATOMY.muted}`}>
                {t('anatomy.searchMuscles', 'Muscles')}
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {rich.muscleChips.map((c) => (
                  <AnatomySearchMuscleChip
                    key={c.muscleId}
                    muscleId={c.muscleId}
                    query={query}
                    onClick={() => pickMuscle(c.muscleId)}
                  />
                ))}
              </div>
            </div>
          ) : null}

          {rich.snippets.length > 0 ? (
            <ul className="py-1">
              <li className={`px-4 py-2 text-[10px] uppercase tracking-wider ${ANATOMY.muted}`}>
                {t('anatomy.searchInContent', 'Dans les fiches')}
              </li>
              {rich.snippets.map((sn, i) => {
                const muscleName = sn.muscleId ? getAnatomyMuscle(sn.muscleId)?.name : null;
                const familyName = sn.familyId ? getAnatomyFamily(sn.familyId)?.name : null;
                const origin = muscleName || familyName || sn.sectionTitle;
                return (
                  <li key={`${sn.muscleId || sn.familyId}-${i}`}>
                    <button
                      type="button"
                      className="w-full text-left px-4 py-3 hover:bg-white/[0.04] border-b border-white/[0.04] last:border-0"
                      onClick={() => pickSnippet(sn)}
                    >
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 mb-1">
                        <span className="text-sm font-semibold text-teal-100">{origin}</span>
                        {sn.sectionTitle && sn.sectionTitle !== origin ? (
                          <span className={`text-[11px] ${ANATOMY.muted}`}>— {sn.sectionTitle}</span>
                        ) : null}
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        <HighlightMatch
                          text={sn.excerpt}
                          highlightFrom={sn.highlightFrom}
                          highlightTo={sn.highlightTo}
                        />
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {rich.hits.filter((h) => h.kind !== 'muscle').length > 0 ? (
            <ul className="border-t border-white/[0.06]">
              <li className={`px-4 py-2 text-[10px] uppercase tracking-wider ${ANATOMY.muted}`}>
                {t('anatomy.searchAlso', 'Familles & exercices')}
              </li>
              {rich.hits
                .filter((h) => h.kind !== 'muscle')
                .map((hit) => (
                  <li key={`${hit.kind}-${hit.id}`}>
                    <button
                      type="button"
                      className="w-full text-left px-4 py-2.5 hover:bg-white/[0.04] flex justify-between gap-3 text-sm"
                      onClick={() => pick(hit)}
                    >
                      <span className="text-white">{hit.label}</span>
                      <span className={`text-[10px] uppercase tracking-wide shrink-0 ${ANATOMY.muted}`}>
                        {hit.kind === 'family'
                          ? t('anatomy.hitFamily', 'Famille')
                          : t('anatomy.hitExercise', 'Exercice')}
                        {hit.hint ? ` · ${hit.hint}` : ''}
                      </span>
                    </button>
                  </li>
                ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
