import { p, h3, ul, callout, pCallout, takeaway } from './blocks.js';

export default [
  p(
    'Quand on parle des épaules, le deltoïde est généralement le premier muscle auquel on pense. Pourtant, le mouvement du bras dépend d’un système beaucoup plus complexe. Sous le deltoïde se trouve un ensemble de quatre muscles et de leurs tendons appelé coiffe des rotateurs : le supra-épineux, l’infra-épineux, le petit rond et le subscapulaire.'
  ),
  p(
    'Ces quatre muscles prennent naissance sur la scapula et s’insèrent sur l’humérus. Leurs tendons entourent une grande partie de l’articulation gléno-humérale et se prolongent avec la capsule articulaire. Leur disposition forme une véritable coiffe musculotendineuse autour de la tête humérale, avec une couverture particulièrement importante sur les faces antérieure, supérieure et postérieure.'
  ),
  p(
    'L’articulation gléno-humérale possède une caractéristique fondamentale : elle offre une mobilité exceptionnelle au prix d’une stabilité osseuse relativement faible. La tête de l’humérus est volumineuse alors que la glène de la scapula est relativement petite et peu profonde. La stabilité ne dépend donc pas uniquement de la forme des os. Elle repose sur la capsule, le labrum, les ligaments, la pression intra-articulaire et surtout, pendant le mouvement, sur les muscles qui contrôlent activement l’articulation.'
  ),
  h3('Un système de stabilisation dynamique'),
  p(
    'Le rôle de la coiffe ne se résume pas à « empêcher l’épaule de sortir ». Pendant un mouvement, ses muscles produisent des forces qui compressent et guident la tête humérale contre la glène, tout en permettant à l’humérus de tourner.'
  ),
  p(
    'C’est particulièrement important lorsque le deltoïde se contracte. Le deltoïde est capable de produire une grande force d’élévation, mais sa ligne de traction comporte également une composante qui tend à déplacer la tête humérale. La coiffe participe alors à équilibrer les forces autour de l’articulation et à contrôler les translations de l’humérus.'
  ),
  p('On peut donc voir le système de manière simplifiée :'),
  ul([
    'deltoïde → produit une grande partie du mouvement ;',
    'coiffe des rotateurs → contrôle la position de l’humérus pendant ce mouvement.'
  ]),
  p(
    'Mais cette opposition « moteur contre stabilisateur » reste imparfaite : la coiffe produit elle-même des mouvements et le deltoïde participe également à la stabilité. Il s’agit plutôt d’un système coopératif dans lequel plusieurs muscles produisent simultanément mouvement et contrôle.'
  ),
  h3('Les quatre muscles de la coiffe'),
  h3('Supra-épineux'),
  p(
    'Le supra-épineux se trouve au-dessus de l’épine de la scapula, dans la fosse supra-épineuse. Son tendon passe sous l’acromion avant de rejoindre la partie supérieure de l’humérus.'
  ),
  p(
    'Il participe à l’abduction du bras et joue un rôle important dans le contrôle de la tête humérale. On lui attribue traditionnellement un rôle particulier au début de l’abduction, notamment dans les premiers degrés du mouvement, avant que le deltoïde ne devienne le principal moteur de l’élévation.'
  ),
  p(
    'Cependant, il serait trop simpliste de le présenter comme le muscle qui « démarre obligatoirement toutes les élévations ». Les mouvements de l’épaule sont produits par plusieurs muscles simultanément et leur contribution dépend de la position du bras et de la tâche.'
  ),
  h3('Infra-épineux'),
  p(
    'L’infra-épineux occupe une grande partie de la face postérieure de la scapula, sous son épine. C’est un puissant rotateur externe de l’humérus. Il participe également au contrôle de la tête humérale et forme, avec le petit rond et le subscapulaire, un système de forces permettant de contrôler la rotation et la translation de l’humérus.'
  ),
  p(
    'Son importance devient particulièrement évidente dans les mouvements où le bras doit produire ou contrôler une rotation externe, mais il ne faut pas le réduire à cette seule fonction : comme les autres muscles de la coiffe, il participe également à la stabilité dynamique.'
  ),
  h3('Petit rond'),
  p(
    'Le petit rond est un muscle relativement petit situé sur la partie postérieure de la scapula, sous l’infra-épineux. Il contribue lui aussi à la rotation externe de l’humérus et participe au contrôle de la tête humérale. Sa taille est beaucoup plus faible que celle du subscapulaire, mais son orientation particulière lui permet de participer au contrôle fin de l’articulation.'
  ),
  h3('Subscapulaire'),
  p(
    'Le subscapulaire est le plus volumineux des muscles de la coiffe. Contrairement aux trois autres, il se trouve sur la face antérieure de la scapula, dans la fosse subscapulaire.'
  ),
  p(
    'Il est principalement impliqué dans la rotation interne de l’humérus, mais son importance ne se limite pas à produire cette rotation. Sa position à l’avant de l’articulation lui permet également de participer au contrôle de la tête humérale et notamment de limiter certaines translations antérieures.'
  ),
  h3('Une véritable balance de forces'),
  p(
    'Une façon particulièrement intéressante de comprendre la coiffe consiste à ne pas considérer ses muscles séparément.'
  ),
  p(
    'Le subscapulaire produit une force depuis l’avant tandis que l’infra-épineux et le petit rond produisent notamment des forces depuis l’arrière. Le supra-épineux participe quant à lui à la compression et au contrôle de la tête humérale.'
  ),
  p(
    'Ces forces opposées contribuent à maintenir la tête de l’humérus correctement orientée pendant que le bras bouge. C’est ce qu’on appelle parfois un couple de forces (force couple).'
  ),
  p(
    'Cette organisation permet à l’épaule de combiner deux propriétés qui semblent contradictoires : une très grande mobilité et un contrôle suffisamment précis pour que cette mobilité soit exploitable.'
  ),
  h3('La coiffe ne travaille jamais seule'),
  p(
    'La coiffe des rotateurs contrôle l’articulation gléno-humérale, mais l’humérus est attaché à une scapula qui elle-même se déplace sur le thorax.'
  ),
  p(
    'Lorsque tu lèves le bras au-dessus de la tête, plusieurs articulations participent simultanément au mouvement. L’humérus s’élève et tourne, la scapula effectue notamment une rotation vers le haut et une inclinaison postérieure, tandis que la clavicule accompagne le mouvement au niveau des articulations sternoclaviculaire et acromioclaviculaire.'
  ),
  p(
    'Le mouvement de l’épaule est donc mieux représenté comme une chaîne cinématique que comme un simple mouvement de l’humérus.'
  ),
  p(
    'C’est particulièrement important pour les mouvements que tu veux intégrer à ton application : développé militaire, handstand, traction, muscle-up, lancer, élévation latérale ou même simple mouvement du bras au-dessus de la tête.'
  ),
  pCallout(
    'study',
    'Anatomie avancée',
    'On enseigne souvent qu’environ 2° de mouvement huméral correspondent à 1° de mouvement scapulaire, parfois avec un ratio de 3:1 selon la phase du mouvement.\n\nCela constitue une bonne représentation pédagogique générale, mais ce n’est pas une règle fixe que toutes les épaules doivent respecter.\n\nUne méta-analyse publiée en 2025 portant sur la cinématique scapulaire a trouvé une grande variabilité entre individus et remet explicitement en question le fameux « rythme 3:1 » constant ainsi que l’idée d’une phase initiale où la scapula serait simplement immobile.\n\nUne épaule saine n’a pas nécessairement une cinématique identique à celle d’une autre épaule saine.'
  ),
  callout(
    'Et le « pincement » du supra-épineux ?',
    'Il est courant d’expliquer les douleurs d’épaule par une histoire très simple : la scapula bouge mal → l’espace sous l’acromion diminue → le supra-épineux est pincé → douleur.\n\nCette explication contient une part de vérité biomécanique, mais elle est trop simpliste pour représenter la compréhension moderne des douleurs d’épaule.\n\nLes changements de cinématique de l’humérus et de la scapula peuvent effectivement modifier les espaces et les contraintes autour des structures sous-acromiales. Mais l’effet exact dépend de l’angle d’élévation, de la direction du mouvement et de nombreux autres facteurs.\n\nDe plus, une méta-analyse récente montre une grande variabilité de la cinématique scapulaire chez les personnes avec et sans douleur de la coiffe. Il est donc difficile de définir une seule position scapulaire comme « normale » et une autre comme automatiquement pathologique.\n\nCela ne signifie pas que la scapula est sans importance. Au contraire, son contrôle est essentiel. Mais une mauvaise position observée n’est pas à elle seule un diagnostic.'
  ),
  callout(
    '🔬 La coiffe est aussi un système sensoriel',
    'Les muscles et tendons de l’épaule contiennent des récepteurs permettant au système nerveux de recevoir des informations sur la tension, la longueur musculaire et la position de l’articulation.\n\nLa coiffe ne sert donc pas uniquement à produire une force mécanique. Elle participe également au contrôle sensorimoteur qui permet au cerveau d’ajuster continuellement la position du bras.\n\nC’est une des raisons pour lesquelles un mouvement comme un handstand ne dépend pas seulement de la force du deltoïde : il demande également une capacité importante à détecter et corriger de petites variations de position de l’humérus et de la scapula.'
  ),
  takeaway(
    'La coiffe des rotateurs n’est pas simplement un « groupe de petits muscles à renforcer pour éviter les blessures ».\n\nC’est un système dynamique de contrôle de l’épaule. Le supra-épineux, l’infra-épineux, le petit rond et le subscapulaire produisent des rotations, compressent l’articulation et contrôlent les déplacements de la tête humérale pendant que le deltoïde et les autres muscles produisent les mouvements plus importants.\n\nEt ce système fonctionne avec la scapula, la clavicule, le trapèze, le dentelé antérieur et l’ensemble de la chaîne du membre supérieur.\n\nLe deltoïde déplace le bras ; la coiffe aide à contrôler la manière dont l’humérus se déplace dans l’articulation.\n\nC’est cette distinction entre production du mouvement et contrôle du mouvement qui est probablement la notion la plus importante à retenir.'
  ),
  p(
    'Sources principales : anatomie NCBI/StatPearls actualisée en 2026, revues biomécaniques de la coiffe et de l’épaule, et méta-analyse 2025 sur la variabilité de la cinématique scapulaire.'
  )
];
