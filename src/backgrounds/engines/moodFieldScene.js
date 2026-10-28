import { normalizeParams } from '../backgroundStudio.js';
import { MOOD_FIELD_FRAG, MOOD_FIELD_VERT } from './originkitShaders.js';
import { bindTriangle, fitBuffer, hexToRgb, linkProgram } from './shaderHost.js';

function viewOf(state) {
  return {
    background: hexToRgb(state.background, [0.02, 0.024, 0.039]),
    intense: hexToRgb(state.intenseColor, [1, 0, 0.7]),
    calm: hexToRgb(state.calmColor, [0.18, 0.42, 1]),
    target: state.mood === 'calm' ? 1 : 0,
    speed: Math.max(0, state.speed) / 50,
    scale: (2.2 * Math.max(1, state.density)) / 100,
    warp: (1.2 * Math.max(0, state.warp)) / 100,
    turbulence: Math.max(0, state.turbulence) / 100,
    contrast: 0.5 + (2.5 * Math.max(0, state.contrast)) / 200,
    reach: Math.max(1, state.reach),
    hover: Math.max(0, state.hover) / 100,
    swirl: (Math.max(-90, Math.min(90, state.swirl)) * Math.PI) / 180,
    damp: 0.0006 * Math.max(1, Math.min(100, state.damping)),
    cursor: state.cursor !== false
  };
}

export function startMoodField(canvas, options = {}) {
  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false
  });
  if (!gl) throw new Error('webgl');
  const program = linkProgram(gl, MOOD_FIELD_VERT, MOOD_FIELD_FRAG);
  gl.useProgram(program);
  const buffer = bindTriangle(gl, program, 'aPos');
  const u = {
    res: gl.getUniformLocation(program, 'iResolution'),
    mouse: gl.getUniformLocation(program, 'iMouse'),
    time: gl.getUniformLocation(program, 'iTime'),
    emotion: gl.getUniformLocation(program, 'uEmotion'),
    intense: gl.getUniformLocation(program, 'uIntense'),
    calm: gl.getUniformLocation(program, 'uCalm'),
    bg: gl.getUniformLocation(program, 'uBg'),
    scale: gl.getUniformLocation(program, 'uScale'),
    warp: gl.getUniformLocation(program, 'uWarp'),
    ridge: gl.getUniformLocation(program, 'uRidge'),
    contrast: gl.getUniformLocation(program, 'uContrast'),
    reach: gl.getUniformLocation(program, 'uReach'),
    hover: gl.getUniformLocation(program, 'uHover'),
    swirl: gl.getUniformLocation(program, 'uSwirl'),
    pointer: gl.getUniformLocation(program, 'uPointer')
  };

  let state = normalizeParams('mood-field', options.params);
  let view = viewOf(state);
  let bw = 1;
  let bh = 1;
  let cssH = 1;
  const applySize = (width, height) => {
    const next = fitBuffer(width, height);
    if (canvas.width !== next.w || canvas.height !== next.h) {
      canvas.width = next.w;
      canvas.height = next.h;
    }
    bw = next.w;
    bh = next.h;
    cssH = Math.max(1, height || 1);
    gl.viewport(0, 0, next.w, next.h);
  };
  applySize(options.width, options.height);

  const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, presence: 0, want: 0 };
  let emotion = view.target;
  let clock = 0;
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
    const dt = last === 0 ? 0 : Math.min(0.1, Math.max(0, (now - last) / 1000));
    last = now;
    const k = 1 - Math.pow(1 - view.damp, dt * 60);
    emotion += (view.target - emotion) * k;
    clock += dt * view.speed;
    const mk = 1 - Math.pow(1 - 0.18, dt * 60);
    mouse.x += (mouse.tx - mouse.x) * mk;
    mouse.y += (mouse.ty - mouse.y) * mk;
    const want = view.cursor ? mouse.want : 0;
    mouse.presence += (want - mouse.presence) * mk;

    gl.useProgram(program);
    gl.uniform2f(u.res, bw, bh);
    gl.uniform2f(u.mouse, mouse.x * bw, (1 - mouse.y) * bh);
    gl.uniform1f(u.time, clock);
    gl.uniform1f(u.emotion, emotion);
    gl.uniform3fv(u.intense, view.intense);
    gl.uniform3fv(u.calm, view.calm);
    gl.uniform3fv(u.bg, view.background);
    gl.uniform1f(u.scale, view.scale);
    gl.uniform1f(u.warp, view.warp * (1 - 0.3 * emotion));
    gl.uniform1f(u.ridge, Math.min(1, view.turbulence * (0.9 - 0.6 * emotion)));
    gl.uniform1f(u.contrast, view.contrast);
    gl.uniform1f(u.reach, view.reach * (bh / cssH));
    gl.uniform1f(u.hover, view.hover);
    gl.uniform1f(u.swirl, view.swirl);
    gl.uniform1f(u.pointer, mouse.presence);
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
      state = normalizeParams('mood-field', params);
      view = viewOf(state);
    },
    setPointer({ x = 0.5, y = 0.5, active = false } = {}) {
      mouse.tx = x;
      mouse.ty = y;
      mouse.want = active ? 1 : 0;
    },
    setPlayback({ paused: nextPaused = false, restart = 0 } = {}) {
      paused = Boolean(nextPaused);
      if (restart !== restartSeen) {
        restartSeen = restart;
        clock = 0;
        last = 0;
        emotion = view.target;
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
