# MISSION — CRÉER UNE CONSOLE DE DIAGNOSTIC COMPLÈTE DU MOTEUR D'ANALYSE DE MOMENTUM SPORT

## Objectif

Je veux pouvoir comprendre précisément comment fonctionne mon moteur d'analyse, depuis les données brutes disponibles jusqu'aux analyses finales affichées dans Momentum Sport.

Je veux une véritable page de diagnostic développeur, utilisable dans mon application en local, qui me permette d'inspecter les données, le pipeline, les calculs, les corrélations, les conclusions générées, les analyses rejetées, les règles de sélection et la qualité des textes.

Le but n'est pas de créer un simple tableau de bord avec quelques compteurs. Je veux pouvoir identifier concrètement pourquoi le moteur produit une bonne analyse, pourquoi il en produit une mauvaise, pourquoi il n'en produit aucune et à quel endroit une information utile est perdue.

## 1. Commencer par auditer le moteur réel

Avant de modifier le code :

- Inspecte l'architecture actuelle et identifie le véritable parcours d'exécution de l'onglet Analyse.
- Identifie les producteurs de données, les moteurs de calcul, les générateurs de candidats, les systèmes de sélection, les filtres éditoriaux et les composants qui affichent les résultats.
- Vérifie quels modules sont réellement appelés à l'exécution. Ne déduis pas leur rôle uniquement de leur nom.
- Repère les données qui existent réellement, celles qui sont accessibles dans la session actuelle et celles qui ne sont pas disponibles.
- Réutilise les fonctions, types et mécanismes existants lorsqu'ils sont adaptés.
- Identifie les endroits où les informations intermédiaires sont actuellement perdues.

Le travail doit s'appuyer sur le code réellement exécuté, pas uniquement sur les documents d'architecture.

## 2. Créer une page de diagnostic dédiée

Crée une route ou une page de développement dédiée, par exemple `/dev/analysis-engine`, en respectant les conventions du projet.

Elle doit être accessible facilement en local, et doit etre visible uniquemen tpa rmoi .

Prévois une navigation claire entre les modules suivants :

### A. Vue d'ensemble

Afficher notamment :

- période d'analyse sélectionnée ;
- état et disponibilité des sources de données ;
- nombre de signaux détectés ;
- nombre de conclusions candidates générées ;
- nombre de conclusions retenues ;
- nombre de conclusions affichées ;
- nombre de candidats rejetés ;
- durée d'exécution par étape ;
- avertissements, erreurs et données manquantes.

Tous les compteurs doivent provenir de l'exécution réelle. Ne simule aucune donnée de diagnostic.

### B. Pipeline d'exécution

Représente les étapes réelles du pipeline dans leur ordre d'exécution.

Pour chaque étape, affiche :

- son nom ;
- sa fonction et son module source ;
- ses entrées utiles ;
- ses sorties utiles ;
- son nombre d'éléments entrants et sortants ;
- sa durée, si elle est mesurable ;
- ses avertissements et erreurs ;
- les informations qu'elle a supprimées, transformées ou ajoutées.

Permets de sélectionner une étape et d'inspecter ses données intermédiaires.

Ne présente jamais une étape comme exécutée si elle ne l'a pas été. Si une étape est court-circuitée ou n'est pas applicable, indique-le explicitement.

### C. Inspecteur de données

Permets d'inspecter les données réellement exploitées par le moteur :

- séances prévues et réalisées ;
- exercices et variantes ;
- séries, répétitions, charges et performances ;
- assiduité et taux de complétion ;
- fréquence et volume d'entraînement ;
- GTG, y compris les cas non planifiés ;
- sommeil et récupération, si disponibles ;
- poids, IMC et autres mensurations réellement enregistrés ;
- données temporelles et historique disponible.

Pour chaque donnée, affiche sa provenance, sa période, son statut de validité et la raison éventuelle de son exclusion.

Respecte la confidentialité des données. Cette console est un outil local de développement et ne doit pas transmettre ces données à un service externe.

