import React, { useEffect, useMemo, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Gauge, GripVertical, Plus, Trash2 } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import { settingsTheme as S } from '../settingsThemeClasses';
import SportXPBar from '../../TodayTab/components/SportXPBar';
import {
  getDetailFieldOrder,
  getLayoutOrder,
  getXpAppearancePreference,
  listAllSportXpAccents,
  SPORT_XP_DETAIL_FIELDS,
  SPORT_XP_LAYOUT_BLOCKS,
  SPORT_XP_TAB_OPTIONS,
  subscribeXpAppearance,
  updateXpAppearancePreference
} from '../../../../utils/xpAppearancePreference';

function reorder(list, startIndex, endIndex) {
  const next = Array.from(list);
  const [removed] = next.splice(startIndex, 1);
  next.splice(endIndex, 0, removed);
  return next;
}

const fieldById = Object.fromEntries(SPORT_XP_DETAIL_FIELDS.map((f) => [f.id, f]));
const blockById = Object.fromEntries(SPORT_XP_LAYOUT_BLOCKS.map((b) => [b.id, b]));

const XpAppearanceSettings = () => {
  const [preference, setPreference] = useState(getXpAppearancePreference);
  const [customHex, setCustomHex] = useState('#7c3aed');
  const [customLabel, setCustomLabel] = useState('Perso');

  useEffect(() => subscribeXpAppearance(setPreference), []);

  const accents = listAllSportXpAccents(preference);
  const showAllTabs = preference.showTabs.length >= SPORT_XP_TAB_OPTIONS.length;
  const layoutOrder = useMemo(() => getLayoutOrder(preference), [preference]);
  const fieldOrder = useMemo(() => getDetailFieldOrder(preference), [preference]);

  const toggleTab = (tabId) => {
    const has = preference.showTabs.includes(tabId);
    const showTabs = has
      ? preference.showTabs.filter((id) => id !== tabId)
      : [...preference.showTabs, tabId];
    updateXpAppearancePreference({
      showTabs: showTabs.length ? showTabs : [tabId]
    });
  };

  const setAllTabs = () => {
    updateXpAppearancePreference({
      showTabs: SPORT_XP_TAB_OPTIONS.map((t) => t.id)
    });
  };

  const toggleField = (fieldId) => {
    updateXpAppearancePreference({
      detailFields: {
        ...preference.detailFields,
        [fieldId]: !preference.detailFields[fieldId]
      }
    });
  };

  const addCustomAccent = () => {
    const hex = customHex.trim();
    if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return;
    const id = `custom-${Date.now().toString(36)}`;
    const customAccents = [
      ...(preference.customAccents || []),
      { id, label: customLabel.trim() || 'Perso', hex: hex.toLowerCase() }
    ].slice(0, 12);
    updateXpAppearancePreference({
      customAccents,
      sportAccentId: id
    });
  };

  const removeCustomAccent = (id) => {
    const customAccents = (preference.customAccents || []).filter((c) => c.id !== id);
    const sportAccentId =
      preference.sportAccentId === id ? 'violet' : preference.sportAccentId;
    updateXpAppearancePreference({ customAccents, sportAccentId });
  };

  const onLayoutDragEnd = (result) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;
    updateXpAppearancePreference({
      layoutOrder: reorder(layoutOrder, result.source.index, result.destination.index)
    });
  };

  const onFieldDragEnd = (result) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;
    updateXpAppearancePreference({
      detailFieldOrder: reorder(fieldOrder, result.source.index, result.destination.index)
    });
  };

  return (
    <Card variant="settings">
      <CardHeader variant="settings">
        <CardTitle tone="settings" className="flex items-center normal-case tracking-normal">
          <Gauge className="mr-2 text-red-400" size={20} />
          Barres XP & couleurs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <p className={S.body}>
            Personnalise la barre XP Sport (HUD), l’ordre des blocs, les infos dépliées, les
            sous-onglets où elle apparaît, et les accents Nutrition. L’aperçu ci-dessous se met à
            jour en direct.
          </p>

          <section className="space-y-2">
            <h4 className="text-sm font-medium text-zinc-100">Aperçu live — barre XP Sport</h4>
            <p className={`text-xs ${S.muted}`}>
              Coche, décoche ou réordonne : la barre reflète immédiatement tes choix (données
              réelles du compte).
            </p>
            <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40 p-2">
              <SportXPBar previewMode />
            </div>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-medium text-zinc-100">Couleur accent Sport</h4>
            <div className="flex flex-wrap gap-2">
              {accents.map((item) => {
                const selected = preference.sportAccentId === item.id;
                const isCustom = String(item.id).startsWith('custom-');
                return (
                  <div key={item.id} className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => updateXpAppearancePreference({ sportAccentId: item.id })}
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
                    {isCustom ? (
                      <button
                        type="button"
                        onClick={() => removeCustomAccent(item.id)}
                        className="rounded p-1 text-zinc-500 hover:text-red-300"
                        title="Supprimer cette couleur"
                      >
                        <Trash2 size={12} />
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap items-end gap-2 pt-1">
              <label className={`text-xs ${S.muted}`}>
                Hex
                <input
                  type="color"
                  value={customHex}
                  onChange={(e) => setCustomHex(e.target.value)}
                  className="mt-1 block h-9 w-14 cursor-pointer rounded border border-white/10 bg-black"
                />
              </label>
              <label className={`text-xs ${S.muted}`}>
                Nom
                <input
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  maxLength={24}
                  className={`${S.input} mt-1 w-28`}
                />
              </label>
              <button
                type="button"
                onClick={addCustomAccent}
                className={`inline-flex items-center gap-1 ${S.btnSecondary} text-xs`}
              >
                <Plus size={12} />
                Ajouter
              </button>
            </div>
          </section>

          <section className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-medium text-zinc-100">Où afficher la barre XP Sport</h4>
              <button type="button" onClick={setAllTabs} className={`${S.btnSecondary} text-[11px]`}>
                {showAllTabs ? 'Tous cochés' : 'Tout cocher'}
              </button>
            </div>
            <p className={`text-xs ${S.muted}`}>
              Un seul, plusieurs, ou tous les sous-onglets Sport (sauf Anatomie).
            </p>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {SPORT_XP_TAB_OPTIONS.map((tab) => {
                const checked = preference.showTabs.includes(tab.id);
                return (
                  <label
                    key={tab.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs ${
                      checked
                        ? 'border-white/25 bg-white/[0.06] text-zinc-100'
                        : 'border-white/10 text-zinc-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleTab(tab.id)}
                      className="rounded border-white/20"
                    />
                    {tab.label}
                  </label>
                );
              })}
            </div>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-medium text-zinc-100">Ordre des sections (glisser-déposer)</h4>
            <p className={`text-xs ${S.muted}`}>
              Déplace chaque bloc pour composer le détail déplié comme tu veux. La barre se met à
              jour tout de suite.
            </p>
            <DragDropContext onDragEnd={onLayoutDragEnd}>
              <Droppable droppableId="xp-layout-blocks">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-1.5 rounded-lg border border-white/10 bg-black/30 p-2 ${
                      snapshot.isDraggingOver ? 'border-violet-400/40 bg-violet-950/20' : ''
                    }`}
                  >
                    {layoutOrder.map((id, index) => {
                      const block = blockById[id];
                      if (!block) return null;
                      return (
                        <Draggable key={id} draggableId={id} index={index}>
                          {(dragProvided, dragSnapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-xs ${
                                dragSnapshot.isDragging
                                  ? 'border-violet-400/50 bg-violet-950/40 shadow-lg'
                                  : 'border-white/10 bg-white/[0.03] text-zinc-200'
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
                              <span className="min-w-0 flex-1">{block.label}</span>
                              <span className={`tabular-nums ${S.muted}`}>{index + 1}</span>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </section>

          <section className="space-y-2">
            <h4 className="text-sm font-medium text-zinc-100">Infos du détail — ordre & visibilité</h4>
            <p className={`text-xs ${S.muted}`}>
              Coche pour afficher, glisse pour réordonner les lignes dans les tableaux. L’aperçu
              suit en direct.
            </p>
            <DragDropContext onDragEnd={onFieldDragEnd}>
              <Droppable droppableId="xp-detail-fields">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`max-h-72 space-y-1 overflow-y-auto rounded-lg border border-white/10 bg-black/30 p-2 ${
                      snapshot.isDraggingOver ? 'border-violet-400/40' : ''
                    }`}
                  >
                    {fieldOrder.map((id, index) => {
                      const field = fieldById[id];
                      if (!field) return null;
                      const checked = preference.detailFields[field.id] !== false;
                      return (
                        <Draggable key={id} draggableId={id} index={index}>
                          {(dragProvided, dragSnapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              className={`flex items-center gap-2 rounded px-2 py-1.5 text-xs ${
                                dragSnapshot.isDragging
                                  ? 'bg-violet-950/50 shadow'
                                  : 'text-zinc-300 hover:bg-white/[0.04]'
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
                              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleField(field.id)}
                                  className="rounded border-white/20"
                                />
                                <span className="truncate">{field.label}</span>
                              </label>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </section>

          <section className="space-y-3">
            <h4 className="text-sm font-medium text-zinc-100">Couleurs Nutrition</h4>
            <p className={`text-xs ${S.muted}`}>
              Remplace le vert / cyan figés des barres de progression nutrition (macros, conformité,
              XP nutrition).
            </p>
            <div className="flex flex-wrap gap-4">
              <label className={`text-xs ${S.muted}`}>
                Barres « OK » (ex. macros)
                <input
                  type="color"
                  value={preference.nutritionAccent}
                  onChange={(e) =>
                    updateXpAppearancePreference({ nutritionAccent: e.target.value })
                  }
                  className="mt-1 block h-9 w-14 cursor-pointer rounded border border-white/10 bg-black"
                />
              </label>
              <label className={`text-xs ${S.muted}`}>
                Barre XP nutrition
                <input
                  type="color"
                  value={preference.nutritionXpAccent}
                  onChange={(e) =>
                    updateXpAppearancePreference({ nutritionXpAccent: e.target.value })
                  }
                  className="mt-1 block h-9 w-14 cursor-pointer rounded border border-white/10 bg-black"
                />
              </label>
            </div>
          </section>
        </div>
      </CardContent>
    </Card>
  );
};

export default XpAppearanceSettings;
