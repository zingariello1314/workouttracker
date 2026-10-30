# Validation P3.1 — Audit analytique final

**Date :** 30 octobre 2026  
**Périmètre :** qualité des calculs, replay réel, GTG, sélection — **pas P3.2**  
**Commit :** aucun

---

## 1. Seuils et calculs de fréquence

Fenêtre de calcul = **fenêtre Recap** (`window.start` → `window.end`).  
Normalisation : `spanDays = inclusiveCalendarSpanDays(start, end)` ; `weeks = spanDays / 7`.  
Pour 30 j. (1–30 oct.) : `spanDays = 30`, `weeks ≈ 4,286`.

### Unité d’exposition
- **Jour d’exposition** = date avec au moins une séance classique cochée (reps+check) **ou** un jour GTG à identité **certain** mappé sur le même storage id.
- **Séance classique** = jours distincts issus de `collectLifetimeRepHistory` (checked + reps &gt; 0).
- **GTG exclusif** = jours GTG certain **absents** des jours classiques (anti double-compte jour).
- **Volume** = somme des reps classiques dans la fenêtre (pas les mini-sets GTG non synchronisés).
- **Rythme** = `sessionsPerWeek = exposureDayCount / weeks` (jours d’exposition / semaine calendaire).

### Bandes

| Bande | Règle (OU) | Sur 30 j. |
| --- | --- | --- |
| **high** | `sessionsPerWeek ≥ 2,2` **ou** `exposureDayCount ≥ max(8, round(weeks×2,2))` | ≥ 2,2/sem. **ou** ≥ **9** jours |
| **low** | `sessionsPerWeek ≤ 1,0` **ou** `exposureDayCount ≤ max(2, round(weeks×0,9))` | ≤ 1,0/sem. **ou** ≤ **4** jours |
| **mid** | sinon | — |

### Catégories P3.1 (après trajectoire P0 `ok`)

| Catégorie | Condition fréquence | Condition progression P0 | Fiabilité mini |
| --- | --- | --- | --- |
| `freq_progress_high` | high | `net_rise` **ou** `recovered` | `trajectory.ok` ; ≥2 séances lifetime dans fenêtre pour entrer dans la jointure |
| `freq_progress_low` | low | `net_rise` **ou** `recovered` | idem |
| `freq_high_no_progress` | high | `plateau` **ou** `net_decline` **ou** `partial_recovery` | idem |
| `freq_decline_with_low_exposure` | low | **`net_decline` seulement** | idem |

### « Diminution de fréquence »
**Non implémentée** comme Δ fréquence fenêtre vs fenêtre précédente.  
`disc_freq_decline_low_exposure` = **co-occurrence** `net_decline` + bande `low` sur la **même** fenêtre — pas une baisse mesurée du rythme.

### Fréquence prévue
Uniquement si la matrice a des jours `snapshot` ; sinon `plannedFreqUsable = false` (cas oct. 2026).

---

## 2. Audit détaillé — replay 2026-10-01 → 2026-10-30

### 2.1 `disc_freq_progress_low` — id `1433469569` (**sélectionné**)

| Champ | Valeur |
| --- | --- |
| Libellé live (sans getter app) | « un mouvement » (garde-fou prose — id hash non résolu) |
| Exposition | **3** j. |
| Classiques | **3** (12, 19, 26 oct. : 36 → 45 → 45 reps) |
| GTG exclusif | **0** |
| Volume | **126** reps |
| Rythme | **0,70**/sem. → bande **low** (≤ 1,0) |
| Arc P0 | 28/09:34 → 12/10:36 → 19/10:45 → 26/10:45 ; early≈35 late≈45 ; `steady_rise` / `net_rise` ; `interpretingWithHistory` |
| Catégorie | `freq_progress_low` = low + net_rise |
| Texte vs data | exposition, rythme, volume OK ; **avant correctif** : pas de early/late dans le corps |

### 2.2 `disc_freq_progress_low` — id `146651247` (**rejeté `family`**)

| Champ | Valeur |
| --- | --- |
| Libellé | « un mouvement » (même limite de résolution) |
| Exposition | **2** j. |
| Classiques | **2** (02/10:30 ; 16/10:36) |
| GTG exclusif | **0** |
| Volume | **66** |
| Rythme | **0,47**/sem. → **low** |
| Arc P0 | 30 → 36 ; `rise_phases` / `net_rise` ; pas d’historique hors fenêtre |
| Catégorie | même pattern, **autre exercice** → information **distincte** |
| Rejet | 3ᵉ carte de la famille `program_freq_progress` (plafond existant : 2 / nature) |

### 2.3 `disc_freq_decline_low_exposure` — id `202` Pompes inclinées sur support (**sélectionné**)

| Champ | Valeur |
| --- | --- |
| Exposition | **3** j. |
| Classiques | **3** (13, 20, 27 oct. : **40** reps chacun) |
| GTG exclusif | **0** |
| Volume | **120** |
| Rythme | **0,70**/sem. → **low** |
| Arc P0 | … 60 (sept.) → 40 (fin sept. + oct.) ; early≈52 late≈40 ; `decline_phases` / `net_decline` ; avec historique |
| Catégorie | low + **net_decline** (co-occurrence, **pas** Δ fréquence) |
| Texte vs data | **avant correctif** : volume et early/late absents du corps ; titre « exposition réduite » pouvait laisser croire à une baisse de rythme mesurée |

