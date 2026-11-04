import { normalizeParams } from '../backgroundStudio.js';
import { fitBuffer } from './shaderHost.js';

const MAX_DPR = 2;
const MAX_LINES = 8000;
const EDGE = 20;

const LINE_VERT = `
precision highp float;
attribute vec2  a_p0;
attribute vec2  a_p1;
attribute vec2  a_corner;
attribute vec3  a_shade;
uniform vec2  uSize;
varying float v_alpha;
varying float v_mix;
varying float v_off;
varying float v_half;
void main(){
  vec2 d = a_p1 - a_p0;
  float len = max(length(d), 1e-5);
  vec2 nrm = vec2(-d.y, d.x) / len;
  float half_ = max(a_shade.z * 0.5, 0.35);
  float ext = half_ + 0.75;
  vec2 p = mix(a_p0, a_p1, a_corner.x);
  p += nrm * a_corner.y * ext;
  v_alpha = a_shade.x;
  v_mix = a_shade.y;
  v_off = a_corner.y * ext;
  v_half = half_;
  gl_Position = vec4(p.x / uSize.x * 2.0 - 1.0, 1.0 - p.y / uSize.y * 2.0, 0.0, 1.0);
}
`;

const LINE_FRAG = `
precision mediump float;
uniform vec3 uBase, uAccent;
varying float v_alpha;
varying float v_mix;
varying float v_off;
varying float v_half;
void main(){
  float cov = clamp((v_half - abs(v_off)) / 0.75 + 0.5, 0.0, 1.0);
  float a = v_alpha * cov;
  vec3 col = mix(uBase, uAccent, v_mix);
  gl_FragColor = vec4(col * a, a);
}
`;

const DOT_VERT = `
precision highp float;
attribute vec2  a_pos;
attribute float a_lit;
uniform vec2  uSize;
uniform float uDpr, uDot;
varying float v_lit;
void main(){
  gl_PointSize = max(1.0, uDot * uDpr);
  v_lit = a_lit;
  gl_Position = vec4(a_pos.x / uSize.x * 2.0 - 1.0, 1.0 - a_pos.y / uSize.y * 2.0, 0.0, 1.0);
}
`;

const DOT_FRAG = `
precision mediump float;
uniform vec3  uBase, uAccent;
uniform float uRestAlpha;
varying float v_lit;
void main(){
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float disc = 1.0 - smoothstep(0.72, 1.0, d);
  vec3 col = mix(uBase, uAccent, v_lit);
  float a = disc * mix(uRestAlpha, 1.0, v_lit);
  if (a <= 0.004) discard;
  gl_FragColor = vec4(col * a, a);
}
`;

const CORNERS = [
  [0, -1],
  [1, -1],
  [1, 1],
  [0, -1],
  [1, 1],
  [0, 1]
];

function compile(gl, type, src) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(log || 'shader');
  }
  return sh;
}

function link(gl, vsSrc, fsSrc) {
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, vsSrc));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, fsSrc));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(prog) || 'link');
  }
  return prog;
}

function parseColor(input, fb) {
  const str = String(input || '').trim();
  if (str.charAt(0) === '#') {
    let hex = str.slice(1);
    if (hex.length === 3 || hex.length === 4) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    if (hex.length >= 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      if (!Number.isNaN(r) && !Number.isNaN(g) && !Number.isNaN(b)) return [r / 255, g / 255, b / 255];
    }
    return fb.slice();
  }
  return fb.slice();
}

