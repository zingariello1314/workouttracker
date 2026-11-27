/**
 * Mission 33b — observateur DOM : statuts distincts, sonde scopée, non-régression.
 */
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  probeAnalyseDom,
  verifyEightPeriodsAgainstDom,
  ANALYSE_CARD_SELECTOR
} from '../evaluation/domEightPeriodVerify';

function mountAnalyse({ period = '7d', waiting = false, titles = [] } = {}) {
  const root = document.createElement('div');
  root.className = 'rb-analyse';
  root.setAttribute('data-analyse-period', period);
  root.setAttribute('data-analyse-waiting', waiting ? 'true' : 'false');
  root.setAttribute('data-analyse-publication-ready', waiting ? 'false' : 'true');
  if (waiting) {
    const p = document.createElement('p');
    p.className = 'emp';
    p.textContent = 'Préparation des analyses…';
    root.appendChild(p);
  } else {
    const grid = document.createElement('div');
    grid.className = 'igrid';
    titles.forEach((title, i) => {
      const article = document.createElement('article');
      article.className = 'k a';
      article.setAttribute('data-analyse-card', i === 0 ? 'true' : 'accessible');
      article.setAttribute('data-role', i === 0 ? 'priority' : 'reserve');
      article.setAttribute('data-card-id', `id-${i}`);
      article.setAttribute('data-title', title);
      const h4 = document.createElement('h4');
      h4.textContent = title;
      const body = document.createElement('p');
      body.textContent = `Corps ${i}`;
      article.appendChild(h4);
      article.appendChild(body);
      grid.appendChild(article);
    });
    const filter = document.createElement('div');
    filter.className = 'dist';
    const btn = document.createElement('button');
    btn.setAttribute('data-analyse-counter', 'toutes');
    btn.setAttribute('data-analyse-counter-value', String(titles.length));
    btn.innerHTML = `Toutes <b>${titles.length}</b>`;
    filter.appendChild(btn);
    root.appendChild(filter);
    root.appendChild(grid);
  }
  document.body.appendChild(root);
  return root;
}

describe('Mission 33b — probeAnalyseDom', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('détecte waiting sans confondre avec absences de cartes calculées', () => {
    mountAnalyse({ period: '7d', waiting: true });
    const probe = probeAnalyseDom(document, '7d');
    expect(probe.analyseRootPresent).toBe(true);
    expect(probe.waitingInsights).toBe(true);
    expect(probe.cardNodeCount).toBe(0);
    expect(probe.hypothesis).toBe('ready_but_waiting_publication_or_paint');
  });

  it('capture les cartes data-analyse-card montées (sélecteur RecapAnalyseView)', () => {
    mountAnalyse({
      period: '7d',
      titles: ['Priorité A', 'Complément B', 'Complément C']
    });
    const probe = probeAnalyseDom(document, '7d');
    expect(ANALYSE_CARD_SELECTOR).toMatch(/data-analyse-card/);
    expect(probe.cardNodeCount).toBe(3);
    expect(probe.cards.map((c) => c.title)).toEqual(['Priorité A', 'Complément B', 'Complément C']);
    expect(probe.waitingInsights).toBe(false);
    expect(probe.hypothesis).toBe('ok');
  });

  it('classe wrong_view quand la racine Analyse est absente', () => {
    const probe = probeAnalyseDom(document, '7d');
    expect(probe.analyseRootPresent).toBe(false);
    expect(probe.hypothesis).toBe('wrong_view_or_unmounted_analyse');
  });
});

