import { useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { QUESTIONNAIRE_STORAGE_FIELD } from './constants';
import {
  normalizeProfileQuestionnaire,
  sanitizeAnswersPayload,
  sanitizeLastCompletionRecap
} from './schema';

export const useProfileQuestionnaire = () => {
  const { currentUser, updateProfile } = useAuth();

  const questionnaire = useMemo(() => {
    return normalizeProfileQuestionnaire(currentUser?.[QUESTIONNAIRE_STORAGE_FIELD] || null);
  }, [currentUser]);

  const saveAnswers = useCallback(
    async (partialAnswers, opts = {}) => {
      if (!currentUser?.id) return { success: false, error: 'NO_USER' };
      const nowIso = new Date().toISOString();
      let quizRoundHistory = Array.isArray(questionnaire.quizRoundHistory)
        ? [...questionnaire.quizRoundHistory]
        : [];
      if (opts.completeWizard && questionnaire.onboardingWizardCompletedAt) {
        quizRoundHistory.push({
          completedAt: questionnaire.lastUpdatedAt || nowIso,
          version: questionnaire.version,
          answers: sanitizeAnswersPayload(questionnaire.answers),
          completionSnapshot: {
            completedCount: questionnaire.completedCount,
            totalCount: questionnaire.totalCount
          }
        });
        quizRoundHistory = quizRoundHistory.slice(-10);
      }
      const merged = normalizeProfileQuestionnaire({
        ...questionnaire,
        quizRoundHistory,
        lastUpdatedAt: nowIso,
        ...(opts.completeWizard ? { onboardingWizardCompletedAt: nowIso } : {}),
        ...(opts.lastCompletionRecap != null
          ? { lastCompletionRecap: sanitizeLastCompletionRecap(opts.lastCompletionRecap) }
          : {}),
        answers: sanitizeAnswersPayload({
          ...(questionnaire?.answers || {}),
          ...(partialAnswers || {})
        })
      });
      return updateProfile({
        [QUESTIONNAIRE_STORAGE_FIELD]: merged
      });
    },
    [currentUser?.id, questionnaire, updateProfile]
  );

  const markSkipped = useCallback(async () => {
    if (!currentUser?.id) return { success: false, error: 'NO_USER' };
    const next = normalizeProfileQuestionnaire({
      ...questionnaire,
      onboardingSkippedAt: new Date().toISOString(),
      lastUpdatedAt: new Date().toISOString()
    });
    return updateProfile({
      [QUESTIONNAIRE_STORAGE_FIELD]: next
    });
  }, [currentUser?.id, questionnaire, updateProfile]);

  const snoozeQuizReminder = useCallback(async () => {
    if (!currentUser?.id) return { success: false, error: 'NO_USER' };
    const until = new Date();
    until.setMonth(until.getMonth() + 3);
    const merged = normalizeProfileQuestionnaire({
      ...questionnaire,
      quizReminderSnoozeUntil: until.toISOString(),
      lastUpdatedAt: new Date().toISOString()
    });
    return updateProfile({
      [QUESTIONNAIRE_STORAGE_FIELD]: merged
    });
  }, [currentUser?.id, questionnaire, updateProfile]);

  const removeQuizHistoryEntry = useCallback(
    async (completedAt) => {
      if (!currentUser?.id || !completedAt) return { success: false, error: 'INVALID' };
      const filtered = (Array.isArray(questionnaire.quizRoundHistory) ? questionnaire.quizRoundHistory : []).filter(
        (row) => row.completedAt !== completedAt
      );
      const merged = normalizeProfileQuestionnaire({
        ...questionnaire,
        quizRoundHistory: filtered,
        lastUpdatedAt: new Date().toISOString()
      });
      return updateProfile({
        [QUESTIONNAIRE_STORAGE_FIELD]: merged
      });
    },
    [currentUser?.id, questionnaire, updateProfile]
  );

  return {
    questionnaire,
    saveAnswers,
    markSkipped,
    snoozeQuizReminder,
    removeQuizHistoryEntry
  };
};

