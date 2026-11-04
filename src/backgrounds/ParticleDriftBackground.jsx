import { SceneHost } from './sceneHost';

function createWorker() {
  return new Worker(new URL('./engines/particleDrift.worker.js', import.meta.url), { type: 'module' });
}

function startScene(canvas, size) {
  return import('./engines/particleDriftScene.js').then(({ startParticleDrift }) => startParticleDrift(canvas, size));
}

/** Fond Dérive de particules. L'animation tourne dans un worker. */
export default function ParticleDriftBackground({ params, paused = false, epoch = 0 }) {
  return (
    <SceneHost
      color="#030509"
      startScene={startScene}
      createWorker={createWorker}
      params={params}
      paused={paused}
      epoch={epoch}
      trackPointer={params?.cursor !== false}
    />
  );
}
