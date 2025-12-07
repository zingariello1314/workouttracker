# Requirements Document - Projection Matrix Block Refonte

## Introduction

Ce document définit les exigences pour la refonte complète du bloc Projection Matrix du dashboard. L'objectif est de créer une interface futuriste, interactive et visuellement impressionnante qui permet aux utilisateurs de visualiser leurs projections de progression et de simuler différents scénarios en temps réel.

## Glossaire

- **Projection Matrix**: Système de visualisation des projections futures basées sur les données actuelles
- **XP (Experience Points)**: Points d'expérience accumulés via les quêtes
- **Quête**: Tâche ou objectif à accomplir (journalier, hebdomadaire, mensuel)
- **Efficacité**: Pourcentage de performance basé sur le ratio XP/jour vs objectif
- **Heatmap**: Carte de chaleur visualisant l'activité sur une période
- **Neural Link**: Indicateur de statut de connexion/synchronisation des données
- **Canvas**: Élément HTML5 pour dessiner des graphiques 2D

## Requirements

### Requirement 1: Affichage des statistiques principales

**User Story:** En tant qu'utilisateur, je veux voir mes statistiques principales en un coup d'œil, afin de comprendre rapidement ma progression actuelle.

#### Acceptance Criteria

1. WHEN l'utilisateur accède au bloc THEN le système SHALL afficher le niveau actuel de l'utilisateur
2. WHEN l'utilisateur accède au bloc THEN le système SHALL afficher le total d'XP accumulé
3. WHEN l'utilisateur accède au bloc THEN le système SHALL afficher le nombre de quêtes complétées
4. WHEN l'utilisateur accède au bloc THEN le système SHALL calculer et afficher l'efficacité en pourcentage
5. WHEN les données changent THEN le système SHALL mettre à jour les statistiques automatiquement

### Requirement 2: Simulateur temps réel interactif

**User Story:** En tant qu'utilisateur, je veux simuler différents scénarios de progression, afin de planifier mes objectifs et comprendre l'impact de mes actions.

#### Acceptance Criteria

1. WHEN l'utilisateur clique sur le compteur de quêtes journalières THEN le système SHALL incrémenter le compteur (0-5)
2. WHEN l'utilisateur clique sur le compteur de quêtes hebdomadaires THEN le système SHALL incrémenter le compteur (0-3)
3. WHEN les compteurs changent THEN le système SHALL recalculer automatiquement les projections
4. WHEN les projections sont recalculées THEN le système SHALL afficher le nouveau XP par jour
5. WHEN les projections sont recalculées THEN le système SHALL afficher le nombre de jours jusqu'au prochain niveau
6. WHEN les projections sont recalculées THEN le système SHALL afficher la date estimée du prochain niveau

### Requirement 3: Modes IA de projection

**User Story:** En tant qu'utilisateur, je veux choisir entre différents modes de projection, afin d'adapter les prédictions à mon niveau d'ambition.

#### Acceptance Criteria

1. WHEN l'utilisateur accède au bloc THEN le système SHALL afficher trois modes disponibles (Sécurisé, Optimiste, Extrême)
2. WHEN l'utilisateur sélectionne le mode Sécurisé THEN le système SHALL utiliser des prédictions conservatrices
3. WHEN l'utilisateur sélectionne le mode Optimiste THEN le système SHALL utiliser des prédictions moyennes
4. WHEN l'utilisateur sélectionne le mode Extrême THEN le système SHALL utiliser des prédictions ambitieuses
5. WHEN un mode est sélectionné THEN le système SHALL mettre en évidence visuellement le mode actif

### Requirement 4: Graphique d'évolution XP

**User Story:** En tant qu'utilisateur, je veux visualiser l'évolution de mon XP sur 30 jours, afin de comprendre mes tendances de progression.

#### Acceptance Criteria

