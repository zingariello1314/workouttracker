# Récap → Analyse : ce qui a changé, et comment le moteur fonctionne

Ce document décrit les modifications faites sur l’onglet Sport → Récap → Analyse depuis les premiers travaux sur les trois cartes du haut. Il distingue ce qui est en place dans le code de ce qui reste une intention.

Les trois cartes ne sont pas trois plages de dates. La plage (Aujourd’hui, 7 jours, 30 jours, 3 mois, 6 mois, 1 an, 2 ans, Toujours) choisit **quelles données** sont regardées. Les trois colonnes choisissent **quel type de lecture** est affiché.

| Colonne | Ancien libellé | Libellé actuel | Rôle |
| --- | --- | --- | --- |
| `short` / nature `now` | Maintenant | Ce que tu as fait | Faits de la période : volume, séances, répartition, événements |
| `medium` / nature `trajectory` | Trajectoire | Ce que ça change | Interprétation : écart au rythme, conséquence, tension |
| `long` / nature `journey` | Parcours | Ce qui a évolué | Histoire : records, reprises, mois, niveau habituel |

Les libellés sont dans `src/utils/translations.js` (`recap.assessment.horizonShort`, `horizonMedium`, `horizonLong`), en français et en anglais. L’interface les affiche en capitales via le style existant.

---

## 1. Les analyses riches disparaissaient après une ou deux secondes

### Ce que tu voyais

Au chargement, des cartes détaillées apparaissaient, puis étaient remplacées par des textes courts et génériques.

### Cause

Le pipeline se lançait deux fois : d’abord avec l’entraînement, ensuite quand Garmin ou la nutrition arrivaient. La première passe enregistrait les analyses comme « déjà vues ». La seconde les pénalisait comme si elles avaient été lues un autre jour, et des relations génériques prenaient les colonnes.

### Ce qui a été fait

- `src/utils/sport/insightNoveltyStore.js` : `startOfLocalDayMs`, `localDayKey`, `themeCountBeforeLocalDay`. Un thème vu **aujourd’hui** ne compte plus comme une répétition. Seuls les jours précédents pénalisent.
- `src/utils/sport/insightNoveltyEngine.js` et `insightSemanticThemes.js` : les pénalités de nouveauté ignorent l’historique du jour en cours.
- `src/utils/sport/recapPeriodDiscoveries.js` : le facteur mémoire des découvertes utilise `themeCountBeforeLocalDay`.
- `selectBalancedCandidates` dans `recapAdaptiveInsights.js` : si une lecture riche existe (`coach_reading`, `composed_horizon_read`, `relation.reading.`, `.disc_`), les candidats pauvres perdent 36 points. Les lectures riches reçoivent un bonus de rotation de 0 à 12, stable pour la journée (`hash` du jour + id).
- Garde-fou dans `useRecapTabMetrics.js` : si la même période republie un texte de moins de 72 % de la longueur précédente, et que la version précédente dépassait 480 caractères, on garde la version riche.

Conséquence : dans la même journée, les cartes ne clignotent plus vers le texte pauvre. Le lendemain, la rotation peut changer les cartes même si les données n’ont pas bougé.

---

## 2. Le chargement se répétait alors qu’aucune métrique nouvelle n’arrivait

### Ce que tu voyais

À chaque réouverture de Récap → Analyse, le même chargement. Par moments le contenu s’affichait déjà, assombri, pendant que le calcul continuait.

### Ce qui a été fait

Dans `src/hooks/useRecapTabMetrics.js` :

- Un cache mémoire de session (`sessionCache`) : clé complète, clé « entraînement seul », bundle déjà calculé.
- La clé inclut la période, la fenêtre, les programmes, le questionnaire, le volume coché, l’endurance, Garmin (jours avec pas, sommeil) et la nutrition. Préfixe actuel : `span4`. Changer le préfixe invalide les anciens bundles de la session.
- Si Garmin ou la nutrition sont encore en chargement **et** qu’un bundle de la même séance d’entraînement existe, on le montre tout de suite, sans recalcul.
- S’il n’y a pas de cache et que les sources ne sont pas prêtes, on attend. On ne lance pas un calcul partiel qui serait ensuite jeté.
- Les callbacks (`getExerciseNameById`, etc.) sont dans des refs, pour qu’un changement d’identité de fonction ne relance pas le pipeline.

