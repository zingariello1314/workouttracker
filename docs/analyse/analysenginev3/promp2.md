# MOMENTUM — MISSION 2 : INTELLIGENCE ANALYTIQUE, MÉMOIRE, TEMPORALITÉ ET PROFONDEUR

## 1. Reprise du chantier

Relis la spécification unifiée, la matrice spec/code, les contrats techniques et les résultats de la mission 1.

Cette mission correspond principalement aux parcours P2 et P3, avec les fondations de cohérence nécessaires dès maintenant.

Ne repars pas dans un audit général. Utilise les acquis du moteur existant : trajectoires d'exercices, pipeline composé, comparaisons historiques, ledger musculaire, producteurs spécialisés, contrats de phénomène, mémoire éditoriale et Worker.

Les anciennes briques doivent être réutilisées lorsqu'elles remplissent correctement leur rôle. Les nouvelles doivent résoudre une responsabilité réellement manquante.

L'objectif n'est pas de multiplier les templates. L'objectif est que Momentum sache chercher, comprendre, démontrer et expliquer des découvertes de plus grande valeur.

## 2. Transformer progressivement le pipeline

Distinguer réellement les niveaux suivants :

1. Événement source.
2. Fait calculé.
3. Phénomène observé.
4. Découverte analytique.
5. Implication sportive.
6. Présentation.

Un phénomène ne constitue pas automatiquement une découverte. Une nouvelle phrase ne constitue pas automatiquement une nouvelle analyse.

Le pipeline cible est :

Faits canoniques → profils partagés → détection → approfondissement → thèse → assertions et preuves → admissibilité → cohérence → classement → présentation → publication.

La rédaction intervient après l'établissement de la thèse. Elle n'a jamais pour mission d'inventer le sens d'une série de chiffres.

Chaque Discovery doit notamment documenter :

- Identité stable du phénomène.
- Identité de la conclusion.
- Sujet.
- Thèse centrale.
- Faits principaux et contextuels.
- Hypothèses examinées.
- Mécanisme établi ou non établi.
- Comparateurs.
- Portée.
- Limites.
- Niveau de profondeur.
- Niveau éditorial.
- Producteur.
- Horizons admissibles.
- Évolution par rapport à l'interprétation précédente.

Un champ `analyticalReading` ou `temporalPlans` renseigné mais jamais consommé n'est pas une livraison fonctionnelle.

## 3. Premier parcours vertical : consolidation d'un exercice

Implémente et valide le détecteur `exercise_format_consolidation` à partir des capacités de trajectoire existantes.

Il doit fonctionner pour tous les exercices compatibles, pas uniquement les pompes inclinées de mon historique.

### 3.1. Recherche analytique

Examiner :

- Premières références fiables.
- Évolution chronologique.
- Séries et répétitions par série.
- Répétitions par séance.
- Modalités de résistance.
- Niveau habituel.
- Dispersion.
- Fréquence d'exposition.
- Variations entre séances.
- Interruptions.
- Niveau retrouvé après reprise.
- Éventuelle évolution du programme.
- Comparateurs historiques pertinents.

Distinguer record ponctuel, amélioration, confirmation, consolidation, maintien, recul, reprise et changement de phase.

Une stabilité après une progression peut être une découverte importante. Une stabilité ordinaire sans événement ni contexte particulier peut seulement constituer un repère secondaire.

Ne pas confondre volume de répétitions stable et stagnation physiologique.

### 3.2. Référence éditoriale

L'exemple de la spec opposant les premières séances à 30 puis 20 répétitions aux six suivantes à 36 répétitions doit servir de cas de conception.

Le moteur doit comprendre que le phénomène intéressant peut être la transformation d'un volume variable en niveau régulièrement retrouvé, notamment lorsqu'une interruption significative est suivie d'une reprise comparable.

Vérifie les données réellement disponibles avant de reproduire les chiffres ou la durée d'interruption de cet exemple.

