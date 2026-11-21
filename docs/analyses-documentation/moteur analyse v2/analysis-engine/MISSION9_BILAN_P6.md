# Mission 9 — Bilan P6 (preuves, doublons, validation des conclusions)

Verdict : **jeux A/B/C PASS sur les huit horizons du rejeu 19 nov. — fondations de validation consolidées — plusieurs critères P6 restent incomplets — NO-GO P7.**

Édition livrée : `editorial=p6-sovereign-v8` · `program=structural-execution-v1` · `review=collective-pass4-v5` · `claim=proof-pipeline-v2` · `identity=discovery-occurrence-v1`

Références gelées :

- v7 avant Mission 9 : `artifacts/analysis-eval/baselines/p6-replay-p6-sovereign-v7-before-mission9.json`
- Rejeu courant : `artifacts/analysis-eval/replays/p6-replay-v8-latest.json`
- Archive : `artifacts/analysis-eval/complete/momentum-p6-p6-sovereign-v8-nov19-latest.zip`

Pas de commit. Pas de P7. Données utilisateur non modifiées.

---

## 1. Causes racines réellement corrigées

| Problème Mission 8 | Cause racine | Correctif Mission 9 |
|---|---|---|
| Jeu A FAIL (16× `priority_without_numeric_proof`) | Les fils `disc_th_*` perdaient `idea.metrics` dans `buildThreadDiscoveries` ; plusieurs producteurs n’attachaient pas `observedValues` | Propagation `text.metrics` ; preuves structurées sur concentration, rythme, push/pull, composition, share, quarter_arc, exposure, repertoire, défis ; `observedValuesOf` lit aussi `metricFacts` |
| Jeu B FAIL longs (dont défi) | Négation « pas sur une force maximale » comptée comme claim physiologique ; `hit_abstain`/`scored` mappés en FAIL | Filtre de négation ; statut `not_applicable` pour défi absent ; `hit_abstain`/`scored` ≠ FAIL |
| Jeu C 14 doublons textuels | Homonymes `ex:106`/`ex:505` (et parallèles) avec titre/corps identiques + mention « homonyme non fusionné » | Différenciation par dates d’évidence réelles ; **aucune fusion** des stockages distincts |
| Fausse validation documentaire | Risque d’abuser de `documentaryOnly` | Restreint aux cas non numériques (repos) ; preuves chiffrées exigées pour les affirmations numériques |
| Archives `mission5-bis` trompeuses | Nom d’archive figé | `momentum-p6-{édition}-nov19-*.zip` + résumé nommé sur l’édition |

**Interdit respecté :** aucune reconstruction de preuve par parsing du texte final pour faire passer le jeu A.

---

## 2. Tableau des huit périodes — avant (v7) / après (v8)

| Horizon | Prio v7→v8 | A v7→v8 | B v7→v8 | C lostSilent | C textDup (cumul) | ms v8 |
|---|---:|---|---|---:|---:|---:|
| Aujourd’hui | 3→3 | FAIL→**PASS** | PASS→**PASS** | 0 | 0 | ~5,7 s |
| 7 jours | 11→11 | FAIL→**PASS** | PASS→**PASS** | 0 | 0 | ~5,4 s |
| 30 jours | 11→11 | FAIL→**PASS** | PASS→**PASS** | 0 | 0 | ~6,3 s |
| 3 mois | 11→11 | FAIL→**PASS** | FAIL→**PASS** | 0 | 0 | ~10,5 s |
| 6 mois | 11→11 | FAIL→**PASS** | FAIL→**PASS** | 0 | 0 | ~10,5 s |
| 1 an | 11→11 | FAIL→**PASS** | FAIL→**PASS** | 0 | 0 | ~12,0 s |
| 2 ans | 11→11 | FAIL→**PASS** | FAIL→**PASS** | 0 | 0 | ~14,0 s |
| Toujours | 11→11 | FAIL→**PASS** | FAIL→**PASS** | 0 | 0 | ~11,1 s |

**Jeu C agrégé :** `pass=true`, `exactDuplicatesAccessible=0`, `admissiblePreserved=true`, `lostSilent=0` × 8.

**Dénominateurs priorités :** v7 = **80** cartes prioritaires (3+7×11) ; v8 = **80**. Comparaison titre+corps≈ : **80/80 inchangées** sur les priorités — le gain Mission 9 est surtout **exactitude des claims**, **propreté éditoriale des homonymes (souvent en réserve)** et **validation A/B/C**, pas une reformulation massive des têtes de pack.

---

## 3. Jeux A/B/C détaillés

