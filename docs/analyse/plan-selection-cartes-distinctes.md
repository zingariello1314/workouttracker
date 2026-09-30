# Plan — des cartes distinctes, pas plus de cartes

Référence de niveau : `but a atteidnre en temre danalyses .md`.
Plan déjà exécuté en code, pas en résultat : `plan-niveau-exemple-dix-par-colonne.md`.

Ce fichier ne rajoute ni fil, ni métrique, ni seuil. Il ne remplit pas les colonnes. Il apprend à la sélection à reconnaître qu’une même preuve, découpée en plusieurs kinds, reste une seule information pour l’utilisateur.

**10 reste un plafond, jamais une cible.** Le vrai objectif, quand les données sont riches, est une bande de cartes réellement distinctes. En dessous de cette bande, on ne fabrique rien. Au-dessus, on coupe les copies, pas les preuves nouvelles.

| Fenêtre | Cartes distinctes visées, si les preuves le permettent |
|---|---|
| Aujourd’hui | 2 à 4 |
| 7 jours | 3 à 5 |
| 30 jours | 4 à 6 |
| 3 mois | 4 à 6 |
| 6 mois | 4 à 6 |
| 1 an | 4 à 6 |

Une carte n’entre dans le compte que si elle ne répète pas le fait central d’une carte déjà retenue dans la même fenêtre.

---

## 1. Avis

Le diagnostic est le bon. Le moteur a assez de matière. Le défaut visible sur l’écran réel n’est plus le manque de cartes. C’est la parenté ignorée : le même total, les mêmes 13 séances, les mêmes familles, réécrits une fois par tag.

Quatre précisions, pour ne pas corriger à côté.

1. La sélection est bien l’endroit du chantier. Le dossier de preuves reste. Une exception, et une seule : la continuité d’Aujourd’hui écrit aujourd’hui un faux. Si le jour est à 0, elle met les répétitions de la dernière séance dans le côté étroit et l’étiquette « aujourd’hui ». Ce n’est pas une nouvelle preuve. C’est une preuve fausse. On la retire. On ne redessine pas le dossier.

2. « Une preuve dominante, une seule carte » ne doit pas tuer une deuxième dimension. Le total et sa part vivent dans la même carte. Une famille qui entre, une série qui n’est pas le total, un bloc de six mois qui n’est pas le mois, restent publiables **si leur phrase n’ouvre pas par le total déjà dit**. Sinon on garde la carte dominante et on jette le dérivé.

3. Le sens ne change toujours pas le texte. Fait, relation et transformation reçoivent les mêmes phrases, puis la sélection les pose dans deux colonnes. Le plan précédent l’interdisait déjà (« jamais trois copies »). Le code ne l’a pas fait, parce que la phase 8 disait de ne pas toucher à la sélection. Cette phase est close. La sélection doit maintenant connaître la parenté.

4. Les cartes parasites (« ~+-158.4 », « dynamique favorable », « se reprend après un creux », « objectif hypertrophie / définition ») ne viennent pas du rédacteur de fils. Elles viennent de l’ancien rendu d’interprétation, encore branché sur les colonnes du Récap. On les bloque à l’entrée du Récap. On ne supprime pas le système coach qui s’en sert ailleurs.

Le calibrage du titre est un cinquième point, distinct de la déduplication. « Le seuil des 7 h 30 sépare… » affirme plus que le corps, qui dit seulement « associé ». Le titre ne peut pas être plus sûr que le corps. On ne recalcule pas les seuils de sommeil.

---

## 2. Vérification du plan précédent

Lu contre l’écran réel du 30 septembre 2026 (Aujourd’hui à 6 mois). 1 an n’était pas dans la capture : cette fenêtre n’est pas validée. Les tests synthétiques verts ne comptent pas comme exécution.

