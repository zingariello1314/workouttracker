/**
 * Vérification DOM des huit périodes (Récap → Analyse).
 * Mission 32/33-DOM — observation réelle des cartes montées, pas du pack mémoire.
 * Restaure la période initiale. Ne touche pas à la mémoire éditoriale.
 *
 * Contrat observation (attributs sur le rendu) :
 *   [data-analyse-period]              racine panneau
 *   [data-analyse-waiting]             true | false
 *   [data-analyse-publication-ready]   true | false
 *   [data-analyse-card]                true (priorité) | accessible (complément)
 *   [data-card-id]                     identité registre (= card.id)
 *   [data-role]                        priority | reserve
 *   [data-title]                       titre (optionnel, miroir)
 *
 * Statuts période (jamais « computed_not_rendered » comme observation positive) :
 *   CONFORME | DIVERGENT | VIRTUALISE_ACCESSIBLE | NON_PRET | NON_OBSERVABLE | NON_RENDU
 *   (+ alias anglais rétrocompatibles dans `status`)
 */

import { EIGHT_PERIODS } from '../analysisPeriodExport';
import { analysisEditionKey } from '../analysisEdition';

const READY_TIMEOUT_MS = 180000;
const PAINT_TIMEOUT_MS = 20000;
/** Si publication état OK mais DOM encore en waiting : ne pas attendre 20s. */
const STABLE_WAITING_EXIT_MS = 2500;
/** Racine Analyse absente : échec d’observation rapide (mauvaise vue). */
const MISSING_ROOT_EXIT_MS = 2000;
const POLL_MS = 250;

/** Sélecteur stable — uniquement les cartes Analyse instrumentées. */
export const ANALYSE_CARD_SELECTOR = '[data-analyse-card]';
export const ANALYSE_ROOT_SELECTOR = '[data-analyse-period]';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Normalise espaces typographiques — ne masque pas une différence de mots. */
export function normalizeTitleForCompare(title) {
  return String(title || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function paintFrame() {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame !== 'function') {
      setTimeout(resolve, 16);
      return;
    }
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });
}

function cssEscape(value) {
  const s = String(value ?? '');
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(s);
  return s.replace(/[^a-zA-Z0-9_-]/g, '\\$&');
}

/**
 * Sonde scopée au panneau Analyse (pas le chrome nav).
 * @param {Document|Element} root
 * @param {string} [expectedPeriod]
 */
