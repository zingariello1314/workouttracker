# Task 9: Finance Module Analysis

## Date: December 9, 2025

## Current State Analysis

### 1. Data Flow in useSidebarData

The finance data in `useSidebarData.js` is calculated as follows:

```javascript
const finance = useMemo(() => {
  const netWorth = patrimoine?.total?.valorise || 0;
  const monthlyBudget = salaire?.montantNet || 0;
  const monthlySavings = repartition?.epargne?.montant || 0;
  
  let investments = 0;
  if (patrimoine?.investissements && Array.isArray(patrimoine.investissements)) {
    investments = patrimoine.investissements.reduce(
      (sum, inv) => sum + (inv.valeurActuelle || 0), 
      0
    );
  }
  
  return {
    netWorth,
    monthlyBudget,
    monthlySavings,
    investments,
    hasData: patrimoine !== null || salaire !== null
  };
}, [patrimoine, salaire, repartition]);
```

### 2. Issues Identified

#### Issue 1: Incorrect Property Access for monthlyBudget
- **Current**: `salaire?.montantNet`
- **Actual structure**: `salaire?.netMensuel` (from usePlanificateur)
- **Impact**: monthlyBudget always shows 0

#### Issue 2: Incorrect Property Access for monthlySavings
- **Current**: `repartition?.epargne?.montant`
- **Actual structure**: `repartition?.epargne` (direct number value)
- **Impact**: monthlySavings always shows 0

#### Issue 3: Incorrect Property Access for investments
- **Current**: Tries to access `patrimoine?.investissements` as an array
- **Actual structure**: `patrimoine?.bourse?.valorisation` + other investment types
- **Impact**: investments always shows 0

#### Issue 4: Missing Event Emission
- **Current**: No FINANCE_UPDATED events are emitted when finance data changes
- **Locations needing events**:
  - `useSynthese.updatePatrimoine()`
  - `usePlanificateur.updateSalaire()`
  - `usePlanificateur.updateRepartition()`
- **Impact**: Sidebar doesn't refresh when finance data changes

### 3. Correct Data Structure

From analyzing the hooks:

**useSynthese (patrimoine)**:
```javascript
{
  or: { capitalInvesti, valorisation },
  bourse: { capitalInvesti, valorisation },
  cash: { capitalInvesti, valorisation },
  total: {
    investi,
    valorise,  // ✓ This is netWorth
    plusValue,
    plusValuePourcent
  }
}
```

**usePlanificateur (salaire)**:
```javascript
{
  netMensuel: 3000  // ✓ This is monthlyBudget
}
```

**usePlanificateur (repartition)**:
```javascript
{
  epargne: 500,  // ✓ Direct number, this is monthlySavings
  loisirs: 300,
  charges: 2200
}
```

### 4. Correct Calculation for Investments

Investments should be the sum of all investment types:
```javascript
const investments = 
  (patrimoine?.or?.valorisation || 0) +
  (patrimoine?.bourse?.valorisation || 0);
// Note: cash is not an investment, it's liquidity
```

## Implementation Plan

### Step 1: Fix Property Access in useSidebarData
- Fix `monthlyBudget` to use `salaire?.netMensuel`
- Fix `monthlySavings` to use `repartition?.epargne` directly
- Fix `investments` calculation to sum or + bourse valorisations

### Step 2: Add FINANCE_UPDATED Event to sidebarEvents
- Already exists in SIDEBAR_EVENTS but not used

### Step 3: Emit Events in Finance Hooks
- Add event emission in `useSynthese.updatePatrimoine()`
- Add event emission in `usePlanificateur.updateSalaire()`
- Add event emission in `usePlanificateur.updateRepartition()`

### Step 4: Listen to FINANCE_UPDATED in useSidebarData
- Add listener for FINANCE_UPDATED event
- Create debounced refresh function for finance data

## Requirements Validation

- **Requirement 3.4**: WHEN the system loads finance data THEN it SHALL correctly calculate the current net worth ✓
- **Requirement 3.5**: WHEN any module data changes THEN the system SHALL emit a sidebar event to trigger a refresh ✓
