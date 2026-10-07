import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  Focus,
  Info,
  Layers,
  Maximize2,
  Minimize2,
  Pause,
  RotateCcw,
  RotateCw,
  Search,
  X,
} from 'lucide-react';
import AnatomyAtlasScene from './AnatomyAtlasScene.jsx';
import { DEFAULT_VISIBLE, SYSTEMS, EXPLANATIONS, explanation } from './anatomy.js';
import './anatomyAtlas.css';

const ATLAS_URL = '/human-atlas/models/atlas.json';
const ATTRIBUTION_URL = '/human-atlas/ATTRIBUTION.md';

const initialState = {
  explode: 0,
  visible: DEFAULT_VISIBLE,
  selected: [],
  isolate: false,
  view: 'three-quarter',
  rotate: false,
  reset: 0,
  inspectorOpen: false,
};

function getFullscreenElement() {
  return (
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.msFullscreenElement ||
    null
  );
}

async function requestElementFullscreen(el) {
  if (!el) return;
  if (el.requestFullscreen) return el.requestFullscreen();
  if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
  if (el.msRequestFullscreen) return el.msRequestFullscreen();
  throw new Error('Plein écran non supporté par ce navigateur.');
}

async function exitDocumentFullscreen() {
  if (document.exitFullscreen) return document.exitFullscreen();
  if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
  if (document.msExitFullscreen) return document.msExitFullscreen();
}

