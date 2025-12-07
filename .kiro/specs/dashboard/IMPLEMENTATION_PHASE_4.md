# Dashboard - Phase 4 Implementation Plan (PRIORITY-LOW)

## Vue d'Ensemble

**Date**: 2024-12-06  
**Phase**: 4 - PRIORITY-LOW  
**Status**: 🔜 À DÉMARRER  
**Blocs**: 13 blocs complémentaires  
**Estimation**: 8-10h (2-3 sessions)  

---

## Stratégie d'Implémentation Intelligente

### Regroupement par Similarité

Pour maximiser l'efficacité, je regroupe les 13 blocs en 4 catégories selon leurs fonctionnalités communes:

#### Groupe 1: Blocs Financiers (3 blocs - 2h)
- **Bloc 16: Objectifs DCA** - Suivi investissements DCA programmés
- **Bloc 20: Allocation Salaire** - Répartition salaire mensuel
- **Bloc 27: Échéances à Venir** - Timeline échéances financières

**Composants réutilisables**:
- `TimelineView.jsx` - Vue timeline avec jalons
- `AllocationChart.jsx` - Graphique répartition circulaire
- `DCAProgressCard.jsx` - Carte progression DCA

#### Groupe 2: Blocs Analytics/Comparaisons (4 blocs - 3h)
- **Bloc 17: Smart Progression** - Métriques progression intelligentes
- **Bloc 21: Comparaisons Sport** - Comparaisons performances sportives
- **Bloc 22: Comparaisons Lecture** - Comparaisons performances lecture
- **Bloc 19: Performance de Lecture** - Métriques détaillées lecture

**Composants réutilisables**:
- `ComparisonChart.jsx` - Graphiques comparaison multi-périodes
- `TrendIndicator.jsx` - Indicateur tendance avec flèche
- `MetricCard.jsx` - Carte métrique compacte

#### Groupe 3: Blocs Outils/Création (3 blocs - 2h)
- **Bloc 18: Quick Stats** - Stats rapides du jour
- **Bloc 24: Quête Express** - Création rapide de quêtes
- **Bloc 26: Loisirs Planifiés** - Planification achats loisirs

**Composants réutilisables**:
- `QuickForm.jsx` - Formulaire rapide réutilisable
- `ImageUploader.jsx` - Upload images avec preview
- `FeasibilityBadge.jsx` - Badge faisabilité (facile/difficile)

#### Groupe 4: Blocs Avancés (3 blocs - 3h)
- **Bloc 23: Matrice de Projection** - Projections futures multi-scénarios
- **Bloc 25: Théorie vs Réalité** - Comparaison objectifs vs réalisations
- **Bloc 28: News** - Actualités financières avec filtres

**Composants réutilisables**:
- `ProjectionMatrix.jsx` - Matrice projections 3 scénarios
- `NewsCard.jsx` - Carte actualité avec sentiment
- `FilterBar.jsx` - Barre filtres avancés

---

## Ordre d'Implémentation Optimal

### Session 1 (3-4h): Groupes 1 & 3
**Objectif**: Implémenter les blocs les plus simples et créer les composants de base

1. **Composants réutilisables de base** (1h)
   - TimelineView.jsx
   - AllocationChart.jsx
   - QuickForm.jsx
   - ImageUploader.jsx
   - MetricCard.jsx

2. **Groupe 3: Outils/Création** (1.5h)
   - Quick Stats (simple)
   - Quête Express (formulaire)
   - Loisirs Planifiés (upload + timeline)

3. **Groupe 1: Financiers** (1.5h)
   - Échéances à Venir (timeline)
   - Allocation Salaire (chart)
   - Objectifs DCA (progression)

### Session 2 (3-4h): Groupe 2
**Objectif**: Implémenter les blocs analytics avec graphiques

4. **Composants analytics** (1h)
   - ComparisonChart.jsx
   - TrendIndicator.jsx

5. **Blocs comparaisons** (2-3h)
   - Smart Progression
   - Comparaisons Sport
   - Comparaisons Lecture
   - Performance de Lecture

### Session 3 (2-3h): Groupe 4
**Objectif**: Implémenter les blocs les plus complexes

6. **Composants avancés** (1h)
   - ProjectionMatrix.jsx
   - NewsCard.jsx
   - FilterBar.jsx

7. **Blocs avancés** (1-2h)
   - Matrice de Projection
   - Théorie vs Réalité
   - News

---

## Détails par Bloc

### Groupe 1: Blocs Financiers

#### Bloc 16: Objectifs DCA
**Complexité**: Moyenne  
**Estimation**: 45min  

