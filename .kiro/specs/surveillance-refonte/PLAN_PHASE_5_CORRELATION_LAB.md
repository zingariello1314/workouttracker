# PLAN DÉTAILLÉ - PHASE 5: CORRELATION LAB

## 🎯 OBJECTIF

Implémenter le **Module 10: Correlation Lab** - Le module le plus complexe du SurveillanceBlock.

---

## ⚠️ COMPLEXITÉ

**Niveau:** TRÈS ÉLEVÉ
**Estimation:** ~500-700 lignes
**Temps:** ~3-4h
**Priorité:** MAXIMALE

---

## 📋 FONCTIONNALITÉS À IMPLÉMENTER

### 1. Matrice de Corrélations Interactive
- Affichage d'une matrice NxN (actifs sélectionnés)
- Cellules colorées selon la force de corrélation
- Heatmap visuelle (rouge négatif → vert positif)
- Hover effects sur les cellules
- Valeurs de corrélation affichées

### 2. Sélection d'Actifs Dynamique
- Liste des actifs sélectionnés (badges cliquables)
- Bouton "Ajouter un actif"
- Sélecteur d'actifs disponibles
- Bouton "Reset" (retour à la sélection par défaut)
- Bouton "Select All" (limité à 8 actifs)
- Suppression d'actifs (minimum 2)

### 3. Création d'Actifs Personnalisés
- Modal de création
- Champs: nom, symbole, holding
- Couleur générée aléatoirement
- Ajout à la liste des actifs

### 4. Calculs de Corrélations
- Fonction `getCorrelationValue(asset1, asset2)`
- Fonction `formatCorrelationValue(value)`
- Fonction `getCorrelationStrength(value)`
- Fonction `getCorrelationCellClass(value)`

### 5. Statistiques de Corrélation
- Corrélations positives fortes (> 0.7)
- Corrélations négatives fortes (< -0.5)
- Corrélation moyenne
- Risque de corrélation crypto
- Risque de corrélation tech

---

## 📊 DONNÉES MOCK NÉCESSAIRES

### correlationAssets (Liste d'actifs)
```javascript
[
  { symbol: 'BTC', name: 'Bitcoin', color: '#F7931A', yourHolding: '0.5 BTC', performance7d: '+8.3%' },
  { symbol: 'ETH', name: 'Ethereum', color: '#627EEA', yourHolding: '5 ETH', performance7d: '+6.7%' },
  { symbol: 'NVDA', name: 'NVIDIA', color: '#76B900', yourHolding: '10 actions', performance7d: '+12.5%' },
  { symbol: 'TSLA', name: 'Tesla', color: '#E82127', yourHolding: '5 actions', performance7d: '+5.2%' },
  { symbol: 'AAPL', name: 'Apple', color: '#A2AAAD', yourHolding: '15 actions', performance7d: '+4.1%' },
  { symbol: 'OR', name: 'Or', color: '#FFD700', yourHolding: '50g', performance7d: '+0.5%' },
  { symbol: 'SOL', name: 'Solana', color: '#14F195', yourHolding: '100 SOL', performance7d: '+7.2%' },
  { symbol: 'MSFT', name: 'Microsoft', color: '#00A4EF', yourHolding: '8 actions', performance7d: '-1.5%' }
]
```

### correlationMatrix (Matrice de corrélations)
```javascript
{
  'btc_eth': 0.85,
  'btc_nvda': 0.42,
  'btc_tsla': 0.38,
  'btc_aapl': 0.25,
  'btc_or': -0.15,
  'btc_sol': 0.78,
  'btc_msft': 0.18,
  'eth_nvda': 0.38,
  'eth_tsla': 0.35,
  'eth_aapl': 0.22,
  'eth_or': -0.12,
  'eth_sol': 0.82,
  'eth_msft': 0.15,
  'nvda_tsla': 0.65,
  'nvda_aapl': 0.58,
  'nvda_or': -0.08,
  'nvda_sol': 0.35,
  'nvda_msft': 0.72,
  'tsla_aapl': 0.52,
  'tsla_or': -0.05,
  'tsla_sol': 0.32,
  'tsla_msft': 0.48,
  'aapl_or': -0.03,
  'aapl_sol': 0.28,
  'aapl_msft': 0.68,
  'or_sol': -0.18,
  'or_msft': -0.10,
  'sol_msft': 0.20
}
```

---

## 🎨 DESIGN SYSTEM

### Couleurs de la Heatmap
- **Corrélation forte positive (> 0.7):** `bg-green-500/30 border-green-500/50 text-green-400`
- **Corrélation positive (0.4 - 0.7):** `bg-green-500/20 border-green-500/40 text-green-300`
- **Corrélation faible (0.1 - 0.4):** `bg-blue-500/20 border-blue-500/40 text-blue-300`
- **Corrélation nulle (-0.1 - 0.1):** `bg-gray-500/20 border-gray-500/40 text-gray-400`
- **Corrélation négative (-0.4 - -0.1):** `bg-orange-500/20 border-orange-500/40 text-orange-300`
- **Corrélation forte négative (< -0.4):** `bg-red-500/30 border-red-500/50 text-red-400`

### Badges d'Actifs
- Couleur personnalisée par actif
- Icône X pour suppression
- Hover effect avec scale
- Border coloré

### Statistiques
- Badges colorés selon le type
- Icônes appropriées
- Valeurs formatées

---

## 🏗️ ARCHITECTURE

### Nouveaux États
```javascript
const [correlationAssets, setCorrelationAssets] = useState([...])
const [correlationMatrix] = useState({...})
// selectedAssets déjà existant
// showAssetSelector déjà existant
// showCustomAssetForm déjà existant
// newCustomAsset déjà existant
```

