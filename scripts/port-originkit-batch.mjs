/**
 * Port one-shot : extrait les shaders Originkit et écrit worker + scène + fond + miniature.
 * Usage : node scripts/port-originkit-batch.mjs
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

function bakeLatticeFrag(raw) {
  // Valeurs du source lattice-flight.tsx
  return raw
    .replace(/\$\{MAX_STEPS\}/g, '80')
    .replace(/\$\{ESCAPE_STEPS\}/g, '16')
    .replace(/\$\{CELL_HALF\.toFixed\(3\)\}/g, '0.500')
    .replace(/\$\{ESCAPE_EPS\.toFixed\(4\)\}/g, '0.0020')
    .replace(/\$\{HIT_EPS\.toFixed\(4\)\}/g, '0.0010')
    .replace(/\$\{FAR_CLIP\.toFixed\(1\)\}/g, '100.0');
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

// --- Lattice Flight ---
{
  const src = fs.readFileSync(path.join(UI, 'lattice-flight.tsx'), 'utf8');
  const vert = extractTagged(src, 'VERT');
  const frag = bakeLatticeFrag(extractTagged(src, 'FRAG'));
  appendShaders([
    ['LATTICE_VERT', vert],
    ['LATTICE_FRAG', frag]
  ]);
  fs.writeFileSync(
    path.join(ENG, 'latticeFlightScene.js'),
    `import { normalizeParams } from '../backgroundStudio.js';
import { LATTICE_FRAG, LATTICE_VERT } from './originkitShaders.js';
import { bindTriangle, fitBuffer, hexToRgb, linkProgram } from './shaderHost.js';

const FLOW_AT_50 = 0.3;
const FOG_AT_100 = 0.09;
const CELL_HALF = 0.5;

function viewOf(state) {
  return {
    background: hexToRgb(state.background, [0, 0, 0]),
    base: hexToRgb(state.baseColor, [0, 1, 1]),
    density: Math.max(1, state.density),
    speed: state.speed,
    thickness: Math.max(1, state.thickness),
    fog: Math.max(1, state.fog),
    distance: Math.max(1, state.distance),
    yaw: state.yaw,
    pitch: state.pitch,
    cursor: state.cursor !== false
  };
}

export function startLatticeFlight(canvas, options = {}) {
  const gl = canvas.getContext('webgl', {
    antialias: false,
    alpha: true,
    premultipliedAlpha: true,
    depth: false
  });
  if (!gl) throw new Error('webgl');
  const program = linkProgram(gl, LATTICE_VERT, LATTICE_FRAG);
  gl.useProgram(program);
  const buffer = bindTriangle(gl, program, 'aPos');
  const u = {
    buf: gl.getUniformLocation(program, 'uBuf'),
    res: gl.getUniformLocation(program, 'uRes'),
    angles: gl.getUniformLocation(program, 'uAngles'),
    flow: gl.getUniformLocation(program, 'uFlow'),
    scale: gl.getUniformLocation(program, 'uScale'),
    thick: gl.getUniformLocation(program, 'uThick'),
    dist: gl.getUniformLocation(program, 'uDist'),
    fog: gl.getUniformLocation(program, 'uFog'),
    base: gl.getUniformLocation(program, 'uBase')
  };

  let state = normalizeParams('lattice-flight', options.params);
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

  const ptr = { ax: null, ay: null, nx: 0.5, ny: 0.5, active: false };
  let flow = 0;
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
    const scale = view.density / 100;
    flow += dt * FLOW_AT_50 * (view.speed / 50) * scale;
    flow -= Math.floor(flow);

    let ax;
    let ay;
    if (view.cursor && ptr.active && ptr.ax != null) {
      ax = ptr.ax;
      ay = ptr.ay;
    } else {
      ax = (view.yaw * Math.PI) / 180;
      ay = (view.pitch * Math.PI) / 180;
    }

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.clearColor(view.background[0], view.background[1], view.background[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.uniform2f(u.buf, bw, bh);
    gl.uniform2f(u.res, cssW, cssH);
    gl.uniform2f(u.angles, ax, ay);
    gl.uniform1f(u.flow, flow);
    gl.uniform1f(u.scale, scale);
    gl.uniform1f(u.thick, (view.thickness / 100) * CELL_HALF);
    gl.uniform1f(u.dist, view.distance);
    gl.uniform1f(u.fog, FOG_AT_100 * (view.fog / 100));
    gl.uniform3fv(u.base, view.base);
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
      state = normalizeParams('lattice-flight', params);
      view = viewOf(state);
    },
    setPointer({ x = 0.5, y = 0.5, active = false } = {}) {
      ptr.nx = x;
      ptr.ny = y;
      ptr.active = Boolean(active);
      const h = cssH || 1;
      ptr.ax = (2 * x * cssW - cssW) / h;
      ptr.ay = (2 * (1 - y) * h - h) / h;
    },
    setPlayback({ paused: nextPaused = false, restart = 0 } = {}) {
      paused = Boolean(nextPaused);
      if (restart !== restartSeen) {
        restartSeen = restart;
        flow = 0;
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
  writeWorker('latticeFlight', 'startLatticeFlight', 'latticeFlightScene');
  writeBackground('LatticeFlight', 'latticeFlight', 'latticeFlightScene', 'startLatticeFlight', '#000000', 'params?.cursor !== false');
  writeThumb(
    'LatticeFlight',
    '#000000',
    'radial-gradient(ellipse at 50% 45%, rgba(0,255,255,0.55) 0%, transparent 55%), linear-gradient(180deg,#001018,#000)'
  );
  console.log('ported lattice-flight');
}

console.log('batch partial: lattice done — remaining via continue script');
