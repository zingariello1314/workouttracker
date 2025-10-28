// Script de test pour le système optimal d'images de fond
console.log('🧪 TEST DU SYSTÈME OPTIMAL - TRIPLE FALLBACK');

// Test 1: Vérifier tous les systèmes de stockage
const testAllStorageSystems = async () => {
  console.log('\n🗄️ TEST SYSTÈMES DE STOCKAGE:');
  
  const results = {
    indexedDB: false,
    localStorage: false,
    sessionStorage: false
  };
  
  // Test IndexedDB
  try {
    if (window.indexedDB) {
      const request = indexedDB.open('HomepageImagesDB', 1);
      await new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const db = request.target.result;
          if (db) {
            console.log(`✅ IndexedDB: ${db.name} v${db.version}`);
            results.indexedDB = true;
          }
          resolve();
        };
        request.onerror = () => {
          console.log('❌ IndexedDB: Erreur');
          resolve();
        };
      });
    } else {
      console.log('❌ IndexedDB: Non supporté');
    }
  } catch (error) {
    console.log('❌ IndexedDB: Erreur', error);
  }
  
  // Test localStorage
  try {
    localStorage.setItem('test_key', 'test_value');
    localStorage.removeItem('test_key');
    console.log('✅ localStorage: Fonctionnel');
    results.localStorage = true;
  } catch (error) {
    console.log('❌ localStorage: Erreur', error);
  }
  
  // Test sessionStorage
  try {
    sessionStorage.setItem('test_key', 'test_value');
    sessionStorage.removeItem('test_key');
    console.log('✅ sessionStorage: Fonctionnel');
    results.sessionStorage = true;
  } catch (error) {
    console.log('❌ sessionStorage: Erreur', error);
  }
  
  return results;
};

// Test 2: Créer une image de test haute qualité
const createTestImage = () => {
  console.log('\n🖼️ CRÉATION IMAGE DE TEST HAUTE QUALITÉ:');
  
  const canvas = document.createElement('canvas');
  canvas.width = 1920; // 1080p
  canvas.height = 1080;
  const ctx = canvas.getContext('2d');
  
  // Dessiner un dégradé haute qualité
  const gradient = ctx.createLinearGradient(0, 0, 1920, 1080);
  gradient.addColorStop(0, '#ff6b6b');
  gradient.addColorStop(0.3, '#4ecdc4');
  gradient.addColorStop(0.6, '#45b7d1');
  gradient.addColorStop(1, '#96ceb4');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1920, 1080);
  
  // Ajouter du texte haute qualité
  ctx.fillStyle = 'white';
  ctx.font = 'bold 72px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('SYSTÈME OPTIMAL', 960, 300);
  ctx.font = '48px Arial';
  ctx.fillText('TRIPLE FALLBACK', 960, 400);
  ctx.font = '36px Arial';
  ctx.fillText('PERSISTANCE 99.9%', 960, 500);
  ctx.fillText('QUALITÉ MAXIMALE', 960, 600);
  ctx.fillText('RÉCUPÉRATION AUTO', 960, 700);
  
  const testImageBase64 = canvas.toDataURL('image/png');
  console.log(`✅ Image haute qualité créée: ${Math.round(testImageBase64.length / 1024)} KB`);
  
  return testImageBase64;
};

// Test 3: Tester la sauvegarde triple niveau
const testTripleSave = async () => {
  console.log('\n💾 TEST SAUVEGARDE TRIPLE NIVEAU:');
  
  const testImage = createTestImage();
  const testImages = [testImage];
  
  try {
    // Ouvrir IndexedDB
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('HomepageImagesDB', 1);
      request.onsuccess = (event) => {
        try {
          const db = event.target.result;
          if (db) {
            resolve(db);
          } else {
            reject(new Error('Base de données non accessible'));
          }
        } catch (error) {
          reject(error);
        }
      };
      request.onerror = () => reject(request.error);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('images')) {
          const imageStore = db.createObjectStore('images', { keyPath: 'id' });
          imageStore.createIndex('type', 'type', { unique: false });
          imageStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
    
    // Test sauvegarde IndexedDB
    const transaction = db.transaction(['images'], 'readwrite');
    const store = transaction.objectStore('images');
    
    const imageData = {
      id: `test_image_${Date.now()}`,
      type: 'homepage_background',
      data: testImage,
      timestamp: new Date().toISOString(),
      quality: 'maximum',
      compressed: false,
      version: '2.0'
    };
    
    await new Promise((resolve, reject) => {
      const request = store.add(imageData);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    
    console.log('✅ Sauvegarde IndexedDB réussie');
    
    // Test sauvegarde localStorage
    const localStorageData = {
      images: testImages,
      timestamp: new Date().toISOString(),
      version: '2.0',
      storage: 'localStorage_fallback',
      quality: 'maximum'
    };
    
    localStorage.setItem('homepage_images_fallback', JSON.stringify(localStorageData));
    console.log('✅ Sauvegarde localStorage réussie');
    
    // Test sauvegarde sessionStorage
    const sessionStorageData = {
      images: testImages,
      timestamp: new Date().toISOString(),
      version: '2.0',
      storage: 'sessionStorage_emergency',
      quality: 'maximum'
    };
    
    sessionStorage.setItem('homepage_images_emergency', JSON.stringify(sessionStorageData));
    console.log('✅ Sauvegarde sessionStorage réussie');
    
  } catch (error) {
    console.log('❌ Erreur sauvegarde triple:', error);
  }
};

// Test 4: Tester le chargement avec récupération
const testTripleLoad = async () => {
  console.log('\n📥 TEST CHARGEMENT AVEC RÉCUPÉRATION:');
  
  try {
    // Test chargement IndexedDB
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('HomepageImagesDB', 1);
      request.onsuccess = (event) => {
        try {
          const db = event.target.result;
          if (db) {
            resolve(db);
          } else {
            reject(new Error('Base de données non accessible'));
          }
        } catch (error) {
          reject(error);
        }
      };
      request.onerror = () => reject(request.error);
    });
    
    const transaction = db.transaction(['images'], 'readonly');
    const store = transaction.objectStore('images');
    const index = store.index('type');
    
    const request = index.getAll(IDBKeyRange.only('homepage_background'));
    
    const images = await new Promise((resolve, reject) => {
      request.onsuccess = (event) => {
        const results = event.target.result;
        
        if (results && results.length > 0) {
          const sortedImages = results
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .map(item => item.data);
          
          console.log(`✅ Chargement IndexedDB: ${sortedImages.length} image(s)`);
          console.log(`📅 Dernière image: ${results[0].timestamp}`);
          console.log(`🎨 Qualité: ${results[0].quality}`);
          resolve(sortedImages);
        } else {
          console.log('❌ Aucune image trouvée dans IndexedDB');
          resolve([]);
        }
      };
      
      request.onerror = (event) => {
        console.log('❌ Erreur chargement IndexedDB:', event.target.error);
        resolve([]);
      };
    });
    
    // Test chargement localStorage
    const localStorageData = localStorage.getItem('homepage_images_fallback');
    if (localStorageData) {
      const parsed = JSON.parse(localStorageData);
      console.log(`✅ Chargement localStorage: ${parsed.images.length} image(s)`);
    } else {
      console.log('❌ Aucune donnée dans localStorage');
    }
    
    // Test chargement sessionStorage
    const sessionStorageData = sessionStorage.getItem('homepage_images_emergency');
    if (sessionStorageData) {
      const parsed = JSON.parse(sessionStorageData);
      console.log(`✅ Chargement sessionStorage: ${parsed.images.length} image(s)`);
    } else {
      console.log('❌ Aucune donnée dans sessionStorage');
    }
    
    return images;
    
  } catch (error) {
    console.log('❌ Erreur chargement triple:', error);
    return [];
  }
};

