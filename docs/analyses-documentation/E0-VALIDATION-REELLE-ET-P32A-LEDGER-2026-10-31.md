# Validation réelle E0 + P3.2a (socle comptable)

**Date :** 2026-10-31  
**Commit :** aucun  
**Hors périmètre :** P3.2b, P3.3–P3.5, découvertes musculaires narratives

---

## 1. Résultats de validation réelle E0

### Accès données

| Élément | Statut |
| --- | --- |
| App `localhost:3001` | **Accessible** (onglet `#dev-analysis-engine`) |
| IndexedDB `WorkoutTrackerDB/workouts/main` | **Lu** (lastSaved `2026-10-31T04:39:51Z`) |
| Fixture exportée | `docs/analyses-documentation/fixtures/workout-main-jul-oct-2026.json` |
| Carte de noms programme | `fixtures/exercise-name-map-main.json` (179 ids) |
| Artefacts de run E0 | `fixtures/e0-real-validation-{7d,30d,3m}.json` |

Pas de simulation : le rejeu passe par `buildPeriodDiscoveryBundle` sur l’export IndexedDB.

### Synthèse par période

#### 7 jours (`2026-10-24` → `2026-10-30`)

| Contrôle | Résultat |
| --- | --- |
| `disc_plan_data_insufficient` dans `selected` | **Absent** |
| Même kind dans `reliabilityNotes` | **Présent** |
| Drop reason | `methodology_demoted` |
| Cartes principales (extrait) | `disc_emergence` (Pompes déclinées, iv=108), `disc_exercise_share`, `disc_structural_memory`, `disc_density`, `disc_calendar_rhythm`, `disc_exercise_progress`, jalons… |
| Composition musculaire sélectionnée | **Aucune** (générée à score bas, non retenue) |

#### 30 jours (`2026-10-01` → `2026-10-30`)

| Contrôle | Résultat |
| --- | --- |
| Plan insufficient principal | **Non** → `reliabilityNotes` |
| `disc_muscle_reorient` | **Non généré** (gate tautologie) |
| Pack | GTG unplanned, volume_shape, rythme, **plusieurs** `disc_emergence`, `disc_freq_progress_low`, progressions, jalons |
| Composition musculaire | Générée (`disc_muscle_now` / push_pull score 26) **non sélectionnée** face aux émergences |

#### 3 mois (`2026-08-01` → `2026-10-30`)

| Contrôle | Résultat |
| --- | --- |
| Plan insufficient principal | **Non** |
| Différence d’horizon | `disc_best_month`, `disc_quarter_arc`, plus d’émergences ; pas de remplissage plan |
| Historique exploité | Émergences / progress / jalons utilisent l’historique antérieur **sans** le présenter comme activité de la seule fenêtre courte |

### Défauts résiduels E0 (vs lots futurs)

| Observation | Classe | Action |
| --- | --- | --- |
| Prose `disc_density` parfois hachée (« , soit environ ») | Résiduel rédactionnel E0 / moteur lecture | Lot prose ciblé, pas P3.2a |
| Libellés « un mouvement » (ids hash sans nom) | Identité / getter | Amélioration identité (lié P3.2a probable + UI) |
| Nombreux `disc_emergence` sémantiquement proches | Qualité collective | Cap / rivaux émergence → lot sélection ultérieur |
| `disc_muscle_*` encore générés (conventionnel) | Attendu | Remplacement analytique = **P3.2b** |
| Pas de bannière user `reliabilityNotes` | UX | Lot UI post-E0 |

**Verdict E0 réel :** le demote methodology fonctionne sur données live ; les emplacements ne sont pas remplis par l’insuffisance de plan ; les packs restent informatifs sans invention d’adhérence.

---

## 2. Fichiers modifiés / créés (P3.2a + validation)

