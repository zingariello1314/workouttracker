import React, { useMemo } from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { useTranslation } from '../../../../utils/translations';
import { useFormatters } from '../../../../utils/translations/formatters-hook';
import {
  formatPushupSessionBreakdown,
  hasRecordedPushupSessionTime,
  parsePositiveInt,
  resolvePushupSessionTotalReps
} from '../../../../services/endurance/pushupSessionUtils';
import {
  formatMinSecLabel,
  resolveEnduranceDurationSeconds
} from '../../../../utils/sport/durationInputUtils';

const RATING_FIELDS = [
  { key: 'congestion', label: 'Congestion' },
  { key: 'motivation', label: 'Motivation' },
  { key: 'sentimentAvant', label: 'Avant' },
  { key: 'sentimentApres', label: 'Après' }
];

function weekdayLabel(dateStr) {
  const m = String(dateStr || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return '';
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.toLocaleDateString('fr-FR', { weekday: 'long' });
}

function monthLabel(dateStr) {
  const m = String(dateStr || '').match(/^(\d{4})-(\d{2})/);
  if (!m) return '';
  return new Date(Number(m[1]), Number(m[2]) - 1, 1).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric'
  });
}

function dayNumber(dateStr) {
  const m = String(dateStr || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return '—';
  return String(Number(m[3]));
}

function monthYearLabel(dateStr) {
  const m = String(dateStr || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return '';
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric'
  });
}

function Pips({ n, cls }) {
  const value = Math.max(0, Math.min(5, Number(n) || 0));
  return (
    <span className={`pips ${cls || ''}`} aria-label={`${value} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <i key={i} className={i <= value ? 'on' : undefined} />
      ))}
    </span>
  );
}

export default function PushupSessionsHistory({ sessions = [], onEdit, onDelete }) {
  const t = useTranslation();
  const { formatEnduranceTime } = useFormatters();

  const sorted = useMemo(() => {
    const list = Array.isArray(sessions) ? [...sessions] : [];
    return list.sort((a, b) => {
      const da = String(a?.date || '');
      const db = String(b?.date || '');
      if (db !== da) return db.localeCompare(da);
      return String(b?.time || '').localeCompare(String(a?.time || ''));
    });
  }, [sessions]);

  const groups = useMemo(() => {
    const map = new Map();
    sorted.forEach((session) => {
      const mk = String(session?.date || '').slice(0, 7) || 'other';
      if (!map.has(mk)) map.set(mk, []);
      map.get(mk).push(session);
    });
    return [...map.entries()];
  }, [sorted]);

  if (sorted.length === 0) {
    return (
      <section>
        <div className="sec-h">
          <div>
            <h2>{t('endurance.history.title')}</h2>
          </div>
        </div>
        <div className="empty">
          <h3>{t('endurance.history.noSessions')}</h3>
          <p>{t('endurance.history.noSessionsHint')}</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="sec-h">
        <div>
          <h2>{t('endurance.history.title')}</h2>
          <p>Même infos que le formulaire : séries × reps, durée, notes et ressenti.</p>
        </div>
      </div>
      {groups.map(([monthKey, items], groupIdx) => (
        <div key={monthKey}>
          <div className="mh" style={groupIdx === 0 ? { paddingTop: 0 } : { paddingTop: 34, borderTop: '1px solid var(--rule)' }}>
            <h3>{monthLabel(items[0]?.date) || monthKey}</h3>
          </div>
          {items.map((session, idx) => {
            const originalIndex = sessions.findIndex((s) => s === session);
            const total = resolvePushupSessionTotalReps(session);
            const sets = parsePositiveInt(session.setCount ?? session.sets);
            const per = parsePositiveInt(session.repsPerSet);
            const durationSec = resolveEnduranceDurationSeconds(session.duration);
            const durationLabel = durationSec > 0 ? formatMinSecLabel(durationSec, '') : '';
            const breakdown = formatPushupSessionBreakdown(session);
            const showTime = hasRecordedPushupSessionTime(session);
            const notes = String(session.notes || '').trim();
            const pipCount = sets > 0 ? Math.min(12, sets) : 0;

            return (
              <article key={`pushups-${session.id}-${idx}`} className="ps">
                <div className="pd">
                  <span className="wd">{weekdayLabel(session.date)}</span>
                  <b className="num">{dayNumber(session.date)}</b>
                  <span className="my">{monthYearLabel(session.date)}</span>
                  {showTime ? (
                    <span className="tm">· {formatEnduranceTime(session.time)}</span>
                  ) : null}
                </div>
                <div className="pm">
                  <div>
                    <small>Total</small>
                    <b className="num">{total || '—'}</b>
                    <span>reps</span>
                  </div>
                  <div>
                    <small>Séries × reps</small>
                    {sets > 0 && per > 0 ? (
                      <>
                        <b className="num">
                          {sets}×{per}
                        </b>
                        <span>{breakdown}</span>
                        {pipCount > 0 ? (
                          <div className="sets">
                            {Array.from({ length: pipCount }).map((_, i) => (
                              <i key={i} />
                            ))}
                          </div>
                        ) : null}
                      </>
                    ) : (
                      <span>Non renseigné</span>
                    )}
                  </div>
                  <div>
                    <small>Durée</small>
                    {durationLabel ? <b className="num">{durationLabel}</b> : <span>Non renseignée</span>}
                  </div>
                </div>
                <div className="rt">
                  {RATING_FIELDS.map((field) => {
                    const n = Number(session[field.key]) || 0;
                    if (n <= 0) return null;
                    const cls =
                      field.key === 'sentimentAvant' ? 'avant' : field.key === 'sentimentApres' ? 'apres' : '';
                    return (
                      <div key={field.key}>
                        <div className="t">
                          <span>{field.label}</span>
                          <b className="num">{n}/5</b>
                        </div>
                        <Pips n={n} cls={cls} />
                      </div>
                    );
                  })}
                  {session.validatedChallenges?.length > 0 ? (
                    <span className="st">{t('endurance.challenges.validated')}</span>
                  ) : null}
                  {session.recoveredFromWorkoutMirror ? <span className="tiny">Depuis les coches</span> : null}
                </div>
                <div className="ra">
                  <button
                    type="button"
                    className="ib"
                    onClick={() => onEdit?.(session.id)}
                    title={t('endurance.session.edit')}
                    aria-label={t('endurance.session.edit')}
                  >
                    <Edit className="ic" />
                  </button>
                  <button
                    type="button"
                    className="ib del"
                    onClick={() => onDelete?.(session.id, originalIndex)}
                    title={t('endurance.session.delete')}
                    aria-label={t('endurance.session.delete')}
                  >
                    <Trash2 className="ic" />
                  </button>
                </div>
                {notes ? <p className="pnote" style={{ whiteSpace: 'pre-wrap' }}>{notes}</p> : null}
              </article>
            );
          })}
        </div>
      ))}
    </section>
  );
}
