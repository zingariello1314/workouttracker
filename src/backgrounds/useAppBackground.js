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
    const apply = (next) => {
      setPreference(next && typeof next === 'object' ? next : getAppBackgroundPreference());
      setRevision((value) => value + 1);
    };
    const unsubscribe = subscribeAppBackground(apply);
    const onStorage = (event) => {
      if (event.key === APP_BACKGROUND_STORAGE_KEY) apply(getAppBackgroundPreference());
    };
    const onSameTab = (event) => apply(event.detail);
    window.addEventListener('storage', onStorage);
    window.addEventListener('momentum:app-background', onSameTab);
    return () => {
      unsubscribe();
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('momentum:app-background', onSameTab);
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
