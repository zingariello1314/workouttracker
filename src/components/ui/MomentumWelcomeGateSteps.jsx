import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check } from 'lucide-react';

const MIN_STEP_MS = 140;
const STEP_END_PROGRESS = [14, 30, 46, 62, 80, 100];

export const LOADING_STEPS = [
  {
    id: 'session',
    loadingLabel: 'Connexion à votre espace…',
    doneLabel: 'Session établie'
  },
  {
    id: 'profile',
    loadingLabel: 'Chargement du profil…',
    doneLabel: 'Profil chargé'
  },
  {
    id: 'avatar',
    loadingLabel: 'Photo de profil…',
    doneLabel: 'Avatar prêt'
  },
  {
    id: 'prefs',
    loadingLabel: 'Restauration des préférences…',
    doneLabel: 'Préférences restaurées'
  },
  {
    id: 'homeImages',
    loadingLabel: 'Images d\u2019accueil…',
    doneLabel: 'Fonds d\u2019accueil prêts'
  },
  {
    id: 'finalize',
    loadingLabel: 'Finalisation de l\u2019environnement…',
    doneLabel: 'Environnement prêt'
  }
];

/** pending | loading | done */
function StepRow({ step, status }) {
  const isDone = status === 'done';
  const isActive = status === 'loading';
  const label = isDone ? step.doneLabel : step.loadingLabel;

  return (
    <div
      className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-[13px] transition-all duration-500 ease-out ${
        isActive
          ? 'border-sky-400/45 bg-sky-500/10 text-sky-50'
          : isDone
            ? 'border-emerald-500/20 bg-emerald-500/[0.06] text-slate-200'
            : 'border-white/[0.06] bg-white/[0.03] text-slate-500'
      }`}
    >
      {isDone ? (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/90 text-white shadow-[0_0_10px_rgba(52,211,153,0.45)]">
          <Check size={12} strokeWidth={3} />
        </span>
      ) : isActive ? (
        <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
          <span className="absolute h-2.5 w-2.5 animate-ping rounded-full bg-sky-400/40" />
          <span className="h-2.5 w-2.5 rounded-full bg-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.8)]" />
        </span>
      ) : (
        <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-slate-600/80" />
      )}
      <span className={isActive ? 'font-medium' : isDone ? 'text-slate-200' : 'text-slate-500'}>
        {label}
      </span>
    </div>
  );
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

function timeCreep(startedAt, cap = 0.88, durationMs = 1800) {
  const t = clamp((Date.now() - startedAt) / durationMs, 0, 1);
  return cap * easeOutCubic(t);
}

/**
 * @param {{ ready: boolean, partial?: number }[]} stepSignals
 */
export function useWelcomeLoadingSequence(stepSignals) {
  const stepCount = LOADING_STEPS.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(4);
  const [isReady, setIsReady] = useState(false);

  const stepStartedAt = useRef(Date.now());
  const targetProgress = useRef(4);
  const smoothRafRef = useRef(null);
  const lastFrameAt = useRef(Date.now());

  const stepStatuses = useMemo(
    () =>
      LOADING_STEPS.map((_, i) => {
        if (i < completedCount) return 'done';
        if (i === activeIndex && !isReady) return 'loading';
        return 'pending';
      }),
    [completedCount, activeIndex, isReady]
  );

  useEffect(() => {
    stepStartedAt.current = Date.now();
    setActiveIndex(0);
    setCompletedCount(0);
    setDisplayProgress(4);
    targetProgress.current = 4;
    setIsReady(false);
  }, []);

  useEffect(() => {
    if (isReady || activeIndex >= stepCount) return undefined;

    const signal = stepSignals[activeIndex];
    if (!signal?.ready) return undefined;

    const elapsed = Date.now() - stepStartedAt.current;
    const delay = Math.max(0, MIN_STEP_MS - elapsed);

    const t = window.setTimeout(() => {
      const nextCompleted = activeIndex + 1;
      setCompletedCount(nextCompleted);

      if (nextCompleted >= stepCount) {
        targetProgress.current = 100;
        setIsReady(true);
        return;
      }

      setActiveIndex(nextCompleted);
      stepStartedAt.current = Date.now();
      targetProgress.current = STEP_END_PROGRESS[nextCompleted - 1] ?? 100;
    }, delay);

    return () => window.clearTimeout(t);
  }, [stepSignals, activeIndex, isReady, stepCount]);

  useEffect(() => {
    let running = true;

    const tick = () => {
      if (!running) return;

      const now = Date.now();
      const dt = Math.min(32, now - lastFrameAt.current);
      lastFrameAt.current = now;

      if (!isReady && activeIndex < stepCount) {
        const prevEnd = activeIndex === 0 ? 0 : STEP_END_PROGRESS[activeIndex - 1] ?? 0;
        const nextEnd = STEP_END_PROGRESS[activeIndex] ?? 100;
        const signal = stepSignals[activeIndex] || { ready: false, partial: 0 };

        const partial = clamp(signal.partial ?? 0, 0, 1);
        const creep = timeCreep(stepStartedAt.current, signal.ready ? 0.95 : 0.72);
        const stepFrac = clamp(Math.max(partial * 0.65 + creep * 0.35, creep * 0.5), 0.04, 0.98);

        const ideal = lerp(prevEnd, nextEnd, stepFrac);
        targetProgress.current = Math.max(targetProgress.current, ideal);

        if (!signal.ready) {
          targetProgress.current = Math.min(targetProgress.current, nextEnd - 4);
        }
      }

      setDisplayProgress((prev) => {
        const target = targetProgress.current;
        const diff = target - prev;
        if (Math.abs(diff) < 0.15) return Math.round(target);
        const maxStep = 0.35 + dt * 0.045;
        const step = clamp(diff * 0.14, -maxStep, maxStep);
        return Math.round((prev + step) * 10) / 10;
      });

      smoothRafRef.current = requestAnimationFrame(tick);
    };

    smoothRafRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      if (smoothRafRef.current) cancelAnimationFrame(smoothRafRef.current);
    };
  }, [activeIndex, isReady, stepCount, stepSignals]);

  useEffect(() => {
    if (!isReady) return undefined;
    targetProgress.current = 100;
    const t = window.setInterval(() => {
      setDisplayProgress((p) => {
        if (p >= 100) return 100;
        return Math.min(100, p + 1);
      });
    }, 40);
    return () => window.clearInterval(t);
  }, [isReady]);

  return { progress: Math.min(100, Math.round(displayProgress)), stepStatuses, isReady };
}

export function LoadingStepsPanel({ stepSignals, syncMessage, onReadyChange }) {
  const { progress, stepStatuses, isReady } = useWelcomeLoadingSequence(stepSignals);

  useEffect(() => {
    onReadyChange?.(isReady);
  }, [isReady, onReadyChange]);

  const lastStepLoading = stepStatuses[LOADING_STEPS.length - 1] === 'loading';

  return (
    <div className="mb-6 min-h-[220px] space-y-4">
      <div>
        <div className="mb-2 flex items-center justify-between text-[11px]">
          <span className="font-medium text-slate-400">Préparation de l&apos;expérience</span>
          <span className="tabular-nums font-semibold text-sky-300">{progress}%</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 shadow-[0_0_12px_rgba(56,189,248,0.5)]"
            style={{
              width: `${progress}%`,
              transition: 'width 120ms linear'
            }}
          />
        </div>
      </div>

      <div className="max-h-[210px] space-y-2 overflow-y-auto pr-0.5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
        {LOADING_STEPS.map((step, i) => (
          <StepRow key={step.id} step={step} status={stepStatuses[i]} />
        ))}
      </div>

      {syncMessage && lastStepLoading && !isReady ? (
        <p className="text-center text-[11px] text-slate-500">{syncMessage}</p>
      ) : null}
    </div>
  );
}
