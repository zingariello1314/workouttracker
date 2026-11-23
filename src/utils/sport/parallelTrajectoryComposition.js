/**
 * Mission 24/26 — trajectoires parallèles (enregistrements de stockage distincts).
 * Ne fusionne pas les identités ; compose une lecture structurelle informative.
 * Mission 26 — refuse le faux parallèle « deux cartes / même exercice ».
 */

import { claimFromDiscovery } from './analyticalClaim';
import { substantiveEquivalence, stablePublicationId, subjectKey } from './discoveryIdentity';
import { justifyParentChildLink } from './hierarchyLink';
import {
  resolvePrimaryWindowSessionPopulation,
  validateSumMeanSampleConsistency
} from './recapMetricContract';

function cleanTitle(row) {
  return String(row?.discovery?.title || row?.title || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** Identité de stockage sportive (pas une carte, pas un producteur). */
export function isConcreteStorageSubject(sub) {
  const s = String(sub || '');
  return s.startsWith('ex:') || s.startsWith('match:') || s.startsWith('grp:');
}

function numMetric(v) {
  if (v == null) return null;
  if (typeof v === 'object' && v.value != null) {
    const n = Number(v.value);
    return Number.isFinite(n) ? n : null;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * Mission 28 — contrat métrique strict.
 * Totaux de fenêtre ≠ moyennes par séance ≠ moyennes de phase.
 * Ne jamais récupérer une moyenne pour combler un total manquant.
 */
function extractWindowTotalReps(d, m) {
  const ordered = [
    m.windowTotalReps,
    m.recentReps,
    m.currentReps,
    m.totalReps,
    m.periodReps,
    m.reps
  ];
  for (const c of ordered) {
    const n = numMetric(c);
    if (n != null && n > 0) return n;
  }
  const ovs = [
    ...(Array.isArray(m.observedValues) ? m.observedValues : []),
    ...(Array.isArray(d?.claim?.proof?.observedValues) ? d.claim.proof.observedValues : [])
  ];
  const prefer = ['windowTotalReps', 'recentReps', 'currentReps', 'totalReps', 'periodReps'];
  for (const id of prefer) {
    const hit = ovs.find((v) => v?.id === id || String(v?.id || '').endsWith(id));
    if (/mean|avg|perSession|arc(Late|Early)/i.test(String(hit?.id || ''))) continue;
    const n = numMetric(hit?.value ?? hit);
    if (n != null && n > 0) return n;
  }
  return null;
}

function extractPerSessionMean(d, m) {
  const ordered = [m.windowMeanPerSession, m.arcLateMean, m.recentMean, m.meanReps, m.avgReps];
  for (const c of ordered) {
    const n = numMetric(c);
    if (n != null && n > 0) return n;
  }
  const ovs = [
    ...(Array.isArray(m.observedValues) ? m.observedValues : []),
    ...(Array.isArray(d?.claim?.proof?.observedValues) ? d.claim.proof.observedValues : [])
  ];
  for (const id of ['windowMeanPerSession', 'arcLateMean', 'meanReps', 'avgReps']) {
    const hit = ovs.find((v) => v?.id === id || String(v?.id || '').endsWith(id));
    const n = numMetric(hit?.value ?? hit);
    if (n != null && n > 0) return n;
  }
  return null;
}

/** @deprecated alias — totaux uniquement */
function extractRecentReps(d, m) {
  return extractWindowTotalReps(d, m);
}

function extractPrevReps(d, m) {
  // Comparateur antérieur : totaux de fenêtre uniquement (pas arcEarlyMean / priorAvg)
  const ordered = [m.prevReps, m.priorTotal, m.beforeTotal, m.habitualReps];
  for (const c of ordered) {
    const n = numMetric(c);
    if (n != null && n > 0) return n;
  }
  const ovs = [
    ...(Array.isArray(m.observedValues) ? m.observedValues : []),
    ...(Array.isArray(d?.claim?.proof?.observedValues) ? d.claim.proof.observedValues : [])
  ];
  for (const id of ['prevReps', 'priorTotal', 'beforeTotal', 'habitualReps']) {
    const hit = ovs.find((v) => v?.id === id || String(v?.id || '').includes(id));
    if (/mean|avg|arcEarly|priorAvg|beforeMed|median/i.test(String(hit?.id || ''))) continue;
    const n = numMetric(hit?.value ?? hit);
    if (n != null && n > 0) return n;
  }
  return null;
}

function extractPrevPerSessionMean(d, m) {
  const ordered = [m.prevMeanPerSession, m.arcEarlyMean, m.priorAvg, m.beforeMed, m.habitualMedian];
  for (const c of ordered) {
    const n = numMetric(c);
    if (n != null && n > 0) return n;
  }
  return null;
}

function sessionFingerprint(row) {
  const d = row?.discovery || row;
  const m = d?.metrics || {};
  // Mission 30 — effectif lié aux totaux de fenêtre, pas à la longueur de l’arc.
  const population = resolvePrimaryWindowSessionPopulation(m);
  const dates = population.dates;
  const reps = extractWindowTotalReps(d, m);
  const prev = extractPrevReps(d, m);
  const meanPerSession = extractPerSessionMean(d, m);
  const prevMeanPerSession = extractPrevPerSessionMean(d, m);
  const consistency = validateSumMeanSampleConsistency({
    total: reps,
    mean: meanPerSession,
    sampleSize: population.sessionCount,
    comparable: population.comparableForSumMean !== false && population.sessionCount != null
  });
  return {
    dates,
    dateKey: dates.join(','),
    sessionCount: population.sessionCount,
    populationSource: population.source,
    populationReferent: population.referent,
    populationDistinctFromArc: population.distinctFromArc,
    metricConsistency: consistency,
    reps,
    prevReps: prev,
    meanPerSession,
    prevMeanPerSession,
    // Unité effective pour la comparaison volume (jamais mélanger mean↔total)
    volumeKind: reps != null || prev != null ? 'window_total' : meanPerSession != null ? 'per_session_mean' : null,
    family: d?.family || m.family || null,
    producer: m.producer || d?.kind || null,
    kind: d?.kind || null
  };
}

/**
 * Dimension analytique du parallèle (≠ sujet).
 * Mission 27 — deux lectures du même couple d’exercices restent distinctes
 * si la fenêtre d’observation / le motif diffèrent (ex. ~8 séances vs ~4).
 */
function parallelPhenomenonAspect(fingerprints, obsSpan) {
  const dateSig = fingerprints
    .map((f) => f.dateKey || '')
    .filter(Boolean)
    .sort()
    .join('~');
  const spanBucket =
    obsSpan == null ? 'span:na' : obsSpan <= 35 ? 'span:recent30' : obsSpan <= 100 ? 'span:quarter' : 'span:long';
  const sess = fingerprints.map((f) => f.sessionCount).filter((n) => n != null);
  const meanSess =
    sess.length > 0 ? Math.round(sess.reduce((a, b) => a + b, 0) / sess.length) : null;
  const sessBucket = meanSess == null ? 'sess:na' : `sess:${meanSess}`;
  // Empreinte courte stable des calendriers (pas le titre)
  let h = 0;
  for (let i = 0; i < dateSig.length; i += 1) h = (h * 31 + dateSig.charCodeAt(i)) >>> 0;
  const dateHash = dateSig ? h.toString(36).slice(0, 8) : 'nodates';
  return `${spanBucket}|${sessBucket}|cal:${dateHash}`;
}

function similarTrajectories(a, b) {
  const fa = sessionFingerprint(a);
  const fb = sessionFingerprint(b);
  if (fa.sessionCount != null && fb.sessionCount != null) {
    if (Math.abs(fa.sessionCount - fb.sessionCount) > 1) return false;
  }
  if (fa.reps != null && fb.reps != null && fa.reps > 0 && fb.reps > 0) {
    const ratio = Math.max(fa.reps, fb.reps) / Math.min(fa.reps, fb.reps);
    if (ratio > 1.35) return false;
  }
  // Même calendrier exact → souvent le même enregistrement vu par deux producteurs
  if (fa.dateKey && fa.dateKey === fb.dateKey && fa.dateKey.length > 0) {
    return false;
  }
  if (fa.dates.length >= 2 && fb.dates.length >= 2) {
    return true;
  }
  return fa.sessionCount >= 2 && fb.sessionCount >= 2;
}

function horizonDaysOf(voiceKey) {
  const map = {
    today: 1,
    week: 7,
    month: 30,
    quarter: 90,
    '3m': 90,
    half: 180,
    '6m': 180,
    year: 365,
    '1y': 365,
    '2y': 730,
    all: 900
  };
  return map[voiceKey] ?? null;
}

function daysBetween(a, b) {
  if (!a || !b) return null;
  return Math.round((new Date(`${b}T12:00:00`) - new Date(`${a}T12:00:00`)) / 86400000);
}

/**
 * Regroupe uniquement des sujets de stockage concrets et distincts.
 * Deux producteurs du même exercice ≠ deux créneaux.
 */
export function findParallelTrajectoryClusters(rows = []) {
  const byTitle = new Map();
  (rows || []).forEach((row, index) => {
    const title = cleanTitle(row);
    if (!title || title.length < 8) return;
    if (!byTitle.has(title)) byTitle.set(title, []);
    byTitle.get(title).push({ row, index });
  });

  const clusters = [];
  for (const [title, members] of byTitle) {
    if (members.length < 2) continue;
    const pairs = [];
    for (let i = 0; i < members.length; i += 1) {
      for (let j = i + 1; j < members.length; j += 1) {
        const left = members[i].row;
        const right = members[j].row;
        const leftSub = subjectKey(left.discovery || left);
        const rightSub = subjectKey(right.discovery || right);
        // Mission 26 — cause racine : ne jamais compter deux cartes du même exercice
        if (!isConcreteStorageSubject(leftSub) || !isConcreteStorageSubject(rightSub)) continue;
        if (leftSub === rightSub) continue;

        const eq = substantiveEquivalence(left.discovery || left, right.discovery || right);
        // Équivalence vraie (même sujet) déjà exclue ; on veut similarité à sujets distincts
        if (eq.equivalent === true && eq.reason !== 'same_title_distinct_subjects') continue;
        if (
          eq.reason !== 'same_title_distinct_subjects' &&
          eq.reason !== 'same_title_unresolved_subjects' &&
          eq.reason !== 'distinct_subjects'
        ) {
          const lt = cleanTitle(left);
          const rt = cleanTitle(right);
          if (lt !== rt) continue;
        }
        if (!similarTrajectories(left, right)) continue;
        pairs.push([members[i], members[j], eq, leftSub, rightSub]);
      }
    }
    if (!pairs.length) continue;
    const used = new Set();
    const group = [];
    members.forEach((m) => {
      if (used.has(m.index)) return;
      const related = pairs.some(
        ([a, b]) => a.index === m.index || b.index === m.index || group.some((g) => g.index === a.index || g.index === b.index)
      );
      if (related || pairs.some(([a, b]) => a.index === m.index || b.index === m.index)) {
        group.push(m);
        used.add(m.index);
      }
    });
    const uniqueSubjects = new Set(
      group.map((m) => subjectKey(m.row.discovery || m.row)).filter(isConcreteStorageSubject)
    );
    if (group.length >= 2 && uniqueSubjects.size >= 2) {
      clusters.push({ title, members: group, uniqueSubjects: [...uniqueSubjects] });
    }
  }
  return clusters;
}

function displayName(row) {
  const d = row?.discovery || row;
  return (
    d?.metrics?.name ||
    d?.metrics?.exerciseName ||
    String(d?.title || '').split(':')[0].trim() ||
    'mouvement'
  );
}

function collectSourceEvents(members) {
  const events = [];
  const seen = new Set();
  members.forEach((row) => {
    const d = row?.discovery || row;
    const claim = row?.claim || d?.claim || null;
    const fromClaim = Array.isArray(claim?.proof?.sourceEvents) ? claim.proof.sourceEvents : [];
    const dates = sessionFingerprint(row).dates;
    fromClaim.forEach((e) => {
      const id = e?.id || e?.date || JSON.stringify(e);
      if (seen.has(id)) return;
      seen.add(id);
      events.push(e);
    });
    dates.forEach((date) => {
      const id = `session:${date}:${subjectKey(d)}`;
      if (seen.has(id)) return;
      seen.add(id);
      events.push({ id, date, subject: subjectKey(d), kind: 'session' });
    });
  });
  return events.slice(0, 24);
}

/**
 * Compose une lecture structurelle informative et marque les membres comme approfondissements.
 */
export function applyParallelTrajectoryComposition(rows = [], { voiceKey = null, window = null } = {}) {
  const working = [...(rows || [])];
  const clusters = findParallelTrajectoryClusters(working);
  const composed = [];
  const decisions = [];
  const rejectedSameSubject = [];

  // Instrumentation : paires même sujet écartées (pour audit / non-régression)
  (rows || []).forEach((row, index) => {
    const title = cleanTitle(row);
    if (!title) return;
    for (let j = index + 1; j < (rows || []).length; j += 1) {
      if (cleanTitle(rows[j]) !== title) continue;
      const a = subjectKey(row.discovery || row);
      const b = subjectKey(rows[j].discovery || rows[j]);
      if (isConcreteStorageSubject(a) && a === b) {
        rejectedSameSubject.push({
          title,
          subject: a,
          reason: 'same_storage_subject_not_parallel',
          producers: [row.discovery?.kind || row.kind, rows[j].discovery?.kind || rows[j].kind]
        });
      }
    }
  });

  clusters.forEach((cluster) => {
    const members = cluster.members.map((m) => m.row);
    const fingerprints = members.map(sessionFingerprint);
    const name = displayName(members[0]);
    const uniqueSubjects = [
      ...new Set(members.map((r) => subjectKey(r.discovery || r)).filter(isConcreteStorageSubject))
    ];
    if (uniqueSubjects.length < 2) {
      decisions.push({
        action: 'skip_parallel_same_subject',
        reason: 'insufficient_distinct_storage_subjects',
        subjects: uniqueSubjects,
        title: cluster.title
      });
      return;
    }

    const trajectories = members.map((r, i) => {
      const fp = fingerprints[i];
      const sub = subjectKey(r.discovery || r);
      const canDelta = fp.reps != null && fp.prevReps != null && fp.prevReps > 0;
      const meanDelta =
        !canDelta &&
        fp.meanPerSession != null &&
        fp.prevMeanPerSession != null &&
        fp.prevMeanPerSession > 0
          ? Math.round(fp.meanPerSession - fp.prevMeanPerSession)
          : null;
      return {
        subject: sub,
        name: displayName(r),
        recentReps: fp.reps,
        prevReps: fp.prevReps,
        meanPerSession: fp.meanPerSession,
        prevMeanPerSession: fp.prevMeanPerSession,
        volumeKind: fp.volumeKind,
        sessions: fp.sessionCount,
        dates: fp.dates,
        family: fp.family,
        producer: fp.producer,
        delta: canDelta ? Math.round(fp.reps - fp.prevReps) : meanDelta,
        deltaKind: canDelta ? 'window_total' : meanDelta != null ? 'per_session_mean' : null
      };
    });

    const sessionCounts = fingerprints.map((f) => f.sessionCount).filter((n) => n != null);
    const reps = fingerprints.map((f) => f.reps).filter((n) => Number.isFinite(n));
    const means = fingerprints.map((f) => f.meanPerSession).filter((n) => Number.isFinite(n));
    const meanSessions =
      sessionCounts.length > 0
        ? Math.round(sessionCounts.reduce((s, n) => s + n, 0) / sessionCounts.length)
        : null;
    // meanReps = moyenne des TOTAUX de trajectoire ; sinon moyenne des moyennes/séance (étiquette distincte)
    const volumeBasis = reps.length >= 2 ? 'window_total' : means.length >= 2 ? 'per_session_mean' : null;
    const meanReps =
      volumeBasis === 'window_total'
        ? Math.round(reps.reduce((s, n) => s + n, 0) / reps.length)
        : volumeBasis === 'per_session_mean'
          ? Math.round(means.reduce((s, n) => s + n, 0) / means.length)
          : null;
    const compareSeries = volumeBasis === 'window_total' ? reps : means;
    const allDates = fingerprints.flatMap((f) => f.dates).filter(Boolean).sort();
    const obsStart = allDates[0] || window?.start || null;
    const obsEnd = allDates[allDates.length - 1] || window?.end || null;
    const obsSpan = daysBetween(obsStart, obsEnd);
    const hDays = horizonDaysOf(voiceKey);
    const temporalMismatch =
      hDays != null && hDays >= 90 && obsSpan != null && obsSpan > 0 && obsSpan < hDays * 0.45;

    const converged =
      compareSeries.length >= 2 &&
      Math.max(...compareSeries) / Math.min(...compareSeries) <= 1.15;
    const deltas = trajectories.map((t) => t.delta).filter((n) => n != null);
    const allRising = deltas.length >= 2 && deltas.every((d) => d > 0);

    const trajBits = trajectories
      .slice(0, 4)
      .map((t, idx) => {
        const label = trajectories.length === 2 ? (idx === 0 ? 'première trajectoire' : 'seconde trajectoire') : `trajectoire ${idx + 1}`;
        let recent;
        let prev = '';
        if (t.recentReps != null) {
          recent = `${t.recentReps} répétitions (total fenêtre)`;
          if (t.prevReps != null) {
            prev = ` (réf. antérieure ${t.prevReps}${t.delta != null ? `, Δ${t.delta > 0 ? '+' : ''}${t.delta}` : ''})`;
          }
        } else if (t.meanPerSession != null) {
          recent = `≈${t.meanPerSession} répétitions/séance`;
          if (t.prevMeanPerSession != null) {
            prev = ` (réf. antérieure ≈${t.prevMeanPerSession}/séance${
              t.delta != null ? `, Δ${t.delta > 0 ? '+' : ''}${t.delta}` : ''
            })`;
          } else {
            prev = ' (comparateur total antérieur absent — pas de delta de volume de fenêtre)';
          }
        } else {
          recent = 'volume récent non chiffré';
        }
        const sess = t.sessions != null ? ` sur ${t.sessions} séances` : '';
        return `${label} : ${recent}${prev}${sess}`;
      })
      .join(' ; ');

    const aspect = parallelPhenomenonAspect(fingerprints, obsSpan);
    const title = `${name} : ${uniqueSubjects.length} trajectoires parallèles${
      meanSessions != null ? ` (~${meanSessions} séances)` : ''
    }`;
    const volumeUnitLabel =
      volumeBasis === 'per_session_mean' ? 'répétitions/séance' : 'répétitions (total fenêtre)';
    const body = [
      converged && meanReps != null
        ? `Les ${uniqueSubjects.length} trajectoires de ${name} convergent vers environ ${meanReps} ${volumeUnitLabel} chacune sur la fenêtre d’observation (${obsStart} → ${obsEnd}).`
        : `${uniqueSubjects.length} trajectoires distinctes de ${name} présentent ${
            converged ? 'des volumes récents convergents' : 'des trajectoires de rythme comparable'
          }.`,
      trajBits ? `${trajBits}.` : null,
      allRising
        ? 'Chaque trajectoire progresse par rapport à sa propre référence antérieure.'
        : !converged && meanReps != null
          ? `Volume typique ≈${meanReps} ${volumeUnitLabel} par trajectoire.`
          : null,
      temporalMismatch
        ? `Cette lecture s’appuie sur une fenêtre d’observation récente (${obsStart} → ${obsEnd}) ; elle ne constitue pas à elle seule le récit de l’horizon long.`
        : 'Les enregistrements restent distincts ; la lecture utile est structurelle, pas deux priorités redondantes.',
      'Preuves individuelles conservées en approfondissement.'
    ]
      .filter(Boolean)
      .join(' ');

    const sourceEvents = collectSourceEvents(members);
    const parentDiscovery = {
      kind: 'disc_composed_parallel_trajectories',
      title,
      body,
      evidence: uniqueSubjects.join(' · '),
      nature: members[0]?.discovery?.nature || members[0]?.nature || 'trajectory',
      family: members[0]?.discovery?.family || 'repertoire',
      informativeValue: Math.max(
        ...members.map((r) => Number(r.discovery?.informativeValue ?? r.informativeValue) || 40),
        70
      ) + (temporalMismatch ? 0 : 8),
      metrics: {
        producer: 'parallelTrajectoryComposition',
        parallelSubjects: uniqueSubjects,
        memberFingerprints: fingerprints,
        trajectories,
        meanSessions,
        meanReps,
        volumeBasis,
        volumeUnit: volumeBasis === 'per_session_mean' ? 'reps_per_session' : 'reps_window_total',
        narrativeAuthority: 'composition',
        thesis: 'parallel_storage_trajectories',
        exerciseId: null,
        // Sujet = trajectoires réelles, pas period_activity
        subjectKey: `parallel:${uniqueSubjects.slice().sort().join('+')}`,
        name,
        // window* = observation (contrat claim) ; présentation ailleurs
        windowStart: obsStart,
        windowEnd: obsEnd,
        populationLabel: `${uniqueSubjects.length}_storage_trajectories`,
        observationWindow: { start: obsStart, end: obsEnd, spanDays: obsSpan },
        comparisonWindow: {
          start: window?.start || obsStart,
          end: window?.end || obsEnd
        },
        presentationWindow: {
          start: window?.start || null,
          end: window?.end || null
        },
        presentationHorizon: voiceKey || null,
        temporalMismatch: temporalMismatch || false,
        analyticalAspect: aspect,
        // Sujet canonique ≠ phénomène (dimension + épisode calendaire)
        phenomenonKey: `parallel|${uniqueSubjects.slice().sort().join('+')}|${aspect}`,
        observedValues: [
          { id: 'parallelCount', value: uniqueSubjects.length, unit: 'trajectories' },
          ...(meanSessions != null
            ? [{ id: 'meanSessions', value: meanSessions, unit: 'count' }]
            : []),
          ...(meanReps != null ? [{ id: 'meanReps', value: meanReps, unit: 'reps' }] : []),
          ...trajectories
            .filter((t) => t.recentReps != null)
            .slice(0, 6)
            .map((t) => ({
              id: `recentReps:${t.subject}`,
              value: t.recentReps,
              unit: 'reps'
            })),
          ...trajectories
            .filter((t) => t.prevReps != null)
            .slice(0, 6)
            .map((t) => ({
              id: `prevReps:${t.subject}`,
              value: t.prevReps,
              unit: 'reps'
            }))
        ],
        // Mission 27 — identité de phénomène inclut dimension/épisode, pas seulement les sujets
        conclusionKey: `parallel_traj|${uniqueSubjects.slice().sort().join('+')}|${aspect}|${uniqueSubjects.length}`
      },
      drafting: { authority: 'composition' },
      childIds: [],
      hierarchyChildren: []
    };

    // Abaisser le poids sur horizons longs si la preuve est récente
    if (temporalMismatch) {
      parentDiscovery.informativeValue = Math.min(Number(parentDiscovery.informativeValue) || 40, 48);
      parentDiscovery.wasPriorityHint = false;
    }

    // Autorité d’identité : conclusionKey (phénomène+aspect), pas le titre
    const parentId = parentDiscovery.metrics.conclusionKey;
    parentDiscovery.id = parentId;
    parentDiscovery.occurrenceId = parentId;
    parentDiscovery.phenomenonId = parentDiscovery.metrics.phenomenonKey;
    parentDiscovery.metrics.occurrenceId = parentId;

    const memberClaim = members[0]?.claim || members[0]?.discovery?.claim || null;
    const synthesized =
      claimFromDiscovery(parentDiscovery, {
        start: parentDiscovery.metrics.observationWindow?.start || parentDiscovery.metrics.windowStart,
        end: parentDiscovery.metrics.observationWindow?.end || parentDiscovery.metrics.windowEnd
      }) || null;
    const parentClaim = synthesized
      ? {
          ...synthesized,
          subject: {
            key: parentDiscovery.metrics.subjectKey,
            label: name,
            trajectories: uniqueSubjects
          },
          scope: {
            ...(synthesized.scope || {}),
            start:
              parentDiscovery.metrics.observationWindow?.start ||
              synthesized.scope?.start ||
              memberClaim?.scope?.start ||
              null,
            end:
              parentDiscovery.metrics.observationWindow?.end ||
              synthesized.scope?.end ||
              memberClaim?.scope?.end ||
              null,
            observationWindow: parentDiscovery.metrics.observationWindow,
            comparisonWindow: parentDiscovery.metrics.comparisonWindow,
            presentationHorizon: voiceKey || null
          },
          population: {
            id: parentDiscovery.metrics.populationLabel,
            label: `${uniqueSubjects.length} trajectoires ${name}`
          },
          proof: {
            ...(synthesized.proof || {}),
            observedValues: parentDiscovery.metrics.observedValues,
            sourceEvents,
            analyticalAspect: aspect,
            observationWindow: parentDiscovery.metrics.observationWindow,
            similarity: {
              converged,
              meanReps,
              meanSessions,
              subjects: uniqueSubjects,
              volumeBasis
            }
          },
          analyticalAspect: aspect,
          producer: 'parallelTrajectoryComposition'
        }
      : memberClaim;
    parentDiscovery.claim = parentClaim;

    const parentRow = {
      discovery: parentDiscovery,
      claim: parentClaim,
      p6Disposition: 'consolidated',
      wasPriority: !temporalMismatch,
      parallelCluster: true
    };

    const childIds = [];
    cluster.members.forEach(({ row, index }) => {
      const link = justifyParentChildLink(parentRow, row, { maxEpisodeGapDays: 60 });
      const childSub = subjectKey(row.discovery || row);
      const hierarchyLink = link.ok
        ? link
        : {
            ok: true,
            relation: 'parallel_trajectory_deepening',
            reason: 'verified_parallel_storage_trajectories',
            proof: {
              parentId,
              childSubject: childSub,
              parallelSubjects: uniqueSubjects,
              sharedTitle: cluster.title,
              observationWindow: parentDiscovery.metrics.observationWindow,
              note: 'Identités de stockage distinctes, contenu analytique comparable'
            }
          };
      const next = {
        ...working[index],
        p6Disposition: 'deepening_of_collective',
        collapsedInto: parentId,
        hierarchyLink,
        wasPriority: false,
        discovery: {
          ...(working[index].discovery || {}),
          p6Disposition: 'deepening_of_collective',
          collapsedInto: parentId,
          hierarchyLink,
          informativeValue: Math.min(Number(working[index].discovery?.informativeValue) || 40, 28)
        }
      };
      working[index] = next;
      childIds.push(stablePublicationId(next.discovery || next));
      decisions.push({
        id: stablePublicationId(next.discovery || next),
        action: 'demote_to_parallel_deepening',
        reason: 'parallel_storage_trajectories',
        into: parentId,
        linkProof: hierarchyLink.proof
      });
    });

    parentDiscovery.childIds = childIds;
    parentDiscovery.hierarchyChildren = childIds;
    parentRow.discovery = parentDiscovery;
    composed.push(parentRow);
    decisions.push({
      id: parentId,
      action: 'compose_parallel_trajectories',
      reason: 'structural_reading_over_redundant_priorities',
      children: childIds,
      subjects: uniqueSubjects,
      temporalMismatch
    });
  });

  return {
    rows: [...working, ...composed],
    composedCount: composed.length,
    decisions,
    rejectedSameSubject: rejectedSameSubject.slice(0, 40)
  };
}
