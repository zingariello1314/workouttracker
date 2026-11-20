# Mission 5 bis — Bilan P6 (preuves rejeu 19 nov.)

Verdict : **P6 partiellement démontrée — NO-GO P7.**

Rejeu v4 **complet** des huit horizons sur la sauvegarde du 19 novembre, comparé à la baseline v3 figée, même empreinte. Autorité `p6` et `lostSilent=0` sur les huit périodes. Qualité analytique et jeux A/B/C live **non acquis** au sens P6. DOM authentifié **non vérifié** dans Cursor. Jugement humain à l’aveugle **non effectué**.

Édition mesurée :

`consolidation=narrative-coherence-v2;duration=paired-density-v3;editorial=p6-sovereign-v4;…;review=collective-pass4-v1;stimulus=challenge-unknown-v1`

Artefacts :

- Rejeu v4 : `artifacts/analysis-eval/replays/p6-replay-v4-latest.json`
- Baseline v3 : `artifacts/analysis-eval/replays/p6-replay-v3-baseline.json` (copie de `baselines/p6-replay-p6-sovereign-v3-before-mission5.json`)
- Comparaison : `artifacts/analysis-eval/comparisons/v3-vs-v4.json`
- ZIP hors-navigateur : `artifacts/analysis-eval/complete/momentum-p6-mission5-bis-latest.zip`
- Bridge UI : `artifacts/analysis-eval/browser-bridge/eval-archive-inject.json`

---

## A. Catalogue interne vs catalogue accessible

| Notion | Contenu | Comptage typique (ex. 7 j) |
|---|---|---|
| **Catalogue interne** | `priority ∪ reserve` du registre P6 (après sélection / passe 4) | 11 + 28 = **39** lignes |
| **Ids uniques registre** | même catalogue dédoublonné par `stablePublicationId` | **26** |
| **Catalogue accessible** | `shortTerm ∪ mediumTerm ∪ longTerm ∪ accessibleReserve` publiés | **26** |
| **Écart lignes→publié** | dispositions `exact_duplicate_suppressed` | **13** |
| **Pertes silencieuses** | ids registre absents du publié **sans** disposition | **0** |

Les ~195 écarts des anciens exports (totaux internes vs accessibles) sont désormais **traçables** : sur ce rejeu ils se réduisent à des suppressions de doublons d’identifiant (`exact_duplicate_suppressed`), jamais à des `lostSilent`. Une ligne fusionnée (`source_retained`) reste hors catalogue accessible.

---

## B. Tableau v3 vs v4 (même sauvegarde 19 nov.)

| Horizon | v3 Produits / Prio / Réserve / Fusion | v4 Produits / Prio / Réserve / Publié / Autorité / lostSilent / ms |
|---|---|---|
| Aujourd’hui | 6 / 6 / 0 / 0 | 6 / 6 / 0 / **6** / p6 / **0** / ~8,2 s |
| 7 j | 51 / 11 / 28 / 12 | 51 / 11 / 28 / **26** / p6 / **0** / ~7,7 s |
| 30 j | 72 / 11 / 49 / 12 | 72 / 11 / 49 / **39** / p6 / **0** / ~7,1 s |
| 3 m | 93 / 11 / 70 / 12 | 93 / 11 / 70 / **53** / p6 / **0** / ~10,1 s |
| 6 m | 99 / 11 / 76 / 12 | 99 / 11 / 76 / **58** / p6 / **0** / ~10,6 s |
| 1 an | 91 / 12 / 76 / 3 | 91 / **11** / **77** / **60** / p6 / **0** / ~11,3 s |
| 2 ans | 89 / 12 / 74 / 3 | 89 / **11** / **75** / **58** / p6 / **0** / ~13,4 s |
| Toujours | 87 / 12 / 72 / 3 | 87 / **11** / **73** / **56** / p6 / **0** / ~12,3 s |

