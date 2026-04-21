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
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            {t('history.title')}
          </h1>
          <p className="text-sm text-teal-700">
            {t('history.subtitle')}
          </p>
        </div>

        <Card variant="sport" className="p-12 text-center">
          <div className="space-y-4">
            <Calendar className="mx-auto h-16 w-16 text-teal-600" />
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

  const filterBtn = (active) =>
    `rounded-lg border px-3 py-1.5 text-xs font-medium transition sm:text-sm ${
      active
        ? 'border-[#0F5C45] bg-[#0F5C45]/30 text-white shadow-sm shadow-black/30'
        : 'border-[#0F4C5C]/50 bg-black text-teal-100 hover:border-[#0F5C45]/55 hover:bg-[#0F4C5C]/12'
    }`;

  return (
    <div className="relative">
      {/* Contenu avec z-index relatif */}
      <div className="relative z-10 space-y-4 py-2">
        {/* En-tête */}
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">
          Historique des Entraînements
        </h1>
        <p className="text-sm text-teal-700">
          {history.length === 1
            ? t('history.stats.sessions', { count: history.length })
            : t('history.stats.sessionsPlural', { count: history.length })
          }
        </p>
      </div>

      {/* ✅ Filtres pour les exercices */}
      <Card variant="sport" className="p-4">
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-teal-500" />
              <span className={`${typography.presets.label} text-teal-100`}>
                {t('history.filters.label')}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setExerciseFilter('all')}
                className={filterBtn(exerciseFilter === 'all')}
              >
                {t('history.filters.all')} ({history.reduce((sum, s) => sum + (s.exercises?.length || 0), 0)})
              </button>
              <button
                type="button"
                onClick={() => setExerciseFilter('program')}
                className={`flex items-center gap-1 ${filterBtn(exerciseFilter === 'program')}`}
              >
                {t('history.filters.program')} ({stats.totalProgram})
              </button>
              <button
                type="button"
                onClick={() => setExerciseFilter('exceptional')}
                className={`flex items-center gap-1 ${filterBtn(exerciseFilter === 'exceptional')}`}
              >
                <Star className="h-3 w-3" />
                {t('history.filters.exceptional')} ({stats.totalExceptional})
              </button>
              <button
                type="button"
                onClick={() => setExerciseFilter('suppressed')}
                className={`flex items-center gap-1 ${filterBtn(exerciseFilter === 'suppressed')}`}
              >
                <XCircle className="h-3 w-3" />
                {t('history.filters.suppressed')} ({stats.totalSuppressed})
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques globales */}
      <Card variant="sport" className="p-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-teal-100">
            <Award className="h-5 w-5 text-sky-400" />
            <span>{t('history.stats.global')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className={`${typography.presets.h3} text-white`}>
                {history.length}
              </div>
              <div className={`${typography.presets.caption} text-teal-700`}>
                {t('history.stats.totalSessions')}
              </div>
            </div>
            <div className="text-center">
              <div className={`${typography.presets.h3} text-emerald-400`}>
                {calculateTotalRepsExcludingJumps(history)}
              </div>
              <div className={`${typography.presets.caption} text-teal-700`}>
                {t('history.stats.totalReps')}
              </div>
            </div>
            <div className="text-center">
              <div className={`${typography.presets.h3} text-cyan-300`}>
                {Math.round(history.reduce((sum, session) => sum + (session.duration || 0), 0) / 60)}
              </div>
              <div className={`${typography.presets.caption} text-teal-700`}>
                {t('history.stats.totalMinutes')}
              </div>
            </div>
            <div className="text-center">
              <div className={`${typography.presets.h3} text-sky-300`}>
                {history.length > 0 ? Math.round(calculateTotalRepsExcludingJumps(history) / history.length) : 0}
              </div>
              <div className={`${typography.presets.caption} text-teal-700`}>
                {t('history.stats.avgPerSession')}
              </div>
            </div>
            <div className="text-center md:col-span-4">
              <div className={`${typography.presets.h3} text-teal-200`}>
                {history.reduce((sum, session) => sum + (session.completedStretches || 0), 0)}
              </div>
              <div className={`${typography.presets.caption} text-teal-700`}>
                {t('history.stats.totalStretches')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des séances */}
      <div className="space-y-4">
        {filteredHistory.map((session, index) => (
          <Card key={index} variant="sport" className="transition-transform duration-200 hover:scale-[1.01]">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-2">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-sky-400" />
                    <span className={`${typography.presets.h5} text-white`}>
                      {formatDate(new Date(session.date))}
                    </span>
                  </div>
                  {session.feedbackOnly && (
                    <Badge className="w-fit border border-sky-500/35 bg-sky-500/10 text-xs text-sky-200">
                      {t('history.session.feedbackOnly')}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <Flame className="h-4 w-4 text-sky-400" />
                  <span className={`${typography.presets.caption} text-teal-200`}>
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
                  <Clock className="h-4 w-4 text-cyan-400" />
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
                  <Target className="h-4 w-4 text-teal-400" />
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
                    <Badge className="flex items-center gap-1 border border-sky-500/35 bg-sky-500/10 text-sky-200">
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
                    <Badge variant="outline" className="border-[#0F4C5C]/50 text-teal-700 text-xs">
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
                        className={`flex items-center justify-between rounded-lg border p-3 ${
                          exercise.isExceptional
                            ? 'border-sky-500/40 bg-sky-950/25'
                            : exercise.isSuppressed
                            ? 'border-red-500/40 bg-red-950/20 opacity-75'
                            : 'border-[#0F4C5C]/45 bg-black'
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <span className={`${typography.presets.bodySmall} ${
                            exercise.isSuppressed ? 'line-through text-teal-800' : 'text-white'
                          }`}>
                            {exercise.name}
                          </span>
                          {/* ✅ Badge Exceptionnel */}
                          {exercise.isExceptional && (
                            <Badge className="flex items-center gap-1 border border-sky-500/35 bg-sky-500/10 text-xs text-sky-200">
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
                            <span className={`${typography.presets.caption} italic text-teal-800`}>
                              ({exercise.suppressionReason})
                            </span>
                          )}
                          {/* ✅ Type et détails exceptionnels */}
                          {exercise.isExceptional && exercise.type && (
                            <span className={`${typography.presets.caption} text-sky-200`}>
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
                            <span className={`${typography.presets.caption} text-teal-700`}>
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
                            <span className={`${typography.presets.caption} text-sky-300`}>
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
                        className="flex items-center justify-between rounded-lg border border-[#0F4C5C]/50 bg-black p-3"
                      >
                        <span className={`${typography.presets.bodySmall} text-teal-100`}>
                          🧘‍♂️ {t('history.stretches.type', { type: stretch.type })}
                        </span>
                        <div className="flex items-center space-x-2">
                          <span className={`${typography.presets.caption} text-teal-400`}>
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
                <div className="mt-4 rounded-lg border border-[#0F4C5C]/45 bg-black p-3">
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