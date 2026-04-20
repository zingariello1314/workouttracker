import { useCallback, useEffect, useState } from 'react';
import {
  loadReadingDayFeedbacks,
  saveReadingDayFeedbacks,
} from '../utils/readingDayFeedbacksStorage';

export function useReadingDayFeedbacks() {
  const [dayFeedbacks, setDayFeedbacksState] = useState(() => loadReadingDayFeedbacks());

  useEffect(() => {
    saveReadingDayFeedbacks(dayFeedbacks);
  }, [dayFeedbacks]);

  const setDayFeedback = useCallback((dateStr, partial) => {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return;
    setDayFeedbacksState((prev) => ({
      ...prev,
      [dateStr]: {
        ...(prev[dateStr] || {}),
        ...partial,
        updatedAt: new Date().toISOString(),
      },
    }));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('reading-day-feedbacks-updated'));
    }
  }, []);

  const removeDayFeedback = useCallback((dateStr) => {
    setDayFeedbacksState((prev) => {
      const next = { ...prev };
      delete next[dateStr];
      return next;
    });
  }, []);

  return { dayFeedbacks, setDayFeedback, removeDayFeedback, setDayFeedbacksState };
}
