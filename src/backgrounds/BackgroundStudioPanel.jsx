import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, Pause, Play, RotateCcw, Undo2, X } from 'lucide-react';
import { baseNameTaken, getBackgroundOption } from './backgroundRegistry';
import { defaultParams, normalizeParams, studioFor } from './backgroundStudio';
import { createVariant, updateVariant, variantNameTaken } from './backgroundVariants';

function FieldControl({ field, value, onChange }) {
  if (field.type === 'toggle') {
    const on = value !== false;
    return (
      <div className="flex items-center justify-between gap-3 py-1.5">
        <span className="text-xs text-zinc-300">{field.label}</span>
        <span className="flex overflow-hidden rounded-md border border-white/15 text-[11px]">
          <button
            type="button"
            aria-pressed={on}
            onClick={() => onChange(field.key, true)}
            className={`px-3 py-1 ${on ? 'bg-white text-black' : 'text-zinc-300'}`}
          >
            Oui
          </button>
          <button
            type="button"
            aria-pressed={!on}
            onClick={() => onChange(field.key, false)}
            className={`px-3 py-1 ${on ? 'text-zinc-300' : 'bg-white text-black'}`}
          >
            Non
          </button>
        </span>
      </div>
    );
  }

  if (field.type === 'select') {
    return (
      <label className="flex items-center justify-between gap-3 py-1.5">
        <span className="text-xs text-zinc-300">{field.label}</span>
        <select
          aria-label={field.label}
          value={value}
          onChange={(event) => onChange(field.key, event.target.value)}
          className="rounded-md border border-white/15 bg-zinc-900 px-2 py-1 text-xs text-zinc-100"
        >
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
    );
  }

  if (field.type === 'color') {
    return (
      <label className="flex items-center justify-between gap-3 py-1.5">
        <span className="text-xs text-zinc-300">{field.label}</span>
        <span className="flex items-center gap-2">
          <input
            type="color"
            aria-label={field.label}
            value={value}
            onChange={(event) => onChange(field.key, event.target.value)}
            className="h-7 w-7 cursor-pointer rounded border border-white/15 bg-transparent"
          />
          <span className="w-16 text-right font-mono text-[11px] uppercase text-zinc-400">{value}</span>
        </span>
      </label>
    );
  }

  return (
    <label className="block py-1.5">
      <span className="mb-1 flex items-center justify-between text-xs text-zinc-300">
        <span>{field.label}</span>
        <span className="font-mono text-[11px] text-zinc-100">{value}</span>
      </span>
      <input
        type="range"
        aria-label={field.label}
        min={field.min}
        max={field.max}
        step={field.step}
        value={value}
        onChange={(event) => onChange(field.key, Number(event.target.value))}
        className="w-full accent-sky-400"
      />
    </label>
  );
}

