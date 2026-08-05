import { useState, useEffect, useRef, useCallback } from 'react';
import { cleanJustifications } from '../utils/dayJustificationUtils';
import { DEFAULT_ADDICTION_QUIT_DATA } from '../utils/addictionQuitConstants';
import { deriveJourneyStartYmd } from '../utils/sport/recapUserAssessment';
import {
  hasWorkoutContent,
} from '../utils/workoutPersistence';
import {
  extractDaySliceFromAggregate,
  mergeSessionDaysIntoAggregate,
  workoutMetadataFingerprint,
  listLegacySessionDatesInAggregate,
} from '../utils/workoutSessionPersistence.js';
import { persistWorkoutSessionDay } from '../services/workout/workoutDbGateway.js';
import {
  getAllWorkoutSessionsForScope,
  migrateLegacySessionsFromAggregate,
} from '../services/workout/workoutSessionDbGateway.js';
import logger from '../utils/logger';
import { readServerTokens } from '../utils/serverAuthApi.js';
import { createWorkoutRepository } from '../services/workout/createWorkoutRepository.js';
import { fetchMomentumApiV1WorkoutAggregate } from '../services/sync/fetchMomentumApiV1.js';
import {
  isWorkoutAggregateCloudSyncEnabled,
  pickNewerWorkoutRawForLoad,
  normalizeWorkoutAggregateRawForIdb,
  flushWorkoutAggregateCloudPushNow
} from '../services/workout/workoutAggregateCloudSync.js';
import { applyWorkoutRepIntegrations, needsWorkoutRepIntegration } from '../services/endurance/workoutRepIntegrations';
import { normalizeExerciseSetLog } from '../utils/exerciseSetLogUtils';

const workoutDataLog = logger.module('useWorkoutData');

// Données de test pour l'historique d'entraînement
const generateTestWorkoutData = () => {
  const testData = {
    checkedExercises: {},
    reps: {},
    exerciseWeights: {},
  exerciseMarkedWeighted: {},
    exerciseWeightPerArm: {},
    exerciseSetWeights: {},
    exerciseSetLogs: {},
    checkedStretches: {},
    startDate: null,
    weekVariant: 'A',
    progressPhotos: [],
    exerciseIntensityCoeffs: {},
    exercisePerceivedRatings: {},
    exercisePersonalNotes: {},
    exerciseSessionEffortStars: {},
    exerciseSessionPleasureStars: {},
    exerciseSessionPerceived: {},
    stretchPerceivedRatings: {},
    stretchPersonalNotes: {},
    stretchSessionEffortStars: {}
  };

  // Générer des données pour les 30 derniers jours
  const today = new Date();
  
  // Pool d'exercices avec les vrais IDs du programme
  const exercisePool = [
    // Lundi - Dos/Biceps
    { id: 101, reps: () => Math.floor(Math.random() * 8) + 5 }, // Tractions
    { id: 102, reps: () => Math.floor(Math.random() * 12) + 8 }, // Tractions australiennes
    { id: 103, reps: () => Math.floor(Math.random() * 10) + 6 }, // Dips
    { id: 104, reps: () => Math.floor(Math.random() * 12) + 8 }, // Pompes déclinées
    { id: 105, reps: () => Math.floor(Math.random() * 20) + 15 }, // Relevés de genoux
    
    // Mardi - Pectoraux/Triceps/Épaules
    { id: 201, reps: () => Math.floor(Math.random() * 12) + 8 }, // Pompes lestées
    { id: 202, reps: () => Math.floor(Math.random() * 12) + 8 }, // Pompes inclinées
    { id: 203, reps: () => Math.floor(Math.random() * 10) + 8 }, // Curl alterné
    { id: 204, reps: () => Math.floor(Math.random() * 12) + 8 }, // Curl marteau
    { id: 206, reps: () => Math.floor(Math.random() * 12) + 8 }, // Pompes serrées diamant
    
    // Mercredi - Boxe
    { id: 301, reps: () => Math.floor(Math.random() * 10) + 8 }, // Pompes déclinées
    { id: 302, reps: () => Math.floor(Math.random() * 10) + 8 }, // Pompes pseudo-planche
    { id: 303, reps: () => Math.floor(Math.random() * 10) + 8 }, // Développé militaire
    { id: 304, reps: () => Math.floor(Math.random() * 15) + 10 }, // Élévations latérales
    { id: 307, reps: () => Math.floor(Math.random() * 12) + 8 }, // Extensions triceps
    
    // Vendredi - Salle
    { id: 501, reps: () => Math.floor(Math.random() * 5) + 3 }, // Tractions supination
    { id: 502, reps: () => Math.floor(Math.random() * 12) + 8 }, // Tractions australiennes
    { id: 503, reps: () => Math.floor(Math.random() * 8) + 5 }, // Dips parallèles
    { id: 504, reps: () => Math.floor(Math.random() * 10) + 8 }, // Pompes déclinées
    { id: 505, reps: () => Math.floor(Math.random() * 20) + 15 }, // Relevés de genoux
    
    // Samedi - Variante
    { id: 601, reps: () => Math.floor(Math.random() * 12) + 8 }, // Pompes inclinées tempo
    { id: 602, reps: () => Math.floor(Math.random() * 12) + 8 }, // Pompes serrées tempo
    { id: 603, reps: () => Math.floor(Math.random() * 10) + 8 }, // Curl concentration
    { id: 604, reps: () => Math.floor(Math.random() * 12) + 8 }, // Curl marteau
    
    // Dimanche - Repos actif
    { id: 701, reps: () => Math.floor(Math.random() * 12) + 8 }, // Pompes sur poignées
    { id: 702, reps: () => Math.floor(Math.random() * 10) + 8 }, // Pompes pseudo-planche
    { id: 703, reps: () => Math.floor(Math.random() * 10) + 8 }, // Développé militaire
    
    // Variantes salle samedi
    { id: 631, reps: () => Math.floor(Math.random() * 10) + 6 }, // Développé incliné haltères
    { id: 632, reps: () => Math.floor(Math.random() * 10) + 6 }, // Développé incliné barre
    { id: 638, reps: () => Math.floor(Math.random() * 12) + 8 }, // Curl incliné haltères
    { id: 639, reps: () => Math.floor(Math.random() * 12) + 8 }, // Curl marteau
    
    // Variantes salle dimanche (jambes)
    { id: 731, reps: () => Math.floor(Math.random() * 10) + 6 }, // Squat
    { id: 732, reps: () => Math.floor(Math.random() * 12) + 8 }, // Presse à cuisses
    { id: 733, reps: () => Math.floor(Math.random() * 10) + 8 }, // Fentes marchées
    { id: 738, reps: () => Math.floor(Math.random() * 20) + 15 } // Mollets debout
  ];

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    // Simuler quelques exercices complétés de manière aléatoire
    if (Math.random() > 0.25) { // 75% de chance d'avoir fait du sport ce jour-là
      // Sélectionner 3-6 exercices aléatoires du pool
      const numExercises = Math.floor(Math.random() * 4) + 3;
      const selectedExercises = [];
      
      // Mélanger le pool d'exercices et prendre les premiers
      const shuffledPool = [...exercisePool].sort(() => Math.random() - 0.5);
      
      for (let j = 0; j < numExercises && j < shuffledPool.length; j++) {
        const exercise = shuffledPool[j];
        const key = `${dateStr}_${exercise.id}`;
        testData.checkedExercises[key] = true;
        testData.reps[key] = exercise.reps();
        selectedExercises.push(exercise.id);
      }
    }
  }

  return testData;
};

