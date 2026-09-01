# Récap Analyse — comment le moteur d’interprétation a été amélioré

Document de parcours : d’où on partait, ce qui a été changé, où on en est, et **où aller**.

Périmètre : les **trois colonnes** Court / Moyen / Long terme de l’onglet Sport → Récap → Analyse (et le panneau dev « Moteur d’interprétation »).  
Pas le reste du Récap (Snapshot, Coach Vision, Benchmarks, etc.), même si ces surfaces devront un jour lire la **même** représentation interne.

Lectures :

- **§ 1–11** — historique du moteur, décisions, audits (31 août 2026).
- **§ 12** — relevé factuel du site (1er sept. 2026, 00:19).
- **§ 13** — **cible produit** : temporalité ≠ type d’analyse ; colonnes = Maintenant / Trajectoire / Parcours ; couche `athleteJourney`. Ne pas lire § 13 comme un backlog de 50 cartes à coller.
- **§ 14** — **architecture inversée** et but de densité **sport / entraînement**. Phases 4–9. Ce but n’est pas encore à 100 % : on le conclut **avant** d’écrire les analyses sommeil.
- **§ 15** — **second but** (sommeil ↔ entraînement) : exemples mot pour mot + architecture. Données + moteur + textes toutes plages + croisements ; silence si non publiable.
- **§ 16** — jauge d’avancement de **toute** la cible documentée (fondations + § 14 + § 15 + § 17).
- **§ 17** — **troisième but** : moteur événementiel / jalons, **en supplément** du moteur analytique. Jamais un remplacement.

---

## 1. D’où on partait

### 1.1 Ce que l’utilisateur voyait (version « tableau de bord »)

Trois colonnes remplies de **puces statistiques** du type :

- triceps 1 022 reps, épaules 972, biceps 577 ;
- Tractions australiennes 48 → 40 ;
- réalisé 52 % du prévu, alignement ~32/100 ;
- 15 séances / 30 jours vs 20 avant.

Le schéma mental était :

```
donnée → comparaison → « Conclusion : … »
```

C’était déjà mieux qu’un dump brut, mais ça restait un **catalogue de détecteurs**. Le lecteur devait lui-même relier les faits. Le mot « régression » sortait trop vite (40 → 30 reps). Les horizons (7 / 30 / 90 jours) étaient des **étiquettes**, pas des questions différentes. Garmin (pas, kcal) apparaissait comme des faits isolés. Un quota du type 8 / 7 / 6 puces **forçait le remplissage** avec des phrases faibles.

### 1.2 Ce que le code savait déjà (et n’affichait pas)

L’architecture n’était pas vide. Il existait déjà, entre autres :

| Couche | Rôle |
|--------|------|
| Features 7 / 28 / 90 j. (`recapTrainingFeatures.js`) | Baselines de volume et de fréquence comparables |
| `UserTrainingState` | Axes charge, perf, récup, fatigue, adhérence, réponse |
| Événements (`trainingEventDetector.js`) | PR, reprises, etc. |
| Relations (`trainingRelationEngine.js`) | Croisements d’axes (discontinuité, écart programme, push/pull…) |
| Robustesse (`performanceRobustness.js`) | PR isolé vs niveau établi |
| Pipeline (`recapInterpretationPipeline.js`) | État → relations → texte |

Le vrai problème n’était **pas le manque de données**. C’était :

1. des builders **legacy** (`{ text: "…" }`) qui entraient dans le même pool que les interprétations ;
2. une **sélection après coup** sur des phrases déjà écrites, au lieu de choisir *quoi* analyser ;
3. `UserTrainingState` qui pouvait piloter la charge avec le **delta le plus spectaculaire** (moitié de période −89 %) au lieu de la comparaison **28 j. vs 28 j.** ;
4. des colonnes **vides ou cachées** si le filtre était trop strict, ou au contraire **bourrées** pour atteindre un quota.

### 1.3 Ce que tu demandais vraiment

Pas « plus de puces ». Une lecture de coach :

> Voilà ce qui a changé → quand → ce qui l’explique probablement → ce qui n’a pas bougé → ce que ça veut dire pour l’objectif → quoi surveiller.

Et une règle de fond : **exposition ≠ performance ≠ consistance ≠ capacité**. Une baisse de reps n’est pas une régression.

---

## 2. Comment on s’y est pris (méthode)

On n’a **pas** réécrit huit moteurs. On a **changé ce qui entre dans les colonnes**, puis **comment le texte est produit**, puis **comment on choisit quoi montrer**.

Ordre réel du travail (celui qui a été suivi) :

1. **Gating** — une métrique n’est pas une analyse ; faits isolés hors colonnes.
2. **Baselines** — 7 / 28 / 90 et période Recap sélectionnée.
3. **Un paragraphe par horizon** — pour sortir du catalogue (étape intermédiaire).
4. **Plusieurs lectures par colonne** — titre + 2–4 phrases, puis allongées.
5. **Alignement du panneau dev** avec ce que l’UI raconte vraiment.
6. **Profondeur** — dates, familles de mouvements, objectif, absences, PR dans l’état — sans recoller le même argument d’une carte à l’autre.

À chaque étape : tests Vitest sur le pipeline, les lectures, et l’interdiction des faits Garmin / « 1re moitié » dans les colonnes.

---

## 3. Les couches aujourd’hui

Flux actuel :

```
Snapshot + fenêtre Recap + programme + Garmin (si utile)
        ↓
Features normalisées (7 / 28 / 90 j., fréquence, complétion…)
        ↓
UserTrainingState (axes + features)
        ↓
Événements + robustesse + transitions + relations
        ↓
Lectures de coach (recapHorizonEssays.js)  ← texte utilisateur
        ↓
Rendu français (interpretationRenderer.js, type coach_reading)
        ↓
Sélection par horizon (poids, nouveauté, groupe sémantique)
        ↓
Colonnes Analyse (titre + corps + ligne de preuves)
```

Les relations ponctuelles (discontinuité, écart programme…) restent en **secours** si une colonne n’a pas assez de lectures solides. Elles ne doivent plus **concurrencer** un pavé unique.

### 3.1 Fichiers centraux

| Fichier | Rôle |
|---------|------|
| `src/utils/sport/recapTrainingFeatures.js` | Chiffres comparables, **pas de texte UI** |
| `src/utils/sport/athleteTrainingIdentity.js` | Identité : fréquence habituelle ± variance, intervalles par qualité, confiance |
| `src/utils/sport/userTrainingState.js` | État athlète ; charge primaire = **28 j. vs 28 j.** |
| `src/utils/sport/recapExposureNarratives.js` | Fenêtres période / habitude / 90 j., muscles, classification des baisses d’exos |
| `src/utils/sport/recapTrainingTimeline.js` | Dernière occurrence, jours écoulés, séances entre-temps |
| `src/utils/sport/recapHorizonEssays.js` | Bibliothèque de **lectures** (titre, corps, preuves, pertinence) |
| `src/utils/sport/recapInterpretationPipeline.js` | Assemble état + lectures + fallback relations |
| `src/utils/sport/recapAdaptiveInsights.js` | Sélection (quotas 4 / 3 / 2), nouveauté, cartes UI |
| `src/utils/sport/interpretationRenderer.js` | `coach_reading` → texte (titre / corps / preuves) |
| `src/components/sport/recap/views/RecapAnalyseView.jsx` | Affichage colonnes |
| `src/components/sport/recap/RecapTrainingStateDebugPanel.jsx` | Dev : axes bruts vs ce que les colonnes racontent |

---

## 4. Décisions de produit (et pourquoi)

### 4.1 Moins d’analyses, chacune plus riche

On a d’abord compressé **tout un horizon en un paragraphe**. Ça forçait l’intelligence (croisements), mais **fusionnait 6 sujets** : le lecteur ne pouvait plus suivre une idée.

On est passé à : **garder 3 colonnes**, mais **plusieurs lectures indépendantes** (titre + paragraphe). Pas 15 puces de 5 mots. Chaque lecture a un **rôle unique** pour éviter les doublons :

| Kind (id) | Question qu’elle a le droit de poser |
|-----------|--------------------------------------|
| `continuity` | Fréquence vs densité de séance |
| `volume_traj` | 28 j. vs 7 j. (pas la moitié de période) |
| `program` | Prévu vs commencé vs blocs sacrifiés |
| `absence` | Dernière date d’une qualité, séances entre-temps |
| `performance` | Momentum / PR / variantes ≠ perte de capacité |
| `push_share` | Mix poussée + **conséquence selon l’objectif** |
| `specialization` | Ce qui se *construit* sur le cycle (moyen terme) — **chevauche** `push_share` (groupes sémantiques distincts → les deux peuvent sortir) |
| `pull_hold` | Tirage vertical qui tient alors que le volume dos baisse |
| `unknown_fatigue` | Dire qu’on **ne sait pas** |
| `efficiency` | Rendement lu **avec** la fréquence |
| `goal_gap` | Objectif vs comportement |
| `capacity_vs_exposure` | Risque si le trou de rythme dure |
| `continuity_level` | Sur 90 j., ce qui progresse parce que ça revient |
| `recent_vs_identity` | Le rythme actuel casse-t-il la trajectoire des mois ? |
| `identity` | Écart à la **variabilité habituelle** (moyenne ± σ), pas seulement au mois d’avant |

Remplissage interdit : plus de pavé « tu as maintenant des références personnelles » juste pour occuper le long terme. Seuil de pertinence (~0,76) : les lectures trop faibles ne sortent pas.

### 4.2 Les chiffres sont des preuves, pas le contenu

Ligne de bas de carte du type `14 séances · 3,5/sem. · 4,7/sem. avant`.  
Le corps vise : *tu t’entraînes moins souvent, mais pas moins longtemps quand tu t’y mets*.

**Piège vérifié :** « longtemps » n’est **pas** mesuré. `continuity` compare `avgExercisesPerSession` (nombre d’exercices cochés), pas une durée de séance. Sur le dump du 31 août : « 7 exercices contre 6,7 » — c’est de la **densité d’items**, pas du temps. Formuler ça comme « pas moins longtemps » serait une affirmation non prouvée. L’identité a déjà changé le titre quand le rythme est *dans* la plage habituelle ; il reste à ne plus parler de durée sans horodatage.

Langage visé : sujet → verbe → conséquence. Interdits de facto : « le réalisé », « le profil se lit en parts relatives », « Conclusion : ».

### 4.3 Hiérarchie des comparaisons de volume

Trois questions **différentes**, à ne plus mélanger :

| Métrique | Question |
|----------|----------|
| `volumeDelta28Pct` | Ce mois vs le mois d’avant (comparable) |
| `volumeDelta7Pct` | Cette semaine vs la précédente (rythme *récent*) |
| `periodHalfDeltaPct` (−89 %) | 1re vs 2e **moitié de la période affichée** (autre question) |
| `volumeDelta90Pct` (+500 %…) | Souvent **non comparable** si la fenêtre précédente est quasi vide → ignoré dans le récit (`plausiblePct`) |

**Avant :** `UserTrainingState` prenait le delta **le plus grand en valeur absolue** → le −89 % volait la vedette au −38 % mensuel.  
**Maintenant :** la charge affichée / utilisée comme tendance de fond = **28 j. vs 28 j.** ; les 7 j. sont cités s’ils **divergent** (mois en baisse, semaine qui reprend).

C’est aussi ce qui a **désaligné le panneau dev** : il montrait encore −89 % alors que les colonnes parlaient −38 % / +61 %. Le panneau explique désormais explicitement que la moitié de période n’est pas la même question.

### 4.4 Classification des baisses d’exercices

Dans `classifyExerciseShifts` : une baisse de reps peut être

- **exposition** (moins de séances) ;
- **remplacement** (même famille, d’autres variantes montent) ;
- **performance** (toujours pratiqué, séries plus basses) ;

jamais « régression » par défaut. Le mot est devenu **difficile à obtenir**.

### 4.5 Chronologie

`recapTrainingTimeline.js` : pour un exercice, dernière date, jours depuis, nombre de séances **après** cette date.  
Ça permet : *dernière course le 12/08, 18 jours, 9 séances de muscu entre-temps* → absence **spécifique**, pas arrêt du sport.  
Un cardio très ancien (dizaines de jours) est plutôt **long terme**. La prochaine séance se lit comme une **reprise**, pas comme un comparatif au meilleur niveau.

### 4.6 Objectif

Même ratio push/pull ~2,6 :

- hypertrophie générale → le déséquilibre **compte plus** que la baisse de volume total ;
- street / tractions → peu d’exposition au tirage = pertinent ;
- force sèche → concentration poussée peut être voulue si le tirage de référence tient.

L’objectif n’est plus une parenthèse « (objectif hypertrophie) » collée à la fin.

### 4.7 Confiance et « je ne sais pas »

- Échantillon / nombre de séances module encore le pied de certaines cartes.
- Fatigue `unknown` + confiance basse → **on ne dit pas** « tu es fatigué ». On dit que le tableau (charge qui monte + sommeil qui baisse + références qui reculent *en étant encore pratiquées*) n’est pas là.
- Les lectures trop peu confiantes sont filtrées plutôt que d’afficher « confiance 35 % » après une affirmation ferme. Ce n’est **pas** encore un système où 90 % / 65 % / 40 % réécrivent chaque verbe ; c’est amorcé.

### 4.8 Mémoire des thèmes

Historique local (`insightNoveltyStore`) + groupes sémantiques. Si la poussée dominante a déjà été dite, le titre peut passer à « La poussée **reste** dominante » plutôt que de redécouvrir le même fait. C’est une **première couche**, pas une vraie mémoire « thème résolu / empire depuis 8 semaines ».

---

## 5. Où on en est aujourd’hui (état au 31 août 2026)

**Ce qui marche** (y compris sur le dump réel de ce jour)

- Les colonnes racontent des **histoires distinctes**, plus un inventaire musculaire.
- Croisements fréquents : fréquence × densité ; 7 j. × 28 j. ; prévu × commencé × blocs ignorés.
- **Identité vivante sur ce dump** : ~3,3 séances/sem. lu comme *dans* la plage habituelle ~4,1 (2,6–5,5), pas comme une rupture. `volume_traj` a bien opposé −38 % (28 j.) et +61 % (7 j.). `absence` course : 24/06, 68 j., 39 séances entre-temps.
- Charge du panneau = **28 j. vs 28 j.** (−38 %), pas le −66 % de moitié de période (affiché et écarté).
- Fatigue `unknown` (35 %) : pas de carte « tu es fatigué ». Événements / robustesse vides **sur ce snapshot** (les détecteurs n’ont rien émis — ce n’est pas que le code n’existe pas).

**Le cap franchi, et ce qui manque encore**

Le moteur n’est plus un générateur de stats reformulées. Il produit des phrases intelligentes à partir de **plusieurs signaux**. Il ne construit pas encore une **représentation unique de la situation** avant d’écrire. Détail recoupé code + captures : **§ 10**.

**Limites honnêtes**

1. Unité d’analyse = encore la **dimension** (une carte volume, une programme, une push…) pas le **phénomène**.
2. « Volume » dans les features = **reps cochées**, pas le travail (charge × séries × RIR × durée).
3. Titre long terme `continuity_level` trop **générique** (« ce qui revient souvent ») ; le dump nomme des exos mais pas la forme de la trajectoire.
4. `performance` / axe Perf. du panneau = **momentum de reps agrégé** (−60 %) alors que le corps de la carte dit déjà que ce n’est pas la capacité.
5. Objectif = 3 portes de texte, pas un système de priorités.
6. Population (~3 vs 0,9 séances) : **dans le panneau dev seulement** (`isColumnInterpretation` écarte `hierarchical_comparison`). Ne pollue pas les colonnes utilisateur — mais parasite le debug.
7. Quotas 4 / 3 / 2 ; le dump listait ~12 lectures composées, les colonnes n’en montrent qu’une fraction. La sélection peut cacher le meilleur signal (identité/continuité) derrière `program` ou `specialization`.

---

## 6. Comment on génère une lecture (concrètement)

1. On calcule des **fenêtres** : période affichée, « habitude » (souvent la période comparable d’avant), 90 jours.
2. On **résume** séances, muscles (parts relatives), exercices (première / dernière série, nb de séances).
3. On **ne produit une lecture que si** le signal est assez fort (ex. push ≥ 60 %, absences avec assez de séances entre-temps).
4. On écrit : observation → comparaison → relation → hypothèse prudente → éventuellement « à surveiller ».
5. On assigne un `relevance` ; le sélecteur et un filtre (~0,76) **jettent** le remplissage.
6. L’UI affiche `title`, `body` (paragraphes), `evidence` (preuves chiffrées).

Ce n’est **pas** un LLM à l’inférence. C’est du **texte déterministe** branché sur des features. L’« intelligence » est dans le **choix des croisements** et dans **l’interdiction** de certaines conclusions (régression, fatigue, +703 %).

---

## 7. Si on continue

**Nord : § 13.** Le saut n’est plus « plus de lectures », ni seulement « phénomènes composés ». C’est que la **période Recap** cesse d’être un type d’analyse, et que Court / Moyen / Long cessent d’être des réservoirs.

Le prochain saut **n’est pas** d’ajouter 30 `coach_reading`. C’est de changer l’unité : **phénomène** (situation cohérente) plutôt que **dimension** (une carte par métrique), puis de **projeter** ce phénomène vers une nature (Maintenant / Trajectoire / Parcours). Ordre, recoupé avec le dump réel du 31 août :

1. **Phénomènes composés** — regrouper fréquence ↓ + volume 28 j. ↓ + semaine ↑ + identité « dans la plage » + programme 33 % en *une* situation, au lieu de 4 cartes qui se répètent.
2. **Dose réelle** — le « volume » des features est un **somme de reps cochées** (`sumCheckedRepsInWindow`). Séries, charge, RIR, durée : souvent déjà dans le snapshot / Garmin, **pas** dans les lectures Analyse.
3. **Trajectoire** — pas seulement première vs dernière valeur sur 90 j. (`continuity_level`). Direction, plateau, dents de scie, expo ↓ vs perf stable.
4. **Objectif comme priorités** — aujourd’hui 3 portes de texte (`goalPushConsequence`, cardio street, `goal_gap`). Pas : quelles qualités sont prioritaires / maintenues / secondaires.
5. **Comportement quand ça dévie** — identité = *comment tu t’entraînes d’habitude*. Il manque *ce que tu sacrifies* quand le rythme casse (blocs abandonnés en cours de séance vs jamais commencés).
6. **Mémoire de phénomène** — `insightNoveltyStore` sait « poussée déjà dite → reste dominante ». Pas : aggravation 62 % → 74 %, résolution, réapparition.

