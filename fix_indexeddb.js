// Script pour diagnostiquer et réparer IndexedDB
// À exécuter dans la console du navigateur

console.log('🔧 RÉPARATION INDEXEDDB');
console.log('=======================');

// 1. Supprimer complètement la base de données corrompue
async function deleteCorruptedDB() {
  console.log('🗑️ Suppression de la base de données corrompue...');
  
  return new Promise((resolve, reject) => {
    const deleteRequest = indexedDB.deleteDatabase('WorkoutTrackerDB');
    
    deleteRequest.onsuccess = () => {
      console.log('✅ Base de données supprimée avec succès');
      resolve();
    };
    
    deleteRequest.onerror = () => {
      console.log('❌ Erreur suppression base de données:', deleteRequest.error);
      reject(deleteRequest.error);
    };
    
    deleteRequest.onblocked = () => {
      console.log('⚠️ Suppression bloquée - fermez tous les onglets de l\'application');
      reject(new Error('Suppression bloquée'));
    };
  });
}

// 2. Créer une nouvelle base de données propre
async function createFreshDB() {
  console.log('🆕 Création d\'une nouvelle base de données...');
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('WorkoutTrackerDB', 3); // Version 3 pour forcer la recréation
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      console.log('🔄 Mise à jour de la base de données...');
      
      // Supprimer tous les anciens stores s'ils existent
      const storeNames = Array.from(db.objectStoreNames);
      storeNames.forEach(storeName => {
        db.deleteObjectStore(storeName);
        console.log(`🗑️ Store supprimé: ${storeName}`);
      });
      
      // Créer le store workoutData
      const workoutStore = db.createObjectStore('workoutData', { keyPath: 'id' });
      console.log('✅ Store workoutData créé');
      
      // Créer le store contextData pour le contexte
      const contextStore = db.createObjectStore('contextData', { keyPath: 'id' });
      console.log('✅ Store contextData créé');
    };
    
    request.onsuccess = () => {
      console.log('✅ Nouvelle base de données créée avec succès');
      resolve(request.result);
    };
    
    request.onerror = () => {
      console.log('❌ Erreur création base de données:', request.error);
      reject(request.error);
    };
  });
}

// 3. Initialiser avec des données par défaut
async function initializeDefaultData(db) {
  console.log('📊 Initialisation avec des données par défaut...');
  
  const defaultData = {
    id: 'main',
    checkedExercises: {},
    reps: {},
    checkedStretches: {},
    startDate: null,
    weekVariant: 'A',
    progressPhotos: []
  };
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['workoutData'], 'readwrite');
    const store = transaction.objectStore('workoutData');
    const request = store.put(defaultData);
    
    request.onsuccess = () => {
      console.log('✅ Données par défaut initialisées');
      resolve();
    };
    
    request.onerror = () => {
      console.log('❌ Erreur initialisation données:', request.error);
      reject(request.error);
    };
  });
}

// 4. Tester la base de données réparée
async function testRepairedDB() {
  console.log('🧪 Test de la base de données réparée...');
  
  try {
    const request = indexedDB.open('WorkoutTrackerDB', 3);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      console.log('✅ Connexion à la base réparée réussie');
      console.log('📊 Stores disponibles:', Array.from(db.objectStoreNames));
      
      // Tester la lecture
      const transaction = db.transaction(['workoutData'], 'readonly');
      const store = transaction.objectStore('workoutData');
      const getRequest = store.get('main');
      
      getRequest.onsuccess = () => {
        console.log('✅ Lecture des données réussie:', getRequest.result);
      };
      
      getRequest.onerror = () => {
        console.log('❌ Erreur lecture données:', getRequest.error);
      };
    };
    
    request.onerror = () => {
      console.log('❌ Erreur test base réparée:', request.error);
    };
    
  } catch (error) {
    console.log('❌ Erreur test:', error);
  }
}

// 5. Fonction principale de réparation
async function repairIndexedDB() {
  try {
    console.log('🚀 Démarrage de la réparation...');
    
    // Étape 1: Supprimer la DB corrompue
    await deleteCorruptedDB();
    
    // Attendre un peu pour s'assurer que la suppression est complète
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Étape 2: Créer une nouvelle DB
    const db = await createFreshDB();
    
    // Étape 3: Initialiser avec des données par défaut
    await initializeDefaultData(db);
    
    // Étape 4: Tester la DB réparée
    await testRepairedDB();
    
    console.log('🎉 RÉPARATION TERMINÉE AVEC SUCCÈS !');
    console.log('📝 Rechargez la page pour que les changements prennent effet');
    
    return true;
    
  } catch (error) {
    console.log('❌ ERREUR DURANT LA RÉPARATION:', error);
    return false;
  }
}

// Exécuter la réparation
console.log('🔧 Lancement de la réparation IndexedDB...');
repairIndexedDB().then(success => {
  if (success) {
    console.log('✅ Réparation réussie - rechargez la page');
  } else {
    console.log('❌ Réparation échouée - contactez le support');
  }
});

console.log('📝 INSTRUCTIONS:');
console.log('1. Attendez que le script termine');
console.log('2. Si "Réparation réussie", rechargez la page (F5)');
console.log('3. Vérifiez que l\'application fonctionne normalement');
console.log('4. Les données devront être ressaisies');