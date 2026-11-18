# MOMENTUM — MISSION 1 : FONDATION CANONIQUE, REPRODUCTIBILITÉ ET VALIDATION P0/P1

## 1. Documents de référence et objectif

Prends connaissance intégralement des documents suivants :

- La spécification unifiée `Analyse spec complete`.
- `ARCHITECTURE-ONGLET-ANALYSE-MODULE-HAUT-2026-11-18.md` ou son équivalent actuel.
- Les documents existants dans `moteur analyse v2/analysis-engine/`.
- Les résultats et fichiers de l'implémentation P1 du 17 novembre.
- Les captures comparant mon navigateur normal et le Browser Tab de Cursor.

La spécification unifiée devient la référence normative du produit. Les anciens documents restent utiles pour comprendre l'architecture, les décisions passées et les régressions connues. Lorsqu'une ancienne règle est contredite par une décision explicitement tranchée dans la nouvelle spec, la nouvelle décision prévaut.

Ne recommence pas les travaux déjà correctement réalisés. Ne crée pas de nouvelles briques si les modules existants peuvent assumer leurs responsabilités.

Je veux une intervention pragmatique avec corrections effectives, tests, preuves et intégration réelle. Pas uniquement un audit, ni un rapport déclarant que plusieurs composants pourraient être développés ultérieurement.

La refonte doit constituer une évolution progressive et contrôlée du moteur actuel.

## 2. Priorité absolue : expliquer l'écart Chrome / Cursor Browser Tab

Le 18 novembre 2026, directement dans mon navigateur habituel, sur localhost:3001, j'obtiens pour les 7 jours du 12 au 18 novembre :

- 1 334 répétitions.
- 4 jours entraînés.
- 4 h 26 d'activité.
- 4 040 kg affichés.
- 3 703 kcal.
- Seulement 7 analyses : 5 Progression, 1 Sommeil, 1 Rythme.

Dans le Browser Tab de Cursor, sur localhost:3001, pour cette même fenêtre :

- 1 002 répétitions.
- 3 jours entraînés.
- 3 h 15 d'activité.
- 1 464 kg affichés.
- 3 162 kcal.
- 20 analyses : 4 Activité, 9 Progression, 2 Sommeil, 5 Rythme.

Les données sportives communes sont cohérentes. Mon navigateur possède notamment une séance supplémentaire le 17 novembre, de 332 répétitions.

Les exports/imports JSON fonctionnent correctement dans mon usage. Je ne demande pas une refonte des imports, de la synchronisation ni du système de sauvegarde. Je veux comprendre pourquoi, avec davantage de données, mon navigateur présente un pack bien plus pauvre.

Ne conclus pas automatiquement que la différence provient de cette séance supplémentaire. Ne suppose pas non plus que les deux environnements exécutent exactement la même version et possèdent les mêmes caches.

### 2.1. Identifier l'environnement réellement exécuté

Compare les deux environnements et rends exportables :

- URL et origin.
- Version effective du build et du moteur analytique.
- Version du Worker effectivement instancié.
- Version des contrats, producteurs et règles de sélection.
- Révision du snapshot réellement consommé.
- Identifiant du compte et du profil analytique.
- Configuration, flags et droits influençant le moteur.
- Langue et fuseau horaire.
- État de chargement des sources.
- État de l'hydratation IndexedDB.
- Cache mémoire et cache persistant.
- Version et état du service worker, lorsqu'il existe.
- Provenance du bundle publié : calcul frais ou cache, avec sa révision.
- Historique éditorial, signature précédente et état de la mémoire.
- Éventuel état des ressources Garmin, nutrition, questionnaires et programmes.

Les signatures doivent être suffisamment discriminantes : le nombre de répétitions et le nombre d'exercices ne constituent pas à eux seuls une empreinte fiable des données.

Vérifie que deux snapshots contenant les mêmes totaux, mais des exercices, séries, modalités de charge ou dates différents, ne peuvent pas partager abusivement une clé de cache.