### Jeu A — PASS × 8

Exemple de preuve désormais attachée (7j, concentration 13 novembre) :

```json
[
  { "id": "peakReps", "value": 351, "unit": "reps" },
  { "id": "sharePct", "value": 28.4, "unit": "percent" },
  { "id": "totalReps", "value": 1234, "unit": "reps" }
]
```

Contre-exemples ajoutés (tests) :

- preuve présente mais **valeur incorrecte** → `proof_value_mismatch` ;
- **population** claim ≠ population attendue → `population_mismatch` ;
- dénominateur incorrect injectable via `referenceFacts`.

Échecs restants justifiés : aucun sur ce snapshot. Les absences de sommeil/défis ne sont pas inventées.

### Jeu B — PASS × 8

| Référence | Statut |
|---|---|
| volume fréquence / contenu / no-change | PASS |
| near_equal composition | PASS |
| collectif lié | PASS |
| collectif simultané non lié | PASS (`hit_abstain`) |
| défi chronométré | **`NOT_APPLICABLE`** si aucune carte défi dans le paquet (snapshot 19 nov. sans validation du détecteur) |
| dimensions qualité | `partial` / scoré — hors binaire FAIL |

Correction clé : le corps défi « pas sur une force maximale » n’est plus un `unsupported_physiology`.

### Jeu C — PASS

Avant : 2 doublons textuels × 7 horizons = 14 (paires de relevés de genoux barre / parallèles).  
Après : titres distincts par dernière date d’évidence, corps contextualisé, stockages `ex:` séparés conservés.

Exemple :

- `Relevés de genoux à la barre (ligne vue jusqu’au 16 novembre 2026): un ancien niveau est retrouvé`
- `Relevés de genoux à la barre (ligne vue jusqu’au 13 novembre 2026): un ancien niveau est retrouvé`

Sans « homonyme non fusionné » dans le titre public.

---

## 4. Exemples complets — anciennes / nouvelles cartes

### 4.1 Preuve (concentration) — même thèse, claim réparé

**Texte (inchangé en substance, v7≈v8) :** pic du 13 novembre, part du volume de la fenêtre.  
**Avant :** claim.proof.observedValues = `[]` → FAIL A.  
**Après :** peakReps / sharePct / totalReps structurés depuis les métriques du dossier d’analyse.

### 4.2 Homonymes format

**Avant :** même titre/corps pour deux lignes de stockage → doublon C.  
**Après :** distinction par historique daté ; filiation et `admissiblePreserved` maintenus.

### 4.3 Familles / arc (conservés de Mission 8)

Toujours présents en priorité ou accessibles : familles de séances, variante de redistribution, arc juin→octobre. Pas de régression volontaire.

---

## 5. Généralisation

| Pack | Statut |
|---|---|
| Tests unitaires Mission 7/8/9 (structure, adhérence synthétique, collectif, preuves, B) | **PASS** |
| Rejeu hybride réel 19 nov. (8 horizons) | **PASS A/B/C** |
| PPL / une séance/semaine / versions successives / sommeil+défis riches | **Non rejoués comme packs pipeline complets séparés** — partiellement couverts en synthétique |
| Horizons longs couverture équivalente (1y≈2y≈all) | Observé : packs encore très proches — répéter légitimement plutôt que reformuler |

Les jeux synthétiques restent étiquetés comme tels ; non injectés dans les données utilisateur.

---

## 6. Collectif vs individuel

- Collectif lié exige interruption **significative** (seuil 14 j **ou** ≥ 1,5× cadence habituelle documentée).
- Taxonomie éditoriale (`emergence`) ≠ famille musculaire.
- Sur le snapshot 19 nov. : retours individuels Face pull / élévations restent visibles ; collectivisation liée sous-contrainte des métadonnées musculaires — **pas forcée**.

---

## 7. Mémoire et rotation

Simulations chronologiques exhaustives (`analyticalMemory`, correction de séance, consultation sans nouvelle donnée) : **non bouclées comme batterie dédiée dans ce rejeu**.  
Déterminisme à données identiques : présumé via pipeline existant ; à documenter explicitement dans une passe suivante.

`domVerified` : **false** partout (aucun DOM observé dans ce ZIP hors-navigateur).

---

## 8. Réconciliation catalogue / analyses accessibles

- `lostSilent=0`, ids réconciliés, `occurrenceId` conservé dans `p6Slim`.
- Hiérarchie : approfondissements / `deepening_of_collective` hors remplissage prioritaire (acquis Mission 8, maintenu).
- Compteurs : 80 priorités stables ; réserves accessibles conservées.

---

