# Guide d'Émission d'Events pour la Sidebar

## Vue d'Ensemble

Ce guide montre comment émettre des events depuis les composants pour déclencher la mise à jour automatique de la sidebar.

## Import Nécessaire

```javascript
import { sidebarEvents, SIDEBAR_EVENTS } from '../utils/sidebarEvents';
```

## Exemples par Module

### 1. Module Quêtes

#### Compléter une Quête

```javascript
// Dans QuestesTab.jsx ou useQuietQuestEngine.js

const completeQuest = async (questId) => {
  try {
    // 1. Sauvegarder la complétion
    await saveQuestCompletion(questId, today);
    
    // 2. Émettre l'event
    sidebarEvents.emit(SIDEBAR_EVENTS.QUEST_COMPLETED, {
      questId,
      date: today,
      timestamp: Date.now()
    });
    
    console.log('✅ Quête complétée et sidebar notifiée');
  } catch (error) {
    console.error('Erreur lors de la complétion:', error);
  }
};
```

#### Créer une Nouvelle Quête

```javascript
const createQuest = async (questData) => {
  try {
    const newQuest = await saveNewQuest(questData);
    
    sidebarEvents.emit(SIDEBAR_EVENTS.QUEST_CREATED, {
      quest: newQuest,
      timestamp: Date.now()
    });
    
    console.log('✅ Nouvelle quête créée et sidebar notifiée');
  } catch (error) {
    console.error('Erreur lors de la création:', error);
  }
};
```

#### Modifier une Quête

```javascript
const updateQuest = async (questId, updates) => {
  try {
    await saveQuestUpdates(questId, updates);
    
    sidebarEvents.emit(SIDEBAR_EVENTS.QUEST_UPDATED, {
      questId,
      updates,
      timestamp: Date.now()
    });
    
    console.log('✅ Quête mise à jour et sidebar notifiée');
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
  }
};
```

### 2. Module Sport

#### Ajouter un Entraînement

```javascript
// Dans SportTab.jsx ou WorkoutContext.jsx

const addWorkout = async (workoutData) => {
  try {
    // 1. Sauvegarder l'entraînement
    const savedWorkout = await saveWorkout(workoutData);
    
    // 2. Émettre l'event
    sidebarEvents.emit(SIDEBAR_EVENTS.WORKOUT_ADDED, {
      workout: savedWorkout,
      date: workoutData.date,
      timestamp: Date.now()
    });
    
    console.log('✅ Entraînement ajouté et sidebar notifiée');
  } catch (error) {
    console.error('Erreur lors de l\'ajout:', error);
  }
};
```

#### Modifier un Entraînement

```javascript
const updateWorkout = async (workoutId, updates) => {
  try {
    await saveWorkoutUpdates(workoutId, updates);
    
    sidebarEvents.emit(SIDEBAR_EVENTS.WORKOUT_UPDATED, {
      workoutId,
      updates,
      timestamp: Date.now()
    });
    
    console.log('✅ Entraînement mis à jour et sidebar notifiée');
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
  }
};
```

#### Supprimer un Entraînement

```javascript
const deleteWorkout = async (workoutId) => {
  try {
    await removeWorkout(workoutId);
    
    sidebarEvents.emit(SIDEBAR_EVENTS.WORKOUT_DELETED, {
      workoutId,
      timestamp: Date.now()
    });
    
    console.log('✅ Entraînement supprimé et sidebar notifiée');
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
  }
};
```

### 3. Module Livres

#### Logger des Pages Lues

```javascript
// Dans BooksTab.jsx ou useBooksStorage.js

const logReadingSession = async (bookId, pagesRead, minutes) => {
  try {
    // 1. Sauvegarder la session
    await saveReadingSession({
      bookId,
      pagesRead,
      minutes,
      date: today
    });
    
    // 2. Mettre à jour localStorage
    const booksData = JSON.parse(localStorage.getItem('booksData') || '{}');
    booksData.todayPages = (booksData.todayPages || 0) + pagesRead;
    booksData.todayMinutes = (booksData.todayMinutes || 0) + minutes;
    localStorage.setItem('booksData', JSON.stringify(booksData));
    
    // 3. Émettre l'event
    sidebarEvents.emit(SIDEBAR_EVENTS.PAGES_READ, {
      bookId,
      pagesRead,
      minutes,
      date: today,
      timestamp: Date.now()
    });
    
    console.log('✅ Pages loggées et sidebar notifiée');
  } catch (error) {
    console.error('Erreur lors du logging:', error);
  }
};
```