Ne pars pas du principe que l'ouverture avec `npm run dev` crée un moteur différent : démontre le chemin réel.

### 2.2. Construire une comparaison contrôlée

Effectue les comparaisons suivantes :

A. Même snapshot complet, même configuration, même fenêtre, même version de moteur et même état éditorial dans les deux environnements.

B. Même snapshot, mais historique éditorial différent.

C. Même snapshot, mais passage du français à l'anglais.

D. Snapshot Cursor de 1 002 répétitions, puis ajout de la séance réelle de 332 répétitions, avec le reste strictement identique.

E. Même snapshot avec cache mémoire, cache IndexedDB puis calcul frais contrôlé.

F. Même snapshot avant et après rechargement de la page.

G. Même snapshot en chemin synchrone de référence, Worker et console diagnostic.

Utilise une fixture ou une copie isolée des données pour effectuer les expériences nécessitant une modification. Ne modifie pas mes données réelles pour les besoins du test.

Si mon navigateur personnel n'est pas accessible via tes outils, développe un export diagnostic que je pourrai déclencher moi-même et fournis les instructions exactes pour obtenir les deux dossiers comparables.

Ne présente pas une comparaison comme équivalente si tu ne peux pas vérifier ses entrées.

### 2.3. Comparer la totalité du pipeline

Pour chaque run, fournir :

1. Données normalisées consommées.
2. Mesures et preuves calculées.
3. Producteurs réellement exécutés.
4. Candidats bruts.
5. Candidats rejetés.
6. Conclusions distinctes.
7. Conclusions admissibles.
8. Décisions de déduplication.
9. Décisions de rivalité.
10. Décisions liées aux plafonds.
11. Effets de la mémoire éditoriale.
12. Pack accessible.
13. Pack prioritaire.
14. Pack réellement publié.
15. Cartes effectivement rendues dans le DOM.

Pour chacune des treize cartes d'écart, identifier la première étape où leurs chemins divergent.

Classer la différence :

- Donnée réellement différente.
- Producteur non exécuté.
- Identité non résolue.
- Métrique différente.
- Conclusion devenue invalide.
- Effet légitime du changement de période ou des données.
- Sélection trop restrictive.
- Pénalité d'historique.
- Divergence de version.
- Cache obsolète.
- Publication ou rendu incomplet.
- Autre cause démontrée.

Une carte ne doit pas être déclarée perdue simplement parce qu'elle a changé de titre.

### 2.4. Corriger la cause démontrée

Après identification de la cause, corrige-la à sa source et ajoute des tests permanents.

À instantané, règles, fenêtre et état éditorial identiques :

- Le moteur doit retrouver les mêmes conclusions.
- Le navigateur ou le chemin d'ouverture ne doit pas influencer l'intelligence analytique.
- La locale ne doit modifier que la présentation, sauf préférence explicitement documentée.
- Un cache exact doit restituer une édition identique au calcul correspondant.
- Une consultation ou un rechargement ne doit pas déclencher une nouvelle rotation.
- Le diagnostic doit pouvoir reproduire exactement une édition réellement publiée.

Des snapshots différents peuvent légitimement produire des packs différents. Le but n'est pas d'obtenir artificiellement 20 cartes dans les deux environnements, mais d'expliquer et d'éliminer toute perte injustifiée.

## 3. Confronter la spécification au code existant

Produis une matrice de correspondance couvrant toutes les sections de la specification, décisions tranchées incluses.

Pour chaque exigence, consigne :

- Référence précise de la spec.
- Composant actuel.
- Fonction réellement appelée.
- Statut : couvert, partiel, incorrect, absent, non vérifiable.
- Preuve disponible.
- Dépendance.
- Phase concernée.
- Modification prévue.
- Test d'acceptation.

Ne confonds jamais :

