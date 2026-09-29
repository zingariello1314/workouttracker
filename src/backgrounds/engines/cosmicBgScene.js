import { normalizeParams } from '../backgroundStudio.js';
import { COSMIC_FRAG, COSMIC_VERT } from './originkitShaders.js';
import { fitBuffer, hexToRgb, linkProgram } from './shaderHost.js';

const BRIGHTNESS_MAX = 3;

function viewOf(state) {
  return {
    core: state.core !== false,
    coreColor: hexToRgb(state.coreColor, [0.408, 0.137, 0.765]),
    midColor: hexToRgb(state.midColor, [0, 0.482, 1]),
    accentColor: hexToRgb(state.accentColor, [0.6, 0, 1]),
    outerColor: hexToRgb(state.outerColor, [0.976, 0.976, 0.976]),
    detail: 1 + (state.detail / 20) * 4,
    brightness: (state.brightness / 100) * BRIGHTNESS_MAX,
    speed: state.speed / 10,
    rotation: state.rotation / 20
  };
}

export function startCosmicBg(canvas, options = {}) {
  const gl = canvas.getContext('webgl', {
    antialias: false,
    alpha: true,
    depth: false,
    premultipliedAlpha: true
  });
  if (!gl) throw new Error('webgl');
  const program = linkProgram(gl, COSMIC_VERT, COSMIC_FRAG);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, 1, 1, 1, -1, -1, 1, -1]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(program, 'a_pos');
  const u = {
    time: gl.getUniformLocation(program, 'u_time'),
    res: gl.getUniformLocation(program, 'u_res'),
    core: gl.getUniformLocation(program, 'u_core'),
    showCore: gl.getUniformLocation(program, 'u_showCore'),
    mid: gl.getUniformLocation(program, 'u_mid'),
    accent: gl.getUniformLocation(program, 'u_accent'),
    outer: gl.getUniformLocation(program, 'u_outer'),
    complexity: gl.getUniformLocation(program, 'u_complexity'),
    bright: gl.getUniformLocation(program, 'u_bright'),
    rotSpeed: gl.getUniformLocation(program, 'u_rotSpeed')
  };

  let view = viewOf(normalizeParams('cosmic-bg', options.params));
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
  let time = 0;
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
    time += dt * view.speed;
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1f(u.time, time);
    gl.uniform2f(u.res, bw, bh);
    gl.uniform3fv(u.core, view.coreColor);
    gl.uniform1i(u.showCore, view.core ? 1 : 0);
    gl.uniform3fv(u.mid, view.midColor);
    gl.uniform3fv(u.accent, view.accentColor);
    gl.uniform3fv(u.outer, view.outerColor);
    gl.uniform1f(u.complexity, view.detail);
    gl.uniform1f(u.bright, view.brightness);
    gl.uniform1f(u.rotSpeed, view.rotation);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
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
      view = viewOf(normalizeParams('cosmic-bg', params));
    },
    setPlayback({ paused: nextPaused = false, restart = 0 } = {}) {
      paused = Boolean(nextPaused);
      if (restart !== restartSeen) {
        restartSeen = restart;
        time = 0;
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
