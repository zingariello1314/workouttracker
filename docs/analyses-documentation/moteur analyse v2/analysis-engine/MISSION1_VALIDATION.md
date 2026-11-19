# Mission 1 — validation du 18 novembre 2026

Décision : **NO-GO** pour remplacer le moteur visible. **GO** pour le développement shadow de `exercise_format_consolidation`. Les compteurs n’ont pas été égalisés.

## P2 — 19 novembre, suite

La publication Worker → `ready` → 8 cartes affichées est tenue pour démontrée. Elle n’est plus le sujet.

La console et Analyse peuvent diverger parce que la console relance un calcul, tandis qu’Analyse montre le pack en cache. À entrées identiques, la sélection est la même fonction. Le bouton « Pack publié » lit ce cache sans recalcul.

Le détecteur `exerciseFormatConsolidation` est appelé sur une trajectoire déjà calculée, au plus une carte, avec `metrics.reversible`. Une série `equal`, `habit` ou `prescription` ne prouve pas le format. Un horizon de 6 mois peut conclure une consolidation sans interruption.

| Preuve | Statut |
|---|---|
| Publication navigateur | démontrée par le dossier Chrome du 19 novembre |
| Corrections de rédaction | tests `recapVisibleRegressions.p2` |
| Intégration du détecteur | progressive, une carte, ancien chemin conservé |
| P2 entier | non terminé : réserve éditoriale et A/B/C sur l’historique réel restent ouverts |

## P2.1 — 19 novembre

La trace du chemin réel est branchée sur le hook, le client Worker et le commit React. Elle n’écrit pas les séances. Le dossier `momentumExportAnalysisDossier` porte `publicationTrace` et `publicationLifecycle` (`lastEvent`, `firstMissing`, `diagnosis`, `domValidated: false`).

Le détecteur de consolidation est le même fichier. L’horizon choisit les séances examinées. Le bouton « Consolidation expérimentale » de la console de développement lance le rejeu. Il ne modifie pas le pack visible.

| Preuve | Statut |
|---|---|
| Tests de cycle | 4 verts, dont historique isolé et annulation |
| Tests shadow | 11 verts |
| DOM authentifié | non observé |
| Activation | non |

## Shadow P2 — 18 novembre, nuit

| Preuve | Statut |
|---|---|
| Développement du premier détecteur | terminé, shadow only |
| Tests unitaires | 8 tests verts dans `exerciseFormatConsolidation.shadow.test.js` |
| Évaluation indépendante | corpus synthétique A/B/C, pas le snapshot Chrome/Cursor |
| Intégration expérimentale | le rejeu appelle `buildExerciseTrajectory`. Il n’est pas monté sur la navigation |
| Activation en production | non |
| Validation navigateur | non |
| Publication Worker → `ready` | preuve technique verte. DOM non observé |

Le détecteur est `exerciseFormatConsolidation.js`. Il consomme la trajectoire existante, `buildMetricFact`, `proposeTemporalPlans` et `MEMORY_TRANSITION`. Il n’écrit aucun registre utilisateur.

## Clôture P0/P1 — 18 novembre, 23 h

| Garantie | Statut |
|---|---|
| Filtre `parasite()` ne décide plus de l’équivalence | validé |
| `program_gap_mixed` sans couverture figée | validé : non émis si moins de 2 jours figés ou moins de la moitié de la fenêtre |
| `stretch_gap` sans prescription | validé : non émis ; avec des cases prescrites, le texte dit l’écart coché, pas un objectif |
| `costly_progression` | validé : candidate seulement si volume positif, élan négatif, rapport négatif ; le texte nomme les trois |
| Place dans l’application réelle | limitation connue : le test s’arrête à candidate admissible. Pas de preuve de carte rendue |
| Formule de nouveauté 36 / 32 / 25 | validé sur historique synthétique |
| Expositions réelles des quatre cartes | non vérifiable : les exports n’ont pas `entries[]` |
| Mémoire ne retire pas l’accessible | limitation connue, réservée à P2. Le contrat est dans `editorialLedgerContract.js`. Le classement actuel peut encore laisser une carte vraie hors du paquet publié |
| Worker jusqu’à `ready` | non validé. Les diagnostics ont fini en 1,8 s. Le passage navigateur observé plus tôt est resté sur `worker_posted` |
| Huit périodes | validé sur les dates inclusives Europe/Paris (`recapTemporalContracts`). Pas de temps navigateur mesuré |
| Essais de coach | validé : 13 tests verts |
| GTG, série, cache | validé par `recapMission1Metrics` |

