# Implementation Plan - Smart Shopping Phases 6-7

## Phase 6 : Workflow Complet

- [ ] 1. Créer WorkflowManager - Orchestrateur des 3 phases
  - Créer `src/components/finance/smartShopping/WorkflowManager.jsx`
  - Implémenter state machine pour transitions phases (planning → execution → analytics)
  - Gérer sauvegarde/restauration contexte entre phases
  - Intégrer avec composants existants (ExecutionMode, AnalyticsPerformance)
  - _Requirements: 1.1, 1.3, 1.4_

- [ ]* 1.1 Écrire test de propriété pour WorkflowManager
  - **Property 1: Workflow Phase Progression**
  - **Validates: Requirements 1.1, 1.3, 1.4**

- [ ] 2. Créer PlanningPhase - Interface planification intelligente
  - Créer `src/components/finance/smartShopping/PlanningPhase.jsx`
  - Implémenter sélection template avec pré-remplissage
  - Ajouter liste builder avec prix estimés et auto-complétion
  - Créer budget summary avec alertes visuelles
  - Intégrer panel optimizations du BudgetOptimizer
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [ ] 3. Créer BudgetOptimizer - Moteur suggestions économies
  - Créer `src/components/finance/smartShopping/BudgetOptimizer.jsx`
  - Implémenter algorithme détection substitutions avec profil marques
  - Implémenter algorithme détection promos pertinentes avec faisabilité
  - Implémenter algorithme optimisation magasin avec comparaison prix
  - Créer interface affichage suggestions avec actions
  - _Requirements: 2.3, 2.4, 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 3.1 Écrire test de propriété pour BudgetOptimizer
  - **Property 3: Optimization Validity**
  - **Validates: Requirements 2.3, 2.4, 6.1, 6.5**

- [ ] 4. Améliorer ExecutionMode existant pour workflow
  - Modifier `src/components/finance/smartShopping/ExecutionMode.jsx`
  - Ajouter capture prix réels avec validation
  - Améliorer monitoring budget temps réel
  - Ajouter alertes dépassement budget
  - Intégrer avec WorkflowManager pour transition vers analytics
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ]* 4.1 Écrire test de propriété pour budget consistency
  - **Property 2: Budget Consistency**
  - **Validates: Requirements 3.2, 3.4**

- [ ] 5. Créer AnalyticsPhase - Wrapper analytics avec learning
  - Créer `src/components/finance/smartShopping/AnalyticsPhase.jsx`
  - Wrapper composant AnalyticsPerformance existant
  - Ajouter calcul écarts estimé vs réel
  - Implémenter pattern learning automatique
  - Ajouter mise à jour profil utilisateur et prix estimés
  - Créer interface insights et recommandations
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 5.1 Écrire test de propriété pour analytics accuracy
  - **Property 5: Analytics Accuracy**
  - **Validates: Requirements 4.1, 4.2**

- [ ] 6. Intégrer workflow dans SmartShoppingTab
  - Modifier `src/components/finance/smartShopping/SmartShoppingTab.jsx`
  - Ajouter section "Workflow" dans navigation
  - Intégrer WorkflowManager avec gestion état
  - Ajouter boutons démarrage workflow depuis autres sections
  - _Requirements: 1.1_

## Phase 7 : Interface Révolutionnaire

- [ ] 7. Créer ModesAdaptatifs - Système 4 modes contextuels
  - Créer `src/components/finance/smartShopping/ModesAdaptatifs.jsx`
  - Implémenter mode Stratégie (dashboard complet)
  - Implémenter mode Tactique (planification liste)
  - Implémenter mode Exécution (interface épurée)
  - Implémenter mode Analysis (analytics détaillées)
  - Créer système transitions fluides avec animations
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 7.1 Écrire test de propriété pour mode transitions
  - **Property 4: Mode Transition Preservation**
  - **Validates: Requirements 5.5**

