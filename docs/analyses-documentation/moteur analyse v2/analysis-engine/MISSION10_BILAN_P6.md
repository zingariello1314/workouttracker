# Mission 10 — Bilan P6 (défauts live, maturité, tentative de clôture)

Verdict : **correctifs live critiques livrés (sommeil, preuves, publication, durées, DOM, A/B) — édition v9 — critères de clôture P6 non tous démontrés — NO-GO P7 — P6 non candidate à la validation finale.**

Édition livrée : `editorial=p6-sovereign-v9` · `program=structural-execution-v1` · `review=collective-pass4-v6` · `claim=proof-pipeline-v3` · `sleep=association-prose-v1`

Références gelées :

- v8 avant Mission 10 : `artifacts/analysis-eval/baselines/p6-replay-p6-sovereign-v8-before-mission10.json`
- Rejeu Mission 9 (archive) : `artifacts/analysis-eval/replays/p6-replay-v8-latest.json` — **ne pas confondre avec un PASS live 21 nov.**

Pas de commit. Pas de P7. Données utilisateur non modifiées.

---

## 0. Séparation stricte des évaluations

| Couche | Contenu | Statut |
|---|---|---|
| 1. Archives | Bilans M7–M9, ZIP v8 19 nov., baseline v7/v8 | Conservées, hors verdict live |
| 2. Snapshot 19 nov. | A/B/C PASS × 8 sous v8 | **Archivé** — sans sommeil live problématique |
| 3. Huit paquets live 21 nov. | Export réel `editorial=v8`, fingerprint `52166d1d` | **A FAIL** (sommeil) ; B PASS synthétique sans aveugle ; C PASS sur paquet évalué |
| 4. Jeux synthétiques de généralisation | Unitaires M7–M9 (PPL-like, familles, adhérence) | **Partiels** — pas 8 paquets exportés complets |
| 5. Jugement qualitatif externe | Non exécuté ici | **Non vérifié** |

Règle : le PASS d’un paquet / d’un rejeu hors navigateur **n’est pas** un PASS des huit horizons live.

---

## 1. Sommeil — régression `association_not_causation`

### Cause racine

Chaîne : producteurs sommeil → `claimFromDiscovery` (ajoute `association_not_causation` dans `limitations`) → `draftFromClaim` / `bodyFromParts` → publication.

Sur live v8, après strip titre / corps, le **code de limitation** devenait le corps public (ou le préfixe), y compris sur des cartes prioritaires. Ce n’était pas un masquage UI : le draft injectait le code brut.

### Correctifs

| Couche | Fichier | Effet |
|---|---|---|
| Rédaction | `draftFromClaim.js` | `LIMIT_PROSE` ; contenu analytique d’abord ; jamais de code technique seul ; limitation seule refusée si un corps legacy existe |
| Claim / preuves | `analyticalClaim.js` | `observedValuesOf` propage `threshold`, `highN`, `lowN`, `highVol`, `lowVol`, densités, familles, etc. |
| Producteur volume | `recapPeriodDetectDiscoveries.js` | `disc_sleep_volume` : `populationLabel` + `observedValues` explicites ; distinction sample `all` vs fenêtre |
| Consolidation | `recapSleepCorrelation.js` | Seuils proches mutualisés ; corps analytique conservé ; limite structurée |
| Édition | `analysisEdition.js` | bump → **v9** + `sleep=association-prose-v1` |

### Avant / après (exemple `disc_sleep_volume`)

**Avant (live 21 nov.)**

- Titre : « Tes journées à fort volume s’alignent sur un seuil de sommeil personnel »
- Corps : `association_not_causation`
- `proof.observedValues=[]`, `assertions.value=null` malgré `threshold=7.5`, `highN=17`, `lowVol=233`, …

**Après (contrat v9, test `mission10SleepDraft`)**

- Corps rédigé avec moyennes / écart / n séances
- `limitations` contient toujours `association_not_causation` (propriété structurée)
- Preuves numériques présentes dans le claim
- Prose de limitation uniquement si utile et non déjà dite

### Critère « zéro corps technique accessible »

- **PASS démontré** en unitaires (draft + claim)
- **Non vérifié** sur rejeu live 21 nov. post-v9 (export navigateur non rejoué dans cette session)

---

## 2. Populations / durées (2 h 15 vs 9 min)

### Audit

`recapPeriodMeasure` distingue :

- `minutes` = hors course (séances)
- `totalMinutes` / `runningMinutes`
- `durationContract.minutesMostlyChallenge` quand le chronomètre est dominé par les défis

### Correctif

`describeActivityDuration` : si `minutesMostlyChallenge`, formulation explicite — durée **partielle** (défis), distincte du volume global de répétitions. Interdit de laisser croire qu’on densifie le volume global avec ce dénominateur.

### État

