/**
 * Port Light Cables, Liquid Vortex, Mood Field, Rain Puddle → worker + scène + fond + miniature.
 * Usage : node scripts/port-originkit-remaining.mjs
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const UI = path.join(ROOT, 'src/components/originkit/ui');
const ENG = path.join(ROOT, 'src/backgrounds/engines');
const BG = path.join(ROOT, 'src/backgrounds');
const TH = path.join(ROOT, 'src/backgrounds/thumbnails');

function extractTagged(src, name) {
  const re = new RegExp(`const ${name}\\s*=\\s*\``);
  const m = re.exec(src);
  if (!m) return null;
  let i = m.index + m[0].length;
  let out = '';
  while (i < src.length) {
    const ch = src[i];
    if (ch === '\\' && i + 1 < src.length) {
      out += ch + src[i + 1];
      i += 2;
      continue;
    }
    if (ch === '`') break;
    out += ch;
    i += 1;
  }
  return out;
}

function jsString(s) {
  return JSON.stringify(s);
}

function appendShaders(entries) {
  const file = path.join(ENG, 'originkitShaders.js');
  let cur = fs.readFileSync(file, 'utf8');
  for (const [name, value] of entries) {
    const marker = `export const ${name} =`;
    if (cur.includes(marker)) {
      const re = new RegExp(`export const ${name} = [\\s\\S]*?;\\r?\\n`);
      cur = cur.replace(re, `${marker} ${jsString(value)};\n`);
    } else {
      if (!cur.endsWith('\n')) cur += '\n';
      cur += `${marker} ${jsString(value)};\n`;
    }
  }
  fs.writeFileSync(file, cur);
}

function writeWorker(id, startFn, sceneFile) {
  const content = `import { ${startFn} } from './${sceneFile}.js';

let handle = null;

function apply(data) {
  if (data.type === 'resize') handle?.resize(data.width, data.height, data.dpr);
  else if (data.type === 'configure') handle?.update?.(data.params);
  else if (data.type === 'playback') handle?.setPlayback?.(data);
  else if (data.type === 'pointer') handle?.setPointer?.(data);
}

self.onmessage = (event) => {
  const data = event.data || {};
  if (data.type !== 'init') {
    apply(data);
    return;
  }
  if (!data.canvas) return;
  try {
    handle = ${startFn}(data.canvas, data);
    if (data.paused) handle?.setPlayback?.({ paused: true, restart: data.restart || 0 });
  } catch {
    self.postMessage({ type: 'failed' });
  }
};
`;
  fs.writeFileSync(path.join(ENG, `${id}.worker.js`), content);
}

function writeBackground(compName, workerFile, sceneFile, startFn, color, trackExpr) {
  const content = `import { SceneHost } from './sceneHost';

function createWorker() {
  return new Worker(new URL('./engines/${workerFile}.worker.js', import.meta.url), { type: 'module' });
}

function startScene(canvas, size) {
  return import('./engines/${sceneFile}.js').then(({ ${startFn} }) => ${startFn}(canvas, size));
}

/** Fond ${compName}. L'animation tourne dans un worker. */
export default function ${compName}Background({ params, paused = false, epoch = 0 }) {
  return (
    <SceneHost
      color="${color}"
      startScene={startScene}
      createWorker={createWorker}
      params={params}
      paused={paused}
      epoch={epoch}
      trackPointer={${trackExpr}}
    />
  );
}
`;
  fs.writeFileSync(path.join(BG, `${compName}Background.jsx`), content);
}

function writeThumb(name, bg, css) {
  const content = `/** Aperçu statique. Le WebGL ne démarre que lorsque ce fond est choisi. */