### Causalité
Les formulations nient explicitement une relation causale. Aucune phrase du type « parce que la fréquence… ».

### Aussi produit
`disc_plan_data_insufficient` (0 snapshot / 15 reconstruct) — sélectionné ; cohérent.

---

## 3. Identités GTG

| Cas | Confiance | Fusion exposition |
| --- | --- | --- |
| builtins pullups/dips/pushups → 101/103/104 | **certain** | oui |
| `db_tractions_pronation` | **certain** | oui (storage = id db) |
| classique seul | **certain** | n/a |
| inconnu `totally_unknown_xyz` | **uncertain** | **non** (pas de storage) |
| banque / custom non builtin | **probable** | **non** fusionné dans l’exposition GTG (filtre `confidence === 'certain'` seulement) |

### Double-compte même jour
`exposureDayCount = \|classic ∪ gtgCertain\|` ; `gtgExposureDays` = GTG certain hors classiques.  
Sur le live 30j, rows 101/103/104 : `gtgExclusive = 0` alors que des jours GTG existent — **explication :** sync GTG → `checkedExercises`/`reps` fait apparaître ces jours comme **classiques** ; pas de double-compte, mais la **nature GTG** disparaît après sync.

### Non résolu
- Homonymes / variantes de nom sans id partagé  
- Ids hash programme (`1433469569`, …) sans `getExerciseNameById` → « un mouvement »  
- GTG probable jamais fusionné (voulu)  
- Nature GTG effacée post-sync

---

## 4. Sélection

Règle existante (`selectPeriodDiscoveriesWithTrace`) : max **2** cartes avec la même `family` et la même `nature` sauf score ≥ 86 ou `informativeValue` ≥ 95.

Famille P3.1 freq = `program_freq_progress` :
1. `disc_freq_progress_low` (143…) — retenues  
2. `disc_freq_decline_low_exposure` (202) — retenue  
3. `disc_freq_progress_low` (146…) — **family** (3ᵉ)

Le rejeté est **analytiquement distinct** (autre exercice, autres dates) mais **même schéma** « progress + low ». Ce n’est pas un quota P3.1 ajouté ; c’est le plafond famille générique. Pas de nouveau quota artificiel introduit dans cet audit.

### Coexistence
| Kind | Observé sur replay bundle |
| --- | --- |
| `disc_exercise_progress` | **oui** (selected) |
| `disc_plan_data_insufficient` | **oui** |
| `journey_progress` | non (essays / autre voie — pas dans `selected` period) |
| `program_gap_mixed` | non (moteur relations, hors ce bundle) |

---

## 5. Tests (exécutés pour cet audit)

| Suite | Passés | Échoués | Ignorés |
| --- | --- | --- | --- |
| `recapProgramAdherenceDiscoveries.test.js` | **15** | 0 | 0 |
| `recapProgramAdherenceProgression.test.js` | **19** | 0 | 0 |
| `recapNarrativeClaims.test.js` | **8** | 0 | 0 |
| `recapPeriodDiscoveries.test.js` | **33** | 0 | 0 |
| `recapHorizonEssays.test.js` | **12** | 0 | 0 |
| `calendarDayPlanSnapshot.test.js` | **12** | 0 | 0 |
| **Total** | **99** | **0** | **0** |

Aucun échec. Aucune régression constatée. (Le fail préexistant `recapCompletionTruth` n’est pas dans ce lot.)

---

## 6. Défauts, corrections, verdict

### Défauts découverts
1. Prose freq sans early/late (justification P0 invisible dans le texte).  
2. Carte decline sans volume dans le corps.  
3. Titre « exposition **réduite** » ambigu vs bande **faible** (pas Δ).  
4. Libellés « un mouvement » si resolver absent.  
5. Canal GTG invisible après sync vers clés classiques.  
6. Pas de métrique « diminution de fréquence » temporelle (écart vs brief initial).

### Corrections faites (cet audit)
- Enrichissement prose : early/late + volume sur decline ; titre « exposition **faible** » ; formulation « aucune relation causale ».  
- Test dédié prose/chiffres.  
- **Aucun changement de seuils.**

### Fichiers modifiés
- `src/utils/sport/recapProgramAdherenceDiscoveries.js`  
- `src/utils/sport/__tests__/recapProgramAdherenceDiscoveries.test.js`  
- `docs/analyses-documentation/VALIDATION-P3.1-AUDIT-FINAL-2026-10-30.md`

### Limites restantes
Pas d’axe C/D ; pas de snapshots historiques oct. ; pas de Δ fréquence temporelle ; labels dépendants du getter ; GTG post-sync opaque.

### Verdict
**P3.1 est analytiquement fiable** pour : (a) refuser un taux d’adhérence sans snapshots, (b) croiser bande de fréquence normalisée × story P0 sans causalité, (c) ne fusionner que les identités GTG certaines.  
Les découvertes du replay sont **calculatoirement justifiées** ; la qualité éditoriale live reste limitée par la résolution des noms hash.  
**Prêt pour validation humaine avant P3.2 — P3.2 non démarré.**
