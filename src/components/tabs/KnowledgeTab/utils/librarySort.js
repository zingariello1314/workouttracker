/** Aplatit les groupes bibliothèque et trie par date d'import (createdAt). */
export function sortLibraryVideosFlat(groups, sortOrder = 'newest') {
  const byId = new Map();
  for (const group of groups || []) {
    for (const item of group.items || []) {
      if (item?.id) byId.set(item.id, item);
    }
  }
  const items = [...byId.values()];
  const mult = sortOrder === 'oldest' ? 1 : -1;
  items.sort((a, b) => mult * String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
  return items;
}

/** Trie les items dans chaque groupe + ordre des groupes par date d'import. */
export function sortLibraryGroupsByDate(groups, sortOrder = 'newest') {
  const mult = sortOrder === 'oldest' ? 1 : -1;
  const sorted = (groups || []).map((g) => ({
    ...g,
    items: [...(g.items || [])].sort(
      (a, b) => mult * String(a.createdAt || '').localeCompare(String(b.createdAt || ''))
    )
  }));
  sorted.sort((a, b) => {
    const dateA = a.items[0]?.createdAt || '';
    const dateB = b.items[0]?.createdAt || '';
    return mult * String(dateA).localeCompare(String(dateB));
  });
  return sorted;
}
