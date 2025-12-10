# Task List - Sidebar Interactive & Cohérente

## Phase 1: Fondations 🏗️

- [x] 1. Étendre useNavigation avec paramètres contextuels



  - Ajouter méthode `navigateWithParams(path, params)`
  - Ajouter support pour query parameters
  - Ajouter support pour scroll automatique
  - Ajouter validation des destinations
  - _Requirements: 2.1, 2.2, 2.3, 12.1, 12.2_

- [x] 2. Créer système d'events pour synchronisation
  - Créer `src/utils/sidebarEvents.js`
  - Implémenter `SidebarEventEmitter` class
  - Définir constantes `SIDEBAR_EVENTS`
  - Créer hook `useSidebarEvents`
  - _Requirements: 10.1, 10.2, 10.3_

- [x] 3. Créer QuickActionsContext
  - Créer `src/context/QuickActionsContext.jsx`
  - Implémenter `startPomodoroSession`
  - Implémenter `stopPomodoroSession`
  - Ajouter state pour timer actif
  - _Requirements: 7.1_

- [x] 4. Ajouter styles CSS pour éléments cliquables
  - Ajouter classe `.clickable` avec hover effects
  - Ajouter `.sidebar-data-hint` pour tooltips
  - Ajouter flèche indicatrice `::after`
  - Ajouter animation `navigate-pulse`
  - Ajouter styles responsive
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

## Phase 2: Extension de useSidebarData 📊

- [x] 5. Ajouter données Nutrition





  - Importer `useNutritionData`
  - Charger données du jour
  - Calculer calories, protéines, glucides, lipides
  - Calculer compliance
  - _Requirements: 1.1, 1.2_

- [x] 6. Ajouter données "Aujourd'hui"





  - Calculer quêtes complétées/total
  - Vérifier entraînement du jour
  - Compter pages lues
  - Compter repas loggés
  - _Requirements: 1.1, 1.2_

- [x] 7. Intégrer système d'events





  - Écouter `QUEST_COMPLETED`
  - Écouter `WORKOUT_ADDED`
  - Écouter `PAGES_READ`
  - Écouter `MEAL_LOGGED`
  - Rafraîchir données automatiquement
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

## Phase 3: Refactoriser Sections Existantes 🔄

- [x] 8. Refactoriser ProgressionGlobaleSection (ex-Métriques Vitales)





  - Renommer composant
  - Rendre toutes les cartes cliquables
  - Ajouter navigation vers Quêtes > Progression
  - Ajouter navigation vers Quêtes > Niveau
  - Ajouter navigation vers Quêtes > Stats > Calendrier
  - Ajouter navigation vers Quêtes > Stats > Focus
  - Ajouter tooltips
  - _Requirements: 2.9, 2.10, 9.1, 9.2_

- [x] 9. Refactoriser QuestesJourSection (ex-Quêtes Actives)





  - Renommer composant
  - Rendre chaque quête cliquable
  - Ajouter navigation vers détail avec scroll
  - Ajouter badge "Complétée"
  - Rendre badge compteur cliquable
  - Ajouter tooltips
  - _Requirements: 2.8, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 9.1, 9.2_

- [x] 10. Refactoriser ActivitePhysiqueSection (ex-Sport & Santé)





  - Renommer composant
  - Rendre carte "Entraînements" cliquable → Sport > Historique
  - Rendre carte "Calories" cliquable → Garmin > Métriques > Calories
  - Rendre carte "Pas" cliquable → Garmin > Métriques > Pas
  - Rendre carte "BPM" cliquable → Garmin > Fréquence Cardiaque
  - Rendre indicateur Garmin cliquable → Garmin > Paramètres
  - Ajouter tooltips
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 9.1, 9.2_

