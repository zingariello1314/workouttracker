import { describe, expect, it } from 'vitest';
import { SOLVED_FACELETS } from '../model';
import { cubieStickerColors, dragToMove, stickerIndexOnFace, stickersForCubie } from '../cubies';

describe('cubies mapping', () => {
  it('le cubie UFR a U, F et R', () => {
    const faces = stickersForCubie(1, 1, 1).map((s) => s.face).sort();
    expect(faces).toEqual(['F', 'R', 'U']);
  });

  it('UFR résolu : blanc / vert / rouge (lettres U F R)', () => {
    const cols = cubieStickerColors(SOLVED_FACELETS, 1, 1, 1);
    expect(cols.find((c) => c.face === 'U').color).toBe('U');
    expect(cols.find((c) => c.face === 'F').color).toBe('F');
    expect(cols.find((c) => c.face === 'R').color).toBe('R');
  });

  it('index U coin UFR = 8 (row avant, col droite)', () => {
    expect(stickerIndexOnFace('U', 1, 1, 1)).toBe(8);
  });
});

describe('dragToMove', () => {
  it('pastille F, drag vers +X sur la rangée du haut → U\'', () => {
    expect(dragToMove('F', { x: 0, y: 1, z: 1 }, [1, 0, 0])).toBe("U'");
  });

  it('pastille F, drag vers +Y sur cubie droit → tour R', () => {
    expect(dragToMove('F', { x: 1, y: 0, z: 1 }, [0, 1, 0])).toBe('R');
  });
});
