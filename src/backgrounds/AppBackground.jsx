import { lazy, Suspense, useEffect, useState } from 'react';
import { getBackgroundOption } from './backgroundRegistry';
import { isBackgroundStudioOpen } from './backgroundStudio';
import { useAppBackground } from './useAppBackground';

const componentCache = new Map();

function getLazyBackground(id) {
  const option = getBackgroundOption(id);
  const cacheKey = option.baseId || option.id;
  if (!componentCache.has(cacheKey)) {
    componentCache.set(cacheKey, lazy(option.load));
  }
  return componentCache.get(cacheKey);
}

/**
 * Calque global : un seul fond monté à la fois.
 * Le chunk du fond non choisi reste froid jusqu’au sélecteur.
 * La clé React force le démontage (worker, listeners, rAF) quand l’id change.
 */
export default function AppBackground() {
  const { option } = useAppBackground();
  const [studioOpen, setStudioOpen] = useState(isBackgroundStudioOpen);

  useEffect(() => {
    const sync = () => setStudioOpen(document.documentElement.dataset.backgroundStudio === '1');
    window.addEventListener('momentum:background-studio', sync);
    return () => window.removeEventListener('momentum:background-studio', sync);
  }, []);

  if (studioOpen) {
    return <div style={{ position: 'absolute', inset: 0, background: option.fallbackBackground }} />;
  }

  const Active = getLazyBackground(option.id);
  return (
    <div style={{ position: 'absolute', inset: 0, background: option.fallbackBackground }}>
      <Suspense fallback={null}>
        <Active key={option.id} params={option.params} />
      </Suspense>
    </div>
  );
}
