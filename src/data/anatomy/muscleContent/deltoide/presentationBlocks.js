import { p, h3, ul, takeaway, trajet, pCallout } from './blocks.js';

export default [
  p(
    'Le deltoïde est un muscle volumineux, triangulaire, qui recouvre la partie latérale de l’articulation gléno-humérale. Son nom vient de sa forme, qui rappelle la lettre grecque delta (Δ).'
  ),
  p(
    'Il constitue une grande partie du relief visible de l’épaule et joue un rôle majeur dans les mouvements du bras.'
  ),
  h3('Une seule structure, plusieurs faisceaux'),
  p('On décrit classiquement trois faisceaux :'),
  ul([
    'faisceau antérieur (claviculaire) ;',
    'faisceau moyen ou acromial ;',
    'faisceau postérieur ou spinal.'
  ]),
  p(
    'Il ne s’agit pas de trois muscles indépendants. Les trois faisceaux appartiennent au même deltoïde et partagent une insertion commune sur l’humérus.'
  ),
  p(
    'Cependant, leur origine et surtout l’orientation de leurs fibres diffèrent. Cette organisation permet au muscle de produire des forces différentes selon la position du bras.'
  ),
  p(
    'C’est pourquoi « travailler les épaules » avec un seul mouvement ne signifie pas nécessairement solliciter les trois faisceaux de manière identique.'
  ),
  h3('Un muscle principalement chargé de déplacer l’humérus'),
  p(
    'Contrairement au petit pectoral, qui agit principalement sur la scapula, le deltoïde agit directement sur l’humérus.'
  ),
  p('Ses différentes portions participent notamment à :'),
  ul([
    'faisceau antérieur → flexion et rotation médiale de l’épaule, avec une contribution à l’abduction ;',
    'faisceau moyen → abduction du bras ;',
    'faisceau postérieur → extension et rotation latérale de l’épaule, avec une contribution à l’abduction selon la position du bras.'
  ]),
  p(
    'Ces fonctions ne sont pas des interrupteurs « ON/OFF ». Plusieurs faisceaux peuvent être actifs simultanément et leur contribution change continuellement avec l’angle de l’épaule.'
  ),
  h3('Le faisceau moyen : le principal moteur de l’abduction'),
  p(
    'Le faisceau moyen est particulièrement important lors de l’abduction du bras, c’est-à-dire lorsque le bras s’éloigne latéralement du corps.'
  ),
  p(
    'C’est lui qui contribue fortement au mouvement recherché lors des élévations latérales.'
  ),
  p(
    'Cependant, le deltoïde ne travaille pas seul. La coiffe des rotateurs, notamment le supra-épineux, participe également à l’initiation et au contrôle du mouvement. Une fois le bras élevé, la scapula intervient elle aussi de manière importante.'
  ),
  p(
    'Cela signifie qu’une élévation latérale n’est pas simplement : deltoïde → bras vers le haut. C’est plutôt une coordination entre deltoïde + coiffe des rotateurs + scapula + muscles scapulaires.'
  ),
  h3('Pourquoi le deltoïde ne peut pas être compris sans la scapula'),
  p(
    'L’articulation gléno-humérale offre une très grande liberté de mouvement, mais cette mobilité nécessite une coordination avec la scapula.'
  ),
  p(
    'Lorsque le bras s’élève, l’humérus et la scapula se déplacent ensemble selon un phénomène appelé rythme scapulo-huméral.'
  ),
  p(
    'Le deltoïde produit une partie importante de la force nécessaire à l’élévation de l’humérus, tandis que la coiffe des rotateurs contribue notamment à maintenir et orienter la tête humérale dans la glène.'
  ),
  h3('Une particularité biomécanique importante'),
  p(
    'Le deltoïde possède un bras de levier qui varie selon l’angle du bras. Il n’est donc pas également efficace à toutes les positions.'
  ),
  p(
    'Lors d’une élévation latérale avec haltères, par exemple, la difficulté ressentie change considérablement au cours de la répétition. C’est une des raisons pour lesquelles une charge relativement légère peut devenir très difficile dans certaines portions du mouvement.'
  ),
  h3('Les trois faisceaux ne sont pas des muscles « à isoler »'),
  pCallout(
    'warning',
    'Simplifications courantes',
    '« développé militaire = deltoïde avant », « élévation latérale = deltoïde moyen », « oiseau = deltoïde arrière » — utile pour programmer, mais imperfect physiologiquement. Un exercice peut favoriser un faisceau sans désactiver les autres.'
  ),
  p(
    'Un mouvement de poussée au-dessus de la tête implique fortement le deltoïde antérieur, mais les autres portions peuvent également contribuer à la stabilisation et au mouvement. Inversement, une élévation latérale met davantage l’accent sur le faisceau moyen, mais ne transforme pas celui-ci en muscle isolé.'
  ),
  takeaway(
    'Antérieur → principalement flexion / rotation médiale. Moyen → principalement abduction. Postérieur → principalement extension / rotation latérale. Mais aucun faisceau ne fonctionne complètement seul.\n\nLa fonction réelle du deltoïde dépend toujours de la position de l’humérus, de la scapula, de la direction de la résistance et de l’action des muscles environnants.'
  )
];
