
# 📋 DOCUMENTATION COMPLÈTE DE LA SIDEBAR QUIETQUEST

## 🎯 Vue d'ensemble

La sidebar QuietQuest est un composant Vue 3 premium qui affiche toutes les informations vitales de l'utilisateur dans une interface cyberpunk élégante. Elle mesure **300px de largeur** (18.75rem) et occupe toute la hauteur de l'écran avec un système de scroll interne.

---

## 🎨 DESIGN GÉNÉRAL

### Dimensions et Structure
- **Largeur**: 300px (18.75rem) - fixe
- **Hauteur**: 100vh - pleine hauteur de l'écran
- **Position**: Fixée à gauche de l'écran
- **Z-index**: 900 (au-dessus du contenu principal)
- **Border-radius**: 0 12px 12px 0 (coins arrondis à droite)

### Palette de Couleurs Principale

#### Dégradés de fond
```css
background: linear-gradient(180deg, 
  #1a1a2e 0%,      /* Bleu-noir foncé en haut */
  #16213e 50%,     /* Bleu marine au milieu */
  #0f0f23 100%     /* Noir profond en bas */
);
```

#### Couleurs d'accentuation (Thème Magenta-Orange-Or)
- **Magenta**: #ff1493 (Deep Pink) - Couleur primaire
- **Orange**: #ff8c00 (Dark Orange) - Couleur secondaire
- **Or**: #ffd700 (Gold) - Couleur tertiaire
- **Cyan**: #00f5ff - Accents technologiques

#### Bordures
- **Bordure principale**: 2px solid rgba(255, 215, 0, 0.2) - Or semi-transparent
- **Bordures internes**: 1px solid rgba(255, 215, 0, 0.3)

### Effets Visuels Globaux
- **Backdrop-filter**: blur(15px) - Effet de flou d'arrière-plan
- **Box-shadow**: 2px 0 30px rgba(0, 0, 0, 0.5) - Ombre portée profonde

---

## 📦 STRUCTURE HIÉRARCHIQUE


```
.sidebar-premium (Conteneur principal)
├── .clock-section (Zone fixe en haut - NON scrollable)
│   ├── .time-date-block (Bloc encadré heure/date)
│   │   ├── .time-display (Heure avec effets)
│   │   │   ├── .time-main (Texte principal)
│   │   │   ├── .time-shadow (Ombre)
│   │   │   └── .time-glow (Lueur)
│   │   └── .date-display (Date avec effets)
│   │       ├── .date-main
│   │       ├── .date-shadow
│   │       └── .date-glow
│   ├── <profile-card-component> (Carte développeur 3D)
│   └── .system-status (Grille 2x2 des statuts)
│       ├── .status-item.active
│       ├── .status-item.night
│       ├── .status-item.connected
│       └── .status-item.focus
│
├── .sidebar-content (Zone scrollable)
│   ├── .section-container (Actions Rapides)
│   ├── .section-container (Métriques Vitales)
│   ├── .section-container (Quêtes Actives)
│   ├── .section-container (Sport & Santé)
│   ├── .section-container (Apprentissage)
│   ├── .section-container (Livres)
│   ├── .section-container (Finances)
│   ├── .section-container (Journal & Films)
│   ├── .section-container (Session Focus)
│   ├── .section-container (Achievements)
│   ├── .section-container (Focus RPG)
│   ├── .section-container (Objectifs du Jour)
│   ├── .section-container (Notifications)
│   ├── .section-container (Météo)
│   ├── .section-container (Motivation)
│   ├── .section-container (Récompenses)
│   ├── .section-container (Historique)
│   ├── .section-container (Paramètres Rapides)
│   ├── .section-container (Prédictions IA)
│   └── .section-container (Statistiques Globales)
│
└── .sidebar-footer (Pied de page fixe)
    └── .footer-content
```

---

## ⏰ SECTION 1: HORLOGE & STATUT GLOBAL

### Position et Dimensions
- **Position**: Fixe en haut, non-scrollable
- **Padding**: 16px 15px (1rem 0.9375rem)
- **Min-height**: 100px (6.25rem)
- **Margin**: -10px -10px 0 -10px (pour toucher les bords)

### Background
```css
background: linear-gradient(135deg, 
  rgba(10, 10, 15, 0.95) 0%, 
  rgba(5, 5, 10, 0.98) 100%
);
```

### Bordure inférieure
- **Border-bottom**: 1px solid rgba(255, 215, 0, 0.3)


### 🕐 Bloc Heure/Date (.time-date-block)

#### Dimensions et Positionnement
- **Padding**: 12px 15px
- **Margin**: 70px 0 45px 0 (espace pour le laser au-dessus, espace pour la carte en dessous)
- **Border-radius**: 15px
- **Border**: 2px solid #ffd700 (or)

#### Background avec dégradé triple
```css
background: linear-gradient(135deg, 
  rgba(255, 20, 147, 0.15) 0%,    /* Magenta */
  rgba(255, 140, 0, 0.1) 50%,     /* Orange */
  rgba(255, 215, 0, 0.15) 100%    /* Or */
);
```

#### Effets visuels
- **Backdrop-filter**: blur(10px)
- **Box-shadow**: 
  - 0 0 20px rgba(255, 215, 0, 0.3) - Lueur externe
  - 0 4px 15px rgba(255, 215, 0, 0.2) - Ombre portée
  - inset 0 0 20px rgba(255, 215, 0, 0.1) - Lueur interne

#### 🔢 Affichage de l'heure (.time-display)

**Police**: 'Tanker', 'Rajdhani', sans-serif
**Taille**: 2.4rem (environ 38px)
**Poids**: 400 (Regular)
**Letter-spacing**: 0.02em

**Dégradé de texte** (identique au logo):
```css
background: linear-gradient(180deg,
  #ff1493 0%,    /* Magenta en haut */
  #ff8c00 50%,   /* Orange au milieu */
  #ffd700 100%   /* Or en bas */
);
background-clip: text;
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
```

**Effets de profondeur** (3 couches):
1. `.time-main` - Texte principal avec dégradé
2. `.time-shadow` - Ombre floue (opacity: 0.2, blur: 2px)
3. `.time-glow` - Lueur diffuse (opacity: 0.4, blur: 4px)

**Text-shadow**: 0 0 20px rgba(255, 20, 147, 0.4)

#### 📅 Affichage de la date (.date-display)

**Police**: 'Tanker', 'Rajdhani', sans-serif
**Taille**: 1rem (16px)
**Poids**: 400
**Letter-spacing**: 0.1em
**Text-transform**: uppercase

**Même dégradé** que l'heure (Magenta → Orange → Or)

**Effets de profondeur** (3 couches):
1. `.date-main` - Texte principal
2. `.date-shadow` - Ombre (opacity: 0.1, blur: 1px)
3. `.date-glow` - Lueur (opacity: 0.3, blur: 3px)

**Margin-bottom**: 0 (collé au bas du bloc)


### 👤 CARTE DÉVELOPPEUR (ProfileCardComponent)

#### Dimensions
- **Largeur**: Adaptative (environ 260px dans la sidebar)
- **Hauteur**: Environ 180px
- **Margin-top**: 2.8rem (équidistant entre heure et statuts)

#### Structure 3D avec effets holographiques

La carte utilise un système de couches superposées:

1. **Couche d'images en couleur** (.pc-images-layer)
   - Avatar principal (main-avatar)
   - Mini-avatar avec informations utilisateur

2. **Effets holographiques** (par-dessus)
   - .pc-shine - Effet de brillance
   - .pc-glare - Effet d'éblouissement

3. **Contenu texte** (.pc-content)
   - Nom de l'utilisateur
   - Titre/profession

