/**
 * Fonds créés par l'utilisateur. Jamais le même id qu'un fond d'origine :
 * dériver d'un original crée une entrée ; réenregistrer une copie met à jour celle-ci.
 */

const STORAGE_KEY = 'momentum.backgroundVariants';
const HIDDEN_KEY = 'momentum.backgroundHiddenIds';
const EVENT = 'momentum:background-variants';

function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT));
  }
}

function readHiddenIds() {
  try {
    const raw = localStorage.getItem(HIDDEN_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function writeHiddenIds(ids) {
  localStorage.setItem(HIDDEN_KEY, JSON.stringify(ids));
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT));
  }
}

function newId() {
  const rand =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return `variant-${rand}`;
}

export function listVariants() {
  return readAll().filter(
    (item) => item && typeof item.id === 'string' && item.id.startsWith('variant-')
  );
}

export function getVariant(id) {
  return listVariants().find((item) => item.id === id) || null;
}

export function variantNameTaken(name, exceptId = null) {
  const key = String(name || '').trim().toLocaleLowerCase('fr');
  if (!key) return false;
  return listVariants().some(
    (item) =>
      item.id !== exceptId &&
      String(item.name || '').trim().toLocaleLowerCase('fr') === key
  );
}

export function createVariant({ name, baseId, params }) {
  const label = String(name || '').trim();
  if (!label || !baseId || !params) return null;
  const entry = {
    id: newId(),
    name: label.slice(0, 40),
    baseId,
    params
  };
  writeAll([...listVariants(), entry]);
  return entry;
}

/** Met à jour une copie existante. Ne touche jamais un fond de base. */
export function updateVariant(id, { name, params } = {}) {
  if (!String(id || '').startsWith('variant-')) return null;
  const list = listVariants();
  const index = list.findIndex((item) => item.id === id);
  if (index < 0) return null;
  const prev = list[index];
  let nextName = prev.name;
  if (name != null) {
    const label = String(name).trim();
    if (!label) return null;
    if (variantNameTaken(label, id)) return null;
    nextName = label.slice(0, 40);
  }
  const entry = {
    ...prev,
    name: nextName,
    params: params != null ? params : prev.params
  };
  const next = [...list];
  next[index] = entry;
  writeAll(next);
  return entry;
}

export function removeVariant(id) {
  if (!String(id || '').startsWith('variant-')) return false;
  const next = listVariants().filter((item) => item.id !== id);
  writeAll(next);
  return true;
}

export function listHiddenBackgroundIds() {
  return readHiddenIds();
}

export function isBackgroundHidden(id) {
  return readHiddenIds().includes(id);
}

export function hideBackground(id) {
  if (typeof id !== 'string' || !id) return false;
  const ids = readHiddenIds();
  if (ids.includes(id)) return true;
  writeHiddenIds([...ids, id]);
  return true;
}

export function showBackground(id) {
  const ids = readHiddenIds().filter((item) => item !== id);
  writeHiddenIds(ids);
  return true;
}

export function subscribeVariants(listener) {
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
