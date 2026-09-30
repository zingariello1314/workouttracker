# Plan — narration des trois colonnes

Plan de travail. Aucune modification de code tant que ce document n’est pas validé.

Le moteur reste. On n’ajoute pas de détecteurs pour remplir les colonnes. On fait en sorte que les détecteurs déjà là produisent trois lectures distinctes :

1. **Ce que tu as fait** — ce qui s’est passé.
2. **Ce que ça change** — ce que ça modifie dans le fonctionnement.
3. **Ce qui a évolué** — ce qui s’est installé, déplacé ou transformé.

Même donnée, sens différent. Colonne vide si rien n’est assez solide.

---

## 1. Diagnostic

Le pipeline actuel est déjà le bon squelette.

```text
useRecapTabMetrics
  → buildAdaptiveRecapInsights
      → buildComposedInterpretationPipeline
           découvertes + essais + relations
      → buildSpanStoryCandidates
           catalogue de plage
      → selectBalancedCandidates × 3
           une fois par colonne, chacune seule
```

Les natures sont déjà la règle d’affichage : `now` → fait, `trajectory` → changement, `journey` → transformation. `KIND_NATURE` ne bouge pas.

Le trou est à la **sélection**, pas dans les détecteurs.

### Ce qui existe et qu’on garde

- Mesures, features 7/28/90, identité, parcours, phénomènes, sommeil en association, coût par routes, jalons, baselines, record ≠ niveau.
- Rivales et plafonds **à l’intérieur** des découvertes (`selectPeriodDiscoveriesWithTrace`).
- Essais génériques qui se taisent dès qu’une découverte occupe « maintenant ».
- Garde-fou Garmin : si la nouvelle passe tombe sous 72 % de la richesse et de la longueur, et que l’ancienne dépassait 80, on garde la version riche (`useRecapTabMetrics`).
- Cache `span4` : pas de calcul partiel quand les sources ne sont pas prêtes.
- `MIN_COLUMN_WEIGHT = 32` : une colonne peut s’arrêter avant son plafond.
- Texte UI déjà prévu : « Aucun signal assez robuste. »

### Ce qui empêche la narration voulue

**1. Les trois colonnes choisissent chacune dans leur coin.**

`selectBalancedCandidates` est appelé trois fois. Le set `usedGroups` repart à zéro à chaque colonne. Une idée prise à gauche peut revenir au centre et à droite.

**2. Les groupes sémantiques existent, mais ils ne portent pas le sens.**

`insightSemanticThemes.js` range déjà `disc_muscle_now`, `disc_muscle_reorient` et `disc_push_pull` dans le même sac : `reading_period_muscle`.

Ce sac mélange le fait (« le dos fait 46 % ») et la relation (« le stimulus se déplace »). Si on l’applique tel quel **entre** les colonnes, on tue exactement l’escalade fait → relation → transformation.

À l’inverse, `disc_ratio_structure` est dans un autre sac (`reading_period_ratio`). « La poussée domine » et « le ratio penche vers la poussée » ne se voient pas.

Les relations (`relation.push_pull_stimulus`) tombent dans le sac `structure`. Les découvertes tombent dans `reading_period_*`. Même histoire, deux sacs, les deux passent.

Les cartes du catalogue (`relation.reading.short.span_new_variant`) ne sont dans aucun sac connu. Chacune devient son propre groupe `reading.span_…`. `span_new_variant` et `disc_emergence` ne se comparent pas.

**3. La mémoire reconnaît un kind, pas une idée.**

`memoryFactor` pénalise un `kind` revu. Les portraits (`disc_volume_shape`, `disc_muscle_now`, séance en attente) ne descendent qu’à 0,9 puis 0,8. « Le dos à 42 % » puis « le dos à 43 % » peut revenir. Le jour courant est déjà exclu : on ne touche pas à ça.

**4. Les relations perdent par bonus, pas par qualité.**

Une découverte reçoit +10 dans `interpretationToLegacyCandidate` (id contenant `.disc_`) puis +14 dans `selectBalancedCandidates`. Une relation utile sur le même sujet, dans la même colonne, part derrière avant même d’être lue. On ne les réécrit pas. On les laisse gagner seulement quand elles portent un sens que la découverte n’a pas.

**5. La rotation décide trop tôt.**

