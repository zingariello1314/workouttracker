# Méthode des blocs — Roux : Blocs + CMLL + LSE

La méthode **Roux** est une méthode avancée de résolution du Rubik’s Cube 3×3 qui fonctionne très différemment de la méthode débutant et de CFOP. Alors que CFOP construit une croix puis résout les deux premières couches avec quatre paires F2L, Roux ne cherche pas à construire une croix. La méthode repose principalement sur la construction de deux grands blocs, suivie de la résolution des coins de la dernière couche avec CMLL, puis de la résolution finale des arêtes avec LSE.

Le nom « Roux » vient de son créateur, Gilles Roux. La philosophie générale de la méthode est de résoudre progressivement de gros ensembles de pièces tout en laissant volontairement certaines parties du cube libres afin de pouvoir les manipuler efficacement dans les étapes suivantes. Cette organisation donne à Roux une sensation très différente de CFOP : au lieu d'avoir l'impression de construire le cube couche par couche, on a davantage l'impression de construire deux « murs » ou deux blocs autour du cube, puis de terminer ce qui reste au milieu.

La méthode complète peut être résumée en quatre grandes phases : **premier bloc, second bloc, CMLL et LSE**. Les deux premières étapes construisent les structures principales du cube. CMLL signifie « Corners of the Last Layer », c'est-à-dire les coins de la dernière couche. Cette étape permet de résoudre simultanément les quatre coins de la dernière couche. Enfin, LSE signifie « Last Six Edges » : les six dernières arêtes sont alors résolues, en même temps que les centres supérieur et inférieur.

## Le principe fondamental de Roux

Pour comprendre Roux, il faut oublier une partie de la logique de CFOP. En CFOP, la Cross constitue une fondation complète sur une face et les quatre paires F2L remplissent ensuite les emplacements autour de cette croix. Roux ne cherche pas à obtenir une fondation circulaire complète. Il construit plutôt un bloc rectangulaire de pièces sur un côté du cube.

Le premier objectif est généralement de construire un bloc **1×2×3** sur le côté gauche du cube. Ce bloc est constitué de plusieurs pièces correctement assemblées autour du centre gauche. Il comprend essentiellement deux coins et les arêtes qui les relient, ainsi que les éléments nécessaires pour former une structure de trois pièces de profondeur.

Il est important de ne pas appeler ce bloc une « croix ». Une croix est une structure spécifique composée d'un centre et de quatre arêtes autour de lui. Le bloc Roux est complètement différent : il s'agit d'un volume de pièces assemblées en trois dimensions. Le but n'est donc pas de construire une forme symétrique autour d'un centre, mais de créer une structure solide de **1×2×3**.

Le choix du côté gauche est principalement conventionnel. La méthode peut être adaptée à différentes orientations, mais de nombreux tutoriels utilisent le côté gauche comme référence. Cela permet ensuite de réserver certaines tranches et certains mouvements pour les étapes suivantes.

## Premier bloc

La première grande étape consiste donc à construire le premier bloc 1×2×3, généralement sur la gauche. On commence par placer correctement les pièces qui formeront le bloc, puis on les assemble progressivement.

Cette étape est largement intuitive. Contrairement à une méthode qui demande immédiatement de mémoriser une longue liste d'algorithmes, le solveur Roux doit surtout apprendre à comprendre les relations entre les pièces. Il cherche les coins et les arêtes nécessaires, les rapproche et les insère dans le bloc sans détruire les éléments déjà construits.

La difficulté vient du fait qu'il faut penser en trois dimensions. Dans CFOP, le solveur apprend rapidement à reconnaître des paires coin-arête. Dans Roux, il doit apprendre à voir des groupes de plusieurs pièces qui peuvent être assemblés en une structure cohérente.

Une fois le premier bloc terminé, une partie importante du cube est résolue, mais la méthode laisse volontairement une grande quantité d'espace libre. Cette liberté est essentielle pour construire le second bloc.

## Second bloc

Après le premier bloc vient le second bloc. Il est généralement construit sur le côté opposé au premier. Si le premier bloc a été construit à gauche, le second sera donc construit à droite.

