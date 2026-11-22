/**
 * Mission 5 bis — rejeu incrémental v4 (un horizon = un test).
 * P4_REPLAY=1 requis. Reprend depuis p6-replay-v4-partial.json.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { analysisEditionKey } from '../analysisEdition';
import {
  BACKUP_19_NOV,
  REPLAY_PERIODS,
  loadPartialReplay,
  savePartialReplay,
  replayOnePeriod,
  writeMission5BisArtifacts,
  addDays,
  windowFor
} from '../evaluation/incrementalP6Replay';
import { coverageForSnapshot } from '../historicalOrphanExercises';

const ENABLED = existsSync(BACKUP_19_NOV) && process.env.P4_REPLAY === '1';
const END = '2026-11-19';
const V3_BASELINE = path.join(
  process.cwd(),
  'artifacts/analysis-eval/baselines/p6-replay-p6-sovereign-v3-before-mission5.json'
);
const V5_BASELINE = path.join(
  process.cwd(),
  'artifacts/analysis-eval/baselines/p6-replay-p6-sovereign-v5-before-mission7.json'
);

function loadSnapshot() {
  const backup = JSON.parse(readFileSync(BACKUP_19_NOV, 'utf8'));
  return backup.data;
}

function firstDateOf(snapshot) {
  return Object.keys(snapshot.reps || {})
    .map((key) => key.slice(0, 10))
    .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
    .sort()[0];
}

describe.skipIf(!ENABLED)('Mission 5 bis — rejeu incrémental p6-sovereign-v10', () => {
  it('édition courante v10', () => {
    expect(analysisEditionKey()).toMatch(/editorial=p6-sovereign-v1[0-9]/);
    expect(analysisEditionKey()).toMatch(/program=structural-context-v[23]/);
    expect(analysisEditionKey()).toMatch(/review=collective-pass4-v[78]/);
    expect(analysisEditionKey()).toMatch(/claim=proof-pipeline-v3/);
    expect(analysisEditionKey()).toMatch(/sleep=association-prose-v[23]/);
  });

  REPLAY_PERIODS.forEach((period) => {
    it(
      `horizon ${period}`,
      () => {
        const snapshot = loadSnapshot();
        const firstDate = firstDateOf(snapshot);
        const partial = loadPartialReplay();
        if (partial.periods?.[period]?.publication?.authority) {
          // déjà calculé — ne pas recommencer
          expect(partial.periods[period].period).toBe(period);
          return;
        }
        const row = replayOnePeriod({ snapshot, period, end: END, firstDate });
        expect(row.p6?.reconciled).toBe(true);
        expect(row.publication?.lostSilent || []).toEqual([]);
        partial.periods = { ...(partial.periods || {}), [period]: row };
        partial.updatedAt = new Date().toISOString();
        partial.edition = analysisEditionKey();
        savePartialReplay(partial);
        expect(row.ms).toBeGreaterThan(0);
      },
      120000
    );
  });

  it(
    'assemble artefacts v3/v4 + ZIP + bridge navigateur',
    () => {
      const snapshot = loadSnapshot();
      const firstDate = firstDateOf(snapshot);
      const partial = loadPartialReplay();
      const missing = REPLAY_PERIODS.filter((p) => !partial.periods?.[p]);
      expect(missing, `horizons manquants: ${missing.join(',')}`).toEqual([]);

      // sanity couverture 7d (identité)
      const week = coverageForSnapshot(snapshot, windowFor('7d', END, firstDate), null);
      expect(week.identifiedReps).toBeGreaterThan(600);

      const v3 = existsSync(V3_BASELINE)
        ? JSON.parse(readFileSync(V3_BASELINE, 'utf8'))
        : null;
      expect(v3, 'baseline v3 absente').toBeTruthy();
      const v5 = existsSync(V5_BASELINE)
        ? JSON.parse(readFileSync(V5_BASELINE, 'utf8'))
        : null;
      expect(v5, 'baseline v5 absente (Mission 7)').toBeTruthy();

      let bilanMd = null;
      const bilanPaths = [
        path.join(
          process.cwd(),
          'docs/analyses-documentation/moteur analyse v2/analysis-engine/MISSION8_BILAN_P6.md'
        ),
        path.join(
          process.cwd(),
          'docs/analyses-documentation/moteur analyse v2/analysis-engine/MISSION7_BILAN_P6.md'
        ),
        path.join(
          process.cwd(),
          'docs/analyses-documentation/moteur analyse v2/analysis-engine/MISSION6_BILAN_P6.md'
        ),
        path.join(
          process.cwd(),
          'docs/analyses-documentation/moteur analyse v2/analysis-engine/MISSION5_BILAN_P6.md'
        )
      ];
      const bilanPath = bilanPaths.find((p) => existsSync(p));
      if (bilanPath) bilanMd = readFileSync(bilanPath, 'utf8');

      const result = writeMission5BisArtifacts({
        snapshot,
        partial,
        v3Replay: v3,
        end: END,
        bilanMd,
        qualitativeBaseline: v5
      });
      expect(result.replay.complete).toBe(true);
      expect(result.replay.edition).toMatch(/p6-sovereign-v1[01]/);
      expect(existsSync(result.zipLatest)).toBe(true);
      expect(existsSync(result.bridgePath)).toBe(true);

      // aucune perte silencieuse sur les 8
      REPLAY_PERIODS.forEach((period) => {
        const row = result.replay.periods[period];
        expect(row.publication.lostSilent || []).toEqual([]);
      });
    },
    60000
  );
});
