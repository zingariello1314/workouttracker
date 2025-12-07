# Design Document - Refonte Allocation Salaire Liquid Glass

## Overview

Ce document décrit l'architecture et le design system pour la modernisation du bloc "Allocation Salaire" avec une esthétique liquid glass. Le design s'inspire des blocs modernisés existants (LearningStatus, Surveillance) et applique les principes du glassmorphism moderne.

### Objectifs du Design

1. **Liquid Glass Aesthetic**: Transparence, backdrop-blur et effets de profondeur
2. **Cohérence Visuelle**: Alignement avec les autres blocs modernisés du dashboard
3. **Performance**: Utilisation de transformations GPU et animations optimisées
4. **Accessibilité**: Contrastes WCAG AA et navigation clavier
5. **Responsive**: Layout adaptatif pour tous les breakpoints

## Architecture

### Structure des Composants

```
SalaryAllocationBlock/
├── Container (dashboard-card)
│   ├── Glow Effect Layer
│   ├── Header
│   │   ├── Icon Container (glassmorphism)
│   │   ├── Title & Subtitle
│   │   └── Salary Badge (glassmorphism)
│   ├── Content
│   │   ├── Allocation Section
│   │   │   ├── Donut Chart
│   │   │   └── Category Bars (glassmorphism)
│   │   ├── Recommendations Section
│   │   │   └── Recommendation Cards (glassmorphism)
│   │   └── Actions Section
│   │       ├── Optimize Button (glassmorphism + gradient)
│   │       └── Customize Button (glassmorphism)
│   └── Loading State (skeleton glassmorphism)
```

### Hiérarchie Visuelle

```
Level 1: Container (bg-white/5, backdrop-blur-2xl)
  ├─ Level 2: Header Badge (bg-emerald-500/10, backdrop-blur-xl)
  ├─ Level 3: Category Bars (bg-white/3, backdrop-blur-xl)
  ├─ Level 4: Recommendation Cards (bg-white/5, backdrop-blur-xl)
  └─ Level 5: Action Buttons (bg-white/8, backdrop-blur-2xl)
```

## Components and Interfaces

### 1. Container Principal

**Style Liquid Glass:**
```css
.salary-allocation-card {
  position: relative;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.salary-allocation-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(16, 185, 129, 0.3);
  transform: translateY(-2px);
  box-shadow: 
    0 12px 48px rgba(0, 0, 0, 0.3),
    0 0 40px rgba(16, 185, 129, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.15);
}
```

**Glow Effect:**
```css
.salary-allocation-card .card-glow {
  position: absolute;
  inset: -20px;
  background: radial-gradient(
    circle at center,
    rgba(16, 185, 129, 0.15) 0%,
    transparent 70%
  );
  opacity: 0;
  transition: opacity 0.5s ease;
  pointer-events: none;
  z-index: -1;
}

.salary-allocation-card:hover .card-glow {
  opacity: 1;
}
```

### 2. Header

**Structure:**
```jsx
<div className="card-header">
  <div className="header-left">
    <div className="icon-container">
      <DollarSign className="header-icon" />
    </div>
    <div className="header-text">
      <h3 className="card-title">Allocation Salaire</h3>
      <p className="card-subtitle">Répartition mensuelle optimisée</p>
    </div>
  </div>
  <div className="salary-badge">
    <div className="badge-label">Salaire mensuel</div>
    <div className="badge-value">{salary.toLocaleString()}€</div>
  </div>
</div>
```

**Styles:**
```css
.salary-allocation-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(16, 185, 129, 0.2);
}

.salary-allocation-card .icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: rgba(16, 185, 129, 0.1);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.salary-allocation-card .icon-container:hover {
  background: rgba(16, 185, 129, 0.15);
  border-color: rgba(16, 185, 129, 0.3);
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
}

.salary-allocation-card .header-icon {
  width: 24px;
  height: 24px;
  color: #10b981;
  filter: drop-shadow(0 0 8px rgba(16, 185, 129, 0.5));
}

.salary-allocation-card .card-title {
  font-family: 'Orbitron', monospace;
  font-size: 18px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: linear-gradient(90deg, #10b981, #34d399);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 4px;
}

.salary-allocation-card .card-subtitle {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 400;
}

.salary-allocation-card .salary-badge {
  padding: 12px 16px;
  background: rgba(16, 185, 129, 0.1);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.salary-allocation-card .salary-badge:hover {
  background: rgba(16, 185, 129, 0.15);
  border-color: rgba(16, 185, 129, 0.3);
  transform: scale(1.05);
  box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
}

.salary-allocation-card .badge-label {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.salary-allocation-card .badge-value {
  font-family: 'Orbitron', monospace;
  font-size: 24px;
  font-weight: 900;
  color: #10b981;
  text-shadow: 0 0 12px rgba(16, 185, 129, 0.5);
}
```