#### Avatar Principal (.main-avatar)
- **Dimensions**: Variable selon le design de la carte
- **Border-radius**: Généralement circulaire ou légèrement arrondi
- **Transition**: opacity 0.4s, transform 0.4s
- **Source**: Chargée depuis IndexedDB via ProfileImageManager

#### Mini-avatar et infos utilisateur (.mini-user-info)
- **Position**: En bas de la carte
- **Background**: Semi-transparent avec blur
- **Contenu**:
  - Photo miniature (mini-avatar)
  - Handle (@username)
  - Statut (En ligne/Hors ligne)

#### Texte de la carte
**Nom** (h3):
- **Police**: Héritée du système
- **Taille**: ~1.2rem
- **Couleur**: Blanc avec ombre

**Titre** (p):
- **Taille**: ~0.9rem
- **Couleur**: Gris clair
- **Exemple**: "Développeur"

#### Effets interactifs (Tilt 3D)

La carte réagit au mouvement de la souris avec un effet de parallaxe 3D:

**Variables CSS dynamiques**:
- `--pointer-x`: Position X du curseur (%)
- `--pointer-y`: Position Y du curseur (%)
- `--rotate-x`: Rotation sur l'axe X (deg)
- `--rotate-y`: Rotation sur l'axe Y (deg)
- `--pointer-from-center`: Distance du centre (0-1)

**Rotation maximale**:
- X: ±(centerX / 5) degrés
- Y: ±(centerY / 4) degrés

**Animation de retour**:
- Durée: 600ms
- Easing: cubic-bezier (ease-in-out-cubic)

**Dégradés dynamiques**:
```css
--behind-gradient: radial-gradient(
  farthest-side circle at var(--pointer-x) var(--pointer-y),
  hsla(266,100%,90%,var(--card-opacity)) 4%,
  hsla(266,50%,80%,calc(var(--card-opacity)*0.75)) 10%,
  hsla(266,25%,70%,calc(var(--card-opacity)*0.5)) 50%,
  hsla(266,0%,60%,0) 100%
);
```


### 📊 STATUTS SYSTÈME (.system-status)

#### Layout
- **Display**: grid
- **Grid-template-columns**: 1fr 1fr (2 colonnes égales)
- **Gap**: 8px (0.5rem)
- **Margin-top**: 2.8rem (équidistant de la carte de profil)

#### Chaque statut (.status-item)

**Dimensions**:
- **Padding**: 8px (0.5rem)
- **Border-radius**: 6px (0.375rem)
- **Border**: 1px solid (couleur variable)

**Typographie**:
- **Font-size**: 0.7rem
- **Font-weight**: 600
- **Text-transform**: uppercase
- **Letter-spacing**: 0.5px (0.03125rem)

**Layout interne**:
- **Display**: flex
- **Align-items**: center
- **Gap**: 6px (0.375rem)

#### Variantes de couleurs

**1. SYSTÈME ACTIF (.status-item.active)**
```css
background: rgba(34, 197, 94, 0.2);    /* Vert semi-transparent */
border: 1px solid rgba(34, 197, 94, 0.3);
color: #22c55e;                         /* Vert vif */
```
- Icône: Point pulsant (.status-dot)
  - Width/Height: 8px
  - Background: #22c55e
  - Border-radius: 50%
  - Animation: pulse-dot 2s infinite

**2. MODE NUIT (.status-item.night)**
```css
background: rgba(59, 130, 246, 0.2);   /* Bleu semi-transparent */
border: 1px solid rgba(59, 130, 246, 0.3);
color: #3b82f6;                         /* Bleu vif */
```
- Icône: 🌙 (emoji lune)

**3. CONNECTÉ (.status-item.connected)**
```css
background: rgba(168, 85, 247, 0.2);   /* Violet semi-transparent */
border: 1px solid rgba(168, 85, 247, 0.3);
color: #a855f7;                         /* Violet vif */
```
- Icône: 📶 (emoji signal)

**4. FOCUS (.status-item.focus)**
```css
background: rgba(34, 197, 94, 0.2);    /* Vert semi-transparent */
border: 1px solid rgba(34, 197, 94, 0.3);
color: #22c55e;                         /* Vert vif */
```
- Texte: "FOCUS 87%" (pourcentage dynamique)
- Icône: 🔋 (emoji batterie)

---

## 📜 SECTION 2: CONTENU SCROLLABLE (.sidebar-content)

