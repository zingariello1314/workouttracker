# Correctif M33-DOM — verdict

**P6 ouverte · NO-GO P7 · aucun commit**  
Édition analytique inchangée : `p6-sovereign-v32` (aucune règle de calcul / sélection / claim modifiée).

## Cause racine démontrée

Le rapport `2026-11-23T16-16-05` montre `ready=true`, packs 12…109, mais `domCardCount=0` et `computed_not_rendered_or_unobservable` × 8.

1. `RecapAnalyseView` ne monte `[data-analyse-card]` que si `showInsightCards` (publication alignée).
2. Le vérificateur capturait dès `analysisStatus===ready` + insights mémoire, **sans attendre** la peinture ni `data-analyse-waiting=false`.
3. Pendant « Préparation des analyses… », zéro nœud carte → faux « cartes absentes ».
4. Compteurs lus sur `document.body` entier → `toutes: 3` artefact nav, pas le filtre Analyse.
5. Statut fusionné `computed_not_rendered_or_unobservable` confondait calcul et observation.

**Ce n’est pas une disparition des 692 conclusions dans l’UI.**

## Correctif minimal

- `domEightPeriodVerify.js` v2 : sonde scopée, attente publication + paint, statuts distincts, ids via `data-card-id`.
- Attributs d’observation sur `RecapAnalyseView` (`waiting`, `publication-ready`, `role`, `title`, compteur).
- `getState` DOM enrichi (`insightsPublication`, fenêtre).
- Tests : 12/12 `mission33DomObserver.test.js`.

## Catalogue 692 vs 712

| Source | Total | Contexte |
|---|---:|---|
| DOM v32 packs | 692 | Run live 23/11 16:13, édition v32 |
| Audit ZIP v31 | 712 | Export antérieur, LIVE `3fab111c` incomplet |

**Non comparables** pour conclure à une perte : éditions, hydratation LIVE, et moment de run distincts. Les deltas d’effectifs (ex. 7d 61→57) ne sont pas démontrés comme fusions/suppressions sans même fingerprint engine.

## PASS navigateur

**Non annoncé.** L’utilisateur doit relancer « Vérifier les 8 périodes (DOM) » puis ré-exporter le dossier.

Attendu sur 7d : `domCardCount ≥ 1`, au moins une `observedIdentities` reliée au pack, `statusLabel` ≠ `NON_OBSERVABLE` / ancien libellé fusionné.

## Arrêt

Instrumentation DOM **terminée** dès que les cartes sont observables sans ambiguïté. Prochaine étape = intelligence analytique (Jeu C / B), pas une nouvelle couche DOM.