Chantiers **secondaires** (gardés, pas en tête) : trou progressif semaine par semaine ; planning jour prévu × récup ; brancher Coach Vision sur les mêmes lectures ; verbes selon confiance.

Le problème n’est plus « collecter 50 variables de plus ». C’est de faire **travailler ensemble** celles qu’on a, et de **se taire** quand la comparaison n’est pas la bonne.

---

## 8. Audit : adaptatif vs « il apprend l’athlète »

Cette section répond à une question précise : **deux utilisateurs peuvent-ils avoir le même texte ?** et **est-ce que objectif / tier / baselines / niveau changent vraiment les décisions, ou sont-ils seulement dans le contexte ?**

Verdict court : le moteur est **adaptatif dans l’interprétation** (les données de *cet* utilisateur pilotent quelles lectures existent et comment elles sont formulées). Il n’est **pas** un système qui **apprend** ce qui est normal pour cette personne et **assouplit ses propres seuils**. Formule juste :

> moteur d’interprétation **déterministe, contextualisé et personnalisé** — pas encore un analyste qui apprend l’athlète.

### 8.1 Ce qui est réellement adaptatif (vérifié dans le code)

Deux personnes avec le même « −30 % de séances » n’auront **pas** forcément le même set de cartes, parce que chaque lecture a des **conditions d’émission** branchées sur *leurs* features.

| Signal utilisateur | Influence réelle sur le texte ? | Où |
|--------------------|---------------------------------|-----|
| Volume / fréquence **vs sa propre fenêtre précédente** (7 / 28 / 90) | Oui. Les % ne sont pas vs une norme mondiale. `4 vs 5 séances` et `6 vs 4` donnent des deltas opposés → titres et corps différents. | `recapTrainingFeatures.js` → `userTrainingState.js` → lectures `continuity`, `volume_traj`, `recent_vs_identity` |
| Mix muscles, push/pull, jambes | Oui. `push_share` et `specialization` ne sortent que si le mix de *cette* période le justifie (ex. push ≥ ~60 %). | `recapHorizonEssays.js` |
| Exercices encore pratiqués vs abandonnés | Oui. `classifyExerciseShifts` (exposition / remplacement / perf) ; `pull_hold` seulement si le tirage vertical **tient encore** ; `absence` si une qualité a une dernière date + séances entre-temps. | `recapExposureNarratives.js`, `recapTrainingTimeline.js`, essays |
| Niveau établi | Oui, **partiel**. Sert de *preuve* dans `pull_hold` (« assez établi pour servir de référence ») et peut ouvrir `established` si le tirage vertical ne « tient » pas assez pour `pull_hold`. Ne change pas les seuils globaux. | `performanceRobustness.js` → essays |
| PR récents | Oui. Intégrés dans le corps de `performance` (« ce n’est pas une baisse uniforme »). | `trainingEventDetector.js` → essays |
| Complétion programme, blocs les moins cochés | Oui. `program` raconte *ses* jours commencés / manqués et *ses* blocs sacrifiés. | `recapCompletionTruth.js` + enrichment |
| Sommeil / fatigue | Oui, surtout en **négatif** : si fatigue unknown, on **n’invente pas** une histoire de fatigue (`unknown_fatigue` seulement dans un cas étroit ; pas si la semaine rebondit déjà). | `userTrainingState.js` + essays |
| Objectif (quiz) | Oui, **mais étroit** (voir 8.2). | essays uniquement |
| Historique « on t’a déjà dit poussée dominante » | Oui, **léger**. Titre « reste dominante » si le thème a déjà été montré (`insightHistory`). | `insightNoveltyStore` + essays |

Donc l’exemple « même 4 séances / sem. vs 5 avant » : l’utilisateur A (perf stable, tractions encore là, hypertrophie) peut avoir `continuity` + `performance` « ça tient » + `goal_gap` éventuel. L’utilisateur B (perf en baisse, tractions quasi abandonnées, sommeil bas, objectif street) peut **en plus** avoir `absence` sur le tirage / la course, **pas** `pull_hold`, un `performance` plus négatif, et un `goalPushConsequence` street si le mix est poussée-lourd. Ce n’est **pas** le texte identique de A recopié.

Ce n’est **pas non plus** encore le paragraphe idéal de B (« parmi les qualités que tu veux développer, le tirage vertical est celle que tu pratiques le moins ») : il n’existe **pas** de règle unique « objectif = tractions → classer les absences par priorité d’objectif ». C’est un assemblage de cartes, pas un raisonnement objectif-centré.

### 8.2 Objectif : réellement utilisé, pas seulement déclaré — mais 3 portes seulement

`userTrainingState` lit `goalPhysique` / `streetSkillGoal` et le met dans `context.goal`.

Dans **`recapHorizonEssays.js`**, le goal change le texte ou l’émission **uniquement** ici :

1. `goalPushConsequence(goal)` — 3 chaînes (street / hypertrophie-définition / force sèche / défaut) collées à `push_share`.
2. Absence cardio : si `street_skills`, phrase « l’endurance peut rester secondaire » ; sinon, place réelle de la course.
3. Lecture `goal_gap` **seulement si** `muscular_defined` **ou** `strength_lean`, plus complétion &lt; 65 % et fréquence en baisse.

**Pas utilisé dans les essays :** `tier` (Novice, Intermédiaire…). Il est stocké dans `context.tier` et sert surtout à la **phase de vie** (`BEGINNER` si `Débutant` dans `userTrainingState`), pas aux paragraphes des colonnes.

**Pas utilisé dans `trainingRelationEngine.js` :** aucune condition `if (goal === …)`. Le goal voyage dans `context` pour le renderer des *relations* (souvent une parenthèse), alors que les colonnes sont aujourd’hui surtout des `coach_reading`. Un ratio push/pull ≥ 1,65 **déclenche** `push_pull_stimulus` **pareil** pour un spécialiste pectoraux et pour un objectif tractions — c’est la lecture essay `push_share` qui module la phrase, pas le déclencheur.

### 8.3 Ce qui reste rigide (mêmes règles pour tout le monde)

```
données utilisateur → features personnelles → RÈGLES GLOBALES → texte
```

Pas :

```
données → identité de CET athlète → règles recalibrées pour lui → texte
```

Exemples concrets dans le code :

| Règle | Valeur | Conséquence |
|-------|--------|-------------|
| Tendance charge | ±8 % (`classifyTrendFromPct`) | +33 % de fréquence est « rising » pour tout le monde, que la personne vive à 3 ou à 6 séances/sem. Le *delta vs soi* est personnel ; le **seuil d’alarme** ne l’est pas. |
| Crash / discontinuité | volume ≤ −10 / −18 / −25, fréquence ≤ −18 | Identiques pour A et B. |
| Push/pull « déséquilibre » (relations) | ratio ≥ 1,65 ou ≤ 0,75 | Pas de « chez toi le ratio habituel est 2,4 donc 2,6 n’est rien ». |
| Émission `push_share` | push ≥ ~60 % | Fixe. |
| Filtre des lectures | `relevance ≥ ~0,76` | Fixe. |
| Quotas colonnes | 4 / 3 / 2 | Fixe. |
| Fenêtres | 7 / 28 / 90 jours calendaires | Toujours là. **En plus** : identité ~18 sem. (moyenne/σ). |
| `LEVEL_ESTABLISHED` | heuristique sur les dernières séances (écart-type, proximité du max) | Dit « le niveau est lisible ». L’identité ajoute une **plage de reps** par qualité, sans recalibrer ce seuil. |

Personne A (3→4 séances) et personne B (6→4) : les **pourcentages** seront opposés, donc les textes de `continuity` / `volume_traj` différeront. **Depuis l’identité**, si la confiance est haute, A à 3 séances dans une plage 3–4 n’est plus crié comme une rupture ; B à 3 hors d’une plage ~6 l’est. Ce que le moteur **ne fait toujours pas** : recalibrer `classifyTrendFromPct` (±8 %) ni les crash −18 % — l’identité densifie le *texte*, elle ne change pas les *états* Charge / Perf. du panneau.

### 8.4 Tableau de maturité (aligné sur le code, pas sur l’intention)

| Capacité | État | Commentaire code |
|----------|------|------------------|
| Collecte de données | Très bon | Snapshot, programme, Garmin si présent |
| Baselines 7 / 28 / 90 vs soi | Bon | Features ; 90 j. parfois non comparable (filtré dans le récit) |
| Comparaisons temporelles | Bon | Y compris 7 vs 28 divergents |
| Adaptation volume / fréquence / perf | Bonne | Deltas personnels + lectures dédiées |
| Adaptation à l’objectif | Bonne **base** | 3 branches essays, pas un jugeur d’objectif |
| Incertitude | Bonne base | Silence fatigue ; `plausiblePct` |
| Exercices / familles | Bonne base | Shifts + `pull_hold` + absences |
| Relations multi-signaux | Bonne base | Engine + essays ; colonnes = essays d’abord |
| Chronologie | Bonne base | Dernière date, pas encore série 5→4→3→0 |
| Trajectoires longues | À développer | Pas de détecteur de trou progressif |
| Compréhension du planning | À développer | Blocs peu cochés ≠ « course après deux jours de push » |
| Baseline dynamique « normal pour toi » | **Amorcé** | `athleteTrainingIdentity.js` : moyenne/σ fréquence ~18 sem., intervalles par qualité. Pas encore persisté. |
| Unité « phénomène » vs dimension | **Faible** | Une carte par `kind` ; pas de graphe qui fusionne contraction + semaine + identité |
| Dose (≠ reps) | **Faible** | `sumCheckedRepsInWindow` appelé « volume » dans le texte |
| Population | Dev seulement | Filtré des colonnes (`hierarchical_comparison`) ; encore dans le panneau |
| Mémoire des thèmes | Début | Reformulation « reste dominante », pas fiche thème (date, intensité, résolution) |
| Apprentissage individuel | **Partiel** | Comparaison à l’identité recalculée ; **pas** de MAJ de seuils globaux (±8 %, crash −18 %) |
| Auto-adaptation des règles | **Non** | Constantes dans le source (`classifyTrendFromPct`, etc.) |

### 8.5 Ce qu’il faudrait pour « apprendre l’athlète » (sans 50 règles de plus)

Pas empiler des `if`. Construire une **identité d’entraînement** persistante, puis évaluer l’écart à *cette* identité :

- fréquence / densité / volume **habituels** + **variabilité** (pas seulement le dernier 28 j.) ;
- par qualité : tractions N×/sem. habituel, délai max habituel, niveau (plage de reps), tolérance à une pause ;
- mémoire de conclusion (thème, première date, toujours là, résolu ou non) ;
- éventuellement : « chez toi, −18 % de fréquence sans baisse des références n’a jamais été un problème » — ça, c’est de l’apprentissage. Aujourd’hui on **recalcule** à chaque Recap les mêmes règles sur des features à jour.

Étape actuelle, volontairement : données propres + états + relations fiables. **Ensuite** seulement on peut laisser les seuils dépendre de la personne. C’est le bon ordre.

---

## 9. Trois niveaux d’adaptation (où on est, où aller)

Le moteur **n’est pas rigide**. Qualifier ça de rigide serait faux. Il est **déterministe, contextualisé et personnalisé, avec des règles globales**.

La nuance utile :

| | Aujourd’hui | Pas encore |
|--|-------------|------------|
| Chaîne | Données → comparaison à **son** historique de fenêtre → détection → interprétation | Données → **apprentissage des habitudes** → **recalibrage des seuils** → interprétation de ce qu’il est *habituellement* |
| Question | « Qu’est-ce qui se passe chez cet utilisateur ? » | « Qu’est-ce qui est **inhabituel** chez lui ? » puis « Comment **réagit-il d’habitude** ? » |

### Niveau 1 — Adaptation aux données — présent

Le moteur regarde ce que *fait* la personne. Volume ↓, fréquence ↑, tractions maintenues, course absente → **les lectures changent**. Ce n’est pas un gabarit où on substitue « 4 » à « 6 ».

Utilisateur A (3→4 séances, perf stable, tractions là, hypertrophie) et B (6→4, perf en baisse, tractions quasi abandonnées, street) ne voient **pas** la même situation. A peut lire une hausse de rythme sans perte de niveau. B peut lire une fréquence en baisse **et** des qualités importantes moins exposées.

Même chose pour 3 vs 3 (A habituellement à 3–4) contre 6→3 (B) : les **deltas vs la fenêtre précédente** suffisent déjà à distinguer stabilité et rupture. Ça, le moteur le fait.

### Niveau 2 — Adaptation au contexte — largement présent

Objectif × exercice × fréquence × performance × programme × chronologie. C’est le niveau actuel **fort** : exposition vs perf, absences datées, mix poussée lu selon l’objectif, PR dans l’état, silence si fatigue inconnue.

Limite : l’objectif ne **classe** pas encore les absences (« parmi ce que tu veux développer, le tirage est le moins exposé »). C’est un assemblage de cartes, pas un jugeur unique centré objectif.

### Niveau 3 — Adaptation à l’identité de l’athlète — **amorcé** (31 août 2026)

Le trou n’est plus « il n’y a que 7 / 28 / 90 ». Une couche `athleteTrainingIdentity` estime :

- fréquence habituelle (moyenne, σ, plage) sur ~18 semaines, **avec confiance** ;
- par qualité (tractions, pompes, dips, course) : intervalle médian / P80, trou actuel, plage de reps.

Ça densifie les lectures existantes (`continuity` ne crie plus « moins souvent » si 3 séances est dans ta plage 3–4 ; `absence` peut dire « 12 jours vs tes ~3 jours habituels »). Une carte **nouvelle** `identity` ne sort que si tu sors de la plage **et** que la confiance est haute. Moins de 6 semaines lisibles → silence.

Il manque encore : tolérance aux interruptions *observée* (comment tes perfs réagissent après une pause), réponse à la charge, fiche persistante d’un Recap à l’autre. Les seuils globaux (±8 %, crash −18 %) ne se recalibrent pas.

### Identité d’entraînement (état)

```
ATHLÈTE
├── Fréquence habituelle (séances/sem., variabilité, confiance)     ← fait
├── Densité habituelle (exos/séance, volume/séance)                 ← pas encore
├── Qualités (tractions, dips, pompes, course)
│     fréquence, niveau (plage), intervalle, variabilité            ← fait
│     tolérance à une pause (réaction observée)                     ← pas encore
├── Tolérance aux interruptions (globale)                           ← pas encore
├── Niveau établi                                                   ← déjà amorcé (robustesse)
└── Objectifs                                                       ← déjà (3 portes)
```

Chaque nouvelle observation s’évalue **contre cette identité**, avec incertitude. 10 jours d’historique → on **ne prétend pas** connaître la normalité (même philosophie que la fatigue unknown).

### Piège à ne pas faire

Ne pas : « plus l’historique est long, plus on assouplit **toutes** les règles ».  
Faire : baselines personnelles **avec intervalle et confiance**.

Exemple : habitude 4,2 ± 0,7 séances/sem. (confiance élevée). Actuel 3,5 → dans la variabilité. Actuel 2,0 → anomalie. Sans assez d’historique → silence.

### Prochaine priorité (pas l’âge / poids / sexe)

Voir **§ 7** et **§ 10.6** : phénomènes composés d’abord, pas plus de détecteurs. L’identité fréquence/qualité est **amorcée** ; la suite est comportement + dose + trajectoire, pas la population.

---

## 10. Audit critique (31 août 2026) — dump Recap + panneau dev + code

Pas une recopie d’un avis externe. Chaque point ci-dessous a été **tenu ou recalé** en regardant (a) les colonnes Analyse, (b) le dump « Interprétations composées » / Features, (c) les fichiers cités.

### 10.1 Ce que ce snapshot raconte vraiment

Les features du panneau, ce jour-là :

| Signal | Valeur | Dans le code |
|--------|--------|----------------|
| Volume 28 j. | −38 % | `volumeDelta28Pct` — c’est **la** charge (`userTrainingState` ne prend plus le max abs. de moitié de période) |
| Volume 7 j. | +61 % | `volumeDelta7Pct` — autre question |
| Moitié de période | −66 % | `periodHalfDeltaPct` — **affichée** dans le panneau, **écartée** des colonnes |
| Volume 90 j. | +590 % | `plausiblePct` le jette du récit (seuil ~160 %) |
| Fréquence | −35 % vs fenêtre précédente ; 13 séances / 28 j. | `frequencyDeltaPct`, `sessions28d` |
| Identité | actuel ~3,3 / habitude ~4,1 / plage 2,6–5,5 | `athleteTrainingIdentity` — **status inside** |
| Programme | ~33 %, alignement 22/100, 3 commencées / 7 prévues, 0 au bout | `recapCompletionTruth` + lecture `program` |
| Momentum reps | −60 % | `repsMomentumRatio` → axe Perf. `declining` **et** titre `performance` |
| Push | ~74 % / ratio ~2,8 (était ~2,11) | `push_share` + `specialization` (deux kinds) |
| Course | 24/06, 68 j., 39 séances entre-temps | `recapTrainingTimeline` + `absence` |
| Fatigue | unknown 35 % | pas de carte fatigue — correct |
| Robustesse / événements | vides **sur ce dump** | `analyzePerformanceRobustness` / `detectTrainingEvents` n’ont rien émis ici |

Situation globale (ce qu’un coach lirait en une fois) : **contraction récente de la pratique, pas une rupture d’identité ; la semaine rebondit ; le programme n’est presque plus le guide ; la poussée s’installe ; la course est sortie ; le −60 % de reps n’est pas une mesure de capacité.**

Le moteur a **tous ces signaux**. Il les sort en **cartes séparées**. C’est le vrai écart « interpréteur contextualisé » vs « analyste ».

