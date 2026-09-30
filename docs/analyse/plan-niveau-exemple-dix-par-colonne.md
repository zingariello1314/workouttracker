# Plan — analyses du niveau de l’exemple, de Aujourd’hui à 1 an

Référence de niveau : `but a atteidnre en temre danalyses .md`.
Ce fichier décrit **ce qu’il faut construire**. Il ne réécrit pas les cartes.

L’architecture ne change pas : dix fils, six fenêtres, trois colonnes, un rédacteur, puis la sélection déjà en place. Lorsque les données sont assez riches, le moteur doit atteindre la densité, la profondeur et la variété de l’exemple des 30 textes d’Aujourd’hui. Cette richesse vient du croisement de dimensions mesurées, pas du nombre de phrases. Si le dossier est trop mince, on publie moins de cartes.

**10 est un plafond, jamais une cible.** Une colonne peut afficher 4, 7 ou 10 cartes. On ne crée jamais une carte pour atteindre 10. Le seuil 32 et les règles de disponibilité passent avant le remplissage. Mieux vaut une place vide qu’une carte faible.

---

## 1. Le niveau à atteindre

Une carte n’est pas « une donnée + une phrase ». Elle part du **fait central de son fil** et elle utilise tous les axes disponibles et pertinents parmi la liste suivante. Un axe sans donnée est omis. Le rédacteur n’invente jamais une relation, une nuance ou une comparaison pour atteindre un nombre minimal de questions.

Une carte de sommeil n’a pas à répondre aux mêmes axes qu’une carte de concentration.

1. Qu’est-ce qui s’est passé ?
2. Quelle est l’ampleur ?
3. Est-ce habituel chez cet utilisateur, ou seulement observé ? Le mot vient du niveau de certitude **déjà décidé** en amont.
4. Comment cela se compare-t-il à la période précédente, ou à la fenêtre juste plus large ?
5. Qu’est-ce que cela révèle sur l’entraînement, en reliant au moins deux dimensions ?
6. Que permet raisonnablement de conclure le chiffre, et quelle limite empêche d’aller plus loin ?
7. Qu’est-ce qu’il serait pertinent de reproduire ou de surveiller ensuite ?
8. Y a-t-il une relation avec une autre donnée déjà mesurée ?
9. Quelle nuance chiffrée empêche une conclusion trop forte, lorsqu’une relation existe ou qu’une limite mesurée est nécessaire ?
10. Justification éditoriale, **pour la sélection seulement** : pourquoi cette carte, pourquoi cette fenêtre, pourquoi maintenant, pourquoi elle passe devant une autre. Cette justification ne s’écrit pas dans le texte. Interdit : « Cette information mérite d’être montrée maintenant parce que… »

Les trois colonnes ne sont pas trois longueurs du même texte.

| Colonne | Fonction | Axes qu’elle porte quand le dossier les contient |
|---|---|---|
| Ce que tu as fait | le fait observé | 1, 2, 3 |
| Ce que ça change | ce que le fait modifie dans la lecture | 5, 6, 8, 9 |
| Ce qui a évolué | la trajectoire par rapport à avant | 4, 7, et le passage d’un état à un autre |

Même fil, trois sens possibles. Jamais trois copies. Jamais trois cartes obligatoires.

### Chaînage narratif

Les cartes d’une même fenêtre doivent pouvoir exploiter les mêmes preuves sous des angles différents et construire une lecture cohérente de la fenêtre, sans répéter le même constat.

Le fait, le changement et l’évolution se répondent. Ils ne sont pas trois statistiques indépendantes.

- Ce que tu as fait : 436 reps sur 4 jours.
- Ce que ça change : ces 436 reps sont concentrées sur 2 familles qui représentent 71 % du volume.
- Ce qui a évolué : les 4 jours font un jour de plus que les 30 jours précédents, mais les reps par séance ont baissé de 14 %.

Même dossier, trois rôles. Si le troisième angle ne fait que redire le premier, il n’est pas émis. Le chaînage ne crée pas de chiffre : il réutilise ceux que le dossier a déjà.

Exemple de barre, fil « mollets », trois lectures différentes :

- Fait : 100 reps de mollets debout le 29 septembre, environ 12 % du volume identifié de la semaine.
- Changement : cette part pèse déjà dans la composition, mais une fenêtre ne suffit pas à dire « habitude ».
- Évolution : les mollets entrent pendant que les oiseaux penché passent de la fenêtre précédente à 0.

Le total et sa part vivent dans **la même** carte. Ils ne justifient pas deux cartes.

### Ce qu’on appelle une carte profonde

La longueur n’est jamais la mesure de la profondeur. Cinq phrases qui redisent le même constat restent une carte pauvre.

Une carte est profonde seulement si elle combine **au moins deux dimensions distinctes** parmi : volume, fréquence, composition, comparaison temporelle, répétition ou historique, relation entre données, nuance, continuité.

Garde-fou habituel, lorsque le dossier le permet :

- 3 éléments analytiques distincts ;
- au moins 2 chiffres qui décrivent **deux dimensions différentes** ;
- au moins 1 comparaison ou 1 nuance attachée à une observation déjà chiffrée ;
- pour les fils 1, 2, 3 et 10, la continuité **si** le dossier la fournit.

Ce garde-fou n’est pas une obligation absolue. Une carte plus courte reste publiable si le dossier est pertinent sans comparaison temporelle. Exemple qui ne doit pas être supprimé : « 186 reps sur 5 exercices, dont les tractions à 42 % du volume, concentrées sur une seule séance. » Ici il y a déjà le volume, la composition et la concentration. L’absence d’une fenêtre précédente ne suffit pas à retourner `null`.

On retourne `null` seulement si le texte ne ferait que rallonger un seul constat, ou si un champ requis du fil manque. On ne rallonge pas pour atteindre 3 éléments.

Une carte est refusée si sa troisième phrase n’apporte aucune information nouvelle mesurable, comparative ou explicative. Une phrase qui reformule le chiffre précédent ne compte pas comme profondeur.

Deux valeurs sont deux preuves distinctes seulement si elles décrivent deux dimensions différentes du phénomène. Un total et sa part ne suffisent pas, à eux seuls, à créer deux cartes.

Une nuance sans chiffre n’est jamais une carte autonome. « Les données ne permettent pas encore de… » n’existe que collé à une observation chiffrée déjà établie. Sinon : `null`.

### Trois niveaux de moteur

Mauvais : 436 reps, 48 %, une phrase.

Intermédiaire : 436 reps, 48 % de la semaine, une comparaison précédente, trois phrases.