- [x] 11. Refactoriser LectureSection (ex-Livres)





  - Renommer composant
  - Rendre carte "En cours" cliquable → Livres (filtre: en cours)
  - Rendre carte "Pages" cliquable → Livres > Stats (aujourd'hui)
  - Rendre carte "Temps" cliquable → Livres > Stats > Sessions
  - Rendre carte "Objectif" cliquable → Livres > Paramètres
  - Rendre barre de progression cliquable → Livres > Stats > Progression
  - Ajouter tooltips
  - _Requirements: 2.6, 2.7, 5.1, 5.2, 5.3, 5.4, 5.5, 9.1, 9.2_

- [x] 12. Refactoriser FinancesSection





  - Rendre carte "Patrimoine" cliquable → Finance > Synthèse > Patrimoine
  - Rendre carte "Investissements" cliquable → Finance > Synthèse > Investissements
  - Rendre carte "Budget" cliquable → Finance > Planificateur > Répartition
  - Rendre carte "Épargne" cliquable → Finance > Planificateur > Épargne
  - Rendre taux d'épargne cliquable → Finance > Synthèse > Comparaison
  - Ajouter tooltips
  - _Requirements: 2.5, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 9.1, 9.2_

## Phase 4: Créer Nouvelles Sections ✨

- [x] 13. Créer ActionsRapidesSection





  - Créer `src/components/sidebar/ActionsRapidesSection.jsx`
  - Implémenter grille 2x2 boutons principaux
  - Bouton "Focus" → Démarrer Pomodoro + Navigation
  - Bouton "Lire" → Livres > Modal ajout pages
  - Bouton "Sport" → Sport > Modal nouvelle séance
  - Bouton "Quêtes" → Quêtes (filtre: aujourd'hui)
  - Implémenter ligne 1x4 boutons secondaires
  - Bouton "+Revenu" → Finance > Planificateur > Ajout revenu
  - Bouton "+Dépense" → Finance > Planificateur > Ajout dépense
  - Bouton "+Repas" → Nutrition > Ajout repas
  - Bouton "Réglages" → Paramètres
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

- [x] 14. Créer AujourdhuiSection





  - Créer `src/components/sidebar/AujourdhuiSection.jsx`
  - Carte "Quêtes" → Quêtes (filtre: aujourd'hui)
  - Carte "Sport" → Sport > Aujourd'hui
  - Carte "Lecture" → Livres > Stats (aujourd'hui)
  - Carte "Nutrition" → Nutrition (aujourd'hui)
  - Toutes les cartes cliquables
  - Ajouter tooltips
  - _Requirements: 1.1, 1.2, 9.1, 9.2_

- [x] 15. Créer NutritionSection





  - Créer `src/components/sidebar/NutritionSection.jsx`
  - Carte "Calories" → Nutrition (aujourd'hui)
  - Carte "Protéines" → Nutrition > Macros
  - Carte "Glucides" → Nutrition > Macros
  - Carte "Lipides" → Nutrition > Macros
  - Afficher compliance avec barre de progression
  - Rendre compliance cliquable → Nutrition > Stats
  - Toutes les cartes cliquables
  - Ajouter tooltips
  - _Requirements: 1.1, 1.2, 9.1, 9.2_

## Phase 5: Nettoyage 🧹

- [x] 16. Supprimer sections fantômes





  - Supprimer LearningSection (Apprentissage)
  - Supprimer JournalSection (Journal & Films)
  - Supprimer FocusSessionSection (Session Focus)
  - Supprimer AchievementsSection (Achievements)
  - Supprimer FocusRPGSection (Focus RPG)
  - Supprimer DailyGoalsSection (Objectifs du Jour)
  - Supprimer NotificationsSection (Notifications)
  - Supprimer WeatherSection (Météo)
  - Supprimer MotivationSection (Motivation)
  - Supprimer RewardsSection (Récompenses)
  - Supprimer HistorySection (Historique)
  - Supprimer QuickSettingsSection (Paramètres Rapides)
  - Supprimer AIPredictionsSection (Prédictions IA)
  - Supprimer GlobalStatsSection (Statistiques Globales)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 17. Nettoyer SidebarPremium.jsx





  - Retirer imports des sections supprimées
  - Retirer sectionProps des sections supprimées
  - Réorganiser ordre des sections
  - Vérifier que toutes les nouvelles sections sont importées
  - _Requirements: 8.1, 8.2, 11.1, 11.2, 11.3_

- [x] 18. Mettre à jour useSidebarData





  - Retirer code lié aux sections supprimées
  - Vérifier que nutrition et today sont exportés
  - Optimiser les calculs
  - _Requirements: 1.1, 1.2, 8.1_

## Phase 6: Tests 🧪

- [x] 19. Tests de navigation





  - Créer `src/components/sidebar/__tests__/SidebarNavigation.test.jsx`
  - Tester navigation Sport > Historique
  - Tester navigation Garmin > Métriques
  - Tester navigation Quêtes > Détail
  - Tester navigation Livres > Stats
  - Tester navigation Finance > Synthèse
  - Tester navigation Nutrition
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10, 12.3_

- [x] 20. Tests de cohérence des données





  - Créer `src/components/sidebar/__tests__/SidebarDataConsistency.test.jsx`
  - Tester compteur d'entraînements
  - Tester calcul de streak
  - Tester calcul de focus
  - Tester compteur de quêtes
  - Tester données nutrition
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 21. Tests d'accessibilité





  - Vérifier tous les aria-label
  - Vérifier tous les role
  - Vérifier navigation clavier
  - Vérifier tooltips
  - Tester avec screen reader
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

## Phase 7: Polish 💎

- [x] 22. Animations et transitions





  - Ajouter animation de navigation
  - Ajouter animation de hover
  - Ajouter animation de chargement
  - Optimiser performances
  - _Requirements: 9.4_

- [x] 23. Responsive final





  - Tester sur mobile
  - Tester sur tablet
  - Tester sur desktop
  - Ajuster breakpoints si nécessaire
  - _Requirements: 1.1, 1.2_

- [ ] 24. Documentation
  - Documenter nouvelles méthodes useNavigation
  - Documenter sidebarEvents
  - Documenter QuickActionsContext
  - Créer guide d'utilisation
  - _Requirements: 12.1, 12.2_

## Checkpoint Final ✅

- [x] 25. Vérification complète





  - Tous les modules sont fonctionnels
  - Toutes les données sont cliquables
  - Tous les liens fonctionnent
  - Tous les tooltips sont présents
  - Synchronisation temps réel fonctionne
  - Tests passent
  - Accessibilité validée
  - Responsive validé
  - _Requirements: Tous_