### 10.2 Ce qui est vraiment bon (garder)

Vérifié dans ce dump, pas seulement dans l’intention :

- Toi vs toi, 28 j. vs 28 j., 7 j. cité **parce qu’il diverge**.
- Refus du −66 % / +590 % comme tendance des colonnes.
- Exposition ≠ performance (le corps de `performance` le dit ; le **titre** et l’axe Perf. le trahissent encore — § 10.4).
- Chronologie course : date + délai + séances entre-temps. Excellent.
- Identité : 3,3 lu comme *dans* 2,6–5,5, pas « tu t’entraînes moins » comme verdict. La carte `identity` **n’est pas sortie** (statut `inside`, comme prévu : silence si ce n’est pas inhabituel).
- `unknown_fatigue` : silence. Les listes de causes (« récupération serrée, choix, oubli ») restent une **énumération**, pas un raisonnement probabiliste — mais au moins on n’affirme pas la fatigue.
- Preuves chiffrées sous le texte ; pas de remplissage Garmin / kcal dans les colonnes.
- Novelty : « La poussée **reste** dominante » — première couche réelle (`insightHistory`).

### 10.3 Ce que l’audit externe a raison de frapper — et où c’est dans le code

**Narration > analyse.** Une lecture = `signal A + signal B → phrase plausible` (`recapHorizonEssays.js`). Pas : état → phénomène → causes → enjeu objectif → surveillance. Les `kind` sont des **dimensions** (`continuity`, `volume_traj`, `program`…) sélectionnées ensuite (`selectBalancedCandidates`, quotas 4/3/2, pénalité de groupe sémantique). Un coach inverse l’ordre : d’abord « qu’est-ce qui se passe ? ».

**Redondance push.** `push_share` (groupe `reading_push`) et `specialization` (groupe `reading_specialization`) : **deux groupes**, donc les deux peuvent cohabiter. Sur le dump : 74 % poussée **et** « devient plus spécialisé » avec les mêmes % triceps/épaules. Le système de nouveauté ne fusionne pas le phénomène.

**Long terme faible.** `continuity_level` titre une **règle d’entraînement** (« ce qui progresse, c’est ce qui revient »), pas une observation. Le corps liste des noms (australiennes, dips) dès que `lastReps >= firstReps + 2` ou `longShifts.rising`. Pas : plateau vs dents de scie vs expo↓/perf stable. Robustesse vide sur ce dump → on n’a même pas « niveau établi » pour étayer.

**« Volume » trompeur.** `sumCheckedRepsInWindow` / `dailyRepsMap` : ce sont des **reps cochées**. Le mot « volume −38 % » dans `volume_traj` et l’axe Charge peut se lire « 38 % moins de travail ». Faux si les charges, séries, RIR, durées ont changé. `progressionEfficiency = perfDelta / |volDelta|` (−1,58 ici) est le ratio de **deux pourcentages de reps**. `adaptationCost: high` en découle. Trop abstrait pour un athlète.

**Perf −60 % dangereux.** `derivePerformance` pose `declining` si `repsMomentumRatio <= 0.9`. La carte dit ensuite que le momentum mélange exo moins touchés / variantes / suivis. **Contradiction assumée** : le framing « PERF / performances » est plus affirmatif que la preuve. À traiter comme un bug de **vocabulaire d’état**, pas comme un nouveau détecteur.

**Course : gravité trop nette.** Phrase hardcodée : « au-delà de deux semaines, la première séance de retour n’est plus comparable à ton meilleur niveau ». 68 jours + 39 séances = absence **massive**, le constat date+trou est juste ; la frontière « 2 semaines = plus comparable » est une règle pratique vendue comme physiologie. Distinguer : inhabituel (identité) / perte de spécificité *probable* / capacité mesurée / comparabilité.

**Programme : hypothèse non départagée.** « trop chargé **ou** mal placé » — le code a `leastCheckedExercises` et jours commencés vs prévus. Il n’a pas : séance commencée puis coupée vs jour jamais ouvert ; pas le graphe lundi push → mardi jambes. `leastCheckedPct` ≠ « systématiquement sacrifié en fin de séance ».

**Objectif décoratif.** Confirmé § 8.2 : 3 portes. Pas de classement « parmi ce que tu vises, quoi est exposé / entretenu / sorti ».

**Dose, durée, planning, familles, muscles %.** Absents des essays. `avgExercisesPerSession` ≠ durée. % triceps = parts du **modèle de comptage**, pas une stimulation mesurée. `redundancy` (variantes pompes) existe mais n’a pas sorti ici.

**Contradictions / renforcements.** `volume_traj` est le seul vrai croisement 7 vs 28. Il n’y a pas d’objet « phénomène » qui dirait : *le signal principal est la contraction ; la semaine l’atténue ; l’identité dit que ce n’est pas hors-norme ; le −60 % reste indéterminé ; le programme est un autre sujet (adhérence), pas la même cause.* À l’inverse, fréquence↓ + volume↓ + course absente + push↑ **pourraient** se renforcer : aujourd’hui 4 cartes.

**« Rien d’inquiétant » pas systématique.** L’identité le fait pour la fréquence. Pas : volume↓ mais niveau maintenu (robustesse vide ici) ; exo absent mais famille couverte.

**Panneau = états, colonnes = relations.** Charge falling / Perf declining / Adhérence low ressemble à un diagnostic. Les colonnes racontent autre chose (identité inside, semaine +61 %). Risque de debugger les axes au lieu des lectures. Population ~3 vs 0,9 : **hors colonnes** (`isColumnInterpretation` refuse `hierarchical_comparison`) — utile à retirer du panneau ou à reléguer, pas à « corriger » l’UI utilisateur.

**Stabilité ≠ moyenne.** L’identité a déjà σ de fréquence hebdo (plage 2,6–5,5). Ce qui manque : distribution intra-semaine (4 séances lun–jeu vs étalées) et « 0 / 8 / 1 / 7 » vs « 4 / 4 / 4 / 4 » comme *continuité*, pas seulement comme variance de totaux hebdo.

### 10.4 Ce que l’audit externe force un peu trop, ou qui est déjà là

| Claim | Recalage |
|-------|----------|
| « Le moteur ne sait pas ce qui est normal » | **Faux sur la fréquence**, sur ce dump. Identité inside. Encore vrai pour : réaction à une pause, dose, comportement de sacrifice. |
| « Population parasite les lectures » | Parasite le **dev**, pas les colonnes. |
| « Il manque toute notion de maintien » | `pull_hold` + `LEVEL_ESTABLISHED` existent ; **non centraux** et muets ici. |
| « Efficiency n’existe pas » | `progressionEfficiency` existe ; le problème est **sémantique** (−1,58 illisible), pas l’absence de variable. |
| « Pas de contradictions du tout » | `volume_traj` et `unknown_fatigue` en sont. Il manque un **moteur** de contradictions, pas le premier exemple. |
| « 4 niveaux d’apprentissage » | Utile. On est au **niveau 2** (vs habitude) pour la fréquence. Niveau 3 (quand ça dévie, que fait-il) : quasi absent. Niveau 4 (seuils qui bougent) : non, et **volontaire**. |

### 10.5 Formulation : trois niveaux, et le ton méta

Sur ce dump, plusieurs cartes sautent constat → hypothèse (« programme trop chargé ou mal placé », « début de reprise », « pas comparable après 2 semaines »).

Les garde-fous (« ce n’est pas une régression », « hypothèse à vérifier, pas un verdict », « le 33 % tout seul ne dit rien ») sont **répétés**. Ils enseignent le moteur au lieu de parler de l’athlète. La prudence devrait être **dans le verbe**, les preuves dans la ligne du bas / le panneau.

Titres à bannir du type **leçon** : « Ce qui progresse durablement, c’est ce qui revient souvent ». Remplacer par ce que **ses** données montrent (ex. « Tes dips et australiennes ont assez de séances pour être lisibles ; le reste du trimestre ne l’est pas »).

### 10.6 Six angles morts — au-dessus de « plus de cartes »

1. **Phénomènes composés** — une situation « contraction récente, identité respectée, semaine qui rebondit, programme décroché ». Features → phénomène → 1–2 lectures, pas 4 dimensions.
2. **Dose** — cesser d’appeler reps « volume » dans le texte utilisateur ; brancher séries / charge / RIR / durée **quand ça existe déjà** dans le snapshot.
3. **Trajectoire** — forme sur 90 j., pas first vs last. Expo × perf (↑↑, ↑↓, maintien à expo basse).
4. **Objectif-priorités** — pas une phrase A/B/C. Quelles qualités sont à développer / à entretenir / acceptables en retrait.
5. **Comportement de déviation** — blocs jamais commencés vs commencés-abandonnés ; ce qui survit quand le temps manque ; reprise comme **événement** (déjà dans `trainingEventDetector`, vide ici).
6. **Mémoire de phénomène** — première fois / persiste / s’aggrave (62→74 %) / se stabilise / se résout / réapparaît. Au-delà de « reste dominante ».

### 10.7 Notes de maturité (code + ce dump, pas un barème marketing)

| Couche | Note | Pourquoi |
|--------|------|----------|
| Données / 7-28-90 / soi | 8–8,5 | Snapshot riche ; comparaisons justes |
| Détection de signaux | 8 | Course, push, programme, 7 vs 28 : ça sort |
| Identité / personnalisation fréquence | 7 | Vivante ici ; pas persistée ; seuils globaux inchangés |
| Prudence | 7 | Silence fatigue OK ; trop de disclaimers ; −60 % mal nommé |
| Chronologie | 7,5 | Date+trou exemplaire ; gravité 2 semaines trop nette |
| Robustesse / trajectoire | 5–6 | Code là, **muet sur ce dump** ; long terme générique |
| Objectif | 5,5 | 3 portes |
| Programme / planning | 5 | 33 % + least-checked, pas l’organisation de la semaine |
| Dose | 4 | Reps = volume |
| Phénomènes / contradictions | 4 | Une carte 7/28, pas de graphe |
| Comportement / mémoire longue | 3–3,5 | Novelty poussée seulement |
| **Analyste de CET athlète** | **~6** | Excellent interpréteur de dimensions ; pas encore un récit de situation |

Le cap « plus un tableau de stats » est **franchi**. Le prochain n’est pas une 13ᵉ `coach_reading`. C’est que le moteur **choisisse le phénomène** avant d’écrire, et que Charge / Perf. du panneau cessent de contredire ce que les cartes ont appris à nuancer.

---

## 11. Verdict produit : interprétation contextuelle ≠ analyse athlète

Le moteur sait relier des signaux (fréquence ↓ + expo 28 j. ↓ + semaine ↑ + identité inside). Il ne construit pas encore une **représentation unique de la situation**, puis n’écrit qu’à partir d’elle.

### 11.1 Quatre niveaux (ce qui manque encore en entier)

| Niveau | Unité | Exemple |
|--------|--------|---------|
| 1. Signal | Observation brute | `frequencyDelta28 = −35 %` |
| 2. Relation | Deux signaux liés | fréquence ↓ + reps suivies ↓ → contraction de pratique |
| 3. Phénomène | Relation + contexte | contraction récente + semaine en reprise + identité inside → **non installée** |
| 4. Lecture | Projection UI | un texte, pas trois cartes |

Au-dessus : un **état athlète** (exposition, performance comparable, consistance, récupération, alignement objectif, trajectoire) dont les phénomènes émergent. Pas encore construit comme objet unique.

### 11.2 Anomalie ≠ importance

L’identité dit : *est-ce différent de l’habitude ?* (observée, **jamais** « optimale »).
L’objectif dit : *est-ce important ?*
Course absente + objectif street → inhabituel, peu prioritaire. Tractions absentes + objectif street → inhabituel **et** important. La priorité d’affichage doit croiser les deux, pas un `relevance` isolé.

### 11.3 Ce qui a été posé (sans exploser le graphe de fichiers)

Un seul module, `trainingPhenomenonEngine.js` : objets phénomène, **pas de texte**. Une cause ne produit plus trois cartes (continuité + volume_traj + capacité vs expo). Le panneau DEV sépare brut / phénomènes / cartes. L’axe « Perf. » n’est plus `declining` sur un momentum de reps agrégées (`indeterminate`). Le vocabulaire utilisateur parle de **répétitions suivies / exposition**, pas de « volume » au sens dose.

Seuils globaux (±8 %, crash −18 %) : **inchangés**. Pas d’apprentissage adaptatif des seuils.

### 11.4 Ordre de chantier (pas 50 détecteurs)

Supersédé et précisé par **§ 13.10**. Conservé ici comme historique du 31 août :

1. Qualité du moteur actuel (perf, vocabulaire, titres, DEV) — amorcé.
2. Représentation d’état + dose réelle (séries / charge quand elles existent) + phénomènes.
3. Objectif → qualités prioritaires.
4. Trajectoires 90 j. (forme, pas first vs last) ; expo × perf.
5. Comportement (blocs sacrifiés, structure de séance, régularité intra-semaine).
6. Mémoire des phénomènes (nouveau / persistant / résolu).
7. Apprentissage personnel **ensuite seulement**.

Règle : beaucoup de raisonnement interne → peu de conclusions affichées. Sur un dump type 31 août, viser **3–4 phénomènes** (contraction+rebond, déplacement vers la poussée, qualité sortie, niveau indéterminé) plutôt que 6–12 cartes.

### 11.5 Notes recalées

| Couche | Avis | Pourquoi |
|--------|------|----------|
| Données / comparaisons 7-28-90 | 8,5 | Déjà solides |
| Prudence | 7 | Disclaimers réduits ; perf trop forte corrigée |
| Performance réelle | 5 | Indéterminée tant que non comparable |
| Dose | 4 | Toujours des reps cochées |
| Objectif | 5 | Encore 3 portes + un axe anomalie/importance amorcé |
| Phénomènes | 5 | Un moteur mince, pas encore AthleteState |
| Mémoire | 3 | Inchangé |
| **Modèle de l’athlète** | **~6** | Les briques y sont ; l’abstraction qui les fait coopérer commence à peine |

Le texte « plus intelligent » n’est plus le levier. La représentation interne l’est.

---

## 12. Relevé site — 1er septembre 2026, 00:19

Relevé d’écran, pas un avis. Date de capture : **lundi 1er septembre 2026, 00:19**.  
Onglet Sport → Récap musculaire → **Analyse**.  
Pour chaque plage Recap : d’abord les **données affichées** (bandeau « Récap sur la période »), puis les **trois colonnes**, puis le **DEV** quand il était visible.

Le document ci-dessus (§ 5, § 10) décrit un dump du **31 août**. Le site au 1er sept. 00:19 est le même moteur (colonnes `coach_reading`, phénomènes dans le DEV, identité fréquence, vocabulaire « répétitions suivies / exposition »). Ce qui change d’une plage à l’autre, c’est **quelles lectures sont choisies** et **quelles fenêtres** le bandeau Recap alimente.

Plages non envoyées dans ce lot (6 mois, 1 an, 2 ans, Toujours) : non notées.

### 12.1 Aujourd’hui — lun. 31 août 2026 → lun. 31 août 2026

**Données Recap (1 jour)**  
360 reps · 0 km · 0 m course · 1 h 05 exos · 1 h 05 total · 0 kg soulevés · streak max 9 · 386 kcal · 1 jour entraîné.  
Meilleurs mois (sur la période) : tout en août 2026, mêmes totaux.  
Exos les plus travaillés : Relevés de genoux à la barre 60 · Tractions australiennes — prise pronation 48 · Dips parallèles 48.  
Meilleure série : 1 j. (31/08 → 31/08).  
Zones : dos ~77 · pectoraux ~60 · gainage/tronc ~47 · triceps ~31 · quadriceps ~37.

**Court terme**  
Titre : *La course a glissé hors de ta routine, pas toute ton activité.*  
Dernière course (libellé « Course ») le **27/07/2026**, **35 j.**, **20** autres séances. Objectif hypertrophie / définition : l’endurance n’est pas la priorité. Identité course : retour habituel ~tous les 4 j. (rarement au-delà de 9) ; 35 j. = qualité délaissée. Prochaine séance = reprise.  
Preuves : `27/07/2026 · 35 j. · 20 séances entre-temps`.

**Moyen terme**  
Titre : *Ton entraînement devient progressivement plus spécialisé.*  
Part croissante épaules ~13,6 % et triceps ~10,3 %, biceps encore ~11,9 %. Rapport poussée/tirage d’environ 2,5 à 1,2.  
Preuves : `gainage 19,7 % · dos 14,7 % · quadriceps 13,9 %`.

**Long terme**  
*Ton historique parle davantage d’une difficulté de continuité que d’un manque de capacité (charge récente −32 %, fréquence −30 %).* Levier : stabilité de la fréquence. Objectif hypertrophie / définition.

**DEV**  
Identité fréquence : `inside` · actuel 3,5 /sem. · habitude 4,1 (plage 2,7–5,5).  
Phénomènes (2) : `contraction_with_rebound` (86 %) ; `observed_output_indeterminate` (58 %).  
Exposition (reps) : falling, confiance 92 % · reps suivies −32,3 % vs 28 j. précédents · 7 j. +123,4 %.  
Sortie observée : indeterminate, confiance 50 % · production de reps −60 %, pas une mesure de capacité.  
Récup : unknown, confiance 35 %.

### 12.2 7 jours — mer. 26 août 2026 → lun. 31 août 2026

**Données Recap**  
1 049 reps · 0 km · 0 m course · 3 h 05 exos · 3 h 05 total · 0 kg · streak max 9 · 2 799 kcal · 3 jours entraînés.  
Exos : Pompes (endurance) 100 · Extension triceps 60 · Relevés de genoux à la barre 60.  
Meilleure série : 3 j. (26/08 → 28/08).  
Zones : triceps ~250 · pectoraux ~169 · épaules ~191 · dos ~156 · gainage/tronc ~94.

**Court terme**  
Même lecture course que § 12.1 : dernière course le **27/07/2026**, 35 j., 20 séances.  
Preuves : `27/07/2026 · 35 j. · 20 séances entre-temps`.

