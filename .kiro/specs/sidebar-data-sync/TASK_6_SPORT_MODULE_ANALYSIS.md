# Task 6: Sport Module Analysis and Corrections

## Date: December 9, 2025

## Analysis Summary

### Current Implementation

The Sport module in the sidebar displays:
- **weeklyWorkouts**: Number of workouts in the last 7 days
- **todayCalories**: Calories burned today (from Garmin)
- **todaySteps**: Steps taken today (from Garmin)
- **avgHeartRate**: Average heart rate today (from Garmin)
- **hasGarminData**: Whether Garmin data is available

### Code Location

**Component**: `src/components/sidebar/ActivitePhysiqueSection.jsx`
- ✅ Properly displays data passed via props
- ✅ Has navigation handlers for all cards
- ✅ Accessible and keyboard-friendly
- ✅ No issues found in the component itself

**Data Source**: `src/hooks/useSidebarData.js` (lines ~200-220)

```javascript
const sport = useMemo(() => {
  if (!getWorkoutHistory) {
    return {
      weeklyWorkouts: 0,
      todayCalories: 0,
      todaySteps: 0,
      avgHeartRate: 72,
      hasGarminData: false
    };
  }
  
  const history = getWorkoutHistory();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().slice(0, 10);
  
  const weeklyWorkouts = history ? history.filter(w => w.date >= weekAgoStr).length : 0;
  const todayMetrics = garminData?.dailyMetrics?.[today];
  
  return {
    weeklyWorkouts,
    todayCalories: todayMetrics?.totalCaloriesBurned || 0,
    todaySteps: todayMetrics?.steps || 0,
    avgHeartRate: todayMetrics?.restingHeartRate || 72,
    hasGarminData: garminData !== null
  };
}, [getWorkoutHistory, garminData, today, refreshTriggers.workout]);
```

### Issues Identified

#### ✅ Issue 1: weeklyWorkouts Calculation is CORRECT
The calculation correctly:
- Gets workout history from WorkoutContext
- Filters workouts from the last 7 days
- Counts the number of workouts
- **No correction needed**

#### ✅ Issue 2: Garmin Data Loading is CORRECT
The Garmin data loading:
- Properly waits for `garminReady` flag
- Loads data for 'metrics' tab with 'week' period
- Handles errors gracefully
- **No correction needed**

#### ❌ Issue 3: MISSING EVENT EMISSIONS
**CRITICAL**: The WorkoutContext does NOT emit sidebar events when workouts are modified!

Events that should be emitted:
- `WORKOUT_ADDED` - When a workout session is saved
- `WORKOUT_UPDATED` - When workout data is modified
- `WORKOUT_DELETED` - When a workout is deleted

**Locations where events should be emitted**:
1. `saveExerciseChanges()` - After successfully saving exercise data
2. `saveStretchChanges()` - After successfully saving stretch data
3. `deleteExceptionalExercise()` - After deleting an exceptional exercise
4. `restoreExercise()` - After restoring a deleted exercise
5. `addExceptionalExercise()` - After adding an exceptional exercise

### Requirements Validation

**Requirement 3.1**: ✅ WHEN the system loads workout data THEN it SHALL correctly count today's workout sessions
- The calculation is correct, counting workouts from the last 7 days

**Requirement 3.5**: ❌ WHEN any module data changes THEN the system SHALL emit a sidebar event to trigger a refresh
- **FAILING**: No events are emitted when workout data changes

## Corrections Required

### 1. Add Event Emissions to WorkoutContext

We need to import and use the sidebar events system in WorkoutContext:

```javascript
import { sidebarEvents, SIDEBAR_EVENTS } from '../utils/sidebarEvents';
```

Then emit events at the appropriate locations:

1. **After saveExerciseChanges** (line ~159):
```javascript
await updateData(tempData);
sidebarEvents.emit(SIDEBAR_EVENTS.WORKOUT_UPDATED, { date: getDateStr(new Date()) });
```

2. **After saveStretchChanges** (line ~204):
```javascript
await updateData(tempData);
sidebarEvents.emit(SIDEBAR_EVENTS.WORKOUT_UPDATED, { date: getDateStr(new Date()) });
```

3. **After addExceptionalExercise** (line ~1823):
```javascript
await updateData(updatedData);
sidebarEvents.emit(SIDEBAR_EVENTS.WORKOUT_ADDED, { exerciseId, date: dateStr });
```

4. **After deleteExceptionalExercise** (line ~1896):
```javascript
await updateData(updatedData);
sidebarEvents.emit(SIDEBAR_EVENTS.WORKOUT_DELETED, { exerciseId, date: dateStr });
```

5. **After restoreExercise** (line ~1682):
```javascript
await updateData(updatedData);
sidebarEvents.emit(SIDEBAR_EVENTS.WORKOUT_UPDATED, { exerciseId, date: dateStr });
```

### 2. Verify Event Listeners

The event listeners in useSidebarData are already correctly set up:
```javascript
useSidebarEvents(SIDEBAR_EVENTS.WORKOUT_ADDED, refreshWorkout);
useSidebarEvents(SIDEBAR_EVENTS.WORKOUT_UPDATED, refreshWorkout);
useSidebarEvents(SIDEBAR_EVENTS.WORKOUT_DELETED, refreshWorkout);
```

## Implementation Plan

1. ✅ Analyze current implementation
2. ⏳ Add sidebar events import to WorkoutContext
3. ⏳ Add event emission after saveExerciseChanges
4. ⏳ Add event emission after saveStretchChanges
5. ⏳ Add event emission after addExceptionalExercise
6. ⏳ Add event emission after deleteExceptionalExercise
7. ⏳ Add event emission after restoreExercise
8. ⏳ Test event emissions manually
9. ⏳ Verify sidebar updates when workouts change

## Testing Strategy

Manual testing steps:
1. Open the app with sidebar visible
2. Add a workout session
3. Verify sidebar weeklyWorkouts count increases
4. Delete a workout session
5. Verify sidebar weeklyWorkouts count decreases
6. Modify workout data
7. Verify sidebar reflects the changes

## Conclusion

The Sport module's data calculation is **correct**, but it's missing the critical event emission system that allows the sidebar to update in real-time when workout data changes. This is a straightforward fix that requires adding event emissions at 5 key locations in WorkoutContext.