export default function BackgroundStudio({
  baseId,
  initialParams,
  variantId = null,
  initialName = '',
  onClose,
  onSaved
}) {
  const studio = studioFor(baseId);
  const option = getBackgroundOption(baseId);
  const Active = useMemo(() => (option.load ? lazy(option.load) : null), [option]);
  const stageRef = useRef(null);
  const editingExisting = Boolean(variantId && String(variantId).startsWith('variant-'));
  const [params, setParams] = useState(() => normalizeParams(baseId, initialParams) || defaultParams(baseId));
  const [paused, setPaused] = useState(false);
  const [epoch, setEpoch] = useState(0);
  const [openGroups, setOpenGroups] = useState(() => new Set());
  const [name, setName] = useState(() => (editingExisting ? String(initialName || '') : ''));
  const [error, setError] = useState('');
  const [full, setFull] = useState(false);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    const onFull = () => setFull(document.fullscreenElement === stageRef.current);
    window.addEventListener('keydown', onKey);
    document.addEventListener('fullscreenchange', onFull);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onFull);
    };
  }, [onClose]);

  if (!studio || !Active || !params) return null;

  const change = (key, value) => {
    setParams((current) => normalizeParams(baseId, { ...current, [key]: value }));
  };

  const toggleGroup = (id) => {
    setOpenGroups((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const restart = () => {
    setPaused(false);
    setEpoch((value) => value + 1);
  };

  const reset = () => {
    setParams(defaultParams(baseId));
    setPaused(false);
    setEpoch((value) => value + 1);
  };

  const toggleFull = () => {
    const node = stageRef.current;
    if (!node) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else node.requestFullscreen?.();
  };

  const save = () => {
    const nextParams = normalizeParams(baseId, params);
    if (editingExisting) {
      const entry = updateVariant(variantId, { params: nextParams });
      if (!entry) {
        setError('Mise à jour impossible.');
        return;
      }
      onSaved?.(entry);
      return;
    }
    const label = name.trim();
    if (!label) {
      setError('Indique un nom pour ce fond.');
      return;
    }
    if (baseNameTaken(label) || variantNameTaken(label)) {
      setError('Ce nom est déjà utilisé. Le fond d’origine n’est pas modifié.');
      return;
    }
    const entry = createVariant({
      name: label,
      baseId,
      params: nextParams
    });
    if (!entry) {
      setError('Enregistrement impossible.');
      return;
    }
    onSaved?.(entry);
  };

  return createPortal(
    <div className="fixed inset-0 z-[80] flex flex-col bg-[#0c0c0e] text-zinc-100" role="dialog" aria-modal="true" aria-label={studio.title}>
      <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <h2 className="text-sm font-semibold tracking-wide">{studio.title}</h2>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center gap-1 rounded-full border border-white/15 px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/10"
        >
          <X size={14} />
          Fermer
        </button>
      </header>
      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-h-0 flex-1 flex-col p-4">
          <div ref={stageRef} className="relative min-h-[280px] flex-1 overflow-hidden rounded-xl bg-black">
            <Suspense fallback={null}>
              <Active params={params} paused={paused} epoch={epoch} />
            </Suspense>
            <div className="absolute left-3 top-3 z-10 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-2">
              <button type="button" onClick={toggleFull} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/70 px-3 py-1.5 text-xs hover:bg-black/80">
                <Maximize2 size={14} />
                {full ? 'Quitter le plein écran' : 'Plein écran'}
              </button>
              <button type="button" onClick={() => setPaused((value) => !value)} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/70 px-3 py-1.5 text-xs hover:bg-black/80">
                {paused ? <Play size={14} /> : <Pause size={14} />}
                {paused ? 'Reprendre' : 'Pause'}
              </button>
              <button type="button" onClick={restart} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/70 px-3 py-1.5 text-xs hover:bg-black/80">
                <RotateCcw size={14} />
                Recommencer
              </button>
              <button type="button" onClick={reset} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/70 px-3 py-1.5 text-xs hover:bg-black/80">
                <Undo2 size={14} />
                État d’origine
              </button>
            </div>
          </div>
        </div>
        <aside className="flex min-h-0 flex-col border-t border-white/10 bg-[#161618] md:border-l md:border-t-0">
          <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-4 py-3">
            {studio.fields.map((field) => (
              <FieldControl key={field.key} field={field} value={params[field.key]} onChange={change} />
            ))}
            {studio.groups.map((group) => {
              const open = openGroups.has(group.id);
              return (
                <div key={group.id} className="border-t border-white/10 pt-2">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className="flex w-full items-center justify-between py-2 text-left text-xs text-zinc-200"
                  >
                    <span>{group.label}</span>
                    <span className="rounded-md bg-sky-500/20 px-2 py-1 text-[11px] text-sky-200">
                      {open ? 'Fermer' : 'Modifier'}
                    </span>
                  </button>
                  {open && group.fields.map((field) => (
                    <FieldControl key={field.key} field={field} value={params[field.key]} onChange={change} />
                  ))}
                </div>
              );
            })}
          </div>
          <div className="space-y-2 border-t border-white/10 p-4">
            {editingExisting ? (
              <p className="text-xs text-zinc-400">
                Tu modifies <span className="text-zinc-100">{name || 'ta copie'}</span>. Enregistrer met à jour
                cette version — sans en créer une nouvelle.
              </p>
            ) : (
              <label className="block text-xs text-zinc-300">
                Nom du nouveau fond
                <input
                  value={name}
                  maxLength={40}
                  onChange={(event) => {
                    setName(event.target.value);
                    setError('');
                  }}
                  placeholder="Ex. Disque bleu nuit"
                  className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-zinc-50 outline-none focus:border-white/30"
                />
              </label>
            )}
            {error ? <p className="text-xs text-red-300">{error}</p> : null}
            <button type="button" onClick={save} className="w-full rounded-lg bg-white px-3 py-2 text-sm font-medium text-black">
              {editingExisting ? 'Enregistrer les modifications' : 'Enregistrer'}
            </button>
            <p className="text-[11px] leading-relaxed text-zinc-500">
              {editingExisting
                ? 'Le fond d’origine reste intact. Seule ta copie est mise à jour.'
                : 'Le fond d’origine reste intact. L’enregistrement crée un fond distinct.'}
            </p>
          </div>
        </aside>
      </div>
    </div>,
    document.body
  );
}
