/**
 * Capture DEV des cartes réellement rendues dans l’onglet Analyse.
 * Distinct du pack diagnostic (`shown_now`).
 */

export const DOM_CAPTURE_STORAGE_KEY = 'momentum.sport.analyseDomCapture.v1';
export const DOM_CAPTURE_EVENT = 'momentum:analyse-dom-capture';

function fingerprintCard(card) {
  const title = String(card?.title || '').trim().toLowerCase();
  const body = String(card?.body || '').trim().toLowerCase().slice(0, 120);
  const kind = String(card?.kind || card?.id || '');
  return `${kind}|${title}|${body}`;
}

/**
 * @param {{
 *   period: string,
 *   cards: Array<{ id?: string, kind?: string, title?: string, body?: string }>,
 *   dataSignature?: string|null,
 *   editorialHistorySignature?: string|null,
 *   source?: string
 * }} payload
 */
export function saveAnalyseDomCapture(payload) {
  const cards = (payload?.cards || []).map((c, i) => ({
    id: c.id ?? c.cardId ?? null,
    cardId: c.cardId ?? c.id ?? null,
    phenomenonId: c.phenomenonId ?? null,
    publicationId: c.publicationId ?? null,
    kind: c.kind ?? null,
    family: c.family ?? null,
    category: c.category ?? null,
    title: c.title ?? null,
    body: c.body ?? null,
    metricsDisplayed: c.metricsDisplayed ?? null,
    order: c.order ?? i,
    visible: c.visible !== false,
    loading: Boolean(c.loading),
    period: c.period ?? payload?.period ?? null,
    runSignature: c.runSignature ?? payload?.dataSignature ?? null,
    captureQuality: c.captureQuality || (c.kind && c.phenomenonId ? 'structured' : 'partial'),
    fingerprint: fingerprintCard(c)
  }));
  const record = {
    schemaVersion: 'analyse-dom-capture-v2',
    capturedAt: new Date().toISOString(),
    period: payload?.period || null,
    dataSignature: payload?.dataSignature ?? null,
    editorialHistorySignature: payload?.editorialHistorySignature ?? null,
    source: payload?.source || 'manual',
    captureQuality: payload?.captureQuality || (cards.some((c) => c.captureQuality === 'structured') ? 'mixed' : 'partial'),
    loadingState: payload?.loadingState || null,
    cards,
    count: cards.length
  };
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DOM_CAPTURE_STORAGE_KEY, JSON.stringify(record));
    }
  } catch {
    /* ignore quota */
  }
  try {
    if (typeof window !== 'undefined') {
      window.__MOMENTUM_ANALYSE_DOM_CAPTURE__ = record;
      window.dispatchEvent(new CustomEvent(DOM_CAPTURE_EVENT, { detail: record }));
    }
  } catch {
    /* ignore */
  }
  return record;
}

export function loadAnalyseDomCapture() {
  try {
    if (typeof window !== 'undefined' && window.__MOMENTUM_ANALYSE_DOM_CAPTURE__) {
      return window.__MOMENTUM_ANALYSE_DOM_CAPTURE__;
    }
  } catch {
    /* ignore */
  }
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(DOM_CAPTURE_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function clearAnalyseDomCapture() {
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(DOM_CAPTURE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
  try {
    if (typeof window !== 'undefined') window.__MOMENTUM_ANALYSE_DOM_CAPTURE__ = null;
  } catch {
    /* ignore */
  }
}

/**
 * Scrape best-effort des cartes Analyse dans le DOM (DEV).
 * Préfère l’instrumentation data-* ; repli article.k / classes insight.
 * Capture vide ≠ « zéro carte publiée » : source + loadingState le précisent.
 */
export function captureAnalyseCardsFromDom({
  period = null,
  root = null,
  dataSignature = null,
  editorialHistorySignature = null,
  loadingState = null
} = {}) {
  const doc = root || (typeof document !== 'undefined' ? document : null);
  if (!doc) {
    return saveAnalyseDomCapture({
      period,
      cards: [],
      source: 'no_document',
      dataSignature,
      editorialHistorySignature,
      loadingState: loadingState || 'no_document',
      captureQuality: 'none'
    });
  }

  if (loadingState === 'loading' || doc.querySelector('[data-analyse-loading="true"], .analyse-loading')) {
    return saveAnalyseDomCapture({
      period,
      cards: [],
      source: 'loading',
      dataSignature,
      editorialHistorySignature,
      loadingState: 'loading',
      captureQuality: 'none'
    });
  }

  let structured = true;
  let nodes = [
    ...doc.querySelectorAll(
      '[data-analyse-card], [data-insight-card], .analyse-card, .insight-card, .recap-insight-card'
    )
  ];
  if (!nodes.length) {
    structured = false;
    nodes = [...doc.querySelectorAll('article.k, article[class^="k "]')].filter((el) => {
      const t = (el.textContent || '').trim();
      return t.length > 24 && t.length < 1200;
    });
  }

  const cards = nodes.map((el, i) => {
    const titleEl =
      el.querySelector('[data-card-title], .card-title, h3, h4') || null;
    const bodyEl = el.querySelector('[data-card-body], .card-body, p');
    let title = (titleEl?.textContent || '').trim();
    let body = (bodyEl?.textContent || '').trim();
    if (!title) {
      // Repli : première ligne significative, sans concaténer la catégorie UI
      const raw = (el.textContent || '').trim().replace(/\s+/g, ' ');
      title = raw.slice(0, 160);
      body = raw.slice(0, 800);
    }
    // Éviter titre répété dans le corps
    if (body && title && body.startsWith(title)) {
      body = body.slice(title.length).trim();
    }
    return {
      id: el.getAttribute('data-card-id') || el.getAttribute('data-insight-id') || `dom-${i}`,
      cardId: el.getAttribute('data-card-id') || el.getAttribute('data-insight-id') || null,
      phenomenonId: el.getAttribute('data-phenomenon-id') || null,
      publicationId: el.getAttribute('data-publication-id') || null,
      kind: el.getAttribute('data-kind') || el.getAttribute('data-insight-kind') || null,
      family: el.getAttribute('data-family') || null,
      category: el.getAttribute('data-category') || null,
      title: title || null,
      body: body || null,
      order: i,
      visible: true,
      captureQuality: structured && el.getAttribute('data-analyse-card') != null ? 'structured' : 'partial'
    };
  });

  return saveAnalyseDomCapture({
    period,
    cards,
    dataSignature,
    editorialHistorySignature,
    loadingState: loadingState || 'ready',
    captureQuality: structured ? 'structured' : 'partial',
    source: nodes.length ? (structured ? 'dom_scrape' : 'dom_scrape_fallback') : 'dom_scrape_empty'
  });
}
