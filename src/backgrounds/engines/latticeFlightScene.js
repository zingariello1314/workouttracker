import { normalizeParams } from '../backgroundStudio.js';
import { LATTICE_FRAG, LATTICE_VERT } from './originkitShaders.js';
import { bindTriangle, fitBuffer, hexToRgb, linkProgram } from './shaderHost.js';

const FLOW_AT_50 = 0.3;
const FOG_AT_100 = 0.09;
const CELL_HALF = 0.5;

function viewOf(state) {
  return {
    background: hexToRgb(state.background, [0, 0, 0]),
    base: hexToRgb(state.baseColor, [0, 1, 1]),
    density: Math.max(1, state.density),
    speed: state.speed,
    thickness: Math.max(1, state.thickness),
    fog: Math.max(1, state.fog),
    distance: Math.max(1, state.distance),
    yaw: state.yaw,
    pitch: state.pitch,
    cursor: state.cursor !== false
  };
}

export function startLatticeFlight(canvas, options = {}) {
  const gl = canvas.getContext('webgl', {
    antialias: false,
    alpha: true,
    premultipliedAlpha: true,
    depth: false
  });
  if (!gl) throw new Error('webgl');
  const program = linkProgram(gl, LATTICE_VERT, LATTICE_FRAG);
  gl.useProgram(program);
  const buffer = bindTriangle(gl, program, 'aPos');
  const u = {
    buf: gl.getUniformLocation(program, 'uBuf'),
    res: gl.getUniformLocation(program, 'uRes'),
    angles: gl.getUniformLocation(program, 'uAngles'),
    flow: gl.getUniformLocation(program, 'uFlow'),
    scale: gl.getUniformLocation(program, 'uScale'),
    thick: gl.getUniformLocation(program, 'uThick'),
    dist: gl.getUniformLocation(program, 'uDist'),
    fog: gl.getUniformLocation(program, 'uFog'),
    base: gl.getUniformLocation(program, 'uBase')
  };

  let state = normalizeParams('lattice-flight', options.params);
  let view = viewOf(state);
  let bw = 1;
  let bh = 1;
  let cssW = 1;
  let cssH = 1;
  const applySize = (width, height) => {
    const next = fitBuffer(width, height);
    if (canvas.width !== next.w || canvas.height !== next.h) {
      canvas.width = next.w;
      canvas.height = next.h;
    }
    bw = next.w;
    bh = next.h;
    cssW = Math.max(1, width || 1);
    cssH = Math.max(1, height || 1);
    gl.viewport(0, 0, next.w, next.h);
  };
  applySize(options.width, options.height);

  const ptr = { ax: null, ay: null, nx: 0.5, ny: 0.5, active: false };
  let flow = 0;
  let raf = 0;
  let last = 0;
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
    const scale = view.density / 100;
    flow += dt * FLOW_AT_50 * (view.speed / 50) * scale;
    flow -= Math.floor(flow);

    let ax;
    let ay;
    if (view.cursor && ptr.active && ptr.ax != null) {
      ax = ptr.ax;
      ay = ptr.ay;
    } else {
      ax = (view.yaw * Math.PI) / 180;
      ay = (view.pitch * Math.PI) / 180;
    }

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.clearColor(view.background[0], view.background[1], view.background[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.uniform2f(u.buf, bw, bh);
    gl.uniform2f(u.res, cssW, cssH);
    gl.uniform2f(u.angles, ax, ay);
    gl.uniform1f(u.flow, flow);
    gl.uniform1f(u.scale, scale);
    gl.uniform1f(u.thick, (view.thickness / 100) * CELL_HALF);
    gl.uniform1f(u.dist, view.distance);
    gl.uniform1f(u.fog, FOG_AT_100 * (view.fog / 100));
    gl.uniform3fv(u.base, view.base);
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
      state = normalizeParams('lattice-flight', params);
      view = viewOf(state);
    },
    setPointer({ x = 0.5, y = 0.5, active = false } = {}) {
      ptr.nx = x;
      ptr.ny = y;
      ptr.active = Boolean(active);
      const h = cssH || 1;
      ptr.ax = (2 * x * cssW - cssW) / h;
      ptr.ay = (2 * (1 - y) * h - h) / h;
    },
    setPlayback({ paused: nextPaused = false, restart = 0 } = {}) {
      paused = Boolean(nextPaused);
      if (restart !== restartSeen) {
        restartSeen = restart;
        flow = 0;
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
