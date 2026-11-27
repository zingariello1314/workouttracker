# BILAN MISSION 33

**Verdict : PARTIEL (correctifs ciblés + preuves ; P6 non clôturée)**  
**NO-GO P7 · aucun commit**  
Édition code : `p6-sovereign-v32`  
Baseline auditée : ZIP v31 du 23 novembre 2026 (`3fab111c` LIVE / `22b7a7ba` engine)

## 1. Cause `3fab111c` / `c8aa227e` (et `22b7a7ba`)

| Empreinte | Contenu |
|---|---|
| LIVE_INPUTS v31 `3fab111c` | `programId=null`, `garminSleepDays=0`, `nameMapSize=0` |
| eight-periods v31 `22b7a7ba` | `programId=default-program`, `garminSleepDays=398`, nameMap 119 |
| v30 user `c8aa227e` | Même volume (34 148 reps) **avec** programme + Garmin — édition/fingerprint antérieurs |

**Cause démontrée :** `assembleCompleteAuditDossier` / `buildLiveReplayInputPack` ne recevaient que `snapshotForRecap` (sans `activeProgram`, `garminBundle`, `nameMap`). Les producteurs 8 horizons, eux, consommaient bien ces contextes → écart d’autorité des entrées, **pas** un second snapshot inventé.

`anchorDate=2026-11-20` = **dernière séance** (`lastRepKey`), pas la fin de fenêtre (23 nov.). Documenté désormais comme `lastSessionDate` + `analysisWindowEnd`.

## 2. Rejeu live

| État | Détail |
|---|---|
| Export v31 | **non_reproductible** si on s’en tient à LIVE_INPUTS seul (program/garmin absents) |
| Correctif v32 | Contextes hydratés passés au dossier ; `reproducibility.status` explicite ; pas d’invention de null→données |
| Preuve Chrome | Nouveau ZIP v32 requis pour démontrer digest LIVE == digest engine |

## 3. Populations (Porte B)

Tests UT : PASS lié · FAIL volontaire · NONCOMPARABLE unbound · NOT_EVALUATED sans triple.  
Export v31 : 118 `noncomparable` (skip_triple) — **non modifié artificiellement**. Les contrôles positifs sont démontrés en tests ; le catalogue live reste majoritairement non lié.

## 4. Jeu A — 4 signalements

| Cas | Cause | Correctif |
|---|---|---|
| `disc_pending_session` | priorité sans `observedValues` / documentary | métriques + preuves chiffrées |
| `disc_pending_context` | idem | `sessionCount` / `recentReps` observés |
| `disc_plan_data_insufficient` | `snapshots=` / `reconstruct=` en prose | evidence + body sportifs |
| `disc_muscle_ledger_limits` | `snapshots=` en evidence + « snapshot » body | prose sportive |

Jeu A **non assoupli**.

## 5. Jeu B étendu

- Cas synthétiques élargis (≥11) ; PASS synthétique `referenceHits=11` sur harness.
- Dimensions 10 axes sur catalogue 7d v31 : profondeur/pouvoir explicatif **faibles** (5 / 1) vs contextualisation/lisibilité élevés → qualité explicative **limitée**, pas généralisée.
- Paquet aveugle : `artifacts/analysis-eval/mission33-baseline/blind-pack.json` (+ `blind-key.json` séparé).

## 6. Jeu C réel 8 horizons

`game-C-eight-horizons.json` : **FAIL** (`textualDuplicatesAccessible=10`) malgré préservation d’ids.  
Cas `session_families_overview|3` : même corps 1 104 car. prioritaire sur 8 horizons → **défaut de sélection temporelle** (correctif : priorité today/week/month seulement).

## 7. Densité 7j

Titre v31 « concentrent le travail sur moins de temps » alors que 333 vs 360 reps/h (−7,4 %) = **moins dense**. Correctif v32 : titre « moins dense ».

## 8. DOM

Toujours **NON_OBSERVÉ** dans le ZIP (pas de nouveau bouton). Voir `PROCEDURE_CHROME.md`.

## 9. Décision P6

**Ne pas clôturer.** Strate 3 incomplète : rejeu live exact post-correctif non encore exporté ; Jeu C réel FAIL ; évaluation humaine aveugle non faite ; DOM non observé.

## Tests

```bash
npx vitest run src/utils/sport/__tests__/mission33ReconciliationIntelligence.test.js
```