### Propriétés générales
- **Flex**: 1 (prend tout l'espace disponible)
- **Padding**: 8px 0
- **Margin**: 0 -10px (pour toucher les bords)
- **Overflow-y**: visible (scroll automatique si nécessaire)

### Scrollbar personnalisée
```css
.sidebar-content::-webkit-scrollbar {
  width: 6px;
}

.sidebar-content::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-content::-webkit-scrollbar-thumb {
  background: rgba(0, 245, 255, 0.3);  /* Cyan semi-transparent */
  border-radius: 3px;
}

.sidebar-content::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 245, 255, 0.5);  /* Plus opaque au survol */
}
```


### 📦 STRUCTURE DES SECTIONS (.section-container)

Toutes les sections suivent le même pattern de base:

#### Conteneur de section
```css
.section-container {
  margin-bottom: 8px;
  margin-left: 10px;
  margin-right: 10px;
  background: linear-gradient(135deg, 
    rgba(255, 20, 147, 0.08) 0%,      /* Magenta léger */
    rgba(15, 15, 25, 0.6) 30%,        /* Noir central */
    rgba(255, 140, 0, 0.05) 70%,      /* Orange léger */
    rgba(255, 215, 0, 0.08) 100%      /* Or léger */
  );
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 10px;
  backdrop-filter: blur(10px);
  overflow: hidden;
  box-shadow: 
    0 2px 8px rgba(255, 20, 147, 0.1),
    inset 0 1px 0 rgba(255, 215, 0, 0.1);
}
```

#### En-tête de section (.section-header)

**Layout**:
```css
display: flex !important;
align-items: center !important;
justify-content: space-between !important;
padding: 6px 8px !important;
min-height: 28px !important;
```

**Background avec dégradé**:
```css
background: linear-gradient(135deg, 
  rgba(255, 20, 147, 0.1) 0%,
  rgba(255, 140, 0, 0.05) 50%,
  rgba(255, 215, 0, 0.08) 100%
) !important;
```

**Bordure inférieure**:
```css
border-bottom: 1px solid rgba(255, 215, 0, 0.3) !important;
```

**Effet de balayage au survol** (::before):
```css
.section-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(255, 20, 147, 0.2), 
    rgba(255, 140, 0, 0.1),
    transparent
  );
  transition: left 0.6s ease;
  z-index: 1;
}

.section-header:hover::before {
  left: 100%;  /* Balayage de gauche à droite */
}
```

**État hover**:
```css
.section-header:hover {
  background: linear-gradient(135deg, 
    rgba(255, 20, 147, 0.15) 0%,
    rgba(255, 140, 0, 0.08) 50%,
    rgba(255, 215, 0, 0.12) 100%
  );
  border-bottom-color: rgba(255, 215, 0, 0.5);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(255, 20, 147, 0.2);
}
```


#### Titre de section (.section-title)

**Typographie**:
```css
font-size: 0.75rem !important;
font-weight: 800 !important;
text-transform: uppercase;
letter-spacing: 0.8px !important;
line-height: 1 !important;
margin: 0 !important;
```

**Dégradé de texte** (thème signature):
```css
background: linear-gradient(180deg,
  #ff1493 0%,    /* Magenta */
  #ff8c00 50%,   /* Orange */
  #ffd700 100%   /* Or */
);
background-clip: text;
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
text-shadow: 0 0 8px rgba(255, 20, 147, 0.6) !important;
```

#### Toggle de section (.section-toggle)

**Apparence**:
```css
font-size: 0.7rem !important;
color: #ff1493 !important;
font-weight: 600 !important;
padding: 2px 6px !important;
border-radius: 4px !important;
```

**Background**:
```css
background: linear-gradient(135deg,
  rgba(255, 20, 147, 0.1) 0%,
  rgba(255, 140, 0, 0.05) 50%,
  rgba(255, 215, 0, 0.08) 100%
) !important;
border: 1px solid rgba(255, 215, 0, 0.3) !important;
```

**Text-shadow**: 0 0 6px rgba(255, 20, 147, 0.5)

**Symboles**: ▲ (ouvert) / ▼ (fermé)

#### Badge de compteur (.badge-count)

Utilisé pour afficher le nombre d'éléments (ex: "4" quêtes actives):

```css
background: linear-gradient(180deg,
  rgba(255, 20, 147, 0.3) 0%,
  rgba(255, 140, 0, 0.2) 50%,
  rgba(255, 215, 0, 0.3) 100%
);
color: #ff1493;
padding: 2px 6px;
border-radius: 10px;
font-size: 0.7rem;
font-weight: 700;
border: 1px solid rgba(255, 215, 0, 0.3);
```

**Animation pulsante** (.badge-count.pulse):
```css
@keyframes pulse-badge {
  0%, 100% { 
    opacity: 1; 
    transform: scale(1); 
  }
  50% { 
    opacity: 0.8; 
    transform: scale(1.1); 
  }
}
animation: pulse-badge 2s ease-in-out infinite;
```

#### Contenu de section (.section-content)

```css
padding: 8px 10px;
border-top: 1px solid rgba(255, 215, 0, 0.15);
margin: 0;
background: linear-gradient(135deg, 
  rgba(255, 20, 147, 0.03) 0%,
  rgba(0, 0, 0, 0.1) 50%,
  rgba(255, 140, 0, 0.02) 100%
);
```


---

## ⚡ SECTION: ACTIONS RAPIDES

### Structure en 2 parties

#### 1. Grille principale 2x2 (.actions-main-grid)
```css
display: grid;
grid-template-columns: 1fr 1fr;
gap: 8px;
margin-bottom: 10px;
```

#### 2. Ligne d'actions secondaires (.actions-mini-row)
```css
display: grid;
grid-template-columns: 1fr 1fr 1fr 1fr;  /* 4 colonnes */
gap: 6px;
```

### Boutons principaux (.action-btn-premium)

**Dimensions**:
- **Padding**: 12px 18px 12px 10px
- **Border-radius**: 8px
- **Border**: 2px solid (couleur variable)
- **Min-height**: 55px

**Layout interne**:
```css
display: flex;
align-items: center;
gap: 6px;
```

**Background de base**:
```css
background: rgba(0, 0, 0, 0.3);
backdrop-filter: blur(10px);
```

**Transition**:
```css
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

**Effet hover**:
```css
transform: translateY(-3px) scale(1.02);
box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
```

**Effet active**:
```css
transform: translateY(-1px) scale(0.98);
```

#### Icône du bouton (.btn-icon)
- **Font-size**: 1.8rem
- **Filter**: drop-shadow(0 0 8px currentColor)
- **Z-index**: 2

#### Texte du bouton (.btn-text)
```css
display: flex;
flex-direction: column;
align-items: flex-start;
flex: 1;
margin-left: 8px;
padding-right: 16px;
```

**Titre** (.btn-title):
- **Font-size**: 0.7rem
- **Text-transform**: uppercase
- **Letter-spacing**: 0.2px
- **Line-height**: 1.1
- **White-space**: nowrap

**Sous-titre** (.btn-subtitle):
- **Font-size**: 0.6rem
- **Opacity**: 0.8
- **Font-weight**: 500
- **Line-height**: 1.2
- **White-space**: nowrap


#### Variantes de couleurs des boutons principaux

**1. FOCUS (.action-btn-premium.focus)**
```css
border-color: #ff6b35;
color: #ff6b35;
background: linear-gradient(135deg, 
  rgba(255, 107, 53, 0.1), 
  rgba(255, 107, 53, 0.05)
);
box-shadow: 0 4px 20px rgba(255, 107, 53, 0.2);
```
- Icône: 🎯
- Titre: "Focus +25min"
- Sous-titre: "Session Pomodoro"

**2. READ (.action-btn-premium.read)**
```css
border-color: #00d4ff;
color: #00d4ff;
background: linear-gradient(135deg, 
  rgba(0, 212, 255, 0.1), 
  rgba(0, 212, 255, 0.05)
);
box-shadow: 0 4px 20px rgba(0, 212, 255, 0.2);
```
- Icône: 📖
- Titre: "Lire +1 Page"
- Sous-titre: "Progression livre"

**3. SPORT (.action-btn-premium.sport)**
```css
border-color: #bf00ff;
color: #bf00ff;
background: linear-gradient(135deg, 
  rgba(191, 0, 255, 0.1), 
  rgba(191, 0, 255, 0.05)
);
box-shadow: 0 4px 20px rgba(191, 0, 255, 0.2);
```
- Icône: 💪
- Titre: "Sport 30min"
- Sous-titre: "Séance fitness"

**4. QUEST (.action-btn-premium.quest)**
```css
border-color: #00ff88;
color: #00ff88;
background: linear-gradient(135deg, 
  rgba(0, 255, 136, 0.1), 
  rgba(0, 255, 136, 0.05)
);
box-shadow: 0 4px 20px rgba(0, 255, 136, 0.2);
```
- Icône: ✅
- Titre: "Valider Quête"
- Sous-titre: "Compléter objectif"

### Boutons secondaires (.mini-btn-premium)

**Dimensions**:
- **Padding**: 8px 6px
- **Border-radius**: 8px
- **Border**: 1px solid (couleur variable)
- **Min-height**: 45px

**Layout**:
```css
display: flex;
flex-direction: column;
align-items: center;
gap: 4px;
```

**Background**:
```css
background: rgba(0, 0, 0, 0.2);
backdrop-filter: blur(8px);
```

**Effet hover**:
```css
transform: translateY(-2px) scale(1.05);
box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
```

#### Icône mini (.mini-icon)
- **Font-size**: 1.2rem
- **Filter**: drop-shadow(0 0 6px currentColor)

#### Texte mini (.mini-text)
- **Font-size**: 0.65rem
- **Text-transform**: uppercase
- **Letter-spacing**: 0.3px
- **Text-align**: center
- **Line-height**: 1


#### Variantes de couleurs des boutons secondaires

**1. INCOME (.mini-btn-premium.income)**
```css
border-color: #ffd700;
color: #ffd700;
background: linear-gradient(135deg, 
  rgba(255, 215, 0, 0.1), 
  rgba(255, 215, 0, 0.05)
);
```
- Icône: 💰
- Texte: "+Revenus"

**2. MOVIE (.mini-btn-premium.movie)**
```css
border-color: #ff6b9d;
color: #ff6b9d;
background: linear-gradient(135deg, 
  rgba(255, 107, 157, 0.1), 
  rgba(255, 107, 157, 0.05)
);
```
- Icône: 🎬
- Texte: "+Film"

**3. JOURNAL (.mini-btn-premium.journal)**
```css
border-color: #ff8c42;
color: #ff8c42;
background: linear-gradient(135deg, 
  rgba(255, 140, 66, 0.1), 
  rgba(255, 140, 66, 0.05)
);
```
- Icône: 📔
- Texte: "Journal"

**4. MEDITATION (.mini-btn-premium.meditation)**
```css
border-color: #9d4edd;
color: #9d4edd;
background: linear-gradient(135deg, 
  rgba(157, 78, 221, 0.1), 
  rgba(157, 78, 221, 0.05)
);
```
- Icône: 🧘
- Texte: "Méditer"

### Effet de brillance commun

Tous les boutons (principaux et secondaires) ont un effet de brillance au survol:

```css
.action-btn-premium::before,
.mini-btn-premium::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(255, 255, 255, 0.1), 
    transparent
  );
  transition: left 0.6s ease;
  z-index: 1;
}

