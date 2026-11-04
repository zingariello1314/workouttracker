import { describe, expect, it } from 'vitest';
import {
  sanitizeAnalysisExerciseDisplayName,
  userFacingExerciseLabel,
  resolveExerciseNameForRecap
} from '../recapStrengthPeriodStats';
import { isUnresolvedExerciseName } from '../recapEditorialSelection';
import { insightRejectReason } from '../recapInsightValidate';
import { applyEditorialGate } from '../recapEditorialGate';
import { lookupProgramExerciseStub } from '../../exerciseLoadVolume';
import { detectRecapMilestones } from '../recapMilestoneEngine';

describe('identité dips — pas de gilet spéculatif', () => {
  it('retire « avec gilet » du libellé template exact', () => {
    expect(sanitizeAnalysisExerciseDisplayName('Dips sur barre parallèle avec gilet')).toBe(
      'Dips sur barre parallèle'
    );
  });

  it('ne fusionne pas « Dips lestés » avec les dips classiques', () => {
    expect(sanitizeAnalysisExerciseDisplayName('Dips lestés')).toBe('Dips lestés');
    expect(userFacingExerciseLabel('Dips lestés')).toBe('Dips lestés');
  });

  it('conserve une variante réellement nommée « avec gilet » (ex. pompes 701)', () => {
    expect(sanitizeAnalysisExerciseDisplayName('Pompes sur poignées avec gilet')).toBe(
      'Pompes sur poignées avec gilet'
    );
    expect(userFacingExerciseLabel('Pompes sur poignées avec gilet')).toBe(
      'Pompes sur poignées avec gilet'
    );
  });

  it('lookup stub programme ne revendique plus le gilet pour id 503', () => {
    const stub = lookupProgramExerciseStub(503);
    expect(stub.name).toBe('Dips sur barre parallèle');
    expect(stub.name).not.toMatch(/gilet/i);
  });

  it('resolveExerciseNameForRecap via getter trompeur reste nettoyé', () => {
    const name = resolveExerciseNameForRecap(503, () => 'Dips sur barre parallèle avec gilet');
    expect(name).toBe('Dips sur barre parallèle');
  });

  it('homonymes : ids distincts ne partagent pas le nom nettoyé comme identité', () => {
    const a = resolveExerciseNameForRecap(503, (id) =>
      String(id) === '503' ? 'Dips sur barre parallèle avec gilet' : ''
    );
    const b = resolveExerciseNameForRecap(999, () => 'Dips lestés');
    expect(a).toBe('Dips sur barre parallèle');
    expect(b).toBe('Dips lestés');
    expect(a).not.toBe(b);
  });
});

describe('sélection — caps d’épisodes adaptatifs', () => {
  it('autorise davantage d’épisodes distincts sur month/week', async () => {
    const { episodeCapForVoice } = await import('../recapEditorialSelection');
    expect(episodeCapForVoice('week')).toBeGreaterThanOrEqual(4);
    expect(episodeCapForVoice('month')).toBeGreaterThanOrEqual(6);
  });

  it('rejette « un mouvement » via insightRejectReason', async () => {
    const { insightRejectReason } = await import('../recapInsightValidate');
    expect(
      insightRejectReason({
        kind: 'journey_plateau',
        title: 'Plateau — un mouvement',
        body: 'Ton niveau habituel sur un mouvement reste autour de 40 reps.'
      })
    ).toBe('anonymous_exercise_label');
  });
});

describe('prose incomplète — tous chemins de publication', () => {
  it('rejette Première apparition sans sujet', () => {
    const card = {
      kind: 'disc_ms_first_exercise',
      title: 'Première apparition :',
      body: 'Première apparition de dans ton historique.',
      metrics: { exerciseId: '504', exerciseName: null, name: 'Première apparition :' }
    };
    expect(isUnresolvedExerciseName(card)).toBe(true);
    expect(insightRejectReason(card)).toBe('incomplete_exercise_subject');
    expect(applyEditorialGate([card], { voiceKey: 'week' })).toHaveLength(0);
  });

  it('rejette retour sans nom d’exercice', () => {
    const card = {
      kind: 'disc_ms_return',
      title: 'après 28 jours d\'absence revient après un long silence',
      body: 'Il y a 4 jours, tu as enregistré ta première séance depuis 28 jours sur.',
      metrics: {
        exerciseId: '504',
        exerciseName: null,
        name: 'Tu reprends  après 28 jours d\'absence',
        gapDays: 28
      }
    };
    expect(isUnresolvedExerciseName(card)).toBe(true);
    expect(insightRejectReason(card)).toBe('incomplete_exercise_subject');
  });

  it('rejette « Elle mêle 60, 60, 60 » sans unités/exercices', () => {
    const card = {
      kind: 'disc_peak_day',
      title: 'La séance du 1 novembre 2026 concentre une part importante de ces 7 jours',
      body: 'Elle mêle 60, 60, 60.',
      metrics: {}
    };
    expect(insightRejectReason(card)).toBe('numbers_without_context');
  });

  it('ne publie pas un jalon de retour si le nom reste vide après résolution', () => {
    const catalog = [
      {
        date: '2026-10-02',
        totalReps: 46,
        minutes: 40,
        exercises: [{ id: '504', name: '', reps: 46 }]
      },
      {
        date: '2026-10-30',
        totalReps: 36,
        minutes: 35,
        exercises: [{ id: '504', name: '', reps: 36 }]
      }
    ];
    const ms = detectRecapMilestones({
      snapshot: {},
      window: { start: '2026-10-27', end: '2026-11-02' },
      catalog,
      getExerciseNameById: () => '',
      voiceKey: 'week'
    });
    // Sans getter, le stub programme doit quand même résoudre 504
    const ret = ms.find((m) => m.kind === 'disc_ms_return' && String(m.exerciseId) === '504');
    if (ret) {
      expect(ret.exerciseName || ret.metrics?.name).toMatch(/pompes/i);
      expect(ret.title).not.toMatch(/Tu reprends\s+après/i);
      expect(ret.body).not.toMatch(/jours sur\s*\./i);
    }
  });
});
