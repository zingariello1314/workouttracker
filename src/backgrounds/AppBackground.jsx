import { lazy, Suspense } from 'react';
import { getBackgroundOption } from './backgroundRegistry';
import { useAppBackground } from './useAppBackground';

const componentCache = new Map();

function getLazyBackground(id) {
  const option = getBackgroundOption(id);
  if (!componentCache.has(option.id)) {
    componentCache.set(option.id, lazy(option.load));
  }
  return componentCache.get(option.id);
}

/**
 * Calque global : un seul fond monté à la fois.
 * Le chunk du fond non choisi reste froid jusqu’au sélecteur.
 * La clé React force le démontage (worker, listeners, rAF) quand l’id change.
 */
export default function AppBackground() {
  const { option } = useAppBackground();
  const Active = getLazyBackground(option.id);
  return (
    <Suspense fallback={null}>
      <Active key={option.id} />
    </Suspense>
  );
}
