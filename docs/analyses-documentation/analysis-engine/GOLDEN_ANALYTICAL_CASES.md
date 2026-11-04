# Scénarios analytiques de référence (golden)

| ID | Scénario | Période | Attendu | Interdit | Test | Statut |
|---|---|---|---|---|---|---|
| G-VOL-01 | Attribution densité vs portrait | 30d | `span_volume_vs_frequency` publié si produit ; `disc_volume_shape` cède | Portrait gagne seul sur le même phénomène | `recapCardKinship` + sélection | corrigé tests 2026-11-04 |
| G-RET-01 | Reprise 42 j + 77 j même mouvement | 7d/30d | Une seule carte reprise | Deux cartes 42 et 77 | kinship + periodSelection | corrigé tests |
| G-REF-01 | Dips fréquence + arc | 30d | Pas de mélange « reste proche » + swing early/late sans label | Contradiction référentiels | narration consistency | corrigé tests |
| G-WIN-01 | Exercice hors fenêtre (Pompes lestées) | 7d | Aucune carte exercice si 0 séance fenêtre | Fantôme historique | periodScope / editorialGate | corrigé antérieur |
| G-VOL-02 | 4502 vs 4889 (Δ387) | 7d/30d | Documenter cause (jour 2026-11-02) ; ne pas forcer égalité | Correction cosmétique des totaux | doc ISSUES | documenté |
| G-LIF-01 | Record J1 puis silence J2–J6 | 7d | Ne pas monopoliser le pack sans nouveauté | Persistance artificielle | à faire | ouvert |

Fixtures : `docs/analyses-documentation/analysis-engine/golden/` (à peupler au fil des scénarios).
