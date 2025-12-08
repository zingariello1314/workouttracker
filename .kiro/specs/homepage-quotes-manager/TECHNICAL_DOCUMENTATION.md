# Documentation Technique - Système de Gestion des Citations

## Architecture Globale

### Vue d'ensemble

Le système de gestion des citations suit une architecture en couches avec séparation claire des responsabilités:

```
┌─────────────────────────────────────────┐
│         Composants React (UI)           │
│  QuoteManager, QuoteList, QuoteCard...  │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│         Hooks React (Logic)             │
│  useQuotes, useQuoteDisplay, useExport  │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Services (Business Logic)          │
│  quotesService, exportService           │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Storage (Data Layer)               │
│  quotesStorage (IndexedDB + Cache)      │
└─────────────────────────────────────────┘
```

### Principes de Conception

1. **Séparation des Préoccupations**
   - UI: Composants React purs
   - Logic: Hooks React pour la gestion d'état
   - Business: Services pour la logique métier
   - Data: Couche de stockage isolée

2. **Performance**
   - Cache LRU pour accès < 1ms
   - Batch operations pour IndexedDB
   - Lazy loading des composants
   - Memoization des calculs coûteux

3. **Résilience**
   - Error boundaries pour isolation des erreurs
   - Fallback sur citation par défaut
   - Retry logic automatique
   - Validation stricte des données

4. **Maintenabilité**
   - Code modulaire et testable
   - Documentation JSDoc complète
   - Tests unitaires et d'intégration
   - Logging structuré

## Couche de Stockage

### QuotesStorage (`src/services/quotes/quotesStorage.js`)

#### Responsabilités
- Gestion de la base de données IndexedDB
- Cache LRU pour performances optimales
- Opérations CRUD sur les citations
- Gestion des paramètres utilisateur

#### Structure de la Base de Données

**Database:** `MomentumQuotes` (version 1)

**Object Stores:**

1. **quotes**
   - KeyPath: `id`
   - Indexes:
     - `order` (non-unique)
     - `isPinned` (non-unique)
     - `createdAt` (non-unique)

2. **settings**
   - KeyPath: `key`
   - Contient: `quoteSettings`

#### Schéma de Données

```typescript
interface Quote {
  id: string;              // UUID v4
  line1Fr: string;         // Ligne 1 français (max 500 chars)
  line2Fr: string;         // Ligne 2 français (max 500 chars)
  line3Fr: string;         // Ligne 3 français (max 500 chars)
  line1En: string;         // Ligne 1 anglais (max 500 chars)
  line2En: string;         // Ligne 2 anglais (max 500 chars)
  line3En: string;         // Ligne 3 anglais (max 500 chars)
  isPinned: boolean;       // Citation épinglée (3x poids)
  order: number;           // Ordre d'affichage
  createdAt: number;       // Timestamp de création
  updatedAt: number;       // Timestamp de dernière modification
}

interface Settings {
  mode: 'random' | 'fixed';  // Mode d'affichage
  fixedQuoteId: string | null; // ID de la citation fixe
  lastDisplayedId: string | null; // Dernière citation affichée
}
```

#### Cache LRU

```javascript
class QuoteCache {
  constructor(maxSize = 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.allQuotes = null;
    this.settings = null;
    this.lastSync = 0;
  }
}
```

**Stratégie:**
- Taille max: 1000 entrées
- Éviction: Least Recently Used (LRU)
- TTL pour allQuotes: 5 secondes
- Invalidation sur mutation

#### API Publique

```javascript
// Initialisation
await quotesStorage.init();

// Lecture
const quotes = await quotesStorage.getAllQuotes();
const quote = await quotesStorage.getQuote(id);
const settings = await quotesStorage.getSettings();

// Écriture
const newQuote = await quotesStorage.addQuote(quoteData);
const updated = await quotesStorage.updateQuote(id, updates);
await quotesStorage.deleteQuote(id);
await quotesStorage.reorderQuotes(quoteIds);
const newSettings = await quotesStorage.updateSettings(updates);

// Utilitaires
quotesStorage.clearCache();
await quotesStorage.preloadCache();
const results = await quotesStorage.bulkAddQuotes(quotes);
```

## Couche Business Logic

### QuotesService (`src/services/quotes/quotesService.js`)

#### Responsabilités
- Algorithmes de sélection intelligents
- Validation des données
- Formatage pour affichage
- Statistiques et analytics

#### Algorithme de Sélection Aléatoire

```javascript
async selectRandomQuote(language) {
  // 1. Récupérer toutes les citations
  const quotes = await storage.getAllQuotes();
  
  // 2. Éviter la répétition immédiate
  const lastId = await getLastDisplayedId();
  const available = quotes.filter(q => q.id !== lastId);
  
  // 3. Sélection pondérée (pinned = 3x)
  const selected = weightedRandomSelect(available);
  
  // 4. Mettre à jour lastDisplayedId
  await updateLastDisplayedId(selected.id);
  
  return selected;
}
```

**Pondération:**
- Citation normale: poids = 1
- Citation épinglée: poids = 3
- Probabilité = poids / somme_des_poids

**Exemple:**
- 2 citations normales + 1 épinglée
- Pool: [normal1, normal2, pinned, pinned, pinned]
- Probabilités: 20%, 20%, 60%

#### Validation

```javascript
validateQuote(quoteData) {
  const errors = [];
  
  // Champs requis
  const required = ['line1Fr', 'line2Fr', 'line3Fr', 
                    'line1En', 'line2En', 'line3En'];
  required.forEach(field => {
    if (!quoteData[field] || quoteData[field].trim() === '') {
      errors.push(`${field} is required`);
    }
  });
  
  // Longueur max
  required.forEach(field => {
    if (quoteData[field]?.length > 500) {
      errors.push(`${field} exceeds 500 characters`);
    }
  });
  
  // Type isPinned
  if (quoteData.isPinned !== undefined && 
      typeof quoteData.isPinned !== 'boolean') {
    errors.push('isPinned must be a boolean');
  }
  
  return { valid: errors.length === 0, errors };
}
```

## Couche Hooks React

### useQuotes (`src/hooks/useQuotes.js`)

#### Responsabilités
- Gestion de l'état des citations
- Opérations CRUD avec gestion d'erreurs
- Synchronisation avec le stockage
- Refresh automatique

#### État Géré

```javascript
const [quotes, setQuotes] = useState([]);
const [settings, setSettings] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
```

#### API Retournée

```javascript
{
  // État
  quotes: Quote[],
  settings: Settings,
  loading: boolean,
  error: string | null,
  
  // Actions
  addQuote: (quoteData) => Promise<Result>,
  updateQuote: (id, updates) => Promise<Result>,
  deleteQuote: (id) => Promise<Result>,
  reorderQuotes: (quoteIds) => Promise<Result>,
  togglePin: (id) => Promise<Result>,
  updateSettings: (newSettings) => Promise<Result>,
  refresh: () => void
}
```

### useQuoteDisplay (`src/hooks/useQuoteDisplay.js`)

#### Responsabilités
- Sélection et affichage de la citation courante
- Auto-rotation (90 secondes)
- Changement sur interaction utilisateur
- Gestion du chargement initial

#### Fonctionnalités

**Auto-Rotation:**
```javascript
useEffect(() => {
  if (!enableAutoRotation) return;
  
  const timer = setInterval(() => {
    selectQuote();
  }, autoRotationInterval); // 90000ms
  
  return () => clearInterval(timer);
}, [enableAutoRotation, autoRotationInterval, selectQuote]);
```

**Interaction Utilisateur:**
```javascript
const handleInteraction = useCallback(() => {
  if (!enableInteractionRotation) return;
  
  // Changement immédiat (pas de debounce)
  refreshQuote();
}, [enableInteractionRotation, refreshQuote]);
```

**Chargement Seamless:**
```javascript
const isInitialLoadRef = useRef(true);

const selectQuote = useCallback(async () => {
  // Loading state uniquement au premier chargement
  if (isInitialLoadRef.current) {
    setLoading(true);
  }
  
  const quote = await quotesService.selectQuote(language);
  setCurrentQuote(quote);
  
  if (isInitialLoadRef.current) {
    setLoading(false);
    isInitialLoadRef.current = false;
  }
}, [language]);
```

## Couche UI

### Composants Principaux

#### QuoteManager
- Container principal
- Gestion de l'état local (modals, forms)
- Coordination des sous-composants
- Affichage des statuts d'action

#### QuoteList
- Affichage de la liste des citations
- Drag-and-drop pour réorganisation
- Délégation des actions (edit, delete, pin)

#### QuoteCard
- Affichage d'une citation individuelle
- Boutons d'action (edit, delete, pin)
- Indicateur visuel pour citations épinglées

#### AddQuoteForm / EditQuoteModal
- Formulaires de saisie
- Validation côté client
- Gestion des erreurs

#### ExportImportSection
- Export vers JSON
- Import avec prévisualisation
- Stratégies de fusion

### Error Boundary

```javascript
class QuotesErrorBoundary extends React.Component {
  state = {
    hasError: false,
    error: null,
    errorInfo: null,
    retryCount: 0
  };
  
  componentDidCatch(error, errorInfo) {
    log.error('Quotes system error', { error, errorInfo });
    this.setState({ error, errorInfo });
  }
  
  handleRetry = () => {
    this.setState(prev => ({
      hasError: false,
      retryCount: prev.retryCount + 1
    }));
  };
}
```

## Export / Import

### Format d'Export

```json
{
  "version": "1.0",
  "exportDate": "2025-12-07T10:30:00.000Z",
  "appName": "Momentum Quotes",
  "quotes": [
    {
      "id": "uuid-1",
      "line1Fr": "N'attends rien,",
      "line2Fr": "Apprécie",
      "line3Fr": "tout.",
      "line1En": "Expect nothing,",
      "line2En": "Appreciate",
      "line3En": "everything.",
      "isPinned": true,
      "order": 0,
      "createdAt": 1701950400000,
      "updatedAt": 1701950400000
    }
  ],
  "settings": {
    "mode": "random",
    "fixedQuoteId": null,
    "lastDisplayedId": "uuid-1"
  },
  "metadata": {
    "totalQuotes": 1,
    "pinnedQuotes": 1,
    "exportSize": 1234
  }
}
```

### Stratégies d'Import

**Merge (Fusion):**
- Conserve les citations existantes
- Ajoute les nouvelles citations
- Évite les doublons par ID
- Préserve les paramètres actuels

**Replace (Remplacement):**
- Supprime toutes les citations existantes
- Importe toutes les nouvelles citations
- Remplace les paramètres
- Réinitialise l'ordre

## Performance

### Métriques Cibles

- **Chargement initial:** < 100ms
- **Accès cache:** < 1ms
- **Opération CRUD:** < 50ms
- **Export/Import:** < 500ms (pour 100 citations)
- **Changement de citation:** < 16ms (60 FPS)

### Optimisations Appliquées

1. **Cache LRU**
   - Évite les accès répétés à IndexedDB
   - Invalidation intelligente
   - TTL configurable

2. **Batch Operations**
   - Reorder multiple citations en une transaction
   - Bulk import optimisé

3. **Lazy Loading**
   - Composants chargés à la demande
   - Code splitting automatique

4. **Memoization**
   - useCallback pour fonctions stables
   - useMemo pour calculs coûteux

## Tests

### Couverture

- **Services:** 95%+ de couverture
- **Hooks:** 90%+ de couverture
- **Composants:** Tests d'intégration

### Types de Tests

**Unit Tests:**
- Validation des données
- Algorithmes de sélection
- Formatage et transformation

**Integration Tests:**
- Hooks avec storage
- Composants avec hooks
- Export/Import end-to-end

**Performance Tests:**
- Benchmarks de cache
- Stress tests (1000+ citations)
- Memory leak detection

### Exécution

```bash
# Tous les tests
npm test

# Tests spécifiques
npm test quotes

# Avec couverture
npm test -- --coverage

# Mode watch
npm test -- --watch
```

## Logging

### Niveaux

- **ERROR:** Erreurs critiques
- **WARN:** Avertissements
- **INFO:** Informations importantes
- **DEBUG:** Détails de débogage

### Format

```javascript
log.info('Quote selected', { 
  id: quote.id, 
  isPinned: quote.isPinned,
  mode: settings.mode 
});
```

## Migration et Versioning

### Schéma de Version

Format: `MAJOR.MINOR.PATCH`

- **MAJOR:** Changements incompatibles
- **MINOR:** Nouvelles fonctionnalités compatibles
- **PATCH:** Corrections de bugs

### Stratégie de Migration

```javascript
async function migrateData(currentVersion, targetVersion) {
  if (currentVersion < 2) {
    await migrateV1toV2();
  }
  if (currentVersion < 3) {
    await migrateV2toV3();
  }
  // ...
}
```

## Sécurité

### Validation

- Tous les inputs utilisateur sont validés
- Longueur max strictement appliquée
- Sanitization des données avant stockage

### XSS Prevention

- Pas de `dangerouslySetInnerHTML`
- Échappement automatique par React
- Validation des URLs dans les exports

### Data Integrity

- Checksums pour les exports
- Validation de schéma à l'import
- Transactions atomiques

## Dépannage

### Problèmes Courants

**Citations ne se chargent pas:**
```javascript
// Vérifier IndexedDB
const db = await indexedDB.open('MomentumQuotes');
console.log(db.objectStoreNames);

// Vider le cache
quotesStorage.clearCache();
```

**Performance dégradée:**
```javascript
// Vérifier la taille du cache
console.log(quotesStorage.cache.cache.size);

// Précharger le cache
await quotesStorage.preloadCache();
```

**Erreurs d'import:**
```javascript
// Valider le fichier
const data = JSON.parse(fileContent);
console.log(data.version, data.quotes.length);
```

## Roadmap

### Version 1.1 (Q1 2026)
- [ ] Catégories de citations
- [ ] Recherche et filtres
- [ ] Thèmes visuels personnalisés

### Version 1.2 (Q2 2026)
- [ ] Synchronisation cloud
- [ ] Partage de citations
- [ ] Import depuis sources externes

### Version 2.0 (Q3 2026)
- [ ] Citations multimédia (images, vidéos)
- [ ] Planification temporelle
- [ ] Analytics avancés

---

**Version:** 1.0  
**Dernière mise à jour:** 7 décembre 2025  
**Mainteneur:** Équipe Momentum
