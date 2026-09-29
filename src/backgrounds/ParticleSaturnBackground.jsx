import { SceneHost } from './sceneHost';

function createSaturnWorker() {
  return new Worker(new URL('./engines/particleSaturn.worker.js', import.meta.url), { type: 'module' });
}

function startSaturn(canvas, size) {
  return import('./engines/saturnScene.js').then(({ startParticleSaturn }) => startParticleSaturn(canvas, size));
}

/** Fond Saturne. L'animation tourne dans un worker, le canvas reste visible. */
export default function ParticleSaturnBackground({ params, paused = false, epoch = 0 }) {
  return (
    <SceneHost
      color="#07060a"
      startScene={startSaturn}
      createWorker={createSaturnWorker}
      params={params}
      paused={paused}
      epoch={epoch}
    />
  );
}
