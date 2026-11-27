# Inventaire des capacités d’export (Mission 32)

| Commande UI | Fonction | Exporte | Démontre | Omet | Effets mémoire/publication |
|---|---|---|---|---|---|
| Cette période | `momentumExportAnalysisDossier` | Dossier 1 horizon | Pack publié / calculé | Entrées sportives brutes | Lecture |
| 8 périodes | `momentumExportEightPeriods` | ZIP/JSON 8 horizons | Catalogue, réconciliation | DOM sauf capture passée | Lecture ; peut **recalculer** packs manquants |
| Comparer 2 périodes | `momentumExportPeriodComparison` | Diff A/B | Écarts titres/priorités | DOM | Lecture |
| Rapport d’audit IA | `momentumExportAuditIa` | Markdown | Synthèse humaine | Entrées live | Lecture |
| JSON analytique complet | `momentumExportAnalyticalAudit` | `ANALYTICAL_AUDIT.json` | Cartes/claims/intégrité | DOM si non fourni ; entrées brutes | Lecture |
| Trace de raisonnement | `momentumExportReasoningTrace` | Trace modules/fusions | Observabilité raisonnement | Entrées | Lecture |
| Toutes les inspections | même trace | Index bulk | Idem | Idem | Lecture |
| **Dossier d’audit complet** | `momentumExportCompleteAudit` | ZIP (audit+trace+8p+eval+**LIVE_INPUTS**+DOM si dispo) | Preuve A+B+C si DOM fait avant | — | Lecture |
| **Vérifier 8 périodes (DOM)** | `momentumVerifyEightPeriodsDom` | JSON DOM + `__momentumLastDomVerify` | Rendu vs pack | — | **Aucune** écriture mémoire |
| Charger artefacts rejeu | `momentumInjectEvalArchive` | Injecte localStorage eval | Rejeux hors UI | — | localStorage eval seulement |

## Lacunes avant M32

1. Pas d’export des **entrées** live → fingerprint backup ≠ live inexplicable dans le ZIP.  
2. DOM souvent `not_observed` : non lancé avant le ZIP **ou** fermeture React périmée.  
3. `noncomparable` calculé mais **non exporté** dans l’audit.

## Modifications M32 (minimales)

- `replay/LIVE_INPUTS.json` dans le dossier complet.  
- DOM : ref live + virtualisation + téléchargement JSON.  
- `diagnostics.populationMetricChecks` (pass/fail/noncomparable/not_evaluated).  
- **Aucun nouveau bouton.**
