import React from 'react';
import { Activity, Gauge } from 'lucide-react';
import { GTG_DAY_FEEL_ORDER } from '../../../../services/endurance/gtgProtocolSignals';

const ZONE_STYLE = {
  minimal: 'border-slate-500/40 bg-slate-900/50 text-slate-300',
  conservative: 'border-emerald-500/45 bg-emerald-950/30 text-emerald-100',
  solid: 'border-sky-500/45 bg-sky-950/30 text-sky-100',
  demanding: 'border-amber-500/50 bg-amber-950/25 text-amber-100',
  classic: 'border-rose-500/45 bg-rose-950/25 text-rose-100'
};

const FEEL_STYLE = {
  easy: 'border-emerald-500/50 bg-emerald-950/35 text-emerald-100',
  stable: 'border-sky-500/50 bg-sky-950/35 text-sky-100',
  drift: 'border-amber-500/50 bg-amber-950/30 text-amber-100',
  hard: 'border-rose-500/50 bg-rose-950/30 text-rose-100'
};

/**
 * Bandeau pratique aligné protocole : dose (RIR/%) + signaux + ressenti du jour.
 */
export default function GtgProtocolPracticeStrip({
  doses = [],
  dayFeel = null,
  onFeelChange,
  saving = false,
  t
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-teal-500/30 bg-gradient-to-br from-black via-slate-950 to-teal-950/25">
      <div className="border-b border-teal-500/20 px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="rounded-xl border border-teal-500/35 bg-teal-950/40 p-2.5">
            <Gauge className="h-5 w-5 text-teal-200" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-base font-semibold text-white">{t('endurance.gtg.protocolTrack.title')}</h4>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
              {t('endurance.gtg.protocolTrack.hint')}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-5 py-4">
        {doses.length === 0 ? (
          <p className="text-sm text-slate-500">{t('endurance.gtg.protocolTrack.noExercises')}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {doses.map((d) => (
              <div
                key={d.exerciseId}
                className="rounded-xl border border-slate-700/55 bg-black/50 p-3.5"
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="truncate text-sm font-medium text-white">{d.label}</div>
                  <span
                    className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                      ZONE_STYLE[d.zone] || ZONE_STYLE.conservative
                    }`}
                  >
                    {t(`endurance.gtg.protocolTrack.zone.${d.zone}`)}
                  </span>
                </div>
                <div className="mb-3 flex flex-wrap gap-2 text-[11px]">
                  <span className="rounded-md border border-violet-500/35 bg-violet-950/30 px-2 py-1 tabular-nums text-violet-100">
                    {d.repsPerSet}/{d.maxReps || '—'} · {d.pctOfMax != null ? `${d.pctOfMax}%` : '—'}
                  </span>
                  <span className="rounded-md border border-slate-600/60 bg-slate-900/60 px-2 py-1 tabular-nums text-slate-200">
                    RIR {d.rir != null ? d.rir : '—'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(d.signals?.priority || []).slice(0, 4).map((sig) => (
                    <span
                      key={sig}
                      className="rounded-full border border-teal-500/25 bg-teal-950/20 px-2 py-0.5 text-[10px] text-teal-100/90"
                    >
                      {t(`endurance.gtg.protocolTrack.signal.${sig}`)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-xl border border-slate-700/45 bg-slate-950/40 p-3.5">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-100">
            <Activity className="h-4 w-4 text-amber-300" />
            {t('endurance.gtg.protocolTrack.feelTitle')}
          </div>
          <p className="mb-3 text-[11px] text-slate-500">{t('endurance.gtg.protocolTrack.feelHint')}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {GTG_DAY_FEEL_ORDER.map((feel) => {
              const active = dayFeel === feel;
              return (
                <button
                  key={feel}
                  type="button"
                  disabled={saving || typeof onFeelChange !== 'function'}
                  onClick={() => onFeelChange?.(feel)}
                  className={`rounded-lg border px-2.5 py-2 text-center text-[11px] font-medium transition ${
                    active
                      ? FEEL_STYLE[feel]
                      : 'border-slate-700/60 bg-black/40 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                  }`}
                >
                  {t(`endurance.gtg.protocolTrack.feel.${feel}`)}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export { ZONE_STYLE };