.action-btn-premium:hover::before,
.mini-btn-premium:hover::before {
  left: 100%;  /* Balayage de gauche à droite */
}
```

---

## 📊 SECTION: MÉTRIQUES VITALES

### Structure en 3 parties

#### 1. Métriques principales (.metrics-main)
```css
display: grid;
grid-template-columns: 1fr 1fr;
gap: 8px;
margin-bottom: 10px;
```

**Cartes plus grandes**:
- **Padding**: 20px 16px
- **Min-height**: 100px


#### 2. Métriques secondaires (.metrics-secondary)
```css
display: grid;
grid-template-columns: 1fr 1fr;
gap: 10px;
margin-bottom: 50px;
position: relative;
```

**Séparateur visuel** (::before):
```css
.metrics-secondary::before {
  content: '';
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  height: 2px;
  background: linear-gradient(90deg, 
    transparent 0%,
    rgba(255, 20, 147, 0.4) 20%,
    rgba(255, 140, 0, 0.4) 50%,
    rgba(255, 215, 0, 0.4) 80%,
    transparent 100%
  );
  box-shadow: 0 0 12px rgba(255, 20, 147, 0.3);
  border-radius: 1px;
}
```

**Cartes plus compactes**:
- **Padding**: 16px 12px
- **Min-height**: 80px

#### 3. Indicateurs vitaux (.health-metrics)
```css
display: grid;
grid-template-columns: 1fr 1fr;
gap: 8px;
margin: 0 -10px 35px -10px;
position: relative;
```

**Titre de section** (::before):
```css
.health-metrics::before {
  content: 'INDICATEURS VITAUX';
  position: absolute;
  top: -45px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: rgba(255, 20, 147, 0.8);
  text-shadow: 0 0 6px rgba(255, 20, 147, 0.4);
  background: linear-gradient(90deg,
    rgba(255, 20, 147, 0.1) 0%,
    rgba(255, 140, 0, 0.1) 50%,
    rgba(255, 215, 0, 0.1) 100%
  );
  padding: 4px 16px;
  border-radius: 12px;
  border: 1px solid rgba(255, 20, 147, 0.2);
  box-shadow: 0 2px 8px rgba(255, 20, 147, 0.1);
}
```

### Carte métrique générique (.metric-card)

**Base commune**:
```css
padding: 12px 8px;
border-radius: 12px;
text-align: center;
border: 2px solid;
margin: 0 10px;
background: linear-gradient(135deg, 
  rgba(0, 0, 0, 0.6) 0%,
  rgba(20, 20, 30, 0.8) 100%
);
backdrop-filter: blur(15px);
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
position: relative;
overflow: hidden;
box-shadow: 
  0 4px 15px rgba(0, 0, 0, 0.3),
  inset 0 1px 0 rgba(255, 255, 255, 0.1);
```

**Effet de brillance** (::before):
```css
.metric-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.05) 0%,
    transparent 50%,
    rgba(255, 255, 255, 0.02) 100%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}

.metric-card:hover::before {
  opacity: 1;
}
```

**Effet hover**:
```css
transform: translateY(-3px) scale(1.02);
box-shadow: 
  0 12px 30px rgba(0, 0, 0, 0.4),
  0 0 20px currentColor;
```


#### Variantes de couleurs des métriques

**1. ORANGE (.metric-card.orange)**
```css
background: linear-gradient(135deg, 
  rgba(255, 140, 0, 0.15) 0%,
  rgba(0, 0, 0, 0.6) 50%,
  rgba(255, 140, 0, 0.05) 100%
);
border-color: #ff8c00;
color: #ff8c00;
box-shadow: 
  0 4px 15px rgba(0, 0, 0, 0.3),
  0 0 15px rgba(255, 140, 0, 0.2),
  inset 0 1px 0 rgba(255, 140, 0, 0.1);
```
- Exemple: "15j STREAK GLOBAL"

**2. CYAN/MAGENTA (.metric-card.cyan)**
```css
background: linear-gradient(135deg, 
  rgba(255, 20, 147, 0.15) 0%,
  rgba(0, 0, 0, 0.6) 50%,
  rgba(255, 20, 147, 0.05) 100%
);
border-color: #ff1493;
color: #ff1493;
box-shadow: 
  0 4px 15px rgba(0, 0, 0, 0.3),
  0 0 15px rgba(255, 20, 147, 0.2),
  inset 0 1px 0 rgba(255, 20, 147, 0.1);
```
- Exemple: "87% SCORE GLOBAL"

**3. YELLOW (.metric-card.yellow)**
```css
background: linear-gradient(135deg, 
  rgba(255, 215, 0, 0.15) 0%,
  rgba(0, 0, 0, 0.6) 50%,
  rgba(255, 215, 0, 0.05) 100%
);
border-color: #ffd700;
color: #ffd700;
box-shadow: 
  0 4px 15px rgba(0, 0, 0, 0.3),
  0 0 15px rgba(255, 215, 0, 0.2),
  inset 0 1px 0 rgba(255, 215, 0, 0.1);
```
- Exemple: "42 NIVEAU"

**4. PURPLE (.metric-card.purple)**
```css
background: linear-gradient(135deg, 
  rgba(168, 85, 247, 0.15) 0%,
  rgba(0, 0, 0, 0.6) 50%,
  rgba(168, 85, 247, 0.05) 100%
);
border-color: #a855f7;
color: #a855f7;
box-shadow: 
  0 4px 15px rgba(0, 0, 0, 0.3),
  0 0 15px rgba(168, 85, 247, 0.2),
  inset 0 1px 0 rgba(168, 85, 247, 0.1);
```
- Exemple: "12.5K EXPÉRIENCE"

### Éléments de la carte métrique

#### Valeur (.metric-value)
**Métriques principales**:
```css
font-size: 2rem;
font-weight: 900;
margin-bottom: 8px;
text-shadow: 0 0 20px currentColor;
font-family: 'Rajdhani', sans-serif;
letter-spacing: 1px;
```

**Métriques secondaires**:
```css
font-size: 1.4rem;
font-weight: 800;
margin-bottom: 4px;
text-shadow: 0 0 12px currentColor;
font-family: 'Rajdhani', sans-serif;
letter-spacing: 0.5px;
```

#### Label (.metric-label)
**Métriques principales**:
```css
font-size: 0.8rem;
font-weight: 800;
text-transform: uppercase;
letter-spacing: 1.5px;
opacity: 1;
text-shadow: 0 0 10px currentColor;
margin-bottom: 4px;
```

**Métriques secondaires**:
```css
font-size: 0.65rem;
font-weight: 700;
text-transform: uppercase;
letter-spacing: 1px;
opacity: 0.9;
text-shadow: 0 0 6px currentColor;
margin-bottom: 2px;
```

#### Description (.metric-description)
**Métriques principales**:
```css
font-size: 0.6rem;
font-weight: 500;
text-transform: uppercase;
letter-spacing: 0.8px;
opacity: 0.7;
color: rgba(255, 255, 255, 0.8);
text-shadow: 0 0 4px rgba(255, 255, 255, 0.3);
line-height: 1.2;
```

**Métriques secondaires**:
```css
font-size: 0.55rem;
font-weight: 500;
text-transform: uppercase;
letter-spacing: 0.6px;
opacity: 0.6;
color: rgba(255, 255, 255, 0.7);
text-shadow: 0 0 3px rgba(255, 255, 255, 0.2);
line-height: 1.1;
```


### Cartes de santé (.health-card)

**Dimensions**:
```css
padding: 16px 12px;
border-radius: 12px;
border: 2px solid;
margin: 0 10px;
min-height: 70px;
display: flex;
align-items: center;
justify-content: center;
```

**Variantes**:

**1. SANTÉ (.health-card.red)**
```css
background: linear-gradient(135deg, 
  rgba(239, 68, 68, 0.15) 0%,
  rgba(0, 0, 0, 0.6) 50%,
  rgba(239, 68, 68, 0.05) 100%
);
border-color: #ef4444;
color: #ef4444;
box-shadow: 
  0 4px 15px rgba(0, 0, 0, 0.3),
  0 0 15px rgba(239, 68, 68, 0.2),
  inset 0 1px 0 rgba(239, 68, 68, 0.1);