Dans `src/components/tabs/RecapTab.jsx` :

- Squelette seulement s’il n’y a **aucun** enrichissement et que le calcul tourne.
- Voile d’opacité seulement si la période affichée est périmée **et** qu’il n’y a pas encore d’enrichissement. Un résultat déjà là reste lisible.

---

## 3. « Toujours » retombait sur des phrases de semaine

### Ce que tu voyais

Sur Toujours, des textes du type « Peu de jours avec reps saisies cette semaine », « 197 reps cette semaine ». C’étaient les pistes legacy de `buildRecapPistes` (`recapDeepInsights.js`), prévues pour une semaine.

### Cause

La fenêtre Toujours a `start: null`. `buildPeriodComparisons` renvoyait des mesures vides, une découverte plantait, le `catch` gardait les pistes semaine. En plus, `deriveExposureWindows` ramenait une fenêtre ouverte aux 28 derniers jours.

### Ce qui a été fait

- `deriveExposureWindows` (`recapExposureNarratives.js`) : une fenêtre sans début prend une durée selon la période (30 j, 92 j, 183 j, 365 j, 730 j, ou 3650 j pour Toujours), au lieu d’être coupée à 28 jours.
- `periodVoice` (`recapPeriodDiscoveries.js`) :
  - Toujours → « l’ensemble du suivi », « du parcours », « sur tout le suivi »
  - 2 ans → « ces deux années »
  - 1 an reste « cette année »
- Si le pipeline adaptatif jette une erreur (`useRecapTabMetrics.js`) :
  - on publie les lectures de plage si elles existent ;
  - sinon, hors Aujourd’hui et 7 jours, les colonnes restent vides. On ne réaffiche plus les pistes « cette semaine ».
- Sur 30 jours et plus, dans `buildAdaptiveRecapInsights` : les candidats dont l’id contient `.span_` sont remontés (poids au moins 97). Un texte qui contient « cette semaine » perd 55 points.

La clé de voix des longues périodes reste `year` dans `periodVoice`, donc les plafonds de familles `SIGNAL_FAMILY_CAPS.year` s’appliquent encore.

---

## 4. Formulation des cartes qui se répétaient

Les familles d’analyse existantes n’ont pas été supprimées. Des textes précis ont été réécrits pour que le titre ne répète pas le corps, que le pied de carte ne redise pas les mêmes chiffres, et que le ton ne glisse pas vers un conseil générique.

Exemples traités dans `recapPeriodDiscoveries.js`, `recapHorizonEssays.js` et `toInsightCard` :

- Volume concentré sur peu de jours : le titre porte le fait, le corps ne recolle plus le portrait musculaire, la course et les kcal dans la même carte.
- Muscle dominant : le titre donne le pourcentage, le corps liste les comptes, le pied de carte donne le nombre de groupes et de reps identifiées.
- Sommeil : « les journées les plus denses suivent plus souvent de longues nuits », sans « le sommeil explique ».
- Écart au programme : le titre est l’écart de fréquence, le corps dit que le contenu des séances commencées tient mieux que le nombre de jours. Plus de « premier levier ».
- Progression : « tes niveaux de référence ont progressé », accord singulier/pluriel, et la distinction record (plafond) / niveau habituel (ce qui se reproduit).
- `stripTitleEcho` : si le corps commence par les 32 premiers caractères du titre, la première phrase est retirée.

---

## 5. La plage change la question, pas seulement l’étiquette

Une longue fenêtre ne doit pas empiler plus de statistiques de la semaine. Elle doit permettre des questions qu’une courte fenêtre ne peut pas poser.

Échelle voulue :

| Plage | Question |
| --- | --- |
| Aujourd’hui | Événement, micro-écart, ce qui rend la journée atypique |
| 7 jours | Structure de la semaine |
| 30 jours | Comportement, accélération, deux moitiés |
| 3 mois | Phases, inflexion |
| 6 mois | Transformation |
| 1 an | Cycles, records, habitudes |
| 2 ans | Évolution structurelle |
| Toujours | Histoire du parcours |

