# Scénarios analytiques de référence (golden)

| ID | Scénario | Période | Attendu | Interdit | Test | Statut |
|---|---|---|---|---|---|---|
| G-VOL-01 | Attribution vs portrait global | 30d | span gagne si même phénomène global | Portrait gagne seul | kinship | ✅ tests |
| G-VOL-03 | Non-fusion volume global vs exo/densité/GTG | 30d | Les 4 coexistent | Span écrase trajectoire dips | kinship négatif | ✅ tests |
| G-RET-01 | Reprise 42/77 même jour retour | 7d/30d | Une carte | Deux cartes | periodSelection + identity | ✅ tests |
| G-RET-02 | Homonymes ids+dates distincts | 7d | Deux cartes | Fusion abusive | periodSelection | ✅ tests |
| G-REF-01 | Dips référentiels F4 | 30d | Pas de mélange silencieux | 20→48 + « reste proche » | narration | ✅ tests |
| G-WIN-01 | Empty-window lestées | 7d | Pas de carte | Fantôme | periodScope | ✅ antérieur |
| G-VOL-02 | Δ387 | 7d/30d | Doc snapshot | Égaliser totaux | RECONCILIATION md | documenté |
| G-TMP-01 | 6m rupture vs % opportuniste | 6m | Plan gap > half outlier | Course au % | temporalStrategy | ✅ tests |
| G-LIF-01 | Record J1 silence J2–J6 | 7d | Priorité basse sans nouvelle preuve | Recyclage auto | editorialLifecycle + novelty | ✅ tests (flag punctualClaim) |

Fixtures : `docs/analyses-documentation/analysis-engine/golden/` (à peupler au fil des scénarios).