- Un fichier créé et un composant réellement branché.
- Un contrat déclaré et un contrat effectivement utilisé.
- Un test unitaire du composant et une validation du parcours réel.
- Un résultat fixture et une publication navigateur.
- Une option de configuration et son comportement par défaut en production.

Ne refais pas une cartographie descriptive de plusieurs centaines de lignes si elle n'apporte aucune décision technique supplémentaire.

## 4. Clôturer le socle P0

Étendre les briques existantes, notamment `recapMetricContract`, `recapPeriodMeasure`, `recapPeriodComparisons` et les resolveurs communs.

### 4.1. Vérité temporelle

Un seul contrat pour les huit plages :

- Aujourd'hui.
- 7 jours.
- 30 jours.
- 3 mois.
- 6 mois.
- 1 an.
- 2 ans.
- Toujours.

Les périodes en dates calendaires doivent respecter leurs bornes inclusives et le fuseau Europe/Paris.

L'architecture actuelle utilise des 24 heures glissantes pour Aujourd'hui alors que la spec introduit la notion de journée sportive. Identifier précisément ce conflit et faire valider la convention avant de modifier ce comportement si elle n'est pas déjà tranchée.

Traiter :

- Journée partielle.
- Séances traversant minuit.
- Changements d'heure.
- Comparaisons de fenêtres de même longueur.
- Mois partiels.
- Historique incomplet.
- Couverture effective de chaque source.
- Dates de début réellement documentées pour Toujours.

« Toujours » doit disposer d'un bandeau, de métriques et de cartes cohérents. Supprimer tout début artificiel fixé à plusieurs années en arrière lorsqu'aucune donnée n'en justifie l'existence.

### 4.2. Vérité des métriques

Définir des MetricFacts versionnés comportant au minimum :

- Identifiant de métrique.
- Définition.
- Valeur et unité.
- Fenêtre.
- Population.
- Canal sportif.
- Événements sources.
- Politique d'inclusion et d'exclusion.
- Couverture.
- Méthode de calcul.
- Version.
- Limites.
- Référence à l'instantané.

Calendrier, bandeau Analyse, cartes, diagnostic, distinctions et futurs graphiques doivent consommer ces faits ou leurs agrégations compatibles.

Traiter les contradictions observées le 18 novembre :

- Best streak de 5 contre 2 jours sur 7 jours.
- Best streak de 6 contre 5 sur 30 jours.
- Série annuelle de 0 malgré un mois contenant 6 jours consécutifs.
- Durée de 9 min contre 3 h 15 sur 7 jours.
- Durée de 58 min contre 15 h 21 sur 30 jours.
- Données mensuelles et données de fenêtre mélangées.
- Classements de meilleurs mois partiels présentés comme mois complets.
- Tonnage et modalités de charge.
- Totaux concernant des populations différentes de celles des dénominateurs.

Ne force pas deux valeurs distinctes à être égales si elles mesurent des choses différentes. Réconcilie les événements et rends la définition explicite dans l'interface.

Séparer strictement jours actifs, jours de musculation classique, séances, jours GTG, cardio, jours prévus et réalisés.

GTG isolé comptablement : aucune répétition GTG dans les métriques de musculation classique. Le contexte GTG transversal reste facultatif et désactivé par défaut, conformément à la spec.

### 4.3. Identités, séries et résistances

- Identité source conservée.
- Identité canonique démontrée.
- Traçabilité des aliases et reverse-hashes.
- Aucune fusion par simple homonymie.
- Aucun exercice inventé.
- Aucune transformation d'un dip classique en dip lesté.
- Aucune publication de « exercice 301 », « exercice 504 » ou d'un mouvement anonyme lorsque l'identité est indispensable.
- Distinction poids de corps, lest, assistance, charge totale et charge par haltère.
- Vérification des séries réellement saisies.
- Aucun format uniforme annoncé si les séries sont différentes.
- Agrégations compatibles possibles lorsqu'un événement est fiable malgré une identité partiellement inconnue.