Les douze cartes seulement Cursor restent classées comme avant : 4 planchers de nouveauté, 2 faux doublons textuels, 6 faits ou budgets différents. `costly_progression` n’en faisait pas partie : les deux navigateurs la supprimaient.

Le banc qui rejoue une édition complète depuis un snapshot réel n’existe pas. Les tests jugent la formule, le filtre et les trois portes factuelles.

`exercise_format_consolidation` existe en shadow : `exerciseFormatConsolidation.js`, branché sur `buildExerciseTrajectory`. Il ne remplace pas le moteur visible.

Les deux exports du 18 novembre, 21 h 14, sont la source : Chrome `diagnostics/chrome-diag-7d-1795036471533.json`, Cursor `diagnostics/cursortab.json`. Aucun nouvel export n’a été demandé.

## Mission 1.4 — attribution sur les deux exports

Fenêtre identique : 12–18 novembre, Europe/Paris, 7 jours inclusifs. Signatures différentes : Chrome `1334` reps, `17` candidats, historique `hist:180:1`. Cursor `1002` reps, `22` candidats, `hist:73:1`. Les versions moteur du manifeste sont `null` dans les deux fichiers : l’identité de version n’est pas prouvée par ces captures. Les durées, 1 843 ms et 1 881 ms, ne la remplacent pas.

### Poids

Les poids Chrome 36, 32 et 25 sont le plancher de nouveauté 20 plus le bonus de nature : +16 pour un `disc_`, +12 pour `journey_progress`, +5 pour `journey_plateau`. Cinq cartes `disc_` sont à 36 en même temps. Ce palier est reproduit par `applyNoveltyWeights` puis `applyNatureWeights` avec un historique synthétique : exposition de plus de 14 jours non, de moins de 14 jours oui (+28), cinq vues (+22), poids d’entrée 70. Le candidat reste dans la liste.

| Conclusion | Chrome | Cursor | Lecture |
|---|---:|---:|---|
| Pompes inclinées, dips stables | 36 | 98 | plancher, puis hors sélection Chrome |
| Dips qui s’effacent, retour barre | 36 | 86 | plancher, les deux restent publiées |
| Retour parallèles | 36 | 86 | plancher, hors sélection des deux côtés |
| Progression de plusieurs mouvements | 32 | 75 | plancher, hors sélection Chrome |
| Plateau parallèles | 25 | 67 | plancher, hors sélection Chrome |

98 est le plafond de nature. 86 = 70 + 16, donc la pénalité Chrome qui pose exactement le plancher vaut 50, soit récent 28 + cinq expositions 22. 67 − 5 = 62 : la pénalité compatible est 42, soit récent 28 + thème 14. Les dates et le nombre d’expositions réels ne sont pas dans le fichier. La signature `hist:180:1` ne contient ni `seenAt`, ni `count`, ni `claim`.

### Les dix cartes d’écart, Chrome 9 contre Cursor 19

Douze cartes seulement dans Cursor, deux seulement dans Chrome.

