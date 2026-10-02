# Plan — une carte est ce qu’une mesure révèle

Référence de comportement : `but a atteidnre en temre danalyses .md`.
Les dix questions de ce fichier sont le contrat d’une carte. Ce ne sont pas des modèles de phrases à copier, et ce ne sont pas dix phrases obligatoires.

La question n’est pas « cette mesure contient-elle plusieurs informations ? ». La question est : cette mesure, replacée dans l’historique de cet utilisateur, fait-elle comprendre quelque chose qu’on ne voyait pas sans elle ?

Une statistique brute ne devient pas une carte. « Tu as fait 1 370 répétitions » n’est pas une analyse. Une statistique qui révèle un écart inhabituel, une concentration, une tendance, une rupture, un changement de niveau, ou une projection déjà portée par des fenêtres mesurées, peut devenir une carte même si elle repose sur une seule mesure. « 524 répétitions représentent 38,2 % des 1 370 » est une analyse de la structure de ces 7 jours. « 1 370 répétitions, soit le rythme par journée de renforcement, contre le rythme habituel déjà mesuré » en est une aussi, dès que ce rythme habituel est dans le dossier.

Le moteur sait dire « c’est beaucoup » et « c’est peu ». Une grosse valeur ne produit pas une carte. Une petite valeur non plus. La chaîne est : la valeur, sa comparaison avec l’historique personnel déjà calculé, le sens de l’écart, ce que cet écart change dans la lecture. Une valeur proche de l’habitude ne sort que lorsque cette proximité est elle-même la nouvelle. Sinon, il n’y a rien à dire.

Le moteur examine toutes les preuves. Avoir déjà deux ou quatre cartes acceptées n’arrête pas l’examen. L’ordre réel est : toutes les preuves, puis les idées candidates, puis celles qui révèlent quelque chose, puis les idées distinctes, puis la publication. Le plafond 10 s’applique à la fin, seulement s’il reste plus de dix idées distinctes. Il n’est pas une raison de s’arrêter à quatre.

Plans déjà dans le code, à ne pas défaire : `plan-niveau-exemple-dix-par-colonne.md`, `plan-selection-cartes-distinctes.md`.
Diagnostic qui motive ce plan : `avis sur 7jorus mais symptomes presnets dan sotutes les vues.md`.

Ce plan ne crée ni fil, ni métrique, ni seuil. Il n’ajoute pas de carte pour atteindre une bande. Il insère l’étape qui manque encore :

preuve → prétention → suffisance éditoriale → rôle → rédaction → colonne → parenté → sélection

Le plafond 10 reste un plafond. Les bandes 2–4 et 3–5 du plan de sélection ne sont pas un quota. Ce plan ne s’en sert pas pour remplir.

---

## 1. Ce que ce plan remplace

Le plan de sélection a raison sur la parenté des comparaisons, le jour à 0, le verbe au-dessus de 100 %, les cartes parasites, et le fait qu’un dérivé qui ne sait parler qu’en recommençant par le total ne sort pas.

Il a tort sur un point, et c’est ce point qui laisse l’écran en tableau de chiffres.

Sa règle « on garde la carte la plus complète » demande au fil concentration de porter toutes les dimensions. `sentencesOf` les aligne. `enough` publie dès qu’il y a une ligne. `writeThreadCard` met la première phrase dans le titre. Le sens demandé au fil choisit la colonne, sans changer le texte. Les anciens détecteurs entrent à côté, avec leurs propres titres.

Résultat, sur 7 jours comme sur les autres fenêtres : une mesure devient une carte, le même fait revient sous un autre `kind`, et le titre contient déjà le corps.

À partir de ce plan, une carte n’est plus « le dossier le plus long ». Une carte est une prétention qui a passé la suffisance.

On ne rouvre pas :

- le dossier de preuves, ses champs, ses fenêtres, ses deux blocs de 6 mois, sa couverture d’année ;
- les seuils déjà validés : 32, sommeil, séances comparables à 0,32, structure installée ;
- `dayCountsAsCalendarTrainingDay` : une journée Garmin, d’endurance ou de circuit reste une journée entraînée ;
- le jour à 0, qui ne prend pas les répétitions de la dernière séance pour « aujourd’hui » ;
- le verbe « atteignent » quand une part dépasse 100 % ;
- la séparation série observée / total de séance / record déclaré ;
- le plafond 10 ;
- le coach en dehors des colonnes du Récap ;
- la distinction entre deux comparaisons qui n’ont pas la même deuxième période.

---

## 2. Le contrat du fichier d’exemple

Quand les preuves le permettent, le corps répond à ce qui suit. On n’invente pas la couche qui manque.

