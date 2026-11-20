import { describe, expect, it } from 'vitest';
import {
  analyticalJsonStringify,
  buildZipStore,
  renderAuditMarkdown,
  safeJsonStringify
} from '../analysisExportDownload';

describe('analysisExportDownload', () => {
  it('sérialise sans planter sur une référence circulaire', () => {
    const a = { title: 'ok' };
    a.self = a;
    const text = safeJsonStringify(a);
    expect(text).toMatch(/\$circular|Circular/i);
    const parsed = JSON.parse(text);
    expect(parsed.title).toBe('ok');
    expect(parsed.self).toEqual({ $circular: expect.any(String) });
  });

  it('réémet intégralement une référence partagée (non circulaire)', () => {
    const claim = { id: 'c1', thesis: 'volume concentré', evidence: ['3j'] };
    const dossier = {
      priority: [{ title: 'A', claim }],
      reserve: [{ title: 'B', claim }],
      metrics: { claim }
    };
    const text = analyticalJsonStringify(dossier);
    expect(text).not.toMatch(/Circular/i);
    expect(text).not.toMatch(/\$circular/);
    const parsed = JSON.parse(text);
    expect(parsed.priority[0].claim.thesis).toBe('volume concentré');
    expect(parsed.reserve[0].claim.evidence).toEqual(['3j']);
    expect(parsed.metrics.claim.id).toBe('c1');
  });

  it('construit un zip store non vide', () => {
    const zip = buildZipStore([
      { name: 'a.json', data: '{"x":1}' },
      { name: 'a.md', data: '# hi' }
    ]);
    expect(zip.byteLength).toBeGreaterThan(40);
    expect(zip[0]).toBe(0x50); // P
    expect(zip[1]).toBe(0x4b); // K
  });

  it('produit un markdown lisible depuis un export 8 périodes', () => {
    const md = renderAuditMarkdown({
      schema: 'momentum.analysisEightPeriodExport.v1',
      capturedAt: '2026-11-20T00:00:00.000Z',
      complete: true,
      periods: {
        '7d': {
          period: '7d',
          provenance: 'published_cache',
          domVerified: false,
          window: { start: '2026-11-14', end: '2026-11-20' },
          banner: { totalReps: 983, trainingDays: 3 },
          userAccessible: {
            priority: [{ title: 'Volume proche', body: 'Trois journées.', evidence: '332' }],
            reserve: []
          }
        }
      },
      comparisons: {},
      unavailable: []
    });
    expect(md).toMatch(/Volume proche/);
    expect(md).toMatch(/7d/);
  });
});
