# Implementation Plan - Refonte Allocation Salaire Liquid Glass

## Vue d'ensemble

Ce plan d'implémentation transforme le bloc "Allocation Salaire" en un composant moderne avec esthétique liquid glass, en suivant les patterns établis dans LearningStatusBlock et SurveillanceBlock.

---

## Phase 1: Préparation et Structure CSS

- [x] 1. Créer le fichier CSS dédié


  - Créer `src/styles/salary-allocation-block.css`
  - Importer la police Orbitron depuis Google Fonts
  - Définir les variables CSS pour la palette emerald
  - Définir les variables pour les opacités glassmorphism
  - Définir les variables pour les espacements et transitions
  - _Requirements: 1.1, 1.2, 1.3, 9.1, 9.2_



- [ ] 2. Définir les styles du container principal
  - Implémenter `.salary-allocation-card` avec backdrop-blur-2xl
  - Ajouter les bordures subtiles (border-white/10)
  - Implémenter l'effet de glow avec `.card-glow`
  - Ajouter les transitions hover (transform, border-color, shadow)
  - Implémenter les box-shadows multi-couches
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.7_

---



## Phase 2: Header Modernisé

- [ ] 3. Implémenter le header glassmorphism
  - Créer la structure JSX du header avec flexbox
  - Implémenter `.icon-container` avec backdrop-blur-xl

  - Styliser l'icône DollarSign avec drop-shadow et color emerald
  - Implémenter `.card-title` avec gradient emerald et Orbitron
  - Implémenter `.card-subtitle` avec opacité 0.6
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [ ] 4. Implémenter le badge salaire
  - Créer `.salary-badge` avec backdrop-blur-xl
  - Implémenter le label avec text-xs et uppercase
  - Implémenter la valeur avec Orbitron et text-shadow
  - Ajouter les effets hover (scale, glow, border-color)
  - Implémenter les transitions fluides (500ms)


  - _Requirements: 2.4, 2.6, 2.7_

---

## Phase 3: Section Allocation

- [ ] 5. Implémenter la grille d'allocation
  - Créer `.allocation-section` avec grid 2 colonnes
  - Ajouter le background rgba(0,0,0,0.2) et border subtle
  - Intégrer le composant AllocationChart existant
  - Implémenter le responsive (1 colonne sur mobile)
  - _Requirements: 3.1, 3.8, 7.1_

- [ ] 6. Implémenter les barres de catégories
  - Créer `.category-bar` avec backdrop-blur-xl
  - Implémenter `.category-dot` avec box-shadow coloré
  - Styliser `.category-name` avec font-weight 600
  - Implémenter `.category-amount` avec Orbitron
  - Implémenter `.category-percent` avec opacité 0.6
  - Ajouter les effets hover (translateX, border-color, shadow)
  - _Requirements: 3.3, 3.4, 3.5, 3.6_

- [ ] 6.1 Écrire les tests unitaires pour les catégories
  - Tester le calcul des pourcentages


  - Tester l'affichage des montants formatés
  - Tester les couleurs par catégorie
  - _Requirements: 3.3, 3.4_

---

## Phase 4: Section Recommandations

- [ ] 7. Implémenter le header de section
  - Créer `.section-header` avec icône TrendingUp
  - Styliser `.section-title` avec font-weight 700
  - Appliquer la couleur emerald à l'icône
  - _Requirements: 4.1_

- [ ] 8. Implémenter les cartes de recommandations
  - Créer `.recommendation-card` avec backdrop-blur-xl
  - Implémenter les variantes `.optimal` et `.improve`
  - Créer `.rec-header` avec flexbox space-between
  - Implémenter `.rec-badge` avec styles conditionnels
  - Créer `.rec-details` avec flexbox et gap
  - Implémenter `.rec-stat` pour actuel/recommandé
  - Implémenter `.rec-diff` pour l'écart
  - Ajouter les effets hover (translateY, shadow)
  - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

- [ ] 8.1 Écrire le test de propriété pour les recommandations
  - **Property 6: Recommendation Accuracy**


  - **Validates: Requirements 4.3, 4.4**
  - Générer des allocations aléatoires
  - Vérifier que status = 'optimal' si current >= recommended


  - Vérifier que status = 'improve' si current < recommended
  - _Requirements: 4.3, 4.4_

---

## Phase 5: Boutons d'Action

- [ ] 9. Implémenter la grille d'actions
  - Créer `.actions-section` avec grid 2 colonnes
  - Implémenter le responsive (1 colonne sur mobile)
  - _Requirements: 5.1, 7.1_

