# Rejeu indépendant — programme avec `series`

## Entrée

`artifacts/analysis-eval/mission37-baseline/zip/replay/LIVE_INPUTS.json`  
- 7 jours · **57/57** exercices avec `series`  
- `programStructure: schedule_with_prescriptions`  
- Digest pack aligné fingerprint moteur `8ee0e181` (condition nécessaire, **pas** PASS à elle seule)

## Méthode

`buildProgramSessionGraph` / `extractSessionTemplates` depuis le programme LIVE figé.  
Comparaison aux `plannedReps` de `program-structure.json` exporté.

Script : `artifacts/analysis-eval/mission37-baseline/replay-program-series.mjs`  
Preuve : `independent-program-replay.json`

## Résultat — PASS déterministe (programme)

| Jour | Export | Rejeu | Match |
|---|---:|---:|:---:|
| lundi | 384 | 384 | ✓ |
| mardi | 436 | 436 | ✓ |
| mercredi | 424 | 424 | ✓ |
| vendredi | 359 | 359 | ✓ |
| samedi | 436 | 436 | ✓ |
| dimanche | 418 | 418 | ✓ |

- `templateCount` = 6  
- `familyCountMulti` = 3  
- Familles recalculables depuis prescriptions

## Limites explicites

1. **Rejeu 8 horizons complets** (claims, sélection, mémoire) **non** exécuté ici.  
2. Mémoire éditoriale évolutive **exclue** volontairement.  
3. Digest identique ≠ preuve de reproductibilité totale du catalogue publié.  
4. Comparaison humaine à l’aveugle **non** effectuée.

## Ce que cela clôt

La lacune M36 « series vides → rejeu programme impossible » est **levée** sur cet export.  
Le rejeu déterministe des volumes prescrits / familles est **démontré**.