Toute lecture riche reçoit `hash(jour + id) % 13`, donc 0 à 12 points, plus jusqu’à 5 points de hash de signature. Douze points suffisent à faire gagner une carte moins importante. La rotation doit départager, pas choisir le sujet.

---

## 2. Décision

On n’ajoute pas d’étage « relations » au milieu du pipeline. Le code produit déjà découvertes, relations, essais et catalogue, puis les mélange. Réordonner cette chaîne casserait les priorités de période, les phénomènes et les essais de secours pour un gain narratif qu’on peut obtenir plus bas.

On ajoute **une seule responsabilité nouvelle**, au moment du choix final : un **registre de claims**, partagé par les trois colonnes.

Un claim, c’est :

| Champ | Rôle |
| --- | --- |
| `topic` | Le sujet. Ex. `mix.dos`, `mix.poussee`, `exercice.pompes-inclinees`, `sommeil.dose`, `cout.seance`, `frequence` |
| `sense` | Le sens. `fact`, `relation` ou `transformation`. Aligné sur `now` / `trajectory` / `journey` |
| `stateKey` | L’état grossier. Ex. part du dos dans la bande 40–49 %, pas le pourcentage exact |

Règles du registre, communes aux trois colonnes :

- Même `topic` + même `sense` → une seule carte, la plus solide. Les deux autres colonnes ne la reformulent pas.
- Même `topic` + `sense` plus profond → autorisé. C’est l’escalade voulue.
- Même `topic` + même `sense` + même `stateKey` qu’un jour précédent → pas nouveau. On ne réaffiche pas « 43 % » après « 42 % ».
- Même `topic` + `sense` plus profond, ou `stateKey` qui a vraiment bougé → la mémoire lâche. La transformation peut revenir.

Le sens vient de la nature déjà posée par `KIND_NATURE`. On ne reclasse pas les kinds. Un cas limite seulement : si une carte classée relation ou transformation n’a aucune comparaison dans ses `metrics` (pas de delta, pas d’avant, pas de consolidé), le registre la traite comme un fait. Elle entre alors en concurrence avec le fait déjà dit, au lieu d’occuper « ce que ça change » avec une statistique déguisée.

On ne change aucun seuil de détecteur.

---

## 3. Architecture cible

```text
Snapshot + Garmin + questionnaire + programme
        ↓
Mesures, features, identité, parcours, état     (inchangé)
        ↓
Phénomènes                                       (inchangé, ils continuent de bloquer des essais)
        ↓
Découvertes, jalons, essais, relations, catalogue (inchangé, ils continuent d’écrire des candidats)
        ↓
Claim  { topic, sense, stateKey }                (nouveau, étiquette, n’écrit aucun texte)
        ↓
Registre commun aux 3 colonnes                   (nouveau, dans la sélection)
        même sens  → une seule carte
        sens plus profond → gardé
        ↓
Priorités de période, scores, rivales, plafonds  (inchangés, en amont)
Rotation seulement si deux cartes sont à égalité
        ↓
Mémoire : kind (existant) + claim+état (nouveau)
        ↓
Ce que tu as fait | Ce que ça change | Ce qui a évolué
```

| Responsabilité | Où elle vit |
| --- | --- |
| Détecter | fichiers actuels, non réécrits |
| Dire la nature | `recapInsightNature.js`, inchangé |
| Nommer le sujet et le sens | nouveau `recapNarrativeClaims.js` |
| Choisir sans se répéter entre colonnes | `selectBalancedCandidates` dans `recapAdaptiveInsights.js` |
| Se souvenir d’une idée | `insightNoveltyStore.js` + `insightNoveltyEngine.js` |
| Afficher | `RecapAnalyseView.jsx`, inchangé |

---

## Phase 0 — Étiquettes, sans changer l’affichage

But : chaque candidat reçoit un claim. Rien n’est filtré. Les tests prouvent la table de correspondance.

### Fichier nouveau

`src/utils/sport/recapNarrativeClaims.js`

