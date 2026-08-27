import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Award, ChevronDown, ChevronUp, RefreshCw, Save, Settings2, Zap } from 'lucide-react';
import { useWorkout } from '../../../../context/WorkoutContext';
import { useTranslation } from '../../../../utils/translations';
import { getDateStr } from '../../../../utils/dateUtils';
import { loadEnduranceData } from '../../../../services/endurance/enduranceDataService';
import { partitionPushupChallengesForTodayPanel } from '../../../../services/endurance/challengeScheduleUtils';
import {
  countPushupSessionsMeetingChallengeInWeek,
  isWeeklyQuotaChallenge,
  weeklySessionTarget
} from '../../../../services/endurance/pushupChallengeSchedule';
import {
  mergePushupChallengeRhythmUpdate,
  realignPushupChallengeRhythmFromDate,
  resolveSchedulePatternFromChallenge
} from '../../../../services/endurance/pushupChallengeRhythmAlign';
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

function rhythmDraftFromChallenge(challenge) {
  return {
    schedulePattern: resolveSchedulePatternFromChallenge(challenge),
    intervalDays: challenge.intervalDays || 2,
    weeklySessionTarget: challenge.weeklySessionTarget ?? 3,
    scheduleWeekdays: Array.isArray(challenge.scheduleWeekdays)
      ? [...challenge.scheduleWeekdays]
      : [1, 3, 5]
  };
}

function patchEnduranceChallenges(workoutData, challengeId, mapFn) {
  const normalized = loadEnduranceData(workoutData?.enduranceData || {});
  const challenges = (normalized.challenges || []).map((c) =>
    String(c.id) === String(challengeId) ? mapFn(c) : c
  );
  return {
    ...workoutData,
    enduranceData: {
      ...(workoutData?.enduranceData || {}),
      sessions: normalized.sessions,
      challenges,
      lastUpdated: new Date().toISOString()
    }
  };
}

