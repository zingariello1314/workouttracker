import { SceneHost } from './sceneHost';

function createChainWorker() {
  return new Worker(new URL('./engines/chainVortex.worker.js', import.meta.url), { type: 'module' });
}

function startChain(canvas, size) {
  return import('./engines/chainVortexScene.js').then(({ startChainVortex }) => startChainVortex(canvas, size));
}

/** Fond Vortex de chaînes. L'animation tourne dans un worker. */
export default function ChainVortexBackground({ params, paused = false, epoch = 0 }) {
  return (
    <SceneHost
      color="#070000"
      startScene={startChain}
      createWorker={createChainWorker}
      params={params}
      paused={paused}
      epoch={epoch}
    />
  );
}
