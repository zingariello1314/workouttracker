import { useMemo } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import { mergeAddictionQuitData, calculateAddictionQuitXP } from '../utils/addictionQuitSessionsXp';

export function useAddictionQuitXP() {
  const { data } = useWorkout();

  return useMemo(() => {
    const aq = mergeAddictionQuitData(data?.addictionQuitData);
    return calculateAddictionQuitXP(aq, Date.now());
  }, [data?.addictionQuitData]);
}
