L’objectif est d’avoir un référentiel unique du fonctionnement de Récap → Analyse, qui explique à la fois ce que les trois colonnes doivent raconter, comment les données sont produites, comment les candidats sont sélectionnés, comment éviter les répétitions et comment les horizons temporels changent la lecture.

RÉCAP → ANALYSE
Architecture complète et affinée du moteur des trois colonnes
Les trois colonnes
Ce que tu as fait
Ce que ça change
Ce qui a évolué

Elles ne doivent surtout pas être trois façons différentes de reformuler la même statistique.

Le principe fondamental est :

Ce que tu as fait = état / faits observés
Ce que ça change = relations / conséquences observables
Ce qui a évolué = transformation / trajectoire dans le temps

Autrement dit :

CE QUE TU AS FAIT
        ↓
Qu'est-ce qui s'est réellement passé ?
        ↓
CE QUE ÇA CHANGE
        ↓
Qu'est-ce que cela modifie dans le fonctionnement de ton entraînement ?
        ↓
CE QUI A ÉVOLUÉ
        ↓
Qu'est-ce qui s'est installé, déplacé ou transformé avec le temps ?

C'est cette séparation qui doit empêcher le moteur de produire trois colonnes remplies de :

« Tu as fait X reps. »
« Tu as fait X reps cette semaine. »
« Tu as fait plus de X reps. »

1. RÈGLE FONDAMENTALE : LA COLONNE EST DÉTERMINÉE PAR LA NATURE DE L'ANALYSE

La période sélectionnée ne détermine pas directement la colonne.

Elle détermine plutôt :

quelles données sont suffisamment denses ;
quelles comparaisons sont pertinentes ;
quel vocabulaire temporel utiliser ;
quelles découvertes doivent être prioritaires.

La nature du signal détermine la colonne.

Nature	Horizon technique	Colonne
now	short	Ce que tu as fait
trajectory	medium	Ce que ça change
journey	long	Ce qui a évolué

Définition actuelle dans recapInsightNature.js :

KIND_NATURE
NATURE_TO_HORIZON

Un kind absent de la table tombe actuellement en trajectory.

C'est important parce qu'une même donnée peut être utilisée dans plusieurs analyses, mais pas avec le même sens.

Exemple :

Aujourd'hui :
"Le dos représente 46 % du volume."

Ce que tu as fait.

↓

Sur 30 jours :
"Le dos prend désormais une place plus importante dans ta répartition."

Ce que ça change.

↓

Sur 1 an :
"Le tirage est devenu une composante durable de ton entraînement."

Ce qui a évolué.
2. RÔLE DES DIFFÉRENTS HORIZONS

Les fenêtres disponibles sont :

Aujourd'hui
7 jours
30 jours
3 mois
6 mois
1 an
2 ans
Toujours

Elles ne sont pas juste des filtres de dates.

Elles changent le type de question que le moteur pose.

Aujourd'hui

Question :

Qu'est-ce qui caractérise précisément cette séance par rapport à l'habitude ?

On cherche :

événement ;
séance ;
densité ;
sommeil associé ;
record ;
exercice nouveau ;
répartition inhabituelle ;
reprise ;
rupture ;
coût.
7 jours

Question :

Qu'est-ce qui s'est réellement passé cette semaine, et comment se compare-t-elle au rythme habituel ?

On cherche :

structure de la semaine ;
régularité ;
concentration des séances ;
sommeil ;
volume ;
composition ;
rythme ;
événements récents.
30 jours

Question :

Comment l'entraînement récent évolue-t-il par rapport aux mois précédents ?

On peut commencer à parler de :

changement de composition ;
rythme ;
fréquence ;
répartition musculaire ;
sommeil ;
course vs renforcement ;
exercices devenus importants ;
début de trajectoire.
3 mois

Question :

Quelle trajectoire est réellement en train de se construire ?

On recherche :

changement de régime ;
installation ;
progression consolidée ;
spécialisation ;
réorientation ;
plateau ;
arc du trimestre ;
évolution de la récupération.
6 mois / 1 an / 2 ans

Question :

Quelle trajectoire s'est construite sur cette durée ?

On peut parler de :

habitudes durables ;
transformations ;
cycles ;
changements de régime ;
exercices durables ;
fréquence ;
progression historique ;
périodes fortes/faibles ;
retour après interruption.
Toujours

Question :

Quelle trajectoire s'est construite depuis les premières saisies ?

C'est le niveau où l'on peut réellement parler de :

parcours ;
niveau historique ;
plancher historique ;
progression depuis les débuts ;
répertoire ;
habitudes installées ;
cumul ;
transformations structurelles.
3. LES TROIS COLONNES NE DOIVENT PAS ÊTRE DES CLASSEMENTS

Le moteur ne doit jamais chercher :

meilleure analyse
2e meilleure analyse
3e meilleure analyse

Il doit chercher :

1. quelle information est pertinente ?
2. quelle est sa nature ?
3. quelle colonne doit la recevoir ?
4. est-elle déjà racontée ?
5. apporte-t-elle quelque chose de nouveau ?
6. est-elle suffisamment robuste ?

Donc une colonne peut être plus courte qu'une autre.

Un slot vide doit rester vide.

Le système actuel le prévoit déjà :

Un slot vide reste vide.

Et l'UI peut afficher :

Aucun signal assez robuste.

C'est préférable à une analyse artificielle.

4. LA CHAÎNE COMPLÈTE

Le moteur doit être compris comme une chaîne :

DONNÉES BRUTES
    ↓
MESURES
    ↓
ÉTAT
    ↓
