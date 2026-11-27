import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SessionFeedback from '../SessionFeedback.jsx';
import { ANSWER_STATES } from '../../utils/sessionFeedbackCatalog.js';

vi.mock('../../utils/translations', () => ({
  useTranslation: () => (key, fallback) => fallback || key
}));

describe('SessionFeedback UI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('enregistre depuis le rapide avec une seule réponse', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(
      <SessionFeedback
        isOpen
        onClose={onClose}
        onSave={onSave}
        sessionData={{
          date: '2026-11-23',
          exercises: [{ id: 'ex1', name: 'Squat', reps: 20 }],
          totalReps: 20,
          duration: 35
        }}
      />
    );

    expect(screen.getByText('Feedback rapide')).toBeTruthy();
    expect(screen.getByText(/Séance du 23 novembre/i)).toBeTruthy();
    expect(screen.getByText(/1 exercice · 20 répétitions/i)).toBeTruthy();
    // Durée estimée inventée : non affichée
    expect(screen.queryByText('35 min')).toBeNull();

    // Premier groupe d’échelle = expérience (1–10)
    const sevens = screen.getAllByRole('button', { name: '7' });
    fireEvent.click(sevens[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    const payload = onSave.mock.calls[0][0];
    expect(payload.useCatalogCommit).toBe(true);
    expect(payload.catalogDraft.experience).toEqual({
      state: ANSWER_STATES.ANSWERED,
      value: 7
    });
    expect(payload.catalogDraft.effort).toBeUndefined();
  });

  it('ouvre le détaillé et n’affiche pas la douleur hors contexte', () => {
    render(
      <SessionFeedback
        isOpen
        onClose={vi.fn()}
        onSave={vi.fn()}
        sessionData={{ date: '2026-11-23', exercises: [] }}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter des détails' }));
    expect(screen.getByText('État initial et récupération')).toBeTruthy();
    expect(screen.queryByText('déclarée')).toBeNull();
  });

  it('affiche la question partielle dans le parcours principal', () => {
    render(
      <SessionFeedback
        isOpen
        onClose={vi.fn()}
        onSave={vi.fn()}
        sessionData={{
          date: '2026-11-23',
          sessionTitle: 'Haut du corps',
          totalReps: 76,
          totalExercises: 2,
          sportContext: {
            dateStr: '2026-11-23',
            sessionTitle: 'Haut du corps',
            isPartialVsPlan: true,
            planKnown: true,
            plannedExerciseCount: 5,
            recordedExerciseCount: 2,
            missingPlannedIds: ['c', 'd', 'e'],
            reliability: { plan: 'known', volume: 'measured', duration: 'unknown' }
          }
        }}
      />
    );
    expect(
      screen.getByText(/Tu n’as pas encore enregistré tous les exercices prévus/i)
    ).toBeTruthy();
    expect(screen.getByText(/programme enregistré/i)).toBeTruthy();
  });

  it('affiche le bloc douleur quand Oui est choisi', () => {
    render(
      <SessionFeedback
        isOpen
        onClose={vi.fn()}
        onSave={vi.fn()}
        sessionData={{ date: '2026-11-23', exercises: [{ id: 'a', name: 'Press' }] }}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Oui' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter des détails' }));
    expect(screen.getByText('déclarée')).toBeTruthy();
  });

  it('recharge les réponses existantes', () => {
    render(
      <SessionFeedback
        isOpen
        onClose={vi.fn()}
        onSave={vi.fn()}
        sessionData={{
          date: '2026-11-23',
          existingFeedback: {
            ressenti: 9,
            answers: {
              experience: { state: 'answered', value: 9 },
              effort: { state: 'answered', value: 0 }
            }
          }
        }}
      />
    );
    expect(screen.getByText(/2\/4 rapides/)).toBeTruthy();
    expect(screen.getByRole('button', { name: '9', pressed: true })).toBeTruthy();
    expect(screen.getByRole('button', { name: '0', pressed: true })).toBeTruthy();
  });

  it('affiche un état adapté sans séance associée', () => {
    render(
      <SessionFeedback isOpen onClose={vi.fn()} onSave={vi.fn()} sessionData={null} />
    );
    expect(
      screen.getByText(/Aucune séance associée/i)
    ).toBeTruthy();
  });
});