export default function AnatomyAtlasView() {
  const embedRef = useRef(null);
  const [atlas, setAtlas] = useState(null);
  const [state, setState] = useState(initialState);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [panel, setPanel] = useState(null);
  const [details, setDetails] = useState(false);
  const [about, setAbout] = useState(false);
  const [query, setQuery] = useState('');
  const [chosen, setChosen] = useState(null);
  /** Remonte le canvas WebGL sans recharger toute la page. */
  const [sceneKey, setSceneKey] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const abort = new AbortController();
    setProgress(0);
    setError('');
    setAtlas(null);
    fetch(ATLAS_URL, { signal: abort.signal })
      .then((r) => {
        if (!r.ok) throw new Error('Catalogue anatomique introuvable.');
        return r.json();
      })
      .then((data) => setAtlas(data))
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message || 'Chargement impossible.');
      });
    return () => abort.abort();
  }, []);

  const reloadScene = () => {
    setError('');
    setProgress(0);
    setSceneKey((k) => k + 1);
  };

  useEffect(() => {
    const syncFs = () => {
      const el = embedRef.current;
      setIsFullscreen(!!el && getFullscreenElement() === el);
    };
    document.addEventListener('fullscreenchange', syncFs);
    document.addEventListener('webkitfullscreenchange', syncFs);
    return () => {
      document.removeEventListener('fullscreenchange', syncFs);
      document.removeEventListener('webkitfullscreenchange', syncFs);
    };
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = embedRef.current;
    if (!el) return;
    try {
      if (getFullscreenElement() === el) {
        await exitDocumentFullscreen();
      } else {
        await requestElementFullscreen(el);
      }
    } catch (e) {
      setError(e?.message || 'Impossible d’activer le plein écran.');
    }
  }, []);

  const parts = useMemo(() => new Map((atlas?.parts || []).map((p) => [p.id, p])), [atlas]);
  const counts = useMemo(
    () => Object.fromEntries(SYSTEMS.map((s) => [s.id, atlas?.parts.filter((p) => p.system === s.id).length ?? 0])),
    [atlas]
  );
  const activeSystems = SYSTEMS.filter((s) => counts[s.id] > 0);
  const selectedParts = state.selected.map((id) => parts.get(id)).filter(Boolean);
  const selected = selectedParts[0];
  const system = SYSTEMS.find((s) => s.id === selected?.system);
  const visibleCount =
    atlas?.parts.filter((p) =>
      state.isolate ? state.selected.includes(p.id) : state.visible.includes(p.system) || state.selected.includes(p.id)
    ).length ?? 0;

  const results = useMemo(() => {
    if (!atlas) return [];
    const term = query.toLowerCase().trim();
    if (!term) {
      return ['heart', 'brain', 'liver', 'stomach', 'spleen', 'pancreas', 'urinary bladder', 'trachea']
        .map((name) => atlas.concepts.find((c) => c.name.toLowerCase() === name))
        .filter(Boolean);
    }
    return atlas.concepts
      .filter((c) => c.name.toLowerCase().includes(term) || c.id.toLowerCase().includes(term))
      .sort((a, b) => a.name.length - b.name.length)
      .slice(0, 60);
  }, [atlas, query]);

  const choose = (c) => {
    setChosen(c);
    setState((s) => ({ ...s, selected: c.elements, isolate: false, rotate: false }));
    setDetails(true);
    setPanel(null);
  };

  const choosePart = (id) => {
    const p = parts.get(id);
    if (!p) return;
    setChosen({ id: p.conceptId, name: p.name, elements: [id] });
    setState((s) => ({ ...s, selected: [id], isolate: false, rotate: false }));
    setDetails(true);
    setPanel(null);
  };

  const toggle = (id) => {
    setDetails(false);
    setState((s) => ({
      ...s,
      selected: [],
      isolate: false,
      visible: s.visible.includes(id) ? s.visible.filter((x) => x !== id) : [...s.visible, id],
    }));
  };

  const reset = () => {
    setState((s) => ({ ...initialState, visible: DEFAULT_VISIBLE, reset: s.reset + 1 }));
    setChosen(null);
    setDetails(false);
    setPanel(null);
  };

  const sceneState = { ...state, inspectorOpen: details && selectedParts.length > 0 };

  return (
    <div
      ref={embedRef}
      className={`human-atlas-embed${isFullscreen ? ' is-fullscreen' : ''}`}
      data-atlas-embed
    >
      <div className="studio">
        {atlas ? (
          <AnatomyAtlasScene
            key={sceneKey}
            atlas={atlas}
            state={sceneState}
            onSelect={choosePart}
            onProgress={(n) => {
              setProgress(n);
              if (n === 100) setError('');
            }}
            onError={setError}
          />
        ) : null}
        <div className="vignette" />

        <header className="identity">
          <div className="eyebrow">
            <span className="status-dot" /> INTERACTIVE ANATOMY
          </div>
          <h1>
            Human Atlas <span className="edition">3D</span>
          </h1>
          <div className="identity-meta">
            {(atlas?.parts.length || 2234).toLocaleString()} pieces · BodyParts3D
          </div>
        </header>

        <nav className="top-actions" aria-label="Atlas panels">
          <button
            type="button"
            className={panel === 'search' ? 'active' : ''}
            onClick={() => {
              setDetails(false);
              setPanel((p) => (p === 'search' ? null : 'search'));
            }}
            aria-label="Search"
          >
            <Search size={16} />
            <span className="hidden sm:inline">Find</span>
          </button>
          <button
            type="button"
            className={`icon-button${isFullscreen ? ' active' : ''}`}
            aria-label={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
            title={isFullscreen ? 'Quitter le plein écran (Échap)' : 'Plein écran'}
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label="About"
            onClick={() => {
              setDetails(false);
              setPanel(null);
              setAbout(true);
            }}
          >
            <Info size={16} />
          </button>
        </nav>

        <section className={`layers-panel glass ${panel === 'layers' ? 'mobile-open' : ''}`} aria-label="Systems">
          <div className="panel-heading">
            <span>Systems</span>
            <button type="button" className="mobile-only icon-button" onClick={() => setPanel(null)} aria-label="Close">
              <X size={16} />
            </button>
          </div>
          <div className="layer-presets">
            <button
              type="button"
              aria-pressed={activeSystems.every((x) => state.visible.includes(x.id))}
              onClick={() =>
                setState((s) => ({
                  ...s,
                  selected: [],
                  isolate: false,
                  visible: activeSystems.map((x) => x.id),
                }))
              }
            >
              All
            </button>
            <button
              type="button"
              aria-pressed={state.visible.length === 1 && state.visible[0] === 'skeletal'}
              onClick={() => setState((s) => ({ ...s, selected: [], isolate: false, visible: ['skeletal'] }))}
            >
              Skeleton
            </button>
            <button
              type="button"
              aria-pressed={
                state.visible.length === 6 &&
                ['cardiac', 'respiratory', 'digestive', 'urinary', 'endocrine', 'reproductive'].every((id) =>
                  state.visible.includes(id)
                )
              }
              onClick={() =>
                setState((s) => ({
                  ...s,
                  selected: [],
                  isolate: false,
                  visible: ['cardiac', 'respiratory', 'digestive', 'urinary', 'endocrine', 'reproductive'],
                }))
              }
            >
              Organs
            </button>
          </div>
          <div className="system-list">
            {activeSystems.map((s) => (
              <div className={`system-row ${state.visible.includes(s.id) ? 'enabled' : ''}`} key={s.id}>
                <button
                  type="button"
                  className="system-name"
                  onClick={() => setState((v) => ({ ...v, visible: [s.id], isolate: false, selected: [] }))}
                >
                  <span className="system-dot" style={{ background: s.color }} />
                  {s.name}
                  <span className="system-count">{counts[s.id]}</span>
                </button>
                <button
                  type="button"
                  className={`ha-switch ${state.visible.includes(s.id) ? 'on' : ''}`}
                  aria-label={`Show ${s.name}`}
                  onClick={() => toggle(s.id)}
                >
                  <i />
                </button>
              </div>
            ))}
          </div>
          <div className="panel-foot">
            <span>{visibleCount.toLocaleString()} visible</span>
            <button type="button" onClick={() => setState((s) => ({ ...s, visible: [], selected: [], isolate: false }))}>
              Hide all
            </button>
          </div>
        </section>

        {panel === 'search' ? (
          <section className="search-panel glass" aria-label="Search">
            <div className="panel-heading">
              <span>Find a structure</span>
              <button type="button" className="icon-button" onClick={() => setPanel(null)} aria-label="Close">
                <X size={16} />
              </button>
            </div>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Heart, femur, cranial nerve…"
              aria-label="Search anatomy"
            />
            <div className="search-results">
              {results.map((c) => (
                <button type="button" key={c.id} onClick={() => choose(c)}>
                  <span>{c.name}</span>
                  <span className="system-count">{c.elements.length}</span>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <nav className="view-controls glass" aria-label="Camera">
          {(['three-quarter', 'front', 'side', 'back']).map((v, i) => (
            <button
              type="button"
              key={v}
              className={state.view === v ? 'active' : ''}
              disabled={state.explode > 0.8 && v !== 'front'}
              onClick={() => setState((s) => ({ ...s, view: v, reset: s.reset + 1, rotate: false }))}
              aria-label={`${v} view`}
            >
              <span>{['¾', 'F', 'S', 'B'][i]}</span>
            </button>
          ))}
          <i />
          <button
            type="button"
            disabled={state.explode >= 0.4}
            className={state.rotate ? 'active' : ''}
            onClick={() => setState((s) => ({ ...s, rotate: !s.rotate }))}
            aria-label="Rotate"
          >
            {state.rotate ? <Pause size={16} /> : <RotateCw size={16} />}
          </button>
          <button type="button" onClick={reset} aria-label="Reset">
            <RotateCcw size={16} />
          </button>
        </nav>

        <div className="scene-caption">
          <span className="caption-line" />
          <span>
            {state.isolate
              ? chosen?.name ?? 'SELECTED'
              : state.explode > 0.95
                ? 'INVENTORY'
                : state.explode > 0.05
                  ? 'SEPARATED'
                  : 'ADULT HUMAN · MALE'}
          </span>
          <span className="caption-line" />
        </div>

        <div className="bottom-dock glass">
          <button
            type="button"
            className="mobile-only dock-layers"
            onClick={() => {
              setDetails(false);
              setPanel((p) => (p === 'layers' ? null : 'layers'));
            }}
            aria-label="Systems"
          >
            <Layers size={18} />
            <span>Systems</span>
          </button>
          <div className="explode-control">
            <div className="explode-label">
              <label htmlFor="ha-explode">Explode</label>
              <output>{Math.round(state.explode * 100)}%</output>
            </div>
            <input
              id="ha-explode"
              className="ha-slider"
              type="range"
              min={0}
              max={100}
              step={1}
              value={Math.round(state.explode * 100)}
              onChange={(e) => {
                const v = Number(e.target.value) / 100;
                setState((s) => ({
                  ...s,
                  explode: v,
                  view: v > 0.8 ? 'front' : s.view,
                  rotate: false,
                }));
              }}
            />
            <div className="slider-endpoints">
              <span>Assembled</span>
              <span>Every piece</span>
            </div>
          </div>
          <button type="button" className="dock-reset" onClick={reset}>
            <RotateCcw size={16} />
            <span>Reset</span>
          </button>
        </div>

        <p className="credit">
          BodyParts3D · CC BY 4.0 ·{' '}
          <a href={ATTRIBUTION_URL} target="_blank" rel="noreferrer">
            Attribution
          </a>
        </p>

        {progress < 100 && !error ? (
          <div className="loading glass" role="status">
            <Activity size={18} />
            <div>
              <strong>Preparing the anatomy</strong>
              <span>
                {progress}% · {(atlas?.parts.length || 2234).toLocaleString()} pieces
              </span>
              <div className="loading-track">
                <i style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="error-box glass" role="alert">
            <div>
              <p>{error}</p>
              <button type="button" className="primary-action" onClick={reloadScene}>
                Relancer l’atlas
              </button>
            </div>
          </div>
        ) : null}

        {details && selectedParts.length > 0 ? (
          <aside className={`detail-sheet glass ${state.isolate ? 'is-isolated' : ''}`}>
            <button type="button" className="detail-close" onClick={() => setDetails(false)} aria-label="Close">
              <X size={16} />
            </button>
            <div className="detail-header">
              <div className="detail-accent" style={{ background: system?.color }} />
              <div className="eyebrow">{system?.name ?? 'ANATOMY'}</div>
              <h2 className="structure-title">{chosen?.name}</h2>
            </div>
            <div className="detail-scroll">
              <p>{chosen && selected ? explanation(chosen.name, selected.system) : ''}</p>
              {chosen && !EXPLANATIONS[chosen.name.toLowerCase()] ? (
                <span style={{ fontSize: 11, color: '#87929d' }}>
                  System overview · structure identified from source anatomy
                </span>
              ) : null}
              <div className="structure-meta">
                <span>
                  Atlas reference
                  <strong>{chosen?.id}</strong>
                </span>
                <span>
                  Selected pieces
                  <strong>{state.selected.length.toLocaleString()}</strong>
                </span>
              </div>
              <a className="secondary-action" href="https://lifesciencedb.jp/bp3d/" target="_blank" rel="noreferrer">
                Anatomical source ↗
              </a>
            </div>
            <div className="detail-actions">
              <button
                type="button"
                className={`primary-action ${state.isolate ? 'active' : ''}`}
                onClick={() => setState((s) => ({ ...s, isolate: !s.isolate, explode: 0 }))}
              >
                <Focus size={16} />
                {state.isolate ? 'Show surrounding' : 'Isolate structure'}
              </button>
              <button
                type="button"
                className="secondary-action"
                onClick={() => {
                  setState((s) => ({ ...s, selected: [], isolate: false }));
                  setDetails(false);
                }}
              >
                Clear selection
              </button>
            </div>
          </aside>
        ) : null}

        {about ? (
          <aside className="about-sheet glass">
            <button type="button" className="detail-close" onClick={() => setAbout(false)} aria-label="Close">
              <X size={16} />
            </button>
            <div className="eyebrow">SOURCE & SCOPE</div>
            <h2 className="structure-title">A body, revealed.</h2>
            <div className="about-copy">
              <p>
                <strong>Male · BodyParts3D</strong>
                <br />
                2,234 individual meshes and 3,432 named concepts from an adult male reference anatomy.
              </p>
              <p>
                Educational explorer only — not a diagnostic or surgical tool. Geometry simplified for the web.
              </p>
              <p>BodyParts3D © Database Center for Life Science — CC BY 4.0.</p>
              <a href={ATTRIBUTION_URL} target="_blank" rel="noreferrer">
                Full attribution
              </a>
              <a href="https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html" target="_blank" rel="noreferrer">
                Dataset license
              </a>
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
