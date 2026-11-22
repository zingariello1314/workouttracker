# MISSION 18 — Bilan P6

Édition de départ : `p6-sovereign-v16` → édition courante : **`p6-sovereign-v17`**.

**Verdict : P6 non candidate — NO-GO P7.**  
Aucun commit. Aucune purge.

## Synthèse

Les Missions 16–17 avaient ajouté des capacités (gap, co-occurrence, thèse variantes) **insuffisamment branchées** sur le chemin produit. La Mission 18 a identifié des causes racines **démontrées dans le code et sur rejeu réel**, corrigé le collectif sur 30j, et commencé l’unification thèse/texte. Ce n’est pas une clôture P6.

## Livraison 1 — Collectif

| Critère | État |
|---|---|
| Cause racine | Dilution multi-dates dans `exploreCollectiveReturn` + `claimDatesFor` 30j vide pour reprise mono-séance + filet review sans gap |
| Chemin corrigé | Cluster épisode + preuve `gap.after` + review enrichi + score fenêtre |
| Données | Backup sport 19 nov. (`backup.data`) ; audit v16 pour diagnostic |
| Rejeu | 30j : collectif Nov 11 **publié et sélectionné** ; 7j confirmation : **bloqué** (pas de 18 nov. dans le backup) |
| Ancien | 0 `disc_collective_return` dans candidats v16 |
| Nouveau | Voir TRACE + `mission18-replay-7d-30d.json` |
| Contre-exemple | `{ flat: true }` sur Nov11+diluteurs → non conclu ; cluster → conclu |

## Livraison 2 — Thèse / sélection / pic

| Critère | État |
|---|---|
| Cause racine thèses fantômes | F4 `applyComposedNarrationToDiscovery` écrasait titre/corps après rewrite programme tout en gardant `kind`/`thesis` |
| Correction | Préserver `variant_mix_shift` + `trajectoryOk:false` à la réécriture |
| Pic 18 nov. | Clés sémantiques divergentes ISO vs « 18 novembre » → `normalizePeakDayKey` |
| Preuve produit packs | **Partielle** (tests unitaires verts ; rejeu qualitatif textes avant/après sur 8 horizons non terminé) |
| Hiérarchie | Non re-démontrée end-to-end cette mission |

## Livraison 3 — Composition programme mensuelle

**Non exécutée** au sens produit. Capacité non démontrée.

## Fiabilité parallèle

| Point | État |
|---|---|
| Faits hebdo / épisode | Non traité en profondeur |
| Catalogue 711 vs 717 | Non tranché |
| Fingerprint multi-sources | Non terminé |
| Exports M17 | Préservés (pas de refonte) |

## Preuves par niveau (exigence §15)

| Niveau | Collectif 30j | Thèses fantômes | Pic | Familles mensuelles |
|---|---|---|---|---|
| Unitaire | oui | oui | oui | non |
| Pack synthétique | partiel | partiel | partiel | non |
| Rejeu moteur réel | **oui** | non | non | non |
| Publication | sélectionnée 30j | — | — | — |
| DOM | non | non | non | non |

## Décisions à discuter avec ChatGPT (avant suite)

1. Origine des collectifs : **événements de séance / épisodes** plutôt que cartes individuelles déjà filtrées ?
2. Faut-il publier plusieurs collectifs (un par cluster) ou un seul « meilleur » ?
3. Backup ≥ 21 nov. obligatoire pour valider confirmation 7j — qui le fournit ?
4. Simplifier le pipeline F3/F4 vs thèses programme (autorité narrative unique) ?

## Conclusion

Infrastructure + **une** conclusion collective réelle sur 30j : progrès.  
**Pas** de candidature P6. **NO-GO P7.**
