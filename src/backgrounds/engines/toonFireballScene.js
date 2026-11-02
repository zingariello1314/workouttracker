import { normalizeParams } from '../backgroundStudio.js';
import { fitBuffer } from './shaderHost.js';
import {
  TEX_PERLIN,
  TEX_SPARK,
  TEX_WATER,
  QUAD_VERT,
  BALL_VERT,
  BALL_FRAG,
  STEAM_VERT,
  STEAM_FRAG,
  FLAME_VERT,
  FLAME_FRAG,
  HIGHPASS_FRAG,
  COMPOSITE_FRAG,
  COPY_FRAG,
  BLOOM_KERNELS,
  BLOOM_FACTORS,
  blurFrag
} from './toonFireballAssets.js';

const FOV = 45;
const NEAR = 1;
const FAR = 200;
const BALL_SCALE = 0.78;
const FLAME_OFFSET = -4.78;
const STEAM_OFFSET = -4.05;
const TRAIL_LENGTH = 9.5;
const DEPTH_NEAR = 16;
const DEPTH_FAR = 42;
const SCALE_JITTER = [0.7, 1.15];
const RATE_JITTER = [0.8, 1.2];
const MAX_COUNT = 40;
const FALL_RATE = 14;
const FIRE_PERIOD = 6000;
const BLOOM_THRESHOLD = 0;
const BLOOM_SMOOTH_WIDTH = 0.01;
const MAX_DPR = 2;

function sphereGeometry(radius, wSeg, hSeg) {
  const pos = [];
  const uv = [];
  const index = [];
  const grid = [];
  let n = 0;
  for (let iy = 0; iy <= hSeg; iy++) {
    const row = [];
    const v = iy / hSeg;
    let uOffset = 0;
    if (iy === 0) uOffset = 0.5 / wSeg;
    else if (iy === hSeg) uOffset = -0.5 / wSeg;
    for (let ix = 0; ix <= wSeg; ix++) {
      const u = ix / wSeg;
      pos.push(
        -radius * Math.cos(u * Math.PI * 2) * Math.sin(v * Math.PI),
        radius * Math.cos(v * Math.PI),
        radius * Math.sin(u * Math.PI * 2) * Math.sin(v * Math.PI)
      );
      uv.push(u + uOffset, 1 - v);
      row.push(n++);
    }
    grid.push(row);
  }
  for (let iy = 0; iy < hSeg; iy++) {
    for (let ix = 0; ix < wSeg; ix++) {
      const a = grid[iy][ix + 1];
      const b = grid[iy][ix];
      const c = grid[iy + 1][ix];
      const d = grid[iy + 1][ix + 1];
      if (iy !== 0) index.push(a, b, d);
      if (iy !== hSeg - 1) index.push(b, c, d);
    }
  }
  return { pos: new Float32Array(pos), uv: new Float32Array(uv), index: new Uint16Array(index) };
}

function cylinderGeometry(rTop, rBottom, height, radialSeg, heightSeg) {
  const pos = [];
  const uv = [];
  const index = [];
  const grid = [];
  const half = height / 2;
  let n = 0;
  for (let y = 0; y <= heightSeg; y++) {
    const row = [];
    const v = y / heightSeg;
    const r = v * (rBottom - rTop) + rTop;
    for (let x = 0; x <= radialSeg; x++) {
      const u = x / radialSeg;
      const theta = u * Math.PI * 2;
      pos.push(r * Math.sin(theta), -v * height + half, r * Math.cos(theta));
      uv.push(u, 1 - v);
      row.push(n++);
    }
    grid.push(row);
  }
  for (let x = 0; x < radialSeg; x++) {
    for (let y = 0; y < heightSeg; y++) {
      const a = grid[y][x];
      const b = grid[y + 1][x];
      const c = grid[y + 1][x + 1];
      const d = grid[y][x + 1];
      if (rTop > 0 || y !== 0) index.push(a, b, d);
      if (rBottom > 0 || y !== heightSeg - 1) index.push(b, c, d);
    }
  }
  return { pos: new Float32Array(pos), uv: new Float32Array(uv), index: new Uint16Array(index) };
}

