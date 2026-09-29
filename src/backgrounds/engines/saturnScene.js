/**
 * Saturne en particules, hors React, pour un OffscreenCanvas.
 * Même géométrie et mêmes shaders que le composant Originkit.
 * Pas d'anticrénelage, pas de glisser : un fond ne doit pas capter le pointeur.
 * Le ratio de pixels est plafonné à 1 pour éviter le plein écran en 4× pixels.
 */
import * as THREE from 'three';
import { normalizeParams } from '../backgroundStudio.js';

const PERSPECTIVE = 0.15;
const VIEW_SPAN = 6.4;
const CORE_RADIUS = 1;
const MAX_MOTES = 90000;
const RING_THICKNESS = 0.011;
const RING_MOTE_FACTOR = 1.35;

const DEFAULTS = {
  coreColor: '#997F00',
  ringColor: '#FFD400',
  density: 20,
  particleSize: 14,
  glow: 20,
  tilt: 6,
  roll: 7,
  spinSpeed: 7,
  ringOptions: { innerRadius: 138, outerRadius: 262, gaps: 2, orbitSpeed: 9 },
  sizePercent: 134
};

function configFromParams(params) {
  const n = normalizeParams('particle-saturn', params) || normalizeParams('particle-saturn', null);
  return {
    background: n.background,
    coreColor: n.coreColor,
    ringColor: n.ringColor,
    density: n.density,
    particleSize: n.particleSize,
    glow: n.glow,
    tilt: n.tilt,
    roll: n.roll,
    spinSpeed: n.spinSpeed,
    sizePercent: n.sizePercent,
    ringOptions: {
      innerRadius: n.innerRadius,
      outerRadius: n.outerRadius,
      gaps: n.gaps,
      orbitSpeed: n.orbitSpeed
    }
  };
}

function cloudKey(S) {
  return [S.coreMotes, S.ringMotes, S.innerRadius, S.outerRadius, S.gapCount].join(':');
}

function clamp(v, lo, hi, fallback) {
  const n = typeof v === 'number' && Number.isFinite(v) ? v : fallback;
  return Math.max(lo, Math.min(hi, n));
}

function settingsFor(cfg) {
  const ring = cfg.ringOptions ?? DEFAULTS.ringOptions;
  const density = clamp(cfg.density, 1, 20, DEFAULTS.density);
  const baseMotes = 600 + density * density * 95;
  const coreMotes = Math.min(MAX_MOTES, Math.round(baseMotes));
  const ringMotes = Math.min(MAX_MOTES, Math.round(baseMotes * RING_MOTE_FACTOR));
  const innerFraction = clamp(ring.innerRadius, 105, 200, DEFAULTS.ringOptions.innerRadius) / 100;
  const outerFraction = clamp(ring.outerRadius, 110, 300, DEFAULTS.ringOptions.outerRadius) / 100;
  return {
    coreMotes,
    ringMotes,
    moteSize: 0.5 + clamp(cfg.particleSize, 1, 20, DEFAULTS.particleSize) * 0.13,
    glow: 0.15 + clamp(cfg.glow, 1, 20, DEFAULTS.glow) * 0.055,
    tiltRadians: (clamp(cfg.tilt, -80, 80, DEFAULTS.tilt) * Math.PI) / 180,
    rollRadians: (clamp(cfg.roll, -90, 90, DEFAULTS.roll) * Math.PI) / 180,
    spinRate: clamp(cfg.spinSpeed, 0, 20, DEFAULTS.spinSpeed) * 0.05,
    innerRadius: innerFraction * CORE_RADIUS,
    outerRadius: Math.max(innerFraction + 0.08, outerFraction) * CORE_RADIUS,
    gapCount: Math.round(clamp(ring.gaps, 0, 4, DEFAULTS.ringOptions.gaps)),
    ringThickness: RING_THICKNESS,
    orbitRate: clamp(ring.orbitSpeed, 0, 20, DEFAULTS.ringOptions.orbitSpeed) * 0.11
  };
}

function insideGap(S, radius, span) {
  for (let g = 0; g < S.gapCount; g += 1) {
    const centre = S.innerRadius + span * ((g + 1) / (S.gapCount + 1));
    const halfWidth = span * (0.075 - g * 0.011);
    if (Math.abs(radius - centre) < halfWidth) return true;
  }
  return false;
}

function pickRingRadius(S, span) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const u = Math.sqrt(Math.random());
    const radius = S.innerRadius + u * span;
    if (!insideGap(S, radius, span)) return radius;
  }
  return S.outerRadius;
}

