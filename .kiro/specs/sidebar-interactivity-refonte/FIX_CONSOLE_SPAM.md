# Fix: Modules Vides dans la Sidebar

**Problème Identifié:** Les modules de la sidebar restent vides même avec des données car les sections sont **fermées par défaut**.

## Diagnostic

Dans `src/hooks/useSidebar.js`, l'état initial des sections est:

```javascript
const [expandedSections, setExpandedSections] = useState(() => {
  return {
    actions: true,      // ✅ Ouvert
    metrics: true,      // ✅ Ouvert  
    quests: true,       // ✅ Ouvert
    sport: false,       // ❌ FERMÉ
    learning: false,    // ❌ FERMÉ
    books: false,       // ❌ FERMÉ
    finance: false,     // ❌ FERMÉ
    nutrition: false,   // ❌ N'EXISTE PAS (nouveau module)
    today: false,       // ❌ N'EXISTE PAS (nouveau module)
    // ...
  };
});
```

## Solutions

### Solution 1: Ouvrir les sections par défaut (RECOMMANDÉ)

Modifier `src/hooks/useSidebar.js` pour ouvrir les nouvelles sections:

```javascript
const [expandedSections, setExpandedSections] = useState(() => {
  return {
    // Nouvelles sections - OUVERTES par défaut
    actions: true,
    today: true,        // NOUVEAU
    metrics: true,
    quests: true,
    sport: true,        // CHANGÉ
    books: true,        // CHANGÉ (anciennement learning)
    finance: true,      // CHANGÉ
    nutrition: true,    // NOUVEAU
    
    // Anciennes sections supprimées - garder pour compatibilité
    learning: false,
    journal: false,
    focusSession: false,
    achievements: false,
    focusRPG: false,
    dailyGoals: false,
    notifications: false,
    weather: false,
    motivation: false,
    rewards: false,
    history: false,
    quickSettings: false,
    aiPredictions: false,
    globalStats: false,
  };
});
```

### Solution 2: Vérifier que l'utilisateur peut cliquer sur les headers

Les headers de section doivent être cliquables pour expand/collapse. Vérifier que `onToggle` fonctionne.

## Test Rapide

Ouvrir la console et taper:

```javascript
// Forcer l'ouverture de toutes les sections
const sections = ['actions', 'today', 'metrics', 'quests', 'sport', 'books', 'finance', 'nutrition'];
sections.forEach(section => {
  localStorage.setItem(`sidebar_section_${section}`, 'true');
});
location.reload();
```

## Implémentation du Fix

Fichier à modifier: `src/hooks/useSidebar.js`