```
- Texte: "❤️ SANTÉ: 89%"

**2. FOCUS (.health-card.blue)**
```css
background: linear-gradient(135deg, 
  rgba(59, 130, 246, 0.15) 0%,
  rgba(0, 0, 0, 0.6) 50%,
  rgba(59, 130, 246, 0.05) 100%
);
border-color: #3b82f6;
color: #3b82f6;
box-shadow: 
  0 4px 15px rgba(0, 0, 0, 0.3),
  0 0 15px rgba(59, 130, 246, 0.2),
  inset 0 1px 0 rgba(59, 130, 246, 0.1);
```
- Texte: "🧠 FOCUS: 87%"

#### Texte de santé (.health-text)
```css
font-size: 0.75rem;
font-weight: 700;
text-transform: uppercase;
letter-spacing: 1px;
text-shadow: 0 0 8px currentColor;
```

---

## 🗡️ SECTION: QUÊTES ACTIVES

### Item de quête (.quest-item)

**Base**:
```css
padding: 12px;
border-radius: 12px;
margin: 0 10px 8px 10px;
border: 2px solid;
background: linear-gradient(135deg, 
  rgba(0, 0, 0, 0.6) 0%,
  rgba(20, 20, 30, 0.8) 100%
);
backdrop-filter: blur(15px);
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
position: relative;
overflow: hidden;
box-shadow: 
  0 4px 15px rgba(0, 0, 0, 0.3),
  inset 0 1px 0 rgba(255, 255, 255, 0.1);
```

**Effet hover**:
```css
transform: translateY(-2px) scale(1.01);
box-shadow: 
  0 8px 25px rgba(0, 0, 0, 0.4),
  0 0 15px currentColor;
