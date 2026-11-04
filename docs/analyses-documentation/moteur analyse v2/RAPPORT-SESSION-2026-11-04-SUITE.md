# Rapport session — suite consolidation v2 (2026-11-04 soir)

## 1. Défauts démontrés

| ID | Symptôme | Cause | Preuve | Impact |
|---|---|---|---|---|
| VOL-SHAPE | Portrait volume publié, attribution absente | Pas de rivalité phénomène global | Audit vérif. + exports | Mauvaise compréhension |
| GLOBAL-VOL-RISK | Regex volume trop large | Matching blob | Revue code | Écrasement cartes distinctes |
| RETURN-42-77 | Double reprise | Collapse id / homonyme | UI audit | Redondance |
| HOMONYM | Fusion possible sur seul nom | Clé name-only | Analyse identité | Fausse fusion |
| DIPS-REF | 31→30 et 20→48 confondus | Observation arc + mécanisme fenêtre | Carte F4 audit | Contradiction |
| Δ387 | 4502 vs 4889 | Jour 2026-11-02 absent snapshot A | RECONCILIATION md | Fausse « régression » |

## 2. Corrections livrées

- **Docs** regroupées sous `moteur analyse v2/`
- **Kinship volume** : kinds exacts, pas d’`exerciseId`
- **Reprises** : `returnEpisodeCollapseKey(nom+date|id)` ; refus homonyme sans date
- **Metric contract** + annotation attribution
- **Temporal plans** + exposition `temporalPlans`
- **Lifecycle** ponctuel + novelty
- **54 tests** verts (6 fichiers)

## 3–8. Avant/après, sélection, temporalité, cycle, quantité, grammaire

- Sélection volume : span > shape sur même phénomène global ; coexistence avec trajectoire/densité/GTG (**tests**)
- Temporalité : sur 6m, plan `before_after_gap` bat half à +140 % outlier (**tests**)
- Cycle : J4 sans preuve → `punctual_no_new_proof` + pénalité (**tests** ; producteurs doivent poser `punctualClaim`)
- Quantité : pas de nouveau quota éditorial ; rivalité = même phénomène seulement
- Grammaire / F4 : hard `per_session_stable_vs_arc_swing` (**tests**)

## 9. Couverture 8 périodes

Non mesurée live cette session (navigateur indisponible).

## 10. Validation (strict)

| Item | Statut |
|---|---|
| Rivalité volume + non-fusion | corrigé et vérifié par tests |
| Reprises / homonymes | corrigé et vérifié par tests |
| Référentiels F4 | corrigé et vérifié par tests |
| Contrat métrique attribution | implémenté + tests ; producteurs autres = non vérifié |
| Plans temporels | implémenté + tests ; rédaction long horizon = non branchée |
| Cycle J1–J6 | implémenté + tests ; flag producteurs = partiel |
| P0 navigateur | **bloqué** (pas d’onglet / session auth) |
| Empty-window live | défaut restant à reconfirmer live |
| Δ387 | documenté (non applicable comme bug agrégat) |

## 11. Documentation

- `moteur analyse v2/README.md`
- `moteur analyse v2/analysis-engine/*` (déplacé + mis à jour)
- `RAPPORT-SESSION-2026-11-04-SUITE.md` (ce fichier)
- `.cursor/rules/momentum-analysis.mdc` → pointe v2
- Redirection `docs/analyses-documentation/analysis-engine/README.md`

## 12. Prochaine reprise (sans ré-audit)

1. Recette navigateur P0 (volume, 42/77, dips, lestées) sur **même snapshot**
2. Brancher `temporalPlans` dans producteurs 6m+
3. Poser `punctualClaim` + dates de retour sur producteurs reprise
4. Console « pourquoi perdu » (span vs shape)
5. Mesure 8 périodes + rapport F
