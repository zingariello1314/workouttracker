# Requirements Document - Dashboard Analysis

## Introduction

Ce document décrit l'ensemble des 28 blocs présents dans le dashboard de l'application QuietQuest. Le dashboard est organisé en 4 niveaux de priorité (MAX, HIGH, MODERATE, LOW) et chaque bloc a une fonction spécifique dans l'écosystème de productivité et de suivi personnel.

### Répartition des blocs par priorité

- **Priority-MAX**: 4 blocs critiques (Quêtes, Sport, Patrimoine, Lecture)
- **Priority-HIGH**: 8 blocs importants (Apprentissage, Timer, Dernière Chance, Régularité, Budget, Livre Principal, Portfolio, Surveillance)
- **Priority-MODERATE**: 3 blocs d'analyse (Progression Hebdomadaire, Performance Aujourd'hui, Rythme de Lecture)
- **Priority-LOW**: 13 blocs complémentaires (DCA, Smart Progression, Quick Stats, Performance Lecture, Allocation Salaire, Comparaisons Sport/Lecture, Matrice Projection, Quête Express, Théorie vs Réalité, Loisirs, Échéances, News)

## Glossary

- **Dashboard**: Interface principale affichant l'ensemble des blocs d'information
- **Bloc**: Composant visuel autonome affichant des données spécifiques
- **XP**: Points d'expérience gagnés par l'utilisateur
- **DCA**: Dollar Cost Averaging - stratégie d'investissement régulier
- **Streak**: Série de jours consécutifs d'activité
- **Timer**: Chronomètre pour sessions de travail/apprentissage
- **Portfolio**: Ensemble des positions boursières de l'utilisateur
- **Quête**: Tâche ou objectif à accomplir
- **Patrimoine**: Valeur totale des actifs financiers (or, actions, liquidités)
- **Régularité**: Maintien d'une activité quotidienne sans interruption
- **Session**: Période de temps dédiée à une activité spécifique
- **Analytics**: Analyses statistiques des performances et tendances
- **Surveillance**: Système de monitoring des marchés financiers en temps réel

## Requirements

---

## PRIORITY-MAX BLOCKS (4 blocs critiques)

---

### Requirement 1: Bloc Quête du Jour (Priority-MAX)

**User Story:** En tant qu'utilisateur, je veux voir mes quêtes quotidiennes avec progression XP, afin de suivre mes objectifs journaliers.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le bloc THEN le système SHALL afficher toutes les quêtes du jour
2. THE système SHALL afficher pour chaque quête: icône, nom, XP, statut de complétion
3. WHEN l'utilisateur clique sur une quête THEN le système SHALL basculer son statut (complété/non-complété)
4. THE système SHALL afficher la progression XP: XP gagné / XP potentiel
5. THE système SHALL afficher une barre de progression visuelle du XP
6. WHEN une quête est complétée THEN le système SHALL émettre un événement global
7. THE système SHALL afficher les quêtes par priorité (high, medium, low)

### Requirement 2: Bloc Séance Sport Active (Priority-MAX)

**User Story:** En tant qu'utilisateur, je veux enregistrer mes séances de sport et voir mes analytics, afin de suivre ma progression physique.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le bloc THEN le système SHALL afficher un formulaire de saisie d'exercices
2. THE système SHALL permettre de saisir: pompes, gainage, curls, tractions, dips, tractions australiennes
3. THE système SHALL afficher la valeur précédente pour chaque exercice
4. WHEN l'utilisateur modifie une valeur THEN le système SHALL calculer la différence vs dernière session
5. WHEN l'utilisateur enregistre THEN le système SHALL sauvegarder la séance et empêcher les doublons quotidiens
6. THE système SHALL afficher les analytics des 7 et 30 derniers jours
7. THE système SHALL afficher la fréquence, volume par exercice, progression mensuelle
8. WHEN un record est battu THEN le système SHALL afficher une notification et des confettis
9. THE système SHALL afficher le streak de jours consécutifs

### Requirement 3: Bloc Patrimoine Temps Réel (Priority-MAX)

**User Story:** En tant qu'utilisateur, je veux voir mon patrimoine en temps réel, afin de monitorer ma situation financière globale.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le bloc THEN le système SHALL afficher la valeur totale du patrimoine
2. THE système SHALL afficher la performance du jour en euros et pourcentage
3. THE système SHALL afficher la répartition Or/Bourse/Cash avec jauges circulaires
4. THE système SHALL afficher pour chaque actif: pourcentage actuel, pourcentage cible, statut de santé
5. THE système SHALL calculer le statut global: good, warning, critical
6. WHEN un actif dévie de sa cible THEN le système SHALL afficher une alerte
7. THE système SHALL afficher un indicateur de connexion temps réel
8. THE système SHALL actualiser automatiquement toutes les 5 minutes
9. WHEN l'utilisateur clique sur actualiser THEN le système SHALL rafraîchir toutes les données

### Requirement 4: Bloc Session de Lecture (Priority-MAX)

**User Story:** En tant qu'utilisateur, je veux enregistrer mes sessions de lecture et voir mes analytics, afin de suivre ma progression littéraire.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le bloc THEN le système SHALL afficher un sélecteur de livres actifs
2. THE système SHALL permettre d'ajouter un nouveau livre
3. WHEN un livre est sélectionné THEN le système SHALL afficher: couverture, titre, auteur, progression
4. THE système SHALL permettre de saisir: durée (heures/minutes), pages lues, notes
5. THE système SHALL calculer et afficher le temps estimé pour terminer le livre
6. WHEN l'utilisateur enregistre THEN le système SHALL sauvegarder la session
7. THE système SHALL afficher les analytics des 7 et 30 derniers jours
8. THE système SHALL afficher: temps total, livres actifs, sessions, répartition par genre
9. THE système SHALL afficher la vitesse de lecture moyenne en pages/heure
10. WHEN un livre n'a pas été lu depuis 7 jours THEN le système SHALL afficher une alerte

---

## PRIORITY-HIGH BLOCKS (8 blocs importants)

---

### Requirement 5: Bloc Status Apprentissage (Priority-HIGH)

**User Story:** En tant qu'utilisateur, je veux suivre mon apprentissage quotidien, afin de respecter mes objectifs de formation.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le bloc THEN le système SHALL afficher la matière active du jour
2. THE système SHALL afficher le nombre de sessions complétées vs planifiées
3. THE système SHALL afficher le temps étudié vs l'objectif quotidien
4. WHEN l'utilisateur clique sur "Session" THEN le système SHALL démarrer un timer d'apprentissage
5. THE système SHALL afficher le streak de jours consécutifs d'apprentissage
6. WHEN l'objectif quotidien est atteint THEN le système SHALL afficher un badge "ATTEINT"
7. THE système SHALL permettre d'ouvrir les notes de la matière active
8. THE système SHALL afficher une icône spécifique par matière

### Requirement 6: Bloc Timer Actif (Priority-HIGH)

**User Story:** En tant qu'utilisateur, je veux utiliser un timer configurable, afin de gérer mes sessions de travail et de pause.

#### Acceptance Criteria

1. WHEN l'utilisateur démarre le timer THEN le système SHALL démarrer le décompte configuré
2. WHEN le timer est inactif THEN le système SHALL afficher les options de configuration (sessions, durée focus, durée pause)
3. WHEN une session se termine THEN le système SHALL jouer un son de notification
4. THE système SHALL afficher la progression visuelle sous forme de cercle
5. WHEN l'utilisateur met en pause THEN le système SHALL arrêter le décompte et afficher la durée de pause
6. THE système SHALL permettre d'étendre le timer de 5 minutes
7. WHEN toutes les sessions sont terminées THEN le système SHALL afficher un message de félicitations
8. THE système SHALL afficher le numéro de session actuelle et le total de sessions

### Requirement 7: Bloc Dernière Chance (Priority-HIGH)

**User Story:** En tant qu'utilisateur, je veux voir les quêtes non terminées avec le temps restant, afin de prioriser mes actions avant minuit.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le bloc THEN le système SHALL afficher le compte à rebours jusqu'à minuit
2. WHEN des quêtes sont incomplètes THEN le système SHALL lister toutes les quêtes restantes avec leur XP
3. WHEN l'utilisateur complète une quête THEN le système SHALL la retirer de la liste avec animation
4. THE système SHALL afficher le nombre total de quêtes restantes et l'XP total disponible
5. WHEN le temps restant est critique (< 3h) THEN le système SHALL faire clignoter le bloc
6. THE système SHALL permettre de marquer toutes les quêtes comme terminées en un clic
7. WHEN toutes les quêtes sont terminées THEN le système SHALL afficher un message de félicitations
8. THE système SHALL calculer le niveau d'urgence: high, medium, low, normal

### Requirement 8: Bloc Régularité Quotidienne (Priority-HIGH)

**User Story:** En tant qu'utilisateur, je veux suivre ma régularité quotidienne, afin de maintenir mes habitudes et ma motivation.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le bloc THEN le système SHALL afficher le nombre de jours consécutifs (streak)
2. WHEN l'utilisateur maintient sa régularité THEN le système SHALL incrémenter le compteur de streak
3. WHEN minuit approche sans activité THEN le système SHALL afficher un compte à rebours urgent
4. THE système SHALL afficher l'historique des 7 derniers jours avec statut de chaque jour
5. WHEN l'utilisateur bat son record THEN le système SHALL déclencher une célébration avec confettis
6. THE système SHALL afficher une flamme dont la taille varie selon la longueur du streak
7. WHEN le streak est rompu THEN le système SHALL réinitialiser le compteur à zéro
8. THE système SHALL calculer le pourcentage de progression vers le record personnel

### Requirement 9: Bloc Budget Mensuel (Priority-HIGH)

**User Story:** En tant qu'utilisateur, je veux suivre mon budget mensuel, afin de contrôler mes dépenses et respecter mes objectifs financiers.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le bloc THEN le système SHALL afficher un cercle de progression du budget utilisé
2. THE système SHALL afficher les revenus totaux, dépenses totales et budget restant
3. THE système SHALL afficher les 3 catégories les plus remarquables (dépassement ou économie)
4. WHEN le budget atteint 90% THEN le système SHALL afficher une alerte warning
5. WHEN le budget est dépassé THEN le système SHALL afficher une alerte critique
6. THE système SHALL permettre d'ajouter une dépense rapidement
7. THE système SHALL afficher l'intégration avec Smart Shopping et les économies réalisées
8. THE système SHALL afficher le nombre de jours restants dans le mois
9. THE système SHALL calculer les projections de fin de mois

### Requirement 10: Bloc Progression Livre Principal (Priority-HIGH)

**User Story:** En tant qu'utilisateur, je veux suivre ma progression de lecture, afin de maintenir mon rythme et atteindre mes objectifs.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le bloc THEN le système SHALL afficher la couverture du livre actuel
2. THE système SHALL permettre d'uploader une image de couverture personnalisée
3. THE système SHALL afficher la progression en pages et en pourcentage
4. THE système SHALL afficher un graphique des 7 derniers jours de lecture
5. THE système SHALL calculer et afficher le temps estimé pour terminer le livre
6. WHEN l'utilisateur atteint un jalon (25%, 50%, 75%, 90%) THEN le système SHALL afficher une notification
7. WHEN le livre est terminé THEN le système SHALL déclencher une célébration avec confettis
8. THE système SHALL afficher le temps total investi dans le livre
9. THE système SHALL sauvegarder la couverture uploadée dans localStorage

### Requirement 11: Bloc Portfolio Bourse (Priority-HIGH)

**User Story:** En tant qu'utilisateur, je veux suivre mes positions boursières, afin de monitorer mes investissements en temps réel.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le bloc THEN le système SHALL afficher les 3 meilleures positions
2. THE système SHALL afficher les 3 pires positions
3. THE système SHALL afficher le logo de chaque entreprise si disponible
4. THE système SHALL afficher le gain/perte en euros et en pourcentage pour chaque position
5. THE système SHALL permettre de sélectionner différentes périodes (1J, 1S, 1M, 6M, 1A)
6. WHEN l'utilisateur change de période THEN le système SHALL mettre à jour toutes les données
7. THE système SHALL afficher la valeur totale du portfolio et la variation quotidienne
8. THE système SHALL permettre d'actualiser les données manuellement
9. WHEN une position varie significativement THEN le système SHALL afficher une alerte
10. THE système SHALL actualiser automatiquement toutes les 5 minutes pendant les heures de marché

### Requirement 12: Bloc Surveillance Marchés (Priority-HIGH)

**User Story:** En tant qu'utilisateur, je veux surveiller les marchés financiers en temps réel, afin de prendre des décisions d'investissement éclairées.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le bloc THEN le système SHALL afficher le statut des marchés (ouverts/fermés)
2. THE système SHALL afficher les actualités financières par catégories (Bourse, Crypto, Économie, Politique)
3. THE système SHALL afficher pour chaque actualité: titre, source, sentiment, impact, score qualité
4. THE système SHALL permettre de filtrer les actualités par impact, source, région, secteur
5. THE système SHALL permettre de trier par récence, ancienneté, pertinence, sentiment
6. THE système SHALL afficher les meilleurs et pires performers du jour
7. THE système SHALL afficher les opportunités d'arbitrage détectées
8. THE système SHALL afficher les corrélations inattendues entre actifs
9. THE système SHALL afficher le calendrier économique avec événements importants
10. THE système SHALL afficher l'analyse comportementale du marché (Fear & Greed Index)
11. THE système SHALL afficher l'intelligence prédictive avec probabilités de mouvements
12. THE système SHALL afficher les alertes de volatilité et événements critiques
13. THE système SHALL afficher les recommandations IA personnalisées
14. WHEN l'utilisateur clique sur une actualité THEN le système SHALL ouvrir l'article dans un nouvel onglet
15. THE système SHALL afficher le statut de connexion des APIs (NewsAPI, Finnhub, Reddit)
16. WHEN c'est le weekend THEN le système SHALL adapter l'affichage pour les marchés fermés
17. THE système SHALL permettre d'actualiser les données manuellement
18. THE système SHALL afficher des statistiques globales: total actualités, sentiment moyen, catégories actives

---

## PRIORITY-MODERATE BLOCKS (3 blocs)

---

### Requirement 13: Bloc Progression Hebdomadaire (Priority-MODERATE)

**User Story:** En tant qu'utilisateur, je veux voir ma progression hebdomadaire détaillée, afin d'analyser mes performances et tendances.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le bloc THEN le système SHALL afficher le numéro de semaine et l'année
2. THE système SHALL afficher le score global de la semaine sur 5
3. THE système SHALL afficher le temps total, nombre de sessions, jours complétés
4. THE système SHALL afficher le streak actuel et le record
5. THE système SHALL afficher la progression par matière avec sessions et temps
6. THE système SHALL afficher les achievements débloqués cette semaine
7. THE système SHALL afficher un graphique circulaire de répartition du temps
8. THE système SHALL afficher une heatmap de performance par créneau horaire
9. THE système SHALL afficher les tendances sur 4 semaines
10. THE système SHALL afficher les objectifs hebdomadaires avec statut de complétion

### Requirement 14: Bloc Performance Aujourd'hui (Priority-MODERATE)

**User Story:** En tant qu'utilisateur, je veux voir ma performance du jour en détail, afin d'optimiser mes entraînements.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le bloc THEN le système SHALL afficher les muscles ciblés aujourd'hui
2. THE système SHALL permettre de sélectionner le muscle ciblé pour la session
3. THE système SHALL afficher l'intensité de la session actuelle
4. THE système SHALL afficher le volume total avec progression par groupe musculaire
5. THE système SHALL afficher les records battus cette semaine avec célébration
6. THE système SHALL afficher les missions de la semaine par jour avec checkboxes
7. THE système SHALL afficher la performance live par exercice avec barres de progression
8. THE système SHALL comparer les performances vs hier (volume, intensité, temps repos, durée)
9. THE système SHALL afficher les accomplissements du jour avec récompenses
10. THE système SHALL afficher les recommandations IA personnalisées
11. THE système SHALL afficher l'historique personnel avec records et tendances

### Requirement 15: Bloc Rythme de Lecture (Priority-MODERATE)

**User Story:** En tant qu'utilisateur, je veux suivre mon rythme de lecture, afin de maintenir ma régularité et atteindre mes objectifs.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le bloc THEN le système SHALL afficher le streak de lecture en jours
2. THE système SHALL afficher un cercle de progression avec paliers visuels
3. THE système SHALL afficher les stats: aujourd'hui, semaine, session moyenne, vitesse
4. THE système SHALL afficher l'objectif quotidien avec barre de progression
5. THE système SHALL afficher les prédictions de fin de livre avec scénarios multiples
6. THE système SHALL afficher les leviers d'optimisation (vitesse, sessions, météo, weekend)
7. THE système SHALL afficher un plan optimisé par IA
8. THE système SHALL permettre de démarrer/arrêter un timer de session
9. THE système SHALL afficher le compte à rebours jusqu'à minuit
10. THE système SHALL afficher le prochain jalon avec progression
11. THE système SHALL afficher des motivateurs dynamiques

---

## PRIORITY-LOW BLOCKS (13 blocs)

---

### Requirement 16: Bloc Objectifs DCA (Priority-LOW)

**User Story:** En tant qu'utilisateur, je veux suivre mes objectifs d'investissement DCA, afin de respecter ma stratégie d'allocation mensuelle.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le bloc THEN le système SHALL afficher tous les actifs DCA avec leur progression
2. THE système SHALL afficher pour chaque actif: montant investi, objectif, et pourcentage de progression
3. THE système SHALL afficher les prochains achats programmés avec dates
4. THE système SHALL afficher les écarts entre le plan et le réalisé
5. WHEN un achat est dû THEN le système SHALL afficher une alerte urgente
6. THE système SHALL permettre d'exécuter un achat programmé manuellement
7. THE système SHALL afficher des recommandations d'ajustement basées sur les écarts
8. THE système SHALL permettre d'appliquer une recommandation en un clic

### Requirement 17: Bloc Smart Progression (Priority-LOW)

**User Story:** En tant qu'utilisateur, je veux voir ma progression intelligente, afin d'optimiser mes performances.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le bloc THEN le système SHALL afficher les métriques de progression
2. THE système SHALL calculer et afficher les tendances d'amélioration
3. THE système SHALL afficher des suggestions d'optimisation basées sur l'IA
4. THE système SHALL afficher les comparaisons avec les périodes précédentes

### Requirement 18: Bloc Quick Stats (Priority-LOW)

**User Story:** En tant qu'utilisateur, je veux voir des statistiques rapides, afin d'avoir un aperçu instantané de mes performances.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le bloc THEN le système SHALL afficher les statistiques clés du jour
2. THE système SHALL afficher les métriques essentielles de manière compacte
3. THE système SHALL permettre un accès rapide aux détails

### Requirement 19: Bloc Performance de Lecture (Priority-LOW)

**User Story:** En tant qu'utilisateur, je veux analyser ma performance de lecture, afin d'améliorer mon efficacité.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le bloc THEN le système SHALL afficher les métriques de lecture détaillées
2. THE système SHALL afficher la vitesse de lecture par genre
3. THE système SHALL afficher les tendances de performance
4. THE système SHALL afficher les recommandations d'amélioration

### Requirement 20: Bloc Allocation Salaire (Priority-LOW)

**User Story:** En tant qu'utilisateur, je veux planifier l'allocation de mon salaire, afin d'optimiser ma gestion financière.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le bloc THEN le système SHALL afficher la répartition planifiée du salaire
2. THE système SHALL afficher les catégories: épargne, investissement, dépenses, loisirs
3. THE système SHALL permettre d'ajuster les allocations
4. THE système SHALL afficher les recommandations d'optimisation

### Requirement 21: Bloc Comparaisons Sport (Priority-LOW)

**User Story:** En tant qu'utilisateur, je veux comparer mes performances sportives, afin d'identifier mes progrès et axes d'amélioration.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le bloc THEN le système SHALL afficher les comparaisons par exercice
2. THE système SHALL comparer les performances sur différentes périodes
3. THE système SHALL afficher les tendances d'évolution
4. THE système SHALL identifier les exercices en progression et en régression

### Requirement 22: Bloc Comparaisons Lecture (Priority-LOW)

**User Story:** En tant qu'utilisateur, je veux comparer mes performances de lecture, afin d'analyser mes habitudes.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le bloc THEN le système SHALL afficher les comparaisons par période
2. THE système SHALL comparer le temps de lecture, pages lues, livres terminés
3. THE système SHALL afficher les tendances par genre
4. THE système SHALL identifier les périodes les plus productives

### Requirement 23: Bloc Matrice de Projection (Priority-LOW)

**User Story:** En tant qu'utilisateur, je veux voir des projections futures, afin de planifier mes objectifs à long terme.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le bloc THEN le système SHALL afficher des projections basées sur les tendances actuelles
2. THE système SHALL projeter les performances futures sur différentes périodes
3. THE système SHALL afficher plusieurs scénarios (optimiste, réaliste, pessimiste)
4. THE système SHALL permettre d'ajuster les paramètres de projection

### Requirement 24: Bloc Quête Express (Priority-LOW)

**User Story:** En tant qu'utilisateur, je veux créer rapidement une quête, afin d'ajouter des tâches sans friction.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le bloc THEN le système SHALL afficher un formulaire de création
2. THE système SHALL permettre de saisir: nom, description, catégorie, difficulté, durée
3. THE système SHALL permettre de choisir entre quête récurrente ou exceptionnelle
4. WHEN la quête est récurrente THEN le système SHALL afficher un calendrier hebdomadaire
5. WHEN la quête est exceptionnelle THEN le système SHALL afficher un sélecteur de date
6. THE système SHALL calculer et afficher l'XP qui sera gagné en temps réel
7. WHEN l'utilisateur soumet le formulaire THEN le système SHALL créer la quête et réinitialiser le formulaire

### Requirement 25: Bloc Théorie vs Réalité (Priority-LOW)

**User Story:** En tant qu'utilisateur, je veux comparer mes objectifs théoriques vs mes réalisations, afin d'ajuster mes attentes.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le bloc THEN le système SHALL afficher les objectifs planifiés vs réalisés
2. THE système SHALL calculer les écarts pour chaque catégorie
3. THE système SHALL afficher les raisons des écarts si identifiables
4. THE système SHALL afficher des recommandations d'ajustement

### Requirement 26: Bloc Loisirs Planifiés (Priority-LOW)

**User Story:** En tant qu'utilisateur, je veux planifier mes achats de loisirs, afin de gérer mon épargne et atteindre mes objectifs.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le bloc THEN le système SHALL afficher tous les objectifs de loisirs
2. THE système SHALL permettre d'uploader une image pour chaque objectif
3. THE système SHALL calculer la faisabilité de chaque objectif (facile, faisable, difficile, impossible)
4. THE système SHALL afficher une barre de progression pour chaque objectif
5. WHEN un objectif est à risque THEN le système SHALL afficher une alerte avec solution
6. THE système SHALL afficher une timeline des prochains objectifs
7. THE système SHALL afficher une analyse budgétaire globale
8. THE système SHALL afficher l'historique des loisirs acquis
9. THE système SHALL afficher des recommandations d'optimisation IA

### Requirement 27: Bloc Échéances à Venir (Priority-LOW)

**User Story:** En tant qu'utilisateur, je veux voir mes échéances à venir, afin de ne rien oublier d'important.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le bloc THEN le système SHALL afficher toutes les échéances futures
2. THE système SHALL trier les échéances par date
3. THE système SHALL afficher le nombre de jours restants pour chaque échéance
4. WHEN une échéance approche THEN le système SHALL afficher une alerte
5. THE système SHALL permettre de marquer une échéance comme complétée

### Requirement 28: Bloc News (Priority-LOW)

**User Story:** En tant qu'utilisateur, je veux consulter les actualités financières et économiques, afin de rester informé des événements importants.

#### Acceptance Criteria

1. WHEN l'utilisateur consulte le bloc THEN le système SHALL afficher les actualités par onglets (Tout, Bourse, Crypto, etc.)
2. THE système SHALL afficher pour chaque actualité: titre, résumé, source, sentiment, impact, score qualité
3. THE système SHALL permettre de filtrer par impact, source, région, secteur
4. THE système SHALL permettre de trier par récence, ancienneté, pertinence, sentiment
5. WHEN l'utilisateur clique sur une actualité THEN le système SHALL ouvrir l'article dans un nouvel onglet
6. THE système SHALL afficher le statut des APIs (NewsAPI, Finnhub, Reddit)
7. THE système SHALL afficher le statut des marchés (ouverts/fermés)
8. WHEN c'est le weekend THEN le système SHALL suspendre certains onglets liés aux marchés
9. THE système SHALL permettre d'actualiser les actualités manuellement
10. THE système SHALL afficher des statistiques: total, positives, catégories, urgentes

---

## Notes Techniques Globales

### Architecture
- Tous les blocs utilisent Vue.js comme framework
- Les données sont mockées dans `ModularDashboardMockData.js`
- Chaque bloc émet des événements pour communiquer avec le dashboard parent
- Les blocs utilisent localStorage pour persister certaines données (couvertures, images, sessions)
- Le système de notification global est utilisé pour les alertes et célébrations
- Les confettis sont gérés par une bibliothèque externe (canvas-confetti)

### Priorités
- **Priority-MAX**: Blocs critiques affichés en premier, toujours visibles
- **Priority-HIGH**: Blocs importants pour le suivi quotidien
- **Priority-MODERATE**: Blocs d'analyse et de tendances
- **Priority-LOW**: Blocs complémentaires et outils spécialisés

### Communication
- Événements émis: `update-data`, `navigate-to`, `open-modal`
- Événements globaux via `$root.$emit` pour communication inter-blocs
- Props: `allData` contenant toutes les données mockées

### Persistance
- localStorage pour images uploadées (couvertures de livres, objectifs loisirs)
- localStorage pour sessions enregistrées (sport, lecture)
- Pas de backend, données mockées rechargées au refresh


# Design Document - QuietQuest Dashboard Cyberpunk

## Overview

Le dashboard QuietQuest est une application web de gestion de productivité personnelle avec une esthétique cyberpunk. Il est construit avec Vue 3 et utilise une architecture modulaire permettant le chargement progressif des composants par priorité.

### Objectifs du Design

1. **Modularité**: Chaque bloc est un composant autonome et réutilisable
2. **Performance**: Chargement progressif par priorité pour une expérience fluide
3. **Esthétique Cyberpunk**: Thème néon avec effets de glow et animations
4. **Réactivité**: Mise à jour en temps réel des données entre les blocs
5. **Extensibilité**: Architecture permettant l'ajout facile de nouveaux blocs

### Technologies Utilisées

- **Framework**: Vue 3 (Global Build via CDN)
- **CSS**: CSS personnalisé avec variables CSS pour le thème
- **Graphiques**: Chart.js pour les visualisations
- **3D**: Three.js pour les effets visuels avancés
- **Styling**: Tailwind CSS (CDN) pour les utilitaires
- **Fonts**: Orbitron, Rajdhani, JetBrains Mono (Google Fonts)

## Architecture

### Structure des Fichiers

```
src/
├── components/
│   └── dashboard/
│       ├── ModularDashboardComponent.js (Dashboard principal)
│       ├── HomeDashboardComponent.js (Version alternative)
│       ├── CompleteDashboardComponent.js (Version complète)
│       └── blocks/
│           ├── BlocksRegistry.js (Registre centralisé)
│           ├── priority-max/ (Blocs priorité maximale)
│           ├── priority-high/ (Blocs haute priorité)
│           ├── priority-moderate/ (Blocs priorité modérée)
│           └── priority-low/ (Blocs basse priorité)
├── styles/
│   ├── main.css (Styles globaux)
│   ├── modular-dashboard.css (Styles du dashboard)
│   └── components/ (Styles par composant)
└── loader.js (Chargeur modulaire)
```

### Architecture Modulaire

Le dashboard utilise un système de registre centralisé (`BlocksRegistry`) qui gère:

1. **Enregistrement des blocs** par priorité
2. **Chargement dynamique** des scripts JS
3. **Chargement automatique** des CSS associés
4. **Enregistrement Vue** des composants

#### Priorités des Blocs

- **priority-max**: Blocs critiques chargés en premier (Quêtes, Sport, Patrimoine, Lecture)
- **priority-high**: Blocs importants (Apprentissage, Timer, Urgences, Régularité, Budget)
- **priority-moderate**: Blocs secondaires (Progression, Performance, Rythme)
- **priority-low**: Blocs optionnels (Analytics, Comparaisons, Outils)


## Components and Interfaces

### 1. ModularDashboardComponent (Dashboard Principal)

**Fichier**: `src/components/dashboard/ModularDashboardComponent.js`

**Responsabilités**:
- Orchestration de l'affichage des 11 lignes du dashboard
- Gestion du chargement progressif des blocs
- Communication entre les blocs via événements
- Gestion de l'état global du dashboard

**Props**:
- `allData` (Object, required): Données globales du dashboard contenant mockData et user

**Data**:
- `isLoading` (Boolean): État de chargement
- `loadedBlocksCount` (Number): Nombre de blocs chargés
- `totalBlocksCount` (Number): Nombre total de blocs
- `loadingErrors` (Array): Erreurs de chargement
- `selectedRange` (String): Période sélectionnée (désactivé)
- `showLine6-11` (Boolean): Contrôle d'affichage des lignes avancées

**Computed**:
- `loadingProgress`: Pourcentage de progression du chargement

**Methods**:
- `isBlockLoaded(blockName)`: Vérifie si un bloc est chargé
- `handleDataUpdate(updateData)`: Gère les mises à jour de données des blocs
- `handleNavigation(navigationData)`: Gère la navigation (désactivée)
- `handleModalOpen(modalData)`: Gère l'ouverture de modales (désactivée)
- `handleFocusMode(focusData)`: Active le mode focus (désactivé)
- `initializeBlocks()`: Initialise le chargement des blocs
- `loadBlocksByPriority()`: Charge les blocs par priorité