### Créés
- `src/utils/sport/recapMuscleLedgerP32a.js` — univers, identité, attribution, ledger, réconciliation
- `src/utils/sport/__tests__/recapMuscleLedgerP32a.test.js`
- `src/utils/sport/__tests__/recapE0RealValidation.test.js`
- `docs/analyses-documentation/fixtures/workout-main-jul-oct-2026.json`
- `docs/analyses-documentation/fixtures/exercise-name-map-main.json`
- `docs/analyses-documentation/fixtures/e0-real-validation-*.json`
- `docs/analyses-documentation/fixtures/p32a-golden-ledger-oct-2026.json`
- `scripts/extract-cdp-workout-export.mjs`, `scripts/assemble-name-map.mjs`
- ce livrable

### Non touchés (volontairement)
- Moteur `PRIMARY_REP_SHARE` / `disc_muscle_*` existants (coexistence)
- Aucune nouvelle découverte narrative musculaire

---

## 3. Définition exacte du ledger

**Version :** `classificationVersion = p32.v1`

### Observation (B1)
Ligne candidate = clé `reps[date_storageId]` cochée, avant/après dedup.

| `unitClass` (exclusif) | Contenu |
| --- | --- |
| `certain_reps` | entier > 0, non isométrique |
| `isometric_seconds` | heuristique nom (planche, gainage…) |
| `duration_other` | réservé |
| `heuristic_unit` | ambigu |
| `unknown_unit` / `invalid` | parse / clé |

**Invariant :** compter les **lignes** séparément de la **somme des valeurs** ; ne jamais additionner secondes et reps.

### Canonique
Dedup = `aggregateCheckedRepsByDateAndExerciseId` (max par `date::id`, strip `_semaineA/B`).

### Seaux volume (sur `certain_reps` only)
```
R = R_mono + R_multi + R_non_attr
```
- **mono** → `volumePrimary[G]` uniquement  
- **multi** → listé dans `multiPrimaryTouch` (pas ventilé)  
- **non_attr** → mapping vide / heuristique / FULL_BODY seul  

Iso → `isoSecondsSum` hors R.

### Exposition (indépendante)
`exposureDaysPrimary/Secondary[G]`, `distinctExercisesPrimary[G]`.

### Charges / séries
- Poids absent → `weightUnknown: true` (**pas** 0 kg)  
- Séries = `exerciseSetLogs` seulement (`setsFromPrescription: false` toujours)

### GTG
Channel `gtg_ledger` séparé ; `alreadyInClassic` pour éviter double compte dans R.

---

## 4. Tableau de réconciliation des sources (oct. 2026)

Fenêtre ledger : **2026-10-01 → 2026-10-30** (export live 31/10).

| Source / mesure | Valeur | Commentaire |
| --- | --- | --- |
| Somme brute clés cochées (sans dedup / sans filtre iso) | 4 367 | meta export |
| Aggregate pipeline (même dedup, iso exclus du R ledger) | **4 331** | = `pipelineAggregateSum` |
| Ledger `R` (certain_reps) | **4 331** | Δ vs aggregate = **0** |
| Iso secondes | **36** (1 ligne) | hors R ; 4367−36≈4331 |
| Total documenté console 30/10 (`signature` …\|4016\|…) | **4 016** | capture **antérieure** ; données ont évolué |
| Δ documenté − ledger | **−315** | **ne pas forcer** ; périmètres temporels / contenu différents |
| GTG listé | 85 | **100 %** déjà dans classic (`gtgUniqueNotInClassic=0`) |
| Snapshots plan | **0** | inchangé |
| Training days classic (jours avec certain_reps) | **16** | vs « 11 » discovery / « 15 » matrice — définitions distinctes |

**Conclusion réconciliation :** le ledger **colle** au total aggregate live (4331). Le chiffre **4016** n’est **pas** le même état de base au 31/10 — écart documenté, non masqué.

---

## 5. Inventaire des exercices résolus / non résolus

Sur lignes certain_reps distinctes (oct.) :

| Confiance identité | n | Notes |
| --- | --- | --- |
| certain (id + nom) | 21 | Carte programme |
| probable (id sans nom) | **26** | hash/`db_*` → alimentent surtout `R_non_attr` |
| unresolved | 0 | (id toujours présent) |

Homonymes (« Pompes déclinées » sur ids 104 vs 202) : **non fusionnés** (identité = storageId).

---

