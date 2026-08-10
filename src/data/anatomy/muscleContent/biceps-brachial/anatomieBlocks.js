import { p, h3, ul, takeaway, pCallout, figureAt } from './blocks.js';

export default [
  p(
    'Le biceps brachial possède une insertion distale commune située sur le radius. Son tendon distal s’insère principalement sur la tubérosité radiale, une saillie osseuse située sur la partie proximale du radius, juste sous l’articulation du coude.'
  ),
  p(
    'Cette insertion est particulièrement importante pour comprendre la fonction de supination : lorsque le biceps se contracte, il exerce une traction sur le radius et contribue à faire tourner l’avant-bras de manière à orienter la paume vers le haut.'
  ),
  figureAt(
    'brachial',
    'planche-anatomie-bras.jpg',
    'Planche « Les bras » : couches musculaires et repères — le biceps (deux chefs) et le brachial sous-jacent, voisins du coude et de l’épaule.'
  ),
  p(
    'Le tendon se prolonge également par une expansion fibreuse appelée aponévrose bicipitale (lacertus fibrosus). Celle-ci s’étend depuis le tendon distal vers le fascia de l’avant-bras, participant à la transmission et à la répartition des forces produites par le biceps.'
  ),
  h3('Pourquoi cette insertion est-elle importante ?'),
  p(
    'L’insertion sur le radius distingue le biceps des autres grands fléchisseurs du coude. Le muscle ne s’attache pas simplement à un os de l’avant-bras : son tendon est fixé sur le radius, l’os qui tourne autour de l’ulna lors de la pronation et de la supination.'
  ),
  p('Cette disposition permet au biceps d’être à la fois :'),
  ul([
    'fléchisseur du coude → il rapproche l’avant-bras du bras',
    'supinateur puissant de l’avant-bras → il contribue à tourner la paume vers le haut, particulièrement lorsque le coude est fléchi',
    'acteur secondaire de l’épaule → grâce à ses origines sur la scapula, il peut participer à la flexion de l’épaule (selon la position du bras, pas directement lié à l’insertion distale)'
  ]),
  h3('À ne pas confondre'),
  p('L’origine du biceps se trouve sur la scapula, avec deux chefs distincts :'),
  ul(['Chef long → tubercule supraglénoïdal', 'Chef court → processus coracoïde']),
  p('Les deux chefs se réunissent ensuite et possèdent une insertion distale commune sur le radius.'),
  pCallout(
    'definition',
    'À retenir',
    'L’insertion sur le radius explique une grande partie de la particularité du biceps. Il ne se contente pas de fléchir le coude : grâce à son attache sur le radius, il peut également produire un couple important de supination.'
  )
];