function buildCloud(S) {
  const count = S.coreMotes + S.ringMotes;
  const position = new Float32Array(count * 3);
  const kind = new Float32Array(count);
  const along = new Float32Array(count);
  const seed = new Float32Array(count);
  const radius = new Float32Array(count);

  for (let i = 0; i < S.coreMotes; i += 1) {
    kind[i] = 0;
    along[i] = (i + 0.5) / S.coreMotes;
    seed[i] = Math.random();
    radius[i] = 0;
  }

  const span = S.outerRadius - S.innerRadius;
  for (let i = 0; i < S.ringMotes; i += 1) {
    const k = S.coreMotes + i;
    kind[k] = 1;
    along[k] = i / Math.max(1, S.ringMotes - 1);
    seed[k] = Math.random();
    radius[k] = pickRingRadius(S, span);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geometry.setAttribute('aKind', new THREE.BufferAttribute(kind, 1));
  geometry.setAttribute('aAlong', new THREE.BufferAttribute(along, 1));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  geometry.setAttribute('aRadius', new THREE.BufferAttribute(radius, 1));
  return geometry;
}

const SATURN_VERTEX = `
    attribute float aKind;
    attribute float aAlong;
    attribute float aSeed;
    attribute float aRadius;
    uniform float uTime;
    uniform float uMoteSize;
    uniform float uOrbitRate;
    uniform float uRingThickness;
    uniform float uCoreRadius;
    uniform float uPixelRatio;
    varying float vKind;
    varying float vBright;
    const float TAU = 6.28318530718;
    float hash11(float n) {
        return fract(sin(n * 78.233) * 43758.5453);
    }
    void main() {
        vec3 modelPos;
        float bright = 1.0;
        if (aKind < 0.5) {
            float y = 1.0 - aAlong * 2.0;
            float ringRadius = sqrt(max(0.0, 1.0 - y * y));
            float theta = aAlong * 2399.96;
            modelPos = vec3(cos(theta) * ringRadius, y, sin(theta) * ringRadius) * uCoreRadius;
            modelPos *= 1.0 + (hash11(aSeed * 91.7) - 0.5) * 0.012;
            bright = 0.55 + hash11(aSeed * 13.1) * 0.6;
        } else {
            float orbitRadius = aRadius;
            float rate = uOrbitRate / pow(max(orbitRadius, 0.2), 1.5);
            float theta = aSeed * TAU + uTime * rate;
            float lift = (hash11(aSeed * 37.9) - 0.5) * 2.0 * uRingThickness;
            modelPos = vec3(cos(theta) * orbitRadius, lift, sin(theta) * orbitRadius);
            float lane = hash11(floor(orbitRadius * 46.0));
            bright = (0.35 + lane * 0.95) * (0.6 + hash11(aSeed * 5.3) * 0.7);
        }
        vec4 viewPos = modelViewMatrix * vec4(modelPos, 1.0);
        vec3 modelCentre = modelViewMatrix[3].xyz;
        vec3 fromCamera = viewPos.xyz;
        float rayLength = max(length(fromCamera), 1e-5);
        vec3 rayDir = fromCamera / rayLength;
        float alongRay = dot(modelCentre, rayDir);
        float offAxis = length(modelCentre - rayDir * alongRay);
        bool occluded;
        if (aKind < 0.5) {
            occluded = dot(viewPos.xyz - modelCentre, rayDir) > 0.0;
        } else {
            float inside = uCoreRadius * uCoreRadius - offAxis * offAxis;
            float nearHit = alongRay - sqrt(max(inside, 0.0));
            occluded = inside > 0.0 && rayLength > nearHit;
        }
        if (occluded) {
            gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
            gl_PointSize = 0.0;
            vKind = aKind;
            vBright = 0.0;
            return;
        }
        gl_Position = projectionMatrix * viewPos;
        gl_PointSize = uMoteSize * uPixelRatio * (9.0 / max(0.001, -viewPos.z));
        vKind = aKind;
        vBright = bright;
    }
`;

const SATURN_FRAGMENT = `
    precision highp float;
    uniform vec3 uCoreColor;
    uniform vec3 uRingColor;
    uniform float uGlow;
    varying float vKind;
    varying float vBright;
    void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        if (d > 1.0) discard;
        float fall = 1.0 - d;
        float shape = pow(fall, 5.0) + pow(fall, 1.6) * 0.3;
        vec3 col = vKind < 0.5 ? uCoreColor : uRingColor;
        float a = shape * vBright * (0.35 + uGlow);
        gl_FragColor = vec4(col * a, a);
    }
`;

export function startParticleSaturn(canvas, options = {}) {
  let cfg = configFromParams(options.params);
  let S = settingsFor(cfg);
  const dpr = Math.min(options.dpr || 1, 1);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: true,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance'
    });
  } catch {
    options.onReady?.();
    return { resize() {}, stop() {} };
  }

  renderer.setPixelRatio(dpr);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);

  const material = new THREE.ShaderMaterial({
    vertexShader: SATURN_VERTEX,
    fragmentShader: SATURN_FRAGMENT,
    uniforms: {
      uTime: { value: 0 },
      uMoteSize: { value: S.moteSize },
      uOrbitRate: { value: S.orbitRate },
      uRingThickness: { value: S.ringThickness },
      uCoreRadius: { value: CORE_RADIUS },
      uPixelRatio: { value: dpr },
      uCoreColor: { value: new THREE.Color(cfg.coreColor) },
      uRingColor: { value: new THREE.Color(cfg.ringColor) },
      uGlow: { value: S.glow }
    },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false
  });

  let geometry = buildCloud(S);
  const cloud = new THREE.Points(geometry, material);
  cloud.frustumCulled = false;
  const group = new THREE.Group();
  group.rotation.order = 'ZXY';
  group.add(cloud);
  const scene = new THREE.Scene();
  scene.add(group);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 2000);

  let width = 1;
  let height = 1;
  const updateCamera = () => {
    const w = Math.max(1, width);
    const h = Math.max(1, height);
    const aspect = w / h;
    const distance = 1 / PERSPECTIVE;
    const sizePct = clamp(cfg.sizePercent, 20, 200, 90);
    const span = VIEW_SPAN * (100 / sizePct);
    const visibleHeight = aspect < 1 ? span / aspect : span;
    camera.aspect = aspect;
    camera.position.set(0, 0, distance);
    camera.lookAt(0, 0, 0);
    camera.fov = 2 * Math.atan(visibleHeight / 2 / distance) * (180 / Math.PI);
    camera.near = Math.max(0.1, distance - 20);
    camera.far = distance + 20;
    camera.updateProjectionMatrix();
  };

  let sizedW = 0;
  let sizedH = 0;
  let sizedDpr = 0;
  const applySize = (cssWidth, cssHeight, nextDpr) => {
    const ratio = Math.min(nextDpr || dpr, 1);
    const nextW = Math.max(1, Math.floor(cssWidth || 1));
    const nextH = Math.max(1, Math.floor(cssHeight || 1));
    if (nextW === sizedW && nextH === sizedH && ratio === sizedDpr) return;
    sizedW = nextW;
    sizedH = nextH;
    sizedDpr = ratio;
    width = nextW;
    height = nextH;
    renderer.setPixelRatio(ratio);
    material.uniforms.uPixelRatio.value = ratio;
    renderer.setSize(width, height, false);
    updateCamera();
  };
  applySize(options.width, options.height, dpr);

  let frameId = 0;
  let lastT = self.performance.now();
  let time = 0;
  let spinAngle = 0;
  let stopped = false;
  let paused = false;
  let readySent = false;
  let restartSeen = 0;
  let builtKey = cloudKey(S);

  const applyLook = () => {
    const u = material.uniforms;
    u.uMoteSize.value = S.moteSize;
    u.uOrbitRate.value = S.orbitRate;
    u.uRingThickness.value = S.ringThickness;
    u.uGlow.value = S.glow;
    u.uCoreColor.value.set(cfg.coreColor);
    u.uRingColor.value.set(cfg.ringColor);
    const nextKey = cloudKey(S);
    if (nextKey !== builtKey) {
      const next = buildCloud(S);
      geometry.dispose();
      geometry = next;
      cloud.geometry = next;
      builtKey = nextKey;
    }
    updateCamera();
  };

  const step = (now) => {
    if (stopped) return;
    frameId = self.requestAnimationFrame(step);
    if (paused) return;
    let dt = (now - lastT) / 1000;
    lastT = now;
    if (!Number.isFinite(dt) || dt < 0) dt = 0;
    if (dt > 0.05) dt = 0.05;
    time += dt;
    spinAngle += S.spinRate * dt;
    group.rotation.set(S.tiltRadians, spinAngle, S.rollRadians);
    material.uniforms.uTime.value = time;
    renderer.render(scene, camera);
    if (!readySent) {
      readySent = true;
      options.onReady?.();
    }
  };
  frameId = self.requestAnimationFrame(step);

  return {
    resize(cssWidth, cssHeight, nextDpr) {
      applySize(cssWidth, cssHeight, nextDpr);
    },
    update(params) {
      if (stopped) return;
      cfg = configFromParams(params);
      S = settingsFor(cfg);
      applyLook();
    },
    setPlayback({ paused: nextPaused = false, restart = 0 } = {}) {
      paused = Boolean(nextPaused);
      if (restart !== restartSeen) {
        restartSeen = restart;
        time = 0;
        spinAngle = 0;
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