Ne pas coder les nombres de cet exemple comme des conditions universelles.

Teste la généralisation sur d'autres exercices, avec :

- Des séries irrégulières.
- Des expositions plus rares.
- Une progression de charge.
- Un total stable malgré un changement de format.
- Un record isolé.
- Une longue interruption.
- Une identité ambiguë.
- Un historique insuffisant.

### 3.3. Résultat attendu

La sortie doit être utilisable par le Worker, la sélection, la console, la rédaction et la future visualisation.

L'ancienne carte ne doit pas être conservée en doublon de la nouvelle lorsqu'elles racontent exactement la même conclusion.

D'autres conclusions indépendantes concernant cet exercice doivent rester admissibles.

## 4. Construire la mémoire analytique véritable

Faire évoluer les briques existantes vers les responsabilités prévues par la spec :

### PhenomenonRegistry

Conserve les phénomènes, leurs preuves, leurs états, leurs mécanismes, leur évolution, leurs limitations et leurs dépendances.

### PublicationLedger

Conserve les conclusions déjà publiées, leurs versions, leurs dates, leurs horizons et leur contexte de publication.

### ExposureLedger

Distingue une analyse produite, accessible, effectivement présentée et ouverte ou développée par l'utilisateur.

Le simple fait de générer une carte en arrière-plan ne signifie pas que l'utilisateur l'a vue.

Enregistrement local, minimal, isolé par profil, sans suivi intrusif.

### EditorialFeedbackLedger

Permet un retour explicite et facultatif sur l'intérêt, la répétition, le manque de profondeur ou une erreur.

Le feedback ne change jamais les faits. Il peut influencer les prochaines décisions éditoriales.

Un signalement d'erreur ouvre une investigation de fiabilité.

### AnalysisEdition

Représente un ensemble cohérent et figé de découvertes, de décisions et de présentations pour :

- Profil.
- Fenêtre.
- Version des données.
- Version du moteur et des règles.
- État éditorial applicable.

La consultation d'une édition ne modifie pas instantanément son classement.

La mémoire influence une prochaine édition légitimement déclenchée, pas chaque rechargement.

Le diagnostic et les calculs expérimentaux ne doivent pas enregistrer de fausses publications ou expositions.

## 5. Cycle de vie et rotation

Intégrer réellement `recapEditorialLifecycle` et les marqueurs nécessaires dans les producteurs.

La nouveauté ne doit plus être déterminée principalement par le titre, le kind ou le nombre de jours écoulés.

Utiliser une évolution sémantique de la conclusion :

- `new`
- `confirmed`
- `refined`
- `revised`
- `contradicted`
- `unchanged`

Distinguer solidité croissante et nouveauté informative.

Exemple : une septième séance à 36 répétitions peut renforcer la confiance dans une consolidation existante sans produire une nouvelle découverte principale.

Inversement, une reprise après une interruption ou une progression de résistance peut modifier substantiellement la portée d'un phénomène ancien.

### Cas impératif

Une séance ponctuelle à 112 répétitions ne doit pas monopoliser les analyses principales pendant six jours simplement parce qu'elle reste présente dans la fenêtre de sept jours.

Le système doit pouvoir :

- Mettre à jour la preuve.
- Réduire sa priorité si la découverte a déjà été expliquée.
- Chercher de nouvelles conclusions admissibles.
- Maintenir l'ancienne conclusion accessible tant qu'elle est valide dans la vue.
- La rendre historique lorsqu'elle n'appartient plus au périmètre courant.
- La faire revenir au premier plan lorsqu'un nouvel événement change véritablement sa portée.

Ne pas remplacer ce problème par une durée de vie arbitraire et universelle.

Une transformation importante de six mois peut rester pertinente longtemps.

Une petite observation quotidienne peut perdre rapidement son intérêt.

Lorsque rien de nouveau n'est démontré, maintenir une édition stable et permettre l'exploration d'autres conclusions valides. Ne pas fabriquer de nouveauté.