1. Ce qui s’est passé.
2. L’ampleur.
3. Habituel ou inhabituel pour cet utilisateur.
4. La comparaison avec une période précédente, seulement si elle change la lecture.
5. Ce que cela révèle.
6. Le sens du changement, sans jugement gratuit. Pas de « favorable », « neutre » ou « à surveiller » comme étiquette. On dit ce que le nombre autorise, et sa limite.
7. Ce qu’il serait utile de revoir ensuite. Cette phrase termine. Elle ne porte pas la carte.
8. Une relation avec une autre donnée déjà mesurée.
9. La nuance qui empêche une conclusion trop forte.
10. Pourquoi cette information mérite d’être montrée maintenant.

Une statistique brute, qui ne dit que « le champ vaut N », ne devient pas une carte. Une statistique qui, comparée à l’historique personnel, révèle un écart, une concentration, une tendance, une rupture ou un changement de niveau, peut devenir une carte même si une seule mesure la porte. Une preuve dont la seule phrase honnête est le point 9 ne devient pas une carte. La nuance qualifie une idée. Elle ne la remplace pas. Une seule mesure peut suffire pour une anomalie ou une concentration. Deux mesures peuvent suffire pour une relation. Une série de fenêtres déjà mesurées peut suffire pour une tendance. Quinze mesures qui racontent la même chose n’en produisent qu’une.

Les exemples du fichier restent la barre de rédaction. Les chiffres de l’écran réel restent la barre de vérité. Quand les deux divergent, on garde le comportement de l’exemple et les nombres de l’écran. Exemple : le fichier parle d’environ 14 % pour les pompes déclinées ; l’écran 7 jours dit 12,7 %. On n’aligne pas le texte sur l’exemple. On écrit 12,7 % si c’est la preuve.

---

## 3. Pipeline

Aujourd’hui : mesure, puis `detectDiscoveries`, jalons et catalogue d’un côté, `buildThreadDossiers` et `writeThreadCard` de l’autre. La nature du sens range le texte. `keepDistinctProofCards` retire les textes identiques et les ouvertures par le même total. `selectNarrativeColumns` prend les plus lourdes. `stripTitleEcho` retire le titre du corps.

Cible, pour Aujourd’hui, 7 jours, 30 jours, 3 mois, 6 mois et 1 an :

1. Les preuves restent calculées comme maintenant.
2. Chaque générateur propose des prétentions. Il ne propose plus un texte publiable.
3. La suffisance accepte ou refuse.
4. Le rôle accepté choisit la colonne.
5. La rédaction remplit un titre court et un corps séparé.
6. La parenté compare les `factId`.
7. La sélection publie les prétentions acceptées et distinctes. Elle a d’abord laissé passer tout le dossier. Le plafond 10 ne coupe qu’à la fin.

Les trois sens d’un fil ne sont pas trois prétentions. Une preuve peut nourrir deux prétentions seulement si leurs `factId` diffèrent et si chacune passe la suffisance. Une carte déjà retenue n’élimine pas l’examen des preuves suivantes.

---

## 4. Contrat d’une prétention

Pas de champ nouveau dans le dossier. La prétention ne fait que nommer ce qui est déjà mesuré.

| Champ | Rôle |
|---|---|
| `idea` | Phrase interne. Ce n’est pas le titre affiché. |
| `subject` | Mouvement, journée, sommeil, volume, famille. |
| `measure` | Mesure déjà calculée : part, reprise, niveau, association, absence puis présence. |
| `windowA` | Fenêtre dont on parle, avec son libellé réel. « Ces 7 jours », pas « cette semaine », quand la fenêtre n’est pas une semaine calendaire. |
| `windowB` | L’autre période, seulement si on compare. |
| `relation` | Vide, ou `part`, `association`, `reprise`, `changement de niveau`, `absence puis présence`. |
| `analysisType` | Type interne, pas une colonne : `fact`, `comparison`, `relationship`, `evolution`, `anomaly`, `trend`, `projection`. |
| `direction` | Pour un écart : `haut`, `bas` ou `proche`. Les deux premiers peuvent publier. `proche` ne publie que si la proximité est la nouvelle. |
| `facts` | Uniquement les chiffres qui soutiennent cette idée. Le repère d’habitude est un chiffre déjà dans le dossier. On ne l’invente pas. |
| `certainty` | `observé`, `associé`, `comparé` ou `projeté`. Pas un score. `projeté` est le moins certain. |
| `limit` | Ce que les chiffres n’autorisent pas. Contrainte interne. |
| `role` | Colonne : `fact`, `reading` ou `evolution`. Le type interne ne crée pas une quatrième colonne. |
| `factId` | `subject + measure + windowA + windowB + relation + analysisType + direction`. |

Le `kind` reste l’étiquette du générateur. Il n’est pas l’identité de l’idée.

`analysisType` dit de quelle intelligence il s’agit. `role` dit dans quelle colonne cela se lit. Une projection n’est pas un fait : elle ne vit pas seule, elle termine une tendance déjà établie, et sa certitude est `projeté`.