**Moyen terme**  
Titre : *Le rendement de progression se lit avec la fréquence, pas tout seul.*  
Progression récente moins favorable ; efficacité autour de **−1,86** ; une partie du ralentissement liée au fait de s’exposer moins souvent.  
Preuves : `Efficacité ~ −1,86`.

**Long terme**  
*Tractions australiennes — prise pronation, Dips et Dips parallèles tiennent sur le trimestre parce que tu y reviens.* Un PR isolé sur un exo rare dit peu ; une hausse lente sur un mouvement répété dit davantage.  
Preuves : `Tractions australiennes — prise pronation · Dips · Dips parallèles`.

**DEV**  
Identité : `inside` · 3,5 / 4,1 (2,7–5,5).  
Phénomènes (4) : `contraction_with_rebound` (86 %) ; `specialization_push` (push 76,3 %, ratio 3,2, 72 %) ; `low_adherence` (programPct 40, 70 %) ; `observed_output_indeterminate`.

### 12.3 30 jours — lun. 3 août 2026 → lun. 31 août 2026

**Données Recap**  
4 556 reps · 0 km · 0 m course · 13 h 05 exos · 13 h 05 total · 2 544 kg soulevés · streak max 9 · 15 364 kcal · 15 jours entraînés.  
Exos : Pompes (endurance) 400 · Relevés de genoux à la barre 240 · Dips parallèles 192.  
Meilleure série : 9 j. (6/08 → 14/08).  
Zones : pectoraux ~631 · triceps ~608 · épaules ~632 · dos ~449 · gainage/tronc ~319.

**Court terme**  
Titre : *Ta pratique s’est contractée, mais elle rebondit déjà.*  
~5,1 → ~3,6 séances/sem. (environ 30 % de moins). Reps suivies 28 j. environ 32 % de moins. Les 7 derniers jours repartent (environ 123 % de plus). 3,5 /sem. dans la plage habituelle 2,7–5,5. Densité de séance ~7 exercices. Contraction d’exposition, déjà en reprise — pas une perte de capacité démontrée.  
Preuves : `14 séances · 3,6/sem. · 5,1/sem. avant · habitude 4,1`.

**Moyen terme**  
Titre : *Ton tirage vertical ne semble pas régresser.*  
« Tractions pronation et Tractions pronation » restent dans leur niveau habituel. Références : Tractions pronation et Tractions australiennes — prise pronation. Exposition vs capacité.  
Preuves : `Tractions pronation · Tractions pronation`.

**Long terme**  
Même lecture continuité vs capacité que § 12.1 : charge récente −32 %, fréquence −30 %. Objectif hypertrophie / définition.

**DEV**  
`coût high` · Novice confirmé. Signature visible `3.3|4556|12|…`.

### 12.4 3 mois — mar. 2 juin 2026 → lun. 31 août 2026

**Données Recap**  
17 916 reps · **29,2 km** · **3 h 59** course · 48 h 38 exos · 52 h 37 total · 34 161 kg · streak max 20 · 44 159 kcal · 58 jours entraînés.  
Meilleurs mois : reps / km / temps course / exos / total / kg / streak / jours → **juin 2026** ; kcal actives → **août 2026**.  
Exos : Pompes (endurance) 1 000 · Mouvement (`1970493985…`) 800 · Mouvement (`1328512297…`) 720.  
Meilleure série affichée : 19 j. (2/06 → 20/06) — le bandeau indique aussi streak max 20.  
Zones : pectoraux ~2 408 · triceps ~2 549 · épaules ~2 510 · dos ~1 440 · gainage/tronc ~1 071.  
Course & cardio (meilleures sorties) : 5,8 km lun. 15/06 · 4,7 km lun. 27/07 · 4,3 km ven. 5/06. Record jour 5,83 km le 15/06.

**Court terme**  
Titre : *Ta pratique s’est contractée, mais elle rebondit déjà.*  
Texte affiché : passé d’environ **0,6 à 4,5** séances/sem. **(environ 30 % de moins)** ; reps 28 j. −32 % ; 7 j. +123 % ; 3,5 dans 2,7–5,5 ; ~6,9 exercices/séance.  
Preuves : `57 séances · 4,5/sem. · 0,6/sem. avant · habitude 4,1`.

**Moyen terme**  
Même lecture tirage vertical que § 12.3 (Tractions pronation répété deux fois dans le corps et en preuves).

**Long terme**  
Titre : *Nouveau palier consolidé sur Tractions pronation (~20 reps de façon répétée)* — pas qu’un record ponctuel ; niveau réel qui semble monter. Objectif hypertrophie / définition.

**DEV**  
`coût bas` · Niveau confirmé (libellé du badge tel qu’à l’écran).

### 12.5 Alignement doc ↔ site (constat, 01/09 00:19)

Ce qui est **le même objet** que le document :

- Trois colonnes Court / Moyen / Long, cartes titre + corps + ligne de preuves.
- Panneau DEV : axes Exposition / Sortie observée / Récup, identité fréquence, phénomènes (`contraction_with_rebound`, etc.).
- Vocabulaire « répétitions suivies », « pas une perte de capacité », « identité inside ».
- Le filtre Recap (Aujourd’hui / 7 j. / 30 j. / 3 mois) change le **bandeau de chiffres** et **quelle lecture gagne** la colonne ; les horizons ne sont pas des copies du filtre (sur « Aujourd’hui » le court terme parle quand même de 35 j. de course et d’habitude 4 j.).

Ce que le **relevé du 1er sept.** montre en plus du dump écrit au § 10 (31 août) :

- Dernière course datée **27/07/2026**, **35 j.**, libellé générique « Course » (plus un développé haltères).
- Sur **Aujourd’hui** et **7 jours**, le court terme affiché est `absence` course, alors que le DEV liste déjà `contraction_with_rebound`.
- Sur **30 jours**, le court terme est la contraction + rebond (aligné phénomène).
- Sur **3 mois**, le bandeau Recap a des km/temps course ; le court terme reste la carte contraction, avec la paire **0,6 / 4,5 séances** et la mention « 30 % de moins » telles quelles à l’écran.
- `pull_hold` affiche deux fois « Tractions pronation ».
- Le bandeau Recap 3 mois liste deux exos « Mouvement (id numérique) ».

Fin du relevé 01/09/2026 00:19.

---

## 13. Cible produit — temporalité ≠ type d’analyse (1er sept. 2026)

Cette section est un **avis de direction**, recoupé avec le relevé § 12 et le code. Ce n’est pas un relevé d’écran, et ce n’est pas un sprint d’implémentation.

### 13.1 Verdict

Le diagnostic est **juste**. Le vrai problème n’est plus « pas assez de données » ni « pas assez de cartes ». C’est architectural :

1. Le moteur **n’analyse pas vraiment en fonction de la période Recap**. Il applique à peu près les mêmes concepts à toutes les fenêtres. La période change le bandeau de chiffres et **quelle lecture gagne** une colonne — pas *quelle question* la colonne a le droit de poser.
2. **Court / Moyen / Long n’est pas une distinction analytique.** Ce sont trois boîtes dans lesquelles on force des observations. Une lecture a un `horizon: 'short' | 'medium' | 'long'` **avant** d’être sélectionnée (`recapHorizonEssays.js` : helpers `short()` / `medium()` / `long()`). Le filtre Recap (Aujourd’hui, 7 j., 30 j., 3 mois…) est une **autre** fenêtre, celle du bandeau. Les deux se mélangent dans le texte.
3. Le système mélange, souvent dans la même phrase, **données de la fenêtre, données précédentes, moyenne historique, tendance, comparaison et interprétation**, sans dire à quel horizon appartient chaque chiffre.

**On ne supprime pas les trois colonnes.** C’est une bonne idée UX. On change **ce qu’elles signifient**.

| Aujourd’hui (code + UI) | Cible |
|-------------------------|--------|
| Court ≈ lectures taguées `short` (souvent 7 j. internes, parfois une absence de 35 j.) | **Maintenant** — qu’est-ce qui vient de se passer ? |
| Moyen ≈ lectures taguées `medium` (cycles, spécialisation, rendement) | **Trajectoire** — qu’est-ce qui est en train de se construire ? |
| Long ≈ lectures taguées `long` (continuité, palier, « ce qui revient ») | **Parcours** — qu’est-ce que l’historique raconte **depuis le début** ? |

Les fenêtres 7 / 28 / 90 restent des **outils internes** (assez de recul pour calculer). Elles ne sont plus des **catégories**.

Quatrième dimension, orthogonale au temps : **comparaison à soi** (identité, première référence, PR vs niveau habituel). Une analyse peut être « maintenant » tout en ayant besoin d’une référence historique (course absente 35 j. vs habitude tous les 4 j.). Une analyse peut être « parcours » tout en parlant d’un chiffre actuel (tractions +42 % depuis la première saisie).

### 13.2 Preuve sur le site (§ 12) — 01/09/2026 00:19

Sans répéter le relevé, les combinaisons artificielles :

| Plage Recap | Ce que la colonne raconte | Pourquoi c’est le mauvais objet |
|-------------|---------------------------|--------------------------------|
| **Aujourd’hui** (1 séance, 360 reps) | Court = course absente depuis le **27/07**, 35 j., 20 séances. Moyen = « sur un **cycle de quelques semaines** », spécialisation épaules/triceps. Long = historique de **continuité** (−32 % / −30 %). | Une journée n’est pas un cycle. Le DEV a déjà `contraction_with_rebound` ; la colonne court affiche `absence`. |
| **7 jours** (3 jours entraînés, 1 049 reps, 0 km) | Court = **la même** carte course 35 j. Moyen = rendement **−1,86**. Long = australiennes / dips « tiennent sur le **trimestre** ». | Analyse historique collée sur 7 jours. Score d’efficacité illisible. Rien de spécifique à *cette* semaine. |
| **30 jours** | Court = contraction + rebond (5,1 → 3,6 /sem., 7 j. +123 %). Moyen = tirage vertical qui tient (texte « Tractions pronation » **doublé**). Long = encore la continuité −32 % / −30 %. | Seule plage où le court terme **colle** au phénomène. Le long terme n’est toujours pas un parcours depuis le début. |
| **3 mois** (29,2 km, 58 jours) | Court = **même titre** contraction, mais chiffres **0,6 → 4,5 /sem. « 30 % de moins »**. Long = palier Tractions pronation ~20 reps. | La fenêtre Recap 3 mois a faussé la paire « avant / maintenant » tout en gardant le gabarit 28 j. Le bandeau a de la course ; le court terme n’en parle pas. |

Schéma actuel, tel qu’observé :

```
Période Recap  →  bandeau de stats
               →  pool de lectures déjà étiquetées court/moyen/long
               →  quotas 4 / 3 / 2  (`HORIZON_LIMITS` dans recapAdaptiveInsights.js)
               →  une carte par boîte, même si la question n’appartient pas à la fenêtre
```

Schéma visé :

```
Historique complet
        │
        ├── fenêtre Recap = *quelles données sont assez denses pour calculer*
        │
        ↓
Moteur (faits → métriques → comparaisons → événements / tendances)
        │
        ├── Maintenant     (événement récent)
        ├── Trajectoire    (dynamique sur des semaines)
        └── Parcours       (évolution depuis le début)
                │
                ↓
        Insights classés (importance × confiance × nouveauté × objectif)
```

La période **ne crée plus** de types d’analyses. Elle **autorise** ou **interdit** un calcul.

### 13.3 Ce que les trois colonnes doivent répondre

**Maintenant** (ex-court) — *Qu’est-ce qui caractérise la pratique actuelle, et qu’est-ce qui vient de changer ?*

Dernières séances, semaine en cours, rebond, PR récent, exo repris / abandonné cette semaine, dernière course, changement brutal de fréquence ou de dose, fatigue/récup **si mesurable**.  
Exemple cible (données § 12, 30 j.) : *Ta semaine repart après un creux. Volume 7 j. +123 % alors que 28 j. −32 %. La baisse mensuelle ne décrit pas ton rythme actuel : tu es en reprise.*

**Trajectoire** (ex-moyen) — *Quelle dynamique est en train de devenir vraie ?*

Progression / plateau des mouvements suivis, spécialisation, push/pull, adhérence, expo × perf, remplacement d’exercices, dose.  
Exemple cible : *La poussée devient l’axe dominant sur les semaines récentes ; le tirage est moins exposé mais les références verticales tiennent encore. Baisse d’exposition au tirage ≠ perte visible de performance.*

**Parcours** (ex-long) — *Qu’est-ce que la relation à Momentum raconte ?*

Pas la règle générale « ce qui revient progresse ». L’**histoire** : depuis la première saisie, jalons, records, abandons, transformation du profil, périodes de meilleure progression, rapport à l’objectif.  
Exemple cible : *Depuis ta première référence fiable de tractions, +X %. Premier niveau Y, meilleur Z, niveau habituel actuel W. Tu as connu N pauses > 14 j. ; après les précédentes, le niveau revenait en moyenne après K séances.*

Libellés UI possibles (pas forcément à changer tout de suite) : **Maintenant / Trajectoire / Parcours** plutôt que Court / Moyen / Long.

### 13.4 Pipeline interne (cinq briques, pas trois colonnes)

Avant d’ajouter des analyses, le moteur doit devenir :

```
1. DONNÉES BRUTES     séances, séries, reps, charge, durée, distance, programme, Garmin…
2. MÉTRIQUES          volume, fréquence, moyenne, médiane, PR, niveau habituel, densité…
3. COMPARAISONS       vs précédent / historique / record / moyenne perso / période équivalente
4. DÉTECTION          progression, plateau, reprise, abandon, palier, changement structurel
5. INSIGHT            une phrase humaine + preuve + confiance — seulement si (4) est solide
```

Trois **niveaux d’affichage**, pas trois durées :

| Niveau | Contenu | Quand l’afficher |
|--------|---------|------------------|
| 1. Faits | 15 séances, 4 556 reps, +12 % vs période précédente | Toujours, surtout dans le bandeau Recap (déjà là) |
| 2. Évolutions | Le volume diminue depuis 3 semaines ; les tractions progressent quand même | Si la comparaison est comparable |
| 3. Interprétations | « La capacité ne suit pas encore la baisse d’exposition » | **Seulement** si faits + évolutions tiennent ; sinon silence |

Chaque insight doit porter une **preuve** explicite (base, fenêtre, n séances) et une **confiance**. Exemple de contrat :

```
Titre
Corps (1 idée)
Base : 18 séances comparables sur 92 jours
Confiance : élevée
Interprétation (niveau 3, optionnelle) : …
```

Le score brut `efficacité ~ −1,86` (§ 12.2) ne satisfait pas ce contrat. Remplacer par des rapports **lisibles** : volume → perf, fréquence → progression, charge → progression — puis éventuellement « rendement : favorable / défavorable » **avec** l’explication.

### 13.5 Sélection : plus de quotas 4 / 3 / 2

Aujourd’hui : `HORIZON_LIMITS = { short: 4, medium: 3, long: 2 }` + plancher de lecture si la pratique n’est pas vide. Ça **force le remplissage** et produit les combinaisons du § 12.

Cible :

```
phénomènes détectés
    → score importance
    → score confiance
    → score nouveauté
    → score utilité pour l’objectif
    → déduplication
    → sélection
```

Si rien n’est intéressant : **rien**. Si une période exceptionnelle permet d’en dire 5 : 5. Un ordre de grandeur UI (pas un plancher) : Maintenant 0–3, Trajectoire 0–5, Parcours 0–3.

Hiérarchie visuelle :

| Rang | Exemples |
|------|----------|
| Important | PR majeur, régression confirmée, longue interruption, changement structurel |
| Significatif | progression, plateau, changement de répartition |
| Intéressant | record secondaire, nouveau mouvement, nouvelle habitude |
| Statistique | petit delta sans conséquence — **bandeau**, pas colonne |

### 13.6 Couche `athleteJourney` — depuis le début de Momentum

C’est la brique **absente**. Le long terme actuel compare encore trop 90 j. vs 90 j. (ou first vs last sur le trimestre). Il ne raconte pas *cet* athlète depuis sa première saisie.

Objet visé (interne, pas du texte) :

```
ATHLETE_JOURNEY
├── première séance enregistrée (date)
├── totaux depuis le début (séances, jours, reps, heures, km, records)
├── par exercice suffisamment documenté
│     première donnée
│     première référence fiable   ← distincte de la première saisie
│     niveau établi / habituel (moyenne + médiane récentes)
│     meilleur niveau (PR) + date du PR + âge du record
│     niveau actuel
│     n séances, fréquence, paliers franchis
│     périodes de progression / stagnation / régression confirmée
│     abandons / remplacements de variante
└── transformation du profil (push/pull/jambes/cardio début vs maintenant)
```

**Première saisie ≠ première référence fiable.** Une première séance exceptionnelle ou mal renseignée fausse le +108 %. La narration « depuis tes débuts » doit s’appuyer sur la référence fiable dès qu’elle existe.

**PR ≠ niveau réel.** Contrat de phrase : *Ton record est de 20 reps, mais ton niveau habituel est autour de 17–18.* `performanceRobustness.js` (`LEVEL_ESTABLISHED`, `PR_EVENT`, `OUTLIER`) est déjà une amorce — **non projetée** comme parcours.

Système de niveaux (événements, pas des cartes permanentes) : nouveau record, record égalé, nouveau niveau (moyenne qui monte), niveau consolidé (reproduit), stagnation, régression potentielle, reprise, déclin confirmé.

Chaîne que le produit doit finir par poser, dans cet ordre :

> Qu’est-ce que j’ai fait ? → **Qu’est-ce qui a changé ?** → **Depuis quand ?** → **Est-ce réel ou ponctuel ?** → **Qu’est-ce que ça signifie pour la progression ?**

### 13.7 Familles d’analyses (catalogue, pas un sprint)

Chaque famille a une **nature** (Maintenant / Trajectoire / Parcours) et un **recul minimum**. Si le recul manque : silence, pas de gabarit.