ÉVÉNEMENTS
    ↓
RELATIONS
    ↓
DÉCOUVERTES
    ↓
ESSAIS
    ↓
CATALOGUE D'ANALYSES
    ↓
DÉDOUBLONNAGE
    ↓
COMPARAISON TEMPORELLE
    ↓
MÉMOIRE / NOUVEAUTÉ
    ↓
ROTATION
    ↓
ÉQUILIBRAGE DES COLONNES
    ↓
CARTE FINALE

C'est une distinction importante :

Une métrique seule n'est généralement pas une analyse.

846 reps est un fait.

Une analyse peut être :

« Tes 846 reps se concentrent sur trois journées, alors que ton rythme habituel répartit davantage le travail. »

Là, plusieurs signaux sont utilisés.

Exception :

record ;
reprise ;
première apparition ;
événement suffisamment net.
5. LES DONNÉES DISPONIBLES

Le moteur actuel travaille à partir de :

snapshot Momentum
+ Garmin
+ questionnaire
+ programme
+ fenêtre sélectionnée

Il ne doit pas inventer de données absentes.

Et surtout :

Si une donnée nécessaire manque, la carte correspondante n'est pas écrite.

On ne remplace pas par :

« Pas assez de données. »

La carte n'existe simplement pas.

6. SNAPSHOT D'ENTRAÎNEMENT

Source :

WorkoutContext.getCurrentData()

Données importantes :

Travail
checkedExercises
reps
enduranceData.sessions.pushups
enduranceData.sessions.running
enduranceData.gtg
Ressenti
sessionFeedbacks
énergie début
énergie fin
difficulté
Parcours
progressEntries
trainingPrefs.journeyStartYmd

Un jour est considéré comme jour d'entraînement s'il possède :

reps ;
exercice coché ;
séance d'endurance ;
progression de circuit ;
activité Garmin.
7. GARMIN

Fusion :

mergeGarminDataForRecap

Données :

sommeil ;
durée ;
profond ;
léger ;
REM ;
éveil ;
efficacité ;
qualité ;
score ;
FC repos ;
HRV ;
Body Battery ;
kcal actives ;
pas ;
course ;
km ;
minutes ;
allure ;
jours de course.

La nuit est associée à la date où elle se termine le matin.

Donc :

nuit du mardi → séance du mardi

Et nightJ2 représente la nuit d'avant-hier.

extractSleepNight produit notamment :

hours
totalMin
deepMin
lightMin
remMin
awakeMin
efficiency
bedTime
wakeTime
sleepHr
rhr
hrv
bodyBattery*
quality

Les nuits absentes sont simplement ignorées.

Pas de faux :

« sommeil insuffisant »

8. QUESTIONNAIRE ET PROGRAMME

Le questionnaire apporte notamment :

objectif physique ;
objectif street ;
séances attendues par semaine.

Les objectifs modifient l'interprétation.

Exemple :

objectif street
→ absence de course moins importante

objectif hypertrophie
→ déséquilibre poussée/tirage potentiellement plus pertinent

Mais le moteur ne doit pas transformer cela en jugement de valeur.

Le programme fournit :

jours prévus ;
complétion ;
exercices peu cochés ;
alignement séance/programme.
9. CE QUE L'ASSESSMENT CALCULE

computeRecapUserAssessment

Il calcule notamment :

ancienneté ;
fenêtre ;
volume ;
reps ;
reps/jour ;
jours actifs ;
régularité ;
complétion programme ;
alignement ;
difficulté moyenne ;
niveau ;
palier.

Les anciennes pistes :

shortTerm
mediumTerm
longTerm

sont transformées en candidats faibles :

legacyToCandidates

avec poids 44.

Elles doivent donc rester des filets de sécurité, pas devenir le moteur principal.

10. LES OBJETS DÉRIVÉS

Le moteur ne doit pas recalculer la même chose partout.

measureRecapWindow

Mesure une fenêtre :

totalReps
strengthReps
trainingDays
strengthDays
minutes
kcal
km
minutes de course
reps/h
reps/session
minutes/session
exercices
muscles
poussée
tirage
haut
bas
peakDay
reps par date
exercices par date
première apparition
dernière apparition avant fenêtre.
buildPeriodComparisons

Construit :

period
d7
d30
d90
prev30
first30
identity
voice

Même lorsque l'utilisateur consulte une autre fenêtre.

buildRecapTrainingFeatures

Compare :

7 jours ;
28 jours ;
90 jours.

Avec leurs périodes précédentes.

Notamment :

delta7Pct
delta28Pct
delta90Pct
séances/semaine ;
adhérence ;
alignement ;
jours justifiés ;
exercice le moins coché ;
nombre d'exercices en baisse.

Les deltas extrêmes sont rejetés :

|delta| > 160

ou :

> 90 pour une demi-période

Cela évite qu'une toute petite base produise :

+800 %

et fasse croire à une transformation réelle.

11. ÉTAT D'ENTRAÎNEMENT

buildUserTrainingState

Cinq axes :

Charge
high_rising
rising
stable
falling
Adhérence
high
medium
low
Performance

Souvent :

indeterminate

C'est volontaire.

Une baisse de reps ne signifie pas automatiquement une baisse de capacité.

Récupération
sufficient
uncertain
insufficient
Fatigue
high
moderate
low

Puis :

programResponse
lifePhase
adaptationCost
progressionEfficiency
vélocité
accélération.

L'état précédent sert surtout aux relations et transitions, pas directement à fabriquer un titre.

12. IDENTITÉ DE L'ATHLÈTE

buildAthleteTrainingIdentity