| Sous-critère | État |
|---|---|
| Deux chaînes nommées (activité enregistrée vs hors course) | **PASS** (contrats + tests M1) |
| Qualification défis / population partielle | **PASS** démontré (prose) |
| Audit bout-en-bout des deux cartes live (Aujourd’hui vs 7j) sur export 21 nov. | **Non vérifié** post-v9 |
| 17 vs 18 jours / GTG / pompes / isométrie / course | **Partiellement démontré** (contrats existants P0–P5) |
| « 100 % force » = catalogue ≠ physiologie | **Partiellement démontré** (limites rédactionnelles déjà présentes ; pas de nouvel inventaire live) |

---

## 3. Publication — `disc_th_pushPull_journey` hors `accessible`

### Constat live

Sur 3m / 6m / 1y : 11 priorités registre, accessible = priorité+réserve − 1 ; carte « Le haut du corps travaille surtout en poussée » présente en priorité registre, absente d’accessible. Réconciliation id pouvait rester `reconciled=true` via alias alors que le contrat produit « priorité ⊆ accessible » cassait.

### Correctifs (`p6Publication.js`)

- Ne pas republier en réserve une conclusion déjà prioritaire (`already_in_priority`)
- Suppression sémantique d’une **priorité** seulement si preuve forte (`same_text_and_proof` / `same_semantic_phenomenon` / population partagée) ; sinon **les deux restent accessibles**
- Champs `priorityPublished`, `priorityMissingAccessible`, `priorityContractOk` — autorité `p6` exige le contrat priorité

### État

| Sous-critère | État |
|---|---|
| Contrat priorité ⊆ accessible | **PASS** (code + structure) |
| Rejeu live 21 nov. post-fix | **Non vérifié** |
| Jeu C sémantique (pas seulement texte exact) | **Partiellement démontré** (M7–M9 + structure ; pas re-export live) |

---

## 4. Jeux A/B/C — fiabilité

### Modifications Mission 10

- Jeu B : `scored` reste informatif ; `passScope=synthetic_refs_only` si pas d’aveugle ; `closureNote` explicite ; refs en échec comptées
- Négations / `NOT_APPLICABLE` / `hit_abstain` : conservés (M9), non assouplis pour « vert »

### État

| Sous-critère | État |
|---|---|
| Négations interprétées | **PASS** (tests M9) |
| `NOT_APPLICABLE` ≠ PASS | **PASS** |
| `hit_abstain` seulement si abstention attendue | **PASS** (collectif non lié) |
| `scored` ≠ succès qualitatif | **PASS** (M10) |
| A/B/C × 8 horizons live post-v9 | **Non vérifié** |
| Cartes volontairement mauvaises → FAIL | **PASS** partiel (tests ciblés M9/M10) |
| Comparaison humaine à l’aveugle | **FAIL / non effectuée** |

---

## 5. Programme dynamique / adhérence / collectif

| Sous-critère | État |
|---|---|
| Trois familles structurelles | **PASS** (graphe + découvertes) |
| Lien pratique (variante ≠ capacité) dans la prose d’ensemble | **PASS** (enrichissement M10 `reasonAboutProgramFamilies`) |
| Adhérence longitudinale jusqu’à carte publiée | **Partiellement démontré** (producteurs + tests ; pas rejeu 8 horizons live) |
| `muscleKeys` abusifs (`street_workout`, …) exclus de la famille musculaire | **PASS** (tests M9) |
| Packs complets hybride / PPL / full body / glissant / irrégulier / sans programme / multi-versions | **Partiellement démontré** (unitaires ≠ exports complets avec preuves) |
| Collectif nommé + contre-exemples | **Partiellement démontré** |

---

## 6. Horizons longs

| Sous-critère | État |
|---|---|
| Soft-cap structure vs émergence individuelle | **PASS** (tests M9) |
| Cas référence interruption 113 j vs « première apparition » | **Non vérifié** sur live 21 nov. post-v9 |
| 1y ≠ 2y/all quand couverture utile diverge | **PASS** (logique couverture identique reconnue) |
| Arc juin→septembre→novembre relié | **Partiellement démontré** |

---

## 7. Hiérarchie / profondeur

| Sous-critère | État |
|---|---|
| Distinction principale / complémentaire / approfondissement | **Partiellement démontré** |
| Élimination titre=corps, termes techniques, limites présentées comme sport | **Partiellement démontré** (sommeil technique corrigé ; reste à prouver sur live) |
| Nombre de priorités émergent de la richesse | **Partiellement démontré** (soft-cap ; live encore ~11) |

---

## 8. Mémoire et 4ᵉ passe

| Sous-critère | État |
|---|---|
| Stabilité / nouvelle séance / retour / correction tardive | **Non vérifié** (pipeline réel alimenté) |
| `memory.historyCount` nuls dans export | **Non vérifié** (export vs historique absent vs bug) |
| 4ᵉ passe : faiblesse → faits → alternatives → enrichissement ou abstention | **Partiellement démontré** (`reexplored` existant ; pas d’exemples live complets M10) |

---

## 9. Export audit / DOM / concordance

