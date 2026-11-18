# Momentum — Refonte du moteur d'analyse : spécification unifiée

Document de synthèse des six textes (diagnostic JSON, catégories et formulation, rotation/conseils/projections, cohérence inter-catégories, difficulté des séances, bilan des oublis). Les redondances sont fusionnées, les contradictions tranchées (section 16), et chaque idée est donnée dans sa version la plus aboutie, avec le « comment » et un critère d'acceptation.

**Version intégrant les retouches** : l'audit critique de la spécification (deux fichiers) et le principe d'abondance analytique sont fusionnés ici. Sections **nouvelles** : 0.1, 0.2, 4.6, 4.7, 9.6, 10.9, 11.9, 12.3, 12.4 et 18 à 21. Sections **révisées** : 0 (principe 7), 1, 3, 6.1, 8, 9.5, 13, 14, 15, 16 et 17. Tout ce qui, dans les versions précédentes, parlait de « moins de cartes », de « quota », de « plafond » ou de « 0 à 8 cartes » est remplacé par le principe d'abondance (0.1). S'y ajoute la section **22** (système transversal de visualisation analytique et composition éditoriale mixte), avec des renvois dans 0, 3.1, 9.6, 10, 12.5, 13.3, 16, 17, 18.6, 20.5 et 21.

**Version complétée par l'audit « Qu'avons-nous encore oublié de Momentum ? »** : l'intégralité du texte ci-dessus et ci-dessous est conservée ; les compléments issus de l'audit sont **insérés à leur place logique**. Nouvelles sous-sections : 0.1 bis, 2.8 à 2.12, 3.3 bis, 3.5, 4.8, 5.6, 7.7, 8.8 à 8.10, 9.6 bis, 10.10, 12.6, 13.4 à 13.7, 18.9, 19.6 et 22.18 à 22.20, plus des ajouts dans 14, 15, 16, 17 et 21. **Une seule définition active par concept** : les règles devenues contradictoires ont été fusionnées dans leur section canonique (GTG en 9.1, fusion par conclusion en 9.6, statuts et prescriptions en 3.3, modèle local en 3.4, exhaustivité en 0.1 bis, cohérence progressive en 13.4) ; l'historique des arbitrages est en 14 et 16. Le bilan central de l'audit : la boucle complète **ce que Momentum sait → ce qu'il découvre → ce qu'il présente → ce que l'utilisateur a réellement vu → comment il améliore ses prochaines sélections** n'était couverte que pour ses trois premières étapes ; elle l'est désormais en entier (8.8, 8.9).


---

## 0. Vision et principes directeurs

