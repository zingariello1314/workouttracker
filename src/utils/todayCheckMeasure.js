/**
 * Mesure DEV du chemin coche Aujourd’hui (clic → patch → idle).
 * Aucun effet en production.
 */

const DEV = Boolean(typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV);

export function startTodayCheckMeasure(label) {
  const t0 = performance.now();
  const marks = [];
  const mark = (name) => {
    marks.push({ name, ms: Math.round((performance.now() - t0) * 10) / 10 });
  };
  mark('start');
  return {
    mark,
    flush() {
      if (!DEV) return;
      const total = marks.length ? marks[marks.length - 1].ms : 0;
      console.info(`[today-check] ${label} total=${total}ms`, marks);
    }
  };
}

export function yieldToNextPaint() {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame !== 'function') {
      setTimeout(resolve, 0);
      return;
    }
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

export function scheduleTodayCheckIdle(fn, timeout = 400) {
  const run = () => {
    try {
      fn();
    } catch (err) {
      console.error('[today-check] idle', err);
    }
  };
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(run, { timeout });
      } else {
        setTimeout(run, 0);
      }
    });
  });
}