**Template Structure**:
```html
<div class="modular-dashboard">
  <div class="modular-dashboard-grid">
    <!-- Ligne 0: XP & Niveau -->
    <div class="dashboard-line line-0">
      <xp-level-stats-block />
    </div>
    
    <!-- Ligne 1: Actions Immédiates -->
    <div class="dashboard-line line-1">
      <quest-daily-block />
      <sport-session-block />
    </div>
    
    <!-- Ligne 2: Finances & Lecture -->
    <div class="dashboard-line line-2">
      <patrimony-live-block />
      <reading-session-block />
    </div>
    
    <!-- Ligne 3: Apprentissage & Urgences -->
    <div class="dashboard-line line-3">
      <learning-status-block />
      <active-timer-block />
      <last-chance-block />
    </div>
    
    <!-- Ligne 4: Régularité & Budget -->
    <div class="dashboard-line line-4">
      <daily-regularity-block />
      <monthly-budget-block />
      <main-book-progress-block />
      <stock-portfolio-block />
    </div>
    
    <!-- Ligne 5: Performance & Progression -->
    <div class="dashboard-line line-5">
      <weekly-progress-block />
      <today-performance-block />
      <reading-rhythm-block />
      <surveillance-block />
    </div>
    
    <!-- Lignes 8-11: Blocs avancés -->
    <!-- ... -->
  </div>
</div>
```


### 2. BlocksRegistry (Registre Centralisé)

**Fichier**: `src/components/dashboard/blocks/BlocksRegistry.js`

**Responsabilités**:
- Enregistrement centralisé de tous les blocs
- Gestion du chargement dynamique des scripts
- Mapping des noms de composants vers les balises HTML
- Suivi de l'état de chargement

**Structure**:
```javascript
window.BlocksRegistry = {
  blocksByPriority: {
    'priority-max': ['QuestDailyBlock', 'SportSessionBlock', ...],
    'priority-high': ['LearningStatusBlock', 'ActiveTimerBlock', ...],
    'priority-moderate': ['WeeklyProgressBlock', ...],
    'priority-low': ['ExpressQuestBlock', ...]
  },
  
  componentTagMap: {
    'QuestDailyBlock': 'quest-daily-block',
    'SportSessionBlock': 'sport-session-block',
    // ...
  },
  
  blockPaths: {
    'priority-max': {
      'QuestDailyBlock': 'src/components/dashboard/blocks/priority-max/QuestDailyBlock.js',
      // ...
    }
  },
  
  loadedBlocks: new Set(),
  loadingPromises: new Map()
}
```

**Methods**:
- `loadBlock(blockName, priority)`: Charge un bloc spécifique
- `loadBlocksByPriority(priority)`: Charge tous les blocs d'une priorité
- `loadAllBlocks()`: Charge tous les blocs
- `loadScript(src)`: Charge un script dynamiquement
- `loadStylesheet(src)`: Charge un CSS dynamiquement
- `loadBlockCSS(blockName, priority)`: Charge le CSS d'un bloc
- `getLoadedBlocks()`: Retourne la liste des blocs chargés
- `isBlockLoaded(blockName)`: Vérifie si un bloc est chargé
- `getTagName(blockName)`: Retourne le nom de balise HTML
- `init()`: Initialise le registre


## Data Models

### AllData Structure

Structure globale des données passées à tous les blocs:

```javascript
{
  mockData: {
    // Données utilisateur
    user: {
      name: String,
      level: Number,
      xp: Number,
      xpToNextLevel: Number,
      streakDays: Number
    },
    
    // Quêtes quotidiennes
    dailyQuests: {
      xpEarned: Number,
      xpPotential: Number,
      xpRemaining: Number,
      progressPercent: Number,
      quests: [
        {
          id: String,
          name: String,
          icon: String,
          xp: Number,
          completed: Boolean,
          priority: String // 'high', 'medium', 'low'
        }
      ]
    },
    
    // Session de sport
    sportSession: {
      status: String, // 'active', 'completed', 'inactive'
      streak: Number,
      todaySession: {
        exercises: {
          pushups: { value: Number, lastValue: Number },
          plank: { value: Number, lastValue: Number },
          curlPronation: { value: Number, lastValue: Number },
          curlSupination: { value: Number, lastValue: Number },
          totalTime: { value: Number, lastValue: Number },
          pullups: { value: Number, lastValue: Number },
          dips: { value: Number, lastValue: Number },
          australianPullups: { value: Number, lastValue: Number }
        }
      },
      analytics: {
        last7Days: {
          frequency: { completed: Number, total: Number },
          exercises: {
            [exerciseKey]: {
              name: String,
              total: Number,
              average: Number,
              unit: String,
              change: String,
              changeClass: String
            }
          }
        },
        last30Days: {
          exercises: {
            [exerciseKey]: {
              name: String,
              change: String,
              changeClass: String,
              monthlyRecord: Number,
              unit: String
            }
          }
        },
        global: {
          recordsBroken: Number,
          currentStreak: Number,
          locationSplit: { home: Number, park: Number },
          bestDay: { name: String, improvement: String }
        }
      }
    },
    
    // Patrimoine en temps réel
    patrimonyLive: {
      totalValue: Number,
      dailyPerformance: {
        amount: Number,
        percent: String
      },
      allocation: [
        {
          type: String, // 'gold', 'stocks', 'cash'
          name: String,
          icon: String,
          currentPercent: Number,
          targetPercent: Number,
          healthStatus: String // 'good', 'warning', 'critical'
        }
      ],
      overallHealth: String, // 'good', 'warning', 'critical'
      alerts: [
        {
          id: String,
          icon: String,
          message: String,
          severity: String,
          action: String
        }
      ]
    },
    
    // Session de lecture
    readingSession: {
      status: String,
      activeBooks: Number,
      currentBooks: [
        {
          id: String,
          title: String,
          author: String,
          cover: String,
          progress: Number,
          currentPage: Number,
          totalPages: Number,
          genre: String,
          lastReadDate: String
        }
      ],
      todayReadingTime: Number,
      analytics: {
        last7Days: {
          totalTime: String,
          averageTime: String,
          timeChange: String,
          activeBooks: Number,
          sessions: Number,
          averageSessionDuration: String,
          genres: [
            {
              name: String,
              time: String,
              percentage: Number
            }
          ]
        },
        last30Days: {
          totalTime: String,
          timeChange: String,
          completedBooks: Number,
          pagesRead: Number,
          pagesChange: String,
          readingSpeed: Number,
          bestDay: { name: String, time: String }
        },
        global: {
          monthlyCompleted: Number,
          regularity: Number,
          favoriteGenre: { name: String, percentage: Number },
          longestSession: String
        }
      }
    },
    
    // Statut d'apprentissage
    learningStatus: {
      activeSubject: String,
      subjectType: String,
      sessionsCompleted: Number,
      sessionsPlanned: Number,
      timeStudiedToday: Number,
      dailyObjectiveMinutes: Number,
      streakDays: Number,
      latestReward: {
        name: String,
        icon: String,
        date: String
      }
    },
    
    // Timer actif
    activeTimer: {
      isActive: Boolean,
      isPaused: Boolean,
      isBreak: Boolean,
      minutes: Number,
      seconds: Number,
      subject: String,
      sessionNumber: Number,
      totalSessions: Number,
      totalTimeToday: Number
    },
    
    // Dernière chance
    lastChance: {
      timeUntilMidnight: String,
      questsRemaining: Number,
      totalQuests: Number,
      totalXPRemaining: Number,
      incompleteQuests: [
        {
          id: String,
          name: String,
          icon: String,
          xp: Number,
          priority: String
        }
      ]
    },
    
    // Régularité quotidienne
    dailyRegularity: {
      currentStreak: Number,
      bestStreak: Number,
      motivationalMessage: String,
      timeUntilMidnight: String,
      last7Days: [
        {
          dayName: String,
          completed: Boolean,
          isToday: Boolean,
          isWeekend: Boolean
        }
      ]
    }
  }
}
```


## Detailed Block Documentation

### LIGNE 0: XP & Niveau Stats

#### XpLevelStatsBlock (Priority-Max)

**Fichier**: `src/components/dashboard/blocks/priority-max/XpLevelStatsBlock.js`

**Description**: Affiche les statistiques de niveau et d'XP de l'utilisateur en haut du dashboard.

**Props**:
- `allData` (Object, required)

**Computed**:
- `currentLevel`: Niveau actuel de l'utilisateur
- `currentXP`: XP actuel
- `xpToNextLevel`: XP requis pour le prochain niveau
- `xpProgress`: Pourcentage de progression vers le prochain niveau

**Template Structure**:
```html
<div class="xp-level-stats-block">
  <div class="level-display">
    <span class="level-number">{{ currentLevel }}</span>
    <span class="level-label">NIVEAU</span>
  </div>
  <div class="xp-progress">
    <div class="xp-bar">
      <div class="xp-fill" :style="{ width: xpProgress + '%' }"></div>
    </div>
    <div class="xp-text">
      {{ currentXP }} / {{ xpToNextLevel }} XP
    </div>
  </div>
</div>
```

**Styles CSS**:
- Barre de progression avec effet de glow néon
- Animation de pulsation sur gain d'XP
- Gradient cyan-magenta sur la barre de progression

---

### LIGNE 1: Actions Immédiates

#### QuestDailyBlock (Priority-Max)

**Fichier**: `src/components/dashboard/blocks/priority-max/QuestDailyBlock.js`

**Description**: Affiche les quêtes quotidiennes avec leur statut de complétion et l'XP gagné/restant.

**Props**:
- `allData` (Object, required)

**Data**:
- `animatingQuests` (Set): Ensemble des IDs de quêtes en cours d'animation

**Computed**:
- `dailyQuests`: Liste des quêtes quotidiennes
- `xpEarned`: XP gagné aujourd'hui
- `xpPotential`: XP total possible
- `xpRemaining`: XP restant à gagner
- `progressPercent`: Pourcentage de progression XP

**Methods**:
- `toggleQuest(questId)`: Bascule le statut d'une quête
- `getQuestById(questId)`: Récupère une quête par son ID

**Events Emitted**:
- `update-data`: Émis lors du basculement d'une quête
  ```javascript
  {
    type: 'toggle-quest',
    questId: String,
    timestamp: Date
  }
  ```

**Template Structure**:
```html
<div class="quest-daily-card">
  <div class="card-header">
    <span class="card-icon">🎯</span>
    <h3>QUÊTE DU JOUR</h3>
    <span class="card-badge">{{ xpEarned }}/{{ xpPotential }} XP</span>
  </div>
  
  <div class="xp-metrics-display">
    <div class="xp-bar">
      <div class="xp-fill" :style="{ width: progressPercent + '%' }"></div>
    </div>
    <div class="xp-text">
      <span>{{ xpEarned }} XP gagné</span>
      <span>{{ xpRemaining }} XP restant</span>
    </div>
  </div>
  
  <div class="quests-checklist">
    <div v-for="quest in dailyQuests" 
         class="quest-item" 
         :class="{ completed: quest.completed }">
      <div class="quest-checkbox" @click="toggleQuest(quest.id)">
        <span>{{ quest.completed ? '✓' : '' }}</span>
      </div>
      <div class="quest-info">
        <span class="quest-icon">{{ quest.icon }}</span>
        <span class="quest-name">{{ quest.name }}</span>
        <span class="quest-xp">+{{ quest.xp }}XP</span>
      </div>
    </div>
  </div>
</div>
```

**Styles CSS**:
- Checkbox avec animation de check
- Effet de rayure sur les quêtes complétées
- Glow cyan sur les quêtes actives
- Animation de pulsation sur l'XP

**Interactions**:
1. Clic sur checkbox → Bascule le statut
2. Animation de check (300ms)
3. Mise à jour de la barre XP
4. Émission d'événement global


#### SportSessionBlock (Priority-Max)

**Fichier**: `src/components/dashboard/blocks/priority-max/SportSessionBlock.js`

**Description**: Bloc dual affichant un formulaire de saisie de séance de sport (gauche) et des analytics détaillées (droite). Span 3 colonnes.

**Props**:
- `allData` (Object, required)

**Data**:
- `sessionSaved` (Boolean): Indique si une séance a été enregistrée aujourd'hui
- `lastSaveTime` (Date): Horodatage de la dernière sauvegarde

**Computed**:
- `sportData`: Données de sport depuis allData
- `sessionStatus`: Statut de la session ('active', 'completed', 'inactive')
- `streak`: Nombre de jours consécutifs
- `todaySession`: Données de la session du jour avec tous les exercices
- `analytics`: Analytics des 7 et 30 derniers jours + métriques globales
- `canSaveSession`: Vérifie si la session peut être sauvegardée

**Methods**:
- `getSessionStatusText()`: Retourne le texte du statut
- `updateExercise(exerciseKey, value)`: Met à jour un exercice
- `saveSession()`: Sauvegarde la session
- `checkForRecordAlert(exerciseKey, value)`: Vérifie si proche d'un record
- `showRecordAlert(exerciseName, remaining)`: Affiche alerte record en vue
- `showRecordBroken(exerciseName, newValue)`: Affiche notification record battu
- `calculateSuggestions()`: Calcule les suggestions basées sur l'historique
- `showSuccessAnimation()`: Animation de succès
- `triggerConfetti()`: Déclenche les confettis

**Events Emitted**:
- `update-data`: Émis lors de la mise à jour d'un exercice
  ```javascript
  {
    type: 'update-exercise',
    exercise: String,
    value: Number,
    timestamp: Date
  }
  ```
- `update-data`: Émis lors de la sauvegarde
  ```javascript
  {
    type: 'save-session',
    sessionData: {
      date: String,
      exercises: Object,
      timestamp: Date
    }
  }
  ```

**Template Structure**:
```html
<div class="sport-session-card" style="grid-column: span 3;">
  <div class="card-header">
    <span class="card-icon">💪</span>
    <h3>SÉANCE ACTIVE + RECAP PERFORMANCE</h3>
    <div class="session-indicators">
      <span class="card-badge">{{ getSessionStatusText() }}</span>
      <span class="streak-badge">{{ streak }}j</span>
    </div>
  </div>
  
  <div class="sport-dual-layout">
    <!-- PARTIE GAUCHE: Formulaire -->
    <div class="session-form-section">
      <h4>📝 Séance Aujourd'hui</h4>
      
      <!-- Exercices Maison -->
      <div class="exercise-category">
        <div class="category-header">
          <span>🏠</span>
          <h5>Exercices Maison</h5>
        </div>
        <div class="exercise-grid">
          <div class="exercise-input">
            <label>Pompes</label>
            <input type="number" :value="todaySession.exercises.pushups.value">
            <span class="unit">reps</span>
            <span class="vs-last">vs {{ todaySession.exercises.pushups.lastValue }}</span>
          </div>
          <!-- Autres exercices maison -->
        </div>
      </div>
      
      <!-- Exercices Parc -->
      <div class="exercise-category">
        <div class="category-header">
          <span>🌳</span>
          <h5>Exercices Parc</h5>
        </div>
        <div class="exercise-grid">
          <!-- Exercices parc -->
        </div>
      </div>
      
      <button class="save-session-btn" @click="saveSession">
        <span>💾</span>
        <span>Enregistrer la séance</span>
      </button>
    </div>
    
    <!-- PARTIE DROITE: Analytics -->
    <div class="analytics-section">
      <h4>📊 Analytics Détaillées</h4>
      
      <!-- 7 derniers jours -->
      <div class="analytics-period">
        <h5>7 derniers jours</h5>
        <div class="frequency-display">
          Fréquence : {{ analytics.last7Days.frequency.completed }}/{{ analytics.last7Days.frequency.total }}
        </div>
        <div class="volume-comparison">
          <div v-for="(exercise, key) in analytics.last7Days.exercises">
            <span>{{ exercise.name }}</span>
            <span>{{ exercise.total }} {{ exercise.unit }}</span>
            <span>(moy: {{ exercise.average }})</span>
            <span :class="exercise.changeClass">{{ exercise.change }}</span>
          </div>
        </div>
      </div>
      
      <!-- 30 derniers jours -->
      <div class="analytics-period">
        <h5>30 derniers jours</h5>
        <div class="monthly-progression">
          <div v-for="(exercise, key) in analytics.last30Days.exercises">
            <span>{{ exercise.name }}</span>
            <span :class="exercise.changeClass">{{ exercise.change }}</span>
            <span>(record : {{ exercise.monthlyRecord }})</span>
          </div>
        </div>
      </div>
      
      <!-- Métriques globales -->
      <div class="global-metrics">
        <div>Records battus : {{ analytics.global.recordsBroken }}</div>
        <div>Régularité : {{ analytics.global.currentStreak }} jours</div>
        <div>Répartition : {{ analytics.global.locationSplit.home }}% maison, {{ analytics.global.locationSplit.park }}% parc</div>
        <div>Meilleur jour : {{ analytics.global.bestDay.name }}</div>
      </div>
    </div>
  </div>
</div>
```

**Styles CSS**:
- Layout dual avec flexbox (50/50)
- Inputs avec bordures néon
- Comparaison vs dernière valeur en gris
- Badges de changement (positif=vert, négatif=rouge)
- Animation de sauvegarde avec glow
- Effet de pulsation sur les records

**Interactions**:
1. Saisie d'exercice → Mise à jour en temps réel
2. Vérification record → Alerte si proche (90-99%)
3. Record battu → Notification + confettis
4. Sauvegarde → Animation + désactivation bouton
5. Calcul automatique des suggestions

**Logique Métier**:
- Comparaison automatique avec dernière valeur
- Détection de records (mensuel)
- Calcul de progression (%)
- Répartition maison/parc
- Identification du meilleur jour


#### PatrimonyLiveBlock (Priority-Max)

**Fichier**: `src/components/dashboard/blocks/priority-max/PatrimonyLiveBlock.js`

**Description**: Cockpit financier affichant le patrimoine total en temps réel avec répartition Or/Bourse/Cash et jauges circulaires.

**Props**:
- `allData` (Object, required)

**Data**:
- `isConnected` (Boolean): État de connexion temps réel
- `isUpdating` (Boolean): Mise à jour en cours
- `lastUpdateTime` (Date): Dernière mise à jour
- `refreshInterval` (Interval): Intervalle d'actualisation automatique

**Computed**:
- `patrimonyData`: Données de patrimoine
- `totalValue`: Valeur totale du patrimoine
- `dailyPerformance`: Performance du jour (montant, %, direction, flèche)
- `allocation`: Tableau des actifs (Or, Bourse, Cash)
- `overallHealth`: Santé globale de l'allocation
- `alerts`: Alertes financières
- `hasAlerts`: Présence d'alertes
- `connectionStatus`: Texte du statut de connexion
- `connectionStatusClass`: Classe CSS du statut
- `formatLastUpdate`: Formatage de la dernière mise à jour

**Methods**:
- `formatAmount(amount)`: Formate un montant en euros
- `getDecimals(amount)`: Extrait les décimales
- `getStatusIcon(healthStatus)`: Icône selon le statut
- `getStatusText(asset)`: Texte du statut d'un actif
- `getHealthIcon(health)`: Icône de santé globale
- `getHealthText(health)`: Texte de santé globale
- `getCurrentDashArray(percent)`: Calcul du stroke-dasharray pour jauge circulaire
- `getTargetDashArray(percent)`: Calcul du stroke-dasharray pour cible
- `getAssetColor(asset)`: Couleur selon le type d'actif
- `refreshData()`: Actualise les données
- `viewDetails()`: Ouvre la modal détaillée
- `navigateToFinance()`: Navigation vers l'onglet finance
- `startAutoRefresh()`: Démarre l'actualisation automatique (5 min)
- `stopAutoRefresh()`: Arrête l'actualisation
- `checkConnectionStatus()`: Vérifie le statut de connexion
- `onPatrimonyUpdated(data)`: Handler de mise à jour
- `removeUnwantedElements()`: Nettoyage d'éléments indésirables

**Events Emitted**:
- `update-data`: Émis lors de l'actualisation
  ```javascript
  {
    type: 'refresh-patrimony',
    timestamp: Date
  }
  ```
- `open-modal`: Émis pour ouvrir les détails
  ```javascript
  {
    type: 'patrimony-details',
    data: Object
  }
  ```
- `navigate-to`: Émis pour navigation
  ```javascript
  'finance'
  ```

**Template Structure**:
```html
<div class="patrimony-live-card" @click="navigateToFinance">
  <div class="card-header">
    <span class="card-icon">💰</span>
    <h3>PATRIMOINE TEMPS RÉEL</h3>
    <div class="connection-status" :class="{ connected: isConnected }">
      <div class="status-dot"></div>
      <span>{{ connectionStatus }}</span>
    </div>
  </div>
  
  <div class="card-content">
    <!-- Valeur totale -->
    <div class="total-wealth-zone">
      <div class="wealth-display">
        <span class="currency-symbol">€</span>
        <span class="main-amount">{{ formatAmount(totalValue) }}</span>
        <span class="decimal-part">.{{ getDecimals(totalValue) }}</span>
      </div>
      
      <!-- Performance du jour -->
      <div class="daily-performance-zone" :class="dailyPerformance.direction">
        <div class="performance-arrow">{{ dailyPerformance.arrow }}</div>
        <div class="performance-amount">{{ formatAmount(dailyPerformance.amount) }}€</div>
        <div class="performance-percent">{{ dailyPerformance.percent }}%</div>
      </div>
    </div>
    
    <!-- Répartition avec jauges circulaires -->
    <div class="allocation-cockpit">
      <div class="allocation-header">
        <span>Répartition vs Cibles</span>
        <div class="allocation-health-indicator" :class="overallHealth">
          <span class="health-dot"></span>
          <span>{{ getHealthText(overallHealth) }}</span>
        </div>
      </div>
      
      <div class="allocation-gauges">
        <div v-for="asset in allocation" class="asset-gauge" :class="asset.type">
          <!-- Jauge circulaire SVG -->
          <div class="circular-gauge">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" class="gauge-background"></circle>
              <circle cx="50" cy="50" r="45" class="gauge-target"
                      :stroke-dasharray="getTargetDashArray(asset.targetPercent)"></circle>
              <circle cx="50" cy="50" r="45" class="gauge-current"
                      :stroke-dasharray="getCurrentDashArray(asset.currentPercent)"></circle>
            </svg>
            
            <div class="gauge-center">
              <div class="asset-icon">{{ asset.icon }}</div>
              <div class="asset-percent">{{ asset.currentPercent }}%</div>
              <div class="asset-name">{{ asset.name }}</div>
            </div>
          </div>
          
          <div class="asset-status" :class="asset.healthStatus">
            <span class="status-icon">{{ getStatusIcon(asset.healthStatus) }}</span>
            <span>{{ getStatusText(asset) }}</span>
            <div>Cible: {{ asset.targetPercent }}%</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Alertes -->
    <div v-if="hasAlerts" class="financial-alerts">
      <div v-for="alert in alerts" class="financial-alert" :class="alert.severity">
        <span class="alert-icon">{{ alert.icon }}</span>
        <div class="alert-message">{{ alert.message }}</div>
        <div class="alert-action">{{ alert.action }}</div>
      </div>
    </div>
  </div>
</div>
```

**Styles CSS**:
- Jauges circulaires SVG avec stroke-dasharray animé
- Filtres SVG pour effets glow (goldGlow, stocksGlow, cashGlow)
- Couleurs par type: Or (#FFD700), Bourse (#00F5FF), Cash (#39FF14)
- Indicateur de connexion pulsant
- Animation de mise à jour (rotation)
- Alertes avec bordures colorées selon sévérité

**Logique des Jauges Circulaires**:
```javascript
// Calcul du stroke-dasharray pour une jauge circulaire
getCurrentDashArray(percent) {
  const circumference = 2 * Math.PI * 45; // rayon = 45
  const strokeLength = (percent / 100) * circumference;
  const gapLength = circumference - strokeLength;
  return `${strokeLength} ${gapLength}`;
}
```

**Interactions**:
1. Clic sur la carte → Navigation vers Finance
2. Actualisation automatique toutes les 5 minutes
3. Vérification de connexion (online/offline events)
4. Animation de mise à jour (spinner)
5. Affichage des alertes selon sévérité

**Logique Métier**:
- Calcul de la performance quotidienne
- Comparaison allocation actuelle vs cibles
- Détermination du statut de santé (good/warning/critical)
- Génération d'alertes de rééquilibrage
- Formatage des montants avec séparation milliers


#### ReadingSessionBlock (Priority-Max)

**Fichier**: `src/components/dashboard/blocks/priority-max/ReadingSessionBlock.js`

**Description**: Bloc dual pour l'ajout de sessions de lecture (gauche) et analytics détaillées (droite). Span 3 colonnes.

**Props**:
- `allData` (Object, required)

**Data**:
- `selectedBookId` (String): ID du livre sélectionné
- `sessionDuration` (Object): { hours: Number, minutes: Number }
- `pagesRead` (Number): Nombre de pages lues
- `sessionNotes` (String): Notes de session
- `sessionSaved` (Boolean): Session enregistrée

**Computed**:
- `readingData`: Données de lecture
- `readingStatus`: Statut de lecture
- `activeBooks`: Nombre de livres actifs
- `currentBooks`: Liste des livres en cours
- `selectedBook`: Livre actuellement sélectionné
- `analytics`: Analytics 7j, 30j et globales
- `todayReadingTime`: Temps de lecture aujourd'hui
- `estimatedCompletion`: Estimation de fin du livre
- `canSaveSession`: Peut sauvegarder la session
- `totalSessionMinutes`: Durée totale en minutes

**Methods**:
- `getReadingStatusText()`: Texte du statut
- `onBookSelected()`: Handler de sélection de livre
- `saveReadingSession()`: Sauvegarde la session
- `resetForm()`: Réinitialise le formulaire
- `showNewBookModal()`: Ouvre la modal nouveau livre
- `calculateSuggestions()`: Calcule les suggestions
- `checkBookAlerts()`: Vérifie les alertes (pause trop longue)
- `formatDuration(minutes)`: Formate une durée
- `showSuccessAnimation()`: Animation de succès
- `navigateToBook(bookId)`: Navigation vers un livre
- `onBookCompleted(bookData)`: Handler livre terminé
- `onQuestCompleted(questData)`: Handler quête terminée

**Events Emitted**:
- `update-data`: Émis lors de la sauvegarde
  ```javascript
  {
    type: 'save-reading-session',
    sessionData: {
      bookId: String,
      duration: Number,
      pagesRead: Number,
      notes: String,
      date: String,
      timestamp: Date
    }
  }
  ```
- `open-modal`: Émis pour nouveau livre
  ```javascript
  {
    type: 'new-book',
    callback: Function
  }
  ```

**Template Structure**:
```html
<div class="reading-session-card" style="grid-column: span 3;">
  <div class="card-header">
    <span class="card-icon">📚</span>
    <h3>SESSION DE LECTURE + RECAP ACTIVITÉ</h3>
    <div class="reading-indicators">
      <span class="card-badge">{{ getReadingStatusText() }}</span>
      <span class="books-badge">{{ activeBooks }} livres actifs</span>
    </div>
  </div>
  
  <div class="reading-dual-layout">
    <!-- PARTIE GAUCHE: Formulaire -->
    <div class="reading-form-section">
      <h4>📖 Ajout Session de Lecture</h4>
      
      <!-- Sélection du livre -->
      <div class="book-selection">
        <select v-model="selectedBookId">
          <option value="">Choisir un livre...</option>
          <option v-for="book in currentBooks" :value="book.id">
            {{ book.title }} - {{ book.author }} ({{ book.progress }}%)
          </option>
        </select>
        <button @click="showNewBookModal">➕ Nouveau livre</button>
      </div>
      
      <!-- Livre sélectionné -->
      <div v-if="selectedBook" class="selected-book-display">
        <img :src="selectedBook.cover" :alt="selectedBook.title" />
        <div class="book-info">
          <div>{{ selectedBook.title }}</div>
          <div>{{ selectedBook.author }}</div>
          <div class="progress-bar">
            <div :style="{ width: selectedBook.progress + '%' }"></div>
          </div>
          <div>{{ selectedBook.progress }}% - {{ selectedBook.currentPage }}/{{ selectedBook.totalPages }}</div>
        </div>
      </div>
      
      <!-- Saisie de session -->
      <div class="session-input">
        <label>Durée de lecture :</label>
        <input type="number" v-model="sessionDuration.hours" placeholder="0"> heures
        <input type="number" v-model="sessionDuration.minutes" placeholder="0"> minutes
        
        <label>Pages lues (optionnel) :</label>
        <input type="number" v-model="pagesRead" placeholder="Nombre de pages">
        
        <label>Notes rapides :</label>
        <textarea v-model="sessionNotes" placeholder="Commentaires..."></textarea>
      </div>
      
      <!-- Indicateurs -->
      <div v-if="todayReadingTime > 0">
        📖 Déjà lu aujourd'hui : {{ formatDuration(todayReadingTime) }}
      </div>
      <div v-if="estimatedCompletion">
        ⏱️ À ce rythme, terminé dans {{ estimatedCompletion }}
      </div>
      
      <button @click="saveReadingSession" :disabled="!canSaveSession">
        💾 Enregistrer la session
      </button>
    </div>
    
    <!-- PARTIE DROITE: Analytics -->
    <div class="reading-analytics-section">
      <h4>📊 Analytics de Lecture</h4>
      
      <!-- 7 derniers jours -->
      <div class="analytics-period">
        <h5>7 derniers jours</h5>
        <div>Temps total : {{ analytics.last7Days.totalTime }} {{ analytics.last7Days.timeChange }}</div>
        <div>Livres actifs : {{ analytics.last7Days.activeBooks }}</div>
        <div>Sessions : {{ analytics.last7Days.sessions }} ({{ analytics.last7Days.averageSessionDuration }}/session)</div>
        
        <div class="genre-distribution">
          Répartition par genre :
          <div v-for="genre in analytics.last7Days.genres">
            <span>{{ genre.name }}</span>
            <span>{{ genre.time }}</span>
            <span>{{ genre.percentage }}%</span>
            <div class="genre-bar">
              <div :style="{ width: genre.percentage + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 30 derniers jours -->
      <div class="analytics-period">
        <h5>30 derniers jours</h5>
        <div>Temps total : {{ analytics.last30Days.totalTime }} {{ analytics.last30Days.timeChange }}</div>
        <div>Livres terminés : {{ analytics.last30Days.completedBooks }}</div>
        <div>Pages lues : {{ analytics.last30Days.pagesRead }} {{ analytics.last30Days.pagesChange }}</div>
        <div>Vitesse moyenne : {{ analytics.last30Days.readingSpeed }} pages/h</div>
        <div>Meilleur jour : {{ analytics.last30Days.bestDay.name }} ({{ analytics.last30Days.bestDay.time }})</div>
      </div>
      
      <!-- Métriques globales -->
      <div class="global-reading-metrics">
        <div>Livres terminés ce mois : {{ analytics.global.monthlyCompleted }}</div>
        <div>Régularité : {{ analytics.global.regularity }}/30 jours</div>
        <div>Genre favori : {{ analytics.global.favoriteGenre.name }} ({{ analytics.global.favoriteGenre.percentage }}%)</div>
        <div>Session la plus longue : {{ analytics.global.longestSession }}</div>
      </div>
    </div>
  </div>
</div>
```

**Watch**:
- `totalSessionMinutes`: Calcule automatiquement les pages estimées basées sur la vitesse de lecture

**Interactions**:
1. Sélection livre → Calcul suggestions + vérification alertes
2. Saisie durée → Calcul automatique pages estimées
3. Sauvegarde → Animation + réinitialisation formulaire
4. Alerte pause longue (>7 jours)
5. Estimation de fin de livre

**Logique Métier**:
- Calcul de vitesse de lecture (pages/heure)
- Estimation de fin de livre basée sur rythme actuel
- Détection de livres en pause (>7 jours)
- Répartition par genre
- Identification du meilleur jour de lecture


---

### LIGNE 3: Apprentissage & Urgences

#### LearningStatusBlock (Priority-High)

**Fichier**: `src/components/dashboard/blocks/priority-high/LearningStatusBlock.js`

**Description**: Affiche le statut d'apprentissage du jour avec la matière active, les sessions complétées et l'objectif quotidien.

**Props**:
- `allData` (Object, required)

**Computed**:
- `learningData`: Données d'apprentissage
- `streakDays`: Jours consécutifs d'apprentissage
- `activeSubject`: Matière active
- `subjectType`: Type de matière
- `subjectIcon`: Icône selon la matière
- `sessionsCompleted`: Sessions complétées
- `sessionsPlanned`: Sessions planifiées
- `progressPercent`: Pourcentage de progression
- `progressClass`: Classe CSS selon progression
- `timeStudiedToday`: Temps étudié aujourd'hui (minutes)
- `dailyObjectiveMinutes`: Objectif quotidien (minutes)
- `timeRemainingToday`: Temps restant
- `objectiveStatus`: Statut de l'objectif ('completed', 'on-track', 'in-progress', 'at-risk')
- `objectiveText`: Texte du statut
- `hasSessionToday`: A une session aujourd'hui
- `isTimerActive`: Timer actif
- `latestReward`: Dernière récompense

**Methods**:
- `getObjectiveIcon()`: Icône selon le statut
- `getObjectiveMessage()`: Message selon le statut
- `formatDuration(minutes)`: Formate une durée
- `formatRewardDate(dateString)`: Formate une date de récompense
- `startFirstSession()`: Démarre la première session
- `startSession()`: Démarre une session
- `openNotes()`: Ouvre les notes
- `navigateToPlanner()`: Navigation vers le planificateur
- `onTimerCompleted(timerData)`: Handler timer terminé
- `onSessionCompleted(sessionData)`: Handler session terminée
- `checkForNewRewards()`: Vérifie les nouveaux badges
- `unlockReward(name, icon, description)`: Débloque un badge

**Events Emitted**:
- `update-data`: Émis au démarrage de session
  ```javascript
  {
    type: 'start-learning-session',
    subject: String,
    duration: Number,
    timestamp: Date
  }
  ```
- `open-modal`: Émis pour ouvrir les notes
  ```javascript
  {
    type: 'learning-notes',
    subject: String
  }
  ```

**Template Structure**:
```html
<div class="learning-status-card" @click="navigateToPlanner">
  <div class="card-header">
    <span class="card-icon">{{ subjectIcon }}</span>
    <h3>APPRENTISSAGE</h3>
    <span class="card-badge" :class="objectiveStatus">{{ objectiveText }}</span>
  </div>
  
  <div class="card-content">
    <!-- Matière active -->
    <div class="active-subject">
      <span class="subject-icon-large">{{ subjectIcon }}</span>
      <div class="subject-name">{{ activeSubject }}</div>
      <div class="subject-type">{{ subjectType }}</div>
      
      <div class="learning-stats">
        <div>Streak: {{ streakDays }} jours</div>
        <div>Sessions: {{ sessionsCompleted }}/{{ sessionsPlanned }}</div>
        <div>Objectif: {{ formatDuration(dailyObjectiveMinutes) }}</div>
        <div>Restant: {{ formatDuration(timeRemainingToday) }}</div>
      </div>
    </div>
    
    <!-- Progression du jour -->
    <div class="daily-progress">
      <div class="progress-header">
        <span>Sessions aujourd'hui</span>
        <span>{{ sessionsCompleted }}/{{ sessionsPlanned }}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progressPercent + '%' }" :class="progressClass"></div>
      </div>
      <div class="progress-details">
        <span>⏱️ {{ formatDuration(timeStudiedToday) }} étudié</span>
        <span>{{ formatDuration(timeRemainingToday) }} restant</span>
      </div>
    </div>
    
    <!-- Objectif quotidien -->
    <div class="daily-objective" :class="objectiveStatus">
      <span class="objective-icon">{{ getObjectiveIcon() }}</span>
      <span>{{ getObjectiveMessage() }}</span>
    </div>
    
    <!-- Actions -->
    <div v-if="!hasSessionToday && !isTimerActive">
      <button @click.stop="startFirstSession">
        ▶️ Commencer première session
      </button>
    </div>
    
    <div v-if="latestReward" class="latest-reward">
      <span>🏆</span>
      <span>{{ latestReward.name }}</span>
      <span>{{ formatRewardDate(latestReward.date) }}</span>
    </div>
    
    <div class="quick-actions">
      <button @click.stop="startSession" :disabled="isTimerActive">
        {{ isTimerActive ? '⏱️ En cours' : '🎯 Session' }}
      </button>
      <button @click.stop="openNotes">
        📝 Notes
      </button>
    </div>
  </div>
</div>
```

**Styles CSS**:
- Badge de statut coloré selon objectif
- Barre de progression avec classes (completed, good, average, low)
- Icônes de matière dynamiques
- Animation de pulsation sur objectif atteint

**Logique Métier**:
- Calcul du pourcentage de progression
- Détermination du statut d'objectif
- Vérification des badges débloqués
- Formatage des durées (heures/minutes)


#### ActiveTimerBlock (Priority-High)

**Fichier**: `src/components/dashboard/blocks/priority-high/ActiveTimerBlock.js`

**Description**: Timer Pomodoro configurable avec cercle de progression SVG, contrôles et configuration visible quand inactif.

**Props**:
- `allData` (Object, required)

**Data**:
- `isActive` (Boolean): Timer actif
- `isPaused` (Boolean): Timer en pause
- `isBreak` (Boolean): En pause
- `minutes` (Number): Minutes restantes
- `seconds` (Number): Secondes restantes
- `config` (Object): { sessionsCount, focusMinutes, breakMinutes }
- `totalSessions` (Number): Nombre total de sessions
- `sessionNumber` (Number): Numéro de session actuelle
- `totalTimeMinutes` (Number): Durée du segment courant
- `totalTimeToday` (Number): Temps total aujourd'hui
- `subject` (String): Matière en cours
- `tickInterval` (Interval): Intervalle de tick
- `pauseStartedAt` (Date): Début de la pause
- `pauseTicker` (Interval): Intervalle de compteur de pause
- `pausedSeconds` (Number): Secondes en pause
- `circumference` (Number): Circonférence du cercle SVG (2πr)

**Computed**:
- `currentSubject`: Matière actuelle
- `mm`: Minutes formatées (2 chiffres)
- `ss`: Secondes formatées (2 chiffres)
- `progressPercent`: Pourcentage de progression
- `progressOffset`: Offset pour stroke-dashoffset SVG
- `isWarningTime`: Temps d'avertissement (≤5min)
- `isCriticalTime`: Temps critique (≤1min)
- `timerStatusClass`: Classe CSS du statut
- `timerStatusText`: Texte du statut
- `nextBreakIn`: Temps jusqu'à la prochaine pause
- `pausedFor`: Durée de la pause

**Methods**:
- `startConfiguredTimer()`: Lance le timer avec config
- `resetTimerConfig()`: Réinitialise la configuration
- `startTicking()`: Démarre le tick (1s)
- `resume()`: Reprend le timer
- `togglePause()`: Bascule pause/reprise
- `stopTimer()`: Arrête le timer
- `extendTimer(mins)`: Ajoute des minutes
- `onSegmentComplete()`: Fin d'un segment (focus/break)
- `onTimerComplete()`: Fin de la série
- `startPauseTicker()`: Démarre le compteur de pause
- `stopPauseTicker()`: Arrête le compteur de pause
- `clearIntervals()`: Nettoie les intervalles
- `focusOnTimer()`: Focus sur le timer

**Events Emitted**:
- `update-data`: Émis au démarrage
  ```javascript
  {
    type: 'timer-start',
    config: Object,
    subject: String,
    timestamp: Date
  }
  ```
- `update-data`: Émis à l'arrêt
  ```javascript
  {
    type: 'stop-timer',
    timeSpent: Number,
    subject: String,
    timestamp: Date
  }
  ```

**Template Structure**:
```html
<div class="active-timer-card" @click="focusOnTimer">
  <div class="card-header">
    <span class="card-icon">⏱️</span>
    <h3>TIMER ACTIF</h3>
    <span class="card-badge" :class="timerStatusClass">{{ timerStatusText }}</span>
  </div>
  
  <div class="card-content">
    <div class="timer-layout">
      <!-- Cercle de progression -->
      <div class="timer-main-display">
        <div class="timer-circle" :class="{ pulsing: isActive && !isPaused }">
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" class="timer-track"></circle>
            <circle cx="50" cy="50" r="45" class="timer-fill"
                    :style="{ strokeDashoffset: progressOffset }"
                    :class="{ warning: isWarningTime, critical: isCriticalTime }"></circle>
          </svg>
          <div class="timer-time">
            <div class="time-display">{{ mm }}:{{ ss }}</div>
            <div class="time-label">{{ !isActive ? 'EN ATTENTE' : (isBreak ? 'PAUSE' : currentSubject) }}</div>
          </div>
        </div>
      </div>
      
      <!-- Configuration (visible si inactif) -->
      <div v-if="!isActive" class="timer-config" @click.stop>
        <div class="config-title">Configuration</div>
        <div class="config-grid">
          <label>
            <span>Sessions</span>
            <input type="number" v-model.number="config.sessionsCount" min="1" max="12" />
          </label>
          <label>
            <span>Focus (min)</span>
            <input type="number" v-model.number="config.focusMinutes" min="1" max="180" />
          </label>
          <label>
            <span>Pause (min)</span>
            <input type="number" v-model.number="config.breakMinutes" min="1" max="60" />
          </label>
        </div>
        <button @click="startConfiguredTimer">▶️ Lancer</button>
        <button @click="resetTimerConfig">🔄 Réinitialiser</button>
      </div>
    </div>
    
    <!-- Contrôles -->
    <div class="timer-controls" @click.stop>
      <button v-if="isPaused && isActive" @click="resume">▶️</button>
      <button v-else @click="togglePause">⏸️</button>
      <button @click="stopTimer">⏹️</button>
      <button @click="extendTimer(5)">➕ 5min</button>
    </div>
    
    <!-- Infos -->
    <div class="timer-info">
      <div>Session : {{ sessionNumber }}/{{ totalSessions }}</div>
      <div>Temps total : {{ totalTimeToday }} min</div>
      <div>Prochaine pause : {{ nextBreakIn }}</div>
    </div>
    
    <div v-if="isPaused && isActive" class="pause-status">
      <div>⏸️</div>
      <div>Session en pause</div>
      <div>{{ pausedFor }}</div>
    </div>
  </div>
</div>
```

**Styles CSS**:
- Cercle SVG avec stroke-dasharray animé
- Couleurs selon état (warning=orange, critical=rouge)
- Animation de pulsation sur le cercle actif
- Configuration avec inputs stylisés
- Boutons avec effets néon

**Logique du Cercle SVG**:
```javascript
// Calcul du stroke-dashoffset pour le cercle de progression
progressOffset() {
  const p = Math.min(1, Math.max(0, this.progressPercent / 100));
  return this.circumference * p; // 2πr * pourcentage
}
```

**Interactions**:
1. Configuration → Saisie sessions, focus, pause
2. Lancer → Démarre le premier segment focus
3. Pause/Reprise → Bascule l'état
4. Stop → Arrête et calcule le temps passé
5. Extend → Ajoute 5 minutes au segment courant
6. Fin segment → Bascule focus/pause automatiquement
7. Fin série → Notification + événement

**Logique Métier**:
- Alternance focus/pause automatique
- Compteur de sessions
- Calcul du temps total
- Gestion des états (actif, pause, break)
- Notifications sonores (si disponibles)


#### LastChanceBlock (Priority-High)

**Fichier**: `src/components/dashboard/blocks/priority-high/LastChanceBlock.js`

**Description**: Bloc d'urgence affichant le compte à rebours jusqu'à minuit et les quêtes incomplètes. Span 2 colonnes.

**Props**:
- `allData` (Object, required)

**Data**:
- `isCompletingAll` (Boolean): Completion de toutes les quêtes en cours
- `completingQuests` (Set): IDs des quêtes en cours de completion
- `blinkInterval` (Interval): Intervalle de clignotement
- `timeRemainingSec` (Number): Secondes restantes jusqu'à minuit
- `countdownInterval` (Interval): Intervalle du compte à rebours

**Computed**:
- `lastChanceData`: Données de dernière chance
- `timeUntilMidnight`: Temps formaté HH:MM:SS
- `questsRemaining`: Nombre de quêtes restantes
- `totalQuests`: Nombre total de quêtes
- `totalXPRemaining`: XP total restant
- `incompleteQuests`: Liste des quêtes incomplètes
- `hoursUntilMidnight`: Heures restantes (décimal)
- `isHighUrgency`: Urgence élevée (≥5 quêtes ou ≤2h)
- `isMediumUrgency`: Urgence moyenne (≥3 quêtes ou ≤4h)
- `isLowUrgency`: Urgence basse (≥1 quête ou ≤8h)

**Methods**:
- `getUrgencyClass()`: Classe CSS d'urgence
- `getTimeUrgencyClass()`: Classe CSS selon le temps
- `getQuestUrgencyClass()`: Classe CSS selon les quêtes
- `getCountdownIcon()`: Icône selon l'urgence
- `completeQuest(questId)`: Complète une quête
- `completeAllQuests()`: Complète toutes les quêtes
- `animateQuestCompletion(questId)`: Animation de completion
- `celebrateAllComplete()`: Célébration de fin
- `enterFocusMode()`: Active le mode focus
- `initAccurateCountdown()`: Initialise le compte à rebours précis
- `startBlinkingAnimation()`: Démarre le clignotement
- `stopBlinkingAnimation()`: Arrête le clignotement
- `onQuestCompleted(questData)`: Handler quête complétée
- `onMidnightApproaching(data)`: Handler minuit approche

**Events Emitted**:
- `update-data`: Émis lors de la completion
  ```javascript
  {
    type: 'complete-quest-urgent',
    questId: String,
    timestamp: Date
  }
  ```
- `activate-focus-mode`: Émis pour activer le mode focus
  ```javascript
  {
    type: 'quest-completion',
    remainingQuests: Number,
    timeLimit: String
  }
  ```

**Template Structure**:
```html
<div class="last-chance-card" :class="getUrgencyClass()" style="grid-column: span 2;">
  <div class="card-glow urgency-glow" :class="getUrgencyClass()"></div>
  
  <div class="card-header">
    <span class="card-icon">🚨</span>
    <h3>DERNIÈRE CHANCE</h3>
    <div class="urgency-indicators">
      <span class="countdown-badge" :class="getTimeUrgencyClass()">{{ timeUntilMidnight }}</span>
      <span class="quests-remaining-badge" :class="getQuestUrgencyClass()">{{ questsRemaining }}/{{ totalQuests }}</span>
    </div>
  </div>
  
  <div class="card-content">
    <!-- Compte à rebours -->
    <div class="countdown-display" :class="getTimeUrgencyClass()">
      <div class="countdown-icon">{{ getCountdownIcon() }}</div>
      <div class="countdown-time">{{ timeUntilMidnight }}</div>
      <div class="countdown-text">jusqu'à minuit</div>
    </div>
    
    <!-- Métriques -->
    <div class="urgency-metrics">
      <div class="metric-item">
        <span>⭐</span>
        <span>{{ totalXPRemaining }} XP restants</span>
      </div>
      <div class="metric-item">
        <span>🎯</span>
        <span>{{ questsRemaining }} quêtes restantes</span>
      </div>
    </div>
    
    <!-- Liste des quêtes incomplètes -->
    <div v-if="incompleteQuests.length > 0" class="incomplete-quests">
      <div class="quests-header">
        <span>Quêtes à terminer :</span>
        <span v-if="isHighUrgency">🔥</span>
      </div>
      
      <div class="urgent-quests-list">
        <div v-for="quest in incompleteQuests" 
             :data-quest-id="quest.id"
             class="urgent-quest-item"
             :class="{ 'high-priority': quest.priority === 'high' }">
          <div class="quest-icon">{{ quest.icon }}</div>
          <div class="quest-info">
            <span>{{ quest.name }}</span>
            <span>+{{ quest.xp }}XP</span>
            <span v-if="quest.priority === 'high'">URGENT</span>
          </div>
          <button @click="completeQuest(quest.id)">✓</button>
        </div>
      </div>
    </div>
    
    <!-- Message de félicitations -->
    <div v-else class="all-complete-message">
      <div>🎉</div>
      <div>Toutes les quêtes terminées !</div>
      <div>Excellente journée accomplie</div>
    </div>
    
    <!-- Actions -->
    <div v-if="incompleteQuests.length > 0" class="urgency-actions">
      <button @click="completeAllQuests" :disabled="isCompletingAll">
        ✅ Tout marquer terminé
      </button>
      <button @click="enterFocusMode">
        🎯 Mode Focus
      </button>
    </div>
  </div>
</div>
```

**Styles CSS**:
- Classes d'urgence (high, medium, low, completed)
- Animation de clignotement selon urgence
- Couleurs progressives (vert → orange → rouge)
- Badges avec bordures colorées
- Animation de disparition des quêtes complétées

**Logique du Compte à Rebours**:
```javascript
// Calcul précis jusqu'à minuit avec reset automatique
initAccurateCountdown() {
  const computeRemaining = () => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const diffMs = midnight.getTime() - now.getTime();
    return Math.max(0, Math.floor(diffMs / 1000));
  };
  
  this.timeRemainingSec = computeRemaining();
  
  this.countdownInterval = setInterval(() => {
    this.timeRemainingSec = computeRemaining();
    if (this.timeRemainingSec === 0) {
      // Reset à 24h après minuit
      setTimeout(() => {
        this.timeRemainingSec = 24 * 3600;
      }, 1000);
    }
  }, 1000);
}
```

**Interactions**:
1. Clic sur ✓ → Complète la quête avec animation
2. Tout marquer terminé → Confirmation + completion séquentielle
3. Mode Focus → Active le mode focus
4. Clignotement automatique si urgence
5. Célébration si toutes les quêtes terminées (confettis)

**Logique Métier**:
- Calcul d'urgence basé sur temps ET quêtes
- Animation de clignotement adaptative
- Completion séquentielle avec délai
- Reset automatique à minuit
- Émission d'événements globaux


#### DailyRegularityBlock (Priority-High)

**Fichier**: `src/components/dashboard/blocks/priority-high/DailyRegularityBlock.js`

**Description**: Affiche la régularité quotidienne avec flamme animée, streak actuel vs record, et historique des 7 derniers jours.

**Props**:
- `allData` (Object, required)

**Data**:
- `flameAnimation` (Interval): Animation de la flamme
- `timeRemainingSec` (Number): Secondes jusqu'à minuit
- `countdownInterval` (Interval): Intervalle du compte à rebours

**Computed**:
- `regularityData`: Données de régularité
- `currentStreak`: Streak actuel
- `bestStreak`: Meilleur streak
- `motivationalMessage`: Message motivationnel
- `last7Days`: 7 derniers jours triés (Lun-Dim)
- `timeUntilMidnight`: Temps formaté HH:MM:SS
- `todayCompleted`: Aujourd'hui complété
- `regularityStatus`: Statut ('broken', 'starting', 'building', 'good', 'excellent')
- `flameClass`: Classe de la flamme selon le streak
- `streakProgressPercent`: Pourcentage vs record
- `isRecordApproaching`: Proche du record (≤3 jours)
- `daysToRecord`: Jours jusqu'au record
- `isStreakBroken`: Streak cassé
- `isNewRecord`: Nouveau record
- `isUrgent`: Urgent (≤3h et pas complété)

**Methods**:
- `getFlameIcon()`: Icône de flamme selon statut
- `getStreakText()`: Texte du streak
- `getMotivationalIcon()`: Icône motivationnelle
- `getTimeUrgencyClass()`: Classe CSS selon temps
- `maintainRegularity()`: Maintient la régularité
- `onRegularityMaintained(sessionData)`: Handler régularité maintenue
- `celebrateNewRecord()`: Célébration nouveau record
- `animateSuccess()`: Animation de succès
- `animateFlame()`: Animation de la flamme
- `navigateToExpress()`: Navigation vers formulaire express
- `startFlameAnimation()`: Démarre l'animation de flamme
- `stopFlameAnimation()`: Arrête l'animation
- `onSessionRecorded(sessionData)`: Handler session enregistrée
- `onQuestCompleted(questData)`: Handler quête complétée
- `initAccurateCountdown()`: Initialise le compte à rebours

**Events Emitted**:
- `update-data`: Émis lors du maintien
  ```javascript
  {
    type: 'maintain-regularity',
    sessionData: Object,
    timestamp: Date
  }
  ```
- `open-modal`: Émis pour formulaire express
  ```javascript
  {
    type: 'express-session',
    purpose: 'maintain-regularity',
    callback: Function
  }
  ```

**Template Structure**:
```html
<div class="regularity-card" @click="navigateToExpress">
  <div class="card-glow" :class="regularityStatus"></div>
  
  <div class="card-header">
    <h3>RÉGULARITÉ</h3>
    <span class="card-badge" :class="regularityStatus">{{ currentStreak }}J</span>
  </div>
  
  <div class="card-content">
    <!-- Affichage principal avec flamme -->
    <div class="main-streak-display" :class="regularityStatus">
      <div class="streak-content">
        <div class="streak-number-large">{{ currentStreak }}</div>
        <div class="streak-text">jours consécutifs</div>
      </div>
      <div class="streak-flame" :class="flameClass">
        <span class="flame-emoji">🔥</span>
      </div>
    </div>
    
    <!-- Comparaison et progression -->
    <div class="comparison-section">
      <div class="comparison-labels">
        <span>ACTUELLE : {{ currentStreak }} JOURS</span>
        <span>Meilleure : {{ bestStreak }} jours</span>
      </div>
      <div class="progress-section">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: streakProgressPercent + '%' }"></div>
        </div>
        <div class="progress-text">{{ streakProgressPercent }}% de votre record</div>
      </div>
    </div>
    
    <!-- Message motivationnel -->
    <div class="motivational-message" :class="regularityStatus">
      <div class="message-icon">🎯</div>
      <div class="message-text">Excellente régularité maintenue depuis {{ currentStreak }} jours !</div>
    </div>
    
    <!-- Compte à rebours -->
    <div class="countdown-section">
      <div class="countdown-label">Temps restant pour maintenir :</div>
      <div class="countdown-display" :class="getTimeUrgencyClass()">
        <span>⏳</span>
        <span>{{ timeUntilMidnight }}</span>
      </div>
    </div>
    
    <!-- Historique 7 jours -->
    <div class="history-section">
      <div class="history-title">7 DERNIERS JOURS</div>
      <div class="history-grid">
        <div v-for="(day, index) in last7Days" 
             class="history-card"
             :class="{ 
               completed: day.completed, 
               today: day.isToday,
               pending: !day.completed && !day.isToday
             }">
          <div class="day-name">{{ day.dayName }}</div>
          <div class="day-status">{{ day.completed ? '✓' : '•' }}</div>
          <div v-if="day.isToday" class="day-note">
            <div class="today-badge">Aujourd'hui</div>
            <div>{{ day.completed ? 'Maintenu' : 'À faire' }}</div>
          </div>
          <div v-else class="day-note">
            <div>{{ day.completed ? 'Maintenu' : 'À faire' }}</div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Indicateur du bas -->
    <div class="bottom-indicator">
      <div>✓</div>
      <div>Régularité maintenue</div>
    </div>
  </div>
</div>
```

**Styles CSS**:
- Flamme avec animation de scale aléatoire
- Classes de flamme (dead, small, medium, large, epic)
- Couleurs selon statut (rouge → orange → vert)
- Historique avec grille 7 colonnes
- Animation de boost sur nouveau record

**Logique de la Flamme**:
```javascript
// Animation de flamme aléatoire
startFlameAnimation() {
  if (this.currentStreak === 0) return;
  
  const flame = this.$el.querySelector('.flame-icon');
  if (!flame) return;
  
  this.flameAnimation = setInterval(() => {
    flame.style.transform = `scale(${0.9 + Math.random() * 0.2})`;
  }, 200);
}
```

**Watch**:
- `currentStreak`: Redémarre l'animation de flamme si changement

**Interactions**:
1. Clic sur carte → Navigation vers formulaire express
2. Animation de flamme continue si streak > 0
3. Nouveau record → Confettis + notification
4. Compte à rebours précis jusqu'à minuit
5. Historique avec indicateur "Aujourd'hui"

**Logique Métier**:
- Calcul du pourcentage vs record
- Détermination du statut de régularité
- Tri des 7 derniers jours (Lun-Dim)
- Détection de nouveau record
- Reset automatique à minuit


---

## Correctness Properties

### Property 1: Chargement progressif des blocs

*Pour tout* dashboard, les blocs doivent être chargés dans l'ordre de priorité (priority-max → priority-high → priority-moderate → priority-low) sans bloquer l'affichage.

**Validates: Requirements 12.2, 12.3, 12.4, 12.5**

### Property 2: Synchronisation des données entre blocs

*Pour toute* mise à jour de données dans un bloc, tous les autres blocs affichant ces données doivent être mis à jour en temps réel.

**Validates: Requirements 14.1, 14.2, 14.3, 14.4**

### Property 3: Persistance des données

*Pour toute* modification de données, les changements doivent être sauvegardés dans le localStorage et restaurés au chargement.

**Validates: Requirements 14.5, 14.6, 14.7**

### Property 4: Validation des données

*Pour toute* saisie utilisateur, les données doivent être validées selon leur type et leurs limites avant sauvegarde.

**Validates: Requirements 19.1, 19.2, 19.3, 19.4**

### Property 5: Thème cyberpunk cohérent

*Pour tout* élément visuel, les couleurs néon (cyan, magenta, vert) et les effets de glow doivent être appliqués de manière cohérente.

**Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5**

### Property 6: Responsive adaptatif

*Pour toute* taille d'écran, la disposition des blocs doit s'adapter automatiquement sans perte de fonctionnalité.

**Validates: Requirements 15.1, 15.2, 15.3, 15.4, 15.5**

### Property 7: Accessibilité des interactions

*Pour tout* élément interactif, il doit être accessible au clavier et fournir des attributs ARIA appropriés.

**Validates: Requirements 18.1, 18.2, 18.3, 18.4, 18.5**

### Property 8: Performance du chargement

*Pour tout* chargement de dashboard, le temps total doit être inférieur à 2 secondes pour les blocs priority-max et priority-high.

**Validates: Requirements 17.1, 17.2, 17.3**

---

## Error Handling

### Gestion des Erreurs de Chargement

**Stratégie**: Continuer le chargement des autres blocs même si un bloc échoue.

```javascript
async loadBlock(blockName, priority) {
  try {
    await this.loadScript(blockPath);
    this.loadedBlocks.add(blockName);
  } catch (error) {
    console.error(`Erreur lors du chargement du bloc ${blockName}:`, error);
    // Continuer avec les autres blocs
    return null;
  }
}
```

### Gestion des Erreurs de Données

**Stratégie**: Utiliser des valeurs par défaut si les données sont corrompues.

```javascript
computed: {
  dailyQuests() {
    return this.allData?.mockData?.dailyQuests?.quests || [];
  }
}
```

### Gestion des Erreurs de Validation

**Stratégie**: Afficher un message d'erreur explicite et empêcher la sauvegarde.

```javascript
saveSession() {
  if (!this.canSaveSession) {
    if (typeof window.showNotification === 'function') {
      window.showNotification('Veuillez remplir au moins un exercice', 'error');
    }
    return;
  }
  // ...
}
```

### Gestion des Erreurs de Connexion

**Stratégie**: Afficher un indicateur de déconnexion et réessayer automatiquement.

```javascript
async refreshData() {
  try {
    // Appel API
  } catch (error) {
    this.isConnected = false;
    if (typeof window.showNotification === 'function') {
      window.showNotification('Erreur de connexion', 'error');
    }
  }
}
```

---

## Testing Strategy

### Unit Tests

**Framework**: Vitest ou Jest

**Couverture**:
- Tests des computed properties
- Tests des methods
- Tests des validations
- Tests des formatages

**Exemple**:
```javascript
describe('QuestDailyBlock', () => {
  it('should calculate XP progress correctly', () => {
    const wrapper = mount(QuestDailyBlock, {
      props: {
        allData: {
          mockData: {
            dailyQuests: {
              xpEarned: 50,
              xpPotential: 100
            }
          }
        }
      }
    });
    expect(wrapper.vm.progressPercent).toBe(50);
  });
});
```

### Property-Based Tests

**Framework**: fast-check (JavaScript)

**Propriétés à tester**:
1. Chargement progressif des blocs
2. Synchronisation des données
3. Validation des entrées
4. Formatage des durées
5. Calcul des pourcentages

**Exemple**:
```javascript
import fc from 'fast-check';

describe('SportSessionBlock - Property Tests', () => {
  it('should always format duration correctly', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10000 }), (minutes) => {
        const formatted = formatDuration(minutes);
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        
        if (hours > 0) {
          expect(formatted).toMatch(/^\d+h\d{0,2}$/);
        } else {
          expect(formatted).toMatch(/^\d+min$/);
        }
      })
    );
  });
});
```

### Integration Tests

**Framework**: Cypress ou Playwright

**Scénarios**:
1. Chargement complet du dashboard
2. Completion d'une quête
3. Enregistrement d'une session de sport
4. Démarrage d'un timer
5. Navigation entre les blocs

**Exemple**:
```javascript
describe('Dashboard Integration', () => {
  it('should complete a quest and update XP', () => {
    cy.visit('/');
    cy.get('.quest-checkbox').first().click();
    cy.get('.xp-earned').should('contain', '10 XP gagné');
  });
});
```


---

## Cyberpunk Theme & Styling

### Color Palette

**Primary Colors**:
```css
:root {
  /* Néon Cyan */
  --neon-cyan: #00F5FF;
  --neon-cyan-dark: #00B8D4;
  --neon-cyan-light: #6DFFFF;
  
  /* Néon Magenta */
  --neon-magenta: #FF00FF;
  --neon-magenta-dark: #C700C7;
  --neon-magenta-light: #FF6DFF;
  
  /* Néon Vert */
  --neon-green: #39FF14;
  --neon-green-dark: #2BC700;
  --neon-green-light: #7FFF6D;
  
  /* Backgrounds */
  --bg-primary: #0a0e27;
  --bg-secondary: #1a1f3a;
  --bg-tertiary: #2a2f4a;
  
  /* Text */
  --text-primary: #E0E6ED;
  --text-secondary: #A0A6B0;
  --text-tertiary: #707580;
  
  /* Status Colors */
  --status-success: #00FF88;
  --status-warning: #FFB800;
  --status-error: #FF0040;
  --status-info: #00B8FF;
}
```

### Typography

**Font Families**:
```css
:root {
  --font-primary: 'Orbitron', sans-serif; /* Titres */
  --font-secondary: 'Rajdhani', sans-serif; /* Corps */
  --font-mono: 'JetBrains Mono', monospace; /* Code/Chiffres */
}

/* Titres */
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-primary);
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

/* Corps */
body, p, span, div {
  font-family: var(--font-secondary);
  font-weight: 400;
}

/* Chiffres et données */
.metric-value, .stat-value, .time-display {
  font-family: var(--font-mono);
  font-weight: 600;
}
```

### Glow Effects

**Card Glow**:
```css
.card-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 12px;
  opacity: 0.3;
  pointer-events: none;
  background: linear-gradient(
    135deg,
    var(--neon-cyan) 0%,
    var(--neon-magenta) 50%,
    var(--neon-green) 100%
  );
  filter: blur(20px);
  z-index: -1;
}

.dashboard-card:hover .card-glow {
  opacity: 0.5;
  filter: blur(25px);
  transition: all 0.3s ease;
}
```

**Text Glow**:
```css
.neon-text {
  color: var(--neon-cyan);
  text-shadow: 
    0 0 5px var(--neon-cyan),
    0 0 10px var(--neon-cyan),
    0 0 20px var(--neon-cyan),
    0 0 40px var(--neon-cyan);
}

.neon-text-magenta {
  color: var(--neon-magenta);
  text-shadow: 
    0 0 5px var(--neon-magenta),
    0 0 10px var(--neon-magenta),
    0 0 20px var(--neon-magenta);
}
```

**Border Glow**:
```css
.dashboard-card {
  border: 1px solid rgba(0, 245, 255, 0.3);
  box-shadow: 
    0 0 10px rgba(0, 245, 255, 0.2),
    inset 0 0 10px rgba(0, 245, 255, 0.1);
}

.dashboard-card:hover {
  border-color: rgba(0, 245, 255, 0.6);
  box-shadow: 
    0 0 20px rgba(0, 245, 255, 0.4),
    inset 0 0 15px rgba(0, 245, 255, 0.2);
}
```

### Animations

**Pulsation**:
```css
@keyframes pulse-glow {
  0%, 100% {
    opacity: 0.5;
    filter: blur(20px);
  }
  50% {
    opacity: 0.8;
    filter: blur(30px);
  }
}

.pulsing {
  animation: pulse-glow 2s ease-in-out infinite;
}
```

**Scan Line**:
```css
@keyframes scan-line {
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(100%);
  }
}

.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(
    to right,
    transparent,
    var(--neon-cyan),
    transparent
  );
  animation: scan-line 3s linear infinite;
}
```

**Glitch Effect**:
```css
@keyframes glitch {
  0% {
    transform: translate(0);
  }
  20% {
    transform: translate(-2px, 2px);
  }
  40% {
    transform: translate(-2px, -2px);
  }
  60% {
    transform: translate(2px, 2px);
  }
  80% {
    transform: translate(2px, -2px);
  }
  100% {
    transform: translate(0);
  }
}

.glitch {
  animation: glitch 0.3s ease-in-out;
}
```

### Grid Layout

**Dashboard Grid**:
```css
.modular-dashboard-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  padding: 20px;
  max-width: 1920px;
  margin: 0 auto;
}

.dashboard-line {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  grid-column: 1 / -1;
}

/* Span multiple columns */
.span-2 {
  grid-column: span 2;
}

.span-3 {
  grid-column: span 3;
}

.span-4 {
  grid-column: span 4;
}
```

**Responsive Breakpoints**:
```css
/* Large screens (>1920px) */
@media (min-width: 1921px) {
  .modular-dashboard-grid {
    max-width: 2560px;
  }
}

/* Medium screens (1280-1920px) */
@media (max-width: 1920px) {
  .modular-dashboard-grid {
    gap: 16px;
    padding: 16px;
  }
}

/* Small screens (<1280px) */
@media (max-width: 1280px) {
  .dashboard-line {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .span-3, .span-4 {
    grid-column: span 2;
  }
}

/* Mobile (<768px) */
@media (max-width: 768px) {
  .dashboard-line {
    grid-template-columns: 1fr;
  }
  
  .span-2, .span-3, .span-4 {
    grid-column: span 1;
  }
}
```

### Card Styles

**Base Card**:
```css
.dashboard-card {
  position: relative;
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 20px;
  overflow: hidden;
  transition: all 0.3s ease;
}

.dashboard-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    var(--neon-cyan),
    transparent
  );
}
```

**Card Header**:
```css
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid rgba(0, 245, 255, 0.2);
}

.card-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--neon-cyan);
  text-shadow: 0 0 10px var(--neon-cyan);
}

.card-icon {
  font-size: 1.5rem;
  margin-right: 10px;
}

.card-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  background: rgba(0, 245, 255, 0.1);
  border: 1px solid rgba(0, 245, 255, 0.3);
  color: var(--neon-cyan);
}
```

### Button Styles

**Primary Button**:
```css
.btn-primary {
  padding: 12px 24px;
  background: linear-gradient(
    135deg,
    var(--neon-cyan),
    var(--neon-magenta)
  );
  border: none;
  border-radius: 8px;
  color: var(--bg-primary);
  font-weight: 600;
  font-family: var(--font-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.btn-primary::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.btn-primary:hover::before {
  width: 300px;
  height: 300px;
}

.btn-primary:hover {
  box-shadow: 
    0 0 20px var(--neon-cyan),
    0 0 40px var(--neon-magenta);
  transform: translateY(-2px);
}
```

**Secondary Button**:
```css
.btn-secondary {
  padding: 10px 20px;
  background: transparent;
  border: 2px solid var(--neon-cyan);
  border-radius: 8px;
  color: var(--neon-cyan);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: rgba(0, 245, 255, 0.1);
  box-shadow: 
    0 0 10px var(--neon-cyan),
    inset 0 0 10px rgba(0, 245, 255, 0.2);
}
```

### Progress Bars

**Standard Progress Bar**:
```css
.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(0, 245, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(
    90deg,
    var(--neon-cyan),
    var(--neon-magenta)
  );
  border-radius: 4px;
  transition: width 0.5s ease;
  box-shadow: 0 0 10px var(--neon-cyan);
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
```

### Input Styles

**Text Input**:
```css
input[type="text"],
input[type="number"],
textarea,
select {
  width: 100%;
  padding: 12px;
  background: rgba(0, 245, 255, 0.05);
  border: 1px solid rgba(0, 245, 255, 0.3);
  border-radius: 8px;
  color: var(--text-primary);
  font-family: var(--font-secondary);
  font-size: 1rem;
  transition: all 0.3s ease;
}

input:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: var(--neon-cyan);
  box-shadow: 
    0 0 10px rgba(0, 245, 255, 0.3),
    inset 0 0 10px rgba(0, 245, 255, 0.1);
  background: rgba(0, 245, 255, 0.1);
}

input::placeholder {
  color: var(--text-tertiary);
}
```

### SVG Styles

**Circular Gauge**:
```css
.circular-gauge svg {
  width: 120px;
  height: 120px;
  transform: rotate(-90deg);
}

.gauge-background {
  fill: none;
  stroke: rgba(0, 245, 255, 0.1);
  stroke-width: 8;
}

.gauge-current {
  fill: none;
  stroke: var(--neon-cyan);
  stroke-width: 8;
  stroke-linecap: round;
  transition: stroke-dashoffset 0.5s ease;
  filter: drop-shadow(0 0 5px var(--neon-cyan));
}

.gauge-target {
  fill: none;
  stroke: rgba(255, 255, 255, 0.2);
  stroke-width: 2;
  stroke-dasharray: 5 5;
}
```

# Implementation Plan - QuietQuest Dashboard Cyberpunk

## Vue d'ensemble

Ce plan d'implémentation détaille toutes les étapes nécessaires pour recréer le dashboard QuietQuest à l'identique. Les tâches sont organisées par priorité et par composant, suivant l'architecture modulaire définie dans le design.

---

## Phase 1: Infrastructure et Configuration

- [ ] 1. Configuration initiale du projet
  - Créer la structure de dossiers (src/components, src/styles, src/services)
  - Configurer le fichier index.html avec les CDN (Vue 3, Chart.js, Three.js, Tailwind)
  - Ajouter les Google Fonts (Orbitron, Rajdhani, JetBrains Mono)
  - Configurer les variables CSS globales pour le thème cyberpunk
  - _Requirements: 1.1, 1.2, 13.1_

- [ ] 2. Créer le système de chargement modulaire
  - Implémenter BlocksRegistry.js avec les méthodes de chargement
  - Créer la structure blocksByPriority avec les 4 niveaux
  - Implémenter loadBlock(), loadBlocksByPriority(), loadAllBlocks()
  - Ajouter le mapping componentTagMap
  - Implémenter loadScript() et loadStylesheet()
  - _Requirements: 12.6, 12.7, 12.8, 20.1_

- [ ] 3. Créer les styles CSS de base
  - Créer main.css avec les variables CSS du thème
  - Implémenter les classes de glow effects (card-glow, neon-text, border-glow)
  - Créer les animations (pulse-glow, scan-line, glitch, shimmer)
  - Définir la grille responsive (modular-dashboard-grid)
  - Créer les styles de base pour les cartes (dashboard-card)
  - _Requirements: 13.1, 13.2, 13.3, 13.6, 13.7_

---

## Phase 2: Dashboard Principal et Structure

- [ ] 4. Créer ModularDashboardComponent
  - Créer le fichier ModularDashboardComponent.js
  - Implémenter le template avec les 11 lignes
  - Définir les props (allData)
  - Implémenter les data (isLoading, loadedBlocksCount, etc.)
  - Créer les computed (loadingProgress)
  - Implémenter les methods (handleDataUpdate, handleNavigation, etc.)
  - Ajouter le lifecycle mounted avec initializeBlocks()
  - _Requirements: 1.1, 1.2, 1.3, 14.1_

- [ ] 5. Créer le système d'événements
  - Implémenter handleDataUpdate() pour propager les mises à jour
  - Créer processLocalUpdate() pour traiter les mises à jour locales
  - Implémenter handleQuestToggle(), handleSessionSave()
  - Ajouter les émissions d'événements globaux (quest-toggled, session-saved)
  - _Requirements: 14.1, 14.2, 14.3, 14.4_

- [ ] 6. Créer l'écran de chargement
  - Implémenter l'indicateur de chargement avec barre de progression
  - Ajouter le compteur de blocs chargés
  - Créer les animations de chargement
  - Implémenter la logique de masquage après chargement complet
  - _Requirements: 12.1, 12.8_

---

## Phase 3: Blocs de Priorité Maximale (Ligne 0-2)

- [ ] 7. Implémenter XpLevelStatsBlock
  - Créer le fichier XpLevelStatsBlock.js
  - Implémenter le template avec niveau et barre XP
  - Créer les computed (currentLevel, currentXP, xpProgress)
  - Ajouter les animations de gain d'XP
  - Créer le CSS associé (XpLevelStatsBlock.css)
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 8. Implémenter QuestDailyBlock
  - Créer le fichier QuestDailyBlock.js
  - Implémenter le template avec liste de quêtes et métriques XP
  - Créer les computed (dailyQuests, xpEarned, progressPercent)
  - Implémenter toggleQuest() avec animation
  - Ajouter l'émission d'événements (update-data, quest-toggled)
  - Créer le CSS avec animations de check
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 9. Implémenter SportSessionBlock (Partie Formulaire)
  - Créer le fichier SportSessionBlock.js
  - Implémenter le template dual-layout (formulaire + analytics)
  - Créer la section formulaire avec exercices maison et parc
  - Implémenter updateExercise() pour mise à jour en temps réel
  - Ajouter la comparaison vs dernière valeur
  - _Requirements: 3.6, 3.7, 3.10_

- [ ] 10. Implémenter SportSessionBlock (Partie Analytics)
  - Créer la section analytics avec 7 et 30 derniers jours
  - Implémenter les computed pour analytics (last7Days, last30Days, global)
  - Ajouter l'affichage des métriques globales
  - Créer les styles pour la disposition dual-layout
  - _Requirements: 3.8, 3.9_

- [ ] 11. Implémenter SportSessionBlock (Logique Métier)
  - Implémenter saveSession() avec validation
  - Créer checkForRecordAlert() pour détection de records
  - Implémenter showRecordBroken() avec confettis
  - Ajouter calculateSuggestions() basé sur l'historique
  - Créer les animations de succès
  - _Requirements: 3.10, 16.1, 16.2, 16.7_

- [ ] 12. Implémenter PatrimonyLiveBlock (Structure)
  - Créer le fichier PatrimonyLiveBlock.js
  - Implémenter le template avec valeur totale et performance
  - Créer les computed (totalValue, dailyPerformance, allocation)
  - Ajouter l'indicateur de connexion temps réel
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.7_

- [ ] 13. Implémenter PatrimonyLiveBlock (Jauges Circulaires)
  - Créer les jauges circulaires SVG pour Or/Bourse/Cash
  - Implémenter getCurrentDashArray() et getTargetDashArray()
  - Ajouter les filtres SVG pour effets glow
  - Créer les styles pour les jauges avec animations
  - _Requirements: 4.5, 4.6, 13.2_

- [ ] 14. Implémenter PatrimonyLiveBlock (Actualisation)
  - Implémenter refreshData() avec appel API simulé
  - Créer startAutoRefresh() pour actualisation toutes les 5 min
  - Ajouter checkConnectionStatus() avec événements online/offline
  - Implémenter la gestion des alertes financières
  - _Requirements: 4.7, 17.6_

- [ ] 15. Implémenter ReadingSessionBlock (Formulaire)
  - Créer le fichier ReadingSessionBlock.js
  - Implémenter le template dual-layout
  - Créer la sélection de livre avec dropdown
  - Ajouter les inputs de durée (heures/minutes)
  - Implémenter l'affichage du livre sélectionné avec progression
  - _Requirements: 4.8, 4.9_

- [ ] 16. Implémenter ReadingSessionBlock (Analytics)
  - Créer la section analytics avec 7 et 30 derniers jours
  - Implémenter les computed pour analytics de lecture
  - Ajouter la répartition par genre avec barres
  - Créer l'affichage des métriques globales
  - _Requirements: 4.10, 4.11_

- [ ] 17. Implémenter ReadingSessionBlock (Logique)
  - Implémenter saveReadingSession() avec validation
  - Créer calculateSuggestions() basé sur vitesse de lecture
  - Ajouter checkBookAlerts() pour livres en pause >7 jours
  - Implémenter l'estimation de fin de livre
  - Créer le watch sur totalSessionMinutes pour calcul auto des pages
  - _Requirements: 4.12, 16.1, 16.2_

---

## Phase 4: Blocs de Priorité Haute (Ligne 3-4)

- [ ] 18. Implémenter LearningStatusBlock
  - Créer le fichier LearningStatusBlock.js
  - Implémenter le template avec matière active et stats
  - Créer les computed (activeSubject, subjectIcon, progressPercent, objectiveStatus)
  - Ajouter la barre de progression avec classes (completed, on-track, in-progress, at-risk)
  - Implémenter startSession() et openNotes()
  - Créer les styles avec badges colorés
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 19. Implémenter ActiveTimerBlock (Structure)
  - Créer le fichier ActiveTimerBlock.js
  - Implémenter le template avec cercle SVG et configuration
  - Créer les data (isActive, isPaused, minutes, seconds, config)
  - Ajouter les computed (mm, ss, progressPercent, progressOffset)
  - _Requirements: 5.7, 5.8_

- [ ] 20. Implémenter ActiveTimerBlock (Logique Timer)
  - Implémenter startConfiguredTimer() et resetTimerConfig()
  - Créer startTicking() avec intervalle de 1 seconde
  - Ajouter togglePause(), resume(), stopTimer()
  - Implémenter extendTimer() pour ajouter des minutes
  - Créer onSegmentComplete() pour alternance focus/pause
  - _Requirements: 5.8, 5.9, 16.4_

- [ ] 21. Implémenter ActiveTimerBlock (UI et Styles)
  - Créer le cercle SVG avec stroke-dashoffset animé
  - Ajouter les classes warning et critical selon le temps
  - Implémenter la configuration visible quand inactif
  - Créer les contrôles (play, pause, stop, extend)
  - Ajouter les styles avec animations de pulsation
  - _Requirements: 5.8, 5.9, 13.5_

- [ ] 22. Implémenter LastChanceBlock (Structure)
  - Créer le fichier LastChanceBlock.js
  - Implémenter le template avec compte à rebours et quêtes
  - Créer les data (isCompletingAll, completingQuests, timeRemainingSec)
  - Ajouter les computed (timeUntilMidnight, hoursUntilMidnight, isHighUrgency)
  - _Requirements: 5.10, 5.11, 5.12_

- [ ] 23. Implémenter LastChanceBlock (Compte à Rebours)
  - Implémenter initAccurateCountdown() avec calcul précis jusqu'à minuit
  - Créer le formatage HH:MM:SS
  - Ajouter le reset automatique à 24h après minuit
  - Implémenter l'intervalle de mise à jour chaque seconde
  - _Requirements: 5.10, 17.6_

- [ ] 24. Implémenter LastChanceBlock (Completion Quêtes)
  - Implémenter completeQuest() avec animation
  - Créer completeAllQuests() avec confirmation
  - Ajouter animateQuestCompletion() avec classes CSS
  - Implémenter celebrateAllComplete() avec confettis
  - Créer enterFocusMode() pour mode focus
  - _Requirements: 5.11, 5.12, 16.1, 16.7_

- [ ] 25. Implémenter LastChanceBlock (Urgence)
  - Créer getUrgencyClass() basé sur temps et quêtes
  - Implémenter startBlinkingAnimation() avec vitesse adaptative
  - Ajouter les classes CSS d'urgence (high, medium, low)
  - Créer les styles avec animations de clignotement
  - _Requirements: 5.10, 13.5_

- [ ] 26. Implémenter DailyRegularityBlock (Structure)
  - Créer le fichier DailyRegularityBlock.js
  - Implémenter le template avec flamme et streak
  - Créer les computed (currentStreak, bestStreak, regularityStatus, flameClass)
  - Ajouter l'affichage de la comparaison actuelle vs record
  - _Requirements: 6.6_

- [ ] 27. Implémenter DailyRegularityBlock (Flamme Animée)
  - Implémenter startFlameAnimation() avec scale aléatoire
  - Créer les classes de flamme (dead, small, medium, large, epic)
  - Ajouter animateFlame() pour boost sur nouveau record
  - Créer les styles avec animations
  - _Requirements: 6.6, 13.5_

- [ ] 28. Implémenter DailyRegularityBlock (Historique)
  - Créer l'affichage des 7 derniers jours avec grille
  - Implémenter le tri des jours (Lun-Dim)
  - Ajouter les classes (completed, today, pending)
  - Créer les styles pour la grille 7 colonnes
  - _Requirements: 6.6_

- [ ] 29. Implémenter DailyRegularityBlock (Logique)
  - Implémenter maintainRegularity() et onRegularityMaintained()
  - Créer celebrateNewRecord() avec confettis
  - Ajouter initAccurateCountdown() pour compte à rebours
  - Implémenter le watch sur currentStreak pour animation
  - _Requirements: 6.6, 16.7_

- [ ] 30. Implémenter MonthlyBudgetBlock
  - Créer le fichier MonthlyBudgetBlock.js
  - Implémenter le template avec dépenses vs budget
  - Créer les computed pour calculs budgétaires
  - Ajouter les barres de progression par catégorie
  - Créer le CSS associé
  - _Requirements: 6.7_

- [ ] 31. Implémenter MainBookProgressBlock
  - Créer le fichier MainBookProgressBlock.js
  - Implémenter le template avec livre en cours
  - Ajouter la barre de progression (pages, pourcentage)
  - Créer les styles avec effet de glow
  - _Requirements: 6.8_

- [ ] 32. Implémenter StockPortfolioBlock
  - Créer le fichier StockPortfolioBlock.js
  - Implémenter le template avec performances des actions
  - Ajouter les variations avec couleurs (positif/négatif)
  - Créer les styles avec animations
  - _Requirements: 6.9_

---

## Phase 5: Blocs de Priorité Modérée (Ligne 5)

- [ ] 33. Implémenter WeeklyProgressBlock
  - Créer le fichier WeeklyProgressBlock.js
  - Implémenter le template avec graphique de la semaine
  - Ajouter les métriques quotidiennes
  - Créer les styles avec Chart.js
  - _Requirements: 7.1, 7.6_

- [ ] 34. Implémenter TodayPerformanceBlock
  - Créer le fichier TodayPerformanceBlock.js
  - Implémenter le template avec radar de performance
  - Ajouter les métriques multi-critères
  - Créer les styles avec Chart.js
  - _Requirements: 7.2, 7.7_

- [ ] 35. Implémenter ReadingRhythmBlock
  - Créer le fichier ReadingRhythmBlock.js
  - Implémenter le template avec tendances de lecture
  - Ajouter les graphiques de rythme
  - Créer les styles avec animations
  - _Requirements: 7.3, 7.8_

- [ ] 36. Implémenter SurveillanceBlock
  - Créer le fichier SurveillanceBlock.js
  - Implémenter le template avec alertes boursières
  - Ajouter les opportunités d'arbitrage
  - Créer les styles avec effets néon
  - _Requirements: 7.4, 7.9_

---

## Phase 6: Blocs de Priorité Basse (Lignes 8-11)

- [ ] 37. Implémenter SmartProgressionBlock
  - Créer le fichier SmartProgressionBlock.js
  - Implémenter les suggestions basées sur l'historique
  - Ajouter les styles
  - _Requirements: 8.1, 8.6_

- [ ] 38. Implémenter QuickStatsBlock
  - Créer le fichier QuickStatsBlock.js
  - Implémenter les métriques clés agrégées
  - Ajouter les styles
  - _Requirements: 8.2, 8.7_

- [ ] 39. Implémenter ReadingPerformanceBlock
  - Créer le fichier ReadingPerformanceBlock.js
  - Implémenter les analyses détaillées de lecture
  - Ajouter les styles
  - _Requirements: 8.3, 8.8_

- [ ] 40. Implémenter SalaryAllocationBlock
  - Créer le fichier SalaryAllocationBlock.js
  - Implémenter la répartition du salaire en temps réel
  - Ajouter les styles
  - _Requirements: 8.4, 8.9_

- [ ] 41. Implémenter SportComparisonsBlock
  - Créer le fichier SportComparisonsBlock.js
  - Implémenter les comparaisons de performances
  - Ajouter les styles
  - _Requirements: 9.1, 9.4_

- [ ] 42. Implémenter ReadingComparisonsBlock
  - Créer le fichier ReadingComparisonsBlock.js
  - Implémenter les comparaisons temporelles
  - Ajouter les styles
  - _Requirements: 9.2, 9.5_

- [ ] 43. Implémenter ProjectionMatrixBlock
  - Créer le fichier ProjectionMatrixBlock.js
  - Implémenter les graphiques de projection
  - Ajouter les styles (span 2 colonnes)
  - _Requirements: 9.3, 9.6_

- [ ] 44. Implémenter ExpressQuestBlock
  - Créer le fichier ExpressQuestBlock.js
  - Implémenter la création rapide de quêtes
  - Ajouter les styles
  - _Requirements: 10.1, 10.6_

- [ ] 45. Implémenter TheoryRealityBlock
  - Créer le fichier TheoryRealityBlock.js
  - Implémenter la comparaison objectifs vs réalisés
  - Ajouter les styles
  - _Requirements: 10.2, 10.7_

- [ ] 46. Implémenter LeisurePlanningBlock
  - Créer le fichier LeisurePlanningBlock.js
  - Implémenter les activités de loisirs planifiées
  - Ajouter les styles
  - _Requirements: 10.3, 10.8_

- [ ] 47. Implémenter UpcomingDeadlinesBlock
  - Créer le fichier UpcomingDeadlinesBlock.js
  - Implémenter la liste des échéances
  - Ajouter les styles
  - _Requirements: 10.4, 10.9_

- [ ] 48. Implémenter NewsBlock
  - Créer le fichier NewsBlock.js
  - Implémenter les actualités financières filtrées
  - Ajouter le filtrage par catégorie
  - Créer les styles (span 4 colonnes)
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

---

## Phase 7: Persistance et Gestion des Données

- [ ] 49. Implémenter le système de localStorage
  - Créer les fonctions de sauvegarde (saveToLocalStorage)
  - Implémenter les fonctions de chargement (loadFromLocalStorage)
  - Ajouter la validation des données chargées
  - Créer les fonctions de migration de données
  - _Requirements: 14.5, 14.6, 14.7, 14.8_

- [ ] 50. Créer le système de mock data
  - Créer le fichier ModularDashboardMockData.js
  - Implémenter toutes les structures de données
  - Ajouter les données de test réalistes
  - Créer les fonctions de génération de données
  - _Requirements: 14.8_

- [ ] 51. Implémenter la synchronisation des données
  - Créer le système d'événements globaux
  - Implémenter la propagation des mises à jour
  - Ajouter la gestion des conflits
  - Créer les fonctions de merge de données
  - _Requirements: 14.1, 14.2, 14.3, 14.4_

---

## Phase 8: Responsive et Accessibilité

- [ ] 52. Implémenter le responsive design
  - Créer les breakpoints (1920px, 1280px, 768px)
  - Adapter la grille pour chaque taille d'écran
  - Ajuster les spans de colonnes
  - Tester sur différentes résolutions
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ] 53. Ajouter l'accessibilité
  - Implémenter les attributs ARIA sur tous les éléments interactifs
  - Ajouter la navigation au clavier (tab, enter)
  - Créer les alternatives textuelles pour les graphiques
  - Vérifier les contrastes de couleurs (4.5:1 minimum)
  - Ajouter les indicateurs de focus visibles
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7_

