import { normalizeParams } from '../backgroundStudio.js';
import { LIGHT_CABLES_FRAG, LIGHT_CABLES_VERT } from './originkitShaders.js';
import { bindTriangle, fitBuffer, hexToRgb, linkProgram } from './shaderHost.js';

const MAX_CABLES = 48;
const GRAIN = 0.012;

function viewOf(state) {
  const direction = state.direction || 'ttb';
  return {
    background: hexToRgb(state.background, [0, 0, 0]),
    base: hexToRgb(state.baseColor, [0, 0, 0]),
    accent: hexToRgb(state.accentColor, [1, 0.69, 0]),
    high: hexToRgb(state.highlight, [1, 0.85, 0]),
    speed: Math.max(0, state.speed) / 50,
    hover: Math.max(0, state.hover) / 100,
    grab: Math.max(10, state.grab) / 100,
    count: Math.round(Math.max(4, Math.min(MAX_CABLES, state.count))),
    bend: Math.max(0, state.bend) / 100,
    spread: Math.max(10, state.spread) / 100,
    thickness: Math.max(20, state.thickness) / 100,
    wStart: Math.max(0, state.widthStart) / 100,
    wEnd: Math.max(0, state.widthEnd) / 100,
    flow: Math.max(0, state.flow) / 100,
    pulses: Math.max(1, state.pulses),
    axis: direction === 'ttb' || direction === 'btt' ? 1 : 0,
    dir: direction === 'rtl' || direction === 'ttb' ? -1 : 1,
    posX: state.positionX / 100,
    posY: state.positionY / 100,
    cursor: state.cursor !== false
  };
}

export function startLightCables(canvas, options = {}) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: false });
  if (!gl) throw new Error('webgl');
  const program = linkProgram(gl, LIGHT_CABLES_VERT, LIGHT_CABLES_FRAG);
  gl.useProgram(program);
  const buffer = bindTriangle(gl, program, 'a_pos');
  const u = {
    res: gl.getUniformLocation(program, 'uRes'),
    time: gl.getUniformLocation(program, 'uTime'),
    mouse: gl.getUniformLocation(program, 'uMouse'),
    hover: gl.getUniformLocation(program, 'uHover'),
    bg: gl.getUniformLocation(program, 'uBg'),
    base: gl.getUniformLocation(program, 'uBase'),
    accent: gl.getUniformLocation(program, 'uAccent'),
    high: gl.getUniformLocation(program, 'uHigh'),
    count: gl.getUniformLocation(program, 'uCount'),
    bend: gl.getUniformLocation(program, 'uBend'),
    spread: gl.getUniformLocation(program, 'uSpread'),
    wStart: gl.getUniformLocation(program, 'uWStart'),
    wEnd: gl.getUniformLocation(program, 'uWEnd'),
    axis: gl.getUniformLocation(program, 'uAxis'),
    dir: gl.getUniformLocation(program, 'uDir'),
    posX: gl.getUniformLocation(program, 'uPosX'),
    posY: gl.getUniformLocation(program, 'uPosY'),
    thick: gl.getUniformLocation(program, 'uThick'),
    flow: gl.getUniformLocation(program, 'uFlow'),
    pulses: gl.getUniformLocation(program, 'uPulses'),
    grab: gl.getUniformLocation(program, 'uGrab'),
    grain: gl.getUniformLocation(program, 'uGrain')
  };

  let state = normalizeParams('light-cables', options.params);
  let view = viewOf(state);
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

  const ptr = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, on: 0, onTarget: 0 };
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
    clock = (clock + dt * view.speed) % 3600;
    const k = 1 - Math.exp(-6 * dt);
    const want = view.cursor ? ptr.onTarget : 0;
    ptr.on += (want - ptr.on) * k;
    ptr.x += ((want > 0 ? ptr.tx : 0.5) - ptr.x) * k;
    ptr.y += ((want > 0 ? ptr.ty : 0.5) - ptr.y) * k;

    gl.useProgram(program);
    gl.uniform2f(u.res, bw, bh);
    gl.uniform1f(u.time, clock);
    gl.uniform2f(u.mouse, ptr.x, 1 - ptr.y);
    gl.uniform1f(u.hover, Math.min(1, ptr.on) * view.hover);
    gl.uniform3fv(u.bg, view.background);
    gl.uniform3fv(u.base, view.base);
    gl.uniform3fv(u.accent, view.accent);
    gl.uniform3fv(u.high, view.high);
    gl.uniform1f(u.count, view.count);
    gl.uniform1f(u.bend, view.bend);
    gl.uniform1f(u.spread, view.spread);
    gl.uniform1f(u.wStart, view.wStart);
    gl.uniform1f(u.wEnd, view.wEnd);
    gl.uniform1f(u.axis, view.axis);
    gl.uniform1f(u.dir, view.dir);
    gl.uniform1f(u.posX, view.posX);
    gl.uniform1f(u.posY, view.posY);
    gl.uniform1f(u.thick, view.thickness);
    gl.uniform1f(u.flow, view.flow);
    gl.uniform1f(u.pulses, view.pulses);
    gl.uniform1f(u.grab, view.grab);
    gl.uniform1f(u.grain, GRAIN);
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
      state = normalizeParams('light-cables', params);
      view = viewOf(state);
    },
    setPointer({ x = 0.5, y = 0.5, active = false } = {}) {
      ptr.tx = x;
      ptr.ty = y;
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
