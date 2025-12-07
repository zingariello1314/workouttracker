# Implementation Plan - Projection Matrix Block Refonte

## Phase 1: Structure et Fondations

- [x] 1. Créer la structure CSS de base


  - Créer le fichier `src/styles/projection-matrix-block.css`
  - Définir les variables CSS pour les couleurs, espacements et animations
  - Implémenter les classes de base pour le layout grid
  - Ajouter les effets de glow et bordures lumineuses
  - _Requirements: 7.1, 7.2, 7.3_



- [ ] 2. Créer le composant principal ProjectionMatrixBlock
  - Créer le fichier `src/components/dashboard/ProjectionMatrixBlockRefonte.jsx`
  - Définir l'interface des props et le state initial
  - Implémenter la structure JSX de base avec les 6 lignes principales
  - Ajouter les effets visuels (glow, bordures, neural status)
  - _Requirements: 1.1, 7.1, 7.2, 7.3_

- [ ]* 2.1 Écrire les tests unitaires pour le composant principal
  - Tester le rendu initial avec données valides
  - Tester le rendu avec données manquantes
  - Tester l'état de chargement
  - _Requirements: 1.1, 10.5_


## Phase 2: Statistiques et Simulateur

- [ ] 3. Implémenter les cartes de statistiques principales
  - Créer le composant `StatCards` pour les 4 stats (Niveau, XP, Quêtes, Efficacité)
  - Implémenter le formatage des valeurs (k pour milliers)

  - Ajouter les animations de transition
  - Intégrer dans la première ligne du layout
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 4. Créer le simulateur temps réel
  - Créer le composant `RealTimeSimulator`
  - Implémenter les compteurs de quêtes cliquables (journalières 0-5, hebdomadaires 0-3)
  - Ajouter la logique de cycle des compteurs
  - Afficher les stats calculées (XP/jour, jours jusqu'au prochain niveau)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_


- [ ]* 4.1 Écrire le test de propriété pour le cycle des compteurs
  - **Property 5: Quest counter cycling**
  - **Validates: Requirements 2.1, 2.2**

- [ ] 5. Implémenter le système de calcul des projections
  - Créer le hook `useProjectionCalculations`
  - Implémenter la formule XP/jour: (daily × 50) + (weekly × 150 / 7)
  - Implémenter le calcul des jours jusqu'au prochain niveau
  - Implémenter le calcul de l'efficacité (plafonné à 100%)
  - Ajouter useEffect pour recalcul automatique
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ]* 5.1 Écrire le test de propriété pour les calculs de projection
  - **Property 1: Projection calculation consistency**

  - **Validates: Requirements 9.1**

- [ ]* 5.2 Écrire le test de propriété pour l'efficacité
  - **Property 3: Efficiency bounds**
  - **Validates: Requirements 9.4**

- [ ] 6. Créer le panneau de contrôle IA
  - Créer le composant `AIControlPanel`


  - Implémenter les 3 boutons de mode (Sécurisé, Optimiste, Extrême)
  - Ajouter la logique de sélection et mise en évidence
  - Intégrer dans la troisième ligne du layout
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

## Phase 3: Graphiques Canvas

- [ ] 7. Créer le graphique d'évolution XP
  - Créer le composant `XPEvolutionChart`
  - Implémenter le hook `useCanvasChart` pour la gestion Canvas
  - Dessiner la grille de fond avec lignes horizontales et verticales
  - Dessiner les axes X et Y avec labels (-20j, -15j, -10j, -5j, Auj.)
  - Dessiner la courbe XP avec points de données
  - Mettre en évidence le point du jour actuel


  - Afficher les métriques (moyenne, max, min, aujourd'hui)
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [ ]* 7.1 Écrire les tests unitaires pour le graphique XP
  - Tester le rendu du canvas
  - Tester le dessin avec données valides
  - Tester le nettoyage au démontage
  - _Requirements: 4.1, 8.5_

- [ ] 8. Créer le graphique de répartition des activités
  - Créer le composant `ActivitiesBarChart`
  - Implémenter le dessin des barres verticales (6 activités)
  - Utiliser des couleurs distinctes par type d'activité



  - Afficher les valeurs sur les barres
  - Ajouter l'axe Y avec échelle (0-30)
  - Afficher les statistiques détaillées en bas
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ]* 8.1 Écrire les tests unitaires pour le graphique d'activités
  - Tester le rendu avec différents types d'activités
  - Tester le mapping des couleurs
  - Tester les calculs de hauteur des barres
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 9. Créer la matrice d'activité (heatmap)
  - Créer le composant `ActivityHeatmap`
  - Générer les données d'activité pour 20 semaines × 7 jours
  - Implémenter le système de niveaux d'intensité (0-4)
  - Dessiner la grille avec cellules colorées
  - Ajouter les labels des jours et numéros de semaine
  - Implémenter les tooltips au survol
  - Afficher la légende et les métriques
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [ ]* 9.1 Écrire le test de propriété pour le mapping d'intensité
  - **Property 4: Activity intensity levels**
  - **Validates: Requirements 6.2**

