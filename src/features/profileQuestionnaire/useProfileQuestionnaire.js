import { useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { QUESTIONNAIRE_STORAGE_FIELD } from './constants';
import { normalizeProfileQuestionnaire } from './schema';

export const useProfileQuestionnaire = () => {
  const { currentUser, updateProfile } = useAuth();

  const questionnaire = useMemo(() => {
    return normalizeProfileQuestionnaire(currentUser?.[QUESTIONNAIRE_STORAGE_FIELD] || null);
  }, [currentUser]);

  const saveAnswers = useCallback(
    async (partialAnswers) => {
      if (!currentUser?.id) return { success: false, error: 'NO_USER' };
      const merged = normalizeProfileQuestionnaire({
        ...questionnaire,
        lastUpdatedAt: new Date().toISOString(),
        answers: {
          ...(questionnaire?.answers || {}),
          ...(partialAnswers || {})
        }
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

  return {
    questionnaire,
    saveAnswers,
    markSkipped
  };
};

