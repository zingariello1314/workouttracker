import React, { useMemo, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../utils/translations';
import NavigationHeader from '../ui/NavigationHeader';
import LanguageSelector from '../ui/LanguageSelector';
import {
  enableHomeWidgetInZone,
  HOME_WIDGET_DEFS,
  HOME_ZONE_LABELS,
  HOME_ZONES,
  listHomeWidgetsInZone,
  resolveHomeAccentHex
} from '../../utils/homeAppearancePreference';
import { renderHomeWidget } from './renderHomeWidget';

/**
 * Aperçu live (brouillon) — bas gauche / bas droite uniquement.
 * Mode édition : clic zone + bouton « + » pour ajouter un widget.
 */
export default function HomeLivePreview({
  draft,
  showZoneGuides = true,
  editable = false,
  className = '',
  compact = false
}) {
  const t = useTranslation();
  const { isAuthenticated } = useAuth();
  const accent = resolveHomeAccentHex(draft);
  const [pickerZone, setPickerZone] = useState(null);

  const byZone = useMemo(() => {
    const out = { bottomLeft: [], bottomRight: [] };
    HOME_ZONES.forEach((zone) => {
      out[zone] = listHomeWidgetsInZone(draft, zone);
    });
    return out;
  }, [draft]);

  const availableForZone = (zone) =>
    HOME_WIDGET_DEFS.filter((def) => {
      const w = draft?.widgets?.[def.id];
      if (!w?.enabled) return true;
      return w.zone !== zone;
    });

  const ctxFor = (zone) => ({
    accent,
    metrics: draft?.metrics,
    xpOptions: draft?.xpOptions,
    t,
    isAuthenticated,
    onAboutCta: () => {},
    zone
  });

  const zoneBox = (zone, children) => {
    const active = pickerZone === zone;
    return (
      <div
        className={`relative flex min-h-0 flex-col gap-2 rounded-xl transition-[box-shadow,outline-color] ${
          editable ? 'cursor-pointer' : ''
        }`}
        style={
          showZoneGuides
            ? {
                outline: `1.5px dashed color-mix(in srgb, ${accent} ${active ? 75 : 42}%, transparent)`,
                outlineOffset: 4,
                boxShadow: active
                  ? `0 0 0 1px color-mix(in srgb, ${accent} 35%, transparent)`
                  : undefined
              }
            : undefined
        }
        onClick={
          editable
            ? (e) => {
                e.stopPropagation();
                setPickerZone((z) => (z === zone ? null : zone));
              }
            : undefined
        }
        role={editable ? 'button' : undefined}
        tabIndex={editable ? 0 : undefined}
        onKeyDown={
          editable
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setPickerZone((z) => (z === zone ? null : zone));
                }
              }
            : undefined
        }
      >
        {showZoneGuides ? (
          <div className="pointer-events-none absolute -top-2 left-2 z-10 flex items-center gap-1">
            <span
              className="bg-[#0a0a12]/90 px-1.5 text-[9px] font-semibold uppercase tracking-wider"
              style={{ color: `color-mix(in srgb, ${accent} 80%, #fff)` }}
            >
              {HOME_ZONE_LABELS[zone]}
            </span>
          </div>
        ) : null}

        {editable ? (
          <button
            type="button"
            className="absolute -top-2 right-2 z-20 inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/20 bg-black/70 text-white shadow-md backdrop-blur pointer-events-auto"
            style={{ borderColor: `color-mix(in srgb, ${accent} 50%, rgba(255,255,255,0.2))` }}
            aria-label={`Ajouter un widget — ${HOME_ZONE_LABELS[zone]}`}
            onClick={(e) => {
              e.stopPropagation();
              setPickerZone((z) => (z === zone ? null : zone));
            }}
          >
            <Plus size={14} />
          </button>
        ) : null}

        {children}

        {editable && pickerZone === zone ? (
          <div
            className="absolute bottom-full left-0 right-0 z-30 mb-2 max-h-48 overflow-y-auto rounded-xl border border-white/15 bg-[#0c0c14]/98 p-2 shadow-2xl backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1.5 flex items-center justify-between px-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                Ajouter ici
              </span>
              <button
                type="button"
                className="rounded p-0.5 text-zinc-400 hover:text-white"
                onClick={() => setPickerZone(null)}
                aria-label="Fermer"
              >
                <X size={12} />
              </button>
            </div>
            <div className="space-y-1">
              {availableForZone(zone).map((def) => (
                <button
                  key={def.id}
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg border border-white/10 px-2 py-1.5 text-left text-[11px] text-zinc-200 hover:border-white/25 hover:bg-white/5"
                  onClick={() => {
                    enableHomeWidgetInZone(def.id, zone);
                    setPickerZone(null);
                  }}
                >
                  <span>{def.title}</span>
                  <Plus size={12} className="text-zinc-500" />
                </button>
              ))}
              {availableForZone(zone).length === 0 ? (
                <p className="px-1 py-2 text-[10px] text-zinc-500">Tous les widgets sont déjà ici.</p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div
      className={`relative flex h-full min-h-0 flex-col overflow-hidden text-white ${className}`}
      style={{
        background:
          'radial-gradient(ellipse at 45% 35%, color-mix(in srgb, var(--preview-ac) 32%, #07070b), #07070b 68%)',
        '--preview-ac': accent
      }}
      aria-label="Aperçu page d’accueil"
      onClick={() => setPickerZone(null)}
    >
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden
      >
        <span className="select-none text-xs font-medium uppercase tracking-[0.35em] text-white/10 md:text-sm">
          Fond d&apos;écran
        </span>
      </div>

      <div className={`relative z-[1] shrink-0 ${compact ? 'scale-[0.92] origin-top' : ''}`}>
        <NavigationHeader previewConfig={draft} activeTabOverride="home" />
      </div>

      <div className="relative z-[1] flex min-h-0 flex-1 flex-col px-4 md:px-6">
        <div className="flex min-h-0 flex-1 flex-col justify-center pb-2 pt-1">
          <p
            className={`max-w-xl font-light leading-snug text-white/90 ${
              compact ? 'text-lg' : 'text-2xl md:text-3xl'
            }`}
            style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.75)' }}
          >
            {t('home.title.line1')}
            <span className="mt-1 block font-semibold">{t('home.title.line2')}</span>
            <span className="mt-1 block">{t('home.title.line3')}</span>
          </p>
          <p className="mt-2 text-[10px] uppercase tracking-wider text-white/30">
            Citation — réglée ailleurs
          </p>
        </div>

        <div className="relative z-0 grid shrink-0 grid-cols-1 items-end gap-4 pb-4 pt-1 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)] md:gap-6">
          {zoneBox(
            'bottomLeft',
            byZone.bottomLeft.length ? (
              byZone.bottomLeft.map(({ def, variant }) =>
                renderHomeWidget(def, variant, ctxFor('bottomLeft'))
              )
            ) : (
              <div className="flex min-h-[100px] items-center justify-center text-[10px] text-white/25">
                {editable ? 'Clique + pour ajouter' : 'Vide'}
              </div>
            )
          )}

          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            {zoneBox(
              'bottomRight',
              byZone.bottomRight.length ? (
                byZone.bottomRight.map(({ def, variant }) =>
                  renderHomeWidget(def, variant, ctxFor('bottomRight'))
                )
              ) : (
                <div className="flex min-h-[72px] min-w-[7rem] items-center justify-center text-[10px] text-white/25">
                  {editable ? 'Clique + pour ajouter' : 'Vide'}
                </div>
              )
            )}

            {(draft.showKeywords !== false ||
              draft.showLocation !== false ||
              draft.showLanguage !== false) && (
              <div
                className="space-y-0.5 text-right text-xs font-semibold text-white md:space-y-1.5 md:text-sm"
                style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.7)' }}
              >
                {draft.showKeywords !== false ? (
                  <>
                    <div>{t('home.keywords.fitness')}</div>
                    <div>{t('home.keywords.performance')}</div>
                    <div>{t('home.keywords.progress')}</div>
                    <div>{t('home.keywords.intelligence')}</div>
                    <div>{t('home.keywords.startTransformation')}</div>
                  </>
                ) : null}
                {draft.showLocation !== false ? (
                  <div className="text-white/70">{t('home.location.loading')}</div>
                ) : null}
                {draft.showLanguage !== false ? (
                  <div className="mt-1 flex justify-end" data-swipe-ignore>
                    <div className="pointer-events-none opacity-90">
                      <LanguageSelector variant="compact" />
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      {draft.showRobot !== false ? (
        <div
          className="pointer-events-none absolute bottom-2 right-4 z-[2] flex h-20 w-16 flex-col items-center justify-end md:bottom-4 md:right-8 md:h-32 md:w-24"
          aria-hidden
        >
          <div
            className="h-full w-full opacity-75"
            style={{
              background: `linear-gradient(180deg, color-mix(in srgb, ${accent} 35%, transparent), rgba(0,0,0,0.55))`,
              clipPath: 'polygon(20% 100%, 35% 35%, 50% 10%, 65% 35%, 80% 100%)'
            }}
          />
          <span className="mt-1 text-[9px] uppercase tracking-wider text-white/40">Robot</span>
        </div>
      ) : null}
    </div>
  );
}
