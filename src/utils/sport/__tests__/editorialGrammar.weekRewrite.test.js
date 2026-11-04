import { describe, it, expect } from 'vitest';
import { fixKnownGrammarInProse } from '../recapEditorialPolish';
import { possessiveMuscleShare } from '../recapPeriodVoice';

// weekWords n’est pas exporté — on reproduit le contrat via polish + patterns gate.
function applyWeekRewrite(text) {
  let s = String(text || '')
    .replace(/Cette semaine/g, 'Ces 7 jours')
    .replace(/cette semaine/g, 'ces 7 jours')
    .replace(/\bces 7 jours est\b/g, 'ces 7 jours sont')
    .replace(/\bCes 7 jours est\b/g, 'Ces 7 jours sont')
    .replace(/\bCes 7 jours concentre\b/g, 'Ces 7 jours concentrent')
    .replace(/\bces 7 jours concentre\b/g, 'ces 7 jours concentrent');
  s = s.replace(/\b(Ces|ces)\s+7\s+jours\s+(sont|étaient)\s+plus\s+dense\b/g, '$1 7 jours $2 plus denses');
  s = s.replace(/\b(Ces|ces)\s+7\s+jours\s+plus\s+dense\b/g, '$1 7 jours plus denses');
  return fixKnownGrammarInProse(s);
}

describe('grammaire période / muscles', () => {
  it('réécriture semaine → jours réaccorde dense', () => {
    const title = applyWeekRewrite('Cette semaine est plus dense que ton rythme habituel');
    const body = applyWeekRewrite(
      'Cette semaine concentre le travail. pour Les 30 jours d’avant le rythme était moindre.'
    );
    expect(title).toMatch(/Ces 7 jours sont plus denses/i);
    expect(title).not.toMatch(/plus dense que/);
    expect(body).toMatch(/ces 7 jours concentrent/i);
    expect(body).toMatch(/pour les/i);
  });

  it('fixKnownGrammarInProse corrige tronc', () => {
    const s = fixKnownGrammarInProse('soit 36,8 % de ta tronc sur la période');
    expect(s).toMatch(/de ton tronc/);
  });

  it('possessiveMuscleShare', () => {
    expect(possessiveMuscleShare('tronc')).toBe('de ton tronc');
    expect(possessiveMuscleShare('gainage/tronc')).toBe('de ton gainage/tronc');
  });
});