Celui que ce plan construit, **quand le dossier contient ces mesures** : 436 reps, 48 % de la semaine, 4 jours, reps par séance, volume et jours de la fenêtre précédente, exercices du pic, jour comparable, fenêtre de 30 jours, continuité 7 jours vers 30 jours. Le rédacteur assemble. Il n’invente aucun de ces chiffres.

---

## 2. Règles déjà verrouillées

Ces règles ne se rediscutent pas dans l’implémentation.

### Colonnes et sélection

- La période ne change pas la nature d’une carte. Aujourd’hui / 7 j / 30 j / 3 mois / 6 mois / 1 an disent **quelles données sont assez denses** et **à quelle échelle** on lit. La colonne dit si on lit un fait, une relation ou une transformation.
- 10 est le plafond d’une colonne. Il n’existe aucune obligation de le remplir.
- La même donnée peut nourrir plusieurs colonnes seulement si le **sens** change : fait, relation, transformation. Le même chiffre peut être réutilisé si son rôle change. Le même constat reformulé ne le peut pas.
- Deux synonymes d’une même idée ne font pas trois cartes. Mieux vaut une place vide qu’une carte faible.
- Mémoire : sujet + sens + état. « Dos 42 % » puis « dos 43 % » est la même idée (bande de 10 points ; deltas de volume ±8). Une vraie escalade fait, puis relation, puis transformation n’est pas bloquée.
- Rotation : mélange seulement si les deux meilleurs scores de base **de la même colonne** sont à 3 points ou moins. Une carte faible ne passe pas devant une carte clairement plus forte.
- La priorité de fil intervient **uniquement après** le score de base et les gardes existantes. Elle départage des cartes déjà assez proches (écart de base ≤ 3). Elle ne fait jamais passer une carte faible devant une carte clairement plus forte.
- Seuil de colonne inchangé : score de base &lt; 32, on s’arrête. Pas de bonus nouveau pour « faire une relation ». On ne baisse pas ce seuil pour remplir.
- Les phénomènes continuent d’écarter les essais en amont.
- On approfondit un fil qui a déjà ses chiffres, ou on remplace le corps court par la version profonde du même sujet et du même sens. On n’ajoute pas une seconde carte pour faire du volume.

### Sommeil

- Trois couches jamais fondues en conclusion normative : (A) ce que la personne fait, (B) un repère général, (C) une association personnelle.
- « Tardif » n’est pas « mauvais ». Association seulement au-dessus du plancher déjà en place (4 séances de chaque côté, 12 %, 35 en absolu). Corrélation n’est pas causalité.
- Vocabulaire autorisé : associé à / observé après / aucune relation claire. Interdit : « fait baisser », « à cause du sommeil ».
- Sujets : `sommeil.rythme` (placement), `sommeil.regularite` (dispersion, fait seulement), `sommeil.repere` (relation, tombe en premier si la colonne est pleine), `sommeil.weekend` (relation, et **quel axe** a bougé), `sommeil.tolerance` (relation, seulement si publiable), `sommeil.dose` (durée déjà écrite, on ne la réécrit pas).
- Certitude selon l’historique, sans toucher aux seuils de durée 7 h / 7 h 30 / 8 h. Ces niveaux sont **décidés par `sleepRhythmAnalysis`**, pas par le rédacteur :
  - 1 nuit complète : observation. Le mot « habitude » est interdit.
  - 4 à 7 nuits sur au moins 7 jours : « actuellement », médiane, dispersion si l’écart le justifie.
  - au moins 8 nuits sur au moins 14 jours : « rythme habituel récent ». Nuit atypique (≥ 90 min de la médiane) seulement à ce niveau.
  - au moins 14 nuits sur au moins 28 jours : dérive si le dernier tiers s’écarte du premier d’au moins 45 min, dans un sens. Retour si la dérive se renverse d’au moins 45 min. Une seule transformation : coucher, lever, ou le rythme entier si les deux bougent ensemble.
- Régularité : stable si l’écart des couchers ≤ 45 min ; irrégulier si ≥ 90 min ; entre les deux, pas de carte de régularité.
- Repère général (contexte, pas un diagnostic) : coucher classique 22 h 30–00 h 30, lever 6 h–8 h 30, milieu de nuit 2 h–4 h. « Plus tardif » si coucher après 1 h ou milieu après 4 h 30. « Très tardif » si coucher après 2 h 30 ou milieu après 6 h. Carte de repère à partir du niveau 2 seulement, et seulement si tardif ou très tardif.
- Les deux horaires (coucher et lever) sont requis. Il en manque un : pas de carte de rythme. La durée, elle, continue.
- Durée reconstruite hors 1 h 30–16 h, ou désaccord &gt; 90 min avec la durée stockée : la nuit est rejetée.
- Pas de sieste inventée. Pas de décalage horaire raconté. On lit l’heure stockée comme une horloge locale approximative.
- Week-end : au moins 4 nuits de semaine et 4 nuits de week-end, écart médian ≥ 60 min, et le nom de l’axe (coucher, lever, durée).
- Le rédacteur sommeil ne calcule ni seuil, ni médiane, ni niveau de certitude. Il consomme uniquement les états et métriques déjà validés. Il les met en texte. Il ne décide pas qu’une donnée est une habitude, une dérive ou une association.

### Performance

- `official` = record déclaré dans Défis (`exerciseMaxRecords`). On n’écrit jamais ce record tout seul parce qu’une série observée est plus haute.
- `structured` = séries saisies (`exerciseSetLogs`). Meilleure série observée.
- `total_only` = total de séance. Jamais une série, jamais un record.
- `program` = prescription. Jamais une performance observée.
- 4 séries cochées de 12 : meilleure série 12, 4 séries, volume 48, prescription 4×12. Pas un record de 48.
- Total 48 sans série structurée : volume 48. Une seule série égale au total du jour alors que le programme attend plusieurs séries : volume, pas une série observée.
- Record déclaré 20 + série structurée 22 : le déclaré reste 20. On peut dire que 22 dépasse le record déclaré. On ne remplace pas le record.
- Consolidation : série structurée contre série structurée. Jamais total de séance contre total de séance.
- Variantes = `exerciseId` distincts. Pas de fusion approximative des noms. Charge et durée ne sont pas des répétitions au poids de corps.
- Le langage de **volume** continue d’utiliser les totaux. Seuls record, niveau et consolidation passent à la meilleure série.
- Échelle, sans changer les seuils numériques déjà en place :
  - nouveau haut : « Meilleure série observée : N. Ce n’est pas un record déclaré. »
  - répétée : la même meilleure série sur au moins 3 des 5 dernières séances structurées, mais pas encore assez d’historique pour un niveau.
  - niveau récent : au moins 4 séances structurées avant celle-ci, et au moins 3 des 5 dernières à ce plafond. Jamais « PR officiel » sans record déclaré.