## 9. Couverture et sous-exploration

- Défi : `NOT_APPLICABLE` sur ce snapshot ≠ validation du détecteur.
- Sommeil : non exercé (données absentes) — non déclaré démontré.
- Sous-exploration collective : volontaire lorsque le lien structurel manque.

---

## 10. Complément post-rejeu (adhérence / collectif / horizons)

Travail complémentaire intégré après le rejeu A/B/C (tests `mission9Closure` étendus) :

- adhérence : récurrence d’omission datée (`describeOmissionRecurrence`, classes exceptional/repeated/recurrent) ;
- collectif : index musculaire + cadence habituelle (médiane d’intervalles) ; préfiltre retour ≥ 7 j, significativité via `significantGap` ;
- horizons longs : boosts renforcés pour arcs/familles/adhérence ; `acknowledgeIdenticalCoverage` pour 2y/all vs 1y sans fausse nouveauté ;
- hiérarchie : `deepening_of_collective` / `secondary*` jamais en conclusion principale.

Ces enrichissements sont **couverts par tests unitaires** ; un second rejeu 8 horizons dédié n’a pas encore été figé dans `p6-replay-v8-latest.json` après leur intégration parallèle. Les PASS A/B/C du §2 correspondent au rejeu preuves/doublons.

## 11. Limites réelles

1. **Priorités textuellement stables (80/80)** sur le rejeu preuves : Mission 9 sécurise surtout la vérifiabilité.
2. **Adhérence longitudinale réelle** encore à rejouer sur le snapshot 19 nov. après les enrichissements §10.
3. **Différenciation 1 an / 2 ans / Toujours** : mécanisme `identical_coverage` en place, effet produit à confirmer en rejeu.
4. **Mémoire / rotation / DOM** non démontrés de bout en bout.
5. **Packs de généralisation complets** (PPL, hebdo unique, sommeil+défis) incomplets.
6. **Structure exécutée** (prévu vs réalisé par variante) : bases présentes, pas encore systématiquement croisées partout.
7. Doublons de clés dans `observedValues` (ex. `peakReps` répété) — cosmétique.

---

## 12. État des critères P6 (spécification)

| Critère | État |
|---|---|
| Preuves structurées sur conclusions prioritaires chiffrées | **OK sur rejeu 19 nov.** |
| Jeu A huit périodes | **PASS** |
| Jeu B huit périodes (N/A distinct de PASS) | **PASS** |
| Jeu C filiation + 0 doublon textuel | **PASS** |
| Homonymes sans fusion abusive | **OK** |
| Familles de séances / arcs | Conservés (Mission 8) |
| Adhérence multi longitudinale réelle | **Partiel** |
| Collectifs liés en conditions réelles | **Partiel** |
| Intelligence temporelle 8 horizons distincts | **Partiel** |
| Mémoire / rotation | **Non démontré** |
| Hiérarchie A retenir / approfondissements | **Partiel** |
| Généralisation multi-programmes | **Partiel** |
| Export audit (édition réelle, pas mission5-bis) | **OK (ZIP v8)** |
| DOM vérifié | **NON** (`domVerified=false`) |
| **Clôture P6** | **NON** |
| **P7** | **NO-GO** |

---

## 13. Archive transmissible

- `artifacts/analysis-eval/complete/momentum-p6-p6-sovereign-v8-nov19-latest.zip`
- Contient rejeu 8 horizons, jeux A/B/C, qualitative, comparaisons, manifeste avec `domVerified:false`, `humanBlindPerformed:false`.
- Export UI Récap→Analyse : boutons conservés ; chargement bridge + DOM reste une opération séparée volontaire.

---

## Lecture qualité (pas le % de cartes modifiées)

| Catégorie | Lecture Mission 9 |
|---|---|
| Cartes réellement enrichies (preuves) | Nombreuses priorités `disc_th_*`, arcs, share, défis — **même texte, claim vérifiable** |
| Nouvelles conclusions | Peu — pas l’objectif principal de cette mission |
| Anciennes bonnes conclusions conservées | **80/80 priorités** stables vs v7 |
| Reformulations sans gain | Évitées |
| Phénomènes encore manqués | Adhérence réelle riche, collectif lié, mémoire, DOM, packs PPL/sommeil |

**Le succès mesurable ici : exactitude + publication propre + A/B/C verts.**  
**Ce qui manque encore pour clore P6 : profondeur exécutée, généralisation packs, mémoire/DOM, différenciation temporelle riche.**

---

*Mission 9 — ne pas confondre PASS des jeux d’évaluation avec clôture métier complète de P6.*
