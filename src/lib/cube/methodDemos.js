import {
  SOLVED_FACELETS,
  applyMoves,
  invertAlgorithm,
  parseAlgorithm
} from './model';

function pack(id, stages) {
  const all = stages.map((s) => s.moves).join(' ').trim();
  const scramble = invertAlgorithm(all);
  const start = applyMoves(SOLVED_FACELETS, scramble);
  return {
    id,
    stages,
    allMoves: parseAlgorithm(all),
    scramble,
    exampleStart: start
  };
}

export const METHOD_DEMOS = {
  lbl: pack('lbl', [
    { id: 'cross', title: 'Croix du haut', moves: 'F D R' },
    { id: 'corners', title: 'Première couronne (insertion)', moves: "R U R' U'" },
    { id: 'second', title: 'Deuxième couronne', moves: "U R U' R' U' F' U F" },
    { id: 'll-cross', title: 'Croix de dernière couche', moves: "F R U R' U' F'" },
    { id: 'oll', title: 'Orientation (Sune)', moves: "R U R' U R U2 R'" },
    { id: 'pll', title: 'Permutation (U-perm)', moves: "R U' R U R U R U' R' U' R2" }
  ]),
  cfop: pack('cfop', [
    { id: 'cross', title: 'Cross', moves: "F D R' D'" },
    { id: 'f2l', title: 'F2L (paire)', moves: "R U R' U' R U R'" },
    { id: 'oll', title: 'OLL', moves: "F R U R' U' F'" },
    { id: 'pll', title: 'PLL (T-perm)', moves: "R U R' U' R' F R2 U' R' U' R U R' F'" }
  ]),
  roux: pack('roux', [
    { id: 'fb', title: 'Premier bloc', moves: "R U R' F'" },
    { id: 'sb', title: 'Second bloc', moves: "L' U' L U" },
    { id: 'cmll', title: 'CMLL (exemple Sune)', moves: "R U R' U R U2 R'" },
    { id: 'lse', title: 'LSE (sans tranche M)', moves: "U R U' L' U L" }
  ]),
  zz: pack('zz', [
    { id: 'eo', title: 'EOLine (idée)', moves: "F R U R' U' F'" },
    { id: 'left', title: 'Bloc gauche', moves: "L' U' L U" },
    { id: 'right', title: 'Bloc droit', moves: "R U R' U'" },
    { id: 'll', title: 'Dernière couche', moves: "R U2 R' U' R U' R'" }
  ]),
  petrus: pack('petrus', [
    { id: '222', title: 'Bloc 2×2×2', moves: "R U R'" },
    { id: '223', title: 'Extension 2×2×3', moves: "U F' U F" },
    { id: 'eo', title: 'Orientation des arêtes', moves: "F R U R' U' F'" },
    { id: 'finish', title: 'Fin de couches', moves: "R U R' U R U2 R'" }
  ])
};

export function demoMovesFlat(demo) {
  return demo.allMoves;
}

export function stageRange(demo, stageIndex) {
  let start = 0;
  for (let i = 0; i < stageIndex; i += 1) {
    start += parseAlgorithm(demo.stages[i].moves).length;
  }
  const len = parseAlgorithm(demo.stages[stageIndex].moves).length;
  return { start, end: start + len };
}
