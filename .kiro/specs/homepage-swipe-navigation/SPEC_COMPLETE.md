# Spec Complète - Navigation par Swipe HomePage

## ✅ Statut: Spec Validée et Prête pour Implémentation

Date de création: 7 décembre 2024
Statut: Approuvée par l'utilisateur

## Vue d'ensemble

Cette spec définit l'implémentation d'une fonctionnalité de navigation gestuelle permettant à l'utilisateur de swiper vers le bas sur la HomePage pour accéder directement au Dashboard.

## Documents de la Spec

### 1. Requirements (requirements.md)
- ✅ 10 exigences détaillées
- ✅ 50 critères d'acceptation
- ✅ Couvre tous les aspects: détection, feedback, performance, accessibilité, compatibilité

### 2. Design (design.md)
- ✅ Architecture complète avec 4 composants principaux
- ✅ 7 propriétés de correction testables
- ✅ Stratégie de testing (unit + property-based avec fast-check)
- ✅ Gestion des erreurs et performance
- ✅ Support accessibilité et cross-browser

### 3. Tasks (tasks.md)
- ✅ 17 tâches organisées en 8 phases
- ✅ Tests marqués comme optionnels (MVP rapide)
- ✅ Ordre d'exécution recommandé
- ✅ Dépendances entre phases documentées

## Fonctionnalités Principales

### 1. Détection de Swipe
- Swipe vers le bas avec threshold de 100px
- Velocity adaptative (threshold réduit à 50px si velocity > 0.5)
- Support touch (mobile) et mouse (desktop)
- Exclusion des éléments interactifs (boutons, logo, etc.)

### 2. Feedback Visuel
- Indicateur de progression pendant le swipe
- Changement de couleur quand threshold atteint
- Animation de pulsation à la validation
- Transitions fluides

### 3. Paramètres Utilisateur
- Toggle pour activer/désactiver le swipe
- Slider pour ajuster le threshold (50-200px)
- Persistance dans localStorage
- Application immédiate des changements

### 4. Accessibilité
- Raccourci clavier: touche 'D' pour Dashboard
- Support lecteur d'écran avec aria-live
- Threshold ajustable pour utilisateurs avec difficultés motrices
- Maintien de toutes les méthodes de navigation traditionnelles

### 5. Performance
- Event listeners passifs
- Throttling avec requestAnimationFrame (60 FPS)
- Debouncing de la navigation
- Optimisation mémoire avec cleanup

### 6. Compatibilité
- Chrome, Firefox, Safari, Edge (versions récentes)
- iOS et Android
- Fallback automatique (Pointer → Touch → Mouse Events)
- Prévention du pull-to-refresh iOS

## Architecture Technique

### Composants

1. **useSwipeNavigation Hook** (`src/hooks/useSwipeNavigation.js`)
   - Détection et validation des gestes
   - Calcul de distance, direction, velocity
   - Gestion des event listeners

2. **SwipeIndicator Component** (`src/components/ui/SwipeIndicator.jsx`)
   - Feedback visuel pendant le swipe
   - Animations de progression et validation

3. **HomePage Integration** (`src/components/HomePage.jsx`)
   - Intégration du hook et du composant
   - Configuration du callback de navigation
   - Exclusion des éléments interactifs

4. **Settings Integration** (`src/components/tabs/SettingsTab.jsx`)
   - UI pour activer/désactiver le swipe
   - UI pour ajuster le threshold
   - Persistance des préférences

### Services

1. **swipeNavigationSettings.js** (`src/services/swipeNavigationSettings.js`)
   - Lecture/écriture dans localStorage
   - Gestion des valeurs par défaut
   - Gestion des erreurs

## Propriétés de Correction

1. **Swipe direction validation** - Validation de la direction du swipe
2. **Threshold enforcement** - Application stricte du threshold
3. **Velocity-based threshold reduction** - Réduction adaptative du threshold
4. **Interactive element exclusion** - Exclusion des éléments interactifs
5. **Event listener cleanup** - Nettoyage des listeners
6. **Single navigation per swipe** - Une seule navigation par geste
7. **Settings persistence** - Persistance des paramètres

## Plan d'Implémentation

### Phase 1: Core Hook (Tâches 1-1.4)
Créer le hook useSwipeNavigation avec détection de base

### Phase 2: Visual Feedback (Tâches 2-3)
Créer le composant SwipeIndicator avec animations

### Phase 3: HomePage Integration (Tâches 4-4.4)
Intégrer le swipe dans HomePage avec exclusion des boutons

### Phase 4: Settings Integration (Tâches 5-7)
Ajouter les paramètres dans SettingsTab avec persistance

### Phase 5: Accessibility (Tâches 8-9.1)
Ajouter support clavier et lecteur d'écran

### Phase 6: Cross-Browser (Tâches 10-12.1)
Gérer la compatibilité navigateurs et plateformes

### Phase 7: Performance (Tâches 13-14.1)
Optimiser les performances et la mémoire

### Phase 8: Documentation (Tâches 15-17)
Créer la documentation et finaliser

## Prochaines Étapes

Pour commencer l'implémentation, ouvre le fichier `tasks.md` et clique sur "Start task" à côté de la première tâche :

```
- [ ] 1. Créer le hook useSwipeNavigation
```

Ou demande-moi de commencer l'implémentation en disant :
- "Commence la tâche 1"
- "Implémente le hook useSwipeNavigation"
- "Démarre l'implémentation"

## Notes Importantes

- Les tests sont marqués comme optionnels (*) pour un MVP rapide
- L'ordre des phases est recommandé mais peut être ajusté
- Chaque phase peut être testée indépendamment
- La fonctionnalité est additive (ne casse rien d'existant)

## Validation

- ✅ Requirements validés par l'utilisateur
- ✅ Design validé par l'utilisateur
- ✅ Tasks validés par l'utilisateur (tests optionnels)
- ✅ Prêt pour implémentation

---

**Créé le**: 7 décembre 2024  
**Statut**: Approuvé  
**Prochaine action**: Commencer Phase 1 - Core Hook
