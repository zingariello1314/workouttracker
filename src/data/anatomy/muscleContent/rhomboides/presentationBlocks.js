import {
  p,
  h3,
  ul,
  takeaway,
  splitCards,
  pCallout,
  callout,
  trajet,
  comparisonTable
} from './blocks.js';

export default [
  p(
    'Les rhomboïdes regroupent deux muscles : le petit rhomboïde et le grand rhomboïde. Situés profondément sous le trapèze, entre la colonne vertébrale et le bord médial de la scapula, ils constituent un lien musculaire direct entre le rachis et l’omoplate.'
  ),
  p(
    'Ils sont relativement peu visibles en surface, mais leur rôle dans la mécanique de l’épaule est important. Leur fonction ne se résume pas à « serrer les omoplates ». Les rhomboïdes participent à la rétraction de la scapula, à sa rotation inférieure, à son maintien contre le thorax et au contrôle de sa position lorsque le bras se déplace.'
  ),
  p(
    'Ils font donc partie du système qui permet à la scapula de rester stable sans être complètement immobilisée.'
  ),
  splitCards(
    [
      {
        tag: 'Petit rhomboïde',
        text: 'Supérieur. Origine C7–T1 et ligament nuchal. Insertion près de la racine de l’épine de la scapula.'
      },
      {
        tag: 'Grand rhomboïde',
        text: 'Inférieur, beaucoup plus volumineux. Origine T2–T5. Insertion étendue sur le bord médial de la scapula.'
      }
    ],
    'Les deux muscles possèdent une orientation similaire et agissent globalement dans la même direction.'
  ),
  h3('Anatomie générale'),
  p(
    'Les rhomboïdes se trouvent dans la partie supérieure du dos, de chaque côté de la colonne. Ils sont situés sous le trapèze, en profondeur par rapport à celui-ci, entre la colonne thoracique et le bord médial de la scapula.'
  ),
  p(
    'Le grand rhomboïde est beaucoup plus volumineux que le petit et représente la plus grande partie de la masse musculaire rhomboïdienne. Les deux muscles possèdent cependant une orientation similaire et agissent globalement dans la même direction.'
  ),
  h3('Petit rhomboïde'),
  p(
    'Le petit rhomboïde prend principalement naissance au niveau du ligament nuchal inférieur et des processus épineux de C7 et T1. Ses fibres se dirigent ensuite en direction de la scapula.'
  ),
  p(
    'Il s’insère sur la partie médiale de la scapula, principalement au niveau de la région correspondant à la racine de l’épine de la scapula. Son orientation lui permet d’exercer une traction entre la colonne cervicale/thoracique supérieure et la partie médiale de la scapula.'
  ),
  h3('Grand rhomboïde'),
  p(
    'Le grand rhomboïde prend principalement origine sur les processus épineux des vertèbres thoraciques supérieures, classiquement de T2 à T5, ainsi que sur les structures ligamentaires associées. Ses fibres se dirigent vers le bord médial de la scapula.'
  ),
  p(
    'Il s’insère sur une grande partie du bord médial de la scapula, sous la région occupée par le petit rhomboïde. Son insertion beaucoup plus étendue explique en partie pourquoi le grand rhomboïde possède une contribution importante au contrôle de la scapula.'
  ),
  h3('Une architecture orientée vers la scapula'),
  p(
    'Les fibres des rhomboïdes se dirigent globalement vers le bas et latéralement, depuis la colonne vers la scapula. Cette orientation leur donne une ligne de traction particulière.'
  ),
  p(
    'Lorsqu’ils se contractent, ils peuvent tirer la scapula vers la colonne, légèrement vers le bas, et contre le thorax.'
  ),
  trajet('rétraction + rotation inférieure + stabilisation'),
  h3('Rétraction scapulaire'),
  p(
    'La fonction la plus connue des rhomboïdes est la rétraction de la scapula : le déplacement de la scapula vers la colonne vertébrale. Lorsque les rhomboïdes se contractent, ils exercent une traction sur le bord médial de la scapula et tendent à la rapprocher du rachis. C’est notamment ce qui se produit lorsque l’on cherche à « rapprocher les omoplates ».'
  ),
  p(
    'Cette fonction est importante dans les mouvements de tirage horizontaux. Lors d’un rowing, par exemple, la scapula peut se déplacer vers la colonne pendant que le bras se déplace vers l’arrière. Les rhomboïdes participent alors à cette composante scapulaire du mouvement.'
  ),
  pCallout(
    'warning',
    'Idée reçue à corriger',
    'Les rhomboïdes ne servent pas uniquement à « serrer les omoplates ». La rétraction est seulement une partie de leur fonction. Une scapula n’est jamais simplement située contre la colonne ou loin de la colonne : elle peut également tourner, basculer et modifier son orientation. Les rhomboïdes participent au contrôle de cette orientation, et donc de la base sur laquelle l’épaule se déplace.'
  ),
  h3('Rotation inférieure de la scapula'),
  p(
    'Les rhomboïdes participent également à la rotation inférieure de la scapula. Lors d’une rotation inférieure, la cavité glénoïdale s’oriente relativement davantage vers le bas tandis que la scapula tourne dans le sens opposé à la rotation supérieure.'
  ),
  p(
    'Cette fonction devient particulièrement intéressante lorsqu’on compare les rhomboïdes au trapèze et au dentelé antérieur. Les rhomboïdes participent plutôt à la rotation inférieure, tandis que le trapèze supérieur, le trapèze inférieur et le dentelé antérieur participent notamment à la rotation supérieure.'
  ),
  p(
    'Cela ne signifie pas qu’un système musculaire est « bon » et l’autre « mauvais ». La scapula doit pouvoir effectuer les deux types de rotation selon le mouvement demandé. La capacité à contrôler la rotation inférieure est donc une fonction normale de la ceinture scapulaire.'
  ),
  h3('Stabilisation de la scapula'),
  p(
    'L’une des fonctions les plus importantes des rhomboïdes est leur capacité à contribuer au maintien de la scapula contre le thorax. La scapula n’est pas reliée au tronc par une articulation osseuse classique. Elle repose sur la cage thoracique et doit être continuellement contrôlée par les muscles qui l’entourent.'
  ),
  p(
    'Les rhomboïdes participent à cette stabilisation en exerçant une force sur le bord médial de la scapula. Ils contribuent ainsi à limiter certains déplacements excessifs et à maintenir une relation mécanique cohérente entre colonne, scapula et humérus. Mais là encore, stabiliser ne signifie pas immobiliser. Les rhomboïdes doivent permettre à la scapula de bouger lorsque le mouvement l’exige.'
  ),
  h3('La scapula ne « flotte » pas librement'),
  p(
    'On dit souvent que la scapula « flotte » sur la cage thoracique. L’expression est utile pour comprendre qu’elle ne possède pas une articulation osseuse directe avec le thorax. Mais elle peut donner l’impression que l’omoplate est totalement libre. Ce n’est pas le cas.'
  ),
  p(
    'La scapula est maintenue et guidée par un ensemble complexe de structures. Les rhomboïdes constituent donc une pièce du système de suspension et de contrôle de la scapula, pas son unique point d’ancrage.'
  ),
  ul([
    'trapèze',
    'rhomboïdes',
    'dentelé antérieur',
    'petit pectoral',
    'grand dorsal',
    'muscles de la coiffe des rotateurs',
    'articulations sternoclaviculaire et acromioclaviculaire',
    'ligaments'
  ]),
  h3('Rhomboïdes et dentelé antérieur'),
  p(
    'La relation entre rhomboïdes et dentelé antérieur est particulièrement intéressante. Le dentelé antérieur tire la scapula vers l’avant et contribue fortement à sa protraction ainsi qu’à sa rotation supérieure. Les rhomboïdes exercent notamment une traction opposée sur la scapula et participent à sa rétraction et à sa rotation inférieure.'
  ),
  p(
    'Ces muscles ne sont donc pas simplement « adversaires ». Ils doivent être capables de produire des forces opposées lorsque cela est nécessaire, mais également de coordonner leur activité pour stabiliser la scapula. La scapula doit pouvoir se déplacer tout en restant contrôlée. C’est ce que l’on appelle une stabilité dynamique.'
  ),
  h3('Rhomboïdes et trapèze moyen'),
  p(
    'Les rhomboïdes et le trapèze moyen possèdent une fonction commune importante : la rétraction scapulaire. Ils peuvent donc être fortement sollicités dans les mêmes mouvements. Mais ils ne sont pas identiques.'
  ),
  p(
    'Le trapèze moyen possède principalement des fibres orientées horizontalement et exerce une traction particulièrement adaptée à la rétraction. Les rhomboïdes possèdent une orientation différente et participent également à la rotation inférieure et au contrôle de l’orientation de la scapula. Ils travaillent donc souvent ensemble sans être parfaitement interchangeables.'
  ),
  comparisonTable(
    ['', 'Petit rhomboïde', 'Grand rhomboïde'],
    [
      ['Position', 'Supérieur', 'Inférieur'],
      ['Taille', 'Plus petit', 'Plus volumineux'],
      ['Origine principale', 'C7–T1 + ligament nuchal', 'T2–T5'],
      ['Insertion', 'Partie supérieure du bord médial', 'Grande partie du bord médial'],
      ['Rétraction', 'Oui', 'Oui'],
      ['Rotation inférieure', 'Oui', 'Oui'],
      ['Stabilisation scapulaire', 'Oui', 'Oui'],
      ['Contribution à la masse', 'Faible', 'Importante']
    ]
  ),
  h3('Biomécanique du rowing'),
  p(
    'Le rowing est l’un des mouvements permettant de comprendre le fonctionnement des rhomboïdes. Au début du mouvement, selon la variante, la scapula peut être relativement éloignée de la colonne. Lorsque le tirage commence, le bras se déplace vers l’arrière et la scapula peut effectuer une rétraction. Les rhomboïdes participent alors au déplacement de la scapula vers la colonne.'
  ),
  p(
    'Mais leur rôle ne se limite pas à tirer l’omoplate en arrière. Ils doivent également contrôler sa position pendant que l’humérus se déplace. La qualité du rowing dépend donc de la coordination entre mouvement du coude, mouvement de l’humérus, mouvement scapulaire et stabilité du tronc.'
  ),
  h3('Rhomboïdes et mouvements de poussée'),
  p(
    'Les rhomboïdes ne sont pas uniquement actifs pendant les tirages. Lors d’un mouvement de poussée, la scapula peut effectuer une protraction. Les rhomboïdes doivent alors permettre et contrôler les changements de position de la scapula. Ils peuvent donc participer à la phase de retour ou au contrôle de la scapula selon le mouvement et la charge.'
  ),
  p(
    'Une bonne fonction scapulaire nécessite que les muscles puissent produire une force lorsque cela est nécessaire, mais aussi freiner et contrôler le mouvement opposé.'
  ),
  h3('Rhomboïdes et élévation du bras'),
  p(
    'Lorsque le bras s’élève, la scapula doit généralement effectuer une rotation supérieure. Les rhomboïdes, qui participent à la rotation inférieure, ne doivent donc pas être considérés comme des muscles qu’il faut contracter maximalement pour maintenir la scapula dans cette position. Ils doivent au contraire pouvoir moduler leur activité afin de permettre le mouvement.'
  ),
  p(
    'Cela illustre encore une fois la différence entre stabiliser une articulation et empêcher une articulation de bouger. Une scapula fonctionnelle doit être capable de faire les deux selon la situation.'
  ),
  h3('Les rhomboïdes et la posture'),
  p(
    'Les rhomboïdes sont souvent présentés comme des muscles « de posture ». Cette description contient une part de vérité, mais elle est trop simpliste si elle est prise au pied de la lettre. Les rhomboïdes participent au maintien de la position de la scapula et peuvent contribuer à contrôler sa rétraction. Ils peuvent donc intervenir dans le maintien de certaines positions prolongées.'
  ),
  p(
    'Mais une posture ne dépend jamais d’un seul muscle. La position des épaules et des omoplates dépend notamment de la morphologie, de la mobilité, du contrôle moteur, du trapèze, du dentelé antérieur, des pectoraux, du grand dorsal, des muscles de la coiffe, du rachis thoracique et des habitudes de mouvement. Renforcer les rhomboïdes peut améliorer certaines capacités de contrôle, mais il serait incorrect de présenter leur renforcement comme une solution universelle aux « mauvaises postures ».'
  ),
  h3('Pourquoi les rhomboïdes sont difficiles à isoler'),
  p(
    'Les rhomboïdes sont profondément situés sous le trapèze. Ils sont donc difficiles à isoler complètement. Lors d’un mouvement de rétraction scapulaire, plusieurs muscles peuvent contribuer simultanément : trapèze moyen, grand rhomboïde, petit rhomboïde, trapèze inférieur selon la position, et d’autres muscles stabilisateurs. Il est donc plus pertinent de chercher à orienter le mouvement vers leur fonction que de chercher une isolation absolue.'
  ),
  h3('Entraînement'),
  p(
    'Les exercices qui demandent une rétraction contrôlée de la scapula sont particulièrement intéressants. Les rowings sont particulièrement adaptés parce qu’ils permettent d’associer production de force, mouvement du bras, rétraction scapulaire et stabilisation. Pour les exercices plus légers comme le reverse fly ou certains mouvements scapulaires, la priorité peut davantage être donnée au contrôle de la scapula.'
  ),
  ul([
    'Rowing haltère',
    'Rowing barre',
    'Rowing poulie',
    'Chest-supported row',
    'Reverse fly',
    'Face pull',
    'Scapular row'
  ]),
  pCallout(
    'warning',
    'Deux erreurs classiques',
    'Serrer les omoplates au maximum à chaque répétition n’est pas une règle universelle. Une rétraction maximale permanente peut réduire la liberté nécessaire à certains mouvements du bras. Objectif : rétraction contrôlée → contraction → retour contrôlé. Pas : rétraction maximale → verrouillage → maintien permanent.\n\nAvoir les omoplates rapprochées ne signifie pas automatiquement avoir une « bonne posture ». Il n’existe pas une position unique dans laquelle les omoplates devraient rester toute la journée.'
  ),
  h3('Force des rhomboïdes et performance'),
  p(
    'Les rhomboïdes contribuent à la capacité de contrôler la scapula lors des mouvements de tirage. Cette fonction peut avoir une influence indirecte sur la performance dans les rowings, les tractions, certains mouvements de gymnastique, les mouvements de suspension et les exercices nécessitant une forte stabilité scapulaire.'
  ),
  p(
    'Mais la performance ne dépend jamais des rhomboïdes seuls. La force d’un tirage repose sur une chaîne musculaire comprenant notamment doigts, avant-bras, bras, épaule, scapula et tronc. Les rhomboïdes constituent l’un des maillons de cette chaîne.'
  ),
  h3('Innervation'),
  p(
    'Les rhomboïdes sont principalement innervés par le nerf dorsal de la scapula, issu généralement de la racine C5 du plexus brachial. Ce nerf innerve également le muscle élévateur de la scapula dans sa distribution classique. Une atteinte du nerf dorsal de la scapula peut donc affecter la capacité à contrôler certains mouvements de la scapula.'
  ),
  callout(
    'À retenir',
    'Petit rhomboïde → contrôle supérieur de la scapula.\nGrand rhomboïde → contribution majeure à la rétraction et au contrôle médial.\nEnsemble → rétraction + rotation inférieure + stabilisation dynamique.\n\nLeur rôle n’est pas de maintenir l’omoplate constamment collée à la colonne. Il est de permettre à la scapula de rester contrôlée tout en conservant sa mobilité.'
  ),
  takeaway(
    'Les rhomboïdes sont de petits muscles discrets visuellement, mais leur importance fonctionnelle dépasse largement leur taille. Ils relient la colonne à la scapula et travaillent en permanence avec le trapèze, le dentelé antérieur et les autres muscles de la ceinture scapulaire. Ce sont avant tout des stabilisateurs et contrôleurs de la scapula — pas simplement les muscles qui « serrent les omoplates ».'
  )
];
