import { SceneHost } from './sceneHost';

function createChromeWorker() {
  return new Worker(new URL('./engines/chromeCells.worker.js', import.meta.url), { type: 'module' });
}

function startChrome(canvas, size) {
  return import('./engines/chromeCellsScene.js').then(({ startChromeCells }) => startChromeCells(canvas, size));
}

/** Fond Cellules chromées. L'animation tourne dans un worker. */
export default function ChromeCellsBackground({ params, paused = false, epoch = 0 }) {
  return (
    <SceneHost
      color="#040405"
      startScene={startChrome}
      createWorker={createChromeWorker}
      params={params}
      paused={paused}
      epoch={epoch}
      trackPointer={params?.cursor !== false}
    />
  );
}
