import React, { useEffect, useMemo, useRef, useState } from 'react';
import { filterExerciseBankRows } from '../../utils/exerciseBankSearch';

const MAX_SUGGESTIONS = 12;

/**
 * Champ nom avec suggestions depuis la banque d'exercices.
 * onSelectBankExercise est appelé quand l'utilisateur choisit une entrée de la banque.
 */
export default function ExerciseBankNameAutocomplete({
  value = '',
  onChange,
  onSelectBankExercise,
  exerciseBankRows,
  placeholder = "Nom de l'exercice",
  className = ''
}) {
  const [open, setOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const rootRef = useRef(null);
  const listId = useRef(`exercise-bank-ac-${Math.random().toString(36).slice(2, 9)}`).current;

  const suggestions = useMemo(() => {
    const q = String(value || '').trim();
    if (!q) return [];
    return filterExerciseBankRows(exerciseBankRows, q).slice(0, MAX_SUGGESTIONS);
  }, [exerciseBankRows, value]);

  useEffect(() => {
    setHighlightIndex(suggestions.length > 0 ? 0 : -1);
  }, [suggestions]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const showList = open && suggestions.length > 0;

  const pickSuggestion = (row) => {
    onChange?.(row.name);
    onSelectBankExercise?.(row.key, row);
    setOpen(false);
  };

  const handleKeyDown = (e) => {
    if (!showList) {
      if (e.key === 'ArrowDown' && suggestions.length > 0) {
        setOpen(true);
        e.preventDefault();
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter' && highlightIndex >= 0) {
      e.preventDefault();
      pickSuggestion(suggestions[highlightIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange?.(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className="w-full bg-black border border-[#0F4C5C]/50 rounded px-3 py-2 text-sm"
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-controls={showList ? listId : undefined}
        aria-autocomplete="list"
      />
      {showList && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-[#0F4C5C]/55 bg-[#050A12] shadow-lg"
        >
          {suggestions.map((row, index) => (
            <li key={row.key} role="option" aria-selected={index === highlightIndex}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pickSuggestion(row)}
                onMouseEnter={() => setHighlightIndex(index)}
                className={`w-full border-b border-[#0F4C5C]/20 px-3 py-2 text-left text-sm last:border-b-0 ${
                  index === highlightIndex
                    ? 'bg-[#0F5C45]/25 text-white'
                    : 'text-slate-300 hover:bg-[#0F4C5C]/15'
                }`}
              >
                <div className="font-medium">{row.name}</div>
                <div className="text-xs text-slate-400">
                  {[row.category, row.equipment].filter(Boolean).join(' · ')}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