```

### En-tête de quête (.quest-header)
```css
display: flex;
justify-content: space-between;
align-items: center;
margin-bottom: 4px;
```

#### Icône de quête (.quest-icon)
```css
font-size: 1rem;
margin-right: 8px;
text-shadow: 0 0 10px currentColor;
filter: drop-shadow(0 0 5px currentColor);
```

#### Titre de quête (.quest-title)
```css
flex: 1;
font-size: 0.8rem;
font-weight: 700;
text-transform: uppercase;
letter-spacing: 0.5px;
text-shadow: 0 0 8px currentColor;
```

#### Progression (.quest-progress)
```css
font-size: 0.75rem;
font-weight: 800;
text-shadow: 0 0 8px currentColor;
font-family: 'Rajdhani', sans-serif;
```


### Barre de progression de quête (.quest-bar)

**Conteneur**:
```css
width: 100%;
height: 3px;
background: rgba(0, 0, 0, 0.3);
border-radius: 2px;
overflow: hidden;
```

**Remplissage** (.quest-bar-fill):
```css
height: 100%;
background: linear-gradient(90deg, #22c55e, #16a34a);
border-radius: 2px;
transition: width 0.3s ease;
```

### Variantes de couleurs des quêtes

**1. GREEN (.quest-item.green)**
```css
background: linear-gradient(135deg, 
  rgba(34, 197, 94, 0.15) 0%,
  rgba(0, 0, 0, 0.6) 50%,
  rgba(34, 197, 94, 0.05) 100%
);
border-color: #22c55e;
color: #22c55e;
```
- Exemple: "⚔️ Maîtriser JavaScript - 87%"

**2. BLUE (.quest-item.blue)**
```css
background: linear-gradient(135deg, 
  rgba(59, 130, 246, 0.15) 0%,
  rgba(0, 0, 0, 0.6) 50%,
  rgba(59, 130, 246, 0.05) 100%
);
border-color: #3b82f6;
color: #3b82f6;
```
- Exemple: "📚 Lire 3 livres/mois - 2/3"

**3. PURPLE (.quest-item.purple)**
```css
background: linear-gradient(135deg, 
  rgba(168, 85, 247, 0.15) 0%,
  rgba(0, 0, 0, 0.6) 50%,
  rgba(168, 85, 247, 0.05) 100%
);
border-color: #a855f7;
color: #a855f7;
```
- Exemple: "💪 20 séances sport - 14/20"

**4. YELLOW (.quest-item.yellow)**
```css
background: linear-gradient(135deg, 
  rgba(234, 179, 8, 0.15) 0%,
  rgba(0, 0, 0, 0.6) 50%,
  rgba(234, 179, 8, 0.05) 100%
);
border-color: #eab308;
color: #eab308;
```
- Exemple: "💰 Économiser 500€ - 320€"

---

## 🎯 ANIMATIONS GLOBALES

### Animation de pulsation
```css
@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
```
Utilisée pour les effets de fond subtils.

### Animation du point de statut
```css
@keyframes pulse-dot {
  0%, 100% { 
    opacity: 1; 
    transform: scale(1); 
  }
  50% { 
    opacity: 0.7; 
    transform: scale(1.2); 
  }
}
```
Utilisée pour le point "SYSTÈME ACTIF".

### Animation du badge
```css
@keyframes pulse-badge {
  0%, 100% { 
    opacity: 1; 
    transform: scale(1); 
  }
  50% { 
    opacity: 0.8; 
    transform: scale(1.1); 
  }
}
```
Utilisée pour les compteurs de notifications.

### Animation de dégradé
```css
@keyframes gradient-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 50% 50%; }
  100% { background-position: 100% 50%; }
}
```
Utilisée pour les dégradés animés.

---

## 🎨 POLICES UTILISÉES

### Police principale: Tanker
- **Utilisation**: Heure, date, titres importants
- **Poids**: Regular (400)
- **Caractéristiques**: Géométrique, moderne, cyberpunk

### Police secondaire: Rajdhani
- **Utilisation**: Valeurs numériques, métriques
- **Poids**: 400-900
- **Caractéristiques**: Condensée, technique, lisible

### Police système
- **Utilisation**: Textes généraux
- **Fallback**: sans-serif


---

## 📱 FOOTER DE LA SIDEBAR

### Structure (.sidebar-footer)

**Position et dimensions**:
```css
padding: 15px;
margin: 0 -10px -10px -10px;
border-radius: 0 0 12px 0;
position: relative;
overflow: hidden;
```

**Background**:
```css
background: linear-gradient(135deg, 
  rgba(5, 5, 10, 0.98) 0%, 
  rgba(10, 10, 15, 0.95) 100%
);
```

**Bordure supérieure**:
```css
border-top: 1px solid rgba(255, 215, 0, 0.3);
```

**Effet de pulsation** (::before):
```css
.sidebar-footer::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(0, 245, 255, 0.05), 
    transparent
  );
  animation: pulse 3s ease-in-out infinite;
}
```

### Contenu du footer (.footer-content)

```css
position: relative;
z-index: 10;
text-align: center;
```

#### Texte du footer (.footer-text)
```css
font-size: 0.7rem;
color: rgba(255, 255, 255, 0.6);
text-transform: uppercase;
letter-spacing: 0.5px;
margin: 0;
```

**Contenu**: "QuietQuest Premium"

---

## 🔧 DONNÉES DYNAMIQUES (Vue 3)

### Props du composant

```javascript
props: {
  formattedTime: String,      // Ex: "14:32:15"
  formattedDate: String,       // Ex: "SAMEDI 7 DÉCEMBRE 2024"
  user: Object,                // Données utilisateur
  domains: Object,             // Domaines d'activité
  currentProfileImage: String  // URL de l'image de profil
}
```

### Data du composant

#### expandedSections
Objet contenant l'état d'ouverture/fermeture de chaque section:
```javascript
expandedSections: {
  actions: true,
  metrics: true,
  quests: true,
  sport: true,
  learning: true,
  books: true,
  finance: true,
  journal: true,
  films: true,
  session: true,
  achievements: true,
  focusrpg: true,
  dailygoals: true,
  notifications: true,
  weather: true,
  motivation: true,
  rewards: true,
  history: true,
  quicksettings: true,
  predictions: true,
  stats: true
}
```

#### activeQuests
Tableau des quêtes actives:
```javascript
activeQuests: [
  { 
    id: 1, 
    type: 'green', 
    icon: '⚔️', 
    title: 'Maîtriser JavaScript', 
    progress: '87%', 
    progressBar: '87%' 
  },
  // ...
]
```

#### sportData
Données de sport et santé:
```javascript
sportData: {
  calories: '847',
  steps: '8,342',
  sleep: '7h23',
  cardioSessions: '3',
  pushups: '45',
  meditation: '12'
}
```

#### learningData
Données d'apprentissage:
```javascript
learningData: {
  currentCourse: 'JavaScript Avancé',
  courseProgress: 'Chapitre 8/12',
  todayTime: '2h15',
  language: 'Anglais B2',
  languageProgress: 'Leçon 15/20',
  languageStreak: '12',
  retention: '89',
  todayHours: '4.2'
}
```


#### bookData
Données de lecture:
```javascript
bookData: {
  currentBook: 'Clean Code',
  currentProgress: '187/464 p.',
  progressBar: '40%',
  timeRemaining: '3h20',
  booksPerMonth: '3',
  avgTime: '45min',
  pagesRead: '847',
  nextBooks: 'Atomic Habits", "Design Patterns'
}
```

#### financeData
Données financières:
```javascript
financeData: {
  income: '1,247',
  expenses: '892',
  savingsProgress: '2,340€/3,000€',
  savingsBar: '78%',
  budgetPercent: '78',
  growth: '5.2',
  savingsDays: '15'
}
```

#### rpgData
Données du mode RPG:
```javascript
rpgData: {
  level: '42',
  hp: '847',
  mp: '320',
  hpPercent: '85%',
  mpPercent: '71%',
  attack: '87',
  defense: '65',
  speed: '92',
  intelligence: '78',
  nextBoss: 'JavaScript Master',
  bossReward: 'Récompense: +500 XP, Compétence "Async/Await"'
}
```

#### notifications
Tableau des notifications:
```javascript
notifications: [
  { 
    id: 1, 
    type: 'red', 
    icon: '⚠️', 
    title: 'Rappel urgent!', 
    message: 'Session de sport prévue dans 30min' 
  },
  // ...
]
```

### Méthodes du composant

#### toggleSection(section)
Bascule l'état d'ouverture/fermeture d'une section:
```javascript
toggleSection(section) {
  this.expandedSections[section] = !this.expandedSections[section];
}
```

#### formatXP(xp)
Formate les valeurs d'XP en format lisible:
```javascript
formatXP(xp) {
  if (xp >= 1000000) {
    return (xp / 1000000).toFixed(1) + 'M';
  } else if (xp >= 1000) {
    return (xp / 1000).toFixed(0) + 'K';
  }
  return xp.toString();
}
```
- Exemples: 1500 → "1.5K", 2500000 → "2.5M"

#### loadCurrentProfileImages()
Charge les images de profil depuis IndexedDB:
```javascript
async loadCurrentProfileImages() {
  try {
    const images = await window.ProfileImageMigrationService.getCurrentImages();
    
    if (images.currentMain) {
      this.currentMainAvatarId = images.currentMain.id;
    }
    
    if (images.currentMini) {
      this.currentMiniAvatarId = images.currentMini.id;
    }
  } catch (error) {
    console.error('❌ Erreur chargement images de profil:', error);
  }
}
```

### Événements émis

#### execute-action
Émis lors du clic sur un bouton d'action:
```javascript
@click="$emit('execute-action', 'focus-25min')"
```

Actions disponibles:
- `'focus-25min'` - Démarrer une session focus
- `'read-page'` - Ajouter une page lue
- `'sport-30min'` - Enregistrer une séance de sport
- `'validate-quest'` - Valider une quête
- `'add-income'` - Ajouter un revenu
- `'add-movie'` - Ajouter un film
- `'journal'` - Ouvrir le journal

#### toggle-setting
Émis lors du changement d'un paramètre:
```javascript
@click="$emit('toggle-setting', 'night-mode')"
```

Paramètres disponibles:
- `'night-mode'` - Mode nuit
- `'sounds'` - Sons
- `'notifications'` - Notifications
- `'auto-focus'` - Focus automatique

#### profile-contact
Émis lors du clic sur la carte de profil:
```javascript
@contact-click="handleProfileContact"
```


---

## 🎯 GUIDE DE RECRÉATION COMPLÈTE

### Étape 1: Structure HTML de base

```html
<div class="sidebar-premium">
  <!-- Zone fixe en haut -->
  <div class="clock-section">
    <!-- Bloc heure/date -->
    <div class="time-date-block">
      <div class="time-display">
        <div class="time-main">14:32:15</div>
        <div class="time-shadow">14:32:15</div>
        <div class="time-glow">14:32:15</div>
      </div>
      <div class="date-display">
        <div class="date-main">SAMEDI 7 DÉCEMBRE 2024</div>
        <div class="date-shadow">SAMEDI 7 DÉCEMBRE 2024</div>
        <div class="date-glow">SAMEDI 7 DÉCEMBRE 2024</div>
      </div>
    </div>
    
    <!-- Carte développeur -->
    <profile-card-component
      name="zingariello"
      title="Développeur"
      handle="zingariello1314"
      status="En ligne"
    />
    
    <!-- Statuts système -->
    <div class="system-status">
      <div class="status-item active">
        <div class="status-dot"></div>
        <span>SYSTÈME ACTIF</span>
      </div>
      <div class="status-item night">
        <span class="status-icon">🌙</span>
        <span>MODE NUIT</span>
      </div>
      <div class="status-item connected">
        <span class="status-icon">📶</span>
        <span>CONNECTÉ</span>
      </div>
      <div class="status-item focus">
        <span class="status-icon">🔋</span>
        <span>FOCUS 87%</span>
      </div>
    </div>
  </div>
  
  <!-- Zone scrollable -->
  <div class="sidebar-content">
    <!-- Sections répétées -->
    <div class="section-container">
      <div class="section-header">
        <h3 class="section-title">⚡ ACTIONS RAPIDES</h3>
        <span class="section-toggle">▲</span>
      </div>
      <div class="section-content">
        <!-- Contenu de la section -->
      </div>
    </div>
    <!-- ... autres sections ... -->
  </div>
  
  <!-- Footer -->
  <div class="sidebar-footer">
    <div class="footer-content">
      <p class="footer-text">QuietQuest Premium</p>
    </div>
  </div>
</div>
```

### Étape 2: CSS de base

```css
/* Conteneur principal */
.sidebar-premium {
  width: 18.75rem;
  min-height: fit-content;
  max-height: 100vh;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);
  color: #ffffff;
  display: flex;
  flex-direction: column;
  border: 0.125rem solid rgba(255, 215, 0, 0.2);
  border-radius: 0 0.75rem 0.75rem 0;
  backdrop-filter: blur(0.9375rem);
  flex-shrink: 0;
  position: relative;
  z-index: 900;
  padding: 0.625rem;
  box-shadow: 0.125rem 0 1.875rem rgba(0, 0, 0, 0.5);
  overflow: hidden;
}
```

### Étape 3: Dégradé signature (Magenta-Orange-Or)

Ce dégradé est utilisé partout dans la sidebar:

```css
/* Pour les textes */
background: linear-gradient(180deg,
  #ff1493 0%,    /* Magenta */
  #ff8c00 50%,   /* Orange */
  #ffd700 100%   /* Or */
);
background-clip: text;
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;