- `claimFromCandidate(candidate)` lit le kind déjà présent (`interpretation.context.kind`, sinon l’id `relation.reading.{horizon}.{kind}`, sinon l’id `relation.{type}`, sinon `span_{id}`).
- Table topic + sense, branchée sur les kinds existants. Pas de nouveau détecteur.
- `stateKeyFromMetrics(topic, metrics)` : bande large, pas la valeur exacte. Une part en % se range par tranche de 10. Un delta de volume se range en `baisse` / `stable` / `hausse` avec les coupures déjà utilisées ailleurs (±8 et ±12), sans en inventer.
- Si `metrics` ne permet pas un état, `stateKey = 'present'`. On ne fabrique pas un chiffre.

Correspondances minimales à couvrir dès cette phase :

| Kinds | topic | sense |
| --- | --- | --- |
| `disc_muscle_now` | `mix.{groupe}` | fact |
| `disc_muscle_reorient`, `disc_push_pull`, `disc_ratio_structure`, `disc_muscle_share_shift`, `relation.push_pull_stimulus` | `mix.{famille ou groupe}` | relation |
| `disc_structural_memory`, `disc_family_fade`, `disc_stimulus_mix`, `disc_anchor`, `disc_quarter_arc` | `mix.{famille}` | transformation |
| `disc_exercise_share`, `span_new_variant` | `exercice.{id ou nom}` | fact |
| `disc_emergence`, `disc_exercise_base`, `span_exercise_return` | `exercice.{id}` | relation |
| `disc_exercise_progress`, `journey_progress`, `journey_pr_vs_level`, `disc_ms_pr_consolidated` | `exercice.{id}` | transformation |
| `disc_ms_pr` | `exercice.{id}` | fact |
| `disc_volume_shape`, `disc_density`, `disc_peak_day` | `volume.forme` | fact |
| `volume_traj`, `relation.exposure_vs_capacity`, `span_volume_vs_frequency` | `volume.exposition` | relation |
| `disc_sleep_*` de dose (`volume`, `assoc`, `combo`, `month`, `perf`) | `sommeil.dose` | selon la nature déjà dans `KIND_NATURE` |
| `session_cost` / `span_session_cost` | `cout.seance` | fact si Aujourd’hui, relation sinon (déjà le cas dans `evaluateSessionCost`) |

Le groupe sémantique actuel reste en place pour la pénalité **dans** une colonne. Le claim ne le remplace pas.

### Tests

`src/utils/sport/__tests__/recapNarrativeClaims.test.js`

- le dos en fait, en relation, en transformation → trois claims, même topic, trois senses ;
- `disc_push_pull` et `relation.push_pull_stimulus` → même topic, même sense ;
- `span_new_variant` et `disc_emergence` → même topic, senses différents ;
- 42 % et 43 % → même `stateKey` ; 42 % et 58 % → `stateKey` différents ;
- candidat sans metrics → `stateKey` `present`, pas de texte inventé.

Aucun autre fichier ne change. L’UI est identique à la fin de cette phase.

---

## Phase 1 — Un registre pour les trois colonnes

But : une idée d’un même sens n’est racontée qu’une fois, quelle que soit la colonne. Une idée d’un sens plus profond reste.

### Fichier

`src/utils/sport/recapAdaptiveInsights.js`

`selectBalancedCandidates` aujourd’hui filtre `c.horizon === horizon` et tient `usedGroups` en local.

Modification :

- un seul passage produit les trois listes ;
- un registre `{ topic, sense }` vit pendant tout le passage ;
- avant d’accepter une carte : si le registre a déjà ce topic et ce sense, on la saute ;
- si le registre a ce topic avec un sense plus superficiel, on l’accepte ;
- le plafond, le score, le pilier, le groupe sémantique **dans** la colonne, et `MIN_COLUMN_WEIGHT` restent ;
- l’ordre de considération reste le score. Les priorités de période ont déjà choisi quelles découvertes existent. On ne les rejoue pas ici.

Conséquence voulue : « le dos fait 46 % » (fait) et « le dos prend plus de place que sur 30 jours » (relation) coexistent. « La poussée domine » et « le ratio penche vers la poussée » non : même topic, même sense, une seule des deux.

Si le registre vide une colonne, elle reste vide. Pas de carte de remplacement.

### Ce qu’on ne change pas

- `detectDiscoveries`, rivales, plafonds, `memoryFactor` ;
- `columnCapsForCandidates` ;
- le bonus +14 des `.disc_` **dans** cette phase (il est revu en phase 3, pas avant d’avoir le registre) ;
- le garde-fou 72 % et le cache.

### Tests

