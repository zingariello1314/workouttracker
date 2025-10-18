import React, { useState, useEffect } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { Filter, Calendar, Save, X, Trash2, ChevronUp, ChevronDown, TrendingUp } from 'lucide-react';
import { workoutProgram } from '../data/workoutProgram';
import './PastWorkoutsTable.css';

const PastWorkoutsTable = () => {
  const { data, updateData, programs, activeProgram, workoutTables, setWorkoutTables, getCurrentData } = useWorkout();
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [selectedDays, setSelectedDays] = useState(14); // Nombre de jours à afficher
  const [collapsedTables, setCollapsedTables] = useState(new Set());

  // Générer les dates pour l'affichage
  const generateDateRange = (days) => {
    const dates = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dates.push(date);
    }
    
    return dates;
  };

  // Obtenir le nom du jour en français
  const getDayName = (date) => {
    const days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    return days[date.getDay()];
  };

  // Formater la date pour l'affichage
  const formatDate = (date) => {
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit',
      weekday: 'short'
    });
  };

  // Obtenir la clé de date au format string (en fuseau horaire local)
  const getDateStr = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Obtenir les exercices pour un jour donné
  const getExercisesForDay = (date, programData = workoutProgram) => {
    const dayName = getDayName(date);
    const workout = programData[dayName];
    return workout ? workout.exercices : [];
  };

  // Obtenir les étirements pour un jour donné
  const getStretchesForDay = (date, programData = workoutProgram) => {
    const dayName = getDayName(date);
    const workout = programData[dayName];
    return workout ? workout.etirements : null;
  };

  // Obtenir tous les exercices uniques du programme (tous les jours)
  const getAllProgramExercises = (programData = workoutProgram) => {
    const allExercises = [];
    const exerciseIds = new Set();
    
    // Fonction helper pour ajouter un exercice
    const addExercise = (exercise, day, variant = null) => {
      if (!exerciseIds.has(exercise.id)) {
        exerciseIds.add(exercise.id);
        allExercises.push({
          ...exercise,
          availableDays: [day],
          variant: variant // Marquer si c'est une variante (semaineA, semaineB, etc.)
        });
      } else {
        // Si l'exercice existe déjà, ajouter ce jour à ses jours disponibles
        const existingExercise = allExercises.find(ex => ex.id === exercise.id);
        if (existingExercise && !existingExercise.availableDays.includes(day)) {
          existingExercise.availableDays.push(day);
        }
      }
    };
    
    // Parcourir tous les jours de la semaine
    const days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
    
    days.forEach(day => {
      const workout = programData[day];
      if (workout) {
        // Ajouter les exercices de base
        if (workout.exercices) {
          workout.exercices.forEach(exercise => {
            addExercise(exercise, day);
          });
        }
        
        // Ajouter les exercices des variantes de salle (semaineA et semaineB)
        if (workout.salleVariants) {
          if (workout.salleVariants.semaineA && workout.salleVariants.semaineA.exercices) {
            workout.salleVariants.semaineA.exercices.forEach(exercise => {
              addExercise(exercise, day, 'semaineA');
            });
          }
          
          if (workout.salleVariants.semaineB && workout.salleVariants.semaineB.exercices) {
            workout.salleVariants.semaineB.exercices.forEach(exercise => {
              addExercise(exercise, day, 'semaineB');
            });
          }
        }
      }
    });
    
    return allExercises;
  };

  // Créer un nouveau tableau pour un programme
  const createTableForProgram = (program, startDate = new Date()) => {
    const tableId = `table_${program.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const dates = generateDateRange(selectedDays);
    
    return {
      id: tableId,
      programId: program.id,
      programName: program.name,
      startDate: startDate.toISOString(),
      createdAt: new Date().toISOString(),
      dates: dates.map(date => getDateStr(date)),
      exercises: getAllProgramExercises(program.data || workoutProgram),
      isActive: program.id === activeProgram?.id
    };
  };

  // Initialiser les tableaux au chargement
  useEffect(() => {
    // Ne rien faire automatiquement - les tableaux ne se créent que quand il y a des données
  }, [activeProgram?.id]);

  // Gérer le changement de programme
  useEffect(() => {
    const handleProgramChange = () => {
      if (!activeProgram) return;

      // Désactiver tous les tableaux existants
      setWorkoutTables(prev => prev.map(table => ({ ...table, isActive: false })));

      // Vérifier s'il existe déjà un tableau pour ce programme
      const existingTable = workoutTables.find(table => table.programId === activeProgram.id);
      
      if (existingTable) {
        // Réactiver le tableau existant
        setWorkoutTables(prev => prev.map(table => 
          table.id === existingTable.id 
            ? { ...table, isActive: true }
            : table
        ));
      }
      // Ne pas créer automatiquement de nouveau tableau
    };

    handleProgramChange();
  }, [activeProgram?.id]);

  // Vérifier si un exercice est disponible pour un jour donné
  const isExerciseAvailableForDay = (exercise, date) => {
    // Tous les exercices sont maintenant disponibles tous les jours
    return true;
  };

  // État pour les cases débloquées manuellement
  const [unlockedCells, setUnlockedCells] = useState(new Set());

  // Débloquer/verrouiller une cellule
  const toggleCellLock = (dateStr, exerciseId) => {
    const cellKey = `${dateStr}_${exerciseId}`;
    setUnlockedCells(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cellKey)) {
        newSet.delete(cellKey);
      } else {
        newSet.add(cellKey);
      }
      return newSet;
    });
  };

  // Vérifier si une cellule est disponible (jour correct ou débloquée manuellement)
  const isCellAvailable = (exercise, date, dateStr, exerciseId) => {
    const cellKey = `${dateStr}_${exerciseId}`;
    return isExerciseAvailableForDay(exercise, date) || unlockedCells.has(cellKey);
  };

  // Fonction pour supprimer un tableau
  const deleteTable = (tableId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce tableau ? Cette action est irréversible.')) {
      setWorkoutTables(prev => prev.filter(table => table.id !== tableId));
      console.log('🗑️ Tableau supprimé:', tableId);
    }
  };
  
  const getCellValue = (date, exerciseId, type = 'reps') => {
    const key = `${date}_${exerciseId}`;
    
    // Utiliser getCurrentData() pour inclure les données temporaires
    const currentData = getCurrentData();
    
    if (type === 'reps') {
      const value = currentData.reps[key] || '';
      return value;
    } else if (type === 'checked') {
      const checked = currentData.checkedExercises[key] || false;
      return checked;
    }
    return '';
  };

  // Mettre à jour une cellule
  const updateCell = (date, exerciseId, value, type = 'reps') => {
    const key = `${date}_${exerciseId}`;
    const newData = { ...data };
    
    if (type === 'reps') {
      newData.reps = { ...newData.reps, [key]: value };
      // Marquer automatiquement comme coché si des reps sont saisies
      if (value && parseInt(value) > 0) {
        newData.checkedExercises = { ...newData.checkedExercises, [key]: true };
      }
    } else if (type === 'checked') {
      newData.checkedExercises = { ...newData.checkedExercises, [key]: value };
    }
    
    updateData(newData);
  };

  // Gérer l'édition d'une cellule
  const handleCellEdit = (tableId, date, exerciseId, currentValue) => {
    setEditingCell(`${tableId}_${date}_${exerciseId}`);
    setEditValue(currentValue.toString());
  };

  // Sauvegarder l'édition
  const saveEdit = () => {
    if (!editingCell) return;
    
    const [tableId, date, exerciseId] = editingCell.split('_');
    const numValue = parseInt(editValue) || 0;
    
    updateCell(date, exerciseId, numValue);
    setEditingCell(null);
    setEditValue('');
  };

  // Annuler l'édition
  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  // Supprimer les données d'une cellule
  const handleCellDelete = (tableId, date, exerciseId) => {
    const key = `${date}_${exerciseId}`;
    const newData = { ...data };
    
    // Supprimer les reps et le statut coché
    delete newData.reps[key];
    delete newData.checkedExercises[key];
    
    updateData(newData);
  };

  // Basculer l'état replié d'un tableau
  const toggleTableCollapse = (tableId) => {
    setCollapsedTables(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tableId)) {
        newSet.delete(tableId);
      } else {
        newSet.add(tableId);
      }
      return newSet;
    });
  };

  // Calculer les statistiques d'un tableau
  const getTableStats = (table) => {
    // Vérifier que table et ses propriétés existent
    if (!table || !table.dates || !table.exercises) {
      console.warn('⚠️ Table invalide dans getTableStats:', table);
      return {
        totalReps: 0,
        completedExercises: 0,
        totalExercises: 0,
        completionRate: 0
      };
    }

    const totalReps = table.dates.reduce((total, date) => {
      return total + table.exercises.reduce((dayTotal, exercise) => {
        const reps = parseInt(getCellValue(date, exercise.id)) || 0;
        return dayTotal + reps;
      }, 0);
    }, 0);

    const completedExercises = table.dates.reduce((total, date) => {
      return total + table.exercises.filter(exercise => 
        getCellValue(date, exercise.id, 'checked')
      ).length;
    }, 0);

    const totalPossibleExercises = table.dates.length * table.exercises.length;
    const completionRate = totalPossibleExercises > 0 
      ? Math.round((completedExercises / totalPossibleExercises) * 100) 
      : 0;

    return { 
      totalReps, 
      completedExercises, 
      totalExercises: table.exercises.length,
      completionRate 
    };
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec contrôles */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">📅</span>
          <h2 className="text-2xl font-bold text-white">Modifier les séances passées</h2>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select 
              value={selectedDays}
              onChange={(e) => setSelectedDays(parseInt(e.target.value))}
              className="bg-gray-800 text-white px-3 py-1 rounded border border-gray-600 focus:border-blue-500"
            >
              <option value={7}>7 derniers jours</option>
              <option value={14}>14 derniers jours</option>
              <option value={30}>30 derniers jours</option>
            </select>
          </div>
        </div>
      </div>

      {/* Message d'information */}
      {workoutTables.length === 0 && (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Aucun tableau disponible</h3>
          <p className="text-gray-400">
            Les tableaux se génèrent automatiquement lorsque vous changez de programme ou enregistrez des données.
          </p>
        </div>
      )}

      {/* Tableaux des programmes */}
      {workoutTables.map((table) => {
        // Vérifier que la table a une structure valide
        if (!table || !table.exercises || !Array.isArray(table.exercises)) {
          console.warn('⚠️ Table avec structure invalide ignorée:', table);
          console.warn('⚠️ Propriétés manquantes - exercises:', !!table?.exercises, 'dates:', !!table?.dates);
          return null;
        }

        const stats = getTableStats(table);
        const isCollapsed = collapsedTables.has(table.id);
        const dates = generateDateRange(selectedDays);
        
        // Fonction pour identifier les exercices manquants
        const getMissingExercises = (table) => {
          if (!table || !table.exercises) return [];
          
          // Obtenir tous les exercices possibles du programme
          const allPossibleExercises = getAllProgramExercises(table.programData || workoutProgram);
          
          // Identifier les exercices qui ne sont pas dans le tableau actuel
          const currentExerciseIds = new Set(table.exercises.map(ex => ex.id));
          const missingExercises = allPossibleExercises.filter(ex => !currentExerciseIds.has(ex.id));
          
          return missingExercises;
        };
        
        // Créer un tableau pour les exercices manquants
        const createMissingExercisesTable = (originalTable) => {
          const missingExercises = getMissingExercises(originalTable);
          
          if (missingExercises.length === 0) return null;
          
          return {
            id: `missing_${originalTable.id}`,
            programId: originalTable.programId,
            programName: `${originalTable.programName} - Exercices Manquants`,
            exercises: missingExercises,
            dates: originalTable.dates,
            startDate: originalTable.startDate,
            createdAt: originalTable.createdAt,
            isActive: originalTable.isActive,
            triggerType: 'missing_exercises',
            programData: originalTable.programData
          };
        };
        
        // Créer le tableau des exercices manquants
        const missingTable = createMissingExercisesTable(table);

        return (
          <div key={table.id}>
            {/* Tableau principal */}
            <div className="bg-gray-800 border border-gray-600 rounded-lg overflow-hidden">
              {/* En-tête du tableau */}
              <div className="bg-gray-700 px-6 py-4 border-b border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => toggleTableCollapse(table.id)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                    </button>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{table.programName}</h3>
                      <p className="text-sm text-gray-400">
                        Créé le {new Date(table.createdAt).toLocaleDateString('fr-FR')}
                        {table.isActive && <span className="ml-2 px-2 py-1 bg-green-600 text-white text-xs rounded">Actif</span>}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <TrendingUp className="w-4 h-4" />
                        <span>{stats.completionRate}% complété</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {stats.totalReps} répétitions totales
                      </div>
                    </div>
                    
                    <button
                      onClick={() => deleteTable(table.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-2 rounded transition-colors"
                      title="Supprimer ce tableau"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Contenu du tableau */}
              {!isCollapsed && (
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-600">
                          <th className="text-left py-3 px-4 text-gray-300 font-medium min-w-[200px]">
                            Exercice
                          </th>
                          <th className="text-center py-3 px-4 text-gray-300 font-medium min-w-[80px]">
                            Séries
                          </th>
                          {dates.map((date) => {
                            const dateStr = getDateStr(date);
                            const dayName = getDayName(date);
                            return (
                              <th key={dateStr} className="text-center py-3 px-2 text-gray-300 font-medium min-w-[60px]">
                                <div className="text-xs">
                                  {formatDate(date)}
                                </div>
                                <div className="text-xs text-gray-500 capitalize">
                                  {dayName.slice(0, 3)}
                                </div>
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {table.exercises.map((exercise) => (
                          <tr key={exercise.id} className="border-b border-gray-700 hover:bg-gray-750">
                            <td className="py-3 px-4">
                              <div className="flex flex-col">
                                <span className="font-medium text-white">{exercise.name}</span>
                                {exercise.notes && (
                                  <span className="text-xs text-gray-400 mt-1">{exercise.notes}</span>
                                )}
                                {exercise.variant && (
                                  <span className="text-xs text-blue-400 mt-1">
                                    Variante: {exercise.variant}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center text-gray-300">
                              {exercise.series}
                            </td>
                            {dates.map((date) => {
                              const dateStr = getDateStr(date);
                              const cellKey = `${table.id}_${dateStr}_${exercise.id}`;
                              const isEditing = editingCell === cellKey;
                              const currentValue = getCellValue(dateStr, exercise.id);
                              const isChecked = getCellValue(dateStr, exercise.id, 'checked');
                              const cellAvailable = isExerciseAvailableForDay(exercise, date);
                              const isUnlocked = !cellAvailable;

                              return (
                                <td key={dateStr} className="py-3 px-2 text-center">
                                  {isUnlocked && (
                                    <button
                                      onClick={() => {
                                        const newChecked = !isChecked;
                                        updateCell(dateStr, exercise.id, newChecked, 'checked');
                                      }}
                                      className="absolute top-1 right-1 text-xs opacity-60 hover:opacity-100"
                                      title={isUnlocked ? "Jour non prévu - cliquer pour cocher/décocher" : "Jour prévu"}
                                    >
                                      {isUnlocked ? '🔓' : '🔒'}
                                    </button>
                                  )}
                                  
                                  {isEditing ? (
                                    <div className="flex items-center space-x-1">
                                      <input
                                        type="number"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="w-12 px-1 py-1 text-center bg-gray-700 text-white border border-gray-500 rounded text-sm"
                                        autoFocus
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') saveEdit();
                                          if (e.key === 'Escape') cancelEdit();
                                        }}
                                      />
                                      <button
                                        onClick={saveEdit}
                                        className="text-green-400 hover:text-green-300"
                                      >
                                        <Save className="w-3 h-3" />
                                      </button>
                                      <button
                                        onClick={cancelEdit}
                                        className="text-red-400 hover:text-red-300"
                                      >
                                        <X className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center space-x-1">
                                      <button
                                        onClick={() => cellAvailable && handleCellEdit(table.id, dateStr, exercise.id, currentValue)}
                                        disabled={!cellAvailable}
                                        className={`
                                          px-2 py-1 rounded text-sm min-w-[40px] flex items-center justify-center relative
                                          ${!cellAvailable 
                                            ? 'bg-gray-800 text-gray-600 cursor-not-allowed opacity-50' 
                                            : isChecked 
                                              ? 'bg-green-600 text-white shadow-lg ring-2 ring-green-400/50' 
                                              : currentValue 
                                                ? 'bg-blue-600 text-white shadow-md' 
                                                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                                          }
                                          transition-all duration-200
                                        `}
                                      >
                                        {isChecked && (
                                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full flex items-center justify-center">
                                            <span className="text-xs text-green-900">✓</span>
                                          </div>
                                        )}
                                        <span className={isChecked ? 'font-semibold' : ''}>{currentValue || '0'}</span>
                                      </button>
                                      {currentValue && cellAvailable && (
                                        <button
                                          onClick={() => handleCellDelete(table.id, dateStr, exercise.id)}
                                          className="text-red-400 hover:text-red-300 p-1"
                                          title="Supprimer cette donnée"
                                        >
                                          🗑️
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Tableau des exercices manquants */}
            {missingTable && missingTable.exercises.length > 0 && (
              <div className="mt-4 bg-orange-900/20 border border-orange-600/50 rounded-lg overflow-hidden">
                {/* En-tête du tableau des exercices manquants */}
                <div className="bg-orange-800/30 px-6 py-4 border-b border-orange-600/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => toggleTableCollapse(`missing_${table.id}`)}
                        className="text-orange-400 hover:text-orange-300 transition-colors"
                      >
                        {collapsedTables.has(`missing_${table.id}`) ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                      </button>
                      <div>
                        <h3 className="text-lg font-semibold text-orange-200">
                          ⚠️ Exercices Manquants ({missingTable.exercises.length})
                        </h3>
                        <p className="text-sm text-orange-400">
                          Exercices du programme non inclus dans le tableau principal
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contenu du tableau des exercices manquants */}
                {!collapsedTables.has(`missing_${table.id}`) && (
                  <div className="p-6">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr>
                            <th className="text-left py-3 px-4 font-semibold text-orange-300 border-b border-orange-600/50 min-w-[200px]">
                              Exercice
                            </th>
                            <th className="text-center py-3 px-4 font-semibold text-orange-300 border-b border-orange-600/50 min-w-[80px]">
                              Séries
                            </th>
                            {dates.map((date) => {
                              const dateStr = getDateStr(date);
                              const dayName = getDayName(date);
                              return (
                                <th key={dateStr} className="text-center py-3 px-2 font-semibold text-orange-300 border-b border-orange-600/50 min-w-[60px]">
                                  <div className="text-xs">
                                    {formatDate(date)}
                                  </div>
                                  <div className="text-xs text-orange-500 capitalize">
                                    {dayName.slice(0, 3)}
                                  </div>
                                </th>
                              );
                            })}
                          </tr>
                        </thead>
                        <tbody>
                          {missingTable.exercises.map((exercise) => (
                            <tr key={exercise.id} className="border-b border-orange-700/30 hover:bg-orange-900/10">
                              <td className="py-3 px-4">
                                <div className="flex flex-col">
                                  <span className="font-medium text-orange-200">{exercise.name}</span>
                                  {exercise.notes && (
                                    <span className="text-xs text-orange-400 mt-1">{exercise.notes}</span>
                                  )}
                                  {exercise.variant && (
                                    <span className="text-xs text-orange-300 mt-1">
                                      Variante: {exercise.variant}
                                    </span>
                                  )}
                                  <span className="text-xs text-orange-500 mt-1">
                                    Jours disponibles: {exercise.availableDays?.join(', ') || 'Non spécifié'}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-center text-orange-300">
                                {exercise.series}
                              </td>
                              {dates.map((date) => {
                                const dateStr = getDateStr(date);
                                const cellKey = `missing_${table.id}_${dateStr}_${exercise.id}`;
                                const isEditing = editingCell === cellKey;
                                const currentValue = getCellValue(dateStr, exercise.id);
                                const isChecked = getCellValue(dateStr, exercise.id, 'checked');
                                const cellAvailable = isExerciseAvailableForDay(exercise, date);

                                return (
                                  <td key={dateStr} className="py-3 px-2 text-center">
                                    {isEditing ? (
                                      <div className="flex items-center space-x-1">
                                        <input
                                          type="number"
                                          value={editValue}
                                          onChange={(e) => setEditValue(e.target.value)}
                                          className="w-12 px-1 py-1 text-center bg-orange-800 text-white border border-orange-500 rounded text-sm"
                                          autoFocus
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') saveEdit();
                                            if (e.key === 'Escape') cancelEdit();
                                          }}
                                        />
                                        <button
                                          onClick={saveEdit}
                                          className="text-green-400 hover:text-green-300"
                                        >
                                          <Save className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={cancelEdit}
                                          className="text-red-400 hover:text-red-300"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-center space-x-1">
                                        <button
                                          onClick={() => handleCellEdit(`missing_${table.id}`, dateStr, exercise.id, currentValue)}
                                          className={`
                                            px-2 py-1 rounded text-sm min-w-[40px] flex items-center justify-center relative
                                            ${isChecked 
                                              ? 'bg-green-600 text-white shadow-lg ring-2 ring-green-400/50' 
                                              : currentValue 
                                                ? 'bg-orange-600 text-white shadow-md' 
                                                : 'bg-orange-800/50 text-orange-400 hover:bg-orange-700/50'
                                            }
                                            transition-all duration-200
                                          `}
                                        >
                                          {isChecked && (
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full flex items-center justify-center">
                                              <span className="text-xs text-green-900">✓</span>
                                            </div>
                                          )}
                                          <span className={isChecked ? 'font-semibold' : ''}>{currentValue || '0'}</span>
                                        </button>
                                        {currentValue && (
                                          <button
                                            onClick={() => handleCellDelete(`missing_${table.id}`, dateStr, exercise.id)}
                                            className="text-red-400 hover:text-red-300 p-1"
                                            title="Supprimer cette donnée"
                                          >
                                            🗑️
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default PastWorkoutsTable;