# Audit & corrections P0 — fiabilité trajectoire / émergence / témoins

**Date :** 30 octobre 2026  
**Périmètre :** constats tirés de l’export console `30d` + vérification dans le code réel + corrections ciblées  
**Méthode :** chaque point a été classé **AVÉRÉ / PARTIEL / NON CONFIRMÉ**, puis corrigé seulement si avéré (ou partiellement avéré avec cause code claire).

Fichiers principaux touchés :
- `src/utils/sport/exerciseTrajectoryAnalysis.js`
- `src/utils/sport/recapPersonalBaselines.js`
- `src/utils/sport/recapPeriodDiscoveries.js` (bit structural_memory)
- `src/utils/sport/__tests__/exerciseTrajectoryAnalysis.test.js` (+27 tests verts)

---

## Synthèse

| # | Constat utilisateur | Verdict | Action |
| --- | --- | --- | --- |
| 1.A | Moyennes contradictoires pompes déclinées | **AVÉRÉ** | Références nommées + texte sur `lastPerformance` |
| 1.A | `vsInitialPct` −46,7 % vs « retour au départ » | **AVÉRÉ** (définitions distinctes) | Aliases + doc metrics ; texte ne masque plus le mélange lateMean |
| 1.A | Format séries « stable » malgré totaux seuls | **AVÉRÉ** | Split sans chevauchement + granularité `partial` |
| 1.A | `interpretingWithHistory: false` avec séances hors fenêtre | **AVÉRÉ** | Flag vrai dès qu’il y a du contexte pré-fenêtre dans l’arc |
| 1.B | Témoin « Pompes déclinées » id 202 ≠ sujet 104 | **AVÉRÉ** | Exclusion des homonymes (même label, autre id) |
| 1.B | Verdict `localized_rise` sur un rebound | **AVÉRÉ** | Nouveau verdict `localized_recovery` |
| 1.C | « commence à s’installer » après 2 séances | **AVÉRÉ** | Nouveau stade `repeated` |
| 2.A | Séries insuffisamment distinguées | **AVÉRÉ** | `granularity` + limites explicites |
| 2.B–C | Body / programme non croisés | **AVÉRÉ (architecture)** | *Non corrigé dans ce lot* (P3) |
| 3 | Sélection / starved / scores | **PARTIEL** | *Non corrigé dans ce lot* (P4) |
| 4 | Corrélations sommeil fragiles | **PARTIEL** | *Non corrigé dans ce lot* (P3) |
| 5 | Cohérence temporelle | **AVÉRÉ (partie)** | Flag historique + vocabulaire émergence |
| 6 | Traçabilité console / compteurs | **AVÉRÉ (doc)** | Aliases baselines ; console P5 reportée |
| 7 | Données manquantes RPE / Garmin | **AVÉRÉ (inventaire)** | Pas de faux remplissage |

---

## 1.A — Pompes déclinées : références temporelles

### Ce qui était réel

Sur le candidat live `disc_exercise_progress` (exercice **104**) :

| Indicateur | Valeur export | Définition réelle dans le code |
| --- | --- | --- |
| `volume.meanPerSession` | **17,7** | Moyenne des **6** séances **dans la fenêtre** `(10+10+10+10+30+36)/6` |
| `currentMean` | **19,2** | Moyenne des **5 dernières séances lifetime** (dernière comprise) `(10+10+10+30+36)/5` — `buildExerciseBaseline` |
| `recentMean` | **14** | Moyenne des **5 séances avant la dernière** `(10+10+10+10+30)/5` |
| `historicalMean` | **36** | Moyenne des **5 premières** séances lifetime |
| `vsInitialPct` | **−46,7 %** | `(currentMean − historicalMean) / historicalMean` |
| `shape.earlyMean` / `lateMean` | **27,3 / 25,3** | Première / dernière moitié de l’**arc** de 8 séances |
| `shape` path | `decline_then_full_recovery` | Jugé sur **dernière séance (36)** vs earlyMean, **pas** sur lateMean |

Le texte affiché disait pourtant « revenu vers ≈**25,3** … proche du départ (≈27,3) », ce qui **mélangeait** la moyenne des dernières séances de l’arc (encore polluée par le creux) avec le jugement de reprise (qui repose sur la **dernière** séance à 36).

