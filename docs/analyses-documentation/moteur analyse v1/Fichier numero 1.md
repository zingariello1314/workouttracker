# MOMENTUM SPORT — FINALISATION DU MOTEUR D'ANALYSE V1   01/11/2026 01:24
## F1 — Audit transversal de profondeur, cohérence et qualité réelle

### CONTEXTE

Nous avons terminé les phases P0, E0 et P3.0 à P3.6 sur leurs périmètres respectifs.

L'architecture actuelle repose sur un pipeline unique :

`getRecapDateWindow → buildAdaptiveRecapInsights → buildComposedInterpretationPipeline → buildPeriodDiscoveryBundle → selectPeriodDiscoveriesWithTrace (E0) → buildHorizonEssayCandidates → renderInterpretations → selectNarrativeColumns → UI Recap`

Cette chaîne est à vérifier dans le code actuel, sans considérer le rapport d'architecture comme une preuve suffisante.

Les modules P3.0–P3.6 ont apporté des garanties méthodologiques importantes, mais le résultat final reste insuffisant en profondeur, en sélection, en cohérence temporelle et en qualité rédactionnelle.

Nous lançons une mission de finalisation V1 en sept lots :

- F1 : audit transversal.
- F2 : contrats de données et de temps.
- F3 : raisonnement approfondi.
- F4 : narration et présentation.
- F5 : sélection éditoriale E0.
- F6 : performance et fraîcheur.
- F7 : recette finale.

**Tu dois exécuter uniquement F1.**

Aucune implémentation des lots suivants n'est autorisée à ce stade.

### CONTRAINTES ABSOLUES

- Aucun commit Git.
- Aucune modification fonctionnelle du moteur.
- Aucune refonte UI.
- Aucun chantier de fluidité.
- Aucun nouveau kind de découverte.
- Aucun ajustement de score E0.
- Aucun changement de formulation en production.
- Aucun ajout de cache.
- Aucun changement des phases P0–P3.6.

Tu peux créer des scripts d'audit, des tests non invasifs et de la documentation si nécessaire, mais ils ne doivent pas modifier le comportement du produit.

Ne te contente pas de lire les README et les anciens rapports : **le code actuel est la source de vérité**.

---

# 1. OBJECTIF DE F1

Nous voulons comprendre précisément pourquoi un moteur disposant d'autant de données, de producteurs et de découvertes produit encore des analyses parfois superficielles, répétitives, mal contextualisées ou peu intéressantes.

L'objectif est de cartographier :

1. Ce que le moteur sait réellement.
2. Ce qu'il calcule déjà.
3. Ce qu'il pourrait déduire des données disponibles.
4. Ce qu'il ne peut pas déduire honnêtement.
5. Ce qu'il publie aujourd'hui.
6. Ce qu'il devrait sélectionner ou rejeter.
7. Ce qui empêche la production d'analyses approfondies.
8. Les corrections nécessaires, classées par lot F2–F7.

Il ne faut pas présupposer que tout nécessite un nouveau moteur ou de nouvelles familles.

---

# 2. INVENTAIRE EXHAUSTIF DES PRODUCTEURS

Inspecte le code de :

- `recapPeriodDiscoveries.js`
- `recapAdaptiveInsights.js`
- `recapInterpretationPipeline.js`
- `recapHorizonEssays.js`
- `interpretationRenderer.js`
- `recapDiscoveryContentClass.js`
- `recapInsightNature.js`
- `recapProgramAdherenceProgression.js`
- `recapProgramAdherenceDiscoveries.js`
- `recapMuscleP32b*.js`
- `recapP35*.js`
- `recapP36*.js`
- `AnalysisEngineConsole.jsx`
- `RecapAnalyseView.jsx`
- `RecapAnalyseDetails.jsx`

Et tous les producteurs réellement appelés dans le pipeline, même s'ils ne figurent pas dans cette liste.

