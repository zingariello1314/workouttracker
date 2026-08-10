import { h3, p, ul, figure } from './blocks.js';

export default [
  p(
    'Le petit pectoral est principalement un muscle de la scapula. Sa contraction modifie la position de l’omoplate par rapport à la cage thoracique et participe au contrôle de la ceinture scapulaire.'
  ),
  h3('Abaissement de la scapula'),
  p(
    'Lorsque la scapula est libre de se déplacer, le petit pectoral peut contribuer à son abaissement, c’est-à-dire à son déplacement vers le bas.'
  ),
  p(
    'Cette action doit cependant être comprise comme une contribution parmi d’autres : la position finale de la scapula résulte de l’action combinée de plusieurs muscles, notamment le trapèze, le dentelé antérieur et les rhomboïdes.'
  ),
  h3('Projection de la scapula vers l’avant'),
  p(
    'Le petit pectoral participe également à la protraction scapulaire, c’est-à-dire au déplacement de la scapula vers l’avant et autour de la cage thoracique.'
  ),
  p(
    'Cette fonction est particulièrement intéressante dans les mouvements où les bras se déplacent vers l’avant. Elle explique pourquoi le petit pectoral intervient dans la mécanique de mouvements tels que les pompes, même si son rôle ne se confond pas avec celui du grand pectoral.'
  ),
  figure(
    'pompes.jpg',
    'Pompe : le grand pectoral pousse l’humérus, tandis que la scapula doit protracter et rester stable — le petit pectoral participe à cette mécanique, avec le dentelé antérieur.'
  ),
  p(
    'Il faut toutefois éviter de lui attribuer seul la protraction : le dentelé antérieur est un acteur majeur de ce mouvement.'
  ),
  h3('Rotation vers le bas'),
  p('Le petit pectoral contribue également à la rotation vers le bas de la scapula.'),
  p(
    'Cette action correspond à une orientation dans laquelle la cavité glénoïde tend à s’orienter davantage vers le bas. Elle s’oppose fonctionnellement à la rotation vers le haut produite notamment par le couple formé par le trapèze et le dentelé antérieur.'
  ),
  p(
    'Cette distinction est importante : le petit pectoral ne doit donc pas être présenté comme un muscle qui « place correctement » la scapula dans toutes les situations. Certaines de ses actions sont nécessaires dans certains mouvements, tandis qu’elles peuvent être opposées à celles d’autres muscles selon la tâche réalisée.'
  ),
  h3('Stabilisation de la scapula'),
  p('Le petit pectoral participe également au contrôle de la scapula contre la cage thoracique.'),
  p(
    'Cependant, parler simplement de « stabilisateur » peut être trompeur. Stabiliser une articulation ne signifie pas empêcher tout mouvement. La scapula doit pouvoir se déplacer librement pendant l’élévation du bras, la poussée et les mouvements de traction.'
  ),
  p(
    'Le petit pectoral contribue donc davantage à contrôler la position et la trajectoire de la scapula qu’à la maintenir immobile.'
  ),
  h3('Une fonction différente lorsque la scapula est fixe'),
  p(
    'Comme beaucoup de muscles qui relient la cage thoracique à la ceinture scapulaire, le petit pectoral peut fonctionner selon deux configurations.'
  ),
  p(
    'Lorsque les côtes constituent le point relativement fixe, il agit principalement sur la scapula.'
  ),
  p(
    'Mais lorsque la scapula est stabilisée, sa contraction peut exercer une traction sur les 3e à 5e côtes. Il peut alors participer à leur élévation et contribuer à l’inspiration forcée, notamment lorsque la ventilation nécessite l’intervention de muscles accessoires.'
  ),
  p(
    'Cette fonction est beaucoup moins importante dans la respiration calme que son rôle dans la mécanique scapulaire.'
  ),
  {
    type: 'callout',
    title: '⚙️ Une notion importante : le point fixe',
    text:
      'Le petit pectoral permet d’illustrer un principe fondamental de la biomécanique musculaire : la fonction d’un muscle dépend de la structure qui peut réellement se déplacer.\n\nScapula relativement libre → le muscle exerce principalement une action sur la scapula.\nScapula stabilisée → sa contraction peut exercer une traction sur les côtes.\n\nLe muscle ne « change » donc pas de fonction anatomique : la même ligne de traction produit des effets différents selon le point fixe.'
  },
  {
    type: 'callout',
    title: '🔬 Petit pectoral ≠ muscle de « mauvaise posture »',
    text:
      'On entend parfois que le petit pectoral serait responsable des « épaules enroulées » et qu’il faudrait systématiquement l’étirer.\n\nC’est une simplification excessive.\n\nLe petit pectoral peut influencer la position de repos et les mouvements de la scapula, mais la posture de l’épaule dépend de nombreux facteurs : morphologie, cage thoracique, clavicule, mobilité, trapèze, dentelé antérieur, rhomboïdes et contrôle moteur.\n\nUn petit pectoral relativement raide ne signifie donc pas automatiquement qu’il existe un problème postural ou une source de douleur.'
  },
  {
    type: 'callout',
    title: '🧠 À retenir',
    text:
      'Le petit pectoral possède principalement trois grandes fonctions mécaniques :\n↓ Abaissement de la scapula\n→ Protraction de la scapula\n↘ Rotation vers le bas\n\nIl contribue également au contrôle de la scapula et peut participer à l’inspiration forcée lorsque celle-ci est stabilisée.\n\nSon importance vient moins de sa taille que de sa position : il relie directement les côtes à la scapula et influence donc la manière dont la ceinture scapulaire se déplace sur le thorax.'
  }
];