Étendre `recapColumnPipeline.test.js` :

- deux kinds, même claim, deux colonnes → une seule carte ;
- fait + relation du même topic → les deux colonnes gardent la leur ;
- troisième carte synonyme → rejetée, la colonne peut être plus courte ;
- aucun candidat au-dessus de 32 → « Aucun signal assez robuste » côté données vides, pas de phrase « pas assez de données ».

---

## Phase 2 — Mémoire d’une idée, pas seulement d’un kind

But : « 42 % » puis « 43 % » ne revient pas. « Le tirage est devenu structurel sur plusieurs semaines » revient, parce que le sens a changé.

### Fichiers

`insightNoveltyStore.js`
La mémoire enregistre, à côté de l’id, le claim `{ topic, sense, stateKey }`. Le jour courant reste ignoré (`themeCountBeforeLocalDay`, `startOfLocalDayMs`). On ne change pas cette règle.

`insightNoveltyEngine.js`
`computeCandidateNovelty` ajoute une lecture : même topic, même sense, même stateKey vu un jour précédent → pénalité forte, du même ordre que « kind vu au moins deux fois » (le facteur 0,42 existe déjà pour les kinds). Sense plus profond, ou stateKey différent → pas cette pénalité.

`recapPeriodDiscoveries.js` — `memoryFactor`
On n’abaisse pas 0,9 / 0,8 des portraits. Le registre et la pénalité de claim s’appliquent **en plus**, au moment du choix. Un portrait peut rester haut dans son détecteur et quand même perdre s’il répète le même état.

### Tests

- même claim, stateKey identique, jour précédent → la carte ne gagne pas si une autre idée existe ;
- même topic, sense `transformation` après un `fact` déjà montré → elle passe ;
- même claim montré **aujourd’hui** → pas pénalisé (réouverture de l’onglet dans la journée).

---

## Phase 3 — Relations et rotation

But : une relation occupe « ce que ça change » quand elle apporte le sens relation et qu’aucune découverte ne l’a déjà. La rotation ne choisit plus le sujet.

### Relations

Fichiers : `trainingRelationEngine.js` (étiquetage seulement), `recapAdaptiveInsights.js`.

- Chaque relation reçoit un claim via la table de la phase 0. On n’écrit pas de nouvelles relations.
- Même topic + même sense qu’une découverte déjà retenue → la découverte reste. Son texte est déjà une lecture complète (titre, corps, preuve).
- Sense relation ou transformation, et aucune découverte ne tient ce claim → la relation entre dans la colonne avec son poids actuel (`62 + pertinence + confiance`). On ne lui ajoute pas de bonus artificiel.
- Le +14 et le +10 des découvertes restent pour départager deux découvertes. Ils ne servent plus à écraser une relation dont le claim n’est pas déjà pris : le registre a déjà retiré le doublon avant le bonus.

On ne déplace pas `detectTrainingRelations` plus tôt dans le pipeline.

### Rotation

Dans `selectBalancedCandidates` :

- le `hash % 13` et le `hash signature % 17 * 0,3` ne s’ajoutent au score que si les deux meilleures cartes du même horizon sont à moins de 3 points **avant** ce hash ;
- au-delà de 3 points, le score brut gagne ;
- le hash du jour reste stable dans la journée, comme aujourd’hui.

Les priorités de période, les scores des détecteurs, les rivales et les plafonds ne sont pas touchés.

### Tests

- découverte et relation, même claim → une carte, la découverte ;
- relation seule sur un claim de niveau relation, découverte seulement au niveau fait → les deux colonnes ;
- deux cartes à 1 point d’écart → l’ordre peut suivre le hash du jour ;
- deux cartes à 10 points d’écart → la plus lourde gagne, quel que soit le jour.

---

## Phase 4 — Cas qui ne doivent pas régresser

Pas de nouveau mécanisme. Une passe de tests sur les garde-fous, et un correctif seulement si un test montre que le registre a mangé une escalade légitime.

