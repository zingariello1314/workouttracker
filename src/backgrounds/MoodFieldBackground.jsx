import { SceneHost } from './sceneHost';

function createWorker() {
  return new Worker(new URL('./engines/moodField.worker.js', import.meta.url), { type: 'module' });
}

function startScene(canvas, size) {
  return import('./engines/moodFieldScene.js').then(({ startMoodField }) => startMoodField(canvas, size));
}

/** Fond MoodField. L'animation tourne dans un worker. */
export default function MoodFieldBackground({ params, paused = false, epoch = 0 }) {
  return (
    <SceneHost
      color="#05060a"
      startScene={startScene}
      createWorker={createWorker}
      params={params}
      paused={paused}
      epoch={epoch}
      trackPointer={params?.cursor !== false}
    />
  );
}