function perspective(fovDeg, aspect, near, far) {
  const f = 1 / Math.tan((fovDeg * Math.PI) / 360);
  const nf = 1 / (near - far);
  const m = new Float32Array(16);
  m[0] = f / aspect;
  m[5] = f;
  m[10] = (far + near) * nf;
  m[11] = -1;
  m[14] = 2 * far * near * nf;
  return m;
}

function compose(out, tx, ty, tz, tilt, roll, sx, sy, sz) {
  const c = Math.cos(roll);
  const s = Math.sin(roll);
  const ct = Math.cos(tilt);
  const st = Math.sin(tilt);
  out[0] = c * sx; out[1] = ct * s * sx; out[2] = st * s * sx; out[3] = 0;
  out[4] = -s * sy; out[5] = ct * c * sy; out[6] = st * c * sy; out[7] = 0;
  out[8] = 0; out[9] = -st * sz; out[10] = ct * sz; out[11] = 0;
  out[12] = tx; out[13] = ty; out[14] = tz; out[15] = 1;
  return out;
}

function parseColor(input) {
  if (!input) return [0, 0, 0];
  let s = String(input).trim();
  const token = s.match(/^var\(\s*--[^,)]+\s*,\s*(.+)\)\s*$/is);
  if (token) s = token[1].trim();
  const rgb = s.match(/rgba?\(([^)]+)\)/i);
  if (rgb) {
    const p = rgb[1].split(/[,\s/]+/).filter(Boolean).map(parseFloat);
    return [p[0] || 0, p[1] || 0, p[2] || 0];
  }
  let hx = s.replace('#', '');
  if (hx.length === 3 || hx.length === 4) hx = hx.split('').map((ch) => ch + ch).join('');
  hx = hx.padEnd(6, '0');
  const v = (i) => {
    const n = parseInt(hx.slice(i, i + 2), 16);
    return Number.isFinite(n) ? n : 0;
  };
  return [v(0), v(2), v(4)];
}

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  return sh;
}

function program(gl, vs, fs) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  return p;
}

function makeRT(gl, w, h) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  return { fb, tex, w, h };
}

function liveFrom(state) {
  return {
    color0: parseColor(state.fireCore),
    color1: parseColor(state.baseColor),
    color2: parseColor(state.accentColor),
    color4: parseColor(state.fireSteam),
    color5: parseColor(state.fireTrail),
    count: state.density,
    size: state.size / 100,
    speed: state.speed,
    angle: state.angle,
    tilt: state.tilt,
    strength: state.bloomStrength / 100,
    radius: state.bloomRadius / 100
  };
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

async function loadTex(gl, src) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(
    gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
    new Uint8Array([128, 128, 128, 255])
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  try {
    const res = await fetch(src);
    const blob = await res.blob();
    const bmp = await createImageBitmap(blob);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, bmp);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 0);
    bmp.close?.();
  } catch {
    // keep grey placeholder
  }
  return tex;
}

