/**
 * Dossier d'environnement pour comparer deux navigateurs sur la même période,
 * et expérience isolée : une seule séance ajoutée, sans réécrire l'historique.
 */

import { analysisEditionKey } from './analysisEdition';
import { RECAP_ADAPTIVE_WORKER_CONTRACT } from './recapAdaptiveWorkerContract';
import { summarizePublicationLifecycle } from './publicationLifecycleTrace';
import {
  downloadAnalysisBundle,
  downloadAnalysisJson,
  renderAuditMarkdown
} from './analysisExportDownload';

const COLUMNS = ['shortTerm', 'mediumTerm', 'longTerm'];

function evidenceText(card) {
  if (typeof card?.evidence === 'string') return card.evidence;
  if (Array.isArray(card?.evidence)) {
    return card.evidence.map((item) => String(item || '')).filter(Boolean).join(' · ');
  }
  return '';
}

export function listPublishedCards(insights) {
  if (!insights || typeof insights !== 'object') return [];
  const out = [];
  COLUMNS.forEach((column) => {
    const rows = insights[column];
    if (!Array.isArray(rows)) return;
    rows.forEach((card) => {
      const title = String(card?.title || '');
      const body = String(card?.body || card?.text || '');
      const evidence = evidenceText(card);
      out.push({
        column,
        kind: String(card?.kind || card?.context?.kind || ''),
        title,
        body,
        family: String(card?.family || card?.context?.family || ''),
        evidence,
        titleBlank: title.trim() === '',
        bodyBlank: body.trim() === ''
      });
    });
  });
  return out;
}

export function cardIdentity(card) {
  return `${card?.kind || ''}::${card?.title || ''}`;
}

/**
 * Phénomène : même kind + sujet + ancre, même si le titre a changé.
 * Sans sujet, on retombe sur la preuve puis le titre.
 */
export function phenomenonIdentity(card) {
  const metrics = card?.metrics || card?.context?.metrics || {};
  const subject = metrics.exerciseId || metrics.matchKey || metrics.name || '';
  const anchor = metrics.eventDate || metrics.lastDate || metrics.date || '';
  if (subject || anchor) return `${card?.kind || ''}|${subject}|${anchor}`;
  return `${card?.kind || ''}|${card?.evidence || ''}|${card?.title || ''}`;
}

function ymdOfKey(key) {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(String(key || ''));
  return match ? match[1] : null;
}

/**
 * Preuves de la fenêtre seulement. Le reste du snapshot n'est pas recopié.
 */
export function windowEvidence(snapshot, periodWindow) {
  const start = periodWindow?.start || null;
  const end = periodWindow?.end || null;
  if (!start || !end) return null;
  const inRange = (key) => {
    const ymd = ymdOfKey(key);
    return Boolean(ymd && ymd >= start && ymd <= end);
  };
  const pick = (source) => {
    const out = {};
    if (!source || typeof source !== 'object') return out;
    Object.keys(source).forEach((key) => {
      if (inRange(key)) out[key] = source[key];
    });
    return out;
  };
  const setLogs = pick(snapshot?.exerciseSetLogs);
  return {
    start,
    end,
    reps: pick(snapshot?.reps),
    checkedExercises: pick(snapshot?.checkedExercises),
    exerciseSetLogs: setLogs,
    repKeyCount: Object.keys(pick(snapshot?.reps)).length,
    checkedKeyCount: Object.keys(pick(snapshot?.checkedExercises)).length,
    setLogCount: Object.keys(setLogs).length
  };
}

