# MISSION 23 — Bilan P6

Édition : `p6-sovereign-v22` · `memory=persistent-vertical-v3` · `hierarchy=verified-deepening-v2` · `fingerprint=multi-source-v5` · `observability=reasoning-trace-v2` · `audit=normalized-export-v9`.

Baseline gelée : `artifacts/analysis-eval/mission23-baseline/` (HEAD `4c15c2cc`, v21).

**P6 non clôturée. NO-GO P7. Aucun commit.**

## Portes

| Porte | Cause réelle | Correction | Preuve |
|---|---|---|---|
| A Mémoire | `decideInformativePriority` écrit `newPriorityCard=false` mais `selectCollectively` l’ignorait → `selectionReason=p6_priority` | Démotion `demoted_memory_familiarity` sauf `forcePriority` | UT M23 + sélection instrumentée |
| A Profil | `memoryEvidence` rechargeait souvent un profil distinct / vide vs mémoire carte | Pack snapshot + comparaison local/pack | completeAuditDossier |
| B Hiérarchie | `subjectIdsOf` incluait tous les `events` du collectif ; `publishableP6Card` omettait `hierarchyLink` ; label `verified` sans preuve | Subjects = namedMoves ; export lien obligatoire ; sinon keep_independent | UT M23 + M14 |
| C Trace | Modules absents classés `not_called` | `unknown_not_instrumented` ; `applyP6.pipelineSteps` | UT + dossiers |
| D Fingerprint | programme/sommeil/nameMap hors snapshot plat | `snapshotFingerprint(snap, ctx)` v5 | UT |
| D Réconcil. | MD `countsReconciled` ≠ JSON `reconciledStrict` | MD/JSON sur `finalCatalogReconciliation` | auditIaReport |

## ASPECT (état)

Voir `RAPPORT_VALIDATION_ASPECT_MISSION23.md` et `REGISTRE_CLOTURE_P6.md`.

## Non clôturé

- DOM non observé ici.
- Aveugle humain non réalisé (`mission23-blind-packet-PENDING.md`).
- Packs généralisation A–F : pas de runner dédié trouvé ; jeux A/B/C + UT structurels seulement.
- Parité attribution 100 % vs 51 % : fingerprint corrigé côté entrées, rejeu live utilisateur encore requis.
- Sommeil contextualisé / horizons longs : exigences P6 toujours ouvertes.
- Vitest globale hors sport : non modifiée ; suite sport cœur M7–M23 verte après assouplissement des regex d’édition figées.