### Bibliothèque, pas 20 cartes obligatoires

`src/utils/sport/recapAnalysisCatalog.js` est un réservoir. Chaque définition a un id, une famille, des tags, les plages (`bands`) où elle a le droit de parler, et une fonction `run`. Elle ne sort une carte que si `strength >= 64`.

Le sélecteur (`selectAnalysisCatalog`) garde au plus **3 cartes par colonne**, une seule par famille, et écarte la plus faible si les tags ou les concepts se recouvrent. Quatre séances régulières sur 7 jours ne forcent donc aucune carte.

`src/utils/sport/recapSpanStory.js` n’écrit plus les textes lui-même. Il appelle le catalogue et sait encore ranger les candidats en `shortTerm` / `mediumTerm` / `longTerm` si le pipeline principal a planté.

### Analyses réellement branchées

| Id | Plages | Ce qu’elle attend comme signal |
| --- | --- | --- |
| `session_cost` | Aujourd’hui, 7 j, 30 j | Coût inhabituel, via plusieurs voies de preuves (section 6) |
| `streak_break` | Aujourd’hui | Premier jour sans reps après au moins 4 jours consécutifs |
| `exercise_return` | Aujourd’hui, 7 j | Un mouvement revient après 10 à 120 jours |
| `new_variant` | Aujourd’hui, 7 j | Variante absente avant, et au moins 8 jours d’historique |
| `week_cluster` | 7 j | Les séances tiennent sur les quatre premiers jours |
| `week_gap` | 7 j, 30 j | Un seul trou explique la rupture |
| `weekday_habit` | 7 j et plus | Un jour de semaine concentre au moins 28 % des jours entraînés (12 jours minimum) |
| `anchor_exercises` | 7 j, 30 j | Au moins deux mouvements dans toutes les séances |
| `volume_vs_frequency` | 7 j, 30 j | Fréquence et volume ne bougent pas du même ordre (±18 points) |
| `month_halves` | 30 j | Une moitié porte au moins 62 % du volume |
| `acute_week` | 30 j, 3 mois | Les 7 derniers jours pèsent au moins 38 % du volume |
| `variety_shift` | 30 j, 3 mois | Le nombre d’exercices bouge d’au moins 25 % vs la fenêtre d’avant |
| `phase_months` | 3 mois et plus | Au moins 3 mois, lus un par un |
| `last_month_break` | 3 mois, 6 mois | Le dernier mois pèse au moins 40 % et dépasse les mois d’avant |
| `rate_shift` | 3 mois et plus | L’écart de rythme début/fin dépasse 0,8 séance/semaine |
| `longest_gap` | 3 mois et plus | Plus longue interruption d’au moins 10 jours |
| `comeback_speed` | 6 mois et plus | Après un trou ≥ 14 jours, retour vers 80 % du rythme d’avant |
| `peaks` | 6 mois et plus | Mois le plus chargé et mois le plus creux, s’ils diffèrent |
| `durable_exercise` | 1 an et plus | Mouvement présent sur au moins 60 jours et 6 séances |
| `abandoned_exercise` | 6 mois et plus | Absent depuis 45 jours **alors que** d’autres séances ont continué |
| `present_was_rare` | 6 mois et plus | Le rythme des ~12 dernières semaines dépasse nettement l’historique d’avant |
| `history_floor` | 1 an, 2 ans, Toujours | Moyenne depuis le premier jour vs rythme de la fenêtre |

Les 160 exemples (énergie, programme, GTG, nutrition, VFC, street, circuits, étirements, etc.) restent un réservoir de questions. Ils ne sont pas tous codés. Une carte n’est émise que si les champs existent et que le seuil est franchi.

Formulations déjà tenues dans le catalogue :

- « sans répétition enregistrée », pas « tu n’as pas entraîné » comme fait certain ;
- un exercice n’est « abandonné » que si le reste du suivi continue après lui ;
- Toujours ne résume pas « cette semaine ».

---

## 6. D’un générateur de textes vers un résolveur de questions

Fichiers : `src/utils/sport/recapQuestionEngine.js` et `src/utils/sport/recapCostQuestion.js`.

