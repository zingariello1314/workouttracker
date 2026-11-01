# F2 — Contrats de données, fenêtres et preuves  
**2026-11-01** — Lot unique. Arrêt après F2.

## Verdict

`strengthDays > trainingDays` n’était **pas** une erreur de calcul à « égaliser » : ce sont deux prédicats. Sur fixture 30j, les 4 jours d’écart sont exclusivement du **GTG synchronisé partiel** (reps dans `reps`, `classicExclusive = 0`, hors crédit calendrier). F2 documente les contrats, retire le faux reject, annote les mesures, fixe la convention sommeil + fixture, et date `disc_sleep_night`. **Les packs E0 fixture sont inchangés.**

---

## A — Journées

### Inventaire (synthèse)

| Compteur | Source | Prédicat |
| --- | --- | --- |
| `measure.strengthDays` | `repsByDate.size` dans `measureRecapWindow` | `positive_reps_days` |
| `measure.trainingDays` | `calendarLoad` → `computeCalendarMonthSportStats.isTrainingDay` → `dayCountsAsCalendarTrainingDay` | `calendar_training_union_day` |
| `countTrainingDaysInRange` | même union calendrier | idem |
| `countStrengthTrainingDaysInRange` | checked ∪ recorded reps | proche strength, sans endurance Garmin |
| P3.5 classic / GTG / both | `buildP35DayRecord` | exclusif + coexistence |
| Details UI « jours avec activité » | `countTrainingDaysInRange` | calendrier |

### A3 — Diagnostic exact (fixture)

| Fenêtre | strength | training | strength only | Cause |
| --- | --- | --- | --- | --- |
| 30d | 16 | 12 | 01, 03, 06, 15 oct | `gtg_synced_reps_without_calendar_credit` |
| 3m | 46 | 41 | + 02 sep | idem |
| 7d | 4 | 4 | — | alignés |

**Décision :** conserver la distinction ; corriger le **contrat de validation** (plus de reject d’inclusion) ; annoter `dayContracts` sur la mesure. **Aucun `Math.min`.**

GTG P3.5 (déduction clé à clé, pas de soustraction globale) : **intact**.

---

## B — Fenêtres

Module `recapTemporalContracts` : rôles W/C/H/E, prev equal length, journey 91j en **historical**, today = rolling-24h (convention produit préservée).

Producteurs à horizon fixe **non désactivés** — matrice dans `MATRICE-TEMPORELLE-F2`. Qualification éditoriale → F4/F5.

---

## C — Sommeil

Convention code explicite : `garmin_daily_metrics_key_wake_morning` (`ymd` = clé dailyMetrics = matin du réveil).  
Fixture synthétique : `fixtures/f2-sleep-nights-synthetic.json`.  
Helpers de rôle primary vs historical.  
Copy `disc_sleep_night` : date FR obligatoire quand `ymd` connu (plus de « nuit associée » anonyme sur ce kind).

Limite restante : autres formulations sommeil (assoc / « nuit précédente ») → **F4**.

---

## D — Preuves

- Distinctions P0–P3.6 conservées.
- `dayContracts` + `sleepAttachment` / `nightYmd` sur métriques concernées.
- Pipeline essays non réécrit ; perte de preuve dans essays → note transfert F4.

---

## E — Tests & replays

| Suite | Résultat |
| --- | --- |
| `recapDayContracts.test.js` | OK |
| `recapTemporalContracts.test.js` | OK |
| `recapSleepNightContracts.test.js` | OK |
| `recapSleepNight.test.js` | OK |
| `recapTrainingDayTruth.test.js` | OK |
| `recapP36.test.js` | OK (21) |

Replay `fixtures/f2-replay-periods.json` :

| Période | pool → sel | strength/training | Reject days | Pack vs F1 |
| --- | --- | --- | --- | --- |
| 7d | 31 → 12 | 4/4 | absent | **identique** kinds |
| 30d | 43 → 19 | 16/12 expliqué | absent | **identique** |
| 3m | 52 → 21 | 46/41 expliqué | absent | **identique** |

Temps bundle observés ~0,7 / 1,5 / 2,7 s (pas d’optimisation F2).

**31 / 12 / 22 :** dropped agrège plusieurs étapes ; pas une partition du pool → F5.

---

## Livrables

1. Ce rapport  
2. [GLOSSAIRE-CANONIQUE-F2-2026-11-01.md](./GLOSSAIRE-CANONIQUE-F2-2026-11-01.md)  
3. [MATRICE-TEMPORELLE-F2-2026-11-01.md](./MATRICE-TEMPORELLE-F2-2026-11-01.md)  
4. [REGISTRE-MODIFICATIONS-F2-2026-11-01.md](./REGISTRE-MODIFICATIONS-F2-2026-11-01.md)  
5. Replays / fixtures + scripts `f2-*`  
6. [TRANSFERT-F3-F4-F5-DEPUIS-F2-2026-11-01.md](./TRANSFERT-F3-F4-F5-DEPUIS-F2-2026-11-01.md)

---

## Critères d’acceptation

- [x] Types de journées définis et testés  
- [x] Unions canaux sans double comptage (tests)  
- [x] strength>training expliqué ; validation corrigée (pas Math.min)  
- [x] Rôles W/C/H  
- [x] Dénominateurs identifiables (`dayContracts`)  
- [x] H ≠ présenté comme W (helpers + docs ; copy producers → F4)  
- [x] Convention nuit vérifiée / documentée  
- [x] Nuit hors fenêtre non `primary_observation` (helpers + tests)  
- [x] P0–P3.6 intacts (P36 suite verte)  
- [x] Tests synthétiques OK  
- [x] Replays documentés  
- [x] Packs inchangés expliqués  
- [x] Pas de retune E0 / rédaction massive  
- [x] Pas de commit  

**F2 clôturable sous validation humaine. F3 non engagé.**