### Comment c’est corrigé

1. **`referenceLevels`** sur `classifyShape` : `arcEarlyMean`, `arcLateMean`, `lastPerformance`, `trough`, `recoveryJudgedBy: 'last_session_vs_arc_early'`.
2. **Texte `recovered`** : raconte creux → **dernière séance** → proximité du départ d’arc ; précise explicitement que la moyenne late **mélange** creux et reprise.
3. **`baselineTraceMetrics`** : aliases `lifetimeFirstMean` / `lifetimeRecentInclLast` / `lifetimeRecentExclLast` + `meanDefinitions` pour la console.
4. **`interpretingWithHistory`** : `true` dès que l’arc contient des séances **avant** `window.start` (cas pompes : 7 et 14 sept. dans un run 1–30 oct.).

### Pourquoi

Sans noms distincts, la sélection et la rédaction traitaient plusieurs moyennes comme « le niveau ». Une reprise réelle sur la dernière séance ne doit ni être niée par `vsInitialPct` lifetime, ni présentée via une moyenne qui dilue encore le creux.

---

## 1.B — Exercices témoins mal identifiés

### Ce qui était réel

Dans `peers.items` du même candidat :
- Sujet : id **104** « Pompes déclinées »
- Témoin retenu : id **202** « Pompes déclinées » (stable ~40 reps)
- Le texte citait donc **le même nom** que le sujet comme témoin « stable »

Cause : `analyzePeers` filtrait seulement `exId !== exerciseId`, puis matchait la **famille de mouvement** — un doublon de libellé passait.

Le verdict `localized_rise` venait du delta early→late **dans la fenêtre** (10 → ~25), alors que la story était un **rebound**, pas une hausse nette isolée.

### Comment c’est corrigé

1. Exclusion des peers dont le **libellé normalisé** = celui du sujet (`skippedSameLabel`).
2. Affichage des témoins avec **`[id …]`** dans la phrase.
3. Si story rebound/`recovered`/`partial_recovery` + témoins stables → verdict **`localized_recovery`** (plus `localized_rise`).
4. Limite diagnostic `peer_same_label_excluded` exposée dans les findings.

### Pourquoi

Une comparaison métier exige une **identité stable**. Un homonyme n’est pas un témoin ; une reprise après creux n’est pas une « hausse ».

---

## 1.C / P2 — `disc_emergence` trop affirmatif

### Ce qui était réel

Pour 2 séances à 7 jours (curl assis, pompes inclinées, etc.), `classifyInstallation` renvoyait `kind: 'installing'` → titre « **commence à s’installer** », alors que le `detail` admettait déjà « trop tôt pour parler d’habitude durable ».

### Comment c’est corrigé

Échelle explicite :

| Stade | Kind | Critère |
| --- | --- | --- |
| Apparition | `first_session` / `first_cluster` | 1 séance ou cluster serré |
| Répétition | **`repeated`** | ≥2 séances, span ≥7 j, **&lt;3 séances** |
| Installation progressive | `installing` | ≥3 séances, span ≥7 j |
| Intégration durable | `installed` | ≥3 séances, span ≥14 j |

Titre `repeated` : « **format repris, pas encore installé** ».  
La promotion automatique « s’installe » via hausse de séries exige désormais `installing`/`installed` et ≥3 séances.

### Pourquoi

Apparition ≠ répétition ≠ installation. Deux séances à format identique prouvent une **répétition**, pas une intégration programme.

---

## 2.A / P0.3 — Granularité des séries

### Ce qui était réel

`classifySetMechanism` prenait `trusted.slice(0, n)` et `trusted.slice(-n)` → pour pompes, **14 sept.** apparaissait à la fois dans `before` et `after`. Seules 3/8 séances avaient des séries fiables ; le détail affirmait pourtant un format stable « du même ordre » sans dire que le creux n’avait que des totaux.

### Comment c’est corrigé

1. Split **sans chevauchement** de dates.
2. Si creux connu : comparer uniquement trusted **avant** vs **après** la date de creux.
3. Champs `granularity` (`full` | `partial` | `totals_only`), `totalsOnlySessions`, `missingSetDetailDuringTrough`.
4. Stance `watch` + phrase explicite quand le creux n’a pas de séries.
5. Limite `partial_set_detail` dans les findings.

