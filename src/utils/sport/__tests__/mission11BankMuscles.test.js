/**
 * Mission 11 — banque d’exercices = autorité musculaire (pas les intitulés libres).
 */
import { describe, expect, it } from 'vitest';
import {
  buildProgramSessionGraph,
  extractSessionTemplates,
  NON_MUSCLE_ACTIVITY_KEYS,
  resolveExerciseMusclesFromBank,
  sessionMuscleProfile
} from '../sessionStructureGraph';
import { analysisEditionKey } from '../analysisEdition';
import { polishCardProse, auditCardProse } from '../editorialProseGuard';
import { findProgrammedVolumeVariants } from '../programVariantContext';
import { runGameBDiscoveryQuality } from '../evaluation/gameBDiscoveryQuality';

function programWithNames(nameA, nameB, exercisesA, exercisesB) {
  return {
    schedule: {
      monday: { active: true, name: nameA, exercises: exercisesA },
      friday: { active: true, name: nameB, exercises: exercisesB }
    }
  };
}

const pushPair = [
  { name: 'Pompes déclinées', series: '3×12', programCategory: 'street_workout' },
  { name: 'Pompes inclinées', series: '3×12', programCategory: 'street_workout' },
  { name: 'Course endurance', series: '20 min', programCategory: 'cardio', type: 'cardio' }
];

const pushPairVariant = [
  { name: 'Pompes déclinées', series: '5×10', programCategory: 'street_workout' },
  { name: 'Développé militaire', series: '3×10', programCategory: 'muscu' }
];

describe('Mission 11 — banque et structure', () => {
  it('édition ≥ v10', () => {
    expect(analysisEditionKey()).toMatch(/editorial=p6-sovereign-v(?:[1-9]\d*)/);
    expect(analysisEditionKey()).toMatch(/program=structural-context-v[234]/);
  });

  it('ne traite pas street_workout/muscu/cardio comme muscles', () => {
    const resolved = resolveExerciseMusclesFromBank({
      name: 'Pompes déclinées',
      programCategory: 'street_workout'
    });
    expect(resolved.activityCategory).toBe('street_workout');
    resolved.primary.forEach((g) => expect(NON_MUSCLE_ACTIVITY_KEYS.has(g)).toBe(false));
    const profile = sessionMuscleProfile(pushPair);
    profile.muscleKeys.forEach((g) => expect(NON_MUSCLE_ACTIVITY_KEYS.has(g)).toBe(false));
    expect(profile.modalities.cardio).toBeGreaterThanOrEqual(1);
  });

  it('deux programmes aux noms différents → même profil musculaire', () => {
    const a = programWithNames('Alpha SW', 'Bravo SW', pushPair, pushPairVariant);
    const b = programWithNames('Séance mystère 1', 'Séance mystère 2', pushPair, pushPairVariant);
    const ga = buildProgramSessionGraph(a);
    const gb = buildProgramSessionGraph(b);
    expect(ga.templates.map((t) => [...t.muscleKeys].sort().join(','))).toEqual(
      gb.templates.map((t) => [...t.muscleKeys].sort().join(','))
    );
    expect(ga.families.length).toBe(gb.families.length);
  });

  it('même nom de séance, exercices différents → différenciés', () => {
    const sameName = programWithNames(
      'Séance unique',
      'Séance unique',
      pushPair,
      [{ name: 'Tractions', series: '4×6', programCategory: 'street_workout' }]
    );
    const templates = extractSessionTemplates(sameName);
    expect(templates).toHaveLength(2);
    expect(templates[0].exerciseKeys.join('|')).not.toBe(templates[1].exerciseKeys.join('|'));
  });

  it('course exclue du socle de mouvements de renforcement', () => {
    const templates = extractSessionTemplates(
      programWithNames('A', 'B', pushPair, pushPairVariant)
    );
    const keys = templates[0].exerciseKeys.join(' ');
    expect(keys).not.toMatch(/course/);
    expect(templates[0].cardioKeys?.length).toBeGreaterThanOrEqual(1);
  });

  it('variantes prescrites détectées pour pompes déclinées', () => {
    const program = programWithNames('A', 'B', pushPair, pushPairVariant);
    const ctx = findProgrammedVolumeVariants(program, 'Pompes déclinées');
    expect(ctx.distinctPrescriptions).toBe(true);
    expect(ctx.implication).toMatch(/variantes prescrites|capacité/i);
  });

  it('jeu B : négation « sans conclure une causalité » n’est pas overclaim', () => {
    const report = runGameBDiscoveryQuality({
      insights: {
        longTerm: [
          {
            id: 'q',
            kind: 'disc_sleep_quarter',
            title: 'Les journées à fort volume suivent plus souvent de longues nuits',
            body: '10 des 10 journées à au moins 300 répétitions. Association observée : le volume élevé apparaît plus souvent après une nuit longue, sans qu’on puisse en conclure une causalité.'
          }
        ]
      }
    });
    expect(report.cases.some((c) => c.result === 'sleep_causality_overclaim')).toBe(false);
  });

  it('garde-fou éditorial corrige denses → fort volume et fuites techniques', () => {
    const polished = polishCardProse({
      title: 'Les journées les plus denses suivent',
      body: 'séparation reproductible et socle_commun_avec_variantes',
      evidence: 'net rise'
    });
    expect(polished.title).toMatch(/fort volume/i);
    expect(polished.body).not.toMatch(/socle_commun/);
    expect(polished.evidence).toMatch(/hausse nette/i);
    const audit = auditCardProse({
      title: 'x',
      body: 'Ces 7 jours pèse sur le total'
    });
    expect(audit.ok).toBe(false);
  });
});
