# Analyse du Bloc Actualités - Requirements & APIs

## 📋 État Actuel

### Structure actuelle
- **Composant** : `NewsBlock.jsx`
- **Service** : `newsAPI` dans `dashboardStorage.js`
- **Données** : Format avec `news`, `apiStatus`, `marketStatus`, `stats`
- **Catégories** : Tout, Bourse, Crypto, Économie, Politique
- **Filtres** : Impact, Source, Sentiment
- **Tri** : Plus récent, Plus ancien, Pertinence, Sentiment

### Problèmes identifiés
1. ❌ Données mockées (pas de vraies actualités)
2. ❌ Pas d'actualités France
3. ❌ Limité aux actualités financières
4. ❌ Pas de catégories supplémentaires (Tech, Sport, Culture, etc.)
5. ❌ Pas de recherche
6. ❌ Pas de pagination réelle

---

## 🎯 Objectifs

### Transformer en module "Actualités" complet et indépendant

1. **Actualités générales** (monde)
2. **Actualités France** (priorité)
3. **Actualités financières** (marchés)
4. **Actualités tech** (innovation)
5. **Actualités sport** (optionnel)
6. **Actualités culture** (optionnel)

---

## 🔑 APIs Gratuites Nécessaires

### 1. **NewsAPI.org** ⭐ PRIORITAIRE
- **URL** : https://newsapi.org/
- **Gratuit** : 100 requêtes/jour
- **Fonctionnalités** :
  - Actualités générales (monde)
  - Actualités par pays (France: `country=fr`)
  - Actualités par catégorie (business, technology, sports, etc.)
  - Recherche par mots-clés
  - Sources multiples (BBC, Reuters, Le Monde, etc.)
- **Clé API** : `VITE_NEWSAPI_API_KEY`
- **Endpoints** :
  - `https://newsapi.org/v2/top-headlines?country=fr&apiKey=...`
  - `https://newsapi.org/v2/everything?q=...&apiKey=...`

### 2. **Finnhub News** ⭐ PRIORITAIRE (déjà disponible)
- **URL** : https://finnhub.io/
- **Gratuit** : 60 requêtes/minute
- **Fonctionnalités** :
  - Actualités financières uniquement
  - Actualités par ticker (actions, crypto)
  - Sentiment analysis
- **Clé API** : `VITE_FINNHUB_API_KEY` (déjà configurée)
- **Endpoint** : `https://finnhub.io/api/v1/news?category=general&token=...`

### 3. **Guardian API** ⭐ RECOMMANDÉ
- **URL** : https://open-platform.theguardian.com/
- **Gratuit** : 5000 requêtes/jour
- **Fonctionnalités** :
  - Actualités monde (UK focus mais international)
  - Catégories variées
  - Recherche avancée
  - Pas de limite de pays
- **Clé API** : `VITE_GUARDIAN_API_KEY`
- **Endpoint** : `https://content.guardianapis.com/search?api-key=...`

### 4. **MediaStack** ⭐ ALTERNATIVE
- **URL** : https://mediastack.com/
- **Gratuit** : 1000 requêtes/mois
- **Fonctionnalités** :
  - Actualités monde
  - Filtres par pays, langue, catégorie
  - Sources multiples
- **Clé API** : `VITE_MEDIASTACK_API_KEY`
- **Endpoint** : `https://api.mediastack.com/v1/news?access_key=...&countries=fr`

### 5. **NewsData.io** ⭐ ALTERNATIVE
- **URL** : https://newsdata.io/
- **Gratuit** : 200 requêtes/jour
- **Fonctionnalités** :
  - Actualités monde
  - Filtres par pays, catégorie, langue
  - Recherche
- **Clé API** : `VITE_NEWSDATA_API_KEY`
- **Endpoint** : `https://newsdata.io/api/1/news?apikey=...&country=fr`

### 6. **Reddit API** (pour actualités communautaires)
- **URL** : https://www.reddit.com/dev/api/
- **Gratuit** : Illimité (rate limit: 60 req/min)
- **Fonctionnalités** :
  - Actualités depuis subreddits
  - Sentiment communautaire
  - Pas besoin de clé API (OAuth optionnel)
- **Endpoint** : `https://www.reddit.com/r/worldnews/hot.json`

### 7. **Alpha Vantage News & Sentiment** (déjà disponible)
- **URL** : https://www.alphavantage.co/
- **Gratuit** : 25 requêtes/jour
- **Fonctionnalités** :
  - Actualités financières
  - Sentiment analysis