| Phase du plan précédent | Code présent | Résultat sur l’écran réel |
|---|---|---|
| −1 Matrice des preuves | Oui. Reps par famille d’une séance laissées vides, comme la matrice l’autorisait | Conforme. Pas à rouvrir |
| 0 Contrat du rédacteur | `writeThreadCard` existe et retourne `null` sans les champs requis | Partiel. La troisième phrase répète souvent la première. Le test vérifie des fixtures, pas « la colonne fait ≠ la colonne évolution » |
| 1 Aujourd’hui et 7 jours, fils 1, 2, 4, 10 | Dossiers et cartes émis | Non. Le fait et l’évolution republient le même corps. Aujourd’hui à 0 est écrit « aujourd’hui (436) : pic confirmé ». Le fil 10 sort dès qu’une part est calculable |
| 2 Familles, poussée/tirage, série | Présents dans le corps | Partiel. Série 20 contre volume 100 : juste. « Exercice 1617018301 », « Exercice 561717381 », et un « 80 » sans nom : le nom n’est pas résolu. Une seule série égale au volume de séance est encore appelée « meilleure série » |
| 3 Sommeil | Le rédacteur consomme le profil. Une nuit n’écrit pas « habitude » | Partiel. Le même paragraphe de rythme est publié deux fois dans la même colonne (30 jours, 3 mois, 6 mois). Le titre « sépare » dépasse le corps |
| 4 30 jours | Cartes de volume et de fréquence | Non sur un point nommé : « performance qui se reprend après un creux » est encore à l’écran, sans chiffres. 13 séances et 13 jours entraînés sont le même compte, dit deux fois |
| 5 3 mois | Mois nommé (juillet), course en km et en minutes de course | Partiel. L’échelle du fil concentration change. D’autres cartes restent celles de 30 jours |
| 6 6 mois | Deux blocs datés, avril–juin et juillet–septembre | Partiel. Les blocs sont réels. Le sommeil (39 nuits, 4 h 08 / 12 h 44), 38 086 kcal, et le rythme 3 contre 3,8 séances/semaine sont ceux de 3 mois |
| 7 1 an | `coverageFrom` existe | Non validé. Pas de capture |
| 8 Branchement | Les fils entrent dans `buildPeriodDiscoveryBundle` | Fait, et c’est la cause du problème. La consigne était « la sélection existante ne change pas ». Elle a donc traité chaque dérivé comme une découverte neuve |
| 9 Écran | Lu | La continuité s’affiche sans changer la lecture. 3 mois et 6 mois partagent des cartes. 1 an non lu |

Écart de fichier par rapport au tableau du plan précédent : `recapAnalysisThreads.js` nomme les dix fils et leur famille. Il ne contient ni la question par fenêtre, ni l’ordre de repli. Ces questions sont restées dans le plan. Le rédacteur ne les utilise pas : le fil concentration garde tous les axes, les autres fils reprennent la phrase de volume plus un axe.

Ce qui est réellement tenu, et qu’on ne défait pas :

- une nuit : pas « habitude » ;
- série observée séparée du total de séance quand les deux nombres existent ;
- record déclaré non réécrit sur les cartes de fil qui ont les deux nombres ;
- 6 mois a deux blocs issus des dates, pas un 30 jours renommé ;
- 3 mois nomme un mois ;
- le sommeil reste une association sur les cartes qui le disent explicitement ;
- le plafond 10 n’est pas devenu un quota ;
- le rédacteur de fils n’a pas créé de seuil numérique.

---

## 3. Ce qu’on ne rouvre pas

- Le dossier de preuves, ses champs, ses fenêtres, ses blocs, sa couverture d’année.
- Les seuils : 32, sommeil, séances comparables à 0,32, détecteurs de structure installée.
- Le parseur Garmin.
- Les dix fils comme sujets.
- Le système coach (`interpretationRenderer`, transitions d’état) en dehors des colonnes du Récap.
- L’idée d’ajouter de la profondeur ou un onzième fil pour « faire mieux ».

---

## 4. Les règles

Elles s’appliquent après le dossier, avant qu’une carte entre dans une colonne. Le rédacteur de fil peut encore produire plusieurs kinds en interne. La sélection n’en publie qu’une représentation par parenté.

### Règle 1 — Une preuve dominante, une carte par colonne

Pour une fenêtre, le total de répétitions et le nombre de séances forment la preuve dominante de volume.

