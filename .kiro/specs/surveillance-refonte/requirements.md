# Requirements - SurveillanceBlock Refonte

## 📋 Introduction

Le **SurveillanceBlock** est un composant dashboard ultra-complet pour la surveillance des marchés financiers. Il agrège des données de multiples sources (actions, crypto, matières premières, indices) et fournit des analyses avancées (corrélations, sentiment, prédictions, comportement).

---

## 🎯 Objectifs Principaux

1. **Surveillance Multi-Actifs** : Suivre actions, crypto, matières premières et indices en temps réel
2. **Analyse de Corrélations** : Laboratoire interactif pour analyser les corrélations entre actifs
3. **Intelligence Prédictive** : Prédictions court terme et signaux de trading basés sur l'IA
4. **Sentiment Multi-Source** : Agrégation du sentiment de marché depuis plusieurs sources
5. **Analyse Comportementale** : Identification des biais et patterns de trading

---

## 📦 Modules Requis (14 modules)

### Module 1 : Header Premium
- Titre "SURVEILLANCE" avec icône œil
- Badge compteur d'actions surveillées
- Effets néon cyan

### Module 2 : Market Status
- Indices de marché (CAC 40, S&P 500, NASDAQ, DAX, FTSE)
- Matières premières (Or, Pétrole, Argent, Cuivre)
- Cryptomonnaies (BTC, ETH, SOL, ADA)
- Variations en temps réel avec couleurs dynamiques

### Module 3 : Stock Cards
- Cartes d'actions surveillées
- Logo uploadable
- Prix actuel + variation
- Signal technique (ACHAT/VENTE/NEUTRE)
- Bouton de suppression

### Module 4 : Alerts
- Alertes de prix (seuils haut/bas)
- Alertes de signaux techniques
- Gestion des alertes (ajout/suppression/modification)
- Notifications visuelles

### Module 5 : News Feed
- Fil d'actualités financières
- Filtrage par catégorie (bourse, crypto, économie, politique)
- Sentiment analysis (positif/négatif/neutre)
- Impact level (high/medium/low)
- Quality score (0-100)
- Liens externes vers sources

### Module 6 : AI Recommendations
- Recommandations IA personnalisées
- Actions suggérées (ACHAT/VENTE/CONSERVER)
- Niveau de confiance (0-100%)
- Justification détaillée
- Horizon temporel (court/moyen/long terme)

### Module 7 : Economic Calendar
- Événements crypto (halvings, mises à jour, listings)
- Événements actions (earnings, dividendes, splits)
- Événements matières premières (rapports, inventaires)
- Événements économiques (taux, inflation, emploi)
- Système d'expansion/collapse par catégorie
- Indicateurs d'impact (high/medium/low)

### Module 8 : Performers
- Top performers (meilleures performances du jour)
- Worst performers (pires performances du jour)
- Variation en pourcentage
- Symboles + noms complets
- Couleurs dynamiques (vert/rouge)

### Module 9 : Behavioral Analysis
- Statistiques de trading (trades gagnants/perdants)
- Meilleur créneau de trading (heure + performance)
- Pire créneau de trading (heure + performance)
- Biais comportementaux détectés
- Recommandations d'amélioration

