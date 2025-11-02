/**
 * 🔴 FIX #71-80: Composant de filtres avancés pour les activités
 * Permet de filtrer par type, date, distance, durée, calories, etc.
 */
import React from 'react';
import { ARIA_LABELS } from '../constants';

export default function AdvancedFilters({ filters, onFiltersChange, activitiesCount }) {
  const [isOpen, setIsOpen] = React.useState(false);

  const filterTypes = [
    { value: 'all', label: 'Toutes' },
    { value: 'swimming', label: 'Natation' },
    { value: 'jumpRope', label: 'Corde à sauter' },
    { value: 'cardio', label: 'Cardio' }
  ];

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">🔍 Filtres Avancés</h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Ouvrir/Fermer les filtres avancés"
          aria-expanded={isOpen}
          className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {isOpen ? 'Masquer' : 'Afficher'}
        </button>
      </div>

      {isOpen && (
        <div className="space-y-4" role="group" aria-label="Options de filtrage">
          {/* Type d'activité */}
          <div>
            <label className="block text-slate-300 text-sm mb-2" htmlFor="filter-type">
              Type d'activité
            </label>
            <select
              id="filter-type"
              value={filters.type || 'all'}
              onChange={(e) => onFiltersChange({ ...filters, type: e.target.value })}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Filtrer par type d'activité"
            >
              {filterTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          {/* Plage de dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 text-sm mb-2" htmlFor="filter-start-date">
                Date début
              </label>
              <input
                id="filter-start-date"
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => onFiltersChange({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Date de début pour le filtre"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm mb-2" htmlFor="filter-end-date">
                Date fin
              </label>
              <input
                id="filter-end-date"
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => onFiltersChange({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Date de fin pour le filtre"
              />
            </div>
          </div>

          {/* Distance */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 text-sm mb-2" htmlFor="filter-min-distance">
                Distance min (km)
              </label>
              <input
                id="filter-min-distance"
                type="number"
                min="0"
                step="0.1"
                value={filters.minDistance || ''}
                onChange={(e) => onFiltersChange({ ...filters, minDistance: e.target.value ? parseFloat(e.target.value) : null })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                aria-label="Distance minimum en kilomètres"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm mb-2" htmlFor="filter-max-distance">
                Distance max (km)
              </label>
              <input
                id="filter-max-distance"
                type="number"
                min="0"
                step="0.1"
                value={filters.maxDistance || ''}
                onChange={(e) => onFiltersChange({ ...filters, maxDistance: e.target.value ? parseFloat(e.target.value) : null })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="∞"
                aria-label="Distance maximum en kilomètres"
              />
            </div>
          </div>

          {/* Durée */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 text-sm mb-2" htmlFor="filter-min-duration">
                Durée min (min)
              </label>
              <input
                id="filter-min-duration"
                type="number"
                min="0"
                value={filters.minDuration || ''}
                onChange={(e) => onFiltersChange({ ...filters, minDuration: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                aria-label="Durée minimum en minutes"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm mb-2" htmlFor="filter-max-duration">
                Durée max (min)
              </label>
              <input
                id="filter-max-duration"
                type="number"
                min="0"
                value={filters.maxDuration || ''}
                onChange={(e) => onFiltersChange({ ...filters, maxDuration: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="∞"
                aria-label="Durée maximum en minutes"
              />
            </div>
          </div>

          {/* Calories */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 text-sm mb-2" htmlFor="filter-min-calories">
                Calories min
              </label>
              <input
                id="filter-min-calories"
                type="number"
                min="0"
                value={filters.minCalories || ''}
                onChange={(e) => onFiltersChange({ ...filters, minCalories: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                aria-label="Calories minimum"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm mb-2" htmlFor="filter-max-calories">
                Calories max
              </label>
              <input
                id="filter-max-calories"
                type="number"
                min="0"
                value={filters.maxCalories || ''}
                onChange={(e) => onFiltersChange({ ...filters, maxCalories: e.target.value ? parseInt(e.target.value) : null })}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="∞"
                aria-label="Calories maximum"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-slate-700">
            <button
              onClick={() => {
                onFiltersChange({
                  type: 'all',
                  startDate: null,
                  endDate: null,
                  minDistance: null,
                  maxDistance: null,
                  minDuration: null,
                  maxDuration: null,
                  minCalories: null,
                  maxCalories: null
                });
              }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Réinitialiser tous les filtres"
            >
              Réinitialiser
            </button>
            <div className="flex-1 text-right text-slate-400 text-sm flex items-center justify-end">
              {activitiesCount} activité(s) correspondante(s)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