### Structure installée — une seule définition

Structure installée = un exercice ou une famille observé avec le nombre minimal de séances **déjà prévu par les détecteurs existants**. Le rédacteur ne modifie jamais ce seuil et ne le réinvente pas.

En dessous de ce seuil, le texte utilise le libellé déjà autorisé par le détecteur : « essai », « présent récemment », « répété », ou la formule déjà testée « ce n’est plus une séance isolée, mais ce n’est pas encore la structure installée ». Le mot « structurel » n’apparaît pas hors de ce cadre. « Structure de volume » (deux familles proches en répétitions) n’est pas une structure installée : c’est une description de composition, et elle le dit.

### Horloges qu’il ne faut pas mélanger

- `minutes` du portrait de fenêtre est le temps d’activité hors course (Garmin + natation + corde + endurance non course). Ce n’est **pas** la durée des répétitions cochées.
- On n’écrit pas « N reps en 41 h 56 » ni « N reps/heure » sur un mois ou plus. La densité reps/heure ne sort que pour Aujourd’hui et 7 jours, et seulement si elle décrit **la séance ou la semaine**, pas ce compteur global collé au total de reps.
- La course se lit en kilomètres **et** en minutes de course. Ces minutes ne se comparent pas au temps global d’exercice.
- « Part du dernier mois » ne dépasse pas 100 %. Sur une fenêtre plus longue que 30 jours, on inverse : les 30 derniers jours sont une part **de** la fenêtre, pas l’inverse.
- `first30` est le début des **92 derniers jours**, pas le début d’une année. On ne l’appelle pas « début de la fenêtre » sur 6 mois ou 1 an.
- Si la première répétition comptée arrive plus de 60 jours après le début calendaire de la fenêtre, la carte le dit. Une année dont l’historique commence en avril n’est pas « l’année » avec le mot changé.

### Certitude

- Pas « structurel » après une seule apparition. Pas « habitude » sur une nuit. Pas « progression durable » sur deux séances.
- Une carte sans chiffre est un échec. La nuance « les données ne permettent pas encore de… » n’est pas une exception autonome : elle accompagne un chiffre déjà posé, ou la carte n’existe pas.
- Une contradiction est une bonne carte : volume en baisse et meilleure série en hausse, fréquence en baisse et séances plus denses, sommeil tardif et stable.

### Pipeline

```
détecteurs
  → mesures déjà calculées
  → dossier de preuves par fil
  → rédacteur (texte seulement)
  → carte profonde
  → sélection existante (score, mémoire, rotation, seuil 32, plafonds)
```

Le rédacteur ne décide pas qu’un écart est significatif. Il ne crée ni métrique primaire ni seuil.

---

## 3. Données déjà disponibles — on n’invente pas de source

Tout le plan s’appuie sur ce que `measureRecapWindow`, les comparaisons de période, le sommeil et les séries calculent déjà. Le dossier de preuves **range** ces mesures. Il ne les recalcule pas.

| Donnée | Où elle est | À quoi elle sert | Piège |
|---|---|---|---|
| Reps cochées par jour et par exercice | `repsByDate`, `exercises`, `exercisesByDate` | fait, composition, pic | le total de séance n’est pas une série |
| Jours entraînés, reps/séance | `trainingDays`, `repsPerSession` | fréquence séparée du volume | ne pas les fondre dans un seul pourcentage |
| Pic de journée | `peakDay` (date, reps, part, exercices) | concentration | nommer les exercices du **jour**, pas le top de la semaine |
| Familles musculaires | parts du récap musculaire | composition | une part décrit la fenêtre, pas une séance isolée |
| Première et dernière vue d’un exercice | `firstSeen`, `lastSeenBefore` | entrée, sortie, retour | « nouveau dans la fenêtre » ≠ habitude |
| Fenêtre précédente | `prev30`, rythme habituel, semaine vs mois | comparaison | 30 jours comparés à eux-mêmes : interdit |
| Fenêtre parente | 7 j pour le jour, 30 j pour la semaine, échelle supérieure pour le long | continuité, seulement si deux chiffres comparables existent | pas de phrase générique si la parente manque |
| Course | `runningKm`, `runningMinutes` | cardio | ne pas y coller `minutes` global |
| Kcal actives | `activeKcal` | dépense sur des journées entraînées | ne pas les croiser avec `minutes` global |
| Sommeil | nuits Garmin + profil déjà produit | rythme, dispersion, dérive, week-end | une heure manquante : pas de carte de rythme ; le rédacteur ne réinterprète pas le profil |
| Séries structurées | `exerciseSetLogs` | meilleure série, répétition, niveau | pas le total |
| Record déclaré | `exerciseMaxRecords` | comparaison, jamais réécriture | 22 observé ne devient pas le record 20 |
| Prescription | séries du programme | contexte | jamais une performance |
| Séances comparables | score ≥ 0,32 déjà en place | même type de journée | ne pas baisser ce seuil |
| Jours comparables | même jour de semaine | « les mercredis tournent autour de N » | seulement si le dossier fournit le compte et la moyenne |

Ce qu’on ne crée pas : une nouvelle base, un nouveau parseur Garmin, un nouveau seuil de détecteur, une fusion de noms d’exercices, une écriture automatique dans Défis.

---

## 4. Dix fils : des sujets, pas dix cartes

180 cartes écrites à la main se répéteraient. Le moteur a déjà une cinquantaine de `disc_*`. Le manque est le **dossier multi-fenêtres** et l’**échelle de lecture**.

Un fil est une source narrative, pas une carte. Chaque fenêtre lui pose une question d’échelle différente. Un même fil peut produire jusqu’à trois cartes, une par colonne, uniquement si chaque carte apporte une information et une lecture différentes. Le système choisit le meilleur angle disponible pour chaque colonne. Il n’émet pas les trois par principe.

Dix fils × trois angles = trente **candidats possibles**, pas trente cartes dues. Le plafond reste 10 par colonne après la sélection.

Si le dossier du fil est vide, on cherche **une coupe de repli**. Si la coupe de repli n’a pas non plus les champs requis, il n’y a pas de carte. On ne comble pas avec un synonyme d’un autre fil.