---

## Phase 9: Performance et Optimisation

- [ ] 54. Optimiser le chargement
  - Implémenter le lazy loading pour les images
  - Ajouter le debouncing pour les mises à jour
  - Optimiser les animations avec CSS transforms
  - Réduire la fréquence des mises à jour en arrière-plan
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.6_

- [ ] 55. Optimiser les graphiques
  - Choisir Canvas ou SVG selon la complexité
  - Implémenter le throttling pour les re-renders
  - Ajouter la destruction des instances Chart.js
  - _Requirements: 17.5_

- [ ] 56. Gérer la mémoire
  - Implémenter le déchargement des blocs non visibles
  - Ajouter le nettoyage des intervalles et écouteurs
  - Créer les hooks beforeDestroy pour chaque composant
  - _Requirements: 17.7_

---

## Phase 10: Tests et Validation

- [ ] 57. Créer les tests unitaires
  - Configurer Vitest ou Jest
  - Créer les tests pour les computed properties
  - Ajouter les tests pour les methods
  - Tester les validations et formatages
  - _Requirements: Testing Strategy_

- [ ] 58. Créer les tests de propriétés
  - Configurer fast-check
  - Implémenter les tests de chargement progressif
  - Ajouter les tests de synchronisation
  - Tester les validations d'entrées
  - Tester les formatages de durées
  - _Requirements: Property 1, 2, 3, 4_

