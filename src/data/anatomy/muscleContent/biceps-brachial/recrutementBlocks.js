import { p, h3, ul, figure } from './blocks.js';

export default [
  p(
    'Le biceps se développe principalement lorsqu’il est soumis à une tension suffisante et progressive. Pour l’hypertrophie, l’objectif n’est donc pas de rechercher une sensation particulière ou de multiplier les exercices, mais d’accumuler des répétitions suffisamment stimulantes tout en augmentant progressivement la difficulté.'
  ),
  h3('1. Prioriser la tension mécanique'),
  p(
    'La charge doit être suffisamment importante pour que les dernières répétitions demandent un effort réel, tout en conservant une exécution contrôlée.'
  ),
  p(
    'Une série réalisée très loin de l’échec peut être stimulante, mais à mesure que l’on se rapproche de l’échec, davantage de fibres musculaires sont recrutées pour maintenir la production de force. Il n’est pas nécessaire d’aller systématiquement jusqu’à l’échec : terminer régulièrement ses séries avec environ 1 à 3 répétitions en réserve (RIR) constitue une stratégie pratique pour obtenir un stimulus important tout en limitant la fatigue inutile.'
  ),
  h3('2. Progresser dans le temps'),
  p('Le muscle s’adapte à la charge qui lui est imposée. Il faut donc progressivement augmenter la difficulté.'),
  p('La progression peut prendre plusieurs formes :'),
  ul([
    'Plus de répétitions → passer par exemple de 8 à 12 répétitions avec la même charge',
    'Plus de charge → augmenter la résistance lorsque la fourchette de répétitions est maîtrisée',
    'Plus de contrôle → réduire l’élan et améliorer la maîtrise du mouvement',
    'Plus d’amplitude → utiliser une amplitude confortable et contrôlée, notamment dans la partie où le muscle est davantage étiré',
    'Plus de difficulté mécanique → choisir une variante plus exigeante lorsque l’exercice actuel devient trop facile'
  ]),
  p('La progression ne signifie donc pas nécessairement « mettre toujours plus lourd ».'),
  h3('3. L’amplitude compte'),
  p(
    'Pour le biceps, il est intéressant de travailler sur une amplitude suffisamment grande pour entraîner le muscle à différentes longueurs, plutôt que de réaliser uniquement la moitié supérieure du mouvement.'
  ),
  p(
    'Dans un curl, cela signifie notamment ne pas transformer chaque répétition en simple mouvement de l’avant-bras autour du coude. La phase où le coude se rapproche de l’extension permet de travailler le biceps dans une position plus allongée.'
  ),
  p(
    'Certaines variantes placent en plus le bras derrière le corps. Le curl incliné, par exemple, augmente la longueur du biceps au niveau de l’épaule et permet de charger le muscle alors qu’il est davantage étiré.'
  ),
  p(
    'Cela ne signifie cependant pas que l’étirement maximal est systématiquement supérieur ou qu’il faut rechercher une amplitude douloureuse. L’amplitude doit rester contrôlée et adaptée à la mobilité de l’épaule et du coude.'
  ),
  h3('4. Varier les positions du bras'),
  p(
    'Le biceps étant un muscle bi-articulaire, la position de l’épaule modifie sa longueur et les contraintes auxquelles il est soumis.'
  ),
  ul([
    'Bras derrière le corps → biceps davantage allongé au niveau de l’épaule → exemple : curl incliné',
    'Bras proche du corps → position intermédiaire → exemple : curl classique',
    'Bras devant le corps → biceps davantage raccourci au niveau de l’épaule → exemple : curl pupitre'
  ]),
  p(
    'Cette variation peut être intéressante dans une programmation complète, mais il ne faut pas la présenter comme une méthode permettant d’isoler complètement le chef long ou le chef court.'
  ),
  h3('5. La supination est une particularité du biceps'),
  p(
    'Le biceps n’est pas seulement un fléchisseur du coude : c’est également un puissant supinateur de l’avant-bras. Les exercices en prise supinée permettent de solliciter simultanément flexion du coude + supination — curl supiné, tractions supination.'
  ),
  p(
    'Les prises neutres ou pronées restent utiles, mais elles modifient la contribution relative des différents fléchisseurs du coude et des muscles de l’avant-bras.'
  ),
  figure(
    'flexion-supination-pronation.jpg',
    'Enchaîner prise neutre puis supination pendant la flexion combine les rôles de fléchisseur et de supinateur — ce que le biceps fait naturellement, pas un « truc de curl ».'
  ),
  h3('6. Ne pas négliger le travail indirect'),
  p('Le biceps reçoit déjà une stimulation importante lors des exercices de tirage :'),
  ul([
    'tractions supination',
    'tractions pronation',
    'tractions neutres',
    'tirages horizontaux',
    'rowing'
  ]),
  p(
    'Il n’est donc pas toujours nécessaire d’ajouter un très grand nombre de curls. La quantité de travail direct doit être considérée en plus du volume indirect reçu pendant les mouvements de tirage.'
  ),
  figure(
    'flexion-coude-poulie.jpg',
    'Flexion du coude sous tension (poulie) : même logique que les curls ou les tirages — charger la flexion avec une trajectoire contrôlée.'
  ),
  h3('Les erreurs fréquentes'),
  h3('1. Utiliser trop lourd'),
  p(
    'Une charge excessive entraîne souvent une compensation par les hanches, le dos et les épaules. Le mouvement devient alors un balancement permettant de déplacer la charge plutôt qu’un exercice où le coude produit réellement le mouvement. Une charge plus légère permettant une amplitude complète et un mouvement contrôlé peut donc être plus productive qu’une charge supérieure déplacée avec élan.'
  ),
  h3('2. Transformer chaque répétition en demi-répétition'),
  p(
    'Le fait de déplacer une charge très lourde sur une petite amplitude ne garantit pas un meilleur stimulus. Une amplitude adaptée permet d’exposer le muscle à différentes longueurs et de mieux contrôler la progression.'
  ),
  h3('3. Négliger la phase excentrique'),
  p(
    'La descente n’est pas une période « vide » entre deux répétitions. Le biceps continue de produire de la force pendant la phase excentrique, lorsque le muscle s’allonge sous tension. Il est préférable de contrôler la descente plutôt que de laisser brutalement tomber la charge — sans ralentir artificiellement chaque répétition pendant 5 ou 10 secondes : l’essentiel est de contrôler la charge et de maintenir la tension.'
  ),
  h3('4. Chercher uniquement le « pic »'),
  p(
    'Le pic visible du biceps dépend fortement de la morphologie individuelle, notamment de la longueur du ventre musculaire et du tendon. Aucun exercice ne peut transformer radicalement une insertion musculaire ou créer une forme anatomique différente. L’objectif doit être de développer la masse musculaire globale du biceps, plutôt que de poursuivre une forme précise impossible à modifier.'
  ),
  h3('5. Multiplier les exercices sans progresser'),
  p(
    'Faire cinq variantes de curls dans une séance n’est pas nécessairement supérieur à deux exercices bien choisis et progressivement surchargés. Le facteur déterminant reste la capacité à produire et maintenir un stimulus suffisamment important au fil des semaines et des mois.'
  ),
  h3('En résumé'),
  p('Pour développer le biceps :'),
  p('Choisir des exercices efficaces → curls + mouvements de tirage.'),
  p('Utiliser une amplitude contrôlée → ne pas travailler uniquement dans la moitié facile du mouvement.'),
  p('Progresser progressivement → répétitions, charge, amplitude ou difficulté.'),
  p('Approcher suffisamment l’échec → généralement quelques répétitions en réserve.'),
  p('Exploiter différentes positions → bras derrière, proche ou devant le corps.'),
  p('Contrôler l’exécution → limiter l’élan et maîtriser la phase excentrique.'),
  p('Tenir compte du volume total → les tractions et autres tirages comptent déjà dans le travail du biceps.'),
  p('Le principe fondamental : le biceps progresse lorsque tu lui imposes, de manière répétée, un stimulus suffisant avec récupération et progression dans le temps.')
];