| Carte seulement dans Cursor | Première étape | Cause |
|---|---|---|
| Programme ~67 %, étirements ~0 % | déduplication | faux doublon, corrigé |
| Pompes inclinées, dips stables, plateau, progression multi-mouvements | poids puis sélection | plancher de nouveauté |
| Creux du 17 au 18 novembre, séances groupées en début de fenêtre | production | Chrome a une séance le 17, Cursor non |
| Pas | production | 5 757 pas, en dessous, contre 8 418, au-dessus |
| Dépense | production | 3 703 kcal contre 3 162, puis rejet `score` Chrome |
| Continuité de fréquence | production | 4/7 et 17/30 contre 3/7 et 16/30, puis rejet `score` |
| Architecture du sommeil | découverte, motif `cap` | même texte des deux côtés, budget sommeil déjà pris côté Chrome par la carte de densité |

Chrome seul : densité de sommeil après les nuits longues, et le Curl Zottman du 17 novembre. Le Zottman suit les 7 clés de répétitions en plus dans la fenêtre (31 contre 24). Les fichiers donnent les comptes, pas les identités d’exercices.

Quatre des douze cartes seulement Cursor sont le même texte, abaissé par la mémoire. Deux étaient un faux doublon. Les six autres portent des faits différents, ou le même fait de sommeil écarté par le budget de famille. La mémoire n’explique pas les dix.

### Faux doublons

`dedup_kinship` ne comparait pas deux conclusions. `parasite()` supprimait toute la carte. Chrome ajoute `(objectif hypertrophie / définition)` parce que le questionnaire a 49 réponses. Cursor a 0 réponse, donc pas ce suffixe : programme et étirements survivent. La progression coûteuse contient `efficacité ~-2.64` : le motif `~+` ou `~-` la supprimait des deux côtés. Le titre vide n’est pas le motif. Le corps est présent. Le filtre ne retire plus le suffixe d’objectif ni le nombre d’efficacité. Il retire toujours « dynamique favorable » et « reste prudent ».

### Ce que les fichiers ne portent pas

Indispensable pour lier une pénalité à une date : `editorialHistoryReplay.entries[]` avec `id`, `seenAt`, `count`, `claim.topic`, `claim.sense`, `claim.stateKey`. Indispensable pour nommer les 7 clés : `windowReplay.events[]` avec la clé, la date, l’identifiant d’exercice, les répétitions, la charge. Les deux champs sont écrits par le prochain diagnostic, sans nouvel écran à prévoir. Ils ne sont pas nécessaires pour les corrections déjà faites. Les versions du manifeste sont aussi remplies à ce moment-là : `analysisEditionKey` et le contrat Worker. Un DOM de 30 jours daté du 10 novembre ne produit plus de liste d’écarts de cartes ; l’export le marque `stale_period`.

## Mission 1.3 — ce qui est prouvé ce soir

Le moteur n’a pas atteint `ready` dans le navigateur Cursor. L’invariant de reproductibilité n’est pas démontré.

Sur le compte @zingariello1314, période 7 jours, 12–18 novembre, l’écran montrait encore l’édition précédente : 20 cartes, 1 002 reps, 3 h 15. La trace `__f70iPub` n’a enregistré qu’une génération :

1. `publish_workout_refreshing`, 20 cartes, cache `workout_stale_full`.
2. `worker_payload_prep` au bout de 29 s (carte de noms 27 s, snapshot 304 ko, contexte 1,5 Mo).
3. `worker_posted`.

Aucun `worker_aborted`, aucun `worker_progress`, aucun `publish_final`, aucun `error`. Quatre minutes après la préparation, puis deux minutes après l’envoi, le Worker n’avait toujours pas répondu. Ce n’est pas une boucle `endAt` : une seule demande, aucune annulation. Le calcul reste `refreshing` parce que la réponse n’arrive pas.

Un rechargement complet a ensuite ouvert l’onglet sur une session invitée (`Se connecter`, aucune séance). Je n’ai pas continué l’analyse sur ce compte vide, et je ne me suis pas reconnecté. Les données stockées du compte n’ont pas été modifiées. Il faut rouvrir la session dans l’onglet Cursor avant un nouvel export.

