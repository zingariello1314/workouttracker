# MISSION 22 — Bilan P6

Édition : `p6-sovereign-v20` → **`p6-sovereign-v21`**. P6 **non clôturée**. **NO-GO P7**. Aucun commit.

## Verdict

Les divergences v20 rejeu ↔ export utilisateur sont surtout des **défauts de branchement et d’export**, pas des inventions de ChatGPT ni des échecs totaux du moteur M21. Mission 22 ferme la chaîne faits → mémoire → worker → persistance → audit, et documente honnêtement la non-parité d’attribution à 100 % sur backup figé.

## Porte A — Unité rejeu / application

- Volumes classiques **alignés** (5803 / 3881) : même population.
- Attribution recognized ~**51 %** reproductible (basic et enriched) ; **100 % app non reproduit** sur ce backup → écart d’environnement (programme / nameMap live).
- Fingerprint **v4** : reps, charges, setLogs, durées, GTG, défis, programme, sommeil Garmin.
- Artefact : `mission22-attribution-parity.json`.

## Porte B — Faits et preuves exportés

- Cause : `slimCard` amputait `sharedFacts` / `factRegistry` / `memory`.
- Correction : conservation + fusion dans `factRegistry` d’audit ; `memoryEvidence` dérivé ou chargé.
- Tests : `mission22Convergence` — factRegistry > 2, memory.state exporté.

## Mémoire persistante

- Injection `analyticalMemory` : pipeline, extras, worker `sideJson`, retour `memoryUpdate`, `saveAnalyticalMemory` UI.
- Continuité d’épisode (`resolveContinuousEpisodeId`) si chevauchement ≥ 50 %.
- Scénarios S1–S6 + S8 en tests ; S7 continuité ; exposition ≠ publication.

## Hiérarchie / sélection / réconciliation

- `justifyParentChildLink` démontré unitairement.
- `hierarchyLink` conservé dans slimCard.
- Réconciliation multi-indicateurs : écarts encore à expliquer horizon par horizon (exigence ouverte).
- `selectionReason` enrichi via `publicationDecision.reason` mémoire quand présent.

## Généralisation

- Pack synthétique Push/Pull : contributions gap 0.
- Batterie A–F complète + sommeil / horizons : **non clôturée** dans cette mission (preuve minimale, pas faux succès).

## Validation

| Preuve | Statut |
|---|---|
| Code | Oui (modules listés dans RAPPORT_PREUVES) |
| Exécution tests ciblés | Oui (37+ verts M19–M22 liés) |
| Rejeu 8 horizons v21 | À relancer (`m19-replay-eight`) |
| Vitest globale | Ouverte / à documenter si blocage |
| DOM | NON_OBSERVÉ — procédure ci-dessous |
| A/B/C exhaustifs | Partiels |

### Procédure DOM courte (si navigateur authentifié inaccessible ici)

1. Profil isolé + backup 21 nov.  
2. Ouvrir Recap → 7j / 30j : noter `phenomenonId`, priorité, approfondissements.  
3. Recharger la page : vérifier persistance mémoire (pas de re-priorisation artificielle).  
4. Exporter JSON analytique : `factRegistry` > 2, `memoryEvidence.status=loaded|derived_from_cards`, cartes avec `sharedFacts` / `memory`.  
5. Comparer fingerprint v4 avant/après mutation GTG ou programme.

## Suite Mission 23 (évaluation finale — pas corrections des mêmes trous)

1. Parité nameMap figée app↔rejeu.  
2. Observation DOM authentifiée.  
3. A/B/C + Vitest globale.  
4. Hiérarchie visible UI.  
5. Sommeil / horizons généralisés selon spec.