### 3. Allocation Section

**Structure:**
```jsx
<div className="allocation-section">
  <div className="allocation-chart">
    <AllocationChart data={allocation} size={220} />
  </div>
  <div className="allocation-categories">
    {categories.map(category => (
      <div key={category.name} className="category-bar">
        <div className="category-info">
          <div className="category-dot" style={{ background: category.color }} />
          <span className="category-name">{category.name}</span>
        </div>
        <div className="category-values">
          <span className="category-amount">{category.amount}€</span>
          <span className="category-percent">{category.percent}%</span>
        </div>
      </div>
    ))}
  </div>
</div>
```

**Styles:**
```css
.salary-allocation-card .allocation-section {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}

.salary-allocation-card .category-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

.salary-allocation-card .category-bar:hover {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.15);
  transform: translateX(4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.salary-allocation-card .category-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.salary-allocation-card .category-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  box-shadow: 0 0 12px currentColor;
}

.salary-allocation-card .category-name {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.salary-allocation-card .category-values {
  display: flex;
  align-items: center;
  gap: 12px;
}

.salary-allocation-card .category-amount {
  font-family: 'Orbitron', monospace;
  font-size: 16px;
  font-weight: 700;
  color: #ffffff;
}

.salary-allocation-card .category-percent {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
}
```

### 4. Recommendations Section

**Structure:**
```jsx
<div className="recommendations-section">
  <div className="section-header">
    <TrendingUp className="section-icon" />
    <span className="section-title">Recommandations d'optimisation</span>
  </div>
  <div className="recommendations-grid">
    {recommendations.map(rec => (
      <div key={rec.category} className={`recommendation-card ${rec.status}`}>
        <div className="rec-header">
          <span className="rec-category">{rec.category}</span>
          <span className="rec-badge">
            {rec.status === 'optimal' ? '✓ Optimal' : '⚠ À améliorer'}
          </span>
        </div>
        <div className="rec-details">
          <div className="rec-stat">
            <span className="rec-label">Actuel:</span>
            <span className="rec-value">{rec.current.toFixed(1)}%</span>
          </div>
          <div className="rec-stat">
            <span className="rec-label">Recommandé:</span>
            <span className="rec-value">{rec.recommended}%</span>
          </div>
          {rec.status === 'improve' && (
            <div className="rec-diff">
              +{(rec.recommended - rec.current).toFixed(1)}%
            </div>
          )}
        </div>
      </div>
    ))}
  </div>
</div>
```

**Styles:**
```css
.salary-allocation-card .recommendations-section {
  margin-bottom: 1.5rem;
}

.salary-allocation-card .section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.salary-allocation-card .section-icon {
  width: 16px;
  height: 16px;
  color: #10b981;
}

.salary-allocation-card .section-title {
  font-size: 14px;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.9);
}

.salary-allocation-card .recommendations-grid {
  display: grid;
  gap: 10px;
}

.salary-allocation-card .recommendation-card {
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  transition: all 0.3s ease;
}

.salary-allocation-card .recommendation-card:hover {
  background: rgba(255, 255, 255, 0.08);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.salary-allocation-card .recommendation-card.optimal {
  border-color: rgba(34, 197, 94, 0.3);
  background: rgba(34, 197, 94, 0.05);
}

.salary-allocation-card .recommendation-card.improve {
  border-color: rgba(251, 146, 60, 0.3);
  background: rgba(251, 146, 60, 0.05);
}

.salary-allocation-card .rec-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.salary-allocation-card .rec-category {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
}

.salary-allocation-card .rec-badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.salary-allocation-card .recommendation-card.optimal .rec-badge {
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.3);
  color: #22c55e;
}

.salary-allocation-card .recommendation-card.improve .rec-badge {
  background: rgba(251, 146, 60, 0.15);
  border: 1px solid rgba(251, 146, 60, 0.3);
  color: #fb923c;
}

.salary-allocation-card .rec-details {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 12px;
}

.salary-allocation-card .rec-stat {
  display: flex;
  align-items: center;
  gap: 6px;
}

.salary-allocation-card .rec-label {
  color: rgba(255, 255, 255, 0.6);
}

.salary-allocation-card .rec-value {
  font-family: 'Orbitron', monospace;
  font-weight: 700;
  color: #ffffff;
}

.salary-allocation-card .rec-diff {
  margin-left: auto;
  font-family: 'Orbitron', monospace;
  font-weight: 700;
  color: #fb923c;
}
```

