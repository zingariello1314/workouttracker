import { p, h3, ul, callout } from './blocks.js';

export default [
  p(
    'Le biceps peut être atteint à différents endroits : au niveau du tendon proximal du chef long, dans le muscle lui-même, ou au niveau de son tendon distal, près du coude. Les mécanismes et les symptômes ne sont pas les mêmes.'
  ),
  h3('Tendinopathie du chef long'),
  p(
    'Le tendon du chef long du biceps traverse l’articulation de l’épaule et passe dans la gouttière bicipitale. Il constitue une source possible de douleur antérieure de l’épaule, mais cette douleur peut également être liée à d’autres structures de l’épaule. Une douleur à l’avant de l’épaule ne suffit donc pas à diagnostiquer une tendinopathie du biceps.'
  ),
  p(
    'La douleur peut être accentuée par les mouvements sollicitant le biceps, notamment ceux combinant flexion de l’épaule et supination de l’avant-bras. Une sensibilité localisée autour de la gouttière bicipitale peut également être retrouvée lors de l’examen clinique.'
  ),
  p(
    'La surcharge peut apparaître lorsque la quantité ou l’intensité de travail augmente plus rapidement que la capacité du tendon à s’adapter. Les tractions, curls et autres mouvements de tirage peuvent contribuer à la charge totale, mais il serait incorrect de considérer qu’un exercice particulier « provoque » automatiquement une tendinopathie.'
  ),
  p('Signes à surveiller :'),
  ul([
    'douleur persistante à l’avant de l’épaule',
    'douleur qui revient ou augmente pendant les curls ou les mouvements de tirage',
    'gêne lors de mouvements où le bras est levé',
    'sensibilité localisée autour du trajet du tendon'
  ]),
  p(
    'Une douleur persistante ou inhabituelle ne doit pas être interprétée automatiquement comme une blessure du biceps : plusieurs structures de l’épaule peuvent produire des symptômes similaires. Le diagnostic repose sur l’histoire clinique et l’examen, avec une imagerie parfois utilisée lorsque cela est nécessaire.'
  ),
  h3('Lésion ou rupture du biceps'),
  p(
    'Les ruptures peuvent toucher le chef long proximal ou, plus rarement, le tendon distal près du coude.'
  ),
  p(
    'La rupture distale est particulièrement associée à une contraction excentrique brutale : le biceps tente de retenir une charge alors que le coude est forcé vers l’extension. C’est le mécanisme classique décrit lors du soulèvement ou de la réception d’une charge importante.'
  ),
  p(
    'Elle peut survenir brutalement, avec une sensation de claquement (« pop »), une douleur aiguë au niveau du coude ou de l’avant-bras, puis l’apparition d’une faiblesse importante, notamment en supination. Une ecchymose et une modification de la forme du biceps peuvent également apparaître lors d’une rupture complète.'
  ),
  p(
    'Une rupture n’est donc pas simplement le résultat d’un manque d’échauffement ou d’une « mauvaise technique ». Elle résulte généralement d’une combinaison entre la charge imposée au tendon, la brutalité de la contrainte et l’état du tissu.'
  ),
  callout(
    'Mécanisme à connaître',
    'Charge lourde + biceps contracté + extension brutale du coude → forte contrainte excentrique → risque de lésion du tendon distal. Une charge qui devient incontrôlable sur un curl lourd ou lors d’un mouvement de tirage peut être beaucoup plus problématique qu’une répétition simplement difficile.',
    'warn'
  ),
  h3('Déchirures musculaires vs ruptures tendineuses'),
  p(
    'Une lésion musculaire peut concerner les fibres du ventre du biceps et apparaît généralement dans un contexte de contraction importante, d’étirement brutal ou de surcharge. Les ruptures tendineuses concernent le tissu qui relie le muscle à l’os et peuvent avoir des conséquences fonctionnelles beaucoup plus importantes, notamment lorsque le tendon distal du biceps est complètement rompu.'
  ),
  h3('Prévenir plutôt que simplement « s’échauffer »'),
  p('L’échauffement peut préparer progressivement le mouvement, mais il ne constitue pas une garantie contre les blessures. Les mesures les plus pertinentes :'),
  ul([
    'Progression progressive de la charge — éviter les augmentations brutales de volume ou d’intensité',
    'Technique maîtrisée — éviter de transformer systématiquement les curls lourds en mouvements de balancier',
    'Gestion du volume — curls + tractions + tirages s’additionnent',
    'Exposition progressive aux charges élevées',
    'Récupération suffisante'
  ]),
  h3('Quand consulter ?'),
  p(
    'Une douleur musculaire légère après l’entraînement n’est pas équivalente à une rupture. En revanche, une douleur brutale accompagnée d’un claquement, d’une déformation visible du biceps, d’un hématome important ou d’une perte soudaine de force — particulièrement pour la flexion du coude ou la supination — justifie une évaluation médicale rapide.'
  ),
  p(
    'À retenir : tendinopathie = capacité du tendon à tolérer la charge ; rupture = contrainte brutale, souvent excentrique. Aucune méthode ne supprime totalement le risque.'
  )
];
