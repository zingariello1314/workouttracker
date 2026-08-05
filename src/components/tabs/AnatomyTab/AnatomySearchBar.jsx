import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from '../../../utils/translations';
import { searchAnatomy } from '../../../services/anatomy/anatomySearch';
import { ANATOMY } from './anatomyTheme';

export default function AnatomySearchBar({ onNavigate, placeholder }) {
  const t = useTranslation();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const hits = useMemo(() => searchAnatomy(query, { limit: 10 }), [query]);

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
              'Muscle, exercice, objectif (ex. haut des pectoraux, développé couché…)'
            )
          }
          className={`flex-1 bg-transparent text-white placeholder:text-[#8E8E93] outline-none text-sm`}
          autoComplete="off"
        />
      </div>
      {open && query.trim().length > 0 && hits.length > 0 ? (
        <ul className={`absolute z-30 mt-2 w-full ${ANATOMY.card} shadow-2xl overflow-hidden`}>
          {hits.map((hit) => (
            <li key={`${hit.kind}-${hit.id}`}>
              <button
                type="button"
                className="w-full text-left px-4 py-2.5 hover:bg-white/[0.04] flex justify-between gap-3 text-sm"
                onClick={() => pick(hit)}
              >
                <span className="text-white">{hit.label}</span>
                <span className={`text-[10px] uppercase tracking-wide shrink-0 ${ANATOMY.muted}`}>
                  {hit.kind === 'muscle'
                    ? t('anatomy.hitMuscle', 'Muscle')
                    : hit.kind === 'family'
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
  );
}
