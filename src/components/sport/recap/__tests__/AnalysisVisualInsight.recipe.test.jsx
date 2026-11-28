/**
 * Recette v38 — le composant React rend bien les 3 specs sans crash.
 * @vitest-environment jsdom
 */
import React from 'react';
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import AnalysisVisualInsight from '../AnalysisVisualInsight';
import { buildVisualInsightSpec } from '../../../../utils/sport/analysisVisualInsight';

describe('AnalysisVisualInsight — rendu React des 3 parcours', () => {
  it('volume freq/contenu', () => {
    const spec = buildVisualInsightSpec({
      kind: 'disc_composed_volume_decomp',
      metrics: {
        prevReps: 4891,
        curReps: 5730,
        freqEffect: 1427,
        contentEffect: -588,
        netDelta: 839,
        frequency: 1427,
        content: -588,
        observed: 839,
        ok: true
      }
    });
    const { container } = render(<AnalysisVisualInsight spec={spec} />);
    const fig = container.querySelector('[data-analyse-visual="true"]');
    expect(fig).toBeTruthy();
    expect(fig.textContent).toMatch(/Décomposition|fréquence|contenu|4891|5730/i);
  });

  it('concentration relative', () => {
    const spec = buildVisualInsightSpec({
      kind: 'disc_composed_relative_concentration',
      metrics: {
        moveShareOfParentWindow: 124 / 372,
        globalShareOfParentWindow: 347 / 5730,
        localReps: 124,
        localRepsInParent: 372,
        globalRepsShort: 347,
        globalRepsParent: 5730,
        moveNames: ['A', 'B', 'C']
      }
    });
    const { container } = render(<AnalysisVisualInsight spec={spec} />);
    expect(container.querySelector('[data-analyse-visual="true"]')).toBeTruthy();
    expect(container.textContent).toMatch(/dénominateur|Mouvements|Volume total/i);
  });

  it('trajectoire séances atypique', () => {
    const spec = buildVisualInsightSpec({
      kind: 'disc_exercise_progress',
      title: 'Hyperextension : une séance atypique, pas encore une tendance',
      metrics: {
        visualKind: 'trajectory_sessions',
        sessionTotals: [48, 48, 48, 48, 48, 48, 48, 24],
        sessionDates: [
          '2026-09-28',
          '2026-10-05',
          '2026-10-12',
          '2026-10-19',
          '2026-10-26',
          '2026-11-02',
          '2026-11-09',
          '2026-11-16'
        ]
      }
    });
    const { container } = render(<AnalysisVisualInsight spec={spec} />);
    expect(container.querySelector('[data-analyse-visual="true"]')).toBeTruthy();
    expect(container.textContent).toMatch(/atypique|séances/i);
  });

  it('spec null → rien rendu', () => {
    const { container } = render(<AnalysisVisualInsight spec={null} />);
    expect(container.querySelector('[data-analyse-visual]')).toBeNull();
  });
});
