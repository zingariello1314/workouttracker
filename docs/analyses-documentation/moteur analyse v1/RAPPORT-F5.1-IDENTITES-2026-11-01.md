# RAPPORT F5.1 — Fiabilisation des identités historiques  
**2026-11-01** — Aucun commit. F6/F7 non engagés. Live : non inspecté.

## Verdict

Les rivalités F5 ne fusionnent **plus** sur le seul nom affiché.  
`103`/`503` (Dips) et `104`/`504` (Pompes déclinées) sont classés **même nom, storage distincts, aucun alias prouvé** → les cartes peuvent coexister.

Sur **6 mois**, F5.1 **réintroduit** légitimement « Dips : volume stable » (`503`) à côté de « Dips : recul » (`103`) — ce n’était pas une contradiction d’identité, c’était une fausse équivalence F5.

---

## 1. Audit IDs `103/503` et `104/504`

Fixture `workout-main-jul-oct-2026` + `exercise-name-map-main.json`.

| Paire | Noms | Séances A / B | Chevauchement de dates | Alias explicite dans le code / snapshot | Classification |
| --- | --- | ---: | ---: | --- | --- |
| **103 / 503** | Dips / Dips | 19 / 13 | **0** | Aucun | **4 — entrées distinctes partageant un nom** (indéterminé comme alias) |
| **104 / 504** | Pompes déclinées / … | 16 / 9 | **0** | Aucun | **4 — idem** |
| **106 / 505** | Relevés… / Relevés… | 11 / 7 | **0** | Aucun | **4 — idem** (même pattern programme A/B) |

**Pas** des doublons techniques prouvés, **pas** d’alias historique démontré.  
Les historiques ne se chevauchent jamais le même jour → vraisemblablement deux emplacements de programme (jours différents) homonymes, pas une migration d’id documentée.

`resolveStorageExerciseIdentity` affirme déjà : *« Ne fusionne jamais deux storageId distincts sur un homonyme. »* F5 avait contredit ce contrat en privilégiant `name:` pour `exerciseKeyOf`.

---

## 2. Identité vs similarité (API)

Module `recapEditorialIdentity.js` :

| Relation | Signification | Autorise rivalité / contradiction ? |
| --- | --- | --- |
| `sameExerciseIdentity` | Même storageId **ou** alias explicite (`identityAliases`, `identityLink.proven`) | **Oui** |
| `sameHistoricalEpisode` | Identité prouvée + continuité/reprise compatible | Oui (épisode) |
| `sameDisplayName` | Même libellé visible | **Non** (diagnostic seulement) |
| `sameMovementFamily` | Famille biomécanique (ex. pompes) | **Non** |
| `indeterminate` | Id manquant | **Non** |
| `distinct` | Ids différents sans preuve | **Non** |

---

## 3. Corrections code

| Fichier | Changement |
| --- | --- |
| `recapEditorialIdentity.js` | **Nouveau** — relations, clés, réparation de nom, comparabilité de fenêtres |
| `recapEditorialSelection.js` | `exerciseKeyOf` → storage ; rivalités / contradictions **uniquement** si identité prouvée ; `findDisplayNameHomonyms` ; réparation de libellé |
| `recapPeriodDiscoveries.js` | `withRepairedDisplayName` avant E0 ; refill déjà F5-aware |
| Scores F5 | **Non retunés** (pas de changement des deltas IV hors résolution de nom) |

---

## 4. Noms « un mouvement »

- Cause fréquente : getter / map absente pour un id hashé, puis `userFacingExerciseLabel` → fallback.
- F5.1 : `repairDisplayNameFromIdentity` retente `resolveExerciseNameForRecap(id, getter)` **sans inventer d’alias**.
- Distinction : `name_missing` / `identity_missing` / `identity_ambiguous` / `identity_present_name_unresolved`.
- Replays F5.1 : **0** carte selected avec « un mouvement » sur 7d/30d/3m/6m (avec map fixture).

---

## 5. Cas Dips 6 mois

| Carte | ID | Mesure | Décision F5 | Décision F5.1 |
| --- | --- | --- | --- | --- |
| Recul confirmé (−19,7 %, 19 séances) | **103** | shape early→late | gardée | **gardée** |
| Volume par séance stable (plateau) | **503** | autre historique, 0 jour commun | **supprimée** (faux `volume_contradiction` par nom) | **réintroduite** — `sameDisplayName` seulement |

Les deux constats ne portent **pas** sur le même storage ni sur des mesures fusionnées.

---

## 6. Tests

`recapEditorialIdentity.f51.test.js` — 12 scénarios (homonyme, alias prouvé, famille, épisode, complémentaires, sous-périodes, réparation nom, hors programme, indéterminé, pas de contradiction nom, alias→rivalité, pas de mélange séries).

**56/56** avec F5 + E0.

---

## 7. Replays F5 → F5.1

| Période | n F5.1 | Focus IDs | Homonymes tracés (non fusionnés) |
| --- | ---: | --- | --- |
| 7d | 11 | 504 vs_habit + emergence ; 104 progress | 504↔104 `sameDisplayName` |
| 30d | 14 | 104 arc | 202↔104, 106↔505 |
| 3m | 17 | 104 | 202↔104 |
| 6m | 14 | **103 + 503 + 104** | **103↔503 Dips** |

Fixtures : `f51-replay-compare.json`, `f5-replay-periods.json` (régénéré).

---

## 8. Critères de clôture

| Critère | Statut |
| --- | --- |
| Aucune fusion sur le seul nom | **OK** |
| Alias seulement si démontrés | **OK** |
| Variantes / storage distincts restent distincts | **OK** |
| Contradictions sur mesures comparables + identité | **OK** |
| Anonymes réduits si historique résolvable | **OK** (fixture) |
| Pas de régression majeure des tests | **OK** |
| Décisions traçables (`identityProof`, homonym pairs) | **OK** |

## Limites

1. Pas de table d’alias produit pour lier 103↔503 si un jour la migration est prouvée — à ajouter **explicitement** (`identityAliases` / `identityLink.proven`), jamais par heuristique de nom.  
2. Pack 7j peut encore montrer 104 et 504 côte à côte (lisibilité) — F6 éventuel : annotation UI « deux emplacements ».  
3. Id `202` aussi nommé « Pompes déclinées » dans certains producteurs — même règle.

**Arrêt. Validation humaine. Pas de F6/F7. Pas de commit.**