/* Pour les fonds */
background: linear-gradient(135deg, 
  rgba(255, 20, 147, 0.15) 0%,
  rgba(255, 140, 0, 0.1) 50%,
  rgba(255, 215, 0, 0.15) 100%
);
```


### Étape 4: Effets visuels essentiels

#### Effet de brillance au survol
```css
.element::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(255, 255, 255, 0.1), 
    transparent
  );
  transition: left 0.6s ease;
  z-index: 1;
}

.element:hover::before {
  left: 100%;
}
```

#### Effet de profondeur (3 couches)
```css
/* Couche 1: Texte principal */
.text-main {
  background: linear-gradient(180deg, #ff1493 0%, #ff8c00 50%, #ffd700 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 20px rgba(255, 20, 147, 0.4);
}

/* Couche 2: Ombre */
.text-shadow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  opacity: 0.2;
  filter: blur(2px);
  z-index: -1;
}

/* Couche 3: Lueur */
.text-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  opacity: 0.4;
  filter: blur(4px);
  z-index: -2;
}
```

#### Box-shadow multicouche
```css
box-shadow: 
  0 4px 15px rgba(0, 0, 0, 0.3),           /* Ombre portée */
  0 0 15px rgba(255, 140, 0, 0.2),         /* Lueur externe */
  inset 0 1px 0 rgba(255, 215, 0, 0.1);   /* Lueur interne */
```

### Étape 5: Transitions et animations

#### Transitions standard
```css
transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

#### Effet hover standard
```css
.element:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.4);
}
```

#### Animation de pulsation
```css
@keyframes pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.element {
  animation: pulse 3s ease-in-out infinite;
}
```

### Étape 6: Responsive (si nécessaire)

La sidebar est conçue pour une largeur fixe de 300px, mais peut être adaptée:

```css
@media (max-width: 768px) {
  .sidebar-premium {
    width: 100%;
    max-width: 300px;
    border-radius: 0;
  }
}
```

---

## 📊 TABLEAU RÉCAPITULATIF DES COULEURS

| Élément | Couleur principale | Code hex | Usage |
|---------|-------------------|----------|-------|
| Magenta | Deep Pink | #ff1493 | Titres, accents primaires |
| Orange | Dark Orange | #ff8c00 | Accents secondaires |
| Or | Gold | #ffd700 | Bordures, highlights |
| Cyan | Aqua | #00f5ff | Accents technologiques |
| Vert | Emerald | #22c55e | Succès, santé, actif |
| Bleu | Sky | #3b82f6 | Information, focus |
| Violet | Purple | #a855f7 | Apprentissage, premium |
| Jaune | Amber | #eab308 | Attention, objectifs |
| Rouge | Red | #ef4444 | Urgent, santé |

---

## 🔍 POINTS D'ATTENTION CRITIQUES

### 1. Hiérarchie Z-index
- Sidebar: 900
- Clock section: 10
- Laser effects: 40-50
- Section headers: 2
- Hover effects: 1

### 2. Gestion du scroll
- Clock section: **fixe**, ne scroll pas
- Sidebar content: **scrollable**
- Footer: **fixe**, ne scroll pas

### 3. Marges négatives
Plusieurs éléments utilisent des marges négatives pour toucher les bords:
```css
margin: -10px -10px 0 -10px;
```

### 4. Backdrop-filter
Essentiel pour l'effet de verre dépoli:
```css
backdrop-filter: blur(10px);
```

### 5. Text-shadow vs Filter
- **Text-shadow**: Pour les lueurs de texte
- **Filter: drop-shadow()**: Pour les lueurs d'icônes


---

## 🎨 EXEMPLES DE CODE COMPLETS

### Exemple 1: Bouton d'action complet

```html
<button class="action-btn-premium focus">
  <span class="btn-icon">🎯</span>
  <div class="btn-text">
    <div class="btn-title">Focus +25min</div>
    <div class="btn-subtitle">Session Pomodoro</div>
  </div>
</button>
```

```css
.action-btn-premium.focus {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 18px 12px 10px;
  border-radius: 8px;
  border: 2px solid #ff6b35;
  color: #ff6b35;
  background: linear-gradient(135deg, 
    rgba(255, 107, 53, 0.1), 
    rgba(255, 107, 53, 0.05)
  );
  backdrop-filter: blur(10px);
  min-height: 55px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(255, 107, 53, 0.2);
}

.action-btn-premium.focus:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 12px 30px rgba(255, 107, 53, 0.4);
  border-color: #ff8c42;
}

.action-btn-premium .btn-icon {
  font-size: 1.8rem;
  filter: drop-shadow(0 0 8px currentColor);
  z-index: 2;
}

.action-btn-premium .btn-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
  margin-left: 8px;
}

.action-btn-premium .btn-title {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.2px;
  line-height: 1.1;
  white-space: nowrap;
}

.action-btn-premium .btn-subtitle {
  font-size: 0.6rem;
  opacity: 0.8;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
}
```

### Exemple 2: Carte métrique complète

```html
<div class="metric-card orange">
  <div class="metric-value">15j</div>
  <div class="metric-label">🔥 STREAK GLOBAL</div>
  <div class="metric-description">Jours consécutifs d'activité</div>
</div>
```

```css
.metric-card.orange {
  padding: 20px 16px;
  border-radius: 12px;
  text-align: center;
  border: 2px solid #ff8c00;
  color: #ff8c00;
  margin: 0 10px;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, 
    rgba(255, 140, 0, 0.15) 0%,
    rgba(0, 0, 0, 0.6) 50%,
    rgba(255, 140, 0, 0.05) 100%
  );
  backdrop-filter: blur(15px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.3),
    0 0 15px rgba(255, 140, 0, 0.2),
    inset 0 1px 0 rgba(255, 140, 0, 0.1);
}

.metric-card.orange:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 
    0 12px 30px rgba(0, 0, 0, 0.4),
    0 0 20px #ff8c00;
}

.metric-card .metric-value {
  font-size: 2rem;
  font-weight: 900;
  margin-bottom: 8px;
  text-shadow: 0 0 20px currentColor;
  font-family: 'Rajdhani', sans-serif;
  letter-spacing: 1px;
}

.metric-card .metric-label {
  font-size: 0.8rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  text-shadow: 0 0 10px currentColor;
  margin-bottom: 4px;
}

.metric-card .metric-description {
  font-size: 0.6rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  opacity: 0.7;
  color: rgba(255, 255, 255, 0.8);
  text-shadow: 0 0 4px rgba(255, 255, 255, 0.3);
  line-height: 1.2;
}
```


### Exemple 3: Section complète avec header

```html
<div class="section-container">
  <div class="section-header">
    <h3 class="section-title">⚡ ACTIONS RAPIDES</h3>
    <span class="section-toggle">▲</span>
  </div>
  <div class="section-content">
    <!-- Contenu ici -->
  </div>
</div>
```