### Module 10 : Correlation Lab
- Matrice de corrélations interactive
- Sélection multi-actifs (jusqu'à 8)
- Création d'actifs personnalisés
- Visualisation heatmap
- Calcul en temps réel
- Filtrage et tri
- Reset/Select All

### Module 11 : Unexpected Correlations
- Corrélations inattendues détectées par IA
- Paires d'actifs surprenantes
- Force de corrélation
- Explication des corrélations
- Alertes de changement

### Module 12 : Arbitrage Opportunities
- Opportunités d'arbitrage détectées
- Écarts de prix entre marchés
- Potentiel de profit estimé
- Niveau de risque
- Fenêtre temporelle d'opportunité

### Module 13 : Sentiment Multi-Source
- Sentiment composite (agrégé)
- Sources individuelles (Twitter, Reddit, News, Analysts)
- Divergences de sentiment
- Visualisation du consensus
- Alertes de divergence majeure

### Module 14 : Predictive Intelligence
- Prédictions court terme (24h, 48h, 72h)
- Scénarios hebdomadaires (optimiste/réaliste/pessimiste)
- Signaux de trading (ACHAT/VENTE/ATTENTE)
- Niveau de confiance (0-100%)
- Facteurs influents identifiés

---

## 🔧 Fonctionnalités Techniques

### Gestion des États
- États pour modals (ajout action, création actif)
- États pour sélection d'actifs (corrélations)
- États pour expansion des sections
- États pour formulaires

### Computed Values
- `watchedStocksCount` : Nombre d'actions surveillées
- `strongPositiveCorrelations` : Corrélations > 0.7
- `strongNegativeCorrelations` : Corrélations < -0.5
- `averageCorrelation` : Moyenne des corrélations
- `cryptoCorrelationRisk` : Risque de corrélation crypto
- `techCorrelationRisk` : Risque de corrélation tech
- `filteredCorrelationAssets` : Actifs filtrés
- `availableAssets` : Actifs disponibles

### Méthodes Principales
- `handleAddStock()` : Ajouter une action
- `handleLogoUpload()` : Upload de logo
- `updateStockLogo()` : Mettre à jour le logo
- `getCorrelationValue()` : Calculer corrélation
- `formatCorrelationValue()` : Formater corrélation
- `getCorrelationStrength()` : Force de corrélation
- `resetSelection()` : Reset sélection actifs
- `selectAllAssets()` : Sélectionner tous
- `removeFromSelection()` : Retirer de la sélection
- `createCustomAsset()` : Créer actif personnalisé
- `getPredictionClass()` : Classe CSS prédiction
- `getConfidenceClass()` : Classe CSS confiance

### Persistance LocalStorage
- Sauvegarder actions surveillées
- Sauvegarder actifs sélectionnés (corrélations)
- Sauvegarder alertes configurées
- Charger au montage du composant

### Mises à Jour Périodiques
- Corrélations : toutes les 30 secondes
- Sentiment : toutes les 45 secondes
- Prédictions : toutes les 60 secondes
- Cleanup des intervals au démontage

---

## 🎨 Design & Style

### Palette de Couleurs
- **Cyan** : Éléments principaux (cyan-400, cyan-600)
- **Green** : Positif, hausse (green-400, green-500)
- **Red** : Négatif, baisse (red-400, red-500)
- **Yellow** : Neutre, attention (yellow-400, yellow-500)
- **Pink** : Actifs personnalisés (pink-400, pink-600)
- **Purple** : Prédictions (purple-400, purple-600)
- **Gray** : Fond et bordures (gray-700, gray-800, gray-900, gray-950)

### Effets Visuels
- **Néon/Glow** : shadow-neon-cyan, shadow-neon-pink
- **Gradients** : from-gray-950 via-gray-900 to-gray-950
- **Transitions** : transition-all duration-300
- **Hover effects** : hover:scale-105, hover:shadow-lg

---

## ♿ Accessibilité

### ARIA Labels
- Boutons d'action : aria-label descriptif
- Modals : aria-modal, role="dialog"
- Formulaires : aria-required, aria-invalid
- Alertes : role="alert"

### Navigation Clavier
- Tab navigation fonctionnelle
- Enter pour soumettre formulaires
- Escape pour fermer modals
- Focus visible sur tous les éléments interactifs

---

## 📊 Données Mock Requises

### Stocks (Actions)
```javascript
{
  name: string,
  ticker: string,
  price: string,
  change: string,
  signal: 'ACHAT' | 'VENTE' | 'NEUTRE',
  logo: string (base64 ou URL)
}
```

### Market Indices
```javascript
{
  name: string,
  value: string,
  change: string,
  changePercent: string
}
```

### Correlation Matrix
```javascript
{
  'btc_eth': number (-1 to 1),
  'btc_nvda': number,
  // ... toutes les paires
}
```

### Sentiment Sources
```javascript
{
  source: string,
  sentiment: number (0-100),
  trend: 'up' | 'down' | 'stable'
}
```

### Predictions
```javascript
{
  asset: string,
  direction: 'HAUSSE' | 'BAISSE',
  confidence: number (0-100),
  timeframe: '24h' | '48h' | '72h',
  factors: string[]
}
```

---

## 🚀 Performance

### Optimisations Requises
- useMemo pour tous les calculs lourds
- useCallback pour les handlers
- Lazy loading des modules si possible
- Debounce sur les recherches/filtres
- Throttle sur les mises à jour périodiques

### Métriques Cibles
- Temps de rendu initial : < 100ms
- Re-renders : Minimisés
- Animations : 60 FPS constant
- Bundle size : < 150KB (gzipped)

---

## ✅ Critères d'Acceptation

1. ✅ Les 14 modules sont implémentés et fonctionnels
2. ✅ Les modals d'ajout d'action et de création d'actif fonctionnent
3. ✅ L'upload de logo fonctionne (FileReader)
4. ✅ La matrice de corrélations est interactive
5. ✅ Les mises à jour périodiques fonctionnent
6. ✅ La persistance localStorage fonctionne
7. ✅ Le responsive design est validé
8. ✅ L'accessibilité WCAG AA est respectée
9. ✅ 0 erreur de compilation
10. ✅ 0 warning React
11. ✅ PropTypes complets
12. ✅ Documentation complète

---

## 📝 Notes d'Implémentation

### Priorités
1. **Phase 1** : Base fonctionnelle (header, market status, stock cards)
2. **Phase 5** : Corrélations (module le plus complexe et important)
3. **Phase 6** : Sentiment & Prédictions (valeur ajoutée)
4. **Phase 2-3** : Alertes, News, Calendrier, Performers
5. **Phase 4** : Analyse comportementale
6. **Phase 7** : Polish & optimisations

### Dépendances
- Aucune dépendance externe requise (tout en React natif)
- Lucide-react pour les icônes (déjà installé)
- FileReader API pour upload de logos (natif)

---

## 🎯 Succès du Projet

Le projet sera considéré comme réussi lorsque :
- ✅ Tous les 14 modules sont implémentés
- ✅ Le composant est production-ready
- ✅ La documentation est complète
- ✅ Les tests de validation passent
- ✅ L'utilisateur peut surveiller efficacement ses actifs
- ✅ Les corrélations sont calculées correctement
- ✅ Les prédictions sont affichées clairement

