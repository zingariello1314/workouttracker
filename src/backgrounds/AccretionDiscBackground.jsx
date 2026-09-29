import { SceneHost } from './sceneHost';

function createDiscWorker() {
  return new Worker(new URL('./engines/accretionDisc.worker.js', import.meta.url), { type: 'module' });
}

function startDisc(canvas, size) {
  return import('./engines/accretionDiscScene.js').then(({ startAccretionDisc }) => startAccretionDisc(canvas, size));
}

/** Fond Disque d'accrétion. L'animation tourne dans un worker, le canvas reste visible. */
export default function AccretionDiscBackground({ params, paused = false, epoch = 0 }) {
  return (
    <SceneHost
      color="#000000"
      startScene={startDisc}
      createWorker={createDiscWorker}
      params={params}
      paused={paused}
      epoch={epoch}
    />
  );
}
