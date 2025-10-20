import React, { useState } from 'react';
import Card, { CardContent, CardHeader, CardTitle } from './ui/Card';
import Button from './ui/Button';
import { Input } from './ui/Input';
import Badge from './ui/Badge';
import { ChevronDown, ChevronUp, Save, Calendar, Activity } from 'lucide-react';
import './WorkoutHistoryTable.css';

/**
 * Composant pour afficher un tableau individuel d'historique de programme
 * Contient les exercices, les répétitions prévues et les saisies manuelles
 */
const WorkoutHistoryTable = ({ 
  table, 
  updateHistoryReps, 
  getHistoryReps, 
  calculateAutoReps 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [saveStates, setSaveStates] = useState({});

  // Fonction pour formater les dates
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Fonction pour gérer la saisie des répétitions
  const handleRepsChange = (exerciseId, value) => {
    updateHistoryReps(table.id, exerciseId, value);
    
    // Marquer comme modifié
    setSaveStates(prev => ({
      ...prev,
      [exerciseId]: 'modified'
    }));
  };

  // Fonction pour sauvegarder manuellement
  const handleManualSave = (exerciseId) => {
    setSaveStates(prev => ({
      ...prev,
      [exerciseId]: 'saved'
    }));
    
    // Réinitialiser l'état après 2 secondes
    setTimeout(() => {
      setSaveStates(prev => ({
        ...prev,
        [exerciseId]: null
      }));
    }, 2000);
  };

  // Fonction pour obtenir l'icône du bouton de sauvegarde
  const getSaveButtonIcon = (exerciseId) => {
    const state = saveStates[exerciseId];
    if (state === 'saved') return '✓';
    return <Save size={14} />;
  };

  // Fonction pour obtenir la classe du bouton de sauvegarde
  const getSaveButtonClass = (exerciseId) => {
    const state = saveStates[exerciseId];
    if (state === 'saved') return 'save-button saved';
    if (state === 'modified') return 'save-button modified';
    return 'save-button';
  };

  // Filtrer les exercices qui ont des données
  const exercisesWithData = table.exercises.filter(exercise => {
    const historyValue = getHistoryReps(table.id, exercise.id);
    return historyValue && historyValue.trim() !== '';
  });

  // Si aucun exercice n'a de données, ne pas afficher le tableau
  if (exercisesWithData.length === 0) {
    return null;
  }

  return (
    <Card className="workout-history-table">
      <CardHeader 
        className="cursor-pointer" 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="text-blue-600" size={20} />
            <div>
              <CardTitle className="text-lg font-semibold text-gray-800">
                {table.programName}
              </CardTitle>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>Du {formatDate(table.startDate)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>au {formatDate(table.endDate)}</span>
                </div>
                <Badge 
                  variant={table.isActive ? "default" : "secondary"}
                  className={table.isActive ? "bg-green-100 text-green-800" : ""}
                >
                  {table.isActive ? 'En cours' : 'Terminé'}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {exercisesWithData.length} exercice{exercisesWithData.length > 1 ? 's' : ''}
            </Badge>
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <div className="workout-history-exercises">
            <div className="exercises-header">
              <div className="exercise-name">Exercice</div>
              <div className="exercise-series">Séries</div>
              <div className="exercise-reps">Reps prévues</div>
              <div className="exercise-total">Total auto</div>
              <div className="exercise-input">Saisie manuelle</div>
              <div className="exercise-save">Action</div>
            </div>

            {table.exercises.map(exercise => {
              const historyValue = getHistoryReps(table.id, exercise.id);
              const autoTotal = calculateAutoReps(exercise.series);
              
              return (
                <div key={exercise.id} className="exercise-row">
                  <div className="exercise-name">
                    <span className="font-medium">{exercise.nom}</span>
                    {exercise.variant && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        {exercise.variant === 'semaineA' ? 'Semaine A' : 'Semaine B'}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="exercise-series">
                    <Badge variant="secondary" className="text-xs">
                      {exercise.series || '—'}
                    </Badge>
                  </div>
                  
                  <div className="exercise-reps">
                    <span className="text-sm text-gray-600">
                      {exercise.repetitions || '—'}
                    </span>
                  </div>
                  
                  <div className="exercise-total">
                    <span className="text-sm font-medium text-blue-600">
                      {autoTotal ? Math.round(autoTotal * 10) / 10 : '—'}
                    </span>
                  </div>
                  
                  <div className="exercise-input">
                    <Input
                      type="text"
                      value={historyValue}
                      onChange={(e) => handleRepsChange(exercise.id, e.target.value)}
                      placeholder="Reps réelles"
                      className="text-sm"
                    />
                  </div>
                  
                  <div className="exercise-save">
                    <Button
                      size="sm"
                      variant="outline"
                      className={getSaveButtonClass(exercise.id)}
                      onClick={() => handleManualSave(exercise.id)}
                    >
                      {getSaveButtonIcon(exercise.id)}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

export default WorkoutHistoryTable;