export function probeAnalyseDom(root = document, expectedPeriod = null) {
  const doc = root?.querySelector ? root : document;
  const analyseRoot =
    (expectedPeriod &&
      doc.querySelector(
        `${ANALYSE_ROOT_SELECTOR}[data-analyse-period="${cssEscape(String(expectedPeriod))}"]`
      )) ||
    doc.querySelector(ANALYSE_ROOT_SELECTOR) ||
    null;

  if (!analyseRoot) {
    return {
      analyseRootPresent: false,
      periodRendered: null,
      waitingInsights: null,
      publicationReady: null,
      cardNodeCount: 0,
      cards: [],
      counters: { toutes: null, rawTextSample: '' },
      hypothesis: 'wrong_view_or_unmounted_analyse'
    };
  }

  const periodRendered = analyseRoot.getAttribute('data-analyse-period') || null;
  const waitingAttr = analyseRoot.getAttribute('data-analyse-waiting');
  const pubAttr = analyseRoot.getAttribute('data-analyse-publication-ready');
  const waitingInsights =
    waitingAttr === 'true' ||
    Boolean(analyseRoot.querySelector('[data-analyse-loading="true"], [role="status"].emp'));
  const publicationReady = pubAttr === 'true' || (pubAttr == null && !waitingInsights);

  const nodes = [...analyseRoot.querySelectorAll(ANALYSE_CARD_SELECTOR)];
  const cards = nodes.map((el, index) => {
    const title = normalizeTitleForCompare(
      el.getAttribute('data-title') ||
        el.querySelector('h3, h4, [data-card-title]')?.textContent ||
        ''
    );
    const body =
      el.getAttribute('data-body') ||
      el.querySelector('p, [data-card-body]')?.textContent?.trim() ||
      '';
    const id =
      el.getAttribute('data-card-id') ||
      el.getAttribute('data-publication-id') ||
      el.getAttribute('data-insight-id') ||
      null;
    const role =
      el.getAttribute('data-role') ||
      (el.getAttribute('data-analyse-card') === 'true' ? 'priority' : 'reserve');
    return {
      id: id || `dom-${index}`,
      title,
      body: String(body || '').slice(0, 240),
      role,
      mounted: true,
      registryId: id
    };
  });

  const counterEl = analyseRoot.querySelector('[data-analyse-counter="toutes"]');
  const counterAttr = counterEl?.getAttribute('data-analyse-counter-value');
  const filterText = (analyseRoot.querySelector('.dist')?.innerText || '').replace(/\s+/g, ' ');
  const toutesMatch = filterText.match(/Toutes[^0-9]{0,12}(\d{1,4})/i);
  const toutes =
    counterAttr != null && counterAttr !== ''
      ? Number(counterAttr)
      : toutesMatch
        ? Number(toutesMatch[1])
        : null;
  const rootText = (analyseRoot.innerText || '').replace(/\s+/g, ' ').slice(0, 400);

  let hypothesis = 'ok';
  if (waitingInsights) hypothesis = 'ready_but_waiting_publication_or_paint';
  else if (
    expectedPeriod &&
    periodRendered &&
    String(periodRendered) !== String(expectedPeriod)
  ) {
    hypothesis = 'period_mismatch_rendered_vs_requested';
  } else if (cards.length === 0 && publicationReady) {
    hypothesis = 'publication_ready_but_zero_cards';
  }

  return {
    analyseRootPresent: true,
    periodRendered,
    waitingInsights,
    publicationReady,
    cardNodeCount: cards.length,
    cards,
    counters: {
      toutes: Number.isFinite(toutes) ? toutes : null,
      rawTextSample: rootText
    },
    hypothesis
  };
}

function packCards(insights) {
  const priority = [
    ...(insights?.shortTerm || []),
    ...(insights?.mediumTerm || []),
    ...(insights?.longTerm || [])
  ];
  const reserve = insights?.accessibleReserve || [];
  const mapRow = (c, role) => ({
    id: c?.id || c?.publicationId || null,
    phenomenonId: c?.phenomenonId || c?.metrics?.phenomenonKey || null,
    title: normalizeTitleForCompare(c?.title || ''),
    role
  });
  return {
    priority: priority.map((c) => mapRow(c, 'priority')),
    complementary: reserve.map((c) => mapRow(c, 'reserve')),
    accessible: [
      ...priority.map((c) => mapRow(c, 'priority')),
      ...reserve.map((c) => mapRow(c, 'reserve'))
    ]
  };
}

function publicationAligned(state, period) {
  const pub = state?.insightsPublication;
  if (!pub) return state?.analysisStatus === 'ready' && Boolean(state?.insights);
  if (pub.status !== 'ready') return false;
  if (pub.period != null && String(pub.period) !== String(period)) return false;
  const ws = state?.periodWindowStart;
  const we = state?.periodWindowEnd;
  if (ws && pub.windowStart && String(pub.windowStart) !== String(ws)) return false;
  if (we && pub.windowEnd && String(pub.windowEnd) !== String(we)) return false;
  return true;
}

/**
 * Attend le montage DOM après ready mémoire.
 * Distingue waiting / wrong view / cartes montées.
 */
