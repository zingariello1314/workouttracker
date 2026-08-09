import {
  p,
  h3,
  ul,
  takeaway,
  trajet,
  comparisonTable,
  callout,
  pCallout
} from './blocks.js';

export default [
  p(
    'Le petit pectoral est situé sous le grand pectoral. Contrairement à ce dernier, il ne s’insère pas sur l’humérus : il relie directement la cage thoracique à la scapula, ce qui lui donne un rôle très différent dans la mécanique de l’épaule.'
  ),
  h3('Origine et insertion'),
  p(
    'Le petit pectoral prend principalement naissance sur les faces antérieures des troisième à cinquième côtes, près de leurs cartilages costaux.'
  ),
  p(
    'Ses fibres se dirigent en haut et en dehors pour s’insérer sur le processus coracoïde de la scapula, une saillie osseuse située sur la partie antérieure de l’omoplate.'
  ),
  p('Son trajet peut donc être résumé ainsi :'),
  trajet('côtes → petit pectoral → processus coracoïde → scapula'),
  p(
    'Cette organisation explique immédiatement sa fonction : contrairement au grand pectoral, il ne déplace pas directement l’humérus. Il agit principalement sur la scapula par rapport à la cage thoracique.'
  ),
  h3('Fonction : un muscle de la scapula'),
  p('Lorsque le petit pectoral se contracte, il peut notamment :'),
  ul([
    'tirer la scapula vers l’avant (protraction) ;',
    'contribuer à son abaissement ;',
    'participer à sa rotation vers le bas ;',
    'maintenir la scapula en relation avec la cage thoracique.'
  ]),
  p(
    'Il ne faut cependant pas considérer chacune de ces actions comme totalement indépendante : le mouvement réel de la scapula résulte de l’action combinée du petit pectoral, du trapèze, du dentelé antérieur, des rhomboïdes et d’autres muscles.'
  ),
  p(
    'C’est donc davantage un muscle de coordination de la ceinture scapulaire qu’un simple muscle chargé de produire un mouvement isolé.'
  ),
  h3('Un rôle important dans les mouvements du bras'),
  p(
    'Le petit pectoral ne lève pas directement le bras, mais la scapula doit se déplacer correctement pour permettre une grande amplitude de mouvement de l’humérus.'
  ),
  p(
    'Lorsque le bras s’élève au-dessus de la tête, la scapula participe au mouvement par un phénomène appelé rythme scapulo-huméral.'
  ),
  p(
    'Le petit pectoral fait donc partie du système musculaire qui contrôle cette relation entre scapula et cage thoracique.'
  ),
  p(
    'Cela explique pourquoi un muscle relativement petit et peu visible peut avoir une importance considérable pour la mécanique globale de l’épaule.'
  ),
  h3('Il ne faut pas le confondre avec le grand pectoral'),
  p('Les deux muscles portent un nom similaire mais ont des fonctions très différentes.'),
  comparisonTable([
    ['Position', 'Superficiel', 'Profond'],
    ['Origine principale', 'Clavicule, sternum, côtes', '3e–5e côtes'],
    ['Insertion', 'Humérus', 'Processus coracoïde'],
    ['Action principale', 'Mouvement de l’humérus', 'Mouvement de la scapula'],
    ['Fonction en musculation', 'Poussée / adduction horizontale', 'Contrôle de la ceinture scapulaire'],
    ['Importance esthétique', 'Très importante', 'Faible directement']
  ]),
  h3('Petit pectoral et respiration'),
  p(
    'Le petit pectoral peut également jouer un rôle de muscle inspiratoire accessoire lorsque la scapula est stabilisée.'
  ),
  p(
    'Dans cette configuration, au lieu de tirer la scapula vers les côtes, sa contraction peut exercer une traction sur les côtes et contribuer à leur élévation.'
  ),
  p(
    'Cette fonction devient surtout pertinente lorsque la respiration nécessite un effort supplémentaire. Ce n’est donc pas son rôle principal au repos.'
  ),
  h3('Pourquoi est-il important en musculation ?'),
  p(
    'Le petit pectoral intervient indirectement dans énormément de mouvements du haut du corps.'
  ),
  p(
    'Lors d’une pompe, d’un développé, d’un dip ou d’un mouvement au-dessus de la tête, la scapula doit pouvoir se positionner et se déplacer correctement.'
  ),
  p(
    'Le petit pectoral participe à cette mécanique, mais il ne faut pas en déduire qu’un petit pectoral « fort » garantit une épaule saine.'
  ),
  p(
    'Comme pour les autres muscles scapulaires, son fonctionnement doit être considéré avec celui du dentelé antérieur, du trapèze, des rhomboïdes et de la coiffe des rotateurs.'
  ),
  h3('Une particularité intéressante : position de la scapula'),
  p(
    'Comme il relie directement les côtes au processus coracoïde, le petit pectoral possède une ligne de traction qui peut influencer la position de la scapula.'
  ),
  p(
    'Un muscle raccourci ou présentant une raideur importante peut notamment limiter certains mouvements de la scapula chez certaines personnes.'
  ),
  pCallout(
    'warning',
    'Idée reçue à corriger',
    'Attention à ne pas transformer cela en règle simpliste du type : « petit pectoral raide = épaules en avant = mauvaise posture = douleur ». La position de la scapula est le résultat de l’interaction de nombreux muscles, de la morphologie, de la mobilité thoracique et de la tâche réalisée. Une position « en avant » n’est pas automatiquement pathologique.'
  ),
  callout(
    '🔬 Un muscle difficile à isoler',
    'Contrairement au grand pectoral, il n’existe pas vraiment d’exercice de musculation classique permettant d’entraîner le petit pectoral comme un muscle indépendant avec une grande précision.\n\nSon activité dépend fortement de la position et du mouvement de la scapula. Il est donc généralement plus pertinent de l’étudier dans le contexte de la mécanique scapulaire plutôt que de chercher à construire un programme spécifiquement destiné à « développer le petit pectoral ».'
  ),
  takeaway(
    'Le grand pectoral agit principalement sur l’humérus ; le petit pectoral agit principalement sur la scapula. Cette distinction est essentielle. Le grand pectoral explique une grande partie de la force et du volume de la poitrine, tandis que le petit pectoral participe davantage à la mécanique de la ceinture scapulaire.'
  )
];
