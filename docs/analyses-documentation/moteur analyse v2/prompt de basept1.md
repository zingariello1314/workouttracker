# MOMENTUM SPORT — CONSOLIDATION STRUCTURELLE DU MOTEUR D'ANALYSE

## MISSION : CONSTRUIRE UN MOTEUR ANALYTIQUE PROFOND, COHÉRENT, ÉVOLUTIF ET DURABLEMENT FIABLE

Tu dois maintenant entreprendre une consolidation structurelle du moteur Sport → Récap → Analyse de Momentum Sport.

Cette mission découle de plusieurs mois d'audits, de correctifs, de rapports contradictoires et d'observations dans l'application réelle.

L'objectif n'est pas de réaliser une nouvelle série de corrections ponctuelles, ni de créer encore davantage de détecteurs sans justification.

**L'objectif est d'obtenir un système capable de produire, maintenir, réévaluer, hiérarchiser et publier les meilleures interprétations possibles de l'historique sportif de l'utilisateur, pour chacune des huit périodes proposées.**

Ce système doit être ambitieux sur la profondeur et sur la quantité de découvertes réellement utiles.

Il doit être extrêmement exigeant sur la vérité des données, la qualité du raisonnement, la grammaire française, la pertinence temporelle, la non-redondance et la cohérence globale.

Il doit également devenir beaucoup plus difficile de réintroduire un ancien défaut lors d'une nouvelle correction.

### Principe fondamental

Il ne suffit plus de calculer correctement des statistiques.

Le moteur doit savoir :

- identifier les phénomènes réellement significatifs ;
- choisir les comparaisons temporelles qui permettent de les comprendre ;
- analyser les séries, les séances, les exercices et les périodes ;
- confronter les observations entre elles ;
- expliquer les évolutions mesurables ;
- distinguer les faits prouvés des interprétations incertaines ;
- reconnaître les trajectoires, les phases, les ruptures et les consolidations ;
- identifier les découvertes déjà communiquées ;
- déterminer si une découverte mérite encore d'être montrée ;
- conserver les découvertes solides non sélectionnées ;
- les réévaluer lorsque les données ou le contexte changent ;
- produire une rédaction naturelle, précise et substantielle ;
- choisir les meilleures analyses à publier sans quotas arbitraires ;
- rendre les décisions vérifiables dans la console de développement.

Il doit pouvoir afficher beaucoup d'analyses lorsque les données le justifient.

**Si 30 analyses distinctes, fiables, approfondies et réellement utiles peuvent être produites sur sept jours, il ne faut pas en supprimer arbitrairement 20.**

Inversement, si une période ne justifie que trois analyses, il ne faut pas en inventer quinze.

Le nombre doit résulter de la valeur des découvertes, et non d'un quota choisi à l'avance.

---

# 0. INSTRUCTIONS ABSOLUES

Avant de modifier le code :

1. Lis les documents existants concernant l'architecture du moteur.
2. Lis ton rapport « Vérification contradictoire — Détection vs raisonnement » du 4 novembre 2026.
3. Inspecte les implémentations réelles et leurs appels.
4. Identifie ce qui fonctionne déjà.
5. Identifie ce qui existe mais ne s'applique qu'à certains producteurs.
6. Identifie ce qui existe mais perd lors de la sélection.
7. Identifie les défauts réellement démontrés.
8. Distingue les fonctionnalités absentes des fonctionnalités simplement mal exploitées.

**N'effectue pas une refonte intégrale sous prétexte de construire une meilleure architecture.**

Préserve et améliore les capacités utiles existantes.

Modules à examiner notamment :

