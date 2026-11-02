import { SceneHost } from './sceneHost';

function createWorker() {
  return new Worker(new URL('./engines/toonFireball.worker.js', import.meta.url), { type: 'module' });
}

function startScene(canvas, size) {
  return import('./engines/toonFireballScene.js').then(({ startToonFireball }) => startToonFireball(canvas, size));
}

/** Fond Boule de feu toon. L'animation tourne dans un worker. */
export default function ToonFireballBackground({ params, paused = false, epoch = 0 }) {
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
