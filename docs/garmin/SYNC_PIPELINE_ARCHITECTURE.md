# Architecture SyncPipelineRunner

## Analyse de `syncNow()` - Étapes identifiées

### Étapes principales (ordre d'exécution)

1. **validate** - Validation de la base de données
   - Vérifier que `dbReady` est true
   - Retourner erreur si IndexedDB non initialisé

2. **normalize** - Normalisation des options
   - Utiliser `SyncRangeService.buildSyncOptions()`
   - Extraire forceRefresh, skipDelay, forceMode, includeToday, forceRange, etc.

3. **clearCache** - Nettoyage du cache frontend
   - Si `forceRefresh`, appeler `clearFrontendCache()`

4. **resolveRange** - Résolution de la plage forcée
   - Utiliser `SyncRangeService.resolveForcedRange()`
   - Retourner `resolvedRange`

5. **buildContext** - Construction du contexte orchestrateur
   - Construire `orchestratorContext` avec toutes les dépendances
   - Inclure fetcher, processResponse, serverResponseHandler, etc.

6. **executeOrchestrator** - Exécution de l'orchestrateur
   - Appeler `orchestrator.execute(orchestratorContext)`
   - Retourner `{ rangeInfo, cacheResult, result: orchestratorResult }`

7. **handleAdjustedRange** - Gestion des cas spéciaux (adjusted range)
   - Si `rangeMeta?.wasAdjusted`, faire requête réseau directe
   - Traiter la réponse et retourner (early return)

8. **handleCacheHit** - Gestion des cache hits
   - Si `cacheResult` existe, utiliser `CacheHitHandler`
   - Gérer les différents types (existingData, indexeddb, server)
   - Retourner true si cache hit traité (early return)

9. **processNetworkResponse** - Traitement de la réponse réseau
   - Extraire JSON de `orchestratorResult`
   - Appeler `processSyncResponse()`
   - Enregistrer l'historique
   - Mettre à jour `lastSourceMeta`

10. **handleError** - Gestion d'erreurs avec fallback
    - Si circuit breaker ouvert, essayer cache dégradé
    - Sinon, faire requête fallback directe
    - Gérer les erreurs réseau

11. **recordHistory** - Enregistrement de l'historique
    - Utiliser `SyncHistoryRecorder.record()`
    - Enregistrer métadonnées (forceMode, range, etc.)

12. **updateMetrics** - Mise à jour des métriques
    - Calculer durée de synchronisation
    - Appeler `recordUIMetric()` avec toutes les métriques

### Flux de décision

```
validate → normalize → clearCache → resolveRange → buildContext
    ↓
executeOrchestrator
    ↓
    ├─→ handleAdjustedRange (si wasAdjusted) → [RETURN]
    │
    ├─→ handleCacheHit (si cacheResult) → [RETURN]
    │
    └─→ processNetworkResponse
            ↓
        [SUCCESS] → recordHistory → updateMetrics
            ↓
        [ERROR] → handleError
                    ↓
                [FALLBACK SUCCESS] → recordHistory → updateMetrics
                    ↓
                [FALLBACK ERROR] → updateMetrics (avec erreur)
```

### Principes de design

1. **Séparation des responsabilités** : Chaque step a une responsabilité unique
2. **Testabilité** : Chaque step peut être testé isolément
3. **Observabilité** : Chaque step peut être instrumenté
4. **Extensibilité** : Facile d'ajouter de nouveaux steps
5. **Robustesse** : Gestion d'erreurs à chaque étape
6. **Performance** : Pas de surcharge, optimisé pour le navigateur

### Interface d'un Step

```javascript
class SyncStep {
  /**
   * Exécute l'étape du pipeline
   * @param {Object} context - Contexte partagé du pipeline
   * @param {Object} state - État actuel du pipeline
   * @returns {Promise<{state: Object, shouldContinue: boolean, earlyReturn?: any}>}
   */
  async execute(context, state) {
    // Logique de l'étape
    // Retourner { state: newState, shouldContinue: true/false, earlyReturn?: value }
  }

  /**
   * Nom de l'étape (pour logging/instrumentation)
   */
  getName() {
    return 'stepName';
  }

  /**
   * Dépendances requises (pour validation)
   */
  getRequiredDependencies() {
    return ['dependency1', 'dependency2'];
  }
}
```

### Contexte partagé

Le contexte contient toutes les dépendances nécessaires :
- Services (rangeService, cacheService, orchestrator, etc.)
- Callbacks (setStatus, setLoading, recordUIMetric, etc.)
- Données (dbReady, todayStr, frontendCache, etc.)
- Options (forceRefresh, forceMode, etc.)

### État du pipeline

L'état contient les données qui évoluent au cours du pipeline :
- normalizedOptions
- resolvedRange
- orchestratorContext
- rangeInfo
- cacheResult
- orchestratorResult
- effectiveStart/End
- etc.