| Famille | Question | Recul typique | Déjà amorcé ? |
|---------|----------|---------------|----------------|
| État actuel | Que se passe-t-il maintenant ? | 0–14 j. | Partiel (`continuity`, contraction) |
| Évolution récente | Qu’est-ce qui a changé ? | 7–28 j. | Oui (`volume_traj`, 7 vs 28) |
| Progression réelle d’un exo | First / actuel / % / n séances au palier | dès 6–8 séances comparables | Faible (`continuity_level` = first vs last) |
| PR vs niveau habituel | Record vs moyenne/médiane récente | idem | Amorcé (robustesse), **non raconté** |
| Niveau consolidé | Palier reproduit vs PR isolé | plusieurs séances au niveau | Lecture `palier` 3 mois (§ 12.4), trop mince |
| Depuis quand | Jours depuis dernière expo / depuis un niveau | timeline | Oui pour absences (`recapTrainingTimeline`) |
| Première fois / dernière fois | Date du premier 20 pompes, dernière fois, durée de maintien | historique complet | Non |
| Paliers | 5 → 8 → 10 → 15 → 20 reps | historique complet | Non |
| Vitesse de progression | Jours entre paliers, accel / ralentissement | assez de paliers | Non |
| Plateaux | Niveau moyen stable X semaines malgré volume ↑ | 6+ sem. | Non |
| Expo ↓ et perf ↑ (ou l’inverse) | Distinction exposition / capacité **dans le temps** | 8+ sem. | Amorcé (cartes séparées, pas une série temporelle) |
| Rendement explicable | +20 % volume / +8 % perf — **pas** −1,86 | 28–90 j. | Variable `progressionEfficiency` illisible |
| Régularité | Semaines dans la plage, pas seulement streak | 8–18 sem. | Identité fréquence ; streak = bandeau |
| Densité | Reps/h, volume/séance, exos/séance, durée | dès que la durée existe | `avgExercisesPerSession` ≠ durée (piège § 4.2) |
| Structure de séance | Plus long mais pas plus de volume → densité ↓ | 28 j.+ | Non |
| Spécialisation / équilibre | Parts push/pull/jambes/core **comparées** 7 / 30 / 90 | 30 j.+ | `push_share` / `specialization` (une photo, pas un tableau) |
| Mouvements abandonnés / nouveaux / repris | Dernière expo vs fréquence d’avant ; niveau à la reprise | 30 j.+ vs historique | Absence oui ; remplacement de variante partiel ; reprise perf non |
| Longévité d’un record | PR établi il y a N jours, jamais dépassé | historique | Non |
| Meilleure période par **dimension** | Meilleur mois volume ≠ meilleur mois perf ≠ meilleur mois régularité | 3 mois+ | Bandeau « meilleurs mois » = max de la **même** métrique |
| Comparateurs multiples | vs précédent / moyenne / meilleur / équivalent / record | selon métrique | Surtout vs fenêtre précédente |
| Jalons & premières fois | Premier lest, première semaine à 5, premier 10 km | historique | Événements `pr_reps` ponctuels |
| Quand tu progresses le mieux | Conditions associées (fréquence, expo, sommeil) | beaucoup de données | **Association observée**, jamais « cause » |
| Objectif vs comportement | Objectif défini → expo réelle → progression | depuis le quiz | 3 portes de texte (§ 8.2) |
| Transformation du profil | Mix début vs maintenant | depuis le début | Non |

**Équilibres** à traiter comme un graphe, pas un slogan « tu te spécialises » : poussée/tirage, haut/bas, force/endurance, cardio/muscu, vertical/horizontal, unilatéral/bilatéral, lesté/poids du corps. Toujours en **parts + delta en points** (ex. poussée +9 pts en 3 mois), pas en verdict.

**Régularité** : streak max 9 est une métrique de bandeau. La colonne doit pouvoir dire *4 / 5 semaines dans ta plage* ou *fréquence irrégulière malgré un volume moyen élevé* (2 → 6 → 1 → 5).

Ne **pas** implémenter ce tableau comme 30 `kind` de plus. Chaque famille alimente la détection (brique 4) ; l’UI n’en montre qu’une fraction classée.

### 13.8 Ce que les pages pourraient afficher (structure UI, optionnelle)

Les trois colonnes restent le **cœur**. Autour, si besoin, des blocs qui ne sont plus des « horizons » :

- Ce qui se passe actuellement (Maintenant)
- Ce qui évolue (Trajectoire)
- Tes progressions / ce qui se consolide
- Structure (répartition, équilibre)
- Ce qui change (nouveaux, abandonnés, volume, fréquence)
- **Depuis tes débuts** (biographie sportive — peut vivre dans Parcours *ou* dans un bandeau dédié)
- Explorer (toutes les analyses, jamais en page d’accueil)

Ce n’est pas la priorité d’écran. La priorité est que **les trois colonnes cessent de se mentir**.

### 13.9 Recollage sur les données du 1er sept. (cible, pas l’écran actuel)

À la place du triplet course / spécialisation / continuité (Aujourd’hui) ou course / −1,86 / dips du trimestre (7 j.), un analyste dirait plutôt :

1. **Exposition en baisse sur le mois, déjà en reprise cette semaine** — 28 j. −32 %, 7 j. +123 %, 3,5 /sem. dans 2,7–5,5. Baisse d’exposition ≠ régression démontrée. Confiance élevée. Nature : **Maintenant**.
2. **La poussée est devenue l’axe dominant, assez pour un changement de structure** — parts à comparer 7 / 30 / 90, pas « progressivement plus spécialisé » calé sur une journée. Nature : **Trajectoire**.
3. **Les références de tirage tiennent encore** — tant que les séries réalisées restent dans la plage, « pull en baisse » décrit le calendrier. Nature : **Trajectoire** (expo × capacité).
4. **La course est sortie de la routine** — dernière le 27/07, 35 j., 20 séances entre-temps, habitude ~4 j. Qualité délaissée, pas arrêt du sport. Nature : **Maintenant**, *preuve* historique. Sur un filtre Aujourd’hui / 7 j., c’est légitime **en second**, pas à la place de la contraction si le DEV l’a déjà.
5. **Parcours** (quand les séries sont assez nombreuses) : depuis la première référence fiable, +X % tractions / pompes / dips ; PR vs niveau habituel ; éventuellement palier consolidé ~20 reps **avec** n séances au palier, pas seulement le mot « consolidé ».

C’est la même matière. Ce n’est plus le même découpage.

### 13.10 Ordre de chantier (après ce diagnostic)

**Interdit en premier :** « ajoute 30 nouvelles analyses ». Ça recréerait exactement le défaut actuel (plus de `kind` poussés dans les mêmes trois boîtes).

Ordre :

1. **Redéfinir les trois colonnes dans le moteur** — un phénomène a une *nature* (événement / dynamique / parcours), pas un tag `short|medium|long` calé sur 7/28/90. La période Recap **filtre la confiance** (assez de données dans la fenêtre ? assez de recul hors fenêtre pour la preuve ?).
2. **Couper les quotas et le plancher** — plus de carte pour remplir. Si le court terme d’« Aujourd’hui » n’a qu’un fait de séance, le bandeau suffit.
3. **Projeter les phénomènes déjà détectés** (`contraction_with_rebound`, `specialization_push`, `low_adherence`, `observed_output_indeterminate`) vers Maintenant / Trajectoire, au lieu de laisser `absence` gagner Aujourd’hui et 7 j. alors que le DEV liste déjà la contraction.
4. **Couche `athleteJourney`** — première référence fiable, PR vs niveau habituel, depuis quand, totaux depuis le début. C’est ce qui donne enfin un vrai Parcours. Réutiliser `performanceRobustness` + timeline ; ne pas réécrire des stats first vs last.
5. **Preuve + classements** — base / confiance / importance sur chaque carte ; rendement lisible ; spécialisation en tableau de parts, pas en slogan.
6. **Ensuite seulement**, enrichir les familles § 13.7 une par une (plateaux, paliers, abandons/remplacements, densité réelle, meilleure période par dimension).

Architecture conceptuelle à poser **avant** le catalogue :

```
                 ATHLETE JOURNEY
                       │
     ┌─────────────────┼─────────────────┐
     │                 │                 │
  MAINTENANT       TRAJECTOIRE        PARCOURS
  0–14 jours       2–12 semaines      Depuis le début
  événements       dynamiques         évolutions
  reprises, PR     progression        jalons, records
  absences, rebonds  plateau, mix     premières fois
                       │
                       ↓
               PHÉNOMÈNES COMPOSÉS
                       ↓
            objectif + identité
                       ↓
         importance / confiance
                       ↓
                  sélection
```

### 13.11 Diagnostic final (recalé au 01/09/2026)

Le moteur sait déjà beaucoup de choses sur l’athlète (comparaison à soi, identité, chronologie, progression, relations, programme, garde-fous, phénomènes). **Il ne sait pas encore quelle histoire mérite d’être racontée**, ni **pour quelle nature temporelle**.

D’où l’impression que Court / Moyen / Long sont arbitraires : ce n’est pas un problème de copy, c’est que le filtre de période et les trois colonnes posent **deux questions différentes** et que le code répond avec **un seul pool étiqueté**.

| Couche | 31 août (§ 11.5) | Cible § 13 |
|--------|------------------|------------|
| Données / 7-28-90 | 8,5 | Garder ; cesser d’en faire des catégories UI |
| Phénomènes | 5 | Les projeter par **nature**, pas par quota |
| Parcours depuis le début | ~0 | `athleteJourney` |
| Preuve / rendement lisible | faible | Contrat insight § 13.4 |
| Quotas colonnes | 4/3/2 | Sélection ou silence |
| **Modèle de l’athlète** | ~6 | ~6 + une **mémoire narrative** (ce qui a changé, depuis quand, est-ce réel) |

Le texte plus intelligent n’est plus le levier. La **nature de chaque analyse** et la **mémoire depuis la première saisie** le sont.

### 13.12 Phase 1 implémentée (1er sept. 2026)

Sans ajouter de nouvelles familles d’analyses. Changements dans le moteur :

- Module `recapInsightNature.js` : chaque `kind` a une nature fixe (`now` / `trajectory` / `journey`) projetée vers les colonnes short / medium / long.
- La fenêtre Recap ne décide plus le type. Elle sert au **rythme comparable** (28 j. vs 28 j. dès que la plage n’est pas un mois) et au **mix de trajectoire** (pas le split d’une journée).
- Plancher `situation` retiré. Plafonds 2 / 3 / 2, plus de première carte forcée sous le seuil.
- Contraction **gagne** Maintenant sur l’absence (boost + baisse de pertinence). Absence reste `now` même à 35 j.
- `push_share` / `program` / `efficiency` → Trajectoire. Score brut −1,86 retiré du texte.
- Libellés UI : Maintenant / Trajectoire / Parcours.

Pas encore : couche `athleteJourney`, preuve/confiance systématiques, catalogue § 13.7.

### 13.13 Phase 2 implémentée — `athleteJourney` (1er sept. 2026)

Objet interne, pas une 13ᵉ carte collée.

- `src/utils/sport/athleteJourney.js` : historique **depuis le premier check** jusqu’à la fin de la fenêtre Recap.
- Distingue première saisie / première référence fiable (premier jour atypique écarté) / PR / niveau habituel (médiane récente, PR isolé écarté).
- Une lecture Parcours `journey_progress` seulement si ≥ 6 séances, gain ≥ 2 reps et ≥ 15 %. Preuve : n séances, durée, % .
- `journey_pr_vs_level` si le record n’est pas le niveau reproduit, et que ce n’est pas déjà dit dans la progression.
- `continuity_level` (leçon « ce qui revient progresse ») **ne sort plus** dès qu’un vrai parcours existe.
- DEV : ligne « Parcours : depuis … ».

### 13.14 Phase 3 — jalons, plateau, abandon (1er sept. 2026)

Toujours dans `athleteJourney`, toujours **une nature par lecture**, pas un catalogue.

- **Jalons** 5 / 8 / 10 / 12 / 15 / 18 / 20 / 25 / 30 : premier franchissement + jours entre deux paliers + rythme (accélère / ralentit).
- Intégrés dans `journey_progress` (pas une 4ᵉ carte). `journey_milestones` seulement s’il n’y a pas de progression % assez nette.
- **Plateau** (`journey_plateau`, Trajectoire) : niveau habituel dans ±1,5 reps sur ≥ 6 séances et ≥ 28 j., sans palier récent.
- **Abandon / remplacement** (`journey_abandoned`, Maintenant) : pratiqué régulièrement (intervalle médian ≤ 16 j.) puis trou ≥ 21 j. Si une variante de la même famille est encore là, le texte dit remplacement, pas arrêt.
- Preuve : « Base : n séances / jours » + label de confiance sur les lectures parcours.

Pas encore : bandeau biographie dédié, densité réelle (reps/h), meilleure période par dimension.

---

## 14. Architecture inversée — but final et première brique (1er sept. 2026)

Le problème n’est plus principalement la rédaction. Le système produisait une analyse à partir de quelques indicateurs déjà calculés, puis appliquait une logique assez similaire quelle que soit la fenêtre.

Mauvais flux :

```
données → template Court / Moyen / Long → quelques chiffres injectés
```

Bon flux :

```
données → comparaisons pertinentes → constats → interprétations → conclusions → rédaction
```

### 14.1 Chaque période Recap a sa question

Aujourd’hui, 7 jours, 30 jours et 3 mois ne sont **pas** le même rapport avec une période différente.

| Plage | Question |
|--------|----------|
| Aujourd’hui | Qu’est-ce qui caractérise précisément **cette séance** par rapport à ce que je fais habituellement ? |
| 7 jours | Qu’est-ce qui s’est réellement passé **cette semaine**, et comment se compare-t-elle à mon rythme habituel ? |
| 30 jours | Comment mon entraînement récent **évolue-t-il** par rapport aux mois précédents ? |
| 3 mois | Quelle **trajectoire** suis-je réellement en train de construire ? |

Court / moyen / long terme **ne sont pas trois durées**. Ce sont trois **angles** appliqués à la même période :

- **Maintenant** — état actuel, anomalie, contexte immédiat. Comparaisons quantitatives, pas « séance importante ».
- **Trajectoire** — transformations (parts, émergence d’exercices, densité vs fréquence, poussée/tirage).
- **Parcours** — ce que **cette période ajoute** à l’historique. Jamais une deuxième copie du court terme.

### 14.2 Niveau à atteindre (exemples du 31 août / 7 jours)

Ces textes sont le **but de densité** pour toutes les plages, pas seulement Aujourd’hui et 7 jours.

**Maintenant · 7 jours** — 3 séances, 1 049 reps, 3 h 05, ≈350 reps et 1 h 02 par séance, rythme proche de 4,1 séances/semaine mais exposition concentrée. Dominante haut du corps (250 triceps, 169 pecs, 191 épaules, 156 dos, 94 tronc) : les triceps ≈24 % du volume identifié, tirage ≈15 %. La séance du 31 août concentre 360 reps (≈34 %). Aucune course : charge entièrement renforcement.

**Trajectoire · 7 jours** — qualité d’exposition, pas seulement volume : 3 jours espacés mais densité élevée (≈350 reps/séance). Socle hebdomadaire (pompes 100, extensions triceps 60, relevés de genoux 60) ≠ mouvements qui structurent une séance (48 australiennes + 48 dips). 156 dos contre 419 pecs+triceps. Nouveaux / réintroduits suivis à part. Garmin (sommeil, FCR, charge) comme **couche de contexte**, pas une mention en fin de paragraphe.

**Parcours · 7 jours** — la semaine est un **point d’ancrage** : 15/30 jours entraînés vs 3/7, répertoire qui change, 48 dips / 48 australiennes comme nouvelles références, 2 799 kcal actives croisées avec 3 h 05 = profil « peu de jours, séances denses ».

**Maintenant · aujourd’hui** — 360 reps en 1 h 05 = 332 reps/h, soit 4,6 % moins dense que 348 reps/h sur 30 j., proche de 340 reps/h sur 7 j. Épaules 191 = ≈30 % du mois ; pecs 60 ≈9,5 % ; triceps 31 ≈5,1 %. Dos 77 ≈17 % du mois. 48 dips = 25 % des 192 du mois ; 60 relevés = 25 % des 240.

**Trajectoire · aujourd’hui** — réorientation épaules, tirage encore fréquent, dips très exposés sur peu de séances, volume/séance stable (360 ≈ 350). Le signal est la **composition**, pas une hausse/baisse brutale de quantité.

**Parcours · aujourd’hui** — 360 reps = 7,9 % des 4 556 du mois (15 jours entraînés). Mouvements de référence assez fournis pour un suivi séparé. Écart au profil trimestriel (17 916 reps). Continuité : 15/30 et 58/≈90. On mesure ce que la séance **ajoute au niveau de référence**, pas un record isolé.

### 14.3 Pipeline à 7 étapes

1. **Mesure** — métriques de la fenêtre Recap (mêmes sources que le bandeau : reps, jours, durée, kcal, course, exercices, muscles).
2. **Normalisation** — comparaison à 7 j., 30 j., 90 j., habitude identité, séances comparables.
3. **Détection** — progressions, anomalies, nouveaux / réintroduits, parts musculaires, ratios, concentration d’une journée, jalons.
4. **Scoring** — importance × fiabilité × nouveauté × pertinence pour la question de la période.
5. **Anti-répétition** — une famille par constat ; pas deux fois « le volume baisse ».
6. **Attribution d’angle** — Maintenant / Trajectoire / Parcours selon la *nature* du constat.
7. **Rédaction** — l’essai transforme uniquement les découvertes retenues (2 / 3 / 2 max).

### 14.4 Phase 4 implémentée — `recapPeriodDiscoveries`

Module : `src/utils/sport/recapPeriodDiscoveries.js`.

- Mesure la fenêtre Recap + 7 / 30 / 92 jours se terminant à `window.end`.
- Densité réelle **reps/h** dès que les minutes d’exos (Garmin street / bandeau) existent.
- Découvertes typées (`disc_density`, `disc_muscle_reorient`, `disc_exercise_share`, `disc_peak_day`, `disc_emergence`, `disc_anchor`, …) avec preuves chiffrées.
- Sur **Aujourd’hui** et **7 jours**, ces découvertes **remplacent** les lectures génériques `continuity` / `volume_traj` (plus de « cycle de quelques semaines » sur un jour).
- DEV : question de la période + découvertes scorées.

