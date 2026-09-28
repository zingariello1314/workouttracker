import { useEffect, useState } from 'react';
import ParticleSaturn from '../components/originkit/ui/particle-saturn';

/**
 * Fond plein écran. La scène Three.js ne démarre qu’une fois l’écran de
 * chargement initial retiré : son premier rendu WebGL bloque le fil principal
 * et figeait la restauration des préférences.
 */
export default function ParticleSaturnBackground() {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    let timer = 0;
    let cancelled = false;

    const startedAt = Date.now();
    const poll = () => {
      if (cancelled) return;
      if (document.getElementById('welcome-gate-title')) {
        timer = window.setTimeout(poll, 200);
        return;
      }
      if (Date.now() - startedAt < 500) {
        timer = window.setTimeout(poll, 50);
        return;
      }
      setArmed(true);
    };

    timer = window.setTimeout(poll, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div
      className="fixed inset-0"
      style={{ pointerEvents: 'none', zIndex: -1, backgroundColor: '#07060a' }}
    >
      {armed ? <ParticleSaturn /> : null}
    </div>
  );
}
