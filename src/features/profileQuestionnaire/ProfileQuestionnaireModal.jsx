import React, { useContext, useEffect, useMemo, useState } from 'react';
import Modal from '../../components/ui/Modal';
import { WorkoutContext } from '../../context/WorkoutContext';
import {
  ONBOARDING_OPEN_EVENT,
  PROFILE_QUESTION_DEFS,
  QUESTION_SECTIONS
} from './constants';
import { filterActiveQuestions } from './quizQuestionVisibility';
import { suggestPrimaryMissionsFromAnswers } from './quizMissionResolver';
import { computeCompletion } from './schema';
import { useProfileQuestionnaire } from './useProfileQuestionnaire';
import { estimateTargetWeightFromQuiz } from './quizInfluence';
import QuizCompletionRecap from './QuizCompletionRecap.jsx';
import { buildQuizCompletionRecap } from './buildQuizCompletionRecap.js';

const DAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

const sectionById = QUESTION_SECTIONS.reduce((acc, s) => {
  acc[s.id] = s;
  return acc;
}, {});

const getSectionLabel = (sectionId) => sectionById[sectionId]?.label || 'Profil';

const QuestionCard = ({ question, value, onSelect, allAnswers, programs = [] }) => {
  if (question.type === 'existingProgram') {
    const v = value && typeof value === 'object' ? value : {};
    const has = v.hasProgram || null;
    const list = Array.isArray(programs) ? programs : [];
    return (
      <div className="space-y-4">
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { key: 'no', label: 'Non', desc: 'Je n’ai pas de programme en cours dans l’app' },
            { key: 'yes', label: 'Oui', desc: 'Je suis un programme enregistré dans Programme' }
          ].map((opt) => {
            const active = has === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() =>
                  onSelect({
                    hasProgram: opt.key,
                    programId: opt.key === 'yes' ? v.programId || null : null,
                    programName: opt.key === 'yes' ? v.programName || null : null
                  })
                }
                className={`rounded-lg border p-3 text-left transition ${
                  active
                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-100'
                    : 'border-slate-600 bg-slate-900/40 text-slate-100 hover:border-slate-500'
                }`}
              >
                <div className="text-sm font-medium">{opt.label}</div>
                <div className="mt-1 text-xs text-slate-300">{opt.desc}</div>
              </button>
            );
          })}
        </div>
        {has === 'yes' ? (
          <div className="space-y-2">
            <p className="text-xs text-slate-400">Choisis le programme que tu suis actuellement :</p>
            {list.length === 0 ? (
              <p className="text-sm text-amber-200/90 rounded-lg border border-amber-700/50 bg-amber-950/30 p-3">
                Aucun programme enregistré — crée-en un dans l’onglet Programme ou réponds « Non ».
              </p>
            ) : (
              <div className="grid gap-2 max-h-48 overflow-y-auto">
                {list.map((p) => {
                  const selected = String(v.programId) === String(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        onSelect({
                          hasProgram: 'yes',
                          programId: p.id,
                          programName: p.name || 'Programme'
                        })
                      }
                      className={`rounded-lg border p-3 text-left text-sm transition ${
                        selected
                          ? 'border-cyan-400 bg-cyan-500/15 text-cyan-100'
                          : 'border-slate-600 bg-slate-900/40 text-slate-200 hover:border-slate-500'
                      }`}
                    >
                      <span className="font-medium">{p.name || 'Sans nom'}</span>
                      {p.duration ? (
                        <span className="ml-2 text-xs text-slate-400">{p.duration} sem.</span>
                      ) : null}
                      {p.status === 'active' ? (
                        <span className="ml-2 text-[10px] uppercase text-emerald-400">actif</span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}
      </div>
    );
  }

  if (question.type === 'vitals') {
    const v = value && typeof value === 'object' ? value : {};
    const targetMode = v.targetWeightMode || 'none';
    const autoTarget = estimateTargetWeightFromQuiz({ ...(allAnswers || {}), vitalsSelfReport: v });
    const setField = (k, raw) => {
      const next = { ...v, [k]: raw };
      onSelect(next);
    };
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <label className="text-xs text-slate-400">Sexe</label>
          <select
            value={v.sex || ''}
            onChange={(e) => setField('sex', e.target.value || null)}
            className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-slate-100"
          >
            <option value="">—</option>
            <option value="male">Homme</option>
            <option value="female">Femme</option>
            <option value="other">Autre / non précisé</option>
            <option value="na">Préfère ne pas dire</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-400">Âge (ans)</label>
          <input
            type="number"
            min={10}
            max={110}
            placeholder="ex. 28"
            value={v.age ?? ''}
            onChange={(e) => setField('age', e.target.value === '' ? null : Number(e.target.value))}
            className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-slate-100"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-400">Poids (kg)</label>
          <input
            type="number"
            min={30}
            max={250}
            step="0.1"
            placeholder="ex. 72.5"
            value={v.weightKg ?? ''}
            onChange={(e) => setField('weightKg', e.target.value === '' ? null : e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-slate-100"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-400">Taille (cm)</label>
          <input
            type="number"
            min={120}
            max={230}
            placeholder="ex. 175"
            value={v.heightCm ?? ''}
            onChange={(e) => setField('heightCm', e.target.value === '' ? null : Number(e.target.value))}
            className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-slate-100"
          />
        </div>
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs text-slate-400">Objectif de poids</label>
          <div className="grid gap-2 sm:grid-cols-3">
            <select
              value={targetMode}
              onChange={(e) => setField('targetWeightMode', e.target.value)}
              className="rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-slate-100"
            >
              <option value="none">Pas d’objectif de poids</option>
              <option value="manual">Je saisis un poids cible</option>
              <option value="auto">Calcul automatique (selon objectif silhouette)</option>
            </select>
            <input
              type="number"
              min={30}
              max={250}
              step="0.1"
              placeholder="Poids cible (kg)"
              value={v.targetWeightKg ?? ''}
              onChange={(e) => setField('targetWeightKg', e.target.value === '' ? null : e.target.value)}
              disabled={targetMode !== 'manual'}
              className="rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 disabled:opacity-50"
            />
            <button
              type="button"
              disabled={targetMode !== 'auto' || !autoTarget}
              onClick={() => setField('targetWeightKg', autoTarget)}
              className="rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200 disabled:opacity-40"
            >
              Utiliser auto {autoTarget ? `(${autoTarget} kg)` : ''}
            </button>
          </div>
        </div>
        <p className="sm:col-span-2 text-[11px] text-slate-500">
          Tu peux laisser vide ce que tu ne souhaites pas partager : les champs remplis seules alimentent les
          suggestions.
        </p>
      </div>
    );
  }

  if (question.type === 'strengthBaselines') {
    const v = value && typeof value === 'object' ? value : {};
    const setNum = (k, max) => (e) => {
      const raw = e.target.value;
      const next = { ...v, [k]: raw === '' ? null : Math.min(max, Math.max(1, Math.round(Number(raw)))) };
      onSelect(next);
    };
    const fields = [
      { k: 'pushupsMax', label: 'Pompes (max strict)', max: 200 },
      { k: 'pullupsMax', label: 'Tractions pronation (max)', max: 80 },
      { k: 'dipsMax', label: 'Dips (max)', max: 80 },
      { k: 'australianPullupsMax', label: 'Tractions australiennes (max)', max: 80 },
      { k: 'squatGobletMax', label: 'Squat gobelet (max reps)', max: 100 },
      { k: 'lungesMax', label: 'Fentes (max / jambe)', max: 60 },
      { k: 'plankSecMax', label: 'Gainage (secondes max)', max: 300 }
    ];
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map(({ k, label, max }) => (
          <div key={k} className="space-y-1">
            <label className="text-xs text-slate-400">{label}</label>
            <input
              type="number"
              min={1}
              max={max}
              placeholder="—"
              value={v[k] ?? ''}
              onChange={setNum(k, max)}
              className="w-full rounded-lg border border-slate-600 bg-slate-900/60 px-3 py-2 text-sm text-slate-100"
            />
          </div>
        ))}
        <p className="sm:col-span-2 text-[11px] text-slate-500">
          Facultatif : laisse vide les mouvements que tu ne pratiques pas. Le programme ajustera séries/reps sur ceux
          renseignés.
        </p>
      </div>
    );
  }

  if (question.type === 'slider') {
    const safeValue = value == null ? Number(question.min || 0) : Number(value);
    return (
      <div className="space-y-3">
        <input
          type="range"
          min={question.min}
          max={question.max}
          step={question.step || 1}
          value={safeValue}
          onChange={(e) => onSelect(Number(e.target.value))}
          className="w-full accent-emerald-400"
        />
        <div className="text-center text-sm font-semibold text-emerald-300">{safeValue}%</div>
      </div>
    );
  }

  if (question.type === 'days') {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {DAYS.map((d) => {
          const active = selected.includes(d);
          return (
            <button
              key={d}
              type="button"
              onClick={() => {
                if (active) {
                  onSelect(selected.filter((x) => x !== d));
                } else {
                  onSelect([...selected, d]);
                }
              }}
              className={`rounded-lg border px-3 py-2 text-sm transition ${
                active
                  ? 'border-emerald-400 bg-emerald-500/20 text-emerald-100'
                  : 'border-slate-600 bg-slate-900/40 text-slate-200 hover:border-slate-500'
              }`}
            >
              {d}
            </button>
          );
        })}
      </div>
    );
  }

  if (question.type === 'multi') {
    const selected = Array.isArray(value)
      ? value
      : typeof value === 'string' && value
        ? [value]
        : [];
    const max = Number(question.max) > 0 ? Number(question.max) : 999;
    return (
      <div className="space-y-2">
        {question.max ? (
          <div className="text-xs text-slate-400">
            {selected.length}/{max} sélectionnés
          </div>
        ) : null}
        <div className="grid gap-2">
          {(question.options || []).map((opt) => {
            const active = selected.includes(opt.key);
            const blocked = !active && selected.length >= max;
            return (
              <button
                key={opt.key}
                type="button"
                disabled={blocked}
                onClick={() => {
                  if (active) {
                    onSelect(selected.filter((x) => x !== opt.key));
                  } else {
                    onSelect([...selected, opt.key]);
                  }
                }}
                className={`rounded-lg border p-3 text-left transition ${
                  active
                    ? 'border-emerald-400 bg-emerald-500/20 text-emerald-100'
                    : 'border-slate-600 bg-slate-900/40 text-slate-100 hover:border-slate-500'
                } ${blocked ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <div className="text-sm font-medium">{opt.label}</div>
                {opt.description ? (
                  <div className="mt-1 text-xs text-slate-400">{opt.description}</div>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      {(question.options || []).map((opt) => {
        const active = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onSelect(opt.key)}
            className={`rounded-lg border p-3 text-left transition ${
              active
                ? 'border-emerald-400 bg-emerald-500/20 text-emerald-100'
                : 'border-slate-600 bg-slate-900/40 text-slate-100 hover:border-slate-500'
            }`}
          >
            <div className="text-sm font-medium">{opt.label}</div>
            {opt.description ? <div className="mt-1 text-xs text-slate-300">{opt.description}</div> : null}
          </button>
        );
      })}
    </div>
  );
};

const ProfileQuestionnaireModal = ({ isOpen, onClose }) => {
  const { questionnaire, saveAnswers, markSkipped } = useProfileQuestionnaire();
  const { data, programs, getExerciseNameById } = useContext(WorkoutContext);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(questionnaire.answers || {});
  const [saving, setSaving] = useState(false);
  const [showRecap, setShowRecap] = useState(false);

  const activeQuestions = useMemo(
    () => filterActiveQuestions(PROFILE_QUESTION_DEFS, answers || {}),
    [answers]
  );

  const quizWasCompleted = Boolean(questionnaire.onboardingWizardCompletedAt);

  useEffect(() => {
    if (!isOpen) return;
    setStep(0);
    setShowRecap(false);
    setAnswers(questionnaire.answers || {});
  }, [isOpen, questionnaire.answers]);

  useEffect(() => {
    if (step >= activeQuestions.length) {
      setStep(Math.max(0, activeQuestions.length - 1));
    }
  }, [activeQuestions.length, step]);

  const question = activeQuestions[step];

  useEffect(() => {
    if (!isOpen || question?.id !== 'primaryMission') return;
    setAnswers((prev) => {
      const cur = prev?.primaryMission;
      const hasSelection =
        (Array.isArray(cur) && cur.length > 0) || (typeof cur === 'string' && cur.length > 0);
      if (hasSelection) return prev;
      const suggested = suggestPrimaryMissionsFromAnswers(prev || {});
      if (!suggested.length) return prev;
      return { ...prev, primaryMission: suggested };
    });
  }, [isOpen, question?.id, step]);

  useEffect(() => {
    if (!isOpen || question?.id !== 'programDurationWeeks') return;
    if (answers?.programDurationWeeks) return;
    setAnswers((prev) => ({ ...prev, programDurationWeeks: 'auto' }));
  }, [isOpen, question?.id, step, answers?.programDurationWeeks]);

  const stats = useMemo(() => computeCompletion(answers), [answers]);
  const progressPercent = activeQuestions.length
    ? Math.round(((step + 1) / activeQuestions.length) * 100)
    : 0;
  const canContinue = useMemo(() => {
    const q = activeQuestions[step];
    if (!q) return false;
    if (q.type === 'vitals' || q.type === 'strengthBaselines') return true;
    if (q.type === 'existingProgram') {
      const v = answers?.[q.id];
      if (!v || v.hasProgram === 'no') return true;
      if (v.hasProgram === 'yes' && v.programId) return true;
      return false;
    }
    const value = answers?.[q.id];
    if (q.optional && (value == null || (Array.isArray(value) && value.length === 0))) {
      return true;
    }
    if (value == null) return false;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  }, [step, answers, activeQuestions]);

  const persistAndClose = async (nextAnswers, { completeWizard = true } = {}) => {
    setSaving(true);
    try {
      await saveAnswers(nextAnswers, { completeWizard });
      onClose?.();
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    await persistAndClose(answers, { completeWizard: false });
  };

  const handleSkipAll = async () => {
    setSaving(true);
    try {
      await markSkipped();
      onClose?.();
    } finally {
      setSaving(false);
    }
  };

  const handleContinue = async () => {
    if (step < activeQuestions.length - 1) {
      setStep((s) => s + 1);
      return;
    }
    setShowRecap(true);
  };

  const handleConfirmRecap = async () => {
    setSaving(true);
    try {
      const recap = buildQuizCompletionRecap({
        answers,
        snapshot: data,
        programs: programs || [],
        getExerciseNameById,
        garminDailyMetrics: data?.garminData?.dailyMetrics || data?.dailyMetrics || null
      });
      await saveAnswers(answers, {
        completeWizard: true,
        lastCompletionRecap: {
          completedAt: new Date().toISOString(),
          placement: recap.placement,
          hasActivityLogs: recap.hasActivityLogs
        }
      });
      onClose?.();
    } finally {
      setSaving(false);
    }
  };

  const handleSkipQuestion = () => {
    const next = {
      ...answers,
      [question.id]: question.type === 'multi' || question.type === 'days' ? [] : null
    };
    setAnswers(next);
    if (step < activeQuestions.length - 1) {
      setStep((s) => s + 1);
    }
  };

  if (!question && !showRecap) return null;

  const garminDailyMetrics = data?.garminData?.dailyMetrics || data?.dailyMetrics || null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        showRecap
          ? 'Récapitulatif de ton profil'
          : quizWasCompleted
            ? 'Mettre à jour mon profil'
            : 'Remplir mon profil'
      }
      variant="glass"
      size="xl"
      noContentPadding
      contentClassName="p-5 sm:p-6"
      closeOnOverlayClick={false}
    >
      {showRecap ? (
        <div className="space-y-5">
          <QuizCompletionRecap
            answers={answers}
            snapshot={data}
            programs={programs || []}
            getExerciseNameById={getExerciseNameById}
            garminDailyMetrics={garminDailyMetrics}
          />
          <div className="flex flex-wrap justify-between gap-2 border-t border-slate-700/50 pt-4">
            <button
              type="button"
              onClick={() => setShowRecap(false)}
              disabled={saving}
              className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-200"
            >
              Modifier mes réponses
            </button>
            <button
              type="button"
              onClick={handleConfirmRecap}
              disabled={saving}
              className="rounded-lg border border-emerald-500 bg-emerald-600/20 px-4 py-2 text-sm font-medium text-emerald-100"
            >
              {saving ? 'Enregistrement...' : 'Valider mon profil'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-700/60 bg-slate-900/60 p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-xs uppercase tracking-wide text-slate-400">
                {getSectionLabel(question.sectionId)} - question {step + 1}/{activeQuestions.length}
              </div>
              <div className="text-xs text-slate-300">
                {stats.completedCount}/{stats.totalCount} complétées
              </div>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xl font-semibold text-white">{question.title}</h3>
            {question.description ? (
              <p className="text-sm text-slate-400 leading-relaxed">{question.description}</p>
            ) : null}
            <QuestionCard
              question={question}
              value={answers?.[question.id]}
              allAnswers={answers}
              programs={programs || []}
              onSelect={(v) => setAnswers((prev) => ({ ...prev, [question.id]: v }))}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-700/50 pt-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0 || saving}
                className="rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-200 disabled:opacity-50"
              >
                Dos
              </button>
              <button
                type="button"
                onClick={handleSkipQuestion}
                disabled={saving || question.type === 'existingProgram'}
                className="rounded-lg border border-amber-700/70 px-3 py-2 text-sm text-amber-200 disabled:opacity-40"
              >
                Passer cette question
              </button>
            </div>
            <div className="flex gap-2">
              {quizWasCompleted ? (
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={saving}
                  className="rounded-lg border border-cyan-600/70 px-3 py-2 text-sm text-cyan-100"
                >
                  {saving ? 'Sauvegarde...' : 'Sauvegarder et quitter'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSkipAll}
                  disabled={saving}
                  className="rounded-lg border border-red-700/70 px-3 py-2 text-sm text-red-200"
                >
                  Passer le quiz
                </button>
              )}
              <button
                type="button"
                onClick={handleContinue}
                disabled={!canContinue || saving}
                className="rounded-lg border border-emerald-500 bg-emerald-600/20 px-4 py-2 text-sm font-medium text-emerald-100 disabled:opacity-40"
              >
                {saving ? 'Sauvegarde...' : step === activeQuestions.length - 1 ? 'Voir mon récap' : 'Continuer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export const registerProfileQuestionnaireOpenHandler = (openFn) => {
  const handler = () => openFn();
  window.addEventListener(ONBOARDING_OPEN_EVENT, handler);
  return () => window.removeEventListener(ONBOARDING_OPEN_EVENT, handler);
};

export default ProfileQuestionnaireModal;