async function waitForAnalysePaint({
  period,
  getState,
  onProgress,
  index,
  total,
  paintTimeoutMs = PAINT_TIMEOUT_MS
}) {
  const deadline = Date.now() + paintTimeoutMs;
  let probe = probeAnalyseDom(document, period);
  let waitingSince = null;
  let missingRootSince = probe.analyseRootPresent ? null : Date.now();
  while (Date.now() < deadline) {
    await paintFrame();
    probe = probeAnalyseDom(document, period);
    const state = getState?.() || {};
    const pubOk = publicationAligned(state, period);

    if (
      probe.analyseRootPresent &&
      !probe.waitingInsights &&
      probe.cardNodeCount > 0 &&
      (!probe.periodRendered || String(probe.periodRendered) === String(period))
    ) {
      return { probe, paintOk: true };
    }

    // Publication prête + racine + message vide explicite (0 cartes légitimes)
    if (
      probe.analyseRootPresent &&
      !probe.waitingInsights &&
      probe.publicationReady &&
      probe.cardNodeCount === 0 &&
      pubOk
    ) {
      const emptyMsg = document.querySelector(
        `${ANALYSE_ROOT_SELECTOR}[data-analyse-period="${cssEscape(String(period))}"] .emp`
      );
      if (emptyMsg && /Pas assez|aucune|empty/i.test(emptyMsg.textContent || '')) {
        return { probe, paintOk: true, emptyLegitimate: true };
      }
    }

    if (!probe.analyseRootPresent) {
      if (missingRootSince == null) missingRootSince = Date.now();
      if (Date.now() - missingRootSince >= MISSING_ROOT_EXIT_MS) {
        return { probe, paintOk: false, missingRoot: true };
      }
    } else {
      missingRootSince = null;
    }

    // Waiting stable alors que l’état dit prêt → NON_RENDU (pas 20 s d’attente)
    if (probe.analyseRootPresent && probe.waitingInsights && pubOk) {
      if (waitingSince == null) waitingSince = Date.now();
      if (Date.now() - waitingSince >= STABLE_WAITING_EXIT_MS) {
        return { probe, paintOk: false, stableWaiting: true };
      }
    } else {
      waitingSince = null;
    }

    onProgress?.({ period, index, total, phase: 'wait_paint', hypothesis: probe.hypothesis });
    await sleep(POLL_MS);
  }
  return { probe: probeAnalyseDom(document, period), paintOk: false };
}

