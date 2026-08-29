# Méthode ZZ — EOLine + blocs <R, U, L>

La méthode **ZZ** est une méthode avancée de résolution du Rubik’s Cube 3×3 qui se distingue principalement par une idée fondamentale : **orienter correctement les arêtes dès le début de la résolution afin de simplifier énormément les étapes suivantes**. Là où CFOP commence par construire une Cross et Roux par construire des blocs, ZZ commence par une étape appelée **EO**, pour « Edge Orientation », c’est-à-dire l’orientation des arêtes.

Cette caractéristique donne à ZZ une philosophie très particulière. Le solveur accepte de faire un travail plus complexe au début de la résolution afin de rendre le reste du cube beaucoup plus simple. Une fois l’orientation des arêtes terminée, certaines faces deviennent pratiquement interdites, car les utiliser pourrait détruire le travail effectué. En contrepartie, le solveur peut ensuite résoudre les deux premières couches avec un ensemble de mouvements beaucoup plus limité et très ergonomique.

La méthode ZZ est donc souvent résumée par la séquence **EO → EOLine → blocs → dernière couche**. La première partie consiste à orienter les arêtes. La deuxième ajoute le placement de deux arêtes spécifiques afin de former l’EOLine. Ensuite, les deux premières couches sont résolues avec une liberté de mouvements réduite, principalement autour de **R, U et L**. Enfin, la dernière couche peut être résolue avec des techniques classiques comme OLL et PLL, ou avec des méthodes beaucoup plus avancées comme ZBLL.

## L’idée fondamentale : Edge Orientation

Pour comprendre ZZ, il faut d’abord comprendre ce qu’est l’orientation d’une arête. Une arête du Rubik’s Cube possède deux couleurs, mais selon sa position et son orientation, elle peut être considérée comme correctement ou incorrectement orientée selon les conventions utilisées par ZZ.

L’objectif de l’EO est de faire en sorte que **toutes les arêtes du cube soient orientées de manière compatible avec la suite de la résolution**. Cela ne signifie pas que les arêtes sont déjà à leur bonne place. Elles peuvent être complètement mélangées. Ce qui compte à ce moment-là est uniquement leur orientation.

Cette distinction entre orientation et position est fondamentale. Une pièce peut être au mauvais endroit mais correctement orientée. À l’inverse, elle peut se trouver au bon endroit mais être retournée. ZZ commence volontairement par régler le premier problème : l’orientation des arêtes.

Une manière intuitive de comprendre cette orientation est de regarder les arêtes qui se trouvent sur les faces avant et arrière. Dans les conventions classiques de ZZ, certaines arêtes peuvent être considérées comme mal orientées lorsqu'elles nécessiteraient l'utilisation d'un mouvement F ou B pour être correctement manipulées dans la structure prévue par la méthode.

L’objectif est donc de transformer le cube afin que toutes les arêtes puissent ensuite être manipulées sans avoir besoin d’utiliser directement les faces F et B. Cette contrainte est au cœur de la méthode.

## Pourquoi éviter F et B après l'EO ?

Après avoir terminé l’EO, les arêtes sont orientées de manière particulière. À partir de ce moment-là, les mouvements F et B deviennent problématiques, car ils peuvent modifier l’orientation des arêtes et détruire le travail réalisé pendant l’EO.

C’est pourquoi ZZ impose une restriction très intéressante : **une fois l’EO terminée, on évite les mouvements F et B**.

Le solveur travaille alors principalement avec les mouvements des faces **R, U et L**, auxquels peuvent évidemment s'ajouter leurs variantes comme R’, U’, L’, R2, U2 et L2.

C’est de là que vient l’expression **<R, U, L>**. Elle signifie que la résolution de cette partie du cube est construite principalement avec les mouvements appartenant à cet ensemble.

Cette restriction peut sembler être un handicap. Après tout, pourquoi volontairement s’interdire deux faces entières du cube ? La réponse est que le travail supplémentaire effectué au début permet précisément de rendre cette restriction possible. En échange de l’EO, le solveur obtient une résolution beaucoup plus contrôlée et souvent très ergonomique.

C’est l’une des idées les plus élégantes de ZZ : **on rend le début plus difficile pour rendre la suite plus facile**.

## EOLine

L’étape suivante est appelée **EOLine**. Le nom combine « EO » et « Line ».

