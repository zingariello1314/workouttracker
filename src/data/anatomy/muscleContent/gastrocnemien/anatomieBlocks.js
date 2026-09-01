import { h3, p, takeaway, callout, trajet } from './blocks.js';

export default [
  p(
    'Le gastrocnémien possède une particularité fondamentale : il traverse deux articulations. Il est donc biarticulaire. Il agit à la fois sur le genou et la cheville. Cette caractéristique explique pourquoi la position du genou influence fortement sa capacité à produire de la force au niveau de la cheville. Les deux chefs descendent derrière le genou et se réunissent progressivement avec le soléaire dans le triceps sural.'
  ),
  h3('Chef médial'),
  p(
    'Le chef médial prend principalement son origine sur la partie médiale du condyle fémoral. Il forme la partie interne et souvent la plus visible du relief supérieur du mollet.'
  ),
  h3('Chef latéral'),
  p(
    'Le chef latéral prend principalement son origine sur la partie latérale du condyle fémoral. Il constitue la partie externe du gastrocnémien.'
  ),
  h3('Insertion : tendon d’Achille'),
  p(
    'Les fibres se prolongent dans une large structure tendineuse qui participe à la formation du tendon calcanéen, ou tendon d’Achille. Celui-ci se fixe sur le calcanéum, l’os du talon. Cette architecture permet au gastrocnémien de transmettre sa force jusqu’au pied.'
  ),
  trajet('fémur (condyles) → deux chefs → tendon d’Achille → calcanéum'),
  callout(
    'À retenir',
    'Muscle biarticulaire à deux chefs, originaire du fémur, inséré via le tendon d’Achille sur le calcanéum. Genou + cheville dans la même chaîne.'
  ),
  takeaway(
    'Parce qu’il traverse le genou, raccourcir cette articulation (genou fléchi) change sa longueur et sa capacité à produire de la force à la cheville. C’est toute la différence avec le soléaire.'
  )
];