function classifyPeriod({ ready, pack, probe, paintOk }) {
  if (!ready) {
    return {
      status: 'not_ready',
      statusLabel: 'NON_PRET',
      renderState: 'not_ready'
    };
  }
  if (!probe.analyseRootPresent) {
    return {
      status: 'not_observable',
      statusLabel: 'NON_OBSERVABLE',
      renderState: 'not_observable',
      note: 'Panneau Analyse absent du DOM (mauvaise vue ou non monté)'
    };
  }
  if (probe.waitingInsights || (!paintOk && probe.cardNodeCount === 0)) {
    return {
      status: 'not_rendered',
      statusLabel: 'NON_RENDU',
      renderState: 'not_rendered',
      note:
        'Pack mémoire prêt mais cartes non montées (publication / peinture). Ce n’est pas une observation DOM positive.'
    };
  }
  if (
    probe.periodRendered &&
    pack &&
    String(probe.periodRendered) !== String(probe._requestedPeriod || probe.periodRendered)
  ) {
    // handled by caller with expected period
  }

  const domCards = probe.cards || [];
  const packTitles = pack.accessible.map((c) => c.title).filter(Boolean);
  const packIds = pack.accessible.map((c) => c.id).filter(Boolean);
  const priorityIds = pack.priority.map((c) => c.id).filter(Boolean);
  const domTitles = domCards.map((c) => c.title).filter(Boolean);
  const domIds = domCards.map((c) => c.registryId || c.id).filter((id) => id && !String(id).startsWith('dom-'));

  const packTitleSet = new Set(packTitles.map(normalizeTitleForCompare).filter(Boolean));
  const domTitleSet = new Set(domTitles.map(normalizeTitleForCompare).filter(Boolean));
  const missingIds = packIds.filter((id) => !domIds.includes(id));
  const missingPriorityIds = priorityIds.filter((id) => !domIds.includes(id));
  const missingTitlesFromDom = packTitles.filter((t) => {
    const n = normalizeTitleForCompare(t);
    return n && !domTitleSet.has(n);
  });
  const extraTitlesInDom = domTitles.filter((t) => {
    const n = normalizeTitleForCompare(t);
    return n && !packTitleSet.has(n);
  });
  const missingPriorityTitles = pack.priority
    .map((c) => c.title)
    .filter((t) => {
      const n = normalizeTitleForCompare(t);
      return n && !domTitleSet.has(n);
    });

  const priorityPresentById =
    priorityIds.length === 0
      ? pack.priority.filter((c) => c.title && domTitles.includes(c.title)).length
      : priorityIds.filter((id) => domIds.includes(id)).length;
  const priorityCoverage =
    pack.priority.length === 0 ? 1 : priorityPresentById / Math.max(1, pack.priority.length);

  const likelyVirtualized =
    pack.accessible.length > 0 &&
    domCards.length > 0 &&
    domCards.length < pack.accessible.length &&
    missingTitlesFromDom.length > 0 &&
    missingTitlesFromDom.length >= pack.accessible.length - domCards.length - 2;

  if (domCards.length === 0 && pack.accessible.length > 0) {
    return {
      status: 'not_rendered',
      statusLabel: 'NON_RENDU',
      renderState: 'not_rendered',
      note: 'Zéro nœud data-analyse-card alors que le pack accessible est non vide',
      missingTitlesFromDom,
      missingPriorityTitles,
      extraTitlesInDom,
      missingIds,
      missingPriorityIds,
      priorityCoverage: 0,
      likelyVirtualized: false,
      priorityMountedOk: false
    };
  }

  if (likelyVirtualized) {
    const ok = priorityCoverage >= 0.5;
    return {
      status: ok ? 'partial_mount_virtualized_accessible' : 'partial_mount_virtualized_priority_gap',
      statusLabel: ok ? 'VIRTUALISE_ACCESSIBLE' : 'VIRTUALISE_PRIORITE_MANQUANTE',
      renderState: 'virtualized',
      note: 'Montage partiel — réserve non entièrement montée ≠ FAIL catalogue',
      missingTitlesFromDom: missingTitlesFromDom.slice(0, 12),
      missingPriorityTitles,
      extraTitlesInDom: extraTitlesInDom.slice(0, 20),
      missingIds: missingIds.slice(0, 30),
      missingPriorityIds,
      priorityCoverage,
      likelyVirtualized: true,
      priorityMountedOk: ok
    };
  }

  const idOrTitleConform =
    (packIds.length > 0 && missingIds.length === 0 && extraTitlesInDom.length === 0) ||
    (packIds.length === 0 && missingTitlesFromDom.length === 0 && extraTitlesInDom.length === 0);

  if (idOrTitleConform && pack.accessible.length > 0) {
    return {
      status: 'rendered_and_conform',
      statusLabel: 'CONFORME',
      renderState: 'rendered',
      missingTitlesFromDom: [],
      missingPriorityTitles: [],
      extraTitlesInDom: [],
      missingIds: [],
      missingPriorityIds: [],
      priorityCoverage: 1,
      likelyVirtualized: false,
      priorityMountedOk: true
    };
  }

  return {
    status: 'rendered_and_divergent',
    statusLabel: 'DIVERGENT',
    renderState: 'rendered',
    missingTitlesFromDom,
    missingPriorityTitles,
    extraTitlesInDom: extraTitlesInDom.slice(0, 20),
    missingIds: missingIds.slice(0, 30),
    missingPriorityIds,
    priorityCoverage,
    likelyVirtualized: false,
    priorityMountedOk: missingPriorityTitles.length === 0 && missingPriorityIds.length === 0
  };
}

/**
 * @param {object} opts
 * @param {string} opts.initialPeriod
 * @param {(period: string) => void} opts.setPeriod
 * @param {() => object} opts.getState — DOIT lire l’état live (refs)
 * @param {string[]} [opts.periods]
 */