### 5. Actions Section

**Structure:**
```jsx
<div className="actions-section">
  <button className="action-btn primary" onClick={() => onUpdate('optimize')}>
    <Sparkles className="btn-icon" />
    <span className="btn-text">Optimiser automatiquement</span>
  </button>
  <button className="action-btn secondary" onClick={() => onUpdate('custom')}>
    <Settings className="btn-icon" />
    <span className="btn-text">Personnaliser</span>
  </button>
</div>
```

**Styles:**
```css
.salary-allocation-card .actions-section {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
}

.salary-allocation-card .action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.salary-allocation-card .action-btn.primary {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2));
  backdrop-filter: blur(24px);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #10b981;
}

.salary-allocation-card .action-btn.primary:hover {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.3));
  border-color: rgba(16, 185, 129, 0.5);
  transform: translateY(-2px) scale(1.02);
  box-shadow: 
    0 8px 24px rgba(16, 185, 129, 0.3),
    0 0 40px rgba(16, 185, 129, 0.2);
}

.salary-allocation-card .action-btn.secondary {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(24px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.9);
}

.salary-allocation-card .action-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 255, 255, 0.25);
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 24px rgba(255, 255, 255, 0.1);
}

.salary-allocation-card .action-btn .btn-icon {
  width: 16px;
  height: 16px;
  transition: all 0.3s ease;
}

.salary-allocation-card .action-btn:hover .btn-icon {
  transform: scale(1.15) rotate(5deg);
  filter: drop-shadow(0 0 8px currentColor);
}

.salary-allocation-card .action-btn .btn-text {
  font-weight: 600;
  transition: all 0.3s ease;
}

.salary-allocation-card .action-btn:hover .btn-text {
  text-shadow: 0 0 8px currentColor;
}

/* Ripple effect */
.salary-allocation-card .action-btn::before {
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

.salary-allocation-card .action-btn:active::before {
  width: 300px;
  height: 300px;
}
```

## Data Models

### AllocationData Interface

```typescript
interface AllocationData {
  salary: number;
  allocation: {
    epargne: number;
    investissement: number;
    depenses: number;
    loisirs: number;
  };
}

interface Recommendation {
  category: string;
  current: number;
  recommended: number;
  status: 'optimal' | 'improve';
}

interface CategoryDisplay {
  name: string;
  amount: number;
  percent: number;
  color: string;
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Glassmorphism Consistency
*For any* element with glassmorphism styling, the backdrop-blur value should be between `blur(16px)` and `blur(24px)`, and background opacity should be between `0.03` and `0.1`
**Validates: Requirements 1.1, 1.6**

### Property 2: Hover State Enhancement
*For any* interactive element, when hovered, the backdrop-blur should increase, scale should be between 1.02 and 1.05, and a glow effect should be applied
**Validates: Requirements 1.4, 1.7**

### Property 3: Color Consistency
*For any* financial element, the primary color should be emerald (#10b981) with appropriate opacity variations
**Validates: Requirements 2.5, 9.2**

### Property 4: Transition Smoothness
*For any* animated element, transitions should use duration-500 (500ms) with cubic-bezier(0.4, 0, 0.2, 1) easing
**Validates: Requirements 1.5, 6.2, 6.5**

### Property 5: Allocation Sum Validation
*For any* allocation data, the sum of all categories (epargne + investissement + depenses + loisirs) should equal the salary amount
**Validates: Requirements 3.3**

### Property 6: Recommendation Accuracy
*For any* recommendation, if current percentage >= recommended percentage, then status should be 'optimal', otherwise 'improve'
**Validates: Requirements 4.3, 4.4**

### Property 7: Responsive Layout Adaptation
*For any* screen width below 768px, the allocation section grid should switch from 2 columns to 1 column
**Validates: Requirements 7.1, 7.2**

### Property 8: Accessibility Contrast
*For any* text element, the contrast ratio against its background should be at least 4.5:1 for normal text and 3:1 for large text
**Validates: Requirements 7.4**

### Property 9: Loading State Preservation
*For any* loading state, the skeleton should maintain the same layout structure and glassmorphism styling as the final content
**Validates: Requirements 8.3, 8.4**

### Property 10: Event Emission Correctness
*For any* button click, the correct action type ('optimize' or 'custom') should be emitted via the onUpdate callback
**Validates: Requirements 5.5, 5.6**

## Error Handling

### Missing Data
```javascript
if (!allocationData || !allocationData.salary) {
  return <LoadingSkeleton />;
}
```

### Invalid Allocation
```javascript
const validateAllocation = (allocation, salary) => {
  const total = Object.values(allocation).reduce((sum, val) => sum + val, 0);
  if (Math.abs(total - salary) > 0.01) {
    console.warn('Allocation sum does not match salary');
    return false;
  }
  return true;
};
```

### Callback Safety
```javascript
const handleOptimize = () => {
  if (typeof onUpdate === 'function') {
    onUpdate('optimize');
  } else {
    console.warn('onUpdate callback not provided');
  }
};
```

## Testing Strategy

### Unit Tests
- Test allocation sum validation
- Test recommendation status calculation
- Test category percentage calculation
- Test callback invocation with correct parameters
- Test loading state rendering

### Property-Based Tests
- Property 5: Allocation sum validation across random salary values
- Property 6: Recommendation status correctness across random allocations
- Property 10: Event emission correctness across all button interactions

### Visual Regression Tests
- Glassmorphism effects rendering
- Hover state transitions
- Responsive layout breakpoints
- Color consistency across themes

### Accessibility Tests
- Keyboard navigation
- Screen reader compatibility
- Color contrast ratios
- Focus indicators

## Performance Considerations

### GPU Acceleration
```css
.salary-allocation-card {
  will-change: transform;
  transform: translateZ(0);
}

