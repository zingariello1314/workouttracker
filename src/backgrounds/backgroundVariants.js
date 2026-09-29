/**
 * Fonds créés par l'utilisateur. Jamais le même id qu'un fond d'origine :
 * enregistrer ajoute une entrée, ça n'écrase pas Saturne, le disque, ni Momentum.
 */

const STORAGE_KEY = 'momentum.backgroundVariants';
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

function newId() {
  const rand = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return `variant-${rand}`;
}

export function listVariants() {
  return readAll().filter((item) => item && typeof item.id === 'string' && item.id.startsWith('variant-'));
}

export function getVariant(id) {
  return listVariants().find((item) => item.id === id) || null;
}

export function variantNameTaken(name) {
  const key = String(name || '').trim().toLocaleLowerCase('fr');
  if (!key) return false;
  return listVariants().some((item) => String(item.name || '').trim().toLocaleLowerCase('fr') === key);
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

export function removeVariant(id) {
  if (!String(id || '').startsWith('variant-')) return false;
  const next = listVariants().filter((item) => item.id !== id);
  writeAll(next);
  return true;
}

export function subscribeVariants(listener) {
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
