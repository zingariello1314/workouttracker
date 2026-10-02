1. Le problème fondamental : le 7 jours ne ressemble toujours pas au niveau de contenu attendu
Quand je compare ton écran actuel aux exemples « Aujourd'hui », l'écart est énorme.
Dans ton exemple de référence, une vraie analyse ressemble à ça :
Exemple de référence
Titre :
« Les mollets viennent d'entrer très fortement dans ton historique récent »

Puis le corps explique :
- combien ;
- proportion ;
- comparaison avec l'avant ;
- pourquoi c'est notable ;
- ce qu'on peut conclure ;
- ce qu'on ne peut pas encore conclure ;
- ce qu'il faudra observer ensuite.    Markdown collé
Ça donne une analyse autonome.
Sur ton écran actuel, beaucoup de cartes font plutôt :
« Les familles identifiées portent 248 épaules, 237 triceps, 192 dos, 158 pectoraux. »

Puis quasiment rien.
Ou :
« Meilleure série observée de Mollets debout : 20 répétitions... »

Puis la même chose est répétée ailleurs.
Ou :
« Ces 7 jours compte 1 370 répétitions sur 5 séances »

Puis la carte repart immédiatement dans une énorme liste de chiffres.
Ce ne sont pas encore des analyses au sens où tu le souhaites.
Ce sont souvent des sorties de données habillées en cartes.
2. Premier gros problème : les cartes ne développent pas assez leur idée
C'est probablement ce qui te dérange le plus intuitivement.
Une bonne carte de ton exemple ne s'arrête jamais à :
« X représente 12 %. »

Elle explique ensuite pourquoi ces 12 % sont intéressants et ce que cela change dans l'historique. Ton document de référence le dit explicitement : une analyse doit idéalement expliquer l'ampleur, le caractère habituel ou inhabituel, la comparaison, ce que cela révèle, la nuance et pourquoi l'information mérite d'être montrée maintenant.    Markdown collé
Sur le 7 jours actuel, tu as plusieurs cartes qui ressemblent encore à :
fait → fin
alors que tu veux :
fait → interprétation → contexte → conséquence → suivi.
Exemple actuel
« Les familles identifiées portent 248 épaules, 237 triceps, 192 dos, 158 pectoraux. »

Ce n'est pas une analyse complète.
Il faudrait soit :
- développer réellement ce que cette composition signifie si elle est réellement intéressante ;
- soit ne pas publier cette carte.
Il ne faut surtout pas remplir les colonnes avec des cartes faibles juste parce qu'une métrique existe.
3. Deuxième problème : certaines cartes sont carrément des cartes « debug »
C'est un très gros problème.
Exemple :
« Le volume de la séance est 100, ce n'est pas la série. »

Ça explique un problème interne du moteur.
L'utilisateur n'a absolument pas besoin qu'on lui dise ça.
Le moteur doit simplement produire :
« Meilleure série : 20 répétitions sur 5 séries enregistrées, pour 100 répétitions au total. »

Et éventuellement expliquer ce que cela signifie.
Même problème avec :
« Une présence dans la fenêtre n'est pas une habitude installée. »

Cette phrase ressemble à une règle du moteur affichée à l'utilisateur.
Ton exemple de référence fait mieux : il utilise cette nuance naturellement :
« Une seule semaine ne permet pas encore de dire que les mollets sont devenus une habitude. »    Markdown collé

La différence est énorme.
4. Troisième problème : certaines cartes ont un titre beaucoup trop long par rapport à leur contenu
Et ça, il faut absolument le signaler à Cursor.
Tu as des cartes où le titre est presque une analyse complète, alors que le corps est minuscule.
C'est particulièrement mauvais parce que ça crée visuellement :
gros titre explicatif → deux mots / une petite phrase → fin
Ce n'est pas une carte d'analyse.
Le titre doit être une conclusion ou une question analytique, mais le corps doit ensuite démontrer et développer cette conclusion.
Mauvais modèle
« Meilleure série observée de Mollets debout : 20 répétitions, sur 5 séries saisies »

puis :
« ... »

Le titre fait déjà tout le travail.
Bon modèle
« Tes séries de mollets commencent à donner un vrai repère de performance »

Puis le corps :
« Sur les 5 séries enregistrées, la meilleure atteint 20 répétitions. Les 100 répétitions totales correspondent au volume de la séance, pas à une série unique. Cette distinction permet de suivre séparément ton niveau sur une série et la quantité totale de travail... »

Là, le titre ouvre une analyse, et le contenu la justifie.
5. Quatrième problème : certaines cartes ont presque aucun contenu
C'est encore plus grave que les doublons.
La carte :
« Les familles identifiées portent 248 épaules, 237 triceps, 192 dos, 158 pectoraux. »