.salary-allocation-card .action-btn {
  will-change: transform, opacity;
}
```

### Backdrop-Blur Optimization
```css
/* Use backdrop-filter sparingly on parent containers */
.salary-allocation-card {
  backdrop-filter: blur(24px);
}

/* Avoid nested backdrop-filters when possible */
.category-bar {
  backdrop-filter: blur(16px);
  /* Only on direct children, not nested */
}
```

### Animation Performance
```css
/* Use transform and opacity for animations (GPU accelerated) */
.action-btn:hover {
  transform: translateY(-2px) scale(1.02);
  opacity: 1;
}

/* Avoid animating expensive properties like box-shadow directly */
/* Use pseudo-elements instead */
.action-btn::after {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.action-btn:hover::after {
  opacity: 1;
}
```

## Responsive Design

### Breakpoints
```css
/* Desktop (default) */
.allocation-section {
  grid-template-columns: 220px 1fr;
}

/* Tablet (< 1024px) */
@media (max-width: 1024px) {
  .allocation-section {
    grid-template-columns: 180px 1fr;
  }
}

/* Mobile (< 768px) */
@media (max-width: 768px) {
  .allocation-section {
    grid-template-columns: 1fr;
  }
  
  .actions-section {
    grid-template-columns: 1fr;
  }
}

/* Small Mobile (< 480px) */
@media (max-width: 480px) {
  .salary-allocation-card {
    padding: 1rem;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
```

## Color Palette

### Primary Colors
```css
--emerald-primary: #10b981;
--emerald-light: #34d399;
--emerald-dark: #059669;
```

### Status Colors
```css
--status-optimal: #22c55e;
--status-improve: #fb923c;
--status-critical: #ef4444;
```

### Glassmorphism Layers
```css
--glass-bg-1: rgba(255, 255, 255, 0.03);
--glass-bg-2: rgba(255, 255, 255, 0.05);
--glass-bg-3: rgba(255, 255, 255, 0.08);
--glass-bg-4: rgba(255, 255, 255, 0.1);

--glass-border-1: rgba(255, 255, 255, 0.08);
--glass-border-2: rgba(255, 255, 255, 0.1);
--glass-border-3: rgba(255, 255, 255, 0.15);
```

### Category Colors
```css
--category-epargne: #3b82f6;      /* Blue */
--category-investissement: #8b5cf6; /* Purple */
--category-depenses: #10b981;      /* Green */
--category-loisirs: #f59e0b;       /* Orange */
```

## Typography

### Font Families
```css
--font-display: 'Orbitron', monospace;
--font-body: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

### Font Sizes
```css
--text-xs: 11px;
--text-sm: 13px;
--text-base: 14px;
--text-lg: 16px;
--text-xl: 18px;
--text-2xl: 24px;
```

### Font Weights
```css
--font-normal: 400;
--font-semibold: 600;
--font-bold: 700;
--font-black: 900;
```