function fnv1a(text) {
  let hash = 0x811c9dc5;
  const str = String(text || '');
  for (let i = 0; i < str.length; i += 1) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Empreinte analytique : détecte aussi les changements de charge, durée, date.
 * Ne se limite plus au nombre de clés et au total de répétitions.
 */
/**
 * Empreinte des données réellement consommées par le moteur.
 * Mission 23 — accepte un contexte (garminData, activeProgram, nameMap) car
 * programme / sommeil / noms vivent souvent hors du snapshot plat.
 */
export function snapshotFingerprint(snapshot, context = null) {
  const ctx = context && typeof context === 'object' ? context : {};
  const reps = snapshot?.reps && typeof snapshot.reps === 'object' ? snapshot.reps : {};
  const checked =
    snapshot?.checkedExercises && typeof snapshot.checkedExercises === 'object'
      ? snapshot.checkedExercises
      : {};
  // Mission 20 — les charges vivent sous exerciseWeights (pas snapshot.weights).
  const weights =
    snapshot?.exerciseWeights && typeof snapshot.exerciseWeights === 'object'
      ? snapshot.exerciseWeights
      : snapshot?.weights && typeof snapshot.weights === 'object'
        ? snapshot.weights
        : {};
  const setLogs =
    snapshot?.exerciseSetLogs && typeof snapshot.exerciseSetLogs === 'object'
      ? snapshot.exerciseSetLogs
      : {};
  const durations =
    snapshot?.sessionDurations && typeof snapshot.sessionDurations === 'object'
      ? snapshot.sessionDurations
      : snapshot?.durations && typeof snapshot.durations === 'object'
        ? snapshot.durations
        : {};
  let totalReps = 0;
  Object.values(reps).forEach((value) => {
    const n = Number(value);
    if (Number.isFinite(n)) totalReps += n;
  });
  const repKeys = Object.keys(reps).sort();
  const weightKeys = Object.keys(weights).sort();
  const setLogKeys = Object.keys(setLogs).sort();
  const durationKeys = Object.keys(durations).sort();
  // Mission 22 — sources influençant conclusions (GTG, défis, programme) entrent dans le digest.
  const gtgSync = snapshot?.enduranceData?.gtg?.workoutSync || {};
  const gtgDays = Object.keys(gtgSync).sort();
  const challenges =
    snapshot?.enduranceData?.challenges ||
    snapshot?.enduranceData?.activeChallenges ||
    snapshot?.challenges ||
    {};
  const challengeKeys = Object.keys(challenges).sort();
  const program =
    ctx.activeProgram ||
    snapshot?.activeProgram ||
    (Array.isArray(ctx.programs)
      ? ctx.programs.find((p) => p?.active) || ctx.programs[0]
      : null) ||
    (Array.isArray(snapshot?.programs)
      ? snapshot.programs.find((p) => p?.active) || snapshot.programs[0]
      : null);
  const programPayload = program
    ? `${program.id || ''}|${program.updatedAt || ''}|${JSON.stringify(program.schedule || {}).slice(0, 4000)}`
    : '';
  const garmin =
    ctx.garminData ||
    snapshot?.garminData ||
    null;
  const sleepMap =
    garmin?.sleep ||
    garmin?.dailyMetrics ||
    snapshot?.manualSleepByDate ||
    ctx.manualSleepByDate ||
    {};
  const garminSleepDays = Object.keys(sleepMap).sort();
  const nameMap = ctx.nameMap && typeof ctx.nameMap === 'object' ? ctx.nameMap : null;
  const nameMapKeys = nameMap ? Object.keys(nameMap).sort() : [];
  const nameMapDigest = nameMap
    ? fnv1a(nameMapKeys.slice(0, 800).map((k) => `${k}=${nameMap[k]}`).join('|'))
    : null;
  const payload = [
    repKeys.map((k) => `${k}=${reps[k]}`).join('|'),
    Object.keys(checked)
      .sort()
      .map((k) => `${k}=${checked[k] === true ? 1 : 0}`)
      .join('|'),
    weightKeys.map((k) => `${k}=${weights[k]}`).join('|'),
    setLogKeys.map((k) => `${k}=${JSON.stringify(setLogs[k])}`).join('|'),
    durationKeys.map((k) => `${k}=${durations[k]}`).join('|'),
    gtgDays.map((d) => `${d}=${JSON.stringify(gtgSync[d])}`).join('|'),
    challengeKeys.map((k) => `${k}=${JSON.stringify(challenges[k])}`).join('|'),
    programPayload,
    garminSleepDays.slice(0, 400).join('|'),
    nameMapDigest ? `nameMap:${nameMapDigest}` : 'nameMap:absent'
  ].join('||');
  return {
    version: 5,
    repKeys: repKeys.length,
    checkedKeys: Object.keys(checked).length,
    weightKeys: weightKeys.length,
    setLogKeys: setLogKeys.length,
    durationKeys: durationKeys.length,
    gtgSyncDays: gtgDays.length,
    challengeKeys: challengeKeys.length,
    programId: program?.id || null,
    garminSleepDays: garminSleepDays.length,
    nameMapSize: nameMapKeys.length,
    nameMapDigest,
    totalReps,
    digest: fnv1a(payload),
    firstRepKey: repKeys[0] || null,
    lastRepKey: repKeys[repKeys.length - 1] || null,
    sources: {
      weightsField: snapshot?.exerciseWeights ? 'exerciseWeights' : snapshot?.weights ? 'weights' : 'none',
      setLogsField: snapshot?.exerciseSetLogs ? 'exerciseSetLogs' : 'none',
      gtgField: snapshot?.enduranceData?.gtg ? 'enduranceData.gtg' : 'none',
      programField: program
        ? ctx.activeProgram
          ? 'context.activeProgram'
          : snapshot?.activeProgram
            ? 'snapshot.activeProgram'
            : 'programs[0]'
        : 'none',
      garminField: garmin
        ? garmin.sleep
          ? 'garmin.sleep'
          : garmin.dailyMetrics
            ? 'garmin.dailyMetrics'
            : 'garmin'
        : snapshot?.manualSleepByDate
          ? 'manualSleepByDate'
          : 'none',
      nameMapField: nameMap ? 'context.nameMap' : 'absent'
    }
  };
}

/**
 * Copie superficielle + une séance synthétique. Ne modifie pas l'original.
 */
export function snapshotWithIsolatedReps(
  snapshot,
  { date, reps, exerciseId = '__mission1_isolated_reps__' } = {}
) {
  const next = {
    ...(snapshot || {}),
    reps: { ...(snapshot?.reps || {}) },
    checkedExercises: { ...(snapshot?.checkedExercises || {}) }
  };
  if (!date) return next;
  const repKey = `${date}::${exerciseId}`;
  next.reps[repKey] = (Number(next.reps[repKey]) || 0) + (Number(reps) || 0);
  next.checkedExercises[`${date}_${exerciseId}`] = true;
  return next;
}

function stageHit(rows, card) {
  if (!Array.isArray(rows)) return false;
  return rows.some((row) => {
    const kind = String(row?.kind || row?.context?.kind || '');
    const title = String(row?.title || row?.context?.title || '');
    return kind === card.kind && title === card.title;
  });
}

/**
 * Première étape où une carte publiée avant l'ajout n'est plus dans le paquet après.
 */
export function classifyDisappearedCards(beforeCards, afterResult) {
  const shown = new Set(listPublishedCards(afterResult?.insights).map(phenomenonIdentity));
  const stages = afterResult?.diagnostic?.candidateStages || {};
  const pipeline = [
    ['produced', 'produced_then_rejected'],
    ['deduped', 'deduped'],
    ['afterDedup', 'dropped_after_dedup'],
    ['insufficient', 'insufficient'],
    ['valid', 'valid_not_selected'],
    ['rankedOut', 'ranked_out'],
    ['shown', 'shown']
  ];
  return (beforeCards || [])
    .filter((card) => !shown.has(phenomenonIdentity(card)))
    .map((card) => {
      let lastStage = 'absent_from_producers';
      pipeline.forEach(([key, label]) => {
        if (stageHit(stages[key], card)) lastStage = label;
      });
      return { kind: card.kind, title: card.title, lastStage };
    });
}

export function readBrowserEnvironment() {
  if (typeof window === 'undefined') return { runtime: 'non-browser' };
  let serviceWorker = null;
  try {
    serviceWorker = navigator.serviceWorker?.controller?.scriptURL || null;
  } catch {
    serviceWorker = null;
  }
  return {
    runtime: 'browser',
    href: window.location.href,
    origin: window.location.origin,
    language: navigator.language,
    languages: navigator.languages ? [...navigator.languages] : [],
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    userAgent: navigator.userAgent,
    serviceWorker
  };
}

function compactHistoryEntry(entry) {
  return {
    id: entry.id,
    theme: entry.theme,
    seenAt: entry.seenAt,
    count: entry.count,
    claim: entry.claim || null
  };
}

/**
 * L'historique stocké est trié du plus récent au plus ancien.
 * `recent` suit cet ordre : les 12 premières sont les plus récentes.
 * L'export du 18 novembre prenait `slice(-12)`, donc les 12 plus anciennes.
 */
export function summarizeInsightHistory(history, signature) {
  const entries = Array.isArray(history?.entries) ? history.entries : [];
  const newestFirst = [...entries].sort((a, b) => (Number(b.seenAt) || 0) - (Number(a.seenAt) || 0));
  const compact = newestFirst.map(compactHistoryEntry);
  return {
    version: history?.version || 0,
    count: entries.length,
    signature: signature || null,
    order: 'newest_first',
    newest: compact.slice(0, 12),
    oldest: compact.slice(-12),
    recent: compact.slice(0, 12),
    entries: compact
  };
}

export function parseInsightSignature(signature) {
  if (typeof signature !== 'string' || !signature) return null;
  const parts = signature.split('|');
  if (parts.length < 10) return { raw: signature, complete: false };
  return {
    raw: signature,
    complete: true,
    period: parts[0],
    windowStart: parts[1],
    windowEnd: parts[2],
    runningKm: parts[3],
    runningSessions: parts[4],
    streakCurrent: parts[5],
    completionPct: parts[6],
    periodRepsField: parts[7],
    candidateCount: Number(parts[8]),
    hash: parts[9],
    note: 'candidateCount compte les candidats du dernier calcul enregistré, pas les cartes publiées.'
  };
}

export function publicationPackState({ analysisStatus = null, publication = null } = {}) {
  const published = publication?.status === 'ready' && publication?.complete === true;
  if (analysisStatus === 'refreshing' && published) {
    return {
      state: 'previous_edition_while_refreshing',
      analysisStatus,
      publicationStatus: publication.status,
      complete: true,
      definitive: false
    };
  }
  if (analysisStatus === 'ready' && published) {
    return {
      state: 'published_current',
      analysisStatus,
      publicationStatus: publication.status,
      complete: true,
      definitive: true
    };
  }
  if (analysisStatus === 'error') {
    return { state: 'error', analysisStatus, definitive: false };
  }
  if (analysisStatus === 'loading' || analysisStatus === 'refreshing') {
    return { state: analysisStatus, analysisStatus, definitive: false };
  }
  return { state: 'unresolved', analysisStatus, definitive: false };
}

export function buildAnalysisEnvironmentDossier({
  period,
  periodWindow,
  assessment,
  calendar,
  measure,
  history,
  signature,
  snapshot,
  analysisStatus,
  analysisPeriod,
  experiment,
  mode,
  publicationTrace = null
} = {}) {
  const cards = listPublishedCards(assessment?.insights);
  const banner = calendar?.periodStats
    ? {
        totalReps: calendar.periodStats.totalReps,
        trainingDays: calendar.periodStats.trainingDays,
        totalMinutes: calendar.periodStats.totalMinutes,
        otherExerciseMinutes: calendar.periodStats.otherExerciseMinutes,
        runningMinutes: calendar.periodStats.runningMinutes,
        totalKg: calendar.periodStats.totalKg,
        activeKcal: calendar.periodStats.activeKcal,
        longestStreak: calendar.periodStats.longestStreak,
        streakRange: calendar.streakRange || null
      }
    : null;
  const measured = measure
    ? {
        totalReps: measure.totalReps,
        trainingDays: measure.trainingDays,
        strengthDays: measure.strengthDays,
        minutes: measure.minutes,
        totalMinutes: measure.totalMinutes,
        runningMinutes: measure.runningMinutes,
        activeKcal: measure.activeKcal
      }
    : null;
  return {
    schema: 'momentum.analysisEnvironmentDossier.v1',
    capturedAt: new Date().toISOString(),
    mode: mode || null,
    environment: readBrowserEnvironment(),
    period: period || null,
    window: periodWindow || null,
    analysisStatus: analysisStatus || null,
    analysisPeriod: analysisPeriod || null,
    publication: assessment?.insightsPublication || null,
    snapshot: snapshotFingerprint(snapshot),
    windowEvidence: windowEvidence(snapshot, periodWindow),
    banner,
    measure: measured,
    durationAgreement:
      banner && measured
        ? {
            bannerTotalMinutes: banner.totalMinutes,
            measureTotalMinutes: measured.totalMinutes,
            measureOtherMinutes: measured.minutes,
            sameTotal: Number(banner.totalMinutes) === Number(measured.totalMinutes)
          }
        : null,
    cardCount: cards.length,
    cards,
    editorialHistory: summarizeInsightHistory(history, signature),
    experiment: experiment || null,
    engine: {
      edition: analysisEditionKey(),
      workerContract: RECAP_ADAPTIVE_WORKER_CONTRACT
    },
    packState: publicationPackState({
      analysisStatus,
      publication: assessment?.insightsPublication
    }),
    publicationTrace: Array.isArray(publicationTrace) ? publicationTrace.slice(-80) : null,
    publicationLifecycle: summarizePublicationLifecycle(publicationTrace)
  };
}

export function downloadAnalysisDossier(dossier, { filename = null, markdown = null, bundleZip = true } = {}) {
  if (!dossier || dossier.refused) {
    return { ok: false, reason: dossier?.reason || 'refused' };
  }
  const period = dossier?.period || dossier?.requestedPeriod || dossier?.schema || 'period';
  const stamp = String(dossier?.capturedAt || new Date().toISOString()).replace(/[:.]/g, '-');
  const md =
    markdown === false ? null : typeof markdown === 'string' ? markdown : renderAuditMarkdown(dossier);
  if (bundleZip !== false && md) {
    return downloadAnalysisBundle({
      json: dossier,
      markdown: md,
      basename: filename
        ? String(filename).replace(/\.json$/i, '').replace(/\.zip$/i, '')
        : `momentum-analysis-${period}`
    });
  }
  return downloadAnalysisJson(dossier, {
    filename: filename || `momentum-analysis-dossier-${period}-${stamp}.json`
  });
}

/**
 * Relance le moteur sur une copie du snapshot avec une seule séance ajoutée.
 * N'écrit pas l'historique éditorial.
 */
export async function runIsolatedRepExperiment({
  snapshot,
  addition,
  window,
  period,
  garminData = null,
  garminPartial = null,
  garminDailyMetrics = null,
  getExerciseNameById = null,
  profileQuestionnaireRaw = null,
  activeProgram = null,
  programs = null,
  assessment = null,
  recapState = null,
  enrichment = null,
  publishedInsights = null
} = {}) {
  const { buildAdaptiveRecapInsights } = await import('./recapAdaptiveInsights');
  const { loadInsightHistory, loadLastInsightSignature } = await import('./insightNoveltyStore');
  const history = loadInsightHistory();
  const signature = loadLastInsightSignature();
  const common = {
    window,
    period,
    garminData,
    garminPartial,
    garminDailyMetrics,
    getExerciseNameById,
    profileQuestionnaireRaw,
    activeProgram,
    programs,
    assessment,
    recapState,
    enrichment,
    insightHistory: history,
    lastInsightSignature: signature,
    collectDiagnostic: true,
    persistHistory: false
  };
  const baseline = buildAdaptiveRecapInsights({ ...common, snapshot });
  const nextSnapshot = snapshotWithIsolatedReps(snapshot, addition);
  const after = buildAdaptiveRecapInsights({ ...common, snapshot: nextSnapshot });
  const beforeCards = listPublishedCards(baseline?.insights);
  const afterCards = listPublishedCards(after?.insights);
  const beforeIds = new Set(beforeCards.map(cardIdentity));
  const counts = new Map();
  beforeCards.forEach((card) => {
    const id = cardIdentity(card);
    counts.set(id, (counts.get(id) || 0) + 1);
  });
  const displayed = listPublishedCards(publishedInsights);
  const displayedIds = new Set(displayed.map(cardIdentity));
  return {
    addition: {
      date: addition?.date || null,
      reps: Number(addition?.reps) || 0,
      exerciseId: addition?.exerciseId || '__mission1_isolated_reps__'
    },
    note: 'Deux passages du moteur actuel, sur une copie. Le snapshot réel et l’historique éditorial ne sont pas modifiés.',
    displayedCount: displayed.length,
    beforeCount: beforeCards.length,
    afterCount: afterCards.length,
    disappeared: classifyDisappearedCards(beforeCards, after),
    appeared: afterCards
      .filter((card) => !beforeIds.has(cardIdentity(card)))
      .map((card) => ({ kind: card.kind, title: card.title, column: card.column })),
    baselineTitles: beforeCards.map((card) => card.title),
    afterTitles: afterCards.map((card) => card.title),
    baselineKcal: beforeCards.find((card) => card.kind === 'disc_kcal_profile') || null,
    afterKcal: afterCards.find((card) => card.kind === 'disc_kcal_profile') || null,
    duplicateBaseline: [...counts.entries()]
      .filter(([, n]) => n > 1)
      .map(([id, n]) => ({ id, n })),
    fieldSemantics: 'names-match-filters',
    freshAbsentFromDisplayed: beforeCards
      .filter((card) => !displayedIds.has(cardIdentity(card)))
      .map((card) => ({ kind: card.kind, title: card.title })),
    displayedAbsentFromFresh: displayed
      .filter((card) => !beforeIds.has(cardIdentity(card)))
      .map((card) => ({ kind: card.kind, title: card.title }))
  };
}

function numericDelta(left, right) {
  const l = left == null ? null : Number(left);
  const r = right == null ? null : Number(right);
  return {
    left: Number.isFinite(l) ? l : null,
    right: Number.isFinite(r) ? r : null,
    delta: Number.isFinite(l) && Number.isFinite(r) ? r - l : null
  };
}

function experimentLists(dossier) {
  const experiment = dossier?.experiment;
  if (!experiment) return null;
  const namesMatch = experiment.fieldSemantics === 'names-match-filters';
  const freshAbsent = namesMatch
    ? experiment.freshAbsentFromDisplayed
    : experiment.displayedMissingFromFresh;
  const displayedAbsent = namesMatch
    ? experiment.displayedAbsentFromFresh
    : experiment.freshMissingFromDisplayed;
  return {
    fieldSemantics: namesMatch ? 'names-match-filters' : 'inverted-names-2026-11-18',
    displayedCount: experiment.displayedCount ?? null,
    freshCount: experiment.beforeCount ?? null,
    afterIsolatedAdditionCount: experiment.afterCount ?? null,
    disappeared: experiment.disappeared || [],
    appeared: experiment.appeared || [],
    freshAbsentFromDisplayed: freshAbsent || [],
    displayedAbsentFromFresh: displayedAbsent || []
  };
}

/**
 * Compare deux dossiers déjà capturés. N'invente pas les snapshots ni les historiques absents.
 */
export function compareAnalysisEnvironmentDossiers(left, right, labels = {}) {
  const leftName = labels.left || 'left';
  const rightName = labels.right || 'right';
  const leftCards = Array.isArray(left?.cards) ? left.cards : [];
  const rightCards = Array.isArray(right?.cards) ? right.cards : [];
  const leftBy = new Map();
  const rightBy = new Map();
  leftCards.forEach((card) => {
    const key = phenomenonIdentity(card);
    leftBy.set(key, [...(leftBy.get(key) || []), card]);
  });
  rightCards.forEach((card) => {
    const key = phenomenonIdentity(card);
    rightBy.set(key, [...(rightBy.get(key) || []), card]);
  });
  const shared = [];
  const leftOnly = [];
  const rightOnly = [];
  const changedProof = [];
  leftBy.forEach((rows, key) => {
    if (!rightBy.has(key)) {
      rows.forEach((card) => leftOnly.push({ key, ...card }));
      return;
    }
    const other = rightBy.get(key)[0];
    const card = rows[0];
    shared.push({ key, kind: card.kind, title: card.title, evidence: card.evidence });
    if ((card.evidence || '') !== (other.evidence || '') || (card.title || '') !== (other.title || '')) {
      changedProof.push({
        key,
        left: { title: card.title, evidence: card.evidence },
        right: { title: other.title, evidence: other.evidence }
      });
    }
  });
  rightBy.forEach((rows, key) => {
    if (!leftBy.has(key)) rows.forEach((card) => rightOnly.push({ key, ...card }));
  });
  const duplicates = (cards, by) =>
    [...by.entries()]
      .filter(([, rows]) => rows.length > 1)
      .map(([key, rows]) => ({ key, n: rows.length, titles: rows.map((card) => card.title) }));
  const blank = (cards) =>
    cards
      .filter((card) => !String(card.title || '').trim() || card.titleBlank)
      .map((card) => ({
        column: card.column,
        kind: card.kind,
        title: card.title,
        body: card.body || '',
        evidence: card.evidence || '',
        exportOmittedBody: card.body == null
      }));
  const kinds = (cards) => new Set(cards.map((card) => card.kind || ''));
  const leftKinds = kinds(leftCards);
  const rightKinds = kinds(rightCards);
  const sameKindDifferentProof = [...leftKinds]
    .filter((kind) => kind && rightKinds.has(kind))
    .map((kind) => ({
      kind,
      left: leftCards.filter((card) => card.kind === kind).map((card) => ({ title: card.title, evidence: card.evidence })),
      right: rightCards.filter((card) => card.kind === kind).map((card) => ({ title: card.title, evidence: card.evidence }))
    }))
    .filter((row) => JSON.stringify(row.left) !== JSON.stringify(row.right));
  const leftHistory = left?.editorialHistory || {};
  const rightHistory = right?.editorialHistory || {};
  const historyReplayable = Array.isArray(leftHistory.entries) && Array.isArray(rightHistory.entries);
  return {
    schema: 'momentum.analysisDossierDiff.v1',
    labels: { left: leftName, right: rightName },
    limits: [
      'Les dossiers ne contiennent pas les répétitions, les séries ni les charges : seulement des compteurs.',
      'L’identité de phénomène retombe sur kind + preuve + titre, faute de sujet et d’ancre dans l’export.',
      historyReplayable
        ? 'Les historiques complets sont présents : un rejeu en mémoire est possible.'
        : 'Les historiques complets sont absents. Les douze entrées exportées le 18 novembre sont les plus anciennes de la liste, pas les dernières consultations. Aucun rejeu des 180 et 73 entrées n’est fait à partir d’elles.',
      'Le passage frais n’existe dans le fichier que pour le dossier qui a lancé l’expérience.'
    ],
    environment: {
      left: left?.environment || null,
      right: right?.environment || null,
      sameOrigin: left?.environment?.origin === right?.environment?.origin,
      serviceWorker: {
        left: left?.environment?.serviceWorker || null,
        right: right?.environment?.serviceWorker || null
      },
      language: {
        left: left?.environment?.language || null,
        right: right?.environment?.language || null
      },
      engine: {
        left: left?.engine || null,
        right: right?.engine || null,
        comparable: Boolean(left?.engine?.edition && right?.engine?.edition)
      }
    },
    window: {
      left: left?.window || null,
      right: right?.window || null,
      sameCalendarBounds:
        left?.window?.start === right?.window?.start && left?.window?.end === right?.window?.end
    },
    snapshot: {
      repKeys: numericDelta(left?.snapshot?.repKeys, right?.snapshot?.repKeys),
      checkedKeys: numericDelta(left?.snapshot?.checkedKeys, right?.snapshot?.checkedKeys),
      totalReps: numericDelta(left?.snapshot?.totalReps, right?.snapshot?.totalReps)
    },
    banner: {
      totalReps: numericDelta(left?.banner?.totalReps, right?.banner?.totalReps),
      trainingDays: numericDelta(left?.banner?.trainingDays, right?.banner?.trainingDays),
      totalMinutes: numericDelta(left?.banner?.totalMinutes, right?.banner?.totalMinutes),
      totalKg: numericDelta(left?.banner?.totalKg, right?.banner?.totalKg),
      activeKcal: numericDelta(left?.banner?.activeKcal, right?.banner?.activeKcal)
    },
    publication: {
      left: publicationPackState({
        analysisStatus: left?.analysisStatus,
        publication: left?.publication
      }),
      right: publicationPackState({
        analysisStatus: right?.analysisStatus,
        publication: right?.publication
      })
    },
    signatures: {
      left: parseInsightSignature(left?.editorialHistory?.signature),
      right: parseInsightSignature(right?.editorialHistory?.signature)
    },
    history: {
      leftCount: leftHistory.count ?? null,
      rightCount: rightHistory.count ?? null,
      replayable: historyReplayable,
      leftListed: (leftHistory.recent || []).length,
      rightListed: (rightHistory.recent || []).length
    },
    cards: {
      leftCount: left?.cardCount ?? leftCards.length,
      rightCount: right?.cardCount ?? rightCards.length,
      shared,
      leftOnly,
      rightOnly,
      changedProof,
      sameKindDifferentProof,
      duplicates: {
        left: duplicates(leftCards, leftBy),
        right: duplicates(rightCards, rightBy)
      },
      blankTitle: {
        left: blank(leftCards),
        right: blank(rightCards)
      }
    },
    experiments: {
      left: experimentLists(left),
      right: experimentLists(right)
    }
  };
}
