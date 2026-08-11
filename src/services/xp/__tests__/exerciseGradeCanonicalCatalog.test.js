import { describe, expect, it } from 'vitest';
import {
  canonicalCatalogKeyForExerciseId,
  slugFromExerciseName,
  discoverCanonicalExerciseGradeCatalogKeys
} from '../exerciseGradeCanonicalCatalog';
import { exerciseMatchesCatalogKey } from '../exerciseGradeCatalogMetrics';
import { buildExerciseGradeCatalog } from '../exerciseGradeEngine';

describe('canonicalCatalogKeyForExerciseId', () => {
  it('fusionne les IDs qui partagent le benchmark dips', () => {
    const getName = (id) =>
      String(id) === '88' ? 'Dip barre A' : String(id) === '90' ? 'Dip barre B' : '';
    expect(canonicalCatalogKeyForExerciseId('88', getName)).toBe('dips');
    expect(canonicalCatalogKeyForExerciseId('90', getName)).toBe('dips');
  });

  it('sépare les pompes par intitulé exact (name:…)', () => {
    const getName = (id) => {
      const map = {
        104: 'Pompes inclinées pieds sur banc',
        504: 'Pompes déclinées (pieds sur banc)',
        105: 'Pompes inclinées mains sur banc',
        204: 'Curl marteau',
        100: 'Pompes classiques',
        999: 'Pompes en tension continue'
      };
      return map[String(id)] || '';
    };
    expect(canonicalCatalogKeyForExerciseId('104', getName)).toBe('name:pompes-inclinees');
    expect(canonicalCatalogKeyForExerciseId('504', getName)).toBe('name:pompes-declinees');
    expect(canonicalCatalogKeyForExerciseId('105', getName)).toBe('name:pompes-inclinees');
    expect(canonicalCatalogKeyForExerciseId('301', (id) =>
      String(id) === '301' ? 'Pompes déclinées' : ''
    )).toBe('name:pompes-declinees');
    expect(canonicalCatalogKeyForExerciseId('999', getName)).toBe('name:pompes-en-tension-continue');
    expect(canonicalCatalogKeyForExerciseId('204', getName)).toBe('hammer_curl');
  });

  it('fusionne face pull et face pull élastique', () => {
    const a = (id) => (String(id) === '306' ? 'Face pull' : 'Face pull élastique');
    expect(canonicalCatalogKeyForExerciseId('306', a)).toBe('face_pull');
    expect(canonicalCatalogKeyForExerciseId('706', a)).toBe('face_pull');
  });

  it('fusionne dips sur barre parallèle et dips parallèle', () => {
    const getName = (id) =>
      String(id) === '88' ? 'Dips sur barre parallèle' : 'Dips parallèle';
    expect(canonicalCatalogKeyForExerciseId('88', getName)).toBe('dips');
    expect(canonicalCatalogKeyForExerciseId('90', getName)).toBe('dips');
  });

  it('regroupe hors registre par nom normalisé', () => {
    const getName = () => 'Extension mollets machine';
    expect(canonicalCatalogKeyForExerciseId('88881', getName)).toBe(
      canonicalCatalogKeyForExerciseId('88882', getName)
    );
    expect(canonicalCatalogKeyForExerciseId('88881', getName)).toMatch(/^name:/);
  });

  it('sépare tractions pronation et supination', () => {
    const getName = (id) =>
      String(id) === '101'
        ? 'Tractions pronation'
        : String(id) === '501'
          ? 'Tractions supination'
          : '';
    const pronationKey = canonicalCatalogKeyForExerciseId('101', getName);
    const supinationKey = canonicalCatalogKeyForExerciseId('501', getName);
    expect(pronationKey).toBe('name:tractions-pronation');
    expect(supinationKey).toBe('name:tractions-supination');
    expect(pronationKey).not.toBe(supinationKey);
    expect(exerciseMatchesCatalogKey(pronationKey, '501', getName)).toBe(false);
    expect(exerciseMatchesCatalogKey(supinationKey, '101', getName)).toBe(false);
  });
});

describe('buildExerciseGradeCatalog déduplication', () => {
  it('une seule carte dips pour plusieurs IDs', () => {
    const snapshot = {
      checkedExercises: {
        '2026-08-01_88': true,
        '2026-08-03_90': true
      },
      reps: { '2026-08-01_88': '48', '2026-08-03_90': '48' },
      exerciseSetLogs: {
        '2026-08-01_88': {
          sets: [
            { reps: 48, weight: null },
            { reps: 48, weight: null }
          ],
          schemaVersion: 1
        }
      }
    };
    const getName = (id) => (String(id) === '88' || String(id) === '90' ? 'Dip aux barres' : '');
    const rows = buildExerciseGradeCatalog(snapshot, getName, {
      weightKg: 75,
      heightCm: 175,
      age: 30
    });
    const dipsRows = rows.filter((r) => r.benchmarkKey === 'dips');
    expect(dipsRows).toHaveLength(1);
    expect(dipsRows[0].metrics.totalReps).toBeGreaterThanOrEqual(96 + 48);
  });
});
