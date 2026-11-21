# Mission 6 — Bilan P6 (identité des découvertes et preuves)

Verdict : **fondations d’identité réparées — P6 encore partielle — NO-GO P7.**

Édition : `editorial=p6-sovereign-v5` · `identity=discovery-occurrence-v1` · `review=collective-pass4-v2`

Références gelées :

- v4 avant Mission 6 : `artifacts/analysis-eval/baselines/p6-replay-p6-sovereign-v4-before-mission6.json`
- v3 (Mission 5) : `artifacts/analysis-eval/baselines/p6-replay-p6-sovereign-v3-before-mission5.json`

---

## Cause racine corrigée

`discovery()` posait `id = kind` (ex. `disc_ms_return`).  
`stablePublicationId` renvoyait `row.id` en priorité → **trois reprises d’exercices distincts partageaient le même id de publication** et deux étaient `exact_duplicate_suppressed` sans preuve d’équivalence.

`lostSilent=0` masquait cette perte : les phénomènes étaient « expliqués » par une disposition incorrecte.

## Identités désormais distinctes

| Couche | Rôle |
|---|---|
| `detectorKind` | Type de détecteur |
| `subjectKey` | Sujet (exercice, groupe, période) |
| `episodeKey` | Épisode temporel (sans date de consultation) |
| `occurrenceId` | Occurrence déterministe |
| `semanticPhenomenonKey` | Phénomène sémantique (peut unifier plusieurs détecteurs) |
| `stablePublicationId` | Identité de publication (= occurrence, jamais le détecteur seul) |
| `fusionLineage` | Sources d’une fusion |

Module : `src/utils/sport/discoveryIdentity.js`.

---

## Tableau avant / après (sauvegarde 19 nov.)

| Horizon | v4 publié | v5 publié | Δ | Autorité | lostSilent | Dispositions v5 | A | B | C |
|---|---:|---:|---:|---|---:|---|---|---|---|
| Aujourd’hui | 6 | 6 | 0 | p6 | 0 | published=6 | FAIL | PASS | PASS |
| 7 j | 26 | **37** | +11 | p6 | 0 | published=37 · source_retained=14 | FAIL | PASS | FAIL* |
| 30 j | 39 | **56** | +17 | p6 | 0 | published=56 · source_retained=16 | **PASS** | PASS | **PASS** |
| 3 m | 53 | **76** | +23 | p6 | 0 | published=76 · source_retained=17 | PASS | FAIL | FAIL* |
| 6 m | 58 | **82** | +24 | p6 | 0 | published=82 · source_retained=17 | FAIL | FAIL | FAIL* |
| 1 an | 60 | **83** | +23 | p6 | 0 | published=83 · source_retained=8 | FAIL | FAIL | FAIL* |
| 2 ans | 58 | **83** | +25 | p6 | 0 | published=83 · source_retained=6 | FAIL | FAIL | FAIL* |
| Toujours | 56 | **81** | +25 | p6 | 0 | published=81 · source_retained=6 | FAIL | FAIL | FAIL* |

\*C 7 j : encore des redondances / monopole famille possibles — pas une collision technique.

Sur **7 j** et **30 j** : **zéro** `exact_duplicate_suppressed` injustifié (plus de collision `disc_ms_return` / `disc_structural_memory`).

### Phénomènes récupérés (exemples 30 j)

Avant (v4) : seul Face pull publié ; Élévations / Kickbacks « doublons » de `disc_ms_return`.

Après (v5) titres prioritaires :

1. Tu reprends Face pull après 28 jours d'absence  
2. Tu reprends Élévations latérales après 28 jours d'absence  
3. Tu reprends Kickbacks triceps après 28 jours d'absence  
4. … formats repris individuels encore présents (sélection collective non encore prioritaire sur un épisode commun)

### Équivalence sémantique (push/pull)

Trois détecteurs (`_now` / `_trajectory` / `_journey`) au même texte + mêmes preuves → consolidation en passe 4 avec `collapsedInto` + preuve d’équivalence (tests Mission 6).

---

## Preuves structurées

- `observedValuesOf` lit désormais gap/return/push-pull/jours/séances depuis les métriques sources.
- `disc_near_equal_sessions` porte dates, volumes, challenge, largeur, `comparisonMethod` — plus `metric=disc_near_equal_sessions` + `value=null` seuls.
- Limite documentaire non numérique : flag `documentary` / `non_numeric_documentary_proof` (ne fabrique pas un chiffre).

## Quatrième passe

- Réexploration ciblée si couverture faible **ou** concentration affaiblie par journées pairs.
- Équivalence substantielle indépendante du producteur.
- Sur le snapshot 19 nov., `reexplored` reste souvent 0 : pas de défaut déclencheur forcé (honnête).

## Exports

- Extraction `publication-reconciliation.json` / `selection-dispositions.json` corrigée (`registry.*` du dossier v2).
- Test de concordance ajouté.
- Édition DOM / priorité vs réserve : bouton UI inchangé ; bridge `eval-archive-inject.json` après assemble.

## Jeux A/B/C

Contrôles indépendants ajoutés au jeu C :

- collision technique détecteur → perte  
- suppression sans preuve d’équivalence  
- fusion sans destination  
- multi-détecteurs / même texte encore accessibles  

Batterie `p6Mission6Identity.test.js` : positifs + négatifs.

## Limites restantes (NO-GO P7)

1. Sélection collective 30 j : reprises individuelles toujours dominantes (épisode commun non promu).
2. Horizons 1y / 2y / all : différenciation encore faible.
3. Sommeil : 0 carte sur rejeu 19 nov. (données) — export live 20 nov. non rejoué ici.
4. Défi pompes chronométré : non isolé dans ce rejeu.
5. Jeu A : encore FAIL sur today / 7 j (preuves documentaires / pending).
6. DOM authentifié : non exercé depuis Cursor.
7. Réexploration rarement déclenchée sur ce snapshot.

---

## Procédure dossier

1. `P4_REPLAY=1 npx vitest run src/utils/sport/__tests__/p6Mission5BisReplay.test.js -t assemble`
2. Récap → Analyse → **Charger artefacts rejeu** (`browser-bridge/eval-archive-inject.json`)
3. Optionnel : **Vérifier les 8 périodes (DOM)**
4. **Exporter le dossier d’audit complet**

**GO P7 : NON.**