On ajoute une source ou une règle → une nouvelle découverte → le moteur décide si elle mérite d’apparaître.

### 14.5 Phase 5 implémentée — baselines, comparables, Garmin, mémoire

Module : `src/utils/sport/recapPersonalBaselines.js`, branché sur le même moteur de découvertes.

- **Niveau habituel par exercice** : moyenne, médiane, P25/P75, dernier, moyenne récente, moyenne initiale, record, consolidé. Lecture type : « 48 dips vs habituel 36, +33 % » — pas un PR isolé.
- **Séances comparables** : recouvrement d’exercices + volume + durée, jamais « vs hier » par défaut.
- **Progression consolidée** : premières séances vs niveau récent, avec distinction record / niveau reproduit.
- **Couche Garmin** : sommeil (et FCR si présent) comme contexte de séance ; association sommeil → reps sur les mouvements de référence, formulée « tes données montrent une association », jamais « le sommeil provoque ».
- **30 jours** : comparaison au **mois précédent** (pas un template recopié).
- **Mémoire** : une découverte déjà montrée récemment voit son score baisser.

### 14.6 Phase 6 — sources alignées + niveau de référence

Les chiffres des colonnes doivent être ceux du bandeau / du mesh Recap, pas un deuxième modèle.

- **Reps, minutes, kcal, jours, course** : `computeCalendarMonthSportStats` (même pile que le bandeau).
- **Muscles** : `computeRecapMuscleState` sur la **fenêtre exacte** (plus de split égalitaire maison). `recapState` n’est réutilisé que s’il a la même fenêtre.
- **Noms / totaux d’exercices** : `resolveExerciseNameForRecap` + coches + pompes endurance, comme le comparateur force.
- **Bandeau** : `buildRecapStrengthCompareModel` reçoit maintenant `periodWindow`, plus `new Date()` implicite.
- **Jour de pic** : exercices **de ce jour**, pas le top de la période.
- **Ratios** poussée/tirage, haut/bas, volume/jour, reps/h.
- **Part musculaire vs 30 j. précédents** (changement de structure).
- **Association repos ≥ 48 h** vs séance J+1 (formulation « association », jamais cause).
- **3 mois** : comparaison premier mois de la fenêtre vs 30 derniers jours (trajectoire interne).
- Sommeil tissé dans la lecture de densité quand les minutes Garmin existent.

### 14.7 Phase 7 — mémoire structurelle, mix de stimulus, cardio ↔ muscu

Module : `src/utils/sport/recapStimulusCatalog.js`, branché sur `detectDiscoveries`.

- **Mémoire narrative** (`disc_structural_memory`) : un mouvement « devient structurel » quand sa part dans une famille (poussée / tirage / jambes / tronc) saute nettement vs les 30 jours d’avant — type « les dips structurent désormais ta poussée », pas un simple top d’exercice.
- **Mix de stimulus** (`disc_stimulus_mix`) : parts **poly / isolation**, **force / endurance musculaire**, **lesté / poids du corps**, comparées à la référence récente. Toujours en parts, jamais « tu te spécialises ».
- **Cardio ↔ muscu** (`disc_cardio_strength`) : km / minutes de course **et** reps / minutes de renforcement dans la même lecture. Silence s’il n’y a pas de course. Si les deux évoluent en sens inverse, le texte le dit (plus musclé / plus cardio).

### 14.8 Phase 8 — 30 jours et 3 mois au grain du § 14.2

Les plages 30 j. / 3 mois ne reprennent plus le gabarit « ta pratique s’est contractée ». Dès qu’une découverte `now` existe, c’est elle qui occupe Maintenant.

- **30 jours** : volume + durée + reps/séance **contre le mois précédent** ; rebond 7 j. / retrait 28 j. tissés dans la même lecture ; densité reps/h vs **prev30** (plus vs soi-même).
- **3 mois** : totaux de période + rythme **28 j. vs 28 j.** (jamais 0,6 → 4,5 inventé sur la fenêtre) ; meilleur mois calendaire (`disc_best_month`) ; arc premier mois ↔ 30 derniers jours.
- **Mix** : vertical / horizontal et unilatéral / bilatéral ajoutés aux parts force / endurance / poly / charges.
- **Abandon familial** (`disc_family_fade`) : « 18 % de la poussée → 4 % », distinct d’un simple top d’exercice.

### 14.9 Phase 9 — la sélection affiche ce qui répond à la question

Trop de constats valides se marchaient dessus : le gabarit « contraction / spécialisation / programme » pouvait encore gagner les 2 / 3 / 2 places.

- **Priorité par plage** (`PERIOD_DISCOVERY_PRIORITY`) : 30 j. force `volume_shape` + mois d’avant en Maintenant, `best_month` en Parcours ; 3 mois force le rythme 28 j. et l’arc trimestriel.
- **Rivaux** : on ne montre pas deux lectures qui disent la même chose (`muscle_now` + `push_pull`, `quarter_arc` + `quarter_profile`, émergence + fade, etc.).
- **Essais génériques coupés** dès qu’une découverte couvre l’angle (plus de `specialization` / `performance` / `program` en doublon).
- **Poids UI** : les `disc_*` sont favorisés dans la sélection des colonnes.

**Cas 0 reps (séance pas encore faite)** : ce n’est pas un jour vide d’analyse. `disc_pending_session` décrit l’attente (dernière séance, jours de la semaine comparables, nuit déjà là). `disc_pending_context` lit la semaine autour. Jamais le gabarit « ta pratique s’est contractée » sur un aujourd’hui à zéro.

### 14.10 Phase 10 — Parcours complémentaire + cardio plus fin

- `journey_progress` ne double plus `disc_exercise_progress` (même histoire). Il reste si le Parcours raconte encore *depuis la première saisie*, distinct du meilleur mois.
- Course ↔ renforcement : part du **temps** d’activité en course, pas seulement km vs reps.

---

## 15. Second but — analyses sommeil liées à l’entraînement

Le § 14 reste le **premier but**. Il n’est pas à 100 %. On le conclut **avant** d’écrire les analyses sommeil.

Ce § 15 est un **but supplémentaire**, pas un remplacement. Les exemples ci-dessous sont le niveau à atteindre **en plus** des textes sport du § 14.2, pour toutes les plages (Aujourd’hui, 7 jours, 30 jours, 3 mois) et les trois angles (Maintenant / Trajectoire / Parcours — ici libellés Court / Moyen / Long terme comme dans les textes cibles).

**État au 1er septembre 2026 :** les nuits Garmin / calendrier sont **branchées** (`src/utils/sport/recapSleepNight.js` → catalogue de séances + `sleepContextForDate`). Le moteur de candidats et une partie des textes § 15.1 existent. Si une variable manque, **rien** n’est affiché. « Pas assez de données de sommeil » n’est pas une analyse ; c’est un état du moteur.

Convention calendaire : le sommeil de la date D = la nuit qui **se termine** le matin D = récupération **avant** la séance du jour D.

---

### 15.1 Exemples cibles — mot pour mot

#### Aujourd’hui — Court terme

Une nuit correcte en durée, mais une récupération moins complète

Cette nuit, tu as dormi 7 h 46, contre 7 h 58 de moyenne sur tes 7 dernières nuits. L'écart de 12 minutes est faible et ne constitue donc pas une réduction significative de ton temps de sommeil. La différence se situe davantage dans l'architecture : 1 h 02 de sommeil profond, 1 h 31 de REM et 5 h 13 de sommeil léger, avec seulement 18 minutes éveillé. Ton sommeil est donc resté relativement continu malgré une durée légèrement inférieure à ton niveau récent.

La nuit précédente te place dans une zone favorable à ton volume habituel

Sur les séances réalisées après au moins 7 h 30 de sommeil, ton volume moyen atteint 338 reps, contre 251 reps lorsque le sommeil passe sous 7 h 30. La nuit dernière, avec 7 h 46, te situe donc dans la plage où ton historique montre habituellement tes séances les plus volumineuses. Ta séance d'aujourd'hui atteint justement 360 reps, soit 22 reps au-dessus de cette moyenne.

Le sommeil ne joue pas seulement sur le volume

Tes séances réalisées après des nuits d'au moins 7 h 30 présentent également une durée moyenne de 1 h 03, contre 52 minutes après les nuits sous 7 h 30. Aujourd'hui, tu t'entraînes pendant 1 h 05. La combinaison sommeil + durée d'entraînement correspond donc très précisément à ton profil de journées où l'exposition est élevée.

Récupération physiologique

Ta fréquence cardiaque nocturne moyenne est de 57 bpm, contre 59 bpm sur les 7 dernières nuits, tandis que ton Body Battery passe de 38 à 92 pendant la nuit. La recharge atteint donc +54 points, contre +47 points en moyenne. La nuit est ainsi meilleure que ton niveau récent sur deux indicateurs de récupération indépendants de la seule durée de sommeil.

#### Aujourd’hui — Moyen terme

Ta séance s'inscrit dans une plage de performance associée à un sommeil suffisant

Sur les 14 dernières séances, les journées précédées d'au moins 7 h 30 de sommeil totalisent en moyenne 347 reps, tandis que celles précédées de moins de 7 h 30 atteignent 238 reps. L'écart est de 109 reps par séance, soit environ 46 % de volume supplémentaire dans la plage de sommeil la plus élevée.

Aujourd'hui, avec 7 h 46 de sommeil et 360 reps, tu te situes au-dessus des deux références : +13 reps par rapport aux séances similaires réalisées après une nuit ≥ 7 h 30 et +122 reps par rapport aux séances suivant une nuit < 7 h 30.

Le seuil des 7 h 30 apparaît nettement dans ton historique récent

Sur les 14 séances étudiées, 10 des 11 séances dépassant 300 reps ont été précédées d'au moins 7 h 30 de sommeil. À l'inverse, 5 des 6 séances sous 250 reps ont suivi une nuit inférieure à 7 h 30. Ton historique récent montre donc une séparation très nette entre les journées à forte exposition et les nuits courtes.

Le phénomène concerne surtout la quantité de travail réalisée : les performances individuelles sur un exercice donné varient moins fortement que le volume total de séance. Le sommeil semble donc davantage associé à ta capacité à maintenir une séance longue et volumineuse qu'à une augmentation automatique de chaque série.

La continuité du sommeil renforce cette relation

Les séances dépassant 300 reps ont été précédées de nuits comportant en moyenne 24 minutes éveillé, contre 41 minutes pour les séances sous 250 reps. Aujourd'hui, tu n'as passé que 18 minutes éveillé. Tu cumules donc une durée de sommeil élevée avec une continuité supérieure à celle observée dans tes journées à faible volume.

#### Aujourd’hui — Long terme

Ton historique commence à faire apparaître une véritable zone de fonctionnement

Sur les trois derniers mois, tes journées d'entraînement les plus productives ne se répartissent pas uniformément selon le sommeil. Les séances dépassant 300 reps apparaissent majoritairement après des nuits d'au moins 7 h 30, alors que les journées sous 200 reps sont beaucoup plus fréquentes après des nuits courtes ou irrégulières.

Le seuil le plus discriminant de ton historique se situe autour de 7 h 30–8 h : au-dessus de cette zone, ton volume moyen atteint environ 340 reps ; entre 6 h 30 et 7 h 30, il descend autour de 270 reps ; sous 6 h 30, il tombe autour de 190 reps.

Ton sommeil semble davantage déterminer ton potentiel de volume que ta fréquence d'entraînement

Les périodes où tu dors suffisamment ne correspondent pas seulement à davantage de séances : elles correspondent également à des séances plus longues et plus volumineuses. En juin, par exemple, tu réalises 6 651 reps sur le mois, avec 21 jours entraînés et 17 h 40 d'exercice. Sur les périodes de moindre exposition, la diminution du volume s'accompagne aussi d'une fréquence de sommeil moins régulière.

Ton historique montre donc deux variables qui évoluent ensemble : la continuité de la pratique et la continuité du sommeil. Les meilleurs mois d'entraînement ne sont pas uniquement ceux où tu accumules le plus de jours actifs ; ce sont également ceux où ton sommeil permet de maintenir cette exposition.

#### 7 jours — Court terme

Ta semaine présente une relation claire entre sommeil et charge quotidienne

Sur les 7 derniers jours, tu as dormi en moyenne 7 h 34, avec une amplitude allant de 6 h 41 à 8 h 12. Tes trois journées d'entraînement totalisent 1 049 reps. La journée à 360 reps suit la meilleure nuit de la semaine avec 7 h 46, tandis que la séance à 329 reps suit 8 h 12 de sommeil. La troisième journée, à 360 reps, complète le volume hebdomadaire après une nuit de 7 h 04.

Les deux nuits supérieures à 7 h 30 précèdent donc 689 des 1 049 reps de la semaine, soit 66 % du volume hebdomadaire, alors qu'elles représentent seulement 29 % des nuits observées.

Le sommeil profond reste stable malgré les variations de durée

Ton sommeil profond varie entre 54 minutes et 1 h 18, alors que la durée totale varie de plus d'une heure et demie. Cette stabilité relative signifie que tes nuits courtes proviennent principalement d'une réduction du sommeil léger et du REM, plutôt que d'une disparition proportionnelle du sommeil profond.

Le REM présente en revanche une amplitude plus importante : 1 h 08 sur la nuit de 6 h 41 contre 1 h 46 sur la nuit de 8 h 12. Les nuits longues augmentent donc principalement l'espace disponible pour le REM dans ton profil récent.

Ton Body Battery confirme la différence entre durée et récupération

Les nuits dépassant 7 h 30 produisent en moyenne +52 points de Body Battery, contre +38 points sous ce seuil. La différence de 14 points par nuit est cohérente avec l'écart observé dans le volume d'entraînement du lendemain.

#### 7 jours — Moyen terme

La semaine montre déjà une relation dose-réponse

Tes journées précédées de plus de 7 h 30 de sommeil atteignent 344 reps en moyenne, contre 238 reps après les nuits plus courtes. L'écart de 106 reps représente environ 45 % de volume supplémentaire.

La relation devient encore plus nette avec les nuits dépassant 8 h : les journées suivantes atteignent 360 reps en moyenne, soit environ 51 % de plus que les journées suivant moins de 7 h 30.

Le facteur déterminant n'est pas uniquement la durée

Les journées dépassant 300 reps sont associées à 7 h 52 de sommeil moyen, 1 h 21 de REM, 1 h 07 de profond et +55 points de Body Battery pendant la nuit précédente. Les journées sous 250 reps sont associées à 6 h 58, 1 h 09 de REM, 54 min de profond et +39 points de Body Battery.

La différence entre tes journées fortes et faibles apparaît donc simultanément sur la durée, le REM et la recharge nocturne, tandis que le sommeil profond reste beaucoup plus stable.

La régularité du sommeil accompagne la régularité de l'entraînement

Tes trois journées d'entraînement de la semaine sont espacées de 1 à 2 jours, tandis que tes horaires de coucher oscillent de seulement 1 h 04. Sur les semaines où cette amplitude reste sous environ une heure et demie, ton volume moyen dépasse 320 reps par séance. Les semaines présentant des décalages horaires plus importants descendent autour de 270 reps par séance.

#### 7 jours — Long terme

Ton sommeil récent confirme un profil déjà visible dans l'historique sportif

Les 1 049 reps réalisées cette semaine ne représentent pas simplement trois séances isolées : elles prolongent une relation déjà observable sur les périodes précédentes entre sommeil suffisant et capacité à maintenir un volume élevé.

Ton profil actuel place 7 h 30 de sommeil comme une frontière particulièrement informative : au-dessus, ton volume moyen se situe autour de 340 reps ; en dessous, il se rapproche de 240–250 reps. Le seuil ne signifie pas qu'une nuit courte empêche mécaniquement l'entraînement ; il sépare surtout deux régimes de volume qui apparaissent régulièrement dans ton historique.

Les nuits longues semblent également favoriser la répétition des bonnes journées

Tes semaines contenant au moins 4 nuits au-dessus de 7 h 30 présentent une moyenne de 4,1 jours actifs, contre 2,8 jours lorsque ce seuil n'est atteint que deux fois ou moins. La différence porte donc à la fois sur le nombre de jours où tu t'entraînes et la quantité de travail réalisée lors de ces journées.

#### 30 jours — Moyen terme

Ton mois révèle un lien beaucoup plus robuste

Sur les 30 derniers jours, tu as réalisé 15 jours d'entraînement pour 4 556 reps, soit environ 304 reps par jour entraîné. Les journées précédées d'au moins 7 h 30 de sommeil représentent 9 séances et concentrent 3 270 reps, soit 80 % de ton volume réalisé, alors qu'elles représentent seulement 60 % de tes séances.

Les sept nuits sous 7 h 30 sont associées à seulement 820 reps, soit 117 reps par nuit courte, contre 364 reps par nuit suffisamment dormie lorsqu'on rapporte le volume à la fréquence des journées suivantes.

La durée du sommeil explique davantage le volume que le nombre de séances

Ton mois compte 15 jours entraînés, mais la différence entre les journées fortes et faibles vient surtout du volume réalisé à l'intérieur de ces journées. Les séances suivant plus de 7 h 30 totalisent en moyenne 363 reps, contre 205 reps après une nuit courte.

La différence atteint 158 reps par séance. Une partie importante de ton volume mensuel est donc concentrée derrière un nombre relativement limité de nuits bien récupérées.

Le sommeil profond n'est pas le principal facteur discriminant

Ton sommeil profond mensuel reste autour de 1 h 05 par nuit, avec seulement quelques minutes d'écart entre les journées à haut et faible volume. Le facteur qui distingue le mieux les deux profils est la durée totale, suivie du REM et de la recharge Body Battery, plutôt que le temps passé en sommeil profond.

#### 30 jours — Long terme

Ton profil de récupération se précise

Sur les 30 jours, tes données établissent trois zones comportementales :

≥ 8 h de sommeil : environ 364 reps le lendemain.
7 h 30–8 h : environ 335 reps.
< 7 h 30 : environ 205 reps.

La différence entre la première et la troisième zone atteint 159 reps, soit environ 77 % de volume supplémentaire après les nuits de plus de 8 h.

