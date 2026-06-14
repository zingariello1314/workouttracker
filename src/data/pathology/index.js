import { pathologyRunning } from './pathologyRunning';
import { pathologyStrength } from './pathologyStrength';
import { pathologyMeta } from './pathologyMeta';
import { exerciseDatabase } from '../exerciseDatabase';
import { getStretchByKey } from '../stretchDatabase';

export { PATHOLOGY_SPORTS, PATHOLOGY_BODY_ZONES } from './pathologySports';
export { pathologyRunning, pathologyStrength, pathologyMeta };

const ALL_ENTRIES = [...pathologyRunning, ...pathologyStrength, ...pathologyMeta];

const BY_ID = new Map(ALL_ENTRIES.map((e) => [e.id, e]));

export function listPathologies() {
  return [...ALL_ENTRIES].sort((a, b) => {
    const sport = (a.sport || '').localeCompare(b.sport || '');
    if (sport !== 0) return sport;
    return (a.order || 0) - (b.order || 0);
  });
}

export function getPathologyById(id) {
  return BY_ID.get(id) || null;
}

export function listPathologiesBySport(sportId) {
  return listPathologies().filter((e) => e.sport === sportId);
}

export function searchPathologies(query) {
  const q = String(query || '')
    .trim()
    .toLowerCase();
  if (!q) return listPathologies();
  return listPathologies().filter((e) => {
    const hay = [
      e.name,
      e.shortName,
      e.summary,
      ...(e.symptoms || []),
      ...(e.causes || []),
      ...(e.prevention || []),
      ...(e.tags || []),
      ...(e.bulletList || [])
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });
}

/** Résout un item prescription vers la banque exercice / étirement */
export function resolvePathologyItem(item) {
  if (!item) return null;
  if (item.kind === 'text') {
    return { type: 'text', label: item.text, dosage: item.dosage, group: item.group };
  }
  if (item.kind === 'exercise') {
    const ex = exerciseDatabase[item.key];
    return {
      type: 'exercise',
      key: item.key,
      label: ex?.name || item.key,
      dosage: item.dosage,
      group: item.group,
      found: Boolean(ex),
      description: ex?.description
    };
  }
  if (item.kind === 'stretch') {
    const st = getStretchByKey(item.key);
    return {
      type: 'stretch',
      key: item.key,
      label: st?.name || item.key,
      dosage: item.dosage,
      group: item.group,
      found: Boolean(st),
      description: st?.description
    };
  }
  return null;
}

export function flattenPathologyItems(entry) {
  const rows = [];
  if (entry.items?.length) {
    entry.items.forEach((it) => {
      const r = resolvePathologyItem(it);
      if (r) rows.push(r);
    });
  }
  if (entry.sections?.length) {
    entry.sections.forEach((sec) => {
      (sec.items || []).forEach((it) => {
        const r = resolvePathologyItem(it);
        if (r) rows.push({ ...r, group: r.group || sec.title });
      });
    });
  }
  return rows;
}
