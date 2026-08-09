import { h3, p, ul } from './blocks.js';

export default [
  p(
    'Muscle majeur de la paroi antérieure du thorax — composé principalement des portions claviculaire et sternocostale, avec une subdivision abdominale décrite selon les classifications anatomiques.'
  ),
  h3('Origines'),
  p(
    'Le grand pectoral possède une origine particulièrement étendue. Sa portion claviculaire prend principalement naissance sur la partie médiale de la clavicule. Sa portion sternocostale s’attache à la face antérieure du sternum et aux cartilages costaux supérieurs, tandis que les fibres les plus inférieures peuvent prendre origine au niveau de l’aponévrose du muscle oblique externe et de la région supérieure de la gaine du droit de l’abdomen.'
  ),
  p(
    'Cette origine très large n’est pas simplement une caractéristique anatomique : elle permet au muscle de produire des forces dont la direction varie selon les faisceaux recrutés.'
  ),
  p(
    'Les fibres supérieures et inférieures ne tirent donc pas exactement dans la même direction. Leur orientation par rapport à l’humérus explique en partie pourquoi la position du bras peut modifier la contribution relative des différentes régions du muscle.'
  ),
  h3('Une architecture en éventail'),
  p(
    'Le grand pectoral possède une architecture en éventail. Les fibres partent d’une large surface d’origine sur le thorax et la clavicule avant de se diriger vers une zone d’insertion beaucoup plus restreinte sur l’humérus.'
  ),
  p('Cette organisation permet au muscle d’agir sur le bras selon plusieurs directions.'),
  p('On peut ainsi simplifier son fonctionnement en imaginant plusieurs groupes de fibres :'),
  ul([
    'fibres claviculaires → orientation globalement descendante et latérale ;',
    'fibres sternocostales → orientation plus horizontale ;',
    'fibres inférieures / abdominales → orientation davantage ascendante vers leur insertion.'
  ]),
  p(
    'Ces directions ne sont pas parfaitement séparées et les frontières entre les régions ne constituent pas des cloisons anatomiques indépendantes.'
  ),
  h3('Insertion'),
  p(
    'Les fibres du grand pectoral convergent vers une insertion située sur la crête du tubercule majeur de l’humérus, également appelée lèvre latérale du sillon intertuberculaire.'
  ),
  p(
    'Mais la disposition des fibres au niveau de cette insertion est particulièrement intéressante : les faisceaux ne se contentent pas de converger directement vers un même point. Ils s’organisent en une large lame tendineuse et subissent une réorientation avant leur insertion.'
  ),
  p(
    'Cette organisation crée une relation particulière entre l’origine de chaque faisceau et sa position au niveau de l’humérus.'
  ),
  h3('Une insertion commune, mais des fonctions différentes'),
  p(
    'Le fait que les différentes portions du grand pectoral s’insèrent sur la même région de l’humérus ne signifie donc pas qu’elles produisent exactement le même mouvement.'
  ),
  p(
    'La direction de la force dépend de la ligne de traction entre l’origine et l’insertion de chaque faisceau.'
  ),
  p(
    'C’est fondamental pour comprendre pourquoi modifier la position du bras peut favoriser certaines régions du muscle. Lorsque l’humérus change de position, l’angle entre les fibres musculaires et le squelette change également. Certaines portions peuvent alors se retrouver dans une configuration plus favorable à la production de force que d’autres.'
  ),
  p(
    'C’est l’une des raisons pour lesquelles un développé horizontal, un développé incliné et un mouvement de rapprochement horizontal des bras ne sollicitent pas nécessairement les différentes régions du grand pectoral dans les mêmes proportions.'
  ),
  h3('Une particularité anatomique souvent ignorée : la torsion des fibres'),
  p(
    'L’organisation du tendon du grand pectoral est particulièrement intéressante.'
  ),
  p(
    'Les fibres provenant des différentes régions du muscle ne restent pas simplement parallèles jusqu’à leur insertion. Elles se croisent et se réorganisent au niveau de la partie distale du muscle.'
  ),
  p(
    'Cette architecture permet notamment aux différentes portions de conserver des lignes de traction distinctes malgré leur insertion commune.'
  ),
  p(
    'C’est aussi une des raisons pour lesquelles le grand pectoral ne doit pas être considéré comme une simple plaque musculaire uniforme.'
  ),
  p(
    'En pratique : deux régions appartenant au même muscle peuvent participer simultanément à un mouvement tout en produisant des forces dont la direction n’est pas exactement identique.'
  ),
  h3('Pourquoi cette anatomie est importante en musculation ?'),
  p(
    'L’anatomie du grand pectoral permet de comprendre un principe essentiel : on ne choisit pas un exercice parce qu’il « isole » une portion du pectoral, mais parce qu’il place certaines fibres dans une configuration mécanique plus favorable.'
  ),
  p('Lorsque tu modifies l’angle du banc, la trajectoire des bras ou la direction de la résistance, tu modifies la relation entre :'),
  ul(['origine → fibres → insertion → articulation de l’épaule.']),
  p(
    'Le muscle reste le même, mais les bras de levier et les lignes de force changent.'
  ),
  p(
    'C’est cette logique qui permet ensuite de comprendre pourquoi certains mouvements favorisent davantage la portion claviculaire tandis que d’autres sollicitent davantage les régions sternocostales.'
  ),
  {
    type: 'callout',
    title: 'Point anatomique intéressant',
    text:
      'Le grand pectoral n’est pas seulement un muscle « posé » sur les côtes. Il participe également à la paroi antérieure de l’aisselle. Son bord inférieur forme notamment le pli axillaire antérieur avec les tissus associés.\n\nCela explique pourquoi son développement modifie non seulement l’apparence de la poitrine, mais également une partie de la transition visuelle entre le thorax et le bras.'
  },
  {
    type: 'callout',
    title: 'À retenir',
    text:
      'Le grand pectoral possède trois caractéristiques particulièrement importantes pour comprendre son entraînement :\n\n1. Une origine très étendue → plusieurs directions de fibres.\n2. Une insertion humérale relativement restreinte → convergence des forces vers le bras.\n3. Une architecture régionale complexe → les différentes portions peuvent contribuer différemment selon la position de l’humérus.\n\nAnatomie → orientation des fibres → ligne de traction → fonction → choix de l’exercice.'
  }
];
