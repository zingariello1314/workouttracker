import { SceneHost } from './sceneHost';

function createWorker() {
  return new Worker(new URL('./engines/formulaStream.worker.js', import.meta.url), { type: 'module' });
}

function startScene(canvas, size) {
  return import('./engines/formulaStreamScene.js').then(({ startFormulaStream }) => startFormulaStream(canvas, size));
}

/** Fond Flux de formules. L'animation tourne dans un worker. */
export default function FormulaStreamBackground({ params, paused = false, epoch = 0 }) {
  return (
    <SceneHost
      color="#0a0a0c"
      startScene={startScene}
      createWorker={createWorker}
      params={params}
      paused={paused}
      epoch={epoch}
      trackPointer={params?.cursor !== false}
    />
  );
}