est quasiment une ligne de statistiques.
La carte :
« Mollets debout entre dans la fenêtre avec 100 répétitions... »

est également très courte.
Et la carte :
« Observation : coucher à 7 h 00, lever à 15 h 27. Une seule nuit ne suffit pas à décrire un rythme. »

est franchement à supprimer.
Parce que son contenu dit lui-même :
« cette donnée ne permet pas de tirer une conclusion. »

Donc pourquoi l'afficher ?
La bonne règle devrait être :
Une donnée insuffisamment riche pour produire une analyse intéressante reste dans le dossier de preuves, mais ne devient pas une carte.

6. Cinquième problème : le moteur confond encore « information disponible » et « information intéressante »
C'est probablement la racine de beaucoup de problèmes.
Il voit :
- volume ;
- familles ;
- push/pull ;
- série ;
- répertoire ;
- sommeil ;
- comparaison ;
et il pense :
« J'ai une donnée → je peux fabriquer une carte. »

Alors que le bon raisonnement est :
« J'ai une donnée → est-ce qu'elle révèle quelque chose d'intéressant dans cette fenêtre → est-ce que cette information est suffisamment distincte → est-ce qu'elle mérite une carte ? »

Ton document de référence donne précisément cette philosophie :
« Une analyse ne doit pas seulement expliquer la donnée. Elle doit expliquer pourquoi cette donnée mérite d'être remarquée maintenant. »    Markdown collé

C'est probablement la règle la plus importante à injecter dans Cursor.
7. Sixième problème : la grosse carte de « Ce que tu as fait » essaie encore de tout raconter
C'est l'inverse du problème précédent.
Certaines cartes sont trop courtes, mais la grosse carte de gauche est beaucoup trop longue.
Elle mélange :
- 1 370 reps ;
- 5 séances ;
- moyenne ;
- exercice du jour ;
- familles ;
- poussée ;
- tirage ;
- série ;
- répertoire ;
- comparaison ;
- continuité.
Elle devient une sorte de :
« dump complet du dossier de preuves »

Ce n'est pas ce qu'on veut.
Ton exemple « Aujourd'hui » fait beaucoup mieux : chaque carte a une idée centrale.
Par exemple :
« Le 29 septembre est une séance particulièrement volumineuse... »

et elle développe uniquement :
- 436 reps ;
- durée ;
- composition ;
- pourquoi c'est notable ;
- ce qu'il faudra observer.    Markdown collé
Elle ne repart pas ensuite sur tous les groupes musculaires, toutes les séries et tout le répertoire.
8. Septième problème : la même preuve apparaît encore dans plusieurs cartes
C'est toujours là malgré l'étape B.
Volume
Tu as :
1 370 répétitions / 5 séances

puis encore :
343 répétitions par séance

puis encore :
« Ces 7 jours comptent 1 370 répétitions sur 5 séances »

puis encore des comparaisons qui reprennent 1 370.
Push/pull
Tu as :
poussée 643 / tirage 343

puis cette information est reprise dans d'autres formulations.
Mollets
Tu as :
100 reps

puis :
20 reps meilleure série

puis :
volume total 100

puis à nouveau la meilleure série dans une autre colonne.
Comparaison
Tu as :
1 370 vs 3 991

dans une carte de gauche,
puis à nouveau :
1 370 vs 3 991

dans « Ce qui a évolué ».
Donc la parenté est encore mal gérée.
9. Huitième problème : la déduplication ne doit pas seulement comparer les nombres
Le système actuel semble avoir compris :
« même total = doublon »

mais il ne comprend pas suffisamment :
« même information analytique = doublon »

Deux cartes peuvent avoir des formulations différentes et pourtant raconter exactement la même chose.
Exemple :
« Ces 7 jours comptent 1 370 répétitions... »

et :
« Le volume récent atteint 1 370 répétitions... »

Ce sont deux formulations, mais une seule information.
À l'inverse :
« 1 370 vs 3 991 »

et :
« 1 370 vs 4 556 »

sont deux comparaisons différentes et doivent pouvoir coexister si elles répondent à deux questions différentes.
C'est précisément ce que ton plan précédent avait commencé à formaliser, mais l'écran montre que le système de sélection doit aller plus loin que l'empreinte numérique.
10. Neuvième problème : « Ce que tu as fait » contient encore des éléments qui appartiennent à « Ce qui a évolué »
Par exemple :
« les 7 jours d'avant comptaient 4 556 répétitions... »