Exemple réel, 30 jours : « 3 467 répétitions sur 13 séances » est une information. Elle a droit à une carte dans « Ce que tu as fait ». Elle n’a pas droit à une deuxième carte dans « Ce qui a évolué », ni à une carte dont le titre est cette même phrase suivie des familles, de la continuité, du répertoire ou de la série.

La carte gardée est celle qui porte déjà le plus de dimensions **sans répéter**. Les dérivés qui n’ajoutent qu’un tag tombent.

### Règle 2 — Parenté explicite

Chaque candidat de fil porte un `evidenceFamilyId` stable sur la fenêtre :

```
volume_30d_2026-09-30
```

La date est la fin de fenêtre, pas un nouveau calcul. Les kinds suivants, sur cette fenêtre, partagent cet identifiant dès qu’ils ouvrent par le même total :

- concentration (le dossier complet) ;
- composition (familles) ;
- pushPull ;
- series ;
- repertoire, quand la phrase commence par le total ;
- continuity, quand la phrase commence par le total ;
- rhythm, quand il reprend le même total au lieu d’une échelle propre à la fenêtre.

Plafond par `evidenceFamilyId` et par colonne :

| Colonne | Maximum |
|---|---|
| Ce que tu as fait | 1 |
| Ce que ça change | 1, et seulement si la phrase n’est pas déjà dans la carte de fait |
| Ce qui a évolué | 1, et seulement si la comparaison nomme deux périodes et change la lecture |

Une carte d’une autre famille de preuves n’est pas comptée dedans. Exemples qui restent des familles séparées, parce que leur fait central n’est pas « 3 467 sur 13 » :

- une série nommée, avec son meilleur set et le volume de séance à côté, sans répéter le total de fenêtre ;
- un mouvement qui entre ou qui sort, avec ses propres reps ;
- un bloc daté de 6 mois, ou un mois nommé de 3 mois ;
- une nuit, au niveau déjà produit par le profil ;
- un jalon déjà détecté, s’il a ses chiffres.

Si le dérivé ne sait dire sa dimension qu’en recommençant par le total, il n’est pas publié. On ne réécrit pas le dossier pour lui inventer une phrase.

### Règle 3 — Même source, une seule réécriture

Deux candidats dont les nombres centraux sont les mêmes sont le même texte-source, même si le kind diffère.

Empreinte, construite avec les nombres déjà dans la carte, rien d’autre :

```
3467|13|289|1106|697
```

Soit : total, séances, reps par séance, poussée, tirage, dans cet ordre, en omettant un champ absent. Même empreinte dans la même fenêtre : une seule carte publiée, la plus complète. Les autres sont éliminées, y compris si elles vivent dans une autre colonne.

Cas réel à éliminer : la carte « Ces 30 jours compte 3 467 répétitions sur 13 séances… » présente à la fois dans « Ce que tu as fait » et dans « Ce qui a évolué ».

Cas réel à ne pas fusionner : 3 467 contre 4 944 (les 30 jours d’avant) et 3 467 contre 5 561 (le début des trois mois). Les deux peuvent être vrais. Chacun doit nommer **les deux** périodes et **les deux** nombres. Si l’un des deux ne fait que répéter l’autre, il tombe. Le nombre 3 467 seul ne suffit pas à les distinguer.

### Règle 4 — Claims invalides, avant le rédacteur de colonne

Bloqués, pas reformulés en douce par un autre système.

**Aujourd’hui à 0.** `today.reps` et `lastSession.reps` restent deux champs. La continuité n’a pas le droit de poser `lastSession.reps` dans le côté étroit étiqueté « aujourd’hui ». Phrase autorisée, et une seule :

> Aujourd’hui n’a encore aucune répétition enregistrée. Ta dernière séance, le 29/09/2026, totalisait 436 répétitions.

Phrase de continuité autorisée seulement ainsi, parce qu’elle ne renomme pas le jour :

> Ces 436 répétitions représentent 51,5 % des 846 répétitions des 7 derniers jours.

Interdit : « aujourd’hui (436 répétitions) », « pic confirmé » sur un jour à 0.

**Artefacts de l’ancien rendu.** Un candidat dont le texte contient l’un de ces motifs n’entre pas dans une colonne du Récap :

