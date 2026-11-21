# Progression d’implémentation — v2

**Dernière session :** 2026-11-20 — Mission 7 (`editorial=p6-sovereign-v6`, `program=structural-adherence-v1`, `review=collective-pass4-v3`). Graphe de séances, adhérence vectorielle, producteurs structurels, Game C honnête (textuel ≠ sémantique), réexploration structurelle, hiérarchie des conclusions, secteurs audit. Qualité live des conclusions encore insuffisante. **NO-GO P7.** Voir `MISSION7_BILAN_P6.md`.

**Session précédente :** 2026-11-20 — Mission 6 (`editorial=p6-sovereign-v5`, `identity=discovery-occurrence-v1`). Identité de publication = occurrence (plus le détecteur seul) : +11 à +25 cartes publiées / horizon vs v4 ; Face pull / Élévations / Kickbacks coexistent ; preuves near_equal structurées ; extraction dispositions export corrigée. Voir `MISSION6_BILAN_P6.md`.

**Session précédente :** 2026-11-19, nuit — publication réelle tenue pour démontrée (Worker ~2,9 s, `ready`, 8 cartes). Corrections visibles : fréquence qui monte n’est plus dite en baisse, « repasse » retiré pour une simple présence, « de la tronc » et codes internes retirés, série reconstruite non tenue pour un format enregistré, journée en cours non close. Consolidation branchée sur les trajectoires déjà calculées, une carte au plus, réversible. Le bouton « Pack publié » lit le cache sans recalcul.

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

## Session du 19 novembre — P4, séances et orphelins

L'édition courante est `editorial=p4-session-demand-v1`. La carte de volume déjà publiée reçoit la décomposition symétrique et le résidu orphelin. Les exercices sans identité canonique sont exclus des trajectoires de consolidation et restent dans le total. La comparaison de séances a quatre issues et n'invente pas de fatigue. Les hausses de charge à format constant sont produites par le détecteur de période, à partir des poids saisis (chaînes numériques) et du drapeau par bras. Une charge répliquée n'est pas une progression. Une capture DOM sans période rendue, ou d'une autre période que le diagnostic, n'est plus déclarée comparable. Le pack publié de la console est replié par défaut. Quand la fenêtre ne contient que des observations simples, leur score brut reste le plancher de conservation.

## Session du 19 novembre — clôture P4, identité et catalogue

L'orphelin est une identité non résolue, quel que soit le format de l'identifiant. `Exercice #123` n'est pas un nom. Les pompes d'endurance complémentaires restent identifiées. Le catalogue accessible conserve les conclusions écartées seulement par un plafond, un score de priorité ou un budget. La durée du pipeline n'additionne plus une étape et ses enfants. Juin entier dans la fenêtre n'est plus une portion.

## P6 — livré dans le paquet

Édition `editorial=p6-sovereign-v3`, consolidation `narrative-coherence-v2`, stimulus `challenge-unknown-v1`, duration `paired-density-v3`.

Correctif exports (intermédiaire) : téléchargement JSON+Markdown en ZIP, timeout/période, progression, erreurs visibles, boutons Récap→Analyse, inspecteur modal portal, comparaisons 7d/30d·6m/1y·1y/2y·2y/all dans l’export 8 périodes. Port Vite réel : `vite --port 5173` (ou `npm run dev` si 3001 n’est pas déjà pris par l’API).

Le contrat `AnalyticalClaim` est posé sur chaque découverte du paquet produit. Une observation sans thèse ne devient pas une découverte. La publication visible (`insights` colonnes + réserve) est issue de `insightsFromP6` lorsque les compteurs P6 se réconcilient : sources fusionnées et doublons exacts restent hors catalogue utilisateur. `draftFromClaim` rédige depuis la thèse. La sélection collective peut promouvoir une fusion ou une réserve au-dessus d’un gagnant legacy. Exploration étendue : décomposition de volume (hausse/baisse), journées à volume proche, retours collectifs, défi pompes chronométré. Densités globales verrouillées par `densityPaired`. Classification défi → `physiologicalUnknown`. Jeux A/B/C reconstitués (harness P1 historique non retrouvé ; B sans comparaison à l’aveugle externe). Inspecteur DEV/admin depuis une carte. Rejeu 8 périodes sur sauvegarde 19 nov. (`P4_REPLAY=1` → `%TEMP%/p6-replay.json`). DOM live non vérifié (localhost 404).

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