C'est déjà une comparaison historique.
Donc ça ne devrait pas être présenté comme un simple fait de la période.
Le découpage devrait rester :
🟦 Ce que tu as fait
Photo de la période.
« Tu as réalisé X sur Y séances... »

🟩 Ce que ça change
Interprétation de cette photo.
« Cela signifie que ton volume récent repose davantage sur... »

🟪 Ce qui a évolué
Transformation par rapport à avant.
« Par rapport à la période précédente, X a augmenté de... »

Ton fichier de référence donne exactement cette distinction.    Markdown collé
11. Dixième problème : « Ce que ça change » contient encore parfois seulement un constat
Par exemple :
« Pompes pseudo-planche revient après 34 jours »

C'est un changement factuel.
Mais ce qui doit être intéressant dans « Ce que ça change », c'est :
qu'est-ce que ce retour change dans la lecture du répertoire actuel ?

Le fichier de référence fait justement cette différence entre :
« 100 mollets »
et :
« les mollets commencent à peser dans la structure de la semaine, mais leur caractère régulier reste à confirmer ».    Markdown collé
12. Onzième problème : « Ce qui a évolué » contient encore des cartes qui ne sont pas des évolutions
Par exemple :
« Meilleure série observée de Mollets debout : 20 répétitions... »

Ce n'est pas une évolution.
C'est un état actuel.
Pour être dans « Ce qui a évolué », il faut au minimum quelque chose comme :
12 reps auparavant → 20 reps maintenant

ou :
absent auparavant → présent maintenant

ou :
1 séance → 3 séances

ou :
X → Y

ou une trajectoire temporelle équivalente.
Sinon ce n'est pas une évolution.
13. Douzième problème : les analyses sommeil se chevauchent encore
Tu as notamment :
« Autour de 7 h 30... »
et :
« Les journées les plus denses suivent plus souvent de longues nuits »
Ces deux cartes racontent presque la même relation :
durée du sommeil ↔ volume / densité d'entraînement.
Il faut déterminer laquelle est la vraie analyse.
Et surtout ne pas avoir :
une carte pour la relation ;

une deuxième carte pour la même relation reformulée ;

puis une troisième carte dans une autre fenêtre.

Le dossier peut contenir toutes les preuves.
L'écran, lui, ne doit montrer qu'une seule interprétation par phénomène.
14. Treizième problème : certaines conclusions sont trop fortes par rapport aux données
Par exemple :
« Le stimulus de la semaine se déplace vers les mollets »

alors que les mollets représentent seulement une petite partie du volume global.
Le chiffre :
101 reps cette semaine contre 101 sur les 30 derniers jours

est intéressant.
Mais ça ne signifie pas :
« le stimulus de la semaine se déplace vers les mollets ».

Le bon niveau serait plutôt :
« Les mollets ont reçu cette semaine autant de volume que sur les 30 derniers jours »

puis :
« Cela constitue une exposition inhabituelle pour un mouvement qui était peu présent récemment... »

Ça correspond beaucoup plus au style du document de référence.
15. Quatorzième problème : certaines cartes racontent le futur au lieu d'analyser le présent
Par exemple :
« si le mouvement s'installe... »

« s'il disparaît... »

« il pourra être décrit comme... »

Ce n'est pas forcément interdit, mais il faut que ce soit une courte perspective de suivi, pas la moitié de la carte.
Ton exemple de référence utilise justement le suivi comme dernière couche :
« Les prochaines séances permettront de distinguer... »    Markdown collé

Donc :
analyse actuelle d'abord → suivi ensuite.
Pas :
hypothèse future → analyse actuelle.
16. Quinzième problème : certaines cartes sont trop défensives
Exemple :
« Cette part décrit la fenêtre, pas une charge identique d'un exercice à l'autre. »

ou :
« Le volume de la séance est 100, ce n'est pas la série. »

ou :
« Une présence dans la fenêtre n'est pas une habitude installée. »

Ces phrases viennent probablement des corrections précédentes visant à éviter les erreurs.
Mais maintenant le système montre ses garde-fous.
Il faut que le moteur les utilise pour produire une meilleure phrase, pas pour afficher la logique interne.
17. Seizième problème : la moyenne de 343 reps/séance est à diagnostiquer immédiatement
L'écran affiche :
1 370 répétitions sur 5 séances

et :
environ 343 reps par séance

Or :
1 370 / 5 = 274.
343 correspond à :
1 370 / 4 ≈ 342,5.
Donc il y a clairement quelque chose à comprendre.
Je ne demanderais pas encore à Cursor de changer le calcul.
Je lui demanderais d'abord :
« D'où vient exactement le 343 ? Quel tableau / champ / fenêtre / dénominateur l'alimente ? »