- **Clé API** : `VITE_ALPHA_VANTAGE_API_KEY` (déjà configurée)
- **Endpoint** : `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=...&apikey=...`

---

## 📊 Comparaison des APIs

| API | Requêtes/jour | Actualités France | Financières | Tech | Sport | Recherche | Sentiment |
|-----|---------------|-------------------|-------------|------|-------|------------|-----------|
| **NewsAPI** | 100 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Finnhub** | 3600/min | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| **Guardian** | 5000 | ⚠️ (UK focus) | ✅ | ✅ | ✅ | ✅ | ❌ |
| **MediaStack** | 1000/mois | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **NewsData** | 200 | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Reddit** | Illimité | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ (via votes) |
| **Alpha Vantage** | 25 | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |

---

## 🏗️ Architecture Recommandée

### Service Principal : `newsService.js`

```javascript
// Structure proposée
class NewsService {
  // Sources multiples avec fallback
  - NewsAPI (priorité pour France + général)
  - Finnhub (priorité pour financier)
  - Guardian (fallback général)
  - Reddit (actualités communautaires)
  - Alpha Vantage (sentiment financier)
  
  // Gestion intelligente
  - Rate limiting par API
  - Cache multi-layer
  - Rotation des sources
  - Aggrégation des résultats
  - Déduplication des articles
}
```

### Catégories Étendues

```javascript
const CATEGORIES = {
  'tout': 'Toutes les actualités',
  'france': 'France',
  'monde': 'Monde',
  'bourse': 'Bourse',
  'crypto': 'Cryptomonnaies',
  'economie': 'Économie',
  'tech': 'Technologie',
  'sport': 'Sport',
  'culture': 'Culture',
  'politique': 'Politique',
  'sante': 'Santé',
  'environnement': 'Environnement'
};
```

### Fonctionnalités à Ajouter

1. **Recherche** : Recherche par mots-clés
2. **Pagination** : Chargement progressif
3. **Favoris** : Sauvegarder des articles
4. **Partage** : Partager des articles
5. **Notifications** : Alertes sur sujets spécifiques
6. **Résumé IA** : Résumé automatique des articles
7. **Traduction** : Traduction des articles étrangers

---

## 🔧 Implémentation

### Étape 1 : Service News Complet
- Créer `src/services/news/newsService.js`
- Gérer multiples APIs avec fallback
- Rate limiting intelligent
- Cache multi-layer

### Étape 2 : Extension NewsBlock
- Ajouter catégories (France, Tech, Sport, etc.)
- Ajouter recherche
- Ajouter pagination
- Améliorer filtres

### Étape 3 : Analyse Sentiment
- Utiliser Alpha Vantage pour sentiment financier
- Utiliser votes Reddit pour sentiment communautaire
- Calculer sentiment composite

### Étape 4 : Actualités France
- Prioriser NewsAPI avec `country=fr`
- Ajouter sources françaises (Le Monde, Le Figaro, etc.)
- Filtre géographique

---

## 📝 Clés API à Ajouter dans `.env`

```env
# Actualités générales et France
VITE_NEWSAPI_API_KEY=your_newsapi_key_here

# Actualités monde (alternative)
VITE_GUARDIAN_API_KEY=your_guardian_key_here

# Actualités alternative
VITE_MEDIASTACK_API_KEY=your_mediastack_key_here
VITE_NEWSDATA_API_KEY=your_newsdata_key_here

# Déjà configurées (à garder)
VITE_FINNHUB_API_KEY=your_finnhub_key_here
VITE_ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key_here
```

---

## 🎯 Priorités d'Implémentation

### Phase 1 : Essentiel
1. ✅ NewsAPI (France + général)
2. ✅ Finnhub (financier)
3. ✅ Extension catégories

### Phase 2 : Amélioration
4. ✅ Guardian (fallback)
5. ✅ Recherche
6. ✅ Pagination

### Phase 3 : Avancé
7. ✅ Reddit (communautaire)
8. ✅ Sentiment analysis
9. ✅ Favoris

---

## 💡 Recommandation Finale

**Stack minimal recommandé** :
- **NewsAPI** : Pour actualités France + générales (100 req/jour)
- **Finnhub** : Pour actualités financières (déjà disponible)
- **Guardian** : Pour fallback et variété (5000 req/jour)

**Total** : 3 clés API gratuites suffisent pour un module complet !

