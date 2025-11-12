# Testing Strategy - Onglet Garmin

> **Objectif** : Définir la stratégie de tests (unitaires, intégration, E2E) pour garantir la qualité et la maintenabilité de l'onglet Garmin.

---

## Principes Fondamentaux

### Pyramide de Tests

```
        /\
       /E2E\        ← 10% : Tests critiques utilisateur
      /------\
     /Integration\  ← 30% : Tests flux complets
    /------------\
   /   Unitaires   \ ← 60% : Tests composants/services isolés
  /----------------\
```

### Couverture Cible

- **Unitaires** : > 80% (composants critiques > 90%)
- **Intégration** : > 70% (flux critiques 100%)
- **E2E** : Scénarios critiques 100%

---

## Tests Unitaires

### Framework : Vitest

**Configuration** : `vitest.config.js`

```javascript
export default {
  testEnvironment: 'jsdom',
  setupFiles: ['./src/test/setup.js'],
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
    exclude: ['**/node_modules/**', '**/test/**']
  }
};
```

### Composants à Tester

#### Priorité Haute

1. **Hooks d'orchestration**
   - `useGarminSyncActions` : logique sync
   - `useGarminData` : gestion données
   - `useGarminSelectors` : sélecteurs dérivés
   - `useGarminChartSelectors` : sélecteurs charts
   - `useAutoSync` : planification auto-sync

2. **Services métier**
   - `SyncRangeService` : calcul ranges
   - `SyncCacheService` : gestion cache
   - `CacheCoordinator` : orchestration cache
   - `AutoSyncScheduler` : planification
   - `CircuitBreaker` : protection réseau

3. **Utilitaires**
   - `garminDataUtils` : IndexedDB
   - `garminDataLoad` : chargement
   - `garminDataSave` : sauvegarde
   - `garminRetryUtils` : retry
   - `telemetryEvents` : événements

#### Priorité Moyenne

4. **Composants UI critiques**
   - `SyncControls` : contrôles sync
   - `GarminTabContainer` : container principal
   - `AutoSyncHistoryView` : historique
   - `DebugPanel` : diagnostics

5. **Hooks utilitaires**
   - `useChartData` : données charts
   - `usePaginatedActivities` : pagination
   - `useLazyChart` : lazy loading
   - `useDebouncedPersist` : debounce

### Exemples de Tests

#### Test Hook

```javascript
// useGarminSyncActions.test.js
import { renderHook, waitFor } from '@testing-library/react';
import { useGarminSyncActions } from '../hooks/useGarminSyncActions';

describe('useGarminSyncActions', () => {
  it('should sync successfully', async () => {
    const { result } = renderHook(() => useGarminSyncActions());
    
    await waitFor(() => {
      expect(result.current.syncNow).toBeDefined();
    });
    
    await result.current.syncNow();
    
    expect(result.current.loading).toBe(false);
    expect(result.current.status.ok).toBe(true);
  });
});
```

#### Test Service

```javascript
// SyncRangeService.test.js
import { resolveForcedRange, buildSyncOptions } from '../services/sync/SyncRangeService';

describe('SyncRangeService', () => {
  it('should resolve forced range for today', () => {
    const range = resolveForcedRange('today');
    const today = new Date().toISOString().split('T')[0];
    
    expect(range.start).toBe(today);
    expect(range.end).toBe(today);
  });
  
  it('should build sync options correctly', () => {
    const options = buildSyncOptions({ start: '2024-01-01', end: '2024-01-31' });
    
    expect(options.startDate).toBe('2024-01-01');
    expect(options.endDate).toBe('2024-01-31');
    expect(options.forced).toBe(true);
  });
});
```

#### Test Utilitaire

```javascript
// garminDataUtils.test.js
import { openDB, DB_NAME, DB_VERSION } from '../hooks/garminDataUtils';

describe('garminDataUtils', () => {
  it('should open IndexedDB', async () => {
    const db = await openDB();
    
    expect(db).toBeDefined();
    expect(db.name).toBe(DB_NAME);
    expect(db.version).toBe(DB_VERSION);
  });
});
```

---

## Tests d'Intégration

### Framework : Vitest + Testing Library

**Configuration** : Tests avec contexte complet

### Scénarios à Tester

#### Priorité Haute

1. **Flux de synchronisation complet**
   - Déclenchement sync
   - Vérification cache
   - Appel API
   - Sauvegarde IndexedDB
   - Mise à jour UI

2. **Flux de chargement données**
   - Ouverture IndexedDB
   - Chargement données
   - Application sélecteurs
   - Rendu UI

3. **Flux de cache multi-niveaux**
   - Hit cache mémoire
   - Hit cache IndexedDB
   - Miss cache → fetch serveur
   - Mise à jour caches

4. **Flux AutoSync**
   - Déclenchement planifié
   - Enregistrement historique
   - Mise à jour UI
   - Annonces aria-live

#### Priorité Moyenne

5. **Flux export/import JSON**
   - Export données
   - Compression (si >1KB)
   - Import données
   - Décompression
   - Validation données

6. **Flux mode dégradé**
   - Timeout sync >30s
   - Activation mode dégradé
   - Utilisation cache local
   - Affichage alertes

### Exemples de Tests

