# 10 Nouveaux Graphiques pour Tracking Approfondi - QuietQuest

## 📊 Analyse des graphiques existants

### Graphiques actuellement implémentés
1. **CompletionRateChart** - BarChart groupé (taux de complétion par période)
2. **DailyAverageChart** - ComposedChart (barres + lignes avec moyennes mobiles)
3. **CategoryDistributionChart** - BarChart horizontal (Top/Bottom 5 catégories)
4. **DifficultyAnalysisChart** - PieChart + BarChart (analyse par difficulté)
5. **CalendarHeatmap** - Heatmap personnalisé (calendrier d'activité)
6. **TopBottomQuestsTable** - Tableau (Top/Bottom 10 quêtes)
7. **XP quotidien** - LineChart (évolution XP dans le temps)

### Types de graphiques déjà utilisés
- ✅ BarChart (vertical et horizontal)
- ✅ LineChart
- ✅ ComposedChart (Bar + Line)
- ✅ PieChart
- ✅ Heatmap personnalisé
- ✅ Tableau

---

## 🎯 10 Nouveaux Graphiques Proposés

### 1. **RadarChart - Profil d'activité par catégorie** 📊
**Type** : RadarChart (graphique radar/spider)  
**Objectif** : Visualiser l'équilibre entre les différentes catégories de quêtes

**Métriques affichées** :
- Nombre de validations par catégorie (normalisé)
- XP gagné par catégorie (normalisé)
- Taux de complétion par catégorie
- Temps total passé par catégorie

**Données nécessaires** :
- `validations` filtrées par période
- `allQuests` pour récupérer catégories
- Calculer métriques par catégorie

**Avantages** :
- Visualisation immédiate des déséquilibres
- Permet d'identifier les catégories négligées
- Design moderne et impactant

**Implémentation** :
```javascript
// RadarChart avec 7 axes (une par catégorie)
// Chaque axe représente une métrique normalisée (0-100)
// Plusieurs séries : Validations, XP, Taux de réussite
```

---

### 2. **AreaChart - Évolution XP cumulé avec zones** 📈
**Type** : AreaChart (graphique en aires)  
**Objectif** : Visualiser l'accumulation d'XP dans le temps avec zones colorées

**Métriques affichées** :
- XP cumulé total (aire principale)
- XP par catégorie (aires empilées)
- Ligne de tendance (moyenne mobile)

**Données nécessaires** :
- `dailyPerformances` avec `xpTotal`
- `validations` groupées par date et catégorie

**Avantages** :
- Visualisation de la progression globale
- Identification des périodes les plus productives
- Dégradé visuel agréable

**Implémentation** :
```javascript
// AreaChart empilé avec une série par catégorie
// Gradient de couleur pour chaque catégorie
// Tooltip avec détail par catégorie
```

---

### 3. **ScatterChart - Corrélation Difficulté vs XP gagné** 🎯
**Type** : ScatterChart (nuage de points)  
**Objectif** : Analyser la relation entre difficulté des quêtes et XP réellement gagné

**Métriques affichées** :
- Axe X : Difficulté (1-4)
- Axe Y : XP moyen gagné par validation
- Taille des points : Nombre de validations
- Couleur : Catégorie

**Données nécessaires** :
- `validations` avec `xpGagne`
- `allQuests` pour récupérer `difficulte` et `categorie`

**Avantages** :
- Détection d'anomalies (quêtes trop faciles/difficiles)
- Identification des quêtes les plus rentables
- Visualisation des patterns

**Implémentation** :
```javascript
// ScatterChart avec points colorés par catégorie
// Taille des points proportionnelle au nombre de validations
// Ligne de tendance pour corrélation
```

---

### 4. **GaugeChart - Score de performance global** 🎯
**Type** : Gauge/Semi-circle (jauge semi-circulaire)  
**Objectif** : Afficher un score de performance global (0-100%)

**Métriques affichées** :
- Score global calculé à partir de :
  - Taux de complétion moyen (40%)
  - Régularité (streak) (30%)
  - Diversité des catégories (20%)
  - Progression (XP gagné) (10%)

**Données nécessaires** :
- `dailyPerformances` pour taux de complétion
- `currentStreak` pour régularité
- `categoryStats` pour diversité
- `totalXP` pour progression

**Avantages** :
- Vue d'ensemble instantanée
- Motivation visuelle
- Facile à comprendre

**Implémentation** :
```javascript
// GaugeChart personnalisé avec zones colorées :
// 0-50% : Rouge (à améliorer)
// 50-75% : Orange (bien)
// 75-90% : Vert (excellent)
// 90-100% : Cyan (exceptionnel)
```

---

### 5. **WaterfallChart - Contribution XP par période** 💧
**Type** : WaterfallChart (graphique en cascade)  
**Objectif** : Visualiser la contribution de chaque période à l'XP total

**Métriques affichées** :
- XP gagné par semaine/mois
- Contribution positive/négative
- Total cumulé

**Données nécessaires** :
- `dailyPerformances` groupées par période
- Calculer variation entre périodes

**Avantages** :
- Compréhension de l'évolution
- Identification des périodes clés
- Visualisation des écarts

**Implémentation** :
```javascript
// WaterfallChart montrant :
// - Point de départ (XP initial)
// - Barres positives (gains)
// - Barres négatives (pertes, si applicable)
// - Point final (total)
```

---

### 6. **Treemap - Répartition visuelle des catégories** 🗺️
**Type** : Treemap (carte arborescente)  
**Objectif** : Visualiser la répartition des quêtes et validations par catégorie avec taille proportionnelle

**Métriques affichées** :
- Taille des rectangles : Nombre de validations
- Couleur : Taux de réussite (dégradé)
- Labels : Catégorie + statistiques

**Données nécessaires** :
- `categoryStats` avec validations et taux de réussite
- Calculer pourcentages pour tailles

**Avantages** :
- Vue d'ensemble immédiate
- Identification des catégories dominantes
- Design moderne et compact

**Implémentation** :
```javascript
// Treemap avec :
// - Rectangles proportionnels au nombre de validations
// - Couleur selon taux de réussite (vert = bon, rouge = faible)
// - Tooltip avec détails complets
```

---

### 7. **FunnelChart - Funnel de complétion** 🎪
**Type** : FunnelChart (graphique en entonnoir)  
**Objectif** : Visualiser le taux de conversion à chaque étape du processus

**Métriques affichées** :
- Étape 1 : Quêtes disponibles
- Étape 2 : Quêtes commencées (au moins 1 validation)
- Étape 3 : Quêtes complétées régulièrement (>50% du temps)
- Étape 4 : Quêtes maîtrisées (>80% du temps)

**Données nécessaires** :
- `allQuests` (quêtes disponibles)
- `validations` groupées par quête
- Calculer taux de complétion par quête

**Avantages** :
- Identification des points de friction
- Visualisation du parcours utilisateur
- Métrique de rétention

**Implémentation** :
```javascript
// FunnelChart avec 4 niveaux
// Chaque niveau montre le nombre de quêtes à cette étape
// Pourcentage de conversion affiché
```

---

### 8. **TimelineChart - Timeline des validations** ⏱️
**Type** : Timeline personnalisé (ligne de temps)  
**Objectif** : Visualiser l'activité dans le temps avec événements marquants

**Métriques affichées** :
- Ligne de temps avec dates
- Points marquants :
  - Première validation
  - Records (jour avec le plus de quêtes)
  - Niveaux atteints
  - Streaks importants
- Intensité d'activité par période

**Données nécessaires** :
- `validations` avec dates
- `dailyPerformances` pour records
- `userData` pour niveaux
- Calculer événements marquants

**Avantages** :
- Histoire de l'activité
- Motivation (voir la progression)
- Identification des périodes clés

**Implémentation** :
```javascript
// Timeline personnalisé avec :
// - Ligne horizontale avec dates
// - Points colorés pour événements
// - Tooltips avec détails
// - Zones colorées pour intensité
```

---

### 9. **SankeyChart - Flux XP entre catégories** 🌊
**Type** : SankeyChart (diagramme de flux)  
**Objectif** : Visualiser le flux d'XP entre les différentes catégories dans le temps

**Métriques affichées** :
- Source : Période (Semaine 1, Semaine 2, etc.)
- Cible : Catégorie (Santé, Travail, etc.)
- Largeur du flux : XP gagné

**Données nécessaires** :
- `validations` groupées par semaine et catégorie
- Calculer XP par période/catégorie

**Avantages** :
- Visualisation des changements de focus
- Identification des transitions
- Design unique et impactant

**Implémentation** :
```javascript
// SankeyChart montrant :
// - Colonne gauche : Périodes
// - Colonne droite : Catégories
// - Fluxs proportionnels à l'XP
// - Couleurs par catégorie
```

---

### 10. **SunburstChart - Hiérarchie Catégorie > Difficulté > Quête** ☀️
**Type** : SunburstChart (graphique en soleil)  
**Objectif** : Visualiser la hiérarchie complète des quêtes avec niveaux imbriqués

**Métriques affichées** :
- Niveau 1 (centre) : Total
- Niveau 2 : Catégories (7 segments)
- Niveau 3 : Difficultés (4 segments par catégorie)
- Niveau 4 : Quêtes individuelles (segments par difficulté)

**Données nécessaires** :
- `allQuests` avec catégorie et difficulté
- `validations` pour calculer taille des segments

**Avantages** :
- Vue hiérarchique complète
- Identification rapide des zones d'activité
- Navigation visuelle intuitive

**Implémentation** :
```javascript
// SunburstChart avec 4 niveaux :
// - Niveau 1 : Total (cercle central)
// - Niveau 2 : Catégories (7 segments)
// - Niveau 3 : Difficultés (segments dans chaque catégorie)
// - Niveau 4 : Quêtes (segments dans chaque difficulté)
// Taille proportionnelle au nombre de validations
```

---

## 📋 Résumé des types de graphiques proposés

| # | Nom | Type | Bibliothèque | Complexité |
|---|-----|------|--------------|------------|
| 1 | RadarChart | Radar/Spider | Recharts | ⭐⭐ |
| 2 | AreaChart | Aire empilée | Recharts | ⭐⭐ |
| 3 | ScatterChart | Nuage de points | Recharts | ⭐⭐⭐ |
| 4 | GaugeChart | Jauge | Custom/Recharts | ⭐⭐⭐ |
| 5 | WaterfallChart | Cascade | Recharts | ⭐⭐⭐ |
| 6 | Treemap | Carte arborescente | Recharts | ⭐⭐⭐ |
| 7 | FunnelChart | Entonnoir | Recharts | ⭐⭐ |
| 8 | TimelineChart | Ligne de temps | Custom | ⭐⭐⭐⭐ |
| 9 | SankeyChart | Flux | Recharts | ⭐⭐⭐⭐ |
| 10 | SunburstChart | Soleil | Recharts | ⭐⭐⭐⭐ |

---

## 🎨 Design et style

Tous les nouveaux graphiques suivront le même style cyberpunk professionnel :
- **Couleurs néon** : cyan, purple, emerald, amber
- **Gradients** : dégradés sur tous les éléments
- **Ombres colorées** : effets de glow
- **Tooltips améliorés** : avec bordures néon et gradients
- **Lazy loading** : utilisation de `LazyChart` pour performance

---

## 📊 Priorisation suggérée

### Phase 1 - Impact élevé, complexité moyenne
1. **RadarChart** - Profil d'activité (⭐ facile, impact visuel fort)
2. **AreaChart** - Évolution XP cumulé (⭐ facile, très utile)
3. **GaugeChart** - Score global (⭐⭐ moyen, motivation)

### Phase 2 - Analyse approfondie
4. **ScatterChart** - Corrélation Difficulté/XP (⭐⭐ moyen, insights)
5. **Treemap** - Répartition catégories (⭐⭐ moyen, visuel)
6. **FunnelChart** - Funnel de complétion (⭐⭐ moyen, métrique)

### Phase 3 - Visualisations avancées
7. **WaterfallChart** - Contribution XP (⭐⭐⭐ complexe, analyse)
8. **TimelineChart** - Timeline validations (⭐⭐⭐⭐ très complexe, histoire)
9. **SankeyChart** - Flux XP (⭐⭐⭐⭐ très complexe, flux)
10. **SunburstChart** - Hiérarchie complète (⭐⭐⭐⭐ très complexe, vue globale)

---

## 🔍 Métriques supplémentaires à calculer

Pour supporter ces nouveaux graphiques, il faudra peut-être ajouter :

1. **Temps total par catégorie** : Somme des `duree` des quêtes validées
2. **Taux de conversion** : Quêtes commencées / Quêtes disponibles
3. **Régularité par catégorie** : Nombre de jours avec activité / Total jours
4. **Score de performance global** : Formule composite
5. **Événements marquants** : Détection automatique de records et milestones

---

## 💡 Notes d'implémentation

### Bibliothèque Recharts
Recharts supporte nativement :
- ✅ RadarChart
- ✅ AreaChart
- ✅ ScatterChart
- ✅ FunnelChart
- ✅ Treemap (via `Treemap` component)
- ⚠️ WaterfallChart (nécessite customisation)
- ⚠️ GaugeChart (nécessite customisation ou lib externe)
- ⚠️ SankeyChart (nécessite lib externe ou custom)
- ⚠️ SunburstChart (nécessite lib externe ou custom)
- ⚠️ TimelineChart (nécessite custom complet)

### Alternatives
- **GaugeChart** : Utiliser `react-gauge-chart` ou créer un composant custom
- **SankeyChart** : Utiliser `recharts-sankey` ou créer custom
- **SunburstChart** : Utiliser `react-sunburst-chart` ou créer custom
- **TimelineChart** : Créer composant custom avec SVG/Canvas

---

**Ce document sert de référence pour l'implémentation des 10 nouveaux graphiques. Chaque graphique peut être implémenté indépendamment selon les priorités.**