| Type interne | Ce qu’il établit | Colonne habituelle |
|---|---|---|
| `fact` | Ce qui s’est passé dans la fenêtre | Ce que tu as fait |
| `anomaly` | La valeur est haute ou basse par rapport à l’habitude personnelle | Ce que tu as fait, si l’écart est dans la fenêtre. Ce que ça change, si l’écart relit la période. |
| `comparison` | Deux périodes ou deux repères nommés, et le sens de l’écart | Ce que ça change, ou Ce qui a évolué si les deux états sont datés |
| `relationship` | Deux mesures bougent ensemble | Ce que ça change |
| `evolution` | Un niveau ou une composition a changé | Ce qui a évolué |
| `trend` | Une série de fenêtres déjà mesurées monte, baisse, ou casse | Ce qui a évolué |
| `projection` | Ce que le rythme déjà mesuré implique s’il se maintient | Dernière phrase de la carte de tendance. Pas une carte, et pas une colonne. |

`windowA` doit être la fenêtre affichée, ou une sous-période nommée à l’intérieur (un jour, un mois, un bloc daté). Une carte de 6 mois dont les chiffres sont ceux de 30 jours ou de 3 mois ne passe pas sous l’étiquette « ces six mois ». Soit le libellé dit la vraie période, soit la carte ne sort pas.

---

## 5. Suffisance

Les cinq conditions sont vraies ensemble. Sinon la preuve reste dans le dossier.

1. L’idée tient en une phrase, et `facts` suffit à la démontrer.
2. Replacée dans l’historique déjà mesuré, elle fait comprendre quelque chose qu’on ne voyait pas sans elle : une concentration, un écart haut ou bas, une relation, deux états, une tendance, ou la proximité quand cette proximité répond à une lecture trop forte.
3. La certitude ne dépasse pas les chiffres. Un titre plus fort que le corps est un refus. Une projection ne parle pas comme un constat.
4. La limite n’est pas le message. « On ne peut pas conclure » n’est pas une carte.
5. Le `factId` n’est pas déjà porté par une prétention acceptée. Une nuance rejoint cette carte.

Aucune de ces conditions n’est un nouveau seuil numérique. « Suffisamment important » veut dire : l’écart change la lecture par rapport au repère personnel déjà calculé. On n’ajoute pas un pourcentage de nouveauté. On ne code pas « grosse valeur, donc carte ».

Trois issues, pour la même mesure :

- 524 répétitions un jour, habitude personnelle des journées de renforcement nettement plus basse, et 38,2 % des 1 370 : signal haut. La carte dit que la journée concentre un volume inhabituel.
- La même journée à un volume nettement sous cette habitude : signal bas. La carte a le même droit. Elle dit que la journée est en retrait.
- Une journée proche de l’habitude : rien, sauf si une autre prétention aurait fait croire à un pic ou à un creux.

Cas tranchés sur l’écran 7 jours du 25 septembre au 1 octobre 2026. La même logique vaut pour les autres fenêtres, avec leurs propres preuves.

