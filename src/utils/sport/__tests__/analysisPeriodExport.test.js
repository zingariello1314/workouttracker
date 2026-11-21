import { describe, expect, it } from 'vitest';
import { analysisEditionKey } from '../analysisEdition';
import {
  buildComparisonExport,
  buildEightPeriodAudit,
  buildPeriodAuditDossier,
  resolveAuditSource
} from '../analysisPeriodExport';

function pack(period, window, extras = {}) {
  return {
    analysisStatus: extras.status || 'ready',
    analysisPeriod: period,
    analysisEdition: analysisEditionKey(),
    packRole: 'published',
    recapAssessment: {
      insightsPublication: {
        status: extras.publicationStatus || 'ready',
        period,
        windowStart: window.start,
        windowEnd: window.end
      },
      insights: {
        shortTerm: extras.priority || [],
        mediumTerm: [],
        longTerm: [],
        accessibleReserve: extras.reserve || []
      },
      periodDiscoveries: extras.discoveries || { all: [], dropped: [], p6: { sources: [], counters: null, relations: [] } }
    }
  };
}

const week = { start: '2026-11-14', end: '2026-11-20' };
const today = { start: '2026-11-20', end: '2026-11-20' };

describe('export de la période demandée', () => {
  it('refuse le paquet 7 jours quand Aujourd’hui est demandé', () => {
    const live = pack('7d', week, {
      priority: [{ kind: 'disc_volume_shape', title: 'Volume 7 jours', body: '983 répétitions', evidence: '983' }]
    });
    const decision = resolveAuditSource({ requestedPeriod: 'today', requestedWindow: today, live });
    expect(decision.refused).toBe(true);
    expect(decision.reason).toBe('period_mismatch');
    expect(decision.bundle).toBeNull();
  });

  it('refuse un paquet encore en calcul', () => {
    const live = pack('today', today, { status: 'loading', publicationStatus: 'loading' });
    const decision = resolveAuditSource({ requestedPeriod: 'today', requestedWindow: today, live });
    expect(decision.refused).toBe(true);
    expect(decision.reason).toBe('period_computing');
  });

  it('prend le paquet publié de la période demandée', () => {
    const live = pack('7d', week);
    const cached = pack('today', today, {
      priority: [{ kind: 'disc_today', title: 'Séance du jour', body: 'Pas commencée', evidence: '2026-11-20' }]
    });
    const decision = resolveAuditSource({
      requestedPeriod: 'today',
      requestedWindow: today,
      live,
      cached
    });
    expect(decision.refused).toBe(false);
    expect(decision.provenance).toBe('published_cache');
    const dossier = buildPeriodAuditDossier({
      requestedPeriod: 'today',
      requestedWindow: today,
      bundle: decision.bundle,
      provenance: decision.provenance,
      banner: { totalReps: 0 },
      measure: { totalReps: 0 }
    });
    expect(dossier.period).toBe('today');
    expect(dossier.window).toEqual(today);
    expect(dossier.userAccessible.priority.map((card) => card.title)).toEqual(['Séance du jour']);
    expect(JSON.stringify(dossier.userAccessible)).not.toMatch(/Volume 7 jours/);
    expect(dossier.domVerified).toBe(false);
  });

  it('écrit le catalogue complet et sépare le registre des conclusions accessibles', () => {
    const bundle = pack('7d', week, {
      priority: [{ kind: 'disc_volume_shape', title: 'Volume concentré', body: 'Peu de journées', evidence: '3 jours' }],
      reserve: [{ kind: 'disc_repertoire_stability', title: 'Le répertoire tient', body: 'Treize maintiens', evidence: '13' }],
      discoveries: {
        all: [{ kind: 'disc_format_consolidation', title: 'Maintien brut', body: 'Observation', evidence: '2026-11-16', claim: { layer: 'observation' } }],
        dropped: [{ kind: 'disc_kcal_profile', title: 'Kcal écartées', body: 'Motif', reason: 'methodology_limit' }],
        p6: {
          sources: [{ kind: 'disc_format_consolidation', title: 'Maintien fusionné', body: 'Source', evidence: '2026-11-16', p6Disposition: 'source_retained', collapsedInto: 'parent' }],
          counters: { produced: 4, priority: 1, reserve: 1, fused: 1, rejected: 1, blocked: 0, reconciled: true },
          relations: [{ relation: 'reformulation', from: 'a', to: 'b' }]
        }
      }
    });
    const dossier = buildPeriodAuditDossier({
      requestedPeriod: '7d',
      requestedWindow: week,
      bundle,
      provenance: 'published_rendered',
      domCapture: {
        renderedPeriod: '7d',
        renderedWindowStart: week.start,
        renderedWindowEnd: week.end,
        // Périmètre accessible = priorité + réserve
        cards: [{ title: 'Volume concentré' }, { title: 'Le répertoire tient' }]
      }
    });
    expect(dossier.userAccessible.priority).toHaveLength(1);
    expect(dossier.userAccessible.reserve[0].title).toBe('Le répertoire tient');
    expect(dossier.userAccessible.accessible).toHaveLength(2);
    expect(dossier.registry.raw[0].audience).toBe('registry');
    expect(dossier.registry.fused[0].collapsedInto).toBe('parent');
    expect(dossier.registry.rejected[0].reason).toBe('methodology_limit');
    expect(dossier.registry.counters.reconciled).toBe(true);
    expect(dossier.domVerified).toBe(true);
    expect(dossier.userAccessible.priority[0].audience).toBe('user');
  });
});