Conserver les anciennes découvertes de manière persistante ou reconstructible à partir de leurs preuves et versions, sans accumuler indéfiniment des copies intégrales des mêmes snapshots et textes.

## 6. Déduplication par conclusion

Cette exigence remplace toute fusion systématique par phénomène.

Deux analyses portant sur le même exercice ou le même phénomène peuvent coexister uniquement si leur conclusion centrale et leur valeur informative sont différentes.

Distinguer :

- Même conclusion, formulation différente.
- Même conclusion, preuves complémentaires.
- Conclusions complémentaires.
- Conclusions indépendantes.
- Contradiction apparente.
- Contradiction réelle.

Exemples :

- « Volume +25 % » et « Tu réalises désormais davantage de répétitions » : doublon potentiel.
- « Un format se consolide » et « Ce mouvement retrouve une place régulière dans ton répertoire » : conclusions potentiellement complémentaires.
- « Les répétitions baissent » et « La résistance augmente » : constats compatibles si les preuves et périmètres sont corrects.

Construire les liens typés `supports`, `refines`, `updates`, `supersedes`, `contradicts` et `related_to`.

Une ancienne conclusion remplacée ne doit pas rester présentée comme vérité actuelle.

Ne jamais fusionner des exercices homonymes sur la seule base de leur nom.

## 7. Transformer réellement les huit horizons

Brancher `recapTemporalStrategy` et les plans de comparaison dans les producteurs, pas uniquement dans les métadonnées du rapport.

Chaque horizon possède une stratégie de recherche propre.

### Aujourd'hui

Analyser la séance ou la journée sportive selon la convention validée :

- Composition.
- Particularités.
- Résistance.
- Formats.
- Écart à l'habitude.
- Événements réellement survenus.
- Programme applicable.
- Contexte pertinent.

Distinguer journée en cours, séance terminée et journée clôturée.

Ne pas remplir une journée vide avec des records vieux de plusieurs mois présentés comme actualité.

### 7 jours

Rechercher l'organisation récente :

- Rythme.
- Répartition.
- Variations entre séances.
- Changements survenus cette semaine.
- Niveau récemment reproduit.
- Comparaison avec une semaine comparable.
- Reprises et transformations ayant un ancrage réel dans la fenêtre.

Un contexte historique peut expliquer une découverte récente. Il ne doit jamais se substituer à cette découverte.

### 30 jours

Rechercher les évolutions qui commencent à se consolider :

- Fréquence.
- Contenu des séances.
- Séries.
- Répétitions par série.
- Charges.
- Interruptions.
- Rôle des exercices.
- Répartition.
- Changements d'habitudes.

### 3 mois

Rechercher installation de nouveaux formats, disparition ou retour d'exercices, phases, changements de structure et ruptures.

### 6 mois

Envisager plusieurs découpages :

- Deux trimestres.
- Trois blocs de deux mois.
- Évolution mensuelle continue.
- Premier mois contre dernier mois.
- Avant et après une interruption.
- Avant et après une modification de programme.
- Phases détectées dans les données.

Choisir la stratégie selon sa pertinence, sa comparabilité, sa couverture et sa robustesse.

Examiner les périodes intermédiaires avant de tirer une conclusion sur la trajectoire.

### 1 an, 2 ans et Toujours

Rechercher :

- Transformations durables.
- Phases historiques.
- Grandes interruptions.
- Reprises.
- Évolution du répertoire.
- Changements de modalités de travail.
- Contrastes entre périodes longues et récentes.

Lorsque deux fenêtres contiennent essentiellement les mêmes événements, ne pas produire artificiellement deux histoires différentes.

Le moteur doit pouvoir expliquer ce que l'élargissement de la fenêtre ajoute réellement et, lorsque nécessaire, reconnaître qu'il n'apporte pas de nouvelles données pour une métrique donnée.

### Règles communes

Chaque analyse doit séparer :

