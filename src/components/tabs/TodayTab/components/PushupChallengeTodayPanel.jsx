import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Award, Save, Zap } from 'lucide-react';
import { useWorkout } from '../../../../context/WorkoutContext';
import { useTranslation } from '../../../../utils/translations';
import { getDateStr } from '../../../../utils/dateUtils';
import { loadEnduranceData } from '../../../../services/endurance/enduranceDataService';
import { listPushupChallengesDueOnDate } from '../../../../services/endurance/challengeScheduleUtils';
import {
  countPushupSessionsMeetingChallengeInWeek,
  isWeeklyQuotaChallenge,
  weeklySessionTarget
} from '../../../../services/endurance/pushupChallengeSchedule';
import { buildWorkoutAfterEnduranceSession } from '../../../../services/endurance/enduranceSessionPersist';
import {
  defaultPushupFormFromChallenge,
  resolvePushupChallengePlannedReps
} from '../../../../services/endurance/pushupSessionUtils';
import { createDefaultFormState } from '../../../../services/endurance/enduranceFormSchema';
import EnduranceSessionForm from '../../EnduranceTab/components/EnduranceSessionForm.jsx';
import { hasExerciseVariations } from '../../../../utils/exerciseVariationResolver';
import { invalidateSportXpCache } from '../../../../hooks/useSportXP';

function plannedHintForChallenge(challenge) {
  const sets = challenge.goalSetCount;
  const per = challenge.goalRepsPerSet;
  if (sets && per) return `${sets}×${per} (${resolvePushupChallengePlannedReps(challenge)} reps)`;
  const g = challenge.goalCount;
  return g ? `${g} reps` : '';
}

function initialForm(challenge, dateStr) {
  return {
    ...createDefaultFormState('pushups'),
    ...defaultPushupFormFromChallenge(challenge),
    date: dateStr,
    time: new Date().toTimeString().slice(0, 5)
  };
}

export default function PushupChallengeTodayPanel({ date }) {
  const { data, updateData, setSelectedExercise, setShowExerciseVariations } = useWorkout();
  const t = useTranslation();
  const dateStr = useMemo(() => getDateStr(date), [date]);
  const [saving, setSaving] = useState(false);
  const [forms, setForms] = useState({});

  const challenges = useMemo(() => {
    const ed = loadEnduranceData(data?.enduranceData || {});
    return listPushupChallengesDueOnDate(ed.challenges || [], dateStr, { workoutData: data });
  }, [data?.enduranceData, dateStr]);

  useEffect(() => {
    setForms((prev) => {
      const next = { ...prev };
      challenges.forEach((c) => {
        const id = String(c.id);
        if (!next[id]) next[id] = initialForm(c, dateStr);
      });
      return next;
    });
  }, [challenges, dateStr]);

  const onSave = useCallback(
    async (challenge) => {
      const id = String(challenge.id);
      const form = forms[id];
      if (!form) return;
      setSaving(true);
      try {
        const { success, workoutPayload } = await buildWorkoutAfterEnduranceSession({
          workoutData: data,
          activityType: 'pushups',
          sessionData: { ...form, date: dateStr, id: Date.now() },
          mode: 'append'
        });
        if (success && workoutPayload) {
          await updateData(workoutPayload);
          invalidateSportXpCache();
          setForms((prev) => {
            const copy = { ...prev };
            delete copy[id];
            return copy;
          });
        }
      } finally {
        setSaving(false);
      }
    },
    [data, dateStr, forms, updateData]
  );

  if (challenges.length === 0) return null;

  return (
    <div className="rounded-xl border-2 border-amber-500/35 bg-black p-5 shadow-lg space-y-4">
      <div className="flex items-center gap-2">
        <Award className="h-5 w-5 text-amber-300" />
        <h3 className="text-lg font-semibold text-amber-100">
          {t('today.pushupChallenge.title', 'Défis pompes — aujourd’hui')}
        </h3>
      </div>
      <p className="text-xs text-slate-400 max-w-2xl">
        {t(
          'today.pushupChallenge.hint',
          'Enregistre ta séance (séries × reps modifiables). Sync calendrier, Aujourd’hui et Récap.'
        )}
      </p>

      {challenges.map((challenge) => {
        const id = String(challenge.id);
        const form = forms[id];
        if (!form) return null;
        const hint = plannedHintForChallenge(challenge);
        const variationProbe = { name: 'Pompes', id: 104 };
        const weeklyDone = isWeeklyQuotaChallenge(challenge)
          ? countPushupSessionsMeetingChallengeInWeek(
              challenge,
              data?.enduranceData?.sessions?.pushups || [],
              dateStr,
              data
            )
          : 0;
        const weeklyTarget = weeklySessionTarget(challenge);
        return (
          <div
            key={challenge.id}
            className="rounded-lg border border-amber-600/30 bg-slate-950/60 p-4 space-y-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="font-medium text-white">{challenge.name}</div>
                {hint ? <div className="text-[11px] text-amber-200/80 mt-0.5">Objectif : {hint}</div> : null}
                {isWeeklyQuotaChallenge(challenge) ? (
                  <div className="text-[10px] text-slate-500 mt-1">
                    {t('today.pushupChallenge.weeklyProgress', {
                      done: weeklyDone,
                      target: weeklyTarget,
                      defaultValue: `Semaine : ${weeklyDone} / ${weeklyTarget} séance(s) validée(s)`
                    })}
                  </div>
                ) : null}
              </div>
              {hasExerciseVariations(variationProbe) ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedExercise(variationProbe);
                    setShowExerciseVariations(true);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-violet-500/40 bg-violet-600/15 px-2.5 py-1.5 text-[11px] text-violet-100 hover:bg-violet-600/25"
                  title={t('today.exercises.variations', 'Variations pompes')}
                >
                  <Zap className="h-3.5 w-3.5" />
                  {t('today.exercises.variationsShort', 'Variations')}
                </button>
              ) : null}
            </div>
            <EnduranceSessionForm
              activityType="pushups"
              formState={form}
              setFormState={(updater) =>
                setForms((prev) => ({
                  ...prev,
                  [id]: typeof updater === 'function' ? updater(prev[id]) : updater
                }))
              }
              pushupPlannedHint={hint}
            />
            <div className="flex justify-end">
              <button
                type="button"
                disabled={saving}
                onClick={() => onSave(challenge)}
                className="inline-flex items-center gap-2 rounded-lg border border-amber-500/50 bg-amber-600/20 px-4 py-2 text-sm text-amber-100 hover:bg-amber-600/35 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {t('today.pushupChallenge.save', 'Enregistrer la séance')}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
