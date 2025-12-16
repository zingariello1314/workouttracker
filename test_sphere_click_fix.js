/**
 * Script de test pour vérifier que les corrections de clic sur la sphère fonctionnent
 */

console.log('🧪 Test des corrections de clic sur la sphère');

function testSphereClickFix() {
  // Attendre que la sphère soit chargée
  const waitForSphere = () => {
    const sphere = document.querySelector('.books-dome-sphere');
    const items = document.querySelectorAll('.books-dome-item');
    
    if (!sphere || items.length === 0) {
      console.log('⏳ Attente de la sphère...');
      setTimeout(waitForSphere, 500);
      return;
    }
    
    console.log(`✅ Sphère trouvée avec ${items.length} livres`);
    runTests(items);
  };
  
  function runTests(items) {
    console.log('\n📋 Tests des corrections:');
    
    // Test 1: Vérifier les z-index
    console.log('\n1️⃣ Test des z-index:');
    items.forEach((item, index) => {
      if (index < 3) {
        const zIndex = getComputedStyle(item).zIndex;
        console.log(`  - Livre ${index + 1}: z-index = ${zIndex} ${zIndex >= 10 ? '✅' : '❌'}`);
      }
    });
    
    // Test 2: Vérifier pointer-events
    console.log('\n2️⃣ Test des pointer-events:');
    items.forEach((item, index) => {
      if (index < 3) {
        const pointerEvents = getComputedStyle(item).pointerEvents;
        const image = item.querySelector('.books-dome-item__image');
        const img = item.querySelector('img');
        
        console.log(`  - Livre ${index + 1}:`);
        console.log(`    - Item: ${pointerEvents} ${pointerEvents === 'auto' ? '✅' : '❌'}`);
        if (image) {
          const imagePointerEvents = getComputedStyle(image).pointerEvents;
          console.log(`    - Image: ${imagePointerEvents} ${imagePointerEvents === 'auto' ? '✅' : '❌'}`);
        }
        if (img) {
          const imgPointerEvents = getComputedStyle(img).pointerEvents;
          console.log(`    - IMG: ${imgPointerEvents} ${imgPointerEvents === 'none' ? '✅' : '❌'}`);
        }
      }
    });
    
    // Test 3: Vérifier les overlays
    console.log('\n3️⃣ Test des overlays:');
    const overlays = document.querySelectorAll('.books-dome-overlay, .books-dome-edge-fade');
    overlays.forEach((overlay, index) => {
      const pointerEvents = getComputedStyle(overlay).pointerEvents;
      console.log(`  - Overlay ${index + 1}: ${pointerEvents} ${pointerEvents === 'none' ? '✅' : '❌'}`);
    });
    
    // Test 4: Simuler un clic
    console.log('\n4️⃣ Test de simulation de clic:');
    if (items.length > 0) {
      const firstItem = items[0];
      
      // Ajouter un listener temporaire pour capturer le clic
      let clickCaptured = false;
      const testClickHandler = (event) => {
        clickCaptured = true;
        console.log('  ✅ Clic capturé avec succès!');
        console.log('  📊 Détails:', {
          target: event.target.tagName,
          currentTarget: event.currentTarget.tagName,
          bubbles: event.bubbles,
          defaultPrevented: event.defaultPrevented
        });
      };
      
      firstItem.addEventListener('click', testClickHandler, { once: true });
      
      // Simuler le clic
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      
      console.log('  🖱️ Simulation du clic...');
      firstItem.dispatchEvent(clickEvent);
      
      setTimeout(() => {
        if (!clickCaptured) {
          console.log('  ❌ Clic non capturé - problème détecté');
        }
      }, 100);
    }
    
    // Test 5: Vérifier l'ouverture de l'overlay
    console.log('\n5️⃣ Test d\'ouverture d\'overlay:');
    setTimeout(() => {
      const overlay = document.querySelector('.books-dome-enlarge-scrim');
      if (overlay) {
        console.log('  ✅ Overlay ouvert avec succès!');
        
        // Fermer l'overlay après le test
        setTimeout(() => {
          overlay.click();
          console.log('  🔄 Overlay fermé');
        }, 1000);
      } else {
        console.log('  ❌ Overlay non ouvert - vérifier la logique de clic');
      }
    }, 200);
    
    console.log('\n✅ Tests terminés');
  }
  
  waitForSphere();
}

// Fonction pour tester manuellement un livre spécifique
function testSpecificBook(index = 0) {
  const items = document.querySelectorAll('.books-dome-item');
  if (items[index]) {
    console.log(`🎯 Test manuel du livre ${index + 1}`);
    
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    
    items[index].dispatchEvent(clickEvent);
    console.log('Clic envoyé');
  } else {
    console.log(`❌ Livre ${index + 1} non trouvé`);
  }
}

// Fonction pour diagnostiquer un problème de clic
function diagnoseProblem() {
  console.log('🔍 Diagnostic approfondi:');
  
  const items = document.querySelectorAll('.books-dome-item');
  if (items.length === 0) {
    console.log('❌ Aucun livre trouvé');
    return;
  }
  
  const firstItem = items[0];
  
  // Vérifier les listeners
  console.log('📡 Listeners sur le premier livre:');
  if (typeof getEventListeners === 'function') {
    const listeners = getEventListeners(firstItem);
    console.log(listeners);
  } else {
    console.log('getEventListeners non disponible (nécessite DevTools)');
  }
  
  // Vérifier la position
  const rect = firstItem.getBoundingClientRect();
  console.log('📐 Position du livre:', {
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    visible: rect.width > 0 && rect.height > 0
  });
  
  // Vérifier l'élément au point de clic
  const centerX = rect.x + rect.width / 2;
  const centerY = rect.y + rect.height / 2;
  const elementAtPoint = document.elementFromPoint(centerX, centerY);
  
  console.log('🎯 Élément au centre du livre:', {
    element: elementAtPoint?.tagName,
    isBookItem: elementAtPoint?.closest('.books-dome-item') === firstItem,
    actualElement: elementAtPoint
  });
}

// Démarrer les tests
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', testSphereClickFix);
} else {
  testSphereClickFix();
}

// Exporter les fonctions de test
window.sphereClickTest = {
  runTests: testSphereClickFix,
  testBook: testSpecificBook,
  diagnose: diagnoseProblem
};

console.log('🛠️ Tests disponibles dans window.sphereClickTest');