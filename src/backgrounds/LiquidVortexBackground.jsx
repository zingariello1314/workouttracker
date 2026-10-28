import { SceneHost } from './sceneHost';

function createWorker() {
  return new Worker(new URL('./engines/liquidVortex.worker.js', import.meta.url), { type: 'module' });
}

function startScene(canvas, size) {
  return import('./engines/liquidVortexScene.js').then(({ startLiquidVortex }) => startLiquidVortex(canvas, size));
}

/** Fond LiquidVortex. L'animation tourne dans un worker. */
export default function LiquidVortexBackground({ params, paused = false, epoch = 0 }) {
  return (
    <SceneHost
      color="#000000"
      startScene={startScene}
      createWorker={createWorker}
      params={params}
      paused={paused}
      epoch={epoch}
      trackPointer={params?.cursor !== false}
    />
  );
}
