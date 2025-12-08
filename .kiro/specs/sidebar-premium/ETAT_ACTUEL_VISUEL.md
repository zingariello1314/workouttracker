# État Actuel Visuel - Sidebar Premium

## Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                    SIDEBAR PREMIUM (300px)                  │
│                                                             │
│  ╔═══════════════════════════════════════════════════════╗ │
│  ║         ZONE STICKY (Reste en haut au scroll)         ║ │
│  ╠═══════════════════════════════════════════════════════╣ │
│  ║                                                       ║ │
│  ║                      23:45                            ║ │ ← Horloge temps réel
│  ║              Samedi 7 Décembre 2024                   ║ │ ← Date
│  ║                                                       ║ │
│  ║  ┌─────────────────────────────────────────────┐     ║ │
│  ║  │     [Avatar]                                │     ║ │
│  ║  │     QuietQuest                              │     ║ │ ← Carte 3D avec tilt
│  ║  │     Développeur Premium                     │     ║ │
│  ║  └─────────────────────────────────────────────┘     ║ │
│  ║                                                       ║ │
│  ║  ┌──────────┬──────────┐                             ║ │
│  ║  │ 🟢 Actif │ ☀️ Jour  │                             ║ │ ← Statuts 2x2
│  ║  ├──────────┼──────────┤                             ║ │
│  ║  │ 📡 Online│ 🔋 87%   │                             ║ │
│  ║  └──────────┴──────────┘                             ║ │
│  ╚═══════════════════════════════════════════════════════╝ │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ⚡ Actions Rapides                              ▼   │   │ ← Section pliable
│  ├─────────────────────────────────────────────────────┤   │
│  │  ┌──────────┬──────────┐                            │   │
│  │  │ 🎯 Focus │ 📚 Lire  │                            │   │ ← Grille 2x2
│  │  ├──────────┼──────────┤                            │   │
│  │  │ 💪 Sport │ 🏆 Quêtes│                            │   │
│  │  └──────────┴──────────┘                            │   │
│  │  ┌───┬───┬───┬───┐                                  │   │
│  │  │💰 │🎬 │📝 │🧘 │                                  │   │ ← Ligne de 4
│  │  └───┴───┴───┴───┘                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 📊 Métriques Vitales                            ▼   │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  ┌──────────┬──────────┐                            │   │
│  │  │ ⭐ 12,450│ 🎖️ 42    │                            │   │ ← Grille 2x2
│  │  │   XP     │  Niveau  │                            │   │
│  │  ├──────────┼──────────┤                            │   │
│  │  │ 🔥 28    │ ⚡ 87%   │                            │   │
│  │  │  Jours   │  Focus   │                            │   │
│  │  └──────────┴──────────┘                            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🎯 Quêtes Actives                          [3]  ▼   │   │
│  ├─────────────────────────────────────────────────────┤   │
│  │  📚 Lire 30 minutes                          75%    │   │
│  │  ████████████████████░░░░░░░                        │   │ ← Barre progression
│  │                                                     │   │
│  │  💪 Entraînement quotidien                  100%    │   │
│  │  ████████████████████████████                       │   │
│  │                                                     │   │
│  │  🎯 Session focus 2h                         45%    │   │
│  │  ████████████░░░░░░░░░░░░░░░░                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│              Plus de sections à venir...                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Comportement du Scroll

```
┌─────────────────────────────────────────────────────────────┐
│  AVANT LE SCROLL                                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ╔═══════════════════════════════════════════════════════╗ │
│  ║  ZONE STICKY - Position: sticky, top: 0               ║ │
│  ║  • Horloge                                            ║ │
│  ║  • Date                                               ║ │
│  ║  • Carte 3D                                           ║ │
│  ║  • Statuts                                            ║ │
│  ╚═══════════════════════════════════════════════════════╝ │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ZONE SCROLLABLE                                    │   │
│  │  • Actions Rapides                                  │   │
│  │  • Métriques Vitales                                │   │
│  │  • Quêtes Actives                                   │   │
│  │  • ... autres sections ...                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  APRÈS LE SCROLL (Page scrollée vers le bas)                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ╔═══════════════════════════════════════════════════════╗ │
│  ║  ZONE STICKY - RESTE EN HAUT ✨                       ║ │
│  ║  • Horloge (toujours visible)                         ║ │
│  ║  • Date (toujours visible)                            ║ │
│  ║  • Carte 3D (toujours visible)                        ║ │
│  ║  • Statuts (toujours visibles)                        ║ │
│  ╚═══════════════════════════════════════════════════════╝ │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ZONE SCROLLABLE - DÉFILE AVEC LA PAGE              │   │
│  │  • ... sections du milieu ...                       │   │
│  │  • ... sections du bas ...                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Effet 3D Tilt sur la Carte

```
┌─────────────────────────────────────────────────────────────┐
│  ÉTAT NORMAL (Pas de survol)                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│         ┌─────────────────────────────┐                     │
│         │                             │                     │
│         │        [Avatar]             │                     │
│         │       QuietQuest            │                     │
│         │  Développeur Premium        │                     │
│         │                             │                     │
│         └─────────────────────────────┘                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  SURVOL EN HAUT À GAUCHE                                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│      ┌─────────────────────────────┐                        │
│     ╱                             ╱                         │
│    ╱      [Avatar]               ╱                          │
│   ╱      QuietQuest             ╱  ← Rotation 3D           │
│  ╱   Développeur Premium       ╱                            │
│ ╱                             ╱                             │
│└─────────────────────────────┘                              │
│  + Overlay holographique                                    │
│  + Légère augmentation de taille (scale 1.02)               │
│  + Ombre portée accentuée                                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  SURVOL EN BAS À DROITE                                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                        ┌─────────────────────────────┐      │
│                       ╱                             ╱       │
│                      ╱      [Avatar]               ╱        │
│                     ╱      QuietQuest             ╱         │
│                    ╱   Développeur Premium       ╱          │
│                   ╱                             ╱           │
│                  └─────────────────────────────┘            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Palette de Couleurs

