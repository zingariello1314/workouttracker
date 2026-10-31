/**
 * P3.4 — Journal des révisions de programme, applicabilité temporelle, exceptions datées.
 *
 * Principes :
 * - `programHistory` legacy (métadonnées tableaux) ≠ journal structurel.
 * - recordedAt ≠ applicableFrom ; les intervalles viennent des événements enregistrés.
 * - Une révision d’aujourd’hui ne prouve pas le mois précédent.
 * - Ne jamais réécrire un snapshot P3.3 `historical_frozen` proven.
 * - Metadata-only (updatedAt, uiEpoch, name seul) ≠ révision structurelle.
 * - Persistence non atomique → événements `uncertain` explicites.
 *
 * @module programRevisionJournalP34
 */

import DateHelper from './dateHelper';
import { WEEK_DAYS } from './restDayUtils';
import {
  APPLICABILITY_CONFIDENCE,
  CAPTURE_TRIGGER,
  PLAN_DAY_KIND,
  SNAPSHOT_STATUS,
  buildCaptureIntentFromProgram,
  capturePlannedDayWithoutActivity,
  clearFutureProvisionalForecasts,
  describeDayPlanProvenance,
  isHistoricalFrozenSnapshot,
  isPlanCompareEligible,
  sealPlanBeforeProgramChange
} from './calendarPlanCaptureP33';
import { getDayPlanSnapshot } from './calendarDayPlanSnapshot';

export const P34_PROVENANCE_VERSION = 'p34.v1';

export const REVISION_MUTATION_KIND = Object.freeze({
  STRUCTURAL: 'structural',
  ACTIVATION: 'activation',
  DEACTIVATION: 'deactivation',
  DELETION: 'deletion',
  METADATA_ONLY: 'metadata_only',
  DATED_EXCEPTION: 'dated_exception',
  UNCERTAIN: 'uncertain'
});

export const REVISION_RELIABILITY = Object.freeze({
  RECORDED: 'recorded',
  UNCERTAIN: 'uncertain',
  RECOVERED: 'recovered'
});

export const DAY_PLAN_PROOF = Object.freeze({
  DEMONSTRATED: 'demonstrated', // snapshot proven ou journal + activation démontrés
  PROBABLE: 'probable', // journal présent mais intervalle/activation incertains
  NON_RECONSTRUCTIBLE: 'non_reconstructible'
});

function stableStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const keys = Object.keys(value).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(value[k])}`).join(',')}}`;
}

/** Hash FNV-1a 32-bit — empreinte stable, non crypto. */
export function hashStructureFingerprint(normalized) {
  const s = typeof normalized === 'string' ? normalized : stableStringify(normalized);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (`00000000${(h >>> 0).toString(16)}`).slice(-8);
}

/**
 * Champs structurels (prévu) vs hors empreinte — contrat P3.4.
 * Structurel : schedule jours, active, exercices (id/originalId/name/series/type/intensity/rest),
 *   variantes A/B, restDay, weekAlternation.
 * Métadonnées (ignorées) : name programme, uiEpoch, updatedAt, status, startDate.
 * Exceptions quotidiennes : dailyVariations (canal datedExceptions).
 * Réalisation : reps / checked / feedback — hors empreinte.
 * Hors scope volontaire : étirements (etirements), circuits purs — limit résiduelle documentée.
 */
function normalizeExercise(ex, index = 0) {
  if (!ex || typeof ex !== 'object') return null;
  return {
    id: ex.id ?? ex.storageId ?? `ex_${index}`,
    originalId: ex.originalId ?? ex.id ?? null,
    name: String(ex.name || '').trim(),
    series: String(ex.series || '').trim(),
    type: ex.type || null,
    intensity: ex.intensity != null ? String(ex.intensity) : null,
    rest: ex.rest != null ? String(ex.rest) : null
  };
}

function normalizeDaySlot(slot) {
  if (!slot || typeof slot !== 'object') {
    return { active: false, exercises: [], salleVariants: null };
  }
  const maison = Array.isArray(slot.maison?.exercises) ? slot.maison.exercises : null;
  const raw = Array.isArray(slot.exercises) ? slot.exercises : maison || [];
  const exercises = raw.map(normalizeExercise).filter(Boolean);
  let salleVariants = null;
  if (slot.salleVariants && typeof slot.salleVariants === 'object') {
    salleVariants = {};
    for (const key of ['semaineA', 'semaineB']) {
      const block = slot.salleVariants[key];
      const list = Array.isArray(block?.exercises) ? block.exercises : [];
      salleVariants[key] = {
        exercises: list.map(normalizeExercise).filter(Boolean)
      };
    }
  }
  const hasContent = exercises.length > 0 || Boolean(salleVariants);
  // Respecter active:false explicite même si des exercices restent stockés.
  const active = slot.active === false ? false : hasContent;
  return {
    active,
    exercises,
    salleVariants
  };
}