Le bouton de développement « Exporter le dossier analytique » est dans la console de diagnostic. Il appelle `momentumExportAnalysisDossier` sans écriture d’historique, de cache ou de données. Il n’a pas pu servir : le calcul n’était pas stabilisé, puis la session n’était plus le compte réel.

Les deux tests `recapHorizonEssays.test.js` passent. La contraction de fréquence (5,1 → 3,6 séances/semaine) est de nouveau une lecture courte, même si une découverte longue `disc_freq_continuity` existe. Le test cherche cette lecture courte, pas n’importe quel identifiant qui contient « continuity ».

La matrice des six rejeux, les nouveaux dossiers et la recette des huit périodes restent ouverts : ils dépendent d’un calcul qui se termine sur le compte réel.

Rapport machine : `diagnostics/chrome-cursor-7d-diff.json`.
Dossiers lus : `diagnostics/momentum-analysis-dossier-7d-2026-11-18T18-30-22-270Z.json` et `diagnostics/cursor-browser-tab-7d-2026-11-12-18.json`.

## Réponses

Chaque ligne dit ce qui est démontré, probable, exclu, ou non vérifiable.

### 1. Pourquoi 7 cartes dans Chrome et 20 dans Cursor ?

**Démontré, en deux étages.**

Les deux écrans montraient une publication `ready` / `complete` pendant que le moteur était `refreshing`. Le paquet visible est donc l’édition précédente, pas le résultat du calcul en cours. Dans Chrome, au même instant, le moteur chargé a recalculé 11 cartes sur le snapshot et l’historique de cet onglet. L’écran en montrait 7. Ces 7 ne sont pas un simple sous-ensemble des 11 : le passage frais contient des kinds absents de l’écran (`disc_vs_habit`, `disc_density`, `disc_ms_return_durable`, `disc_sleep_intensity`, `disc_exercise_share`) et l’écran contient `disc_family_fade`, absent du passage frais. La comparaison du fichier Chrome utilisait `kind` + titre ; « Pompes déclinées » et « Pompes déclinées (pieds sur banc) », comme « Hyperextension » et « Relevés de genoux à la barre », peuvent être le même phénomène rédigé autrement.

Cursor affichait 20 cartes. Son dossier n’a pas de passage frais (`experiment: null`). Sa signature enregistrée dit 22 **candidats**, pas 22 cartes. On ne peut pas lire 20 comme « le moteur actuel moins deux ».

**Exclu :** la séance synthétique de 332 reps, ajoutée en mémoire sur le snapshot Chrome, laisse le passage frais à 11 cartes, sans phénomène apparu ni disparu. Elle n’explique pas 7 contre 20.

**Non vérifiable :** la part qui sépare les 11 fraîches de Chrome des 20 affichées de Cursor, tant que les deux snapshots et les deux historiques complets ne sont pas rejoués par le même moteur.

### 2. Quelle part vient des données ?

**Démontré sur les compteurs.** Fenêtre identique, 12–18 novembre. Chrome a 1 334 reps, 4 jours, 266 min, 4 040 kg, 3 703 kcal. Cursor a 1 002 reps, 3 jours, 195 min, 1 464 kg, 3 162 kcal. L’historique complet des reps est 33 100 contre 32 768, soit 332 reps, et 7 clés de reps comme 7 clés cochées. Les 2 576 kg d’écart disent que la séance absente de Cursor porte de la charge : ce n’est pas un simple ajout de répétitions à vide.

**Exclu comme cause automatique du nombre de cartes.** L’ajout synthétique de 332 reps sans séries ni charges ne change pas la sélection fraîche de Chrome.

**Non vérifiable :** l’effet des vrais exercices, séries et charges du 17 novembre. Les dossiers n’ont que des compteurs.

Les signatures du dernier calcul enregistré portent déjà cette différence de données : 1 334 reps et 16 candidats d’un côté, 1 002 reps et 22 candidats de l’autre. Le champ du milieu n’est pas le nombre de cartes publiées.

