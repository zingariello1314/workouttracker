# Non-régression M37

## Tests exécutés

| Suite | Résultat |
|---|---|
| `mission37AnalyticalIntelligence.test.js` | **8/8 PASS** |
| `mission36ProofQuality.test.js` | PASS (édition assouplie v35\|v36) |
| `recapCardKinship.test.js` | PASS |
| `mission26SemanticIntegrity.test.js` | PASS (parallèles / homonymes) |

## Invariants P6 préservés

- Inconnu ≠ zéro  
- GTG exclu du volume classique  
- Homonymes non fusionnés (parallèles distincts)  
- Populations / dénominateurs cohérents (volume_decomp populations renforcement)  
- Aucun phénomène inventé (contraste seulement si contentPct < −5)  
- Pas de perte silencieuse de conclusions distinctes (familles month restent accessibles)  
- Mémoire éditoriale non réécrite  

## Tests négatifs inclus

- Hausse fréquentielle **sans** baisse de contenu → pas le nouveau titre contraste  
- Parallèle volumes égaux → conserve « convergent »  
- Month overview → **pas** priority_candidate  

## Non rouvert

DOM · Dips monthReps · dédup titre · faux positif physio — sans régression démontrée.