Pour chaque kind, documente :

- Identifiant exact.
- Famille.
- Producteur.
- Sources consommées.
- Périodes autorisées.
- Fenêtre principale.
- Fenêtres de comparaison.
- Granularité des données.
- Métriques calculées.
- Critères de production.
- Critères d'abstention.
- Niveau de preuve.
- Contenu des champs `evidence` et `metrics`.
- Nature (`now`, `trajectory`, `journey`).
- `contentClass`.
- Rivaux E0.
- Score / valeur informative.
- Chemin vers le rendu final.
- Exemples réels.
- Limites connues.

Fournir une matrice exhaustive, pas seulement une sélection de familles.

Identifier les kinds morts, jamais atteignables, redondants ou présents uniquement dans la documentation.

---

# 3. AUDIT DES DONNÉES ET DES RAISONNEMENTS POSSIBLES

Pour chaque grande famille analytique, établir une matrice :

**Données brutes → métriques existantes → raisonnements existants → raisonnements possibles → données manquantes → risques méthodologiques.**

Étudier notamment :

### Musculation

- Séries individuelles.
- Répétitions par série.
- Total par séance.
- Charge.
- Nombre de séries.
- Variantes d'exercices.
- Fréquence.
- Trajectoires.
- Progression.
- Régression.
- Plateau.
- Fluctuation.
- Retour après interruption.
- Stabilité.
- Exercices témoins.
- Répartition du travail.
- Comparaison au programme.

### GTG

- Répartition par journée.
- Passages.
- Répétitions.
- Exercices.
- Coexistence avec les séances classiques.
- Continuité.
- Progression du volume.
- Habitudes.
- Limites de l'historique des créneaux.

### Endurance

- Distance.
- Durée.
- Vitesse.
- Fréquence cardiaque lorsqu'elle est disponible.
- Fréquence des sorties.
- Trajectoires.
- Régularité.
- Comparabilité des séances.
- Origine Garmin ou manuelle.
- Risques de double comptage.

### Sommeil

- Nuit datée.
- Date de rattachement.
- Durée.
- Horaires.
- Stades lorsque disponibles.
- Tendances.
- Variabilité.
- Relations observationnelles avec l'entraînement.
- Couverture.
- Absence de causalité démontrée.

### Programme

- Versions.
- Snapshots.
- Journées prévues.
- Journées réalisées.
- Adaptations.
- Écarts.
- Changements de structure.
- Assiduité démontrable.
- Limites de reconstruction historique.

### Autres sources

- Pas.
- Mensurations.
- Poids.
- Calories.
- Nutrition si réellement intégrée au moteur.
- Feedback.
- Ressenti.
- Données Garmin.
- Toute autre source détectée dans le code.

Ne pas présenter comme exploitable une donnée qui n'est pas effectivement accessible au pipeline.

---

# 4. AUDIT DE PROFONDEUR : NOS DEUX ANALYSES DE RÉFÉRENCE

Ces deux exemples sont fictifs et servent à définir le niveau de raisonnement attendu.

## Exemple A — Pompes déclinées

« Sur les 30 derniers jours, tes performances en pompes déclinées sont passées de 36 répétitions par séance à 19, soit une baisse de 47 % en cinq séances successives. Cette diminution vient principalement d'une baisse des répétitions par série, alors que tu conserves tes 3 séries. Sur la même période, tes pompes classiques restent autour de 60 répétitions par séance et tes dips autour de 36 : tes performances sur les autres mouvements de poussée sont donc stables. Le recul est concentré sur les pompes déclinées, plutôt que sur l'ensemble de ton entraînement du haut du corps.

Tu réalises désormais presque deux fois moins de répétitions sur cette variante qu'au début du mois. Plutôt que d'augmenter sa difficulté, conserve les mêmes conditions d'exécution et cherche d'abord à retrouver un volume stable autour de 30 répétitions par séance. Tu pourras ensuite augmenter progressivement ce volume. L'objectif est de repartir d'un niveau que tu maîtrises, sans confondre l'augmentation générale de ton activité avec une progression sur cet exercice précis. »

