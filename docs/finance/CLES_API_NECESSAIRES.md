# 🔑 CLÉS API NÉCESSAIRES - ONGLET FINANCE

## 📋 RÉCAPITULATIF DES APIS REQUISES

Voici toutes les clés API nécessaires pour l'onglet Finance, avec les sites où les obtenir gratuitement.

---

## 1. 📈 YAHOO FINANCE API - Module Bourse

### **Utilisation**
- Données temps réel actions/ETF
- Cours historiques
- Graphiques
- Ratios financiers (P/E, dividendes, etc.)
- Actualités financières

### **Options Gratuites**

#### **Option 1 : Yahoo Finance API (Non-officielle mais gratuite)**
- **Site**: Pas d'inscription nécessaire
- **Documentation**: 
  - https://github.com/ranaroussi/yfinance (Python)
  - https://www.npmjs.com/package/yahoo-finance2 (Node.js)
- **Limites**: 
  - Pas de clé API requise (scraping)
  - Rate limit : ~2000 requêtes/heure
  - Peut être instable selon charge serveur
- **Note**: ⚠️ Non-officiel, peut être bloqué à tout moment

#### **Option 2 : Alpha Vantage (Gratuit avec clé)**
- **Site**: https://www.alphavantage.co/support/#api-key
- **Inscription**: Gratuite, clé API instantanée
- **Limites**: 
  - 5 appels API par minute
  - 500 appels API par jour
- **Documentation**: https://www.alphavantage.co/documentation/
- **Avantages**: ✅ Officiel, stable, gratuit

#### **Option 3 : Finnhub (Gratuit avec clé)**
- **Site**: https://finnhub.io/register
- **Inscription**: Gratuite, clé API instantanée
- **Limites**: 
  - 60 appels API par minute
  - Données temps réel limitées
- **Documentation**: https://finnhub.io/docs/api
- **Avantages**: ✅ Officiel, bon pour données basiques

#### **Option 4 : Polygon.io (Gratuit avec clé)**
- **Site**: https://polygon.io/pricing
- **Inscription**: Plan gratuit disponible
- **Limites**: 
  - 5 appels API par minute
  - Données avec 15min de délai
- **Documentation**: https://polygon.io/docs
- **Avantages**: ✅ Officiel, bon pour données historiques

### **Recommandation**
**Alpha Vantage** pour débuter (gratuit, stable, officiel)

**Clé API nécessaire**: ✅ OUI (pour options 2, 3, 4)

---

## 2. 🥇 PRIX OR PHYSIQUE - Module Investissements Divers

### **Utilisation**
- Cours spot or en temps réel
- Historique prix or
- Calcul valorisation stock or

### **Options Gratuites**

#### **Option 1 : Metal Price API (Gratuit avec clé)**
- **Site**: https://www.metals-api.com/
- **Inscription**: Gratuite, clé API instantanée
- **Limites**: 
  - 100 requêtes/mois (plan gratuit)
  - Données avec 1h de délai
- **Documentation**: https://metals-api.com/documentation
- **Avantages**: ✅ Spécialisé métaux précieux

#### **Option 2 : Fixer.io (Gratuit avec clé)**
- **Site**: https://fixer.io/product
- **Inscription**: Plan gratuit disponible
- **Limites**: 
  - 100 requêtes/mois
  - Données avec 1h de délai
- **Documentation**: https://fixer.io/documentation
- **Note**: Principalement devises, mais inclut métaux

#### **Option 3 : API Open-Meteo (Gratuit, pas de clé)**
- **Site**: https://open-meteo.com/
- **Note**: ⚠️ Pas de données or, seulement météo

#### **Option 4 : Scraping sites spécialisés (Gratuit, pas de clé)**
- **Sites**: 
  - https://www.goldprice.org/
  - https://www.kitco.com/
- **Note**: ⚠️ Non-officiel, peut être bloqué

### **Recommandation**
**Metal Price API** pour données or spécialisées

**Clé API nécessaire**: ✅ OUI (pour option 1, 2)

---

## 3. 💰 CRYPTOMONNAIES - Module Investissements Divers

### **Utilisation**
- Prix Bitcoin, Ethereum, altcoins
- Historique crypto
- Valorisation portfolio crypto

### **Options Gratuites**

#### **Option 1 : CoinGecko API (Gratuit avec clé)**
- **Site**: https://www.coingecko.com/en/api
- **Inscription**: Gratuite, clé API instantanée
- **Limites**: 
  - 10-50 appels/minute (selon plan)
  - Plan gratuit généreux
- **Documentation**: https://www.coingecko.com/en/api/documentation
- **Avantages**: ✅ Très complet, gratuit, stable

#### **Option 2 : CoinCap API (Gratuit avec clé)**
- **Site**: https://docs.coincap.io/
- **Inscription**: Gratuite, clé API instantanée
- **Limites**: 
  - 200 requêtes/minute
  - Très généreux
