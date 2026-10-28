/**
 * Préférences d’affichage de la carte profil (sidebar).
 * Stockées en localStorage, par utilisateur si possible.
 */

const STORAGE_KEY = 'momentum_profile_card_display_v1';
const EVENT = 'momentum:profile-card-display';

export const DEFAULT_PROFILE_CARD_DISPLAY = {
  showHandle: true,
  showTitle: true,
  /** 'top' | 'bottom' */
  handlePosition: 'bottom',
  /** 'top' | 'bottom' */
  titlePosition: 'top',
};

function readRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getProfileCardDisplayPreference() {
  const raw = readRaw();
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_PROFILE_CARD_DISPLAY };
  return {
    showHandle: raw.showHandle !== false,
    showTitle: raw.showTitle !== false,
    handlePosition: raw.handlePosition === 'top' ? 'top' : 'bottom',
    titlePosition: raw.titlePosition === 'bottom' ? 'bottom' : 'top',
  };
}

export function updateProfileCardDisplayPreference(partial) {
  const next = {
    ...getProfileCardDisplayPreference(),
    ...(partial && typeof partial === 'object' ? partial : {}),
  };
  const normalized = {
    showHandle: next.showHandle !== false,
    showTitle: next.showTitle !== false,
    handlePosition: next.handlePosition === 'top' ? 'top' : 'bottom',
    titlePosition: next.titlePosition === 'bottom' ? 'bottom' : 'top',
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch {
    /* ignore quota */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: normalized }));
  return normalized;
}

export function subscribeProfileCardDisplay(listener) {
  const onCustom = (event) => listener(event.detail || getProfileCardDisplayPreference());
  const onStorage = (event) => {
    if (event.key === STORAGE_KEY) listener(getProfileCardDisplayPreference());
  };
  window.addEventListener(EVENT, onCustom);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(EVENT, onCustom);
    window.removeEventListener('storage', onStorage);
  };
}
