import React, { useMemo } from 'react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import { settingsTheme as S } from '../settingsThemeClasses';
import { ONBOARDING_OPEN_EVENT, PROFILE_QUESTION_DEFS } from '../../../../features/profileQuestionnaire/constants';
import { normalizeProfileQuestionnaire } from '../../../../features/profileQuestionnaire/schema';
import {
  buildQuizPrefillPayload,
  openProgramCreationFromQuiz,
  PENDING_QUIZ_PREFILL_NUTRITION_KEY,
  writePendingQuizPrefill,
} from '../../../../features/profileQuestionnaire/prefill';
import { useProfileQuestionnaire } from '../../../../features/profileQuestionnaire/useProfileQuestionnaire';

function summarizeAnswer(questionMap, answers, questionId) {
  const q = questionMap[questionId];
  const raw = answers?.[questionId];
  if (!q || raw == null) return '';
  if (Array.isArray(raw)) {
    if (raw.length === 0) return '';
    if (q.type === 'days') return raw.join(' · ');
    const optionsMap = new Map((q.options || []).map((opt) => [String(opt.key), opt.label]));
    return raw.map((x) => optionsMap.get(String(x)) || String(x)).join(' · ');
  }
  if (q.type === 'vitals' && typeof raw === 'object' && !Array.isArray(raw)) {
    const bits = [];
    if (raw.heightCm != null) bits.push(`${raw.heightCm} cm`);
    if (raw.weightKg != null) bits.push(`${raw.weightKg} kg`);
    return bits.join(' · ');
  }
  const option = (q.options || []).find((opt) => String(opt.key) === String(raw));
  return option?.label || String(raw);
}

const ProfileQuizSettings = ({ currentUser, setActiveTab }) => {
  const { snoozeQuizReminder } = useProfileQuestionnaire();

  const profileQuestionnaire = normalizeProfileQuestionnaire(currentUser?.profileQuestionnaire || null);
  const answers = profileQuestionnaire?.answers || {};
  const questionMap = useMemo(
    () => PROFILE_QUESTION_DEFS.reduce((acc, q) => {
      acc[q.id] = q;
      return acc;
    }, {}),
    []
  );

  const quizStarted = profileQuestionnaire.completedCount > 0;
  const total = profileQuestionnaire.totalCount || 1;
  const pct = Math.round((profileQuestionnaire.completedCount / total) * 100);
  const score = profileQuestionnaire.lastCompletionRecap?.placement?.score0to100;
  const monthsOld = useMemo(() => {
    const done = profileQuestionnaire.onboardingWizardCompletedAt;
    if (!done) return false;
    const snoozeUntil = profileQuestionnaire.quizReminderSnoozeUntil;
    if (snoozeUntil && new Date(snoozeUntil) > new Date()) return false;
    const t = new Date(done).getTime();
    return Number.isFinite(t) && Date.now() - t > 90 * 86400000;
  }, [profileQuestionnaire.onboardingWizardCompletedAt, profileQuestionnaire.quizReminderSnoozeUntil]);

  const chips = [
    summarizeAnswer(questionMap, answers, 'vitalsSelfReport'),
    summarizeAnswer(questionMap, answers, 'goalPhysique')
      ? `Objectif : ${summarizeAnswer(questionMap, answers, 'goalPhysique')}`
      : '',
    summarizeAnswer(questionMap, answers, 'availableTrainingDays'),
    summarizeAnswer(questionMap, answers, 'preferredSessionDuration'),
  ].filter(Boolean);

  const openQuiz = () => window.dispatchEvent(new Event(ONBOARDING_OPEN_EVENT));
  const summary = !quizStarted
    ? 'Le quiz aligne programmes, nutrition et récap sur ton profil.'
    : score != null
      ? `Quiz onboarding — dernier bilan ${score}/100${monthsOld ? ', il y a plus de 3 mois' : ''}`
      : `Quiz onboarding — ${profileQuestionnaire.completedCount}/${profileQuestionnaire.totalCount} réponses`;

  return (
    <Card variant="settings">
      <CardHeader variant="settings">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle tone="settings" className="normal-case tracking-normal">
              Quiz
            </CardTitle>
            <p className={`text-xs leading-relaxed ${S.muted}`}>{summary}</p>
          </div>
          <button type="button" onClick={openQuiz} className={`${S.btnSm} shrink-0`}>
            {quizStarted ? 'Reprendre le quiz' : 'Démarrer le quiz'}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div id="settings-profil-quiz" className="scroll-mt-28 space-y-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full"
              style={{ width: `${quizStarted ? pct : 0}%`, background: 'var(--st-accent)' }}
            />
          </div>
          {chips.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {chips.map((chip) => (
                <span
                  key={chip}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-zinc-300"
                >
                  {chip}
                </span>
              ))}
            </div>
          )}
          {quizStarted && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`${S.btnSecondary} text-xs`}
                onClick={() => openProgramCreationFromQuiz(currentUser?.profileQuestionnaire, { setActiveTab })}
              >
                Générer entraînement
              </button>
              <button
                type="button"
                className={`${S.btnSecondary} text-xs`}
                onClick={() => {
                  writePendingQuizPrefill(
                    PENDING_QUIZ_PREFILL_NUTRITION_KEY,
                    buildQuizPrefillPayload(currentUser?.profileQuestionnaire || null)
                  );
                  if (setActiveTab) setActiveTab('nutrition');
                }}
              >
                Générer nutrition
              </button>
              {monthsOld && (
                <button
                  type="button"
                  className={`${S.btnSecondary} text-xs`}
                  onClick={() => snoozeQuizReminder()}
                >
                  Rappeler dans 3 mois
                </button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileQuizSettings;
