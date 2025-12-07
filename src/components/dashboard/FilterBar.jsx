/**
 * FilterBar Component
 * Barre de filtres avancés avec multi-select et reset
 */

import { useState } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';

const FilterBar = ({ filters, onFilterChange, onReset }) => {
  const [openFilter, setOpenFilter] = useState(null);

  const toggleFilter = (filterKey) => {
    setOpenFilter(openFilter === filterKey ? null : filterKey);
  };

  const handleOptionToggle = (filterKey, optionValue) => {
    const currentValues = filters[filterKey]?.value || [];
    const newValues = currentValues.includes(optionValue)
      ? currentValues.filter(v => v !== optionValue)
      : [...currentValues, optionValue];
    
    onFilterChange(filterKey, newValues);
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).reduce((count, filter) => {
      return count + (filter.value?.length || 0);
    }, 0);
  };

  const activeCount = getActiveFiltersCount();

  return (
    <div className="space-y-3">
      {/* Filter Bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 text-slate-400">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filtres</span>
          {activeCount > 0 && (
            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-medium rounded-full border border-blue-500/50">
              {activeCount}
            </span>
          )}
        </div>

        {/* Filter Buttons */}
        {Object.entries(filters).map(([key, filter]) => {
          const isOpen = openFilter === key;
          const selectedCount = filter.value?.length || 0;

          return (
            <div key={key} className="relative">
              <button
                onClick={() => toggleFilter(key)}
                className={`
                  px-3 py-1.5 rounded-lg border text-sm font-medium transition-all flex items-center gap-2
                  ${selectedCount > 0
                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                    : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:border-slate-500'
                  }
                `}
              >
                {filter.label}
                {selectedCount > 0 && (
                  <span className="px-1.5 py-0.5 bg-blue-500/30 text-blue-300 text-xs rounded">
                    {selectedCount}
                  </span>
                )}
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown */}
              {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 max-h-64 overflow-y-auto">
                  {filter.options.map(option => {
                    const isSelected = filter.value?.includes(option.value);

                    return (
                      <label
                        key={option.value}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-slate-700/50 cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleOptionToggle(key, option.value)}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                        />
                        <span className="text-sm text-slate-300">{option.label}</span>
                        {option.count !== undefined && (
                          <span className="ml-auto text-xs text-slate-500">
                            {option.count}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Reset Button */}
        {activeCount > 0 && (
          <button
            onClick={onReset}
            className="px-3 py-1.5 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            Réinitialiser
          </button>
        )}
      </div>

      {/* Active Filters Tags */}
      {activeCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          {Object.entries(filters).map(([key, filter]) => {
            return filter.value?.map(value => {
              const option = filter.options.find(opt => opt.value === value);
              if (!option) return null;

              return (
                <div
                  key={`${key}-${value}`}
                  className="flex items-center gap-2 px-2 py-1 bg-blue-500/20 border border-blue-500/50 text-blue-400 text-xs rounded-lg"
                >
                  <span>{option.label}</span>
                  <button
                    onClick={() => handleOptionToggle(key, value)}
                    className="hover:text-blue-300 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            });
          })}
        </div>
      )}

      {/* Click outside to close */}
      {openFilter && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setOpenFilter(null)}
        ></div>
      )}
    </div>
  );
};

export default FilterBar;