### Pourquoi

Un total de séance n’est pas une décomposition. Affirmer la stabilité du format sur toute la trajectoire sans séries pendant le creux est une conclusion **non étayée**.

---

## Points audités mais **non corrigés** dans ce lot

Ces points sont **réels** (confirmés dans l’export / le code) mais hors P0 d’implémentation immédiate — à traiter ensuite dans l’ordre du plan.

### 2.B — Body × performances (`body_x_performance`)

**AVÉRÉ.** 6 mesures corporelles présentes ; opportunité `impossible_with_data` / famille non instrumentée.  
→ Chantier P3 : exposer la famille corporelle + chronologie avant toute corrélation.

### 2.C — Adhérence × progression (`adherence_x_progression`)

**AVÉRÉ.** `not_implemented` alors que programme actif + complétions + perfs existent.  
→ Chantier P3 : producteur dédié, sans causalité forcée.

### 3 — Sélection / Composition / starved

**PARTIEL.** Les rejets `story_duplicate_composition`, caps, et familles starved (adhérence, mobilité) sont visibles dans la console. La fusion sémantique riche n’est **pas** encore faite.  
→ Chantier P4.

### 4 — Sommeil × volume / familles musculaires

**PARTIEL.** Les chiffres d’association existent ; le risque de sur-interprétation (volume brut, petits n, « confiance élevée ») est réel.  
→ Chantier P3 : nuancer + comparer intra-exercice / familles avec dénominateurs vérifiés.

### 5 — Vocabulaire temporel hors trajectoire

**PARTIEL.** Le flag historique et l’émergence sont corrigés ; d’autres cartes (jalons « il y a deux semaines », etc.) restent à homogénéiser sur `window.end` du run.

### 6 — Traçabilité console & compteurs pipeline

**AVÉRÉ comme limite documentée** (`data_consumed_partial`, rejets agrégés).  
→ Chantier P5 : lineage donnée→texte + compteurs non additionnables entre étapes.

### 6.C — Durées adaptive / composed

**AVÉRÉ (risque de double comptage).** Les stages nested peuvent se chevaucher ; ne pas sommer adaptive + composed comme wall-clock total.  
→ Profilage interne reporté (P5).

### 7 — RPE / activités Garmin absents

**AVÉRÉ.** Importance haute pour RPE et cardio typé ; sommeil/marche manuels faibles si Garmin couvre.  
→ Pas de données artificielles ajoutées (contrainte respectée).

---

## Validations exécutées

```text
npx vitest run src/utils/sport/__tests__/exerciseTrajectoryAnalysis.test.js
→ 27 passed
```

Couverture ajoutée / renforcée :
- moyennes fenêtre vs `lastPerformance` (scénario pompes déclinées)
- `interpretingWithHistory` avec contexte sept.
- séries : no-overlap + `partial`
- exclusion homonyme id 202
- émergence 2 séances → `repeated`

---

## Avant / après (pompes déclinées — logique attendue)

| Aspect | Avant | Après |
| --- | --- | --- |
| Phrase de reprise | « revenu vers ≈25,3 … proche du départ ≈27,3 » | « dernière séance revenue à ≈36 … proche du départ d’arc » + avertissement sur lateMean |
| Témoin homonyme | Cité comme stable | Exclu + limite `peer_same_label_excluded` |
| Verdict peers | `localized_rise` | `localized_recovery` (si story rebound) |
| Séries | before/after chevauchants, certitude implicite | no-overlap, `partial`, stance `watch` |
| Historique | `interpretingWithHistory: false` | `true` dès contexte pré-fenêtre |
| Émergence 2 séances | « commence à s’installer » | « format repris, pas encore installé » |

---

## Prochaine vague recommandée (inchangée dans l’esprit du plan)

1. **P3** — producteur assiduité × progression + body chronologie (sans causalité).  
2. **P3** — sommeil : intra-exercice / familles + ton moins catégorique.  
3. **P4** — fusion composition + préservation du contenu des cartes starved.  
4. **P5** — lineage console + compteurs d’étapes disjoints.

Aucun commit Git n’a été créé (demande explicite requise).