// État initial partagé (utile pour créer un jeu vide par utilisateur)
const INITIAL_WORKOUT_DATA = {
  checkedExercises: {},
  reps: {},
  /** Poids saisis (kg) par clé d’exercice — même schéma de clés que `reps` */
  exerciseWeights: {},
  exerciseMarkedWeighted: {},
  /** Haltères : true = la saisie est le kg par haltère (volume ×2 si bilatéral deux haltères) */
  exerciseWeightPerArm: {},
  /** Poids (kg) par série, même clé — tableau de chaînes même longueur que le nombre de séries */
  exerciseSetWeights: {},
  exerciseSetLogs: {},
  checkedStretches: {},
  startDate: null,
  weekVariant: 'A',
  progressPhotos: [],
  progressEntries: [],
  bodyTrackingReminders: [],
  bodyTrackingLastUpdated: null,
  sessionFeedbacks: {}, // Stockage des feedbacks de session par date
  // ✅ NOUVEAU : Système de variations journalières pour l'onglet "Aujourd'hui"
  dailyVariations: {}, // Format: { "YYYY-MM-DD": DailyVariation }
  dailyVariationsVersion: '1.0', // Version du schéma pour migrations futures
  // ✅ NOUVEAU : Système de justification des jours sans activité
  dayJustifications: {}, // Format: { "YYYY-MM-DD": { reason, note?, createdAt, updatedAt } }
  dayJustificationsVersion: '1.0', // Version du schéma pour migrations futures
  // Coefficients de charge calendrier / historique (surcharges par id d'exercice, optionnel)
  exerciseIntensityCoeffs: {},
  /** Notes subjectives 1–10 par critère (modifiables dans l’onglet Exercices > fiche) */
  exercisePerceivedRatings: {},
  exercisePersonalNotes: {},
  /**
   * Ressenti 1–5 étoiles par clé jour+exercice (même schéma que `reps`).
   * Saisie dans l’onglet Aujourd’hui ; prise en compte dans l’analyse de difficulté une fois l’exercice coché.
   */
  exerciseSessionEffortStars: {},
  /** Triple ressenti par séance : { "YYYY-MM-DD_id": { difficulty, feeling, pleasure } } */
  exerciseSessionPerceived: {},
  /**
   * 1–5 « plaisir / qualité du ressenti » (plus = meilleure séance) — mêmes clés que l’effort perçu.
   */
  exerciseSessionPleasureStars: {},
  /**
   * Notes subjectives 1–10 par critère pour chaque étirement de la banque.
   * Format : { [stretchKey]: { difficulty: 1-10, enjoyment: 1-10, recovery: 1-10 } }
   * La moyenne des 3 critères pilote l'XP gagnée par étirement coché (100 → 300 XP).
   * Stockées par `stretchKey` (et non par item-id) pour partager la note entre
   * toutes les occurrences du même étirement dans la semaine.
   */
  stretchPerceivedRatings: {},
  /** Notes personnelles libres par étirement (clés stretchKey de la banque). */
  stretchPersonalNotes: {},
  /**
   * Étoiles 1–5 « ressenti du jour » par clé item (`YYYY-MM-DD_stretch_{moment}_{id}`).
   * Si renseigné pour une coche validée, l’XP de cette coche suit ce barème (100–300) au lieu de la fiche banque.
   */
  stretchSessionEffortStars: {},
  /** Records max courants par exercice (street/muscu/endurance/boxe) */
  exerciseMaxRecords: [],
  /** Historique complet des enregistrements de performances */
  exerciseMaxHistory: [],
  /** Retests planifiés depuis Défis > Performances */
  performanceRetestPlans: [],
  /** Journal des séances pyramide complétées (coche Aujourd’hui avec plan actif) */
  pyramidSessionLog: [],
  /** Arrêt tabac / THC : timers, jalons 20 ans, journal des envies (IndexedDB via saveToDB) */
  addictionQuitData: { ...DEFAULT_ADDICTION_QUIT_DATA },
  /**
   * Circuits : bibliothèque globale (référencée par les programmes via `schedule[day].circuitIds`).
   * Format : { [circuitId]: CircuitDef } — voir `src/utils/circuits/circuitDefinitionUtils.js`.
   */
  circuitDefinitions: {},
  /**
   * Suivi des tours réalisés par jour pour chaque circuit.
   * Format : { "YYYY-MM-DD": { [circuitId]: { roundsCompleted: number, finishedAt?: ISO } } }
   */
  circuitProgress: {},
  /** Version du schéma circuits — pour migrations futures. */
  circuitDefinitionsVersion: '1.0',
  /** Préférences entraînement persistées (swap repos, confirmations, etc.). */
  trainingPrefs: {
    swapRestConfirmEnabled: true
  },
  /** Swap hebdo du jour de repos : { [programId]: { [weekStartDate]: { fromDay, toDay, updatedAt } } } */
  restDaySwaps: {},
  // homepageImages supprimé - maintenant géré par useHomepageImages indépendant
};