1. WHEN le bloc est affiché THEN le système SHALL dessiner un graphique Canvas montrant l'évolution XP sur 30 jours
2. WHEN le graphique est dessiné THEN le système SHALL afficher des axes X et Y avec labels
3. WHEN le graphique est dessiné THEN le système SHALL afficher une grille de fond pour faciliter la lecture
4. WHEN le graphique est dessiné THEN le système SHALL tracer une courbe lisse reliant les points de données
5. WHEN le graphique est dessiné THEN le système SHALL mettre en évidence le point du jour actuel
6. WHEN le graphique est affiché THEN le système SHALL afficher les métriques (moyenne, maximum, minimum, aujourd'hui)

### Requirement 5: Graphique de répartition des activités

**User Story:** En tant qu'utilisateur, je veux voir la répartition de mes activités par type, afin d'identifier mes domaines d'engagement principaux.

#### Acceptance Criteria

1. WHEN le bloc est affiché THEN le système SHALL afficher un graphique en barres verticales des activités
2. WHEN le graphique est affiché THEN le système SHALL montrer au moins 6 types d'activités (Lecture, Sport, Apprentissage, Ménage, Santé, Social)
3. WHEN le graphique est affiché THEN le système SHALL utiliser des couleurs distinctes pour chaque type d'activité
4. WHEN le graphique est affiché THEN le système SHALL afficher le nombre d'occurrences sur chaque barre
5. WHEN le graphique est affiché THEN le système SHALL inclure un axe Y avec échelle (0-30)
6. WHEN le graphique est affiché THEN le système SHALL afficher les statistiques détaillées (quotidiennes, hebdomadaires, moyenne XP)

### Requirement 6: Matrice d'activité (Heatmap)

**User Story:** En tant qu'utilisateur, je veux voir une heatmap de mon activité sur 20 semaines, afin de visualiser ma régularité et identifier les périodes creuses.

#### Acceptance Criteria

1. WHEN le bloc est affiché THEN le système SHALL afficher une matrice de 20 semaines × 7 jours
2. WHEN la matrice est affichée THEN le système SHALL colorer chaque cellule selon l'intensité d'activité (5 niveaux)
3. WHEN la matrice est affichée THEN le système SHALL afficher les labels des jours (L, M, M, J, V, S, D)
4. WHEN la matrice est affichée THEN le système SHALL afficher les numéros de semaine
5. WHEN l'utilisateur survole une cellule THEN le système SHALL afficher un tooltip avec les détails
6. WHEN la matrice est affichée THEN le système SHALL afficher une légende des niveaux d'intensité
7. WHEN la matrice est affichée THEN le système SHALL afficher les métriques (régularité, streak, semaine actuelle)

### Requirement 7: Effets visuels et animations

**User Story:** En tant qu'utilisateur, je veux une interface visuellement attrayante avec des effets futuristes, afin d'avoir une expérience immersive et motivante.

#### Acceptance Criteria

1. WHEN le bloc est affiché THEN le système SHALL afficher des bordures lumineuses animées (top et bottom)
2. WHEN le bloc est affiché THEN le système SHALL afficher un effet de glow d'arrière-plan
3. WHEN le bloc est affiché THEN le système SHALL afficher un indicateur "Neural Link Actif" avec animation
4. WHEN l'utilisateur interagit avec les boutons THEN le système SHALL afficher des transitions fluides
5. WHEN les données changent THEN le système SHALL animer les changements de valeurs
6. WHEN le graphique est dessiné THEN le système SHALL utiliser des couleurs cyan/bleu pour le thème futuriste

### Requirement 8: Responsive et performance

**User Story:** En tant qu'utilisateur, je veux que le bloc fonctionne parfaitement sur tous les appareils, afin d'avoir une expérience cohérente.

#### Acceptance Criteria

1. WHEN le bloc est affiché sur mobile THEN le système SHALL adapter la mise en page en colonne
2. WHEN le bloc est affiché sur tablette THEN le système SHALL adapter la taille des graphiques
3. WHEN le bloc est affiché sur desktop THEN le système SHALL utiliser la mise en page complète
4. WHEN les graphiques Canvas sont dessinés THEN le système SHALL optimiser les performances pour éviter les lags
5. WHEN le composant est démonté THEN le système SHALL nettoyer les ressources Canvas

### Requirement 9: Gestion des données et calculs

**User Story:** En tant qu'utilisateur, je veux que les calculs de projection soient précis et basés sur mes données réelles, afin de prendre des décisions éclairées.

#### Acceptance Criteria

1. WHEN les projections sont calculées THEN le système SHALL utiliser la formule: XP/jour = (quêtes_journalières × 50) + (quêtes_hebdomadaires × 150 / 7)
2. WHEN le prochain niveau est calculé THEN le système SHALL utiliser la formule: XP_nécessaire = niveau_actuel × 200
3. WHEN les jours jusqu'au prochain niveau sont calculés THEN le système SHALL diviser XP_nécessaire par XP/jour
4. WHEN l'efficacité est calculée THEN le système SHALL utiliser la formule: (XP/jour / 100) × 100, plafonné à 100%
5. WHEN les données d'activité sont générées THEN le système SHALL créer des données réalistes pour les 20 dernières semaines

### Requirement 10: Accessibilité et utilisabilité

**User Story:** En tant qu'utilisateur, je veux que le bloc soit accessible et facile à utiliser, afin que tous puissent en profiter.

#### Acceptance Criteria

1. WHEN le bloc est affiché THEN le système SHALL utiliser des contrastes de couleurs suffisants pour la lisibilité
2. WHEN les boutons sont affichés THEN le système SHALL inclure des labels clairs et des icônes descriptives
3. WHEN les graphiques sont affichés THEN le système SHALL inclure des tooltips explicatifs
4. WHEN l'utilisateur navigue au clavier THEN le système SHALL permettre l'accès à tous les contrôles interactifs
5. WHEN les données sont en chargement THEN le système SHALL afficher un état de chargement approprié
