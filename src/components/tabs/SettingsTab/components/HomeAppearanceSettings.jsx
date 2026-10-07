import React, { useEffect, useMemo, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, Home, RotateCcw, Save, Check } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import { settingsTheme as S } from '../settingsThemeClasses';
import NavigationHeader from '../../../ui/NavigationHeader';
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

const HomeAppearanceSettings = () => {
  const [store, setStore] = useState(getHomeAppearanceStore);
  const [presetName, setPresetName] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => subscribeHomeAppearance(setStore), []);

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

  return (
    <Card variant="settings">
      <CardHeader variant="settings">
        <CardTitle tone="settings" className="flex items-center normal-case tracking-normal">
          <Home className="mr-2 text-red-400" size={20} />
          Page d&apos;accueil — personnalisation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <p className={S.body}>
            Personnalise la navigation, le robot et les widgets. Le modèle actuel reste en place tant
            que tu n’appliques pas une config. Les fonds et les citations se règlent ailleurs —
            inchangés ici.
          </p>

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

          {/* Préréglages */}
          <section className="space-y-2">
            <h4 className="text-sm font-medium text-zinc-100">Préréglages (brouillon uniquement)</h4>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`${S.btnSecondary} text-xs`}
                onClick={() => {
                  applyHomePresetBuiltin('default');
                  flash('Brouillon : Par défaut');
                }}
              >
                Par défaut
              </button>
              <button
                type="button"
                className={`${S.btnSecondary} text-xs`}
                onClick={() => {
                  applyHomePresetBuiltin('sportif');
                  flash('Brouillon : Sportif');
                }}
              >
                Sportif
              </button>
              <button
                type="button"
                className={`${S.btnSecondary} text-xs`}
                onClick={() => {
                  applyHomePresetBuiltin('minimal');
                  flash('Brouillon : Minimal');
                }}
              >
                Minimal
              </button>
            </div>
          </section>

          {/* Aperçu live */}
          <section className="space-y-2">
            <h4 className="text-sm font-medium text-zinc-100">Aperçu live</h4>
            <div
              className="relative overflow-hidden rounded-xl border border-white/10"
              style={{
                background:
                  'radial-gradient(ellipse at 40% 30%, color-mix(in srgb, var(--preview-ac) 28%, #07070b), #07070b 70%)',
                '--preview-ac': accent
              }}
            >
              <div className="pointer-events-none scale-[0.72] origin-top-left w-[139%] pb-2">
                <NavigationHeader previewConfig={draft} activeTabOverride="home" />
              </div>
              <div className="grid grid-cols-3 gap-2 px-3 pb-3 pt-1 min-h-[140px]">
                {['left', 'bottomLeft', 'bottomRight'].map((zone) => {
                  const inZone = enabledWidgets.filter((d) => draft.widgets[d.id]?.zone === zone);
                  return (
                    <div
                      key={zone}
                      className={`rounded-lg border border-dashed px-2 py-2 ${
                        zone === 'left' ? 'col-span-1 min-h-[120px]' : 'col-span-1 min-h-[80px]'
                      }`}
                      style={{
                        borderColor: `color-mix(in srgb, ${accent} 45%, transparent)`,
                        background: 'rgba(0,0,0,0.25)'
                      }}
                    >
                      <div className="mb-1 text-[9px] uppercase tracking-wider text-zinc-500">
                        {HOME_ZONE_LABELS[zone]}
                      </div>
                      {inZone.length === 0 ? (
                        <div className="text-[10px] text-zinc-600">Vide</div>
                      ) : (
                        inZone.map((d) => (
                          <div
                            key={d.id}
                            className="mb-1 rounded border border-white/10 bg-black/40 px-1.5 py-1 text-[10px] text-zinc-200"
                          >
                            {d.title}
                            <span className="ml-1 text-zinc-500">
                              ({draft.widgets[d.id]?.variant})
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="absolute bottom-3 right-4 text-[10px] text-zinc-500">
                {draft.showRobot ? 'Robot : oui' : 'Robot : non'}
              </div>
            </div>
          </section>

          {/* Style nav */}
          <section className="space-y-2">
            <h4 className="text-sm font-medium text-zinc-100">Style des onglets</h4>
            <div className="flex flex-wrap gap-2">
              {HOME_NAV_STYLES.map((style) => {
                const selected = draft.navStyle === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    title={style.hint}
                    onClick={() => patchDraft({ navStyle: style.id })}
                    className={`rounded-lg border px-2.5 py-1.5 text-xs ${
                      selected
                        ? 'border-white/40 bg-white/10 text-white'
                        : 'border-white/10 text-zinc-400'
                    }`}
                  >
                    {style.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-medium text-zinc-100">Disposition des onglets</h4>
            <div className="flex flex-wrap gap-2">
              {HOME_NAV_LAYOUTS.map((layout) => {
                const selected = draft.navLayout === layout.id;
                return (
                  <button
                    key={layout.id}
                    type="button"
                    title={layout.hint}
                    onClick={() => patchDraft({ navLayout: layout.id })}
                    className={`rounded-lg border px-2.5 py-1.5 text-xs ${
                      selected
                        ? 'border-white/40 bg-white/10 text-white'
                        : 'border-white/10 text-zinc-400'
                    }`}
                  >
                    {layout.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-medium text-zinc-100">Ordre des onglets</h4>
            <p className={`text-xs ${S.muted}`}>Glisse pour réordonner. Aperçu mis à jour en direct.</p>
            <DragDropContext onDragEnd={onNavDragEnd}>
              <Droppable droppableId="home-nav-order">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`max-h-56 space-y-1 overflow-y-auto rounded-lg border border-white/10 bg-black/30 p-2 ${
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
            <h4 className="text-sm font-medium text-zinc-100">Accent (navigation / widgets)</h4>
            <div className="flex flex-wrap gap-2">
              {HOME_ACCENTS.map((item) => {
                const selected = draft.accentId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => patchDraft({ accentId: item.id })}
                    className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[11px] ${
                      selected ? 'border-white/40 bg-white/10 text-white' : 'border-white/10 text-zinc-400'
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

          <section className="space-y-3">
            <h4 className="text-sm font-medium text-zinc-100">Présence</h4>
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-200">
              <span>Robot 3D (Spline)</span>
              <input
                type="checkbox"
                checked={draft.showRobot !== false}
                onChange={(e) => patchDraft({ showRobot: e.target.checked })}
                className="rounded border-white/20"
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-200">
              <span>Mots-clés (Fitness, Performance…)</span>
              <input
                type="checkbox"
                checked={draft.showKeywords !== false}
                onChange={(e) => patchDraft({ showKeywords: e.target.checked })}
                className="rounded border-white/20"
              />
            </label>
          </section>

          <section className="space-y-3">
            <h4 className="text-sm font-medium text-zinc-100">Infos chiffrées</h4>
            <p className={`text-xs ${S.muted}`}>
              Partagées entre « Mois en cours » et « Stats chiffrées ». Un préréglage ne les modifie
              pas.
            </p>
            <div className="flex flex-wrap gap-2">
              {HOME_METRIC_DEFS.map((m) => {
                const on = draft.metrics?.[m.id] !== false;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() =>
                      patchDraft({
                        metrics: { ...draft.metrics, [m.id]: !on }
                      })
                    }
                    className={`rounded-lg border px-2.5 py-1.5 text-xs ${
                      on
                        ? 'border-white/40 bg-white/10 text-white'
                        : 'border-white/10 text-zinc-500'
                    }`}
                    style={
                      on
                        ? {
                            clipPath:
                              'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)'
                          }
                        : undefined
                    }
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="space-y-3">
            <h4 className="text-sm font-medium text-zinc-100">Options barre d&apos;XP</h4>
            <div className="space-y-2">
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
            </div>
          </section>

          <section className="space-y-3">
            <h4 className="text-sm font-medium text-zinc-100">Widgets de la page d&apos;accueil</h4>
            <p className={`text-xs ${S.muted}`}>
              Active, place et choisis la variante. Les changements n’affectent l’accueil qu’après
              « Appliquer ».
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
                      <div>
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
                      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <label className={`text-[11px] ${S.muted}`}>
                          Affichage
                          <select
                            value={w.variant}
                            onChange={(e) => patchWidget(def.id, { variant: e.target.value })}
                            className={`${S.input} mt-1 w-full text-xs`}
                          >
                            {def.variants.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className={`text-[11px] ${S.muted}`}>
                          Emplacement
                          <select
                            value={w.zone}
                            onChange={(e) => patchWidget(def.id, { zone: e.target.value })}
                            className={`${S.input} mt-1 w-full text-xs`}
                          >
                            {def.zones.map((z) => (
                              <option key={z} value={z}>
                                {HOME_ZONE_LABELS[z]}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Actions */}
          <section className="space-y-3 border-t border-white/10 pt-4">
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
                Appliquer à l’accueil
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
                Enregistrer le brouillon pour plus tard
                <input
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="Nom du preset"
                  maxLength={48}
                  className={`${S.input} mt-1 w-44`}
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
      </CardContent>
    </Card>
  );
};

export default HomeAppearanceSettings;
