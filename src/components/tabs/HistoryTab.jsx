import React, { useState, useMemo } from 'react';
import { Calendar, TrendingUp, Clock, Award, Target, Flame, Star, XCircle, Filter } from 'lucide-react';
import { useWorkout } from '../../context/WorkoutContext';
import Card, { CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { formatDate } from '../../utils/dateUtils';
import { typography } from '../../styles/typography';
import { calculateTotalRepsExcludingJumps, calculateValidReps } from '../../utils/enduranceUtils';
import { useTranslation } from '../../utils/translations';
import SessionFeedbackDisplay from '../sport/SessionFeedbackDisplay';

const HistoryTab = () => {
  const { getWorkoutHistory } = useWorkout();
  const t = useTranslation();
  
  const history = getWorkoutHistory();
  
  // ✅ État pour les filtres (Programme / Exceptionnels / Supprimés)
  const [exerciseFilter, setExerciseFilter] = useState('all'); // 'all' | 'program' | 'exceptional' | 'suppressed'

  // ✅ Filtrer les exercices selon le filtre sélectionné
  const filteredHistory = useMemo(() => {
    if (exerciseFilter === 'all') {
      return history;
    }
    
    return history.map(session => {
      const filteredExercises = session.exercises?.filter(exercise => {
        if (exerciseFilter === 'program') {
          return !exercise.isExceptional && !exercise.isSuppressed;
        } else if (exerciseFilter === 'exceptional') {
          return exercise.isExceptional === true;
        } else if (exerciseFilter === 'suppressed') {
          return exercise.isSuppressed === true;
        }
        return true;
      }) || [];
      
      return {
        ...session,
        exercises: filteredExercises
      };
    }).filter(
      (session) =>
        session.exercises.length > 0 ||
        (session.stretches && session.stretches.length > 0) ||
        session.feedbackOnly
    );
  }, [history, exerciseFilter]);

  // ✅ Calculer statistiques filtrées
  const stats = useMemo(() => {
    const totalExceptional = history.reduce((sum, session) => 
      sum + (session.exercises?.filter(ex => ex.isExceptional).length || 0), 0
    );
    const totalSuppressed = history.reduce((sum, session) => 
      sum + (session.exercises?.filter(ex => ex.isSuppressed).length || 0), 0
    );
    const totalProgram = history.reduce((sum, session) => 
      sum + (session.exercises?.filter(ex => !ex.isExceptional && !ex.isSuppressed).length || 0), 0
    );
    
    return { totalExceptional, totalSuppressed, totalProgram };
  }, [history]);

  if (history.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className={typography.presets.h2Gradient}>
            {t('history.title')}
          </h1>
          <p className={typography.presets.body}>
            {t('history.subtitle')}
          </p>
        </div>

        <Card className="p-12 text-center">
          <div className="space-y-4">
            <Calendar className="w-16 h-16 mx-auto text-slate-400" />
            <div>
              <h3 className={typography.presets.h4}>{t('history.empty.title')}</h3>
              <p className={typography.presets.body}>
                {t('history.empty.message')}
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      {/* Contenu avec z-index relatif */}
      <div className="relative z-10 space-y-6 p-6">
        {/* En-tête */}
      <div className="text-center space-y-2">
        <h1 className={typography.presets.h2Gradient}>
          Historique des Entraînements
        </h1>
        <p className={typography.presets.body}>
          {history.length === 1
            ? t('history.stats.sessions', { count: history.length })
            : t('history.stats.sessionsPlural', { count: history.length })
          }
        </p>
      </div>

      {/* ✅ Filtres pour les exercices */}
      <Card className="p-4">
        <CardContent className="p-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <span className={`${typography.presets.label} text-slate-300`}>
                {t('history.filters.label')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setExerciseFilter('all')}
                className={`gradient-button-premium gradient-button-premium-sm rounded-lg ${
                  exerciseFilter === 'all'
                    ? 'gradient-button-premium-variant'
                    : ''
                }`}
              >
                {t('history.filters.all')} ({history.reduce((sum, s) => sum + (s.exercises?.length || 0), 0)})
              </button>
              <button
                type="button"
                onClick={() => setExerciseFilter('program')}
                className={`gradient-button-premium gradient-button-premium-sm rounded-lg flex items-center gap-1 ${
                  exerciseFilter === 'program'
                    ? 'gradient-button-premium-variant'
                    : ''
                }`}
              >
                {t('history.filters.program')} ({stats.totalProgram})
              </button>
              <button
                type="button"
                onClick={() => setExerciseFilter('exceptional')}
                className={`gradient-button-premium gradient-button-premium-sm rounded-lg flex items-center gap-1 ${
                  exerciseFilter === 'exceptional'
                    ? 'gradient-button-premium-variant'
                    : ''
                }`}
              >
                <Star className="w-3 h-3" />
                {t('history.filters.exceptional')} ({stats.totalExceptional})
              </button>
              <button
                type="button"
                onClick={() => setExerciseFilter('suppressed')}
                className={`gradient-button-premium gradient-button-premium-sm rounded-lg flex items-center gap-1 ${
                  exerciseFilter === 'suppressed'
                    ? 'gradient-button-premium-variant'
                    : ''
                }`}
              >
                <XCircle className="w-3 h-3" />
                {t('history.filters.suppressed')} ({stats.totalSuppressed})
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques globales */}
      <Card className="p-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-yellow-400" />
            <span>{t('history.stats.global')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className={`${typography.presets.h3} text-blue-400`}>
                {history.length}
              </div>
              <div className={typography.presets.caption}>
                {t('history.stats.totalSessions')}
              </div>
            </div>
            <div className="text-center">
              <div className={`${typography.presets.h3} text-green-400`}>
                {calculateTotalRepsExcludingJumps(history)}
              </div>
              <div className={typography.presets.caption}>
                {t('history.stats.totalReps')}
              </div>
            </div>
            <div className="text-center">
              <div className={`${typography.presets.h3} text-purple-400`}>
                {Math.round(history.reduce((sum, session) => sum + (session.duration || 0), 0) / 60)}
              </div>
              <div className={typography.presets.caption}>
                {t('history.stats.totalMinutes')}
              </div>
            </div>
            <div className="text-center">
              <div className={`${typography.presets.h3} text-orange-400`}>
                {history.length > 0 ? Math.round(calculateTotalRepsExcludingJumps(history) / history.length) : 0}
              </div>
              <div className={typography.presets.caption}>
                {t('history.stats.avgPerSession')}
              </div>
            </div>
            <div className="text-center">
              <div className={`${typography.presets.h3} text-purple-400`}>
                {history.reduce((sum, session) => sum + (session.completedStretches || 0), 0)}
              </div>
              <div className={typography.presets.caption}>
                {t('history.stats.totalStretches')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des séances */}
      <div className="space-y-4">
        {filteredHistory.map((session, index) => (
          <Card key={index} className="hover:scale-[1.02] transition-transform duration-200">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    <span className={`${typography.presets.h5} text-white`}>
                      {formatDate(new Date(session.date))}
                    </span>
                  </div>
                  {session.feedbackOnly && (
                    <Badge className="w-fit bg-amber-500/15 text-amber-200 border-amber-500/35 text-xs">
                      {t('history.session.feedbackOnly')}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className={`${typography.presets.caption} text-orange-400`}>
                    {t('history.session.number', { number: history.length - index })}
                  </span>
                </div>
              </div>
              
              {!session.feedbackOnly ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span className={typography.presets.bodySmall}>
                    {(() => {
                      const reps = calculateValidReps(session);
                      return reps === 1
                        ? t('history.session.reps', { count: reps })
                        : t('history.session.repsPlural', { count: reps });
                    })()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className={typography.presets.bodySmall}>
                    {(() => {
                      const minutes = Math.round((session.duration || 0) / 60);
                      return minutes === 1
                        ? t('history.session.minutes', { count: minutes })
                        : t('history.session.minutesPlural', { count: minutes });
                    })()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-purple-400" />
                  <span className={typography.presets.bodySmall}>
                    {(() => {
                      const exercises = session.exercises?.length || 0;
                      return exercises === 1
                        ? t('history.session.exercises', { count: exercises })
                        : t('history.session.exercisesPlural', { count: exercises });
                    })()}
                  </span>
                </div>
              </div>
              ) : null}

              {/* ✅ Métadonnées enrichies (si variations présentes) */}
              {session.hasVariations && (
                <div className="mb-4 flex items-center gap-2 flex-wrap">
                  {session.exceptionalCount > 0 && (
                    <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      {session.exceptionalCount === 1
                        ? t('history.exercises.exceptionalCount', { count: session.exceptionalCount })
                        : t('history.exercises.exceptionalCountPlural', { count: session.exceptionalCount })
                      }
                    </Badge>
                  )}
                  {session.suppressedCount > 0 && (
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30 flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      {session.suppressedCount === 1
                        ? t('history.exercises.suppressedCount', { count: session.suppressedCount })
                        : t('history.exercises.suppressedCountPlural', { count: session.suppressedCount })
                      }
                    </Badge>
                  )}
                  {session.variationReason && (
                    <Badge variant="outline" className="border-slate-500 text-slate-400 text-xs">
                      {session.variationReason}
                    </Badge>
                  )}
                </div>
              )}

              {/* Détails des exercices */}
              {session.exercises && session.exercises.length > 0 && (
                <div className="space-y-2">
                  <h4 className={`${typography.presets.label} mb-2`}>{t('history.exercises.title')}</h4>
                  <div className="grid gap-2">
                    {session.exercises.map((exercise, exerciseIndex) => (
                      <div 
                        key={exerciseIndex}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          exercise.isExceptional
                            ? 'bg-yellow-900/20 border-yellow-500/30'
                            : exercise.isSuppressed
                            ? 'bg-red-900/20 border-red-500/30 opacity-75'
                            : 'bg-slate-800/30 border-slate-700/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <span className={`${typography.presets.bodySmall} ${
                            exercise.isSuppressed ? 'line-through text-slate-500' : 'text-white'
                          }`}>
                            {exercise.name}
                          </span>
                          {/* ✅ Badge Exceptionnel */}
                          {exercise.isExceptional && (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 flex items-center gap-1 text-xs">
                              <Star className="w-3 h-3" />
                              {t('history.exercises.exceptional')}
                            </Badge>
                          )}
                          {/* ✅ Badge Supprimé */}
                          {exercise.isSuppressed && (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 flex items-center gap-1 text-xs">
                              <XCircle className="w-3 h-3" />
                              {t('history.exercises.suppressed')}
                            </Badge>
                          )}
                          {/* ✅ Raison de suppression */}
                          {exercise.isSuppressed && exercise.suppressionReason && (
                            <span className={`${typography.presets.caption} text-slate-500 italic`}>
                              ({exercise.suppressionReason})
                            </span>
                          )}
                          {/* ✅ Type et détails exceptionnels */}
                          {exercise.isExceptional && exercise.type && (
                            <span className={`${typography.presets.caption} text-yellow-300`}>
                              {exercise.type === 'duration' && exercise.duration
                                ? `${Math.floor(exercise.duration / 60)}min ${exercise.duration % 60}s`
                                : exercise.type === 'reps' && exercise.actualReps
                                ? `${exercise.actualReps.join(' + ')} reps`
                                : exercise.type === 'reps' && exercise.totalReps
                                ? `${exercise.totalReps} reps`
                                : ''}
                            </span>
                          )}
                          {/* ✅ Matériel et notes exceptionnels */}
                          {exercise.isExceptional && exercise.materiel && (
                            <span className={`${typography.presets.caption} text-slate-400`}>
                              • {exercise.materiel}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4">
                          {!exercise.isSuppressed && (
                            <span className={`${typography.presets.caption} text-green-400`}>
                              {t('history.exercises.reps', { count: exercise.reps || 0 })}
                            </span>
                          )}
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
                  <h4 className={`${typography.presets.label} mb-2`}>{t('history.stretches.title')}</h4>
                  <div className="grid gap-2">
                    {session.stretches.map((stretch, stretchIndex) => (
                      <div 
                        key={stretchIndex}
                        className="flex items-center justify-between p-3 bg-purple-800/20 rounded-lg border border-purple-700/50"
                      >
                        <span className={`${typography.presets.bodySmall} text-purple-200`}>
                          🧘‍♂️ {t('history.stretches.type', { type: stretch.type })}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className={`${typography.presets.caption} text-purple-400`}>
                            {t('history.stretches.completed')}
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
                  <h4 className={`${typography.presets.label} mb-2`}>{t('history.notes.label')}</h4>
                  <p className={typography.presets.bodySmall}>
                    {session.notes}
                  </p>
                </div>
              )}

              {/* ✅ Feedback de session */}
              {session.feedback && (
                <SessionFeedbackDisplay feedback={session.feedback} date={session.date} />
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      </div>
    </div>
  );
};

export default HistoryTab;