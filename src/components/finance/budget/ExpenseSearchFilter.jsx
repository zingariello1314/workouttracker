/**
 * Composant de recherche/filtre pour les dépenses avec debounce
 * 
 * ✅ SOLUTION 1.13 : Debounce Recherche/Filtres
 * 
 * Composant réutilisable pour filtrer les dépenses avec debounce optimisé.
 * Évite les re-renders multiples lors de la frappe.
 * 
 * @module components/finance/budget/ExpenseSearchFilter
 * @see docs/finance/ANALYSE_PROFONDE_4_SOUS_ONGLETS_BOURSE.md - Phase 1, Solution 1.13
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useDebounce } from '../../../hooks/useDebounce';
import { Search, X } from 'lucide-react';

/**
 * Hook personnalisé pour filtrer les dépenses avec debounce
 * 
 * ✅ SOLUTION 1.13 : Filtrage optimisé avec debounce
 * 
 * @param {Array} depenses - Liste des dépenses à filtrer
 * @param {number} debounceDelay - Délai de debounce en ms (défaut: 300ms)
 * @returns {Object} { searchQuery, setSearchQuery, filteredDepenses, clearSearch }
 */
export const useExpenseFilter = (depenses = [], debounceDelay = 300) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // ✅ SOLUTION 1.13 : Debounce de la recherche pour éviter filtres à chaque frappe
  const debouncedSearchQuery = useDebounce(searchQuery, debounceDelay);
  
  // ✅ OPTIMISATION : Filtrage mémoïsé avec useMemo
  const filteredDepenses = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return depenses;
    }
    
    const query = debouncedSearchQuery.toLowerCase().trim();
    
    return depenses.filter(depense => {
      // Recherche dans le titre
      const titreMatch = depense.titre?.toLowerCase().includes(query);
      
      // Recherche dans la catégorie
      const categorieMatch = depense.categorie?.toLowerCase().includes(query);
      
      // Recherche dans les notes
      const notesMatch = depense.notes?.toLowerCase().includes(query);
      
      // Recherche dans le montant (format numérique)
      const montantMatch = depense.montant?.toString().includes(query);
      
      return titreMatch || categorieMatch || notesMatch || montantMatch;
    });
  }, [depenses, debouncedSearchQuery]);
  
  const clearSearch = () => {
    setSearchQuery('');
  };
  
  return {
    searchQuery,
    setSearchQuery,
    filteredDepenses,
    clearSearch,
    hasActiveFilter: debouncedSearchQuery.trim().length > 0
  };
};

/**
 * Composant de recherche avec debounce intégré
 * 
 * ✅ SOLUTION 1.13 : Input de recherche optimisé avec debounce
 */
const ExpenseSearchFilter = ({ 
  searchQuery, 
  onSearchChange, 
  placeholder = 'Rechercher une dépense...',
  className = '',
  debounceDelay = 300 
}) => {
  const [localQuery, setLocalQuery] = useState(searchQuery || '');
  
  // ✅ SOLUTION 1.13 : Debounce local pour éviter appels multiples
  const debouncedQuery = useDebounce(localQuery, debounceDelay);
  
  // ✅ SOLUTION 1.13 : Notifier le parent quand la recherche débouncée change
  React.useEffect(() => {
    // Utiliser ref pour éviter re-render inutiles
    if (debouncedQuery !== searchQuery) {
      onSearchChange?.(debouncedQuery);
    }
  }, [debouncedQuery]); // Seulement debouncedQuery en dépendance pour éviter boucles
  
  const handleClear = () => {
    setLocalQuery('');
    onSearchChange('');
  };
  
  return (
    <div className={`relative ${className}`}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-5 w-5 text-slate-400" />
        <input
          type="text"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
        {localQuery && (
          <button
            onClick={handleClear}
            className="absolute right-3 p-1 text-slate-400 hover:text-white transition-colors"
            aria-label="Effacer la recherche"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ExpenseSearchFilter;