| # | Fil | Sujet | Fait déjà proche dans le moteur | Repli si le fil principal est vide |
|---|---|---|---|---|
| 1 | Concentration | la séance ou le jour qui porte la fenêtre | `disc_peak_day`, `disc_pending_session` | dernière séance non nulle, puis jour comparable |
| 2 | Rythme de production | jours × reps/séance × durée de **cette** séance | `disc_volume_shape` | fréquence seule, puis reps/séance seules |
| 3 | Composition | quelles familles portent le volume | `disc_muscle_now`, `disc_muscle_share_shift` | la famille qui monte, puis celle qui tombe (`disc_family_fade`) |
| 4 | Répertoire | entre / se répète / sort | `disc_emergence`, `disc_structural_memory`, `disc_repertoire` | retour après absence, puis exercice disparu |
| 5 | Poussée et tirage | les deux familles ne bougent pas ensemble | `disc_push_pull`, `disc_ratio_structure` | une seule famille si l’autre est sous le minimum de reps déjà utilisé |
| 6 | Série et record | meilleure série, répétition, record déclaré | jalons `disc_ms_*` | série répétée sans record, puis « le total n’est pas une série » si le programme attend plusieurs séries |
| 7 | Placement du sommeil | coucher, lever, milieu | rythme observé / habituel, état déjà produit | durée seule (`sommeil.dose`) si l’horloge est incomplète — **une** carte, pas une carte de rythme |
| 8 | Régularité du sommeil | dispersion, week-end, dérive | régularité, week-end, dérive, états déjà produits | nuit atypique nommée, seulement si le profil l’a déjà qualifiée |
| 9 | Sommeil et séance | association, pas cause | `disc_sleep_assoc` et tolérance, si déjà publiables | silence si le plancher n’est pas atteint |
| 10 | Continuité de fenêtre | la fenêtre étroite confirmée, infirmée, ou encore trop tôt | statut de continuité calculé en amont | silence si le statut ne change pas la lecture |

### Places, après le score

Les fils 7, 8 et 9 partagent la famille sommeil. Le plafond sommeil reste 2 cartes par colonne. On publie au plus deux de ces trois fils. Ordre de préférence **seulement pour départager des cartes déjà proches** : tolérance si elle est publiable, sinon week-end s’il nomme un axe, sinon rythme, sinon régularité, sinon repère. Le repère tombe en premier. Le troisième fil sommeil attend une autre colonne, avec un autre sens, ou il se tait.

Les fils 1 à 6 et 10 sont du sport. Ils peuvent produire plusieurs angles. Le moteur conserve **jusqu’à 8** meilleures cartes sport, sous le score, la mémoire, la rotation et le seuil 32. S’il y en a moins, la colonne en montre moins. Un jalon déjà détecté peut occuper une place supplémentaire, comme aujourd’hui. Rien de tout cela n’oblige à remplir.

---

## 5. L’échelle change à chaque fenêtre

Une fenêtre longue change obligatoirement d’échelle. Reprendre la fenêtre d’en dessous en changeant un mot est un échec.

| Fenêtre | Échelle |
|---|---|
| Aujourd’hui | la séance |
| 7 jours | la semaine |
| 30 jours | le régime récent |
| 3 mois | un mois contre un autre mois, nommés |
| 6 mois | un bloc contre un autre bloc, datés |
| 1 an | trajectoire, couverture réelle, mois extrêmes, évolution du répertoire |

La phrase de chaque ligne est la question du fil **à cette échelle**. Le rédacteur refuse la carte si la réponse n’est qu’un pourcentage nu, ou si elle pourrait être collée telle quelle sur la fenêtre d’à côté.

Le rédacteur reçoit la fenêtre produit (`today`, `7d`, `30d`, `3m`, `6m`, `1y`), pas seulement la voix interne qui rapproche aujourd’hui 6 mois et 1 an. Sans ça, les deux dernières fenêtres redeviennent le même texte.

### Aujourd’hui — la séance

Le matériau est la séance du jour ou, si elle est à 0, la dernière séance, lue dans les 7 jours. Pas un résumé du mois.

| Fil | Question |
|---|---|
| 1 | La séance du jour a-t-elle commencé ? Si non, la dernière séance porte-t-elle une part importante des 7 jours, et les jours comparables la situent-ils au-dessus ou dans l’habituel déjà mesuré ? |
| 2 | Comment cette séance produit-elle son volume : durée de **cette** séance et reps de **cette** séance, pas le compteur global d’activité ? |
| 3 | Quelles familles la semaine récente a-t-elle réellement touchées, avec les reps de chacune ? |
| 4 | Quel mouvement entre avec assez de reps pour peser, et quel mouvement présent avant sort de la semaine ? Le libellé d’installation vient du détecteur. |
| 5 | Dos, biceps, pectoraux, jambes : qui est proche de qui, sans conclure à la même charge physiologique ? |
| 6 | Y a-t-il une série structurée aujourd’hui ou sur la dernière séance ? Si oui : meilleure série, nombre de séries, volume, et record déclaré s’il existe. Si le total ressemble à une série unique alors que le programme en attend plusieurs : le dire. |
| 7 | Nuit d’avant la séance : coucher, lever, durée, au niveau de certitude déjà produit. Une nuit : observation, pas habitude. |
| 8 | Silence, sauf si le profil a déjà autorisé « actuellement ». Aujourd’hui ne fabrique pas une dispersion de 30 jours. |
| 9 | Silence si le plancher n’est pas atteint. S’il l’est : association déjà chiffrée, nombre de séances, « associé à ». |
| 10 | Cette séance confirme-t-elle le format des 7 jours, le relativise-t-elle, ou est-il trop tôt pour le dire ? La part seule ne suffit pas : elle doit changer la lecture du pic. |

### 7 jours — la semaine

La semaine confirme ou infirme Aujourd’hui. Elle ne recopie pas la carte du jour.

