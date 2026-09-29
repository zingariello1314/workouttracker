import { startTornado } from './tornadoScene.js';

let handle = null;

function apply(data) {
  if (data.type === 'resize') handle?.resize(data.width, data.height, data.dpr);
  else if (data.type === 'configure') handle?.update?.(data.params);
  else if (data.type === 'playback') handle?.setPlayback?.(data);
  else if (data.type === 'pointer') handle?.setPointer?.(data);
}

self.onmessage = (event) => {
  const data = event.data || {};
  if (data.type !== 'init') {
    apply(data);
    return;
  }
  if (!data.canvas) return;
  try {
    handle = startTornado(data.canvas, data);
    if (data.paused) handle?.setPlayback?.({ paused: true, restart: data.restart || 0 });
  } catch {
    self.postMessage({ type: 'failed' });
  }
};
