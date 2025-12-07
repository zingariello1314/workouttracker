# Design Document - Navigation par Swipe HomePage

## Overview

Ce document décrit l'architecture technique pour implémenter une fonctionnalité de navigation par swipe sur la HomePage, permettant aux utilisateurs de naviguer vers le Dashboard en effectuant un geste de swipe vers le bas.

## Architecture

### Composants principaux

1. **useSwipeNavigation Hook** - Hook React personnalisé gérant la logique de détection de swipe
2. **SwipeIndicator Component** - Composant visuel affichant le feedback pendant le swipe
3. **HomePage Component** - Composant existant modifié pour intégrer le swipe
4. **Settings Storage** - Système de persistance pour les préférences utilisateur

### Flux de données

```
User Gesture (Touch/Mouse)
    ↓
Event Listeners (passive)
    ↓
useSwipeNavigation Hook
    ↓
Swipe Detection Logic
    ↓
Threshold Validation
    ↓
Navigation Trigger → setActiveTab('dashboard')
```

## Components and Interfaces

### 1. useSwipeNavigation Hook

**Responsabilité**: Gérer la détection et la validation des gestes de swipe

**Interface**:
```typescript
interface SwipeNavigationConfig {
  threshold: number;           // Distance minimale en pixels (défaut: 100)
  velocityThreshold: number;   // Velocity minimale pour swipe rapide (défaut: 0.5)
  enabled: boolean;            // Activer/désactiver la détection
  onSwipeDown: () => void;     // Callback appelé lors d'un swipe valide
}

interface SwipeState {
  isSwipping: boolean;         // Swipe en cours
  startY: number;              // Position Y de départ
  currentY: number;            // Position Y actuelle
  distance: number;            // Distance parcourue
  velocity: number;            // Vitesse du mouvement
  direction: 'up' | 'down' | 'none'; // Direction du swipe
}

function useSwipeNavigation(config: SwipeNavigationConfig): {
  swipeState: SwipeState;
  swipeProgress: number;       // Progression 0-1 pour l'indicateur visuel
  isSwipeValid: boolean;       // Le swipe atteindra-t-il le threshold ?
}
```

**Implémentation**:
- Utilise `useRef` pour stocker les positions de départ
- Utilise `useState` pour l'état du swipe
- Utilise `useEffect` pour attacher/détacher les event listeners
- Utilise `useCallback` pour optimiser les handlers
- Utilise `requestAnimationFrame` pour limiter les calculs à 60 FPS

### 2. SwipeIndicator Component

**Responsabilité**: Afficher un feedback visuel pendant le swipe

**Interface**:
```typescript
interface SwipeIndicatorProps {
  progress: number;            // 0-1, progression du swipe
  isValid: boolean;            // Le swipe est-il valide ?
  visible: boolean;            // Afficher/masquer l'indicateur
}
```

**Design visuel**:
- Icône flèche vers le bas (↓) au centre de l'écran
- Opacité progressive basée sur `progress`
- Changement de couleur quand `isValid` devient true
- Animation de pulsation quand threshold atteint
- Transition fluide avec `transform` et `opacity`

### 3. HomePage Integration

**Modifications**:
- Import du hook `useSwipeNavigation`
- Import du composant `SwipeIndicator`
- Configuration du hook avec callback vers `setActiveTab('dashboard')`
- Ajout de `data-swipe-ignore` sur les éléments interactifs
- Gestion de l'état enabled depuis les settings

### 4. Settings Integration

**Ajout dans SettingsTab**:
- Nouvelle section "Navigation"
- Toggle "Activer swipe navigation"
- Slider pour ajuster le threshold (50-200px)
- Persistance dans localStorage sous clé `swipeNavigationSettings`

## Data Models

### SwipeEvent

```typescript
interface SwipeEvent {
  type: 'touch' | 'mouse';
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  timestamp: number;
}
```

### SwipeSettings

