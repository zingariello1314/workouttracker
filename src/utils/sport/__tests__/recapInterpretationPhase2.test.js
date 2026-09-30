import { describe, expect, it } from 'vitest';
import {
  emptyInsightHistory,
  recordShownInsights,
  pruneInsightHistory,
  loadInsightHistory
} from '../insightNoveltyStore';
import { computeCandidateNovelty, applyNoveltyWeights, themeFromCandidateId } from '../insightNoveltyEngine';
import { selectBalancedCandidates } from '../recapAdaptiveInsights';
import { detectTrainingEvents } from '../trainingEventDetector';
import { buildCoachStateProse } from '../buildCoachStateProse';

describe('insightNoveltyStore', () => {
  it('enregistre et pénalise les insights déjà vus', () => {
    const now = Date.now();
    const yesterday = now - 26 * 60 * 60 * 1000;
    let history = emptyInsightHistory();
    history = recordShownInsights(
      history,
      [{ id: 'relation.adaptation_success', theme: 'adaptation_success' }],
      yesterday
    );

    const { penalty, novelty } = computeCandidateNovelty(
      { id: 'relation.adaptation_success', pillar: 'interpretation' },
      history,
      now
    );
    expect(penalty).toBeGreaterThan(0);
    expect(novelty).toBeLessThan(0.82);
  });

  it('ne pénalise pas un insight déjà affiché le jour même', () => {
    const now = Date.now();
    const history = recordShownInsights(
      emptyInsightHistory(),
      [{ id: 'relation.reading.short.disc_muscle_now', theme: 'short.disc_muscle_now' }],
      now - 1500
    );
    const { penalty } = computeCandidateNovelty(
      { id: 'relation.reading.short.disc_muscle_now', pillar: 'interpretation' },
      history,
      now
    );
    expect(penalty).toBe(0);
  });

  it('purge les entrées trop anciennes', () => {
    const old = Date.now() - 70 * 86400000;
    const history = {
      version: 1,
      entries: [{ id: 'a', theme: 't', seenAt: old, count: 2 }]
    };
    expect(pruneInsightHistory(history).entries).toHaveLength(0);
  });
});

describe('insightNoveltyEngine', () => {
  it('extrait un thème stable', () => {
    expect(themeFromCandidateId('relation.possible_overreach')).toBe('possible_overreach');
    expect(themeFromCandidateId('garmin.sleep.low')).toBe('garmin.sleep');
  });

  it('baisse le poids des candidats répétés', () => {
    const now = Date.now();
    const yesterday = now - 26 * 60 * 60 * 1000;
    const history = recordShownInsights(emptyInsightHistory(), [{ id: 'x', theme: 'x' }], yesterday);
    const [weighted] = applyNoveltyWeights([{ id: 'x', weight: 80 }], history, now);
    expect(weighted.weight).toBeLessThan(80);
  });
});

describe('selectBalancedCandidates', () => {
  const rich = {
    id: 'relation.reading.short.disc_muscle_now',
    horizon: 'short',
    pillar: 'interpretation',
    weight: 84,
    text: 'La répartition de la semaine montre un profil nettement orienté vers le dos, avec un tirage qui reste minoritaire mais présent sur plusieurs séances.',
    interpretation: { type: 'coach_reading' }
  };
  const basic = {
    id: 'relation.adaptation_success',
    horizon: 'short',
    pillar: 'interpretation',
    weight: 90,
    text: 'Volume +12 % et performance +8 % — adaptation réussie pour l’instant, le corps encaisse encore la charge récente sans signal de casse.',
    interpretation: { type: 'adaptation_success' }
  };

  it('garde la lecture riche devant une phrase générique plus lourde', () => {
    const picked = selectBalancedCandidates([basic, rich], 'short', 1, 'sig', Date.now());
    expect(picked[0].id).toBe(rich.id);
  });
});

describe('trainingEventDetector', () => {
  it('détecte un PR reps', () => {
    const snapshot = { reps: {}, checkedExercises: {} };
    const window = { start: '2026-05-01', end: '2026-06-01' };
    snapshot.exerciseSetLogs = {};
    ['2026-05-05', '2026-05-12', '2026-05-20'].forEach((date, i) => {
      const key = `${date}_101`;
      const best = i < 2 ? 15 : 18;
      snapshot.reps[key] = best + 8;
      snapshot.checkedExercises[key] = true;
      snapshot.exerciseSetLogs[key] = { sets: [{ reps: 8 }, { reps: best }] };
    });

    const bundle = detectTrainingEvents({
      snapshot,
      window,
      getExerciseNameById: () => 'Tractions'
    });
    expect(bundle.events.some((e) => e.type === 'pr_reps')).toBe(true);
  });

  it('détecte une série d\'entraînement', () => {
    const bundle = detectTrainingEvents({
      snapshot: { reps: {}, checkedExercises: {} },
      window: { start: '2026-05-01', end: '2026-06-01' },
      enrichment: { streak: { current: 7, longest: 10 } }
    });
    expect(bundle.events.some((e) => e.type === 'training_streak')).toBe(true);
  });
});

describe('buildCoachStateProse', () => {
  it('compose un paragraphe depuis la meilleure interprétation', () => {
    const text = buildCoachStateProse({
      trainingState: { load: { trend: 'rising' }, performance: { value: 'stable' } },
      composedInterpretations: [
        {
          type: 'adaptation_under_load',
          text: 'Volume +20 % : tes performances tiennent le cap — adaptation plutôt que surcharge.'
        }
      ],
      trainingEvents: { events: [] }
    });
    expect(text).toMatch(/adaptation/i);
  });
});

describe('loadInsightHistory SSR-safe', () => {
  it('retourne vide sans window', () => {
    expect(loadInsightHistory().entries).toEqual([]);
  });
});