```
┌─────────────────────────────────────────────────────────────┐
│  DÉGRADÉ SIGNATURE (Textes importants)                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ████████████████████████████████████████████████████████   │
│  Magenta (#ff1493) → Orange (#ff8c00) → Gold (#ffd700)     │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  FOND DE LA SIDEBAR                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ████████████████████████████████████████████████████████   │
│  Bleu foncé (#1a1a2e) → Bleu-noir (#16213e) → Noir (#0f0f23)│
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  COULEURS SECONDAIRES                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🟢 Vert (#22c55e)    - Statut actif, succès               │
│  🔵 Bleu (#3b82f6)    - Informations                        │
│  🟣 Violet (#a855f7)  - Premium, spécial                    │
│  🟡 Jaune (#eab308)   - Avertissements                      │
│  🔴 Rouge (#ef4444)   - Erreurs, urgent                     │
│  🔷 Cyan (#00f5ff)    - Accents, focus                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Animations et Effets

### 1. Effet Tilt 3D
- **Déclencheur**: Survol de la carte développeur
- **Durée**: 0.1s (suivi fluide du curseur)
- **Effet**: Rotation 3D basée sur la position du curseur
- **Retour**: Animation fluide vers la position initiale

### 2. Point Pulsant (Statut Actif)
- **Animation**: Pulse infini (2s)
- **Effet**: Opacité 1 → 0.5 et scale 1 → 1.2
- **Couleur**: Vert (#22c55e)

### 3. Badge de Notification
- **Animation**: Badge-pulse infini (2s)
- **Effet**: Scale 1 → 1.1 avec ombre portée
- **Couleur**: Dégradé signature

### 4. Sections Pliables
- **Animation**: SlideDown (0.3s)
- **Effet**: Opacity 0 → 1 et translateY -10px → 0
- **Symbole**: ▼ (fermé) → ▲ (ouvert) avec rotation 180deg

### 5. Boutons d'Action
- **Hover**: TranslateY -4px avec ombre portée accentuée
- **Active**: TranslateY -2px
- **Overlay**: Apparition progressive de l'overlay holographique

### 6. Barres de Progression
- **Animation**: Transition fluide de la largeur (0.6s)
- **Effet**: Ombre portée avec lueur
- **Couleur**: Dégradé signature

## Responsive

```
┌─────────────────────────────────────────────────────────────┐
│  DESKTOP (> 1024px)                                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┬────────────────────────────────────────────┐ │
│  │          │                                            │ │
│  │ SIDEBAR  │         CONTENU PRINCIPAL                  │ │
│  │  300px   │         (margin-left: 300px)               │ │
│  │          │                                            │ │
│  └──────────┴────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  MOBILE (< 1024px) - À IMPLÉMENTER                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  [☰]  CONTENU PRINCIPAL (Pleine largeur)            │  │
│  │                                                      │  │
│  │  Sidebar masquée par défaut                         │  │
│  │  Accessible via bouton toggle                       │  │
│  │  Affichée en overlay quand ouverte                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Prochaines Étapes Visuelles

1. **Connexion aux Données**
   - Avatar réel depuis IndexedDB
   - Métriques réelles (XP, Level, Streak, Focus)
   - Quêtes actives réelles

2. **Sections Supplémentaires**
   - 15+ sections à implémenter
   - Chaque section avec son design unique
   - Icônes et couleurs spécifiques

3. **Mobile**
   - Bouton toggle hamburger
   - Overlay avec backdrop
   - Animation slide-in/out

4. **Polish**
   - Micro-interactions
   - Sons (optionnel)
   - Haptic feedback (mobile)