L’EO signifie que les arêtes sont correctement orientées. La « Line » ajoute le placement de deux arêtes particulières : les arêtes **DF** et **DB**, c’est-à-dire les arêtes situées à l’avant et à l’arrière de la face du dessous.

L’objectif est donc d'obtenir simultanément une orientation correcte de toutes les arêtes et une ligne formée par les deux arêtes centrales correspondantes.

Cette ligne sert de fondation pour la suite de la résolution. Une fois l’EOLine terminée, les arêtes sont orientées correctement et les deux arêtes de référence sont placées. Le solveur peut alors passer à la construction des deux premières couches avec beaucoup moins de contraintes.

EOLine est souvent considérée comme la partie la plus difficile à apprendre de ZZ. Avec CFOP, la Cross est relativement facile à reconnaître et à planifier. Avec ZZ, le solveur doit non seulement trouver deux arêtes spécifiques, mais également tenir compte de l’orientation de l’ensemble des arêtes.

Il doit donc simultanément réfléchir à plusieurs informations : où se trouvent les arêtes, dans quelle orientation elles se trouvent, quels mouvements vont les déplacer, et comment construire progressivement la ligne sans détruire l’orientation déjà obtenue.

Cela explique pourquoi la première étape de ZZ peut sembler beaucoup plus difficile que la Cross de CFOP.

## EOLine pendant l'inspection

Comme pour la Cross en CFOP, un solveur ZZ expérimenté cherche à préparer son EOLine pendant le temps d’inspection.

Le but est d’observer le cube avant de commencer officiellement la résolution et de déterminer une séquence de mouvements permettant de réaliser l’EO et la Line de manière efficace.

La difficulté supplémentaire vient du fait que l’EO concerne potentiellement toutes les arêtes du cube. Le solveur ne peut donc pas simplement regarder quatre pièces autour d’un centre comme dans une Cross classique. Il doit analyser beaucoup plus d’informations visuelles.

Avec l’expérience, cette reconnaissance devient progressivement plus rapide. Le solveur apprend à repérer les arêtes mal orientées presque immédiatement et à construire mentalement une séquence qui permet de les corriger tout en positionnant DF et DB.

Une EOLine bien planifiée peut donc être réalisée très efficacement, mais elle demande généralement beaucoup plus de pratique de reconnaissance que la Cross classique.

## Les blocs après EOLine

Une fois l’EOLine terminée, ZZ change complètement de sensation.

Le solveur peut alors résoudre les deux premières couches avec un ensemble de mouvements beaucoup plus limité. Les faces F et B sont généralement évitées, tandis que R, U et L deviennent les principaux outils de construction.

Cette contrainte donne une structure très particulière à la résolution. Le solveur peut construire les pièces des deux premières couches avec une grande régularité, sans avoir constamment besoin de tourner le cube pour accéder à une nouvelle face.

La construction ressemble à certains aspects du F2L de CFOP, mais elle est différente dans sa logique. On peut toujours associer des coins et des arêtes, mais l’absence de F et B modifie complètement les possibilités de manipulation.

L’un des grands avantages de cette restriction est la réduction des rotations du cube. Le solveur peut souvent conserver la même orientation générale pendant une grande partie de la résolution.

## Un F2L sans rotations

Après l’EOLine, les deux blocs restants peuvent être comparés à une forme de F2L, mais avec une différence essentielle : le solveur travaille dans un espace de mouvements beaucoup plus restreint.

Dans CFOP, il est courant de tourner le cube pour mettre une paire F2L dans une position plus confortable. Dans ZZ, l’objectif est justement de pouvoir résoudre les paires sans avoir constamment besoin de changer l’orientation du cube.

Cela peut donner une sensation particulièrement fluide. Les doigts travaillent principalement autour de R, U et L, et les séquences peuvent être enchaînées avec relativement peu de mouvements parasites.

Cette ergonomie constitue l’un des principaux arguments en faveur de ZZ. Une fois l’EOLine réalisée, le solveur peut avoir l’impression que le cube est devenu beaucoup plus « prévisible ».

## Le coût de cette simplicité

Cependant, il faut garder à l’esprit que cette facilité arrive après un investissement important au début.

