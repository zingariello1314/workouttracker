import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { analysisRunKey } from '../../../hooks/useRecapTabMetrics';
import { applyNoveltyWeights } from '../insightNoveltyEngine';
import { applyNatureWeights } from '../recapInsightNature';
import { familyFadeTitle, periodVerb } from '../recapPeriodVoice';
import {
  compareAnalysisEnvironmentDossiers,
  listPublishedCards,
  publicationPackState,
  summarizeInsightHistory,
  windowEvidence
} from '../analysisEnvironmentDossier';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');

function loadDossier(name) {
  return JSON.parse(readFileSync(resolve(root, 'diagnostics', name), 'utf8'));
}

describe('dossier Chrome / Cursor du 18 novembre 2026', () => {
  const chrome = loadDossier('momentum-analysis-dossier-7d-2026-11-18T18-30-22-270Z.json');
  const cursor = loadDossier('cursor-browser-tab-7d-2026-11-12-18.json');
  const diff = compareAnalysisEnvironmentDossiers(chrome, cursor, {
    left: 'chrome',
    right: 'cursor'
  });

  it('compare la même fenêtre civile et des compteurs de séance différents', () => {
    expect(diff.window.sameCalendarBounds).toBe(true);
    expect(diff.banner.totalReps).toEqual({ left: 1334, right: 1002, delta: -332 });
    expect(diff.snapshot.totalReps).toEqual({ left: 33100, right: 32768, delta: -332 });
    expect(diff.snapshot.repKeys.delta).toBe(-7);
    expect(diff.cards.leftCount).toBe(7);
    expect(diff.cards.rightCount).toBe(20);
  });

  it('voit les deux paquets comme une édition précédente pendant un rafraîchissement', () => {
    expect(diff.publication.left.state).toBe('previous_edition_while_refreshing');
    expect(diff.publication.right.state).toBe('previous_edition_while_refreshing');
    expect(diff.publication.left.definitive).toBe(false);
  });

  it('ne rejoue pas l’historique à partir des douze lignes exportées', () => {
    expect(diff.history.replayable).toBe(false);
    expect(diff.history.leftCount).toBe(180);
    expect(diff.history.rightCount).toBe(73);
    expect(diff.limits.some((line) => line.includes('Aucune rejeu') || line.includes('historiques complets'))).toBe(
      true
    );
  });

  it('sépare les conclusions communes des preuves qui changent', () => {
    const sharedKinds = diff.cards.shared.map((card) => card.kind);
    expect(sharedKinds).toContain('disc_sleep_night');
    expect(sharedKinds).toContain('disc_ms_pr_consolidated');
    expect(diff.cards.sameKindDifferentProof.some((row) => row.kind === 'disc_family_fade')).toBe(true);
    expect(diff.cards.blankTitle.left.length).toBeGreaterThan(0);
    expect(diff.cards.blankTitle.right.length).toBeGreaterThan(0);
  });

  it('enregistre le rapport machine à côté des dossiers', () => {
    writeFileSync(
      resolve(root, 'diagnostics', 'chrome-cursor-7d-diff.json'),
      `${JSON.stringify(diff, null, 2)}\n`
    );
    expect(diff.schema).toBe('momentum.analysisDossierDiff.v1');
  });

  it('lit l’expérience Chrome malgré les noms de champs inversés', () => {
    expect(diff.experiments.left.fieldSemantics).toBe('inverted-names-2026-11-18');
    expect(diff.experiments.left.displayedCount).toBe(7);
    expect(diff.experiments.left.freshCount).toBe(11);
    expect(diff.experiments.left.afterIsolatedAdditionCount).toBe(11);
    expect(diff.experiments.left.disappeared).toEqual([]);
    expect(diff.experiments.left.appeared).toEqual([]);
    expect(diff.experiments.right).toBeNull();
    expect(diff.signatures.left.candidateCount).toBe(16);
    expect(diff.signatures.right.candidateCount).toBe(22);
    expect(diff.signatures.left.note).toMatch(/candidats/);
  });
});

describe('export — le corps d’une carte sans titre reste visible', () => {
  it('ne confond pas un titre vide avec une carte vide', () => {
    const cards = listPublishedCards({
      shortTerm: [{ kind: 'adherence_gap', title: '', body: 'Les étirements restent en retrait.', evidence: ['exos 80'] }],
      mediumTerm: [],
      longTerm: []
    });
    expect(cards[0].titleBlank).toBe(true);
    expect(cards[0].body).toMatch(/étirements/);
    expect(cards[0].evidence).toBe('exos 80');
  });
});