describe('Mission 33b — verifyEightPeriodsAgainstDom statuts', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('not_rendered quand ready+pack mais UI en attente', async () => {
    mountAnalyse({ period: '7d', waiting: true });
    const report = await verifyEightPeriodsAgainstDom({
      initialPeriod: '7d',
      periods: ['7d'],
      setPeriod: () => {},
      getState: () => ({
        analysisStatus: 'ready',
        analysisPeriod: '7d',
        selectedPeriod: '7d',
        insights: {
          shortTerm: [{ id: 'a', title: 'Priorité A' }],
          mediumTerm: [],
          longTerm: [],
          accessibleReserve: []
        },
        insightsPublication: { status: 'ready', period: '7d', windowStart: '2026-11-17', windowEnd: '2026-11-23' },
        periodWindowStart: '2026-11-17',
        periodWindowEnd: '2026-11-23',
        edition: 'test'
      })
    });
    const row = report.periods[0];
    expect(row.renderState).toBe('not_rendered');
    expect(row.status).toBe('not_rendered');
    expect(row.probe.waitingInsights).toBe(true);
    expect(row.domCardCount).toBe(0);
    expect(row.packAccessibleCount).toBe(1);
  });

  it('rendered_and_conform quand les cartes prioritaires sont montées', async () => {
    mountAnalyse({ period: '7d', titles: ['Priorité A', 'Complément B'] });
    // Identités DOM = id-0 / id-1 (mountAnalyse) — aligner le pack
    const report = await verifyEightPeriodsAgainstDom({
      initialPeriod: '7d',
      periods: ['7d'],
      setPeriod: () => {},
      getState: () => ({
        analysisStatus: 'ready',
        analysisPeriod: '7d',
        selectedPeriod: '7d',
        insights: {
          shortTerm: [{ id: 'id-0', title: 'Priorité A' }],
          mediumTerm: [],
          longTerm: [],
          accessibleReserve: [{ id: 'id-1', title: 'Complément B' }]
        },
        insightsPublication: { status: 'ready', period: '7d' },
        edition: 'test'
      })
    });
    const row = report.periods[0];
    expect(row.renderState).toBe('rendered');
    expect(row.status).toBe('rendered_and_conform');
    expect(row.statusLabel).toBe('CONFORME');
    expect(row.domCardCount).toBe(2);
  });

  it('not_observable sans racine Analyse (ne pas appeler computed_not_rendered comme DOM)', async () => {
    const report = await verifyEightPeriodsAgainstDom({
      initialPeriod: '7d',
      periods: ['7d'],
      setPeriod: () => {},
      getState: () => ({
        analysisStatus: 'ready',
        analysisPeriod: '7d',
        selectedPeriod: '7d',
        insights: {
          shortTerm: [{ id: 'a', title: 'Priorité A' }],
          mediumTerm: [],
          longTerm: [],
          accessibleReserve: []
        },
        insightsPublication: { status: 'ready', period: '7d' },
        edition: 'test'
      })
    });
    const row = report.periods[0];
    expect(row.renderState).toBe('not_observable');
    expect(row.status).toBe('not_observable');
    expect(row.status).not.toBe('computed_not_rendered_or_unobservable');
  });

  it('virtualized : montage partiel ≠ FAIL catalogue', async () => {
    mountAnalyse({ period: '7d', titles: ['Priorité A', 'P2'] });
    const report = await verifyEightPeriodsAgainstDom({
      initialPeriod: '7d',
      periods: ['7d'],
      setPeriod: () => {},
      getState: () => ({
        analysisStatus: 'ready',
        analysisPeriod: '7d',
        selectedPeriod: '7d',
        insights: {
          shortTerm: [{ id: 'a', title: 'Priorité A' }, { id: 'p2', title: 'P2' }],
          mediumTerm: [],
          longTerm: [],
          accessibleReserve: Array.from({ length: 40 }, (_, i) => ({
            id: `r${i}`,
            title: `Complémentaire ${i}`
          }))
        },
        insightsPublication: { status: 'ready', period: '7d' },
        edition: 'test'
      })
    });
    const row = report.periods[0];
    expect(row.renderState).toBe('virtualized');
    expect(row.likelyVirtualized).toBe(true);
    expect(row.status).toMatch(/partial_mount_virtualized/);
    expect(row.statusLabel).toMatch(/VIRTUALISE/);
  });

  it('période rendue ≠ demandée → divergence de sonde', () => {
    mountAnalyse({ period: '30d', titles: ['Carte 30j'] });
    const probe = probeAnalyseDom(document, '7d');
    // Racine générique trouvée mais période affichée ≠ 7d
    expect(probe.periodRendered).toBe('30d');
    expect(probe.hypothesis).toBe('period_mismatch_rendered_vs_requested');
  });

  it('relie data-card-id au pack (identité registre)', async () => {
    mountAnalyse({ period: '7d', titles: ['Priorité A'] });
    const el = document.querySelector('[data-analyse-card]');
    el.setAttribute('data-card-id', 'disc_pending_session|x');
    el.setAttribute('data-role', 'priority');
    el.setAttribute('data-title', 'Priorité A');
    const report = await verifyEightPeriodsAgainstDom({
      initialPeriod: '7d',
      periods: ['7d'],
      setPeriod: () => {},
      getState: () => ({
        analysisStatus: 'ready',
        analysisPeriod: '7d',
        selectedPeriod: '7d',
        insights: {
          shortTerm: [{ id: 'disc_pending_session|x', title: 'Priorité A' }],
          mediumTerm: [],
          longTerm: [],
          accessibleReserve: []
        },
        insightsPublication: { status: 'ready', period: '7d' },
        edition: 'test'
      })
    });
    const row = report.periods[0];
    expect(row.domCardCount).toBeGreaterThanOrEqual(1);
    expect(row.observedIdentities).toContain('disc_pending_session|x');
    expect(row.idOverlap?.matchedIds).toContain('disc_pending_session|x');
    expect(row.status).toBe('rendered_and_conform');
  });

  it('restaure la période initiale et ne mute pas la mémoire', async () => {
    const restored = [];
    mountAnalyse({ period: '7d', titles: ['A'] });
    const report = await verifyEightPeriodsAgainstDom({
      initialPeriod: '30d',
      periods: ['7d'],
      setPeriod: (p) => restored.push(p),
      getState: () => ({
        analysisStatus: 'ready',
        analysisPeriod: '7d',
        selectedPeriod: '7d',
        insights: {
          shortTerm: [{ id: 'a', title: 'A' }],
          mediumTerm: [],
          longTerm: [],
          accessibleReserve: []
        },
        insightsPublication: { status: 'ready', period: '7d' },
        edition: 'test'
      })
    });
    expect(restored[restored.length - 1]).toBe('30d');
    expect(report.initialPeriodRestored).toBe('30d');
    expect(report.editorialMemoryModified).toBe(false);
    expect(report.publicationSideEffect).toBe(false);
  });

  it('not_ready quand le calcul n’est pas prêt', async () => {
    mountAnalyse({ period: '7d', waiting: true });
    const report = await verifyEightPeriodsAgainstDom({
      initialPeriod: '7d',
      periods: ['7d'],
      setPeriod: () => {},
      readyTimeoutMs: 400,
      paintTimeoutMs: 200,
      getState: () => ({
        analysisStatus: 'loading',
        analysisPeriod: '7d',
        selectedPeriod: '7d',
        insights: null,
        edition: 'test'
      })
    });
    expect(report.periods[0].status).toBe('not_ready');
    expect(report.periods[0].statusLabel).toBe('NON_PRET');
    expect(report.periods[0].renderState).toBe('not_ready');
  });
});

describe('Mission 33b — garde-fous', () => {
  it('refuse sans setPeriod/getState', async () => {
    const report = await verifyEightPeriodsAgainstDom({});
    expect(report.refused).toBe(true);
    expect(report.status).toBe('not_observed');
  });
});
