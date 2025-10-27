import React from 'react';
import { Calendar, TrendingUp, Clock, Award, Target, Flame } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import { formatDate } from '../../utils/dateUtils';
import { typography } from '../../styles/typography';

const HistoryTab = () => {
  const { getWorkoutHistory } = useWorkout();
  
  const history = getWorkoutHistory();

  if (history.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className={typography.presets.h2Gradient}>
            Historique des Entraînements
          </h1>
          <p className={typography.presets.body}>
            Suivez vos progrès et consultez vos séances passées
          </p>
        </div>

        <Card className="p-12 text-center">
          <div className="space-y-4">
            <Calendar className="w-16 h-16 mx-auto text-slate-400" />
            <div>
              <h3 className={typography.presets.h4}>Aucun historique</h3>
              <p className={typography.presets.body}>
                Commencez votre premier entraînement pour voir votre historique ici.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="text-center space-y-2">
        <h1 className={typography.presets.h2Gradient}>
          Historique des Entraînements
        </h1>
        <p className={typography.presets.body}>
          {history.length} séance{history.length > 1 ? 's' : ''} enregistrée{history.length > 1 ? 's' : ''}
        </p>
      </div>

      {/* Statistiques globales */}
      <Card className="p-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-yellow-400" />
            <span>Statistiques globales</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`${typography.presets.h3} text-blue-400`}>
                {history.length}
              </div>
              <div className={typography.presets.caption}>
                Séances totales
              </div>
            </div>
            <div className="text-center">
              <div className={`${typography.presets.h3} text-green-400`}>
                {history.reduce((sum, session) => sum + (session.totalReps || 0), 0)}
              </div>
              <div className={typography.presets.caption}>
                Répétitions totales
              </div>
            </div>
            <div className="text-center">
              <div className={`${typography.presets.h3} text-purple-400`}>
                {Math.round(history.reduce((sum, session) => sum + (session.duration || 0), 0) / 60)}
              </div>
              <div className={typography.presets.caption}>
                Minutes d'entraînement
              </div>
            </div>
            <div className="text-center">
              <div className={`${typography.presets.h3} text-orange-400`}>
                {history.length > 0 ? Math.round(history.reduce((sum, session) => sum + (session.totalReps || 0), 0) / history.length) : 0}
              </div>
              <div className={typography.presets.caption}>
                Moyenne par séance
              </div>
            </div>
            <div className="text-center">
              <div className={`${typography.presets.h3} text-purple-400`}>
                {history.reduce((sum, session) => sum + (session.completedStretches || 0), 0)}
              </div>
              <div className={typography.presets.caption}>
                Étirements total
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des séances */}
      <div className="space-y-4">
        {history.map((session, index) => (
          <Card key={index} className="hover:scale-[1.02] transition-transform duration-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  <span className={`${typography.presets.h5} text-white`}>
                    {formatDate(new Date(session.date))}
                  </span>
                </div>
                <div className="flex items-center space-x-1">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className={`${typography.presets.caption} text-orange-400`}>
                    Séance #{history.length - index}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className={typography.presets.bodySmall}>
                    {session.totalReps || 0} répétitions
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className={typography.presets.bodySmall}>
                    {Math.round((session.duration || 0) / 60)} minutes
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-purple-400" />
                  <span className={typography.presets.bodySmall}>
                    {session.exercises?.length || 0} exercices
                  </span>
                </div>
              </div>

              {/* Détails des exercices */}
              {session.exercises && session.exercises.length > 0 && (
                <div className="space-y-2">
                  <h4 className={`${typography.presets.label} mb-2`}>Exercices réalisés:</h4>
                  <div className="grid gap-2">
                    {session.exercises.map((exercise, exerciseIndex) => (
                      <div 
                        key={exerciseIndex}
                        className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/50"
                      >
                        <span className={typography.presets.bodySmall}>
                          {exercise.name}
                        </span>
                        <div className="flex items-center space-x-4">
                          <span className={`${typography.presets.caption} text-green-400`}>
                            {exercise.reps} reps
                          </span>
                          {exercise.weight && (
                            <span className={`${typography.presets.caption} text-blue-400`}>
                              {exercise.weight}kg
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Détails des étirements */}
              {session.stretches && session.stretches.length > 0 && (
                <div className="space-y-2">
                  <h4 className={`${typography.presets.label} mb-2`}>Étirements réalisés:</h4>
                  <div className="grid gap-2">
                    {session.stretches.map((stretch, stretchIndex) => (
                      <div 
                        key={stretchIndex}
                        className="flex items-center justify-between p-3 bg-purple-800/20 rounded-lg border border-purple-700/50"
                      >
                        <span className={`${typography.presets.bodySmall} text-purple-200`}>
                          🧘‍♂️ Étirements {stretch.type}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className={`${typography.presets.caption} text-purple-400`}>
                            ✓ Terminé
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes de la séance */}
              {session.notes && (
                <div className="mt-4 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                  <h4 className={`${typography.presets.label} mb-2`}>Notes:</h4>
                  <p className={typography.presets.bodySmall}>
                    {session.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default HistoryTab;