import { SceneHost } from './sceneHost';

function createGrassWorker() {
  return new Worker(new URL('./engines/grassField.worker.js', import.meta.url), { type: 'module' });
}

function startGrass(canvas, size) {
  return import('./engines/grassFieldScene.js').then(({ startGrassField }) => startGrassField(canvas, size));
}

/** Fond Champ d'herbe. L'animation tourne dans un worker. */
export default function GrassFieldBackground({ params, paused = false, epoch = 0 }) {
  return (
    <SceneHost
      color="#000000"
      startScene={startGrass}
      createWorker={createGrassWorker}
      params={params}
      paused={paused}
      epoch={epoch}
      trackPointer={params?.repel !== false}
    />
  );
}