Parce que ça peut être :
- une moyenne sur 4 séances ;
- un champ hérité de l'ancienne fenêtre ;
- un calcul sur une autre sous-population ;
- un bug de filtrage ;
- un texte utilisant une variable différente du total affiché.
Il faut trouver la cause avant de corriger.
18. Dix-septième problème : « cette semaine » peut être moins précis que « ces 7 jours »
Ton interface affiche :
vendredi 25 septembre → jeudi 1 octobre

Donc ce n'est pas nécessairement une semaine calendaire classique.
Dans les analyses, utiliser :
« cette semaine »

peut créer une ambiguïté.
Pour un moteur aussi précis, je privilégierais :
« ces 7 jours »

ou :
« sur les 7 derniers jours »

quand il s'agit réellement de la fenêtre sélectionnée.
19. Dix-huitième problème : les cartes ne semblent pas suffisamment hiérarchisées
Il y a trois niveaux qui devraient exister :
Niveau 1 — Insight fort
Une information vraiment importante.
Exemple :
retour après 34 jours + 60 reps + 139 % du niveau précédent.

Niveau 2 — Insight secondaire
Une information intéressante mais moins majeure.
Exemple :
les pompes déclinées apparaissent sur 3 séances.

Niveau 3 — donnée brute
Une information techniquement disponible mais pas suffisamment intéressante.
Exemple :
248 épaules / 237 triceps / 192 dos / 158 pectoraux.

Le niveau 3 ne devrait pas automatiquement devenir une carte.
C'est probablement une des raisons pour lesquelles ton écran paraît rempli sans être réellement riche.
20. Dix-neuvième problème : il faut revenir au principe « une carte = une idée »
C'est probablement la règle que Cursor doit intégrer partout.
Une carte doit pouvoir être résumée en une phrase :
« Cette carte démontre que X. »

Si tu ne peux pas répondre à :
« Qu'est-ce que cette carte veut réellement me faire comprendre ? »

alors la carte ne devrait probablement pas exister.
Et inversement, une carte comme :
« Cette semaine compte 1 370 reps sur 5 séances... »

est trop générique si une autre carte explique déjà le volume.
21. Vingtième problème : le contenu attendu dans tes exemples est beaucoup plus personnel
C'est un point essentiel.
Ton exemple de référence ne dit pas simplement :
« 100 mollets. »

Il dit :
« 100 mollets cette semaine, alors que cette exposition n'était pratiquement pas présente auparavant... »

Donc Momentum doit raisonner sur ton historique à toi, pas sur une norme abstraite.
Le document précise justement :
- est-ce habituel pour cet utilisateur ?
- comparaison avec sa période précédente ;
- pourquoi c'est inhabituel ;
- ce que cela révèle ;
- ce qu'il faudra surveiller.    Markdown collé
C'est ça qui manque encore dans plusieurs cartes du 7 jours.
22. Ce que je veux que Cursor fasse AVANT de modifier quoi que ce soit
Et là, je pense que c'est la partie la plus importante de ton prochain prompt.
Ne lui dis pas :
« Corrige les cartes. »

Sinon il va encore modifier trois fonctions au hasard.
Il faut lui dire :
PHASE 1 — DIAGNOSTIC UNIQUEMENT
Aucune modification de code.
Il doit suivre une carte depuis :
proof → candidate → thread → kinship → score → column → render
et déterminer :
1. pourquoi les cartes de volume sont encore dupliquées ;
2. pourquoi le même contenu apparaît dans plusieurs colonnes ;
3. pourquoi certaines cartes ont un titre très long et un corps minuscule ;
4. pourquoi certaines cartes ont seulement une statistique sans analyse ;
5. pourquoi la grosse carte de gauche absorbe quasiment tout le dossier ;
6. pourquoi les cartes dérivées sont encore publiées alors qu'elles ne rajoutent pas d'information ;
7. pourquoi les comparaisons se retrouvent dans « Ce que tu as fait » ;
8. pourquoi des cartes qui ne sont pas des évolutions apparaissent dans « Ce qui a évolué » ;
9. pourquoi le sommeil produit plusieurs cartes proches ;
10. d'où vient exactement le 343 reps/séance ;
11. pourquoi certaines formulations internes/debug remontent encore ;
12. comment les titres sont générés ;
13. comment le corps est généré ;
14. si le système évalue la qualité du contenu ou uniquement l'existence d'une carte ;
15. à quel moment la limite 3–5 est appliquée ;
16. si la sélection privilégie encore la quantité de candidats plutôt que leur diversité sémantique.
Et surtout :
qu'il donne les fichiers, fonctions et variables responsables de chacun de ces problèmes AVANT de coder.

