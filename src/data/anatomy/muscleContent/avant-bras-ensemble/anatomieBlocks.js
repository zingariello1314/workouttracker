import { h3, p, ul, takeaway, callout, trajet } from './blocks.js';

export default [
  p(
    'L’avant-bras rassemble de nombreux muscles, mais certains groupes jouent un rôle particulièrement important dans la pratique sportive. Les plus importants à retenir ici sont les fléchisseurs des doigts, les fléchisseurs et extenseurs du poignet, ainsi que le brachio-radial.'
  ),
  h3('Fléchisseurs des doigts'),
  p(
    'Les fléchisseurs des doigts constituent une grande partie de la musculature située sur la face antérieure de l’avant-bras. On distingue notamment le fléchisseur superficiel des doigts et le fléchisseur profond des doigts. Leur fonction principale est de produire la flexion des doigts et donc de participer directement à la fermeture de la main.'
  ),
  p(
    'Le fléchisseur profond agit principalement sur les articulations interphalangiennes distales, tandis que le fléchisseur superficiel agit surtout sur les articulations interphalangiennes proximales. Cette organisation permet de produire une prise complexe dans laquelle plusieurs articulations des doigts travaillent simultanément.'
  ),
  p(
    'Lorsqu’une main serre une barre, les fléchisseurs des doigts doivent produire suffisamment de force pour empêcher les doigts de s’ouvrir sous l’effet de la charge. Dans une suspension, le poids du corps tire continuellement la main vers l’ouverture. Les fléchisseurs doivent donc maintenir la fermeture des doigts pendant toute la durée de l’effort. C’est l’une des raisons pour lesquelles la prise peut devenir le facteur limitant d’une traction.'
  ),
  p(
    'Les dorsaux et les muscles du bras peuvent encore être capables de produire de la force, mais si les doigts ne peuvent plus maintenir la barre, la série doit s’arrêter. La fatigue de la prise n’est donc pas simplement une fatigue « de la main ». Une partie importante du travail est réalisée par les muscles de l’avant-bras.'
  ),
  p(
    'Le fléchisseur superficiel des doigts se situe plus superficiellement et agit principalement sur les articulations proximales des doigts. Le fléchisseur profond se trouve plus profondément et possède des tendons qui se prolongent jusqu’aux phalanges distales. Ils fonctionnent ensemble dans de nombreuses prises. Il est donc inutile de chercher à attribuer chaque type de prise à un seul muscle : la préhension est une action coordonnée de plusieurs muscles de l’avant-bras et de la main.'
  ),
  ul([
    'tractions',
    'dead hangs',
    'rowing',
    'muscle-ups',
    'anneaux',
    'escalade',
    'port de charges'
  ]),
  h3('Fléchisseurs et extenseurs du poignet'),
  p(
    'Les muscles du poignet se répartissent principalement entre les faces antérieure et postérieure de l’avant-bras. Les fléchisseurs du poignet rapprochent la paume de la face antérieure de l’avant-bras. Les extenseurs du poignet produisent le mouvement inverse. Mais leur rôle ne se limite pas à faire bouger le poignet. Ils jouent surtout un rôle essentiel dans son contrôle et sa stabilisation pendant la production de force.'
  ),
  p(
    'Lorsqu’une personne tient une barre lourde, le poignet doit conserver une position suffisamment stable pour transmettre efficacement les forces entre la main et l’avant-bras. Les muscles fléchisseurs et extenseurs peuvent alors travailler simultanément. Ils ne cherchent pas forcément à produire un grand mouvement. Ils peuvent simplement créer les forces nécessaires pour maintenir l’articulation dans une position contrôlée. Un poignet qui reste stable permet à la force produite par le bras et l’avant-bras d’être transmise plus efficacement à la main et à la charge.'
  ),
  p(
    'Il serait trop simple de considérer les fléchisseurs comme les muscles « utiles » et les extenseurs comme leurs antagonistes. Les deux groupes participent au contrôle du poignet. Selon la tâche, ils peuvent travailler ensemble pour stabiliser l’articulation, tandis que leur contribution relative change en fonction de la position de la main, de la charge et du mouvement demandé.'
  ),
  p(
    'Cette capacité de stabilisation est importante pour la performance comme pour la tolérance aux charges répétées. Il n’existe cependant pas de ratio universel entre force des fléchisseurs et force des extenseurs qui garantirait l’absence de blessure. Les douleurs du coude ou du poignet dépendent de nombreux facteurs : charge totale, progression, technique, récupération, capacité du tissu à s’adapter et contexte individuel.'
  ),
  p(
    'L’objectif n’est donc pas simplement de « renforcer l’autre côté ». Il s’agit surtout de développer une musculature capable de contrôler les contraintes auxquelles elle est régulièrement exposée.'
  ),
  ul([
    'curls',
    'développés',
    'tractions',
    'rowing',
    'soulevés',
    'exercices aux anneaux'
  ]),
  h3('Brachio-radial'),
  p(
    'Le brachio-radial est un muscle particulier de l’avant-bras puisqu’il traverse le coude et participe principalement à sa flexion. Il est particulièrement actif lorsque l’avant-bras est proche de la position neutre. C’est notamment le cas lors du curl marteau.'
  ),
  p(
    'Il participe également au repositionnement de l’avant-bras entre pronation et supination. Visuellement, il peut former une partie importante du relief situé sur le côté externe de l’avant-bras, près du coude. Son rôle et sa biomécanique sont détaillés dans sa fiche dédiée.'
  ),
  trajet('humérus → coude → radius · flexion du coude en prise neutre'),
  callout(
    'À retenir',
    'Les muscles clés de l’avant-bras ne servent pas uniquement à « avoir de gros avant-bras ». Ils remplissent trois fonctions essentielles : fermer la main (fléchisseurs des doigts), contrôler le poignet (fléchisseurs + extenseurs), produire et contrôler la flexion du coude (brachio-radial).'
  ),
  takeaway(
    'Dans les exercices de tirage, les fléchisseurs des doigts peuvent devenir un véritable facteur limitant. Dans les exercices de force, les muscles du poignet assurent une partie essentielle de la stabilité nécessaire à la transmission des forces. Et le brachio-radial constitue un lien particulier entre l’avant-bras et le coude, avec une forte implication dans les mouvements de flexion en prise neutre.'
  )
];
