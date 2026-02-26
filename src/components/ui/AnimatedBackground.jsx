import React from "react";

/**
 * AnimatedBackground (version sans Three.js)
 *
 * Pour le déploiement (et éviter les problèmes de résolution de
 * `@react-three/fiber` sur Vercel), on utilise ici un fond animé 100 % CSS.
 * L'API du composant reste la même : on exporte un composant par défaut
 * qui accepte une prop `className`.
 */
const AnimatedBackground = ({ className = "" }) => {
  return (
    <div
      className={`fixed inset-0 ${className}`}
      style={{
        pointerEvents: "none",
        width: "100vw",
        height: "100vh",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: -1,
        background:
          "radial-gradient(circle at 0% 0%, #16a34a 0, transparent 55%), radial-gradient(circle at 100% 100%, #22c55e 0, transparent 55%), radial-gradient(circle at 0% 100%, #166534 0, transparent 55%), radial-gradient(circle at 100% 0%, #0f766e 0, transparent 55%), #020617",
        backgroundSize: "200% 200%",
        animation: "momentum-bg-pulse 18s ease-in-out infinite",
      }}
    />
  );
};

export default AnimatedBackground;

