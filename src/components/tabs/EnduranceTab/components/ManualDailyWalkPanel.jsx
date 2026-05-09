import React, { useCallback, useMemo, useState } from 'react';
import { Footprints, Plus, Trash2, X } from 'lucide-react';
import {
  MANUAL_WALK_MAX_STEPS_PER_DAY,
  MANUAL_WALK_MAX_DISTANCE_KM,
  normalizeManualDailyWalkByDate
} from '../../../../utils/sport/manualDailyWalkUtils';
import { persistEnduranceData } from '../../../../services/endurance/enduranceDataService';
import { useTranslation } from '../../../../utils/translations';
import { useFormatters } from '../../../../utils/translations/formatters-hook';

function todayDateStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function ManualDailyWalkPanel({ currentData = {}, updateData }) {
  const t = useTranslation();
  const { formatDate } = useFormatters();
  const [showModal, setShowModal] = useState(false);
  const [dateStr, setDateStr] = useState(todayDateStr);
  const [stepsDraft, setStepsDraft] = useState('');
  const [kmDraft, setKmDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const rawMap = currentData?.enduranceData?.manualDailyWalkByDate;
  const entries = useMemo(() => {
    const n = normalizeManualDailyWalkByDate(rawMap);
    return Object.keys(n)
      .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))
      .map((k) => ({ date: k, ...n[k] }));
  }, [rawMap]);

  const resetForm = useCallback(() => {
    setDateStr(todayDateStr());
    setStepsDraft('');
    setKmDraft('');
    setError('');
  }, []);

  const persistMap = useCallback(
    async (nextMap, opts = { closeModal: true }) => {
      if (typeof updateData !== 'function') return;
      setSaving(true);
      try {
        await persistEnduranceData({
          currentData,
          patch: { manualDailyWalkByDate: nextMap },
          updateData
        });
        if (opts.closeModal) {
          setShowModal(false);
          resetForm();
        }
      } catch (e) {
        setError(t('endurance.manualDailyWalk.saveError'));
      } finally {
        setSaving(false);
      }
    },
    [currentData, updateData, resetForm, t]
  );

  const onSubmit = useCallback(async () => {
    setError('');
    const steps = Math.round(Number(String(stepsDraft).replace(/\s/g, '').replace(',', '.')));
    if (!Number.isFinite(steps) || steps < 1) {
      setError(t('endurance.manualDailyWalk.errorSteps'));
      return;
    }
    if (steps > MANUAL_WALK_MAX_STEPS_PER_DAY) {
      setError(t('endurance.manualDailyWalk.errorStepsMax', { max: MANUAL_WALK_MAX_STEPS_PER_DAY }));
      return;
    }
    let distanceKm;
    if (String(kmDraft).trim() !== '') {
      const km = Number(String(kmDraft).replace(',', '.'));
      if (!Number.isFinite(km) || km < 0) {
        setError(t('endurance.manualDailyWalk.errorKm'));
        return;
      }
      if (km > MANUAL_WALK_MAX_DISTANCE_KM) {
        setError(t('endurance.manualDailyWalk.errorKmMax', { max: MANUAL_WALK_MAX_DISTANCE_KM }));
        return;
      }
      if (km > 0) distanceKm = Math.round(km * 1000) / 1000;
    }

    const prev = normalizeManualDailyWalkByDate(currentData?.enduranceData?.manualDailyWalkByDate);
    const next = {
      ...prev,
      [dateStr]: {
        steps,
        ...(distanceKm != null ? { distanceKm } : {}),
        updatedAt: new Date().toISOString()
      }
    };

    await persistMap(next);
  }, [stepsDraft, kmDraft, dateStr, currentData, persistMap, t]);

  const removeDate = useCallback(
    async (ds) => {
      const prev = normalizeManualDailyWalkByDate(currentData?.enduranceData?.manualDailyWalkByDate);
      const next = { ...prev };
      delete next[ds];
      await persistMap(next, { closeModal: false });
    },
    [currentData, persistMap]
  );

  const card =
    'rounded-2xl border-2 border-[#0F4C5C]/55 bg-black p-5 shadow-lg shadow-black/30';

  return (
    <div className="space-y-4">
      <div className={card}>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-white">
              <Footprints className="h-6 w-6 text-emerald-400" />
              {t('endurance.manualDailyWalk.title')}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-teal-200/85">
              {t('endurance.manualDailyWalk.subtitle')}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {t('endurance.manualDailyWalk.limitsHint', {
                maxSteps: MANUAL_WALK_MAX_STEPS_PER_DAY,
                maxKm: MANUAL_WALK_MAX_DISTANCE_KM
              })}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-emerald-500/60 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-400/80 hover:bg-emerald-500/25"
          >
            <Plus className="h-4 w-4" />
            {t('endurance.manualDailyWalk.add')}
          </button>
        </div>

        {entries.length === 0 ? (
          <p className="rounded-xl border border-[#0F4C5C]/40 bg-black/40 py-8 text-center text-sm text-slate-500">
            {t('endurance.manualDailyWalk.empty')}
          </p>
        ) : (
          <ul className="divide-y divide-[#0F4C5C]/35 rounded-xl border border-[#0F4C5C]/40">
            {entries.map((row) => (
              <li
                key={row.date}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm text-teal-100"
              >
                <div>
                  <div className="font-medium text-white">{formatDate(row.date)}</div>
                  <div className="text-xs text-slate-400">
                    {row.steps.toLocaleString('fr-FR')} {t('endurance.manualDailyWalk.stepsUnit')}
                    {row.distanceKm != null && row.distanceKm > 0
                      ? ` · ${row.distanceKm.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} km`
                      : ''}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeDate(row.date)}
                  disabled={saving}
                  className="inline-flex items-center gap-1 rounded-lg border border-red-500/40 px-2 py-1 text-xs text-red-200 transition hover:bg-red-500/10 disabled:opacity-50"
                  aria-label={t('endurance.manualDailyWalk.delete')}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t('endurance.manualDailyWalk.delete')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showModal ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4">
          <div
            className="relative w-full max-w-md rounded-2xl border border-[#0F4C5C]/70 bg-black p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="manual-walk-modal-title"
          >
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="absolute right-3 top-3 rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white"
              aria-label={t('endurance.actions.cancel')}
            >
              <X className="h-5 w-5" />
            </button>
            <h4 id="manual-walk-modal-title" className="mb-4 pr-10 text-lg font-bold text-white">
              {t('endurance.manualDailyWalk.modalTitle')}
            </h4>
            <div className="space-y-4">
              <label className="block text-sm text-teal-100">
                {t('endurance.manualDailyWalk.fieldDate')}
                <input
                  type="date"
                  value={dateStr}
                  max={todayDateStr()}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#0F4C5C]/50 bg-black px-3 py-2 text-white"
                />
              </label>
              <label className="block text-sm text-teal-100">
                {t('endurance.manualDailyWalk.fieldSteps')}
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={MANUAL_WALK_MAX_STEPS_PER_DAY}
                  value={stepsDraft}
                  onChange={(e) => setStepsDraft(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#0F4C5C]/50 bg-black px-3 py-2 text-white"
                  placeholder="ex. 8420"
                />
              </label>
              <label className="block text-sm text-teal-100">
                {t('endurance.manualDailyWalk.fieldKmOptional')}
                <input
                  type="text"
                  inputMode="decimal"
                  value={kmDraft}
                  onChange={(e) => setKmDraft(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[#0F4C5C]/50 bg-black px-3 py-2 text-white"
                  placeholder="—"
                />
              </label>
              {error ? <p className="text-sm text-red-300">{error}</p> : null}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="rounded-lg border border-[#0F4C5C]/55 px-4 py-2 text-sm text-teal-100"
                >
                  {t('endurance.actions.cancel')}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={onSubmit}
                  className="rounded-lg border border-emerald-500/70 bg-emerald-600/25 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {saving ? '…' : t('endurance.actions.save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