L'objectif est de créer un deuxième bloc 1×2×3 sans détruire le premier. Les deux blocs forment alors une sorte de structure composée de deux « murs » séparés par une zone centrale encore non résolue.

Cette étape demande une bonne compréhension des mouvements, car le solveur doit manipuler les pièces disponibles sans casser le bloc déjà construit. Il doit également éviter de remplir inutilement la zone centrale, puisque cette zone sera précisément utilisée plus tard lors de la dernière étape.

Lorsque les deux blocs sont terminés, une grande partie du cube est déjà résolue. Les quatre coins correspondant aux blocs sont en place, les structures latérales sont construites et il reste principalement les quatre coins de la dernière couche ainsi que les arêtes et les centres qui seront traités pendant les dernières étapes.

C'est une différence fondamentale avec CFOP. En CFOP, après le F2L, les deux premières couches sont complètement remplies. En Roux, une partie centrale reste volontairement vide. Cette zone n'est pas un oubli : elle constitue un espace de travail essentiel pour la suite.

## CMLL — Corners of the Last Layer

Une fois les deux blocs terminés, on passe au CMLL, qui signifie **Corners of the Last Layer**. Cette étape consiste à résoudre les quatre coins de la dernière couche.

Le grand avantage du CMLL est qu'il permet de traiter les quatre coins simultanément. Il ne s'agit donc pas seulement de les orienter comme dans une méthode débutant : l'objectif est de les orienter et de les permuter afin que les quatre coins soient complètement résolus.

Autrement dit, après un CMLL réussi, les quatre coins de la dernière couche sont dans leurs bonnes positions et dans leurs bonnes orientations.

Cela signifie que CMLL combine deux opérations qui sont séparées dans certaines autres méthodes. Dans la méthode débutant, on peut d'abord orienter les coins jaunes, puis les positionner. En Roux, un algorithme CMLL peut réaliser l'ensemble du travail en une seule séquence.

Il existe environ **42 cas CMLL** lorsqu'on utilise le système complet. Chaque cas correspond à une configuration particulière des quatre coins. Le solveur reconnaît le motif présent sur le cube et applique l'algorithme correspondant.

Cependant, comme pour OLL et PLL dans CFOP, il n'est pas nécessaire d'apprendre immédiatement les 42 algorithmes. Il est possible d'utiliser une approche appelée **2-look CMLL**, qui sépare le travail en plusieurs étapes et demande moins de mémoire.

Le CMLL constitue donc la principale partie algorithmique de Roux. Néanmoins, même avec le CMLL complet, Roux demande généralement moins de formules que le CFOP complet, qui nécessite 57 OLL et 21 PLL, soit 78 algorithmes rien que pour les deux dernières étapes.

## Une particularité importante de Roux : les blocs restent utiles

Un aspect intéressant de Roux est que les blocs construits au début restent généralement très importants pendant la résolution. Le solveur doit constamment faire attention à ne pas les détruire inutilement.

Cela développe une autre manière de regarder le cube. En CFOP, le solveur pense souvent en termes de Cross, de paires F2L et de dernière couche. En Roux, il pense davantage en termes de blocs, de pièces restantes et de mouvements permettant de préserver les structures déjà construites.

Cette façon de réfléchir peut demander un certain temps d'adaptation pour quelqu'un qui vient de CFOP. Le cube peut sembler moins « organisé » visuellement, alors qu'en réalité sa structure est volontairement organisée autour des deux blocs.

## LSE — Last Six Edges

Après le CMLL, les quatre coins de la dernière couche sont résolus. Il reste alors une configuration particulière dans laquelle les principales pièces encore non résolues sont les **six dernières arêtes**, ainsi que les centres supérieur et inférieur.

Cette dernière grande étape s'appelle **LSE**, pour « Last Six Edges ».

LSE est probablement l'étape qui donne à Roux sa sensation la plus particulière. Alors que CFOP repose énormément sur des algorithmes utilisant différentes faces du cube, LSE repose fortement sur les mouvements de la tranche centrale et sur les mouvements de la face U.

Le mouvement le plus caractéristique est donc **M**, qui signifie « Middle ». Contrairement à R, L, U, D, F et B, M ne représente pas une face extérieure du cube. Il représente la **tranche centrale située entre la face gauche et la face droite**.