- `recapInterpretationPipeline.js`
- `recapComposedEvidence.js`
- `recapComposedNarration.js`
- `exerciseTrajectoryAnalysis.js`
- `exerciseSessionSetsResolver.js`
- `recapPhenomenonContract.js`
- `recapPeriodSelection.js`
- `recapEditorialSelection.js`
- `recapEditorialIdentity.js`
- `recapVolumeQuestion.js`
- `recapReasoning.js`
- `recapPersonalBaselines.js`
- `athleteJourney.js`
- `athleteTrainingIdentity.js`
- `insightNoveltyEngine.js`
- `recapAdaptiveWorkerContract.js`
- les modules de données, de cache, de programmes, de publications et de console réellement utilisés.

Cette liste ne prétend pas être exhaustive.

Ne présume pas qu'un fichier est actif parce qu'il existe : vérifie ses appels, son chemin d'exécution et sa contribution au DOM.

Aucun commit Git sans autorisation.

Aucune altération destructive des données utilisateur.

Aucun contournement de l'authentification.

Aucune nouvelle dépendance majeure ou utilisation obligatoire d'un LLM sans justification technique précise.

Ne te contente pas de rédiger un plan : réalise les modifications nécessaires dans le périmètre accessible, teste-les et documente-les.

---

# 1. CRÉER UNE MÉMOIRE TECHNIQUE ET FONCTIONNELLE PERMANENTE

C'est une obligation majeure de cette mission.

Nous avons déjà consacré énormément de temps à des défauts corrigés puis réapparus.

Je veux que les exigences, les décisions, les causes racines et les garanties attendues soient conservées dans le dépôt.

Ces documents doivent être réellement utiles pour les prochaines sessions Cursor.

## 1.1 Organisation documentaire

Inspecte d'abord les dossiers de documentation existants.

Réutilise une structure adaptée si elle existe déjà, plutôt que d'en créer une deuxième.

À défaut, crée :

`docs/momentum/analysis-engine/`

Avec les fichiers suivants.

### `README.md`

Document d'entrée, concis.

Contient :

- vision du moteur ;
- objectifs ;
- architecture actuelle ;
- navigation vers les documents ;
- emplacement des modules ;
- état général de la consolidation ;
- ordre de lecture conseillé pour toute nouvelle session.

### `ARCHITECTURE_AND_CONTRACTS.md`

Source de vérité de l'architecture.

Contient :

- pipeline réel ;
- responsabilités des modules ;
- contrats de données ;
- identités ;
- granularités ;
- métriques canoniques ;
- distinction signal / phénomène / analyse / publication ;
- dépendances ;
- invariants ;
- règles de validation.

Distingue explicitement l'architecture implémentée de l'architecture projetée.

### `ANALYTICAL_QUALITY_STANDARD.md`

Définition normative d'une bonne analyse.

Contient les critères de :

- vérité ;
- profondeur ;
- précision ;
- contexte historique ;
- qualité temporelle ;
- pertinence ;
- nouveauté ;
- complémentarité ;
- implication ;
- rédaction ;
- limites ;
- cohérence entre cartes.

Définit aussi ce qui rend une analyse non publiable.

### `TEMPORAL_ANALYSIS_POLICY.md`

Document de référence sur les huit périodes.

Contient :

- intentions analytiques de chaque période ;
- stratégies de comparaison disponibles ;
- règles de choix ;
- conditions de comparabilité ;
- traitement des périodes partielles ;
- granularité par séances ou jours ;
- détection des phases ;
- ruptures ;
- comparaison début/fin ;
- robustesse des découpages ;
- usage de l'historique extérieur à la fenêtre.

### `DISCOVERY_LIFECYCLE_AND_SELECTION.md`

Document de référence sur :

- identité stable des phénomènes ;
- qualité intrinsèque ;
- qualification des analyses ;
- historique éditorial ;
- découverte déjà montrée ;
- nouvelle preuve ;
- actualisation ;
- consolidation ;
- réserve publiable ;
- réapparition ;
- archivage ;
- invalidation ;
- scoring ;
- diversité ;
- information marginale ;
- nombre dynamique de cartes.

### `FRENCH_EDITORIAL_RULES.md`