| Preuve | Décision | Pourquoi |
|---|---|---|
| 100 mollets parce que le mouvement apparaît | Refus | Une présence n’est pas une lecture. |
| 101 mollets ces 7 jours contre 101 sur les 30 jours qui les contiennent | Accepté seulement sous l’idée étroite | Ces 7 jours contiennent les mollets du mois. Le corps dit que 101 reps restent une petite part des 1 370. Le titre « le stimulus se déplace » est refusé. Sans cette limite dans le corps, refus. |
| Une nuit, coucher 7 h 00, lever 15 h 27 | Refus | La seule phrase honnête est le refus lui-même. |
| Poussée 643 / tirage 343, sans autre période | Refus | Composition nue. La précaution « pas un déséquilibre » prouve qu’il n’y a pas encore d’idée. |
| Série 20 et séance 100, sans état antérieur | Refus | Deux unités. La distinction est une contrainte d’écriture, pas une idée. |
| 1 370 répétitions, seuls | Refus | Le total nu ne révèle rien. | 
| 1 370, ramenés au rythme par journée de renforcement, contre le même rythme déjà mesuré sur une fenêtre comparable | Accepté si l’écart change la lecture | Type `anomaly` ou `comparison`, sens haut ou bas. Le repère est un champ déjà calculé, avec le même dénominateur. On n’invente pas « 250 habituellement ». Proche de l’habitude : refus, sauf si cette proximité corrige une autre lecture. |
| Élévations latérales, 34 jours, 4,9 fois l’intervalle, 60 reps, 139 % | Accepté | Le niveau d’avant est encore là. Une séance ne réinstalle pas le mouvement : nuance, pas sujet. |
| Pompes inclinées, environ 24 puis environ 31,6 | Accepté | Deux niveaux du même mouvement, retrouvés sur les performances récentes. |
| Pompes déclinées absentes des 30 jours d’avant, puis 160 reps, 3 séances, 12,7 % de la poussée | Accepté | Deux états nommés. Trois séances ne font pas une structure installée : une phrase finale, pas la moitié du corps, et pas de futur. |
| 4/6 séances ≥ 300 reps après ≥ 7 h 30, contre 5/8 plus légères après une nuit plus courte | Accepté | Association, effectifs lisibles, pas une cause. |
| 71,2 % de poussée et 112 % de tirage après une nuit courte | Pas une carte | Même relation sommeil et charge. Une phrase possible dans la carte précédente. |
| 524 reps le 30 septembre, 38,2 % des 1 370 | Accepté | Ce n’est pas « une mesure de plus ». C’est la structure de la fenêtre : un jour porte plus du tiers du volume. Type `anomaly` si l’habitude personnelle des journées de renforcement est déjà là et que 524 s’en écarte ; sinon type `fact`, la concentration dans ces 7 jours. Le corps peut nommer les exercices de ce jour seulement comme contexte de cette idée. La limite est que cela décrit cette fenêtre. |
| 308 reps/h contre 330, soit 6,8 % | Refus | Écart proche de l’habitude. Le titre « concentre le travail sur moins de temps » invente une importance. C’est le cas « 290 contre 280 ». |
| 1 370 face à 3 991, lu « pic relativisé » | Refus sous cette forme | La phrase corrige un pic qu’aucune carte ne prétend. Le `factId` reste distinct. La même paire peut devenir une comparaison si elle dit, avec les deux périodes nommées, que ces 7 jours sont hauts, bas ou dans la lignée du mois qui les contient, et si ce sens change la lecture. |
| 1 370 face à 4 556 sur 15 séances, en totaux bruts | Refus | Les fenêtres n’ont pas la même longueur. Un total plus petit sur 7 jours ne veut rien dire. Le `factId` reste distinct de celui des 3 991. La même paire peut passer si les deux côtés utilisent le même rythme, déjà calculé, et si le sens de l’écart est l’idée. |
| Pompes pseudo-planche, 34 jours, sans reps ni moyenne d’avant | Refus | Autre mouvement que les élévations, mais pas la même documentation. |

Une liste de familles ne sort pas. Une lecture de structure sort si l’idée est la relation, comme dans l’exemple du fichier quand deux familles sont au même niveau et que le corps rappelle que des répétitions d’exercices différents ne sont pas la même charge. L’inventaire « 248, 237, 192, 158 » n’est pas cette lecture.

---

## 6. Les trois colonnes

Le rôle décide. Le sens demandé au fil ne décide plus.

**Ce que tu as fait** (`fact`). Ce qui s’est passé dans la fenêtre, y compris une concentration ou un écart à l’intérieur de cette fenêtre. La reprise datée. Le 30 septembre qui porte 38,2 %. Une journée haute, ou une journée basse, par rapport à l’habitude personnelle. Aujourd’hui à 0, avec la dernière séance datée et non renommée « aujourd’hui ».

**Ce que ça change** (`reading`). Ce que ces faits font comprendre. Cela peut être une relation entre deux mesures, comme le sommeil et le volume. Cela peut aussi être une seule mesure relue contre l’habitude : ces 7 jours sont au-dessus, proches, ou en dessous du rythme déjà mesuré. Pas une cause. Pas le total nu répété.

**Ce qui a évolué** (`evolution`). Deux états ou deux périodes nommés. Environ 24 puis environ 31,6. Absentes, puis 12,7 % de la poussée. Une série de fenêtres qui monte, qui baisse, ou qui casse : d’environ X à Y, seulement si X et Y sont déjà dans le dossier. Deux blocs datés de 6 mois. Un mois nommé contre un autre mois nommé.

Une série sans « avant » n’entre pas dans la troisième colonne. Le total nu n’entre dans aucune colonne. Une projection n’entre dans aucune colonne comme si elle était un fait : elle termine le corps d’une tendance, avec la certitude `projeté`.

Forme d’une tendance, pas un chiffre de cet écran. On ne publie pas « environ 10 répétitions de plus par semaine » tant que les fenêtres précédentes ne le montrent pas.

Constat, si deux fenêtres comparables existent déjà : le volume est passé d’environ X à Y.
Tendance, si la série est assez longue pour un rythme : sur les dernières fenêtres, le volume avance ou recule d’environ N par fenêtre.
Projection, dernière phrase seulement : si ce rythme se maintient, la prochaine fenêtre se situerait autour de Z. Cette phrase dit qu’elle dépend du maintien du rythme. Une seule fenêtre de 7 jours ne suffit pas à l’écrire.

