# Design Document - Correction Graphique Fréquence Cardiaque Module Garmin

## Overview

Ce document décrit la solution pour intégrer le graphique de fréquence cardiaque temporel dans le module Métriques Garmin de la sidebar. L'objectif est de remplacer l'affichage statique des zones FC par le graphique temporel interactif déjà présent dans le sous-onglet Garmin, tout en conservant les fonctionnalités existantes du module.

## Architecture

### Composants Existants à Réutiliser

1. **GarminHeartRateTimeSeriesChart** : Composant principal qui affiche le graphique FC temporel
2. **useRealGarminData** : Hook qui récupère les données Garmin réelles
3. **GarminMetricsModule** : Module sidebar existant à modifier

### Nouvelle Architecture du Module

```
GarminMetricsModule (modifié)
├── Métriques Rapides (existant)
│   ├── Calories
│   ├── Body Battery  
│   ├── Pas
│   └── FC Repos
├── Graphique FC Temporel (nouveau)
│   ├── GarminHeartRateTimeSeriesChart (adapté)
│   ├── Contrôles compacts
│   └── Légende simplifiée
└── Navigation vers Sport (existant)
```

## Components and Interfaces

### 1. GarminMetricsModule (Modification)

**Nouvelles Props:**
- `showHeartRateChart: boolean` - Active/désactive l'affichage du graphique FC
- `chartHeight: number` - Hauteur du graphique (défaut: 280px)
- `compactMode: boolean` - Mode compact pour la sidebar

**Nouvelles Fonctionnalités:**
- Intégration du composant `GarminHeartRateTimeSeriesChart`
- Gestion de l'espace disponible
- Basculement entre vue zones statiques et graphique temporel

### 2. SidebarHeartRateChart (Nouveau Composant)

Wrapper optimisé pour la sidebar autour de `GarminHeartRateTimeSeriesChart`.

```jsx
interface SidebarHeartRateChartProps {
  garminData: GarminData;
  selectedDate: string;
  height?: number;
  compactMode?: boolean;
  colors?: ThemeColors;
}
```

**Responsabilités:**
- Adapter les props du composant principal pour la sidebar
- Gérer le redimensionnement automatique
- Simplifier l'affichage (légende compacte, moins de détails)
- Maintenir les performances

### 3. Modifications des Hooks

**useRealGarminData (Extension):**
- Ajouter `selectedDate` comme paramètre optionnel
- Optimiser les données pour l'affichage sidebar
- Gérer le cache pour éviter les re-rendus

## Data Models

### GarminSidebarData

