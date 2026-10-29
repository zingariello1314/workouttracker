import { describe, expect, it } from 'vitest';
import { phraseTuViensDe, voicePastEvent } from '../recapEventVoice';

describe('recapEventVoice', () => {
  const ref = '2026-10-29';

  it('garde le présent parfait le jour même', () => {
    expect(voicePastEvent('2026-10-29', ref).presentPerfect).toBe(true);
    expect(
      phraseTuViensDe({
        eventYmd: '2026-10-29',
        refYmd: ref,
        perfectCore: "d'enregistrer ta première séance depuis 77 jours sur X.",
        simpleCore: 'enregistré ta première séance depuis 77 jours sur X.'
      })
    ).toBe("Tu viens d'enregistrer ta première séance depuis 77 jours sur X.");
  });

  it('utilise hier pour J-1', () => {
    const out = phraseTuViensDe({
      eventYmd: '2026-10-28',
      refYmd: ref,
      perfectCore: "d'enregistrer ta première séance depuis 77 jours sur X.",
      simpleCore: 'enregistré ta première séance depuis 77 jours sur X.'
    });
    expect(out.startsWith('Hier, tu as enregistré')).toBe(true);
    expect(out.includes("Tu viens")).toBe(false);
  });

  it('utilise il y a N jours pour une reprise récente', () => {
    const out = phraseTuViensDe({
      eventYmd: '2026-10-24',
      refYmd: ref,
      perfectCore: "d'enregistrer ta première séance depuis 77 jours sur X.",
      simpleCore: 'enregistré ta première séance depuis 77 jours sur X.'
    });
    expect(out.startsWith('Il y a 5 jours, tu as enregistré')).toBe(true);
  });

  it('ancre une date longue hors de la semaine', () => {
    const out = phraseTuViensDe({
      eventYmd: '2026-10-12',
      refYmd: ref,
      perfectCore: "d'enregistrer ta première séance depuis 77 jours sur X.",
      simpleCore: 'enregistré ta première séance depuis 77 jours sur X.'
    });
    expect(out.includes('Tu viens')).toBe(false);
    expect(out.startsWith('Le ')).toBe(true);
    expect(out.includes('tu as enregistré')).toBe(true);
  });
});
