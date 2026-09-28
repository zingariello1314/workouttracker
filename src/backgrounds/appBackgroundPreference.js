import {
  DEFAULT_BACKGROUND_ID,
  getBackgroundOption,
  isKnownBackgroundId,
} from './backgroundRegistry';
import { backgroundTargetForTab } from './backgroundTargets';

export const APP_BACKGROUND_STORAGE_KEY = 'momentum.appBackgroundId';

const listeners = new Set();
let rotateIndex = 0;
let timer = null;
let timerKey = '';

function defaultPreference() {
  return {
    mode: 'single',
    singleId: DEFAULT_BACKGROUND_ID,
    rotateIds: [DEFAULT_BACKGROUND_ID],
    rotateEverySec: 60,
    perTab: {},
  };
}

function knownId(id) {
  return isKnownBackgroundId(id) ? id : DEFAULT_BACKGROUND_ID;
}

function normalize(raw) {
  const base = defaultPreference();
  if (!raw || typeof raw !== 'object') return base;
  const mode = raw.mode === 'rotate' || raw.mode === 'perTab' ? raw.mode : 'single';
  const rotateIds = Array.isArray(raw.rotateIds)
    ? raw.rotateIds.filter((id) => isKnownBackgroundId(id))
    : [];
  const perTab = {};
  if (raw.perTab && typeof raw.perTab === 'object') {
    for (const [key, value] of Object.entries(raw.perTab)) {
      if (isKnownBackgroundId(value)) perTab[key] = value;
    }
  }
  const every = Number(raw.rotateEverySec);
  return {
    mode,
    singleId: knownId(raw.singleId),
    rotateIds: rotateIds.length ? rotateIds : [knownId(raw.singleId)],
    rotateEverySec: [15, 30, 60, 300, 900].includes(every) ? every : 60,
    perTab,
  };
}

function readRaw() {
  try {
    return localStorage.getItem(APP_BACKGROUND_STORAGE_KEY);
  } catch {
    return null;
  }
}

function parseStored(raw) {
  if (!raw) return defaultPreference();
  if (raw.startsWith('{')) {
    try {
      return normalize(JSON.parse(raw));
    } catch {
      return defaultPreference();
    }
  }
  return normalize({ mode: 'single', singleId: isKnownBackgroundId(raw) ? raw : DEFAULT_BACKGROUND_ID });
}

export function getAppBackgroundPreference() {
  return parseStored(readRaw());
}

function emit() {
  const preference = getAppBackgroundPreference();
  syncRotateTimer(preference);
  listeners.forEach((listener) => listener(preference));
}

function syncRotateTimer(preference) {
  const ids = preference.mode === 'rotate'
    ? preference.rotateIds.filter((id) => isKnownBackgroundId(id))
    : [];
  const key = ids.length > 1 ? `${preference.rotateEverySec}:${ids.join(',')}` : '';
  if (key === timerKey && (key === '' || timer)) return;
  if (timer) clearInterval(timer);
  timer = null;
  timerKey = key;
  if (!key) {
    rotateIndex = 0;
    return;
  }
  timer = setInterval(() => {
    rotateIndex = (rotateIndex + 1) % ids.length;
    listeners.forEach((listener) => listener(getAppBackgroundPreference()));
  }, preference.rotateEverySec * 1000);
}

export function resolveActiveBackgroundId(activeTab) {
  const preference = getAppBackgroundPreference();
  if (preference.mode === 'rotate') {
    const ids = preference.rotateIds.filter((id) => isKnownBackgroundId(id));
    if (!ids.length) return DEFAULT_BACKGROUND_ID;
    return ids[rotateIndex % ids.length];
  }
  if (preference.mode === 'perTab') {
    const target = backgroundTargetForTab(activeTab);
    const assigned = target ? preference.perTab[target] : null;
    if (isKnownBackgroundId(assigned)) return assigned;
  }
  return knownId(preference.singleId);
}

export function getAppBackgroundId() {
  return resolveActiveBackgroundId(undefined);
}

export function getAppBackgroundOption() {
  return getBackgroundOption(getAppBackgroundId());
}

function writePreference(preference) {
  const next = normalize(preference);
  try {
    localStorage.setItem(APP_BACKGROUND_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* stockage indisponible */
  }
  if (next.mode !== 'rotate') rotateIndex = 0;
  timerKey = '';
  emit();
  return next;
}

export function updateAppBackgroundPreference(patch) {
  return writePreference({ ...getAppBackgroundPreference(), ...patch });
}

export function setAppBackgroundId(id) {
  const next = writePreference({ ...getAppBackgroundPreference(), mode: 'single', singleId: id });
  return next.singleId;
}

export function subscribeAppBackground(listener) {
  listeners.add(listener);
  syncRotateTimer(getAppBackgroundPreference());
  return () => listeners.delete(listener);
}
