# Progression d’implémentation — v2

**Dernière session :** 2026-11-04 (soir) — P0 sécurisé + Étapes B/C/D amorcées

## Emplacement doc

Toute la mémoire v2 vit sous `docs/analyses-documentation/moteur analyse v2/`.  
L’ancien chemin `docs/analyses-documentation/analysis-engine/` ne contient qu’une redirection.

## Inspecté / démontré (sessions v2)

- Pipeline composé + span catalog → kinship → colonnes → `insights.*`
- Δ387 = jour 2026-11-02 (voir `../RECONCILIATION-387-REPS-2026-11-04.md`) — **pas un bug d’agrégat**
- P0 volume / reprises / référentiels : corrigés en code + tests ; **navigateur live non encore prouvé**

## Modifié cette vague

| Zone | Fichiers |
|---|---|
| Docs → v2 | déplacement `analysis-engine/*` + README v2 + règle Cursor |
| Rivalité volume resserrée | `recapCardKinship.js` (kinds exacts, ignore exercice/densité/GTG) |
| Homonymes / reprises | `recapEditorialIdentity.js` (`returnEpisodeCollapseKey`, date de retour), `recapPeriodSelection.js` |
| Contrat métrique (B) | `recapMetricContract.js` + branchement `classifyVolumeAttribution` |
| Temporalité (C) | `recapTemporalStrategy.js` + `temporalPlans` dans `recapAdaptiveInsights.js` |
| Cycle de vie (D) | `recapEditorialLifecycle.js` + pénalité novelty ponctuelle |

## Tests exécutés

```
vitest: kinship + narration.f41 + editorial.f5 + metricContract + temporalStrategy + editorialLifecycle
→ 6 files, 54 tests passed (2026-11-04 soir)
```

| Correction | Tests | Live navigateur |
|---|---|---|
| span vs volume_shape | ✅ | ❌ non fait |
| rivalité non-fusion exo/densité/GTG | ✅ | ❌ |
| reprises 42/77 même jour retour | ✅ | ❌ |
| non-fusion homonymes dates distinctes | ✅ | ❌ |
| référentiels F4 | ✅ | ❌ |
| métrique facts attribution | ✅ | n/a |
| plans temporels 6m | ✅ | n/a |
| cycle J1–J6 ponctuel | ✅ | n/a |

## Reste à faire (ordre strict)

1. **P0 live** — recette navigateur authentifié (volume, reprises, dips, empty-window)
2. **B suite** — propager `buildMetricFact` aux autres producteurs (trajectoires, densités, GTG)
3. **C suite** — brancher `selectTemporalPlans` dans les producteurs long horizon (pas seulement exposer `temporalPlans`) ; golden découpages
4. **D suite** — marqueurs `punctualClaim` côté producteurs ; réserve persistante ; caps UI ≠ éditorial
5. **E** — console « pourquoi perdu » + gate FR final pack/DOM
6. **F** — 8 périodes + rapport §9 format mission

## Bloqué

- Validation navigateur P0 : nécessite session app authentifiée (non disponible / non utilisée cette session)
- Aucun commit (consigne)

## Risques résiduels

- Dual storage id **sans** `date` de retour sur les deux cartes → pas de fusion (volontaire ; peut laisser un doublon si producteurs n’attachent pas la date)
- `temporalPlans` exposés mais pas encore moteurs de rédaction long horizon
- `punctualClaim` doit être posé par les producteurs pour activer le cycle J1–J6 en prod
