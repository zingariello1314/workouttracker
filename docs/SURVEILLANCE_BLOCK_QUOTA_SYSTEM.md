# Système de Gestion de Quota pour SurveillanceBlock

## 📋 Vue d'ensemble

Un système intelligent de gestion de quota a été implémenté pour connecter tous les modules mock du SurveillanceBlock avec de vraies données, tout en respectant les limites des APIs gratuites.

## 🏗️ Architecture

### 1. **FinanceQuotaManager** (`src/services/finance/financeQuotaManager.js`)

Gestionnaire centralisé qui :
- ✅ Gère les quotas par API (Alpha Vantage, Finnhub, Polygon, CoinGecko, CoinCap)
- ✅ Utilise Token Bucket pour rate limiting par minute
- ✅ Compteurs quotidiens avec reset automatique à minuit
- ✅ Circuit breaker pour éviter surcharge
- ✅ Priorisation des appels (Portfolio > Indices > Autres)
- ✅ TTL de cache adaptatif selon le type de données

### 2. **MarketDataService** (`src/services/finance/marketDataService.js`)

Service pour récupérer :
- ✅ Indices boursiers (CAC 40, S&P 500, NASDAQ, DOW JONES)
- ✅ Matières premières (OR, PÉTROLE)
- ✅ Cryptomonnaies (BTC, ETH)
- ✅ Cache intelligent avec TTL
- ✅ Gestion d'erreurs avec fallback

## 📊 Configuration des Quotas

### Quotas par API (gratuit)

| API | Requêtes/min | Requêtes/jour | Usage |
|-----|--------------|--------------|-------|
| Alpha Vantage | 5 | 25 | Indices, Actions |
| Finnhub | 60 | 60 | Indices, Actions (alternative) |
| Polygon | 5 | 5 | Données historiques |
| CoinGecko | 10 | 10,000/mois | Cryptomonnaies |
| CoinCap | 200 | 10,000/jour | Cryptomonnaies (prioritaire) |

### Priorités des Appels

```javascript
PORTFOLIO_REFRESH: 10      // Portfolio utilisateur (le plus important)
MARKET_INDICES: 8          // Indices boursiers
COMMODITIES: 7             // Matières premières
CRYPTO: 6                  // Cryptomonnaies
NEWS: 5                    // Actualités
HISTORICAL_DATA: 4         // Données historiques (corrélations)
ECONOMIC_CALENDAR: 3       // Calendrier économique
SENTIMENT: 2               // Analyse de sentiment
PREDICTIONS: 1             // Prédictions (moins prioritaire)
```

### TTL du Cache

| Type de données | TTL | Raison |
|----------------|-----|--------|
| Portfolio | 1 min | Données critiques, changent souvent |
| Market Indices | 5 min | Changent moins souvent |
| Commodities | 5 min | Changent moins souvent |
| Crypto | 2 min | Plus volatil |
| News | 15 min | Actualités changent moins souvent |
| Historical | 1h | Données historiques |
| Economic Calendar | 24h | Événements futurs |
| Sentiment | 10 min | Analyse de sentiment |
| Predictions | 30 min | Prédictions |

## 🔌 Modules Connectés

### ✅ Connectés (5 modules)

1. **Stocks surveillés** → Portfolio Finance
2. **Alerts** → Générées depuis portfolio
3. **AI Recommendations** → Basées sur performances portfolio
4. **Top/Worst Performers** → Triés depuis portfolio
5. **Correlation Assets** → Liste depuis portfolio

### ✅ Nouvellement Connectés (2 modules)

6. **Market Indices** → Yahoo Finance (via `marketDataService`)
   - CAC 40, S&P 500, NASDAQ, DOW JONES
   - Cache 5 min, priorité 8

7. **Commodities & Crypto** → Yahoo Finance + CoinCap/CoinGecko
   - OR, PÉTROLE, BTC, ETH
   - Cache 2-5 min selon type, priorité 6-7

### ⚠️ Partiellement Connecté (1 module)

8. **Correlation Matrix** → Assets connectés mais matrice mock
   - Nécessite données historiques pour calculer corrélations réelles

### ❌ Encore Mock (7 modules)

9. **News Feed** → Mock (peut utiliser NewsBlock existant)
10. **Economic Calendar** → Mock (nécessite API calendrier économique)
11. **Behavioral Analysis** → Mock (peut calculer depuis historique portfolio)
12. **Unexpected Correlations** → Mock (dépend de Correlation Matrix)
13. **Arbitrage Opportunities** → Mock (nécessite multiples APIs exchanges)
14. **Sentiment Multi-Source** → Mock (nécessite APIs sociales)
15. **Predictive Intelligence** → Mock (nécessite modèle ML/technique)

## 🎯 Stratégie de Gestion de Quota

### 1. **Cache First**
- Toujours vérifier le cache avant appel API
- Utiliser TTL adaptatif selon type de données
- Autoriser stale cache en dernier recours (circuit breaker)

### 2. **Priorisation**
- Portfolio toujours prioritaire (données utilisateur)
- Indices et commodities en second (données de marché)
- Autres données moins prioritaires

### 3. **Répartition des Appels**
- Utiliser CoinCap pour crypto (plus généreux : 200 req/min)
- Utiliser Finnhub en fallback si Alpha Vantage bloqué
- Rotation automatique des clés si plusieurs disponibles

### 4. **Circuit Breaker**
- Ouvrir circuit breaker si rate limit atteint
- Attendre 2-5 min avant réessayer
- Utiliser stale cache en dernier recours

### 5. **Compteurs Quotidiens**
- Reset automatique à minuit
- Sauvegarde dans localStorage
- Vérification avant chaque appel

## 📈 Utilisation

### Exemple : Charger les indices boursiers

```javascript
import { getAllMarketIndices } from '../../services/finance/marketDataService';

// Le service gère automatiquement :
// - Vérification du cache (TTL 5 min)
// - Consommation de quota (priorité 8)
// - Sélection de la meilleure API disponible
// - Gestion d'erreurs avec fallback

const indices = await getAllMarketIndices();
```

### Exemple : Vérifier les quotas

```javascript
import { financeQuotaManager } from '../../services/finance/financeQuotaManager';

const stats = financeQuotaManager.getQuotaStats();
console.log(stats.dailyCounters); // Compteurs quotidiens
console.log(stats.circuitBreakers); // État des circuit breakers
console.log(stats.availableApis); // APIs disponibles
```

## 🔧 Améliorations Futures

1. **Correlation Matrix** : Calculer depuis données historiques Yahoo Finance
2. **Behavioral Analysis** : Calculer depuis historique portfolio (dates d'achat, win rate)
3. **Economic Calendar** : Intégrer API calendrier économique (Trading Economics)
4. **News Feed** : Réutiliser NewsBlock ou intégrer API actualités
5. **Sentiment** : Intégrer APIs sociales (Twitter, Reddit) + analyse sentiment
6. **Predictions** : Implémenter indicateurs techniques (RSI, MACD) ou modèle ML simple

## ⚠️ Notes Importantes

- **Ne jamais dépasser les quotas** : Le système bloque automatiquement si quota atteint
- **Cache intelligent** : Les données sont mises en cache pour éviter appels inutiles
- **Fallback gracieux** : En cas d'erreur, les données mock sont utilisées
- **Priorisation** : Le portfolio utilisateur est toujours prioritaire
- **Reset automatique** : Les compteurs quotidiens se reset à minuit

