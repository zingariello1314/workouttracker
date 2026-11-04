/**
 * Découvertes scopées à la période Recap.
 *
 * Flux : données → comparaisons → constats → scoring → attribution d'angle.
 * Court / moyen / long = trois angles sur LA MÊME période, pas trois durées.
 *
 * Orchestrateur + réexports publics (API stable pour Worker / hooks / tests).
 * Modules :
 *   - recapPeriodVoice.js
 *   - recapPeriodMeasure.js
 *   - recapPeriodComparisons.js
 *   - recapPeriodDetectDiscoveries.js
 *   - recapPeriodSelection.js
 */

import { addCalendarDays } from './garminRunningPeriodStats';
import { signalFamilyOfKind } from './recapInsightNature';
import { buildSleepRhythmDiscoveries } from './sleepRhythmAnalysis';
import { buildThreadDiscoveries, rewriteSleepDiscoveries } from './recapAnalysisProofs';
import { applyEditorialGate } from './recapEditorialGate';
import { filterValidInsights, insightRejectReason } from './recapInsightValidate';
import { buildGtgUnplannedDiscoveries } from './recapGtgUnplannedReading';
import { buildProgramAdherenceDiscoveries } from './recapProgramAdherenceDiscoveries';
import { resolveContentClass } from './recapDiscoveryContentClass';
import { buildP32bMuscleDiscoveries } from './recapMuscleP32bDiscoveries';
import { buildP34RevisionDiscoveries } from './recapProgramRevisionP34';
import { buildP35Discoveries } from './recapP35Discoveries';
import { buildP36Discoveries } from './recapP36Discoveries';
import { coopGate, makeRecapComputeAbort } from './recapComputeCoop';
import { enrichDiscoveriesWithComposedEvidence } from './recapComposedEvidence';
import { polishDiscoveriesProse, editorialValidateDiscovery } from './recapEditorialPolish';
import {
  phenomenonIdentity,
  classifyPhenomenon,
  withRepairedDisplayName
} from './recapEditorialSelection';
import { buildExerciseNameMap } from './recapAdaptiveWorkerContract';
import {
  buildExerciseBaselines,
  buildSessionCatalog,
  computeSleepPerformanceAssociation,
  computeRestPerformanceAssociation,
  findComparableSessions,
  sleepContextForDate
} from './recapPersonalBaselines';
import { extractSleepNightsInWindow } from './recapSleepNight';
import { isMilestoneKind } from './recapMilestoneEngine';
import {
  collectRunDays,
  pairSessionsWithNights,
  publishSleepCandidates,
  publishWindowSleepFacts
} from './recapSleepCorrelation';
import {
  buildPeriodActivityContext,
  filterDiscoveriesByPeriodScope,
  filterRunDaysToWindow
} from './recapDiscoveryPeriodScope';
import { discovery } from './recapPeriodVoice';
import {
  buildPeriodComparisons,
  buildPeriodComparisonsAsync
} from './recapPeriodComparisons';
import { detectDiscoveries } from './recapPeriodDetectDiscoveries';
import {
  selectPeriodDiscoveriesWithTrace,
  refillAfterGate,
  discoveryInformativeValue,
  discoveryIdentity,
  COMPOSITION_STORY_KINDS,
  P32B_MUSCLE_STORY_KINDS
} from './recapPeriodSelection';

// Réexports publics (API inchangée)
export {
  PERIOD_QUESTIONS,
  observationCaps,
  periodVoice,
  discovery
} from './recapPeriodVoice';
export { measureRecapWindow } from './recapPeriodMeasure';
export {
  buildPeriodComparisons,
  buildPeriodComparisonsAsync
} from './recapPeriodComparisons';
export {
  PERIOD_DISCOVERY_PRIORITY,
  selectPeriodDiscoveriesWithTrace,
  selectPeriodDiscoveries,
  discoveryInformativeValue,
  discoveryIdentity,
  COMPOSITION_STORY_KINDS,
  P32B_MUSCLE_STORY_KINDS
} from './recapPeriodSelection';