23. Ensuite seulement : correction
Et la correction ne doit pas être :
« réduis le nombre de cartes ».

Il faut corriger la génération et la sélection.
Le système doit tendre vers :
🟦 Ce que tu as fait
faits importants de la période
🟩 Ce que ça change
interprétation de ces faits
🟪 Ce qui a évolué
comparaison / trajectoire par rapport à avant
Comme ton document de référence.    Markdown collé
24. Le nouveau contrat d'une carte
Je demanderais à Cursor d'imposer quelque chose comme :
Titre
Une phrase courte, naturelle, interprétative.
Pas :
« Meilleure série observée de Mollets debout : 20 répétitions, sur 5 séries saisies... »

Mais :
« Tes séries de mollets commencent à donner un repère reproductible »

Corps
Quand les preuves le permettent :
1. fait concret
20 reps sur la meilleure série, 5 séries enregistrées.

2. ampleur
100 reps au total.

3. contexte personnel
mouvement récemment absent / récemment apparu.

4. comparaison
période précédente / séances précédentes.

5. interprétation
ce que cela révèle.

6. nuance
ce qu'on ne peut pas encore conclure.

7. suivi
ce qui permettra de confirmer ou non.

Pas besoin de forcer les 7 niveaux à chaque fois.
Mais une carte qui ne peut produire qu'une donnée brute devrait généralement être rejetée.
25. Il faut aussi empêcher le moteur de créer une carte uniquement parce qu'un « kind » existe
C'est un point très important.
Actuellement, on sent :
concentration existe → carte

composition existe → carte

pushPull existe → carte

series existe → carte

repertoire existe → carte

etc.
Il faut inverser la logique :
kind → candidat → analyse réelle → qualité → diversité → sélection

Le kind doit être un moyen de produire une analyse, pas une raison de publier une carte.
26. Le plafond 10 ne doit surtout pas être utilisé comme objectif
Tu l'avais déjà écrit dans le plan précédent, et je le conserverais.
Pour 7 jours :
3–5 cartes distinctes si les preuves le permettent.
Mais :
2 excellentes cartes > 5 cartes faibles.

Il ne faut surtout pas demander à Cursor :
« fais-moi exactement 5 cartes ».

Sinon il va remplir.
Il faut :
« sélectionne les cartes réellement distinctes et intéressantes ; si seulement 2 sont suffisamment riches, affiche 2. »

27. Et il faut tester avec les données réelles de ton écran
Pas seulement des fixtures.
Parce que ton problème actuel le démontre :
72 tests verts ≠ écran correct.

Cursor doit charger les vraies données qui produisent actuellement :
- 1 370 reps ;
- 5 séances ;
- 34 jours ;
- 643 poussée ;
- 343 tirage ;
- 100 mollets ;
- 20 reps meilleure série ;
- sommeil ;
- comparaison 7/30 jours.
Puis faire une inspection de la sortie finale.
28. Le prompt que je donnerais à Cursor
Tu peux lui donner tel quel :
Je veux reprendre entièrement le problème des analyses du Récap sur la fenêtre 7 jours.

IMPORTANT :
NE MODIFIE PAS LE CODE IMMÉDIATEMENT.

Je veux d'abord un DIAGNOSTIC COMPLET de la chaîne réelle qui produit les cartes affichées à l'écran.

Référence de contenu :
- `but a atteindre en terme d analyses.md`
- notamment les exemples « AUJOURD'HUI — Ce que tu as fait », « Ce que ça change » et « Ce qui a évolué ».

Le niveau attendu n'est PAS :
donnée → phrase.

Le niveau attendu est :
donnée → constat → contexte personnel → comparaison → interprétation → conséquence → suivi,
quand les données permettent réellement de faire ces étapes.

Une analyse doit expliquer pourquoi une donnée mérite d'être remarquée maintenant.
Une simple statistique n'est pas automatiquement une carte.

==================================================
PHASE 1 — DIAGNOSTIC, AUCUNE MODIFICATION
==================================================

Inspecte la chaîne complète :

proofs
→ candidates
→ thread generation
→ kinship/deduplication
→ scoring
→ column selection
→ final rendering.

Je veux que tu identifies précisément les fichiers, fonctions et variables responsables des problèmes suivants.

1. DUPLICATION DU VOLUME

Sur l'écran 7 jours actuel, 1 370 répétitions / 5 séances apparaît sous plusieurs formes et dans plusieurs cartes.

Je veux savoir pourquoi la déduplication actuelle ne considère pas ces formulations comme une seule information analytique.

Ne te limite pas à comparer les nombres :
deux cartes peuvent avoir des textes différents mais raconter exactement le même fait central.