```typescript
interface GarminSidebarData {
  // Métriques rapides existantes
  todayMetrics: {
    calories: CaloriesData;
    bodyBattery: number | null;
    steps: number;
    heartRate: HeartRateMetrics;
    sleep: SleepData | null;
  };
  
  // Nouvelles données pour le graphique
  heartRateTimeSeries: HeartRateTimePoint[];
  heartRateZones: HeartRateZone[];
  selectedDate: string;
  hasTimeSeriesData: boolean;
}

interface HeartRateTimePoint {
  timestamp: number;
  bpm: number;
  time: string; // Format HH:MM
  isReal: boolean;
  isActivity?: boolean;
}

interface HeartRateZone {
  zone: number;
  name: string;
  color: string;
  minBpm: number;
  maxBpm: number;
  timeInZone: number; // en secondes
  percentage: number;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Graphique FC Cohérence
*For any* données de fréquence cardiaque valides, le graphique affiché dans la sidebar doit être identique à celui du sous-onglet Garmin
**Validates: Requirements 1.1, 2.2**

### Property 2: Zones FC Affichage
*For any* données FC disponibles, le système doit afficher la courbe avec les zones colorées (Maximum, Moyenne, Repos) correctement calculées
**Validates: Requirements 1.2**

### Property 3: Tooltip Interactivité
*For any* point du graphique FC, survoler doit afficher un tooltip avec les détails FC et zone correspondante
**Validates: Requirements 1.3, 2.3**

### Property 4: Styles Cohérence
*For any* affichage du graphique FC, les couleurs et styles doivent être identiques entre sidebar et sous-onglet Garmin
**Validates: Requirements 2.1**

### Property 5: Responsivité Adaptation
*For any* redimensionnement, le graphique doit s'adapter à l'espace disponible dans la sidebar
**Validates: Requirements 2.4**

### Property 6: Synchronisation Données
*For any* mise à jour des données FC, les deux graphiques (sidebar et sous-onglet) doivent refléter les mêmes changements
**Validates: Requirements 2.5**

### Property 7: Métriques Conservation
*For any* état du module, les métriques rapides (calories, body battery, pas, FC repos) doivent toujours être affichées
**Validates: Requirements 3.1**

### Property 8: Affichage Dual
*For any* module étendu, les métriques rapides ET le graphique FC temporel doivent être visibles simultanément
**Validates: Requirements 3.2**

### Property 9: Navigation Préservation
*For any* clic sur les métriques rapides, la navigation vers le sous-onglet Sport doit être maintenue
**Validates: Requirements 3.3**

### Property 10: Zones Remplacement
*For any* affichage du graphique FC, l'affichage des zones FC statiques doit être remplacé ou complété de manière cohérente
**Validates: Requirements 3.4**

### Property 11: Hauteur Contrainte
*For any* affichage du graphique FC dans la sidebar, la hauteur doit être limitée à maximum 300px
**Validates: Requirements 4.1**

### Property 12: Courbe Priorité
*For any* espace limité, la courbe FC principale doit toujours rester visible et lisible
**Validates: Requirements 4.2**

### Property 13: Police Adaptation
*For any* affichage des labels, la taille de police doit être adaptée à l'espace sidebar
**Validates: Requirements 4.3**

### Property 14: Légende Compacte
*For any* affichage des zones FC, la légende doit utiliser un format compact approprié pour la sidebar
**Validates: Requirements 4.4**

### Property 15: Tooltips Lisibilité
*For any* interaction avec le graphique, les tooltips doivent rester lisibles malgré l'espace réduit
**Validates: Requirements 4.5**

## Error Handling

### 1. Données Manquantes
- **Cas**: Aucune donnée FC disponible
- **Action**: Afficher message informatif avec suggestion de synchronisation
- **Fallback**: Conserver l'affichage des métriques rapides

### 2. Erreur de Chargement
- **Cas**: Échec du chargement des données Garmin
- **Action**: Afficher indicateur d'erreur avec bouton "Réessayer"
- **Fallback**: Utiliser les données en cache si disponibles

### 3. Espace Insuffisant
- **Cas**: Sidebar trop étroite pour le graphique
- **Action**: Basculer automatiquement en mode ultra-compact
- **Fallback**: Afficher seulement les métriques rapides

### 4. Performance Dégradée
- **Cas**: Rendu du graphique trop lent
- **Action**: Activer le mode de performance (moins d'animations)
- **Fallback**: Désactiver temporairement le graphique

## Testing Strategy

### Unit Tests
- Test des composants individuels (SidebarHeartRateChart)
- Test des transformations de données
- Test des cas d'erreur et fallbacks
- Test de l'intégration avec useRealGarminData

### Property-Based Tests
Les tests basés sur les propriétés utiliseront **fast-check** comme bibliothèque de property-based testing, configurés pour exécuter un minimum de 100 itérations chaque.

Chaque test de propriété sera tagué avec un commentaire référençant explicitement la propriété correspondante du document de design en utilisant le format : **Feature: garmin-heart-rate-chart-fix, Property {number}: {property_text}**

### Integration Tests
- Test de l'intégration complète dans GarminMetricsModule
- Test de la cohérence avec le sous-onglet Garmin
- Test de la navigation et des interactions
- Test de la synchronisation des données

### Performance Tests
- Test du temps de rendu initial (< 200ms)
- Test de la responsivité lors du redimensionnement
- Test de la mémoire utilisée par le graphique
- Test de la fluidité des animations