import { SceneHost } from './sceneHost';

function createWorker() {
  return new Worker(new URL('./engines/lightCables.worker.js', import.meta.url), { type: 'module' });
}

function startScene(canvas, size) {
  return import('./engines/lightCablesScene.js').then(({ startLightCables }) => startLightCables(canvas, size));
}

/** Fond LightCables. L'animation tourne dans un worker. */
export default function LightCablesBackground({ params, paused = false, epoch = 0 }) {
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