Mesurer les découvertes perdues par défaut d'identité et rechercher les informations permettant de les récupérer, sans inventer d'équivalence.

### 4.4. Couverture et provenance

Créer ou consolider une carte de couverture par source, métrique et intervalle.

Distinguer :

- Disponible et exploitable.
- Partiellement disponible.
- Inconnu.
- Invalide.
- Présent mais inadéquat pour la question.

Ne jamais convertir une donnée manquante en zéro.

Ne jamais utiliser les répétitions comme substitut du RPE absent.

Apparier les nuits Garmin aux séances selon leur chronologie réelle. Dédupliquer les activités présentes dans plusieurs sources uniquement lorsque leur identité commune est établie.

Ne pas considérer une absence d'enregistrement comme preuve d'inactivité réelle.

## 5. Commencer l'historisation irréversible

Vérifie les possibilités existantes avant d'ajouter de nouveaux mécanismes.

Momentum doit pouvoir conserver :

- Les versions immuables de programmes.
- Les prescriptions applicables à une séance.
- Les déplacements, reports et substitutions documentées.
- Les versions historiques des objectifs explicitement déclarés.
- La date réelle de l'événement.
- La date à laquelle Momentum a connu l'événement.
- L'historique des corrections et suppressions.

Distinguer `eventTime`, `knownAt`, `knowledgeCutoff` et version de l'événement.

Prévoir deux modes de lecture :

- Rétrospectif selon les connaissances actuelles.
- Simulation historique selon les seules données connues à la date simulée.

Ne fabrique aucune date de connaissance pour des données historiques lorsque celle-ci est inconnue.

Ne présente pas le programme actuel comme un programme historiquement prouvé.

Toute évolution du stockage doit préserver intégralement les garanties actuelles de conservation durable des données, d'import/export, d'isolation des comptes, de récupération et de synchronisation.

Aucune migration destructive. Aucun effacement de mes données, caches sportifs ou historiques sans autorisation explicite. Les tests potentiellement destructifs s'exécutent sur des copies isolées.

Ne perturbe pas le chantier parallèle concernant la réactivité et la sauvegarde durable de Momentum.

## 6. Précision des contrats techniques

Produire un contrat technique compact, normatif, associé à des schémas et validations exécutables.

Préparer les interfaces suivantes en réutilisant les composants existants :

- Event.
- MetricFact.
- MetricAssertion.
- AnalyticalClaim.
- SessionWorkProfile.
- TrainingTrajectoryProfile.
- MuscleExposureLedger.
- Phenomenon.
- Discovery.
- AnalysisEdition.
- DetectorContract.

Ne crée pas des objets purement décoratifs. Chaque contrat doit avoir un consommateur réel ou une dépendance future clairement identifiée.

Séparer :

- Fait observé.
- Calcul.
- Interprétation descriptive.
- Implication sportive.
- Projection conditionnelle.
- Conseil.
- Présentation.

Définir une politique `ComparisonPolicyRegistry` versionnée.

Chaque comparaison doit expliciter :

- Unité d'observation.
- Population.
- Comparateur.
- Couverture.
- Taille des échantillons.
- Dispersion.
- Comparabilité mécanique.
- Chevauchement éventuel.
- Données manquantes.
- Qualification autorisée.
- Limites de la conclusion.

Ne pas imposer un seuil universel à toutes les familles. Les critères doivent être justifiés et calibrés sur des cas de référence, incluant des exemples où le moteur doit s'abstenir.

## 7. Consolider P1, déjà implémentée

Les jeux A/B/C existent déjà, avec 40 tests annoncés réussis. Ne les recrée pas.

Inspecter notamment :

- `evaluationTypes.js`
- `gameAAccuracy.js`
- `gameBDiscoveryQuality.js`
- `gameCCollectiveQuality.js`
- `underutilizationAnalysis.js`
- `compareEngineVersions.js`
- `replayTestDoubles.js`

