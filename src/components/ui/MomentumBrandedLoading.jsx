import React, { memo } from 'react';
import { motion } from 'framer-motion';

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
}) {
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
      <div className="absolute inset-0 bg-gradient-to-b from-[#0c0c12] via-[#08080d] to-[#050507]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-15%,rgba(56,189,248,0.14),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_45%_at_100%_80%,rgba(167,139,250,0.09),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_40%_35%_at_0%_60%,rgba(34,211,238,0.06),transparent_45%)]" />

      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-4 py-10">
        <motion.div
          className="w-full max-w-md"
          initial={{ y: 18, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="rounded-3xl border border-white/15 bg-slate-900/70 p-8 shadow-2xl shadow-black/50 backdrop-blur-xl sm:p-10">
            <div className="mb-8 flex flex-col items-center text-center">
              <img
                src="/logo.png"
                alt=""
                width={72}
                height={72}
                className="mb-4 h-[72px] w-[72px] rounded-2xl border border-white/10 bg-slate-900/80 object-contain shadow-lg"
              />
              <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.28em] text-sky-300/90">Momentum</p>
              <h1 id="welcome-gate-title" className="text-2xl font-semibold tracking-tight text-white sm:text-[1.65rem]">
                {title}
              </h1>
              <p id="welcome-gate-desc" className="mt-3 text-sm leading-relaxed text-slate-300">
                {subtitle}
              </p>
            </div>

            {isDataLoading ? (
              <div className="mb-8 flex flex-col items-center gap-3" aria-live="polite">
                <div className="h-11 w-11 animate-spin rounded-full border-2 border-sky-400/20 border-t-sky-400 shadow-[0_0_24px_rgba(56,189,248,0.25)]" />
                {syncMessage ? (
                  <p className="text-center text-xs text-slate-400">{syncMessage}</p>
                ) : null}
              </div>
            ) : (
              <div className="mb-2 h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" aria-hidden />
            )}

            <button
              type="button"
              onClick={onUnlock}
              className="group relative w-full overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-sky-500/90 via-cyan-500/85 to-sky-600/90 px-6 py-4 text-base font-semibold text-white shadow-lg shadow-sky-900/30 transition hover:scale-[1.02] hover:border-white/25 hover:shadow-sky-500/25 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                <svg
                  className="h-5 w-5 opacity-90"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                  />
                </svg>
                {unlockLabel}
              </span>
              <span className="absolute inset-0 bg-gradient-to-t from-white/0 via-white/10 to-white/0 opacity-0 transition group-hover:opacity-100" />
            </button>

            {unlockHint ? (
              <p className="mt-4 text-center text-xs leading-relaxed text-slate-500">{unlockHint}</p>
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
