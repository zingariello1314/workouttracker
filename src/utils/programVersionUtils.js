/**
 * Choisit le programme le plus récent (updatedAt), pour export / import / sync.
 */

export function programUpdatedAtMs(program) {
  if (!program || typeof program !== 'object') return 0;
  const t = Date.parse(program.updatedAt || program.createdAt || '');
  return Number.isFinite(t) ? t : 0;
}

/**
 * @param {object|null} a
 * @param {object|null} b
 * @param {{ preferSecondIfTie?: boolean }} [opts]
 */
export function pickLatestProgram(a, b, opts = {}) {
  if (!a) return b || null;
  if (!b) return a;
  const ta = programUpdatedAtMs(a);
  const tb = programUpdatedAtMs(b);
  if (tb > ta) return b;
  if (ta > tb) return a;
  return opts.preferSecondIfTie ? b : a;
}

/**
 * Fusionne deux listes de programmes par id en gardant la version la plus récente.
 * En cas d’égalité de date, `secondary` gagne (contexte live / fichier importé).
 * @param {object[]} primary
 * @param {object[]} secondary
 */
export function mergeProgramListsByLatest(primary = [], secondary = []) {
  const byId = new Map();
  const order = [];
  const ingest = (list, preferIncoming) => {
    if (!Array.isArray(list)) return;
    for (const p of list) {
      if (!p || p.id == null) continue;
      const id = p.id;
      if (!byId.has(id)) {
        byId.set(id, p);
        order.push(id);
      } else {
        byId.set(id, pickLatestProgram(byId.get(id), p, { preferSecondIfTie: preferIncoming }));
      }
    }
  };
  ingest(primary, false);
  ingest(secondary, true);
  return order.map((id) => byId.get(id));
}

/**
 * @param {object|null} idbCtx
 * @param {object|null} liveCtx
 */
export function resolveLatestProgramContext(idbCtx, liveCtx) {
  const a = idbCtx && typeof idbCtx === 'object' ? idbCtx : {};
  const b = liveCtx && typeof liveCtx === 'object' ? liveCtx : {};
  const programs = mergeProgramListsByLatest(a.programs, b.programs);
  const activeCandidate = pickLatestProgram(a.activeProgram, b.activeProgram, {
    preferSecondIfTie: Boolean(b.activeProgram)
  });
  const activeFromList =
    activeCandidate?.id != null ? programs.find((p) => p.id === activeCandidate.id) : null;
  const history = [...(a.programHistory || [])];
  for (const h of b.programHistory || []) {
    const dup = history.some(
      (e) => e?.id === h?.id || (e?.startDate === h?.startDate && e?.endDate === h?.endDate)
    );
    if (!dup) history.push(h);
  }
  return {
    programs,
    activeProgram: activeFromList || activeCandidate || null,
    programHistory: history,
    weekVariant: b.weekVariant ?? a.weekVariant ?? 'A',
    isGymMode: b.isGymMode ?? a.isGymMode ?? false
  };
}