2. DUPLICATION ENTRE COLONNES

Le même phénomène apparaît dans :
- Ce que tu as fait
- Ce que ça change
- Ce qui a évolué

Exemple :
la comparaison 7 jours / 30 jours apparaît encore dans plusieurs endroits.

Je veux savoir à quel moment la séparation sémantique entre les trois colonnes échoue.

3. MAUVAISE FONCTION DES TROIS COLONNES

Le contrat attendu est :

CE QUE TU AS FAIT
= ce qui s'est réellement passé pendant la période.

CE QUE ÇA CHANGE
= ce que ces observations changent dans la lecture actuelle de l'entraînement.

CE QUI A ÉVOLUÉ
= ce qui a changé par rapport à une période antérieure ou ce qui montre une trajectoire.

Une carte qui ne contient aucune comparaison temporelle ne doit normalement pas être présentée comme une évolution.

Une simple statistique ne doit pas devenir automatiquement une carte de « Ce que ça change ».

Identifie où ce contrat est perdu.

4. CARTES TROP COURTES / CARTES VIDES

Sur l'écran actuel, certaines cartes ont :
- un titre très long ;
- un corps minuscule ;
- parfois pratiquement seulement deux mots ou une courte phrase.

Je déteste ce type de carte.

Le titre ne doit pas porter toute l'analyse pendant que le corps n'apporte presque rien.

Je veux identifier :
- comment le titre est généré ;
- comment le body est généré ;
- si le titre est généré avant le body ;
- si un candidat peut être publié malgré un body trop court ;
- s'il existe actuellement un minimum de richesse sémantique du body ;
- si le système note uniquement l'existence d'une carte au lieu de noter sa qualité.

5. TITRES TROP LONGS

Certains titres sont quasiment le contenu entier de la carte.

Je veux comprendre le générateur de titres.

Le titre doit être :
- court ;
- naturel ;
- interprétatif ;
- compréhensible seul ;
- mais ne doit pas contenir toute la preuve.

Le corps doit justifier le titre.

6. CARTES QUI NE SONT QUE DES DONNÉES

Exemple actuel :
« Les familles identifiées portent 248 épaules, 237 triceps, 192 dos, 158 pectoraux. »

Ce genre de carte doit être évalué comme une analyse potentielle, pas automatiquement comme une analyse publiée.

Je veux identifier pourquoi une simple sortie de métrique arrive jusqu'à l'écran.

7. CARTES DEBUG / GARDE-FOUS EXPOSÉS À L'UTILISATEUR

Exemples :
- « Le volume de la séance est 100, ce n'est pas la série. »
- « Une présence dans la fenêtre n'est pas une habitude installée. »
- formulations qui expliquent le fonctionnement du moteur plutôt que l'entraînement.

Je veux identifier leur source exacte et comprendre pourquoi ces phrases internes remontent au rendu final.

Attention :
ne supprime PAS les garde-fous internes.
Il faut seulement empêcher leur formulation technique d'être publiée telle quelle.

8. GROSSE CARTE DE CONCENTRATION

La carte dominante de « Ce que tu as fait » contient actuellement presque tout :
volume, moyenne, exercice, familles, poussée/tirage, série, répertoire, comparaison, continuité.

Je veux identifier pourquoi le fil concentration absorbe encore autant de dimensions.

Il doit produire une analyse forte sur UNE idée centrale, pas un dump du dossier de preuves.

9. MOYENNE 343 REPS/SESSION

L'écran actuel affiche :
- 1 370 répétitions
- 5 séances
- environ 343 répétitions par séance

Mathématiquement, 1 370 / 5 = 274.

NE CORRIGE PAS ENCORE CE CHIFFRE.

Je veux d'abord identifier exactement :
- quelle variable produit 343 ;
- quel dénominateur elle utilise ;
- quelle fenêtre elle utilise ;
- si elle utilise 4 séances au lieu de 5 ;
- si elle vient d'une autre période ;
- si elle provient d'un champ déjà calculé ;
- si le texte et le total utilisent deux sources différentes.

Je veux la cause exacte avant toute correction.

10. SOMMEIL

Il existe plusieurs cartes proches :
- relation sommeil / volume ;
- journées fortes après longues nuits ;
- poussée / tirage après nuit courte.

Je veux identifier si plusieurs candidats reposent sur la même preuve source et pourquoi la sélection les considère comme distincts.

Une seule relation ne doit pas devenir plusieurs cartes reformulées.

11. CARTE « UNE NUIT »

Une carte du type :
« coucher à 7 h 00, lever à 15 h 27. Une seule nuit ne suffit pas à décrire un rythme »