Le principe codé : une donnée manquante ne supprime pas la question. Elle ferme une voie et oblige le moteur à chercher une autre combinaison de preuves. On n’écrit pas la phrase comme si le champ absent valait zéro, et on n’invente pas la valeur.

### La question branchée

« Cette séance, ou cette période, a-t-elle un coût inhabituel ? »

Ce n’est pas « que dit le feedback ? ».

### Preuves et forces

| Preuve | Rôle | Force | Type de vérité |
| --- | --- | --- | --- |
| Difficulté déclarée | Primaire | 1,00 | Déclaratif (« tu as indiqué ») |
| Écart d’énergie début → fin | Primaire | 0,90 | Déclaratif |
| Volume de reps vs fenêtre précédente | Secondaire | 0,60 (0,35 si la base a moins de 3 séances) | Déduction |
| Tonnage (`computeWindowTonnageKg`) | Secondaire | 0,55 | Déduction, seulement si les deux fenêtres ont au moins 400 kg |
| Séances à un jour ou moins d’écart | Contexte | 0,40 | Déduction |
| Sommeil Garmin vs fenêtre précédente | Contexte | 0,35 | Mesure, seulement si au moins 3 nuits de chaque côté et un écart d’au moins 25 min |

Garmin est passé au catalogue depuis `buildAdaptiveRecapInsights` (`garminData: mergedGarmin`), via `extractSleepNightsInWindow`.

### Routes

`resolveEvidence` classe les preuves présentes qui ont une direction (hausse, baisse), puis choisit une route :

| Route | Condition | Formulation |
| --- | --- | --- |
| `A` | Preuve primaire, couverture ≥ 45 % | Le ressenti est cité tel quel. Une séance 8 → 4 dit « de 8/10 à 4/10 ». |
| `A_partial` | Ressenti présent mais couverture < 45 % | « 2 séances renseignées sur 5, soit 40 %. Ce chiffre ne décrit pas les séances sans ressenti. » |
| `B` | Pas de ressenti, mais charge **et** contexte (espacement ou sommeil) | « Le coût objectif semble avoir augmenté » + « tu n’as pas renseigné le ressenti ». Aucun /10 inventé. |
| `C` | Charge seule, avec contexte insuffisant pour B | Même famille de phrase, précision plus basse |
| `D` | Volume clairement en hausse, rien d’autre | « Le volume monte, le coût ressenti n’est pas observable. » |
| `conflict` | Le ressenti ou le sommeil se dégrade **et** les reps par séance ne baissent pas | « Le coût monte, la performance enregistrée ne suit pas. » |
| aucune | Confiance < 0,42 ou aucun signal dirigé | Pas de carte |

La couverture et la confiance ne sont pas affichées. Elles choisissent la route, le verbe et le niveau.

- Couverture : part des séances qui portent la preuve primaire.
- Confiance : qualité des preuves utilisées, rabattue si la voie directe manque (× 0,72), si la couverture primaire est sous 45 % (× 0,82), légèrement rabattue s’il y a contradiction (× 0,94).

### Niveaux d’inférence

Le moteur ne monte pas plus haut que les preuves :

1. Comparaison simple (volume seul).
2. Interprétation (ressenti assez couvert, ou charge + contexte sans ressenti).
3. Croisement ou contradiction (deux signaux qui ne vont pas dans le même sens).
4. Réservé à une preuve primaire robuste (au moins 8 observations, couverture ≥ 60 %) plus un contexte, sans contradiction.

Sans preuve primaire, le niveau est plafonné à 2, puis une contradiction peut le remonter à 3. Une substitution ne parle donc pas comme un ressenti complet.

### Déduplication par concept

Chaque carte du catalogue porte des concepts (`session_cost`, ou l’id de l’analyse par défaut). Si tous les concepts d’une carte sont déjà pris par une carte plus forte, elle est écartée. « Le volume monte » et « tu as fait plus de reps » ne doivent pas devenir deux cartes du même concept. Une reprise et « la fréquence est revenue avant le volume » restent deux concepts, donc deux cartes possibles.

Les tags (énergie, rupture, mois, répertoire…) bloquent en plus deux cartes qui touchent le même sujet même si la famille diffère.

