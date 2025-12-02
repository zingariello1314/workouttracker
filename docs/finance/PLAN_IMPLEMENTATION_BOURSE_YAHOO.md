# 📈 PLAN D'IMPLÉMENTATION - MODULE BOURSE AVEC YAHOO FINANCE

## 🎯 PRINCIPE FONDAMENTAL

Système hybride : **Saisie manuelle des investissements personnels** + **Yahoo Finance pour données live** = Portfolio professionnel avec calculs automatiques.

## 📋 ARCHITECTURE GÉNÉRALE

### Structure des Données

```javascript
{
  portfolio: [
    {
      id: 'uuid',
      entreprise: 'Apple Inc.',
      ticker: 'AAPL',
      secteur: 'Technology', // Auto-détecté Yahoo
      logo: 'url', // Auto Yahoo
      quantite: 50,
      prixEntree: 145.30,
      dateAchat: '2024-03-15',
      investissementTotal: 7265.00,
      // Données Yahoo (mises à jour auto)
      yahooData: {
        prixActuel: 189.25,
        variationJour: 2.1,
        volume: 45200000,
        capitalisation: 2800000000000,
        ma20: 185.40,
        ma50: 178.90,
        ma200: 168.20,
        volatilite30j: 23.4,
        peRatio: 28.5,
        dividendYield: 0.5
      },
      // Calculs auto
      calculs: {
        valeurPosition: 9462.50,
        plusValueEuro: 2197.50,
        plusValuePourcent: 30.2,
        poidsPortfolio: 12.5
      }
    }
  ]
}
```

## 🔧 PHASE 1 : STRUCTURE DE BASE (4h → 6h avec optimisations)

### 1.1 Composant Principal FinanceTab - Architecture Complète

**Fichier**: `src/components/tabs/FinanceTab.jsx`

**Implémentation Détaillée**:
```javascript
import React, { useState, useMemo, Suspense, lazy } from 'react';
import { useFinance } from '../../hooks/useFinance';

// Lazy loading pour performance (code splitting)
const BourseTab = lazy(() => import('../finance/bourse/BourseTab'));
const BudgetTab = lazy(() => import('../finance/budget/BudgetTab'));
const InvestissementsTab = lazy(() => import('../finance/investissements/InvestissementsTab'));
const SmartShoppingTab = lazy(() => import('../finance/smartShopping/SmartShoppingTab'));
const PlanificateurTab = lazy(() => import('../finance/planificateur/PlanificateurTab'));
const SyntheseTab = lazy(() => import('../finance/synthese/SyntheseTab'));
const TheorieRealiteTab = lazy(() => import('../finance/theorieRealite/TheorieRealiteTab'));

const FinanceTab = () => {
  const [activeSubTab, setActiveSubTab] = useState('bourse');
  const { portfolio, loading } = useFinance();

  const subTabs = useMemo(() => [
    { id: 'bourse', label: 'Bourse', icon: '📈', component: BourseTab },
    { id: 'budget', label: 'Budget Personnel', icon: '💰', component: BudgetTab },
    { id: 'investissements', label: 'Investissements Divers', icon: '🥇', component: InvestissementsTab },
    { id: 'smart-shopping', label: 'Smart Shopping', icon: '🛒', component: SmartShoppingTab },
    { id: 'planificateur', label: 'Planificateur', icon: '📅', component: PlanificateurTab },
    { id: 'synthese', label: 'Synthèse', icon: '📊', component: SyntheseTab },
    { id: 'theorie-realite', label: 'Théorie vs Réalité', icon: '📈', component: TheorieRealiteTab }
  ], []);

  const ActiveComponent = subTabs.find(tab => tab.id === activeSubTab)?.component;

  return (
    <div className="finance-tab-container min-h-[calc(100vh-140px)]">
      {/* Sidebar navigation */}
      <aside className="finance-sidebar">
        <nav className="sub-tabs-navigation">
          {subTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`sub-tab-button ${activeSubTab === tab.id ? 'active' : ''}`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content area */}
      <main className="finance-main-content">
        <Suspense fallback={<FinanceTabSkeleton />}>
          {ActiveComponent && <ActiveComponent />}
        </Suspense>
      </main>
    </div>
  );
};
```

**CSS Layout Optimisé**:
```css
.finance-tab-container {
  display: grid;
  grid-template-columns: 250px 1fr;
  gap: 20px;
  padding: 20px;
}

.finance-sidebar {
  position: sticky;
  top: 80px;
  height: fit-content;
  background: var(--cyber-dark);
  border-radius: 12px;
  padding: 16px;
}

.sub-tabs-navigation {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sub-tab-button {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  transition: all 0.2s;
  text-align: left;
}

.finance-main-content {
  min-height: calc(100vh - 140px);
  background: var(--cyber-dark);
  border-radius: 12px;
  padding: 24px;
}
```

### 1.2 Service Stockage - Architecture IndexedDB Avancée

**Fichier**: `src/services/financeStorage.js`

**Implémentation Complète avec IndexedDB**:
```javascript
import { openDB } from 'idb';

const DB_NAME = 'FinanceDB';
const DB_VERSION = 1;
const STORES = {
  PORTFOLIO: 'portfolio',
  YAHOO_CACHE: 'yahooCache',
  CALCULATIONS: 'calculations',
  HISTORY: 'history'
};

class FinanceStorage {
  constructor() {
    this.db = null;
    this.initPromise = this.initDB();
  }

  async initDB() {
    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Store Portfolio
        if (!db.objectStoreNames.contains(STORES.PORTFOLIO)) {
          const portfolioStore = db.createObjectStore(STORES.PORTFOLIO, {
            keyPath: 'id'
          });
          portfolioStore.createIndex('ticker', 'ticker', { unique: false });
          portfolioStore.createIndex('dateAchat', 'dateAchat', { unique: false });
        }

        // Store Yahoo Cache
        if (!db.objectStoreNames.contains(STORES.YAHOO_CACHE)) {
          const cacheStore = db.createObjectStore(STORES.YAHOO_CACHE, {
            keyPath: 'ticker'
          });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Store Calculations (memoization)
        if (!db.objectStoreNames.contains(STORES.CALCULATIONS)) {
          db.createObjectStore(STORES.CALCULATIONS, {
            keyPath: 'key'
          });
        }

        // Store History (audit trail)
        if (!db.objectStoreNames.contains(STORES.HISTORY)) {
          const historyStore = db.createObjectStore(STORES.HISTORY, {
            keyPath: 'id',
            autoIncrement: true
          });
          historyStore.createIndex('timestamp', 'timestamp', { unique: false });
          historyStore.createIndex('action', 'action', { unique: false });
        }
      }
    });
  }

  async loadPortfolio() {
    await this.initPromise;
    const tx = this.db.transaction(STORES.PORTFOLIO, 'readonly');
    const store = tx.objectStore(STORES.PORTFOLIO);
    return await store.getAll();
  }

  async savePortfolio(portfolio) {
    await this.initPromise;
    const tx = this.db.transaction(STORES.PORTFOLIO, 'readwrite');
    const store = tx.objectStore(STORES.PORTFOLIO);
    
    // Clear existing
    await store.clear();
    
    // Add all positions
    await Promise.all(portfolio.map(pos => store.put(pos)));
    
    // Log history
    await this.logHistory('PORTFOLIO_UPDATE', { count: portfolio.length });
    
    // Fallback LocalStorage
    localStorage.setItem('finance_portfolio_backup', JSON.stringify(portfolio));
  }

  async getYahooCache(ticker) {
    await this.initPromise;
    const tx = this.db.transaction(STORES.YAHOO_CACHE, 'readonly');
    const store = tx.objectStore(STORES.YAHOO_CACHE);
    const cached = await store.get(ticker);
    
    if (cached && Date.now() - cached.timestamp < 15 * 60 * 1000) {
      return cached.data;
    }
    
    return null;
  }

  async setYahooCache(ticker, data) {
    await this.initPromise;
    const tx = this.db.transaction(STORES.YAHOO_CACHE, 'readwrite');
    const store = tx.objectStore(STORES.YAHOO_CACHE);
    await store.put({
      ticker,
      data,
      timestamp: Date.now()
    });
  }

  async logHistory(action, details) {
    await this.initPromise;
    const tx = this.db.transaction(STORES.HISTORY, 'readwrite');
    const store = tx.objectStore(STORES.HISTORY);
    await store.add({
      action,
      details,
      timestamp: Date.now()
    });
  }

  // Backup automatique
  async createBackup() {
    const portfolio = await this.loadPortfolio();
    const backup = {
      version: DB_VERSION,
      timestamp: Date.now(),
      portfolio
    };
    
    // Sauvegarder dans LocalStorage
    localStorage.setItem(`finance_backup_${Date.now()}`, JSON.stringify(backup));
    
    // Garder seulement 5 derniers backups
    const backups = Object.keys(localStorage)
      .filter(key => key.startsWith('finance_backup_'))
      .sort()
      .reverse()
      .slice(5);
    
    Object.keys(localStorage)
      .filter(key => key.startsWith('finance_backup_') && !backups.includes(key))
      .forEach(key => localStorage.removeItem(key));
  }

  // Restauration backup
  async restoreBackup(backupData) {
    await this.initPromise;
    const tx = this.db.transaction(STORES.PORTFOLIO, 'readwrite');
    const store = tx.objectStore(STORES.PORTFOLIO);
    await store.clear();
    await Promise.all(backupData.portfolio.map(pos => store.put(pos)));
  }
}

export const financeStorage = new FinanceStorage();
```