function PushupChallengeCard({
  challenge,
  dateStr,
  data,
  form,
  setForms,
  saving,
  onSave,
  offSchedule,
  t,
  setSelectedExercise,
  setShowExerciseVariations
}) {
  const id = String(challenge.id);
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

  const [realignOnSave, setRealignOnSave] = useState(offSchedule);
  const [rhythmOpen, setRhythmOpen] = useState(false);
  const [rhythmDraft, setRhythmDraft] = useState(() => rhythmDraftFromChallenge(challenge));
  const [realignOnRhythmApply, setRealignOnRhythmApply] = useState(true);
  const [rhythmSaving, setRhythmSaving] = useState(false);

  useEffect(() => {
    setRhythmDraft(rhythmDraftFromChallenge(challenge));
  }, [challenge.id, challenge.frequency, challenge.intervalDays, challenge.scheduleWeekdays]);

  const applyRhythmOnly = useCallback(async () => {
    setRhythmSaving(true);
    try {
      const anchor = realignOnRhythmApply ? dateStr : null;
      await onSave(challenge, { rhythmOnly: true, rhythmDraft, realignFromYmd: anchor });
    } finally {
      setRhythmSaving(false);
    }
  }, [challenge, dateStr, onSave, realignOnRhythmApply, rhythmDraft]);

  return (
    <div
      className={`rounded-lg border p-4 space-y-3 ${
        offSchedule
          ? 'border-slate-600/40 bg-slate-900/50'
          : 'border-amber-600/30 bg-slate-950/60'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-medium text-white">{challenge.name}</div>
            {offSchedule ? (
              <span className="rounded-md border border-slate-500/50 bg-slate-800/80 px-1.5 py-0.5 text-[10px] text-slate-300">
                {t('today.pushupChallenge.offScheduleBadge', 'Hors planning')}
              </span>
            ) : null}
          </div>
          {hint ? <div className="text-[11px] text-amber-200/80 mt-0.5">Objectif : {hint}</div> : null}
          {offSchedule ? (
            <p className="text-[10px] text-slate-500 mt-1 max-w-md">
              {t(
                'today.pushupChallenge.offScheduleHint',
                'Ce n’est pas un jour prévu pour ce défi — tu peux quand même enregistrer une séance.'
              )}
            </p>
          ) : null}
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

      {!isWeeklyQuotaChallenge(challenge) ? (
        <label className="flex items-start gap-2 text-[11px] text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5 rounded border-slate-600"
            checked={realignOnSave}
            onChange={(e) => setRealignOnSave(e.target.checked)}
          />
          <span>
            {t(
              'today.pushupChallenge.realignOnSave',
              'Recaler le rythme à partir de ce jour (ex. demain devient repos si tu t’entraînes aujourd’hui en 1 jour sur 2)'
            )}
          </span>
        </label>
      ) : null}

      <div className="rounded-md border border-slate-700/50 bg-black/40">
        <button
          type="button"
          onClick={() => setRhythmOpen((v) => !v)}
          className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-[11px] text-slate-300 hover:bg-slate-900/60"
        >
          <span className="inline-flex items-center gap-1.5">
            <Settings2 className="h-3.5 w-3.5 text-slate-400" />
            {t('today.pushupChallenge.rhythmTitle', 'Changer le rythme du défi')}
          </span>
          {rhythmOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {rhythmOpen ? (
          <div className="space-y-3 border-t border-slate-700/50 px-3 py-3">
            <select
              value={rhythmDraft.schedulePattern}
              onChange={(e) => setRhythmDraft((d) => ({ ...d, schedulePattern: e.target.value }))}
              className="w-full rounded-lg border border-slate-600/50 bg-black px-3 py-2 text-xs text-white"
            >
              <option value="daily">{t('endurance.challenges.pushupSchedule.daily', 'Tous les jours')}</option>
              <option value="every_other_day">
                {t('endurance.challenges.pushupSchedule.everyOther', 'Un jour sur deux')}
              </option>
              <option value="every_n_days">
                {t('endurance.challenges.pushupSchedule.everyNDays', 'Tous les N jours')}
              </option>
              <option value="weekdays">
                {t('endurance.challenges.pushupSchedule.weekdays', 'Jours fixes de la semaine')}
              </option>
              <option value="weekly_quota">
                {t('endurance.challenges.pushupSchedule.weeklyQuota', 'Quota hebdo (flexible)')}
              </option>
            </select>

            {rhythmDraft.schedulePattern === 'every_n_days' ? (
              <div>
                <label className="mb-1 block text-[10px] text-slate-500">
                  {t('endurance.challenges.modal.intervalDaysLabel', 'Tous les combien de jours ?')}
                </label>
                <input
                  type="number"
                  min={2}
                  max={14}
                  value={rhythmDraft.intervalDays}
                  onChange={(e) => setRhythmDraft((d) => ({ ...d, intervalDays: e.target.value }))}
                  className="w-full rounded-lg border border-slate-600/50 bg-black px-3 py-2 text-xs text-white"
                />
              </div>
            ) : null}

            {rhythmDraft.schedulePattern === 'weekly_quota' ? (
              <div>
                <label className="mb-1 block text-[10px] text-slate-500">
                  {t('endurance.challenges.modal.weeklySessionTarget', 'Séances par semaine')}
                </label>
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={rhythmDraft.weeklySessionTarget}
                  onChange={(e) =>
                    setRhythmDraft((d) => ({ ...d, weeklySessionTarget: e.target.value }))
                  }
                  className="w-full rounded-lg border border-slate-600/50 bg-black px-3 py-2 text-xs text-white"
                />
              </div>
            ) : null}

            {rhythmDraft.schedulePattern === 'weekdays' ? (
              <div className="flex flex-wrap gap-2">
                {[
                  [1, 'Lun'],
                  [2, 'Mar'],
                  [3, 'Mer'],
                  [4, 'Jeu'],
                  [5, 'Ven'],
                  [6, 'Sam'],
                  [0, 'Dim']
                ].map(([dow, label]) => {
                  const sel = (rhythmDraft.scheduleWeekdays || []).map(Number).includes(dow);
                  return (
                    <button
                      key={dow}
                      type="button"
                      onClick={() => {
                        setRhythmDraft((d) => {
                          const cur = (d.scheduleWeekdays || []).map(Number);
                          const next = sel ? cur.filter((x) => x !== dow) : [...cur, dow];
                          return { ...d, scheduleWeekdays: next.length ? next : [dow] };
                        });
                      }}
                      className={`rounded-md px-2 py-1 text-[10px] border ${
                        sel
                          ? 'border-amber-500/60 bg-amber-600/25 text-amber-100'
                          : 'border-slate-600 text-slate-400'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            ) : null}

            <label className="flex items-start gap-2 text-[10px] text-slate-500 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 rounded border-slate-600"
                checked={realignOnRhythmApply}
                onChange={(e) => setRealignOnRhythmApply(e.target.checked)}
              />
              <span>
                {t(
                  'today.pushupChallenge.realignFromToday',
                  'Recalculer le planning à partir de ce jour affiché'
                )}
              </span>
            </label>

            <button
              type="button"
              disabled={rhythmSaving || saving}
              onClick={applyRhythmOnly}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-500/50 bg-slate-800/60 px-3 py-1.5 text-[11px] text-slate-200 hover:bg-slate-700/60 disabled:opacity-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {t('today.pushupChallenge.applyRhythm', 'Appliquer le rythme')}
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          disabled={saving || rhythmSaving}
          onClick={() => onSave(challenge, { realignOnSave: realignOnSave && !isWeeklyQuotaChallenge(challenge) })}
          className="inline-flex items-center gap-2 rounded-lg border border-amber-500/50 bg-amber-600/20 px-4 py-2 text-sm text-amber-100 hover:bg-amber-600/35 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {t('today.pushupChallenge.save', 'Enregistrer la séance')}
        </button>
      </div>
    </div>
  );
}

