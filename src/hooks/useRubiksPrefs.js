import { useEffect, useState } from 'react';
import { RUBIKS_PREFS_EVENT, loadRubiksPrefs, saveRubiksPrefs } from '../lib/cube/rubiksPrefs';

export function useRubiksPrefs() {
  const [prefs, setPrefs] = useState(() => loadRubiksPrefs());

  useEffect(() => {
    const sync = (e) => setPrefs(e.detail || loadRubiksPrefs());
    const onStorage = (e) => {
      if (e.key === 'momentum.rubiks.prefs') setPrefs(loadRubiksPrefs());
    };
    window.addEventListener(RUBIKS_PREFS_EVENT, sync);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(RUBIKS_PREFS_EVENT, sync);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const update = (patch) => setPrefs(saveRubiksPrefs(patch));
  return [prefs, update];
}
