# SidebarHeartRateChart

Composant wrapper optimisé pour la sidebar autour de GarminHeartRateTimeSeriesChart.

## Fonctionnalités

- **Affichage compact** : Adapté à l'espace restreint de la sidebar (hauteur max 300px)
- **Cohérence visuelle** : Utilise les mêmes couleurs et styles que le sous-onglet Garmin
- **Légende simplifiée** : Affichage compact des zones de fréquence cardiaque
- **Tooltip optimisé** : Tooltip adapté pour l'espace réduit
- **Gestion des données** : Support des données éparses et des cas d'erreur

## Utilisation

```jsx
import { SidebarHeartRateChart } from './components/sidebar/charts';

<SidebarHeartRateChart
  garminData={garminData}
  selectedDate="2025-12-15"
  height={280}
  compactMode={true}
  colors={{ red: '#EF4444' }}
  activities={[]}
/>
```

## Props

- `garminData` : Données Garmin avec structure dailyMetrics
- `selectedDate` : Date sélectionnée au format YYYY-MM-DD
- `height` : Hauteur du graphique (max 300px)
- `compactMode` : Mode compact pour la sidebar (défaut: true)
- `colors` : Couleurs personnalisées
- `activities` : Activités du jour (optionnel)
- `className` : Classes CSS additionnelles

## Requirements Satisfaits

- **1.1** : Affichage du graphique FC temporel identique au sous-onglet Garmin
- **2.1** : Cohérence visuelle avec le sous-onglet (couleurs et styles)
- **4.1** : Adaptation à l'espace sidebar (hauteur max 300px)
- **4.4** : Légende compacte pour l'espace réduit

## Tests

- Tests unitaires : 9 tests couvrant les cas de base
- Tests d'intégration : 5 tests avec des données réalistes
- Composant de démonstration disponible

## Structure des fichiers

```
src/components/sidebar/charts/
├── SidebarHeartRateChart.jsx          # Composant principal
├── index.js                           # Export
├── README.md                          # Documentation
└── __tests__/
    ├── SidebarHeartRateChart.test.jsx           # Tests unitaires
    ├── SidebarHeartRateChart.integration.test.jsx  # Tests d'intégration
    └── SidebarHeartRateChart.demo.jsx           # Démonstration
```