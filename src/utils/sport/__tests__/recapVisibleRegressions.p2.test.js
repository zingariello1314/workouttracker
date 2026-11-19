import { describe, expect, it } from 'vitest';
import { frequencyContentClause } from '../recapHorizonEssays';
import { fixKnownGrammarInProse } from '../recapEditorialPolish';
import { describeCalendarShape } from '../recapCalendarShape';
import { readTrustedSessionSets } from '../exerciseTrajectoryAnalysis';
import { possessiveMuscleShare } from '../recapPeriodVoice';

describe('régressions visibles P2', () => {
  it('ne dit pas que la fréquence baisse quand elle passe de 3 à 3,8', () => {
    const text = frequencyContentClause({
      emitPrev: 3,
      emitRate: 3.8,
      currentAvg: 6,
      habitAvg: 8
    });
    expect(text).toMatch(/3 à 3\.8|3 à 3,8/);
    expect(text).toMatch(/ne baisse pas/);
    expect(text).not.toMatch(/baissent ensemble/);
  });

  it('retire les codes internes et accorde le tronc', () => {
    const text = fixKnownGrammarInProse(
      '25,2 % de la tronc. NET RISE. ARC 8. CONTRAT POSITIVE_REPS. contrat positive_reps.'
    );
    expect(text).toMatch(/du tronc/);
    expect(text).not.toMatch(/NET RISE|ARC 8|POSITIVE_REPS|contrat positive_reps/);
    expect(possessiveMuscleShare('tronc')).toBe('de ton tronc');
  });

  it('ne compte pas la journée en cours, encore vide, comme un jour sans entraînement terminé', () => {
    const card = describeCalendarShape({
      start: '2026-11-13',
      end: '2026-11-19',
      openEnd: true,
      repsByDate: {
        '2026-11-13': 40,
        '2026-11-14': 0,
        '2026-11-15': 0,
        '2026-11-16': 40,
        '2026-11-17': 40,
        '2026-11-18': 40,
        '2026-11-19': 0
      }
    });
    expect(card).toBeTruthy();
    expect(card.body).not.toMatch(/19 novembre/);
    expect(card?.evidence || '').not.toMatch(/positive_reps/);
  });

  it('ne traite pas une série reconstruite comme un format enregistré', () => {
    const snapshot = {
      reps: { '2026-11-18_knee': '36' },
      exerciseSetLogs: {
        '2026-11-18_knee': {
          sets: [{ reps: 18 }, { reps: 18 }],
          inference: { method: 'equal', confidence: 0.4 }
        }
      }
    };
    const sets = readTrustedSessionSets(snapshot, '2026-11-18', 'knee', 36);
    expect(sets.trusted).toBe(false);
    expect(sets.source).toBe('reconstructed_equal');
    expect(sets.schemeLabel).toBeNull();
  });
});