### 3. Quelle part vient de l’historique éditorial ?

**Non vérifiable pour 7 contre 20.** Chrome a 180 entrées, le plafond du store. Cursor en a 73. L’export n’en donnait que 12, et c’étaient les plus anciennes : l’historique est trié du plus récent au plus ancien, et `slice(-12)` prenait la queue. Les dates d’octobre dans Chrome et du 18 novembre dans Cursor décrivent cette queue, pas les dernières consultations. Aucun rejeu A/B/C n’a été fait à partir de ces douze lignes.

**Démontré sur le mécanisme, avec des candidats de test.** `applyNoveltyWeights` ne retire pas un candidat. Une entrée revue souvent et datée d’avant le jour courant baisse le poids, ici sous le seuil de sélection 32. Une consultation du jour même ne change pas ce poids. L’historique peut donc déclasser une carte le lendemain, pas à chaque réouverture du même jour. Le passage frais Chrome avait déjà cet historique de 180 entrées et publiait 11 cartes : l’écran à 7 n’est pas ce filtrage-là.

### 4. Quelle part vient du cache et de la publication ?

**Démontré.** Les deux dossiers sont dans l’état `previous_edition_while_refreshing` : publication prête, calcul pas revenu à `ready`. Le texte Cursor « 9 min hors course » est dans la carte publiée ; le bandeau et la mesure du même instant sont à 195 minutes. La carte de calories vient d’une édition antérieure.

Le chemin de code qui produit cet état est le cache workout : même période, fullKey différent, ancien paquet gardé, statut `refreshing`, Worker relancé. Le retour à `ready` n’arrive que si ce Worker publie. Une annulation de génération sort sans changer le statut. La fenêtre portait `endAt`, une horloge, et l’effet dépendait de l’objet fenêtre : reconstruire la fenêtre annulait le Worker même si le jour civil et la clé de données ne changeaient pas. La clé de relance ignore désormais `endAt`.

**Probable, non démontré sur les deux captures :** cet annulation en boucle est la raison pour laquelle les deux statuts étaient encore `refreshing` au moment de l’export. Les fichiers ne contiennent pas la trace `__f70iPub`.

Une réponse Worker ancienne ne remplace pas la requête en cours : le client ne résout que le `requestId` encore présent, et la publication vérifie période, fenêtre, révision et contrat. `cacheReuseDecision` reste testé à part ; le hook vivant s’appuie sur la clé complète et sur cette génération.

### 5. Quelles conclusions sont réellement perdues ?

**Démontré entre l’écran Chrome et son passage frais**, au sens `kind` + titre : cinq kinds du frais sont absents de l’écran. Trois cartes de l’écran ont un titre que le frais ne reprend pas tel quel. Ça ne prouve pas cinq phénomènes perdus : deux paires peuvent être le même phénomène rédigé autrement. L’expérience au niveau phénomène du fichier (`disappeared`, `appeared`) est vide, mais elle compare le frais avant et après la séance synthétique, pas l’écran contre le frais.

**Commun aux deux écrans**, à preuve et titre identiques : la nuit du 13 novembre, les 20 reps reproductibles, le recul des pompes déclinées pieds sur banc (−28 %, 5×10→4×9), les relevés de genoux à la barre (4 séances, plateau), et une carte sans kind ni titre.

**Même kind, preuve différente :** le fondu des dips, 17,1 % → 6,4 % dans Chrome et 17,1 % → 7,0 % dans Cursor.

**Présent seulement sur l’écran Chrome :** le Curl Zottman, 19 séances.

**Présent seulement sur l’écran Cursor :** pic du 13 novembre, rythme calendaire, écart de programme sans preuve exportée, abandon daté du 22 juillet, sommeil et volume, pas, plateau des relevés aux parallèles, trois progressions dont deux absentes de Chrome, calories « 9 min », continuité, adhérence sans titre, progression des niveaux. Aucun doublon de phénomène identifié, hors deux cartes vides de Cursor qui partagent une clé vide.

