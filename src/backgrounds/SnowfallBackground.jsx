import { SceneHost } from './sceneHost';

function createWorker() {
  return new Worker(new URL('./engines/snowfall.worker.js', import.meta.url), { type: 'module' });
}

function startScene(canvas, size) {
  return import('./engines/snowfallScene.js').then(({ startSnowfall }) => startSnowfall(canvas, size));
}

/** Fond Chute de neige. L'animation tourne dans un worker. */
export default function SnowfallBackground({ params, paused = false, epoch = 0 }) {
  return (
    <SceneHost
      color="#000000"
      startScene={startScene}
      createWorker={createWorker}
      params={params}
      paused={paused}
      epoch={epoch}
      trackPointer={false}
    />
  );
}
