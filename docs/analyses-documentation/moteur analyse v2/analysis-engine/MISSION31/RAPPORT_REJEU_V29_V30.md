# REJEU PRODUIT — Mission 31

## Preuves distinctes

| Type | Statut | Artefact |
|---|---|---|
| Test unitaire | PASS (24 tests M28–M31) | `mission31PopulationIntegrity.test.js` + régression |
| Rejeu pipeline 8 horizons | **Exécuté** sur backup 21/11 | `mission31-results/replay-eight-v30.json` |
| Revalidation 75 divergences export v29 | 75/75 non-comparables (plus de hard fail) | `revalidate-compare.json` |
| Navigateur / DOM | **NON_OBSERVÉ** | Aucun onglet app accessible à l’agent |

## Rejeu `scripts/m19-replay-eight.mjs`

```
npx vite-node scripts/m19-replay-eight.mjs --end=2026-11-21
```

- Édition code : `p6-sovereign-v30`
- Backup : `snapshots/momentum-sport-backup-2026-11-21.json`
- Fingerprint rejeu : `6c66326b` (totalReps 33647, repKeys 795, nameMapSize=0)
- Export utilisateur v29 : `c8aa227e` (totalReps 34148, repKeys 800, nameMapSize=0)

**Ces empreintes diffèrent : le backup dépôt ≠ snapshot live du run v29.**  
Le rejeu démontre la **reproductibilité du pipeline**, pas la parité bit-à-bit avec l’export Chrome.

| Horizon | all | sel | notes |
|---|---|---|---|
| today…all | 8/8 exécutés | sel=11 typique | Autorité P6 via bundle période |
| Collectif | présent | — | Mémoire / reprise |
| Rejets éditoriaux | chips / ids bruts / anonymes | — | Observés, non bloquants P1 |

## Jeu A

Référence extérieure conservée : `mission30-gameA/independentCorpus.json` + résultats M30.  
PASS corpus contrôlé ≠ validation automatique de toutes les cartes utilisateur. Portée : familles population/composition testées, pas oracle live.

## UI 7 jours (export v29)

| Ensemble | N |
|---|---|
| Priorités (`À retenir`) | **11** |
| Complémentaires (`Autres`) | **47** |
| Accessibles (`Toutes`) | **58** |

Captures « 47 analyses dont 11 mises en avant » : si le compteur global affiche 47, il aligne les **complémentaires**, pas le catalogue accessible (58). À vérifier en DOM (NON_OBSERVÉ ici). Les trois jours 332+426+263=1021 sont cohérents avec le récit utilisateur ; non rejoués depuis le backup (empreinte différente).
