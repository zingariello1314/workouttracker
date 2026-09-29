import { normalizeParams } from '../backgroundStudio.js';
import { CHAIN_FRAG, CHAIN_VERT } from './originkitShaders.js';
import { bindTriangle, fitBuffer, hexToRgb, linkProgram } from './shaderHost.js';

const TAU = 6.283185307179586;
const CHAIN_PERIOD = 2.64;
const LANE = 3;
const SLIDE_RATE = 0.9;

function chainMap(density, twist) {
  return [(density * LANE) / TAU, (-twist * CHAIN_PERIOD) / TAU];
}

export function startChainVortex(canvas, options = {}) {
  const gl = canvas.getContext('webgl', {
    antialias: false,
    alpha: true,
    premultipliedAlpha: true,
    depth: false
  });
  if (!gl) throw new Error('webgl');
  const program = linkProgram(gl, CHAIN_VERT, CHAIN_FRAG);
  gl.useProgram(program);
  const buffer = bindTriangle(gl, program, 'aPos');
  const uRes = gl.getUniformLocation(program, 'uRes');
  const uMap = gl.getUniformLocation(program, 'uMap');
  const uSlide = gl.getUniformLocation(program, 'uSlide');
  const uColor = gl.getUniformLocation(program, 'uColor');

  let state = normalizeParams('chain-vortex', options.params);
  let bw = 1;
  let bh = 1;
  const applySize = (width, height) => {
    const next = fitBuffer(width, height);
    if (canvas.width !== next.w || canvas.height !== next.h) {
      canvas.width = next.w;
      canvas.height = next.h;
    }
    bw = next.w;
    bh = next.h;
    gl.viewport(0, 0, next.w, next.h);
  };
  applySize(options.width, options.height);

  let raf = 0;
  let last = 0;
  let slide = 0;
  let stopped = false;
  let paused = false;
  let restartSeen = 0;
  let readySent = false;

  const frame = (now) => {
    if (stopped) return;
    raf = self.requestAnimationFrame(frame);
    if (paused) return;
    const dt = last === 0 ? 0 : Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    slide += dt * (state.speed / 50) * SLIDE_RATE;
    slide %= CHAIN_PERIOD;
    if (slide < 0) slide += CHAIN_PERIOD;
    const [mapA, mapB] = chainMap(Math.round(state.density), Math.round(state.twist));
    const color = hexToRgb(state.baseColor, [0.455, 0.455, 0.455]);
    gl.useProgram(program);
    gl.uniform2f(uRes, bw, bh);
    gl.uniform2f(uMap, mapA, mapB);
    gl.uniform1f(uSlide, slide);
    gl.uniform3f(uColor, color[0], color[1], color[2]);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!readySent) {
      readySent = true;
      options.onReady?.();
    }
  };
  raf = self.requestAnimationFrame(frame);

  return {
    resize(width, height) {
      applySize(width, height);
    },
    update(params) {
      if (stopped) return;
      state = normalizeParams('chain-vortex', params);
    },
    setPlayback({ paused: nextPaused = false, restart = 0 } = {}) {
      paused = Boolean(nextPaused);
      if (restart !== restartSeen) {
        restartSeen = restart;
        slide = 0;
        last = 0;
      }
      self.cancelAnimationFrame(raf);
      if (!paused) raf = self.requestAnimationFrame(frame);
    },
    stop() {
      stopped = true;
      self.cancelAnimationFrame(raf);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    }
  };
}