- [ ] 59. Créer les tests d'intégration
  - Configurer Cypress ou Playwright
  - Créer les tests de chargement complet
  - Tester la completion de quêtes
  - Tester l'enregistrement de sessions
  - Tester le démarrage de timers
  - _Requirements: Testing Strategy_

- [ ] 60. Tests de performance
  - Mesurer le temps de chargement (<2s)
  - Vérifier l'utilisation mémoire
  - Tester les animations (60fps)
  - Valider le responsive
  - _Requirements: 17.1, 17.2_

---

## Phase 11: Documentation et Finalisation

- [ ] 61. Créer la documentation utilisateur
  - Rédiger le guide d'utilisation
  - Créer les captures d'écran
  - Documenter les raccourcis clavier
  - Ajouter les FAQ
  - _Requirements: 20.6_

- [ ] 62. Créer la documentation développeur
  - Documenter l'architecture
  - Créer les guides d'ajout de blocs
  - Documenter les conventions de code
  - Ajouter les exemples d'utilisation
  - _Requirements: 20.1, 20.2, 20.3, 20.6, 20.7_

- [ ] 63. Validation finale
  - Vérifier tous les critères d'acceptation
  - Tester sur différents navigateurs
  - Valider l'accessibilité (WCAG 2.1)
  - Vérifier la performance
  - Tester le responsive
  - _Requirements: All_

- [ ] 64. Checkpoint final
  - Ensure all tests pass, ask the user if questions arise.

