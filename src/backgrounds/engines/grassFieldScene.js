import { normalizeParams } from '../backgroundStudio.js';
import { GRASS_BLADE, GRASS_FIELD, GRASS_GROUND, GRASS_QUAD, GRASS_SKY } from './originkitShaders.js';
import { hexToRgb, linkProgram } from './shaderHost.js';

const MAX_BLADES = 40000;
const VERTS_PER_BLADE = 9;
const GOLDEN = 0.6180339887498949;
const SILVER = 0.41421356237309515;
const TRIBO = 0.7320508075688772;
const EYE_Y = 1.35;
const PITCH = 0.135;
const FOCAL = 1.55;

function viewOf(state) {
  const rad = (state.direction * Math.PI) / 180;
  return {
    top: hexToRgb(state.background, [0, 0, 0]),
    low: hexToRgb(state.horizon, [0, 0, 0]),
    base: hexToRgb(state.bladeBase, [0, 0, 0]),
    tip: hexToRgb(state.bladeTip, [0.247, 1, 0]),
    count: Math.round(state.density * (MAX_BLADES / 100)),
    speed: state.speed / 50,
    bladeHeight: state.bladeHeight / 100,
    terrain: state.terrain / 100,
    haze: state.haze / 100,
    strength: state.windStrength / 100,
    gust: state.gust / 100,
    dir: [Math.cos(rad), Math.sin(rad)],
    hover: state.hover / 100,
    reach: (state.reach / 100) * 1.35,
    repel: state.repel !== false,
    focal: FOCAL * (100 / Math.max(40, state.distance))
  };
}