Norme de rédaction française.

Contient :

- grammaire ;
- accords ;
- conjugaison ;
- sujet réel ;
- noms d'exercices ;
- dates ;
- références temporelles ;
- terminologie sportive ;
- formulation des chiffres ;
- causalité ;
- incertitude ;
- exemples acceptables et interdits ;
- niveau de profondeur attendu.

### `GOLDEN_ANALYTICAL_CASES.md`

Registre permanent des scénarios sportifs de référence.

Chaque scénario contient :

- jeu de données ou fixture ;
- période ;
- faits ;
- conclusion attendue ;
- conclusions interdites ;
- preuves obligatoires ;
- comportement de publication attendu ;
- test correspondant ;
- statut réel.

### `ISSUES_AND_REGRESSIONS.md`

Registre permanent des défauts.

Pour chaque problème :

- identifiant stable ;
- symptôme ;
- gravité ;
- impact utilisateur ;
- reproduction ;
- cause racine ;
- fichiers concernés ;
- correction ;
- tests ;
- preuve navigateur si nécessaire ;
- statut.

Ne considère jamais un bug comme clôturé uniquement parce qu'un test unitaire est vert.

### `ENGINE_DECISIONS.md`

Journal des décisions structurantes.

Pour chaque décision :

- problème ;
- options envisagées ;
- solution retenue ;
- raisons ;
- compromis ;
- alternatives écartées ;
- conséquences sur les modules existants.

### `IMPLEMENTATION_PROGRESS.md`

Journal de progression opérationnel.

Contient :

- ce qui a été inspecté ;
- ce qui est démontré ;
- ce qui a été modifié ;
- ce qui reste à faire ;
- ce qui est bloqué ;
- les tests réellement exécutés ;
- les preuves disponibles ;
- les risques de régression.

## 1.2 Intégration avec Cursor

Si le dépôt utilise déjà `.cursor/rules/`, complète les règles existantes sans les écraser.

Sinon, crée une règle Cursor ciblée et courte, par exemple :

`.cursor/rules/momentum-analysis.mdc`

Elle doit rappeler que toute modification du moteur d'analyse nécessite :

- lecture des contrats applicables ;
- consultation des défauts historiques ;
- conservation des invariants ;
- ajout de tests de non-régression ;
- mise à jour des documents concernés.

Ne charge pas toute la documentation à chaque interaction sans nécessité.

La règle peut pointer vers les documents de référence et préciser quand les consulter.

Si le projet possède déjà `AGENTS.md` ou des instructions de développement équivalentes, intègre cette convention sans créer de règles contradictoires.

## 1.3 Maintien obligatoire

Ces documents ne doivent pas être des rapports oubliés après leur création.

Chaque correction substantielle doit mettre à jour :

1. Le contrat concerné, si la règle évolue.
2. Le registre des défauts, si un problème est corrigé.
3. Les scénarios de régression, si une garantie nouvelle est apportée.
4. Le journal de progression.
5. Le journal de décisions, lorsqu'un compromis architectural a été fait.

N'ajoute pas une documentation abondante pour masquer un manque de réalisation.

Chaque affirmation « implémenté » doit renvoyer à du code et à une preuve.

---

# 2. PRÉSERVER LES CAPACITÉS AVANCÉES DÉJÀ EXISTANTES

Ton audit contradictoire a démontré que Momentum possède déjà :

- un pipeline composé ;
- des preuves composées ;
- une narration F4 ;
- des trajectoires ;
- des mécanismes de séries ;
- des attributions de volume ;
- des baselines ;
- un modèle d'identité sportive ;
- des contrats de phénomènes ;
- des rivalités éditoriales ;
- une évaluation de valeur informative ;
- une logique de nouveauté ;
- une mémoire éditoriale partielle.

Je ne veux pas recréer toutes ces fonctions sous d'autres noms.

Je veux comprendre pourquoi elles ne dominent pas le comportement réel.