| Fil | Question |
|---|---|
| 1 | Le pic d’aujourd’hui pèse-t-il encore une fois les autres séances comptées ? Nommer les exercices de ce jour-là, et ce que font les autres journées réunies si le dossier les a. |
| 2 | N séances, total, reps/séance. La moyenne masque-t-elle une séance très chargée ? L’écart avec la période de comparaison ne sort que si on peut dire d’où il vient : fréquence, durée de séance, ou une séance. |
| 3 | La composition de la semaine est-elle la même que celle des 30 jours, ou la semaine déforme-t-elle le mois ? |
| 4 | Le détecteur a-t-il déjà classé des mouvements en essai, en présence récente, en répétition, ou en sortie ? |
| 5 | L’écart poussée / tirage de la semaine est-il nouveau par rapport aux 30 jours, ou déjà là ? |
| 6 | Une meilleure série revient-elle sur plusieurs séances de la semaine ? Répétition, pas « niveau », tant que le jalon ne l’a pas dit. |
| 7 | La nuit citée aujourd’hui est-elle seule, ou le profil de la semaine a-t-il déjà le niveau « actuellement » ? |
| 8 | Dispersion seulement si le profil l’a déjà qualifiée. Sinon silence. |
| 9 | L’association déjà publiée tient-elle sur les séances de la semaine, ou le profil dit-il qu’elle ne tient pas ? |
| 10 | Ces 7 jours changent-ils la lecture du mois : pic confirmé, pic relativisé, accélération, ralentissement, ou manque de recul ? |

### 30 jours — le régime récent

Le mois dit si la semaine était un pic ou le régime. Volume et fréquence sont deux dimensions, pas une seule phrase fondue.

| Fil | Question |
|---|---|
| 1 | Le pic de la semaine reste-t-il exceptionnel dans les 30 jours, ou d’autres journées du mois sont-elles du même ordre ? |
| 2 | Total, jours, reps/séance, contre les 30 jours d’avant. Si le total et la fréquence baissent ensemble : dire ce qui vient des jours manquants. Si le total baisse et les séances restent longues : le dire aussi. |
| 3 | Quelle famille gagne ou perd une part **et** un volume. Une part qui monte pendant que le volume global baisse n’est pas « plus de travail ». |
| 4 | Reprendre le classement déjà produit : essai, présence récente, répétition, structure installée, sortie, retour avec le nombre de jours d’absence. |
| 5 | Poussée et tirage du mois, et ce que les 7 derniers jours font à ce rapport, si les deux chiffres existent. |
| 6 | Le jalon dit-il qu’une série est répétée ou devenue un niveau récent ? Record déclaré à côté, jamais à la place. |
| 7 | Le texte reprend le niveau déjà produit : observation, actuellement, ou rythme habituel récent. |
| 8 | Dispersion à côté de la médiane, week-end avec l’axe et les effectifs, seulement si le profil les a déjà sortis. |
| 9 | L’association de la semaine survit-elle sur le mois, selon le profil ? Si oui, ce n’est pas une cause. Si non, la carte d’évolution dit que l’association ne tient pas. |
| 10 | Les 7 derniers jours changent-ils la lecture du mois, ou le mois ne dépend-il pas d’eux ? |

### 3 mois — mois contre mois

On nomme des mois. « Le trimestre » seul est refusé. `first30` n’est pas le début de ces trois mois.

| Fil | Question |
|---|---|
| 1 | Quel mois, nommé, concentre le plus de reps, sur combien de jours, et quelle part des trois mois ? |
| 2 | Le volume des trois mois et le rythme des 28 jours ne racontent pas la même chose : les deux chiffres, jours et reps/séance séparés. |
| 3 | La composition du dernier mois diffère-t-elle de celle du mois d’avant à l’intérieur de la fenêtre ? |
| 4 | Structure installée seulement si le détecteur l’a déjà dite. Sinon le libellé qu’il a déjà autorisé. |
| 5 | Le rapport poussée / tirage des trois mois, puis ce que les 30 derniers jours représentent **de** ce rapport. Jamais un pourcentage au-dessus de 100 %. |
| 6 | Une meilleure série du début de fenêtre est-elle encore le niveau de la fin, ou un pic ancien ? Même exercice, série contre série. |
| 7 | Dérive seulement si le profil l’a déjà produite. Sinon le placement au niveau déjà décidé, sans trajectoire inventée. |
| 8 | La dispersion des trois mois contre celle des 30 jours, si les deux profils existent. |
| 9 | L’association est-elle stable sur plus de séances comparables, ou seulement un bloc récent, selon le profil ? |
| 10 | Les 30 derniers jours portent-ils la fin de période, ou ne résument-ils pas les trois mois ? |

Course, si elle existe : kilomètres et minutes **de course**, à côté des reps, sans le temps global d’exercice.

### 6 mois — bloc contre bloc

Interdit : reprendre les cartes de 3 mois et changer le mot. La coupe est **deux blocs nommés** à l’intérieur des six mois, seulement si les deux blocs ont des reps. Sinon : du premier jour où les reps existent jusqu’à la fin, avec ces deux dates.

| Fil | Question |
|---|---|
| 1 | Quel bloc, nommé, porte le plus de volume, et le second bloc confirme-t-il ou inverse-t-il ? |
| 2 | La fréquence et le volume par séance évoluent-ils dans le même sens entre les deux blocs ? |
| 3 | La famille dominante du premier bloc est-elle encore celle du second ? |
| 4 | Quels mouvements du premier bloc ont disparu, lesquels sont apparus dans le second ? |
| 5 | Le rapport poussée / tirage change-t-il entre les deux blocs ? |
| 6 | Le niveau de série de la fin dépasse-t-il celui du début, à série comparable, même exercice ? |
| 7 | Premier tiers des nuits contre dernier tiers, uniquement si le profil a déjà dit dérive, retour ou stable. Une seule transformation. |
| 8 | Le week-end déplace-t-il le même axe sur les deux blocs, ou seulement sur le bloc récent ? |
| 9 | L’association du bloc récent existait-elle déjà sur le bloc d’avant, selon le profil ? |
| 10 | Les 30 derniers jours écrasent-ils l’histoire des six mois, ou le récit est-il dans les blocs ? |

### 1 an — trajectoire

Interdit : le jeu de 6 mois avec « cette année » à la place de « ces derniers mois ».

D’abord un fait de couverture : date de la première répétition comptée dans la fenêtre. Si elle est tardive, les cartes disent « depuis {date} », pas « sur l’année civile ».

Coupes, dans cet ordre, chacune seulement si elle apporte une dimension que la coupe précédente n’a pas :

1. Depuis la première répétition jusqu’à aujourd’hui.
2. Premier semestre **compté** contre second semestre compté, dates nommées.
3. Le mois le plus haut et le mois le plus bas, noms et reps, et si le creux est une absence de jours ou des séances plus petites.
4. Composition du premier mois compté contre composition des 30 derniers jours.

