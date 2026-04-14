import React, { useCallback, useMemo, useState } from 'react';
import { Sparkles, AlertTriangle, Shield, ListChecks, Pencil } from 'lucide-react';
import Card, { CardContent, CardHeader, CardTitle } from '../../ui/Card';
import Button from '../../ui/Button';
import { CRAVING_TRIGGER_OPTIONS } from '../../../utils/addictionQuitHelpers';
import {
  buildRiskHypotheses,
  buildHeldStrategies,
  DEFAULT_CALMING_ACTION_KEYS,
  isoWeekKeyLocal,
} from '../../../utils/addictionQuitCopilot';

function labelTrigger(t, id) {
  const o = CRAVING_TRIGGER_OPTIONS.find((x) => x.id === id);
  return o ? t(o.labelKey) : id === '_none' ? t('addictionQuit.copilotTriggerUnknown') : id;
}

function labelBucket(t, b) {
  const k = `addictionQuit.bucket.${b}`;
  const s = t(k);
  return s === k ? b : s;
}

export default function AddictionQuitCopilotToday({ aq, onSaveData, t, todayStr }) {
  const risk = useMemo(() => buildRiskHypotheses(aq.cravingsByDay, 56, Date.now()), [aq.cravingsByDay]);
  const held = useMemo(() => buildHeldStrategies(aq.cravingsByDay, 56, Date.now()), [aq.cravingsByDay]);
  const custom = Array.isArray(aq.copilot?.customActions) ? aq.copilot.customActions : [];
  const [draftCustom, setDraftCustom] = useState(custom.join('\n'));
  const [editingActions, setEditingActions] = useState(false);
  const weekKey = isoWeekKeyLocal();
  const weekDone = !!(aq.weeklyReviewWeeks && aq.weeklyReviewWeeks[weekKey]);
  const dayPhrase = (aq.reflectionByDay && aq.reflectionByDay[todayStr]) || '';

  const saveCustomActions = useCallback(() => {
    const lines = draftCustom
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    onSaveData({
      ...aq,
      copilot: { ...aq.copilot, customActions: lines },
    });
    setEditingActions(false);
  }, [aq, draftCustom, onSaveData]);

  const setDayPhrase = (text) => {
    onSaveData({
      ...aq,
      reflectionByDay: { ...aq.reflectionByDay, [todayStr]: text },
    });
  };

  const markWeeklyDone = () => {
    onSaveData({
      ...aq,
      weeklyReviewWeeks: { ...aq.weeklyReviewWeeks, [weekKey]: true },
    });
  };

  return (
    <Card className="border-violet-500/35 bg-gradient-to-br from-violet-950/40 via-slate-900/90 to-slate-950/95">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg text-white">
          <Sparkles className="h-5 w-5 text-violet-300" />
          {t('addictionQuit.copilotTodayTitle')}
        </CardTitle>
        <p className="text-xs text-slate-400">{t('addictionQuit.copilotDisclaimer')}</p>
      </CardHeader>
      <CardContent className="space-y-5">
        <section className="rounded-lg border border-amber-500/25 bg-amber-950/15 p-3">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-100">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {t('addictionQuit.copilotRiskTitle')}
          </h3>
          {risk.length === 0 ? (
            <p className="text-sm text-slate-500">{t('addictionQuit.copilotRiskEmpty')}</p>
          ) : (
            <ul className="space-y-2 text-sm text-slate-200">
              {risk.slice(0, 3).map((r) => (
                <li key={r.pattern} className="rounded-md bg-slate-900/60 px-2 py-1.5">
                  <span className="text-amber-200/90">{t('addictionQuit.copilotHypothesis')}</span>{' '}
                  {labelTrigger(t, r.triggerId)} · {labelBucket(t, r.bucket)}
                  {r.hasPlace ? ` · ${t('addictionQuit.copilotWithPlace')}` : ''}
                  <span className="ml-1 text-xs text-slate-500">
                    ({t('addictionQuit.copilotSeenTimes', { n: String(r.count) })})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-emerald-500/25 bg-emerald-950/15 p-3">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-100">
            <Shield className="h-4 w-4 shrink-0" />
            {t('addictionQuit.copilotHeldTitle')}
          </h3>
          {held.length === 0 ? (
            <p className="text-sm text-slate-500">{t('addictionQuit.copilotHeldEmpty')}</p>
          ) : (
            <ul className="space-y-2 text-sm text-slate-200">
              {held.slice(0, 3).map((r) => (
                <li key={r.pattern} className="rounded-md bg-slate-900/60 px-2 py-1.5">
                  {labelTrigger(t, r.triggerId)} · {labelBucket(t, r.bucket)}
                  <span className="ml-1 text-xs text-emerald-300/90">
                    (~{r.avgIntensity.toFixed(1)}/10 · {t('addictionQuit.copilotHeldCount', { n: String(r.count) })})
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-lg border border-cyan-500/25 bg-slate-900/50 p-3">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-cyan-100">
            <ListChecks className="h-4 w-4 shrink-0" />
            {t('addictionQuit.copilotCalmTitle')}
          </h3>
          <ul className="mb-3 list-inside list-disc space-y-1 text-sm text-slate-200">
            {DEFAULT_CALMING_ACTION_KEYS.map((key) => (
              <li key={key}>{t(key)}</li>
            ))}
            {custom.map((line, i) => (
              <li key={`c-${i}`} className="text-cyan-100/90">
                {line}
              </li>
            ))}
          </ul>
          {editingActions ? (
            <div className="space-y-2">
              <textarea
                value={draftCustom}
                onChange={(e) => setDraftCustom(e.target.value)}
                rows={4}
                placeholder={t('addictionQuit.copilotCustomPlaceholder')}
                className="w-full rounded-lg border border-slate-600 bg-slate-950 px-2 py-2 text-sm text-white"
              />
              <div className="flex gap-2">
                <Button type="button" className="bg-cyan-600 hover:bg-cyan-500" onClick={saveCustomActions}>
                  {t('addictionQuit.save')}
                </Button>
                <Button type="button" variant="secondary" className="border-slate-600" onClick={() => setEditingActions(false)}>
                  {t('addictionQuit.cancel')}
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setDraftCustom(custom.join('\n'));
                setEditingActions(true);
              }}
              className="flex items-center gap-2 text-xs font-medium text-cyan-300 hover:text-cyan-200"
            >
              <Pencil className="h-3.5 w-3.5" />
              {t('addictionQuit.copilotEditActions')}
            </button>
          )}
        </section>

        <section className="rounded-lg border border-slate-600 bg-slate-950/50 p-3">
          <h3 className="mb-2 text-sm font-semibold text-white">{t('addictionQuit.reflectionDayTitle')}</h3>
          <textarea
            value={dayPhrase}
            onChange={(e) => setDayPhrase(e.target.value)}
            rows={2}
            placeholder={t('addictionQuit.reflectionDayPlaceholder')}
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-2 py-2 text-sm text-white"
          />
          <p className="mt-2 text-xs text-slate-500">{t('addictionQuit.reflectionDayXpHint')}</p>
        </section>

        <section className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-600 bg-slate-950/40 p-3">
          <div>
            <h3 className="text-sm font-semibold text-white">{t('addictionQuit.weeklyReviewTitle')}</h3>
            <p className="text-xs text-slate-500">{t('addictionQuit.weeklyReviewHint')}</p>
          </div>
          {weekDone ? (
            <span className="text-xs font-medium text-emerald-400">{t('addictionQuit.weeklyReviewDone')}</span>
          ) : (
            <Button type="button" className="bg-violet-600 hover:bg-violet-500 text-sm" onClick={markWeeklyDone}>
              {t('addictionQuit.weeklyReviewButton')}
            </Button>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