- [ ] 8. Créer système sauvegarde/restauration contexte
  - Modifier `src/services/finance/smartShoppingStorage.js`
  - Ajouter méthodes saveContext/loadContext pour chaque mode
  - Implémenter cache contexte en mémoire
  - Ajouter invalidation cache intelligente
  - _Requirements: 5.5, 8.1, 8.2, 8.4, 8.5_

- [ ]* 8.1 Écrire test de propriété pour persistence
  - **Property 7: Persistence Reliability**
  - **Validates: Requirements 8.1, 8.2, 8.4**

- [ ] 9. Créer SettingsManager - Paramètres utilisateur
  - Créer `src/components/finance/smartShopping/SettingsManager.jsx`
  - Implémenter interface paramètres (magasins, seuils, notifications)
  - Ajouter sauvegarde paramètres dans IndexedDB
  - Intégrer paramètres dans tous les composants concernés
  - _Requirements: 6.2, 7.1_

- [ ] 10. Optimiser performances interface
  - Ajouter memoization pour calculs coûteux (optimizations, analytics)
  - Implémenter debouncing pour sauvegardes automatiques
  - Utiliser GPU animations (transform, opacity) pour transitions
  - Ajouter code splitting pour composants lourds (lazy loading)
  - Optimiser IndexedDB avec transactions batch
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 10.1 Écrire test de propriété pour performance bounds
  - **Property 6: Performance Bounds**
  - **Validates: Requirements 7.1, 7.2, 7.3**

- [ ] 11. Améliorer esthétique globale Smart Shopping
  - Appliquer style premium Synthèse à tous les composants
  - Ajouter gradients animés et effets hover
  - Créer animations transitions entre modes
  - Améliorer feedback visuel (loading, success, error)
  - Assurer cohérence design avec reste de l'onglet Finance
  - _Requirements: 5.5, 7.4_

- [ ] 12. Ajouter accessibilité complète
  - Ajouter aria-labels sur tous les boutons et contrôles
  - Implémenter navigation clavier complète
  - Ajouter shortcuts clavier pour actions fréquentes
  - Créer annonces screen reader pour changements état
  - Tester avec lecteur d'écran
  - _Requirements: 7.4_

- [ ] 13. Checkpoint final - Validation complète
  - Tester workflow complet end-to-end
  - Vérifier tous les modes adaptatifs
  - Valider performances (< 100ms interactions, < 300ms transitions)
  - Tester persistence et restauration
  - Vérifier accessibilité
  - Ensure all tests pass, ask the user if questions arise.

## Notes d'implémentation

### Priorités
1. **Phase 6 (tâches 1-6)**: Workflow complet fonctionnel - ESSENTIEL
2. **Phase 7 (tâches 7-9)**: Modes adaptatifs - IMPORTANT
3. **Optimisations (tâches 10-12)**: Performance et UX - QUALITÉ
4. **Validation (tâche 13)**: Tests finaux - PRODUCTION

### Dépendances
- Tâche 2 dépend de tâche 3 (PlanningPhase utilise BudgetOptimizer)
- Tâche 6 dépend de tâches 1-5 (intégration workflow)
- Tâche 7 dépend de tâche 1 (ModesAdaptatifs utilise WorkflowManager)
- Tâche 10 doit être faite après tâches 1-9 (optimisation code existant)

### Composants existants à réutiliser
- `ListesManager.jsx`: Utiliser pour templates et création listes
- `ExecutionMode.jsx`: Wrapper dans ExecutionPhase
- `AnalyticsPerformance.jsx`: Wrapper dans AnalyticsPhase
- `InventaireManager.jsx`: Intégrer dans BudgetOptimizer pour faisabilité promos
- `SmartShoppingErrorBoundary.jsx`: Wrapper tous les nouveaux composants

### Style et esthétique
- S'inspirer de `src/components/finance/synthese/SyntheseTab.jsx` pour:
  - Gradients animés (purple/blue)
  - Effets hover (scale, shadows)
  - Transitions GPU (transform, opacity)
  - Layout responsive
  - Feedback visuel premium
