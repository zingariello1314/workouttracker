# CONTRAT — Métriques & fusion P6 (Missions 29–30)

Réutilise `recapMetricContract` (`buildMetricFact`, `metricsAreComparable`,
`resolvePrimaryWindowSessionPopulation`, `validateSumMeanSampleConsistency`).
Pas de moteur concurrent.

## 0. Population d’effectif (Mission 30)

Toute mesure de **total de fenêtre** partage le même ensemble d’événements que son
**nombre de séances** et, le cas échéant, sa **moyenne par séance**.

| Champ | Population |
|---|---|
| `windowTotal` / `recentReps` | Séances dans la fenêtre primaire |
| `sessionCount` (pour ce total) | **Même** ensemble — jamais `arcDates.length` |
| `windowMeanPerSession` | **Même** ensemble |
| `arcDates` / moyennes early-late | Référent `arc_early_late` — **distinct**, à étiqueter |

Invariant vérifiable : si total, mean et n portent le même référent,
`|total − mean × n|` sous tolérance. Sinon : périmètres distincts explicites.

### Mission 31 — comparabilité

- `dates.length` / arc tronqué **n’est pas** un effectif de fenêtre.
- Si l’effectif n’est pas lié (`comparableForSumMean=false`) : statut
  `populations_not_bound` / note `sum_mean_sample_noncomparable` —
  **ni faux FAIL d’intégrité, ni faux PASS**.
- Une contradiction sur population **liée** reste un conflit dur.


## 1. Distinctions formelles (fusion)

| Relation | Définition | Effet catalogue |
|---|---|---|
| Même sujet | `subjectKey` identique | insuffisant seul |
| Même phénomène | même `phenomenonKey` / aspect | peut être fort |
| Même assertion | même claim assertionnel | fort |
| Redondance partielle | reformulation / même photo | **réserve** (accessible) |
| Approfondissement | enfant justifié | réserve + `parentId` valide |
| Reformulation | `RELATION.REFORMULATION` | **pas de suppression** |
| Contradiction | opérateurs opposés | revue / blocage |
| Conclusion distincte | aspects / fenêtres / preuves divergents | **deux accessibles** |

### Fusion autorisée seulement si

1. Équivalence sémantique **forte** (`same_text_and_proof`, `same_semantic_phenomenon`, `same_occurrence_id`, …) **ou** `EXACT_DUPLICATE`.  
2. Destination valide et publiable.  
3. Populations / fenêtres d’**observation** compatibles.  
4. Preuves conservées ou explicitement absorbées.  
5. Liens enfants redirigés **avant** publication.

Validité structurelle (`collapsedInto` non null) ≠ validité sémantique.

## 2. Contrat de mesure

Chaque valeur structurée porte :

| Champ | Rôle |
|---|---|
| metric / id | ex. `recentReps`, `windowMeanPerSession` |
| unit | `reps`, `sessions`, … |
| granularity | `total` \| `per_session` \| … |
| denominator | `window` \| `session` \| … |
| population | sujet / famille |
| window | start/end ou referent |
| method / aggregation | sum, mean, … |
| comparator | seulement si comparable |

### Interdits de substitution

Total fenêtre ≠ moyenne/séance ≠ moyenne de phase ≠ nb séances ≠ volume/série ≠ charge ≠ densité.

Un **delta** exige `metricsAreComparable(...).ok === true`.

### Producteurs

| Source | Totaux | Moyennes |
|---|---|---|
| `detectStructuralShifts` / `structLead` | `nowReps` / `thenReps` → `recentReps` / `prevReps` | via traj |
| `trajectoryToMetrics` | `windowTotal` → `recentReps`, `prevComparable` → `prevReps` | `windowMeanPerSession`, arcs |
| Composition parallèle | consomme totaux si présents ; sinon moyenne **étiquetée** | `volumeBasis` |

La prose n’est jamais une source numérique.

## 3. Cas de validation

- 192/96 et 192/144 disponibles → composition exploite les totaux et distingue volume cumulé vs stabilité /séance.  
- Fréquence ↑ moyenne stable ; fréquence ↓ moyenne ↑ ; charge ↑ reps constantes ; comparateur absent ; fenêtres non alignées → abstention de delta.

## 4. Tests

Voir `mission29ContractAuthority.test.js` (assertions réelles, pipeline sélection→publication, famille non-Hyperextension, `metricsAreComparable`).
