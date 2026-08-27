import React, { useMemo } from 'react';
import { Dumbbell, Edit, Trash2 } from 'lucide-react';
import StarRating from '../../../ui/StarRating';
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

export default function PushupSessionsHistory({ sessions = [], onEdit, onDelete }) {
  const t = useTranslation();
  const { formatEnduranceSessionDateOnly, formatEnduranceTime } = useFormatters();

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
      <div>
        <h3 className="mb-6 text-2xl font-bold text-white">{t('endurance.history.title')}</h3>
        <div className="rounded-2xl border border-[#0F4C5C]/50 bg-black p-12 text-center">
          <Dumbbell className="mx-auto mb-4 h-16 w-16 text-slate-600" />
          <p className="text-lg text-slate-400">{t('endurance.history.noSessions')}</p>
          <p className="mt-2 text-sm text-slate-500">{t('endurance.history.noSessionsHint')}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-2 text-2xl font-bold text-white">{t('endurance.history.title')}</h3>
      <p className="mb-6 text-sm text-slate-500">
        Même infos que le formulaire : séries × reps, durée, notes et ressenti.
      </p>
      <div className="space-y-8">
        {groups.map(([monthKey, items]) => (
          <section key={monthKey}>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-emerald-300/80">
              {monthLabel(items[0]?.date) || monthKey}
            </h4>
            <div className="space-y-3">
              {items.map((session, idx) => {
                const originalIndex = sessions.findIndex((s) => s === session);
                const total = resolvePushupSessionTotalReps(session);
                const sets = parsePositiveInt(session.setCount ?? session.sets);
                const per = parsePositiveInt(session.repsPerSet);
                const durationSec = resolveEnduranceDurationSeconds(session.duration);
                const durationLabel = durationSec > 0 ? formatMinSecLabel(durationSec, '') : '';
                const breakdown = formatPushupSessionBreakdown(session);
                const showTime = hasRecordedPushupSessionTime(session);
                const ratings = RATING_FIELDS.filter((f) => Number(session[f.key]) > 0);
                const notes = String(session.notes || '').trim();

                return (
                  <article
                    key={`pushups-${session.id}-${idx}`}
                    className="rounded-2xl border border-[#0F4C5C]/45 bg-black/80 p-4 hover:border-[#0F5C45]/55"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[11px] capitalize text-slate-500">{weekdayLabel(session.date)}</p>
                        <p className="text-lg font-bold text-white">
                          {formatEnduranceSessionDateOnly(session.date)}
                          {showTime ? (
                            <span className="ml-2 text-sm font-medium text-slate-400">
                              · {formatEnduranceTime(session.time)}
                            </span>
                          ) : null}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {session.validatedChallenges?.length > 0 && (
                          <span className="rounded-lg border border-green-500/30 bg-green-500/15 px-2 py-1 text-[11px] font-medium text-green-300">
                            {t('endurance.challenges.validated')}
                          </span>
                        )}
                        {session.recoveredFromWorkoutMirror && (
                          <span className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-200">
                            Depuis les coches
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => onEdit?.(session.id)}
                          className="rounded-lg border border-[#0F4C5C]/70 p-2 text-teal-100 hover:border-emerald-400/70"
                          title={t('endurance.session.edit')}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete?.(session.id, originalIndex)}
                          className="rounded-lg border border-red-900/50 p-2 text-red-300 hover:border-red-400/70"
                          title={t('endurance.session.delete')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-[#0F4C5C]/35 bg-[#0F4C5C]/10 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500">Total</p>
                        <p className="text-xl font-bold text-white">{total || '—'}</p>
                        <p className="text-[11px] text-slate-500">reps</p>
                      </div>
                      {sets > 0 && per > 0 ? (
                        <div className="rounded-xl border border-[#0F4C5C]/35 bg-[#0F4C5C]/10 px-3 py-2">
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">Séries × reps</p>
                          <p className="text-xl font-bold text-white">
                            {sets}×{per}
                          </p>
                          <p className="text-[11px] text-slate-500">{breakdown}</p>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-[#0F4C5C]/35 bg-[#0F4C5C]/10 px-3 py-2">
                          <p className="text-[10px] uppercase tracking-wide text-slate-500">Séries × reps</p>
                          <p className="text-sm text-slate-500">Non renseigné</p>
                        </div>
                      )}
                      <div className="rounded-xl border border-[#0F4C5C]/35 bg-[#0F4C5C]/10 px-3 py-2">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500">Durée</p>
                        {durationLabel ? (
                          <p className="text-lg font-semibold text-white">{durationLabel}</p>
                        ) : (
                          <p className="text-sm text-slate-500">Non renseignée</p>
                        )}
                      </div>
                    </div>

                    {notes ? (
                      <p className="mt-3 whitespace-pre-wrap rounded-xl border border-[#0F4C5C]/30 bg-black/40 px-3 py-2 text-sm text-slate-300">
                        {notes}
                      </p>
                    ) : null}

                    {ratings.length > 0 ? (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {ratings.map((field) => (
                          <StarRating
                            key={field.key}
                            label={field.label}
                            rating={Number(session[field.key]) || 0}
                            disabled
                            size="sm"
                          />
                        ))}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
