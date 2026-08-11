/** Titre lisible à partir du nom de fichier vidéo (sans extension). */
export function titleFromVideoFilename(filename) {
  if (!filename) return '';
  const base = String(filename).replace(/\.[^./\\]+$/, '');
  return base
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function fileIdentity(file) {
  return `${file.name}::${file.size}::${file.lastModified}`;
}

/** @returns {{ id: string, file: File, title: string, categoryIds: string[] }} */
export function createUploadQueueItem(file, defaultCategoryIds = []) {
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `vq-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    file,
    title: titleFromVideoFilename(file.name),
    categoryIds: [...defaultCategoryIds]
  };
}

/**
 * Ajoute des fichiers à la file sans doublons (nom + taille + lastModified).
 * @param {Array<{ id: string, file: File }>} existingQueue
 */
export function mergeFilesIntoQueue(existingQueue, files, defaultCategoryIds = []) {
  const seen = new Set((existingQueue || []).map((item) => fileIdentity(item.file)));
  const added = [];
  for (const file of files || []) {
    if (!file) continue;
    const key = fileIdentity(file);
    if (seen.has(key)) continue;
    seen.add(key);
    added.push(createUploadQueueItem(file, defaultCategoryIds));
  }
  return [...(existingQueue || []), ...added];
}

/** Bascule une catégorie sur chaque élément ciblé. */
export function toggleCategoryOnQueueItems(items, categoryId) {
  return items.map((item) => {
    const has = item.categoryIds.includes(categoryId);
    return {
      ...item,
      categoryIds: has
        ? item.categoryIds.filter((id) => id !== categoryId)
        : [...item.categoryIds, categoryId]
    };
  });
}
