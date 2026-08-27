import { describe, expect, it } from 'vitest';
import { SOLVED_FACELETS, applyMoves, scrambleFacelets, setSticker, standardizeFacelets } from '../model';
import { validateCubeState } from '../validate';
import { detectLblProgress } from '../lbl-progress';

describe('cube model', () => {
  it('un cube résolu reste résolu', () => {
    expect(applyMoves(SOLVED_FACELETS, '')).toBe(SOLVED_FACELETS);
  });

  it('R R\' ramène à l’état initial', () => {
    const after = applyMoves(SOLVED_FACELETS, "R R'");
    expect(after).toBe(SOLVED_FACELETS);
  });

  it('scramble produit 54 facelets', () => {
    expect(scrambleFacelets()).toHaveLength(54);
  });

  it('permet de peindre un centre', () => {
    const next = setSticker(SOLVED_FACELETS, 'F', 4, 'U');
    expect(next[18 + 4]).toBe('U');
  });

  it('standardise un cube dont les centres U/D sont inversés', () => {
    let swapped = SOLVED_FACELETS;
    swapped = setSticker(swapped, 'U', 4, 'D');
    swapped = setSticker(swapped, 'D', 4, 'U');
    const std = standardizeFacelets(swapped);
    expect(std.ok).toBe(true);
    expect(std.facelets[4]).toBe('U');
    expect(std.facelets[31]).toBe('D');
    const after = applyMoves(swapped, "U U'");
    expect(after[4]).toBe('D');
    expect(after[31]).toBe('U');
  });
});

describe('validateCubeState', () => {
  it('accepte le cube résolu', () => {
    expect(validateCubeState(SOLVED_FACELETS).ok).toBe(true);
  });

  it('détecte un mauvais comptage de couleurs', () => {
    const bad = setSticker(SOLVED_FACELETS, 'F', 0, 'U');
    expect(validateCubeState(bad).ok).toBe(false);
  });
});

describe('LBL progress', () => {
  it('toutes les étapes sont faites sur un cube résolu', () => {
    const p = detectLblProgress(SOLVED_FACELETS);
    expect(p.flags.pll).toBe(true);
    expect(p.flags['white-cross']).toBe(true);
  });

  it('une face U cassée casse la croix du haut', () => {
    const mixed = applyMoves(SOLVED_FACELETS, 'F');
    const p = detectLblProgress(mixed);
    expect(p.flags['white-cross']).toBe(false);
  });
});