Le moteur doit savoir ce qui est normal pour cette personne.

Il construit :

fréquence moyenne ;
bande de variabilité ;
statut :
inside
low
above
qualités habituelles ;
écarts.

C'est essentiel.

Au lieu de dire :

« Tu as baissé de 20 % par rapport au mois dernier. »

le système peut dire :

« Ton rythme reste dans ta variabilité habituelle. »

C'est une lecture beaucoup plus personnelle.

13. PARCOURS

buildAthleteJourney

Sur tout l'historique :

Pour chaque exercice suffisamment présent :

première référence fiable ;
médiane habituelle ;
record ;
âge du record ;
jalons ;
plateau ;
intervalle entre séances ;
dernière apparition.

Puis :

meaningfulProgress
prVsLevel
milestones
plateau
abandons

avec au maximum :

3 progressions ;
1 record éloigné du niveau habituel ;
1 histoire de jalons ;
1 plateau ;
2 abandons.
14. BASELINE D'EXERCICE

buildExerciseBaseline

Minimum :

3 séances avec reps > 0

Puis :

nombre de séances ;
dernière performance ;
moyenne ;
médiane ;
p25 ;
p75 ;
record ;
pire ;
moyenne des 5 premières ;
moyenne récente ;
écart habituel ;
écart initial ;
variabilité.

Deux notions importantes :

established

≥ 5 séances avant la dernière.

consolidated

Au moins 3 des 4–5 dernières autour/au-dessus de la médiane selon la logique actuelle.

Cela permet de distinguer :

record isolé

de :

nouveau niveau reproduit

C'est fondamental pour la troisième colonne.

15. LE PRINCIPE « RECORD ≠ NIVEAU »

C'est un des principes centraux.

Un record :

100 reps une fois

ne signifie pas :

ton niveau est désormais 100.

Le système doit rechercher ce qui se répète.

Donc :

record
≠
niveau

Le niveau est ce qui devient reproductible.

C'est pour cela que :

disc_ms_pr_consolidated

est différent de :

disc_ms_pr

16. CATALOGUE DE SÉANCES

buildSessionCatalog

Chaque journée :

date
totalReps
exercises
exerciseIds
muscles
minutes
night
nightJ2
sleepHours
hoursJ2
rhr
prevDayReps

Cela permet de comparer des séances réellement comparables.

findComparableSessions :

score minimum 0,32 ;
au moins 5 paires pour certaines lectures.
17. PHÉNOMÈNES

buildTrainingPhenomena

Les phénomènes sont très importants parce qu'ils peuvent dire :

« Ne raconte pas cette histoire : elle est déjà expliquée par quelque chose de plus pertinent. »

Contraction

Si :

fréquence ≤ −12 %

ou :

exposition 28j ≤ −12 %

et éventuellement rebond :

7j ≥ +5 %

ou poursuite :

7j ≤ −8 %

Cela peut supprimer :

volume_traj
capacity_vs_exposure
recent_vs_identity
Spécialisation poussée

Si :

poussée ≥ 60 %

ou ≥ 70 % plus fortement.

Supprime :

specialization
Faible adhérence
complétion < 55 %
Absence course

Course absente :

≥ 14 jours

ou :

≥ 8 autres séances depuis
Performance indéterminée

Si :

momentum reps ≤ −12 %

et exposition/fréquence diminuent.

Le moteur ne dit pas :

« ta performance baisse »

Il dit en substance :

les données ne permettent pas de séparer baisse d'exposition et baisse de capacité.

18. SOMMEIL : LE MOTEUR DOIT PARLER D'ASSOCIATION

C'est une règle très importante.

Le moteur peut dire :

« Les séances suivant une nuit de 7 h 30 ou plus ont davantage de volume dans ton historique. »

Mais pas :

« Dormir 7 h 30 augmente ton volume. »

Parce que les données sont observationnelles.

Conditions générales

Les analyses sommeil nécessitent généralement :

au moins 8 séances appariées à une nuit

Puis chaque test possède ses propres seuils.

Par exemple :

≥ 4 séances de chaque côté ;
parfois 3 ;
écart ≥ 12 % ;
≥ 35 reps.

Sinon :

null

Aucune carte.

19. LES TESTS SOMMEIL DISPONIBLES

Le système possède déjà une vraie bibliothèque :

volume après ≥ 7 h 30 ;
variante ≥ 8 h ;
14 dernières séances ;
trois zones de durée ;
séances ≥ 300 reps vs <250 ;
architecture sommeil ;
efficacité à durée comparable ;
déficit retardé ;
sensibilité poussée/tirage ;
effet J-2 ;
triple condition ;
interaction avec charge de la veille ;
densité ;
course ;
performance du mouvement principal ;
difficulté ressentie ;
concentration des nuits longues ;
stabilité du sommeil profond ;
fréquence hebdomadaire des longues nuits ;
part des journées ≥300 reps précédées d'une nuit ≥7 h 30.
20. COMMENT UNE DÉCOUVERTE EST PRODUITE

discovery()

Formule :

score =
importance
× fiabilité
× nouveauté
× adéquation
× 100

Puis :

relevance =
min(0,995 ; 0,88 + score / 900)

Une découverte contient :

kind
nature
family
title
body
evidence
metrics
21. UNE DÉCOUVERTE N'EST PAS FORCÉMENT AFFICHÉE

detectDiscoveries peut produire des dizaines de candidats.

Puis :

selectPeriodDiscoveriesWithTrace

fait le tri.

Ordre :

meilleur objet par kind ;
priorité de la période ;
reste par score ;
jalons en dernier.
22. LES CONDITIONS DE REJET

