/**
 * 🔴 FIX #71-80: Composant de recherche d'activités
 * Permet de rechercher par nom, date, ou métriques
 */
import React from 'react';

export default function ActivitySearch({ searchTerm, onSearchChange, searchResultsCount }) {
  return (
    <div className="relative mb-4 rounded-xl border-2 border-[#0F4C5C]/70 bg-black p-3 shadow-md shadow-black/40">
      <label htmlFor="activity-search" className="sr-only">
        Rechercher une activité
      </label>
      <div className="relative">
        <input
          id="activity-search"
          type="text"
          value={searchTerm || ''}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Rechercher une activité (nom, date, métriques)..."
          className="w-full px-4 py-2 pl-10 bg-black border border-[#0F4C5C]/45 rounded-lg text-teal-100 placeholder-teal-100/35 focus:outline-none focus:ring-2 focus:ring-[#0F5C45]/50"
          aria-label="Rechercher dans les activités"
          aria-describedby="search-help"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-300/70">
          🔍
        </div>
        {searchTerm && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-100/50 hover:text-teal-100 focus:outline-none focus:ring-2 focus:ring-[#0F5C45]/50 rounded"
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
        <div className="mt-2 text-sm text-sky-300/70" aria-live="polite">
          {searchResultsCount} résultat(s) trouvé(s) pour "{searchTerm}"
        </div>
      )}
    </div>
  );
}

