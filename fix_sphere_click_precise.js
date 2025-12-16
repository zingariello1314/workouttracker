/**
 * Correctif précis pour le problème de clic sur la sphère de livres
 * Corrige la logique de détection de drag trop restrictive
 */

console.log('🎯 Correctif précis pour les clics sur la sphère');

function fixSphereClickLogic() {
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
    
    // Variables pour tracker le drag de manière plus précise
    let realDragStarted = false;
    let dragStartTime = 0;
    let dragDistance = 0;
    let startX = 0;
    let startY = 0;
    
    const DRAG_THRESHOLD = 10; // pixels minimum pour considérer comme un drag
    const CLICK_DELAY_AFTER_DRAG = 50; // réduit de 80ms à 50ms
    
    // Intercepter les événements de la sphère pour une détection plus précise
    const main = document.querySelector('.books-dome-main');
    if (!main) {
      console.log('❌ Element main non trouvé');
      return;
    }
    
    // Réinitialiser les variables de drag
    const resetDragState = () => {
      realDragStarted = false;
      dragDistance = 0;
      dragStartTime = 0;
    };
    
    // Gestionnaires pour souris
    const handleMouseDown = (e) => {
      startX = e.clientX;
      startY = e.clientY;
      dragStartTime = performance.now();
      dragDistance = 0;
      realDragStarted = false;
      console.log('🖱️ Mouse down détecté');
    };
    
    const handleMouseMove = (e) => {
      if (dragStartTime === 0) return;
      
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;
      dragDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      if (dragDistance > DRAG_THRESHOLD && !realDragStarted) {
        realDragStarted = true;
        console.log('🖱️ Drag réel détecté (distance:', dragDistance, 'px)');
      }
    };
    
    const handleMouseUp = () => {
      if (realDragStarted) {
        console.log('🖱️ Fin de drag réel');
        // Attendre un peu avant de permettre les clics
        setTimeout(resetDragState, CLICK_DELAY_AFTER_DRAG);
      } else {
        console.log('🖱️ Pas de drag, clic autorisé immédiatement');
        resetDragState();
      }
    };
    
    // Gestionnaires pour touch
    const handleTouchStart = (e) => {
      if (e.touches.length > 0) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        dragStartTime = performance.now();
        dragDistance = 0;
        realDragStarted = false;
        console.log('👆 Touch start détecté');
      }
    };
    
    const handleTouchMove = (e) => {
      if (dragStartTime === 0 || e.touches.length === 0) return;
      
      const deltaX = e.touches[0].clientX - startX;
      const deltaY = e.touches[0].clientY - startY;
      dragDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      if (dragDistance > DRAG_THRESHOLD && !realDragStarted) {
        realDragStarted = true;
        console.log('👆 Touch drag réel détecté (distance:', dragDistance, 'px)');
      }
    };
    
    const handleTouchEnd = () => {
      if (realDragStarted) {
        console.log('👆 Fin de touch drag réel');
        setTimeout(resetDragState, CLICK_DELAY_AFTER_DRAG);
      } else {
        console.log('👆 Pas de drag, tap autorisé immédiatement');
        resetDragState();
      }
    };
    
    // Attacher les gestionnaires
    main.addEventListener('mousedown', handleMouseDown, { passive: true });
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseup', handleMouseUp, { passive: true });
    
    main.addEventListener('touchstart', handleTouchStart, { passive: true });
    main.addEventListener('touchmove', handleTouchMove, { passive: true });
    main.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    // Intercepter les clics sur les livres et appliquer notre logique
    items.forEach((item, index) => {
      const enhancedClickHandler = (event) => {
        // Vérifier notre logique de drag améliorée
        if (realDragStarted) {
          console.log(`❌ Clic sur livre ${index + 1} bloqué - drag en cours`);
          event.preventDefault();
          event.stopPropagation();
          return false;
        }
        
        console.log(`✅ Clic sur livre ${index + 1} autorisé`);
        
        // Laisser l'événement se propager normalement
        return true;
      };
      
      // Ajouter notre gestionnaire en capture pour qu'il s'exécute en premier
      item.addEventListener('click', enhancedClickHandler, { capture: true });
      
      // S'assurer que l'item est cliquable
      item.style.pointerEvents = 'auto';
      item.style.cursor = 'pointer';
      
      // S'assurer que l'image à l'intérieur ne bloque pas
      const image = item.querySelector('.books-dome-item__image');
      if (image) {
        image.style.pointerEvents = 'auto';
        image.style.cursor = 'pointer';
        
        const img = image.querySelector('img');
        if (img) {
          img.style.pointerEvents = 'none';
        }
      }
    });
    
    console.log('✅ Logique de clic améliorée appliquée');
    
    // Fonction de nettoyage
    window.cleanupSphereClickFix = () => {
      main.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      main.removeEventListener('touchstart', handleTouchStart);
      main.removeEventListener('touchmove', handleTouchMove);
      main.removeEventListener('touchend', handleTouchEnd);
      console.log('🧹 Gestionnaires de clic nettoyés');
    };
  };
  
  waitForSphere();
}

// Ajouter aussi des styles pour améliorer la zone de clic
function addClickStyles() {
  const style = document.createElement('style');
  style.id = 'sphere-click-fix-styles';
  style.textContent = `
    /* Améliorer les zones de clic de la sphère */
    .books-dome-item {
      pointer-events: auto !important;
      cursor: pointer !important;
    }
    
    .books-dome-item__image {
      pointer-events: auto !important;
      cursor: pointer !important;
    }
    
    .books-dome-item__image img {
      pointer-events: none !important;
    }
    
    /* S'assurer que les overlays ne bloquent pas */
    .books-dome-overlay,
    .books-dome-edge-fade {
      pointer-events: none !important;
    }
    
    /* Améliorer la zone de clic avec un padding invisible */
    .books-dome-item::before {
      content: '';
      position: absolute;
      inset: -10px;
      z-index: -1;
    }
  `;
  
  // Supprimer l'ancien style s'il existe
  const existingStyle = document.getElementById('sphere-click-fix-styles');
  if (existingStyle) {
    existingStyle.remove();
  }
  
  document.head.appendChild(style);
  console.log('🎨 Styles de clic améliorés ajoutés');
}

// Démarrer le correctif
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    addClickStyles();
    fixSphereClickLogic();
  });
} else {
  addClickStyles();
  fixSphereClickLogic();
}

// Exporter pour utilisation manuelle
window.fixSphereClicksPrecise = () => {
  addClickStyles();
  fixSphereClickLogic();
};

console.log('🛠️ Correctif précis chargé. Utilisez window.fixSphereClicksPrecise() pour relancer.');