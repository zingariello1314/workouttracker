# PLAN PHASE 7 - SENTIMENT MULTI-SOURCE & INTELLIGENCE PRÉDICTIVE

## 📋 Vue d'Ensemble

**Phase** : 7/7 (FINALE)  
**Modules** : 13-14  
**Durée estimée** : 2-3h  
**Complexité** : Modérée  
**Lignes estimées** : ~400-500 lignes

---

## 🎯 Objectifs

Implémenter les 2 derniers modules pour compléter le SurveillanceBlock à 100% :

1. **Module 13** : Sentiment Multi-Source
2. **Module 14** : Intelligence Prédictive

---

## 📊 MODULE 13 : SENTIMENT MULTI-SOURCE

### Fonctionnalités

#### 13.1 Sentiment Composite
- Sentiment global agrégé (0-100)
- Jauge visuelle avec couleurs dynamiques
- Indicateur de tendance (hausse/baisse)

#### 13.2 Sources de Sentiment
- **Twitter** : Sentiment social (0-100)
- **Reddit** : Sentiment communautaire (0-100)
- **News** : Sentiment médiatique (0-100)
- **Analysts** : Sentiment professionnel (0-100)

Chaque source affiche :
- Nom de la source
- Score (0-100)
- Variation par rapport à la période précédente
- Icône personnalisée

#### 13.3 Divergences de Sentiment
- Détection des divergences entre sources
- Paires de sources divergentes
- Écart en points
- Niveau de divergence (FORTE/MODÉRÉE/FAIBLE)
- Explication de la divergence

#### 13.4 Visualisation
- Barres de progression colorées (vert/jaune/rouge)
- Badges de divergence
- Icônes par source
- Animations au hover

### Données Mock

```javascript
const compositeSentiment = {
  score: 68,
  trend: 'up',
  change: '+5'
};

const sentimentSources = [
  { name: 'Twitter', score: 72, change: '+8', icon: 'twitter' },
  { name: 'Reddit', score: 65, change: '+3', icon: 'reddit' },
  { name: 'News', score: 58, change: '-2', icon: 'news' },
  { name: 'Analysts', score: 75, change: '+6', icon: 'analysts' }
];

const sentimentDivergences = [
  {
    id: 1,
    source1: 'Twitter',
    source2: 'News',
    gap: 14,
    level: 'MODÉRÉE',
    explanation: 'Sentiment social plus optimiste que les médias traditionnels'
  },
  {
    id: 2,
    source1: 'Analysts',
    source2: 'Reddit',
    gap: 10,
    level: 'FAIBLE',
    explanation: 'Professionnels plus confiants que la communauté'
  }
];
```

### Computed Values

```javascript
// Couleur du sentiment composite
const getCompositeSentimentColor = (score) => {
  if (score >= 70) return 'text-green-400';
  if (score >= 40) return 'text-yellow-400';
  return 'text-red-400';
};

// Classe de la barre de progression
const getSentimentBarClass = (score) => {
  if (score >= 70) return 'bg-green-500';
  if (score >= 40) return 'bg-yellow-500';
  return 'bg-red-500';
};

// Classe du badge de divergence
const getDivergenceLevelClass = (level) => {
  if (level === 'FORTE') return 'bg-red-500/20 text-red-400 border-red-500/40';
  if (level === 'MODÉRÉE') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
  return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
};
```

### Structure HTML/JSX

```jsx
<div className="p-4 space-y-4 border-b border-gray-700">
  {/* Header */}
  <div className="flex items-center gap-2 mb-3">
    <Icon />
    <h3>SENTIMENT MULTI-SOURCE</h3>
  </div>
  
  {/* Sentiment Composite */}
  <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg">
    <div className="text-xs font-bold text-gray-400 mb-2">Sentiment Composite</div>
    <div className="flex items-center justify-between">
      <div className="text-4xl font-black">{compositeSentiment.score}</div>
      <div className="flex items-center gap-1">
        <TrendIcon />
        <span>{compositeSentiment.change}</span>
      </div>
    </div>
    {/* Barre de progression */}
    <div className="w-full h-2 bg-gray-700 rounded-full mt-3">
      <div className="h-full rounded-full" style={{ width: `${compositeSentiment.score}%` }} />
    </div>
  </div>
  
  {/* Sources de Sentiment */}
  <div>
    <h4>Sources de Sentiment</h4>
    <div className="space-y-2">
      {sentimentSources.map(source => (
        <div key={source.name} className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <SourceIcon />
              <span>{source.name}</span>
            </div>
            <span className="font-black">{source.score}</span>
          </div>
          {/* Barre de progression */}
          <div className="w-full h-1.5 bg-gray-700 rounded-full">
            <div className="h-full rounded-full" style={{ width: `${source.score}%` }} />
          </div>
        </div>
      ))}
    </div>
  </div>
  
  {/* Divergences */}
  <div>
    <h4>Divergences Détectées</h4>
    <div className="space-y-2">
      {sentimentDivergences.map(div => (
        <div key={div.id} className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span>{div.source1}</span>
              <ArrowIcon />
              <span>{div.source2}</span>
            </div>
            <span className="badge">{div.level}</span>
          </div>
          <div className="text-xs">Écart: {div.gap} points</div>
          <p className="text-xs text-gray-400">{div.explanation}</p>
        </div>
      ))}
    </div>
  </div>
</div>
```

