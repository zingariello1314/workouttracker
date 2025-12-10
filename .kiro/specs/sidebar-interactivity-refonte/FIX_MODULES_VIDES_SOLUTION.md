# Solution: Modules Sidebar Vides

## Problème
Les modules de la sidebar apparaissent vides même dépliés.

## Cause Racine
Le hook `useSidebarData` retourne probablement des valeurs par défaut vides ou nulles car:
1. Les hooks de données ne sont pas initialisés
2. L'utilisateur n'est pas authentifié
3. Les bases de données (IndexedDB, localStorage) sont vides
4. Les hooks retournent `undefined` au lieu de valeurs par défaut

## Solution

### 1. Ajouter des Valeurs Par Défaut Robustes

Modifier `useSidebarData.js` pour retourner des valeurs par défaut même si les données ne sont pas chargées:

```javascript
// Au lieu de:
const metrics = useMemo(() => ({
  xp: userData?.currentXP || 0,
  level: userData?.level || 1,
  streak,
  focus
}), [userData, streak, focus]);

// Utiliser:
const metrics = useMemo(() => ({
  xp: userData?.currentXP ?? 0,
  level: userData?.level ?? 1,
  streak: streak ?? 0,
  focus: focus ?? 0
}), [userData, streak, focus]);
```

### 2. Ajouter des Logs de Débogage

Ajouter des `console.log` pour tracer les données:

```javascript
useEffect(() => {
  console.log('[useSidebarData] Données chargées:', {
    metrics,
    quests: quests.length,
    sport,
    finance,
    nutrition,
    learning,
    today
  });
}, [metrics, quests, sport, finance, nutrition, learning, today]);
```

### 3. Gérer l'État de Chargement

Ne pas bloquer l'affichage pendant le chargement:

```javascript
// Retourner des données même si isLoading = true
return {
  metrics: metrics || { xp: 0, level: 1, streak: 0, focus: 0 },
  quests: quests || [],
  sport: sport || { weeklyWorkouts: 0, todayCalories: 0, todaySteps: 0, avgHeartRate: 72, hasGarminData: false },
  // ...
  isLoading
};
```

### 4. Vérifier l'Authentification

S'assurer que l'utilisateur est authentifié avant de charger les données:

```javascript
if (!isAuthenticated) {
  return {
    metrics: { xp: 0, level: 1, streak: 0, focus: 0 },
    quests: [],
    // ... valeurs par défaut
    isLoading: false,
    isAuthenticated: false
  };
}
```

## Test

1. Exécuter `node debug_sidebar_modules.js` pour voir les données mockées
2. Ouvrir la console du navigateur
3. Vérifier les logs de `useSidebarData`
4. Vérifier localStorage et IndexedDB

## Implémentation

Voir le fichier modifié: `src/hooks/useSidebarData.js`