/**
 * Structure normalisée documentée (empreinte).
 */
export function normalizeProgramStructure(program) {
  if (!program || typeof program !== 'object') {
    return { schedule: {}, restDay: null, weekAlternation: null };
  }
  const schedule = {};
  for (const day of WEEK_DAYS) {
    schedule[day] = normalizeDaySlot(program.schedule?.[day]);
  }
  return {
    schedule,
    restDay: program.restConfig?.restDay || program.restDay || null,
    weekAlternation: program.weekAlternation || null
  };
}

export function computeProgramStructureFingerprint(program) {
  const normalized = normalizeProgramStructure(program);
  return {
    normalized,
    fingerprint: hashStructureFingerprint(normalized)
  };
}

/** Comparaison structurelle directe (normalisé), pas seulement égalité de hash opaque. */
export function structuresDeepEqual(a, b) {
  const normA = a?.structure && !a.schedule ? a.structure : normalizeProgramStructure(a);
  const normB = b?.structure && !b.schedule ? b.structure : normalizeProgramStructure(b);
  return stableStringify(normA) === stableStringify(normB);
}

export function emptyProgramRevisionLog(introYmd = null) {
  return {
    provenanceVersion: P34_PROVENANCE_VERSION,
    journalIntroducedAt: introYmd || null,
    revisions: [],
    activationEvents: [],
    datedExceptions: [],
    pendingUncertain: []
  };
}

export function getProgramRevisionLog(workoutData) {
  const raw = workoutData?.programRevisionLog;
  if (!raw || typeof raw !== 'object') return emptyProgramRevisionLog();
  return {
    provenanceVersion: raw.provenanceVersion || P34_PROVENANCE_VERSION,
    journalIntroducedAt: raw.journalIntroducedAt || null,
    revisions: Array.isArray(raw.revisions) ? raw.revisions : [],
    activationEvents: Array.isArray(raw.activationEvents) ? raw.activationEvents : [],
    datedExceptions: Array.isArray(raw.datedExceptions) ? raw.datedExceptions : [],
    pendingUncertain: Array.isArray(raw.pendingUncertain) ? raw.pendingUncertain : []
  };
}

export function withProgramRevisionLog(workoutData, log) {
  return {
    ...(workoutData || {}),
    programRevisionLog: log
  };
}