Cette tranche est parallèle à la face L. Autrement dit, imagine que tu regardes le cube de face : M correspond à la colonne centrale qui traverse le cube. Elle peut être tournée indépendamment des faces extérieures.

La notation M possède également une convention de direction particulière. M est généralement défini comme tournant dans le même sens que L lorsque l'on regarde directement la face gauche. Cette convention peut sembler peu intuitive au début, mais elle devient rapidement naturelle avec la pratique.

Il faut donc éviter de considérer M comme une « septième face ». R, L, U, D, F et B représentent les six faces extérieures du cube. M représente une tranche interne.

## Pourquoi M est-il si important dans Roux ?

La grande force de M dans Roux vient du fait que les deux blocs construits au début laissent précisément une zone centrale disponible. Le solveur peut donc utiliser la tranche M comme une sorte de zone de travail pour déplacer les arêtes restantes sans détruire les deux blocs.

C'est l'une des raisons pour lesquelles Roux peut effectuer la fin de la résolution avec relativement peu de mouvements. Au lieu de déplacer les arêtes en utilisant constamment les faces extérieures, le solveur exploite directement la tranche centrale.

Les mouvements U et M deviennent ainsi extrêmement importants dans la dernière partie de la résolution. Une fois le fonctionnement de cette mécanique compris, LSE peut devenir une étape très fluide et rapide.

Il faut toutefois préciser qu'une démonstration 3D simplifiée ne représente pas toujours correctement cette étape. Si un moteur de cube ne permet que les rotations des six faces extérieures, il ne peut pas reproduire directement le mouvement M. Une démonstration peut alors utiliser des mouvements U, R ou L comme représentation simplifiée de certaines opérations. Cela peut illustrer la logique générale, mais ce n'est pas une reproduction exacte de la technique LSE utilisée en Roux.

## Les différentes phases de LSE

LSE peut elle-même être considérée comme une succession de sous-problèmes. Le solveur commence généralement par organiser les arêtes de manière à réduire progressivement le nombre de pièces à traiter.

Une partie importante du travail consiste à orienter correctement les arêtes. Une fois cette orientation obtenue, les arêtes peuvent être regroupées et permutées efficacement grâce aux mouvements U et M.

La fin de Roux demande donc une bonne compréhension des cycles d'arêtes. Au lieu de chercher une formule unique correspondant à chaque configuration, le solveur apprend progressivement comment ses mouvements affectent les six arêtes restantes.

Cette approche donne à LSE une sensation beaucoup plus « mécanique » et intuitive que certaines parties de CFOP. Avec suffisamment d'entraînement, le solveur peut apprendre à reconnaître rapidement les groupes d'arêtes et à effectuer les séquences nécessaires presque automatiquement.

## Roux et les rotations du cube

Une caractéristique souvent appréciée de Roux est la possibilité de réaliser de nombreuses opérations sans effectuer autant de rotations complètes du cube qu'en CFOP.

Les rotations peuvent être coûteuses parce qu'elles changent complètement le point de vue du solveur. Roux cherche davantage à conserver une orientation stable tout en exploitant les blocs et la tranche M.

Cela ne signifie pas que Roux n'utilise jamais de rotations. Elles existent et peuvent être utiles. Cependant, la philosophie générale de la méthode permet souvent de limiter leur utilisation.

Cette caractéristique est particulièrement intéressante pour le speedcubing, car elle permet au solveur de conserver une prise en main relativement stable du cube.

## Les sensations de Roux

Roux donne généralement une sensation très différente de CFOP. CFOP est fortement associé aux mouvements rapides des doigts, aux algorithmes F2L, OLL et PLL et aux enchaînements de mouvements sur les faces extérieures.

Roux possède une identité beaucoup plus marquée autour de la construction de blocs et des mouvements de la tranche M. Les pouces jouent également un rôle important dans certaines techniques de manipulation, notamment parce que M doit être effectué rapidement et de manière confortable.

Le solveur Roux apprend donc progressivement une gestuelle différente. Les mouvements de tranche deviennent naturels et peuvent être intégrés dans des séquences très rapides.