- **Documentation**: https://docs.coincap.io/
- **Avantages**: ✅ Simple, rapide, gratuit

#### **Option 3 : Binance API (Gratuit avec clé)**
- **Site**: https://www.binance.com/en/my/settings/api-management
- **Inscription**: Gratuite, clé API instantanée
- **Limites**: 
  - 1200 requêtes/minute
  - Très généreux
- **Documentation**: https://binance-docs.github.io/apidocs/
- **Avantages**: ✅ Très rapide, données temps réel

### **Recommandation**
**CoinGecko API** pour débuter (très complet, gratuit, stable)

**Clé API nécessaire**: ✅ OUI (recommandé pour toutes options)

---

## 4. 🛒 PRIX MAGASINS - Module Smart Shopping

### **Utilisation**
- Prix produits par magasin (Action, Grand Frais, Auchan, Carrefour, Leclerc)
- Historique prix
- Détection promos

### **Options Gratuites**

#### **Option 1 : Scraping sites magasins (Gratuit, pas de clé)**
- **Sites**: 
  - Sites e-commerce des magasins
  - Comparateurs prix (Kelkoo, Idealo)
- **Note**: ⚠️ Non-officiel, peut être bloqué, complexe à maintenir

#### **Option 2 : Google Shopping API (Gratuit avec clé)**
- **Site**: https://developers.google.com/shopping-content
- **Inscription**: Gratuite, clé API via Google Cloud
- **Limites**: 
  - Quotas généreux
  - Données agrégées
- **Documentation**: https://developers.google.com/shopping-content/guides
- **Note**: ⚠️ Principalement pour vendeurs, pas idéal pour comparaison

#### **Option 3 : Open Food Facts API (Gratuit, pas de clé)**
- **Site**: https://world.openfoodfacts.org/data
- **Note**: ✅ Gratuit, mais seulement produits alimentaires

### **Recommandation**
**Scraping personnalisé** ou **saisie manuelle** pour débuter (pas d'API fiable gratuite pour tous magasins)

**Clé API nécessaire**: ❌ NON (pas d'API officielle fiable gratuite)

---

## 5. 📊 INDICES BOURSIERS - Module Synthèse

### **Utilisation**
- CAC40, S&P500, NASDAQ
- Comparaison performance portfolio vs indices

### **Options Gratuites**

#### **Option 1 : Alpha Vantage (Déjà mentionné)**
- **Inclus dans clé API Alpha Vantage**
- Indices disponibles : CAC40, S&P500, NASDAQ, etc.

#### **Option 2 : Yahoo Finance (Déjà mentionné)**
- **Inclus dans données Yahoo Finance**
- Pas de clé API nécessaire

#### **Option 3 : Investing.com API (Gratuit avec clé)**
- **Site**: https://www.investing.com/
- **Note**: ⚠️ Pas d'API officielle publique

### **Recommandation**
**Utiliser Alpha Vantage** (déjà nécessaire pour bourse)

**Clé API nécessaire**: ✅ OUI (déjà couvert par Alpha Vantage)

---

## 📝 RÉCAPITULATIF FINAL

### **Clés API à obtenir (par priorité)**

1. **Alpha Vantage API** ⭐ PRIORITÉ HAUTE
   - Pour : Bourse + Indices
   - Site : https://www.alphavantage.co/support/#api-key
   - Gratuit : ✅ OUI
   - Clé nécessaire : ✅ OUI

2. **CoinGecko API** ⭐ PRIORITÉ MOYENNE
   - Pour : Cryptomonnaies
   - Site : https://www.coingecko.com/en/api
   - Gratuit : ✅ OUI
   - Clé nécessaire : ✅ OUI (recommandé)

3. **Metal Price API** ⭐ PRIORITÉ MOYENNE
   - Pour : Prix or physique
   - Site : https://www.metals-api.com/
   - Gratuit : ✅ OUI (100 req/mois)
   - Clé nécessaire : ✅ OUI

4. **Smart Shopping** ⭐ PRIORITÉ BASSE
   - Pour : Prix magasins
   - Solution : Saisie manuelle ou scraping (pas d'API fiable gratuite)
   - Clé nécessaire : ❌ NON

---

## 🔐 SÉCURITÉ DES CLÉS API

Les clés API sont stockées de manière sécurisée dans :

**Fichier**: `src/config/apiKeys.js`
- Variables d'environnement
- Fichier `.env` (non commité dans git)
- Validation sécurité

**Important**: 
- ✅ Les clés API sont configurées et intégrées
- ✅ Le fichier `.env` est dans `.gitignore` (ne sera pas commité)
- ✅ Les clés sont chargées uniquement côté client via `import.meta.env`

**Configuration**: Voir `docs/finance/ENV_TEMPLATE.md` pour le template du fichier `.env`

---

**Date de création**: 2024
**Dernière mise à jour**: 2024