export function buildPeriodDiscoveryBundle(opts = {}) {
  if (typeof opts.shouldAbort === 'function' && opts.shouldAbort()) {
    throw makeRecapComputeAbort();
  }
  const end = opts.window?.end;
  const computeScope = opts.computeScope || null;
  const perf = opts.perfTimer || null;
  const pre = opts.precomputed || null;
  const measure = (name, fn) => (perf?.measure ? perf.measure(name, fn) : fn());
  const comparisons =
    pre?.comparisons ||
    measure('comparisons', () => buildPeriodComparisons({ ...opts, perfTimer: perf }));
  if (typeof opts.shouldAbort === 'function' && opts.shouldAbort()) {
    throw makeRecapComputeAbort();
  }
  const catalog =
    pre?.catalog ||
    measure('catalog', () =>
      buildSessionCatalog({
        snapshot: opts.snapshot,
        getExerciseNameById: opts.getExerciseNameById,
        garminData: opts.garminData,
        endYmd: end,
        computeScope
      })
    );
  const catalogPairs = pairSessionsWithNights(catalog);
  const windowStart = opts.window?.start || '';
  const journeyStart = end ? addCalendarDays(end, -91) : null;
  const trainedInWindow = catalogPairs.filter(
    (s) => s.date >= windowStart && s.date <= (end || '9999')
  );
  const journeyPairs = journeyStart
    ? catalogPairs.filter((s) => s.date >= journeyStart && s.date <= (end || '9999'))
    : catalogPairs;
  const allNights = extractSleepNightsInWindow(opts.garminData, opts.window?.start, end);
  const journeyNights = journeyStart
    ? extractSleepNightsInWindow(opts.garminData, journeyStart, end)
    : allNights;
  const focusDate =
    comparisons.voice?.key === 'today'
      ? end
      : comparisons.period?.peakDay?.date || end;
  // Point 22 : runDays limités à la fenêtre pour les natures « période »
  // (ex. sleep_cardio) — pas tout l’historique Garmin.
  const allRunDays = collectRunDays(opts.garminData);
  const windowRunDays = filterRunDaysToWindow(allRunDays, opts.window);
  const baselines =
    pre?.baselines ||
    measure('baselines', () =>
      buildExerciseBaselines({
        snapshot: opts.snapshot,
        endYmd: end,
        getExerciseNameById: opts.getExerciseNameById,
        computeScope
      })
    );
  const extras =
    pre?.extras ||
    measure('extrasSetup', () => ({
      baselines,
      comparable: findComparableSessions(catalog, focusDate),
      sleepAssoc: computeSleepPerformanceAssociation(catalog),
      sleepContext: sleepContextForDate(opts.garminData, focusDate, catalog),
      restAssoc: computeRestPerformanceAssociation(catalog),
      features: opts.features || null,
      sleepCandidates: publishSleepCandidates(catalog, {
        runDays: windowRunDays,
        snapshot: opts.snapshot
      }),
      catalog,
      snapshot: opts.snapshot,
      window: opts.window,
      garminData: opts.garminData,
      getExerciseNameById: opts.getExerciseNameById,
      profileQuestionnaireRaw: opts.profileQuestionnaireRaw || null,
      activeProgram: opts.activeProgram || null,
      computeScope,
      perfTimer: perf,
      allNights,
      sleepWindowFacts: publishWindowSleepFacts({
        trainedPairs: trainedInWindow,
        allNights,
        vs: comparisons.voice?.key === 'week' ? 'nights' : 'sessions'
      }),
      sleepJourneyFacts: publishWindowSleepFacts({
        trainedPairs: journeyPairs,
        allNights: journeyNights,
        vs: 'sessions'
      })
    }));
  const sleepRaw =
    pre?.sleepRaw ||
    measure('sleepRhythm', () =>
      buildSleepRhythmDiscoveries({ nights: allNights, sessions: catalog })
    );
  const programAdherencePack =
    pre?.programAdherencePack ||
    measure('programAdherence', () =>
      buildProgramAdherenceDiscoveries({
        snapshot: opts.snapshot,
        window: opts.window,
        getExerciseNameById: opts.getExerciseNameById || null,
        computeScope,
        returnMatrix: true
      })
    );
  const programAdherenceCards = Array.isArray(programAdherencePack)
    ? programAdherencePack
    : programAdherencePack?.cards || [];
  const sharedPlanMatrix = Array.isArray(programAdherencePack)
    ? null
    : programAdherencePack?.matrix || null;
  const programAdherenceRaw = programAdherenceCards.map((card) =>
    discovery({
      kind: card.kind,
      nature: card.nature,
      family: card.family,
      contentClass: card.contentClass || card.metrics?.contentClass,
      title: card.title,
      body: card.body,
      evidence: card.evidence,
      weights: card.weights,
      metrics: card.metrics
    })
  );
  /** P3.2b — toujours calculé (Phase 1) ; injection pool contrôlée (Phase 2). */
  const p32bPack =
    pre?.p32bPack ||
    measure('p32b', () =>
      buildP32bMuscleDiscoveries({
        snapshot: opts.snapshot,
        window: opts.window,
        getExerciseNameById: opts.getExerciseNameById || null,
        nameById: opts.nameById || null,
        publishPlanVsActual: opts.publishP32bPlanVsActual !== false,
        planMatrix: sharedPlanMatrix
      })
    );
  // Phase 2 : activé par défaut après rejeu oct. (opt-out : includeP32bMuscleDiscoveries: false).
  const includeP32b = opts.includeP32bMuscleDiscoveries !== false;
  const p32bRaw = includeP32b
    ? (p32bPack.discoveries || []).map((card) =>
        discovery({
          kind: card.kind,
          nature: card.nature,
          family: card.family,
          contentClass: card.contentClass || card.metrics?.contentClass,
          title: card.title,
          body: card.body,
          evidence: card.evidence,
          weights: card.weights,
          metrics: card.metrics
        })
      )
    : [];
  /** P3.4 — révisions structurelles ; opt-out : includeP34RevisionDiscoveries: false. */
  const includeP34 = opts.includeP34RevisionDiscoveries !== false;
  const p34Pack = includeP34
    ? pre?.p34Pack ||
      measure('p34', () =>
        buildP34RevisionDiscoveries({
          snapshot: opts.snapshot,
          window: opts.window
        })
      )
    : { discoveries: [] };
  const p34Raw = (p34Pack.discoveries || []).map((card) =>
    discovery({
      kind: card.kind,
      nature: card.nature,
      family: card.family,
      contentClass: card.contentClass || card.metrics?.contentClass,
      title: card.title,
      body: card.body,
      evidence: card.evidence,
      weights: card.weights,
      metrics: card.metrics
    })
  );
  /** P3.5 / P3.6 partagent la table jour (évite 2–3 rebuilds sur la même fenêtre). */
  const p35p36DayTableCache = pre?.p35p36DayTableCache || new Map();
  /** P3.5 — GTG × classique / écarts / ressenti ; opt-out : includeP35Discoveries: false. */
  const includeP35 = opts.includeP35Discoveries !== false;
  const p35Pack = includeP35
    ? pre?.p35Pack ||
      measure('p35', () =>
        buildP35Discoveries({
          snapshot: opts.snapshot,
          window: opts.window,
          liveActiveProgram: opts.liveActiveProgram || null,
          getExerciseNameById: opts.getExerciseNameById || null,
          includeP35Discoveries: true,
          dayTableCache: p35p36DayTableCache
        })
      )
    : { discoveries: [], metrics: null, abstentions: ['opt_out'] };
  const p35Raw = (p35Pack.discoveries || []).map((card) =>
    discovery({
      kind: card.kind,
      nature: card.nature,
      family: card.family,
      contentClass: card.contentClass || card.metrics?.contentClass,
      title: card.title,
      body: card.body,
      evidence: card.evidence,
      weights: card.weights,
      metrics: {
        ...(card.metrics || {}),
        p35ComputeMs: p35Pack.metrics?.performance?.computeMs
      }
    })
  );
  /** P3.6 — habitudes / weekday ; opt-out : includeP36Discoveries: false. */
  const includeP36 = opts.includeP36Discoveries !== false;
  const p36Pack = includeP36
    ? pre?.p36Pack ||
      measure('p36', () =>
        buildP36Discoveries({
          snapshot: opts.snapshot,
          window: opts.window,
          todayYmd: opts.todayYmd || null,
          liveActiveProgram: opts.liveActiveProgram || null,
          getExerciseNameById: opts.getExerciseNameById || null,
          includeP36Discoveries: true,
          dayTableCache: p35p36DayTableCache
        })
      )
    : { discoveries: [], metrics: null, abstentions: ['opt_out'] };
  const p36Raw = (p36Pack.discoveries || []).map((card) =>
    discovery({
      kind: card.kind,
      nature: card.nature,
      family: card.family,
      contentClass: card.contentClass || card.metrics?.contentClass,
      title: card.title,
      body: card.body,
      evidence: card.evidence,
      weights: card.weights,
      metrics: {
        ...(card.metrics || {}),
        p36ComputeMs: p36Pack.metrics?.performance?.computeMs
      }
    })
  );
  const rawAll = [
    ...measure('detectDiscoveries', () => detectDiscoveries(comparisons, extras)),
    ...measure('rewriteSleep', () => rewriteSleepDiscoveries(sleepRaw, allNights)),
    ...measure('threads', () =>
      buildThreadDiscoveries({
        comparisons,
        catalog,
        snapshot: opts.snapshot
      })
    ),
    ...measure('gtgUnplanned', () =>
      buildGtgUnplannedDiscoveries({
        snapshot: opts.snapshot,
        window: opts.window,
        profileQuestionnaireRaw: opts.profileQuestionnaireRaw || null
      })
    ),
    ...programAdherenceRaw,
    ...p32bRaw,
    ...p34Raw,
    ...p35Raw,
    ...p36Raw
  ];
  const period = comparisons.period || {};
  const activityCtx = buildPeriodActivityContext({
    window: opts.window,
    runningKm: period.runningKm,
    runningMinutes: period.runningMinutes,
    runDaysInWindow: windowRunDays.length,
    strengthReps: period.totalReps,
    trainingDays: period.trainingDays || trainedInWindow.length,
    nightsInWindow: allNights.length,
    sleepPairs: catalogPairs.length
  });
  const scoped = filterDiscoveriesByPeriodScope(rawAll, activityCtx);
  // F3 — compose preuves structurées ; F4 — narration + polish (sans retirer du pool avant E0).
  // N’altère ni kind ni scores E0 (informativeValue inchangé).
  const enriched = measure('f3Enrich', () =>
    enrichDiscoveriesWithComposedEvidence(scoped.kept, {
      getExerciseNameById: opts.getExerciseNameById || null,
      applyNarration: opts.applyF4Narration !== false
    })
  );
  const polished = measure('f4Polish', () => polishDiscoveriesProse(enriched));
  // F5.1 — réparer « un mouvement » via id historique / reverse-hash (sans inventer d’alias)
  const nameById = measure('nameMap', () =>
    buildExerciseNameMap(opts.snapshot || {}, opts.getExerciseNameById || (() => ''), {
      extraNameById: opts.extraNameById || null
    })
  );
  const resolveName = (id) => {
    const fromMap = nameById[String(id)] || nameById[id];
    if (fromMap) return fromMap;
    if (typeof opts.getExerciseNameById === 'function') {
      try {
        return opts.getExerciseNameById(id) || '';
      } catch {
        return '';
      }
    }
    return '';
  };
  const all = polished.map((d) =>
    withRepairedDisplayName(d, resolveName, {
      snapshot: opts.snapshot || null,
      nameById
    })
  );
  const editorialTrace = all
    .map((d) => {
      const v = editorialValidateDiscovery(d, { voiceKey: comparisons.voice?.key });
      if (!v.warnings?.length && !v.rejects?.length) return null;
      return { kind: d.kind, title: d.title, rejects: v.rejects, warnings: v.warnings };
    })
    .filter(Boolean);
  const traced = measure('e0f5Select', () =>
    selectPeriodDiscoveriesWithTrace(
      all,
      opts.insightHistory || null,
      comparisons.voice?.key || 'week'
    )
  );
  const voiceKey = comparisons.voice?.key || 'week';
  const gated = applyEditorialGate(traced.selected, { voiceKey });
  const validated = filterValidInsights(gated, {
    voiceKey,
    period: comparisons.periodId,
    windowSpanDays: comparisons.period?.spanDays
  });
  const validatedIds = new Set(validated.map((d) => discoveryIdentity(d)));
  const gatedIds = new Set(gated.map((d) => discoveryIdentity(d)));
  const removedAfterSelect = traced.selected
    .filter((d) => !validatedIds.has(discoveryIdentity(d)))
    .map((d) => {
      const stillAfterEditorial = gatedIds.has(discoveryIdentity(d));
      const reject =
        stillAfterEditorial
          ? insightRejectReason(d, {
              voiceKey,
              period: comparisons.periodId,
              windowSpanDays: comparisons.period?.spanDays
            })
          : '';
      return {
        ...d,
        reason: stillAfterEditorial
          ? reject
            ? `insight_validation:${reject}`
            : 'insight_validation'
          : 'editorial_gate'
      };
    });
  const selected = refillAfterGate(validated, [...traced.dropped, ...removedAfterSelect], voiceKey);
  const dropped = [
    ...scoped.dropped.map((d) => ({ ...d.discovery, reason: d.reason })),
    ...traced.dropped,
    ...removedAfterSelect
  ];
  const preferPeriodNow = selected.some((d) => d.nature === 'now');
  const sleepDetected = all.filter((d) => signalFamilyOfKind(d.kind) === 'sleep').map((d) => d.kind);
  const sleepSelected = selected.filter((d) => signalFamilyOfKind(d.kind) === 'sleep').map((d) => d.kind);
  const milestonesDetected = all.filter((d) => isMilestoneKind(d.kind)).map((d) => d.kind);
  const milestonesSelected = selected.filter((d) => isMilestoneKind(d.kind)).map((d) => d.kind);
  return {
    comparisons,
    all,
    selected,
    dropped,
    /** E0 : limites méthodologiques (ex. plan sans snapshot) — contexte, pas cartes principales. */
    reliabilityNotes: traced.reliabilityNotes || [],
    /** P3.2b — pack isolé (métriques + candidats + rejetés), même si non injecté dans le pool. */
    p32bMuscle: {
      includedInPool: includeP32b,
      metrics: p32bPack.metrics,
      discoveries: p32bPack.discoveries,
      rejected: p32bPack.rejected
    },
    /** P3.5 — pack isolé (métriques + abstentions + candidats). */
    p35: {
      includedInPool: includeP35,
      metrics: p35Pack.metrics,
      discoveries: p35Pack.discoveries,
      abstentions: p35Pack.abstentions || []
    },
    /** P3.6 — habitudes / weekday. */
    p36: {
      includedInPool: includeP36,
      metrics: p36Pack.metrics,
      discoveries: p36Pack.discoveries,
      abstentions: p36Pack.abstentions || []
    },
    extras,
    question: comparisons.question,
    preferPeriodNow,
    debug: {
      garminNightDays: allNights.length,
      journeyNightDays: journeyNights.length,
      sleepPairs: catalogPairs.length,
      runDaysInWindow: windowRunDays.length,
      sleepCandidateTypes: (extras.sleepCandidates || []).map((c) => c.type),
      sleepDetected,
      sleepSelected,
      milestonesDetected,
      milestonesSelected,
      displaceLog: traced.displaceLog || [],
      compositionStoryKinds: traced.compositionStoryKinds || COMPOSITION_STORY_KINDS,
      p32bMuscleStoryKinds: P32B_MUSCLE_STORY_KINDS,
      includeP32bMuscleDiscoveries: includeP32b,
      reliabilityNotes: traced.reliabilityNotes || [],
      droppedBy: dropped.reduce((acc, d) => {
        acc[d.reason] = (acc[d.reason] || 0) + 1;
        return acc;
      }, {}),
      selectedInformative: selected.map((d) => ({
        kind: d.kind,
        identity: discoveryIdentity(d),
        contentClass: resolveContentClass(d),
        informativeValue: d.informativeValue ?? discoveryInformativeValue(d, voiceKey),
        trajectoryOk: Boolean(d.metrics?.trajectoryOk),
        primaryStory: d.metrics?.trajectoryPrimaryStory || null,
        composedOk: Boolean(d.metrics?.composedOk),
        composedFactCount: d.metrics?.composedFactCount ?? null,
        phenomenonId: d._phenomenonId || phenomenonIdentity(d),
        phenomenon: d._phenomenon || classifyPhenomenon(d),
        editorialFactors: d._editorialValue?.factors || null
      })),
      f5: {
        counts: traced.counts || null,
        rejectedByReason: traced.rejectedByReason || null,
        editorialDecisions: (traced.editorialDecisions || []).slice(0, 80),
        displaceLog: traced.displaceLog || []
      },
      composedPool: {
        trajectoryOk: all.filter((d) => d.metrics?.trajectoryOk).length,
        composedOk: all.filter((d) => d.metrics?.composedOk).length,
        factCounts: all
          .filter((d) => d.metrics?.composedOk)
          .map((d) => ({
            kind: d.kind,
            factCount: d.metrics.composedFactCount,
            continuity: d.metrics.composedEvidence?.continuity?.kind || null,
            attribution: d.metrics.composedEvidence?.volumeAttribution?.kind || null,
            peers: d.metrics.composedEvidence?.comparators?.verdict || null
          }))
      },
      f4: {
        narrated: all.filter((d) => d.metrics?.f4Narration?.used).length,
        polished: all.filter((d) => d.metrics?.f4Polish).length,
        depth: all
          .filter((d) => d.metrics?.f4Narration?.used)
          .map((d) => ({
            kind: d.kind,
            depth: d.metrics.f4Narration.depth,
            title: d.title
          })),
        editorialTrace: editorialTrace.slice(0, 40)
      },
      f6: computeScope
        ? {
            scopeId: computeScope.id,
            counters: { ...computeScope.counters }
          }
        : null
    }
  };
}