## 2.1 Cartographier le chemin réellement emprunté

Pour chaque famille de candidats :

- producteur ;
- données d'entrée ;
- représentations intermédiaires ;
- preuve composée disponible ;
- trajectoire disponible ;
- attribution disponible ;
- narration F4 appliquée ou non ;
- sélection ;
- publication réelle.

Construis une matrice :

`famille → producteur → evidence → reasoning → narration → selection → DOM`.

Distingue les chemins historiques des chemins composés.

## 2.2 Ne pas imposer artificiellement F4 partout

Toutes les analyses ne nécessitent pas quatre paragraphes.

Une information simple peut être parfaitement pertinente en deux phrases.

En revanche, **aucune famille ne doit rester structurellement incapable de produire une analyse approfondie lorsque ses données le permettent**.

Il faut rendre les capacités analytiques accessibles à toutes les familles pertinentes sans forcer une narration complexe sur les observations simples.

## 2.3 Supprimer la concurrence incohérente entre chemins

Lorsqu'un producteur classique et le pipeline composé décrivent le même phénomène :

- confronter leurs preuves ;
- confronter leurs conclusions ;
- déterminer si l'un enrichit l'autre ;
- fusionner lorsque pertinent ;
- éviter de publier une description pauvre si une lecture explicative fiable est disponible.

Ne pas privilégier automatiquement F4 uniquement parce que F4 existe.

La priorité doit être donnée à la meilleure interprétation démontrée.

---

# 3. UNIFIER LA VÉRITÉ DES MÉTRIQUES ET DES RÉFÉRENTIELS

Le rapport contradictoire révèle une anomalie particulièrement grave.

Pour les dips parallèles, différentes parties d'une même analyse utilisent notamment :

- une attribution autour de 31 → 30 répétitions par séance ;
- une trajectoire early/late autour de 20 → 48 ;
- une conclusion affirmant que le volume par séance reste proche.

Ces valeurs peuvent décrire des référentiels différents.

Mais une analyse ne doit pas les juxtaposer sans les distinguer.

## 3.1 Contrat canonique des faits chiffrés

Chaque métrique utilisée dans une affirmation doit identifier :

- sujet ;
- exercice canonique si applicable ;
- variante ;
- source ;
- période ;
- bornes temporelles ;
- population d'enregistrements ;
- granularité ;
- unité ;
- dénominateur ;
- méthode d'agrégation ;
- référentiel ;
- effectif ;
- couverture ;
- version des données ;
- niveau de fiabilité ;
- références aux événements sources.

Exemples de référentiels à distinguer :

- première séance historique ;
- premières séances de l'arc ;
- dernières séances de l'arc ;
- période affichée ;
- période précédente ;
- dernier résultat ;
- meilleur résultat ;
- creux ;
- niveau habituel ;
- moyenne historique ;
- meilleure phase.

Ne remplace pas ces distinctions par un champ générique `average`.

## 3.2 Interdire les mélanges silencieux

Un producteur doit pouvoir employer plusieurs référentiels dans une carte.

Mais chaque comparaison doit être explicitement définie.

Exemple acceptable :

« Sur l'ensemble de la période, la moyenne reste proche de 30 répétitions par séance. À l'intérieur de l'arc récent, elle passe de 20 à 48 entre les premières et dernières séances retenues. »

Seulement si les deux affirmations sont réellement étayées et utiles ensemble.

Une formulation qui laisse croire que les mêmes moyennes sont simultanément stables et en hausse de 140 % est interdite.

## 3.3 Vérifier les unités et dénominateurs

Attention particulière :

- répétitions par jour actif ;
- répétitions par séance ;
- répétitions par occurrence d'exercice ;
- répétitions par série ;
- nombre de jours d'entraînement ;
- nombre de séances ;
- fréquence hebdomadaire ;
- volume GTG ;
- volume musculation ;
- volume total.

Une journée active n'est pas nécessairement une séance.

