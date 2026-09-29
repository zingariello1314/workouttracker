import { normalizeParams } from '../backgroundStudio.js';

/**
 * Disque d'accrétion (Originkit accretion-disc-03), sans React.
 * Conçu pour un OffscreenCanvas dans un worker : tailles explicites, DPR plafonné.
 * Les réglages sont ceux du composant installé (densité 61, bras, couleurs).
 */

const TAU = Math.PI * 2;
const ROUT = 100;
const FOV_DEG = 34;
const FOCAL = 1 / Math.tan((FOV_DEG * Math.PI) / 180 / 2);
const RIN_FLOOR = 1.0;
const THICKNESS = 2.4;
const WIND = 3.4;
const ARM_SHARPNESS = 2.6;
const ARM_PULL = 0.45;
const ARM_SPIN = 0.06;
const JET_FLOW = 0.09;
const JET_HELIX = 0.0055;
const JET_SHARE = 0.32;
const FOCUS_MULT = 1.75;
const HALO = 1.7;
const ORBIT_REF = 0.449;
const DOT_REF = 0.16;
const BLUR_REF = 0.64;
const COUNT_BASE = 20000;
const COUNT_PER = 3600;
const TIME_WRAP = 1e5;

const PARTICLE_VERT = `
precision highp float;
attribute vec4 aSeed;
attribute float aKind;
uniform float uTime;
uniform float uTilt;
uniform float uDist;
uniform float uAspect;
uniform float uHalfH;
uniform float uDotSize;
uniform float uBlur;
uniform float uScatter;
uniform float uCore;
uniform float uArms;
uniform float uJetAmount;
uniform float uJetLen;
uniform float uJetSpread;
varying float vAlpha;
varying float vRamp;
const float FOCAL = ${FOCAL.toFixed(6)};
const float ROUT = ${ROUT.toFixed(1)};
const float WIND = ${WIND.toFixed(3)};
const float THICKNESS = ${THICKNESS.toFixed(2)};
const float ORBIT = ${ORBIT_REF.toFixed(4)};
void kill() {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 0.0;
    vAlpha = 0.0;
    vRamp = 0.0;
}
void main() {
    float rIn = max(uCore * 1.32, ${RIN_FLOOR.toFixed(1)});
    vec3 p;
    float bright;
    float ramp;
    if (aKind == 0.0) {
        float r = sqrt(mix(0.0, ROUT * ROUT, aSeed.x));
        float f = clamp(r / max(ROUT, 1e-3), 0.0, 1.0);
        float th = aSeed.y + ORBIT * pow(max(rIn, 0.1) / max(r, 0.1), 1.5) * uTime;
        float armAngle = uArms * (th - WIND * log(max(r, 0.1) / max(rIn, 0.1)))
                       - ${ARM_SPIN.toFixed(3)} * uTime * min(uArms, 1.0);
        th -= ${ARM_PULL.toFixed(2)} * sin(armAngle) / max(uArms, 1.0);
        float arm = pow(0.5 + 0.5 * cos(armAngle), ${ARM_SHARPNESS.toFixed(1)});
        float flare = 0.30 + 0.70 * pow(f, 1.2);
        float y = aSeed.z * THICKNESS * uScatter * flare;
        p = vec3(r * cos(th), y, r * sin(th));
        float radial = 1.0 - smoothstep(0.45, 1.0, f);
        radial *= 1.0 + 1.4 * exp(-pow((f - 0.32) / 0.20, 2.0));
        float farSide = 0.5 - 0.5 * (p.z / max(r, 1e-3));
        bright = radial * (0.34 + 0.75 * arm) * mix(0.62, 1.0, farSide) * 1.45;
        ramp = clamp((1.0 - f) * 0.55 + arm * 0.55, 0.0, 1.0);
    } else {
        if (aSeed.w > uJetAmount) { kill(); return; }
        float u = fract(aSeed.x + ${JET_FLOW.toFixed(3)} * uTime);
        float climb = pow(u, 1.35) * uJetLen;
        float cone = tan(uJetSpread) * climb * (0.30 + 0.70 * u) + uCore * 0.35;
        float rr = aSeed.z * cone;
        float az = aSeed.y + climb * ${JET_HELIX.toFixed(4)};
        p = vec3(rr * cos(az), aKind * climb, rr * sin(az));
        bright = mix(1.0, 0.20, smoothstep(0.0, 1.0, u)) * (0.28 + 0.72 * (1.0 - aSeed.z)) * 1.75;
        ramp = 0.30 + 0.40 * (1.0 - u);
    }
    float c = cos(uTilt);
    float s = sin(uTilt);
    vec3 camPos = vec3(0.0, uDist * s, uDist * c);
    vec3 rel = p - camPos;
    vec3 q = vec3(rel.x, c * rel.y - s * rel.z, s * rel.y + c * rel.z);
    float depth = -q.z;
    if (depth < 1.0) { kill(); return; }
    gl_Position = vec4(q.x * FOCAL / (depth * uAspect), q.y * FOCAL / depth, 0.0, 1.0);
    float ppw = FOCAL * uHalfH / depth;
    float focusD = uDist * ${FOCUS_MULT.toFixed(2)};
    float coc = uBlur * max(0.0, focusD - depth) / focusD;
    float px = (uDotSize + coc) * ppw * ${HALO.toFixed(2)};
    vAlpha = bright * pow(uDotSize / max(uDotSize + coc, 1e-5), 1.6);
    float optical = px / ${HALO.toFixed(2)};
    if (optical < 1.0) vAlpha *= optical * optical;
    vRamp = ramp;
    gl_PointSize = clamp(px, 1.0, 96.0);
}
`;