Dispositions (somme des 8) : uniquement `published` + `exact_duplicate_suppressed`. Aucune `unpublished_invalid` ni perte silencieuse sur ce snapshot.

---

## C. Jeux A / B / C sur les huit paquets réels

| Horizon | A (faits / preuves) | B (découverte) | C (collectif / publication) |
|---|---|---|---|
| today | **FAIL** — 6 `priority_without_numeric_proof` | PASS | PASS |
| 7d | **FAIL** — 5 sans preuve numérique | PASS | **FAIL** (voir ci-dessous) |
| 30d | **FAIL** — 1 (GTG) | PASS | **FAIL** — monopole famille `emergence` ~78 % |
| 3m | PASS | **FAIL** — 1 attractive incorrecte | **FAIL** — 2 doublons texte « poussée » + monopole |
| 6m | **FAIL** | **FAIL** | **FAIL** — doublons + monopole |
| 1y / 2y / all | **FAIL** | **FAIL** | **FAIL** — doublons + monopole |

**Jeu C agrégé 8 périodes :** FAIL — `exactDuplicatesAccessible=6` (carte « Le haut du corps travaille surtout en poussée » ×3 sur 3m/6m/1y), monopoles `emergence`, `admissiblePreserved=true` après correction du comptage par ids uniques (les `exact_duplicate_suppressed` d’ids déjà publiés ne comptent plus comme écart).

**Jeu A :** les claims existent, mais `proof.observedValues` reste souvent vide → le jeu refuse à juste titre des priorités sans preuve numérique exploitable.

**Jeu B :** distingue bien des cas synthétiques ; sur longs horizons, encore des attractives incorrectes.

**Humain à l’aveugle :** non effectué. Paquet préparé : `qualitative/blind-pack.json` + clé séparée.

---

## D. Qualité analytique — cas demandés

### 1. Domination des reprises individuelles (30 j)

- **Avant (v3)** : Face pull / élévations / Bent-Arm en tête.
- **Après (v4)** : même domination — 5+ cartes « format repris » / retours individuels en priorité ; `returnLikeCards=5` ; famille `emergence` ≈ 78 %.
- **Décision éditoriale** : passe 4 n’a pas cassé le monopole reprise sur 30 j.
- **Limite** : pas de découverte collective épaules/triceps prioritaire.

### 2. Découvertes collectives épaules / triceps

- **v4 30 j** : titres individuels (Face pull, Kickbacks, Extension triceps…) — **pas** de carte « reprise collective épaules/triceps ».
- **Preuve** : `quality.priorityTitles` / insightsSlim.
- **Limite** : `exploreCollectiveReturn` insuffisamment promu face aux émergences unitaires.

### 3. Journées 14 / 16 / 17 novembre

- **v4 7 j priorité #1** : « Des journées à volume proche racontent des séances différentes » — corps cite 351 / 332 / 332 reps et 13/14/17 nov. (compléments / largeur mouvements).
- **v3** : absent des exemples de tête (concentration 13 nov. dominante).
- **Progrès réel** ; preuve structurée encore partielle (`observedValues` vide, dates en `sourceEvents`).

### 4. Trajectoire juin → novembre

- **v4 6 m / 1 an** : « octobre 2026 interrompt la baisse depuis juin 2026 » + arcs de volume / moitiés de fenêtre.
- **v3** : davantage GTG hors planning / retours pompes gilet en tête.
- **Limite** : formulations proches sur 1y / 2y / all (faible différenciation ultra-long).

### 5. Analyses chronométriques défi pompes

- **7 j** : socle hebdo cite pompes endurance (complémentaire) 100 + pompes (endurance) 100.
- **Jeu A** continue de refuser toute classification défi→endurance (contrat).
- **Limite** : pas d’analyse chronométrique dédiée « défi pompes » en priorité distincte.

### 6. Redondances sommeil