Une découverte est refusée si :

Score trop faible
< 36

ou :

jalon < 44
Déjà utilisée

Le même kind est déjà pris, toutes colonnes confondues.

Rivale déjà prise

Deux lectures racontent le même angle.

Famille déjà représentée

Une deuxième carte de même famille doit être très forte :

score ≥ 86
Plafond atteint

Le plafond de la famille de signal est déjà atteint.

23. FAMILLES DE SIGNAL
milestone
sleep
sport

Les jalons :

disc_ms_*

Le sommeil :

disc_sleep_*
disc_rest_assoc

Le reste :

sport
24. PLAFONDS

Ce sont des maximums, pas des objectifs à remplir.

Aujourd'hui / semaine
now:
5 sport / 2 sommeil / 1 jalon

trajectory:
5 sport / 2 sommeil / 1 jalon

journey:
4 sport / 2 sommeil / 1 jalon
Mois / long / année
now:
6 / 2 / 1

trajectory:
6 / 2 / 1

journey:
5 / 2 / 1

Donc :

un plafond de 7 ne signifie pas « il faut trouver 7 cartes ».

25. RIVALES

Une seule lecture d'un même groupe sémantique par colonne.

Exemples :

muscle du moment / poussée-tirage ;
fréquence / continuité ;
arc du trimestre / profil du trimestre ;
part d'exercice / répertoire ;
mémoire structurelle / émergence ;
effacement / émergence ;
glissement musculaire / réorientation ;
sommeil-volume / association / combo ;
zones sommeil / trimestre sommeil ;
intensité / RPE.

C'est déjà une forme de déduplication sémantique.

26. MÉMOIRE DU MOTEUR

La mémoire ne doit pas simplement demander :

« Ai-je déjà affiché exactement cette phrase ? »

Elle doit comprendre :

« Ai-je déjà raconté cette idée ? »

C'est un point que je renforcerais particulièrement.

Le moteur actuel possède déjà memoryFactor.

Par exemple :

Situation	Facteur
Jamais montré	1
Portrait déjà vu 1× / ≥2×	0,9 / 0,8
Autre kind vu 1× / ≥2×	0,6 / 0,42
Jalon vu ≥2×	0,22
Premier jalon déjà vu	0,12
Changement de mix déjà vu	0,15
Jalon poids déjà vu	0,18

Mais le principe général doit rester :

Une répétition peut revenir uniquement si elle apporte une nouvelle information.

Par exemple :

Semaine 1 :
"Le dos représente 42 %."

Semaine 2 :
"Le dos représente encore 43 %."

→ pas intéressant.

Mais :

Mois suivant :
"Le dos est désormais devenu ta famille de tirage dominante depuis plusieurs semaines."

→ nouveau sens.

27. EXACT DUPLICATE VS SEMANTIC DUPLICATE

Il faut distinguer deux choses.

Doublon exact

Même :

kind
données
signature
texte.

Facile à supprimer.

Doublon sémantique

Deux analyses différentes disent la même chose.

Exemple :

"Le tirage est faible."

"La poussée domine ton entraînement."

"Ton ratio poussée/tirage penche fortement vers la poussée."

Techniquement différentes.

Narrativement :

même information.

Le moteur doit donc avoir une notion de :

family
angle
semanticGroup
concept
informationGain

Le catalogue possède déjà une partie de cette logique avec :

informationGain

et :

concept déjà raconté → blocage.

Il faut conserver cette philosophie dans tout le pipeline.

28. ROTATION

Le but de la rotation n'est pas de rendre le système artificiellement aléatoire.

Il faut plutôt éviter :

mêmes 3 thèmes
chaque semaine

Donc :

pertinence
+
nouveauté
+
rotation

Le système actuel possède déjà :

bonus de rotation stable dans la journée.

Et dans le moteur adaptatif :

+0 à 12

pour les lectures riches.

29. LES ESSAIS

buildHorizonEssayCandidates

Il commence par reprendre les découvertes retenues :

emit(kind, title, body, evidence)

La nature de la découverte fixe la colonne.

Puis les essais génériques n'interviennent que lorsqu'ils sont nécessaires.

C'est très important :

Les essais génériques ne doivent pas écraser une vraie découverte.

Si now possède déjà une découverte :

discCoversNow

ou si la séance du jour couvre déjà le besoin :

les essais génériques de :

continuité ;
volume ;
programme ;
absence ;
performance ;

sont sautés.

30. POURQUOI ?

Parce qu'on préfère :

« Ton record de densité vient d'être battu. »

à :

« Ton volume est en hausse. »

si les deux parlent de la même période.

Le second est moins informatif.

31. LES ESSAIS DE PARCOURS

Ils incluent :

journey_progress
journey_pr_vs_level
jalons ;
plateau.

Mais ils sont supprimés s'ils doublonnent déjà une découverte :

disc_exercise_progress

par exemple.

32. LE CATALOGUE D'ANALYSES

selectAnalysisCatalog

C'est un deuxième rédacteur.

Il ne dépend pas exactement de la même mécanique que les découvertes.

Il dispose de :

jours ;
reps ;
exercices ;
mois ;
trous ;
fréquence ;
ressentis ;
Garmin.

Puis chaque définition doit atteindre :

strength ≥ 64

Maximum :

3 cartes par horizon

Et :

une seule carte par famille

Un concept déjà raconté est bloqué si :

informationGain < 1
33. POIDS DU CATALOGUE

Une carte catalogue reçoit :

78 + strength / 5

Puis sur 30 jours et plus :

minimum 97

C'est important parce que les lectures de longue période doivent pouvoir concurrencer les simples faits récents.