En CFOP, la Cross est généralement relativement simple à construire et le solveur dispose ensuite d’une grande liberté de mouvements pendant le F2L. En ZZ, cette liberté est volontairement sacrifiée après l’EO.

On peut donc considérer qu’il existe un échange : **ZZ paie un coût cognitif important au début afin d’obtenir une résolution plus contrainte et plus ergonomique ensuite**.

C’est pour cela que ZZ peut sembler difficile lors des premières séances. Le début est inhabituel, l’EO demande une nouvelle manière de regarder les arêtes et le solveur doit apprendre à raisonner avec une contrainte qu’il n’avait pas dans la méthode débutant ou CFOP.

Mais une fois cette phase maîtrisée, la résolution peut devenir extrêmement fluide.

## La dernière couche

Une fois les deux premières couches terminées, ZZ arrive à sa dernière couche.

À ce moment-là, plusieurs possibilités existent. Une approche relativement classique consiste à utiliser des techniques similaires à CFOP, notamment **OLL puis PLL**.

On peut donc terminer l’orientation de la dernière couche avec OLL, puis utiliser PLL pour permuter les pièces restantes.

Cette approche permet de combiner le début spécifique de ZZ avec des algorithmes déjà connus des utilisateurs de CFOP. Un solveur qui connaît déjà OLL et PLL peut ainsi réutiliser une grande partie de ses connaissances.

Cependant, ZZ possède également une possibilité beaucoup plus avancée appelée **ZBLL**.

## ZBLL

ZBLL signifie **Zborowski-Bruchem Last Layer**. Il s’agit d’une technique permettant, dans certaines conditions, de résoudre la dernière couche en **un seul algorithme** après avoir correctement préparé son orientation.

L'idée est particulièrement puissante : au lieu de faire OLL puis PLL séparément, le solveur reconnaît directement le cas complet de la dernière couche et applique un algorithme qui réalise simultanément l'orientation et la permutation.

Le système complet de ZBLL représente environ **493 cas**, ce qui est considérablement plus lourd à mémoriser que les 57 OLL et 21 PLL du CFOP complet.

Pour cette raison, ZBLL n'est absolument pas nécessaire pour apprendre ZZ. Il s'agit d'une spécialisation avancée destinée aux solveurs qui souhaitent pousser très loin l'optimisation de la méthode.

Il est donc parfaitement possible de pratiquer ZZ avec une dernière couche classique. Le ZBLL doit être considéré comme une option avancée et non comme une condition pour dire que l'on « connaît ZZ ».

## Le rôle de la contrainte <R, U, L>

L’expression **<R, U, L>** est particulièrement importante pour comprendre ZZ.

En mathématiques et en théorie des groupes, les symboles entre chevrons peuvent être utilisés pour désigner l'ensemble des mouvements générés par certains éléments. Dans le contexte du Rubik’s Cube, on peut simplement retenir ici que ZZ cherche à résoudre une grande partie du cube avec les mouvements R, U et L, ainsi que leurs variantes.

Cette contrainte n'est pas seulement esthétique. Elle a des conséquences très concrètes sur la manière de construire les paires et sur la façon dont le cube se comporte.

Le solveur apprend progressivement à exploiter cet ensemble limité de mouvements. Au lieu de chercher n'importe quel mouvement possible, il cherche des solutions compatibles avec la structure déjà construite.

Cela réduit le nombre de possibilités immédiates et peut rendre les séquences plus régulières.

## Une analogie avec les échecs

On peut comparer cette philosophie à une contrainte stratégique aux échecs, mais il faut éviter de pousser l'analogie trop loin.

ZZ ne consiste évidemment pas à « ouvrir par e4 » ou à suivre une ouverture précise. Il s'agit plutôt de décider dès le début de la partie que certaines possibilités seront volontairement exclues afin de simplifier la suite.

Une analogie plus proche serait celle d'un joueur qui accepte volontairement une structure ou une restriction particulière parce qu'elle lui permet ensuite de jouer dans un environnement plus prévisible.

Dans ZZ, l'EO joue ce rôle. Le solveur accepte de consacrer une partie importante du début de la résolution à l'orientation des arêtes. En échange, il peut ensuite éviter F et B et travailler principalement avec R, U et L.

La comparaison avec les échecs doit donc être comprise comme une analogie de **contrainte stratégique**, et non comme une équivalence entre les mouvements des deux jeux.

