# Progression d’implémentation — v2

**Dernière session :** 2026-11-19, nuit — publication réelle tenue pour démontrée (Worker ~2,9 s, `ready`, 8 cartes). Corrections visibles : fréquence qui monte n’est plus dite en baisse, « repasse » retiré pour une simple présence, « de la tronc » et codes internes retirés, série reconstruite non tenue pour un format enregistré, journée en cours non close. Consolidation branchée sur les trajectoires déjà calculées, une carte au plus, réversible. Le bouton « Pack publié » lit le cache sans recalcul.

**Session précédente :** 2026-11-04 (soir) — P0 sécurisé + Étapes B/C/D amorcées

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

## Session du 19 novembre — mémoire et réserve

La publication du 19 novembre reste démontrée par le dossier Chrome. Cette passe ne l’a pas refaite.

La sauvegarde du 18 novembre et le dossier du 19 novembre ne sont pas le même instantané. La consolidation a été rejouée en lecture seule sur la sauvegarde, huit périodes. Une conclusion sans date dans la fenêtre n’est plus publiée. Un niveau simplement maintenu n’est plus une carte prioritaire. Les conclusions valides non affichées vont dans la réserve accessible.

## Session du 19 novembre — édition et contrôle final

Les 7 jours restaient sur l’ancien cache parce que l’édition n’avait pas changé. La nouvelle édition se recalcule toute seule. Les anciens paquets restent en mémoire. Le bouton « Pack publié » ne mélange plus les périodes. Le contrôle final retire les états internes, les fragments techniques et les sujets anonymes. La consolidation distingue un niveau plus haut, un recul stabilisé, un maintien, une reprise et une reprise incomplète.

## Bloqué

- Vérification navigateur du bouton « Pack publié » et de « Conclusions conservées » : à faire dans la session authentifiée
- P2 non clos
- Aucun commit (consigne)

## Risques résiduels

- Dual storage id **sans** `date` de retour sur les deux cartes → pas de fusion (volontaire ; peut laisser un doublon si producteurs n’attachent pas la date)
- `temporalPlans` exposés mais pas encore moteurs de rédaction long horizon
- `punctualClaim` doit être posé par les producteurs pour activer le cycle J1–J6 en prod

## Session du 19 novembre — P3, raisonnement explicatif

Le profil de séance, la décomposition symétrique fréquence/contenu et le registre de part musculaire sont lus par les cartes de volume et par l’arc mensuel. L’édition courante est `editorial=p3-explanatory-v1`. Les anciens paquets restent en cache et ne sont plus servis comme résultat actuel.

Le rejeu en lecture seule sur la sauvegarde du 18 novembre, fenêtre 20 octobre–18 novembre, donne 5 143 répétitions sur 16 jours de renforcement contre 4 078 sur 15 jours. La fréquence contribue +297 répétitions et le contenu +768. Ce n’est pas la fenêtre 21 octobre–19 novembre du dossier : le 19 novembre n’est pas dans cette sauvegarde.

L’arc juin–octobre nomme juillet (5 827 répétitions, 20 jours) et août (5 438, 17 jours). La remontée d’octobre, à nombre de jours égal à septembre, est portée par le contenu des jours actifs. Sur six mois, le calendrier compte 100 jours d’activité et le compteur de répétitions enregistrées en compte 105. Ce sont deux populations.

La réserve affichée ne compte plus que les conclusions qui ont un titre, un corps et une période. Un identifiant `relation.reading` n’est pas une conclusion consultable. Un titre vide n’est plus recopié depuis le début du corps.
