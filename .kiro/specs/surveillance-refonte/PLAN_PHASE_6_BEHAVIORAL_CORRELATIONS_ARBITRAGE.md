# PLAN DÉTAILLÉ - PHASE 6: BEHAVIORAL + CORRELATIONS + ARBITRAGE

## 🎯 OBJECTIF

Implémenter les **Modules 9, 11, 12** du SurveillanceBlock:
- Module 9: Behavioral Analysis
- Module 11: Unexpected Correlations
- Module 12: Arbitrage Opportunities

---

## 📋 MODULES À IMPLÉMENTER

### Module 9: Behavioral Analysis

**Fonctionnalités:**
- Statistiques de trading (trades gagnants/perdants)
- Meilleur créneau de trading (heure + performance)
- Pire créneau de trading (heure + performance)
- Biais comportementaux détectés
- Recommandations pour améliorer

**Données Mock:**
```javascript
behavioralData: {
  totalTrades: 156,
  winningTrades: 94,
  losingTrades: 62,
  winRate: 60.3,
  avgWin: '+3.2%',
  avgLoss: '-1.8%'
}
bestTradingTime: '10:00 - 11:00'
bestTimePerformance: '+5.8%'
worstTradingTime: '15:00 - 16:00'
worstTimePerformance: '-2.3%'
detectedBiases: [
  'Overtrading',
  'Loss Aversion',
  'Confirmation Bias'
]
```

---

### Module 11: Unexpected Correlations

**Fonctionnalités:**
- Liste des corrélations surprenantes
- Paires d'actifs inattendues
- Force de corrélation
- Explication de la corrélation

**Données Mock:**
```javascript
unexpectedCorrelations: [
  {
    asset1: 'BTC',
    asset2: 'OR',
    correlation: -0.15,
    strength: 'FAIBLE',
    explanation: 'Corrélation négative inhabituelle entre actifs refuges'
  },
  {
    asset1: 'NVDA',
    asset2: 'SOL',
    correlation: 0.35,
    strength: 'MODÉRÉE',
    explanation: 'Lien via l\'écosystème IA et blockchain'
  }
]
```

---

### Module 12: Arbitrage Opportunities

**Fonctionnalités:**
- Opportunités d'arbitrage détectées
- Écarts de prix entre marchés
- Potentiel de profit
- Niveau de risque
- Fenêtre temporelle

**Données Mock:**
```javascript
arbitrageOpportunities: [
  {
    asset: 'BTC',
    market1: 'Binance',
    price1: '43,250$',
    market2: 'Coinbase',
    price2: '43,380$',
    spread: '+0.3%',
    profit: '130$',
    risk: 'FAIBLE',
    timeWindow: '5-10 min'
  },
  {
    asset: 'ETH',
    market1: 'Kraken',
    price1: '2,285$',
    market2: 'Bitstamp',
    price2: '2,310$',
    spread: '+1.1%',
    profit: '25$',
    risk: 'MODÉRÉ',
    timeWindow: '3-7 min'
  }
]
```

---

## 🎨 DESIGN SYSTEM

### Module 9: Behavioral Analysis
- **Couleur principale:** Orange (#F97316)
- **Icône:** Brain (SVG custom)
- **Badges:** Vert (gagnant), Rouge (perdant), Orange (biais)

### Module 11: Unexpected Correlations
- **Couleur principale:** Indigo (#6366F1)
- **Icône:** Sparkles (SVG custom)
- **Badges:** Force de corrélation (FORTE/MODÉRÉE/FAIBLE)

### Module 12: Arbitrage Opportunities
- **Couleur principale:** Emerald (#10B981)
- **Icône:** DollarSign (lucide-react)
- **Badges:** Risque (FAIBLE/MODÉRÉ/ÉLEVÉ)

---

## 📊 ESTIMATION

**Lignes totales:** ~600-800 lignes
**Temps estimé:** ~3-4h
**Complexité:** MODÉRÉE

- Module 9: ~250 lignes
- Module 11: ~200 lignes
- Module 12: ~250 lignes

---

## ✅ CRITÈRES DE SUCCÈS

- [ ] 3 modules implémentés et fonctionnels
- [ ] 0 erreur de compilation
- [ ] 0 warning React
- [ ] Design cohérent avec les modules précédents
- [ ] Animations fluides
- [ ] Accessibilité complète

---

**Prêt à implémenter les 3 modules de la Phase 6 !**