34. LE CAS SPÉCIAL DU COÛT DE SÉANCE

session_cost

C'est un cas qui peut changer de colonne.

Il est :

short

quand :

Aujourd'hui ;
pas de conflit.

Mais devient :

medium

si :

la période n'est pas Aujourd'hui ;
ou les preuves se contredisent.

C'est logique :

sur une journée, le coût décrit ce qui s'est passé ;

mais :

sur plusieurs jours, le coût devient une relation / conséquence.

35. SÉLECTION FINALE

selectBalancedCandidates

Une fois par colonne.

Le score commence avec le poids du candidat.

Puis :

+14 si .disc_
+0 à +12 pour lecture riche
-8 candidat pauvre si riche disponible
-16 groupe sémantique déjà pris
-8 à -14 pilier déjà pris
-22 puis -10 deuxième legacy

Puis petit tie-break par hash.

36. ARRÊT

Si le candidat passe sous :

MIN_COLUMN_WEIGHT

le moteur arrête.

Donc :

la colonne peut être plus courte que son plafond.

Encore une fois :

on ne remplit jamais artificiellement.

37. MÉMOIRE DE SESSION

insightNoveltyStore

La mémoire locale exclut le jour courant.

Une signature contient notamment :

période
fenêtre
km
séances course
streak
complétion
reps
nombre de candidats
hash des 12 premiers ids

Le paquet n'est enregistré que si sa signature change.

38. GARDE-FOU CONTRE LE « SECOND PASS » PLUS PAUVRE

Très important avec Garmin.

Si le système calcule d'abord :

Momentum seul

puis Garmin arrive et recalcule :

Momentum + Garmin

la seconde version ne doit pas pouvoir remplacer la première si elle est beaucoup plus pauvre.

Règle actuelle :

si le nouveau paquet tombe sous 72 % de la richesse/longueur précédente et que l'ancienne version dépassait 80, conserver la version riche.

C'est exactement le genre de garde-fou qu'il faut conserver.

39. CACHE

Préfixe :

span4

La clé inclut :

période ;
fenêtre ;
programmes ;
questionnaire ;
volume coché ;
endurance ;
Garmin ;
nutrition.

Tant que Garmin/nutrition chargent :

un bundle déjà calculé sur le même entraînement peut être affiché.

Mais :

sans cache + sans sources prêtes → on attend.

Pas de passe partielle.

40. INVENTAIRE : CE QUE TU AS FAIT

Cette colonne est le portrait de l'activité observée.

Elle peut raconter :

séance ;
rythme ;
densité ;
absence ;
reprise ;
composition ;
domination ;
nouveauté ;
concentration ;
sommeil du jour ;
événement.

Elle ne doit pas transformer automatiquement ces faits en :

« cela signifie que ton niveau est… »

Découvertes now
disc_pending_session

Séance du jour pas encore commencée.

Conditions actuelles notamment :

<20 reps ;
dernière séance ;
même jour de semaine sur les 6 dernières occurrences ;
d7 ;
nuit du matin.
disc_volume_shape

Forme du volume :

semaine ;
mois ;
concentration ;
rythme.
disc_density

Compare :

reps/heure

à :

30 jours ;
7 jours.
disc_muscle_now

Exemple :

« Le dos représente 46 % de tes reps. »

disc_peak_day

Jour concentrant une part importante :

≥ 2 jours
part ≥ 22 %
disc_exercise_share

Un exercice représente une part nette du travail.

disc_vs_habit

Compare au rythme habituel personnel, pas seulement au mois précédent.

disc_no_running

Absence de course alors que :

le renforcement existe ;
ou la course existait dans les 30/90 jours.
disc_sleep_night

Lecture de la nuit du matin.

disc_sleep_week

Lecture sommeil hebdomadaire.

disc_sleep_deep

Le sommeil profond reste stable malgré la variation de durée.

disc_pending_context

Le contexte autour d'une séance encore non commencée.

Mais celui-ci appartient à :

trajectory

et non à now.

41. PRIORITÉ DE « CE QUE TU AS FAIT »
Aujourd'hui

Priorité :

séance en attente ;
densité ;
nuit ;
forme du volume ;
écart à l'habitude ;
part d'exercice.
Semaine
séance en attente ;
sommeil ;
forme du volume ;
profond ;
nuit ;
jour pic ;
densité.
Mois et plus
forme du volume ;
densité ;
muscle du moment.
42. ESSAIS DE SECOURS DE NOW

Uniquement si aucune vraie découverte ne couvre suffisamment la colonne :

continuity
volume_traj
program
absence
performance
unknown_fatigue
journey_abandoned

Même journey_abandoned peut être classé now parce qu'il décrit une disparition récente.

43. CATALOGUE NOW
session_cost

Aujourd'hui / semaine / mois.

streak_break

Aujourd'hui :

≥4 jours consécutifs ;
puis jour vide ;
veille active.
new_variant

Aujourd'hui / semaine :

première apparition ;
≤2 séances ;
≥8 jours d'historique.
week_cluster

Semaine concentrée dans les 4 premiers jours.

month_halves

Mois dont une moitié représente ≥62 % du volume.

phase_months

≥3 mois lisibles séparément.

44. CE QUE ÇA CHANGE

Cette colonne est celle des relations.

Elle répond :

« Ce qui vient de se produire modifie-t-il la structure de ton entraînement ? »

C'est là qu'on doit retrouver :

réorientation ;
poussée/tirage ;
changement de composition ;
apparition structurelle ;
disparition ;
exposition ;
course/force ;
sommeil ↔ activité ;
récupération ↔ volume ;
densité ↔ nuit ;
coût.
45. DÉCOUVERTES TRAJECTORY
disc_pending_context

