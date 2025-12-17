/**
 * Script de correction pour le problème de synchronisation
 * entre les sessions de lecture et les statistiques
 * À exécuter dans la console du navigateur (F12)
 */

console.log('=== CORRECTION SYNCHRONISATION SESSIONS ↔ STATISTIQUES ===');

async function fixStatisticsSync() {
  try {
    console.log('🔍 Diagnostic et correction en cours...');
    
    const request = indexedDB.open('QuietQuestDB', 1);
    
    request.onsuccess = function(event) {
      const db = event.target.result;
      const transaction = db.transaction(['books'], 'readwrite');
      const store = transaction.objectStore('books');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = function() {
        const books = getAllRequest.result;
        console.log(`📚 Livres trouvés: ${books.length}`);
        
        if (books.length === 0) {
          console.log('❌ Aucun livre trouvé. Créons des données de test...');
          createTestData(db);
          return;
        }
        
        let totalSessions = 0;
        let fixedBooks = 0;
        let sessionsFixed = 0;
        
        books.forEach((book, index) => {
          console.log(`\n📖 Analyse du livre ${index + 1}: "${book.title}"`);
          
          let bookModified = false;
          
          // Vérifier et corriger la structure du livre
          if (!book.id) {
            book.id = `book_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            bookModified = true;
            console.log(`   🔧 ID ajouté: ${book.id}`);
          }
          
          // Initialiser readingSessions si manquant
          if (!book.readingSessions) {
            book.readingSessions = [];
            bookModified = true;
            console.log(`   🔧 Array readingSessions initialisé`);
          }
          
          // Vérifier et corriger chaque session
          if (Array.isArray(book.readingSessions)) {
            book.readingSessions.forEach((session, sessionIndex) => {
              let sessionModified = false;
              
              // Ajouter un ID si manquant
              if (!session.id) {
                session.id = `session_${Date.now()}_${sessionIndex}_${Math.random().toString(36).substr(2, 9)}`;
                sessionModified = true;
              }
              
              // Corriger les types de données
              if (session.pagesRead && typeof session.pagesRead === 'string') {
                session.pagesRead = parseInt(session.pagesRead, 10) || 0;
                sessionModified = true;
              }
              if (session.durationMinutes && typeof session.durationMinutes === 'string') {
                session.durationMinutes = parseInt(session.durationMinutes, 10) || 0;
                sessionModified = true;
              }
              
              // Vérifier le format de la date
              if (session.date) {
                const dateStr = session.date.toString();
                if (!dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                  // Essayer de corriger la date
                  try {
                    const date = new Date(session.date);
                    if (!isNaN(date.getTime())) {
                      session.date = date.toISOString().split('T')[0];
                      sessionModified = true;
                    }
                  } catch (e) {
                    console.warn(`     ⚠️ Date invalide dans session ${sessionIndex + 1}: ${session.date}`);
                  }
                }
              }
              
              // Valeurs par défaut si manquantes
              if (session.pagesRead === undefined || session.pagesRead === null) {
                session.pagesRead = 0;
                sessionModified = true;
              }
              if (session.durationMinutes === undefined || session.durationMinutes === null) {
                session.durationMinutes = 0;
                sessionModified = true;
              }
              
              if (sessionModified) {
                sessionsFixed++;
                bookModified = true;
                console.log(`     🔧 Session ${sessionIndex + 1} corrigée`);
              }
            });
            
            totalSessions += book.readingSessions.length;
          }
          
          // Sauvegarder le livre si modifié
          if (bookModified) {
            store.put(book);
            fixedBooks++;
            console.log(`   ✅ Livre "${book.title}" corrigé et sauvegardé`);
          }
        });
        
        transaction.oncomplete = function() {
          console.log(`\n📊 RÉSUMÉ DES CORRECTIONS:`);
          console.log(`   Livres corrigés: ${fixedBooks}/${books.length}`);
          console.log(`   Sessions corrigées: ${sessionsFixed}`);
          console.log(`   Total sessions: ${totalSessions}`);
          
          if (totalSessions > 0) {
            console.log('\n✅ Données corrigées ! Testez maintenant les statistiques...');
            testStatisticsCalculation();
          } else {
            console.log('\n⚠️ Aucune session trouvée. Créons des données de test...');
            createTestData(db);
          }
        };
        
        transaction.onerror = function() {
          console.error('❌ Erreur lors de la sauvegarde');
        };
      };
    };
    
    request.onerror = function() {
      console.error('❌ Erreur lors de l\'ouverture de la base de données');
    };
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

function createTestData(db) {
  console.log('🧪 Création de données de test...');
  
  const testBooks = [
    {
      id: `book_test_${Date.now()}_1`,
      title: 'Le Petit Prince',
      author: 'Antoine de Saint-Exupéry',
      genre: 'Fiction',
      pages: 96,
      status: 'in-progress',
      readingSessions: [
        {
          id: `session_test_${Date.now()}_1`,
          date: '2025-12-09',
          pagesRead: 90,
          durationMinutes: 60,
          note: 'Session de test - 9 décembre'
        },
        {
          id: `session_test_${Date.now()}_2`,
          date: '2025-12-16',
          pagesRead: 10,
          durationMinutes: 20,
          note: 'Session de test - 16 décembre'
        }
      ]
    },
    {
      id: `book_test_${Date.now()}_2`,
      title: 'Les Misérables',
      author: 'Victor Hugo',
      genre: 'Classique',
      pages: 1200,
      status: 'in-progress',
      readingSessions: [
        {
          id: `session_test_${Date.now()}_3`,
          date: '2025-12-10',
          pagesRead: 50,
          durationMinutes: 45,
          note: 'Début de lecture'
        }
      ]
    }
  ];
  
  const transaction = db.transaction(['books'], 'readwrite');
  const store = transaction.objectStore('books');
  
  testBooks.forEach(book => {
    store.add(book);
    console.log(`📚 Livre de test ajouté: "${book.title}"`);
  });
  
  transaction.oncomplete = function() {
    console.log('✅ Données de test créées !');
    console.log('🔄 Rechargez la page et allez dans l\'onglet Statistiques');
  };
  
  transaction.onerror = function() {
    console.error('❌ Erreur lors de la création des données de test');
  };
}

function testStatisticsCalculation() {
  console.log('\n🧪 TEST DES CALCULS DE STATISTIQUES');
  
  // Simuler l'import des services (si disponibles)
  if (typeof window.SessionAggregator !== 'undefined') {
    console.log('✅ SessionAggregator disponible');
  } else {
    console.log('⚠️ SessionAggregator non disponible dans window');
  }
  
  // Tester avec les données actuelles
  const request = indexedDB.open('QuietQuestDB', 1);
  
  request.onsuccess = function(event) {
    const db = event.target.result;
    const transaction = db.transaction(['books'], 'readonly');
    const store = transaction.objectStore('books');
    const getAllRequest = store.getAll();
    
    getAllRequest.onsuccess = function() {
      const books = getAllRequest.result;
      
      // Simuler le calcul des statistiques
      const allSessions = [];
      
      books.forEach(book => {
        if (book.readingSessions && Array.isArray(book.readingSessions)) {
          book.readingSessions.forEach(session => {
            allSessions.push({
              ...session,
              bookId: book.id,
              bookTitle: book.title,
              bookAuthor: book.author,
              bookGenre: book.genre
            });
          });
        }
      });
      
      console.log(`📝 Sessions pour calcul: ${allSessions.length}`);
      
      if (allSessions.length > 0) {
        const totalPages = allSessions.reduce((sum, s) => sum + (s.pagesRead || 0), 0);
        const totalMinutes = allSessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
        const uniqueDates = new Set(allSessions.map(s => s.date)).size;
        
        console.log(`📊 MÉTRIQUES CALCULÉES:`);
        console.log(`   Total pages: ${totalPages}`);
        console.log(`   Total minutes: ${totalMinutes}`);
        console.log(`   Jours uniques: ${uniqueDates}`);
        
        if (totalPages > 0 || totalMinutes > 0) {
          console.log('✅ Les statistiques devraient maintenant s\'afficher !');
          console.log('🔄 Allez dans l\'onglet Statistiques pour vérifier');
        } else {
          console.log('❌ Toujours aucune donnée quantifiable');
        }
      } else {
        console.log('❌ Aucune session trouvée après correction');
      }
    };
  };
}

// Fonction pour nettoyer complètement et recommencer
function resetAndCreateFreshData() {
  console.log('🗑️ NETTOYAGE COMPLET ET CRÉATION DE NOUVELLES DONNÉES');
  
  const request = indexedDB.open('QuietQuestDB', 1);
  
  request.onsuccess = function(event) {
    const db = event.target.result;
    const transaction = db.transaction(['books'], 'readwrite');
    const store = transaction.objectStore('books');
    
    // Supprimer tous les livres existants
    const clearRequest = store.clear();
    
    clearRequest.onsuccess = function() {
      console.log('🗑️ Tous les livres supprimés');
      createTestData(db);
    };
  };
}

// Exécuter la correction
console.log('🚀 Démarrage de la correction...');
fixStatisticsSync();

console.log('\n📋 COMMANDES DISPONIBLES:');
console.log('• fixStatisticsSync() - Relancer la correction');
console.log('• testStatisticsCalculation() - Tester les calculs');
console.log('• resetAndCreateFreshData() - Nettoyer et créer de nouvelles données');

// Rendre les fonctions disponibles globalement
window.fixStatisticsSync = fixStatisticsSync;
window.testStatisticsCalculation = testStatisticsCalculation;
window.resetAndCreateFreshData = resetAndCreateFreshData;