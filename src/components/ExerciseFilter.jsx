import React, { useState } from 'react';
import { Filter, X, Search } from 'lucide-react';
import Button from './ui/Button';
import Input from './ui/Input';
import Badge from './ui/Badge';
import { 
  ExerciseCategories, 
  MuscleGroups, 
  Equipment, 
  Difficulty 
} from '../data/workoutProgramEnhanced';

const ExerciseFilter = ({ 
  onFilterChange, 
  activeFilters = {}, 
  exerciseCount = 0,
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Options de filtrage avec traductions françaises
  const filterOptions = {
    category: {
      label: 'Catégorie',
      options: [
        { value: ExerciseCategories.STRENGTH, label: 'Force' },
        { value: ExerciseCategories.CARDIO, label: 'Cardio' },
        { value: ExerciseCategories.CORE, label: 'Core' },
        { value: ExerciseCategories.ISOMETRIC, label: 'Isométrique' },
        { value: ExerciseCategories.FLEXIBILITY, label: 'Flexibilité' }
      ]
    },
    muscleGroup: {
      label: 'Groupe musculaire',
      options: [
        { value: MuscleGroups.CHEST, label: 'Pectoraux' },
        { value: MuscleGroups.BACK, label: 'Dos' },
        { value: MuscleGroups.SHOULDERS, label: 'Épaules' },
        { value: MuscleGroups.BICEPS, label: 'Biceps' },
        { value: MuscleGroups.TRICEPS, label: 'Triceps' },
        { value: MuscleGroups.LEGS, label: 'Jambes (global)' },
        { value: MuscleGroups.QUADS, label: 'Quadriceps' },
        { value: MuscleGroups.HAMSTRINGS, label: 'Ischio-jambiers' },
        { value: MuscleGroups.CALVES, label: 'Mollets' },
        { value: MuscleGroups.CORE, label: 'Core' },
        { value: MuscleGroups.FULL_BODY, label: 'Corps entier' }
      ]
    },
    equipment: {
      label: 'Équipement',
      options: [
        { value: Equipment.BODYWEIGHT, label: 'Poids du corps' },
        { value: Equipment.BARBELL, label: 'Barre' },
        { value: Equipment.DUMBBELL, label: 'Haltères' },
        { value: Equipment.PARALLELS, label: 'Parallèles' },
        { value: Equipment.BENCH, label: 'Banc' },
        { value: Equipment.ELASTIC, label: 'Élastique' },
        { value: Equipment.WEIGHTED_VEST, label: 'Gilet lesté' },
        { value: Equipment.HANDLES, label: 'Poignées' }
      ]
    },
    difficulty: {
      label: 'Difficulté',
      options: [
        { value: Difficulty.BEGINNER, label: 'Débutant ★☆☆☆' },
        { value: Difficulty.INTERMEDIATE, label: 'Intermédiaire ★★☆☆' },
        { value: Difficulty.ADVANCED, label: 'Avancé ★★★☆' },
        { value: Difficulty.EXPERT, label: 'Expert ★★★★' }
      ]
    }
  };

  const handleFilterChange = (filterType, value) => {
    const newFilters = { ...activeFilters };
    
    if (newFilters[filterType] === value) {
      // Désélectionner si déjà sélectionné
      delete newFilters[filterType];
    } else {
      // Sélectionner la nouvelle valeur
      newFilters[filterType] = value;
    }
    
    onFilterChange(newFilters);
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    const newFilters = { ...activeFilters };
    
    if (value.trim()) {
      newFilters.search = value.trim();
    } else {
      delete newFilters.search;
    }
    
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    onFilterChange({});
  };

  const getActiveFilterCount = () => {
    return Object.keys(activeFilters).length;
  };

  const getFilterLabel = (filterType, value) => {
    const option = filterOptions[filterType]?.options.find(opt => opt.value === value);
    return option ? option.label : value;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Barre de recherche et bouton de filtre */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Rechercher un exercice..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Button
          variant="outline"
          onClick={() => setIsOpen(!isOpen)}
          className={`relative ${getActiveFilterCount() > 0 ? 'border-blue-500 text-blue-400' : ''}`}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filtres
          {getActiveFilterCount() > 0 && (
            <Badge className="ml-2 bg-blue-500 text-white text-xs">
              {getActiveFilterCount()}
            </Badge>
          )}
        </Button>
      </div>

      {/* Filtres actifs */}
      {getActiveFilterCount() > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-slate-400">Filtres actifs:</span>
          
          {Object.entries(activeFilters).map(([filterType, value]) => {
            if (filterType === 'search') {
              return (
                <Badge 
                  key={filterType}
                  className="bg-blue-500/20 text-blue-300 border-blue-500/30 cursor-pointer"
                  onClick={() => handleSearchChange('')}
                >
                  Recherche: "{value}"
                  <X className="w-3 h-3 ml-1" />
                </Badge>
              );
            }
            
            return (
              <Badge 
                key={`${filterType}-${value}`}
                className="bg-blue-500/20 text-blue-300 border-blue-500/30 cursor-pointer"
                onClick={() => handleFilterChange(filterType, value)}
              >
                {getFilterLabel(filterType, value)}
                <X className="w-3 h-3 ml-1" />
              </Badge>
            );
          })}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-slate-400 hover:text-white text-xs"
          >
            Tout effacer
          </Button>
        </div>
      )}

      {/* Panneau de filtres */}
      {isOpen && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 space-y-4">
          {Object.entries(filterOptions).map(([filterType, config]) => (
            <div key={filterType}>
              <h4 className="text-sm font-medium text-slate-300 mb-2">
                {config.label}
              </h4>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {config.options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFilterChange(filterType, option.value)}
                    className={`text-left p-2 rounded-lg border text-sm transition-all duration-200 ${
                      activeFilters[filterType] === option.value
                        ? 'bg-blue-500/20 border-blue-500/50 text-blue-300'
                        : 'bg-slate-700/30 border-slate-600 text-slate-300 hover:border-slate-500 hover:bg-slate-700/50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          
          {/* Résumé */}
          <div className="pt-3 border-t border-slate-700">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">
                {exerciseCount} exercice{exerciseCount !== 1 ? 's' : ''} trouvé{exerciseCount !== 1 ? 's' : ''}
              </span>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseFilter;