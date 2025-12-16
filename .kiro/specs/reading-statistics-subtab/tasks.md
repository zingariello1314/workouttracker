# Implementation Plan - Sous-onglet Statistiques de Lecture

## Vue d'ensemble

Ce plan d'implémentation transforme le design en tâches concrètes pour créer un sous-onglet statistiques complet dans l'onglet Livres. L'approche suit une progression incrémentale : fondations → graphiques de base → fonctionnalités avancées → optimisations.

## Structure des Tâches

- [ ] 1. Mise en place de l'infrastructure de base
  - Créer la structure des composants et services
  - Configurer les hooks et utilitaires de données
  - Mettre en place le système de navigation par sous-onglets
  - _Requirements: 1.1, 10.3_

- [ ] 1.1 Créer la structure des composants StatisticsSubTab
  - Implémenter le composant principal StatisticsSubTab avec navigation par onglets
  - Créer les composants containers (ChartsContainer, MetricsPanel)
  - Configurer le système de filtres temporels (TimeFilters)
  - _Requirements: 1.1, 1.2_

- [ ] 1.2 Développer les services de données de base
  - Implémenter SessionAggregator pour l'agrégation des sessions de lecture
  - Créer MetricsCalculator avec les calculs de base (vitesse, temps total, pages)
  - Développer les utilitaires de transformation de données pour les graphiques
  - _Requirements: 2.4, 3.1, 7.1_

- [ ]* 1.3 Écrire les tests unitaires pour les services de données
  - Tests unitaires pour SessionAggregator avec différents jeux de données
  - Tests unitaires pour MetricsCalculator avec validation des formules
  - Tests des utilitaires de transformation de données
  - _Requirements: 2.4, 3.1, 7.1_

- [ ] 2. Implémentation des graphiques principaux
  - Développer les graphiques de base avec Recharts
  - Intégrer l'interactivité (hover, click, zoom)
  - Connecter les graphiques aux données filtrées
  - _Requirements: 2.1, 2.3, 4.1_

- [ ] 2.1 Créer le graphique Pages par Jour (PagesPerDayChart)
  - Implémenter le graphique en ligne avec Recharts
  - Ajouter les tooltips détaillés avec contexte (date, pages, livres)
  - Configurer l'interactivité (click pour voir détails du jour)
  - _Requirements: 2.1, 2.3, 2.5_

- [ ]* 2.2 Écrire les tests property-based pour l'agrégation quotidienne
  - **Property 3: Data Aggregation Accuracy**
  - **Validates: Requirements 2.4**

- [ ] 2.3 Développer le graphique Vitesse de Lecture (ReadingSpeedChart)
  - Implémenter l'affichage de l'évolution de la vitesse dans le temps
  - Ajouter les filtres par genre avec mise à jour dynamique
  - Configurer les comparaisons avec objectifs utilisateur
  - _Requirements: 3.1, 3.3, 3.4, 3.5_

- [ ]* 2.4 Écrire les tests property-based pour les calculs de vitesse
  - **Property 4: Reading Speed Calculation**
  - **Validates: Requirements 3.1**

- [ ] 2.5 Implémenter le calendrier Heatmap (HeatmapCalendar)
  - Créer la grille 365 jours avec intensité colorée basée sur l'activité
  - Développer le calcul automatique des streaks de lecture
  - Ajouter la navigation entre années et tooltips détaillés
  - _Requirements: 4.1, 4.2, 4.4, 4.5_

- [ ]* 2.6 Écrire les tests property-based pour le calendrier heatmap
  - **Property 6: Heatmap Intensity Mapping**
  - **Validates: Requirements 4.1**
  - **Property 7: Streak Calculation Accuracy**
  - **Validates: Requirements 4.5**

- [ ] 3. Développement des analyses par genre et objectifs
  - Créer les graphiques de répartition et comparaison par genre
  - Implémenter le système de suivi des objectifs
  - Développer les barres de progression et célébrations
  - _Requirements: 5.1, 5.3, 6.1, 6.2_

- [ ] 3.1 Créer le graphique de répartition par genre (GenreDistributionChart)
  - Implémenter le graphique en secteurs avec pourcentages
  - Ajouter l'interactivité (click sur secteur pour filtrer)
  - Développer le graphique en barres comparatif des vitesses par genre
  - _Requirements: 5.1, 5.2, 5.3_

- [ ]* 3.2 Écrire les tests property-based pour la répartition par genre
  - **Property 8: Genre Distribution Accuracy**
  - **Validates: Requirements 5.1**
  - **Property 5: Genre Filtering Consistency**
  - **Validates: Requirements 5.2**

- [ ] 3.3 Implémenter le système de suivi des objectifs (GoalsProgressChart)
  - Créer l'interface de définition d'objectifs (quotidiens, hebdomadaires, mensuels)
  - Développer les barres de progression avec pourcentages en temps réel
  - Implémenter les célébrations visuelles lors d'atteinte d'objectifs
  - _Requirements: 6.1, 6.2, 6.3_

- [ ]* 3.4 Écrire les tests property-based pour les objectifs
  - **Property 9: Goal Progress Calculation**
  - **Validates: Requirements 6.2, 6.5**

- [ ] 4. Fonctionnalités avancées et intelligence
  - Développer le moteur de prédictions et recommandations
  - Implémenter l'analyse des patterns temporels
  - Créer le mode comparaison entre périodes
  - _Requirements: 8.1, 8.3, 9.1, 9.2_

- [ ] 4.1 Développer le moteur de prédictions (PredictionEngine)
  - Implémenter les calculs de temps estimé pour terminer les livres en cours
  - Créer l'algorithme de recommandations d'objectifs basé sur l'historique
  - Développer l'analyse des patterns (meilleurs créneaux, jours optimaux)
  - _Requirements: 8.1, 8.2, 8.3_

- [ ]* 4.2 Écrire les tests property-based pour les prédictions
  - **Property 11: Completion Time Prediction**
  - **Validates: Requirements 8.1**
  - **Property 12: Pattern Recognition Accuracy**
  - **Validates: Requirements 8.3**

- [ ] 4.3 Implémenter le mode comparaison entre périodes (ComparisonMode)
  - Créer l'interface de sélection de deux périodes à comparer
  - Développer les calculs de différences et pourcentages d'évolution
  - Implémenter l'affichage côte à côte avec couleurs distinctes
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ]* 4.4 Écrire les tests property-based pour les comparaisons
  - **Property 13: Period Comparison Calculation**
  - **Validates: Requirements 9.2**

- [ ] 5. Métriques avancées et analytics
  - Développer le panneau de métriques détaillées
  - Implémenter l'analyse des sessions et accomplissements
  - Créer les fonctionnalités d'export et partage
  - _Requirements: 7.2, 7.3, 7.5_

- [ ] 5.1 Créer le panneau de métriques avancées (MetricsPanel)
  - Implémenter l'affichage du temps total avec répartition par période
  - Développer l'analyse des sessions (durée moyenne, fréquence, répartition horaire)
  - Créer la section accomplissements avec livres terminés et dates
  - _Requirements: 7.1, 7.2, 7.3_

- [ ]* 5.2 Écrire les tests property-based pour les métriques temporelles
  - **Property 10: Time Aggregation Consistency**
  - **Validates: Requirements 7.1**

- [ ] 5.3 Développer les fonctionnalités d'export (ExportTools)
  - Implémenter l'export PDF avec graphiques et métriques
  - Créer l'export CSV des données brutes
  - Développer le partage de graphiques individuels (image/lien)
  - _Requirements: 7.5, 10.4_

- [ ]* 5.4 Écrire les tests property-based pour l'export
  - **Property 15: Export Data Integrity**
  - **Validates: Requirements 7.5**

- [ ] 6. Interface utilisateur et expérience
  - Optimiser l'interface pour la responsivité mobile
  - Implémenter la persistance des préférences utilisateur
  - Développer les animations et transitions fluides
  - _Requirements: 10.1, 10.2, 10.5_

- [ ] 6.1 Optimiser la responsivité mobile
  - Adapter tous les graphiques pour les petits écrans
  - Réorganiser la mise en page en mode mobile (stack vertical)
  - Optimiser les interactions tactiles (touch-friendly)
  - _Requirements: 10.1_

- [ ] 6.2 Implémenter la persistance des préférences
  - Créer le système de sauvegarde des filtres actifs
  - Développer la persistance des préférences d'affichage
  - Implémenter la sauvegarde des comparaisons favorites
  - _Requirements: 10.5, 9.5_

- [ ]* 6.3 Écrire les tests property-based pour la persistance
  - **Property 14: Filter State Persistence**
  - **Validates: Requirements 10.3, 10.5**

- [ ] 7. Intégration et optimisations finales
  - Intégrer le sous-onglet dans BooksTab existant
  - Optimiser les performances pour grandes datasets
  - Implémenter le cache intelligent et error handling
  - _Requirements: 1.1, 1.2_

- [ ] 7.1 Intégrer dans BooksTab existant
  - Modifier BooksTab pour ajouter la navigation par sous-onglets
  - Connecter StatisticsSubTab aux données books existantes
  - Tester l'intégration complète avec les événements sidebar
  - _Requirements: 1.1_

- [ ] 7.2 Optimiser les performances
  - Implémenter la virtualisation pour les grandes listes de données
  - Créer le cache intelligent avec invalidation automatique
  - Optimiser les recalculs avec debouncing et memoization
  - _Requirements: 1.2, 10.3_

- [ ] 7.3 Implémenter l'error handling complet
  - Créer les Error Boundaries pour chaque composant graphique
  - Développer les fallbacks pour données insuffisantes ou corrompues
  - Implémenter les messages d'erreur utilisateur-friendly
  - _Requirements: 1.5_

- [ ]* 7.4 Écrire les tests d'intégration complets
  - Tests d'intégration entre filtres et graphiques
  - Tests de navigation entre différentes vues
  - Tests de performance avec datasets importantes
  - _Requirements: 1.2, 10.3_

- [ ] 8. Checkpoint final - Validation et tests
  - Exécuter tous les tests unitaires et property-based
  - Valider l'intégration complète avec le système existant
  - Tester l'expérience utilisateur sur différents appareils
  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 8.1 Tests de régression visuelle
  - Tests de régression visuelle des graphiques avec Playwright
  - Tests d'accessibilité des visualisations
  - Tests de compatibilité cross-browser
  - _Requirements: 10.1, 10.2_

- [ ]* 8.2 Tests property-based pour la cohérence globale
  - **Property 1: Dashboard Display Consistency**
  - **Validates: Requirements 1.1**
  - **Property 2: Period Filter Consistency**
  - **Validates: Requirements 1.2, 2.2, 3.2**

## Notes d'Implémentation

### Ordre de Priorité
1. **Phase 1-2** : Infrastructure et graphiques de base (essentiels)
2. **Phase 3-4** : Analyses avancées et intelligence (valeur ajoutée)
3. **Phase 5-6** : Export et UX (finitions)
4. **Phase 7-8** : Intégration et optimisations (robustesse)

### Technologies Utilisées
- **Graphiques** : Recharts pour tous les composants visuels
- **Tests** : Vitest (unitaires) + Property-based testing (100+ itérations)
- **Performance** : React.memo, useMemo, debouncing
- **Persistance** : localStorage pour préférences, IndexedDB pour cache

### Dépendances Externes
- Recharts (déjà utilisé dans le projet)
- date-fns pour manipulation des dates
- jsPDF pour export PDF
- html2canvas pour capture de graphiques

Chaque tâche property-based est annotée avec le numéro de propriété du design document et la référence aux requirements validés.