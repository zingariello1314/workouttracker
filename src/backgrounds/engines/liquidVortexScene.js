import * as THREE from 'three';
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
