// Script de diagnostic et réparation IndexedDB
// Exécuter dans la console du navigateur pour diagnostiquer et réparer les problèmes

console.log('🔧 DIAGNOSTIC ET RÉPARATION INDEXEDDB');
console.log('=====================================');

// 1. DIAGNOSTIC COMPLET
async function diagnosticComplet() {
  console.log('\n📊 DIAGNOSTIC COMPLET DES BASES INDEXEDDB');
  
  const bases = [
    { name: 'HomepageImagesDB', version: 1, stores: ['images'] },
    { name: 'WorkoutTrackerDB', version: 1, stores: ['workouts'] },
    { name: 'WorkoutTrackerContextDB', version: 1, stores: ['context'] }
  ];
  
  for (const base of bases) {
    try {
      console.log(`\n🔍 Vérification de ${base.name}...`);
      
      const request = indexedDB.open(base.name);
      
      request.onsuccess = () => {
        const db = request.result;
        console.log(`✅ ${base.name} v${db.version} - Object stores:`, Array.from(db.objectStoreNames));
        
        // Vérifier si les object stores attendus existent
        for (const storeName of base.stores) {
          if (db.objectStoreNames.contains(storeName)) {
            console.log(`  ✅ Object store '${storeName}' existe`);
          } else {
            console.log(`  ❌ Object store '${storeName}' MANQUANT`);
          }
        }
        
        db.close();
      };
      
      request.onerror = () => {
        console.log(`❌ Erreur ouverture ${base.name}:`, request.error);
      };
      
      // Attendre un peu pour que la requête se termine
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      console.log(`❌ Erreur diagnostic ${base.name}:`, error);
    }
  }
}

// 2. RÉPARATION DE LA BASE HOMEPAGEIMAGESDB
async function reparerHomepageImagesDB() {
  console.log('\n🔧 RÉPARATION DE HOMEPAGEIMAGESDB');
  
  return new Promise((resolve, reject) => {
    // Fermer toutes les connexions existantes
    const deleteRequest = indexedDB.deleteDatabase('HomepageImagesDB');
    
    deleteRequest.onsuccess = () => {
      console.log('✅ Ancienne base HomepageImagesDB supprimée');
      
      // Recréer la base avec la bonne structure
      const createRequest = indexedDB.open('HomepageImagesDB', 1);
      
      createRequest.onupgradeneeded = (event) => {
        const db = event.target.result;
        console.log('🔄 Création de la nouvelle structure...');
        
        // Créer l'object store 'images'
        if (!db.objectStoreNames.contains('images')) {
          const imageStore = db.createObjectStore('images', { keyPath: 'id' });
          imageStore.createIndex('type', 'type', { unique: false });
          imageStore.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('✅ Object store "images" créé avec ses index');
        }
      };
      
      createRequest.onsuccess = () => {
        const db = createRequest.result;
        console.log('✅ Nouvelle base HomepageImagesDB créée avec succès');
        console.log('📋 Object stores disponibles:', Array.from(db.objectStoreNames));
        db.close();
        resolve();
      };
      
      createRequest.onerror = () => {
        console.error('❌ Erreur création nouvelle base:', createRequest.error);
        reject(createRequest.error);
      };
    };
    
    deleteRequest.onerror = () => {
      console.error('❌ Erreur suppression ancienne base:', deleteRequest.error);
      reject(deleteRequest.error);
    };
  });
}

