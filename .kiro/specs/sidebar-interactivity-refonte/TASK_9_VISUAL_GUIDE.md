# Guide Visuel - QuestesJourSection

## 🎨 Aperçu de la Section

```
┌─────────────────────────────────────────────┐
│ 🎯 Quêtes du Jour              [3] ▼       │ ← Header cliquable
│                                 ↑            │
│                          Badge cliquable    │
├─────────────────────────────────────────────┤
│                                             │
│ ┌─────────────────────────────────────┐   │
│ │ 📚 Maîtriser JavaScript      85%    │   │ ← Quête cliquable
│ │ ████████████████░░░░░░░░░░░░░░░░░   │   │   avec hover effect
│ └─────────────────────────────────────┘   │
│                                             │
│ ┌─────────────────────────────────────┐   │
│ │ 💪 Sport quotidien          100%    │   │ ← Quête complétée
│ │ ████████████████████████████████████ │   │   avec badge vert
│ │                    ✓ Complétée       │   │
│ └─────────────────────────────────────┘   │
│                                             │
│ ┌─────────────────────────────────────┐   │
│ │ 📖 Lire 30 pages             60%    │   │
│ │ ████████████████░░░░░░░░░░░░░░░░░   │   │
│ └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

## 🖱️ Interactions

### 1. Clic sur le Badge Compteur

```
Avant:                          Après:
┌──────────────────┐           ┌──────────────────┐
│ Quêtes du Jour   │           │ Quêtes du Jour   │
│            [3] ▼ │  ──────>  │            [3] ▼ │
└──────────────────┘           └──────────────────┘
                                        ↓
                               Navigation vers:
                               Onglet Quêtes
                               Filtre: "today"
```

**Effet visuel:**
- Scale(1.15) au hover
- Glow rose intense
- Cursor: pointer

### 2. Clic sur une Quête

```
Avant:                          Après:
┌─────────────────────┐        ┌─────────────────────┐
│ 📚 Maîtriser JS     │        │ 📚 Maîtriser JS     │
│ ████████░░░░░░ 85%  │ ────>  │ ████████░░░░░░ 85%  │
└─────────────────────┘        └─────────────────────┘
                                        ↓
                               Navigation vers:
                               Onglet Quêtes
                               questId: "quest-123"
                               scrollTo: true
                               
                               La quête est scrollée
                               en vue et mise en focus
```

**Effet visuel:**
- TranslateY(-2px) au hover
- Box-shadow avec glow
- Tooltip "Voir dans Quêtes"
- Cursor: pointer

### 3. Quête Complétée

```
État Normal:                    État Complété:
┌─────────────────────┐        ┌─────────────────────┐
│ 💪 Sport quotidien  │        │ 💪 Sport quotidien  │
│ ████████████░░ 60%  │        │ ████████████████ 100%│
│                     │        │      ✓ Complétée    │
└─────────────────────┘        └─────────────────────┘
                                        ↑
                               Badge vert en haut à droite
                               Barre de progression verte
                               Opacité: 0.8
```

## 🎯 États Visuels

### État Normal
```css
.sidebar-quest-item {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 215, 0, 0.15);
  opacity: 1;
}
```

### État Hover
```css
.sidebar-quest-item.clickable:hover {
  transform: translateY(-2px) scale(1.01);
  box-shadow: 
    0 8px 25px rgba(0, 0, 0, 0.4),
    0 0 15px currentColor;
}
```

### État Complété
```css
.sidebar-quest-item.completed {
  opacity: 0.8;
  border-color: rgba(34, 197, 94, 0.3);
}

.sidebar-quest-item.completed .sidebar-quest-progress-bar {
  background: linear-gradient(90deg, #22c55e 0%, #10b981 100%);
}
```

### Badge "Complétée"
```css
.sidebar-quest-completed-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.65rem;
  font-weight: 700;
  border: 1px solid rgba(34, 197, 94, 0.3);
}
```

## 🔍 Tooltips

### Position et Apparence
```
        ┌─────────────────┐
        │ Voir dans Quêtes│ ← Tooltip
        └────────┬────────┘
                 │
        ┌────────▼────────┐
        │ 📚 Maîtriser JS │ ← Quête
        │ ████████░░░ 85% │
        └─────────────────┘
```

**Propriétés:**
- Position: bottom: 100% (au-dessus)
- Transform: translateX(-50%) translateY(-12px)
- Opacity: 0 → 1 au hover
- Transition: 0.3s ease
- Background: rgba(0, 0, 0, 0.9)
- Color: white
- Padding: 6px 12px
- Border-radius: 6px

## ⌨️ Navigation Clavier

### Ordre de Tabulation
```
1. Header de la section
   ↓ Tab
2. Badge compteur [3]
   ↓ Tab
3. Première quête
   ↓ Tab
4. Deuxième quête
   ↓ Tab
5. Troisième quête
   ↓ Tab
6. Section suivante...
```

### Actions Clavier
- **Enter** ou **Space** sur le header → Toggle la section
- **Enter** ou **Space** sur le badge → Navigation vers Quêtes (filter: today)
- **Enter** ou **Space** sur une quête → Navigation vers détail de la quête

## 📱 Responsive

### Desktop (> 1024px)
- Quêtes en pleine largeur
- Hover effects complets
- Tooltips visibles

### Tablet (768px - 1024px)
- Quêtes en pleine largeur
- Hover effects réduits
- Tooltips adaptés

### Mobile (< 768px)
- Quêtes en pleine largeur
- Pas d'hover (touch)
- Tooltips au tap
- Transform réduit: translateY(-1px) scale(1.005)

## 🎨 Palette de Couleurs

### Quête Normale
- Border: rgba(255, 215, 0, 0.15) (or pâle)
- Background: rgba(255, 255, 255, 0.03)
- Progress bar: gradient signature (rose/violet)

### Quête Complétée
- Border: rgba(34, 197, 94, 0.3) (vert)
- Background: rgba(255, 255, 255, 0.03)
- Progress bar: linear-gradient(90deg, #22c55e, #10b981) (vert)
- Badge: rgba(34, 197, 94, 0.2) background, #22c55e text

### Badge Compteur
- Background: gradient signature (rose/violet)
- Hover: linear-gradient(135deg, #ff1493, #ff69b4)
- Glow: 0 0 20px rgba(255, 20, 147, 1)

## 🔄 Animations

### Badge Pulse (par défaut)
```css
@keyframes badge-pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 5px rgba(255, 20, 147, 0.5);
  }
  50% {
    transform: scale(1.1);
    box-shadow: 0 0 15px rgba(255, 20, 147, 0.8);
  }
}
```

### Navigate Pulse (au clic)
```css
@keyframes navigate-pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(0.98);
  }
}
```

## 🎯 Points Clés

1. **Chaque quête est cliquable** → Navigation contextuelle
2. **Badge compteur cliquable** → Vue d'ensemble des quêtes du jour
3. **Badge "Complétée"** → Feedback visuel immédiat
4. **Tooltips informatifs** → Guidance utilisateur
5. **Accessibilité complète** → Clavier + screen readers
6. **Feedback visuel riche** → Hover, transform, glow
7. **Responsive** → Adapté à tous les écrans

## 🚀 Expérience Utilisateur

L'utilisateur peut maintenant:
- ✅ Voir d'un coup d'œil ses quêtes du jour
- ✅ Cliquer sur une quête pour voir les détails
- ✅ Cliquer sur le badge pour voir toutes les quêtes
- ✅ Identifier rapidement les quêtes complétées
- ✅ Naviguer au clavier
- ✅ Comprendre où il va grâce aux tooltips
- ✅ Bénéficier d'un feedback visuel riche
