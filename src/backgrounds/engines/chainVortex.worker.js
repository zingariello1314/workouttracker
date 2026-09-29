import { startChainVortex } from './chainVortexScene.js';

let handle = null;

function apply(data) {
  if (data.type === 'resize') handle?.resize(data.width, data.height, data.dpr);
  else if (data.type === 'configure') handle?.update?.(data.params);
  else if (data.type === 'playback') handle?.setPlayback?.(data);
}

self.onmessage = (event) => {
  const data = event.data || {};
  if (data.type !== 'init') {
    apply(data);
    return;
  }
  if (!data.canvas) return;
  try {
    handle = startChainVortex(data.canvas, data);
    if (data.paused) handle?.setPlayback?.({ paused: true, restart: data.restart || 0 });
  } catch {
    self.postMessage({ type: 'failed' });
  }
};
