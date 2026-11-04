import { SceneHost } from './sceneHost';

function createWorker() {
  return new Worker(new URL('./engines/wireTerrain02.worker.js', import.meta.url), { type: 'module' });
}

function startScene(canvas, size) {
  return import('./engines/wireTerrain02Scene.js').then(({ startWireTerrain02 }) => startWireTerrain02(canvas, size));
}

/** Fond Terrain filaire 2. L'animation tourne dans un worker. */
export default function WireTerrain02Background({ params, paused = false, epoch = 0 }) {
  return (
    <SceneHost
      color="#0b0420"
      startScene={startScene}
      createWorker={createWorker}
      params={params}
      paused={paused}
      epoch={epoch}
      trackPointer={params?.cursor !== false}
    />
  );
}
