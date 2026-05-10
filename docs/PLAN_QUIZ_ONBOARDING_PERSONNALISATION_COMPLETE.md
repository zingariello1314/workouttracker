# Plan Complet — Quiz onboarding + personnalisation programmes

## 1) Vision produit (objectif final)

Créer un **module onboarding premium** (style des screenshots) qui :

- s'affiche automatiquement après création de compte (avec option `Passer` globale),
- reste accessible ensuite via `Paramètres > Remplir mon profil`,
- sauvegarde toutes les réponses (y compris questions passées = `null`),
- alimente la génération de :
  - programme d'entraînement sur mesure,
  - programme nutrition sur mesure,
  - ou les deux en une seule action.

Le même moteur doit être réutilisable :

- à la fin du quiz onboarding,
- depuis les sous-onglets `Programme` / `Nutrition` pour regénérer à la demande.

---

## 2) Cadrage UX/UI (inspiré screenshots)

## 2.1 Principes visuels

- Écran full dark, **section colorée** (Objectifs / Expérience / Opérations / Paramètres).
- Barre de progression fine + pourcentage (top right).
- Sous-titre italique contextuel (ex: "Analyse des niveaux...").
- Carte centrale à glow coloré, coins arrondis, contraste élevé.
- CTA bas fixes :
  - `DOS` (outline),
  - `CONTINUER` (plein, actif seulement si réponse valide),
  - `PASSER` visible (global + par question).

## 2.2 Tokens visuels recommandés

- `Objectifs`: violet/cyan.
- `Expérience`: jaune.
- `Opérations`: vert.
- `Paramètres`: blanc/argent.
- Animations légères (fade/slide 180-220ms max), pas de surcharge.

## 2.3 Comportement interaction

- 1 question / écran.
- `Continuer` désactivé tant qu'aucun choix (sauf question explicitement skippable).
- `Passer` question -> enregistre `null`.
- `Dos` conserve la réponse précédente.
- Barre de progression recalculée sur total questions.

---

## 3) Modèle de données profil (persisté par utilisateur)

## 3.1 Entité proposée

`userProfileQuestionnaire` (scope user) :

- `version` (migration future),
- `completedCount`,
- `totalCount`,
- `completionPercent`,
- `lastUpdatedAt`,
- `answers` objet clé/valeur :
  - valeur métier,
  - ou `null` si passé.

## 3.2 Champs métier (minimum)

- objectif physique,
- groupes musculaires prioritaires (max 3),
- niveau + ancienneté,
- fréquence hebdo actuelle,
- lieu entraînement,
- équipement dispo,
- styles déjà testés,
- taux de graisse (slider),
- jours dispo,
- créneau préféré,
- durée séance typique,
- activité hors training,
- sommeil,
- stress,
- intensité rappels série,
- difficulté défis quotidiens,
- (optionnel recommandé) données impédancemètre :
  - poids,
  - masse grasse %,
  - masse musculaire,
  - eau,
  - âge métabolique.

---

## 4) Règles fonctionnelles clés

## 4.1 Déclenchement onboarding

- Après création compte : ouvrir quiz si jamais complété.
- Bouton `Passer` onboarding complet :
  - marque `onboardingSkippedAt`,
  - n'empêche pas l'accès futur via Paramètres.

## 4.2 Paramètres > Remplir mon profil

- Reprend exactement les mêmes écrans.
- Prérempli avec réponses existantes.
- Affiche progression type `11/16 complétées`.
- Permet navigation par section (pas obligé de refaire linéairement).

## 4.3 Questions passées

- Toujours persistées explicitement à `null`.
- N'empêchent pas génération.
- Le moteur applique des valeurs fallback contrôlées.

---

## 5) Moteur de personnalisation entraînement (à partir banque exos/étirements)

## 5.1 Objectif technique

Générer automatiquement un programme réaliste en utilisant :

- banque d'exercices existante,
- banque d'étirements existante,
- contraintes utilisateur (jour, durée, matériel, niveau, objectif, focus muscles).

## 5.2 Pipeline de génération proposé

1. **Normalisation profil**  
   Transformer réponses quiz + fallback.

2. **Contraintes hard** (bloquantes)
   - jours dispos,
   - durée cible séance,
   - matériel disponible,
   - lieu entraînement,
   - niveau.

3. **Préférences soft** (scoring)
   - objectif physique,
   - groupes prioritaires,
   - styles appréciés/testés,
   - créneau préféré,
   - fatigue/stress/sommeil.

4. **Sélection exercices**
   - filtrage discipline + équipement,
   - scoring par adéquation objectif + muscles,
   - variété (anti-duplication forte),
   - équilibre hebdo pattern push/pull/legs/core.

5. **Prescription volume**
   - séries/reps/tempo/repos selon niveau + durée.