#### Ajouter un Livre

```javascript
const addBook = async (bookData) => {
  try {
    const newBook = await saveBook(bookData);
    
    // Mettre à jour localStorage
    const booksData = JSON.parse(localStorage.getItem('booksData') || '{}');
    booksData.currentBooks = booksData.currentBooks || [];
    booksData.currentBooks.push(newBook);
    localStorage.setItem('booksData', JSON.stringify(booksData));
    
    sidebarEvents.emit(SIDEBAR_EVENTS.BOOK_ADDED, {
      book: newBook,
      timestamp: Date.now()
    });
    
    console.log('✅ Livre ajouté et sidebar notifiée');
  } catch (error) {
    console.error('Erreur lors de l\'ajout:', error);
  }
};
```

#### Mettre à Jour un Livre

```javascript
const updateBook = async (bookId, updates) => {
  try {
    await saveBookUpdates(bookId, updates);
    
    // Mettre à jour localStorage
    const booksData = JSON.parse(localStorage.getItem('booksData') || '{}');
    const bookIndex = booksData.currentBooks?.findIndex(b => b.id === bookId);
    if (bookIndex !== -1) {
      booksData.currentBooks[bookIndex] = {
        ...booksData.currentBooks[bookIndex],
        ...updates
      };
      localStorage.setItem('booksData', JSON.stringify(booksData));
    }
    
    sidebarEvents.emit(SIDEBAR_EVENTS.BOOK_UPDATED, {
      bookId,
      updates,
      timestamp: Date.now()
    });
    
    console.log('✅ Livre mis à jour et sidebar notifiée');
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
  }
};
```

### 4. Module Nutrition

#### Logger un Repas

```javascript
// Dans NutritionTab.jsx ou useNutritionData.js

const logMeal = async (mealData) => {
  try {
    // 1. Sauvegarder le repas dans IndexedDB
    const savedMeal = await saveMealToDb(mealData);
    
    // 2. Émettre l'event
    sidebarEvents.emit(SIDEBAR_EVENTS.MEAL_LOGGED, {
      meal: savedMeal,
      date: mealData.date,
      timestamp: Date.now()
    });
    
    console.log('✅ Repas loggé et sidebar notifiée');
  } catch (error) {
    console.error('Erreur lors du logging:', error);
  }
};
```

#### Modifier un Repas

```javascript
const updateMeal = async (mealId, updates) => {
  try {
    await saveMealUpdates(mealId, updates);
    
    sidebarEvents.emit(SIDEBAR_EVENTS.MEAL_UPDATED, {
      mealId,
      updates,
      timestamp: Date.now()
    });
    
    console.log('✅ Repas mis à jour et sidebar notifiée');
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error);
  }
};
```

#### Supprimer un Repas

```javascript
const deleteMeal = async (mealId) => {
  try {
    await removeMeal(mealId);
    
    sidebarEvents.emit(SIDEBAR_EVENTS.MEAL_DELETED, {
      mealId,
      timestamp: Date.now()
    });
    
    console.log('✅ Repas supprimé et sidebar notifiée');
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
  }
};
```

### 5. Module Finance

#### Ajouter une Dépense

```javascript
// Dans PlanificateurTab.jsx ou usePlanificateur.js

const addExpense = async (expenseData) => {
  try {
    const savedExpense = await saveExpense(expenseData);
    
    sidebarEvents.emit(SIDEBAR_EVENTS.EXPENSE_ADDED, {
      expense: savedExpense,
      timestamp: Date.now()
    });
    
    console.log('✅ Dépense ajoutée et sidebar notifiée');
  } catch (error) {
    console.error('Erreur lors de l\'ajout:', error);
  }
};
```

#### Ajouter un Revenu

```javascript
const addRevenue = async (revenueData) => {
  try {
    const savedRevenue = await saveRevenue(revenueData);
    
    sidebarEvents.emit(SIDEBAR_EVENTS.REVENUE_ADDED, {
      revenue: savedRevenue,
      timestamp: Date.now()
    });
    
    console.log('✅ Revenu ajouté et sidebar notifiée');
  } catch (error) {
    console.error('Erreur lors de l\'ajout:', error);
  }
};
```

