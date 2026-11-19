/**
 * Politique de fusion à trois versions, isolée du pipeline de sauvegarde.
 * Une clé absente d'un patch n'a pas été touchée.
 * Une suppression est la valeur { deleted: true }, jamais une absence.
 */

export function isTombstone(value) {
  return Boolean(value) && typeof value === 'object' && value.deleted === true;
}

export function sameValue(a, b) {
  if (Object.is(a, b)) return true;
  if (isTombstone(a) && isTombstone(b)) return true;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

/**
 * @param {{ baseHas: boolean, base: unknown, localHas: boolean, local: unknown, remoteHas: boolean, remote: unknown }} sides
 */
export function mergeKey(sides) {
  const { baseHas, base, localHas, local, remoteHas, remote } = sides;
  const baseValue = baseHas ? base : undefined;
  const remoteValue = remoteHas ? remote : undefined;
  const remoteTouched = remoteHas ? !sameValue(remoteValue, baseValue) : baseHas;

  if (!localHas && !remoteTouched) {
    return { status: 'unchanged', value: remoteValue };
  }
  if (!localHas && remoteTouched) {
    return { status: 'take-remote', value: remoteValue };
  }

  const localValue = local;
  if (isTombstone(localValue) && !remoteHas) {
    return { status: 'convergent', value: localValue };
  }
  if (sameValue(localValue, remoteValue)) {
    return { status: 'convergent', value: localValue };
  }
  if (!remoteTouched) {
    return { status: 'take-local', value: localValue };
  }
  if (sameValue(localValue, baseValue)) {
    return { status: 'take-remote', value: remoteValue };
  }
  return {
    status: 'conflict',
    base: baseValue,
    local: localValue,
    remote: remoteValue
  };
}

/**
 * Le patch local ne contient que les clés touchées.
 * remoteMap est l'état canonique complet lu dans la transaction.
 * Une clé présente dans la base et absente du canonique est une suppression distante.
 */
export function mergePatch({ baseMap, localPatch, remoteMap, groups = null }) {
  const remote = remoteMap && typeof remoteMap === 'object' ? remoteMap : {};
  const base = baseMap && typeof baseMap === 'object' ? baseMap : {};
  const patch = localPatch && typeof localPatch === 'object' ? localPatch : {};
  const next = { ...remote };
  const conflicts = [];

  const keys = Object.keys(patch);
  const grouped = new Map();
  if (groups) {
    for (const key of keys) {
      const group = groups(key) || key;
      if (!grouped.has(group)) grouped.set(group, []);
      grouped.get(group).push(key);
    }
  }

  const rejected = new Set();
  if (groups) {
    for (const members of grouped.values()) {
      const memberConflicts = members.filter((key) => {
        const result = mergeKey({
          baseHas: Object.prototype.hasOwnProperty.call(base, key),
          base: base[key],
          localHas: true,
          local: patch[key],
          remoteHas: Object.prototype.hasOwnProperty.call(remote, key),
          remote: remote[key]
        });
        return result.status === 'conflict';
      });
      if (memberConflicts.length > 0) {
        for (const key of members) rejected.add(key);
      }
    }
  }

  for (const key of keys) {
    const result = mergeKey({
      baseHas: Object.prototype.hasOwnProperty.call(base, key),
      base: base[key],
      localHas: true,
      local: patch[key],
      remoteHas: Object.prototype.hasOwnProperty.call(remote, key),
      remote: remote[key]
    });
    if (rejected.has(key) || result.status === 'conflict') {
      conflicts.push({ key, ...(result.status === 'conflict' ? result : { status: 'conflict-group', local: patch[key] }) });
      continue;
    }
    if (isTombstone(result.value)) delete next[key];
    else next[key] = result.value;
  }

  return {
    status: conflicts.length > 0 ? 'conflict' : 'ok',
    next,
    conflicts,
    draftKept: conflicts.length > 0
  };
}

/** Une confirmation de génération G ne retire que les brouillons <= G. */
export function retainNewerDrafts(records, confirmedGeneration) {
  const kept = {};
  for (const [id, record] of Object.entries(records || {})) {
    if (Number(record?.generation) > confirmedGeneration) kept[id] = record;
  }
  return kept;
}

/** Union par identifiant. Corps différent sur le même id = conflit, pas de doublon. */
export function mergeEntriesById(remoteList, localList) {
  const remote = Array.isArray(remoteList) ? remoteList : [];
  const local = Array.isArray(localList) ? localList : [];
  const byId = new Map();
  const conflicts = [];
  for (const entry of remote) {
    if (entry && entry.id != null) byId.set(String(entry.id), entry);
  }
  for (const entry of local) {
    if (!entry || entry.id == null) {
      conflicts.push({ reason: 'missing-id', entry });
      continue;
    }
    const id = String(entry.id);
    const existing = byId.get(id);
    if (!existing) {
      byId.set(id, entry);
      continue;
    }
    if (!sameValue(existing, entry)) conflicts.push({ reason: 'same-id-different-body', id, remote: existing, local: entry });
  }
  return {
    status: conflicts.length > 0 ? 'conflict' : 'ok',
    entries: [...byId.values()],
    conflicts
  };
}
