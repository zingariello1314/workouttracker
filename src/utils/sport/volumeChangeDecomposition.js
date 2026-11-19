/**
 * V = N × A.
 * Contribution de la fréquence : ΔN × (A0 + A1) / 2.
 * Contribution du contenu : ΔA × (N0 + N1) / 2.
 * Les deux contributions somment la variation observée.
 */

export function symmetricDecomposition(before, after) {
  const n0 = Number(before?.sessions);
  const n1 = Number(after?.sessions);
  const r0 = Number(before?.reps);
  const r1 = Number(after?.reps);
  if (![n0, n1, r0, r1].every((n) => Number.isFinite(n)) || n0 <= 0 || n1 <= 0) {
    return { ok: false, reason: 'missing_strength_days' };
  }
  const a0 = r0 / n0;
  const a1 = r1 / n1;
  const frequency = (n1 - n0) * ((a0 + a1) / 2);
  const content = (a1 - a0) * ((n0 + n1) / 2);
  const observed = r1 - r0;
  const residual = observed - (frequency + content);
  return {
    ok: true,
    sessionsBefore: n0,
    sessionsAfter: n1,
    repsPerSessionBefore: a0,
    repsPerSessionAfter: a1,
    frequency,
    content,
    observed,
    residual,
    frequencyPct: n0 ? ((n1 - n0) / n0) * 100 : null,
    contentPct: a0 ? ((a1 - a0) / a0) * 100 : null,
    volumePct: r0 ? (observed / Math.abs(r0)) * 100 : null
  };
}

function labelFor(id, names, duplicateNames) {
  const name = names?.[id];
  if (!name || /^un mouvement$/i.test(name) || /^exercice clé$/i.test(name)) return null;
  if (duplicateNames.has(name)) return `${name} (${id})`;
  return name;
}

/**
 * Compare les exercices réellement présents. Les répétitions communes,
 * ajoutées et retirées somment la variation totale.
 */
export function decomposeExerciseMix(beforeById = {}, afterById = {}, names = {}) {
  const ids = new Set([...Object.keys(beforeById || {}), ...Object.keys(afterById || {})]);
  const nameCount = new Map();
  ids.forEach((id) => {
    const name = names?.[id];
    if (name) nameCount.set(name, (nameCount.get(name) || 0) + 1);
  });
  const duplicateNames = new Set([...nameCount.entries()].filter(([, n]) => n > 1).map(([name]) => name));
  let common = 0;
  let added = 0;
  let removed = 0;
  const movers = [];
  ids.forEach((id) => {
    const b = Number(beforeById[id]) || 0;
    const a = Number(afterById[id]) || 0;
    if (b > 0 && a > 0) common += a - b;
    else if (a > 0 && b <= 0) added += a;
    else if (b > 0 && a <= 0) removed += b;
    if (Math.abs(a - b) >= 1) {
      movers.push({
        id,
        name: labelFor(id, names, duplicateNames),
        before: b,
        after: a,
        delta: a - b,
        status: b > 0 && a > 0 ? 'common' : a > 0 ? 'added' : 'removed'
      });
    }
  });
  movers.sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta));
  const explained = movers.filter((row) => row.name).reduce((sum, row) => sum + row.delta, 0);
  const unexplained = movers.filter((row) => !row.name).reduce((sum, row) => sum + row.delta, 0);
  return { common, added, removed, movers: movers.slice(0, 6), explained, unexplained };
}

export function formatRepDelta(value) {
  const n = Math.round(Number(value) || 0);
  const abs = Math.abs(n).toLocaleString('fr-FR');
  if (n > 0) return `+${abs}`;
  if (n < 0) return `−${abs}`;
  return '0';
}

export function exerciseMixSentence(mix) {
  if (!mix) return '';
  const named = (mix.movers || []).filter((row) => row.name).slice(0, 3);
  if (!named.length) {
    return mix.unexplained
      ? ' Une partie du changement de contenu porte sur des exercices dont le nom n’est pas résolu : elle n’est pas attribuée à un mouvement.'
      : '';
  }
  const bits = named.map((row) => {
    const role =
      row.status === 'added' ? 'ajouté' : row.status === 'removed' ? 'retiré' : 'déjà présent';
    return `${row.name} (${role}, ${formatRepDelta(row.delta)} répétitions)`;
  });
  const tail =
    mix.unexplained && Math.abs(mix.unexplained) >= 20
      ? ' Le reste n’est pas attribué à un exercice identifié.'
      : '';
  return ` Les mouvements qui portent le changement de contenu : ${bits.join(', ')}.${tail}`;
}
