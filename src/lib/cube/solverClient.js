let worker;
let initPromise;

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('./solver-worker.js', import.meta.url), { type: 'module' });
  }
  return worker;
}

export function initCubeSolver() {
  if (initPromise) return initPromise;
  initPromise = new Promise((resolve, reject) => {
    const w = getWorker();
    const onMsg = (e) => {
      if (e.data?.type === 'ready') {
        w.removeEventListener('message', onMsg);
        resolve();
      }
      if (e.data?.type === 'error') {
        w.removeEventListener('message', onMsg);
        initPromise = null;
        reject(new Error(e.data.message));
      }
    };
    w.addEventListener('message', onMsg);
    w.postMessage({ type: 'init' });
  });
  return initPromise;
}

export function solveFacelets(facelets) {
  const run = () =>
    initCubeSolver().then(
      () =>
        new Promise((resolve, reject) => {
          const w = getWorker();
          const onMsg = (e) => {
            if (e.data?.type === 'solved') {
              w.removeEventListener('message', onMsg);
              resolve(e.data.solution || '');
            }
            if (e.data?.type === 'error') {
              w.removeEventListener('message', onMsg);
              reject(new Error(e.data.message));
            }
          };
          w.addEventListener('message', onMsg);
          w.postMessage({ type: 'solve', facelets });
        })
    );

  return run().catch(async () => {
    const Cube = (await import('cubejs')).default;
    const { standardizeFacelets } = await import('./model');
    Cube.initSolver();
    const std = standardizeFacelets(facelets);
    return Cube.fromString(std.ok ? std.facelets : facelets).solve() || '';
  });
}
