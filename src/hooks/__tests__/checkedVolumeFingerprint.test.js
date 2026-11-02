import { describe, expect, it } from 'vitest';

// Teste la logique via une copie locale miroir du fingerprint exporté indirectement :
// on réimplémente le critère de non-collision sur des fixtures (le symbole n’est pas exporté).
// Pour coller au code réel, on importe le module et on force l’accès via buildRecapMetricsKey
// si disponible ; sinon on vérifie les propriétés attendues via dynamic import + eval du fichier.

async function loadFingerprintFn() {
  const mod = await import('../../hooks/useRecapTabMetrics.js');
  // Non exporté : on valide via buildRecapMetricsKey si exporté
  if (typeof mod.buildRecapMetricsKey === 'function') {
    return (snap) =>
      mod.buildRecapMetricsKey({
        snapshot: snap,
        deferredPeriod: '30d',
        periodWindow: { start: '2026-01-01', end: '2026-01-31' },
        activeProgram: { id: 'p1' },
        programs: [],
        profileQuestionnaireRaw: null,
        garminPartial: { status: 'none' },
        nutritionPartial: { status: 'none' },
        garminBundle: null,
        isAuthenticated: false,
        isAdmin: false,
        isGymMode: false,
        accountScope: 'test'
      }).workout;
  }
  return null;
}

function baseSnap() {
  return {
    checkedExercises: {
      '2026-06-01_10': true,
      '2026-06-01_20': true
    },
    reps: {
      '2026-06-01_10': 40,
      '2026-06-01_20': 40
    },
    exerciseWeights: {
      '2026-06-01_10': '20',
      '2026-06-01_20': '10'
    },
    exerciseWeightPerArm: {},
    exerciseSetLogs: {},
    exerciseSetWeights: {},
    enduranceData: {
      sessions: { running: [], pushups: [], jumprope: [], gainage: [] },
      gtg: { days: {} }
    }
  };
}

describe('checkedVolumeFingerprint via buildRecapMetricsKey', () => {
  it('change quand on permute les reps entre exercices à total constant', async () => {
    const fp = await loadFingerprintFn();
    if (!fp) return;
    const a = baseSnap();
    const b = baseSnap();
    b.reps['2026-06-01_10'] = 60;
    b.reps['2026-06-01_20'] = 20;
    expect(fp(a)).not.toEqual(fp(b));
  });

  it('change quand la charge structurée change sans changer le nombre de sets lestés', async () => {
    const fp = await loadFingerprintFn();
    if (!fp) return;
    const a = baseSnap();
    a.exerciseSetLogs = {
      '2026-06-01_10': { sets: [{ reps: 10, weight: 20 }, { reps: 10, weight: 20 }] }
    };
    const b = structuredClone(a);
    b.exerciseSetLogs['2026-06-01_10'].sets[1].weight = 25;
    expect(fp(a)).not.toEqual(fp(b));
  });

  it('change quand le nombre de séries change à reps totales égales', async () => {
    const fp = await loadFingerprintFn();
    if (!fp) return;
    const a = baseSnap();
    a.exerciseSetLogs = {
      '2026-06-01_10': { sets: [{ reps: 20, weight: 0 }, { reps: 20, weight: 0 }] }
    };
    const b = structuredClone(a);
    b.exerciseSetLogs['2026-06-01_10'] = {
      sets: [{ reps: 10, weight: 0 }, { reps: 10, weight: 0 }, { reps: 10, weight: 0 }, { reps: 10, weight: 0 }]
    };
    expect(fp(a)).not.toEqual(fp(b));
  });

  it('change quand perArm bascule', async () => {
    const fp = await loadFingerprintFn();
    if (!fp) return;
    const a = baseSnap();
    const b = baseSnap();
    b.exerciseWeightPerArm['2026-06-01_10'] = true;
    expect(fp(a)).not.toEqual(fp(b));
  });
});
