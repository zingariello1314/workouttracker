import { p, h3, ul, takeaway, pullquote, splitCards, callout } from './blocks.js';

export default [
  p(
    'Les multifides sont de petits muscles profonds situés de part et d’autre de la colonne vertébrale. Contrairement aux érecteurs du rachis, qui forment de longues colonnes capables de produire des forces importantes sur plusieurs régions du dos, les multifides sont organisés en faisceaux courts reliant différentes vertèbres.'
  ),
  p(
    'Cette architecture leur donne un rôle particulier dans le contrôle du rachis : ils participent à la stabilisation des segments vertébraux, au contrôle des petits mouvements entre les vertèbres et à la coordination du tronc pendant les mouvements plus importants. Ils constituent ainsi une sorte de système de réglage fin venant compléter l’action plus globale des muscles paravertébraux.'
  ),
  h3('Petits muscles, rôle important'),
  p(
    'Le multifide est souvent présenté comme un simple « muscle stabilisateur ». Cette description est correcte, mais elle ne montre pas ce qui le rend particulier. Sa principale caractéristique est son organisation segmentaire.'
  ),
  p(
    'Ses faisceaux ne parcourent pas toute la longueur du dos. Ils relient des structures situées à différents niveaux de la colonne, avec des fascicules qui peuvent franchir environ deux à quatre segments vertébraux selon leur profondeur et leur région. Les faisceaux les plus profonds sont particulièrement courts, tandis que les faisceaux plus superficiels couvrent davantage de niveaux.'
  ),
  p(
    'Cette disposition permet aux multifides d’agir sur les relations entre les vertèbres plutôt que de produire uniquement un mouvement global du tronc.'
  ),
  splitCards(
    [
      {
        tag: 'Érecteurs du rachis',
        text: 'Contrôle global — longues colonnes capables de produire des forces importantes sur le tronc.'
      },
      {
        tag: 'Multifides',
        text: 'Contrôle segmentaire — faisceaux courts agissant sur les relations entre vertèbres.'
      }
    ],
    'Cette opposition est utile pour comprendre leur complémentarité, même si, en réalité, les deux systèmes travaillent ensemble.'
  ),
  h3('Une architecture faite pour le contrôle segmentaire'),
  p(
    'Les multifides s’étendent depuis les processus transverses et les structures postérieures des vertèbres inférieures vers les processus épineux situés plus haut. Leur orientation est donc différente de celle d’un muscle superficiel qui traverserait une grande partie du dos.'
  ),
  p(
    'Chaque faisceau agit sur plusieurs segments, mais sur une distance relativement courte. Cette architecture leur permet de produire des forces qui influencent directement la position relative des vertèbres. Le muscle est particulièrement développé dans la région lombaire, où il constitue une composante importante de la musculature profonde du rachis.'
  ),
  h3('Stabiliser ne signifie pas immobiliser'),
  p(
    'Le terme « stabilisation » peut donner l’impression que les multifides doivent empêcher complètement la colonne de bouger. Ce n’est pas leur rôle. La colonne vertébrale doit pouvoir effectuer des mouvements de flexion, d’extension, de rotation et d’inclinaison. Les multifides participent plutôt au contrôle de ces mouvements, en contribuant à maintenir une relation cohérente entre les différents segments vertébraux.'
  ),
  splitCards([
    {
      tag: 'Immobilisation',
      text: 'Empêcher tout mouvement.'
    },
    {
      tag: 'Stabilisation',
      text: 'Permettre le mouvement tout en contrôlant les contraintes et la position des segments.'
    }
  ], 'Les multifides appartiennent clairement à la seconde catégorie.'),
  h3('Un système de réglage du rachis'),
  p(
    'Imagine une grande structure composée de plusieurs éléments articulés. Les érecteurs peuvent être comparés aux principaux câbles capables de contrôler l’ensemble de la structure, tandis que les multifides ressemblent davantage à de petits systèmes de réglage répartis entre ses différents éléments.'
  ),
  p(
    'Ils ne sont pas là pour produire toute la force nécessaire au mouvement. Ils contribuent plutôt à orienter, contrôler et stabiliser les mouvements entre les segments. Cette fonction est particulièrement intéressante lors des mouvements où le tronc doit transmettre des forces entre les membres supérieurs et inférieurs.'
  ),
  h3('Proprioception et contrôle du mouvement'),
  p(
    'Les multifides possèdent également une forte densité de fuseaux neuromusculaires, des récepteurs capables de détecter les changements de longueur du muscle. Ces informations participent à la proprioception et au contrôle neuromusculaire de la colonne.'
  ),
  p(
    'Le multifide n’est donc pas seulement un muscle qui « produit une force » : il participe également au système sensorimoteur qui permet de contrôler cette force.'
  ),
  h3('Extension et rotation : des fonctions secondaires mais réelles'),
  p(
    'Même si la stabilisation segmentaire est particulièrement importante pour comprendre les multifides, ils ne sont pas dépourvus de fonction motrice. Selon leur orientation et le côté qui se contracte, ils peuvent participer à l’extension du rachis et à certains mouvements de rotation et d’inclinaison.'
  ),
  p(
    'Il serait donc réducteur de les appeler uniquement « muscles stabilisateurs ». Ils sont à la fois capables de produire des forces et de contrôler les mouvements segmentaires.'
  ),
  h3('Multifides et érecteurs : deux niveaux de contrôle'),
  p(
    'Les érecteurs sont relativement longs et superficiels. Leur organisation leur donne un avantage mécanique pour produire des moments importants sur le rachis et maintenir le tronc contre des charges importantes. Les multifides sont plus courts, plus profonds et plus proches des articulations vertébrales. Leur architecture est davantage adaptée au contrôle des mouvements entre les segments.'
  ),
  splitCards(
    [
      { tag: 'Force globale', text: 'Érecteurs — production de force et maintien global du tronc.' },
      { tag: 'Contrôle segmentaire', text: 'Multifides — réglage fin entre les vertèbres.' }
    ],
    'C’est cette complémentarité qui permet au rachis de rester à la fois suffisamment stable et suffisamment mobile.'
  ),
  h3('Pendant un mouvement de force'),
  p(
    'Prenons un soulevé de terre. Les érecteurs doivent contribuer à maintenir le tronc contre la charge. Mais la colonne n’est pas une seule pièce rigide : elle est composée de plusieurs vertèbres articulées. Les multifides participent alors au contrôle des relations entre ces différents segments tandis que les muscles plus superficiels contribuent à la production de forces globales.'
  ),
  ul([
    'Hanches et jambes → production de force',
    'Érecteurs → maintien global du tronc',
    'Multifides → contrôle segmentaire',
    'Abdominaux et autres muscles du tronc → co-stabilisation'
  ]),
  p('Il serait donc incorrect de chercher à attribuer toute la stabilité du rachis à un seul muscle.'),
  h3('Le lien avec les lombalgies'),
  p(
    'Chez certaines personnes souffrant de lombalgie chronique, des modifications du multifide lombaire ont été observées, notamment une diminution de sa section transversale et des changements de composition musculaire. Une méta-analyse publiée en 2026 retrouve notamment des différences morphologiques du multifide chez des sportifs présentant une lombalgie chronique non spécifique.'
  ),
  p(
    'Des travaux antérieurs ont également décrit une inhibition ou une altération du fonctionnement du multifide associée à certains épisodes de lombalgie, avec la possibilité que des déficits persistent après la disparition de la douleur.'
  ),
  pullquote(
    'Attention à la simplification',
    '« Multifide faible = mal de dos » — la lombalgie est multifactorielle et les modifications du multifide ne permettent pas, à elles seules, d’expliquer toutes les douleurs lombaires.'
  ),
  h3('Pourquoi la récupération du contrôle peut compter'),
  p(
    'Lorsqu’un épisode douloureux modifie la manière dont une personne utilise son dos, le système moteur peut adapter sa stratégie de mouvement. Dans certains cas, le multifide peut présenter une diminution de son activation ou des changements structurels.'
  ),
  p(
    'C’est notamment pourquoi la rééducation moderne ne cherche pas uniquement à « renforcer les lombaires », mais peut également travailler la coordination, le contrôle moteur et la capacité du tronc à gérer progressivement différentes contraintes. Les exercices de contrôle moteur peuvent améliorer certains paramètres du multifide chez les personnes souffrant de lombalgie, mais ils ne constituent pas une solution universelle.'
  ),
  h3('Faut-il donc isoler les multifides ?'),
  p(
    'Pas nécessairement. Dans la plupart des mouvements du tronc, plusieurs muscles travaillent simultanément. L’objectif pertinent est plutôt de développer progressivement la capacité du système à contrôler le rachis sous différentes contraintes.'
  ),
  p(
    'Les exercices de gainage, les mouvements de portage, les hip hinges, les exercices unilatéraux et les mouvements de force contrôlés peuvent tous imposer des contraintes intéressantes au système de stabilisation du tronc, même s’ils ne constituent pas des exercices d’isolation du multifide.'
  ),
  h3('Une spécialisation dans la précision plutôt que dans la puissance'),
  p(
    'Un muscle n’est pas nécessairement important parce qu’il est capable de produire énormément de force. Certains muscles sont particulièrement utiles parce qu’ils peuvent produire la bonne quantité de force au bon moment et au bon endroit.'
  ),
  p(
    'Avec leurs faisceaux courts, leur proximité avec les articulations vertébrales et leur riche représentation proprioceptive, les multifides sont particulièrement adaptés à cette fonction de contrôle fin. Ils constituent une partie du système qui permet au rachis de rester stable sans devoir être complètement immobilisé.'
  ),
  takeaway(
    'Les multifides sont des muscles profonds organisés segment par segment le long de la colonne. Leur architecture courte et multisegmentaire leur permet de contribuer au contrôle des mouvements entre les vertèbres, à la stabilisation du rachis et à la proprioception.\n\nÉrecteurs du rachis → force et contrôle global.\nMultifides → contrôle segmentaire et stabilisation fine.\n\nEn cas de lombalgie, des modifications du multifide peuvent être observées chez certaines personnes, mais elles ne constituent ni une cause unique ni un diagnostic à elles seules. La stratégie pertinente est généralement plus large : renforcer progressivement le tronc, améliorer le contrôle du mouvement et réexposer progressivement le corps aux contraintes qu’il doit tolérer.'
  )
];
