# Task 15: NutritionSection - Guide Visuel 🍽️

## Vue d'Ensemble

La section Nutrition affiche les données nutritionnelles du jour avec 4 cartes de macros et une barre de compliance.

```
┌─────────────────────────────────────────┐
│  🍽️ Nutrition                      ▼   │
├─────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐              │
│  │  🔥     │  │  🥩     │              │
│  │  1850   │  │  120g   │              │
│  │Calories │  │Protéines│              │
│  │Voir repas│ │Voir macros│            │
│  └─────────┘  └─────────┘              │
│                                         │
│  ┌─────────┐  ┌─────────┐              │
│  │  🍞     │  │  🥑     │              │
│  │  200g   │  │  65g    │              │
│  │Glucides │  │ Lipides │              │
│  │Voir macros│ │Voir macros│           │
│  └─────────┘  └─────────┘              │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Compliance                        │ │
│  │ 📊 92% de l'objectif              │ │
│  │ ████████████████░░░░ (92%)        │ │
│  │ Voir stats                        │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Cartes Interactives

### 1. Carte Calories 🔥

**Affichage:**
```
┌─────────────┐
│     🔥      │
│    1850     │  ← Valeur dynamique
│  Calories   │
│ Voir repas  │  ← Hint au hover
└─────────────┘
```

**Navigation:**
- Clic → `navigation.toNutrition({ date: todayDate })`
- Ouvre le module Nutrition avec la date du jour
- Affiche tous les repas loggés

**Tooltip:** "Voir le détail des repas"

---

### 2. Carte Protéines 🥩

**Affichage:**
```
┌─────────────┐
│     🥩      │
│    120g     │  ← Valeur en grammes
│  Protéines  │
│ Voir macros │  ← Hint au hover
└─────────────┘
```

**Navigation:**
- Clic → `navigation.toNutrition({ date: todayDate, section: 'macros' })`
- Ouvre la section Macros du module Nutrition
- Affiche la répartition détaillée

**Tooltip:** "Voir la répartition des macros"

---

### 3. Carte Glucides 🍞

**Affichage:**
```
┌─────────────┐
│     🍞      │
│    200g     │  ← Valeur en grammes
│  Glucides   │
│ Voir macros │  ← Hint au hover
└─────────────┘
```

**Navigation:**
- Clic → `navigation.toNutrition({ date: todayDate, section: 'macros' })`
- Ouvre la section Macros du module Nutrition
- Affiche la répartition détaillée

**Tooltip:** "Voir la répartition des macros"

---

### 4. Carte Lipides 🥑

**Affichage:**
```
┌─────────────┐
│     🥑      │
│     65g     │  ← Valeur en grammes
│   Lipides   │
│ Voir macros │  ← Hint au hover
└─────────────┘
```

**Navigation:**
- Clic → `navigation.toNutrition({ date: todayDate, section: 'macros' })`
- Ouvre la section Macros du module Nutrition
- Affiche la répartition détaillée

**Tooltip:** "Voir la répartition des macros"

---

## Barre de Compliance

### Affichage Normal (avec données)

```
┌─────────────────────────────────────────┐
│ Compliance                              │
│ 📊 92% de l'objectif                    │
│ ████████████████████░░░░░░░░░░░░░░░░░  │
│ Voir stats                              │
└─────────────────────────────────────────┘
```

**Navigation:**
- Clic → `navigation.toNutrition({ tab: 'stats' })`
- Ouvre l'onglet Statistiques
- Affiche l'historique et les tendances

**Tooltip:** "Voir les statistiques nutritionnelles"

### Couleurs de la Barre

La couleur change selon le pourcentage:

**Vert (Parfait)** - 90-110%
```
████████████████████ (95%)  ← Vert #22c55e
```

**Jaune (Acceptable)** - 80-120%
```
██████████████░░░░░░ (85%)  ← Jaune #eab308
```

**Rouge (Hors cible)** - < 80% ou > 120%
```
████████░░░░░░░░░░░░ (70%)  ← Rouge #ef4444
```

---

## État Sans Données

Quand aucun repas n'est loggé:

```
┌─────────────────────────────────────────┐
│  🍽️ Nutrition                      ▼   │
├─────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐              │
│  │  🔥     │  │  🥩     │              │
│  │    0    │  │   0g    │              │
│  │Calories │  │Protéines│              │
│  └─────────┘  └─────────┘              │
│                                         │
│  ┌─────────┐  ┌─────────┐              │
│  │  🍞     │  │  🥑     │              │
│  │   0g    │  │   0g    │              │
│  │Glucides │  │ Lipides │              │
│  └─────────┘  └─────────┘              │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ ⚠️ Aucun repas loggé aujourd'hui  │ │
│  │ Ajouter repas                     │ │
│  └───────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

**Navigation:**
- Clic sur warning → `navigation.toNutrition({ action: 'configure' })`
- Ouvre le formulaire d'ajout de repas

---

## Effets Visuels

### Hover sur Carte

```
┌─────────────┐
│     🔥      │
│    1850     │
│  Calories   │
│ Voir repas →│  ← Flèche apparaît
└─────────────┘
     ↑
  Légère élévation
  + Ombre portée
  + Glow coloré
```

**Transformations:**
- `translateY(-3px)` - Élévation
- `scale(1.02)` - Agrandissement léger
- Box-shadow étendue
- Glow de la couleur actuelle

### Focus Clavier

```
┌═════════════┐  ← Bordure épaisse
║     🔥      ║
║    1850     ║
║  Calories   ║
║ Voir repas  ║
└═════════════┘
```

**Indicateurs:**
- Bordure épaisse visible
- Outline pour accessibilité
- Même transformation que hover

---

## Navigation Clavier

### Séquence de Navigation

```
Tab 1: Carte Calories
Tab 2: Carte Protéines
Tab 3: Carte Glucides
Tab 4: Carte Lipides
Tab 5: Barre Compliance (si données)
Tab 6: Warning (si pas de données)
```

### Activation

- **Enter** → Active la navigation
- **Space** → Active la navigation
- **Escape** → Ferme la section (si implémenté)

---

## Responsive Design

### Desktop (> 1024px)

```
┌─────────┐  ┌─────────┐
│ Calories│  │Protéines│
└─────────┘  └─────────┘

┌─────────┐  ┌─────────┐
│ Glucides│  │ Lipides │
└─────────┘  └─────────┘
```
Grille 2x2

### Tablet (768-1024px)

```
┌─────────┐  ┌─────────┐
│ Calories│  │Protéines│
└─────────┘  └─────────┘

┌─────────┐  ┌─────────┐
│ Glucides│  │ Lipides │
└─────────┘  └─────────┘
```
Grille 2x2 (même layout)

### Mobile (< 768px)

```
┌─────────┐  ┌─────────┐
│ Calories│  │Protéines│
└─────────┘  └─────────┘

┌─────────┐  ┌─────────┐
│ Glucides│  │ Lipides │
└─────────┘  └─────────┘
```
Grille 2x2 (cartes plus petites)

---

## Flux de Données

```
useNutritionData()
       ↓
  getDailyMeal(today)
       ↓
  nutritionData
       ↓
useSidebarData()
       ↓
  nutrition: {
    calories: 1850,
    proteins: 120,
    carbs: 200,
    fats: 65,
    compliance: 92,
    hasData: true
  }
       ↓
NutritionSection
       ↓
  Affichage + Navigation
```

---

## Exemples de Navigation

### Scénario 1: Voir les Repas

```
User: Clique sur "Calories"
  ↓
navigation.toNutrition({ date: '2025-12-09' })
  ↓
Module Nutrition s'ouvre
  ↓
Affiche les repas du 9 décembre 2025
```

### Scénario 2: Voir les Macros

```
User: Clique sur "Protéines"
  ↓
navigation.toNutrition({ 
  date: '2025-12-09', 
  section: 'macros' 
})
  ↓
Module Nutrition s'ouvre
  ↓
Section Macros affichée
  ↓
Graphique de répartition visible
```

### Scénario 3: Voir les Stats

```
User: Clique sur "Compliance"
  ↓
navigation.toNutrition({ tab: 'stats' })
  ↓
Module Nutrition s'ouvre
  ↓
Onglet Statistiques affiché
  ↓
Historique et tendances visibles
```

---

## Accessibilité

### ARIA Labels

```javascript
aria-label="Calories: 1850 kcal. Cliquer pour voir le détail des repas"
aria-label="Protéines: 120 grammes. Cliquer pour voir la répartition des macros"
aria-label="Compliance: 92% de l'objectif calorique. Cliquer pour voir les statistiques"
```

### Rôles

```javascript
role="button"     // Toutes les cartes cliquables
tabIndex={0}      // Navigation clavier
```

### Navigation Clavier

```javascript
onKeyDown={(e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handleClick();
  }
}}
```

---

## Conclusion

La section Nutrition est maintenant:
- ✅ Complètement interactive
- ✅ Accessible au clavier
- ✅ Responsive sur tous les écrans
- ✅ Avec navigation contextuelle
- ✅ Avec indicateurs visuels clairs
- ✅ Avec gestion des données manquantes

Prête pour la production! 🚀
