import React, { useEffect, useState } from 'react';
import { Gauge, Plus, Trash2 } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import { settingsTheme as S } from '../settingsThemeClasses';
import {
  getXpAppearancePreference,
  listAllSportXpAccents,
  SPORT_XP_DETAIL_FIELDS,
  SPORT_XP_TAB_OPTIONS,
  subscribeXpAppearance,
  updateXpAppearancePreference
} from '../../../../utils/xpAppearancePreference';

const XpAppearanceSettings = () => {
  const [preference, setPreference] = useState(getXpAppearancePreference);
  const [customHex, setCustomHex] = useState('#7c3aed');
  const [customLabel, setCustomLabel] = useState('Perso');

  useEffect(() => subscribeXpAppearance(setPreference), []);

  const accents = listAllSportXpAccents(preference);
  const showAllTabs = preference.showTabs.length >= SPORT_XP_TAB_OPTIONS.length;

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
            Personnalise la barre XP Sport (HUD), les infos dépliées, les sous-onglets où elle apparaît,
            et les accents des barres Nutrition.
          </p>

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
            <h4 className="text-sm font-medium text-zinc-100">Infos du détail (déplié)</h4>
            <p className={`text-xs ${S.muted}`}>
              Ajoute ou retire des blocs / lignes. Les nouvelles infos (moyenne journalière, maîtrise)
              s’appuient sur l’activité déjà calculée.
            </p>
            <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-white/10 bg-black/30 p-2">
              {SPORT_XP_DETAIL_FIELDS.map((field) => {
                const checked = preference.detailFields[field.id] !== false;
                return (
                  <label
                    key={field.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs text-zinc-300 hover:bg-white/[0.04]"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleField(field.id)}
                      className="rounded border-white/20"
                    />
                    {field.label}
                  </label>
                );
              })}
            </div>
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