| Fil | Question que 6 mois n’a pas déjà posée |
|---|---|
| 1 | Le mois le plus productif et le mois le plus creux, nommés. Le creux est-il une absence de jours ou des séances plus petites ? |
| 2 | Le rythme s’est-il installé (jours par mois) ou est-il resté une suite de pics ? |
| 3 | La famille du début du suivi est-elle encore la famille des 30 derniers jours ? |
| 4 | Quels mouvements ont traversé plusieurs mois, lesquels n’ont vécu qu’un bloc ? |
| 5 | Le rapport poussée / tirage du début contre celui de la fin. |
| 6 | Parmi les exercices qui ont assez de séries structurées : le niveau reproductible de la fin contre le record déclaré, et contre la meilleure série du début. |
| 7 | La dérive sur toute la série disponible, seulement si le profil l’a déjà dite : un seul sens, un retour, ou pas de trajectoire. |
| 8 | La dispersion du début contre celle de la fin, si les deux existent. Un rythme tardif devenu plus stable n’est pas le même récit qu’un rythme qui se décale encore. |
| 9 | L’association, si le profil l’a publiée, est-elle présente sur plus d’un bloc ou seulement à la fin ? |
| 10 | Les 30 derniers jours, puis les six derniers mois, comme parts de la période **réellement comptée**, seulement si cela montre que l’année n’est pas le semestre. |

---

## 6. Continuité — objet, pas consigne de style

Les fils 1, 2, 3 et 10 **cherchent** toujours une continuité. Ils ne l’affichent que si la fenêtre parente fournit deux chiffres comparables, assez pour confirmer, infirmer ou qualifier le constat. Une continuité absente n’est jamais remplacée par une phrase générique. Son absence ne force pas `null` sur les fils 1, 2 et 3 : la carte peut vivre sur ses autres dimensions. Le fil 10, lui, retourne `null` sans ce statut, parce qu’il n’a pas d’autre sujet.

Le préparateur de dossier, pas le rédacteur, remplit :

```
continuity: {
  status: "confirmed" | "infirmed" | "too_early",
  narrowWindow: { label, reps, sessions },
  wideWindow: { label, reps, sessions },
  evidence: { share, reading }
}
```

`reading` est l’un de : pic confirmé, pic relativisé, accélération récente, ralentissement, manque de recul. Une part calculable sans `reading` ne publie pas le fil 10.

Chaîne, quand les deux côtés existent :

```
Aujourd’hui  →  7 jours
7 jours      →  30 jours
30 jours     →  mois nommés dans 3 mois
3 mois       →  deux blocs de 6 mois
6 mois       →  couverture réelle de 1 an
```

La phrase nomme les deux fenêtres et les deux chiffres. « La tendance se poursuit » sans chiffre est refusé. « Trop tôt » n’est pas une carte seule : c’est un statut collé à l’observation chiffrée de la fenêtre étroite.

Le fil 10 ne répète pas la phrase du fil 2. Le fil 2 dit **comment** le volume est produit. Le fil 10 dit **si** la fenêtre d’en dessous change encore la lecture, et seulement dans ce cas.

---

## 7. Contrat du rédacteur

`writeThreadCard(thread, voice, dossier)` ne calcule aucune métrique primaire. Si un champ requis pour ce fil et cette fenêtre est absent, il retourne `null`. Il ne le reconstruit jamais à partir d’un autre champ. Un total ne devient pas une série. Une part ne devient pas une fréquence. Une nuit ne devient pas une habitude.

Il reçoit un dossier préparé en amont :

```
dossier: {
  thread,
  voice,                  // today | 7d | 30d | 3m | 6m | 1y
  window,                 // { start, end, label }
  comparisonWindow,       // période précédente, ou null
  observed,               // fenêtre courante
  comparison,             // fenêtre précédente
  history,                // répétition, première vue, dernière vue
  relation,               // seulement une relation déjà validée
  coverage,               // première date comptée, blocs, mois extrêmes
  continuity,             // objet de la section 6, ou null
  certainty,              // niveau déjà décidé : observed | current | repeated | established
  evidence                // libellés déjà français, ou étiquettes à traduire sans les réinterpréter
}
```

`observed`, `comparison` et `history` séparent les dimensions. Exemple de forme, fil Concentration, sans que ces nombres soient des valeurs imposées :

```
observed:
  reps, sessions, exercises, peakDay: { date, reps, exercises }
comparison:
  previous: { reps, sessions }
history:
  comparableDays: { average, count }
continuity:
  parentWindow: { reps, sessions, share, reading }
certainty:
  level
```

Le rédacteur choisit, parmi les champs **présents**, ceux qui répondent à la question du fil pour cette voix. Il n’en ajoute pas.

Pour le sommeil, `certainty.level` et le type d’état (observation, habitude récente, dérive, association publiable, silence) viennent de `sleepRhythmAnalysis`. Le rédacteur sommeil est un passe-texte de ce profil. Un second jugement est un bug.

Sortie, ou `null` :

- titre ;
- corps ;
- preuve en français ;
- sujet, sens, nature, pour la sélection existante.

Le corps suit les axes disponibles, pas une liste obligatoire. Ordre quand les champs existent : fait daté, ampleur, certitude déjà décidée, comparaison ou continuité, lecture et limite, suite à revoir. Un axe absent est sauté.

Interdits de forme :

- le titre répété en première phrase ;
- une preuve brute (`tres_tardif`, `bed+duration`) ;
- « favorable », « neutre », « à surveiller » comme verdict à la place de la lecture et de sa limite ;
- « structurel », « habitude », « durable », « officiel » hors des conditions de la section 2 ;
- 41 h 56, ou tout autre temps global, comme durée des reps ;
- un pourcentage de part supérieur à 100 % ;
- la même carte sur 6 mois et sur 1 an ;
- une troisième phrase qui ne fait que reformuler la précédente.

---

## 8. Mise en place

Les détecteurs restent la source des chiffres. Un préparateur assemble le dossier. Le rédacteur écrit. La sélection actuelle tranche. On ne duplique pas le calcul.

### Fichiers

| Fichier | Rôle |
|---|---|
| `src/utils/sport/recapAnalysisThreads.js` | les 10 fils, la question par fenêtre produit, l’ordre de repli, les champs requis. La priorité de fil ne sert qu’à départager un écart de base ≤ 3 |
| `src/utils/sport/recapAnalysisProofs.js` | construit le dossier à partir des mesures et des profils déjà produits. Ne crée pas de seuil. Pose `continuity` seulement quand deux chiffres comparables existent et qu’une `reading` est honnête |
| `src/utils/sport/recapAnalysisDepth.js` | `writeThreadCard(thread, voice, dossier)`. Texte seulement. `null` si un champ requis manque ou si la troisième phrase n’apporterait rien |
| `src/utils/sport/recapPeriodDiscoveries.js` | remplace le corps court du même sujet et du même sens par le corps profond. N’ajoute pas une seconde carte pour remplir |
| `src/utils/sport/recapNarrativeClaims.js` | sujets des fils qui n’en ont pas encore (répertoire, continuité de fenêtre). Pas de nouveau sujet pour le sommeil déjà nommé |
| `src/utils/sport/__tests__/recapAnalysisDepth.test.js` | assemblage, refus, anti-remplissage, sommeil non réinterprété |
| `src/utils/sport/__tests__/recapPeriodDiscoveries.test.js` | les cartes profondes ne cassent pas les gardes déjà testées |

