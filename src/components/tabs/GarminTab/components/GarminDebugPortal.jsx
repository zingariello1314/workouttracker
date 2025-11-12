import React from 'react';
import { createPortal } from 'react-dom';

/**
 * Portail React pour isoler le DebugPanel du reste de l'arbre de rendu
 * 
 * Avantages :
 * - Réduit les re-renders du composant parent
 * - Permet un z-index élevé sans conflits
 * - Améliore les performances (isolation du DOM)
 * - Facilite les tests (peut être mocké)
 */
export function GarminDebugPortal({ children, isOpen }) {
  const [portalRoot, setPortalRoot] = React.useState(null);

  React.useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    // Créer ou récupérer le conteneur portail
    let root = document.getElementById('garmin-debug-portal-root');
    
    if (!root) {
      root = document.createElement('div');
      root.id = 'garmin-debug-portal-root';
      root.setAttribute('data-portal', 'garmin-debug');
      // Styles pour garantir le z-index et le positionnement
      root.style.cssText = 'position: fixed; inset: 0; z-index: 9999; pointer-events: none;';
      document.body.appendChild(root);
    }

    setPortalRoot(root);

    // Nettoyage : ne pas supprimer le root pour éviter les re-créations
    // (le root reste en vie pour les prochaines ouvertures)
    return () => {
      // Optionnel : nettoyer si nécessaire
      // Mais on garde le root pour performance
    };
  }, []);

  if (!isOpen || !portalRoot) {
    return null;
  }

  // Rendre les enfants dans le portail avec pointer-events activés
  return createPortal(
    <div style={{ pointerEvents: 'auto' }}>
      {children}
    </div>,
    portalRoot
  );
}

export default GarminDebugPortal;


