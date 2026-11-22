# Preuves — Populations et familles (Mission 20)

Édition : `p6-sovereign-v19`. Backup : `momentum-sport-backup-2026-11-21.json`. Ancre rejeu : `2026-11-21`.

## 1. Code

| Livraison | Fichier / symbole | Rôle |
|---|---|---|
| Populations | `canonicalAnalyticalPopulations.js` | Autorité `RAW_CHECKED`, `STRENGTH_INCLUSIVE`, `CLASSIC_SESSION`, table de réconciliation |
| Bannière alignée | `recapPeriodMeasure.calendarLoad` | Inclut défis pompes non syncés (comme `strengthReps`) |
| Familles | `monthlyProgramComposition.js` + `sessionSlotMatching.js` | Matching nom+id, clusters `relateSessionTemplates`, effets fréquence/contenu, titre directionnel |
| Direction | `draftFromClaim.resolveDirectionAwareTitle` | Corrige hausse/baisse sans liste de `kind` |
| Collectif | `sessionEpisodeLedger`, `analyticalClaim.sourceEventsOf`, `phenomenonComposition` | Muscles par mouvement ; 9 observedValues ; confirmationDates dans sourceEvents |
| Fingerprint | `snapshotFingerprint` v3 | `exerciseWeights` (573) + `exerciseSetLogs` (594) |

## 2. Exécution

```text
npx vite-node scripts/m19-replay-eight.mjs --end=2026-11-21
npx vitest run src/utils/sport/__tests__/mission20PopulationsFamilies.test.js
```

Artefacts : `artifacts/analysis-eval/mission20-replay-eight.json`, `mission20-rapport-edition.md`.

## 3. Résultat — réconciliation 30j (ancre 21 nov)

| Étape | Volume | Jours |
|---|---:|---:|
| Brut coché | 6103 | 18 |
| − GTG exclusif | 6103 | — |
| + défis unsync | 6403 | — |
| **STRENGTH_INCLUSIVE** (analyses générales) | **6403** | **18** |
| **CLASSIC_SESSION** (familles / ledger) | **5803** | **18** |

Écart général ↔ familles = **600** = complémentaire sync **300** + défis unsync **300**.

Période précédente (23 sep–22 oct) :

| Population | Volume | Jours |
|---|---:|---:|
| Brut | 4166 | 16 |
| Inclusif (après −85 GTG +200 unsync) | 4281 | 12 (jours exclusifs > 0) |
| Classique catalogue | 3966 | 16 |

Quatre journées catalogue-only (01/03/06/15 oct) = **GTG-only** (exclusive = 0) : présentes en familles, absentes du compteur `strengthDays` général.

Identité vérifiée : `classic + complementary + unsync − gtg = inclusive` (6403 = 6403).

### 7j (15–21 nov)

| Population | Préc. (8–14) | Actuel |
|---|---:|---:|
| Classique | 1996 | 1240 |
| Titre familles | — | **baisse** (plus « hausse ») |

## 4. Familles

Sur 30j avec résolveur de noms (journal + programme + DB) :

- 3 clusters de familles (Lun+Ven / Mar+Sam / Mer+Dim via `relateSessionTemplates`).
- Attribution récente ≈ **51 %** du volume (8 séances `probably_related`, 10 non attribuables).
- Contributeur dominant : Street Workout (Lun/Ven) Δ **+1745** (effet fréquence +1950, contenu −204).
- Résidu non attribué explicite dans le corps.

Niveaux d’attribution respectés : structurel / probable / non attribuable. Pas de preuve historique de prescription inventée.

## 5. Collectif

| Critère | v18 | v19 |
|---|---|---|
| Participants | 9 annoncés / 8 observés | **9** observedValues |
| Confirmation 18 nov | absente du claim | présente (`confirmationDates` + prose) |
| Muscles | « chest » seul | shoulders, back, triceps, chest, core |
| Identité épisode | `return_episode\|2026-11-11` | stable sur 8 horizons |

## 6. Variantes

| Situation | Résultat test |
|---|---|
| Appariement volume-only | `circularRisk=true` → pas de `variant_mix_shift` |
| Appariement dayKey/sessionName | `variant_mix_shift` conclu |
| Rejeu backup 21 nov | **0** carte `disc_variant_mix_shift` exportée (pas de greffe non circulaire sur trajectoires réelles) |

## 7. Fingerprint / catalogue

- `weightKeys=573`, `setLogKeys=594` (plus 0).
- Compteurs rejeu 30j : all=88, selected=11, accessible=88 (pas d’écart selected/accessible sur ce rejeu).
- DOM : **NON_OBSERVÉ**.

## 8. Non-régression

- `mission20PopulationsFamilies.test.js` : OK
- `mission17` / `mission18` / `mission19` édition : OK
- Titre 7j familles = baisse ; 30j = hausse