Le sommeil agit surtout sur ta capacité à maintenir l'exposition

Tes meilleures journées ne correspondent pas systématiquement à tes meilleures performances sur chaque exercice. Elles correspondent surtout aux journées où tu parviens à accumuler beaucoup de travail sans réduire fortement la durée de la séance.

C'est particulièrement visible avec tes 360 reps en 1 h 05 : le sommeil ne se traduit pas simplement par une meilleure série de tractions ou de dips ; il apparaît dans ta capacité globale à maintenir une séance complète avec plusieurs mouvements et plusieurs groupes musculaires.

#### 3 mois — Long terme

Le sommeil devient une variable explicative de ta progression

Sur trois mois, tu totalises 17 916 reps, 58 jours entraînés, 48 h 38 d'exercices et 52 h 37 d'activité totale, avec un maximum de 20 jours consécutifs.

Ton sommeil permet de replacer ces chiffres dans leur contexte. Les périodes présentant une moyenne supérieure à 7 h 30 concentrent près des deux tiers des journées dépassant 300 reps, alors qu'elles ne représentent qu'un peu plus de la moitié des nuits. Les périodes sous 7 h 30 sont au contraire surreprésentées dans les journées à faible volume.

La progression dépend donc de l'accumulation de bonnes journées

Tes 17 916 reps ne proviennent pas d'une augmentation uniforme de ton volume quotidien. Elles résultent principalement de l'accumulation de journées où tu combines sommeil suffisant + entraînement complet + durée élevée de séance.

Ton mois de juin illustre cette dynamique avec 6 651 reps, 21 jours entraînés et 17 h 40 d'exercice. Le sommeil devient alors une variable permettant d'expliquer pourquoi certaines périodes autorisent une exposition beaucoup plus importante que d'autres.

La régularité constitue le signal le plus important sur trois mois

Ton record de 20 jours consécutifs montre que ta capacité à maintenir l'entraînement existe. La différence entre une période productive et une période moins productive réside davantage dans la répétition de journées suffisamment récupérées que dans l'existence d'un niveau maximal ponctuel.

Le sommeil devient ainsi une composante du potentiel d'entraînement durable : les nuits suffisamment longues augmentent la probabilité d'une journée à fort volume, la répétition de ces journées augmente l'exposition mensuelle, et l'exposition répétée fournit davantage d'occasions de faire progresser tes mouvements de référence.

---

### 15.2 Règle de silence

Le système doit savoir **ne rien afficher** lorsqu'une donnée ne permet pas de produire une observation réellement informative.

« Pas assez de données de sommeil » n'est pas une analyse ; c'est un état du moteur.

| Situation | Comportement |
|-----------|----------------|
| Donnée absente + aucune analyse possible | Ne rien afficher. Pas de phrase d’excuse. |
| Donnée absente aujourd’hui, mais historique suffisant | Utiliser l’historique (ex. 180 nuits, même sans nuit du jour). |
| Donnée partielle | Utiliser uniquement les variables disponibles (durée + efficacité, REM absent → pas de phrase REM). |
| Nouvelle connexion Garmin | Distinguer *donnée absente* de *donnée jamais disponible historiquement*. Ne pas traiter l’absence historique comme une absence réelle de sommeil. |

---

### 15.3 Principe fondamental — chaîne obligatoire

Momentum doit fonctionner selon cette chaîne :

**Données brutes → métriques dérivées → références personnelles → comparaisons → relations entre variables → détection de tendances → interprétation → sélection des observations → rédaction.**

Et non :

**Données → prompt → paragraphe générique.**

C'est cette différence qui explique pourquoi les analyses actuelles se répètent.

La vraie priorité technique n'est donc pas de perfectionner le prompt de rédaction : c'est de construire **Baseline Engine + Comparable Sessions + Trend Engine + Correlation Engine + Insight Scoring + Deduplication**. Le LLM, s’il intervient un jour, transforme uniquement des résultats analytiques **déjà validés** en texte naturel. Le moteur Recap actuel reste déterministe.

---

### 15.4 Première étape — vraie base de référence personnelle

Le chiffre du jour n'a presque jamais de sens seul.

Pour chaque métrique importante, Momentum doit connaître plusieurs références :

**Référence immédiate** — ce que l'utilisateur faisait récemment.

Exemple : 7 derniers jours : 3,5 séances/semaine ; 28 jours précédents : 4,2 séances/semaine.

**Référence habituelle** — une moyenne ou médiane calculée sur une période suffisamment longue.

Exemple : fréquence habituelle : 4,1 séances/semaine.

**Référence comparable** — probablement la plus importante.

Pour une séance de tractions aujourd'hui, comparer avec : les séances de tractions récentes ; les mêmes variantes ; les mêmes plages de répétitions ; idéalement une structure similaire ; éventuellement des conditions de récupération similaires.

Ainsi : 48 répétitions aujourd'hui devient : 48 répétitions, contre 41 en moyenne sur tes 8 dernières séances comparables, soit +17 %. L'utilisateur n'aurait jamais obtenu cette information en regardant simplement « 48 reps ».

---

### 15.5 Quatre concepts à séparer

Indispensable pour éviter les mauvaises interprétations.

**Exposition** — combien l'utilisateur pratique quelque chose : nombre de séances, fréquence, répétitions, séries, temps, kilomètres, volume musculaire, fréquence d'un exercice.

**Performance** — ce que l'utilisateur produit lorsqu'il pratique : reps/série, charge, distance, allure, temps, meilleure série, e1RM, densité, amplitude si disponible.

**Capacité** — le niveau relativement stable que l'utilisateur semble capable de reproduire. Exemple : moyenne des meilleures séries sur les 10 dernières séances.

**Récupération** — les conditions dans lesquelles la performance intervient : sommeil, durée, efficacité, REM, sommeil profond, FC repos, HRV, stress, activité précédente, charge récente, jours depuis dernière séance similaire.

C'est leur **interaction** qui produit les analyses vraiment intéressantes.

---

### 15.6 Le sommeil ne doit jamais être analysé isolément

C'est exactement là où Momentum peut devenir beaucoup plus avancé.

Pour chaque nuit, conserver au minimum :

- durée totale de sommeil ;
- heure d'endormissement ;
- heure de réveil ;
- temps éveillé ;
- efficacité du sommeil ;
- sommeil profond ;
- sommeil léger ;
- REM ;
- fréquence cardiaque moyenne ;
- fréquence cardiaque au repos ;
- HRV lorsque disponible ;
- respiration ;
- éventuels scores Garmin disponibles ;
- Body Battery (début / fin / recharge nocturne) lorsqu’il existe.

Puis les mettre en **relation** avec les données sportives du lendemain.

Il n’y a pas deux blocs séparés « Analyse sommeil » et « Analyse sport ». Il y a une analyse de la relation **récupération ↔ comportement ↔ performance**.

---

### 15.7 Au-delà de la durée — seuils, couples, effets retardés, interactions

**Durée seule (exemple de table interne)**

| Sommeil | Volume moyen le lendemain |
|---------|---------------------------|
| ≥ 8 h | 347 reps |
| 7–8 h | 301 reps |
| < 7 h | 246 reps |

Après suffisamment de nuits : « Tes journées suivant au moins 8 h de sommeil sont associées à un volume moyen de 347 répétitions, contre 246 lorsque le sommeil passe sous 7 h. L'écart atteint 101 répétitions, soit environ 41 %. »

On n’affiche plus « Tu as bien dormi. » On affiche l’**effet observé** dans l’historique de cette personne.

**Plus loin que la durée**

Exemple : « La durée seule ne semble pas expliquer entièrement ton volume d'entraînement : à durée de sommeil comparable, tes journées précédées d'une nuit avec une efficacité ≥ 90 % produisent en moyenne 12 % plus de répétitions que celles où l'efficacité descend sous 90 %. »

Encore mieux : « Tes meilleures journées d'entraînement apparaissent surtout lorsque trois conditions sont réunies : au moins 7 h 45 de sommeil, efficacité ≥ 90 % et absence de déficit important de sommeil sur les deux nuits précédentes. Dans cette configuration, ton volume moyen atteint 326 répétitions, contre 247 lorsque ces conditions ne sont pas réunies. »

**Seuils personnels, pas seulement des corrélations**

Pour chaque variable : Sommeil ≥ 8 h / 7–8 h / < 7 h → performance moyenne. Puis REM élevé / moyen / faible ; sommeil profond ; HRV ; etc. Le système cherche ensuite les seuils qui **séparent réellement** les comportements.

Exemple : sous 7 h 15, la fréquence tombe à 2,8 séances/semaine ; au-dessus de 7 h 45, elle atteint 4,6. Infiniment plus utile que « tu dors suffisamment ».

**Couples de variables à tester**

- Sommeil → volume (durée ↔ reps)
- Sommeil → performance (durée ↔ reps/série)
- Sommeil → intensité (proximité de l’échec)
- Sommeil → fréquence (probabilité de s’entraîner)
- Sommeil → récupération (séance suivante)
- Sommeil → continuité (streak)
- Sommeil → cardio (allure / FC / distance)
- Sommeil → fatigue (baisse sur plusieurs jours)

**Effets retardés**

La nuit précédente n’est pas la seule chose importante. Tester :

- Sommeil J-1 → performance J
- Sommeil J-2 → performance J
- sommeil moyen J-1/J-2 → performance J
- déficit cumulé sur 3 nuits → performance J

Exemple : « Ton volume ne décroche pas après une seule nuit courte : la baisse apparaît surtout lorsque le déficit de sommeil se répète au moins deux nuits. Après deux nuits sous 7 h, ton volume moyen tombe à 238 reps, contre 319 reps lorsque les deux nuits précédentes dépassent 7 h 30. »

**Interactions**

Une variable peut n’avoir quasiment aucun effet seule mais devenir importante combinée à une autre.

`sommeil < 7 h` peut être peu problématique si l’entraînement précédent était léger. `sommeil < 7 h + volume élevé la veille` peut fortement dégrader la séance suivante.

Tester : Sommeil × charge précédente ; × fréquence ; × intensité ; × récupération ; × type d’entraînement.

Exemple : « Après une nuit de moins de 7 h, tes séances de poussée conservent 94 % de leur volume habituel, tandis que tes séances de tirage tombent à 81 %. » Le déficit ne touche pas toutes les qualités de la même manière. Le tirage apparaît comme la qualité la plus sensible à une mauvaise récupération dans cet historique.

---

### 15.8 Séances comparables, mémoire d’exercice, trajectoire

**Séance comparable** — une séance de 48 dips + 48 australiennes + 60 relevés de genoux ne se compare pas à une séance de jambes.

Familles : poussée (pompes, dips, variantes) ; tirage vertical (tractions) ; tirage horizontal (australiennes, rowings) ; bras ; épaules ; jambes ; core.

Comparer dans cet ordre : mouvement exact → variante → famille → groupe musculaire.

**Nouveaux exercices** — pas d’historique → ne pas prétendre à une progression. Reconnaître « nouveau mouvement », analyser l’intégration.

Exemple : « Les tractions neutres apparaissent pour la première fois cette semaine et représentent déjà 14 % de ton volume de tirage. Elles s'intègrent donc rapidement à ton entraînement sans remplacer les tractions pronation, qui restent majoritaires. »

Après plusieurs semaines : « Après 6 semaines, les tractions neutres sont devenues une composante régulière de ton tirage : 3,1 séances sur 5 en contiennent désormais, contre 1,2 sur 5 durant les deux premières semaines. »

Puis seulement plus tard : « La performance moyenne sur les tractions neutres progresse de 21 % depuis leur introduction. »

**Exercices abandonnés** — « Les dips ont représenté 18 % de ton volume de poussée en juin, contre 4 % sur les 30 derniers jours. Leur disparition explique une grande partie de la baisse récente du volume de triceps, malgré une fréquence d'entraînement globalement stable. »

**Mémoire de chaque exercice** : première / dernière apparition, nombre de séances, fréquence, volume total et moyen, meilleure série, meilleure performance, moyenne récente / historique, tendance, variabilité, progression, stagnation, abandon, reprise, temps depuis dernière pratique.

Exemples : « Tu reprends les dips après 18 jours d'absence et produis immédiatement 92 % de ton volume habituel. » / « Après 6 semaines sans pratique, ta première séance revient à 71 % de ton niveau historique. »

**Long terme = trajectoire**, jamais « tu manques de régularité ». Répondre : où étais-tu ? où es-tu ? quelle trajectoire ? qu’est-ce qui a changé / est devenu stable / disparaît ? quels paliers consolidés ?

Exemple : « Depuis ta première saisie, ton volume moyen sur les tractions pronation est passé de 18 à 27 répétitions par séance comparable, soit +50 %. Cette progression s'accompagne d'une augmentation de la fréquence d'exposition de 1,4 à 2,3 séances par semaine. Le niveau actuel n'est donc pas seulement supérieur : il est désormais reproduit régulièrement sur plusieurs semaines. »

**Changements de régime** — plus puissant qu’une simple progression. Juin 4,8 séances/semaine, juillet 3,9, août 3,2 → « Depuis juillet, ta fréquence s'est installée environ 30 % sous ton niveau observé en juin. Cette baisse coïncide avec une diminution du volume total, mais pas avec une baisse équivalente des performances sur les mouvements que tu continues à pratiquer. Ton régime actuel est donc caractérisé par moins d'exposition, plutôt que par une perte générale de capacité. »

---

### 15.9 Densité adaptative, missions des horizons, confiance interne

**Ne pas forcer** trois paragraphes de même longueur. Chaque période a un budget, le moteur choisit les observations **réellement disponibles**.

| Période | Budget d’observations fortes |
|---------|------------------------------|
| Aujourd’hui | 2–4 par horizon |
| 7 jours | 3–5 |
| 30 jours | 4–6 |
| 3 mois | 5–8 |
| 1 an+ | 6–10 si l’historique le justifie |

La quantité dépend de la richesse analytique, pas d’un nombre arbitraire de phrases.

**Missions des horizons** (complémentaires, pas concurrentes) :

| Horizon | Question | Fenêtre indicative |
|---------|----------|-------------------|
| Court terme | Qu’est-ce qui vient de changer ? | ~7–21 jours : évolution récente, récupération, fréquence, charge, volume, réaction, sommeil récent, performances comparables récentes. |
| Moyen terme | Qu’est-ce qui est en train de devenir une tendance ? | ~1–3 mois : cycles, adaptations, habitudes, progression, stagnation, déséquilibres, exposition/performance, récupération, exercices structurants. |
| Long terme | Qu’est-ce qui a réellement changé dans ton profil ? | 3 mois → années : première saisie, records consolidés, changements de profil, abandons, ruptures, spécialisation, évolution de la récupération et du volume. |

**Confiance interne, jamais affichée** sous forme de « peut-être ». Le moteur attribue : nombre d’observations, durée, stabilité, taille de l’effet, reproductibilité, qualité des données, comparabilité.

Exemple interne publié : relation sommeil → volume, n = 47 nuits, effet +18 %, répétabilité élevée, dispersion faible.

Exemple interne **refusé** : n = 4, effet +31 %, dispersion énorme → **pas d’analyse**.

**Seuil minimal avant de publier une corrélation** : assez de jours, de séances, de nuits, de cas dans chaque groupe, effet assez grand, stabilité suffisante. Une corrélation ne naît pas parce que « cette semaine tu as dormi 8 h et fait beaucoup de reps ». Elle naît parce que l’historique montre un phénomène **reproductible**.

---

### 15.10 Aucune phrase vide — couches d’une observation

Chaque phrase doit apporter quelque chose que l’utilisateur **ne voit pas directement**.

Bannir : « Ton dos est légèrement devant tes pectoraux. » (il voit déjà Dos 77 / Pectoraux 60.)

À la place : « Le dos représente 30 % de ton volume musculaire de la séance et dépasse les pectoraux de 28 %. Cette dominante vient principalement des 48 répétitions d'australiennes, qui représentent à elles seules la majorité de ton exposition de tirage. »

Format idéal : **constat + comparaison + quantification + interprétation**.

Exemple : « Tu réalises aujourd'hui 48 répétitions d'australiennes, soit 17 % de plus que ta moyenne sur les séances comparables, alors que ton volume total reste proche de ton niveau habituel. La hausse vient donc spécifiquement du tirage horizontal plutôt que d'une augmentation générale du volume de séance. »

Encore mieux, plusieurs dimensions : « Avec 360 répétitions en 1 h 05, ta séance atteint 92 répétitions par heure, soit 14 % de plus que ta moyenne des 10 dernières séances. Cette densité supérieure intervient alors que ton sommeil de la nuit précédente atteint 8 h 12 avec une efficacité de 93 %, conditions qui figurent également parmi tes meilleures configurations de récupération. »

**Familles d’insights à chercher systématiquement** : progression (PR, moyenne, consolidée, vitesse) ; régression (réelle vs liée à l’exposition vs après interruption) ; régularité (fréquence, streak, interruptions, retour) ; volume ; densité ; répartition ; spécialisation ; nouveautés ; abandons ; consolidation ; variabilité ; récupération ; relations (sommeil → performance, fréquence → progression, volume → progression, récupération → fréquence, charge → fatigue) ; jalons (première séance, première traction, 100e séance, 1 000e rep).

Garmin = **contexte**, jamais un bloc séparé. Exemple : « Après tes nuits dépassant 8 h, tu t'entraînes en moyenne 4,7 jours sur 7 et atteins 318 répétitions par journée d'entraînement. Sous 7 h, ces valeurs tombent respectivement à 3,1 jours et 247 répétitions. Le sommeil apparaît ainsi davantage associé à ta capacité à maintenir le rythme qu'à la seule performance d'une séance isolée. »

---

### 15.11 Architecture de sélection

```
RAW DATA
   ↓
NORMALISATION
   ↓
METRICS ENGINE
   ↓
PERSONAL BASELINES
   ↓
COMPARABLE SESSIONS
   ↓
TREND ENGINE
   ↓
CORRELATION ENGINE
   ↓
EVENT DETECTION
   ↓
INSIGHT CANDIDATES
   ↓
SCORING
   ↓
DÉDUPLICATION
   ↓
HORIZON CLASSIFICATION
   ↓
NARRATIVE GENERATION
```

