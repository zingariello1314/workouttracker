/**
 * Today Performance Flight Recorder V2.
 * Horloge : performance.now(), même origine que PerformanceEntry.startTime.
 * En production chaque fonction sort immédiatement.
 * Aucune répétition, charge, note, token ou URL complète n'est enregistrée.
 */

import {
  INSTRUMENTATION_VERSION,
  LATENCY_P95_RELIABLE_SAMPLES,
  LATENCY_SUMMARY_MIN_SAMPLES,
  analyzeInteractions,
  distribution,
  summarize
} from './flightAnalysis';
import { readDiagIsolationFlags, isDiagFlag } from './diagIsolation';
import { snapshotXpCalcRegistry, resetXpCalcRegistry, setXpCalcRegistryListener } from './xpCalcRegistry';
import { snapshotWorkSpans, summarizeWorkSpans, resetWorkSpans } from './workSpanTracker';
import {
  resetStackSampler,
  snapshotStackSampler,
  summarizeStacksForLongTasks
} from './stackSampler';

const DEV = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV === true;
const FLAG_KEY = 'momentum.todayDiag';
const CAMPAIGN_KEY = 'momentum.todayFlight.campaign';
const DB_NAME = 'MomentumDevFlightRecorder';
const DB_STORE = 'segments';
const MAX_EVENTS = 15000;
const SCHEMA_VERSION = '2.1.1';
/** Empreinte logique distincte du VITE_BUILD_ID (figé tant que Vite n’est pas redémarré). */
export const CODE_REVISION = 'p0.9-calendar-startup-cpu-2026-11-27';
const INSTRUMENTATION_BUILD =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_BUILD_ID) || null;

