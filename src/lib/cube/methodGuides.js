import lblArticle from './methodArticles/lbl.md?raw';
import cfopArticle from './methodArticles/cfop.md?raw';
import rouxArticle from './methodArticles/roux.md?raw';
import zzArticle from './methodArticles/zz.md?raw';
import petrusArticle from './methodArticles/petrus.md?raw';

export const METHOD_GUIDES = {
  lbl: {
    id: 'lbl',
    name: 'Méthode des couches (débutant)',
    aka: 'Layer by Layer, « Beginner’s Method »',
    summary:
      'On construit le cube de bas en haut : première couche, deuxième couronne, puis dernière couche. Plus de mouvements que CFOP, beaucoup moins de formules.',
    article: lblArticle,
    demoNote:
      'La démo enchaîne des formules typiques. L’état de départ est l’inverse de cet enchaînement : le cube redevient résolu à la fin. Ce n’est pas « un mélange WCA + une vraie résolution débutant filmée », c’est un parcours pédagogique des gestes.'
  },
  cfop: {
    id: 'cfop',
    name: 'CFOP (Fridrich)',
    aka: 'Cross, F2L, OLL, PLL',
    summary:
      'Croix, puis paires coin+arête (F2L), puis orientation et permutation de la dernière couche. La méthode dominante en speedcubing 3×3.',
    article: cfopArticle,
    demoNote:
      'Démo : Cross → une paire F2L → un OLL court → T-perm. L’état initial est l’inverse, pour finir résolu.'
  },
  roux: {
    id: 'roux',
    name: 'Roux',
    aka: 'Blocs + CMLL + LSE',
    summary:
      'Deux blocs 1×2×3, coins de dernière couche (CMLL), puis six arêtes via la tranche M (LSE). Pas de croix.',
    article: rouxArticle,
    demoNote:
      'Blocs + Sune (à la place d’un vrai CMLL) + finition sans M. Pour voir un vrai LSE, il faudrait les coups de tranche, absents de cette démo 3D.'
  },
  zz: {
    id: 'zz',
    name: 'ZZ',
    aka: 'EOLine + blocs <R, U, L>',
    summary:
      'Orienter toutes les arêtes dès le départ (EOLine), puis résoudre surtout avec R, U et L. Début plus dur, suite plus fluide.',
    article: zzArticle,
    demoNote:
      'L’étape « EOLine » est un enchaînement qui oriente des arêtes (formule type OLL), pas une EOLine de compétition filmée. Inverse = cube de départ.'
  },
  petrus: {
    id: 'petrus',
    name: 'Petrus',
    aka: '2×2×2 → 2×2×3 → EO → fin',
    summary:
      'Petit bloc, on l’agrandit, on oriente les arêtes au milieu, puis on termine. Très formateur, plus intuitif que mémorisation.',
    article: petrusArticle,
    demoNote:
      'Mini-blocs + une formule d’orientation d’arêtes + une Sune. Départ = inverse, arrivée = résolu.'
  }
};
