# Diagnostic DOM — rapport `2026-11-23T16-16-05` + correctif

## Constats du rapport utilisateur

- 8/8 `ready: true`, paquets 12…109 accessibles (Σ 692).
- 8/8 `domCardCount: 0`, statut unique `computed_not_rendered_or_unobservable`.
- `rawTextSample` = chrome nav ; `toutes: 3` ≠ compteur Analyse.

## Cause (démontrée)

Observateur : capture au `ready` mémoire sans attendre montage `[data-analyse-card]` (`showInsightCards` / publication). Statut fusionné + compteurs non scopés.

## Correctif appliqué (code)

Voir `CORRECTIF_DOM_VERDICT.md` + `CONTRAT_DOM_OBSERVATION.md`.  
Schema rapport → `momentum.domEightPeriodVerify.v2`.

## Action manuelle

1. Recharger Récap → **Analyse** (cartes visibles).
2. Relancer **« Vérifier les 8 périodes (DOM) »**.
3. Contrôler 7d : `domCardCount ≥ 1`, `observedIdentities` non vide, `statusLabel` lisible.