Le rythme autour de la séance.

disc_muscle_reorient

Un groupe prend davantage de place.

disc_push_pull

Poussée nettement supérieure au tirage.

disc_exercise_base

Un mouvement devient une base.

disc_emergence

Un mouvement apparaît réellement.

disc_composition_not_volume

Le volume reste similaire mais la composition change.

disc_comparable

Les séances réellement comparables progressent.

disc_structural_memory

Un mouvement devient structurel dans sa famille.

disc_stimulus_mix

Le mélange de familles de mouvements change.

disc_family_fade

Une famille perd un mouvement important.

disc_muscle_share_shift

Glissement des parts musculaires.

disc_ratio_structure

Le ratio poussée/tirage devient durable.

disc_cardio_strength

La place relative de la course et du renforcement change.

disc_rest_assoc

Le jour de repos est associé à un changement du lendemain.

disc_sleep_assoc

7 h 30 sépare les journées fortes/faibles.

disc_sleep_family

Une famille semble plus sensible aux nuits courtes.

disc_sleep_volume

Association sommeil/volume.

disc_sleep_month

Concentration des nuits longues.

disc_sleep_architecture

Architecture du sommeil versus volume.

disc_sleep_efficiency

Efficacité à durée comparable.

disc_sleep_combo

Durée + efficacité + absence de déficit J-2.

disc_sleep_load

Nuit courte après veille lourde/légère.

disc_sleep_intensity

Densité selon sommeil.

disc_sleep_cardio

Course selon sommeil.

disc_sleep_perf

Le mouvement principal évolue ou non avec le volume.

disc_sleep_rpe

Difficulté déclarée selon sommeil.

46. ESSAIS TRAJECTORY

Si aucune découverte plus pertinente ne les couvre :

push_share
specialization
pull_hold
redundancy
established
efficiency
goal_gap
capacity_vs_exposure
identity
journey_plateau

Mais plusieurs peuvent être supprimés par les phénomènes.

47. CATALOGUE TRAJECTORY

Notamment :

coût ;
retour d'exercice ;
trou ;
exercices ancres ;
volume vs fréquence ;
régularité ;
semaine aiguë ;
variété ;
dernier mois dominant ;
changement de régime ;
exercice abandonné.

Quelques seuils importants :

exercise_return

Retour après :

10–120 jours
week_gap

Trou :

≥3 jours semaine
≥6 jours mois
volume_vs_frequency

La variation est attribuée à :

nombre de séances ;
contenu par séance.

Seulement si différence suffisamment nette :

magnitude ≥ 0,4

ou :

split fréquence/densité ≥18
regularity

Mois et plus.

abandoned_exercise

Sur longue période :

≥4 séances ;
silence ≥45 jours ;
entraînement poursuivi ≥21 jours après.
48. CE QUI A ÉVOLUÉ

C'est la colonne de la transformation.

Elle répond :

« Qu'est-ce qui s'est installé ou transformé dans ton parcours ? »

Pas :

« Qu'as-tu fait récemment ? »

49. DÉCOUVERTES JOURNEY
disc_exercise_progress

Un exercice progresse par rapport à ses premières références fiables.

Condition :

|écart| ≥ 15 %

et :

moyenne historique ≥ 5

Le plus grand écart gagne.

disc_anchor

Mouvement devenu ancre.

disc_repertoire

Le répertoire s'est installé.

disc_freq_continuity

La fréquence devient un régime.

disc_kcal_profile

Profil de dépense.

disc_quarter_profile

Forme du trimestre.

disc_quarter_arc

Le trimestre possède une vraie histoire interne.

disc_best_month

Un mois porte une partie importante du parcours.

disc_sleep_zones

Trois zones de récupération.

disc_sleep_quarter

Les journées denses suivent plus souvent des nuits longues.

Toujours formulé comme :

association.

disc_sleep_delayed

Déficit avec décalage.

disc_sleep_j2

Effet associé à la nuit d'avant-hier.

disc_sleep_freq

Semaines bien dormies versus semaines moins bien dormies.

50. ESSAIS JOURNEY
journey_progress
journey_pr_vs_level
journey_milestones
continuity_level
recent_vs_identity

Avec priorité à une vraie découverte si elle existe.

51. CATALOGUE JOURNEY
weekday_habit
longest_gap
comeback_speed
peaks
durable_exercise
present_was_rare
history_floor

Ces lectures sont particulièrement adaptées à :

6 mois ;
1 an ;
2 ans ;
Toujours.
52. LES JALONS

detectRecapMilestones

Ils sont ajoutés après les découvertes classiques.

Ils passent :

en dernier dans la sélection.

Score minimum :

44

Maximum :

un jalon par colonne.

Types :

Now
première séance ;
première course ;
première heure ;
première charge ;
retour ;
retour course ;
retour GTG ;
record journée ;
PR reps ;
PR densité ;
PR allure ;
PR charge ;
objectif course.
Trajectory
premier vrai usage ;
PR consolidé ;
fréquence ;
poids ;
objectif reps/force ;
objectif poids ;
combo sommeil ;
régime ;
retour durable ;
combo d'événements.
Journey
cumul reps ;
cumul séances ;
cumul km ;
cumul heures ;
changement de mix.
53. COULEURS

Le rewardTone est indépendant de la colonne.

daily

Vert.

Le reste, notamment la plupart des découvertes sport.

discovery

Violet :

sommeil ;
émergence ;
comparable ;
repos ;
meilleur mois.
jalon