## Pattern Général

Voici le pattern général à suivre:

```javascript
const performAction = async (data) => {
  try {
    // 1. Effectuer l'action (sauvegarder, modifier, supprimer)
    const result = await performDatabaseOperation(data);
    
    // 2. Émettre l'event correspondant
    sidebarEvents.emit(SIDEBAR_EVENTS.EVENT_NAME, {
      // Données pertinentes
      ...result,
      timestamp: Date.now()
    });
    
    // 3. Log pour debugging
    console.log('✅ Action effectuée et sidebar notifiée');
    
    return result;
  } catch (error) {
    console.error('Erreur lors de l\'action:', error);
    throw error;
  }
};
```

## Bonnes Pratiques

### 1. Toujours Émettre Après la Sauvegarde

```javascript
// ✅ BON
await saveData(data);
sidebarEvents.emit(SIDEBAR_EVENTS.DATA_UPDATED, data);

// ❌ MAUVAIS
sidebarEvents.emit(SIDEBAR_EVENTS.DATA_UPDATED, data);
await saveData(data); // Peut échouer
```

### 2. Inclure des Données Contextuelles

```javascript
// ✅ BON
sidebarEvents.emit(SIDEBAR_EVENTS.QUEST_COMPLETED, {
  questId,
  date: today,
  xpGained: 100,
  timestamp: Date.now()
});

// ❌ MAUVAIS
sidebarEvents.emit(SIDEBAR_EVENTS.QUEST_COMPLETED);
```

### 3. Gérer les Erreurs

```javascript
// ✅ BON
try {
  await saveData(data);
  sidebarEvents.emit(SIDEBAR_EVENTS.DATA_UPDATED, data);
} catch (error) {
  console.error('Erreur:', error);
  // Ne pas émettre l'event si la sauvegarde a échoué
}

// ❌ MAUVAIS
await saveData(data); // Peut throw
sidebarEvents.emit(SIDEBAR_EVENTS.DATA_UPDATED, data); // Jamais appelé si erreur
```

### 4. Logger pour le Debugging

```javascript
// ✅ BON
sidebarEvents.emit(SIDEBAR_EVENTS.QUEST_COMPLETED, data);
console.log('✅ Event émis:', SIDEBAR_EVENTS.QUEST_COMPLETED, data);

// Permet de tracer les events dans la console
```

## Testing

Pour tester qu'un event est bien émis:

```javascript
// Dans un test
import { sidebarEvents, SIDEBAR_EVENTS } from '../utils/sidebarEvents';

test('should emit event when quest is completed', async () => {
  const mockCallback = jest.fn();
  
  // Écouter l'event
  const unsubscribe = sidebarEvents.on(SIDEBAR_EVENTS.QUEST_COMPLETED, mockCallback);
  
  // Effectuer l'action
  await completeQuest('quest-123');
  
  // Vérifier que l'event a été émis
  expect(mockCallback).toHaveBeenCalledWith({
    questId: 'quest-123',
    date: expect.any(String),
    timestamp: expect.any(Number)
  });
  
  // Cleanup
  unsubscribe();
});
```

## Debugging

Si la sidebar ne se met pas à jour:

1. **Vérifier que l'event est émis**:
   ```javascript
   console.log('Émission event:', SIDEBAR_EVENTS.QUEST_COMPLETED);
   sidebarEvents.emit(SIDEBAR_EVENTS.QUEST_COMPLETED, data);
   ```

2. **Vérifier les logs dans useSidebarData**:
   - `[useSidebarData] Rafraîchissement des quêtes déclenché`
   - `[useSidebarData] Rafraîchissement des entraînements déclenché`
   - etc.

3. **Vérifier que les données sont bien sauvegardées**:
   ```javascript
   const result = await saveData(data);
   console.log('Données sauvegardées:', result);
   ```

4. **Vérifier que le hook useSidebarData est bien utilisé**:
   ```javascript
   // Dans SidebarPremium.jsx
   const sidebarData = useSidebarData();
   console.log('Données sidebar:', sidebarData);
   ```

## Prochaines Étapes

1. Identifier tous les endroits où les données sont modifiées
2. Ajouter les émissions d'events correspondantes
3. Tester chaque action pour vérifier la mise à jour de la sidebar
4. Optimiser si nécessaire (throttling, debouncing)
