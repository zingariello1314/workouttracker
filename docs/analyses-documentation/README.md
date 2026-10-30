# Analyses — documentation de référence

Dossier de travail pour le moteur d’analyses Recap (toutes plages horaires).

## Document lead (à suivre en priorité)

| Document | Rôle |
| --- | --- |
| **[MISSION-MAJEURE-MOTEUR-ANALYSE-APPROFONDI.md](./MISSION-MAJEURE-MOTEUR-ANALYSE-APPROFONDI.md)** | **Lead.** Mission majeure : moteur d’analyse approfondi, transversal et intelligent (raisonnement d’abord). **Prime** en cas de conflit. |
| **[PLAN-MISSION-MAJEURE-MOTEUR-ANALYSE.md](./PLAN-MISSION-MAJEURE-MOTEUR-ANALYSE.md)** | **Plan d’exécution béton** (exigences R1–R4 : Finding≠profondeur, inventaire corrélations, golden analytique, diagnostic sélection). |
| [INVENTAIRE-CORRELATIONS-ANALYSES.md](./INVENTAIRE-CORRELATIONS-ANALYSES.md) | Matrice des relations données (dispo réelle, méthodes, priorités P0–P2). |
| [COMPTE-RENDU-MISSION-MAJEURE-ANALYSES.md](./COMPTE-RENDU-MISSION-MAJEURE-ANALYSES.md) | Avant/après profondeur + statut livraison R1–R4. |
| **[ETAT-AVANCE-PROFONDEUR-CONTENU-2026-10-29-2227.md](./ETAT-AVANCE-PROFONDEUR-CONTENU-2026-10-29-2227.md)** | **Snapshot 29/10/2026 22:27** — trajectoire exercice, passes récentes, fichiers touchés, console, suite. |
| **[INVENTAIRE-CONSOLE-ANALYSES-PAR-PERIODE-2026-10-30.md](./INVENTAIRE-CONSOLE-ANALYSES-PAR-PERIODE-2026-10-30.md)** | **Inventaire 30/10/2026** — console de diag + analyses / kinds / conditions **par période** (factuel). |
| **[console de dev/CAPTURE-LIVE-CONSOLE-30d-2026-10-30.md](./console%20de%20dev/CAPTURE-LIVE-CONSOLE-30d-2026-10-30.md)** | **Capture live 30/10/2026** — registre console 30j (15 affichées + familles + déclassées + données chiffrées). |
| **[ARCHITECTURE-FONCTIONNEMENT-MOTEUR-ANALYSES-2026-10-30.md](./ARCHITECTURE-FONCTIONNEMENT-MOTEUR-ANALYSES-2026-10-30.md)** | **Architecture 30/10/2026** — pipeline, producteurs, sélection, formulation, RCA forensique. |
| **[AUDIT-CORRECTIONS-P0-TRAJECTOIRE-2026-10-30.md](./AUDIT-CORRECTIONS-P0-TRAJECTOIRE-2026-10-30.md)** | **Audit + corrections P0 30/10/2026** — constats vérifiés (avéré/partiel), fixes trajectoire/émergence/témoins/séries, tests, reste P3–P5. |
| **[VALIDATION-P0-POST-CORRECTIONS-2026-10-30.md](./VALIDATION-P0-POST-CORRECTIONS-2026-10-30.md)** | **Validation live P0** — re-run console 30j, avant/après, témoins, cas limites, textes vs metrics, point sélection. |
| **[BILAN-SELECTION-DECOUVERTES-2026-10-30.md](./BILAN-SELECTION-DECOUVERTES-2026-10-30.md)** | **Bilan sélection** — audit conflit progress/journey, correctifs valeur informative + prose ids, validation live, tests. |
| **[VALIDATION-SELECTION-FINALE-2026-10-30.md](./VALIDATION-SELECTION-FINALE-2026-10-30.md)** | **Validation finale sélection** — ids multi-producteurs, pack 17, stabilité, go-off P3 (adhérence×progression). |
| **[P3-AUDIT-CONCEPTION-ADHERENCE-PROGRESSION-2026-10-30.md](./P3-AUDIT-CONCEPTION-ADHERENCE-PROGRESSION-2026-10-30.md)** | **P3 audit/conception** — inventaire données, historique programmes, 4 axes, architecture, ordre d’implémentation (sans code). |
| **[P3.0-SOCLE-ADHERENCE-PROGRESSION-2026-10-30.md](./P3.0-SOCLE-ADHERENCE-PROGRESSION-2026-10-30.md)** | **P3.0 socle** — matrice plan×réalisé, règles, tests, comparaison live 30j (0 snapshot). |
| **[VALIDATION-P3.0-MATRICE-2026-10-30.md](./VALIDATION-P3.0-MATRICE-2026-10-30.md)** | **Validation P3.0** — causes 0 snapshots, double dénominateur, exécution/GTG, correctifs, 19+12 tests. |
| **[P3.1-ADHERENCE-PROGRESSION-2026-10-30.md](./P3.1-ADHERENCE-PROGRESSION-2026-10-30.md)** | **P3.1** — découvertes adhérence × freq/progression, claims, replay 30j, tests. |

## Références (secondaires)

| Document | Rôle |
| --- | --- |
| [MISSION-AMELIORATION-MOTEUR-ANALYSE.md](./MISSION-AMELIORATION-MOTEUR-ANALYSE.md) | Fil rouge **antérieur** (quick wins). Historique seulement — plus directeur. |
| [AUDIT-STRATEGIQUE-MOTEUR-ANALYSE.md](./AUDIT-STRATEGIQUE-MOTEUR-ANALYSE.md) | Audit code-first, limites, cas 14 cartes |
| [ARCHITECTURE-CIBLE-MOTEUR-ANALYSE.md](./ARCHITECTURE-CIBLE-MOTEUR-ANALYSE.md) | Cadre de conception (subordonné à la mission + au plan) |

**Ordre :** mission majeure → **plan** → audit/archi si besoin → implémentation phase par phase.

**Validation live :** `localhost:3001` — Sport → Recap → Analysis.
