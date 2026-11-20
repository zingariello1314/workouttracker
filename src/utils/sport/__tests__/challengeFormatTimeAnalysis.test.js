import { describe, expect, it } from 'vitest';
import { exploreSameFormatTimeChange } from '../challengeFormatTimeAnalysis';

describe('challengeFormatTimeAnalysis', () => {
  it('détecte un même format 5×20 plus rapide sans inventer une nature physiologique', () => {
    const snapshot = {
      enduranceData: {
        sessions: {
          pushups: [
            { date: '2026-10-13', setCount: 5, repsPerSet: 20, count: 100, duration: 10 },
            { date: '2026-10-17', setCount: 5, repsPerSet: 20, count: 100, duration: 10 },
            { date: '2026-10-20', setCount: 5, repsPerSet: 20, count: 100, duration: 10 },
            { date: '2026-11-07', setCount: 5, repsPerSet: 20, count: 100, duration: 8.87 },
            { date: '2026-11-14', setCount: 5, repsPerSet: 20, count: 100, duration: 8.93 },
            { date: '2026-11-17', setCount: 5, repsPerSet: 20, count: 100, duration: 8.72 }
          ]
        }
      }
    };
    const rows = exploreSameFormatTimeChange({
      snapshot,
      window: { start: '2026-10-01', end: '2026-11-19' },
      minSessions: 4
    });
    const hit = rows.find((row) => row.coverage === 'concluded');
    expect(hit).toBeTruthy();
    expect(hit.formatKey).toBe('5x20');
    expect(hit.physiologicalNature).toBe('unknown');
    expect(hit.provenance).toBe('challenge');
    expect(hit.title).toMatch(/plus rapidement/);
    expect(hit.body).toMatch(/temps enregistré|durée enregistrée/);
    expect(hit.body).toMatch(/pas sur une force maximale|sans inventer/);
    expect(hit.body).not.toMatch(/prouve (une |de la )?force|hypertrophie démontrée|gain musculaire/);
  });

  it('s’abstient sans séances chronométrées suffisantes', () => {
    const rows = exploreSameFormatTimeChange({
      snapshot: { enduranceData: { sessions: { pushups: [] } } },
      window: { start: '2026-11-01', end: '2026-11-19' }
    });
    expect(rows[0].coverage).toBe('under_explored');
  });
});
