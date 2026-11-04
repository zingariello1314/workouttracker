# Journal des décisions structurantes — v2

## D-2026-11-04-01 — Préserver le composé, corriger la sélection

- **Problème :** capacités F4/preuves existent mais ne dominent pas le DOM
- **Retenu :** unifier sélection (pas refonte totale)
- **Conséquence :** kinship + IV + adaptive weights

## D-2026-11-04-02 — Identité de reprise par nom+date (pas nom seul)

- **Problème :** 42 j / 77 j avec storage ids distincts ; risque homonyme
- **Options :** (A) fusionner tout homonyme (B) nom+date de retour (C) alias prouvé uniquement
- **Retenu :** B + alias/id prouvé ; **absence de fusion** si ids distincts sans date partagée
- **Compromis :** doublon possible si producteurs omettent la date d’événement

## D-2026-11-04-03 — Rivalité volume attributive vs descriptive (kinds exacts)

- **Problème :** portrait `disc_volume_shape` bat span ; regex trop large
- **Retenu :** rivalité `global_volume_period` limitée aux kinds globaux **sans** `exerciseId`
- **Écarté :** matching blob « volume » / bonus titre ad hoc

## D-2026-11-04-04 — Référentiels explicites en narration F4

- **Retenu :** frequency_driven → observation sur fenêtres ; hard `per_session_stable_vs_arc_swing`

## D-2026-11-04-05 — Mémoire documentaire sous `moteur analyse v2/`

- **Retenu :** un seul dossier v2 ; redirection depuis `analysis-engine/` racine analyses-documentation

## D-2026-11-04-06 — Plans temporels scorés hors course au %

- **Retenu :** `proposeTemporalPlans` + `scoreTemporalPlan` (effectifs, outliers, ruptures) ; max 2–3 plans
- **Écarté :** appliquer toutes les découpes à chaque découverte

## D-2026-11-04-07 — Cycle de vie sans TTL uniforme

- **Retenu :** `assessPunctualClaimFreshness` selon horizon + nouvelle preuve ; pénalité novelty si `punctualClaim`
- **Écarté :** purge fixe 48/72 h
