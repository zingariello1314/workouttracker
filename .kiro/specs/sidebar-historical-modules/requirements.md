# Requirements Document - Modules Sidebar Historiques

## Introduction

Ce document définit les exigences pour l'implémentation de 11 nouveaux modules sidebar historiques qui affichent des données temps réel et historiques avec navigation précise vers les modules correspondants dans l'application.

## Glossaire

- **Sidebar_Module** : Module d'affichage dans la barre latérale premium
- **Navigation_System** : Système de navigation précise vers les modules cibles
- **Timer_Component** : Composant de chronométrage intégré
- **Data_Sync** : Synchronisation des données entre sidebar et modules principaux
- **Deep_Link** : Navigation directe vers un module spécifique avec scroll automatique

## Requirements

### Requirement 1

**User Story:** En tant qu'utilisateur, je veux un module d'enregistrement de sessions en haut de la sidebar, afin de pouvoir rapidement démarrer et enregistrer mes activités.

#### Acceptance Criteria

1. WHEN l'utilisateur clique sur "Session Sport" THEN le système SHALL naviguer vers l'onglet Sport > sous-onglet "Aujourd'hui" avec scroll automatique vers le module exact
2. WHEN l'utilisateur clique sur "Session Lecture" THEN le système SHALL naviguer vers l'onglet Livres > module approprié avec positionnement précis
3. WHEN l'utilisateur démarre le timer lecture THEN le système SHALL afficher un chronomètre avec contrôles Play/Pause/Stop
4. WHEN l'utilisateur arrête le timer THEN le système SHALL ouvrir une modal obligatoire avec sélection livre et nombre de pages
5. WHEN l'utilisateur valide la session THEN le système SHALL enregistrer les données dans l'onglet Livres pour le livre sélectionné
6. WHEN l'utilisateur clique sur "Enregistrer Apprentissage" THEN le système SHALL ouvrir un menu avec sélection matière et durée

### Requirement 2

**User Story:** En tant qu'utilisateur, je veux voir ma progression de lecture historique, afin de suivre mes habitudes de lecture sur différentes périodes.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le module THEN le système SHALL afficher les livres terminés sur la période sélectionnée
2. WHEN l'utilisateur change la période THEN le système SHALL recalculer les métriques (7j, 30j, 3m, 6m, 1a)
3. WHEN les données sont mises à jour THEN le système SHALL afficher pages totales, temps total et vitesse moyenne
4. WHEN l'utilisateur clique sur le module THEN le système SHALL naviguer vers l'onglet Livres avec scroll précis
5. WHEN les tendances changent THEN le système SHALL afficher les indicateurs ↗️ ↘️ ➡️

### Requirement 3

**User Story:** En tant qu'utilisateur, je veux voir mes métriques Garmin du jour, afin de suivre ma performance physique actuelle.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le module THEN le système SHALL afficher les calories brûlées (repos et actives séparées)
2. WHEN les données Garmin sont disponibles THEN le système SHALL afficher Body Battery, nombre de pas, FC (repos/max/moyenne)
3. WHEN les données de sommeil existent THEN le système SHALL les inclure dans l'affichage
4. WHEN l'utilisateur clique sur le module THEN le système SHALL naviguer vers Sport > sous-onglet approprié avec positionnement exact
5. WHEN les métriques sont mises à jour THEN le système SHALL rafraîchir l'affichage en temps réel

### Requirement 4

**User Story:** En tant qu'utilisateur, je veux interagir avec mes quêtes depuis la sidebar, afin de gérer rapidement mes objectifs quotidiens.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le module THEN le système SHALL afficher les quêtes du jour avec checkboxes fonctionnelles
2. WHEN l'utilisateur coche/décoche une quête THEN le système SHALL synchroniser l'état avec l'onglet Quêtes
3. WHEN l'XP change THEN le système SHALL mettre à jour la barre XP et le niveau en temps réel
4. WHEN l'utilisateur clique sur "Créer Quête" THEN le système SHALL naviguer vers Quêtes > sous-onglet exact de création
5. WHEN l'utilisateur consulte les statistiques THEN le système SHALL permettre de varier l'échelle de temps individuellement

### Requirement 5

**User Story:** En tant qu'utilisateur, je veux suivre l'évolution de mon patrimoine, afin de monitorer ma santé financière.

#### Acceptance Criteria

1. WHEN l'utilisateur sélectionne une période THEN le système SHALL calculer la variation patrimoine net (30j, 3m, 6m, 1a)
2. WHEN les données financières changent THEN le système SHALL afficher épargne moyenne/mois et performance investissements
3. WHEN des objectifs sont atteints THEN le système SHALL afficher les indicateurs de tendance
4. WHEN l'utilisateur clique sur le module THEN le système SHALL naviguer vers Finances > module patrimoine avec scroll précis
5. WHEN les calculs sont terminés THEN le système SHALL afficher les métriques avec indicateurs visuels

### Requirement 6

**User Story:** En tant qu'utilisateur, je veux voir ma liste de courses du jour, afin d'accéder rapidement à mes achats planifiés.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le module THEN le système SHALL afficher la liste programmée pour la plage horaire actuelle
2. WHEN aucune liste n'est programmée maintenant THEN le système SHALL afficher la liste la plus proche temporellement
3. WHEN l'utilisateur clique sur une liste THEN le système SHALL naviguer vers Finances > Smart Shopping > sous-onglet exact
4. WHEN les listes changent THEN le système SHALL mettre à jour l'affichage automatiquement
5. WHEN la navigation s'effectue THEN le système SHALL positionner précisément sur le module Smart Shopping