| Règle | Où c’est déjà | Ce que la phase vérifie |
| --- | --- | --- |
| Sommeil = association | textes de `recapSleepCorrelation` / `detectDiscoveries` | aucun nouveau texte ; les kinds sommeil gardent leur nature |
| Baisse de reps ≠ baisse de capacité | phénomène `observed_output_indeterminate`, essai `capacity_vs_exposure` | le claim `volume.exposition` en relation absorbe les synonymes, il ne réécrit pas la conclusion |
| Record ≠ niveau | `journey_pr_vs_level`, `disc_ms_pr` vs `disc_ms_pr_consolidated` | fact et transformation restent deux senses |
| Coût aujourd’hui / plusieurs jours | `evaluateSessionCost` horizon | le claim suit cet horizon, on ne le recalcule pas |
| Second passage Garmin | `useRecapTabMetrics` 72 % | aucun changement dans ce fichier en phases 0–3 |
| Cache `span4` | même hook | idem |
| Colonne vide | `MIN_COLUMN_WEIGHT` 32 | le registre peut vider, il ne reremplace pas |
| Objectif utilisateur | essais `goal_gap`, conséquences dans les corps existants | pas un nouveau claim ; on ne juge pas à la place du texte déjà écrit |
| Phénomène qui supprime | `trainingPhenomenonEngine` `suppresses` | toujours en amont du registre |

Fichiers de tests existants à relancer tels quels :

- `recapPeriodDiscoveries.test.js`
- `recapColumnPipeline.test.js`
- `recapInterpretationPipeline.test.js`
- `recapAdaptiveInsights.test.js`
- `recapStimulusCatalog.test.js`
- `recapInterpretationPhase3.test.js` (groupes sémantiques)

---

## Phase 5 — Scénarios bout en bout

Fichier : `src/utils/sport/__tests__/recapNarrativeColumns.test.js`

Données minimales, pas de Garmin réel. Chaque scénario fixe les candidats (ou un petit snapshot) et lit les trois listes.

| Scénario | Attendu |
| --- | --- |
| Aucune donnée | trois colonnes vides, aucun texte « pas assez de données » |
| Une séance | au plus les faits de cette séance ; pas de transformation |
| Aujourd’hui vide | `disc_pending_session` en fait ; le contexte autour peut être relation ; pas de troisième reformulation |
| Semaine | portrait de volume en fait ; un seul texte de mix en relation |
| Mois / longue période | une transformation d’exercice possible ; les faits de semaine ne prennent pas la colonne parcours (pénalité « cette semaine » déjà là, on ne la modifie pas) |
| Trois kinds, même idée de poussée | une carte |
| Dos 42 % un jour, 43 % le lendemain | pas de seconde carte de fait |
| Dos devenu structurel après plusieurs semaines | carte de transformation, même si le fait a été montré |
| Découverte fait + relation même sujet | deux colonnes |
| Relation + transformation | deux colonnes, sens différents |
| Sommeil sous le seuil (`publishable`, 8 paires, 4 de chaque côté, 12 %, 35 reps) | aucune carte sommeil |
| Sommeil au-dessus du seuil | une carte, verbe d’association |
| Reps en baisse et fréquence en baisse | claim d’exposition, pas une carte « performance en baisse » en plus |
| Record isolé | fait ou « éloigné du reproductible », pas « ton niveau est le record » |
| Record reproduit | `disc_ms_pr_consolidated` en relation, pas en double du record brut |
| Coût sans ressenti | route B/C, la phrase dit que le ressenti manque |
| Coût ressenti | route A |
| Coût qui monte, reps/séance qui tiennent | route conflit |
| Garmin après coup, texte plus court de plus de 28 % | l’ancien paquet reste |
| Cache : sources pas prêtes, bundle déjà là | pas de second calcul pauvre |
| Plafond sommeil = 2 | la troisième carte sommeil du même angle ne passe pas |
| Rivales muscle / poussée / ratio | une seule dans la même colonne, comme aujourd’hui |
| Écart de score > 3 | pas de rotation |
| Jalon | au plus un par colonne |
| Progression non consolidée | pas la phrase « désormais consolidée » |
| Phénomène contraction | `volume_traj` supprimé en amont, le registre n’a pas à le réinventer |

---

## Seuils

Aucun de ces nombres ne change dans ce plan.

