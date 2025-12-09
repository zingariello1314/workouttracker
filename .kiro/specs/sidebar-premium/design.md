# Design Document - Sidebar Premium QuietQuest

## Overview

La Sidebar Premium QuietQuest est un composant React sophistiqué qui fournit un accès permanent aux informations vitales et actions rapides de l'utilisateur. Elle utilise un design cyberpunk avec une palette Magenta-Orange-Or et des effets visuels avancés (lueurs, dégradés, animations 3D).

Le composant est conçu pour être:
- **Performant**: Moins de 50MB de mémoire, 60 FPS constant
- **Accessible**: WCAG 2.1 AA compliant
- **Responsive**: Adaptatif selon la taille d'écran
- **Personnalisable**: États de sections sauvegardés dans localStorage

## Architecture

### Structure des Composants

```
SidebarPremium (Composant principal)
├── ClockSection (Zone fixe non-scrollable)
│   ├── TimeDisplay (Heure avec effets)
│   ├── DateDisplay (Date avec effets)
│   ├── ProfileCard (Carte développeur 3D)
│   └── SystemStatus (Grille 2x2 des statuts)
│
├── SidebarContent (Zone scrollable)
│   ├── ActionsSection (Actions rapides)
│   ├── MetricsSection (Métriques vitales)
│   ├── QuestsSection (Quêtes actives)
│   ├── SportSection (Sport & Santé)
│   ├── LearningSection (Apprentissage)
│   ├── BooksSection (Livres)
│   ├── FinanceSection (Finances)
│   ├── JournalSection (Journal & Films)
│   ├── FocusSessionSection (Session Focus)
│   ├── AchievementsSection (Achievements)
│   ├── FocusRPGSection (Focus RPG)
│   ├── DailyGoalsSection (Objectifs du Jour)
│   ├── NotificationsSection (Notifications)
│   ├── WeatherSection (Météo)
│   ├── MotivationSection (Motivation)
│   ├── RewardsSection (Récompenses)
│   ├── HistorySection (Historique)
│   ├── QuickSettingsSection (Paramètres Rapides)
│   ├── AIPredictionsSection (Prédictions IA)
│   └── GlobalStatsSection (Statistiques Globales)
│
└── SidebarFooter (Pied de page fixe)
```

### Intégration dans App.jsx

La sidebar sera conditionnellement rendue dans `App.jsx` en fonction de l'onglet actif:

```jsx
const shouldShowSidebar = activeTab !== 'home' && 
                          activeTab !== 'auth' && 
                          activeTab !== 'settings';
```

Le layout sera ajusté pour réserver l'espace de la sidebar:

```jsx
<div className={`flex ${shouldShowSidebar ? 'ml-[300px]' : ''}`}>
  {shouldShowSidebar && <SidebarPremium />}
  <main className="flex-1">
    {/* Contenu principal */}
  </main>
</div>
```

## Components and Interfaces

### 1. SidebarPremium (Composant Principal)

**Props**: Aucune (utilise les contexts)

**State**:
```typescript
interface SidebarState {
  expandedSections: Record<string, boolean>;
  currentTime: Date;
  systemStatus: {
    active: boolean;
    nightMode: boolean;
    connected: boolean;
    focusPercentage: number;
  };
}
```

**Hooks utilisés**:
- `useState` pour l'état local
- `useEffect` pour l'horloge et la sauvegarde
- `useContext` pour accéder aux données globales
- `useLocalStorage` pour la persistance des préférences

### 2. ClockSection

**Props**: Aucune

**Responsabilités**:
- Afficher l'heure et la date en temps réel
- Mettre à jour chaque minute
- Appliquer les effets visuels (dégradés, lueurs)

**Rendu**:
```jsx
<div className="clock-section">
  <div className="time-date-block">
    <TimeDisplay time={currentTime} />
    <DateDisplay date={currentDate} />
  </div>
  <ProfileCard />
  <SystemStatus status={systemStatus} />
</div>
```

### 3. ProfileCard

**Props**:
```typescript
interface ProfileCardProps {
  username?: string;
  title?: string;
  avatarUrl?: string;
}
```

**State**:
```typescript
interface ProfileCardState {
  tiltX: number;
  tiltY: number;
  isHovered: boolean;
}
```

**Fonctionnalités**:
- Effet tilt 3D au survol
- Chargement d'avatar depuis IndexedDB
- Animation de retour à la position initiale
- Dégradés holographiques dynamiques

### 4. SectionContainer (Composant Réutilisable)

**Props**:
```typescript
interface SectionContainerProps {
  title: string;
  icon?: string;
  badge?: number;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary';
}
```

**Rendu**:
```jsx
<div className="section-container">
  <div className="section-header" onClick={onToggle}>
    <h3 className="section-title">
      {icon} {title}
    </h3>
    {badge && <span className="badge-count">{badge}</span>}
    <span className="section-toggle">{isExpanded ? '▲' : '▼'}</span>
  </div>
  {isExpanded && (
    <div className="section-content">
      {children}
    </div>
  )}
</div>
```

### 5. ActionsSection

**Props**: Aucune (utilise les contexts pour les actions)

**Structure**:
- Grille 2x2 de boutons principaux (Focus, Read, Sport, Quest)
- Ligne de 4 boutons secondaires (Income, Movie, Journal, Meditation)

**Actions**:
```typescript