# Implementation Plan - Synchronisation des Données Sidebar

## Phase 1: Core Statistics Hook

- [x] 1. Créer le hook useBooksStatistics





  - Créer le fichier `src/hooks/useBooksStatistics.js`
  - Implémenter le calcul de currentBooks (livres avec status 'in-progress')
  - Implémenter le calcul de todayPages (somme des pages lues aujourd'hui)
  - Implémenter le calcul de todayMinutes (somme des minutes lues aujourd'hui)
  - Récupérer dailyGoal depuis localStorage ou utiliser 30 par défaut
  - Retourner la structure { currentBooks, todayPages, todayMinutes, dailyGoal, hasData }
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 5.1_

- [ ]* 1.1 Écrire les property tests pour useBooksStatistics
  - **Property 1: Current books count accuracy**
  - **Validates: Requirements 1.1**

- [ ]* 1.2 Écrire les property tests pour les calculs du jour
  - **Property 2: Today's pages calculation**
  - **Property 3: Today's minutes calculation**
  - **Validates: Requirements 1.2, 1.3**

- [x] 2. Intégrer useBooksStatistics dans useSidebarData





  - Importer useBooksStatistics dans `src/hooks/useSidebarData.js`
  - Remplacer le chargement depuis localStorage par l'appel à useBooksStatistics
  - Passer les books depuis useBooksStorage au hook
  - Mettre à jour la section learning avec les données calculées
  - Supprimer l'ancien code de chargement depuis localStorage.getItem('booksData')
  - _Requirements: 2.5, 5.1_

- [ ]* 2.1 Écrire les tests d'intégration pour useSidebarData
  - Tester que les données de lecture sont correctement agrégées
  - Tester que hasData est true quand des livres existent
  - Tester que hasData est false quand aucun livre n'existe
  - _Requirements: 5.1, 7.1_

## Phase 2: Event System & Synchronization

- [x] 3. Ajouter l'émission d'événements dans BooksTab





  - Importer emitSidebarEvent depuis `src/utils/sidebarEvents.js`
  - Émettre BOOK_ADDED après l'ajout d'un livre
  - Émettre BOOK_UPDATED après la modification d'un livre
  - Émettre BOOK_DELETED après la suppression d'un livre
  - Émettre PAGES_READ après l'ajout d'une session de lecture
  - _Requirements: 2.1, 2.2, 2.3, 4.1, 4.2_

- [ ]* 3.1 Écrire les property tests pour les événements
  - **Property 4: Statistics update on book addition**
  - **Property 5: Statistics update on session addition**
  - **Property 6: Statistics update on status change**
  - **Property 7: Event emission on data change**
  - **Validates: Requirements 2.1, 2.2, 2.3, 4.1, 4.2**

- [x] 4. Implémenter le debouncing des rafraîchissements





  - Créer un hook useDebounce si nécessaire
  - Wrapper les fonctions de rafraîchissement avec debounce (500ms)
  - Tester que plusieurs événements rapides ne déclenchent qu'un seul refresh
  - _Requirements: 4.5, 6.2_

- [ ]* 4.1 Écrire les property tests pour le debouncing
  - **Property 8: Debounced refresh**
  - **Validates: Requirements 4.5**


- [x] 5. Checkpoint - Vérifier la synchronisation



  - Ensure all tests pass, ask the user if questions arise.

## Phase 3: Other Modules Verification

- [x] 6. Vérifier et corriger le module Sport





  - Analyser le code de ActivitePhysiqueSection
  - Vérifier que weeklyWorkouts compte correctement les séances de la semaine
  - Vérifier que les données Garmin sont correctement chargées
  - Corriger les incohérences trouvées
  - Émettre les événements appropriés (WORKOUT_ADDED, etc.)
  - _Requirements: 3.1, 3.5_

- [ ]* 6.1 Écrire les tests pour le module Sport
  - Tester le comptage des séances hebdomadaires
  - Tester l'intégration avec les données Garmin
  - Tester l'émission des événements
  - _Requirements: 3.1, 3.5_

- [x] 7. Vérifier et corriger le module Nutrition





  - Analyser le code de NutritionSection
  - Vérifier que mealsLogged compte correctement les repas du jour
  - Vérifier que les totaux nutritionnels sont corrects
  - Corriger les incohérences trouvées
  - Émettre les événements appropriés (MEAL_LOGGED, etc.)
  - _Requirements: 3.2, 3.5_

- [ ]* 7.1 Écrire les tests pour le module Nutrition
  - Tester le comptage des repas du jour
  - Tester les calculs des totaux nutritionnels
  - Tester l'émission des événements
  - _Requirements: 3.2, 3.5_

- [x] 8. Vérifier et corriger le module Quêtes





  - Analyser le code de QuestesJourSection
  - Vérifier que questsCompleted compte correctement les quêtes terminées
  - Vérifier que questsTotal compte toutes les quêtes du jour
  - Corriger les incohérences trouvées
  - Émettre les événements appropriés (QUEST_COMPLETED, etc.)
  - _Requirements: 3.3, 3.5_

- [ ]* 8.1 Écrire les tests pour le module Quêtes
  - Tester le comptage des quêtes complétées
  - Tester le comptage des quêtes totales
  - Tester l'émission des événements
  - _Requirements: 3.3, 3.5_

- [x] 9. Vérifier et corriger le module Finances





  - Analyser le code de FinancesSection
  - Vérifier que netWorth est correctement calculé
  - Vérifier que les données du planificateur sont correctes
  - Corriger les incohérences trouvées
  - Émettre les événements appropriés (FINANCE_UPDATED)
  - _Requirements: 3.4, 3.5_

- [ ]* 9.1 Écrire les tests pour le module Finances
  - Tester le calcul du patrimoine net
  - Tester l'intégration avec le planificateur
  - Tester l'émission des événements
  - _Requirements: 3.4, 3.5_

- [x] 10. Checkpoint - Vérifier tous les modules





  - Ensure all tests pass, ask the user if questions arise.

## Phase 4: Error Handling & Optimization

- [x] 11. Implémenter la gestion des erreurs




  - Wrapper tous les calculs dans try-catch
  - Retourner des valeurs par défaut sûres en cas d'erreur
  - Logger les erreurs dans la console pour débogage
  - Créer SidebarSectionErrorBoundary pour les composants
  - Tester les scénarios d'erreur (IndexedDB unavailable, localStorage full, etc.)
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 11.1 Écrire les tests de gestion d'erreurs
  - **Property 9: Default values on missing data**
  - **Validates: Requirements 7.1, 7.4**

- [x] 12. Optimiser les performances





  - Ajouter useMemo pour les calculs coûteux
  - Ajouter useCallback pour les fonctions passées en props
  - Implémenter le lazy loading des couvertures par batch
  - Vérifier que le debouncing fonctionne correctement
  - Mesurer les performances (calculs < 50ms, refresh < 100ms)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 12.1 Écrire les tests de performance
  - Tester que les calculs prennent moins de 50ms
  - Tester que le refresh prend moins de 100ms
  - Tester que le chargement initial prend moins de 500ms
  - _Requirements: 6.1, 6.2, 6.3_

- [ ]* 12.2 Écrire les property tests pour le cache
  - **Property 10: Cache invalidation**
  - **Validates: Requirements 6.5**

- [x] 13. Checkpoint Final - Validation complète





  - Ensure all tests pass, ask the user if questions arise.

## Phase 5: Documentation & Cleanup

- [ ] 14. Documenter le système
  - Ajouter des commentaires JSDoc dans useBooksStatistics
  - Ajouter des commentaires JSDoc dans useSidebarData
  - Documenter les événements sidebar disponibles
  - Créer un guide d'utilisation pour les développeurs
  - Mettre à jour le README si nécessaire
  - _Requirements: 4.1, 5.1_

- [ ] 15. Nettoyer le code legacy
  - Supprimer l'ancien code de chargement depuis localStorage.getItem('booksData')
  - Supprimer les fonctions inutilisées
  - Nettoyer les imports inutiles
  - Vérifier qu'aucun code mort ne reste
  - _Requirements: N/A (cleanup)_

- [ ] 16. Migration des données utilisateur
  - Créer un script de migration si nécessaire
  - Nettoyer les anciens caches localStorage
  - Vérifier que les données utilisateur sont préservées
  - Tester la migration sur différents profils utilisateur
  - _Requirements: 7.5_

- [ ] 17. Tests end-to-end
  - Tester le flux complet: ajouter un livre → voir la sidebar se mettre à jour
  - Tester le flux complet: ajouter une session → voir les stats se mettre à jour
  - Tester le flux complet: changer le statut d'un livre → voir currentBooks changer
  - Tester sur différents navigateurs (Chrome, Firefox, Safari)
  - Tester sur mobile et desktop
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 18. Checkpoint Final - Livraison
  - Ensure all tests pass, ask the user if questions arise.
