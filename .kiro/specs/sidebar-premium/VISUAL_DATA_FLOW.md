# 🔄 Flux de Données - Sidebar Premium

**Visualisation du flux de données entre les modules et la Sidebar**

---

## 📊 Architecture Globale

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION QUIETQUEST                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    useSidebarData Hook                       │
│                   (Agrégateur Central)                       │
└─────────────────────────────────────────────────────────────┘
         │         │         │         │         │         │
         ▼         ▼         ▼         ▼         ▼         ▼
    ┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐
    │QuietQ. ││Workout ││ Garmin ││Nutrition││Finance ││ Books  │
    │Engine  ││Context ││  Data  ││  Data  ││Synthèse││LocalSt.│
    └────────┘└────────┘└────────┘└────────┘└────────┘└────────┘
         │         │         │         │         │         │
         └─────────┴─────────┴─────────┴─────────┴─────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SidebarPremium.jsx                        │
│                  (Composant Principal)                       │
└─────────────────────────────────────────────────────────────┘
         │         │         │         │         │
         ▼         ▼         ▼         ▼         ▼
    ┌────────┐┌────────┐┌────────┐┌────────┐┌────────┐
    │Métriques││Quêtes  ││Sport & ││Finances││Livres  │
    │Vitales ││Actives ││Santé   ││        ││        │
    └────────┘└────────┘└────────┘└────────┘└────────┘
```

---

## 🔄 Flux de Données Détaillé

### 1. QuietQuest Engine → Métriques Vitales

```
useQuietQuestEngine()
    │
    ├─ userData.currentXP ────────────────────────────┐
    ├─ userData.level ────────────────────────────────┤
    ├─ dailyPerformances ─────────────────────────────┤
    │                                                  │
    │  [Calculs dans useSidebarData]                  │
    │  • Streak = jours consécutifs ≥80%              │
    │  • Focus = moyenne 7 derniers jours             │
    │                                                  │
    └──────────────────────────────────────────────────┤
                                                       │
                                                       ▼
                                            ┌──────────────────┐
                                            │ metrics = {      │
                                            │   xp: 12450,     │
                                            │   level: 42,     │
                                            │   streak: 28,    │
                                            │   focus: 87      │
                                            │ }                │
                                            └──────────────────┘
                                                       │
                                                       ▼
                                            ┌──────────────────┐
                                            │ Métriques Vitales│
                                            │ Section          │
                                            │                  │
                                            │ ⭐ 12,450 XP     │
                                            │ 🎖️ Niveau 42    │
                                            │ 🔥 28 Jours      │
                                            │ ⚡ 87% Focus     │
                                            └──────────────────┘
```

### 2. QuietQuest Engine → Quêtes Actives

```
useQuietQuestEngine()
    │
    ├─ getQuestsForDate(today) ──────────────────────┐
    ├─ isQuestCompletedOnDate(id, today) ────────────┤
    │                                                 │
    │  [Transformation dans useSidebarData]           │
    │  • Map chaque quête                             │
    │  • Calcul progression (0% ou 100%)              │
    │  • Extraction icône, titre, XP                  │
    │                                                 │
    └─────────────────────────────────────────────────┤
                                                      │
                                                      ▼
                                           ┌──────────────────┐
                                           │ quests = [       │
                                           │   {              │
                                           │     id: 1,       │
                                           │     title: "...", │
                                           │     icon: "📚",  │
                                           │     progress: 100,│
                                           │     completed: ✓ │
                                           │   },             │
                                           │   ...            │
                                           │ ]                │
                                           └──────────────────┘
                                                      │
                                                      ▼
                                           ┌──────────────────┐
                                           │ Quêtes Actives   │
                                           │ Section          │
                                           │                  │
                                           │ Badge: 3 quêtes  │
                                           │                  │
                                           │ 📚 Lire 30min    │
                                           │ ████████░░ 100%  │
                                           │                  │
                                           │ 💪 Sport         │
                                           │ ████████░░ 100%  │
                                           │                  │
                                           │ 🎯 Focus 2h      │
                                           │ ████░░░░░░ 45%   │
                                           └──────────────────┘
```

### 3. Workout + Garmin → Sport & Santé

```
useWorkout()                    useGarminData()
    │                                │
    ├─ getWorkoutHistory() ──────────┤
    │                                │
    │                                ├─ dailyMetrics[today].totalCaloriesBurned
    │                                ├─ dailyMetrics[today].steps
    │                                └─ dailyMetrics[today].restingHeartRate
    │                                │
    │  [Agrégation dans useSidebarData]
    │  • Filtre workouts dernière semaine
    │  • Extraction métriques Garmin du jour
    │  • Indicateur disponibilité Garmin
    │                                │
    └────────────────────────────────┤
                                     │
                                     ▼
                          ┌──────────────────┐
                          │ sport = {        │
                          │   weeklyWorkouts: 5,│
                          │   todayCalories: 2450,│
                          │   todaySteps: 8234,│
                          │   avgHeartRate: 72,│
                          │   hasGarminData: ✓│
                          │ }                │
                          └──────────────────┘
                                     │
                                     ▼
                          ┌──────────────────┐
                          │ Sport & Santé    │
                          │ Section          │
                          │                  │
                          │ 🏋️ 5 Entraînements│
                          │ 🔥 2,450 Calories│
                          │ 👟 8,234 Pas     │
                          │ ❤️ 72 BPM        │
                          └──────────────────┘
```

### 4. Synthèse + Planificateur → Finances

```
useSynthese()              usePlanificateur()
    │                           │
    ├─ patrimoine.total ────────┤
    ├─ patrimoine.investissements─┤
    │                           │
    │                           ├─ salaire.montantNet
    │                           └─ repartition.epargne.montant
    │                           │
    │  [Agrégation dans useSidebarData]
    │  • Calcul total investissements
    │  • Extraction budget et épargne
    │  • Indicateur disponibilité
    │                           │
    └───────────────────────────┤
                                │
                                ▼
                     ┌──────────────────┐
                     │ finance = {      │
                     │   netWorth: 45200,│
                     │   investments: 30000,│
                     │   monthlyBudget: 2450,│
                     │   monthlySavings: 850,│
                     │   hasData: ✓     │
                     │ }                │
                     └──────────────────┘
                                │
                                ▼
                     ┌──────────────────┐
                     │ Finances Section │
                     │                  │
                     │ [formatCurrency()]│
                     │                  │
                     │ 💎 45.2K€ Patrimoine│
                     │ 📈 30.0K€ Investissements│
                     │ 💳 2.5K€ Budget  │
                     │ 🏦 850€ Épargne  │
                     │                  │
                     │ Taux: 35%        │
                     └──────────────────┘
```

### 5. localStorage → Livres

```
localStorage.getItem('booksData')
    │
    ├─ currentBooks.length ──────────────────────────┐
    ├─ todayPages ───────────────────────────────────┤
    ├─ todayMinutes ─────────────────────────────────┤
    ├─ dailyGoal ────────────────────────────────────┤
    │                                                 │
    │  [Extraction dans useSidebarData]               │
    │  • Parse JSON                                   │
    │  • Extraction valeurs                           │
    │  • Indicateur disponibilité                     │
    │                                                 │
    └─────────────────────────────────────────────────┤
                                                      │
                                                      ▼
                                           ┌──────────────────┐
                                           │ learning = {     │
                                           │   currentBooks: 2,│
                                           │   todayPages: 45, │
                                           │   todayMinutes: 30,│
                                           │   dailyGoal: 30,  │
                                           │   hasData: ✓     │
                                           │ }                │
                                           └──────────────────┘
                                                      │
                                                      ▼
                                           ┌──────────────────┐
                                           │ Livres Section   │
                                           │                  │
                                           │ 📚 2 En cours    │
                                           │ 📄 45 Pages      │
                                           │ ⏰ 30min Lecture │
                                           │ 🎯 30min Objectif│
                                           │                  │
                                           │ Progression:     │
                                           │ ██████████ 100%  │
                                           └──────────────────┘
```

---

## 🔄 Cycle de Mise à Jour

```
┌─────────────────────────────────────────────────────────────┐
│                    ÉVÉNEMENT UTILISATEUR                     │
│  (Compléter quête, Ajouter workout, Sync Garmin, etc.)     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    MODULE CONCERNÉ                           │
│  (QuietQuest, Workout, Garmin, Finance, Books)              │
│  • Mise à jour des données                                  │
│  • Déclenchement des hooks React                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    useSidebarData Hook                       │
│  • useEffect détecte le changement                          │
│  • Recalcul avec useMemo                                    │
│  • Nouvelles valeurs retournées                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SidebarPremium.jsx                        │
│  • Re-render avec React.memo                                │
│  • Mise à jour uniquement des sections concernées           │
│  • Affichage des nouvelles valeurs                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    INTERFACE UTILISATEUR                     │
│  • Nouvelles valeurs visibles                               │
│  • Animations de transition                                 │
│  • Pas besoin de rafraîchir !                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Optimisations de Performance

### 1. Mémorisation avec useMemo

```javascript
// Évite recalculs inutiles
const metrics = useMemo(() => ({
  xp: userData.currentXP || 0,
  level: userData.level || 1,
  streak,  // Calculé une seule fois
  focus    // Calculé une seule fois
}), [userData, streak, focus]);
```

### 2. Mémorisation des Composants

```javascript
// Évite re-renders inutiles
const SportSection = memo(({ isExpanded, onToggle, data }) => {
  // Ne re-render que si props changent
});
```

### 3. Callbacks Stables

```javascript
// Évite recréation de fonctions
const sectionProps = useMemo(() => ({
  sport: { 
    isExpanded, 
    onToggle, 
    data: sport  // Référence stable
  }
}), [isSectionExpanded, toggleSection, sport]);
```

---

## 📊 Flux de Données par Section

| Section | Source(s) | Calculs | Formatage | Fallback |
|---------|-----------|---------|-----------|----------|
| **Métriques Vitales** | QuietQuest | Streak, Focus | toLocaleString() | Valeurs par défaut |
| **Quêtes Actives** | QuietQuest | Progression | - | Message si vide |
| **Sport & Santé** | Workout + Garmin | Filtre semaine | toLocaleString() | Warning Garmin |
| **Finances** | Synthèse + Planif | Taux épargne | formatCurrency() | Warning données |
| **Livres** | localStorage | Progression % | - | Warning données |

---

## 🔍 Traçabilité des Données

### Exemple: XP Total

```
1. Source: useQuietQuestEngine()
   └─ userData.currentXP = 12450

2. Hook: useSidebarData()
   └─ metrics.xp = 12450

3. Composant: SidebarPremium.jsx
   └─ {metrics.xp.toLocaleString()}

4. Affichage: "12,450"
```

### Exemple: Streak

```
1. Source: useQuietQuestEngine()
   └─ dailyPerformances = [
        { date: "2025-12-08", successRate: 85 },
        { date: "2025-12-07", successRate: 90 },
        { date: "2025-12-06", successRate: 82 },
        ...
      ]

2. Hook: useSidebarData()
   └─ Calcul:
      • Filtre successRate ≥ 80%
      • Tri par date décroissante
      • Compte jours consécutifs depuis aujourd'hui
      • Résultat: streak = 28

3. Composant: SidebarPremium.jsx
   └─ {metrics.streak}

4. Affichage: "28"
```

---

## ✅ Validation du Flux

### Checklist de Vérification

- [x] Données chargées depuis les sources
- [x] Agrégation dans useSidebarData
- [x] Calculs automatiques fonctionnels
- [x] Formatage appliqué correctement
- [x] Fallbacks en place
- [x] Mise à jour automatique
- [x] Performance optimisée
- [x] Pas de re-renders inutiles

---

**Flux de données validé et fonctionnel ✅**