---

## 7. Fichiers touchés

| Fichier | Rôle dans ces changements |
| --- | --- |
| `src/utils/translations.js` | Nouveaux titres des trois colonnes |
| `src/utils/sport/recapInsightNature.js` | Commentaire : nature ≠ durée de fenêtre |
| `src/utils/sport/insightNoveltyStore.js` | Le même jour ne pénalise pas |
| `src/utils/sport/insightNoveltyEngine.js` | Pénalités seulement avant aujourd’hui |
| `src/utils/sport/insightSemanticThemes.js` | Idem pour les groupes sémantiques |
| `src/utils/sport/recapAdaptiveInsights.js` | Sélection, bonus du jour, malus des textes pauvres, `stripTitleEcho`, poids des lectures de plage |
| `src/utils/sport/recapPeriodDiscoveries.js` | Voix de période, mémoire, reformulations |
| `src/utils/sport/recapHorizonEssays.js` | Reformulations (objectif, accord, fenêtre) |
| `src/utils/sport/recapExposureNarratives.js` | Fenêtres ouvertes (Toujours) plus coupées à 28 jours |
| `src/utils/sport/recapSpanStory.js` | Entrée fine vers le catalogue |
| `src/utils/sport/recapAnalysisCatalog.js` | Réservoir, seuils, dédup famille / tag / concept |
| `src/utils/sport/recapQuestionEngine.js` | Routes, couverture, confiance, niveau |
| `src/utils/sport/recapCostQuestion.js` | Question « coût inhabituel » |
| `src/hooks/useRecapTabMetrics.js` | Cache, attente des sources, garde-fou de richesse, repli sans pistes semaine |
| `src/components/tabs/RecapTab.jsx` | Squelette et voile seulement sans contenu |
| `src/utils/sport/__tests__/recapSpanStory.test.js` | Toujours sans « cette semaine », 7 jours sans signal, ressenti, couverture partielle, substitution |
| Tests nouveauté / découvertes / essais | Ajustés pour « vu aujourd’hui » ≠ pénalité, et pour la préférence aux lectures riches |

---

## 8. Comment le système fonctionne, en profondeur

### Deux axes qui ne se confondent pas

Tu choisis une **période** dans la barre du récap. Elle est mémorisée (`sport.recap.periodView`) et convertie en fenêtre de dates par `getRecapDateWindow`. Aujourd’hui et 7 jours ont un début et une fin. Toujours a une fin, et un début vide : le moteur lui donne ensuite une profondeur, il ne la traite pas comme « les 28 derniers jours ».

Les **trois colonnes** ne redécoupent pas cette période. Elles classent des natures :

- `now` → ce qui s’est passé dans la fenêtre ;
- `trajectory` → ce que ça modifie par rapport à l’habitude ou à la fenêtre d’avant ;
- `journey` → ce que seule une histoire plus longue peut dire.

Une même période peut donc remplir les trois colonnes, avec trois questions différentes. Une reprise après 24 jours peut produire « il y a eu un trou », puis « le volume est revenu avant les performances », puis « cette reprise est plus rapide que les précédentes ». Ce sont trois dimensions, pas trois reformulations.

### D’où viennent les candidats

`useRecapTabMetrics` ne recalcule que si la clé de données a changé ou si le cache est vide. Quand il calcule, il construit l’état musculaire, l’évaluation utilisateur (qui contient encore les anciennes pistes semaine, comme matière première, pas comme texte affiché par défaut), l’enrichissement (complétion, feedback agrégé, Garmin, sommeil, poids, circuits), puis appelle `buildAdaptiveRecapInsights`.

Là, deux sources de cartes sont fusionnées :

1. **Le pipeline composé**, déjà là avant ces travaux : essais (`recapHorizonEssays`), découvertes (`recapPeriodDiscoveries`), relations. Il connaît le sommeil, le programme, les jalons, les muscles. Il n’a pas été remplacé.
2. **Le catalogue de plage**, qui ne parle que si un signal dépasse 64 et si la plage est la sienne. Sur 30 jours et plus, ces cartes sont favorisées, et les phrases « cette semaine » sont enfoncées.

