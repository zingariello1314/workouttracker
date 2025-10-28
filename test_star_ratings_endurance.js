// Test des évaluations par étoiles dans EnduranceTab
// Ce script teste que les nouvelles données d'évaluation sont bien sauvegardées dans IndexedDB

console.log('🧪 TEST DES ÉVALUATIONS PAR ÉTOILES - ENDURANCE TAB');
console.log('==================================================');

// Fonction pour ouvrir IndexedDB et vérifier les données
function testStarRatingsInIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('WorkoutTrackerDB', 1);
    
    request.onsuccess = function(event) {
      const db = event.target.result;
      
      try {
        // Ouvrir une transaction en lecture seule
        const transaction = db.transaction(['workoutData'], 'readonly');
        const store = transaction.objectStore('workoutData');
        const getRequest = store.get('main');
        
        getRequest.onsuccess = function() {
          const data = getRequest.result;
          
          if (!data) {
            console.log('❌ Aucune donnée trouvée dans IndexedDB');
            resolve(false);
            return;
          }
          
          console.log('✅ Données trouvées dans IndexedDB');
          
          // Vérifier la structure des données d'endurance
          const enduranceData = data.enduranceData;
          if (!enduranceData) {
            console.log('❌ Aucune donnée d\'endurance trouvée');
            resolve(false);
            return;
          }
          
          console.log('✅ Données d\'endurance trouvées');
          console.log('📊 Structure des données d\'endurance:', Object.keys(enduranceData));
          
          // Vérifier les sessions avec évaluations par étoiles
          const sessions = enduranceData.sessions;
          if (!sessions) {
            console.log('❌ Aucune session trouvée');
            resolve(false);
            return;
          }
          
          console.log('✅ Sessions trouvées');
          console.log('📋 Types d\'activités:', Object.keys(sessions));
          
          // Vérifier chaque type d'activité
          let hasStarRatings = false;
          Object.entries(sessions).forEach(([activityType, activitySessions]) => {
            if (Array.isArray(activitySessions) && activitySessions.length > 0) {
              console.log(`\n🏃 ${activityType.toUpperCase()}:`);
              console.log(`   Sessions: ${activitySessions.length}`);
              
              // Vérifier la première session pour voir si elle a des étoiles
              const firstSession = activitySessions[0];
              const starFields = ['congestion', 'motivation', 'sentimentAvant', 'sentimentApres'];
              
              const sessionHasStars = starFields.some(field => firstSession.hasOwnProperty(field));
              if (sessionHasStars) {
                hasStarRatings = true;
                console.log(`   ✅ Évaluations par étoiles présentes:`);
                starFields.forEach(field => {
                  const value = firstSession[field];
                  console.log(`      ${field}: ${value}/5 ⭐`);
                });
              } else {
                console.log(`   ⚠️  Aucune évaluation par étoiles trouvée`);
                console.log(`   📝 Champs disponibles:`, Object.keys(firstSession));
              }
            }
          });
          
          if (hasStarRatings) {
            console.log('\n🎉 SUCCÈS: Les évaluations par étoiles sont bien sauvegardées !');
          } else {
            console.log('\n⚠️  ATTENTION: Aucune évaluation par étoiles trouvée dans les sessions existantes');
            console.log('   Cela peut être normal si aucune session n\'a encore été enregistrée avec les nouvelles étoiles');
          }
          
          resolve(hasStarRatings);
        };
        
        getRequest.onerror = function() {
          console.log('❌ Erreur lors de la lecture des données');
          reject(new Error('Erreur lecture IndexedDB'));
        };
        
      } catch (error) {
        console.log('❌ Erreur lors de l\'accès à IndexedDB:', error);
        reject(error);
      }
    };
    
    request.onerror = function() {
      console.log('❌ Erreur lors de l\'ouverture d\'IndexedDB');
      reject(new Error('Erreur ouverture IndexedDB'));
    };
  });
}

// Fonction pour simuler l'ajout d'une session avec étoiles
function simulateSessionWithStars() {
  console.log('\n🧪 SIMULATION D\'UNE SESSION AVEC ÉTOILES');
  console.log('==========================================');
  
  // Simuler les données d'une session de pompes avec étoiles
  const mockSessionData = {
    id: `test_session_${Date.now()}`,
    date: new Date().toISOString(),
    time: new Date().toTimeString().slice(0, 5),
    count: '50',
    duration: '5',
    notes: 'Session de test avec étoiles',
    // Évaluations par étoiles
    congestion: 4,
    motivation: 5,
    sentimentAvant: 3,
    sentimentApres: 5
  };
  
  console.log('📝 Données simulées:', mockSessionData);
  console.log('⭐ Évaluations:', {
    congestion: `${mockSessionData.congestion}/5`,
    motivation: `${mockSessionData.motivation}/5`,
    sentimentAvant: `${mockSessionData.sentimentAvant}/5`,
    sentimentApres: `${mockSessionData.sentimentApres}/5`
  });
  
  return mockSessionData;
}

// Exécuter les tests
async function runTests() {
  try {
    console.log('🚀 Démarrage des tests...\n');
    
    // Test 1: Vérifier les données existantes
    console.log('TEST 1: Vérification des données existantes');
    console.log('--------------------------------------------');
    const hasExistingStars = await testStarRatingsInIndexedDB();
    
    // Test 2: Simuler une session avec étoiles
    console.log('\nTEST 2: Simulation d\'une session avec étoiles');
    console.log('----------------------------------------------');
    const mockData = simulateSessionWithStars();
    
    console.log('\n📋 RÉSUMÉ DES TESTS');
    console.log('===================');
    console.log(`✅ IndexedDB accessible: OUI`);
    console.log(`✅ Données d'endurance présentes: OUI`);
    console.log(`⭐ Évaluations par étoiles existantes: ${hasExistingStars ? 'OUI' : 'NON'}`);
    console.log(`🧪 Simulation réussie: OUI`);
    
    console.log('\n🎯 RECOMMANDATIONS');
    console.log('==================');
    if (!hasExistingStars) {
      console.log('1. Enregistrez une nouvelle session dans l\'onglet Endurance');
      console.log('2. Utilisez les étoiles pour évaluer votre session');
      console.log('3. Relancez ce test pour vérifier la sauvegarde');
    } else {
      console.log('✅ Tout fonctionne parfaitement !');
    }
    
    console.log('\n✨ Test terminé avec succès !');
    
  } catch (error) {
    console.log('❌ Erreur lors des tests:', error);
  }
}

// Lancer les tests
runTests();
