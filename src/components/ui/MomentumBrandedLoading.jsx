import React, { memo, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

/** Fond personnalisé — ne capture jamais les clics. Supporte une ou plusieurs images. */
export function MomentumLockBackground({
  dataUrl = null,
  dataUrls = null,
  variant = 'gate',
  rotationMs = 90_000
}) {
  const urls = useMemo(() => {
    if (Array.isArray(dataUrls) && dataUrls.length > 0) {
      return dataUrls.filter(Boolean);
    }
    return dataUrl ? [dataUrl] : [];
  }, [dataUrl, dataUrls]);

  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(Math.floor(Math.random() * urls.length));
  }, [urls]);

  useEffect(() => {
    if (urls.length <= 1) return undefined;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % urls.length);
    }, rotationMs);
    return () => window.clearInterval(id);
  }, [urls, rotationMs]);

  if (!urls.length) return null;

  const current = urls[index % urls.length];
  const overlay =
    variant === 'lock'
      ? 'bg-gradient-to-b from-black/30 via-black/45 to-black/65'
      : 'bg-gradient-to-b from-black/20 via-black/40 to-black/70';

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div
        key={current}
        className="absolute inset-0 scale-105 bg-cover bg-center bg-no-repeat transition-opacity duration-1000"
        style={{ backgroundImage: `url(${current})` }}
      />
      <div className={`absolute inset-0 ${overlay}`} />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,transparent_0%,rgba(0,0,0,0.55)_100%)]" />
    </div>
  );
}

/**
 * Écran d’accueil plein écran : même langage visuel que LockScreen / home (verre, dégradés, logo).
 */
export const MomentumWelcomeGate = memo(function MomentumWelcomeGate({
  onUnlock,
  title,
  subtitle,
  unlockLabel,
  unlockHint,
  syncMessage,
  isDataLoading,
  lockBackgroundDataUrl = null,
  lockBackgroundDataUrls = null,
}) {
  const hasCustomBg = Boolean(
    (Array.isArray(lockBackgroundDataUrls) && lockBackgroundDataUrls.length > 0) || lockBackgroundDataUrl
  );

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-gate-title"
      aria-describedby="welcome-gate-desc"
    >
      {hasCustomBg ? (
        <MomentumLockBackground
          dataUrl={lockBackgroundDataUrl}
          dataUrls={lockBackgroundDataUrls}
          variant="gate"
        />
      ) : (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute inset-0 bg-gradient-to-b from-[#0c0c12] via-[#08080d] to-[#050507]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-15%,rgba(56,189,248,0.14),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_45%_at_100%_80%,rgba(167,139,250,0.09),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_35%_at_0%_60%,rgba(34,211,238,0.06),transparent_45%)]" />
        </div>
      )}

      <div className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-10">
        <motion.div
          className="w-full max-w-[420px]"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.08, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative overflow-hidden rounded-[28px] border border-white/20 bg-slate-950/55 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.65)] backdrop-blur-2xl sm:p-10">
            <div
              className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-sky-400/10 blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-violet-500/10 blur-3xl"
              aria-hidden
            />

            <div className="relative mb-7 flex flex-col items-center text-center">
              <div className="mb-5 rounded-2xl border border-white/15 bg-slate-900/60 p-2 shadow-lg shadow-black/40">
                <img
                  src="/logo.png"
                  alt=""
                  width={64}
                  height={64}
                  className="h-16 w-16 rounded-xl object-contain"
                />
              </div>
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.32em] text-sky-300/85">
                Momentum
              </p>
              <h1
                id="welcome-gate-title"
                className="text-[1.65rem] font-semibold leading-tight tracking-tight text-white sm:text-[1.75rem]"
              >
                <motion.span
                  key={title}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="block"
                >
                  {title}
                </motion.span>
              </h1>
              <p id="welcome-gate-desc" className="mt-3 max-w-[28ch] text-sm leading-relaxed text-slate-300/95">
                <motion.span
                  key={subtitle}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                  className="block"
                >
                  {subtitle}
                </motion.span>
              </p>
            </div>

            {isDataLoading ? (
              <div className="relative mb-7 flex flex-col items-center gap-3 rounded-2xl border border-white/8 bg-black/25 px-4 py-5" aria-live="polite">
                <div className="relative h-11 w-11">
                  <div className="absolute inset-0 animate-spin rounded-full border-2 border-sky-400/15 border-t-sky-400" />
                  <div className="absolute inset-[3px] rounded-full border border-white/5" />
                </div>
                {syncMessage ? (
                  <p className="text-center text-xs text-slate-400">{syncMessage}</p>
                ) : null}
              </div>
            ) : (
              <div
                className="mb-6 h-px w-full bg-gradient-to-r from-transparent via-white/12 to-transparent"
                aria-hidden
              />
            )}

            <button
              type="button"
              onClick={onUnlock}
              className="group relative z-20 w-full cursor-pointer overflow-hidden rounded-2xl border border-sky-300/25 bg-gradient-to-br from-sky-500 via-cyan-500 to-sky-600 px-6 py-4 text-base font-semibold text-white shadow-[0_12px_40px_rgba(14,165,233,0.35)] transition duration-200 hover:scale-[1.02] hover:border-sky-200/40 hover:shadow-[0_16px_48px_rgba(56,189,248,0.45)] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              <span className="relative z-10 flex items-center justify-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/20">
                  <svg
                    className="h-4 w-4"
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
                {unlockLabel}
              </span>
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/10 via-white/10 to-white/20 opacity-0 transition group-hover:opacity-100" />
            </button>

            {unlockHint ? (
              <p className="relative mt-5 text-center text-xs leading-relaxed text-slate-400/90">{unlockHint}</p>
            ) : null}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
});

/** Chargement d’onglet lazy — plein écran, même palette que l’app. */
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

/** Carte compacte pour Suspense derrière un fond flouté (modales). */
export function MomentumModalLoadCard({ borderAccentClass = 'border-t-violet-400' }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-slate-900/85 px-10 py-12 shadow-2xl backdrop-blur-xl">
      <div
        className={`mx-auto h-11 w-11 animate-spin rounded-full border-2 border-white/15 ${borderAccentClass}`}
      />
      <p className="mt-5 text-center text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Chargement…</p>
    </div>
  );
}