export function startGrassField(canvas, options = {}) {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false, depth: true });
  if (!gl) throw new Error('webgl');
  const skyProg = linkProgram(gl, GRASS_QUAD, GRASS_SKY);
  const groundProg = linkProgram(gl, GRASS_GROUND, GRASS_FIELD);
  const bladeProg = linkProgram(gl, GRASS_BLADE, GRASS_FIELD);

  const quadBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const skyPos = gl.getAttribLocation(skyProg, 'a_pos');

  const NX = 72;
  const NZ = 58;
  const gverts = [];
  const gz = (i) => -(0.04 * (46 / 0.04) ** (i / NZ));
  for (let i = 0; i < NZ; i += 1) {
    const z0 = gz(i);
    const z1 = gz(i + 1);
    const s0 = 3 - z0 * 1.05;
    const s1 = 3 - z1 * 1.05;
    for (let j = 0; j < NX; j += 1) {
      const t0 = (j / NX) * 2 - 1;
      const t1 = ((j + 1) / NX) * 2 - 1;
      gverts.push(t0 * s0, z0, t1 * s0, z0, t0 * s1, z1, t0 * s1, z1, t1 * s0, z0, t1 * s1, z1);
    }
  }
  const gArr = new Float32Array(gverts);
  const gBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, gBuf);
  gl.bufferData(gl.ARRAY_BUFFER, gArr, gl.STATIC_DRAW);
  const aXZ = gl.getAttribLocation(groundProg, 'a_xz');
  const groundCount = gArr.length / 2;

  const quad = [[0, -1], [0, 1], [0.55, -1], [0.55, -1], [0, 1], [0.55, 1]];
  const tip = [[0.55, -1], [0.55, 1], [1, 0]];
  const baseArr = new Float32Array(MAX_BLADES * VERTS_PER_BLADE * 2);
  const paramArr = new Float32Array(MAX_BLADES * VERTS_PER_BLADE * 2);
  const randArr = new Float32Array(MAX_BLADES * VERTS_PER_BLADE * 2);
  let vi = 0;
  for (let b = 0; b < MAX_BLADES; b += 1) {
    const uu = (b * GOLDEN) % 1;
    const dist = 0.55 + 32 * uu ** 1.75;
    const z = -dist;
    const spread = 2.2 + dist * 0.85;
    const x = ((b * SILVER) % 1) * 2 * spread - spread;
    const r0 = (b * TRIBO) % 1;
    const r1 = (b * 0.5436890126920763) % 1;
    for (let k = 0; k < VERTS_PER_BLADE; k += 1) {
      const pv = k < 6 ? quad[k] : tip[k - 6];
      baseArr[vi * 2] = x;
      baseArr[vi * 2 + 1] = z;
      paramArr[vi * 2] = pv[0];
      paramArr[vi * 2 + 1] = pv[1];
      randArr[vi * 2] = r0;
      randArr[vi * 2 + 1] = r1;
      vi += 1;
    }
  }
  const upload = (arr) => {
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
    return buf;
  };
  const bBase = upload(baseArr);
  const bParam = upload(paramArr);
  const bRand = upload(randArr);
  const aBase = gl.getAttribLocation(bladeProg, 'a_base');
  const aParam = gl.getAttribLocation(bladeProg, 'a_param');
  const aRand = gl.getAttribLocation(bladeProg, 'a_rand');

  const bind = (loc, buf) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    if (loc >= 0) {
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    }
  };
  const loc = (prog, name) => gl.getUniformLocation(prog, name);

  let view = viewOf(normalizeParams('grass-field', options.params));
  const ptr = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5, on: 0, onTarget: 0 };
  let bw = 1;
  let bh = 1;
  const applySize = (width, height) => {
    let w = Math.max(1, Math.round(width || 1));
    let h = Math.max(1, Math.round(height || 1));
    const cap = 1920 * 1200;
    if (w * h > cap) {
      const scale = Math.sqrt(cap / (w * h));
      w = Math.max(1, Math.round(w * scale));
      h = Math.max(1, Math.round(h * scale));
    }
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    bw = w;
    bh = h;
    gl.viewport(0, 0, w, h);
  };
  applySize(options.width, options.height);

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
    ptr.on += (ptr.onTarget - ptr.on) * k;
    ptr.x += ((ptr.onTarget > 0 ? ptr.tx : 0.5) - ptr.x) * k;
    ptr.y += ((ptr.onTarget > 0 ? ptr.ty : 0.5) - ptr.y) * k;

    const ar = bw / Math.max(bh, 1);
    const haze = [
      view.low[0] * view.haze + (1 - view.haze) * view.tip[0],
      view.low[1] * view.haze + (1 - view.haze) * view.tip[1],
      view.low[2] * view.haze + (1 - view.haze) * view.tip[2]
    ];
    gl.viewport(0, 0, bw, bh);
    gl.clearColor(view.low[0], view.low[1], view.low[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.useProgram(skyProg);
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    if (skyPos >= 0) {
      gl.enableVertexAttribArray(skyPos);
      gl.vertexAttribPointer(skyPos, 2, gl.FLOAT, false, 0, 0);
    }
    gl.uniform2f(loc(skyProg, 'uRes'), bw, bh);
    gl.uniform1f(loc(skyProg, 'uTime'), clock);
    gl.uniform3fv(loc(skyProg, 'uTop'), view.top);
    gl.uniform3fv(loc(skyProg, 'uLow'), view.low);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    const nx = ((ptr.x * 2 - 1) * ar) / view.focal;
    const ny = ((1 - ptr.y) * 2 - 1) / view.focal;
    const cp = Math.cos(PITCH);
    const sp = Math.sin(PITCH);
    const dy = ny * cp - sp;
    let pushX = 0;
    let pushZ = -999;
    let amt = 0;
    if (dy < -1e-3) {
      const s = -EYE_Y / dy;
      if (s > 0 && s < 42) {
        pushX = s * nx;
        pushZ = s * (-ny * sp - cp);
        amt = view.repel ? Math.min(1, ptr.on) * view.hover * 0.6 : 0;
      }
    }

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.depthMask(true);
    gl.useProgram(groundProg);
    bind(aXZ, gBuf);
    gl.uniform1f(loc(groundProg, 'uAspect'), ar);
    gl.uniform1f(loc(groundProg, 'uF'), view.focal);
    gl.uniform3f(loc(groundProg, 'uEye'), 0, EYE_Y, 0);
    gl.uniform1f(loc(groundProg, 'uPitch'), PITCH);
    gl.uniform1f(loc(groundProg, 'uTerrain'), view.terrain);
    gl.uniform3fv(loc(groundProg, 'uBase'), view.base);
    gl.uniform3fv(loc(groundProg, 'uHaze'), haze);
    gl.drawArrays(gl.TRIANGLES, 0, groundCount);

    gl.useProgram(bladeProg);
    bind(aBase, bBase);
    bind(aParam, bParam);
    bind(aRand, bRand);
    gl.uniform1f(loc(bladeProg, 'uTime'), clock);
    gl.uniform1f(loc(bladeProg, 'uAspect'), ar);
    gl.uniform1f(loc(bladeProg, 'uF'), view.focal);
    gl.uniform3f(loc(bladeProg, 'uEye'), 0, EYE_Y, 0);
    gl.uniform1f(loc(bladeProg, 'uPitch'), PITCH);
    gl.uniform2f(loc(bladeProg, 'uPush'), pushX, pushZ);
    gl.uniform1f(loc(bladeProg, 'uPushAmt'), amt);
    gl.uniform1f(loc(bladeProg, 'uReach'), view.reach);
    gl.uniform1f(loc(bladeProg, 'uHeight'), view.bladeHeight);
    gl.uniform1f(loc(bladeProg, 'uWind'), view.strength);
    gl.uniform1f(loc(bladeProg, 'uGust'), view.gust);
    gl.uniform2f(loc(bladeProg, 'uWindDir'), view.dir[0], view.dir[1]);
    gl.uniform1f(loc(bladeProg, 'uTerrain'), view.terrain);
    gl.uniform3fv(loc(bladeProg, 'uBase'), view.base);
    gl.uniform3fv(loc(bladeProg, 'uTip'), view.tip);
    gl.uniform3fv(loc(bladeProg, 'uHaze'), haze);
    gl.drawArrays(gl.TRIANGLES, 0, view.count * VERTS_PER_BLADE);
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
      view = viewOf(normalizeParams('grass-field', params));
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
      gl.deleteBuffer(quadBuf);
      gl.deleteBuffer(gBuf);
      gl.deleteBuffer(bBase);
      gl.deleteBuffer(bParam);
      gl.deleteBuffer(bRand);
      gl.deleteProgram(skyProg);
      gl.deleteProgram(groundProg);
      gl.deleteProgram(bladeProg);
    }
  };
}
