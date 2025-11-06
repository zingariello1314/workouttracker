import React, { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Calendar, Target, Zap, Award, BarChart3, Activity, Clock, Flame, HelpCircle } from 'lucide-react';
import { findExerciseInDatabase } from '../data/exerciseDatabase';

const AdvancedStats = ({ workoutData, garminData = null, isOpen, onClose }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('volume');

  const periods = [
    { value: 'week', label: '7 derniers jours' },
    { value: 'month', label: '30 derniers jours' },
    { value: 'quarter', label: '3 derniers mois' },
    { value: 'year', label: '12 derniers mois' }
  ];

  const metrics = [
    { value: 'volume', label: 'Volume total', icon: BarChart3, unit: 'reps' },
    { value: 'frequency', label: 'Fréquence', icon: Calendar, unit: 'séances' },
    { value: 'intensity', label: 'Intensité moyenne', icon: Zap, unit: '/10' },
    { value: 'duration', label: 'Durée moyenne', icon: Clock, unit: 'min' }
  ];

  // ==========================================
  // 🔴 PHASE 1.1 : FONCTIONS DE NORMALISATION OPTIMISÉES
  // ==========================================
  // Ces fonctions garantissent que tous les calculs utilisent des nombres valides
  // au lieu de chaînes qui causent des concaténations
  
  /**
   * Normalise une valeur de répétitions en nombre entier positif
   * Gère tous les cas edge : string, number, null, undefined, NaN, objets, décimales, durées
   * 
   * @param {any} value - Valeur à normaliser (peut être string, number, null, etc.)
   * @returns {number} Nombre entier >= 0, ou 0 si invalide
   * 
   * Performance : Optimisée pour éviter les conversions inutiles
   * - Si déjà un number valide : retour direct (O(1))
   * - Si string : parseFloat avec validation (O(1))
   * - Gère les nombres décimaux (arrondit vers le bas)
   * - Gère les durées au format "HH:MM" (convertit en minutes)
   * - Autres cas : retour 0 (O(1))
   */
  const normalizeReps = React.useCallback((value) => {
    // ✅ Cas 1 : Déjà un nombre valide (cas le plus fréquent, optimisé en premier)
    if (typeof value === 'number') {
      // Vérifier NaN et Infinity explicitement (plus rapide que isNaN)
      if (value !== value || !isFinite(value)) return 0;
      // Retourner l'entier positif (arrondi vers le bas pour valeurs décimales)
      return Math.max(0, Math.floor(value));
    }
    
    // ✅ Cas 2 : null ou undefined (cas fréquent aussi)
    if (value == null) return 0; // == null vérifie null ET undefined en une fois
    
    // ✅ Cas 3 : String (cas problématique identifié)
    if (typeof value === 'string') {
      const trimmed = value.trim();
      // Si chaîne vide après trim, retourner 0
      if (trimmed === '') return 0;
      
      // ✅ CORRECTION : Gérer les durées au format "HH:MM" ou "H:MM"
      // Exemple : "10:53" → 10*60 + 53 = 653 minutes
      const timeMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/);
      if (timeMatch) {
        const hours = parseInt(timeMatch[1], 10);
        const minutes = parseInt(timeMatch[2], 10);
        if (!isNaN(hours) && !isNaN(minutes) && minutes < 60) {
          const totalMinutes = hours * 60 + minutes;
          return Math.max(0, totalMinutes);
        }
      }
      
      // ✅ CORRECTION : Utiliser parseFloat au lieu de parseInt pour gérer les décimales
      // Exemple : "10.23" → 10.23 → Math.floor(10.23) = 10
      const parsed = parseFloat(trimmed);
      
      // Vérifier que le parsing a réussi (parseFloat retourne NaN si échec)
      if (parsed !== parsed || !isFinite(parsed)) {
        // Si ce n'est pas un nombre valide, logger en dev seulement si vraiment invalide
        if (process.env.NODE_ENV === 'development') {
          // Ne logger que si ce n'est pas un format connu (décimal, durée, etc.)
          if (!/^[\d.]+$/.test(trimmed) && !timeMatch) {
            console.warn('[AdvancedStats] normalizeReps: Invalid numeric string:', value);
          }
        }
        return 0;
      }
      
      // ✅ CORRECTION : Accepter les nombres décimaux et les convertir en entiers
      // Pour les répétitions, on arrondit vers le bas (10.9 → 10)
      // Pour les durées/intensités, on garde la valeur arrondie
      return Math.max(0, Math.floor(parsed));
    }
    
    // ✅ Cas 4 : Boolean (true = 1, false = 0) - cas rare mais géré
    if (typeof value === 'boolean') return value ? 1 : 0;
    
    // ✅ Cas 5 : Objet ou autre type - retourner 0 et logger en dev
    if (process.env.NODE_ENV === 'development') {
      console.warn('[AdvancedStats] normalizeReps: Unexpected type:', typeof value, value);
    }
    return 0;
  }, []); // useCallback pour éviter recréation à chaque render

  /**
   * Normalise un exercice complet en s'assurant que toutes les valeurs numériques sont valides
   * 
   * @param {Object} exercise - Exercice à normaliser
   * @returns {Object} Exercice normalisé avec reps, duration, etc. en nombres valides
   */
  const normalizeExercise = React.useCallback((exercise) => {
    if (!exercise || typeof exercise !== 'object') {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[AdvancedStats] normalizeExercise: Invalid exercise:', exercise);
      }
      return null;
    }
    
    // ✅ Normaliser les champs numériques principaux
    const normalized = {
      ...exercise,
      reps: normalizeReps(exercise.reps),
      // duration peut être null pour les exercices non-durée
      duration: exercise.duration != null ? normalizeReps(exercise.duration) : null,
    };
    
    // ✅ Normaliser actualReps si c'est un array
    if (Array.isArray(exercise.actualReps)) {
      normalized.actualReps = exercise.actualReps.map(normalizeReps);
    }
    
    // ✅ Normaliser totalReps si présent
    if (exercise.totalReps != null) {
      normalized.totalReps = normalizeReps(exercise.totalReps);
    }
    
    return normalized;
  }, [normalizeReps]);

  /**
   * Normalise un workout complet en normalisant tous ses exercices
   * 
   * @param {Object} workout - Workout à normaliser
   * @returns {Object} Workout normalisé avec tous les exercices normalisés
   */
  const normalizeWorkout = React.useCallback((workout) => {
    if (!workout || typeof workout !== 'object') {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[AdvancedStats] normalizeWorkout: Invalid workout:', workout);
      }
      return null;
    }
    
    // ✅ Normaliser les exercices
    const normalizedExercises = Array.isArray(workout.exercises)
      ? workout.exercises
          .map(normalizeExercise)
          .filter(ex => ex !== null) // Filtrer les exercices invalides
      : [];
    
    // ✅ Normaliser totalReps du workout si présent
    const normalizedTotalReps = workout.totalReps != null
      ? normalizeReps(workout.totalReps)
      : normalizedExercises.reduce((sum, ex) => sum + normalizeReps(ex.reps), 0);
    
    // ✅ Normaliser intensity et duration
    const normalized = {
      ...workout,
      exercises: normalizedExercises,
      totalReps: normalizedTotalReps,
      intensity: workout.intensity != null ? normalizeReps(workout.intensity) : null,
      duration: workout.duration != null ? normalizeReps(workout.duration) : null,
    };
    
    return normalized;
  }, [normalizeExercise, normalizeReps]);

  /**
   * Normalise un tableau de workouts
   * Utilise useMemo pour éviter les recalculs inutiles
   * 
   * @param {Array} workouts - Tableau de workouts à normaliser
   * @returns {Array} Tableau de workouts normalisés
   */
  const normalizeWorkoutData = React.useCallback((workouts) => {
    if (!Array.isArray(workouts)) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[AdvancedStats] normalizeWorkoutData: Invalid workouts array:', workouts);
      }
      return [];
    }
    
    return workouts
      .map(normalizeWorkout)
      .filter(w => w !== null); // Filtrer les workouts invalides
  }, [normalizeWorkout]);

  /**
   * Validation des données en mode développement
   * Détecte les problèmes de types avant qu'ils ne causent des erreurs
   */
  const validateWorkoutData = React.useCallback((workoutData) => {
    if (process.env.NODE_ENV !== 'development') return;
    if (!Array.isArray(workoutData)) return;
    
    let issuesFound = 0;
    const maxIssuesToLog = 10; // Limiter les logs pour éviter le spam
    
    workoutData.forEach((workout, workoutIndex) => {
      if (!workout || typeof workout !== 'object') {
        if (issuesFound < maxIssuesToLog) {
          console.warn(`[AdvancedStats] Workout ${workoutIndex} is invalid:`, workout);
          issuesFound++;
        }
        return;
      }
      
      if (!Array.isArray(workout.exercises)) {
        if (issuesFound < maxIssuesToLog) {
          console.warn(`[AdvancedStats] Workout ${workoutIndex} has invalid exercises:`, workout);
          issuesFound++;
        }
        return;
      }
      
      workout.exercises.forEach((exercise, exIndex) => {
        if (exercise == null) return;
        
        // Vérifier le type de reps
        if (exercise.reps != null && typeof exercise.reps !== 'number' && typeof exercise.reps !== 'string') {
          if (issuesFound < maxIssuesToLog) {
            console.warn(
              `[AdvancedStats] Exercise ${exIndex} in workout ${workoutIndex} has invalid reps type:`,
              typeof exercise.reps,
              exercise.reps,
              exercise
            );
            issuesFound++;
          }
        }
        
        // Vérifier si reps est une chaîne non-numérique
        if (typeof exercise.reps === 'string') {
          const trimmed = exercise.reps.trim();
          if (trimmed !== '' && isNaN(parseInt(trimmed, 10))) {
            if (issuesFound < maxIssuesToLog) {
              console.warn(
                `[AdvancedStats] Exercise ${exIndex} in workout ${workoutIndex} has non-numeric string reps:`,
                exercise.reps,
                exercise
              );
              issuesFound++;
            }
          }
        }
      });
    });
    
    if (issuesFound > 0 && issuesFound >= maxIssuesToLog) {
      console.warn(`[AdvancedStats] Found ${issuesFound}+ issues in workout data. Only first ${maxIssuesToLog} logged.`);
    }
  }, []);

  // ==========================================
  // FIN DES FONCTIONS DE NORMALISATION
  // ==========================================

  // ==========================================
  // 🔴 PHASE 1.3 : CALCUL DES CHANGEMENTS AMÉLIORÉ
  // ==========================================
  
  /**
   * Calcule le pourcentage de changement entre deux valeurs
   * Gère correctement les cas edge (période précédente vide, valeurs nulles, etc.)
   * 
   * @param {number} current - Valeur actuelle
   * @param {number} previous - Valeur précédente
   * @returns {number|null} Pourcentage de changement, ou null si "N/A"
   * 
   * ✅ CORRECTION : Retourne null au lieu de 100 quand previous = 0 et current > 0
   * Cela évite d'afficher +100% pour toutes les nouvelles activités
   */
  const calculateChange = React.useCallback((current, previous) => {
    // Normaliser les valeurs pour garantir qu'on travaille avec des nombres
    const currentNum = normalizeReps(current);
    const previousNum = normalizeReps(previous);
    
    // ✅ Cas 1 : Aucune activité dans les deux périodes
    if (previousNum === 0 && currentNum === 0) return 0;
    
    // ✅ Cas 2 : Nouvelle activité (previous = 0, current > 0)
    // Retourner null pour indiquer "N/A" au lieu de toujours 100%
    if (previousNum === 0 && currentNum > 0) {
      return null; // Sera géré dans formatChange() pour afficher "N/A"
    }
    
    // ✅ Cas 3 : Calcul normal du pourcentage de changement
    const change = ((currentNum - previousNum) / previousNum) * 100;
    
    // ✅ CORRECTION : Limiter les valeurs extrêmes pour éviter l'affichage de +10000%
    // Limite raisonnable : entre -100% (perte totale) et +1000% (amélioration x10)
    return Math.max(-100, Math.min(1000, change));
  }, [normalizeReps]);
  
  /**
   * Formate l'affichage du changement avec gestion des cas edge
   * 
   * @param {number|null} change - Pourcentage de changement ou null pour "N/A"
   * @returns {JSX.Element} Élément React formaté
   */
  const formatChange = React.useCallback((change) => {
    // ✅ CORRECTION : Gérer le cas null (N/A)
    if (change === null || change === undefined) {
      return (
        <div className="flex items-center gap-1 text-slate-400">
          <span className="text-sm font-medium">N/A</span>
        </div>
      );
    }
    
    const isPositive = change > 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const color = isPositive ? 'text-green-400' : 'text-red-400';
    
    return (
      <div className={`flex items-center gap-1 ${color}`}>
        <Icon size={14} />
        <span className="text-sm font-medium">
          {isPositive ? '+' : ''}{change.toFixed(1)}%
        </span>
      </div>
    );
  }, []);

  // ==========================================
  // 🟢 PHASE 3.2 : CORRECTION calculateStreak - Utiliser la même logique que StatsTab
  // ==========================================
  /**
   * Calcule la série actuelle (streak) de jours consécutifs avec entraînement
   * ✅ CORRECTION : Utilise la même logique que calculateCurrentStreak() dans StatsTab.jsx
   * qui fonctionne correctement (3 séances = 3 jours consécutifs)
   * 
   * @param {Array} data - Tableau de workouts normalisés
   * @returns {number} Nombre de jours consécutifs avec entraînement depuis aujourd'hui
   * 
   * **Logique** :
   * - Parcourt les jours depuis aujourd'hui (i=0) jusqu'à 365 jours en arrière
   * - Pour chaque jour, vérifie s'il y a un workout à cette date
   * - Si oui, incrémente le streak
   * - Si non ET que i > 0, arrête (série interrompue)
   * - Si non ET que i = 0, continue (aujourd'hui peut ne pas avoir de workout)
   */
  const calculateStreak = React.useCallback((data) => {
    if (!data || data.length === 0) return 0;
    
    // ✅ CORRECTION : Créer un Set des dates avec workouts pour recherche rapide O(1)
    // Normaliser les dates au format YYYY-MM-DD pour comparaison
    const workoutDates = new Set(
      data.map(w => {
        const date = new Date(w.date);
        date.setHours(0, 0, 0, 0);
        return date.toISOString().split('T')[0]; // Format YYYY-MM-DD
      })
    );
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // ✅ CORRECTION : Parcourir les jours depuis aujourd'hui jusqu'à 365 jours en arrière
    // Même logique que calculateCurrentStreak() dans StatsTab.jsx
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0]; // Format YYYY-MM-DD
      
      // ✅ Vérifier si ce jour a un workout
      const hasWorkout = workoutDates.has(dateStr);
      
      if (hasWorkout) {
        streak++;
      } else if (i > 0) {
        // Si pas de workout ET que ce n'est pas aujourd'hui (i > 0), arrêter
        break;
      }
      // Si i === 0 et pas de workout, continuer (aujourd'hui peut ne pas avoir de workout)
    }
    
    return streak;
  }, []);

  // ✅ PHASE 1.2 : getBestPerformanceDay avec normalisation
  const getBestPerformanceDay = React.useCallback((data) => {
    if (!data || data.length === 0) return null;
    
    return data.reduce((best, current) => {
      // ✅ CORRECTION : Utiliser normalizeReps() et totalReps normalisé si disponible
      const currentReps = current.totalReps != null 
        ? normalizeReps(current.totalReps)
        : (current.exercises?.reduce((s, e) => s + normalizeReps(e.reps), 0) || 0);
      const currentIntensity = normalizeReps(current.intensity || 5);
      const currentExerciseCount = current.exercises?.length || 0;
      
      // Score composite : reps * intensité + bonus pour nombre d'exercices
      const currentScore = (currentReps * currentIntensity) + (currentExerciseCount * 10);
      
      const bestReps = best.totalReps != null
        ? normalizeReps(best.totalReps)
        : (best.exercises?.reduce((s, e) => s + normalizeReps(e.reps), 0) || 0);
      const bestIntensity = normalizeReps(best.intensity || 5);
      const bestExerciseCount = best.exercises?.length || 0;
      const bestScore = (bestReps * bestIntensity) + (bestExerciseCount * 10);
      
      return currentScore > bestScore ? current : best;
    });
  }, [normalizeReps]);

  // ==========================================
  // 🟡 PHASE 2.1 : getMuscleDistribution avec base de données d'exercices
  // ==========================================
  /**
   * Calcule la répartition musculaire en utilisant la base de données d'exercices
   * Utilise findExerciseInDatabase() pour une précision maximale
   * 
   * @param {Array} data - Tableau de workouts normalisés
   * @returns {Array} Tableau trié de {muscle, reps, percentage}
   * 
   * Performance optimisée :
   * - Cache les résultats de recherche pour éviter appels répétés
   * - Utilise category de la base de données (cohérent avec MuscleGroupChart)
   * - Fallback intelligent si exercice non trouvé
   */
  const getMuscleDistribution = React.useCallback((data) => {
    const distribution = {};
    // ✅ OPTIMISATION : Cache pour éviter recherches répétées du même exercice
    const exerciseCache = new Map();
    
    data.forEach(workout => {
      workout.exercises?.forEach(exercise => {
        const exerciseName = exercise.name || exercise.nom || 'Exercice inconnu';
        
        // ✅ OPTIMISATION : Vérifier le cache d'abord
        let muscle = exerciseCache.get(exerciseName);
        
        if (muscle === undefined) {
          // ✅ PRIORITÉ 1 : Chercher dans la base de données d'exercices
          const dbExercise = findExerciseInDatabase(exerciseName);
          
          if (dbExercise) {
            // Utiliser la catégorie de la base de données (cohérent avec MuscleGroupChart)
            // Les catégories dans exerciseDatabase sont : "Pectoraux", "Dorsaux", "Jambes", etc.
            if (dbExercise.category) {
              muscle = dbExercise.category;
            } 
            // Si pas de category, utiliser le premier muscle primaire
            else if (dbExercise.primaryMuscles && dbExercise.primaryMuscles.length > 0) {
              muscle = dbExercise.primaryMuscles[0];
            } 
            // Si pas de primaryMuscles, utiliser "Autre"
            else {
              muscle = 'Autre';
            }
          } 
          // ✅ PRIORITÉ 2 : Fallback amélioré avec mapping étendu
          else {
            const nameLower = exerciseName.toLowerCase();
            muscle = 'Autre';
            
            // ✅ Mapping amélioré correspondant aux catégories de la base de données
            // Note : Les catégories dans exerciseDatabase sont : "Pectoraux", "Dorsaux", "Jambes", 
            // "Biceps", "Triceps", "Épaules", "Abdominaux", "Cardio", etc.
            const muscleMappings = {
              'Pectoraux': ['pompe', 'pec', 'développé', 'bench', 'chest', 'push-up', 'pushup', 'fly', 'écarté', 'dips', 'répulsion'],
              'Dorsaux': ['traction', 'dos', 'back', 'row', 'lat', 'pull', 'tirage', 'rowing', 'tirage', 'chin-up'],
              'Jambes': ['squat', 'jambe', 'leg', 'fente', 'lunge', 'calf', 'mollet', 'soulevé', 'deadlift', 'sdl', 'leg press'],
              'Biceps': ['curl', 'bicep', 'biceps', 'flexion', 'hammer'],
              'Triceps': ['tricep', 'triceps', 'dips', 'extension', 'répulsion', 'kickback'],
              'Épaules': ['épaule', 'shoulder', 'press', 'élévation', 'lateral', 'deltoïde', 'delto', 'military press'],
              'Abdominaux': ['abdo', 'planche', 'gainage', 'crunch', 'sit-up', 'core', 'abdominal', 'plank']
            };
            
            // Rechercher la meilleure correspondance
            let bestMatch = null;
            let bestScore = 0;
            
            for (const [muscleGroup, keywords] of Object.entries(muscleMappings)) {
              for (const keyword of keywords) {
                if (nameLower.includes(keyword)) {
                  // Score basé sur la longueur du mot-clé (plus long = plus spécifique)
                  const score = keyword.length;
                  if (score > bestScore) {
                    bestScore = score;
                    bestMatch = muscleGroup;
                  }
                }
              }
            }
            
            if (bestMatch) {
              muscle = bestMatch;
            }
          }
          
          // ✅ OPTIMISATION : Mettre en cache le résultat
          exerciseCache.set(exerciseName, muscle);
        }
        
        // ✅ CORRECTION : Utiliser normalizeReps() pour garantir des nombres valides
        const reps = normalizeReps(exercise.reps);
        distribution[muscle] = (distribution[muscle] || 0) + reps;
      });
    });
    
    // Calculer les totaux et pourcentages
    const total = Object.values(distribution).reduce((sum, reps) => sum + reps, 0);
    
    const result = Object.entries(distribution)
      .map(([muscle, reps]) => ({
        muscle,
        reps,
        percentage: total > 0 ? (reps / total) * 100 : 0
      }))
      .sort((a, b) => b.reps - a.reps); // Trier par nombre de reps décroissant
    
    // ✅ PHASE 4.2 : Validation de cohérence en mode développement
    // Vérifier que la somme des pourcentages ≈ 100% (tolérance de 0.1% pour arrondis)
    if (process.env.NODE_ENV === 'development' && result.length > 0) {
      const sumPercentages = result.reduce((sum, item) => sum + item.percentage, 0);
      const tolerance = 0.1; // Tolérance pour les arrondis
      if (Math.abs(sumPercentages - 100) > tolerance) {
        console.warn(
          `[AdvancedStats] getMuscleDistribution: Somme des pourcentages = ${sumPercentages.toFixed(2)}% (attendu: 100%)`,
          { distribution, result, total }
        );
      }
    }
    
    return result;
  }, [normalizeReps]);

  // ==========================================
  // 🟢 PHASE 3.2 : OPTIMISATION getWeeklyPattern
  // ==========================================
  /**
   * Calcule le pattern hebdomadaire des entraînements
   * Optimisé avec useCallback pour éviter recalculs
   * 
   * @param {Array} data - Tableau de workouts normalisés
   * @returns {Array} Tableau de {day, workouts} pour chaque jour de la semaine
   */
  const getWeeklyPattern = React.useCallback((data) => {
    if (!data || data.length === 0) {
      const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
      return days.map(day => ({ day, workouts: 0 }));
    }
    
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const pattern = new Array(7).fill(0);
    
    // ✅ OPTIMISATION : Parcourir les données une seule fois
    data.forEach(workout => {
      const day = new Date(workout.date).getDay();
      pattern[day]++;
    });
    
    return days.map((day, index) => ({
      day,
      workouts: pattern[index]
    }));
  }, []);

  // ✅ PHASE 1.2 : getProgressTrend avec normalisation et cohérence améliorée
  // ✅ PHASE 2.2 : Signature modifiée pour accepter previousPeriodData pour cohérence
  const getProgressTrend = React.useCallback((currentPeriodData, previousPeriodData) => {
    if (!currentPeriodData || currentPeriodData.length < 2) {
      // Si pas assez de données dans la période actuelle, comparer avec précédente
      if (!previousPeriodData || previousPeriodData.length === 0) {
        return 'stable';
      }
      // Si période actuelle vide mais précédente a des données → déclin
      return 'declining';
    }
    
    // Calculer la moyenne des 5 dernières séances de la période actuelle
    const recent = currentPeriodData.slice(-5);
    const older = currentPeriodData.length >= 10 
      ? currentPeriodData.slice(-10, -5)
      : (previousPeriodData?.slice(-5) || []);
    
    if (older.length === 0) {
      return 'stable'; // Pas de comparaison possible
    }
    
    // ✅ CORRECTION : Utiliser normalizeReps() et totalReps normalisé
    const recentAvg = recent.reduce((sum, w) => {
      const workoutReps = w.totalReps != null
        ? normalizeReps(w.totalReps)
        : (w.exercises?.reduce((s, e) => s + normalizeReps(e.reps), 0) || 0);
      return sum + workoutReps;
    }, 0) / recent.length;
    
    const olderAvg = older.reduce((sum, w) => {
      const workoutReps = w.totalReps != null
        ? normalizeReps(w.totalReps)
        : (w.exercises?.reduce((s, e) => s + normalizeReps(e.reps), 0) || 0);
      return sum + workoutReps;
    }, 0) / older.length;
    
    if (olderAvg === 0) return recentAvg > 0 ? 'improving' : 'stable';
    
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    
    if (change > 10) return 'improving';
    if (change < -10) return 'declining';
    return 'stable';
  }, [normalizeReps]);

  // ==========================================
  // ✅ PHASE 1.2 & 4.3 : estimateCalories avec normalisation et documentation
  // ==========================================
  /**
   * Extrait les calories Garmin pour une date donnée
   * Les calories Garmin peuvent être un objet {total, active, resting} ou un nombre
   * 
   * @param {string} dateStr - Date au format YYYY-MM-DD
   * @returns {number|null} Calories Garmin normalisées ou null si non disponibles
   */
  const getGarminCaloriesForDate = React.useCallback((dateStr) => {
    if (!garminData || !garminData.dailyMetrics) return null;
    
    const dailyMetrics = garminData.dailyMetrics[dateStr];
    if (!dailyMetrics || !dailyMetrics.calories) return null;
    
    const calories = dailyMetrics.calories;
    // Gérer les deux formats : objet {total, active, resting} ou nombre
    if (typeof calories === 'object' && calories.total !== undefined) {
      return normalizeReps(calories.total);
    } else if (typeof calories === 'number') {
      return normalizeReps(calories);
    }
    
    return null;
  }, [garminData, normalizeReps]);

  /**
   * Estime les calories brûlées pour une période donnée
   * ✅ PRIORITÉ 1 : Utilise les calories Garmin réelles si disponibles
   * ✅ PRIORITÉ 2 : Estimation MET (Metabolic Equivalent of Task) si pas de données Garmin
   * 
   * @param {Array} data - Tableau de workouts normalisés
   * @returns {number} Calories estimées en kcal
   * 
   * **Logique de calcul** :
   * 
   * **PRIORITÉ 1 : Calories Garmin (si disponibles)** :
   * - Extrait les calories depuis `garminData.dailyMetrics[date].calories`
   * - Gère les formats : objet `{total, active, resting}` ou nombre
   * - Plus précis car basé sur les données réelles de la montre Garmin
   * 
   * **PRIORITÉ 2 : Estimation MET (si pas de données Garmin)** :
   * 1. **Calories depuis la durée** (basé sur MET) :
   *    - MET (Metabolic Equivalent of Task) : mesure de l'intensité métabolique
   *    - Entraînement de force : 3-6 MET selon l'intensité perçue
   *    - Formule : `caloriesFromDuration = MET × poids (kg) × durée (heures)`
   *    - Poids moyen utilisé : 70 kg (standard pour calculs génériques)
   *    - Intensité ≤ 3 : MET = 3 (léger)
   *    - Intensité 4-6 : MET = 4.5 (modéré)
   *    - Intensité ≥ 7 : MET = 6 (intense)
   * 
   * 2. **Calories depuis le volume** (bonus pour répétitions) :
   *    - Formule : `caloriesFromReps = totalReps × 0.3`
   *    - Coefficient 0.3 : estimation basée sur l'énergie dépensée par répétition
   *    - Prend en compte l'effort musculaire supplémentaire
   * 
   * 3. **Total** : `caloriesTotal = caloriesFromDuration + caloriesFromReps`
   * 
   * **Exemple (estimation MET)** :
   * - Workout : 100 reps, intensité 7/10, durée 45 min
   * - MET = 6 (intensité ≥ 7)
   * - caloriesFromDuration = 6 × 70 × (45/60) = 6 × 70 × 0.75 = 315 kcal
   * - caloriesFromReps = 100 × 0.3 = 30 kcal
   * - Total = 315 + 30 = 345 kcal
   * 
   * **Note** : Estimation approximative, peut varier selon :
   * - Poids réel de l'utilisateur
   * - Type d'exercices (cardio vs force)
   * - Condition physique individuelle
   * - Récupération entre séries
   * 
   * **Performance** : O(n) où n = nombre de workouts
   */
  const estimateCalories = React.useCallback((data) => {
    return data.reduce((total, workout) => {
      const dateStr = workout.date; // Format YYYY-MM-DD
      
      // ✅ PRIORITÉ 1 : Utiliser les calories Garmin si disponibles
      const garminCalories = getGarminCaloriesForDate(dateStr);
      if (garminCalories !== null && garminCalories > 0) {
        // Utiliser les calories Garmin réelles (plus précises)
        return total + garminCalories;
      }
      
      // ✅ PRIORITÉ 2 : Estimation MET si pas de données Garmin
      // ✅ CORRECTION : Utiliser normalizeReps() et totalReps normalisé
      const reps = workout.totalReps != null
        ? normalizeReps(workout.totalReps)
        : (workout.exercises?.reduce((s, e) => s + normalizeReps(e.reps), 0) || 0);
      const intensity = normalizeReps(workout.intensity || 5);
      const duration = normalizeReps(workout.duration || 30); // durée en minutes
      
      // ✅ PHASE 4.3 : Calcul basé sur les MET (Metabolic Equivalent of Task)
      // Entraînement de force : 3-6 MET selon l'intensité
      // MET = mesure standard de l'intensité métabolique (1 MET = repos)
      const metValue = intensity <= 3 ? 3 : intensity <= 6 ? 4.5 : 6;
      
      // ✅ PHASE 4.3 : Calories depuis la durée (formule MET standard)
      // Formule : MET × poids (kg) × durée (heures)
      // Poids moyen utilisé : 70 kg (standard pour calculs génériques)
      const caloriesFromDuration = metValue * 70 * (duration / 60);
      
      // ✅ PHASE 4.3 : Bonus pour le volume de répétitions
      // Coefficient 0.3 : estimation basée sur l'énergie dépensée par répétition
      // Prend en compte l'effort musculaire supplémentaire au-delà de la durée
      const caloriesFromReps = reps * 0.3;
      
      return total + caloriesFromDuration + caloriesFromReps;
    }, 0);
  }, [normalizeReps, getGarminCaloriesForDate]);

  // ==========================================
  // FIN DES FONCTIONS DE CALCUL DES CHANGEMENTS
  // ==========================================

  // Calculs des statistiques avancées
  const stats = useMemo(() => {
    try {
      if (!workoutData || workoutData.length === 0) return null;

      // ✅ PHASE 1.2 : Normaliser toutes les données en entrée pour éviter les problèmes de types
      // Cette normalisation garantit que tous les calculs suivants utilisent des nombres valides
      validateWorkoutData(workoutData); // Validation en mode dev uniquement
      const normalizedWorkoutData = normalizeWorkoutData(workoutData);
      
      // ✅ CORRECTION : Vérifier que la normalisation a retourné des données
      if (!normalizedWorkoutData || normalizedWorkoutData.length === 0) {
        if (process.env.NODE_ENV === 'development') {
          console.warn('[AdvancedStats] normalizeWorkoutData returned empty array');
        }
        return null;
      }

    const now = new Date();
    const periodDays = {
      week: 7,
      month: 30,
      quarter: 90,
      year: 365
    };

    const currentPeriodStart = new Date(now.getTime() - periodDays[selectedPeriod] * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(currentPeriodStart.getTime() - periodDays[selectedPeriod] * 24 * 60 * 60 * 1000);

    // ✅ PHASE 1.2 : Filtrer sur les données normalisées
    const currentPeriodData = normalizedWorkoutData.filter(w => new Date(w.date) >= currentPeriodStart);
    const previousPeriodData = normalizedWorkoutData.filter(w => 
      new Date(w.date) >= previousPeriodStart && new Date(w.date) < currentPeriodStart
    );

    // ✅ PHASE 1.2 : Calculs pour la période actuelle avec normalisation
    // Tous les accès à exercise.reps utilisent maintenant des valeurs normalisées
    const currentStats = {
      totalWorkouts: currentPeriodData.length,
      // ✅ CORRECTION : Utiliser normalizeReps() pour garantir des nombres
      // Les données sont déjà normalisées par normalizeWorkoutData, mais on double-vérifie
      totalReps: currentPeriodData.reduce((sum, w) => {
        // Utiliser totalReps normalisé du workout si disponible, sinon calculer
        if (w.totalReps != null) {
          return sum + normalizeReps(w.totalReps);
        }
        // Sinon, sommer les reps normalisées des exercices
        return sum + (w.exercises?.reduce((s, e) => s + normalizeReps(e.reps), 0) || 0);
      }, 0),
      totalSets: currentPeriodData.reduce((sum, w) => sum + (w.exercises?.length || 0), 0),
      // ✅ CORRECTION : Normaliser intensity et duration
      avgIntensity: currentPeriodData.length > 0 ? 
        currentPeriodData.reduce((sum, w) => sum + normalizeReps(w.intensity || 5), 0) / currentPeriodData.length : 0,
      avgDuration: currentPeriodData.length > 0 ?
        currentPeriodData.reduce((sum, w) => sum + normalizeReps(w.duration || 30), 0) / currentPeriodData.length : 0,
      streak: calculateStreak(normalizedWorkoutData), // ✅ Utiliser données normalisées
      bestDay: getBestPerformanceDay(currentPeriodData),
      muscleDistribution: getMuscleDistribution(currentPeriodData),
      weeklyPattern: getWeeklyPattern(currentPeriodData),
      progressTrend: getProgressTrend(currentPeriodData, previousPeriodData), // ✅ CORRECTION : Utiliser currentPeriodData au lieu de normalizedWorkoutData.slice(-10)
      caloriesBurned: estimateCalories(currentPeriodData)
    };

    // ✅ PHASE 1.2 : Calculs pour la période précédente avec normalisation
    const previousStats = {
      totalWorkouts: previousPeriodData.length,
      // ✅ CORRECTION : Utiliser normalizeReps() pour garantir des nombres
      totalReps: previousPeriodData.reduce((sum, w) => {
        if (w.totalReps != null) {
          return sum + normalizeReps(w.totalReps);
        }
        return sum + (w.exercises?.reduce((s, e) => s + normalizeReps(e.reps), 0) || 0);
      }, 0),
      totalSets: previousPeriodData.reduce((sum, w) => sum + (w.exercises?.length || 0), 0),
      // ✅ CORRECTION : Normaliser intensity et duration
      avgIntensity: previousPeriodData.length > 0 ? 
        previousPeriodData.reduce((sum, w) => sum + normalizeReps(w.intensity || 5), 0) / previousPeriodData.length : 0,
      avgDuration: previousPeriodData.length > 0 ?
        previousPeriodData.reduce((sum, w) => sum + normalizeReps(w.duration || 30), 0) / previousPeriodData.length : 0
    };

    // Calcul des changements
    const changes = {
      workouts: calculateChange(currentStats.totalWorkouts, previousStats.totalWorkouts),
      reps: calculateChange(currentStats.totalReps, previousStats.totalReps),
      sets: calculateChange(currentStats.totalSets, previousStats.totalSets),
      intensity: calculateChange(currentStats.avgIntensity, previousStats.avgIntensity),
      duration: calculateChange(currentStats.avgDuration, previousStats.avgDuration)
    };

      return { current: currentStats, previous: previousStats, changes };
    } catch (error) {
      // ✅ CORRECTION : Capturer les erreurs pour éviter un crash silencieux
      console.error('[AdvancedStats] Error calculating stats:', error);
      if (process.env.NODE_ENV === 'development') {
        console.error('[AdvancedStats] Error details:', {
          workoutDataLength: workoutData?.length,
          errorMessage: error.message,
          errorStack: error.stack
        });
      }
      return null; // Retourner null en cas d'erreur pour éviter un crash
    }
  }, [workoutData, selectedPeriod, normalizeWorkoutData, normalizeReps, validateWorkoutData, getBestPerformanceDay, getMuscleDistribution, getWeeklyPattern, getProgressTrend, estimateCalories]);

  // ==========================================
  // 🟡 PHASE 2.3 : COMPOSANT StatCard OPTIMISÉ
  // ==========================================
  /**
   * Mapping des couleurs pour les classes Tailwind
   * ✅ CORRECTION : Tailwind ne peut pas détecter les classes dynamiques comme `text-${color}-400`
   * Il faut utiliser un mapping explicite pour que Tailwind puisse générer les classes CSS
   */
  const colorMap = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    purple: 'text-purple-400',
    orange: 'text-orange-400',
    red: 'text-red-400',
    indigo: 'text-indigo-400',
    pink: 'text-pink-400',
    teal: 'text-teal-400',
    cyan: 'text-cyan-400'
  };

  /**
   * Composant StatCard optimisé et mémorisé
   * Affiche une carte de statistique avec icône, valeur, unité et tendance
   * 
   * @param {string} title - Titre de la statistique
   * @param {number|string} value - Valeur à afficher
   * @param {string} unit - Unité de mesure (optionnel)
   * @param {number|null} change - Pourcentage de changement (optionnel)
   * @param {React.Component} icon - Composant icône Lucide
   * @param {string} color - Couleur de l'icône (blue, green, yellow, etc.)
   */
  const StatCard = React.memo(({ title, value, unit, change, icon: Icon, color = 'purple' }) => {
    // ✅ CORRECTION : Utiliser le mapping de couleurs au lieu de classes dynamiques
    const iconColorClass = colorMap[color] || colorMap.purple;
    
    return (
      <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:bg-slate-700/70 transition-colors duration-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon size={18} className={iconColorClass} />
            <span className="text-slate-400 text-sm">{title}</span>
          </div>
          {change !== undefined && (
            <div className="group relative">
              {formatChange(change)}
              {/* ✅ PHASE 2.3 : Tooltip pour expliquer les tendances */}
              {change !== null && (
                <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-10 w-48 p-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl text-xs text-slate-300">
                  {change === null ? (
                    <p>Nouvelle activité : pas de comparaison possible avec la période précédente.</p>
                  ) : change > 0 ? (
                    <p>Augmentation de <span className="text-green-400 font-semibold">{change.toFixed(1)}%</span> par rapport à la période précédente.</p>
                  ) : (
                    <p>Diminution de <span className="text-red-400 font-semibold">{Math.abs(change).toFixed(1)}%</span> par rapport à la période précédente.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="text-2xl font-bold text-white">
          {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
          {unit && <span className="text-lg text-slate-400 ml-1">{unit}</span>}
        </div>
      </div>
    );
  });
  
  // ✅ OPTIMISATION : Donner un nom au composant pour le debugging React DevTools
  StatCard.displayName = 'StatCard';

  // ✅ PHASE 3.2 : État de chargement et gestion des cas edge
  if (!isOpen) return null;
  
  // ✅ OPTIMISATION : Afficher un message si pas de données au lieu de rien
  if (!stats) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md p-6">
          <div className="text-center">
            <BarChart3 className="text-slate-400 mx-auto mb-4" size={48} />
            <h2 className="text-xl font-bold text-white mb-2">Aucune donnée disponible</h2>
            <p className="text-slate-400 text-sm">
              Commencez à enregistrer vos séances d'entraînement pour voir vos statistiques avancées.
            </p>
            <button
              onClick={onClose}
              className="mt-6 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* En-tête */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="text-purple-400" />
              Statistiques Avancées
            </h2>
            <p className="text-slate-400 mt-1">
              Analyse détaillée de tes performances et tendances
            </p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {periods.map(period => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
            <button
              onClick={onClose}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Métriques principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Séances totales"
              value={stats.current.totalWorkouts}
              change={stats.changes.workouts}
              icon={Calendar}
              color="blue"
            />
            <StatCard
              title="Répétitions totales"
              value={stats.current.totalReps}
              change={stats.changes.reps}
              icon={Target}
              color="green"
            />
            <StatCard
              title="Intensité moyenne"
              value={stats.current.avgIntensity.toFixed(1)}
              unit="/10"
              change={stats.changes.intensity}
              icon={Zap}
              color="yellow"
            />
            <StatCard
              title="Durée moyenne"
              value={Math.round(stats.current.avgDuration)}
              unit="min"
              change={stats.changes.duration}
              icon={Clock}
              color="purple"
            />
          </div>

          {/* Métriques secondaires */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <StatCard
              title="Série actuelle"
              value={stats.current.streak}
              unit="jours"
              icon={Flame}
              color="orange"
            />
            <StatCard
              title="Calories estimées"
              value={Math.round(stats.current.caloriesBurned)}
              unit="kcal"
              icon={Activity}
              color="red"
            />
            <StatCard
              title="Sets totaux"
              value={stats.current.totalSets}
              change={stats.changes.sets}
              icon={BarChart3}
              color="indigo"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tendance de progression */}
            <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
              <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                <TrendingUp className="text-green-400" />
                Tendance de Progression
                {/* ✅ PHASE 2.3 : Tooltip explicatif */}
                <div className="group relative">
                  <HelpCircle 
                    size={16} 
                    className="text-slate-400 hover:text-slate-300 cursor-help transition-colors" 
                  />
                  <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-10 w-64 p-3 bg-slate-900 border border-slate-700 rounded-lg shadow-xl text-xs text-slate-300">
                    <p className="font-semibold text-white mb-1">Comment ça marche ?</p>
                    <p className="mb-2">La tendance compare tes 5 dernières séances avec les 5 précédentes de la période sélectionnée.</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-400">
                      <li><span className="text-green-400">En progression</span> : +10% ou plus</li>
                      <li><span className="text-red-400">En baisse</span> : -10% ou moins</li>
                      <li><span className="text-yellow-400">Stable</span> : entre -10% et +10%</li>
                    </ul>
                  </div>
                </div>
              </h3>
              <div className="space-y-4">
                <div className={`p-4 rounded-lg ${
                  stats.current.progressTrend === 'improving' ? 'bg-green-900/30 border border-green-700' :
                  stats.current.progressTrend === 'declining' ? 'bg-red-900/30 border border-red-700' :
                  'bg-yellow-900/30 border border-yellow-700'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {stats.current.progressTrend === 'improving' && <TrendingUp className="text-green-400" size={20} />}
                    {stats.current.progressTrend === 'declining' && <TrendingDown className="text-red-400" size={20} />}
                    {stats.current.progressTrend === 'stable' && <Activity className="text-yellow-400" size={20} />}
                    <span className="text-white font-medium">
                      {stats.current.progressTrend === 'improving' && 'En progression ! 📈'}
                      {stats.current.progressTrend === 'declining' && 'En baisse 📉'}
                      {stats.current.progressTrend === 'stable' && 'Stable 📊'}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm">
                    {stats.current.progressTrend === 'improving' && 'Tes performances s\'améliorent ! Continue comme ça.'}
                    {stats.current.progressTrend === 'declining' && 'Tes performances baissent. Pense à la récupération.'}
                    {stats.current.progressTrend === 'stable' && 'Tes performances sont stables. Temps de varier ?'}
                  </p>
                </div>

                {stats.current.bestDay && (
                  <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-4">
                    <h4 className="text-purple-300 font-medium mb-2 flex items-center gap-2">
                      <Award size={16} />
                      Meilleure performance
                    </h4>
                    <p className="text-white text-sm">
                      {new Date(stats.current.bestDay.date).toLocaleDateString('fr-FR')}
                    </p>
                    <p className="text-slate-300 text-xs">
                      {/* ✅ CORRECTION : Utiliser normalizeReps() pour éviter concaténation */}
                      {stats.current.bestDay.exercises?.reduce((s, e) => s + normalizeReps(e.reps), 0)} reps • 
                      Intensité {normalizeReps(stats.current.bestDay.intensity || 5)}/10
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Distribution des muscles */}
            <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
              <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                <Target className="text-purple-400" />
                Répartition Musculaire
              </h3>
              <div className="space-y-3">
                {stats.current.muscleDistribution.slice(0, 6).map((item, index) => (
                  <div key={item.muscle} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${
                        index === 0 ? 'from-purple-500 to-purple-600' :
                        index === 1 ? 'from-blue-500 to-blue-600' :
                        index === 2 ? 'from-green-500 to-green-600' :
                        index === 3 ? 'from-yellow-500 to-yellow-600' :
                        index === 4 ? 'from-red-500 to-red-600' :
                        'from-gray-500 to-gray-600'
                      }`} />
                      <span className="text-white text-sm">{item.muscle}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-slate-600 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full bg-gradient-to-r ${
                            index === 0 ? 'from-purple-500 to-purple-600' :
                            index === 1 ? 'from-blue-500 to-blue-600' :
                            index === 2 ? 'from-green-500 to-green-600' :
                            index === 3 ? 'from-yellow-500 to-yellow-600' :
                            index === 4 ? 'from-red-500 to-red-600' :
                            'from-gray-500 to-gray-600'
                          }`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className="text-slate-400 text-xs w-12 text-right">
                        {item.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pattern hebdomadaire */}
            <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600 lg:col-span-2">
              <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                <Calendar className="text-blue-400" />
                Répartition Hebdomadaire
              </h3>
              <div className="grid grid-cols-7 gap-2">
                {stats.current.weeklyPattern.map((day, index) => {
                  const maxWorkouts = Math.max(...stats.current.weeklyPattern.map(d => d.workouts));
                  const height = maxWorkouts > 0 ? (day.workouts / maxWorkouts) * 100 : 0;
                  
                  return (
                    <div key={day.day} className="text-center">
                      <div className="h-20 flex items-end justify-center mb-2">
                        <div
                          className={`w-8 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t transition-all ${
                            day.workouts === 0 ? 'opacity-20' : ''
                          }`}
                          style={{ height: `${Math.max(height, 5)}%` }}
                          title={`${day.workouts} séance${day.workouts > 1 ? 's' : ''}`}
                        />
                      </div>
                      <div className="text-slate-400 text-xs">{day.day}</div>
                      <div className="text-white text-sm font-medium">{day.workouts}</div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 text-center">
                <p className="text-slate-400 text-sm">
                  Jour le plus actif: {
                    stats.current.weeklyPattern.reduce((best, current) => 
                      current.workouts > best.workouts ? current : best
                    ).day
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedStats;