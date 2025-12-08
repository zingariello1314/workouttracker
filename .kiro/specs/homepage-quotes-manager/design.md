# Design Document - Gestionnaire de Citations Page d'Accueil

## Overview

Le système de gestion de citations est conçu pour être ultra-performant, robuste et extensible. Il utilise IndexedDB pour un stockage persistant optimisé, un cache en mémoire pour des accès instantanés, et une architecture modulaire pour faciliter la maintenance.

## Architecture

### Couches du Système

```
┌─────────────────────────────────────────┐
│         UI Components Layer             │
│  (HomePage, SettingsTab, QuoteManager)  │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│         Hooks Layer (React)             │
│  useQuotes, useQuoteDisplay, useExport  │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│      Service Layer (Business Logic)     │
│   quotesService, exportService          │
└──────────────────┬──────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│       Storage Layer (IndexedDB)         │
│      quotesStorage + Memory Cache       │
└─────────────────────────────────────────┘
```

### Principes de Design

1. **Performance First**: Cache en mémoire + IndexedDB pour des accès < 1ms
2. **Separation of Concerns**: Chaque couche a une responsabilité unique
3. **Immutability**: Données immuables pour éviter les bugs
4. **Error Resilience**: Gestion d'erreurs à chaque niveau
5. **Type Safety**: TypeScript/JSDoc pour la sécurité des types

## Components and Interfaces

### 1. Storage Layer (`src/services/quotes/quotesStorage.js`)

**Responsabilité**: Gestion de IndexedDB avec cache en mémoire

```javascript
// Structure de données
interface Quote {
  id: string;              // UUID v4
  line1Fr: string;         // Ligne 1 en français
  line2Fr: string;         // Ligne 2 en français
  line3Fr: string;         // Ligne 3 en français
  line1En: string;         // Ligne 1 en anglais
  line2En: string;         // Ligne 2 en anglais
  line3En: string;         // Ligne 3 en anglais
  isPinned: boolean;       // Citation épinglée
  order: number;           // Ordre dans la liste
  createdAt: number;       // Timestamp création
  updatedAt: number;       // Timestamp modification
}

interface QuoteSettings {
  mode: 'random' | 'fixed'; // Mode d'affichage
  fixedQuoteId: string | null; // ID de la citation fixe
  lastDisplayedId: string | null; // Dernière citation affichée
}

// API
class QuotesStorage {
  // Initialisation
  async init(): Promise<void>
  
  // CRUD Operations
  async getAllQuotes(): Promise<Quote[]>
  async getQuote(id: string): Promise<Quote | null>
  async addQuote(quote: Omit<Quote, 'id' | 'createdAt' | 'updatedAt'>): Promise<Quote>
  async updateQuote(id: string, updates: Partial<Quote>): Promise<Quote>
  async deleteQuote(id: string): Promise<void>
  async reorderQuotes(quoteIds: string[]): Promise<void>
  
  // Settings
  async getSettings(): Promise<QuoteSettings>
  async updateSettings(settings: Partial<QuoteSettings>): Promise<QuoteSettings>
  
  // Cache Management
  clearCache(): void
  preloadCache(): Promise<void>
}
```

**Optimisations**:
- Cache LRU en mémoire (Map) pour accès instantané
- Batch operations pour réduire les transactions IndexedDB
- Indexes sur `order` et `isPinned` pour queries rapides
- Compression des données si > 100 citations

### 2. Service Layer (`src/services/quotes/quotesService.js`)

**Responsabilité**: Logique métier et algorithmes

```javascript
class QuotesService {
  constructor(storage: QuotesStorage)
  
  // Quote Selection Algorithm
  async selectRandomQuote(language: 'fr' | 'en'): Promise<Quote>
  async selectFixedQuote(language: 'fr' | 'en'): Promise<Quote>
  
  // Smart Random Algorithm
  // - Évite la répétition immédiate
  // - Donne 3x plus de poids aux citations épinglées
  // - Utilise Fisher-Yates shuffle pour distribution uniforme
  
  // Validation
  validateQuote(quote: Partial<Quote>): ValidationResult
  
  // Default Quote
  getDefaultQuote(language: 'fr' | 'en'): Quote
}
```

**Algorithme de Sélection Aléatoire**:
```javascript
// Weighted Random Selection
function selectWeightedRandom(quotes, lastDisplayedId) {
  // 1. Filtrer la dernière citation affichée
  const available = quotes.filter(q => q.id !== lastDisplayedId);
  
  // 2. Créer un pool pondéré
  const pool = [];
  available.forEach(quote => {
    const weight = quote.isPinned ? 3 : 1;
    for (let i = 0; i < weight; i++) {
      pool.push(quote);
    }
  });
  
  // 3. Sélection aléatoire
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}
```

### 3. Export/Import Service (`src/services/quotes/exportService.js`)

**Responsabilité**: Export/Import JSON

```javascript
class ExportService {
  constructor(storage: QuotesStorage)
  
  // Export
  async exportToJSON(): Promise<string>
  downloadJSON(data: string, filename: string): void
  
  // Import
  async importFromJSON(jsonString: string): Promise<ImportResult>
  validateJSON(jsonString: string): ValidationResult
  
  // Merge Strategy
  async mergeQuotes(imported: Quote[], existing: Quote[]): Promise<Quote[]>
}

interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}
```

**Format JSON**:
```json
{
  "version": "1.0",
  "exportDate": "2025-12-07T10:30:00Z",
  "quotes": [
    {
      "id": "uuid-here",
      "line1Fr": "N'attends rien,",
      "line2Fr": "Apprécie",
      "line3Fr": "tout.",
      "line1En": "Expect nothing,",
      "line2En": "Appreciate",
      "line3En": "everything.",
      "isPinned": false,
      "order": 0,
      "createdAt": 1733572200000,
      "updatedAt": 1733572200000
    }
  ],
  "settings": {
    "mode": "random",
    "fixedQuoteId": null
  }
}
```

### 4. React Hooks

#### `useQuotes` Hook
```javascript
function useQuotes() {
  const [quotes, setQuotes] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // CRUD operations
  const addQuote = async (quote) => { ... }
  const updateQuote = async (id, updates) => { ... }
  const deleteQuote = async (id) => { ... }
  const reorderQuotes = async (quoteIds) => { ... }
  const togglePin = async (id) => { ... }
  
  // Settings
  const updateSettings = async (newSettings) => { ... }
  
  return {
    quotes,
    settings,
    loading,
    error,
    addQuote,
    updateQuote,
    deleteQuote,
    reorderQuotes,
    togglePin,
    updateSettings
  };
}
```

#### `useQuoteDisplay` Hook
```javascript
function useQuoteDisplay() {
  const { language } = useLanguage();
  const [currentQuote, setCurrentQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Sélectionne et affiche la citation appropriée
  useEffect(() => {
    selectAndDisplayQuote();
  }, [language]);
  
  return { currentQuote, loading, refreshQuote };
}
```

### 5. UI Components

#### `QuoteManager` Component (Settings)
```jsx
<QuoteManager>
  <ModeSelector />
  <QuoteList>
    <QuoteCard
      quote={quote}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onTogglePin={handleTogglePin}
      draggable
    />
  </QuoteList>
  <AddQuoteForm />
  <ExportImportSection />
</QuoteManager>
```

#### `QuoteDisplay` Component (HomePage)
```jsx
<QuoteDisplay>
  <h1>
    <span>{currentQuote.line1}</span>
    <span className="font-bold">{currentQuote.line2}</span>
    <span>{currentQuote.line3}</span>
  </h1>
</QuoteDisplay>
```

## Data Models

### IndexedDB Schema

```javascript
// Database: MomentumQuotes
// Version: 1

// Object Store: quotes
{
  keyPath: 'id',
  indexes: [
    { name: 'order', keyPath: 'order', unique: false },
    { name: 'isPinned', keyPath: 'isPinned', unique: false },
    { name: 'createdAt', keyPath: 'createdAt', unique: false }
  ]
}

// Object Store: settings
{
  keyPath: 'key',
  // Single record with key: 'quoteSettings'
}
```

### Memory Cache Structure

```javascript
class QuoteCache {
  private cache: Map<string, Quote>;
  private allQuotes: Quote[] | null;
  private settings: QuoteSettings | null;
  private lastSync: number;
  
  // LRU eviction si > 1000 citations
  private maxSize = 1000;
}
```

## Error Handling

### Error Types

```javascript
class QuoteError extends Error {
  constructor(code, message, details) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

// Error Codes
const ERROR_CODES = {
  DB_INIT_FAILED: 'DB_INIT_FAILED',
  QUOTE_NOT_FOUND: 'QUOTE_NOT_FOUND',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  IMPORT_FAILED: 'IMPORT_FAILED',
  EXPORT_FAILED: 'EXPORT_FAILED',
  CACHE_SYNC_FAILED: 'CACHE_SYNC_FAILED'
};
```

### Error Recovery Strategy

1. **IndexedDB Failure**: Fallback vers citation par défaut
2. **Cache Corruption**: Rebuild depuis IndexedDB
3. **Import Error**: Rollback transaction, afficher erreurs détaillées
4. **Validation Error**: Afficher messages clairs à l'utilisateur

## Testing Strategy

### Unit Tests
- Storage layer: CRUD operations, cache management
- Service layer: Algorithmes de sélection, validation
- Export/Import: Format JSON, merge strategy

### Integration Tests
- Flow complet: Add → Display → Edit → Delete
- Import/Export round-trip
- Mode switching (random ↔ fixed)

### Performance Tests
- Benchmark: 1000 citations en < 100ms
- Cache hit rate > 95%
- Memory usage < 10MB pour 1000 citations

## Performance Optimizations

### 1. Lazy Loading
- Charger seulement la citation courante au démarrage
- Preload autres citations en arrière-plan

### 2. Debouncing
- Debounce search/filter à 300ms
- Batch updates pour reorder

### 3. Virtual Scrolling
- Si > 50 citations, utiliser react-window

### 4. Memoization
- useMemo pour calculs coûteux
- React.memo pour composants purs

### 5. Web Workers (Future)
- Déplacer algorithmes lourds vers worker
- Export/Import en background

## Security Considerations

1. **Input Sanitization**: Échapper HTML dans les citations
2. **JSON Validation**: Valider structure avant import
3. **Size Limits**: Max 500 caractères par ligne
4. **Rate Limiting**: Max 100 citations

## Migration Strategy

### From LocalStorage (if exists)
```javascript
async function migrateFromLocalStorage() {
  const oldData = localStorage.getItem('quotes');
  if (oldData) {
    const quotes = JSON.parse(oldData);
    await quotesStorage.bulkAdd(quotes);
    localStorage.removeItem('quotes');
  }
}
```

## Future Enhancements

1. **Cloud Sync**: Synchronisation multi-device
2. **Categories**: Organiser par thèmes
3. **Sharing**: Partager citations via URL
4. **Analytics**: Statistiques d'affichage
5. **AI Suggestions**: Suggestions de citations basées sur l'humeur
