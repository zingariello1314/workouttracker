import { SceneHost } from './sceneHost';

function createTornadoWorker() {
  return new Worker(new URL('./engines/tornado.worker.js', import.meta.url), { type: 'module' });
}

function startTornado(canvas, size) {
  return import('./engines/tornadoScene.js').then(({ startTornado: start }) => start(canvas, size));
}

/** Fond Tornade. L'animation tourne dans un worker. */
export default function TornadoBackground({ params, paused = false, epoch = 0 }) {
  return (
    <SceneHost
      color="#000000"
      startScene={startTornado}
      createWorker={createTornadoWorker}
      params={params}
      paused={paused}
      epoch={epoch}
      trackPointer={params?.repel !== false}
    />
  );
}