const PARTICLE_FRAG = `
precision highp float;
uniform vec3 uBase;
uniform vec3 uAccent;
varying float vAlpha;
varying float vRamp;
void main() {
    vec2 d = gl_PointCoord - 0.5;
    float r2 = dot(d, d) * 4.0;
    if (r2 > 1.0) discard;
    float core = max(0.0, exp(-r2 * 9.25) - 0.0000961);
    float skirt = max(0.0, exp(-r2 * 1.80) - 0.165299);
    float g = core + 0.30 * skirt;
    float e = g * vAlpha;
    vec3 col = mix(uBase, uAccent, vRamp);
    gl_FragColor = vec4(col * e, e);
}
`;

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  return sh;
}

function link(gl, vs, fs) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  return p;
}

function mulberry32(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(rnd) {
  const u1 = Math.max(1e-9, rnd());
  const u2 = rnd();
  const g = Math.sqrt(-2 * Math.log(u1)) * Math.cos(TAU * u2);
  return Math.max(-3, Math.min(3, g));
}

function hexToRgb(hex) {
  const h = String(hex || '#000000').replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
}

function buildCloud(count, jetsVisible) {
  const seedList = [];
  const kindList = [];
  const rnd = mulberry32(0x9e3779b9);
  const jetsOn = Boolean(jetsVisible);
  for (let i = 0; i < count; i += 1) {
    if (rnd() >= JET_SHARE) {
      seedList.push(rnd(), rnd() * TAU, gauss(rnd), rnd());
      kindList.push(0);
    } else if (jetsOn) {
      seedList.push(rnd(), rnd() * TAU, Math.sqrt(rnd()), rnd());
      kindList.push(rnd() < 0.5 ? 1 : -1);
    } else {
      rnd();
      rnd();
      rnd();
      rnd();
      rnd();
    }
  }
  return {
    seed: new Float32Array(seedList),
    kind: new Float32Array(kindList),
    count: kindList.length
  };
}

export function startAccretionDisc(canvas, options = {}) {
  const dpr = Math.min(options.dpr || 1, 1);
  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance'
  });
  if (!gl) {
    options.onReady?.();
    return { resize() {}, stop() {} };
  }

  const particleProg = link(gl, PARTICLE_VERT, PARTICLE_FRAG);
  const pu = {
    uTime: gl.getUniformLocation(particleProg, 'uTime'),
    uTilt: gl.getUniformLocation(particleProg, 'uTilt'),
    uDist: gl.getUniformLocation(particleProg, 'uDist'),
    uAspect: gl.getUniformLocation(particleProg, 'uAspect'),
    uHalfH: gl.getUniformLocation(particleProg, 'uHalfH'),
    uDotSize: gl.getUniformLocation(particleProg, 'uDotSize'),
    uBlur: gl.getUniformLocation(particleProg, 'uBlur'),
    uScatter: gl.getUniformLocation(particleProg, 'uScatter'),
    uCore: gl.getUniformLocation(particleProg, 'uCore'),
    uArms: gl.getUniformLocation(particleProg, 'uArms'),
    uJetAmount: gl.getUniformLocation(particleProg, 'uJetAmount'),
    uJetLen: gl.getUniformLocation(particleProg, 'uJetLen'),
    uJetSpread: gl.getUniformLocation(particleProg, 'uJetSpread'),
    uBase: gl.getUniformLocation(particleProg, 'uBase'),
    uAccent: gl.getUniformLocation(particleProg, 'uAccent')
  };
  const aSeed = gl.getAttribLocation(particleProg, 'aSeed');
  const aKind = gl.getAttribLocation(particleProg, 'aKind');
  const seedBuf = gl.createBuffer();
  const kindBuf = gl.createBuffer();
  let state = normalizeParams('accretion-disc-03', options.params);
  let jetsOn = state.jetAmount > 0;
  let drawCount = 0;

  const uploadCloud = () => {
    const count = Math.round(COUNT_BASE + state.density * COUNT_PER);
    const cloud = buildCloud(count, jetsOn);
    gl.bindBuffer(gl.ARRAY_BUFFER, seedBuf);
    gl.bufferData(gl.ARRAY_BUFFER, cloud.seed, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, kindBuf);
    gl.bufferData(gl.ARRAY_BUFFER, cloud.kind, gl.STATIC_DRAW);
    drawCount = cloud.count;
  };
  uploadCloud();

  const baseColor = new Float32Array(hexToRgb(state.baseColor));
  const accentColor = new Float32Array(hexToRgb(state.accentColor));

  const fillLive = () => ({
    dotSize: (DOT_REF * state.dotSize) / 100,
    speed: state.speed,
    distance: state.distance,
    scatter: state.scatter / 100,
    blur: (BLUR_REF * state.blur) / 100,
    tilt: (state.tilt * Math.PI) / 180,
    core: (state.core / 100) * ROUT,
    arms: state.arms,
    jetAmount: state.jetAmount / 100,
    jetLen: (state.jetLength / 100) * ROUT,
    jetSpread: (state.jetSpread * Math.PI) / 180
  });
  let live = fillLive();

  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);

  let bw = 1;
  let bh = 1;
  const applySize = (width, height, nextDpr) => {
    const ratio = Math.min(nextDpr || dpr, 1);
    const w = Math.max(1, Math.round((width || 1) * ratio));
    const h = Math.max(1, Math.round((height || 1) * ratio));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    bw = w;
    bh = h;
    gl.viewport(0, 0, w, h);
  };
  applySize(options.width, options.height, dpr);

  let raf = 0;
  let last = 0;
  let t = 0;
  let readySent = false;
  let stopped = false;
  let paused = false;
  let restartSeen = 0;

  const frame = (now) => {
    if (stopped) return;
    raf = self.requestAnimationFrame(frame);
    if (paused) return;
    const dt = last === 0 ? 0 : Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    const speedScale = live.speed / 50;
    t = (t + dt * speedScale) % TIME_WRAP;
    const aspect = bw / Math.max(bh, 1);
    const halfH = bh * 0.5;

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(particleProg);
    gl.uniform1f(pu.uTime, t);
    gl.uniform1f(pu.uTilt, live.tilt);
    gl.uniform1f(pu.uDist, live.distance);
    gl.uniform1f(pu.uAspect, aspect);
    gl.uniform1f(pu.uHalfH, halfH);
    gl.uniform1f(pu.uDotSize, live.dotSize);
    gl.uniform1f(pu.uBlur, live.blur);
    gl.uniform1f(pu.uScatter, live.scatter);
    gl.uniform1f(pu.uCore, live.core);
    gl.uniform1f(pu.uArms, live.arms);
    gl.uniform1f(pu.uJetAmount, live.jetAmount);
    gl.uniform1f(pu.uJetLen, live.jetLen);
    gl.uniform1f(pu.uJetSpread, live.jetSpread);
    gl.uniform3fv(pu.uBase, baseColor);
    gl.uniform3fv(pu.uAccent, accentColor);
    gl.bindBuffer(gl.ARRAY_BUFFER, seedBuf);
    gl.enableVertexAttribArray(aSeed);
    gl.vertexAttribPointer(aSeed, 4, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, kindBuf);
    gl.enableVertexAttribArray(aKind);
    gl.vertexAttribPointer(aKind, 1, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.POINTS, 0, drawCount);
    if (!readySent) {
      readySent = true;
      options.onReady?.();
    }
  };
  raf = self.requestAnimationFrame(frame);

  return {
    resize(width, height, nextDpr) {
      applySize(width, height, nextDpr);
    },
    update(params) {
      if (stopped) return;
      const next = normalizeParams('accretion-disc-03', params);
      const nextJets = next.jetAmount > 0;
      const rebuild = next.density !== state.density || nextJets !== jetsOn;
      state = next;
      jetsOn = nextJets;
      baseColor.set(hexToRgb(state.baseColor));
      accentColor.set(hexToRgb(state.accentColor));
      live = fillLive();
      if (rebuild) uploadCloud();
    },
    setPlayback({ paused: nextPaused = false, restart = 0 } = {}) {
      paused = Boolean(nextPaused);
      if (restart !== restartSeen) {
        restartSeen = restart;
        t = 0;
        last = 0;
      }
      self.cancelAnimationFrame(raf);
      if (!paused) raf = self.requestAnimationFrame(frame);
    },
    stop() {
      stopped = true;
      self.cancelAnimationFrame(raf);
    }
  };
}
