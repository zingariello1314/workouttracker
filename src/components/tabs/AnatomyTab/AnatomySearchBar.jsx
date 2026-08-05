import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { useTranslation } from '../../../utils/translations';
import { searchAnatomy } from '../../../services/anatomy/anatomySearch';

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
      <div className="flex items-center gap-2 rounded-xl border border-teal-700/40 bg-black/60 px-4 py-3 shadow-lg">
        <Search className="h-5 w-5 text-teal-400 shrink-0" />
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
          className="flex-1 bg-transparent text-white placeholder:text-slate-500 outline-none text-sm"
          autoComplete="off"
        />
      </div>
      {open && query.trim().length > 0 && hits.length > 0 ? (
        <ul className="absolute z-30 mt-2 w-full rounded-xl border border-slate-700/80 bg-slate-950 shadow-2xl overflow-hidden">
          {hits.map((hit) => (
            <li key={`${hit.kind}-${hit.id}`}>
              <button
                type="button"
                className="w-full text-left px-4 py-2.5 hover:bg-teal-950/50 flex justify-between gap-3 text-sm"
                onClick={() => pick(hit)}
              >
                <span className="text-slate-100">{hit.label}</span>
                <span className="text-[10px] uppercase tracking-wide text-slate-500 shrink-0">
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
