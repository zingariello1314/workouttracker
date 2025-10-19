// Script de débogage pour analyser les données des graphiques
// À exécuter dans la console du navigateur sur l'onglet graphique

console.log('🔍 DÉBOGAGE DES GRAPHIQUES - ANALYSE DES DONNÉES');
console.log('================================================');

// 1. Vérifier si le contexte est accessible
if (window.React && window.React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
  console.log('✅ React détecté');
} else {
  console.log('❌ React non détecté');
}

// 2. Fonction pour analyser workoutHistory
function analyzeWorkoutHistory() {
  // Essayer d'accéder aux données via le contexte React
  const reactFiber = document.querySelector('#root')._reactInternalFiber || 
                     document.querySelector('#root')._reactInternals;
  
  if (reactFiber) {
    console.log('🔍 Analyse du contexte React...');
    
    // Fonction récursive pour trouver le contexte
    function findWorkoutContext(fiber) {
      if (!fiber) return null;
      
      if (fiber.memoizedProps && fiber.memoizedProps.value) {
        const value = fiber.memoizedProps.value;
        if (value.workoutHistory || value.getWorkoutHistory) {
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
      console.log('✅ Contexte trouvé !');
      
      // Analyser workoutHistory
      if (context.workoutHistory) {
        console.log('📊 workoutHistory trouvé:', context.workoutHistory);
        console.log('📊 Nombre de sessions:', context.workoutHistory.length);
        
        if (context.workoutHistory.length > 0) {
          console.log('📊 Première session:', context.workoutHistory[0]);
          console.log('📊 Dernière session:', context.workoutHistory[context.workoutHistory.length - 1]);
          
          // Analyser la structure des exercices
          const firstSession = context.workoutHistory[0];
          if (firstSession.exercises) {
            console.log('📊 Exercices de la première session:', firstSession.exercises);
            console.log('📊 Noms des exercices:', firstSession.exercises.map(ex => ex.name));
          }
        }
      } else if (context.getWorkoutHistory) {
        console.log('🔧 getWorkoutHistory trouvé, appel de la fonction...');
        const history = context.getWorkoutHistory();
        console.log('📊 Résultat de getWorkoutHistory:', history);
      } else {
        console.log('❌ Ni workoutHistory ni getWorkoutHistory trouvé dans le contexte');
        console.log('🔍 Propriétés disponibles:', Object.keys(context));
      }
      
      // Analyser les données brutes
      if (context.data) {
        console.log('📊 Données brutes (data):', context.data);
      }
      
    } else {
      console.log('❌ Contexte WorkoutContext non trouvé');
    }
  } else {
    console.log('❌ Fiber React non trouvé');
  }
}

// 3. Analyser la base de données IndexedDB directement
async function analyzeIndexedDB() {
  console.log('🗄️ ANALYSE DE LA BASE DE DONNÉES INDEXEDDB');
  console.log('==========================================');
  
  try {
    // Ouvrir la base de données
    const dbRequest = indexedDB.open('WorkoutTrackerDB', 1);
    
    dbRequest.onsuccess = function(event) {
      const db = event.target.result;
      console.log('✅ Base de données ouverte');
      console.log('📊 Stores disponibles:', Array.from(db.objectStoreNames));
      
      // Lire les données de workout
      const transaction = db.transaction(['workoutData'], 'readonly');
      const store = transaction.objectStore('workoutData');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = function() {
        const allData = getAllRequest.result;
        console.log('📊 Toutes les données workout:', allData);
        
        if (allData.length > 0) {
          console.log('📊 Première entrée:', allData[0]);
          console.log('📊 Structure des données:', Object.keys(allData[0]));
          
          // Analyser les exercices
          allData.forEach((entry, index) => {
            console.log(`📊 Entrée ${index} (${entry.date}):`, entry);
            if (entry.exercises) {
              console.log(`  - Exercices:`, entry.exercises.map(ex => `${ex.name}: ${ex.reps} reps`));
            }
          });
        }
      };
    };
    
    dbRequest.onerror = function() {
      console.log('❌ Erreur ouverture base de données');
    };
    
  } catch (error) {
    console.log('❌ Erreur analyse IndexedDB:', error);
  }
}

// Exécuter les analyses
console.log('🚀 Démarrage de l\'analyse...');
analyzeWorkoutHistory();
analyzeIndexedDB();

console.log('📝 INSTRUCTIONS:');
console.log('1. Ouvrez l\'onglet Graphiques');
console.log('2. Ouvrez la console développeur (F12)');
console.log('3. Collez ce script et appuyez sur Entrée');
console.log('4. Analysez les résultats pour identifier le problème');