Même écran, rôles retenus :

| Idée | Colonne |
|---|---|
| Reprise des élévations latérales | Ce que tu as fait |
| Le 30 septembre porte 38,2 % | Ce que tu as fait |
| Journées lourdes et nuits longues | Ce que ça change |
| Pompes inclinées, 24 puis 31,6 | Ce qui a évolué |
| Pompes déclinées, absentes puis 12,7 % | Ce qui a évolué |
| Mollets du mois contenus dans ces 7 jours | Ce qui a évolué, seulement avec la limite sur les 1 370 |

S’il n’y a qu’une idée, une colonne peut rester vide. On ne déplace pas une carte pour meubler. On n’arrête pas non plus l’examen parce que deux cartes sont déjà fortes. Les preuves restantes sont jugées. Une troisième idée distincte sort si elle révèle autre chose.

---

## 7. Titre et corps

`title` est un champ. Il annonce l’idée. Il ne contient pas la preuve.

`body` est la démonstration, dans cet ordre, en sautant ce qui n’a pas de preuve : constat, contexte de cet utilisateur, comparaison, lecture, nuance, suivi.

`title = lines[0]` cesse. `stripTitleEcho` ne répare plus un titre qui était le corps.

Titres tenus par leur corps, sur les 7 jours réels :

- « Les élévations latérales reviennent après un long silence. » Le corps a les 34 jours, les 4,9 fois, les 60 reps et les 139 %.
- « Le 30 septembre porte une grande part de ces 7 jours. » Le corps a 524 et 38,2 %. Si l’habitude des journées de renforcement est déjà mesurée et que 524 s’en écarte, le corps le dit, vers le haut ou vers le bas. Sans ce repère, la carte reste la concentration dans la fenêtre. Elle ne fabrique pas une moyenne.
- « Les journées lourdes suivent plus souvent une nuit longue. » Le corps a 4/6 et 5/8, puis l’association, pas la cause.
- « Les pompes inclinées ont un niveau plus haut qu’à leur début. » Le corps a environ 24, environ 31,6, et le fait que les performances récentes dépassent l’ancien niveau.
- « Les pompes déclinées prennent une place dans la poussée. » Le corps a l’absence sur les 30 jours d’avant, 160 reps, 3 séances, 12,7 %, puis la limite des trois séances.
- « Ces 7 jours contiennent les mollets du mois. » Le corps a 101 contre 101, puis la petite part dans les 1 370. Sans la seconde phrase, ce titre ne sort pas.

Le libellé de fenêtre dans le corps est celui de `windowA`. « Ces 7 jours » pour la fenêtre du 25 septembre au 1 octobre. « Cette semaine » seulement si la fenêtre est vraiment la semaine calendaire.

---

## 8. Garde-fous

Ces phrases sortent du texte publié. Chacune devient une contrainte du rédacteur. Si la contrainte est la seule chose à dire, il n’y a pas de carte.

| Phrase actuelle | Contrainte |
|---|---|
| « Une présence dans la fenêtre n’est pas une habitude installée. » | Ne pas appeler habitude une seule apparition. |
| « Le volume de la séance est 100, ce n’est pas la série. » | Ne pas appeler série le total, ni record la série observée. |
| « L’écart décrit la composition du volume, pas un déséquilibre à corriger. » | Ne pas transformer un rapport en conseil. |
| « Une seule nuit ne suffit pas à décrire un rythme. » | Sous le niveau de sommeil déjà défini pour un rythme, pas de carte. |
| « La moyenne ne dit pas si une séance porte le total. » | Ne pas présenter la moyenne comme le portrait des séances. Dire le pic si le pic est l’idée. |
| « Cette part décrit la fenêtre, pas une charge identique d’un exercice à l’autre. » | Ne pas lire une somme de familles comme une charge par exercice. |
| « Le record déclaré reste N. La série observée ne le remplace pas. » | Ne pas écrire le record officiel depuis une série saisie. |
| « Ce repère ne dit pas que c’est un problème. » | Un horaire n’est pas un jugement. Pas de carte dont c’est le message. |
| « Ce n’est pas une preuve que le sommeil provoque ce résultat. » | Le corps dit « suit plus souvent » ou « est associé ». Il ne commence pas par la précaution, et il ne dit pas « cause ». |
| « Ce volume mesure l’ampleur de la reprise, pas à lui seul une progression. » | Le 139 % est l’ampleur du retour. « Progression » est réservé à un changement de niveau, comme 24 puis 31,6. |

Même traitement pour « elle ne suffit pas à parler d’un changement de rythme », « ce n’est pas un record déclaré », et les formules parasites déjà bloquées (« dynamique favorable », « se reprend après un creux » sans deux dates, « ~+- »). On ne les reformule pas pour les faire rentrer.

---

## 9. Parenté

