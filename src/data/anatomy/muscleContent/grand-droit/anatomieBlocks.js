import { h3, p, ul, takeaway, callout, trajet } from './blocks.js';

export default [
  p(
    'Le droit de l’abdomen s’étend verticalement entre le bassin et la partie inférieure de la cage thoracique. Ses fibres sont principalement orientées verticalement, ce qui lui permet de transmettre efficacement les forces entre le bassin et la cage thoracique et de participer à la flexion du tronc ainsi qu’au contrôle de la position du bassin.'
  ),
  h3('Attache inférieure'),
  p(
    'Le grand droit prend son origine sur la région pubienne. L’attache inférieure se situe sur la crête et la symphyse pubiennes. C’est depuis cette ancre basse que le muscle peut tirer le bassin vers le thorax, ou au contraire rapprocher le thorax du bassin selon ce qui est mobile.'
  ),
  h3('Attache supérieure'),
  p(
    'En haut, le muscle s’insère sur le processus xiphoïde du sternum et sur les cartilages costaux des 5e à 7e côtes. Cette insertion haute lui permet d’agir directement sur la partie inférieure de la cage thoracique lors de la flexion du tronc.'
  ),
  trajet('crête et symphyse pubiennes → fibres verticales → xiphoïde + cartilages costaux 5 à 7'),
  h3('Gaine du droit'),
  p(
    'Le muscle est entouré par une gaine fibreuse formée par les aponévroses des muscles oblique externe, oblique interne et transverse de l’abdomen. Cette gaine n’est pas un détail anatomique secondaire : elle relie le grand droit au reste de la paroi abdominale et participe à la transmission des forces autour du tronc.'
  ),
  ul([
    'aponévrose de l’oblique externe',
    'aponévrose de l’oblique interne',
    'aponévrose du transverse de l’abdomen'
  ]),
  h3('Ligne blanche'),
  p(
    'Le muscle est séparé en deux parties droite et gauche par la ligne blanche, une bande de tissu conjonctif située au milieu de l’abdomen. Les « tablettes » visibles de chaque côté n’appartiennent donc pas à des muscles différents : ce sont les deux moitiés du même grand droit, de part et d’autre de cette ligne médiane.'
  ),
  h3('Intersections tendineuses'),
  p(
    'Le grand droit présente également plusieurs intersections tendineuses qui traversent partiellement le muscle. Ce sont elles qui donnent au droit de l’abdomen son aspect segmenté en « tablettes » ou « six-pack ». Elles ne correspondent donc pas à plusieurs muscles indépendants : il s’agit d’un seul muscle présentant plusieurs subdivisions tendineuses visibles.'
  ),
  p(
    'Leur nombre, leur hauteur et leur symétrie varient d’une personne à l’autre. Ces caractéristiques morphologiques ne peuvent pas être transformées par l’entraînement.'
  ),
  callout(
    'À retenir',
    'Un seul muscle, deux côtés séparés par la ligne blanche, plusieurs intersections tendineuses qui créent l’apparence des tablettes. Les fibres verticales relient le pubis à la cage thoracique inférieure.'
  ),
  takeaway(
    'Le six-pack n’est pas une collection de petits muscles. C’est le relief d’un muscle unique, structuré par ses attaches, sa gaine et ses intersections tendineuses.'
  )
];