`recapInsightNature.js` : les plafonds restent un maximum. On n’y touche plus pour forcer 10.

### Ordre de construction

On ne code pas les dix fils tant que la Phase −1 n’est pas lue. Elle est déjà faite sur le code actuel : la matrice ci-dessous dit ce que le préparateur peut ranger dans le dossier, et ce qu’il n’a pas le droit d’inventer. `recapAnalysisProofs.js` n’existe pas encore. « Accessible au rédacteur » veut donc dire : le préparateur peut le copier dans le dossier sans nouvelle métrique et sans nouveau seuil.

#### Phase −1 — Audit des preuves réelles

Sources inspectées : `measureRecapWindow`, `buildPeriodComparisons`, `buildSessionCatalog`, `musclesFromRecapState`, `extractSleepNight` / `buildSleepRhythmDiscoveries`, `snapshot.exerciseSetLogs`, `snapshot.exerciseMaxRecords`, `structuredBestSetReps`.

| Donnée | Dans le portrait de fenêtre | Ailleurs, déjà calculée | Le préparateur peut la mettre dans le dossier |
|---|---|---|---|
| Reps totales | Oui : `totalReps` | — | Oui, pour les six fenêtres |
| Reps par jour | Oui : `repsByDate` | — | Oui |
| Reps par séance | Oui : moyenne `repsPerSession` | Oui : `catalog[].totalReps` par date | Oui. La moyenne ne remplace pas la liste des séances |
| Exercices de chaque séance | Oui : `exercisesByDate` et `peakDay.exercises` | Oui : `catalog[].exercises` | Oui |
| Familles, fenêtre entière | Oui : `muscles`, `pushReps`, `pullReps` | Oui : `computeRecapMuscleState` | Oui |
| Familles de chaque séance | Non | Partiel : `catalog[].muscles` dit quels groupes sont présents, pas leurs reps | Les reps par famille d’une séance ne sont pas un champ. Les regrouper à partir des exercices déjà listés est un assemblage du préparateur, pas un texte du rédacteur. Sinon le dossier laisse ce champ vide |
| Jour de pic | Oui : `peakDay` | — | Oui |
| Comparaison précédente | Oui pour le bloc de 30 jours : `prev30` | `d7`, `d30`, `d90` sont toujours recalculés depuis la fin, quelle que soit la fenêtre affichée | Oui pour 7 jours contre 30 jours, et pour 30 jours contre les 30 jours d’avant. Interdit : comparer une fenêtre de 30 jours à `d30`, c’est elle-même |
| Séries structurées | Non | Oui : `snapshot.exerciseSetLogs`, lu par `structuredBestSetReps` | Oui, en appelant le résolveur existant. Le rédacteur ne lit pas les logs |
| Records déclarés | Non | Oui : `snapshot.exerciseMaxRecords` | Oui, en lecture seule |
| Sommeil | Non dans le portrait de reps | Oui : `allNights` sur toute la fenêtre affichée (coucher, lever, durée), plus le profil de `sleepRhythmAnalysis` | Oui, le profil tel quel. `sleepJourneyFacts` ne couvre que les 92 derniers jours : il ne sert pas de récit pour 6 mois ni pour 1 an |
| Continuité | Non : l’objet `status` / `reading` n’existe pas | Les deux côtés chiffrés existent quand `d7`, `d30` ou `prev30` ont des reps | Le préparateur pose l’objet seulement alors. Une part sans lecture ne suffit pas |
| Historique d’un exercice | Oui : `firstSeen`, `lastSeenBefore` | Oui : catalogue jusqu’à la date de fin, baselines, jours comparables | Oui |
| Durée | `minutes` et `catalog[].minutes` = temps d’activité hors course du jour | — | Aujourd’hui et 7 jours seulement, comme contexte du jour. Pas comme durée des reps sur 3 mois, 6 mois ou 1 an |
| Mois nommés, deux blocs, semestre, mois haut et bas | Non | Les reps par jour permettent de les regrouper | Assemblage du préparateur depuis `repsByDate`, sans nouveau seuil. `first30` est le début des 92 derniers jours : il n’est ni le début de 6 mois ni celui de 1 an |

Écarts qui bloquent le niveau de l’exemple si on les ignore :

- 6 mois et 1 an n’ont pas aujourd’hui de coupe bloc contre bloc ni de mois extrêmes. Le préparateur doit les assembler depuis `repsByDate`, ou ces fils restent vides.
- La durée « 1 h 51 » d’une séance, dans les données actuelles, est le temps hors course de cette date. Ce n’est pas une durée de série.
- Les reps de famille par séance ne sont pas stockées. Sans assemblage explicite dans le préparateur, une carte ne peut pas dire « les tractions font 42 % de cette séance » à partir du seul champ `muscles`.
- Le rédacteur ne reçoit encore rien : tout passe par le dossier, ou c’est `null`.

La Phase 0 ne commence qu’après cette matrice. Elle ne la contredit pas.

**Phase 0 — Contrat.**  
`writeThreadCard` retourne `null` si un champ requis manque, y compris si un champ voisin pourrait servir de substitut. Un dossier qui n’a qu’un seul constat n’est pas rallongé pour atteindre 3 éléments. Une carte du type « 186 reps, 5 exercices, 42 % sur un seul mouvement » reste valide sans comparaison temporelle. Un dossier qui contient séance, semaine, autres journées et fenêtre précédente produit un corps où la troisième phrase ajoute une dimension. Le test charge un jeu calqué sur l’exemple d’Aujourd’hui et vérifie les axes présents dans le dossier, pas le nombre de phrases.

**Phase 1 — Aujourd’hui et 7 jours, fils 1, 2, 4, 10.**  
Cœur de l’exemple : séance, part de la semaine, autres journées si elles existent, entrée et sortie de mouvements, continuité seulement si `reading` est posée.  
Validation : la colonne fait et la colonne évolution ne répètent pas le même constat. La carte de 7 jours n’a pas le même corps que celle d’aujourd’hui. Le fil 10 est absent si la part ne change pas la lecture.

