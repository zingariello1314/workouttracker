/**
 * Sélection aléatoire espacée pour le feed Shorts :
 * - jamais deux fois la même vidéo d'affilée
 * - intervalle minimum entre deux passages de la même vidéo
 */

/** Nombre minimum d'autres vidéos entre deux passages de la même (si le catalogue le permet). */
export const SHORTS_MIN_OTHER_VIDEOS_BETWEEN_REPEAT = 4;

export function computeMinGapBetweenRepeats(poolSize) {
  if (poolSize <= 1) return 0;
  if (poolSize === 2) return 1;
  return Math.min(poolSize - 1, SHORTS_MIN_OTHER_VIDEOS_BETWEEN_REPEAT);
}

export function pickNextVideoSpaced(pool, recentIds, minGap) {
  if (!pool.length) return null;

  const lastId = recentIds.length ? recentIds[recentIds.length - 1] : null;
  const banned = new Set();

  if (minGap > 0 && recentIds.length) {
    recentIds.slice(-minGap).forEach((id) => banned.add(id));
  } else if (lastId) {
    banned.add(lastId);
  }

  let candidates = pool.filter((v) => !banned.has(v.id));

  if (!candidates.length && lastId) {
    candidates = pool.filter((v) => v.id !== lastId);
  }
  if (!candidates.length) {
    candidates = pool;
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function buildSpacedFeedBatch(pool, size, recentIds = []) {
  if (!pool.length || size <= 0) {
    return { items: [], recentIds: [...recentIds] };
  }

  const minGap = computeMinGapBetweenRepeats(pool.length);
  const history = [...recentIds];
  const items = [];

  for (let i = 0; i < size; i += 1) {
    const video = pickNextVideoSpaced(pool, history, minGap);
    if (!video) break;
    history.push(video.id);
    items.push({
      key: `${video.id}_${history.length}_${i}_${Math.random().toString(36).slice(2, 7)}`,
      video
    });
  }

  const maxHistory = Math.max(pool.length * 3, 24);
  while (history.length > maxHistory) {
    history.shift();
  }

  return { items, recentIds: history };
}

export function hasConsecutiveDuplicate(items) {
  for (let i = 1; i < items.length; i += 1) {
    if (items[i].video.id === items[i - 1].video.id) return true;
  }
  return false;
}

export function minIndexGapForVideo(items, videoId) {
  const indices = items
    .map((item, idx) => (item.video.id === videoId ? idx : -1))
    .filter((idx) => idx >= 0);
  if (indices.length < 2) return Infinity;
  let minGap = Infinity;
  for (let i = 1; i < indices.length; i += 1) {
    minGap = Math.min(minGap, indices[i] - indices[i - 1]);
  }
  return minGap;
}
