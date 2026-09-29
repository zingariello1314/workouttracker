import { normalizeParams } from '../backgroundStudio.js';
import { CHROME_FRAG, CHROME_VERT } from './originkitShaders.js';
import { bindTriangle, fitBuffer, hexToRgb, linkProgram } from './shaderHost.js';

function viewOf(state) {
  return {
    background: hexToRgb(state.background, [0.016, 0.016, 0.02]),
    base: hexToRgb(state.baseColor, [0.596, 0.596, 0.596]),
    accent: hexToRgb(state.accentColor, [1, 1, 1]),
    speed: state.speed / 50,
    hover: state.hover / 100,
    cursor: state.cursor !== false,
    scale: (state.scale / 100) * 3.3,
    thick: state.thickness / 100,
    detail: state.detail / 100,
    warp: (state.warp / 100) * 0.62,
    polish: state.polish / 100,
    contrast: state.contrast / 100,
    light: (state.light * Math.PI) / 180
  };
}

export function startChromeCells(canvas, options = {}) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false });
  if (!gl) throw new Error('webgl');
  const program = linkProgram(gl, CHROME_VERT, CHROME_FRAG);
  gl.useProgram(program);
  const buffer = bindTriangle(gl, program, 'a_pos');
  const u = {
    res: gl.getUniformLocation(program, 'uRes'),
    tilt: gl.getUniformLocation(program, 'uTilt'),
    time: gl.getUniformLocation(program, 'uTime'),
    dpr: gl.getUniformLocation(program, 'uDpr'),
    background: gl.getUniformLocation(program, 'uBackgroundColor'),
    base: gl.getUniformLocation(program, 'uBaseColor'),
    accent: gl.getUniformLocation(program, 'uAccentColor'),
    scale: gl.getUniformLocation(program, 'uScale'),
    thick: gl.getUniformLocation(program, 'uThick'),
    detail: gl.getUniformLocation(program, 'uDetail'),
    warp: gl.getUniformLocation(program, 'uWarp'),
    polish: gl.getUniformLocation(program, 'uPolish'),
    contrast: gl.getUniformLocation(program, 'uContrast'),
    light: gl.getUniformLocation(program, 'uLight')
  };

  let state = normalizeParams('chrome-cells', options.params);
  let view = viewOf(state);
  let bw = 1;
  let bh = 1;
  let dpr = 1;
  const applySize = (width, height) => {
    const next = fitBuffer(width, height);
    if (canvas.width !== next.w || canvas.height !== next.h) {
      canvas.width = next.w;
      canvas.height = next.h;
    }
    bw = next.w;
    bh = next.h;
    dpr = next.dpr;
    gl.viewport(0, 0, next.w, next.h);
  };
  applySize(options.width, options.height);

  const ptr = { tx: 0, ty: 0, on: 0, onTarget: 0, nx: 0.5, ny: 0.5 };
  let raf = 0;
  let last = 0;
  let clock = 0;
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
    clock = (clock + dt * view.speed) % 7200;
    const k = 1 - Math.exp(-5 * dt);
    ptr.on += (ptr.onTarget - ptr.on) * k;
    const amt = (view.cursor ? view.hover : 0) * ptr.on;
    const idleMix = 1 - Math.min(1, amt);
    const aimX = (ptr.nx - 0.5) * 1.6 * amt + Math.sin(clock * 0.19) * 0.3 * idleMix;
    const aimY = (ptr.ny - 0.5) * 1.1 * amt + Math.cos(clock * 0.14) * 0.18 * idleMix;
    ptr.tx += (aimX - ptr.tx) * k;
    ptr.ty += (aimY - ptr.ty) * k;

    gl.useProgram(program);
    gl.uniform2f(u.res, bw, bh);
    gl.uniform2f(u.tilt, ptr.tx, ptr.ty);
    gl.uniform1f(u.time, clock);
    gl.uniform1f(u.dpr, dpr);
    gl.uniform3fv(u.background, view.background);
    gl.uniform3fv(u.base, view.base);
    gl.uniform3fv(u.accent, view.accent);
    gl.uniform1f(u.scale, view.scale);
    gl.uniform1f(u.thick, view.thick);
    gl.uniform1f(u.detail, view.detail);
    gl.uniform1f(u.warp, view.warp);
    gl.uniform1f(u.polish, view.polish);
    gl.uniform1f(u.contrast, view.contrast);
    gl.uniform1f(u.light, view.light);
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
      state = normalizeParams('chrome-cells', params);
      view = viewOf(state);
    },
    setPointer({ x = 0.5, y = 0.5, active = false } = {}) {
      ptr.nx = x;
      ptr.ny = 1 - y;
      ptr.onTarget = active ? 1 : 0;
    },
    setPlayback({ paused: nextPaused = false, restart = 0 } = {}) {
      paused = Boolean(nextPaused);
      if (restart !== restartSeen) {
        restartSeen = restart;
        clock = 0;
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
