# Fix: Finance netWorth Type Error

## Date: 9 décembre 2025

## Problème

Erreur PropTypes dans la console:
```
Warning: Failed prop type: Invalid prop `data.netWorth` of type `object` supplied to `FinancesSection`, expected `number`.
```

## Cause

Dans `useSidebarData.js`, le calcul de `finance.netWorth` utilisait:
```javascript
netWorth: patrimoine?.total || 0
```

Mais `patrimoine.total` est un **objet** avec la structure:
```javascript
{
  valorise: number,        // Valeur totale valorisée
  plusValuePourcent: number // Plus-value en pourcentage
}
```

## Solution

Correction dans `src/hooks/useSidebarData.js`:

```javascript
// AVANT
netWorth: patrimoine?.total || 0

// APRÈS
netWorth: patrimoine?.total?.valorise || 0
```

## Validation

✅ Aucune erreur de diagnostic
✅ PropTypes valide (number attendu, number fourni)
✅ Cohérent avec l'utilisation dans `useSynthese.js`

## Fichiers Modifiés

- `src/hooks/useSidebarData.js` - Ligne 216

## Impact

- Correction de l'erreur PropTypes
- Affichage correct du patrimoine net dans FinancesSection
- Pas d'impact sur les autres fonctionnalités