export default function ${name}Thumbnail() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: '${bg}' }} aria-hidden="true">
      <div className="absolute inset-0" style={{ background: '${css}' }} />
    </div>
  );
}
`;
  fs.writeFileSync(path.join(TH, `${name}Thumbnail.jsx`), content);
}

// --- Light Cables ---
{
  const src = fs.readFileSync(path.join(UI, 'light-cables.tsx'), 'utf8');
  const vert = extractTagged(src, 'VERT_SRC');
  const frag = extractTagged(src, 'FRAG_SRC');
  appendShaders([
    ['LIGHT_CABLES_VERT', vert],
    ['LIGHT_CABLES_FRAG', frag]
  ]);
  fs.writeFileSync(
    path.join(ENG, 'lightCablesScene.js'),
    `import { normalizeParams } from '../backgroundStudio.js';
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
`
  );
  writeWorker('lightCables', 'startLightCables', 'lightCablesScene');
  writeBackground('LightCables', 'lightCables', 'lightCablesScene', 'startLightCables', '#000000', 'params?.cursor !== false');
  writeThumb(
    'LightCables',
    '#000000',
    'radial-gradient(ellipse at 40% 20%, rgba(255,208,0,0.7) 0%, transparent 40%), linear-gradient(180deg,#1a1000,#000), repeating-linear-gradient(90deg,transparent 0 18px,rgba(255,176,0,0.12) 18px 20px)'
  );
  console.log('ported light-cables');
}

// --- Liquid Vortex (Three.js) ---
{
  const src = fs.readFileSync(path.join(UI, 'liquid-vortex.tsx'), 'utf8');
  const vert = extractTagged(src, 'QUAD_VERTEX');
  const frag = extractTagged(src, 'SMOKE_FRAGMENT');
  appendShaders([
    ['LIQUID_VORTEX_VERT', vert],
    ['LIQUID_VORTEX_FRAG', frag]
  ]);
  fs.writeFileSync(
    path.join(ENG, 'liquidVortexScene.js'),
    `import * as THREE from 'three';
import { normalizeParams } from '../backgroundStudio.js';
import { LIQUID_VORTEX_FRAG, LIQUID_VORTEX_VERT } from './originkitShaders.js';

function settingsFor(state) {
  return {
    detail: 1.0 + state.detail * 0.25,
    turbulence: state.turbulence * 0.12,
    swirl: 2.8 + (state.swirl - 1) * 0.3111,
    density: 0.25 + state.density * 0.055,
    contrast: 0.6 + state.contrast * 0.13,
    ember: state.emberAmount * 0.06,
    speed: state.speed * 0.07,
    hoverBoost: state.hoverBoost * 0.15,
    zoom: 100 / Math.max(20, state.sizePercent)
  };
}