function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Dérive de particules Originkit, hors React. */
export function startParticleDrift(canvas, options = {}) {
  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: false,
    depth: false,
    premultipliedAlpha: true
  });
  if (!gl) throw new Error('webgl');

  const lineProg = link(gl, LINE_VERT, LINE_FRAG);
  const dotProg = link(gl, DOT_VERT, DOT_FRAG);
  const locs = new Map();
  const u = (prog, name) => {
    const key = (prog === lineProg ? 'L:' : 'D:') + name;
    if (!locs.has(key)) locs.set(key, gl.getUniformLocation(prog, name));
    return locs.get(key);
  };

  const lP0 = new Float32Array(MAX_LINES * 6 * 2);
  const lP1 = new Float32Array(MAX_LINES * 6 * 2);
  const lCorner = new Float32Array(MAX_LINES * 6 * 2);
  const lShade = new Float32Array(MAX_LINES * 6 * 3);
  for (let e = 0; e < MAX_LINES; e++) {
    for (let c = 0; c < 6; c++) {
      const k = (e * 6 + c) * 2;
      lCorner[k] = CORNERS[c][0];
      lCorner[k + 1] = CORNERS[c][1];
    }
  }
  const bP0 = gl.createBuffer();
  const bP1 = gl.createBuffer();
  const bCorner = gl.createBuffer();
  const bShade = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, bP0);
  gl.bufferData(gl.ARRAY_BUFFER, lP0.byteLength, gl.DYNAMIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, bP1);
  gl.bufferData(gl.ARRAY_BUFFER, lP1.byteLength, gl.DYNAMIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, bCorner);
  gl.bufferData(gl.ARRAY_BUFFER, lCorner, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, bShade);
  gl.bufferData(gl.ARRAY_BUFFER, lShade.byteLength, gl.DYNAMIC_DRAW);

  const R = rng(20260824);
  let nCount = 0;
  let nx = new Float32Array(0);
  let ny = new Float32Array(0);
  let nSpd = new Float32Array(0);
  let gPos = new Float32Array(0);
  let gLit = new Float32Array(0);
  const bGPos = gl.createBuffer();
  const bGLit = gl.createBuffer();

  const buildNodes = (n, w, h) => {
    nCount = n;
    nx = new Float32Array(n);
    ny = new Float32Array(n);
    nSpd = new Float32Array(n);
    gPos = new Float32Array(n * 2);
    gLit = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      nx[i] = R() * w;
      ny[i] = R() * h;
      nSpd[i] = (R() * 0.4 + 0.1) * 60;
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, bGPos);
    gl.bufferData(gl.ARRAY_BUFFER, gPos.byteLength, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, bGLit);
    gl.bufferData(gl.ARRAY_BUFFER, gLit.byteLength, gl.DYNAMIC_DRAW);
  };

  let state = normalizeParams('particle-drift', options.params);
  let cssW = Math.max(1, options.width || 1);
  let cssH = Math.max(1, options.height || 1);
  let dpr = Math.min(MAX_DPR, Math.max(1, options.dpr || 1));
  const ptr = { x: -10000, y: -10000, active: false };
  let raf = 0;
  let last = 0;
  let builtN = -1;
  let builtW = 0;
  let builtH = 0;
  let stopped = false;
  let paused = false;
  let restartSeen = 0;
  let readySent = false;

  const applySize = (width, height, nextDpr) => {
    cssW = Math.max(1, width || 1);
    cssH = Math.max(1, height || 1);
    const box = fitBuffer(width, height);
    dpr = Math.min(MAX_DPR, Math.max(1, nextDpr || box.dpr || 1));
    const bw = Math.max(1, Math.round(cssW * dpr));
    const bh = Math.max(1, Math.round(cssH * dpr));
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
  };
  applySize(options.width, options.height, options.dpr);

  const frame = (now) => {
    if (stopped) return;
    raf = self.requestAnimationFrame(frame);
    if (paused) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;

    const density = Math.round(state.density);
    const sp = state.speed / 50;
    const hv = state.hover / 100;
    const LINKD = state.linkDistance;
    const LINKW = state.linkThickness;
    const cursorOn = state.cursor !== false;

    const bw = canvas.width;
    const bh = canvas.height;
    gl.viewport(0, 0, bw, bh);

    if (density !== builtN) {
      buildNodes(density, cssW, cssH);
      builtN = density;
      builtW = cssW;
      builtH = cssH;
    }
    if (cssW !== builtW || cssH !== builtH) {
      const sx = cssW / Math.max(builtW || cssW, 1);
      const sy = cssH / Math.max(builtH || cssH, 1);
      for (let i = 0; i < nCount; i++) {
        nx[i] *= sx;
        ny[i] *= sy;
      }
      builtW = cssW;
      builtH = cssH;
    }

    const reach = cursorOn && hv > 0 && ptr.active ? 180 : 0;
    const th = (state.direction * Math.PI) / 180;
    const dirX = Math.sin(th);
    const dirY = Math.cos(th);

    let lines = 0;
    const pushLine = (x0, y0, x1, y1, a0, a1, mix, wpx) => {
      if (lines >= MAX_LINES) return;
      for (let c = 0; c < 6; c++) {
        const k = (lines * 6 + c) * 2;
        const s3 = (lines * 6 + c) * 3;
        lP0[k] = x0;
        lP0[k + 1] = y0;
        lP1[k] = x1;
        lP1[k + 1] = y1;
        lShade[s3] = CORNERS[c][0] === 0 ? a0 : a1;
        lShade[s3 + 1] = mix;
        lShade[s3 + 2] = wpx;
      }
      lines += 1;
    };

    for (let i = 0; i < nCount; i++) {
      nx[i] += nSpd[i] * dirX * dt * sp;
      ny[i] += nSpd[i] * dirY * dt * sp;
      if (nx[i] < -EDGE) {
        nx[i] = cssW + EDGE;
        ny[i] = R() * cssH;
      } else if (nx[i] > cssW + EDGE) {
        nx[i] = -EDGE;
        ny[i] = R() * cssH;
      }
      if (ny[i] < -EDGE) {
        ny[i] = cssH + EDGE;
        nx[i] = R() * cssW;
      } else if (ny[i] > cssH + EDGE) {
        ny[i] = -EDGE;
        nx[i] = R() * cssW;
      }
      const dx = ptr.x - nx[i];
      const dy = ptr.y - ny[i];
      const d = Math.sqrt(dx * dx + dy * dy);
      const lit = reach > 0 && d < reach ? 1 : 0;
      if (lit === 1) {
        const a = 0.5 * (1 - d / reach) * hv;
        pushLine(nx[i], ny[i], ptr.x, ptr.y, a, a, 1, LINKW);
      }
      gPos[i * 2] = nx[i];
      gPos[i * 2 + 1] = ny[i];
      gLit[i] = lit;
    }

    if (LINKD > 0) {
      const l2 = LINKD * LINKD;
      for (let i = 0; i < nCount && lines < MAX_LINES; i++) {
        for (let j = i + 1; j < nCount && lines < MAX_LINES; j++) {
          const dx = nx[i] - nx[j];
          const dy = ny[i] - ny[j];
          const dd = dx * dx + dy * dy;
          if (dd >= l2) continue;
          const a = 0.15 * (1 - Math.sqrt(dd) / LINKD);
          pushLine(nx[i], ny[i], nx[j], ny[j], a, a, 0, LINKW);
        }
      }
    }

    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const cb = parseColor(state.baseColor, [1, 1, 1]);
    const ca = parseColor(state.accentColor, [0.992, 0.992, 0]);

    if (lines > 0) {
      gl.useProgram(lineProg);
      const verts = lines * 6;
      gl.bindBuffer(gl.ARRAY_BUFFER, bP0);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, lP0.subarray(0, verts * 2));
      const aP0 = gl.getAttribLocation(lineProg, 'a_p0');
      gl.enableVertexAttribArray(aP0);
      gl.vertexAttribPointer(aP0, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, bP1);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, lP1.subarray(0, verts * 2));
      const aP1 = gl.getAttribLocation(lineProg, 'a_p1');
      gl.enableVertexAttribArray(aP1);
      gl.vertexAttribPointer(aP1, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, bCorner);
      const aCorner = gl.getAttribLocation(lineProg, 'a_corner');
      gl.enableVertexAttribArray(aCorner);
      gl.vertexAttribPointer(aCorner, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, bShade);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, lShade.subarray(0, verts * 3));
      const aShade = gl.getAttribLocation(lineProg, 'a_shade');
      gl.enableVertexAttribArray(aShade);
      gl.vertexAttribPointer(aShade, 3, gl.FLOAT, false, 0, 0);
      gl.uniform2f(u(lineProg, 'uSize'), cssW, cssH);
      gl.uniform3f(u(lineProg, 'uBase'), cb[0], cb[1], cb[2]);
      gl.uniform3f(u(lineProg, 'uAccent'), ca[0], ca[1], ca[2]);
      gl.drawArrays(gl.TRIANGLES, 0, verts);
      gl.disableVertexAttribArray(aP0);
      gl.disableVertexAttribArray(aP1);
      gl.disableVertexAttribArray(aCorner);
      gl.disableVertexAttribArray(aShade);
    }

    if (nCount > 0) {
      gl.useProgram(dotProg);
      gl.bindBuffer(gl.ARRAY_BUFFER, bGPos);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, gPos);
      const aPos = gl.getAttribLocation(dotProg, 'a_pos');
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, bGLit);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, gLit);
      const aLit = gl.getAttribLocation(dotProg, 'a_lit');
      gl.enableVertexAttribArray(aLit);
      gl.vertexAttribPointer(aLit, 1, gl.FLOAT, false, 0, 0);
      gl.uniform2f(u(dotProg, 'uSize'), cssW, cssH);
      gl.uniform1f(u(dotProg, 'uDpr'), dpr);
      gl.uniform1f(u(dotProg, 'uDot'), state.dotSize);
      gl.uniform1f(u(dotProg, 'uRestAlpha'), 0.4);
      gl.uniform3f(u(dotProg, 'uBase'), cb[0], cb[1], cb[2]);
      gl.uniform3f(u(dotProg, 'uAccent'), ca[0], ca[1], ca[2]);
      gl.drawArrays(gl.POINTS, 0, nCount);
      gl.disableVertexAttribArray(aPos);
      gl.disableVertexAttribArray(aLit);
    }

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
      state = normalizeParams('particle-drift', params);
    },
    setPointer({ x = 0.5, y = 0.5, active = false } = {}) {
      if (!active || state.cursor === false) {
        ptr.x = -10000;
        ptr.y = -10000;
        ptr.active = false;
        return;
      }
      ptr.x = x * cssW;
      ptr.y = y * cssH;
      ptr.active = true;
    },
    setPlayback({ paused: nextPaused = false, restart = 0 } = {}) {
      paused = Boolean(nextPaused);
      if (restart !== restartSeen) {
        restartSeen = restart;
        builtN = -1;
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
