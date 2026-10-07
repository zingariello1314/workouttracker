import React, { useState, useMemo, useContext, useEffect } from 'react';
import { useWorkout } from '../../context/WorkoutContext';
import { WorkoutContext } from '../../context/WorkoutContext';
import { exerciseDatabase } from '../../data/exerciseDatabase';
import { convertLegacyProgram, filterExercises, enrichExercise, inferTrainingDiscipline } from '../../utils/programUtils';
import { CARDIO_REFERENCE_EXERCISES } from '../../data/cardioExerciseCatalog';
import { ALL_SCORING_ENTRIES } from '../../data/exerciseScoring/index';
import { 
  syncExercisesFromPrograms, 
  detectProgramChanges,
  syncExercisesFromProgramsWithCategorization 
} from '../../utils/programSync';
import { ExerciseCategories, MuscleGroups, Equipment, Difficulty } from '../../data/workoutProgramEnhanced';
import SportBankExerciseCard from '../sport/SportBankExerciseCard';
import BankAddToProgramModal from '../sport/BankAddToProgramModal';
import ExerciseFilter from '../ExerciseFilter';
import ProgramCard from '../ProgramCard';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Activity, Target, Dumbbell, Clock, Filter, RefreshCw, Zap, AlertCircle, ArrowLeft, Stethoscope, Film } from 'lucide-react';
import { useTranslation } from '../../utils/translations';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import ExerciseDetailPage from './exercises/ExerciseDetailPage';
import StretchBankView from './exercises/StretchBankView';
import PathologyBankView from './exercises/PathologyBankView';
import MyProgramBankView from './exercises/MyProgramBankView';
import CircuitsBankView from './exercises/CircuitsBankView';
import ProgramDetailView from '../ProgramDetailView';
import { loadTranslationNamespace } from '../../utils/translations/loader';
import { resolveExerciseIntensityCoeff } from '../../utils/trainingLoadUtils';
import { isAdminUser } from '../../utils/accessControl';
import { buildBankExerciseViewFromDatabaseKey } from '../../utils/exerciseBankViewModel';
import { getExerciseDatabaseKey } from '../../utils/exerciseHeroContent';
import {
  sortExercisesByMuscleName,
  getExerciseMuscleCategory
} from '../../utils/bankFamilySort';
import { exerciseHasGif, exerciseHasVideo } from '../sport/BankLinkedMedia';
import { AnatomyPreviewCaptureProvider } from '../anatomy/AnatomyPreviewCaptureProvider';

/** Sous-onglets de la vue "Banque" (anciennement "Exercices"). */
const BANK_SUB_TABS = {
  EXERCISES: 'exercises',  // Banque d'exercices (existant)
  STRETCHES: 'stretches',  // Banque d'étirements (nouveau)
  PATHOLOGY: 'pathology',  // Pathologies & rééducation
  PROGRAM: 'program',       // Mon programme (exos + étirements du programme actif)
  CIRCUITS: 'circuits'     // Routines vidéo, composition à déterminer plus tard
};

const PROGRAM_WEEK_DAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
const PROGRAM_DAY_LABELS = {
  lundi: 'Lundi',
  mardi: 'Mardi',
  mercredi: 'Mercredi',
  jeudi: 'Jeudi',
  vendredi: 'Vendredi',
  samedi: 'Samedi',
  dimanche: 'Dimanche'
};

