import {
  p,
  h3,
  ul,
  takeaway,
  splitCards,
  callout,
  trajet,
  comparisonTable
} from './blocks.js';

export default [
  p(
    'L’avant-bras ne constitue pas un seul groupe musculaire homogène. Il rassemble plus d’une vingtaine de muscles, organisés autour de plusieurs fonctions : fléchir et étendre le poignet et les doigts, orienter la main en pronation ou en supination, et produire la force nécessaire à la préhension.'
  ),
  p(
    'Ils forment ainsi l’interface entre le coude et la main. Lorsqu’une personne tire sur une barre, tient des anneaux, serre une poignée ou porte une charge, la force ne s’arrête pas au niveau du biceps ou du dos. Elle doit être transmise jusqu’à l’objet.'
  ),
  trajet('épaule → bras → avant-bras → poignet → main → objet'),
  p(
    'L’avant-bras joue donc un rôle essentiel dans la transmission et le contrôle de cette force.'
  ),
  h3('Les grandes familles'),
  p(
    'On peut simplifier l’organisation de l’avant-bras en plusieurs groupes fonctionnels.'
  ),
  splitCards(
    [
      {
        tag: 'Fléchisseurs',
        text: 'Face antérieure, côté paume. Flexion du poignet et des doigts, fermeture de la main, maintien d’une prise.'
      },
      {
        tag: 'Extenseurs',
        text: 'Face postérieure, côté dos de la main. Extension du poignet et des doigts, et surtout stabilisation du poignet pendant la préhension.'
      }
    ],
    'Les deux groupes ne sont pas simplement opposés : ils travaillent souvent ensemble pour transmettre la force jusqu’à la main.'
  ),
  h3('Fléchisseurs du poignet et des doigts'),
  p(
    'Ils se situent principalement sur la face antérieure de l’avant-bras, du côté de la paume. Ils permettent notamment la flexion du poignet, la flexion des doigts, la fermeture de la main et le maintien d’une prise.'
  ),
  p(
    'Ils deviennent particulièrement importants lorsqu’il faut serrer et maintenir un objet. Tractions, dead hangs, rowing, escalade, port de charges ou travail aux anneaux sollicitent fortement cette chaîne.'
  ),
  h3('Extenseurs du poignet et des doigts'),
  p(
    'Ils se trouvent principalement sur la face postérieure de l’avant-bras, du côté du dos de la main. Ils permettent notamment l’extension du poignet, l’extension des doigts et la stabilisation du poignet pendant la préhension.'
  ),
  p(
    'Ils ne servent donc pas uniquement à « ouvrir la main ». Lorsqu’un objet est tenu fortement, les muscles fléchisseurs produisent une grande partie de la force de préhension tandis que les extenseurs participent à la stabilisation du poignet. Un poignet correctement stabilisé permet de transmettre plus efficacement la force entre l’avant-bras et la main.'
  ),
  h3('Pronation et supination'),
  p(
    'Certains muscles de l’avant-bras ne contrôlent pas directement les doigts ou le poignet. Ils permettent surtout de faire pivoter l’avant-bras.'
  ),
  p(
    'Pronation : la paume se tourne vers le bas. Elle implique notamment le pronateur rond et le pronateur carré.'
  ),
  p(
    'Supination : la paume se tourne vers le haut. Elle implique notamment le supinateur, avec une contribution importante du biceps brachial lorsque le coude est dans certaines positions.'
  ),
  p(
    'Ces mouvements sont essentiels dans les exercices où la prise change d’orientation. C’est notamment ce qui explique les différences mécaniques entre prise pronation, prise neutre et prise supination. La position de la main modifie la participation relative des muscles qui traversent le coude et l’avant-bras.'
  ),
  trajet('prise pronation → prise neutre → prise supination'),
  h3('La préhension'),
  p(
    'L’une des fonctions les plus importantes de l’avant-bras est la préhension. Fermer la main autour d’une barre nécessite la production de force par plusieurs muscles, principalement les fléchisseurs des doigts et du poignet.'
  ),
  p(
    'Mais une bonne prise ne dépend pas uniquement de la force de serrage. Il faut également contrôler la position du poignet, l’orientation de l’avant-bras, la position des doigts, la stabilité de la main et la transmission de la force vers le coude et l’épaule. La préhension est donc un véritable travail de coordination entre plusieurs structures.'
  ),
  h3('Pourquoi la prise peut limiter un exercice'),
  p(
    'Dans une traction, par exemple, les dorsaux et les muscles du bras peuvent encore être capables de produire de la force alors que la main commence déjà à fatiguer. Le problème devient alors : la chaîne musculaire pourrait continuer à tirer, mais la prise ne permet plus de maintenir correctement la barre.'
  ),
  p(
    'L’avant-bras devient le maillon limitant. C’est particulièrement fréquent dans les tractions longues, les dead hangs, les muscle-ups, les rowing, les soulevés, l’escalade et les exercices aux anneaux. Une faiblesse de la prise peut donc limiter indirectement la progression de muscles beaucoup plus volumineux.'
  ),
  h3('L’avant-bras ne fait pas que « serrer »'),
  p(
    'Il serait réducteur de considérer les muscles de l’avant-bras comme de simples muscles de grip. Ils contrôlent également le poignet et l’orientation de la main. Le poignet doit pouvoir rester stable tout en transmettant les forces produites par les muscles situés plus haut.'
  ),
  p(
    'Lors d’une traction, les doigts maintiennent la barre, le poignet stabilise la prise, l’avant-bras transmet la force, le coude et le bras participent, puis l’épaule et le dos produisent une grande partie de la force de traction. L’avant-bras constitue donc une partie importante de toute la chaîne.'
  ),
  trajet(
    'doigts → poignet → avant-bras → coude et bras → épaule et dos'
  ),
  h3('Pourquoi les avant-bras travaillent déjà beaucoup'),
  p(
    'Il n’est pas nécessaire de faire systématiquement des exercices d’isolation pour stimuler les avant-bras. Les exercices de tirage et de préhension les sollicitent déjà fortement.'
  ),
  splitCards(
    [
      {
        tag: 'Tractions',
        text: 'Forte demande de préhension, stabilisation du poignet et contrôle de l’avant-bras.'
      },
      {
        tag: 'Rowing',
        text: 'Même principe, avec une résistance importante à maintenir dans la main.'
      },
      {
        tag: 'Dead hang',
        text: 'La capacité de préhension devient directement le facteur central de l’exercice.'
      },
      {
        tag: 'Farmer walk',
        text: 'La main doit maintenir une charge pendant que le poignet et l’avant-bras stabilisent continuellement la position.'
      },
      {
        tag: 'Anneaux',
        text: 'La prise doit en plus s’adapter aux mouvements et à l’instabilité des anneaux.'
      }
    ],
    'Cela explique pourquoi les avant-bras peuvent se développer simplement grâce à un programme comportant beaucoup de tirages et de travail de préhension.'
  ),
  h3('Développement spécifique'),
  p(
    'Lorsque la préhension devient le facteur limitant, un travail spécifique peut être ajouté. Le choix dépend de ce que l’on cherche à améliorer. Ces qualités sont liées, mais elles ne sont pas exactement identiques.'
  ),
  ul([
    'dead hangs',
    'farmer walks',
    'holds statiques',
    'flexions et extensions du poignet',
    'travail de pronation / supination',
    'exercices de préhension'
  ]),
  splitCards(
    [
      {
        tag: 'Grip maximal',
        text: 'Capacité à produire beaucoup de force de serrage.'
      },
      {
        tag: 'Endurance de prise',
        text: 'Capacité à maintenir une prise longtemps.'
      },
      {
        tag: 'Stabilité du poignet',
        text: 'Capacité à maintenir une position sous charge.'
      },
      {
        tag: 'Pronation / supination',
        text: 'Capacité à contrôler l’orientation de l’avant-bras.'
      }
    ]
  ),
  h3('Les avant-bras et les exercices de tirage'),
  p(
    'La relation avec les muscles du dos et du bras est particulièrement importante. Dans une traction, les dorsaux peuvent produire une grande force, mais cette force n’est utile que si elle peut être transmise jusqu’à la barre. Une prise insuffisante peut alors devenir le facteur limitant.'
  ),
  p(
    'Cela crée une situation fréquente : dos suffisamment fort, bras suffisamment forts, prise insuffisante, série interrompue. Améliorer la préhension peut alors permettre de mieux exploiter la force déjà disponible dans le reste de la chaîne.'
  ),
  p(
    'Il ne faut cependant pas conclure que chaque pratiquant doit systématiquement entraîner davantage son grip. Si la prise n’est pas le facteur limitant, ajouter beaucoup de travail d’avant-bras peut simplement augmenter la fatigue sans apporter de bénéfice proportionnel.'
  ),
  h3('Une architecture fonctionnelle complexe'),
  p(
    'L’avant-bras rassemble donc plusieurs fonctions complémentaires. Cette organisation explique pourquoi deux personnes ayant une force de préhension similaire peuvent avoir des capacités différentes selon la tâche. Tenir une charge pendant dix secondes, effectuer vingt tractions ou manipuler une prise en escalade ne demandent pas exactement les mêmes qualités.'
  ),
  comparisonTable(
    ['Fonction', 'Principaux groupes'],
    [
      ['Flexion du poignet', 'Fléchisseurs'],
      ['Flexion des doigts', 'Fléchisseurs des doigts'],
      ['Extension du poignet', 'Extenseurs'],
      ['Extension des doigts', 'Extenseurs des doigts'],
      ['Pronation', 'Pronateurs'],
      ['Supination', 'Supinateur + biceps notamment'],
      ['Préhension', 'Principalement fléchisseurs des doigts + stabilisateurs'],
      ['Stabilisation du poignet', 'Fléchisseurs + extenseurs']
    ]
  ),
  h3('Le cas particulier du brachio-radial'),
  p(
    'Le brachio-radial mérite une fiche à part. Il appartient fonctionnellement à la région de l’avant-bras, mais son rôle est particulier puisqu’il traverse le coude et intervient principalement dans la flexion du coude, avec une efficacité importante lorsque l’avant-bras est en position neutre.'
  ),
  p(
    'Il participe également au repositionnement de l’avant-bras entre pronation et supination. Son fonctionnement et son implication dans les curls, les tractions et les prises neutres sont détaillés dans sa fiche dédiée. Il ne faut pas le confondre avec les principaux muscles responsables de la préhension et des mouvements du poignet.'
  ),
  callout(
    'Voir aussi',
    'Fiche Brachio-radial — jonction bras / avant-bras, flexion du coude et prise neutre.'
  ),
  takeaway(
    'Les muscles de l’avant-bras constituent une véritable interface mécanique entre le coude et la main : serrer, tenir, stabiliser, orienter et transmettre la force. Une prise faible peut limiter un mouvement alors même que les muscles situés plus haut disposent encore de réserves. Mais l’avant-bras ne se résume pas au grip : fléchisseurs, extenseurs, pronateurs, supinateurs, muscles de la main et stabilité du poignet. Le brachio-radial, lui, intervient surtout autour du coude et fait l’objet de sa propre fiche.'
  )
];