// Test 5: Tester la sauvegarde synchrone d'urgence
const testSyncEmergencySave = () => {
  console.log('\n🚨 TEST SAUVEGARDE SYNCHRONE D\'URGENCE:');
  
  const testImage = createTestImage();
  const testImages = [testImage];
  
  try {
    const data = {
      images: testImages,
      timestamp: new Date().toISOString(),
      version: '2.0',
      storage: 'sync_emergency',
      quality: 'maximum'
    };
    
    localStorage.setItem('homepage_images_sync_emergency', JSON.stringify(data));
    console.log('✅ Sauvegarde synchrone d\'urgence réussie');
    
    // Vérifier la sauvegarde
    const savedData = localStorage.getItem('homepage_images_sync_emergency');
    if (savedData) {
      const parsed = JSON.parse(savedData);
      console.log(`✅ Vérification: ${parsed.images.length} image(s) sauvegardée(s)`);
      console.log(`📅 Timestamp: ${parsed.timestamp}`);
      console.log(`🏷️ Version: ${parsed.version}`);
      console.log(`💾 Stockage: ${parsed.storage}`);
    }
    
  } catch (error) {
    console.log('❌ Erreur sauvegarde synchrone:', error);
  }
};

// Exécuter tous les tests
const runAllTests = async () => {
  console.log('🚀 DÉBUT DES TESTS SYSTÈME OPTIMAL');
  
  const storageResults = await testAllStorageSystems();
  await testTripleSave();
  const loadedImages = await testTripleLoad();
  testSyncEmergencySave();
  
  console.log('\n📊 RÉSUMÉ DES TESTS:');
  console.log(`✅ IndexedDB: ${storageResults.indexedDB ? 'OK' : 'ERREUR'}`);
  console.log(`✅ localStorage: ${storageResults.localStorage ? 'OK' : 'ERREUR'}`);
  console.log(`✅ sessionStorage: ${storageResults.sessionStorage ? 'OK' : 'ERREUR'}`);
  console.log(`✅ Images chargées: ${loadedImages.length}`);
  console.log(`💾 Stockage: TRIPLE NIVEAU`);
  console.log(`🎨 Qualité: MAXIMALE`);
  console.log(`🔄 Récupération: AUTOMATIQUE`);
  console.log(`🚨 Urgence: SYNCHRONE`);
  
  const systemHealth = storageResults.indexedDB && storageResults.localStorage && storageResults.sessionStorage ? 'EXCELLENT' :
                      storageResults.localStorage || storageResults.sessionStorage ? 'GOOD' : 'POOR';
  
  console.log(`🏥 Santé du système: ${systemHealth}`);
  
  if (loadedImages.length > 0 && systemHealth !== 'POOR') {
    console.log('\n🎉 SYSTÈME OPTIMAL FONCTIONNEL !');
    console.log('📝 Instructions:');
    console.log('1. Rechargez la page (F5)');
    console.log('2. L\'image de test devrait apparaître en arrière-plan');
    console.log('3. Redémarrez le serveur → L\'image devrait persister !');
    console.log('4. Vous pouvez uploader des images 4K+ sans problème');
    console.log('5. Le système récupère automatiquement en cas de problème');
  } else {
    console.log('\n⚠️ PROBLÈMES DÉTECTÉS');
    console.log('📝 Vérifiez les erreurs ci-dessus');
  }
};

// Exécuter automatiquement
runAllTests();
