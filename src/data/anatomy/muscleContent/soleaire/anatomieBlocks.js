import { h3, p, takeaway, callout, trajet } from './blocks.js';

export default [
  p(
    'Le soléaire est un muscle large, épais et relativement plat. Il se situe immédiatement sous le gastrocnémien et s’étend sur la partie postérieure de la jambe. Ensemble, le soléaire et le gastrocnémien forment le triceps sural. Le gastrocnémien donne principalement la forme superficielle du mollet. Le soléaire constitue une masse plus profonde qui participe fortement à la production de force de flexion plantaire.'
  ),
  h3('Origines'),
  p(
    'Le soléaire possède plusieurs zones d’origine sur les os de la jambe. Il prend notamment son origine sur la partie supérieure de la face postérieure de la fibula, la partie supérieure de la face postérieure du tibia, et une arcade fibreuse située entre le tibia et la fibula, appelée arcade tendineuse du soléaire. Cette architecture lui permet de s’étendre largement sur la partie postérieure de la jambe. Son origine très large est cohérente avec son rôle important dans la production de force de flexion plantaire.'
  ),
  h3('Insertion'),
  p(
    'Les fibres convergent progressivement vers une large structure tendineuse. Cette structure rejoint le tendon du gastrocnémien pour former le tendon calcanéen, plus couramment appelé tendon d’Achille. Celui-ci s’insère sur la partie postérieure du calcanéum. Lorsque le soléaire se contracte, la tension produite est transmise par cette chaîne jusqu’au pied.'
  ),
  trajet('tibia + fibula → soléaire → tendon d’Achille → calcanéum → pied → sol'),
  h3('Une seule articulation : la grande différence avec le gastrocnémien'),
  p(
    'Le gastrocnémien traverse genou + cheville : il est biarticulaire. Le soléaire traverse la cheville uniquement : il est monoarticulaire. Cette différence modifie considérablement leur comportement. Le gastrocnémien change de longueur lorsque le genou bouge. Le soléaire, lui, ne change pas de longueur directement à cause de la position du genou.'
  ),
  callout(
    'À retenir',
    'Origine large sur tibia, fibula et arcade tendineuse. Insertion via le tendon d’Achille sur le calcanéum. Muscle monoarticulaire : seule la cheville change sa longueur.'
  ),
  takeaway(
    'Parce qu’il ne traverse pas le genou, fléchir cette articulation n’écourte pas le soléaire. C’est toute la logique du calf raise assis.'
  )
];
