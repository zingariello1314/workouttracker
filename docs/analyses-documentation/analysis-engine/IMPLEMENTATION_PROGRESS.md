# Progression d’implémentation

**Session :** 2026-11-04 — consolidation structurelle (Étape A + P0)

## Inspecté / démontré

- Pipeline composé actif ; ~50 % des cartes DOM hors voie composée (vérif. contradictoire)
- Chemins : discoveries → composed.candidates ; catalog → spanStories ; merge → kinship → colonnes → `insights.*`
- Défauts live : volume_shape vs span ; 42/77 ; dips référentiels ; empty-window lestées ; Δ387 = jour 02/11

## Modifié (cette vague)

| Zone | Fichiers |
|---|---|
| Docs permanentes | `docs/analyses-documentation/analysis-engine/*` |
| Règle Cursor | `.cursor/rules/momentum-analysis.mdc` |
| Volume sélection | `recapCardKinship.js`, `recapAdaptiveInsights.js`, `recapEditorialSelection.js`, `recapPeriodSelection.js` |
| Reprises | `recapPeriodSelection.js`, `recapEditorialIdentity.js`, `recapPhenomenonContract.js`, `recapCardKinship.js` |
| Référentiels F4 | `recapComposedNarration.js`, `recapComposedEvidence.js` |

## Tests exécutés

```
vitest: recapCardKinship + recapComposedNarration.f41 + recapEditorialSelection.f5
→ 3 files, 40 tests passed (2026-11-04)
```

Preuve navigateur des 3 P0 : **pas encore** (à refaire sur données live).

## Reste à faire (ordre)

1. Étape B suite — contrat métrique canonique généralisé (tous producteurs)
2. Étape C — plans temporels 6m+ multi-stratégies
3. Étape D — cycle de vie / réserve / quotas UI vs éditorial
4. Étape E — gate FR + console « pourquoi perdu »
5. Étape F — golden complets + mesure 8 périodes + rapport final §17
6. Validation navigateur des 3 P0 sur données live

## Bloqué

- Aucun blocage technique majeur ; pas de commit (consigne utilisateur)

## Risques

- Rivalité `global_volume` trop large si une carte hors volume matche les regex
- Fusion reprise par nom : collision homonyme rare
