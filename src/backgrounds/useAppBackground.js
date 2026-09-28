import { useEffect, useState } from 'react';
import { useWorkout } from '../context/WorkoutContext';
import {
  getAppBackgroundPreference,
  resolveActiveBackgroundId,
  setAppBackgroundId,
  subscribeAppBackground,
  updateAppBackgroundPreference,
  APP_BACKGROUND_STORAGE_KEY,
} from './appBackgroundPreference';
import { getBackgroundOption } from './backgroundRegistry';

export function useAppBackground() {
  const { activeTab } = useWorkout();
  const [preference, setPreference] = useState(getAppBackgroundPreference);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const unsubscribe = subscribeAppBackground((next) => {
      setPreference(next);
      setRevision((value) => value + 1);
    });
    const onStorage = (event) => {
      if (event.key === APP_BACKGROUND_STORAGE_KEY) {
        setPreference(getAppBackgroundPreference());
        setRevision((value) => value + 1);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => {
      unsubscribe();
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const id = resolveActiveBackgroundId(activeTab);
  const option = getBackgroundOption(id);

  return {
    id: option.id,
    option,
    preference,
    revision,
    setBackgroundId: setAppBackgroundId,
    updatePreference: updateAppBackgroundPreference,
  };
}
