/**
 * Script de diagnostic pour le problème de clic sur la sphère de livres
 * Teste les interactions et identifie les blocages
 */

console.log('🔍 Diagnostic du problème de clic sur la sphère de livres');

// Fonction pour attendre que la sphère soit chargée
function waitForSphere() {
  return new Promise((resolve) => {
    const checkSphere = () => {
      const sphere = document.querySelector('.books-dome-sphere');
      const items = document.querySelectorAll('.books-dome-item');
      
      if (sphere && items.length > 0) {
        console.log(`✅ Sphère trouvée avec ${items.length} livres`);
        resolve({ sphere, items });
      } else {
        console.log('⏳ Attente de la sphère...');
        setTimeout(checkSphere, 500);
      }
    };
    checkSphere();
  });
}

// Fonction pour tester les événements de clic
function testClickEvents(items) {
  console.log('\n📋 Test des événements de clic:');
  
  items.forEach((item, index) => {
    if (index < 5) { // Tester seulement les 5 premiers
      const hasClickListener = item.onclick !== null;
      const hasEventListeners = getEventListeners ? getEventListeners(item) : 'Non disponible (DevTools requis)';
      
      console.log(`Livre ${index + 1}:`);
      console.log(`  - onclick: ${hasClickListener ? 'Présent' : 'Absent'}`);
      console.log(`  - Event listeners:`, hasEventListeners);
      console.log(`  - Pointer events: ${getComputedStyle(item).pointerEvents}`);
      console.log(`  - Z-index: ${getComputedStyle(item).zIndex}`);
      console.log(`  - Position: ${getComputedStyle(item).position}`);
    }
  });
}

// Fonction pour tester les overlays qui pourraient bloquer les clics
function testOverlays() {
  console.log('\n🎭 Test des overlays potentiellement bloquants:');
  
  const overlays = document.querySelectorAll('.books-dome-overlay, .books-dome-edge-fade');
  overlays.forEach((overlay, index) => {
    const style = getComputedStyle(overlay);
    console.log(`Overlay ${index + 1}:`);
    console.log(`  - Pointer events: ${style.pointerEvents}`);
    console.log(`  - Z-index: ${style.zIndex}`);
    console.log(`  - Position: ${style.position}`);
    console.log(`  - Display: ${style.display}`);
  });
}

// Fonction pour tester manuellement un clic
function simulateClick(item) {
  console.log('\n🖱️ Simulation d\'un clic sur le premier livre:');
  
  try {
    // Créer un événement de clic
    const clickEvent = new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    
    console.log('Déclenchement du clic...');
    const result = item.dispatchEvent(clickEvent);
    console.log(`Résultat: ${result ? 'Succès' : 'Bloqué'}`);
    
    // Vérifier si l'overlay s'ouvre
    setTimeout(() => {
      const overlay = document.querySelector('.books-dome-enlarge-scrim');
      console.log(`Overlay ouvert: ${overlay ? 'Oui' : 'Non'}`);
    }, 100);
    
  } catch (error) {
    console.error('Erreur lors de la simulation:', error);
  }
}

// Fonction pour vérifier l'état du drag
function checkDragState() {
  console.log('\n🖐️ Vérification de l\'état du drag:');
  
  // Chercher les références de drag dans le DOM
  const main = document.querySelector('.books-dome-main');
  if (main) {
    console.log('Main element trouvé');
    
    // Vérifier le style cursor qui indique un drag actif
    const cursor = getComputedStyle(document.body).cursor;
    console.log(`Cursor du body: ${cursor}`);
    
    // Vérifier les transitions sur la sphère
    const sphere = document.querySelector('.books-dome-sphere');
    if (sphere) {
      const transition = getComputedStyle(sphere).transition;
      console.log(`Transition de la sphère: ${transition}`);
    }
  }
}

// Fonction pour vérifier les props passées au composant
function checkComponentProps() {
  console.log('\n⚙️ Vérification des props du composant:');
  
  // Chercher les données React dans le DOM
  const sphereRoot = document.querySelector('.books-dome-sphere-root');
  if (sphereRoot) {
    // Essayer d'accéder aux props React (méthode non garantie)
    const reactKey = Object.keys(sphereRoot).find(key => key.startsWith('__reactInternalInstance') || key.startsWith('_reactInternalFiber'));
    
    if (reactKey) {
      console.log('Props React détectées (structure interne)');
    } else {
      console.log('Impossible d\'accéder aux props React directement');
    }
  }
}

// Fonction principale de diagnostic
async function runDiagnostic() {
  try {
    console.log('🚀 Démarrage du diagnostic...\n');
    
    // Attendre que la sphère soit chargée
    const { sphere, items } = await waitForSphere();
    
    // Tests séquentiels
    testClickEvents(items);
    testOverlays();
    checkDragState();
    checkComponentProps();
    
    // Test de clic sur le premier livre
    if (items.length > 0) {
      console.log('\n🎯 Test de clic sur le premier livre:');
      simulateClick(items[0]);
    }
    
    console.log('\n✅ Diagnostic terminé');
    
  } catch (error) {
    console.error('❌ Erreur pendant le diagnostic:', error);
  }
}

// Fonction pour ajouter des logs de debug aux clics
function addDebugLogging() {
  console.log('\n🔧 Ajout de logs de debug...');
  
  // Intercepter tous les clics sur la page
  document.addEventListener('click', (event) => {
    if (event.target.closest('.books-dome-item')) {
      console.log('🖱️ Clic détecté sur un livre de la sphère:', {
        target: event.target,
        currentTarget: event.currentTarget,
        bubbles: event.bubbles,
        cancelable: event.cancelable,
        defaultPrevented: event.defaultPrevented
      });
    }
  }, true); // Capture phase
  
  console.log('Logs de debug ajoutés');
}

// Démarrer le diagnostic
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    addDebugLogging();
    runDiagnostic();
  });
} else {
  addDebugLogging();
  runDiagnostic();
}

// Exporter les fonctions pour utilisation manuelle
window.sphereDebug = {
  runDiagnostic,
  testClickEvents,
  testOverlays,
  checkDragState,
  simulateClick: () => {
    const items = document.querySelectorAll('.books-dome-item');
    if (items.length > 0) {
      simulateClick(items[0]);
    } else {
      console.log('Aucun livre trouvé');
    }
  }
};

console.log('🛠️ Fonctions de debug disponibles dans window.sphereDebug');