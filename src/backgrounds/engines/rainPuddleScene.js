import { normalizeParams } from '../backgroundStudio.js';
import { RAIN_PUDDLE_FRAG, RAIN_PUDDLE_VERT } from './originkitShaders.js';
import { bindTriangle, fitBuffer, hexToRgb, linkProgram } from './shaderHost.js';

const CHASE = 14;
const MAX_PULSES = 8;
const EMIT_DIST = 0.09;
const PULSE_LIFE = 2.4;
const CAM_H = 1.0;
const TANH = 0.45;

function viewOf(state) {
  return {
    sky: hexToRgb(state.background, [0, 0, 0]),
    base: hexToRgb(state.baseColor, [0.012, 0.4, 0.102]),
    accent: hexToRgb(state.accentColor, [1, 1, 1]),
    speed: state.speed,
    pitch: (Math.max(2, state.tilt) * Math.PI) / 180,
    rain: state.rain / 100,
    cover: state.coverage / 100,
    pScale: (state.puddleScale / 100) * 1.1,
    reflect: state.reflection / 100,
    ripple: state.ripples / 100,
    streak: state.streaks / 100,
    reach: (state.reach / 100) * 1.2,
    pulseAmp: state.cursorRipple / 100,
    glow: (state.glow / 100) * 0.55,
    cursor: state.cursor !== false
  };
}

function project(nx, ny, pitch) {
  const rcx = nx * TANH;
  const rcy = ny * TANH;
  const rcz = -1;
  const inv = 1 / Math.hypot(rcx, rcy, rcz);
  const cx = rcx * inv;
  const cy = rcy * inv;
  const cz = rcz * inv;
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const ry = cy * cp + cz * sp;
  const rz = -cy * sp + cz * cp;
  if (ry >= -1e-3) return null;
  const t = Math.min(CAM_H / -ry, 400);
  return [cx * t, rz * t];
}

export function startRainPuddle(canvas, options = {}) {
  const gl = canvas.getContext('webgl', {
    antialias: false,
    alpha: false,
    depth: false,
    preserveDrawingBuffer: true
  });
  if (!gl) throw new Error('webgl');
  const program = linkProgram(gl, RAIN_PUDDLE_VERT, RAIN_PUDDLE_FRAG);
  gl.useProgram(program);
  const buffer = bindTriangle(gl, program, 'a_pos');
  const u = {
    res: gl.getUniformLocation(program, 'uRes'),
    time: gl.getUniformLocation(program, 'uTime'),
    pitch: gl.getUniformLocation(program, 'uPitch'),
    sky: gl.getUniformLocation(program, 'uSky'),
    base: gl.getUniformLocation(program, 'uBase'),
    accent: gl.getUniformLocation(program, 'uAccent'),
    rain: gl.getUniformLocation(program, 'uRain'),
    cover: gl.getUniformLocation(program, 'uCover'),
    pScale: gl.getUniformLocation(program, 'uPScale'),
    reflect: gl.getUniformLocation(program, 'uReflect'),
    ripple: gl.getUniformLocation(program, 'uRipple'),
    streak: gl.getUniformLocation(program, 'uStreak'),
    cursor: gl.getUniformLocation(program, 'uCursor'),
    reach: gl.getUniformLocation(program, 'uReach'),
    glow: gl.getUniformLocation(program, 'uGlow'),
    pulseAmp: gl.getUniformLocation(program, 'uPulseAmp'),
    engaged: gl.getUniformLocation(program, 'uEngaged'),
    pulses: gl.getUniformLocation(program, 'uPulses[0]'),
    now: gl.getUniformLocation(program, 'uNow')
  };

  let state = normalizeParams('rain-puddle', options.params);
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

  let aimX = 0;
  let aimZ = 0;
  let curX = 0;
  let curZ = 0;
  let engaged = false;
  const pulses = new Float32Array(MAX_PULSES * 4);
  let pulseHead = 0;
  let lastEmitX = 0;
  let lastEmitZ = 0;
  let hasEmitted = false;
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
    const dt = last === 0 ? 0 : Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    clock += dt * (view.speed / 50);
    const k = 1 - Math.exp(-CHASE * dt);
    curX += (aimX - curX) * k;
    curZ += (aimZ - curZ) * k;

    if (view.cursor && engaged) {
      const dx = curX - lastEmitX;
      const dz = curZ - lastEmitZ;
      if (!hasEmitted || dx * dx + dz * dz > EMIT_DIST * EMIT_DIST) {
        const o = pulseHead * 4;
        pulses[o] = curX;
        pulses[o + 1] = curZ;
        pulses[o + 2] = clock;
        pulses[o + 3] = 1;
        pulseHead = (pulseHead + 1) % MAX_PULSES;
        lastEmitX = curX;
        lastEmitZ = curZ;
        hasEmitted = true;
      }
    }
    for (let i = 0; i < MAX_PULSES; i++) {
      if (pulses[i * 4 + 3] > 0.5 && clock - pulses[i * 4 + 2] > PULSE_LIFE) {
        pulses[i * 4 + 3] = 0;
      }
    }

    gl.useProgram(program);
    gl.uniform2f(u.res, bw, bh);
    gl.uniform1f(u.time, clock);
    gl.uniform1f(u.pitch, view.pitch);
    gl.uniform3fv(u.sky, view.sky);
    gl.uniform3fv(u.base, view.base);
    gl.uniform3fv(u.accent, view.accent);
    gl.uniform1f(u.rain, view.rain);
    gl.uniform1f(u.cover, view.cover);
    gl.uniform1f(u.pScale, view.pScale);
    gl.uniform1f(u.reflect, view.reflect);
    gl.uniform1f(u.ripple, view.ripple);
    gl.uniform1f(u.streak, view.streak);
    gl.uniform2f(u.cursor, curX, curZ);
    gl.uniform1f(u.reach, view.reach);
    gl.uniform1f(u.glow, view.glow);
    gl.uniform1f(u.pulseAmp, view.pulseAmp);
    gl.uniform1f(u.engaged, view.cursor && engaged ? 1 : 0);
    gl.uniform4fv(u.pulses, pulses);
    gl.uniform1f(u.now, clock);
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
      state = normalizeParams('rain-puddle', params);
      view = viewOf(state);
    },
    setPointer({ x = 0.5, y = 0.5, active = false } = {}) {
      if (!active || !view.cursor) {
        engaged = false;
        return;
      }
      const nx = ((2 * x - 1) * cssW) / cssH;
      const ny = 1 - 2 * y;
      const hit = project(nx, ny, view.pitch);
      if (!hit) return;
      aimX = hit[0];
      aimZ = hit[1];
      if (!engaged) {
        curX = aimX;
        curZ = aimZ;
        lastEmitX = aimX;
        lastEmitZ = aimZ;
        hasEmitted = false;
      }
      engaged = true;
    },
    setPlayback({ paused: nextPaused = false, restart = 0 } = {}) {
      paused = Boolean(nextPaused);
      if (restart !== restartSeen) {
        restartSeen = restart;
        clock = 0;
        last = 0;
        pulses.fill(0);
        hasEmitted = false;
        engaged = false;
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