6. **Étirements**
   - auto-ajout ciblé muscles sollicités du jour,
   - slots matin/midi/soir compatibles durée.

7. **Validation**
   - vérifier durée réelle de séance,
   - vérifier couverture muscles prioritaires,
   - vérifier compatibilité matériel.

## 5.3 Heuristiques de sécurité

- Débutant : limiter volume/intensité.
- Stress haut + sommeil faible : baisser charge, favoriser technique/mobilité.
- Aucune dispo matériel : fallback poids du corps.
- Si données insuffisantes : template "safe balanced".

## 5.4 Prérequis data explicites (bloquant Phase B)

Ce point est **bloquant** avant moteur v1 : la banque doit être exploitable de manière fiable.

- Vérifier la couverture des métadonnées utiles pour génération :
  - équipement,
  - groupe musculaire principal/secondaire,
  - difficulté,
  - discipline d'entraînement,
  - catégorie/pattern.
- Le code actuel dispose déjà d'une inférence (`enrichExercise`, `inferTrainingDiscipline`) mais il faut un audit qualité des résultats (pas seulement présence de champ).
- Définir un score de complétude par exercice (ex: `fitnessForGenerationScore`) et un seuil minimum.
- Prévoir fallback si tags faibles :
  - exclure l'exercice du pool auto,
  - ou l'utiliser uniquement dans templates "safe".

### Validation technique à ajouter au plan

- Script d'audit banque : `% champs présents`, `% inférés`, `% ambigu`.
- Rapport JSON + markdown dans `docs/`.
- Gate de release : pas de lancement moteur v1 sans seuil de qualité atteint.

---

## 6) Moteur personnalisation nutrition (déjà en place + branchement quiz)

## 6.1 Ce qui doit être fait

- Connecter réponses quiz au générateur nutrition existant :
  - niveau d'activité,
  - fréquence training,
  - créneau entraînement,
  - objectif physique,
  - données impédancemètre.
- Aligner le contrat avec les structures déjà présentes :
  - `planProfile` (poids, taille, âge, body fat, activityFactor),
  - `mealPlanPreferences`,
  - estimation `estimateProgramTargets(...)`,
  - génération des repas `generateMealPlanOutline(...)`.

## 6.2 Résultat attendu

- calories/macros ajustées automatiquement,
- timing repas cohérent avec entraînement,
- plan adaptable si profil incomplet (fallback robuste).

## 6.3 Contrat d'interface explicite (à verrouiller tôt)

Entrée minimale côté nutrition (profil normalisé) :

- `goal`,
- `baselineWeightKg`,
- `heightCm`,
- `age`,
- `sex`,
- `bodyFatPercent` (optionnel),
- `activityFactor`,
- `targetWeightDeltaKg` (optionnel),
- `selectedSportProgramId` (optionnel mais recommandé).

Sortie attendue :

- cibles macro/calories cohérentes (`targetCalories`, `targetProtein`, `targetCarbs`, `targetFat`),
- `planProfile` enrichi (`estimatedBmr`, `estimatedTdee`, `estimateNote`),
- plan repas généré (ou régénérable).

Critère de faisabilité technique :

- pas de refactor lourd du module nutrition existant : ajouter un `adapter` plutôt que toucher le coeur.

---

## 7) Génération conjointe (les deux d'un coup)

À la fin du quiz :

- CTA `Générer entraînement`,
- CTA `Générer nutrition`,
- CTA `Générer les deux`.

Depuis sous-onglets concernés :

- bouton `Utiliser mon profil` pour générer/régénérer,
- option `Conserver ce qui existe` ou `Remplacer entièrement`.

## 7.1 Cohérence inter-moteurs (point critique ajouté)

La génération conjointe doit modéliser le couplage :

- Si training planifie les séances `Mardi/Jeudi/Samedi`, la nutrition doit refléter :
  - jours training (surplus/maintenance ciblée),
  - jours repos (apport ajusté).
- Source de vérité recommandée :
  - calendrier hebdo du programme entraînement actif,
  - puis projection nutrition `workoutDayCalories/restDayCalories`.
- En cas de conflit (pas de programme training disponible) :
  - fallback nutrition neutre,
  - message clair dans l'UI.

---

## 8) Architecture technique proposée

## 8.1 Modules

- `profileQuestionnaireSchema` (zod),
- `profileQuestionnaireRepository` (persist user-scoped),
- `useProfileQuestionnaire` (state + progression + navigation),
- `trainingPersonalizationEngine`,
- `nutritionPersonalizationAdapter`,
- `programGenerationOrchestrator` (train/nutri/both).

## 8.2 Contrats

- Entrée moteur : profil normalisé.
- Sortie moteur training : structure programme compatible `WorkoutContext`.
- Sortie moteur nutrition : structure compatible module nutrition existant.