// 3. VÉRIFICATION DU LOCALSTORAGE ET SESSIONSTORAGE
function verifierStorages() {
  console.log('\n📦 VÉRIFICATION DES AUTRES STOCKAGES');
  
  const keys = [
    'homepage_images_fallback',
    'homepage_images_emergency', 
    'homepage_images_sync_emergency',
    'homepage_images_primary',
    'homepage_images_backup'
  ];
  
  console.log('🔍 localStorage:');
  for (const key of keys) {
    const data = localStorage.getItem(key);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        const imageCount = parsed.images ? parsed.images.length : 0;
        console.log(`  ✅ ${key}: ${imageCount} images (${parsed.version || 'version inconnue'})`);
      } catch (error) {
        console.log(`  ⚠️ ${key}: données corrompues`);
      }
    } else {
      console.log(`  📭 ${key}: vide`);
    }
  }
  
  console.log('🔍 sessionStorage:');
  for (const key of keys) {
    const data = sessionStorage.getItem(key);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        const imageCount = parsed.images ? parsed.images.length : 0;
        console.log(`  ✅ ${key}: ${imageCount} images`);
      } catch (error) {
        console.log(`  ⚠️ ${key}: données corrompues`);
      }
    } else {
      console.log(`  📭 ${key}: vide`);
    }
  }
}

// 4. MIGRATION DES DONNÉES EXISTANTES
async function migrerDonnees() {
  console.log('\n🔄 MIGRATION DES DONNÉES EXISTANTES');
  
  const keys = [
    'homepage_images_fallback',
    'homepage_images_emergency',
    'homepage_images_sync_emergency'
  ];
  
  let imagesTrouvees = [];
  
  for (const key of keys) {
    const data = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (parsed.images && Array.isArray(parsed.images)) {
          imagesTrouvees = [...imagesTrouvees, ...parsed.images];
          console.log(`✅ ${key}: ${parsed.images.length} images trouvées`);
        }
      } catch (error) {
        console.log(`⚠️ ${key}: erreur parsing`);
      }
    }
  }
  
  if (imagesTrouvees.length > 0) {
    console.log(`📊 Total: ${imagesTrouvees.length} images à migrer`);
    
    // Sauvegarder dans la nouvelle base IndexedDB
    try {
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open('HomepageImagesDB', 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      const transaction = db.transaction(['images'], 'readwrite');
      const store = transaction.objectStore('images');
      
      for (let i = 0; i < imagesTrouvees.length; i++) {
        const imageData = {
          id: `homepage_bg_${Date.now()}_${i}`,
          type: 'homepage_background',
          data: imagesTrouvees[i],
          timestamp: new Date().toISOString(),
          quality: 'maximum',
          compressed: false,
          version: '2.0'
        };
        
        store.add(imageData);
      }
      
      await new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
      
      console.log('✅ Migration vers IndexedDB réussie');
      db.close();
      
    } catch (error) {
      console.error('❌ Erreur migration:', error);
    }
  } else {
    console.log('📭 Aucune image à migrer');
  }
}

// 5. FONCTION PRINCIPALE DE RÉPARATION
async function reparerSystemeComplet() {
  console.log('🚀 DÉMARRAGE DE LA RÉPARATION COMPLÈTE');
  
  try {
    // 1. Diagnostic
    await diagnosticComplet();
    
    // 2. Vérification des autres stockages
    verifierStorages();
    
    // 3. Réparation de la base IndexedDB
    await reparerHomepageImagesDB();
    
    // 4. Migration des données
    await migrerDonnees();
    
    // 5. Vérification finale
    console.log('\n✅ RÉPARATION TERMINÉE');
    console.log('🔄 Rechargez la page pour tester le système');
    
  } catch (error) {
    console.error('❌ Erreur lors de la réparation:', error);
  }
}

// EXPORT DES FONCTIONS POUR UTILISATION
window.reparerIndexedDB = {
  diagnostic: diagnosticComplet,
  reparer: reparerHomepageImagesDB,
  migrer: migrerDonnees,
  complet: reparerSystemeComplet,
  verifier: verifierStorages
};

console.log('\n📋 FONCTIONS DISPONIBLES:');
console.log('- window.reparerIndexedDB.complet() : Réparation complète');
console.log('- window.reparerIndexedDB.diagnostic() : Diagnostic seulement');
console.log('- window.reparerIndexedDB.reparer() : Réparation IndexedDB seulement');
console.log('- window.reparerIndexedDB.migrer() : Migration des données seulement');
console.log('- window.reparerIndexedDB.verifier() : Vérification des stockages');

// Lancer automatiquement le diagnostic
diagnosticComplet();
