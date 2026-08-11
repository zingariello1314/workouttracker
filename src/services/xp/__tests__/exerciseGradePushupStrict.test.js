import { describe, expect, it } from 'vitest';
import { slugFromExerciseName } from '../exerciseGradeCanonicalCatalog';
import { exerciseMatchesCatalogKey } from '../exerciseGradeCatalogMetrics';
import { extractMetricsForCatalogKey } from '../exerciseGradeCatalogMetrics';
import { canonicalCatalogKeyForExerciseId } from '../exerciseGradeCanonicalCatalog';

describe('grades pompes — intitulé strict', () => {
  const getName = (id) =>
    ({
      504: 'Pompes déclinées (pieds sur banc)',
      999: 'Pompes en tension continue',
      101: 'Pompes classiques'
    })[String(id)] || '';

  it('deux intitulés = deux clés catalogue', () => {
    const a = `name:${slugFromExerciseName('Pompes déclinées (pieds sur banc)')}`;
    const b = `name:${slugFromExerciseName('Pompes en tension continue')}`;
    expect(a).not.toBe(b);
  });

  it('exerciseMatchesCatalogKey ne mélange pas les variantes distinctes', () => {
    const keyDecline = 'name:pompes-declinees';
    expect(exerciseMatchesCatalogKey(keyDecline, '504', getName)).toBe(true);
    expect(exerciseMatchesCatalogKey(keyDecline, '999', getName)).toBe(false);
  });

  it('fusionne Pompes déclinées et Pompes déclinées (pieds sur banc)', () => {
    const getDecline = (id) =>
      String(id) === '301'
        ? 'Pompes déclinées'
        : String(id) === '504'
          ? 'Pompes déclinées (pieds sur banc)'
          : '';
    expect(canonicalCatalogKeyForExerciseId('301', getDecline)).toBe('name:pompes-declinees');
    expect(canonicalCatalogKeyForExerciseId('504', getDecline)).toBe('name:pompes-declinees');

    const snapshot = {
      checkedExercises: {
        '2026-01-10_301': true,
        '2026-01-15_504': true
      },
      reps: {
        '2026-01-10_301': '691',
        '2026-01-15_504': '500'
      }
    };
    const metrics = extractMetricsForCatalogKey(snapshot, 'name:pompes-declinees', getDecline);
    expect(metrics.totalReps).toBe(1191);
    expect(metrics.checkCount).toBe(2);
  });

  it('les défis endurance ne gonflent pas une variante (tension continue)', () => {
    const key = `name:${slugFromExerciseName('Pompes en tension continue')}`;
    const snapshot = {
      checkedExercises: { '2026-01-10_999': true },
      reps: { '2026-01-10_999': '30' },
      enduranceData: {
        sessions: {
          pushups: [{ date: '2026-01-11', count: 200, id: 'defi1' }]
        }
      }
    };
    const metrics = extractMetricsForCatalogKey(snapshot, key, getName);
    expect(metrics.totalReps).toBe(30);
    expect(metrics.checkCount).toBe(1);
  });

  it('ajoute les défis uniquement sur name:pompes', () => {
    const key = 'name:pompes';
    const snapshot = {
      checkedExercises: { '2026-01-10_101': true },
      reps: { '2026-01-10_101': '30' },
      enduranceData: {
        sessions: {
          pushups: [{ date: '2026-01-11', count: 200, id: 'defi1' }]
        }
      }
    };
    const getNamePlain = (id) => (String(id) === '101' ? 'Pompes' : '');
    const metrics = extractMetricsForCatalogKey(snapshot, key, getNamePlain);
    expect(metrics.totalReps).toBe(230);
    expect(metrics.checkCount).toBe(2);
  });

  it('roule les poignées dans name:pompes sans fiche séparée', () => {
    const plainKey = 'name:pompes';
    const handlesKey = `name:${slugFromExerciseName('Pompes sur poignées')}`;
    const tempoKey = `name:${slugFromExerciseName('Pompes sur poignées tempo')}`;
    expect(handlesKey).toBe('name:pompes-sur-poignees');
    expect(tempoKey).toBe('name:pompes-sur-poignees-tempo');

    const getName = (id) =>
      ({
        100: 'Pompes',
        310: 'Pompes sur poignées tempo',
        320: 'Pompes sur poignées'
      })[String(id)] || '';

    expect(canonicalCatalogKeyForExerciseId('310', getName)).toBe(plainKey);
    expect(canonicalCatalogKeyForExerciseId('320', getName)).toBe(plainKey);
    expect(canonicalCatalogKeyForExerciseId('710', (id) =>
      String(id) === '710' ? 'Pompes tempo sur poignées' : ''
    )).toBe(plainKey);
    expect(canonicalCatalogKeyForExerciseId('701', (id) =>
      String(id) === '701' ? 'Pompes sur poignées avec gilet' : ''
    )).toBe('name:pompes-sur-poignees-avec-gilet');

    const snapshot = {
      checkedExercises: {
        '2026-01-10_100': true,
        '2026-01-11_310': true,
        '2026-01-12_320': true
      },
      reps: {
        '2026-01-10_100': '20',
        '2026-01-11_310': '36',
        '2026-01-12_320': '24'
      }
    };
    const metrics = extractMetricsForCatalogKey(snapshot, plainKey, getName);
    expect(metrics.totalReps).toBe(80);
    expect(metrics.checkCount).toBe(3);
  });

  it('fusionne toutes les pompes inclinées en une fiche', () => {
    const inclineKey = 'name:pompes-inclinees';
    const getName = (id) =>
      ({
        104: 'Pompes inclinées pieds sur banc',
        202: 'Pompes inclinées sur support',
        601: 'Pompes inclinées tempo',
        702: 'Pompes pseudo-planche inclinées',
        105: 'Pompes inclinées mains sur banc'
      })[String(id)] || '';

    expect(canonicalCatalogKeyForExerciseId('104', getName)).toBe(inclineKey);
    expect(canonicalCatalogKeyForExerciseId('202', getName)).toBe(inclineKey);
    expect(canonicalCatalogKeyForExerciseId('601', getName)).toBe(inclineKey);
    expect(canonicalCatalogKeyForExerciseId('702', getName)).toBe(inclineKey);
    expect(canonicalCatalogKeyForExerciseId('105', getName)).toBe(inclineKey);

    const snapshot = {
      checkedExercises: {
        '2026-01-10_104': true,
        '2026-01-11_202': true,
        '2026-01-12_601': true,
        '2026-01-13_702': true
      },
      reps: {
        '2026-01-10_104': '276',
        '2026-01-11_202': '96',
        '2026-01-12_601': '92',
        '2026-01-13_702': '60'
      }
    };
    const metrics = extractMetricsForCatalogKey(snapshot, inclineKey, getName);
    expect(metrics.totalReps).toBe(524);
    expect(metrics.checkCount).toBe(4);
  });
});
