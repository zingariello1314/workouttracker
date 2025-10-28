// SOLUTION DIRECTE POUR RÉPARER INDEXEDDB
// Copier-coller ce code dans la console du navigateur

console.log('🔧 RÉPARATION DIRECTE INDEXEDDB');
console.log('================================');

// 1. SUPPRIMER COMPLÈTEMENT LA BASE CORROMPUE
async function supprimerEtRecreerBase() {
  console.log('🗑️ Suppression de la base corrompue...');
  
  return new Promise((resolve, reject) => {
    const deleteRequest = indexedDB.deleteDatabase('HomepageImagesDB');
    
    deleteRequest.onsuccess = () => {
      console.log('✅ Base supprimée avec succès');
      
      // Attendre un peu puis recréer
      setTimeout(() => {
        console.log('🔄 Recréation de la base...');
        
        const createRequest = indexedDB.open('HomepageImagesDB', 1);
        
        createRequest.onupgradeneeded = (event) => {
          const db = event.target.result;
          console.log('📦 Création de l\'object store "images"...');
          
          // Créer l'object store 'images'
          const imageStore = db.createObjectStore('images', { keyPath: 'id' });
          imageStore.createIndex('type', 'type', { unique: false });
          imageStore.createIndex('timestamp', 'timestamp', { unique: false });
          
          console.log('✅ Object store "images" créé avec succès');
          console.log('📋 Index créés: type, timestamp');
        };
        
        createRequest.onsuccess = () => {
          const db = createRequest.result;
          console.log('✅ Nouvelle base créée avec succès');
          console.log('📋 Object stores disponibles:', Array.from(db.objectStoreNames));
          
          // Vérifier que l'object store existe
          if (db.objectStoreNames.contains('images')) {
            console.log('✅ Vérification: Object store "images" existe');
          } else {
            console.log('❌ ERREUR: Object store "images" manquant');
          }
          
          db.close();
          resolve();
        };
        
        createRequest.onerror = () => {
          console.error('❌ Erreur création:', createRequest.error);
          reject(createRequest.error);
        };
      }, 500);
    };
    
    deleteRequest.onerror = () => {
      console.error('❌ Erreur suppression:', deleteRequest.error);
      reject(deleteRequest.error);
    };
  });
}

// 2. TESTER LA NOUVELLE BASE
async function testerNouvelleBase() {
  console.log('\n🧪 TEST DE LA NOUVELLE BASE');
  
  try {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('HomepageImagesDB', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    console.log('✅ Base ouverte avec succès');
    console.log('📋 Version:', db.version);
    console.log('📋 Object stores:', Array.from(db.objectStoreNames));
    
    // Tester une transaction
    const transaction = db.transaction(['images'], 'readwrite');
    const store = transaction.objectStore('images');
    
    console.log('✅ Transaction créée avec succès');
    console.log('✅ Object store "images" accessible');
    
    // Tester l'ajout d'une donnée de test
    const testData = {
      id: 'test_' + Date.now(),
      type: 'test',
      data: 'data:image/png;base64,test',
      timestamp: new Date().toISOString()
    };
    
    const addRequest = store.add(testData);
    
    addRequest.onsuccess = () => {
      console.log('✅ Test d\'ajout réussi');
      
      // Supprimer la donnée de test
      const deleteRequest = store.delete(testData.id);
      deleteRequest.onsuccess = () => {
        console.log('✅ Test de suppression réussi');
        console.log('🎉 BASE INDEXEDDB FONCTIONNELLE !');
        db.close();
      };
    };
    
    addRequest.onerror = () => {
      console.error('❌ Test d\'ajout échoué:', addRequest.error);
      db.close();
    };
    
  } catch (error) {
    console.error('❌ Erreur test:', error);
  }
}

// 3. FONCTION PRINCIPALE
async function reparerIndexedDB() {
  try {
    await supprimerEtRecreerBase();
    await testerNouvelleBase();
    
    console.log('\n🎉 RÉPARATION TERMINÉE AVEC SUCCÈS !');
    console.log('🔄 Rechargez maintenant la page pour tester');
    
  } catch (error) {
    console.error('❌ Erreur réparation:', error);
  }
}

// LANCER LA RÉPARATION
reparerIndexedDB();