- **sleepCards accessibles = 0** sur les huit horizons de ce rejeu.
- **Limite** : absence ≠ preuve de consolidation sommeil sur d’autres snapshots.

### 7. Pertinence « Aujourd’hui »

- 6 cartes, autorité p6, published=6.
- Jeu A FAIL (preuves numériques absentes sur pending / concentration).
- Contenu cohérent « séance non commencée » + ancrage 7 j.

### 8. Différenciation des huit horizons

- today ≠ 7d ≠ 30d (near-equal vs reprises).
- 3m+ : volume par séance / arcs mensuels.
- 1y ≈ 2y ≈ all sur plusieurs titres → **différenciation insuffisante** en bout de spectre.

---

## E. DOM

| Contrôle | Résultat |
|---|---|
| Bouton UI « Vérifier les 8 périodes (DOM) » | **Présent** (Récap → Analyse, DEV/admin) |
| Exécution authentifiée depuis Cursor | **Non** — non accessible ici |
| Mémoire éditoriale | Non modifiée par le vérificateur (`editorialMemoryModified: false`) |
| Preuve DOM dans le ZIP hors-navigateur | **Absente** — statut documenté dans `ARTIFACT_STATUS.json` / `MANIFEST.json` |

Procédure : session authentifiée → Récap → Analyse → *Charger artefacts rejeu* (`eval-archive-inject.json`) → *Vérifier les 8 périodes (DOM)* → *Exporter le dossier d’audit complet*.

---

## F. ZIP transmissibles

### Hors-navigateur (cette passe)

`artifacts/analysis-eval/complete/momentum-p6-mission5-bis-latest.zip` contient notamment :

- rejeux v3 / v4, comparaison, qualitative + clé, jeux par horizon, réconciliation, bilan, manifeste, `ARTIFACT_STATUS.json`

**Manquants (cause explicite dans le manifeste)** :

- `eight-periods/eight-periods.json` — export live UI non exécuté
- `evaluation/dom-eight-periods.json` — DOM non exercé
- jeux live session UI
- verdict humain à l’aveugle

### Via UI (après bridge + DOM)

Le bouton « Exporter le dossier d’audit complet » assemble live 8 périodes, comparaisons, rejeu injecté, jeux, DOM si déjà lancé, réconciliations, manifeste avec statuts `included` / `missing`.

---

## G. Non-régressions (cette passe)

Exécutés : `evaluationGames`, `p6SovereigntyMission5` (+ suite ciblée Mission 5 si relancée).  
Échecs jeux A/B/C **sur paquets réels** = résultats d’évaluation, pas des régressions unitaires à masquer.

---

## H. Critères P6 (preuve, pas contrat seul)

| Critère | Statut | Preuve |
|---|---|---|
| Autorité de catalogue | **OK** rejeu | `publicationAuthority=p6` ×8 |
| Écarts registre↔publication expliqués | **OK** rejeu | dispositions ; `lostSilent=[]` |
| Aucun doublon exact accessible | **FAIL** | 6 doublons texte sur longs horizons |
| Sources fusionnées accessibles | **OK** | 0 |
| Pertes admissibles silencieuses | **OK** rejeu | 0 |
| Claims à preuves numériques | **FAIL** fréquent | jeu A |
| Collectif > individuel (30 j) | **FAIL** | monopole émergence / reprises |
| Horizons différenciés | **Partiel** | today/7d/30d oui ; 1y≈2y≈all |
| Sommeil non répétitif | **N/A** ce snapshot | 0 carte sommeil |
| Jeux A/B/C sur vrais résultats | **Exécutés — majoritairement FAIL** | replay |
| Concordance DOM | **Non vérifié** | |
| Dossier 1 clic | **Code OK** ; ZIP hors-nav. partiel sans DOM/live | |

---

**GO P7 : NON** — autorisation explicite requise après DOM live + correction qualité (doublons, monopole 30 j, preuves numériques).