```javascript
// sync.integration.test.js
import { render, screen, waitFor } from '@testing-library/react';
import { GarminProvider } from '../context/GarminContext';
import SyncControls from '../components/SyncControls';

describe('Sync Integration', () => {
  it('should complete full sync flow', async () => {
    render(
      <GarminProvider>
        <SyncControls />
      </GarminProvider>
    );
    
    const syncButton = screen.getByRole('button', { name: /synchroniser/i });
    fireEvent.click(syncButton);
    
    await waitFor(() => {
      expect(screen.getByText(/synchronisation réussie/i)).toBeInTheDocument();
    });
  });
});
```

---

## Tests E2E

### Framework : Playwright (recommandé) ou Cypress

**Configuration** : `playwright.config.js`

```javascript
export default {
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3001',
    headless: false, // Pour debug
  },
};
```

### Scénarios Critiques (P0)

1. **Synchronisation manuelle**
   - Ouvrir onglet Garmin
   - Cliquer "Synchroniser"
   - Vérifier données chargées
   - Vérifier charts affichés

2. **Synchronisation forcée**
   - Ouvrir menu "Forcer"
   - Sélectionner date
   - Vérifier sync réussie
   - Vérifier données mises à jour

3. **Navigation onglets**
   - Naviguer entre Dashboard/Charts/Activities
   - Vérifier chargement sections
   - Vérifier pas d'erreurs

4. **Export/Import JSON**
   - Exporter données
   - Vérifier fichier généré
   - Importer données
   - Vérifier données restaurées

5. **Mode dégradé**
   - Simuler timeout réseau
   - Vérifier mode dégradé activé
   - Vérifier cache utilisé
   - Vérifier alertes affichées

### Scénarios Importants (P1)

6. **AutoSync**
   - Configurer AutoSync
   - Attendre déclenchement
   - Vérifier historique
   - Vérifier annonces

7. **Accessibilité**
   - Navigation clavier
   - Screen reader
   - Focus trap
   - Raccourcis clavier

8. **Performance**
   - Chargement initial
   - Rendu charts
   - Scrolling activités
   - Mémoire

### Exemples de Tests

```javascript
// sync.e2e.test.js
import { test, expect } from '@playwright/test';

test('should sync successfully', async ({ page }) => {
  await page.goto('/garmin');
  
  // Attendre chargement initial
  await page.waitForSelector('[data-testid="sync-button"]');
  
  // Cliquer synchroniser
  await page.click('[data-testid="sync-button"]');
  
  // Attendre succès
  await page.waitForSelector('text=Synchronisation réussie', { timeout: 10000 });
  
  // Vérifier données chargées
  const charts = await page.locator('[data-testid="chart"]').count();
  expect(charts).toBeGreaterThan(0);
});
```

---

## Tests de Performance

### Framework : Vitest + Performance API

### Métriques à Tester

1. **Temps de rendu**
   - Rendu initial
   - Rendu charts
   - Rendu activités

2. **Temps de chargement**
   - Chargement données
   - Chargement IndexedDB
   - Chargement API

3. **Utilisation mémoire**
   - Heap size
   - Allocations
   - Fuites mémoire

### Exemples de Tests

```javascript
// performance.test.js
import { performance } from 'perf_hooks';

describe('Performance', () => {
  it('should render charts in <100ms', async () => {
    const start = performance.now();
    await renderCharts();
    const duration = performance.now() - start;
    
    expect(duration).toBeLessThan(100);
  });
});
```

---

## Tests d'Accessibilité

### Framework : @axe-core/react + jest-axe

### Scénarios à Tester

1. **ARIA labels**
   - Vérifier labels présents
   - Vérifier descriptions
   - Vérifier annonces

2. **Navigation clavier**
   - Tab order
   - Focus trap
   - Raccourcis clavier

3. **Screen reader**
   - Annonces aria-live
   - Descriptions sr-only
   - Landmarks

### Exemples de Tests

```javascript
// accessibility.test.js
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<GarminTab />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

---

## Stratégie de CI/CD

### Pipeline GitHub Actions

```yaml
name: Garmin Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:e2e
      - run: npm run test:coverage
```

### Critères de Merge

- ✅ Tous tests unitaires passent
- ✅ Tous tests intégration passent
- ✅ Tests E2E critiques passent
- ✅ Couverture > 80%
- ✅ Pas de régressions performance
- ✅ Pas de violations accessibilité

---

## Plan d'Implémentation

### Phase 1 (Semaine 1-2)

1. **Setup infrastructure**
   - Configuration Vitest
   - Configuration Playwright
   - Configuration coverage

2. **Tests unitaires prioritaires**
   - Hooks d'orchestration
   - Services métier
   - Utilitaires critiques

### Phase 2 (Semaine 3-4)

3. **Tests intégration**
   - Flux sync
   - Flux cache
   - Flux AutoSync

4. **Tests E2E critiques**
   - Sync manuelle
   - Sync forcée
   - Navigation

### Phase 3 (Semaine 5-6)

5. **Tests complémentaires**
   - Performance
   - Accessibilité
   - Edge cases

6. **CI/CD**
   - Pipeline GitHub Actions
   - Critères merge
   - Reporting

---

## Maintenance

### Revue Mensuelle

- Analyser couverture
- Identifier gaps
- Prioriser nouveaux tests
- Mettre à jour stratégie

### Mise à Jour Continue

- Ajouter tests nouveaux features
- Mettre à jour tests existants
- Supprimer tests obsolètes
- Optimiser performance tests

---

## Changelog

| Version | Date | Auteur | Changements |
|---------|------|--------|-------------|
| 1.0 | 2024-02-25 | Équipe Garmin | Création initiale avec stratégie complète |

---

## Références

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [Jest Axe](https://github.com/nickcolley/jest-axe)


