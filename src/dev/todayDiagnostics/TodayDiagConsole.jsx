import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  analyzeTodayDiag,
  buildFlightExport,
  isTodayDiagCapturing,
  isTodayDiagDev,
  markTodayStall,
  setFlightGraphicsProbe,
  setFlightLevel,
  startTodayDiagCapture,
  stopTodayDiagCapture,
  resetTodayDiag,
  snapshotTodayDiagLite
} from './todayDiag';

const VIEWS = [
  ['overview', 'Vue d’ensemble'],
  ['interactions', 'Interactions'],
  ['tasks', 'Tâches longues'],
  ['frames', 'Frames'],
  ['memory', 'Mémoire'],
  ['export', 'Export']
];

const VIEWS_NEEDING_FULL = new Set(['interactions', 'tasks', 'frames', 'memory']);

function stampName(date = new Date()) {
  const pad = (value) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}-${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
}

/**
 * P0.5 : collecte ≠ présentation.
 * - Compteurs lite (O(1)) rafraîchis à 1 Hz si le panneau est ouvert.
 * - Analyse complète uniquement : à l’ouverture, changement de vue détaillée,
 *   bouton « Actualiser », et export — plus de rebuild 2×/s du buffer entier.
 */
export default function TodayDiagConsole() {
  const [open, setOpen] = useState(false);
  const [compact, setCompact] = useState(true);
  const [liteTick, setLiteTick] = useState(0);
  const [view, setView] = useState('overview');
  const [selectedId, setSelectedId] = useState(null);
  const [kind, setKind] = useState('all');
  const [probe, setProbe] = useState({ blur: true, animation: true, shadow: true });
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const runFullAnalysis = useCallback(() => {
    setAnalyzing(true);
    try {
      const next = analyzeTodayDiag({ forPanel: true, cloneEvents: false });
      setAnalysis(next);
    } finally {
      setAnalyzing(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const timer = window.setInterval(() => setLiteTick((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setAnalysis(null);
      return;
    }
    runFullAnalysis();
  }, [open, runFullAnalysis]);

  useEffect(() => {
    if (!open) return;
    if (VIEWS_NEEDING_FULL.has(view)) runFullAnalysis();
  }, [view, open, runFullAnalysis]);

  if (!isTodayDiagDev()) return null;

  const lite = open ? snapshotTodayDiagLite() : null;
  // liteTick force le re-render 1 Hz pour les compteurs
  void liteTick;

  const download = async () => {
    const payload = await buildFlightExport();
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `momentum-today-performance-flight-recorder-v2-${stampName()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const interactions = analysis?.interactions || [];
  const visible = kind === 'all' ? interactions : interactions.filter((row) => row.kind === kind);
  const selected = visible.find((row) => row.id === selectedId) || visible[visible.length - 1] || null;
  const events = analysis?.snapshot.events || [];
  const longTasks = events.filter((event) => event.type === 'longtask' && event.scope === 'capture');
  const memory = events.filter((event) => event.type === 'memory' && event.used != null);
  const critical = interactions.filter((row) => row.band.id === 'critical' || row.band.id === 'blocked').length;
  const framesHeavy = events.filter((event) => event.type === 'frame' && event.dur >= 50);

  const panel = open ? (
    <aside style={panelStyle(compact)}>
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <strong>Flight Recorder V2</strong>
        <span>{isTodayDiagCapturing() ? 'Campagne en cours' : 'Arrêtée'}</span>
      </header>
      <p style={{ color: '#9a9a9a', margin: '6px 0 8px' }}>
        Collecte active sans analyse continue. Actualiser pour recalculer latences / associations.
        {lite?.lastPanelAnalyzeMs != null ? ` Dernière analyse : ${lite.lastPanelAnalyzeMs} ms.` : ''}
        {analyzing ? ' Analyse…' : ''}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        <button type="button" onClick={startTodayDiagCapture}>Lancer la campagne</button>
        <button type="button" onClick={stopTodayDiagCapture}>Arrêter</button>
        <button type="button" onClick={markTodayStall}>Marquer un ralentissement</button>
        <button
          type="button"
          onClick={() => {
            resetTodayDiag();
            setAnalysis(null);
            setLiteTick((value) => value + 1);
          }}
        >
          Réinitialiser
        </button>
        <button type="button" onClick={runFullAnalysis}>Actualiser l’analyse</button>
        <button type="button" onClick={download}>Exporter le dossier complet</button>
        <button type="button" onClick={() => setCompact((value) => !value)}>{compact ? 'Agrandir' : 'Réduire'}</button>
        <button
          type="button"
          onClick={() => {
            setFlightLevel(lite?.level === 'deep' ? 'standard' : 'deep');
            setLiteTick((value) => value + 1);
          }}
        >
          Niveau {lite?.level === 'deep' ? 'approfondi' : 'standard'}
        </button>
      </div>
      <div style={{ display: 'flex', gap: 6, margin: '8px 0', flexWrap: 'wrap' }}>
        {VIEWS.map(([id, label]) => (
          <button key={id} type="button" onClick={() => setView(id)} style={{ fontWeight: view === id ? 700 : 400 }}>{label}</button>
        ))}
      </div>
      {view === 'overview' && lite ? (
        <div style={gridStyle}>
          <span>Événements (buffer)</span><span>{lite.eventCount}</span>
          <span>Interactions (compteur)</span><span>{lite.counters.interactionStarts}</span>
          <span>Tâches longues (compteur)</span><span>{lite.counters.longTaskCapture}</span>
          <span>Événements perdus</span><span>{lite.droppedEvents}</span>
          <span>pushMs (insertion seule)</span><span>{lite.pushMs ?? '—'} ms</span>
          <span>Analyse panneau cumulée</span><span>{lite.panelAnalyzeMs ?? 0} ms × {lite.panelAnalyzeCount || 0}</span>
          <span>Analyse panneau max</span><span>{lite.panelAnalyzeMaxMs ?? '—'} ms</span>
          <span>Mémoire JS</span>
          <span>{lite.lastMemoryUsed != null ? `${Math.round(lite.lastMemoryUsed / 1048576)} Mo` : 'indisponible'}</span>
          <span>codeRevision</span><span>{lite.codeRevision}</span>
          {analysis ? (
            <>
              <span>Latence médiane (dernière analyse)</span>
              <span>{analysis.latency.median ?? 'indisponible'} ms</span>
              <span>95e percentile</span>
              <span>{analysis.latency.p95 ?? 'indisponible'} ms</span>
              <span>Critiques / blocages</span><span>{critical}</span>
            </>
          ) : null}
        </div>
      ) : null}
      {view === 'interactions' ? (
        <div>
          <select value={kind} onChange={(event) => setKind(event.target.value)}>
            <option value="all">Toutes</option>
            <option value="check">Coches</option>
            <option value="uncheck">Décoches</option>
            <option value="reps">Répétitions</option>
            <option value="weight">Charges</option>
            <option value="save">Enregistrements</option>
          </select>
          <div style={{ maxHeight: 140, overflow: 'auto', margin: '8px 0' }}>
            {visible.slice(-20).reverse().map((row) => (
              <button key={row.id} type="button" onClick={() => setSelectedId(row.id)} style={rowButton(selected?.id === row.id)}>
                {row.label} · traitement {row.processingMs ?? '—'} ms · frame {row.untilNextFrameCallbackMs ?? '—'} ms · {row.band.label}
              </button>
            ))}
          </div>
          {selected ? <InteractionDetail row={selected} /> : <p>Aucune interaction capturée.</p>}
        </div>
      ) : null}
      {view === 'tasks' ? (
        <ul>
          {longTasks.slice(-12).reverse().map((task) => (
            <li key={task.taskId}>{task.taskId} · {task.dur} ms · confiance {task.confidence} · service {task.service || 'inconnu'}{task.hidden ? ' · page cachée' : ''}</li>
          ))}
        </ul>
      ) : null}
      {view === 'frames' ? (
        <ul>
          {framesHeavy.slice(-12).reverse().map((frame) => (
            <li key={`${frame.t}`}>Intervalle {frame.dur} ms · ce n’est pas une présentation écran</li>
          ))}
        </ul>
      ) : null}
      {view === 'memory' ? (
        <ul>
          {memory.slice(-8).map((sample) => (
            <li key={sample.t}>{Math.round(sample.t)} ms · {Math.round(sample.used / 1048576)} Mo utilisés / {Math.round(sample.total / 1048576)} Mo tas</li>
          ))}
        </ul>
      ) : null}
      {view === 'export' ? (
        <div>
          <p>Un clic produit un JSON autonome, sans contenu de séance.</p>
          <button type="button" onClick={download}>Exporter le dossier complet de diagnostic</button>
          <div style={{ marginTop: 8 }}>
            <span>Essais graphiques réversibles, non enregistrés dans les préférences.</span>
            {['blur', 'animation', 'shadow'].map((key) => (
              <label key={key} style={{ display: 'block' }}>
                <input
                  type="checkbox"
                  checked={probe[key]}
                  onChange={(event) => {
                    const next = { ...probe, [key]: event.target.checked };
                    setProbe(next);
                    setFlightGraphicsProbe(next);
                  }}
                />
                {key === 'blur' ? 'Flou et filtres' : key === 'animation' ? 'Animations' : 'Ombres'}
              </label>
            ))}
          </div>
        </div>
      ) : null}
    </aside>
  ) : null;

  return createPortal(
    <>
      {panel}
      <button type="button" onClick={() => setOpen((value) => !value)} style={launcherStyle}>
        Diag Aujourd’hui
      </button>
    </>,
    document.body
  );
}

function InteractionDetail({ row }) {
  const rows = [
    ['Latence native click (Event Timing)', row.nativeClickDurationMs, row.qualities.nativeClick],
    ['Délai avant le gestionnaire', row.inputDelayMs, row.qualities.inputDelay],
    ['Traitement métier', row.processingMs, row.qualities.processing],
    ['Attente du rappel de frame', row.untilNextFrameCallbackMs, row.qualities.untilNextFrameCallback],
    ['Fenêtre totale', row.windowMs, 'inputAt → fin observée'],
    ['Couverture tâches longues', row.longTaskCoveredMs, row.qualities.longTaskCoverage],
    ['Temps inexpliqué', row.unexplainedMs, row.qualities.unexplained]
  ];
  return (
    <div style={{ background: '#1c1c1c', borderRadius: 8, padding: 10 }}>
      <strong>{row.label}</strong>
      <div style={{ color: '#e67e22' }}>
        {row.band.label}
        {row.bandMetric != null ? ` · ${row.bandMetric} ms (${row.bandMetricName})` : ''}
        {row.hiddenDuring ? ' · page cachée pendant l’intervalle' : ''}
      </div>
      <div style={{ color: '#888', marginBottom: 6 }}>
        Classification via {row.bandMetricName || 'mesure indisponible'} — jamais via legacyTotalMs
        ({row.legacyTotalMs ?? '—'} ms, archivé seulement).
      </div>
      {rows.map(([label, value, quality]) => (
        <div key={label} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
          <span>{label}<div style={{ color: '#777', fontSize: 11 }}>{quality}</div></span>
          <span>{value == null ? 'indisponible' : `${value} ms`}</span>
        </div>
      ))}
      {row.unexplained.map((gap) => (
        <div key={`${gap.start}-${gap.end}`} style={{ color: '#e67e22', marginTop: 4 }}>
          Trou {gap.ms} ms · {gap.meaning}
        </div>
      ))}
      <div>Tâches longues liées : {row.longTaskIds.length ? row.longTaskIds.join(', ') : 'aucune'}</div>
    </div>
  );
}

const launcherStyle = {
  position: 'fixed', right: 16, bottom: 16, zIndex: 80,
  background: '#111', color: '#eee', border: '1px solid #444', borderRadius: 999, padding: '8px 12px'
};

function panelStyle(compact) {
  return {
    position: 'fixed',
    right: 16,
    bottom: 64,
    width: compact ? 380 : 640,
    maxHeight: compact ? '52vh' : '86vh',
    overflow: 'auto',
    zIndex: 80,
    background: '#161616',
    color: '#eee',
    border: '1px solid #333',
    borderRadius: 12,
    padding: 14,
    font: '13px/1.4 Segoe UI, sans-serif'
  };
}

const gridStyle = { display: 'grid', gridTemplateColumns: '1fr auto', gap: 6, marginTop: 8 };
const rowButton = (active) => ({
  display: 'block', width: '100%', textAlign: 'left', marginBottom: 4,
  background: active ? '#2a2a2a' : 'transparent', color: '#eee', border: '1px solid #333', borderRadius: 6, padding: '4px 8px'
});