| Seuil | Fichier | Rôle | Décision |
| --- | --- | --- | --- |
| Score découverte &lt; 36, jalon &lt; 44 | `selectPeriodDiscoveriesWithTrace` | plancher de publication | conserver |
| Famille déjà prise et score &lt; 86 | idem | deuxième carte de la même famille | conserver |
| Caps sport/sommeil/jalon | `SIGNAL_FAMILY_CAPS` | maximum, pas un objectif | conserver |
| `memoryFactor` 1 / 0,9 / 0,8 / 0,6 / 0,42 / 0,22 / 0,12 / 0,15 / 0,18 | `memoryFactor` | répétition d’un kind | conserver ; le claim s’ajoute à côté |
| `MIN_COLUMN_WEIGHT` 32 | `recapAdaptiveInsights.js` | stop de colonne | conserver |
| +14 `.disc_`, +0..12 rotation, −16 groupe, −8 pauvre, −8..−14 pilier, −22 legacy | `selectBalancedCandidates` | départage | les bonus de détecteur restent ; la rotation passe en départage sous 3 points (phase 3) |
| +10 id `.disc_` puis poids essai 80–92 | `interpretationToLegacyCandidate` | découvertes devant les relations brutes | conserver ; le registre retire le doublon avant |
| Catalogue `strength` ≥ 64, 3 par horizon | `selectAnalysisCatalog` | publication de plage | conserver |
| `informationGain` &lt; 1 | `recapReasoning.js` | concept déjà dit **dans** le catalogue | conserver |
| Delta plausible ≤ 160, moitié ≤ 90 | `userTrainingState.js` | rejeter un +800 % | conserver |
| Contraction ≤ −12 %, rebond 7 j ≥ +5 %, suite ≤ −8 % | `trainingPhenomenonEngine.js` | un phénomène, pas trois cartes | conserver |
| Poussée ≥ 60 % | idem | spécialisation | conserver |
| Programme &lt; 55 % | idem | faible adhérence | conserver |
| Sommeil : 8 paires, 4+4, 12 %, 35 reps, coupures 7 h / 7 h 30 / 8 h / 90 % | `recapSleepCorrelation.js` | association publiable | conserver |
| Séances comparables, score ≥ 0,32 | `findComparableSessions` | même famille de séance | conserver |
| Baseline ≥ 3 séances, établi ≥ 5, consolidé 3 sur 4–5 | `buildExerciseBaseline` | record ≠ niveau | conserver |
| Coût : confiance ≥ 0,42, volume ≥ +18 %, tonnage ≥ +15 %, sommeil ≤ −25 min, reps/séance ≥ 92 % pour le conflit | `recapCostQuestion.js` | routes A–D | conserver |
| Garde-fou 72 % et score 80 | `useRecapTabMetrics.js` | second passage | conserver |
| Pénalité « cette semaine » −55, span ≥ 97 sur 30 j+ | `buildAdaptiveRecapInsights` | longues périodes | conserver |
| Jour pic ≥ 22 % et ≥ 2 jours | `disc_peak_day` | concentration | conserver |
| Réorientation ≥ 18 % du mois du muscle | `disc_muscle_reorient` | vrai déplacement | conserver |
| Progression \|écart\| ≥ 15 % | `disc_exercise_progress` | pas un bruit | conserver |

La seule règle numérique nouvelle est le bandeau de rotation : **3 points**. Ce n’est pas un seuil de détecteur. C’est la largeur en dessous de laquelle deux cartes sont traitées comme égales. Si, en test, 3 points laisse encore la rotation choisir un sujet, on le serre. On ne le pose pas dans les détecteurs.

La tranche de 10 points du `stateKey` sert uniquement à dire « 42 et 43, c’est le même état ». Elle ne publie pas une carte.

---

## Exemples

### A — Le dos à 45 %

`disc_muscle_now` → claim `mix.dos` / `fact` / bande 40. Colonne de gauche.

`disc_muscle_reorient` ne naît que si ce dos (ou un autre groupe) pèse ≥ 18 % du mois de ce groupe. Si oui → `mix.dos` / `relation`. Colonne du milieu. Le registre les garde toutes les deux.

`disc_push_pull` (« la poussée dépasse le tirage ») est un autre topic, `mix.poussee` / `relation`, seulement si ses seuils passent. S’il répète le même déséquilibre qu’une carte `disc_ratio_structure`, le registre n’en garde qu’une.

`disc_anchor` ou `disc_structural_memory` → `transformation`, seulement si le détecteur l’a émise. Sinon la troisième colonne ne reçoit pas une reformulation du 45 %.

### B — La poussée domine trois semaines

