import { p, h3, ul, callout, functionSynthèse } from './blocks.js';

export default [
  p(
    'Les érecteurs du rachis ont une fonction double : ils peuvent produire des mouvements du tronc, mais ils jouent également un rôle majeur dans le contrôle et la stabilisation du rachis. Cette seconde fonction devient particulièrement importante lorsque le tronc doit rester rigide sous charge.'
  ),
  h3('Extension du rachis'),
  p(
    'Lorsque les érecteurs droit et gauche se contractent ensemble, ils produisent principalement un moment d’extension du rachis. Ils participent ainsi au redressement du tronc à partir d’une position fléchie et au maintien d’une posture verticale.'
  ),
  p(
    'Cette fonction ne signifie cependant pas que leur rôle consiste toujours à faire bouger la colonne. Dans de nombreux mouvements de musculation, leur contribution à l’extension est surtout utilisée pour résister à une force qui tend à fléchir le tronc.'
  ),
  ul([
    'Extension active → les érecteurs contribuent à redresser le tronc.',
    'Résistance à la flexion → les érecteurs produisent une force d’extension pour empêcher le tronc de s’effondrer vers l’avant.'
  ]),
  p('Cette distinction est essentielle pour comprendre leur rôle dans les exercices de force.'),
  h3('Stabilisation du rachis'),
  p(
    'La stabilisation constitue souvent la fonction la plus importante des érecteurs lors des mouvements chargés. Lorsqu’une charge est placée devant le corps, elle crée un moment qui tend à faire fléchir le tronc. Les érecteurs doivent alors produire un moment opposé afin de maintenir la position du rachis.'
  ),
  p(
    'Ils peuvent ainsi travailler fortement sans que la colonne réalise une grande amplitude de mouvement. C’est notamment le cas lors d’un rowing buste penché, d’un squat ou d’un soulevé de terre : le mouvement principal se produit au niveau des hanches, des genoux ou des épaules, tandis que les érecteurs contribuent à maintenir le tronc dans une position contrôlée.'
  ),
  callout(
    '🔬 Recherche',
    'Des études biomécaniques montrent que l’activité des érecteurs augmente avec les contraintes imposées au tronc et qu’ils participent avec les muscles abdominaux et les autres extenseurs à la stabilité mécanique de la colonne. La coactivation des muscles fléchisseurs et extenseurs augmente notamment lorsque le tronc est soumis à une charge externe. (PubMed : 9346140)'
  ),
  h3('Le muscle qui travaille sans bouger'),
  p(
    'Un muscle peut produire une tension importante sans provoquer de mouvement visible. Dans le cas des érecteurs, une contraction isométrique peut suffire à maintenir le rachis dans une position donnée pendant qu’un autre segment du corps produit le mouvement.'
  ),
  ul([
    'Rowing buste penché — les bras déplacent la charge, le tronc reste incliné ; les érecteurs maintiennent une tension importante.',
    'Soulevé de terre — les hanches produisent le mouvement, les érecteurs maintiennent le tronc rigide et résistent aux forces de flexion.',
    'Squat — à mesure que la charge augmente, les extenseurs du tronc participent au maintien du torse.'
  ]),
  callout(
    '🔬 EMG',
    'Des mesures électromyographiques montrent une activation importante des érecteurs lors d’exercices comme le squat et le deadlift chargés. (PubMed : 18076231)'
  ),
  h3('Contrôle de la flexion'),
  p(
    'Les érecteurs ne servent pas uniquement à s’opposer à une flexion une fois que celle-ci est produite. Ils peuvent également contrôler la descente du tronc. Lorsqu’une personne se penche vers l’avant, la gravité tend à accélérer le mouvement vers la flexion. Les érecteurs peuvent alors produire une tension tout en s’allongeant : c’est une contraction excentrique. Ils jouent ainsi le rôle d’un frein musculaire.'
  ),
  p('Il faut donc distinguer :'),
  ul([
    'Concentrique → produire ou accompagner l’extension.',
    'Excentrique → contrôler la flexion.',
    'Isométrique → maintenir le rachis dans une position stable.'
  ]),
  p(
    'Le même groupe musculaire peut donc remplir trois fonctions mécaniques différentes au cours d’un seul mouvement.'
  ),
  h3('Inclinaison latérale'),
  p(
    'Lorsque les érecteurs d’un seul côté du rachis travaillent davantage que ceux du côté opposé, ils peuvent contribuer à l’inclinaison latérale du tronc. Une contraction relativement symétrique des deux côtés produit principalement une extension, tandis qu’une différence d’activité entre les deux côtés permet de générer un moment dans le plan frontal.'
  ),
  p(
    'Cette asymétrie devient particulièrement importante lorsqu’une charge n’est pas parfaitement centrée par rapport au corps. Des travaux sur le levage asymétrique montrent une relation entre la différence d’activité des érecteurs droit et gauche et les moments appliqués au tronc dans le plan frontal. (PubMed : 3571294)'
  ),
  h3('Une fonction qui dépend de la symétrie'),
  ul([
    'Travail bilatéral relativement symétrique — les deux côtés produisent ensemble un moment d’extension et participent au maintien du tronc.',
    'Travail asymétrique — un côté peut devoir produire davantage de force que l’autre afin de contrôler l’inclinaison du tronc et les forces générées par une charge décentrée.'
  ]),
  h3('Une fonction de stabilisation, pas seulement de mouvement'),
  p('Leur rôle réel est plus large que « extenseurs du dos » :'),
  ul([
    'Produire l’extension → redresser le tronc.',
    'Freiner la flexion → contrôler la descente et résister aux forces qui font partir le tronc vers l’avant.',
    'Stabiliser → maintenir une position du rachis pendant que les hanches ou les membres produisent le mouvement.',
    'Contrôler l’inclinaison latérale → équilibrer les forces lorsque les contraintes ne sont pas parfaitement symétriques.'
  ]),
  p('Leur fonction est donc autant anti-mouvement que motrice.'),
  functionSynthèse(
    'La meilleure façon de comprendre leur rôle est de ne pas demander uniquement « Est-ce que le dos bouge ? », mais plutôt « Quelle force cherche à faire bouger le rachis, et que doivent faire les érecteurs pour la contrôler ? »',
    'Les érecteurs du rachis peuvent étendre le rachis, freiner la flexion, stabiliser isométriquement le tronc sous charge et participer à l’inclinaison latérale lorsque leur activation devient asymétrique. C’est cette capacité à produire une force d’extension tout en maintenant la colonne stable qui explique leur importance dans les mouvements de force et les exercices impliquant un hip hinge.'
  )
];