**Fonctionnalités**:
- Liste actifs DCA avec progression
- Prochains achats programmés
- Écarts plan vs réalisé
- Alertes si achat dû
- Recommandations ajustement

**Mock Data**:
```javascript
{
  assets: [
    { name: 'BTC', target: 500, invested: 350, progress: 70, nextBuy: '2024-12-15' },
    { name: 'ETH', target: 300, invested: 180, progress: 60, nextBuy: '2024-12-20' }
  ],
  totalTarget: 800,
  totalInvested: 530
}
```

#### Bloc 20: Allocation Salaire
**Complexité**: Simple  
**Estimation**: 30min  

**Fonctionnalités**:
- Graphique circulaire répartition
- 4 catégories: Épargne, Investissement, Dépenses, Loisirs
- Pourcentages et montants
- Recommandations optimisation

**Mock Data**:
```javascript
{
  salary: 3000,
  allocation: {
    epargne: 600,
    investissement: 450,
    depenses: 1500,
    loisirs: 450
  }
}
```

#### Bloc 27: Échéances à Venir
**Complexité**: Simple  
**Estimation**: 30min  

**Fonctionnalités**:
- Timeline échéances triées par date
- Jours restants
- Alertes si proche
- Checkbox complétion

**Mock Data**:
```javascript
{
  deadlines: [
    { id: 1, title: 'Paiement loyer', date: '2024-12-10', type: 'finance', completed: false },
    { id: 2, title: 'Renouvellement assurance', date: '2024-12-25', type: 'admin', completed: false }
  ]
}
```

---

### Groupe 2: Blocs Analytics/Comparaisons

#### Bloc 17: Smart Progression
**Complexité**: Moyenne  
**Estimation**: 45min  

**Fonctionnalités**:
- Métriques progression (sport, lecture, apprentissage)
- Tendances amélioration
- Suggestions IA
- Comparaisons périodes

**Mock Data**:
```javascript
{
  metrics: {
    sport: { current: 85, trend: +12, suggestion: 'Augmenter fréquence' },
    lecture: { current: 78, trend: +8, suggestion: 'Maintenir rythme' },
    learning: { current: 92, trend: +15, suggestion: 'Excellent' }
  }
}
```

#### Bloc 21: Comparaisons Sport
**Complexité**: Moyenne  
**Estimation**: 45min  

**Fonctionnalités**:
- Comparaisons par exercice
- Graphiques multi-périodes (7j, 30j, 90j)
- Tendances progression/régression
- Records personnels

**Mock Data**:
```javascript
{
  exercises: {
    pompes: { week: 45, month: 42, quarter: 38, trend: 'up' },
    gainage: { week: 120, month: 110, quarter: 95, trend: 'up' }
  }
}
```

#### Bloc 22: Comparaisons Lecture
**Complexité**: Moyenne  
**Estimation**: 45min  

**Fonctionnalités**:
- Comparaisons par période
- Temps, pages, livres terminés
- Tendances par genre
- Périodes productives

**Mock Data**:
```javascript
{
  periods: {
    week: { time: 320, pages: 180, books: 0 },
    month: { time: 1200, pages: 650, books: 2 }
  },
  genres: {
    fiction: { percentage: 60, trend: 'stable' },
    technique: { percentage: 40, trend: 'up' }
  }
}
```

#### Bloc 19: Performance de Lecture
**Complexité**: Moyenne  
**Estimation**: 45min  

**Fonctionnalités**:
- Métriques détaillées
- Vitesse par genre
- Tendances performance
- Graphiques évolution

**Mock Data**:
```javascript
{
  speed: {
    fiction: 45,
    technique: 32,
    essai: 38
  },
  trends: {
    speed: +5,
    consistency: +8,
    comprehension: +3
  }
}
```

---

### Groupe 3: Blocs Outils/Création

#### Bloc 18: Quick Stats
**Complexité**: Simple  
**Estimation**: 20min  

**Fonctionnalités**:
- 6-8 métriques compactes
- Affichage rapide
- Icônes + valeurs
- Accès détails

**Mock Data**:
```javascript
{
  stats: [
    { icon: '🎯', label: 'Quêtes', value: '8/10' },
    { icon: '💪', label: 'Sport', value: '5/7' },
    { icon: '📚', label: 'Lecture', value: '45min' },
    { icon: '🎓', label: 'Apprentissage', value: '2h' }
  ]
}
```

#### Bloc 24: Quête Express
**Complexité**: Moyenne  
**Estimation**: 45min  

**Fonctionnalités**:
- Formulaire création rapide
- Champs: nom, catégorie, difficulté, durée
- Type: récurrente ou exceptionnelle
- Calendrier hebdomadaire si récurrente
- Calcul XP temps réel

**Mock Data**: Formulaire vide avec validation

