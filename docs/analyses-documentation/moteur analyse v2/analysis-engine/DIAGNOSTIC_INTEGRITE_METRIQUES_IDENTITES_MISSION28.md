# DIAGNOSTIC — Intégrité métriques & identités — Mission 28

Baseline gelée : `artifacts/analysis-eval/mission28-baseline/` (exports utilisateur v26).

Édition code après correction : `p6-sovereign-v27`.

## 1. Parent parallèle orphelin (Hyperextension)

### Observations v26

Sur **3m uniquement** :

| Élément | État |
|---|---|
| Enfants `disc_structural_memory\|ex:1979012181` / `ex:703294235` | publiés en réserve, `hierarchyLink.ok=true` |
| `parentId` | `parallel_traj\|…\|span:recent30\|sess:4\|cal:1gjmgdz\|2` |
| Parent recent30 dans `cardRegistry` 3m | **absent** |
| Parent publié 3m | `span:quarter\|sess:8\|…` (émergences) |
| Disposition parent recent30 | `source_retained` / `exact_duplicate_suppressed` |
| `collapsedInto` | **null** |
| `fusionLineage.survivorId` | `unknown\|period:global\|…` |

Sur 7d / 30d / 6m / 1y / 2y / all : parent recent30 présent → pas d’orphan.

### Investigation (réponses obligatoires)

1. **Création** : `applyParallelTrajectoryComposition` — aspect `span:recent30` car obsSpan ≈ 25 j.
2. **Après composition** : parent présent + enfants `collapsedInto` = son id.
3. **Après hiérarchie** : intact ; un second parent `quarter` est aussi composé (émergences, obsSpan ≈ 53 j).
4. **Après sélection** : `marginalValue.overlap===1` → `exact_duplicate_suppressed` **sans destination**.
5. **Disposition** : source retenue, non publiée ; enfants restent liés.
6. **Identités** : `metrics.subjectKey=parallel:…` était **ignoré** par `subjectKey()` au profit de `name:hyperextension` → faux rapprochement.
7. **Enfants conservent le lien** : composition écrit `collapsedInto` ; publication ne redirige pas si le parent disparaît.
8. **Nature** : disposition + équivalence abusive (pas une perte de publication seule).
9. **Invariant M27** : détecte `orphan_parent` à l’audit, **ne corrige pas** à la publication.
10. **Correction générique** : (a) honorer `subjectKey` explicite ; (b) aspects parallèles distincts ≠ équivalents ; (c) suppression avec destination ; (d) réconciliation orphan à `insightsFromP6`.

### Cause réelle (contredit partiellement ChatGPT)

Ce n’est **pas** une collision d’identité d’aspect manquante (corrigée M27).  
C’est une **suppression sélective injustifiée** du parent recent30 face au parent quarter, aggravée par `subjectKey()` qui préférait le libellé homonyme.

## 2. Métriques / dénominateurs

### Hypothèse ChatGPT

La composition utilise `windowMeanPerSession` / `arcLateMean` comme volume de fenêtre.

### Vérification code

**Confirmée.** `extractRecentReps` préférait explicitement :

`windowMeanPerSession` → `arcLateMean` → … → `recentReps` / `totalReps`.

D’où le parent « ≈48 vs 48, Δ0 » alors que les textes enfants affirment 192 / 96 / 144.

### Contrat rétabli (v27)

| Champ | Rôle | Interdit comme |
|---|---|---|
| `recentReps` / `totalReps` / `windowTotalReps` | total de fenêtre | — |
| `windowMeanPerSession` / `arcLateMean` | moyenne/séance | total |
| `prevReps` | total comparateur | moyenne de phase |
| `arcEarlyMean` | moyenne de phase | total antérieur |

Delta uniquement si même `volumeKind`. Sinon : étiqueter `/séance` ou s’abstenir.

## 3. Identités M27 — portée réelle

| Autorité | Opérationnelle ? | Limite v26 |
|---|---|---|
| Sujet | Partielle | `metrics.subjectKey` écrasé par `name:` |
| Phénomène aspecté | Oui pour composition | Contournée par `relateClaims` REFORMULATION |
| Assertion | Oui pour claims neufs | Alias titre+corps encore dans certains `phenomenonId` hérités |
| Présentation | Oui (`presentationWindow`) | OK |

Les clés titre\|corps dans `phenomenonId` v26 sont surtout des **alias hérités** des producteurs structural_memory, pas des clés de rapprochement sélection — sauf lorsqu’elles alimentent la prose d’identité. Elles ne doivent plus servir de clé primaire.

## 4. Mémoire

| Signal v26 | Explication |
|---|---|
| 1 phénomène pack + store | Succès M27 (clé profil) |
| `publicationCount=0` | `notePublication` ne poussait **jamais** dans `memory.publications` |
| 7d `previousState=null` vs 30d `confirmed_once` | Horizons consomment des états à des moments différents de la campagne ; pas nécessairement une corruption |
| 258 memoryAbsent | Surtout instrumentation / méthodes inapplicables — à requalifier, pas à « remplir » |

Correction : `appendPublication` branché sur `evolveCollectivePhenomenonMemory`.
