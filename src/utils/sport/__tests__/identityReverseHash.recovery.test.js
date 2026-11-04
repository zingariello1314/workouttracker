import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { buildExerciseNameMap } from '../recapAdaptiveWorkerContract';
import { withRepairedDisplayName } from '../recapEditorialSelection';
import { convertToStableNumericId } from '../../workoutExerciseIdResolve';

const root = path.resolve(__dirname, '../../../../');
const nameMapPath = path.join(
  root,
  'docs/analyses-documentation/fixtures/exercise-name-map-main.json'
);
const fixturePath = path.join(
  root,
  'docs/analyses-documentation/fixtures/workout-main-jul-oct-2026.json'
);

describe('recovery IDs hashés → noms (sans invention)', () => {
  it('buildExerciseNameMap résout les hash via originaux ex_/dup_', () => {
    const nameById = JSON.parse(fs.readFileSync(nameMapPath, 'utf8'));
    const snapshot = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
    const map = buildExerciseNameMap(snapshot, (id) => nameById[String(id)] || '', {
      extraNameById: nameById
    });

    const cases = [
      ['ex_1790540909908_zqmzjwj', 'Tractions australiennes — prise serrée supination'],
      ['dup_1790542938555_t1fvyur', 'Pompes inclinées'],
      ['dup_1790542938555_2ymyflz', 'Squat haltères']
    ];
    for (const [original, expected] of cases) {
      const hash = String(convertToStableNumericId(original));
      expect(map[hash]).toBe(expected);
      expect(map[hash]).not.toMatch(/un mouvement/i);
    }
  });

  it('withRepairedDisplayName remplace « un mouvement » après reverse-hash', () => {
    const nameById = JSON.parse(fs.readFileSync(nameMapPath, 'utf8'));
    const snapshot = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
    const map = buildExerciseNameMap(snapshot, (id) => nameById[String(id)] || '', {
      extraNameById: nameById
    });
    const hash = String(convertToStableNumericId('dup_1790542938555_t1fvyur'));
    const d = withRepairedDisplayName(
      {
        kind: 'disc_emergence',
        title: 'un mouvement : format repris, pas encore installé',
        body: 'un mouvement revient après une interruption',
        metrics: { exerciseId: hash, name: 'un mouvement' }
      },
      (id) => map[String(id)] || '',
      { snapshot, nameById: map }
    );
    expect(d.title).toMatch(/Pompes inclinées/i);
    expect(d.title).not.toMatch(/un mouvement/i);
    expect(d.metrics.name).toBe('Pompes inclinées');
  });
});
