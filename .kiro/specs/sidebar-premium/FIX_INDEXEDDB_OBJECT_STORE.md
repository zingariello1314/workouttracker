# Fix: Erreur IndexedDB Object Store Not Found

## Problème

Lors du parcours de la sidebar, des erreurs apparaissaient dans la console:

```
NotFoundError: Failed to execute 'transaction' on 'IDBDatabase': 
One of the specified object stores was not found.
```

## Cause

La base de données `QuietQuestDB` existait déjà (créée par d'autres parties de l'application comme `useQuietQuestEngine`, `usePersonalHistory`, etc.) avec la **version 1**, mais **sans** l'object store `sidebarPreferences`.

Le callback `onupgradeneeded` d'IndexedDB ne se déclenche que dans deux cas:
1. Lors de la première ouverture de la base (création)
2. Lors d'un changement de version

Comme la base existait déjà en version 1, le callback ne se déclenchait pas et l'object store `sidebarPreferences` n'était jamais créé.

## Solution

Incrémenter la version de la base de données de **1 à 2** pour forcer le déclenchement du callback `onupgradeneeded` et créer l'object store manquant.

### Changement appliqué

```javascript
// Avant
const DB_VERSION = 1;

// Après
const DB_VERSION = 2; // Incrémenté pour créer le nouvel object store
```

## Impact

- ✅ L'object store `sidebarPreferences` sera créé automatiquement
- ✅ Les autres object stores existants seront préservés
- ✅ Les données existantes ne seront pas affectées
- ✅ Les erreurs de console disparaîtront
- ✅ La persistance des préférences fonctionnera correctement

## Comportement après le fix

1. **Première visite après le fix**: 
   - IndexedDB détecte le changement de version (1 → 2)
   - Le callback `onupgradeneeded` se déclenche
   - L'object store `sidebarPreferences` est créé
   - Les préférences par défaut sont utilisées

2. **Visites suivantes**:
   - La base est déjà en version 2
   - L'object store existe
   - Les préférences sont chargées et sauvegardées normalement

## Vérification

Pour vérifier que le fix fonctionne:

1. Ouvrir les DevTools (F12)
2. Aller dans l'onglet "Application" (Chrome) ou "Storage" (Firefox)
3. Développer "IndexedDB" → "QuietQuestDB"
4. Vérifier que l'object store `sidebarPreferences` existe
5. Vérifier qu'il n'y a plus d'erreurs dans la console

## Notes techniques

### Pourquoi ne pas utiliser une base séparée?

On pourrait créer une base `SidebarDB` séparée, mais:
- ❌ Multiplication des bases de données
- ❌ Gestion plus complexe
- ❌ Pas de cohérence avec le reste de l'application

### Pourquoi incrémenter la version globale?

- ✅ Solution standard d'IndexedDB
- ✅ Garantit la création de l'object store
- ✅ Compatible avec les migrations futures
- ✅ Préserve les données existantes

### Compatibilité avec les autres modules

Les autres modules qui utilisent `QuietQuestDB` version 1 seront automatiquement migrés vers la version 2 sans perte de données. IndexedDB gère cela automatiquement.

## Prévention future

Pour éviter ce problème à l'avenir:

1. **Documenter la structure de la base**: Maintenir une liste des object stores
2. **Centraliser l'initialisation**: Créer un module unique pour gérer la base
3. **Versionning cohérent**: Coordonner les changements de version entre modules

## Fichiers modifiés

- `src/services/sidebar/sidebarStorage.js`: Version incrémentée de 1 à 2

## Date du fix

8 décembre 2025