| Sous-critère | État |
|---|---|
| Comparaisons allégées (refs + diff, plus dossiers complets ×4) | **PASS** (`analysisComparisonExport.v2`) |
| `data-coverage.json` par source (pas seulement fingerprint) | **PASS** (v2) |
| Fingerprint exhaustif programme/charges/sommeil/… | **Partiellement démontré** |
| DOM : périmètre accessible (prio+réserve), pas prio vs DOM complet | **PASS** (fix `domEightPeriodVerify` + `analysisPeriodExport`) |
| `domVerified=true` forcé | **Interdit respecté** |
| Vérification DOM 8 périodes authentifiées | **Non vérifié** (navigateur) |
| Archive unique complète post-v9 | **Non vérifié** |
| Taille eight-periods (~187 Mo) | **Partiel** (comparaisons allégées ; dossiers période encore lourds) |

### Procédure DOM utilisateur (si navigateur authentifié inaccessible)

1. Ouvrir Récap → Analyse, édition courante affichée.
2. Pour chaque période : attendre `ready`, ouvrir priorité + réserve.
3. Console → « Vérifier DOM huit périodes » / export dossier complet.
4. Exiger `compareScope=accessible_including_reserve` et `domVerified` seulement si observé.

---

## 10. Recette de clôture — exécution réelle

| Étape | État |
|---|---|
| 1. Rejeu 19 nov. (comparaison historique) | Baseline v8 **gelée** ; rejeu v9 **non relancé** dans cette session |
| 2. Rejeu données récentes + sommeil | **Non vérifié** |
| 3. Jeux synthétiques généralisation | **Partiel** (batches unitaires) |
| 4. Suites non-régression P0–P6 | **Partiel** — lots ciblés verts, **pas** suite Vitest complète |
| 5. Mémoire / rotation | **Non vérifié** |
| 6. A/B/C × 8 snapshots | **Non vérifié** post-v9 |
| 7. Produit / DOM | **Non vérifié** |
| 8. Aveugle qualitatif | **Non effectué** |

### Batches Vitest exécutés (conservés)

- `mission10SleepDraft` + export + evaluationGames + M7/M8/M9 + M1 metrics + p6AnalyticalIntelligence → **81 PASS**
- `p6SovereigntyMission5` + `recapSleepCorrelation` + `p6Mission5BisReplay` → **35 PASS**

**Total démontré ici : 116 tests ciblés verts — ce n’est pas la suite complète.**

---

## 11. Tableau critères spécification P6 (Mission 10)

| Critère | État |
|---|---|
| Aucune contradiction factuelle connue non résolue | **Partiellement démontré** (correctifs code ; live post-v9 absent) |
| Aucun corps technique / vide accessible | **PASS démontré** (unitaires) / **non vérifié** live |
| Aucune perte silencieuse de conclusion admissible | **Partiellement démontré** |
| Aucune incohérence de publication (prio ⊆ accessible) | **PASS** (contrat code) / **non vérifié** live |
| Preuves vérifiables | **PASS** sommeil+claims unitaires ; **non vérifié** 8 horizons live |
| Sélection collective pertinente | **Partiellement démontré** |
| Raisonnements structurels / longitudinaux démontrés | **Partiellement démontré** |
| Généralisation multi-programmes | **Partiellement démontré** |
| Mémoire et rotation vérifiées | **Non vérifié** |
| Évaluations indépendantes fiables | **Partiellement démontré** (scope synthétique explicite) |
| Non-régressions exécutées | **Partiellement démontré** |
| Concordance produit | **Non vérifié** / DOM bloquant si non observé |
| **Clôture P6** | **NON** |
| **P6 candidate à la validation finale** | **NON** |
| **P7** | **NO-GO** (aucune autorisation) |

---

## 12. Blocages restants pour proposer la clôture

1. **Rejeu live post-v9** des huit horizons avec sommeil (corps + preuves + populations).
2. **A/B/C par période** sur ce rejeu, séparés des archives v8.
3. **Suite Vitest complète** séquentielle avec artefacts.
4. **Mémoire réellement alimentée** + exemples 4ᵉ passe vérifiables.
5. **DOM** observé à périmètre accessible sur les huit périodes.
6. **Aveugle qualitatif** externe.
7. **Packs d’export** de généralisation (pas seulement unitaires).
8. Réduction complémentaire de `eight-periods.json` (référentiels faits/claims/cartes) au-delà des comparaisons v2.

---

## 13. Améliorations par nature

| Nature | Exemples M10 |
|---|---|
| Preuve | `observedValuesOf` sommeil étendu ; volume avec preuves attachées |
| Rédaction | Plus de corps = code limitation ; prose défis / population |
| Raisonnement | Familles de programme liées à la lecture pratique |
| Sélection / publication | Contrat priorité accessible ; DOM scope corrigé |
| Évaluation | Scope B synthétique vs clôture ; coverage sources |

---

*Mission 10 — tentative de clôture : fondations live critiques corrigées en v9, preuves de clôture métier encore incomplètes. Ne pas démarrer P7.*
