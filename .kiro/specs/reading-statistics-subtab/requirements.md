# Requirements Document - Sous-onglet Statistiques de Lecture

## Introduction

Ce document définit les exigences pour créer un sous-onglet "Statistiques" dans l'onglet Livres, permettant de visualiser et analyser les habitudes de lecture de l'utilisateur avec des graphiques interactifs et des métriques détaillées.

## Glossary

- **Reading_System**: Le système de gestion des livres et sessions de lecture
- **Statistics_Subtab**: Le sous-onglet dédié aux statistiques de lecture
- **Reading_Session**: Une session de lecture enregistrée avec date, durée, pages lues et notes
- **Reading_Metrics**: Les métriques calculées (vitesse, régularité, progression, etc.)
- **Time_Period_Filter**: Filtre temporel (7j, 1 mois, 3 mois, 6 mois, 1 an, tout)
- **Interactive_Chart**: Graphique interactif avec zoom, hover et filtres
- **Reading_Goal**: Objectif de lecture quotidien/hebdomadaire/mensuel
- **Reading_Streak**: Série de jours consécutifs avec lecture
- **Book_Category**: Catégorie de livre (fiction, non-fiction, technique, etc.)

## Requirements

### Requirement 1

**User Story:** En tant qu'utilisateur, je veux voir mes statistiques de lecture détaillées, afin de comprendre mes habitudes et progresser dans mes objectifs.

#### Acceptance Criteria

1. WHEN l'utilisateur accède au sous-onglet Statistiques THEN le Reading_System SHALL afficher un tableau de bord avec les métriques principales
2. WHEN l'utilisateur sélectionne une période temporelle THEN le Statistics_Subtab SHALL mettre à jour tous les graphiques et métriques pour cette période
3. WHEN l'utilisateur survole un graphique THEN le Interactive_Chart SHALL afficher les détails de la donnée (date, valeur, contexte)
4. WHEN l'utilisateur clique sur un point de données THEN le Reading_System SHALL afficher les détails de la session correspondante
5. WHEN aucune donnée n'existe pour la période THEN le Statistics_Subtab SHALL afficher un message informatif avec suggestions

### Requirement 2

**User Story:** En tant qu'utilisateur, je veux voir l'évolution de mes pages lues par jour, afin de visualiser ma régularité de lecture.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le graphique pages par jour THEN le Interactive_Chart SHALL afficher une courbe avec les pages lues quotidiennement
2. WHEN l'utilisateur change la période THEN le Reading_System SHALL recalculer et afficher les données pour 7j/1m/3m/6m/1an/tout
3. WHEN l'utilisateur survole un point THEN le Interactive_Chart SHALL afficher la date, nombre de pages, et livres lus ce jour
4. WHEN plusieurs sessions existent le même jour THEN le Reading_System SHALL agréger les pages de toutes les sessions
5. WHEN l'utilisateur clique sur "Voir détails" THEN le Statistics_Subtab SHALL afficher la liste des sessions de ce jour

### Requirement 3

**User Story:** En tant qu'utilisateur, je veux connaître ma vitesse de lecture moyenne, afin d'estimer le temps nécessaire pour terminer mes livres.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte les métriques de vitesse THEN le Reading_System SHALL calculer et afficher les pages par heure moyennes
2. WHEN l'utilisateur filtre par période THEN le Reading_Metrics SHALL recalculer la vitesse pour cette période uniquement
3. WHEN l'utilisateur filtre par genre de livre THEN le Statistics_Subtab SHALL afficher la vitesse spécifique à ce genre
4. WHEN l'utilisateur consulte l'évolution de vitesse THEN le Interactive_Chart SHALL afficher une courbe de progression dans le temps
5. WHEN l'utilisateur compare avec ses objectifs THEN le Reading_System SHALL indiquer si la vitesse permet d'atteindre les objectifs

### Requirement 4

**User Story:** En tant qu'utilisateur, je veux voir ma régularité de lecture avec un calendrier heatmap, afin d'identifier mes patterns et améliorer ma constance.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le calendrier heatmap THEN le Interactive_Chart SHALL afficher une grille avec intensité colorée par jour
2. WHEN l'utilisateur survole une case THEN le Statistics_Subtab SHALL afficher les détails du jour (pages, temps, livres)
3. WHEN l'utilisateur clique sur une case THEN le Reading_System SHALL afficher les sessions détaillées de ce jour
4. WHEN l'utilisateur change d'année THEN le Interactive_Chart SHALL mettre à jour le calendrier pour l'année sélectionnée
5. WHEN l'utilisateur consulte les streaks THEN le Reading_System SHALL calculer et afficher les séries de jours consécutifs

### Requirement 5

