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
    'Le triceps brachial est le principal muscle situé sur la face postérieure du bras. Avec ses trois chefs — long, latéral et médial — il représente généralement autour de 60 à 70 % de la masse musculaire du bras, même si cette proportion varie selon les individus et la manière dont la masse musculaire est mesurée.'
  ),
  p(
    'Son rôle principal est l’extension du coude : il permet de déplier le bras et constitue donc l’un des principaux moteurs de tous les mouvements de poussée. Il intervient notamment dans les pompes, les dips, les développés, les développés au-dessus de la tête, les pompes en équilibre et HSPU, les mouvements de gymnastique, la phase de poussée du muscle-up et de nombreux mouvements de street workout.'
  ),
  p(
    'Le triceps n’est cependant pas un seul bloc homogène. Leurs origines diffèrent, mais leurs fibres convergent vers une insertion commune principalement située sur l’olécrâne de l’ulna. Ils constituent donc un seul muscle sur le plan fonctionnel, mais avec des portions anatomiquement et mécaniquement différentes.'
  ),
  splitCards(
    [
      {
        tag: 'Chef long',
        text: 'Origine scapulaire. Traverse l’épaule. Extension du coude + action sur l’épaule.'
      },
      {
        tag: 'Chef latéral',
        text: 'Origine humérale. Relief externe. Extension du coude, ne traverse pas l’épaule.'
      },
      {
        tag: 'Chef médial',
        text: 'Origine humérale, portion profonde. Extension du coude, masse globale.'
      }
    ],
    'Le chef long traverse l’articulation de l’épaule ; les chefs latéral et médial ne la traversent pas.'
  ),
  h3('Anatomie générale'),
  p(
    'Le triceps occupe la majeure partie de la face postérieure du bras. Ses trois chefs entourent en partie l’humérus et convergent progressivement vers le coude. Chef long : portion la plus médiale et superficielle dans la partie proximale du bras, provenant de la scapula. Chef latéral : partie postéro-latérale du bras, très visible lorsque le bras est contracté. Chef médial : portion profonde, située sous les deux autres chefs sur une grande partie de son trajet.'
  ),
  h3('Chef long'),
  p(
    'Le chef long est le seul chef du triceps prenant son origine sur la scapula. Il prend principalement son origine sur le tubercule infraglénoïdal de la scapula, situé juste sous la cavité glénoïdale. Cette origine place directement le chef long au-dessus de l’articulation de l’épaule. Il traverse ensuite l’épaule avant de rejoindre la partie postérieure du bras.'
  ),
  trajet('épaule + coude'),
  p(
    'Son trajet lui permet d’agir simultanément sur l’épaule et le coude. C’est une caractéristique fondamentale. Comme les autres chefs, ses fibres convergent vers le tendon distal du triceps et participent à son insertion principalement sur l’olécrâne de l’ulna, avec des expansions vers le fascia de l’avant-bras.'
  ),
  h3('Chef latéral'),
  p(
    'Le chef latéral constitue une grande partie de la masse visible sur la partie externe et postérieure du bras. Il prend son origine sur la face postérieure de l’humérus, au-dessus du sillon du nerf radial. Ses fibres descendent vers le coude en formant une portion musculaire relativement large. Comme il ne traverse pas l’épaule, son action directe concerne principalement le coude. Il participe donc fortement à l’extension du coude. Son volume contribue beaucoup à l’aspect massif de la partie externe du triceps.'
  ),
  h3('Chef médial'),
  p(
    'Le chef médial est plus profond. Il prend principalement son origine sur la face postérieure de l’humérus, sous le sillon du nerf radial, avec une zone d’origine étendue sur la partie inférieure de l’humérus. Il est situé en profondeur sous les chefs long et latéral sur une grande partie du bras. Comme le chef latéral, il ne traverse pas l’épaule. Son action principale est donc l’extension du coude. Il participe de manière importante à l’extension dans de nombreuses situations, notamment lorsque la résistance n’est pas maximale. Son rôle est moins spectaculaire visuellement parce qu’une grande partie de sa masse est profonde.'
  ),
  h3('Convergence des trois chefs'),
  trajet('scapula / humérus → trois chefs → tendon distal commun → olécrâne'),
  p(
    'Les trois chefs sont anatomiquement distincts à leur origine, mais ils convergent progressivement vers une terminaison commune. Cette organisation permet au triceps de produire une force importante au niveau du coude. Il ne faut donc pas imaginer trois muscles complètement indépendants. Ils travaillent ensemble, avec des différences de ligne de traction, de position et de contribution selon le mouvement.'
  ),
  h3('Insertion commune'),
  p(
    'Le tendon distal du triceps se fixe principalement sur l’olécrâne, la proéminence osseuse située à l’arrière du coude. L’olécrâne appartient à l’ulna. Lorsque le triceps se contracte, il exerce une traction sur cette insertion. Cette traction produit principalement une extension du coude : coude fléchi → coude tendu. Le tendon possède également des expansions vers le fascia de l’avant-bras, ce qui participe à la transmission des forces autour du coude.'
  ),
  h3('Extension du coude'),
  p(
    'L’extension du coude constitue la fonction commune fondamentale des trois chefs. Lorsque le triceps se contracte, il tire l’olécrâne vers le haut et provoque l’extension de l’avant-bras par rapport au bras. Cette fonction est présente dans pratiquement tous les mouvements où l’on pousse quelque chose loin de soi.'
  ),
  p(
    'Dans une pompe, les pectoraux et le deltoïde antérieur produisent une grande partie de la poussée, tandis que le triceps étend le coude et contribue à terminer la poussée. Dans un développé, les muscles de l’épaule et du thorax produisent la force et le triceps contribue fortement à l’extension du coude. Le triceps est donc rarement seul responsable du mouvement, mais il constitue l’un des principaux maillons de la chaîne de poussée.'
  ),
  h3('Le bras de levier du triceps'),
  p(
    'La capacité du triceps à produire un mouvement dépend notamment de son bras de levier par rapport à l’articulation du coude. Ce bras de levier change selon l’angle du coude. Cela signifie qu’une charge identique peut sembler très différente selon la position dans laquelle elle est appliquée. C’est l’une des raisons pour lesquelles une répétition de pushdown ou d’extension du coude peut devenir beaucoup plus difficile dans certaines portions de l’amplitude.'
  ),
  p(
    'La difficulté d’un exercice ne dépend donc pas uniquement du poids. Elle dépend également de l’angle du coude, de la position de l’épaule, de la longueur musculaire, du bras de levier externe, de la trajectoire de la résistance et de la capacité du muscle à produire du couple à cet angle.'
  ),
  h3('Le chef long traverse l’épaule'),
  p(
    'C’est la particularité biomécanique la plus importante du triceps. Le chef long prend son origine sur la scapula. Il traverse donc l’articulation gléno-humérale avant d’atteindre le coude. Il possède ainsi deux articulations à contrôler : épaule et coude. Les chefs latéral et médial, eux, ne traversent que le coude. Cette différence signifie que la position de l’épaule influence directement la longueur et les conditions mécaniques du chef long.'
  ),
  h3('Position du bras et longueur du chef long'),
  p(
    'Lorsque le bras est placé au-dessus de la tête, l’épaule est en flexion. Le chef long est alors placé dans une position plus allongée au niveau de l’épaule. Si le coude est simultanément fléchi, le chef long est également allongé au niveau du coude. On obtient alors une situation où le muscle est placé sur une grande longueur fonctionnelle.'
  ),
  ul([
    'extensions triceps au-dessus de la tête',
    'extensions à la poulie au-dessus de la tête',
    'extensions avec haltère derrière la tête',
    'certaines variantes de skull crushers avec les bras davantage en flexion d’épaule'
  ]),
  p(
    'À l’inverse, lors d’un pushdown avec le bras proche du corps, l’épaule est dans une position beaucoup moins élevée. Le chef long est alors généralement moins allongé au niveau de l’épaule. Cela ne signifie pas qu’il cesse de travailler. Il continue évidemment de participer à l’extension du coude. Mais les conditions de longueur et de tension changent.'
  ),
  h3('Relation longueur-tension'),
  p(
    'La position du chef long illustre le principe de relation longueur-tension. Un muscle ne produit pas exactement la même force à toutes les longueurs. Lorsqu’un muscle est très raccourci ou extrêmement allongé, sa capacité à produire activement de la force peut être différente de celle observée dans une longueur intermédiaire. Le chef long ajoute une dimension supplémentaire parce que sa longueur dépend de deux articulations. On peut donc modifier sa longueur en changeant la position du coude, mais aussi la position de l’épaule. C’est une raison importante pour laquelle deux exercices d’extension du coude peuvent solliciter le triceps dans des conditions très différentes.'
  ),
  comparisonTable(
    ['', 'Pushdown', 'Extension overhead'],
    [
      ['Position du bras', 'Proche du corps', 'Élevé'],
      ['Épaule', 'Moins fléchie', 'Fortement fléchie'],
      ['Chef long (épaule)', 'Généralement moins allongé', 'Davantage allongé']
    ]
  ),
  pCallout(
    'definition',
    'Complémentaires, pas rivaux',
    'Ce n’est pas simplement une question de « meilleur exercice ». Les deux variantes imposent des contraintes différentes. Si le coude est également fléchi en overhead, le muscle peut être placé dans une longueur particulièrement importante.'
  ),
  h3('Le chef long et l’épaule'),
  p(
    'Puisqu’il traverse l’épaule, le chef long possède également des fonctions au niveau de cette articulation. Il peut participer à l’extension et à l’adduction de l’épaule, en fonction de la position du bras. Cependant, son rôle dans ces mouvements est généralement moins important que celui de muscles comme le grand dorsal ou le grand rond. Il participe également à la stabilisation de l’articulation gléno-humérale. Sa position lui permet notamment de contribuer au contrôle de la tête humérale lorsque le bras est chargé. Le chef long n’est donc pas simplement un « muscle du coude ».'
  ),
  h3('Le triceps dans les pompes'),
  p(
    'Dans une pompe, le triceps produit une part importante de la force nécessaire à l’extension du coude. Plus les coudes doivent produire d’extension sous charge, plus sa contribution devient importante. La sollicitation dépend notamment de la largeur des mains, de la trajectoire des coudes, de l’inclinaison du corps, de l’amplitude, de la position des épaules et de la charge relative. Une pompe très inclinée et une pompe difficile au poids du corps ne placent donc pas le triceps dans les mêmes conditions.'
  ),
  h3('Le triceps dans les dips'),
  p(
    'Les dips constituent un mouvement particulièrement intéressant pour le triceps. Le corps descend avec les coudes en flexion, puis le triceps contribue fortement à la remontée en produisant l’extension du coude. Le mouvement implique cependant plusieurs articulations. Les pectoraux, les deltoïdes et d’autres muscles de l’épaule participent également à la production de force. Le triceps agit donc comme un moteur majeur de la phase de poussée, mais dans une chaîne musculaire complète.'
  ),
  h3('Le triceps dans les développés'),
  p(
    'Dans un développé couché, incliné ou au-dessus de la tête, le triceps intervient particulièrement lorsque le coude doit se redresser contre la résistance. Cela explique notamment pourquoi la force du triceps peut limiter la performance sur certains développés. Un pratiquant peut avoir des pectoraux suffisamment forts mais manquer de force dans la portion où le coude doit continuer à s’étendre. Le triceps constitue alors un maillon limitant de la chaîne.'
  ),
  h3('HSPU et mouvements au-dessus de la tête'),
  p(
    'Dans un handstand push-up, la contribution du triceps devient particulièrement évidente. Le mouvement demande de repousser le corps vers le haut en produisant une importante extension du coude. Le triceps travaille avec les deltoïdes, les pectoraux selon la trajectoire, les trapèzes, le dentelé antérieur et les muscles du tronc. La position overhead impose également des exigences importantes au contrôle de la scapula et de l’épaule. Le triceps doit donc produire de la force dans un contexte où toute la chaîne du membre supérieur doit rester stable.'
  ),
  h3('Planche et street workout'),
  p(
    'Dans la planche, les coudes sont maintenus en extension sous une charge importante. Le triceps contribue fortement à maintenir cette position. Mais il ne faut pas réduire la planche à un exercice de triceps. La difficulté provient de l’ensemble de la chaîne : mains, poignets, coudes, épaules, scapulas, tronc, bassin. Le triceps participe à la capacité à maintenir le coude verrouillé tandis que les épaules et la ceinture scapulaire produisent les forces nécessaires à la position. Même principe pour différents mouvements de street workout : un muscle peut être fortement sollicité sans être le seul responsable du mouvement.'
  ),
  h3('Muscle-up'),
  p(
    'Le triceps intervient surtout dans la phase de transition et de poussée du muscle-up. Pendant la traction, le grand dorsal, les muscles scapulaires et les fléchisseurs du coude jouent un rôle majeur. Une fois le corps passé au-dessus de la barre, le mouvement devient davantage une poussée. Le triceps contribue alors à l’extension du coude pour terminer le mouvement. Le muscle-up illustre donc parfaitement le changement de fonction au cours d’un même exercice : tirage → transition → poussée.'
  ),
  h3('Peut-on isoler les trois chefs ?'),
  p(
    'Pas complètement. Les trois chefs participent à l’extension du coude et travaillent ensemble. On peut cependant modifier les conditions mécaniques pour favoriser certaines contributions, notamment en changeant la position de l’épaule et du coude. Le chef long est particulièrement influencé par la position de l’épaule puisqu’il traverse cette articulation. Les chefs latéral et médial, qui ne traversent pas l’épaule, sont beaucoup moins concernés par ce changement. Il est donc plus juste de parler de biais mécanique que d’isolement absolu.'
  ),
  h3('Volume du bras'),
  p(
    'Le triceps joue un rôle majeur dans l’apparence générale du bras. Contrairement à une idée répandue, le biceps ne constitue pas la majorité de la masse du bras. Le triceps représente généralement la plus grande partie du volume musculaire du bras. Cela explique pourquoi son développement peut transformer fortement la silhouette, notamment vue de profil, vue arrière, lorsque le bras est relâché et lorsque le bras est contracté. Le développement du triceps ne consiste donc pas seulement à améliorer la force de poussée. Il contribue directement à la circonférence et à l’épaisseur visuelle du bras.'
  ),
  h3('Les trois chefs et l’esthétique'),
  p(
    'Le chef long contribue fortement à la masse de la partie interne/postérieure du bras. Le chef latéral contribue beaucoup à la largeur et au relief externe du triceps. Le chef médial, plus profond, participe à la masse globale et à la forme autour du coude. La forme visible dépend cependant aussi de la longueur des insertions, de la morphologie, de la masse musculaire, du taux de masse grasse, de la position du bras et de la génétique. Deux personnes avec la même masse de triceps peuvent donc avoir une forme visuelle différente.'
  ),
  h3('Triceps et stabilité du coude'),
  p(
    'Le triceps n’est pas uniquement un moteur. Il contribue également à la stabilité dynamique du coude pendant les mouvements chargés. Lorsqu’une force importante traverse l’articulation, le triceps participe au contrôle du mouvement et à la transmission des forces entre le bras et l’avant-bras. Cela devient particulièrement important dans les mouvements où le coude reste proche de l’extension sous une charge importante : planche, pompes, dips, développé, appuis en gymnastique.'
  ),
  h3('Innervation'),
  p(
    'Les trois chefs du triceps sont innervés par le nerf radial. Cette innervation est cohérente avec leur fonction commune d’extension du coude. Le nerf radial chemine notamment dans la région postérieure de l’humérus avant de poursuivre son trajet vers l’avant-bras. Cette proximité anatomique explique également pourquoi certaines atteintes du nerf radial peuvent affecter la capacité à étendre le coude.'
  ),
  h3('Vascularisation'),
  p(
    'Le triceps reçoit sa vascularisation principalement par des branches de l’artère profonde du bras et d’autres branches artérielles de la région. Cette vascularisation permet d’alimenter les trois chefs et leurs tissus pendant l’effort et la récupération.'
  ),
  callout(
    'À retenir',
    'Chef long → origine scapulaire + extension du coude + participation aux mouvements et à la stabilité de l’épaule.\nChef latéral → origine humérale + extension du coude.\nChef médial → origine humérale + extension du coude, portion profonde importante.\n\nBras près du corps → chef long généralement moins allongé au niveau de l’épaule.\nBras au-dessus de la tête → chef long davantage allongé au niveau de l’épaule.'
  ),
  takeaway(
    'Le triceps doit être compris non comme trois muscles séparés, mais comme un même système à trois chefs, avec une fonction commune d’extension du coude et une particularité majeure : le chef long possède en plus une relation directe avec l’épaule.'
  )
];