### 6. Combien de cartes sont invalides ou obsolètes ?

**Démontré comme obsolètes ou mal formées dans les paquets affichés, pas comme un décompte unique.**

- Cursor, calories : texte « 9 min » alors que la mesure fraîche est 195 min. Édition ancienne.
- Les deux : « s'efface de de ta poussée ». Le possessif contenait déjà « de ». Le titre produit maintenant « s'efface de ta poussée ». Ce n’est pas un changement de sélection.
- Cursor : « Ces 7 jours s'inscrit ». Le sujet est pluriel. Le titre produit maintenant « s'inscrivent ».
- Cursor : abandon au 22 juillet, 119 jours, dans une vue de 7 jours. La garde courte existe dans le code actuel ; sa présence dans le paquet affiché indique une édition antérieure à cette garde, ou un chemin qui ne la voit pas. Le passage frais Chrome ne publie pas ce titre. On ne l’a pas rejoué sur le snapshot Cursor.
- Cursor : `program_gap_completion` et `adherence_gap` sans preuve dans l’export. L’export ne copiait pas le corps. L’interface affiche `body` ou `text` même sans titre. Un titre vide dans ces JSON ne prouve pas une carte blanche à l’écran. Le corps n’était pas dans le fichier : **non vérifiable** pour ces trois emplacements (un dans Chrome, deux vides et une adhérence dans Cursor).
- Les deux paquets ne sont pas l’édition du calcul en cours.

### 7. Calcul frais, sélection, DOM

**Démontré pour Chrome.** DOM publié : 7. Sélection fraîche du moteur chargé, même snapshot, même historique, sans écriture : 11. Après ajout synthétique : 11. Le DOM n’était pas cette sélection.

**Non vérifiable pour Cursor.** Pas de passage frais dans le dossier. La signature à 22 est un nombre de candidats.

### 8. Les deux navigateurs exécutent-ils les mêmes contrats ?

**Non vérifiable sur l’édition du moteur.** Aucun des deux dossiers ne portait `analysisEditionKey` ni le contrat Worker. Le rapport les marque `comparable: false`.

**Démontré sur l’écart de forme, pas sur tout le moteur.** La fenêtre Chrome n’a que `start`, `end`, `endAt`. La fenêtre Cursor ajoute `timeZone`, `mode`, `spanDays`, `partialEnd`. Ces champs viennent de l’objet fenêtre de l’application, pas d’une annotation ajoutée au moment d’écrire le fichier Cursor. Les deux captures sont à 1 h 24 d’écart. Ça prouve que l’objet fenêtre chargé n’avait pas la même forme. Ça ne prouve pas à lui seul que les producteurs différaient.

**Exclu comme cause d’un vieux bundle JavaScript :** `sw-garmin-sync.js` ne traite que `POST /api/garmin/sync`. Il ne met pas les scripts en cache. Chrome a ce worker, Cursor n’en a pas. La langue d’interface diffère (`fr-FR` / `en-US`) ; les cartes comparées sont en français des deux côtés. Le fuseau est Europe/Paris des deux côtés. L’origine est `http://localhost:3001` des deux côtés.

### 9. Les corrections passent-elles les tests ?

**Démontré.** `recapChromeCursorDossier.test.js` : 12 tests, et les tests de mission déjà en place sur le même lancement. Ils couvrent l’écart réel des deux JSON, l’état refreshing, le refus de rejouer un historique incomplet, l’inversion des noms de champs de l’expérience Chrome, le corps conservé quand le titre est vide, le tri de l’historique, la pénalité de nouveauté sans suppression du candidat, le jour même sans pénalité supplémentaire, la clé de relance sans `endAt`, et les deux accords de titre.

