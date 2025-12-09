# Remaining Sections Cleanup Script

## Sections to Clean

### 1. RewardsSection
- Replace badge "2" with "0"
- Replace points "2,450" with "0"
- Replace all stats with zeros
- Add warning message

### 2. HistorySection
- Replace all stats (245 days, 1,234 activities, 487h) with zeros
- Add warning message

### 3. QuickSettingsSection
- Keep toggles but add warning that they're non-functional
- Add warning message

### 4. AIPredictionsSection
- Replace 92% with 0%
- Remove all predictions
- Add warning message

### 5. GlobalStatsSection
- Replace all stats (125K XP, 1,247h, 3,456 activities) with zeros
- Add warning message

## Implementation Strategy

Due to the large size of these sections, I'll:
1. Replace each section's badge with "0"
2. Add warning box at the top
3. Wrap content in opacity: 0.6 div
4. Replace all numeric values with zeros or "--"
5. Remove fake lists/items

## Code Pattern

```jsx
{isExpanded && (
  <div className="sidebar-section-content">
    <div className="sidebar-info-box warning">
      <span className="sidebar-info-icon" aria-hidden="true">⏳</span>
      <span>Module en développement</span>
    </div>
    <div style={{ opacity: 0.6 }}>
      {/* Simplified content with zeros */}
    </div>
  </div>
)}
```
