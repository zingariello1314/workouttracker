import { h3, p, ul, takeaway, callout, trajet } from './blocks.js';

export default [
  p(
    'L’oblique externe possède une large origine sur les dernières côtes et se prolonge progressivement vers le bassin et la ligne médiane de l’abdomen. La partie musculaire se situe principalement sur la région latérale du tronc, tandis qu’une importante portion de ses fibres devient progressivement aponévrotique en direction de la ligne médiane. Cette organisation permet de transmettre les forces entre les côtes, la colonne, le bassin et la paroi abdominale.'
  ),
  h3('Origines'),
  p(
    'Le muscle prend naissance sur les faces externes des côtes 5 à 12. Cette large origine costale lui permet d’agir sur une grande partie de la cage thoracique, et pas seulement sur un point localisé du flanc.'
  ),
  h3('Insertions'),
  p(
    'Il se termine sur la ligne blanche, le tubercule pubien et la partie antérieure de la crête iliaque, principalement par une large aponévrose. L’oblique externe n’est donc pas simplement une masse musculaire située sur le côté du ventre : il fait partie d’un réseau continu de tissus qui relie mécaniquement les différentes parties du tronc.'
  ),
  trajet('côtes 5 à 12 → fibres diagonales → ligne blanche, pubis et crête iliaque'),
  h3('Aponévrose, gaine du droit et ligament inguinal'),
  p(
    'Son aponévrose participe à la formation de la gaine du droit de l’abdomen et de la ligne blanche. Sa partie inférieure contribue également à la formation du ligament inguinal. Ces continuités fibreuses expliquent pourquoi une tension de l’oblique externe se transmet bien au-delà du flanc visible.'
  ),
  ul([
    'gaine du droit de l’abdomen',
    'ligne blanche',
    'ligament inguinal'
  ]),
  h3('Orientation des fibres'),
  p(
    'Les fibres descendent en diagonale depuis les côtes vers l’avant et le bas. Elles ne tirent donc pas simplement dans une direction verticale. Lorsqu’elles se contractent, elles peuvent générer des forces ayant plusieurs composantes : rotation, inclinaison latérale, compression du tronc, contrôle du bassin et de la cage thoracique.'
  ),
  p(
    'C’est cette architecture qui permet à un même muscle de participer à des mouvements apparemment différents. Un muscle n’a pas besoin d’avoir une seule fonction. Sa fonction dépend de son orientation, de ses attaches, de la position du corps et des forces auxquelles il doit répondre. L’orientation des fibres est souvent comparée à celle des mains placées dans les poches.'
  ),
  callout(
    'À retenir',
    'Large origine costale, insertion médiane et pelvienne via une aponévrose, fibres diagonales. L’oblique externe relie côtes, bassin et paroi abdominale — ce n’est pas un simple « muscle du flanc ».'
  ),
  takeaway(
    'L’orientation diagonale des fibres explique à la fois la rotation vers le côté opposé, l’inclinaison du même côté et la capacité à comprimer ou stabiliser le tronc.'
  )
];
