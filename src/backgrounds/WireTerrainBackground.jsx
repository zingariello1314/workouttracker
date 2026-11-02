import { SceneHost } from './sceneHost';

function createWorker() {
  return new Worker(new URL('./engines/wireTerrain.worker.js', import.meta.url), { type: 'module' });
}

function startScene(canvas, size) {
  return import('./engines/wireTerrainScene.js').then(({ startWireTerrain }) => startWireTerrain(canvas, size));
}

/** Fond Terrain filaire. L'animation tourne dans un worker. */
export default function WireTerrainBackground({ params, paused = false, epoch = 0 }) {
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