- [ ] 10. Implémenter le bouton Optimiser
  - Créer `.action-btn.primary` avec gradient emerald
  - Implémenter backdrop-blur-2xl
  - Ajouter l'icône Sparkles avec transition
  - Implémenter les effets hover (scale, glow, translateY)
  - Ajouter l'effet ripple avec pseudo-élément ::before
  - Implémenter l'animation de l'icône au hover
  - Connecter l'événement onClick avec onUpdate('optimize')
  - _Requirements: 5.2, 5.4, 5.5, 5.7_

- [ ] 11. Implémenter le bouton Personnaliser
  - Créer `.action-btn.secondary` avec glassmorphism neutre
  - Implémenter backdrop-blur-2xl
  - Ajouter l'icône Settings avec transition
  - Implémenter les effets hover (scale, shadow, translateY)
  - Ajouter l'effet ripple avec pseudo-élément ::before
  - Implémenter l'animation de l'icône au hover
  - Connecter l'événement onClick avec onUpdate('custom')
  - _Requirements: 5.3, 5.4, 5.6, 5.7_

- [ ] 11.1 Écrire le test de propriété pour les événements
  - **Property 10: Event Emission Correctness**
  - **Validates: Requirements 5.5, 5.6**
  - Simuler des clics sur les boutons
  - Vérifier que onUpdate est appelé avec 'optimize' ou 'custom'
  - Vérifier que les événements ne sont pas émis si onUpdate est undefined
  - _Requirements: 5.5, 5.6_

---

## Phase 6: Animations et Transitions

- [ ] 12. Implémenter les animations CSS
  - Créer l'animation @keyframes ripple
  - Créer l'animation @keyframes pulse-glow
  - Implémenter les transitions sur tous les éléments interactifs
  - Utiliser cubic-bezier(0.4, 0, 0.2, 1) pour l'easing
  - Définir duration-500 (500ms) pour toutes les transitions
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 13. Optimiser les performances GPU
  - Ajouter `will-change: transform` sur les éléments animés
  - Utiliser `transform: translateZ(0)` pour forcer GPU
  - Éviter d'animer box-shadow directement (utiliser pseudo-éléments)
  - Limiter les backdrop-blur imbriqués
  - _Requirements: 6.7_

- [ ] 13.1 Écrire le test de propriété pour les transitions
  - **Property 4: Transition Smoothness**
  - **Validates: Requirements 1.5, 6.2, 6.5**
  - Vérifier que tous les éléments interactifs ont transition-duration: 500ms
  - Vérifier que l'easing est cubic-bezier(0.4, 0, 0.2, 1)
  - _Requirements: 1.5, 6.2, 6.5_

---

## Phase 7: État de Chargement

- [ ] 14. Implémenter le skeleton glassmorphism
  - Créer le composant LoadingSkeleton
  - Appliquer le même style glassmorphism que le contenu
  - Implémenter l'animation pulse
  - Maintenir la structure du layout (header, sections, actions)
  - Afficher le message "Chargement de l'allocation..."
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ] 15. Implémenter la transition de chargement
  - Ajouter une transition fade-in quand les données arrivent
  - Utiliser opacity et transform pour l'animation
  - Durée de 500ms avec easing smooth
  - _Requirements: 8.7_

---

## Phase 8: Responsive Design

- [ ] 16. Implémenter les breakpoints
  - Ajouter @media (max-width: 1024px) pour tablette
  - Ajouter @media (max-width: 768px) pour mobile
  - Ajouter @media (max-width: 480px) pour petit mobile
  - Adapter la grille allocation (2 cols → 1 col)
  - Adapter la grille actions (2 cols → 1 col)
  - Adapter le header (row → column sur petit mobile)
  - Réduire les paddings et font-sizes sur mobile
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 16.1 Écrire le test de propriété pour le responsive
  - **Property 7: Responsive Layout Adaptation**
  - **Validates: Requirements 7.1, 7.2**
  - Simuler différentes largeurs d'écran
  - Vérifier que la grille passe à 1 colonne sous 768px
  - Vérifier que les font-sizes s'adaptent
  - _Requirements: 7.1, 7.2_

---

## Phase 9: Accessibilité

- [ ] 17. Implémenter la navigation clavier
  - Ajouter tabIndex sur les éléments interactifs
  - Implémenter les styles :focus-visible
  - Ajouter les gestionnaires onKeyDown pour Enter/Space
  - Tester la navigation complète au clavier
  - _Requirements: 7.5_