---

## 🔮 MODULE 14 : INTELLIGENCE PRÉDICTIVE

### Fonctionnalités

#### 14.1 Prédictions Court Terme
- Prédictions 24h, 48h, 72h
- Direction (HAUSSE/BAISSE/STABLE)
- Variation estimée (%)
- Niveau de confiance (0-100%)
- Facteurs influents

#### 14.2 Scénarios Hebdomadaires
- **Optimiste** : Meilleur cas
- **Réaliste** : Cas probable
- **Pessimiste** : Pire cas

Chaque scénario affiche :
- Variation estimée (%)
- Probabilité (%)
- Prix cible
- Facteurs clés

#### 14.3 Signaux de Trading
- Type de signal (ACHAT/VENTE/ATTENTE)
- Force du signal (FORT/MODÉRÉ/FAIBLE)
- Horizon temporel
- Prix d'entrée suggéré
- Stop loss / Take profit

### Données Mock

```javascript
const shortTermPredictions = [
  {
    id: 1,
    timeframe: '24h',
    direction: 'HAUSSE',
    variation: '+2.3%',
    confidence: 78,
    factors: ['Volume croissant', 'RSI favorable', 'Support technique']
  },
  {
    id: 2,
    timeframe: '48h',
    direction: 'HAUSSE',
    variation: '+3.8%',
    confidence: 65,
    factors: ['Momentum positif', 'Actualités favorables']
  },
  {
    id: 3,
    timeframe: '72h',
    direction: 'STABLE',
    variation: '+0.5%',
    confidence: 52,
    factors: ['Consolidation attendue', 'Résistance proche']
  }
];

const weeklyScenarios = [
  {
    id: 1,
    type: 'optimiste',
    variation: '+12.5%',
    probability: 25,
    targetPrice: '205.00',
    factors: ['Breakout technique', 'Catalyseur positif', 'Volume exceptionnel']
  },
  {
    id: 2,
    type: 'réaliste',
    variation: '+5.2%',
    probability: 50,
    targetPrice: '192.00',
    factors: ['Tendance haussière maintenue', 'Fondamentaux solides']
  },
  {
    id: 3,
    type: 'pessimiste',
    variation: '-3.8%',
    probability: 25,
    targetPrice: '175.00',
    factors: ['Correction technique', 'Prise de bénéfices']
  }
];

const tradingSignals = [
  {
    id: 1,
    type: 'ACHAT',
    strength: 'FORT',
    timeframe: 'Court terme (1-3 jours)',
    entryPrice: '182.50',
    stopLoss: '175.00',
    takeProfit: '195.00',
    confidence: 82
  },
  {
    id: 2,
    type: 'ATTENTE',
    strength: 'MODÉRÉ',
    timeframe: 'Moyen terme (1-2 semaines)',
    reason: 'Attendre confirmation du breakout',
    confidence: 58
  }
];
```

### Computed Values

```javascript
// Couleur de la direction
const getDirectionColor = (direction) => {
  if (direction === 'HAUSSE') return 'text-green-400';
  if (direction === 'BAISSE') return 'text-red-400';
  return 'text-gray-400';
};

// Classe du scénario
const getScenarioClass = (type) => {
  if (type === 'optimiste') return 'bg-green-500/10 border-green-500/30';
  if (type === 'réaliste') return 'bg-blue-500/10 border-blue-500/30';
  return 'bg-red-500/10 border-red-500/30';
};

// Classe du signal
const getSignalClass = (type) => {
  if (type === 'ACHAT') return 'bg-green-500/20 text-green-400 border-green-500/40';
  if (type === 'VENTE') return 'bg-red-500/20 text-red-400 border-red-500/40';
  return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
};

// Classe de la force
const getStrengthClass = (strength) => {
  if (strength === 'FORT') return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
  if (strength === 'MODÉRÉ') return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
  return 'bg-gray-500/20 text-gray-400 border-gray-500/40';
};
```

### Structure HTML/JSX