export async function verifyEightPeriodsAgainstDom({
  initialPeriod,
  setPeriod,
  getState,
  periods = EIGHT_PERIODS,
  onProgress = null,
  /** @deprecated tests only */
  readyTimeoutMs = READY_TIMEOUT_MS,
  paintTimeoutMs = PAINT_TIMEOUT_MS
} = {}) {
  if (typeof setPeriod !== 'function' || typeof getState !== 'function') {
    return {
      schema: 'momentum.domEightPeriodVerify.v2',
      refused: true,
      reason: 'missing_setPeriod_or_getState',
      status: 'not_observed'
    };
  }

  if (typeof document === 'undefined') {
    return {
      schema: 'momentum.domEightPeriodVerify.v2',
      refused: true,
      reason: 'no_document',
      status: 'not_observed'
    };
  }

  const results = [];
  const startedAt = new Date().toISOString();

  try {
    for (let i = 0; i < periods.length; i += 1) {
      const period = periods[i];
      onProgress?.({ period, index: i + 1, total: periods.length, phase: 'switch' });
      setPeriod(period);

      const deadline = Date.now() + readyTimeoutMs;
      let state = getState();
      while (Date.now() < deadline) {
        state = getState();
        const readyNow =
          state?.analysisStatus === 'ready' &&
          String(state?.analysisPeriod || state?.selectedPeriod || '') === String(period) &&
          Boolean(state?.insights);
        if (readyNow) break;
        onProgress?.({ period, index: i + 1, total: periods.length, phase: 'wait_ready' });
        await sleep(POLL_MS);
      }

      state = getState();
      const ready =
        state?.analysisStatus === 'ready' &&
        String(state?.analysisPeriod || state?.selectedPeriod || '') === String(period) &&
        Boolean(state?.insights);

      const pack = packCards(state?.insights);
      let probe = probeAnalyseDom(document, period);
      let paintOk = false;

      if (ready) {
        // Attendre publication alignée côté état si fournie, puis peinture DOM
        const pubDeadline = Date.now() + Math.min(PAINT_TIMEOUT_MS, 12000);
        while (Date.now() < pubDeadline && !publicationAligned(getState(), period)) {
          onProgress?.({
            period,
            index: i + 1,
            total: periods.length,
            phase: 'wait_publication'
          });
          await sleep(POLL_MS);
        }
        const painted = await waitForAnalysePaint({
          period,
          getState,
          onProgress,
          index: i + 1,
          total: periods.length,
          paintTimeoutMs
        });
        probe = painted.probe;
        paintOk = painted.paintOk;
      }

      probe._requestedPeriod = period;
      const classified = classifyPeriod({ ready, pack, probe, paintOk });

      const domCards = probe.cards || [];
      const packIds = pack.accessible.map((c) => c.id).filter(Boolean);
      const domIds = domCards
        .map((c) => c.registryId || c.id)
        .filter((id) => id && !String(id).startsWith('dom-'));

      const idOverlap =
        packIds.length > 0 && domIds.length > 0
          ? {
              packIds: packIds.length,
              domIds: domIds.length,
              missingIds: (classified.missingIds || packIds.filter((id) => !domIds.includes(id))).slice(
                0,
                30
              ),
              extraIds: domIds.filter((id) => !packIds.includes(id)).slice(0, 20),
              matchedIds: packIds.filter((id) => domIds.includes(id)).slice(0, 40)
            }
          : null;

      results.push({
        period,
        status: classified.status,
        statusLabel: classified.statusLabel,
        renderState: classified.renderState,
        ready,
        panelMounted: probe.analyseRootPresent,
        periodSelectedInUi: probe.periodRendered,
        periodMatch:
          !probe.periodRendered || String(probe.periodRendered) === String(period),
        editionObserved: state?.edition || null,
        editionExpected: analysisEditionKey(),
        fingerprintHint: state?.fingerprintDigest || null,
        packPriorityCount: pack.priority.length,
        packComplementaryCount: pack.complementary.length,
        packAccessibleCount: pack.accessible.length,
        domCardCount: domCards.length,
        domPriorityCount: domCards.filter((c) => c.role === 'priority').length,
        domReserveCount: domCards.filter((c) => c.role === 'reserve' || c.role === 'accessible').length,
        observedIdentities: domIds.slice(0, 40),
        uiCounters: {
          toutes: probe.counters?.toutes ?? null,
          aRetenir: null,
          autres: null,
          analyses: probe.counters?.toutes ?? null,
          rawTextSample: probe.counters?.rawTextSample || '',
          scopedToAnalyseRoot: true
        },
        missingFromDom: classified.missingTitlesFromDom || [],
        missingPriority: classified.missingPriorityTitles || [],
        extraInDom: classified.extraTitlesInDom || [],
        sampleDomTitles: domCards.map((c) => c.title).slice(0, 8),
        samplePackTitles: pack.accessible.map((c) => c.title).slice(0, 8),
        samplePackIds: packIds.slice(0, 8),
        idOverlap,
        likelyVirtualized: Boolean(classified.likelyVirtualized),
        priorityCoverage: classified.priorityCoverage ?? 0,
        priorityMountedOk: Boolean(classified.priorityMountedOk),
        accessibilityNote: classified.note || null,
        probe: {
          hypothesis: probe.hypothesis,
          waitingInsights: probe.waitingInsights,
          publicationReady: probe.publicationReady,
          analyseRootPresent: probe.analyseRootPresent,
          periodRendered: probe.periodRendered
        },
        compareScope: classified.likelyVirtualized
          ? 'mounted_dom_vs_accessible_pack_virtualization_aware'
          : probe.cardNodeCount > 0
            ? 'mounted_identities_vs_pack'
            : 'observation_failed',
        memoryUntouched: true,
        publicationSideEffect: false
      });
    }
  } finally {
    if (initialPeriod) setPeriod(initialPeriod);
  }

  const conform = results.filter((r) => r.status === 'rendered_and_conform').length;
  const virtualizedOk = results.filter(
    (r) => r.status === 'partial_mount_virtualized_accessible'
  ).length;
  const anyObservable = results.some((r) =>
    ['rendered_and_conform', 'rendered_and_divergent', 'partial_mount_virtualized_accessible', 'partial_mount_virtualized_priority_gap'].includes(
      r.status
    )
  );

  return {
    schema: 'momentum.domEightPeriodVerify.v2',
    // « observed » global seulement si au moins une période a des cartes montées
    status: anyObservable ? 'observed' : 'observation_incomplete',
    startedAt,
    finishedAt: new Date().toISOString(),
    initialPeriodRestored: initialPeriod,
    editorialMemoryModified: false,
    publicationSideEffect: false,
    humanBlindPerformed: false,
    contract: {
      root: 'data-analyse-period',
      card: 'data-analyse-card',
      identity: 'data-card-id',
      role: 'data-role',
      waiting: 'data-analyse-waiting',
      publicationReady: 'data-analyse-publication-ready'
    },
    periods: results,
    summary: {
      total: results.length,
      conform,
      virtualizedAccessible: virtualizedOk,
      divergent: results.filter((r) => r.status === 'rendered_and_divergent').length,
      virtualizedPriorityGap: results.filter(
        (r) => r.status === 'partial_mount_virtualized_priority_gap'
      ).length,
      notReady: results.filter((r) => r.status === 'not_ready').length,
      notRendered: results.filter((r) => r.status === 'not_rendered').length,
      notObservable: results.filter((r) => r.status === 'not_observable').length,
      // rétrocompat : anciennement « notVerifiable » fusionnait non-rendu + non-observable
      notVerifiable: results.filter((r) =>
        ['not_verifiable', 'not_rendered', 'not_observable', 'computed_not_rendered_or_unobservable'].includes(
          r.status
        )
      ).length,
      note: 'Un status global observed n’implique pas 8× CONFORME. Lire periods[].statusLabel / renderState.'
    }
  };
}