Semaine 1 : fait (`disc_muscle_now` ou `disc_push_pull` selon ce qui dépasse le seuil). Mémoire : topic + sense + état.

Semaine 2, part dans la même tranche : le fact est pénalisé par la mémoire de claim. S’il n’y a rien d’autre de solide, la colonne peut être plus courte. On n’écrit pas « la poussée domine encore ».

Quand `disc_structural_memory` ou `disc_quarter_arc` passe ses propres seuils : sense `transformation`, état nouveau. La troisième colonne le prend, même si le fait a été montré.

### C — Le volume baisse parce que la fréquence baisse

Le phénomène `contraction` ou `observed_output_indeterminate` supprime déjà `volume_traj` / une lecture de capacité. Le registre donne à ce qui reste le claim `volume.exposition` / `relation`. Une seconde carte « ta performance baisse » sur le même claim est écartée. Le texte reste celui du détecteur, qui parle d’exposition.

### D — Garmin arrive après

Inchangé. `useRecapTabMetrics` compare richesse et longueur. Sous 72 % des deux, avec un ancien score &gt; 80, l’ancien paquet reste. Le registre ne participe pas à ce choix.

### E — Deux kinds, une idée

`disc_push_pull` et `relation.push_pull_stimulus` → même topic, même sense. Le registre garde la découverte. La relation n’est pas affichée à côté.

### F — Une vraie transformation

`disc_exercise_progress` avec `consolidated` → topic de l’exercice, sense `transformation`, stateKey qui inclut `consolidé`. Même si `disc_exercise_share` a été montré (sense `fact`), la transformation passe. Si seul le pourcentage habituel est revu dans la même bande, sans nouveau sense, elle ne passe pas.

---

## Fichiers qu’on ne modifie pas

Sauf bug prouvé en phase 4.

- `recapPeriodDiscoveries.js` (détecteurs, voix, questions, rivales, caps)
- `recapSleepNight.js`, `recapSleepCorrelation.js`
- `recapMilestoneEngine.js`
- `recapCostQuestion.js`, `recapVolumeQuestion.js`, `recapRegularityQuestion.js`, `recapHistoryQuestion.js`
- `recapStimulusCatalog.js`, `recapPersonalBaselines.js`
- `userTrainingState.js`, `recapTrainingFeatures.js`
- `athleteTrainingIdentity.js`, `athleteJourney.js`
- `trainingPhenomenonEngine.js`
- `recapHorizonEssays.js` (les essais passent par le registre via leur kind, sans réécriture)
- `recapAnalysisCatalog.js` (les `span_*` sont reconnus par la table de claims)
- `RecapAnalyseView.jsx`
- `useRecapTabMetrics.js` (garde-fou et cache)

`recapReasoning.js` : `informationGain` reste la règle interne du catalogue. Le registre ne le duplique pas à l’intérieur du catalogue.

---

## Risques

| Risque | Parade |
| --- | --- |
| Le registre confond fait et relation, les colonnes se vident | la phase 0 teste les senses avant d’activer le filtre ; un claim sans topic connu ne bloque personne (`topic` null = pas de dédup) |
| Une transformation légitime disparaît | elle n’est bloquée que si une carte du **même** sense existe déjà |
| Les portraits utiles du jour disparaissent | la mémoire ignore le jour courant, comme aujourd’hui |
| La rotation à 3 points est encore trop large | on serre le bandeau dans le test de la phase 3, sans toucher aux détecteurs |
| Un kind oublié dans la table se duplique encore | topic null : comportement actuel conservé pour ce kind. On complète la table quand un test le montre, on ne devine pas |
| Régression sommeil, coût, Garmin | phase 4, fichiers de tests existants, ces modules non édités |

---

## Ordre

1. Phase 0 — table de claims et tests. Affichage inchangé.
2. Phase 1 — registre commun. C’est le changement visible.
3. Phase 2 — mémoire topic + sense + état.
4. Phase 3 — relations laissées entrer quand le sens est libre ; rotation en départage.
5. Phase 4 — relance des tests existants, correctif seulement sur régression.
6. Phase 5 — scénarios bout en bout.

On s’arrête entre les phases pour vérifier les colonnes sur de vraies périodes (Aujourd’hui, 7 jours, 30 jours) avant de passer à la suivante.