- Fenêtre principale.
- Fenêtre de comparaison.
- Contexte historique.
- Dates exactes des preuves.
- Période d'observation du phénomène.

La pertinence temporelle doit être une propriété structurée, vérifiable et indépendante d'expressions comme « cette année » ou « aujourd'hui ».

Ne pas utiliser de pénalités textuelles comme substitut à un véritable contrôle de périmètre.

## 8. Calibrer les stratégies de comparaison

Mettre en œuvre progressivement le `ComparisonPolicyRegistry` défini lors de la première mission.

Distinguer les classes de raisonnement :

- Décomposition déterministe.
- Comparaison descriptive.
- Association exploratoire.
- Projection.

Prévoir des règles propres à chaque classe.

Éviter :

- Sélection du comparateur produisant le plus grand pourcentage.
- Comparaisons sur des populations incompatibles.
- Double utilisation des mêmes observations dans deux groupes supposés indépendants.
- Assimilation d'une série à une séance indépendante.
- Surinterprétation de petits échantillons.
- Confusion entre moyenne, médiane, niveau habituel et maximum.
- Inflation des résultats lors de nombreuses recherches de relations.

Calibrer les critères à partir de cas positifs et négatifs, de tailles d'échantillons différentes, et de variations normales propres aux mouvements.

Enregistrer la méthode, le comparateur, les autres stratégies examinées, les motifs de rejet et le degré de solidité.

Une relation exploratoire ne peut être qualifiée de durable sans confirmation indépendante.

Ne pas fabriquer de seuil arbitraire simplement parce qu'il obtient un meilleur résultat sur mes exemples particuliers.

## 9. Approfondissement des phénomènes : P3

Construire un raisonnement capable d'examiner plusieurs mécanismes candidats avant de décider de ce qu'une évolution signifie.

### 9.1. Volume et fréquence

Pour une variation du volume, rechercher :

- Variation des jours actifs.
- Variation du nombre réel de séances.
- Variation du volume par journée ou séance.
- Nombre d'exercices.
- Nombre de séries.
- Répétitions par série.
- Changements de résistance documentés.
- Évolution de la composition du travail.
- Contribution des différentes familles musculaires.

Utiliser une décomposition mathématiquement justifiée.

Si plusieurs composantes évoluent, ne pas attribuer artificiellement un pourcentage précis à chacune sans méthode valide.

### 9.2. Arcs historiques

Exploration du cas juin → septembre → octobre :

- Fréquence et volume.
- Contenu moyen des journées actives.
- Mois intermédiaires.
- Composition des exercices.
- Séries et résistances lorsque disponibles.
- Nouvelle organisation éventuelle du travail.

Vérifier les totaux hors GTG avant toute publication.

La conclusion doit expliquer la transformation du travail, pas juxtaposer trois statistiques mensuelles.

### 9.3. Exercices

Étendre les producteurs actuels pour détecter :

- Ajout de séries.
- Hausse ou baisse des répétitions par série.
- Reproduction d'un format.
- Progression de résistance.
- Réapparition après interruption.
- Retour partiel ou complet au niveau antérieur.
- Redistribution vers d'autres mouvements.
- Variation de fréquence.
- Changement de rôle dans l'entraînement.
- Recul local ou partagé lorsque des témoins réellement comparables existent.

Pour les pompes déclinées et les hyperextensions, reprendre l'esprit des exemples éditoriaux fournis par l'utilisateur.

Je veux comprendre précisément pourquoi une évolution se produit, quel paramètre a changé, ce qui reste stable et ce que cela signifie pour le suivi de cet exercice.

Ne jamais recopier les chiffres illustratifs si les événements réels ne les démontrent pas.

### 9.4. Structure musculaire

Construire ou consolider le `MuscleExposureLedger` commun.

Distinguer :

- Travail direct.
- Sollicitation secondaire.
- Association à une famille.
- Nombre de séances d'exposition.
- Séries documentées.
- Contributions conventionnelles en répétitions.