/**
 * F7.0 — même bundle analytique que buildPeriodDiscoveryBundle, avec
 * coopération (yield + abort) entre comparaisons / producteurs indépendants.
 * Préserve ordre, identités, preuves, fenêtres, scores, rivalités, E0/F5, F4.
 */
export async function buildPeriodDiscoveryBundleAsync(opts = {}) {
  const coop = opts.coop || {};
  const end = opts.window?.end;
  const computeScope = opts.computeScope || null;
  const perf = opts.perfTimer || null;
  const measure = (name, fn) => (perf?.measure ? perf.measure(name, fn) : fn());

  await coopGate(coop);
  const comparisons = await buildPeriodComparisonsAsync({
    ...opts,
    perfTimer: perf,
    coop
  });

  await coopGate(coop);
  const catalog = measure('catalog', () =>
    buildSessionCatalog({
      snapshot: opts.snapshot,
      getExerciseNameById: opts.getExerciseNameById,
      garminData: opts.garminData,
      endYmd: end,
      computeScope
    })
  );
  const catalogPairs = pairSessionsWithNights(catalog);
  const windowStart = opts.window?.start || '';
  const journeyStart = end ? addCalendarDays(end, -91) : null;
  const trainedInWindow = catalogPairs.filter(
    (s) => s.date >= windowStart && s.date <= (end || '9999')
  );
  const journeyPairs = journeyStart
    ? catalogPairs.filter((s) => s.date >= journeyStart && s.date <= (end || '9999'))
    : catalogPairs;
  const allNights = extractSleepNightsInWindow(opts.garminData, opts.window?.start, end);
  const journeyNights = journeyStart
    ? extractSleepNightsInWindow(opts.garminData, journeyStart, end)
    : allNights;
  const focusDate =
    comparisons.voice?.key === 'today'
      ? end
      : comparisons.period?.peakDay?.date || end;
  const allRunDays = collectRunDays(opts.garminData);
  const windowRunDays = filterRunDaysToWindow(allRunDays, opts.window);

  await coopGate(coop);
  const baselines = measure('baselines', () =>
    buildExerciseBaselines({
      snapshot: opts.snapshot,
      endYmd: end,
      getExerciseNameById: opts.getExerciseNameById,
      computeScope
    })
  );
  const extras = measure('extrasSetup', () => ({
    baselines,
    comparable: findComparableSessions(catalog, focusDate),
    sleepAssoc: computeSleepPerformanceAssociation(catalog),
    sleepContext: sleepContextForDate(opts.garminData, focusDate, catalog),
    restAssoc: computeRestPerformanceAssociation(catalog),
    features: opts.features || null,
    sleepCandidates: publishSleepCandidates(catalog, {
      runDays: windowRunDays,
      snapshot: opts.snapshot
    }),
    catalog,
    snapshot: opts.snapshot,
    window: opts.window,
    garminData: opts.garminData,
    getExerciseNameById: opts.getExerciseNameById,
    profileQuestionnaireRaw: opts.profileQuestionnaireRaw || null,
    activeProgram: opts.activeProgram || null,
    computeScope,
    perfTimer: perf,
    allNights,
    sleepWindowFacts: publishWindowSleepFacts({
      trainedPairs: trainedInWindow,
      allNights,
      vs: comparisons.voice?.key === 'week' ? 'nights' : 'sessions'
    }),
    sleepJourneyFacts: publishWindowSleepFacts({
      trainedPairs: journeyPairs,
      allNights: journeyNights,
      vs: 'sessions'
    })
  }));

  await coopGate(coop);
  const sleepRaw = measure('sleepRhythm', () =>
    buildSleepRhythmDiscoveries({ nights: allNights, sessions: catalog })
  );

  await coopGate(coop);
  const programAdherencePack = measure('programAdherence', () =>
    buildProgramAdherenceDiscoveries({
      snapshot: opts.snapshot,
      window: opts.window,
      getExerciseNameById: opts.getExerciseNameById || null,
      computeScope,
      returnMatrix: true
    })
  );
  const programAdherenceCards = programAdherencePack?.cards || [];
  const sharedPlanMatrix = programAdherencePack?.matrix || null;

  await coopGate(coop);
  const p32bPack = measure('p32b', () =>
    buildP32bMuscleDiscoveries({
      snapshot: opts.snapshot,
      window: opts.window,
      getExerciseNameById: opts.getExerciseNameById || null,
      nameById: opts.nameById || null,
      publishPlanVsActual: opts.publishP32bPlanVsActual !== false,
      planMatrix: sharedPlanMatrix
    })
  );

  await coopGate(coop);
  const includeP34 = opts.includeP34RevisionDiscoveries !== false;
  const p34Pack = includeP34
    ? measure('p34', () =>
        buildP34RevisionDiscoveries({
          snapshot: opts.snapshot,
          window: opts.window
        })
      )
    : { discoveries: [] };

  await coopGate(coop);
  const p35p36DayTableCache = new Map();
  const includeP35 = opts.includeP35Discoveries !== false;
  const p35Pack = includeP35
    ? measure('p35', () =>
        buildP35Discoveries({
          snapshot: opts.snapshot,
          window: opts.window,
          liveActiveProgram: opts.liveActiveProgram || null,
          getExerciseNameById: opts.getExerciseNameById || null,
          includeP35Discoveries: true,
          dayTableCache: p35p36DayTableCache
        })
      )
    : { discoveries: [], metrics: null, abstentions: ['opt_out'] };

  await coopGate(coop);
  const includeP36 = opts.includeP36Discoveries !== false;
  const p36Pack = includeP36
    ? measure('p36', () =>
        buildP36Discoveries({
          snapshot: opts.snapshot,
          window: opts.window,
          todayYmd: opts.todayYmd || null,
          liveActiveProgram: opts.liveActiveProgram || null,
          getExerciseNameById: opts.getExerciseNameById || null,
          includeP36Discoveries: true,
          dayTableCache: p35p36DayTableCache
        })
      )
    : { discoveries: [], metrics: null, abstentions: ['opt_out'] };

  await coopGate(coop);
  // detectDiscoveries + F3/F4/E0/F5 : encore sync (secondaire vs p36/calendrier sur longues fenêtres)
  return buildPeriodDiscoveryBundle({
    ...opts,
    shouldAbort: coop.shouldAbort || opts.shouldAbort,
    precomputed: {
      comparisons,
      catalog,
      baselines,
      extras,
      sleepRaw,
      programAdherencePack,
      p32bPack,
      p34Pack,
      p35Pack,
      p36Pack
    }
  });
}

export function periodDiscoveryKindSet(bundle) {
  return new Set((bundle?.selected || []).map((d) => d.kind));
}