Vérifie que l'évaluation peut consommer les véritables sorties du moteur, pas seulement des objets synthétiques produits par les adaptateurs de test.

Les résultats du moteur lui-même ne doivent jamais constituer automatiquement leur propre vérité attendue.

Conserver les baselines historiques B0/B1 sans les réécrire rétroactivement.

Créer une nouvelle baseline versionnée correspondant au moteur effectivement exécuté, si nécessaire.

Maintenir la séparation entre :

- Cas de conception.
- Cas de généralisation jamais utilisés pour régler les règles.
- Cas réels.
- Cas synthétiques contrôlés.
- Références éditoriales indépendantes.

Évaluer indépendamment : exactitude, qualité des découvertes, redondance, couverture, contradictions, nouveauté utile, fausse nouveauté, stabilité des éditions, révision après correction, perte éditoriale et sous-exploration.

Les 40 tests verts de l'évaluateur ne constituent pas une preuve que le moteur lui-même satisfait ces exigences.

## 8. Performance et reproductibilité

Préparer dès maintenant :

- Un instantané analytique partagé.
- Des index réutilisables par révision.
- La mutualisation des mesures communes.
- Des signatures discriminantes.
- Des éditions persistantes.
- L'annulation des calculs obsolètes.
- Une gestion bornée du coût mémoire.
- La priorité de la fenêtre demandée.

Un changement de période ou d'onglet ne déclenche jamais de recalcul analytique lourd si une édition exacte et valide existe.

Ne pas lancer huit calculs non mutualisés concurrents sur l'ordinateur de l'utilisateur.

L'optimisation ne doit jamais supprimer des découvertes ni utiliser une analyse obsolète en guise de résultat courant.

Mesure les temps froids, mémoire chaude, cache IndexedDB après reload, latence du clic, premier affichage cohérent, disponibilité définitive, Long Tasks, CPU et mémoire.

Cibles initiales : clic pris en compte sous 100 ms, cache mémoire visant 200 ms, navigation sans gel perceptible. Rapporter les résultats réels et non les cibles comme étant atteintes.

## 9. Console et dossier de preuve

Étendre l'export d'investigation existant pour comparer :

- Chrome et Cursor.
- Deux snapshots.
- Deux versions moteur.
- Deux périodes.
- Pack diagnostic et édition réellement publiée.

Chaque export doit contenir les entrées, versions, signatures, décisions, candidats, révisions, résultats de validation et correspondances DOM nécessaires à la reproduction.

Ne pas exporter de secrets, tokens ou identifiants d'authentification.

Une comparaison partielle doit être explicitement marquée comme telle.

## 10. Documentation et clôture de cette mission

Conserver une seule source normative par concept. Réutiliser la documentation v2 existante.

Mettre à jour ou créer uniquement si absent :

- `SPECIFICATION_UNIFIEE.md`
- `CONTRATS_TECHNIQUES.md`
- `MATRICE_SPEC_CODE.md`
- `METRIC_REGISTRY.md`
- `TEMPORAL_POLICY.md`
- `EVALUATION_PROTOCOL.md`
- `IMPLEMENTATION_PROGRESS.md`
- `REGRESSION_CASES.md`
- `PERFORMANCE_BASELINE.md`

Effectuer une recette des huit périodes sur les données réelles en lecture seule lorsque la session le permet, avec preuve des métriques, cartes, compteurs et timings.

Le rapport final de cette mission doit distinguer :

- Défaut démontré.
- Cause.
- Correction.
- Composant réellement branché.
- Test.
- Résultat fixture.
- Résultat navigateur.
- Limite restante.

Priorité absolue : comprendre le 7 contre 20 et garantir la reproductibilité.

Ne démarre pas la refonte profonde des détecteurs avant que les contrats bloquants soient correctement établis et que les jeux P1 soient raccordés au moteur réel.

Ne crée pas de commit Git sans autorisation.

Arrêt pour validation humaine après la mission 1. 