**Versioning Données**:
- Migration automatique entre versions
- Validation schéma avec Zod
- Rollback en cas d'erreur

### 1.3 Hook Finance Principal - Implémentation Complète

**Fichier**: `src/hooks/useFinance.js`

**Voir section "Hook useFinance - Gestion État Avancée" dans architecture technique ci-dessus pour implémentation complète avec**:
- Gestion état optimisée
- Auto-refresh intelligent
- Batch operations
- Error handling robuste
- Performance optimizations

## 🔗 PHASE 2 : INTÉGRATION YAHOO FINANCE (6h → 10h avec multi-APIs)

### 2.1 Service Yahoo Finance API - Multi-Sources avec Fallback

**Fichier**: `src/services/yahooFinanceService.js`

**Architecture Multi-APIs** (Voir section "Service Yahoo Finance - Implémentation Complète" ci-dessus)

**Endpoints utilisés par source**:

**Alpha Vantage**:
- `GLOBAL_QUOTE` : Prix temps réel
- `TIME_SERIES_DAILY` : Cours historiques
- `TIME_SERIES_INTRADAY` : Données intraday
- `OVERVIEW` : Ratios financiers (P/E, Market Cap, etc.)

**Finnhub**:
- `/quote` : Prix temps réel
- `/stock/candle` : Données graphiques
- `/company-profile2` : Profil entreprise
- `/news` : Actualités

**Polygon**:
- `/v2/aggs/ticker/{ticker}/prev` : Prix précédent
- `/v2/aggs/ticker/{ticker}/range` : Données historiques
- `/v3/reference/tickers/{ticker}` : Informations ticker

**Normalisation Multi-Sources**:
```javascript
function normalizeQuoteData(data, source) {
  const normalizers = {
    alphaVantage: (d) => ({
      prixActuel: parseFloat(d['05. price']),
      variationJour: parseFloat(d['10. change percent'].replace('%', '')),
      volume: parseInt(d['06. volume']),
      // ...
    }),
    finnhub: (d) => ({
      prixActuel: d.c,
      variationJour: d.dp,
      volume: d.v,
      // ...
    }),
    polygon: (d) => ({
      prixActuel: d.results[0].c,
      variationJour: ((d.results[0].c - d.results[0].o) / d.results[0].o) * 100,
      volume: d.results[0].v,
      // ...
    })
  };
  
  return normalizers[source](data);
}
```

### 2.2 Gestion Cache & Erreurs - Système Avancé

**Stratégie Cache Multi-Niveaux**:
1. **Cache Mémoire** (Map) : Données actives, TTL 1min
2. **Cache IndexedDB** : Données récentes, TTL 15min
3. **Cache LocalStorage** : Fallback offline, TTL 24h

**Circuit Breaker Pattern**:
```javascript
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failureCount = 0;
    this.threshold = threshold;
    this.timeout = timeout;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = Date.now();
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
    }
  }
}
```

**Retry avec Backoff Exponentiel Intelligent**:
```javascript
async function fetchWithRetry(url, options = {}) {
  const { maxRetries = 3, backoffBase = 1000, jitter = true } = options;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      
      // Backoff exponentiel avec jitter
      const baseDelay = backoffBase * Math.pow(2, attempt);
      const jitterValue = jitter ? Math.random() * 0.3 * baseDelay : 0;
      const delay = baseDelay + jitterValue;
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

**Mode Offline Intelligent**:
- Détection connexion (navigator.onLine)
- Queue requêtes si offline
- Sync automatique quand online
- Notification utilisateur état connexion

### 2.3 Hook Yahoo Finance - Implémentation Complète

**Fichier**: `src/hooks/useYahooFinance.js`

**Implémentation Avancée**:
```javascript
import { useState, useEffect, useCallback, useRef } from 'react';
import { yahooFinanceService } from '../services/yahooFinanceService';
import { useFinanceStorage } from './useFinanceStorage';

export const useYahooFinance = (ticker, options = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 60000,
    enabled = true
  } = options;

  const [quoteData, setQuoteData] = useState(null);
  const [historicalData, setHistoricalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  const intervalRef = useRef(null);
  const abortControllerRef = useRef(null);

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!ticker || !enabled) return;

    // Annuler requête précédente si en cours
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);

      // Fetch parallèle quote + historique
      const [quote, historical] = await Promise.all([
        yahooFinanceService.getQuoteData(ticker, { forceRefresh }),
        yahooFinanceService.getHistoricalData(ticker, '1mo', { forceRefresh })
      ]);

      setQuoteData(quote);
      setHistoricalData(historical);
      setLastUpdate(new Date());
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err);
        console.error('Yahoo Finance fetch error:', err);
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  }, [ticker, enabled]);

  // Chargement initial
  useEffect(() => {
    fetchData();
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !enabled) return;

    intervalRef.current = setInterval(() => {
      fetchData(false); // Utiliser cache si disponible
    }, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, enabled, fetchData]);

  const refresh = useCallback(() => {
    fetchData(true); // Force refresh
  }, [fetchData]);

  return {
    quoteData,
    historicalData,
    loading,
    error,
    lastUpdate,
    refresh
  };
};
```

## 📊 PHASE 3 : INTERFACE PORTFOLIO (8h → 12h avec optimisations)

### 3.1 Tableau Portfolio Principal - Performance Ultra-Optimisée

**Fichier**: `src/components/finance/bourse/PortfolioTable.jsx`

**Architecture Complète** (Voir section "Composant PortfolioTable - Performance Ultra-Optimisée" ci-dessus)

**Colonnes Détaillées avec Formatters**:
```javascript
const columns = [
  {
    Header: 'Entreprise',
    accessor: 'entreprise',
    Cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <img 
          src={row.original.logo} 
          alt="" 
          className="w-8 h-8 rounded" 
          loading="lazy"
          onError={(e) => e.target.src = '/placeholder-stock.png'}
        />
        <div>
          <div className="font-medium">{row.original.entreprise}</div>
          <div className="text-xs text-slate-400">{row.original.ticker}</div>
        </div>
      </div>
    ),
    sortType: 'alphanumeric',
    width: 200
  },
  {
    Header: 'Secteur',
    accessor: 'secteur',
    Filter: SelectColumnFilter,
    filter: 'includes'
  },
  {
    Header: 'Quantité',
    accessor: 'quantite',
    Cell: ({ value }) => formatNumber(value),
    sortType: 'number'
  },
  {
    Header: 'Prix Entrée',
    accessor: 'prixEntree',
    Cell: ({ value }) => formatCurrency(value),
    sortType: 'number'
  },
  {
    Header: 'Prix Actuel',
    accessor: 'yahooData.prixActuel',
    Cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span>{formatCurrency(row.original.yahooData.prixActuel)}</span>
        <PriceChangeIndicator 
          change={row.original.yahooData.variationJour} 
        />
      </div>
    ),
    sortType: 'number'
  },
  {
    Header: 'Valeur Position',
    accessor: 'calculs.valeurPosition',
    Cell: ({ value }) => formatCurrency(value),
    sortType: 'number'
  },
  {
    Header: 'Plus-Value',
    accessor: 'calculs.plusValueEuro',
    Cell: ({ row }) => (
      <div className={`flex items-center gap-2 ${
        row.original.calculs.plusValueEuro >= 0 ? 'text-green-400' : 'text-red-400'
      }`}>
        <span>{formatCurrency(row.original.calculs.plusValueEuro)}</span>
        <span className="text-xs">
          ({row.original.calculs.plusValuePourcent > 0 ? '+' : ''}
          {row.original.calculs.plusValuePourcent.toFixed(2)}%)
        </span>
      </div>
    ),
    sortType: 'number'
  },
  {
    Header: 'Signal',
    accessor: 'calculs.signal',
    Cell: ({ value }) => <TechnicalSignal signal={value} />,
    Filter: SelectColumnFilter,
    filter: 'equals'
  }
];
```

**Virtual Scrolling pour Performance**:
```javascript
import { useVirtual } from 'react-virtual';

