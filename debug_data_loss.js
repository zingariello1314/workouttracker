// Script de débogage pour analyser la perte de données
// À exécuter dans la console du navigateur

console.log('🚨 DÉBOGAGE PERTE DE DONNÉES');
console.log('============================');

// 1. Vérifier IndexedDB
async function checkIndexedDB() {
  console.log('🗄️ Vérification IndexedDB...');
  
  try {
    const dbRequest = indexedDB.open('WorkoutTrackerDB', 1);
    
    dbRequest.onsuccess = function(event) {
      const db = event.target.result;
      console.log('✅ Base de données ouverte');
      console.log('📊 Stores disponibles:', Array.from(db.objectStoreNames));
      
      // Vérifier workoutData
      const transaction = db.transaction(['workoutData'], 'readonly');
      const store = transaction.objectStore('workoutData');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = function() {
        const allData = getAllRequest.result;
        console.log('📊 Données workout dans IndexedDB:', allData);
        console.log('📊 Nombre d\'entrées:', allData.length);
        
        if (allData.length > 0) {
          console.log('📊 Dernière entrée:', allData[allData.length - 1]);
          
          // Vérifier les dates récentes
          const recentData = allData.filter(entry => {
            const entryDate = new Date(entry.date);
            const today = new Date();
            const diffDays = (today - entryDate) / (1000 * 60 * 60 * 24);
            return diffDays <= 7; // Dernière semaine
          });
          
          console.log('📊 Données de la dernière semaine:', recentData);
        } else {
          console.log('❌ AUCUNE DONNÉE TROUVÉE DANS INDEXEDDB !');
        }
      };
      
      getAllRequest.onerror = function() {
        console.log('❌ Erreur lecture données workout');
      };
    };
    
    dbRequest.onerror = function() {
      console.log('❌ Erreur ouverture base de données');
    };
    
  } catch (error) {
    console.log('❌ Erreur IndexedDB:', error);
  }
}

// 2. Vérifier le contexte React
function checkReactContext() {
  console.log('⚛️ Vérification contexte React...');
  
  const reactFiber = document.querySelector('#root')._reactInternalFiber || 
                     document.querySelector('#root')._reactInternals;
  
  if (reactFiber) {
    function findWorkoutContext(fiber) {
      if (!fiber) return null;
      
      if (fiber.memoizedProps && fiber.memoizedProps.value) {
        const value = fiber.memoizedProps.value;
        if (value.data || value.workoutTables || value.getCurrentData) {
          return value;
        }
      }
      
      if (fiber.child) {
        const result = findWorkoutContext(fiber.child);
        if (result) return result;
      }
      
      if (fiber.sibling) {
        const result = findWorkoutContext(fiber.sibling);
        if (result) return result;
      }
      
      return null;
    }
    
    const context = findWorkoutContext(reactFiber);
    
    if (context) {
      console.log('✅ Contexte trouvé');
      console.log('📊 Données actuelles (data):', context.data);
      console.log('📊 Données temporaires (tempData):', context.tempData);
      console.log('📊 Tableaux workout:', context.workoutTables);
      console.log('📊 Historique programmes:', context.programHistory);
      
      if (context.getCurrentData) {
        console.log('📊 getCurrentData():', context.getCurrentData());
      }
      
      // Vérifier les dates récentes
      if (context.data) {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 24*60*60*1000).toISOString().split('T')[0];
        
        console.log('📊 Données aujourd\'hui:', context.data[today]);
        console.log('📊 Données hier:', context.data[yesterday]);
      }
      
    } else {
      console.log('❌ Contexte non trouvé');
    }
  }
}

// 3. Vérifier localStorage
function checkLocalStorage() {
  console.log('💾 Vérification localStorage...');
  
  const keys = Object.keys(localStorage);
  console.log('📊 Clés localStorage:', keys);
  
  keys.forEach(key => {
    if (key.includes('workout') || key.includes('Workout')) {
      console.log(`📊 ${key}:`, localStorage.getItem(key));
    }
  });
}

// 4. Vérifier sessionStorage
function checkSessionStorage() {
  console.log('🔄 Vérification sessionStorage...');
  
  const keys = Object.keys(sessionStorage);
  console.log('📊 Clés sessionStorage:', keys);
  
  keys.forEach(key => {
    if (key.includes('workout') || key.includes('Workout')) {
      console.log(`📊 ${key}:`, sessionStorage.getItem(key));
    }
  });
}

// Exécuter toutes les vérifications
console.log('🚀 Démarrage analyse perte de données...');
checkIndexedDB();
checkReactContext();
checkLocalStorage();
checkSessionStorage();

console.log('📝 RÉSULTATS À ANALYSER:');
console.log('1. Y a-t-il des données dans IndexedDB ?');
console.log('2. Le contexte React contient-il des données ?');
console.log('3. Y a-t-il des données dans localStorage/sessionStorage ?');
console.log('4. Les données des 18-19 octobre sont-elles présentes ?');