**User Story:** En tant qu'utilisateur, je veux analyser mes habitudes par genre de livre, afin de comprendre mes préférences et diversifier ma lecture.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte la répartition par genre THEN le Interactive_Chart SHALL afficher un graphique en secteurs avec pourcentages
2. WHEN l'utilisateur clique sur un secteur THEN le Statistics_Subtab SHALL filtrer toutes les statistiques pour ce genre uniquement
3. WHEN l'utilisateur compare les vitesses par genre THEN le Reading_System SHALL afficher un graphique en barres comparatif
4. WHEN l'utilisateur consulte l'évolution temporelle par genre THEN le Interactive_Chart SHALL afficher des courbes empilées
5. WHEN l'utilisateur analyse ses préférences THEN le Reading_Metrics SHALL calculer le temps moyen passé par genre

### Requirement 6

**User Story:** En tant qu'utilisateur, je veux suivre mes objectifs de lecture avec des indicateurs visuels, afin de rester motivé et atteindre mes buts.

#### Acceptance Criteria

1. WHEN l'utilisateur définit un objectif quotidien THEN le Reading_System SHALL sauvegarder et afficher la progression en temps réel
2. WHEN l'utilisateur consulte ses objectifs THEN le Statistics_Subtab SHALL afficher des barres de progression avec pourcentages
3. WHEN l'utilisateur atteint un objectif THEN le Reading_System SHALL afficher une célébration visuelle
4. WHEN l'utilisateur consulte l'historique d'objectifs THEN le Interactive_Chart SHALL afficher l'évolution des objectifs atteints/manqués
5. WHEN l'utilisateur compare objectifs vs réalisé THEN le Reading_Metrics SHALL calculer le taux de réussite par période

### Requirement 7

**User Story:** En tant qu'utilisateur, je veux voir des statistiques avancées (temps de lecture, sessions, livres terminés), afin d'avoir une vue complète de mon activité.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le temps total THEN le Reading_System SHALL afficher les heures et minutes lues par période
2. WHEN l'utilisateur analyse ses sessions THEN le Statistics_Subtab SHALL afficher la durée moyenne, fréquence et répartition horaire
3. WHEN l'utilisateur consulte ses accomplissements THEN le Reading_Metrics SHALL afficher les livres terminés avec dates et durées
4. WHEN l'utilisateur compare les périodes THEN le Interactive_Chart SHALL afficher l'évolution des métriques dans le temps
5. WHEN l'utilisateur exporte ses statistiques THEN le Reading_System SHALL générer un rapport PDF ou CSV

### Requirement 8

**User Story:** En tant qu'utilisateur, je veux des prédictions et recommandations basées sur mes données, afin d'optimiser mes habitudes de lecture.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte les prédictions THEN le Reading_System SHALL estimer le temps pour terminer les livres en cours
2. WHEN l'utilisateur demande des recommandations THEN le Statistics_Subtab SHALL suggérer des objectifs réalistes basés sur l'historique
3. WHEN l'utilisateur analyse ses patterns THEN le Reading_Metrics SHALL identifier les meilleurs créneaux horaires et jours
4. WHEN l'utilisateur consulte les tendances THEN le Interactive_Chart SHALL afficher les évolutions et projections futures
5. WHEN l'utilisateur reçoit des insights THEN le Reading_System SHALL proposer des actions concrètes d'amélioration

### Requirement 9

**User Story:** En tant qu'utilisateur, je veux comparer mes performances sur différentes périodes, afin de mesurer mes progrès et identifier les tendances.

#### Acceptance Criteria

1. WHEN l'utilisateur active le mode comparaison THEN le Statistics_Subtab SHALL afficher deux périodes côte à côte
2. WHEN l'utilisateur sélectionne les périodes à comparer THEN le Reading_System SHALL calculer les différences et pourcentages d'évolution
3. WHEN l'utilisateur consulte les graphiques comparatifs THEN le Interactive_Chart SHALL utiliser des couleurs distinctes pour chaque période
4. WHEN l'utilisateur analyse les écarts THEN le Reading_Metrics SHALL mettre en évidence les améliorations et régressions
5. WHEN l'utilisateur sauvegarde une comparaison THEN le Reading_System SHALL permettre de retrouver cette analyse plus tard

### Requirement 10

**User Story:** En tant qu'utilisateur, je veux une interface responsive et intuitive, afin d'accéder facilement à mes statistiques sur tous mes appareils.

#### Acceptance Criteria

1. WHEN l'utilisateur accède depuis un mobile THEN le Statistics_Subtab SHALL adapter la mise en page pour les petits écrans
2. WHEN l'utilisateur navigue entre les graphiques THEN le Interactive_Chart SHALL maintenir une expérience fluide et cohérente
3. WHEN l'utilisateur utilise les filtres THEN le Reading_System SHALL mettre à jour les données sans rechargement de page
4. WHEN l'utilisateur partage un graphique THEN le Statistics_Subtab SHALL permettre l'export en image ou lien
5. WHEN l'utilisateur personnalise l'affichage THEN le Reading_System SHALL sauvegarder les préférences localement