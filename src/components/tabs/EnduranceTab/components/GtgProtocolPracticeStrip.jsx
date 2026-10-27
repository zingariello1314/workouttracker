import React from 'react';
import { GTG_DAY_FEEL_ORDER } from '../../../../services/endurance/gtgProtocolSignals';

const ZONE_STYLE = {
  minimal: 'border-slate-500/40 bg-slate-900/50 text-slate-300',
  conservative: 'border-emerald-500/45 bg-emerald-950/30 text-emerald-100',
  solid: 'border-sky-500/45 bg-sky-950/30 text-sky-100',
  demanding: 'border-amber-500/50 bg-amber-950/25 text-amber-100',
  classic: 'border-rose-500/45 bg-rose-950/25 text-rose-100'
};

const ZONE_COLOR = {
  minimal: 'var(--bone-3)',
  conservative: 'var(--t-cl)',
  solid: 'var(--t-ef)',
  demanding: 'var(--t-fract)',
  classic: 'var(--t-vit)'
};

function zoneColor(zone) {
  return ZONE_COLOR[zone] || ZONE_COLOR.conservative;
}

/**
 * Bandeau pratique aligné protocole : dose (RIR/%) éditable + signaux + ressenti.
 * Changer les reps ici = même config que Protocole / Aujourd’hui.
 * `part` : 'dose' (cartes de dose), 'feel' (ressenti du jour) ou 'all'.
 */
export default function GtgProtocolPracticeStrip({
  part = 'all',
  doses = [],
  dayFeel = null,
  onFeelChange,
  onRepsChange,
  saving = false,
  t
}) {
  const doseBlock =
    doses.length === 0 ? (
      <div className="empty">{t('endurance.gtg.protocolTrack.noExercises')}</div>
    ) : (
      <>
        <div className="dose">
          {doses.map((d) => {
            const pct = d.pctOfMax != null ? Math.max(0, Math.min(100, d.pctOfMax)) : 0;
            return (
              <article key={d.exerciseId}>
                <div className="tp">
                  <h3>{d.label}</h3>
                  <span className="lvl" style={{ '--c': zoneColor(d.zone) }}>
                    {t(`endurance.gtg.protocolTrack.zone.${d.zone}`)}
                  </span>
                </div>
                <div className="lab" style={{ marginTop: 16 }}>
                  {t('endurance.gtg.protocolTrack.repsLabel')}
                </div>
                <div className="dv">
                  <input
                    type="number"
                    min={1}
                    max={200}
                    disabled={saving || typeof onRepsChange !== 'function'}
                    value={d.repsPerSet || ''}
                    onChange={(e) => onRepsChange?.(d.exerciseId, e.target.value)}
                    aria-label={`${d.label} reps`}
                  />
                  <span className="m3 num">
                    / {d.maxReps || '—'} max
                    {d.pctOfMax != null ? ` · ${d.pctOfMax}%` : ''}
                    {d.rir != null ? ` · RIR ${d.rir}` : ''}
                  </span>
                </div>
                <div className="gauge">
                  <i style={{ width: `${pct}%` }} />
                </div>
                {(d.signals?.priority || []).length > 0 ? (
                  <div className="sg">
                    <span className="lab">Signaux</span>
                    <div className="chips">
                      {(d.signals?.priority || []).slice(0, 4).map((sig) => (
                        <span key={sig} className="chip">
                          {t(`endurance.gtg.protocolTrack.signal.${sig}`)}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </article>
            );
          })}
        </div>
        <p className="tiny" style={{ marginTop: 14 }}>
          {t('endurance.gtg.protocolTrack.repsFieldHint')}
        </p>
      </>
    );

  const feelBlock = (
    <div className="box pad">
      <span className="lab">{t('endurance.gtg.protocolTrack.feelTitle')}</span>
      <p className="tiny" style={{ margin: '8px 0 0' }}>
        {t('endurance.gtg.protocolTrack.feelHint')}
      </p>
      <div className="fl">
        {GTG_DAY_FEEL_ORDER.map((feel) => (
          <button
            key={feel}
            type="button"
            disabled={saving || typeof onFeelChange !== 'function'}
            onClick={() => onFeelChange?.(feel)}
            aria-pressed={dayFeel === feel}
          >
            {t(`endurance.gtg.protocolTrack.feel.${feel}`)}
          </button>
        ))}
      </div>
    </div>
  );

  if (part === 'dose') return doseBlock;
  if (part === 'feel') return feelBlock;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {doseBlock}
      {feelBlock}
    </div>
  );
}

export { ZONE_STYLE, zoneColor };