Ne pas traiter une répartition en répétitions comme une mesure exacte du stimulus musculaire.

## 10. Catalogue de détecteurs et exploration multi-passes

Créer un registre versionné des raisonnements réellement disponibles.

Chaque détecteur doit documenter :

- Identifiant.
- Version.
- Domaine.
- Classe de raisonnement.
- Entrées.
- Sources nécessaires.
- Couverture minimale.
- Conditions d'applicabilité.
- Comparateurs.
- Hypothèses.
- Approfondissements possibles.
- Conclusions autorisées et interdites.
- Critères d'intérêt.
- Identité sémantique.
- Politique de rotation.
- Conditions de réouverture.
- Tests positifs et négatifs.
- Coût mesuré.

Organiser l'exploration en quatre passes :

1. Phénomènes évidents.
2. Approfondissement.
3. Relations transversales.
4. Recherche d'angles insuffisamment explorés.

Ne pas s'arrêter parce qu'une colonne ou une catégorie a atteint son plafond.

L'exploration doit poursuivre les raisonnements qui peuvent apporter une conclusion distincte et pertinente.

En revanche, borner la recherche ouverte selon son coût et son utilité marginale. Ne pas promettre une exhaustivité impossible de toutes les relations mathématiquement envisageables.

Un domaine applicable non exploré doit avoir un motif explicite.

Une période riche contenant peu de découvertes doit déclencher un diagnostic de sous-exploration, pas un remplissage artificiel.

Préparer l'emplacement architectural de l'`AnalyticalHypothesisPlanner`, sans obligation de lancer un modèle de langage à cette étape.

## 11. Rédaction et contrôles dès les premiers parcours

Ne pas attendre P6 pour commencer la validation.

Chaque nouveau parcours doit disposer :

- D'assertions structurées.
- D'un contrôle des contradictions.
- D'une validation des preuves.
- D'une validation du texte final.
- D'une langue française naturelle et grammaticalement correcte.

La carte doit apporter une idée centrale précise, démontrée par des chiffres, et expliquer sa portée.

Éliminer notamment :

- Accords fautifs.
- Identifiants bruts.
- Codes internes.
- Tautologies.
- Faux synonymes d'exercices.
- Contradictions entre titre et corps.
- Chiffres sans dénominateur.
- Conclusions plus fortes que les preuves.
- Conseils génériques.
- Formulations qui décrivent une méthode de calcul sans rien apprendre sur l'entraînement.

Une analyse peut être courte si la découverte le justifie. Elle doit pouvoir être longue lorsque son raisonnement mérite d'être développé.

## 12. Évaluation indépendante et arrêt

Faire tourner les nouveaux parcours en shadow mode sur les mêmes snapshots que le moteur actuel.

Utiliser les jeux A/B/C existants, les compléter et conserver un corpus de généralisation indépendant.

Évaluer :

- Justesse de chaque affirmation.
- Qualité des découvertes.
- Valeur du mécanisme expliqué.
- Profondeur utile.
- Pertinence temporelle.
- Redondance inter-horizons.
- Rotation chronologique.
- Révision après correction.
- Couverture analytique.
- Conclusions manquées.
- Perte éditoriale.
- Durée de calcul et consommation mémoire.

Tester les séquences historiques sans fuite d'information future.

Comparer des textes complets entre ancien et nouveau moteur, sur les mêmes données.

Ne pas valider la mission uniquement parce que le nombre de cartes augmente ou que les scores internes s'améliorent.

Produire des exemples réels détaillés dans chacune des huit périodes et indiquer quelles découvertes ont été activées, lesquelles restent expérimentales, et pourquoi.

Mettre à jour les documents de référence et le catalogue des détecteurs.

Ne pas commencer une refonte globale du programme ou des graphiques automatiques tant que ces premiers parcours n'ont pas démontré leur qualité.

Aucun commit Git. Aucune modification destructive des données utilisateur.

Arrêt pour validation humaine. 