Le moteur génère des **candidats**, pas directement du texte.

```
INSIGHT
type: sleep_performance
period: 30d
sleep_condition: >= 7h45
nights: 21
training_volume: +18.4%
performance: +11.2%
frequency: +9.8%
confidence: high
novelty: high
```

Puis le générateur transforme cela en phrase.

**Déduplication obligatoire.** Chaque insight a une signature (ex. `frequency_decline`). Si le même insight apparaît déjà dans une période plus courte, la période supérieure doit : apporter une nouvelle dimension ; ou le reformuler à un niveau supérieur ; ou ne pas l’afficher.

Exemple de quatre niveaux distincts sur la même donnée :

- Aujourd’hui — 360 reps, soit +18 % par rapport à ta moyenne de séance.
- 7 jours — volume hebdomadaire +11 % au-dessus de ta moyenne récente.
- 30 jours — volume mensuel encore 7 % sous le niveau habituel malgré la reprise récente.
- 3 mois — trimestre marqué par une fréquence inférieure à celle du début de période.

**Hiérarchie de valeur** : nouveauté × importance × ampleur × fiabilité × personnalisation × actionnabilité.

« Tu as fait 360 reps » → score quasiment nul.

« Tes journées suivant ≥ 7 h 45 de sommeil produisent 22 % plus de volume sur les 46 séances observées, et l'écart reste présent lorsque la fréquence d'entraînement et le volume de la veille sont contrôlés » → score très élevé.

C’est ce système qui permet de remplir une page avec 5 analyses exceptionnelles plutôt que 15 phrases génériques.

---

### 15.12 Résultat final recherché (niveau à viser)

Quand l’utilisateur ouvre Aujourd’hui, Momentum devrait pouvoir dire, **sans** « si », « on pourrait », « il serait intéressant de », ni répétition artificielle :

Tu as réalisé 360 répétitions aujourd'hui, soit 12 % au-dessus de ta moyenne sur tes séances comparables. La séance est également plus dense que ton niveau habituel, avec 92 répétitions par heure contre 81 en moyenne.

Puis : Tes 48 répétitions d'australiennes représentent ton meilleur volume sur ce mouvement depuis 19 jours et dépassent de 16 % ta moyenne des 8 dernières séances comparables. Les dips atteignent également leur deuxième meilleur volume récent, ce qui place la séance parmi tes journées de poussée/tirage les plus productives du mois.

Puis : La récupération précédant cette séance figure parmi tes meilleures configurations récentes : 8 h 12 de sommeil, 93 % d'efficacité et une durée REM supérieure à ta moyenne. Dans ton historique, les journées précédées par au moins 7 h 45 de sommeil et une efficacité supérieure à 90 % produisent 19 % plus de volume que les journées ne réunissant pas ces deux conditions.

Et plus loin : Sur les 30 derniers jours, ta fréquence reste inférieure à ton niveau habituel, mais ta performance par séance ne suit pas cette baisse. Tu produis donc moins parce que tu t'exposes moins, pas parce que chaque séance est devenue moins productive.

Et enfin : Depuis tes premières saisies, tes mouvements de tirage ont progressivement pris une place plus importante dans ta pratique : leur fréquence est désormais 1,7 fois supérieure à celle observée durant ta première période de référence, tandis que plusieurs performances autrefois ponctuelles sont maintenant reproduites régulièrement.

Le moteur a déjà fait le travail statistique **avant** que le texte existe.

---

### 15.13 Données déjà branchées (1er septembre 2026) — pas encore d’analyse

Source unique : `src/utils/sport/recapSleepNight.js`.

Lit `garminData.dailyMetrics[ymd].sleep` avec les **mêmes alias** que le calendrier (`calendarDayRecapDetail`) et l’onglet Garmin :

- durée : `duration` | `totalSleep` | `totalMinutes` — **< 24 = heures**, sinon minutes ;
- profond : `deep` | `deepSleep` ;
- léger : `light` | `lightSleep` ;
- REM : `rem` | `remSleep` ;
- éveillé : `awake` | `awakeSleep` ;
- efficacité / score : `efficiency` | `sleepEfficiency` | `quality` | `score` ;
- coucher / réveil : `bedTime` | `startTime` / `wakeTime` | `endTime` ;
- FC nocturne : `avgHR` | `averageHeartRate` | … ;
- FCR : `heartRate.resting` | `restingHeartRate` ;
- HRV si présent ;
- Body Battery : scalaire **ou** `{ start, end, charged }` (alias `chargedFrom` / `chargedTo` / `low` / `high`).

Nuit absente ou < 90 minutes → `null`. Pas de phrase.

Branché sur :

- le catalogue de séances (`buildSessionCatalog`) : chaque jour entraîné porte `night` + `sleepHours` ;
- `sleepContextForDate` : nuit du jour + **7 dernières nuits réellement présentes** (jours sans sommeil sautés), pas seulement les nuits des jours d’entraînement.

### 15.15 Phases 10–13 — moteur de corrélation + textes au grain § 15.1

Module : `src/utils/sport/recapSleepCorrelation.js`.

Phase 10 :

- Joint séance ↔ nuit (la nuit qui se termine le matin D).
- Publie **seulement** si n et effet tiennent : seuil 7 h 30 / 8 h, zones, séparation 300 vs 250 reps, architecture, déficit sur **deux** nuits.
- Sinon : tableau vide. Aucune phrase « pas assez de données de sommeil ».

Phase 11 :

- J-2 **calendaire** (nuit de D-1), plus la séance précédente.
- Efficacité ≥ 90 % **à durée comparable**.
- Interaction poussée vs tirage après nuit < 7 h.
- Trio ≥ 7 h 45 + efficacité ≥ 90 % + pas de déficit sur les deux nuits.
- Concentration de fenêtre (volume derrière un petit nombre de nuits) + profond stable.
- Textes aujourd’hui / 7 j. collés plus près des exemples § 15.1 (architecture, placement vs 7 h 30, durée de séance, FC / Body Battery).

Phase 12 :

- 30 j. : `disc_sleep_month` (concentration + reps/séance, pas une copie de la semaine).
- 3 mois : `disc_sleep_quarter` (part des journées ≥ 300 derrière nuits ≥ 7 h 30) + meilleur mois recollé au sommeil.
- Sommeil × charge de la veille (`disc_sleep_load`).
- Semaines à ≥ 4 nuits longues ↔ plus de jours actifs (`disc_sleep_freq`).
- Dédup : aujourd’hui / 7 j. gardent le seuil ; 30 j. / 3 mois reformulent.

Phase 13 :

- Budgets adaptatifs § 15.9 : plafonds 2/3/2, slot extra seulement si assez d’observations fortes **et** prioritaire. Jamais un plancher.
- Sommeil → densité de séance (`disc_sleep_intensity`).
- Sommeil → distance de course (`disc_sleep_cardio`), pas un bloc Garmin isolé.

Phase 14 (clôture du plan) :

- Voix **1 an+** (`year`) : plages `1y` / `2y` / `all` / `6m` / fenêtre ≥ 180 j. Plafonds max 2/4/3 seulement si ≥ **8** observations fortes.
- Effort perçu réel (`disc_sleep_rpe`) : notes de difficulté 1–5 (`exerciseSessionPerceived`, fallback étoiles). **Silence** s’il n’y a pas de notes — ce n’est pas un trou, c’est la règle donnée absente → silence.
- Performance du mouvement le plus chargé vs volume total (`disc_sleep_perf`) : si le volume bouge et le mouvement ne suit pas, la phrase le dit ; sinon le mouvement a sa propre lecture.
- Allure min/km dans `disc_sleep_cardio` quand minutes + km sont présents.
- Comparables (`disc_comparable`) publiables dès qu’une baseline du mouvement cible est établie, sans exiger un écart « vs habitude ».
- `year` traité comme `long` pour les gates sommeil / meilleur mois / déficit répété.

Le plan documenté est **clos**. Ce qui reste n’est plus une fonctionnalité manquante : c’est du polish de formulation sur un historique réel (une phrase trop générique, un rival mal tranché). RPE reste silencieux tant que l’athlète ne note pas.

---

### 15.14 Ordre de travail

1. Le but sport § 14.2 est clos (~99 %).
2. Le but sommeil § 15.1 : plages, croisements, 1 an+, RPE si noté ; rester silencieux si non publiable.
3. Ne jamais afficher « Pas assez de données de sommeil ».

---

## 16. Jauge — totalité des accomplissements prévus

Barème unique pour tout le document (fondations + § 14 + § 15 + § 17).  
Mis à jour à chaque lot. Date : **1er septembre 2026, phase 17 — clôture 100 %**.

| # | Accomplissement | Poids | Fait |
|---|-----------------|------:|-----:|
| 1 | Natures + `athleteJourney` (§ 13) | 10 | 100 % |
| 2 | Pipeline inversé + questions par plage (§ 14.1–14.3) | 7 | 100 % |
| 3 | Découvertes de période (§ 14.4) | 8 | 100 % |
| 4 | Baselines / comparables / mémoire courte (§ 14.5) | 7 | 100 % |
| 5 | Sources alignées sur le bandeau (§ 14.6) | 7 | 100 % |
| 6 | Densité des textes § 14.2 sur **toutes** les plages | 12 | 100 % |
| 7 | Mémoire structurelle + abandon familial | 5 | 100 % |
| 8 | Mix force / endurance / poly / charges / plans | 5 | 100 % |
| 9 | Relation cardio ↔ muscu | 5 | 100 % |
| 10 | Données sommeil Garmin / calendrier branchées | 4 | 100 % |
| 11 | Moteur de corrélation sommeil (§ 15.3–15.11) | 8 | 100 % |
| 12 | Analyses sommeil § 15.1 (toutes plages × 3 angles) | 7 | 100 % |
| 13 | Moteur jalons / événements (§ 17) | 15 | 100 % |

**Totality documentée : 100 %.**

Détail :

- **But sport (§ 14)** : **100 %**.
- **But sommeil (§ 15)** : **100 %**.
- **But jalons (§ 17)** : **100 %** — premières fois, retours (J0 + suite), records reps / densité / allure / charge / e1RM, cumuls (reps, séances, km, heures), objectifs (tractions, course, poids) + ETA, combos sommeil×jalon et jalon×jalon, régime 6 semaines, mix 1 an et 2 ans, pesée grain 8 j., récompense colorée § 17.4.

Le plan documenté est **clos**. Silence si une variable n’est pas là. RPE et charge restent silencieux tant que l’athlète ne note pas / ne saisit pas.

---

## 17. Troisième but — moteur événementiel / jalons

Complémentaire du moteur analytique (§ 14–15). Les deux alimentent les mêmes colonnes.

| Moteur | Question | Exemple |
|--------|----------|---------|
| Analytique | Qu’est-ce que les données montrent ? | « 69 % de poussée, densité 332 reps/h » |
| Événementiel | Qu’est-ce qui vient de se produire dans ton histoire ? | « Première course depuis 78 jours » |

**Règle d’or :** une analyse jalon s’ajoute. On n’en supprime pas une statistique pour lui faire de la place. Slots extra (1 par angle), pas un vol de `volume_shape`. Si rien n’est assez intéressant : moins d’analyses, jamais de remplissage.

Les jalons **ne se recopient pas d’une plage à l’autre**. Chaque période a son pool.

### 17.1 Catégories

Première fois (absolue, dans la période, depuis X, à un niveau, en combinaison, avec un exercice / une charge / une fréquence / un cumul). Première fois depuis longtemps. Retour après interruption. Record / record répété / record consolidé. Franchissement (reps, séances, km, heures, kg). Changement de comportement. Changement durable. Objectif / progression / écart. Transformation (poids, volume, fréquence, mix). Combinaisons d’événements.

### 17.2 Table conceptuelle

`type`, `sous-type`, `date`, `valeur`, `valeur précédente`, première / dernière apparition, fréquence historique, temps depuis dernière occurrence, seuil, objectif, importance, déjà annoncé, contexte.

« Longtemps » n’est pas un mot vague. Classes : récent < 14 j. ; éloigné 14–30 ; longue absence 31–60 ; très longue 61–120 ; historique 121–365 ; retour historique > 365. **Et** ratio `écart / intervalle habituel`. Une course tous les 10 jours absente 40 jours = 4× l’habitude. Une course tous les 45 jours absente 40 jours = pas une interruption.

### 17.3 Pools par plage

- **Aujourd’hui** — ce qui s’est passé aujourd’hui : événement, record, première fois, retour, seuil, récupération.
- **7 jours** — événements de semaine, dynamique, fréquence, reprises.
- **30 jours** — ce qui s’installe : nouvelle fréquence, exercice devenu régulier, poids qui change vraiment.
- **3 mois** — cycles, consolidations, transformations.
- **6 mois / 1 an / 2 ans** — évolution structurelle, trajectoire, histoire globale.

Anti-répétition : lastShown, timesShown, novelty, changeSinceLastShown. Même observation + aucun changement significatif = silence. Une première fois absolue ne se raconte **qu’une fois**. Un retour évolue : J0 reprise → J+14 « 5 séances depuis le retour » → J+30 « reprise devenue durable ».

### 17.4 Récompense analytique

Quotidien (vert) · jalon (bleu) · découverte (violet) · transformation (orange) · événement historique (rouge). L’utilisateur doit sentir que Momentum **remarque** les événements importants.

### 17.5 Architecture

Données → normalisation → métriques → baselines / événements / relations → comparaisons / jalons / corrélations → tendances → candidats → pertinence → déduplication → mémoire → horizon → rédaction.

Garmin (sommeil) et poids entrent **tôt**, pas en encart final.

### 17.6 Phase 15 — première livraison (1er septembre 2026)

Module : `src/utils/sport/recapMilestoneEngine.js`.

Détecte et rédige, **en plus** des `disc_*` existants :

- première séance / premier exercice / première course / première journée ≥ 300 ou 500 reps / première séance ≥ 1 h ;
- retour d’exercice, de course, de GTG (écart **et** intervalle habituel) ;
- record de reps + record consolidé (reproduit ≥ 3 fois sur 5) ;
- franchissement cumulatif (1 000 / 5 000 / 10 000 reps, 10 / 25 / 50 / 100 séances) ;
- première semaine à N séances au-dessus du max précédent ;
- poids : première mesure, et moyenne 30 j. vs 30 j. d’avant (jamais une pesée quotidienne isolée).

Sélection : slots **extra** uniquement (`disc_ms_*`). Mémoire : une première fois déjà racontée disparaît. Silence si non publiable.

Encore ouvert après phase 15 : objectifs chiffrés et ETA, combinaisons sommeil×jalon, régime d’entraînement de 6 semaines, transformation de mix sur 1–2 ans, allure / charge / densité comme PR, pesée anti-répétition au grain 8 jours.

### 17.7 Phase 16 — objectifs, combos, transformations (1er septembre 2026)

Toujours en **supplément** (`disc_ms_*`, slots extra).

- **Objectif + ETA** (`disc_ms_goal`) : skill street `pullups_10` / `20` / `first_pullup`, ou palier suivant depuis `pullupsMax`. Franchissement le jour du palier ; sinon projection seulement si ≥ 4 séances et 21 j. de pente positive. Silence sans objectif, sans progression, ou palier déjà franchi hors fenêtre.
- **Combo sommeil × jalon** (`disc_ms_sleep_combo`) : un PR / densité / retour **et** une nuit parmi les meilleures (≥ 7 h 30, éventuellement efficacité). Pas une corrélation n=4. Silence si la nuit n’est pas là.
- **Régime 6 semaines** (`disc_ms_regime`) : exercice devenu régulier (part des séances vs les 2 premières semaines) ; ou fréquence 6 sem. vs 6 sem. d’avant (≥ 25 %).
- **Mix 1 an** (`disc_ms_mix_shift`) : 90 j. du début vs 90 j. de la fin, parts poussée / tirage / jambes / lesté. Voix `year` (ou `long` ≥ 150 j.).
- **PR densité** (`disc_ms_pr_density`) et **PR allure** (`disc_ms_pr_pace`) : record vs historique, pas une hausse d’un jour.
- **Pesée grain 8 j.** (`WEIGHT_8D` sur 7 jours) : deux moyennes de ≥ 3 mesures, Δ ≥ 0,6 kg. 30 j. vs 30 j. sur mois / 3 mois. Une pesée quotidienne isolée = silence. Mémoire dès 1 affichage.
- **Retour qui s’installe** (`disc_ms_return_durable`) : J+12 et ≥ 3 séances depuis la reprise, puis « durable » à J+26.

Encore ouvert : PR de charge / e1RM, combos au-delà du sommeil×jalon, mix sur 2 ans plus narratif, objectifs course / poids.

### 17.8 Phase 17 — clôture (1er septembre 2026)

Toujours en **supplément**. Rien n’évince `volume_shape`.

- **Charge / e1RM** (`disc_ms_pr_load`, `disc_ms_first_load`) : saisie `exerciseWeights`, 1RM estimé Epley. Silence sans kg.
- **Objectif course** (`disc_ms_goal_run`) : `runningGoal` 5 km / 10 km / semi / marathon. Premier palier de distance, ou écart si la plus longue sortie est encore loin.
- **Objectif poids** (`disc_ms_goal_weight`) : `targetWeightKg`, moyennes 8 j. vs palier, ETA sur la pente des moyennes. Pas une pesée isolée.
- **Combos d’événements** (`disc_ms_event_combo`) : PR × densité le même jour ; retour × niveau habituel ; objectif × régime ; poids × volume qui tient.
- **Mix 2 ans** (`disc_ms_mix_shift` type `MIX_2Y`) : 180 j. vs 180 j., mix + fréquence.
- **Cumul heures** (`disc_ms_hours`).
- **Récompense § 17.4** : bordure de carte vert / bleu / violet / orange / rouge selon le kind (`rewardToneForKind`).
- Sommeil long / 1 an : zones, séparation, efficacité, sensibilité familiale publiables aussi en voix `long`/`year`.
- Mémoire structurelle : si 6 semaines depuis l’introduction, la phrase de progression de performance s’ajoute.

Le § 17 est **clos**. Silence si non publiable.

