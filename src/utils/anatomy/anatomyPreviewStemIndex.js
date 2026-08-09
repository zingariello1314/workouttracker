/**
 * Index des .webp réellement servis sous /anatomy-previews/ (évite les 404 en masse).
 */

let stemSet = null;
let loadPromise = null;

function baseUrl() {
  const prefix =
    typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL != null
      ? import.meta.env.BASE_URL
      : '/';
  return prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
}

export function getAnatomyPreviewIndexUrl() {
  return `${baseUrl()}/anatomy-previews/index.json`;
}

/** @returns {Promise<Set<string>>} */
export function loadAnatomyPreviewStemSet() {
  if (stemSet) return Promise.resolve(stemSet);
  if (!loadPromise) {
    loadPromise = fetch(getAnatomyPreviewIndexUrl(), { cache: 'force-cache' })
      .then((r) => (r.ok ? r.json() : { stems: [] }))
      .then((json) => {
        const stems = Array.isArray(json?.stems) ? json.stems : [];
        stemSet = new Set(stems.map(String));
        return stemSet;
      })
      .catch(() => {
        stemSet = new Set();
        return stemSet;
      });
  }
  return loadPromise;
}

export function peekAnatomyPreviewStemSet() {
  return stemSet;
}

export function anatomyPreviewStemHasFile(stem) {
  if (!stem) return false;
  if (stemSet) return stemSet.has(stem);
  return false;
}
