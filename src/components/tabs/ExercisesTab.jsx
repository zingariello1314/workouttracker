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
import { useTranslation } from '../../utils/translations';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

const ExercisesTab = () => {
  const { state } = useWorkout();
  const { programs, activeProgram } = useContext(WorkoutContext);
  const t = useTranslation();
  const { language } = useLanguage();
  const { currentUser, isAuthenticated } = useAuth();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.username === 'zingariello1314';
  const [filters, setFilters] = useState({});
  const [dataSource, setDataSource] = useState('default'); // 'default', 'active_program', 'all_programs'
  const [syncData, setSyncData] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [autoSync, setAutoSync] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState(null); // Pour la navigation dans les programmes
  const [viewMode, setViewMode] = useState('exercises'); // 'exercises' ou 'programs'

  // ✅ Visibilité des programmes selon l'authentification
  // - invité (déconnecté) : aucun programme visible, aucun programme actif
  // - utilisateur connecté : ses propres programmes (gérés ailleurs via userId)
  const visiblePrograms = isAuthenticated ? programs : [];
  const visibleActiveProgram = isAuthenticated ? activeProgram : null;

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
        if (visibleActiveProgram && visibleActiveProgram.schedule) {
          // Convertir le programme actif au format legacy pour la compatibilité
          sourceProgram = {};
          Object.entries(visibleActiveProgram.schedule).forEach(([day, dayData]) => {
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
                  materiel: dayData.complementaryActivity.name === "Boxe" ? t('exercisesTab.equipment.boxingGloves') : t('exercisesTab.equipment.pool'),
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
                      materiel: dayData.complementaryActivity.name === "Boxe" ? t('exercisesTab.equipment.boxingGloves') : t('exercisesTab.equipment.pool'),
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
          visiblePrograms.forEach(program => {
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
                      materiel: dayData.complementaryActivity.name === "Boxe" ? t('exercisesTab.equipment.boxingGloves') : t('exercisesTab.equipment.pool'),
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
        // Utiliser le programme par défaut (workoutProgram) AVEC activités complémentaires
        // ✅ Mais uniquement pour l'admin : les autres comptes ne doivent PAS voir ton programme codé en dur
        if (isAdmin) {
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
                  materiel: dayData.complementaryActivity.name === "Boxe" ? t('exercisesTab.equipment.boxingGloves') : t('exercisesTab.equipment.pool'),
                  notes: `${dayData.complementaryActivity.timeSlot} - ${dayData.complementaryActivity.benefits.join(', ')}`
                }] : [])
              ]
            };
          });
        } else {
          // Pour les autres utilisateurs (et invités) : programme par défaut masqué
          // On renvoie une structure vide, ils pourront utiliser leurs propres programmes via les autres sources
          sourceProgram = {};
        }
    }
    
    if (isAdmin) {
      return sourceProgram || workoutProgram;
    }
    // Invités et non-admin : ne jamais retomber sur workoutProgram
    return sourceProgram || {};
  }, [dataSource, visibleActiveProgram, visiblePrograms, selectedProgram, isAdmin, t]);

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
      sourceDay: exercise.sourceDay || t('exercisesTab.misc.defaultProgram')
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
        category: exercise.metadata?.category || exercise.category || t('exercisesTab.misc.notSpecified'),
        primaryMuscleGroup: exercise.metadata?.primaryMuscleGroup || exercise.muscleGroup || t('exercisesTab.misc.notSpecified'),
        difficulty: exercise.metadata?.difficulty || exercise.difficulty || t('exercisesTab.misc.notSpecified'),
        equipment: exercise.metadata?.equipment || exercise.equipment || t('exercisesTab.misc.notSpecified')
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
      const category = exercise.metadata?.category || t('exercisesTab.misc.notSpecified');
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
      
      // Par groupe musculaire
      const muscleGroup = exercise.metadata?.primaryMuscleGroup || t('exercisesTab.misc.notSpecified');
      stats.byMuscleGroup[muscleGroup] = (stats.byMuscleGroup[muscleGroup] || 0) + 1;
      
      // Par difficulté
      const difficulty = exercise.metadata?.difficulty || t('exercisesTab.misc.notSpecified');
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
    // Comparer avec les traductions pour déterminer la couleur
    if (difficulty === t('exercisesTab.difficulty.beginner') || difficulty === 'Débutant') return 'text-green-400';
    if (difficulty === t('exercisesTab.difficulty.intermediate') || difficulty === 'Intermédiaire') return 'text-yellow-400';
    if (difficulty === t('exercisesTab.difficulty.advanced') || difficulty === 'Avancé') return 'text-red-400';
    return 'text-slate-400';
  };

  return (
    <div className="relative min-h-screen">
      {/* Contenu avec z-index relatif */}
      <div className="relative z-10 space-y-6 p-6">
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
                {autoSync ? t('exercisesTab.sync.enabled') : t('exercisesTab.sync.disabled')}
              </span>
            </div>
            
            {lastSyncTime && (
              <div className="text-sm text-slate-400">
                {t('exercisesTab.sync.lastSync', { time: lastSyncTime.toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US') })}
              </div>
            )}
          </div>
          
          {syncData && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>
                  {t('exercisesTab.sync.exercisesSynced', { count: syncData.totalExercises, sourceName: syncData.sourceInfo.name })}
                </span>
              </div>
              
              {syncData.categorizationApplied && (
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <Zap className="w-4 h-4" />
                  <span>
                    {t('exercisesTab.sync.categorizationApplied', { time: syncData.categorizationTimestamp ? new Date(syncData.categorizationTimestamp).toLocaleTimeString(language === 'fr' ? 'fr-FR' : 'en-US') : t('exercisesTab.sync.categorizationNow') })}
                  </span>
                </div>
              )}
              
              {syncData.changes && syncData.changes.hasChanges && (
                <div className="flex items-center gap-2 text-sm text-yellow-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>
                    {t('exercisesTab.sync.changesDetected', { changeType: syncData.changes.changeType })}
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
            {t('exercisesTab.source.title')}
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
              {t('exercisesTab.source.default')}
            </button>
            <button
              onClick={() => {
                setDataSource('active_program');
                setViewMode('exercises');
                setSelectedProgram(null);
              }}
              disabled={!visibleActiveProgram}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                dataSource === 'active_program'
                  ? 'bg-blue-500 text-white shadow-md'
                  : visibleActiveProgram
                  ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {t('exercisesTab.source.activeProgram')} {visibleActiveProgram ? `(${visibleActiveProgram.name})` : t('exercisesTab.source.activeProgramNone')}
            </button>
            <button
              onClick={() => {
                setDataSource('all_programs');
                setViewMode('programs');
                setSelectedProgram(null);
              }}
              disabled={visiblePrograms.length === 0}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                dataSource === 'all_programs'
                  ? 'bg-blue-500 text-white shadow-md'
                  : visiblePrograms.length > 0
                  ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {t('exercisesTab.source.allPrograms', { count: visiblePrograms.length })}
            </button>
          </div>
          <div className="mt-3 text-sm text-slate-400">
            {dataSource === 'default' && t('exercisesTab.source.description.default')}
            {dataSource === 'active_program' && visibleActiveProgram && t('exercisesTab.source.description.activeProgram', { programName: visibleActiveProgram.name })}
            {dataSource === 'active_program' && !visibleActiveProgram && t('exercisesTab.source.description.activeProgramNone')}
            {dataSource === 'all_programs' && viewMode === 'programs' && t('exercisesTab.source.description.allProgramsSelect', { count: visiblePrograms.length })}
              {dataSource === 'all_programs' && viewMode === 'exercises' && selectedProgram && t('exercisesTab.source.description.allProgramsView', { programName: selectedProgram.name })}
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
                <p className="text-sm text-slate-400">{t('exercisesTab.stats.totalExercises')}</p>
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
                <p className="text-sm text-slate-400">{t('exercisesTab.stats.categories')}</p>
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
                <p className="text-sm text-slate-400">{t('exercisesTab.stats.muscleGroups')}</p>
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
                <p className="text-sm text-slate-400">{t('exercisesTab.stats.filtered')}</p>
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
              {t('exercisesTab.filters.title')}
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
              {t('exercisesTab.navigation.backToPrograms')}
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
              {t('exercisesTab.programs.title', { count: visiblePrograms.length })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {visiblePrograms.length === 0 ? (
              <div className="text-center py-12">
                <Target className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400 text-lg mb-2">{t('exercisesTab.programs.none')}</p>
                <p className="text-slate-500 text-sm">
                  {t('exercisesTab.programs.noneHint')}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {visiblePrograms.map((program) => (
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
              {selectedProgram 
                ? t('exercisesTab.exercises.titleWithProgram', { count: filteredExercises.length, programName: selectedProgram.name })
                : t('exercisesTab.exercises.title', { count: filteredExercises.length })
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredExercises.length === 0 ? (
              <div className="text-center py-12">
                <Dumbbell className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400 text-lg mb-2">{t('exercisesTab.exercises.none')}</p>
                <p className="text-slate-500 text-sm">
                  {selectedProgram 
                    ? t('exercisesTab.exercises.noneWithProgram', { programName: selectedProgram.name })
                    : t('exercisesTab.exercises.noneHint')
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
    </div>
  );
};

export default ExercisesTab;