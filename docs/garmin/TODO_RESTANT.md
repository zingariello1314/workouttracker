# TODO Restant - Onglet Garmin

> **Date de mise à jour** : Analyse basée sur `ANALYSE_DETAILLEE_ONGLET_GARMIN.md` (Phase 8 complétée)  
> **Statut global** : ~95% des tâches prioritaires terminées

---

## 📊 Vue d'ensemble

D'après l'analyse détaillée, **toutes les tâches de priorité Haute et Moyenne sont terminées** ✅. Il reste uniquement **3 items de priorité Basse** à traiter, qui sont des optimisations non-critiques.

---

## ✅ Tâches terminées (Phase 8)

### Priorité Haute (100% complété)
1. ✅ Refactor structure `GarminTab` (Container/View pattern)
2. ✅ Remplacement `window.alert/confirm` par `ConfirmDialog` + `Toast`
3. ✅ Stabilisation chaîne dérivés/exports (`useGarminDerivedDataset`)
4. ✅ Renforcement résilience & mode dégradé (`DegradedModePolicy`)
5. ✅ Tests E2E critiques (Playwright, scénarios P0/P1)

### Priorité Moyenne (100% complété)
6. ✅ Allègement `syncNow()` et modularisation (`SyncPipelineRunner`)
7. ✅ Optimisation charts & rendu conditionnel (`useLazyChart`, `useChartData`)
8. ✅ Performance Activities & timeline (virtualisation)
9. ✅ Renforcement IndexedDB & cache (SWR, maintenance automatique)
10. ✅ Extensibilité télémétrie & DebugPanel
11. ✅ Traitement off-thread & préchargements (Web Worker)
12. ✅ Offline & exports (Service Worker, compression JSON)
13. ✅ Synchronisation AutoSync (scheduler, historique)
14. ✅ Documentation & décisions (ADR, Performance Budget, Runbook, Testing Strategy)

---

## 🔄 Tâches restantes (Priorité Basse)

### 15. Optimisation hooks utilitaires ⚠️ **PARTIELLEMENT FAIT**

**État actuel** :
- ✅ Tests Vitest existent déjà pour `useFocusTrap` et `useKeyboardShortcut`
- ⚠️ `useKeyboardShortcut` utilise déjà `useMemo` pour normaliser les shortcuts, mais pourrait être optimisé davantage
- ❌ Pas de fichier `constants/keyboard.js` pour mutualiser les options

**À faire** :
1. **Créer `src/components/tabs/GarminTab/constants/keyboard.js`** :
   ```js
   // Définitions centralisées des raccourcis clavier
   export const KEYBOARD_SHORTCUTS = {
     DEBUG_PANEL: {
       key: 'd',
       ctrlKey: true,
       shiftKey: true,
       description: 'Ouvrir ou fermer le panneau de diagnostic Garmin'
     },
     // ... autres raccourcis
   };
   
   export const KEYBOARD_OPTIONS = {
     DEFAULT: { enabled: true, allowInInputs: false },
     ALLOW_IN_INPUTS: { enabled: true, allowInInputs: true }
   };
   ```

2. **Optimiser `useKeyboardShortcut`** :
   - Ajouter `useCallback` pour le handler `handleKeyDown` (évite recréation à chaque render)
   - Vérifier si le hook est appelé plusieurs fois dans le même composant (actuellement 1 seule fois dans `GarminTabContainer`)
   - Si besoin, créer un hook wrapper `useGarminKeyboardShortcuts` qui centralise tous les raccourcis Garmin

3. **Utiliser les constantes dans `GarminTabContainer`** :
   ```js
   import { KEYBOARD_SHORTCUTS, KEYBOARD_OPTIONS } from '../constants/keyboard';
   
   useKeyboardShortcut(
     [{
       ...KEYBOARD_SHORTCUTS.DEBUG_PANEL,
       handler: () => handleToggleDebugPanel(null, 'shortcut')
     }],
     KEYBOARD_OPTIONS.DEFAULT
   );
   ```

**Impact estimé** : Faible (optimisation mineure, code déjà performant)

---

### 16. SSR readiness ⚠️ **PARTIELLEMENT FAIT**

**État actuel** :
- ✅ Vérifications `typeof window` existent déjà dans plusieurs fichiers (`telemetryEvents.js`, `CacheCoordinator.js`, `garminSyncFetch.js`, etc.)
- ❌ Pas de helper centralisé `isBrowser.js`
- ❌ Pas de fallbacks no-op pour instrumentation côté SSR/tests