## Exemple B — Hyperextensions

« Les hyperextensions s'installent dans ton entraînement.

Tu es passé de 3 séries de 12 répétitions à 4 séries de 12, soit une hausse de 33 % du volume par séance. Tu as ensuite maintenu ce nouveau format sur les deux séances suivantes : tu ne t'es donc pas contenté d'augmenter ponctuellement ton travail, tu as reproduit ce volume sur plusieurs entraînements.

Cette évolution constitue une progression du travail réalisé sur les hyperextensions. En augmentant le nombre de séries, tu exposes tes lombaires à davantage de répétitions, ce qui contribue à développer leur capacité à supporter ce travail, à condition que l'exécution reste maîtrisée et que la récupération suive.

Au total, tu as effectué 96 répétitions sur les 30 derniers jours, contre aucune enregistrée sur les 30 jours précédents. L'introduction de cet exercice est donc une réussite sur le plan de l'assiduité et du volume réalisé : tu l'as intégré à ta pratique et tu as maintenu le format augmenté sur les séances suivantes. L'enjeu maintenant est de conserver cette régularité et de poursuivre ta progression sans augmenter le volume au détriment de la qualité d'exécution. »

Attention : les chiffres sont fictifs et peuvent comporter des incohérences internes. Ne pas les reprendre comme données réelles ni comme calculs de référence. L'exemple B, notamment, contient un total de 96 répétitions incompatible avec trois séances complètes à 4 × 12.

Ce qui nous intéresse est la structure du raisonnement.

### Pour chaque exemple, répondre :

1. Quelles données précises sont nécessaires ?
2. Les avons-nous déjà ?
3. Où sont-elles stockées ?
4. Sont-elles réellement accessibles au moteur ?
5. Quels calculs existent déjà ?
6. Quelles opérations de raisonnement manquent ?
7. Quel producteur pourrait les exploiter ?
8. Quelle preuve faudrait-il pour publier la conclusion ?
9. Quelles formulations seraient interdites faute de preuve ?
10. Quel effort de développement serait nécessaire ?

Distinguer strictement :

- Progression du volume réalisé.
- Progression de performance.
- Adaptation physiologique supposée.
- Changement de programme.
- Changement des conditions d'exécution.
- Continuité ou simple événement ponctuel.

Ne pas inventer de mécanisme causal.

---

# 5. AUDIT DES PÉRIODES ET COMPARAISONS

Examiner toutes les périodes :

- Aujourd'hui.
- 7 jours.
- 30 jours.
- 3 mois.
- 6 mois.
- 1 an.
- 2 ans.
- Toujours.

Vérifier ce que la console expose réellement et ce que le moteur sait calculer.

Pour chaque kind :

- La période sélectionnée est-elle le sujet principal ?
- Pourquoi utilise-t-il une autre période ?
- La comparaison est-elle nécessaire ?
- La période de référence est-elle comparable ?
- La fenêtre précédente de même durée serait-elle plus pertinente ?
- Une comparaison par séances équivalentes serait-elle meilleure ?
- Une référence historique plus ancienne est-elle réellement justifiée ?
- La carte mélange-t-elle plusieurs échelles sans nécessité ?

Identifier tous les producteurs qui introduisent systématiquement « 30 jours », « trimestre » ou d'autres fenêtres fixes, même lorsque l'utilisateur consulte 7 jours.

Ne pas conclure qu'une comparaison extérieure est mauvaise simplement parce qu'elle dépasse la fenêtre sélectionnée : juger sa fonction réelle.

### Sommeil

Auditer spécialement les expressions :

- « La nuit associée ».
- « La nuit précédente ».
- « Les nuits récentes ».
- Toute nuit non datée.