## 6. Répartition mono / multi / non attribuable

| Seau | Reps | |
| --- | --- | --- |
| `R_mono` | **1 072** | seul volume ventilé |
| `R_multi` | **870** | conservé, non ventilé |
| `R_non_attr` | **2 389** | mapping/identité insuffisants |
| **R** | **4 331** | conservation OK |

### Volume mono primary (extrait)
chest 370 · back 408 · biceps 144 · shoulders 60 · triceps 90

### Multi-touch (reps listées, non = volume groupe)
chest/triceps 318 · core/quads 420 · …

---

## 7. Jours, occurrences, séries

| Métrique | Valeur | Définition |
| --- | --- | --- |
| trainingDaysClassic | 16 | jours avec ≥1 ligne certain_reps |
| occurrences | 109 | lignes canoniques certain_reps |
| distinctExercises | 47 | storageIds distincts |
| setsRecorded | 182 | sets dans `exerciseSetLogs` uniquement |
| weightPresentLines | 26 | |
| weightUnknownLines | 84 | absences ≠ 0 |

---

## 8. Invariants et tests exécutés

### Tests P3.2a (`recapMuscleLedgerP32a.test.js`) — 11
Conservation, non-mélange unités, dedup, homonymes, poids, séries, mapping vide, stabilité, réconciliation non forcée.

### Validation réelle + golden (`recapE0RealValidation.test.js`) — 5
E0 7d/30d/3m + ledger oct.

### Non-régression
P0 snapshot, P3.0/P3.1 adherence, E0 sélection, periodDiscoveries : **105** verts sur le lot rejoué.

---

## 9. Différences vs métriques existantes

| Métrique existante | Ledger P3.2a | Lecture |
| --- | --- | --- |
| Console 4016 (30/10) | R=4331 (31/10) | État live différent |
| `repShareByGroup` / 74-26 (ex. pecs ~617 parts) | mono chest **370** | **Incomparable** — conventions ≠ mono conservateur |
| « 3810 identifiées » portrait | R_mono+R_multi=1942 | Autre définition |
| Training days 11 vs 15 | 16 | Encore une 4ᵉ définition — à figer en P3.2b éditorial |

---

## 10. Problèmes non résolus

1. **26 ids sans nom** → gros `R_non_attr` ; volume anatomique sous-estime le vécu réel tant que le getter runtime n’est pas branché sur le golden.  
2. **4016 historique** non reproductible à l’identique sur l’export du 31/10 (données avancées).  
3. **Aucune discovery P3.2** (volontaire) — pas de validation « lecture utilisateur » musculaire nouvelle.  
4. Heuristique nom stricte → non_attr (politique §12 revue) ; pas d’exposition watch heuristique dans v1.  
5. Endurance / corde / course : hors certain_reps musculaires (durée / autres canaux) — pas mélangées, mais inventaire endurance_other encore mince.

---

## 11. Décision : P3.2a est-il validable ?

**Oui, comme socle comptable démontré**, avec conditions :

| Critère | Statut |
| --- | --- |
| Conservation R | **OK** |
| Non-mélange unités | **OK** |
| Pas de 74/26 | **OK** |
| Pas de double GTG/classic dans R | **OK** (GTG déjà sync) |
| Identité storage-first / homonymes | **OK** |
| Golden live oct. produit | **OK** (4331) |
| Égalité forcée à 4016 | **Non exigée** — écart expliqué |
| Prêt pour P3.2b (narration) | **Partiel** : attendre réduction `R_non_attr` (noms) + arbitrage humain sur le golden 4331 vs ancienne signature 4016 |

**P3.2a = validable techniquement.**  
**P3.2b = non autorisé** tant que le golden et le taux de non-attribution n’ont pas été acceptés humainement.

---

## Annexes artefacts

- `fixtures/e0-real-validation-7d.json` — all / selected / dropped / textes  
- `fixtures/e0-real-validation-30d.json`  
- `fixtures/e0-real-validation-3m.json`  
- `fixtures/p32a-golden-ledger-oct-2026.json` — totaux, exposition, identité, réconciliation  
