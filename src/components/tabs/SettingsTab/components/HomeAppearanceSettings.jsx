import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import {
  Check,
  GripVertical,
  Home,
  Maximize2,
  Minimize2,
  RotateCcw,
  Save,
  X
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import { settingsTheme as S } from '../settingsThemeClasses';
import HomeLivePreview from '../../../home/HomeLivePreview';
import {
  applyHomeAppearanceDraft,
  applyHomePresetBuiltin,
  deleteHomeAppearancePreset,
  getHomeAppearanceStore,
  HOME_ACCENTS,
  HOME_METRIC_DEFS,
  HOME_NAV_LAYOUTS,
  HOME_NAV_STYLES,
  HOME_NAV_TAB_LABELS,
  HOME_WIDGET_DEFS,
  HOME_ZONE_LABELS,
  HOME_ZONES,
  loadHomeAppearancePreset,
  resetHomeAppearanceToStock,
  resolveHomeAccentHex,
  saveHomeAppearancePreset,
  stockHomeLayoutConfig,
  subscribeHomeAppearance,
  updateHomeAppearanceDraft
} from '../../../../utils/homeAppearancePreference';

function reorder(list, from, to) {
  const next = Array.from(list);
  const [removed] = next.splice(from, 1);
  next.splice(to, 0, removed);
  return next;
}

function SegButton({ selected, onClick, children, title }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
        selected
          ? 'border-white/40 bg-white/10 text-white'
          : 'border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
      }`}
    >
      {children}
    </button>
  );
}

const HomeAppearanceSettings = () => {
  const [store, setStore] = useState(getHomeAppearanceStore);
  const [presetName, setPresetName] = useState('');
  const [message, setMessage] = useState('');
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => subscribeHomeAppearance(setStore), []);

  useEffect(() => {
    if (!fullscreen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setFullscreen(false);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [fullscreen]);

  const draft = store.draft || stockHomeLayoutConfig();
  const isApplied = Boolean(store.active);
  const accent = resolveHomeAccentHex(draft);

  const flash = (text) => {
    setMessage(text);
    window.setTimeout(() => setMessage(''), 2800);
  };

  const patchDraft = (partial) => {
    updateHomeAppearanceDraft(partial);
  };

  const patchWidget = (id, partial) => {
    patchDraft({
      widgets: {
        ...draft.widgets,
        [id]: { ...draft.widgets[id], ...partial }
      }
    });
  };

  const onNavDragEnd = (result) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;
    patchDraft({
      navOrder: reorder(draft.navOrder, result.source.index, result.destination.index)
    });
  };

  const enabledWidgets = useMemo(
    () => HOME_WIDGET_DEFS.filter((d) => draft.widgets?.[d.id]?.enabled),
    [draft.widgets]
  );

  const sidebar = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-3 flex items-start justify-between gap-2 border-b border-white/10 pb-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Paramètres
          </p>
          <h3 className="text-base font-semibold text-white">Page d&apos;accueil</h3>
        </div>
        {fullscreen ? (
          <button
            type="button"
            onClick={() => setFullscreen(false)}
            className="rounded-lg border border-white/15 p-1.5 text-zinc-300 hover:bg-white/10"
            aria-label="Fermer le plein écran"
            title="Quitter le plein écran (Échap)"
          >
            <X size={16} />
          </button>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] ${
              isApplied
                ? 'border-emerald-400/40 bg-emerald-950/40 text-emerald-200'
                : 'border-white/15 text-zinc-400'
            }`}
          >
            {isApplied ? 'Config personnalisée active' : 'Modèle de base (accueil actuel)'}
          </span>
          {message ? <span className="text-xs text-teal-300">{message}</span> : null}
        </div>

        <section className="space-y-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Préréglages
          </h4>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'default', label: 'Par défaut' },
              { id: 'sportif', label: 'Sportif' },
              { id: 'minimal', label: 'Minimal' }
            ].map((p) => (
              <SegButton
                key={p.id}
                selected={false}
                onClick={() => {
                  applyHomePresetBuiltin(p.id);
                  flash(`Brouillon : ${p.label}`);
                }}
              >
                {p.label}
              </SegButton>
            ))}
          </div>
          <p className={`text-[11px] ${S.muted}`}>
            « Par défaut » = uniquement À propos de Momentum. Brouillon uniquement — rien
            n’est appliqué tant que tu ne valides pas.
          </p>
        </section>

        <section className="space-y-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Boutons de navigation
          </h4>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {HOME_NAV_STYLES.map((style) => (
              <SegButton
                key={style.id}
                title={style.hint}
                selected={draft.navStyle === style.id}
                onClick={() => patchDraft({ navStyle: style.id })}
              >
                {style.label}
              </SegButton>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {HOME_NAV_LAYOUTS.map((layout) => (
              <SegButton
                key={layout.id}
                title={layout.hint}
                selected={draft.navLayout === layout.id}
                onClick={() => patchDraft({ navLayout: layout.id })}
              >
                {layout.label}
              </SegButton>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Ordre des onglets
          </h4>
          <DragDropContext onDragEnd={onNavDragEnd}>
            <Droppable droppableId="home-nav-order">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`max-h-44 space-y-1 overflow-y-auto rounded-lg border border-white/10 bg-black/30 p-2 ${
                    snapshot.isDraggingOver ? 'border-violet-400/40' : ''
                  }`}
                >
                  {draft.navOrder.map((id, index) => (
                    <Draggable key={id} draggableId={id} index={index}>
                      {(dragProvided, dragSnapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs ${
                            dragSnapshot.isDragging
                              ? 'border-violet-400/50 bg-violet-950/40'
                              : 'border-white/10 text-zinc-200'
                          }`}
                        >
                          <button
                            type="button"
                            className="cursor-grab text-zinc-500 active:cursor-grabbing"
                            aria-label="Déplacer"
                            {...dragProvided.dragHandleProps}
                          >
                            <GripVertical size={14} />
                          </button>
                          <span className="flex-1">{HOME_NAV_TAB_LABELS[id] || id}</span>
                          <span className={`tabular-nums ${S.muted}`}>{index + 1}</span>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </section>

        <section className="space-y-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Accent
          </h4>
          <div className="flex flex-wrap gap-2">
            {HOME_ACCENTS.map((item) => {
              const selected = draft.accentId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => patchDraft({ accentId: item.id })}
                  className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] ${
                    selected
                      ? 'border-white/40 bg-white/10 text-white'
                      : 'border-white/10 text-zinc-400'
                  }`}
                >
                  <span
                    className="h-3.5 w-3.5 rounded-full border border-white/20"
                    style={{ background: item.hex }}
                  />
                  {item.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Bas droite — textes
          </h4>
          <p className={`text-[11px] ${S.muted}`}>
            Contrôle ce qui apparaît sous / à côté des widgets du bas droite.
          </p>
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-200">
            <span>Robot 3D</span>
            <input
              type="checkbox"
              checked={draft.showRobot !== false}
              onChange={(e) => patchDraft({ showRobot: e.target.checked })}
              className="rounded border-white/20"
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-200">
            <span>Mots-clés (Fitness, Progrès…)</span>
            <input
              type="checkbox"
              checked={draft.showKeywords !== false}
              onChange={(e) => patchDraft({ showKeywords: e.target.checked })}
              className="rounded border-white/20"
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-200">
            <span>Localisation</span>
            <input
              type="checkbox"
              checked={draft.showLocation !== false}
              onChange={(e) => patchDraft({ showLocation: e.target.checked })}
              className="rounded border-white/20"
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-200">
            <span>Sélecteur de langue (FR)</span>
            <input
              type="checkbox"
              checked={draft.showLanguage !== false}
              onChange={(e) => patchDraft({ showLanguage: e.target.checked })}
              className="rounded border-white/20"
            />
          </label>
        </section>

        <section className="space-y-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Infos chiffrées
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {HOME_METRIC_DEFS.map((m) => {
              const on = draft.metrics?.[m.id] !== false;
              return (
                <SegButton
                  key={m.id}
                  selected={on}
                  onClick={() =>
                    patchDraft({ metrics: { ...draft.metrics, [m.id]: !on } })
                  }
                >
                  {m.label}
                </SegButton>
              );
            })}
          </div>
        </section>

        <section className="space-y-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Options barre d&apos;XP
          </h4>
          {[
            { id: 'image', label: 'Image grade' },
            { id: 'total', label: 'XP total' },
            { id: 'percent', label: '% et palier' }
          ].map((opt) => (
            <label
              key={opt.id}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-200"
            >
              <span>{opt.label}</span>
              <input
                type="checkbox"
                checked={draft.xpOptions?.[opt.id] !== false}
                onChange={(e) =>
                  patchDraft({
                    xpOptions: { ...draft.xpOptions, [opt.id]: e.target.checked }
                  })
                }
                className="rounded border-white/20"
              />
            </label>
          ))}
        </section>

        <section className="space-y-2">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Widgets ({enabledWidgets.length})
          </h4>
          <p className={`text-[11px] ${S.muted}`}>
            Uniquement bas gauche / bas droite. Dans l’aperçu : zone ou « + » pour ajouter.
            Exercices + calendrier peuvent cohabiter en bas gauche.
          </p>
          <div className="space-y-2">
            {HOME_WIDGET_DEFS.map((def) => {
              const w = draft.widgets[def.id] || {};
              return (
                <div
                  key={def.id}
                  className="rounded-xl border border-white/10 bg-black/25 px-3 py-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm text-zinc-100">{def.title}</div>
                      <div className={`text-[11px] ${S.muted}`}>{def.description}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={w.enabled === true}
                      onChange={(e) => patchWidget(def.id, { enabled: e.target.checked })}
                      className="rounded border-white/20"
                    />
                  </div>
                  {w.enabled ? (
                    <div className="mt-2 space-y-2">
                      <div>
                        <p className={`mb-1 text-[10px] uppercase tracking-wider ${S.muted}`}>
                          Affichage
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {def.variants.map((v) => (
                            <SegButton
                              key={v.id}
                              selected={w.variant === v.id}
                              onClick={() => patchWidget(def.id, { variant: v.id })}
                            >
                              {v.label}
                            </SegButton>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className={`mb-1 text-[10px] uppercase tracking-wider ${S.muted}`}>
                          Emplacement
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {HOME_ZONES.map((z) => (
                            <SegButton
                              key={z}
                              selected={w.zone === z}
                              onClick={() => patchWidget(def.id, { zone: z })}
                            >
                              {HOME_ZONE_LABELS[z]}
                            </SegButton>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-3 border-t border-white/10 pt-3 pb-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`${S.btnPrimary} text-xs`}
              onClick={() => {
                applyHomeAppearanceDraft();
                flash('Appliqué à la page d’accueil');
              }}
            >
              <Check size={14} />
              Appliquer
            </button>
            <button
              type="button"
              className={`${S.btnSecondary} text-xs`}
              onClick={() => {
                resetHomeAppearanceToStock();
                flash('Retour au modèle de base');
              }}
            >
              <RotateCcw size={14} />
              Modèle de base
            </button>
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <label className={`text-xs ${S.muted}`}>
              Enregistrer pour plus tard
              <input
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Nom du preset"
                maxLength={48}
                className={`${S.input} mt-1 w-40`}
              />
            </label>
            <button
              type="button"
              className={`${S.btnSecondary} text-xs`}
              onClick={() => {
                saveHomeAppearancePreset(presetName);
                setPresetName('');
                flash('Preset enregistré (non appliqué)');
              }}
            >
              <Save size={14} />
              Enregistrer
            </button>
          </div>

          {store.savedPresets?.length ? (
            <div className="space-y-1.5">
              <p className={`text-xs ${S.muted}`}>Presets sauvegardés</p>
              {store.savedPresets.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs"
                >
                  <span className="min-w-0 flex-1 truncate text-zinc-200">{p.name}</span>
                  <button
                    type="button"
                    className="text-teal-300 hover:underline"
                    onClick={() => {
                      loadHomeAppearancePreset(p.id, { apply: false });
                      flash('Chargé dans le brouillon');
                    }}
                  >
                    Charger
                  </button>
                  <button
                    type="button"
                    className="text-emerald-300 hover:underline"
                    onClick={() => {
                      loadHomeAppearancePreset(p.id, { apply: true });
                      flash('Preset appliqué');
                    }}
                  >
                    Appliquer
                  </button>
                  <button
                    type="button"
                    className="text-red-300/90 hover:underline"
                    onClick={() => {
                      deleteHomeAppearancePreset(p.id);
                      flash('Preset supprimé');
                    }}
                  >
                    Supprimer
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );

  const renderPreviewPane = (mode) => (
    <div className="relative h-full min-h-0 flex-1 overflow-hidden rounded-xl border border-white/10">
      {mode === 'inline' ? (
        <div className="absolute right-2 top-2 z-20 flex gap-1.5">
          <button
            type="button"
            onClick={() => setFullscreen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-black/55 px-2.5 py-1.5 text-[11px] font-medium text-white backdrop-blur-md hover:bg-black/75"
          >
            <Maximize2 size={14} />
            Plein écran
          </button>
        </div>
      ) : null}
      <div className={mode === 'fullscreen' ? 'h-full' : 'h-[min(70vh,640px)]'}>
        <HomeLivePreview draft={draft} showZoneGuides editable />
      </div>
    </div>
  );

  const renderControlsAside = () => (
    <aside
      className="flex h-full min-h-0 w-full shrink-0 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0c0c14] p-3"
      style={{
        boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${accent} 18%, transparent)`
      }}
    >
      {sidebar}
    </aside>
  );

  return (
    <>
      <Card variant="settings">
        <CardHeader variant="settings">
          <CardTitle tone="settings" className="flex items-center normal-case tracking-normal">
            <Home className="mr-2 text-red-400" size={20} />
            Page d&apos;accueil — personnalisation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className={S.body}>
              Aperçu live de ta page d’accueil (À propos, bas droite, navigation, robot). Les fonds
              et les citations se règlent ailleurs — inchangés ici. Rien n’est appliqué tant que tu
              ne valides pas.
            </p>
            {!fullscreen ? (
              <div className="grid min-h-0 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
                {renderPreviewPane('inline')}
                <div className="min-h-0 lg:h-[min(70vh,640px)]">{renderControlsAside()}</div>
              </div>
            ) : (
              <p className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-zinc-400">
                Studio en plein écran — utilise « Quitter le plein écran » ou Échap pour revenir.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {fullscreen && typeof document !== 'undefined'
        ? createPortal(
            <div
              className="fixed inset-0 z-[9999] flex flex-col bg-[#07070b] text-zinc-100"
              role="dialog"
              aria-modal="true"
              aria-label="Personnalisation page d’accueil — plein écran"
            >
              <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-3 py-2.5 md:px-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    Paramètres · Apparence
                  </p>
                  <h2 className="truncate text-sm font-semibold text-white">
                    Page d&apos;accueil — aperçu live
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setFullscreen(false)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-zinc-100 hover:bg-white/10"
                >
                  <Minimize2 size={14} />
                  Quitter le plein écran
                </button>
              </header>
              <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(300px,360px)]">
                <div className="min-h-[50vh] min-w-0 p-2 md:min-h-0 md:p-3">
                  {renderPreviewPane('fullscreen')}
                </div>
                <div className="flex min-h-0 flex-col border-t border-white/10 md:border-l md:border-t-0">
                  <div className="min-h-0 flex-1 overflow-hidden p-2 md:p-3">
                    {renderControlsAside()}
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
};

export default HomeAppearanceSettings;
