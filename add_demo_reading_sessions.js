/**
 * Script pour ajouter des sessions de lecture de démonstration
 * À exécuter dans la console du navigateur (F12)
 */

console.log('📚 Ajout de sessions de lecture de démonstration...');

async function addDemoReadingSessions() {
  try {
    // Ouvrir IndexedDB
    const request = indexedDB.open('QuietQuestDB', 1);
    
    request.onsuccess = function(event) {
      const db = event.target.result;
      
      // Lire les livres existants
      const readTransaction = db.transaction(['books'], 'readonly');
      const readStore = readTransaction.objectStore('books');
      const getAllRequest = readStore.getAll();
      
      getAllRequest.onsuccess = function() {
        const books = getAllRequest.result;
        console.log(`📖 ${books.length} livre(s) trouvé(s)`);
        
        if (books.length === 0) {
          console.log('❌ Aucun livre trouvé. Ajoutez d\'abord des livres via l\'interface.');
          return;
        }
        
        // Ajouter des sessions de démonstration aux livres existants
        const updatedBooks = books.map((book, index) => {
          // Générer des sessions de lecture réalistes
          const sessions = [];
          const today = new Date();
          
          // Ajouter 5-10 sessions sur les 30 derniers jours
          const sessionCount = 5 + Math.floor(Math.random() * 6);
          
          for (let i = 0; i < sessionCount; i++) {
            const daysAgo = Math.floor(Math.random() * 30);
            const sessionDate = new Date(today);
            sessionDate.setDate(sessionDate.getDate() - daysAgo);
            
            const session = {
              id: `demo_session_${book.id}_${i}`,
              date: sessionDate.toISOString().split('T')[0],
              pagesRead: 15 + Math.floor(Math.random() * 35), // 15-50 pages
              durationMinutes: 20 + Math.floor(Math.random() * 40), // 20-60 minutes
              note: `Session de lecture ${i + 1}`
            };
            
            sessions.push(session);
          }
          
          // Trier les sessions par date
          sessions.sort((a, b) => a.date.localeCompare(b.date));
          
          return {
            ...book,
            readingSessions: [...(book.readingSessions || []), ...sessions]
          };
        });
        
        // Sauvegarder les livres mis à jour
        const writeTransaction = db.transaction(['books'], 'readwrite');
        const writeStore = writeTransaction.objectStore('books');
        
        let completed = 0;
        updatedBooks.forEach(book => {
          const putRequest = writeStore.put(book);
          putRequest.onsuccess = function() {
            completed++;
            if (completed === updatedBooks.length) {
              console.log('✅ Sessions de démonstration ajoutées avec succès !');
              console.log(`📊 ${updatedBooks.length} livre(s) mis à jour`);
              
              // Calculer le total des sessions ajoutées
              const totalSessions = updatedBooks.reduce((sum, book) => 
                sum + (book.readingSessions?.length || 0), 0
              );
              console.log(`📝 Total des sessions: ${totalSessions}`);
              
              console.log('\n🔄 Rechargez la page et allez dans l\'onglet Statistiques pour voir les données !');
            }
          };
          
          putRequest.onerror = function() {
            console.error(`❌ Erreur lors de la sauvegarde du livre: ${book.title}`);
          };
        });
        
        writeTransaction.onerror = function() {
          console.error('❌ Erreur lors de la transaction de sauvegarde');
        };
      };
      
      getAllRequest.onerror = function() {
        console.error('❌ Erreur lors de la lecture des livres');
      };
    };
    
    request.onerror = function() {
      console.error('❌ Erreur lors de l\'ouverture de la base de données');
    };
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Fonction pour créer un livre de démonstration avec sessions
async function createDemoBookWithSessions() {
  try {
    const request = indexedDB.open('QuietQuestDB', 1);
    
    request.onsuccess = function(event) {
      const db = event.target.result;
      
      const demoBook = {
        id: `demo_book_${Date.now()}`,
        title: 'Le Guide du Développeur Zen',
        author: 'Marie Dupont',
        year: 2023,
        genre: 'Développement Personnel',
        pages: 250,
        status: 'in-progress',
        shortSummary: 'Un guide pratique pour développer en toute sérénité.',
        longSummary: 'Ce livre explore les techniques de développement logiciel en adoptant une approche zen et mindful.',
        personalScore: 4,
        hasCover: false,
        hasPdf: false,
        createdAt: new Date().toISOString(),
        readingSessions: []
      };
      
      // Ajouter des sessions de lecture
      const today = new Date();
      for (let i = 0; i < 8; i++) {
        const sessionDate = new Date(today);
        sessionDate.setDate(sessionDate.getDate() - (i * 2));
        
        demoBook.readingSessions.push({
          id: `session_${i}`,
          date: sessionDate.toISOString().split('T')[0],
          pagesRead: 20 + Math.floor(Math.random() * 25),
          durationMinutes: 30 + Math.floor(Math.random() * 30),
          note: `Session ${i + 1} - Très intéressant !`
        });
      }
      
      // Trier par date
      demoBook.readingSessions.sort((a, b) => a.date.localeCompare(b.date));
      
      // Sauvegarder
      const transaction = db.transaction(['books'], 'readwrite');
      const store = transaction.objectStore('books');
      const addRequest = store.add(demoBook);
      
      addRequest.onsuccess = function() {
        console.log('✅ Livre de démonstration créé avec succès !');
        console.log(`📖 "${demoBook.title}" avec ${demoBook.readingSessions.length} sessions`);
        console.log('\n🔄 Rechargez la page pour voir le nouveau livre !');
      };
      
      addRequest.onerror = function() {
        console.error('❌ Erreur lors de la création du livre de démonstration');
      };
    };
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

console.log('🚀 Fonctions disponibles:');
console.log('1. addDemoReadingSessions() - Ajoute des sessions aux livres existants');
console.log('2. createDemoBookWithSessions() - Crée un nouveau livre avec sessions');
console.log('\nExécutez une de ces fonctions pour résoudre le problème des statistiques vides.');

// Auto-exécution si aucun livre n'existe
setTimeout(() => {
  const request = indexedDB.open('QuietQuestDB', 1);
  request.onsuccess = function(event) {
    const db = event.target.result;
    const transaction = db.transaction(['books'], 'readonly');
    const store = transaction.objectStore('books');
    const countRequest = store.count();
    
    countRequest.onsuccess = function() {
      if (countRequest.result === 0) {
        console.log('🎯 Aucun livre détecté, création automatique d\'un livre de démonstration...');
        createDemoBookWithSessions();
      } else {
        console.log(`📚 ${countRequest.result} livre(s) détecté(s). Exécutez addDemoReadingSessions() pour ajouter des sessions.`);
      }
    };
  };
}, 1000);