describe('historique — l’export nomme les plus récentes, la pénalité ne supprime pas le candidat', () => {
  it('prend les douze premières après tri du plus récent au plus ancien', () => {
    const history = summarizeInsightHistory({
      version: 1,
      entries: [
        { id: 'old', theme: 'a', seenAt: 10, count: 1 },
        { id: 'new', theme: 'b', seenAt: 30, count: 2 }
      ]
    });
    expect(history.order).toBe('newest_first');
    expect(history.recent[0].id).toBe('new');
    expect(history.oldest.at(-1).id).toBe('old');
    expect(history.entries).toHaveLength(2);
  });

  it('même candidats : un historique lourd change le poids, pas la liste', () => {
    const now = Date.parse('2026-11-18T12:00:00Z');
    const candidate = {
      id: 'relation.reading.long.disc_ms_hours',
      weight: 40,
      text: 'heures'
    };
    const empty = applyNoveltyWeights([candidate], { entries: [] }, now);
    const heavy = applyNoveltyWeights(
      [candidate],
      {
        entries: [
          {
            id: candidate.id,
            theme: 'long.disc_ms_hours',
            seenAt: Date.parse('2026-11-08T12:00:00Z'),
            count: 5
          }
        ]
      },
      now
    );
    const sameDay = applyNoveltyWeights(
      [candidate],
      {
        entries: [
          {
            id: candidate.id,
            theme: 'long.disc_ms_hours',
            seenAt: Date.parse('2026-11-18T10:00:00Z'),
            count: 9
          }
        ]
      },
      now
    );
    expect(empty.map((card) => card.id)).toEqual(heavy.map((card) => card.id));
    expect(heavy[0].weight).toBeLessThan(empty[0].weight);
    expect(heavy[0].weight).toBeLessThan(32);
    expect(sameDay[0].weight).toBe(empty[0].weight);
  });

  it('le plancher 20 puis le bonus de nature redonne les poids Chrome 36, 32 et 25', () => {
    const now = Date.parse('2026-11-18T21:10:00Z');
    const seenAt = Date.parse('2026-11-10T21:10:00Z');
    const cases = [
      ['relation.reading.long.disc_exercise_progress.105', 70, 36],
      ['relation.reading.long.journey_progress.105', 70, 32],
      ['relation.reading.medium.journey_plateau', 70, 25]
    ];
    for (const [id, base, expected] of cases) {
      const [afterNovelty] = applyNoveltyWeights(
        [{ id, weight: base, text: 'lecture', horizon: 'long' }],
        { entries: [{ id, theme: 'autre-theme', seenAt, count: 5 }] },
        now
      );
      expect(afterNovelty.weightAfterNovelty).toBe(20);
      expect(afterNovelty.noveltyParts.recent).toBe(28);
      expect(afterNovelty.noveltyParts.count).toBe(22);
      const [afterNature] = applyNatureWeights([afterNovelty], []);
      expect(afterNature.weight).toBe(expected);
    }
  });
});

describe('publication — rafraîchissement et relance', () => {
  it('un statut refreshing avec une publication ready n’est pas l’édition définitive', () => {
    expect(
      publicationPackState({
        analysisStatus: 'refreshing',
        publication: { status: 'ready', complete: true }
      }).definitive
    ).toBe(false);
  });

  it('une horloge endAt différente ne change pas la clé de calcul', () => {
    const base = {
      cacheReady: true,
      enabled: true,
      period: '7d',
      windowStart: '2026-11-12',
      windowEnd: '2026-11-18',
      windowMode: 'inclusive-calendar',
      workoutKey: 'w',
      fullKey: 'f',
      pending: false,
      isGymMode: false
    };
    expect(analysisRunKey(base)).toBe(analysisRunKey({ ...base, windowEnd: '2026-11-18' }));
    expect(analysisRunKey(base)).not.toBe(analysisRunKey({ ...base, fullKey: 'other' }));
  });
});

describe('preuves de fenêtre pour un prochain rejeu', () => {
  it('ne garde que les clés datées dans la fenêtre', () => {
    const evidence = windowEvidence(
      {
        reps: { '2026-11-17::101': 40, '2026-10-01::101': 10 },
        checkedExercises: { '2026-11-17_101': true, '2026-11-01_101': true },
        exerciseSetLogs: { '2026-11-17::101': { sets: [{ reps: 10 }] } }
      },
      { start: '2026-11-12', end: '2026-11-18' }
    );
    expect(evidence.reps).toEqual({ '2026-11-17::101': 40 });
    expect(Object.keys(evidence.checkedExercises)).toEqual(['2026-11-17_101']);
    expect(evidence.setLogCount).toBe(1);
  });
});

describe('accord des titres déjà publiés', () => {
  it('n’écrit pas « de de » et accorde le verbe au pluriel de la période', () => {
    expect(familyFadeTitle('Dips sur barre parallèle', 'poussée')).toBe(
      "Dips sur barre parallèle s'efface de ta poussée"
    );
    expect(periodVerb('ces 7 jours', "s'inscrit", "s'inscrivent")).toBe("s'inscrivent");
  });
});