Bleu :

jalons.
transformation

Orange :

mix ;
régime ;
mémoire structurelle ;
effacement ;
glissement de parts ;
stimulus ;
arc trimestre.
historic

Rose :

première séance ;
première course ;
cumul reps ;
cumul séances ;
cumul km ;
cumul heures.
54. LE COÛT DE SÉANCE

recapCostQuestion.js

Preuves :

énergie début → fin ;
difficulté ;
volume ;
tonnage ;
séances rapprochées ;
sommeil.

Routes :

Conflict

« Le coût monte, la performance enregistrée ne suit pas. »

Uniquement lorsque :

charge/ressenti monte ;
reps/séance restent ≥92 %.
A

Énergie déclarée.

A partial

Difficulté mais données incomplètes.

B/C

Coût objectif.

Par exemple :

volume ≥ +18 %
tonnage ≥ +15 %
≥2 séances collées
sommeil ≤ −25 min
D

Volume en hausse sans possibilité d'observer le coût ressenti.

« Le volume monte, le coût ressenti n'est pas observable. »

55. GROUPES MUSCULAIRES

Groupes :

pectoraux ;
dos ;
épaules ;
biceps ;
triceps ;
avant-bras ;
fessiers ;
quadriceps ;
ischio-jambiers ;
mollets ;
gainage/tronc ;
cou ;
adducteurs.
Poussée
pectoraux
épaules
triceps
Tirage
dos
biceps
Haut
poussée
tirage
avant-bras
cou
Bas
quadriceps
ischios
mollets
fessiers
adducteurs
tibia
56. STIMULUS STRUCTUREL

recapStimulusCatalog.js

Un mouvement devient structurel lorsqu'il représente désormais une part réelle de sa famille.

Exemple :

0 %
→ 14 %

Cela peut devenir :

« Les pompes inclinées prennent désormais une place structurelle dans ta poussée. »

Mais pas simplement :

« Tu as fait des pompes inclinées. »

Inversement :

un mouvement réel qui tombe à une part nulle/résiduelle peut devenir un effacement de famille.

57. CE QUI EST CALCULÉ MAIS NE DOIT PAS AUTOMATIQUEMENT ÊTRE AFFICHÉ

Plusieurs systèmes existent en arrière-plan :

transitions d'état ;
robustesse de performance ;
événements ;
relations ;
comparaisons population ;
anciennes narratives ;
pistes legacy ;
benchmarks ;
calendrier ;
coach programme.

Ils ne doivent pas automatiquement devenir des cartes.

Ils servent de matière première.

58. RELATIONS

trainingRelationEngine.js

C'est potentiellement une des couches les plus importantes.

Une relation est une lecture composée de plusieurs signaux.

Elle peut devenir compagnon si :

pertinence ≥ 0,7
texte ≥ 80 caractères
id non déjà émis

Cela rejoint directement le principe :

une analyse = plusieurs signaux reliés.

59. COMPARAISONS POPULATION

Le moteur possède aussi :

populationComparisonEngine.js

Mais elles sont filtrées.

isColumnInterpretation rejette :

hierarchical_comparison
cmp.*

Donc :

les trois colonnes doivent rester centrées sur l'histoire de l'utilisateur, pas devenir un classement contre une population.

60. isColumnInterpretation

Une interprétation doit notamment avoir :

texte ≥ 80 caractères

et :

relation.*

ou :

pilier interpretation

Cela évite que les trois colonnes soient remplies de simples statistiques.

61. LE PRINCIPAL PRINCIPE DE QUALITÉ

Le moteur doit constamment répondre à :

« Pourquoi cette carte mérite-t-elle d'exister alors que les autres données existent aussi ? »

Une bonne carte doit avoir :

1. Une observation

Quelque chose s'est réellement produit.

2. Une comparaison

Par rapport à :

habitude ;
période précédente ;
historique ;
autre type de séance ;
autre état.
3. Une signification

Ce que cela indique dans le contexte.

4. Une nouveauté

Ce n'est pas déjà raconté.

62. EXEMPLE COMPLET

Supposons :

846 reps
71 % poussée
course absente
sommeil moyen 7 h 48
pompes inclinées :
24 reps historiques
31,6 reps récemment

Le moteur ne doit pas produire :

Ce que tu as fait

846 reps.

Ce que ça change

Tu as fait beaucoup de reps.

Ce qui a évolué

Tu progresses.

C'est pauvre.

Il doit pouvoir produire quelque chose comme :

Ce que tu as fait

La poussée représente 71,2 % de ton volume récent.

Fait.

Ce que ça change

La place de la poussée s'est renforcée par rapport à ta répartition habituelle, alors que le volume global reste comparable.

Relation.

Ce qui a évolué

Les pompes inclinées sont passées d'environ 24 reps sur tes premières références à 31,6 récemment, soit +31,7 %, avec suffisamment de répétitions pour que le changement soit observable.

Transformation.

Là, les trois cartes racontent trois niveaux différents de la même réalité, sans être des doublons.

63. CE QU'IL FAUT ÉVITER ABSOLUMENT
Éviter la répétition temporelle artificielle
Cette semaine : +20 %
Ce mois : +21 %
Cette année : +22 %

Ce n'est pas trois analyses.

Éviter les synonymes
Le tirage est faible.
La poussée domine.
Le ratio favorise la poussée.

Même information.

Éviter la causalité inventée
Tu as mieux dormi → donc tu as fait plus de reps.

Le moteur doit dire :

« Dans ton historique, les séances suivant ces nuits présentent davantage de volume. »

