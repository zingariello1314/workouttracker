# Audit des cartes réelles — F1 (2026-11-01)

Sources distinctes :

| Source | Profil | Fenêtres | Fiabilité |
| --- | --- | --- | --- |
| **Fixture** | `workout-main-jul-oct-2026.json` (pas Garmin) | 7d / 30d / 3m | Rejouable, déterministe — `fixtures/f1-audit-kinds-replay.json` |
| **Live** | Session zingariello1314 (captures v0 01/11 ~00:42) | 7j / 30j / 3m | Observé navigateur ; pas rejoué dans F1 ce tour |
| **Guest** | 0 % regularity | — | Abstention P3.6 `no_classic_activity_in_window` |

---

## Fixture 7d (2026-10-24 → 2026-10-30) — selected E0

| # | kind | Titre | Éval. | Problèmes | Alternative plus intéressante (pool/drop) |
| --- | --- | --- | --- | --- | --- |
| 1 | `disc_density` | Ces 7 jours concentre le travail sur moins de temps | Faible | Descriptive ; accord | — |
| 2 | `disc_calendar_rhythm` | Ces 7 jours : le volume repose sur peu de journées | Faible | Stat banale | | 
| 3 | `disc_vs_habit` | Pompes déclinées : ces 7 jours sont en retrait… | Moyen+ | Proche Exemple A mais sans sets/cousins | Enrichir F3 |
| 4 | `disc_structural_memory` | Relevés de genoux à la barre revient… | Moyen | Redondant avec return | |
| 5 | `disc_emergence` | Pompes déclinées revient… | Moyen | Utile mais shallow | |
| 6 | `disc_exercise_share` | 3 mouvements concentrent… | Moyen | OK descriptif | |
| 7 | `disc_rest_assoc` | Association repos / volume | Moyen− | Observation OK ; famille sleep ; pas sommeil réel | |
| 8 | `disc_ms_return_durable` | 3 séances … depuis le retour | Moyen− | Redondance reprise | |
| 9 | `disc_anchor` | Ces 7 jours **devient**… | Faible | Grammaire + tautologie ancrage | Drop éditorial |
| 10 | `disc_exercise_progress` | Pompes déclinées : recul puis retour | Moyen+ | Dates ISO ; arc hors fenêtre possible | Version A |
| 11 | `disc_quarter_profile` | …identifiable par son profil | Faible | Hors sujet 7j | Drop / scope |
| 12 | `disc_ms_pr` | Meilleure série : 12 exercice 146651247 | Faible/P0 | ID brut (aussi drop `raw_exercise_id` / cap) | Résoudre nom ou abstain |

**Droppés notables 7d** : `family_fade` rival ; `repertoire` rival ; muscle_* score ; `no_running` score ; methodology demoted (plan/ledger/revision) — **correct** ; chips `th_pushPull_*` rejected.

---

## Fixture 30d — points saillants

- Pool 43 → 19 selected (~1014 ms bundle).
- **P3.5** coexistence + **P3.6** weekday_regularity (tie lun/mar) : corrects méthodologiquement.
- `disc_freq_decline_low_exposure` sur pompes déclinées : **pertinent** (recul + faible exposition) — proche besoin A.
- `disc_anchor` 30j : « 100 % de tout ce volume mensuel » → **tautologie** (F1-D20).
- Plusieurs `disc_emergence` « un mouvement » anonymes (F1-D12).
- `disc_exercise_progress` cite `≈10 (2026-10-01)` ISO (F1-D10).

---

## Fixture 3m

- Pool 52 → 21 ; ~1,8 s.
- Beaucoup d’`emergence` (×6) : **famille trop présente**.
- `best_month` / `quarter_arc` / `volume_shape` : plus légitimes sur 3m.
- P35/P36 toujours présents.

---

## Live (captures v0 — rappel vérifié)

- **7j** : pas de P36 weekday (éligibilité) — cohérent code.
- **30j / 3m** : `weekday_regularity` sélectionné — cohérent.
- Observations brief F1 confirmées dans l’esprit du fixture 7j : PR faibles, ancrage, profil, comparaisons longues, nuit associée (live Garmin) — **fixture ne peut pas rejouer le sommeil**.

---

## E0 — lecture des niveaux (fixture 7d)

```
pool (all) 31
  → identity / informativeValue sort
  → canTake: score | identity | kind | rival | caps | sleep budget | methodology_demoted
  → selected 12
  → dropped (rival, cap, score, editorial_gate, insight_validation, methodology)
  → (plus loin pipeline) essays → columns → UI
```

Cas documentés :

| Phénomène | Trace | Étape |
| --- | --- | --- |
| Carte faible gagne | density/anchor dans selected ; muscle_share score-out | E0 score/IV |
| Même histoire ×2 | emergence + ms_return_durable | Rivalité insuffisante |
| Famille trop présente | emergence ×N sur 3m | Caps famille soft |
| Méthodo ≠ découverte | plan/ledger → reliabilityNotes | E0 demote OK |
| Titre ≠ corps | « un mouvement » vs corps générique | Producer copy |
| Validation post | ms_pr raw id / chips internes | insight_validation |

**Ne pas retuner les scores en F1** — recommandations dans feuille de route F5.

---

## Formats & coloration (chaîne)

`métrique → discovery.body/title → (essay) → renderInterpretations → JSX Recap + segmentRecapProseValues`

| Élément | Où | État |
| --- | --- | --- |
| Dates FR longues | `formatFrDate`, `formatDayFr`, `expandSlashDatesInProse` | Présents mais **non uniformes** ; ISO survivent |
| Durées `h mm` | `formatDurationFr` | Texte OK ; coloration regex partielle |
| Noms d’exos colorés | — | **Non** (regex valeurs numériques/unités seulement) |
| Architecture | Regex segments `{text, mark}` → `<em class="v">` | Centralisable F4 (segments structurés recommandés) |

Proposition (non implémentée) : builders émettent `proseParts: [{type:'text'|'value'|'exercise'|'date', ...}]` ; UI ne parse plus le français.