Il n’y a pas encore de recette navigateur qui rejoue les deux snapshots. Les fichiers ne les contiennent pas.

### 10. Avant de reprendre P2

1. Deux nouveaux exports, un par navigateur, avec le dossier instrumenté : édition, contrat Worker, trace de publication, historique complet, preuves de la fenêtre 12–18 novembre. Sans ça, le rejeu données × historique reste impossible.
2. Confirmer qu’un calcul 7 jours revient à `ready` et remplace le paquet, au lieu de rester sur l’édition précédente.
3. Les deux tests d’essais de coach (`recapHorizonEssays.test.js`) restent rouges. Ce n’est pas une égalisation de compteurs.
4. La recette des huit périodes n’a pas été refaite après les corrections de fondation.

## Corrections de cette passe

| Défaut | Correction |
| --- | --- |
| `recent` montrait les entrées les plus anciennes | les 12 plus récentes, plus la liste complète pour un rejeu |
| Noms d’expérience inversés dans le fichier Chrome | les nouveaux exports nomment `freshAbsentFromDisplayed` et `displayedAbsentFromFresh` ; la lecture de l’ancien fichier inverse les noms |
| Titre vide lu comme carte vide | l’export garde le corps et une preuve tableau |
| `endAt` relançait le Worker | `analysisRunKey` ignore l’horloge |
| « de de », « s'inscrit » | accord du titre, sans changer la sélection |
| Dossier sans empreinte de moteur | `engine.edition`, contrat Worker, trace `__f70iPub`, preuves de fenêtre |

Les producteurs, les plafonds et les règles de sélection n’ont pas été modifiés pour rapprocher 7 et 20. Aucune donnée personnelle n’a été réécrite. Aucun cache n’a été vidé.

## Corrections déjà en place avant cette comparaison

Série dans la fenêtre, durées nommées, identité sans `exercice N`, jour civil Europe/Paris, GTG retiré du total classique, pourcentage de programme seulement avec un plan figé, abandon court exigeant une ancre dans la fenêtre, édition de cache dans la clé. Le détail est dans le registre `ISSUES_AND_REGRESSIONS.md`.

## Ce qu’il faut pour la matrice

Même moteur, même fenêtre, cinq passages en mémoire, sans écriture :

- snapshot Cursor × historique Chrome, Cursor, vide
- snapshot Chrome × historique Chrome, Cursor, vide

Les dossiers du 18 novembre ne permettent aucun de ces cinq passages. Le prochain export contient l’historique et les clés de la fenêtre. Il faudra les deux.

## Suite P2, 19 novembre — ce que cette section ancienne ne dit plus

Les points 8 à 10 ci-dessus décrivent les dossiers du 18 novembre. Ils restent l’historique de cette session. Le dossier Chrome du 19 novembre a ensuite montré une publication `ready` et huit cartes. Cette mise à jour ne reprend pas ce diagnostic.

L’édition du 19 novembre n’est pas rejouable à l’identique avec les trois fichiers fournis. Le dossier ne contient pas l’historique complet des séances, seulement 31 clés de la fenêtre. La sauvegarde du 18 novembre à 17:57 UTC s’arrête avant la fin de fenêtre du dossier (19 novembre, 00:45 UTC) et il lui manque la clé `2026-11-17_complementary_endurance_pushups` (100 répétitions, 1 234 contre 1 334). Le diagnostic de 00:47 a la même fenêtre et les mêmes totaux, mais une signature différente (`887072386` contre `269071197` dans le dossier). Les totaux égaux ne suffisent pas.

La comparaison contrôlée utilise donc la sauvegarde seule, pour l’ancien lecteur de trajectoire et pour le détecteur de consolidation. Huit périodes se terminant le 18 novembre. Aucune écriture dans l’application.

P2 n’est pas clos. La réserve et la mémoire agissent sur ce premier parcours. Le raisonnement temporel général, les arcs et le catalogue de détecteurs ne sont pas commencés.
