import React from 'react';

/**
 * GlassEffect - Composant wrapper pour l'effet liquid glass
 * 
 * Applique un effet de verre transparent avec distorsion et reflets
 * permettant de voir le fond animé à travers.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Contenu à afficher
 * @param {string} props.className - Classes CSS additionnelles
 * @param {Object} props.style - Styles inline additionnels
 * @param {string} props.as - Élément HTML à utiliser ('div', 'header', 'nav', 'button')
 * @param {Function} props.onClick - Fonction de callback pour les clics
 */
const GlassEffect = ({
  children,
  className = "",
  style = {},
  as: Component = 'div',
  onClick,
}) => {
  const glassStyle = {
    boxShadow: "0 6px 6px rgba(0, 0, 0, 0.2), 0 0 20px rgba(0, 0, 0, 0.1)",
    transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 2.2)",
    ...style,
  };

  const content = (
    <Component
      className={`relative font-semibold overflow-hidden transition-all duration-700 ${className}`}
      style={{
        ...glassStyle,
        background: 'transparent',
        margin: 0,
        padding: 0,
        display: 'block',
        lineHeight: 'normal', // Éviter les problèmes de line-height
      }}
      onClick={onClick}
    >
      {/* Couche 1 : Blur léger avec distorsion */}
      <div
        className="absolute inset-0 z-0 overflow-hidden rounded-inherit"
        style={{
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          filter: "url(#glass-distortion)",
          isolation: "isolate",
        }}
      />
      
      {/* Couche 2 : Overlay blanc très transparent pour laisser voir le fond animé */}
      <div
        className="absolute inset-0 z-10 rounded-inherit"
        style={{ 
          background: "rgba(255, 255, 255, 0.06)",
        }}
      />
      
      {/* Couche 3 : Reflets intérieurs pour effet glass */}
      <div
        className="absolute inset-0 z-20 rounded-inherit overflow-hidden"
        style={{
          boxShadow:
            "inset 2px 2px 1px 0 rgba(255, 255, 255, 0.4), inset -1px -1px 1px 1px rgba(255, 255, 255, 0.3)",
        }}
      />

      {/* Contenu */}
      <div className="relative z-30 w-full" style={{ margin: 0, padding: 0, lineHeight: 'normal' }}>{children}</div>
    </Component>
  );

  return content;
};

export default GlassEffect;

