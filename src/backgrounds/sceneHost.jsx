import { useEffect, useRef } from 'react';

function viewportOf(host) {
  return {
    width: Math.max(1, Math.floor(host.clientWidth || window.innerWidth || 1)),
    height: Math.max(1, Math.floor(host.clientHeight || window.innerHeight || 1)),
    dpr: Math.min(window.devicePixelRatio || 1, 1)
  };
}

const CANVAS_STYLE = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none';

/**
 * Le canvas reste dans la page. La boucle d'animation tourne dans un worker,
 * comme le fond vert : un calcul sur le fil principal ne fige plus l'image.
 * Si le worker n'est pas disponible, la scène démarre sur place.
 */
function useSceneCanvas(startScene, createWorker, params, paused, epoch, trackPointer) {
  const hostRef = useRef(null);
  const linkRef = useRef(null);
  const paramsRef = useRef(params);
  const playRef = useRef({ paused, restart: epoch });
  const paramsKeyRef = useRef('');
  const paramsKey = params == null ? '' : JSON.stringify(params);
  paramsRef.current = params;
  playRef.current = { paused: Boolean(paused), restart: epoch || 0 };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const canvas = document.createElement('canvas');
    canvas.style.cssText = CANVAS_STYLE;
    host.appendChild(canvas);

    let handle = null;
    let worker = null;
    let observer = null;
    let timer = 0;
    let alive = true;
    let lastW = 0;
    let lastH = 0;

    let fellBack = false;

    const startOnMain = (target, box) => {
      startScene(target, box).then((next) => {
        if (!alive) {
          next?.stop?.();
          return;
        }
        handle = next;
        const pending = paramsRef.current;
        paramsKeyRef.current = pending == null ? '' : JSON.stringify(pending);
        if (pending) next?.update?.(pending);
        next?.setPlayback?.(playRef.current);
      }).catch(() => {});
    };

    const watchSize = (onSize) => {
      if (observer) observer.disconnect();
      observer = new ResizeObserver(() => {
        const next = viewportOf(host);
        if (next.width === lastW && next.height === lastH) return;
        lastW = next.width;
        lastH = next.height;
        onSize(next);
      });
      observer.observe(host);
    };

    const useMain = () => {
      if (!alive || fellBack) return;
      fellBack = true;
      if (worker) {
        worker.terminate();
        worker = null;
      }
      const fallback = document.createElement('canvas');
      fallback.style.cssText = CANVAS_STYLE;
      host.appendChild(fallback);
      const box = viewportOf(host);
      lastW = box.width;
      lastH = box.height;
      linkRef.current = { worker: null, main: () => handle };
      startOnMain(fallback, { ...box, params: paramsRef.current });
      watchSize((next) => handle?.resize?.(next.width, next.height, next.dpr));
    };

    const boot = () => {
      if (!alive) return;
      if (document.getElementById('welcome-gate-title')) {
        timer = window.setTimeout(boot, 200);
        return;
      }
      timer = window.requestAnimationFrame(() => {
        if (!alive) return;
        const box = viewportOf(host);
        lastW = box.width;
        lastH = box.height;

        if (typeof createWorker === 'function' && typeof canvas.transferControlToOffscreen === 'function') {
          try {
            worker = createWorker();
            const offscreen = canvas.transferControlToOffscreen();
            worker.onmessage = (event) => {
              if (event.data?.type === 'failed') useMain();
            };
            worker.onerror = () => useMain();
            worker.postMessage({
              type: 'init',
              canvas: offscreen,
              ...box,
              params: paramsRef.current,
              paused: playRef.current.paused,
              restart: playRef.current.restart
            }, [offscreen]);
            linkRef.current = { worker, main: null };
            paramsKeyRef.current = JSON.stringify(paramsRef.current ?? null);
            watchSize((next) => worker?.postMessage({ type: 'resize', ...next }));
            return;
          } catch {
            worker = null;
          }
        }

        startOnMain(canvas, { ...box, params: paramsRef.current });
        linkRef.current = {
          worker: null,
          main: () => handle
        };
        watchSize((next) => handle?.resize?.(next.width, next.height, next.dpr));
      });
    };

    timer = window.setTimeout(boot, 0);
    return () => {
      alive = false;
      window.clearTimeout(timer);
      window.cancelAnimationFrame(timer);
      if (observer) observer.disconnect();
      if (worker) worker.terminate();
      if (handle) handle.stop();
      canvas.remove();
    };
  }, [startScene, createWorker]);

  useEffect(() => {
    const link = linkRef.current;
    const next = paramsRef.current;
    if (!link || next == null || paramsKey === paramsKeyRef.current) return;
    if (link.worker) {
      paramsKeyRef.current = paramsKey;
      link.worker.postMessage({ type: 'configure', params: next });
      return;
    }
    const live = link.main?.();
    if (!live?.update) return;
    paramsKeyRef.current = paramsKey;
    live.update(next);
  }, [paramsKey]);

  useEffect(() => {
    const link = linkRef.current;
    if (!link) return;
    const payload = playRef.current;
    if (link.worker) link.worker.postMessage({ type: 'playback', ...payload });
    else link.main?.()?.setPlayback?.(payload);
  }, [paused, epoch]);

  useEffect(() => {
    if (!trackPointer) return undefined;
    const host = hostRef.current;
    if (!host) return undefined;
    let frame = 0;
    let pending = null;
    const flush = () => {
      frame = 0;
      const link = linkRef.current;
      const next = pending;
      pending = null;
      if (!link || !next) return;
      if (link.worker) link.worker.postMessage({ type: 'pointer', ...next });
      else link.main?.()?.setPointer?.(next);
    };
    const queue = (next) => {
      pending = next;
      if (!frame) frame = window.requestAnimationFrame(flush);
    };
    const onMove = (event) => {
      const rect = host.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      const inside = x >= 0 && x <= 1 && y >= 0 && y <= 1;
      queue({
        x: Math.min(1, Math.max(0, x)),
        y: Math.min(1, Math.max(0, y)),
        active: inside
      });
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [trackPointer]);

  return hostRef;
}

export function SceneHost({ color, startScene, createWorker, params, paused = false, epoch = 0, trackPointer = false }) {
  const hostRef = useSceneCanvas(startScene, createWorker, params, paused, epoch, trackPointer);
  return <div ref={hostRef} style={{ position: 'absolute', inset: 0, backgroundColor: params?.background || color }} />;
}
