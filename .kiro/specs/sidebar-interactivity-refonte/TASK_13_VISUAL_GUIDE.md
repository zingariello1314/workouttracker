# Task 13: ActionsRapidesSection - Guide Visuel de Test

## Vue d'Ensemble

```
┌─────────────────────────────────────────┐
│  ⚡ Actions Rapides               ▼    │
├─────────────────────────────────────────┤
│                                         │
│  ┌──────────────┐  ┌──────────────┐   │
│  │   🎯         │  │   📖         │   │
│  │ Focus 25min  │  │ Lire +Pages  │   │
│  └──────────────┘  └──────────────┘   │
│                                         │
│  ┌──────────────┐  ┌──────────────┐   │
│  │   💪         │  │   ✅         │   │
│  │   Sport      │  │   Quêtes     │   │
│  └──────────────┘  └──────────────┘   │
│                                         │
│  ┌────┐ ┌────┐ ┌────┐ ┌────┐         │
│  │💰  │ │📊  │ │🍽️  │ │⚙️  │         │
│  │+Rev│ │+Dép│ │+Rep│ │Rég │         │
│  └────┘ └────┘ └────┘ └────┘         │
└─────────────────────────────────────────┘
```

## Boutons Principaux (2x2)

### 1. Focus 25min 🎯
**Action:** Démarre Pomodoro + Navigation
```
Clic → startPomodoroSession(25) → navigation.toFocus()
```
**État:** Désactivé si session active
**Destination:** Onglet "Aujourd'hui" (Focus)

### 2. Lire +Pages 📖
**Action:** Ouvre modal d'ajout de pages
```
Clic → navigation.toBooks({ action: 'addPages' })
```
**Destination:** Onglet "Livres" avec modal ouverte

### 3. Sport 💪
**Action:** Ouvre modal de nouvelle séance
```
Clic → navigation.toSport({ action: 'newWorkout' })
```
**Destination:** Onglet "Aujourd'hui" avec modal ouverte

### 4. Quêtes ✅
**Action:** Affiche quêtes du jour
```
Clic → navigation.toQuests({ filter: 'today' })
```
**Destination:** Onglet "Quêtes" filtré sur aujourd'hui

## Boutons Secondaires (1x4)

### 5. +Revenu 💰
**Action:** Ouvre formulaire d'ajout de revenu
```
Clic → navigation.toFinancePlanificateur({ action: 'addRevenue' })
```
**Destination:** Finance > Planificateur > Ajout Revenu

### 6. +Dépense 📊
**Action:** Ouvre formulaire d'ajout de dépense
```
Clic → navigation.toFinancePlanificateur({ action: 'addExpense' })
```
**Destination:** Finance > Planificateur > Ajout Dépense

### 7. +Repas 🍽️
**Action:** Ouvre formulaire d'ajout de repas
```
Clic → navigation.toNutrition({ action: 'addMeal' })
```
**Destination:** Nutrition > Ajout Repas

### 8. Réglages ⚙️
**Action:** Ouvre les paramètres
```
Clic → navigation.toSettings()
```
**Destination:** Onglet "Paramètres"

## Effets Visuels

### Hover (Desktop)
```css
transform: translateY(-4px);
box-shadow: 0 8px 25px rgba(255, 20, 147, 0.4);
border-color: rgba(255, 215, 0, 0.6);
```

### Active (Clic)
```css
transform: translateY(-2px);
```

### Disabled (Focus actif)
```css
opacity: 0.5;
cursor: not-allowed;
```

### Focus Clavier
```css
outline: 3px solid var(--sidebar-cyan);
outline-offset: 2px;
box-shadow: 0 0 12px rgba(0, 245, 255, 0.8);
```

## Responsive Breakpoints

### Desktop (> 1024px)
```
Principaux: 2x2 (80px hauteur)
Secondaires: 1x4 (60px hauteur)
```

### Tablet (768px - 1024px)
```
Principaux: 2x2 (70px hauteur)
Secondaires: 1x4 (55px hauteur)
```

### Mobile (< 768px)
```
Principaux: 2x2 (70px hauteur)
Secondaires: 2x2 (55px hauteur)
```

### Mobile Petit (< 375px)
```
Principaux: 2x2 (65px hauteur)
Secondaires: 2x2 (55px hauteur)
Icônes et textes réduits
```

## Tests de Navigation

### Test 1: Focus
1. Cliquer sur "Focus 25min"
2. ✅ Timer Pomodoro démarre (25:00)
3. ✅ Navigation vers onglet "Aujourd'hui"
4. ✅ Bouton devient désactivé (grisé)

### Test 2: Lecture
1. Cliquer sur "Lire +Pages"
2. ✅ Navigation vers onglet "Livres"
3. ✅ Modal d'ajout de pages s'ouvre
4. ✅ Focus sur le champ de saisie

### Test 3: Sport
1. Cliquer sur "Sport"
2. ✅ Navigation vers onglet "Aujourd'hui"
3. ✅ Modal de nouvelle séance s'ouvre
4. ✅ Formulaire prêt à remplir

### Test 4: Quêtes
1. Cliquer sur "Quêtes"
2. ✅ Navigation vers onglet "Quêtes"
3. ✅ Filtre "Aujourd'hui" appliqué
4. ✅ Seules les quêtes du jour affichées

### Test 5: Finance
1. Cliquer sur "+Revenu"
2. ✅ Navigation vers Finance > Planificateur
3. ✅ Formulaire d'ajout de revenu ouvert

1. Cliquer sur "+Dépense"
2. ✅ Navigation vers Finance > Planificateur
3. ✅ Formulaire d'ajout de dépense ouvert

### Test 6: Nutrition
1. Cliquer sur "+Repas"
2. ✅ Navigation vers Nutrition
3. ✅ Formulaire d'ajout de repas ouvert

### Test 7: Paramètres
1. Cliquer sur "Réglages"
2. ✅ Navigation vers onglet "Paramètres"

## Tests d'Accessibilité

### Navigation Clavier
```
Tab → Focus sur premier bouton (Focus 25min)
Tab → Focus sur deuxième bouton (Lire +Pages)
Tab → Focus sur troisième bouton (Sport)
Tab → Focus sur quatrième bouton (Quêtes)
Tab → Focus sur cinquième bouton (+Revenu)
Tab → Focus sur sixième bouton (+Dépense)
Tab → Focus sur septième bouton (+Repas)
Tab → Focus sur huitième bouton (Réglages)
```

### Activation Clavier
```
Enter → Active le bouton
Space → Active le bouton
```

### Screen Reader
```
"Focus 25min, bouton, Démarrer une session Pomodoro de 25 minutes"
"Lire +Pages, bouton, Ajouter des pages lues"
"Sport, bouton, Ajouter une nouvelle séance de sport"
"Quêtes, bouton, Voir les quêtes du jour"
"+Revenu, bouton, Ajouter un revenu"
"+Dépense, bouton, Ajouter une dépense"
"+Repas, bouton, Ajouter un repas"
"Réglages, bouton, Ouvrir les paramètres"
```

## Tests de Performance

### Métriques Attendues
- Temps de rendu initial: < 16ms
- Temps de réponse au clic: < 100ms
- Animation hover: 60fps
- Pas de layout shift

### Outils de Test
```bash
# Chrome DevTools
1. Ouvrir Performance tab
2. Enregistrer interaction
3. Vérifier FPS > 60
4. Vérifier pas de long tasks

# Lighthouse
1. Ouvrir Lighthouse
2. Catégorie: Accessibilité
3. Score attendu: > 95
```

## Checklist de Validation

### Fonctionnalité
- [ ] Tous les boutons sont cliquables
- [ ] Toutes les navigations fonctionnent
- [ ] Bouton Focus se désactive quand actif
- [ ] Paramètres sont passés correctement

### Visuel
- [ ] Layout correct sur tous les breakpoints
- [ ] Effets hover fonctionnent
- [ ] Animations fluides
- [ ] Couleurs et contrastes corrects

### Accessibilité
- [ ] Navigation clavier fonctionne
- [ ] Focus visible sur tous les boutons
- [ ] ARIA labels corrects
- [ ] Screen reader compatible

### Performance
- [ ] Pas de lag au hover
- [ ] Animations à 60fps
- [ ] Pas de re-render inutile
- [ ] Temps de réponse < 100ms

## Bugs Connus

Aucun bug connu pour le moment.

## Notes de Déploiement

1. Vérifier que `QuickActionsContext` est bien dans le provider tree
2. Vérifier que `useNavigation` gère tous les paramètres
3. Tester sur tous les navigateurs (Chrome, Firefox, Safari, Edge)
4. Tester sur mobile réel (iOS, Android)

## Support

Pour toute question ou problème:
1. Vérifier la console pour les erreurs
2. Vérifier que les hooks sont bien importés
3. Vérifier que les paramètres de navigation sont corrects
4. Consulter TASK_13_COMPLETE.md pour plus de détails