## ZZ contre CFOP

La principale différence entre ZZ et CFOP se situe au début.

CFOP commence par une Cross relativement intuitive et laisse ensuite une grande liberté de mouvement pour résoudre le F2L. ZZ commence par une EO beaucoup plus exigeante, puis ajoute la Line. En échange, la suite peut être réalisée avec beaucoup moins de rotations et un ensemble de mouvements plus restreint.

Le F2L de CFOP peut donc être très flexible, tandis que la résolution après EOLine dans ZZ est plus contrainte mais également plus régulière.

CFOP possède également un écosystème d'apprentissage extrêmement développé et une progression très claire : Cross, F2L, 2-look OLL/PLL, puis Full PLL et Full OLL. ZZ demande davantage de compréhension de l'orientation des arêtes dès le début.

Pour un débutant complet, CFOP est généralement plus facile à commencer. Pour quelqu'un qui apprécie les méthodes plus techniques et les contraintes élégantes, ZZ peut devenir particulièrement intéressant une fois l'EO comprise.

## ZZ contre Roux

ZZ et Roux sont également très différents.

Roux repose sur deux blocs latéraux, puis sur CMLL et LSE. ZZ repose sur l'orientation des arêtes, l'EOLine et une résolution contrainte des deux premières couches.

Les deux méthodes peuvent produire des résolutions relativement courtes, souvent autour de **45 à 50 mouvements** pour une résolution efficace, mais elles atteignent cette efficacité par des chemins très différents.

Roux utilise énormément la tranche M dans sa dernière étape, tandis que ZZ cherche au contraire à exploiter principalement les mouvements R, U et L pendant une grande partie de la résolution.

Roux donne donc une sensation de construction de blocs et de travail dans la tranche centrale. ZZ donne davantage une sensation de contrôle des arêtes et de résolution dans un espace de mouvements restreint.

## La principale difficulté de ZZ

La grande difficulté de ZZ est donc concentrée au début.

L'EO demande de développer une nouvelle façon de regarder le cube. Au lieu de simplement chercher les pièces nécessaires à une croix, il faut comprendre l'orientation de l'ensemble des arêtes.

Ensuite, l'EOLine demande de combiner cette orientation avec le placement de deux arêtes spécifiques. Cette planification peut être mentalement exigeante, particulièrement pendant l'inspection.

Mais une fois l'EOLine terminée, la méthode devient beaucoup plus régulière. Les mouvements disponibles sont limités, les rotations peuvent être réduites et les blocs restants peuvent être construits avec une grande fluidité.

Cela explique pourquoi ZZ est souvent décrite comme une méthode dont la courbe d'apprentissage est inversée par rapport à ce que l'on pourrait attendre : **le début est plus difficile que celui de CFOP, mais la suite peut devenir plus confortable et plus ergonomique.**

## ZZ résumé simplement

La logique de ZZ peut finalement être résumée en quatre grandes idées.

On commence par **EO**, qui consiste à orienter toutes les arêtes du cube. Cette étape constitue la particularité fondamentale de ZZ. Une fois les arêtes orientées, on évite généralement les mouvements F et B afin de ne pas détruire cette orientation.

On réalise ensuite l’**EOLine**, qui ajoute le placement des deux arêtes DF et DB. On obtient ainsi une structure de départ qui permet de poursuivre la résolution avec une grande partie des arêtes déjà orientées et avec un espace de mouvements fortement contrôlé.

On résout ensuite les deux premières couches en utilisant principalement **R, U et L**. Cette partie peut être comparée à un F2L fortement contraint, avec peu de rotations du cube et une gestuelle particulièrement régulière.

Enfin, on termine la dernière couche avec des méthodes classiques comme **OLL + PLL**, ou avec des techniques avancées comme **ZBLL** pour les solveurs qui souhaitent aller beaucoup plus loin.

La philosophie de ZZ est donc très différente de celle de CFOP et de Roux. **CFOP commence simplement puis devient progressivement algorithmique. Roux construit des blocs et exploite la tranche M. ZZ investit énormément dans l'orientation des arêtes dès le départ afin de rendre le reste de la résolution plus contraint et plus ergonomique.**

C'est cette idée — **payer de la complexité au début pour obtenir de la simplicité ensuite** — qui constitue véritablement le cœur de ZZ.