- [ ] 18. Implémenter les labels ARIA
  - Ajouter aria-label sur le container principal
  - Ajouter role="button" sur les éléments cliquables
  - Ajouter aria-describedby pour les descriptions
  - Ajouter aria-live pour les mises à jour dynamiques
  - _Requirements: 7.6_

- [ ] 18.1 Écrire le test de propriété pour les contrastes
  - **Property 8: Accessibility Contrast**
  - **Validates: Requirements 7.4**
  - Calculer les ratios de contraste pour tous les textes
  - Vérifier ratio >= 4.5:1 pour texte normal
  - Vérifier ratio >= 3:1 pour texte large
  - _Requirements: 7.4_

---

## Phase 10: Intégration et Tests

- [ ] 19. Intégrer le CSS dans le composant
  - Importer `../../styles/salary-allocation-block.css`
  - Remplacer les classes Tailwind par les classes CSS custom
  - Vérifier que tous les styles sont appliqués
  - Tester les effets hover et transitions
  - _Requirements: 9.1, 9.3, 9.4, 9.5, 9.6_

- [ ] 20. Implémenter la validation des données
  - Créer la fonction validateAllocation
  - Vérifier que la somme des allocations = salaire
  - Logger un warning si validation échoue
  - Afficher le skeleton si données invalides
  - _Requirements: 3.3_

- [ ] 20.1 Écrire le test de propriété pour la validation
  - **Property 5: Allocation Sum Validation**
  - **Validates: Requirements 3.3**
  - Générer des salaires aléatoires
  - Générer des allocations aléatoires qui somment au salaire
  - Vérifier que validateAllocation retourne true
  - Générer des allocations invalides et vérifier false
  - _Requirements: 3.3_

- [ ] 21. Écrire les tests unitaires
  - Tester le rendu avec données valides
  - Tester le rendu en état de chargement
  - Tester le calcul des recommandations
  - Tester les callbacks onClick
  - Tester le formatage des montants
  - _Requirements: 2.1, 3.1, 4.1, 5.1_

- [ ] 22. Écrire les tests de propriétés restants
  - **Property 1: Glassmorphism Consistency** - Vérifier backdrop-blur et opacités
  - **Property 2: Hover State Enhancement** - Vérifier scale et glow au hover
  - **Property 3: Color Consistency** - Vérifier couleur emerald partout
  - **Property 9: Loading State Preservation** - Vérifier structure skeleton
  - _Requirements: 1.1, 1.4, 2.5, 8.3_

---

## Phase 11: Checkpoint Final

- [ ] 23. Checkpoint - Vérification complète
  - Vérifier que tous les styles liquid glass sont appliqués
  - Vérifier que toutes les animations fonctionnent
  - Vérifier le responsive sur tous les breakpoints
  - Vérifier l'accessibilité (clavier, ARIA, contrastes)
  - Vérifier les performances (60fps, pas de jank)
  - Tester avec différentes données (salaires variés, allocations diverses)
  - Vérifier la cohérence avec LearningStatusBlock et SurveillanceBlock
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes d'Implémentation

### Ordre d'Exécution
1. Commencer par la structure CSS (Phase 1)
2. Implémenter les composants visuels (Phases 2-5)
3. Ajouter les animations (Phase 6)
4. Implémenter les états spéciaux (Phase 7)
5. Finaliser responsive et accessibilité (Phases 8-9)
6. Intégrer et tester (Phases 10-11)

### Dépendances
- Lucide React pour les icônes (DollarSign, TrendingUp, Sparkles, Settings)
- AllocationChart (composant existant à réutiliser)
- Google Fonts (Orbitron)

### Références
- `src/components/dashboard/LearningStatusBlock.jsx` - Pattern de référence
- `src/styles/learning-status-block.css` - Styles de référence
- `src/components/dashboard/SurveillanceBlock.jsx` - Autre exemple modernisé

### Testing Framework
- Jest + React Testing Library pour les tests unitaires
- fast-check pour les property-based tests
- Minimum 100 itérations par property test

### Performance Targets
- 60fps pour toutes les animations
- < 100ms pour les transitions hover
- Backdrop-blur limité à 2 niveaux d'imbrication maximum
- GPU acceleration pour tous les transforms

### Accessibilité Targets
- WCAG AA compliance
- Contraste minimum 4.5:1 pour texte normal
- Contraste minimum 3:1 pour texte large
- Navigation clavier complète
- Labels ARIA appropriés
