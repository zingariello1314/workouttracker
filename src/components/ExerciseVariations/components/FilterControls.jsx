import React from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';

const FilterControls = ({
  searchTerm,
  setSearchTerm,
  selectedDifficulty,
  setSelectedDifficulty,
  selectedCategory,
  setSelectedCategory,
  selectedMuscleGroup,
  setSelectedMuscleGroup,
  selectedEquipment,
  setSelectedEquipment,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  showFilters,
  setShowFilters,
  difficulties,
  categories,
  muscleGroups,
  equipmentOptions,
  clearAllFilters,
  hasActiveFilters
}) => {
  return (
    <div className="mb-6">
      {/* Search and Filter Toggle */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Rechercher une variation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all ${
            showFilters ? 'bg-blue-600 text-white' : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700'
          }`}
        >
          <Filter size={20} />
          Filtres
          <ChevronDown 
            size={16} 
            className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`} 
          />
        </button>

        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-2 px-4 py-3 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition-all"
          >
            <X size={16} />
            Effacer
          </button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Difficulté</label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Toutes</option>
                {difficulties.map((diff) => (
                  <option key={diff.value} value={diff.value}>
                    {diff.icon} {diff.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Catégorie</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Toutes</option>
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Muscle Group Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Groupe musculaire</label>
              <select
                value={selectedMuscleGroup}
                onChange={(e) => setSelectedMuscleGroup(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous</option>
                {muscleGroups.map((muscle) => (
                  <option key={muscle} value={muscle}>
                    {muscle}
                  </option>
                ))}
              </select>
            </div>

            {/* Equipment Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Équipement</label>
              <select
                value={selectedEquipment}
                onChange={(e) => setSelectedEquipment(e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous</option>
                {equipmentOptions.map((equipment) => (
                  <option key={equipment} value={equipment}>
                    {equipment}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Trier par</label>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="name">Nom</option>
                  <option value="difficulty">Difficulté</option>
                  <option value="category">Catégorie</option>
                  <option value="rating">Note</option>
                  <option value="dateAdded">Date</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-lg text-white transition-all"
                  title={sortOrder === 'asc' ? 'Croissant' : 'Décroissant'}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-slate-700">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm text-slate-400">Filtres actifs:</span>
                {selectedDifficulty && (
                  <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded-full text-xs flex items-center gap-1">
                    Difficulté: {difficulties.find(d => d.value === selectedDifficulty)?.label}
                    <button onClick={() => setSelectedDifficulty('')}>
                      <X size={12} />
                    </button>
                  </span>
                )}
                {selectedCategory && (
                  <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded-full text-xs flex items-center gap-1">
                    Catégorie: {categories.find(c => c.value === selectedCategory)?.label}
                    <button onClick={() => setSelectedCategory('')}>
                      <X size={12} />
                    </button>
                  </span>
                )}
                {selectedMuscleGroup && (
                  <span className="px-2 py-1 bg-purple-600/20 text-purple-400 rounded-full text-xs flex items-center gap-1">
                    Muscle: {selectedMuscleGroup}
                    <button onClick={() => setSelectedMuscleGroup('')}>
                      <X size={12} />
                    </button>
                  </span>
                )}
                {selectedEquipment && (
                  <span className="px-2 py-1 bg-orange-600/20 text-orange-400 rounded-full text-xs flex items-center gap-1">
                    Équipement: {selectedEquipment}
                    <button onClick={() => setSelectedEquipment('')}>
                      <X size={12} />
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterControls;