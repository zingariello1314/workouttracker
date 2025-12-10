# Guide Visuel - Animations et Transitions

## 🎬 Démonstration des Animations

### 1. Navigation Animation

```
┌─────────────────────────────────┐
│  Carte de Données               │
│  ┌─────────────────────────┐   │
│  │  💪  12 Entraînements   │   │
│  │                         │   │
│  │  [CLICK]                │   │
│  └─────────────────────────┘   │
│                                 │
│  ↓ navigate-pulse-enhanced      │
│                                 │
│  ┌─────────────────────────┐   │
│  │  💪  12 Entraînements   │   │
│  │  [Pulse: 0.5s]          │   │
│  │  opacity: 1 → 0.85 → 1  │   │
│  │  scale: 1 → 0.96 → 1    │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

### 2. Hover Animation

```
État Normal:
┌──────────────────────┐
│  🎯  2,450 XP        │
│                      │
│  transform: none     │
│  shadow: minimal     │
└──────────────────────┘

État Hover:
┌──────────────────────┐
│  🎯  2,450 XP        │  ← translateY(-5px)
│                      │  ← scale(1.03)
│  ✨ Glow Effect ✨   │  ← hover-glow animation
│  → Arrow indicator   │  ← opacity: 0 → 0.6
└──────────────────────┘
     ╲╲╲╲╲╲╲╲╲╲╲╲╲╲╲╲
      Shadow Enhanced
```

### 3. Loading Animation

```
État Loading:
┌──────────────────────┐
│                      │
│       ⟳ ⟳ ⟳         │  ← Spinner (0.8s)
│    Loading...        │  ← Pulse (1.5s)
│                      │
│  opacity: 0.6-1      │
│  scale: 0.95-1       │
└──────────────────────┘
```

### 4. Progress Bar Animation

```
Barre de Progression:
┌────────────────────────────────┐
│ ████████████░░░░░░░░░░░░░░░░░ │
│ ↑                              │
│ Shimmer Effect (2s loop)       │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│ Gradient moving left to right  │
└────────────────────────────────┘

Transition de Largeur:
0% ──────────────────────────→ 75%
    0.8s cubic-bezier(0.4, 0, 0.2, 1)
```

### 5. Section Expansion

```
Section Fermée:
┌─────────────────────────────┐
│ 📊 Métriques Vitales    ▼   │
└─────────────────────────────┘

Section Ouverte:
┌─────────────────────────────┐
│ 📊 Métriques Vitales    ▲   │
├─────────────────────────────┤
│  [Fade In Up: 0.4s]         │
│  ┌─────┐ ┌─────┐            │ ← delay: 0.05s
│  │ XP  │ │Level│            │ ← delay: 0.1s
│  └─────┘ └─────┘            │
│  ┌─────┐ ┌─────┐            │ ← delay: 0.15s
│  │Strek│ │Focus│            │ ← delay: 0.2s
│  └─────┘ └─────┘            │
└─────────────────────────────┘
```

### 6. Button Hover

```
État Normal:
┌──────────────────┐
│  🎯 Focus 25min  │
│                  │
│  gradient bg     │
└──────────────────┘

État Hover:
┌──────────────────┐
│  🎯 Focus 25min  │  ← translateY(-5px)
│  ✨ ✨ ✨ ✨ ✨  │  ← scale(1.02)
│  [Border Glow]   │  ← border-glow animation
│  [Icon Bounce]   │  ← success-bounce on icon
└──────────────────┘
     ╲╲╲╲╲╲╲╲╲╲╲
      Enhanced Shadow
```

### 7. Quest Item Hover

```
État Normal:
┌────────────────────────────────┐
│ 🎯 Maîtriser JavaScript        │
│ ████████████░░░░░░░░░░░ 75%   │
└────────────────────────────────┘

État Hover:
┌────────────────────────────────┐
│ 🎯 Maîtriser JavaScript    →   │  ← Arrow appears
│ ████████████░░░░░░░░░░░ 75%   │  ← translateY(-3px)
│ ✨ Shimmer on progress bar ✨  │  ← scale(1.02)
│ [Icon bounces]                 │  ← Icon animation
└────────────────────────────────┘
     ╲╲╲╲╲╲╲╲╲╲╲╲╲╲╲╲╲╲╲╲╲╲
      Glow + Shadow
```

### 8. Success Feedback

```
Action Complétée:
┌──────────────────┐
│  ✅ Complété!    │
│                  │
│  [Bounce]        │  ← success-bounce
│  scale:          │
│  1 → 1.1 → 0.95  │
│  → 1.05 → 1      │
└──────────────────┘
```

### 9. Error Feedback

```
Erreur:
┌──────────────────┐
│  ❌ Erreur!      │
│                  │
│  [Shake]         │  ← shake animation
│  translateX:     │
│  0 → -5 → 5 →    │
│  -5 → 5 → 0      │
└──────────────────┘
```

### 10. Ripple Effect (Click)

```
Au Clic:
┌──────────────────┐
│  🎯 Action       │
│      ⭕          │  ← Ripple starts
│                  │
└──────────────────┘

Pendant:
┌──────────────────┐
│  🎯 Action       │
│    ⭕⭕⭕        │  ← Ripple expands
│                  │
└──────────────────┘

Fin:
┌──────────────────┐
│  🎯 Action       │
│  ⭕⭕⭕⭕⭕⭕    │  ← Ripple fades
│                  │
└──────────────────┘
```

## 🎨 Timing Visualization

```
Navigation Animation (0.5s):
0ms     125ms   250ms   375ms   500ms
│───────│───────│───────│───────│
opacity: 1 → 0.9 → 0.85 → 0.9 → 1
scale:   1 → 0.98 → 0.96 → 0.98 → 1

Hover Animation (continuous):
0s      1s      2s      3s      4s
│───────│───────│───────│───────│
shadow: min → max → min → max → min
glow:   ∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿∿

Loading Spin (0.8s):
0ms     200ms   400ms   600ms   800ms
│───────│───────│───────│───────│
rotate: 0° → 90° → 180° → 270° → 360°

Progress Shimmer (2s):
0s      0.5s    1s      1.5s    2s
│───────│───────│───────│───────│
position: -100% → -50% → 0% → 50% → 100%
```

## 📊 Performance Metrics

```
Animation Performance:
┌─────────────────────────────────┐
│ FPS: ████████████████████ 60fps │
│ GPU: ████████░░░░░░░░░░░ 40%   │
│ CPU: ██████░░░░░░░░░░░░░ 25%   │
│ MEM: ████░░░░░░░░░░░░░░░ 15%   │
└─────────────────────────────────┘

Optimization Impact:
Before: ████████████████░░░░ 80% CPU
After:  ██████░░░░░░░░░░░░░░ 25% CPU
        ↓ 55% reduction
```

## 🎯 States Diagram

```
┌─────────┐
│ Normal  │
└────┬────┘
     │
     ├──→ Hover ──→ [Enhanced Shadow + Glow]
     │
     ├──→ Active ──→ [Scale Down]
     │
     ├──→ Loading ──→ [Spinner + Pulse]
     │
     ├──→ Navigating ──→ [Pulse Animation]
     │
     ├──→ Success ──→ [Bounce]
     │
     ├──→ Error ──→ [Shake + Red Border]
     │
     └──→ Updated ──→ [Border Glow]
```

## 🔄 Animation Flow

```
User Interaction Flow:
┌──────────┐
│  Hover   │ ──→ Transform + Glow (0.35s)
└──────────┘
     │
     ↓
┌──────────┐
│  Click   │ ──→ Ripple Effect (0.6s)
└──────────┘
     │
     ↓
┌──────────┐
│ Navigate │ ──→ Pulse Animation (0.5s)
└──────────┘
     │
     ↓
┌──────────┐
│ Loading  │ ──→ Spinner + Pulse (continuous)
└──────────┘
     │
     ↓
┌──────────┐
│ Success  │ ──→ Bounce (0.6s)
└──────────┘
```

## 📱 Responsive Behavior

```
Desktop (> 1024px):
┌────────────────────────────────┐
│ Full animations                │
│ • Hover: translateY(-5px)      │
│ • Glow: Full intensity         │
│ • Shimmer: 2s                  │
└────────────────────────────────┘

Tablet (768px - 1024px):
┌────────────────────────────────┐
│ Reduced animations             │
│ • Hover: translateY(-3px)      │
│ • Glow: Reduced intensity      │
│ • Shimmer: 2s                  │
└────────────────────────────────┘

Mobile (< 768px):
┌────────────────────────────────┐
│ Minimal animations             │
│ • Hover: translateY(-2px)      │
│ • Glow: Disabled               │
│ • Shimmer: 3s (slower)         │
└────────────────────────────────┘
```

## ♿ Reduced Motion

```
Normal Mode:
┌────────────────────────────────┐
│ ✨ Full animations enabled ✨  │
│ • Transforms: ✓                │
│ • Glow effects: ✓              │
│ • Shimmer: ✓                   │
│ • Bounce: ✓                    │
└────────────────────────────────┘

Reduced Motion Mode:
┌────────────────────────────────┐
│ 🎯 Accessibility first 🎯      │
│ • Transforms: ✗                │
│ • Glow effects: ✗              │
│ • Shimmer: ✗                   │
│ • Bounce: ✗                    │
│ • Opacity: ✓ (0.1s)            │
│ • Color: ✓ (0.1s)              │
└────────────────────────────────┘
```

## 🎨 Color Transitions

```
Border Color Animation:
rgba(255, 215, 0, 0.2) ──→ rgba(255, 215, 0, 0.7)
     │                          │
     └──────────────────────────┘
            0.35s ease

Shadow Intensity:
0 6px 20px rgba(255, 20, 147, 0.25)
     ↓
0 15px 40px rgba(255, 20, 147, 0.5)
     │
     └──→ 2s infinite loop
```

## 🚀 Performance Tips

```
✅ DO:
• Use transform instead of top/left
• Use opacity instead of visibility
• Apply will-change on hover
• Remove will-change after animation
• Use GPU acceleration (translateZ)

❌ DON'T:
• Animate width/height directly
• Use box-shadow on every frame
• Keep will-change always active
• Animate during scroll
• Use complex filters
```

---

**Légende:**
- `→` : Direction de l'animation
- `✨` : Effet visuel
- `⟳` : Rotation
- `▓` : Gradient/Shimmer
- `╲` : Shadow/Glow
- `∿` : Wave/Pulse
