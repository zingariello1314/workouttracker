# Registre des modifications — F2 (2026-11-01)

Aucun commit Git. Pas de retune E0. Packs fixture inchangés (mêmes kinds sélectionnés).

| Fichier | Cause | Contrat | Avant | Après | Test |
| --- | --- | --- | --- | --- | --- |
| `src/utils/sport/recapDayContracts.js` | **nouveau** | Journées / canaux | — | Glossaire exécutable + gap strength/calendar | `recapDayContracts.test.js` |
| `src/utils/sport/recapTemporalContracts.js` | **nouveau** | W/C/H | — | Rôles fenêtres + helpers | `recapTemporalContracts.test.js` |
| `src/utils/sport/recapSleepNight.js` | Datation / preuve | Sommeil | Nuit sans métadonnées d’attachement | `SLEEP_ATTACHMENT_CONVENTION`, `attachment` sur nuit, `classifySleepNightWindowRole`, `buildSleepNightProofFields` | `recapSleepNightContracts.test.js` |
| `src/utils/sport/recapInsightValidate.js` | Fausse incohérence | strength vs training | Reject `strength_days_gt_training_days` | Reject retiré (contrats distincts) | dayContracts + replay (plus de log) |
| `src/utils/sport/recapPeriodDiscoveries.js` | Provenance mesure + nuit datée | Jours + sommeil | Compteurs sans contrat ; « nuit associée » sans date | `dayContracts` sur measure ; copy nuit avec `formatDayFr(ymd)` + metrics nightYmd | sleep + day tests ; replay |
| `docs/.../fixtures/f2-sleep-nights-synthetic.json` | Fixture C4 | Sommeil | Absente | Nuits synthétiques frontières | sleep contracts |
| `scripts/f2-diagnose-day-sets.mjs` | Diagnostic | A3 | — | Ensembles de dates | manuel |
| `scripts/f2-explain-strength-only.mjs` | Diagnostic | A3 | — | Cause GTG | manuel |
| `scripts/f2-replay-periods.mjs` | E | Replays | — | 7d/30d/3m JSON | artefact |

### Non modifié (volontairement)

- Scores E0 / rivaux / caps
- P3.5 sync rules
- P3.6 eligible rates
- Essays / colonnes
- UI
- Caches
