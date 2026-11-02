# F6 — Tests de charge

## Fixture synthétique déterministe

Générateur : jours pairs entraînés, N exercices, 3 séries (même clé reps/jour).  
**Ce n’est pas un profil réel.**

### Après mémo scope + Map lifetime

| Taille | Jours | Exercices | ms (Node) | selected | trajMisses | lifetimeHits |
|---|---:|---:|---:|---:|---:|---:|
| 6w | 42 | 8 | ~403 | 11 | 16 | 2 |
| 6m | 180 | 12 | ~3714 | 11 | 20 | 2 |
| 1y | 365 | 16 | ~19998 | 11 | 24 | 2 |
| 2y | 730 | 20 | ~111682 | 11 | 28 | 2 |

Source : `fixtures/f6-scale-after-lifetime-fix.json`

## Interprétation

- Croissance **superlinéaire** (≈ jours×exercices et coût trajectoires).
- Le fix O(n) de `collectLifetimeRepHistory` ne suffit pas à linéariser : le coût dominant reste ailleurs (trajectoires × exercices, producteurs, scans).
- `lifetimeHits: 2` confirme l’élimination des rescans lifetime catalog/baselines/adhérence **dans une même requête**.
- Réutilisation trajectoire intra-requête faible (1 hit) : les producteurs demandent surtout des id/modes/fenêtres distincts.

## Fixture historique juil–oct

Voir `BASELINE-BENCHMARKS-F6-2026-11-01.md`. Limite : pas d’historique avant ~juillet 2026 pour 6m/1y/2y/toujours.