function normalizeExerciseIdentity(exercise) {
  const dbKey = exercise?.databaseKey || getExerciseDatabaseKey(exercise);
  if (dbKey) return `db:${dbKey}`;
  const name = String(exercise?.name || exercise?.nom || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
  if (name) return `name:${name}`;
  return `id:${exercise?.id ?? ''}`;
}

/** Déduplique sauf quand un filtre jour est actif (même exo OK sur des jours différents). */
function dedupeProgramExercises(list, { keepPerDay = false } = {}) {
  const seen = new Set();
  return list.filter((ex) => {
    const identity = normalizeExerciseIdentity(ex);
    const key = keepPerDay ? `${ex.programDay || ''}::${identity}` : identity;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const ExercisesTabBody = () => {
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
  /** Disposition liste programme : par muscle (banque) ou chronologique (lundi → dimanche). */
  const [programLayout, setProgramLayout] = useState('chrono');
  /** Sélection sous-onglet : exercises (banque exos) | stretches (banque étirements) | program (mon programme) */
  const [bankSubTab, setBankSubTab] = useState(BANK_SUB_TABS.EXERCISES);
  /** La grille complète ne se monte pas dans le premier rendu : sinon l’onglet reste sur « Chargement… ». */
  const [bankPrepared, setBankPrepared] = useState(false);
  const [bankRenderLimit, setBankRenderLimit] = useState(24);
  /** Éditeur complet du programme actif (même vue que l’onglet Programme) depuis Banque → Mon programme */
  const [bankProgramEditorOpen, setBankProgramEditorOpen] = useState(false);

  useEffect(() => {
    if (bankSubTab !== BANK_SUB_TABS.PROGRAM) {
      setBankProgramEditorOpen(false);
    }
  }, [bankSubTab]);

  useEffect(() => {
    const onNav = (event) => {
      const sub = event?.detail?.subTab;
      const map = {
        exercises: BANK_SUB_TABS.EXERCISES,
        stretches: BANK_SUB_TABS.STRETCHES,
        pathology: BANK_SUB_TABS.PATHOLOGY,
        program: BANK_SUB_TABS.PROGRAM,
        circuits: BANK_SUB_TABS.CIRCUITS
      };
      if (map[sub]) setBankSubTab(map[sub]);
    };
    window.addEventListener('sport:exercises-bank-subtab', onNav);
    return () => window.removeEventListener('sport:exercises-bank-subtab', onNav);
  }, []);

  // Même liste que l’onglet Programme (tous les programmes du compte connecté)
  const visiblePrograms = useMemo(() => {
    if (!isAuthenticated) return [];
    const list = (Array.isArray(programs) ? programs : []).filter(Boolean);
    if (
      activeProgram?.id != null &&
      !list.some((p) => String(p.id) === String(activeProgram.id))
    ) {
      return [activeProgram, ...list];
    }
    return list;
  }, [isAuthenticated, programs, activeProgram]);
  const visibleActiveProgram = isAuthenticated ? activeProgram : null;
  const isProgramDataSource =
    dataSource === 'active_program' ||
    (dataSource === 'all_programs' && Boolean(selectedProgram));

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
        // Plus de fallback Cycle 3+1 / workoutProgram dans la banque
        sourceProgram = {};
    }

    return sourceProgram || {};
  }, [dataSource, visibleActiveProgram, visiblePrograms, selectedProgram, isGuest, t]);

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
          databaseKey: key,
          isNew: Boolean(ex.isNew)
        });
      });

      ALL_SCORING_ENTRIES.forEach((entry) => {
        const name = entry.name;
        const normalizedName = normalizeName(name);
        if (seenNames.has(normalizedName)) return;

        const id = `score_${String(entry.key).replace(/\s+/g, '_')}`;
        if (seenIds.has(id)) return;

        const enriched = enrichExercise({
          id,
          name,
          materiel: '',
          notes: '',
          scoringKey: entry.key
        });

        seenIds.add(id);
        seenNames.add(normalizedName);
        out.push({
          ...enriched,
          scoringKey: entry.key,
          category:
            entry.scoringType === 'isometric'
              ? ExerciseCategories.ISOMETRIC
              : ExerciseCategories.STRENGTH,
          muscleGroup: entry.muscleGroup || t('exercisesTab.misc.notSpecified'),
          muscleCategory: entry.muscleGroup || '',
          difficulty: entry.difficultyStars || 1,
          trainingDiscipline: inferTrainingDiscipline(enriched),
          sourceDay: t(
            'exercisesTab.misc.scoringCatalogSource',
            'Référentiel scoring musculation'
          ),
          equipment: t('exercisesTab.misc.notSpecified'),
          notes: ''
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
    if (dataSource === 'exercise_bank' && !bankPrepared) return [];

    // Banque complète (référentiel) — sans filtre programme
    if (dataSource === 'exercise_bank') {
      return mergeReferenceExercises([]);
    }

    // Sources programme : occurrences avec jour / slot (dédup plus bas selon filtres)
    const exercises = [];
    Object.entries(enhancedProgram?.days || {}).forEach(([dayKey, day]) => {
      const programDay = PROGRAM_WEEK_DAYS.includes(dayKey)
        ? dayKey
        : PROGRAM_WEEK_DAYS.find((d) => dayKey.endsWith(`_${d}`)) || dayKey;
      const dayFocus = day.focus || day.name || '';
      (day.exercises || []).forEach((ex) => {
        exercises.push({
          ...ex,
          programDay,
          programSlot: 'maison',
          programFocus: dayFocus
        });
      });
      if (day.salleVariants) {
        Object.entries(day.salleVariants).forEach(([variantKey, variant]) => {
          (variant.exercises || []).forEach((ex) => {
            exercises.push({
              ...ex,
              programDay,
              programSlot: variantKey,
              programFocus: dayFocus
            });
          });
        });
      }
    });

    /** Même vue carte que la banque (GIF / muscles) : rattacher chaque exo programme à la fiche banque. */
    return exercises.map((exercise) => {
      const dbKey = exercise.databaseKey || getExerciseDatabaseKey(exercise);
      const bank = dbKey ? buildBankExerciseViewFromDatabaseKey(dbKey, t) : null;
      const dayLabel = PROGRAM_DAY_LABELS[exercise.programDay] || exercise.programDay || '';
      if (bank) {
        return {
          ...bank,
          id: exercise.id ?? bank.id,
          name: exercise.name || bank.name,
          series: exercise.series,
          materiel: exercise.materiel || bank.equipment,
          notes: exercise.notes || bank.notes,
          type: exercise.type,
          databaseKey: dbKey,
          programDay: exercise.programDay,
          programSlot: exercise.programSlot,
          programFocus: exercise.programFocus,
          sourceDay: dayLabel || exercise.sourceDay || t('exercisesTab.misc.defaultProgram')
        };
      }
      const enriched = enrichExercise(exercise);
      return {
        ...enriched,
        category: enriched.metadata?.category || exercise.category,
        muscleGroup: enriched.metadata?.primaryMuscleGroup || exercise.muscleGroup,
        difficulty: enriched.metadata?.difficulty || exercise.difficulty || 1,
        trainingDiscipline:
          enriched.metadata?.trainingDiscipline ||
          exercise.trainingDiscipline ||
          inferTrainingDiscipline(enriched),
        equipment: enriched.metadata?.equipment || exercise.equipment || exercise.materiel,
        programDay: exercise.programDay,
        programSlot: exercise.programSlot,
        programFocus: exercise.programFocus,
        sourceDay: dayLabel || exercise.sourceDay || t('exercisesTab.misc.defaultProgram')
      };
    });
  }, [enhancedProgram, t, isGuest, dataSource, bankPrepared]);

  // Filtrer les exercices
  const filteredExercises = useMemo(() => {
    let list = [...allExercises];

    // Filtres programme (uniquement si source = un programme)
    if (isProgramDataSource) {
      if (filters.programDay) {
        list = list.filter((ex) => ex.programDay === filters.programDay);
      }
      if (filters.programSlot) {
        list = list.filter((ex) => ex.programSlot === filters.programSlot);
      }
      if (filters.programFocus) {
        const needle = String(filters.programFocus).toLowerCase();
        list = list.filter((ex) => String(ex.programFocus || '').toLowerCase().includes(needle));
      }
      // Vue muscle : un seul exemplaire global (sauf filtre jour).
      // Vue chrono : 1× par jour pour pouvoir enchaîner lundi → dimanche.
      const keepPerDay = programLayout === 'chrono' || Boolean(filters.programDay);
      list = dedupeProgramExercises(list, { keepPerDay });
    }

    list = filterExercises(list, filters);
    if (filters.hasVideo === 'yes') list = list.filter((exercise) => exerciseHasVideo(exercise));
    if (filters.hasVideo === 'no') list = list.filter((exercise) => !exerciseHasVideo(exercise));
    if (filters.hasGif === 'yes') list = list.filter((exercise) => exerciseHasGif(exercise));
    if (filters.hasGif === 'no') list = list.filter((exercise) => !exerciseHasGif(exercise));
    if (filters.isNew === 'yes') list = list.filter((exercise) => exercise.isNew);

    if (isProgramDataSource && programLayout === 'chrono') {
      return [...list].sort((a, b) => {
        const ia = PROGRAM_WEEK_DAYS.indexOf(a.programDay);
        const ib = PROGRAM_WEEK_DAYS.indexOf(b.programDay);
        return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
      });
    }
    return sortExercisesByMuscleName(list, exerciseHasGif);
  }, [allExercises, filters, isProgramDataSource, programLayout]);

  const programFocusOptions = useMemo(() => {
    if (!isProgramDataSource) return [];
    const set = new Set();
    allExercises.forEach((ex) => {
      const f = String(ex.programFocus || '').trim();
      if (f) set.add(f);
    });
    return [...set].sort((a, b) => a.localeCompare(b, 'fr'));
  }, [allExercises, isProgramDataSource]);

  const groupedExerciseBank = useMemo(() => {
    const byCategory = new Map();
    filteredExercises.forEach((row) => {
      const cat = getExerciseMuscleCategory(row);
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      byCategory.get(cat).push(row);
    });
    return Array.from(byCategory.entries())
      .sort(([a], [b]) => a.localeCompare(b, 'fr'))
      .map(([category, rows]) => ({
        category,
        rows
      }));
  }, [filteredExercises]);

  /** Groupes lundi → dimanche (sans sous-catégories muscle). */
  const chronologicalDayGroups = useMemo(() => {
    if (!isProgramDataSource || programLayout !== 'chrono') return [];
    const byDay = new Map();
    filteredExercises.forEach((row) => {
      const day = row.programDay || 'autre';
      if (!byDay.has(day)) byDay.set(day, []);
      byDay.get(day).push(row);
    });
    return PROGRAM_WEEK_DAYS.filter((day) => byDay.has(day)).map((day) => {
      const rows = byDay.get(day);
      const muscles = [];
      const seenMuscle = new Set();
      rows.forEach((ex) => {
        const m = getExerciseMuscleCategory(ex);
        if (!m || seenMuscle.has(m)) return;
        seenMuscle.add(m);
        muscles.push(m);
      });
      return {
        day,
        label: PROGRAM_DAY_LABELS[day] || day,
        focus: rows.find((r) => r.programFocus)?.programFocus || '',
        muscles,
        rows
      };
    });
  }, [filteredExercises, isProgramDataSource, programLayout]);

  useEffect(() => {
    if (bankSubTab !== BANK_SUB_TABS.EXERCISES) return undefined;
    if (!bankPrepared) {
      const id = window.setTimeout(() => setBankPrepared(true), 0);
      return () => window.clearTimeout(id);
    }
    if (bankRenderLimit >= filteredExercises.length) return undefined;
    const id = window.setTimeout(() => {
      setBankRenderLimit((count) => count + 48);
    }, 32);
    return () => window.clearTimeout(id);
  }, [bankSubTab, bankPrepared, bankRenderLimit, filteredExercises.length]);

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
    // ExerciseFilter ne gère pas les filtres programme : on les conserve.
    setFilters((prev) => ({
      ...newFilters,
      ...(prev.programDay ? { programDay: prev.programDay } : {}),
      ...(prev.programSlot ? { programSlot: prev.programSlot } : {}),
      ...(prev.programFocus ? { programFocus: prev.programFocus } : {})
    }));
  };

  const getDifficultyColor = (difficulty) => {
    // Comparer avec les traductions pour déterminer la couleur
    if (difficulty === t('exercisesTab.difficulty.beginner') || difficulty === 'Débutant') return 'text-green-400';
    if (difficulty === t('exercisesTab.difficulty.intermediate') || difficulty === 'Intermédiaire') return 'text-yellow-400';
    if (difficulty === t('exercisesTab.difficulty.advanced') || difficulty === 'Avancé') return 'text-red-400';
    return 'text-slate-400';
  };

  const bankListPending = dataSource === 'exercise_bank' && !bankPrepared;
  const useChronoLayout = isProgramDataSource && programLayout === 'chrono';
  let bankSlotsLeft = dataSource === 'exercise_bank' ? bankRenderLimit : Number.POSITIVE_INFINITY;
  const visibleExerciseGroups = bankListPending || useChronoLayout
    ? []
    : groupedExerciseBank.flatMap((group) => {
        if (bankSlotsLeft <= 0) return [];
        const rows = group.rows.slice(0, bankSlotsLeft);
        bankSlotsLeft -= rows.length;
        if (!rows.length) return [];
        return [{ category: group.category, rows, total: group.rows.length }];
      });

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
          <button
            type="button"
            role="tab"
            aria-selected={bankSubTab === BANK_SUB_TABS.CIRCUITS}
            onClick={() => setBankSubTab(BANK_SUB_TABS.CIRCUITS)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition border ${
              bankSubTab === BANK_SUB_TABS.CIRCUITS
                ? 'bg-teal-600/30 border-teal-400/60 text-white'
                : 'bg-slate-900/40 border-slate-700 text-slate-300 hover:bg-slate-800/60'
            }`}
          >
            <Film className="inline w-3.5 h-3.5 mr-1.5 -mt-0.5" />
            Circuits
          </button>
        </div>
      </CardContent>
    </Card>
  );

  // Si le sous-onglet est Étirements, Pathologies, Programme ou Circuits, on rend une vue dédiée.
  if (bankSubTab === BANK_SUB_TABS.CIRCUITS) {
    return (
      <div className="relative">
        <div className="relative z-10 space-y-6 p-6">
          {subTabsHeader}
          <CircuitsBankView
            data={data}
            updateData={updateData}
            isAuthenticated={isAuthenticated}
            intensityCoeffs={intensityCoeffs}
            maxRecordsByExerciseId={maxRecordsByExerciseId}
          />
        </div>
      </div>
    );
  }

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
            <MyProgramBankView activeProgram={visibleActiveProgram} />
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
              <MyProgramBankView activeProgram={visibleActiveProgram} />
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
      {isAuthenticated && (
      <Card variant="sport">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            {t('exercisesTab.source.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setDataSource('exercise_bank');
                setViewMode('exercises');
                setSelectedProgram(null);
                setFilters((prev) => {
                  const next = { ...prev };
                  delete next.programDay;
                  delete next.programSlot;
                  delete next.programFocus;
                  return next;
                });
              }}
              className={`gradient-button-premium gradient-button-premium-sm rounded-lg ${
                dataSource === 'exercise_bank' ? 'gradient-button-premium-variant' : ''
              }`}
            >
              {t('exercisesTab.source.allBank', 'Tous les exercices')}
            </button>
            <select
              value={
                dataSource === 'all_programs' && selectedProgram?.id != null
                  ? String(selectedProgram.id)
                  : ''
              }
              onChange={(e) => {
                const id = e.target.value;
                if (!id) {
                  setSelectedProgram(null);
                  setDataSource('exercise_bank');
                  setFilters((prev) => {
                    const next = { ...prev };
                    delete next.programDay;
                    delete next.programSlot;
                    delete next.programFocus;
                    return next;
                  });
                  return;
                }
                const program = visiblePrograms.find((p) => String(p.id) === String(id));
                if (!program) return;
                setSelectedProgram(program);
                setDataSource('all_programs');
                setViewMode('exercises');
              }}
              className="min-w-[220px] rounded-lg border border-[#0F4C5C]/60 bg-black px-3 py-2 text-sm text-teal-100"
              aria-label={t('exercisesTab.source.pickProgram', 'Choisir un programme')}
            >
              <option value="">
                {visiblePrograms.length
                  ? t('exercisesTab.source.pickProgram', 'Choisir un programme…')
                  : t(
                      'exercisesTab.source.noUserPrograms',
                      'Aucun programme créé'
                    )}
              </option>
              {visiblePrograms.map((program) => (
                <option key={program.id} value={String(program.id)}>
                  {program.name}
                  {visibleActiveProgram?.id === program.id ? ' · actif' : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-3 text-sm text-slate-400">
            {dataSource === 'exercise_bank' &&
              t(
                'exercisesTab.source.description.bank',
                'Affichage de toute la banque d’exercices (sans doublons).'
              )}
            {dataSource === 'all_programs' &&
              selectedProgram &&
              t('exercisesTab.source.description.allProgramsView', {
                programName: selectedProgram.name,
                defaultValue: `Exercices du programme « ${selectedProgram.name} » uniquement (doublons fusionnés, sauf filtre par jour).`
              })}
            {isAuthenticated && visiblePrograms.length === 0 &&
              t(
                'exercisesTab.source.description.noUserPrograms',
                'Aucun programme dans ton compte — crée-en un dans l’onglet Programme.'
              )}
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
                <p className="text-xl font-bold text-white">{bankListPending ? '…' : exerciseStats.total}</p>
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
                  {bankListPending ? '…' : Object.keys(exerciseStats.byCategory).length}
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
                  {bankListPending ? '…' : Object.keys(exerciseStats.byMuscleGroup).length}
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
                <p className="text-xl font-bold text-white">{bankListPending ? '…' : filteredExercises.length}</p>
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
          <CardContent className="space-y-4">
            {isProgramDataSource ? (
              <div className="space-y-3 rounded-xl border border-teal-500/25 bg-teal-950/20 p-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-teal-300/90">
                    Filtres programme
                  </p>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Disponibles uniquement quand un de tes programmes est la source.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setProgramLayout('chrono')}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                      programLayout === 'chrono'
                        ? 'border-teal-400/50 bg-teal-500/20 text-teal-100'
                        : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'
                    }`}
                  >
                    Ordre chronologique (lun → dim)
                  </button>
                  <button
                    type="button"
                    onClick={() => setProgramLayout('muscle')}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                      programLayout === 'muscle'
                        ? 'border-teal-400/50 bg-teal-500/20 text-teal-100'
                        : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'
                    }`}
                  >
                    Par groupe musculaire
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <label className="text-[11px] text-slate-400">
                    Jour de la semaine
                    <select
                      value={filters.programDay || ''}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          programDay: e.target.value || undefined
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-[#0F4C5C]/60 bg-black px-2.5 py-2 text-sm text-teal-100"
                    >
                      <option value="">Tous les jours (dédupliqué)</option>
                      {PROGRAM_WEEK_DAYS.map((day) => (
                        <option key={day} value={day}>
                          {PROGRAM_DAY_LABELS[day]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-[11px] text-slate-400">
                    Emplacement / variante
                    <select
                      value={filters.programSlot || ''}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          programSlot: e.target.value || undefined
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-[#0F4C5C]/60 bg-black px-2.5 py-2 text-sm text-teal-100"
                    >
                      <option value="">Tous (maison + salle)</option>
                      <option value="maison">Maison</option>
                      <option value="semaineA">Salle — semaine A</option>
                      <option value="semaineB">Salle — semaine B</option>
                    </select>
                  </label>
                  <label className="text-[11px] text-slate-400">
                    Focus du jour
                    <select
                      value={filters.programFocus || ''}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          programFocus: e.target.value || undefined
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-[#0F4C5C]/60 bg-black px-2.5 py-2 text-sm text-teal-100"
                    >
                      <option value="">Tous les focus</option>
                      {programFocusOptions.map((focus) => (
                        <option key={focus} value={focus}>
                          {focus}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {(filters.programDay || filters.programSlot || filters.programFocus) && (
                  <button
                    type="button"
                    onClick={() =>
                      setFilters((prev) => {
                        const next = { ...prev };
                        delete next.programDay;
                        delete next.programSlot;
                        delete next.programFocus;
                        return next;
                      })
                    }
                    className="text-[11px] text-teal-300/90 underline-offset-2 hover:underline"
                  >
                    Réinitialiser les filtres programme
                  </button>
                )}
              </div>
            ) : null}
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
                ? t('exercisesTab.exercises.titleWithProgram', { count: bankListPending ? 0 : filteredExercises.length, programName: selectedProgram.name })
                : bankListPending
                  ? 'Banque d’exercices'
                  : t('exercisesTab.exercises.title', { count: filteredExercises.length })
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bankListPending ? (
              <p className="py-10 text-center text-sm text-slate-400">Préparation de la banque…</p>
            ) : filteredExercises.length === 0 ? (
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
            ) : useChronoLayout ? (
              <div className="space-y-8">
                {chronologicalDayGroups.map((dayGroup) => (
                  <section key={dayGroup.day} className="space-y-3">
                    <header className="border-b border-[#0F4C5C]/50 pb-2">
                      <h3 className="text-base font-semibold tracking-wide text-teal-100">
                        {dayGroup.label}
                        <span className="ml-2 text-sm font-normal text-slate-500">
                          ({dayGroup.rows.length})
                        </span>
                      </h3>
                      {dayGroup.focus ? (
                        <p className="mt-0.5 text-xs text-slate-400">{dayGroup.focus}</p>
                      ) : null}
                      <p className="mt-1.5 text-[12px] leading-snug text-slate-300">
                        <span className="font-medium text-teal-300/90">Muscles sollicités :</span>{' '}
                        {dayGroup.muscles.length
                          ? dayGroup.muscles.join(' · ')
                          : '—'}
                      </p>
                    </header>
                    <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {dayGroup.rows.map((exercise, index) => (
                        <SportBankExerciseCard
                          key={`${dayGroup.day}-${exercise.programSlot || 'x'}-${exercise.id}-${index}`}
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
                  </section>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {visibleExerciseGroups.map((group) => (
                  <section key={group.category} className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-teal-200 border-b border-[#0F4C5C]/50 pb-2">
                      {group.category} ({group.total})
                    </h3>
                    <div className="grid grid-cols-1 items-stretch sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {group.rows.map((exercise) => (
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
                  </section>
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

const ExercisesTab = () => (
  <AnatomyPreviewCaptureProvider>
    <ExercisesTabBody />
  </AnatomyPreviewCaptureProvider>
);

export default ExercisesTab;