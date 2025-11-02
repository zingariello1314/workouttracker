/**
 * 🔴 FIX #71-80: Composant de recherche d'activités
 * Permet de rechercher par nom, date, ou métriques
 */
import React from 'react';
import { ARIA_LABELS } from '../constants';

export default function ActivitySearch({ searchTerm, onSearchChange, searchResultsCount }) {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <div className="relative mb-4">
      <label htmlFor="activity-search" className="sr-only">
        Rechercher une activité
      </label>
      <div className="relative">
        <input
          id="activity-search"
          type="text"
          value={searchTerm || ''}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Rechercher une activité (nom, date, métriques)..."
          className="w-full px-4 py-2 pl-10 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          aria-label="Rechercher dans les activités"
          aria-describedby="search-help"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          🔍
        </div>
        {searchTerm && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            aria-label="Effacer la recherche"
          >
            ✕
          </button>
        )}
      </div>
      <p id="search-help" className="sr-only">
        Recherchez par nom d'activité, date, ou valeur de métrique (distance, durée, calories)
      </p>
      {searchTerm && (
        <div className="mt-2 text-sm text-slate-400" aria-live="polite">
          {searchResultsCount} résultat(s) trouvé(s) pour "{searchTerm}"
        </div>
      )}
    </div>
  );
}

