# Guide de Résolution - Modules Historiques Vides

## Problème Identifié
Les modules historiques (comme le module Garmin) affichent seulement les en-têtes sans le contenu des métriques.

## Diagnostic Étape par Étape

### 1. Vérification Immédiate
Ouvrez la console du navigateur (F12) et exécutez :
```javascript
// Copier-coller ce code dans la console
const garminModule = document.querySelector('.garmin-metrics-module');
console.log('Module trouvé:', !!garminModule);
if (garminModule) {
  const content = garminModule.querySelector('.sidebar-section-content');
  console.log('Contenu:', content?.innerHTML);
}
```

### 2. Test des Scripts de Diagnostic
Exécutez ces scripts dans la console pour diagnostiquer :

```javascript
// Script 1: Test des données
fetch('/test_garmin_data.js').then(r => r.text()).then(eval);

// Script 2: Test des props
fetch('/test_module_props.js').then(r => r.text()).then(eval);

// Script 3: Correction automatique
fetch('/fix_modules_display.js').then(r => r.text()).then(eval);
```

### 3. Vérifications Manuelles

#### A. Vérifier les Données dans useSidebarData
```javascript
// Dans la console React DevTools
// Chercher le composant SidebarPremium et vérifier ses props
```

#### B. Vérifier la Base de Données Garmin
```javascript
// Test IndexedDB
const request = indexedDB.open('GarminData');
request.onsuccess = () => {
  console.log('✅ DB Garmin accessible');
  request.result.close();
};
```

#### C. Vérifier les Props du Module
```javascript
// Inspecter les props passées au module Garmin
const garminModule = document.querySelector('.garmin-metrics-module');
// Utiliser React DevTools pour voir les props
```

## Solutions Possibles

### Solution 1: Redémarrage de l'Application
```bash
# Arrêter le serveur de développement
Ctrl+C

# Nettoyer le cache
npm run build
# ou
rm -rf node_modules/.cache

# Redémarrer
npm run dev
```

### Solution 2: Vider le Cache du Navigateur
1. Ouvrir les DevTools (F12)
2. Clic droit sur le bouton de rafraîchissement
3. Choisir "Vider le cache et actualiser"

### Solution 3: Vérifier les Données Garmin
```javascript
// Dans la console
localStorage.clear(); // Attention: efface toutes les données locales
// Puis recharger la page
```

### Solution 4: Forcer le Re-render
```javascript
// Dans la console
const modules = document.querySelectorAll('[data-module-type="historical"]');
modules.forEach(module => {
  module.style.display = 'none';
  setTimeout(() => module.style.display = '', 100);
});
```

## Codes d'État du Module

### États Normaux
- ✅ **Contenu affiché** : Le module fonctionne correctement
- 🔄 **Chargement** : "Chargement des métriques..."
- 📊 **Pas de données** : "Aucune donnée aujourd'hui"

### États d'Erreur
- ❌ **Erreur de chargement** : Message d'erreur spécifique
- ⚠️ **Module vide** : Seulement l'en-tête visible
- 🔧 **Composant non trouvé** : Erreur de mapping

## Vérifications Techniques

### 1. Structure des Données Attendues
```javascript
// Format attendu dans useSidebarData
{
  sport: {
    hasGarminData: true,
    todayMetrics: {
      calories: { active: 800, resting: 1400, total: 2200 },
      bodyBattery: 85,
      steps: 8500,
      heartRate: { resting: 58, max: 165, avg: 120 }
    }
  }
}
```

### 2. Vérifier le Mapping des Composants
```javascript
// Dans ModuleRenderer.jsx
const COMPONENT_MAP = {
  'GarminMetricsModule': GarminMetricsModule,
  // ...
};
```

### 3. Vérifier l'Alternance des Modules
```javascript
// Vérifier que le module est bien dans la liste d'alternance
const pattern = document.querySelectorAll('[data-module-type]');
console.log('Pattern d\'alternance:', Array.from(pattern).map(m => ({
  type: m.getAttribute('data-module-type'),
  position: m.getAttribute('data-module-position')
})));
```

## Actions de Correction

### Correction Immédiate
1. Ouvrir la console (F12)
2. Exécuter le script de correction :
```javascript
fetch('/fix_modules_display.js').then(r => r.text()).then(eval);
```

### Correction Manuelle
1. Vérifier que `useGarminData` fonctionne
2. Vérifier que `useSidebarData` charge les données
3. Vérifier que les props sont bien passées
4. Forcer un re-render si nécessaire

## Prochaines Étapes

Si le problème persiste après ces vérifications :

1. **Vérifier les logs de la console** pour des erreurs JavaScript
2. **Utiliser React DevTools** pour inspecter les props et l'état
3. **Vérifier la base de données IndexedDB** avec les DevTools
4. **Tester avec des données mock** pour isoler le problème

## Contact de Support

Si aucune de ces solutions ne fonctionne, fournir :
- Capture d'écran du problème
- Logs de la console
- Résultat des scripts de diagnostic
- Version du navigateur et système d'exploitation