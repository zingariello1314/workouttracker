# Tests et fixtures F3 — 2026-11-01

## Commandes

```bash
npx vitest run src/utils/sport/__tests__/recapComposedEvidence.test.js
npx vitest run src/utils/sport/__tests__/exerciseTrajectoryAnalysis.test.js
npx vite-node scripts/f3-replay-periods.mjs
```

Résultat session : **18/18** composedEvidence ; **45** combinés avec trajectoire (tous verts).

## Fixtures synthétiques (inline dans les tests)

Construites via `snapFromSessions` : `checkedExercises` + `reps` + `exerciseSetLogs` cohérents (somme sets = total).

| Scénario | Attendu | Statut |
| --- | --- | --- |
| A recul localisé | Décomposition + composition + pas de physio | OK |
| A2 recul partagé | Interdit `recul_isole_a_cet_exercice` si peers shared | OK |
| A3 témoins insuffisants | Analyse principale ; `force_de_famille_intacte` interdit | OK |
| A4 séries non trusted | Pas de `N×M` inventé ; décomposition interdite | OK |
| A5 conditions faibles | Lexique volume, pas « performances baissent » | OK |
| B format maintenu | `more_sets_same_reps`, ~33 %, `consolidated_format` | OK |
| B2 pic isolé | Pas `consolidated_format` | OK |
| B3 fréquence | `frequency_driven_total_rise` | OK |
| C stabilité | Pas de record inventé ; plateau si shape | OK |
| D fluctuation | Pas consolidation ; outlier → interdit tendance | OK |
| E retour | ponctuel (1) vs confirmé (≥3) | OK |
| F GTG | Couvert par garanties P3.5 + interdits composition (pas de double couche) | Doc |
| G programme | Adherence existante ; non étendu F3 | Doc / partiel |
| H fenêtre courte | `windows.primary` = W ; H rôle historique | OK |
| I données manquantes | Composition limitée, faits élémentaires OK | OK |
| J sommeil | Interdits causalités toujours présents | OK |
| K identité | Peers insufficient sans famille | OK |

## Invariants

1. Aucune composition depuis regex sur `body` / `title`.
2. `composedEvidence.sources` cite les calculateurs structurés.
3. Si `!setMechanism.available` → `decomposition_series_vs_reps` dans interdits.
4. `maySayPerformance === false` sauf structure + peers OK.
5. Enrichissement pré-E0 n’altère pas `kind` ni `rawScore`.
