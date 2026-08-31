import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppLock } from '../../context/AppLockContext';
import { useAuth } from '../../context/AuthContext';
import { GlslHills } from '../ui/glsl-hills';
import { MomentumLockBackground } from '../ui/MomentumBrandedLoading';
import { useLockWallpaperPlayback } from '../../hooks/useLockWallpaperUrls';
import LockForgotRecovery from './LockForgotRecovery';

const keysPin = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'back'],
];

const rowsQwerty = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
];

/**
 * Écran de verrouillage plein écran : fond personnalisé, pavé numérique ou saisie alphanumérique.
 */
const LockScreen = () => {
  const { record, unlockWithCode, shakeToken, lockoutRemainingMs } = useAppLock();
  const { currentUser } = useAuth();

  const [pin, setPin] = useState('');
  const [alpha, setAlpha] = useState('');
  const [busy, setBusy] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const alphaRef = useRef(null);

  const mode = record.mode;
  const isPin = mode === 'pin4' || mode === 'pin6';
  const maxLen = mode === 'pin4' ? 4 : mode === 'pin6' ? 6 : 64;

  useEffect(() => {
    setPin('');
    setAlpha('');
  }, [mode]);

  const submit = useCallback(async () => {
    if (busy) return;
    if (lockoutRemainingMs > 0) return;
    const code = isPin ? pin : alpha;
    if (!code) return;
    if (isPin && code.length !== maxLen) return;
    if (!isPin && code.length < 4) return;
    setBusy(true);
    const res = await unlockWithCode(code);
    setBusy(false);
    if (!res.success && res.error === 'BAD_CODE') {
      setPin('');
      setAlpha('');
    }
  }, [busy, lockoutRemainingMs, isPin, pin, alpha, maxLen, unlockWithCode]);

  useEffect(() => {
    if (!isPin || showForgot) return;
    const onKey = (e) => {
      if (lockoutRemainingMs > 0) return;
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        setPin((p) => (p.length >= maxLen ? p : p + e.key));
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        setPin((p) => p.slice(0, -1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        submit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isPin, maxLen, lockoutRemainingMs, submit, showForgot]);

  useEffect(() => {
    if (showForgot) return;
    if (isPin && pin.length === maxLen && maxLen > 0) {
      const t = window.setTimeout(() => submit(), 120);
      return () => window.clearTimeout(t);
    }
  }, [pin, maxLen, isPin, submit, showForgot]);

  const appendDigit = (d) => {
    if (lockoutRemainingMs > 0) return;
    setPin((p) => (p.length >= maxLen ? p : p + d));
  };

  const backspacePin = () => setPin((p) => p.slice(0, -1));

  const appendAlpha = (ch) => {
    if (lockoutRemainingMs > 0) return;
    setAlpha((a) => (a.length >= maxLen ? a : a + ch));
  };

  const bg = record.lockBackgroundDataUrl;
  const lockPlayback = useLockWallpaperPlayback();
  const lockWallpaperUrls = lockPlayback.urls;
  const bgRef = useRef(null);
  const advanceOnClick = lockPlayback.advanceOnClick;
  const hasCustomBg = lockWallpaperUrls.length > 0 || Boolean(bg);

  const handleBackdropClick = useCallback(() => {
    if (!advanceOnClick) return;
    bgRef.current?.advance?.();
  }, [advanceOnClick]);

  return (
    <motion.div
      className="fixed inset-0 z-[10000] flex flex-col items-center justify-center px-4 py-8 text-white"
      initial={false}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={handleBackdropClick}
    >
      {/* WebGL hors de toute animation d’opacité parente (évite composite / tremblement à l’ouverture) */}
      <div className="absolute inset-0 overflow-hidden bg-zinc-950">
        {hasCustomBg ? (
          <MomentumLockBackground
            ref={bgRef}
            dataUrls={lockWallpaperUrls.length > 0 ? lockWallpaperUrls : undefined}
            dataUrl={lockWallpaperUrls.length > 0 ? undefined : bg}
            variant="lock"
            rotationMs={lockPlayback.rotationMs}
            pauseAutoRotation={false}
            order={lockPlayback.order}
            weights={lockPlayback.weights}
          />
        ) : (
          <GlslHills cameraZ={125} planeSize={256} speed={0.5} className="z-0" />
        )}
        {!hasCustomBg ? (
          <>
            <div className="absolute inset-0 z-[2] bg-zinc-950/22" />
            <div className="absolute inset-0 z-[3] bg-gradient-to-b from-transparent via-zinc-950/12 to-zinc-950/52 pointer-events-none" />
          </>
        ) : null}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          key={shakeToken}
          animate={shakeToken ? { x: [0, -10, 10, -8, 8, 0] } : {}}
          transition={{ duration: 0.45 }}
        >
        <div className="rounded-3xl border border-white/15 bg-slate-900/65 shadow-2xl shadow-black/50 backdrop-blur-xl p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="flex flex-col items-center gap-2 mb-3">
              <img
                src="/logo.png"
                alt="Momentum"
                className="w-14 h-14 rounded-xl shadow-lg object-contain border border-white/10 bg-slate-900/80"
              />
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300/90">Momentum</p>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Application verrouillée</h1>
            <p className="text-sm text-slate-300 mt-2">
              {isPin ? `Code à ${maxLen} chiffres` : 'Saisissez votre code confidentiel'}
            </p>
          </div>

          {lockoutRemainingMs > 0 && (
            <div className="mb-4 rounded-xl bg-amber-500/15 border border-amber-400/30 px-3 py-2 text-center text-sm text-amber-100">
              Trop de tentatives. Réessayez dans{' '}
              <strong>{Math.ceil(lockoutRemainingMs / 1000)}</strong> s.
            </div>
          )}

          {isPin ? (
            <>
              <div className="flex justify-center gap-2 sm:gap-3 mb-8" aria-live="polite">
                {Array.from({ length: maxLen }).map((_, i) => (
                  <span
                    key={i}
                    className={`h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full border transition-all duration-200 ${
                      i < pin.length
                        ? 'bg-sky-400 border-sky-200 scale-105 shadow-[0_0_12px_rgba(56,189,248,0.45)]'
                        : 'bg-slate-800/80 border-slate-600'
                    }`}
                  />
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
                {keysPin.flat().map((cell, idx) => {
                  if (cell === '') return <div key={`e-${idx}`} />;
                  if (cell === 'back') {
                    return (
                      <button
                        key="back"
                        type="button"
                        disabled={lockoutRemainingMs > 0}
                        onClick={backspacePin}
                        className="h-14 rounded-2xl bg-slate-800/90 border border-slate-600/80 text-sm font-medium hover:bg-slate-700/90 active:scale-95 transition disabled:opacity-40"
                      >
                        Effacer
                      </button>
                    );
                  }
                  return (
                    <button
                      key={cell}
                      type="button"
                      disabled={lockoutRemainingMs > 0}
                      onClick={() => appendDigit(cell)}
                      className="h-14 rounded-2xl text-xl font-semibold bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 shadow-lg hover:from-slate-700 hover:to-slate-800 active:scale-95 transition disabled:opacity-40"
                    >
                      {cell}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                disabled={busy || pin.length !== maxLen || lockoutRemainingMs > 0}
                onClick={submit}
                className="mt-6 w-full py-3 rounded-2xl font-semibold bg-gradient-to-r from-sky-500 to-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-95 transition"
              >
                Déverrouiller
              </button>
            </>
          ) : (
            <>
              <label className="block text-sm text-slate-300 mb-2" htmlFor="app-lock-alpha">
                Code (4 à 64 caractères)
              </label>
              <input
                id="app-lock-alpha"
                ref={alphaRef}
                type="password"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                value={alpha}
                onChange={(e) => setAlpha(e.target.value.slice(0, maxLen))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submit();
                }}
                disabled={lockoutRemainingMs > 0}
                className="w-full mb-4 px-4 py-3 rounded-2xl bg-slate-950/70 border border-slate-600 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                placeholder="Mot de passe d’application"
              />
              <div className="space-y-2 mb-4">
                {rowsQwerty.map((row) => (
                  <div key={row.join('')} className="flex flex-wrap justify-center gap-1">
                    {row.map((k) => (
                      <button
                        key={k}
                        type="button"
                        disabled={lockoutRemainingMs > 0}
                        onClick={() => appendAlpha(k)}
                        className="min-w-[2rem] h-9 px-2 rounded-lg bg-slate-800/90 border border-slate-600/70 text-sm hover:bg-slate-700 active:scale-95 disabled:opacity-40"
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                ))}
                <div className="flex justify-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={lockoutRemainingMs > 0}
                    onClick={() => appendAlpha('0')}
                    className="min-w-[2.5rem] h-9 rounded-lg bg-slate-800/90 border border-slate-600/70 text-sm hover:bg-slate-700"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    disabled={lockoutRemainingMs > 0}
                    onClick={() => setAlpha((a) => a.slice(0, -1))}
                    className="px-3 h-9 rounded-lg bg-slate-800/90 border border-slate-600/70 text-sm hover:bg-slate-700"
                  >
                    Retour
                  </button>
                </div>
              </div>
              <button
                type="button"
                disabled={busy || alpha.length < 4 || lockoutRemainingMs > 0}
                onClick={submit}
                className="w-full py-3 rounded-2xl font-semibold bg-gradient-to-r from-sky-500 to-indigo-500 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-95 transition"
              >
                Déverrouiller
              </button>
            </>
          )}
          <div className="mt-5 pt-4 border-t border-white/10 text-center">
            <button
              type="button"
              className="text-sm text-sky-300 hover:text-sky-200 hover:underline disabled:opacity-40"
              disabled={lockoutRemainingMs > 0}
              onClick={() => setShowForgot(true)}
            >
              J'ai oublié mon code
            </button>
          </div>
        </div>
        </motion.div>
      </motion.div>

      <LockForgotRecovery
        isOpen={showForgot}
        onClose={() => setShowForgot(false)}
        defaultEmail={currentUser?.email || ''}
        lockMode={mode}
      />
    </motion.div>
  );
};

export const AppLockGate = () => {
  const { isLocked, lockReady } = useAppLock();
  return (
    <AnimatePresence>
      {isLocked && lockReady ? <LockScreen key="lock" /> : null}
    </AnimatePresence>
  );
};

export default LockScreen;
