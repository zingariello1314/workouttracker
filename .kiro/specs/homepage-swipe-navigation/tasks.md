# Implementation Plan - Navigation par Swipe HomePage

## Phase 1: Core Hook Implementation

- [x] 1. Créer le hook useSwipeNavigation





  - Créer le fichier `src/hooks/useSwipeNavigation.js`
  - Implémenter la détection des événements touch et mouse
  - Implémenter le calcul de distance et direction
  - Implémenter le calcul de velocity
  - Implémenter la validation du threshold
  - Ajouter les event listeners avec option passive
  - Gérer le cleanup des event listeners
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 2.1, 3.1, 6.1, 6.2, 6.3_

- [x] 1.1 Écrire les tests property-based pour la détection de swipe






  - **Property 1: Swipe direction validation**
  - **Validates: Requirements 1.2**

- [ ] 1.2 Écrire les tests property-based pour le threshold





  - **Property 2: Threshold enforcement**
  - **Validates: Requirements 1.3**

- [ ]* 1.3 Écrire les tests property-based pour la velocity
  - **Property 3: Velocity-based threshold reduction**
  - **Validates: Requirements 1.4**

- [ ]* 1.4 Écrire les tests unitaires pour le hook
  - Tester l'initialisation du hook
  - Tester le calcul de distance
  - Tester le calcul de velocity
  - Tester la classification de direction
  - Tester le cleanup des listeners
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 6.2_

## Phase 2: Visual Feedback Component

- [x] 2. Créer le composant SwipeIndicator





  - Créer le fichier `src/components/ui/SwipeIndicator.jsx`
  - Implémenter l'affichage de l'icône flèche
  - Implémenter l'animation de progression
  - Implémenter le changement de couleur selon validation
  - Implémenter l'animation de pulsation au threshold
  - Ajouter les transitions CSS fluides
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 2.1 Écrire les tests unitaires pour SwipeIndicator
  - Tester l'affichage selon progress
  - Tester le changement de couleur selon isValid
  - Tester la visibilité selon visible prop
  - Tester les animations CSS
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 3. Créer les styles CSS pour SwipeIndicator





  - Créer le fichier `src/styles/swipe-indicator.css`
  - Définir les animations de progression
  - Définir les transitions de couleur
  - Définir l'animation de pulsation
  - Optimiser pour performance GPU
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

## Phase 3: HomePage Integration

- [x] 4. Intégrer le swipe dans HomePage





  - Importer useSwipeNavigation dans HomePage.jsx
  - Importer SwipeIndicator dans HomePage.jsx
  - Configurer le hook avec callback vers setActiveTab('dashboard')
  - Ajouter SwipeIndicator au JSX avec les props appropriées
  - Ajouter data-swipe-ignore sur tous les boutons
  - Ajouter data-swipe-ignore sur le logo
  - Ajouter data-swipe-ignore sur le sélecteur de langue
  - Tester que les boutons fonctionnent toujours
  - _Requirements: 1.1, 1.5, 2.3, 3.3, 5.1, 5.2, 5.3, 5.4, 9.1, 9.4_

- [ ]* 4.1 Écrire les tests property-based pour l'exclusion d'éléments
  - **Property 4: Interactive element exclusion**
  - **Validates: Requirements 5.1, 5.2, 5.3**

- [ ]* 4.2 Écrire les tests property-based pour le cleanup
  - **Property 5: Event listener cleanup**
  - **Validates: Requirements 6.2**

- [ ]* 4.3 Écrire les tests property-based pour la navigation unique
  - **Property 6: Single navigation per swipe**
  - **Validates: Requirements 6.4**

- [ ]* 4.4 Écrire les tests d'intégration pour HomePage
  - Tester la navigation vers Dashboard
  - Tester que les boutons fonctionnent
  - Tester que le changement d'image fonctionne
  - Tester l'exclusion des éléments interactifs
  - _Requirements: 1.1, 5.1, 5.2, 5.3, 5.4, 5.5_

## Phase 4: Settings Integration

- [x] 5. Ajouter les paramètres de swipe dans SettingsTab





  - Ouvrir `src/components/tabs/SettingsTab.jsx`
  - Ajouter une nouvelle section "Navigation"
  - Ajouter un toggle "Activer swipe navigation"
  - Ajouter un slider pour ajuster le threshold (50-200px)
  - Implémenter la lecture depuis localStorage
  - Implémenter la sauvegarde dans localStorage
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 10.3_

- [x] 6. Créer le service de gestion des settings





  - Créer le fichier `src/services/swipeNavigationSettings.js`
  - Implémenter getSettings()
  - Implémenter saveSettings()
  - Implémenter les valeurs par défaut
  - Gérer les erreurs de localStorage
  - _Requirements: 8.4, 8.5_

- [ ]* 6.1 Écrire les tests property-based pour la persistance
  - **Property 7: Settings persistence**
  - **Validates: Requirements 8.4**

- [ ]* 6.2 Écrire les tests unitaires pour le service settings
  - Tester getSettings avec localStorage vide
  - Tester getSettings avec données existantes
  - Tester saveSettings
  - Tester les valeurs par défaut
  - Tester la gestion d'erreurs
  - _Requirements: 8.4, 8.5_

