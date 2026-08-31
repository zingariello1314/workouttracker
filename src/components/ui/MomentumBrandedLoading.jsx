import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { DEFAULT_LOCK_WALLPAPER_ROTATION_MS } from '../../utils/lockWallpaperImage';
import {
  pickInitialLockWallpaperIndex,
  preloadImageUrl
} from '../../utils/lockWallpaperPreload';
import { pickInitialWallpaperIndex, pickNextWallpaperIndex } from '../../utils/wallpaperPlayback';
import { sameWallpaperUrlList } from '../../utils/wallpaperTargets';
import { LoadingStepsPanel } from './MomentumWelcomeGateSteps';

const CARD_EASE = [0.22, 1, 0.36, 1];

function GateFallbackGradient() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a10] via-[#07070c] to-[#040408]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_0%,rgba(56,189,248,0.12),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_100%_100%,rgba(14,165,233,0.08),transparent_50%)]" />
    </div>
  );
}

export const MomentumLockBackground = forwardRef(function MomentumLockBackground(
  {
    dataUrl = null,
    dataUrls = null,
    variant = 'gate',
    rotationMs = DEFAULT_LOCK_WALLPAPER_ROTATION_MS,
    pauseAutoRotation = false,
    order = 'random',
    weights = null
  },
  ref
) {
  const CROSSFADE_MS = 800;
  const CROSSFADE_EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';

  const urls = useMemo(() => {
    if (Array.isArray(dataUrls) && dataUrls.length > 0) {
      return dataUrls.filter(Boolean);
    }
    return dataUrl ? [dataUrl] : [];
  }, [dataUrl, dataUrls]);

  const indexRef = useRef(0);
  const prevUrlsRef = useRef([]);
  const layer0SrcRef = useRef(null);
  const layer1SrcRef = useRef(null);
  const [activeLayer, setActiveLayer] = useState(0);
  const [layer0Src, setLayer0Src] = useState(null);
  const [layer1Src, setLayer1Src] = useState(null);
  const [layer0Opacity, setLayer0Opacity] = useState(1);
  const [layer1Opacity, setLayer1Opacity] = useState(0);

  layer0SrcRef.current = layer0Src;
  layer1SrcRef.current = layer1Src;

  const showLayer = useCallback((url, idx) => {
    indexRef.current = idx;
    setLayer0Src(url);
    setLayer1Src(null);
    setLayer0Opacity(1);
    setLayer1Opacity(0);
    setActiveLayer(0);
  }, []);

  const crossfadeToUrl = useCallback(
    (nextUrl, nextIdx) => {
      if (!nextUrl) return;
      indexRef.current = nextIdx;
      if (!layer0SrcRef.current && !layer1SrcRef.current) {
        showLayer(nextUrl, nextIdx);
        return;
      }
      if (urls.length <= 1) {
        showLayer(nextUrl, nextIdx);
        return;
      }
      setActiveLayer((prev) => {
        const inactive = prev === 0 ? 1 : 0;
        if (inactive === 1) {
          setLayer1Src(nextUrl);
          setLayer1Opacity(1);
          setLayer0Opacity(0);
          return 1;
        }
        setLayer0Src(nextUrl);
        setLayer0Opacity(1);
        setLayer1Opacity(0);
        return 0;
      });
    },
    [urls.length, showLayer]
  );

  const loadNext = useCallback(
    async (excludeIdx = -1) => {
      if (!urls.length) return;
      const index = pickNextWallpaperIndex(urls.length, excludeIdx, { order, weights });
      const url = urls[index];
      if (!url) return;
      try {
        await preloadImageUrl(url);
      } catch {
        /* afficher quand même */
      }
      crossfadeToUrl(url, index);
    },
    [urls, crossfadeToUrl, order, weights]
  );

  const advance = useCallback(() => {
    if (urls.length <= 1) return;
    loadNext(indexRef.current).catch(() => {});
  }, [urls, loadNext]);

  useImperativeHandle(ref, () => ({ advance }), [advance]);

  useEffect(() => {
    if (!urls.length) {
      prevUrlsRef.current = [];
      setLayer0Src(null);
      setLayer1Src(null);
      setLayer0Opacity(1);
      setLayer1Opacity(0);
      setActiveLayer(0);
      return undefined;
    }

    if (sameWallpaperUrlList(prevUrlsRef.current, urls)) {
      return undefined;
    }
    prevUrlsRef.current = urls;

    const startIdx =
      order === 'sequential'
        ? pickInitialWallpaperIndex(urls.length, { order, weights })
        : pickInitialLockWallpaperIndex(urls);
    const startUrl = urls[startIdx];
    showLayer(startUrl, startIdx);
    preloadImageUrl(startUrl).catch(() => {});
    return undefined;
  }, [urls, showLayer, order, weights]);

  useEffect(() => {
    if (pauseAutoRotation || urls.length <= 1) return undefined;
    const interval = Number(rotationMs);
    if (!Number.isFinite(interval) || interval < 1000) return undefined;
    const id = window.setInterval(() => {
      loadNext(indexRef.current).catch(() => {});
    }, interval);
    return () => window.clearInterval(id);
  }, [urls, rotationMs, pauseAutoRotation, loadNext]);

  if (!urls.length) return null;

  const overlay =
    variant === 'lock'
      ? 'bg-gradient-to-b from-black/30 via-black/45 to-black/65'
      : 'bg-gradient-to-b from-black/25 via-black/45 to-black/75';

  const layerStyle = (src, opacity, zIndex) =>
    src
      ? {
          backgroundImage: `url(${src})`,
          opacity,
          zIndex,
          transition: `opacity ${CROSSFADE_MS}ms ${CROSSFADE_EASING}`,
          willChange: 'opacity'
        }
      : { opacity: 0, zIndex: 0, pointerEvents: 'none' };

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {variant === 'gate' ? <GateFallbackGradient /> : <div className="absolute inset-0 bg-zinc-950" />}
      <div
        className="absolute inset-0 scale-105 bg-cover bg-center bg-no-repeat"
        style={layerStyle(layer0Src, layer0Opacity, activeLayer === 0 ? 2 : 0)}
      />
      <div
        className="absolute inset-0 scale-105 bg-cover bg-center bg-no-repeat"
        style={layerStyle(layer1Src, layer1Opacity, activeLayer === 1 ? 2 : 0)}
      />
      <div className={`absolute inset-0 z-[3] ${overlay}`} />
      <div className="absolute inset-0 z-[3] bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,transparent_0%,rgba(0,0,0,0.55)_100%)]" />
    </div>
  );
});

