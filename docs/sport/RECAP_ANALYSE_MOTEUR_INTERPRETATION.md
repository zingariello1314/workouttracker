# Récap Analyse — comment le moteur d’interprétation a été amélioré

Document de parcours : d’où on partait, ce qui a été changé, où on en est, et ce qui reste volontairement incomplet.

Périmètre : les **trois colonnes** Court / Moyen / Long terme de l’onglet Sport → Récap → Analyse (et le panneau dev « Moteur d’interprétation »).  
Pas le reste du Récap (Snapshot, Coach Vision, Benchmarks, etc.), même si ces surfaces pourront un jour réutiliser les mêmes lectures.

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

Le prochain saut **n’est pas** d’ajouter 30 `coach_reading`. C’est de changer l’unité : **phénomène** (situation cohérente) plutôt que **dimension** (une carte par métrique). Ordre, recoupé avec le dump réel du 31 août :

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


