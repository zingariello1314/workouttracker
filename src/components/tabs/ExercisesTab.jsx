import React, { useState, useMemo, useContext, useEffect } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { WorkoutContext } from '../../context/WorkoutContext';
import { workoutProgram } from '../../data/workoutProgram';
import { convertLegacyProgram, filterExercises } from '../../utils/programUtils';
import { 
  syncExercisesFromPrograms, 
  detectProgramChanges,
  syncExercisesFromProgramsWithCategorization 
} from '../../utils/programSync';
import { ExerciseCategories, MuscleGroups, Equipment, Difficulty } from '../../data/workoutProgramEnhanced';
import ExerciseCard from '../ExerciseCard';
import ExerciseFilter from '../ExerciseFilter';
import ProgramCard from '../ProgramCard';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Activity, Target, Dumbbell, Clock, Filter, RefreshCw, Zap, AlertCircle, ArrowLeft } from 'lucide-react';

const ExercisesTab = () => {
  const { state } = useWorkout();
  const { programs, activeProgram } = useContext(WorkoutContext);
  const [filters, setFilters] = useState({});
  const [dataSource, setDataSource] = useState('default'); // 'default', 'active_program', 'all_programs'
  const [syncData, setSyncData] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [autoSync, setAutoSync] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState(null); // Pour la navigation dans les programmes
  const [viewMode, setViewMode] = useState('exercises'); // 'exercises' ou 'programs'

  // Synchronisation automatique des exercices depuis les programmes
  useEffect(() => {
    if (autoSync && (programs || activeProgram)) {
      const changes = detectProgramChanges(syncData?.previousPrograms, { programs, activeProgram });
      
      // Utiliser la fonction avec catégorisation automatique
      const syncResult = syncExercisesFromProgramsWithCategorization(
        { programs, activeProgram },
        dataSource === 'active_program' ? 'active' : 
        dataSource === 'all_programs' ? 'all' : 'default'
      );
      
      setSyncData({
        ...syncResult,
        previousPrograms: programs,
        changes
      });
      setLastSyncTime(new Date());
    }
  }, [programs, activeProgram, dataSource, autoSync, syncData?.previousPrograms]);
  // Fonction pour extraire les exercices selon la source de données
  const getExercisesFromSource = useMemo(() => {
    let sourceProgram = null;
    
    switch (dataSource) {
      case 'active_program':
        if (activeProgram && activeProgram.schedule) {
          // Convertir le programme actif au format legacy pour la compatibilité
          sourceProgram = {};
          Object.entries(activeProgram.schedule).forEach(([day, dayData]) => {
            sourceProgram[day] = {
              name: dayData.name,
              focus: dayData.focus,
              duree: dayData.duration,
              notes: dayData.notes,
              exercices: [
                // Exercices classiques
                ...(dayData.exercices || dayData.exercises || []),
                // Activités complémentaires
                ...(dayData.complementaryActivity ? [{
                  id: `complementary_${dayData.complementaryActivity.name.toLowerCase()}`,
                  name: dayData.complementaryActivity.name,
                  series: `1×${dayData.complementaryActivity.duration}min`,
                  type: dayData.complementaryActivity.type,
                  materiel: dayData.complementaryActivity.name === "Boxe" ? "Gants de boxe" : "Piscine",
                  notes: `${dayData.complementaryActivity.timeSlot} - ${dayData.complementaryActivity.benefits.join(', ')}`
                }] : [])
              ],
              etirements: dayData.etirements,
              salleVariants: dayData.salleVariants
            };
          });
        }
        break;
      case 'all_programs':
        if (selectedProgram && selectedProgram.schedule) {
          // Afficher les exercices du programme sélectionné
          sourceProgram = {};
          Object.entries(selectedProgram.schedule).forEach(([day, dayData]) => {
            sourceProgram[day] = {
              name: dayData.name,
              focus: dayData.focus,
              duree: dayData.duration,
              notes: dayData.notes,
                  exercices: [
                    // Exercices classiques
                    ...(dayData.exercices || dayData.exercises || []),
                    // Activités complémentaires
                    ...(dayData.complementaryActivity ? [{
                      id: `complementary_${dayData.complementaryActivity.name.toLowerCase()}`,
                      name: dayData.complementaryActivity.name,
                      series: `1×${dayData.complementaryActivity.duration}min`,
                      type: dayData.complementaryActivity.type,
                      materiel: dayData.complementaryActivity.name === "Boxe" ? "Gants de boxe" : "Piscine",
                      notes: `${dayData.complementaryActivity.timeSlot} - ${dayData.complementaryActivity.benefits.join(', ')}`
                    }] : [])
                  ],
              etirements: dayData.etirements,
              salleVariants: dayData.salleVariants
            };
          });
        } else if (!selectedProgram) {
          // Fusionner tous les programmes disponibles (mode programmes)
          sourceProgram = {};
          programs.forEach(program => {
            if (program.schedule) {
              Object.entries(program.schedule).forEach(([day, dayData]) => {
                const dayKey = `${program.name}_${day}`;
                sourceProgram[dayKey] = {
                  name: `${dayData.name} (${program.name})`,
                  focus: dayData.focus,
                  duree: dayData.duration,
                  notes: dayData.notes,
                  exercices: [
                    // Exercices classiques
                    ...(dayData.exercices || dayData.exercises || []),
                    // Activités complémentaires
                    ...(dayData.complementaryActivity ? [{
                      id: `complementary_${dayData.complementaryActivity.name.toLowerCase()}`,
                      name: dayData.complementaryActivity.name,
                      series: `1×${dayData.complementaryActivity.duration}min`,
                      type: dayData.complementaryActivity.type,
                      materiel: dayData.complementaryActivity.name === "Boxe" ? "Gants de boxe" : "Piscine",
                      notes: `${dayData.complementaryActivity.timeSlot} - ${dayData.complementaryActivity.benefits.join(', ')}`
                    }] : [])
                  ],
                  etirements: dayData.etirements,
                  salleVariants: dayData.salleVariants
                };
              });
            }
          });
        }
        break;
      default:
        // Utiliser le programme par défaut (workoutProgram) avec activités complémentaires
        sourceProgram = {};
        Object.entries(workoutProgram).forEach(([day, dayData]) => {
          sourceProgram[day] = {
            ...dayData,
            exercices: [
              // Exercices classiques
              ...(dayData.exercices || []),
              // Activités complémentaires
              ...(dayData.complementaryActivity ? [{
                id: `complementary_${dayData.complementaryActivity.name.toLowerCase()}`,
                name: dayData.complementaryActivity.name,
                series: `1×${dayData.complementaryActivity.duration}min`,
                type: dayData.complementaryActivity.type,
                materiel: dayData.complementaryActivity.name === "Boxe" ? "Gants de boxe" : "Piscine",
                notes: `${dayData.complementaryActivity.timeSlot} - ${dayData.complementaryActivity.benefits.join(', ')}`
              }] : [])
            ]
          };
        });
    }
    
    return sourceProgram || workoutProgram;
  }, [dataSource, activeProgram, programs, selectedProgram]);

  // Convertir le programme en format enrichi
  const enhancedProgram = useMemo(() => {
    return convertLegacyProgram(getExercisesFromSource);
  }, [getExercisesFromSource]);

  // Utiliser les exercices synchronisés ou extraits manuellement
  const allExercises = useMemo(() => {
    // Priorité aux exercices synchronisés si disponibles ET s'ils sont enrichis
    if (syncData && syncData.exercises && syncData.exercises.length > 0 && 
        syncData.exercises.some(ex => ex.category || ex.metadata)) {
      console.log('DEBUG - Utilisation des exercices synchronisés enrichis');
      return syncData.exercises;
    }
    
    // Sinon, utiliser l'extraction manuelle avec enrichissement
    console.log('DEBUG - Utilisation de l\'extraction manuelle avec enrichissement');
    const exercises = [];
    
    Object.values(enhancedProgram.days).forEach(day => {
      // Exercices principaux
      if (day.exercises) {
        exercises.push(...day.exercises);
      }
      
      // Variantes salle
      if (day.salleVariants) {
        Object.values(day.salleVariants).forEach(variant => {
          if (variant.exercises) {
            exercises.push(...variant.exercises);
          }
        });
      }
    });
    
    // Supprimer les doublons basés sur l'ID
    const uniqueExercises = exercises.filter((exercise, index, self) => 
      index === self.findIndex(e => e.id === exercise.id)
    );
    
    // Ajouter des informations sur la source
    return uniqueExercises.map(exercise => ({
      ...exercise,
      sourceDay: exercise.sourceDay || 'Programme par défaut'
    }));
  }, [enhancedProgram, syncData]);

  // Filtrer les exercices
  const filteredExercises = useMemo(() => {
    return filterExercises(allExercises, filters);
  }, [allExercises, filters]);

  // Fonction pour normaliser la structure des exercices
  const normalizeExercise = (exercise) => {
    // Si l'exercice a déjà une structure metadata complète, on la garde
    if (exercise.metadata && exercise.metadata.category && exercise.metadata.primaryMuscleGroup) {
      return exercise;
    }
    
    // Sinon, on crée/complète la structure metadata à partir des propriétés directes
    const normalized = {
      ...exercise,
      metadata: {
        ...exercise.metadata,
        category: exercise.metadata?.category || exercise.category || 'Non spécifié',
        primaryMuscleGroup: exercise.metadata?.primaryMuscleGroup || exercise.muscleGroup || 'Non spécifié',
        difficulty: exercise.metadata?.difficulty || exercise.difficulty || 'Non spécifié',
        equipment: exercise.metadata?.equipment || exercise.equipment || 'Non spécifié'
      }
    };
    
    // On s'assure aussi que les propriétés directes existent pour la compatibilité avec ExerciseCard
    normalized.category = normalized.metadata.category;
    normalized.muscleGroup = normalized.metadata.primaryMuscleGroup;
    normalized.difficulty = normalized.metadata.difficulty;
    normalized.equipment = normalized.metadata.equipment;
    
    return normalized;
  };

  // Statistiques des exercices
  const exerciseStats = useMemo(() => {
    console.log('=== DEBUG EXERCICES ===');
    console.log('DEBUG - allExercises length:', allExercises.length);
    console.log('DEBUG - Premier exercice:', allExercises[0]);
    
    // Normaliser tous les exercices avant de calculer les stats
    const normalizedExercises = allExercises.map(normalizeExercise);
    
    const stats = {
      total: normalizedExercises.length,
      byCategory: {},
      byMuscleGroup: {},
      byDifficulty: {}
    };
    
    normalizedExercises.forEach((exercise, index) => {
      if (index < 5) {
        console.log(`DEBUG - Exercice normalisé ${index + 1}:`, {
          name: exercise.name,
          metadata: exercise.metadata,
          category: exercise.metadata?.category,
          muscleGroup: exercise.metadata?.primaryMuscleGroup,
          directCategory: exercise.category,
          directMuscleGroup: exercise.muscleGroup
        });
      }
      
      // Par catégorie
      const category = exercise.metadata?.category || 'Non spécifié';
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
      
      // Par groupe musculaire
      const muscleGroup = exercise.metadata?.primaryMuscleGroup || 'Non spécifié';
      stats.byMuscleGroup[muscleGroup] = (stats.byMuscleGroup[muscleGroup] || 0) + 1;
      
      // Par difficulté
      const difficulty = exercise.metadata?.difficulty || 'Non spécifié';
      stats.byDifficulty[difficulty] = (stats.byDifficulty[difficulty] || 0) + 1;
    });
    
    console.log('DEBUG - Stats par catégorie:', stats.byCategory);
    console.log('DEBUG - Stats par groupe musculaire:', stats.byMuscleGroup);
    console.log('DEBUG - Final stats:', stats);
    return stats;
  }, [allExercises]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Débutant': return 'text-green-400';
      case 'Intermédiaire': return 'text-yellow-400';
      case 'Avancé': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Statut de synchronisation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Synchronisation automatique
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAutoSync(!autoSync)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoSync ? 'bg-blue-600' : 'bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoSync ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm font-medium">
                Synchronisation automatique {autoSync ? 'activée' : 'désactivée'}
              </span>
            </div>
            
            {lastSyncTime && (
              <div className="text-sm text-slate-400">
                Dernière sync: {lastSyncTime.toLocaleTimeString()}
              </div>
            )}
          </div>
          
          {syncData && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>
                  {syncData.totalExercises} exercices synchronisés depuis {syncData.sourceInfo.name}
                </span>
              </div>
              
              {syncData.categorizationApplied && (
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <Zap className="w-4 h-4" />
                  <span>
                    Catégorisation automatique appliquée ({syncData.categorizationTimestamp ? new Date(syncData.categorizationTimestamp).toLocaleTimeString() : 'maintenant'})
                  </span>
                </div>
              )}
              
              {syncData.changes && syncData.changes.hasChanges && (
                <div className="flex items-center gap-2 text-sm text-yellow-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>
                    Changements détectés: {syncData.changes.changeType}
                  </span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Source des exercices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setDataSource('default');
                setViewMode('exercises');
                setSelectedProgram(null);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                dataSource === 'default'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              Programme par défaut
            </button>
            <button
              onClick={() => {
                setDataSource('active_program');
                setViewMode('exercises');
                setSelectedProgram(null);
              }}
              disabled={!activeProgram}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                dataSource === 'active_program'
                  ? 'bg-blue-500 text-white shadow-md'
                  : activeProgram
                  ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              Programme actif {activeProgram ? `(${activeProgram.name})` : '(Aucun)'}
            </button>
            <button
              onClick={() => {
                setDataSource('all_programs');
                setViewMode('programs');
                setSelectedProgram(null);
              }}
              disabled={programs.length === 0}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                dataSource === 'all_programs'
                  ? 'bg-blue-500 text-white shadow-md'
                  : programs.length > 0
                  ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              Tous les programmes ({programs.length})
            </button>
          </div>
          <div className="mt-3 text-sm text-slate-400">
            {dataSource === 'default' && 'Affichage des exercices du programme par défaut'}
            {dataSource === 'active_program' && activeProgram && `Affichage des exercices du programme "${activeProgram.name}"`}
            {dataSource === 'active_program' && !activeProgram && 'Aucun programme actif sélectionné'}
            {dataSource === 'all_programs' && viewMode === 'programs' && `Sélectionnez un programme parmi les ${programs.length} disponibles`}
            {dataSource === 'all_programs' && viewMode === 'exercises' && selectedProgram && `Affichage des exercices du programme "${selectedProgram.name}"`}
          </div>
        </CardContent>
      </Card>

      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Dumbbell className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total exercices</p>
                <p className="text-xl font-bold text-white">{exerciseStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Target className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Catégories</p>
                <p className="text-xl font-bold text-white">
                  {Object.keys(exerciseStats.byCategory).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Activity className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Groupes musculaires</p>
                <p className="text-xl font-bold text-white">
                  {Object.keys(exerciseStats.byMuscleGroup).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Clock className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Filtrés</p>
                <p className="text-xl font-bold text-white">{filteredExercises.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres - Affichés seulement en mode exercices */}
      {viewMode === 'exercises' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtres et recherche
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ExerciseFilter
              onFilterChange={handleFilterChange}
              activeFilters={filters}
              exerciseCount={filteredExercises.length}
            />
          </CardContent>
        </Card>
      )}

      {/* Navigation de retour - Affichée quand on visualise les exercices d'un programme spécifique */}
      {viewMode === 'exercises' && selectedProgram && (
        <Card>
          <CardContent className="py-3">
            <button
              onClick={() => {
                setViewMode('programs');
                setSelectedProgram(null);
              }}
              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à la liste des programmes
            </button>
          </CardContent>
        </Card>
      )}

      {/* Contenu principal - Programmes ou Exercices */}
      {viewMode === 'programs' ? (
        // Vue des programmes
        <Card>
          <CardHeader>
            <CardTitle>
              Programmes disponibles ({programs.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {programs.length === 0 ? (
              <div className="text-center py-12">
                <Target className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400 text-lg mb-2">Aucun programme trouvé</p>
                <p className="text-slate-500 text-sm">
                  Créez votre premier programme dans l'onglet Programmes
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {programs.map((program) => (
                  <ProgramCard
                    key={program.id}
                    program={program}
                    isActive={activeProgram && activeProgram.id === program.id}
                    onClick={() => {
                      setSelectedProgram(program);
                      setViewMode('exercises');
                    }}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        // Vue des exercices
        <Card>
          <CardHeader>
            <CardTitle>
              Exercices ({filteredExercises.length})
              {selectedProgram && ` - ${selectedProgram.name}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredExercises.length === 0 ? (
              <div className="text-center py-12">
                <Dumbbell className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400 text-lg mb-2">Aucun exercice trouvé</p>
                <p className="text-slate-500 text-sm">
                  {selectedProgram 
                    ? `Le programme "${selectedProgram.name}" ne contient aucun exercice`
                    : 'Essayez de modifier vos critères de recherche ou de filtrage'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredExercises.map((exercise) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    onToggleComplete={() => {}}
                    isCompleted={false}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ExercisesTab;