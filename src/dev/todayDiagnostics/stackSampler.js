/**
 * Échantillonnage de stacks JS pendant la capture (sans CDP).
 * Corrélation temporelle avec les long tasks du Flight Recorder.
 *
 * Limite : échantillonnage, pas un profil exact. Distinguer self/total estimés.
 */

const MAX_SAMPLES = 8000;
const samples = [];
let timer = 0;
let intervalMs = 25;

function parseStack(stack) {
  if (!stack || typeof stack !== 'string') return [];
  return stack
    .split('\n')
    .slice(2, 12)
    .map((line) => line.trim().replace(/^at\s+/, ''))
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^(.*?)(?:\s+\(|@)?(https?:\/\/[^)\s]+|[^()\s]+\.(?:js|jsx|ts|tsx)[^)\s]*)?/);
      const fn = (m?.[1] || line).replace(/\s*$/, '') || '(anonymous)';
      const file = m?.[2] ? String(m[2]).split('/').slice(-2).join('/').split('?')[0] : null;
      return { fn: fn.slice(0, 120), file };
    });
}

export function startStackSampler(ms = 25) {
  stopStackSampler();
  intervalMs = ms;
  if (typeof window === 'undefined') return;
  timer = window.setInterval(() => {
    let stack = '';
    try {
      stack = new Error('momentum-stack-sample').stack || '';
    } catch {
      return;
    }
    const frames = parseStack(stack).filter(
      (frame) => !/stackSampler|todayDiag|Error|setInterval/i.test(frame.fn + (frame.file || ''))
    );
    if (!frames.length) return;
    samples.push({
      t: performance.now(),
      top: frames[0],
      frames
    });
    if (samples.length > MAX_SAMPLES) samples.splice(0, samples.length - MAX_SAMPLES);
  }, intervalMs);
}

export function stopStackSampler() {
  if (timer) {
    clearInterval(timer);
    timer = 0;
  }
}

export function resetStackSampler() {
  samples.length = 0;
}

/**
 * Agrège les stacks dont t ∈ [start, end].
 */
export function summarizeStacksForWindow(start, end) {
  const hit = samples.filter((s) => s.t >= start && s.t <= end);
  const topCount = new Map();
  const fileCount = new Map();
  hit.forEach((s) => {
    const key = `${s.top?.fn || '?'} @ ${s.top?.file || '?'}`;
    topCount.set(key, (topCount.get(key) || 0) + 1);
    if (s.top?.file) fileCount.set(s.top.file, (fileCount.get(s.top.file) || 0) + 1);
  });
  const ranked = [...topCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([frame, count]) => ({
      frame,
      samples: count,
      share: hit.length ? Math.round((count / hit.length) * 1000) / 10 : 0
    }));
  return {
    sampleCount: hit.length,
    intervalMs,
    method: 'setInterval-Error.stack',
    quality: 'sampling-estimate-not-exact-self-time',
    topFrames: ranked,
    topFiles: [...fileCount.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([file, count]) => ({ file, samples: count }))
  };
}

export function summarizeStacksForLongTasks(longTasks, limit = 12) {
  const heavy = (longTasks || [])
    .filter((task) => Number.isFinite(task.t) && Number.isFinite(task.dur) && task.dur >= 1000)
    .sort((a, b) => b.dur - a.dur)
    .slice(0, limit);
  return heavy.map((task) => ({
    taskId: task.taskId,
    t: task.t,
    dur: task.dur,
    stacks: summarizeStacksForWindow(task.t, task.t + task.dur)
  }));
}

export function snapshotStackSampler() {
  return {
    sampleCount: samples.length,
    intervalMs,
    method: 'setInterval-Error.stack',
    note: 'Échantillonnage page ; le collecteur CDP reste la source de vérité pour self/total time V8.'
  };
}