Chaque candidat a un poids, un horizon, un pilier, parfois un concept.

### Comment une colonne se remplit

`selectBalancedCandidates` ne prend pas les N plus lourds. Pour chaque place :

- il ignore un id déjà pris ;
- il baisse le score si le groupe sémantique ou le pilier est déjà représenté ;
- il favorise les découvertes (`.disc_`) et les lectures riches ;
- s’il existe au moins une lecture riche, il enlève 36 points aux autres ;
- il ajoute un léger bonus stable pour la journée, pour que demain ne répète pas mécaniquement aujourd’hui ;
- il refuse un score sous 32 (`MIN_COLUMN_WEIGHT`). Une colonne peut rester plus courte. Ce n’est pas un quota à remplir.

Ensuite `toInsightCard` sépare titre, corps et pied de preuve, et retire un écho du titre en début de corps.

La nouveauté est appliquée **avant** cette sélection, via l’historique local. Voir une carte aujourd’hui ne la tue pas au second calcul de la journée. La voir hier la rend moins probable aujourd’hui.

### Comment une question choisit ses preuves

Pour le coût de séance, le chemin est celui-ci.

1. **Collecte.** Jours cochés avec reps, feedback (`sessionFeedbacks[date]` : `energieDebut`, `energieFin`, `difficulte`), tonnage si les charges existent, nuits Garmin si `dailyMetrics` existe, écarts entre dates.
2. **Normalisation.** Fenêtre affichée et fenêtre équivalente juste avant. Une variation de +50 % sur 2 séances ne pèse pas comme +50 % sur une base large : la force du volume tombe à 0,35 sous 3 séances, et le seuil relatif passe à +35 %.
3. **Preuves.** Chaque source devient un objet : rôle, force, présence, direction, couverture, effectif, type (déclaré, mesuré, déduit). Absente ≠ plate. « Pas de feedback » n’est pas « séance facile ». « Pas de Garmin » n’est pas « sommeil correct ».
4. **Conflit.** Si le ressenti ou le sommeil se dégrade et que les reps par séance tiennent, ce n’est pas ignoré et ce n’est pas moyenné en « fatigue donc moins bon ». C’est la conclusion.
5. **Route.** La meilleure combinaison disponible est choisie. La phrase change de précision avec la route. Le moteur ne dit pas « on ne sait pas » s’il reste une voie honnête, et il ne dit pas « tu as clairement ressenti » s’il n’a que du volume.
6. **Seuil.** Sous 0,42 de confiance, silence. Mieux vaut aucune carte qu’une carte amputée.
7. **Place dans les colonnes.** La carte entre dans le même sélecteur que les essais et les découvertes, avec le concept `session_cost`, pour ne pas être répétée par une autre carte de coût.

### Ce que le moteur ne fait pas encore

- Il ne couvre pas encore chaque famille demandée (programme bloc par bloc, GTG, nutrition, VFC, Body Battery hors sommeil, street, circuits, étirements) comme questions à voies multiples. Seul le coût de séance passe par `resolveEvidence`.
- Les autres entrées du catalogue sont encore des déclencheurs directs : si le signal n’est pas là, elles se taisent, elles ne cherchent pas une preuve de remplacement.
- La déduplication sémantique est par concept et par tag, pas par une comparaison de phrases. Deux textes peuvent encore se ressembler s’ils n’ont pas déclaré le même concept.
- « Pas de relation » (sommeil et performance sans lien) n’est pas encore une carte produite. Le conflit, lui, l’est, pour le coût.
- Comparabilité après changement de programme, biais de moyenne, paradoxe de Simpson, et seuil d’échantillon « 1 observation = record seulement » sont posés pour la suite. Ils ne sont appliqués aujourd’hui que là où le coût rabaisse une petite base, et là où les essais distinguent déjà record et niveau habituel.

### Règle qui doit rester vraie pour la suite

Chaque nouvelle analyse se définit comme une question, une liste de preuves ordonnées par force, un seuil de couverture, et une phrase par route. Si la preuve la plus directe manque, la question survit sur une voie plus faible, avec une formulation qui dit d’où vient le signal. Si aucune voie n’atteint le seuil, la colonne reste libre pour une autre question.