### D. Inspecteur des signaux et corrélations

Je veux voir quels signaux sont détectés, quelles relations sont réellement calculées et quelles conclusions peuvent en découler.

Pour chaque signal ou corrélation, affiche :

- les données sources ;
- les mesures utilisées ;
- la formule ou la fonction de calcul, si applicable ;
- les valeurs intermédiaires ;
- le résultat obtenu ;
- les conditions ou seuils déclenchés ;
- la période de comparaison ;
- le niveau de confiance et ses justifications, lorsqu'ils existent ;
- les limites d'interprétation.

Distingue impérativement :

1. une corrélation effectivement calculée ;
2. une piste de corrélation qui n'a pas été calculée ;
3. une corrélation impossible à évaluer faute de données ;
4. une relation calculée mais jugée insuffisamment fiable.

Ne prétends pas qu'une corrélation a été examinée si le code ne l'a pas effectivement calculée.

### E. Registre de tous les candidats

Conserve une trace inspectable des analyses candidates produites avant la sélection finale.

Pour chaque candidat, affiche :

- identifiant stable ;
- type et famille ;
- titre et texte générés ;
- période concernée ;
- mesures et preuves associées ;
- fonctions responsables de sa génération ;
- score et priorité réellement utilisés ;
- statut final ;
- étapes franchies ;
- transformations subies ;
- raison de sa sélection ou de son rejet.

Les candidats rejetés doivent rester inspectables, même s'ils ne sont jamais affichés à l'utilisateur.

### F. Centre des rejets

Crée une vue spécifique des candidats éliminés ou dégradés.

Distingue autant que possible :

- données insuffisantes ;
- condition de génération non remplie ;
- seuil non atteint ;
- doublon sémantique ;
- limite par famille ;
- priorité trop faible ;
- conflit avec une autre conclusion ;
- filtre éditorial ;
- validation échouée ;
- erreur technique ;
- candidat jamais généré alors qu'un signal source semblait exploitable.

Pour chaque rejet, expose la règle réellement responsable et les éléments qui permettent de la vérifier.

Si le système actuel ne conserve pas cette information, ajoute une instrumentation au point de décision. Ne fabrique pas rétroactivement une raison de rejet à partir du seul résultat final.

Distingue aussi « candidat rejeté » et « analyse qui n'a jamais été générée ».

### G. Inspecteur de rédaction

Pour chaque texte affiché, permets de remonter :

- aux affirmations qui le composent ;
- aux preuves associées à chaque affirmation ;
- aux calculs qui justifient ces preuves ;
- aux fonctions qui ont produit le texte ;
- aux règles éditoriales appliquées ;
- aux éventuelles reformulations ou suppressions ;
- aux avertissements sur les affirmations vagues, non étayées ou contradictoires.

Je veux notamment pouvoir identifier les formulations qui disent à l'utilisateur ce que Momentum devrait examiner, au lieu de fournir une conclusion calculée à partir des données existantes.

Ne présente pas une affirmation comme démontrée si elle n'a pas de preuve traçable.

### H. Performance et erreurs

Expose les temps d'exécution mesurables, les étapes coûteuses, les exceptions et les avertissements.

Évite de collecter des métriques coûteuses en permanence si une instrumentation légère suffit. Prévois, si nécessaire, un mode de diagnostic approfondi activable uniquement à la demande.

## 3. Instrumenter le pipeline réel

Ajoute une couche d'observabilité adaptée à l'architecture existante.

Elle doit permettre de relier les données sources, les signaux, les calculs, les candidats, les décisions de sélection et les textes finaux.

Privilégie des identifiants stables et des références vers les données sources plutôt que de dupliquer massivement les données.

L'instrumentation doit :

- être déterministe autant que possible ;
- rester légère en mode normal ;
- pouvoir être activée en mode diagnostic ;
- éviter de modifier les résultats de l'analyse ;
- ne pas créer de dépendance à un LLM ou à un service payant ;
- ne pas introduire de migration destructive ;
- respecter les règles existantes de stockage et de confidentialité.

