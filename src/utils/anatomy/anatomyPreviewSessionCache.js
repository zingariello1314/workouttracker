/**
 * Cache session (data URL) des aperçus capturés ou chargés — scroll sans re-fetch WebGL.
 */

const cache = new Map();
const listeners = new Set();

export function getSessionPreviewUrl(stem) {
  if (!stem) return null;
  return cache.get(stem) || null;
}

export function setSessionPreviewUrl(stem, url) {
  if (!stem || !url) return;
  if (cache.get(stem) === url) return;
  cache.set(stem, url);
  listeners.forEach((fn) => {
    try {
      fn(stem);
    } catch {
      /* ignore */
    }
  });
}

export function subscribeSessionPreviewCache(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