describe('export comparaison et huit périodes', () => {
  it('garde deux dossiers distincts', () => {
    const weekPack = pack('7d', week, {
      priority: [{ kind: 'a', title: 'Carte semaine', body: 'A', evidence: 'a' }]
    });
    const month = { start: '2026-10-22', end: '2026-11-20' };
    const monthPack = pack('30d', month, {
      priority: [{ kind: 'b', title: 'Carte mois', body: 'B', evidence: 'b' }]
    });
    const left = buildPeriodAuditDossier({
      requestedPeriod: '7d',
      requestedWindow: week,
      bundle: weekPack,
      provenance: 'published_cache'
    });
    const right = buildPeriodAuditDossier({
      requestedPeriod: '30d',
      requestedWindow: month,
      bundle: monthPack,
      provenance: 'published_cache'
    });
    const comparison = buildComparisonExport(left, right);
    expect(comparison.periodA.period).toBe('7d');
    expect(comparison.periodB.period).toBe('30d');
    expect(comparison.periodA.window).toEqual(week);
    expect(comparison.periodB.window).toEqual(month);
    expect(comparison.diff.distinctA.map((card) => card.title)).toEqual(['Carte semaine']);
    expect(comparison.diff.distinctB.map((card) => card.title)).toEqual(['Carte mois']);
    expect(comparison.provenanceA).toBe('published_cache');
    expect(comparison.provenanceB).toBe('published_cache');
  });

  it('calcule les périodes manquantes une par une et ne les marque pas comme rendues', async () => {
    const calls = [];
    const result = await buildEightPeriodAudit({
      periods: ['today', '7d'],
      loadPublished: async (period) => {
        if (period !== '7d') return null;
        return {
          bundle: pack('7d', week, {
            priority: [{ kind: 'a', title: 'Déjà publié', body: 'Cache', evidence: '1' }]
          }),
          provenance: 'published_cache',
          window: week
        };
      },
      computeMissing: async (period) => {
        calls.push(period);
        return {
          bundle: pack('today', today, {
            priority: [{ kind: 't', title: 'Calculé', body: 'Non rendu', evidence: '0' }]
          }),
          window: today
        };
      }
    });
    expect(calls).toEqual(['today']);
    expect(result.periods['7d'].provenance).toBe('published_cache');
    expect(result.periods['7d'].domVerified).toBe(false);
    expect(result.periods.today.provenance).toBe('computed_not_rendered');
    expect(result.periods.today.domVerified).toBe(false);
    expect(result.periods.today.engine.packRole).toBe('computed_not_rendered');
    expect(result.domNote).toMatch(/non rendu/);
    expect(result.complete).toBe(true);
    expect(result.comparisons['7d_vs_30d']?.refused || result.comparisons['7d_vs_30d']).toBeTruthy();
  });
});