Le mode diagnostic ne doit pas produire artificiellement de meilleures analyses que le mode normal. Il doit observer le même pipeline et les mêmes décisions.

## 4. Ajouter des outils de comparaison et de reproduction

Je veux pouvoir :

- sélectionner une période : 7 jours, 30 jours, 3 mois, 6 mois, 1 an et historique complet, selon les périodes déjà prises en charge ;
- relancer l'analyse sur la période choisie ;
- comparer les résultats de deux périodes ;
- comparer deux versions du moteur sur un même jeu de données lorsque cela est techniquement possible ;
- exporter un rapport de diagnostic lisible ;
- copier les informations techniques utiles pour un futur débogage.

Les relances doivent utiliser les données réelles disponibles. Toute limite ou différence entre les données historiques et la session actuelle doit être signalée.

## 5. Contrôles spécifiques de qualité analytique

Je veux pouvoir repérer :

- les conclusions qui se limitent à paraphraser des statistiques ;
- les corrélations pertinentes non exploitées ;
- les conclusions sans preuves ;
- les analyses redondantes ;
- les contradictions entre deux analyses ;
- les conclusions trop générales par rapport aux données disponibles ;
- les erreurs de période et de comparaison ;
- les analyses pertinentes éliminées par les règles de sélection ;
- les familles d'analyses sous-représentées ;
- les analyses qui n'apparaissent pas faute de données, en distinguant ce cas d'un défaut du moteur.

Ne te contente pas de compter les textes qui contiennent certaines expressions. Utilise aussi les preuves, les relations entre candidats et les décisions du pipeline pour expliquer les défauts.

## 6. Interface

Je veux une interface dense mais lisible, destinée au développement.

Prévois notamment :

- des tableaux filtrables et triables ;
- des panneaux de détail ;
- des sections repliables ;
- une recherche par identifiant, famille, fonction ou texte ;
- des filtres par période, statut, famille et étape ;
- une navigation depuis une analyse finale jusqu'à ses preuves et à son historique d'exécution.

Privilégie la clarté et la traçabilité plutôt que les animations ou une refonte esthétique.

## 7. Tests et validation

Ajoute des tests pour vérifier :

- que les compteurs correspondent au pipeline réel ;
- que les candidats rejetés sont accompagnés de raisons traçables lorsque celles-ci peuvent être instrumentées ;
- que les étapes non exécutées ne sont pas présentées comme exécutées ;
- que les liens entre conclusions et preuves sont conservés ;
- que l'activation du diagnostic ne change pas les résultats métier ;
- que les données manquantes sont distinguées des défauts de génération ;
- que la désactivation du mode diagnostic n'introduit pas de régression.

Teste également les périodes courtes et longues, les données vides, les historiques incomplets et les cas où plusieurs analyses se concurrencent.

## 8. Autonomie et livrable

Travaille de manière autonome. Inspecte le projet, prends les décisions techniques raisonnables et réalise l'implémentation sans me demander de valider chaque petite étape.

Ne t'arrête pas à un plan ou à une maquette : je veux une page réellement fonctionnelle branchée sur le moteur existant.

Ne refonds pas l'application entière. N'efface pas les analyses existantes. Ne remplace pas le moteur métier par une simulation ou un système parallèle.

Ne fais aucun commit sans ma demande.

À la fin, fournis un rapport qui précise :

1. les fichiers créés et modifiés ;
2. le parcours réel du pipeline découvert ;
3. les informations désormais inspectables ;
4. les limites qui restent, avec leurs causes exactes ;
5. les tests exécutés et leurs résultats ;
6. les premiers problèmes du moteur révélés par la console ;
7. les prochaines corrections prioritaires justifiées par les données observées.

**Critère de réussite principal :** je dois pouvoir ouvrir la page, sélectionner une analyse affichée, remonter à ses données et à ses calculs, comprendre comment elle a été construite, puis identifier pourquoi une autre analyse utile a été rejetée ou n'a jamais été générée.