Déterminer :

- Date exacte de chaque nuit.
- Convention de rattachement.
- Inclusion dans la fenêtre sélectionnée.
- Risques de décalage.
- Politique d'abstention lorsqu'une nuit est hors période.
- Cas des analyses multi-nuits.

Notre objectif : aucune découverte sur une nuit hors de la période concernée, et une date explicite pour chaque nuit ou groupe de nuits évoqué.

---

# 6. AUDIT DES CONTRATS DE DONNÉES

Rechercher les incohérences de vocabulaire et de calcul.

Exemples :

- Jour entraîné.
- Jour actif.
- Séance classique.
- Jour GTG.
- Jour endurance.
- Jour avec activité quelconque.
- Répétitions classiques exclusives.
- Répétitions GTG synchronisées.
- Répétitions complémentaires.
- Isométriques.
- Volume pondéré.
- Volume brut.
- Exposition musculaire.

Vérifier si plusieurs producteurs utilisent des définitions différentes sous le même libellé.

Comparer notamment les nombres de jours entraînés entre les cartes.

Pour chaque contradiction potentielle :

- Identifier les deux calculs.
- Expliquer la différence.
- Dire si elle est légitime.
- Proposer le libellé ou le contrat à harmoniser.

Ne pas corriger pendant F1.

---

# 7. AUDIT ÉDITORIAL DES CARTES RÉELLES

Rejouer le moteur sur le profil live connecté si accessible, en distinguant clairement live, fixture et guest.

Analyser les périodes disponibles, notamment 7j, 30j et 3m.

Pour chaque carte affichée, évaluer :

- Exactitude.
- Intérêt réel.
- Profondeur.
- Pertinence de la période.
- Valeur de la comparaison.
- Originalité.
- Redondance.
- Clarté.
- Naturel de la rédaction.
- Qualité de la conclusion.
- Qualité éventuelle du conseil.

Repérer explicitement :

- Statistiques banales promues en découvertes.
- Meilleures séries sans intérêt particulier.
- Comparaisons tautologiques.
- Analyses longues sans raisonnement supplémentaire.
- Chiffres juxtaposés.
- Conclusions disproportionnées.
- Conseils non fondés.
- Textes techniques.
- Erreurs grammaticales.
- Dates brutes.
- Formulations répétitives.
- Informations intéressantes rejetées.

### Exemples observés sur 7 jours

- « Meilleure série observée : 12 tractions australiennes ».
- « Ces 7 jours devient un nouveau point d'ancrage ».
- « Ton entraînement actuel [...] devient identifiable par son profil ».
- Comparaisons à 30 jours ou au trimestre sans justification claire.
- « La nuit associée » sans date.
- Retours d'exercices dont la pertinence éditoriale reste faible.

Ne pas supposer que ces cartes sont incorrectes parce qu'elles nous déplaisent : examiner les données et le raisonnement réel.

Mais ne pas les considérer intéressantes simplement parce qu'elles passent les tests.

---

# 8. AUDIT DE LA SÉLECTION E0 ET DES COLONNES

Examiner :

- Pool brut.
- Candidats éligibles.
- Candidats déclassés.
- Candidats rivaux.
- Candidats retenus E0.
- Candidats transformés en essais.
- Candidats finalement affichés.
- Éventuels sauvetages de familles.
- Rotation.
- Caps.
- Scores.
- Valeur informative.
- Répartition des horizons.

Il faut distinguer les différents niveaux du pipeline.

Identifier les cas où :

- Une carte faible gagne contre une carte plus profonde.
- Deux cartes racontent la même histoire.
- Une famille prend trop de place.
- Une carte méthodologique est présentée comme une découverte.
- Un candidat pertinent disparaît après E0.
- Une transformation narrative dégrade une bonne découverte.
- Le titre et le corps ne racontent pas exactement la même chose.

