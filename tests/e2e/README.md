# Tests E2E - Onglet Garmin

## Vue d'ensemble

Cette suite de tests E2E utilise **Playwright** pour valider les scénarios critiques et nominaux de l'onglet Garmin.

## Structure

```
tests/e2e/
├── README.md                    # Ce fichier
├── garmin-p0-critical.spec.js   # Tests P0 (critiques)
├── garmin-p1-nominal.spec.js    # Tests P1 (nominaux)
└── helpers/
    └── garmin-helpers.js        # Fonctions utilitaires
```

## Scénarios testés

### P0 - Critiques (Vitales)

1. **P0-1: Sync échec → mode dégradé → retry → succès**
   - Simule un échec réseau
   - Vérifie l'activation du mode dégradé
   - Teste le retry automatique
   - Valide la persistance des données

2. **P0-2: Import JSON corrompu → validation → rollback**
   - Tente d'importer un JSON invalide
   - Vérifie la validation des données
   - S'assure qu'aucun rollback ne corrompt les données existantes

3. **P0-3: Cache expiré → refetch → persist**
   - Simule l'expiration du cache
   - Vérifie le refetch automatique
   - Valide la persistance des nouvelles données

### P1 - Nominaux (Happy paths)

1. **P1-1: Sync réussie → navigation → cache hit → export PDF**
   - Synchronise les données
   - Navigue entre les dates
   - Vérifie l'utilisation du cache
   - Exporte un PDF

2. **P1-2: Forçage [J-7, J] → pagination → recherche**
   - Force une synchronisation sur 7 jours
   - Teste la pagination des activités
   - Valide la recherche textuelle

3. **P1-3: DebugPanel → export JSON → réimport**
   - Ouvre le DebugPanel via raccourci clavier
   - Exporte le diagnostic en JSON
   - (Réimportation à implémenter)

4. **P1-4: Auto-sync planifié → déclenchement → notification**
   - Configure l'auto-sync
   - Attend le déclenchement
   - Vérifie les notifications

## Exécution

### Prérequis

1. **Serveurs démarrés** :
   - Frontend : `npm run dev` (port 3001)
   - Backend Garmin : `cd garmin-server && node garmin-server.js` (port 3031)

   **Note** : Playwright peut démarrer automatiquement les serveurs via `webServer` dans `playwright.config.js`.

2. **Navigateurs installés** :
   ```bash
   npx playwright install chromium
   ```

### Commandes

```bash
# Exécuter tous les tests E2E
npm run test:e2e

# Exécuter avec l'UI interactive
npm run test:e2e:ui

# Exécuter en mode debug
npm run test:e2e:debug

# Afficher le rapport HTML
npm run test:e2e:report
```

### Exécution sélective

```bash
# Tests P0 uniquement
npx playwright test garmin-p0-critical

# Tests P1 uniquement
npx playwright test garmin-p1-nominal

# Un test spécifique
npx playwright test -g "P0-1"
```

## Configuration

La configuration se trouve dans `playwright.config.js` :

- **Base URL** : `http://localhost:3001`
- **Timeout** : 60s par test
- **Workers** : 1 (pour éviter les conflits IndexedDB)
- **Retries** : 2 en CI, 0 en local
- **Reporters** : HTML, JSON, List

## Helpers disponibles

Voir `helpers/garmin-helpers.js` pour la liste complète des fonctions utilitaires :

- `navigateToGarminTab(page)` : Navigue vers l'onglet Garmin
- `waitForGarminData(page)` : Attend le chargement des données
- `clickSyncButton(page)` : Clique sur le bouton de synchronisation
- `waitForSyncComplete(page)` : Attend la fin de la synchronisation
- `openDebugPanel(page)` : Ouvre le DebugPanel via Ctrl+Shift+D
- `clearIndexedDB(page)` : Nettoie IndexedDB
- `checkIndexedDBData(page, storeName)` : Vérifie la présence de données
- `waitForToast(page, message)` : Attend l'affichage d'un toast
- `forceSyncRange(page, startDate, endDate)` : Force une sync sur une plage
- `exportGarminData(page)` : Exporte les données en JSON

## Debugging

### Mode debug interactif

```bash
npm run test:e2e:debug
```

Ouvre Playwright Inspector pour :
- Voir l'état de la page en temps réel
- Exécuter les actions pas à pas
- Inspecter les sélecteurs

### Screenshots et vidéos

En cas d'échec, Playwright génère automatiquement :
- **Screenshots** : `test-results/`
- **Vidéos** : `test-results/`
- **Traces** : `test-results/` (ouvrir avec `npx playwright show-trace`)

### Logs

Les logs de Playwright sont visibles dans la console. Pour plus de détails :

```bash
DEBUG=pw:api npm run test:e2e
```

## Intégration CI

Pour intégrer dans une pipeline CI, ajouter dans `.github/workflows/e2e.yml` :

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Bonnes pratiques

1. **Isolation** : Chaque test nettoie IndexedDB avant de commencer
2. **Attentes** : Utiliser `waitFor*` plutôt que `waitForTimeout`
3. **Sélecteurs** : Préférer les sélecteurs textuels ou `data-testid`
4. **Robustesse** : Gérer les cas où les éléments peuvent ne pas exister
5. **Performance** : Limiter les `waitForTimeout` au strict nécessaire

## Maintenance

- **Ajouter un test** : Créer un nouveau fichier `.spec.js` ou ajouter dans un existant
- **Modifier les helpers** : Éditer `helpers/garmin-helpers.js`
- **Mettre à jour la config** : Modifier `playwright.config.js`

## Limitations actuelles

- Les tests nécessitent que les serveurs soient démarrés (ou configurés dans `webServer`)
- Certains tests peuvent nécessiter des données mockées
- La réimportation JSON n'est pas encore complètement testée
- L'auto-sync nécessite un timer mocké pour être testé rapidement

## Contribution

Lors de l'ajout de nouveaux tests :
1. Suivre la structure existante
2. Utiliser les helpers disponibles
3. Documenter les cas particuliers
4. S'assurer que les tests sont reproductibles


