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

describe('rédaction analyses — point 23', () => {
  it('muscu : push/pull explique le volume avant le ratio', () => {
    const out = writeThreadCard({
      thread: 'pushPull',
      sense: 'fact',
      voice: '7d',
      windowLabel: 'Ces 7 jours',
      axes: ['pushPull', 'volume'],
      observed: { pushReps: 640, pullReps: 280, reps: 1200 }
    });
    expect(out).not.toBeNull();
    expect(out.title).toMatch(/poussée/i);
    expect(out.body).toMatch(/haut du corps/i);
    expect(out.body).toMatch(/640/);
    expect(out.body).toMatch(/280/);
    expect(out.body.indexOf('haut du corps')).toBeLessThan(out.body.indexOf('2,3'));
    expect(out.body).not.toMatch(/poussée identifiée/i);
    expect(out.body).toMatch(/ratio vient en second/i);
  });

  it('muscu : composition chiffre → signification, sans jargon de familles', () => {
    const out = writeThreadCard({
      thread: 'composition',
      sense: 'fact',
      voice: '7d',
      windowLabel: 'Ces 7 jours',
      axes: ['families', 'volume'],
      observed: {
        reps: 1370,
        families: [
          { label: 'épaules', reps: 248 },
          { label: 'triceps', reps: 237 }
        ]
      }
    });
    expect(out).not.toBeNull();
    expect(out.body).toMatch(/248/);
    expect(out.body).toMatch(/où va le volume de ces 7 jours/i);
    expect(out.body).not.toMatch(/familles identifiées|déséquilibre/i);
  });

  it('sommeil : assoc réécrite sans jargon technique', () => {
    const kept = applyEditorialGate(
      [
        card({
          kind: 'disc_sleep_assoc',
          title: 'Association sommeil × volume',
          body: 'Sur 6 séances dépassant 300 reps, 4 ont été précédées d\'au moins 7 h 30 de sommeil. 5 des 8 séances sous 250 reps ont suivi une nuit plus courte.',
          nature: 'trajectory'
        })
      ],
      { voiceKey: 'week' }
    );
    expect(kept).toHaveLength(1);
    expect(kept[0].title).toMatch(/journées lourdes suivent plus souvent une nuit longue/i);
    expect(kept[0].body).not.toMatch(/poussée identifiée/i);
  });

  it('course : refuse le jargon poussée identifiée sans traduction', () => {
    const kept = applyEditorialGate(
      [
        card({
          kind: 'disc_muscle_now',
          title: 'Épaules en tête',
          body: 'La poussée identifiée compte 640 reps contre 280 au dos, environ 2,3 pour 1.'
        })
      ],
      { voiceKey: 'week' }
    );
    expect(kept).toHaveLength(0);
  });

  it('course / volume : push-pull enrichi passe la porte', () => {
    const kept = applyEditorialGate(
      [
        card({
          kind: 'disc_th_pushPull_now',
          title: 'Le haut du corps travaille surtout en poussée',
          body: 'Ces 7 jours exposent surtout le haut du corps en poussée (pectoraux, épaules, triceps), pas en tirage. Tu cumules 640 répétitions de poussée contre 280 de tirage, soit environ 2,3 répétitions de poussée pour 1 de tirage. Le ratio vient en second : c’est la répartition du volume qui décrit la fenêtre.'
        }),
        card({
          kind: 'disc_push_pull',
          title: "L'exposition poussée de ces 7 jours reste nettement supérieure au tirage",
          body: "Ces 7 jours totalisent environ 280 reps de dos contre 500 reps pectoraux + triceps. Le haut du corps reçoit donc nettement plus de travail en poussée qu’en tirage. Ce n’est pas un jugement d’équilibre ideal : c’est le stimulus dominant réellement reçu."
        })
      ],
      { voiceKey: 'week' }
    );
    expect(kept.length).toBeGreaterThanOrEqual(1);
    expect(kept.every((c) => !/poussée identifiée/i.test(`${c.title} ${c.body}`))).toBe(true);
  });

  it('ne pas appauvrir une analyse sommeil déjà riche', () => {
    const rich = card({
      kind: 'disc_sleep_volume',
      nature: 'trajectory',
      title: 'La nuit précédente te place dans une zone de volume déjà visible dans ton historique',
      body: "Sur les séances observées, celles précédées d'au moins 7 h 30 de sommeil totalisent en moyenne 420 reps, contre 310 lorsque le sommeil passe sous 7 h 30. L'écart est de 110 reps, soit environ 35,5 %. Ce n'est pas une cause : c'est une séparation reproductible (12 et 9 séances)."
    });
    const kept = applyEditorialGate([rich], { voiceKey: 'week' });
    expect(kept).toHaveLength(1);
    expect(kept[0].body.length).toBeGreaterThan(160);
    expect(kept[0].body).toMatch(/420/);
    expect(kept[0].body).toMatch(/séparation reproductible/i);
  });
});