#### Bloc 26: Loisirs Planifiés
**Complexité**: Moyenne  
**Estimation**: 1h  

**Fonctionnalités**:
- Liste objectifs loisirs
- Upload image par objectif
- Faisabilité (facile/faisable/difficile/impossible)
- Barre progression
- Timeline prochains objectifs
- Analyse budgétaire
- Historique acquis

**Mock Data**:
```javascript
{
  objectives: [
    { 
      id: 1, 
      name: 'PS5', 
      cost: 500, 
      saved: 350, 
      feasibility: 'faisable',
      targetDate: '2025-02-01',
      image: null
    }
  ]
}
```

---

### Groupe 4: Blocs Avancés

#### Bloc 23: Matrice de Projection
**Complexité**: Élevée  
**Estimation**: 1h  

**Fonctionnalités**:
- Projections futures basées tendances
- 3 scénarios (optimiste/réaliste/pessimiste)
- Périodes multiples (1M, 3M, 6M, 1A)
- Graphiques évolution
- Paramètres ajustables

**Mock Data**:
```javascript
{
  projections: {
    '1M': { optimiste: 95, realiste: 85, pessimiste: 75 },
    '3M': { optimiste: 110, realiste: 95, pessimiste: 80 },
    '6M': { optimiste: 130, realiste: 110, pessimiste: 90 }
  }
}
```

#### Bloc 25: Théorie vs Réalité
**Complexité**: Moyenne  
**Estimation**: 45min  

**Fonctionnalités**:
- Comparaison objectifs vs réalisations
- Écarts par catégorie
- Raisons écarts
- Recommandations ajustement
- Graphiques comparatifs

**Mock Data**:
```javascript
{
  categories: {
    sport: { target: 7, actual: 5, gap: -2, reason: 'Manque temps' },
    lecture: { target: 60, actual: 45, gap: -15, reason: 'Fatigue soir' },
    learning: { target: 120, actual: 140, gap: +20, reason: 'Motivation élevée' }
  }
}
```

#### Bloc 28: News
**Complexité**: Élevée  
**Estimation**: 1h  

**Fonctionnalités**:
- Onglets (Tout, Bourse, Crypto, Économie, Politique)
- Filtres (impact, source, région, secteur)
- Tri (récence, pertinence, sentiment)
- Carte par news (titre, source, sentiment, impact, qualité)
- Statut APIs
- Statut marchés
- Statistiques globales

**Mock Data**:
```javascript
{
  news: [
    {
      id: 1,
      title: 'Bitcoin atteint 45k$',
      source: 'CoinDesk',
      category: 'crypto',
      sentiment: 'positive',
      impact: 'high',
      quality: 85,
      url: 'https://...'
    }
  ],
  apiStatus: { newsapi: 'ok', finnhub: 'ok', reddit: 'ok' },
  marketStatus: 'open'
}
```

---

## Composants Réutilisables à Créer

### Session 1

1. **TimelineView.jsx** (60 lignes)
   - Timeline verticale avec jalons
   - Dates, titres, statuts
   - Indicateurs jours restants

2. **AllocationChart.jsx** (80 lignes)
   - Graphique circulaire (donut)
   - Légende avec pourcentages
   - Hover effects

3. **QuickForm.jsx** (100 lignes)
   - Formulaire générique réutilisable
   - Validation inline
   - Submit handler

4. **ImageUploader.jsx** (70 lignes)
   - Upload avec drag & drop
   - Preview image
   - Crop optionnel

5. **MetricCard.jsx** (40 lignes)
   - Carte métrique compacte
   - Icône + label + valeur
   - Couleurs dynamiques

### Session 2

6. **ComparisonChart.jsx** (120 lignes)
   - Graphique comparaison multi-périodes
   - Barres ou lignes
   - Légende interactive

7. **TrendIndicator.jsx** (30 lignes)
   - Flèche tendance (↑↓→)
   - Couleur selon direction
   - Pourcentage changement

### Session 3

8. **ProjectionMatrix.jsx** (150 lignes)
   - Matrice 3 scénarios x N périodes
   - Graphiques intégrés
   - Paramètres ajustables

9. **NewsCard.jsx** (80 lignes)
   - Carte actualité complète
   - Badges sentiment/impact
   - Click handler

10. **FilterBar.jsx** (100 lignes)
    - Barre filtres avancés
    - Multi-select
    - Reset filters

---

## Extensions Infrastructure

### dashboardStorage.js

Ajouter 13 nouvelles APIs:

```javascript
// Groupe 1: Financiers
export const dcaAPI = {
  get: async () => Object,
  updateProgress: async (assetId, amount) => void
};

export const salaryAllocationAPI = {
  get: async () => Object,
  update: async (allocation) => void
};

export const deadlinesAPI = {
  getAll: async () => Array,
  complete: async (id) => void,
  add: async (deadline) => void
};

// Groupe 2: Analytics
export const smartProgressionAPI = {
  get: async () => Object
};

export const sportComparisonsAPI = {
  get: async (periods) => Object
};

export const readingComparisonsAPI = {
  get: async (periods) => Object
};

export const readingPerformanceAPI = {
  get: async () => Object
};

// Groupe 3: Outils
export const quickStatsAPI = {
  get: async () => Object
};

export const questExpressAPI = {
  create: async (questData) => void
};

export const leisureObjectivesAPI = {
  getAll: async () => Array,
  add: async (objective) => void,
  updateProgress: async (id, amount) => void
};

// Groupe 4: Avancés
export const projectionsAPI = {
  get: async (params) => Object
};

export const theoryRealityAPI = {
  get: async () => Object
};

export const newsAPI = {
  get: async (filters) => Array,
  getStatus: async () => Object
};
```

### useDashboard.js

Ajouter state et operations pour les 13 blocs:

```javascript
// State Phase 4
const [dcaData, setDcaData] = useState(null);
const [salaryAllocationData, setSalaryAllocationData] = useState(null);
const [deadlinesData, setDeadlinesData] = useState(null);
const [smartProgressionData, setSmartProgressionData] = useState(null);
const [sportComparisonsData, setSportComparisonsData] = useState(null);
const [readingComparisonsData, setReadingComparisonsData] = useState(null);
const [readingPerformanceData, setReadingPerformanceData] = useState(null);
const [quickStatsData, setQuickStatsData] = useState(null);
const [leisureObjectivesData, setLeisureObjectivesData] = useState(null);
const [projectionsData, setProjectionsData] = useState(null);
const [theoryRealityData, setTheoryRealityData] = useState(null);
const [newsData, setNewsData] = useState(null);

// Operations Phase 4
const updateDCAProgress = useCallback(async (assetId, amount) => { ... });
const updateSalaryAllocation = useCallback(async (allocation) => { ... });
const completeDeadline = useCallback(async (id) => { ... });
const createQuest = useCallback(async (questData) => { ... });
const addLeisureObjective = useCallback(async (objective) => { ... });
const updateLeisureProgress = useCallback(async (id, amount) => { ... });
const filterNews = useCallback(async (filters) => { ... });
```

---

## Checklist Complétude Phase 4

### Composants Réutilisables (10)
- [ ] TimelineView.jsx
- [ ] AllocationChart.jsx
- [ ] QuickForm.jsx
- [ ] ImageUploader.jsx
- [ ] MetricCard.jsx
- [ ] ComparisonChart.jsx
- [ ] TrendIndicator.jsx
- [ ] ProjectionMatrix.jsx
- [ ] NewsCard.jsx
- [ ] FilterBar.jsx

### Blocs PRIORITY-LOW (13)
- [ ] 16. Objectifs DCA
- [ ] 17. Smart Progression
- [ ] 18. Quick Stats
- [ ] 19. Performance de Lecture
- [ ] 20. Allocation Salaire
- [ ] 21. Comparaisons Sport
- [ ] 22. Comparaisons Lecture
- [ ] 23. Matrice de Projection
- [ ] 24. Quête Express
- [ ] 25. Théorie vs Réalité
- [ ] 26. Loisirs Planifiés
- [ ] 27. Échéances à Venir
- [ ] 28. News

### Infrastructure
- [ ] 13 APIs dans dashboardStorage.js
- [ ] State Phase 4 dans useDashboard.js
- [ ] Operations Phase 4 dans useDashboard.js
- [ ] Intégration dans DashboardTab.jsx

### Qualité
- [ ] 0 erreur compilation
- [ ] 0 warning
- [ ] Mock data cohérentes
- [ ] Animations GPU
- [ ] Responsive design
- [ ] Accessibility (ARIA)
- [ ] Code commenté
- [ ] Documentation complète

---

## Estimation Finale

**Total Phase 4**: 8-10h
- Session 1 (Groupes 1 & 3): 3-4h
- Session 2 (Groupe 2): 3-4h
- Session 3 (Groupe 4): 2-3h

**Total lignes estimées**: ~2500 lignes
- Composants réutilisables: ~800 lignes
- Blocs: ~1400 lignes
- Infrastructure: ~300 lignes

**Progression finale**: 28/28 blocs (100%) ✅

---

**Dernière mise à jour**: 2024-12-06  
**Version**: 4.0.0 (à venir)  
**Status**: 🔜 PRÊT À DÉMARRER