```css
.section-container {
  margin-bottom: 8px;
  margin-left: 10px;
  margin-right: 10px;
  background: linear-gradient(135deg, 
    rgba(255, 20, 147, 0.08) 0%,
    rgba(15, 15, 25, 0.6) 30%,
    rgba(255, 140, 0, 0.05) 70%,
    rgba(255, 215, 0, 0.08) 100%
  );
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: 10px;
  backdrop-filter: blur(10px);
  overflow: hidden;
  box-shadow: 
    0 2px 8px rgba(255, 20, 147, 0.1),
    inset 0 1px 0 rgba(255, 215, 0, 0.1);
}

.section-header {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  padding: 6px 8px !important;
  min-height: 28px !important;
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, 
    rgba(255, 20, 147, 0.1) 0%,
    rgba(255, 140, 0, 0.05) 50%,
    rgba(255, 215, 0, 0.08) 100%
  ) !important;
  border-bottom: 1px solid rgba(255, 215, 0, 0.3) !important;
  position: relative;
  overflow: hidden;
}

.section-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(255, 20, 147, 0.2), 
    rgba(255, 140, 0, 0.1),
    transparent
  );
  transition: left 0.6s ease;
  z-index: 1;
}

.section-header:hover::before {
  left: 100%;
}

.section-header:hover {
  background: linear-gradient(135deg, 
    rgba(255, 20, 147, 0.15) 0%,
    rgba(255, 140, 0, 0.08) 50%,
    rgba(255, 215, 0, 0.12) 100%
  );
  border-bottom-color: rgba(255, 215, 0, 0.5);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(255, 20, 147, 0.2);
}

.section-title {
  font-size: 0.75rem !important;
  font-weight: 800 !important;
  text-transform: uppercase;
  letter-spacing: 0.8px !important;
  margin: 0 !important;
  line-height: 1 !important;
  background: linear-gradient(180deg,
    #ff1493 0%,
    #ff8c00 50%,
    #ffd700 100%
  );
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 8px rgba(255, 20, 147, 0.6) !important;
  position: relative;
  z-index: 2;
}

.section-toggle {
  font-size: 0.7rem !important;
  color: #ff1493 !important;
  font-weight: 600 !important;
  padding: 2px 6px !important;
  border-radius: 4px !important;
  background: linear-gradient(135deg,
    rgba(255, 20, 147, 0.1) 0%,
    rgba(255, 140, 0, 0.05) 50%,
    rgba(255, 215, 0, 0.08) 100%
  ) !important;
  border: 1px solid rgba(255, 215, 0, 0.3) !important;
  text-shadow: 0 0 6px rgba(255, 20, 147, 0.5) !important;
}

.section-content {
  padding: 8px 10px;
  border-top: 1px solid rgba(255, 215, 0, 0.15);
  margin: 0;
  background: linear-gradient(135deg, 
    rgba(255, 20, 147, 0.03) 0%,
    rgba(0, 0, 0, 0.1) 50%,
    rgba(255, 140, 0, 0.02) 100%
  );
}
```

---

## 🚀 CHECKLIST DE RECRÉATION

### Phase 1: Structure de base
- [ ] Créer le conteneur `.sidebar-premium`
- [ ] Définir les dimensions (300px de largeur)
- [ ] Appliquer le dégradé de fond principal
- [ ] Ajouter les bordures dorées
- [ ] Configurer le backdrop-filter

### Phase 2: Zone d'horloge
- [ ] Créer `.clock-section` fixe
- [ ] Implémenter `.time-date-block` avec bordure dorée
- [ ] Ajouter l'affichage de l'heure avec 3 couches
- [ ] Ajouter l'affichage de la date avec 3 couches
- [ ] Appliquer le dégradé Magenta-Orange-Or aux textes

### Phase 3: Carte développeur
- [ ] Intégrer le composant ProfileCardComponent
- [ ] Configurer les effets 3D (tilt)
- [ ] Ajouter l'avatar principal
- [ ] Ajouter le mini-avatar et les infos
- [ ] Implémenter les effets holographiques

### Phase 4: Statuts système
- [ ] Créer la grille 2x2
- [ ] Ajouter les 4 statuts (Actif, Nuit, Connecté, Focus)
- [ ] Implémenter le point pulsant pour "Actif"
- [ ] Appliquer les couleurs spécifiques

### Phase 5: Zone scrollable
- [ ] Créer `.sidebar-content`
- [ ] Configurer le scroll
- [ ] Personnaliser la scrollbar
- [ ] Ajouter les marges négatives

### Phase 6: Sections
- [ ] Créer le template `.section-container`
- [ ] Implémenter `.section-header` avec effet de balayage
- [ ] Ajouter les titres avec dégradé
- [ ] Créer les toggles
- [ ] Implémenter `.section-content`

### Phase 7: Actions rapides
- [ ] Créer la grille 2x2 pour les boutons principaux
- [ ] Implémenter les 4 boutons principaux avec couleurs
- [ ] Créer la ligne 1x4 pour les boutons secondaires
- [ ] Ajouter les effets hover et brillance

### Phase 8: Métriques vitales
- [ ] Créer la grille des métriques principales
- [ ] Ajouter le séparateur visuel
- [ ] Créer la grille des métriques secondaires
- [ ] Implémenter les indicateurs vitaux avec titre
- [ ] Appliquer toutes les variantes de couleurs

### Phase 9: Autres sections
- [ ] Implémenter Quêtes actives avec barres de progression
- [ ] Ajouter Sport & Santé
- [ ] Créer Apprentissage
- [ ] Implémenter Livres
- [ ] Ajouter Finances
- [ ] Créer les autres sections selon le besoin

### Phase 10: Footer
- [ ] Créer `.sidebar-footer` fixe
- [ ] Ajouter l'effet de pulsation
- [ ] Insérer le texte "QuietQuest Premium"

### Phase 11: Animations
- [ ] Implémenter @keyframes pulse
- [ ] Ajouter @keyframes pulse-dot
- [ ] Créer @keyframes pulse-badge
- [ ] Ajouter @keyframes gradient-shift

### Phase 12: Interactivité Vue 3
- [ ] Configurer les props
- [ ] Implémenter les data
- [ ] Créer les méthodes (toggleSection, formatXP, etc.)
- [ ] Configurer les événements émis
- [ ] Connecter à IndexedDB pour les images

### Phase 13: Tests et ajustements
- [ ] Tester le scroll
- [ ] Vérifier les animations
- [ ] Tester les interactions
- [ ] Valider les couleurs
- [ ] Optimiser les performances

---

## 📝 NOTES FINALES

### Optimisations possibles
1. **Lazy loading**: Charger les sections au fur et à mesure
2. **Virtual scrolling**: Pour de très longues listes
3. **Memoization**: Pour les calculs répétitifs
4. **Debouncing**: Pour les événements fréquents

### Accessibilité
1. Ajouter des `aria-label` sur les boutons
2. Gérer la navigation au clavier
3. Assurer un contraste suffisant
4. Fournir des alternatives textuelles aux icônes

### Performance
1. Utiliser `will-change` pour les animations fréquentes
2. Limiter les `backdrop-filter` (coûteux)
3. Optimiser les images (WebP, compression)
4. Utiliser `transform` plutôt que `top/left` pour les animations

### Maintenance
1. Documenter les variables CSS custom
2. Créer des mixins pour les patterns répétitifs
3. Versionner les changements de design
4. Maintenir un guide de style à jour

---

## 🎉 CONCLUSION

Cette documentation complète vous permet de recréer la sidebar QuietQuest de zéro avec tous les détails nécessaires:

- ✅ Structure HTML complète
- ✅ Tous les styles CSS avec valeurs exactes
- ✅ Palette de couleurs complète
- ✅ Animations et transitions
- ✅ Logique Vue 3
- ✅ Exemples de code complets
- ✅ Checklist de recréation

**Temps estimé de recréation**: 8-12 heures pour un développeur expérimenté

**Fichiers à créer**:
1. `SidebarComponent.js` - Composant Vue 3
2. `sidebar.css` - Styles complets
3. `ProfileCardComponent.js` - Carte développeur (si non existant)

**Dépendances**:
- Vue 3
- Police Tanker
- Police Rajdhani
- ProfileImageManager (pour les images)

---

*Document créé le 7 décembre 2024*
*Version: 1.0*
*Auteur: Documentation automatique basée sur le code source*
