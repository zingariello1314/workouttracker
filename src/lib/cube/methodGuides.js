export const METHOD_GUIDES = {
  lbl: {
    id: 'lbl',
    name: 'Layer by Layer (débutant)',
    aka: 'Méthode des couches, « Beginner’s method »',
    summary:
      'On reconstruit le cube comme un immeuble : d’abord le toit (ou le sol), puis l’étage du milieu, puis le dernier plafond. Ce n’est pas la plus courte, c’est la plus lisible.',
    deep: [
      'Contrairement aux échecs, tu ne « prends » jamais une pièce adverse : chaque coup tourne une face entière, donc 8 ou 9 cubies bougent d’un coup. La notation « R » ne désigne pas une tour qui va en e4, elle désigne la face droite que tu fais pivoter.',
      'La croix du haut n’est réussie que si les arêtes matchent aussi les centres latéraux (blanc-vert avec le vert, etc.). Une croix « mal tournée » (blanche ok, côtés faux) n’est pas une croix.',
      'Les coins de la première couronne s’insèrent souvent avec la formule « R U R’ U’ » (le « sexy move ») : tu casses un peu, tu glisses le coin, tu refermes.',
      'La 2e couronne : uniquement des arêtes. Formules « droitière » et « gauchère ». Tu n’y touches plus aux coins du haut.',
      'Dernière couche : d’abord une croix (souvent jaune), puis orienter les coins, puis permuter. En débutant on le fait en 2 ou 3 mini-étapes, pas en un seul algo.'
    ],
    vsOthers:
      'Plus long que CFOP (~100 coups vs ~55) parce que croix + coins sont séparés, et que la 2e couronne est séparée du F2L. Beaucoup moins de formules à retenir.',
    demoNote:
      'La démo enchaîne des formules typiques. L’état de départ est l’inverse de cet enchaînement : le cube redevient résolu à la fin. Ce n’est pas « un mélange WCA + une vraie résolution débutant filmée », c’est un parcours pédagogique des gestes.'
  },
  cfop: {
    id: 'cfop',
    name: 'CFOP (Fridrich)',
    aka: 'Cross, F2L, OLL, PLL',
    summary:
      'Toujours des couches, mais on fusionne la 1re et la 2e couronne en « F2L » : on range des paires coin+arête. C’est la méthode dominante en compétition 3×3.',
    deep: [
      'Cross : une croix (souvent blanche) se fait en bas pendant l’inspection. « Cross » ≠ « croix du haut » du débutant : beaucoup de gens la mettent au dessous pour voir le F2L.',
      'F2L : 4 paires. Intuitif d’abord (tu chasses le coin et l’arête puis tu insères), puis algos. C’est là que tu gagnes le plus de temps vs LBL.',
      'OLL (Orientation of the Last Layer) : toute la face du dessus de la bonne couleur, peu importe où sont les pièces. Full OLL = 57 formules ; 2-look = d’abord croix puis coins (~10).',
      'PLL (Permutation of the Last Layer) : les 8 pièces de dernière couche trouvent leur place. Full PLL = 21 formules (T-perm, U-perm, etc.) ; 2-look = 6.',
      'Parallèle échecs : un « T-perm » est une ouverture nommée, pas un coup unique. « R U R’ U’ R’ F R2 … » est la partition ; le nom « T-perm » est le titre du morceau.'
    ],
    vsOthers:
      'Plus de mémoire que Roux/Petrus en full CFOP, plus de rotations du cube (y, x) que Roux. Le lookahead (voir la paire suivante pendant que tu insères) vaut plus que d’apprendre le 57e OLL trop tôt.',
    demoNote:
      'Démo : Cross → une paire F2L → un OLL court → T-perm. L’état initial est l’inverse, pour finir résolu.'
  },
  roux: {
    id: 'roux',
    name: 'Roux',
    aka: 'Méthode des blocs + CMLL + LSE',
    summary:
      'On ne peint pas les faces une par une : on construit deux « murs » 1×2×3 (gauche puis droite), on règle les coins du haut, puis on finit les arêtes avec la tranche du milieu.',
    deep: [
      'Premier bloc : souvent sur la gauche, 1×2×3 collé aux centres. Ce n’est pas une croix.',
      'Second bloc : le mur opposé, sans casser le premier. Moins de rotations du cube entier qu’en CFOP.',
      'CMLL : les 4 coins de la dernière couche (orientation + permutation) d’un coup. ~42 algos, ou 2-look plus léger.',
      'LSE (Last Six Edges) : les 6 arêtes restantes + les centres U/D, surtout avec « M » (tranche entre gauche et droite) et « U ». Ici la démo 3D n’utilise pas « M » (le moteur ne joue que les 6 faces) : l’étape LSE est un stand-in en U/R/L.',
      'Notation : « M » n’est pas une face comme « R ». C’est la tranche centrale, parallèle à L. « M » tourne dans le même sens que « L » si tu regardes depuis la gauche. Ce n’est pas un équivalent échecs (il n’y a pas de « rangée du milieu » à bouger d’un coup aux échecs).'
    ],
    vsOthers:
      'Moins de formules que full CFOP, beaucoup moins de rotations. Sensations très différentes (thumbs, M). Souvent ~45–50 coups.',
    demoNote:
      'Blocs + Sune (à la place d’un vrai CMLL) + finition sans M. Pour voir un vrai LSE, il faudrait les coups de tranche, absents de cette démo 3D.'
  },
  zz: {
    id: 'zz',
    name: 'ZZ',
    aka: 'EOLine + blocs <R,U,L>',
    summary:
      'On commence par orienter toutes les arêtes (plus une ligne en bas) : ensuite on n’a presque plus besoin de tourner F/B ni de retourner le cube. Le F2L se fait surtout avec R, U, L.',
    deep: [
      'EO (Edge Orientation) : une arête « mal orientée » aurait besoin d’un F ou B pour être « à plat ». Après l’EO, les F/B casseraient ce travail : d’où le F2L restreint.',
      'EOLine : EO + placer les arêtes DF et DB (ligne au sol). Souvent préparé pendant l’inspection.',
      'Les deux blocs restants : comme un F2L sans rotations, ergonomique, rythme très régulier.',
      'Last layer : OLL/PLL classiques, ou plus tard ZBLL (un algo pour toute la dernière couche, ~493 cas — optionnel).',
      'Parallèle : ce n’est pas « ouvrir par e4 ». C’est plutôt décider dès le début que tes fous ne bougeront plus sur certaines diagonales — une contrainte qui simplifie la suite.'
    ],
    vsOthers:
      'Début plus dur que CFOP (EOLine). Ensuite souvent plus confortable. Longueur proche de Roux (~45–50).',
    demoNote:
      'L’étape « EOLine » est un enchaînement qui oriente des arêtes (formule type OLL), pas une EOLine de compétition filmée. Inverse = cube de départ.'
  },
  petrus: {
    id: 'petrus',
    name: 'Petrus',
    aka: 'Blocs 2×2×2 → 2×2×3 → EO → fin',
    summary:
      'On agrandit un bloc sans le casser, on oriente les arêtes au milieu de la résolution, puis on termine. Excellent pour comprendre Roux et ZZ.',
    deep: [
      '2×2×2 : un coin et ses trois arêtes, coincé dans un octant. Tu élargis ensuite en 2×2×3.',
      'EO au milieu : comme ZZ, mais après avoir déjà un gros bloc. Les coups suivants cassent moins.',
      'Ensuite on finit les deux premières couches, puis une dernière couche classique.',
      'Peu d’algos, beaucoup de lecture. Moins courant en WCA speedsolve aujourd’hui, très formateur.',
      '« Petrus » est un nom de personne (comme « Fridrich »), pas une notation de coup. Les coups restent « R », « U », etc.'
    ],
    vsOthers:
      'Plus « blocs » que LBL/CFOP, plus « EO » que Roux. Longueur ~45–60 coups selon le praticien.',
    demoNote:
      'Mini-blocs + une formule d’orientation d’arêtes + une Sune. Départ = inverse, arrivée = résolu.'
  }
};
