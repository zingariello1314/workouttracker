import { normalizeParams } from '../backgroundStudio.js';
import { createVortex } from './tornadoCore.js';

const PX_PER_WORLD = 60;
const LINE_GLOW_MAX = 1;
const DOT_GLOW_MAX = 4.2;
const COMET_SPEED_MAX = 0.15;
const COMET_GLOW_MAX = 1;
const DOT_SIZE_SCALE = 1000;

function toConfig(params, running) {
  const up = params.direction !== 'down';
  const dir = up ? 1 : -1;
  return {
    floorRadius: params.bottomRadius / PX_PER_WORLD,
    waistRadius: params.waistRadius / PX_PER_WORLD,
    crownRadius: params.topRadius / PX_PER_WORLD,
    waistAt: 1 - params.waistPosition / 100,
    twist: params.twist,
    zoom: params.zoom,
    flowDir: dir,
    flowSpeed: (params.speed / 100) * dir,
    lineCount: params.lineCount,
    lineColor: params.lineColor,
    lineGlow: (params.lineGlow / 10) * LINE_GLOW_MAX,
    showDots: params.dots !== false,
    dotCount: params.dotCount,
    dotSize: params.dotSize / DOT_SIZE_SCALE,
    dotColor: params.dotColor,
    dotGlow: DOT_GLOW_MAX,
    dotFlicker: 1,
    showComets: params.comets !== false,
    cometCount: params.cometCount,
    cometSpeed: (params.cometSpeed / 10) * COMET_SPEED_MAX,
    cometColor: params.cometColor,
    cometGlow: COMET_GLOW_MAX,
    cometTail: 22,
    cometDelay: 8,
    collideForce: 0,
    hoverRepel: params.repel !== false,
    repelRadius: 60,
    repelStrength: 10,
    running
  };
}

function structureOf(cfg) {
  return [
    cfg.floorRadius,
    cfg.waistRadius,
    cfg.crownRadius,
    cfg.waistAt,
    cfg.twist,
    cfg.lineCount,
    cfg.showDots,
    cfg.dotCount,
    cfg.showComets,
    cfg.cometCount,
    cfg.cometTail
  ].join('|');
}

/** Tornade Originkit, hors React, pour un OffscreenCanvas. */
export function startTornado(canvas, options = {}) {
  const host = {
    width: Math.max(1, Math.round(options.width || 1)),
    height: Math.max(1, Math.round(options.height || 1))
  };
  let restartSeen = options.restart || 0;
  const cfgRef = {
    current: toConfig(normalizeParams('tornado', options.params), !options.paused)
  };
  let structure = structureOf(cfgRef.current);
  const api = createVortex(canvas, host, cfgRef);

  return {
    resize(width, height) {
      api.resize(width, height);
    },
    update(params) {
      const running = cfgRef.current.running;
      cfgRef.current = toConfig(normalizeParams('tornado', params), running);
      const next = structureOf(cfgRef.current);
      if (next !== structure) {
        structure = next;
        api.rebuild();
      }
    },
    setPointer(pointer) {
      api.setPointer(pointer);
    },
    setPlayback({ paused = false, restart = 0 } = {}) {
      if (restart !== restartSeen) {
        restartSeen = restart;
        api.restart();
      }
      api.setRunning(!paused);
    },
    stop() {
      api.dispose();
    }
  };
}