- `~+-` ou une vitesse du type `~+` collée à `reps/sem` sans dire quel exercice accélère ;
- `dynamique favorable` ;
- `reste prudent` ;
- `objectif hypertrophie / définition`, ou la même injection d’objectif, si l’objectif n’est pas une donnée affichée par la carte elle-même ;
- `se reprend après un creux` sans les deux niveaux chiffrés et les deux dates.

Source actuelle, à ne pas détruire hors Récap : `src/utils/sport/interpretationRenderer.js` (`progression_accelerating`, et le suffixe d’objectif), `src/utils/sport/trainingStateTransitions.js` (« qui se reprend après un creux »), appelés depuis `src/utils/sport/recapInterpretationPipeline.js`. Le blocage est un filtre à l’entrée des colonnes Analyse. Le coach peut continuer à rendre ces phrases ailleurs.

**Titre plus fort que le corps.** Si le corps dit « semble associé », « observé après », ou donne une fraction du type 4/6 et 5/8, le titre ne peut pas dire « sépare », « la plus sensible », « démontré », « cause ». On reprend le niveau de certitude déjà dans le corps. On ne recalcule pas 7 h, 7 h 30, ni les effectifs.

Avec 7 et 8 séances, « la qualité la plus sensible » ne sort pas. La phrase chiffrée, elle, peut rester si le détecteur l’avait déjà publiée : poussée à 71,2 % de son volume habituel, tirage à 112,0 %. « Tombent à 112 % » est faux : 112 % n’est pas une baisse. Si le nombre est au-dessus de 100, le verbe de baisse est interdit.

### Règle 5 — Le vocabulaire suit le champ

Un même champ n’a qu’un mot dans la fenêtre.

- `trainingDays` se dit « jours entraînés » partout, ou « séances » partout, pas les deux pour le même nombre.
- 101 répétitions de mollets et 100 mollets debout ne se contredisent que si le texte les pose côte à côte sans dire d’où vient la répétition restante. Soit la carte nomme l’autre exercice, soit elle ne cite que le mouvement dont elle a le détail.
- Toute comparaison cite ses deux étiquettes déjà présentes dans le dossier (`les 30 jours d'avant`, `les 7 derniers jours`, le mois nommé, le bloc daté). « Le mois » seul, « la période », « aujourd’hui » pour un autre jour : refusé.

---

## 5. Où ça se branche

Pas de nouveau moteur. Trois points, dans cet ordre.

| Lieu | Rôle |
|---|---|
| `recapAnalysisProofs.js`, fonction `continuityFrom` pour `today` seulement | Si `period.totalReps` est 0, ne pas remplir le côté étroit avec `lastSession`. La dernière séance reste dans `observed.lastSession` |
| Frontière des colonnes, avant `selectNarrativeColumns` | `evidenceFamilyId`, empreinte, plafond 1 par famille et par colonne, rejet des motifs parasites, rejet d’un titre plus affirmatif que le corps |
| `writeThreadCard` | Un fil dérivé (composition, pushPull, series, repertoire, continuity) n’ouvre pas par la phrase de volume si cette phrase est déjà celle du fil concentration de la même fenêtre. S’il n’a plus rien à dire, `null` |

La sélection existante (score, mémoire, rotation, seuil 32, plafond 10, plafond sommeil 2) ne change pas ses nombres. La parenté passe **avant** elle : une copie n’arrive pas au score.

`usedKind` global ne suffit pas. Il empêche le même kind, pas le même texte sous un autre kind. C’est précisément le trou actuel : `disc_th_concentration_now` et `disc_th_concentration_journey` sont deux kinds, un seul paragraphe.

---

## 6. Ordre