export const MomentumWelcomeGate = memo(function MomentumWelcomeGate({
  onUnlock,
  title,
  subtitle,
  unlockLabel,
  unlockHint,
  syncMessage,
  stepSignals = [],
  lockBackgroundDataUrl = null,
  lockBackgroundDataUrls = null,
  lockWallpaperRotationMs = DEFAULT_LOCK_WALLPAPER_ROTATION_MS,
  lockWallpaperAdvanceOnClick = false,
  lockWallpaperOrder = 'random',
  lockWallpaperWeights = null
}) {
  const bgRef = useRef(null);
  const [opening, setOpening] = useState(false);
  const [sequenceReady, setSequenceReady] = useState(false);

  const hasCustomBg = Boolean(
    (Array.isArray(lockBackgroundDataUrls) && lockBackgroundDataUrls.length > 0) ||
      lockBackgroundDataUrl
  );

  const handleBackdropClick = useCallback(() => {
    if (!lockWallpaperAdvanceOnClick) return;
    bgRef.current?.advance?.();
  }, [lockWallpaperAdvanceOnClick]);

  const handleUnlock = useCallback(() => {
    if (opening || !sequenceReady) return;
    setOpening(true);
    window.setTimeout(() => onUnlock?.(), 380);
  }, [opening, onUnlock, sequenceReady]);

  const canUnlock = sequenceReady && !opening;

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: CARD_EASE }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-gate-title"
      onClick={handleBackdropClick}
    >
      {!hasCustomBg ? <GateFallbackGradient /> : null}
      {hasCustomBg ? (
        <MomentumLockBackground
          ref={bgRef}
          dataUrl={lockBackgroundDataUrl}
          dataUrls={lockBackgroundDataUrls}
          variant="gate"
          rotationMs={lockWallpaperRotationMs}
          pauseAutoRotation={false}
          order={lockWallpaperOrder}
          weights={lockWallpaperWeights}
        />
      ) : null}

      <div className="pointer-events-none relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-10">
        <motion.div
          className="pointer-events-auto w-full max-w-[400px]"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.42, ease: CARD_EASE }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative overflow-hidden rounded-[22px] border border-white/[0.08] bg-[#0d1117]/75 p-6 shadow-[0_24px_64px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-7">
            <div
              className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-20 left-1/2 h-40 w-[120%] -translate-x-1/2 bg-[radial-gradient(ellipse,rgba(56,189,248,0.15),transparent_70%)]"
              aria-hidden
            />

            <motion.div
              className="relative mb-5"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05, duration: 0.42, ease: CARD_EASE }}
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-sky-500/30 bg-slate-900/80 shadow-[0_0_16px_rgba(56,189,248,0.2)]">
                  <img
                    src="/logo.png"
                    alt=""
                    width={28}
                    height={28}
                    className="h-7 w-7 rounded-md object-contain"
                  />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-500">
                    Momentum
                  </p>
                  <h1 id="welcome-gate-title" className="text-lg font-bold tracking-tight text-white">
                    {title}
                  </h1>
                </div>
              </div>
              {subtitle ? (
                <p className="text-sm leading-relaxed text-slate-400">{subtitle}</p>
              ) : null}
            </motion.div>

            <LoadingStepsPanel
              stepSignals={stepSignals}
              syncMessage={syncMessage}
              onReadyChange={setSequenceReady}
            />

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65, duration: 0.4, ease: CARD_EASE }}
            >
              <button
                type="button"
                onClick={handleUnlock}
                disabled={!canUnlock}
                className="group relative w-full overflow-hidden rounded-xl px-5 py-3.5 text-[15px] font-semibold transition-all duration-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0d1117] disabled:cursor-not-allowed disabled:border disabled:border-slate-600/40 disabled:bg-slate-700/50 disabled:text-slate-500 disabled:shadow-none enabled:bg-gradient-to-r enabled:from-sky-500 enabled:to-cyan-400 enabled:text-slate-950 enabled:shadow-[0_0_18px_rgba(56,189,248,0.45),0_8px_28px_rgba(56,189,248,0.3)] enabled:hover:brightness-110 enabled:hover:shadow-[0_0_26px_rgba(56,189,248,0.7),0_0_52px_rgba(34,211,238,0.35),0_8px_32px_rgba(56,189,248,0.45)] enabled:active:scale-[0.98] enabled:active:shadow-[0_0_14px_rgba(56,189,248,0.55)]"
              >
                <span
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-enabled:group-hover:opacity-100"
                  aria-hidden
                >
                  <span className="absolute -inset-px rounded-xl bg-gradient-to-r from-sky-400/0 via-cyan-300/40 to-sky-400/0 blur-[2px]" />
                  <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 ease-out group-enabled:group-hover:translate-x-full" />
                </span>
                <span className="relative z-10 flex items-center justify-center gap-2.5">
                  {opening ? (
                    <Loader2 size={18} className="animate-spin text-slate-900" aria-hidden />
                  ) : (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/15">
                      <svg
                        className="h-3.5 w-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        aria-hidden
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                        />
                      </svg>
                    </span>
                  )}
                  {opening ? 'Ouverture…' : unlockLabel}
                </span>
              </button>
            </motion.div>

            {unlockHint ? (
              <motion.p
                className="mt-4 text-center text-[11px] leading-relaxed text-white/35"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.85, duration: 0.35 }}
              >
                {unlockHint}
              </motion.p>
            ) : null}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
});

