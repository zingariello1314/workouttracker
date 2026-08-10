import { p, h3, ul, takeaway, pCallout, figure } from './blocks.js';

export default [
  p(
    'Le biceps brachial est un muscle situé dans la partie antérieure du bras. Son nom vient du latin bi- (« deux ») et caput (« tête ») : il possède deux chefs musculaires, le chef long et le chef court, qui ont des origines différentes avant de se réunir dans la partie distale du bras.'
  ),
  p(
    'Contrairement à ce que son nom et son apparence peuvent laisser penser, le biceps n’est pas uniquement un « muscle qui plie le bras ». Il agit principalement sur deux articulations, le coude et l’épaule. Il participe ainsi à la flexion du coude, à la supination de l’avant-bras — tourner la paume vers le haut — et, dans une moindre mesure, à certains mouvements de l’épaule.'
  ),
  p(
    'Son rôle dans la supination est particulièrement important. Le tendon distal du biceps s’insère sur la tubérosité du radius, et le tendon effectue une rotation d’environ 90° avant son insertion. Cette disposition donne au biceps un bras de levier favorable pour faire pivoter le radius et produire la supination. C’est notamment pour cela que le biceps peut être fortement sollicité lors d’un curl en prise supinée.'
  ),
  h3('Les deux chefs'),
  p(
    'Le chef long prend son origine au niveau du tubercule supraglénoïdal de la scapula, à proximité du labrum supérieur. Son tendon traverse ensuite l’articulation de l’épaule avant de cheminer dans la gouttière bicipitale de l’humérus.'
  ),
  p(
    'Le chef court prend son origine sur le processus coracoïde de la scapula, où il partage notamment une origine avec le coracobrachial. Il se situe davantage du côté médial du bras.'
  ),
  p(
    'Les deux chefs se rejoignent ensuite pour former le ventre musculaire du biceps. Distalement, leurs fibres se prolongent dans le tendon du biceps qui s’attache à la tubérosité radiale, ainsi que dans une expansion fibreuse appelée aponévrose bicipitale ou lacertus fibrosus, qui se prolonge dans le fascia de l’avant-bras.'
  ),
  h3('Ce qu’il fait réellement'),
  h3('1. Flexion du coude'),
  p(
    'Le biceps rapproche l’avant-bras du bras. Il participe fortement à la flexion du coude, mais il n’est pas le seul muscle responsable : le brachial est également un fléchisseur majeur du coude.'
  ),
  p(
    'La contribution du biceps varie selon la position de l’avant-bras. Sa capacité mécanique est particulièrement intéressante lorsque l’avant-bras est en supination.'
  ),
  h3('2. Supination'),
  p(
    'C’est l’une de ses fonctions les plus caractéristiques. Lorsque le coude est fléchi, le biceps peut exercer une forte action de supination en faisant tourner le radius autour de l’ulna. Le positionnement de son tendon sur la tubérosité radiale lui donne un avantage mécanique important pour cette rotation.'
  ),
  h3('3. Action sur l’épaule'),
  p(
    'Parce que ses deux chefs prennent naissance sur la scapula, le biceps traverse également l’articulation gléno-humérale. Il peut donc contribuer à la flexion de l’épaule. Le chef long possède également un rôle de stabilisation dynamique de l’épaule, notamment en participant au centrage de la tête humérale dans certaines positions.'
  ),
  h3('Biceps et mouvements sportifs'),
  p(
    'Le biceps intervient particulièrement dans les mouvements où il faut tirer, fléchir le coude ou supiner l’avant-bras.'
  ),
  p(
    'En musculation, les curls constituent les exercices les plus directs : curl classique, curl marteau, curl à la poulie, etc. Ils permettent de faire travailler le biceps avec relativement peu d’intervention des muscles du dos.'
  ),
  p(
    'En street workout, son rôle devient particulièrement intéressant lors des tractions. Une traction n’est cependant pas un « exercice de biceps » au sens strict : elle implique simultanément le grand dorsal, les muscles de la ceinture scapulaire, les fléchisseurs du coude et de nombreux muscles stabilisateurs.'
  ),
  p(
    'Les études sur les variantes de traction montrent d’ailleurs que le biceps est activé lors des différentes prises étudiées, avec une forte contribution pendant la phase concentrique. Il serait donc trop simpliste de considérer qu’une prise pronation « désactive » le biceps.'
  ),
  p(
    'La supination reste néanmoins particulièrement intéressante pour le biceps, puisque cette position correspond à l’une de ses fonctions fondamentales. Les mouvements de tirage en prise supinée, comme les tractions supination, permettent donc de combiner directement flexion du coude + supination.'
  ),
  h3('Pourquoi la position du bras change le travail du biceps ?'),
  p(
    'Le biceps est un muscle bi-articulaire : il traverse l’épaule et le coude. Cela signifie que sa longueur et sa capacité à produire de la force dépendent de la position des deux articulations.'
  ),
  p(
    'Lorsque l’épaule est placée derrière le corps, le biceps est davantage étiré au niveau proximal. À l’inverse, lorsque le bras est placé devant le corps, sa longueur change.'
  ),
  pCallout(
    'warning',
    'Nuancer',
    'Cela ne signifie pas automatiquement que « telle position fait travailler le chef long » ou « telle position isole le chef court » : les différences anatomiques sont réelles, mais il faut éviter de transformer ces différences en règles absolues d’exercices. La position de l’épaule modifie surtout la longueur musculaire, la relation longueur-tension et les contraintes mécaniques auxquelles le muscle est soumis.'
  ),
  h3('Biceps ≠ totalité du bras'),
  p(
    'Le biceps est visuellement emblématique, mais il ne constitue pas à lui seul le volume du bras. Le triceps brachial, situé à l’arrière du bras, possède trois chefs et représente une part majeure de sa masse musculaire. Le brachial, situé en profondeur du biceps, est également un fléchisseur important du coude.'
  ),
  p('Pour développer un bras complet, il faut donc considérer au minimum :'),
  ul([
    'Biceps brachial → flexion + supination',
    'Brachial → flexion du coude',
    'Brachioradial → flexion du coude, particulièrement autour de la position neutre',
    'Triceps brachial → extension du coude'
  ]),
  figure(
    'flechisseurs-prise-neutre.jpg',
    'Les prises neutres sollicitent aussi le biceps, mais la répartition change entre biceps, brachial et muscles de l’avant-bras — d’où l’intérêt de varier les prises, pas seulement les curls supinés.'
  ),
  takeaway(
    'Faire uniquement des curls ne revient pas à entraîner « tous les muscles qui plient le coude ».'
  )
];
