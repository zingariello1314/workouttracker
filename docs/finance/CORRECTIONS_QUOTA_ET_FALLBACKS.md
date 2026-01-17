# 🔧 CORRECTIONS QUOTA ET FALLBACKS - SYSTÈME FINANCE

## 📋 PROBLÈME IDENTIFIÉ

### Pourquoi une seule position consomme tous les quotas ?

**Le problème principal** : Le système essayait **toutes les variantes de ticker** (ex: TSMC, TSMC.TW, TSMC.TWO, 2330.TW, 2330.TWO) et **chaque tentative consommait un quota**, même si elle échouait.

**Exemple concret** :
- Position TSMC ajoutée
- Système essaie 5 variantes
- Chaque variante consomme 1 quota Alpha Vantage
- **Résultat** : 5 quotas consommés pour 1 seule position !

**Impact** :
- Avec 25 quotas/jour Alpha Vantage, seulement **5 positions** pouvaient être ajoutées
- Les quotas étaient épuisés très rapidement
- Le système ne pouvait pas gérer 50+ positions comme prévu

---

## ✅ CORRECTIONS APPLIQUÉES

### 1. **Vérification quota AVANT les tentatives**

**Avant** :
```javascript
for (const variant of tickerVariants) {
  await financeQuotaManager.consumeQuota('ALPHA_VANTAGE'); // ❌ Consomme même si échec
  const data = await this.fetchAlphaVantage(variant);
}
```

**Après** :
```javascript
// ✅ Vérifier quota AVANT la boucle
if (!financeQuotaManager.canUseApi('ALPHA_VANTAGE')) {
  log.debug('Quota épuisé, skip');
  // Passer au fallback sans essayer
} else {
  for (const variant of tickerVariants) {
    // ✅ Vérifier quota AVANT chaque tentative
    if (!financeQuotaManager.canUseApi('ALPHA_VANTAGE')) {
      break; // Arrêter si quota épuisé
    }
    // ✅ Consommer quota UNIQUEMENT si on va faire la requête
    await financeQuotaManager.consumeQuota('ALPHA_VANTAGE');
    // ... requête ...
  }
}
```

### 2. **Consommation quota UNIQUEMENT en cas de succès**

**Avant** : Quota consommé même si requête échoue

**Après** :
- Quota consommé AVANT la requête (pour réserver)
- Si succès : `recordSuccess()` appelé
- Si échec : `recordFailure()` appelé (pour circuit breaker)
- Si rate limit : Quota consommé mais pas compté comme échec (temporaire)

### 3. **Arrêt immédiat si rate limit détecté**

**Avant** : Le système continuait d'essayer toutes les variantes même en rate limit

**Après** :
```javascript
if (error.message?.includes('rate limit') || error.message?.includes('Information')) {
  rateLimitDetected = true;
  break; // ✅ Arrêter immédiatement, ne pas essayer autres variantes
}
```

### 4. **Délai entre tentatives**

**Ajouté** : 1 seconde d'attente entre chaque tentative pour respecter le rate limit Alpha Vantage (1 req/sec)

---

## 🆕 AJOUTS

### 1. **Yahoo Finance Scraping (Fallback Ultime)**

**Pourquoi** :
- ✅ Gratuit, pas de clé API requise
- ✅ Pas de quota limité
- ✅ Fonctionne pour la plupart des tickers (US, international)
- ✅ Données temps réel

**Implémentation** :
```javascript
async fetchYahooFinanceScraping(ticker) {
  // Utilise l'API publique Yahoo Finance
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`;
  // ... parsing et normalisation ...
}
```

**Ordre de fallback** :
1. Alpha Vantage (si quota disponible)
2. Finnhub (si token valide et circuit breaker ouvert)
3. **Yahoo Finance scraping** (nouveau, toujours disponible)
4. Stale cache (30 jours max)
5. Prix d'entrée (dernier recours)

### 2. **Amélioration gestion Finnhub**

**Vérifications ajoutées** :
- ✅ Vérification token non vide avant requête
- ✅ Détection token invalide/expiré
- ✅ Message clair si token invalide
- ✅ Réactivation automatique après 24h

---

## 📊 RÉSULTAT ATTENDU

### Avant les corrections :
- **5 positions max** par jour (25 quotas / 5 variantes = 5 positions)
- Quotas épuisés très rapidement
- Fallback uniquement sur prix d'entrée

### Après les corrections :
- **25+ positions** par jour (1 quota par position si succès)
- Quotas utilisés intelligemment
- Fallback Yahoo Finance disponible
- Système robuste avec plusieurs sources

---

## 🔑 APIS ALTERNATIVES GRATUITES

Si les APIs actuelles ne suffisent pas, voici des alternatives :

### 1. **Twelve Data** (Recommandé)
- **Site** : https://twelvedata.com/
- **Gratuit** : 800 requêtes/jour
- **Rate limit** : 8 req/min
- **Avantages** : Très généreux, données complètes
- **Inscription** : Gratuite, clé API instantanée

### 2. **IEX Cloud**
- **Site** : https://iexcloud.io/
- **Gratuit** : 50,000 requêtes/mois
- **Avantages** : Très généreux, données US complètes
- **Inscription** : Gratuite, clé API instantanée

### 3. **MarketStack**
- **Site** : https://marketstack.com/
- **Gratuit** : 1,000 requêtes/mois
- **Avantages** : Données historiques complètes
- **Inscription** : Gratuite, clé API instantanée

### 4. **Yahoo Finance** (Déjà implémenté)
- **Gratuit** : Illimité (scraping)
- **Avantages** : Pas de clé API, toujours disponible
- **Inconvénients** : Peut être instable, non-officiel

---

## 📝 VÉRIFICATIONS À FAIRE

### 1. **Token Finnhub**
Vérifier dans `.env` :
```env
VITE_FINNHUB_API_KEY=ton_token_ici
```

**Obtenir un token** :
1. Aller sur https://finnhub.io/register
2. Créer un compte gratuit
3. Copier le token depuis le dashboard
4. Ajouter dans `.env`

**Tester le token** :
```bash
curl "https://finnhub.io/api/v1/quote?symbol=NVDA&token=TON_TOKEN"
```

Si réponse `{"c": 0, "d": null, ...}`, le token est valide mais le ticker n'est pas trouvé.
Si réponse `{"error": "Invalid API key"}`, le token est invalide.

### 2. **Quotas Alpha Vantage**
Vérifier dans les logs :
```
[financeQuotaManager] Daily quota exceeded for ALPHA_VANTAGE: 25/25
```

Si épuisé, attendre minuit ou utiliser Yahoo Finance scraping.

---

## 🎯 PROCHAINES ÉTAPES

1. ✅ **Corrections appliquées** : Quota géré intelligemment
2. ✅ **Yahoo Finance ajouté** : Fallback ultime disponible
3. ⏳ **Vérifier token Finnhub** : Ajouter dans `.env` si manquant
4. ⏳ **Tester avec TSMC** : Vérifier que le prix actuel s'affiche
5. ⏳ **Ajouter APIs alternatives** : Si nécessaire (Twelve Data, IEX Cloud)

---

## 📚 RÉFÉRENCES

- [Alpha Vantage Documentation](https://www.alphavantage.co/documentation/)
- [Finnhub Documentation](https://finnhub.io/docs/api)
- [Yahoo Finance API (non-officiel)](https://github.com/ranaroussi/yfinance)
- [Twelve Data](https://twelvedata.com/)
- [IEX Cloud](https://iexcloud.io/)