Fournir pour chaque cas important une trace permettant de comprendre à quelle étape le résultat apparaît.

Ne pas modifier les scores pendant F1.

---

# 9. AUDIT DES FORMATS ET DE LA COLORATION

Examiner la chaîne complète :

`métrique → discovery → essay → rendu → JSX`

Déterminer où sont générés et affichés :

- Dates.
- Durées.
- Heures et minutes.
- Valeurs.
- Pourcentages.
- Noms d'exercices.
- Unités.
- Segments colorés.

### Dates

Objectif utilisateur : `01 novembre 2026`, et non `2026-11-01`.

Rechercher les dates ISO visibles, y compris dans les corps de cartes et les footers.

### Durées

Pour `7 h 42`, le nombre `42` doit pouvoir être coloré au même titre que `7`.

### Exercices

Lorsqu'une donnée est mise en évidence, la valeur numérique et le nom de l'exercice doivent être colorables ensemble.

### Architecture

Vérifier si la coloration repose sur des regex, des chaînes enrichies ou des segments structurés.

Proposer une solution centralisée robuste, mais ne pas l'implémenter.

---

# 10. AUDIT DE PERFORMANCE — OBSERVATION SEULEMENT

Le diagnostic précédent a montré environ 13 secondes de temps total, dont une grande partie dans l'adaptatif.

Cette mesure ne suffit pas à établir le temps réellement perçu par l'utilisateur.

Identifier :

- Temps du moteur métier.
- Temps de la console.
- Coût des producteurs.
- Coût E0.
- Coût des essais.
- Coût des colonnes.
- Recalculs répétés.
- Points de cache existants.
- Risques d'analyses périmées.

Ne pas optimiser pendant F1.

Produire une carte des coûts et un protocole de mesure pour F6.

---

# 11. LIVRABLES OBLIGATOIRES

Créer dans `docs/analyses-documentation/` :

### A. Rapport principal F1

Audit complet de l'architecture et du fonctionnement réel.

### B. Registre exhaustif des kinds

Une ligne par kind, avec producteur, sources, période, métriques, preuves, publication, rivalités et rendu.

### C. Matrice des capacités de raisonnement

Pour chaque famille :

- Déjà disponible.
- Partiellement disponible.
- Possible avec les données existantes.
- Nécessite de nouvelles données.
- Non démontrable.

### D. Catalogue des défauts

Chaque défaut doit comporter :

- Identifiant.
- Gravité.
- Reproduction.
- Cause probable.
- Code concerné.
- Impact utilisateur.
- Lot de correction recommandé.

### E. Audit des cartes réelles

Textes exacts, métriques, sélection, problèmes et alternatives.

### F. Feuille de route F2–F7

Dépendances, priorités, risques, critères d'acceptation.

---

# 12. CRITÈRES DE FIN DE F1

F1 est terminé uniquement si :

1. Tous les producteurs atteignables sont inventoriés.
2. Les kinds sont reliés aux données et aux métriques.
3. Les capacités de raisonnement manquantes sont identifiées.
4. Les comparaisons temporelles sont auditées.
5. Les contradictions de dénominateurs sont documentées.
6. Les textes faibles sont expliqués par leur origine.
7. Les décisions E0 et post-E0 sont traçables.
8. Les formats de dates et de couleurs sont localisés.
9. Les coûts de calcul sont cartographiés.
10. Le plan F2–F7 est fondé sur les résultats du code réel.
11. Aucun comportement fonctionnel n'a été modifié.
12. Aucun commit Git n'a été effectué.

### CONSIGNE FINALE

**Ne code pas les solutions pendant cet audit.**

Nous voulons d'abord savoir exactement ce qui existe, ce qui manque et pourquoi le moteur actuel n'atteint pas encore le niveau d'analyse attendu.

À la fin, remets-moi un rapport détaillé et vérifiable. Nous examinerons F1 avant d'autoriser F2.