L’identité publiée est le `factId`, pas le début de la phrase et pas le `kind`.

Deux formulations de 4/6 et de « les journées denses suivent une nuit longue » ont le même `factId`. Une carte. `disc_sleep_assoc` et `disc_sleep_quarter` sont deux générateurs de cette idée.

1 370 contre 3 991 et 1 370 contre 4 556 n’ont pas le même `windowB`. On ne les fusionne pas. Le premier est la part dans le mois qui contient les 7 jours. Le second est les 30 jours d’avant, 15 séances, sans chevauchement. Chacun peut devenir une carte si le sens de l’écart, haut ou bas, est l’idée, et si les deux côtés sont comparables. Le total brut de 7 jours contre le total brut de 30 jours ne l’est pas. « Pic relativisé » sans idée n’est pas cette carte. S’ils sont publiés, chacun nomme ses deux périodes et ses deux nombres.

Même règle sur les autres fenêtres. 3 467 contre 4 944 et 3 467 contre 5 561 restent deux idées. Deux blocs datés de 6 mois ne sont pas le mois récent. Juillet nommé n’est pas « ces trois mois » sans le dire.

`volumeFingerprint`, qui ne reconnaît une carte que si elle commence par « compte » ou « totalise », n’est plus la parenté de publication. Il peut rester en interne le temps du branchement. La décision visible se fait sur le `factId`.

---

## 10. Le fil concentration

`axesFor` continue de lister ce qui est mesuré. Il ne publie plus.

`dossier()` ne donne plus tous les axes au fil concentration. Sur une fenêtre, ce fil peut proposer plusieurs prétentions séparées. Chacune a une idée. La suffisance trie.

Pour les 7 jours réels, ce fil peut proposer deux prétentions distinctes, pas un dump. La première est la concentration du 30 septembre : 524 répétitions, 38,2 % des 1 370. La seconde est le rythme de ces 7 jours contre l’habitude personnelle, seulement si ce repère est déjà calculé, avec le même dénominateur, et si l’écart est haut ou bas. Les familles, la poussée, la série et le répertoire ne sont pas des axes de ces deux cartes. 4 556 et 3 991 sont d’autres `factId`, jugés à part, pas collés au 30 septembre.

`sentencesOf` ne parcourt plus les axes pour les coller. Il rédige le corps d’une prétention déjà acceptée, à partir des couches qui ont une preuve.

`enough` ne décide plus de l’affichage. Avoir une ligne ne publie plus.

`writeThreadCard` reçoit une prétention acceptée. Il remplit `title` et `body` depuis des champs séparés. Il n’émet plus trois copies parce que trois sens ont été demandés.

Les autres fils deviennent des sources de prétentions, avec la même porte. Un fil qui n’a qu’une statistique n’a pas de prétention acceptée. On ne les supprime pas. On ne leur ajoute pas de question nouvelle.

---

## 11. « Par séance »

`trainingDays` vaut 5 quand le calendrier compte une journée sans date dans `repsByDate`. `repsPerSession` vaut 1 370 / 4, arrondi 343, parce que le diviseur est `strengthDays`. `minutesPerSession`, le « 1 h 07 » de la carte de densité, utilise le même diviseur, avec des minutes qui peuvent inclure la cinquième journée.

Règle de phrase, pour toutes les fenêtres :

- « répétitions par séance » divise par les journées qui portent ces répétitions, et le corps dit ce nombre ;
- « journées entraînées » utilise le calendrier, et le corps le nomme ainsi ;
- une même phrase n’emploie pas les deux populations comme si c’était le même dénominateur.

On ne change pas la définition d’un jour entraîné. On change les phrases qui les mélangent : la ligne de moyenne du fil, et dans `detectDiscoveries` la densité, la forme du volume, le portrait de période, la comparaison au mois précédent, et la comparaison du jour à la moyenne des 7 jours.

Le 343 ne devient pas une carte à lui seul, et il cesse d’être présenté comme 1 370 divisé par 5. Une fois le rythme honnête écrit — 1 370 sur 4 journées de renforcement — il peut servir de fait dans une prétention d’écart, si le même rythme existe déjà sur une fenêtre comparable. Le chiffre inventé « contre 250 habituellement » n’est pas une preuve.

---

## 12. Chaque fenêtre

La porte est la même. Ce qui change, c’est la preuve déjà prévue pour cette échelle. On ne réécrit pas une carte de 7 jours en changeant le titre.

**Aujourd’hui.** Fait : la séance du jour, ou le jour encore vide avec la dernière séance datée. Une séance haute ou basse par rapport aux journées habituelles déjà mesurées est une anomalie, dans le sens que les chiffres donnent. La part de la dernière séance dans les 7 jours est l’idée de concentration, et elle ne s’appelle pas « aujourd’hui ». Lecture : une relation du jour avec une mesure déjà là, par exemple le sommeil de la nuit liée, si l’effectif de la relation existe déjà. Évolution : deux états nommés, pas le total du jour recopié. Un jour à 0 ne produit pas trois cartes de vide. Il peut produire la carte de la dernière séance si cette séance est un écart ou une concentration.

