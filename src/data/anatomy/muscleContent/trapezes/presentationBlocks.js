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
    'Le trapèze est un muscle superficiel extrêmement vaste qui recouvre une grande partie de la région cervicale et thoracique supérieure. Il s’étend verticalement de la base du crâne jusqu’au bas de la colonne thoracique, et transversalement de la colonne vertébrale jusqu’à la ceinture scapulaire.'
  ),
  p(
    'Il constitue, avec son homologue du côté opposé, une large surface musculaire en forme de trapèze. Malgré son apparence de muscle unique, son architecture fonctionnelle est très particulière : ses fibres sont orientées dans plusieurs directions et peuvent produire des actions différentes selon la portion considérée.'
  ),
  p(
    'Le trapèze est à la fois un muscle moteur, un stabilisateur et un coordinateur de la scapula. Son rôle est essentiel dans les mouvements du bras, les mouvements de tirage, les mouvements au-dessus de la tête et toutes les situations où le membre supérieur doit transmettre une force au tronc.'
  ),
  splitCards(
    [
      {
        tag: 'Trapèze supérieur',
        text: 'Fibres descendantes. Élévation de la scapula et participation à la rotation supérieure.'
      },
      {
        tag: 'Trapèze moyen',
        text: 'Fibres essentiellement horizontales. Rétraction scapulaire et contrôle de la position.'
      },
      {
        tag: 'Trapèze inférieur',
        text: 'Fibres ascendantes. Dépression scapulaire et rôle majeur dans la rotation supérieure.'
      }
    ],
    'Cette organisation n’est pas simplement anatomique : elle détermine directement la manière dont le muscle peut exercer ses forces sur la scapula.'
  ),
  h3('Anatomie générale'),
  p(
    'Le trapèze est situé immédiatement sous la peau dans une grande partie de sa surface. Il constitue l’un des principaux muscles superficiels du dos et participe fortement à son relief.'
  ),
  trajet('crâne → colonne cervicale → colonne thoracique → scapula et clavicule'),
  p(
    'Contrairement à un muscle fusiforme classique dont les fibres suivent globalement une même direction entre deux extrémités, le trapèze possède des fibres dont l’orientation change progressivement. Cette architecture permet à différentes régions du muscle de tirer la scapula dans des directions différentes.'
  ),
  h3('Origines'),
  p(
    'Le trapèze prend origine sur une longue ligne médiane. Il ne s’agit donc pas d’un muscle attaché à une seule vertèbre ou à une petite zone osseuse : son origine couvre une très grande longueur de l’axe axial. Cette large origine constitue l’une des raisons pour lesquelles le trapèze peut exercer des forces sur la scapula depuis plusieurs directions.'
  ),
  ul([
    'protubérance occipitale externe',
    'tiers médial de la ligne nuchale supérieure',
    'ligament nuchal',
    'processus épineux des vertèbres cervicales et thoraciques, classiquement jusqu’à T12',
    'ligaments interépineux associés'
  ]),
  h3('Insertions'),
  p(
    'Ses fibres se terminent principalement sur trois structures de la ceinture scapulaire. La répartition de l’insertion varie selon la portion du muscle.'
  ),
  ul([
    'tiers latéral de la clavicule — principalement le trapèze supérieur',
    'acromion et partie supérieure de l’épine de la scapula — trapèze moyen',
    'partie médiale de l’épine de la scapula, via une expansion tendineuse — trapèze inférieur'
  ]),
  p(
    'Cette organisation permet au trapèze d’agir directement sur plusieurs zones de la ceinture scapulaire.'
  ),
  h3('Une architecture en trois directions'),
  p(
    'La caractéristique biomécanique essentielle du trapèze est l’orientation de ses fibres.'
  ),
  comparisonTable(
    ['Portion', 'Orientation des fibres', 'Fonction dominante'],
    [
      ['Supérieure', 'Descendantes', 'Élévation + rotation supérieure'],
      ['Moyenne', 'Horizontales', 'Rétraction + stabilisation'],
      ['Inférieure', 'Ascendantes', 'Dépression + rotation supérieure']
    ]
  ),
  p(
    'Les fibres supérieures partent de la région occipitale et cervicale et descendent vers la clavicule. Elles peuvent exercer une force qui tend à élever la scapula. Elles participent également à la rotation supérieure de la scapula, en coopération avec le trapèze inférieur et le dentelé antérieur. Le trapèze supérieur peut aussi participer à la stabilisation de la ceinture scapulaire lorsqu’une charge est appliquée au membre supérieur.'
  ),
  p(
    'Les fibres moyennes s’étendent principalement de la colonne vers l’acromion et l’épine de la scapula. Leur ligne de traction est particulièrement favorable à la rétraction scapulaire : la contraction du trapèze moyen tend à rapprocher la scapula de la colonne vertébrale. Cette action est importante dans de nombreux mouvements de tirage, mais aussi dans le contrôle de la position de la scapula lorsque le bras se déplace.'
  ),
  p(
    'Les fibres inférieures partent de la région thoracique inférieure et remontent vers l’épine de la scapula. Elles participent notamment à la dépression scapulaire et à la rotation supérieure de la scapula. Cette dernière fonction est particulièrement importante lors de l’élévation du bras.'
  ),
  h3('Biomécanique : comment le trapèze déplace la scapula'),
  p(
    'Pour comprendre le trapèze, il faut comprendre une particularité fondamentale de la scapula : elle ne fonctionne pas comme un os simplement posé contre les côtes. Elle possède plusieurs degrés de liberté. Ces mouvements sont produits par la combinaison des forces de plusieurs muscles. Le trapèze est l’un des principaux muscles responsables de cette mécanique.'
  ),
  ul([
    's’élever et s’abaisser',
    'se déplacer vers la colonne ou s’en éloigner',
    'effectuer une rotation supérieure ou inférieure',
    'basculer vers l’avant ou vers l’arrière',
    'effectuer une rotation interne ou externe'
  ]),
  h3('La rétraction scapulaire'),
  p(
    'La rétraction, aussi appelée adduction scapulaire, correspond au déplacement de la scapula vers la colonne vertébrale. Le trapèze moyen est particulièrement bien placé pour produire cette action. Lorsque ses fibres se contractent, elles tirent l’acromion et l’épine de la scapula vers les processus épineux.'
  ),
  p(
    'C’est notamment ce que l’on recherche lorsque l’on rapproche les omoplates, effectue un rowing, stabilise la scapula pendant certains tirages, ou maintient une position de rétraction sous charge.'
  ),
  pCallout(
    'warning',
    'Idée reçue à corriger',
    'La rétraction ne doit pas être confondue avec une règle absolue consistant à garder les omoplates constamment serrées. Dans de nombreux mouvements naturels, la scapula doit au contraire pouvoir protracter, tourner et se déplacer librement. Le rôle du trapèze est autant de permettre le mouvement que de contrôler son amplitude et son timing.'
  ),
  h3('L’élévation et la dépression'),
  p(
    'Le trapèze supérieur et inférieur ont des lignes de traction opposées dans le plan vertical. Le trapèze supérieur possède une composante importante d’élévation scapulaire. C’est notamment l’une des raisons pour lesquelles il est fortement sollicité lors des shrugs, où la scapula est volontairement élevée contre une résistance.'
  ),
  p(
    'Le trapèze inférieur possède au contraire une composante de dépression scapulaire. Cela ne signifie cependant pas que les deux portions travaillent systématiquement l’une contre l’autre. Leur relation devient particulièrement intéressante lorsqu’on considère la rotation de la scapula.'
  ),
  h3('La rotation supérieure : l’une des fonctions les plus importantes'),
  p(
    'La rotation supérieure de la scapula est fondamentale pour permettre au bras de s’élever efficacement au-dessus de la tête. Lorsque le bras passe d’une position basse à une position élevée, la scapula ne reste pas immobile. Elle effectue progressivement une rotation qui oriente davantage la cavité glénoïdale vers le haut.'
  ),
  p(
    'Le trapèze joue un rôle majeur dans ce mouvement. Mais il ne le réalise pas seul. La rotation supérieure repose notamment sur une synergie entre le trapèze supérieur, le trapèze inférieur et le dentelé antérieur.'
  ),
  p(
    'Le trapèze supérieur tire sur la partie latérale de la clavicule. Le trapèze inférieur exerce une traction sur la région médiale de l’épine de la scapula. Le dentelé antérieur exerce simultanément une traction sur le bord médial de la scapula. Ces forces, appliquées à différents endroits, produisent ensemble un couple de rotation permettant à la scapula de tourner vers le haut.'
  ),
  pCallout(
    'definition',
    'Définition clé',
    'C’est un exemple classique de la manière dont plusieurs muscles peuvent produire ensemble un mouvement qu’un muscle isolé ne pourrait pas réaliser efficacement.'
  ),
  h3('Le trapèze et l’élévation du bras'),
  p(
    'Lever le bras au-dessus de la tête nécessite bien plus qu’une simple contraction du deltoïde. L’humérus se déplace par rapport à la scapula, mais la scapula doit également se déplacer par rapport au thorax. Cette coordination est généralement décrite à travers le rythme scapulo-huméral.'
  ),
  p(
    'Une partie du mouvement d’élévation provient de l’articulation gléno-humérale et une autre de la rotation de la scapula sur le thorax. Le trapèze intervient directement dans cette seconde composante. Il contribue ainsi à créer les conditions mécaniques nécessaires pour que la scapula accompagne correctement l’élévation du bras. Sans mouvement scapulaire adapté, l’amplitude et la mécanique de l’épaule peuvent être fortement modifiées.'
  ),
  h3('Le trapèze comme stabilisateur'),
  p(
    'Le trapèze n’est pas seulement chargé de produire de grands mouvements visibles. Il doit également stabiliser la scapula pendant que d’autres muscles produisent un mouvement.'
  ),
  p(
    'Prenons un mouvement de traction. Le corps est suspendu à la barre. La force produite par le poids du corps est transmise aux mains, aux avant-bras, aux bras, à la ceinture scapulaire puis au tronc. La scapula doit alors être contrôlée pour que les forces puissent circuler efficacement.'
  ),
  p(
    'Le trapèze participe à cette stabilisation avec le grand dorsal, les rhomboïdes, le dentelé antérieur, les muscles de la coiffe des rotateurs, le petit pectoral et d’autres muscles de la ceinture scapulaire. Il ne s’agit donc pas simplement de « contracter le trapèze ». Il s’agit de produire la bonne quantité de force, dans la bonne direction, au bon moment.'
  ),
  h3('Le concept de couple de forces'),
  p(
    'La biomécanique du trapèze devient particulièrement intéressante lorsqu’on raisonne en termes de couples de forces. Deux forces peuvent agir dans des directions différentes sur différentes régions de la scapula et provoquer ensemble une rotation. C’est exactement ce qui se produit dans la rotation supérieure.'
  ),
  trajet('supérieur → traction vers le haut et latéralement'),
  trajet('inférieur → traction vers le bas et médialement'),
  p(
    'Pris individuellement, leurs actions semblent contradictoires. Pourtant, lorsqu’ils se contractent ensemble, leurs forces peuvent créer un couple qui fait tourner la scapula vers le haut. Le dentelé antérieur complète cette mécanique. Cette organisation permet à la scapula de tourner tout en conservant une bonne stabilité contre le thorax.'
  ),
  pCallout(
    'analogy',
    'Analogie',
    'Un mouvement anatomique ne correspond pas toujours à la simple addition des fonctions individuelles des muscles. Le trapèze supérieur et inférieur semblent s’opposer en élévation et en dépression ; ensemble, ils font tourner la scapula.'
  ),
  h3('Le trapèze et la position de la tête et du cou'),
  p(
    'Le trapèze supérieur possède également des attaches sur la région cervicale et occipitale. Il peut donc participer à la mécanique de la région cervicale, notamment lorsque la scapula est relativement fixe. Selon la position du cou et de la ceinture scapulaire, sa contraction peut contribuer à différents mouvements ou au maintien de la tête.'
  ),
  p(
    'Cela explique pourquoi le trapèze supérieur est fréquemment associé à des sensations de tension dans la région située entre le cou, la base du crâne et l’épaule. Cependant, une sensation de tension dans cette région ne signifie pas automatiquement que le trapèze est « trop fort » ou qu’il constitue la cause unique du problème. La région cervicale et scapulaire fonctionne comme un ensemble complexe de muscles et d’articulations.'
  ),
  h3('Le trapèze dans les mouvements de tirage'),
  p(
    'Dans les mouvements de tirage, le trapèze intervient principalement dans le contrôle de la scapula. Lors d’un rowing, par exemple, la scapula se déplace généralement vers la colonne à mesure que le coude est tiré vers l’arrière. Le trapèze moyen contribue fortement à cette rétraction. Les portions supérieure et inférieure participent quant à elles au maintien et à l’orientation de la scapula.'
  ),
  p(
    'Dans une traction, la situation est différente : la scapula doit gérer une charge importante tout en permettant au bras de produire le mouvement. La contribution de chaque portion dépend alors de la technique, de l’amplitude, de la position de l’épaule et de la phase du mouvement. C’est pourquoi dire qu’un exercice « travaille le trapèze » ne suffit pas. Il faut préciser quelle portion, dans quelle position et pour quelle fonction.'
  ),
  h3('Le trapèze dans les mouvements de poussée'),
  p(
    'Le trapèze intervient également lors des mouvements de poussée. Lors d’un développé au-dessus de la tête, par exemple, la scapula doit effectuer une rotation supérieure tandis que l’humérus s’élève. Le trapèze supérieur et inférieur participent à cette rotation avec le dentelé antérieur.'
  ),
  p(
    'Lors d’une pompe, la scapula doit également pouvoir se déplacer. Elle ne doit pas rester rigidement fixée en rétraction pendant toute la répétition. Le contrôle scapulaire implique donc une alternance entre différentes positions selon la phase du mouvement. Cette distinction est essentielle : un bon contrôle de la scapula ne signifie pas maintenir constamment les omoplates serrées.'
  ),
  h3('Le trapèze et la transmission des forces'),
  p(
    'La ceinture scapulaire constitue une zone de transition entre le tronc et le membre supérieur. Les forces produites par le bras doivent pouvoir être transmises au tronc, et inversement. Le trapèze participe à cette transmission.'
  ),
  p(
    'Lorsqu’une personne porte une charge lourde dans une main, par exemple, le poids tend à modifier la position de la ceinture scapulaire. Les muscles autour de la scapula doivent alors produire une force suffisante pour maintenir une position contrôlée. Le trapèze supérieur contribue notamment au maintien de la ceinture scapulaire face aux forces qui tendent à l’abaisser.'
  ),
  ul([
    'portés de charges et carries',
    'mouvements de suspension',
    'exercices de traction',
    'certains mouvements de street workout',
    'activités nécessitant de maintenir les bras sous tension'
  ]),
  h3('Trapèze et hypertrophie'),
  p(
    'Sur le plan esthétique, le trapèze participe fortement à l’apparence du haut du dos. Le développement du trapèze supérieur augmente notamment le relief situé entre le cou et l’épaule. Le développement des portions moyenne et inférieure contribue davantage à la densité et à la profondeur visuelle du haut du dos.'
  ),
  p(
    'Cependant, l’apparence du dos ne dépend pas du trapèze seul. Elle résulte de la combinaison du grand dorsal, du grand rond, des rhomboïdes, des deltoïdes postérieurs, des érecteurs du rachis et du trapèze dans son ensemble. Un dos visuellement équilibré nécessite donc de développer plusieurs fonctions et plusieurs régions musculaires.'
  ),
  h3('Pourquoi entraîner les trois portions'),
  p(
    'Un entraînement exclusivement orienté vers les shrugs ne reproduit qu’une partie du fonctionnement du trapèze. Les shrugs sollicitent fortement la capacité du trapèze supérieur à élever la scapula, mais ils ne couvrent pas l’ensemble des fonctions du muscle.'
  ),
  p(
    'Pour solliciter plus largement le trapèze, il faut également exposer la scapula à des mouvements et résistances impliquant la rétraction, la dépression, la rotation supérieure, la stabilisation et le contrôle de la scapula pendant les mouvements du bras. Cela peut être obtenu avec des exercices très différents : tirages, rowings, carries, mouvements au-dessus de la tête, exercices scapulaires et différents mouvements de traction.'
  ),
  h3('Trapèze et contrôle moteur'),
  p(
    'La force maximale n’est qu’une partie du rôle du trapèze. Un muscle peut être suffisamment fort pour produire une grande force tout en étant mal coordonné avec les autres muscles. Dans le cas du trapèze, le timing de contraction est particulièrement important.'
  ),
  p(
    'Lorsqu’un bras s’élève, la scapula doit progressivement modifier sa position. Le trapèze doit donc ajuster sa contribution au fur et à mesure du mouvement. Le système nerveux ne commande pas simplement « contracte le trapèze ». Il coordonne plusieurs muscles simultanément afin de produire une trajectoire précise de la scapula et de l’humérus.'
  ),
  p(
    'Le trapèze doit ainsi être compris comme un élément d’un système moteur complexe plutôt que comme un simple muscle destiné à produire de la force.'
  ),
  h3('Innervation'),
  p(
    'Le trapèze possède une innervation particulière. Son innervation motrice principale provient du nerf accessoire (XIe nerf crânien). Il reçoit également des fibres provenant des rameaux antérieurs de C3 et C4, notamment pour des composantes sensitives et proprioceptives.'
  ),
  p(
    'Le nerf accessoire joue un rôle essentiel dans la commande motrice du trapèze. Une atteinte de ce nerf peut donc provoquer une faiblesse importante du muscle, avec notamment des difficultés à élever et stabiliser la scapula.'
  ),
  h3('Vascularisation'),
  p(
    'Le trapèze bénéficie d’une vascularisation relativement riche, notamment via des branches provenant de l’artère transverse du cou, avec des variations anatomiques possibles. Cette vascularisation participe à l’apport d’oxygène et de nutriments nécessaire au fonctionnement du muscle ainsi qu’à sa récupération après l’effort.'
  ),
  h3('Le trapèze dans son ensemble'),
  p(
    'Le trapèze est donc bien plus qu’un muscle destiné à « hausser les épaules ». C’est une vaste structure musculaire dont les fibres couvrent une grande partie du haut du dos et dont l’organisation en trois directions permet de contrôler la scapula dans plusieurs plans.'
  ),
  p(
    'Supérieur : élévation + participation à la rotation supérieure. Moyen : rétraction + contrôle de la position scapulaire. Inférieur : dépression + participation majeure à la rotation supérieure. Mais ces fonctions ne doivent pas être considérées comme trois blocs totalement indépendants.'
  ),
  p(
    'Dans les mouvements complexes, les différentes portions du trapèze travaillent ensemble avec le dentelé antérieur, les rhomboïdes, le grand dorsal, les pectoraux et les muscles de la coiffe des rotateurs. Le résultat est un système capable de déplacer, stabiliser et orienter la scapula en fonction des besoins du mouvement. C’est cette capacité qui permet à l’épaule de rester à la fois mobile et contrôlée.'
  ),
  callout(
    'La bonne question',
    'Lorsqu’on analyse un exercice sollicitant le trapèze, la question n’est pas simplement : « Est-ce que cet exercice travaille le trapèze ? »\n\nC’est plutôt : « Quelle portion du trapèze produit quelle force, sur quelle structure, dans quelle direction, et pour permettre quel mouvement de la scapula ? »'
  ),
  takeaway(
    'Le trapèze est un vaste muscle superficiel, de la base du crâne jusqu’à T12, dont les fibres orientées dans trois directions contrôlent la scapula : élévation, rétraction, dépression et rotation supérieure. Il est à la fois moteur, stabilisateur et coordinateur de la ceinture scapulaire — pas seulement le muscle des shrugs.'
  )
];