function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function isoToYmd(isoOrYmd) {
  if (!isoOrYmd) return null;
  const s = String(isoOrYmd);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (s.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return null;
}

/**
 * Compare deux structures : d’abord deep-equal normalisé, hash dérivé pour indexation.
 */
export function isSameProgramStructure(a, b) {
  return structuresDeepEqual(a, b);
}

/**
 * Continuité historique : révision+activation recorded ne suffisent pas si rupture.
 * @returns {{ proof: string, reasons: string[] }}
 */
export function assessApplicabilityContinuity({
  log,
  programId,
  dateStr,
  revision,
  activationProof,
  liveActiveProgram = null
} = {}) {
  const reasons = [];
  if (!revision || !dateStr || !programId) {
    return { proof: DAY_PLAN_PROOF.NON_RECONSTRUCTIBLE, reasons: ['missing_inputs'] };
  }
  if (activationProof !== DAY_PLAN_PROOF.DEMONSTRATED) {
    reasons.push('activation_not_demonstrated');
  }
  if (revision.reliability !== REVISION_RELIABILITY.RECORDED) {
    reasons.push('revision_reliability_uncertain');
  }
  if (!revision.applicableFromYmd && !isoToYmd(revision.applicableFrom)) {
    reasons.push('applicability_interval_incomplete');
  }

  // Transition incertaine persistée : toute date ≥ événement → pas demonstrated
  const pendingHits = (log?.pendingUncertain || []).filter((p) => {
    if (p.programId && String(p.programId) !== String(programId)) return false;
    const y = isoToYmd(p.recordedAt);
    return y && y <= dateStr;
  });
  if (pendingHits.length) {
    reasons.push('pending_uncertain_transition');
  }

  // Révision ouverte dont le live diverge : intervalle d’applicabilité suspect
  if (
    revision.applicableUntil == null &&
    liveActiveProgram &&
    String(liveActiveProgram.id) === String(programId) &&
    !structuresDeepEqual(liveActiveProgram, revision)
  ) {
    reasons.push('live_journal_fingerprint_mismatch');
  }

  // Activation et révision à des dates d’applicabilité incohérentes (révision avant activation)
  // → déjà souvent non couvert ; si révision.applicableFrom < activation sans événement, probable.
  if (reasons.includes('pending_uncertain_transition') || reasons.includes('live_journal_fingerprint_mismatch')) {
    return { proof: DAY_PLAN_PROOF.PROBABLE, reasons };
  }
  if (reasons.includes('activation_not_demonstrated') || reasons.includes('revision_reliability_uncertain')) {
    return { proof: DAY_PLAN_PROOF.PROBABLE, reasons };
  }
  if (reasons.includes('applicability_interval_incomplete')) {
    return { proof: DAY_PLAN_PROOF.PROBABLE, reasons };
  }
  return { proof: DAY_PLAN_PROOF.DEMONSTRATED, reasons: [] };
}

/**
 * Au redémarrage : si le programme live ≠ dernière révision ouverte, marquer uncertain.
 * Ne réécrit pas les snapshots P3.3 ; empêche la promotion abusive en demonstrated.
 */
export function reconcileLiveProgramAgainstJournal(
  workoutData,
  liveActiveProgram,
  { todayYmd = null } = {}
) {
  if (!liveActiveProgram?.id) {
    return { workoutData: workoutData || {}, changed: false, reason: 'no_live_program' };
  }
  const log = getProgramRevisionLog(workoutData);
  if (!log.journalIntroducedAt && !log.revisions.length && !log.activationEvents.length) {
    return { workoutData: workoutData || {}, changed: false, reason: 'no_journal' };
  }

  const open = [...log.revisions]
    .reverse()
    .find(
      (r) => String(r.programId) === String(liveActiveProgram.id) && r.applicableUntil == null
    );

  const day = todayYmd || null;

  if (!open) {
    if (day) {
      const activated = resolveActiveProgramIdAtDate(log, day);
      if (activated.programId && String(activated.programId) === String(liveActiveProgram.id)) {
        return {
          workoutData: markPendingUncertain(workoutData, {
            reason: 'live_active_without_open_revision',
            programId: liveActiveProgram.id,
            source: 'reconcile_restart'
          }),
          changed: true,
          reason: 'live_active_without_open_revision'
        };
      }
    }
    return { workoutData: workoutData || {}, changed: false, reason: 'no_open_revision' };
  }

  if (structuresDeepEqual(liveActiveProgram, open)) {
    return { workoutData: workoutData || {}, changed: false, reason: 'consistent' };
  }

  const already = (log.pendingUncertain || []).some(
    (p) =>
      p.reason === 'live_fingerprint_mismatch_on_reconcile' &&
      String(p.programId) === String(liveActiveProgram.id)
  );
  if (already) {
    return { workoutData: workoutData || {}, changed: false, reason: 'already_flagged' };
  }

  return {
    workoutData: markPendingUncertain(workoutData, {
      reason: 'live_fingerprint_mismatch_on_reconcile',
      programId: liveActiveProgram.id,
      openRevisionId: open.revisionId,
      journalFingerprint: open.structureFingerprint,
      liveFingerprint: computeProgramStructureFingerprint(liveActiveProgram).fingerprint,
      source: 'reconcile_restart'
    }),
    changed: true,
    reason: 'live_fingerprint_mismatch_on_reconcile'
  };
}

/**
 * Ferme l’intervalle d’applicabilité de la dernière révision ouverte d’un programme.
 */
function closeOpenRevisions(revisions, programId, untilIso, untilYmd) {
  return revisions.map((r) => {
    if (r.programId !== programId) return r;
    if (r.applicableUntil != null) return r;
    return {
      ...r,
      applicableUntil: untilIso,
      applicableUntilYmd: untilYmd
    };
  });
}

/**
 * Enregistre une révision structurelle (ou metadata_only / uncertain) sans écraser les précédentes.
 */
export function appendProgramRevision(
  workoutData,
  {
    program,
    previousProgram = null,
    recordedAt = null,
    applicableFrom = null,
    source = 'update',
    mutationKind = null,
    reliability = REVISION_RELIABILITY.RECORDED,
    forceStructural = false
  } = {}
) {
  const log = getProgramRevisionLog(workoutData);
  const nowIso = recordedAt || new Date().toISOString();
  const fromIso = applicableFrom || nowIso;
  const fromYmd = isoToYmd(fromIso);
  const programId = program?.id != null ? String(program.id) : null;
  if (!programId && mutationKind !== REVISION_MUTATION_KIND.DEACTIVATION) {
    return { workoutData: workoutData || {}, wrote: false, reason: 'no_program_id', revision: null };
  }

  const { normalized, fingerprint } = computeProgramStructureFingerprint(program);
  const prevFp = previousProgram
    ? computeProgramStructureFingerprint(previousProgram).fingerprint
    : log.revisions.filter((r) => r.programId === programId).slice(-1)[0]?.structureFingerprint;

  const structuralChanged = forceStructural || !prevFp || prevFp !== fingerprint;
  let kind = mutationKind;
  if (!kind) {
    kind = structuralChanged
      ? REVISION_MUTATION_KIND.STRUCTURAL
      : REVISION_MUTATION_KIND.METADATA_ONLY;
  }

  if (kind === REVISION_MUTATION_KIND.METADATA_ONLY && !forceStructural) {
    return {
      workoutData: workoutData || {},
      wrote: false,
      reason: 'metadata_only_skipped',
      revision: null,
      fingerprint
    };
  }

  let revisions = closeOpenRevisions(log.revisions, programId, nowIso, isoToYmd(nowIso));
  const previousRevisionId =
    [...revisions].reverse().find((r) => r.programId === programId)?.revisionId || null;

  const revision = {
    revisionId: newId('rev'),
    programId,
    programName: program?.name || null,
    structureFingerprint: fingerprint,
    structure: normalized,
    recordedAt: nowIso,
    applicableFrom: fromIso,
    applicableFromYmd: fromYmd,
    applicableUntil: null,
    applicableUntilYmd: null,
    source,
    mutationKind: kind,
    reliability,
    previousRevisionId,
    provenanceVersion: P34_PROVENANCE_VERSION
  };

  revisions = [...revisions, revision];
  const nextLog = {
    ...log,
    journalIntroducedAt: log.journalIntroducedAt || fromYmd,
    revisions
  };

  return {
    workoutData: withProgramRevisionLog(workoutData, nextLog),
    wrote: true,
    reason: 'revision_appended',
    revision
  };
}

export function appendActivationEvent(
  workoutData,
  {
    type, // activated | deactivated | deleted
    programId,
    recordedAt = null,
    applicableFrom = null,
    reliability = REVISION_RELIABILITY.RECORDED,
    source = 'activation'
  } = {}
) {
  const log = getProgramRevisionLog(workoutData);
  const nowIso = recordedAt || new Date().toISOString();
  const fromIso = applicableFrom || nowIso;
  const event = {
    eventId: newId('act'),
    type,
    programId: programId != null ? String(programId) : null,
    recordedAt: nowIso,
    applicableFrom: fromIso,
    applicableFromYmd: isoToYmd(fromIso),
    reliability,
    source,
    provenanceVersion: P34_PROVENANCE_VERSION
  };
  const nextLog = {
    ...log,
    journalIntroducedAt: log.journalIntroducedAt || event.applicableFromYmd,
    activationEvents: [...log.activationEvents, event]
  };
  return {
    workoutData: withProgramRevisionLog(workoutData, nextLog),
    event
  };
}

/**
 * Exception datée (dailyVariations) — pas une révision structurelle globale.
 */
export function appendDatedExceptionEvent(
  workoutData,
  {
    dateStr,
    recordedAt = null,
    suppressedExerciseIds = null,
    additionalExerciseIds = null,
    seriesOverrides = null,
    reliability = REVISION_RELIABILITY.RECORDED,
    source = 'daily_variation'
  } = {}
) {
  if (!dateStr) {
    return { workoutData: workoutData || {}, wrote: false, reason: 'no_date' };
  }
  const log = getProgramRevisionLog(workoutData);
  const nowIso = recordedAt || new Date().toISOString();
  const event = {
    eventId: newId('dv'),
    kind: REVISION_MUTATION_KIND.DATED_EXCEPTION,
    dateStr,
    recordedAt: nowIso,
    suppressedExerciseIds: Array.isArray(suppressedExerciseIds)
      ? suppressedExerciseIds.map(String)
      : null,
    additionalExerciseIds: Array.isArray(additionalExerciseIds)
      ? additionalExerciseIds.map(String)
      : null,
    seriesOverrides: seriesOverrides && typeof seriesOverrides === 'object' ? seriesOverrides : null,
    reliability,
    source,
    provenanceVersion: P34_PROVENANCE_VERSION
  };
  const nextLog = {
    ...log,
    journalIntroducedAt: log.journalIntroducedAt || dateStr,
    datedExceptions: [...log.datedExceptions, event]
  };
  return {
    workoutData: withProgramRevisionLog(workoutData, nextLog),
    wrote: true,
    event
  };
}

export function markPendingUncertain(workoutData, pending) {
  const log = getProgramRevisionLog(workoutData);
  const entry = {
    pendingId: newId('pend'),
    recordedAt: new Date().toISOString(),
    ...pending,
    reliability: REVISION_RELIABILITY.UNCERTAIN,
    provenanceVersion: P34_PROVENANCE_VERSION
  };
  return withProgramRevisionLog(workoutData, {
    ...log,
    pendingUncertain: [...log.pendingUncertain, entry]
  });
}

/**
 * Programme actif à une date selon les événements d’activation enregistrés.
 * Sans événement couvrant la date → null (pas d’invention).
 */
export function resolveActiveProgramIdAtDate(log, dateStr) {
  if (!dateStr || !log) return { programId: null, proof: DAY_PLAN_PROOF.NON_RECONSTRUCTIBLE };

  const events = [...(log.activationEvents || [])].sort((a, b) =>
    String(a.applicableFrom).localeCompare(String(b.applicableFrom))
  );
  if (!events.length) {
    return { programId: null, proof: DAY_PLAN_PROOF.NON_RECONSTRUCTIBLE };
  }

  let current = null;
  let reliability = REVISION_RELIABILITY.RECORDED;
  for (const ev of events) {
    const ymd = ev.applicableFromYmd || isoToYmd(ev.applicableFrom);
    if (!ymd || ymd > dateStr) break;
    if (ev.type === 'activated') current = ev.programId;
    else if (ev.type === 'deactivated' || ev.type === 'deleted') {
      if (!ev.programId || ev.programId === current) current = null;
    }
    if (ev.reliability === REVISION_RELIABILITY.UNCERTAIN) {
      reliability = REVISION_RELIABILITY.UNCERTAIN;
    }
  }

  if (current == null) {
    return { programId: null, proof: DAY_PLAN_PROOF.NON_RECONSTRUCTIBLE };
  }
  return {
    programId: current,
    proof:
      reliability === REVISION_RELIABILITY.UNCERTAIN
        ? DAY_PLAN_PROOF.PROBABLE
        : DAY_PLAN_PROOF.DEMONSTRATED
  };
}

/**
 * Révision structurelle applicable à une date pour un programId.
 */
export function resolveRevisionForProgramAtDate(log, programId, dateStr) {
  if (!log || !programId || !dateStr) return null;
  const candidates = (log.revisions || []).filter((r) => {
    if (String(r.programId) !== String(programId)) return false;
    const from = r.applicableFromYmd || isoToYmd(r.applicableFrom);
    if (!from || from > dateStr) return false;
    const until = r.applicableUntilYmd || isoToYmd(r.applicableUntil);
    if (until && until <= dateStr) return false;
    return true;
  });
  if (!candidates.length) return null;
  candidates.sort((a, b) =>
    String(a.applicableFrom).localeCompare(String(b.applicableFrom))
  );
  return candidates[candidates.length - 1];
}

function programFromRevision(revision) {
  if (!revision?.structure) return null;
  const schedule = {};
  for (const day of WEEK_DAYS) {
    const slot = revision.structure.schedule?.[day] || { active: false, exercises: [] };
    schedule[day] = {
      active: slot.active !== false,
      exercises: Array.isArray(slot.exercises) ? slot.exercises : [],
      ...(slot.salleVariants ? { salleVariants: slot.salleVariants } : {})
    };
  }
  return {
    id: revision.programId,
    name: revision.programName,
    schedule,
    restConfig: { restDay: revision.structure.restDay || null },
    weekAlternation: revision.structure.weekAlternation || null
  };
}

/**
 * Reconstitue le plan d’une journée à partir du journal — sans inventer le pré-journal.
 * Ne réécrit jamais un snapshot proven.
 */
export function resolveHistoricalDayPlanFromJournal(
  workoutData,
  dateStr,
  { todayYmd = null, liveActiveProgram = null } = {}
) {
  const snap = getDayPlanSnapshot(workoutData, dateStr);
  if (snap && isPlanCompareEligible(snap)) {
    return {
      dateStr,
      proof: DAY_PLAN_PROOF.DEMONSTRATED,
      source: 'p33_proven_snapshot',
      snapshot: snap,
      revision: null,
      programId: snap.programId || snap.programIdentity || null,
      wrote: false,
      continuityReasons: []
    };
  }
  if (snap && isHistoricalFrozenSnapshot(snap)) {
    return {
      dateStr,
      proof: DAY_PLAN_PROOF.PROBABLE,
      source: 'p33_unverified_snapshot',
      snapshot: snap,
      revision: null,
      programId: snap.programId || null,
      wrote: false,
      continuityReasons: ['p33_unverified']
    };
  }

  const log = getProgramRevisionLog(workoutData);
  const intro = log.journalIntroducedAt;
  if (!intro || dateStr < intro) {
    return {
      dateStr,
      proof: DAY_PLAN_PROOF.NON_RECONSTRUCTIBLE,
      source: 'before_journal',
      snapshot: snap || null,
      revision: null,
      programId: null,
      wrote: false,
      continuityReasons: ['before_journal']
    };
  }

  const active = resolveActiveProgramIdAtDate(log, dateStr);
  if (!active.programId) {
    return {
      dateStr,
      proof: DAY_PLAN_PROOF.NON_RECONSTRUCTIBLE,
      source: 'no_activation_coverage',
      snapshot: snap || null,
      revision: null,
      programId: null,
      wrote: false,
      continuityReasons: ['no_activation_coverage']
    };
  }

  const revision = resolveRevisionForProgramAtDate(log, active.programId, dateStr);
  if (!revision) {
    return {
      dateStr,
      proof: DAY_PLAN_PROOF.NON_RECONSTRUCTIBLE,
      source: 'no_revision_coverage',
      snapshot: snap || null,
      revision: null,
      programId: active.programId,
      wrote: false,
      continuityReasons: ['no_revision_coverage']
    };
  }

  const continuity = assessApplicabilityContinuity({
    log,
    programId: active.programId,
    dateStr,
    revision,
    activationProof: active.proof,
    liveActiveProgram
  });

  const program = programFromRevision(revision);
  const dated = (log.datedExceptions || []).filter((e) => e.dateStr === dateStr);
  const latestException = dated.length ? dated[dated.length - 1] : null;
  const intent = buildCaptureIntentFromProgram({
    dateStr,
    activeProgram: program,
    workoutData,
    effectiveRestDay: program?.restConfig?.restDay || revision.structure?.restDay || null,
    // proven capture seulement si continuité demonstrated
    programApplicabilityProven: continuity.proof === DAY_PLAN_PROOF.DEMONSTRATED,
    exercises: null
  });
  if (latestException?.suppressedExerciseIds?.length) {
    intent.suppressedExerciseIds = latestException.suppressedExerciseIds;
    intent.exercises = (intent.exercises || []).filter((ex) => {
      const id = String(ex.id ?? ex.originalId ?? '');
      return !latestException.suppressedExerciseIds.includes(id);
    });
  }

  return {
    dateStr,
    proof: continuity.proof,
    source: 'p34_journal',
    snapshot: null,
    revision,
    programId: active.programId,
    intent,
    datedException: latestException,
    wrote: false,
    todayYmd,
    continuityReasons: continuity.reasons
  };
}

/**
 * Tente une capture P3.3 à partir du journal (jours sans snapshot), sans toucher aux proven.
 */
export function captureDayFromJournalIfAdmissible(
  workoutData,
  dateStr,
  { todayYmd = null, liveActiveProgram = null } = {}
) {
  const resolved = resolveHistoricalDayPlanFromJournal(workoutData, dateStr, {
    todayYmd,
    liveActiveProgram
  });
  if (resolved.source === 'p33_proven_snapshot' || resolved.source === 'p33_unverified_snapshot') {
    return { workoutData: workoutData || {}, ...resolved, wrote: false };
  }
  if (resolved.proof === DAY_PLAN_PROOF.NON_RECONSTRUCTIBLE || !resolved.intent) {
    return { workoutData: workoutData || {}, ...resolved, wrote: false };
  }

  const confidence =
    resolved.proof === DAY_PLAN_PROOF.DEMONSTRATED
      ? APPLICABILITY_CONFIDENCE.PROVEN
      : APPLICABILITY_CONFIDENCE.UNVERIFIED;

  const res = capturePlannedDayWithoutActivity(
    workoutData,
    dateStr,
    {
      ...resolved.intent,
      programApplicabilityProven: confidence === APPLICABILITY_CONFIDENCE.PROVEN,
      applicabilityConfidence: confidence
    },
    {
      captureTrigger: CAPTURE_TRIGGER.EXPLICIT_CAPTURE,
      status: SNAPSHOT_STATUS.HISTORICAL_FROZEN,
      applicabilityConfidence: confidence
    }
  );

  return {
    workoutData: res.workoutData,
    wrote: res.wrote,
    proof: resolved.proof,
    source: resolved.source,
    revision: resolved.revision,
    programId: resolved.programId,
    snapshot: res.snapshot,
    reason: res.reason
  };
}

/**
 * Bundle sûr avant mutation structurelle / activation :
 * 1) seal P3.3 avec l’ancienne structure
 * 2) journaliser révision / activation
 * 3) invalider prévisions futures
 *
 * L’appelant doit persister `workoutData` **avant** d’appliquer la mutation programme.
 */
export function prepareProgramMutationBundle({
  workoutData,
  previousActiveProgram = null,
  nextActiveProgram = null,
  nextProgramForRevision = null,
  todayYmd,
  nowIso = null,
  source = 'update',
  mutationKind = null,
  reliability = REVISION_RELIABILITY.RECORDED,
  sealPastDays = 3
} = {}) {
  const recordedAt = nowIso || new Date().toISOString();
  let data = workoutData || {};
  const notes = [];

  if (previousActiveProgram && todayYmd) {
    const resolveIntent = (dateStr) =>
      buildCaptureIntentFromProgram({
        dateStr,
        activeProgram: previousActiveProgram,
        workoutData: data,
        programApplicabilityProven: true
      });
    const sealed = sealPlanBeforeProgramChange(data, {
      todayYmd,
      resolveIntent,
      sealPastDays
    });
    data = sealed.workoutData;
    notes.push({ seal: sealed.sealed, clearedForecasts: sealed.clearedForecasts });
  } else if (todayYmd) {
    data = clearFutureProvisionalForecasts(data, todayYmd).workoutData;
  }

  const targetProgram = nextProgramForRevision || nextActiveProgram;
  let revisionResult = null;

  if (
    mutationKind === REVISION_MUTATION_KIND.ACTIVATION ||
    (nextActiveProgram &&
      previousActiveProgram &&
      String(nextActiveProgram.id) !== String(previousActiveProgram.id))
  ) {
    if (previousActiveProgram?.id) {
      const deact = appendActivationEvent(data, {
        type: 'deactivated',
        programId: previousActiveProgram.id,
        recordedAt,
        applicableFrom: recordedAt,
        reliability,
        source
      });
      data = deact.workoutData;
    }
    if (nextActiveProgram?.id) {
      const act = appendActivationEvent(data, {
        type: 'activated',
        programId: nextActiveProgram.id,
        recordedAt,
        applicableFrom: recordedAt,
        reliability,
        source
      });
      data = act.workoutData;
      // Première révision structurelle du programme activé si absente
      const log = getProgramRevisionLog(data);
      const hasRev = log.revisions.some((r) => String(r.programId) === String(nextActiveProgram.id));
      if (!hasRev) {
        revisionResult = appendProgramRevision(data, {
          program: nextActiveProgram,
          previousProgram: null,
          recordedAt,
          applicableFrom: recordedAt,
          source,
          mutationKind: REVISION_MUTATION_KIND.STRUCTURAL,
          reliability,
          forceStructural: true
        });
        data = revisionResult.workoutData;
      }
    }
  } else if (mutationKind === REVISION_MUTATION_KIND.DEACTIVATION) {
    if (previousActiveProgram?.id) {
      const deact = appendActivationEvent(data, {
        type: 'deactivated',
        programId: previousActiveProgram.id,
        recordedAt,
        applicableFrom: recordedAt,
        reliability,
        source
      });
      data = deact.workoutData;
    }
  } else if (mutationKind === REVISION_MUTATION_KIND.DELETION) {
    if (previousActiveProgram?.id) {
      const del = appendActivationEvent(data, {
        type: 'deleted',
        programId: previousActiveProgram.id,
        recordedAt,
        applicableFrom: recordedAt,
        reliability,
        source
      });
      data = del.workoutData;
    }
  } else if (targetProgram) {
    revisionResult = appendProgramRevision(data, {
      program: targetProgram,
      previousProgram: previousActiveProgram,
      recordedAt,
      applicableFrom: recordedAt,
      source,
      mutationKind: mutationKind || null,
      reliability
    });
    data = revisionResult.workoutData;
    notes.push({ revisionReason: revisionResult.reason });
  }

  // Introduire le journal dès le premier événement
  const log = getProgramRevisionLog(data);
  if (!log.journalIntroducedAt && todayYmd) {
    data = withProgramRevisionLog(data, { ...log, journalIntroducedAt: todayYmd });
  }

  return {
    workoutData: data,
    revision: revisionResult?.revision || null,
    revisionWrote: Boolean(revisionResult?.wrote),
    revisionReason: revisionResult?.reason || null,
    notes,
    recordedAt,
    reliability
  };
}

/**
 * Diff structurel entre deux révisions / programmes (pour analyses avant/après).
 */
export function diffProgramStructures(beforeProgramOrRevision, afterProgramOrRevision) {
  const before =
    beforeProgramOrRevision?.structure
      ? beforeProgramOrRevision.structure
      : normalizeProgramStructure(beforeProgramOrRevision);
  const after =
    afterProgramOrRevision?.structure
      ? afterProgramOrRevision.structure
      : normalizeProgramStructure(afterProgramOrRevision);

  const added = [];
  const removed = [];
  const moved = [];
  const seriesChanged = [];
  const dayActivationChanges = [];

  const beforeByKey = new Map();
  const afterByKey = new Map();

  for (const day of WEEK_DAYS) {
    const bSlot = before.schedule?.[day];
    const aSlot = after.schedule?.[day];
    if (Boolean(bSlot?.active) !== Boolean(aSlot?.active)) {
      dayActivationChanges.push({
        day,
        beforeActive: Boolean(bSlot?.active),
        afterActive: Boolean(aSlot?.active)
      });
    }
    for (const ex of bSlot?.exercises || []) {
      const key = String(ex.originalId ?? ex.id);
      beforeByKey.set(`${day}::${key}`, { day, ex, key });
    }
    for (const ex of aSlot?.exercises || []) {
      const key = String(ex.originalId ?? ex.id);
      afterByKey.set(`${day}::${key}`, { day, ex, key });
    }
  }

  const beforeIds = new Map();
  for (const { day, ex, key } of beforeByKey.values()) {
    if (!beforeIds.has(key)) beforeIds.set(key, []);
    beforeIds.get(key).push({ day, ex });
  }
  const afterIds = new Map();
  for (const { day, ex, key } of afterByKey.values()) {
    if (!afterIds.has(key)) afterIds.set(key, []);
    afterIds.get(key).push({ day, ex });
  }

  for (const [key, locs] of afterIds) {
    if (!beforeIds.has(key)) {
      for (const loc of locs) added.push({ id: key, name: loc.ex.name, day: loc.day });
    }
  }
  for (const [key, locs] of beforeIds) {
    if (!afterIds.has(key)) {
      for (const loc of locs) removed.push({ id: key, name: loc.ex.name, day: loc.day });
    } else {
      const bDays = new Set(locs.map((l) => l.day));
      const aDays = new Set(afterIds.get(key).map((l) => l.day));
      const onlyBefore = [...bDays].filter((d) => !aDays.has(d));
      const onlyAfter = [...aDays].filter((d) => !bDays.has(d));
      if (onlyBefore.length && onlyAfter.length) {
        moved.push({
          id: key,
          name: locs[0].ex.name,
          fromDays: onlyBefore,
          toDays: onlyAfter
        });
      }
      for (const day of WEEK_DAYS) {
        const b = locs.find((l) => l.day === day);
        const a = afterIds.get(key).find((l) => l.day === day);
        if (b && a && String(b.ex.series || '') !== String(a.ex.series || '')) {
          seriesChanged.push({
            id: key,
            name: b.ex.name,
            day,
            beforeSeries: b.ex.series,
            afterSeries: a.ex.series
          });
        }
      }
    }
  }

  const beforeActiveDays = WEEK_DAYS.filter((d) => before.schedule?.[d]?.active).length;
  const afterActiveDays = WEEK_DAYS.filter((d) => after.schedule?.[d]?.active).length;

  return {
    fingerprintBefore: hashStructureFingerprint(before),
    fingerprintAfter: hashStructureFingerprint(after),
    structuralChange:
      hashStructureFingerprint(before) !== hashStructureFingerprint(after),
    added,
    removed,
    moved,
    seriesChanged,
    dayActivationChanges,
    plannedFrequencyBefore: beforeActiveDays,
    plannedFrequencyAfter: afterActiveDays,
    restDayBefore: before.restDay,
    restDayAfter: after.restDay
  };
}

export function describeJournalCoverage(workoutData) {
  const log = getProgramRevisionLog(workoutData);
  return {
    journalIntroducedAt: log.journalIntroducedAt,
    revisionCount: log.revisions.length,
    activationEventCount: log.activationEvents.length,
    datedExceptionCount: log.datedExceptions.length,
    pendingUncertainCount: log.pendingUncertain.length,
    provenanceVersion: log.provenanceVersion
  };
}

// Re-export helpers useful for callers / tests
export {
  describeDayPlanProvenance,
  PLAN_DAY_KIND,
  SNAPSHOT_STATUS,
  APPLICABILITY_CONFIDENCE
};