**Objectif final.** Momentum ne doit plus se contenter de détecter les changements. Il doit aussi reconnaître les continuités, les ruptures, les relations et les transformations de la pratique, déterminer ce qu'elles révèlent, choisir les preuves qui les démontrent et sélectionner la conclusion la plus instructive que les données permettent de défendre. Trois familles d'événements à savoir analyser : ce qui **change** ; ce qui **se maintient** (une stabilité prolongée est un phénomène en soi) ; ce dont **la signification change alors que la métrique reste identique** (36 reps ne signifient pas la même chose en première occurrence, à la 6e répétition, ou retrouvés après 42 jours d'arrêt). Le nombre de cartes découle de l'information disponible, jamais l'inverse.

**Trois façons d'être mauvais** : (1) informations fausses ; (2) informations exactes mais insignifiantes ; (3) informations exactes et détaillées, mais conclusion la plus intéressante manquée. La faiblesse dominante constatée est la (3), puis la (2) (répétition), puis des erreurs de périmètre/libellé de type (1).

**Principes non négociables**

1. **Source de vérité unique** : chaque métrique a une définition, une fenêtre, une couverture, une provenance. Les catégories consultent les mêmes faits, ne les recalculent jamais.
2. **Fiabilité = prérequis, pas bonus de score.** Une carte incorrecte ne gagne jamais, même brillante.
3. **Ambition sans invention** : conclusions engagées (force, prise de muscle, régularité, récupération), mais jamais de cause, de fatigue, de motivation ou de gain non démontrés. La liberté rédactionnelle est plus grande que la liberté factuelle.
4. **Le GTG reste entièrement séparé de la musculation classique.** Séparation comptable stricte : `countingPolicy: isolated` — jamais de reps GTG dans les reps/performances/moyennes/classement de séances classiques, ni dans la complétion d'un programme classique sauf bloc GTG explicitement prévu. Contexte transversal : `contextPolicy: separately_attributed` — certaines analyses (succession des sollicitations) peuvent *mentionner* l'existence de GTG comme contexte distinct, sans en déduire fatigue ni récupération insuffisante. Cette option est **désactivable** (réglage) si tu veux le GTG totalement absent des analyses de musculation ; valeur par défaut : désactivée.
5. **Une donnée absente ne peut jamais être remplacée par une valeur fictive ni servir directement de preuve.** Les 5 sources absentes **dans le diagnostic de novembre 2026** (RPE, justifications des jours manqués, marche manuelle, sommeil manuel, mensurations) ne sont jamais utilisées tant qu'elles sont absentes ; elles ne sont pas définitivement indisponibles : si Momentum enregistre demain du RPE ou des mensurations, le système les exploite selon leurs règles de fiabilité. Mais source absente ≠ domaine inaccessible : le sommeil manuel est absent, le sommeil Garmin reste exploitable ; l'absence de RPE n'empêche pas d'analyser reps, séries, charges et performances. Conséquences : aucune conclusion sur l'effort perçu, la proximité de l'échec, le rapport poids de corps/performance ; les autres données restent exploitables pour ce qu'elles permettent réellement de défendre.
6. **Inconnu ≠ zéro.** Absence d'enregistrement ≠ absence de pratique ; nuit non enregistrée ≠ nuit de 0 h ; année sans donnée ≠ année sans entraînement.
7. **Abondance analytique sans remplissage.** Momentum recherche la plus grande richesse analytique justifiable par les données disponibles : il explore activement les angles d'un entraînement et publie toutes les découvertes suffisamment pertinentes, distinctes et fiables, **sans quota minimal, sans plafond arbitraire**, et sans réduire volontairement leur nombre au nom de la concision. La qualité est un **seuil d'admission**, pas une raison de limiter les analyses de qualité. Inversement, jamais d'invention, de reformulations multipliées ni d'exigences factuelles abaissées pour atteindre un volume. Détail en 0.1.
8. **Pragmatisme** : ne pas recréer ce qui existe déjà (comparaison de périodes, décomposition fréquence × volume, déduplication, moteur de nouveauté). D'abord fiabiliser, tracer, puis améliorer la sélection, puis ajouter.
9. **Le graphique montre, le texte interprète, la conclusion donne du sens.** Les graphiques ne forment ni une catégorie ni une obligation : ils sont une capacité transversale de démonstration, facultative, fondée sur les mêmes faits que l'analyse (22). Momentum varie la manière de raconter les découvertes sans jamais varier artificiellement leur contenu.

### 0.1 Principe — Abondance analytique, exhaustivité et richesse éditoriale

*Ce principe remplace les anciennes formulations « moins de cartes plutôt qu'un remplissage artificiel », « pas de quota », « 0 à 8 cartes environ » et « plafond à calibrer » (sections 0, 9, 13 et 16). L'absence de quota ne signifie pas l'absence d'ambition quantitative.*

**Objectif.** Momentum est un moteur d'analyse sportive à forte profondeur et à forte richesse informative. Son but n'est pas de produire une sélection minimale de quelques observations remarquables, mais d'explorer aussi complètement que possible les données disponibles pour révéler un grand nombre de conclusions pertinentes, distinctes, vérifiables et utiles à la compréhension de la pratique. La quantité d'analyses est une **ambition du produit**, sans devenir une obligation artificielle de remplissage : on ne force pas Momentum à inventer dix analyses, mais on ne l'autorise pas non plus à s'arrêter à trois bonnes analyses s'il pourrait en produire trente autres, tout aussi intéressantes. Si une journée permet trente analyses réellement instructives, les trente doivent pouvoir être accessibles ; si l'historique complet en permet cinquante ou davantage, aucune ne doit être écartée uniquement pour respecter une limite de présentation. Le nombre d'analyses publiables est **une conséquence du travail d'exploration, pas une limite de conception**.

**Trois problèmes distincts, trois réponses** (ils étaient mélangés dans l'ancienne règle « moins de cartes ») :

| Problème | Mauvaise solution | Solution retenue |
|---|---|---|
| Trop d'analyses médiocres | Limiter à six cartes | Améliorer les conditions d'admission |
| Trop d'analyses répétitives | Réduire systématiquement le nombre de cartes | Détecter les véritables doublons de conclusion |
| Trop d'analyses intéressantes pour un seul écran | Supprimer celles au-delà du plafond | Organiser leur affichage progressivement (9.6) |

Un problème de présentation ne devient jamais une limitation du moteur analytique. On distingue donc **la production et l'admission** (combien d'analyses sont réellement justifiées par les données ?) de **la présentation** (dans quel ordre et de quelle façon l'utilisateur veut-il les explorer ?). Le nombre de cartes visibles d'emblée ne détermine jamais le nombre de découvertes conservées. La concision s'applique à **chaque analyse**, pas nécessairement à l'ensemble du récapitulatif : cinquante cartes de 80 mots bien écrites, avec cinquante conclusions différentes, ne sont pas moins bonnes que six cartes de 150 mots.

**Exploration analytique approfondie.** Chaque période fait l'objet d'une exploration couvrant toutes les méthodes de découverte applicables et toutes les dimensions pour lesquelles des données fiables existent (4.6). Le moteur recherche les phénomènes évidents, leurs mécanismes, leurs contextes historiques, leurs relations avec d'autres dimensions et les interprétations complémentaires. Une faible production sur une période riche en données est un **signal à investiguer**, pas un résultat satisfaisant (4.7) : couverture des producteurs, méthodes non exécutées, conditions d'admissibilité, phénomènes manqués, éliminations par rivalité, limites de sélection. Cette exploration supplémentaire n'autorise ni invention ni assouplissement automatique des règles d'exactitude.

**Plusieurs niveaux de richesse.** Découvertes majeures, analyses approfondies et observations contextualisées coexistent (10.9). Elles se différencient par leur valeur explicative et leur portée, sans exiger que toute observation admissible ait l'importance d'une transformation historique. La **fiabilité des faits reste obligatoire à tous les niveaux** : une observation secondaire peut être plus simple, jamais fausse.

**Sélection sans appauvrissement.** La sélection supprime les doublons de conclusion, arbitre les contradictions, hiérarchise et évite les répétitions inutiles ; elle ne cherche pas à réduire le nombre de cartes. Deux analyses d'un même exercice coexistent si leurs conclusions sont réellement différentes ; deux analyses de catégories distinctes se fusionnent si elles racontent essentiellement la même conclusion. Le nombre d'analyses accessibles est déterminé par la quantité de conclusions admissibles et distinctes, non par un quota prédéfini.

**Présentation progressive.** Le nombre de cartes mises en avant d'emblée peut être limité pour préserver la lisibilité, mais cette limite ne supprime jamais les autres analyses admissibles. Momentum distingue les analyses prioritaires, l'ensemble des analyses accessibles et les angles complémentaires explorables volontairement (9.6).

**Renouvellement et historique.** L'abondance ne s'obtient pas en republiant les mêmes conclusions. Le moteur mémorise les phénomènes déjà expliqués, distingue renforcement d'une observation et nouvelle découverte, et cherche activement d'autres interprétations pertinentes (8). Les découvertes anciennes restent accessibles ; leur priorité d'affichage peut baisser lorsqu'elles n'apportent plus d'information nouvelle.

**Critères d'acceptation.**
- Toutes les méthodes applicables du catalogue activé sont exécutées ou disposent d'un motif explicite de non-exécution (exhaustivité opérationnelle, 0.1 bis).
- Les conclusions admissibles et distinctes ne sont pas supprimées à cause d'un plafond de cartes.
- Un volume élevé de conclusions peut être présenté sans dégrader la lisibilité ni les performances de l'interface.
- Une faible production malgré des données riches déclenche un diagnostic de sous-exploration.
- Les duplications, affirmations insuffisamment démontrées et conclusions artificielles ne sont pas publiées.
- Le récapitulatif prioritaire reste lisible, tandis que la profondeur analytique demeure intégralement consultable.

**Principe directeur** : Momentum doit viser l'abondance des découvertes utiles, pas la rareté des analyses. La qualité filtre ce qui mérite d'être publié ; elle ne sert pas de prétexte pour limiter la richesse du système. Formule de synthèse : *ne pas imposer un nombre d'analyses, mais imposer au moteur une véritable ambition d'exhaustivité analytique.*

### 0.1 bis Exhaustivité et ressources de calcul

Une exploration aussi large (huit horizons, comparaisons entre exercices, reconstruction de trajectoires, relations entre catégories, conclusions concurrentes) doit rester soutenable sur un PC personnel, puis sur l'appareil de chaque utilisateur. Trois coûts sont distingués :

| Coût | Exemple |
|---|---|
| Calcul analytique | Recherche des phénomènes, comparaisons, approfondissements |
| Mémoire et stockage | Registres, découvertes, preuves, historique de publication |
| Rendu | Texte, graphiques, interactions, listes longues |

**Deux formes d'exhaustivité.** *Exhaustivité opérationnelle* : toutes les méthodes applicables du catalogue activé ont été exécutées, ou leur non-exécution est explicitement justifiée (critère obligatoire et vérifiable). *Exploration ouverte* : les détecteurs, notamment l'`AnalyticalHypothesisPlanner` (4.8), peuvent proposer des questions supplémentaires dans une recherche **bornée et traçable**, évaluée selon sa valeur marginale et son coût (le nombre de relations théoriquement testables est immense et chercher toujours plus n'est pas un gain d'intelligence).

**Principe d'exhaustivité** : *Momentum vise l'exhaustivité des découvertes admissibles au regard des méthodes disponibles, tout en développant progressivement sa capacité à explorer de nouvelles relations. L'exhaustivité du catalogue est vérifiable ; l'exhaustivité de toutes les conclusions théoriquement possibles ne peut être garantie.* L'exploration est aussi complète que possible parmi les méthodes applicables, avec calcul incrémental, cache et reprise ; les limites de ressources régulent l'exécution, jamais la valeur ou le nombre des découvertes admissibles. Ce n'est pas renoncer aux 30 ou 50 analyses : c'est ne pas promettre ce que le logiciel ne pourra jamais démontrer. Un moteur peut répartir son travail en plusieurs étapes pour ne pas bloquer l'interface ; cela ne l'autorise jamais à supprimer les conclusions au-delà d'un certain rang. La stratégie d'exécution progressive est décrite en 13.5.

**Accept.** : un calcul local coûteux laisse l'application utilisable, les résultats sont mis à jour progressivement et sans mélange de versions.

### 0.2 Critère supérieur de réussite

La réussite de la refonte ne se mesure ni au nombre de producteurs, ni au nombre de catégories, ni à la longueur des analyses, ni à leur score interne. Elle se mesure à la capacité de Momentum à **expliquer correctement des phénomènes importants, découvrir de nouveaux liens pertinents, réviser ses conclusions lorsque les données évoluent et présenter des informations que l'utilisateur n'aurait pas facilement déduites de ses statistiques**. C'est le critère placé au-dessus de tous les autres pour arbitrer les décisions de développement (voir aussi 18 et 21). Trois investissements majeurs le servent : une bibliothèque extensible de méthodes de découverte (4.4, 19), une mémoire sémantique des phénomènes et conclusions (8), un système d'évaluation éditoriale indépendant (18).

---

## 1. Diagnostic de l'existant (run 30 jours du 10 nov. 2026)

**Chiffres** : 86 candidats ; 10 sélectionnés, 32 intermédiaires, 44 déclassés ; 9/9 étapes OK ; 2 237 ms ; 0 rejet de validation ; 0 défaut rédactionnel ; 180 entrées d'historique éditorial ; 17 sources disponibles, 5 manquantes ; 116 cartes d'analyse recensées sur 8 périodes.

**Quatre niveaux à ne plus confondre** : exécution réussie ≠ validation structurelle ≠ justesse des conclusions ≠ valeur éditoriale. « 0 défaut » signifie seulement qu'aucune règle codée n'a détecté de problème.

**Constats établis**

- **Écart 6 199 vs 5 924 reps = 275** = exactement les reps du 12 octobre. Cause : fenêtre du récap = 12 oct.→10 nov. (30 dates), diagnostic = 13 oct.→10 nov. (29 dates). Bornes à unifier, pas d'erreur d'addition.
- **Calendrier vs carte d'analyse** : sept. 3 728 reps/13 j vs 3 704/12 j (24 reps, 1 jour) ; oct. 4 367/14 j vs 4 301/12 j (66 reps, 2 jours). Écarts **attribués au GTG selon la définition métier** (information de l'utilisateur) ; réconciliation à vérifier dans les événements sources, notamment pour les journées supplémentaires (1 et 2 jours) → problème de définition et de traçabilité à instrumenter, sans prétendre avoir inspecté chaque événement.
- **1 an vs 2 ans** : mêmes 31 240 reps et 91 354 kg, mais jours entraînés 148→158 et temps 123 h 30→135 h 22 (activités anciennes sans reps de musculation ?). Plausible, non démontré.
- **Libellé faux** : « octobre concentre la part la plus productive » : 3 800 reps/11 j actifs (≈345,5) vs novembre 2 124/6 j (354). Les 64,1 % sont la part d'octobre dans les 5 924 reps de la fenêtre, pas « 64,1 % du volume d'octobre ». Novembre est légèrement supérieur par jour actif (+2,5 %).
- **Bonne candidate écartée** : « volume 30 jours > période précédente » (reps 2 727→5 924, +117,2 % ; jours actifs 12→17, +41,7 % ; reps/jour actif ≈227→≈348, +53,3 %), rejetée en `abstain_low_value`. Incohérence de métadonnées à résoudre avant publication (fenêtre courante 29 j, référence 30 j, `baselineSameLength: true`).
- **Répétition inter-fenêtres** : la hausse de +25,6 % des pompes inclinées est racontée sur 8 horizons (Aujourd'hui, 7 j, 30 j, 3 m, 6 m, 1 an, 2 ans, Toujours). L'historique éditorial est injecté mais son efficacité inter-fenêtres n'est pas démontrée (`comparison: null`).
- **« Toujours »** : annonce 3 650 jours dont 3 545 sans séance, remontant à nov. 2016 → inacceptable sans couverture fiable.
- **Exercices** : 12 anomalies de résolution de nom (`unresolved_exercise_name`) ; deux cartes « Relevés de genoux à la barre » avec deux IDs (505 : 16 et 30 oct., 120 reps ; 106 : 19 et 26 oct., 2 et 9 nov., 240 reps), même format 3×20. Ne pas fusionner sans preuve d'équivalence.
- **Programme** : actif « Programme Cycle 3+1 », 3 programmes en bibliothèque, mais aucun snapshot figé sur la fenêtre (7 jours reconstruits) alors qu'un taux de réalisation ≈64 % est calculé → tension à résoudre.
- **Corrélations** : `sleep_x_volume` déclaré « impossible » alors que 29 nuits Garmin existent ; `sleep_x_rpe` utilise les reps au lieu d'un RPE absent → diagnostic mal instrumenté.
- **Sources** : disponibilité ≠ couverture ≠ granularité (734 enregistrements de reps ; 540 charges simples, 0 profil par série ; circuits 4 progressions/0 définition ; étirements 8 au global/0 dans la fenêtre ; Garmin pas 90 j ; sommeil 29 nuits ; questionnaire 49 réponses).
- **Confiance** : « high » attribuée à une comparaison de sommeil 4 vs 10 observations → confiance mal définie.
- **Traçabilité** : cartes finales avec `informativeValue`/`score` nuls, `editorialTrail`/`rivals`/`collapsedInto` absents ; `metricFacts` à fiabilité haute avec IDs d'événements/snapshots vides.
- **Publication** : 10 cartes diagnostic vs 14 affichées dans le récap → non concluant (comparaison DOM indéterminée, captures de runs différents).
- **Familles Assiduité et Mobilité** : 1 candidat chacune, aucun sélectionné (normal si 0 étirement et preuve historique insuffisante ; faiblesse éditoriale si un signal valide a été supprimé au profit d'une carte répétitive).
- **Catégorie mal affectée** : une carte de productivité mensuelle classée en Sommeil à cause d'une phrase sur les nuits.
- **Perte éditoriale potentielle** : 76 candidates hors pack (32 intermédiaires + 44 déclassés). On ne sait pas combien sont de vraies conclusions distinctes et admissibles, ni combien sont des doublons de conclusion : l'indicateur de perte éditoriale (18.6) doit le trancher avant toute décision de réduction ou d'assouplissement.
- **Pas d'attribution de l'origine d'une faiblesse** : une carte manquante ou mauvaise peut venir de la source, de l'identité, du calcul, de la détection, du raisonnement, de la sélection, d'un doublon, de la rédaction ou de l'affichage ; ces défaillances ne sont pas classées (18.7).

**Verdict** : Momentum possède déjà les briques (trajectoires, séries détaillées, découverte de mouvements, familles musculaires, interruptions, croisements Garmin, enrichissement, déduplication, sélection). Il manque des garanties entre données, phénomènes, conclusions et cartes publiées. Performance (2,2 s) : non prioritaire.

---

## 2. Socle de données et de cohérence (priorité P0)

### 2.1 Bornes temporelles
- **Convention unique** pour récap, sélecteur, diagnostic, producteurs : fenêtre « N jours » = N dates calendaires inclusives se terminant aujourd'hui (30 j = 30 dates), fuseau Europe/Paris, bornes incluses.
- Chaque candidate porte `windowStart`, `windowEnd`, `nbDates` ; référence de comparaison de même longueur, vérifiée (`baselineSameLength` réel).
- **Journée en cours incomplète** : distinguer fenêtre contenant aujourd'hui (journée partielle), fenêtre de journées entièrement clôturées, et comparaison d'une journée en cours à une référence équivalente (même heure). Les analyses de tendance ne mélangent jamais silencieusement journée partielle et journées complètes (sinon fausse « baisse » à 10 h).
- **Séances traversant minuit** : définir une **date sportive de rattachement** (par défaut : début de séance ; règle configurable, stable et partagée par tous les calculs), distincte du timestamp réel, toujours conservé.
- **Changements d'heure** : jours de 23 h/25 h en Europe/Paris ; les périodes en jours se calculent en dates calendaires, jamais en soustrayant un nombre fixe de millisecondes.
- **Accept.** : « 30 jours » affiche et calcule les mêmes 30 dates partout ; le décalage d'une journée est détecté par test ; une séance 23 h 20→00 h 40 et une période contenant un changement d'heure ne créent ni double compte ni journée fantôme.

### 2.2 Contrat de métrique
Chaque compteur a une définition écrite et un ensemble d'événements inclus/exclus. Distinguer au minimum :

| Mesure | Définition |
|---|---|
| Jours avec répétitions de musculation classique (`strength_non_gtg_active_days`) | ≥1 rep valide de renforcement, **hors GTG** |
| Jours avec séance de musculation | séance reconnue comme telle |
| Jours d'activité sportive | musculation, course, cardio, autre retenue |
| Jours GTG | travail GTG |
| Jours prévus | plan historique fiable prévoit une séance |
| Jours réalisés | événements attendus documentés |

**Identifiants canoniques distincts**, impossibles à confondre (noms de code indicatifs) : `strength_non_gtg_reps`, `strength_non_gtg_active_days`, `gtg_reps`, `gtg_active_days`, `all_sport_active_days`. Le GTG étant aussi du renforcement, aucun libellé « jours avec répétitions » ne reste sans périmètre explicite (classique hors GTG, GTG, ou les deux).

**Enregistré ≠ réalisé.** Pour une prescription sans réalisation, même avec un plan historique fiable et une journée clôturée, Momentum affirme « aucune séance correspondant à la prescription de lundi n'est enregistrée », jamais « tu n'as pas fait ta séance » (activité possible hors application). Il calcule l'adhérence aux réalisations **documentées**.

Un événement n'est jamais additionné deux fois dans une même métrique. **Accept.** : l'écart calendrier/analyse (24 et 66 reps) est entièrement décomposable en une liste d'événements inclus/exclus.

### 2.3 Couverture par source (inconnu ≠ zéro)
- Calculer la **première date de couverture par source** (reps, Garmin, programme…), jamais inventée.
- « Toujours » = toutes les données disponibles ; la période documentée est affichée ; les années antérieures ne sont jamais comptées comme inactives. Les compteurs de 1 an/2 ans/Toujours peuvent couvrir des périodes différentes selon la rubrique.
- Évaluation de chaque donnée sur **deux dimensions indépendantes** : (1) **disponibilité** — présente et suffisamment couverte ? ; (2) **adéquation analytique** — permet-elle de répondre à *cette* question ? Une source peut être disponible et inadéquate (540 charges au niveau exercice : utiles pour un suivi de charge, insuffisantes pour une variation série par série → jamais de progression de charge série par série). Les anciens libellés Complet/Partiel/Contextuel/Indisponible deviennent des valeurs dérivées de ces deux dimensions, par question.
- Distinguer 4 états de croisement : données absentes / présentes mais non exploitables ensemble / calculé sans signal solide / calculé et publiable.

### 2.3 bis Charges, circuits, étirements
Charges au niveau exercice uniquement ; circuits sans définition = structures historiques non supposées connues ; étirements : pas de découverte de mobilité sans réalisations dans la fenêtre.

### 2.4 Identité des exercices
Trois identités : **exercice** (ID source conservé + identité canonique), **phénomène** (ex. hausse 28,7→36 reps sur cet arc), **éditoriale** (angle de lecture). Homonymes jamais fusionnés par défaut ; fusion seulement après preuve d'équivalence ; sinon libellés distinctifs. Les 12 anomalies non résolues : **bloquer uniquement les conclusions dont la preuve dépend de l'information manquante**, pas toute analyse touchée. Trois situations : identité complète et fiable → analyses détaillées autorisées ; événement fiable mais identité d'exercice incomplète → agrégations compatibles possibles (ex. compter ses reps dans un total d'activité si type et canal sont fiables), analyses dépendant de l'identité (trajectoire, comparaison entre pairs) bloquées ; identité ou catégorie incompatible avec la métrique → exclusion de cette métrique et signalement. Mesurer la perte de couverture et résoudre les anomalies. Deux IDs « Relevés de genoux » : à investiguer avant tout.

### 2.5 Provenance du programme
Statut par date : **historique figé** / **reconstruction** (indicatif) / **programme actuel** (prospectif) / **inconnu** (aucune conclusion sur séances manquées). Un programme modifié n'est jamais réécrit rétroactivement. Mécanismes complémentaires, à démarrer dès P0 : (a) **versionner les programmes** (chaque modification crée une version immuable avec période de validité et historique des modifications) ; (b) **figer le plan applicable à chaque séance/journée planifiée** (snapshot ou référence immuable vers version + prescription effective). Un snapshot quotidien seul ne suffit pas (modification en cours de journée) et n'est pas toujours nécessaire (une version immuable datée peut reconstituer le plan). Distinguer : plan initialement prévu / modification officiellement enregistrée (ex. report lundi→mardi, jamais lu comme séance manquée) / plan applicable après modification / réalisé. Une reconstruction fondée sur des versions documentées est admissible mais jamais présentée comme certaine si elle repose sur une supposition. Un taux de 64 % sans preuve historique n'est pas présenté comme adhérence passée.

### 2.6 Justesse des textes
Contrôle automatique des unités, dénominateurs, périmètres (« part de la fenêtre » ≠ « part du mois »).

### 2.7 Confiance décomposée
Quatre notions séparées, jamais fusionnées : fiabilité des données sources ; fiabilité du calcul ; solidité de la comparaison (taille d'échantillon, dispersion) ; portée autorisée de la conclusion.

### 2.8 Temps de l'événement, temps de connaissance et rejeu à date

Le moteur doit pouvoir rejouer une date passée **sans connaître les séances futures**. Sans cette garantie, les simulations chronologiques de la section 18 produiraient d'excellentes analyses rétrospectives mais de très mauvaises simulations de ce que Momentum aurait réellement pu savoir (exemple : le 20 octobre, le moteur « sait » qu'un format sera reproduit quatre fois ensuite et écrit « tu viens de consolider ce niveau » alors que la consolidation n'était pas encore démontrée).

**Deux dates distinctes sur les faits**
- `eventTime` : quand l'événement sportif s'est produit.
- `knownAt` : quand Momentum en a eu connaissance (importation Garmin tardive, correction, saisie rétroactive). Une séance effectuée le lundi mais importée le mercredi ne faisait pas partie des informations disponibles lundi.

```ts
type TemporalFact = { eventTime: string; knownAt: string; sourceId: string; revisionOf?: string };
type ReplayContext = { asOf: string; knowledgeCutoff: string; mode: "retrospective" | "as_of_simulation" };
```

**Deux modes temporels, jamais mélangés**
- **Mode historique rétrospectif** : analyser aujourd'hui une période passée avec toutes les informations actuellement connues, en distinguant les observations postérieures.
- **Mode simulation au fil du temps** : reconstruire exactement ce qui était connaissable à la date simulée, via `knowledgeCutoff`.

| Date simulée (six séances à 36 reps) | Information autorisée |
|---|---|
| Première séance à 36 | Un nouveau niveau de volume est observé |
| Deuxième séance à 36 | Le niveau est reproduit une fois |
| Quatrième séance à 36 | Une régularité commence à être mieux documentée |
| Sixième séance à 36 | La consolidation est davantage étayée |
| Après l'interruption de 42 jours | Le retour au même volume peut être constaté, si la reprise a eu lieu |

La première séance ne reçoit jamais la conclusion de la sixième. **Accept.** : aucune conclusion simulée au 20 octobre ne peut utiliser une séance ou une correction dont Momentum n'a eu connaissance qu'après la date de simulation. Indispensable pour évaluer honnêtement la mémoire (8), la détection des tendances et la rotation (18.9).

**Historique immuable des corrections.** `knownAt` ne suffit pas : si une séance du 20 octobre enregistrée à 30 reps est corrigée à 36 le 5 novembre et que la base remplace la valeur, le moteur ne peut plus reconstruire ce qu'il savait le 25 octobre. Chaque modification pertinente conserve donc la référence de l'événement modifié, l'ancienne et la nouvelle version (ou un journal d'opérations permettant de les reconstruire), sans recopier toute la base.

| Date | Événement | Version connue |
|---|---|---|
| 20 octobre | Séance enregistrée | 30 reps |
| 25 octobre | Simulation historique | 30 reps |
| 5 novembre | Correction de la séance | 36 reps |
| 11 novembre | Analyse rétrospective actuelle | 36 reps |

Deux questions distinctes : « que s'est-il passé le 20 octobre selon les connaissances actuelles ? » et « que savait Momentum le 25 octobre ? ». Les données déjà enregistrées sans historique ne seront pas nécessairement reconstructibles : la conservation commence **dès maintenant**, sans prétendre à une traçabilité passée qui n'existe pas.

### 2.9 Alignement temporel des sources Garmin et carte de couverture temporelle

La spécification précise comment les sources doivent être mises en relation avec les séances de musculation. Une nuit commencée lundi soir et terminée mardi matin est-elle associée au lundi ou au mardi ? Pour une analyse du sommeil lui-même, les heures réelles sont conservées ; pour une comparaison avec l'entraînement du mardi, il faut savoir quelle nuit précède la séance ; une séance réalisée après minuit complique encore le cas (date sportive, 2.1).

**Politique d'appariement**

| Donnée | Référence temporelle |
|---|---|
| Séance de musculation | Début, fin et date sportive |
| Nuit de sommeil | Début, réveil et date d'attribution documentée |
| Activité Garmin | Horodatage réel, type et identifiant source |
| Pas quotidiens | Date de mesure et couverture effective |
| Comparaison sommeil–séance | Relation temporelle explicitement définie |
| Correction ou importation tardive | Date de l'événement (`eventTime`) et date de disponibilité (`knownAt`, 2.8) |

**Doublons inter-modules** : une course stockée dans l'historique sportif et importée depuis Garmin ne devient pas deux activités indépendantes si les données montrent qu'il s'agit du même événement.

**Carte de couverture temporelle** (complète la « première date de couverture » de 2.3, nécessaire mais insuffisante : une montre portée trois mois peut avoir plusieurs journées sans données, et une nuit manquante au milieu d'une période couverte reste *inconnue*). Chaque journée est classée : **documentée**, **partiellement documentée**, **absente** ou **invalide**. Cette carte sert directement aux analyses Sommeil et Rythme et aux graphiques (lacune affichée, jamais zéro fictif). Elle est attachée à chaque **source, métrique et intervalle**, et non à un état unique par journée : une journée peut être suffisamment documentée pour les répétitions et insuffisamment pour les charges, ou contenir du sommeil Garmin sans information sur l'activité sportive ; cela conditionne les analyses croisées.

### 2.10 Comparabilité mécanique des charges, séries et variantes

Une traction avec 5 kg de lest n'est pas une traction avec 5 kg d'assistance ; une pompe déclinée à hauteur différente n'est pas forcément un mouvement comparable ; 8 kg sur un haltère peuvent signifier autre chose que 8 kg au total selon la convention de saisie. Sans conventions, les comparaisons en charge restent fragiles même si l'arithmétique est correcte.

Prévoir, **lorsque Momentum les connaît**, des métadonnées structurées de résistance et de variante :
```ts
type ResistanceModality = {
  kind: "bodyweight" | "added_load" | "assistance" | "external_total" | "per_implement" | "unknown";
  value?: number; unit?: "kg"; entryConvention?: "per_implement" | "total" | "unknown";
  variantKey?: string;           // hauteur, inclinaison, prise, amplitude…
  comparableWith?: string[];     // variantes jugées comparables, avec preuve
};
```
Règles : une charge est comparée à une autre uniquement si modalité, convention de saisie et variante sont compatibles ; sinon la comparaison est non concluante (5.3, issue c). Ces métadonnées alimentent 5.2, 5.6 et la décomposition des « kg soulevés » (5.3, point 5).

### 2.11 Provenance historique des objectifs sportifs

Les programmes sont versionnés (2.5) ; les **objectifs** doivent l'être aussi. Une personne peut avoir recherché principalement la force pendant trois mois, puis le développement musculaire : analyser ses anciennes séances selon son seul objectif actuel produirait des conclusions mal contextualisées.

Distinguer : l'**objectif actuel** ; les **objectifs applicables à chaque période** lorsqu'ils sont documentés (versions immuables avec période de validité, comme les programmes) ; les **caractéristiques du programme de l'époque** ; les **objectifs inconnus**, qu'on ne reconstitue jamais arbitrairement.
```ts
type GoalVersion = { id: string; goal: "strength"|"hypertrophy"|"consistency"|"other"; validFrom: string; validTo?: string;
                     declaredAt: string };   // uniquement des objectifs explicitement déclarés par l'utilisateur
```
Le moteur peut décrire un changement (« le nombre de répétitions par série a augmenté après ton changement de programmation » ; « la pratique enregistrée s'est progressivement orientée vers davantage de séries sur plusieurs familles musculaires ») sans connaître l'intention. Deux notions sont stockées **séparément** : l'**objectif déclaré** (versions historiques ci-dessus) et l'**orientation observée du programme** (`ObservedProgramOrientation` : caractéristiques compatibles avec un objectif, jamais présentées comme intention). Le moteur peut écrire « ton programme accorde davantage de place aux séries courtes sur des mouvements lestés », jamais « tu as décidé de privilégier la force » sans objectif déclaré. Ces versions alimentent le classement par objectif (5.3, 5.6) et les conclusions sportives (11).

### 2.12 Politique de comparaison statistique : `ComparisonPolicyRegistry`

La confiance décomposée (2.7) et la solidité de la comparaison supposent une politique précise pour choisir **quelle comparaison utiliser et quand sa conclusion devient fiable** (sommeil, progressions, changements de rythme). Problèmes à traiter explicitement :
- **Petits échantillons** : quatre séances contre dix n'ont pas la stabilité d'une tendance sur cinquante séances comparables.
- **Observations dépendantes** : dix séries d'une même séance ne sont pas dix séances indépendantes.
- **Périodes qui se chevauchent** : les 7 derniers jours sont inclus dans les 30 derniers ; jamais traités comme deux échantillons indépendants.
- **Comparateurs choisis après coup** : chercher parmi vingt périodes celle qui donne le plus grand pourcentage de hausse produit une analyse spectaculaire mais trompeuse ; toute comparaison sélectionnée parmi de nombreux essais le signale ou est écartée.
- **Variabilité propre à l'exercice** : deux répétitions d'écart sont remarquables sur un mouvement très stable, banales sur un mouvement très variable.

Le registre définit, pour chaque famille de comparaison : l'**unité d'observation** (série, séance, journée, semaine) ; la **période de référence** ; la **comparabilité** des exercices et conditions (2.10) ; la **gestion des chevauchements** ; la **dispersion et la représentativité** ; les **conditions d'usage** des moyennes, médianes et meilleurs résultats ; les **exigences pour qualifier une variation** de stable, notable ou durable. Une différence de moyennes n'est pas une différence de niveau habituel : une seule séance exceptionnelle peut déplacer fortement la moyenne, et le moteur reconnaît cet effet avant de conclure à une progression durable.

**Qualifications distinctes, pilotées par une politique versionnée** (jamais par un simple mot de la conclusion) : *variation arithmétique* (une valeur est supérieure ou inférieure : 35→36) ; *variation notable* (l'écart dépasse un seuil ou une référence adaptée à la métrique) ; *évolution répétée* (le changement apparaît sur plusieurs observations) ; *changement de phase* (le niveau habituel semble avoir changé) ; *stabilité relative* (dispersion limitée selon un critère défini : 34, 36, 35, 36, 35 peuvent former un format relativement stable). `MetricAssertion` (7.3) enregistre la méthode de comparaison, l'unité d'observation et la référence utilisée, pour que deux producteurs ne donnent pas deux sens à « stable ».

**Classes de détecteurs et statuts de relation.** Chaque détecteur est classé : *décomposition déterministe* (volume = jours actifs × reps par jour actif, démontrable directement) / *comparaison descriptive* / *association exploratoire* (relation entre deux variables distinctes, ex. sommeil et performances) / *projection* ; chaque classe a ses règles de validation. Une relation nouvellement proposée est **exploratoire** (à interpréter avec prudence) tant qu'elle n'est pas **confirmée sur données indépendantes** (sans réutiliser uniquement les observations qui ont servi à la découvrir) ; la plus marquante parmi vingt essais n'est jamais présentée comme une association durable.

---

## 3. Architecture cible

### 3.1 Quatre couches
1. **Faits normalisés** : séances, exercices, séries, charges, programmes datés, ledger musculaire, Garmin, GTG séparé.
2. **Profils et phénomènes partagés** : vues dérivées recalculables des événements (jamais des vérités concurrentes).
3. **Interprétations candidates** : les catégories consultent les profils et proposent des conclusions, sans recalculer leurs vérités.
4. **Cohérence, sélection, rédaction, vérification.**

Pipeline logique : observations fiables → détection de phénomènes → recherche d'explication → construction des conclusions (faits/interprétation/limites) → sélection éditoriale → rédaction et vérification. La rédaction n'invente pas la découverte. Le pipeline est piloté par un **contrôleur d'exploration multi-passes** (4.6) qui vérifie la couverture des domaines avant de considérer le travail terminé ; l'**admission** (production d'analyses admissibles et distinctes) est strictement séparée de la **présentation** (9.6). Une fois la conclusion structurée établie, un **PresentationPlanner** choisit la forme de la carte (texte, typographique, hybride) et, si un graphique apporte une valeur réelle, un **ChartPlanner** en établit le plan à partir des mêmes preuves que le texte (22.5).

### 3.2 Objets partagés
- **`sessionWorkProfile`** : reps, séries, charges documentées, format (séries × reps), nature des mouvements, référence personnelle, couverture musculaire, durée/densité si dispo, lien au programme.
- **`plannedVsPerformedAssessment`** : référence unique pour tout ce qui touche au programme (voir 3.3).
- **`trainingTrajectoryProfile`** : états observés, dates, preuves, transitions (ex. hausse initiale → niveau répété → interruption → reprise au même volume).
- **`muscleExposureLedger`** : exercices, séries, reps, charges connues, muscles, contributions primaires/secondaires, dates. Une série polyarticulaire n'est pas comptée comme plusieurs séries indépendantes.
- **`PhenomenonRegistry`** (état analytique : phénomènes, preuves, état, évolutions — « que sait Momentum ? ») et **`PublicationLedger`** (cartes publiées, horizons, dates, conclusions déjà expliquées — « qu'a-t-il déjà raconté ? ») : deux registres distincts (section 8). **Registre d'affirmations** structuré (section 7).
- **Contrats versionnés et sémantique commune** : chaque métrique, définition, détecteur, règle sportive et calcul porte un identifiant et une version (`definitionVersion`, `calculationVersion`) ; un vocabulaire commun (sujet, métrique, fenêtre, population, canal, opérateur) est partagé par toutes les couches.

### 3.2 bis Cinq niveaux conceptuels
| Niveau | Exemple | Nature |
|---|---|---|
| Événement | 36 reps enregistrées le 9 nov. | donnée source |
| Fait calculé | six séances consécutives à 36 reps | agrégation vérifiable |
| Phénomène | le volume de cet exercice s'est stabilisé | interprétation descriptive |
| Découverte | la hausse initiale est devenue un format régulièrement retrouvé | conclusion intéressante |
| Implication sportive | ce format sert de repère pour suivre une future évolution de charge/volume | interprétation orientée objectif |

Un phénomène ne mérite pas forcément une carte ; une découverte, potentiellement. Objet dédié, distinct des `MetricFact` :
```ts
type Discovery = {
  id: string; phenomenonId: string; thesis: string; conclusionType: string;
  supportingClaimIds: string[]; contextualClaimIds: string[]; previousInterpretationId?: string;
  changeFromPrevious: "new"|"confirmed"|"refined"|"revised"|"contradicted"|"unchanged";
  significance: number; explanatoryValue: number; historicalRelevance: number; eligibleHorizons: string[];
  editorialLevel: "major"|"in_depth"|"contextual"; explorationDomain: string; producerId: string; category?: string;
};
```
`changeFromPrevious` dit si une nouvelle séance apporte une découverte ou confirme un acquis (7e séance à 36 reps : événement nouveau, fait « sept séances », phénomène inchangé, découverte inchangée, confiance en la répétabilité en hausse, besoin de republier en baisse). Schéma de conception, non contrat existant. `editorialLevel` (10.9), `explorationDomain` (4.6) et `producerId` (le producteur d'origine est conservé pour la traçabilité, distinct de la catégorie attribuée selon la conclusion) servent la couverture et l'audit.

### 3.3 Contrat `plannedVsPerformedAssessment`
```ts
type PlannedVsPerformedAssessment = {
  date: string;
  programVersionId: string | null;
  planProvenance: "historical_snapshot" | "reconstructed" | "current_only" | "unknown";
  sessionStatus: "planned" | "in_progress" | "finished" | "cancelled";
  dayStatus: "open" | "closed";   // reports et corrections gérés
  totals: { plannedReps: number|null; performedReps: number; completionRatio: number|null;
            plannedExerciseCount: number|null; performedPlannedExerciseCount: number|null };
  muscleCoverage: Array<{ muscleGroup: string; plannedDirectSets: number|null; performedDirectSets: number;
    plannedReps: number|null; performedReps: number; plannedPresence: boolean|null; performedPresence: boolean;
    coverageStatus: "completed"|"partial"|"absent"|"not_planned"|"unknown" }>;
  execution: { matchedExerciseIds: string[]; addedExerciseIds: string[]; omittedExerciseIds: string[]; modifiedExerciseIds: string[];
               substitutedExerciseIds: string[] };
  work: { plannedMatchedReps: number|null; additionalReps: number; omittedPlannedReps: number|null; substitutedReps: number|null };
  prescriptionMatches: PrescriptionMatch[];            // appariement par prescription (3.3 bis, d)
  muscleExposureObserved: Array<{ muscleGroup: string; role: "primary"|"secondary"|"association_only"; sets: number }>;
  goalVersionId?: string | null;                       // 2.11
  evidence: { sourceEventIds: string[]; coverageStatus: string; calculationVersion: string };
};
```
Complétion globale (reps) et couverture musculaire viennent des mêmes observations mais ne sont **pas convertibles** l'une en l'autre. Complétion calculée séparément en journées, exercices, séries, reps, muscles.

### 3.4 Contrat de candidate (schéma indicatif, non extrait du code)
```json
{
  "phenomenon": { "type": "volume_rebound", "subject": "strength_training", "period": "2026-10",
    "excludeChannels": ["gtg"],
    "facts": { "septemberReps": 3704, "octoberReps": 4301, "septemberActiveDays": 12, "octoberActiveDays": 12 } },
  "interpretation": { "thesis": "Le volume augmente sans hausse de fréquence", "mechanism": "more_reps_per_active_day",
    "historicalContext": "june_higher_frequency", "conclusion": "Le volume revient sous une organisation différente",
    "depth": "D4", "forbiddenClaims": ["strength_gain","better_recovery","motivation_increase"] },
  "editorial": { "primaryCategory": "trajectory", "narrativeType": "rebound_with_changed_structure",
    "noveltyKey": "volume-rebound-2026-10", "eligibleForMainCard": true }
}
```
Thèse et conclusion construites **avant** la rédaction. Un moteur déterministe suffit pour l'essentiel (règles testables) ; le modèle local éventuel peut assister la formulation et proposer des hypothèses de recherche (4.8) ; il ne peut ni modifier les métriques canoniques, ni produire une conclusion publiable sans validation des preuves.

### 3.3 bis Précisions du modèle prévu/réalisé

**a) Travail apparié, ajouté, omis, substitué.** Exemple : 350 reps prévues ; 150 reps appartiennent effectivement au programme, plus 50 reps d'un exercice supplémentaire ; total 200. Calculer 200/350 ≈ 57 % mélange le travail conforme au plan et le travail ajouté. La complétion s'appuie sur le **travail correctement rapproché du programme**, les ajouts étant présentés séparément : les exercices supplémentaires sont du travail réel (ex. pectoraux, biceps, jambes), qui ne disparaît pas et ne gonfle pas artificiellement la réalisation des prescriptions. Quatre grandeurs : `plannedMatchedWork`, `additionalWork`, `omittedPlannedWork`, `substitutedWork`, et, pour chaque métrique de complétion, une règle indiquant précisément ce qui est équivalent au travail prévu.

**b) Exécution de la prescription ≠ exposition musculaire.** Un exercice de triceps prévu mais non réalisé, alors qu'un développé incliné sollicite secondairement les triceps : il y a *exposition indirecte* des triceps, pas *exécution* de la prescription. Le contrat distingue donc l'**exécution de la prescription** de l'**exposition musculaire effectivement observée**, pour ne pas surestimer la couverture d'un programme grâce aux contributions secondaires des mouvements polyarticulaires.

**c) Statut de séance et statut de journée indépendants** (intégrés au contrat 3.3). Une séance peut être terminée sans que la journée soit clôturée ; une journée peut comporter plusieurs séances. Une séance de pectoraux terminée à midi n'est donc pas lue comme l'abandon définitif des jambes si une seconde séance est prévue le soir.

**d) Appariement au niveau des prescriptions.** Chaque exercice prévu porte un `planItemId`, auquel sont associées les séries réellement enregistrées (chacune avec son identifiant). Les reps totales ne suffisent jamais à valider une prescription : 4 × 5 prévus et 2 × 10 réalisés ne sont pas le même format malgré un total identique ; sans appariement par identifiant et par séries, les tractions seraient à tort déclarées réalisées à 100 %.
```ts
type PrescriptionMatch = { planItemId: string; performedSetIds: string[]; exerciseDone: boolean;
  plannedSets: number|null; matchedSets: number; matchedReps: number; formatRespected: boolean|null;
  resistanceDiffers: boolean|null; additionalSetIds: string[]; overshootReps: number;
  substitution?: { exerciseId: string; equivalence: "equivalent"|"partial"|"undetermined" } };
```
Dépassements : 40 reps prévues et 60 réalisées donnent 40 reps couvertes et 20 supplémentaires (`overshootReps`), jamais 150 % de « programme accompli » ; les 60 restent dans le volume réellement enregistré. Exemple de contrôle : tractions 2 × 10, dips 4 × 10, curl absent, pompes 4 × 15 supplémentaires → tractions non conformes au format prévu, dips conformes, curl omis, pompes en travail additionnel.

### 3.5 Séparation par profil utilisateur

Momentum ayant vocation à fonctionner localement, **les données et historiques éditoriaux sont séparés par profil utilisateur** dès maintenant : `PhenomenonRegistry`, `PublicationLedger`, `ExposureLedger`, `EditorialFeedbackLedger` (8.8, 8.9) et caches de calcul portent un `profileId`. Aucun système de synchronisation complexe n'est requis dès la première version, mais aucun registre ne suppose qu'il n'existera éternellement qu'un seul historique sportif.

---

## 4. Raisonnement d'analyse : thèse, profondeur, approfondissement

### 4.1 Thèse avant sujet
Une carte porte une proposition explicative (« Le rebond d'octobre repose sur plus de travail par journée actif, sans retour à la fréquence de juin »), pas un simple constat. Chiffres = démonstration, ils ne dictent pas le titre.

### 4.2 Profondeur atteinte (D0–D5)
D0 fait simple ; D1 comparaison ; D2 décomposition (mécanisme) ; D3 contexte historique ; D4 lecture du parcours ; D5 explication fine (contribution séries/exercices/familles). Modèle de profondeur, pas note de qualité : un jalon exceptionnel peut mériter D1. Sur un phénomène important avec données riches, viser D3–D4 avant de finaliser. **Ne pas en faire une course à la complexité** : distinguer la profondeur *explorée* (jusqu'où le moteur a cherché), la profondeur *nécessaire* (ce que la conclusion exige) et la valeur explicative *obtenue*. Explorer jusqu'à D5 peut conclure qu'une conclusion D2 en deux phrases suffit ; la longueur d'une carte ne dépend pas de la profondeur de calcul. **Critère d'arrêt (utilité marginale)** : continuer tant que de nouvelles observations ont une chance raisonnable de changer la thèse, son mécanisme ou sa portée ; s'arrêter quand les approfondissements restants ne modifieraient que des détails secondaires.

### 4.3 Approfondissements prioritaires selon le phénomène (pas toutes les sources)
| Phénomène initial | Approfondissement |
|---|---|
| Hausse de volume | fréquence, séries, exercices, charges |
| Retour d'exercice | format antérieur, durée d'absence, séances de reprise |
| Niveau stable | durée de répétition, conditions, changement de charge |
| Changement de famille musculaire | contributions, jours d'exposition, redistribution |
| Interruption | fréquence avant/après, structure de la reprise |
| Record de séance | composition, caractère exceptionnel |
| Modification du programme | version historique, exercices maintenus/remplacés/supprimés |
| Changement de sommeil | durée, horaires, dispersion, couverture |

Pour une hausse de volume, tester les hypothèses : plus de jours actifs ? plus de reps par jour actif ? plus d'exercices par séance ? plus de séries ? concentration sur certaines familles ? charges ? S'arrêter au niveau que les données autorisent.

### 4.4 Bibliothèque de méthodes de découverte (chantier clé pour augmenter les candidates admissibles)
Catalogue extensible et versionné de **détecteurs analytiques**. Contrat obligatoire par détecteur : identifiant et version ; type de phénomène (consolidation, rupture, redistribution, reprise…) ; sources nécessaires ; couverture minimale ; conditions de déclenchement ; comparateurs possibles (historique récent, meilleure période, avant interruption…) ; hypothèses à vérifier (pourquoi la métrique a-t-elle changé ?) ; conclusions autorisées ; conclusions interdites ; critères d'intérêt (pourquoi mériter une carte) ; clé de mémoire (reconnaître le même phénomène à une autre date) ; politique de rotation et de réouverture ; tests (cas où il réussit, cas où il s'abstient). Pas de seuils universels : six séances sont très significatives pour un mouvement mensuel, peu pour un mouvement quotidien (fréquence historique, dispersion, échelle temporelle).

Exemple `exercise_format_consolidation` : entrée = historique d'un exercice identifié (séries, reps) ; recherche un niveau/format qui se répète après variation ; vérifie occurrences, dispersion, durée, interruptions, changements de charge/variante ; autorise « d'un volume variable à un format régulièrement retrouvé » ; interdit « plateau de force » ou « le muscle ne progresse plus » ; une occurrence identique actualise le constat sans republier ; réouverture sur changement durable de format, charge nouvelle, interruption significative ou nouveau rôle dans le programme.

On augmente la diversité des **raisonnements**, pas des phrases, sans abaisser les exigences. Avant d'assouplir un filtre, exploiter le registre : connaître le motif de sortie des 76 candidates hors pack (garde-fous utiles : sommeil petits échantillons, noms non résolus).

### 4.5 Règles déterministes types
- Volume ↑ et fréquence stable → chercher volume par journée active.
- Séries ↑ à reps/série identiques → travail accru par ajout de séries (ne pas prétendre une progression des reps/série).
- Volume identique sur plusieurs séances après une hausse → consolidation d'un format.
- Retour après interruption au même volume → retour au niveau antérieur (≠ niveau de performance entièrement retrouvé).
- Fréquence d'un exercice ↓ pendant qu'un voisin ↑ → redistribution, sans supposer de substitution volontaire.
- Même format avec charge supérieure → progression en résistance (invisible dans les reps).

### 4.6 Exploration en plusieurs passes et contrôle de couverture

Aujourd'hui, si Momentum détecte quatre phénomènes solides et s'arrête, le pipeline peut être jugé réussi alors que le sommeil, les charges, la structure musculaire, les séries, le programme, les exercices récemment réintroduits ou les variations entre journées n'ont pas été explorés. Avant de considérer le travail terminé, le moteur vérifie qu'il a exploré **tous les domaines pertinents** pour la période et les sources disponibles.

**Domaines d'exploration** (exemple : après une séance de musculation enregistrée aujourd'hui) :

| Domaine | Ce que le moteur doit examiner |
|---|---|
| Activité | Volume et composition de la séance |
| Progression | Évolution des exercices réalisés |
| Structure | Groupes musculaires sollicités et répartition |
| Exigence | Séries, résistances, formats et comparaison avec l'habitude |
| Programme | Prévu et réalisé, si le plan daté est fiable |
| Rythme | Place de la séance dans la semaine |
| Trajectoire | Retour, consolidation, nouvelle phase ou maintien |
| Répertoire | Apparitions, retours et changements de place |
| Sommeil | Évolution propre au sommeil si les données Garmin le permettent |
| Historique du jour | Comparaison avec les précédents jours équivalents |

Ce sont des **domaines à examiner, pas dix cartes obligatoires**. Si l'un de ces domaines contient trois découvertes intéressantes, on n'en garde pas une seule par principe.

**Quatre passes.**
1. **Découvertes évidentes** : progressions, reprises, records, changements de rythme, nouvelles habitudes, évolutions majeures.
2. **Découvertes approfondies** : séries détaillées, charges, composition des séances, comparaisons historiques, évolution des familles musculaires, écarts prévu/réalisé.
3. **Relations transversales** : comparaisons entre plusieurs exercices, catégories, périodes et dimensions de l'entraînement.
4. **Recherche des angles négligés** : le moteur examine les domaines exploitables qui ont produit peu de découvertes et vérifie si des analyses intéressantes ont été manquées, **sans chercher à remplir artificiellement** ces domaines. Exemple : le moteur produit vingt analyses dont quinze en Progression et cinq en Rythme ; il ne se dit pas qu'il faut trois analyses de Sommeil et deux de Structure pour équilibrer, mais il se demande : « ai-je réellement examiné les données de Structure disponibles, ou mes producteurs de Progression ont-ils pris toute la place ? ». C'est une vérification d'exhaustivité de la recherche, pas un quota de publication.

Chaque passe respecte le critère d'arrêt par utilité marginale (4.2).

**Règle de complétude.** Une période n'est pas suffisamment explorée parce que le moteur a atteint un nombre satisfaisant de cartes. Elle l'est lorsque les méthodes de découverte applicables ont été exécutées, que les conclusions candidates ont été évaluées et qu'**aucune découverte admissible n'a été écartée uniquement pour respecter une limite quantitative**.

**Piège à éviter.** Une séance à neuf exercices ne produit pas automatiquement neuf cartes de Progression, neuf d'Activité, neuf de Structure et neuf d'Exigence : on examine ces possibilités, on retient les conclusions réellement différentes. L'objectif est une forte densité d'informations utiles, pas une multiplication mécanique des phrases.

### 4.7 Diagnostic de sous-exploration

Si le moteur n'obtient que deux analyses sur une période riche en données, ce n'est pas immédiatement un résultat satisfaisant. Une alerte de diagnostic se déclenche lorsque le nombre de conclusions est inhabituellement faible par rapport à la richesse des données (nombre de séances, d'exercices, de séries, de nuits Garmin, de versions de programme…). Elle déclenche une **recherche des causes de sous-production, jamais la fabrication de nouvelles cartes**. Questions posées : les données sont-elles réellement pauvres ? des producteurs n'ont-ils rien trouvé ? les comparaisons historiques ont-elles été exécutées ? des candidates ont-elles été rejetées par des règles trop strictes (rivalité, filtres, admissibilité) ? existe-t-il des angles pertinents non explorés ? Les causes sont classées selon la taxonomie des défaillances (18.7). Si la réponse finale est qu'il n'existe réellement que deux conclusions intéressantes, deux suffisent : mais le moteur doit avoir **démontré** qu'il a suffisamment cherché, plutôt que de s'arrêter parce qu'il a rempli une petite sélection.

### 4.8 Recherche d'hypothèses : `AnalyticalHypothesisPlanner`

Risque : le moteur reste prisonnier de son catalogue de détecteurs (4.4, 19). Une situation inhabituelle peut apparaître sans qu'aucun détecteur ne soit conçu pour reconnaître l'interaction entre ses événements ; le moteur passe alors à côté d'une découverte faute de question programmée. L'objectif n'est pas seulement cinquante règles de plus, mais un système qui examine les résultats de plusieurs règles et se demande : *« y a-t-il quelque chose d'intéressant à comprendre en rapprochant ces observations ? »*

**Rôle.** Une couche qui **ne produit jamais directement une carte** : elle propose des questions supplémentaires à vérifier à partir des phénomènes déjà détectés. Exemple : le moteur constate une réduction des journées actives, une hausse des séries lors des journées maintenues, une présence accrue de certains exercices et un programme à la structure modifiée ; la couche propose « la hausse des séries par journée s'explique-t-elle principalement par la concentration de plusieurs exercices sur moins de jours ? ». Le moteur retourne aux événements : relation démontrée → découverte ; sinon, hypothèse rejetée.

**Deux droits distincts pour un éventuel modèle local** (précise et assouplit la limite « fluidification du style seulement » de 3.4 et 16.9) :
- **Proposer une hypothèse** : un modèle local peut suggérer une relation à explorer ;
- **Valider et affirmer** : seul un calcul vérifiable, fondé sur les sources et les règles sportives applicables, autorise la publication. Le modèle ne modifie jamais un calcul et n'affirme jamais ce que la couche analytique n'autorise pas.

Un modèle peut donc aider à poser des questions auxquelles les détecteurs n'ont pas pensé, sans jamais avoir le droit d'inventer les réponses — raisonnement souple associé à un moteur de calcul déterministe. **Déploiement** : pas nécessairement en première version, mais sa **place est prévue dès maintenant** dans l'architecture (entre détection de phénomènes et recherche d'explication, 3.1) et dans le contrat des détecteurs (19.6), sous peine de modifier profondément le catalogue plus tard. Chaque hypothèse testée est tracée (posée, vérifiée, retenue/rejetée), et soumise à la politique de comparaison (2.12) contre les sélections après coup. La recherche est **bornée et traçable** (exploration ouverte, 0.1 bis) ; toute relation entre deux variables distinctes qui en est issue est publiée comme **exploratoire** tant qu'elle n'est pas confirmée sur données indépendantes (2.12).

---

## 5. Comparer et hiérarchiser des séances (100 vs 200 reps)

**Principe** : le volume de reps décrit une seule dimension. Pas de score universel de difficulté ni de coefficient `Σ reps × difficulté` présenté comme effort ou qualité.

### 5.1 Quatre notions distinctes
Complexité technique ; résistance mécanique (charge, poids de corps, bras de levier) ; effort relatif (proximité de l'échec — **inconnu sans RPE/RIR**) ; quantité de travail (séries, reps, durée). Les notes de difficulté de la banque d'exercices (8 niveaux, multiplicateurs) servent à **caractériser** les mouvements, pas à convertir en stimulus.

### 5.2 Comparer d'abord chaque exercice à son propre historique
Ex. 4×5 tractions sans lest → 4×5 avec 5 kg : un système de reps annonce 0 % ; Momentum doit repérer la hausse de résistance.

### 5.3 Algorithme
1. **Profil multidimensionnel** `P(s) = (R, S, C, M, D, H, A)` : reps, séries, charges documentées, couverture musculaire, durée/densité, écarts aux performances historiques, adhérence au programme. Les dimensions manquantes ne deviennent jamais des zéros.
2. **Question explicite** : « plus de reps ? plus de séries ? plus de travail polyarticulaire lesté ? plus de progression personnelle ? plus difficile ? ». On répond uniquement à ce qui est justifiable ; « plus difficile » est souvent indéterminable.
3. **Classement par objectif** : prise de muscle → séries pertinentes, groupes, résistances, progression d'exercices comparables ; force → charges et performances suivies ; assiduité → prévu/réalisé ; rythme → répartition temporelle.
4. **Quatre issues formelles d'une comparaison** : (a) *supériorité démontrée sur une dimension* (« lundi : 15 séries contre 13 ») ; (b) *supériorité conditionnée à un objectif* (« lundi plus pertinent pour la progression sur tractions lestées : hausse de charge vérifiée ») ; (c) *comparaison non concluante* (« mardi : plus de reps, mais difficulté relative non documentée ») — sortie normale, pas un échec ; (d) *la comparaison elle-même est la découverte* (« deux séances ne poursuivent pas le même type de travail enregistré »), même sans dominance. « Non départageables globalement ; profils différents » est une réponse valide.
5. **Attention au tonnage** : les kg soulevés affichés par Momentum doivent d'abord être définis (poids de corps, lest, haltères, assistance, charges par exercice). Utile comme indicateur interne, peu comparable entre mouvements : jamais « plus de kg soulevés » ⇒ « séance mécaniquement plus exigeante » sans cette vérification.

Exemple de référence : lundi 100 reps/15 séries/3 polyarticulaires dont 2 lestés ; mardi 200 reps/13 séries/exercices localisés. Conclusion permise : structures de travail différentes ; lundi devant sur séries, travail polyarticulaire lesté, progression de charge, couverture du programme ; mardi sur reps. Non permise : lundi plus fatigant ou plus hypertrophiant.

### 5.4 Score synthétique (phase ultérieure, optionnel)
Seulement si critères et poids documentés, indicateurs normalisés, manquants non zéro, un score par objectif, nom honnête (pas « difficulté réelle »), facteurs principaux expliqués.

### 5.5 Exigence : capacité transversale (décision section 16)
Règles : multidimensionnalité ; référence personnelle ; charges connues uniquement ; changements de format (pas seulement totaux) ; nature des mouvements ; intérêt selon l'objectif ; incertitude assumée sur l'échec ; non-redondance avec Progression ; conclusion sur la nature du travail. Décomposer aussi un volume inhabituel (ex. 536 reps : exercice très long ? plus de séries ? plus de mouvements ?) plutôt qu'annoncer un record.

### 5.6 Arbitrer lorsque les indicateurs divergent

Le profil multidimensionnel (5.3) est descriptif ; le mécanisme de décision exige deux types de comparaison :

**A. Comparaison de propriétés observables** — résultats précis, sans score universel : « lundi comporte davantage de séries, de mouvements polyarticulaires et de hausses de charge identifiées ».

**B. Évaluation de pertinence par objectif** — parmi les propriétés mesurées, lesquelles comptent pour l'objectif de cette séance ? Pour progresser sur les tractions lestées, une hausse de résistance à format comparable est déterminante ; pour une séance de travail musculaire global, la couverture des familles prévues peut compter davantage.

| Dimension (exemple fictif) | Lundi | Mardi |
|---|---|---|
| Répétitions | 100 | 200 |
| Séries | 15 | 13 |
| Mouvements polyarticulaires | 3 | 0 |
| Charge supérieure à l'habitude | 2 exercices | 0 identifié |

(Charges et performances doivent être comparables ; zéro progression *identifiée* n'implique pas zéro effort.) Le moteur produit un **verdict ciblé**, et non un simple « impossible à départager » : *« Lundi est la séance la plus marquante de ces deux journées pour la progression en résistance, grâce aux hausses de charge enregistrées. Mardi reste devant sur le nombre de répétitions. »* Il détermine **sur quoi** il peut départager. Sans comparabilité des charges et variantes (2.10), le verdict reste non concluant.

---

## 6. Catégories

### 6.1 Principe
La catégorie est déterminée **après** la thèse, selon la conclusion centrale (pas selon le producteur d'origine). Une catégorie peut ne rien produire sur une période. Une seule carte porte une même conclusion centrale d'un phénomène (pas de doublon de conclusion) ; les autres lectures du même phénomène alimentent contexte ou preuves. Des conclusions **réellement différentes** sur un même exercice ou un même phénomène peuvent coexister (voir 0.1 et 9.6).

| Conclusion centrale | Catégorie |
|---|---|
| Un exercice progresse à conditions comparables | Progression |
| Un exercice apparaît/disparaît/devient régulier/change de place | Répertoire |
| Un exercice ou muscle prend plus/moins de place relative | Structure & répartition |
| La pratique passe d'une phase à une autre | Trajectoire & transitions |
| Les jours de séance se rapprochent/s'espacent/se regroupent | Rythme |
| Particularité de composition d'une séance/volume | Activité |
| Écart récurrent plan daté vs réalisé | Programme & pratique réelle |
| Horaires/durée de sommeil évoluent durablement | Sommeil |

### 6.2 Les cinq catégories existantes revues
- **Activité** : de « compter » à « expliquer la composition du travail ». Ex. « 100e séance » : garder comme jalon court, en l'enrichissant (50 premières séances 14 259 reps ≈285/séance ; 50 suivantes 14 915 ≈298/séance, +4,6 %), puis composition des deux blocs. Jalons prioritaires au moment où ils surviennent. Record ≠ progression physique.
- **Progression** : distinguer progrès, consolidation, maintien, recul, reprise ; 6 cas à ne pas formuler pareil (plus de séries ; plus de reps/série ; charge ↑ ; retour à l'ancien niveau ; record ponctuel ; ancien record devenu reproductible). Ordre : comparabilité réelle → mécanisme → trajectoire multi-séances → niveau historique → portée de la conclusion (volume ≠ force). Une stabilité peut être une découverte (6×36 après une hausse) ; « 4×12 sur 4 séances » sans évolution ne mérite pas de carte principale. Ex. pompes déclinées : reprise après 28 j, 10-10-10-6 vs ≈5×10 → séries de 10 retrouvées, volume complet non retrouvé.
- **Sommeil** : phénomène propre au sommeil (durée, horaires, régularité, interruptions, couverture), pas de rapprochement anecdotique avec une séance (ex. nuit de 9 h 39 + reprise). Ex. « horaires déplacés de ≈3 h 11 pour 39 min de variation de durée ». Dates appariées pour les croisements ; relation répétée ≠ coïncidence ; pas de carte pour « une nuit un peu plus longue » sans caractère inhabituel.
- **Rythme** : comprendre la continuité (intervalles, regroupements, répartition hebdomadaire, changements de cadence, présence/absence de données). Ex. « 4 jours sans renforcement (3–6 nov.), puis 4 jours consécutifs, 1 319 reps ». Aucune journée sans séance qualifiée de repos volontaire/fatigue/séance manquée sans preuve. Un « fonctionnement par blocs » n'est affirmé que sur assez de semaines.
- **Répertoire** : nouveau, retour, devenu régulier, perd sa place, remplacé par variante. Ex. face pull : 14 séances/154 j, 646 reps, 3×15 → 4×15. Frontière : Répertoire si l'apparition/disparition/régularité domine ; Progression si résultat/format ; Structure si relation aux autres exercices. Séances sans détail de séries exclues de la comparaison de formats.

### 6.3 Nouvelles catégories visibles (3)
**Structure & répartition** — où va le travail : redistribution entre exercices, concentration, exposition musculaire, polyarticulaire vs isolation, couverture inégale, diversification. Conditions : relation structurante sur périodes comparables ; contributions directes/indirectes distinguées ; pas de double comptage de série ; pas de programme idéal universel. Ex. poussée stable à 600 reps mais dips 240→100, pompes 360→500 : volume stable, composition mécanique changée.

**Trajectoire & transitions** — phases et états : installation, consolidation, recul, interruption, reprise, retour, réorganisation, transition de programme. Cycle émergence → confirmation → consolidation → transformation/rupture (pas de seuils universels ; dépendent de la fréquence et de la variabilité). Règles : ordre chronologique ; états réellement différents ; pic isolé ≠ changement durable ; interruption ≠ arrêt de pratique ; nouvelle preuve ≠ nouvelle découverte ; réviser les conclusions dépassées. Ex. juin 6 947 reps/22 j (≈316/j) → sept. 3 704/12 j (≈309/j) → oct. 4 301/12 j (≈358/j) : d'abord baisse de fréquence, puis hausse du travail par jour maintenu. (Vérifier avec les mois intermédiaires.)

**Programme & pratique réelle** — trois niveaux : séance, récurrence, adaptation (le programme réellement exécuté s'éloigne-t-il de la version prévue ?). Statuts : réalisé comme prévu / partiel / omis (après clôture) / ajouté / remplacé explicitement / substitution possible / indéterminé. Séance en cours ≠ clôturée ; jour sans séance non « manqué » sans plan historique fiable et journée clôturée ; omission répétée par famille (1 absence = observation ponctuelle ; ex. 4/5 = sous-couverture récurrente) ; correction détectée quand un groupe omis revient. **Gated** : ne s'active que sur les dates à plan historique fiable (version immuable ou snapshot).

**Contrats de production renforcés des trois catégories** (chaque catégorie doit apporter ce que les existantes ne savent pas exprimer) :
- *Structure & répartition* — quatre détecteurs prioritaires : **redistribution** (le travail se déplace d'un exercice vers d'autres), **concentration** (part croissante sur quelques mouvements), **couverture** (familles présentes/absentes de façon récurrente), **diversification** (plus de variantes pour une famille). Garde-fou : la répartition en reps n'est jamais une mesure directe de stimulation physiologique (100 reps de mollets ≠ 100 reps de tractions) ; pour la programmation musculaire, privilégier séries documentées et expositions, reps pour les comparaisons descriptives. Définir « exposition » : cible principale / sollicitation secondaire / simple association banque — états non équivalents.
- *Trajectoire & transitions* — trois opérations : **segmenter** (phases réellement différentes), **relier** (ce qui change entre phases), **réviser** (mettre à jour l'interprétation quand une phase apparaît). Distinguer phase descriptivement distincte / changement de phase assez durable pour être raconté / événement isolé entre deux phases. Responsable des **contrastes entre horizons** (« pectoraux : moins de place sur 3 mois, exposition en hausse sur 4 semaines »), qui naissent de la comparaison de deux lectures temporelles, pas d'un producteur de tendance.
- *Programme & pratique réelle* — trois axes : **conformité** (ce qui correspond au plan), **couverture** (familles ayant reçu le travail attendu), **adaptation** (écarts devenus changements répétés). Les reps prévues ne sont pas l'unique référence : séance où toutes les séries sont présentes mais moins de reps ≠ séance où un groupe est entièrement omis. Indicateurs distincts pour journées, exercices, séries, reps, muscles, jamais recombinés immédiatement en note unique.

**Producteur et catégorie sont deux identités.** La catégorie est attribuée à la découverte selon sa conclusion ; le producteur d'origine est conservé pour la traçabilité (un phénomène né d'une comparaison de reps peut devenir une carte Trajectoire).

### 6.4 Exigence & nature du travail
Pas de catégorie visible séparée (voir 5.5) : capacité transversale utilisée par Activité (records de volume, séances remarquables), Progression (hausses de charge invisibles dans les reps) et Structure. Une carte visible « nature du travail » reste possible dans Activité quand la comparaison de séances est la découverte.

### 6.5 Mots de constance
Autorisés : assiduité (proportion prévu/réalisé), constance (répétition sur plusieurs semaines), régularité (stabilité des intervalles), discipline (terme éditorial pour une assiduité durable). Non déductible : motivation. Ex. « le lundi est l'un de tes rendez-vous les plus fiables : sixième fois consécutive ».

### 6.6 Jours de semaine
Trois références distinctes : même jour calendaire / même type de séance / même version du programme. Un décalage lundi→mardi n'est pas une perte d'assiduité. Un lundi peut être constant en présence et irrégulier en exécution (ex. 6/6 lundis réalisés, jambes absentes 3/4 fois) : exprimer les deux. Si les jambes reviennent, la carte réagit immédiatement (correction d'une sous-couverture), sans conclure à une habitude.

---

## 7. Cohérence des conclusions

### 7.1 Une séance, plusieurs vérités
Exemple 56 % : 196/350 reps (56 %) ; 2 groupes sur 3 ; jambes 0 % ; pectoraux 120/120, biceps 76/80. Interdits : « mauvaise séance, engagement en baisse » et « largement respectée ». Conclusion : haut du corps maintenu, jambes absentes ; travail effectué reste utile ; omission répétée → couverture planifiée réduite. Pas de verdict global « bonne/mauvaise séance » ; positif et négatif coexistent, ordonnés par importance.

### 7.2 Règle supérieure
Une catégorie peut enrichir, contextualiser ou expliquer une autre dimension d'une conclusion existante ; elle ne peut ni contredire un fait validé, ni changer silencieusement sa définition, ni lui attribuer une cause non démontrée.

### 7.3 Registre d'affirmations
```ts
type AnalyticalClaim = {
  id: string;
  subject: { type: "exercise"|"muscle"|"session"|"program"|"period"; key: string };
  scope: { start: string; end: string; channel: "strength"|"gtg"|"cardio"|"sleep"; comparatorId?: string };
  metric: string;
  claimType: "observed_fact"|"descriptive_inference"|"sporting_implication"|"conditional_projection";
  statement: string; evidenceIds: string[]; limitations: string[];
  status: "supported"|"conditional"|"unsupported";
};
```
**Limite à corriger** : `metric` et `statement` en chaînes libres ne permettent pas de vérifier une contradiction (« volume de poussée +12 % » et « dips −8 points » ne se contredisent pas ; « séance entièrement réalisée » et « exercices de jambes obligatoires absents » si, avec peu de vocabulaire commun). Un `AnalyticalClaim` contient donc une ou plusieurs **assertions structurées** + une interprétation :
```ts
type MetricAssertion = {
  subjectId: string; metricId: string; windowId: string; comparatorWindowId?: string;
  populationId: string; channel: string;
  operator: "eq"|"gt"|"lt"|"increase"|"decrease"|"stable"|"absent"|"present";
  value?: number; referenceValue?: number; unit?: string;
  comparisonMethod: string; observationUnit: "set"|"session"|"day"|"week"; referencePolicyId: string;   // 2.12
  qualification?: "arithmetic_variation"|"notable_variation"|"repeated_evolution"|"phase_change"|"relative_stability";
  evidenceIds: string[]; definitionVersion: string;
};
```
**Trois cohérences distinctes**, jamais traitées par une seule comparaison de textes : *numérique* (valeurs, unités, bornes, populations), *logique* (conclusions non incompatibles compte tenu des faits), *éditoriale* (pas de répétition inutile). **Liens typés entre découvertes** : `supports`, `refines`, `updates`, `supersedes`, `contradicts`, `related_to` (ex. « tu atteins 36 reps » soutenu par une séance ; « tu reproduis régulièrement 36 reps » affine ; « tu dépasses 36 à conditions comparables » remplace la lecture de stabilité ; « jambes absentes du programme » contredit « toutes les familles prévues réalisées »).

Deux affirmations ne sont contradictoires que si sujet, métrique et périmètre sont compatibles. « Volume ↓ » et « charge ↑ » coexistent ; « programme entièrement respecté » et « exercice obligatoire absent » non.

### 7.4 Précédence
1 faits/calculs canoniques (non contredisibles à périmètre identique) → 2 relations descriptives démontrées → 3 implications sportives (compatibles avec 1-2) → 4 projections (hypothèses affichées) → 5 conseils/formulations (ne modifient ni faits ni interprétations).

### 7.5 NarrativeCoherenceEngine (entre conclusions et publication)
Détecte : conflit numérique (bloquer), sémantique (bloquer/reformuler), interprétatif (vérifier les dimensions), éditorial (fusionner/choisir/reléguer). Relation entre candidates : identiques → dédupliquer ; même thèse preuves différentes → fusionner les preuves ; complémentaires → garder si valeur propre ; indépendantes → cohabitent ; contradiction apparente → comparer métriques et périmètres ; réelle → bloquer. Contrôle final après rédaction (une phrase comme « majeure partie du programme » doit préciser reps, exercices ou muscles).

### 7.6 Cohérence entre horizons
30 j « pectoraux en hausse », 3 m « part relative en baisse », 6 m « toujours dans le haut du classement » peuvent être vrais mais sont à présenter avec leur comparateur. Un contraste utile devient une découverte (« reprise récente après un recul sur trois mois »).

### 7.7 Contrat sémantique partagé : calendrier, distinctions, notes et analyses

La refonte concerne surtout les cartes Analyse, alors que Momentum juge déjà les performances ailleurs : records et distinctions, meilleures semaines, meilleures journées en répétitions, volumes en kilogrammes, notes globales de journée (ex. 72/100), étoiles et multiplicateurs d'exercices, statistiques de pratique, XP et maîtrise. Risque : lundi (100 reps, mouvements lestés, forte progression de charge) vs mardi (200 reps, travail localisé) ; Analyse conclut que les profils diffèrent et qu'un classement global n'est pas justifié, tandis que le calendrier attribue à mardi « Meilleure journée d'entraînement ». Deux parties du même produit racontent deux histoires incompatibles.

On ne demande pas à l'analyse de **contrôler** les récompenses ou les notes, mais de partager avec **Analyse, Calendrier, Récapitulatif, Graphiques et modules de distinctions** un **contrat sémantique** :

| Libellé | Critère clair |
|---|---|
| Journée avec le plus de répétitions | Maximum de répétitions enregistrées |
| Journée avec le plus de séries | Maximum de séries reconnues |
| Journée avec la plus forte progression de charge | Progression vérifiée sur une métrique de résistance comparable (2.10) |
| Journée avec la meilleure couverture du programme | Critère d'adhérence explicite (3.3 bis) |
| Journée la plus exigeante | Ne pas attribuer ce titre si l'exigence réelle n'est pas mesurable |
| Meilleure journée globale | Exige une définition multidimensionnelle explicite, sinon éviter ce libellé |

Une distinction de volume reste légitime ; ce qui ne l'est pas, c'est de la présenter comme preuve qu'une journée est globalement supérieure. **Note 72/100** : définir ce qu'elle mesure ; si elle combine activité, sommeil, fréquence cardiaque, etc., elle n'est pas réutilisée comme mesure directe de la qualité de l'entraînement. **Étoiles de difficulté** de la banque d'exercices : jamais converties silencieusement en effort physiologique (5.1). Il ne s'agit pas de reconstruire l'XP ou le calendrier, mais de garantir que libellés, définitions et conclusions d'Analyse ne se contredisent pas. **Accept.** : un record du calendrier et une analyse de séance ne produisent aucun libellé global trompeur sur la « meilleure » séance.

---

## 8. Mémoire éditoriale et rotation

### 8.1 Mémoriser des phénomènes, pas des titres
Identité persistante : exercice, phénomène, conclusion, dates, preuves, horizons où il a été publié, nombre d'affichages, dernière publication. Alimente le moteur de nouveauté existant (180 entrées) et rend l'efficacité inter-fenêtres vérifiable (comparaison avec le run précédent à brancher).

### 8.2 Cycle de vie
Nouvelle → en confirmation → consolidée → connue → transformée → historique. **Solidité** (monte avec chaque observation) et **nouveauté informative** (baisse si déjà expliqué) évoluent indépendamment.

| Type de nouveauté | Nouvelle carte ? |
|---|---|
| Nouvelle date sans changement | Non (mise à jour de l'historique) |
| Renforcement (ex. 10 séances au même niveau) | Possible si la consolidation change l'importance |
| Nouveau mécanisme (charge ↑) | Potentiellement oui |
| Changement de phase (36→42 reps réguliers) | Oui |
| Nouvel angle historique | Oui si conclusion distincte |
| Simple changement d'horizon (+25,6 % identique) | Non par défaut |

### 8.3 Cinq décisions de publication
Publier / Remplacer / Actualiser (nouvelles données modifient la conclusion) / Conserver (reste pertinente) / Retirer du premier plan (vraie mais plus nouvelle).

### 8.4 Règles de rotation
R1 mémoire du phénomène ; R2 renforcement ≠ nouveauté ; R3 une carte connue redevient prioritaire si un fait change thèse/mécanisme/portée ; R4 concurrence avec toutes les découvertes admissibles ; R5 valeur marginale ; R6 rotation conditionnelle ; R7 une nouvelle séance ne modifie pas les analyses historiques qui n'en dépendent pas ; R8 abstention ; pénalité de répétition inter-fenêtres sauf nouvelle lecture ; adapter selon la période consultée ; distinguer renouvellement du contenu et actualisation des chiffres ; permettre « voir autre chose » via un réservoir d'angles (structure, programme, jours de semaine, charges, répertoire, trajectoire longue) sans fabriquer de variation.

### 8.4 bis Politique de publication (algorithme de renouvellement)
- **Deux registres séparés** : `PhenomenonRegistry` (vérité analytique) et `PublicationLedger` (ce qui a été raconté). Une conclusion solide et pertinente peut avoir déjà été présentée plusieurs fois et ne pas devoir revenir.
- **Nouveauté = distance entre conclusions, pas temps écoulé.** Une analyse de deux semaines redevient intéressante si une observation change sa portée ; une de deux mois reste redondante si rien ne modifie son sens. Décision pilotée par `changeFromPrevious` (section 3.2 bis).
- **Deux modes** : *sélection principale* (découvertes les plus importantes de la période, **déterministe** : mêmes données + même édition (8.10) = même pack, pas de cartes différentes à chaque rechargement) ; *exploration « Voir d'autres analyses »* (autres conclusions admissibles et réellement distinctes, pas forcément aussi importantes, sans prétendre à une découverte nouvelle ; utile quand l'entraînement est stable).
- **Ne jamais forcer la rotation.** Si les données, l'historique éditorial et les contextes sont inchangés et que tout a été raconté, le moteur peut n'avoir rien de nouveau : garder une ou deux cartes de référence, une synthèse de maintien, ou proposer l'exploration. La rotation est une conséquence de la richesse des découvertes, pas un objectif. Le mode exploration donne accès à **l'intégralité** des analyses admissibles et distinctes (9.6), pas à un échantillon aléatoire ; les découvertes anciennes restent accessibles, seule leur priorité d'affichage baisse lorsqu'elles n'apportent plus d'information nouvelle.

### 8.5 Politique par horizon
| Horizon | Question dominante |
|---|---|
| Aujourd'hui | Qu'est-ce qui distingue ce qui vient d'être fait ? (composition, écart à l'habitude) |
| 7 jours | Comment la semaine s'est-elle organisée ? |
| 30 jours | Qu'est-ce qui change et devient reproductible ? |
| 3 mois | Qu'est-ce qui s'installe, disparaît, change de rôle ? |
| 6 mois | Quelles phases/changements durables ? |
| 1 an | Grands jalons et transformations du parcours disponible |
| 2 ans | Qu'apporte réellement l'historique supplémentaire ? |
| Toujours | Synthèse démontrable de toutes les données existantes (périodes documentées affichées) |

Huit politiques de sélection sur un socle de faits cohérent, pas huit calculs indépendants. Ex. pompes inclinées : 30 j « 36 reps retrouvés à chaque séance » ; 3 m « hausse initiale → six séances au même volume » ; 6 m « format conservé après 42 j d'absence ». Si 1 an/2 ans/Toujours contiennent les mêmes événements : ne pas fabriquer de fausse nouveauté ; « Toujours » peut offrir une nouvelle lecture (nouveauté de lecture ≠ nouveauté de données), ou présenter une sélection prioritaire plus courte en expliquant que l'élargissement n'ajoute rien (les analyses admissibles et distinctes restent consultables, 9.6).

### 8.6 Recalcul par dépendances
Un événement (série ajoutée/corrigée/supprimée) déclenche le recalcul de ce qu'il touche (séance, trajectoire de l'exercice, couverture musculaire, complétion de programme, fenêtres contenant la date, trajectoires) et la réévaluation des phénomènes concernés — pas du sommeil sans lien. Une suppression par erreur révise les conclusions qui s'appuyaient dessus. Une conclusion peut devenir plus solide, moins pertinente, dépassée ou infirmée. Chaque correction est conservée dans un journal immuable (ancienne et nouvelle valeur, 2.8) : l'ancienne conclusion reste traçable dans l'historique sans être présentée comme une vérité actuelle.

### 8.7 États temporels de « Aujourd'hui »
Journée commencée (décrire seulement) → séance en cours (progression sans verdict) → séance terminée (écarts au plan connu) → journée clôturée (jours planifiés non réalisés) → donnée corrigée (révision). Le moteur compare à trois historiques : même jour, même type de séance, même programme.

### 8.8 Exposition réelle : `ExposureLedger`

La mémoire distingue `PhenomenonRegistry` (ce que Momentum sait) et `PublicationLedger` (ce qu'il a raconté), mais pas **ce que l'utilisateur a effectivement eu l'occasion de voir**. Si Momentum produit 42 analyses pour Toujours, en place huit dans « À retenir » et que les 34 autres, accessibles dans « Toutes », ne sont jamais ouvertes, le système ne doit pas les pénaliser le lendemain comme des répétitions : l'utilisateur ne les a jamais vues.

| État | Signification |
|---|---|
| Produite | L'analyse existe dans le moteur |
| Accessible | Elle peut être consultée dans l'interface |
| Présentée | Elle est apparue dans une zone effectivement affichée |
| Consultée | L'utilisateur a ouvert ou développé son contenu, selon une règle explicite |

Être visible à l'écran ne prouve pas qu'une personne a lu la carte : ce sont des **signaux d'exposition, pas des mesures de compréhension**. Pas de suivi de lecture intrusif : on enregistre localement des événements simples (affichage d'une carte, ouverture du détail).
```ts
type ExposureEvent = { profileId: string; discoveryId: string; conclusionVersion: string; horizon: string;
                       presentedAt: string; interaction: "presented" | "opened" | "expanded" };
```
**Règle de protection** : une analyse ne devient pas éditorialement usée simplement parce qu'elle a été générée ou rendue accessible ; sa répétition dépend de ce qui a effectivement été présenté, du nombre de présentations et surtout de la proximité entre les conclusions. Exemple : une analyse des pompes inclinées présentée cinq fois et une analyse de redistribution du travail de poussée produite il y a dix jours mais jamais mise en avant, toutes deux valables : à pertinence comparable, le moteur peut favoriser la seconde, information encore peu exposée. Dans `U(e | S)` (9.2), `H(e)` s'appuie sur l'**exposition effective** (`ExposureLedger`), plus seulement sur la publication ; cette exposition n'est appliquée qu'à la **prochaine édition** du récapitulatif (8.10), jamais à chaque consultation. **Accept.** : 30 analyses produites, 6 mises en avant, 24 jamais consultées → les 24 autres ne sont pas considérées comme déjà lues.

### 8.9 Retour éditorial de l'utilisateur : `EditorialFeedbackLedger`

Certaines analyses sont exactes mais n'intéressent pas l'utilisateur, d'autres sont jugées trop prudentes, génériques ou répétitives ; ces informations ne sont exploitées que pendant le développement (18). Prévoir un **retour éditorial facultatif** dans l'application, sous forme de réactions précises plutôt qu'une note sur cinq étoiles : *Intéressante · Déjà vue · Pas assez approfondie · Conclusion peu utile · Données ou interprétation incorrectes*.

**Distinction capitale : personnaliser l'intérêt éditorial ne signifie pas personnaliser la vérité.** Les calculs, preuves et conclusions autorisées restent identiques ; seule la **hiérarchisation** des découvertes évolue. Une carte marquée « intéressante » mais contenant un calcul faux reste invalide ; en revanche, des comparaisons de records régulièrement jugées peu intéressantes reçoivent progressivement moins de poids dans les sélections, et les analyses qui relient plusieurs exercices, périodes et implications sportives peuvent être favorisées lorsqu'elles sont admissibles.
```ts
type EditorialFeedback = { profileId: string; discoveryId: string; conclusionType: string; conclusionVersion: string;
  reaction: "interesting"|"already_seen"|"too_shallow"|"low_utility"|"incorrect"; reason?: string; at: string };
```
Registre distinct du `PhenomenonRegistry`, du `PublicationLedger` et de l'`ExposureLedger` ; apprentissage éditorial simple, local, **sans entraînement de modèle**. Un retour « données ou interprétation incorrectes » ouvre un contrôle de fiabilité (18.7). L'utilisateur peut **réinitialiser** ces préférences. **Accept.** : un retour « déjà vue » influence la priorité éditoriale, jamais les faits.

### 8.10 Édition de récapitulatif figée : `AnalysisEdition`

Les registres d'exposition et de retour pourraient provoquer une **rotation permanente** : A, B, C s'affichent, leur pénalité de répétition augmente aussitôt, le rechargement fait apparaître D, E, F, puis d'autres, alors que l'entraînement n'a pas changé. Or les découvertes principales ne doivent pas changer artificiellement à chaque ouverture (8.4 bis).

Une **édition** (`AnalysisEdition`) est l'ensemble des décisions de présentation prises pour un état analytique donné : profil utilisateur, horizon consulté, version des données et des règles, découvertes admissibles, sélection prioritaire, ordre des cartes, mode de présentation, date de création. Tant qu'elle reste valable, les consultations **ne modifient pas sa sélection**. Les expositions enregistrées influencent seulement une **prochaine édition**, déclenchée par un changement de données, une correction, une nouvelle période pertinente ou une demande explicite de renouvellement. Une carte n'est comptée qu'**une fois par visite**, même si la page défile plusieurs fois.

**Accept.** : à données inchangées, dix rechargements de la page ne produisent pas dix sélections différentes ; les consultations sont mémorisées sans boucle de reclassement immédiate. Règle à poser avant la rotation avancée.

---

## 9. Sélection éditoriale

### 9.1 Étape A — admissibilité (obligatoire)
Données vérifiables, identité d'exercice suffisante, fenêtre correcte, conclusion autorisée par les faits, GTG strictement exclu des métriques de musculation classique (mention possible uniquement comme contexte séparément attribué lorsque l'option du principe 4 est activée, désactivée par défaut), aucune source absente, aucune charge ou intention de programme inventée → sinon rejet (jamais sauvée par la rédaction).

### 9.2 Étape B — classement des admissibles
Fonction d'utilité marginale (remplace la formule additive initiale) : **`U(e | S) = B(e) − λ·O(e, S) − μ·H(e)`**, où `B(e)` = valeur intrinsèque (importance, valeur explicative, pertinence temporelle, nouveauté informative, **robustesse**, spécificité, clarté), `O(e, S)` = chevauchement avec les cartes déjà sélectionnées dans le pack `S`, `H(e)` = répétition avec les conclusions déjà publiées (`PublicationLedger`), `λ, μ` à calibrer. Sélection gloutonne : on ajoute la candidate de meilleure valeur marginale, on s'arrête quand les restantes n'en apportent plus assez. Cette sélection construit le **pack prioritaire** (« À retenir ») ; elle ne décide ni de l'admission ni de l'accessibilité des autres analyses admissibles et distinctes (9.6).
Corrections de principe : (1) la fiabilité apparaît à **deux niveaux distincts** — *admissibilité* (niveau de preuve requis pour la conclusion ; une inadmissible n'est jamais sauvée par son importance) et *robustesse parmi les admissibles* (comparaison plus solide, représentative, peu sensible aux valeurs atypiques) ; (2) la redondance dépend du pack déjà choisi, pas seulement de la candidate ; (3) **la nouveauté ne doit pas dominer** importance et valeur explicative (une variation de 2 reps sur un exercice occasionnel est plus nouvelle, pas plus intéressante qu'une synthèse historique renforcée). Poids testés sur les jeux d'évaluation (section 18), pas fixés a priori. 

### 9.3 Valeur marginale et meilleur ensemble
Pour la sélection prioritaire, on cherche le meilleur **ensemble** de cartes complémentaires (pas les 10 meilleurs scores individuels) : « qu'apporte cette carte que les autres retenues n'apportent pas ? ». Exemple d'arbitrage : jalon « 100 séances », comparaison « octobre +16 % », et « volume remonte sans que la fréquence ait retrouvé son niveau » → la troisième l'emporte ; le jalon reste en format court ou dans un bloc d'événements. Une analyse non publiée peut devenir preuve ou contexte plus tard.

### 9.4 Traçabilité
Conserver sur chaque carte : composantes du score (nouveauté, importance, preuves, pertinence temporelle, profondeur, pénalité de répétition), rivales, `collapsedInto`, motif d'exclusion vérifiable. Matrice par famille : phénomènes détectés / admissibles / sélectionnables / publiés. Faire que les compteurs de familles portent sur les mêmes ensembles. Compter séparément **candidates**, **conclusions distinctes**, **analyses admissibles** et **analyses accessibles** (18.6), et enregistrer pour chaque analyse admissible non mise en avant la raison (doublon de conclusion, fusion, simple priorité de présentation) afin de mesurer la perte éditoriale.

### 9.5 Nombre de cartes : ni quota ni plafond d'admission
Le nombre d'analyses accessibles est une **conséquence** des conclusions admissibles et distinctes, jamais d'un quota : **aucun minimum, aucun plafond arbitraire** par période ou par catégorie (la formulation « de 0 à 8 cartes environ, plafond à calibrer » est abandonnée ; le plafond d'environ huit cartes est supprimé du contrat du moteur analytique). Seule la **mise en avant initiale** peut être courte, pour la lisibilité (9.6). Un faible nombre d'analyses sur une période riche n'est pas satisfaisant par défaut : il déclenche le diagnostic de sous-exploration (4.7).

**Le nombre de cartes n'est pas l'objectif d'optimisation** (ne pas viser « 10 → 20 ») : on vise plus de découvertes **distinctes, étayées et éditorialement utiles** ; sinon le moteur gonflerait ses indicateurs en découpant une même découverte en petites cartes ou en la reformulant. L'ambition est la densité d'information utile, pas la multiplication mécanique (4.6).

Illustrations de volume, **non des cibles** : 34 analyses pour Aujourd'hui, 21 pour 7 jours, 47 pour 30 jours et 63 pour Toujours seraient légitimes si l'historique permet réellement toutes ces lectures ; il n'y a rien d'intrinsèquement mauvais à beaucoup d'analyses, le problème commence quand elles répètent la même chose, deviennent insignifiantes ou ne sont pas démontrées.

Exemple de **première sélection** 30 j (pack prioritaire, non exhaustif) : Trajectoire (volume remonte sous autre organisation), Progression (pompes inclinées 6×36), Structure (pectoraux davantage exposés), Progression (pompes déclinées), Rythme (4 jours consécutifs après 4 jours d'arrêt), Sommeil (horaires déplacés). Les autres analyses admissibles et distinctes de la période restent accessibles (9.6).

Arbitrage des 10 cartes actuelles : remplacer « octobre concentre la part la plus productive » ; réécrire genoux « reviennent » ; déplacer GTG hors planning dans son espace ; conserver et approfondir 20 reps reproductibles, pompes déclinées ; 100e séance en jalon court ; approfondir pectoraux (Structure) ; conserver quatre jours consécutifs si inhabituel ; réévaluer le profil de sommeil habituel ; fusionner/distinguer les deux cartes genoux (IDs 505/106).

### 9.6 Production, admission et présentation progressive

**Contrat du moteur** : le moteur produit, admet et conserve **toutes** les analyses admissibles et distinctes ; la présentation les ordonne. La taille de la sélection initiale est la seule limite quantitative de présentation ; les préférences visuelles, filtres et regroupements n'affectent jamais l'admission des découvertes.

**Trois vues** (exemple « Analyse — Toujours : 50 analyses ») :

| Vue | Contenu |
|---|---|
| **À retenir** | Les découvertes prioritaires, choisies par valeur marginale (9.2–9.3) pour comprendre l'ensemble de la période. Courte, lisible, déterministe (8.4 bis). |
| **Toutes** | L'ensemble des analyses admissibles et distinctes, regroupées et ordonnées, avec leur niveau éditorial (10.9). |
| **Autres angles** | Exploration volontaire : angles peu représentés dans la sélection prioritaire, observations contextualisées, anciennes découvertes (8.4 bis), sans prétendre à une nouveauté. |

**Interface** : une surface épurée au premier regard et une profondeur d'exploration potentiellement très grande. Affichage progressif, regroupements pertinents, filtres par catégorie, exercice, muscle et niveau éditorial, liste longue optimisée (pagination ou virtualisation) pour ne pas ralentir l'application. Une analyse n'est jamais supprimée parce qu'elle ne tient pas sur le premier écran.

**Aujourd'hui et Toujours** : une journée riche (neuf exercices, plusieurs groupes, programme prévu, charges, données Garmin) peut légitimement donner trente analyses si trente conclusions distinctes sont défendables ; l'historique complet peut en donner cinquante ou plus. La seule limite vient des données, de la qualité et de l'apport informatif des conclusions.

**Doublons** : deux analyses sont fusionnées lorsque leurs conclusions centrales sont sémantiquement équivalentes, même si leurs catégories diffèrent ; plusieurs découvertes issues d'un même phénomène ou d'un même exercice coexistent lorsque leurs thèses et apports informatifs sont réellement distincts (9.6 bis). Une analyse non mise en avant peut devenir preuve ou contexte d'une autre.

### 9.6 bis Précisions de déduplication et expérience d'une page de 30 à 50 analyses

**Fusion par conclusion, non par phénomène.** Une reprise des tractions peut donner une analyse de Progression (résistance retrouvée) et une analyse de Répertoire (le mouvement réapparaît et redevient régulier), qui partagent un phénomène initial sans raconter la même chose. Règle : **deux analyses sont fusionnées lorsque leurs conclusions centrales sont sémantiquement équivalentes, même si leurs catégories diffèrent ; à l'inverse, plusieurs découvertes issues d'un même phénomène coexistent lorsque leurs thèses et apports informatifs sont réellement distincts.** Le critère de déduplication est la conclusion, pas seulement l'exercice, la catégorie ou l'identifiant du phénomène.

**Flux analytique riche plutôt que vues cloisonnées.** Avec trois vues séparées, si 43 analyses sont produites et que six apparaissent dans « À retenir » sans indication claire que 37 autres existent, l'application semble n'en avoir produit que six : la richesse du moteur n'est pas perceptible et le problème initial est recréé visuellement. Deux options :
- *Option A — trois vues séparées* (architecture de 9.6) : propre, mais impose de changer de vue pour découvrir le contenu.
- *Option B — flux riche avec découvertes mises en avant* (**privilégiée pour l'usage visé**) : la page commence par les conclusions prioritaires (« À découvrir en priorité »), puis présente directement les autres analyses admissibles (« Explorer les autres découvertes · 35 analyses restantes »), organisées par pertinence, avec regroupements facultatifs et filtres par catégorie, sans changer de vue pour découvrir qu'il en existe trente de plus. **Un compteur visible indique toujours le total** (ex. « Analyse · 30 jours — 37 analyses »). Les trois vues À retenir / Toutes / Autres angles peuvent subsister comme filtres ou modes de regroupement dans ce flux.

La mise en avant n'exclut jamais les autres analyses du parcours ; la richesse du moteur est **visible, pas seulement stockée**. **Accept.** : 40 analyses admissibles → aucune disparition à cause du premier écran ou d'une limite de présentation. Les rendus fournissent un accès aux preuves (22.18).

### 9.7 Formats de présentation (renvoi)
Chaque analyse admissible peut être présentée en format **textuel**, **typographique** ou **hybride** (texte + graphique), selon ce qui facilite le mieux la compréhension de sa conclusion (22). Le format est un choix de présentation : il ne change ni l'admission, ni les faits, ni la conclusion, et plusieurs rendus d'une même découverte ne comptent jamais comme plusieurs analyses.

---

## 10. Formulation

### 10.1 Contrat d'une carte
Sujet ; phénomène ; thèse en une phrase ; preuves ; explication (relation démontrée) ; contexte historique utile ; limites **seulement si elles modifient la portée** ; titre = la découverte ; texte sans répétition ; conclusion qui apporte une interprétation (pas une reformulation du chiffre). Cartes courtes acceptables (70 mots utiles > 180 mots redondants).

**Texte et visuel.** Toute carte conserve une conclusion rédigée, même lorsqu'elle contient un graphique ou une mise en forme typographique ; aucun graphique statistique ne constitue à lui seul une analyse. Lorsqu'un graphique montre déjà les valeurs, le texte peut condenser leur description, mais jamais la démonstration ni la conclusion (22.2, 22.14).

### 10.2 Quatre niveaux de discours
Fait (chiffre vérifié) ; interprétation (décomposition démontrée) ; lecture du parcours (comparaison historique étayée) ; hypothèse explicative (non publiée comme conclusion sans éléments).

### 10.3 Tests de qualité d'un texte
- **Phrase supprimable** : si retirer une phrase ne retire ni preuve, contexte, explication, nuance, conclusion → la supprimer.
- **Conclusion neuve** : ne doit pas répéter le calcul (« 28 % au-dessus de la médiane, donc séance plus volumineuse » échoue ; ajouter le mécanisme, ex. exercices supplémentaires).
- **Substitution** : si on peut changer exercice/dates/chiffres sans changer le raisonnement, la carte est trop générique.
- L'utilisateur apprend-il quelque chose vs le tableau de statistiques ? Chaque affirmation est-elle reconstituable depuis ses événements ?

### 10.4 Style
Intelligence sobre : affirmer quand c'est démontré, interpréter quand la relation l'est, nuancer seulement quand ça change la conclusion. Pas de spectaculaire (« transformation spectaculaire »).

### 10.5 Formulations à limiter (non interdites absolument)
« Une part importante » (selon quel critère ?) ; « le volume est stable » (dire ce qui se maintient malgré les changements) ; « ce n'est pas un compteur isolé » ; « les prochaines séances permettront de confirmer » ; « le pic dépasse la médiane » sans interprétation ; « le mouvement revient » sans caractériser ; « bloc chargé et creux » sur tous les horizons ; « le volume ne démontre pas la force » répété.

### 10.6 Conclusions plus profondes — exemples
20 reps aux relevés de genoux : « maximum observé devenu niveau reproduit sur plusieurs séances » (si l'historique le confirme) ; pompes déclinées 79 % : « les premières séries retrouvent 10 reps ; c'est le format complet qui n'est pas reconstitué » ; octobre +16 % : « tu reconstruis du volume en augmentant le travail par journée, sans revenir à la fréquence de juin ».

---

### 10.7 Grammaire de conclusion : six familles
Chaque candidate a une **famille de conclusion principale** qui détermine la logique du texte (sinon tous les textes suivent « tu as fait X, avant Y, soit Z % » malgré des phrases variées) :

| Famille | Question | Exemple |
|---|---|---|
| Mécanisme | Pourquoi la métrique a-t-elle changé ? | « la hausse vient de séries supplémentaires » |
| Transformation | Qu'est-ce qui a changé dans la pratique ? | « le volume se redistribue entre dips et pompes » |
| Consolidation | Qu'est-ce qui est devenu habituel ? | « 36 reps ne sont plus un résultat isolé » |
| Contraste | Qu'est-ce qui diffère selon le point de vue ? | « plus de volume par jour, moins de jours qu'en juin » |
| Implication | Pourquoi cela compte pour l'objectif ? | « cette fréquence peut soutenir un travail musculaire régulier » |
| Anticipation | Que se passerait-il si cela continue ? | « la couverture des jambes resterait inférieure au plan » |

**Test de contribution de la conclusion** : retirer la dernière phrase fait-il perdre une interprétation ? Si non, elle n'apporte rien (sans imposer que la conclusion soit en dernier : elle peut être dans le titre puis démontrée).

### 10.8 Deux validations
Avant rédaction : l'interprétation structurée est admissible. **Après rédaction** : le texte n'a ajouté ni affirmation nouvelle, ni changement de chiffre, ni conclusion plus forte que celle autorisée (causalité, certitude excessive, comparateur incorrect). Indispensable si un modèle de langage local est ajouté.

### 10.9 Niveaux de richesse éditoriale

Toutes les analyses ne sont pas des découvertes majeures : on peut vouloir consulter une observation intéressante sur un exercice même si elle ne révolutionne pas la compréhension des six derniers mois. Trois niveaux, qui différencient la **valeur explicative et la portée**, jamais le niveau d'exactitude :

| Niveau | Nature | Exemple |
|---|---|---|
| **1 — Découverte majeure** | Explique une transformation importante de la pratique | « Ton volume repart à la hausse sous une organisation différente de juin » |
| **2 — Analyse approfondie** | Conclusion précise et intéressante sur un mouvement particulier | « Tes pompes déclinées retrouvent leurs trois premières séries habituelles » |
| **3 — Observation contextualisée** | Repère pertinent pour l'historique d'un exercice, même si la consolidation a déjà été expliquée | « Tu reproduis pour la huitième fois le format de 36 répétitions » |

Règles :
- Le niveau 3 est important mais n'est pas toujours présenté comme une « nouvelle découverte » : il est conservé comme **repère contextualisé** (`changeFromPrevious` : `confirmed` ou `unchanged`), ce qui permet d'obtenir beaucoup plus d'informations sans aligner toutes les exigences sur celles des grandes analyses.
- Les **seuils de richesse éditoriale** peuvent varier ; les **exigences d'exactitude restent identiques** : une observation courte n'a pas le droit d'être fausse parce qu'elle est secondaire, elle doit toujours être exacte, identifiable et utile (tests de 10.3 applicables aux trois niveaux).
- Le niveau (`Discovery.editorialLevel`) pilote l'ordre et la présentation : le pack « À retenir » s'appuie surtout sur les niveaux 1 et 2, la vue « Toutes » contient les trois (9.6). Il ne pilote pas l'admission.
- Concision par analyse : cinquante cartes de 80 mots bien écrites, avec cinquante conclusions différentes, ne sont pas moins bonnes que six cartes de 150 mots ; si les cinquante apportent une vraie information, c'est une richesse supplémentaire.

### 10.10 Portée de la découverte : pourquoi mérite-t-elle l'attention maintenant ?

La grammaire de conclusion (10.7) est conservée. S'y ajoute une question distincte de l'exactitude et de la profondeur : *« Pourquoi cette découverte mérite-t-elle l'attention de l'utilisateur maintenant ? »* (pertinence personnelle et temporelle). Exemple : « tu as maintenu 36 reps sur huit séances » est un constat ; « ce format est devenu ton niveau régulièrement retrouvé » est une conclusion ; « la prochaine évolution intéressante ne sera pas nécessairement une neuvième fois 36 reps, mais de voir si le format ou la résistance peuvent progresser dans de bonnes conditions » est une implication possible pour le suivi de cet exercice.

| Portée | Question |
|---|---|
| Interprétative | Qu'est-ce que je comprends maintenant que je ne comprenais pas avant ? |
| Sportive | Qu'est-ce que cette évolution implique potentiellement pour la pratique ou l'objectif ? |
| Prospective | Quel changement futur mériterait d'être surveillé ou comparé ? |

Une carte peut n'en contenir qu'une ; une analyse historique importante peut combiner les trois. Ce n'est pas une formule obligatoire (pas de conseil à chaque carte) : c'est une garantie que le moteur sait expliquer ce que la découverte change dans la compréhension du parcours ou le suivi de l'objectif, au lieu de conclure par une phrase sans apport. Les implications restent soumises au registre de la section 11.

## 11. Implications sportives, conseils, projections

### 11.1 Registre des conclusions sportives autorisées
| Observation | Conclusion possible |
|---|---|
| Exposition d'un muscle plus fréquente | Plus d'occasions de travail musculaire |
| Volume de séries ↑ sur plusieurs semaines | Plus de travail susceptible de soutenir l'hypertrophie, selon qualité des séries et récupération |
| Charge ↑ à format comparable | Progression du travail contre résistance |
| Plusieurs séances au même niveau | Consolidation d'un format |
| Séances prévues régulièrement respectées | Bonne continuité de programmation |
| Famille souvent omise | Sous-couverture par rapport au programme |
| Reprise après interruption | Retour de pratique (≠ niveau retrouvé) |
| Exposition rapprochée d'un même muscle | Récupération à prendre en compte |
| Volume et fréquence ↑ | Plus de travail enregistré, sans adaptation démontrée |

Chaque entrée : conditions minimales, limites, niveau d'assurance. Les connaissances sportives interprètent les faits, ne les remplacent pas.

### 11.2 Arbitrage des implications
Une étape commune évite des cartes qui félicitent la fréquence, avertissent du rapprochement et recommandent d'augmenter. Produire un bilan cohérent : bénéfice + point de vigilance, ni félicitation ni alerte automatique.

### 11.3 Contexte de sollicitation (`recovery_context`)
Sollicitation espacée / rapprochée / accumulation supérieure à l'habitude / reprise après interruption / indéterminé. Jamais un diagnostic de fatigue ou de surentraînement. Quatre jours consécutifs sur des groupes distincts ≠ quatre jours sur les mêmes muscles. Reprise après 30 j : comparer au dernier format avant la coupure ; une baisse de volume n'est pas forcément négative ; la carte parle des données enregistrées.

### 11.4 Conseils
Cinq familles : continuité, progression, couverture musculaire, récupération, nutrition (rappel général lié à l'objectif connu, sans prétendre connaître les apports). Éligibilité : observation concrète qui le rend pertinent ; objectif connu ou précaution générale ; ne requiert aucune donnée absente ; pas répété récemment ; apporte à la conclusion. Rare, contextualisé, jamais systématique en fin de carte. Ne jamais affirmer « tu es fatigué » ni « tu ne manges pas assez ». Les cartes ne sont pas obligées de conseiller : comprendre est déjà une valeur.

### 11.5 Projections et scénarios
Trois types : A continuité de la pratique (extrapolation de rythme, facile à justifier) ; B scénario de programmation (ex. 1 vs 2 séances jambes par semaine) ; C évolution de performance (très incertain, pas d'extrapolation linéaire des records). Moteur de scénarios indépendant de la rédaction : continuité, réorganisation, réintroduction d'une famille omise, progression graduelle, retour à l'ancienne fréquence ; chaque projection énonce ce qui est supposé constant et reste conditionnelle. Priorité aux projections de pratique/couverture ; pas de prévision de gain en cm ou en kg. Ex. « si 4 occasions sur 8 restent sans jambes, l'écart de fréquence continue de se creuser ».

---

### 11.6 Registre de connaissances sportives versionné
Le registre de 11.1 devient un **moteur de règles traçables**, pas des phrases dispersées dans la rédaction :
```ts
type SportingKnowledgeRule = {
  id: string; version: string;
  domain: "hypertrophy"|"strength"|"recovery"|"training_adherence"|"exercise_progression";
  objective?: "hypertrophy"|"strength"|"endurance"|"general_fitness";
  prerequisites: string[]; requiredClaims: string[]; requiredContext: string[];
  supportingMetrics: string[]; permittedImplications: string[]; prohibitedImplications: string[];
  limitations: string[]; allowedAdviceTypes: string[]; projectionEligibility: boolean;
  evidenceReferences: string[]; reviewedAt: string;
};
```
Conditions types pour « plus de séries ⇒ implication hypertrophie » : volume correctement mesuré (séries ≠ reps) ; famille musculaire identifiée ; périodes comparables ; exercice comparable ou changements explicités ; objectif connu ; absence de conclusion excessive. Exemple de conclusion correcte : « Tu consacres davantage de séries à cette famille. Si elles apportent une stimulation suffisante et que la récupération suit, cette hausse peut contribuer à ton objectif de développement musculaire. » Base déterministe, évolutive vers un futur Intelligence Engine.

### 11.7 Trois étapes et contrôle de pertinence
Séparer **observation personnelle** → **implication sportive** (occasions de travail démontrables vs « susceptible de soutenir l'objectif », jamais « tu as pris du muscle ») → **conseil éventuel** (non obligatoire). **Contrôle de pertinence du conseil** : une règle n'est pas activée parce que son déclencheur élémentaire est présent ; elle doit apporter une information supplémentaire utile dans le contexte (4 jours consécutifs sur groupes différents ⇒ pas de conseil ; 3 jours sur 4 avec travail direct des mêmes muscles ⇒ conseil spécifique). Sinon le risque de répétition se déplace des analyses aux recommandations (« pense à bien récupérer » partout).

### 11.8 Projections formalisées
Calculées avant d'être rédigées. *Continuité* (arithmétique conditionnelle : 6 semaines × 2 séances = 12 occasions) ; *scénario* (préciser si le volume hebdomadaire de séries reste identique — sinon fréquence et volume changent en même temps) ; *performance* (très difficile : historique long, variabilité connue, erreur de prévision évaluée ; jamais de prolongement linéaire d'une hausse récente). Si les données ne permettent pas de prévision fiable : proposer un **scénario**, pas une prévision.
```ts
type ProjectionScenario = {
  id: string; basePeriod: string; horizonDays: number;
  assumptions: Array<{ metric: string; operation: "hold"|"increase"|"decrease"|"replace"; value: number }>;
  outputMetric: string; expectedValue?: number; lowerBound?: number; upperBound?: number;
  uncertaintyStatus: "deterministic_scenario"|"estimated"|"insufficient_data"; evidenceIds: string[];
};
```
Une projection déterministe n'exige pas de fourchette statistique mais annonce ses hypothèses.

### 11.9 Provenance, conditions d'utilisation et durée de validité des règles sportives

Une règle sportive est plus qu'une phrase : Momentum ne fonctionne pas avec un modèle scientifique complet de l'organisme, mais doit savoir **pourquoi** une conclusion sportive est autorisée, sur quels éléments elle repose et ce qu'elle ne permet pas d'affirmer. Une règle « augmenter progressivement le volume de séries peut contribuer à l'hypertrophie » est globalement défendable mais ne s'applique pas automatiquement à toute hausse de volume. Chaque règle porte donc sa **provenance** (`evidenceReferences`), ses **conditions d'utilisation** (`prerequisites`, `requiredClaims`, `requiredContext`), ses **limites** et sa **durée de validité** : la date de dernière revue `reviewedAt` est complétée par une échéance de revue (`validUntil?`) ; une règle non revue après son échéance n'est plus utilisée pour une conclusion engagée et est signalée.

**Exemple : hausse du volume hebdomadaire de pectoraux.** Avant d'envisager une implication liée à l'hypertrophie, vérifier que la hausse vient réellement de **séries supplémentaires** (et non du simple passage à un exercice comportant davantage de répétitions) et qu'elle concerne **plusieurs semaines** (et non une semaine isolée). Trois niveaux à distinguer : « cette organisation augmente les occasions de travail des pectoraux » (directement démontrable) ; « cette organisation est susceptible de soutenir ton objectif de développement musculaire » (implication fondée sur des connaissances sportives) ; « tes pectoraux ont pris du muscle » (exigerait des mesures supplémentaires : interdit). Le moteur sait produire les deux premières sans glisser vers la troisième.

**Éviter les conseils universels fondés sur un seul indicateur.** Quatre journées consécutives ne déclenchent pas « pense à te reposer ». Il faut d'abord regarder si les mêmes groupes ont été sollicités, comment les séries se répartissent et si les performances récentes changent notablement ; même ainsi, Momentum ne connaît pas la fatigue ressentie. Formulation possible : « Trois de tes quatre dernières journées comportent du travail direct des mêmes muscles. Avant d'augmenter encore leur volume, il serait pertinent de tenir compte de leur récupération. » Si les quatre séances concernent des groupes différents, le moteur n'a pas de conseil à produire. Une règle n'est pas activée parce que son déclencheur élémentaire est présent : elle doit apporter une information supplémentaire utile dans le contexte (contrôle de pertinence, 11.7).


## 12. Traçabilité et tests

### 12.1 Chaîne de publication vérifiable
Snapshot + couverture des sources → faits et preuves → candidats et décisions éditoriales → cartes publiées → rendu DOM. Capturer le DOM de l'onglet Analyse avec signature, relier chaque carte à ses versions de données et à ses décisions. Clarifier 10 (pack diagnostic) vs 14 (cartes affichées).

### 12.2 Batterie de tests (réels + scénarios fictifs contrôlés)
- Bornes : 30 j décalé d'un jour → mêmes dates partout.
- Deux compteurs de reps → écart expliqué par liste d'événements.
- Deux IDs homonymes → pas de fusion sans preuve.
- 540 charges simples/0 par série → aucune progression série par série.
- Programme modifié rétroactivement → anciennes journées évaluées avec leur version.
- RPE absent → aucune conclusion d'effort ; GTG présent → aucun double comptage.
- Mêmes données sur deux périodes → pas de fausse nouveauté.
- Hausse due à la fréquence seule → pas de « performance par séance ».
- Nuits Garmin partielles → seulement les nuits admissibles.
- Hausse de volume à fréquence stable → volume par jour actif ; ajout d'une série → pas de progression des reps/série.
- Six séances au même niveau → consolidation ; septième séance identique → renforcement sans republication ; changement de format → révision.
- Reprise après 28 j → comparaison série par série à l'ancien format.
- 100 reps lestées/polyarticulaires vs 200 reps d'isolation → pas de conclusion automatique d'effort.
- Même exercice, mêmes reps, charge ↑ → résistance détectée.
- 56 % de reps et 2 groupes/3 → réalisation partielle + couverture inégale ; jambes absentes 1 fois = ponctuel, 4/5 = récurrent ; programme historique absent → exercices non inventés.
- Baisse de reps et hausse de charge → pas de régression globale automatique.
- Trois catégories sur le même phénomène → fusion/choix ; projection vs observation → projection conditionnelle.
- Candidate écartée → score, rivalité, motif accessibles ; aucune analyse informative et données réellement pauvres → aucune carte fabriquée ; données riches → diagnostic de sous-exploration (4.7).
- Carte publiée → chaque chiffre reconstituable ; bon texte + mauvais calcul → rejet.
- Temporels : journée partielle vs journées clôturées ; séance traversant minuit ; période contenant un changement d'heure ; correction/suppression tardive d'une séance → révision des conclusions dépendantes.
- Identité : exercice fiable à nom mal résolu → agrégation autorisée, trajectoire bloquée.
- Programme : report lundi→mardi enregistré → jamais lu comme séance manquée.
- GTG : contexte séparément attribué uniquement si l'option est activée.
- Stabilité : mêmes données + même état éditorial → même pack ; septième séance identique → `changeFromPrevious: confirmed`, pas de republication.
- Régression du moteur parallèle (shadow mode, section 18.5) contre le moteur actuel sur les mêmes fenêtres.
- Test global : pour chaque carte d'un pack, chercher une affirmation incompatible parmi les autres (en comparant sujets, métriques, périodes, niveaux d'affirmation, pas des mots).
- Non-régression sur les 116 affichages (vérifier exactitude et disparition des erreurs, sans figer les anciens textes).
- Tout nouveau producteur est testé sur le registre existant avant activation dans la sélection : combien de candidates nouvelles, combien de vraies nouveautés, combien de doublons/contradictions.

### 12.3 Tests d'abondance et d'exhaustivité
- Journée riche (par ex. neuf exercices, plusieurs groupes, programme, charges, Garmin) → toutes les conclusions distinctes et admissibles sont accessibles ; aucune troncature à 8 ou 10 cartes ; la 31e bonne découverte n'est pas supprimée.
- 48 candidates correspondant à 8 conclusions distinctes → 8 analyses accessibles, **aucune perte éditoriale** ; 48 conclusions admissibles et distinctes → 48 accessibles.
- Sélection initiale courte + vue « Toutes » : le nombre d'analyses de « Toutes » = nombre d'analyses admissibles et distinctes.
- Données riches mais 2 analyses → alerte et diagnostic de sous-exploration (4.7) ; données pauvres → pas d'alerte et aucune carte fabriquée.
- Saturation d'un domaine (Progression) → la passe 4 vérifie que Structure, Sommeil, etc. ont réellement été examinés, sans publication forcée.
- Neuf exercices ne produisent pas 9 × 4 cartes mécaniques ; le découpage d'une même découverte en plusieurs cartes est détecté comme doublon de conclusion.
- Observation de niveau 3 : mêmes exigences d'exactitude ; une observation secondaire fausse est rejetée.
- Méthode applicable non exécutée → motif explicite de non-exécution enregistré.
- Liste de 50 à plus de 100 analyses : affichage progressif fluide, filtres par catégorie, exercice, muscle et niveau.
- Découvertes anciennes toujours accessibles, priorité d'affichage abaissée, pas de republication.

### 12.4 Jeux d'évaluation indépendants
Aux tests ci-dessus s'ajoutent trois jeux **indépendants des scores internes du moteur** : A (exactitude et cohérence), B (qualité des découvertes), C (qualité du récapitulatif complet et du renouvellement dans le temps). Voir section 18.


### 12.5 Tests de visualisation et de présentation
Jeu de visualisations de référence, cas de validation, captures et critères d'évaluation : voir 22.15. Ils s'ajoutent aux jeux A, B et C (18) et à la batterie de 12.2.


### 12.6 Critères d'acceptation complémentaires issus de l'audit

| Scénario | Résultat attendu |
|---|---|
| 30 analyses produites, 6 mises en avant, 24 jamais consultées | Les 24 autres ne sont pas considérées comme déjà lues (8.8) |
| Septième séance identique | Le phénomène se renforce, mais la carte n'est pas automatiquement republiée |
| Retour explicite « déjà vue » | Influence la priorité éditoriale, jamais les faits (8.9) |
| Simulation au 20 octobre | Aucune utilisation d'un événement connu seulement après cette date (2.8) |
| Record du calendrier et analyse de séance | Aucun libellé global trompeur sur la meilleure séance (7.7) |
| 200 reps dont 50 hors programme | Les 50 supplémentaires ne gonflent pas artificiellement la complétion (3.3 bis) |
| Même phénomène, conclusions indépendantes | Les deux analyses peuvent rester accessibles (9.6 bis) |
| Plusieurs semaines comparées | Échantillons, périodes et unités d'observation correctement définis (2.12) |
| Graphique de séries | Accès aux séances et séries sources, lorsque disponibles (22.18) |
| 40 analyses admissibles | Aucune disparition à cause du premier écran ou d'une limite de présentation |
| Nouvelle règle sportive | Conclusions anciennes réévaluées uniquement lorsqu'elles en dépendent |
| Calcul local coûteux | Application utilisable, résultats mis à jour progressivement et sans mélange de versions (13.5) |
| Dix rechargements, données inchangées | Une seule sélection, pas dix rotations (8.10) |
| Correction d'une séance après simulation | La simulation passée retrouve l'ancienne valeur effectivement connue (2.8) |
| 4 × 5 prévus, 2 × 10 réalisés | Format non déclaré identique ; ajouts hors complétion (3.3 bis) |
| Meilleure relation parmi vingt essais | Publiée comme exploratoire, jamais comme association durable (2.12) |
| Septième séance ajoutée pendant le calcul | Texte, métriques et graphique correspondent au même instantané (22.20) |

---

## 13. Plan d'implémentation hiérarchisé

**Principe** : une fondation **P0 bloquante**, puis des **livraisons verticales**. Chaque livraison va de la source de données jusqu'à la carte affichée, avec ses tests et son évaluation éditoriale, plutôt qu'un long développement de composants isolés sans amélioration visible validée. La capture fiable des plans historiques (versions de programmes, affectations de séances) démarre dès P0, même si leur analyse approfondie intervient en P5 ; l'invalidation lors des corrections de données est conçue dès la fondation, son optimisation par dépendances (P8) vient ensuite.

| Phase | Contenu | Livrable / critère d'acceptation |
|---|---|---|
| **P0 — Fiabiliser définitions et preuves** (bloquante) | Bornes uniques (journée partielle, date sportive, séance traversant minuit, changement d'heure) ; contrats de métriques ; réconciliation des compteurs ; couverture par source ; identité des exercices ; GTG ; provenance du programme (versions immuables + affectations + snapshots du plan applicable si utile) ; justesse des libellés ; confiance décomposée ; instrumentation des corrélations ; chaîne de publication/DOM ; **séparation admission/présentation** (aucun plafond d'admission dans le contrat) et instrumentation candidates → conclusions distinctes → admissibles → accessibles ; classification des défaillances (18.7) ; conception de l'invalidation lors des corrections | un calcul affiché est reconstituable à partir de ses événements ; les six conditions de 2.x passent ; écarts calendrier/analyse décomposés ; « Toujours » ne compte plus d'années sans données ; la perte éditoriale est mesurable |
| **P1 — Jeux de référence avant la refonte éditoriale** | Jeux A, B, C et simulations de publication dans le temps (18) ; motifs de sortie des 76 candidates hors pack | pouvoir mesurer une amélioration indépendamment des scores internes |
| **P2 — Vertical 1 : consolidation, mémoire et rotation** | Partir des pompes inclinées ; `PhenomenonRegistry` et `PublicationLedger` ; états de vie ; `Discovery.changeFromPrevious` ; détecteur `exercise_format_consolidation` ; séparation confirmation/nouveauté | une 7e séance identique actualise les faits sans refaire la carte sur huit horizons ; une carte « +25,6 % » devient « six séances à 36 reps » |
| **P3 — Vertical 2 : raisonnement explicatif** | Approfondissement par phénomène (D3–D4) ; décomposition fréquence/séries/exercices ; `sessionWorkProfile` ; `muscleExposureLedger` | une comparaison juin–septembre–octobre produit une lecture de l'organisation du travail, pas trois totaux |
| **P4 — Vertical 3 : comparaison de séances et Exigence** | Profil multidimensionnel, charges documentées, séries, nature des mouvements, références personnelles, quatre issues de comparaison | 100 contre 200 répétitions n'entraîne plus automatiquement un verdict de séance supérieure |
| **P5 — Vertical 4 : programme et couverture musculaire** | `plannedVsPerformedAssessment`, statuts, jours de semaine, séance en cours/terminée/clôturée, détection des corrections, versions historiques fiables | uniquement sur dates à plan historique fiable ; le scénario des 56 % produit une conclusion cohérente sur le travail effectué et les jambes absentes |
| **P6 — Généralisation, cohérence, formulation et sélection collective** | `AnalyticalClaim` structuré, `NarrativeCoherenceEngine`, précédence, liens typés ; contrat de carte, thèse avant rédaction, grammaire de conclusion, deux validations ; admissibilité puis valeur marginale, pack prioritaire et vues À retenir / Toutes / Autres angles, traçabilité (scores, rivales, `collapsedInto`), rotation inter-horizons, politique par horizon ; **exploration multi-passes, contrôle de couverture et diagnostic de sous-exploration** ; niveaux de richesse ; nouvelles catégories Structure & répartition puis Trajectoire & transitions ; extension des détecteurs validés (19) | aucune contradiction dans un pack (test d'affirmation incompatible vert) ; chaque conclusion apporte une idée absente du compteur ; chaque carte principale apporte une conclusion distincte avec justification de sélection traçable (pourquoi elle a battu ses rivales) ; nombre d'analyses accessibles variable, déterminé par les conclusions admissibles et sans plafond d'admission ; interface fluide sur un grand volume ; catégories testées sur le registre avant d'être visibles de façon permanente |
| **P7 — Implications sportives et projections** | `SportingKnowledgeRule` versionnées (20), `recovery_context`, politique de conseils, projections de pratique, scénarios de continuité et de réorganisation | conseils rares et contextualisés ; aucune projection présentée comme constat ; conclusions engagées sans prévisions corporelles inventées |
| **P8 — Recalcul dynamique et score optionnel** | Recalcul par dépendances, révision des conclusions ; score d'objectif documenté (si pertinent) | corrections tardives révisent les conclusions |

### 13.2 Déployer sans casser l'existant
Le moteur actuel n'est pas remplacé d'un coup : il continue de produire les cartes visibles pendant qu'un **moteur expérimental** tourne en parallèle sur les mêmes données (**shadow mode**, 18.5). Les détecteurs nouveaux sont activés progressivement, une fois leurs résultats convaincants. C'est préférable à un remplacement complet fondé uniquement sur des tests synthétiques.

### 13.3 Chantier visuel (parallèle)
Le chantier de visualisation (22.16, phases V0 à V5) peut démarrer dès maintenant pour ses composants (audit de l'existant, design system, premiers graphiques) sans attendre les nouvelles catégories. En revanche, la **génération automatique à grande échelle** dépend de conclusions suffisamment structurées (P6) et de données fiables (P0) : on ne l'active pas sur des conclusions encore fragiles, et on ne l'utilise jamais comme couche décorative.

### 13.4 Cohérence construite dès les premiers parcours verticaux

Dès P2 et P3, de nouvelles conclusions sont produites et peuvent déjà entrer en concurrence avec les cartes existantes ; la cohérence ne peut donc pas entièrement attendre P6. Sans développer l'intégralité du moteur de cohérence dès P0, **chaque parcours vertical impose** : un **contrat commun de métriques** ; des **assertions vérifiables** ; une **identification des doublons de conclusion** ; un **contrôle élémentaire des contradictions** ; une **validation de la rédaction**. P6 généralise ensuite ces mécanismes à toutes les catégories. Sont également à inscrire dans le plan : `ExposureLedger` et `EditorialFeedbackLedger` avec P2 (mémoire et rotation) ; `knownAt`/`knowledgeCutoff` (2.8) dès P0–P1 pour que les jeux de référence rejouent honnêtement l'historique ; contrat sémantique partagé (7.7) dès P0 pour les libellés, puis P6 pour l'harmonisation complète ; politique de comparaison et matching prévu/réalisé précis (2.12, 3.3 bis) avec P4–P5 ; flux riche et interaction graphique (9.6 bis, 22.18) avec P6/V5 ; `AnalyticalHypothesisPlanner` (4.8) : place architecturale prévue dès P0, déploiement ultérieur (après P6).

### 13.5 Exécution progressive et calcul incrémental

Éviter de relancer intégralement toutes les étapes à chaque nouvelle répétition :
- **Après un événement sportif** : recalculer les faits concernés et les phénomènes directement dépendants (8.6).
- **Après une modification significative** : réévaluer les comparaisons transversales susceptibles de changer.
- **Lors d'une analyse approfondie** : explorer les méthodes supplémentaires et les liens historiques les plus coûteux.

Le moteur conserve des **résultats intermédiaires versionnés** et les réutilise tant que leurs données n'ont pas changé ; les versions ne sont jamais mélangées à l'affichage. Une **limite de ressources de calcul** répartit le travail pour ne pas bloquer l'interface ; elle n'est **jamais** un plafond d'analyses admissibles (0.1 bis).

### 13.6 Contrat canonique, contrat technique compact et confrontation au code

Ce document est conservé intégralement comme **document de conception de référence**. Il contient des répétitions volontaires (abondance, fiabilité, rotation, visualisation sous plusieurs angles) ; pour l'implémentation (Cursor), il faut **un contrat canonique par concept, puis des renvois**, plutôt que plusieurs formulations susceptibles de diverger (ex. la définition de la nouveauté existe à un seul endroit — 8.2/8.4 bis, 3.2 bis `changeFromPrevious` — et détecteurs, sélection et présentation y renvoient). À produire en plus : un **contrat technique compact** et un **plan d'implémentation séquencé** indiquant, pour chaque modification : modules existants concernés, nouveaux objets réellement nécessaires, données d'entrée, comportements attendus, tests, conditions de non-régression. Les schémas de ce document restent **indicatifs** ; seuils et méthodes statistiques sont à définir (2.12), le coût de calcul est à quantifier, et **le code réel doit être audité** pour identifier les composants à modifier **avant d'ajouter de nouvelles idées conceptuelles** : une idée nouvelle n'est utile que si l'on sait où elle entre dans le système, quelles données elle exploite et comment on démontrera qu'elle rend les analyses réellement meilleures.


### 13.7 Ordre d'exécution recommandé

Les objectifs de P0 à P8 ne changent pas, mais P0 et P6 sont des chantiers trop chargés pour une seule unité : on découpe leur exécution.

| Étape | Ce qu'on réalise | Pourquoi commencer ici |
|---|---|---|
| A. Audit du code réel | Producteurs, registres, métriques, rendus et composants existants ; chaque exigence classée *déjà couverte / partiellement couverte / incorrecte / absente / non vérifiable* | Éviter de reconstruire l'existant ; décider sur l'écart concret |
| B. Contrats canoniques | Dates, GTG, métriques, preuves, identités | Aucune fonctionnalité ne repose sur des bases ambiguës |
| C. Historisation | Versions de programmes et d'objectifs, journal des corrections, connaissance temporelle (2.8) | Informations irrécupérables plus tard |
| D. Première amélioration verticale | Consolidation des pompes inclinées, mémoire, publication stable (8.10) | Résoudre un problème concret de bout en bout |
| E. Raisonnement explicatif | Volume, fréquence, séries, comparaisons historiques | Conclusions plus instructives |
| F. Programme et séances | Appariement des prescriptions, couverture musculaire, comparaisons multidimensionnelles | Corriger les lectures trompeuses de la réalisation |
| G. Généralisation éditoriale | Détecteurs, cohérence, abondance, retours, flux riche | Étendre ce qui est validé |
| H. Visualisation intégrée | Trois formats, design system, graphiques pertinents | Enrichir des analyses aux preuves fiables |
| I. Extensions avancées | Hypothèses libres, projections, optimisation locale | Profondeur sans fragiliser la base |

Les composants graphiques peuvent être prototypés dès l'étape A ; seule leur intégration automatique aux cartes attend les contrats analytiques. L'invalidation lors des corrections doit être **fonctionnellement juste dès les premières livraisons** ; seule son optimisation vient plus tard (P8).
---

## 14. Corrections de mes propres conclusions précédentes
- Une divergence de totaux peut venir d'une simple fenêtre (cas des 275) : auditer dénominateurs et filtres avant de parler d'erreur.
- Mes notes de 52 familles de cartes étaient des appréciations éditoriales, pas un classement objectif.
- « Octobre interrompt la baisse depuis juin » reste un excellent raisonnement, mais ses chiffres doivent d'abord être réconciliés avec le calendrier.
- Plusieurs idées proposées existent déjà dans le moteur : auditer production, validation et sélection avant de recréer.
- Le 10 vs 14 cartes n'est pas un bug avéré.
- « Moins de cartes plutôt qu'un remplissage artificiel / pas de quota » était trop restrictif par rapport à l'ambition du produit : remplacé par l'abondance analytique (0.1). L'absence de quota ne signifie pas l'absence d'ambition quantitative.
- Le « plafond d'environ huit cartes » confondait un problème de présentation et une limite du moteur : supprimé du contrat du moteur (9.5–9.6).
- « Snapshot quotidien du plan dès maintenant » n'est pas toujours nécessaire ni suffisant : une version immuable datée avec affectations historiques peut reconstituer le plan applicable ; un snapshot quotidien seul ne couvre pas les modifications en cours de journée (2.5).
- « Ne rien publier » pour les 12 anomalies de nom était trop strict : on bloque uniquement les conclusions dont la preuve dépend de l'information manquante (2.4).
- « Momentum ne doit plus détecter ce qui change » est devenu « ne doit plus se contenter de détecter » ; l'hypothèse « probablement lié à plusieurs catégories exclues » pour les écarts de 24 et 66 reps est remplacée par une attribution au GTG selon la définition métier, à réconcilier dans les événements sources.
- Une hausse du score interne moyen ne prouve rien si le calcul du score a changé : l'amélioration se démontre par une évaluation indépendante, à l'aveugle (18).
- « Le moteur peut traiter une analyse comme déjà racontée dès qu'elle est publiée » : insuffisant ; la publication, l'exposition effective et la consultation sont distinguées (8.8).
- « Fusionner par phénomène » (9.6) était trop strict : le critère de déduplication est la conclusion (9.6 bis).
- « GTG exclu » (9.1) devait préciser son contexte (9.1) ; `sessionStatus` mêlait séance et journée (3.3 bis) ; la cohérence ne peut pas attendre entièrement P6 (13.4) ; les simulations chronologiques devaient exclure les informations futures (2.8) et conserver l'ancienne valeur des séances corrigées (2.8) ; un modèle local limité à la fluidification était trop strict pour l'ambition à long terme, tout en restant sans droit d'affirmer (4.8).

## 15. Ce qui est désormais explicitement couvert (zones d'ombre du dernier texte)
Hiérarchisation algorithmique de deux séances (5.3) ; obsolescence sans fausseté et rotation inter-fenêtres (8.2–8.5) ; augmentation des candidates admissibles via méthodes de découverte (4.4) ; conclusions et projections sportives (11) ; arbitrage des conseils (11.2) ; « Aujourd'hui » temps réel (8.7) ; positif et négatif coexistants (7.1) ; contradictions entre périodes (7.6) ; décision sur les catégories visibles vs capacités internes (6, 16) ; contrat d'implémentation et test de nouvelles capacités sur le registre (12.2, 13). **Ajoutés par les retouches** : abondance, exploration multi-passes et diagnostic de sous-exploration (0.1, 4.6, 4.7) ; présentation progressive et suppression du plafond d'admission (9.5, 9.6) ; niveaux de richesse éditoriale (10.9) ; provenance et validité des règles sportives (11.9) ; tests d'abondance (12.3) ; évaluation indépendante, déploiement parallèle, indicateurs et classification des défaillances (18) ; catalogue des détecteurs (19) ; gouvernance des connaissances et des conclusions (20) ; critère supérieur de réussite (0.2, 21).

**Ajoutés par l'audit de la version finale** : exposition réelle et retour éditorial (8.8, 8.9) ; rejeu à date sans fuite d'information future (2.8, 18.9) ; contrat sémantique partagé avec calendrier, distinctions et notes (7.7) ; recherche d'hypothèses (4.8) ; politique de comparaison statistique, comparabilité des charges et variantes, objectifs historiques, alignement Garmin et carte de couverture temporelle (2.9–2.12) ; matching précis prévu/réalisé (3.3 bis) ; arbitrage de séances par objectif (5.6) ; flux analytique riche, déduplication par conclusion (9.6 bis) ; portée des conclusions (10.10) ; interaction graphique et états visuels (22.18, 22.19) ; calcul incrémental et séparation par profil (0.1 bis, 13.5, 3.5) ; cohérence dès les premiers parcours (13.4).

---

## 16. Décisions tranchées (contradictions résolues)

1. **Combien de nouvelles catégories ?** Les textes parlent de 3 puis 4 puis doutent. **Tranché** : 3 visibles (Structure & répartition, Trajectoire & transitions, Programme & pratique réelle) + Exigence en capacité transversale ; total 8 catégories visibles.
2. **Priorité : catégories d'abord ou profondeur d'abord ?** **Tranché** : socle P0 bloquant → jeux de référence (P1) → livraisons verticales (consolidation/rotation, raisonnement explicatif, comparaison de séances, programme) → généralisation, cohérence, formulation, sélection collective et nouvelles catégories (P6) → sport et projections (P7) → recalcul dynamique (P8). Le Programme reste tardif car il dépend de l'historique des plans, mais sa capture démarre dès P0 (13).
3. **Score de difficulté universel ?** **Non** (profil multidimensionnel et classement par objectif) ; score d'objectif documenté possible bien plus tard.
4. **Faut-il assouplir les filtres pour plus de candidates ?** **Non** : on enrichit les méthodes de découverte ; on assouplit seulement après audit des motifs de sortie.
5. **Quota ou plafond de cartes ?** **Aucun quota, aucun plafond d'admission, minimum zéro** : le nombre d'analyses accessibles dépend des conclusions admissibles et distinctes (0.1, 9.5). Seule la sélection initiale « À retenir » peut être courte (9.6).
6. **Conseils et nutrition ?** Autorisés mais rares, conditionnés ; au plus un conseil par carte et un nombre limité par récap, avec temps de repos avant répétition (valeurs à calibrer).
7. **« 30 jours » = 30 dates inclusives**, Europe/Paris.
8. **Fusion des exercices homonymes** : jamais automatique.
9. **Modèle de langage local** : optionnel ; assiste la formulation et propose des hypothèses (4.8), sans modifier de métrique ni publier sans validation des preuves ; le déterministe reste la base.
10. **Programme actuel vs historique** : jamais de rétroactivité ; **versionnement immuable des programmes et historique des affectations/déplacements de séances à mettre en place dès maintenant**, avec snapshots du plan applicable lorsqu'ils simplifient la fiabilité (2.5).
11. **Vocabulaire** : discipline/constance/assiduité/régularité autorisés pour des comportements observés ; motivation interdite.
12. **Jalons** (ex. 100e séance) : conservés mais courts, prioritaires uniquement au moment où ils surviennent.
13. **Abondance analytique** : ambition d'exhaustivité sans plafond ; la qualité est un seuil d'admission, pas une limite de richesse (0.1).
14. **Trois niveaux de richesse** (découverte majeure, analyse approfondie, observation contextualisée), exigence d'exactitude identique (10.9).
15. **Évaluation indépendante** : jugement externe à l'aveugle, trois jeux A/B/C, exemples de conception séparés des exemples de généralisation (18).
16. **Déploiement en shadow mode** et livraisons verticales évaluables (13, 18.5).
17. **Diagnostic de cause avant correction** : toute mauvaise carte est d'abord classée par famille de défaillance (18.7).
18. **Catalogue de détecteurs versionné** comme levier principal de diversité (19) et **registre de connaissances sportives versionné** (20).
19. **Graphiques** : capacité transversale, pas une neuvième catégorie ; facultatifs, fondés sur les mêmes preuves que l'analyse (22).
20. **Trois formats de présentation** (textuel, typographique, hybride) et quatre décisions de présentation ; aucun quota de graphiques, aucune alternance imposée (22.2, 22.6).
21. **Une découverte, plusieurs rendus possibles** : un changement de rendu ne crée jamais une nouvelle analyse (22.14).
22. **Une seule bibliothèque graphique principale**, derrière une couche de composants Momentum et le contrat `InsightChartPlan`, après audit de l'existant (22.13).
23. **Trois états d'exposition en plus de la production** : produite / accessible / présentée / consultée ; la répétition éditoriale dépend de l'exposition effective, jamais de la seule génération (8.8).
24. **Deux modes temporels** : rétrospectif et simulation à date (`eventTime`, `knownAt`, `knowledgeCutoff`), jamais mélangés (2.8).
25. **Personnaliser l'intérêt, jamais la vérité** : le retour utilisateur ne modifie que la hiérarchisation (8.9).
26. **Un contrat sémantique commun** pour Analyse, Calendrier, Récapitulatif, Graphiques et distinctions : pas de libellé « meilleur » sans critère mesurable (7.7).
27. **Un modèle local peut proposer, jamais valider** : `AnalyticalHypothesisPlanner` dans l'architecture dès maintenant, déploiement ultérieur (4.8).
28. **Déduplication par conclusion, non par phénomène** (9.6 bis) ; **flux riche** à compteur visible privilégié aux vues cloisonnées (9.6 bis).
29. **Limites de ressources ≠ plafond d'analyses** : calcul incrémental, cache, reprise ; registres séparés par profil (0.1 bis, 3.5, 13.5).
30. **Une seule définition active par concept** : les règles remplacées (fusion par phénomène, `sessionStatus` à trois valeurs, « GTG exclu » sans contexte, modèle local limité au style) sont supprimées du texte normatif ; leur historique reste ici.
31. **Une édition de récapitulatif figée** : les consultations ne reclassent jamais les cartes ; l'exposition n'agit qu'à la prochaine édition (8.10).
32. **Exhaustivité opérationnelle (vérifiable) vs exploration ouverte (bornée)** ; « perte éditoriale nulle » = aucune découverte admise rendue inaccessible, non « le moteur ne peut pas manquer une découverte » (0.1 bis, 18.8).
33. **Objectif déclaré ≠ orientation observée du programme**, stockés séparément (2.11).
34. **Décisions stabilisées, à ne plus remettre en cause sans élément nouveau** : huit catégories visibles ; abondance sans plafond d'admission ; trois formats de cartes ; formulation orientée conclusion ; implications sportives engagées et vérifiables ; distinction analyse / découverte / présentation (changer le texte ou le graphique ne crée pas un nouveau phénomène).

---

## 17. Questions restantes et suggestions

**Questions (seulement si utile)**
1. Les notes de difficulté (8 niveaux) de la banque : intrinsèques/techniques ou déjà pondérées par résistance ? Cela décide de leur usage en caractérisation.
2. Taille souhaitée de la sélection initiale « À retenir » par horizon (ex. 6 en 30 j, 8 en Toujours) ? Réglage de **présentation** uniquement : il ne limite ni l'admission ni l'accessibilité des autres analyses.
3. Objectif sportif de l'utilisateur : stocké explicitement dans Momentum (prise de muscle, force) ou à inférer du programme ? Conditionne conseils, nutrition, projections.
4. Les « petites séries hors programme » du calendrier doivent-elles compter comme jours de musculation dans les analyses, ou rester dans une rubrique à part comme le GTG ?
5. Tolères-tu qu'une carte « Aujourd'hui » soit révisée en cours de journée (état séance en cours) ou préfères-tu un verdict seulement à clôture ?
6. Qui évalue à l'aveugle les jeux B et C (toi seul, ou plusieurs relecteurs) et sur quelles fenêtres réelles de ton historique ?
7. Quelle bibliothèque graphique et quels composants existent déjà dans l'onglet Graphiques (dépendances, formats de données, styles réutilisables) ? Cela décide du choix de la base graphique unique (22.13).
8. La préférence d'affichage « Privilégier le texte / Équilibré / Plus visuel » doit-elle exister dès la première livraison, avec « Équilibré » par défaut (22.12) ?
9. Que mesure exactement la note globale de journée (ex. 72/100) : combine-t-elle activité, sommeil, fréquence cardiaque ? Cela décide si elle peut figurer à côté des analyses d'entraînement (7.7).
10. Quels libellés de distinctions du calendrier (« meilleure journée », « meilleure semaine ») existent aujourd'hui, et lesquels reposent sur un seul compteur ?
11. Convention de saisie des charges : haltères par haltère ou total ? lest et assistance distingués ? hauteurs/inclinaisons de variantes connues ? (2.10)
12. Les objectifs sportifs passés sont-ils documentés quelque part, ou seulement l'objectif actuel ? (2.11)
13. Le retour éditorial (« Intéressante / Déjà vue… ») doit-il exister dès la première livraison, et sous quelle forme d'interface ? (8.9)
14. Souhaites-tu le flux riche (Option B) dès la première livraison ou les trois vues d'abord ? (9.6 bis)

**Suggestions**
- Mettre en place tout de suite le versionnement immuable des programmes et l'enregistrement des affectations et déplacements de séances (avec snapshots du plan applicable quand ils simplifient la fiabilité) : le retard sur la provenance historique du plan est irrattrapable.
- Ajouter un mode debug « pourquoi cette carte ? » affichant score, rivales et preuves : indispensable pour calibrer les poids.
- Créer un petit jeu de données de test figé (tes vrais événements + cas fictifs) avant de toucher aux producteurs.
- Afficher la couverture des sources (« données depuis le… ») dans les vues 1 an/2 ans/Toujours.
- Prévoir un export de la chaîne de décision d'un run (JSON unique) pour auditer d'un coup candidats, scores et rendu.
- Instrumenter dès maintenant le comptage candidates → conclusions distinctes → analyses admissibles → analyses accessibles (perte éditoriale, 18.6).
- Classer chaque mauvaise carte par famille de défaillance avant toute correction (18.7).
- Constituer les jeux de référence A/B/C (18) avant de modifier les producteurs, en séparant exemples de conception et exemples de généralisation.
- Lancer le moteur expérimental en shadow mode avant d'activer de nouveaux détecteurs (18.5).
- Rédiger le contrat technique compact et le plan d'implémentation séquencé, puis **auditer le code existant** avant toute nouvelle idée conceptuelle (13.6).
- Ajouter `eventTime`/`knownAt` aux faits dès P0 : un retard sur cette information est irrattrapable pour les rejeux honnêtes (2.8).
- Enregistrer localement les événements d'exposition (affichage, ouverture) dès la première version du flux riche (8.8).
- Inventorier les libellés de distinctions et notes du calendrier et les rattacher au contrat sémantique partagé (7.7).
- Après les amendements, faire un **audit de correspondance spécification/code**, fonctionnalité par fonctionnalité, avant tout nouveau développement conceptuel (13.7, étape A).

---

## 18. Évaluation indépendante de la qualité

### 18.1 Pourquoi
Les tests de justesse (12.2), de cohérence (7) et de formulation (10.3) vérifient qu'une carte est correcte. Ils ne disent pas si le moteur a trouvé **l'une des conclusions les plus intéressantes** que les données permettent. Si une modification des règles fait passer le score moyen des cartes de 52 à 78 alors que la façon de calculer ce score a aussi changé, cela ne prouve rien : il faut une **référence extérieure au moteur évalué**. Sans cette section, l'architecture peut s'améliorer sans qu'on puisse démontrer que l'utilisateur obtient de meilleures analyses. Trois jeux de tests, plus des indicateurs, un déploiement parallèle et une classification des défaillances.

### 18.2 Jeu A — Exactitude et cohérence
À partir des données réelles, conserver les événements et les résultats attendus : calculs, dates, identifiants, couverture des sources, conclusions interdites, cohérence (batterie de 12.2).

### 18.3 Jeu B — Qualité des découvertes
Pour plusieurs fenêtres de l'historique réel, constituer un ensemble de **références éditoriales évaluées indépendamment du moteur**. Question posée : « Parmi toutes les conclusions qu'on pourrait raisonnablement tirer de ces données, Momentum a-t-il trouvé l'une des plus intéressantes ? » Une carte peut être exacte et passer à côté d'une découverte plus importante.

**Exemple : pompes inclinées** (huit séances connues, trois propositions factuellement défendables) :
- *Candidate A* — « Ton volume moyen augmente de 25,6 % » (hausse du nombre de répétitions entre premières et dernières séances).
- *Candidate B* — « Tes six dernières séances atteignent toutes 36 répétitions » (volume désormais régulièrement reproduit, après deux séances initiales plus variables).
- *Candidate C* — « Ton ancien progrès est devenu un niveau que tu retrouves même après une interruption » : après 30 puis 20 répétitions, 36 répétitions sur les six séances suivantes, et même les 42 jours sans cet exercice ne modifient pas le volume à la reprise ; la découverte est la **consolidation d'un format retrouvé au fil du temps**.
Pour raconter la trajectoire de cet exercice sur plusieurs mois, on privilégie C, puis B, puis A. Il faut pouvoir mesurer si le nouveau moteur arrive régulièrement à ce genre d'arbitrage. (Dans une logique d'abondance, B et A peuvent rester accessibles comme analyses de niveau 2 ou 3 si elles apportent une conclusion distincte ; l'arbitrage porte sur la mise en avant et sur les doublons de conclusion.)

**Construire les références.** Prendre un échantillon représentatif : séances récentes, périodes longues, progressions, maintiens, reprises, changements de répartition, moments où il ne se passe rien de remarquable. Pour chaque cas : conserver les événements et preuves accessibles au moteur ; rassembler les analyses candidates ; ajouter si nécessaire une interprétation de référence construite manuellement ; faire comparer les conclusions par des évaluateurs **sans qu'ils sachent** quelle version vient de l'ancien ou du nouveau moteur ; classer selon des critères précis plutôt qu'une impression générale :

| Critère | Ce qu'on évalue |
|---|---|
| Exactitude | Toutes les affirmations sont-elles soutenues ? |
| Pertinence | Le phénomène mérite-t-il d'être raconté ? |
| Valeur explicative | L'analyse va-t-elle au-delà des chiffres visibles ? |
| Profondeur utile | A-t-elle trouvé un contexte ou un mécanisme réellement instructif ? |
| Portée sportive | Explique-t-elle pourquoi le phénomène compte pour la pratique ? |
| Formulation | La découverte est-elle comprise facilement, sans remplissage ? |
| Originalité informative | Apporte-t-elle quelque chose de différent des cartes déjà publiées ? |
| Calibration | La force de la conclusion correspond-elle à la solidité des preuves ? |

Enregistrer aussi les **motifs du classement** (« C est supérieure à B parce qu'elle relie la stabilisation à une interruption historique significative ») : cette justification devient un test de sélection plus utile qu'une note.

**Deux précautions méthodologiques.** (1) Ne pas évaluer le nouveau moteur avec son propre système de notation : un jugement externe, idéalement à l'aveugle. (2) Ne pas utiliser uniquement les exemples sur lesquels les règles ont été conçues (pompes inclinées, pompes déclinées, 56 % de complétion) : séparer les **exemples de conception et de réglage** des **exemples de vérification de la généralisation**.

### 18.4 Jeu C — Qualité du récapitulatif complet et renouvellement dans le temps
Le jeu B vérifie qu'une analyse est intéressante individuellement ; dix bonnes cartes peuvent former un mauvais récapitulatif (si elles racontent toutes que trois exercices ont conservé leur format de répétitions, l'ensemble est répétitif). On teste l'ensemble publié.

**Test 1 — qualité collective.** Comparer l'ancien et le nouveau récapitulatif sur les mêmes données : diversité des conclusions apportées ; couverture des phénomènes majeurs ; absence de contradictions ; quantité de répétitions éditoriales ; place accordée aux découvertes importantes ; qualité de la synthèse générale ; quantité de texte nécessaire pour transmettre l'information. Une sélection prioritaire de six cartes peut être supérieure à l'ancienne de quatorze si elle explique mieux la période sans répétition inutile, **à condition qu'aucune conclusion distincte et admissible n'ait été perdue** (perte éditoriale, 18.6).

**Test 2 — comportement après de nouvelles séances (simulation chronologique).** À chaque étape, on ajoute un événement et on relance Momentum comme si l'utilisateur venait de l'enregistrer. Exemple, stabilité d'un exercice :

| État de l'historique | Attendu |
|---|---|
| 3 séances au même niveau | Stabilité émergente, selon l'historique |
| 5 séances au même niveau | Consolidation possible |
| 6 séances au même niveau | Conclusion davantage étayée |
| 7e séance identique | Mise à jour des faits sans republication automatique |
| 8e séance identique | Rotation possible vers une autre découverte |
| Nouveau format répété | Réévaluation du phénomène |
| Correction d'une ancienne séance | Révision si la conclusion précédente ne tient plus |

**Test 3 — huit fenêtres simultanées.** Charger les huit horizons dans le même état de données : la même observation peut être pertinente à plusieurs niveaux mais ne mérite pas huit publications identiques. Un progrès constaté sur 30 jours peut alimenter une trajectoire de trois mois et une synthèse annuelle ; si les trois cartes répètent la même variation de 25,6 % avec quelques mots différents, le test le signale.

**Test 4 — stabilité de l'interface.** Le moteur ne renouvelle pas les cartes chaque fois qu'on ouvre l'onglet : à données et historique éditorial inchangés, la sélection principale reste déterministe. Le mode « Voir d'autres analyses » propose des conclusions alternatives, distinctes de la sélection principale.

**Test 5 — volume.** Sur un état de données riche, le pack « À retenir » reste lisible et la vue « Toutes » contient toutes les analyses admissibles et distinctes, sans dégradation des performances (12.3).

### 18.5 Déploiement parallèle (shadow mode)
Faire coexister temporairement deux versions : le **moteur actuel** produit les analyses existantes ; le **moteur expérimental** produit les nouvelles interprétations sur les mêmes données et fenêtres, sans remplacer les cartes visibles. On observe : nombre de candidates produites, motifs d'exclusion, qualité des conclusions, contradictions détectées, durée du run, différences de sélection, et aussi la perte éditoriale et la couverture analytique. On active ensuite progressivement les détecteurs dont les résultats sont suffisamment convaincants.

### 18.6 Indicateurs d'évaluation
Tableau de bord **indépendant des notes attribuées aux cartes** :

| Indicateur | Ce qu'il permet de vérifier |
|---|---|
| Exactitude des affirmations | Proportion de faits vérifiés dans les cartes |
| Taux de contradictions | Nombre de conflits avérés dans les packs |
| Préférence éditoriale à l'aveugle | Fréquence à laquelle la nouvelle version est jugée meilleure |
| Couverture des découvertes de référence | Phénomènes importants réellement trouvés par le moteur |
| Taux de conclusions redondantes | Conclusions répétées dans un pack ou entre horizons |
| Nouveauté utile | Part des nouveaux contenus apportant une véritable information |
| Taux de fausse nouveauté | Cartes déclarées nouvelles alors qu'elles répètent un phénomène connu |
| Taux de conclusions excessives | Interprétations plus fortes que leurs preuves |
| Stabilité sans nouvel événement | Sélection inchangée à données et état identiques |
| Réactivité aux corrections | Conclusions erronées correctement révisées après correction des sources |
| **Couverture analytique** | Proportion des méthodes de découverte applicables réellement explorées |
| **Rendement informatif** | Nombre de conclusions distinctes et admissibles produites |
| **Perte éditoriale** | Nombre d'analyses utiles non accessibles à cause de limites de sélection ou de présentation |
| **Intégrité visuelle** | Graphiques valides (périmètre, unités, zéro ≠ inconnu, comparateurs) et concordants avec le texte (22.8) ; les variantes de rendu d'une même découverte ne gonflent jamais le compteur d'analyses |

Quatre ensembles à distinguer et compter séparément : **candidates**, **conclusions distinctes**, **analyses admissibles**, **analyses accessibles**. Si Momentum produit 48 analyses admissibles et n'en rend que huit accessibles, il y a un vrai problème ; si 48 candidates correspondent à huit conclusions différentes, afficher huit cartes n'est pas une perte. Une **alerte de diagnostic** se déclenche lorsque le nombre de conclusions est inhabituellement faible alors que les données sont riches (4.7) : elle cherche les causes de sous-production, elle ne fabrique pas de cartes.

Ces indicateurs ne sont **pas réduits à une seule moyenne**. Exactitude et cohérence sont des **exigences bloquantes** : une version qui plaît davantage aux évaluateurs mais invente régulièrement des relations entre sommeil et progression n'est pas meilleure. On ne mesure pas non plus le moteur au nombre de cartes : ni « passer de 10 à 20 », ni « réduire le nombre de cartes » (9.5).

### 18.7 Classification des défaillances (qualité du moteur ≠ qualité des données)
Une carte qui n'a pas détecté que les jambes sont régulièrement absentes du programme peut avoir huit causes très différentes : programme historique indisponible ; exercices de jambes mal identifiés dans la banque ; contributions musculaires mal attribuées ; phénomène calculé mais aucune candidate créée ; candidate déclassée ; candidate admissible mais battue par d'autres ; conclusion retenue mais formulation médiocre ; carte produite mais non affichée. On ne corrige pas le huitième en ajoutant un producteur si le vrai problème est le sixième. Classification systématique, à faire apparaître dans le diagnostic du moteur :

| Famille | Exemple |
|---|---|
| `SOURCE_GAP` | Programme historique absent |
| `IDENTITY_GAP` | Exercice non résolu |
| `METRIC_ERROR` | Mauvais dénominateur |
| `DETECTION_MISS` | Phénomène présent mais non reconnu |
| `REASONING_MISS` | Phénomène reconnu mais mauvaise interprétation |
| `SELECTION_MISS` | Bonne découverte éliminée sans raison suffisante |
| `DUPLICATION` | Même conclusion plusieurs fois |
| `WRITING_FAILURE` | Conclusion correcte mais formulation pauvre |
| `PUBLISHING_MISMATCH` | Carte produite mais non affichée |

**Règle** : lorsqu'on trouve une mauvaise carte, on n'écrit pas immédiatement un nouveau texte ; on identifie d'abord à quel niveau la défaillance s'est produite. Exemple : « Octobre concentre la part la plus productive » peut relever du dénominateur, du choix du comparateur, du phénomène sélectionné et de la formulation finale ; corriger la seule phrase ne corrige pas le raisonnement. Un **diagnostic de cause est obligatoire avant toute correction structurelle**.

### 18.8 Critère de réussite mesurable
La nouvelle version doit : **ne pas dégrader la fiabilité des faits** ; **produire des conclusions jugées plus instructives sur des cas non utilisés pour sa conception** ; **réduire les répétitions éditoriales inutiles dans les simulations temporelles** ; et **ne perdre aucune conclusion admissible et distincte** (perte éditoriale nulle au sens défini ci-dessous, couverture analytique en hausse). C'est un objectif mesurable, contrairement à « obtenir des cartes plus intelligentes ».

**Deux formes de perte à ne pas confondre.** *Perte après découverte* : le moteur a identifié et validé une conclusion, mais elle devient inaccessible à cause de la sélection ou de l'interface ; elle doit être **nulle**. *Découverte manquée* : le moteur n'a jamais envisagé une conclusion déductible des données ; elle n'apparaît dans aucun registre et ne se mesure donc pas en comptant les candidates, d'où le jeu B (18.3).

| Indicateur | Objectif |
|---|---|
| Taux de conservation des conclusions admises | 100 % restent accessibles tant qu'elles sont valides et pertinentes pour la vue considérée |
| Couverture des découvertes de référence | Progresser sur des cas évalués indépendamment, y compris ceux que les producteurs actuels ne savent pas trouver |

« Nous avons tout publié » n'est pas « nous avons tout découvert ». Une conclusion infirmée par une correction reste traçable dans l'historique sans être présentée comme vérité actuelle.

### 18.9 Rejeu chronologique sans fuite d'information future

Les simulations de publication dans le temps (18.4, jeu C ; 18.5) utilisent le mode **simulation au fil du temps** (2.8) : à chaque date simulée, le moteur ne voit que les faits dont `knownAt ≤ knowledgeCutoff`. Le mode rétrospectif sert à l'analyse d'une période passée avec toute l'information actuelle, jamais à évaluer ce que Momentum « aurait dit ». **Test** : aucune conclusion simulée au 20 octobre ne dépend d'une séance ou d'une correction connue seulement après cette date ; les importations Garmin tardives sont traitées par `knownAt` et les corrections par le journal immuable (2.8). Les jeux d'évaluation de la mémoire, de la détection des tendances et de la rotation reposent obligatoirement sur ce mode.

---

## 19. Catalogue des détecteurs analytiques

### 19.1 Rôle
Le catalogue des détecteurs (4.4) est le véritable levier pour augmenter la diversité des analyses admissibles : non pas dix formulations d'un même plateau, mais davantage de **mécanismes que le moteur sait rechercher**. Il est extensible et versionné, et chaque détecteur est testé avant activation.

### 19.2 Contrat obligatoire d'un détecteur

| Champ | Fonction |
|---|---|
| Identifiant et version | Suivi et versionnement |
| Type de phénomène | Consolidation, rupture, redistribution, reprise, etc. |
| Sources nécessaires | Séries, dates, charges, programme… |
| Couverture minimale | Données indispensables à la comparaison |
| Conditions de déclenchement | Quand examiner le phénomène |
| Comparateurs possibles | Historique récent, meilleure période, avant interruption… |
| Hypothèses à vérifier | Pourquoi la métrique a-t-elle changé ? |
| Conclusions autorisées | Ce qu'on peut réellement déduire |
| Conclusions interdites | Ce qui exigerait des données absentes |
| Critères d'intérêt | Pourquoi le phénomène mérite une carte |
| Clé de mémoire | Comment reconnaître le même phénomène à une autre date |
| Politique de rotation et de réouverture | Quand une nouvelle occurrence actualise, quand elle rouvre |
| Tests | Cas où le détecteur doit réussir ou s'abstenir |
| Domaine d'exploration et passe(s) | Rattachement à 4.6 (domaine, passes 1 à 3) |
| Niveau éditorial produit | Majeure / approfondie / contextualisée (10.9) |

Les seuils ne sont pas universels : six séances sont très significatives pour un mouvement pratiqué une fois par mois, beaucoup moins pour un mouvement quotidien ; on tient compte de la fréquence historique, de la dispersion habituelle et de l'échelle temporelle.

### 19.3 Exemple : `exercise_format_consolidation`
- **Entrées** : historique des séances d'un exercice identifié, séries et répétitions.
- **Recherche** : un niveau de volume ou un format qui se répète après une période de variation.
- **Vérifications** : nombre d'occurrences, dispersion, durée écoulée, interruptions, changements connus de charge et de variante.
- **Interprétation possible** : « le mouvement est passé d'un volume variable à un format régulièrement retrouvé ».
- **Interprétation interdite** : « le muscle ne progresse plus » ou « la force a atteint un plateau », sans autres éléments.
- **Rotation** : une nouvelle occurrence identique actualise le constat mais ne déclenche pas nécessairement une publication.
- **Réouverture** : changement durable de format, charge nouvelle, interruption significative ou nouveau rôle dans le programme.

### 19.4 Catalogue de départ
Catalogue **dérivé des exemples de cette spécification, à valider sur le registre existant** avant activation. La famille de conclusion principale (10.7) détermine la logique du texte.

| Détecteur | Domaine (4.6) | Cherche | Famille de conclusion |
|---|---|---|---|
| `exercise_format_consolidation` | Progression, Trajectoire | Format qui se répète après variation | Consolidation |
| `volume_rebound_decomposition` | Activité, Trajectoire | Hausse de volume décomposée : jours actifs, reps par jour actif, exercices par séance, séries, familles, charges | Mécanisme |
| `exercise_return_after_gap` | Répertoire, Progression | Reprise après interruption : format antérieur, durée d'absence, séances de reprise | Transformation |
| `resistance_progression` | Progression, Exigence | Charge supérieure à format comparable (invisible dans les reps) | Mécanisme |
| `set_addition_work_increase` | Progression | Séries en hausse à reps/série identiques | Mécanisme |
| `work_redistribution` | Structure | Travail qui se déplace d'un exercice vers d'autres | Transformation |
| `work_concentration` | Structure | Part croissante sur quelques mouvements | Transformation |
| `family_coverage` | Structure, Programme | Familles présentes ou absentes de façon récurrente | Contraste |
| `family_diversification` | Structure, Répertoire | Famille travaillée par davantage de variantes | Transformation |
| `trajectory_phase_segmentation` | Trajectoire | Phases distinctes et durables, transitions | Transformation, Consolidation |
| `horizon_contrast` | Trajectoire | Contraste entre deux lectures temporelles | Contraste |
| `session_work_comparison` | Exigence, Activité | Nature du travail de deux séances (quatre issues, 5.3) | Contraste |
| `unusual_session_decomposition` | Activité, Exigence | Volume inhabituel décomposé (exercice long, séries, mouvements) | Mécanisme |
| `program_conformity`, `program_coverage`, `program_adaptation` | Programme | Conformité, couverture, adaptation (dates à plan historique fiable) | Contraste, Implication |
| `weekday_reliability` | Rythme, Programme | Constance d'un jour de semaine vs exécution | Contraste |
| `rhythm_blocks` | Rythme | Intervalles, regroupements, cadence | Transformation |
| `sleep_schedule_shift` | Sommeil | Horaires, durée, régularité propres au sommeil | Transformation |
| `milestone_enrichment` | Activité | Jalon (100e séance) enrichi par comparaison de blocs | Mécanisme |
| `repertoire_lifecycle` | Répertoire | Nouveau, retour, régulier, perd sa place, remplacé | Transformation |

### 19.5 Règles d'extension
- Un nouveau détecteur est testé sur le registre existant et en shadow mode (18.5) avant activation : combien de candidates nouvelles, combien de vraies nouveautés, combien de doublons ou contradictions.
- Chaque domaine de 4.6 dispose d'au moins un détecteur applicable ou d'un motif explicite de non-exécution.
- Avant d'assouplir un filtre, exploiter les motifs de sortie des candidates (4.4) ; on enrichit les méthodes, on n'abaisse pas les exigences d'exactitude.

### 19.6 Place de la recherche d'hypothèses dans le contrat des détecteurs

Le contrat d'un détecteur (19.2) prévoit dès maintenant : une **entrée optionnelle de phénomènes déjà détectés** par d'autres détecteurs (pour qu'une hypothèse issue de l'`AnalyticalHypothesisPlanner`, 4.8, puisse être vérifiée par un détecteur existant ou par un détecteur de relation dédié) ; une sortie **hypothèse vérifiée / rejetée** tracée ; et la soumission à la politique de comparaison (2.12). Le catalogue de départ n'est ainsi pas modifié en profondeur lorsque la couche sera activée. Chaque détecteur déclare sa **classe** (décomposition déterministe / comparaison descriptive / association exploratoire / projection, 2.12), qui fixe ses règles de validation.

---

## 20. Gouvernance des connaissances et des conclusions

Cette section empêche Momentum de devenir plus bavard sans devenir plus fiable.

### 20.1 Objets gouvernés et versionnement
Définitions de métriques (`definitionVersion`), calculs (`calculationVersion`), détecteurs (19), règles sportives (11.6, 11.9), relations entre conclusions (7.3) : chacun a un identifiant, une version et une date de revue. Un changement de version déclenche la réévaluation des conclusions qui en dépendent ; une conclusion publiée sous une ancienne définition est révisée ou marquée comme dépassée.

### 20.2 Règles sportives
Chaque règle précise objectif, prérequis, indicateurs nécessaires, implications permises et interdites, limites, provenance, date de revue et échéance (11.9). Trois niveaux de conclusion toujours distingués : démontrable, implication fondée sur des connaissances sportives, interdite sans mesure supplémentaire.

### 20.3 Relations et conflits entre conclusions
Liens typés (`supports`, `refines`, `updates`, `supersedes`, `contradicts`, `related_to`), assertions structurées, trois cohérences (numérique, logique, éditoriale) et précédence des niveaux (7.3–7.5). Une conclusion qui contredit un fait validé à périmètre identique est bloquée ; une conclusion dépassée est révisée, pas supprimée de l'historique.

### 20.4 Projections, scénarios et conseils
Les projections sont calculées avant d'être rédigées, énoncent leurs hypothèses, et se limitent à un scénario lorsque les données ne permettent pas de prévision fiable (11.8). Les conseils sont rares, contextualisés, soumis au contrôle de pertinence et jamais obligatoires (11.4, 11.7).

### 20.5 Validation et langage
Validation de l'interprétation avant rédaction, puis du texte après rédaction (aucune affirmation ajoutée, aucun chiffre modifié, aucune conclusion renforcée) (10.8). Jamais de cause, fatigue, motivation ou gain non démontrés ; vocabulaire de constance autorisé dans les limites de 6.5. Ces garde-fous s'appliquent aux trois niveaux de richesse éditoriale (10.9) et aux visualisations : un graphique ne doit jamais raconter ce que l'analyse n'affirme pas (22.8).

---

## 21. Verdict et orientation finale

Sont conservés : la décision des huit catégories visibles dont trois nouvelles, le GTG séparé, l'exigence de traçabilité, la mémoire des phénomènes, le refus des scores universels de difficulté et le principe de conclusions sportives ambitieuses mais étayées. Ce qui change fondamentalement : la manière de **construire et de mesurer l'intelligence analytique**, et l'ambition d'**abondance** sans plafond d'admission.

La spécification répond à « comment faire fonctionner correctement Momentum ? » ; elle répond désormais aussi à deux questions supplémentaires : *comment lui apprendre à découvrir des choses auxquelles ses producteurs actuels ne pensent pas ?* (catalogue de détecteurs, exploration multi-passes) et *comment savoir, de manière indépendante, si ce qu'il découvre est réellement plus intéressant que ce qu'il racontait auparavant ?* (évaluation indépendante). Les trois investissements majeurs : une **bibliothèque extensible de méthodes de découverte**, une **mémoire sémantique des phénomènes et conclusions** (faire évoluer leur signification sans republier éternellement la même histoire), un **système d'évaluation éditoriale indépendant**. Le registre d'affirmations, les profils de séance, les nouvelles catégories, les projections et la rédaction soutiennent ces trois capacités.

**Exigence fondamentale (critère supérieur d'arbitrage)** : la réussite ne se mesure ni au nombre de producteurs, ni au nombre de catégories, ni à la longueur des analyses, ni à leur score interne, mais à la capacité de Momentum à expliquer correctement des phénomènes importants, à découvrir de nouveaux liens pertinents, à réviser ses conclusions lorsque les données évoluent et à présenter des informations que l'utilisateur n'aurait pas facilement déduites de ses statistiques. Momentum doit être un outil dans lequel on peut passer du temps, explorer son parcours sous de nombreux angles et continuer à découvrir des choses intéressantes, plutôt qu'un tableau de bord qui raconte cinq observations puis considère qu'il n'a plus rien à ajouter. Les graphiques servent cette ambition sans la transformer en deuxième tableau de bord : Momentum varie la manière de raconter les découvertes, jamais leur contenu (22).

**Complément de verdict (audit)** : la principale lacune restante n'était ni une nouvelle catégorie ni un nouveau type de graphique, mais la **boucle complète** entre ce que Momentum sait, ce qu'il découvre, ce qu'il présente, ce que l'utilisateur a réellement consulté et la façon dont il améliore ses prochaines sélections : les trois premières étapes étaient bien couvertes, la quatrième commençait à l'être (mémoire éditoriale) ; l'exposition réelle, le retour sur l'intérêt, la recherche d'hypothèses et la cohérence des jugements dans le reste de l'application sont désormais couverts (8.8, 8.9, 4.8, 7.7). État de la spécification : *vision produit* très avancée ; *architecture conceptuelle* solide mais perfectible (contrats de données, interactions entre modules, règles de décision) ; *spécification exécutable* pas encore complète (schémas indicatifs, seuils et méthodes statistiques à définir, coût de calcul non quantifié, code réel non audité : 13.6).

---

## 22. Système transversal de visualisation analytique et composition éditoriale

*Les graphiques résolvent une partie du problème de départ : des analyses chargées de chiffres qui ne font pas toujours comprendre immédiatement ce qu'ils révèlent. Les exemples ci-dessous sont illustratifs (données fictives ou issues de l'historique discuté), pas des modèles imposés.*

### 22.1 Principe directeur
Momentum peut représenter visuellement les conclusions de ses analyses par des graphiques choisis selon le phénomène démontré, les données disponibles et le contexte de la période. **Les graphiques ne sont pas une catégorie d'analyse** (pas de neuvième catégorie « Graphiques ») : ils forment une couche transversale de démonstration et de présentation, utilisable par les huit catégories, sans système graphique indépendant par catégorie et sans calcul statistique propre. Chaque visualisation s'appuie sur les **mêmes faits, métriques, comparateurs et preuves** que l'analyse qu'elle accompagne. Elle privilégie ce qui rend immédiatement perceptible une évolution, une relation, une différence de structure, une interruption ou un mécanisme.

Principe de composition éditoriale mixte : Momentum ne transforme pas l'onglet Analyse en succession systématique de graphiques ; il garde une identité principalement analytique et rédactionnelle où plusieurs formes de présentation cohabitent. **La présence d'un graphique n'est ni automatique ni obligatoire** : le moteur évalue son apport réel à la compréhension, puis choisit la présentation la plus pertinente. Aucune analyse pertinente n'est exclue faute de graphique adapté ; aucune visualisation n'est créée pour satisfaire une obligation de présence graphique. Le graphique **montre**, le texte **interprète**, la conclusion **donne du sens**. L'exigence : le graphique rend la conclusion plus évidente, pas la carte plus jolie.

### 22.2 Trois formats de présentation (pas trois catégories)
| Format | Composition | Rôle |
|---|---|---|
| **A — Analyse textuelle** | Titre + démonstration + conclusion | La force de l'analyse repose sur le raisonnement |
| **B — Analyse hybride** | Titre + graphique + explication + conclusion | Le graphique aide à comprendre une relation importante |
| **C — Analyse typographique** | Titre + données ou oppositions mises en forme + conclusion | Démonstration visuelle légère, sans graphique statistique (chiffres, alignements, oppositions mis en scène) |

Exemples : (A) Trajectoire « Ton entraînement a retrouvé du volume sans revenir au rythme de juin » (6 947 reps sur 22 journées actives en juin, 3 704 sur 12 en septembre, 4 301 sur 12 en octobre : le rebond passe par des journées plus chargées, pas par la fréquence de juin) ; l'absence de graphique n'est pas une version dégradée. (B) Progression « Tes pompes inclinées ont trouvé un niveau que tu reproduis régulièrement » : 30 et 20 reps puis six séances à 36 ; l'axe S1–S8 représente l'ordre des séances et la **frise doit signaler les 42 jours d'interruption**. (C) Programme « Tu as presque terminé le haut du corps, mais pas les jambes » : pectoraux 100 % (120/120), biceps 95 % (76/80), jambes 0 % (0/150), le taux global de 56 % masquant l'absence des jambes (programme historique supposé fiable).

**Une découverte possède une seule identité analytique** ; le système lui attribue une présentation (A, B ou C). L'utilisateur peut éventuellement voir ses données sous une autre forme dans le détail de la carte, sans que cela génère des analyses distinctes.

### 22.3 Le graphique est choisi selon la conclusion, pas selon la catégorie
Associer une catégorie à un graphique (Activité = histogrammes, Progression = courbes, Structure = camemberts…) fonctionnerait mal : une même catégorie produit des découvertes très différentes (hausse de charge, stabilisation, reprise, évolution du nombre de séries). On construit une bibliothèque de **formes visuelles associées aux types de conclusions** :

| Ce que l'analyse démontre | Visualisation privilégiée |
|---|---|
| Une évolution au fil du temps | Courbe ou points chronologiques |
| Une comparaison entre deux périodes | Barres comparatives |
| Une redistribution entre exercices | Barres empilées ou barres comparant les contributions |
| Une progression série par série | Barres groupées par séance et par série |
| Une interruption suivie d'une reprise | Frise chronologique avec intervalle visible |
| Une couverture musculaire incomplète | Matrice prévu/réalisé |
| Une répartition des journées actives | Calendrier ou graphique de fréquence |
| Une stabilité répétée | Points ou ligne avec niveau de référence |
| Une projection conditionnelle | Courbe de scénario distincte des observations |
| Une relation entre deux variables | Nuage de points, si les données sont suffisantes |
| Un jalon unique | Indicateur visuel ou frise, pas forcément un graphique statistique |

Il suffit de développer un **ensemble fini de composants** capables d'exprimer plusieurs familles de raisonnements, pas un graphique par analyse.

### 22.4 Visualiser les mécanismes, pas seulement les résultats
Règle : un graphique ne se contente pas d'illustrer un indicateur si l'analyse démontre précisément que cet indicateur est insuffisant. Si la conclusion porte sur la couverture musculaire, le graphique montre la couverture ; sur le mécanisme d'une hausse, il montre ce mécanisme ; sur une reprise, il montre l'avant, l'interruption et le retour.

- **Juin / septembre / octobre** : plutôt qu'une simple courbe des répétitions mensuelles, un composant de **décomposition du volume** présentant ensemble les journées actives, les répétitions par journée active et le volume total qui résulte de leur produit. Si seuls certains mois sont affichés (juillet et août absents), la comparaison est annoncée comme ciblée, pas comme courbe continue.
- **56 %** : une jauge remplie à 56 % commettrait visuellement l'erreur d'une mauvaise conclusion (réduire la séance à un seul taux). On présente une comparaison **par groupe musculaire** (196/350 reps prévues réalisées, pectoraux complets, biceps presque complets, jambes absentes) ; le détail des exercices et séries du prévu/réalisé reste accessible à la demande.

### 22.5 Architecture : Visual Insight Engine
Moteur de visualisation transversal (nom provisoire **Momentum Visual Insight Engine**). **Il n'est pas un deuxième moteur d'analyse** : il reçoit des conclusions déjà construites et détermine si une visualisation apporte quelque chose, quelle relation montrer, quel type de graphique, quelles données exactes transmettre, quels éléments mettre en évidence, où placer le graphique par rapport au texte, et si le résultat respecte les règles visuelles et factuelles.

Pipeline : (1) analyse et preuves (faits validés, phénomène, comparateur, thèse, conclusion sportive) → (2) planification visuelle (ce qu'il faut démontrer, données, forme) → (3) validation graphique (unités, dénominateurs, temporalité, identité, GTG, comparabilité) → (4) composition de la carte (titre, représentation, explication, conclusion cohérents) → (5) rendu React avec thème commun.

Le **plan visuel est établi à partir de la conclusion structurée, avant de finaliser la prose** : rédacteur et système de visualisation travaillent à partir d'un même **plan de démonstration**, plutôt que de générer le texte puis de chercher un graphique décoratif. Si le graphique montre clairement six séances à 36 répétitions, le texte n'a pas à les énumérer ; s'il fait apparaître une interruption importante, la rédaction l'explique.

Quatre composants logiciels aux responsabilités séparées :
- **PresentationPlanner** : décide la forme globale de la carte (texte, typographique, hybride, hybride étendue) ;
- **ChartPlanner** : choisit la manière de représenter la conclusion ;
- **ChartValidator** : vérifie que la représentation est fidèle aux données ;
- **ChartRenderer** : produit le rendu selon les règles esthétiques.
Cette séparation permet, pour une contre-analyse, de savoir si le mauvais modèle a été choisi, si les mauvaises données ont été transmises ou si le rendu est défectueux (rattaché à la classification 18.7 : défaillances de plan, de validation ou de rendu visuels).

Un graphique est généré **à partir des preuves, jamais en relisant le texte** produit (risques de dates, valeurs, unités et comparateurs erronés).

### 22.6 Décision de présentation : évaluer toujours, afficher seulement si utile
**Évaluation systématique, présence jamais systématique** : toutes les analyses sont évaluées pour leur potentiel visuel, mais seules celles dont la compréhension est réellement améliorée par une représentation en reçoivent une. Étape `visualEligibility`, trois questions : le graphique permet-il de voir une relation, une évolution, un contraste ou une répartition ? cette relation est-elle au cœur de la conclusion ? les données sont-elles suffisantes et comparables ? Si les trois réponses sont positives, le moteur cherche une visualisation adaptée ; sinon il choisit texte, indicateur ou frise simple.

**Quatre décisions** :
| Décision | Signification |
|---|---|
| `TEXT_ONLY` | La conclusion est mieux racontée par le texte |
| `TEXT_VISUAL` | Une présentation typographique suffit |
| `HYBRID` | Un graphique apporte une véritable valeur de compréhension |
| `HYBRID_EXPANDED` | L'analyse nécessite une visualisation plus approfondie, éventuellement dépliable |

Pas de règle mécanique du type « au moins quatre valeurs numériques ⇒ graphique ». Question posée : *si j'ajoute cette visualisation, qu'est-ce que l'utilisateur comprendra plus facilement ou plus vite qu'avec le texte seul ?* Si « pas grand-chose », on garde le texte. Indicateur interne **`textSufficiency`** : le titre, les preuves et la conclusion expliquent-ils déjà clairement le phénomène ? Ce n'est pas le graphique qui est récompensé, c'est le **gain de compréhension**.

**Trois niveaux de visuel** : compact (jalon, donnée unique, observation courte), standard (trajectoire, comparaison, répartition, évolution), approfondi (plusieurs mécanismes liés, détail de séries ou périodes multiples). Pas de quota : une carte complexe peut porter deux graphiques complémentaires si cela améliore la démonstration.

**Longueur et graphique** (repères de conception, pas seuils de validation ; la longueur s'évalue selon le texte que l'analyse mérite réellement, jamais allongée ou raccourcie pour obtenir un graphique, et se distingue de la complexité du raisonnement) :
| Longueur indicative du corps de texte | Politique |
|---|---|
| Courte (≈ 30 à 75 mots) | Seulement si le visuel exprime immédiatement la découverte ; souvent format A ou C |
| Moyenne (≈ 75 à 160 mots) | Meilleure candidate à un graphique intégré (le graphique remplace une partie de la description numérique et permet une meilleure carte avec moins de texte descriptif) |
| Longue (> ≈ 160 mots) | Graphique plus sélectif, compact ou intégré à une synthèse |

Analyses courtes : « tu passes de 8 à 10 répétitions sur chacune de tes quatre séries » peut se prêter à un mini avant/après ; « ta centième séance » ne nécessite qu'un jalon typographique. Sur une carte très courte, le graphique ne doit pas devenir plus imposant que l'information. Analyses longues : pas d'interdiction ; **plus l'analyse est longue, plus le graphique doit démontrer une partie centrale du raisonnement** pour justifier sa place. Deux approches : (A) le graphique **synthétise** (ex. trois phases d'une analyse sur six mois en tête, le texte développe ensuite) ; (B) le graphique **approfondit** une partie précise dans une section dépliable (« Voir la répartition détaillée »). Le choix dépend du rôle du graphique dans la démonstration.

**Formats de composition** : carte courte (titre + visuel compact + conclusion), carte normale (titre + graphique + explication concise), carte approfondie (titre + synthèse + graphique principal + détail dépliable). On ne doit pas obliger à lire quatre paragraphes pour comprendre le graphique, ni laisser un graphique remplacer toute explication, ni aboutir à cinquante cartes de 600 pixels de hauteur.

### 22.7 Contrats
```ts
type InsightPresentationPlan = {
  insightId: string;
  mode: "text" | "typographic" | "hybrid" | "hybrid_expanded";
  narrative: { titleClaimId: string; supportingClaimIds: string[]; conclusionClaimIds: string[];
               targetLength: "short" | "medium" | "long" };
  visual: { chartPlanId?: string; supportedClaimIds: string[];
            incrementalValue: "high" | "moderate" | "low" | "none"; reason: string;
            placement?: "after_title" | "between_evidence_and_conclusion" | "expandable_detail" };
  editorial: { canRenderWithoutChart: boolean; duplicatesNearbyVisualization: boolean; manuallyOverridden: boolean };
};

type InsightChartPlan = {
  id: string; insightId: string;
  purpose: "show_trend" | "show_stability" | "compare_periods" | "explain_change" | "show_composition"
         | "show_set_structure" | "show_timeline" | "show_plan_coverage" | "show_projection";
  templateId: string;
  data: { datasetRef: string; metricIds: string[]; dimensions: string[]; windowId: string;
          comparisonWindowId?: string; sourceEventIds: string[] };
  visualFocus: { claimIds: string[]; highlightPointIds?: string[]; referenceMetricId?: string; annotationIds?: string[] };
  presentation: { density: "compact" | "standard" | "expanded"; title: string; unit: string };
  validity: { status: "valid" | "partial" | "unavailable"; reason?: string };
};
```
Schémas de conception, non contrats existants. `chartPlanId` est **optionnel dès la conception** : le système n'est pas bâti autour de l'idée que toute carte a un graphique parfois masqué, mais autour de l'idée qu'une analyse peut être intrinsèquement textuelle. L'`InsightChartPlan` ne contient ni couleurs choisies par l'analyse ni données inventées pour le rendu : il porte l'intention, les références aux données et ce qu'il faut montrer ; le composant React récupère les valeurs validées et applique le thème. **Le choix de présentation ne change jamais la conclusion** : le PresentationPlanner ne raccourcit pas une analyse parce qu'elle est plus facile à représenter et ne supprime pas de preuve importante pour faire entrer un graphique.

Exemples : pompes inclinées = `show_stability`, évolution chronologique de huit séances, élément remarquable : six séances à 36, annotation : interruption de 42 jours, conclusion : consolidation du format. Programme à 56 % = `show_plan_coverage`, prévu/réalisé par groupe, données : version historique du programme et exercices réalisés, élément remarquable : jambes à zéro, conclusion : manque concentré sur un groupe.

### 22.8 Validation visuelle
Un graphique peut être trompeur tout en affichant des valeurs exactes : la validation visuelle est aussi importante que celle du texte.

| Règle | Pourquoi |
|---|---|
| Même périmètre que l'analyse | Pas de graphique sur 29 jours sous un titre de 30 jours |
| Même définition de métrique | Pas de reps GTG dans un graphique de musculation |
| Dates correctement représentées | Une interruption de 42 jours ne ressemble pas à une semaine |
| Zéro ≠ inconnu | Une nuit Garmin manquante n'est jamais tracée à zéro |
| Comparateurs cohérents | Définitions comparables entre périodes |
| Unités toujours identifiables | Reps, séries, kg, jours, heures, pourcentages |
| Échelle honnête | Pas d'exagération de petites différences |
| Projections visuellement distinctes | Une anticipation n'est pas confondue avec une donnée observée |
| Annotations justifiées | Les points remarquables correspondent à des preuves |
| Texte et graphique concordants | Le graphique ne suggère pas une conclusion opposée |

Conventions : barres comparatives généralement à partir de zéro ; courbe à échelle resserrée possible si l'échelle reste explicite ; données absentes = interruption ou état « inconnu », jamais valeur fictive ni interpolation silencieuse ; doubles axes verticaux fortement limités ; une comparaison mensuelle ne cache ni la durée différente des fenêtres ni un mois incomplet ; une analyse « Toujours » reposant sur huit séances connues montre ces huit séances, sans suggérer dix années continues ; deux exercices homonymes ne sont jamais mélangés sans preuve d'équivalence. Même rigueur de provenance que la conclusion.

### 22.9 Catalogue de composants
Six familles pour commencer, étendues ensuite :
| Composant | Couvre | Exemples Momentum |
|---|---|---|
| `TrendChart` | Évolution chronologique, maintien, baisse, reprise | Reps par séance, charges, durée du sommeil |
| `ComparisonChart` | Comparaisons de valeurs ou périodes | Avant/après, volume moyen, jours actifs |
| `CompositionChart` | Répartition et contributions | Exercices de poussée, familles musculaires |
| `SetStructureChart` | Détail du format d'un mouvement | 5×10 avant interruption contre 10-10-10-6 à la reprise |
| `TimelineChart` | Séquences, interruptions, événements | Blocs, reprises, jalons |
| `CoverageChart` | Prévu/réalisé | Exercices et muscles d'une journée de programme |

Plus tard : horaires de sommeil, calendriers d'activité, nuages de points pour analyses croisées, bandes de projection, trajectoires complexes. Les mêmes composants servent plusieurs catégories avec des données, annotations et conclusions différentes : Activité (comparaison, composition, série temporelle) ; Progression (courbe, structure des séries, avant/après) ; Sommeil (courbe, plages horaires, dispersion) ; Rythme (calendrier, frise, fréquence hebdomadaire) ; Répertoire (chronologie d'apparition, fréquences) ; Structure & répartition (répartition, contributions, comparaisons) ; Trajectoire & transitions (courbe chronologique, frise des phases) ; Programme & pratique réelle (matrice de couverture, prévu/réalisé).

### 22.10 Design system graphique
Un design system unique (composants réutilisables, règles visuelles) : cinquante graphiques très différents doivent appartenir visiblement au même produit ; on ne laisse pas chaque producteur choisir couleurs, marges et mise en page.
- **Hiérarchie** : titre de découverte → graphique → explication → conclusion ; ordinateur : texte et visuel côte à côte possible ; mobile : disposition verticale ; graphique assez grand pour être lisible, pas de mini-graphiques surchargés de labels dans une carte étroite.
- **Palette** cohérente avec le thème sombre actuel (accents bleus, turquoise, verts, violets), limitée : couleur principale (données de la carte), secondaire (comparateur), d'accent (valeur ou zone importante), neutres (références historiques), conventions pour prévu / réalisé / indisponible. **Le rouge n'est pas automatique pour une baisse** : une baisse de reps n'est pas toujours mauvaise ni une hausse toujours favorable ; les couleurs expriment la structure des données avant un jugement.
- **Grille et typographie** : tailles minimales, marges, espacements, hauteurs recommandées ; à éviter : axes illisibles, titres coupés, légendes multi-lignes écrasant le graphique, unités absentes, courbes envahissantes pour deux valeurs, dégradés excessifs, animations permanentes.
- **Annotations utiles**, reliées aux preuves (début de stabilisation, reprise après 42 jours), pas décoratives.

### 22.11 Composition de la page
Même avec d'excellents graphiques, quinze cartes hybrides consécutives créent une page désagréable : c'est un problème éditorial. L'onglet **Analyse** (découvrir et comprendre des conclusions, parfois accompagnées de graphiques) ne doit pas ressembler à l'onglet **Graphiques** (explorer directement les données). Après la sélection des analyses, le moteur considère l'ensemble de la page : répétition des formes graphiques, longueur des cartes voisines, rythme de lecture. Parfois il privilégie une version textuelle d'une même découverte plutôt que de répéter trois graphiques similaires, sans supprimer l'analyse ni dégrader sa conclusion. **La variété est favorisée, jamais fabriquée** : pas d'alternance mécanique (« deux textes puis un graphique » serait un quota déguisé) ; si cinq analyses successives exigent des visualisations différentes, on ne l'interdit pas ; si douze analyses sont meilleures en texte, on ne force pas un graphique. Ce critère reste secondaire par rapport à la pertinence. Exemple de rythme (maquette illustrative, ordre et formats non imposés) : texte, hybride, texte, typographique, texte.

### 22.12 Préférence d'affichage
Une préférence générale, sans réglage par catégorie : **Privilégier le texte** / **Équilibré** (texte et graphiques lorsque pertinents, préférence pour les hybrides de longueur moyenne) / **Plus visuel** (favoriser les graphiques utiles). **Équilibré par défaut.** Le réglage n'affecte ni les calculs, ni les découvertes disponibles, ni leur justesse, seulement leur présentation. Option discrète de masquer ou afficher le graphique dans le détail d'une carte hybride, jamais obligatoire pour consulter les analyses.

### 22.13 Bibliothèque technique et performance
**Base** (arbitrage de conception, à confirmer après audit du code existant ; React 18, Vite, Tailwind, sans service externe ni API payante) : auditer d'abord les graphiques et dépendances de l'onglet Graphiques et réemployer une bibliothèque satisfaisante plutôt qu'en ajouter une seconde ; sinon **Recharts** pour les graphiques classiques (composants React déclaratifs, courbes, barres, zones, références, responsive) ; **visx** en complément pour des visuels spécialisés ; **Apache ECharts** en alternative si besoins avancés ou graphiques denses ; **Vega-Lite** comme inspiration du plan déclaratif, pas à intégrer d'emblée. Pas trois bibliothèques dès le début. Une couche de composants Momentum (`MomentumTrendChart`, `MomentumComparisonChart`, `MomentumSetChart`…) isole le moteur d'analyse de la syntaxe de la bibliothèque : changer de bibliothèque conserve le contrat `InsightChartPlan`.

**Performance** : le coût de calcul, de préparation des données et de rendu sont séparés ; cinquante conclusions admissibles ne nécessitent pas cinquante visualisations interactives dans le DOM, et ce n'est pas une raison de limiter les analyses (0.1).
| Niveau | Comportement |
|---|---|
| Préparation | Faits, conclusions et plans visuels calculés et conservés |
| Affichage initial | Graphiques visibles rendus en priorité |
| Exploration | Autres graphiques rendus progressivement, à l'entrée dans la zone visible ou à l'ouverture |
Virtualisation des listes très longues ; cache des données préparées selon la version d'analyse, la période et les événements dont dépend le graphique ; **recalcul ciblé** (une série corrigée le 9 novembre met à jour les graphiques qui en dépendent, pas celui du sommeil de juin) ; animations limitées (transition lors d'un changement de période acceptable ; pas de cinquante graphiques animés à chaque ouverture).

### 22.14 Règles de composition V1 à V12
| Règle | Exigence |
|---|---|
| V1 — Pluralité | Trois formats natifs : textuel, typographique, hybride |
| V2 — Texte obligatoire | Toute analyse possède une conclusion rédigée, même avec un graphique |
| V3 — Graphique facultatif | La disponibilité d'un graphique ne déclenche pas son affichage |
| V4 — Priorité moyenne | Les analyses de longueur moyenne sont les candidates privilégiées, sans exclure courtes ou longues |
| V5 — Valeur visuelle | Le graphique facilite la compréhension d'une preuve, relation ou transformation |
| V6 — Complémentarité | Le graphique montre ; le texte interprète ; la conclusion explique la portée |
| V7 — Composition | Rythme visuel agréable, sans quota par format |
| V8 — Longues analyses | Intégration sélective, synthétique ou dépliable selon la fonction du graphique |
| V9 — Une découverte, plusieurs rendus | Changer de présentation ne crée pas de nouvelle analyse |
| V10 — Intégrité | Le choix de présentation ne modifie jamais faits ni conclusions |
| V11 — Préférences | Texte, équilibre ou plus visuel au choix de l'utilisateur |
| V12 — Accessibilité | Chaque graphique est compréhensible avec légende, contexte et alternative textuelle |

La longueur du texte n'est jamais une condition absolue ; les préférences d'affichage influencent la présentation, jamais les conclusions. L'ancienne exigence « toutes les analyses compatibles doivent obtenir un graphique » est **remplacée** par : toutes les analyses sont évaluées pour leur potentiel visuel, seules celles dont la compréhension est réellement améliorée en reçoivent un.

### 22.15 Évaluation et tests
**Critères d'un graphique** : exactitude (valeurs et comparaisons fidèles) ; pertinence (montre ce que la conclusion explique) ; lisibilité (unités, séries, références) ; esthétique (identité visuelle de Momentum) ; valeur ajoutée (apprend-on plus facilement qu'avec le texte seul ?). **Cohérence d'un récapitulatif** : quinze analyses avec le même histogramme deviennent monotones, mais on ne change pas artificiellement de type pour varier ; cinq courbes justifiées valent mieux qu'une courbe, un radar, un camembert et deux jauges mal adaptés. La diversité visuelle vient de la diversité réelle des conclusions.

**Mesure** : jamais le pourcentage de cartes avec graphique (le moteur l'optimiserait en ajoutant des histogrammes partout). On compare plusieurs versions d'une même analyse (textuelle vs hybride) pour savoir laquelle fait comprendre plus vite et plus justement la conclusion ; sur un récapitulatif entier, on évalue le plaisir de parcours, la distinction réelle des graphiques et la place laissée aux analyses textuelles ; on teste le mobile. Les variantes de rendu n'augmentent jamais le compteur d'analyses : cinquante découvertes restent cinquante.

**Jeu de visualisations de référence** (données et conclusions attendues) : six séances au même volume → stabilisation visible ; reprise après 42 jours → interruption visible sur une échelle temporelle adaptée ; volume mensuel en hausse à fréquence constante → deux composantes ; programme à 56 % → couverture réelle, pas une jauge ; charge augmentée à reps identiques → charge visible ; données Garmin manquantes → lacune, jamais zéro fictif ; projection conditionnelle → distinction nette observations/scénario ; deux exercices homonymes → courbes non mélangées sans preuve ; même analyse sur plusieurs fenêtres → mêmes faits, représentations compatibles ; écran mobile → aucun label ou point important illisible. Captures de référence à plusieurs largeurs, thème sombre et éventuellement clair. **Accessibilité** : description textuelle, valeurs consultables et navigation sans dépendre uniquement des couleurs ni du survol.

### 22.16 Plan d'implémentation visuel et difficulté
Ne pas demander « ajoute automatiquement un graphique à toutes les analyses » (beaucoup de graphiques, pas de bons graphiques).
| Phase | Contenu | Livrable |
|---|---|---|
| **V0** | Auditer les composants graphiques existants (bibliothèques, onglet Graphiques, formats de données, styles) | Choix d'une seule base graphique principale |
| **V1** | Trois premiers composants : courbe chronologique, barres comparatives, matrice prévu/réalisé | Graphiques conformes au design system, responsives, validables |
| **V2** | Équiper des analyses représentatives : pompes inclinées, reprise des pompes déclinées, juin–octobre, couverture du programme, un sommeil | Plusieurs phénomènes correctement représentés, sans génération arbitraire |
| **V3** | `PresentationPlanner`, `ChartPlanner` et `ChartValidator` | Une présentation et un graphique planifiés et validés sans choix manuel par carte |
| **V4** | Généraliser aux huit catégories (structures de séries, frises, compositions), équiper les détecteurs compatibles (19) | Nouvelles analyses équipées automatiquement à partir de leur conclusion structurée |
| **V5** | Affichage de dizaines d'analyses : chargement progressif, rendu différé, filtres, détail | Cinquante analyses accessibles sans encombrer ni ralentir la page |

Difficulté : afficher de belles courbes et histogrammes dans React (faible à modérée) ; design system de graphiques réutilisables et responsive (modérée) ; choisir automatiquement le graphique pertinent avec validation des preuves (**élevée**). Le vrai chantier n'est pas de dessiner, mais de comprendre ce que le graphique doit démontrer : d'où l'importance des phénomènes, conclusions structurées et de la provenance des données (P0, P6).

### 22.17 Articulation avec l'abondance analytique
Trente analyses pour Aujourd'hui ou cinquante pour Toujours ne signifient ni trente ni cinquante graphiques (0.1, 9.5). Le chantier visuel ne limite jamais l'admission ni l'accessibilité des analyses, et la richesse des analyses accessibles reste indépendante des limites de présentation immédiate (9.6). **Momentum varie la manière de raconter les découvertes sans jamais varier artificiellement leur contenu.**

### 22.18 Interaction : du graphique aux preuves

Au-delà du rendu, le graphique doit permettre de **passer de « je comprends la conclusion » à « je peux examiner les observations exactes qui la démontrent »**. Exemple : une analyse de reprise des pompes déclinées montre les répétitions par série avant et après interruption ; la sélection d'une barre (troisième série) ouvre le détail de la séance (date, exercice, répétitions, charge connue si elle existe).

Le contrat graphique prévoit **deux modes** :
- **Mode lecture** : visuel simple, propre, intégré à la carte ;
- **Mode exploration** : accès au détail, aux valeurs, aux séries et éventuellement à la séance source, ouvert au clic dans un détail ou une vue spécifique, **sans encombrer la carte principale**.

Trois jeux sont distingués : les **preuves essentielles** de la conclusion, le **jeu de données historique** qui les contextualise (ex. toutes les séances antérieures, pas seulement les six qui démontrent la stabilité) et les **annotations** retenues pour la visualisation ; tous proviennent de métriques ou d'événements validés mais ne sont pas nécessairement identiques. Les transformations nécessaires au rendu (agrégation, regroupement temporel, transformation visuelle) sont autorisées si elles reposent exclusivement sur les métriques canoniques, respectent leurs définitions et restent traçables ; le graphique ne produit aucune nouvelle vérité analytique concurrente. Accept. : graphique de séries → accès aux séances et séries sources lorsque disponibles ; accessibilité inchangée (valeurs consultables sans survol).

### 22.19 États visuels dégradés

`InsightChartPlan` (valide, partiel, indisponible) est complété par le comportement du graphique lorsque : l'espace est insuffisant sur mobile ; les labels deviennent trop nombreux ; des points partagent la même date ; les intervalles sont irréguliers ; plusieurs séries doivent être distinguées ; une partie des données est inconnue (lacune, jamais zéro, 2.9) ; le graphique est trop dense pour sa taille. Réponses prévues : **variante compacte**, regroupement de labels, **détail à la demande** (22.18), ou **repli sur une version textuelle**. Si le graphique ne peut pas être correctement rendu, l'analyse reste lisible et disponible : le graphique n'est jamais une condition de publication.

### 22.20 Instantané analytique commun et publication atomique

Le texte, les assertions (7.3), les métriques et le graphique d'une carte dépendent d'un **même instantané analytique**. Si une septième séance arrive pendant que le graphique se recalcule, la carte ne doit pas annoncer « six séances » à côté d'un graphique à sept points. Une nouvelle version de la carte n'est publiée que lorsque ses composants sont cohérents entre eux ; en cas d'échec du graphique, le texte reste accessible, mais le graphique n'est jamais mis à jour indépendamment de la conclusion qu'il accompagne. **Accept.** : texte, métriques et graphique correspondent au même instantané (12.6).
