import { h3, p, ul, trajet, callout } from './blocks.js';

export default [
  p(
    'Muscle profond de la paroi antérieure du thorax — principalement impliqué dans le contrôle de la scapula et le mouvement de la ceinture scapulaire.'
  ),
  h3('Origine'),
  p(
    'Le petit pectoral prend naissance sur les faces antérieures des troisième, quatrième et cinquième côtes, généralement près de leurs cartilages costaux.'
  ),
  p(
    'Ses fibres se dirigent vers le haut, l’arrière et latéralement en direction de la scapula. Elles forment un petit muscle triangulaire dont la base est constituée par ses attaches costales et dont les fibres convergent vers une insertion beaucoup plus restreinte.'
  ),
  p(
    'Cette orientation est essentielle pour comprendre son rôle : contrairement au grand pectoral, dont les fibres se terminent sur l’humérus, le petit pectoral relie directement la cage thoracique à la scapula.'
  ),
  h3('Insertion'),
  p(
    'Le petit pectoral se termine sur le processus coracoïde de la scapula, plus précisément sur sa face médiale et supérieure.'
  ),
  p(
    'Le processus coracoïde est une saillie osseuse située sur la partie antérieure de la scapula. Il sert également de point d’attache à d’autres structures importantes, notamment le coracobrachial, le chef court du biceps brachial et plusieurs ligaments.'
  ),
  p(
    'Le petit pectoral constitue ainsi l’un des principaux liens musculaires entre la cage thoracique et la scapula sur sa face antérieure.'
  ),
  h3('Une ligne de traction qui explique sa fonction'),
  p('Son trajet peut être simplifié ainsi :'),
  trajet('3e–5e côtes → fibres ascendantes → processus coracoïde'),
  p(
    'Cette orientation permet au muscle de tirer la scapula vers l’avant et vers le bas lorsqu’elle est libre de bouger. Il participe également à sa rotation vers le bas et à sa stabilisation contre la cage thoracique.'
  ),
  p(
    'Autrement dit, son anatomie permet déjà de comprendre pourquoi le petit pectoral est principalement un muscle scapulaire, contrairement au grand pectoral qui agit directement sur l’humérus.'
  ),
  h3('Une relation particulière avec la cage thoracique'),
  p(
    'Le petit pectoral ne relie donc pas simplement « un os à un autre » : il relie une structure relativement mobile, la scapula, à une structure beaucoup plus rigide et volumineuse, la cage thoracique.'
  ),
  p(
    'Cela lui permet de participer au positionnement de la scapula par rapport au thorax.'
  ),
  p(
    'Cette relation devient particulièrement importante lorsque le bras se déplace : pour qu’un mouvement de l’humérus soit efficace, la scapula doit elle-même pouvoir se déplacer et se positionner correctement.'
  ),
  {
    type: 'callout',
    title: '🔬 Détail anatomique intéressant',
    text:
      'Le processus coracoïde n’est pas exclusivement le point d’insertion du petit pectoral. C’est une véritable zone de convergence anatomique où s’attachent plusieurs muscles et ligaments.\n\nLe petit pectoral partage notamment cette région avec le coracobrachial et le chef court du biceps brachial, tandis que plusieurs ligaments relient également le processus coracoïde à la clavicule et à l’acromion.\n\nCela fait du processus coracoïde une structure particulièrement importante dans la mécanique de la partie antérieure de l’épaule.'
  },
  {
    type: 'callout',
    title: '🧠 À retenir',
    text:
      'Origine : faces antérieures des 3e, 4e et 5e côtes, près des cartilages costaux.\nInsertion : processus coracoïde de la scapula.\nTrajet : fibres ascendantes vers la scapula.\nConséquence : agit principalement sur la position et le mouvement de la scapula plutôt que directement sur l’humérus.\n\nLe petit pectoral est donc littéralement un pont musculaire entre la cage thoracique et la scapula.'
  }
];