**Étape A — Preuve fausse d’Aujourd’hui.**  
Retirer la substitution dernière séance → aujourd’hui dans la continuité.  
Validation sur l’écran : le 30 septembre 2026, 0 répétition, ne contient plus « aujourd’hui (436 » ni « pic confirmé ». La dernière séance reste datée 29/09, 436 répétitions. La part 51,5 % des 7 jours est autorisée seulement si elle ne dit pas « aujourd’hui (436) ».

**Étape B — Parenté et empreinte.**  
Une fenêtre, une famille de volume, une carte publiée.  
Validation sur 30 jours : « 3 467 répétitions sur 13 séances » apparaît une fois. Les cartes « families, volume », « continuity, volume », « pushPull, volume », « repertoire, volume », « series, volume » qui recommencent par cette phrase disparaissent. Il doit rester, si leurs phrases propres existent sans ce préambule, au plus une carte de série, une carte de mouvement entré ou sorti, une carte de comparaison qui nomme les deux périodes.

**Étape C — Parasites et titres.**  
Les motifs de la règle 4 n’apparaissent dans aucune des six fenêtres du Récap Analyse.  
Validation : plus de « ~+-158.4 », plus de « dynamique favorable », plus de « se reprend après un creux » sans chiffres, plus de « sépare » en titre au-dessus d’un corps qui dit « associé ». « Tombent à 112 % » corrigé ou retiré.

**Étape D — Relire l’écran, sans nouveau fil.**  
Aujourd’hui, 7 jours, 30 jours, 3 mois, 6 mois, et 1 an si la capture est là.  
Pour 6 mois : les deux blocs restent ; le paragraphe de 39 nuits et les 38 086 kcal ne sont pas recopiés depuis 3 mois s’ils décrivent une autre fenêtre. S’ils décrivent vraiment les mêmes nuits, une seule carte le dit, et elle nomme la fenêtre réelle (les nuits mesurées, pas « ces six mois » si le profil n’a que 92 jours).  
1 an : tant qu’il n’y a pas de capture, l’étape D ne déclare pas la fenêtre validée.

On ne code pas B avant que A soit vrai sur un jour à 0. On ne code pas un nouveau fil entre ces étapes.

---

## 7. Fini quand

Sur l’écran Récap, pas sur un test qui ne fait que `not.toBeNull()` :

- Aujourd’hui à 0 ne porte pas le total de la veille sous l’étiquette « aujourd’hui » ;
- dans chaque fenêtre, le total et le nombre de séances n’apparaissent que dans une carte ;
- « Ce que tu as fait », « Ce que ça change » et « Ce qui a évolué » ne contiennent pas le même paragraphe ;
- une carte dérivée qui n’ajoute pas une dimension absente de la carte dominante est absente ;
- deux comparaisons du même total nomment chacune leurs deux périodes ;
- aucun motif parasite de la règle 4 ;
- aucun titre plus affirmatif que son corps ;
- 6 mois garde ses deux blocs, et ne répète pas une carte de 3 mois dont les nombres décrivent une fenêtre plus courte ;
- 1 an n’est déclaré fait que lorsqu’une capture montre une coupe que 6 mois n’a pas ;
- le nombre de cartes tombe dans la bande du tableau, ou en dessous s’il n’y a pas assez de preuves distinctes ;
- le seuil 32, les seuils de sommeil et le dossier de preuves, hors la substitution d’Aujourd’hui, sont inchangés.

Le test utile charge les cartes réellement produites pour une fenêtre riche (les 7 jours à 846 reps, ou les 30 jours à 3 467) et affirme : une seule carte contient « 846 répétitions sur 4 séances » ou « 3 467 répétitions sur 13 séances » ; aucune carte de cette fenêtre ne contient « aujourd’hui (436 » quand le jour est à 0 ; aucune ne contient `~+-` ni `dynamique favorable`.

---

## 8. Ce qui ne se fait pas

- Remplir jusqu’à 10, ou jusqu’à la borne haute de la bande.
- Ajouter un fil, une métrique, un seuil, pour compenser les cartes retirées.
- Réécrire le dossier de preuves, sauf la substitution dernière séance → aujourd’hui.
- Fusionner deux comparaisons vraies (4 944 et 5 561) sous prétexte qu’elles partagent 3 467.
- Supprimer `interpretationRenderer` ou les transitions d’état du coach.
- Recalculer le sommeil, les records, ou la structure installée.
- Considérer des tests verts comme la fin du chantier tant que l’écran répète « 3 467 répétitions sur 13 séances ».
