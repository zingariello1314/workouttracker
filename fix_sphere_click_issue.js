/**
 * Script pour corriger le problème de clic sur la sphère de livres
 * Identifie et corrige les problèmes de détection de drag et de z-index
 */

console.log('🔧 Correction du problème de clic sur la sphère de livres');

function fixSphereClickIssue() {
  // Attendre que la sphère soit chargée
  const checkAndFix = () => {
    const sphere = document.querySelector('.books-dome-sphere');
    const items = document.querySelectorAll('.books-dome-item');
    const overlays = document.querySelectorAll('.books-dome-overlay, .books-dome-edge-fade');
    
    if (!sphere || items.length === 0) {
      console.log('⏳ Sphère non trouvée, nouvelle tentative dans 500ms...');
      setTimeout(checkAndFix, 500);
      return;
    }
    
    console.log(`✅ Sphère trouvée avec ${items.length} livres`);
    
    // Fix 1: S'assurer que les overlays n'interfèrent pas
    console.log('🎭 Correction des overlays...');
    overlays.forEach((overlay, index) => {
      overlay.style.pointerEvents = 'none';
      overlay.style.userSelect = 'none';
      overlay.style.webkitUserSelect = 'none';
      console.log(`  - Overlay ${index + 1}: pointer-events défini sur 'none'`);
    });
    
    // Fix 2: S'assurer que les items ont les bonnes propriétés de clic
    console.log('📚 Correction des items de livres...');
    items.forEach((item, index) => {
      // S'assurer que pointer-events est activé
      item.style.pointerEvents = 'auto';
      item.style.cursor = 'pointer';
      
      // Augmenter le z-index pour être sûr qu'ils sont au-dessus
      item.style.zIndex = '10';
      
      // S'assurer que l'image à l'intérieur ne bloque pas les clics
      const image = item.querySelector('.books-dome-item__image');
      if (image) {
        image.style.pointerEvents = 'auto';
        image.style.cursor = 'pointer';
        
        const img = image.querySelector('img');
        if (img) {
          img.style.pointerEvents = 'none'; // L'image elle-même ne doit pas capturer les clics
        }
      }
      
      if (index < 5) {
        console.log(`  - Livre ${index + 1}: propriétés de clic corrigées`);
      }
    });
    
    // Fix 3: Corriger la logique de détection de drag
    console.log('🖐️ Correction de la détection de drag...');
    
    // Trouver et corriger les variables de drag dans le scope React
    // On va intercepter les clics et forcer leur exécution si nécessaire
    let dragEndTime = 0;
    let isDragging = false;
    
    // Intercepter les événements de drag pour mettre à jour nos variables
    const main = document.querySelector('.books-dome-main');
    if (main) {
      // Écouter les événements de drag
      main.addEventListener('mousedown', () => {
        isDragging = true;
        console.log('🖱️ Drag détecté - début');
      });
      
      document.addEventListener('mouseup', () => {
        if (isDragging) {
          isDragging = false;
          dragEndTime = performance.now();
          console.log('🖱️ Drag détecté - fin');
        }
      });
      
      main.addEventListener('touchstart', () => {
        isDragging = true;
        console.log('👆 Touch drag détecté - début');
      });
      
      main.addEventListener('touchend', () => {
        if (isDragging) {
          isDragging = false;
          dragEndTime = performance.now();
          console.log('👆 Touch drag détecté - fin');
        }
      });
    }
    
    // Fix 4: Ajouter des gestionnaires de clic de secours
    console.log('🆘 Ajout de gestionnaires de clic de secours...');
    
    items.forEach((item, index) => {
      // Ajouter un gestionnaire de clic direct qui contourne la logique de drag
      const forceClickHandler = (event) => {
        console.log(`🎯 Clic forcé sur le livre ${index + 1}`);
        
        // Empêcher la propagation pour éviter les conflits
        event.stopPropagation();
        
        // Vérifier si on est vraiment en train de dragger
        const timeSinceDragEnd = performance.now() - dragEndTime;
        const isRecentDrag = timeSinceDragEnd < 100;
        
        if (isDragging) {
          console.log('❌ Clic ignoré - drag en cours');
          return;
        }
        
        if (isRecentDrag) {
          console.log('❌ Clic ignoré - drag récent');
          return;
        }
        
        console.log('✅ Clic autorisé - déclenchement de l\'action');
        
        // Déclencher l'événement de clic original
        const originalClickEvent = new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          view: window,
          detail: 1
        });
        
        // Marquer l'événement comme forcé pour éviter les boucles
        originalClickEvent.forcedClick = true;
        
        item.dispatchEvent(originalClickEvent);
      };
      
      // Ajouter le gestionnaire avec une priorité élevée
      item.addEventListener('click', forceClickHandler, { capture: true });
      
      // Ajouter aussi un gestionnaire sur l'image
      const image = item.querySelector('.books-dome-item__image');
      if (image) {
        image.addEventListener('click', forceClickHandler, { capture: true });
      }
    });
    
    // Fix 5: Ajouter des logs pour diagnostiquer les clics
    console.log('📊 Ajout de logs de diagnostic...');
    
    document.addEventListener('click', (event) => {
      if (event.target.closest('.books-dome-item')) {
        console.log('🖱️ Clic détecté sur un livre:', {
          target: event.target.tagName,
          forcedClick: event.forcedClick,
          isDragging: isDragging,
          timeSinceDragEnd: performance.now() - dragEndTime,
          defaultPrevented: event.defaultPrevented
        });
      }
    }, true);
    
    console.log('✅ Corrections appliquées avec succès!');
    console.log('📝 Essayez de cliquer sur un livre maintenant');
  };
  
  // Démarrer la correction
  checkAndFix();
}

// Fix 6: Corriger aussi les styles CSS dynamiquement
function fixCSS() {
  console.log('🎨 Correction des styles CSS...');
  
  const style = document.createElement('style');
  style.textContent = `
    /* Corrections pour les clics sur la sphère */
    .books-dome-item {
      pointer-events: auto !important;
      cursor: pointer !important;
      z-index: 10 !important;
    }
    
    .books-dome-item__image {
      pointer-events: auto !important;
      cursor: pointer !important;
    }
    
    .books-dome-item__image img {
      pointer-events: none !important;
    }
    
    .books-dome-overlay,
    .books-dome-edge-fade {
      pointer-events: none !important;
      user-select: none !important;
      -webkit-user-select: none !important;
    }
    
    /* Améliorer la zone de clic */
    .books-dome-item {
      padding: 5px;
      margin: -5px;
    }
  `;
  
  document.head.appendChild(style);
  console.log('✅ Styles CSS corrigés');
}

// Démarrer les corrections
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    fixCSS();
    fixSphereClickIssue();
  });
} else {
  fixCSS();
  fixSphereClickIssue();
}

// Exporter pour utilisation manuelle
window.fixSphereClicks = fixSphereClickIssue;

console.log('🛠️ Script de correction chargé. Utilisez window.fixSphereClicks() pour relancer manuellement.');