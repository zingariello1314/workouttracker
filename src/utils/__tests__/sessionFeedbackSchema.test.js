import { describe, expect, it } from 'vitest';
import { extractDayFeedback } from '../sport/recapP35DayModel.js';
import { isSessionFeedbackFilled } from '../sessionFeedbackUtils.js';
import {
  commitSessionFeedback,
  formStateFromStored,
  mergeSessionFeedbackMaps,
  readSessionFeedback,
  reconcileSessionFeedbackEntry
} from '../sessionFeedbackSchema.js';

const NOW = '2026-11-21T18:00:00.000Z';
const LATER = '2026-11-21T19:30:00.000Z';

describe('sessionFeedbackSchema', () => {
  it('lit un feedback ancien sans inventer une absence de douleur', () => {
    const view = readSessionFeedback({
      ressenti: 7,
      difficulte: 0,
      douleur: 0,
      objectifAtteint: null,
      partenaire: false,
      notes: ''
    });
    expect(view.legacy).toBe(true);
    expect(view.schemaVersion).toBeNull();
    expect(view.answers.ressenti).toEqual({ state: 'answered', value: 7 });
    expect(view.answers.douleur.state).toBe('not_answered');
    expect(view.answers.douleur.presence).toBeUndefined();
    expect(view.answers.pain).toBeUndefined();
    expect(view.answers.objectif.state).toBe('not_answered');
    expect(view.answers.partenaire.state).toBe('not_answered');
    expect(view.retrospective).toBeNull();
  });

  it('conserve une absence de douleur déjà écrite explicitement', () => {
    const stored = commitSessionFeedback(
      {
        douleur: 0,
        answers: { pain: { presence: 'no', state: 'absent' }, douleur: { state: 'absent', presence: 'no', value: null } },
        createdAt: '2026-11-20T10:00:00.000Z',
        answeredAt: '2026-11-20T10:00:00.000Z'
      },
      { date: '2026-11-21', ressenti: 6, douleur: 0 },
      { now: NOW }
    );
    expect(stored.answers.douleur.state).toBe('absent');
    expect(stored.answers.pain.presence).toBe('no');
    expect(stored.answers.ressenti).toEqual({ state: 'answered', value: 6 });
    expect(stored.douleur).toBe(0);
  });

  it('réécrit sans perdre les clés inconnues ni la date de création', () => {
    const stored = commitSessionFeedback(
      {
        ressenti: 8,
        musiquesEcoutees: 'rock',
        futurChamp: { keep: true },
        createdAt: '2026-11-01T08:00:00.000Z',
        answeredAt: '2026-11-01T08:00:00.000Z',
        timestamp: '2026-11-01T08:00:00.000Z'
      },
      { date: '2026-11-21', ressenti: 4, notes: 'mieux cadré', douleur: 0 },
      { now: LATER }
    );
    expect(stored.schemaVersion).toBe(2);
    expect(stored.ressenti).toBe(4);
    expect(stored.notes).toBe('mieux cadré');
    expect(stored.musiquesEcoutees).toBe('rock');
    expect(stored.futurChamp).toEqual({ keep: true });
    expect(stored.createdAt).toBe('2026-11-01T08:00:00.000Z');
    expect(stored.answeredAt).toBe('2026-11-01T08:00:00.000Z');
    expect(stored.updatedAt).toBe(LATER);
    expect(stored.retrospective).toBe(true);
    expect(stored.answers.douleur.state).toBe('not_answered');
  });

  it('ne convertit pas un objectif structuré en « non répondu » quand le formulaire envoie null', () => {
    const stored = commitSessionFeedback(
      {
        objectifAtteint: null,
        answers: { objectif: { state: 'partial', value: null } }
      },
      { date: '2026-11-21', objectifAtteint: null, ressenti: 5 },
      { now: NOW }
    );
    expect(stored.answers.objectif.state).toBe('partial');
    expect(stored.objectifAtteint).toBeNull();
  });

  it('recharge le formulaire avec les réponses déjà là', () => {
    const form = formStateFromStored({
      ressenti: 9,
      difficulte: 6,
      notes: 'jambes',
      tags: ['Fatigue'],
      partenaire: false,
      douleur: 0
    });
    expect(form.ressenti).toBe(9);
    expect(form.difficulte).toBe(6);
    expect(form.notes).toBe('jambes');
    expect(form.tags).toEqual(['Fatigue']);
    expect(form.douleur).toBe(0);
    expect(form.partenaire).toBe(false);
  });

  it('laisse Récap lire les mêmes champs après un enregistrement v2', () => {
    const stored = commitSessionFeedback(
      null,
      { date: '2026-11-21', ressenti: 8, difficulte: 7, motivation: 6, notes: 'solide', douleur: 0 },
      { now: NOW }
    );
    const day = extractDayFeedback({ sessionFeedbacks: { '2026-11-21': stored } }, '2026-11-21');
    expect(day.filled).toBe(true);
    expect(day.difficulte).toBe(7);
    expect(day.ressenti).toBe(8);
    expect(day.motivation).toBe(6);
    expect(day.douleur).toBeNull();
    expect(day.notes).toBe('solide');
    expect(isSessionFeedbackFilled(stored)).toBe(true);
    expect(isSessionFeedbackFilled({ douleur: 0, partenaire: false })).toBe(false);
  });

  it('une copie distante sans horloge ne remplace pas le feedback local', () => {
    const local = { ressenti: 8, notes: 'ici', updatedAt: NOW, custom: 1 };
    const remote = { ressenti: 2, extra: 'serveur' };
    const picked = reconcileSessionFeedbackEntry(local, remote);
    expect(picked.ressenti).toBe(8);
    expect(picked.notes).toBe('ici');
    expect(picked.custom).toBe(1);
    expect(picked.extra).toBe('serveur');
  });

  it('fusionne les dates sans effacer un jour présent seulement en local', () => {
    const merged = mergeSessionFeedbackMaps(
      {
        '2026-11-20': { ressenti: 5, updatedAt: '2026-11-20T12:00:00.000Z' },
        '2026-11-21': { ressenti: 9, updatedAt: LATER, localOnly: true }
      },
      {
        '2026-11-21': { ressenti: 3, updatedAt: NOW }
      }
    );
    expect(merged['2026-11-20'].ressenti).toBe(5);
    expect(merged['2026-11-21'].ressenti).toBe(9);
    expect(merged['2026-11-21'].localOnly).toBe(true);
  });
});