- [ ] 10. Optimiser les performances Canvas
  - Implémenter le debouncing pour les redessins
  - Utiliser requestAnimationFrame pour les animations
  - Ajouter la mémorisation des calculs coûteux
  - Implémenter le nettoyage des ressources Canvas
  - _Requirements: 8.4, 8.5_

- [ ]* 10.1 Écrire le test de propriété pour le nettoyage Canvas
  - **Property 6: Canvas cleanup**
  - **Validates: Requirements 8.5**

## Phase 4: Responsive et Animations

- [ ] 11. Implémenter le design responsive
  - Ajouter les media queries pour mobile (<768px)
  - Ajouter les media queries pour tablette (768-1024px)
  - Ajouter les media queries pour desktop (>1024px)
  - Adapter la taille des graphiques selon l'écran
  - Tester sur différentes résolutions
  - _Requirements: 8.1, 8.2, 8.3_

- [ ]* 11.1 Écrire le test de propriété pour l'adaptation responsive
  - **Property 7: Responsive layout adaptation**
  - **Validates: Requirements 8.1, 8.2, 8.3**

- [ ] 12. Ajouter les animations et transitions
  - Implémenter l'animation des bordures lumineuses (keyframe borderGlow)
  - Ajouter l'animation du point neural status (pulse)
  - Implémenter les transitions sur les changements de valeurs
  - Ajouter les effets hover sur les boutons
  - Optimiser les performances des animations
  - _Requirements: 7.4, 7.5_

- [ ] 13. Implémenter les effets visuels avancés
  - Ajouter le gradient de glow d'arrière-plan
  - Implémenter les bordures lumineuses top et bottom
  - Ajouter les effets de shimmer sur les cartes
  - Optimiser les performances des effets
  - _Requirements: 7.1, 7.2, 7.6_

## Phase 5: Accessibilité et Finitions

- [ ] 14. Améliorer l'accessibilité
  - Ajouter les labels ARIA sur tous les boutons interactifs
  - Implémenter la navigation au clavier
  - Vérifier les contrastes de couleurs (WCAG AA)
  - Ajouter les tooltips explicatifs
  - Tester avec un lecteur d'écran
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 15. Gérer les états d'erreur et de chargement
  - Créer le composant `LoadingState`
  - Créer le composant `ErrorState`
  - Implémenter la validation des données
  - Ajouter les fallbacks pour les erreurs Canvas
  - Tester les cas limites
  - _Requirements: 10.5_

- [ ] 16. Intégration et tests finaux
  - Intégrer le nouveau composant dans DashboardTab
  - Connecter aux données réelles du hook useDashboard
  - Tester le flux complet utilisateur
  - Vérifier les performances en production
  - Corriger les bugs identifiés
  - _Requirements: All_

- [ ]* 16.1 Écrire les tests d'intégration
  - Tester le flux complet: ajuster quêtes → voir projections
  - Tester le changement de mode IA
  - Tester les interactions avec les graphiques
  - _Requirements: All_

## Phase 6: Documentation et Optimisation

- [ ] 17. Documenter le code
  - Ajouter les JSDoc sur tous les composants
  - Documenter les hooks personnalisés
  - Créer un README pour le composant
  - Ajouter des exemples d'utilisation
  - _Requirements: All_

- [ ] 18. Optimisations finales
  - Analyser les performances avec React DevTools
  - Optimiser les re-renders inutiles
  - Réduire la taille du bundle
  - Implémenter le lazy loading si nécessaire
  - _Requirements: 8.4_

- [ ] 19. Tests de régression visuelle
  - Capturer les screenshots de référence
  - Configurer les tests de régression visuelle
  - Valider sur différents navigateurs
  - _Requirements: All_

- [ ] 20. Checkpoint final - Validation complète
  - Vérifier que tous les requirements sont satisfaits
  - Tester sur tous les appareils cibles
  - Valider les performances
  - Obtenir l'approbation utilisateur
  - _Requirements: All_
