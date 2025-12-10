/**
 * Script de diagnostic pour la Sidebar
 * Vérifie pourquoi les modules restent vides
 */

// Ouvrir la console du navigateur et coller ce code

console.log('=== DIAGNOSTIC SIDEBAR DATA ===\n');

// 1. Vérifier l'authentification
const authData = localStorage.getItem('authData');
console.log('1. Authentification:', authData ? 'OK' : 'MANQUANTE');
if (authData) {
  try {
    const parsed = JSON.parse(authData);
    console.log('   User:', parsed.user?.username || 'N/A');
    console.log('   Token:', parsed.token ? 'Présent' : 'Absent');
  } catch (e) {
    console.error('   Erreur parsing authData:', e);
  }
}

// 2. Vérifier les données QuietQuest
const quietQuestData = localStorage.getItem('quietQuestData');
console.log('\n2. QuietQuest Data:', quietQuestData ? 'OK' : 'MANQUANTE');
if (quietQuestData) {
  try {
    const parsed = JSON.parse(quietQuestData);
    console.log('   XP:', parsed.currentXP || 0);
    console.log('   Niveau:', parsed.level || 0);
    console.log('   Quêtes:', parsed.quests?.length || 0);
  } catch (e) {
    console.error('   Erreur parsing quietQuestData:', e);
  }
}

// 3. Vérifier les données Sport
const workoutData = localStorage.getItem('workoutData');
console.log('\n3. Workout Data:', workoutData ? 'OK' : 'MANQUANTE');
if (workoutData) {
  try {
    const parsed = JSON.parse(workoutData);
    console.log('   Entraînements:', parsed.workouts?.length || 0);
  } catch (e) {
    console.error('   Erreur parsing workoutData:', e);
  }
}

// 4. Vérifier IndexedDB Garmin
console.log('\n4. Vérification IndexedDB Garmin...');
const dbRequest = indexedDB.open('GarminDB', 1);
dbRequest.onsuccess = (event) => {
  const db = event.target.result;
  console.log('   DB Garmin: OK');
  console.log('   Object Stores:', Array.from(db.objectStoreNames));
  
  if (db.objectStoreNames.contains('dailyMetrics')) {
    const transaction = db.transaction(['dailyMetrics'], 'readonly');
    const store = transaction.objectStore('dailyMetrics');
    const countRequest = store.count();
    
    countRequest.onsuccess = () => {
      console.log('   Métriques quotidiennes:', countRequest.result);
    };
  }
  
  db.close();
};
dbRequest.onerror = () => {
  console.error('   Erreur ouverture DB Garmin');
};

// 5. Vérifier IndexedDB Nutrition
console.log('\n5. Vérification IndexedDB Nutrition...');
const nutritionRequest = indexedDB.open('NutritionDB', 1);
nutritionRequest.onsuccess = (event) => {
  const db = event.target.result;
  console.log('   DB Nutrition: OK');
  console.log('   Object Stores:', Array.from(db.objectStoreNames));
  
  if (db.objectStoreNames.contains('dailyMeals')) {
    const transaction = db.transaction(['dailyMeals'], 'readonly');
    const store = transaction.objectStore('dailyMeals');
    const countRequest = store.count();
    
    countRequest.onsuccess = () => {
      console.log('   Repas quotidiens:', countRequest.result);
    };
  }
  
  db.close();
};
nutritionRequest.onerror = () => {
  console.error('   Erreur ouverture DB Nutrition');
};

// 6. Vérifier les données Livres
const booksData = localStorage.getItem('booksData');
console.log('\n6. Books Data:', booksData ? 'OK' : 'MANQUANTE');
if (booksData) {
  try {
    const parsed = JSON.parse(booksData);
    console.log('   Livres en cours:', parsed.currentBooks?.length || 0);
    console.log('   Pages aujourd\'hui:', parsed.todayPages || 0);
  } catch (e) {
    console.error('   Erreur parsing booksData:', e);
  }
}

// 7. Vérifier les données Finance
console.log('\n7. Vérification IndexedDB Finance...');
const financeRequest = indexedDB.open('FinanceDB', 1);
financeRequest.onsuccess = (event) => {
  const db = event.target.result;
  console.log('   DB Finance: OK');
  console.log('   Object Stores:', Array.from(db.objectStoreNames));
  
  if (db.objectStoreNames.contains('synthese')) {
    const transaction = db.transaction(['synthese'], 'readonly');
    const store = transaction.objectStore('synthese');
    const getRequest = store.get('current');
    
    getRequest.onsuccess = () => {
      const data = getRequest.result;
      console.log('   Patrimoine:', data?.total?.valorise || 0);
      console.log('   Investissements:', data?.investissements?.length || 0);
    };
  }
  
  db.close();
};
financeRequest.onerror = () => {
  console.error('   Erreur ouverture DB Finance');
};

// 8. Vérifier le hook useSidebarData dans React DevTools
console.log('\n8. Pour vérifier useSidebarData:');
console.log('   - Ouvrir React DevTools');
console.log('   - Sélectionner le composant SidebarPremium');
console.log('   - Regarder les hooks, notamment useSidebarData');
console.log('   - Vérifier les valeurs retournées');

console.log('\n=== FIN DIAGNOSTIC ===');
console.log('Si toutes les données sont OK mais la sidebar est vide,');
console.log('le problème vient probablement du rendu des composants.');
