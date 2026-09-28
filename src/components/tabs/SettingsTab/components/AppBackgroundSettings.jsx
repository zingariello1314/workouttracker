import React, { useEffect, useState } from 'react';
import { Check, Palette } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import { settingsTheme as S } from '../settingsThemeClasses';
import { backgroundOptions } from '../../../../backgrounds/backgroundRegistry';
import { useAppBackground } from '../../../../backgrounds/useAppBackground';
import { BACKGROUND_TAB_TARGETS, ROTATE_INTERVALS } from '../../../../backgrounds/backgroundTargets';

const TYPE_LABEL = {
  animated: 'Animé',
  static: 'Statique',
};

const MODES = [
  { id: 'single', label: 'Un seul fond' },
  { id: 'rotate', label: 'Rotation' },
  { id: 'perTab', label: 'Par onglet' },
];

function BackgroundOptionThumb({ option }) {
  const [Thumb, setThumb] = useState(null);

  useEffect(() => {
    let cancelled = false;
    option.loadThumbnail().then((mod) => {
      if (!cancelled) setThumb(() => mod.default);
    });
    return () => {
      cancelled = true;
    };
  }, [option]);

  if (!Thumb) {
    return <div className="h-full w-full" style={{ background: option.fallbackBackground }} />;
  }
  return <Thumb />;
}

const AppBackgroundSettings = () => {
  const { id: activeId, option: active, preference, setBackgroundId, updatePreference } = useAppBackground();
  const mode = preference.mode;

  const toggleRotate = (backgroundId) => {
    const has = preference.rotateIds.includes(backgroundId);
    const rotateIds = has
      ? preference.rotateIds.filter((id) => id !== backgroundId)
      : [...preference.rotateIds, backgroundId];
    updatePreference({
      mode: 'rotate',
      rotateIds: rotateIds.length ? rotateIds : [backgroundId],
    });
  };

  return (
    <Card variant="settings">
      <CardHeader variant="settings">
        <CardTitle tone="settings" className="flex items-center normal-case tracking-normal">
          <Palette className="mr-2 text-red-400" size={20} />
          Fond de l&apos;application
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className={S.body}>Choisis l&apos;ambiance visuelle de Momentum.</p>

          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Mode du fond">
            {MODES.map((item) => {
              const selected = mode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => updatePreference({ mode: item.id })}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${selected ? S.btnSm : S.btnSecondary}`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          {mode === 'rotate' && (
            <label className={`flex flex-wrap items-center gap-2 text-xs ${S.muted}`}>
              Enchaîner
              <select
                className={`${S.input} w-auto`}
                value={preference.rotateEverySec}
                onChange={(event) => updatePreference({ rotateEverySec: Number(event.target.value) })}
              >
                {ROTATE_INTERVALS.map((interval) => (
                  <option key={interval.sec} value={interval.sec}>{interval.label}</option>
                ))}
              </select>
              Coche les fonds à faire tourner, dans l&apos;ordre des coches.
            </label>
          )}

          {mode === 'perTab' && (
            <p className={`text-xs ${S.muted}`}>
              Chaque onglet principal garde son fond. Sport et Code couvrent aussi leurs sous-onglets. Sans choix, le fond unique sert de repli.
            </p>
          )}

          <div
            className="grid grid-cols-2 gap-3 sm:grid-cols-3"
            role={mode === 'single' ? 'radiogroup' : 'group'}
            aria-label="Fonds disponibles"
          >
            {backgroundOptions.map((option) => {
              const inRotation = preference.rotateIds.includes(option.id);
              const selected = mode === 'rotate' ? inRotation : preference.singleId === option.id;
              const order = preference.rotateIds.indexOf(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  role={mode === 'single' ? 'radio' : 'checkbox'}
                  aria-checked={selected}
                  onClick={() => {
                    if (mode === 'rotate') toggleRotate(option.id);
                    else if (mode === 'single') setBackgroundId(option.id);
                    else updatePreference({ singleId: option.id });
                  }}
                  className={`overflow-hidden rounded-lg border text-left transition-colors ${
                    selected
                      ? 'border-white/30 bg-white/[0.06]'
                      : 'border-white/10 bg-black/20 hover:border-white/20'
                  }`}
                >
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <BackgroundOptionThumb option={option} />
                    {activeId === option.id && (
                      <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/70 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-zinc-100">
                        <Check size={11} strokeWidth={3} />
                        ACTIF
                      </span>
                    )}
                    {mode === 'rotate' && order >= 0 && (
                      <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] text-zinc-100">
                        {order + 1}
                      </span>
                    )}
                  </div>
                  <div className="space-y-0.5 px-3 py-2.5">
                    <div className="text-sm font-medium text-zinc-50">{option.name}</div>
                    <div className={S.mutedXs}>{TYPE_LABEL[option.type] || option.type}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {mode === 'perTab' && (
            <div className="grid gap-2 sm:grid-cols-2">
              {BACKGROUND_TAB_TARGETS.map((target) => (
                <label key={target.id} className={`flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm ${S.label}`}>
                  <span>{target.label}</span>
                  <select
                    className={`${S.input} w-auto`}
                    value={preference.perTab[target.id] || ''}
                    onChange={(event) => {
                      const perTab = { ...preference.perTab };
                      if (event.target.value) perTab[target.id] = event.target.value;
                      else delete perTab[target.id];
                      updatePreference({ perTab });
                    }}
                  >
                    <option value="">Repli ({backgroundOptions.find((item) => item.id === preference.singleId)?.name})</option>
                    {backgroundOptions.map((option) => (
                      <option key={option.id} value={option.id}>{option.name}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          )}

          <p className={S.mutedXs}>
            Fond actuel : <span className="text-zinc-100">{active.name}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AppBackgroundSettings;