**À faire** :
1. **Créer `src/utils/isBrowser.js`** :
   ```js
   /**
    * Vérifie si le code s'exécute dans un environnement navigateur
    * @returns {boolean}
    */
   export const isBrowser = () => {
     return typeof window !== 'undefined' && 
            typeof document !== 'undefined' && 
            typeof navigator !== 'undefined';
   };
   
   /**
    * Accès sécurisé à window avec fallback
    * @returns {Window|{}}
    */
   export const getWindow = () => (typeof window !== 'undefined' ? window : {});
   
   /**
    * Accès sécurisé à document avec fallback
    * @returns {Document|{}}
    */
   export const getDocument = () => (typeof document !== 'undefined' ? document : {});
   
   /**
    * Accès sécurisé à navigator avec fallback
    * @returns {Navigator|{}}
    */
   export const getNavigator = () => (typeof navigator !== 'undefined' ? navigator : {});
   ```

2. **Migrer les vérifications existantes** :
   - Remplacer `typeof window !== 'undefined'` par `isBrowser()` dans :
     - `src/components/tabs/GarminTab/services/cache/SWRCacheAdapter.js`
     - `src/components/tabs/GarminTab/services/cache/CacheCoordinator.js`
     - `src/components/tabs/GarminTab/hooks/garminSyncFetch.js`
     - `src/components/tabs/GarminTab/hooks/useGarminSyncActions.js`
     - `src/components/tabs/GarminTab/components/PDFExport.jsx`
     - `src/components/tabs/GarminTab/components/GarminTabContainer.jsx`

3. **Créer fallbacks no-op pour instrumentation** :
   - Dans `TelemetryCoordinator.js` : si `!isBrowser()`, retourner des fonctions no-op
   - Dans `uiMetricsStore.js` : si `!isBrowser()`, utiliser un store mock
   - Dans `useUIMetricsTelemetry.js` : si `!isBrowser()`, ne rien faire

**Impact estimé** : Moyen (améliore la compatibilité SSR/tests, mais l'app est actuellement client-side uniquement)

---

### 17. Évolutions architecture données 🔮 **ÉVALUATION FUTURE**

**État actuel** :
- ✅ Architecture actuelle fonctionne bien (CacheCoordinator custom)
- ✅ ADR-003 documente la décision de ne pas utiliser React Query/SWR pour l'instant
- ❌ Pas d'évaluation formelle de migration partielle

**À faire** (recommandation : Phase 9+) :
1. **Évaluer migration partielle vers React Query/SWR** :
   - Analyser les bénéfices/coûts d'une migration partielle (uniquement cache réseau)
   - Créer un POC pour comparer performance/maintenabilité
   - Documenter les résultats dans un ADR (ADR-008)

2. **Étudier agrégation server-side des métriques** :
   - Évaluer besoin réel (actuellement single-user app)
   - Si multi-users prévu : étudier pipeline Kafka/Redis
   - Documenter architecture proposée

**Impact estimé** : Faible (évaluation future, pas d'action immédiate requise)

---

## 📋 Plan d'action recommandé

### Phase 8.1 (1-2 semaines) - Optimisations finales

**Priorité** : Basse (améliorations non-critiques)

1. **Semaine 1** :
   - [ ] Créer `constants/keyboard.js` et migrer raccourcis
   - [ ] Optimiser `useKeyboardShortcut` avec `useCallback`
   - [ ] Tests unitaires pour vérifier optimisations

2. **Semaine 2** :
   - [ ] Créer `utils/isBrowser.js`
   - [ ] Migrer vérifications `typeof window` vers `isBrowser()`
   - [ ] Ajouter fallbacks no-op pour instrumentation
   - [ ] Tests SSR/tests pour valider compatibilité

### Phase 9 (Future) - Évaluation architecture

- [ ] Évaluer React Query/SWR (POC)
- [ ] Documenter résultats (ADR-008)
- [ ] Décider migration partielle ou non

---

## 📊 Métriques de complétion

| Catégorie | Complété | Restant | % |
|-----------|----------|---------|---|
| **Priorité Haute** | 5/5 | 0 | 100% |
| **Priorité Moyenne** | 9/9 | 0 | 100% |
| **Priorité Basse** | 0/3 | 3 | 0% |
| **TOTAL** | 14/17 | 3 | **82%** |

> **Note** : Les 3 items restants sont de priorité basse et n'impactent pas la fonctionnalité actuelle.

---

## 🎯 Conclusion

L'onglet Garmin est **production-ready** avec un niveau de qualité très élevé. Les 3 tâches restantes sont des optimisations non-critiques qui peuvent être traitées progressivement :

- **Item 15** : Optimisation mineure (mutualisation constantes)
- **Item 16** : Amélioration compatibilité SSR/tests (utile pour tests, mais app client-side)
- **Item 17** : Évaluation future (pas d'action immédiate)

**Recommandation** : Traiter les items 15 et 16 en Phase 8.1 si temps disponible, reporter l'item 17 à Phase 9 pour évaluation approfondie.

---

## 📝 Notes

- Tous les tests E2E sont en place et passent ✅
- Documentation complète (ADR, Performance Budget, Runbook, Testing Strategy) ✅
- Architecture solide et maintenable ✅
- Code prêt pour production ✅

**L'onglet Garmin est prêt pour utilisation en production !** 🚀