### Contrat training — précision ajoutée

Sortie training doit être compatible avec :

- `useWorkoutPrograms.addProgram(...)` (création),
- `activateProgram(...)` (activation éventuelle),
- `normalizeProgramRestConfig(...)` (jour de repos valide),
- `schedule` par jour + exos + étirements + éventuelles variantes.

### Contrat merge/remplacement — précision ajoutée

Le système doit définir explicitement pour un utilisateur qui a déjà des programmes :

- `create_new` : créer un nouveau programme sans toucher aux anciens,
- `replace_active` : remplacer uniquement le programme actif,
- `replace_named` : remplacer un programme cible choisi,
- `merge_into_active` : fusion contrôlée dans le programme actif (v2 uniquement, risqué).

## 8.3 Traces / observabilité

- logs génération (version, règles choisies),
- score de confiance,
- raisons fallback.
- mode décision (`create_new` / `replace_active` / `replace_named`).

## 8.4 Cache & invalidation (ajout)

Décision UX/tech à figer :

- Changement de profil dans Paramètres :
  - ne régénère pas automatiquement (recommandé),
  - affiche bannière "Profil mis à jour — régénérer ?" dans les sous-onglets concernés.
- Invalidation soft :
  - marquer les programmes générés comme `stale_by_profile=true` si profil changé significativement.
- Invalidation hard (optionnelle) :
  - si champs critiques changent (objectif, jours dispo, matériel), proposer régénération prioritaire.

### Champs critiques (liste verrouillée)

Un changement sur l'un de ces champs déclenche `stale_level=hard` :

- `goalPhysique` (objectif physique principal),
- `availableTrainingDays` (jours disponibles),
- `preferredSessionDuration` (durée séance cible),
- `trainingLocation`,
- `availableEquipment`,
- `experienceLevel`,
- `activityOutsideTraining` (facteur activité),
- `bodyFatPercent` (si présent et variation significative),
- `weeklyTrainingFrequencyCurrent`.

Règles complémentaires :

- Variations légères non structurantes (ex: stress/sommeil) => `stale_level=soft`.
- `bodyFatPercent` :
  - variation < 2 points absolus => soft,
  - variation >= 2 points => hard.

---

## 9) Plan d'implémentation (phases)

## Phase A — Fondations quiz

- Créer schéma data + persistence user.
- Construire flow question par question.
- Intégrer déclenchement post-signup + skip global.
- Ajouter module Paramètres prérempli.

**Livrable**: quiz fonctionnel, réponses stockées, progression affichée.

## Phase B — Mapping vers génération

