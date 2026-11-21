/**
 * Vérification DOM des huit périodes rendues (Récap → Analyse).
 * Restaure la période initiale. Ne touche pas à la mémoire éditoriale.
 */

import { EIGHT_PERIODS } from '../analysisPeriodExport';
import { analysisEditionKey } from '../analysisEdition';

const READY_TIMEOUT_MS = 180000;
const POLL_MS = 400;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function captureDomCards(root = document) {
  const nodes = [
    ...root.querySelectorAll('[data-recap-insight-card], [data-insight-card], article.emp, .recap-insight-card')
  ];
  // Fallback : cartes Analyse visibles
  const fallback =
    nodes.length > 0
      ? nodes
      : [...root.querySelectorAll('[role="tabpanel"] article, .dist + * article, section article')].slice(
          0,
          80
        );
  return fallback.map((el, index) => {
    const title =
      el.getAttribute('data-title') ||
      el.querySelector('h3, h4, .title, [data-card-title]')?.textContent?.trim() ||
      el.querySelector('strong')?.textContent?.trim() ||
      '';
    const body =
      el.getAttribute('data-body') ||
      el.querySelector('p, .body, [data-card-body]')?.textContent?.trim() ||
      '';
    const id = el.getAttribute('data-card-id') || el.getAttribute('data-id') || `dom-${index}`;
    return { id, title, body: body.slice(0, 240) };
  });
}

/** Titres prioritaires seuls (colonnes). */
function packPriorityTitles(insights) {
  return [
    ...(insights?.shortTerm || []),
    ...(insights?.mediumTerm || []),
    ...(insights?.longTerm || [])
  ]
    .map((c) => String(c.title || '').trim())
    .filter(Boolean);
}

/** Catalogue accessible complet (priorité + réserve) — périmètre DOM utilisateur. */
function packAccessibleTitles(insights) {
  return [
    ...packPriorityTitles(insights),
    ...(insights?.accessibleReserve || []).map((c) => String(c.title || '').trim())
  ].filter(Boolean);
}

/**
 * @param {object} opts
 * @param {string} opts.initialPeriod
 * @param {(period: string) => void} opts.setPeriod
 * @param {() => object} opts.getState — { analysisStatus, analysisPeriod, insights, edition }
 * @param {string[]} [opts.periods]
 */
export async function verifyEightPeriodsAgainstDom({
  initialPeriod,
  setPeriod,
  getState,
  periods = EIGHT_PERIODS,
  onProgress = null
} = {}) {
  if (typeof setPeriod !== 'function' || typeof getState !== 'function') {
    return {
      schema: 'momentum.domEightPeriodVerify.v1',
      refused: true,
      reason: 'missing_setPeriod_or_getState'
    };
  }

  const results = [];
  const startedAt = new Date().toISOString();

  try {
    for (let i = 0; i < periods.length; i += 1) {
      const period = periods[i];
      onProgress?.({ period, index: i + 1, total: periods.length, phase: 'switch' });
      setPeriod(period);

      const deadline = Date.now() + READY_TIMEOUT_MS;
      let state = getState();
      while (Date.now() < deadline) {
        state = getState();
        const ready =
          state?.analysisStatus === 'ready' &&
          String(state?.analysisPeriod || state?.selectedPeriod || '') === String(period);
        if (ready && state?.insights) break;
        onProgress?.({ period, index: i + 1, total: periods.length, phase: 'wait_ready' });
        await sleep(POLL_MS);
      }

      state = getState();
      const ready =
        state?.analysisStatus === 'ready' &&
        String(state?.analysisPeriod || state?.selectedPeriod || '') === String(period);
      const domCards = typeof document !== 'undefined' ? captureDomCards() : [];
      const priorityTitles = packPriorityTitles(state?.insights);
      const accessibleTitles = packAccessibleTitles(state?.insights);
      const domTitles = domCards.map((c) => c.title).filter(Boolean);
      // Comparaison à périmètre accessible (évite de marquer la réserve comme « extra »)
      const missingFromDom = accessibleTitles.filter((t) => t && !domTitles.includes(t));
      const extraInDom = domTitles.filter((t) => t && !accessibleTitles.includes(t));
      const missingPriority = priorityTitles.filter((t) => t && !domTitles.includes(t));

      let status = 'not_verifiable';
      if (!ready) status = 'not_ready';
      else if (domCards.length === 0) status = 'computed_not_rendered_or_unobservable';
      else if (missingFromDom.length === 0 && accessibleTitles.length > 0 && extraInDom.length === 0) {
        status = 'rendered_and_conform';
      } else if (domCards.length > 0) status = 'rendered_and_divergent';

      results.push({
        period,
        status,
        ready,
        editionObserved: state?.edition || null,
        editionExpected: analysisEditionKey(),
        packPriorityCount: priorityTitles.length,
        packAccessibleCount: accessibleTitles.length,
        domCardCount: domCards.length,
        missingFromDom,
        missingPriority,
        extraInDom: extraInDom.slice(0, 20),
        sampleDomTitles: domTitles.slice(0, 8),
        samplePackTitles: accessibleTitles.slice(0, 8),
        compareScope: 'accessible_including_reserve',
        memoryUntouched: true
      });
    }
  } finally {
    if (initialPeriod) setPeriod(initialPeriod);
  }

  const conform = results.filter((r) => r.status === 'rendered_and_conform').length;
  return {
    schema: 'momentum.domEightPeriodVerify.v1',
    startedAt,
    finishedAt: new Date().toISOString(),
    initialPeriodRestored: initialPeriod,
    editorialMemoryModified: false,
    humanBlindPerformed: false,
    periods: results,
    summary: {
      total: results.length,
      conform,
      divergent: results.filter((r) => r.status === 'rendered_and_divergent').length,
      notReady: results.filter((r) => r.status === 'not_ready').length,
      notVerifiable: results.filter((r) =>
        ['not_verifiable', 'computed_not_rendered_or_unobservable'].includes(r.status)
      ).length
    }
  };
}