est une preuve trop pauvre pour devenir une carte d'analyse.

Je veux identifier pourquoi le système publie une carte alors que son propre texte dit qu'il n'y a pas assez de données pour conclure.

12. SERIES

La meilleure série des mollets apparaît dans plusieurs colonnes.

Je veux identifier :
- comment la meilleure série est représentée ;
- comment le volume de séance est représenté ;
- pourquoi la même carte est publiée plusieurs fois ;
- pourquoi une carte de série est autorisée dans « Ce qui a évolué » sans comparaison temporelle.

13. COMPARAISONS

Les comparaisons 7 jours / 30 jours apparaissent dans plusieurs colonnes.

Je veux comprendre :
- qui décide qu'une comparaison appartient à telle colonne ;
- si la même comparaison peut être produite par plusieurs kinds ;
- si l'empreinte actuelle regarde seulement les nombres ;
- si elle regarde les deux périodes ;
- si elle sait distinguer deux comparaisons réellement différentes.

14. QUALITÉ ANALYTIQUE

Je veux identifier s'il existe actuellement un vrai filtre qui demande :

« Cette carte apporte-t-elle une compréhension nouvelle ? »

ou si la sélection demande seulement :

« Cette carte est-elle valide techniquement ? »

Si ce filtre n'existe pas, indique précisément où il doit être ajouté.

==================================================
PHASE 1B — RAPPORT ATTENDU AVANT DE CODER
==================================================

Ne modifie rien.

Retourne-moi un rapport structuré :

A. pipeline réel de génération des cartes ;
B. cause exacte de chaque problème ci-dessus ;
C. fichiers/fonctions responsables ;
D. variables / structures responsables ;
E. ordre actuel des opérations ;
F. endroit exact où chaque correction doit être appliquée ;
G. ce qui doit rester absolument inchangé ;
H. risques de régression ;
I. stratégie de test sur les vraies données 7 jours.

Je veux que tu me dises clairement :
« le problème vient de X, parce que Y, à tel endroit du pipeline ».

Pas seulement :
« il faudrait améliorer la déduplication ».

==================================================
PHASE 2 — APRÈS MON ACCORD SEULEMENT
==================================================

Une fois le diagnostic terminé, propose le plan de correction.

Le but n'est PAS de simplement réduire le nombre de cartes.

Le but est :

1. une carte = une idée analytique ;
2. une preuve centrale ne doit pas être racontée plusieurs fois ;
3. les trois colonnes ont des fonctions différentes ;
4. une carte doit avoir un corps suffisamment développé pour justifier son titre ;
5. une simple métrique ne devient pas automatiquement une analyse ;
6. une carte pauvre est supprimée plutôt que remplie artificiellement ;
7. les comparaisons restent réellement distinctes lorsqu'elles comparent deux périodes différentes ;
8. une évolution doit réellement montrer une évolution ;
9. une relation sommeil / entraînement ne doit pas être publiée sous plusieurs formulations ;
10. les données internes/debug restent disponibles pour le moteur mais ne remontent pas telles quelles dans le Récap.

==================================================
CONTRAT DE CONTENU
==================================================

Pour une carte riche, quand les preuves le permettent :

1. qu'est-ce qui s'est passé ?
2. quelle est l'ampleur ?
3. est-ce habituel ou inhabituel pour cet utilisateur ?
4. comment cela se compare-t-il à avant ?
5. qu'est-ce que cela révèle ?
6. quelle nuance empêche une conclusion trop forte ?
7. qu'est-ce qu'il faudra surveiller ensuite ?
8. pourquoi cette information mérite-t-elle d'être montrée maintenant ?

Ne force PAS toutes ces couches quand les données ne permettent pas de les produire.

Mais si une carte ne peut produire qu'une donnée brute sans intérêt analytique, elle doit normalement être rejetée.

==================================================
CONTRAT DES TROIS COLONNES
==================================================

CE QUE TU AS FAIT :
photo analytique de la période.

Exemple :
« Tu as enregistré X reps sur Y séances... »
puis contexte/composition si pertinent.

CE QUE ÇA CHANGE :
interprétation de ce que ces faits changent dans la lecture actuelle.

Exemple :
« Cette hausse ne correspond pas simplement à plus de reps : elle est concentrée sur... »

CE QUI A ÉVOLUÉ :
comparaison, trajectoire ou transformation par rapport à avant.

Exemple :
« Les pompes déclinées étaient absentes de la période précédente et apparaissent désormais sur 3 séances... »

Ne mets pas une simple meilleure série dans « Ce qui a évolué » si aucune évolution temporelle n'est montrée.

==================================================
CONTRAT TITRE / BODY
==================================================

