import { SceneHost } from './sceneHost';

function createCosmicWorker() {
  return new Worker(new URL('./engines/cosmicBg.worker.js', import.meta.url), { type: 'module' });
}

function startCosmic(canvas, size) {
  return import('./engines/cosmicBgScene.js').then(({ startCosmicBg }) => startCosmicBg(canvas, size));
}

/** Fond Cosmos. L'animation tourne dans un worker. */
export default function CosmicBackground({ params, paused = false, epoch = 0 }) {
  return (
    <SceneHost
      color="#05010f"
      startScene={startCosmic}
      createWorker={createCosmicWorker}
      params={params}
      paused={paused}
      epoch={epoch}
    />
  );
}
