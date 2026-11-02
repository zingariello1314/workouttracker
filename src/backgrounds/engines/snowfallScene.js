import { normalizeParams } from '../backgroundStudio.js';
import { fitBuffer } from './shaderHost.js';

function viewOf(state) {
  return {
    count: Math.max(0, Math.round(state.count)),
    speedMin: Math.min(state.speedMin, state.speedMax),
    speedMax: Math.max(state.speedMin, state.speedMax),
    sizeMin: Math.min(state.sizeMin, state.sizeMax),
    sizeMax: Math.max(state.sizeMin, state.sizeMax),
    opacityMin: Math.min(state.opacityMin, state.opacityMax) / 100,
    opacityMax: Math.max(state.opacityMin, state.opacityMax) / 100,
    wind: state.wind,
    windVariation: state.windVariation,
    direction: state.direction === 'up' ? -1 : 1,
    color: state.color || '#ffffff'
  };
}

function rand(a, b) {
  return a + Math.random() * (b - a);
}

/** Neige Originkit (canvas 2D), hors React, pour OffscreenCanvas. */
export function startSnowfall(canvas, options = {}) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2d');

  let state = normalizeParams('snowfall', options.params);
  let view = viewOf(state);
  let cssW = 1;
  let cssH = 1;
  let dpr = 1;
  let flakes = [];
  let raf = 0;
  let stopped = false;
  let paused = false;
  let restartSeen = 0;
  let readySent = false;

  const rebuild = () => {
    const n = view.count;
    flakes = new Array(n);
    for (let i = 0; i < n; i++) {
      flakes[i] = {
        x: Math.random() * cssW,
        y: Math.random() * cssH,
        r: rand(view.sizeMin, view.sizeMax),
        vy: rand(view.speedMin, view.speedMax),
        vx: rand(-1, 1),
        phase: Math.random() * Math.PI * 2,
        sway: rand(0.2, 0.9),
        alpha: rand(view.opacityMin, view.opacityMax)
      };
    }
  };

  const applySize = (width, height, nextDpr) => {
    const box = fitBuffer(width, height);
    cssW = Math.max(1, width || 1);
    cssH = Math.max(1, height || 1);
    dpr = Math.min(2, Math.max(1, nextDpr || box.dpr || 1));
    const bw = Math.max(1, Math.round(cssW * dpr));
    const bh = Math.max(1, Math.round(cssH * dpr));
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    rebuild();
  };
  applySize(options.width, options.height, options.dpr);

  const draw = () => {
    ctx.clearRect(0, 0, cssW, cssH);
    ctx.fillStyle = view.color;
    for (let i = 0; i < flakes.length; i++) {
      const f = flakes[i];
      ctx.globalAlpha = f.alpha;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  const loop = (t) => {
    if (stopped) return;
    raf = self.requestAnimationFrame(loop);
    if (paused) return;
    for (let i = 0; i < flakes.length; i++) {
      const f = flakes[i];
      f.y += f.vy * view.direction;
      f.x += view.wind + f.vx * view.windVariation + Math.sin(t * 0.0012 + f.phase) * f.sway;
      if (view.direction > 0 && f.y - f.r > cssH) {
        f.y = -f.r;
        f.x = Math.random() * cssW;
      } else if (view.direction < 0 && f.y + f.r < 0) {
        f.y = cssH + f.r;
        f.x = Math.random() * cssW;
      }
      if (f.x < -f.r) f.x = cssW + f.r;
      else if (f.x > cssW + f.r) f.x = -f.r;
    }
    draw();
    if (!readySent) {
      readySent = true;
      options.onReady?.();
    }
  };
  raf = self.requestAnimationFrame(loop);

  return {
    resize(width, height, nextDpr) {
      applySize(width, height, nextDpr);
      draw();
    },
    update(params) {
      if (stopped) return;
      state = normalizeParams('snowfall', params);
      view = viewOf(state);
      rebuild();
    },
    setPointer() {},
    setPlayback({ paused: nextPaused = false, restart = 0 } = {}) {
      paused = Boolean(nextPaused);
      if (restart !== restartSeen) {
        restartSeen = restart;
        rebuild();
      }
      self.cancelAnimationFrame(raf);
      if (!paused) raf = self.requestAnimationFrame(loop);
    },
    stop() {
      stopped = true;
      self.cancelAnimationFrame(raf);
    }
  };
}