Éviter le faux déclin
Tu fais moins de reps → tu as perdu en performance.

Non si :

exposition ↓
fréquence ↓

Il faut parler d'exposition.

Éviter le remplissage

Si rien de robuste :

aucune carte.

Éviter le record comme niveau
PR = niveau

Non.

64. LE NOUVEAU MODÈLE MENTAL À CONSERVER

Au fond, le moteur doit fonctionner ainsi :

                 ┌─────────────────────┐
                 │      DONNÉES        │
                 └──────────┬──────────┘
                            ↓
                 ┌─────────────────────┐
                 │      MESURES        │
                 └──────────┬──────────┘
                            ↓
                 ┌─────────────────────┐
                 │     PHÉNOMÈNES      │
                 │  ce qui explique    │
                 │  ou bloque certains │
                 │  essais             │
                 └──────────┬──────────┘
                            ↓
                 ┌─────────────────────┐
                 │    DÉCOUVERTES      │
                 │  événements nets    │
                 └──────────┬──────────┘
                            ↓
                 ┌─────────────────────┐
                 │      RELATIONS      │
                 │  plusieurs signaux  │
                 │  reliés             │
                 └──────────┬──────────┘
                            ↓
          ┌─────────────────┼─────────────────┐
          ↓                 ↓                 ↓
       NOW             TRAJECTORY          JOURNEY
          ↓                 ↓                 ↓
     Ce que tu         Ce que ça          Ce qui a
      as fait            change            évolué
          └─────────────────┼─────────────────┘
                            ↓
                 ┌─────────────────────┐
                 │ DÉDOUBLONNAGE       │
                 │ exact + sémantique  │
                 └──────────┬──────────┘
                            ↓
                 ┌─────────────────────┐
                 │ MÉMOIRE / ROTATION  │
                 └──────────┬──────────┘
                            ↓
                 ┌─────────────────────┐
                 │ SÉLECTION ÉQUILIBRÉE│
                 └──────────┬──────────┘
                            ↓
                 ┌─────────────────────┐
                 │    CARTES UI        │
                 └─────────────────────┘
65. LA DIFFÉRENCE ENTRE LES TROIS COLONNES, EN UNE SEULE PHRASE

Si on devait résumer tout le système :

🟦 Ce que tu as fait

Qu'est-ce que ton entraînement a réellement montré sur cette période ?

🟩 Ce que ça change

Qu'est-ce que ces changements modifient dans la structure ou le fonctionnement de ton entraînement ?

🟨 Ce qui a évolué

Qu'est-ce qui s'est réellement installé, déplacé ou transformé dans ton parcours ?

66. ET LA DIFFÉRENCE AVEC LES HORIZONS

Encore plus simplement :

Aujourd'hui
→ événement

7 jours
→ contexte

30 jours
→ comportement récent

3 mois
→ trajectoire en construction

6 mois
→ transformation

1 an
→ cycle / régime

2 ans
→ histoire longue

Toujours
→ parcours complet

Mais la période ne change pas la nature fondamentale de la colonne.

Elle change seulement la profondeur à laquelle on peut raconter cette nature.

67. ARCHITECTURE FINALE DES FICHIERS

Le moteur actuel se répartit ainsi :

Fichier	Fonction
useRecapTabMetrics.js	calcul, cache, garde-fou
recapAdaptiveInsights.js	assemblage + sélection finale
recapInterpretationPipeline.js	pipeline global
recapInsightNature.js	nature / horizon / plafonds / tons
recapPeriodDiscoveries.js	découvertes
recapSleepNight.js	extraction nuit
recapSleepCorrelation.js	corrélations sommeil
recapPersonalBaselines.js	baseline + séances comparables
recapStimulusCatalog.js	structurel / effacement
recapMilestoneEngine.js	jalons
recapHorizonEssays.js	essais
recapAnalysisCatalog.js	catalogue d'analyses
recapCostQuestion.js	coût
recapVolumeQuestion.js	volume
recapRegularityQuestion.js	régularité
recapHistoryQuestion.js	histoire / régime
recapReasoning.js	information gain
userTrainingState.js	état
recapTrainingFeatures.js	deltas
athleteTrainingIdentity.js	habitude
athleteJourney.js	parcours
trainingPhenomenonEngine.js	phénomènes
insightNoveltyStore.js	mémoire
RecapAnalyseView.jsx	affichage
68. LE POINT LE PLUS IMPORTANT POUR LA SUITE

Avec toutes les informations que tu viens de me donner, je pense que le moteur actuel a déjà beaucoup plus de profondeur que ce que l'interface laisse percevoir.

Le problème principal n'est donc pas nécessairement :

« Il faut ajouter encore 50 analyses. »

Il est davantage :

faire en sorte que tout ce moteur produise une narration cohérente, non répétitive, hiérarchisée et clairement séparée entre fait → conséquence → transformation.

Le système possède déjà :

identité personnelle ;
historique ;
baseline ;
comparaisons ;
phénomènes ;
sommeil ;
relations ;
découvertes ;
jalons ;
mémoire ;
rotation ;
catalogue ;
déduplication ;
sélection ;
garde-fous ;
cache ;
fallback.

La vraie architecture narrative à préserver est donc :

FAIT
↓
RELATION
↓
TRANSFORMATION

et non

STATISTIQUE
↓
AUTRE STATISTIQUE
↓
AUTRE STATISTIQUE

Et surtout :

CE QUE TU AS FAIT
≠
CE QUE ÇA CHANGE
≠
CE QUI A ÉVOLUÉ

Même lorsque les trois cartes parlent du même ensemble de données, elles doivent répondre à trois questions différentes.