**Phase 2 — Aujourd’hui et 7 jours, fils 3, 5, 6.**  
Familles chiffrées, poussée et tirage sans verdict de déséquilibre, série structurée séparée du total.  
Validation : un total 48 sans séries structurées ne contient pas « record ». Une série 12 répétée ne contient pas « PR officiel ». Dos et biceps proches sont une composition de volume, pas la même charge, et pas une structure installée.

**Phase 3 — Sommeil, fils 7, 8, 9.**  
Le dossier copie le profil. Le rédacteur ne le recalcule pas.  
Validation : 1 nuit, pas le mot habitude. Dispersion, dérive et association absentes si le profil ne les a pas émises. Week-end sans axe : pas de carte. Au plus deux cartes sommeil par colonne. Un test qui modifie une médiane dans le rédacteur est un échec de conception.

**Phase 4 — 30 jours.**  
Volume et fréquence séparés. Répertoire : le libellé du détecteur, pas un seuil nouveau.  
Validation : une baisse de volume avec baisse de jours nomme les deux. Aucune carte « se reprend après un creux » sans chiffres. La part des 7 jours dans le mois est ≤ 100 %. Une nuance seule ne sort pas.

**Phase 5 — 3 mois.**  
Mois nommés. Course en minutes de course. `first30` non appelé « début de la fenêtre ». Densité reps/heure globale absente.  
Validation : le corps ne contient pas le temps global d’exercice comme durée des reps. Le meilleur mois a un nom et un nombre de jours. L’échelle n’est pas celle de 30 jours avec un synonyme.

**Phase 6 — 6 mois.**  
Deux blocs datés.  
Validation : avril–septembre nomme les deux blocs. Aucune carte n’est identique à celle de 3 mois au mot près.

**Phase 7 — 1 an.**  
Fait de couverture. Coupes de la section 5, fenêtre 1 an.  
Validation : si les reps commencent 60 jours après le début calendaire, le corps contient cette date. Le test compare 6 mois et 1 an et exige une coupe que 6 mois ne possède pas.

**Phase 8 — Branchement.**  
Le rédacteur remplace les corps courts des fils qu’il couvre. La sélection existante ne change pas.  
Validation : les tests de colonnes et de découvertes déjà verts restent verts. Un fil sans dossier n’ajoute pas de carte. Une colonne de 4 cartes valides n’est pas complétée.

**Phase 9 — Écran.**  
Recharger Récap sur les six fenêtres. Lire si une continuité n’apparaît que lorsqu’elle change la lecture, si aucune carte longue ne prend le temps global pour la durée des reps, et si 6 mois et 1 an ne sont pas le même texte. Une colonne incomplète est un résultat acceptable.

### Tests qui restent vrais à chaque phase

- une nuit : pas « habitude » ;
- record déclaré non réécrit ;
- total de séance non appelé série ni record ;
- part de fenêtre ≤ 100 %, ou phrase inversée ;
- temps global d’exercice non comparé à la course et non présenté comme la durée des reps ;
- 30 jours non comparés à eux-mêmes ;
- « structure installée » seulement au sens de la section 2 ;
- deux cartes du même sujet et du même sens : une seule reste ;
- total et part seuls : pas deux cartes ;
- fil 10 sans `reading` : pas de carte ;
- le rédacteur ne contient pas de nouveau seuil numérique de sommeil, de jalon ou de séance comparable.

---

## 9. Ce qui ne se fait pas

- Produire 30 phrases comme objectif numérique. Le test vérifie les axes présents dans le dossier, pas le nombre de phrases.
- Baisser le seuil 32, ou créer une carte, pour atteindre 10.
- Dupliquer une carte en changeant un adjectif ou en allongeant les phrases.
- Ajouter un onzième fil « divers ».
- Laisser le rédacteur recalculer un seuil, une médiane, une habitude, une dérive ou une association.
- Laisser la priorité de fil écraser un score clairement plus fort.
- Afficher une continuité sans deux chiffres comparables.
- Publier le fil 10 comme une simple part de fenêtre.
- Écrire une nuance autonome sans observation chiffrée.
- Écrire dans Défis.
- Traiter 6 mois et 1 an, ou 3 mois et 6 mois, comme la même agrégation avec un synonyme de période.

---

## 10. Fini quand

L’objectif n’est pas 30 phrases. C’est ceci :

lorsque les données disponibles sont assez riches, le moteur produit une analyse du même niveau de densité, de profondeur et de variété que l’exemple des 30 textes fourni pour Aujourd’hui. Cette richesse vient du croisement de dimensions mesurées — volume, fréquence, composition, historique, comparaison, séries, sommeil, continuité — et non de l’allongement du texte. Si les données ne permettent pas une analyse profonde, le moteur réduit le nombre de cartes plutôt que de fabriquer du contenu.

Sur les données réelles de l’écran Récap, de Aujourd’hui à 1 an :

- chaque colonne sélectionne jusqu’à 10 cartes parmi les fils disponibles, sans obligation de remplir ;
- chaque carte retenue a un score de base ≥ 32, respecte les gardes existantes, a les preuves requises de son fil, et n’est pas déjà représentée par une carte du même sujet et du même sens ;
- les cartes d’une même fenêtre se répondent : le changement et l’évolution utilisent le dossier du fait sous un autre angle, ou elles ne sont pas publiées ;
- chaque carte a un fait central chiffré et, quand le dossier le permet, au moins deux dimensions ; une carte plus courte mais déjà composée (volume + composition + concentration, par exemple) n’est pas écartée faute de comparaison temporelle ;
- aucune phrase ne sert seulement à reformuler la précédente ;
- les axes sans donnée sont omis ;
- les fils 1, 2, 3 et 10 ont une continuité chiffrée lorsque cette comparaison existe et change la lecture ;
- les cartes sommeil respectent le niveau de certitude déjà produit ;
- 6 mois change d’échelle par rapport à 3 mois ;
- 1 an a une coupe analytique absente de 6 mois ;
- une carte faible reste absente ;
- le rédacteur n’a créé ni métrique primaire ni seuil.

Le test de référence ne se limite pas à `expect(card).not.toBeNull()`. Il charge un jeu calqué sur une journée réelle du type de l’exemple et vérifie que les axes présents dans le dossier réapparaissent dans les cartes : volume, fréquence, concentration, exercices, familles, poussée ou tirage, série, sommeil, continuité, comparaison, évolution. Un axe absent du dossier ne doit pas apparaître dans le texte. Le nombre de phrases n’est pas une assertion.