## Roux contre CFOP

La comparaison entre Roux et CFOP ne peut pas simplement se résumer à « l'une est meilleure que l'autre ». Les deux méthodes ont des philosophies différentes.

CFOP est extrêmement structurée : Cross, F2L, OLL puis PLL. Elle possède un très grand écosystème d'algorithmes et de ressources d'apprentissage. Son système F2L est particulièrement puissant et permet d'obtenir d'excellentes performances.

Roux repose davantage sur la construction intuitive de blocs, le CMLL et la résolution efficace des dernières arêtes avec LSE. La méthode peut nécessiter moins d'algorithmes en version complète et permet de limiter les rotations du cube, mais elle demande une autre manière de visualiser les pièces.

En termes de nombre de mouvements, une résolution Roux efficace se situe souvent autour de **45 à 50 mouvements**, même si le nombre réel varie selon le scramble, la solution choisie et le niveau du solveur. Le nombre de mouvements n'est cependant pas tout : l'ergonomie, la fluidité, le lookahead et la facilité d'exécution des mouvements jouent également un rôle majeur dans la vitesse finale.

## Roux et la mémoire

Un des avantages souvent cités de Roux est que le nombre d'algorithmes à apprendre peut être inférieur à celui du CFOP complet. Le CMLL complet représente environ 42 algorithmes, auxquels s'ajoutent les techniques et algorithmes nécessaires pour LSE.

Cependant, il serait faux de dire que Roux est simplement « CFOP avec moins de formules ». La difficulté est déplacée ailleurs. Roux demande notamment une bonne capacité à construire intuitivement les blocs, à visualiser les pièces restantes et à comprendre les cycles d'arêtes.

La charge mentale ne disparaît donc pas : elle change de forme. CFOP demande beaucoup de reconnaissance de cas et de mémorisation d'algorithmes, tandis que Roux demande davantage de compréhension spatiale et de contrôle des blocs.

## Roux résumé simplement

La logique de Roux peut finalement être résumée comme une construction en quatre temps.

On commence par construire un **premier bloc 1×2×3**, généralement sur la gauche. On construit ensuite un **second bloc 1×2×3** sur le côté opposé, sans détruire le premier. On obtient alors deux structures latérales et une zone centrale volontairement laissée libre.

On passe ensuite au **CMLL**, qui résout les quatre coins de la dernière couche en combinant leur orientation et leur permutation. En version complète, cette étape comporte environ 42 cas, mais une approche 2-look permet de réduire considérablement le nombre d'algorithmes à apprendre au début.

Enfin, on termine avec le **LSE**, qui signifie « Last Six Edges ». Les six dernières arêtes ainsi que les centres U et D sont résolus, principalement grâce aux mouvements U et M. C'est cette dernière phase qui donne à Roux une grande partie de son identité et explique pourquoi la compréhension de la tranche centrale est essentielle pour maîtriser la méthode.

La grande idée derrière Roux est donc de ne pas remplir le cube couche par couche, mais de construire deux structures solides qui permettent ensuite de résoudre efficacement le reste. Là où CFOP demande au solveur de penser en termes de croix, de paires et d'algorithmes de dernière couche, Roux l'amène à penser en termes de **blocs, de pièces restantes, de mouvements de tranche et de cycles**.

Roux est ainsi une méthode particulièrement intéressante pour quelqu'un qui souhaite aller au-delà de la simple résolution du Rubik's Cube et comprendre différentes philosophies de speedcubing. Elle montre qu'il n'existe pas une seule manière « correcte » de résoudre un cube : on peut construire des couches, des blocs ou utiliser d'autres structures, puis exploiter les propriétés mathématiques et mécaniques du puzzle pour parvenir au même résultat.

En résumé, **CFOP optimise la résolution par paires et algorithmes, tandis que Roux optimise la construction de blocs et l'utilisation de la tranche centrale**. Le premier bloc et le second bloc constituent la structure, CMLL termine les coins et LSE exploite la liberté laissée au centre pour terminer les dernières arêtes. C'est cette combinaison qui fait de Roux l'une des grandes méthodes modernes du speedcubing.