### Requirement 7

**User Story:** En tant qu'utilisateur, je veux voir ma session de lecture active, afin de suivre ma progression en cours.

#### Acceptance Criteria

1. WHEN une session est active THEN le système SHALL afficher le livre en cours avec progression
2. WHEN un timer est lancé THEN le système SHALL afficher le chronomètre de session actuelle
3. WHEN des objectifs sont définis THEN le système SHALL afficher objectif pages/temps du jour avec progression
4. WHEN l'utilisateur clique sur le module THEN le système SHALL naviguer vers Livres > module session avec positionnement exact
5. WHEN la session se termine THEN le système SHALL mettre à jour les statistiques automatiquement

### Requirement 8

**User Story:** En tant qu'utilisateur, je veux voir mon entraînement du jour, afin de suivre mes objectifs sportifs.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le module THEN le système SHALL afficher les séances planifiées aujourd'hui
2. WHEN des muscles sont ciblés THEN le système SHALL afficher les groupes musculaires avec progression
3. WHEN des objectifs sportifs existent THEN le système SHALL afficher les objectifs quotidiens
4. WHEN l'utilisateur clique sur le module THEN le système SHALL naviguer vers Sport > module entraînement avec scroll précis
5. WHEN les séances sont complétées THEN le système SHALL mettre à jour les indicateurs de progression

### Requirement 9

**User Story:** En tant qu'utilisateur, je veux suivre mes projets créatifs, afin de maintenir ma motivation artistique.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le module THEN le système SHALL afficher les projets créatifs en cours
2. WHEN des sessions récentes existent THEN le système SHALL afficher les sessions d'écriture/art récentes
3. WHEN l'inspiration change THEN le système SHALL faire tourner l'inspiration du jour
4. WHEN l'utilisateur clique sur le module THEN le système SHALL naviguer vers la page d'accueil avec positionnement sur les projets créatifs
5. WHEN de nouveaux projets sont ajoutés THEN le système SHALL mettre à jour l'affichage automatiquement

### Requirement 10

**User Story:** En tant qu'utilisateur, je veux voir ma performance globale, afin d'évaluer mon équilibre de vie.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le module THEN le système SHALL calculer le score de productivité quotidien
2. WHEN les données changent THEN le système SHALL évaluer l'équilibre vie/travail/loisirs
3. WHEN des patterns sont détectés THEN le système SHALL générer des recommandations IA
4. WHEN l'utilisateur clique sur le module THEN le système SHALL naviguer vers la page d'accueil avec focus sur performance
5. WHEN les métriques sont calculées THEN le système SHALL afficher les scores avec visualisations

### Requirement 11

**User Story:** En tant qu'utilisateur, je veux suivre mon apprentissage express, afin de monitorer mes sessions d'étude.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le module THEN le système SHALL afficher les sessions récentes par matière
2. WHEN une période est sélectionnée THEN le système SHALL calculer le temps d'étude total sur périodes configurables
3. WHEN des domaines sont étudiés THEN le système SHALL afficher la progression par domaine de connaissance
4. WHEN l'utilisateur clique sur le module THEN le système SHALL naviguer vers Paramètres > module apprentissage avec positionnement exact
5. WHEN les sessions sont enregistrées THEN le système SHALL calculer les statistiques de régularité

### Requirement 12

**User Story:** En tant que système, je veux une navigation précise entre modules, afin d'assurer une expérience utilisateur fluide.

#### Acceptance Criteria

1. WHEN un utilisateur clique sur un module sidebar THEN le système SHALL naviguer vers l'onglet exact avec scroll automatique
2. WHEN le module cible est en bas de page THEN le système SHALL scroller jusqu'au module précis
3. WHEN la navigation s'effectue THEN le système SHALL activer le bon sous-onglet automatiquement
4. WHEN le module est atteint THEN le système SHALL mettre en évidence le module ciblé temporairement
5. WHEN les données sont synchronisées THEN le système SHALL maintenir la cohérence entre sidebar et modules principaux

### Requirement 13

**User Story:** En tant qu'utilisateur, je veux que les nouveaux modules soient entremêlés avec les anciens, afin d'avoir une sidebar équilibrée et harmonieuse.

#### Acceptance Criteria

1. WHEN la sidebar s'affiche THEN le système SHALL alterner anciens et nouveaux modules dans l'ordre d'affichage
2. WHEN l'utilisateur fait défiler THEN le système SHALL maintenir la séquence : ancien module → nouveau module → ancien module → nouveau module
3. WHEN les modules se positionnent THEN le système SHALL respecter l'ordre d'entremêlement défini
4. WHEN de nouveaux modules sont ajoutés THEN le système SHALL les insérer entre les modules existants
5. WHEN l'affichage est mis à jour THEN le système SHALL préserver la cohérence visuelle entre anciens et nouveaux modules

### Requirement 14

**User Story:** En tant que système, je veux des performances optimales, afin d'assurer une réactivité constante.

#### Acceptance Criteria

1. WHEN les modules se chargent THEN le système SHALL optimiser les requêtes de données
2. WHEN les données changent THEN le système SHALL utiliser la synchronisation temps réel efficace
3. WHEN la sidebar s'affiche THEN le système SHALL charger les données en moins de 500ms
4. WHEN les calculs sont complexes THEN le système SHALL utiliser la mise en cache intelligente
5. WHEN les erreurs surviennent THEN le système SHALL gérer les états d'erreur gracieusement