**7 jours.** Les prétentions de la section 6, plus l’écart de rythme s’il est déjà mesuré, et aucune des cartes refusées de la section 5. Le libellé est « ces 7 jours ». Pas de projection « +10 par semaine » sur une seule fenêtre.

**30 jours.** Le total du mois n’est pas une carte parce qu’il existe. Il le devient s’il est haut, bas, ou en rupture avec le rythme personnel déjà mesuré, et le corps dit le sens. Une carte de fait dit aussi comment le mois est fait : un jour ou un mouvement qui concentre le volume. Une évolution nomme les 30 jours et les 30 jours d’avant, ou un niveau ancien et un niveau récent, avec les deux nombres. Une tendance n’est écrite que si plusieurs fenêtres comparables sont déjà là. La projection, s’il y en a une, termine cette carte. « 13 séances » et « 13 jours entraînés » pour le même compte sont un seul `factId`. Une performance « qui se reprend après un creux » sans deux dates et deux nombres ne passe pas.

**3 mois.** L’idée propre à cette fenêtre est un mois nommé qui s’écarte des autres, ou une trajectoire entre deux moments nommés du trimestre. Un mois haut et un mois bas sont deux sens possibles de la même logique. Une carte qui répète le texte des 30 jours, avec la même preuve, a le `factId` des 30 jours : elle ne ressort pas ici sous un autre titre. Le sommeil publié est celui de la fenêtre annoncée. Une tendance sur les mois du trimestre peut se terminer par une projection, seulement si les mois sont déjà mesurés.

**6 mois.** L’évolution propre est les deux blocs datés déjà calculés, avec leurs répétitions et leurs jours, et le sens de l’écart entre eux. Un bloc n’est pas « le mois récent » renommé. Les kcal, le rythme de séances et le sommeil qui appartiennent à 3 mois ne sont pas étiquetés « ces six mois ». S’ils sont montrés, leur `windowA` dit leur vraie période, et seulement si l’idée n’est pas déjà sur l’écran de 3 mois pour la même preuve. Une projection sur six mois s’appuie sur ces blocs, pas sur une fenêtre de 7 jours.

**1 an.** Même porte. Les idées déjà prévues sont la couverture réelle, les mois extrêmes, et le début contre la fin. Pas de capture validée à ce jour : on n’invente pas les cartes. Le jour où l’écran existe, une carte dont les chiffres commencent après le début affiché le dit, comme la note de couverture déjà prévue, sans réécrire un total de répétitions en phrase de calendrier.

Sur toutes ces fenêtres, une même relation sommeil et charge ne produit qu’une carte. Une nuit unique n’en produit pas. Une série sans avant n’entre pas dans « Ce qui a évolué ».

---

## 13. Anciens détecteurs

`detectDiscoveries`, `detectRecapMilestones` et le catalogue continuent de calculer ce qu’ils calculent. Le coach hors Récap n’est pas touché.

À l’entrée des colonnes du Récap, leur texte devient une prétention, ou il n’entre pas. Un détecteur qui a franchi son seuil n’a pas pour autant une carte. `disc_muscle_reorient` ne publie plus « le stimulus se déplace » parce que 101 / 101 passe 18 %. `disc_density` ne publie plus un écart qui ne change pas la lecture. `disc_ms_event_combo` ne republie pas le 139 % déjà dit par le jalon de reprise. `exercise_return` ne publie pas un retour sans reps et sans moyenne d’avant.

On ne réécrit pas chaque détecteur un par un. La porte est unique, avant `selectNarrativeColumns`.

---

## 14. Ordre d’exécution

Chaque étape est vérifiée sur les données réelles avant la suivante. Un test unitaire vert ne clôt pas l’étape.