### Nouvelles Fonctions Utilitaires
```javascript
// Calculs de corrélation
const getCorrelationValue = useCallback((asset1, asset2) => {...}, [correlationMatrix])
const formatCorrelationValue = useCallback((value) => {...}, [])
const getCorrelationStrength = useCallback((value) => {...}, [])
const getCorrelationCellClass = useCallback((value) => {...}, [])

// Gestion des actifs
const handleRemoveAsset = useCallback((symbol) => {...}, [selectedAssets])
const handleAddAsset = useCallback((symbol) => {...}, [selectedAssets])
const handleResetSelection = useCallback(() => {...}, [])
const handleSelectAll = useCallback(() => {...}, [correlationAssets])
const handleCreateCustomAsset = useCallback(() => {...}, [newCustomAsset, correlationAssets])
```

### Computed Values (useMemo)
```javascript
const filteredAssets = useMemo(() => {...}, [correlationAssets, selectedAssets])
const availableAssets = useMemo(() => {...}, [correlationAssets, selectedAssets])
const strongPositiveCorrelations = useMemo(() => {...}, [correlationMatrix])
const strongNegativeCorrelations = useMemo(() => {...}, [correlationMatrix])
const averageCorrelation = useMemo(() => {...}, [correlationMatrix])
const cryptoCorrelationRisk = useMemo(() => {...}, [correlationMatrix])
const techCorrelationRisk = useMemo(() => {...}, [correlationMatrix])
```

### Fonction de Rendu
```javascript
renderCorrelationLab()
├── Header avec titre et icône
├── Section: Actifs sélectionnés
│   ├── Badges d'actifs (avec suppression)
│   ├── Bouton "Ajouter un actif"
│   ├── Bouton "Reset"
│   └── Bouton "Select All"
├── Section: Matrice de corrélations
│   ├── Header row (noms des actifs)
│   ├── Rows (actif + cellules de corrélation)
│   └── Cellules colorées avec valeurs
├── Section: Statistiques
│   ├── Corrélations positives fortes
│   ├── Corrélations négatives fortes
│   ├── Corrélation moyenne
│   ├── Risque crypto
│   └── Risque tech
└── Modals
    ├── Sélecteur d'actifs
    └── Création d'actif personnalisé
```

---

## 📝 ÉTAPES D'IMPLÉMENTATION

### Étape 1: Données Mock (30 min)
- [ ] Créer `correlationAssets` avec 8 actifs
- [ ] Créer `correlationMatrix` avec toutes les paires
- [ ] Vérifier la cohérence des données

### Étape 2: Fonctions Utilitaires (45 min)
- [ ] `getCorrelationValue(asset1, asset2)`
- [ ] `formatCorrelationValue(value)`
- [ ] `getCorrelationStrength(value)`
- [ ] `getCorrelationCellClass(value)`
- [ ] Handlers pour gestion des actifs

### Étape 3: Computed Values (30 min)
- [ ] `filteredAssets`
- [ ] `availableAssets`
- [ ] `strongPositiveCorrelations`
- [ ] `strongNegativeCorrelations`
- [ ] `averageCorrelation`
- [ ] `cryptoCorrelationRisk`
- [ ] `techCorrelationRisk`

### Étape 4: Rendu de la Matrice (60 min)
- [ ] Header row avec noms d'actifs
- [ ] Rows avec actif + cellules
- [ ] Cellules colorées selon corrélation
- [ ] Hover effects
- [ ] Valeurs formatées

### Étape 5: Sélection d'Actifs (45 min)
- [ ] Badges d'actifs sélectionnés
- [ ] Bouton suppression
- [ ] Bouton "Ajouter un actif"
- [ ] Modal sélecteur
- [ ] Boutons Reset/Select All

### Étape 6: Statistiques (30 min)
- [ ] Section statistiques
- [ ] Badges colorés
- [ ] Valeurs calculées
- [ ] Icônes appropriées

### Étape 7: Création d'Actif (30 min)
- [ ] Modal création
- [ ] Formulaire
- [ ] Validation
- [ ] Ajout à la liste

### Étape 8: Tests & Polish (30 min)
- [ ] Vérifier 0 erreur
- [ ] Tester toutes les interactions
- [ ] Valider les calculs
- [ ] Optimiser les performances

---

## ⚠️ POINTS D'ATTENTION

### Performance
- Utiliser `useMemo` pour tous les calculs de corrélation
- Utiliser `useCallback` pour tous les handlers
- Éviter les re-renders inutiles de la matrice

### Calculs
- Gérer les paires symétriques (btc_eth = eth_btc)
- Valider les valeurs de corrélation (-1 à 1)
- Formater correctement les nombres

### UX
- Minimum 2 actifs sélectionnés
- Maximum 8 actifs (pour lisibilité)
- Feedback visuel immédiat
- Animations fluides

### Accessibilité
- ARIA labels sur tous les boutons
- Keyboard navigation
- Focus states
- Semantic HTML

---

## 🎯 CRITÈRES DE SUCCÈS

- [ ] Matrice de corrélations affichée correctement
- [ ] Cellules colorées selon la force de corrélation
- [ ] Sélection/désélection d'actifs fonctionnelle
- [ ] Création d'actifs personnalisés fonctionnelle
- [ ] Statistiques calculées correctement
- [ ] 0 erreur de compilation
- [ ] 0 warning React
- [ ] Animations fluides
- [ ] Accessibilité complète

---

## 📚 RÉFÉRENCES

- Code Vue.js: `docs/finance/codepourleblocsurveilance.md`
- Plan général: `.kiro/specs/surveillance-refonte/PLAN_IMPLEMENTATION.md`
- Phases précédentes: `IMPLEMENTATION_PHASE_1-4.md`

---

**Prêt à implémenter le module le plus complexe du SurveillanceBlock !**
