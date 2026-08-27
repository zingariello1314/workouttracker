import { describe, expect, it } from 'vitest';
import { applyMoves, invertAlgorithm, isSolvedFacelets, parseAlgorithm } from '../model';
import { METHOD_DEMOS } from '../methodDemos';
import { formatMove } from '../notation';
import { DEFAULT_SCHEME } from '../colorScheme';

describe('invertAlgorithm', () => {
  it('R U R\' s\'annule', () => {
    const alg = "R U R'";
    const back = invertAlgorithm(alg);
    expect(applyMoves(applyMoves('UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB', alg), back).slice(0, 9)).toBe(
      'UUUUUUUUU'
    );
    expect(isSolvedFacelets(applyMoves(applyMoves('UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB', alg), back))).toBe(
      true
    );
  });
});

describe('METHOD_DEMOS', () => {
  it.each(Object.keys(METHOD_DEMOS))('%s : exemple + formules = cube résolu', (id) => {
    const demo = METHOD_DEMOS[id];
    const end = applyMoves(demo.exampleStart, demo.stages.map((s) => s.moves).join(' '));
    expect(isSolvedFacelets(end)).toBe(true);
    expect(demo.allMoves.length).toBe(parseAlgorithm(demo.stages.map((s) => s.moves).join(' ')).length);
  });
});

describe('formatMove', () => {
  it('WCA reste brut', () => {
    expect(formatMove("R'", { mode: 'wca' })).toBe("R'");
  });

  it('mode both encadre la notation avec des guillemets français', () => {
    const s = formatMove("R'", { scheme: DEFAULT_SCHEME, mode: 'both', lang: 'fr', compact: true });
    expect(s).toContain('« R\' »');
    expect(s.toLowerCase()).toContain('droite');
    expect(s.toLowerCase()).toContain('rouge');
  });

  it('U pointe la face du haut, pas une case d’échecs', () => {
    const s = formatMove('U', { scheme: DEFAULT_SCHEME, mode: 'plain', lang: 'fr', compact: true });
    expect(s).toContain('haut');
    expect(s.toLowerCase()).toContain('blanc');
  });
});