1. **Prétention et suffisance, sans changer l’écran.** Fonctions pures. Les cas de la section 5 sont des tests : publié ou refusé, avec la raison sémantique, pas un score. Les `factId` de 3 991 et de 4 556 sont distincts. Les deux phrases de sommeil 4/6 ont le même `factId`.
2. **Le fil concentration propose des prétentions, il n’empile plus.** Sur la fixture 7 jours, la concentration du 30 septembre passe. L’écart de rythme passe seulement si le repère habituel est déjà dans la fixture, avec le même dénominateur. Un jour proche de l’habitude ne passe pas. `enough` n’est plus appelé pour publier. Le test qui a déjà deux cartes acceptées continue d’examiner le reste du dossier.
3. **La porte unique avant la sélection.** Fils, détecteurs, jalons et catalogue y passent. L’écran 7 jours ne montre plus le dump, la liste de familles, la nuit unique, la série 20 dans les évolutions, le second sommeil, ni « le stimulus se déplace ».
4. **Titre et corps séparés.** Les garde-fous de la section 8 sont absents du texte affiché. Ils restent comme contraintes : une série n’est toujours pas un record, une association n’est toujours pas une cause.
5. **Parenté par `factId`.** Elle remplace l’empreinte d’ouverture pour la publication. Deux comparaisons à deuxième période différente survivent toutes les deux si chacune a été acceptée.
6. **Phrases « par séance ».** 343 n’est plus écrit comme la moyenne de 5 séances. Le corps qui a besoin du total dit 4 journées de répétitions et, à part, 5 journées entraînées au calendrier. On vérifie les autres fenêtres qui utilisent `repsPerSession` à côté de `trainingDays`.
7. **Les autres fenêtres, une par une.** Aujourd’hui, puis 30 jours, puis 3 mois, puis 6 mois. 1 an seulement si l’écran est ouvert. À chaque fois : quelles prétentions passent, lesquelles restent dans le dossier, et pourquoi. On ne corrige pas la fenêtre suivante en cassant la précédente.
   ---

## 15. Fichiers

À modifier, dans l’ordre des étapes :

- un module de prétention et de suffisance, appelé avant la sélection ;
- `src/utils/sport/recapAnalysisProofs.js` : `dossier`, `axesFor`, pour proposer des prétentions ;
- `src/utils/sport/recapAnalysisDepth.js` : `sentencesOf`, `enough`, `writeThreadCard` ;
- `src/utils/sport/recapAdaptiveInsights.js` : la porte, et `stripTitleEcho` retiré de son rôle de réparation ;
- `src/utils/sport/recapCardKinship.js` : publication par `factId` ;
- les phrases de `repsPerSession` dans `src/utils/sport/recapPeriodDiscoveries.js`, à l’étape 6 seulement.

À ne pas modifier :

- `src/utils/sport/recapTrainingDayTruth.js` ;
- les seuils, le plafond 10, les records déclarés, les blocs, la couverture ;
- le coach hors des colonnes du Récap ;
- le dossier de preuves, sauf si une étape montre un nombre faux. Le 343 n’est pas un nombre faux : c’est 1 370 / 4. La phrase qui le colle à 5 séances est fausse.

---

## 16. Tests

Fixture unique, les chiffres de l’écran, pas un objet « non null » :

1 370 reps, 5 journées calendrier, 4 dates dans `repsByDate`, 643 poussée, 343 tirage, 100 mollets, série 20, une nuit, 1 370 dans 3 991, 4 556 sur 15 séances, 34 jours et 139 %, environ 24 puis environ 31,6, 160 reps et 12,7 %, 524 et 38,2 %, 4/6 et 5/8.

La sortie finale est lue. Chaque carte a un `factId` distinct, un `analysisType`, un rôle égal à sa colonne, un titre qui n’est pas la première phrase du corps, et un corps qui contient les chiffres de sa prétention. Les refus de la section 5 sont absents. 3 991 et 4 556 ne partagent pas un `factId`. 343 n’est pas la moyenne de 5. Une journée haute et une journée basse sont toutes les deux acceptées quand l’écart avec l’habitude est le même en importance. Une journée proche de l’habitude est refusée. Aucune projection « par semaine » n’apparaît sur la seule fenêtre de 7 jours. Le juge ne s’arrête pas après la deuxième acceptation.

Les autres fenêtres ont leur fixture à l’étape 7, construite depuis l’écran réel de cette fenêtre, avec la même lecture : idée, rôle, périodes, limite. On ne vérifie pas un nombre de cartes. On vérifie que chaque carte affichée apporte une compréhension que les autres ne portent pas, et que le reste est resté dans le dossier.

---

## 17. Fini quand

Sur Aujourd’hui, 7 jours, 30 jours, 3 mois et 6 mois, chaque carte visible peut se résumer par « cette carte montre que … », le corps le démontre, le titre ne le démontre pas à sa place, et la colonne correspond au rôle. Une preuve vraie qui ne révèle rien n’est pas à l’écran. Une preuve qui révèle un écart, une concentration, une relation, une évolution ou une tendance y est, même si elle tient sur une seule mesure. Le sens haut et le sens bas ont le même droit. Une projection n’y est que comme dernière phrase d’une tendance déjà mesurée.

Le fichier d’exemple est alors le comportement du moteur : ce que le chiffre révèle dans l’historique de cet utilisateur, avec la nuance, et seulement ensuite un suivi. Pas un tableau de statistiques habillé en cartes. Pas non plus un filtre qui jette une mesure importante parce qu’elle n’est pas reliée à une deuxième mesure.