export function MomentumTabLoadOverlay({ message = 'Chargement…' }) {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-gradient-to-b from-[#0c0c12] via-[#08080d] to-[#050507] px-4">
      <div className="w-full max-w-sm rounded-3xl border border-white/12 bg-slate-900/55 px-8 py-10 text-center shadow-2xl backdrop-blur-xl">
        <div className="mx-auto mb-6 h-12 w-12 animate-spin rounded-full border-2 border-sky-400/25 border-t-sky-400" />
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{message}</p>
      </div>
    </div>
  );
}

/** Chargement dans la zone de contenu — sidebar et fond restent visibles. */
export function MomentumTabInlineLoader({ message = 'Chargement…' }) {
  return (
    <div className="flex min-h-[45vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900/35 px-8 py-9 text-center backdrop-blur-sm">
        <div className="mx-auto mb-5 h-10 w-10 animate-spin rounded-full border-2 border-sky-400/25 border-t-sky-400" />
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">{message}</p>
      </div>
    </div>
  );
}

export function MomentumModalLoadCard({ borderAccentClass = 'border-t-violet-400' }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-slate-900/85 px-10 py-12 shadow-2xl backdrop-blur-xl">
      <div
        className={`mx-auto h-11 w-11 animate-spin rounded-full border-2 border-white/15 ${borderAccentClass}`}
      />
      <p className="mt-5 text-center text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
        Chargement…
      </p>
    </div>
  );
}
