/**
 * Justification vérifiable d’un lien parent–enfant hiérarchique (Mission 14).
 * Une famille éditoriale commune ≠ approfondissement.
 */

function ymd(v) {
  return v == null ? null : String(v).slice(0, 10);
}

function normName(v) {
  return String(v || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Sujets pour justification hiérarchique.
 * Mission 23 — pour un collectif, n’utiliser que les participants documentés
 * (namedMoves / composition), pas tout le nuage d’events (sinon rattachements parasites).
 */
function subjectIdsOf(row) {
  const d = row?.discovery || row;
  const m = d?.metrics || {};
  const ids = new Set();
  const kind = String(d?.kind || '');
  const isCollectiveParent = /collective_return|composed_load_phase|load_phase/i.test(kind);

  const pushMove = (n) => {
    if (!n) return;
    if (n.exerciseId != null && n.exerciseId !== '') ids.add(String(n.exerciseId));
    if (n.storageId != null && n.storageId !== '') ids.add(String(n.storageId));
    if (n.name) ids.add(`name:${normName(n.name)}`);
  };

  if (m.exerciseId != null && m.exerciseId !== '') ids.add(String(m.exerciseId));
  if (m.storageId != null && m.storageId !== '') ids.add(String(m.storageId));
  if (m.name) ids.add(`name:${normName(m.name)}`);

  const documented =
    m.namedMoves ||
    m.composition?.namedMoves ||
    m.confirmedParticipants ||
    [];
  (Array.isArray(documented) ? documented : []).forEach((n) =>
    typeof n === 'string' || typeof n === 'number' ? ids.add(String(n)) : pushMove(n)
  );

  // Enfant individuel / non-collectif : events OK. Parent collectif : events exclus.
  if (!isCollectiveParent) {
    (m.events || []).forEach((e) => pushMove(e));
  }
  return ids;
}

/**
 * Ancres d’épisode — pas le nuage complet de metrics.dates (trajectoire historique).
 * Mission 26 : un enfant avec dates 1/8 nov ne doit pas se rattacher à un épisode
 * du 11 nov via minGap=1 sur le calendrier de séances.
 */
function episodeDatesOf(row) {
  const d = row?.discovery || row;
  const m = d?.metrics || {};
  const dates = new Set();
  const push = (v) => {
    const y = ymd(v);
    if (y) dates.add(y);
  };
  const kind = String(d?.kind || '');
  const isCollective = /collective_return|composed_parallel|composed_load/i.test(kind);
  const dimHint = analyticalDimension(row);

  push(m.returnDate);
  push(m.date);
  push(m.eventDate);
  (m.namedMoves || []).forEach((n) => push(n?.returnDate || n?.date));
  (Array.isArray(m.confirmationDates) ? m.confirmationDates : []).forEach(push);

  // Parent collectif : uniquement ancres d’épisode (namedMoves / return), pas events nuage
  if (!isCollective) {
    push(m.peakDate);
    (m.events || []).forEach((e) => push(e?.returnDate || e?.date));
  }

  // Nuage metrics.dates : uniquement si aucune ancre, et jamais pour return/format
  // (sinon toute trajectoire historique « touche » l’épisode parent).
  if (!dates.size && dimHint !== 'return_or_format' && !isCollective) {
    const arr = Array.isArray(m.dates) ? m.dates : [];
    if (arr.length) push(arr[arr.length - 1]);
  }

  (d?.claim?.proof?.sourceEvents || []).forEach((e) => {
    if (e?.id && /^\d{4}-\d{2}-\d{2}/.test(String(e.id))) push(String(e.id).slice(0, 10));
  });
  return dates;
}

function analyticalDimension(row) {
  const kind = String((row?.discovery || row)?.kind || '');
  if (/load_phase|resistance_progression|load_progression|charge/i.test(kind)) return 'load';
  if (/collective_return|ms_return|emergence|format_consolidation|structural_memory/i.test(kind)) {
    return 'return_or_format';
  }
  if (/relative_concentration|exercise_share|th_concentration|span_volume/i.test(kind)) {
    return 'concentration';
  }
  if (/volume_decomp|volume_shape|composed_volume/i.test(kind)) return 'volume';
  if (/adherence|session_family|slot/i.test(kind)) return 'program_structure';
  if (/sleep|rest/i.test(kind)) return 'sleep';
  return 'other';
}

function daysBetween(a, b) {
  if (!a || !b) return null;
  return Math.round((new Date(`${b}T12:00:00`) - new Date(`${a}T12:00:00`)) / 86400000);
}

/**
 * @returns {{
 *   ok: boolean,
 *   relation: string|null,
 *   reason: string,
 *   proof: object
 * }}
 */
export function justifyParentChildLink(parent, child, { maxEpisodeGapDays = 45 } = {}) {
  if (!parent || !child) {
    return { ok: false, relation: null, reason: 'missing_rows', proof: {} };
  }
  const parentDim = analyticalDimension(parent);
  const childDim = analyticalDimension(child);
  const parentSubjects = subjectIdsOf(parent);
  const childSubjects = subjectIdsOf(child);
  const parentDates = episodeDatesOf(parent);
  const childDates = episodeDatesOf(child);

  const sharedSubjects = [...childSubjects].filter((s) => parentSubjects.has(s));
  const subjectCompatible =
    sharedSubjects.length > 0 ||
    (parentSubjects.size === 0 && childSubjects.size === 0 && parentDim === childDim);

  // Dimension : load parent n’absorbe que load ; return parent n’absorbe return/format
  let dimensionCompatible = false;
  if (parentDim === 'load') {
    dimensionCompatible = childDim === 'load';
  } else if (parentDim === 'return_or_format') {
    dimensionCompatible = childDim === 'return_or_format';
  } else if (parentDim === childDim && parentDim !== 'other') {
    dimensionCompatible = true;
  }

  let episodeCompatible = false;
  let minGap = null;
  if (!parentDates.size || !childDates.size) {
    // pas de dates → n’autoriser que si sujet partagé ET même dimension stricte
    episodeCompatible = subjectCompatible && dimensionCompatible && sharedSubjects.length > 0;
  } else {
    for (const cd of childDates) {
      for (const pd of parentDates) {
        const gap = Math.abs(daysBetween(pd, cd) || 9999);
        if (minGap == null || gap < minGap) minGap = gap;
        if (gap <= maxEpisodeGapDays) episodeCompatible = true;
      }
    }
    // Enfant entièrement dans l’enveloppe parent
    if (parentDates.size >= 1 && childDates.size >= 1) {
      const pMin = [...parentDates].sort()[0];
      const pMax = [...parentDates].sort().at(-1);
      const cMin = [...childDates].sort()[0];
      const cMax = [...childDates].sort().at(-1);
      if (cMin >= pMin && cMax <= pMax) episodeCompatible = true;
      // tolérance : enfant dans ±maxEpisodeGapDays de l’enveloppe
      if (
        daysBetween(pMin, cMin) >= -maxEpisodeGapDays &&
        daysBetween(cMax, pMax) >= -maxEpisodeGapDays
      ) {
        // encore trop large si l’enfant est des mois après — déjà couvert par minGap
      }
    }
  }

  if (!dimensionCompatible) {
    return {
      ok: false,
      relation: null,
      reason: 'incompatible_analytical_dimension',
      proof: { parentDim, childDim, sharedSubjects, minGap }
    };
  }
  if (!subjectCompatible || sharedSubjects.length === 0) {
    return {
      ok: false,
      relation: null,
      reason: 'no_shared_subject',
      proof: {
        parentSubjects: [...parentSubjects].slice(0, 8),
        childSubjects: [...childSubjects].slice(0, 8),
        parentDim,
        childDim,
        minGap
      }
    };
  }
  if (!episodeCompatible) {
    return {
      ok: false,
      relation: null,
      reason: 'incompatible_episode',
      proof: {
        sharedSubjects,
        parentDates: [...parentDates].slice(0, 6),
        childDates: [...childDates].slice(0, 6),
        minGap,
        maxEpisodeGapDays
      }
    };
  }

  // Mission 27 — un épisode antérieur du même exercice n’est pas un approfondissement
  // du collectif courant (ex. dates 1/8 nov vs reprise du 11).
  const parentKind = String((parent?.discovery || parent)?.kind || '');
  if (/collective_return/i.test(parentKind) && parentDates.size && childDates.size) {
    const pMin = [...parentDates].sort()[0];
    const cMax = [...childDates].sort().at(-1);
    const lead = daysBetween(cMax, pMin);
    if (lead != null && lead > 3) {
      return {
        ok: false,
        relation: 'prior_context',
        reason: 'prior_episode_not_deepening',
        proof: {
          sharedSubjects,
          parentDates: [...parentDates].slice(0, 6),
          childDates: [...childDates].slice(0, 6),
          minGap,
          note: 'Ancre enfant antérieure à l’épisode parent — contexte, pas deepening'
        }
      };
    }
  }

  return {
    ok: true,
    relation: 'deepening',
    reason: 'verified_parent_child',
    proof: {
      sharedSubjects,
      parentDim,
      childDim,
      parentDates: [...parentDates].slice(0, 6),
      childDates: [...childDates].slice(0, 6),
      minGap,
      contribution: 'child_documents_component_of_parent_thesis'
    }
  };
}

export function isAccessibleDeepeningDisposition(disposition) {
  return disposition === 'deepening_of_collective' || disposition === 'deepening_accessible';
}
