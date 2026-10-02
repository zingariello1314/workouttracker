import { describe, expect, it } from 'vitest';
import { applyEditorialGate } from '../recapEditorialGate';
import { writeThreadCard } from '../recapAnalysisDepth';

function card(partial) {
  return {
    nature: 'now',
    evidence: '',
    metrics: {},
    ...partial
  };
}

describe('porte éditoriale', () => {
  it('refuse le total nu, la liste, la nuit, la série sans avant, et un écart proche', () => {
    const kept = applyEditorialGate([
      card({ kind: 'disc_volume_shape', title: 'Le total', body: 'Ces 7 jours comptent 1 370 répétitions sur 5 séances.', metrics: {} }),
      card({ kind: 'disc_th_composition_now', title: 'Familles', body: 'Les familles identifiées portent 248 épaules, 237 triceps.' }),
      card({ kind: 'disc_sleep_rhythm_obs', title: 'Observation', body: 'Observation : coucher à 7 h 00, lever à 15 h 27. Une seule nuit ne suffit pas à décrire un rythme.' }),
      card({ kind: 'disc_th_series_journey', title: 'Série', body: 'Meilleure série observée de Mollets debout : 20 répétitions. Le volume de la séance est 100, ce n\'est pas la série.' }),
      card({ kind: 'disc_density', title: 'Dense', body: 'Écart de 6,8 %.', metrics: { vs30: -6.8 } }),
      card({ kind: 'disc_th_continuity_journey', title: 'Pic', body: 'ces 7 jours (1 370 répétitions) face à les 30 jours (3 991 répétitions) : pic relativisé.' })
    ], { voiceKey: 'week' });
    expect(kept).toHaveLength(0);
  });

  it('garde la concentration, la reprise, la progression, le sommeil, et refuse le doublon de sommeil', () => {
    const kept = applyEditorialGate([
      card({
        kind: 'disc_peak_day',
        title: 'La séance du 30/09/2026 concentre une part importante de ces 7 jours',
        body: 'La séance du 30/09/2026 concentre 524 répétitions, soit 38,2 % des 1 370.',
        metrics: { factId: 'peak|30/09/2026|7d' }
      }),
      card({
        kind: 'disc_th_concentration_now',
        title: 'Le 30/09/2026 porte une grande part de ces 7 jours',
        body: 'Le 30/09/2026 concentre 524 répétitions, soit 38,2 % des 1 370 répétitions de ces 7 jours.',
        metrics: { factId: 'peak|30/09/2026|7d' }
      }),
      card({
        kind: 'disc_ms_return',
        title: 'Tu reprends Élévations latérales après 34 jours d\'absence',
        body: 'Avec 60 répétitions, tu reviens à 139,0 % de ton volume moyen avant l\'interruption. Une séance ne réinstalle pas le mouvement.',
        nature: 'now'
      }),
      card({
        kind: 'disc_ms_event_combo',
        title: 'Reprise et niveau habituel le même jour',
        body: 'Tu retrouves immédiatement 139 % de ton volume habituel.',
        nature: 'trajectory'
      }),
      card({
        kind: 'disc_exercise_progress',
        title: 'Pompes inclinées a progressé de 31,7 % depuis tes premières séances comparables',
        body: 'Niveau initial : environ 24 reps. Niveau actuel : environ 31,6 reps.',
        metrics: { name: 'Pompes inclinées', vsInitialPct: 31.7 },
        nature: 'journey'
      }),
      card({
        kind: 'disc_sleep_assoc',
        title: 'Autour de 7 h 30, les journées fortes et les journées courtes ne se répartissent pas pareil',
        body: 'Sur 6 séances dépassant 300 reps, 4 ont été précédées d\'au moins 7 h 30 de sommeil. 5 des 8 séances sous 250 reps ont suivi une nuit plus courte.',
        nature: 'trajectory'
      }),
      card({
        kind: 'disc_sleep_quarter',
        title: 'Les journées les plus denses suivent plus souvent de longues nuits',
        body: '4 des 6 journées à au moins 300 reps ont été précédées d\'une nuit d\'au moins 7 h 30.',
        nature: 'journey'
      }),
      card({
        kind: 'disc_muscle_reorient',
        title: 'Le stimulus de la semaine se déplace vers les mollets',
        body: 'Les mollets représentent ces 7 jours 101 reps, contre 101 sur les 30 derniers jours.',
        nature: 'trajectory'
      })
    ], { voiceKey: 'week' });

    const titles = kept.map((c) => c.title).join('\n');
    expect(kept.filter((c) => /30\/09\/2026/.test(c.body))).toHaveLength(1);
    expect(titles).toMatch(/Élévations latérales revient/);
    expect(titles).not.toMatch(/Reprise et niveau/);
    expect(titles).toMatch(/Pompes inclinées a un niveau plus haut/);
    expect(titles).toMatch(/journées lourdes suivent plus souvent/);
    expect(titles).not.toMatch(/journées les plus denses/);
    expect(titles).not.toMatch(/stimulus de la semaine se déplace|stimulus de ces 7 jours se déplace/);
    expect(kept.find((c) => c.kind === 'disc_muscle_reorient').nature).toBe('journey');
    expect(kept.find((c) => c.kind === 'disc_exercise_progress').nature).toBe('journey');
  });

  it('ne s\'arrête pas après deux cartes acceptées', () => {
    const kept = applyEditorialGate([
      card({ kind: 'disc_ms_return', title: 'Tu reprends A après 34 jours', body: 'Avec 60 répétitions, retour à 139 % du volume d\'avant sur plusieurs séances comparables.' }),
      card({ kind: 'disc_exercise_progress', title: 'B a progressé de 20 %', body: 'Niveau initial environ 24 reps. Niveau actuel environ 31 reps sur les séances récentes.', metrics: { name: 'B' } }),
      card({ kind: 'disc_structural_memory', title: 'C entre dans ta poussée', body: 'C pèsent 160 reps sur 3 séances, absentes sur les 30 jours d\'avant. la fréquence des prochaines semaines dira si le mouvement s\'installe.', metrics: { name: 'C' } })
    ]);
    expect(kept).toHaveLength(3);
    expect(kept[2].nature).toBe('journey');
    expect(kept[2].body).not.toMatch(/prochaines semaines dira/);
  });
});

describe('rédacteur, une idée', () => {
  it('le pic du jour est une carte, pas le dossier', () => {
    const card = writeThreadCard({
      thread: 'concentration',
      sense: 'fact',
      voice: '7d',
      windowLabel: 'Ces 7 jours',
      axes: ['volume', 'families', 'pushPull', 'series'],
      observed: {
        reps: 1370,
        sessions: 5,
        strengthDays: 4,
        repsPerSession: 342.5,
        families: [{ label: 'épaules', reps: 248 }],
        pushReps: 643,
        pullReps: 343,
        peak: { dateLabel: '30/09/2026', reps: 524, share: 38.2, exerciseNames: ['100 Pompes'] }
      }
    });
    expect(card.title).toMatch(/porte une grande part/);
    expect(card.title.length).toBeLessThan(90);
    expect(card.body).toMatch(/524/);
    expect(card.body).toMatch(/38,2 %/);
    expect(card.body).not.toMatch(/familles|643|343|ce n'est pas la série/i);
  });
});
