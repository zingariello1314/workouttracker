import { describe, expect, it } from 'vitest';
import { stickerIndexOnFace } from '../cubies';
import {
  cubieFromSticker,
  layersForCubie,
  stickerAfterMove,
  translatingMoves
} from '../stickerMotion';

describe('cubieFromSticker', () => {
  it('est l’inverse de stickerIndexOnFace', () => {
    const c = { x: 1, y: 1, z: 1 };
    ['U', 'F', 'R'].forEach((face) => {
      const index = stickerIndexOnFace(face, c.x, c.y, c.z);
      expect(cubieFromSticker(face, index)).toEqual(c);
    });
  });
});

describe('stickerAfterMove', () => {
  it('R envoie la pastille F du cubie UFR vers D', () => {
    const dest = stickerAfterMove('F', stickerIndexOnFace('F', 1, 1, 1), 'R');
    expect(dest.face).toBe('D');
    expect(dest.x).toBe(1);
    expect(dest.y).toBe(-1);
    expect(dest.z).toBe(1);
  });

  it('U ne déplace pas le centre U (spin sur place)', () => {
    const dest = stickerAfterMove('U', 4, 'U');
    expect(dest.moved).toBe(false);
    expect(dest.face).toBe('U');
    expect(dest.index).toBe(4);
  });

  it('une arête a 2 couches, un coin 3', () => {
    expect(layersForCubie(1, 0, 1).sort()).toEqual(['F', 'R']);
    expect(layersForCubie(1, 1, 1).sort()).toEqual(['F', 'R', 'U']);
  });

  it('les coups qui déplacent une arête FR sont 4 quarts de tour', () => {
    const index = stickerIndexOnFace('F', 1, 0, 1);
    const trans = translatingMoves('F', index);
    expect(trans).toHaveLength(4);
    expect(trans.map((t) => t.move).sort()).toEqual(['F', "F'", 'R', "R'"]);
  });
});