- Mapper réponses quiz -> contraintes training/nutri.
- Ajouter adapter nutrition (sans casser l'existant).
- Créer moteur training v1 rule-based.
- Ajouter audit qualité banque exos/étirements + gate de complétude.
- Verrouiller contrat d'entrée/sortie nutrition sans refactor majeur.

**Livrable**: génération basée profil depuis quiz.

## Phase C — Génération duale + UX

- CTA "générer les 2" fin onboarding + sous-onglets.
- Gestion merge/remplacement programmes.
- États chargement premium + feedback erreurs.
- Couplage training/nutrition (jours entraînement vs repos).
- Politique cache/invalidation après édition profil.

**Livrable**: expérience end-to-end.

## Phase D — Qualité premium

- Polissage UI visuel (micro-animations + cohérence couleurs sections).
- Validation edge cases (null, skip, profil partiel).
- Tests unitaires + scénarios e2e.

**Livrable**: version production robuste.

---

## 10) Critères d'acceptation (DoD)

- Quiz auto-lancé sur nouveau compte.
- Quiz ignorable globalement.
- Chaque question skippable individuellement.
- Réponses persistées user-scoped, `null` pour passées.
- Reprise depuis Paramètres avec pré-remplissage.
- Indicateur complétion visible.
- Génération entraînement personnalisée depuis quiz.
- Génération nutrition personnalisée depuis quiz.
- Génération conjointe possible.
- Génération possible aussi depuis sous-onglets dédiés.
- Programmes générés cohérents avec matériel/jours/durée/niveau.
- Cohérence nutrition/training sur les jours ON/OFF.
- Aucun overwrite involontaire des programmes existants.
- Stratégie d'invalidation profil -> programmes visible côté UI.
- Invalidation hard/soft déterministe (mêmes entrées => même résultat).
- Réponses quiz stockées en clés métier stables (pas de libellés traduits).

---

## 11) Risques & garde-fous

- **Risque**: règles trop agressives pour débutants  
  **Mitigation**: caps volume/intensité + templates sûrs.

- **Risque**: profil incomplet -> plan incohérent  
  **Mitigation**: fallback explicites + score de confiance.

- **Risque**: duplication de programmes à chaque regen  
  **Mitigation**: stratégie replace/merge + confirmation utilisateur.

- **Risque**: dette UX (flow trop long)  
  **Mitigation**: progression claire + sections + skip.

- **Risque**: banque exos insuffisamment taggée pour moteur rule-based  
  **Mitigation**: audit qualité + gate avant release Phase B.

- **Risque**: contrat nutrition ambigu -> refactor tardif coûteux  
  **Mitigation**: formaliser I/O dès Phase B avec tests d'intégration.

- **Risque**: incohérence des jours training vs nutrition en génération duale  
  **Mitigation**: source de vérité unique = calendrier training.

- **Risque**: profil modifié mais programmes non revalidés  
  **Mitigation**: flag `stale_by_profile` + prompt de régénération.

---

## 12) Checklist design (fidélité screenshots)

- Barre de progression colorée par section.
- Glow carte section cohérent.
- Hiérarchie typo premium (titre, sous-titre, options).
- États sélection visibles (chip active avec halo).
- CTA bas fixe, ergonomie mobile.
- Animations discrètes et rapides.
- Contrastes AA minimum sur texte principal.

---

## 13) Extensions recommandées (v2)

- Recommandations IA explicables ("pourquoi ce choix").
- Réévaluation périodique profil (tous les 30/60 jours).
- Détection auto évolution niveau -> proposition régénération.
- A/B test UX (quiz court vs complet).

---

## 14) Audit code actuel — constats intégrés

## 14.1 Entraînement (génération)

- La base actuelle a des utilitaires utiles (`enrichExercise`, inférences discipline/équipement/difficulté) mais pas encore de moteur de génération complet prêt onboarding.
- L'ajout d'exercices banque dans un programme existe déjà (mutations utilitaires + vues programme), ce qui réduit le coût de la Phase B.
- La gestion des programmes (`addProgram`, `activateProgram`, `updateProgram`) est déjà structurée.

## 14.2 Nutrition (génération)

- Le module nutrition expose déjà :
  - estimation des cibles (`estimateProgramTargets`),
  - structure profil (`planProfile`),
  - génération de plan repas (`generateMealPlanOutline`),
  - mode `creationMode: manual|generated`.
- Le besoin principal n'est pas de réécrire, mais de brancher proprement les réponses quiz via adapter.

## 14.3 Programmes existants & remplacement

- Le contexte actuel sait créer/activer/supprimer des programmes, mais la politique onboarding de remplacement n'est pas encore explicitée.
- Ce plan introduit la matrice de décision (`create_new`, `replace_active`, `replace_named`) comme exigence produit.

## 14.4 Décision à prendre (produit)

Par défaut recommandé :

- première génération post-quiz = `create_new` + proposition d'activation,
- jamais remplacer silencieusement un programme existant,
- régénération ultérieure via choix explicite utilisateur.

---

## 15) Spécification scoring banque (actionnable)

## 15.1 `fitnessForGenerationScore` (0 -> 100)

Proposition de calcul initial :

- Équipement exploitable (tag explicite ou inférence fiable) : +25
- Groupe musculaire principal résolu : +20
- Difficulté résolue : +15
- Discipline d'entraînement résolue : +15
- Catégorie/pattern exploitable : +10
- Métadonnées secondaires utiles (muscles secondaires, notes, etc.) : +15

Total max : 100.

## 15.2 Seuils de décision

- `>= 80` : auto-pool OK (génération libre).
- `60-79` : auto-pool conditionnel (seulement slots non critiques / fallback assisté).
- `< 60` : exclu du pool auto (reste sélectionnable manuellement).

Gate release Phase B :

- au moins 85% des exercices candidats doivent être `>= 80`,
- au plus 5% peuvent être `< 60` (sinon correction tags obligatoire).

---

## 16) Spécification i18n des réponses quiz (obligatoire)

## 16.1 Règle de stockage

Les réponses doivent être persistées en **clés métier stables** (enum/codes), jamais en texte UI traduit.

Exemples :

- `goalPhysique: "lean_toned"` (et non "Sec et tonique"),
- `dailyChallengeDifficulty: "nightmare"` (et non "Cauchemar"),
- `preferredTrainingWindow: "afternoon"` (et non "Après-midi").

## 16.2 Contrat UI

- L'UI mappe `key -> label` via i18n,
- Le moteur ne lit que des `keys`,
- Les exports/imports gardent les `keys`.

## 16.3 Migration / sécurité

- Ajouter versionnement du schéma réponses (`questionnaireSchemaVersion`),
- Vérification stricte à la lecture :
  - valeur inconnue => `null` + warning de migration,
  - jamais fallback sur label.

## 16.4 Critère de validation

- Changer la langue de l'app ne doit modifier **aucune** valeur stockée des réponses.
- Même profil doit produire la même génération quel que soit le locale actif.

