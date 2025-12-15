# Requirements Document - Correction Graphique Fréquence Cardiaque Module Garmin

## Introduction

Le module Métriques Garmin dans la sidebar affiche actuellement seulement les zones de fréquence cardiaque sous forme de liste statique, alors que l'utilisateur souhaite voir le graphique temporel de fréquence cardiaque (comme celui présent dans le sous-onglet Garmin du sport) directement depuis le module sidebar.

## Glossary

- **Module_Garmin_Sidebar**: Module Métriques Garmin présent dans la sidebar historique
- **Graphique_FC_Temporel**: Graphique de fréquence cardiaque temporel sur 24h avec courbe continue
- **Sous_Onglet_Garmin**: Sous-onglet Garmin présent dans l'onglet Sport
- **GarminHeartRateTimeSeriesChart**: Composant existant qui affiche le graphique FC temporel
- **HeartRateZonesChart**: Composant existant qui affiche les zones FC sous forme de barres

## Requirements

### Requirement 1

**User Story:** En tant qu'utilisateur, je veux voir le graphique de fréquence cardiaque temporel directement dans le module Métriques Garmin de la sidebar, afin de visualiser ma fréquence cardiaque sur 24h sans naviguer vers le sous-onglet Sport.

#### Acceptance Criteria

1. WHEN le module Métriques Garmin est étendu THEN le système SHALL afficher le graphique de fréquence cardiaque temporel identique à celui du sous-onglet Garmin
2. WHEN des données de fréquence cardiaque sont disponibles THEN le système SHALL afficher la courbe FC avec les zones colorées (Maximum, Moyenne, Repos)
3. WHEN l'utilisateur survole le graphique THEN le système SHALL afficher un tooltip avec les détails de FC et la zone correspondante
4. WHEN aucune donnée FC n'est disponible THEN le système SHALL afficher un message informatif avec suggestion de synchronisation
5. WHEN le graphique est affiché THEN le système SHALL maintenir les performances et la responsivité du module

### Requirement 2

**User Story:** En tant qu'utilisateur, je veux que le graphique de fréquence cardiaque dans la sidebar soit cohérent avec celui du sous-onglet Garmin, afin d'avoir une expérience utilisateur uniforme.

#### Acceptance Criteria

1. WHEN le graphique FC est affiché dans la sidebar THEN le système SHALL utiliser les mêmes couleurs et styles que le sous-onglet Garmin
2. WHEN les données FC sont identiques THEN le système SHALL afficher exactement la même courbe dans les deux emplacements
3. WHEN l'utilisateur interagit avec le graphique THEN le système SHALL fournir les mêmes fonctionnalités (tooltip, zones, statistiques)
4. WHEN le graphique est redimensionné THEN le système SHALL s'adapter à l'espace disponible dans la sidebar
5. WHEN les données sont mises à jour THEN le système SHALL synchroniser automatiquement les deux graphiques

### Requirement 3

**User Story:** En tant qu'utilisateur, je veux que le module Garmin conserve ses fonctionnalités existantes tout en ajoutant le graphique FC, afin de ne pas perdre l'accès aux métriques rapides.

#### Acceptance Criteria

1. WHEN le module est affiché THEN le système SHALL conserver l'affichage des métriques rapides (calories, body battery, pas, FC repos)
2. WHEN le module est étendu THEN le système SHALL afficher à la fois les métriques rapides ET le graphique FC temporel
3. WHEN l'utilisateur clique sur les métriques rapides THEN le système SHALL maintenir la navigation vers le sous-onglet Sport
4. WHEN le graphique FC est affiché THEN le système SHALL remplacer ou compléter l'affichage actuel des zones FC statiques
5. WHEN les performances sont mesurées THEN le système SHALL maintenir un temps de rendu inférieur à 200ms pour le module complet

### Requirement 4

**User Story:** En tant qu'utilisateur, je veux que le graphique FC dans la sidebar soit optimisé pour l'espace restreint, afin d'avoir une visualisation claire malgré la taille réduite.

#### Acceptance Criteria

1. WHEN le graphique FC est affiché dans la sidebar THEN le système SHALL adapter la hauteur à maximum 300px
2. WHEN l'espace est limité THEN le système SHALL prioriser l'affichage de la courbe FC principale
3. WHEN les labels sont affichés THEN le système SHALL utiliser une taille de police adaptée à l'espace sidebar
4. WHEN les zones FC sont affichées THEN le système SHALL utiliser un affichage compact (légende simplifiée)
5. WHEN le graphique est interactif THEN le système SHALL maintenir la lisibilité des tooltips malgré l'espace réduit