```typescript
interface SwipeSettings {
  enabled: boolean;
  threshold: number;
  velocityThreshold: number;
  customThreshold: number | null; // Pour accessibilité
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Swipe direction validation

*For any* swipe gesture, if the vertical distance is greater than the horizontal distance AND the direction is downward, then the swipe should be classified as a valid down swipe candidate.

**Validates: Requirements 1.2**

### Property 2: Threshold enforcement

*For any* swipe gesture, if the vertical distance is less than the threshold AND the velocity is less than the velocity threshold, then the navigation should NOT be triggered.

**Validates: Requirements 1.3**

### Property 3: Velocity-based threshold reduction

*For any* swipe gesture, if the velocity exceeds the velocity threshold (0.5), then the effective threshold should be reduced to 50% of the configured threshold.

**Validates: Requirements 1.4**

### Property 4: Interactive element exclusion

*For any* touch or mouse event, if the event target has the attribute `data-swipe-ignore` or is a child of an element with this attribute, then the swipe detection should be disabled for that event.

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 5: Event listener cleanup

*For any* component unmount, all event listeners attached during mount should be removed, ensuring no memory leaks.

**Validates: Requirements 6.2**

### Property 6: Single navigation per swipe

*For any* swipe gesture, regardless of how long the user continues the gesture after reaching the threshold, the navigation callback should be called exactly once.

**Validates: Requirements 6.4**

### Property 7: Settings persistence

*For any* change to swipe settings, the new settings should be persisted to localStorage AND should be applied immediately to the active swipe detection.

**Validates: Requirements 8.4**

## Error Handling

### Event Listener Errors

- **Scenario**: Event listener attachment fails
- **Handling**: Log error, disable swipe detection, show notification to user
- **Fallback**: Traditional button navigation remains functional

### Navigation Errors

- **Scenario**: `setActiveTab` fails or throws
- **Handling**: Catch error, log to console, reset swipe state
- **Fallback**: User can retry or use button navigation

### Browser Compatibility Errors

- **Scenario**: Touch events not supported
- **Handling**: Detect support, fallback to mouse events only
- **Logging**: Log browser capabilities for debugging

### Performance Degradation

- **Scenario**: Too many swipe events causing lag
- **Handling**: Implement throttling with requestAnimationFrame
- **Monitoring**: Track event frequency, warn if > 100/sec

## Testing Strategy

### Unit Tests

1. **Swipe Detection Logic**
   - Test threshold validation with various distances
   - Test velocity calculation accuracy
   - Test direction classification (up/down/lateral)
   - Test multi-touch rejection

2. **Event Handler Logic**
   - Test event listener attachment/detachment
   - Test passive event listener configuration
   - Test data-swipe-ignore attribute handling
   - Test cleanup on unmount

3. **Settings Integration**
   - Test localStorage read/write
   - Test settings application to hook
   - Test default values when no settings exist

### Property-Based Tests

We will use **fast-check** for property-based testing in JavaScript/React.

1. **Property Test: Swipe Direction Validation (Property 1)**
   - Generate random swipe coordinates
   - Verify direction classification is correct
   - **Feature: homepage-swipe-navigation, Property 1: Swipe direction validation**

2. **Property Test: Threshold Enforcement (Property 2)**
   - Generate random distances below threshold
   - Verify navigation is never triggered
   - **Feature: homepage-swipe-navigation, Property 2: Threshold enforcement**

3. **Property Test: Velocity Threshold Reduction (Property 3)**
   - Generate random velocities above threshold
   - Verify effective threshold is reduced correctly
   - **Feature: homepage-swipe-navigation, Property 3: Velocity-based threshold reduction**

4. **Property Test: Event Listener Cleanup (Property 5)**
   - Mount and unmount component multiple times
   - Verify no event listeners remain after unmount
   - **Feature: homepage-swipe-navigation, Property 5: Event listener cleanup**

5. **Property Test: Single Navigation (Property 6)**
   - Generate swipes that exceed threshold by varying amounts
   - Verify navigation callback called exactly once
   - **Feature: homepage-swipe-navigation, Property 6: Single navigation per swipe**

### Integration Tests

1. Test swipe on HomePage navigates to Dashboard
2. Test swipe disabled when on other tabs
3. Test button clicks still work with swipe enabled
4. Test settings toggle affects swipe behavior
5. Test cross-browser compatibility (Chrome, Firefox, Safari, Edge)

### Manual Testing

1. Test on real mobile devices (iOS, Android)
2. Test with screen readers (NVDA, JAWS, VoiceOver)
3. Test keyboard navigation still works
4. Test with different threshold settings
5. Test performance with rapid swipes

## Performance Considerations

### Optimization Strategies

1. **Passive Event Listeners**
   - Use `{ passive: true }` for touch/mouse events
   - Prevents scroll blocking
   - Improves scrolling performance

2. **RequestAnimationFrame Throttling**
   - Limit calculations to 60 FPS
   - Prevents excessive re-renders
   - Reduces CPU usage

3. **Debouncing Navigation**
   - Prevent multiple navigation calls
   - Use flag to track if navigation triggered
   - Reset flag on swipe end

4. **Memoization**
   - Use `useMemo` for expensive calculations
   - Use `useCallback` for event handlers
   - Prevent unnecessary re-renders

### Performance Targets

- Event processing: < 16ms (60 FPS)
- Navigation trigger: < 100ms after threshold
- Memory usage: < 1MB additional
- No impact on page load time

## Accessibility

### Screen Reader Support

- Add `aria-live="polite"` region announcing navigation
- Provide text alternative: "Swipe down or press D to access Dashboard"
- Ensure all interactive elements have proper ARIA labels

### Keyboard Navigation

- Add keyboard shortcut: `D` key to navigate to Dashboard
- Document shortcut in help/settings
- Ensure focus management on navigation

### Customization

- Allow threshold adjustment in settings (50-200px)
- Provide option to disable swipe entirely
- Maintain all traditional navigation methods

## Security Considerations

### Input Validation

- Validate all coordinate values are numbers
- Clamp values to reasonable ranges
- Prevent injection through event properties

### Rate Limiting

- Limit navigation triggers to 1 per second
- Prevent rapid navigation spam
- Log suspicious activity patterns

## Browser Compatibility

### Supported Browsers

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Feature Detection

```javascript
const hasTouch = 'ontouchstart' in window;
const hasPointer = 'onpointerdown' in window;
const hasMouse = 'onmousedown' in window;
```

### Fallback Strategy

1. Try Pointer Events (best compatibility)
2. Fall back to Touch Events (mobile)
3. Fall back to Mouse Events (desktop)
4. Disable swipe if none available

## Implementation Notes

### Phase 1: Core Hook
- Implement useSwipeNavigation hook
- Add basic swipe detection
- Test threshold validation

### Phase 2: Visual Feedback
- Create SwipeIndicator component
- Add progress animation
- Test visual feedback

### Phase 3: HomePage Integration
- Integrate hook into HomePage
- Add data-swipe-ignore to buttons
- Test navigation flow

### Phase 4: Settings Integration
- Add settings UI
- Implement localStorage persistence
- Test settings application

### Phase 5: Accessibility
- Add keyboard shortcut
- Add screen reader support
- Test with assistive technologies

### Phase 6: Polish & Testing
- Cross-browser testing
- Performance optimization
- Property-based testing
- Documentation