```jsx
<div className="p-4 space-y-4 border-b border-gray-700">
  {/* Header */}
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <Icon />
      <h3>INTELLIGENCE PRÉDICTIVE</h3>
    </div>
    <Zap className="animate-pulse" />
  </div>
  
  {/* Prédictions Court Terme */}
  <div>
    <h4>Prédictions Court Terme</h4>
    <div className="space-y-2">
      {shortTermPredictions.map(pred => (
        <div key={pred.id} className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="font-black">{pred.timeframe}</span>
              <DirectionIcon />
              <span className={getDirectionColor(pred.direction)}>{pred.direction}</span>
            </div>
            <span className="font-black">{pred.variation}</span>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-gray-400">Confiance:</span>
            <span className="text-xs font-bold">{pred.confidence}%</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {pred.factors.map((factor, i) => (
              <span key={i} className="text-xs px-2 py-0.5 bg-gray-700 rounded-full">
                {factor}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
  
  {/* Scénarios Hebdomadaires */}
  <div>
    <h4>Scénarios Hebdomadaires</h4>
    <div className="space-y-2">
      {weeklyScenarios.map(scenario => (
        <div key={scenario.id} className={`p-3 border rounded-lg ${getScenarioClass(scenario.type)}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-black uppercase">{scenario.type}</span>
            <div className="flex items-center gap-2">
              <span className="font-black">{scenario.variation}</span>
              <span className="text-xs">({scenario.probability}%)</span>
            </div>
          </div>
          <div className="text-xs mb-2">
            Prix cible: <span className="font-bold">{scenario.targetPrice} €</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {scenario.factors.map((factor, i) => (
              <span key={i} className="text-xs px-2 py-0.5 bg-gray-700/50 rounded-full">
                {factor}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
  
  {/* Signaux de Trading */}
  <div>
    <h4>Signaux de Trading</h4>
    <div className="space-y-2">
      {tradingSignals.map(signal => (
        <div key={signal.id} className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`badge ${getSignalClass(signal.type)}`}>{signal.type}</span>
              <span className={`badge ${getStrengthClass(signal.strength)}`}>{signal.strength}</span>
            </div>
            <span className="text-xs font-bold">{signal.confidence}%</span>
          </div>
          <div className="text-xs text-gray-400 mb-2">{signal.timeframe}</div>
          {signal.entryPrice && (
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <div className="text-gray-400">Entrée</div>
                <div className="font-bold text-white">{signal.entryPrice} €</div>
              </div>
              <div>
                <div className="text-gray-400">Stop Loss</div>
                <div className="font-bold text-red-400">{signal.stopLoss} €</div>
              </div>
              <div>
                <div className="text-gray-400">Take Profit</div>
                <div className="font-bold text-green-400">{signal.takeProfit} €</div>
              </div>
            </div>
          )}
          {signal.reason && (
            <p className="text-xs text-gray-300 mt-2">{signal.reason}</p>
          )}
        </div>
      ))}
    </div>
  </div>
</div>
```

---

## 📝 Checklist d'Implémentation

### Préparation
- [x] Créer le plan détaillé Phase 7
- [ ] Lire le code Vue.js de référence pour modules 13-14
- [ ] Identifier les patterns de conversion

### Module 13 : Sentiment Multi-Source
- [ ] Ajouter les données mock (compositeSentiment, sentimentSources, sentimentDivergences)
- [ ] Créer les computed values (getCompositeSentimentColor, getSentimentBarClass, getDivergenceLevelClass)
- [ ] Implémenter renderSentimentMultiSource()
- [ ] Ajouter les icônes (Twitter, Reddit, News, Analysts)
- [ ] Intégrer dans le render principal
- [ ] Tester l'affichage

### Module 14 : Intelligence Prédictive
- [ ] Ajouter les données mock (shortTermPredictions, weeklyScenarios, tradingSignals)
- [ ] Créer les computed values (getDirectionColor, getScenarioClass, getSignalClass, getStrengthClass)
- [ ] Implémenter renderPredictiveIntelligence()
- [ ] Ajouter les icônes (TrendingUp, TrendingDown, Zap)
- [ ] Intégrer dans le render principal
- [ ] Tester l'affichage

### Finalisation
- [ ] Vérifier getDiagnostics (0 erreur requis)
- [ ] Tester tous les modules (1-14)
- [ ] Vérifier le responsive
- [ ] Valider les animations
- [ ] Mettre à jour IMPLEMENTATION_STATUS.md (100% complété)
- [ ] Créer IMPLEMENTATION_PHASE_7.md
- [ ] Mettre à jour SESSION_6_DEC_2025.md

---

## 🎯 Estimation

**Temps total** : 2-3h
- Module 13 : 1-1.5h (~200-250 lignes)
- Module 14 : 1-1.5h (~200-250 lignes)
- Tests & finalisation : 30min

**Lignes totales** : ~400-500 lignes

---

## ✅ Critères de Succès

- [ ] 14/14 modules implémentés (100%)
- [ ] 0 erreur de compilation
- [ ] 0 warning React
- [ ] Toutes les données mock affichées correctement
- [ ] Animations fluides
- [ ] Hover effects fonctionnels
- [ ] Responsive design
- [ ] Code documenté (JSDoc)
- [ ] PropTypes complets

---

## 🚀 Prochaine Étape

**Commencer l'implémentation des modules 13-14 dans SurveillanceBlock.jsx**

Voulez-vous que je commence l'implémentation maintenant ?
