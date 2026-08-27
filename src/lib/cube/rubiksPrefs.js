const KEY = 'momentum.rubiks.prefs';
export const RUBIKS_PREFS_EVENT = 'momentum-rubiks-prefs';

export const PLAY_SPEEDS = [0.5, 0.75, 1, 1.5, 2, 3];

export const DEFAULT_RUBIKS_PREFS = {
  notationMode: 'both',
  playSpeed: 1
};

export function loadRubiksPrefs() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_RUBIKS_PREFS };
    const parsed = JSON.parse(raw);
    const notationMode = ['wca', 'plain', 'both'].includes(parsed.notationMode)
      ? parsed.notationMode
      : 'both';
    const playSpeed = PLAY_SPEEDS.includes(Number(parsed.playSpeed)) ? Number(parsed.playSpeed) : 1;
    return { ...DEFAULT_RUBIKS_PREFS, ...parsed, notationMode, playSpeed };
  } catch {
    return { ...DEFAULT_RUBIKS_PREFS };
  }
}

export function turnDurationMs(playSpeed) {
  const s = Number(playSpeed) || 1;
  return Math.round(320 / s);
}

export function saveRubiksPrefs(next) {
  const merged = { ...loadRubiksPrefs(), ...next };
  try {
    localStorage.setItem(KEY, JSON.stringify(merged));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(RUBIKS_PREFS_EVENT, { detail: merged }));
  return merged;
}
