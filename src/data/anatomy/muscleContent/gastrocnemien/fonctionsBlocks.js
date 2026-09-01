import { h3, p, ul, takeaway, callout, trajet } from './blocks.js';

export default [
  p(
    'Le sprint impose au mollet des contraintes extrêmement rapides. À chaque appui, le pied entre en contact avec le sol et le système gastrocnémien + soléaire + tendon d’Achille doit gérer une quantité importante de force en un temps très court. Le fonctionnement peut être simplifié comme celui d’un ressort biologique : contact au sol → mise en tension → stockage d’énergie élastique → restitution → propulsion.'
  ),
  h3('Le muscle et le tendon ne font pas le même travail'),
  p(
    'Le muscle produit activement de la force. Le tendon transmet cette force et peut se déformer élastiquement. Lors d’un mouvement rapide, le muscle peut rester relativement actif pendant que le tendon se charge puis restitue une partie de l’énergie accumulée. Les deux fonctionnent ensemble : muscle → production et contrôle de la force ; tendon → transmission, stockage temporaire et restitution d’énergie.'
  ),
  h3('Le mollet ne « rebondit » pas passivement'),
  p(
    'L’image du ressort est utile, mais trompeuse si on imagine un système entièrement passif. Le gastrocnémien et le soléaire sont activement contractés. Ils contrôlent la manière dont la cheville se déplace. Le tendon ne décide pas lui-même quand se charger. Le système nerveux active les muscles, les muscles produisent une tension, puis cette tension est transmise au tendon : activation musculaire → tension → déformation du tendon → restitution coordonnée. La performance vient de la coordination de l’ensemble.'
  ),
  h3('Cycle étirement-raccourcissement'),
  p(
    'Le muscle et le tendon sont soumis à une phase de mise en tension puis à une phase de restitution rapide. Plus le mouvement est rapide, plus la capacité à gérer cette transition devient importante. C’est également ce qui explique l’intérêt des exercices pliométriques pour développer certaines qualités de réactivité. Un tendon efficace permet de restituer une partie de l’énergie temporairement stockée, ce qui contribue à une meilleure économie mécanique de la course. Cela ne signifie pas qu’un tendon plus rigide est toujours meilleur. La performance dépend d’un compromis entre capacité à se déformer, vitesse de restitution, transmission de force, contrôle musculaire, coordination et caractéristiques individuelles.'
  ),
  h3('Pourquoi le sprint sollicite autant le tendon d’Achille'),
  p(
    'Le temps passé au sol lors d’un appui est extrêmement court. Le système muscle-tendon doit absorber rapidement une charge, résister, stocker, restituer, contribuer à la propulsion et stabiliser la cheville. Le tendon d’Achille transmet les forces du triceps sural tout en supportant des contraintes répétées et rapides. Cette capacité se développe progressivement. Passer brutalement à des sprints maximaux, des accélérations répétées, des sauts et de la pliométrie augmente fortement les contraintes. Le sprint n’est pas « mauvais pour les tendons » : la capacité du tendon doit être préparée à la contrainte demandée.'
  ),
  trajet('force contrôlée → force rapide → réactivité → sprint et pliométrie'),
  h3('Force lente et force rapide'),
  p(
    'Un mollet peut produire une force importante dans un mouvement lent sans être aussi performant dans un mouvement extrêmement rapide. C’est pourquoi un entraînement complet peut combiner calf raises contrôlés (force et masse) et sauts, rebonds, pogos, accélérations (qualités réactives et explosives). Les exercices explosifs doivent être introduits progressivement : ils imposent des contraintes beaucoup plus élevées que de simples élévations de mollets lentes. Le muscle peut parfois progresser plus rapidement que certaines structures tendineuses.'
  ),
  h3('Sprint et hypertrophie : deux objectifs différents'),
  p(
    'Développer la masse du gastrocnémien peut améliorer sa capacité à produire de la force. Mais avoir des mollets volumineux ne garantit pas d’être un bon sprinteur. Le sprint demande aussi force relative, puissance, vitesse de contraction, coordination, technique, capacité à appliquer rapidement une force au sol et utilisation efficace du cycle étirement-raccourcissement. L’hypertrophie peut constituer une base intéressante, mais elle ne remplace pas le travail spécifique de vitesse et de réactivité.'
  ),
  h3('Peut-on entraîner le tendon ?'),
  p(
    'Oui, mais pas de la même manière qu’un muscle. Le tendon s’adapte progressivement aux contraintes mécaniques. Les exercices de renforcement permettent d’augmenter progressivement la charge appliquée au système muscle-tendon. Pour préparer les qualités explosives, on peut ensuite introduire progressivement des mouvements plus rapides. Le terme « ressort » est une simplification pédagogique. Le tendon stocke et restitue de l’énergie, mais il existe des pertes sous forme de chaleur, et le muscle continue à produire et contrôler activement la force. Le système réel ressemble davantage à un ressort activement contrôlé par le muscle qu’à un ressort passif.'
  ),
  ul([
    'absorber les contraintes lors de l’appui',
    'maintenir le contrôle de la cheville',
    'participer à la propulsion',
    'améliorer l’efficacité mécanique du cycle de course',
    'soutenir les mouvements explosifs'
  ]),
  callout(
    'Principe clé',
    'Le muscle produit et contrôle la force ; le tendon permet notamment de la transmettre et de restituer efficacement une partie de l’énergie mécanique. Un bon sprint ne dépend pas simplement de « gros mollets » ou d’un tendon très élastique.'
  ),
  takeaway(
    'La performance vient de l’association entre force musculaire, puissance, propriétés du tendon, coordination et capacité à appliquer rapidement une force au sol. C’est cette coopération qui transforme le mollet en véritable système de propulsion et de restitution élastique.'
  )
];