/** Boule de feu toon Originkit, hors React, pour OffscreenCanvas. */
export function startToonFireball(canvas, options = {}) {
  const gl =
    canvas.getContext('webgl2', { alpha: true, antialias: false, premultipliedAlpha: true }) ||
    canvas.getContext('webgl', { alpha: true, antialias: false, premultipliedAlpha: true });
  if (!gl) throw new Error('webgl');

  let state = normalizeParams('toon-fireball', options.params);
  let live = liveFrom(state);
  let cssW = Math.max(1, options.width || 1);
  let cssH = Math.max(1, options.height || 1);
  let dprHint = options.dpr || 1;

  const mkMesh = (g) => {
    const pos = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, pos);
    gl.bufferData(gl.ARRAY_BUFFER, g.pos, gl.STATIC_DRAW);
    const uv = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uv);
    gl.bufferData(gl.ARRAY_BUFFER, g.uv, gl.STATIC_DRAW);
    const idx = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, g.index, gl.STATIC_DRAW);
    return { pos, uv, idx, count: g.index.length };
  };
  const mBall = mkMesh(sphereGeometry(1, 30, 30));
  const mFlame = mkMesh(cylinderGeometry(1, 0, 5.3, 50, 50));
  const mSteam = mkMesh(cylinderGeometry(1.11, 0, 5.3, 50, 50));

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

  const pBall = program(gl, BALL_VERT, BALL_FRAG);
  const pFlame = program(gl, FLAME_VERT, FLAME_FRAG);
  const pSteam = program(gl, STEAM_VERT, STEAM_FRAG);
  const pHigh = program(gl, QUAD_VERT, HIGHPASS_FRAG);
  const pBlur = BLOOM_KERNELS.map((k) => program(gl, QUAD_VERT, blurFrag(k)));
  const pComp = program(gl, QUAD_VERT, COMPOSITE_FRAG);
  const pCopy = program(gl, QUAD_VERT, COPY_FRAG);

  const loc = (p, names) => {
    const o = {};
    for (const n of names) o[n] = gl.getUniformLocation(p, n);
    return o;
  };
  const uBall = loc(pBall, [
    'projectionMatrix', 'modelViewMatrix', 'perlinnoise', 'sparknoise',
    'time', 'color0', 'color1', 'color2', 'color5'
  ]);
  const uFlame = loc(pFlame, ['projectionMatrix', 'modelViewMatrix', 'noise', 'time', 'color4']);
  const uSteam = loc(pSteam, ['projectionMatrix', 'modelViewMatrix', 'perlinnoise', 'time', 'color4']);
  const uHigh = loc(pHigh, [
    'tDiffuse', 'defaultColor', 'defaultOpacity', 'luminosityThreshold', 'smoothWidth'
  ]);
  const uBlur = pBlur.map((p) => loc(p, ['colorTexture', 'texSize', 'direction']));
  const uComp = loc(pComp, [
    'blurTexture1', 'blurTexture2', 'blurTexture3', 'blurTexture4',
    'blurTexture5', 'bloomStrength', 'bloomRadius', 'bloomFactors[0]'
  ]);
  const uCopy = loc(pCopy, ['tDiffuse']);

  const attrs = (p) => ({
    position: gl.getAttribLocation(p, 'position'),
    uv: gl.getAttribLocation(p, 'uv')
  });
  const aBall = attrs(pBall);
  const aFlame = attrs(pFlame);
  const aSteam = attrs(pSteam);
  const aQuadHigh = gl.getAttribLocation(pHigh, 'aPos');
  const aQuadBlur = pBlur.map((p) => gl.getAttribLocation(p, 'aPos'));
  const aQuadComp = gl.getAttribLocation(pComp, 'aPos');
  const aQuadCopy = gl.getAttribLocation(pCopy, 'aPos');

  let texPerlin = null;
  let texSpark = null;
  let texWater = null;
  const texturesReady = Promise.all([
    loadTex(gl, TEX_PERLIN),
    loadTex(gl, TEX_SPARK),
    loadTex(gl, TEX_WATER)
  ]).then(([a, b, c]) => {
    texPerlin = a;
    texSpark = b;
    texWater = c;
  });

  let rtScene = null;
  let rtDepth = null;
  let rtBright = null;
  let rtH = [];
  let rtV = [];
  const blurSize = [];
  let vw = 0;
  let vh = 0;

  const dropRT = (rt) => {
    if (!rt) return;
    gl.deleteFramebuffer(rt.fb);
    gl.deleteTexture(rt.tex);
  };

  const applySize = (width, height, nextDpr) => {
    cssW = Math.max(1, width || 1);
    cssH = Math.max(1, height || 1);
    dprHint = nextDpr || dprHint || 1;
    const box = fitBuffer(cssW * Math.min(MAX_DPR, dprHint), cssH * Math.min(MAX_DPR, dprHint));
    const w = box.w;
    const h = box.h;
    if (w === vw && h === vh) return;
    vw = w;
    vh = h;
    canvas.width = w;
    canvas.height = h;

    dropRT(rtScene);
    dropRT(rtBright);
    rtH.forEach(dropRT);
    rtV.forEach(dropRT);
    if (rtDepth) gl.deleteRenderbuffer(rtDepth);
    rtH = [];
    rtV = [];
    blurSize.length = 0;

    rtScene = makeRT(gl, w, h);
    rtDepth = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, rtDepth);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, w, h);
    gl.bindFramebuffer(gl.FRAMEBUFFER, rtScene.fb);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rtDepth);

    let rx = Math.round(w / 2);
    let ry = Math.round(h / 2);
    rtBright = makeRT(gl, Math.max(1, rx), Math.max(1, ry));
    for (let i = 0; i < BLOOM_KERNELS.length; i++) {
      rtH.push(makeRT(gl, Math.max(1, rx), Math.max(1, ry)));
      rtV.push(makeRT(gl, Math.max(1, rx), Math.max(1, ry)));
      blurSize.push([Math.max(1, rx), Math.max(1, ry)]);
      rx = Math.round(rx / 2);
      ry = Math.round(ry / 2);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  };
  applySize(cssW, cssH, dprHint);

  const tanHalf = Math.tan((FOV * Math.PI) / 360);
  const span = (c) => {
    const halfH = c.d * tanHalf;
    const s = c.scale * live.size;
    return { top: halfH + BALL_SCALE * s * 1.5, bottom: -halfH - TRAIL_LENGTH * s };
  };
  const spawnX = (c, run) => {
    const halfW = c.d * tanHalf * (vw / Math.max(1, vh));
    const shift = run * Math.tan((live.angle * Math.PI) / 180);
    const lo = -halfW - Math.max(shift, 0);
    const hi = halfW - Math.min(shift, 0);
    return lerp(lo, hi, Math.random());
  };
  const spawn = (c, progress) => {
    c.d = lerp(DEPTH_NEAR, DEPTH_FAR, Math.random());
    c.scale = lerp(SCALE_JITTER[0], SCALE_JITTER[1], Math.random());
    c.rate = lerp(RATE_JITTER[0], RATE_JITTER[1], Math.random());
    c.phase = Math.random() * FIRE_PERIOD;
    const { top, bottom } = span(c);
    const run = top - bottom;
    const x0 = spawnX(c, run);
    const shift = run * Math.tan((live.angle * Math.PI) / 180);
    c.x = x0 + shift * progress;
    c.y = top - run * progress;
  };

  const comets = [];
  const seed = Math.random();
  for (let i = 0; i < MAX_COUNT; i++) {
    const c = { x: 0, y: 0, d: 0, scale: 1, rate: 1, phase: 0 };
    spawn(c, (seed + i * 0.6180339887) % 1);
    comets.push(c);
  }

  const proj = new Float32Array(16);
  const model = new Float32Array(16);
  const drawMesh = (mesh, a) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.pos);
    gl.enableVertexAttribArray(a.position);
    gl.vertexAttribPointer(a.position, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.uv);
    gl.enableVertexAttribArray(a.uv);
    gl.vertexAttribPointer(a.uv, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.idx);
    gl.drawElements(gl.TRIANGLES, mesh.count, gl.UNSIGNED_SHORT, 0);
    gl.disableVertexAttribArray(a.position);
    gl.disableVertexAttribArray(a.uv);
  };
  const fullscreen = (attr) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.enableVertexAttribArray(attr);
    gl.vertexAttribPointer(attr, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.disableVertexAttribArray(attr);
  };

  const cones = [];
  for (let i = 0; i < MAX_COUNT * 2; i++) {
    cones.push({ flame: i % 2 === 0, c: comets[i >> 1], z: 0, x: 0, y: 0 });
  }

  let acc = 0;
  let last = 0;
  let raf = 0;
  let stopped = false;
  let paused = false;
  let restartSeen = 0;
  let readySent = false;

  const frame = (now) => {
    if (stopped) return;
    raf = self.requestAnimationFrame(frame);
    if (paused) return;
    if (!texPerlin || !texSpark || !texWater) return;
    const dt = last ? Math.max(0, Math.min(50, now - last)) : 0;
    last = now;
    const L = live;
    const k = L.speed / 50;
    acc = (acc + dt * k) % FIRE_PERIOD;
    if (!rtScene || !rtBright) return;

    const a = (L.angle * Math.PI) / 180;
    const vx = Math.sin(a);
    const vy = -Math.cos(a);
    const step = (FALL_RATE * dt * k) / 1000;
    for (const c of comets) {
      c.x += vx * step * c.rate;
      c.y += vy * step * c.rate;
      if (c.y < span(c).bottom) spawn(c, 0);
    }

    const count = Math.max(0, Math.min(MAX_COUNT, Math.round(L.count)));
    const roll = a - Math.PI / 2;
    const tiltR = (-L.tilt * Math.PI) / 180;
    const ct = Math.cos(tiltR);
    const st = Math.sin(tiltR);
    const cr = Math.cos(roll);
    const sr = Math.sin(roll);
    proj.set(perspective(FOV, vw / vh, NEAR, FAR));

    gl.bindFramebuffer(gl.FRAMEBUFFER, rtScene.fb);
    gl.viewport(0, 0, vw, vh);
    gl.clearColor(0, 0, 0, 1);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.BLEND);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.frontFace(gl.CCW);

    gl.useProgram(pBall);
    gl.uniformMatrix4fv(uBall.projectionMatrix, false, proj);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texPerlin);
    gl.uniform1i(uBall.perlinnoise, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texSpark);
    gl.uniform1i(uBall.sparknoise, 1);
    gl.uniform3fv(uBall.color0, L.color0);
    gl.uniform3fv(uBall.color1, L.color1);
    gl.uniform3fv(uBall.color2, L.color2);
    gl.uniform3fv(uBall.color5, L.color5);
    for (let i = 0; i < count; i++) {
      const c = comets[i];
      const s = c.scale * L.size * BALL_SCALE;
      compose(model, c.x, c.y, -c.d, tiltR, roll, s, s, s);
      gl.uniformMatrix4fv(uBall.modelViewMatrix, false, model);
      gl.uniform1f(uBall.time, -((acc + c.phase) % FIRE_PERIOD) / 2000);
      drawMesh(mBall, aBall);
    }

    const ax = cr;
    const ay = ct * sr;
    const az = st * sr;
    let n = 0;
    for (let i = 0; i < count; i++) {
      const c = comets[i];
      const s = c.scale * L.size;
      for (let j = 0; j < 2; j++) {
        const off = (j === 0 ? FLAME_OFFSET : STEAM_OFFSET) * s;
        const e = cones[n++];
        e.flame = j === 0;
        e.c = c;
        e.x = c.x + ax * off;
        e.y = c.y + ay * off;
        e.z = -c.d + az * off;
      }
    }
    const list = cones.slice(0, n).sort((p, q) => p.z - q.z);

    gl.disable(gl.CULL_FACE);
    gl.depthMask(false);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const coneRoll = roll - Math.PI / 2;
    for (const e of list) {
      const s = e.c.scale * L.size;
      const t = -((acc + e.c.phase) % FIRE_PERIOD) / 6000;
      if (e.flame) {
        gl.useProgram(pFlame);
        compose(model, e.x, e.y, e.z, tiltR, coneRoll, 2 * s, 2 * s, 2 * s);
        gl.uniformMatrix4fv(uFlame.projectionMatrix, false, proj);
        gl.uniformMatrix4fv(uFlame.modelViewMatrix, false, model);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texPerlin);
        gl.uniform1i(uFlame.noise, 0);
        gl.uniform1f(uFlame.time, t);
        gl.uniform3fv(uFlame.color4, L.color5);
        drawMesh(mFlame, aFlame);
      } else {
        gl.useProgram(pSteam);
        compose(model, e.x, e.y, e.z, tiltR, coneRoll, 1.5 * s, 1.7 * s, 1.5 * s);
        gl.uniformMatrix4fv(uSteam.projectionMatrix, false, proj);
        gl.uniformMatrix4fv(uSteam.modelViewMatrix, false, model);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texWater);
        gl.uniform1i(uSteam.perlinnoise, 0);
        gl.uniform1f(uSteam.time, t);
        gl.uniform3fv(uSteam.color4, L.color4);
        drawMesh(mSteam, aSteam);
      }
    }

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.bindFramebuffer(gl.FRAMEBUFFER, rtBright.fb);
    gl.viewport(0, 0, rtBright.w, rtBright.h);
    gl.useProgram(pHigh);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, rtScene.tex);
    gl.uniform1i(uHigh.tDiffuse, 0);
    gl.uniform3f(uHigh.defaultColor, 0, 0, 0);
    gl.uniform1f(uHigh.defaultOpacity, 0);
    gl.uniform1f(uHigh.luminosityThreshold, BLOOM_THRESHOLD);
    gl.uniform1f(uHigh.smoothWidth, BLOOM_SMOOTH_WIDTH);
    fullscreen(aQuadHigh);

    let src = rtBright;
    for (let i = 0; i < pBlur.length; i++) {
      const [bw, bh] = blurSize[i];
      gl.useProgram(pBlur[i]);
      gl.uniform2f(uBlur[i].texSize, bw, bh);
      gl.bindFramebuffer(gl.FRAMEBUFFER, rtH[i].fb);
      gl.viewport(0, 0, rtH[i].w, rtH[i].h);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, src.tex);
      gl.uniform1i(uBlur[i].colorTexture, 0);
      gl.uniform2f(uBlur[i].direction, 1, 0);
      fullscreen(aQuadBlur[i]);
      gl.bindFramebuffer(gl.FRAMEBUFFER, rtV[i].fb);
      gl.viewport(0, 0, rtV[i].w, rtV[i].h);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, rtH[i].tex);
      gl.uniform1i(uBlur[i].colorTexture, 0);
      gl.uniform2f(uBlur[i].direction, 0, 1);
      fullscreen(aQuadBlur[i]);
      src = rtV[i];
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, rtH[0].fb);
    gl.viewport(0, 0, rtH[0].w, rtH[0].h);
    gl.useProgram(pComp);
    for (let i = 0; i < 5; i++) {
      gl.activeTexture(gl.TEXTURE0 + i);
      gl.bindTexture(gl.TEXTURE_2D, rtV[i].tex);
      gl.uniform1i(uComp['blurTexture' + (i + 1)], i);
    }
    gl.uniform1f(uComp.bloomStrength, L.strength);
    gl.uniform1f(uComp.bloomRadius, L.radius);
    gl.uniform1fv(uComp['bloomFactors[0]'], BLOOM_FACTORS);
    fullscreen(aQuadComp);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, vw, vh);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(pCopy);
    gl.uniform1i(uCopy.tDiffuse, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, rtScene.tex);
    fullscreen(aQuadCopy);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    gl.bindTexture(gl.TEXTURE_2D, rtH[0].tex);
    fullscreen(aQuadCopy);
    gl.disable(gl.BLEND);

    if (!readySent) {
      readySent = true;
      options.onReady?.();
    }
  };

  texturesReady.finally(() => {
    if (!stopped) raf = self.requestAnimationFrame(frame);
  });

  return {
    resize(width, height, nextDpr) {
      applySize(width, height, nextDpr);
    },
    update(params) {
      if (stopped) return;
      state = normalizeParams('toon-fireball', params);
      live = liveFrom(state);
    },
    setPointer() {},
    setPlayback({ paused: nextPaused = false, restart = 0 } = {}) {
      paused = Boolean(nextPaused);
      if (restart !== restartSeen) {
        restartSeen = restart;
        acc = 0;
        last = 0;
        const seed2 = Math.random();
        for (let i = 0; i < MAX_COUNT; i++) spawn(comets[i], (seed2 + i * 0.6180339887) % 1);
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