Titre :
- court ;
- naturel ;
- intéressant ;
- ne répète pas tous les chiffres ;
- ne doit pas contenir toute la preuve.

Body :
- développe réellement le titre ;
- apporte les chiffres ;
- apporte le contexte ;
- explique pourquoi c'est intéressant ;
- contient la nuance ;
- peut terminer par un suivi pertinent.

Interdit :
titre très long + body de deux mots.

Interdit :
une carte dont le body ne fait que répéter le titre.

Interdit :
une carte qui expose les règles internes du moteur.

==================================================
DÉDUPLICATION
==================================================

Ne déduplique pas uniquement par kind.

Ne déduplique pas uniquement par texte exact.

Ne déduplique pas uniquement par nombres.

Déduplique par « fait central / information analytique ».

Deux formulations différentes du même phénomène = une seule carte.

Deux comparaisons réellement différentes restent distinctes si elles nomment clairement leurs deux périodes et apportent deux lectures différentes.

==================================================
QUALITÉ AVANT QUANTITÉ
==================================================

Le plafond 10 reste un plafond, jamais une cible.

Pour 7 jours :
3 à 5 cartes réellement distinctes si les preuves le permettent.

Mais :
2 excellentes cartes > 5 cartes faibles.

Ne remplis jamais artificiellement jusqu'à 3, 4 ou 5.

==================================================
VALIDATION
==================================================

La validation doit utiliser les vraies données qui produisent actuellement l'écran 7 jours.

Tester notamment :

- 1 370 reps ;
- 5 séances ;
- le calcul de moyenne ;
- 34 jours d'absence ;
- 643 poussée ;
- 343 tirage ;
- 100 mollets ;
- meilleure série 20 ;
- sommeil ;
- comparaison 7 jours / 30 jours.

Je veux inspecter les cartes finales réellement produites, pas seulement vérifier que des fonctions retournent un objet non-null.

Critères de réussite :

- plus de duplication du même volume ;
- plus de même carte entre deux colonnes ;
- aucune carte purement statistique sans intérêt analytique ;
- aucune carte avec titre très long et body minuscule ;
- aucune carte debug ;
- aucune comparaison dans « Ce que tu as fait » si elle appartient réellement à « Ce qui a évolué » ;
- aucune carte d'évolution sans évolution temporelle ;
- aucune carte sommeil redondante ;
- aucune carte « une seule nuit » qui ne permet rien d'intéressant ;
- meilleure série et volume de séance correctement séparés ;
- le chiffre 343 doit avoir une origine expliquée et être corrigé uniquement après identification de sa source ;
- les cartes finales doivent réellement ressembler au niveau rédactionnel et analytique du fichier `but a atteindre en terme d analyses.md`.

IMPORTANT :
Ne crée aucun nouveau fil.
Ne crée aucune nouvelle métrique.
Ne crée aucun nouveau seuil.
Ne touche pas au dossier de preuves sauf si le diagnostic démontre une erreur réelle de données.
Ne touche pas au moteur coach hors Récap.
Ne remplis pas artificiellement les colonnes.

Commence uniquement par PHASE 1 — DIAGNOSTIC.

Et il y a une chose que je rajouterais à Cursor
Je lui ferais vraiment comprendre que le fichier d'exemple n'est pas seulement un exemple de texte.
C'est un contrat de comportement du moteur.
Parce que ton document dit très clairement que l'objectif est de passer de :
« tableau de statistiques avec phrases »

à :
« véritable moteur d'analyse de l'historique de l'utilisateur ».    Markdown collé

Et c'est exactement ce qui manque encore à ton écran 7 jours.


Et il y a une chose que je rajouterais à Cursor
Je lui ferais vraiment comprendre que le fichier d'exemple n'est pas seulement un exemple de texte.
C'est un contrat de comportement du moteur.
Parce que ton document dit très clairement que l'objectif est de passer de :
« tableau de statistiques avec phrases »

à :
« véritable moteur d'analyse de l'historique de l'utilisateur ».    Markdown collé

Et c'est exactement ce qui manque encore à ton écran 7 jours.
Le résultat que je chercherais maintenant
Pas forcément plus de cartes.
Mais des cartes du genre :
Les pompes déclinées commencent à s'installer dans ta poussée

Puis un vrai paragraphe qui explique :
160 reps → 3 séances → absentes avant → 12,7 % de la poussée → début d'installation mais pas encore habitude → à confirmer dans les prochaines semaines.
Ça, c'est une analyse.
Alors que :
« Pompes déclinées entre dans la poussée »

avec quelques chiffres derrière, c'est encore essentiellement une annotation de base de données.