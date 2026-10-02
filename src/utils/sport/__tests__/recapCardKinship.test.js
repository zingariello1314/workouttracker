import { describe, expect, it } from 'vitest';
import { keepDistinctProofCards } from '../recapCardKinship';
import { writeThreadCard } from '../recapAnalysisDepth';

function card({ horizon, kind, title, body, nature }) {
  return {
    id: `relation.reading.${horizon}.${kind}`,
    horizon,
    nature,
    text: `${title}\n\n${body}`,
    interpretation: { context: { title, body, kind, nature } }
  };
}

function blob(c) {
  const ctx = c.interpretation.context;
  return `${ctx.title} ${ctx.body}`;
}

describe('parenté des cartes', () => {
  const opening = 'Ces 30 jours compte 3 467 répétitions sur 13 séances.';

  it('ne publie le même total qu\'une fois, dans Ce que tu as fait', () => {
    const body = `${opening} Cela fait environ 289 répétitions par séance.`;
    const kept = keepDistinctProofCards([
      card({ horizon: 'short', kind: 'disc_th_concentration_now', title: opening, body, nature: 'now' }),
      card({ horizon: 'medium', kind: 'disc_th_concentration_trajectory', title: opening, body, nature: 'trajectory' }),
      card({ horizon: 'long', kind: 'disc_th_concentration_journey', title: opening, body, nature: 'journey' })
    ], { period: '30d', window: { end: '2026-09-30' } });
    expect(kept).toHaveLength(1);
    expect(kept[0].horizon).toBe('short');
    expect(kept[0].evidenceFamilyId).toBe('volume_30d_2026-09-30');
  });

  it('garde 4 944 et 5 561 comme deux comparaisons', () => {
    const kept = keepDistinctProofCards([
      card({
        horizon: 'short',
        kind: 'disc_th_concentration_now',
        title: opening,
        body: `${opening} Les 30 jours d'avant comptait 4 944 répétitions sur 16 séances.`,
        nature: 'now'
      }),
      card({
        horizon: 'long',
        kind: 'disc_vs_prev',
        title: 'Les 30 jours d\'avant',
        body: 'Ces 30 jours compte 3 467 répétitions sur 13 séances. Le début des trois mois comptait 5 561 répétitions.',
        nature: 'journey'
      })
    ], { period: '30d', window: { end: '2026-09-30' } });
    const text = kept.map(blob).join('\n');
    expect(text).toMatch(/4 944/);
    expect(text).toMatch(/5 561/);
  });

  it('retire une carte parasite et un titre plus sûr que le corps', () => {
    const kept = keepDistinctProofCards([
      card({
        horizon: 'medium',
        kind: 'progression_accelerating',
        title: 'Vitesse',
        body: 'Ta vitesse de progression accélère (~+-158.4 reps/sem) — dynamique favorable ; reste prudent sur le volume.',
        nature: 'trajectory'
      }),
      card({
        horizon: 'medium',
        kind: 'disc_sleep_assoc',
        title: 'Le seuil des 7 h 30 sépare tes journées fortes et tes journées courtes',
        body: 'Sur 6 séances, 4 ont été précédées d\'au moins 7 h 30. Le sommeil semble davantage associé au volume.',
        nature: 'trajectory'
      }),
      card({
        horizon: 'medium',
        kind: 'disc_sleep_family',
        title: 'Après une nuit courte',
        body: 'Les séances de tirage tombent à 112,0 %. Le tirage apparaît comme la qualité la plus sensible à une mauvaise récupération dans cet historique (7 et 8 séances).',
        nature: 'trajectory'
      })
    ], { period: '30d', window: { end: '2026-09-30' } });
    const text = kept.map(blob).join('\n');
    expect(text).not.toMatch(/~[+-]/);
    expect(text).not.toMatch(/dynamique favorable/);
    expect(text).not.toMatch(/\bsépare\b/);
    expect(text).toMatch(/atteignent 112,0 %/);
    expect(text).not.toMatch(/la plus sensible/);
  });

  it('nomme la fenêtre Garmin réelle sur 6 mois', () => {
    const kept = keepDistinctProofCards([
      card({
        horizon: 'long',
        kind: 'disc_kcal_profile',
        title: 'Dépense',
        body: '38 086 kcal actives sur ces six mois.',
        nature: 'journey'
      })
    ], {
      period: '6m',
      window: { start: '2026-04-01', end: '2026-09-30' },
      metricDates: ['2026-07-02', '2026-09-19']
    });
    expect(blob(kept[0])).toMatch(/02\/07\/2026/);
    expect(blob(kept[0])).toMatch(/19\/09\/2026/);
    expect(blob(kept[0])).not.toMatch(/ces six mois/i);
  });
});

describe('rédacteur après parenté', () => {
  it('un dérivé ne recommence pas par le total de la fenêtre', () => {
    const card = writeThreadCard({
      thread: 'repertoire',
      sense: 'transformation',
      voice: '30d',
      windowLabel: 'Ces 30 jours',
      axes: ['repertoire', 'volume'],
      observed: {
        reps: 3467,
        sessions: 13,
        repertoire: { exited: { name: 'Pompes (endurance)', reps: 400 } }
      }
    });
    expect(card.body).toMatch(/Pompes \(endurance\)/);
    expect(card.body).not.toMatch(/3\s?467/);
    expect(card.body).not.toMatch(/Ces 30 jours compte/);
    expect(card.title).not.toMatch(/3\s?467/);
  });
});