const VirtualizedTable = ({ data, columns }) => {
  const parentRef = useRef();
  
  const rowVirtualizer = useVirtual({
    size: data.length,
    parentRef,
    estimateSize: useCallback(() => 60, []), // Hauteur ligne estimée
    overscan: 5 // Lignes supplémentaires à render
  });

  return (
    <div ref={parentRef} className="h-[600px] overflow-auto">
      <div style={{ height: `${rowVirtualizer.totalSize}px`, position: 'relative' }}>
        {rowVirtualizer.virtualItems.map(virtualRow => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`
            }}
          >
            <TableRow data={data[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
};
```

**Filtres Avancés**:
- Filtre secteur (multi-select)
- Filtre performance (slider range)
- Filtre signal technique (checkboxes)
- Filtre date achat (date range picker)
- Filtres combinables avec AND/OR

**Export CSV Optimisé**:
```javascript
function exportToCSV(portfolio) {
  const headers = ['Entreprise', 'Ticker', 'Quantité', 'Prix Entrée', 'Prix Actuel', 'Plus-Value €', 'Plus-Value %'];
  const rows = portfolio.map(pos => [
    pos.entreprise,
    pos.ticker,
    pos.quantite,
    pos.prixEntree,
    pos.yahooData.prixActuel,
    pos.calculs.plusValueEuro,
    pos.calculs.plusValuePourcent
  ]);
  
  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `portfolio_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}
```

### 3.2 Carte Action Enrichie

**Fichier**: `src/components/finance/bourse/StockCard.jsx`

**Affichage détaillé** (hover ou clic):
- Données personnelles (quantité, prix achat, date)
- Données Yahoo live (prix, variation, volume)
- Calculs automatiques (plus-value, valorisation)
- Moyennes mobiles
- Dividendes trackés
- Signaux techniques

### 3.3 Formulaire Ajout Position

**Fichier**: `src/components/finance/bourse/AddPositionForm.jsx`

**Champs**:
- Nom entreprise (avec auto-complétion Yahoo)
- Ticker (validation + auto-complétion)
- Quantité
- Prix d'achat
- Date achat

**Auto-complétion**:
- Recherche Yahoo Finance
- Suggestions intelligentes
- Détection automatique secteur/logo/devise

## 📈 PHASE 4 : CALCULS AUTOMATISÉS (4h → 8h avec optimisations)

### 4.1 Service Calculs - Optimisations Performance Avancées

**Fichier**: `src/services/financeCalculations.js`

**Implémentation Complète avec Web Workers** (Voir section "Service Calculs - Optimisations Performance" ci-dessus)

**Fonctions Détaillées avec Validation**:
```javascript
import { z } from 'zod';

// Schémas validation
const positionSchema = z.object({
  quantite: z.number().positive().finite(),
  prixEntree: z.number().positive().max(1000000),
  yahooData: z.object({
    prixActuel: z.number().positive().finite()
  })
});

// Calculer valorisation position avec validation
export function calculatePositionValue(quantite, prixActuel) {
  if (!Number.isFinite(quantite) || !Number.isFinite(prixActuel)) {
    throw new Error('Invalid input: quantite and prixActuel must be finite numbers');
  }
  
  const result = quantite * prixActuel;
  
  // Vérifier overflow
  if (!Number.isFinite(result)) {
    throw new Error('Calculation overflow');
  }
  
  return Math.round(result * 100) / 100; // Arrondi 2 décimales
}

// Calculer plus-value avec gestion cas limites
export function calculateGainLoss(prixAchat, prixActuel, quantite) {
  const validated = positionSchema.parse({
    quantite,
    prixEntree: prixAchat,
    yahooData: { prixActuel }
  });
  
  const gainLoss = (validated.yahooData.prixActuel - validated.prixEntree) * validated.quantite;
  return Math.round(gainLoss * 100) / 100;
}

// Calculer poids portfolio avec normalisation
export function calculatePortfolioWeight(valeurPosition, totalPortfolio) {
  if (totalPortfolio === 0) return 0;
  
  const weight = (valeurPosition / totalPortfolio) * 100;
  return Math.round(weight * 100) / 100; // 2 décimales
}

// Calculer moyennes mobiles optimisé (algorithme incrémental)
export function calculateMovingAverages(historicalData, periods) {
  if (!historicalData || historicalData.length < periods) {
    return { ma: null, data: [] };
  }
  
  // Trier par date (plus ancien → plus récent)
  const sorted = [...historicalData].sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  );
  
  const maValues = [];
  
  // Calcul initial (première fenêtre)
  let sum = sorted.slice(0, periods).reduce((acc, d) => acc + d.close, 0);
  maValues.push({
    date: sorted[periods - 1].date,
    value: sum / periods
  });
  
  // Calcul incrémental (O(n) au lieu de O(n²))
  for (let i = periods; i < sorted.length; i++) {
    sum = sum - sorted[i - periods].close + sorted[i].close;
    maValues.push({
      date: sorted[i].date,
      value: sum / periods
    });
  }
  
  return {
    ma: maValues[maValues.length - 1]?.value || null,
    data: maValues
  };
}

// Détecter signaux techniques avec confiance
export function detectTechnicalSignals(prix, ma50, ma200, previousPrix = null) {
  if (!ma50 || !ma200) {
    return { signal: 'NEUTRE', confidence: 0, reason: 'Données insuffisantes' };
  }
  
  const signals = [];
  let confidence = 0;
  
  // Signal Achat : Prix > MA50 > MA200
  if (prix > ma50 && ma50 > ma200) {
    signals.push('ACHAT');
    confidence += 40;
    
    // Bonus confiance si momentum positif
    if (previousPrix && prix > previousPrix) {
      confidence += 20;
    }
  }
  
  // Signal Vente : Prix < MA50 < MA200
  if (prix < ma50 && ma50 < ma200) {
    signals.push('VENTE');
    confidence += 40;
    
    // Bonus confiance si momentum négatif
    if (previousPrix && prix < previousPrix) {
      confidence += 20;
    }
  }
  
  // Croisement MA (signal fort)
  // À implémenter avec historique pour détecter croisements
  
  if (signals.length === 0) {
    return { signal: 'NEUTRE', confidence: 50, reason: 'Prix entre les MA' };
  }
  
  return {
    signal: signals[0],
    confidence: Math.min(confidence, 100),
    reason: signals.join(' + ')
  };
}

// Calcul batch optimisé avec Web Worker
export async function calculateBatchMetrics(positions) {
  if (positions.length > 50) {
    // Utiliser Web Worker pour gros volumes
    return new Promise((resolve, reject) => {
      const worker = new Worker('/workers/financeCalculations.worker.js');
      worker.postMessage({ type: 'BATCH_CALCULATE', positions });
      
      worker.onmessage = (e) => {
        if (e.data.error) {
          reject(new Error(e.data.error));
        } else {
          resolve(e.data.result);
        }
        worker.terminate();
      };
      
      worker.onerror = (error) => {
        reject(error);
        worker.terminate();
      };
    });
  }
  
  // Calcul synchrone pour petits volumes
  const totalPortfolio = positions.reduce((sum, pos) => {
    return sum + calculatePositionValue(pos.quantite, pos.yahooData?.prixActuel || pos.prixEntree);
  }, 0);
  
  return positions.map(pos => {
    const valeurPosition = calculatePositionValue(
      pos.quantite, 
      pos.yahooData?.prixActuel || pos.prixEntree
    );
    
    return {
      ...pos,
      calculs: {
        valeurPosition,
        plusValueEuro: calculateGainLoss(pos.prixEntree, pos.yahooData?.prixActuel || pos.prixEntree, pos.quantite),
        plusValuePourcent: pos.yahooData?.prixActuel 
          ? ((pos.yahooData.prixActuel - pos.prixEntree) / pos.prixEntree) * 100
          : 0,
        poidsPortfolio: calculatePortfolioWeight(valeurPosition, totalPortfolio),
        signal: pos.yahooData 
          ? detectTechnicalSignals(
              pos.yahooData.prixActuel,
              pos.yahooData.ma50,
              pos.yahooData.ma200
            )
          : { signal: 'NEUTRE', confidence: 0 }
      }
    };
  });
}
```

**Web Worker pour Calculs Lourds**:

**Fichier**: `public/workers/financeCalculations.worker.js`
```javascript
// Worker thread pour calculs non-bloquants
self.onmessage = function(e) {
  const { type, positions } = e.data;
  
  if (type === 'BATCH_CALCULATE') {
    try {
      // Importer fonctions calculs (doivent être pure, pas de dépendances React)
      const result = calculateBatchMetricsSync(positions);
      self.postMessage({ type: 'SUCCESS', result });
    } catch (error) {
      self.postMessage({ type: 'ERROR', error: error.message });
    }
  }
};

function calculateBatchMetricsSync(positions) {
  // Implémentation calculs synchrones (copie des fonctions)
  // ...
}
```

### 4.2 Indicateurs Visuels

**Fichier**: `src/components/finance/bourse/PerformanceIndicators.jsx`

**Statuts performance**:
- 🚀 Excellent (>+20%) - Vert intense
- ✅ Positif (+5% à +20%) - Vert clair
- ⚠️ Négatif (-5% à -20%) - Orange
- ❌ Très négatif (<-20%) - Rouge

**Signaux techniques**:
- 📈 Signal Achat (Prix > MA50 > MA200)
- 📉 Signal Vente (Prix < MA50 < MA200)
- ➡️ Neutre (Prix entre MA)
- 🔄 Retournement (Croisement MA)

## 🎨 PHASE 5 : GRAPHIQUES AVANCÉS (6h → 10h avec optimisations)

### 5.1 Graphique Action Individuelle - Bibliothèque Recharts Optimisée

**Fichier**: `src/components/finance/bourse/StockChart.jsx`

**Bibliothèque**: Recharts (meilleure performance que Chart.js pour React)

**Implémentation Complète**:
```javascript
import React, { useState, useMemo, useCallback } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine, Brush
} from 'recharts';
import { useYahooFinance } from '../../../hooks/useYahooFinance';

const StockChart = ({ ticker, dateAchat, prixEntree }) => {
  const [period, setPeriod] = useState('1m');
  const [showMA, setShowMA] = useState({ ma20: true, ma50: true, ma200: false });
  const [showVolume, setShowVolume] = useState(true);
  
  const { historicalData, loading } = useYahooFinance(ticker, {
    period,
    enabled: !!ticker
  });

  // Préparer données pour graphique
  const chartData = useMemo(() => {
    if (!historicalData) return [];
    
    return historicalData.map((point, index) => {
      const ma20 = calculateMA(historicalData.slice(Math.max(0, index - 19), index + 1), 20);
      const ma50 = calculateMA(historicalData.slice(Math.max(0, index - 49), index + 1), 50);
      const ma200 = calculateMA(historicalData.slice(Math.max(0, index - 199), index + 1), 200);
      
      return {
        date: point.date,
        prix: point.close,
        volume: point.volume,
        ma20: ma20 || null,
        ma50: ma50 || null,
        ma200: ma200 || null,
        // Marqueur prix achat
        isAchatDate: point.date === dateAchat
      };
    });
  }, [historicalData, dateAchat]);

  // Formatter tooltip personnalisé
  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    
    const data = payload[0].payload;
    
    return (
      <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-white">{data.date}</p>
        <div className="space-y-1 mt-2">
          <p className="text-blue-400">Prix: {formatCurrency(data.prix)}</p>
          {showMA.ma20 && data.ma20 && (
            <p className="text-yellow-400">MA20: {formatCurrency(data.ma20)}</p>
          )}
          {showMA.ma50 && data.ma50 && (
            <p className="text-orange-400">MA50: {formatCurrency(data.ma50)}</p>
          )}
          {showMA.ma200 && data.ma200 && (
            <p className="text-red-400">MA200: {formatCurrency(data.ma200)}</p>
          )}
          {showVolume && (
            <p className="text-slate-400">Volume: {formatNumber(data.volume)}</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="stock-chart-container">
      {/* Contrôles période et options */}
      <div className="chart-controls">
        <div className="period-selector">
          {['1j', '5j', '1m', '3m', '6m', '1a', 'Max'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={period === p ? 'active' : ''}
            >
              {p}
            </button>
          ))}
        </div>
        
        <div className="ma-toggle">
          <label><input type="checkbox" checked={showMA.ma20} onChange={(e) => setShowMA({...showMA, ma20: e.target.checked})} /> MA20</label>
          <label><input type="checkbox" checked={showMA.ma50} onChange={(e) => setShowMA({...showMA, ma50: e.target.checked})} /> MA50</label>
          <label><input type="checkbox" checked={showMA.ma200} onChange={(e) => setShowMA({...showMA, ma200: e.target.checked})} /> MA200</label>
        </div>
      </div>

      {/* Graphique principal */}
      <ResponsiveContainer width="100%" height={400}>
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPrix" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis 
            dataKey="date" 
            stroke="#9ca3af"
            tickFormatter={(value) => formatDate(value)}
          />
          <YAxis 
            stroke="#9ca3af"
            domain={['auto', 'auto']}
            tickFormatter={(value) => formatCurrency(value)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          
          {/* Ligne prix achat (référence) */}
          <ReferenceLine 
            y={prixEntree} 
            stroke="#10b981" 
            strokeDasharray="5 5"
            label={{ value: `Achat: ${formatCurrency(prixEntree)}`, position: "right" }}
          />
          
          {/* Zone prix */}
          <Area
            type="monotone"
            dataKey="prix"
            stroke="#3b82f6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorPrix)"
          />
          
          {/* Moyennes mobiles */}
          {showMA.ma20 && (
            <Line type="monotone" dataKey="ma20" stroke="#fbbf24" strokeWidth={1.5} dot={false} />
          )}
          {showMA.ma50 && (
            <Line type="monotone" dataKey="ma50" stroke="#f97316" strokeWidth={1.5} dot={false} />
          )}
          {showMA.ma200 && (
            <Line type="monotone" dataKey="ma200" stroke="#ef4444" strokeWidth={1.5} dot={false} />
          )}
          
          {/* Brush pour zoom */}
          <Brush dataKey="date" height={30} stroke="#6b7280" />
        </AreaChart>
      </ResponsiveContainer>

      {/* Graphique volume (sous le prix) */}
      {showVolume && (
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="date" stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            <Bar dataKey="volume" fill="#6b7280" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
```

**Optimisations Performance Graphiques**:
- Lazy loading données historiques (charger seulement période visible)
- Debounce zoom/pan
- Memoization données transformées
- Canvas rendering pour gros volumes (optionnel)
- Progressive rendering (afficher données progressivement)

### 5.2 Graphique Portfolio Global

**Fichier**: `src/components/finance/bourse/PortfolioChart.jsx`

- Évolution valeur totale portfolio
- Répartition sectorielle (pie chart)
- Performance vs benchmarks (CAC40, S&P500)

## 🧠 PHASE 6 : RECOMMANDATIONS IA (4h → 8h avec algorithmes avancés)

### 6.1 Algorithme Recommandations - Système Multi-Critères Sophistiqué

**Fichier**: `src/services/financeRecommendations.js`

**Architecture Algorithme**:
```javascript
class RecommendationEngine {
  constructor() {
    this.weights = {
      momentum: 0.25,
      fundamentals: 0.30,
      technical: 0.25,
      sectorial: 0.20
    };
  }

  // Analyse Momentum
  analyzeMomentum(position) {
    const { prixActuel, ma20, ma50, ma200, volume, volatilite30j } = position.yahooData;
    const { prixEntree } = position;
    
    let score = 0;
    let signals = [];
    
    // Prix vs MA (40% du score momentum)
    if (prixActuel > ma50 && ma50 > ma200) {
      score += 40;
      signals.push('Uptrend');
    } else if (prixActuel < ma50 && ma50 < ma200) {
      score -= 40;
      signals.push('Downtrend');
    }
    
    // Volume (30% du score momentum)
    const avgVolume = position.historicalData?.slice(-20).reduce((sum, d) => sum + d.volume, 0) / 20;
    if (volume > avgVolume * 1.5) {
      score += 30;
      signals.push('HighVolume');
    } else if (volume < avgVolume * 0.5) {
      score -= 20;
      signals.push('LowVolume');
    }
    
    // Volatilité (30% du score momentum)
    if (volatilite30j < 15) {
      score += 15; // Faible volatilité = stable
      signals.push('LowVolatility');
    } else if (volatilite30j > 30) {
      score -= 15; // Haute volatilité = risqué
      signals.push('HighVolatility');
    }
    
    return {
      score: Math.max(0, Math.min(100, score + 50)), // Normaliser 0-100
      signals,
      confidence: Math.abs(score) / 100
    };
  }

  // Analyse Fondamentaux
  analyzeFundamentals(position) {
    const { peRatio, dividendYield, marketCap } = position.yahooData;
    
    let score = 50; // Base neutre
    let signals = [];
    
    // P/E Ratio (40% du score fondamental)
    const sectorPE = this.getSectorAveragePE(position.secteur);
    if (peRatio && sectorPE) {
      if (peRatio < sectorPE * 0.8) {
        score += 20; // Sous-évalué
        signals.push('Undervalued');
      } else if (peRatio > sectorPE * 1.2) {
        score -= 20; // Sur-évalué
        signals.push('Overvalued');
      }
    }
    
    // Dividend Yield (30% du score fondamental)
    if (dividendYield > 3) {
      score += 15;
      signals.push('HighDividend');
    } else if (dividendYield < 1) {
      score -= 10;
      signals.push('LowDividend');
    }
    
    // Market Cap (30% du score fondamental)
    if (marketCap > 100000000000) { // >100B
      score += 15; // Large cap = stable
      signals.push('LargeCap');
    } else if (marketCap < 2000000000) { // <2B
      score -= 15; // Small cap = risqué
      signals.push('SmallCap');
    }
    
    return {
      score: Math.max(0, Math.min(100, score)),
      signals,
      confidence: 0.8
    };
  }

  // Analyse Technique
  analyzeTechnical(position) {
    const { prixActuel, ma20, ma50, ma200 } = position.yahooData;
    const rsi = this.calculateRSI(position.historicalData);
    const macd = this.calculateMACD(position.historicalData);
    
    let score = 50;
    let signals = [];
    
    // RSI (40% du score technique)
    if (rsi < 30) {
      score += 20; // Survente = opportunité
      signals.push('Oversold');
    } else if (rsi > 70) {
      score -= 20; // Surachat = danger
      signals.push('Overbought');
    }
    
    // MACD (30% du score technique)
    if (macd.histogram > 0 && macd.signal > macd.macd) {
      score += 15;
      signals.push('BullishMACD');
    } else if (macd.histogram < 0 && macd.signal < macd.macd) {
      score -= 15;
      signals.push('BearishMACD');
    }
    
    // Bollinger Bands (30% du score technique)
    const bb = this.calculateBollingerBands(position.historicalData);
    if (prixActuel < bb.lower) {
      score += 15; // Sous bande inférieure = opportunité
      signals.push('BelowLowerBB');
    } else if (prixActuel > bb.upper) {
      score -= 15; // Au-dessus bande supérieure = danger
      signals.push('AboveUpperBB');
    }
    
    return {
      score: Math.max(0, Math.min(100, score)),
      signals,
      confidence: 0.75
    };
  }

  // Analyse Sectorielle
  analyzeSectorial(position, portfolio) {
    const sectorPositions = portfolio.filter(p => p.secteur === position.secteur);
    const sectorPerformance = sectorPositions.reduce((sum, p) => 
      sum + (p.calculs.plusValuePourcent || 0), 0
    ) / sectorPositions.length;
    
    const positionPerformance = position.calculs.plusValuePourcent;
    const relativePerformance = positionPerformance - sectorPerformance;
    
    let score = 50;
    let signals = [];
    
    if (relativePerformance > 10) {
      score += 25; // Surperformance secteur
      signals.push('OutperformingSector');
    } else if (relativePerformance < -10) {
      score -= 25; // Sous-performance secteur
      signals.push('UnderperformingSector');
    }
    
    return {
      score: Math.max(0, Math.min(100, score)),
      signals,
      confidence: 0.7
    };
  }

  // Générer recommandation globale
  generateRecommendation(position, portfolio) {
    const momentum = this.analyzeMomentum(position);
    const fundamentals = this.analyzeFundamentals(position);
    const technical = this.analyzeTechnical(position);
    const sectorial = this.analyzeSectorial(position, portfolio);
    
    // Score global pondéré
    const globalScore = 
      momentum.score * this.weights.momentum +
      fundamentals.score * this.weights.fundamentals +
      technical.score * this.weights.technical +
      sectorial.score * this.weights.sectorial;
    
    // Confiance globale
    const globalConfidence = (
      momentum.confidence * this.weights.momentum +
      fundamentals.confidence * this.weights.fundamentals +
      technical.confidence * this.weights.technical +
      sectorial.confidence * this.weights.sectorial
    );
    
    // Générer recommandation
    let recommendation = 'CONSERVER';
    let priority = 'normal';
    let reasoning = [];
    
    // Logique décisionnelle
    if (globalScore >= 75 && position.calculs.plusValuePourcent < 20) {
      recommendation = 'RENFORCER_POSITION';
      priority = 'high';
      reasoning.push('Tous signaux positifs, position sous-exposée');
    } else if (position.calculs.plusValuePourcent > 20 && globalScore < 50) {
      recommendation = 'PRENDRE_PROFITS';
      priority = 'high';
      reasoning.push('Gains importants + signaux baissiers');
    } else if (globalScore < 40) {
      recommendation = 'SURVEILLANCE';
      priority = 'high';
      reasoning.push('Signaux négatifs multiples');
    } else if (globalScore >= 60 && globalScore < 75) {
      recommendation = 'CONSERVER';
      priority = 'normal';
      reasoning.push('Tendance stable, performance correcte');
    } else {
      recommendation = 'REÉVALUER';
      priority = 'normal';
      reasoning.push('Signaux mixtes, nécessite analyse approfondie');
    }
    
    return {
      recommendation,
      priority,
      globalScore: Math.round(globalScore),
      globalConfidence: Math.round(globalConfidence * 100),
      reasoning,
      details: {
        momentum,
        fundamentals,
        technical,
        sectorial
      }
    };
  }

  // Calculs indicateurs techniques
  calculateRSI(data, period = 14) {
    if (!data || data.length < period + 1) return 50;
    
    let gains = 0;
    let losses = 0;
    
    for (let i = data.length - period; i < data.length; i++) {
      const change = data[i].close - data[i - 1].close;
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }
    
    const avgGain = gains / period;
    const avgLoss = losses / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  calculateMACD(data) {
    // Implémentation MACD complète
    const ema12 = this.calculateEMA(data, 12);
    const ema26 = this.calculateEMA(data, 26);
    const macd = ema12 - ema26;
    const signal = this.calculateEMA(data.map((d, i) => ({ ...d, macd })), 9);
    
    return {
      macd,
      signal,
      histogram: macd - signal
    };
  }

  calculateBollingerBands(data, period = 20, stdDev = 2) {
    if (!data || data.length < period) return { upper: null, middle: null, lower: null };
    
    const recent = data.slice(-period);
    const sma = recent.reduce((sum, d) => sum + d.close, 0) / period;
    
    const variance = recent.reduce((sum, d) => sum + Math.pow(d.close - sma, 2), 0) / period;
    const std = Math.sqrt(variance);
    
    return {
      upper: sma + (stdDev * std),
      middle: sma,
      lower: sma - (stdDev * std)
    };
  }
}

export const recommendationEngine = new RecommendationEngine();
```

### 6.2 Score Global - Système Pondéré Avancé

**Calcul Détaillé**:
```javascript
function calculateGlobalScore(position, portfolio) {
  const engine = recommendationEngine;
  const recommendation = engine.generateRecommendation(position, portfolio);
  
  // Score final avec ajustements contextuels
  let finalScore = recommendation.globalScore;
  
  // Ajustement selon performance personnelle
  if (position.calculs.plusValuePourcent > 30) {
    finalScore += 10; // Bonus si excellente performance
  } else if (position.calculs.plusValuePourcent < -20) {
    finalScore -= 10; // Malus si très mauvaise performance
  }
  
  // Ajustement selon poids portfolio
  if (position.calculs.poidsPortfolio > 20) {
    finalScore -= 5; // Réduire score si trop concentré
  }
  
  return {
    ...recommendation,
    finalScore: Math.max(0, Math.min(100, finalScore))
  };
}
```

## 🔔 PHASE 7 : ALERTES INTELLIGENTES (3h → 6h avec système avancé)

### 7.1 Système Alertes - Architecture Complète

**Fichier**: `src/services/financeAlerts.js`

**Implémentation Détaillée**:
```javascript
import { financeStorage } from './financeStorage';

class FinanceAlertsService {
  constructor() {
    this.alerts = [];
    this.subscribers = new Set();
    this.checkInterval = null;
  }

  // Types alertes avec configuration
  async checkAlerts(portfolio) {
    const alerts = [];
    
    for (const position of portfolio) {
      // 1. Alertes seuils gains/pertes
      const gainLossAlerts = this.checkGainLossThresholds(position);
      alerts.push(...gainLossAlerts);
      
      // 2. Alertes techniques
      const technicalAlerts = this.checkTechnicalSignals(position);
      alerts.push(...technicalAlerts);
      
      // 3. Alertes fondamentales
      const fundamentalAlerts = await this.checkFundamentalEvents(position);
      alerts.push(...fundamentalAlerts);
      
      // 4. Alertes actualités
      const newsAlerts = await this.checkNewsAlerts(position);
      alerts.push(...newsAlerts);
    }
    
    // Trier par priorité
    alerts.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
    
    this.alerts = alerts;
    this.notifySubscribers();
    
    return alerts;
  }

  // Vérifier seuils gains/pertes
  checkGainLossThresholds(position) {
    const alerts = [];
    const { plusValuePourcent } = position.calculs;
    const { seuilsAlertes } = position.settings || {};
    
    if (!seuilsAlertes) return alerts;
    
    // Alerte gain
    if (seuilsAlertes.alerteGain && plusValuePourcent >= seuilsAlertes.alerteGain) {
      alerts.push({
        id: `gain_${position.id}_${Date.now()}`,
        type: 'GAIN_THRESHOLD',
        priority: 'high',
        ticker: position.ticker,
        message: `${position.ticker} : Objectif gain atteint (+${plusValuePourcent.toFixed(2)}%)`,
        action: 'PRENDRE_PROFITS',
        timestamp: Date.now()
      });
    }
    
    // Alerte perte
    if (seuilsAlertes.alertePerte && plusValuePourcent <= seuilsAlertes.alertePerte) {
      alerts.push({
        id: `perte_${position.id}_${Date.now()}`,
        type: 'LOSS_THRESHOLD',
        priority: 'critical',
        ticker: position.ticker,
        message: `${position.ticker} : Seuil perte atteint (${plusValuePourcent.toFixed(2)}%)`,
        action: 'SURVEILLANCE',
        timestamp: Date.now()
      });
    }
    
    return alerts;
  }

  // Vérifier signaux techniques
  checkTechnicalSignals(position) {
    const alerts = [];
    const { prixActuel, ma50, ma200, rsi } = position.yahooData;
    
    // Cassure MA50
    if (position.previousData?.yahooData?.ma50) {
      const wasAbove = position.previousData.yahooData.prixActuel > position.previousData.yahooData.ma50;
      const isAbove = prixActuel > ma50;
      
      if (wasAbove !== isAbove) {
        alerts.push({
          id: `ma50_break_${position.id}_${Date.now()}`,
          type: 'TECHNICAL_BREAK',
          priority: 'medium',
          ticker: position.ticker,
          message: `${position.ticker} : Cassure MA50 détectée`,
          action: isAbove ? 'SIGNAL_ACHAT' : 'SIGNAL_VENTE',
          timestamp: Date.now()
        });
      }
    }
    
    // RSI survente/surachat
    if (rsi) {
      if (rsi < 30) {
        alerts.push({
          id: `rsi_oversold_${position.id}_${Date.now()}`,
          type: 'RSI_OVERSOLD',
          priority: 'medium',
          ticker: position.ticker,
          message: `${position.ticker} : RSI survente (${rsi.toFixed(1)}) - Opportunité ?`,
          action: 'SIGNAL_ACHAT',
          timestamp: Date.now()
        });
      } else if (rsi > 70) {
        alerts.push({
          id: `rsi_overbought_${position.id}_${Date.now()}`,
          type: 'RSI_OVERBOUGHT',
          priority: 'medium',
          ticker: position.ticker,
          message: `${position.ticker} : RSI surachat (${rsi.toFixed(1)}) - Attention`,
          action: 'SIGNAL_VENTE',
          timestamp: Date.now()
        });
      }
    }
    
    return alerts;
  }

  // Vérifier événements fondamentaux
  async checkFundamentalEvents(position) {
    const alerts = [];
    
    // Vérifier résultats trimestriels (à implémenter avec API)
    // Vérifier dividendes (à implémenter avec API)
    // Vérifier splits (à implémenter avec API)
    
    return alerts;
  }

  // Vérifier actualités importantes
  async checkNewsAlerts(position) {
    const alerts = [];
    
    // Récupérer news récentes (via API)
    // Filtrer news importantes (impact prix)
    // Générer alertes si news critique
    
    return alerts;
  }

  // Monitoring continu
  startMonitoring(portfolio, interval = 60000) {
    this.checkInterval = setInterval(async () => {
      await this.checkAlerts(portfolio);
    }, interval);
  }

  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // Système abonnement (Observer pattern)
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers() {
    this.subscribers.forEach(callback => callback(this.alerts));
  }
}

export const financeAlertsService = new FinanceAlertsService();
```

**Composant Alertes UI**:

**Fichier**: `src/components/finance/bourse/AlertsPanel.jsx`
```javascript
import React, { useState, useEffect } from 'react';
import { financeAlertsService } from '../../../services/financeAlerts';

const AlertsPanel = ({ portfolio }) => {
  const [alerts, setAlerts] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Vérifier alertes initiales
    financeAlertsService.checkAlerts(portfolio).then(setAlerts);
    
    // S'abonner aux nouvelles alertes
    const unsubscribe = financeAlertsService.subscribe(setAlerts);
    
    // Démarrer monitoring
    financeAlertsService.startMonitoring(portfolio);
    
    return () => {
      unsubscribe();
      financeAlertsService.stopMonitoring();
    };
  }, [portfolio]);

  const criticalAlerts = alerts.filter(a => a.priority === 'critical');
  const highAlerts = alerts.filter(a => a.priority === 'high');
  const otherAlerts = alerts.filter(a => !['critical', 'high'].includes(a.priority));

  return (
    <div className="alerts-panel">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="alerts-button relative"
      >
        <span>🔔 Alertes</span>
        {alerts.length > 0 && (
          <span className="alerts-badge">{alerts.length}</span>
        )}
      </button>

      {isOpen && (
        <div className="alerts-dropdown">
          {criticalAlerts.length > 0 && (
            <div className="alerts-section critical">
              <h3>🚨 Critique ({criticalAlerts.length})</h3>
              {criticalAlerts.map(alert => (
                <AlertItem key={alert.id} alert={alert} />
              ))}
            </div>
          )}
          
          {highAlerts.length > 0 && (
            <div className="alerts-section high">
              <h3>⚠️ Important ({highAlerts.length})</h3>
              {highAlerts.map(alert => (
                <AlertItem key={alert.id} alert={alert} />
              ))}
            </div>
          )}
          
          {otherAlerts.length > 0 && (
            <div className="alerts-section">
              <h3>ℹ️ Autres ({otherAlerts.length})</h3>
              {otherAlerts.map(alert => (
                <AlertItem key={alert.id} alert={alert} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

**Notifications Navigateur**:
```javascript
// Demander permission notifications
async function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
}

// Envoyer notification
function sendNotification(alert) {
  if (Notification.permission === 'granted') {
    new Notification(alert.message, {
      icon: '/logo.png',
      badge: '/logo.png',
      tag: alert.id,
      requireInteraction: alert.priority === 'critical'
    });
  }
}
```

## 📱 PHASE 8 : OPTIMISATIONS & POLISH (3h → 6h avec optimisations avancées)

### 8.1 Responsive Design - Mobile-First Optimisé

**Breakpoints**:
```css
/* Mobile (< 640px) */
@media (max-width: 639px) {
  .finance-tab-container {
    grid-template-columns: 1fr;
  }
  
  .finance-sidebar {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60px;
    flex-direction: row;
    overflow-x: auto;
  }
  
  .portfolio-table {
    font-size: 12px;
  }
  
  .portfolio-table th,
  .portfolio-table td {
    padding: 8px 4px;
  }
}

/* Tablet (640px - 1024px) */
@media (min-width: 640px) and (max-width: 1023px) {
  .finance-tab-container {
    grid-template-columns: 200px 1fr;
  }
  
  .portfolio-table {
    font-size: 13px;
  }
}

/* Desktop (> 1024px) */
@media (min-width: 1024px) {
  .finance-tab-container {
    grid-template-columns: 250px 1fr;
  }
  
  .portfolio-table {
    font-size: 14px;
  }
}
```

**Swipe Gestures Mobile**:
```javascript
import { useSwipeable } from 'react-swipeable';

const SwipeableTable = ({ children }) => {
  const handlers = useSwipeable({
    onSwipedLeft: () => {/* Next page */},
    onSwipedRight: () => {/* Previous page */},
    trackMouse: true
  });
  
  return <div {...handlers}>{children}</div>;
};
```

### 8.2 Performance - Optimisations Avancées

**Lazy Loading Intelligent**:
```javascript
// Intersection Observer pour lazy load
const useLazyLoad = (ref, options = {}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, ...options }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, [ref]);
  
  return isVisible;
};
```

**Debounce Avancé avec Cancel**:
```javascript
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef();

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  return debouncedValue;
}
```

**Memoization Avancée avec Cache LRU**:
```javascript
import { useMemo } from 'react';
import LRUCache from 'lru-cache';

const calculationCache = new LRUCache({ max: 1000, ttl: 5 * 60 * 1000 });

function useMemoizedCalculation(positions) {
  return useMemo(() => {
    const cacheKey = JSON.stringify(positions.map(p => ({
      id: p.id,
      quantite: p.quantite,
      prix: p.yahooData?.prixActuel
    })));
    
    if (calculationCache.has(cacheKey)) {
      return calculationCache.get(cacheKey);
    }
    
    const result = calculateBatchMetrics(positions);
    calculationCache.set(cacheKey, result);
    return result;
  }, [positions]);
}
```

**Virtual Scrolling Optimisé** (Voir section Phase 3)

**Code Splitting Avancé**:
```javascript
// Route-based code splitting
const BourseTab = lazy(() => 
  import('../finance/bourse/BourseTab').then(module => ({
    default: module.BourseTab
  }))
);

// Component-based code splitting
const StockChart = lazy(() => import('./StockChart'));
```

### 8.3 UX - Expérience Utilisateur Premium

**Loading States Sophistiqués**:
```javascript
// Skeleton loaders avec shimmer effect
const PortfolioTableSkeleton = () => (
  <div className="animate-pulse space-y-2">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-16 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 rounded bg-[length:200%_100%] animate-shimmer" />
    ))}
  </div>
);

// Progressive loading (afficher données partielles)
const ProgressiveDataDisplay = ({ data, loading }) => {
  if (loading && data.length === 0) {
    return <PortfolioTableSkeleton />;
  }
  
  return (
    <>
      <PortfolioTable data={data} />
      {loading && (
        <div className="loading-overlay">
          <Spinner />
          <p>Mise à jour des données...</p>
        </div>
      )}
    </>
  );
};
```

**Transitions Fluides avec Framer Motion**:
```javascript
import { motion, AnimatePresence } from 'framer-motion';

const AnimatedTableRow = ({ position }) => (
  <motion.tr
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.2 }}
  >
    {/* Row content */}
  </motion.tr>
);
```

**Feedback Visuel Actions**:
```javascript
// Toast notifications pour actions
import { useToast } from '../ui/Toast';

const usePositionActions = () => {
  const toast = useToast();
  
  const addPosition = async (position) => {
    try {
      await financeStorage.savePosition(position);
      toast.success(`${position.ticker} ajouté au portfolio`);
    } catch (error) {
      toast.error('Erreur lors de l\'ajout');
    }
  };
  
  return { addPosition };
};
```

**Messages Erreur Contextuels**:
```javascript
const ErrorMessages = {
  INVALID_TICKER: 'Ticker invalide. Vérifiez le symbole boursier.',
  API_ERROR: 'Erreur de connexion aux données. Vérification du cache...',
  CALCULATION_ERROR: 'Erreur de calcul. Vérifiez les données saisies.',
  STORAGE_ERROR: 'Erreur de sauvegarde. Tentative de récupération...'
};

function getErrorMessage(error) {
  if (error.code === 'INVALID_TICKER') {
    return ErrorMessages.INVALID_TICKER;
  }
  // ... autres cas
  return 'Une erreur est survenue. Veuillez réessayer.';
}
```

**Accessibilité (a11y)**:
- ARIA labels complets
- Navigation clavier
- Contraste couleurs WCAG AA
- Screen reader support
- Focus management

**Internationalisation (i18n)**:
- Support FR/EN
- Formatage nombres/devises selon locale
- Dates localisées
- Messages traduits

## 📦 STRUCTURE FICHIERS FINALE

```
src/
├── components/
│   └── finance/
│       └── bourse/
│           ├── PortfolioTable.jsx
│           ├── StockCard.jsx
│           ├── AddPositionForm.jsx
│           ├── StockChart.jsx
│           ├── PortfolioChart.jsx
│           └── PerformanceIndicators.jsx
├── services/
│   ├── financeStorage.js
│   ├── yahooFinanceService.js
│   ├── financeCalculations.js
│   ├── financeRecommendations.js
│   └── financeAlerts.js
└── hooks/
    ├── useFinance.js
    └── useYahooFinance.js
```

## 🏗️ ARCHITECTURE TECHNIQUE DÉTAILLÉE

### Backend Architecture (Services)

#### Service Yahoo Finance - Implémentation Complète

**Fichier**: `src/services/yahooFinanceService.js`

**Architecture**:
```javascript
class YahooFinanceService {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = {
      quote: 15 * 60 * 1000,      // 15 min pour données live
      historical: 60 * 60 * 1000, // 1h pour historique
      chart: 5 * 60 * 1000        // 5 min pour graphiques
    };
    this.retryConfig = {
      maxRetries: 3,
      backoffBase: 1000,
      backoffMultiplier: 2
    };
  }

  // Gestion multi-APIs avec fallback
  async getQuoteData(ticker, options = {}) {
    const { useCache = true, forceRefresh = false } = options;
    
    // 1. Vérifier cache
    if (useCache && !forceRefresh) {
      const cached = this.getCachedData(ticker, 'quote');
      if (cached) return cached;
    }

    // 2. Essayer Alpha Vantage (priorité)
    try {
      const data = await this.fetchAlphaVantage(ticker);
      this.setCachedData(ticker, 'quote', data);
      return this.normalizeQuoteData(data);
    } catch (error) {
      console.warn('Alpha Vantage failed, trying Finnhub...', error);
    }

    // 3. Fallback Finnhub
    try {
      const data = await this.fetchFinnhub(ticker);
      this.setCachedData(ticker, 'quote', data);
      return this.normalizeQuoteData(data);
    } catch (error) {
      console.warn('Finnhub failed, trying Polygon...', error);
    }

    // 4. Fallback Polygon
    try {
      const data = await this.fetchPolygon(ticker);
      this.setCachedData(ticker, 'quote', data);
      return this.normalizeQuoteData(data);
    } catch (error) {
      // 5. Dernier recours : données locales
      return this.getLocalFallback(ticker);
    }
  }

  // Normalisation données multi-sources
  normalizeQuoteData(data) {
    return {
      prixActuel: data.price || data.c || data.lastPrice,
      variationJour: data.changePercent || data.dp || ((data.price - data.previousClose) / data.previousClose * 100),
      volume: data.volume || data.v || 0,
      capitalisation: data.marketCap || data.mc || 0,
      // ... normalisation complète
    };
  }

  // Retry avec backoff exponentiel
  async fetchWithRetry(url, options = {}) {
    const { maxRetries = 3, backoffBase = 1000 } = options;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          signal: AbortSignal.timeout(10000) // Timeout 10s
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        return await response.json();
      } catch (error) {
        if (attempt === maxRetries - 1) throw error;
        
        const delay = backoffBase * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}
```

**Gestion Cache Avancée**:
- IndexedDB pour cache persistant
- LRU (Least Recently Used) pour cache mémoire
- Compression données historiques
- Purge automatique données >30 jours

**Gestion Erreurs Robuste**:
- Circuit breaker pattern (arrêt si trop d'erreurs)
- Fallback gracieux avec données locales
- Logging structuré pour debugging
- Notifications utilisateur intelligentes

#### Service Calculs - Optimisations Performance

**Fichier**: `src/services/financeCalculations.js`

**Implémentation Optimisée**:
```javascript
// Web Worker pour calculs lourds (non-bloquant)
const calculationsWorker = new Worker('/workers/financeCalculations.worker.js');

// Memoization avancée avec cache intelligent
const calculationCache = new Map();
const CACHE_MAX_SIZE = 1000;

function calculatePositionValue(quantite, prixActuel) {
  const cacheKey = `${quantite}_${prixActuel}`;
  
  if (calculationCache.has(cacheKey)) {
    return calculationCache.get(cacheKey);
  }

  const result = quantite * prixActuel;
  
  // Gestion taille cache (LRU)
  if (calculationCache.size >= CACHE_MAX_SIZE) {
    const firstKey = calculationCache.keys().next().value;
    calculationCache.delete(firstKey);
  }
  
  calculationCache.set(cacheKey, result);
  return result;
}

// Calculs batch pour performance
function calculateBatchMetrics(positions) {
  // Utiliser Web Worker pour gros volumes
  if (positions.length > 50) {
    return calculationsWorker.postMessage({ type: 'BATCH_CALCULATE', positions });
  }
  
  // Calcul synchrone pour petits volumes
  return positions.map(pos => ({
    ...pos,
    calculs: {
      valeurPosition: calculatePositionValue(pos.quantite, pos.yahooData.prixActuel),
      plusValueEuro: calculateGainLoss(pos.prixEntree, pos.yahooData.prixActuel, pos.quantite),
      plusValuePourcent: ((pos.yahooData.prixActuel - pos.prixEntree) / pos.prixEntree) * 100,
      poidsPortfolio: 0 // Calculé après total portfolio
    }
  }));
}

// Calcul moyennes mobiles optimisé (algorithme incrémental)
function calculateMovingAverageIncremental(newPrice, oldMA, period, oldestPrice) {
  // O(1) au lieu de O(n) pour recalcul complet
  return oldMA + (newPrice - oldestPrice) / period;
}
```

**Tests Unitaires**:
```javascript
// src/services/__tests__/financeCalculations.test.js
describe('financeCalculations', () => {
  test('calculatePositionValue returns correct value', () => {
    expect(calculatePositionValue(50, 189.25)).toBe(9462.50);
  });

  test('calculateGainLoss handles negative values', () => {
    expect(calculateGainLoss(200, 150, 10)).toBe(-500);
  });

  test('calculateMovingAverage handles edge cases', () => {
    expect(calculateMovingAverages([], 20)).toEqual([]);
  });
});
```

### Frontend Architecture (Components)

#### Composant PortfolioTable - Performance Ultra-Optimisée

**Fichier**: `src/components/finance/bourse/PortfolioTable.jsx`

**Optimisations**:
```javascript
import React, { useMemo, useCallback, memo } from 'react';
import { useVirtual } from 'react-virtual'; // Virtual scrolling
import { useSortBy, useFilters, usePagination } from 'react-table';

const PortfolioTable = memo(({ portfolio, onRowClick }) => {
  // Memoization colonnes
  const columns = useMemo(() => [
    {
      Header: 'Entreprise',
      accessor: 'entreprise',
      Cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <img src={row.original.logo} alt="" className="w-8 h-8 rounded" loading="lazy" />
          <span>{row.original.entreprise}</span>
        </div>
      ),
      sortType: 'alphanumeric'
    },
    // ... autres colonnes
  ], []);

  // Virtual scrolling pour >100 lignes
  const tableInstance = useTable(
    { columns, data: portfolio },
    useSortBy,
    useFilters,
    usePagination
  );

  // Debounce recherche (300ms)
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300);

  // Filtrage optimisé avec useMemo
  const filteredData = useMemo(() => {
    if (!debouncedSearch) return portfolio;
    
    const term = debouncedSearch.toLowerCase();
    return portfolio.filter(pos => 
      pos.entreprise.toLowerCase().includes(term) ||
      pos.ticker.toLowerCase().includes(term) ||
      pos.secteur.toLowerCase().includes(term)
    );
  }, [portfolio, debouncedSearch]);

  // Lazy loading images logos
  const LogoImage = memo(({ src, alt }) => (
    <img 
      src={src} 
      alt={alt}
      loading="lazy"
      onError={(e) => {
        e.target.src = '/placeholder-stock.png'; // Fallback
      }}
      className="w-8 h-8 rounded object-cover"
    />
  ));

  return (
    <div className="portfolio-table">
      {/* Recherche avec debounce */}
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Rechercher..."
        className="search-input"
      />
      
      {/* Tableau avec virtual scrolling si >100 lignes */}
      {filteredData.length > 100 ? (
        <VirtualizedTable data={filteredData} columns={columns} />
      ) : (
        <StandardTable data={filteredData} columns={columns} />
      )}
    </div>
  );
});
```

**Optimisations CSS**:
```css
.portfolio-table {
  /* GPU acceleration */
  transform: translateZ(0);
  will-change: scroll-position;
  
  /* Smooth scrolling */
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

.portfolio-table-row {
  /* Optimisation re-render */
  contain: layout style paint;
  
  /* Transition performance */
  transition: background-color 0.15s ease;
}
```

#### Hook useFinance - Gestion État Avancée

**Fichier**: `src/hooks/useFinance.js`

**Implémentation Complète**:
```javascript
import { useState, useEffect, useCallback, useRef } from 'react';
import { useFinanceStorage } from './useFinanceStorage';
import { useYahooFinance } from './useYahooFinance';
import { calculateBatchMetrics } from '../services/financeCalculations';

export const useFinance = () => {
  const [portfolio, setPortfolio] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const refreshIntervalRef = useRef(null);
  
  const { loadPortfolio, savePortfolio } = useFinanceStorage();
  const { refreshAllQuotes } = useYahooFinance();

  // Chargement initial avec optimisme
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await loadPortfolio();
        
        // Charger données Yahoo en parallèle
        const enrichedData = await Promise.all(
          data.map(async (position) => {
            const yahooData = await refreshAllQuotes(position.ticker);
            return {
              ...position,
              yahooData,
              calculs: calculateBatchMetrics([position])[0].calculs
            };
          })
        );
        
        setPortfolio(enrichedData);
      } catch (err) {
        setError(err);
        // Fallback : données locales sans Yahoo
        const localData = await loadPortfolio();
        setPortfolio(localData);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Auto-refresh intelligent (seulement heures bourse)
  useEffect(() => {
    const isMarketOpen = () => {
      const now = new Date();
      const hour = now.getHours();
      const day = now.getDay();
      
      // Lundi-Vendredi, 9h-17h30 (heures bourse US)
      return day >= 1 && day <= 5 && hour >= 9 && hour < 17;
    };

    if (isMarketOpen()) {
      refreshIntervalRef.current = setInterval(async () => {
        await refreshYahooData();
      }, 60000); // 1 minute
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Ajout position avec validation
  const addPosition = useCallback(async (newPosition) => {
    // Validation
    if (!newPosition.ticker || !newPosition.quantite || !newPosition.prixEntree) {
      throw new Error('Données incomplètes');
    }

    // Normalisation ticker (uppercase)
    const normalized = {
      ...newPosition,
      ticker: newPosition.ticker.toUpperCase(),
      id: crypto.randomUUID(),
      dateAchat: newPosition.dateAchat || new Date().toISOString().split('T')[0]
    };

    // Récupérer données Yahoo
    try {
      const yahooData = await refreshAllQuotes(normalized.ticker);
      normalized.yahooData = yahooData;
    } catch (err) {
      console.warn('Yahoo data unavailable, using defaults', err);
      normalized.yahooData = { prixActuel: normalized.prixEntree };
    }

    // Calculs automatiques
    normalized.calculs = calculateBatchMetrics([normalized])[0].calculs;

    // Sauvegarder
    const updated = [...portfolio, normalized];
    setPortfolio(updated);
    await savePortfolio(updated);

    return normalized;
  }, [portfolio, savePortfolio, refreshAllQuotes]);

  // Refresh Yahoo data avec debounce batch
  const refreshYahooData = useCallback(async () => {
    const tickers = portfolio.map(p => p.ticker);
    
    // Batch requests (max 5 simultanés pour éviter rate limit)
    const batchSize = 5;
    for (let i = 0; i < tickers.length; i += batchSize) {
      const batch = tickers.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (ticker) => {
          const position = portfolio.find(p => p.ticker === ticker);
          if (position) {
            try {
              const yahooData = await refreshAllQuotes(ticker);
              const updated = {
                ...position,
                yahooData,
                calculs: calculateBatchMetrics([{ ...position, yahooData }])[0].calculs
              };
              
              setPortfolio(prev => 
                prev.map(p => p.ticker === ticker ? updated : p)
              );
            } catch (err) {
              console.warn(`Failed to refresh ${ticker}`, err);
            }
          }
        })
      );
      
      // Délai entre batches pour respecter rate limits
      if (i + batchSize < tickers.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }, [portfolio, refreshAllQuotes]);

  return {
    portfolio,
    loading,
    error,
    addPosition,
    updatePosition: useCallback(async (id, updates) => {
      // ... implémentation similaire
    }, [portfolio, savePortfolio]),
    deletePosition: useCallback(async (id) => {
      // ... implémentation
    }, [portfolio, savePortfolio]),
    refreshYahooData,
    calculateMetrics: useCallback(() => {
      return calculateBatchMetrics(portfolio);
    }, [portfolio])
  };
};
```

## 🔒 SÉCURITÉ & VALIDATION

### Validation Données Entrée

**Fichier**: `src/utils/financeValidation.js`

```javascript
import { z } from 'zod'; // Schema validation

export const positionSchema = z.object({
  ticker: z.string()
    .min(1, 'Ticker requis')
    .max(10, 'Ticker trop long')
    .regex(/^[A-Z0-9.]+$/, 'Ticker invalide'),
  quantite: z.number()
    .positive('Quantité doit être positive')
    .finite('Quantité invalide'),
  prixEntree: z.number()
    .positive('Prix doit être positif')
    .max(1000000, 'Prix invalide'),
  dateAchat: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date invalide (YYYY-MM-DD)')
});

export function validatePosition(data) {
  try {
    return { success: true, data: positionSchema.parse(data) };
  } catch (error) {
    return { success: false, errors: error.errors };
  }
}
```

### Sanitization & XSS Protection

- Échappement HTML automatique (React fait par défaut)
- Validation côté client ET serveur (si backend ajouté)
- Limitation taille données (max 10MB portfolio)
- Rate limiting requêtes API

## 🧪 TESTS & QUALITÉ

### Tests Unitaires

**Structure**:
```
src/
├── services/
│   ├── __tests__/
│   │   ├── yahooFinanceService.test.js
│   │   ├── financeCalculations.test.js
│   │   └── financeStorage.test.js
│   └── ...
├── hooks/
│   ├── __tests__/
│   │   ├── useFinance.test.js
│   │   └── useYahooFinance.test.js
│   └── ...
└── components/
    └── finance/
        └── bourse/
            └── __tests__/
                ├── PortfolioTable.test.jsx
                └── StockCard.test.jsx
```

### Tests d'Intégration

**Fichier**: `tests/integration/finance.test.js`

```javascript
describe('Finance Module Integration', () => {
  test('Complete workflow: Add position → Refresh → Calculate', async () => {
    // 1. Ajouter position
    const position = await addPosition({
      ticker: 'AAPL',
      quantite: 10,
      prixEntree: 150
    });

    // 2. Vérifier données Yahoo chargées
    expect(position.yahooData).toBeDefined();
    expect(position.yahooData.prixActuel).toBeGreaterThan(0);

    // 3. Vérifier calculs
    expect(position.calculs.valeurPosition).toBeGreaterThan(0);
    expect(position.calculs.plusValuePourcent).toBeDefined();

    // 4. Vérifier persistance
    const saved = await loadPortfolio();
    expect(saved).toContainEqual(expect.objectContaining({ ticker: 'AAPL' }));
  });
});
```

### Tests E2E (Playwright)

**Fichier**: `tests/e2e/finance.spec.js`

```javascript
import { test, expect } from '@playwright/test';

test('User can add stock position and see live data', async ({ page }) => {
  await page.goto('/finance/bourse');
  
  // Cliquer "Ajouter"
  await page.click('button:has-text("Ajouter")');
  
  // Remplir formulaire
  await page.fill('input[name="ticker"]', 'AAPL');
  await page.fill('input[name="quantite"]', '10');
  await page.fill('input[name="prixEntree"]', '150');
  
  // Soumettre
  await page.click('button[type="submit"]');
  
  // Vérifier position ajoutée
  await expect(page.locator('text=AAPL')).toBeVisible();
  
  // Vérifier données live chargées
  await expect(page.locator('.prix-actuel')).toContainText(/\d+\.\d{2}/);
});
```

## 📊 MONITORING & ANALYTICS

### Performance Monitoring

**Fichier**: `src/utils/performanceMonitor.js`

```javascript
export const performanceMonitor = {
  trackAPIRequest(ticker, duration, success) {
    // Envoyer métriques (si service analytics)
    if (window.gtag) {
      window.gtag('event', 'api_request', {
        ticker,
        duration_ms: duration,
        success
      });
    }
  },

  trackCalculationTime(operation, duration) {
    console.log(`[Performance] ${operation}: ${duration}ms`);
    
    if (duration > 100) {
      console.warn(`[Performance] Slow operation: ${operation} took ${duration}ms`);
    }
  }
};
```

### Error Tracking

- Sentry ou équivalent pour erreurs production
- Logging structuré avec contexte
- Alertes erreurs critiques

## 🎨 UX/UI AVANCÉ

### Loading States Sophistiqués

```javascript
// Skeleton loaders pour meilleure UX
const PortfolioTableSkeleton = () => (
  <div className="animate-pulse">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-16 bg-slate-700 rounded mb-2" />
    ))}
  </div>
);

// Progressive loading (afficher données partielles)
const ProgressiveDataDisplay = ({ data, loading }) => {
  if (loading && data.length === 0) {
    return <PortfolioTableSkeleton />;
  }
  
  // Afficher données disponibles même si chargement en cours
  return (
    <>
      <PortfolioTable data={data} />
      {loading && <LoadingIndicator />}
    </>
  );
};
```

### Animations Fluides

```css
/* Transitions optimisées GPU */
.stock-card {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  will-change: transform;
}

.stock-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Animation prix changement */
.price-change {
  animation: pricePulse 0.3s ease;
}

@keyframes pricePulse {
  0% { background-color: transparent; }
  50% { background-color: rgba(34, 197, 94, 0.2); }
  100% { background-color: transparent; }
}
```

## 🔄 SYNCHRONISATION & OFFLINE

### Service Worker pour Offline

**Fichier**: `public/sw-finance.js`

```javascript
// Cache stratégique données finance
const CACHE_NAME = 'finance-v1';
const CACHE_URLS = [
  '/finance/bourse',
  '/api/yahoo/cache' // Données Yahoo en cache
];

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/finance/')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((fetchResponse) => {
          // Mettre en cache pour offline
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, fetchResponse.clone());
          });
          return fetchResponse;
        });
      })
    );
  }
});
```

### Sync Background

- Service Worker pour refresh background
- Notification si nouvelles données disponibles
- Queue requêtes si offline, sync quand online

## ⏱️ ESTIMATION TOTALE RÉVISÉE

**50 heures** de développement pour module complet niveau production avec toutes optimisations.

**Détail**:
- Phase 1-2 : Structure + Yahoo Finance (12h) - FONDATION
- Phase 3 : Interface portfolio (10h) - CORE
- Phase 4 : Calculs (6h) - ESSENTIEL
- Phase 5-8 : Graphiques + IA + Polish (18h) - AVANCÉ
- Tests & Optimisations : (4h) - QUALITÉ

## 🚀 PRIORITÉS

1. **Phase 1-2** : Structure + Yahoo Finance (12h) - FONDATION
2. **Phase 3** : Interface portfolio (10h) - CORE
3. **Phase 4** : Calculs (6h) - ESSENTIEL
4. **Phase 5-8** : Graphiques + IA + Polish (18h) - AVANCÉ
5. **Tests & Qualité** : Tests + Monitoring (4h) - PRODUCTION

