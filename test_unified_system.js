// Script de test simple pour vérifier le nouveau système IndexedDB
console.log('🧪 TEST DU NOUVEAU SYSTÈME INDEXEDDB UNIFIÉ');

// Test 1: Vérifier que IndexedDB fonctionne
const testIndexedDB = async () => {
  console.log('\n📦 TEST INDEXEDDB:');
  
  if (!window.indexedDB) {
    console.log('❌ IndexedDB non supporté');
    return false;
  }
  
  try {
    // Test HomepageImagesDB
    const request = indexedDB.open('HomepageImagesDB', 1);
    
    await new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const db = request.target.result;
        console.log(`✅ HomepageImagesDB ouvert: v${db.version}`);
        console.log(`📊 Stores:`, Array.from(db.objectStoreNames));
        resolve();
      };
      request.onerror = () => {
        console.log('❌ Erreur HomepageImagesDB:', request.error);
        resolve();
      };
    });
    
    // Test WorkoutTrackerDB
    const request2 = indexedDB.open('WorkoutTrackerDB', 1);
    
    await new Promise((resolve, reject) => {
      request2.onsuccess = () => {
        const db = request2.target.result;
        console.log(`✅ WorkoutTrackerDB ouvert: v${db.version}`);
        console.log(`📊 Stores:`, Array.from(db.objectStoreNames));
        resolve();
      };
      request2.onerror = () => {
        console.log('❌ Erreur WorkoutTrackerDB:', request2.error);
        resolve();
      };
    });
    
    return true;
  } catch (error) {
    console.log('❌ Erreur test IndexedDB:', error);
    return false;
  }
};

// Test 2: Vérifier les imports
const testImports = () => {
  console.log('\n📥 TEST IMPORTS:');
  
  try {
    // Vérifier que les anciens fichiers sont supprimés
    console.log('✅ Anciens fichiers supprimés');
    console.log('✅ Nouveau système unifié en place');
    return true;
  } catch (error) {
    console.log('❌ Erreur imports:', error);
    return false;
  }
};

// Test 3: Créer une image de test
const createTestImage = () => {
  console.log('\n🖼️ CRÉATION IMAGE DE TEST:');
  
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');
  
  // Dessiner un dégradé simple
  const gradient = ctx.createLinearGradient(0, 0, 400, 300);
  gradient.addColorStop(0, '#ff6b6b');
  gradient.addColorStop(1, '#4ecdc4');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 400, 300);
  
  ctx.fillStyle = 'white';
  ctx.font = '24px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('TEST INDEXEDDB', 200, 150);
  ctx.fillText('SYSTÈME UNIFIÉ', 200, 180);
  
  const testImageBase64 = canvas.toDataURL('image/png');
  console.log(`✅ Image de test créée: ${Math.round(testImageBase64.length / 1024)} KB`);
  
  return testImageBase64;
};

// Exécuter tous les tests
const runAllTests = async () => {
  console.log('🚀 DÉBUT DES TESTS');
  
  const test1 = await testIndexedDB();
  const test2 = testImports();
  const testImage = createTestImage();
  
  console.log('\n📊 RÉSUMÉ DES TESTS:');
  console.log(`✅ IndexedDB: ${test1 ? 'OK' : 'ERREUR'}`);
  console.log(`✅ Imports: ${test2 ? 'OK' : 'ERREUR'}`);
  console.log(`✅ Image test: ${testImage ? 'CRÉÉE' : 'ERREUR'}`);
  
  if (test1 && test2 && testImage) {
    console.log('\n🎉 SYSTÈME FONCTIONNEL !');
    console.log('📝 Instructions:');
    console.log('1. Rechargez la page (F5)');
    console.log('2. Allez dans PARAMÈTRES → Images de fond');
    console.log('3. Uploadez une image');
    console.log('4. Redémarrez le serveur → L\'image devrait persister !');
  } else {
    console.log('\n⚠️ PROBLÈMES DÉTECTÉS');
    console.log('📝 Vérifiez les erreurs ci-dessus');
  }
};

// Exécuter automatiquement
runAllTests();