- [x] 7. Connecter les settings au hook useSwipeNavigation





  - Modifier HomePage pour lire les settings
  - Passer les settings au hook useSwipeNavigation
  - Tester que les changements de settings s'appliquent immédiatement
  - _Requirements: 8.2, 8.3, 8.5_

## Phase 5: Accessibility Features

- [x] 8. Ajouter le support clavier





  - Ajouter un event listener pour la touche 'D'
  - Naviguer vers Dashboard quand 'D' est pressé
  - Documenter le raccourci dans SettingsTab
  - Tester avec navigation clavier uniquement
  - _Requirements: 10.2_

- [x] 9. Ajouter le support lecteur d'écran












  - Ajouter une région aria-live pour annoncer la navigation
  - Ajouter un texte alternatif visible pour lecteur d'écran
  - Ajouter des labels ARIA sur tous les éléments interactifs
  - Tester avec NVDA/JAWS/VoiceOver
  - _Requirements: 10.1, 10.5_

- [ ]* 9.1 Écrire les tests d'accessibilité
  - Tester les attributs ARIA
  - Tester les annonces aria-live
  - Tester la navigation clavier
  - Tester les labels des éléments
  - _Requirements: 10.1, 10.2, 10.5_

## Phase 6: Cross-Browser Compatibility

- [ ] 10. Implémenter la détection de features
  - Ajouter la détection de Touch Events
  - Ajouter la détection de Pointer Events
  - Ajouter la détection de Mouse Events
  - Implémenter la stratégie de fallback
  - _Requirements: 7.1, 7.4, 7.5_

- [ ] 11. Gérer les comportements spécifiques iOS
  - Prévenir le pull-to-refresh natif pendant le swipe
  - Ajouter les meta tags appropriés
  - Tester sur Safari iOS
  - _Requirements: 7.2_

- [ ] 12. Gérer les comportements spécifiques Android
  - Tester sur Chrome Android
  - Vérifier l'absence de conflits avec gestes système
  - Ajuster si nécessaire
  - _Requirements: 7.3_

- [ ]* 12.1 Écrire les tests de compatibilité
  - Tester la détection de features
  - Tester le fallback Mouse Events
  - Tester le fallback Touch Events
  - Tester le fallback Pointer Events
  - _Requirements: 7.1, 7.4, 7.5_

## Phase 7: Performance Optimization

- [ ] 13. Optimiser les event listeners
  - Vérifier que tous les listeners sont passifs
  - Implémenter requestAnimationFrame pour throttling
  - Mesurer la fréquence des événements
  - Optimiser si > 100 événements/sec
  - _Requirements: 6.1, 6.3_

- [ ] 14. Optimiser les re-renders
  - Utiliser useMemo pour calculs coûteux
  - Utiliser useCallback pour event handlers
  - Vérifier avec React DevTools Profiler
  - Optimiser si nécessaire
  - _Requirements: 6.1, 6.3_

- [ ]* 14.1 Écrire les tests de performance
  - Tester le temps de traitement des événements (< 16ms)
  - Tester le temps de navigation (< 100ms)
  - Tester l'absence de fuites mémoire
  - Tester avec swipes rapides multiples
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

## Phase 8: Documentation & Polish

- [ ] 15. Créer la documentation utilisateur
  - Documenter le swipe dans un guide utilisateur
  - Ajouter des captures d'écran/GIFs
  - Documenter les paramètres disponibles
  - Documenter le raccourci clavier
  - _Requirements: 10.2, 10.4_

- [ ] 16. Créer la documentation développeur
  - Documenter l'API du hook useSwipeNavigation
  - Documenter l'API du composant SwipeIndicator
  - Ajouter des exemples d'utilisation
  - Documenter les propriétés de correction
  - _Requirements: All_

- [ ] 17. Checkpoint final - Vérifier que tout fonctionne
  - Tester sur tous les navigateurs supportés
  - Tester sur mobile (iOS et Android)
  - Tester avec lecteur d'écran
  - Tester avec navigation clavier
  - Tester les performances
  - Vérifier que tous les tests passent
  - Demander à l'utilisateur si des questions se posent

## Notes d'implémentation

### Ordre d'exécution recommandé
1. Phase 1 (Core Hook) - Fondation technique
2. Phase 2 (Visual Feedback) - Feedback utilisateur
3. Phase 3 (HomePage Integration) - Intégration principale
4. Phase 4 (Settings) - Personnalisation
5. Phase 5 (Accessibility) - Inclusivité
6. Phase 6 (Cross-Browser) - Compatibilité
7. Phase 7 (Performance) - Optimisation
8. Phase 8 (Documentation) - Finalisation

### Dépendances entre phases
- Phase 3 dépend de Phase 1 et 2
- Phase 4 peut être faite en parallèle de Phase 5
- Phase 7 doit être faite après Phase 3
- Phase 8 doit être faite en dernier

### Tests optionnels
Les tâches marquées avec `*` sont optionnelles mais fortement recommandées pour garantir la qualité et la robustesse du code.
