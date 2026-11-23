# RAPPORT JEU A — Mission 30

Preuve : corpus indépendant + pipeline composition/validation.  
**Distinct du rejeu utilisateur v28** (baseline gelée, non ré-exécutée ici comme oracle).

## Méthode

- Oracle : `artifacts/analysis-eval/mission30-gameA/independentCorpus.json` (sommes manuelles sur événements).
- Exécution : `npx vite-node artifacts/analysis-eval/_m30_run_gameA_abundance.mjs`
- Résultat : `artifacts/analysis-eval/mission30-results/gameA-independent.json`
- Interdit respecté : pas d’oracle = sortie moteur précédente ; pas « claim présent ⇒ vrai ».

## Cas exécutés

| ID | Famille | Attendu indépendant | Calculé / publié | Divergence | §18.7 | Pass |
|---|---|---|---|---|---|---|
| ga-tractions-window-vs-arc | parent/enfant composition | A:288/6 ; B:336/7 | idem après fix v29 | aucune (pré-fix : 8/7) | wrong_population | oui |
| ga-contradiction-proof-vs-prose | contradiction numérique | 336/7 ; prose 8 doit échouer | validation refuse | — | validation_gap fermé | oui |
| ga-rowing-freq-change-mean-stable | freq≠mean | 160/4 mean40 ; prev 80/2 | cohérent | — | — | oui |
| ga-military-mean-change-freq-stable | mean≠freq (hors conception Hyperext.) | 150/3 mean50 ; prev 90/3 | cohérent | — | — | oui |

`runGameAAccuracy` avec `expectedMetricTriples` : **pass=true**.

## Couverture minimale §4.2

| Exigence | Statut M30 |
|---|---|
| Totaux / moyennes / séances | Couvert (oracle + composition) |
| Populations classique/GTG/… | Préparé dans corpus ; vertical populations via backup (rejeu pack) |
| Comparaisons de fenêtres | Partiel (prev vs current dans cas freq/mean) |
| Charges distinctes | Non rejoué verticalement ici |
| last_before_gap / habitual | Non clôturé (préparé B/C) |
| Homonymes | Corpus `ga-dips-homonyms` (identité) — pas encore vertical full |
| Absence / comparateur insuffisant | Corpus `ga-curl-insufficient-comparator` |
| Contradiction preuve/conclusion | Couvert + validation |

## Verdict Porte A

**Jeu A amorcé opérationnellement** avec oracle indépendant et échec/prose détectables.  
**Pas une clôture V1 totale** : vertical 8 horizons utilisateur + populations GTG/charges reste ouvert sur pack de rejeu.