export const useWorkoutData = (options = {}) => {
  const {
    // Clé de stockage pour séparer les données par utilisateur
    storageKey = 'main',
    // Générer (ou non) des données de test lorsqu'aucune donnée n'existe
    generateTestData = true,
    // Mode éphémère : aucune lecture / écriture persistance (ex: utilisateur déconnecté)
    ephemeral = false,
    // Attendre la fin du chargement auth avant de lire IndexedDB (évite clé anonymous + écrasement)
    deferLoad = false,
  } = options;

  const [data, setData] = useState(INITIAL_WORKOUT_DATA);

  // Tous les useRef doivent être déclarés avant les useCallback et useEffect
  const debounceTimerRef = useRef(null);
  const isInitialLoadRef = useRef(true);
  /** File d’attente : une seule écriture IndexedDB à la fois (F-04). */
  const saveChainRef = useRef(Promise.resolve());
  /** Après sauvegarde manuelle, ignorer autoSave debounce (F-03). */
  const suppressAutoSaveUntilRef = useRef(0);
  /** Empreinte légère pour éviter JSON.stringify complet dans autoSave. */
  const lastAutoSaveFingerprintRef = useRef('');
  /** Dernier put métadonnées `workouts` (évite réécriture photos / endurance). */
  const lastMetadataFingerprintRef = useRef('');
  const sessionMigrationDoneRef = useRef(new Set());
  /** Repository Phase 1 — seule voie d’accès au store `workouts` (IndexedDB). */
  const workoutRepoRef = useRef(null);

  const workoutDataFingerprint = (payload) => {
    if (!payload || typeof payload !== 'object') return '0';
    const ce = payload.checkedExercises || {};
    const reps = payload.reps || {};
    const cs = payload.checkedStretches || {};
    let checkedCount = 0;
    for (const v of Object.values(ce)) {
      if (v === true) checkedCount += 1;
    }
    let repSum = 0;
    for (const v of Object.values(reps)) {
      repSum += parseInt(v, 10) || 0;
    }
    let stretchCount = 0;
    for (const v of Object.values(cs)) {
      if (v === true) stretchCount += 1;
    }
    return [
      Object.keys(ce).length,
      checkedCount,
      Object.keys(reps).length,
      repSum,
      Object.keys(cs).length,
      stretchCount,
      payload.lastSaved || '',
    ].join('|');
  };

  const runSerializedSave = useCallback((saveTask, options = {}) => {
    if (options.priority) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      saveChainRef.current = Promise.resolve();
    }
    const task = saveChainRef.current.then(() => saveTask());
    saveChainRef.current = task.catch(() => {});
    return task;
  }, []);

  const enrichWorkoutStateWithSessions = useCallback(async (baseState) => {
    let state = baseState && typeof baseState === 'object' ? { ...baseState } : { ...INITIAL_WORKOUT_DATA };
    try {
      const idbSessions = await getAllWorkoutSessionsForScope(storageKey);
      if (idbSessions.length > 0) {
        state = mergeSessionDaysIntoAggregate(state, idbSessions);
      }
    } catch (e) {
      workoutDataLog.warn('Lecture workoutSessions ignorée', e);
    }
    return state;
  }, [storageKey]);

  const getWorkoutRepo = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (!workoutRepoRef.current) {
      workoutRepoRef.current = createWorkoutRepository('local');
    }
    return workoutRepoRef.current;
  }, []);

  // ✅ Migration automatique des dayJustifications depuis ancien format
  // DOIT être définie AVANT loadFromDB qui l'utilise
  // Pattern identique à migrateDailyVariations pour cohérence
  const migrateDayJustifications = (rawData) => {
    // Si dayJustifications n'existe pas, initialiser vide
    if (!rawData.dayJustifications) {
      return {
        ...rawData,
        dayJustifications: {},
        dayJustificationsVersion: '1.0'
      };
    }
    
    // ✅ Nettoyer les justifications invalides (dates futures, structures invalides)
    // Utilise cleanJustifications importé depuis dayJustificationUtils
    const { cleaned, removed } = cleanJustifications(rawData.dayJustifications);
    
    if (removed.length > 0) {
      workoutDataLog.debug(`🔄 Migration dayJustifications: ${removed.length} justification(s) invalide(s) supprimée(s)`);
    }
    
    return {
      ...rawData,
      dayJustifications: cleaned,
      dayJustificationsVersion: rawData.dayJustificationsVersion || '1.0'
    };
  };

  // ✅ Migration automatique des dailyVariations depuis ancien format
  // DOIT être définie AVANT loadFromDB qui l'utilise
  const migrateDailyVariations = (rawData) => {
    // Si dailyVariations n'existe pas, initialiser vide
    if (!rawData.dailyVariations) {
      return {
        ...rawData,
        dailyVariations: {},
        dailyVariationsVersion: '1.0'
      };
    }
    
    // ✅ Migration depuis ancien format (si version < 1.0 ou absente)
    const migratedVariations = {};
    let migrationNeeded = false;
    
    Object.entries(rawData.dailyVariations || {}).forEach(([dateStr, variation]) => {
      // ✅ Vérifier si migration nécessaire
      if (!variation.version || parseFloat(variation.version || '0') < 1.0) {
        migrationNeeded = true;
        
        // Migration depuis format ancien vers format 1.0
        migratedVariations[dateStr] = {
          ...variation,
          date: variation.date || dateStr, // S'assurer que date existe
          suppressedExercises: Array.isArray(variation.suppressedExercises) 
            ? variation.suppressedExercises.filter(id => typeof id === 'number' && !isNaN(id))
            : [],
          additionalExercises: Array.isArray(variation.additionalExercises)
            ? variation.additionalExercises.map(ex => ({
                ...ex,
                version: '1.0',
                schemaVersion: 1,
                // ✅ S'assurer que completed existe
                completed: ex.completed !== undefined ? ex.completed : false,
                // ✅ S'assurer que isExceptional est true
                isExceptional: true,
                // ✅ Initialiser métadonnées si absentes
                modificationCount: ex.modificationCount || 0,
                lastModifiedAt: ex.lastModifiedAt || ex.addedAt || new Date(),
                // ✅ Valider que le type est correct
                type: ex.type && ['reps', 'duration'].includes(ex.type) ? ex.type : 'reps'
              }))
            : [],
          version: '1.0',
          schemaVersion: 1,
          // ✅ Initialiser compteur si absent
          lastExceptionalIdCounter: variation.lastExceptionalIdCounter || 
            (variation.additionalExercises?.length || 0),
          // ✅ Initialiser métadonnées si absentes
          modificationCount: variation.modificationCount || 0,
          lastModifiedAt: variation.lastModifiedAt || variation.createdAt || new Date(),
          createdAt: variation.createdAt || new Date()
        };
      } else {
        // ✅ Déjà à jour, garder tel quel
        migratedVariations[dateStr] = variation;
      }
    });
    
    // ✅ Log si migration effectuée
    if (migrationNeeded) {
      workoutDataLog.debug('🔄 Migration dailyVariations effectuée (format 1.0)');
    }
    
    return {
      ...rawData,
      dailyVariations: migratedVariations,
      dailyVariationsVersion: rawData.dailyVariationsVersion || '1.0'
    };
  };

  // ✅ Migration / normalisation des Circuits (définitions + progression).
  // Tolérante : on garde toutes les valeurs valides, on rejette les entrées corrompues.
  const migrateCircuits = (rawData) => {
    const inputDefs = rawData.circuitDefinitions && typeof rawData.circuitDefinitions === 'object'
      ? rawData.circuitDefinitions
      : {};
    const inputProgress = rawData.circuitProgress && typeof rawData.circuitProgress === 'object'
      ? rawData.circuitProgress
      : {};

    const cleanDefs = {};
    Object.entries(inputDefs).forEach(([id, def]) => {
      if (!id || typeof id !== 'string') return;
      if (!def || typeof def !== 'object') return;
      if (!def.name || typeof def.name !== 'string') return;
      const target = Number(def.targetRounds);
      if (!Number.isFinite(target) || target <= 0) return;
      const items = Array.isArray(def.items)
        ? def.items
            .filter((it) => it && typeof it === 'object' && it.exerciseKey)
            .map((it, idx) => ({
              slotId: typeof it.slotId === 'string' && it.slotId ? it.slotId : `s_${idx + 1}`,
              exerciseKey: String(it.exerciseKey),
              exerciseName: typeof it.exerciseName === 'string' ? it.exerciseName : String(it.exerciseKey),
              mode: it.mode === 'duration' ? 'duration' : 'reps',
              targetReps: it.mode === 'duration' ? null : (Number(it.targetReps) > 0 ? Number(it.targetReps) : 10),
              targetDurationSec: it.mode === 'duration' ? (Number(it.targetDurationSec) > 0 ? Number(it.targetDurationSec) : 30) : null,
              notes: typeof it.notes === 'string' ? it.notes : ''
            }))
        : [];
      cleanDefs[id] = {
        id,
        name: def.name,
        targetRounds: Math.min(50, Math.max(1, Math.round(target))),
        restBetweenRoundsSec: Number.isFinite(Number(def.restBetweenRoundsSec)) ? Math.max(0, Number(def.restBetweenRoundsSec)) : 60,
        notes: typeof def.notes === 'string' ? def.notes : '',
        primaryMuscles: Array.isArray(def.primaryMuscles) ? def.primaryMuscles.filter((m) => typeof m === 'string') : [],
        items,
        createdAt: def.createdAt || new Date().toISOString(),
        updatedAt: def.updatedAt || def.createdAt || new Date().toISOString()
      };
    });

    const cleanProgress = {};
    Object.entries(inputProgress).forEach(([dateStr, byCircuit]) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return;
      if (!byCircuit || typeof byCircuit !== 'object') return;
      const dayMap = {};
      Object.entries(byCircuit).forEach(([circuitId, val]) => {
        if (!circuitId) return;
        const rounds = Number(val?.roundsCompleted);
        if (!Number.isFinite(rounds) || rounds <= 0) return;
        dayMap[circuitId] = {
          roundsCompleted: Math.max(0, Math.round(rounds)),
          ...(val?.finishedAt ? { finishedAt: val.finishedAt } : {})
        };
      });
      if (Object.keys(dayMap).length > 0) cleanProgress[dateStr] = dayMap;
    });

    return {
      ...rawData,
      circuitDefinitions: cleanDefs,
      circuitProgress: cleanProgress,
      circuitDefinitionsVersion: rawData.circuitDefinitionsVersion || '1.0'
    };
  };

  /** Normalise une ligne `workouts` IndexedDB vers l’état React (migrations + validation). */
  const materializeValidatedFromIdbRow = (result) => {
    const migratedDataStep1 = migrateDailyVariations(result.data || result);
    const migratedDataStep2 = migrateDayJustifications(migratedDataStep1);
    const migratedData = migrateCircuits(migratedDataStep2);
    return {
      checkedExercises: migratedData.checkedExercises || {},
      reps: migratedData.reps || {},
      exerciseWeights:
        migratedData.exerciseWeights && typeof migratedData.exerciseWeights === 'object'
          ? { ...migratedData.exerciseWeights }
          : {},
      exerciseMarkedWeighted:
        migratedData.exerciseMarkedWeighted && typeof migratedData.exerciseMarkedWeighted === 'object'
          ? { ...migratedData.exerciseMarkedWeighted }
          : {},
      exerciseWeightPerArm:
        migratedData.exerciseWeightPerArm && typeof migratedData.exerciseWeightPerArm === 'object'
          ? { ...migratedData.exerciseWeightPerArm }
          : {},
      exerciseSetWeights:
        migratedData.exerciseSetWeights && typeof migratedData.exerciseSetWeights === 'object'
          ? { ...migratedData.exerciseSetWeights }
          : {},
      exerciseSetLogs:
        migratedData.exerciseSetLogs && typeof migratedData.exerciseSetLogs === 'object'
          ? { ...migratedData.exerciseSetLogs }
          : {},
      checkedStretches: migratedData.checkedStretches || {},
      startDate: migratedData.startDate || null,
      weekVariant: migratedData.weekVariant || 'A',
      progressPhotos: Array.isArray(migratedData.progressPhotos) ? migratedData.progressPhotos : [],
      progressEntries: Array.isArray(migratedData.progressEntries) ? migratedData.progressEntries : [],
      bodyTrackingReminders: Array.isArray(migratedData.bodyTrackingReminders) ? migratedData.bodyTrackingReminders : [],
      bodyTrackingLastUpdated: migratedData.bodyTrackingLastUpdated || null,
      sessionFeedbacks: migratedData.sessionFeedbacks || {},
      dailyVariations: migratedData.dailyVariations || {},
      dailyVariationsVersion: migratedData.dailyVariationsVersion || '1.0',
      dayJustifications: migratedData.dayJustifications || {},
      dayJustificationsVersion: migratedData.dayJustificationsVersion || '1.0',
      exerciseIntensityCoeffs:
        migratedData.exerciseIntensityCoeffs && typeof migratedData.exerciseIntensityCoeffs === 'object'
          ? { ...migratedData.exerciseIntensityCoeffs }
          : {},
      exercisePerceivedRatings:
        migratedData.exercisePerceivedRatings && typeof migratedData.exercisePerceivedRatings === 'object'
          ? { ...migratedData.exercisePerceivedRatings }
          : {},
      exercisePersonalNotes:
        migratedData.exercisePersonalNotes && typeof migratedData.exercisePersonalNotes === 'object'
          ? { ...migratedData.exercisePersonalNotes }
          : {},
      exerciseSessionEffortStars:
        migratedData.exerciseSessionEffortStars && typeof migratedData.exerciseSessionEffortStars === 'object'
          ? { ...migratedData.exerciseSessionEffortStars }
          : {},
      exerciseSessionPleasureStars:
        migratedData.exerciseSessionPleasureStars && typeof migratedData.exerciseSessionPleasureStars === 'object'
          ? { ...migratedData.exerciseSessionPleasureStars }
          : {},
      stretchPerceivedRatings:
        migratedData.stretchPerceivedRatings && typeof migratedData.stretchPerceivedRatings === 'object'
          ? { ...migratedData.stretchPerceivedRatings }
          : {},
      stretchPersonalNotes:
        migratedData.stretchPersonalNotes && typeof migratedData.stretchPersonalNotes === 'object'
          ? { ...migratedData.stretchPersonalNotes }
          : {},
      stretchSessionEffortStars:
        migratedData.stretchSessionEffortStars && typeof migratedData.stretchSessionEffortStars === 'object'
          ? { ...migratedData.stretchSessionEffortStars }
          : {},
      exerciseMaxRecords: Array.isArray(migratedData.exerciseMaxRecords) ? migratedData.exerciseMaxRecords : [],
      exerciseMaxHistory: Array.isArray(migratedData.exerciseMaxHistory) ? migratedData.exerciseMaxHistory : [],
      performanceRetestPlans: Array.isArray(migratedData.performanceRetestPlans) ? migratedData.performanceRetestPlans : [],
      pyramidSessionLog: Array.isArray(migratedData.pyramidSessionLog) ? migratedData.pyramidSessionLog : [],
      addictionQuitData:
        migratedData.addictionQuitData && typeof migratedData.addictionQuitData === 'object'
          ? migratedData.addictionQuitData
          : INITIAL_WORKOUT_DATA.addictionQuitData,
      circuitDefinitions:
        migratedData.circuitDefinitions && typeof migratedData.circuitDefinitions === 'object'
          ? { ...migratedData.circuitDefinitions }
          : {},
      circuitProgress:
        migratedData.circuitProgress && typeof migratedData.circuitProgress === 'object'
          ? { ...migratedData.circuitProgress }
          : {},
      circuitDefinitionsVersion: migratedData.circuitDefinitionsVersion || '1.0',
      trainingPrefs:
        migratedData.trainingPrefs && typeof migratedData.trainingPrefs === 'object'
          ? { swapRestConfirmEnabled: migratedData.trainingPrefs.swapRestConfirmEnabled !== false }
          : { swapRestConfirmEnabled: true },
      restDaySwaps:
        migratedData.restDaySwaps && typeof migratedData.restDaySwaps === 'object'
          ? { ...migratedData.restDaySwaps }
          : {},
      enduranceData: migratedData.enduranceData || result.enduranceData || {
        sessions: {
          boxing: [],
          pushups: [],
          swimming: [],
          jumprope: [],
          running: []
        },
        challenges: []
      }
    };
  };

  /** État normalisé depuis `workoutData_backup_${storageKey}` (localStorage). */
  const stateFromLsBackup = (parsedBackup) => {
    const migratedBackup = migrateCircuits(migrateDailyVariations(parsedBackup));
    return {
      ...migratedBackup,
      exerciseIntensityCoeffs:
        migratedBackup.exerciseIntensityCoeffs && typeof migratedBackup.exerciseIntensityCoeffs === 'object'
          ? { ...migratedBackup.exerciseIntensityCoeffs }
          : {},
      exercisePerceivedRatings:
        migratedBackup.exercisePerceivedRatings && typeof migratedBackup.exercisePerceivedRatings === 'object'
          ? { ...migratedBackup.exercisePerceivedRatings }
          : {},
      exercisePersonalNotes:
        migratedBackup.exercisePersonalNotes && typeof migratedBackup.exercisePersonalNotes === 'object'
          ? { ...migratedBackup.exercisePersonalNotes }
          : {},
      exerciseSessionEffortStars:
        migratedBackup.exerciseSessionEffortStars &&
        typeof migratedBackup.exerciseSessionEffortStars === 'object'
          ? { ...migratedBackup.exerciseSessionEffortStars }
          : {},
      exerciseSessionPleasureStars:
        migratedBackup.exerciseSessionPleasureStars &&
        typeof migratedBackup.exerciseSessionPleasureStars === 'object'
          ? { ...migratedBackup.exerciseSessionPleasureStars }
          : {},
      stretchPerceivedRatings:
        migratedBackup.stretchPerceivedRatings && typeof migratedBackup.stretchPerceivedRatings === 'object'
          ? { ...migratedBackup.stretchPerceivedRatings }
          : {},
      stretchPersonalNotes:
        migratedBackup.stretchPersonalNotes && typeof migratedBackup.stretchPersonalNotes === 'object'
          ? { ...migratedBackup.stretchPersonalNotes }
          : {},
      stretchSessionEffortStars:
        migratedBackup.stretchSessionEffortStars &&
        typeof migratedBackup.stretchSessionEffortStars === 'object'
          ? { ...migratedBackup.stretchSessionEffortStars }
          : {},
      exerciseMaxRecords: Array.isArray(migratedBackup.exerciseMaxRecords) ? migratedBackup.exerciseMaxRecords : [],
      exerciseMaxHistory: Array.isArray(migratedBackup.exerciseMaxHistory) ? migratedBackup.exerciseMaxHistory : [],
      performanceRetestPlans: Array.isArray(migratedBackup.performanceRetestPlans) ? migratedBackup.performanceRetestPlans : [],
      pyramidSessionLog: Array.isArray(migratedBackup.pyramidSessionLog) ? migratedBackup.pyramidSessionLog : [],
      addictionQuitData:
        migratedBackup.addictionQuitData && typeof migratedBackup.addictionQuitData === 'object'
          ? migratedBackup.addictionQuitData
          : INITIAL_WORKOUT_DATA.addictionQuitData
    };
  };

  /** Valide uniquement les maps d’un jour (chemin incrémental). */
  const sanitizeSessionDaySlice = (slice) => {
    const mapFields = { ...(slice.mapFields || {}) };
    if (mapFields.reps) {
      const cleanReps = {};
      for (const [key, value] of Object.entries(mapFields.reps)) {
        if (value !== '' && value !== undefined && value !== null) {
          const numValue = parseInt(value, 10);
          if (!Number.isNaN(numValue) && numValue >= 0 && numValue <= 999) {
            cleanReps[key] = numValue.toString();
          }
        } else if (value === '') {
          cleanReps[key] = '';
        }
      }
      mapFields.reps = cleanReps;
    }
    return { ...slice, mapFields };
  };

  const saveSessionDayIncremental = async (newData, effectiveKey, sessionDay) => {
    const slice = sanitizeSessionDaySlice(extractDaySliceFromAggregate(newData, sessionDay));
    await persistWorkoutSessionDay(effectiveKey, sessionDay, newData, slice);

    if (!ephemeral && !generateTestData && isWorkoutAggregateCloudSyncEnabled()) {
      const { accessToken } = readServerTokens();
      const cloudRow = { ...newData, id: effectiveKey, lastSaved: new Date().toISOString() };
      void flushWorkoutAggregateCloudPushNow({ accessToken, storageKey: effectiveKey, row: cloudRow });
    }
  };

  const saveToDB = async (newData, saveOptions = {}) => {
    const {
      storageKeyOverride,
      forcePersist = false,
      incrementalSession = false,
      sessionDay = null,
    } = saveOptions;
    const effectiveKey = storageKeyOverride || storageKey;

    try {
      if (!newData || typeof newData !== 'object') {
        throw new Error('Données invalides pour la sauvegarde');
      }

      if (
        incrementalSession &&
        sessionDay &&
        /^\d{4}-\d{2}-\d{2}$/.test(sessionDay) &&
        !ephemeral
      ) {
        await saveSessionDayIncremental(newData, effectiveKey, sessionDay);
        workoutDataLog.debug(`✅ Séance incrémentale ${sessionDay} (${effectiveKey})`);
        return;
      }

      // Validation de l'intégrité des propriétés critiques
      const requiredProperties = [
        'checkedExercises',
        'reps',
        'checkedStretches',
        'exerciseWeights',
        'exerciseWeightPerArm',
        'exerciseSetWeights',
        'exerciseSetLogs'
      ];
      for (const prop of requiredProperties) {
        if (newData[prop] && typeof newData[prop] !== 'object') {
          console.warn(`Propriété ${prop} corrompue, réinitialisation`);
          newData[prop] = {};
        }
      }

      // Validation et nettoyage des répétitions
      if (newData.reps) {
        const cleanReps = {};
        for (const [key, value] of Object.entries(newData.reps)) {
          if (value !== '' && value !== undefined && value !== null) {
            const numValue = parseInt(value);
            if (!isNaN(numValue) && numValue >= 0 && numValue <= 999) {
              cleanReps[key] = numValue.toString();
            } else {
              console.warn(`Valeur de répétition invalide supprimée: ${key} = ${value}`);
            }
          } else if (value === '') {
            cleanReps[key] = '';
          }
        }
        newData.reps = cleanReps;
      }

      if (newData.exerciseWeights) {
        const cleanWeights = {};
        for (const [key, value] of Object.entries(newData.exerciseWeights)) {
          if (value === '' || value === undefined || value === null) {
            cleanWeights[key] = '';
            continue;
          }
          const normalized = String(value).trim().replace(',', '.');
          const numValue = parseFloat(normalized);
          if (!Number.isNaN(numValue) && numValue >= 0 && numValue <= 999) {
            cleanWeights[key] = normalized;
          } else {
            console.warn(`Valeur de poids invalide supprimée: ${key} = ${value}`);
          }
        }
        newData.exerciseWeights = cleanWeights;
      }

      if (newData.exerciseWeightPerArm && typeof newData.exerciseWeightPerArm === 'object') {
        const cleanPerArm = {};
        for (const [key, value] of Object.entries(newData.exerciseWeightPerArm)) {
          if (value === true) cleanPerArm[key] = true;
        }
        newData.exerciseWeightPerArm = cleanPerArm;
      }

      if (newData.exerciseSetWeights && typeof newData.exerciseSetWeights === 'object') {
        const cleanSets = {};
        for (const [key, arr] of Object.entries(newData.exerciseSetWeights)) {
          if (!Array.isArray(arr)) continue;
          const row = arr
            .map((cell) => {
              if (cell === '' || cell === undefined || cell === null) return '';
              const normalized = String(cell).trim().replace(',', '.');
              const numValue = parseFloat(normalized);
              if (!Number.isNaN(numValue) && numValue >= 0 && numValue <= 999) return normalized;
              return '';
            })
            .filter((_, i) => i < 24);
          if (row.some((c) => c !== '')) cleanSets[key] = row;
        }
        newData.exerciseSetWeights = cleanSets;
      }

      if (newData.exerciseSetLogs && typeof newData.exerciseSetLogs === 'object') {
        const cleanLogs = {};
        for (const [key, raw] of Object.entries(newData.exerciseSetLogs)) {
          const normalized = normalizeExerciseSetLog(raw);
          if (normalized) cleanLogs[key] = normalized;
        }
        newData.exerciseSetLogs = cleanLogs;
      }

      if (
        newData.exerciseSessionEffortStars &&
        typeof newData.exerciseSessionEffortStars === 'object'
      ) {
        const cleanStars = {};
        for (const [key, raw] of Object.entries(newData.exerciseSessionEffortStars)) {
          const n = Math.round(Number(raw));
          if (Number.isFinite(n) && n >= 1 && n <= 5) cleanStars[key] = n;
        }
        newData.exerciseSessionEffortStars = cleanStars;
      }

      if (
        newData.exerciseSessionPleasureStars &&
        typeof newData.exerciseSessionPleasureStars === 'object'
      ) {
        const cleanPleasure = {};
        for (const [key, raw] of Object.entries(newData.exerciseSessionPleasureStars)) {
          const n = Math.round(Number(raw));
          if (Number.isFinite(n) && n >= 1 && n <= 5) cleanPleasure[key] = n;
        }
        newData.exerciseSessionPleasureStars = cleanPleasure;
      }

      if (
        newData.exerciseSessionPerceived &&
        typeof newData.exerciseSessionPerceived === 'object'
      ) {
        const cleanPerceived = {};
        for (const [key, raw] of Object.entries(newData.exerciseSessionPerceived)) {
          if (!raw || typeof raw !== 'object') continue;
          const row = {};
          for (const dim of ['difficulty', 'feeling', 'pleasure']) {
            const n = Math.round(Number(raw[dim]));
            if (Number.isFinite(n) && n >= 1 && n <= 5) row[dim] = n;
          }
          if (Object.keys(row).length > 0) cleanPerceived[key] = row;
        }
        newData.exerciseSessionPerceived = cleanPerceived;
      }

      if (
        newData.stretchSessionEffortStars &&
        typeof newData.stretchSessionEffortStars === 'object'
      ) {
        const cleanStretchStars = {};
        for (const [key, raw] of Object.entries(newData.stretchSessionEffortStars)) {
          const n = Math.round(Number(raw));
          if (Number.isFinite(n) && n >= 1 && n <= 5) cleanStretchStars[key] = n;
        }
        newData.stretchSessionEffortStars = cleanStretchStars;
      }

      // Validation des photos de progression
      if (newData.progressPhotos && !Array.isArray(newData.progressPhotos)) {
        console.warn('progressPhotos corrompu, réinitialisation');
        newData.progressPhotos = [];
      }
      if (newData.exerciseMaxRecords && !Array.isArray(newData.exerciseMaxRecords)) {
        console.warn('exerciseMaxRecords corrompu, réinitialisation');
        newData.exerciseMaxRecords = [];
      }
      if (newData.exerciseMaxHistory && !Array.isArray(newData.exerciseMaxHistory)) {
        console.warn('exerciseMaxHistory corrompu, réinitialisation');
        newData.exerciseMaxHistory = [];
      }
      if (newData.performanceRetestPlans && !Array.isArray(newData.performanceRetestPlans)) {
        console.warn('performanceRetestPlans corrompu, réinitialisation');
        newData.performanceRetestPlans = [];
      }
      if (newData.pyramidSessionLog && !Array.isArray(newData.pyramidSessionLog)) {
        console.warn('pyramidSessionLog corrompu, réinitialisation');
        newData.pyramidSessionLog = [];
      }

      // Validation de la variante de semaine
      if (newData.weekVariant && newData.weekVariant !== 'A' && newData.weekVariant !== 'B') {
        console.warn('weekVariant invalide, réinitialisation à A');
        newData.weekVariant = 'A';
      }
      
      if (ephemeral && !forcePersist) {
        return;
      }

      // Créer un objet avec la nouvelle structure et validation finale
      const dataToSave = {
        // ✅ Clé de stockage dépendante de l'utilisateur
        id: effectiveKey,
        checkedExercises: newData && newData.checkedExercises ? { ...newData.checkedExercises } : {},
        reps: newData && newData.reps ? { ...newData.reps } : {},
        exerciseWeights:
          newData && newData.exerciseWeights && typeof newData.exerciseWeights === 'object'
            ? { ...newData.exerciseWeights }
            : {},
        exerciseMarkedWeighted:
          newData &&
          newData.exerciseMarkedWeighted &&
          typeof newData.exerciseMarkedWeighted === 'object'
            ? { ...newData.exerciseMarkedWeighted }
            : {},
        exerciseWeightPerArm:
          newData && newData.exerciseWeightPerArm && typeof newData.exerciseWeightPerArm === 'object'
            ? { ...newData.exerciseWeightPerArm }
            : {},
        exerciseSetWeights:
          newData && newData.exerciseSetWeights && typeof newData.exerciseSetWeights === 'object'
            ? { ...newData.exerciseSetWeights }
            : {},
        exerciseSetLogs:
          newData && newData.exerciseSetLogs && typeof newData.exerciseSetLogs === 'object'
            ? { ...newData.exerciseSetLogs }
            : {},
        checkedStretches: newData && newData.checkedStretches ? { ...newData.checkedStretches } : {},
        startDate: newData && newData.startDate ? newData.startDate : null,
        weekVariant: newData && newData.weekVariant ? newData.weekVariant : 'A',
        progressPhotos: newData && newData.progressPhotos ? [...newData.progressPhotos] : [],
        progressEntries: newData && newData.progressEntries ? [...newData.progressEntries] : [],
        bodyTrackingReminders: newData && newData.bodyTrackingReminders ? [...newData.bodyTrackingReminders] : [],
        bodyTrackingLastUpdated: newData && newData.bodyTrackingLastUpdated ? newData.bodyTrackingLastUpdated : null,
        sessionFeedbacks: newData && newData.sessionFeedbacks ? { ...newData.sessionFeedbacks } : {},
        // ✅ NOUVEAU : dailyVariations avec validation
        dailyVariations: newData && newData.dailyVariations && typeof newData.dailyVariations === 'object' 
          ? { ...newData.dailyVariations } 
          : {},
        dailyVariationsVersion: newData && newData.dailyVariationsVersion ? newData.dailyVariationsVersion : '1.0',
        // ✅ NOUVEAU : dayJustifications avec validation stricte
        dayJustifications: newData && newData.dayJustifications && typeof newData.dayJustifications === 'object' 
          ? { ...newData.dayJustifications } 
          : {},
        dayJustificationsVersion: newData && newData.dayJustificationsVersion ? newData.dayJustificationsVersion : '1.0',
        exerciseIntensityCoeffs:
          newData && newData.exerciseIntensityCoeffs && typeof newData.exerciseIntensityCoeffs === 'object'
            ? { ...newData.exerciseIntensityCoeffs }
            : {},
        exercisePerceivedRatings:
          newData && newData.exercisePerceivedRatings && typeof newData.exercisePerceivedRatings === 'object'
            ? { ...newData.exercisePerceivedRatings }
            : {},
        exercisePersonalNotes:
          newData && newData.exercisePersonalNotes && typeof newData.exercisePersonalNotes === 'object'
            ? { ...newData.exercisePersonalNotes }
            : {},
        exerciseSessionEffortStars:
          newData &&
          newData.exerciseSessionEffortStars &&
          typeof newData.exerciseSessionEffortStars === 'object'
            ? { ...newData.exerciseSessionEffortStars }
            : {},
        exerciseSessionPleasureStars:
          newData &&
          newData.exerciseSessionPleasureStars &&
          typeof newData.exerciseSessionPleasureStars === 'object'
            ? { ...newData.exerciseSessionPleasureStars }
            : {},
        exerciseSessionPerceived:
          newData &&
          newData.exerciseSessionPerceived &&
          typeof newData.exerciseSessionPerceived === 'object'
            ? { ...newData.exerciseSessionPerceived }
            : {},
        stretchPerceivedRatings:
          newData && newData.stretchPerceivedRatings && typeof newData.stretchPerceivedRatings === 'object'
            ? { ...newData.stretchPerceivedRatings }
            : {},
        stretchPersonalNotes:
          newData && newData.stretchPersonalNotes && typeof newData.stretchPersonalNotes === 'object'
            ? { ...newData.stretchPersonalNotes }
            : {},
        stretchSessionEffortStars:
          newData &&
          newData.stretchSessionEffortStars &&
          typeof newData.stretchSessionEffortStars === 'object'
            ? { ...newData.stretchSessionEffortStars }
            : {},
        exerciseMaxRecords:
          newData && Array.isArray(newData.exerciseMaxRecords) ? [...newData.exerciseMaxRecords] : [],
        exerciseMaxHistory:
          newData && Array.isArray(newData.exerciseMaxHistory) ? [...newData.exerciseMaxHistory] : [],
        performanceRetestPlans:
          newData && Array.isArray(newData.performanceRetestPlans) ? [...newData.performanceRetestPlans] : [],
        pyramidSessionLog:
          newData && Array.isArray(newData.pyramidSessionLog) ? [...newData.pyramidSessionLog] : [],
        addictionQuitData:
          newData && newData.addictionQuitData && typeof newData.addictionQuitData === 'object'
            ? JSON.parse(JSON.stringify(newData.addictionQuitData))
            : INITIAL_WORKOUT_DATA.addictionQuitData,
        circuitDefinitions:
          newData && newData.circuitDefinitions && typeof newData.circuitDefinitions === 'object'
            ? { ...newData.circuitDefinitions }
            : {},
        circuitProgress:
          newData && newData.circuitProgress && typeof newData.circuitProgress === 'object'
            ? { ...newData.circuitProgress }
            : {},
        circuitDefinitionsVersion:
          newData && newData.circuitDefinitionsVersion ? newData.circuitDefinitionsVersion : '1.0',
        trainingPrefs:
          newData && newData.trainingPrefs && typeof newData.trainingPrefs === 'object'
            ? { ...newData.trainingPrefs }
            : { swapRestConfirmEnabled: true },
        restDaySwaps:
          newData && newData.restDaySwaps && typeof newData.restDaySwaps === 'object'
            ? { ...newData.restDaySwaps }
            : {},
        // Données d'endurance - CRUCIAL pour la persistance
        enduranceData: newData && newData.enduranceData ? { ...newData.enduranceData } : {
          sessions: {
            boxing: [],
            pushups: [],
            swimming: [],
            jumprope: [],
            running: []
          },
          challenges: []
        },
        // homepageImages supprimé - maintenant géré par useHomepageImages indépendant
        lastSaved: new Date().toISOString(),
        dataVersion: '1.0' // Ajout d'une version pour la compatibilité future
      };

      const repo = getWorkoutRepo();
      if (repo?.saveRawWorkoutRow) {
        await repo.saveRawWorkoutRow(effectiveKey, dataToSave);
        if (!ephemeral && !generateTestData && isWorkoutAggregateCloudSyncEnabled()) {
          const { accessToken } = readServerTokens();
          void flushWorkoutAggregateCloudPushNow({ accessToken, storageKey: effectiveKey, row: dataToSave });
        }
        return;
      }

      throw new Error('WORKOUT_DB_UNAVAILABLE');
    } catch (error) {
      console.error('❌ Erreur dans saveToDB:', error);
      throw error;
    }
  };

  // Fonction de sauvegarde automatique avec debounce optimisé et backup renforcé
  const autoSave = useCallback((newData) => {
    if (Date.now() < suppressAutoSaveUntilRef.current) {
      return;
    }

    // Annuler le timer précédent s'il existe
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const fingerprint = workoutDataFingerprint(newData);
    if (fingerprint === lastAutoSaveFingerprintRef.current) {
      return;
    }

    // Programmer une nouvelle sauvegarde après 1 seconde d'inactivité
    debounceTimerRef.current = setTimeout(async () => {
      if (Date.now() < suppressAutoSaveUntilRef.current) {
        return;
      }
      const fpAtFire = workoutDataFingerprint(newData);
      if (fpAtFire === lastAutoSaveFingerprintRef.current) {
        return;
      }
      try {
        await runSerializedSave(() => saveToDB(newData));
        lastAutoSaveFingerprintRef.current = fpAtFire;
        
        // Backup supplémentaire pour les images de la page d'accueil
        if (newData.homepageImages) {
          const homepageData = {
            backgroundImages: newData.homepageImages.backgroundImages || [],
            bannerImages: newData.homepageImages.bannerImages || [],
            lastUpdated: new Date().toISOString()
          };
          
          // Backup localStorage (seulement si l'espace est disponible)
          try {
            localStorage.setItem('homepage_images_backup', JSON.stringify(homepageData));
          } catch (quotaError) {
            console.warn('⚠️ localStorage plein, backup ignoré:', quotaError.message);
            // Nettoyer et réessayer
            cleanupLocalStorage();
            try {
              localStorage.setItem('homepage_images_backup', JSON.stringify(homepageData));
            } catch (retryError) {
              console.warn('⚠️ Backup impossible même après nettoyage:', retryError.message);
            }
          }
          
          // Backup sessionStorage (plus petit)
          try {
            sessionStorage.setItem('homepage_images_session', JSON.stringify(homepageData));
          } catch (quotaError) {
            console.warn('⚠️ sessionStorage plein, backup ignoré:', quotaError.message);
          }
          
          workoutDataLog.debug('✅ Images de la page d\'accueil sauvegardées avec backup renforcé');
        }
      } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde automatique:', error);
      }
    }, 1000);
  }, [runSerializedSave]);

  // Fonction de nettoyage automatique du localStorage
  const cleanupLocalStorage = () => {
    try {
      // Nettoyer les anciens backups volumineux
      const keysToClean = [
        // Ne pas supprimer workoutData_backup* — backups critiques pour F5
      ];
      
      keysToClean.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (error) {
          console.warn(`⚠️ Impossible de nettoyer ${key}:`, error);
        }
      });
      
      workoutDataLog.debug('🧹 Nettoyage automatique du localStorage effectué');
    } catch (error) {
      console.warn('⚠️ Erreur lors du nettoyage:', error);
    }
  };

  const loadFromDB = async () => {
    try {
      if (ephemeral) {
        return null;
      }

      const repo = getWorkoutRepo();
      let result = null;
      if (repo?.loadRawWorkoutRow) {
        try {
          result = await repo.loadRawWorkoutRow(storageKey);
        } catch (err) {
          console.error('❌ Erreur lors du chargement (repository):', err);
        }
      }

      if (result) {
        let state = materializeValidatedFromIdbRow(result);
        state = await enrichWorkoutStateWithSessions(state);
        const legacyDates = listLegacySessionDatesInAggregate(result.data || result);
        if (legacyDates.length > 0 && !sessionMigrationDoneRef.current.has(storageKey)) {
          sessionMigrationDoneRef.current.add(storageKey);
          void (async () => {
            try {
              const flat = result.data || result;
              const n = await migrateLegacySessionsFromAggregate(storageKey, flat);
              if (n > 0) {
                workoutDataLog.debug(`📦 Migration ${n} séances → workoutSessions (${storageKey})`);
              }
            } catch (e) {
              workoutDataLog.warn('Migration workoutSessions ignorée', e);
              sessionMigrationDoneRef.current.delete(storageKey);
            }
          })();
        }
        return state;
      }

      return null;
    } catch (error) {
      console.error('❌ Erreur dans loadFromDB:', error);
      return null;
    }
  };

  const loadData = async () => {
    let savedData = await loadFromDB();

    savedData = await enrichWorkoutStateWithSessions(savedData || { ...INITIAL_WORKOUT_DATA });

    if (!ephemeral && !generateTestData && isWorkoutAggregateCloudSyncEnabled()) {
      const { accessToken } = readServerTokens();
      if (accessToken) {
        try {
          const repo = getWorkoutRepo();
          let rawLocal = null;
          if (repo?.loadRawWorkoutRow) {
            try {
              rawLocal = await repo.loadRawWorkoutRow(storageKey);
            } catch (e) {
              workoutDataLog.debug('loadRawWorkoutRow (sync cloud)', e);
            }
          }
          const remote = await fetchMomentumApiV1WorkoutAggregate(accessToken);
          const chosenRaw = pickNewerWorkoutRawForLoad(rawLocal, remote, storageKey);
          if (repo?.saveRawWorkoutRow && chosenRaw && chosenRaw !== rawLocal) {
            const normalized = normalizeWorkoutAggregateRawForIdb(chosenRaw, storageKey);
            await repo.saveRawWorkoutRow(storageKey, normalized);
            savedData = materializeValidatedFromIdbRow(normalized);
            savedData = await enrichWorkoutStateWithSessions(savedData);
          }
        } catch (e) {
          workoutDataLog.warn('Fusion snapshot workout cloud ignorée', e);
        }
      }
    }

    if (savedData && hasWorkoutContent(savedData)) {
      if (needsWorkoutRepIntegration(savedData)) {
        savedData = applyWorkoutRepIntegrations(savedData, { workoutAggregate: savedData });
        await saveToDB(savedData);
      }
      setData(savedData);
      lastMetadataFingerprintRef.current = workoutMetadataFingerprint(savedData);
    } else {
      // Si aucune donnée n'existe
      if (generateTestData) {
        // Mode démo / pré-authentification : charger les données de test
        workoutDataLog.debug('🎯 Aucune donnée trouvée, chargement des données de test...');
        const testData = generateTestWorkoutData();
        setData(testData);
        // Sauvegarder les données de test
        await saveToDB(testData);
      } else {
        workoutDataLog.debug(`🎯 Aucune donnée IndexedDB pour ${storageKey}, état vide en mémoire`);
        setData(INITIAL_WORKOUT_DATA);
      }
    }
    // Marquer que le chargement initial est terminé pour ce storageKey
    isInitialLoadRef.current = false;
  };

  const updateData = async (newData, options = {}) => {
    const { strict = false, sessionDay = null } = options;
    workoutDataLog.debug('🔄 updateData appelé avec:', newData);
    let toStore = newData;
    if (newData && typeof newData === 'object' && !newData.trainingPrefs?.journeyStartYmd) {
      const derivedStart = deriveJourneyStartYmd(newData);
      if (derivedStart) {
        toStore = {
          ...newData,
          trainingPrefs: {
            ...(newData.trainingPrefs || {}),
            journeyStartYmd: derivedStart
          }
        };
      }
    }
    if (strict) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      suppressAutoSaveUntilRef.current = Date.now() + 3000;
    }
    setData(toStore);

    try {
      const saveOpts = {
        incrementalSession: Boolean(strict && sessionDay),
        sessionDay: sessionDay || null,
      };
      if (strict && sessionDay) {
        await saveToDB(toStore, saveOpts);
      } else {
        await runSerializedSave(() => saveToDB(toStore, saveOpts), { priority: Boolean(strict) });
      }
      lastAutoSaveFingerprintRef.current = workoutDataFingerprint(toStore);
      workoutDataLog.debug('✅ Données sauvegardées avec succès');

      if (window.workoutContextCallback) {
        window.workoutContextCallback();
      }
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde dans updateData:', error);
      if (strict) throw error;
    }
  };

  // Effet pour le chargement initial des données
  useEffect(() => {
    if (deferLoad) return;
    // À chaque changement de storageKey (changement d'utilisateur), recharger les données correspondant à cette clé
    isInitialLoadRef.current = true;
    // Réinitialiser immédiatement l'état en mémoire pour éviter d'afficher les données de l'utilisateur précédent.
    setData(INITIAL_WORKOUT_DATA);
    loadData();

    cleanupLocalStorage();
  }, [storageKey, deferLoad]);

  // Pas d’autoSave sur chaque setData : bloquait la file d’attente (sauvegarde
  // monolithique ~1 s après chaque chargement) et provoquait timeout Enregistrer.
  // Persistance : updateData (strict), flush pagehide → IndexedDB.

  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const lastAuthStorageKeyRef = useRef(storageKey);

  useEffect(() => {
    if (!ephemeral && storageKey && storageKey !== 'anonymous') {
      lastAuthStorageKeyRef.current = storageKey;
    }
  }, [ephemeral, storageKey]);

  const flushPendingSaveNow = useCallback(
    (options = {}) => {
      const key = options.storageKeyOverride || storageKey;
      if (!key || key === 'anonymous' || isInitialLoadRef.current) return;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
      const latest = dataRef.current;
      if (!latest || !hasWorkoutContent(latest)) return;
      runSerializedSave(() =>
        saveToDB(latest, {
          storageKeyOverride: key,
          forcePersist: options.forcePersist === true,
        })
      ).catch(() => {});
    },
    [storageKey, runSerializedSave]
  );

  // Flush IndexedDB avant fermeture / rechargement (évite perte reps / cases cochées)
  useEffect(() => {
    if (ephemeral) return undefined;

    const flushPendingSave = () => flushPendingSaveNow();

    window.addEventListener('pagehide', flushPendingSave);
    window.addEventListener('beforeunload', flushPendingSave);
    return () => {
      window.removeEventListener('pagehide', flushPendingSave);
      window.removeEventListener('beforeunload', flushPendingSave);
    };
  }, [ephemeral, flushPendingSaveNow]);

  // Flush avant passage en mode éphémère (déconnexion) pour ne pas perdre le backfill Défis
  const wasEphemeralRef = useRef(ephemeral);
  useEffect(() => {
    if (wasEphemeralRef.current === false && ephemeral === true) {
      const key = lastAuthStorageKeyRef.current;
      if (key && key !== 'anonymous') {
        flushPendingSaveNow({ storageKeyOverride: key, forcePersist: true });
      }
    }
    wasEphemeralRef.current = ephemeral;
  }, [ephemeral, flushPendingSaveNow]);

  // Nettoyer le timer lors du démontage du composant
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Fonction pour sauvegarder un feedback de session
  const saveSessionFeedback = useCallback(async (date, feedbackData) => {
    const newData = {
      ...data,
      sessionFeedbacks: {
        ...data.sessionFeedbacks,
        [date]: {
          ...feedbackData,
          timestamp: new Date().toISOString()
        }
      }
    };
    
    // ✅ Sauvegarder immédiatement sans attendre le debounce
    setData(newData);
    
    // Sauvegarde immédiate pour garantir la persistance
    try {
      await saveToDB(newData);
      workoutDataLog.debug('✅ Feedback de session sauvegardé immédiatement:', date);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde immédiate du feedback:', error);
      // Fallback vers autoSave si la sauvegarde immédiate échoue
      autoSave(newData);
    }
  }, [data, autoSave, saveToDB]);

  const cancelPendingAutoSave = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  return {
    data,
    updateData,
    saveToDB,
    loadFromDB,
    saveSessionFeedback,
    cancelPendingAutoSave,
    flushPendingSaveNow,
  };
};