export default function PushupChallengeTodayPanel({ date }) {
  const { data, updateData, setSelectedExercise, setShowExerciseVariations } = useWorkout();
  const t = useTranslation();
  const dateStr = useMemo(() => getDateStr(date), [date]);
  const [saving, setSaving] = useState(false);
  const [forms, setForms] = useState({});

  const { due, offSchedule } = useMemo(() => {
    const ed = loadEnduranceData(data?.enduranceData || {});
    return partitionPushupChallengesForTodayPanel(ed.challenges || [], dateStr, { workoutData: data });
  }, [data, dateStr]);

  const allShown = useMemo(() => [...due, ...offSchedule], [due, offSchedule]);
  const offScheduleIds = useMemo(() => new Set(offSchedule.map((c) => String(c.id))), [offSchedule]);

  useEffect(() => {
    setForms((prev) => {
      const next = { ...prev };
      allShown.forEach((c) => {
        const id = String(c.id);
        if (!next[id]) next[id] = initialForm(c, dateStr);
      });
      return next;
    });
  }, [allShown, dateStr]);

  const onSave = useCallback(
    async (challenge, options = {}) => {
      const { realignOnSave = false, rhythmOnly = false, rhythmDraft, realignFromYmd = null } = options;
      const id = String(challenge.id);

      if (rhythmOnly) {
        setSaving(true);
        try {
          const patched = patchEnduranceChallenges(data, id, (c) =>
            mergePushupChallengeRhythmUpdate(c, rhythmDraft, { realignFromYmd })
          );
          await updateData(patched);
        } finally {
          setSaving(false);
        }
        return;
      }

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
          let payload = workoutPayload;
          if (realignOnSave) {
            payload = patchEnduranceChallenges(payload, id, (c) =>
              realignPushupChallengeRhythmFromDate(c, dateStr)
            );
          }
          await updateData(payload);
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

  if (allShown.length === 0) return null;

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
          'Enregistre ta séance (séries × reps modifiables). Tu peux aussi t’entraîner un jour « repos » et recaler le rythme.'
        )}
      </p>

      {due.map((challenge) => {
        const id = String(challenge.id);
        const form = forms[id];
        if (!form) return null;
        return (
          <PushupChallengeCard
            key={challenge.id}
            challenge={challenge}
            dateStr={dateStr}
            data={data}
            form={form}
            setForms={setForms}
            saving={saving}
            onSave={onSave}
            offSchedule={false}
            t={t}
            setSelectedExercise={setSelectedExercise}
            setShowExerciseVariations={setShowExerciseVariations}
          />
        );
      })}

      {offSchedule.length > 0 ? (
        <div className="space-y-3 pt-1">
          <div className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
            {t('today.pushupChallenge.offScheduleSection', 'Hors planning — séance possible')}
          </div>
          {offSchedule.map((challenge) => {
            const id = String(challenge.id);
            const form = forms[id];
            if (!form) return null;
            return (
              <PushupChallengeCard
                key={challenge.id}
                challenge={challenge}
                dateStr={dateStr}
                data={data}
                form={form}
                setForms={setForms}
                saving={saving}
                onSave={onSave}
                offSchedule={offScheduleIds.has(id)}
                t={t}
                setSelectedExercise={setSelectedExercise}
                setShowExerciseVariations={setShowExerciseVariations}
              />
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
