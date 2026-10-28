/**
 * Fonds d’écran statiques de l’app = images choisies dans
 * « Gérer les fonds d’écran » (flag useAsAppStatic), pas un catalogue forcé.
 */

const STORAGE_KEY = 'momentum_app_static_backgrounds_v1';
const EVENT = 'momentum:app-static-backgrounds';

function readRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** @returns {{ id: string, name: string, src: string, thumb?: string }[]} */
export function listAppStaticBackgroundEntries() {
  const raw = readRaw();
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item) => item && typeof item === 'object' && item.id && item.src)
    .map((item) => ({
      id: String(item.id),
      name: String(item.name || item.id),
      src: String(item.src),
      thumb: item.thumb ? String(item.thumb) : String(item.src),
    }));
}

export function upsertAppStaticBackground(entry) {
  if (!entry?.id || !entry?.src) return listAppStaticBackgroundEntries();
  const id = String(entry.id).startsWith('user-static:')
    ? String(entry.id)
    : `user-static:${entry.id}`;
  const nextEntry = {
    id,
    name: entry.name || 'Fond statique',
    src: entry.src,
    thumb: entry.thumb || entry.src,
  };
  const prev = listAppStaticBackgroundEntries().filter((item) => item.id !== id);
  const next = [...prev, nextEntry];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: next }));
  return next;
}

export function removeAppStaticBackground(id) {
  const key = String(id || '');
  const next = listAppStaticBackgroundEntries().filter(
    (item) => item.id !== key && item.id !== `user-static:${key}`
  );
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: next }));
  return next;
}

export function subscribeAppStaticBackgrounds(listener) {
  const onCustom = (event) => listener(event.detail || listAppStaticBackgroundEntries());
  const onStorage = (event) => {
    if (event.key === STORAGE_KEY) listener(listAppStaticBackgroundEntries());
  };
  window.addEventListener(EVENT, onCustom);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(EVENT, onCustom);
    window.removeEventListener('storage', onStorage);
  };
}

export function isUserStaticBackgroundId(id) {
  return typeof id === 'string' && id.startsWith('user-static:');
}
