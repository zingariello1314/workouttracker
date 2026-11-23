# RAPPORT VALIDATION VERTICALE — Mission 28

## Preuves gelées (baseline)

Dossier : `artifacts/analysis-eval/mission28-baseline/`

| Artefact | Fichier |
|---|---|
| AUDIT JSON | `momentum-ANALYTICAL_AUDIT-p6-sovereign-v26-2026-11-22T16-17-05-902Z.json` |
| TRACE | `…16-19-56-120Z.json` et `…16-23-41-112Z.json` |
| AUDIT_IA | `momentum-AUDIT_IA-2026-11-22T16-14-53-972Z.md` (+ historiques du jour) |

Ces artefacts sont des **observations produit**, pas un snapshot source rejouable.

## Observations v26 confirmées dans l’AUDIT

| Métrique | Valeur |
|---|---|
| Cartes / claims | 716 / 716 |
| Faits | 58 |
| Candidats | 1452 |
| Autorité P6 | 8/8 horizons |
| Orphan parents | 2 (3m only) |
| publicationCount mémoire | 0 |
| exposures | 64 |

## Corrections code M28 (implémenté + testé UT)

| Correction | Fichiers | Preuve exécution UT | Publié rejeu | Observé app |
|---|---|---|---|---|
| `subjectKey` honore `parallel:` | discoveryIdentity.js | M28 | Non | Non |
| Aspects parallèles ≠ fusion | discoveryIdentity + narrativeCoherence + selection | M28 | Non | Non |
| Suppression avec destination | collectiveSelection.js | M28 | Non | Non |
| Orphan reconcile publication | p6Publication.js | M28 | Non | Non |
| Totaux ≠ moyennes | parallelTrajectoryComposition.js | M28 | Non | Non |
| Registre publications | analyticalMemory.js | M28 | Non | Non |
| Édition v27 | analysisEdition.js | M28 | Non | Non |

Batterie : `mission25–28` → **33/33 OK**.

## Quatre preuves par correction (statut)

Pour chaque item ci-dessus :

- **Code** : oui  
- **Exécution pipeline unitaire** : oui (Vitest)  
- **Résultat produit rejeu 8 horizons** : **manquant**  
- **Non-régression live / DOM** : **manquant**

## Procédure unique utilisateur (preuves manquantes)

Sans inspecter carte par carte :

1. Build courant `p6-sovereign-v27`.
2. Même compte / mêmes données que v26 (ou export snapshot figé si disponible).
3. Depuis Analyse → exporter **AUDIT JSON + TRACE + AUDIT_IA** en une campagne.
4. Bouton **Vérifier les huit périodes DOM** → conserver le résultat.
5. Ne pas ouvrir Inspecter une à une sauf anomalie ciblée.

Critères de succès rejeu :

- `integrityValidation.ok=true` (ou zero `orphan_parent`)
- Parent parallèle Hyperextension : totaux cohérents si `recentReps` structurés présents
- `memoryEvidence.publicationCount ≥ 1` après évolution phénomène
- Autorité P6 conservée 8/8

## Non-régression hors sport

Non exécutée en masse dans cette mission (consigne : ne pas verdir artificiellement les autres domaines). Inventaire : dette préexistante connue ; pas de modification providers hors sport.
