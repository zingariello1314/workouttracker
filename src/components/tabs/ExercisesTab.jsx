import React, { useState, useMemo, useContext, useEffect } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { WorkoutContext } from '../../context/WorkoutContext';
import { workoutProgram } from '../../data/workoutProgram';
import { exerciseDatabase } from '../../data/exerciseDatabase';
import { convertLegacyProgram, filterExercises, enrichExercise, inferTrainingDiscipline } from '../../utils/programUtils';
import { CARDIO_REFERENCE_EXERCISES } from '../../data/cardioExerciseCatalog';
import { 
  syncExercisesFromPrograms, 
  detectProgramChanges,
  syncExercisesFromProgramsWithCategorization 
} from '../../utils/programSync';
import { ExerciseCategories, MuscleGroups, Equipment, Difficulty } from '../../data/workoutProgramEnhanced';
import ExerciseCard from '../ExerciseCard';
import SportBankExerciseCard from '../sport/SportBankExerciseCard';
import BankAddToProgramModal from '../sport/BankAddToProgramModal';
import ExerciseFilter from '../ExerciseFilter';
import ProgramCard from '../ProgramCard';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Activity, Target, Dumbbell, Clock, Filter, RefreshCw, Zap, AlertCircle, ArrowLeft, Stethoscope } from 'lucide-react';
import { useTranslation } from '../../utils/translations';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import ExerciseDetailPage from './exercises/ExerciseDetailPage';
import StretchBankView from './exercises/StretchBankView';
import PathologyBankView from './exercises/PathologyBankView';
import MyProgramBankView from './exercises/MyProgramBankView';
import ProgramDetailView from '../ProgramDetailView';
import { loadTranslationNamespace } from '../../utils/translations/loader';
import { resolveExerciseIntensityCoeff } from '../../utils/trainingLoadUtils';
import { isAdminUser } from '../../utils/accessControl';
import { buildBankExerciseViewFromDatabaseKey } from '../../utils/exerciseBankViewModel';
import {
  sortExercisesByFamily,
  getExerciseFamilyKey,
  getExerciseFamilyLabel,
  getExerciseMuscleCategory
} from '../../utils/bankFamilySort';

/** Sous-onglets de la vue "Banque" (anciennement "Exercices"). */
const BANK_SUB_TABS = {
  EXERCISES: 'exercises',  // Banque d'exercices (existant)
  STRETCHES: 'stretches',  // Banque d'étirements (nouveau)
  PATHOLOGY: 'pathology',  // Pathologies & rééducation
  PROGRAM: 'program'       // Mon programme (exos + étirements du programme actif)
};