Si un total est divisé par 14 jours actifs, ne l'appelle pas automatiquement « répétitions par séance ».

Cette distinction doit être vérifiée dans les anciens textes sur les 4 502 / 4 889 répétitions.

## 3.4 Réconciliation des 387 répétitions

Les deux états d'export diffèrent de 387 répétitions, aussi bien sur 7 jours que sur 30 jours.

Ton dernier audit associe l'écart à une journée du 2 novembre absente ou incomplète.

Confirme cette explication par les enregistrements exacts.

Distingue :

- données réellement différentes ;
- chargement incomplet ;
- cache ;
- snapshot ;
- filtre ;
- signature ;
- contexte d'exécution.

Ne corrige pas les valeurs pour qu'elles correspondent artificiellement.

Documente la cause, puis corrige le chemin responsable si un défaut est confirmé.

## 3.5 Invariant de cohérence

Aucune analyse publiée ne doit contenir deux affirmations dont la cohérence ne peut pas être démontrée à partir de leurs métriques et référentiels.

---

# 4. CONSTRUIRE UNE REPRÉSENTATION COMMUNE DES PHÉNOMÈNES

Le cœur de cette mission est ici.

Momentum doit pouvoir distinguer :

1. Un événement enregistré.
2. Un signal calculé.
3. Une hypothèse analytique.
4. Un phénomène interprété.
5. Une analyse intrinsèquement publiable.
6. Une analyse sélectionnée pour une période.
7. Une carte réellement affichée.

Ces objets ne doivent pas être confondus.

## 4.1 Étendre les contrats existants

Appuie-toi sur `recapPhenomenonContract` et les modules composés.

Évalue s'ils peuvent représenter :

- sujet ;
- phénomène ;
- épisode ;
- métriques ;
- preuves ;
- trajectoire ;
- contexte historique ;
- mécanismes mesurés ;
- hypothèses soutenues ;
- hypothèses écartées ;
- incertitudes ;
- interprétation ;
- évolution depuis la dernière analyse ;
- pertinence pour différents horizons ;
- relations avec d'autres phénomènes.

N'ajoute pas des champs décoratifs.

Chaque champ doit avoir une fonction démontrable dans la validation, la synthèse, la sélection ou la publication.

## 4.2 Construire des phénomènes avant de figer les textes

Plusieurs observations relatives au même exercice peuvent décrire une histoire commune.

Exemple :

- interruption ;
- reprise ;
- fréquence retrouvée ;
- évolution du volume ;
- format de séries ;
- niveau antérieur ;
- consolidation.

Le moteur doit pouvoir les réunir en une lecture cohérente.

Il doit également pouvoir reconnaître lorsqu'il existe deux phénomènes réellement distincts.

Évite les fusions abusives.

## 4.3 Cas obligatoire : relevés de genoux aux parallèles

Le navigateur a affiché :

- retour après 42 jours ;
- réapparition après 77 jours.

Pour le même mouvement, dans le même récapitulatif.

Retrouve :

- les événements concernés ;
- les dates ;
- les identités ;
- les définitions d'interruption ;
- les producteurs ;
- les décisions de sélection ;
- la raison de la coexistence.

Corrige la cause racine.

Si ce sont deux épisodes distincts, ils doivent être explicitement identifiables et leur coexistence doit apporter une valeur réelle.

Si c'est le même épisode, empêcher la publication redondante.

Ne te contente pas d'ajouter une comparaison textuelle des titres.

## 4.4 Identité persistante

Une identité de phénomène ne doit pas dépendre uniquement :

- du titre ;
- du producteur ;
- de l'identifiant de carte ;
- de la période glissante ;
- d'un hash dont l'origine est perdue.

Elle doit permettre de suivre le phénomène malgré les variations de titre, de période ou de producteur.

Elle doit aussi distinguer plusieurs épisodes réellement distincts d'un même exercice.

---

