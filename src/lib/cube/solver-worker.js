/* global self */
import Cube from 'cubejs';
import { standardizeFacelets } from './model';

let ready = false;

self.onmessage = (event) => {
  const msg = event.data || {};
  try {
    if (msg.type === 'init') {
      if (!ready) {
        Cube.initSolver();
        ready = true;
      }
      self.postMessage({ type: 'ready' });
      return;
    }
    if (msg.type === 'solve') {
      if (!ready) {
        Cube.initSolver();
        ready = true;
      }
      const std = standardizeFacelets(msg.facelets);
      const cube = Cube.fromString(std.ok ? std.facelets : msg.facelets);
      const solution = cube.solve() || '';
      self.postMessage({ type: 'solved', solution: solution.trim() });
    }
  } catch (err) {
    self.postMessage({ type: 'error', message: err?.message || String(err) });
  }
};
