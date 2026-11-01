# Matrice temporelle — F2 (2026-11-01)

Helpers : `recapTemporalContracts.js`. Fenêtres primaires : `getRecapDateWindow`.

---

## Par période sélectionnée

| Période | primary (W) | comparison (C) typique | historical (H) courant | Abstention / garde |
| --- | --- | --- | --- | --- |
| Aujourd’hui | rolling 24h (`mode: rolling-24h`) | 7j / 30j contexte | habit nuits, catalog | Ne pas comparer journée incomplète sans note |
| 7 jours | end−6 → end (7 j.) | prev 7j equal length | habit 30j, journey 91j, baselines | H doit être qualifié ; quarter_* hors sujet → F5 |
| 30 jours | 30 j. | prev 30j | journey 91j, first30 | Interdire % tautologique période/elle-même (F4/F5) |
| 3 mois | ~92 j. | prev same length | quarter internal | Ne pas présenter 91j journey comme « sélection 3m » si W déjà ~92j |
| 6 mois / 1 an / 2 ans | spans fixes | prev equal | structure long | Couverture données |
| Toujours | `start: null` | **pas** de prev equal | tenure / first seen | Abstention comparaison égale |

---

## Par famille de découverte (rôles)

| Famille | W | C | H | Comparabilité | Abstention |
| --- | --- | --- | --- | --- | --- |
| density / calendar_rhythm | primary | d30 / d7 | — | densités vs baseline | période vide |
| vs_habit / baselines | primary (séances) | — | habit ~30j | séances vs médiane | histo insuffisant |
| exercise_progress | arc (peut déborder W) | — | séances hors W | **doit** signaler hors fenêtre | sets non trusted |
| emergence / ms_return | events ∈ W idéalement | — | gap historique | — | — |
| quarter_profile / arc | souvent long | — | trimestre | illégitime en voice week | F5 demote |
| anchor | primary vs d30 | — | — | tautologie si W=30j | F5 |
| P3.5 / P3.6 | primary only | prev equal (P36 evo) | — | eligible weekdays | no_classic_activity |
| sleep_night / rhythm | nights ∈ W | — | recent habit | — | hors W sans rôle H |
| sleep assoc | sessions∈W + nights | — | — | observationnel | causalité |
| program adherence | primary | — | journal révisions | plan proof | non_reconstructible |

---

## Producteurs à fenêtre fixe (audit — non désactivés)

| Horizon | Fait qu’il prouve | Contamination 7j ? | Action F2 | Suite |
| --- | --- | --- | --- | --- |
| Habit / baseline 30j | niveau habituel exo | Oui si non qualifié | Rôle H documenté | F4 qualifier |
| Journey −91j | parcours / sleep journey facts | Oui | `journeyHistoricalWindow` | F4/F5 |
| Quarter profile | structure trimestre | Oui sur week | Non désactivé | F5 scope |
| d30 dans copies week | contexte volume | Souvent | OK si « 30 derniers jours » explicite | F4 |
| prevSameLength | trajectoire | Non si égal | Helper C | — |

---

## Note F1 sur 31 / 12 / 22 (7j)

`poolSize` (31) = candidats après détection + scopes.  
`selected` (12) = retenus E0.  
`dropped` (22) = mélange de refus E0 **et** gates post (editorial_gate, insight_validation).  

**Ce n’est pas une partition** : un même kind peut apparaître dans selected et dans dropped (ex. `disc_ms_pr` cap + raw_id). Traçabilité fine → **F5**.