const ExercisesTab = () => {
  const { data, updateData } = useWorkout();
  const { programs, activeProgram, updateProgram } = useContext(WorkoutContext);
  const t = useTranslation();
  const { language } = useLanguage();
  const { currentUser, isAuthenticated } = useAuth();
  const isAdmin = isAdminUser(currentUser);
  const isGuest = !isAuthenticated;
  const isStandardUser = isAuthenticated && !isAdmin;
  const intensityCoeffs = data?.exerciseIntensityCoeffs || {};
  const maxRecordsByExerciseId = useMemo(() => {
    const records = Array.isArray(data?.exerciseMaxRecords) ? data.exerciseMaxRecords : [];
    const map = new Map();
    records.forEach((record) => {
      if (!record?.exerciseId) return;
      map.set(String(record.exerciseId), record);
    });
    return map;
  }, [data?.exerciseMaxRecords]);
  const [detailExercise, setDetailExercise] = useState(null);
  /** Vue pleine grille « exercices similaires » (retour vers la fiche d’origine) */
  const [similarExerciseHub, setSimilarExerciseHub] = useState(null);
  /** Modal « Ajouter à un programme » depuis les banques exercices / étirements */
  const [bankAddPayload, setBankAddPayload] = useState(null);

  const similarHubViews = useMemo(() => {
    if (!similarExerciseHub?.keys?.length) return [];
    return similarExerciseHub.keys
      .map((k) => buildBankExerciseViewFromDatabaseKey(k, t))
      .filter(Boolean);
  }, [similarExerciseHub, t]);

  useEffect(() => {
    loadTranslationNamespace(language || 'fr', 'exercisesTab');
  }, [language]);

  const [filters, setFilters] = useState({});
  const [dataSource, setDataSource] = useState('exercise_bank'); // 'exercise_bank', 'default', 'active_program', 'all_programs'
  const [syncData, setSyncData] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [autoSync, setAutoSync] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState(null); // Pour la navigation dans les programmes
  const [viewMode, setViewMode] = useState('exercises'); // 'exercises' ou 'programs'
  /** Sélection sous-onglet : exercises (banque exos) | stretches (banque étirements) | program (mon programme) */
  const [bankSubTab, setBankSubTab] = useState(BANK_SUB_TABS.EXERCISES);
  /** Éditeur complet du programme actif (même vue que l’onglet Programme) depuis Banque → Mon programme */
  const [bankProgramEditorOpen, setBankProgramEditorOpen] = useState(false);

  useEffect(() => {
    if (bankSubTab !== BANK_SUB_TABS.PROGRAM) {
      setBankProgramEditorOpen(false);
    }
  }, [bankSubTab]);

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
    if (isGuest) return {};
    if (isStandardUser) return {};
    let sourceProgram = null;
    
    switch (dataSource) {
      case 'exercise_bank':
        sourceProgram = {};
        break;
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
  }, [dataSource, visibleActiveProgram, visiblePrograms, selectedProgram, isAdmin, isGuest, isStandardUser, t]);

  // Convertir le programme en format enrichi
  const enhancedProgram = useMemo(() => {
    return convertLegacyProgram(getExercisesFromSource);
  }, [getExercisesFromSource]);

  // Utiliser les exercices synchronisés ou extraits manuellement
  const allExercises = useMemo(() => {
    const mergeReferenceExercises = (list) => {
      const seenIds = new Set(list.map((e) => String(e.id)));
      const normalizeName = (value) => String(value || '').toLowerCase().trim();
      const seenNames = new Set(list.map((e) => normalizeName(e.name || e.nom)));
      const out = [...list];

      // Banque commune globale (exerciseDatabase) visible pour tous les utilisateurs
      Object.entries(exerciseDatabase).forEach(([key, ex]) => {
        const name = ex.name || key;
        const normalizedName = normalizeName(name);
        if (seenNames.has(normalizedName)) return;

        const id = `db_${key.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').toLowerCase()}`;
        if (seenIds.has(id)) return;

        const enriched = enrichExercise({
          id,
          name,
          materiel: ex.equipment || '',
          notes: ex.description || '',
          secondaryMuscles: ex.secondaryMuscles || [],
          primaryMuscles: ex.primaryMuscles || [],
          ...(typeof ex.difficulty === 'number' ? { difficulty: ex.difficulty } : {})
        });

        seenIds.add(id);
        seenNames.add(normalizedName);
        out.push({
          ...enriched,
          category: enriched.metadata?.category || ex.category || t('exercisesTab.misc.notSpecified'),
          muscleGroup: enriched.metadata?.primaryMuscleGroup || ex.primaryMuscles?.[0] || t('exercisesTab.misc.notSpecified'),
          difficulty: enriched.metadata?.difficulty || 1,
          trainingDiscipline: enriched.metadata?.trainingDiscipline || inferTrainingDiscipline({ ...enriched, rawEquipment: ex.equipment }),
          sourceDay: t('exercisesTab.misc.exerciseBankSource', 'Banque commune exercices'),
          // Garder les champs "métier" lisibles issus de la banque
          primaryMuscles: ex.primaryMuscles || [],
          secondaryMuscles: ex.secondaryMuscles || enriched.secondaryMuscles || [],
          equipment: ex.equipment || enriched.equipment || t('exercisesTab.misc.notSpecified'),
          notes: ex.description || enriched.notes || '',
          categoryLabel: ex.category,
          databaseKey: key
        });
      });

      CARDIO_REFERENCE_EXERCISES.forEach((ex) => {
        const key = String(ex.id);
        const normalizedName = normalizeName(ex.name);
        if (!seenIds.has(key) && !seenNames.has(normalizedName)) {
          seenIds.add(key);
          seenNames.add(normalizedName);
          out.push({
            ...ex,
            sourceDay: ex.sourceDay || t('exercisesTab.cardio.sourceLabel', 'Référentiel cardio')
          });
        }
      });
      return out;
    };

    if (isGuest) return [];
    if (isStandardUser || dataSource === 'exercise_bank') return mergeReferenceExercises([]);

    // Priorité aux exercices synchronisés si disponibles ET s'ils sont enrichis
    if (syncData && syncData.exercises && syncData.exercises.length > 0 && 
        syncData.exercises.some(ex => ex.category || ex.metadata)) {
      const withSource = syncData.exercises.map((exercise) => ({
        ...exercise,
        sourceDay: exercise.sourceDay || t('exercisesTab.misc.defaultProgram')
      }));
      return mergeReferenceExercises(withSource);
    }
    
    const exercises = [];
    
    Object.values(enhancedProgram.days).forEach(day => {
      if (day.exercises) {
        exercises.push(...day.exercises);
      }
      
      if (day.salleVariants) {
        Object.values(day.salleVariants).forEach(variant => {
          if (variant.exercises) {
            exercises.push(...variant.exercises);
          }
        });
      }
    });
    
    const uniqueExercises = exercises.filter((exercise, index, self) => 
      index === self.findIndex(e => e.id === exercise.id)
    );
    
    const fromProgram = uniqueExercises.map(exercise => ({
      ...exercise,
      sourceDay: exercise.sourceDay || t('exercisesTab.misc.defaultProgram')
    }));

    return mergeReferenceExercises(fromProgram);
  }, [enhancedProgram, syncData, t, isGuest, isStandardUser, dataSource]);

  // Filtrer les exercices
  const filteredExercises = useMemo(() => {
    return sortExercisesByFamily(filterExercises(allExercises, filters));
  }, [allExercises, filters]);

  const groupedExerciseBank = useMemo(() => {
    if (dataSource !== 'exercise_bank') return [];
    const order = ['upper_body', 'lower_body', 'cardio', 'other'];
    const map = new Map(order.map((k) => [k, []]));
    filteredExercises.forEach((exercise) => {
      const key = getExerciseFamilyKey(exercise);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(exercise);
    });
    return order
      .map((key) => {
        const rows = map.get(key) || [];
        if (rows.length === 0) return null;
        const byCategory = new Map();
        rows.forEach((row) => {
          const cat = getExerciseMuscleCategory(row);
          if (!byCategory.has(cat)) byCategory.set(cat, []);
          byCategory.get(cat).push(row);
        });
        const categories = Array.from(byCategory.keys()).sort((a, b) => a.localeCompare(b, 'fr'));
        return {
          key,
          label: getExerciseFamilyLabel(rows[0]),
          categorySummary: categories.join(' · '),
          groups: categories.map((cat) => ({
            category: cat,
            rows: byCategory.get(cat) || []
          }))
        };
      })
      .filter(Boolean);
  }, [dataSource, filteredExercises]);

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
        equipment: exercise.metadata?.equipment || exercise.equipment || t('exercisesTab.misc.notSpecified'),
        trainingDiscipline: exercise.metadata?.trainingDiscipline || exercise.trainingDiscipline || inferTrainingDiscipline(exercise)
      }
    };
    
    // On s'assure aussi que les propriétés directes existent pour la compatibilité avec ExerciseCard
    normalized.category = normalized.metadata.category;
    normalized.muscleGroup = normalized.metadata.primaryMuscleGroup;
    normalized.difficulty = normalized.metadata.difficulty;
    normalized.equipment = normalized.metadata.equipment;
    normalized.trainingDiscipline = normalized.metadata.trainingDiscipline;
    
    return normalized;
  };

  // Statistiques des exercices
  const exerciseStats = useMemo(() => {
    const normalizedExercises = allExercises.map(normalizeExercise);
    
    const stats = {
      total: normalizedExercises.length,
      byCategory: {},
      byMuscleGroup: {},
      byDifficulty: {}
    };
    
    normalizedExercises.forEach((exercise) => {
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

  if (similarExerciseHub) {
    return (
      <div className="relative">
        <BankAddToProgramModal payload={bankAddPayload} onClose={() => setBankAddPayload(null)} />
        <div className="relative z-10 p-4 md:p-6 max-w-[1600px] mx-auto space-y-6">
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-200 hover:text-white transition-colors"
            onClick={() => {
              const seed = similarExerciseHub.seedExercise;
              setSimilarExerciseHub(null);
              setDetailExercise(seed);
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            {t('exercisesTab.detail.similar.backToExercise', 'Retour à la fiche')}
          </button>
          <Card variant="sport">
            <CardHeader>
              <CardTitle className="text-white">
                {t('exercisesTab.detail.similar.fullTitle', 'Exercices similaires')}
                {similarExerciseHub.seedExercise?.name ? (
                  <span className="block text-sm font-normal text-slate-400 mt-1">
                    {t('exercisesTab.detail.similar.fullSubtitle', 'Pour « {{name}} »', {
                      name: similarExerciseHub.seedExercise.name
                    })}
                  </span>
                ) : null}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {similarHubViews.length === 0 ? (
                <p className="text-slate-400 text-sm py-8 text-center">
                  {t('exercisesTab.detail.similar.empty', 'Aucun exercice similaire trouvé dans la banque.')}
                </p>
              ) : (
                <div className="grid grid-cols-1 items-stretch sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {similarHubViews.map((ex) => (
                    <SportBankExerciseCard
                      key={ex.id}
                      exercise={ex}
                      onOpenDetail={(opened) => {
                        setSimilarExerciseHub(null);
                        setDetailExercise(opened);
                      }}
                      effectiveLoadCoeff={resolveExerciseIntensityCoeff(ex, intensityCoeffs)}
                      hasRecordedMax={maxRecordsByExerciseId.has(String(ex.id))}
                      maxRecord={maxRecordsByExerciseId.get(String(ex.id)) || null}
                      showAddButton={isAuthenticated}
                      onRequestAddToProgram={isAuthenticated ? (p) => setBankAddPayload(p) : undefined}
                      workoutData={data}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (detailExercise) {
    return (
      <div className="relative">
        <BankAddToProgramModal payload={bankAddPayload} onClose={() => setBankAddPayload(null)} />
        <div className="relative z-10 p-4 md:p-6">
          <ExerciseDetailPage
            exercise={detailExercise}
            data={data}
            updateData={updateData}
            onBack={() => setDetailExercise(null)}
            readOnly={!isAuthenticated}
            onOpenSimilarBankExercise={(ex) => setDetailExercise(ex)}
            onViewAllSimilarExerciseKeys={(payload) => {
              setSimilarExerciseHub({
                seedExercise: payload.seedExercise,
                keys: payload.keys
              });
              setDetailExercise(null);
            }}
            maxRecordsByExerciseId={maxRecordsByExerciseId}
            onRequestAddToProgram={isAuthenticated ? (p) => setBankAddPayload(p) : undefined}
            isAuthenticated={isAuthenticated}
          />
        </div>
      </div>
    );
  }

  if (isGuest) {
    return (
      <div className="relative">
        <div className="relative z-10 p-6">
          <Card variant="sport">
            <CardContent className="py-10 text-center">
              <Dumbbell className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-300 text-lg mb-2">
                {t('exercisesTab.guest.lockedTitle', 'Connectez-vous pour voir les exercices')}
              </p>
              <p className="text-slate-500 text-sm">
                {t('exercisesTab.guest.lockedHint', 'La banque d’exercices et vos programmes sont disponibles après connexion.')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─── Sous-onglets "Banque" : Exercices / Étirements / Mon programme ───
  const subTabsHeader = (
    <Card variant="sport">
      <CardContent className="p-2">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Sous-onglets Banque">
          <button
            type="button"
            role="tab"
            aria-selected={bankSubTab === BANK_SUB_TABS.EXERCISES}
            onClick={() => setBankSubTab(BANK_SUB_TABS.EXERCISES)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition border ${
              bankSubTab === BANK_SUB_TABS.EXERCISES
                ? 'bg-blue-600/30 border-blue-400/60 text-white'
                : 'bg-slate-900/40 border-slate-700 text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <Dumbbell className="inline w-3.5 h-3.5 mr-1.5 -mt-0.5" />
            Banque d'exercices
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={bankSubTab === BANK_SUB_TABS.STRETCHES}
            onClick={() => setBankSubTab(BANK_SUB_TABS.STRETCHES)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition border ${
              bankSubTab === BANK_SUB_TABS.STRETCHES
                ? 'bg-teal-600/30 border-teal-400/60 text-white'
                : 'bg-slate-900/40 border-slate-700 text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <Activity className="inline w-3.5 h-3.5 mr-1.5 -mt-0.5" />
            Banque d'étirements
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={bankSubTab === BANK_SUB_TABS.PATHOLOGY}
            onClick={() => setBankSubTab(BANK_SUB_TABS.PATHOLOGY)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition border ${
              bankSubTab === BANK_SUB_TABS.PATHOLOGY
                ? 'bg-rose-600/30 border-rose-400/60 text-white'
                : 'bg-slate-900/40 border-slate-700 text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <Stethoscope className="inline w-3.5 h-3.5 mr-1.5 -mt-0.5" />
            {t('exercisesTab.pathologyTab.bankSubTab', 'Pathologies')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={bankSubTab === BANK_SUB_TABS.PROGRAM}
            onClick={() => setBankSubTab(BANK_SUB_TABS.PROGRAM)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition border ${
              bankSubTab === BANK_SUB_TABS.PROGRAM
                ? 'bg-amber-600/30 border-amber-400/60 text-white'
                : 'bg-slate-900/40 border-slate-700 text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <Target className="inline w-3.5 h-3.5 mr-1.5 -mt-0.5" />
            Mon programme
            {visibleActiveProgram && (
              <span className="ml-1 text-[10px] text-amber-200/80 font-normal">
                ({visibleActiveProgram.name})
              </span>
            )}
          </button>
        </div>
      </CardContent>
    </Card>
  );

  // Si le sous-onglet est Étirements ou Programme, on rend une vue dédiée et on s'arrête là.
  if (bankSubTab === BANK_SUB_TABS.PATHOLOGY) {
    return (
      <div className="relative">
        <BankAddToProgramModal payload={bankAddPayload} onClose={() => setBankAddPayload(null)} />
        <div className="relative z-10 space-y-6 p-6">
          {subTabsHeader}
          <PathologyBankView
            data={data}
            updateData={updateData}
            onOpenExercise={(ex) => setDetailExercise(ex)}
            onRequestAddToProgram={isAuthenticated ? (p) => setBankAddPayload(p) : undefined}
            intensityCoeffs={intensityCoeffs}
            maxRecordsByExerciseId={maxRecordsByExerciseId}
            isAuthenticated={isAuthenticated}
            sportPrograms={visiblePrograms}
          />
        </div>
      </div>
    );
  }

  if (bankSubTab === BANK_SUB_TABS.STRETCHES) {
    return (
      <div className="relative">
        <BankAddToProgramModal payload={bankAddPayload} onClose={() => setBankAddPayload(null)} />
        <div className="relative z-10 space-y-6 p-6">
          {subTabsHeader}
          <StretchBankView
            data={data}
            updateData={updateData}
            readOnly={!isAuthenticated}
            onRequestAddToProgram={isAuthenticated ? (p) => setBankAddPayload(p) : undefined}
            sportPrograms={visiblePrograms}
            onOpenComplementaryExercise={(ex) => setDetailExercise(ex)}
            maxRecordsByExerciseId={maxRecordsByExerciseId}
            isAuthenticated={isAuthenticated}
          />
        </div>
      </div>
    );
  }

  if (bankSubTab === BANK_SUB_TABS.PROGRAM) {
    return (
      <div className="relative">
        <div className="relative z-10 space-y-6 p-6">
          {subTabsHeader}
          {!visibleActiveProgram ? (
            <MyProgramBankView activeProgram={visibleActiveProgram} isAdmin={isAdmin} />
          ) : bankProgramEditorOpen ? (
            <ProgramDetailView
              program={visibleActiveProgram}
              onBack={() => setBankProgramEditorOpen(false)}
              onUpdateProgram={(updated) => {
                updateProgram(updated);
              }}
            />
          ) : (
            <>
              <Card variant="sport">
                <CardContent className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-sm text-slate-400">
                    {t(
                      'exercisesTab.bankProgram.editHint',
                      'Modifie les exercices, séries, étirements et variantes comme dans l’onglet Programme — les changements s’appliquent à ton programme actif.'
                    )}
                  </p>
                  <button
                    type="button"
                    onClick={() => setBankProgramEditorOpen(true)}
                    className="shrink-0 inline-flex items-center justify-center gap-2 rounded-lg border border-[#0F5C45]/55 bg-[#0F5C45]/25 px-4 py-2 text-sm font-medium text-white shadow-md shadow-black/30 transition hover:bg-[#0F5C45]/40"
                  >
                    <Target className="w-4 h-4" />
                    {t('exercisesTab.bankProgram.openEditor', 'Modifier le programme')}
                  </button>
                </CardContent>
              </Card>
              <MyProgramBankView activeProgram={visibleActiveProgram} isAdmin={isAdmin} />
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <BankAddToProgramModal payload={bankAddPayload} onClose={() => setBankAddPayload(null)} />
      <div className="relative z-10 space-y-6 p-6">
        {subTabsHeader}
        {/* Statut de synchronisation */}
      {isAdmin && (
      <Card variant="sport">
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
      )}
      {isAdmin && (
      <Card variant="sport">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            {t('exercisesTab.source.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setDataSource('exercise_bank');
                setViewMode('exercises');
                setSelectedProgram(null);
              }}
              className={`gradient-button-premium gradient-button-premium-sm rounded-lg ${
                dataSource === 'exercise_bank'
                  ? 'gradient-button-premium-variant'
                  : ''
              }`}
            >
              Tous les exercices (banque)
            </button>
            <button
              type="button"
              onClick={() => {
                setDataSource('default');
                setViewMode('exercises');
                setSelectedProgram(null);
              }}
              className={`gradient-button-premium gradient-button-premium-sm rounded-lg ${
                dataSource === 'default'
                  ? 'gradient-button-premium-variant'
                  : ''
              }`}
            >
              {t('exercisesTab.source.default')}
            </button>
            <button
              type="button"
              onClick={() => {
                setDataSource('active_program');
                setViewMode('exercises');
                setSelectedProgram(null);
              }}
              disabled={!visibleActiveProgram}
              className={`gradient-button-premium gradient-button-premium-sm rounded-lg ${
                dataSource === 'active_program'
                  ? 'gradient-button-premium-variant'
                  : ''
              } ${!visibleActiveProgram ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {t('exercisesTab.source.activeProgram')} {visibleActiveProgram ? `(${visibleActiveProgram.name})` : t('exercisesTab.source.activeProgramNone')}
            </button>
            <button
              type="button"
              onClick={() => {
                setDataSource('all_programs');
                setViewMode('programs');
                setSelectedProgram(null);
              }}
              disabled={visiblePrograms.length === 0}
              className={`gradient-button-premium gradient-button-premium-sm rounded-lg ${
                dataSource === 'all_programs'
                  ? 'gradient-button-premium-variant'
                  : ''
              } ${visiblePrograms.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {t('exercisesTab.source.allPrograms', { count: visiblePrograms.length })}
            </button>
          </div>
          <div className="mt-3 text-sm text-slate-400">
            {dataSource === 'exercise_bank' && 'Affichage de toute la banque d’exercices (sans doublons).'}
            {dataSource === 'default' && t('exercisesTab.source.description.default')}
            {dataSource === 'active_program' && visibleActiveProgram && t('exercisesTab.source.description.activeProgram', { programName: visibleActiveProgram.name })}
            {dataSource === 'active_program' && !visibleActiveProgram && t('exercisesTab.source.description.activeProgramNone')}
            {dataSource === 'all_programs' && viewMode === 'programs' && t('exercisesTab.source.description.allProgramsSelect', { count: visiblePrograms.length })}
              {dataSource === 'all_programs' && viewMode === 'exercises' && selectedProgram && t('exercisesTab.source.description.allProgramsView', { programName: selectedProgram.name })}
          </div>
        </CardContent>
      </Card>
      )}

      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="sport">
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

        <Card variant="sport">
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

        <Card variant="sport">
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

        <Card variant="sport">
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
        <Card variant="sport">
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
        <Card variant="sport">
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
        <Card variant="sport">
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
        <Card variant="sport">
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
            ) : dataSource === 'exercise_bank' ? (
                <div className="space-y-6">
                  {groupedExerciseBank.map((group) => (
                    <section key={group.key} className="space-y-3">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-teal-200 border-b border-[#0F4C5C]/50 pb-2">
                        {group.label} ({group.groups.reduce((n, g) => n + g.rows.length, 0)})
                      </h3>
                      <p className="text-xs text-teal-400/85 -mt-1">{group.categorySummary}</p>
                      {group.groups.map((sub) => (
                        <div key={`${group.key}-${sub.category}`} className="space-y-2">
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-teal-300/90">
                            {sub.category}
                          </h4>
                          <div className="grid grid-cols-1 items-stretch sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {sub.rows.map((exercise) => (
                              <SportBankExerciseCard
                                key={exercise.id}
                                exercise={exercise}
                                onOpenDetail={setDetailExercise}
                                effectiveLoadCoeff={resolveExerciseIntensityCoeff(exercise, intensityCoeffs)}
                                hasRecordedMax={maxRecordsByExerciseId.has(String(exercise.id))}
                                maxRecord={maxRecordsByExerciseId.get(String(exercise.id)) || null}
                                showAddButton={isAuthenticated}
                                onRequestAddToProgram={isAuthenticated ? (p) => setBankAddPayload(p) : undefined}
                                workoutData={data}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </section>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 items-stretch sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredExercises.map((exercise) => (
                    <ExerciseCard
                      key={exercise.id}
                      exercise={exercise}
                      onToggleComplete={() => {}}
                      isCompleted={false}
                      onOpenDetail={setDetailExercise}
                      effectiveLoadCoeff={resolveExerciseIntensityCoeff(exercise, intensityCoeffs)}
                      showProgramVolume={isAdmin}
                      hasRecordedMax={maxRecordsByExerciseId.has(String(exercise.id))}
                      maxRecord={maxRecordsByExerciseId.get(String(exercise.id)) || null}
                    />
                  ))}
                </div>
              )
            }
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
};

export default ExercisesTab;