export function startLiquidVortex(canvas, options = {}) {
  let state = normalizeParams('liquid-vortex', options.params);
  let S = settingsFor(state);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
      depth: false,
      powerPreference: 'high-performance'
    });
  } catch {
    options.onReady?.();
    return { resize() {}, stop() {} };
  }
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  const material = new THREE.ShaderMaterial({
    vertexShader: LIQUID_VORTEX_VERT,
    fragmentShader: LIQUID_VORTEX_FRAG,
    uniforms: {
      uResolution: { value: new THREE.Vector2(1, 1) },
      uSmoke: { value: new THREE.Color(state.smoke) },
      uDeep: { value: new THREE.Color(state.deep) },
      uEmber: { value: new THREE.Color(state.ember) },
      uTime: { value: 0 },
      uDetail: { value: S.detail },
      uTurbulence: { value: S.turbulence },
      uSwirl: { value: S.swirl },
      uDensity: { value: S.density },
      uContrast: { value: S.contrast },
      uEmberAmount: { value: S.ember },
      uZoom: { value: S.zoom }
    },
    transparent: true,
    depthTest: false,
    depthWrite: false
  });

  const geometry = new THREE.PlaneGeometry(2, 2);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(mesh);
  const camera = new THREE.Camera();

  let width = 1;
  let height = 1;
  const applySize = (cssWidth, cssHeight) => {
    width = Math.max(1, Math.floor(cssWidth || 1));
    height = Math.max(1, Math.floor(cssHeight || 1));
    renderer.setSize(width, height, false);
    material.uniforms.uResolution.value.set(width, height);
  };
  applySize(options.width, options.height);

  let hover = 0;
  let hoverTarget = 0;
  let time = 0;
  let frameId = 0;
  let lastT = 0;
  let stopped = false;
  let paused = false;
  let restartSeen = 0;
  let readySent = false;

  const applyLook = () => {
    S = settingsFor(state);
    const u = material.uniforms;
    u.uSmoke.value.set(state.smoke);
    u.uDeep.value.set(state.deep);
    u.uEmber.value.set(state.ember);
    u.uDetail.value = S.detail;
    u.uTurbulence.value = S.turbulence;
    u.uSwirl.value = S.swirl;
    u.uDensity.value = S.density;
    u.uContrast.value = S.contrast;
    u.uEmberAmount.value = S.ember;
    u.uZoom.value = S.zoom;
  };

  const step = (now) => {
    if (stopped) return;
    frameId = self.requestAnimationFrame(step);
    if (paused) return;
    let dt = lastT === 0 ? 0 : (now - lastT) / 1000;
    lastT = now;
    if (!Number.isFinite(dt) || dt < 0) dt = 0;
    if (dt > 0.05) dt = 0.05;
    const want = state.cursor !== false ? hoverTarget : 0;
    hover += (want - hover) * (1 - Math.exp(-dt * 3.5));
    time += dt * S.speed * (1 + S.hoverBoost * hover);
    material.uniforms.uTime.value = time;
    renderer.render(scene, camera);
    if (!readySent) {
      readySent = true;
      options.onReady?.();
    }
  };
  frameId = self.requestAnimationFrame(step);

  return {
    resize(cssWidth, cssHeight) {
      applySize(cssWidth, cssHeight);
    },
    update(params) {
      if (stopped) return;
      state = normalizeParams('liquid-vortex', params);
      applyLook();
    },
    setPointer({ active = false } = {}) {
      hoverTarget = active ? 1 : 0;
    },
    setPlayback({ paused: nextPaused = false, restart = 0 } = {}) {
      paused = Boolean(nextPaused);
      if (restart !== restartSeen) {
        restartSeen = restart;
        time = 0;
        lastT = 0;
      }
      self.cancelAnimationFrame(frameId);
      if (paused) return;
      lastT = self.performance.now();
      frameId = self.requestAnimationFrame(step);
    },
    stop() {
      stopped = true;
      self.cancelAnimationFrame(frameId);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    }
  };
}
`
  );
  writeWorker('liquidVortex', 'startLiquidVortex', 'liquidVortexScene');
  writeBackground('LiquidVortex', 'liquidVortex', 'liquidVortexScene', 'startLiquidVortex', '#000000', 'params?.cursor !== false');
  writeThumb(
    'LiquidVortex',
    '#000000',
    'radial-gradient(circle at 50% 50%, rgba(255,247,0,0.85) 0%, rgba(255,200,0,0.35) 28%, transparent 62%), radial-gradient(ellipse at 50% 55%, rgba(80,40,0,0.5) 0%, #000 70%)'
  );
  console.log('ported liquid-vortex');
}

// --- Mood Field ---
{
  const src = fs.readFileSync(path.join(UI, 'mood-field.tsx'), 'utf8');
  const vert = extractTagged(src, 'VERT');
  const frag = extractTagged(src, 'FRAG');
  appendShaders([
    ['MOOD_FIELD_VERT', vert],
    ['MOOD_FIELD_FRAG', frag]
  ]);
  fs.writeFileSync(
    path.join(ENG, 'moodFieldScene.js'),
    `import { normalizeParams } from '../backgroundStudio.js';
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
`
  );
  writeWorker('moodField', 'startMoodField', 'moodFieldScene');
  writeBackground('MoodField', 'moodField', 'moodFieldScene', 'startMoodField', '#05060a', 'params?.cursor !== false');
  writeThumb(
    'MoodField',
    '#05060a',
    'radial-gradient(ellipse at 35% 40%, rgba(255,0,179,0.55) 0%, transparent 50%), radial-gradient(ellipse at 70% 60%, rgba(47,107,255,0.45) 0%, transparent 55%), linear-gradient(160deg,#05060a,#120818)'
  );
  console.log('ported mood-field');
}

// --- Rain Puddle ---
{
  const src = fs.readFileSync(path.join(UI, 'rain-puddle.tsx'), 'utf8');
  const vert = extractTagged(src, 'VERT_SRC');
  const frag = extractTagged(src, 'FRAG_SRC');
  appendShaders([
    ['RAIN_PUDDLE_VERT', vert],
    ['RAIN_PUDDLE_FRAG', frag]
  ]);
  fs.writeFileSync(
    path.join(ENG, 'rainPuddleScene.js'),
    `import { normalizeParams } from '../backgroundStudio.js';
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
`
  );
  writeWorker('rainPuddle', 'startRainPuddle', 'rainPuddleScene');
  writeBackground('RainPuddle', 'rainPuddle', 'rainPuddleScene', 'startRainPuddle', '#000000', 'params?.cursor !== false');
  writeThumb(
    'RainPuddle',
    '#000000',
    'linear-gradient(180deg,#0a1a12 0%,#021008 45%,#000 100%), radial-gradient(ellipse at 50% 75%, rgba(3,102,26,0.55) 0%, transparent 55%), repeating-linear-gradient(185deg,transparent 0 10px,rgba(255,255,255,0.06) 10px 11px)'
  );
  console.log('ported rain-puddle');
}

console.log('done: light-cables, liquid-vortex, mood-field, rain-puddle');
