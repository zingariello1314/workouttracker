import { SceneHost } from './sceneHost';

function createWorker() {
  return new Worker(new URL('./engines/latticeFlight.worker.js', import.meta.url), { type: 'module' });
}

function startScene(canvas, size) {
  return import('./engines/latticeFlightScene.js').then(({ startLatticeFlight }) => startLatticeFlight(canvas, size));
}

/** Fond LatticeFlight. L'animation tourne dans un worker. */
export default function LatticeFlightBackground({ params, paused = false, epoch = 0 }) {
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