const bootOrigin = typeof performance !== 'undefined' ? performance.now() : 0;
const runtimeBootId = `boot-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const navigationTimeOrigin =
  typeof performance !== 'undefined' && Number.isFinite(performance.timeOrigin)
    ? performance.timeOrigin
    : Date.now();
const segmentWallOriginMs = Date.now();
const segmentPerfOriginMs = bootOrigin;
let capturing = false;
let level = 'standard';
let campaignId = null;
let segment = 1;
let seq = 0;
let interactionSeq = 0;
let taskSeq = 0;
let activeInteraction = 0;
let recentInteraction = 0;
let captureStartedAt = 0;
let droppedEvents = 0;
let pushCount = 0;
let pushMs = 0;
let panelAnalyzeCount = 0;
let panelAnalyzeMs = 0;
let panelAnalyzeMaxMs = 0;
let lastPanelAnalyzeMs = null;
let lastMemoryUsed = null;
const counters = {
  longTaskCapture: 0,
  interactionStarts: 0,
  eventTiming: 0,
  frames: 0
};
const events = [];
const seenTasks = new Set();
const serviceStack = [];
const renders = new Map();
let observers = [];
let frameHandle = 0;
let lastFrame = 0;
let frameTick = 0;
let memoryTimer = 0;
let flushTimer = 0;
let hidden = false;
let dimensionProvider = null;
const probe = { blur: true, animation: true, shadow: true };

function now() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function round(value) {
  return Number.isFinite(value) ? Math.round(value * 10) / 10 : null;
}

function pinned(event) {
  if (!event) return false;
  if (event.type === 'interaction' || event.type === 'longtask' || event.type === 'visibility' || event.type === 'marker' || event.type === 'mark') return true;
  if (event.type === 'note' && (event.category === 'load' || event.category === 'startup')) return true;
  if (event.type === 'loaf' || event.type === 'event-timing') return true;
  return false;
}

function bumpCounters(event) {
  if (!event) return;
  if (event.type === 'longtask' && event.scope !== 'before-capture') counters.longTaskCapture += 1;
  if (event.type === 'interaction' && event.phase === 'start') counters.interactionStarts += 1;
  if (event.type === 'event-timing') counters.eventTiming += 1;
  if (event.type === 'frame') counters.frames += 1;
  if (event.type === 'memory' && event.used != null) lastMemoryUsed = event.used;
}

function push(event) {
  if (!capturing) return;
  const t0 = now();
  pushCount += 1;
  events.push(event);
  bumpCounters(event);
  while (events.length > MAX_EVENTS) {
    const index = events.findIndex((item) => !pinned(item));
    if (index < 0) break;
    events.splice(index, 1);
    droppedEvents += 1;
  }
  pushMs += now() - t0;
}

function readFlag() {
  if (!DEV || typeof window === 'undefined') return false;
  try {
    const query = new URLSearchParams(window.location.search).get('todayDiag');
    if (query === '0') {
      window.localStorage.removeItem(FLAG_KEY);
      return false;
    }
    if (query === '1') {
      window.localStorage.setItem(FLAG_KEY, '1');
      return true;
    }
    return window.localStorage.getItem(FLAG_KEY) === '1';
  } catch {
    return false;
  }
}

function ensureCampaign() {
  if (typeof window === 'undefined') {
    campaignId = campaignId || `camp-${Date.now()}`;
    return;
  }
  try {
    const stored = window.sessionStorage.getItem(CAMPAIGN_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      campaignId = parsed.id;
      segment = (parsed.segment || 1) + 1;
    } else {
      campaignId = `camp-${Date.now()}`;
      segment = 1;
    }
    window.sessionStorage.setItem(CAMPAIGN_KEY, JSON.stringify({ id: campaignId, segment }));
  } catch {
    campaignId = campaignId || `camp-${Date.now()}`;
  }
}

function scriptHint(name) {
  if (!name || typeof name !== 'string') return null;
  const clean = name.split('?')[0].split('#')[0];
  const parts = clean.split('/');
  return parts.slice(-2).join('/');
}

function observe(type, callback, options) {
  if (typeof PerformanceObserver === 'undefined') return;
  try {
    const observer = new PerformanceObserver((list) => {
      if (!capturing && type !== 'longtask') return;
      callback(list.getEntries());
    });
    observer.observe({ type, ...options });
    observers.push(observer);
  } catch {
    push({
      type: 'note',
      category: 'capability',
      name: `API indisponible : ${type}`,
      t: now(),
      detail: null
    });
  }
}

function ingestLongTask(entry, scope) {
  const key = `${entry.startTime}:${entry.duration}`;
  if (seenTasks.has(key)) return;
  seenTasks.add(key);
  taskSeq += 1;
  const scripts = Array.isArray(entry.attribution)
    ? entry.attribution.slice(0, 4).map((item) => ({
        script: scriptHint(item.containerSrc || item.containerName || ''),
        name: item.name || null
      }))
    : [];
  const during = scope !== 'before-capture' && entry.startTime + entry.duration >= captureStartedAt;
  push({
    type: 'longtask',
    taskId: `lt-${taskSeq}`,
    t: entry.startTime,
    dur: round(entry.duration),
    scope: during ? 'capture' : 'before-capture',
    interactionId: activeInteraction || recentInteraction || null,
    service: serviceStack[serviceStack.length - 1] || null,
    scripts,
    hidden,
    confidence: scripts.length ? 'script-name' : serviceStack.length ? 'service-stack' : 'unknown'
  });
}

function watchObservers() {
  observe('longtask', (entries) => entries.forEach((entry) => ingestLongTask(entry, 'live')), { buffered: true });
  observe('long-animation-frame', (entries) => {
    entries.forEach((entry) => {
      push({
        type: 'loaf',
        t: entry.startTime,
        dur: round(entry.duration),
        blocking: round(entry.blockingDuration),
        scripts: Array.isArray(entry.scripts)
          ? entry.scripts.slice(0, 6).map((script) => ({
              source: scriptHint(script.sourceURL || ''),
              fn: script.functionName || null,
              invoker: script.invokerType || null,
              dur: round(script.duration)
            }))
          : [],
        interactionId: activeInteraction || null
      });
    });
  }, { buffered: false });
  try {
    observe('event', (entries) => {
      entries.forEach((entry) => {
        if (!entry.name) return;
        push({
          type: 'event-timing',
          name: entry.name,
          t: entry.startTime,
          dur: round(entry.duration),
          processingStart: round(entry.processingStart),
          processingEnd: round(entry.processingEnd),
          interactionId: entry.interactionId || null,
          quality: 'event-timing-direct'
        });
      });
    }, { durationThreshold: 16, buffered: false });
  } catch {
    /* Event Timing absent */
  }
}

function frameLoop(stamp) {
  if (!capturing) return;
  if (lastFrame) {
    const delta = stamp - lastFrame;
    frameTick += 1;
    const keep = level === 'deep' || delta >= 50 || frameTick % 30 === 0;
    if (keep) {
      push({
        type: 'frame',
        t: stamp,
        dur: round(delta),
        quality: 'raf-interval-not-presentation',
        interactionId: activeInteraction || null
      });
    }
  }
  lastFrame = stamp;
  frameHandle = requestAnimationFrame(frameLoop);
}

function sampleMemory() {
  const memory = typeof performance !== 'undefined' ? performance.memory : null;
  if (!memory) {
    push({ type: 'memory', t: now(), used: null, total: null, limit: null, quality: 'unavailable' });
    return;
  }
  push({
    type: 'memory',
    t: now(),
    used: memory.usedJSHeapSize,
    total: memory.totalJSHeapSize,
    limit: memory.jsHeapSizeLimit,
    quality: 'performance.memory-chrome'
  });
}

function onVisibility() {
  hidden = typeof document !== 'undefined' && document.visibilityState === 'hidden';
  push({ type: 'visibility', state: hidden ? 'hidden' : 'visible', t: now(), quality: 'direct' });
}

function startLoops() {
  resetXpCalcRegistry();
  resetWorkSpans();
  resetStackSampler();
  setXpCalcRegistryListener((row) => {
    if (row.kind === 'compute') {
      push({
        type: 'xp-calc',
        t: row.t,
        outcome: row.outcome,
        durMs: row.durMs ?? null,
        signatureAnon: row.signatureAnon,
        storageKeyAnon: row.storageKeyAnon,
        subscribers: row.subscribers,
        reason: row.reason,
        quality: 'direct-calculateSportXP-count'
      });
    }
  });
  // setInterval-Error.stack abandonné pour l’attribution des LT bloquants (samples=0 sous saturation).
  // Conservé désactivé : utiliser CDP (launch-p0-cpu.ps1).
  // startStackSampler(25);
  const suspendLoops = isDiagFlag('suspendFlightRecorderLoops');
  if (!suspendLoops && typeof requestAnimationFrame === 'function') {
    lastFrame = 0;
    frameHandle = requestAnimationFrame(frameLoop);
  }
  if (typeof window !== 'undefined') {
    if (!suspendLoops) {
      memoryTimer = window.setInterval(sampleMemory, 2000);
      flushTimer = window.setInterval(() => { void flushSegment(); }, 8000);
      sampleMemory();
    }
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flushSegment);
  }
}

function stopLoops() {
  if (frameHandle && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frameHandle);
  frameHandle = 0;
  if (typeof window !== 'undefined') {
    window.clearInterval(memoryTimer);
    window.clearInterval(flushTimer);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('pagehide', flushSegment);
  }
}

export function isTodayDiagDev() {
  return DEV;
}

export function isTodayDiagCapturing() {
  return DEV && capturing;
}

export function bootElapsed() {
  return round(now() - bootOrigin);
}

export function registerTodayDimensions(provider) {
  dimensionProvider = typeof provider === 'function' ? provider : null;
}

export function startTodayDiagCapture() {
  if (!DEV || capturing) return;
  capturing = true;
  captureStartedAt = now();
  ensureCampaign();
  try {
    window.localStorage.setItem(FLAG_KEY, '1');
  } catch {
    /* ignore */
  }
  watchObservers();
  startLoops();
  push({
    type: 'note',
    category: 'startup',
    name: segment > 1 ? 'Segment repris après rechargement' : 'Campagne démarrée',
    t: now(),
    detail: { campaignId, segment, bootMs: bootElapsed() }
  });
}

export function stopTodayDiagCapture() {
  if (!DEV || !capturing) return;
  push({ type: 'note', category: 'load', name: 'Capture arrêtée', t: now(), detail: { campaignId, segment } });
  void flushSegment();
  capturing = false;
  activeInteraction = 0;
  observers.forEach((observer) => observer.disconnect());
  observers = [];
  stopLoops();
  try {
    window.localStorage.removeItem(FLAG_KEY);
    window.sessionStorage.removeItem(CAMPAIGN_KEY);
  } catch {
    /* ignore */
  }
}

export function resetTodayDiag() {
  events.length = 0;
  renders.clear();
  seenTasks.clear();
  droppedEvents = 0;
  pushCount = 0;
  pushMs = 0;
  panelAnalyzeCount = 0;
  panelAnalyzeMs = 0;
  panelAnalyzeMaxMs = 0;
  lastPanelAnalyzeMs = null;
  lastMemoryUsed = null;
  counters.longTaskCapture = 0;
  counters.interactionStarts = 0;
  counters.eventTiming = 0;
  counters.frames = 0;
  seq = 0;
  interactionSeq = 0;
  taskSeq = 0;
  activeInteraction = 0;
}

export function noteTodayDiag(category, name, detail) {
  if (!DEV || !capturing) return;
  push({ type: 'note', category, name, t: now(), detail: sanitizeDetail(detail) });
}

export function markTodayStall() {
  if (!DEV) return;
  if (!capturing) startTodayDiagCapture();
  push({ type: 'marker', name: 'Ralentissement ressenti', t: now(), interactionId: activeInteraction || null });
}

function sanitizeDetail(detail) {
  if (!detail || typeof detail !== 'object') return null;
  const allowed = {};
  ['repsKeys', 'checkedKeys', 'exercisesOnScreen', 'campaignId', 'segment', 'bootMs', 'status', 'count'].forEach((key) => {
    if (typeof detail[key] === 'number' || typeof detail[key] === 'string') allowed[key] = detail[key];
  });
  return Object.keys(allowed).length ? allowed : null;
}

export function beginTodayInteraction(kind, label, meta) {
  if (!DEV || !capturing) return 0;
  interactionSeq += 1;
  const id = interactionSeq;
  activeInteraction = id;
  const inputAt = Number.isFinite(meta?.inputAt) ? meta.inputAt : null;
  push({
    type: 'interaction',
    phase: 'start',
    id,
    kind,
    label,
    t: now(),
    inputAt,
    quality: inputAt == null ? 'handler-clock' : 'event-timestamp'
  });
  return id;
}

export function markTodayInteraction(id, name) {
  if (!DEV || !capturing || !id) return;
  push({ type: 'mark', id, name, t: now() });
}

export function endTodayInteraction(id, status) {
  if (!DEV || !capturing || !id) return;
  push({ type: 'interaction', phase: 'end', id, status: status || 'done', t: now() });
  if (activeInteraction === id) activeInteraction = 0;
  recentInteraction = id;
  const scheduledHidden = hidden;
  if (typeof requestAnimationFrame !== 'function') return;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (!events.length && !capturing) return;
      push({
        type: 'mark',
        id,
        name: 'Rappel de frame',
        t: now(),
        detail: null,
        quality: 'approximation-not-presentation',
        hiddenAtSchedule: scheduledHidden,
        hiddenAtFire: typeof document !== 'undefined' && document.visibilityState === 'hidden'
      });
      if (recentInteraction === id) recentInteraction = 0;
    });
  });
}

export function spanTodayDiag(category, name) {
  if (!DEV || !capturing) return { end() {} };
  const t0 = now();
  const id = activeInteraction || null;
  const local = ++seq;
  serviceStack.push(name);
  return {
    end() {
      serviceStack.pop();
      push({
        type: 'span',
        category,
        name,
        spanId: local,
        id,
        t: t0,
        dur: round(now() - t0),
        quality: 'direct'
      });
    }
  };
}

export function recordTodayRender(name, durMs) {
  if (!DEV || !capturing) return;
  const dur = Number.isFinite(durMs) ? durMs : null;
  const cur = renders.get(name) || { count: 0, ms: 0 };
  cur.count += 1;
  if (dur != null) cur.ms += dur;
  renders.set(name, cur);
  const end = now();
  push({
    type: 'render',
    name,
    id: activeInteraction || recentInteraction || null,
    t: dur == null ? end : end - dur,
    dur: dur == null ? null : round(dur),
    quality: dur == null ? 'count-only' : 'direct-body'
  });
}

export function recordTodayReactCommit(info) {
  if (!DEV || !capturing || !info) return;
  push({
    type: 'react-commit',
    id: activeInteraction || recentInteraction || null,
    name: info.id || 'TodayTab',
    tree: info.id || 'TodayTab',
    phase: info.phase,
    actualDuration: round(info.actualDuration),
    baseDuration: round(info.baseDuration),
    startTime: round(info.startTime),
    commitTime: round(info.commitTime),
    t: Number.isFinite(info.commitTime) ? info.commitTime : now(),
    quality: 'react-profiler'
  });
}

/** Profiler multi-arbres (Sidebar, SportXPBar, Recap, …) — même schéma que TodayTab. */
export function recordReactTreeCommit(treeId, info) {
  if (!DEV || !capturing || !info) return;
  push({
    type: 'react-commit',
    id: activeInteraction || recentInteraction || null,
    name: treeId,
    tree: treeId,
    phase: info.phase,
    actualDuration: round(info.actualDuration),
    baseDuration: round(info.baseDuration),
    startTime: round(info.startTime),
    commitTime: round(info.commitTime),
    t: Number.isFinite(info.commitTime) ? info.commitTime : now(),
    quality: 'react-profiler'
  });
}

export function setFlightGraphicsProbe(partial) {
  if (!DEV || typeof document === 'undefined') return probe;
  Object.assign(probe, partial || {});
  const root = document.documentElement;
  root.dataset.flightBlur = probe.blur ? 'on' : 'off';
  root.dataset.flightAnim = probe.animation ? 'on' : 'off';
  root.dataset.flightShadow = probe.shadow ? 'on' : 'off';
  let style = document.getElementById('today-flight-probe');
  if (!style) {
    style = document.createElement('style');
    style.id = 'today-flight-probe';
    style.textContent = [
      'html[data-flight-blur="off"] *{backdrop-filter:none!important;-webkit-backdrop-filter:none!important;}',
      'html[data-flight-anim="off"] *,html[data-flight-anim="off"] *::before,html[data-flight-anim="off"] *::after{animation:none!important;transition:none!important;}',
      'html[data-flight-shadow="off"] *{box-shadow:none!important;text-shadow:none!important;}'
    ].join('');
    document.head.appendChild(style);
  }
  return { ...probe };
}

export function setFlightLevel(next) {
  if (next === 'deep' || next === 'standard') level = next;
  return level;
}

/**
 * @param {{ cloneEvents?: boolean }} [options]
 * cloneEvents=false pour l’analyse panneau (lecture seule) — évite de cloner des milliers d’événements.
 */
export function snapshotTodayDiag(options = {}) {
  const cloneEvents = options.cloneEvents !== false;
  return {
    capturedAt: new Date().toISOString(),
    capturing,
    campaignId,
    segment,
    level,
    bootMs: bootElapsed(),
    droppedEvents,
    pushCount,
    pushMs: round(pushMs),
    panelAnalyzeCount,
    panelAnalyzeMs: round(panelAnalyzeMs),
    panelAnalyzeMaxMs: round(panelAnalyzeMaxMs),
    lastPanelAnalyzeMs,
    renders: [...renders.entries()].map(([name, row]) => ({ name, count: row.count, ms: round(row.ms) })),
    events: cloneEvents ? events.map((event) => ({ ...event })) : events
  };
}

/** Compteurs O(1) pour le panneau — jamais de parcours du buffer. */
export function snapshotTodayDiagLite() {
  return {
    capturedAt: new Date().toISOString(),
    capturing,
    campaignId,
    segment,
    level,
    bootMs: bootElapsed(),
    droppedEvents,
    eventCount: events.length,
    pushCount,
    pushMs: round(pushMs),
    panelAnalyzeCount,
    panelAnalyzeMs: round(panelAnalyzeMs),
    panelAnalyzeMaxMs: round(panelAnalyzeMaxMs),
    lastPanelAnalyzeMs,
    counters: { ...counters },
    lastMemoryUsed,
    codeRevision: CODE_REVISION,
    runtimeBootId
  };
}

export function listTodayInteractions(snapshot = snapshotTodayDiag()) {
  return analyzeInteractions(snapshot.events, { now: now() }).map((row) => ({
    id: row.id,
    kind: row.kind,
    label: row.label,
    start: row.handlerStart,
    end: row.handlerEnd,
    status: row.status,
    totalMs: row.legacyTotalMs,
    processingMs: row.processingMs,
    untilNextFrameCallbackMs: row.untilNextFrameCallbackMs,
    unexplainedMs: row.unexplainedMs,
    band: row.band.id,
    hiddenDuring: row.hiddenDuring
  }));
}

export function analyzeTodayDiag(options = {}) {
  const t0 = now();
  const forPanel = options.forPanel === true;
  const snapshot = snapshotTodayDiag({ cloneEvents: options.cloneEvents === true });
  const interactions = analyzeInteractions(snapshot.events, { now: now() });
  const latencyValues = interactions
    .map((row) => row.bandMetric)
    .filter((value) => value != null);
  const dur = now() - t0;
  if (forPanel) {
    panelAnalyzeCount += 1;
    panelAnalyzeMs += dur;
    panelAnalyzeMaxMs = Math.max(panelAnalyzeMaxMs, dur);
    lastPanelAnalyzeMs = round(dur);
  }
  return {
    snapshot: {
      ...snapshot,
      panelAnalyzeCount,
      panelAnalyzeMs: round(panelAnalyzeMs),
      panelAnalyzeMaxMs: round(panelAnalyzeMaxMs),
      lastPanelAnalyzeMs
    },
    interactions,
    latency: summarize(latencyValues),
    distribution: distribution(latencyValues),
    analysisDurationMs: round(dur)
  };
}

function resolveApplicationVersion() {
  const env = typeof import.meta !== 'undefined' ? import.meta.env || {} : {};
  const buildId = env.VITE_BUILD_ID || env.VITE_APP_VERSION || INSTRUMENTATION_BUILD || null;
  return {
    mode: env.MODE || null,
    dev: env.DEV === true,
    prod: env.PROD === true,
    base: env.BASE_URL || null,
    vite: Boolean(env.DEV) || Boolean(env.PROD),
    instrumentationVersion: INSTRUMENTATION_VERSION,
    schemaVersion: SCHEMA_VERSION,
    buildId,
    codeRevision: CODE_REVISION,
    runtimeBootId,
    revisionFingerprint: `${buildId || 'no-vite-build'}::${CODE_REVISION}::${runtimeBootId}`,
    note:
      'buildId = VITE_BUILD_ID (figé au démarrage Vite). codeRevision change avec le code diag. runtimeBootId change à chaque chargement de page.'
  };
}

function openDb() {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DB_STORE)) db.createObjectStore(DB_STORE, { keyPath: 'key' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

export async function flushSegment() {
  if (!DEV || !campaignId) return;
  const db = await openDb();
  if (!db) return;
  const key = `${campaignId}:${segment}`;
  const record = { key, campaignId, segment, savedAt: Date.now(), events: events.map((event) => ({ ...event })) };
  await new Promise((resolve) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    tx.objectStore(DB_STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
  db.close();
}

export async function loadCampaignSegments() {
  const db = await openDb();
  if (!db) return [];
  const rows = await new Promise((resolve) => {
    const tx = db.transaction(DB_STORE, 'readonly');
    const request = tx.objectStore(DB_STORE).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => resolve([]);
  });
  db.close();
  return rows.filter((row) => !campaignId || row.campaignId === campaignId);
}

function dimensions() {
  try {
    return dimensionProvider ? dimensionProvider() : null;
  } catch {
    return null;
  }
}

function takeBufferedObserverEntries() {
  /** Force la livraison des PerformanceEntry encore en buffer avant analyse/export. */
  observers.forEach((observer) => {
    try {
      if (typeof observer.takeRecords === 'function') {
        const entries = observer.takeRecords();
        if (!entries?.length) return;
        // Les callbacks d’observe() ne sont pas réutilisés ici : ré-ingérer longtasks seulement.
        entries.forEach((entry) => {
          if (entry.entryType === 'longtask') ingestLongTask(entry, 'live');
        });
      }
    } catch {
      /* ignore */
    }
  });
}

export async function buildFlightExport() {
  takeBufferedObserverEntries();
  const analysis = analyzeTodayDiag({ cloneEvents: true, forPanel: false });
  const previous = await loadCampaignSegments();
  const currentKey = analysis.snapshot.campaignId
    ? `${analysis.snapshot.campaignId}:${analysis.snapshot.segment}`
    : null;
  /** Segments antérieurs uniquement — le segment courant reste dans `events` / timelines. */
  const priorSegments = previous.filter((row) => row.key !== currentKey);
  const longTasks = analysis.snapshot.events.filter((event) => event.type === 'longtask');
  const during = longTasks.filter((task) => task.scope === 'capture');
  const before = longTasks.filter((task) => task.scope === 'before-capture');
  const anomalies = analysis.interactions.filter((row) =>
    ['slow', 'very-slow', 'critical', 'blocked'].includes(row.band.id)
  );
  const fast = analysis.interactions.filter((row) => row.band.id === 'target');
  const persistenceEvents = analysis.snapshot.events.filter(
    (event) =>
      event.type === 'span' &&
      (event.category === 'storage' ||
        /persist|enregistr|écriture|IndexedDB|sauvegard/i.test(String(event.name || '')))
  );
  const isolation = readDiagIsolationFlags();
  return {
    metadata: {
      title: 'Today Performance Flight Recorder V2',
      schemaVersion: SCHEMA_VERSION,
      instrumentationVersion: INSTRUMENTATION_VERSION,
      exportedAt: new Date().toISOString(),
      campaignId: analysis.snapshot.campaignId,
      segment: analysis.snapshot.segment,
      privacy: 'Aucun contenu de séance, token, URL complète ou base utilisateur.'
    },
    environment: {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      visibility: typeof document !== 'undefined' ? document.visibilityState : null,
      hardwareConcurrency: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : null,
      deviceMemoryGb: typeof navigator !== 'undefined' ? navigator.deviceMemory || null : null
    },
    applicationVersion: resolveApplicationVersion(),
    instrumentationVersion: INSTRUMENTATION_VERSION,
    experimentalIsolation: isolation,
    capabilities: {
      longTask: typeof PerformanceObserver !== 'undefined',
      longAnimationFrame: 'observé si le navigateur accepte le type',
      eventTiming: 'observé avec durationThreshold 16',
      reactProfiler: true,
      memory: typeof performance !== 'undefined' && !!performance.memory,
      presentation: 'Event Timing duration quand un click natif est associable'
    },
    captureConfig: { level: analysis.snapshot.level, maxEvents: MAX_EVENTS, graphicsProbe: probe },
    captureSegments: previous.map((row) => ({
      key: row.key,
      savedAt: row.savedAt,
      events: row.events?.length || 0,
      isCurrentSegment: row.key === currentKey
    })),
    clockSynchronization: {
      clock: 'performance.now',
      unit: 'ms',
      sameOriginAs: 'PerformanceEntry.startTime',
      navigationTimeOrigin,
      segmentWallOriginMs,
      segmentPerfOriginMs,
      absoluteApprox: 'wallMs ≈ navigationTimeOrigin + performance.now()',
      note: 'Après un rechargement, performance.now redémarre. Comparer les segments via navigationTimeOrigin + savedAt, pas via les t bruts seuls.'
    },
    datasetDimensions: dimensions(),
    interactionCoverage: {
      kindsPresent: [...new Set(analysis.interactions.map((row) => row.kind))],
      persistenceSpanCount: persistenceEvents.length,
      sessionSaveObserved: persistenceEvents.some((event) =>
        /enregistr|persist|écriture|sauvegard/i.test(String(event.name || ''))
      ),
      note: 'Une interaction absente de l’export n’a pas été capturée — ne pas l’inférer.'
    },
    startupTimeline: analysis.snapshot.events.filter(
      (event) => event.type === 'note' && (event.category === 'startup' || event.category === 'load')
    ),
    navigationEvents: analysis.snapshot.events.filter(
      (event) =>
        event.category === 'navigation' ||
        event.name === 'Aujourd’hui visible' ||
        event.name === 'Aujourd’hui préchauffé'
    ),
    interactionTimeline: analysis.interactions,
    eventTiming: analysis.snapshot.events.filter((event) => event.type === 'event-timing'),
    frameTimeline: analysis.snapshot.events.filter((event) => event.type === 'frame'),
    longTasks: { duringCapture: during, beforeCapture: before },
    longAnimationFrames: analysis.snapshot.events.filter((event) => event.type === 'loaf'),
    reactCommits: analysis.snapshot.events.filter((event) => event.type === 'react-commit'),
    componentRenders: analysis.snapshot.renders,
    schedulerEvents: analysis.snapshot.events.filter((event) => event.type === 'mark'),
    storageOperations: analysis.snapshot.events.filter(
      (event) => event.type === 'span' && event.category === 'storage'
    ),
    dataOperations: analysis.snapshot.events.filter(
      (event) => event.type === 'span' && (event.category === 'state' || event.category === 'calc')
    ),
    serviceActivity: analysis.snapshot.events.filter((event) => event.type === 'span'),
    networkActivity: [],
    memoryTimeline: analysis.snapshot.events.filter((event) => event.type === 'memory'),
    visibilityEvents: analysis.snapshot.events.filter((event) => event.type === 'visibility'),
    userMarkers: analysis.snapshot.events.filter((event) => event.type === 'marker'),
    anomalies,
    unexplainedTimeIntervals: analysis.interactions.flatMap((row) =>
      row.unexplained.map((gap) => ({ interactionId: row.id, ...gap }))
    ),
    nativeLatencyStatistics: summarize(
      analysis.interactions.map((row) => row.nativeClickDurationMs).filter((v) => v != null)
    ),
    windowLatencyStatistics: summarize(
      analysis.interactions.map((row) => row.windowMs).filter((v) => v != null)
    ),
    xpCalcRegistry: snapshotXpCalcRegistry(),
    workSpanSummary: summarizeWorkSpans(),
    workSpans: (() => {
      const all = snapshotWorkSpans();
      const limit = 800;
      const truncated = all.length > limit;
      const slice = truncated ? all.slice(-limit) : all;
      return slice;
    })(),
    workSpansExport: (() => {
      const all = snapshotWorkSpans();
      const limit = 800;
      return {
        exported: Math.min(all.length, limit),
        available: all.length,
        truncated: all.length > limit,
        note: 'summary.byName couvre tous les spans en mémoire ; workSpans peut être tronqué aux N derniers.'
      };
    })(),
    cpuStackSampling: {
      ...snapshotStackSampler(),
      longTaskAttribution: summarizeStacksForLongTasks(during, 15),
      limitation:
        'setInterval ne s’exécute pas pendant un long task synchrone — les samples tombent dans les micro-gaps. Préférer CDP pour self/total time.'
    },
    summaryStatistics: {
      interactions: analysis.latency,
      distribution: analysis.distribution,
      reliabilityPolicy: {
        summaryMinSamples: LATENCY_SUMMARY_MIN_SAMPLES,
        p95ReliableSamples: LATENCY_P95_RELIABLE_SAMPLES,
        bandMetric:
          'max(nativeClickDurationMs, windowMs, inputDelayMs) — jamais legacyTotalMs ; bandMetricName = métrique réellement max'
      },
      longTaskDuringMs: round(during.reduce((sum, task) => sum + (task.dur || 0), 0)),
      longTaskBeforeMs: round(before.reduce((sum, task) => sum + (task.dur || 0), 0)),
      longTaskSumIsNotWallClock: true,
      fastest: [...fast]
        .sort((a, b) => (a.bandMetric || 0) - (b.bandMetric || 0))
        .slice(0, 8),
      slowest: [...analysis.interactions]
        .sort((a, b) => (b.bandMetric || 0) - (a.bandMetric || 0))
        .slice(0, 8)
    },
    instrumentationOverhead: {
      pushCount: analysis.snapshot.pushCount,
      pushMs: analysis.snapshot.pushMs,
      panelAnalyzeCount: analysis.snapshot.panelAnalyzeCount,
      panelAnalyzeMs: analysis.snapshot.panelAnalyzeMs,
      panelAnalyzeMaxMs: analysis.snapshot.panelAnalyzeMaxMs,
      lastPanelAnalyzeMs: analysis.snapshot.lastPanelAnalyzeMs,
      analysisDurationMs: analysis.analysisDurationMs,
      panel:
        'Collecte ≠ présentation. Compteurs lite en continu ; analyse complète uniquement à la demande / export / vue détaillée (plus de rebuild 2×/s).'
    },
    droppedEvents: analysis.snapshot.droppedEvents,
    measurementLimitations: [
      'Le rappel requestAnimationFrame n’est pas la preuve qu’un pixel a été présenté.',
      'Une page cachée retarde les frames et gonfle untilNextFrameCallbackMs.',
      'Les tâches longues buffered d’avant la capture sont séparées et ne sont pas additionnées au mur de la session.',
      'La somme des tâches longues n’est pas le temps écoulé : elles ne se recouvrent pas toujours, et l’observateur peut en voir plusieurs.',
      'StrictMode en développement double certains effets de montage, pas les gestionnaires de clic.',
      'performance.memory est un tas JS Chrome, pas la taille des séances.',
      'L’absence d’Event Timing laisse presentation à null, jamais à 0.',
      'reliable=true (médiane) ne signifie pas un P95 stable ; voir p95Reliable et reliabilityPolicy.',
      'La couverture par tâches longues est une intersection d’intervalles, pas une preuve de causalité.',
      'Les stacks CPU détaillées viennent du collecteur CDP optionnel (scripts/today/cdp-flight-collector.mjs).'
    ],
    schemaDocumentation: {
      interactionTimeline:
        'bandMetric = max(nativeClickDurationMs, windowMs, inputDelayMs). legacyTotalMs est archivé seulement pour comparer aux exports V1 et ne classe plus.',
      legacyTotalMs:
        'Ancienne somme trompeuse : du début du gestionnaire jusqu’au rappel de frame. Ne plus s’en servir pour la bande.',
      longTasks:
        't est entry.startTime. Une tâche est retenue si elle chevauche [inputAt, windowEnd], même si elle a commencé avant.',
      frameCallbackAt: 'Instant où le rappel rAF a tiré (fin d’attente), pas le début de la frame vsync.',
      previousSegmentEvents:
        'Événements des segments antérieurs de la campagne uniquement (segment courant exclu).'
    },
    compiledScriptAttribution: {
      'deps/chunk-WW4AH6NN.js': {
        packages: ['scheduler', 'react-dom'],
        sources: [
          'node_modules/scheduler/cjs/scheduler.development.js',
          'node_modules/react-dom/cjs/react-dom.development.js'
        ],
        note: 'Invoker event-listener = MessageChannel du scheduler React. Le self-time du chunk inclut le travail applicatif déclenché dans le flush.'
      },
      'deps/chunk-57EGHOTI.js': {
        packages: ['@react-three/fiber', 'react-reconciler', 'scheduler', 'zustand'],
        note: 'Présent si une scène R3F/anatomie est montée.'
      }
    },
    previousSegmentEvents: priorSegments.flatMap((row) =>
      (row.events || []).map((event) => ({
        ...event,
        __segmentKey: row.key,
        __segmentSavedAt: row.savedAt
      }))
    )
  };
}

if (DEV && typeof window !== 'undefined') {
  window.buildFlightExport = buildFlightExport;
  window.__MOMENTUM_TODAY_DIAG__ = {
    buildFlightExport,
    analyzeTodayDiag,
    snapshotTodayDiag,
    readDiagIsolationFlags
  };
}

if (DEV && readFlag()) {
  capturing = true;
  captureStartedAt = now();
  ensureCampaign();
  watchObservers();
  startLoops();
  push({
    type: 'note',
    category: 'startup',
    name: 'Module flight recorder chargé',
    t: now(),
    detail: { campaignId, segment, bootMs: 0 }
  });
}
