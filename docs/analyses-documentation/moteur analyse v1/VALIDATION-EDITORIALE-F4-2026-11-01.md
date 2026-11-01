# Rapport de validation éditoriale F4 — 2026-11-01

| Contrôle | Mécanisme | Résultat session |
| --- | --- | --- |
| Dates FR longues | `expandIsoDatesInProse` + slash dates + polish bundle | Tests OK ; ISO title/body → reject `iso_date_in_user_prose` |
| Sommeil daté | `polishSleepAnonymity` si ymd connu | Test « nuit associée » → date FR |
| Noms exercices | `resolveExerciseNameForRecap` dans narration | Tentative ; fallback « un mouvement » si map absente (documenté) |
| Accords | `fixKnownGrammarInProse` (devient/n’ont) | Tests OK |
| Unités / coloration | `segmentRecapProseValues` : `7 h 42`, `22 min`, `3 × 12`, flèches | Tests OK |
| Segments exercice | `segmentRecapProseSemantic` | Test OK ; UI peut adopter progressivement |
| Conclusions interdites | `forbiddenConclusions` + `editorialValidate` + `insightRejectReason` | Physio / causalité sommeil rejetables |
| Lexique performance | Narration respecte `maySayPerformance` | Volume par défaut si témoins/sets faibles |
| Répétitions mécanisme | Warning `repeated_scheme_phrase` | Trace debug F4 |
| Id bruts | Reject existant + F4 | `disc_ms_pr` encore rejeté raw_exercise_id (préexistant) |

Anomalies restantes → transfert F5 / polish UI.
