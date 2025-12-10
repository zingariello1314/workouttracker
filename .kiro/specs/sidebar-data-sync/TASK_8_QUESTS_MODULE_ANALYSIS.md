# Task 8: Quests Module Analysis

## Current State

### Data Flow
1. **useQuietQuestEngine** manages all quest data:
   - `allQuests`: All quests (recurring + exceptional)
   - `validations`: Quest completions by date
   - `getQuestsForDate(date)`: Returns quests for a specific date
   - `isQuestCompletedOnDate(questId, date)`: Checks if quest is completed
   - `toggleQuestValidation(questId, date)`: Toggles quest completion

2. **useSidebarData** calculates quest statistics:
   - Gets today's quests via `getQuestsForDate(today)`
   - Counts completed quests via `isQuestCompletedOnDate`
   - Provides data to sidebar sections

3. **QuestesJourSection** displays:
   - List of today's quests
   - Badge showing total count
   - Completion status for each quest

### Current Calculations in useSidebarData

```javascript
// Quêtes du jour - Line 155
const quests = useMemo(() => {
  if (!getQuestsForDate || !isQuestCompletedOnDate) return [];
  
  const todayQuests = getQuestsForDate(today);
  if (!todayQuests || todayQuests.length === 0) return [];
  
  return todayQuests.map(quest => {
    const completed = isQuestCompletedOnDate(quest.id, today);
    return {
      id: quest.id,
      title: quest.nom,
      icon: quest.icone || '🎯',
      completed,
      progress: completed ? 100 : 0,
      xp: quest.xp || 0,
      difficulty: quest.difficulte || 1
    };
  });
}, [getQuestsForDate, isQuestCompletedOnDate, today, refreshTriggers.quests]);

// Today data - Line 237
const todayData = useMemo(() => {
  // Quêtes du jour
  let questsCompleted = 0;
  let questsTotal = 0;
  
  if (getQuestsForDate && isQuestCompletedOnDate) {
    const todayQuests = getQuestsForDate(today);
    if (todayQuests && todayQuests.length > 0) {
      questsTotal = todayQuests.length;
      questsCompleted = todayQuests.filter(q => isQuestCompletedOnDate(q.id, today)).length;
    }
  }
  // ... rest
}, [getQuestsForDate, isQuestCompletedOnDate, ...]);
```

## Issues Found

### ✅ CORRECT: Quest Counting Logic
The calculations are **CORRECT**:
- `questsTotal` = number of quests for today (recurring + exceptional)
- `questsCompleted` = number of completed quests for today
- Uses proper filtering and counting

### ❌ MISSING: Event Emissions
Events are **NOT** being emitted when:
1. Quest is completed/uncompleted (`toggleQuestValidation`)
2. Quest is created (`setAllQuests` with new quest)
3. Quest is updated (`setAllQuests` with modified quest)
4. Quest is deleted (`setAllQuests` with filtered array)

### Event Emission Points

#### 1. Quest Completion/Uncompletion
**Location**: `src/hooks/useQuietQuestEngine.js` - `toggleQuestValidation` function
**Action**: Emit `QUEST_COMPLETED` or `QUEST_UPDATED` event

#### 2. Quest CRUD Operations
**Location**: `src/components/tabs/QuestsTab.jsx` - Multiple locations:
- Line 332: `saveQuest` - Creating/editing quests
- Line 366: `toggleQuestActive` - Activating/deactivating quests
- Line 380: `deleteQuest` - Deleting quests
- Line 393: `duplicateQuest` - Duplicating quests
- Line 412: `activateSelectedQuests` - Bulk activation
- Line 429: `deactivateSelectedQuests` - Bulk deactivation
- Line 452: `deleteSelectedQuests` - Bulk deletion

## Requirements Validation

### Requirement 3.3
> WHEN the system loads quest data THEN it SHALL correctly count today's completed quests

**Status**: ✅ CORRECT
- `questsCompleted` correctly counts completed quests for today
- Uses `isQuestCompletedOnDate(quest.id, today)` which checks validations

> WHEN the system loads quest data THEN it SHALL correctly count today's total quests

**Status**: ✅ CORRECT
- `questsTotal` correctly counts all quests for today
- Uses `getQuestsForDate(today).length`

### Requirement 3.5
> WHEN any module data changes THEN the system SHALL emit a sidebar event to trigger a refresh

**Status**: ❌ MISSING
- No events emitted when quests are completed
- No events emitted when quests are created/updated/deleted

## Implementation Plan

### Step 1: Add Event Emission to toggleQuestValidation
Modify `useQuietQuestEngine.js` to emit events when quests are completed/uncompleted.

### Step 2: Add Event Emissions to QuestsTab
Add event emissions for all quest CRUD operations:
- Quest created → `QUEST_CREATED`
- Quest updated → `QUEST_UPDATED`
- Quest deleted → `QUEST_UPDATED` (affects today's count)
- Quest completed → Already handled in Step 1

### Step 3: Verify Event Listeners
Confirm that `useSidebarData` is already listening to these events (it is):
```javascript
useSidebarEvents(SIDEBAR_EVENTS.QUEST_COMPLETED, refreshQuests);
useSidebarEvents(SIDEBAR_EVENTS.QUEST_UPDATED, refreshQuests);
useSidebarEvents(SIDEBAR_EVENTS.QUEST_CREATED, refreshQuests);
```

## Conclusion

The quest counting logic is **CORRECT** and doesn't need changes. The only issue is **MISSING EVENT EMISSIONS** which prevents the sidebar from updating in real-time when quests change.

**Requirements Status**:
- ✅ 3.3: Quest counting is correct
- ❌ 3.5: Event emissions are missing

**Action Items**:
1. Add event emission to `toggleQuestValidation`
2. Add event emissions to quest CRUD operations in QuestsTab
3. Test that sidebar updates in real-time
